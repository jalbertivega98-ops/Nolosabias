import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const T=+process.argv[2]; const TL = fs.readFileSync('audio/tl.json','utf8');
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p = await b.newPage({viewport:{width:1080,height:1920}});
await p.goto('http://localhost:8777/render/index.html?scale=0.5&tl='+encodeURIComponent(TL)); await p.waitForFunction('window.ready===true',null,{timeout:120000});
const r = await p.evaluate((T)=>{ window.renderFrame(T); const d=window._dbg; const v=d.sub.position.clone().project(d.camera); return {cam:d.camera.position.toArray().map(x=>+x.toFixed(1)), sub:d.sub.position.toArray(), proj:[v.x,v.y,v.z], exp:d.renderer.toneMappingExposure, fog:d.sea.fog.density}; },T);
console.log(JSON.stringify(r)); await b.close();
