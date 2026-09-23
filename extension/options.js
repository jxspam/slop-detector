document.addEventListener("DOMContentLoaded", () => {
  const highInput = document.getElementById("highThreshold");
  const mediumInput = document.getElementById("mediumThreshold");
  const relayInput = document.getElementById("relayUrl");
  const saveBtn = document.getElementById("save");
  const statusEl = document.getElementById("status");

  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(["highThreshold", "mediumThreshold", "relayUrl"], items => {
      if (items.highThreshold !== undefined) {
        highInput.value = items.highThreshold;
      }
      if (items.mediumThreshold !== undefined) {
        mediumInput.value = items.mediumThreshold;
      }
      if (items.relayUrl) {
        relayInput.value = items.relayUrl;
      }
    });
  }

  saveBtn.addEventListener("click", () => {
    const high = parseInt(highInput.value, 10) || 80;
    const medium = parseInt(mediumInput.value, 10) || 40;
    const relayUrl = relayInput.value.trim() || "http://127.0.0.1:3824";

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set({
        highThreshold: high,
        mediumThreshold: medium,
        relayUrl: relayUrl
      }, () => {
        statusEl.style.display = "block";
        setTimeout(() => {
          statusEl.style.display = "none";
        }, 2000);
      });
    } else {
      statusEl.style.display = "block";
      setTimeout(() => {
        statusEl.style.display = "none";
      }, 2000);
    }
  });
});
