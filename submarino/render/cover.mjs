import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const TL = fs.readFileSync('audio/tl.json','utf8');
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p = await b.newPage({viewport:{width:1080,height:1920}});
p.on('pageerror',e=>console.log('[err]',e.message));
await p.goto('http://localhost:8777/render/index.html?'+(process.argv[3]||'')+'&tl='+encodeURIComponent(TL)); await p.waitForFunction('window.ready===true',null,{timeout:120000});
await p.evaluate(()=>window.renderCover()); await p.screenshot({path:process.argv[2],type:'png'}); await b.close();
