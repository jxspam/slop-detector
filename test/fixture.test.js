// Fixture test: deterministic, all three bands asserted against
// test/fixtures/feed.html. The Jev call is mocked through an injected transport;
// nothing here touches the network.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { scoreText } from '../extension/judge.js';

const fixturePath = fileURLToPath(new URL('./fixtures/feed.html', import.meta.url));
const markSource = fileURLToPath(new URL('../extension/mark.js', import.meta.url));

function loadFixture() {
  const dom = new JSDOM(readFileSync(fixturePath, 'utf8'), { url: 'https://x.com/home', runScripts: 'outside-only' });
  // Load the real painter (mark.js) into the fixture document.
  dom.window.eval(readFileSync(markSource, 'utf8'));
  return dom;
}

// Deterministic mock Jev: fixed scores per card.
const MOCK_SCORES = {
  'card-slop': 91,
  'card-borderline': 58,
  'card-human': 7
};

// One Jev question per card, fixed score per card text.
const TEXT_BY_ID = {
  'card-slop': 'generate 100 viral tweets',
  'card-borderline': '5 things every founder should know',
  'card-human': 'race condition in our websocket layer'
};
const SCORE_BY_STATE = (state) => {
  for (const [id, hint] of Object.entries(TEXT_BY_ID)) {
    if (state.includes(hint)) return MOCK_SCORES[id];
  }
  return 0;
};
const transport = async (_url, opts) => {
  const body = JSON.parse(opts.body);
  assert.equal(Object.keys(body.questions).length, 1, 'one Jev question per card');
  return { status: 200, json: { answers: { slop: { score: SCORE_BY_STATE(body.state) / 100 } } } };
};

const THRESHOLDS = { high: 80, medium: 40 };

describe('three card fixture', () => {
  test('each band lands exactly where it should', async () => {
    const dom = loadFixture();
    const { document } = dom.window;
    const cards = document.querySelectorAll('article[data-testid="tweet"]');
    assert.equal(cards.length, 3);

    for (const card of cards) {
      const text = card.querySelector('[data-testid="tweetText"]').textContent.trim();
      const score = await scoreText(text, transport);
      const result = dom.window.SlopMark.applyJudgment(card, score, THRESHOLDS);
      const id = card.id;

      if (id === 'card-slop') {
        assert.equal(result, 'slop');
        const badge = card.querySelector('.slop-detector-badge');
        assert.ok(badge, 'slop card has a badge');
        assert.equal(badge.textContent, 'LIKELY AI SLOP 91');
        assert.equal(badge.getAttribute('data-slop-score'), '91');
        assert.equal(card.style.outline, '', 'slop band is a badge, not an outline');
      } else if (id === 'card-borderline') {
        assert.equal(result, 'check');
        assert.equal(card.querySelector('.slop-detector-badge'), null, 'check band is not a badge');
        assert.match(card.style.outline, /dashed/);
      } else if (id === 'card-human') {
        assert.equal(result, 'clear');
        assert.equal(card.querySelector('.slop-detector-badge'), null, 'clear band untouched');
        assert.equal(card.style.outline, '', 'clear band untouched');
      }
    }
  });

  test('a failed judgment leaves the card exactly as it was', async () => {
    const dom = loadFixture();
    const { document } = dom.window;
    const card = document.getElementById('card-slop');
    const before = card.innerHTML;
    const failing = async () => ({ status: 429, json: {} });
    const score = await scoreText('any text', failing, { sleepFn: async () => {} });
    assert.equal(score, null);
    dom.window.SlopMark.applyJudgment(card, score, THRESHOLDS);
    assert.equal(card.innerHTML, before);
  });

  test('determinism: running the fixture twice gives the same result', async () => {
    const run = async () => {
      const dom = loadFixture();
      const out = [];
      for (const card of dom.window.document.querySelectorAll('article[data-testid="tweet"]')) {
        const text = card.querySelector('[data-testid="tweetText"]').textContent.trim();
        const score = await scoreText(text, transport);
        out.push([card.id, score, dom.window.SlopMark.applyJudgment(card, score, THRESHOLDS)]);
      }
      return out;
    };
    assert.deepEqual(await run(), await run());
  });
});