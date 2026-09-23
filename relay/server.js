const http = require("node:http");
const { judgeCard } = require("../judge.js");

const PORT = process.env.PORT || 3000;

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && (url.pathname === "/health" || url.pathname === "/api/health")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/judge") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
      }
    });

    req.on("end", async () => {
      try {
        const payload = JSON.parse(body || "{}");
        const text = payload.text;
        if (!text || typeof text !== "string" || !text.trim()) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing or empty text parameter" }));
          return;
        }

        const apiKey = process.env.TYPESAFE_API_KEY;
        if (!apiKey) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "TYPESAFE_API_KEY not configured on server" }));
          return;
        }

        const options = {};
        if (payload.thresholds) {
          options.thresholds = payload.thresholds;
        }

        const result = await judgeCard(text, apiKey, globalThis.fetch, options);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message || "Internal server error" }));
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

if (require.main === module) {
  server.listen(PORT, "127.0.0.1", () => {
    console.log(`Slop Detector relay listening on http://127.0.0.1:${PORT}`);
  });
}

module.exports = { server };
