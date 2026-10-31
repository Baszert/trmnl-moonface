// Builds src/shared.liquid: luna.js, moonface.js and moon.js (with the feature list) minified into one script, put in
// dev/shared.src.liquid. Usage: node dev/build.mjs   (fetches terser through npx on first run)
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = new URL('.', import.meta.url).pathname, tmp = mkdtempSync(join(tmpdir(), 'moonface-'));
const features = readFileSync(join(dir, 'features.json'), 'utf8').trim();
const src = ['luna.js', 'moonface.js', 'moon.js'].map((f) => readFileSync(join(dir, f), 'utf8').replace('/*FEATURES*/[]', () => features)).join('\n;\n');
writeFileSync(join(tmp, 'all.js'), src);
const out = join(tmp, 'all.min.js');
execFileSync('npx', ['-y', 'terser@5.36.0', join(tmp, 'all.js'), '-c', 'passes=2', '-m', '--format', 'ascii_only=true', '-o', out], { stdio: 'inherit' });
const js = readFileSync(out, 'utf8').trim();
if (/\{\{|\{%|endraw/.test(js)) throw new Error('minified script contains Liquid delimiters');
let liquid = readFileSync(join(dir, 'shared.src.liquid'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, (m) => (m === '/*SCRIPT*/' ? m : ''))        // CSS comments
  .replace(/^\s+/gm, '').replace(/\n{2,}/g, '\n');                          // indentation and blank lines
liquid = liquid.replace('/*SCRIPT*/', () => js);
writeFileSync(join(dir, '../src/shared.liquid'), liquid);
console.log(`src/shared.liquid: ${Buffer.byteLength(liquid)} bytes (script ${Buffer.byteLength(js)})`);
