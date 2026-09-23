const test = require("node:test");
const assert = require("node:assert/strict");
const {
  DEFAULT_MODEL,
  CRITERIA_LEVELS,
  buildEvaluationRequest,
  parseEvaluationResponse,
  determineBand,
  judgeCard
} = require("./judge.js");

test("buildEvaluationRequest constructs valid Jev System One request", () => {
  const req = buildEvaluationRequest("This is a test post about mindset.");
  assert.equal(req.model, DEFAULT_MODEL);
  assert.equal(req.state, "This is a test post about mindset.");
  assert.ok(req.questions.slop_score);
  assert.equal(req.questions.slop_score.type, "score");
  assert.equal(req.questions.slop_score.criteria.length, CRITERIA_LEVELS.length);
});

test("buildEvaluationRequest trims whitespace and rejects empty text", () => {
  assert.throws(() => buildEvaluationRequest(""), /Empty text/);
  assert.throws(() => buildEvaluationRequest("   "), /Empty text/);
  assert.throws(() => buildEvaluationRequest(null), /Empty text/);
});

test("parseEvaluationResponse normalizes scores across criteria levels", () => {
  const mockResponse = {
    model: "jev-1.13.0",
    answers: {
      slop_score: {
        type: "score",
        score: 1.8,
        confidence: 0.92,
        legend: { "0": "Original", "1": "Mixed", "2": "Slop" },
        probabilities: { "0": 0.0, "1": 0.1, "2": 0.9 }
      }
    }
  };

  const parsed = parseEvaluationResponse(mockResponse);
  assert.equal(parsed.score, 90);
  assert.equal(parsed.rawScore, 1.8);
  assert.equal(parsed.confidence, 0.92);
  assert.equal(parsed.model, "jev-1.13.0");
});

test("parseEvaluationResponse throws on malformed answer format", () => {
  assert.throws(() => parseEvaluationResponse({}), /Invalid response format/);
  assert.throws(() => parseEvaluationResponse({ answers: {} }), /Invalid response format/);
  assert.throws(
    () => parseEvaluationResponse({ answers: { slop_score: { type: "score" } } }),
    /Missing or invalid score/
  );
});

test("determineBand enforces exact threshold boundaries", () => {
  assert.equal(determineBand(80).band, "badge");
  assert.equal(determineBand(80).label, "LIKELY AI SLOP");
  assert.equal(determineBand(100).band, "badge");

  assert.equal(determineBand(79).band, "outline");
  assert.equal(determineBand(79).label, "CHECK THIS");
  assert.equal(determineBand(40).band, "outline");
  assert.equal(determineBand(40).label, "CHECK THIS");

  assert.equal(determineBand(39).band, "none");
  assert.equal(determineBand(39).label, "");
  assert.equal(determineBand(0).band, "none");
});

test("judgeCard rejects missing API key", async () => {
  await assert.rejects(
    async () => {
      await judgeCard("Some post", "");
    },
    /Missing API key/
  );
});

test("judgeCard handles successful evaluation flow", async () => {
  const mockFetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      model: "jev-1.13.0",
      answers: {
        slop_score: {
          type: "score",
          score: 1.7,
          confidence: 0.88
        }
      }
    })
  });

  const res = await judgeCard("Motivational buzzword thread", "fake_key", mockFetch);
  assert.equal(res.score, 85);
  assert.equal(res.band, "badge");
  assert.equal(res.label, "LIKELY AI SLOP");
  assert.equal(res.model, "jev-1.13.0");
  assert.ok(res.latencyMs >= 0);
});

test("judgeCard retries on HTTP 429 rate limit then succeeds", async () => {
  let calls = 0;
  const mockFetch = async () => {
    calls++;
    if (calls === 1) {
      return { ok: false, status: 429 };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        model: "jev-1.13.0",
        answers: {
          slop_score: {
            type: "score",
            score: 0.2,
            confidence: 0.95
          }
        }
      })
    };
  };

  const res = await judgeCard("Casual original tweet", "fake_key", mockFetch, { initialBackoffMs: 10 });
  assert.equal(calls, 2);
  assert.equal(res.score, 10);
  assert.equal(res.band, "none");
});

test("judgeCard fails when rate limit exceeds maxRetries", async () => {
  const mockFetch = async () => ({ ok: false, status: 429 });
  await assert.rejects(
    async () => {
      await judgeCard("Text", "fake_key", mockFetch, { maxRetries: 2, initialBackoffMs: 5 });
    },
    /Rate limit exceeded \(429\)/
  );
});
