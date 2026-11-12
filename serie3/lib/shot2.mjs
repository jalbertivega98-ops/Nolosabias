// node ../lib/shot2.mjs page.html out.jpg "query"
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs'; import path from 'node:path';
const PROJ = path.basename(process.cwd()); const [pg, out, q] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
p.on('console', m => console.log('[pg]', m.text())); p.on('pageerror', e => console.log('[err]', e.message));
await p.goto(`http://localhost:8778/${PROJ}/render/${pg}?` + (q || '') + '&tl=' + encodeURIComponent(fs.readFileSync('audio/tl.json', 'utf8'))); await p.waitForFunction('window.ready===true', null, { timeout: 180000 });
const s = Date.now(); await p.evaluate(t => window.renderFrame(t), +(new URLSearchParams(q).get('t') || 1)); await p.screenshot({ path: out, type: 'jpeg', quality: 85 }); console.log('frame+shot ms', Date.now() - s); await b.close();
