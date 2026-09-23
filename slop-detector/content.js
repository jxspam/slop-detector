// content.js — observes the X timeline, extracts post text, asks the
// background service worker to judge each card via Jev, and overlays the
// result. Additive only: badges/outline are appended; nothing is ever
// hidden, removed, or reordered.

import { applyVerdict } from './overlay.js';

const SELECTORS = {
  column: '[data-testid="primaryColumn"]',
  article: 'article',
  text: '[data-testid="tweetText"]',
  link: 'a[href*="/status/"]',
};

const seen = new Set(); // permalinks already judged

function cardPermalink(article) {
  const a = article.querySelector(SELECTORS.link);
  if (!a) return null;
  const m = a.getAttribute('href').match(/\/[^/]+\/status\/\d+/);
  return m ? m[0] : null;
}

function cardText(article) {
  const el = article.querySelector(SELECTORS.text);
  return el ? el.textContent.trim() : '';
}

async function judgeCard(article) {
  const permalink = cardPermalink(article);
  if (!permalink || seen.has(permalink)) return;
  seen.add(permalink);

  const text = cardText(article);
  if (!text) return;

  let result;
  try {
    result = await chrome.runtime.sendMessage({ type: 'judge', text });
  } catch {
    return; // relay failure: leave the card untouched
  }
  applyVerdict(article, result);
}

function scan(root = document) {
  const column = root.querySelector(SELECTORS.column);
  if (!column) return;
  column.querySelectorAll(SELECTORS.article).forEach(judgeCard);
}

function start() {
  scan();
  const observer = new MutationObserver(() => scan());
  const attach = () => {
    const column = document.querySelector(SELECTORS.column);
    if (column) observer.observe(column, { childList: true, subtree: true });
    else setTimeout(attach, 500);
  };
  attach();
}

start();