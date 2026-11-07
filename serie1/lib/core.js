// Núcleo común NO LO SABÍAS: renderer, grading, cielo/océano, partículas, HUD y logotipo.
// Extraído sin cambios del vídeo del submarino (estilo aprobado).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const W = 1080, H = 1920;
const P = new URLSearchParams(location.search);
const SCALE = parseFloat(P.get('scale') || '1');
const BRAND = P.get('brand') || 'NO LO SABÍAS';
const TAG = 'El mundo tiene más historias';
const TL = JSON.parse(P.get('tl') || '{}');

// --------------------------------------------------------------------------
// Utilidades (idénticas al piloto)
// --------------------------------------------------------------------------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeIn = t => t * t * t;
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function noise1(x) { const i = Math.floor(x), f = x - i; const h = n => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); }; const u = f * f * (3 - 2 * f); return lerp(h(i), h(i + 1), u) * 2 - 1; }
function shake(t, amp, freq = 18) { return new THREE.Vector3(noise1(t * freq) * amp, noise1(t * freq + 31.7) * amp, noise1(t * freq + 77.3) * amp * .5); }
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// --------------------------------------------------------------------------
// Renderer y post-procesado (mismo grading que el piloto)
// --------------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(W * SCALE, H * SCALE, false);
renderer.domElement.style.width = W + 'px'; renderer.domElement.style.height = H + 'px';
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('wrap').appendChild(renderer.domElement);
const overlay = document.createElement('canvas'); overlay.width = W; overlay.height = H;
document.getElementById('wrap').appendChild(overlay);
const g2 = overlay.getContext('2d');

const camera = new THREE.PerspectiveCamera(35, W / H, 0.1, 6000);
const composer = new EffectComposer(renderer);
composer.setSize(W * SCALE, H * SCALE);
const renderPass = new RenderPass(new THREE.Scene(), camera);
composer.addPass(renderPass);
// Limpieza de NaN/Inf antes del bloom (un solo píxel inválido ennegrece el bloom entero)
composer.addPass(new ShaderPass({ uniforms: { tDiffuse: { value: null } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ vec4 c=texture2D(tDiffuse,vUv); if(any(isnan(c))||any(isinf(c))) c=vec4(0.,0.,0.,1.); gl_FragColor=vec4(min(c.rgb,vec3(60.)),c.a); }` }));
const bloom = new UnrealBloomPass(new THREE.Vector2(W * SCALE / 2, H * SCALE / 2), 0.6, 0.5, 0.9);
composer.addPass(bloom);
const gradePass = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null }, uTime: { value: 0 }, uCA: { value: 0.0015 }, uFlash: { value: 0 },
    uVig: { value: 1.0 }, uFade: { value: 0 }, uGrain: { value: 0.035 }, uRes: { value: new THREE.Vector2(W, H) },
    uFlashCol: { value: new THREE.Color(1, .93, .85) },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime,uCA,uFlash,uVig,uFade,uGrain; uniform vec2 uRes; uniform vec3 uFlashCol;
    varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
    void main(){
      vec2 c=vUv-.5; float r=length(c*vec2(1.,uRes.y/uRes.x));
      vec2 off=c*uCA*(1.+r*2.);
      vec3 col=vec3(texture2D(tDiffuse,vUv+off).r, texture2D(tDiffuse,vUv).g, texture2D(tDiffuse,vUv-off).b);
      float l=dot(col,vec3(.2126,.7152,.0722));
      vec3 shadowTint=vec3(.86,.97,1.12), highTint=vec3(1.08,.98,.88);
      col*=mix(shadowTint,highTint,smoothstep(.05,.8,l));
      col=mix(vec3(l),col,1.06);
      float vig=smoothstep(1.25,.35,r*uVig); col*=mix(.55,1.,vig);
      col+=uFlashCol*uFlash;
      col+=(h(vUv*uRes+fract(uTime*7.13)*100.)-.5)*uGrain;
      col*=1.-uFade;
      gl_FragColor=vec4(max(col,0.),1.);
    }`
});
composer.addPass(gradePass);

await document.fonts.load('800 100px Montserrat'); await document.fonts.load('300 40px Inter'); await document.fonts.load('600 40px Inter');

function glowTexture(inner = 'rgba(255,240,220,1)', mid = 'rgba(255,170,90,.35)') {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, inner); gr.addColorStop(.12, inner); gr.addColorStop(.3, mid); gr.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const SOFT = glowTexture('rgba(255,255,255,1)', 'rgba(255,255,255,.25)');
function bubbleTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const gr = x.createRadialGradient(32, 32, 18, 32, 32, 31);
  gr.addColorStop(0, 'rgba(255,255,255,0.05)'); gr.addColorStop(.75, 'rgba(255,255,255,0.35)'); gr.addColorStop(.92, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  x.fillStyle = 'rgba(255,255,255,.9)'; x.beginPath(); x.arc(24, 22, 5, 0, 7); x.fill();
  const t = new THREE.CanvasTexture(c); return t;
}
const BUBBLE = bubbleTexture();

// Losetas anecoicas del casco (textura procedimental)
function tileTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const r = rng(77);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const v = 118 + r() * 26; x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(i * 64, j * 64, 64, 64); }
  x.strokeStyle = 'rgb(40,40,40)'; x.lineWidth = 3;
  for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, 256); x.stroke(); x.beginPath(); x.moveTo(0, i * 64); x.lineTo(256, i * 64); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
const TILE = tileTexture();


// ---- Cielo y océano (escena 'sea')
// ==========================================================================
const sea = new THREE.Scene();
sea.fog = new THREE.FogExp2(new THREE.Color(.02, .1, .15), 0.006);
const U = { uTime: { value: 0 }, uDepthCam: { value: 0 }, uCaustic: { value: 1 } };

// Cielo crepuscular (sobre la superficie)
const skyCol = { zen: new THREE.Color(.015, .035, .09), hor: new THREE.Color(.62, .3, .14) };
const SUN_DIR = V3(-1, .06, -1.25).normalize();
const skyDome = new THREE.Mesh(new THREE.SphereGeometry(4000, 48, 24), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { uZen: { value: skyCol.zen }, uHor: { value: skyCol.hor }, uSun: { value: SUN_DIR } },
  vertexShader: `varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 uZen,uHor,uSun; varying vec3 vD;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    void main(){ float y=vD.y; vec3 c=mix(uHor,uZen,pow(smoothstep(-.02,.5,y),.55));
      float sunA=max(dot(vD,uSun),0.); c+=vec3(1.,.55,.25)*pow(sunA,400.)*2.2+vec3(1.,.45,.15)*pow(sunA,16.)*.35+vec3(.9,.4,.15)*pow(sunA,3.)*.15;
      vec2 sp=floor(vD.xz/(vD.y+.2)*260.); float st=step(.998,h(sp))*smoothstep(.2,.6,y); c+=vec3(st)*.7;
      gl_FragColor=vec4(c,1.); }`
}));
sea.add(skyDome);

// Fondo submarino: degradado según la profundidad de la cámara y la dirección de mirada
const abyss = new THREE.Mesh(new THREE.SphereGeometry(3800, 48, 24), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { uDepth: U.uDepthCam, uTime: U.uTime },
  vertexShader: `varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform float uDepth,uTime; varying vec3 vD;
    void main(){
      float d=clamp(uDepth/320.,0.,1.);
      float up=smoothstep(-.3,1.,vD.y);
      vec3 shallowTop=vec3(.10,.42,.52), shallowLow=vec3(.008,.07,.11);
      vec3 deepTop=vec3(.012,.05,.10), deepLow=vec3(.001,.006,.014);
      vec3 top=mix(shallowTop,deepTop,pow(d,.6)), low=mix(shallowLow,deepLow,pow(d,.5));
      vec3 c=mix(low,top,pow(up,1.6));
      // halo del sol filtrado desde arriba
      c+=vec3(.25,.6,.65)*pow(max(vD.y,0.),18.)*(1.-d)*1.5;
      gl_FragColor=vec4(c,1.);
    }`
}));
sea.add(abyss);

// Superficie del océano: olas de Gerstner (vista desde arriba y desde abajo)
const oceanMat = new THREE.ShaderMaterial({
  side: THREE.DoubleSide, transparent: true, fog: false,
  uniforms: { uTime: U.uTime, uZen: { value: skyCol.zen }, uHor: { value: skyCol.hor }, uSun: { value: SUN_DIR }, uFoam: { value: 0 }, uFoamPos: { value: new THREE.Vector3() }, uFoamR: { value: 30 }, uWake: { value: 0 } },
  vertexShader: `
    uniform float uTime; varying vec3 vW; varying vec3 vN; varying float vCrest;
    vec3 gerst(vec2 d,float A,float L,vec3 p,float t,inout vec3 T,inout vec3 B){
      float k=6.2831/L; float c=sqrt(9.8/k); float f=k*(dot(d,p.xz)-c*t); float a=A;
      T+=vec3(-d.x*d.x*(a*k*sin(f)),d.x*(a*k*cos(f)),-d.x*d.y*(a*k*sin(f)));
      B+=vec3(-d.x*d.y*(a*k*sin(f)),d.y*(a*k*cos(f)),-d.y*d.y*(a*k*sin(f)));
      return vec3(d.x*a*cos(f),a*sin(f),d.y*a*cos(f));
    }
    void main(){
      vec3 p=(modelMatrix*vec4(position,1.)).xyz; vec3 T=vec3(1,0,0),B=vec3(0,0,1);
      vec3 o=vec3(0.);
      o+=gerst(normalize(vec2(1.,.35)),.38,48.,p,uTime,T,B);
      o+=gerst(normalize(vec2(.7,-.6)),.2,27.,p,uTime,T,B);
      o+=gerst(normalize(vec2(.2,1.)),.1,13.,p,uTime,T,B);
      o+=gerst(normalize(vec2(1.,.05)),.04,5.5,p,uTime,T,B);
      p+=o; vCrest=o.y; vN=normalize(cross(B,T)); vW=p; gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);
    }`,
  fragmentShader: `
    uniform vec3 uZen,uHor,uSun,uFoamPos; uniform float uTime,uFoam,uFoamR,uWake; varying vec3 vW; varying vec3 vN; varying float vCrest;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
    void main(){
      vec3 n=normalize(vN); vec3 V=normalize(cameraPosition-vW); float dist=length(cameraPosition-vW);
      float fd=length(vW.xz-uFoamPos.xz); float foamN=vn(vW.xz*.35+uTime*.3)*.6+vn(vW.xz*1.3-uTime*.5)*.4;
      float foam=uFoam*smoothstep(uFoamR,uFoamR*.25,fd)*smoothstep(.35,.7,foamN+.25);
      if(cameraPosition.y>=0.){
        float fr=.02+.98*pow(clamp(1.-max(dot(n,V),0.),0.,1.),5.);
        vec3 R=reflect(-V,n); vec3 sky=mix(uHor,uZen,pow(smoothstep(-.02,.5,R.y),.55));
        float sp=pow(max(dot(R,uSun),0.),400.)*3.+pow(max(dot(R,uSun),0.),40.)*.25;
        vec3 deep=vec3(.02,.07,.09)+uHor*.2+vec3(.0,.04,.045)*max(vCrest,0.);
        vec3 col=mix(deep,sky,fr)+vec3(1.,.55,.25)*sp;
        col=mix(col,vec3(.8,.85,.88),foam*.85);
        float fog=1.-exp(-pow(dist*.00045,2.));
        col=mix(col,uHor*.8,fog);
        gl_FragColor=vec4(col,1.);
      } else {
        // vista desde abajo: ventana de Snell brillante y reflexión total oscura
        float c=clamp(abs(dot(n,V)),0.,1.); float win=smoothstep(.55,.75,c);
        float rip=vn(vW.xz*.18+uTime*.15)*.5+vn(vW.xz*.6-uTime*.2)*.5;
        vec3 col=mix(vec3(.02,.12,.16),vec3(.45,.8,.85)*(.8+rip*.6),win);
        col+=vec3(1.,.8,.55)*pow(max(dot(-V,uSun*vec3(1.,-1.,1.)),0.),30.)*.0;
        col=mix(col,vec3(.9),foam*.9);
        float fog=1.-exp(-pow(dist*.006,2.));
        col=mix(col,vec3(.03,.16,.2),fog);
        gl_FragColor=vec4(col,1.);
      }
    }`
});
const ocean = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600, 260, 260), oceanMat);
ocean.rotation.x = -Math.PI / 2; ocean.frustumCulled = false; sea.add(ocean);


// Sistema genérico de partículas (burbujas, chorros, moléculas)
class Particles {
  constructor(n, opts = {}) {
    this.n = n; this.pos = new Float32Array(n * 3); this.col = new Float32Array(n * 3);
    this.geo = new THREE.BufferGeometry(); this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.mat = new THREE.PointsMaterial({ map: opts.map || SOFT, size: opts.size || .5, vertexColors: true, transparent: true, depthWrite: false, blending: opts.blend ?? THREE.AdditiveBlending, sizeAttenuation: true, fog: opts.fog ?? true });
    this.obj = new THREE.Points(this.geo, this.mat); this.obj.frustumCulled = false;
    const r = rng(opts.seed || 1); this.seed = new Float32Array(n * 4); for (let i = 0; i < n * 4; i++) this.seed[i] = r();
    this.k = 0;
  }
  begin() { this.k = 0; }
  push(x, y, z, r, g, b) { if (this.k >= this.n) return; const i = this.k++; this.pos.set([x, y, z], i * 3); this.col.set([r, g, b], i * 3); }
  end() { for (let i = this.k; i < this.n; i++) { this.pos[i * 3 + 1] = -99999; this.col.set([0, 0, 0], i * 3); } this.geo.attributes.position.needsUpdate = true; this.geo.attributes.color.needsUpdate = true; }
}

// ==========================================================================
// HUD (texto superpuesto con el estilo del piloto)
// ==========================================================================
function txt(s, x, y, size, opts = {}) {
  g2.save(); g2.font = `${opts.weight || 600} ${size}px ${opts.font || 'Inter'}`; g2.textAlign = opts.align || 'center'; g2.textBaseline = 'middle';
  if (opts.spacing !== undefined) g2.letterSpacing = opts.spacing + 'px';
  g2.globalAlpha = opts.alpha ?? 1; g2.shadowColor = 'rgba(0,0,0,.65)'; g2.shadowBlur = opts.shadow ?? 18;
  g2.fillStyle = opts.fill || '#fff'; g2.fillText(s, x, y); g2.restore();
}
function copperGrad(x0, x1, y, sweep) {
  const gr = g2.createLinearGradient(x0, y - 60, x1, y + 60);
  gr.addColorStop(0, '#a85a2c'); gr.addColorStop(clamp(sweep - .12), '#d98a52'); gr.addColorStop(clamp(sweep), '#ffe2c0'); gr.addColorStop(clamp(sweep + .12), '#d98a52'); gr.addColorStop(1, '#8c4722');
  return gr;
}
function project(v3) { const p = v3.clone().project(camera); return { x: (p.x * .5 + .5) * W, y: (-p.y * .5 + .5) * H, z: p.z }; }
function fmt(n) { const r = Math.round(n); return r >= 1000 ? Math.floor(r / 1000) + '.' + String(r % 1000).padStart(3, '0') : String(r); }
// Etiqueta con línea guía hacia un punto 3D
function callout(world, dx, dy, title, sub2, a, col = '#e3a372') {
  if (a <= 0.01) return; const p = project(world); if (p.z > 1) return;
  const tx = p.x + dx, ty = p.y + dy; const right = dx >= 0;
  g2.save(); g2.globalAlpha = a; g2.strokeStyle = col; g2.lineWidth = 2; g2.shadowColor = 'rgba(0,0,0,.6)'; g2.shadowBlur = 8;
  g2.beginPath(); g2.arc(p.x, p.y, 7, 0, 7); g2.stroke(); g2.fillStyle = col; g2.beginPath(); g2.arc(p.x, p.y, 3, 0, 7); g2.fill();
  const k = easeOut(clamp(a * 1.2)); g2.beginPath(); g2.moveTo(p.x, p.y); g2.lineTo(lerp(p.x, tx, k), lerp(p.y, ty, k)); g2.lineTo(lerp(p.x, tx + (right ? 40 : -40), k), lerp(p.y, ty, k)); g2.stroke(); g2.restore();
  txt(title, tx + (right ? 52 : -52), ty - 2, 25, { align: right ? 'left' : 'right', spacing: 5, alpha: a, fill: col });
  if (sub2) txt(sub2, tx + (right ? 52 : -52), ty + 34, 26, { align: right ? 'left' : 'right', weight: 300, alpha: a * .9 });
}
// Indicador de profundidad (arriba a la izquierda)
function depthHUD(d, a, hot = 0) {
  if (a <= .01) return;
  txt('PROFUNDIDAD', 80, 205, 22, { align: 'left', spacing: 7, alpha: a * .7, fill: '#e3a372' });
  txt((d > .5 ? '−' : '') + fmt(Math.max(d, 0)) + ' m', 78, 262, 64, { align: 'left', font: 'Montserrat', weight: 800, alpha: a, fill: hot > 0 ? copperGrad(60, 420, 262, hot) : '#fff' });
  // regla vertical 0–300 m
  g2.save(); g2.globalAlpha = a * .7; g2.strokeStyle = '#e3a372'; g2.lineWidth = 2; const x = 1000, y0 = 200, y1 = 760;
  g2.beginPath(); g2.moveTo(x, y0); g2.lineTo(x, y1); g2.stroke();
  for (let m = 0; m <= 300; m += 50) { const y = lerp(y0, y1, m / 300); g2.beginPath(); g2.moveTo(x - (m % 100 ? 10 : 20), y); g2.lineTo(x, y); g2.stroke(); if (m % 100 === 0) txt(m + '', x - 30, y, 18, { align: 'right', weight: 300, alpha: a * .6 }); }
  const yy = lerp(y0, y1, clamp(d / 300)); g2.fillStyle = '#ffe2c0'; g2.beginPath(); g2.moveTo(x + 4, yy); g2.lineTo(x + 22, yy - 10); g2.lineTo(x + 22, yy + 10); g2.fill(); g2.restore();
}
function arrow2D(x, y0, y1, a, col) {
  if (a <= .01) return; const d = Math.sign(y1 - y0); const yy = lerp(y0, y1, easeOut(clamp(a)));
  g2.save(); g2.globalAlpha = a; g2.strokeStyle = col; g2.fillStyle = col; g2.lineWidth = 16; g2.shadowColor = col; g2.shadowBlur = 25;
  g2.beginPath(); g2.moveTo(x, y0); g2.lineTo(x, yy - d * 40); g2.stroke();
  g2.beginPath(); g2.moveTo(x - 38, yy - d * 50); g2.lineTo(x + 38, yy - d * 50); g2.lineTo(x, yy + d * 10); g2.fill(); g2.restore();
}
function titleHUD(top, big, a, y = 1540) {
  if (a <= .01) return;
  txt(top, W / 2, y, 24, { spacing: 8, alpha: a * .8, fill: '#e3a372' });
  txt(big, W / 2, y + 58, 54, { font: 'Montserrat', weight: 800, alpha: a, spacing: 1 });
}
function bar(x, y, w, frac, label, val, a, col = '#e3a372') {
  if (a <= .01) return;
  txt(label, x, y - 30, 22, { align: 'left', spacing: 5, alpha: a * .75 });
  g2.save(); g2.globalAlpha = a * .25; g2.fillStyle = '#ffffff'; g2.fillRect(x, y, w, 16); g2.globalAlpha = a; g2.fillStyle = col; g2.fillRect(x, y, w * clamp(frac), 16); g2.restore();
  txt(val, x + w, y - 30, 30, { align: 'right', font: 'Montserrat', weight: 800, alpha: a });
}


// Emisores de partículas deterministas (coordenadas de mundo)
const fract = x => x - Math.floor(x);
function emitRise(P, p0, n, t, spread, rise, life, col, seedOff = 0) {
  for (let i = 0; i < n; i++) { const s = P.seed, k = ((i + seedOff) % P.n) * 4; const age = fract(s[k] + t / life); const a = s[k + 1] * 6.283, r = Math.sqrt(s[k + 2]) * spread;
    const f = 1 - age; P.push(p0.x + Math.cos(a) * r + Math.sin(t * 3 + i) * .15 * age, p0.y + age * rise, p0.z + Math.sin(a) * r, col[0] * f, col[1] * f, col[2] * f); }
}
function emitJet(P, p0, dir, n, t, speed, spread, life, col, grav = 0, seedOff = 0) {
  for (let i = 0; i < n; i++) { const s = P.seed, k = ((i + seedOff) % P.n) * 4; const age = fract(s[k] + t / life); const tt = age * life;
    const jx = (s[k + 1] - .5) * spread, jy = (s[k + 2] - .5) * spread, jz = (s[k + 3] - .5) * spread; const f = Math.pow(1 - age, 1.2);
    P.push(p0.x + (dir.x * speed + jx) * tt, p0.y + (dir.y * speed + jy) * tt - grav * tt * tt * .5, p0.z + (dir.z * speed + jz) * tt, col[0] * f, col[1] * f, col[2] * f); }
}
function emitCurveW(P, curve, n, t, speed, col, jitter = .12, seedOff = 0, xf = null) {
  for (let i = 0; i < n; i++) { const s = P.seed, k = ((i + seedOff) % P.n) * 4; const u = fract(s[k] + t * speed); const p = curve.getPointAt(u); const w = xf ? xf(p.clone()) : p;
    P.push(w.x + (s[k + 1] - .5) * jitter, w.y + (s[k + 2] - .5) * jitter, w.z + (s[k + 3] - .5) * jitter, col[0], col[1], col[2]); }
}
function camOrbit(target, dist, az, el, fov = 35) {
  camera.position.set(target.x + Math.sin(az) * Math.cos(el) * dist, target.y + Math.sin(el) * dist, target.z + Math.cos(az) * Math.cos(el) * dist);
  camera.fov = fov; camera.lookAt(target);
}
// Flecha 2D genérica entre dos puntos de pantalla
function arrowXY(x0, y0, x1, y1, a, col, w = 14) {
  if (a <= .01) return; const k = easeOut(clamp(a)); const x = lerp(x0, x1, k), y = lerp(y0, y1, k); const ang = Math.atan2(y - y0, x - x0); const L = Math.hypot(x - x0, y - y0); if (L < 4) return;
  g2.save(); g2.globalAlpha = clamp(a); g2.strokeStyle = col; g2.fillStyle = col; g2.lineWidth = w; g2.shadowColor = col; g2.shadowBlur = 22; g2.lineCap = 'round';
  const hx = x - Math.cos(ang) * w * 2.6, hy = y - Math.sin(ang) * w * 2.6;
  g2.beginPath(); g2.moveTo(x0, y0); g2.lineTo(hx, hy); g2.stroke();
  g2.beginPath(); g2.moveTo(x, y); g2.lineTo(hx + Math.cos(ang + Math.PI / 2) * w * 2, hy + Math.sin(ang + Math.PI / 2) * w * 2); g2.lineTo(hx - Math.cos(ang + Math.PI / 2) * w * 2, hy - Math.sin(ang + Math.PI / 2) * w * 2); g2.fill(); g2.restore();
}
// Etiqueta de dato grande (número + unidad) al estilo del submarino
function bigStat(top, value, y, a, sweep = .5) {
  if (a <= .01) return;
  txt(top, W / 2, y - 100, 24, { spacing: 7, alpha: a * .8, fill: '#e3a372' });
  txt(value, W / 2, y, 112, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(200, 880, y, sweep), spacing: 2 });
}
// Logotipo final (idéntico al submarino)
function drawBrand(lk) {
  const a = smooth(-.2, .6, lk), sp = lerp(60, 14, easeOut(clamp(lk / 1.6))), sweep = clamp((lk - .3) / 1.4) * 1.3 - .15;
  if (lk <= -.3) return;
  g2.save(); g2.globalAlpha = a; g2.strokeStyle = copperGrad(440, 640, 590, sweep); g2.lineWidth = 5;
  g2.beginPath(); g2.arc(W / 2, 590, 70, Math.PI * .15, Math.PI * (.15 + 1.7 * easeOut(clamp(lk / 1.2)))); g2.stroke();
  g2.fillStyle = '#ffe2c0'; g2.shadowColor = 'rgba(255,170,100,.9)'; g2.shadowBlur = 30; g2.beginPath(); g2.arc(W / 2 + 18, 582, 14, 0, Math.PI * 2); g2.fill(); g2.restore();
  txt(BRAND, W / 2, 790, BRAND.length > 11 ? 104 : 112, { font: 'Montserrat', weight: 800, spacing: sp, alpha: a, fill: copperGrad(140, 940, 790, sweep), shadow: 30 });
  const ta = smooth(.9, 1.6, lk);
  g2.save(); g2.globalAlpha = ta * .7; g2.fillStyle = '#d98a52'; g2.fillRect(W / 2 - 90 * ta, 880, 180 * ta, 2); g2.restore();
  txt(TAG, W / 2, 940, 40, { weight: 300, spacing: 3, alpha: ta * .9 });
}
// Portada estándar de la serie
function coverText(l1, l2, sub) {
  g2.clearRect(0, 0, W, H);
  const gr = g2.createLinearGradient(0, 0, 0, 900); gr.addColorStop(0, 'rgba(2,6,14,.88)'); gr.addColorStop(1, 'rgba(2,6,14,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, W, 900);
  txt(BRAND, W / 2, 210, 30, { font: 'Montserrat', weight: 800, spacing: 14, fill: '#e3a372' });
  txt(l1, W / 2, 400, l1.length > 15 ? 84 : 92, { font: 'Montserrat', weight: 800, spacing: 2, fill: '#ffffff', shadow: 30 });
  txt(l2, W / 2, 515, l2.length > 15 ? 88 : 100, { font: 'Montserrat', weight: 800, spacing: 2, fill: copperGrad(120, 960, 520, .5), shadow: 30 });
  g2.save(); g2.globalAlpha = .7; g2.fillStyle = '#d98a52'; g2.fillRect(W / 2 - 90, 610, 180, 3); g2.restore();
  txt(sub, W / 2, 670, 36, { weight: 300, spacing: 1 });
}
// Composición final del fotograma
function finish(scene, o) {
  camera.aspect = W / H; camera.updateProjectionMatrix();
  renderPass.scene = scene; bloom.strength = o.bloom ?? .6;
  gradePass.uniforms.uTime.value = o.t; gradePass.uniforms.uFlash.value = o.flash || 0; gradePass.uniforms.uCA.value = o.ca ?? .0013;
  gradePass.uniforms.uFade.value = o.fade || 0; gradePass.uniforms.uGrain.value = o.grain ?? .035;
  renderer.toneMappingExposure = o.expo ?? 1;
  composer.render();
}
export { THREE, mergeGeometries, W, H, P, SCALE, BRAND, TAG, TL, clamp, lerp, smooth, easeInOut, easeOut, easeIn, rng, noise1, shake, V3,
  renderer, overlay, g2, camera, composer, renderPass, bloom, gradePass, glowTexture, SOFT, BUBBLE, TILE,
  sea, U, skyCol, SUN_DIR, skyDome, abyss, oceanMat, ocean, Particles, txt, copperGrad, project, fmt, callout, arrow2D, titleHUD, bar,
  fract, emitRise, emitJet, emitCurveW, camOrbit, arrowXY, bigStat, drawBrand, coverText, finish };
