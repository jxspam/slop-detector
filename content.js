const DEFAULT_CONFIG = {
  highThreshold: 80,
  checkThreshold: 40,
  colorHigh: "#FF3B30",
  colorCheck: "#FF9500",
  colorClean: "#34C759",
  relayUrl: "http://127.0.0.1:8787"
};

let currentConfig = { ...DEFAULT_CONFIG };

if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
  chrome.storage.sync.get(DEFAULT_CONFIG, (items) => {
    currentConfig = { ...DEFAULT_CONFIG, ...items };
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync") {
      for (const [key, value] of Object.entries(changes)) {
        currentConfig[key] = value.newValue;
      }
    }
  });
}

function extractTweetText(article) {
  const textEl = article.querySelector('[data-testid="tweetText"]');
  if (!textEl) {
    return "";
  }
  return textEl.innerText.trim();
}

async function requestJudgment(text) {
  const url = `${currentConfig.relayUrl}/judge`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      thresholds: {
        high: currentConfig.highThreshold,
        check: currentConfig.checkThreshold,
        colorHigh: currentConfig.colorHigh,
        colorCheck: currentConfig.colorCheck,
        colorClean: currentConfig.colorClean
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Relay error ${response.status}`);
  }

  return response.json();
}

function applyVerdict(article, result) {
  article.dataset.slopStatus = "judged";
  article.dataset.slopScore = String(result.score);
  article.dataset.slopBand = result.band;

  article.classList.add("slop-card-box");
  article.classList.remove("slop-band-badge", "slop-band-outline", "slop-band-clean");

  const existingBadge = article.querySelector(".slop-badge-container");
  if (existingBadge) {
    existingBadge.remove();
  }

  if (result.band === "badge") {
    article.classList.add("slop-band-badge");
    const color = currentConfig.colorHigh || "#FF3B30";
    article.style.boxShadow = `inset 0 0 0 3px ${color}`;

    const badge = document.createElement("div");
    badge.className = "slop-badge-container slop-loud-badge";

    const pill = document.createElement("div");
    pill.className = "slop-badge-pill";
    pill.style.background = color;
    pill.textContent = "AI SLOP";

    const footnote = document.createElement("div");
    footnote.className = "slop-badge-sub";
    footnote.style.color = color;
    footnote.textContent = `${result.score}% likely`;

    badge.appendChild(pill);
    badge.appendChild(footnote);
    article.appendChild(badge);
  } else if (result.band === "outline") {
    article.classList.add("slop-band-outline");
    const color = currentConfig.colorCheck || "#FF9500";
    article.style.boxShadow = `inset 0 0 0 3px ${color}`;

    const badge = document.createElement("div");
    badge.className = "slop-badge-container slop-quiet-badge";

    const pill = document.createElement("div");
    pill.className = "slop-badge-pill";
    pill.style.background = color;
    pill.textContent = "CHECK THIS";

    badge.appendChild(pill);
    article.appendChild(badge);
  } else if (result.band === "clean") {
    article.classList.add("slop-band-clean");
    const color = currentConfig.colorClean || "#34C759";
    article.style.boxShadow = `inset 0 0 0 2px ${color}`;
  }
}

async function processCard(article) {
  if (article.dataset.slopStatus) {
    return;
  }

  const text = extractTweetText(article);
  if (!text) {
    article.dataset.slopStatus = "ignored";
    return;
  }

  article.dataset.slopStatus = "pending";

  try {
    const verdict = await requestJudgment(text);
    applyVerdict(article, verdict);
  } catch (err) {
    article.dataset.slopStatus = "failed";
  }
}

const visibleObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      const article = entry.target;
      if (!article.dataset.slopStatus) {
        processCard(article);
      }
    }
  }
}, {
  rootMargin: "150px 0px"
});

function scanArticles(root = document) {
  const articles = root.querySelectorAll('article[data-testid="tweet"]');
  for (const article of articles) {
    if (!article.dataset.slopObserved) {
      article.dataset.slopObserved = "true";
      visibleObserver.observe(article);
    }
  }
}

const domObserver = new MutationObserver(() => {
  scanArticles();
});

function init() {
  scanArticles();
  domObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
