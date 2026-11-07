// Renderiza todos los fotogramas y los envía a FFmpeg (H.264, 30 fps, 1080x1920). Ejecutar desde la carpeta del vídeo.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path';
const [out, query, fromS, toS] = process.argv.slice(2);
const PROJ = path.basename(process.cwd());
const TL = JSON.parse(fs.readFileSync('audio/tl.json'));
const FPS = 30, a = Math.round((+fromS || 0) * FPS), b = Math.round((toS ? +toS : TL.end) * FPS);
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await br.newPage({ viewport: { width: 1080, height: 1920 } });
p.on('pageerror', e => console.log('[err]', e.message));
await p.goto(`http://localhost:8778/${PROJ}/render/index.html?` + (query || '') + '&tl=' + encodeURIComponent(JSON.stringify(TL)));
await p.waitForFunction('window.ready===true', null, { timeout: 180000 });
const t0 = Date.now();
for (let f = a; f < b; f++) {
  await p.evaluate(t => window.renderFrame(t), f / FPS);
  const buf = await p.screenshot({ type: 'png' });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (f % 60 === 0) console.log(`frame ${f}/${b} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
ff.stdin.end(); await new Promise(r => ff.on('close', r)); await br.close(); console.log('done', out);
