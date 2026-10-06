// Render stage2.html frame by frame, one Chrome for the whole cut. Serve this folder on :9885 first.
// node render.mjs <out.mp4> [--stills 1,5,...]
import { createRequire } from 'module';
import { spawn } from 'child_process';
const require = createRequire(process.env.HOME + '/.cache/adal-demo/package.json');
const { chromium } = require('playwright');
const argv = process.argv.slice(2), OUT = argv[0], FPS = 30;
const stills = argv.includes('--stills') ? argv[argv.indexOf('--stills') + 1].split(',').map(Number) : null;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', e => console.error('PAGE', e.message));
await page.goto('http://127.0.0.1:9885/stage2.html', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const END = await page.evaluate(() => window.END);
if (stills) {
  for (const t of stills) { await page.evaluate(t => window.render(t), t); await page.screenshot({ path: `${OUT}-${t}.jpg`, type: 'jpeg', quality: 85 }); }
  await browser.close(); process.exit(0);
}
const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUT], { stdio: ['pipe', 'ignore', 'inherit'] });
const N = Math.ceil(END * FPS);
for (let i = 0; i < N; i++) {
  await page.evaluate(t => window.render(t), i / FPS);
  const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % 600 === 0) console.log(`frame ${i}/${N}`);
}
ff.stdin.end(); await new Promise(r => ff.on('close', r)); await browser.close();
console.log('wrote', OUT, (N / FPS).toFixed(2) + 's');
