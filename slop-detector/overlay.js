// overlay.js — applies a Jev verdict to a feed card. Additive only:
// high band gets a badge, medium gets a CHECK THIS outline, low leaves
// the card untouched. Nothing is ever hidden or removed.

import { band } from './judge.js';

function applyVerdict(article, result) {
  if (!result || result.error || typeof result.score100 !== 'number') return;
  const verdict = band(result.score100);
  if (verdict === 'low') return; // untouched, per PRD

  article.classList.add('slop-reviewed');
  if (verdict === 'high') {
    const badge = article.ownerDocument.createElement('div');
    badge.className = 'slop-badge';
    badge.textContent = `LIKELY AI SLOP · ${result.score100}`;
    article.appendChild(badge);
  } else {
    article.classList.add('slop-medium');
    article.setAttribute('title', `CHECK THIS — slop score ${result.score100}`);
  }
}

export { applyVerdict };
