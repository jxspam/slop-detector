(function () {
  const processedCards = new WeakSet();

  function requestJudge(text) {
    return new Promise((resolve) => {
      if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.sendMessage) {
        resolve({ band: "untouched" });
        return;
      }
      chrome.runtime.sendMessage({ type: "JUDGE", text }, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ band: "untouched", error: chrome.runtime.lastError.message });
        } else if (response && response.success) {
          resolve(response.result);
        } else {
          resolve({ band: "untouched", error: response?.error });
        }
      });
    });
  }

  async function processCard(article) {
    if (processedCards.has(article) || article.dataset.slopProcessed === "true") {
      return;
    }
    processedCards.add(article);
    article.dataset.slopProcessed = "true";

    const tweetTextEl = article.querySelector('[data-testid="tweetText"]');
    if (!tweetTextEl) {
      return;
    }

    const text = tweetTextEl.innerText.trim();
    if (!text) {
      return;
    }

    try {
      const result = await requestJudge(text);
      if (!result) return;

      const roundedScore = Math.round(result.score);
      console.info(`[Slop Detector] Post evaluated: score=${roundedScore} band=${result.band} text="${text.slice(0, 40).replace(/\n/g, ' ')}..."`);

      if (result.band === "untouched") {
        return;
      }

      if (result.band === "slop") {
        // High band (>= 80): compact pill badge
        const existingBadge = article.querySelector(".slop-detector-badge-container");
        if (!existingBadge) {
          const container = document.createElement("div");
          container.className = "slop-detector-badge-container";

          const badge = document.createElement("span");
          badge.className = "slop-detector-badge";

          const dot = document.createElement("span");
          dot.className = "slop-detector-dot";

          const textSpan = document.createElement("span");
          textSpan.textContent = `LIKELY AI SLOP ${roundedScore}`;

          badge.appendChild(dot);
          badge.appendChild(textSpan);
          container.appendChild(badge);

          tweetTextEl.insertAdjacentElement("afterend", container);
        }
      } else if (result.band === "check") {
        // Medium band (40-79): check this outline
        article.classList.add("slop-detector-check");
      }
    } catch (err) {
      // Unhandled errors leave the card untouched
    }
  }

  function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    return rect.top < windowHeight + 300 && rect.bottom > -300;
  }

  const visibilityObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        processCard(entry.target);
      }
    }
  }, {
    rootMargin: "200px 0px 200px 0px",
    threshold: 0
  });

  function scanExistingCards() {
    const articles = document.querySelectorAll('article[data-testid="tweet"], article');
    for (const article of articles) {
      if (!processedCards.has(article) && article.dataset.slopProcessed !== "true") {
        if (isElementInViewport(article)) {
          processCard(article);
        } else {
          visibilityObserver.observe(article);
        }
      }
    }
  }

  let scrollTimeout = null;
  window.addEventListener("scroll", () => {
    if (scrollTimeout) return;
    scrollTimeout = setTimeout(() => {
      scrollTimeout = null;
      scanExistingCards();
    }, 150);
  }, { passive: true });

  const domObserver = new MutationObserver(() => {
    scanExistingCards();
  });

  domObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  scanExistingCards();
})();
