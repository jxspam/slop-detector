const http = require("http");
const https = require("https");

const PORT = process.env.PORT || 3824;
const TYPESAFE_API_URL = "https://api.typesafe.ai/v1/systemone";

const CRITERIA = [
  "Authentic personal human thought, direct conversation, or unique original expression",
  "Informational update, standard news headline, or natural professional message",
  "Slightly formulaic marketing post, generic social commentary, or clichéd template",
  "Heavily repetitive promotional spam, engagement farming, or probable synthetic copy",
  "Obvious AI-generated slop, robotic LLM buzzword salad, or synthetic bot text"
];

function buildJevRequest(text) {
  return {
    state: text,
    model: "jev-latest",
    questions: {
      slop_score: {
        type: "score",
        instructions: "Rate how likely this post is to be synthetic AI slop, formulaic engagement farming, or low quality LLM filler.",
        criteria: CRITERIA
      }
    }
  };
}

function parseJevResponse(data) {
  if (!data || !data.answers || !data.answers.slop_score) {
    throw new Error("Invalid response structure from Jev API");
  }
  const answer = data.answers.slop_score;
  const rawScore = typeof answer.score === "number" ? answer.score : 0;
  const maxLevel = CRITERIA.length - 1;
  const normalized = Math.round((Math.max(0, Math.min(maxLevel, rawScore)) / maxLevel) * 100);
  return {
    score: normalized,
    rawScore: rawScore,
    confidence: typeof answer.confidence === "number" ? answer.confidence : 0,
    model: data.model || "jev-latest",
    usage: data.usage || { input_tokens: 0, output_tokens: 0 }
  };
}

function callTypeSafeWithRetry(payload, maxRetries = 3, initialDelay = 1000) {
  const apiKey = process.env.TYPESAFE_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error("TYPESAFE_API_KEY environment variable is missing"));
  }

  return new Promise((resolve, reject) => {
    let attempt = 0;

    function execute() {
      const data = JSON.stringify(payload);
      const req = https.request(TYPESAFE_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data)
        }
      }, res => {
        let body = "";
        res.on("data", chunk => { body += chunk; });
        res.on("end", () => {
          if (res.statusCode === 200) {
            try {
              const json = JSON.parse(body);
              resolve(json);
            } catch (err) {
              reject(new Error(`Failed to parse JSON response: ${err.message}`));
            }
          } else if ((res.statusCode === 429 || res.statusCode === 529) && attempt < maxRetries) {
            attempt++;
            const backoff = initialDelay * Math.pow(2, attempt - 1);
            setTimeout(execute, backoff);
          } else {
            reject(new Error(`TypeSafe API responded with status ${res.statusCode}`));
          }
        });
      });

      req.on("error", err => {
        if (attempt < maxRetries) {
          attempt++;
          const backoff = initialDelay * Math.pow(2, attempt - 1);
          setTimeout(execute, backoff);
        } else {
          reject(err);
        }
      });

      req.write(data);
      req.end();
    }

    execute();
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", port: PORT }));
    return;
  }

  if (req.method === "POST" && req.url === "/judge") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", async () => {
      try {
        const parsed = JSON.parse(body || "{}");
        const text = (parsed.text || "").trim();
        if (!text) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Empty or missing text field" }));
          return;
        }

        const jevRequest = buildJevRequest(text);
        const jevResponse = await callTypeSafeWithRetry(jevRequest);
        const result = parseJevResponse(jevResponse);
        console.log(`[Relay] Scored "${text.slice(0, 35).replace(/\n/g, ' ')}...": score=${result.score} raw=${result.rawScore} band=${result.score >= 80 ? 'slop' : result.score >= 40 ? 'check' : 'untouched'}`);

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
  server.listen(PORT, () => {
    console.log(`Relay listening on port ${PORT}`);
  });
}

module.exports = {
  PORT,
  CRITERIA,
  buildJevRequest,
  parseJevResponse,
  callTypeSafeWithRetry,
  server
};
