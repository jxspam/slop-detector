const DEFAULTS = { high: 80, medium: 40 };
const els = { high: document.getElementById('high'), medium: document.getElementById('medium') };
const status = document.getElementById('status');

chrome.storage.sync.get(DEFAULTS).then((stored) => {
  els.high.value = stored.high;
  els.medium.value = stored.medium;
});

document.getElementById('save').addEventListener('click', () => {
  const high = Number(els.high.value);
  const medium = Number(els.medium.value);
  if (!Number.isFinite(high) || !Number.isFinite(medium) || high <= medium || high < 1 || high > 100 || medium < 0 || medium > 99) {
    status.textContent = 'High must be above medium, both 0 to 100.';
    return;
  }
  chrome.storage.sync.set({ high, medium }).then(() => {
    status.textContent = 'Saved.';
    setTimeout(() => { status.textContent = ''; }, 2000);
  });
});