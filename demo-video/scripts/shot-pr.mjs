import { createRequire } from 'module';
const require = createRequire(process.env.HOME + '/.cache/adal-demo/package.json');
const { chromium } = require('playwright');
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
for (const [name, url] of [['conversation','https://github.com/jxspam/jev-slop-detector/pull/1'],['files','https://github.com/jxspam/jev-slop-detector/pull/1/files']]) {
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `assets/pr/${name}-top.png` });
  await p.screenshot({ path: `assets/pr/${name}-full.png`, fullPage: true });
}
await b.close();
