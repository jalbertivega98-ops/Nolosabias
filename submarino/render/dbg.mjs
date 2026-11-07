import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const TL = fs.readFileSync('audio/tl.json','utf8');
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p = await b.newPage({viewport:{width:1080,height:1920}});
p.on('pageerror',e=>console.log('[err]',e.message));
await p.goto('http://localhost:8777/render/index.html?scale=0.5&tl='+encodeURIComponent(TL)); await p.waitForFunction('window.ready===true',null,{timeout:120000});
const r = await p.evaluate(()=>{ window.renderFrame(15); const d=window._dbg; return {cam:d.camera.position.toArray(), sub:d.sub.position.toArray(), fov:d.camera.fov}; });
console.log(JSON.stringify(r));
// prueba sin bloom
const r2 = await p.evaluate(()=>{ const d=window._dbg; window.renderFrame(15); return 1; });
await p.screenshot({path:'preview/dbg_nobloom.jpg',type:'jpeg',quality:70});
await b.close();
