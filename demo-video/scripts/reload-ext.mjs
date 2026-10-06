// Reload the unpacked slop detector in AdaL's shared Chrome (called between take C prompts).
import { createRequire } from 'module';
const require = createRequire(process.env.HOME + '/.cache/adal-demo/package.json');
const { chromium } = require('playwright');
const b = await chromium.connectOverCDP('http://127.0.0.1:9333');
const ctx = b.contexts()[0];
let sw = ctx.serviceWorkers().find(w => w.url().includes('background.js'));
if (!sw) sw = await ctx.waitForEvent('serviceworker', { timeout: 8000 }).catch(() => null);
if (sw) { await sw.evaluate(() => chrome.runtime.reload()).catch(() => {}); console.log('reloaded'); } else console.log('no worker');
await new Promise(r => setTimeout(r, 2500));
const sw2 = ctx.serviceWorkers().find(w => w.url().includes('background.js'));
console.log('worker after reload:', !!sw2);
await b.close().catch(() => {});
