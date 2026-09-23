const DEFAULTS = { typesafeApiKey: '', highThreshold: 80, mediumThreshold: 40 };

const $ = (id) => document.getElementById(id);

chrome.storage.local.get(DEFAULTS).then((cfg) => {
  $('apiKey').value = cfg.typesafeApiKey;
  $('highThreshold').value = cfg.highThreshold;
  $('mediumThreshold').value = cfg.mediumThreshold;
});

$('save').addEventListener('click', async () => {
  await chrome.storage.local.set({
    typesafeApiKey: $('apiKey').value.trim(),
    highThreshold: Number($('highThreshold').value) || DEFAULTS.highThreshold,
    mediumThreshold: Number($('mediumThreshold').value) || DEFAULTS.mediumThreshold,
  });
  $('status').textContent = 'Saved';
  setTimeout(() => ($('status').textContent = ''), 1500);
});
