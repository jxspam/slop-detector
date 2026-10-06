import { createRequire } from 'module';
const require = createRequire(process.env.HOME + '/.cache/adal-demo/package.json');
const { chromium } = require('playwright');
const b = await chromium.connectOverCDP('http://127.0.0.1:9333');
const ctx = b.contexts()[0];
for (const url of ['https://x.com/search?q=%23mindset%20%23success&src=typed_query&f=live']) {
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('article[data-testid="tweet"]', { timeout: 30000 }).catch(() => console.log('no tweets', p.url()));
  await p.waitForTimeout(4000);
  for (let i = 0; i < 10; i++) { await p.mouse.wheel(0, 500); await p.waitForTimeout(900); }
  await p.waitForTimeout(3000);
  const r = await p.evaluate(() => ({ tweets: document.querySelectorAll('article[data-testid="tweet"]').length,
    slop: [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && /LIKELY AI SLOP/.test(e.textContent)).map(e => e.textContent.trim()),
    check: [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && /^CHECK THIS$/.test(e.textContent.trim())).length }));
  console.log(url.slice(14, 40), JSON.stringify(r));
  await p.screenshot({ path: `rehearsals/x2-${url.includes('search') ? 'search' : 'home'}.png` });
  await p.close();
}
await b.close().catch(() => {});
