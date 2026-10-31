// Screenshots a preview page once the Moon is drawn. Usage: node dev/shoot.mjs out.png "scenario=0&device=og&view=full" 800 480 [deviceScaleFactor]
import puppeteer from 'puppeteer-core';
const [out, query, w, h, dpr] = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--disable-gpu', '--hide-scrollbars'] });
const page = await browser.newPage();
await page.setViewport({ width: +w, height: +h, deviceScaleFactor: +(dpr || 1) });
page.on('pageerror', (e) => console.error('page error:', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.error('console:', m.text()); });
await page.goto(`http://localhost:8775/preview/index.html?bare=1&${query}`, { waitUntil: 'load' });
await page.waitForFunction(() => { const r = [...document.querySelectorAll('.mf')]; return r.length > 0 && r.every((x) => x.dataset.painted); }, { timeout: 60000 }).catch(() => console.error('timeout: the Moon was not painted'));
await page.screenshot({ path: out });
await browser.close();
