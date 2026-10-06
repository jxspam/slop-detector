import { createRequire } from 'module';
import { readFileSync } from 'fs';
const require = createRequire(process.env.HOME + '/.cache/adal-demo/package.json');
const { chromium } = require('playwright');
const svg = readFileSync(process.env.HOME + '/adal/assets/adal_logo/svg/adal2.svg', 'utf8');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 600, height: 140 }, deviceScaleFactor: 1 });
await p.setContent(`<html><body style="margin:0;background:transparent"><div id="l" style="width:600px;line-height:0">${svg.replace('<svg ', '<svg style="width:600px;height:auto" ')}</div></body></html>`);
await p.locator('#l').screenshot({ path: 'build/adal2@600.png', omitBackground: true });
await b.close();
