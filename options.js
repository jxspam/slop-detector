document.addEventListener("DOMContentLoaded", () => {
  const highInput = document.getElementById("highThreshold");
  const checkInput = document.getElementById("checkThreshold");
  const relayInput = document.getElementById("relayUrl");
  const saveBtn = document.getElementById("saveBtn");
  const status = document.getElementById("status");

  const DEFAULTS = {
    highThreshold: 80,
    checkThreshold: 40,
    relayUrl: "http://127.0.0.1:3000/api/judge"
  };

  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(DEFAULTS, (items) => {
      highInput.value = items.highThreshold;
      checkInput.value = items.checkThreshold;
      relayInput.value = items.relayUrl;
    });
  }

  saveBtn.addEventListener("click", () => {
    const highVal = parseInt(highInput.value, 10);
    const checkVal = parseInt(checkInput.value, 10);
    const relayVal = relayInput.value.trim();

    if (isNaN(highVal) || isNaN(checkVal) || !relayVal) {
      status.textContent = "Invalid settings values";
      status.style.color = "#f4212e";
      return;
    }

    const payload = {
      highThreshold: highVal,
      checkThreshold: checkVal,
      relayUrl: relayVal
    };

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set(payload, () => {
        status.textContent = "Settings saved";
        status.style.color = "#00ba7c";
        setTimeout(() => {
          status.textContent = "";
        }, 2000);
      });
    } else {
      status.textContent = "Settings saved";
      status.style.color = "#00ba7c";
    }
  });
});
