const http = require("node:http");
const { judgeCard } = require("./judge.js");

const PORT = parseInt(process.env.PORT || "8787", 10);
const API_KEY = process.env.TYPESAFE_API_KEY || "";

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "ok",
      hasKey: Boolean(API_KEY),
      port: PORT
    }));
    return;
  }

  if (req.method === "POST" && req.url === "/judge") {
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
          res.end(JSON.stringify({ error: "Missing or empty text property" }));
          return;
        }

        if (!API_KEY) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Server missing TYPESAFE_API_KEY" }));
          return;
        }

        const result = await judgeCard(text, API_KEY, globalThis.fetch, {
          thresholds: payload.thresholds
        });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

if (require.main === module) {
  server.listen(PORT, "127.0.0.1", () => {
    console.log(`Relay listening on http://127.0.0.1:${PORT}`);
  });
}

module.exports = { server, PORT };
