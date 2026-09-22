// Content script: finds feed/article cards, describes them compactly, asks the
// service worker (→ TypeSafe Jev) which ones look like AI slop, and annotates.
//
// HARD RULE: never delete content. Annotate with confidence, never remove.
//   high   → "LIKELY AI SLOP" badge with the score
//   medium → subdued "CHECK THIS" outline
//   low    → untouched
//
// Division of labour (docs.typesafe.ai/concepts/how-to-build-with-system-one):
//   code   → card discovery, compact descriptions, batching, thresholds, DOM annotation
//   Jev    → the semantic judgment "does this look like AI slop?"
(() => {
  if (window.__slopDetectorLoaded) return;
  window.__slopDetectorLoaded = true;

  const DEFAULTS = {
    enabled: true,
    highThreshold: 0.85, // >= → LIKELY AI SLOP badge with score
    mediumThreshold: 0.6, // >= → CHECK THIS outline
    displayMode: "both", // "both" | "badge" | "outline"
  };
  const MAX_PER_BATCH = 30;
  const DEBOUNCE_MS = 600;
  const OWN_ATTR = "data-slop-detector"; // marks our own UI so it is never a candidate

  const settings = { ...DEFAULTS };
  let judged = new WeakSet();
  const pending = new Set();
  let timer = null;
  let busy = false;
  let flaggedOnPage = 0;
  let lastError = null;

  // ---------- card discovery (owned by code) ----------

  const CARD_SELECTOR = [
    "article",
    '[role="article"]',
    '[data-testid*="feed-item" i]',
    '[data-testid*="post" i]',
    '[class*="feed-item" i]',
    '[class*="feedItem" i]',
    '[class*="post-card" i]',
    '[class*="story-card" i]',
    '[class*="content-card" i]',
    '[class*="timeline-item" i]',
  ].join(",");

  const STOP_TAGS = new Set(["BODY", "HTML", "MAIN", "NAV", "HEADER", "FOOTER", "UL", "OL", "TABLE", "FORM"]);
  const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "HEAD", "META", "LINK", "TITLE", "SVG", "PATH"]);

  const area = (el) => {
    const r = el.getBoundingClientRect();
    return Math.max(0, r.width) * Math.max(0, r.height);
  };
  const viewportArea = () => {
    const w = window.innerWidth || document.documentElement.clientWidth || 0;
    const h = window.innerHeight || document.documentElement.clientHeight || 0;
    return Math.max(w * h, 800 * 600);
  };

  function isVisible(el) {
    if (!el.isConnected) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 60 || r.height < 40) return false;
    const cs = getComputedStyle(el);
    return cs.display !== "none" && cs.visibility !== "hidden";
  }

  function isOurs(el) {
    return !!el.closest?.(`[${OWN_ATTR}]`);
  }

  function looksLikeFeedCard(el) {
    // id/class tokens that suggest a feed/post container
    const hay = `${el.id} ${el.className?.baseVal ?? el.className}`.toLowerCase();
    return /(^|[^a-z])(feed|post|card|story|tweet|timeline|item|article)($|[^a-z])/.test(hay) ||
      CARD_SELECTOR.includes(el.tagName.toLowerCase());
  }

  function acceptable(el) {
    if (!el || el === document.body || el === document.documentElement) return false;
    if (SKIP_TAGS.has(el.tagName) || isOurs(el)) return false;
    if (judged.has(el)) return false;
    if (!isVisible(el)) return false;
    const text = (el.innerText || "").trim();
    if (text.length < 80) return false; // too little content to judge
    if (text.length > 3000) return false;
    if (area(el) > viewportArea() * 0.5) return false; // page shell, not a card
    if (el.querySelector("main, nav")) return false; // feed wrapper, not a card
    return true;
  }

  function collectCandidates(root) {
    const scope = root.nodeType === Node.ELEMENT_NODE ? root : document.body;
    if (!scope) return [];

    const raw = new Set();
    const bySelector = scope.matches?.(CARD_SELECTOR) ? [scope] : [];
    for (const el of [...bySelector, ...scope.querySelectorAll(CARD_SELECTOR)]) {
      if (acceptable(el)) raw.add(el);
    }
    // token scan for cards the selectors miss (custom feed markup)
    for (const el of scope.querySelectorAll("[id],[class]")) {
      if (acceptable(el) && looksLikeFeedCard(el)) raw.add(el);
    }
    if (acceptable(scope) && looksLikeFeedCard(scope)) raw.add(scope);

    // resolve: climb from a small hit to its containing card, then drop nested duplicates
    const resolved = new Set();
    for (const el of raw) resolved.add(climbToCard(el));
    const list = [...resolved];
    return list.filter((el) => {
      const outer = list.find((o) => o !== el && o.contains(el));
      return !outer || area(outer) > area(el) * 2; // keep inner when outer is much bigger
    }).filter((el) => {
      const inner = list.find((o) => o !== el && el.contains(o));
      return !inner || !(area(el) > area(inner) * 2);
    });
  }

  // Climb while the parent is still card-sized and doesn't look like a feed of many cards.
  function climbToCard(el) {
    let cur = el;
    for (let i = 0; i < 4; i++) {
      const p = cur.parentElement;
      if (!p || STOP_TAGS.has(p.tagName)) break;
      if (!acceptable(p)) break;
      const cardsInside = p.querySelectorAll(CARD_SELECTOR).length;
      if (cardsInside > 1) break; // parent is the feed, not a card
      cur = p;
    }
    return cur;
  }

  // ---------- describing a card as compact state for Jev ----------

  function hostOf(url) {
    try {
      return new URL(url, location.href).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  }

  function describe(el) {
    const pageHost = location.hostname.replace(/^www\./, "");
    const heading = el.querySelector("h1, h2, h3, h4, [role='heading']");
    const title = (heading?.innerText || "").replace(/\s+/g, " ").trim().slice(0, 140) || undefined;

    const text = (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 200) || undefined;

    const bylineEl = el.querySelector("[class*='author' i], [class*='byline' i], [rel='author'], [data-testid*='author' i]");
    const author = bylineEl ? (bylineEl.innerText || "").replace(/\s+/g, " ").trim().slice(0, 80) || undefined : undefined;

    const linkHosts = [];
    for (const a of el.querySelectorAll("a[href]")) {
      const host = hostOf(a.getAttribute("href"));
      if (host && !linkHosts.includes(host)) linkHosts.push(host);
      if (linkHosts.length >= 5) break;
    }
    const mainLinkHost = linkHosts[0] || undefined;
    const linksToOtherSites = linkHosts.some((h) => h !== pageHost && !h.endsWith("." + pageHost)) || undefined;

    // label words: small tag/badge text like "Sponsored", "Promoted", "Featured"
    const labelWords = [...el.querySelectorAll("span, small, div")]
      .map((n) => (n.childElementCount === 0 ? n.textContent.trim() : ""))
      .filter((t) => t && t.length <= 24 && /^(sponsored|promoted|paid partnership|featured|advertorial|ai-generated|newsletter)/i.test(t))
      .slice(0, 3);

    const c = {
      tag: el.tagName.toLowerCase(),
      role: el.getAttribute("role") || undefined,
      title,
      text,
      author,
      main_link_host: mainLinkHost,
      links_to_other_sites: linksToOtherSites,
      label_words: labelWords.length ? labelWords : undefined,
      is_heading_card: !!heading || undefined,
    };
    for (const k of Object.keys(c)) if (c[k] === undefined) delete c[k];
    return c;
  }

  // ---------- acting on judgments (annotate only — never remove) ----------

  // Pills live in one fixed overlay layer and track their card's rect, instead
  // of being anchored inside the card. React feeds (X) recycle card DOM on
  // scroll: pills anchored inside cards got orphaned, stacked up outside the
  // cards and blobbed together. In the layer, a pill dies with its card and
  // never participates in feed layout.
  const tracked = new Map(); // card element -> { pill }
  let layer = null;

  function ensureLayer() {
    if (layer && layer.isConnected) return layer;
    layer = document.createElement("div");
    layer.setAttribute(OWN_ATTR, "layer");
    layer.style.cssText = "position:fixed;inset:0;z-index:2147483646;pointer-events:none;";
    document.documentElement.appendChild(layer);
    return layer;
  }

  function pillCss(kind) {
    return kind === "high"
      ? "display:inline-block;padding:4px 10px;border-radius:999px;background:#7f1d1d;color:#fff;" +
          "font:bold 11px/1.4 system-ui,sans-serif;letter-spacing:.04em;white-space:nowrap;"
      : "display:inline-block;padding:2px 8px;border-radius:4px;border:1px solid #d97706;background:#fffbeb;color:#92400e;" +
          "font:600 10px/1.4 system-ui,sans-serif;letter-spacing:.06em;white-space:nowrap;";
  }

  function annotate(el, kind, p) {
    // the dashed outline marks the card itself (medium tier); pills float
    el.style.outline = kind === "medium" ? "2px dashed #d97706" : "";
    el.style.outlineOffset = kind === "medium" ? "2px" : "";
    el.setAttribute(OWN_ATTR, kind);

    const l = ensureLayer();
    let t = tracked.get(el);
    if (!t) {
      const pill = document.createElement("div");
      l.appendChild(pill);
      t = { pill };
      tracked.set(el, t);
    }
    t.pill.style.cssText = "position:absolute;left:-9999px;top:0;pointer-events:none;" + pillCss(kind);
    t.pill.textContent = kind === "high"
      ? `⚠ LIKELY AI SLOP · ${(p * 100).toFixed(0)}%`
      : `CHECK THIS · ${(p * 100).toFixed(0)}%`;
    const r = el.getBoundingClientRect();
    t.pill.style.left = Math.max(0, Math.min(r.left, innerWidth - t.pill.offsetWidth - 4)) + "px";
    t.pill.style.top = r.top + "px";
  }

  // Re-anchor pills to their cards; hide or drop pills whose card was
  // recycled, detached or collapsed by the feed's virtualization.
  function sweep() {
    for (const [el, t] of tracked) {
      if (!el.isConnected) {
        t.pill.remove();
        tracked.delete(el);
        continue;
      }
      const r = el.getBoundingClientRect();
      if (r.width < 40 || r.height < 40 || r.bottom < -60 || r.top > innerHeight + 60) {
        // recycled, collapsed, or scrolled out of view: no pill
        t.pill.style.display = "none";
      } else {
        t.pill.style.display = "";
        t.pill.style.left = Math.max(0, Math.min(r.left, innerWidth - t.pill.offsetWidth - 4)) + "px";
        t.pill.style.top = r.top + "px";
      }
    }
    if (layer && !tracked.size) {
      layer.remove();
      layer = null;
    }
  }
  setInterval(sweep, 400);
  addEventListener("scroll", sweep, { passive: true });
  addEventListener("resize", sweep);

  function act(el, verdict, p) {
    if (!el.isConnected) return false;
    let kind = null;
    if (verdict === "high") kind = settings.displayMode === "outline" ? "medium" : "high";
    else if (verdict === "medium" && settings.displayMode !== "badge") kind = "medium";
    if (!kind) return false;
    annotate(el, kind, p);
    console.debug("[slop-detector]", verdict, p.toFixed(2), el);
    return true;
  }

  async function flush() {
    timer = null;
    if (busy) {
      schedule();
      return;
    }
    if (!settings.enabled) {
      pending.clear();
      return;
    }
    const els = [...pending].filter(acceptable).slice(0, MAX_PER_BATCH);
    els.forEach((el) => pending.delete(el));
    if (pending.size) pending.forEach((el) => !acceptable(el) && pending.delete(el));
    if (!els.length) return;

    busy = true;
    try {
      els.forEach((el) => judged.add(el));
      const candidates = els.map(describe);
      const page = { host: location.hostname, title: (document.title || "").slice(0, 120) };
      const res = await chrome.runtime.sendMessage({ type: "judge", page, candidates });
      if (!res || res.error) {
        lastError = res?.error ?? "No response from the service worker";
        console.warn("[slop-detector]", lastError);
        return;
      }
      lastError = null;
      let hits = 0;
      res.probabilities.forEach((p, i) => {
        if (act(els[i], verdictFor(p, res), p)) hits++;
      });
      if (hits) {
        flaggedOnPage += hits;
        chrome.runtime.sendMessage({ type: "flagged", count: hits }).catch(() => {});
      }
    } catch (err) {
      lastError = err?.message ?? String(err);
      console.warn("[slop-detector]", err);
    } finally {
      busy = false;
      if (pending.size) schedule();
    }
  }

  function verdictFor(p, thresholds = {}) {
    const high = thresholds.highThreshold ?? settings.highThreshold;
    const medium = thresholds.mediumThreshold ?? settings.mediumThreshold;
    if (p >= high) return "high";
    if (p >= medium) return "medium";
    return "low";
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(flush, DEBOUNCE_MS);
  }

  function scan(root = document.body) {
    if (!root) return;
    for (const el of collectCandidates(root)) pending.add(el);
    if (pending.size) schedule();
  }

  // ---------- wiring ----------

  const observer = new MutationObserver((mutations) => {
    if (!settings.enabled) return;
    for (const m of mutations) {
      if (m.type === "childList") {
        for (const n of m.addedNodes) if (n.nodeType === Node.ELEMENT_NODE && !isOurs(n)) scan(n);
      } else if (m.type === "attributes" && m.target.nodeType === Node.ELEMENT_NODE && !isOurs(m.target)) {
        scan(m.target);
      }
    }
  });

  function start() {
    scan(document.body);
    observer.observe(document.documentElement, {
      childList: true, subtree: true, attributes: true, attributeFilter: ["class", "id", "style"],
    });
    let scrollT = null;
    addEventListener("scroll", () => {
      clearTimeout(scrollT);
      scrollT = setTimeout(() => scan(document.body), 400);
    }, { passive: true });
  }

  chrome.storage.sync.get(DEFAULTS).then((s) => {
    Object.assign(settings, s);
    if (document.readyState === "loading") addEventListener("DOMContentLoaded", start, { once: true });
    else start();
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync") return;
    for (const [k, { newValue }] of Object.entries(changes)) if (k in DEFAULTS) settings[k] = newValue;
    if (changes.enabled?.newValue) scan(document.body);
  });

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === "getStats") {
      sendResponse({ flaggedOnPage, pending: pending.size, lastError });
    } else if (msg?.type === "rescan") {
      judged = new WeakSet();
      scan(document.body);
      sendResponse({ ok: true, pending: pending.size });
    }
    return false;
  });
})();