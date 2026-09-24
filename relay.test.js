const test = require("node:test");
const assert = require("node:assert/strict");
const { server } = require("./relay.js");

test("relay responds to health check and CORS", async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const corsRes = await fetch(`${baseUrl}/health`, { method: "OPTIONS" });
    assert.equal(corsRes.status, 204);
    assert.equal(corsRes.headers.get("access-control-allow-origin"), "*");

    const healthRes = await fetch(`${baseUrl}/health`);
    assert.equal(healthRes.status, 200);
    const healthData = await healthRes.json();
    assert.equal(healthData.status, "ok");

    const badReq = await fetch(`${baseUrl}/judge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    assert.equal(badReq.status, 400);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
