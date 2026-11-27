// NO LO SABÍAS — "¿Por qué el cielo es azul?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final.
// Dispersión de Rayleigh ∝ 1/λ⁴: el azul (~450 nm) se dispersa unas 5 veces más que el rojo (~700 nm).
// El cielo no es violeta: el Sol emite menos violeta, parte se absorbe arriba y el ojo es poco sensible al violeta.
// Al atardecer la luz atraviesa hasta ~38-40 veces más atmósfera que con el Sol en el cénit.
// Nubes: gotas ≫ longitud de onda (dispersión de Mie) → dispersan todos los colores por igual → blanco; nubes gruesas → grises.
// Marte: cielo diurno color caramelo (polvo) y atardeceres azulados (el polvo fino dispersa el azul hacia delante).
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3, shake,
  g2, camera, Particles, txt, copperGrad, project, fmt, callout, bar, fract, emitRise, emitJet, arrowXY, bigStat, drawBrand, coverText, finish } from '../../lib/core.js';

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(new THREE.Color(.7, .8, .92), .002);
const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { uZen: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uSun: { value: V3(0, 1, 0) }, uSunCol: { value: new THREE.Color() }, uHalo: { value: new THREE.Color() }, uHaloW: { value: 8 }, uStars: { value: 0 } },
  vertexShader: `varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 uZen,uHor,uSunCol,uHalo,uSun; uniform float uHaloW,uStars; varying vec3 vD;
    float h(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453); }
    void main(){ vec3 d=normalize(vD); float y=clamp(d.y,0.,1.); vec3 c=mix(uHor,uZen,pow(y,.45));
      float s=max(dot(d,normalize(uSun)),0.); c+=uHalo*pow(s,uHaloW); c+=uSunCol*smoothstep(.9990,.9996,s)*3.;
      vec3 q=floor(d*400.); float st=step(.9975,h(q))*uStars*smoothstep(0.,.2,d.y); c+=vec3(st);
      gl_FragColor=vec4(c,1.); }` });
const sky = new THREE.Mesh(new THREE.SphereGeometry(2800, 48, 24), skyMat); sky.renderOrder = -1; scene.add(sky);
const hemi = new THREE.HemisphereLight(0xdfe8ff, 0x4a5a40, 1.3); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1dc, 2.6); sun.position.set(-40, 80, -60); scene.add(sun);
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .6, ...o });
function hash(x, z) { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, z) { const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi; const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  return lerp(lerp(hash(xi, zi), hash(xi + 1, zi), u), lerp(hash(xi, zi + 1), hash(xi + 1, zi + 1), u), v); }
const fbm = (x, z) => vnoise(x, z) * .5 + vnoise(x * 2.1, z * 2.1) * .25 + vnoise(x * 4.3, z * 4.3) * .125 + vnoise(x * 9.1, z * 9.1) * .07;
function terrain(w, n, amp, freq, mat, flat = 0) { const g = new THREE.PlaneGeometry(w, w, n, n); g.rotateX(-Math.PI / 2); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); const r = Math.hypot(x, z); p.setY(i, (fbm(x * freq + 3, z * freq) - .3) * amp * smooth(flat, flat * 3 + 1, r)); } g.computeVertexNormals(); return new THREE.Mesh(g, mat); }
function setSky(zen, hor, sunDir, sunCol, halo, haloW = 8, stars = 0) { const u = skyMat.uniforms; u.uZen.value.setRGB(...zen); u.uHor.value.setRGB(...hor); u.uSun.value.copy(sunDir).normalize(); u.uSunCol.value.setRGB(...sunCol); u.uHalo.value.setRGB(...halo); u.uHaloW.value = haloW; u.uStars.value = stars; }

// ==========================================================================
// TIERRA: campo, observador y nubes
// ==========================================================================
const earth = new THREE.Group(); scene.add(earth);
const grassMat = M(0x5d7f45, { roughness: .95 }); const land = terrain(2400, 160, 60, .004, grassMat, 30); earth.add(land);
const person = new THREE.Group(); { const m = M(0x1d2a44), sk = M(0xd9a37a);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.2, .7, 6, 12), m); body.position.y = 1.0; person.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.14, 16, 12), sk); head.position.y = 1.62; person.add(head);
  for (const z of [-.1, .1]) { const l = new THREE.Mesh(new THREE.CapsuleGeometry(.08, .5, 4, 8), M(0x2a2a2a)); l.position.set(0, .35, z); person.add(l); } }
earth.add(person);
const cloudMat = M(0xffffff, { roughness: 1, emissive: 0x9aa6b8 });
const clouds = []; { const r = rng(9); const sph = new THREE.SphereGeometry(1, 16, 12);
  for (let c = 0; c < 14; c++) { const g = new THREE.Group(); const n = 9 + Math.floor(r() * 8); for (let i = 0; i < n; i++) { const s = new THREE.Mesh(sph, cloudMat); const a = r() * 6.28, d = r() * 9;
      s.position.set(Math.cos(a) * d * 1.6, r() * 3 + (d < 4 ? 2 : 0), Math.sin(a) * d * .8); s.scale.setScalar(3 + r() * 3.5); g.add(s); }
    const a = (c / 14) * Math.PI * 2 + r(), d = 90 + r() * 160; g.position.set(Math.cos(a) * d, 70 + r() * 40, Math.sin(a) * d - 60); g.userData = { home: g.position.clone(), r: r() }; earth.add(g); clouds.push(g); } }
const rainPS = null;

// ==========================================================================
// LABORATORIO (fondo oscuro): prisma, moléculas, gota
// ==========================================================================
const LAB = V3(0, 3000, 0); const lab = new THREE.Group(); lab.position.copy(LAB); scene.add(lab);
const prismMat = new THREE.MeshStandardMaterial({ color: 0xcfe2ff, transparent: true, opacity: .28, roughness: .05, metalness: .1, emissive: 0x223344, depthWrite: false });
const prism = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 1.4, 3), prismMat); prism.rotation.x = Math.PI / 2; prism.rotation.y = Math.PI / 2; lab.add(prism);
const prismEdges = new THREE.LineSegments(new THREE.EdgesGeometry(prism.geometry), new THREE.LineBasicMaterial({ color: 0xbfd8ff, transparent: true, opacity: .8 })); prism.add(prismEdges);
const MOLC = V3(60, 0, 0); const mols = []; { const r = rng(4); const geo = new THREE.SphereGeometry(.22, 16, 12); const mN = M(0x7fa6d9, { roughness: .35, emissive: 0x3a5a90 }), mO = M(0xe08a5a, { roughness: .35, emissive: 0x6a3418 });
  for (let i = 0; i < 70; i++) { const g = new THREE.Group(); const mat = r() < .78 ? mN : mO; for (const s of [-1, 1]) { const a = new THREE.Mesh(geo, mat); a.position.x = s * .2; g.add(a); }
    g.position.set(MOLC.x + (r() - .5) * 18, (r() - .5) * 30, (r() - .5) * 8); g.rotation.set(r() * 6, r() * 6, r() * 6); g.userData = { home: g.position.clone(), r: [r(), r(), r()] }; lab.add(g); mols.push(g); } }
const DROPC = V3(-60, 0, 0); const dropMat = new THREE.MeshStandardMaterial({ color: 0xbfe3ff, transparent: true, opacity: .35, roughness: .02, metalness: .1, emissive: 0x2a5a8a, depthWrite: false });
const drop = new THREE.Mesh(new THREE.SphereGeometry(4, 48, 32), dropMat); drop.position.copy(DROPC); lab.add(drop);
const molTiny = new THREE.Mesh(new THREE.SphereGeometry(.05, 10, 8), M(0x7fa6d9, { emissive: 0x3060a0 })); molTiny.position.copy(DROPC).add(V3(7.5, -3, 0)); lab.add(molTiny);

// ==========================================================================
// PLANETA: trayecto de la luz a mediodía y al atardecer
// ==========================================================================
const PLN = V3(0, -3000, 0); const planet = new THREE.Group(); planet.position.copy(PLN); scene.add(planet); const PR = 40;
const globe = new THREE.Mesh(new THREE.SphereGeometry(PR, 96, 64), M(0x2f6a4a, { roughness: .8, emissive: 0x08130c })); planet.add(globe);
const atmoMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
  vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `varying vec3 vN; varying vec3 vV; void main(){ float f=pow(1.-abs(dot(vN,vV)),1.5); gl_FragColor=vec4(vec3(.25,.55,1.)*f*1.4,f); }` });
const atmo = new THREE.Mesh(new THREE.SphereGeometry(PR + 5, 96, 64), atmoMat); planet.add(atmo);
const atmoFill = new THREE.Mesh(new THREE.SphereGeometry(PR + 5, 96, 64), new THREE.MeshBasicMaterial({ color: 0x3a7adf, transparent: true, opacity: .12, depthWrite: false })); planet.add(atmoFill);
const obs = new THREE.Mesh(new THREE.SphereGeometry(.5, 16, 12), M(0xffe2c0, { emissive: 0xc8743f })); obs.position.set(0, PR + .3, 0); planet.add(obs);

// ==========================================================================
// MARTE
// ==========================================================================
const MARS = V3(8000, 0, 0); const mars = new THREE.Group(); mars.position.copy(MARS); scene.add(mars);
const marsMat = M(0xb0603a, { roughness: .95 }); mars.add(terrain(2400, 180, 80, .006, marsMat, 25));
{ const r = rng(12); const rk = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), M(0x6a3424, { roughness: .95 }), 120); const dum = new THREE.Object3D();
  for (let i = 0; i < 120; i++) { const a = r() * 6.28, d = 6 + r() * 60; dum.position.set(Math.cos(a) * d, 0, Math.sin(a) * d); dum.scale.set(.3 + r() * 1.4, .2 + r() * .8, .3 + r() * 1.2); dum.rotation.set(r(), r() * 6, r()); dum.updateMatrix(); rk.setMatrixAt(i, dum.matrix); } mars.add(rk); }

// Partículas
const PS = new Particles(30000, { size: .06, seed: 3 }); scene.add(PS.obj);
const SPEC = [[1.6, .25, .2], [1.6, .7, .15], [1.5, 1.4, .2], [.3, 1.4, .4], [.2, .9, 1.7], [.25, .3, 1.8], [.8, .25, 1.6]];
const WHT = [1.4, 1.4, 1.4], BLU = [.25, .6, 1.8], RED = [1.8, .35, .2];
function beam(a, b, col, n, t, flow = .6, jit = .03, seedOff = 0) { const s = PS.seed; for (let i = 0; i < n; i++) { const q = ((i + seedOff) % PS.n) * 4; const u = fract(s[q] + t * flow);
  PS.push(lerp(a.x, b.x, u) + (s[q + 1] - .5) * jit, lerp(a.y, b.y, u) + (s[q + 2] - .5) * jit, lerp(a.z, b.z, u) + (s[q + 3] - .5) * jit, col[0], col[1], col[2]); } }

// ==========================================================================
// HUD
// ==========================================================================
function stamp(s, x, y, a, rot = -.08, col = '#ff6a4a', size = 86) { if (a <= .01) return; const sc = lerp(1.6, 1, easeOut(clamp(a * 1.4)));
  g2.save(); g2.translate(x, y); g2.rotate(rot); g2.scale(sc, sc); g2.globalAlpha = clamp(a); g2.strokeStyle = col; g2.lineWidth = 8; g2.shadowColor = col; g2.shadowBlur = 25;
  g2.font = `800 ${size}px Montserrat`; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.letterSpacing = '6px'; const w = g2.measureText(s).width + 70; g2.strokeRect(-w / 2, -size * .8, w, size * 1.6); g2.fillStyle = col; g2.fillText(s, 0, 4); g2.restore(); }
function two(top, l1, l2, a, y = 300) { if (a <= .01) return; txt(l1, W / 2, y, 50, { font: 'Montserrat', weight: 800, alpha: a }); if (l2) txt(l2, W / 2, y + 62, 50, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(160, 920, y + 62, .5) }); if (top) txt(top, W / 2, y - 62, 24, { spacing: 7, alpha: a * .8, fill: '#e3a372' }); }
const win = (t, a, b, f = .3) => smooth(a, a + f, t) * (1 - smooth(b - f, b, t));
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
function spectrumChart(a, t) { if (a <= .01) return; const x0 = 140, x1 = 940, y0 = 1180, y1 = 1600; const L = l => lerp(x0, x1, (l - 380) / 320);
  g2.save(); g2.globalAlpha = a * .85; g2.fillStyle = 'rgba(6,14,30,.78)'; g2.fillRect(80, 1080, 920, 640); g2.restore();
  const gr = g2.createLinearGradient(x0, 0, x1, 0); [['#8a2be2', 0], ['#3b3bff', .2], ['#00a2ff', .35], ['#22d36b', .55], ['#ffe14a', .7], ['#ff8a2a', .82], ['#ff2a2a', 1]].forEach(([c, o]) => gr.addColorStop(o, c));
  g2.save(); g2.globalAlpha = a; g2.fillStyle = gr; g2.fillRect(x0, y1 + 14, x1 - x0, 18); g2.restore();
  txt('violeta', L(400), y1 + 64, 22, { alpha: a * .8, weight: 300 }); txt('azul', L(465), y1 + 64, 22, { alpha: a * .8, weight: 300 }); txt('rojo', L(680), y1 + 64, 22, { alpha: a * .8, weight: 300 });
  txt('LUZ QUE NOS LLEGA DEL CIELO', W / 2, 1130, 24, { spacing: 6, alpha: a * .85, fill: '#e3a372' });
  const sunE = l => { const x = (l - 380) / 320; return clamp(.35 + x * 2.2) * (1 - Math.max(0, x - .4) * .5); }; const ray = l => Math.pow(450 / l, 4); const eye = l => Math.exp(-Math.pow((l - 555) / 75, 2));
  const draw = (f, col, k, lab, lx) => { if (k <= 0) return; g2.save(); g2.globalAlpha = a * k; g2.strokeStyle = col; g2.lineWidth = 7; g2.shadowColor = col; g2.shadowBlur = 16; g2.beginPath();
    for (let l = 380; l <= 700; l += 4) { const X = L(l), Y = lerp(y1, y0 + 40, f(l)); l === 380 ? g2.moveTo(X, Y) : g2.lineTo(X, Y); } g2.stroke(); g2.restore(); txt(lab, L(lx), lerp(y1, y0 + 40, f(lx)) - 34, 24, { font: 'Montserrat', weight: 800, alpha: a * k, fill: col }); };
  const k1 = smooth(TL.violet + .2, TL.violet + 1, t), k2 = smooth(TL.sunv, TL.sunv + .6, t), k3 = smooth(TL.eyes, TL.eyes + .6, t);
  draw(l => Math.min(1, ray(l) * .62), '#9fc4ff', k1, 'REBOTE', 395);
  draw(l => Math.min(1, ray(l) * .62) * sunE(l), '#ffe2c0', k2, 'SOL × REBOTE', 470);
  draw(eye, '#7fe08a', k3, 'TU OJO', 590);
}

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
function groundView(p = false) { earth.visible = true; person.visible = p; }
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .05; camera.far = 6000; camera.fov = 42;
  let bloomS = .45, flash = 0, ca = .0013, fade = 0, expo = 1, focus = V3();
  PS.begin(); PS.mat.size = .06; for (const g of [earth, lab, planet, mars]) g.visible = false; prism.visible = false; mols.forEach(m => m.visible = false); drop.visible = false; molTiny.visible = false;
  scene.fog.density = .0015; scene.fog.color.setRGB(.7, .8, .92); hemi.intensity = 1.3; sun.intensity = 2.6; cloudMat.color.setHex(0xffffff); cloudMat.emissive.setHex(0x9aa6b8); hemi.color.setHex(0xdfe8ff); sun.color.setHex(0xfff1dc);
  clouds.forEach(c => { c.position.copy(c.userData.home); c.position.x += t * 1.2; c.scale.setScalar(1); });
  setSky([.12, .32, .78], [.62, .78, .96], V3(-.4, .8, -.6), [1.5, 1.4, 1.2], [.5, .45, .35], 12);
  for (const c of ['white', 'every', 'violet', 'sunset', 'red', 'clouds', 'grey', 'mars', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];

  if (t < TL.white) {
    // A · un cielo azul
    groundView(); const lt = t; focus = V3(0, 40, -100); camera.position.set(0, 1.7, 8 - lt * .8); camera.fov = 50; camera.lookAt(focus.clone().add(V3(0, -lt * 6, 0)));
    hud.push(() => two(null, '¿POR QUÉ EL CIELO', 'ES AZUL?', smooth(.05, .3, lt), 300));
  } else if (t < TL.hit) {
    // B · la luz blanca lleva todos los colores (prisma)
    const lt = t - TL.white; lab.visible = true; prism.visible = true; setSky([0, 0, 0], [.01, .015, .03], V3(0, 1, 0), [0, 0, 0], [0, 0, 0], 8, .6); scene.fog.density = 0;
    focus = LAB.clone(); camera.position.copy(LAB).add(V3(lerp(-1.2, .6, clamp(lt / 3)), .4, 11)); camera.fov = 44; camera.lookAt(focus.clone().add(V3(.8, 0, 0)));
    const inA = LAB.clone().add(V3(-14, -1.2, 0)), hitP = LAB.clone().add(V3(-.55, -.25, 0)); const gw = smooth(0, .5, lt);
    beam(inA, hitP, WHT, 1600 * gw, t, .9, .06); const out = smooth(.5, 1.3, lt);
    if (out > 0) SPEC.forEach((c, i) => { const ex = LAB.clone().add(V3(.6, .1 + (i - 3) * .03, 0)); const end = LAB.clone().add(V3(14, -1 + (i - 3) * 1.2, 0)); beam(ex, ex.clone().lerp(end, out), c, 700, t, .7, .06, i * 900); });
    PS.mat.size = .3; bloomS = .8;
    hud.push(() => { two(null, 'LA LUZ DEL SOL', 'PARECE BLANCA…', smooth(.1, .4, lt) * (1 - smooth(1.6, 1.9, lt)), 300); two(null, 'PERO LLEVA', 'TODOS LOS COLORES', smooth(1.9, 2.2, lt), 300); });
  } else if (t < TL.every) {
    // C · moléculas: el azul rebota, el rojo pasa
    const lt = t - TL.hit; lab.visible = true; mols.forEach(m => m.visible = true); setSky([0, 0, 0], [.01, .02, .04], V3(0, 1, 0), [0, 0, 0], [0, 0, 0], 8, .4); scene.fog.density = 0;
    mols.forEach((m, i) => { const u = m.userData; m.position.copy(u.home).add(V3(Math.sin(t * .7 + i) * .3, Math.cos(t * .5 + i * 2) * .3, 0)); m.rotation.y = u.r[0] * 6 + t * (u.r[1] - .5); });
    const C = LAB.clone().add(MOLC); focus = C.clone(); camera.position.copy(C).add(V3(0, 0, lerp(13, 11, clamp(lt / 4)))); camera.fov = 48; camera.lookAt(focus);
    const s = PS.seed; const ph = 90; for (let i = 0; i < ph; i++) { const q = i * 4; const blue = i % 2 === 0; const col = blue ? BLU : (i % 4 === 1 ? RED : [1.6, .7, .2]);
      const lane = (s[q + 1] - .5) * 9, z = (s[q + 2] - .5) * 2; const u = fract(s[q] + t * .35); const x = -11 + u * 22; const hx = -7 + s[q + 3] * 12;
      for (let k = 0; k < 14; k++) { const xx = x - k * .09; let p;
        if (blue && xx > hx) { const d = xx - hx; const a = s[q + 3] * 12.6 + i; p = V3(hx + Math.cos(a) * d * .9, lane + Math.sin(a) * d * .9, z + Math.sin(a * 1.7) * d * .3); } else p = V3(xx, lane, z);
        const f = 1 - k / 14; PS.push(C.x + p.x, C.y + p.y, C.z + p.z, col[0] * f, col[1] * f, col[2] * f); } }
    PS.mat.size = .45; bloomS = .7;
    hud.push(() => { two(null, 'AL CHOCAR CON', 'LAS MOLÉCULAS DEL AIRE', smooth(.1, .4, lt) * (1 - smooth(TL.five - TL.hit - .3, TL.five - TL.hit, lt)), 300);
      const ba = smooth(TL.five, TL.five + .4, t); bar(170, 340, 740, 1, 'LUZ AZUL', 'rebota ×5', ba, '#7fb4ff'); bar(170, 440, 740, .2, 'LUZ ROJA', '×1', ba, '#ff7a5a');
      txt('N₂ · O₂', W / 2, 1640, 30, { weight: 300, alpha: smooth(.6, 1, lt) * .8, spacing: 4 }); });
  } else if (t < TL.violet) {
    // D · el azul te llega desde todas partes
    const lt = t - TL.every; groundView(true); focus = V3(0, 1.6, 0);
    camera.position.set(Math.sin(3.4 + lt * .05) * 4.5, 1.2, Math.cos(3.4 + lt * .05) * 4.5); camera.fov = 60; camera.lookAt(V3(0, 4, 0));
    const s = PS.seed; for (let i = 0; i < 2400; i++) { const q = i * 4; const a = s[q] * 6.283, el = .15 + s[q + 1] * 1.3; const src = V3(Math.cos(a) * Math.cos(el) * 26, Math.sin(el) * 26 + 1.6, Math.sin(a) * Math.cos(el) * 26);
      const u = fract(s[q + 2] + t * .5); const p = src.lerp(focus, u); const f = .8 * smooth(0, .5, lt); PS.push(p.x, p.y, p.z, BLU[0] * f, BLU[1] * f, BLU[2] * f); }
    PS.mat.size = .25; bloomS = .6;
    hud.push(() => two(null, 'MIRES DONDE MIRES,', 'TE LLEGA AZUL', smooth(.1, .4, lt), 300));
  } else if (t < TL.sunset) {
    // E · ¿por qué no violeta?
    const lt = t - TL.violet; groundView(); camera.position.set(0, 1.7, 2); camera.fov = 55; camera.lookAt(V3(0, 30, -60));
    setSky([lerp(.12, .3, smooth(0, .8, lt) * (1 - smooth(TL.sunv - TL.violet, TL.sunv - TL.violet + .8, lt))), .25, .82], [.62, .72, .96], V3(-.4, .8, -.6), [1.5, 1.4, 1.2], [.5, .45, .35], 12);
    hud.push(() => { two(null, '¿Y POR QUÉ NO VIOLETA,', 'SI REBOTA MÁS?', smooth(.1, .4, lt) * (1 - smooth(TL.sunv - .2, TL.sunv, t)), 300);
      two(null, 'EL SOL EMITE', 'MENOS VIOLETA', win(t, TL.sunv, TL.eyes), 300); two(null, 'Y TU OJO VE', 'MUCHO MEJOR EL AZUL', smooth(TL.eyes, TL.eyes + .3, t), 300);
      spectrumChart(smooth(TL.violet + .1, TL.violet + .5, t), t); });
  } else if (t < TL.red) {
    // F · el atardecer: la luz cruza mucho más aire
    const lt = t - TL.sunset; planet.visible = true; setSky([0, 0, 0], [.005, .01, .02], V3(1, 0, 0), [0, 0, 0], [0, 0, 0], 8, .7); scene.fog.density = 0; hemi.intensity = .5;
    const O = PLN.clone().add(V3(0, PR + .3, 0)); focus = O.clone().add(V3(-4, -2, 0)); camera.position.copy(O).add(V3(-4, 4, lerp(46, 40, clamp(lt / 6)))); camera.fov = 44; camera.lookAt(focus);
    const noon = smooth(.1, .6, lt) * (1 - smooth(TL.low - TL.sunset + .2, TL.low - TL.sunset + .8, lt)); if (noon > 0) beam(O.clone().add(V3(0, 22, 0)), O, WHT, 900 * noon, t, .9, .08);
    const sl = smooth(TL.low, TL.low + .6, t); const loseK = smooth(TL.lose, TL.lose + 1.6, t);
    if (sl > 0) { const A = O.clone().add(V3(-40, .0, 0)); const n = 3000 * sl; const s = PS.seed; for (let i = 0; i < n; i++) { const q = i * 4; const u = fract(s[q] + t * .5); const p = A.clone().lerp(O, u);
        const r0 = Math.hypot(p.x - PLN.x, p.y - PLN.y); const inAir = r0 < PR + 5 ? 1 : 0; const c = loseK > 0 ? [lerp(1.4, 1.9, u * loseK), lerp(1.4, .45, u * loseK), lerp(1.4, .15, u * loseK)] : WHT;
        PS.push(p.x + (s[q + 1] - .5) * .25, p.y + (s[q + 2] - .5) * .25, p.z, c[0], c[1], c[2]);
        if (loseK > 0 && inAir && s[q + 3] < .25) { const a = s[q + 1] * 6.28; const d = fract(s[q + 2] + t * .8) * 4; PS.push(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, p.z + Math.sin(a * 2) * d, BLU[0] * .7, BLU[1] * .7, BLU[2] * .7); } } }
    PS.mat.size = 1.1; bloomS = .7;
    hud.push(() => { two(null, '¿Y EL ATARDECER?', null, smooth(.1, .4, lt) * (1 - smooth(TL.low - .2, TL.low, t)), 300);
      callout(O.clone().add(V3(0, 12, 0)), 160, -80, 'MEDIODÍA', 'poco aire', win(t, TL.sunset + .5, TL.low + .4), '#ffffff');
      two('CON EL SOL BAJO', 'HASTA 40 VECES', 'MÁS AIRE', win(t, TL.low, TL.lose), 300);
      two(null, 'POR EL CAMINO', 'PIERDE EL AZUL', smooth(TL.lose, TL.lose + .3, t), 300);
      callout(O.clone().add(V3(-6, 0, 0)), -60, 260, 'AZUL', 'se dispersa', smooth(TL.lose + .6, TL.lose + 1, t), '#7fb4ff'); });
  } else if (t < TL.drops) {
    // G · atardecer real, luego nubes blancas
    const lt = t - TL.red; groundView();
    if (t < TL.clouds) { const k = smooth(TL.red, TL.red + 1.5, t); setSky([lerp(.12, .1, k), lerp(.25, .08, k), lerp(.6, .25, k)], [1.6, lerp(.7, .45, k), .2], V3(0, .03, -1), [2, 1.1, .4], [1.4, .5, .15], 6);
      sun.color.setRGB(1, .55, .3); sun.intensity = 1.6; hemi.intensity = .8; scene.fog.color.setRGB(.9, .5, .3); camera.position.set(0, 2, 6); camera.fov = 46; camera.lookAt(V3(0, 8, -100));
      hud.push(() => two(null, 'SOLO TE LLEGAN', 'NARANJAS Y ROJOS', smooth(.1, .4, lt), 300)); }
    else { const k = t - TL.clouds; camera.position.set(0, 2, 6); camera.fov = 55; camera.lookAt(V3(Math.sin(k * .05) * 20, 60, -120));
      hud.push(() => two(null, '¿Y LAS NUBES,', 'POR QUÉ SON BLANCAS?', smooth(TL.clouds + .1, TL.clouds + .4, t), 300)); }
  } else if (t < TL.grey) {
    // H · la gota: todos los colores por igual
    const lt = t - TL.drops; lab.visible = true; drop.visible = true; molTiny.visible = true; setSky([0, 0, 0], [.01, .015, .03], V3(0, 1, 0), [0, 0, 0], [0, 0, 0], 8, .5); scene.fog.density = 0;
    const C = LAB.clone().add(DROPC); focus = C.clone().add(V3(.8, -.5, 0)); camera.position.copy(C).add(V3(.8, .5, lerp(24, 21, clamp(lt / 5)))); camera.fov = 48; camera.lookAt(focus);
    const al = smooth(TL.all, TL.all + .6, t); if (al > 0) { SPEC.forEach((c, i) => { const y = (i - 3) * .45; beam(C.clone().add(V3(-14, y, 0)), C.clone().add(V3(-3.8, y, 0)), c, 500 * al, t, .7, .05, i * 700); });
      const s = PS.seed; for (let i = 0; i < 3500 * al; i++) { const q = (i + 9000) * 4; const a = s[q] * 6.283, b = (s[q + 1] - .5) * 1.4; const d = 4 + fract(s[q + 2] + t * .6) * 9; const c = SPEC[i % 7]; const w = smooth(TL.whiteall - .2, TL.whiteall + .6, t);
        const col = [lerp(c[0], 1.3, w), lerp(c[1], 1.3, w), lerp(c[2], 1.3, w)]; PS.push(C.x + Math.cos(a) * Math.cos(b) * d, C.y + Math.sin(a) * Math.cos(b) * d, C.z + Math.sin(b) * d, col[0] * .8, col[1] * .8, col[2] * .8); } }
    PS.mat.size = .4; bloomS = .7;
    hud.push(() => { two(null, 'SUS GOTAS SON MILES', 'DE VECES MÁS GRANDES', smooth(.1, .4, lt) * (1 - smooth(TL.all - .2, TL.all, t)), 300);
      callout(C.clone().add(V3(2.8, 2.8, 0)), 120, -160, 'GOTA', 'de nube', win(t, TL.drops + .3, TL.all + .4), '#9fd4ff'); callout(molTiny.position.clone().add(LAB), 60, 160, 'MOLÉCULA', 'de aire', win(t, TL.drops + .6, TL.all + .4), '#ffe2c0');
      two(null, 'REBOTAN TODOS', 'LOS COLORES POR IGUAL', win(t, TL.all, TL.whiteall), 300); stamp('= BLANCO', W / 2, 360, smooth(TL.whiteall, TL.whiteall + .3, t), -.05, '#ffffff', 84); });
  } else if (t < TL.mars) {
    // I · nubes grises
    const lt = t - TL.grey; groundView(); const g = smooth(TL.grey, TL.grey + 2, t);
    clouds.forEach((c, i) => { c.position.lerp(V3(c.userData.home.x * .35, 45 + c.userData.r * 10, c.userData.home.z * .35 - 20), g); c.scale.setScalar(1 + g * 1.6); });
    cloudMat.color.setRGB(lerp(1, .42, g), lerp(1, .44, g), lerp(1, .48, g)); cloudMat.emissive.setRGB(lerp(.6, .05, g), lerp(.65, .05, g), lerp(.72, .06, g)); hemi.intensity = lerp(1.3, .55, g); sun.intensity = lerp(2.6, .4, g);
    setSky([lerp(.12, .3, g), lerp(.32, .33, g), lerp(.78, .36, g)], [lerp(.62, .5, g), lerp(.78, .52, g), lerp(.96, .55, g)], V3(-.4, .8, -.6), [1.5 * (1 - g), 1.4 * (1 - g), 1.2 * (1 - g)], [.5 * (1 - g), .45 * (1 - g), .35 * (1 - g)], 12);
    scene.fog.color.setRGB(.5, .52, .55); scene.fog.density = .002 + g * .004; camera.position.set(0, 2, 6); camera.fov = 55; camera.lookAt(V3(0, 50, -110));
    const rn = smooth(TL.grey + 1.5, TL.grey + 2.5, t); if (rn > 0) { const s = PS.seed; for (let i = 0; i < 5000 * rn; i++) { const q = i * 4; const y = 30 - fract(s[q] + t * 1.4) * 32; PS.push((s[q + 1] - .5) * 40, y, -s[q + 2] * 40 + 2, .45, .5, .6); } PS.mat.size = .05; }
    hud.push(() => two(null, 'SI SON MUY GRUESAS,', 'SE VUELVEN GRISES', smooth(.1, .4, lt), 300));
  } else if (t < TL.brand) {
    // J · Marte: cielo caramelo y atardecer azul
    const lt = t - TL.mars; mars.visible = true; const ss = smooth(TL.blue - .3, TL.blue + 1.2, t);
    const sd = V3(0, lerp(.5, .03, ss), -1); setSky([lerp(.55, .06, ss), lerp(.42, .06, ss), lerp(.3, .1, ss)], [lerp(.9, .25, ss), lerp(.68, .2, ss), lerp(.45, .22, ss)], sd, [1.4, 1.35, 1.3], [lerp(.4, .3, ss), lerp(.3, .7, ss), lerp(.2, 1.8, ss)], lerp(10, 28, ss));
    sun.color.setRGB(1, .9, .8); sun.intensity = lerp(2.2, .5, ss); hemi.color.setRGB(1, .8, .6); hemi.intensity = lerp(1.2, .4, ss); scene.fog.color.setRGB(lerp(.85, .2, ss), lerp(.62, .2, ss), lerp(.42, .25, ss)); scene.fog.density = .004;
    camera.position.copy(MARS).add(V3(0, 2.2, 10 - lt * .4)); camera.fov = 50; camera.lookAt(MARS.clone().add(V3(0, lerp(12, 2, ss), -60)));
    hud.push(() => { two(null, '¿Y EN MARTE?', null, smooth(.1, .4, lt) * (1 - smooth(TL.reverse - .2, TL.reverse, t)), 300);
      two('POR EL POLVO', 'DE DÍA, EL CIELO', 'ES COLOR CARAMELO', win(t, TL.reverse, TL.blue), 300); two(null, 'Y LOS ATARDECERES', 'SON AZULES', smooth(TL.blue + .2, TL.blue + .6, t), 300); });
  } else {
    // K · marca: noche estrellada
    const lt = t - TL.brand; groundView(); setSky([.005, .01, .03], [.03, .05, .1], V3(0, -1, 0), [0, 0, 0], [0, 0, 0], 8, 1); hemi.intensity = .15; sun.intensity = .1; scene.fog.color.setRGB(.02, .03, .06);
    camera.position.set(0, 2, 6); camera.fov = 50; camera.lookAt(V3(0, 40 + lt * 2, -100)); fade = Math.min(.4, lt * .4); expo = .9;
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  sky.position.copy(camera.position); PS.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, bloom: bloomS, expo });
}
function renderCover() { renderFrame(TL.clouds + 1.2); coverText('¿POR QUÉ EL CIELO', 'ES AZUL?', 'y por qué en Marte es al revés'); }
window.renderCover = () => { renderCover(); return true; };
window.OBJ = { PS, scene };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
