// Capa HUD transparente → MOV (png). Uso desde la carpeta del vídeo: node ../lib/hudrender.mjs out/hud.mov [desde] [hasta]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { spawn } from 'node:child_process'; import fs from 'node:fs'; import path from 'node:path';
const [out, fromS, toS] = process.argv.slice(2); const PROJ = path.basename(process.cwd()); const TL = JSON.parse(fs.readFileSync('audio/tl.json'));
const FPS = 30, a = Math.round((+fromS || 0) * FPS), b = Math.round((toS ? +toS : TL.end) * FPS);
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'png', '-i', '-', '-c:v', 'png', '-pix_fmt', 'rgba', out], { stdio: ['pipe', 'inherit', 'inherit'] });
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await br.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', e => console.log('[err]', e.message));
await p.goto(`http://localhost:8778/${PROJ}/render/index.html?&tl=` + encodeURIComponent(JSON.stringify(TL))); await p.waitForFunction('window.ready===true', null, { timeout: 120000 });
for (let f = a; f < b; f++) { await p.evaluate(t => window.renderFrame(t), f / FPS); const buf = await p.screenshot({ type: 'png', omitBackground: true }); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); if (f % 150 === 0) console.log('hud', f, b); }
ff.stdin.end(); await new Promise(r => ff.on('close', r)); await br.close(); console.log('done');
