// Launch AdaL's shared Chrome (signed-in profile) with the real slop detector extension installed,
// debug port 9333 for AdaL and the capture. Stays running until killed.
import { createRequire } from 'module';
import { readFileSync } from 'fs';
const require = createRequire(process.env.HOME + '/.cache/adal-demo/package.json');
const { chromium } = require('playwright');
const EXT = process.env.EXT || (process.env.HOME + '/adal/videos/jev-slop-detector/workspace');
const ctx = await chromium.launchPersistentContext(process.env.HOME + '/.adal/chrome-profiles/adal-browser-use', {
  channel: 'chrome', headless: false, viewport: null,
  args: ['--remote-debugging-port=9333', '--enable-unsafe-extension-debugging', '--window-size=1440,960', '--no-first-run', '--no-default-browser-check'],
  ignoreDefaultArgs: ['--disable-extensions', '--enable-automation', '--disable-component-extensions-with-background-pages', '--use-mock-keychain', '--password-store=basic', '--disable-sync', '--no-sandbox'],
});
const cdp = await ctx.browser()?.newBrowserCDPSession?.() ?? null;
let id;
try {
  const s = cdp || await ctx.newCDPSession(ctx.pages()[0]);
  ({ id } = await s.send('Extensions.loadUnpacked', { path: EXT }));
  console.log('extension id', id);
} catch (e) { console.log('loadUnpacked failed:', e.message); }
// wait for the service worker, then store the key there (never printed)
let sw = ctx.serviceWorkers().find(w => w.url().includes(id || 'chrome-extension'));
if (!sw) sw = await ctx.waitForEvent('serviceworker', { timeout: 15000 }).catch(() => null);
if (sw) {
  await sw.evaluate(k => chrome.storage.sync.set({ apiKey: k }), process.env.TYPESAFE_API_KEY);
  console.log('key stored:', await sw.evaluate(() => chrome.storage.sync.get('apiKey').then(r => !!r.apiKey)));
} else console.log('no service worker found');
console.log('ready');
await new Promise(() => {});
