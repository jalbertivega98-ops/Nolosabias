import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const TL = fs.readFileSync('audio/tl.json','utf8');
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p = await b.newPage({viewport:{width:1080,height:1920}});
await p.goto('http://localhost:8777/render/index.html?scale=0.25&tl='+encodeURIComponent(TL)); await p.waitForFunction('window.ready===true',null,{timeout:120000});
const res = await p.evaluate(()=>{ const g=window._dbg.objs.pressureHull.geometry; const out={};
  for (const name of ['position','normal','uv']) { const a=g.attributes[name].array; let bad=0; for (const v of a) if(!Number.isFinite(v)) bad++; out[name]=bad; }
  const m=window._dbg.objs.pressureHull.material; out.mat={op:m.opacity, em:m.emissiveIntensity, rough:m.roughness}; return out; });
console.log(JSON.stringify(res)); await b.close();
