// node ../lib/dbg.mjs t "js-before-render" out.jpg
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { serve } from './serve.mjs'; import fs from 'node:fs'; import path from 'node:path';
const PROJ = path.basename(process.cwd()); const [t, js, out] = [Number(process.argv[2]), process.argv[3], process.argv[4]];
const TL = fs.readFileSync('audio/tl.json', 'utf8');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', e => console.log('[err]', e.message)); p.on('console', m => console.log('[pg]', m.text()));
await serve(p); await p.goto(`http://localhost:8778/${PROJ}/render/index.html?&tl=` + encodeURIComponent(TL)); await p.waitForFunction('window.ready===true', null, { timeout: 180000 });
await p.evaluate(([t, js]) => { window.renderFrame(t); eval(js); window.renderFrame(t); }, [t, js]); await p.screenshot({ path: out, type: 'jpeg', quality: 70 }); await b.close();
