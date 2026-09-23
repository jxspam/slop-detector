importScripts("judge.js");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "JUDGE") {
    chrome.storage.sync.get(["highThreshold", "mediumThreshold", "relayUrl"], async (items) => {
      const thresholds = {
        high: items.highThreshold !== undefined ? Number(items.highThreshold) : 80,
        medium: items.mediumThreshold !== undefined ? Number(items.mediumThreshold) : 40
      };
      const relayUrl = items.relayUrl || "http://127.0.0.1:3824";

      try {
        const result = await judgeCard(message.text, { relayUrl, thresholds });
        sendResponse({ success: true, result });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    });
    return true;
  }
});
