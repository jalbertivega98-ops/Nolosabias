// NO LO SABÍAS — "¿Cómo vuela un avión de 319 toneladas?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final.
// Avión de referencia: bimotor de fuselaje ancho de 319 t al despegue (Airbus A350-1000: 73,8 m, 64,75 m de envergadura,
// ala de ~464 m², 2 × Rolls-Royce Trent XWB-97 de ~97.000 lbf ≈ 44 tf). Modelo genérico, sin marcas de aerolínea.
import { THREE, mergeGeometries, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, easeIn, rng, noise1, shake, V3,
  renderer, g2, camera, glowTexture, SOFT, sea, U, skyCol, SUN_DIR, skyDome, abyss, oceanMat, ocean, Particles,
  txt, copperGrad, project, fmt, callout, arrow2D, titleHUD, bar, fract, emitJet, camOrbit, arrowXY, bigStat, drawBrand, coverText, finish } from '../../lib/core.js';

abyss.visible = false;
const tmp = V3(0, 0, 0);
// ==========================================================================
// AVIÓN (metros; x = proa, y = arriba, z = ala derecha vista desde la cabina → -z)
// ==========================================================================
const FUS = { x0: -37, x1: 36.8, R: 2.98 };
function fusR(x) {
  if (x > 29) { const u = (x - 29) / (FUS.x1 - 29); return FUS.R * Math.sqrt(Math.max(0, 1 - Math.pow(u, 2.2))); }
  if (x < -16) { const u = (-16 - x) / (-16 - FUS.x0); return Math.max(.25, FUS.R * (1 - Math.pow(u, 1.6) * .9)); }
  return FUS.R;
}
function fusC(x) { if (x > 29) { const u = (x - 29) / (FUS.x1 - 29); return -.6 * u * u; } if (x < -16) { const u = (-16 - x) / (-16 - FUS.x0); return 1.9 * Math.pow(u, 1.5); } return 0; }
function liveryTexture() {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 512; const x = c.getContext('2d');
  x.fillStyle = '#e9ecef'; x.fillRect(0, 0, 2048, 512);
  // vientre gris (θ≈π → v=.5)
  const gr = x.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.36, 'rgba(0,0,0,0)'); gr.addColorStop(.42, 'rgba(120,128,138,.9)'); gr.addColorStop(.58, 'rgba(120,128,138,.9)'); gr.addColorStop(.64, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 2048, 512);
  // línea de cobre y ventanillas a ambos lados (v≈.22 y .78)
  for (const v of [.205, .795]) {
    x.fillStyle = '#c98a5a'; x.fillRect(120, v * 512 + (v < .5 ? 14 : -18), 1700, 4);
    x.fillStyle = '#2a3038'; for (let u = 300; u < 1700; u += 15.5) { if (Math.abs(u - 700) < 14 || Math.abs(u - 1250) < 14) continue; x.beginPath(); x.ellipse(u, v * 512, 3.2, 4.6, 0, 0, 7); x.fill(); }
    // puertas
    x.strokeStyle = 'rgba(80,90,100,.6)'; x.lineWidth = 2; for (const u of [250, 700, 1250, 1750]) x.strokeRect(u - 9, v * 512 - 22, 18, 40);
  }
  // cabina (proa: u≈1)
  x.fillStyle = '#1b2026'; for (const v of [.2, .8]) { x.beginPath(); x.moveTo(1925, v * 512 - 10); x.lineTo(1975, v * 512 - 14); x.lineTo(1985, v * 512 + 4); x.lineTo(1930, v * 512 + 8); x.fill(); }
  x.fillRect(1968, 0, 22, 20); x.fillRect(1968, 492, 22, 20);
  // paneles
  x.strokeStyle = 'rgba(0,0,0,.06)'; x.lineWidth = 1; for (let u = 0; u < 2048; u += 64) { x.beginPath(); x.moveTo(u, 0); x.lineTo(u, 512); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function fuselageGeo() {
  const NX = 220, NT = 64; const pos = [], uv = [], idx = [];
  for (let i = 0; i <= NX; i++) {
    const x = lerp(FUS.x0, FUS.x1, i / NX), r = fusR(x), cy = fusC(x);
    for (let j = 0; j <= NT; j++) { const th = j / NT * Math.PI * 2; pos.push(x, cy + Math.cos(th) * r, Math.sin(th) * r); uv.push(i / NX, j / NT); }
  }
  for (let i = 0; i < NX; i++) for (let j = 0; j < NT; j++) { const a = i * (NT + 1) + j, b = a + NT + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// Perfil alar (NACA 4 dígitos), puntos en sentido horario desde el borde de salida
function nacaPts(m, p, tk, n = 40, f0 = 0, f1 = 1) {
  const up = [], lo = [];
  for (let i = 0; i <= n; i++) {
    const b = i / n * Math.PI; const x = f0 + (f1 - f0) * (1 - Math.cos(b)) / 2;
    const yt = 5 * tk * (.2969 * Math.sqrt(x) - .126 * x - .3516 * x * x + .2843 * x ** 3 - .1036 * x ** 4);
    const yc = x < p ? m / (p * p) * (2 * p * x - x * x) : m / ((1 - p) ** 2) * ((1 - 2 * p) + 2 * p * x - x * x);
    up.push([x, yc + yt]); lo.push([x, yc - yt]);
  }
  const pts = up.reverse().concat(lo.slice(1)); pts.push(pts[0]); return pts; // lazo cerrado
}
// Superficie alar «loft»: secciones {le:[x,y,z], chord, tk, f0, f1} (f0..f1 = fracción de cuerda que se modela)
function loftGeo(secs, opts = {}) {
  const pos = [], idx = []; let nP = 0;
  const rows = secs.map(s => nacaPts(opts.m ?? .03, .4, s.tk, 40, s.f0 ?? 0, s.f1 ?? 1).map(([u, v]) => [s.le[0] - u * s.chord, s.le[1] + v * s.chord, s.le[2]]));
  nP = rows[0].length;
  rows.forEach(r => r.forEach(p => pos.push(...p)));
  for (let i = 0; i < rows.length - 1; i++) for (let j = 0; j < nP - 1; j++) { const a = i * nP + j, b = a + nP; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  // tapas
  for (const [ri, flip] of [[0, false], [rows.length - 1, true]]) { const c0 = pos.length / 3; const r = rows[ri]; const cx = r.reduce((s, p) => s + p[0], 0) / nP, cy = r.reduce((s, p) => s + p[1], 0) / nP; pos.push(cx, cy, r[0][2]);
    for (let j = 0; j < nP - 1; j++) { const a = ri * nP + j; flip ? idx.push(c0, a + 1, a) : idx.push(c0, a, a + 1); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const WING = { root: 2.6, tip: 32.4, leRootX: 7, sweep: Math.tan(33 * Math.PI / 180), dih: Math.tan(6 * Math.PI / 180), cRoot: 12.5, cTip: 2.4, y0: -1.7 };
const wingLE = zz => { const s = zz - WING.root; return [WING.leRootX - s * WING.sweep, WING.y0 + s * WING.dih]; };
const wingC = zz => lerp(WING.cRoot, WING.cTip, clamp((zz - WING.root) / (WING.tip - WING.root)) ** .85);
const wingT = zz => lerp(.13, .095, clamp((zz - WING.root) / (WING.tip - WING.root)));
const FLAP = [3.2, 17.5], AIL = [21.5, 29.4], HINGE = .76;
function wingSecs(side) {
  const zs = [WING.root, FLAP[0], FLAP[0], 10, FLAP[1], FLAP[1], 19.5, AIL[0], AIL[0], 25.5, AIL[1], AIL[1], 31, WING.tip];
  const cut = z => (z > FLAP[0] && z < FLAP[1]) || (z > AIL[0] && z < AIL[1]);
  return zs.map((z, i) => { const inside = (zs[i] === zs[i - 1] ? cut(z + .01) : zs[i] === zs[i + 1] ? cut(z - .01) : cut(z)); const [lx, ly] = wingLE(z); return { le: [lx, ly, z * side], chord: wingC(z), tk: wingT(z), f0: 0, f1: inside ? HINGE : 1 }; });
}
function surfaceSecs(z0, z1, side) { return [z0, (z0 + z1) / 2, z1].map(z => { const [lx, ly] = wingLE(z); return { le: [lx, ly, z * side], chord: wingC(z), tk: wingT(z), f0: HINGE + .005, f1: 1 }; }); }
// Superficie móvil (flap/alerón) articulada sobre su línea de bisagra
function movable(z0, z1, side, mat) {
  const geo = loftGeo(surfaceSecs(z0, z1, side));
  const [ax, ay] = wingLE(z0), [bx, by] = wingLE(z1);
  const h0 = V3(ax - wingC(z0) * HINGE, ay, z0 * side), h1 = V3(bx - wingC(z1) * HINGE, by, z1 * side);
  geo.translate(-h0.x, -h0.y, -h0.z);
  const pivot = new THREE.Group(); pivot.position.copy(h0); const m = new THREE.Mesh(geo, mat); pivot.add(m);
  pivot.userData = { axis: h1.clone().sub(h0).normalize(), h0: h0.clone(), side };
  return pivot;
}
function setMovable(pv, ang, slide = 0) { pv.quaternion.setFromAxisAngle(pv.userData.axis, ang); pv.position.copy(pv.userData.h0).add(V3(-slide, -slide * .25, 0)); }

const ac = new THREE.Group(); sea.add(ac);
const LIV = liveryTexture();
const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: LIV, roughness: .32, metalness: .15 });
const wingMat = new THREE.MeshStandardMaterial({ color: 0xc2c7cd, roughness: .38, metalness: .35, side: THREE.DoubleSide });
const surfMat = new THREE.MeshStandardMaterial({ color: 0xb0b6bd, roughness: .4, metalness: .35, emissive: new THREE.Color(1, .5, .2), emissiveIntensity: 0, side: THREE.DoubleSide });
const tailMat = new THREE.MeshStandardMaterial({ color: 0x0e1a2c, roughness: .35, metalness: .25, side: THREE.DoubleSide });
const fus = new THREE.Mesh(fuselageGeo(), bodyMat); ac.add(fus);
const wings = [], flaps = [], ails = [];
for (const side of [1, -1]) {
  const w = new THREE.Mesh(loftGeo(wingSecs(side)), wingMat); ac.add(w); wings.push(w);
  const f = movable(FLAP[0] + .05, FLAP[1] - .05, side, surfMat); ac.add(f); flaps.push(f);
  const a = movable(AIL[0] + .05, AIL[1] - .05, side, surfMat); ac.add(a); ails.push(a);
  // aleta curvada (winglet)
  const [tx, ty] = wingLE(WING.tip);
  const wlg = loftGeo([{ le: [tx, ty, WING.tip * side], chord: WING.cTip, tk: .09 }, { le: [tx - 1.2, ty + .9, (WING.tip + .9) * side], chord: 1.8, tk: .09 }, { le: [tx - 2.6, ty + 3.4, (WING.tip + 1.3) * side], chord: .9, tk: .09 }], { m: 0 });
  ac.add(new THREE.Mesh(wlg, wingMat));
}
// Estabilizadores
for (const side of [1, -1]) {
  const secs = [0, 1].map(k => { const z = lerp(1.2, 10.2, k); return { le: [-27.5 - (z - 1.2) * .75, 2.3 + (z - 1.2) * .06, z * side], chord: lerp(6.8, 2.2, k), tk: .1 }; });
  ac.add(new THREE.Mesh(loftGeo(secs, { m: 0 }), wingMat));
}
// Deriva: se construye en el plano (x, z) y se gira para levantarla
{ const secs = [0, 1].map(k => { const h = lerp(0, 11.5, k); return { le: [-25.5 - h * .95, 0, h], chord: lerp(10.5, 3.6, k), tk: .1 }; });
  const g = loftGeo(secs, { m: 0 }); g.rotateX(-Math.PI / 2); g.translate(0, 2.6, 0); const fin = new THREE.Mesh(g, tailMat); ac.add(fin);
  // logotipo de cobre en la deriva (anillo + punto)
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.45, 48, 1, .5, 5.3), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.2, .62, .35), side: THREE.DoubleSide }));
  for (const s of [1, -1]) { const r = ring.clone(); r.position.set(-33.2, 8.6, .52 * s); r.rotation.y = s > 0 ? 0 : Math.PI; ac.add(r); const d = new THREE.Mesh(new THREE.CircleGeometry(.32, 20), r.material); d.position.set(-33.2 + .3, 8.75, .53 * s); d.rotation.y = r.rotation.y; ac.add(d); }
}
// Motores (turbofán) bajo el ala
const fans = [], engGlow = [];
const nacMat = new THREE.MeshStandardMaterial({ color: 0xdfe3e7, roughness: .3, metalness: .3, side: THREE.DoubleSide });
const darkMat = new THREE.MeshStandardMaterial({ color: 0x2a2e33, roughness: .5, metalness: .6, side: THREE.DoubleSide });
function latheX(x0, x1, rf, n = 48, seg = 48) { const pts = []; for (let i = 0; i <= n; i++) { const x = lerp(x0, x1, i / n); pts.push(new THREE.Vector2(Math.max(.001, rf(x)), x)); } const g = new THREE.LatheGeometry(pts, seg); g.rotateZ(-Math.PI / 2); return g; }
function makeFan(R, blades = 22) {
  const g = new THREE.Group();
  const bl = new THREE.BoxGeometry(.06, R * .92, .42); bl.translate(0, R * .5, 0);
  for (let i = 0; i < blades; i++) { const m = new THREE.Mesh(bl, new THREE.MeshStandardMaterial({ color: 0x9aa2aa, roughness: .25, metalness: .9 })); m.rotation.x = i / blades * Math.PI * 2; m.children; const piv = new THREE.Group(); piv.rotation.x = i / blades * Math.PI * 2; const b = new THREE.Mesh(bl, m.material); b.rotation.y = .55; piv.add(b); g.add(piv); }
  const sp = new THREE.Mesh(new THREE.ConeGeometry(R * .32, R * .9, 32), new THREE.MeshStandardMaterial({ color: 0x15181c, roughness: .3, metalness: .7 })); sp.rotation.z = -Math.PI / 2; sp.position.x = R * .35; g.add(sp);
  // espiral blanca del cono (se ve girar)
  const sw = new THREE.Mesh(new THREE.TorusGeometry(R * .18, .03, 6, 24, Math.PI * 1.3), new THREE.MeshBasicMaterial({ color: 0xffffff })); sw.rotation.y = Math.PI / 2; sw.position.x = R * .45; g.add(sw);
  return g;
}
const engines = [];
for (const side of [1, -1]) {
  const z = 10.6 * side; const [lx, ly] = wingLE(10.6);
  const eg = new THREE.Group(); eg.position.set(lx + 1.4, ly - 2.35, z); ac.add(eg); engines.push(eg);
  const nac = new THREE.Mesh(latheX(-5.6, 2.2, x => x > 1.2 ? 1.72 - (x - 1.2) * .12 : x < -3.2 ? 1.72 - Math.pow((-3.2 - x) / 2.4, 1.4) * .62 : 1.72, 60, 56), nacMat); eg.add(nac);
  const inner = new THREE.Mesh(latheX(-5.5, 2.15, x => 1.5, 4, 48), darkMat); inner.material = darkMat; eg.add(inner);
  const core = new THREE.Mesh(latheX(-7.6, -4.6, x => x < -6.8 ? .9 - (-6.8 - x) * .55 : .95, 30, 40), darkMat); eg.add(core);
  const plug = new THREE.Mesh(latheX(-8.6, -6.6, x => .55 * (1 - Math.pow((-6.6 - x) / 2, 1.3)), 20, 32), new THREE.MeshStandardMaterial({ color: 0x5a5f66, roughness: .4, metalness: .8 })); eg.add(plug);
  const fan = makeFan(1.48); fan.position.x = 1.1; eg.add(fan); fans.push(fan);
  const pyl = new THREE.Mesh(new THREE.BoxGeometry(7, 1.8, .5), wingMat); pyl.position.set(-2.4, 1.6, 0); pyl.rotation.z = -.06; eg.add(pyl);
  const gl = new THREE.Mesh(new THREE.CircleGeometry(.8, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.5, 1.2, .5), transparent: true, opacity: 0, toneMapped: false, side: THREE.DoubleSide })); gl.rotation.y = Math.PI / 2; gl.position.x = -7.62; eg.add(gl); engGlow.push(gl);
}
// Tren de aterrizaje
const gear = new THREE.Group(); ac.add(gear);
{ const wm = new THREE.MeshStandardMaterial({ color: 0x111316, roughness: .8 }); const sm = new THREE.MeshStandardMaterial({ color: 0x9aa1a8, roughness: .3, metalness: .9 });
  const wheel = new THREE.CylinderGeometry(.66, .66, .45, 24); wheel.rotateX(Math.PI / 2);
  for (const [x, z, n] of [[-1.5, 5.4, 6], [-1.5, -5.4, 6], [27.5, 0, 2]]) {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, 3.2, 10), sm); st.position.set(x, -4.2, z); gear.add(st);
    for (let i = 0; i < n; i++) { const w = new THREE.Mesh(wheel, wm); w.position.set(x + (n > 2 ? (Math.floor(i / 2) - 1) * 1.5 : 0), -5.65, z + (i % 2 ? .55 : -.55)); gear.add(w); }
  }
}
// Luces de navegación y estroboscópicas
const navL = []; for (const [z, c] of [[WING.tip + 1.3, [3, .2, .2]], [-(WING.tip + 1.3), [.2, 3, .6]]]) { const [lx, ly] = wingLE(WING.tip); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: SOFT, color: new THREE.Color(...c), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); s.position.set(lx - 2.6, ly + 3.4, z); s.scale.setScalar(2.2); ac.add(s); navL.push(s); }
const strobe = new THREE.Sprite(new THREE.SpriteMaterial({ map: SOFT, color: new THREE.Color(4, 4, 4), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); strobe.position.set(-37.2, 3.2, 0); ac.add(strobe);
const W2 = (x, y, z) => ac.localToWorld(V3(x, y, z));
function placeAC(x, y, z, pitch = 0, roll = 0, yaw = 0) { ac.position.set(x, y, z); ac.rotation.set(roll, yaw, pitch, 'YZX'); ac.updateMatrixWorld(true); }

// ==========================================================================
// ENTORNOS: aeropuerto al atardecer, mar de nubes, océano e isla
// ==========================================================================
function runwayTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 2048; const x = c.getContext('2d');
  const r = rng(4); x.fillStyle = '#2b2d30'; x.fillRect(0, 0, 256, 2048);
  for (let i = 0; i < 9000; i++) { const v = 30 + r() * 30; x.fillStyle = `rgba(${v},${v},${v + 3},.35)`; x.fillRect(r() * 256, r() * 2048, 2, 2); }
  x.fillStyle = '#d9d9d2'; x.fillRect(6, 0, 4, 2048); x.fillRect(246, 0, 4, 2048);
  for (let y = 0; y < 2048; y += 128) x.fillRect(125, y, 6, 64);
  x.fillStyle = 'rgba(15,15,15,.25)'; for (let i = 0; i < 40; i++) x.fillRect(90 + r() * 70, r() * 2048, 8 + r() * 10, 30 + r() * 120); // marcas de goma
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 16; t.colorSpace = THREE.SRGBColorSpace; return t;
}
const airport = new THREE.Group(); sea.add(airport);
const RW = { len: 4000, wid: 60 };
{ const tex = runwayTexture(); tex.repeat.set(1, RW.len / 500);
  const rw = new THREE.Mesh(new THREE.PlaneGeometry(RW.wid, RW.len), new THREE.MeshStandardMaterial({ map: tex, roughness: .85, metalness: 0 }));
  rw.rotation.x = -Math.PI / 2; rw.rotation.z = Math.PI / 2; rw.position.set(RW.len / 2 - 600, .02, 0); airport.add(rw);
  const gTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); const r = rng(8); x.fillStyle = '#1d231b'; x.fillRect(0, 0, 512, 512); for (let i = 0; i < 20000; i++) { const g = 25 + r() * 25; x.fillStyle = `rgba(${g},${g + 8},${g},.5)`; x.fillRect(r() * 512, r() * 512, 3, 3); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(400, 400); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(20000, 20000), new THREE.MeshStandardMaterial({ map: gTex, roughness: 1 })); gr.rotation.x = -Math.PI / 2; airport.add(gr);
  // calle de rodaje
  const tw = new THREE.Mesh(new THREE.PlaneGeometry(30, 600), new THREE.MeshStandardMaterial({ color: 0x2a2c2f, roughness: .9 })); tw.rotation.x = -Math.PI / 2; tw.position.set(1500, .015, 300); airport.add(tw);
}
// Luces de pista, de aproximación y de la ciudad en el horizonte
const lightsP = new Particles(6000, { size: 4.5, seed: 12, fog: false }); airport.add(lightsP.obj);
const LIGHTS = []; { const r = rng(14);
  for (let x = -600; x < RW.len - 600; x += 30) { LIGHTS.push([x, .4, RW.wid / 2 + 2, 2.6, 2.2, 1.6]); LIGHTS.push([x, .4, -RW.wid / 2 - 2, 2.6, 2.2, 1.6]); LIGHTS.push([x, .25, 0, 1.6, 1.7, 2.2]); }
  for (let x = -600; x > -1500; x -= 60) for (let k = -3; k <= 3; k++) LIGHTS.push([x, .6, k * 4, 1.8, 1.5, 1.0]);
  for (let k = -12; k <= 12; k++) LIGHTS.push([-602, .4, k * 2.5, .3, 2, .5]);
  for (let z = 0; z < 600; z += 25) { LIGHTS.push([1485, .3, z, .2, 1.6, .9]); LIGHTS.push([1515, .3, z, .2, 1.6, .9]); }
  for (let i = 0; i < 2600; i++) { const a = r() * Math.PI * 2, d = 4000 + r() * 4000; LIGHTS.push([Math.cos(a) * d + 1500, 1 + r() * 30, Math.sin(a) * d, 1.6, .9 + r() * .4, .45]); }
}
// Mar de nubes para el crucero (sprites suaves teñidos por el sol bajo)
const cloudTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); const r = rng(77);
  for (let i = 0; i < 70; i++) { const a = r() * 6.28, d = Math.pow(r(), .7) * 52, R = 16 + r() * 30; const cx = 128 + Math.cos(a) * d, cy = 128 + Math.sin(a) * d * .6;
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, R); g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const clouds = new THREE.Group(); sea.add(clouds);
{ const N = 2600, pos = new Float32Array(N * 3), col = new Float32Array(N * 3); const r = rng(31);
  for (let i = 0; i < N; i++) { const x = (r() - .5) * 9000, z = (r() - .5) * 9000, y = -620 + r() * 70 + Math.sin(x * .002) * 25; pos.set([x, y, z], i * 3); const k = .55 + r() * .45; col.set([1.0 * k, .72 * k, .58 * k], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.PointsMaterial({ map: cloudTex, size: 900, vertexColors: true, transparent: true, opacity: .8, depthWrite: false, sizeAttenuation: true, fog: false });
  const p = new THREE.Points(g, m); p.frustumCulled = false; clouds.add(p);
  const base = new THREE.Mesh(new THREE.PlaneGeometry(20000, 20000), new THREE.MeshBasicMaterial({ color: new THREE.Color(.55, .34, .3), fog: false })); base.rotation.x = -Math.PI / 2; base.position.y = -640; base.material.depthWrite = false; base.renderOrder = -.5; clouds.add(base);
}
// Isla (Azores) para el final del planeo
const island = new THREE.Group(); sea.add(island);
{ const g = new THREE.SphereGeometry(1, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2); const p = g.attributes.position; const r = rng(5);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const n = 1 + .25 * Math.sin(x * 5 + z * 3) + .15 * Math.sin(z * 9 - x * 4); p.setXYZ(i, x * 900, y * 260 * n, z * 1500); }
  g.computeVertexNormals(); const isl = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x1c2a22, roughness: 1 })); island.add(isl);
  const lp = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(Array.from({ length: 900 }, (_, i) => { const a = r() * 6.28, d = .55 + r() * .45; const ux = Math.cos(a) * d, uz = Math.sin(a) * d; const n = 1 + .25 * Math.sin(ux * 5 + uz * 3) + .15 * Math.sin(uz * 9 - ux * 4); return [ux * 900, 260 * Math.sqrt(Math.max(0, 1 - d * d)) * n + 4, uz * 1500]; }).flat(), 3)),
    new THREE.PointsMaterial({ map: SOFT, size: 22, color: new THREE.Color(1.6, 1.0, .5), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  island.add(lp);
}
// Vórtices de punta de ala y aire descendente
const vort = new Particles(9000, { size: 1.2, seed: 41, fog: false }); sea.add(vort.obj);
const flowP = new Particles(6000, { size: 1.2, seed: 43, fog: false }); sea.add(flowP.obj);
// Segundo avión (esperando en cabecera)
const ac2 = ac.clone(true); ac2.scale.setScalar(.6); sea.add(ac2); ac2.visible = false;

// Luces
const hemi = new THREE.HemisphereLight(0x9fb8d8, 0x1a1410, .7); sea.add(hemi);
const sunL = new THREE.DirectionalLight(0xffa060, 2.4); sea.add(sunL); sea.add(sunL.target);
const keyL = new THREE.DirectionalLight(0xdfe8ff, 1.0); sea.add(keyL); sea.add(keyL.target);
const rimL = new THREE.DirectionalLight(0x8fb4ff, .9); sea.add(rimL); sea.add(rimL.target);

// ==========================================================================
// LABORATORIO: perfil alar con flujo potencial exacto (Joukowski + condición de Kutta)
// ==========================================================================
const lab = new THREE.Scene(); lab.fog = new THREE.FogExp2(new THREE.Color(.01, .02, .04), .012);
{ const bg = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec3 vD; void main(){ float y=vD.y*.5+.5; vec3 c=mix(vec3(.004,.012,.03),vec3(.03,.07,.12),y); c+=vec3(.25,.12,.05)*pow(max(-vD.z,0.),6.)*.25; gl_FragColor=vec4(c,1.); }` }));
  lab.add(bg); }
lab.add(new THREE.HemisphereLight(0x9fc8ff, 0x0a0806, .8));
const labKey = new THREE.DirectionalLight(0xffffff, 2.2); labKey.position.set(-5, 8, 10); lab.add(labKey);
const labRim = new THREE.DirectionalLight(0xffa060, 1.6); labRim.position.set(6, -2, -8); lab.add(labRim);
// Joukowski
const J = { a: 0, z0: [-.09, .1], alpha: 6 * Math.PI / 180, G: 0 };
J.a = Math.hypot(1 - J.z0[0], J.z0[1]); const beta = Math.atan2(J.z0[1], 1 - J.z0[0]); J.G = 4 * Math.PI * J.a * Math.sin(J.alpha + beta);
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]], cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]], csub = (a, b) => [a[0] - b[0], a[1] - b[1]], cconj = a => [a[0], -a[1]], cexp = th => [Math.cos(th), Math.sin(th)];
const jz = z => cadd(z, cdiv([1, 0], z));                        // ζ → z
function zeta(z) { const d = csub(cmul(z, z), [4, 0]); const r = Math.hypot(d[0], d[1]); const s = [Math.sqrt((r + d[0]) / 2), Math.sign(d[1] || 1) * Math.sqrt(Math.max(0, (r - d[0]) / 2))];
  const z1 = [(z[0] + s[0]) / 2, (z[1] + s[1]) / 2], z2 = [(z[0] - s[0]) / 2, (z[1] - s[1]) / 2]; const out = p => Math.hypot(p[0] - J.z0[0], p[1] - J.z0[1]);
  return out(z1) >= out(z2) ? z1 : z2; }
function velZ(zt) {  // velocidad (u,v) en el plano físico dado ζ
  const zp = csub(zt, J.z0); const ea = cexp(-J.alpha), eb = cexp(J.alpha);
  const w = cadd(csub(ea, cmul([J.a * J.a, 0], cdiv(eb, cmul(zp, zp)))), cdiv([0, J.G / (2 * Math.PI)], zp));
  const dz = csub([1, 0], cdiv([1, 0], cmul(zt, zt))); const Wc = cdiv(w, dz); return [Wc[0], -Wc[1]];
}
// Escala/rotación al mundo: cuerda ≈ 4 → 6 m, centrado; el flujo llega horizontal (el perfil queda inclinado α)
const LS = 1.5;
const toW = (z) => V3(z[0] * LS, z[1] * LS, 0).applyAxisAngle(V3(0, 0, 1), -J.alpha);
// Contorno del perfil y malla extruida
const foilPts = []; for (let i = 0; i <= 160; i++) { const th = i / 160 * Math.PI * 2; const zt = cadd(J.z0, [J.a * Math.cos(th), J.a * Math.sin(th)]); foilPts.push(jz(zt)); }
const foilShape = new THREE.Shape(foilPts.map(p => { const w = toW(p); return new THREE.Vector2(w.x, w.y); }));
const foilGeo = new THREE.ExtrudeGeometry(foilShape, { depth: 5, bevelEnabled: false, curveSegments: 4 }); foilGeo.translate(0, 0, -2.5);
const foilMat = new THREE.MeshStandardMaterial({ color: 0xc8ced6, roughness: .3, metalness: .45, emissive: new THREE.Color(.05, .07, .1) });
const foil = new THREE.Mesh(foilGeo, foilMat); lab.add(foil);
const foilEdge = new THREE.Line(new THREE.BufferGeometry().setFromPoints(foilPts.map(p => toW(p).add(V3(0, 0, 2.52)))), new THREE.LineBasicMaterial({ color: new THREE.Color(2.2, 1.1, .5) })); lab.add(foilEdge);
// Líneas de corriente precalculadas (integración RK4 en el plano ζ)
const SL = []; const DT = .02;
for (let j = 0; j < 46; j++) {
  const y0 = lerp(-3.4, 3.4, j / 45) + (Math.abs(lerp(-3.4, 3.4, j / 45)) < .2 ? .07 : 0);
  let z = [-7.5, y0 + 7.5 * Math.tan(J.alpha) * 0]; // entrada horizontal en marco del flujo
  // el flujo libre va en dirección α respecto al perfil: arrancamos en el marco del perfil girado
  const ca = Math.cos(J.alpha), sa = Math.sin(J.alpha); z = [-7.5 * ca - y0 * sa * -1 * 0 + (-y0) * sa * 0, 0];
  z = [-7.5 * ca + y0 * sa * -1 * -1 * 0 - y0 * sa, -7.5 * sa * 1 + y0 * ca];
  const path = []; let p = z.slice();
  for (let k = 0; k < 1400; k++) {
    path.push(p.slice()); const f = q => velZ(zeta(q));
    const k1 = f(p), k2 = f([p[0] + k1[0] * DT / 2, p[1] + k1[1] * DT / 2]), k3 = f([p[0] + k2[0] * DT / 2, p[1] + k2[1] * DT / 2]), k4 = f([p[0] + k3[0] * DT, p[1] + k3[1] * DT]);
    p = [p[0] + (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) * DT / 6, p[1] + (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) * DT / 6];
    if (!isFinite(p[0]) || p[0] > 9) break;
  }
  SL.push({ y0, path: path.map(q => toW(q)) });
}
// Mapa de presión (Cp = 1 − |V|²/U²) detrás del perfil
const presTex = (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 384; const x = c.getContext('2d'); const img = x.createImageData(512, 384);
  for (let j = 0; j < 384; j++) for (let i = 0; i < 512; i++) {
    const wx = lerp(-9, 9, i / 511), wy = lerp(6.75, -6.75, j / 383); const pr = V3(wx / LS, wy / LS, 0).applyAxisAngle(V3(0, 0, 1), J.alpha);
    const zt = zeta([pr.x, pr.y]); const inside = Math.hypot(zt[0] - J.z0[0], zt[1] - J.z0[1]) < J.a * 1.001; const v = velZ(zt); let cp = 1 - (v[0] * v[0] + v[1] * v[1]);
    cp = clamp(cp, -2.2, 1); const k = (j * 512 + i) * 4; const fall = Math.exp(-((wx / 9) ** 2 + (wy / 6) ** 2) * 1.6);
    let r, g, b; if (cp < 0) { const s = clamp(-cp / 1.6); r = 20 * s; g = 140 * s; b = 255 * s; } else { const s = clamp(cp * 2.2); r = 255 * s; g = 120 * s; b = 45 * s; }
    img.data[k] = r; img.data[k + 1] = g; img.data[k + 2] = b; img.data[k + 3] = inside ? 0 : 255 * fall * clamp(Math.abs(cp) * (cp > 0 ? 2.6 : 1.3));
  }
  x.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const presPlane = new THREE.Mesh(new THREE.PlaneGeometry(18, 13.5), new THREE.MeshBasicMaterial({ map: presTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); presPlane.position.z = -2.6; lab.add(presPlane);
const labP = new Particles(16000, { size: .16, seed: 51, fog: false }); lab.add(labP.obj);
const pulseP = new Particles(800, { size: .3, seed: 52, fog: false }); lab.add(pulseP.obj);
function slAt(sl, s) { const n = sl.path.length - 1; const f = clamp(s / DT, 0, n); const i = Math.floor(f), u = f - i; if (i >= n) return sl.path[n]; return sl.path[i].clone().lerp(sl.path[i + 1], u); }

// --------------------------------------------------------------------------
// Turbofán en corte (para la explicación del empuje)
// --------------------------------------------------------------------------
const tf = new THREE.Group(); lab.add(tf); tf.visible = false;
const xrayMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  uniforms: { uA: { value: 1 }, uCol: { value: new THREE.Color(.35, .75, 1.2) } },
  vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform float uA; uniform vec3 uCol; varying vec3 vN; varying vec3 vV; void main(){ float f=pow(clamp(1.-abs(dot(vN,vV)),0.,1.),2.2); gl_FragColor=vec4(uCol*(f*.9+.06),uA*(f*.8+.05)); }` });
{ const nac = new THREE.Mesh(latheX(-6, 2.4, x => x > 1.2 ? 1.85 - (x - 1.2) * .12 : x < -3.4 ? 1.85 - Math.pow((-3.4 - x) / 2.6, 1.4) * .6 : 1.85, 60, 64), xrayMat); tf.add(nac);
  const fanBig = makeFan(1.6, 22); fanBig.position.x = 1.2; tf.add(fanBig); tf.userData.fan = fanBig;
  const cm = new THREE.MeshStandardMaterial({ color: 0x9aa3ac, roughness: .3, metalness: .9, emissive: new THREE.Color(.3, .7, 1), emissiveIntensity: .05 });
  const stages = []; for (let i = 0; i < 14; i++) { const x = .2 - i * .26; const r = lerp(.95, .55, i / 13); const d = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .08, 40), cm); d.rotation.z = Math.PI / 2; d.position.x = x; tf.add(d); stages.push(d); }
  const comb = new THREE.Mesh(new THREE.TorusGeometry(.62, .2, 16, 48), new THREE.MeshStandardMaterial({ color: 0x55402f, emissive: new THREE.Color(2.4, .9, .25), emissiveIntensity: 0, roughness: .5 })); comb.rotation.y = Math.PI / 2; comb.position.x = -3.6; tf.add(comb); tf.userData.comb = comb;
  const tm = new THREE.MeshStandardMaterial({ color: 0x8a6d5a, roughness: .35, metalness: .9, emissive: new THREE.Color(1, .4, .15), emissiveIntensity: .25 });
  for (let i = 0; i < 6; i++) { const x = -4.1 - i * .3; const r = lerp(.62, .85, i / 5); const d = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .1, 40), tm); d.rotation.z = Math.PI / 2; d.position.x = x; tf.add(d); stages.push(d); }
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 7.5, 12), cm); shaft.rotation.z = Math.PI / 2; shaft.position.x = -2.4; tf.add(shaft);
  const coreCase = new THREE.Mesh(latheX(-6.9, .5, x => x > -.2 ? 1.05 : x < -5.2 ? 1.0 - (-5.2 - x) * .25 : 1.05, 40, 48), xrayMat.clone()); coreCase.material.uniforms.uCol.value = new THREE.Color(1.2, .6, .3); tf.add(coreCase);
  tf.userData.stages = stages;
}
const tfP = new Particles(9000, { size: .22, seed: 61, fog: false }); lab.add(tfP.obj);

// ==========================================================================
// HUD propio del vídeo
// ==========================================================================
function flightHUD(spd, alt, a) {
  if (a <= .01) return;
  txt('VELOCIDAD', 80, 205, 22, { align: 'left', spacing: 7, alpha: a * .7, fill: '#e3a372' });
  txt(fmt(spd) + ' km/h', 78, 262, 60, { align: 'left', font: 'Montserrat', weight: 800, alpha: a });
  if (alt !== null) { txt('ALTITUD', W - 80, 205, 22, { align: 'right', spacing: 7, alpha: a * .7, fill: '#e3a372' });
    txt(fmt(alt) + ' m', W - 78, 262, 60, { align: 'right', font: 'Montserrat', weight: 800, alpha: a }); }
}
function carsGrid(a, k) {
  if (a <= .01) return; const cols = 20, rows = 10, cw = 42, ch = 26, x0 = W / 2 - cols * cw / 2, y0 = 1330;
  g2.save(); g2.globalAlpha = a;
  const n = Math.floor(200 * k);
  for (let i = 0; i < 200; i++) { const cx = x0 + (i % cols) * cw + 4, cy = y0 + Math.floor(i / cols) * ch; const on = i < n;
    g2.fillStyle = on ? '#e3a372' : 'rgba(255,255,255,.12)'; g2.beginPath(); g2.roundRect(cx, cy + 6, 32, 10, 3); g2.fill(); g2.beginPath(); g2.roundRect(cx + 7, cy + 1, 17, 8, 3); g2.fill();
    g2.fillStyle = on ? '#3a2416' : 'rgba(0,0,0,.3)'; g2.beginPath(); g2.arc(cx + 8, cy + 17, 3.2, 0, 7); g2.arc(cx + 24, cy + 17, 3.2, 0, 7); g2.fill(); }
  g2.restore();
  txt('= ' + n + ' COCHES', W / 2, y0 + rows * ch + 50, 46, { font: 'Montserrat', weight: 800, alpha: a, spacing: 2 });
}
function cockpit(a, spd, t) {
  if (a <= .01) return; g2.save(); g2.globalAlpha = a;
  g2.fillStyle = '#07090c'; g2.beginPath(); g2.rect(0, 0, W, H);
  // parabrisas: dos ventanas centrales y dos laterales (recortes)
  const win = [[[120, 520], [520, 470], [520, 980], [90, 1040]], [[560, 470], [960, 520], [990, 1040], [560, 980]]];
  win.forEach(p => { g2.moveTo(...p[0]); p.slice(1).forEach(q => g2.lineTo(...q)); g2.closePath(); });
  g2.fill('evenodd');
  g2.strokeStyle = '#1c2026'; g2.lineWidth = 14; win.forEach(p => { g2.beginPath(); g2.moveTo(...p[0]); p.slice(1).forEach(q => g2.lineTo(...q)); g2.closePath(); g2.stroke(); });
  // panel de instrumentos
  g2.fillStyle = '#0d1014'; g2.fillRect(0, 1120, W, 800);
  const scr = [[70, 1180, 220, 190], [310, 1180, 220, 190], [550, 1180, 220, 190], [790, 1180, 220, 190]];
  scr.forEach(([x, y, w, h], i) => { g2.fillStyle = '#05080c'; g2.fillRect(x, y, w, h); g2.strokeStyle = '#2a3038'; g2.lineWidth = 4; g2.strokeRect(x, y, w, h);
    if (i === 0 || i === 3) { const gr = g2.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#1b6fd0'); gr.addColorStop(.5, '#1b6fd0'); gr.addColorStop(.5, '#7a4b22'); gr.addColorStop(1, '#7a4b22'); g2.fillStyle = gr; g2.fillRect(x + 10, y + 10, w - 20, h - 20);
      g2.strokeStyle = '#ffe14a'; g2.lineWidth = 4; g2.beginPath(); g2.moveTo(x + 50, y + h / 2); g2.lineTo(x + w - 50, y + h / 2); g2.stroke(); }
    else { g2.fillStyle = '#29e07a'; g2.font = '600 30px Inter'; g2.textAlign = 'center'; g2.fillText(i === 1 ? 'N1 ' + Math.round(lerp(20, 94, clamp(t))) + '%' : 'SPD ' + Math.round(spd), x + w / 2, y + h / 2 + 10); } });
  g2.restore();
}
function timerHUD(sec, a, label, y = 1480) {
  if (a <= .01) return; const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  txt(label, W / 2, y, 24, { spacing: 7, alpha: a * .8, fill: '#e3a372' });
  txt(String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'), W / 2, y + 100, 120, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(300, 780, y + 100, .5) });
}
function foilInset(a, k) {   // perfil con flap desplegándose (dibujo 2D)
  if (a <= .01) return; const cx = W / 2 - 300, cy = 1560, S = 560;
  g2.save(); g2.globalAlpha = a; g2.fillStyle = 'rgba(3,8,16,.6)'; g2.beginPath(); g2.roundRect(cx - 40, cy - 150, S + 120, 260, 18); g2.fill();
  const pts = nacaPts(.03, .4, .12, 40, 0, HINGE); g2.fillStyle = '#c2c7cd'; g2.beginPath(); pts.forEach(([u, v], i) => { const X = cx + u * S, Y = cy - v * S; i ? g2.lineTo(X, Y) : g2.moveTo(X, Y); }); g2.fill();
  const fp = nacaPts(.03, .4, .12, 20, HINGE + .005, 1); const ang = .45 * k, sl = .1 * k; const hx = cx + HINGE * S, hy = cy;
  g2.fillStyle = '#e3a372'; g2.beginPath(); fp.forEach(([u, v], i) => { let X = (u - HINGE) * S, Y = -v * S; const c = Math.cos(ang), s = Math.sin(ang); const Xr = X * c - Y * s * -1, Yr = X * s * 1 + Y * c; const PX = hx + Xr + sl * S, PY = hy + Yr + sl * S * .25; i ? g2.lineTo(PX, PY) : g2.moveTo(PX, PY); }); g2.fill();
  g2.restore();
  txt('MÁS SUPERFICIE · MÁS CURVATURA', W / 2, cy + 160, 26, { spacing: 4, alpha: a * smooth(.3, .8, k), fill: '#e3a372' });
}

// ==========================================================================
// OBJETOS AUXILIARES DEL LABORATORIO
// ==========================================================================
const slMatHi = new THREE.LineBasicMaterial({ color: new THREE.Color(.45, .85, 1.3), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
const slMatLo = new THREE.LineBasicMaterial({ color: new THREE.Color(1.2, .8, .55), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
const foilXY = foilPts.map(p => toW(p));
const LE = foilXY.reduce((a, b) => b.x < a.x ? b : a), TE = foilXY.reduce((a, b) => b.x > a.x ? b : a);
const midY = x => { let lo = 1e9, hi = -1e9; for (const p of foilXY) if (Math.abs(p.x - x) < .15) { lo = Math.min(lo, p.y); hi = Math.max(hi, p.y); } return (lo + hi) / 2; };
const MID0 = midY(0);
for (const sl of SL) {
  let yx = null; for (let i = 1; i < sl.path.length; i++) if (sl.path[i - 1].x < 0 && sl.path[i].x >= 0) { yx = sl.path[i].y; break; }
  sl.upper = yx !== null && yx > MID0; sl.near = Math.abs(sl.y0) < 2.1;
  sl.T = (sl.path.length - 1) * DT;
  // instante en que la línea cruza x = −5,2 (columna inicial del pulso) y x = TE
  sl.s0 = 0; for (let i = 0; i < sl.path.length; i++) if (sl.path[i].x >= -5.2) { sl.s0 = i * DT; break; }
  const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints(sl.path.map(p => p.clone().add(V3(0, 0, 2.6)))), sl.upper ? slMatHi : slMatLo); lab.add(ln); sl.line = ln;
  // velocidad local (para el color de las partículas)
  sl.spd = sl.path.map((p, i) => i ? p.distanceTo(sl.path[i - 1]) / DT / LS : 1);
}
const SPD_ANIM = 2.0;   // unidades de tiempo del flujo por segundo de vídeo
function stamp(s, x, y, a, rot = -.12, col = '#ff6a4a') {
  if (a <= .01) return; const sc = lerp(1.6, 1, easeOut(clamp(a * 1.4)));
  g2.save(); g2.translate(x, y); g2.rotate(rot); g2.scale(sc, sc); g2.globalAlpha = clamp(a); g2.strokeStyle = col; g2.lineWidth = 8; g2.shadowColor = col; g2.shadowBlur = 25;
  g2.font = '800 120px Montserrat'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.letterSpacing = '10px'; const w = g2.measureText(s).width + 70;
  g2.strokeRect(-w / 2, -85, w, 170); g2.fillStyle = col; g2.fillText(s, 0, 4); g2.restore();
}
function line2(p0, p1, a, col, w = 3, dash = null) {
  if (a <= .01) return; g2.save(); g2.globalAlpha = a; g2.strokeStyle = col; g2.lineWidth = w; if (dash) g2.setLineDash(dash); g2.shadowColor = col; g2.shadowBlur = 10;
  g2.beginPath(); g2.moveTo(p0.x, p0.y); g2.lineTo(p1.x, p1.y); g2.stroke(); g2.restore();
}

// ==========================================================================
// ESTELA: trayectoria del despegue final (vórtices de punta de ala)
// ==========================================================================
const WK = { tL: TL.wake + .7, v: 78 };
function wakeState(tau) {
  const d = tau - WK.tL; const x = WK.v * d + (d < 0 ? 4 * d * d * 0 : 0);
  let y = 6.3; if (d > 0) y += d < 4 ? 1.5 * d * d : 24 + 12 * (d - 4);
  const pitch = smooth(-1.4, -.2, d) * .16; return { x, y, pitch };
}
function wakeWorld(st, lx, ly, lz) { const c = Math.cos(st.pitch), s = Math.sin(st.pitch); return V3(st.x + lx * c - ly * s, st.y + lx * s + ly * c, lz); }
const TIP = (() => { const [lx, ly] = wingLE(WING.tip); return { x: lx - WING.cTip * .8, y: ly + 1.2, z: WING.tip + .9 }; })();
function emitVortices(simT, gain) {
  if (simT <= WK.tL) return;
  for (const side of [1, -1]) for (let i = 0; i < 3800; i++) {
    const k = ((i + (side > 0 ? 0 : 3800)) % vort.n) * 4, s = vort.seed;
    const tau = lerp(WK.tL, simT, Math.pow(s[k], .7)); const a = simT - tau; const st = wakeState(tau);
    const b = wakeWorld(st, TIP.x, TIP.y, TIP.z * side);
    let y = b.y - 2.1 * a, z = b.z; if (y < 7) { const g = 7 - y; y = 7 - g * .15; z += side * g * .9; }
    const r = .5 + .22 * a + .06 * a * a / (1 + a * .05), th = s[k + 1] * 6.283 + 5 * a / (1 + .2 * a);
    const I = gain * Math.exp(-a / WK.decay) * clamp(a * 4) * (.35 + .65 * s[k + 2]);
    vort.push(b.x + (s[k + 3] - .5) * 2, y + Math.cos(th) * r, z + Math.sin(th) * r, .62 * I, .82 * I, 1.15 * I);
  }
}
function emitDownwash(simT, gain) {
  for (let i = 0; i < 3500; i++) { const k = i * 4, s = flowP.seed; const age = s[k] * 3.2; const tau = simT - age; if (tau < WK.tL - .2) continue; const st = wakeState(tau);
    const zz = (s[k + 1] * 2 - 1) * 30; const [lx] = wingLE(Math.min(Math.abs(zz), 30)); const p = wakeWorld(st, lx - wingC(Math.min(Math.abs(zz), 30)) - 1, -1, zz);
    const I = gain * (1 - age / 3.2) * .55; flowP.push(p.x - age * 6, Math.max(1, p.y - 7.5 * age), p.z, .35 * I, .7 * I, 1.2 * I); }
}

// ==========================================================================
// ENTORNO POR PLANO
// ==========================================================================
skyDome.renderOrder = -1;
let navT = 0; const keyOff = V3(0, 60, 0);
oceanMat.fragmentShader = oceanMat.fragmentShader.replace('dist*.00045', 'dist*.00016'); oceanMat.needsUpdate = true;
function envUpdate(mode, t) {
  airport.visible = mode === 'airport'; clouds.visible = mode === 'cruise'; ocean.visible = mode === 'ocean'; island.visible = mode === 'ocean';
  skyDome.position.copy(camera.position);
  U.uTime.value = t;
  if (mode === 'airport') { sea.fog.color.setRGB(.33, .19, .13); sea.fog.density = .00032; hemi.intensity = 1.1; keyL.intensity = 2.2; }
  else if (mode === 'cruise') { sea.fog.color.setRGB(.4, .24, .17); sea.fog.density = .00008; hemi.intensity = 1.1; keyL.intensity = 1.8; }
  else { sea.fog.color.setRGB(.25, .15, .11); sea.fog.density = .00012; hemi.intensity = .9; keyL.intensity = 1.6;
    ocean.scale.set(8, 8, 1); const st = 1600 * 8 / 260; ocean.position.set(Math.round(camera.position.x / st) * st, 0, Math.round(camera.position.z / st) * st); }
  if (airport.visible) { lightsP.begin(); for (const L of LIGHTS) lightsP.push(L[0], L[1], L[2], L[3], L[4], L[5]); lightsP.end(); }
  const tg = ac.visible ? ac.position : camera.position;
  sunL.position.copy(tg).addScaledVector(SUN_DIR, 300); sunL.target.position.copy(tg); sunL.target.updateMatrixWorld();
  keyL.position.copy(camera.position).add(keyOff); keyL.target.position.copy(tg); keyL.target.updateMatrixWorld();
  rimL.position.copy(tg).multiplyScalar(2).sub(camera.position).add(V3(0, 80, 0)); rimL.target.position.copy(tg); rimL.target.updateMatrixWorld();
  // luces de navegación y estroboscópica
  const blink = fract(t / 1.3) < .07 ? 1 : 0; strobe.scale.setScalar(blink * 5 + .001);
  for (const n of navL) n.scale.setScalar(2.4);
}
function fanSpin(phi) { for (const f of fans) f.rotation.x = phi; }
function resetAC() {
  ac.visible = true; ac2.visible = false; gear.visible = true; surfMat.emissiveIntensity = 0;
  for (let i = 0; i < 2; i++) { const s = i ? -1 : 1; setMovable(flaps[i], 0, 0); setMovable(ails[i], 0, 0); }
  for (const g of engGlow) g.material.opacity = 0;
  clouds.position.set(0, 0, 0); island.position.set(0, -9999, 0);
}
function setFlaps(a, slide) { for (let i = 0; i < 2; i++) setMovable(flaps[i], a * (i ? -1 : 1), slide); }
const flashAt = (t, c, d = .28, amp = .35) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
function renderFrame(t) {
  g2.clearRect(0, 0, W, H);
  camera.up.set(0, 1, 0); camera.fov = 35; keyOff.set(0, 60, 0);
  resetAC(); tf.visible = false; foil.visible = foilEdge.visible = true; presPlane.material.opacity = 0; slMatHi.opacity = slMatLo.opacity = 0;
  labP.begin(); pulseP.begin(); tfP.begin(); vort.begin(); flowP.begin();
  let scene = sea, mode = 'airport', bloomS = .6, flash = 0, ca = .0013, fade = 0, grain = .035, expo = 1;
  const cuts = ['onboard', 'engines', 'thrust', 'question', 'myth', 'load', 'rotate', 'flaps', 'cruise', 'turn', 'ailerons', 'engout', 'glide', 'transat', 'azores', 'wake', 'wait', 'brand'];
  for (const c of cuts) flash = Math.max(flash, flashAt(t, TL[c], .25, .28));
  const hud = [];   // HUD diferido (se dibuja tras colocar la cámara)

  if (t < TL.onboard) {
    // A · GANCHO: el avión en cabecera de pista al atardecer
    const lt = t; placeAC(-480, 6.3, 0, 0, 0, 0); fanSpin(t * 5); setFlaps(.14, .4);
    for (const g of engGlow) g.material.opacity = .25;
    const push = easeInOut(smooth(TL.minute - .2, TL.onboard, t));
    const tgt = W2(lerp(4, 22, push), lerp(-.5, .5, push), 0);
    camOrbit(tgt, lerp(lerp(118, 132, lt / 6.4), 60, push), lerp(.95, 1.12, lt / 6.4), lerp(.1, .08, push), 42);
    if (camera.position.y < 1.5) { camera.position.y = 1.5; camera.lookAt(tgt); }
    camera.position.add(shake(t, .06));
    fade = 1 - smooth(0, .3, t);
    hud.push(() => {
      const a1 = smooth(.1, .45, t) * (1 - smooth(TL.minute - .3, TL.minute, t));
      bigStat('PESO AL DESPEGUE', '319 t', 470, a1, .2 + t * .15);
      carsGrid(smooth(TL.cars - .2, TL.cars + .2, t) * (1 - smooth(TL.minute - .3, TL.minute, t)), smooth(TL.cars, TL.cars + 1.3, t));
      titleHUD('DENTRO DE', '60 SEGUNDOS: EN EL AIRE', smooth(TL.minute, TL.minute + .3, t), 1500);
    });
  } else if (t < TL.engines) {
    // B · A BORDO: vista de cabina
    const lt = t - TL.onboard; const X = -480 + .5 * 1.6 * lt * lt; placeAC(X, 6.3, 0, 0, 0, 0); fanSpin(t * 9);
    camera.position.copy(W2(38.5, .6, 0)); camera.lookAt(W2(400, -30, 0)); camera.fov = 58; camera.position.add(shake(t, .03, 9));
    hud.push(() => { cockpit(1, 30 + lt * 12, lt / 2); titleHUD('CABINA', 'EL COMANDANTE', smooth(.2, .6, lt) * (1 - smooth(1.7, 2, lt)), 1540); });
  } else if (t < TL.thrust) {
    // C · MOTOR EN CORTE: de dónde sale el empuje
    scene = lab; const lt = t - TL.engines; tf.visible = true; foil.visible = foilEdge.visible = false;
    camOrbit(V3(-1.6, .1, 0), lerp(31, 27, easeInOut(lt / 3.5)), lerp(.9, 1.08, lt / 3.5), .2);
    tf.userData.fan.rotation.x = t * 9; tf.userData.comb.material.emissiveIntensity = .6 + .3 * Math.sin(t * 30);
    const s = tfP.seed;
    for (let i = 0; i < 4200; i++) { const k = i * 4; const u = fract(s[k] + t * .55); const x = lerp(4, -9, u); const r = lerp(1.18, 1.55, s[k + 1]) * (x < -4 ? lerp(1, .82, clamp((-4 - x) / 3)) : 1); const th = s[k + 2] * 6.283 + x * .15;
      const I = (x < -6.6 ? clamp(1 - (-6.6 - x) / 2.4) : 1) * .7; tfP.push(x, Math.cos(th) * r, Math.sin(th) * r, .3 * I, .75 * I, 1.3 * I); }
    for (let i = 4200; i < 7600; i++) { const k = i * 4; const u = fract(s[k] + t * .45); const x = 4 - 15 * Math.pow(u, 1.45);
      let r = x > .3 ? .95 : x > -3.4 ? lerp(.9, .5, (.3 - x) / 3.7) : x > -6 ? lerp(.55, .8, (-3.4 - x) / 2.6) : lerp(.75, .5, clamp((-6 - x) / 4)); r *= Math.sqrt(s[k + 1]) * .9 + .1;
      const th = s[k + 2] * 6.283 + t * (x > -3.4 ? 3 : 1); const hot = smooth(-3.2, -3.9, x); const I = (x < -7 ? clamp(1 - (-7 - x) / 4) : 1);
      tfP.push(x, Math.cos(th) * r, Math.sin(th) * r, lerp(.9, 2.4, hot) * I, lerp(.95, .85, hot) * I, lerp(1.1, .25, hot) * I); }
    bloomS = .8;
    hud.push(() => {
      callout(V3(1.25, 1.35, 0), 120, -170, 'VENTILADOR', 'empuja el aire hacia atrás', smooth(.4, .9, lt));
      callout(V3(-3.6, -.5, .6), -110, 210, 'CÁMARA DE COMBUSTIÓN', 'el queroseno arde', smooth(1.3, 1.8, lt));
      bigStat('EMPUJE DE CADA MOTOR', '≈ 44 t', 430, smooth(2.0, 2.5, lt), .2 + lt * .2);
      const p0 = project(V3(-5, 2.6, 0)), p1 = project(V3(3.5, 2.6, 0)); arrowXY(p0.x, p0.y - 60, p1.x, p1.y - 60, smooth(2.4, 3.2, lt), '#e3a372');
    });
  } else if (t < TL.question) {
    // D · EL EMPUJE VA HACIA DELANTE, NO HACIA ARRIBA (vista cenital)
    const lt = t - TL.thrust; const X = -420 + 20 * lt; placeAC(X, 6.3, 0, 0, 0, 0); fanSpin(t * 9); for (const g of engGlow) g.material.opacity = .5;
    camera.up.set(1, 0, 0); camera.position.copy(W2(-6, lerp(150, 135, lt / 2.8), 0)); camera.lookAt(W2(-6, 0, 0));
    hud.push(() => {
      for (const e of engines) { const w = e.getWorldPosition(V3(0, 0, 0)); const p = project(w), q = project(w.clone().add(V3(30, 0, 0))); arrowXY(p.x, p.y, q.x, q.y, smooth(.2, .9, lt), '#e3a372', 12); }
      titleHUD('EL MOTOR EMPUJA', 'HACIA DELANTE', smooth(.4, .8, lt), 330);
      const a2 = smooth(1.3, 1.7, lt); txt('NO HACIA ARRIBA', W / 2, 1520, 54, { font: 'Montserrat', weight: 800, alpha: a2, fill: '#ff6a4a' });
      g2.save(); g2.globalAlpha = a2; g2.strokeStyle = '#ff6a4a'; g2.lineWidth = 6; g2.beginPath(); g2.moveTo(W / 2 - 250, 1525); g2.lineTo(W / 2 - 250 + 500 * easeOut(smooth(1.6, 2.1, lt)), 1525); g2.stroke(); g2.restore();
    });
  } else if (t < TL.myth) {
    // E · ¿QUIÉN LO SOSTIENE? → EL ALA
    const lt = t - TL.question; placeAC(-364 + 22 * lt, 6.3, 0, 0, 0, 0); fanSpin(t * 9); setFlaps(.14, .4);
    const k = easeInOut(clamp(lt / 2.5));
    camOrbit(W2(lerp(0, -4, k), 0, lerp(8, 16, k)), lerp(120, 85, k), lerp(.9, 1.15, k), lerp(.45, .55, k), 40);
    hud.push(() => {
      const aq = smooth(0, .25, lt) * (1 - smooth(TL.wing - TL.question - .2, TL.wing - TL.question, lt));
      txt('?', W / 2, 420, 380, { font: 'Montserrat', weight: 800, alpha: aq, fill: copperGrad(380, 700, 420, .5), shadow: 40 });
      const [lx, ly] = wingLE(17); callout(W2(lx - 4, ly + .6, 17), -90, -260, 'EL ALA', 'la que sostiene 319 t', smooth(TL.wing - TL.question, TL.wing - TL.question + .4, lt));
    });
  } else if (t < TL.load) {
    // F/G/H · LABORATORIO: perfil alar con flujo real
    scene = lab; const lt = t - TL.myth; bloomS = .7;
    const zoom = easeInOut(smooth(TL.deflect - TL.myth - .3, TL.deflect - TL.myth + 1.5, lt));
    camOrbit(V3(lerp(.2, 1.2, zoom), .3, 0), lerp(25, 27, zoom) - lt * .1, lerp(.18, .05, zoom) + Math.sin(lt * .4) * .03, lerp(.05, .03, zoom));
    // líneas de corriente
    const lineA = lt < TL.deflect - TL.myth ? .18 : lerp(.18, .55, smooth(TL.deflect - TL.myth, TL.deflect - TL.myth + .8, lt));
    slMatHi.opacity = slMatLo.opacity = lineA * smooth(0, .4, lt) * (1 - .4 * smooth(TL.pressure - TL.myth, TL.pressure - TL.myth + .8, lt));
    // partículas que recorren las líneas (más separadas donde el aire va más rápido)
    const s = labP.seed; const pA = (lt < TL.deflect - TL.myth ? .35 : 1) * smooth(0, .5, lt);
    SL.forEach((sl, j) => { const N = 70; for (let i = 0; i < N; i++) { const ss = fract(i / N + s[(j * N + i) % labP.n * 4] * .01 + t * SPD_ANIM / sl.T) * sl.T; const ix = Math.min(sl.path.length - 1, Math.round(ss / DT)); const p = sl.path[ix]; const v = sl.spd[ix];
      const I = pA * clamp(.25 + .45 * v); labP.push(p.x, p.y, 2.6, (sl.upper ? .35 : 1.1) * I, (sl.upper ? .8 : .75) * I, (sl.upper ? 1.3 : .55) * I); } });
    // PULSO del mito: una columna de aire soltada a la vez
    const t0 = .9, pt = (lt - t0) * SPD_ANIM; const pulseA = smooth(t0 - .2, t0, lt) * (1 - smooth(TL.deflect - TL.myth - .2, TL.deflect - TL.myth + .3, lt));
    const up = [], dn = [];
    if (lt > t0 - .2) for (const sl of SL) { if (!sl.near) continue; const p = slAt(sl, sl.s0 + Math.max(0, pt)); (sl.upper ? up : dn).push(p);
      const c = sl.upper ? [.6, 1.6, 2.6] : [2.6, 1.3, .5]; for (let q = 0; q < 6; q++) pulseP.push(p.x, p.y, 2.7 + q * .01, c[0] * pulseA, c[1] * pulseA, c[2] * pulseA); }
    // ángulo de ataque, aire desviado, presión y sustentación
    presPlane.material.opacity = .95 * smooth(TL.pressure - TL.myth, TL.pressure - TL.myth + 1.2, lt);
    hud.push(() => {
      const draw = (arr, col) => { if (arr.length < 2 || pulseA < .01) return; const pr = arr.map(p => project(V3(p.x, p.y, 2.7))).sort((a, b) => a.y - b.y); g2.save(); g2.globalAlpha = pulseA * .9; g2.strokeStyle = col; g2.lineWidth = 3; g2.shadowColor = col; g2.shadowBlur = 12; g2.beginPath(); pr.forEach((p, i) => i ? g2.lineTo(p.x, p.y) : g2.moveTo(p.x, p.y)); g2.stroke(); g2.restore(); };
      draw(up, '#7fd4ff'); draw(dn, '#ff9a5a');
      const aIntro = smooth(.1, .5, lt) * (1 - smooth(3.2, 3.6, lt));
      txt('«EL AIRE DE ARRIBA Y EL DE ABAJO', W / 2, 330, 34, { weight: 600, alpha: aIntro });
      txt('TIENEN QUE LLEGAR A LA VEZ»', W / 2, 380, 34, { weight: 600, alpha: aIntro });
      const ms = TL.myth + 3.45 - TL.myth; stamp('MITO', W / 2, 420, smooth(ms, ms + .25, lt) * (1 - smooth(TL.deflect - TL.myth - .1, TL.deflect - TL.myth + .2, lt)));
      txt('EL DE ARRIBA LLEGA ANTES', W / 2, 1520, 44, { font: 'Montserrat', weight: 800, alpha: smooth(2.6, 3.0, lt) * (1 - smooth(TL.deflect - TL.myth - .1, TL.deflect - TL.myth + .2, lt)), fill: '#7fd4ff' });
      // G · inclinado y curvado → desvía aire hacia abajo
      const g0 = TL.deflect - TL.myth;
      const aA = smooth(g0 + .2, g0 + .7, lt) * (1 - smooth(TL.pressure - TL.myth - .2, TL.pressure - TL.myth, lt));
      const le = project(V3(LE.x, LE.y, 2.6)), te = project(V3(TE.x, TE.y, 2.6)), hz = project(V3(LE.x + 7.5, LE.y, 2.6));
      line2(le, project(V3(TE.x + 1.2, TE.y - (TE.y - LE.y) / (TE.x - LE.x) * -1.2 * -1, 2.6)), aA, '#e3a372', 3); line2(le, hz, aA, 'rgba(255,255,255,.8)', 2, [10, 10]);
      txt('ÁNGULO DE ATAQUE', le.x + 30, le.y + 70, 24, { align: 'left', spacing: 4, alpha: aA, fill: '#e3a372' });
      txt('CURVADO E INCLINADO', W / 2, 330, 34, { weight: 600, alpha: aA });
      const aD = smooth(g0 + 1.6, g0 + 2.2, lt) * (1 - smooth(TL.pressure - TL.myth - .2, TL.pressure - TL.myth, lt));
      arrowXY(te.x - 20, te.y + 40, te.x + 90, te.y + 300, aD, '#7fd4ff', 13);
      txt('AIRE DESVIADO HACIA ABAJO', W / 2, 1500, 40, { font: 'Montserrat', weight: 800, alpha: aD, fill: '#7fd4ff' });
      txt('toneladas cada segundo', W / 2, 1560, 34, { weight: 300, alpha: aD });
      // H · presión
      const h0 = TL.pressure - TL.myth; const aP = smooth(h0 + .3, h0 + .8, lt);
      const c0 = project(V3(.3, MID0, 2.6)); const above = project(V3(.3, MID0 + 2.4, 2.6)), below = project(V3(.3, MID0 - 2.3, 2.6));
      txt('BAJA PRESIÓN', above.x - 220, above.y - 30, 44, { font: 'Montserrat', weight: 800, alpha: aP, fill: '#7fd4ff' });
      txt('ALTA PRESIÓN', below.x - 220, below.y + 40, 44, { font: 'Montserrat', weight: 800, alpha: smooth(h0 + 1.3, h0 + 1.8, lt), fill: '#ffb27a' });
      const la = TL.liftarrow - TL.myth; const aL = smooth(la, la + .5, lt);
      arrow2D(c0.x, c0.y, c0.y - 520, aL, '#ffe2c0'); txt('SUSTENTACIÓN', c0.x, c0.y - 590, 48, { font: 'Montserrat', weight: 800, alpha: aL, fill: copperGrad(c0.x - 220, c0.x + 220, c0.y - 590, .5) });
    });
  } else if (t < TL.rotate) {
    // I · CARGA ALAR: 1 m² de ala sostiene ≈ 690 kg
    const lt = t - TL.load; placeAC(-300 + 40 * lt + 1.2 * lt * lt, 6.3, 0, 0, 0, 0); fanSpin(t * 9); setFlaps(.14, .4); for (const g of engGlow) g.material.opacity = .5;
    const [lx, ly] = wingLE(13); const cx = lx - wingC(13) * .42, cy = ly + .55;
    camera.up.set(0, 0, 1); camera.position.copy(W2(cx - 1, lerp(62, 50, easeInOut(lt / 4.5)), 14)); camera.lookAt(W2(cx, cy, 14)); keyOff.set(-60, 30, -70);
    hud.push(() => {
      const aS = smooth(.6, 1.2, lt); const sq = [[-.5, -.5], [.5, -.5], [.5, .5], [-.5, .5]].map(([a, b]) => project(W2(cx + a, cy, 13 + b)));
      if (aS > .01) { g2.save(); g2.globalAlpha = aS; g2.fillStyle = 'rgba(227,163,114,.35)'; g2.strokeStyle = '#ffd2a8'; g2.lineWidth = 4; g2.shadowColor = '#e3a372'; g2.shadowBlur = 25; g2.beginPath(); sq.forEach((p, i) => i ? g2.lineTo(p.x, p.y) : g2.moveTo(p.x, p.y)); g2.closePath(); g2.fill(); g2.stroke(); g2.restore(); }
      const c = sq.reduce((a, p) => ({ x: a.x + p.x / 4, y: a.y + p.y / 4 }), { x: 0, y: 0 }); txt('1 m²', c.x, c.y - 90, 32, { font: 'Montserrat', weight: 800, alpha: aS });
      bigStat('SOBRE CADA METRO CUADRADO', '≈ 690 kg', 470, smooth(1.0, 1.5, lt), .2 + lt * .15);
      txt('319.000 kg ÷ 464 m² de ala', W / 2, 570, 30, { weight: 300, alpha: smooth(1.5, 2, lt) * .9 });
      flightHUD(lerp(150, 300, smooth(1, 4.5, lt)), null, smooth(3.2, 3.6, lt));
    });
  } else if (t < TL.flaps) {
    // J · ROTACIÓN Y DESPEGUE
    const lt = t - TL.rotate; const v = 72 + 4.5 * lt; const X = 120 + 72 * lt + 2.25 * lt * lt;
    const tr = TL.liftoff + .15 - TL.rotate, tl2 = TL.liftoff + 1.3 - TL.rotate;
    const pitch = smooth(tr, tl2, lt) * .16; const air = Math.max(0, lt - tl2 + .1); const Y = 6.3 + 1.6 * air * air + .2 * pitch * 0;
    placeAC(X, Y, 0, pitch, 0, 0); fanSpin(t * 9); setFlaps(.14, .4); for (const g of engGlow) g.material.opacity = .7;
    const off = lerp(120, 70, easeInOut(lt / 4.1));
    camera.position.set(X + off, 3.2 + air * 1.2, 58); camera.lookAt(X - 4, Y + 1 + air * .5, 0); camera.position.add(shake(t, .08 * (1 - smooth(tl2, tl2 + 1, lt)), 14));
    if (lt > tl2 + .9) gear.visible = false;
    flash = Math.max(flash, flashAt(t, TL.rotate + tl2, .3, .25)); ca = .0013 + .002 * flashAt(t, TL.rotate + tl2, .5, 1);
    hud.push(() => { flightHUD(v * 3.6, Math.max(0, Y - 6.3) * 1, 1); titleHUD('ROTACIÓN', pitch > .14 ? '¡DESPEGUE!' : 'MORRO ARRIBA', smooth(tr, tr + .3, lt), 1500); });
  } else if (t < TL.cruise) {
    // K · FLAPS
    const lt = t - TL.flaps; const X = 520 + 92 * lt; const Y = 40 + 9 * lt; placeAC(X, Y, 0, .12, 0, 0); fanSpin(t * 9); gear.visible = false;
    const fk = easeInOut(smooth(.3, 1.9, lt)); setFlaps(lerp(.06, .46, fk), lerp(.2, 1.6, fk)); surfMat.emissiveIntensity = .22 * smooth(.4, 1.0, lt) * (1 - smooth(4.6, 5.6, lt));
    camera.position.copy(W2(lerp(-21, -19, lt / 6), lerp(1.5, 1, lt / 6), lerp(36, 33, lt / 6))); camera.lookAt(W2(-6, -2.6, 9)); camera.fov = 40; camera.position.add(shake(t, .05, 6));
    hud.push(() => {
      const [lx, ly] = wingLE(10); callout(W2(lx - wingC(10) * .9 - 1, ly - .6, 10), 60, 260, 'FLAPS', 'se extienden hacia atrás y abajo', smooth(TL.flapsx - TL.flaps, TL.flapsx - TL.flaps + .4, lt));
      foilInset(smooth(2.5, 3, lt), smooth(2.7, 4.2, lt));
      flightHUD(lerp(300, 310, lt / 6), Y, .8);
    });
  } else if (t < TL.turn) {
    // L · CRUCERO SOBRE LAS NUBES
    mode = 'cruise'; const lt = t - TL.cruise; placeAC(0, 0, 0, .04, 0, 0); fanSpin(t * 9); gear.visible = false;
    const fk = 1 - easeInOut(smooth(.6, 2.4, lt)); setFlaps(.46 * fk, 1.6 * fk); surfMat.emissiveIntensity = .22 * smooth(.4, .8, lt) * (1 - smooth(2.6, 3.4, lt));
    clouds.position.set(-lt * 250, 0, 0);
    camOrbit(W2(-2, 0, 0), lerp(105, 95, lt / 3.7), lerp(1.05, .82, lt / 3.7), lerp(.32, .26, lt / 3.7));
    hud.push(() => { flightHUD(lerp(320, 900, easeInOut(smooth(0, 2.5, lt))), lerp(3000, 11000, easeInOut(smooth(0, 2.5, lt))), 1);
      titleHUD('A 900 km/h', 'SOBRA SUSTENTACIÓN', smooth(1.6, 2.1, lt), 1500); });
  } else if (t < TL.engout) {
    // M · GIRO: timón no, alerones sí
    mode = 'cruise'; keyOff.set(80, 70, 120); const lt = t - TL.turn; fanSpin(t * 9); gear.visible = false;
    const aT = TL.ailerons - TL.turn, bT = TL.bank - TL.turn, tT = TL.tilt - TL.turn;
    const roll = -.5 * easeInOut(smooth(bT - .3, tT + .6, lt));
    const yaw = Math.max(0, lt - tT) * .06;
    placeAC(0, 0, 0, .04, roll, yaw); clouds.position.set(-lt * 250 - 900, 0, 0);
    const ak = smooth(aT + .2, aT + .8, lt) * (1 - smooth(tT + .2, tT + 1, lt)); for (let i = 0; i < 2; i++) setMovable(ails[i], .42 * ak, 0); surfMat.emissiveIntensity = .3 * ak;
    if (lt < aT) { camOrbit(W2(-14, 3, 0), lerp(120, 105, lt / aT), -Math.PI / 2 - .55, .2); }
    else { const h = V3(-Math.cos(yaw), 0, Math.sin(yaw)); camera.position.copy(ac.position).addScaledVector(h, 200).add(V3(0, 26, 0)); camera.lookAt(ac.position.clone().add(V3(0, 4, 0))); }
    hud.push(() => {
      const aR = smooth(.3, .7, lt) * (1 - smooth(aT - .2, aT, lt));
      callout(W2(-34, 8, 0), 70, -260, 'TIMÓN DE DIRECCIÓN', 'no gira el avión como un volante', aR);
      if (aR > .05) { const p = project(W2(-34, 8, 0)); stamp('NO', p.x + 210, p.y - 420, smooth(1.2, 1.5, lt) * aR, -.1); }
      const [lx, ly] = wingLE(25); const aa = smooth(aT + .6, aT + 1, lt) * (1 - smooth(tT - .2, tT, lt));
      callout(W2(lx - wingC(25), ly - .5, 25), -40, 300, 'ALERÓN ABAJO', 'más sustentación: el ala sube', aa);
      callout(W2(lx - wingC(25), ly + .5, -25), 40, -300, 'ALERÓN ARRIBA', 'menos sustentación: el ala baja', aa);
      // sustentación inclinada y su componente lateral
      const aV = smooth(tT + .3, tT + .9, lt);
      if (aV > .01) { const c = ac.position.clone().add(V3(0, 2, 0)); const upW = V3(0, 1, 0).applyQuaternion(ac.quaternion); const p0 = project(c), p1 = project(c.clone().addScaledVector(upW, 30));
        const d = { x: p1.x - p0.x, y: p1.y - p0.y }; const L = Math.hypot(d.x, d.y); d.x *= 420 / L; d.y *= 420 / L;
        arrowXY(p0.x, p0.y, p0.x + d.x, p0.y + d.y, aV, '#ffe2c0', 14); txt('SUSTENTACIÓN', p0.x + d.x * 1.15, p0.y + d.y * 1.15 - 20, 32, { font: 'Montserrat', weight: 800, alpha: aV });
        const aH = smooth(tT + 1.2, tT + 1.8, lt); line2({ x: p0.x, y: p0.y }, { x: p0.x, y: p0.y + d.y }, aH * .7, 'rgba(255,255,255,.7)', 3, [12, 10]);
        arrowXY(p0.x, p0.y + 8, p0.x + d.x, p0.y + 8, aH, '#7fd4ff', 14); txt('HACIA LA CURVA', p0.x + d.x * .5, p0.y + 70, 34, { font: 'Montserrat', weight: 800, alpha: aH, fill: '#7fd4ff' }); }
    });
  } else if (t < TL.glide) {
    // N · SE PARAN LOS MOTORES
    mode = 'cruise'; const lt = t - TL.engout; placeAC(0, 0, 0, .02, 0, 0); gear.visible = false; clouds.position.set(-lt * 220 - 2000, 0, 0);
    const phi = TL.engout * 9 + 9 * .7 * (1 - Math.exp(-lt / .7)); fanSpin(phi);
    const ew = engines[0].getWorldPosition(V3(0, 0, 0)); camera.position.copy(ew.clone().add(V3(lerp(12, 9, lt / 1.6), lerp(1.5, .8, lt / 1.6), lerp(-6.5, -5.5, lt / 1.6)))); camera.lookAt(ew.clone().add(V3(-1, .3, 0))); camera.fov = 40;
    expo = lerp(1, .85, smooth(.2, 1, lt));
    hud.push(() => { bigStat('EMPUJE', '0 t', 470, smooth(.3, .7, lt), .3); titleHUD('MOTORES', 'APAGADOS', smooth(.6, 1, lt), 1500); });
  } else if (t < TL.wake) {
    // Ñ · PLANEO SOBRE EL OCÉANO (Air Transat 236)
    mode = 'ocean'; const lt = t - TL.glide; gear.visible = false; fanSpin(t * .8);
    const gl = -Math.atan(1 / 16); // pendiente de planeo ~16:1
    const seg = t < TL.transat ? 0 : t < TL.azores ? 1 : 2;
    island.position.set(4200, -4, -300);
    if (seg === 0) { const X = lt * 80, Y = 700 - lt * 5; placeAC(X, Y, 0, gl, 0, 0); camOrbit(W2(-2, 0, 0), lerp(95, 120, lt / 1.8), lerp(1.0, 1.2, lt / 1.8), .3); island.position.set(X + 4200, -4, -300); }
    else if (seg === 1) { const l2 = t - TL.transat; const X = 400 + l2 * 120, Y = 650 - l2 * 18; placeAC(X, Y, 0, gl, 0, 0); island.position.set(4400, -4, -300);
      camera.position.set(X - 230, Y + 80, 50); camera.lookAt(X + 900, Y - 330, -90); }
    else { const l3 = t - TL.azores; const k = l3 / 4.35; const X = lerp(2200, 3300, k), Y = lerp(240, 95, k); placeAC(X, Y, 0, gl * .6, 0, 0); island.position.set(4400, -4, -300); gear.visible = l3 > 2.5;
      camera.position.set(X - 130 + 40 * k, Y + 22, 95); camera.lookAt(X + 40, Y - 10, -40); }
    expo = .95;
    hud.push(() => {
      if (seg === 0) { flightHUD(lerp(500, 480, lt / 1.8), lerp(9500, 9200, lt / 1.8), 1); titleHUD('SIN MOTORES', 'PLANEAMOS', smooth(.1, .5, lt), 1500); }
      if (seg >= 1) { const l2 = t - TL.transat;
        txt('VUELO TS236 · 24/08/2001', W / 2, 205, 28, { spacing: 6, alpha: smooth(.1, .5, l2) * .9, fill: '#e3a372' });
        if (seg === 1) {
          // trayectoria de planeo punteada hacia la isla
          const pts = []; for (let i = 0; i <= 30; i++) { const u = i / 30; pts.push(project(V3(lerp(ac.position.x + 20, 4300, u), lerp(ac.position.y, 30, u), lerp(0, -260, u)))); }
          g2.save(); g2.globalAlpha = smooth(.2, .8, l2); g2.strokeStyle = '#e3a372'; g2.lineWidth = 4; g2.setLineDash([14, 14]); g2.lineDashOffset = -t * 40; g2.beginPath(); pts.forEach((p, i) => i ? g2.lineTo(p.x, p.y) : g2.moveTo(p.x, p.y)); g2.stroke(); g2.restore();
          bigStat('PLANEANDO', '19 MIN', 470, smooth(.6, 1.0, l2) * (1 - smooth(2.4, 2.7, l2)), .3 + l2 * .1);
          bigStat('SIN MOTORES', '≈ 120 KM', 470, smooth(2.7, 3.0, l2), .3 + l2 * .1);
        } else { const l3 = t - TL.azores;
          titleHUD('ISLA TERCEIRA', 'LAJES · AZORES', smooth(.2, .6, l3), 1500);
          bigStat('A SALVO', '306 PERSONAS', 470, smooth(1.4, 1.9, l3), .3 + l3 * .1); }
      }
    });
  } else if (t < TL.brand) {
    // O · ESTELA: el ala empuja aire hacia abajo; el siguiente avión espera
    const waiting = t >= TL.wait; const simT = waiting ? TL.wait + (t - TL.wait) * 6 : t; vort.mat.size = waiting ? 3.2 : 1.2; WK.decay = waiting ? 9 : 16;
    const st = wakeState(simT); placeAC(st.x, st.y, 0, st.pitch, 0, 0); fanSpin(t * 9); gear.visible = st.y < 20; ac.visible = !waiting || st.x < 2600;
    for (const g of engGlow) g.material.opacity = .7;
    emitVortices(simT, waiting ? 1.6 : .9); if (!waiting) emitDownwash(simT, .5);
    if (!waiting) { const lt = t - TL.wake; camera.position.set(st.x - lerp(150, 190, lt / 4), 10 + st.y * .35, lerp(85, 95, lt / 4)); camera.lookAt(st.x - 45, st.y * .55 + 3, 0); camera.fov = 42; }
    else { ac2.visible = true; ac2.scale.setScalar(1); ac2.position.set(-140, 6.3, 0); ac2.rotation.set(0, 0, 0); for (const f of ac2.children) {} 
      const lt = t - TL.wait; for (const g of engGlow) g.material.opacity = 0; camera.position.set(lerp(-235, -225, lt / 5.5), 30, 0); camera.lookAt(150, 16, 0); camera.fov = 42; }
    bloomS = .75;
    hud.push(() => {
      if (!waiting) { const lt = t - TL.wake;
        const p = project(V3(st.x - 30, st.y - 18, 20)); if (lt > 1.5) callout(V3(Math.max(0, st.x - 60), Math.max(5, st.y - 25), 12), 40, -260, 'AIRE EMPUJADO HACIA ABAJO', 'y torbellinos en las puntas', smooth(1.6, 2.1, lt));
      } else { const lt = t - TL.wait; const sec = Math.min(120, lt * 26);
        timerHUD(sec, smooth(.1, .4, lt), 'SEPARACIÓN POR ESTELA', 470);
        titleHUD('EL SIGUIENTE', 'ESPERA SU TURNO', smooth(.2, .6, lt) * (1 - smooth(4.0, 4.4, lt)), 1440);
        titleHUD('LISTO PARA DESPEGAR', 'AIRE EN CALMA', smooth(4.3, 4.8, lt), 1440); }
    });
  } else {
    // P · MARCA
    mode = 'cruise'; const lt = t - TL.brand; placeAC(lt * 30, -40 + lt * 4, 0, .05, 0, 0); clouds.position.set(-lt * 60 - 3000, 0, 0); fanSpin(t * 9); gear.visible = false;
    camera.position.set(-260 + lt * 20, 60, 360); camera.lookAt(lt * 30 - 60, 40, 0);
    expo = .8; fade = Math.min(.45, lt * .4);
    hud.push(() => drawBrand(lt - .3));
    fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }

  labP.end(); pulseP.end(); tfP.end(); vort.end(); flowP.end();
  camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (scene === sea) envUpdate(mode, t);
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}

function renderCover() {
  renderFrame(TL.liftoff + 1.9);
  coverText('¿CÓMO VUELA', 'UN AVIÓN DE 319 t?', 'Lo has visto mil veces. Así funciona de verdad');
}
window.renderCover = () => { renderCover(); return true; };
window.TL = TL;
window.renderFrame = (t) => { renderFrame(t); return true; };
window.ready = true;
window._dbg = { camera, ac, ac2, sea, lab, SL, LE, TE, MID0, tf, flaps, ails, engines, island, clouds };
