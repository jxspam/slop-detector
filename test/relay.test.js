// relay.test.js — the content -> background -> Jev -> content relay.
// Loads the real background.js service worker with stubbed chrome APIs and
// exercises the message handler, including a REAL call to the TypeSafe API
// authenticated with the actual key in TYPESAFE_API_KEY.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';

// Stub the chrome APIs background.js needs, before importing it.
const listeners = [];
globalThis.chrome = {
  storage: {
    local: {
      get: async (keys) =>
        typeof keys === 'object' && !Array.isArray(keys)
          ? { ...keys, typesafeApiKey: process.env.TYPESAFE_API_KEY }
          : { typesafeApiKey: process.env.TYPESAFE_API_KEY },
    },
  },
  runtime: {
    onMessage: { addListener: (fn) => listeners.push(fn) },
  },
};

// Faked response capture: sendMessage stands in for the content-script side.
let lastHandler = null;
const sendMessage = (msg) =>
  new Promise((resolve) => {
    lastHandler(msg, null, resolve);
  });

before(() => {
  return import('../slop-detector/background.js').then(() => {
    assert.equal(listeners.length, 1, 'background.js registers exactly one listener');
    lastHandler = listeners[0];
  });
});

const HIGH_SLOP_TEXT =
  "🚀 THREAD: In today's fast-paced digital landscape, success isn't just about working hard — it's about working smart. Here are 7 mind-blowing lessons that changed my life forever (number 4 will shock you!). I started from nothing. No money. No connections. Just a dream and relentless hustle. 1. Your network is your net worth... 2. Consistency beats talent... 3. Embrace failure as feedback... 4. ... 5. ... 6. ... 7. If this resonated with you, follow for more and retweet the first tweet to help someone else on their journey! 💫 #growth #mindset #success";

test('relay returns a real Jev verdict for the high-slop fixture (live API)', async () => {
  const res = await sendMessage({ type: 'judge', text: HIGH_SLOP_TEXT });
  assert.equal(res.error, undefined, `unexpected relay error: ${res.error}`);
  assert.ok(Number.isInteger(res.score100) && res.score100 >= 0 && res.score100 <= 100);
  assert.ok(res.confidence === null || (res.confidence >= 0 && res.confidence <= 1));
  // The blatant-slop fixture should land in the high band on the real model.
  assert.ok(res.score100 >= 80, `expected high band, got ${res.score100}`);
});

test('relay caches repeat texts without changing the answer', async () => {
  const a = await sendMessage({ type: 'judge', text: HIGH_SLOP_TEXT });
  const b = await sendMessage({ type: 'judge', text: HIGH_SLOP_TEXT });
  assert.deepEqual(a, b);
});

test('relay reports errors instead of throwing (bad key)', async () => {
  // Simulate a missing key by clearing the storage stub for this call.
  const saved = process.env.TYPESAFE_API_KEY;
  delete process.env.TYPESAFE_API_KEY;
  globalThis.chrome.storage.local.get = async () => ({ typesafeApiKey: '' });
  const res = await sendMessage({ type: 'judge', text: 'anything' });
  process.env.TYPESAFE_API_KEY = saved;
  assert.ok(res.error, 'expected an error result, not a throw');
});
