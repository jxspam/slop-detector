// Content script: watches the X feed, scores each card with one Jev question,
// paints the overlay via SlopMark (mark.js). Wording is always "likely AI slop".
(async () => {
  const DEFAULTS = { high: 80, medium: 40 };
  let thresholds = { ...DEFAULTS };

  try {
    const stored = await chrome.storage.sync.get(DEFAULTS);
    thresholds = { ...DEFAULTS, ...stored };
  } catch (err) { void err; }

  chrome.storage.onChanged.addListener((changes) => {
    for (const key of ['high', 'medium']) {
      if (changes[key] && typeof changes[key].newValue === 'number') {
        thresholds[key] = changes[key].newValue;
      }
    }
  });

  const MARKED = new WeakSet();
  const INFLIGHT = new WeakSet();

  function extractText(article) {
    const nodes = article.querySelectorAll('[data-testid="tweetText"]');
    if (nodes.length === 0) return '';
    return nodes[0].textContent.trim();
  }

  async function judgeCard(article) {
    if (MARKED.has(article) || INFLIGHT.has(article)) return;
    const text = extractText(article);
    if (!text) return; // empty judgment: the card stays exactly as it was
    INFLIGHT.add(article);
    let score = null;
    try {
      const reply = await chrome.runtime.sendMessage({ type: 'slop:score', text });
      score = reply && typeof reply.score === 'number' ? reply.score : null;
    } catch (err) {
      void err; // failed judgment: the card stays exactly as it was
    }
    INFLIGHT.delete(article);
    MARKED.add(article);
    SlopMark.applyJudgment(article, score, thresholds);
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) judgeCard(entry.target);
    }
  }, { rootMargin: '100px' });

  function watch(root) {
    root.querySelectorAll('article[data-testid="tweet"]').forEach((article) => {
      observer.observe(article);
    });
  }

  watch(document);
  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (node.matches && node.matches('article[data-testid="tweet"]')) {
          observer.observe(node);
        } else if (node.querySelectorAll) {
          node.querySelectorAll('article[data-testid="tweet"]').forEach((article) => {
            observer.observe(article);
          });
        }
      });
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });
})();