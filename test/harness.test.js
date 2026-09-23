// harness.test.js — DOM harness. Loads the three-card fixture in jsdom,
// installs the real content.js against it with a stubbed chrome relay
// (verdicts mirroring the live-API banding), and asserts: high card gets
// the LIKELY AI SLOP badge with score, medium card gets the CHECK THIS
// outline, low card is left completely untouched.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = readFileSync(join(here, 'fixtures', 'feed.html'), 'utf8');

const VERDICTS = {
  '/someuser/status/111': { score100: 93, confidence: 0.91 }, // high
  '/someuser/status/222': { score100: 55, confidence: 0.62 }, // medium
  '/someuser/status/333': { score100: 12, confidence: 0.88 }, // low
};

before(async () => {
  const dom = new JSDOM(fixture, { url: 'https://x.com/home' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.MutationObserver = dom.window.MutationObserver;
  globalThis.chrome = {
    runtime: {
      sendMessage: async (msg) =>
        new Promise((resolve) => {
          // Resolve the permalink the way the background relay would.
          const permalink = Object.keys(VERDICTS).find((p) => {
            // The content script passes only text; map by text presence.
            return true;
          });
          resolve(VERDICTS[msg.__fixturePermalink] || { error: 'no verdict' });
        }),
    },
  };
  // Map fixture permalinks onto messages via a side channel: content.js
  // sends {type:'judge', text}. The harness stub looks the text up.
  const texts = {};
  dom.window.document.querySelectorAll('article').forEach((a) => {
    const link = a.querySelector('a[href*="/status/"]').getAttribute('href').match(/\/[^/]+\/status\/\d+/)[0];
    texts[a.querySelector('[data-testid="tweetText"]').textContent.trim()] = link;
  });
  globalThis.chrome.runtime.sendMessage = async (msg) => {
    const link = texts[msg.text];
    return (link && VERDICTS[link]) || { error: 'no verdict' };
  };

  // Run the real content script against the fixture DOM.
  await import('../slop-detector/content.js');
  // Give the async judgeCard promises a moment to settle.
  await new Promise((r) => setTimeout(r, 50));
});

test('high-band card gets the LIKELY AI SLOP badge with the score', () => {
  const card = document.querySelector('[data-testid="fixture-high"]');
  const badge = card.querySelector('.slop-badge');
  assert.ok(badge, 'expected a slop badge');
  assert.match(badge.textContent, /^LIKELY AI SLOP · 93$/);
});

test('medium-band card gets the CHECK THIS outline', () => {
  const card = document.querySelector('[data-testid="fixture-medium"]');
  assert.ok(card.classList.contains('slop-medium'), 'expected the medium outline class');
  assert.match(card.getAttribute('title'), /CHECK THIS — slop score 55/);
  assert.equal(card.querySelector('.slop-badge'), null, 'medium card must not get a badge');
});

test('low-band card is left completely untouched', () => {
  const card = document.querySelector('[data-testid="fixture-low"]');
  assert.equal(card.querySelector('.slop-badge'), null);
  assert.equal(card.classList.contains('slop-medium'), false);
  assert.equal(card.classList.contains('slop-reviewed'), false);
  // Original content unchanged: text element still the only child set.
  assert.ok(card.querySelector('[data-testid="tweetText"]'));
});

test('each card is judged only once (permalink dedupe)', () => {
  // The second scan pass should not append duplicate badges.
  const card = document.querySelector('[data-testid="fixture-high"]');
  const badges = card.querySelectorAll('.slop-badge');
  assert.equal(badges.length, 1);
});

test('no feed content is hidden or removed anywhere in the fixture', () => {
  document.querySelectorAll('article').forEach((card) => {
    assert.ok(card.querySelector('[data-testid="tweetText"]'), 'tweet text must survive');
    assert.ok(card.querySelector('a[href*="/status/"]'), 'permalink link must survive');
  });
});
