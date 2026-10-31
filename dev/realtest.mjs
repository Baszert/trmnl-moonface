// Renders the real built templates (minified script, textures from the published URL) into a page and screenshots it.
import fs from 'node:fs'; import { Liquid } from 'liquidjs'; import puppeteer from 'puppeteer-core';
const read = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const ctx = { utc_offset_seconds: 7200, trmnl: { system: { timestamp_utc: Math.floor(Date.now() / 1000) }, user: { locale: 'nl', utc_offset: 7200 }, plugin_settings: { instance_name: 'Moonface', custom_fields_values: { lat_lon: '52.0907,5.1214', language: 'auto', clock: 'auto', units: 'auto', tilt: 'sky' } } } };
const html = await new Liquid().parseAndRender(read('src/shared.liquid') + '\n' + read('src/full.liquid'), ctx);
fs.writeFileSync(new URL('../preview/real.html', import.meta.url), `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://trmnl.com/css/latest/plugins.css"></head><body class="trmnl" style="margin:0"><div class="screen screen--no-bleed screen--og screen--1bit screen--md"><div class="view view--full">${html}</div></div></body></html>`);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
const p = await b.newPage(); await p.setViewport({ width: 800, height: 480 });
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('requestfailed', (r) => errs.push('failed ' + r.url()));
const t0 = Date.now();
await p.goto('http://localhost:8775/preview/real.html', { waitUntil: 'load' });
const ms = Date.now() - t0;
const painted = await p.evaluate(() => document.querySelector('.mf').dataset.painted || 'not yet at load');
await p.waitForFunction(() => document.querySelector('.mf').dataset.painted, { timeout: 30000 }).catch(() => errs.push('never painted'));
await p.screenshot({ path: new URL('../shots/real.png', import.meta.url).pathname });
console.log('load event after', ms, 'ms; painted at load:', painted, '; problems:', errs.join(' | ') || 'none');
await b.close();
