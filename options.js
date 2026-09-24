const DEFAULTS = {
  highThreshold: 80,
  checkThreshold: 40,
  colorHigh: "#FF3B30",
  colorCheck: "#FF9500",
  colorClean: "#34C759",
  relayUrl: "http://127.0.0.1:8787"
};

function loadSettings() {
  chrome.storage.sync.get(DEFAULTS, (items) => {
    document.getElementById("highThreshold").value = items.highThreshold;
    document.getElementById("checkThreshold").value = items.checkThreshold;
    document.getElementById("colorHigh").value = items.colorHigh;
    document.getElementById("colorCheck").value = items.colorCheck;
    document.getElementById("colorClean").value = items.colorClean;
    document.getElementById("relayUrl").value = items.relayUrl;
  });
}

function saveSettings() {
  const highVal = parseInt(document.getElementById("highThreshold").value, 10);
  const checkVal = parseInt(document.getElementById("checkThreshold").value, 10);
  const colorHigh = document.getElementById("colorHigh").value;
  const colorCheck = document.getElementById("colorCheck").value;
  const colorClean = document.getElementById("colorClean").value;
  const relayUrl = document.getElementById("relayUrl").value.trim() || DEFAULTS.relayUrl;

  const settings = {
    highThreshold: Number.isNaN(highVal) ? DEFAULTS.highThreshold : highVal,
    checkThreshold: Number.isNaN(checkVal) ? DEFAULTS.checkThreshold : checkVal,
    colorHigh,
    colorCheck,
    colorClean,
    relayUrl
  };

  chrome.storage.sync.set(settings, () => {
    const status = document.getElementById("status");
    status.textContent = "Settings saved";
    setTimeout(() => {
      status.textContent = "";
    }, 2000);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  document.getElementById("save").addEventListener("click", saveSettings);
});
