import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const times = process.argv[2].split(',').map(Number); const q = process.argv[3]||'';
const TL = fs.readFileSync('audio/tl.json','utf8');
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p = await b.newPage({viewport:{width:1080,height:1920}});
p.on('console',m=>console.log('[pg]',m.text())); p.on('pageerror',e=>console.log('[err]',e.message));
await p.goto('http://localhost:8777/render/index.html?'+q+'&tl='+encodeURIComponent(TL)); await p.waitForFunction('window.ready===true',null,{timeout:120000});
for (const t of times){ const s=Date.now(); await p.evaluate(t=>window.renderFrame(t),t); await p.screenshot({path:`preview/t${t}.jpg`,type:'jpeg',quality:80}); console.log(t,Date.now()-s,'ms'); }
await b.close();
