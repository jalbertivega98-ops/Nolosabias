import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const T = +process.argv[2]; const X=process.argv[3]||10, Y=process.argv[4]||10;
const TL = fs.readFileSync('audio/tl.json','utf8');
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p = await b.newPage({viewport:{width:1080,height:1920}});
await p.goto('http://localhost:8777/render/index.html?scale=0.25&tl='+encodeURIComponent(TL)); await p.waitForFunction('window.ready===true',null,{timeout:120000});
const res = await p.evaluate(([T,X,Y])=>{ const d=window._dbg; const out={};
  const test=()=>{ window.renderFrame(T); const gl=d.renderer.getContext(); const px=new Uint8Array(4); gl.readPixels(+X,+Y,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px); return px[0]+px[1]+px[2]; };
  out.base=test();
  for (const [k,o] of Object.entries(d.objs)) { const v=o.visible; o.visible=false; const orig=o; 
     // forzar oculto durante el render
     const desc=Object.getOwnPropertyDescriptor(o,'visible'); Object.defineProperty(o,'visible',{get:()=>false,set:()=>{},configurable:true});
     out[k]=test(); delete o.visible; o.visible=v; }
  return out; }, [T,X,Y]);
console.log(JSON.stringify(res));
await b.close();
