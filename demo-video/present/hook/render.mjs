// Render hook.html?scene=${SCENE} frame by frame in ONE Chrome for the whole cut, serving this folder itself.
// node render6.mjs <out.mp4> [--stills 1,5,...] [--from 12 --to 20]
import { createRequire } from 'module';
import { spawn } from 'child_process';
import { createServer } from 'http';
import { createReadStream, statSync } from 'fs';
import { extname, join, normalize } from 'path';
const require = createRequire(process.env.HOME + '/.cache/adal-demo/package.json');
const { chromium } = require('playwright');

const ROOT = new URL('.', import.meta.url).pathname;
const MIME = { '.html': 'text/html', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
               '.json': 'application/json', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.css': 'text/css', '.mp4': 'video/mp4' };
const PORT = 9889;
const server = createServer((req, res) => {
  const p = join(ROOT, normalize(decodeURIComponent(req.url.split('?')[0])));
  try { statSync(p); } catch { res.writeHead(404); return res.end('no'); }
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
  createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(PORT, '127.0.0.1', r));

const argv = process.argv.slice(2), OUT = argv[0], FPS = 30, SCENE = argv[1];
const arg = k => argv.includes(k) ? argv[argv.indexOf(k) + 1] : null;
const stills = arg('--stills') ? arg('--stills').split(',').map(Number) : null;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', e => console.error('PAGE', e.message));
await page.goto(`http://127.0.0.1:${PORT}/hook.html?scene=${SCENE}`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const END = await page.evaluate(() => window.END);
console.log('END', END);
if (stills) {
  for (const t of stills) { await page.evaluate(t => window.render(t), t); await page.screenshot({ path: `${OUT}-${t}.jpg`, type: 'jpeg', quality: 88 }); }
  await browser.close(); server.close(); process.exit(0);
}
const from = Number(arg('--from') || 0), to = Number(arg('--to') || END);
const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUT],
  { stdio: ['pipe', 'ignore', 'inherit'] });
const n0 = Math.round(from * FPS), n1 = Math.ceil(to * FPS);
for (let i = n0; i < n1; i++) {
  await page.evaluate(t => window.render(t), i / FPS);
  const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % 300 === 0) console.log(`frame ${i}/${n1}`);
}
ff.stdin.end(); await new Promise(r => ff.on('close', r)); await browser.close(); server.close();
console.log('wrote', OUT, ((n1 - n0) / FPS).toFixed(2) + 's');
