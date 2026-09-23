import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildRequest, parseResponse, band, scoreText, DEFAULT_THRESHOLDS } from '../extension/judge.js';

describe('buildRequest', () => {
  test('one score question per card, never batched', () => {
    const req = buildRequest('hello world');
    assert.equal(req.state, 'hello world');
    assert.equal(req.model, 'jev-latest');
    const qIds = Object.keys(req.questions);
    assert.equal(qIds.length, 1);
    assert.equal(qIds[0], 'slop');
    assert.equal(req.questions.slop.type, 'score');
  });

  test('score question carries 0 and 100 anchors', () => {
    const { criteria } = buildRequest('x').questions.slop;
    assert.deepEqual(criteria.map((c) => c.score), [0, 100]);
  });
});

describe('parseResponse', () => {
  test('scales 0 to 1 score to 0 to 100', () => {
    assert.equal(parseResponse({ answers: { slop: { score: 0.85 } } }), 85);
    assert.equal(parseResponse({ answers: { slop: { score: 0 } } }), 0);
    assert.equal(parseResponse({ answers: { slop: { score: 1 } } }), 100);
  });

  test('throws on missing score', () => {
    assert.throws(() => parseResponse({ answers: {} }));
    assert.throws(() => parseResponse({}));
    assert.throws(() => parseResponse(null));
    assert.throws(() => parseResponse({ answers: { slop: { score: 'x' } } }));
  });
});

describe('band boundaries', () => {
  const t = DEFAULT_THRESHOLDS;
  test('39 is clear, 40 is check, 79 is check, 80 is slop, 100 is slop', () => {
    assert.equal(band(39, t), 'clear');
    assert.equal(band(40, t), 'check');
    assert.equal(band(79, t), 'check');
    assert.equal(band(80, t), 'slop');
    assert.equal(band(100, t), 'slop');
  });

  test('custom thresholds are honored', () => {
    assert.equal(band(50, { high: 60, medium: 45 }), 'check');
    assert.equal(band(60, { high: 60, medium: 45 }), 'slop');
    assert.equal(band(44, { high: 60, medium: 45 }), 'clear');
  });
});

describe('scoreText failure paths', () => {
  const ok = (score) => async () => ({ status: 200, json: { answers: { slop: { score } } } });

  test('empty text returns null without calling the transport', async () => {
    let called = 0;
    const transport = async () => { called++; return { status: 200, json: {} }; };
    assert.equal(await scoreText('', transport), null);
    assert.equal(await scoreText('   ', transport), null);
    assert.equal(await scoreText(null, transport), null);
    assert.equal(called, 0);
  });

  test('missing key (401) returns null, no retry storm', async () => {
    let called = 0;
    const transport = async () => { called++; return { status: 401, json: { detail: 'unauthorized' } }; };
    assert.equal(await scoreText('some post', transport), null);
    assert.equal(called, 1);
  });

  test('rate limit retries with backoff then returns null', async () => {
    let called = 0;
    const transport = async () => { called++; return { status: 429, json: {} }; };
    const sleeps = [];
    const score = await scoreText('some post', transport, { sleepFn: async (ms) => { sleeps.push(ms); } });
    assert.equal(score, null);
    assert.equal(called, 3);
    assert.deepEqual(sleeps, [250, 1000]);
  });

  test('retries a 503 then succeeds', async () => {
    let called = 0;
    const transport = async () => {
      called++;
      if (called === 1) return { status: 503, json: {} };
      return ok(0.42)();
    };
    assert.equal(await scoreText('some post', transport, { sleepFn: async () => {} }), 42);
    assert.equal(called, 2);
  });

  test('network throw retries then returns null', async () => {
    let called = 0;
    const transport = async () => { called++; throw new Error('offline'); };
    assert.equal(await scoreText('some post', transport, { sleepFn: async () => {} }), null);
    assert.equal(called, 3);
  });

  test('malformed 200 response returns null', async () => {
    const transport = async () => ({ status: 200, json: { answers: {} } });
    assert.equal(await scoreText('some post', transport, { sleepFn: async () => {} }), null);
  });

  test('success passes the trimmed text as state', async () => {
    let seenBody = null;
    const transport = async (_url, opts) => { seenBody = JSON.parse(opts.body); return ok(0.1)(); };
    await scoreText('  a post  ', transport);
    assert.equal(seenBody.state, 'a post');
    assert.equal(seenBody.questions.slop.type, 'score');
  });
});