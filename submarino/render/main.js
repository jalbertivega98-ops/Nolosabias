// NO LO SABÍAS — "¿Cómo funciona realmente un submarino?"
// Escena 3D programada con Three.js. Render determinista fotograma a fotograma:
// window.renderFrame(t) dibuja el instante t (segundos) del vídeo final.
// Submarino de referencia: SNA de ataque tipo Suffren (99,5 m, 8,8 m de diámetro,
// 5.200 t en inmersión, inmersión > 300 m según el Ministerio de Defensa francés).
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

// ==========================================================================
// ESCENA MARINA (superficie + columna de agua)
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

// Luces
const hemi = new THREE.HemisphereLight(0x8fc4d8, 0x02060a, .8); sea.add(hemi);
const sunL = new THREE.DirectionalLight(0xbfe6ff, 2.2); sunL.position.set(-30, 100, -20); sea.add(sunL); sea.add(sunL.target);
const rimL = new THREE.DirectionalLight(0x6fb6ff, 1.0); rimL.position.set(40, 10, -80); sea.add(rimL);
const fillL = new THREE.PointLight(0xffd2a8, 0, 260, 1.4); sea.add(fillL);
const keyL = new THREE.DirectionalLight(0xcfe6ff, 1.2); sea.add(keyL); sea.add(keyL.target);
const innerL = [V3(30, 1.5, 0), V3(12, 1.5, 0), V3(-6, 1.8, 0), V3(-22, 1.5, 0)].map(p => { const l = new THREE.PointLight(0xffe0c0, 0, 40, 1.2); l.position.copy(p); return l; });

// Rayos de luz (god rays) desde la superficie
function rayTexture() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d');
  const gr = x.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 256);
  const g = x.getImageData(0, 0, 64, 256); for (let i = 0; i < 64; i++) { const k = Math.pow(Math.sin(i / 63 * Math.PI), 2); for (let j = 0; j < 256; j++) g.data[(j * 64 + i) * 4 + 3] *= k; }
  x.putImageData(g, 0, 0); return new THREE.CanvasTexture(c);
}
const RAY = rayTexture();
const rays = new THREE.Group(); sea.add(rays);
{ const r = rng(9); for (let i = 0; i < 26; i++) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(6 + r() * 14, 260), new THREE.MeshBasicMaterial({ map: RAY, color: new THREE.Color(.35, .75, .8), transparent: true, opacity: .05 + r() * .06, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  m.position.set((r() - .5) * 240, -130, (r() - .5) * 240); m.rotation.y = r() * Math.PI; m.rotation.z = (r() - .5) * .25; m.userData = { ph: r() * 6.28, base: m.material.opacity, x0: m.position.x }; rays.add(m);
} }

// Nieve marina (partículas en suspensión alrededor de la cámara)
const SNOW_N = 5000, SNOW_R = 70;
const snowPos = new Float32Array(SNOW_N * 3); const snowSeed = new Float32Array(SNOW_N * 4);
{ const r = rng(21); for (let i = 0; i < SNOW_N; i++) snowSeed.set([r(), r(), r(), r()], i * 4); }
const snowGeo = new THREE.BufferGeometry(); snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
const snowMat = new THREE.PointsMaterial({ map: SOFT, size: .35, color: new THREE.Color(.55, .75, .75), transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, fog: true });
const snow = new THREE.Points(snowGeo, snowMat); snow.frustumCulled = false; sea.add(snow);
function updateSnow(t) {
  const c = camera.position, D = SNOW_R * 2;
  for (let i = 0; i < SNOW_N; i++) {
    const s = i * 4;
    let x = snowSeed[s] * D + Math.sin(t * .3 + i) * .4, y = snowSeed[s + 1] * D - t * (.25 + snowSeed[s + 3] * .3), z = snowSeed[s + 2] * D;
    x = ((x - c.x) % D + D) % D - SNOW_R + c.x; y = ((y - c.y) % D + D) % D - SNOW_R + c.y; z = ((z - c.z) % D + D) % D - SNOW_R + c.z;
    snowPos[i * 3] = x; snowPos[i * 3 + 1] = Math.min(y, -.5); snowPos[i * 3 + 2] = z;
  }
  snowGeo.attributes.position.needsUpdate = true;
}

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
// SUBMARINO (unidades en metros; eje x = proa, y = arriba)
// ==========================================================================
const R = 4.4, X_BOW = 49.5, X_STERN = -50;
function hullR(x) {
  if (x >= 37) { const u = clamp((x - 37) / (X_BOW - 37)); return R * Math.pow(1 - Math.pow(u, 2.1), 1 / 2.1); }
  if (x >= -18) return R;
  const u = clamp((-18 - x) / (-18 - X_STERN)); return R - (R - 1.25) * Math.pow(u, 1.55);
}
function latheAlong(x0, x1, rf, n = 120, seg = 96, close0 = false, close1 = false) {
  const pts = [];
  if (close0 && rf(x0) > .02) pts.push(new THREE.Vector2(0.001, x0 - .001));
  for (let i = 0; i <= n; i++) { const x = lerp(x0, x1, i / n); pts.push(new THREE.Vector2(Math.max(rf(x), 0.001), x)); }
  if (close1 && rf(x1) > .02) pts.push(new THREE.Vector2(0.001, x1 + .001));
  const g = new THREE.LatheGeometry(pts, seg); g.rotateZ(-Math.PI / 2); return g;
}

const sub = new THREE.Group(); sea.add(sub);
const subBody = new THREE.Group(); sub.add(subBody);   // casco exterior y apéndices

// Material del casco: losetas anecoicas + cáusticas de la superficie
const causticChunk = {
  vertex: ['#include <worldpos_vertex>', '#include <worldpos_vertex>\n vCW=(modelMatrix*vec4(transformed,1.)).xyz;'],
  fragment: ['#include <dithering_fragment>', `#include <dithering_fragment>
    { vec2 p=vCW.xz*.12; float c=0.; for(int i=0;i<3;i++){ p+=vec2(sin(p.y*1.7+uCTime*.6),cos(p.x*1.3-uCTime*.5)); c+=pow(abs(sin(p.x+p.y)),8.); }
      vec3 wn=normalize((vec4(normal,0.)*viewMatrix).xyz);
      float k=uCaustic*exp(vCW.y/45.)*max(wn.y,0.);
      gl_FragColor.rgb+=vec3(.35,.7,.75)*c*k*.12; }`]
};
function causticMat(params) {
  const m = new THREE.MeshStandardMaterial(params);
  m.onBeforeCompile = sh => {
    sh.uniforms.uCTime = U.uTime; sh.uniforms.uCaustic = U.uCaustic;
    sh.vertexShader = 'varying vec3 vCW;\n' + sh.vertexShader.replace(...causticChunk.vertex);
    sh.fragmentShader = 'varying vec3 vCW; uniform float uCTime,uCaustic;\n' + sh.fragmentShader.replace(...causticChunk.fragment);
  };
  return m;
}
const tileMap = TILE.clone(); tileMap.repeat.set(30, 90); tileMap.needsUpdate = true;
const hullMat = causticMat({ color: 0x464c54, roughness: .62, metalness: .3, bumpMap: tileMap, bumpScale: .6, roughnessMap: tileMap, transparent: true, opacity: 1 });
const hullGeo = latheAlong(X_STERN, X_BOW, hullR, 180, 112, false, true);
const hull = new THREE.Mesh(hullGeo, hullMat); subBody.add(hull);

// Vela (torreta)
function sailGeo() {
  const s = new THREE.Shape(); s.moveTo(-6.5, 0); s.lineTo(-6.5, 5.6); s.quadraticCurveTo(-6.4, 6.4, -5.4, 6.4); s.lineTo(3.2, 6.4); s.quadraticCurveTo(6.4, 6.2, 6.6, 3); s.lineTo(6.9, 0); s.lineTo(-6.5, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 1.7, bevelEnabled: true, bevelThickness: .25, bevelSize: .25, bevelSegments: 3, curveSegments: 16 });
  g.translate(0, 0, -.85); return g;
}
const sailMat = causticMat({ color: 0x464c54, roughness: .5, metalness: .35, transparent: true, opacity: 1 });
const sail = new THREE.Mesh(sailGeo(), sailMat); sail.position.set(22, 3.7, 0); subBody.add(sail);
// mástiles (periscopio / esnórquel), ocultos en la vela salvo cuando se usan
const mastMat = new THREE.MeshStandardMaterial({ color: 0x30353b, roughness: .5, metalness: .6, transparent: true });
const snorkel = new THREE.Group(); sail.add(snorkel);
{ const m = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, 7, 16), mastMat); m.position.y = 3.5; snorkel.add(m);
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.2, .9), mastMat); head.position.y = 7.2; snorkel.add(head); snorkel.position.set(-3.5, 0, 0); }

// Timones en X (popa)
function finShape(len, span, sweep) { const s = new THREE.Shape(); s.moveTo(-len / 2, 0); s.lineTo(-len / 2 + sweep, span); s.lineTo(len / 2 - .6, span); s.lineTo(len / 2, 0); s.lineTo(-len / 2, 0); return s; }
const finGeo = new THREE.ExtrudeGeometry(finShape(6.5, 4.6, 1.6), { depth: .34, bevelEnabled: true, bevelThickness: .06, bevelSize: .06, bevelSegments: 1 }); finGeo.translate(0, 0, -.17);
const fins = [];
for (let k = 0; k < 4; k++) {
  const roll = new THREE.Group(); roll.position.x = -42.5; roll.rotation.x = Math.PI / 4 + k * Math.PI / 2; subBody.add(roll);
  const hinge = new THREE.Group(); hinge.position.y = 1.9; roll.add(hinge);
  const m = new THREE.Mesh(finGeo, hullMat); hinge.add(m); fins.push({ hinge, sign: (k === 0 || k === 3) ? 1 : -1 });
}
// Timones de profundidad de proa (retráctiles)
const bowPlanes = [];
for (const s of [1, -1]) {
  const piv = new THREE.Group(); piv.position.set(34, 1.2, s * R * .98); subBody.add(piv);
  const pg = new THREE.ExtrudeGeometry(finShape(3.4, 3.2, .8), { depth: .26, bevelEnabled: false }); pg.translate(0, 0, -.13);
  const m = new THREE.Mesh(pg, hullMat); m.rotation.x = s * Math.PI / 2; piv.add(m); bowPlanes.push(piv);
}
// Hidrojet (pump-jet) de popa
const pjMat = new THREE.MeshStandardMaterial({ color: 0x1f2328, roughness: .55, metalness: .5, side: THREE.DoubleSide, transparent: true });
const pumpjet = new THREE.Group(); subBody.add(pumpjet);
{ const sh = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 1.75, 3.6, 48, 1, true), pjMat); sh.rotation.z = Math.PI / 2; sh.position.x = -49.2; pumpjet.add(sh);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(2.1, .14, 10, 48), pjMat); lip.rotation.y = Math.PI / 2; lip.position.x = -47.4; pumpjet.add(lip);
  const hub = new THREE.Mesh(new THREE.ConeGeometry(1.1, 3.2, 24), pjMat); hub.rotation.z = Math.PI / 2; hub.position.x = -51.4; pumpjet.add(hub);
  for (let i = 0; i < 6; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(2.6, .12, .9), pjMat); st.position.x = -49.2; st.rotation.x = i * Math.PI / 3; st.translateY(1.35); pumpjet.add(st); } }
// Hélice (solo para la versión convencional)
const propeller = new THREE.Group(); propeller.position.x = -51; subBody.add(propeller); propeller.visible = false;
{ const bs = new THREE.Shape(); bs.moveTo(0, 0); bs.bezierCurveTo(.9, .9, 1.1, 2.4, .3, 3.1); bs.bezierCurveTo(-.4, 2.6, -.6, 1, 0, 0);
  const bg = new THREE.ExtrudeGeometry(bs, { depth: .1, bevelEnabled: false });
  for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(bg, pjMat); b.rotation.y = Math.PI / 2 + .5; const r = new THREE.Group(); r.rotation.x = i * Math.PI * 2 / 7; r.add(b); propeller.add(r); }
  const hb = new THREE.Mesh(new THREE.ConeGeometry(.8, 2.2, 20), pjMat); hb.rotation.z = Math.PI / 2; hb.position.x = -.9; propeller.add(hb); }

// --------------------------------------------------------------------------
// Vista de rayos X: casco ligero transparente con rejilla y borde luminoso
// --------------------------------------------------------------------------
const xrayMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  uniforms: { uA: { value: 0 }, uCol: { value: new THREE.Color(.35, .75, 1.0) }, uTime: U.uTime },
  vertexShader: `varying vec3 vN; varying vec3 vW; varying vec3 vL; void main(){ vL=position; vN=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `uniform float uA,uTime; uniform vec3 uCol; varying vec3 vN; varying vec3 vW; varying vec3 vL;
    void main(){ vec3 V=normalize(cameraPosition-vW); float f=pow(clamp(1.-abs(dot(normalize(vN+vec3(1e-5)),V)),0.,1.),2.2);
      float gx=smoothstep(.06,.0,abs(fract(vL.x/2.5)-.5)-.44); float ang=atan(vL.z,vL.y)/6.2831*28.; float gy=smoothstep(.06,0.,abs(fract(ang)-.5)-.44);
      float scan=smoothstep(.0,.6,sin(vL.x*.15-uTime*2.)*.5+.5)*.15;
      float a=(f*.42+max(gx,gy)*.12+scan*.12+.025)*uA; gl_FragColor=vec4(uCol*a,1.); }`
});
const xrayHull = new THREE.Mesh(hullGeo, xrayMat); subBody.add(xrayHull);
const xraySail = new THREE.Mesh(sail.geometry, xrayMat); xraySail.position.copy(sail.position); subBody.add(xraySail);

// --------------------------------------------------------------------------
// Interior (visible en los cortes)
// --------------------------------------------------------------------------
const inner = new THREE.Group(); sub.add(inner); innerL.forEach(l => inner.add(l));
const PH = { x0: -30, x1: 37, r: 3.85 };   // casco resistente
function phR(x) { const e = 3.2; if (x > PH.x1 - e) return PH.r * Math.sqrt(Math.max(0, 1 - Math.pow((x - (PH.x1 - e)) / e, 2))); if (x < PH.x0 + e) return PH.r * Math.sqrt(Math.max(0, 1 - Math.pow(((PH.x0 + e) - x) / e, 2))); return PH.r; }
const phMat = new THREE.MeshStandardMaterial({ color: 0x8a9096, roughness: .42, metalness: .45, emissive: new THREE.Color(1, .45, .18), emissiveIntensity: 0, transparent: true, opacity: 1, side: THREE.DoubleSide });
const phGeo = latheAlong(PH.x0, PH.x1, phR, 140, 72, true, true);
const pressureHull = new THREE.Mesh(phGeo, phMat); inner.add(pressureHull);
// Cuadernas (anillos de refuerzo)
const frames = new THREE.InstancedMesh(new THREE.TorusGeometry(PH.r - .05, .12, 6, 64), new THREE.MeshStandardMaterial({ color: 0xb87a4a, roughness: .4, metalness: .8, emissive: new THREE.Color(1, .5, .2), emissiveIntensity: .3, transparent: true }), 26);
{ const M = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)); let k = 0; for (let x = PH.x0 + 3.5; x < PH.x1 - 3.3 && k < 26; x += 2.5) { M.compose(V3(x, 0, 0), q, V3(1, 1, 1)); frames.setMatrixAt(k++, M); } frames.count = k; }
inner.add(frames);
// Cubierta interior (suelo)
const deck = new THREE.Mesh(new THREE.BoxGeometry(PH.x1 - PH.x0 - 6, .12, 5.6), new THREE.MeshStandardMaterial({ color: 0x3a3f45, roughness: .6, metalness: .5, transparent: true }));
deck.position.set((PH.x0 + PH.x1) / 2, -1.1, 0); inner.add(deck);

// Agua que llena un volumen (tanques): nivel en coordenadas de mundo
function tankMat(col = new THREE.Color(.08, .45, .75)) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uLevel: { value: -1e4 }, uA: { value: 0 }, uCol: { value: col }, uTime: U.uTime, uGlow: { value: 1 } },
    vertexShader: `varying vec3 vW; varying vec3 vN; void main(){ vN=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform float uLevel,uA,uTime,uGlow; uniform vec3 uCol; varying vec3 vW; varying vec3 vN;
      void main(){ vec3 V=normalize(cameraPosition-vW); float f=pow(clamp(1.-abs(dot(normalize(vN+vec3(1e-5)),V)),0.,1.),2.);
        float lv=uLevel+sin(vW.x*1.3+uTime*5.)*.06+sin(vW.z*2.+uTime*4.)*.05;
        float wet=step(vW.y,lv); float line=smoothstep(.18,0.,abs(vW.y-lv));
        vec3 water=uCol*(.55+f*.9)+vec3(.5,.9,1.)*line*1.8*uGlow;
        vec3 air=vec3(.6,.85,1.)*(f*.5+.05);
        vec3 col=mix(air,water,wet); float a=mix(.12+f*.3,.62+f*.3,wet)*uA; a=max(a,line*uA);
        gl_FragColor=vec4(col,a); }`
  });
}
// Tanques de lastre principales (entre el casco ligero y el resistente, a proa y popa)
const ballastF = new THREE.Mesh(latheAlong(PH.x1 + .4, 46.5, x => hullR(x) * .93, 40, 48, true, true), tankMat());
const ballastA = new THREE.Mesh(latheAlong(-40.5, PH.x0 - .4, x => hullR(x) * .93, 40, 48, true, true), tankMat());
inner.add(ballastF, ballastA);
// Válvulas de ventilación (arriba) y botellas de aire a alta presión
const ventMat = new THREE.MeshStandardMaterial({ color: 0xd0d6dc, roughness: .3, metalness: .9, emissive: new THREE.Color(1, .55, .25), emissiveIntensity: 0, transparent: true });
const VENTS = [V3(41, 0, 0), V3(-35.5, 0, 0)];
for (const v of VENTS) { const m = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, 1.2, 16), ventMat); m.position.set(v.x, hullR(v.x) - .2, 0); inner.add(m); }
const hpMat = new THREE.MeshStandardMaterial({ color: 0x3f8f5a, roughness: .35, metalness: .7, emissive: new THREE.Color(.3, 1, .5), emissiveIntensity: 0, transparent: true });
const hpBottles = new THREE.Group(); inner.add(hpBottles);
for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.CapsuleGeometry(.35, 2.6, 4, 12), hpMat); m.rotation.z = Math.PI / 2; m.position.set(31 - (i % 3) * 3.1, -2.4, i < 3 ? 1.2 : -1.2); hpBottles.add(m); }
// Tanques de compensación / trimado y tubería entre ellos
const trimF = new THREE.Mesh(new THREE.BoxGeometry(3, 1.8, 3.4), tankMat(new THREE.Color(.1, .55, .7))); trimF.position.set(32.5, -2.2, 0);
const trimA = new THREE.Mesh(new THREE.BoxGeometry(3, 1.8, 3.4), tankMat(new THREE.Color(.1, .55, .7))); trimA.position.set(-25.5, -2.2, 0);
inner.add(trimF, trimA);
const pipeMat = new THREE.MeshStandardMaterial({ color: 0x8a9096, roughness: .4, metalness: .8, emissive: new THREE.Color(.2, .6, 1), emissiveIntensity: 0, transparent: true });
const trimPipe = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, 58, 10), pipeMat); trimPipe.rotation.z = Math.PI / 2; trimPipe.position.set(3.5, -3.1, 0); inner.add(trimPipe);

// Planta de propulsión nuclear: reactor, generador de vapor, turbinas, eje
const reactorG = new THREE.Group(); inner.add(reactorG);
const reactorMat = new THREE.MeshStandardMaterial({ color: 0x8c949c, roughness: .3, metalness: .9, emissive: new THREE.Color(1, .5, .2), emissiveIntensity: 0, transparent: true });
const reactorVessel = new THREE.Mesh(new THREE.CapsuleGeometry(1.3, 2.4, 6, 24), reactorMat); reactorVessel.position.set(-6.5, .4, 0); reactorG.add(reactorVessel);
const coreGlow = new THREE.Mesh(new THREE.CylinderGeometry(.75, .75, 1.6, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 1.5, .6), transparent: true, opacity: 0, toneMapped: false }));
coreGlow.position.copy(reactorVessel.position); reactorG.add(coreGlow);
const sgen = new THREE.Mesh(new THREE.CapsuleGeometry(.8, 2.8, 6, 20), reactorMat); sgen.position.set(-2.6, .6, 1.2); reactorG.add(sgen);
const turbMat = new THREE.MeshStandardMaterial({ color: 0x9aa3ac, roughness: .3, metalness: .9, emissive: new THREE.Color(.4, .8, 1), emissiveIntensity: 0, transparent: true });
const turbines = [];
for (const z of [1.25, -1.25]) {
  const g = new THREE.Group(); g.position.set(-17, .2, z); reactorG.add(g);
  const casing = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.25, 4.2, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0x6b737b, roughness: .4, metalness: .8, transparent: true, opacity: .35, side: THREE.DoubleSide })); casing.rotation.z = Math.PI / 2; g.add(casing);
  const rotor = new THREE.Group(); g.add(rotor);
  for (let s = 0; s < 4; s++) for (let b = 0; b < 14; b++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(.08, .85 + s * .08, .22), turbMat); const rr = new THREE.Group(); rr.position.x = -1.5 + s * 1.0; rr.rotation.x = b / 14 * Math.PI * 2; bl.position.y = .5; bl.rotation.y = .5; rr.add(bl); rotor.add(rr); }
  turbines.push(rotor);
}
const shaftMat = new THREE.MeshStandardMaterial({ color: 0xa8b0b8, roughness: .25, metalness: .95, emissive: new THREE.Color(.4, .8, 1), emissiveIntensity: 0, transparent: true });
const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, 31, 16), shaftMat); shaft.rotation.z = Math.PI / 2; shaft.position.set(-35, 0, 0); reactorG.add(shaft);
const motor = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 2.6, 28), turbMat); motor.rotation.z = Math.PI / 2; motor.position.set(-22.5, 0, 0); reactorG.add(motor);
// tuberías de vapor (curvas) para el flujo de partículas
const steamCurve = new THREE.CatmullRomCurve3([V3(-6.5, 1.9, 0), V3(-5, 2.6, .6), V3(-2.6, 2.4, 1.2), V3(-2.6, 2.6, 1.2), V3(-8, 2.9, 1.1), V3(-13, 2.6, 1.2), V3(-14.8, .2, 1.25)]);
const primaryCurve = new THREE.CatmullRomCurve3([V3(-6.5, -.8, 0), V3(-4.6, -1.2, .6), V3(-2.6, -.9, 1.2), V3(-2.6, .6, 1.2), V3(-4.8, 1.5, .5), V3(-6.5, 1.6, 0)], true);
const steamTube = new THREE.Mesh(new THREE.TubeGeometry(steamCurve, 60, .22, 8), pipeMat); reactorG.add(steamTube);

// Baterías (convencional: también las lleva el nuclear como respaldo)
const batt = new THREE.InstancedMesh(new THREE.BoxGeometry(.5, .9, .5), new THREE.MeshStandardMaterial({ color: 0x2c3b33, roughness: .5, metalness: .4, emissive: new THREE.Color(.25, 1, .45), emissiveIntensity: 0, transparent: true }), 240);
{ const M = new THREE.Matrix4(); let k = 0; for (let i = 0; i < 30; i++) for (let j = 0; j < 8; j++) { M.makeTranslation(18 - i * .62, -2.15, -2.3 + j * .62); batt.setMatrixAt(k++, M); } }
inner.add(batt);

// Soporte vital: electrolizador (O2), depurador de CO2, destilador
const lifeG = new THREE.Group(); lifeG.position.set(8, 0, 0); inner.add(lifeG);
const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x6f9fb8, roughness: .1, metalness: 0, transmission: 0, transparent: true, opacity: .12, side: THREE.DoubleSide, depthWrite: false });
const eCell = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.0, 1.6), glassMat); eCell.position.set(0, .2, 0); lifeG.add(eCell);
const eWater = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.5, 1.5), new THREE.MeshBasicMaterial({ color: new THREE.Color(.05, .3, .5), transparent: true, opacity: .5, depthWrite: false })); eWater.position.set(0, -.05, 0); lifeG.add(eWater);
const elecMat = new THREE.MeshStandardMaterial({ color: 0xc8a070, roughness: .3, metalness: .9, emissive: new THREE.Color(1, .55, .25), emissiveIntensity: 0, transparent: true });
const elecMinus = new THREE.Mesh(new THREE.BoxGeometry(.12, 1.7, 1.1), elecMat); elecMinus.position.set(-.75, .1, 0); lifeG.add(elecMinus);
const elecPlus = new THREE.Mesh(new THREE.BoxGeometry(.12, 1.7, 1.1), elecMat); elecPlus.position.set(.75, .1, 0); lifeG.add(elecPlus);
const scrubber = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, 2.6, 24), new THREE.MeshStandardMaterial({ color: 0x5a6670, roughness: .4, metalness: .7, emissive: new THREE.Color(.9, .5, .2), emissiveIntensity: 0, transparent: true }));
scrubber.position.set(4.2, .4, -1.2); lifeG.add(scrubber);
const still = new THREE.Mesh(new THREE.CylinderGeometry(.7, .7, 2.2, 20), new THREE.MeshStandardMaterial({ color: 0x7c8a96, roughness: .3, metalness: .8, emissive: new THREE.Color(.3, .7, 1), emissiveIntensity: 0, transparent: true }));
still.position.set(-4, .3, 1.3); lifeG.add(still);

// Sala de control bajo la vela y sonar de proa
const ctrlMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, .25, .15), transparent: true, opacity: 0, toneMapped: false });
const ctrl = new THREE.Group(); ctrl.position.set(22, 0, 0); inner.add(ctrl);
for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .7), ctrlMat); s.position.set(-3 + i * 1.3, .4, 2.6); ctrl.add(s); }
const sonarArr = new THREE.InstancedMesh(new THREE.SphereGeometry(.12, 6, 4), new THREE.MeshBasicMaterial({ color: new THREE.Color(.6, 1.6, 2.2), transparent: true, opacity: 0, toneMapped: false }), 300);
{ const M = new THREE.Matrix4(); let k = 0; for (let i = 0; i < 12; i++) for (let j = 0; j < 25; j++) { const x = 41 + i * .55; const r = hullR(x) * .88; const a = j / 25 * Math.PI * 2; M.makeTranslation(x, Math.cos(a) * r, Math.sin(a) * r); sonarArr.setMatrixAt(k++, M); } }
inner.add(sonarArr);

// Flechas de presión (alrededor del casco, apuntando hacia dentro)
const arrowGeo = (() => { const s = new THREE.CylinderGeometry(.09, .09, 1.6, 8); s.translate(0, 1.9, 0); const h = new THREE.ConeGeometry(.32, .9, 12); h.rotateX(Math.PI); h.translate(0, .65, 0); return mergeGeometries([s, h]); })();
const PARR_N = 220;
const pArrows = new THREE.InstancedMesh(arrowGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.1, .45), transparent: true, opacity: 0, toneMapped: false, depthWrite: false }), PARR_N);
pArrows.frustumCulled = false; sub.add(pArrows);
const pArrSeeds = []; { const r = rng(33); for (let i = 0; i < PARR_N; i++) pArrSeeds.push({ x: lerp(-38, 44, (i + r() * .5) / PARR_N), a: r() * Math.PI * 2, ph: r() }); }
function updatePressureArrows(t, amt, squeeze = 0) {
  const M = new THREE.Matrix4(), q = new THREE.Quaternion();
  for (let i = 0; i < PARR_N; i++) {
    const s = pArrSeeds[i]; const r = hullR(s.x) * (1 - squeeze);
    const n = V3(0, Math.cos(s.a), Math.sin(s.a)); const pulse = .6 + .4 * Math.sin(t * 6 - s.ph * 6.28);
    const off = r + .2 + (1 - pulse) * .8;
    q.setFromUnitVectors(V3(0, 1, 0), n); M.compose(V3(s.x, n.y * off, n.z * off), q, V3(1, 1, 1).multiplyScalar(amt * (.75 + .25 * pulse) + 1e-4)); pArrows.setMatrixAt(i, M);
  }
  pArrows.instanceMatrix.needsUpdate = true; pArrows.material.opacity = clamp(amt);
}
// Flechas de Arquímedes (peso y empuje)
function bigArrow(color) {
  const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, toneMapped: false, depthWrite: false });
  const s = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, 14, 16), m); s.position.y = 7; g.add(s);
  const h = new THREE.Mesh(new THREE.ConeGeometry(1.6, 4, 24), m); h.position.y = 16; g.add(h); g.userData.mat = m; return g;
}
const arrUp = bigArrow(new THREE.Color(.5, 1.4, 2.4)); const arrDown = bigArrow(new THREE.Color(2.4, 1.1, .45)); arrDown.rotation.z = Math.PI;
sub.add(arrUp, arrDown);

// Partículas compartidas
const bubbles = new Particles(4000, { map: BUBBLE, size: .55, seed: 5, blend: THREE.NormalBlending }); sea.add(bubbles.obj);
const glowP = new Particles(5000, { size: .45, seed: 6 }); sea.add(glowP.obj);
const spray = new Particles(5000, { size: 1.6, seed: 7, fog: false }); sea.add(spray.obj);
spray.mat.opacity = .55;

// Ondas de sonar: cascarones esféricos que se expanden
function shellMat(col) {
  return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: { uA: { value: 0 }, uCol: { value: col } },
    vertexShader: `varying vec3 vN; varying vec3 vW; void main(){ vN=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform float uA; uniform vec3 uCol; varying vec3 vN; varying vec3 vW; void main(){ vec3 V=normalize(cameraPosition-vW); float f=pow(clamp(1.-abs(dot(normalize(vN+vec3(1e-5)),V)),0.,1.),3.); gl_FragColor=vec4(uCol*(f*1.4+.02)*uA,1.); }` });
}
const shells = []; for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), shellMat(new THREE.Color(.4, .9, 1.3))); m.visible = false; sea.add(m); shells.push(m); }
const pingShell = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), shellMat(new THREE.Color(1.8, .7, .3))); pingShell.visible = false; sea.add(pingShell);
// Barco lejano (fuente de ruido de hélice)
const farShip = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(.8, 1.5, 2), toneMapped: false, transparent: true, opacity: 0, fog: false })); sea.add(farShip);

// ==========================================================================
// SALA DE CONTROL (interior, iluminación roja de combate)
// ==========================================================================
const room = new THREE.Scene(); room.fog = new THREE.FogExp2(new THREE.Color(.03, .005, .004), 0.02);
room.add(new THREE.HemisphereLight(0x401010, 0x050000, .6));
const roomShell = new THREE.Mesh(new THREE.CylinderGeometry(3.9, 3.9, 22, 48, 1, true), new THREE.MeshStandardMaterial({ color: 0x2b2a2a, roughness: .6, metalness: .5, side: THREE.BackSide, bumpMap: TILE, bumpScale: .3 }));
roomShell.rotation.z = Math.PI / 2; room.add(roomShell);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(22, 5.4), new THREE.MeshStandardMaterial({ color: 0x1e1d1c, roughness: .4, metalness: .7 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -2.1; room.add(floor);
const ribs = new THREE.InstancedMesh(new THREE.TorusGeometry(3.75, .1, 6, 48), new THREE.MeshStandardMaterial({ color: 0x3a3634, roughness: .5, metalness: .7 }), 9);
{ const M = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)); for (let i = 0; i < 9; i++) { M.compose(V3(-10 + i * 2.5, 0, 0), q, V3(1, 1, 1)); ribs.setMatrixAt(i, M); } room.add(ribs); }
{ const r = rng(4); const pm = new THREE.MeshStandardMaterial({ color: 0x55504c, roughness: .35, metalness: .85 });
  for (let i = 0; i < 16; i++) { const a = Math.PI * (.15 + r() * .7); const rad = 3.4 - r() * .3; const p = new THREE.Mesh(new THREE.CylinderGeometry(.05 + r() * .1, .05 + r() * .1, 22, 8), pm); p.rotation.z = Math.PI / 2; p.position.set(0, Math.sin(a) * rad, Math.cos(a) * rad); room.add(p); } }
// periscopio
{ const pm = new THREE.MeshStandardMaterial({ color: 0x3d3f42, roughness: .3, metalness: .9 }); const per = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, 6, 16), pm); per.position.set(1, 0, 0); room.add(per);
  const eye = new THREE.Mesh(new THREE.BoxGeometry(.6, .45, .5), pm); eye.position.set(1, -.3, .35); room.add(eye); }
// consolas con pantallas (texturas dibujadas cada fotograma)
const screens = [];
function makeScreen(w, h) { const c = document.createElement('canvas'); c.width = 256; c.height = 160; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); screens.push({ c, t, m }); return m; }
const consoleMat = new THREE.MeshStandardMaterial({ color: 0x24262a, roughness: .5, metalness: .6 });
for (const side of [1, -1]) for (let i = 0; i < 4; i++) {
  const g = new THREE.Group(); g.position.set(-6 + i * 3.2, -1.2, side * 2.55); g.rotation.y = side > 0 ? Math.PI : 0; room.add(g);
  const box = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.8, .9), consoleMat); g.add(box);
  const s = makeScreen(1.1, .7); s.position.set(-.6, .55, .46); s.rotation.x = -.15; g.add(s);
  const s2 = makeScreen(1.1, .7); s2.position.set(.6, .55, .46); s2.rotation.x = -.15; g.add(s2);
}
const redL = []; for (let i = 0; i < 5; i++) { const l = new THREE.PointLight(0xff2a12, 40, 14, 1.2); l.position.set(-8 + i * 4, 2.6, 0); room.add(l); redL.push(l); }
function drawScreens(t, depth) {
  screens.forEach((s, i) => {
    const x = s.c.getContext('2d'); x.fillStyle = '#100202'; x.fillRect(0, 0, 256, 160);
    x.strokeStyle = 'rgba(255,70,40,.9)'; x.fillStyle = 'rgba(255,90,60,.95)'; x.lineWidth = 2; x.font = '600 22px Inter';
    const k = i % 4;
    if (k === 0) { x.fillText('PROF.', 14, 30); x.font = '800 54px Montserrat'; x.fillText(Math.round(depth) + ' m', 14, 100); }
    else if (k === 1) { for (let j = 0; j < 40; j++) { x.globalAlpha = .4 + .6 * Math.random(); x.fillRect(Math.random() * 256, Math.random() * 160, 2, 2); } x.globalAlpha = 1; x.beginPath(); for (let j = 0; j < 160; j += 4) x.lineTo(128 + 50 * Math.sin(j * .05 + t * 2 + i), j); x.stroke(); }
    else if (k === 2) { x.beginPath(); x.arc(128, 80, 60, 0, 7); x.stroke(); x.beginPath(); x.moveTo(128, 80); x.lineTo(128 + 60 * Math.cos(t * 2 + i), 80 + 60 * Math.sin(t * 2 + i)); x.stroke(); }
    else { for (let j = 0; j < 6; j++) { x.fillRect(16, 16 + j * 22, 40 + 180 * Math.abs(Math.sin(j + t * .7 + i)), 12); } }
    s.t.needsUpdate = true;
  });
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

// Escotilla (Ø 60 cm) sobre el casco, delante de la vela
const hatch = new THREE.Group(); hatch.position.set(12, R - .02, 0); subBody.add(hatch);
{ const hm = new THREE.MeshStandardMaterial({ color: 0x3b4046, roughness: .45, metalness: .7, emissive: new THREE.Color(1, .5, .2), emissiveIntensity: 0 });
  const d = new THREE.Mesh(new THREE.CylinderGeometry(.3, .32, .14, 32), hm); hatch.add(d);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.36, .05, 8, 32), hm); ring.rotation.x = Math.PI / 2; ring.position.y = .05; hatch.add(ring); hatch.userData.mat = hm; }
const hatchArrow = bigArrow(new THREE.Color(2.4, 1.1, .45)); hatchArrow.scale.setScalar(.09); hatchArrow.rotation.z = Math.PI; sub.add(hatchArrow);

// --------------------------------------------------------------------------
// Estado de materiales del interior (opacidad según la vista de rayos X)
// --------------------------------------------------------------------------
const innerMats = [];
inner.traverse(o => { if (o.material && !innerMats.find(m => m.mat === o.material)) innerMats.push({ mat: o.material, base: o.material.uniforms ? 1 : o.material.opacity }); });
reactorG.traverse(o => { if (o.material && !innerMats.find(m => m.mat === o.material)) innerMats.push({ mat: o.material, base: o.material.opacity }); });
lifeG.traverse(o => { if (o.material && !innerMats.find(m => m.mat === o.material)) innerMats.push({ mat: o.material, base: o.material.opacity }); });
const EMI = [phMat, ventMat, hpMat, pipeMat, reactorMat, turbMat, shaftMat, elecMat, scrubber.material, still.material, batt.material, frames.material];
const EMI0 = EMI.map(m => m.emissiveIntensity);

function setXray(x, innerA = x, phA = 1) {
  hullMat.opacity = sailMat.opacity = pjMat.opacity = 1 - .93 * x; mastMat.opacity = 1 - .9 * x;
  hullMat.depthWrite = sailMat.depthWrite = x < .5;
  xrayMat.uniforms.uA.value = x;
  inner.visible = innerA > .01;
  for (const m of innerMats) { if (m.mat.uniforms && m.mat.uniforms.uA) m.mat.uniforms.uA.value = innerA; else m.mat.opacity = m.base * innerA; }
  ctrlMat.opacity = innerA; sonarArr.material.opacity = 0;
  phMat.opacity = innerA * phA; phMat.depthWrite = phA > .9; frames.material.opacity = innerA * Math.max(phA, .5);
  innerL.forEach(l => l.intensity = innerA * (phA < .9 ? (phA < .08 ? 45 : 260) : 0)); frames.visible = phA >= .08;
}
const tmp = new THREE.Vector3();
const W2 = (x, y, z) => sub.localToWorld(V3(x, y, z));       // punto local del submarino → mundo
function placeSub(x, y, pitch = 0, roll = 0, yaw = 0) { sub.position.set(x, y, 0); sub.rotation.set(roll, yaw, pitch, 'YZX'); sub.updateMatrixWorld(true); }
function camOrbit(target, dist, az, el, fov = 35) {
  camera.position.set(target.x + Math.sin(az) * Math.cos(el) * dist, target.y + Math.sin(el) * dist, target.z + Math.cos(az) * Math.cos(el) * dist);
  camera.fov = fov; camera.lookAt(target);
}
function setTankLevel(mesh, frac, x0, x1) { // frac 0..1 del alto del tanque
  const c = W2((x0 + x1) / 2, 0, 0); const r = hullR((x0 + x1) / 2) * .93; mesh.material.uniforms.uLevel.value = c.y - r + 2 * r * frac;
}
function boxLevel(mesh, frac) { const c = mesh.getWorldPosition(tmp); mesh.material.uniforms.uLevel.value = c.y - .9 + 1.8 * frac; }
const fract = x => x - Math.floor(x);

// Emisores de partículas deterministas
function emitRise(P, p0, n, t, spread, rise, life, col, seedOff = 0) {
  for (let i = 0; i < n; i++) { const s = P.seed, k = ((i + seedOff) % P.n) * 4; const age = fract(s[k] + t / life); const a = s[k + 1] * 6.283, r = Math.sqrt(s[k + 2]) * spread;
    const f = 1 - age; P.push(p0.x + Math.cos(a) * r + Math.sin(t * 3 + i) * .15 * age, p0.y + age * rise, p0.z + Math.sin(a) * r, col[0] * f, col[1] * f, col[2] * f); }
}
function emitJet(P, p0, dir, n, t, speed, spread, life, col, grav = 0, seedOff = 0) {
  for (let i = 0; i < n; i++) { const s = P.seed, k = ((i + seedOff) % P.n) * 4; const age = fract(s[k] + t / life); const tt = age * life;
    const jx = (s[k + 1] - .5) * spread, jy = (s[k + 2] - .5) * spread, jz = (s[k + 3] - .5) * spread; const f = Math.pow(1 - age, 1.2);
    P.push(p0.x + (dir.x * speed + jx) * tt, p0.y + (dir.y * speed + jy) * tt - grav * tt * tt * .5, p0.z + (dir.z * speed + jz) * tt, col[0] * f, col[1] * f, col[2] * f); }
}
function emitCurve(P, curve, n, t, speed, col, jitter = .12, seedOff = 0) {
  for (let i = 0; i < n; i++) { const s = P.seed, k = ((i + seedOff) % P.n) * 4; const u = fract(s[k] + t * speed); const p = curve.getPointAt(u); const w = sub.localToWorld(p.clone());
    P.push(w.x + (s[k + 1] - .5) * jitter, w.y + (s[k + 2] - .5) * jitter, w.z + (s[k + 3] - .5) * jitter, col[0], col[1], col[2]); }
}
function emitLine(P, a, b, n, t, speed, col, jitter = .15, seedOff = 0) {
  for (let i = 0; i < n; i++) { const s = P.seed, k = ((i + seedOff) % P.n) * 4; const u = fract(s[k] + t * speed);
    P.push(lerp(a.x, b.x, u) + (s[k + 1] - .5) * jitter, lerp(a.y, b.y, u) + (s[k + 2] - .5) * jitter, lerp(a.z, b.z, u) + (s[k + 3] - .5) * jitter, col[0], col[1], col[2]); }
}
const trimCurve = new THREE.LineCurve3(V3(-25.5, -3.1, 0), V3(32.5, -3.1, 0));
const o2Curve = new THREE.CatmullRomCurve3([V3(8.75, 1.2, 0), V3(9.5, 2.4, .5), V3(11, 2.6, 1.5), V3(14, 2.2, 2.2)]);
const h2Curve = new THREE.CatmullRomCurve3([V3(7.25, 1.2, 0), V3(6.8, 2.6, -.3), V3(6.2, 3.6, -.8), V3(5.8, 5.2, -1)]);
const co2In = new THREE.CatmullRomCurve3([V3(2, 1.4, 2.4), V3(6, 1.8, 1.4), V3(10, 1.6, 0), V3(12.2, 1.2, -1.2)]);
const co2Out = new THREE.CatmullRomCurve3([V3(12.2, 1.7, -1.2), V3(12.4, 2.6, -1.8), V3(12.6, 3.6, -2.6), V3(12.8, 4.6, -3.2)]);

// ==========================================================================
// Línea de tiempo maestra
// ==========================================================================
const K = TL.K || 1.2;
const seg = (a, b, t) => (t - TL[a]) / (TL[b] - TL[a]);   // progreso 0..1 dentro de un tramo
function envUpdate(t) {
  const cy = camera.position.y, depth = Math.max(0, -cy);
  U.uDepthCam.value = depth; U.uTime.value = t;
  const under = cy < 0;
  skyDome.visible = !under; abyss.visible = under; rays.visible = under && depth < 220; snow.visible = under;
  const d = clamp(depth / 300);
  if (under) {
    sea.fog.color.setRGB(lerp(.035, .002, Math.pow(d, .5)), lerp(.15, .01, Math.pow(d, .5)), lerp(.2, .025, Math.pow(d, .45)));
  } else { sea.fog.color.setRGB(.35, .2, .14); sea.fog.density = .0006; }
  const sd = Math.max(0, -sub.position.y);
  sunL.intensity = 2.2 * Math.exp(-sd / 70) + .55; hemi.intensity = .9 * Math.exp(-sd / 90) + .45;
  // luz clave «documental» desde arriba a la izquierda de la cámara
  const cd = V3(); camera.getWorldDirection(cd); const side = V3().crossVectors(cd, V3(0, 1, 0)).normalize();
  keyL.position.copy(sub.position).add(cd.clone().multiplyScalar(-60)).add(side.multiplyScalar(-40)).add(V3(0, 50, 0)); rimL.position.copy(sub.position).add(cd.clone().multiplyScalar(80)).add(V3(0, 25, 0)); rimL.intensity = under ? .8 : 0;
  keyL.target.position.copy(sub.position); keyL.intensity = (under ? 2.4 : .35) * (keyL.userData.boost || 1); keyL.userData.boost = 1;
  U.uCaustic.value = under ? 1 : 0;
  if (under) { sunL.color.set(0xbfe6ff); sunL.position.set(sub.position.x - 30, sub.position.y + 100, -20); }
  else { sunL.color.set(0xff9a5a); sunL.position.copy(sub.position).add(SUN_DIR.clone().multiplyScalar(200)); sunL.intensity = 1.1; hemi.intensity = .6; }
  sunL.target.position.copy(sub.position);
  rays.children.forEach(m => { m.position.y = -125; m.position.x = m.userData.x0 + camera.position.x * .9; m.position.z = (m.position.z); m.material.opacity = m.userData.base * (1 - d) * (.6 + .4 * Math.sin(t * .7 + m.userData.ph)); });
  ocean.position.x = Math.round(camera.position.x / 6.15) * 6.15; ocean.position.z = Math.round(camera.position.z / 6.15) * 6.15;
  updateSnow(t);
}

function renderFrame(t) {
  g2.clearRect(0, 0, W, H);
  let flash = 0, ca = .0013, fade = 0, grain = .035, bloomS = .6, expo = 1.0, scene = sea;
  sea.fog.density = .007; fillL.intensity = 0;
  setXray(0); updatePressureArrows(t, 0); arrUp.userData.mat.opacity = arrDown.userData.mat.opacity = 0; hatchArrow.userData.mat.opacity = 0;
  shells.forEach(s => s.visible = false); pingShell.visible = false; farShip.material.opacity = 0;
  EMI.forEach((m, i) => m.emissiveIntensity = EMI0[i]); hatch.userData.mat.emissiveIntensity = 0; coreGlow.material.opacity = 0;
  pumpjet.visible = true; propeller.visible = false; snorkel.position.y = -7.5; inner.scale.set(1, 1, 1); pressureHull.scale.set(1, 1, 1);
  fins.forEach(f => f.hinge.rotation.y = 0); bowPlanes.forEach(b => b.rotation.z = 0);
  oceanMat.uniforms.uFoam.value = 0; bubbles.begin(); glowP.begin(); spray.begin(); bubbles.mat.size = .55; glowP.mat.size = .45;
  ballastF.material.uniforms.uLevel.value = ballastA.material.uniforms.uLevel.value = 1e4; trimF.material.uniforms.uLevel.value = trimA.material.uniforms.uLevel.value = 1e4;
  let depthV = -1, depthA = 0, hot = 0;
  const fadeIn = (a, d = .3) => 1 - smooth(TL[a], TL[a] + d, t);
  const cutFlash = (a, k = .35) => Math.exp(-Math.max(0, t - TL[a]) * 9) * (t >= TL[a] ? k : 0);

  if (t < TL.onboard) {
    // ---------- A · GANCHO: 300 m bajo el mar, 300 t por metro cuadrado
    const lt = t - TL.hook, k = clamp(lt / (TL.onboard - TL.hook));
    placeSub(lt * 2.2, -300, 0);
    const tgt = W2(lerp(22, 2, easeInOut(k)), 0, 0);
    camOrbit(tgt, lerp(34, 62, easeOut(k)), lerp(1.12, .85, easeInOut(k)), lerp(.55, .36, k), lerp(50, 44, k));
    camera.position.add(shake(t, .12, 3));
    fillL.position.copy(camera.position).add(V3(0, 8, 0)); fillL.intensity = 900; rimL.intensity = 1.4;
    updatePressureArrows(t, smooth(1.4, 2.4, lt) * .7); keyL.userData.boost = 2.6;
    flash = (1 - smooth(0, .5, lt)) * .5 + cutFlash('hook', 0); fade = 1 - smooth(0, .35, lt);
    depthV = 300; depthA = smooth(.2, .7, lt); hot = .5 + .3 * Math.sin(lt * 2);
    const a = smooth(2.0, 2.6, lt) * (1 - smooth(TL.onboard - TL.hook - .4, TL.onboard - TL.hook, lt));
    txt('SOBRE CADA METRO CUADRADO', W / 2, 1500, 24, { spacing: 7, alpha: a * .8, fill: '#e3a372' });
    txt(fmt(300 * easeOut(smooth(2.0, 3.6, lt))) + ' t', W / 2, 1600, 120, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(250, 830, 1600, .3 + .4 * Math.sin(lt)), spacing: 2 });
    bloomS = .75; ca = .002;
  } else if (t < TL.question) {
    // ---------- B1 · A bordo: sala de control con luz roja
    scene = room; const lt = t - TL.onboard, k = clamp(lt / (TL.question - TL.onboard));
    camera.position.set(lerp(-9.5, -5.5, easeOut(k)), lerp(.6, .3, k), lerp(-.8, -.4, k)); camera.fov = 52; camera.lookAt(6, -.2, .4);
    camera.position.add(shake(t, .025, 6));
    const strobe = .55 + .45 * Math.max(0, Math.sin(lt * 9));
    redL.forEach((l, i) => l.intensity = 20 * strobe);
    drawScreens(t, 0);
    flash = cutFlash('onboard', .3); fade = fadeIn('onboard', .15) * .8; bloomS = .45; ca = .0022;
    txt('INMERSIÓN', W / 2, 300, 26, { spacing: 12, alpha: smooth(.2, .5, lt) * .85, fill: '#ff6a4a' });
  } else if (t < TL.vents) {
    // ---------- B2 · En superficie al atardecer
    const lt = t - TL.question, k = clamp(lt / (TL.vents - TL.question));
    placeSub(lt * 1.2, -2.6, 0);
    const tgt = W2(lerp(10, 18, k), 2, 0);
    camOrbit(tgt, lerp(120, 92, easeInOut(k)), lerp(1.05, 1.25, easeInOut(k)), lerp(.16, .1, k), 36);
    camera.position.y = Math.max(camera.position.y, 4);
    oceanMat.uniforms.uFoam.value = .35; oceanMat.uniforms.uFoamPos.value.copy(sub.position); oceanMat.uniforms.uFoamR.value = 30;
    flash = cutFlash('question', .25); fade = fadeIn('question', .2) * .7; bloomS = .7;
    depthV = 0; depthA = smooth(.3, .8, lt) * .9;
  } else if (t < TL.flood) {
    // ---------- C1 · Respiraderos abiertos: el aire escapa por arriba
    const lt = t - TL.vents, k = clamp(lt / (TL.flood - TL.vents));
    const sink = smooth(.6, 3.5, lt) * 1.4;
    placeSub(lt * 1.0, -2.6 - sink, 0);
    const v = W2(41, hullR(41) + .6, 0);
    camOrbit(W2(41, 4, 0), lerp(36, 30, k), lerp(.5, .7, k), lerp(.36, .28, k), 46); camera.position.y = Math.max(camera.position.y, 4); camera.lookAt(W2(41, 4, 0));
    oceanMat.uniforms.uFoam.value = .4; oceanMat.uniforms.uFoamPos.value.copy(v); oceanMat.uniforms.uFoamR.value = 22;
    const on = smooth(.25, .5, lt);
    for (const vx of [41, 45]) emitJet(spray, W2(vx, hullR(vx) + .5, 0), V3(0, 1, 0), 1800 * on, t, 10, 2.5, 1.2, [1.6, 1.4, 1.25], 5, vx * 37);
    emitJet(spray, W2(-35.5, hullR(-35.5) + .5, 0), V3(0, 1, 0), 600 * on, t, 8, 3, 1.1, [1, .82, .7], 6, 3000);
    spray.mat.size = .45;
    ventMat.emissiveIntensity = on * .15;
    flash = cutFlash('vents', .3); depthV = 0; depthA = .9;
    callout(v, -260, -330, 'RESPIRADEROS ABIERTOS', 'el aire sale por arriba', smooth(.5, 1, lt));
  } else if (t < TL.archi) {
    // ---------- C2 · Por abajo entran ~600 t de agua en los tanques de lastre
    const lt = t - TL.flood, k = clamp(lt / (TL.archi - TL.flood));
    const yy = lerp(-4.0, -13, easeInOut(smooth(.2, 1, k)));
    placeSub(lt * 1.0, yy, 0);
    setXray(1, 1, .9);
    const lev = easeInOut(smooth(0, .95, k));
    setTankLevel(ballastF, lev, PH.x1 + .4, 46.5); setTankLevel(ballastA, lev, -40.5, PH.x0 - .4);
    camOrbit(W2(lerp(36, 30, k), -1, 0), lerp(44, 52, k), lerp(.55, .7, k), -.12, 46);
    for (const [x0, x1, so] of [[38, 46, 0], [-40, -31, 500]]) { // agua entrando por las aberturas inferiores
      for (let i = 0; i < 4; i++) { const x = lerp(x0, x1, (i + .5) / 4); emitJet(glowP, W2(x, -hullR(x) - 1.2, 0), V3(0, 1, 0), 120 * (1 - k * .6), t, 2.5, .6, .8, [.4, 1.1, 1.6], 0, so + i * 150); } }
    for (const vx of [41, -35.5]) emitRise(bubbles, W2(vx, hullR(vx), 0), 300 * (1 - smooth(.7, 1, k)), t, 1.2, 14, 1.4, [1, 1, 1], vx > 0 ? 0 : 400);
    flash = cutFlash('flood', .3); depthV = lerp(0, 8, k); depthA = 1;
    callout(W2(43, 1, 0), -160, -380, 'TANQUE DE LASTRE', 'el agua entra por abajo', smooth(.3, .8, lt), '#9fd8ff');
    
    const a = smooth(.4, .9, lt);
    txt('ENTRAN', W / 2, 1500, 24, { spacing: 8, alpha: a * .8, fill: '#e3a372' });
    txt('≈ ' + fmt(600 * easeInOut(smooth(0, .95, k))) + ' t de agua', W / 2, 1565, 64, { font: 'Montserrat', weight: 800, alpha: a });
    txt('de 4.600 t en superficie a 5.200 t sumergido', W / 2, 1640, 26, { weight: 300, alpha: a * .7 });
  } else if (t < TL.planes) {
    // ---------- D · Arquímedes: peso = empuje
    const lt = t - TL.archi, k = clamp(lt / (TL.planes - TL.archi));
    placeSub(lt * 1.2, -24 + Math.sin(lt * .8) * .15, 0);
    setXray(lerp(.6, .25, k), lerp(.6, .2, k));
    setTankLevel(ballastF, 1, PH.x1 + .4, 46.5); setTankLevel(ballastA, 1, -40.5, PH.x0 - .4);
    camOrbit(W2(-4, 0, 0), lerp(118, 108, k), lerp(.78, .68, easeInOut(k)), lerp(.02, .06, k), 46);
    const aa = smooth(.2, .8, lt);
    arrUp.userData.mat.opacity = arrDown.userData.mat.opacity = aa; arrUp.position.set(0, 6.5, 0); arrDown.position.set(0, -6.5, 0);
    const s = .8 + .04 * Math.sin(lt * 3); arrUp.scale.set(1, s * aa, 1); arrDown.scale.set(1, s * aa, 1);
    flash = cutFlash('archi', .3); depthV = lerp(8, 20, k); depthA = 1;
    arrUp.userData.mat.opacity = arrDown.userData.mat.opacity = 0;
    const pc = project(W2(-6, 0, 0)), ax = clamp(pc.x, 260, 820);
    const a1 = smooth(.5, 1.1, lt), a2 = smooth(.8, 1.4, lt);
    arrow2D(ax, pc.y - 90, pc.y - 420, a1, '#8fd0ff'); arrow2D(ax, pc.y + 90, pc.y + 420, a2, '#f0a060');
    txt('EMPUJE', ax + 60, pc.y - 330, 26, { align: 'left', spacing: 6, alpha: a1, fill: '#9fd8ff' }); txt('5.200 t', ax + 60, pc.y - 280, 44, { align: 'left', font: 'Montserrat', weight: 800, alpha: a1 });
    txt('PESO', ax + 60, pc.y + 290, 26, { align: 'left', spacing: 6, alpha: a2, fill: '#e3a372' }); txt('5.200 t', ax + 60, pc.y + 340, 44, { align: 'left', font: 'Montserrat', weight: 800, alpha: a2 });
    titleHUD('PRINCIPIO DE ARQUÍMEDES', 'Peso = empuje', smooth(4.4, 4.9, lt), 1580);
  } else if (t < TL.trim) {
    // ---------- E · Timones de profundidad: el avance nos lleva hacia abajo
    const lt = t - TL.planes, k = clamp(lt / (TL.trim - TL.planes));
    const defl = smooth(.3, 1.2, lt) * .32; const pitch = -smooth(.9, 3.2, lt) * .12;
    placeSub(lt * 4, -26 - easeIn(k) * 9, pitch);
    fins.forEach(f => f.hinge.rotation.y = defl * f.sign); bowPlanes.forEach(b => b.rotation.z = -defl * .8);
    if (k < .55) camOrbit(W2(-40, 0, 0), 30, lerp(-.95, -.65, k * 1.8), lerp(.3, .22, k), 40);
    else camOrbit(W2(0, 0, 0), 95, lerp(-1.0, -1.12, k), .32, 44);
    fillL.position.copy(camera.position); fillL.intensity = 80;
    // estelas de flujo a lo largo del casco
    for (let i = 0; i < 260; i++) { const s = glowP.seed, kk = i * 4; const u = fract(s[kk] - t * .35); const x = lerp(50, -60, u); const a = s[kk + 1] * 6.283; const r = (x > -50 ? hullR(x) : 1.2) + .6 + s[kk + 2] * 2.5;
      const p = W2(x, Math.cos(a) * r, Math.sin(a) * r); const f = .35 * Math.sin(u * Math.PI); glowP.push(p.x, p.y, p.z, f * .5, f * .9, f * 1.2); }
    flash = cutFlash('planes', .3) + (k > .55 && k < .58 ? .2 : 0); depthV = lerp(20, 60, k); depthA = 1;
    callout(W2(-42, 3.5, 3.5), -90, -320, 'TIMONES DE PROFUNDIDAD', 'inclinan el morro', smooth(.4, .9, lt) * (1 - smooth(.5, .55, k)));
    callout(W2(34, 1.2, 4.4), 60, -260, 'TIMONES DE PROA', null, smooth(.55, .62, k));
  } else if (t < TL.m100) {
    // ---------- F · Tanques de trimado: agua entre proa y popa
    const lt = t - TL.trim, k = clamp(lt / (TL.m100 - TL.trim));
    const pitch = lerp(-.07, 0, easeInOut(smooth(.1, .9, k)));
    placeSub(lt * 3, -62, pitch);
    setXray(1, 1, .12); camOrbit(W2(3, -1, 0), 88, .95, .32, 46);
    boxLevel(trimF, lerp(.85, .35, easeInOut(k))); boxLevel(trimA, lerp(.25, .75, easeInOut(k)));
    setTankLevel(ballastF, 1, PH.x1 + .4, 46.5); setTankLevel(ballastA, 1, -40.5, PH.x0 - .4);
    pipeMat.emissiveIntensity = 1.2;
    emitCurve(glowP, new THREE.LineCurve3(V3(32.5, -3.1, 0), V3(-25.5, -3.1, 0)), 500, t, .45, [.4, 1.2, 1.8], .25);
    flash = cutFlash('trim', .3); depthV = lerp(60, 92, k); depthA = 1;
    callout(W2(32.5, -2.2, 0), -60, 330, 'TRIMADO PROA', null, smooth(.2, .6, lt));
    callout(W2(-25.5, -2.2, 0), 40, 330, 'TRIMADO POPA', null, smooth(.4, .8, lt));
    titleHUD('EQUILIBRIO', 'Agua de proa a popa', smooth(.3, .8, lt), 1520);
  } else if (t < TL.hatch) {
    // ---------- G · 100 m: casco ligero (se inunda) y casco resistente (1 atm)
    const lt = t - TL.m100, k = clamp(lt / (TL.hatch - TL.m100));
    const tH = TL.hull - TL.m100, tI = TL.inner - TL.m100;
    placeSub(lt * 2.5, -100, 0);
    const xr = smooth(tH, tH + .8, lt); setXray(xr, xr);
    setTankLevel(ballastF, 1, PH.x1 + .4, 46.5); setTankLevel(ballastA, 1, -40.5, PH.x0 - .4);
    const inn = smooth(tI, tI + .6, lt); phMat.emissiveIntensity = inn * (.35 + .2 * Math.sin(lt * 4)); frames.material.emissiveIntensity = .3 + inn * .8;
    xrayMat.uniforms.uCol.value.setRGB(.35, .75, 1);
    camOrbit(W2(lerp(10, 4, k), 0, 0), lerp(95, 66, easeInOut(k)), lerp(1.0, .78, easeInOut(k)), lerp(.4, .3, k), 44);
    fillL.position.copy(camera.position).add(V3(0, 10, 0)); fillL.intensity = 120 * (1 - xr);
    flash = cutFlash('m100', .45); depthV = 100; depthA = 1; hot = smooth(0, .3, lt) * (1 - smooth(1.2, 2, lt)) * .6;
    callout(W2(30, 4.3, 3), -60, -360, 'CASCO LIGERO', 'forma hidrodinámica · se inunda', smooth(tH + .3, tH + .8, lt) * (1 - smooth(tI + .2, tI + .5, lt)), '#9fd8ff');
    callout(W2(0, 3.8, 0), 40, -380, 'CASCO RESISTENTE', 'acero de alta resistencia', smooth(tI + .2, tI + .7, lt));
    const ia = smooth(tI + 1.6, tI + 2.2, lt);
    txt('DENTRO', 300, 1520, 24, { spacing: 8, alpha: ia * .8, fill: '#e3a372' }); txt('1 atm', 300, 1585, 64, { font: 'Montserrat', weight: 800, alpha: ia });
    txt('FUERA, A 100 m', 780, 1520, 24, { spacing: 8, alpha: ia * .8, fill: '#9fd8ff' }); txt('≈ 11 atm', 780, 1585, 64, { font: 'Montserrat', weight: 800, alpha: ia });
  } else if (t < TL.shrink) {
    // ---------- H · Escotilla de 60 cm: 85 toneladas
    const lt = t - TL.hatch, k = clamp(lt / (TL.shrink - TL.hatch));
    placeSub(lt * .6, -300, 0);
    const hp = W2(12, R, 0);
    camOrbit(hp, lerp(9, 5.5, easeOut(k)), lerp(.9, .6, k), lerp(.55, .42, k), 42);
    fillL.position.copy(camera.position).add(V3(0, 4, 0)); fillL.intensity = 60;
    const ap = smooth(.6, 1.4, lt);
    hatchArrow.userData.mat.opacity = ap; hatchArrow.position.set(12, R + .3 + 1.7 * (1 - easeOut(ap)) + .05 * Math.sin(lt * 9), 0); hatchArrow.scale.setScalar(.09 * (.8 + .2 * ap));
    hatch.userData.mat.emissiveIntensity = ap * (.5 + .3 * Math.sin(lt * 8));
    updatePressureArrows(t, .35 * smooth(1, 2, lt));
    flash = cutFlash('hatch', .35); depthV = 300; depthA = 1; hot = .5;
    const a = smooth(.3, .8, lt);
    txt('ESCOTILLA Ø 60 cm · A 300 m', W / 2, 1500, 24, { spacing: 6, alpha: a * .8, fill: '#e3a372' });
    txt(fmt(85 * easeOut(smooth(1.2, 2.6, lt))) + ' t', W / 2, 1600, 120, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(250, 830, 1600, .3 + .4 * Math.sin(lt * 1.3)) });
    txt('como 60 coches encima', W / 2, 1690, 28, { weight: 300, alpha: smooth(2.6, 3.1, lt) * .85 });
  } else if (t < TL.motor) {
    // ---------- I · El casco se encoge: se expulsa agua para compensar
    const lt = t - TL.shrink, k = clamp(lt / (TL.motor - TL.shrink));
    placeSub(lt * 1.5, -300, 0);
    setXray(.9, .9);
    const sq = smooth(.2, 1.8, lt) * .06; pressureHull.scale.set(1, 1 - sq, 1 - sq); frames.scale.set(1, 1 - sq, 1 - sq);
    updatePressureArrows(t, 1, sq * .5);
    phMat.emissiveIntensity = .5 + sq * 6;
    boxLevel(trimF, lerp(.7, .25, smooth(2.2, 3.8, lt))); boxLevel(trimA, lerp(.7, .25, smooth(2.2, 3.8, lt)));
    const ej = smooth(2.1, 2.5, lt) * (1 - smooth(3.9, 4.2, lt));
    emitJet(glowP, W2(32.5, -4.5, 0), V3(0, -1, 0), 400 * ej, t, 5, 1.6, .9, [.4, 1.1, 1.7], 0, 0);
    emitJet(glowP, W2(-25.5, -4.5, 0), V3(0, -1, 0), 400 * ej, t, 5, 1.6, .9, [.4, 1.1, 1.7], 0, 800);
    camOrbit(W2(4, 0, 0), lerp(86, 76, k), lerp(.92, .78, k), .3, 44);
    flash = cutFlash('shrink', .3); depthV = 300; depthA = 1; ca = .0015 + sq * .05;
    titleHUD('EL CASCO SE ENCOGE', 'menos volumen = menos empuje', smooth(.3, .8, lt) * (1 - smooth(2.0, 2.3, lt)), 1520);
    txt('(deformación exagerada)', W / 2, 1690, 22, { weight: 300, alpha: smooth(.3, .8, lt) * .6 * (1 - smooth(2.0, 2.3, lt)) });
    titleHUD('SE BOMBEA AGUA FUERA', 'para recuperar el equilibrio', smooth(2.3, 2.7, lt), 1520);
  } else if (t < TL.conv) {
    // ---------- J · Propulsión nuclear: reactor → vapor → turbinas → hidrojet
    const lt = t - TL.motor, k = clamp(lt / (TL.conv - TL.motor));
    const tR = TL.reactor - TL.motor, tS = TL.steam - TL.motor;
    placeSub(lt * 3, -180, 0);
    setXray(1, 1, .1);
    coreGlow.material.opacity = smooth(tR, tR + .5, lt) * (.8 + .2 * Math.sin(lt * 7)); reactorMat.emissiveIntensity = smooth(tR, tR + .5, lt) * .25;
    const spin = smooth(tS, tS + 1.2, lt);
    turbines.forEach(r => r.rotation.x = t * 25 * spin); turbMat.emissiveIntensity = spin * .6; shaftMat.emissiveIntensity = spin * .5;
    shaft.rotation.x = t * 8 * spin;
    emitCurve(glowP, primaryCurve, 300 * smooth(tR, tR + .5, lt), t, .6, [1.8, .7, .25], .2);
    emitCurve(glowP, steamCurve, 500 * spin, t, .9, [1.3, 1.5, 1.7], .3, 400);
    emitJet(bubbles, W2(-51, 0, 0), V3(-1, 0, 0), 500 * spin, t, 9, 2.2, 1.5, [.9, .95, 1], 0, 0);
    const camX = lerp(-2, -26, easeInOut(smooth(tS - .3, TL.conv - TL.motor, lt)));
    camOrbit(W2(camX, 0, 0), lerp(28, 34, k), lerp(.75, .55, k), lerp(.35, .25, k), 42);
    flash = cutFlash('motor', .3); depthV = 180; depthA = 1;
    callout(W2(-6.5, 1.5, 0), -40, -330, 'REACTOR', 'de agua a presión', smooth(tR + .1, tR + .5, lt) * (1 - smooth(tS + 1.5, tS + 1.8, lt)));
    callout(W2(-2.6, 1.4, 1.2), 60, -200, 'GENERADOR DE VAPOR', null, smooth(tR + .8, tR + 1.2, lt) * (1 - smooth(tS + 1.5, tS + 1.8, lt)));
    callout(W2(-17, .8, 1.25), -40, -300, 'TURBINAS', null, smooth(tS + .4, tS + .8, lt));
    callout(W2(-48, 1.5, 0), 40, -240, 'HIDROJET', 'empuje silencioso', smooth(tS + 1.6, tS + 2.0, lt));
  } else if (t < TL.air) {
    // ---------- K · Submarino convencional: baterías y esnórquel
    const lt = t - TL.conv, k = clamp(lt / (TL.air - TL.conv)); const tSn = TL.snorkel - TL.conv;
    pumpjet.visible = false; propeller.visible = true; propeller.rotation.x = t * 6;
    placeSub(lt * 2, lt < tSn ? -40 : -12.5, 0);
    if (lt < tSn) {
      setXray(1, 1, .12); camOrbit(W2(8, -1, 0), 70, .95, .35, 46);
      batt.material.emissiveIntensity = .4 + .6 * smooth(.6, 2.2, lt);
      callout(W2(9, -2.2, 0), 60, 330, 'BATERÍAS', 'propulsión eléctrica bajo el agua', smooth(1.2, 1.7, lt));
      titleHUD('SUBMARINO CONVENCIONAL', 'Diésel-eléctrico', smooth(.2, .7, lt), 1500);
    } else {
      const sk = smooth(tSn, tSn + 1.2, lt); snorkel.position.y = lerp(-7.5, 0, sk);
      camOrbit(W2(18, 6, 0), lerp(34, 40, k), lerp(.95, .8, k), -.14, 44);
      oceanMat.uniforms.uFoam.value = .7 * sk; oceanMat.uniforms.uFoamPos.value.copy(W2(18.5, 14, 0)); oceanMat.uniforms.uFoamR.value = 6;
      emitJet(bubbles, W2(17.5, 8, -1), V3(0, 1, 0), 400 * smooth(tSn + 1, tSn + 1.5, lt), t, 2, 1, 1.2, [.9, .9, .9], 0, 0);
      batt.material.emissiveIntensity = 1; setXray(.25, .25);
      callout(W2(18.5, 13.5, 0), -60, -280, 'ESNÓRQUEL', 'aire para los motores diésel', smooth(tSn + .6, tSn + 1.1, lt));
      bar(120, 1600, 840, .3 + .7 * smooth(tSn + 1, TL.air - TL.conv, lt), 'CARGANDO BATERÍAS', Math.round(100 * (.3 + .7 * smooth(tSn + 1, TL.air - TL.conv, lt))) + ' %', smooth(tSn + .8, tSn + 1.2, lt), '#7dff9e');
    }
    flash = cutFlash('conv', .3) + cutFlash('snorkel', .2); depthV = lt < tSn ? 12 : 12; depthA = 0;
  } else if (t < TL.co2) {
    // ---------- L · Oxígeno: electrólisis del agua
    const lt = t - TL.air, k = clamp(lt / (TL.co2 - TL.air)); const tE = TL.electro - TL.air;
    placeSub(lt * .5, -150, 0);
    setXray(1, 1, .06);
    const on = smooth(tE - .3, tE + .2, lt);
    elecMat.emissiveIntensity = on * (.6 + .3 * Math.sin(lt * 20));
    camOrbit(W2(8, .4, 0), lerp(16, 7.5, easeInOut(smooth(0, tE + .5, lt))), lerp(.35, .1, k), lerp(.35, .12, k), 42);
    bubbles.mat.size = .14; glowP.mat.size = .2;
    emitRise(bubbles, W2(7.25, -.7, 0), 320 * on, t, .35, 1.4, .9, [1, 1, 1], 0);      // H2 (cátodo): doble volumen
    emitRise(bubbles, W2(8.75, -.7, 0), 160 * on, t, .35, 1.4, .9, [1, 1, 1], 600);    // O2 (ánodo)
    emitCurve(glowP, o2Curve, 260 * on, t, .5, [.4, 1.2, 2.2], .25);
    emitCurve(glowP, h2Curve, 200 * on, t, .5, [1.6, 1.6, 1.6], .2, 500);
    flash = cutFlash('air', .3); depthV = 150; depthA = 0;
    const a = smooth(tE + .2, tE + .6, lt);
    callout(W2(7.25, .9, 0), -120, -300, 'H₂', 'hidrógeno → al mar', a, '#e8e8e8');
    callout(W2(8.75, .9, 0), 100, -240, 'O₂', 'oxígeno → para respirar', a, '#9fd8ff');
    titleHUD('ELECTRÓLISIS', '2 H₂O → 2 H₂ + O₂', smooth(.3, .8, lt), 1520);
  } else if (t < TL.water) {
    // ---------- M · CO2: depuradores de aminas
    const lt = t - TL.co2, k = clamp(lt / (TL.water - TL.co2)); const tS = TL.scrub - TL.co2;
    placeSub(lt * .5, -150, 0);
    setXray(1, 1, .06);
    camOrbit(W2(lerp(8, 11, k), .8, -.4), lerp(12, 10, k), lerp(-.3, .2, k), lerp(.3, .2, k), 44);
    glowP.mat.size = .22; bubbles.mat.size = .25;
    emitCurve(glowP, co2In, 380, t, .35, [1.5, 1.0, .6], .5);
    const sc = smooth(tS - .2, tS + .3, lt); scrubber.material.emissiveIntensity = .2 + sc * .8;
    emitCurve(glowP, co2Out, 220 * sc, t, .7, [1.4, .9, .5], .2, 600);
    emitRise(bubbles, W2(12.8, 4.8, -3.3), 260 * sc, t, .6, 6, 1.8, [1, 1, 1], 0);
    flash = cutFlash('co2', .3); depthV = 150; depthA = 0;
    const a = smooth(.3, .8, lt);
    txt('CADA TRIPULANTE EXHALA', W / 2, 1500, 24, { spacing: 7, alpha: a * .8, fill: '#e3a372' });
    txt('≈ 1 kg de CO₂ al día', W / 2, 1565, 60, { font: 'Montserrat', weight: 800, alpha: a });
    txt('65 tripulantes ≈ 65 kg diarios', W / 2, 1635, 26, { weight: 300, alpha: smooth(1.2, 1.7, lt) * .75 });
    callout(W2(12.2, 1.6, -1.2), 80, -320, 'DEPURADOR DE CO₂', 'aminas que lo capturan', smooth(tS, tS + .5, lt));
  } else if (t < TL.m300) {
    // ---------- N · Agua dulce destilada
    const lt = t - TL.water, k = clamp(lt / (TL.m300 - TL.water));
    placeSub(lt * .5, -150, 0); setXray(1, 1, .06);
    camOrbit(W2(4, .3, 1.3), lerp(9, 7, k), lerp(.5, .7, k), .2, 44);
    still.material.emissiveIntensity = .8; glowP.mat.size = .18; bubbles.mat.size = .12;
    emitLine(glowP, W2(4, 3.5, 3.2), W2(4, 1.5, 1.3), 160, t, .8, [.3, .9, 1.6], .3);
    emitRise(glowP, W2(4, 1.4, 1.3), 160, t, .4, 1.4, 1, [1.4, 1.4, 1.4], 300);
    emitJet(bubbles, W2(4, -.8, 1.3), V3(0, -1, 0), 120, t, 1.5, .3, .8, [.7, .9, 1], 2, 0);
    flash = cutFlash('water', .3); depthV = 150; depthA = 0;
    callout(W2(4, 1.2, 1.3), 80, -300, 'DESTILADOR', 'agua de mar → agua dulce', smooth(.2, .6, lt));
  } else if (t < TL.sound) {
    // ---------- O · 300 m: oscuridad. No miramos: escuchamos
    const lt = t - TL.m300, k = clamp(lt / (TL.sound - TL.m300)); const tL = TL.listen - TL.m300;
    placeSub(lt * 2, -300, 0);
    const dark = smooth(TL.dark - TL.m300, TL.dark - TL.m300 + 1, lt);
    expo = lerp(1.1, .85, dark); keyL.userData.boost = 1.8; sea.fog.density = .0045;
    const ls = smooth(tL, tL + .5, lt);
    setXray(ls * .5, 0);
    sonarArr.material.opacity = ls * (.6 + .4 * Math.sin(lt * 6));
    inner.visible = true; sonarArr.visible = true;
    if (lt < tL) camOrbit(W2(0, 0, 0), lerp(120, 105, k), lerp(1.05, .95, k), .35, 44);
    else camOrbit(W2(44, 0, 0), lerp(26, 20, smooth(tL, tL + 2, lt)), lerp(1.1, .9, k), .1, 42);
    flash = cutFlash('m300', .4) + cutFlash('listen', .15); depthV = 300; depthA = 1; hot = smooth(0, .3, lt) * (1 - smooth(1.5, 2.5, lt)) * .7;
    callout(W2(45, 2, 3), -40, -330, 'SONAR DE PROA', 'cientos de hidrófonos', smooth(tL + .3, tL + .7, lt), '#9fd8ff');
  } else if (t < TL.blow) {
    // ---------- P · El sonido viaja a 1.500 m/s. Un ping nos delataría
    const lt = t - TL.sound, k = clamp(lt / (TL.blow - TL.sound)); const tP = TL.ping - TL.sound;
    placeSub(lt * 2, -300, 0);
    expo = .62; setXray(.35, 0); inner.visible = true;
    const src = W2(520, 60, -380); farShip.position.copy(src); farShip.material.opacity = 0;
    shells.forEach((s, i) => { const r = fract(lt * .22 + i / shells.length) * 900; s.visible = true; s.position.copy(src); s.scale.setScalar(r + .1); s.material.uniforms.uA.value = .55 * (1 - r / 900) * (1 - smooth(tP, tP + .5, lt) * .7); });
    const hit = shells.reduce((m, s) => Math.max(m, Math.exp(-Math.abs(s.scale.x - src.distanceTo(W2(46, 0, 0))) / 8)), 0);
    sonarArr.material.opacity = .4 + hit * 1.2;
    if (lt < tP) camOrbit(W2(30, 4, 0), lerp(90, 70, k), lerp(1.4, 1.15, k), lerp(.3, .22, k), 40);
    else {
      const pk = smooth(tP, tP + 2.5, lt); pingShell.visible = true; pingShell.position.copy(W2(48, 0, 0)); pingShell.scale.setScalar(1 + easeOut(clamp((lt - tP) / 2.4)) * 220);
      pingShell.material.uniforms.uA.value = 1.4 * (1 - pk * .6);
      camOrbit(W2(10, 0, 0), lerp(130, 170, pk), lerp(-.5, -.3, pk), .35, 40); expo = .7;
      txt('PING ACTIVO', W / 2, 1500, 26, { spacing: 10, alpha: smooth(tP + .2, tP + .5, lt), fill: '#ff7a5a' });
      txt('revela tu posición', W / 2, 1565, 54, { font: 'Montserrat', weight: 800, alpha: smooth(tP + .4, tP + .8, lt) });
    }
    flash = cutFlash('sound', .25) + cutFlash('ping', .4); depthV = 300; depthA = 1;
    const ba = smooth(.4, .8, lt) * (1 - smooth(tP - .3, tP, lt));
    bar(120, 1520, 840, 1, 'SONIDO EN EL AGUA', '1.500 m/s', ba, '#9fd8ff');
    bar(120, 1650, 840, 343 / 1500, 'SONIDO EN EL AIRE', '343 m/s', ba * smooth(1.2, 1.6, lt), '#e3a372');
  } else if (t < TL.rise) {
    // ---------- Q1 · Soplar lastre con aire a alta presión
    const lt = t - TL.blow, k = clamp(lt / (TL.rise - TL.blow));
    placeSub(lt * 2, -300 + easeIn(k) * 18, easeIn(k) * .12);
    setXray(1, 1, .25); expo = .9;
    const bl = smooth(.3, .8, lt); hpMat.emissiveIntensity = bl * 1.2;
    const lev = 1 - easeInOut(smooth(.6, 2.6, lt));
    setTankLevel(ballastF, lev, PH.x1 + .4, 46.5); setTankLevel(ballastA, lev, -40.5, PH.x0 - .4);
    emitCurve(glowP, new THREE.LineCurve3(V3(31, -2.4, 0), V3(43, 0, 0)), 300 * bl, t, 1.4, [1.6, 1.8, 1.6], .3);
    emitCurve(glowP, new THREE.LineCurve3(V3(25, -2.4, 0), V3(-35, -1.5, 0)), 400 * bl, t, .9, [1.6, 1.8, 1.6], .3, 300);
    for (const [x0, x1, so] of [[38, 46, 0], [-40, -31, 900]]) for (let i = 0; i < 4; i++) { const x = lerp(x0, x1, (i + .5) / 4); emitJet(bubbles, W2(x, -hullR(x), 0), V3(0, -1, 0), 180 * bl * (lev > .02 ? 1 : .2), t, 4, 2.5, 1.0, [1, 1, 1], -4, so + i * 200); }
    camOrbit(W2(3, 0, 0), 90, 1.0, .3, 46);
    flash = cutFlash('blow', .35); depthV = lerp(300, 200, easeIn(k)); depthA = 1;
    callout(W2(28, -2.4, 1.2), -40, 330, 'AIRE A ALTA PRESIÓN', null, smooth(.3, .7, lt), '#7dff9e');
  } else if (t < TL.food) {
    // ---------- Q2 · Emergencia: el submarino sale a la superficie
    const lt = t - TL.rise, k = clamp(lt / (TL.food - TL.rise));
    const up = easeOut(clamp(lt / 1.1)); const fall = smooth(1.1, 1.9, lt);
    const y = lerp(-26, 3, up) - fall * 5.6; const pitch = lerp(.42, .28, up) * (1 - fall);
    placeSub(30 + lt * 9, y, pitch);
    camera.position.set(sub.position.x + 75, 3.5, 70); camera.fov = 38; camera.lookAt(sub.position.x + 32, 6, 0);
    camera.position.add(shake(t, .25 * (1 - k), 9));
    const bow = W2(46, 0, 0);
    oceanMat.uniforms.uFoam.value = 1; oceanMat.uniforms.uFoamPos.value.copy(bow); oceanMat.uniforms.uFoamR.value = 50;
    const sp = smooth(.2, .5, lt);
    for (let i = 0; i < 6; i++) { const x = lerp(10, 48, i / 5); const p = W2(x, 0, 0); if (p.y > -3 && p.y < 6) emitJet(spray, V3(p.x, .5, p.z), V3(.15, 1, 0), 600 * sp, t, 12, 9, 1.6, [.95, .97, 1], 14, i * 500); }
    emitJet(spray, V3(bow.x, .5, bow.z), V3(.3, 1, 0), 1200 * smooth(.9, 1.3, lt), t, 9, 12, 1.4, [.95, .97, 1], 12, 3200);
    spray.mat.size = 1.4;
    flash = cutFlash('rise', .5); depthV = 0; depthA = 0; bloomS = .8;
  } else if (t < TL.brand) {
    // ---------- R · ¿Cuánto aguantamos? El límite es la comida
    const lt = t - TL.food, k = clamp(lt / (TL.brand - TL.food)); const tC = TL.comida - TL.food;
    placeSub(lt * 1.5, -2.6, 0);
    camOrbit(W2(5, 2, 0), lerp(150, 175, k), lerp(.7, 1.0, k), lerp(.28, .36, k), 34);
    oceanMat.uniforms.uFoam.value = .3; oceanMat.uniforms.uFoamPos.value.copy(sub.position); oceanMat.uniforms.uFoamR.value = 35;
    flash = cutFlash('food', .3); fade = smooth(TL.brand - .45, TL.brand, t) * .9;
    const a = smooth(.3, .8, lt);
    bar(120, 1500, 840, 1, 'COMBUSTIBLE NUCLEAR', 'años', a, '#9fd8ff');
    const fd = smooth(tC - 1.8, tC + .6, lt);
    bar(120, 1640, 840, 1 - fd * .97, 'VÍVERES', Math.round(70 * (1 - fd * .97)) + ' días', smooth(1.0, 1.5, lt), fd > .5 ? '#ff7a5a' : '#e3a372');
    txt('Autonomía de la clase Suffren: 70 días', W / 2, 1720, 24, { weight: 300, alpha: smooth(1.4, 2, lt) * .6 });
  } else {
    // ---------- S · Cierre y logotipo
    const lt = t - TL.brand;
    placeSub(-60 + lt * 6, -14, 0);
    camera.position.set(-20, -42, 40); camera.fov = 50; camera.lookAt(-10, -5, -20);
    fade = 1 - smooth(0, .5, lt); fade = Math.max(fade, smooth(.3, 1.2, lt) * .62);
    bloomS = .8;
    const lk = lt - .3, a = smooth(-.2, .6, lk), sp = lerp(60, 14, easeOut(clamp(lk / 1.6))), sweep = clamp((lk - .3) / 1.4) * 1.3 - .15;
    if (lk > -.3) {
      g2.save(); g2.globalAlpha = a; g2.strokeStyle = copperGrad(440, 640, 590, sweep); g2.lineWidth = 5;
      g2.beginPath(); g2.arc(W / 2, 590, 70, Math.PI * .15, Math.PI * (.15 + 1.7 * easeOut(clamp(lk / 1.2)))); g2.stroke();
      g2.fillStyle = '#ffe2c0'; g2.shadowColor = 'rgba(255,170,100,.9)'; g2.shadowBlur = 30; g2.beginPath(); g2.arc(W / 2 + 18, 582, 14, 0, Math.PI * 2); g2.fill(); g2.restore();
      txt(BRAND, W / 2, 790, BRAND.length > 11 ? 104 : 112, { font: 'Montserrat', weight: 800, spacing: sp, alpha: a, fill: copperGrad(140, 940, 790, sweep), shadow: 30 });
      const ta = smooth(.9, 1.6, lk);
      g2.save(); g2.globalAlpha = ta * .7; g2.fillStyle = '#d98a52'; g2.fillRect(W / 2 - 90 * ta, 880, 180 * ta, 2); g2.restore();
      txt(TAG, W / 2, 940, 40, { weight: 300, spacing: 3, alpha: ta * .9 });
    }
    fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }

  bubbles.end(); glowP.end(); spray.end();
  if (scene === sea) envUpdate(t);
  depthHUD(depthV, depthA * (1 - fade), hot);
  camera.aspect = W / H; camera.updateProjectionMatrix();
  renderPass.scene = scene; bloom.strength = bloomS;
  gradePass.uniforms.uTime.value = t; gradePass.uniforms.uFlash.value = flash; gradePass.uniforms.uCA.value = ca;
  gradePass.uniforms.uFade.value = fade; gradePass.uniforms.uGrain.value = grain;
  renderer.toneMappingExposure = expo;
  composer.render();
}

function renderCover() {
  renderFrame(TL.rise + .45); camera.position.y += 0; g2.clearRect(0, 0, W, H);
  const gr = g2.createLinearGradient(0, 0, 0, 900); gr.addColorStop(0, 'rgba(2,6,14,.88)'); gr.addColorStop(1, 'rgba(2,6,14,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, W, 900);
  txt(BRAND, W / 2, 210, 30, { font: 'Montserrat', weight: 800, spacing: 14, fill: '#e3a372' });
  txt('¿CÓMO FUNCIONA', W / 2, 400, 92, { font: 'Montserrat', weight: 800, spacing: 2, fill: '#ffffff', shadow: 30 });
  txt('UN SUBMARINO?', W / 2, 515, 100, { font: 'Montserrat', weight: 800, spacing: 2, fill: copperGrad(120, 960, 520, .5), shadow: 30 });
  g2.save(); g2.globalAlpha = .7; g2.fillStyle = '#d98a52'; g2.fillRect(W / 2 - 90, 610, 180, 3); g2.restore();
  txt('Bajamos a 300 metros con su comandante', W / 2, 670, 36, { weight: 300, spacing: 1 });
}
window.renderCover = () => { renderCover(); return true; };
window.TL = TL;
window.renderFrame = (t) => { renderFrame(t); return true; };
window.ready = true;
window._dbg = { lights: { keyL, sunL, rimL, hemi, fillL }, camera, sub, setXray, bloom, composer, renderer, sea, objs: { pressureHull, ballastF, ballastA, xrayHull, xraySail, ocean, frames, trimF, trimA, hull, sail, abyss, rays, snow, glow: glowP.obj, bub: bubbles.obj, spray: spray.obj, pArrows, arrUp, arrDown, hatchArrow, reactorG, lifeG, batt, sonarArr, deck, hpBottles, ctrl, pumpjet, shells0: shells[0], pingShell, farShip, inner } };
