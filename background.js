const DEFAULT_RELAY_URL = "http://127.0.0.1:8787";
const judgmentHistory = [];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_HISTORY") {
    sendResponse({ history: judgmentHistory });
    return false;
  }

  if (message.type === "JUDGE") {
    chrome.storage.sync.get({ relayUrl: DEFAULT_RELAY_URL }, async (items) => {
      const relayUrl = items.relayUrl || DEFAULT_RELAY_URL;
      const endpoint = `${relayUrl}/judge`;

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: message.text,
            thresholds: message.thresholds
          })
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => "");
          sendResponse({ error: `Relay responded with status ${response.status}: ${errText}` });
          return;
        }

        const data = await response.json();
        judgmentHistory.push({
          text: message.text.slice(0, 100),
          score: data.score,
          band: data.band,
          latencyMs: data.latencyMs,
          model: data.model,
          timestamp: Date.now()
        });
        sendResponse(data);
      } catch (err) {
        sendResponse({ error: `Relay connection failed: ${err.message}` });
      }
    });

    return true;
  }
});
