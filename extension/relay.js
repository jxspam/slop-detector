// relay.js: local relay that keeps TYPESAFE_API_KEY server side.
// The extension service worker calls POST /score { text } here; the relay
// forwards one score question to TypeSafe Jev and returns { score } 0 to 100.
import http from 'node:http';

const PORT = 8787;
const API_KEY = process.env.TYPESAFE_API_KEY;

if (!API_KEY) {
  console.error('TYPESAFE_API_KEY is not set. Refusing to start.');
  process.exit(1);
}

function buildRequest(text) {
  return {
    state: text,
    model: 'jev-latest',
    questions: {
      slop: {
        type: 'score',
        instructions: 'How likely is this post to be low-effort AI generated slop, from 0 to 100?',
        criteria: [
          { score: 0, description: 'clearly written by a human, specific and personal' },
          { score: 100, description: 'obviously low-effort AI generated slop' }
        ]
      }
    }
  };
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/score') {
    res.writeHead(404).end();
    return;
  }
  let raw = '';
  req.on('data', (chunk) => { raw += chunk; });
  req.on('end', async () => {
    let text = '';
    try {
      const parsed = JSON.parse(raw);
      // The extension sends the Jev-shaped request body (state, model, questions);
      // curl-style callers send { text }. Both are accepted here.
      text = typeof parsed.text === 'string' ? parsed.text.trim()
           : typeof parsed.state === 'string' ? parsed.state.trim() : '';
    } catch (err) { void err; }
    if (!text) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'empty text' }));
      return;
    }
    try {
      const upstream = await fetch('https://api.typesafe.ai/v1/systemone', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(buildRequest(text))
      });
      // Pass the TypeSafe response through unchanged; judge.js owns the parsing.
      let json = null;
      try { json = await upstream.json(); } catch (err) { void err; }
      res.writeHead(upstream.status === 200 ? 200 : (upstream.status === 429 ? 429 : 502), { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(json));
    } catch (err) {
      void err;
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'relay failure' }));
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`slop-detector relay listening on http://127.0.0.1:${PORT}/score`);
});