// Checks luna.js against NASA SVS 5587 (hourly Moon phase and libration, 2026).
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const L = createRequire(import.meta.url)('./luna.js');
const rows = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const MON = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
const D = 180 / Math.PI, wrap = (x) => ((x + 540) % 360) - 180;
let worst = {}, sum = {}, n = 0;
for (let i = 0; i < rows.length; i += 37) {
  const r = rows[i], m = r.time.match(/(\d+) (\w+) (\d+) (\d+):(\d+)/), ms = Date.UTC(+m[3], MON[m[2]], +m[1], +m[4], +m[5]);
  const s = L.state(ms);
  const d = {
    phase: s.frac * 100 - r.phase, dist: s.range - r.distance, ra: wrap(s.ra * D - r.j2000.ra * 15) * Math.cos(s.dec),
    dec: s.dec * D - r.j2000.dec, elon: wrap(s.lib.l * D - r.subearth.lon), elat: s.lib.b * D - r.subearth.lat,
    slon: wrap(s.sunsel.l * D - r.subsolar.lon), slat: s.sunsel.b * D - r.subsolar.lat, P: wrap(s.P * D - r.posangle)
  };
  n++; for (const k in d) { worst[k] = Math.max(worst[k] || 0, Math.abs(d[k])); sum[k] = (sum[k] || 0) + Math.abs(d[k]); }
}
console.log(n + ' samples; mean | worst absolute difference to NASA');
for (const k in worst) console.log(k.padEnd(6), (sum[k] / n).toFixed(4).padStart(9), '|', worst[k].toFixed(4).padStart(9));
