// background.js — MV3 service worker. The only component that talks to the
// TypeSafe API (avoids content-script CORS/host issues, centralizes the key).
// Receives {type:'judge', text} from the content script, returns
// {score100, confidence} or {error}.

import { judge } from './judge.js';

const CACHE_LIMIT = 500;
const scoreCache = new Map(); // text -> result, to avoid re-judging repeats

async function getApiKey() {
  const { typesafeApiKey } = await chrome.storage.local.get('typesafeApiKey');
  return typesafeApiKey || '';
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== 'judge') return false;

  (async () => {
    if (scoreCache.has(msg.text)) {
      sendResponse(scoreCache.get(msg.text));
      return;
    }
    try {
      const apiKey = await getApiKey();
      const result = await judge(msg.text, apiKey);
      if (scoreCache.size >= CACHE_LIMIT) {
        scoreCache.delete(scoreCache.keys().next().value);
      }
      scoreCache.set(msg.text, { ...result });
      sendResponse(result);
    } catch (err) {
      sendResponse({ error: String((err && err.message) || err) });
    }
  })();

  return true; // keep the message channel open for the async sendResponse
});
