// Hook capture: the detector's real content script on Jax's real X feed, real Jev via the local relay.
// No heuristic fallback: if the relay fails, nothing is badged.
import { createRequire } from 'module';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
const require = createRequire(process.env.HOME + '/.cache/adal-demo/package.json');
const { chromium } = require('playwright');
const OUT = process.argv[2]; mkdirSync(`${OUT}/frames`, { recursive: true });
const SHIM = `
window.__tsabLog=[];const L={runtime:[],storage:[]};
window.chrome={storage:{sync:{get:async(d)=>({...d,apiKey:"relay",enabled:true,highThreshold:0.8,mediumThreshold:0.5,toast:true})},onChanged:{addListener:(f)=>L.storage.push(f)}},
runtime:{onMessage:{addListener:(f)=>L.runtime.push(f)},async sendMessage(msg){window.__tsabLog.push({type:msg.type,n:(msg.candidates||[]).length});if(msg.type!=="judge")return{ok:true};
try{const j=await window.__judgeViaRelay(msg);if(j&&j.probabilities){j.via="relay";window.__tsabLog.push({ok:1,p:j.probabilities});return j;}window.__tsabLog.push({bad:j})}catch(e){window.__tsabLog.push({err:String(e)})}
return{model:"none",probabilities:msg.candidates.map(()=>0),latencyMs:0,via:"failed"};}}};`;
const CONTENT = readFileSync('workspace/src/content.js', 'utf8');
const b = await chromium.connectOverCDP('http://127.0.0.1:9333');
const ctx = b.contexts()[0];
const p = await ctx.newPage();
await p.setViewportSize({ width: 1280, height: 800 });
await p.exposeFunction('__judgeViaRelay', async (msg) => {
  const r = await fetch('http://localhost:8788/judge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(msg) });
  return r.ok ? await r.json() : { error: r.status };
});
const cdp = await ctx.newCDPSession(p);
await cdp.send('Page.enable'); await cdp.send('Page.setBypassCSP', { enabled: true });
await p.goto('https://x.com/home', { waitUntil: 'domcontentloaded' });
await p.waitForSelector('article[data-testid="tweet"]', { timeout: 30000 });
await p.waitForTimeout(2500);
const index = []; let n = 0; const t0 = Date.now();
cdp.on('Page.screencastFrame', async (f) => {
  const file = `${String(++n).padStart(5, '0')}.jpg`;
  writeFileSync(`${OUT}/frames/${file}`, Buffer.from(f.data, 'base64'));
  index.push({ t: (Date.now() - t0) / 1000, file });
  if (n % 25 === 0) writeFileSync(`${OUT}/index.json`, JSON.stringify(index));
  cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 85, maxWidth: 2560, maxHeight: 1600, everyNthFrame: 1 });
await p.waitForTimeout(1500);
index.push({ t: (Date.now() - t0) / 1000, mark: 'inject' });
await p.addScriptTag({ content: SHIM });
await p.addScriptTag({ content: CONTENT });
await p.waitForTimeout(4000);
for (let i = 0; i < 26; i++) { await p.mouse.wheel(0, 120); await p.waitForTimeout(700); }
await p.waitForTimeout(3000);
await cdp.send('Page.stopScreencast');
const log = await p.evaluate(() => window.__tsabLog);
const badges = await p.evaluate(() => [...document.querySelectorAll('[data-tsab-badge], [data-tsab]')].length);
writeFileSync(`${OUT}/index.json`, JSON.stringify(index));
writeFileSync(`${OUT}/tsab-log.json`, JSON.stringify(log, null, 1));
console.log('frames', n, 'badged-ish', badges, 'log', JSON.stringify(log).slice(0, 600));
await p.close(); await b.close().catch(() => {});
