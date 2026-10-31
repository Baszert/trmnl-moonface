// Builds preview/index.html: the real templates for moments and places around the world.
// Usage: node dev/preview.mjs
import fs from 'node:fs';
import path from 'node:path';
import { Liquid } from 'liquidjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
// [label, lat, lon, locale, language, test moment (local), tilt]
const S = [
  ['Utrecht, 24 okt, 98% (bijna vol)', 52.0907, 5.1214, 'nl', 'auto', '2026-10-24T22:00', 'sky'],
  ['Utrecht, 20 okt, 70% wassend', 52.0907, 5.1214, 'nl', 'auto', '2026-10-20T22:00', 'sky'],
  ['Utrecht, 14 okt, sikkel', 52.0907, 5.1214, 'nl', 'auto', '2026-10-14T19:00', 'sky'],
  ['Utrecht, 3 nov, afnemend', 52.0907, 5.1214, 'nl', 'auto', '2026-11-03T06:00', 'sky'],
  ['Utrecht, 26 okt, volle maan', 52.0907, 5.1214, 'nl', 'auto', '2026-10-26T22:00', 'sky'],
  ['Sydney, 20 okt (de maan staat op zijn kop)', -33.8688, 151.2093, 'en-AU', 'auto', '2026-10-20T21:00', 'sky'],
  ['Brooklyn, Oct 20, 12-hour', 40.6782, -73.9442, 'en-US', 'auto', '2026-10-20T20:00', 'sky'],
  ['München, 21. Okt', 48.1351, 11.582, 'de', 'auto', '2026-10-21T21:00', 'sky'],
  ['Paris, 22 oct', 48.8566, 2.3522, 'fr', 'auto', '2026-10-22T21:00', 'sky'],
  ['Utrecht, noord boven', 52.0907, 5.1214, 'nl', 'auto', '2026-10-24T22:00', 'north']
];
const engine = new Liquid();
const shared = read('src/shared.liquid').replace(/<script>[\s\S]*?<\/script>/, '');
const out = [];
for (const [label, lat, lon, locale, language, test, tilt] of S) {
  const off = { 'en-AU': 39600, 'en-US': -14400, nl: 7200, de: 7200, fr: 7200 }[locale] ?? 0;
  const ctx = { trmnl: { system: { timestamp_utc: Math.floor(Date.now() / 1000) }, user: { locale, utc_offset: off }, plugin_settings: { instance_name: 'Moonface',
    custom_fields_values: { lat_lon: `${lat},${lon}`, language, clock: 'auto', units: 'auto', tilt, test_date: test } } } };
  const html = {};
  for (const v of ['full', 'half_horizontal', 'half_vertical', 'quadrant']) html[v] = await engine.parseAndRender(shared + '\n' + read('src/' + v + '.liquid'), ctx);
  out.push({ label, html });
}
fs.mkdirSync(path.join(root, 'preview'), { recursive: true });
const features = read('dev/features.json').trim();
fs.writeFileSync(path.join(root, 'preview/moon-all.js'), ['luna.js', 'moonface.js', 'moon.js'].map((f) => read('dev/' + f).replace('/*FEATURES*/[]', () => features)).join('\n;\n'));
fs.writeFileSync(path.join(root, 'preview/index.html'), read('dev/preview.template.html').replace('/*DATA*/null', () => JSON.stringify(out).replace(/<\/script/g, '<\\/script')));
console.log(`preview/index.html: ${out.length} nights`);
