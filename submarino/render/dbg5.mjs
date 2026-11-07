import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const [T,X,Y]=process.argv.slice(2).map(Number); const TL = fs.readFileSync('audio/tl.json','utf8');
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p = await b.newPage({viewport:{width:1080,height:1920}});
await p.goto('http://localhost:8777/render/index.html?scale=0.25&tl='+encodeURIComponent(TL)); await p.waitForFunction('window.ready===true',null,{timeout:120000});
const r = await p.evaluate(([T,X,Y])=>{ const d=window._dbg; const out={}; const gl=d.renderer.getContext();
 const px=()=>{const a=new Uint8Array(4); gl.readPixels(X,Y,1,1,gl.RGBA,gl.UNSIGNED_BYTE,a); return a[0]+a[1]+a[2];};
 window.renderFrame(T); out.base=px();
 for (const [k,l] of Object.entries(d.lights)) { const desc={get:()=>0,set:()=>{},configurable:true}; Object.defineProperty(l,'intensity',desc); window.renderFrame(T); out[k]=px(); delete l.intensity; l.intensity=1; out[k+'_i']=0; }
 return out; },[T,X,Y]);
console.log(JSON.stringify(r)); await b.close();
