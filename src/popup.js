const $ = (id) => document.getElementById(id);

chrome.storage.sync.get({ enabled: true, highThreshold: 0.85, mediumThreshold: 0.6, displayMode: "both" }).then((s) => {
  $("enabled").checked = s.enabled;
  $("high").value = s.highThreshold;
  $("medium").value = s.mediumThreshold;
  $("mode").value = s.displayMode;
});

$("save").addEventListener("click", async () => {
  const high = Number($("high").value);
  const medium = Number($("medium").value);
  if (!(high > medium)) {
    $("status").textContent = "High threshold must be above medium.";
    return;
  }
  await chrome.storage.sync.set({
    enabled: $("enabled").checked,
    highThreshold: high,
    mediumThreshold: medium,
    displayMode: $("mode").value,
  });
  $("status").textContent = "Saved.";
  setTimeout(() => ($("status").textContent = ""), 1500);
});

$("test").addEventListener("click", async () => {
  $("status").textContent = "Testing key…";
  try {
    const res = await chrome.runtime.sendMessage({ type: "testKey" });
    if (res.error) throw new Error(res.error);
    $("status").textContent = `OK: ${res.models.join(", ")}`;
  } catch (err) {
    $("status").textContent = `Failed: ${err.message}`;
  }
});