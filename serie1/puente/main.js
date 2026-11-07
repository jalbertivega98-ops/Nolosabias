// NO LO SABÍAS — "¿Cómo aguanta un puente colgante?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final. Unidades: metros.
// Puente colgante genérico con proporciones de un gran puente real: vano central 1.280 m, vanos laterales 340 m, torres de 227 m sobre el agua,
// tablero a 67 m, flecha del cable ≈ 150 m. Cables principales de 0,92 m de diámetro con 27.572 alambres de 4,9 mm (Golden Gate).
// Tacoma Narrows (1940): oscilación torsional con un nodo en el centro del vano, viento de ≈ 64 km/h. Torres no paralelas: Verrazzano-Narrows, +4,1 cm arriba.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, easeIn, rng, V3, g2, camera, Particles, txt, copperGrad, project, callout, titleHUD, fract, camOrbit, bigStat, bar, drawBrand, coverText, finish, arrowXY } from '../../lib/core.js';

const scene = new THREE.Scene(); scene.background = new THREE.Color(0x05070d);
const hemi = new THREE.HemisphereLight(0xb8c8ff, 0x2a2018, .8); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffc89a, 2.4); sun.position.set(-800, 300, -1200); scene.add(sun);
const key = new THREE.DirectionalLight(0xe8f0ff, 1.0); key.position.set(600, 900, 900); scene.add(key);
const M = (c, r = .5, m = .3, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: e });
const box = (w, h, d, mat, x = 0, y = 0, z = 0, parent = scene) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; };
function xray(col, k = 1) { return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  uniforms: { uCol: { value: col.clone() }, uA: { value: k } },
  vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform vec3 uCol; uniform float uA; varying vec3 vN; varying vec3 vV; void main(){ float f=pow(clamp(1.-abs(dot(vN,vV)),0.,1.),2.); gl_FragColor=vec4(uCol*(f*.8+.05)*uA,(f*.7+.04)*uA); }` }); }

// Cielo de atardecer y mar
const skyU = { uTop: { value: new THREE.Color(.02, .04, .1) }, uHor: { value: new THREE.Color(.75, .36, .16) }, uK: { value: 1 } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(15000, 48, 24), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: skyU,
  vertexShader: `varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 uTop; uniform vec3 uHor; uniform float uK; varying vec3 vP; void main(){ float h=clamp(vP.y,0.,1.); vec3 c=mix(uHor*uK, uTop, pow(h,.45)); float s=pow(max(dot(vP, normalize(vec3(-.55,.06,-.83))),0.),60.); c+=vec3(1.,.6,.3)*s*.5*uK; if(vP.y<0.) c=uHor*.25*uK; gl_FragColor=vec4(c,1.); }` }));
scene.add(sky);
const seaMat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uK: { value: 1 } },
  vertexShader: `varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `uniform float uT; uniform float uK; varying vec3 vW; void main(){ vec3 V=normalize(cameraPosition-vW); float r=sin(vW.x*.05+uT*.8)*sin(vW.z*.07-uT*.6)+sin(vW.x*.013-vW.z*.021+uT*.4);
    float fr=pow(1.-max(V.y,0.),4.); vec3 c=mix(vec3(.01,.03,.06), vec3(.55,.28,.14)*uK, fr*.8); vec3 L=normalize(vec3(-.55,.06,-.83)); vec3 Nn=normalize(vec3(r*.03,1.,r*.02)); float sp=pow(max(dot(reflect(-V,Nn),L),0.),300.)*.5;
    c+=vec3(1.,.6,.3)*sp*uK; gl_FragColor=vec4(c,1.); }` });
const sea = new THREE.Mesh(new THREE.PlaneGeometry(40000, 40000), seaMat); sea.rotation.x = -Math.PI / 2; scene.add(sea);

// ==========================================================================
// PUENTE
// ==========================================================================
const HALF = 640, SIDE = 340, XA = HALF + SIDE, TOPY = 227, MIDY = 72, DECK = 67, ZC = 14;
const cableY = x => { const ax = Math.abs(x); if (ax <= HALF) return MIDY + (TOPY - MIDY) * Math.pow(ax / HALF, 2); const u = (ax - HALF) / SIDE; return lerp(TOPY, 60, u) - 28 * 4 * u * (1 - u); };
const towerMat = M(0x8a5a40, .55, .35), steelM = M(0x6c737c, .45, .7), conc = M(0x6a6660, .9, .05);
const bridge = new THREE.Group(); scene.add(bridge);
const towers = [-HALF, HALF].map(x => { const g = new THREE.Group(); g.position.set(x, 0, 0); bridge.add(g);
  for (const s of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(10, 240, 9), towerMat); leg.position.set(0, 110, s * ZC); g.add(leg); }
  for (const y of [95, 140, 182, 224]) box(6, 8, 2 * ZC, towerMat, 0, y, 0, g); box(30, 20, 50, conc, 0, -2, 0, g);
  const saddle = []; for (const s of [-1, 1]) saddle.push(box(12, 4, 6, M(0x2c2f34, .5, .7), 0, TOPY + 2, s * ZC, g)); const lamp = box(1.5, 1.5, 1.5, M(0xff2020, .5, 0, 0xff3030), 0, 236, 0, g); return g; });
const anchors = [-1, 1].map(s => { const g = new THREE.Group(); g.position.set(s * (XA + 20), 0, 0); bridge.add(g); const b = box(70, 70, 70, conc, 0, 32, 0, g); return { g, b }; });
const anchorX = xray(new THREE.Color(.5, .5, .55), .8);
// cables principales
const cableMat = M(0x8c949e, .35, .85), cableGlow = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, .85, .4) });
function cablePts(z, x0 = -XA, x1 = XA, n = 240) { const p = []; for (let i = 0; i <= n; i++) { const x = lerp(x0, x1, i / n); p.push(V3(x, cableY(x), z)); } return new THREE.CatmullRomCurve3(p); }
const cables = [-1, 1].map(s => { const c = cablePts(s * ZC); const m = new THREE.Mesh(new THREE.TubeGeometry(c, 600, 1.1, 8, false), cableMat); bridge.add(m); return { c, m }; });
// tablero por segmentos (para poder retorcerlo)
const SEG = 15, NSEG = Math.round(2 * XA / SEG); const roadMat = M(0x4a4c52, .8, .1), trussMat = M(0x7a4a32, .6, .4);
const segs = []; for (let i = 0; i < NSEG; i++) { const x = -XA + (i + .5) * SEG; const g = new THREE.Group(); g.position.set(x, DECK - 3.5, 0); bridge.add(g);
  box(SEG + .05, .6, 27, roadMat, 0, 3.4, 0, g); box(SEG + .05, 6.5, 1.2, trussMat, 0, 0, ZC - .4, g); box(SEG + .05, 6.5, 1.2, trussMat, 0, 0, -ZC + .4, g); box(SEG + .05, .8, 27, trussMat, 0, -3.1, 0, g);
  for (const lz of [-6.5, 0, 6.5]) box(SEG * .5, .05, .25, M(0xffffff, .5, 0, 0x777766), 0, 3.75, lz, g);
  segs.push({ g, x, fall: 0 }); }
// péndolas (instanciadas)
const HX = []; for (let x = -XA + 7.5; x < XA; x += SEG) if (cableY(x) - DECK > 4 && Math.abs(Math.abs(x) - HALF) > 8) HX.push(x);
const hangGeo = new THREE.CylinderGeometry(.18, .18, 1, 5); hangGeo.translate(0, .5, 0);
const hangMat = M(0x9aa3ad, .4, .8), hangGlowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, .8, .35) });
const hangers = new THREE.InstancedMesh(hangGeo, hangMat, HX.length * 2); bridge.add(hangers);
const hangersG = new THREE.InstancedMesh(hangGeo, hangGlowMat, HX.length * 2); bridge.add(hangersG);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _up = V3(0, 1, 0);
function segAt(x) { return segs[clamp(Math.floor((x + XA) / SEG), 0, NSEG - 1)]; }
function deckPoint(x, z) { const s = segAt(x); const v = V3(x - s.g.position.x, 3.5, z).applyEuler(s.g.rotation).add(s.g.position); return v; }
function updHangers(glowFn) { let k = 0, kg = 0; const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (const x of HX) for (const s of [-1, 1]) { const sg = segAt(x); const a = deckPoint(x, s * (ZC - .4)); const b = V3(x, cableY(x), s * ZC); const d = b.clone().sub(a); const L = d.length();
    _q.setFromUnitVectors(_up, d.normalize()); _s.set(1, L, 1); _m.compose(a, _q, _s); const gl = glowFn ? glowFn(x, s) : 0; const vis = !sg.gone;
    hangers.setMatrixAt(k++, vis && gl <= .5 ? _m : zero); hangersG.setMatrixAt(kg++, vis && gl > .5 ? _m : zero); }
  hangers.instanceMatrix.needsUpdate = true; hangersG.instanceMatrix.needsUpdate = true; }
// coches: luces sobre el tablero
const P = new Particles(16000, { size: 2, seed: 11 }); scene.add(P.obj);
function cars(t, amp = 1) { const s = P.seed; for (let i = 0; i < 260; i++) { const q = (i % P.n) * 4; const dir = i % 2 ? 1 : -1; const lane = dir * (2.5 + (s[q + 2] > .5 ? 3.2 : 0)); const u = fract(s[q] + dir * t * (.02 + s[q + 1] * .006)); const x = lerp(-XA - 60, XA + 60, u);
  if (Math.abs(x) > XA) continue; const sg = segAt(x); if (sg.gone) continue; const p = deckPoint(x, lane); const c = dir > 0 ? [2.2, 2.0, 1.6] : [2.2, .25, .15]; P.push(p.x, p.y + 1, p.z, c[0] * amp, c[1] * amp, c[2] * amp); } }

// ==========================================================================
// LABORATORIO: corte del cable (27.572 alambres) y globo terráqueo
// ==========================================================================
const LAB = V3(0, 3000, 0); const lab = new THREE.Group(); lab.position.copy(LAB); scene.add(lab);
const wrapTex = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#7d858e'; x.fillRect(0, 0, 256, 64); x.strokeStyle = '#5c636b'; x.lineWidth = 2; for (let i = -64; i < 256; i += 5) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 10, 64); x.stroke(); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(30, 1); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const labCable = new THREE.Mesh(new THREE.CylinderGeometry(.46, .46, 8, 64, 1, true), new THREE.MeshStandardMaterial({ map: wrapTex, roughness: .4, metalness: .8 })); labCable.rotation.z = Math.PI / 2; labCable.position.x = -4; lab.add(labCable);
const band = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .25, 64), M(0x3a3e44, .4, .8)); band.rotation.z = Math.PI / 2; band.position.x = -1.5; lab.add(band);
const NW = 27572; const wirePos = []; { const sp = .46 * Math.sqrt(Math.PI / (NW * Math.sqrt(3) / 2)) * .995; for (let j = -100; j <= 100; j++) for (let i = -100; i <= 100; i++) { const y = j * sp * Math.sqrt(3) / 2, z = (i + (j & 1) * .5) * sp; if (y * y + z * z < .455 * .455) wirePos.push([y, z, Math.hypot(y, z)]); } }
wirePos.sort((a, b) => a[2] - b[2]); const NWD = wirePos.length;
const W2 = new Particles(NWD, { size: .008, seed: 5 }); lab.add(W2.obj);
const capDisc = new THREE.Mesh(new THREE.CircleGeometry(.462, 64), M(0x15181c, .6, .5)); capDisc.rotation.y = Math.PI / 2; capDisc.position.x = -.002; lab.add(capDisc);
// globo con continentes procedurales
const GLOBE = V3(0, 6000, 0); const globe = new THREE.Mesh(new THREE.SphereGeometry(100, 96, 64), new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 } },
  vertexShader: `varying vec3 vP; varying vec3 vN; varying vec3 vV; void main(){ vP=position/100.; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform float uT; varying vec3 vP; varying vec3 vN; varying vec3 vV;
    float h(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
    float n(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
    void main(){ float c=uT*.15; vec3 p=vec3(vP.x*cos(c)-vP.z*sin(c), vP.y, vP.x*sin(c)+vP.z*cos(c)); float v=n(p*2.2)*.55+n(p*4.7)*.3+n(p*9.)*.15; float land=smoothstep(.52,.56,v);
      vec3 col=mix(vec3(.02,.09,.25), vec3(.16,.3,.12)+vec3(.15,.1,.02)*n(p*12.), land); col=mix(col, vec3(.9), smoothstep(.82,.9,abs(vP.y)));
      float lit=clamp(dot(vN, normalize(vec3(.6,.4,.7))),0.,1.)*.9+.12; float rimL=pow(1.-max(dot(vN,vV),0.),3.); gl_FragColor=vec4(col*lit+vec3(.25,.5,1.)*rimL*.8,1.); }` }));
globe.position.copy(GLOBE); scene.add(globe);
const loopPts = []; { const N = 800, turns = 3.25; for (let i = 0; i <= N; i++) { const u = i / N, a = u * turns * Math.PI * 2; const tilt = lerp(-1.1, 1.1, u); const r = 104 + u * 3; loopPts.push(V3(Math.cos(a) * r, Math.sin(a) * r * Math.sin(tilt) * .35 + Math.sin(a) * 0, Math.sin(a) * r).applyAxisAngle(V3(1, 0, 0), tilt * .6).applyAxisAngle(V3(0, 0, 1), .35).add(GLOBE)); } }
const loopGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(loopPts), 1600, .9, 6, false); const loop = new THREE.Mesh(loopGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 1.0, .45) })); scene.add(loop);
// túnel de viento: maqueta de un tramo de tablero
const TUN = V3(0, 9000, 0); const tun = new THREE.Group(); tun.position.copy(TUN); scene.add(tun);
{ box(4, .25, 2.7, M(0x2a2c30, .8, .1), 0, .3, 0, tun); for (const s of [-1, 1]) box(4, .65, .12, trussMat, 0, 0, s * 1.3, tun); box(4, .08, 2.7, trussMat, 0, -.3, 0, tun); 
  const tw = xray(new THREE.Color(.3, .55, .9), .6); const tube2 = new THREE.Mesh(new THREE.BoxGeometry(6, 3.6, 7, 1, 1, 1), tw); tun.add(tube2); }

// ==========================================================================
// ESTADO
// ==========================================================================
function resetBridge() { segs.forEach(s => { s.g.rotation.set(0, 0, 0); s.g.position.set(s.x, DECK - 3.5, 0); s.gone = false; s.g.visible = true; }); towers.forEach(g => g.rotation.set(0, 0, 0)); cables.forEach(c => c.m.material = cableMat); }
function twistBridge(t, amp, collapse) { // modo torsional con un nodo en el centro
  segs.forEach(s => { const ax = Math.abs(s.x); let th = 0; if (ax < HALF) th = amp * Math.sin(Math.PI * s.x / HALF) * Math.sin(t * 2 * Math.PI * .45); s.g.rotation.set(th, 0, 0); s.g.position.y = DECK - 3.5 + amp * 6 * Math.sin(Math.PI * s.x / HALF) * Math.sin(t * 2 * Math.PI * .45 + 1);
    if (collapse > 0 && ax < 330) { const d = Math.max(0, collapse - (ax / 330) * .5); const fall = 4.9 * d * d * 9; s.g.position.y -= fall; s.g.rotation.x += d * (s.x > 0 ? 1.4 : -1.2) * (1 + (s.x % 30) / 30); s.g.rotation.z = d * .3 * Math.sin(s.x); s.gone = d > .02; s.g.visible = s.g.position.y > -20; } }); }
function flowCable(t, amp, speed = .08, n = 1400, dir = 1, from = -XA, to = XA) { const s = P.seed; for (let i = 0; i < n; i++) { const q = ((i + 2000) % P.n) * 4; const side = i % 2 ? 1 : -1; let u = fract(s[q] + t * speed); // de centro hacia torres
  const half = s[q + 1] < .5 ? -1 : 1; let x = half * lerp(0, XA, dir > 0 ? u : 1 - u); if (x < from || x > to) continue; const f = amp * (.6 + .4 * Math.sin(u * 30 + t * 4)); P.push(x, cableY(x) + (s[q + 2] - .5) * 2, side * ZC + (s[q + 3] - .5) * 2, 2.2 * f, 1.15 * f, .45 * f); } }
function flowTowers(t, amp, n = 800) { const s = P.seed; for (let i = 0; i < n; i++) { const q = ((i + 5000) % P.n) * 4; const u = fract(s[q] + t * .35); const tx = (i % 4 < 2 ? -1 : 1) * HALF, tz = (i % 2 ? 1 : -1) * ZC; const f = amp * (1 - u * .4);
  P.push(tx + (s[q + 1] - .5) * 8, lerp(TOPY, -5, u), tz + (s[q + 2] - .5) * 7, .45 * f, .85 * f, 1.6 * f); } }
function windLines(t, amp, n = 2500, cx = 0, cy = 90, spanX = 1600, spanY = 160) { const s = P.seed; for (let i = 0; i < n; i++) { const q = ((i + 7000) % P.n) * 4; const u = fract(s[q] + t * (.35 + s[q + 3] * .2)); const x = cx + (s[q + 1] - .5) * spanX, y = cy + (s[q + 2] - .5) * spanY;
  const z = lerp(-500, 500, u); const f = amp * Math.sin(Math.PI * u) * .7; P.push(x, y + Math.sin(z * .02 + t * 2) * 3, z, .6 * f, .8 * f, 1.1 * f); } }
function splash(t, t0, x0, amp) { const s = P.seed; const dt = t - t0; if (dt < 0 || dt > 3) return; for (let i = 0; i < 1500; i++) { const q = ((i + 10000) % P.n) * 4; const tt = dt * (.6 + s[q] * .6); const vx = (s[q + 1] - .5) * 60, vy = 40 + s[q + 2] * 60, vz = (s[q + 3] - .5) * 60;
  const y = vy * tt - 4.9 * tt * tt * 3; if (y < 0) continue; const f = amp * (1 - dt / 3); P.push(x0 + (s[q] - .5) * 600 + vx * tt, y, vz * tt, 1.4 * f, 1.5 * f, 1.6 * f); } }

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = 1; camera.far = 40000;
  let bloomS = .7, flash = 0, ca = .0013, fade = 0, grain = .035, expo = 1, dim = 0, glowFn = null, skyK = 1;
  P.begin(); P.mat.size = 2; resetBridge(); seaMat.uniforms.uT.value = t; loop.visible = false; W2.begin(); W2.end();
  for (const c of ['how', 'made', 'earth', 'force', 'danger', 'tunnel', 'curious', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];
  if (t < TL.how) {
    // A · más de un kilómetro… y cuelga de solo dos cables
    const g = smooth(TL.two, TL.two + .5, t); if (g > .5) cables.forEach(c => c.m.material = cableGlow); cars(t, 1);
    camOrbit(V3(-100, 110, 0), lerp(1700, 1450, easeOut(t / TL.how)), 1.05 - t * .03, .1, 38); bloomS = .9;
    if (g > 0) flowCable(t, g * .8, .1, 1600, 1);
    hud.push(() => { bigStat('ESTE PUENTE MIDE', '+ DE 1 KM', 330, smooth(.1, .4, t) * (1 - smooth(TL.two - .1, TL.two + .1, t)), clamp(t / 2.2));
      titleHUD('Y CUELGA DE', 'SOLO DOS CABLES', smooth(TL.two, TL.two + .3, t), 300); });
  } else if (t < TL.main) {
    // B · la carretera no se apoya en el agua: cuelga de cientos de péndolas
    const lt = t - TL.how; cars(t, 1); const hk = clamp((t - TL.hangers - .2) / 2.2); glowFn = (x) => (Math.abs(x) < hk * XA ? 1 : 0);
    camOrbit(V3(-120 - lt * 12, 80, 0), lerp(420, 330, easeInOut(smooth(0, 5.5, lt))), .95 - lt * .04, .12, 38); P.mat.size = 1.2;
    if (t > TL.hangers) { const s = P.seed; for (let i = 0; i < 900; i++) { const q = ((i + 12000) % P.n) * 4; const x = HX[Math.floor(s[q] * HX.length)]; if (Math.abs(x) > hk * XA) continue; const u = fract(s[q + 1] + t * .5); const side = s[q + 2] < .5 ? -1 : 1; P.push(x, lerp(DECK + 1, cableY(x), u), side * ZC, 1.8, .95, .4); } }
    hud.push(() => { titleHUD('¿CÓMO', 'AGUANTA?', smooth(0, .3, lt) * (1 - smooth(TL.road - TL.how - .1, TL.road - TL.how + .1, lt)), 300);
      titleHUD('LA CARRETERA NO SE APOYA', 'EN EL AGUA', smooth(TL.road - TL.how, TL.road - TL.how + .3, lt) * (1 - smooth(TL.hangers - TL.how - .1, TL.hangers - TL.how + .1, lt)), 300);
      titleHUD('CUELGA DE CIENTOS DE', 'PÉNDOLAS', smooth(TL.hangers - TL.how, TL.hangers - TL.how + .3, lt), 300);
      callout(V3(-260, (DECK + cableY(-260)) / 2, ZC), 90, 140, 'PÉNDOLA', 'cable vertical', smooth(TL.hangers - TL.how + .4, TL.hangers - TL.how + .8, lt), '#ffb27a'); });
  } else if (t < TL.made) {
    // C · todas tiran de los dos cables principales, que pasan por encima de las torres
    const lt = t - TL.main; cars(t, 1); glowFn = () => 1; cables.forEach(c => c.m.material = cableGlow);
    flowCable(t, smooth(0, .6, lt), .12, 2200, 1);
    camOrbit(V3(-HALF * smooth(TL.towers - TL.main - .5, TL.towers - TL.main + .8, lt), lerp(110, 170, smooth(TL.towers - TL.main - .5, TL.towers - TL.main + .8, lt)), 0), lerp(1500, 520, easeInOut(smooth(TL.towers - TL.main - .8, TL.towers - TL.main + 1, lt))), .5 + lt * .03, .12, 38); P.mat.size = 2;
    hud.push(() => { titleHUD('Y TODAS TIRAN DE LOS', 'DOS CABLES PRINCIPALES', smooth(0, .3, lt) * (1 - smooth(TL.towers - TL.main - .1, TL.towers - TL.main + .1, lt)), 300);
      titleHUD('QUE PASAN POR ENCIMA', 'DE LAS TORRES', smooth(TL.towers - TL.main, TL.towers - TL.main + .3, lt), 300);
      callout(V3(-HALF, TOPY + 4, ZC), 90, -60, 'TORRE', '227 m', smooth(TL.towers - TL.main + .6, TL.towers - TL.main + 1, lt), '#e3a372'); });
  } else if (t < TL.earth) {
    // D · de qué está hecho un cable: miles de alambres de 5 mm; 27.572 en el Golden Gate
    const lt = t - TL.made; const rev = smooth(TL.wires - TL.made - .3, TL.wires - TL.made + 1.2, lt);
    const ck = easeInOut(smooth(.2, TL.wires - TL.made + .8, lt)); camOrbit(LAB.clone().add(V3(0, 0, 0)), lerp(5.5, 1.45, ck), lerp(-.9, Math.PI / 2 - .12, ck), lerp(.25, .04, ck), 38);
    capDisc.visible = true; capDisc.position.x = rev < .99 ? -.002 : -.02; const nShow = Math.floor(NWD * clamp(rev * 1.05));
    const cnt = Math.round(lerp(0, 27572, easeOut(smooth(TL.gg - TL.made + .5, TL.n27 - TL.made + .6, lt))));
    W2.begin(); for (let i = 0; i < nShow; i++) { const [y, z, r] = wirePos[i]; const hi = cnt > 0 ? (r < .455 * Math.sqrt(cnt / 27572) ? 1 : .55) : .8; const tint = .85 + .15 * W2.seed[i * 4];
      W2.push(.003, y, z, 1.1 * hi * tint, 1.15 * hi * tint, 1.25 * hi * tint); } W2.end(); W2.mat.size = .026; bloomS = .4;
    hud.push(() => { titleHUD('¿Y DE QUÉ ESTÁ HECHO', 'UN CABLE ASÍ?', smooth(0, .3, lt) * (1 - smooth(TL.wires - TL.made - .1, TL.wires - TL.made + .1, lt)), 300);
      titleHUD('MILES DE ALAMBRES DE ACERO', 'DE 5 MILÍMETROS', smooth(TL.wires - TL.made, TL.wires - TL.made + .3, lt) * (1 - smooth(TL.gg - TL.made - .1, TL.gg - TL.made + .1, lt)), 300);
      bigStat('GOLDEN GATE · CADA CABLE', (cnt >= 1000 ? Math.floor(cnt / 1000) + '.' + String(cnt % 1000).padStart(3, '0') : String(cnt)), 330, smooth(TL.gg - TL.made, TL.gg - TL.made + .3, lt), clamp((lt - 5) / 1.5));
      txt('ALAMBRES', W / 2, 420, 34, { weight: 300, spacing: 6, alpha: smooth(TL.gg - TL.made + .2, TL.gg - TL.made + .5, lt) });
      txt('Ø 92 cm', W / 2, 1640, 34, { weight: 300, spacing: 4, alpha: smooth(TL.wires - TL.made + 1, TL.wires - TL.made + 1.4, lt) * .9 }); });
  } else if (t < TL.force) {
    // E · puestos en fila darían más de tres vueltas a la Tierra
    const lt = t - TL.earth; globe.material.uniforms.uT.value = t; loop.visible = true; const dk = easeInOut(smooth(.1, 2.2, lt)); loop.geometry.setDrawRange(0, Math.floor(loopGeo.index.count * dk / 6) * 6);
    camOrbit(GLOBE, lerp(520, 580, lt / 3), .3 + lt * .05, .18, 38); bloomS = .9;
    hud.push(() => { titleHUD('PUESTOS EN FILA…', '', smooth(0, .3, lt) * (1 - smooth(.9, 1.1, lt)), 300); bigStat('MÁS DE', '3 VUELTAS', 330, smooth(.9, 1.2, lt), clamp((lt - .9) / 1.5));
      txt('≈ 129.000 km de alambre', W / 2, 430, 36, { weight: 300, alpha: smooth(1.3, 1.6, lt) }); txt('A LA TIERRA', W / 2, 1600, 48, { font: 'Montserrat', weight: 800, alpha: smooth(1.1, 1.4, lt) }); });
  } else if (t < TL.danger) {
    // F · las torres empujan hacia abajo; los anclajes aguantan el tirón
    const lt = t - TL.force; cars(t, .8); cables.forEach(c => c.m.material = cableGlow); glowFn = () => 1;
    const ak = easeInOut(smooth(TL.anchors - TL.force - .3, TL.anchors - TL.force + 1.2, lt));
    flowCable(t, .9, .1, 2000, 1); if (t > TL.tw - .2) flowTowers(t, smooth(TL.tw, TL.tw + .5, t) * (1 - ak * .7));
    if (ak > .01) { anchors.forEach(a => a.b.material = ak > .4 ? anchorX : conc); const s = P.seed; for (let i = 0; i < 700; i++) { const q = ((i + 13000) % P.n) * 4; const side = i % 2 ? 1 : -1; const u = fract(s[q] + t * .4); const x = lerp(XA - 60, XA + 40, u); // el cable se abre en hilos dentro del bloque
      const spread = smooth(XA, XA + 40, x); P.push(-x, lerp(cableY(Math.min(x, XA)), 30, spread * .6) + (s[q + 1] - .5) * spread * 30, side * ZC + (s[q + 2] - .5) * spread * 30, 2.2 * ak, 1.1 * ak, .4 * ak); } }
    camOrbit(V3(lerp(-450, -XA - 20, ak), lerp(110, 50, ak), 0), lerp(lerp(1500, 1350, lt / 4), 330, ak), lerp(.25, .7, ak) + lt * .01, lerp(.08, .25, ak), 38);
    hud.push(() => { titleHUD('¿Y ADÓNDE VA', 'TODA ESA FUERZA?', smooth(0, .3, lt) * (1 - smooth(TL.tw - TL.force - .1, TL.tw - TL.force + .1, lt)), 300);
      titleHUD('LAS TORRES LA EMPUJAN', 'HACIA ABAJO', smooth(TL.tw - TL.force, TL.tw - TL.force + .3, lt) * (1 - smooth(TL.anchors - TL.force - .1, TL.anchors - TL.force + .1, lt)), 300);
      titleHUD('LOS CABLES SE ENTIERRAN EN', 'BLOQUES DE HORMIGÓN', smooth(TL.anchors - TL.force, TL.anchors - TL.force + .3, lt) * (1 - smooth(TL.anch_name - TL.force - .1, TL.anch_name - TL.force + .1, lt)), 300);
      titleHUD('AGUANTAN EL TIRÓN', 'LOS ANCLAJES', smooth(TL.anch_name - TL.force, TL.anch_name - TL.force + .3, lt), 300);
      callout(V3(-XA - 20, 70, 35), 60, 170, 'ANCLAJE', null, smooth(TL.anch_name - TL.force + .2, TL.anch_name - TL.force + .6, lt), '#e3a372'); });
  } else if (t < TL.tunnel) {
    // G · el mayor peligro es el viento: Tacoma, 1940
    const lt = t - TL.danger; const hist = smooth(TL.y1940 - .2, TL.y1940 + .3, t); skyK = lerp(1, .55, hist); grain = lerp(.035, .09, hist); expo = lerp(1, 1.5, hist);
    const amp = .5 * smooth(TL.twist - .3, TL.twist + 1.2, t); const col = smooth(TL.fall - .1, TL.fall + .9, t); twistBridge(t, amp, col);
    windLines(t, smooth(TL.wind - .4, TL.wind + .2, t) * (1 - col * .5) + .3, 2600);
    splash(t, TL.fall + .55, 0, 1.2); if (hist < .5) cars(t, 1);
    if (hist < .5) camOrbit(V3(-200, 75, 0), lerp(1300, 1150, lt / 3), .85, .12, 38); else camOrbit(V3(-60, 58, 0), lerp(520, 470, smooth(TL.y1940, TL.fall + 1, t)), 1.2, .32, 38); P.mat.size = 3;
    const sh = col > 0 && col < .9 ? (1 - col) * 3 : 0; camera.position.x += Math.sin(t * 50) * sh; camera.position.y += Math.cos(t * 43) * sh;
    hud.push(() => { titleHUD('PERO EL MAYOR PELIGRO', 'NO ES EL PESO', smooth(0, .3, lt) * (1 - smooth(TL.wind - TL.danger - .1, TL.wind - TL.danger + .1, lt)), 300);
      bigStat('ES EL', 'VIENTO', 330, smooth(TL.wind - TL.danger, TL.wind - TL.danger + .25, lt) * (1 - smooth(TL.y1940 - TL.danger - .1, TL.y1940 - TL.danger + .1, lt)), clamp((lt - 2) / 1));
      bigStat('PUENTE DE TACOMA', '1940', 330, smooth(TL.y1940 - TL.danger, TL.y1940 - TL.danger + .3, lt) * (1 - smooth(TL.fall - TL.danger - .1, TL.fall - TL.danger + .1, lt)), clamp((t - TL.y1940) / 1.5));
      txt('se retorcía con un viento de ≈ 64 km/h', W / 2, 1600, 34, { weight: 300, alpha: smooth(TL.twist - TL.danger, TL.twist - TL.danger + .3, lt) * (1 - smooth(TL.fall - TL.danger, TL.fall - TL.danger + .2, lt)) });
      titleHUD('Y SE VINO', 'ABAJO', smooth(TL.fall - TL.danger + .1, TL.fall - TL.danger + .4, lt), 300); });
  } else if (t < TL.curious) {
    // H · desde entonces, todos se prueban en túneles de viento
    const lt = t - TL.tunnel; camOrbit(TUN, lerp(12, 10.5, lt / 2.6), Math.PI / 2 - .4 + lt * .03, .14, 38); P.mat.size = .12; bloomS = 1.0;
    const s = P.seed; for (let i = 0; i < 14000; i++) { const q = ((Math.floor(i / 7) + 3000) % P.n) * 4; const u = fract(s[q] + t * .45 - (i % 7) * .006); const z = lerp(-3.4, 3.4, u); const y0 = (s[q + 1] - .5) * 3.2, x = (s[q + 2] - .5) * 5.6;
      const bump = Math.exp(-z * z / 1.6) * (y0 > -.1 ? 1 : -1) * Math.max(0, .9 - Math.abs(y0) * .5); const wake = z > 1.4 ? Math.sin(z * 6 - t * 8 + x) * .12 * Math.exp(-Math.abs(y0) * 2) : 0;
      const y = y0 + bump + wake; const f = Math.sin(Math.PI * u) * 1.3 * (1 - (i % 7) / 8); P.push(TUN.x + x, TUN.y + y, TUN.z + z, .5 * f, .85 * f, 1.3 * f); }
    hud.push(() => { titleHUD('DESDE ENTONCES, TODOS', 'SE PRUEBAN EN TÚNELES DE VIENTO', smooth(0, .3, lt), 300); });
  } else if (t < TL.brand) {
    // I · las torres no son paralelas: la Tierra es curva
    const lt = t - TL.curious; const tk = easeInOut(smooth(TL.cm - TL.curious - .2, TL.cm - TL.curious + 1.2, lt)); const ex = tk * .03; towers[0].rotation.z = ex; towers[1].rotation.z = -ex; cars(t, .7);
    camOrbit(V3(0, 95, 0), lerp(2600, 2350, lt / 8), .0 + lt * .004, .02, 38); skyK = .9;
    dim = smooth(TL.notpar - .3, TL.notpar + .4, t) * .85;
    hud.push(() => { titleHUD('Y LO MÁS CURIOSO', 'LAS TORRES NO SON PARALELAS', smooth(0, .3, lt) * (1 - smooth(TL.cm - TL.curious - .1, TL.cm - TL.curious + .1, lt)), 300);
      const sk = smooth(TL.notpar - TL.curious - .2, TL.notpar - TL.curious + .6, lt); if (sk > .01) { const R = lerp(9000, 1400, easeInOut(tk)), cx = W / 2, cy = 1150 + R; const ang = lerp(.03, .2, easeInOut(tk));
        g2.save(); g2.globalAlpha = sk; const gr = g2.createRadialGradient(cx, cy, R - 40, cx, cy, R + 4); gr.addColorStop(0, '#0b2a4a'); gr.addColorStop(1, '#3a7fc0'); g2.fillStyle = gr; g2.beginPath(); g2.arc(cx, cy, R, 0, Math.PI * 2); g2.fill();
        g2.strokeStyle = '#7fd4ff'; g2.lineWidth = 3; g2.beginPath(); g2.arc(cx, cy, R, -Math.PI / 2 - .6, -Math.PI / 2 + .6); g2.stroke();
        const tops = []; for (const sgn of [-1, 1]) { const a = -Math.PI / 2 + sgn * ang; const bx = cx + Math.cos(a) * R, by = cy + Math.sin(a) * R; const hT = 420; const tx = cx + Math.cos(a) * (R + hT), ty = cy + Math.sin(a) * (R + hT); tops.push([tx, ty]);
          g2.strokeStyle = '#d98a52'; g2.lineWidth = 26; g2.lineCap = 'butt'; g2.beginPath(); g2.moveTo(bx, by); g2.lineTo(tx, ty); g2.stroke();
          g2.setLineDash([12, 12]); g2.strokeStyle = 'rgba(255,226,192,.7)'; g2.lineWidth = 3; g2.beginPath(); g2.moveTo(bx, by); g2.lineTo(cx + Math.cos(a) * Math.min(R, 1400), cy + Math.sin(a) * Math.min(R, 1400)); g2.stroke(); g2.setLineDash([]); }
        g2.strokeStyle = '#ffe2c0'; g2.lineWidth = 3; g2.beginPath(); g2.moveTo(tops[0][0], tops[0][1] - 40); g2.lineTo(tops[1][0], tops[1][1] - 40); g2.stroke(); g2.restore(); }
      bigStat('ARRIBA ESTÁN MÁS SEPARADAS', '+ 4,1 cm', 330, smooth(TL.cm - TL.curious, TL.cm - TL.curious + .3, lt), clamp((lt - 4) / 1.5));
      txt('Puente Verrazzano (Nueva York) · inclinación exagerada', W / 2, 1830, 24, { weight: 300, alpha: smooth(TL.cm - TL.curious + .4, TL.cm - TL.curious + .8, lt) * .8 });
      titleHUD('PORQUE LA TIERRA', 'ES CURVA', smooth(TL.curve - TL.curious, TL.curve - TL.curious + .3, lt), 1500); });
  } else {
    // J · marca
    const lt = t - TL.brand; cars(t, .8); camOrbit(V3(0, 110, 0), 2600 + lt * 60, .55 + lt * .03, .08, 38); expo = .9; fade = Math.min(.5, lt * .45); dim = smooth(0, .8, lt) * .6;
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  updHangers(glowFn); skyU.uK.value = skyK; seaMat.uniforms.uK.value = skyK;
  P.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (dim > 0) hud.unshift(() => { g2.save(); g2.globalAlpha = dim * .7; g2.fillStyle = '#02050b'; g2.fillRect(0, 0, W, H); g2.restore(); });
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
function renderCover() { renderFrame(TL.two + .9); coverText('¿CÓMO AGUANTA', 'UN PUENTE?', 'Cuelga de solo dos cables'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
