const DEFAULT_OPTIONS = {
  relayUrl: "http://127.0.0.1:3000/api/judge",
  highThreshold: 80,
  checkThreshold: 40
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "judge") {
    chrome.storage.sync.get(DEFAULT_OPTIONS, (items) => {
      const relayUrl = (items && items.relayUrl) || DEFAULT_OPTIONS.relayUrl;
      const high = (items && items.highThreshold) || DEFAULT_OPTIONS.highThreshold;
      const check = (items && items.checkThreshold) || DEFAULT_OPTIONS.checkThreshold;

      fetch(relayUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: request.text,
          thresholds: {
            high,
            check
          }
        })
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Relay error ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          sendResponse({ success: true, data });
        })
        .catch((err) => {
          sendResponse({ success: false, error: err.message });
        });
    });

    return true;
  }
});
