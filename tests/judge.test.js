const assert = require("assert");
const {
  DEFAULT_THRESHOLDS,
  JEV_CRITERIA,
  buildJevRequest,
  parseScore,
  classifyBand,
  judgeCard
} = require("../extension/judge");

async function runTests() {
  console.log("Running judge.js unit tests...\n");
  let passed = 0;
  let failed = 0;

  function it(name, fn) {
    try {
      fn();
      console.log(`PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`FAIL: ${name}`);
      console.error(err);
      failed++;
    }
  }

  async function itAsync(name, fn) {
    try {
      await fn();
      console.log(`PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`FAIL: ${name}`);
      console.error(err);
      failed++;
    }
  }

  // 1. Request shape tests
  it("builds valid Jev score request shape with 1 question", () => {
    const text = "Testing tweet content";
    const req = buildJevRequest(text);
    assert.strictEqual(req.state, text);
    assert.strictEqual(req.model, "jev-latest");
    assert.ok(req.questions);
    assert.strictEqual(Object.keys(req.questions).length, 1);
    const q = req.questions.slop_score;
    assert.strictEqual(q.type, "score");
    assert.ok(typeof q.instructions === "string" && q.instructions.length > 0);
    assert.ok(Array.isArray(q.criteria));
    assert.strictEqual(q.criteria.length, 5);
  });

  // 2. Score parsing tests
  it("parses and normalizes scores accurately across 0 to 4 range", () => {
    assert.strictEqual(parseScore(0), 0);
    assert.strictEqual(parseScore(2), 50);
    assert.strictEqual(parseScore(4), 100);
    assert.strictEqual(parseScore(3.92), 98);
    assert.strictEqual(parseScore(1.65), 41);
    assert.strictEqual(parseScore(-1), 0);
    assert.strictEqual(parseScore(5), 100);
    assert.strictEqual(parseScore(null), 0);
    assert.strictEqual(parseScore(undefined), 0);
    assert.strictEqual(parseScore(NaN), 0);
  });

  // 3. Banding boundary tests
  it("bands correctly at exact boundary values", () => {
    // Under 40: untouched
    const low0 = classifyBand(0);
    assert.strictEqual(low0.band, "untouched");
    assert.strictEqual(low0.outline, false);
    assert.strictEqual(low0.badgeText, null);

    const low39 = classifyBand(39);
    assert.strictEqual(low39.band, "untouched");
    assert.strictEqual(low39.outline, false);

    // Boundary 40: check this outline
    const mid40 = classifyBand(40);
    assert.strictEqual(mid40.band, "check");
    assert.strictEqual(mid40.outline, true);
    assert.strictEqual(mid40.label, "CHECK THIS");
    assert.strictEqual(mid40.badgeText, null);

    const mid79 = classifyBand(79);
    assert.strictEqual(mid79.band, "check");
    assert.strictEqual(mid79.outline, true);

    // Boundary 80: likely AI slop badge
    const high80 = classifyBand(80);
    assert.strictEqual(high80.band, "slop");
    assert.strictEqual(high80.outline, false);
    assert.strictEqual(high80.label, "LIKELY AI SLOP");
    assert.strictEqual(high80.badgeText, "LIKELY AI SLOP 80");

    const high100 = classifyBand(100);
    assert.strictEqual(high100.band, "slop");
    assert.strictEqual(high100.badgeText, "LIKELY AI SLOP 100");
  });

  it("respects custom configurable thresholds", () => {
    const customThresholds = { high: 85, medium: 50 };
    assert.strictEqual(classifyBand(82, customThresholds).band, "check");
    assert.strictEqual(classifyBand(85, customThresholds).band, "slop");
    assert.strictEqual(classifyBand(48, customThresholds).band, "untouched");
    assert.strictEqual(classifyBand(50, customThresholds).band, "check");
  });

  // 4. Failure path tests
  await itAsync("returns untouched on empty or whitespace text without network call", async () => {
    let callCount = 0;
    const mockFetch = async () => {
      callCount++;
      return { status: 200, json: async () => ({}) };
    };

    const emptyResult = await judgeCard("", { fetchFn: mockFetch });
    assert.strictEqual(emptyResult.band, "untouched");
    assert.strictEqual(emptyResult.reason, "empty text");
    assert.strictEqual(callCount, 0);

    const whitespaceResult = await judgeCard("   \n\t  ", { fetchFn: mockFetch });
    assert.strictEqual(whitespaceResult.band, "untouched");
    assert.strictEqual(whitespaceResult.reason, "empty text");
    assert.strictEqual(callCount, 0);
  });

  await itAsync("handles missing key or 401 unauthorized gracefully", async () => {
    const mockFetch = async () => ({
      status: 401,
      json: async () => ({ error: "Unauthorized" })
    });

    const res = await judgeCard("A tweet to score", { fetchFn: mockFetch, maxRetries: 1 });
    assert.strictEqual(res.band, "untouched");
    assert.strictEqual(res.status, 401);
  });

  await itAsync("handles rate limit 429 with retry and backoff", async () => {
    let attempts = 0;
    const mockFetch = async () => {
      attempts++;
      if (attempts < 3) {
        return { status: 429, json: async () => ({ error: "Rate limited" }) };
      }
      return {
        status: 200,
        json: async () => ({
          score: 88,
          confidence: 0.95,
          model: "jev-1.13.0",
          rawScore: 3.52
        })
      };
    };

    const res = await judgeCard("Slop tweet", {
      fetchFn: mockFetch,
      maxRetries: 3
    });

    assert.strictEqual(attempts, 3);
    assert.strictEqual(res.band, "slop");
    assert.strictEqual(res.score, 88);
    assert.strictEqual(res.badgeText, "LIKELY AI SLOP 88");
  });

  await itAsync("leaves card untouched if max retries exceeded on 429", async () => {
    let attempts = 0;
    const mockFetch = async () => {
      attempts++;
      return { status: 429, json: async () => ({ error: "Rate limit sustained" }) };
    };

    const res = await judgeCard("Slop tweet", {
      fetchFn: mockFetch,
      maxRetries: 2
    });

    assert.strictEqual(attempts, 3);
    assert.strictEqual(res.band, "untouched");
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
