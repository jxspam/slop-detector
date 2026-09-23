// Service worker: receives score requests from the content script and forwards
// them to the local relay. The API key stays server side, in the relay process.
import { scoreText } from './judge.js';

const RELAY_URL = 'http://127.0.0.1:8787/score';

const transport = async (url, options) => {
  const res = await fetch(RELAY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: options.body
  });
  let json = null;
  try { json = await res.json(); } catch (err) { void err; }
  return { status: res.status, json };
};

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== 'slop:score' || typeof msg.text !== 'string') return false;
  scoreText(msg.text, transport).then((score) => {
    sendResponse({ score });
  }).catch(() => {
    sendResponse({ score: null });
  });
  return true; // async sendResponse
});