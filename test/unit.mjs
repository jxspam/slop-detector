// Unit tests for the pure, DOM-free parts.  node --test test/unit.mjs
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRequest, parseResponse, verdictFor, judgeCandidates, DEFAULTS, MAX_CANDIDATES_PER_REQUEST,
} from "../src/typesafe.js";

test("buildRequest: one noul question per candidate over shared state", () => {
  const page = { host: "feed.example", title: "Feed" };
  const req = buildRequest({ page, candidates: [{ title: "a", text: "b" }, { title: "c", text: "d" }] });
  assert.equal(req.model, "jev-latest");
  assert.deepEqual(req.state, { page, candidates: [{ title: "a", text: "b" }, { title: "c", text: "d" }] });
  const keys = Object.keys(req.questions);
  assert.deepEqual(keys, ["slop_0", "slop_1"]);
  for (const q of Object.values(req.questions)) {
    assert.equal(q.type, "noul");
    assert.ok(q.instructions.includes("likely"), "instructions must hedge toward 'likely'");
    assert.ok(!/is ai-generated/i.test(q.instructions), "never say 'is AI-generated'");
  }
});

test("buildRequest: rejects empty and oversized batches", () => {
  assert.throws(() => buildRequest({ page: {}, candidates: [] }), /non-empty/);
  const tooMany = Array.from({ length: MAX_CANDIDATES_PER_REQUEST + 1 }, () => ({ text: "x" }));
  assert.throws(() => buildRequest({ page: {}, candidates: tooMany }), /at most/);
});

test("parseResponse: extracts per-candidate noul probabilities", () => {
  const body = { model: "jev-latest", answers: { slop_0: { type: "noul", noul: 0.93 }, slop_1: { type: "noul", noul: 0.42 } }, usage: { total: 2 } };
  const r = parseResponse(body, 2);
  assert.deepEqual(r.probabilities, [0.93, 0.42]);
  assert.equal(r.model, "jev-latest");
});

test("parseResponse: throws on missing or malformed answers", () => {
  assert.throws(() => parseResponse({ answers: {} }, 1), /missing noul answer for candidate 0/);
  assert.throws(
    () => parseResponse({ answers: { slop_0: { type: "noul", noul: "high" } } }, 1),
    /missing noul answer for candidate 0/,
  );
});

test("verdictFor: three tiers, code owns the action", () => {
  assert.equal(verdictFor(0.95), "high");
  assert.equal(verdictFor(DEFAULTS.highThreshold), "high"); // >= boundary
  assert.equal(verdictFor(0.7), "medium");
  assert.equal(verdictFor(DEFAULTS.mediumThreshold), "medium");
  assert.equal(verdictFor(0.1), "low");
  // custom thresholds (what the popup saves)
  assert.equal(verdictFor(0.75, { highThreshold: 0.7, mediumThreshold: 0.5 }), "high");
  assert.equal(verdictFor(0.5, { highThreshold: 0.7, mediumThreshold: 0.5 }), "medium");
  assert.equal(verdictFor(0.49, { highThreshold: 0.7, mediumThreshold: 0.5 }), "low");
});

test("judgeCandidates: batches into a single POST and maps answers", async () => {
  const calls = [];
  const fetchImpl = async (url, opts) => {
    calls.push({ url, opts });
    const payload = JSON.parse(opts.body);
    const answers = {};
    payload.state.candidates.forEach((_, i) => (answers[`slop_${i}`] = { type: "noul", noul: 0.5 }));
    return { ok: true, json: async () => ({ model: "jev-latest", answers, usage: {} }) };
  };
  const r = await judgeCandidates({ apiKey: "k", page: {}, candidates: [{ text: "a" }, { text: "b" }], fetchImpl });
  assert.equal(calls.length, 1, "one call per batch");
  assert.equal(calls[0].url, "https://api.typesafe.ai/v1/systemone");
  assert.equal(calls[0].opts.headers.Authorization, "Bearer k");
  assert.deepEqual(r.probabilities, [0.5, 0.5]);
});

test("judgeCandidates: no key → clear error", async () => {
  await assert.rejects(() => judgeCandidates({ apiKey: "", page: {}, candidates: [{ text: "a" }] }), /No TypeSafe API key/);
});