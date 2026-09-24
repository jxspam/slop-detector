const test = require("node:test");
const assert = require("node:assert/strict");
const {
  DEFAULT_MODEL,
  CRITERIA_LEVELS,
  DEFAULT_INSTRUCTIONS,
  buildEvaluationRequest,
  parseEvaluationResponse,
  determineBand,
  judgeCard
} = require("./judge.js");

test("buildEvaluationRequest constructs valid payload", () => {
  const req = buildEvaluationRequest("  Sample tweet text  ");
  assert.equal(req.state, "Sample tweet text");
  assert.equal(req.model, DEFAULT_MODEL);
  assert.ok(req.questions.slop_score);
  assert.equal(req.questions.slop_score.type, "score");
  assert.equal(req.questions.slop_score.instructions, DEFAULT_INSTRUCTIONS);
  assert.deepEqual(req.questions.slop_score.criteria, CRITERIA_LEVELS);
});

test("buildEvaluationRequest throws on empty text", () => {
  assert.throws(() => buildEvaluationRequest(""), /Empty text/);
  assert.throws(() => buildEvaluationRequest("   "), /Empty text/);
  assert.throws(() => buildEvaluationRequest(null), /Empty text/);
});

test("parseEvaluationResponse normalizes score to percentage", () => {
  const mockResp = {
    model: "jev-1.13.0",
    answers: {
      slop_score: {
        type: "score",
        score: 1.6,
        confidence: 0.95
      }
    }
  };
  const parsed = parseEvaluationResponse(mockResp, 3);
  assert.equal(parsed.score, 80);
  assert.equal(parsed.rawScore, 1.6);
  assert.equal(parsed.confidence, 0.95);
  assert.equal(parsed.model, "jev-1.13.0");
});

test("parseEvaluationResponse handles boundary limits", () => {
  const minResp = {
    model: "jev-1.13.0",
    answers: { slop_score: { type: "score", score: 0.0, confidence: 1.0 } }
  };
  assert.equal(parseEvaluationResponse(minResp, 3).score, 0);

  const maxResp = {
    model: "jev-1.13.0",
    answers: { slop_score: { type: "score", score: 2.0, confidence: 1.0 } }
  };
  assert.equal(parseEvaluationResponse(maxResp, 3).score, 100);
});

test("parseEvaluationResponse throws on invalid formats", () => {
  assert.throws(() => parseEvaluationResponse(null), /Invalid response format/);
  assert.throws(() => parseEvaluationResponse({}), /Invalid response format/);
  assert.throws(() => parseEvaluationResponse({ answers: {} }), /Invalid response format/);
  assert.throws(() => parseEvaluationResponse({ answers: { slop_score: { score: "bad" } } }), /Missing or invalid score/);
});

test("determineBand assigns correct bands at boundary points", () => {
  assert.equal(determineBand(100).band, "badge");
  assert.equal(determineBand(80).band, "badge");
  assert.equal(determineBand(80).label, "AI SLOP");
  assert.equal(determineBand(80).borderWidth, "3px");

  assert.equal(determineBand(79).band, "outline");
  assert.equal(determineBand(79).label, "CHECK THIS");
  assert.equal(determineBand(79).borderWidth, "3px");

  assert.equal(determineBand(40).band, "outline");
  assert.equal(determineBand(40).label, "CHECK THIS");

  assert.equal(determineBand(39).band, "clean");
  assert.equal(determineBand(39).label, "");
  assert.equal(determineBand(39).borderWidth, "2px");

  assert.equal(determineBand(0).band, "clean");
});

test("judgeCard validates inputs", async () => {
  await assert.rejects(
    () => judgeCard("hello", ""),
    /Missing API key/
  );
  await assert.rejects(
    () => judgeCard("   ", "valid-key"),
    /Empty text/
  );
});

test("judgeCard performs successful call and parsing", async () => {
  const mockFetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      model: "jev-1.13.0",
      answers: {
        slop_score: {
          type: "score",
          score: 1.8,
          confidence: 0.92
        }
      }
    })
  });

  const res = await judgeCard("test content", "test-key", mockFetch);
  assert.equal(res.score, 90);
  assert.equal(res.band, "badge");
  assert.equal(res.label, "AI SLOP");
  assert.equal(res.model, "jev-1.13.0");
  assert.ok(res.latencyMs >= 0);
});

test("judgeCard retries on 429 rate limit then succeeds", async () => {
  let callCount = 0;
  const mockFetch = async () => {
    callCount++;
    if (callCount === 1) {
      return { ok: false, status: 429, statusText: "Too Many Requests" };
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
            confidence: 0.88
          }
        }
      })
    };
  };

  const res = await judgeCard("test content", "test-key", mockFetch, {
    maxRetries: 2,
    initialBackoffMs: 10
  });

  assert.equal(callCount, 2);
  assert.equal(res.score, 10);
  assert.equal(res.band, "clean");
});

test("judgeCard throws after exhausting retries on 429", async () => {
  const mockFetch = async () => ({
    ok: false,
    status: 429,
    statusText: "Too Many Requests"
  });

  await assert.rejects(
    () => judgeCard("test", "test-key", mockFetch, { maxRetries: 1, initialBackoffMs: 5 }),
    /Rate limit exceeded \(429\) after 1 retries/
  );
});

test("judgeCard throws on non-retryable 401 error", async () => {
  const mockFetch = async () => ({
    ok: false,
    status: 401,
    text: async () => "Unauthorized access"
  });

  await assert.rejects(
    () => judgeCard("test", "bad-key", mockFetch, { maxRetries: 1, initialBackoffMs: 5 }),
    /API error 401: Unauthorized access/
  );
});
