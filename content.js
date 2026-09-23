(() => {
  console.log("[Slop Detector] Initializing content script on x.com");

  const DEFAULT_OPTIONS = {
    relayUrl: "http://127.0.0.1:3000/api/judge",
    highThreshold: 80,
    checkThreshold: 40
  };

  let options = { ...DEFAULT_OPTIONS };
  const cardResults = new Map();
  const pendingIds = new Set();

  function loadOptions() {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get(DEFAULT_OPTIONS, (items) => {
        if (items) {
          options = { ...DEFAULT_OPTIONS, ...items };
          scanExistingCards();
        }
      });
    }
  }

  loadOptions();

  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes) => {
      for (const [key, change] of Object.entries(changes)) {
        if (key in options) {
          options[key] = change.newValue;
        }
      }
      scanExistingCards();
    });
  }

  function hashText(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }
    return `hash_${hash}`;
  }

  function getCardIdentifier(article) {
    const statusLink = article.querySelector('a[href*="/status/"]');
    if (statusLink) {
      const href = statusLink.getAttribute("href");
      const match = href.match(/\/status\/(\d+)/);
      if (match && match[1]) {
        return match[1];
      }
      return href;
    }
    const text = getCardText(article);
    if (text) {
      return hashText(text);
    }
    return null;
  }

  function getCardText(article) {
    const tweetTextEl = article.querySelector('[data-testid="tweetText"]');
    if (tweetTextEl) {
      return tweetTextEl.innerText.trim();
    }
    return "";
  }

  function createBadge(score) {
    const badge = document.createElement("div");
    badge.className = "slop-detector-badge";

    const dot = document.createElement("span");
    dot.className = "slop-detector-dot";

    const label = document.createElement("span");
    label.textContent = "LIKELY AI SLOP";

    const sep = document.createElement("span");
    sep.className = "slop-detector-sep";
    sep.textContent = "|";

    const scoreSpan = document.createElement("span");
    scoreSpan.className = "slop-detector-score";
    scoreSpan.textContent = `${score}%`;

    badge.appendChild(dot);
    badge.appendChild(label);
    badge.appendChild(sep);
    badge.appendChild(scoreSpan);

    return badge;
  }

  function sendJudgeRequest(text) {
    return new Promise((resolve, reject) => {
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage(
          {
            action: "judge",
            text,
            thresholds: {
              high: Number(options.highThreshold) || 80,
              check: Number(options.checkThreshold) || 40
            }
          },
          (response) => {
            if (chrome.runtime.lastError) {
              return reject(new Error(chrome.runtime.lastError.message));
            }
            if (response && response.success) {
              return resolve(response.data);
            }
            reject(new Error((response && response.error) || "Relay failure"));
          }
        );
      } else {
        fetch(options.relayUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            thresholds: {
              high: Number(options.highThreshold) || 80,
              check: Number(options.checkThreshold) || 40
            }
          })
        })
          .then((res) => res.json())
          .then(resolve)
          .catch(reject);
      }
    });
  }

  function applyResult(article, cardId) {
    if (!article || !article.isConnected) return;
    const result = cardResults.get(cardId);
    if (!result) return;

    const score = typeof result.score === "number" ? result.score : 0;
    const high = Number(options.highThreshold) || 80;
    const check = Number(options.checkThreshold) || 40;

    if (score >= high) {
      const tweetTextEl = article.querySelector('[data-testid="tweetText"]');
      if (tweetTextEl && !article.querySelector(".slop-detector-badge")) {
        const badge = createBadge(score);
        tweetTextEl.parentNode.insertBefore(badge, tweetTextEl);
      }
    } else if (score >= check) {
      if (!article.classList.contains("slop-detector-outline")) {
        article.classList.add("slop-detector-outline");
        article.setAttribute("title", "CHECK THIS");
      }
    }
  }

  async function evaluateCard(article) {
    const cardId = getCardIdentifier(article);
    if (!cardId || pendingIds.has(cardId) || cardResults.has(cardId)) {
      return;
    }

    const text = getCardText(article);
    if (!text || text.length < 15) {
      return;
    }

    pendingIds.add(cardId);

    try {
      const result = await sendJudgeRequest(text);
      cardResults.set(cardId, result);

      console.log(`[Slop Detector] Evaluated card ${cardId}: score ${result.score}, band ${result.band}, latency ${result.latencyMs}ms`);

      const liveArticle = (statusIdMatch(cardId) && document.querySelector(`a[href*="/status/${cardId}"]`)?.closest("article")) || article;
      applyResult(liveArticle, cardId);
    } catch (err) {
      console.warn(`[Slop Detector] Evaluation error for card ${cardId}:`, err.message);
    } finally {
      pendingIds.delete(cardId);
    }
  }

  function statusIdMatch(cardId) {
    return typeof cardId === "string" && /^\d+$/.test(cardId);
  }

  function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    return rect.bottom >= -200 && rect.top <= windowHeight + 400 && rect.height > 0;
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        observer.unobserve(entry.target);
        evaluateCard(entry.target);
      }
    }
  }, {
    rootMargin: "400px 0px"
  });

  function scanExistingCards() {
    const articles = document.querySelectorAll('article[data-testid="tweet"], article');
    for (const article of articles) {
      const cardId = getCardIdentifier(article);
      if (!cardId) continue;

      if (cardResults.has(cardId)) {
        applyResult(article, cardId);
      } else if (!pendingIds.has(cardId)) {
        if (isElementInViewport(article)) {
          evaluateCard(article);
        } else {
          observer.observe(article);
        }
      }
    }
  }

  let mutationTimeout = null;
  const mutationObserver = new MutationObserver(() => {
    if (!mutationTimeout) {
      mutationTimeout = setTimeout(() => {
        mutationTimeout = null;
        scanExistingCards();
      }, 100);
    }
  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  window.addEventListener("scroll", () => {
    scanExistingCards();
  }, { passive: true });

  scanExistingCards();
})();
