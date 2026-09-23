// mark.js: paints judgments onto a feed card. Additive only: overlays are
// appended or an outline color is set. Nothing is hidden, removed or reordered.
// Loaded as a classic content script before content.js; exposes globalThis.SlopMark.
(() => {
  const BADGE_CLASS = 'slop-detector-badge';

  function applyJudgment(article, score, thresholds) {
    if (!article) return 'clear';
    clearJudgment(article);

    if (typeof score !== 'number') return 'clear';

    let bandResult;
    if (score >= thresholds.high) bandResult = 'slop';
    else if (score >= thresholds.medium) bandResult = 'check';
    else return 'clear';

    if (bandResult === 'slop') {
      const badge = article.ownerDocument.createElement('div');
      badge.className = BADGE_CLASS;
      badge.textContent = 'LIKELY AI SLOP ' + score;
      badge.setAttribute('data-slop-score', String(score));
      badge.style.cssText =
        'display:inline-block;margin:4px 0;padding:3px 10px;border-radius:999px;' +
        "background:#b91c1c;color:#ffffff;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;" +
        'font-size:12px;font-weight:700;letter-spacing:0.04em;cursor:default;z-index:10;';
      article.insertBefore(badge, article.firstChild);
    } else {
      // Medium confidence: an outline, not a badge, not a verdict.
      article.style.outline = '2px dashed #d97706';
      article.style.outlineOffset = '4px';
      article.style.borderRadius = '16px';
    }
    return bandResult;
  }

  function clearJudgment(article) {
    if (!article) return;
    article.querySelectorAll('.' + BADGE_CLASS).forEach((el) => el.remove());
    article.style.outline = '';
    article.style.outlineOffset = '';
    article.style.borderRadius = '';
  }

  globalThis.SlopMark = { applyJudgment, clearJudgment, BADGE_CLASS };
})();