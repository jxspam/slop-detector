// MV3 service worker: holds the API key, talks to TypeSafe, keeps the badge.

import { DEFAULTS, judgeCandidates, listModels } from "./typesafe.js";

const flaggedCounts = new Map(); // tabId -> cards flagged on the current page

async function setBadge(tabId, count) {
  const text = count > 0 ? String(count) : "";
  try {
    await chrome.action.setBadgeBackgroundColor({ tabId, color: "#b45309" });
    await chrome.action.setBadgeText({ tabId, text });
  } catch {
    // tab may be gone
  }
}

chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status === "loading") {
    flaggedCounts.delete(tabId);
    setBadge(tabId, 0);
  }
});
chrome.tabs.onRemoved.addListener((tabId) => flaggedCounts.delete(tabId));

const handlers = {
  async judge(msg) {
    const { apiKey, ...rest } = await chrome.storage.sync.get({ apiKey: "" });
    const t0 = performance.now();
    const result = await judgeCandidates({ apiKey, page: msg.page, candidates: msg.candidates });
    return { ...result, ...rest, latencyMs: Math.round(performance.now() - t0) };
  },

  async flagged(msg, sender) {
    const tabId = sender.tab?.id;
    if (tabId != null) {
      const next = (flaggedCounts.get(tabId) ?? 0) + msg.count;
      flaggedCounts.set(tabId, next);
      await setBadge(tabId, next);
    }
    return { ok: true };
  },

  async testKey() {
    const { apiKey } = await chrome.storage.sync.get({ apiKey: "" });
    const models = await listModels({ apiKey });
    return { models: models.map((m) => m.name) };
  },
};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const handler = handlers[msg?.type];
  if (!handler) {
    sendResponse({ error: `Unknown message type: ${msg?.type}` });
    return false;
  }
  handler(msg, sender)
    .then(sendResponse)
    .catch((err) => sendResponse({ error: err?.message ?? String(err) }));
  return true; // keep the channel open for the async response
});