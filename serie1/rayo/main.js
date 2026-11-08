// NO LO SABÍAS — "¿De dónde sale un rayo?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final. 1 u = 10 m (esquema, alturas reales aproximadas).
// Cumulonimbo: corrientes de >100 km/h; colisiones hielo–granizo separan carga (cristales +, arriba; granizo −, abajo). Líder escalonado (saltos ~50 m),
// trazador ascendente desde objetos altos; descarga de retorno ~30 kA; canal a ~30.000 K (≈5× superficie solar, ~5.800 K). Sonido ~343 m/s → ~3 s/km.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, easeIn, rng, V3, g2, camera, Particles, txt, copperGrad, project, callout, titleHUD, fract, camOrbit, bigStat, drawBrand, coverText, finish, arrowXY, noise1, shake } from '../../lib/core.js';

const scene = new THREE.Scene(); scene.background = new THREE.Color(0x03050b);
const hemi = new THREE.HemisphereLight(0x8aa0d0, 0x101418, .6); scene.add(hemi);
const moon = new THREE.DirectionalLight(0xa8c0ff, .8); moon.position.set(-300, 400, 300); scene.add(moon);
const boltL = new THREE.PointLight(0xc8d8ff, 0, 0, 1.2); scene.add(boltL);
const M = (c, r = .8, m = .05, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: e });
const box = (w, h, d, mat, x = 0, y = 0, z = 0, parent = scene) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; };

// ==========================================================================
// PAISAJE: suelo, edificio con pararrayos, árboles, casas, colinas
// ==========================================================================
const land = new THREE.Group(); scene.add(land);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000, 80, 80), M(0x141c16, 1, 0)); ground.rotation.x = -Math.PI / 2; land.add(ground);
{ const p = ground.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); const d = Math.hypot(x, y); p.setZ(i, d > 400 ? (noise1(x * .004 + 3) * .5 + .5) * 120 * smooth(400, 1500, d) : 0); } ground.geometry.computeVertexNormals(); }
const bldMat = M(0x2a2f38, .7, .2); const bld = box(4, 10, 4, bldMat, 0, 5, 0, land); const rod = box(.15, 2.5, .15, M(0x9aa0a8, .3, .8), 0, 11.25, 0, land);
const winMat = new THREE.MeshBasicMaterial({ color: 0xffd28a }); for (let j = 0; j < 8; j++) for (let i = -1; i <= 1; i++) if ((i * 7 + j * 3) % 4) box(.6, .6, .05, winMat, i * 1.2, 1.2 + j * 1.1, 2.03, land);
const treeMat = M(0x16301e, .9, 0), trunkMat = M(0x2a1e14, .9, 0); const trees = [];
const TR = rng(7); for (let i = 0; i < 60; i++) { const a = TR() * 6.283, r = 8 + TR() * 60; const x = Math.cos(a) * r, z = Math.sin(a) * r; if (Math.abs(x) < 4 && Math.abs(z) < 4) continue; const h = 1.2 + TR() * 1.4; const g = new THREE.Group(); g.position.set(x, 0, z); land.add(g);
  const c = new THREE.Mesh(new THREE.ConeGeometry(h * .35, h, 8), treeMat); c.position.y = h * .5 + .3; g.add(c); box(.15, .4, .15, trunkMat, 0, .2, 0, g); trees.push([g, h]); }
const TREE = V3(-9, 0, 6); { const g = new THREE.Group(); g.position.copy(TREE); land.add(g); const c = new THREE.Mesh(new THREE.ConeGeometry(1.1, 3.2, 10), treeMat); c.position.y = 2; g.add(c); box(.25, .6, .25, trunkMat, 0, .3, 0, g); }
// observador (casa) a 1 km
const OBS = V3(100, 0, 0); const house = new THREE.Group(); house.position.copy(OBS); house.scale.setScalar(4); land.add(house); box(3, 2, 3, M(0x3a3430, .8, 0), 0, 1, 0, house); { const r = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.4, 4), M(0x5a2a20, .8, 0)); r.position.y = 2.7; r.rotation.y = Math.PI / 4; house.add(r); box(.7, .7, .05, winMat, .6, 1.1, 1.53, house); }

// ==========================================================================
// RAYO: líder escalonado con ramas, trazadores ascendentes
// ==========================================================================
const R = rng(23); const J = V3(.6, 26, .3);
function walk(a, b, step, jit) { const pts = [a.clone()]; let p = a.clone(); for (let i = 0; i < 400; i++) { const d = b.clone().sub(p); if (d.length() < step * 1.2) break; d.normalize(); const j = V3((R() - .5) * jit, (R() - .3) * jit * .5, (R() - .5) * jit); p = p.clone().add(d.add(j).normalize().multiplyScalar(step)); pts.push(p); } pts.push(b.clone()); return pts; }
const MAIN = walk(V3(-12, 205, -6), J, 5, 1.5); const NM = MAIN.length;
const BR = []; for (let i = 3; i < NM - 3; i += 2 + Math.floor(R() * 3)) { const s = MAIN[i]; const n = 2 + Math.floor(R() * 6); const pts = [s.clone()]; let p = s.clone(); const dir = V3((R() - .5) * 2, -1, (R() - .5) * 2).normalize(); for (let k = 0; k < n; k++) { p = p.clone().add(dir.clone().add(V3((R() - .5) * 1.2, (R() - .3) * .4, (R() - .5) * 1.2)).normalize().multiplyScalar(4.5)); pts.push(p); } BR.push({ i, pts }); }
const UP = walk(V3(0, 12.5, 0), J, 1.6, 1.4); const UPT = walk(V3(TREE.x, 3.6, TREE.z), V3(TREE.x + 2, 14, TREE.z - 1), 1.4, 1.6);
function drawPath(P, pts, upto, amp, col, dens = .35, jit = .12, sd = 0) { // upto: segmentos visibles (fraccionario)
  const s = P.seed; let c = sd; const nseg = Math.min(pts.length - 1, upto); for (let i = 0; i < Math.ceil(nseg); i++) { const a = pts[i], b = pts[i + 1]; const fr = Math.min(1, nseg - i); const L = a.distanceTo(b) * fr; const n = Math.max(2, Math.ceil(L / dens));
    for (let k = 0; k < n; k++) { const u = k / n * fr; const q = ((c++) % P.n) * 4; P.push(lerp(a.x, b.x, u) + (s[q] - .5) * jit, lerp(a.y, b.y, u) + (s[q + 1] - .5) * jit, lerp(a.z, b.z, u) + (s[q + 2] - .5) * jit, col[0] * amp, col[1] * amp, col[2] * amp); } } return c; }

// ==========================================================================
// NUBE (cumulonimbo) como nube de puntos, con yunque
// ==========================================================================
const Pc = new Particles(9000, { size: 110, seed: 11 }); scene.add(Pc.obj);
const CL = []; { const r = rng(5); for (let i = 0; i < 9000; i++) { const y = 200 + Math.pow(r(), .8) * 1000; const k = (y - 200) / 1000; let rad = lerp(320, 250, smooth(0, .6, k)) + 520 * smooth(.78, .95, k) * (1 - smooth(.97, 1, k) * .3); const a = r() * 6.283, rr = Math.sqrt(r()) * rad;
  CL.push([Math.cos(a) * rr + (k > .8 ? 180 * k : 0), y - (k > .8 ? 0 : 0), Math.sin(a) * rr * .8, r()]); } }
function drawCloud(t, br, cut = 0, lit = 0) { Pc.begin(); for (const [x, y, z, s] of CL) { if (cut > 0 && z > 120 * (1 - cut) - 40 * cut) continue; const d = .1 + .06 * noise1(x * .006 + y * .006 + s * 10) - .05 * smooth(500, 200, y); const f = (d + lit * .35 * Math.exp(-((y - 300) ** 2) / 90000)) * br; Pc.push(x + Math.sin(t * .2 + s * 9) * 6, y, z, f * .75, f * .82, f); } Pc.end(); }
// cargas: posiciones fijas en la nube
const CH = []; { const r = rng(9); for (let i = 0; i < 70; i++) { const pos = i < 30; const y = pos ? lerp(850, 1050, r()) : lerp(330, 520, r()); const x = (r() - .5) * (pos ? 600 : 420); CH.push({ pos, p: V3(x, y, (r() - .5) * 60), m: V3((r() - .5) * 400, lerp(350, 1000, r()), 0) }); } }
const GCH = []; { const r = rng(13); for (let i = 0; i < 24; i++) GCH.push(V3((r() - .5) * 600, 6, (r() - .5) * 80)); }

// ==========================================================================
// DENTRO DE LA NUBE: cristales de hielo y granizo blando
// ==========================================================================
const IC = V3(5000, 600, 0); const ice = new THREE.Group(); ice.position.copy(IC); scene.add(ice);
const crysMat = new THREE.MeshStandardMaterial({ color: 0xe8f2ff, roughness: .1, metalness: .1, transparent: true, opacity: .8, emissive: 0x203050 });
const grMat = new THREE.MeshStandardMaterial({ color: 0xd8dde6, roughness: .9, metalness: 0, emissive: 0x101820, flatShading: true });
const crys = [], grau = []; { const r = rng(31); for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .4, 6), crysMat.clone()); m.userData = { x: (r() - .5) * 26, y0: (r() - .5) * 40, z: (r() - .5) * 10, s: r() }; ice.add(m); crys.push(m); }
  for (let i = 0; i < 7; i++) { const g = new THREE.IcosahedronGeometry(1.6, 1); const p = g.attributes.position; for (let k = 0; k < p.count; k++) { const v = V3(p.getX(k), p.getY(k), p.getZ(k)); v.multiplyScalar(1 + (r() - .5) * .18); p.setXYZ(k, v.x, v.y, v.z); } g.computeVertexNormals();
    const m = new THREE.Mesh(g, grMat.clone()); m.userData = { x: (r() - .5) * 22, y0: (r() - .5) * 40, z: (r() - .5) * 8, s: r() }; ice.add(m); grau.push(m); } }

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
const P = new Particles(16000, { size: .5, seed: 37 }); scene.add(P.obj);
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
const L = (t, a, b) => smooth(TL[a], TL[a] + .3, t) * (b ? 1 - smooth(TL[b] - .1, TL[b] + .1, t) : 1);
const WHITE = [1.2, 1.35, 2.0], BLUEV = [.55, .7, 1.8];
function show(o) { land.visible = !!o.land; Pc.obj.visible = !!o.cloud; ice.visible = !!o.ice; house.visible = !!o.house; }
function strike(t, t0, P, amp = 1) { const k = t - t0; if (k < 0) return 0; const f = Math.exp(-k * 3) * (1 + .5 * Math.sin(k * 60) * Math.exp(-k * 6)) + (k > .15 && k < .3 ? .6 : 0); drawPath(P, MAIN, NM, f * 2.2 * amp, WHITE, .3, .15); drawPath(P, UP, UP.length, f * 2.2 * amp, WHITE, .3, .12, 5000); BR.forEach((b, j) => drawPath(P, b.pts, b.pts.length, f * .8 * amp, BLUEV, .5, .2, 7000 + j * 60)); return f; }

function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .1; camera.far = 20000;
  let bloomS = .8, flash = 0, ca = .0013, fade = 0, grain = .04, expo = 1.15, dim = 0;
  P.begin(); P.mat.size = .5; Pc.mat.size = 110; show({}); boltL.intensity = 0; hemi.intensity = .6; let lit = 0;
  for (const c of ['where', 'ice', 'insul', 'leader', 'hot', 'curious', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];
  if (t < TL.where) {
    // A · gancho: cae un rayo; 30.000 °C frente al Sol
    show({ land: true, cloud: true }); const f = strike(t, .05, P); const f2 = strike(t, 1.5, P, .6); const ff = Math.max(f, f2 * .6); lit = ff; boltL.position.set(0, 60, 0); boltL.intensity = ff * 4000; hemi.intensity = .6 + ff * .8; flash = Math.max(flash, f * .08); Pc.mat.size = 60;
    drawPath(P, MAIN, NM, .5 * smooth(.3, .8, t), [1.4, 1.2, 1.6], .2, .1, 11000);
    const zk = easeInOut(smooth(TL.sun - .8, TL.sun + .4, t)); camOrbit(V3(lerp(-2, 0, zk), lerp(110, 60, zk), 0), lerp(520, 160, zk), .25 - t * .02, lerp(.05, .02, zk), 40); camera.position.add(shake(t, f * 4)); P.mat.size = lerp(2.2, 1.2, zk); drawCloud(t, .55, 0, lit * .5);
    hud.push(() => { titleHUD('UN RAYO ESTÁ', '5 VECES MÁS CALIENTE', smooth(.4, .7, t) * (1 - smooth(TL.sun - .2, TL.sun, t)), 300); const sa = smooth(TL.sun, TL.sun + .3, t);
      if (sa > .01) { titleHUD('QUE LA SUPERFICIE', 'DEL SOL', sa, 300); const y = 1380; const u = clamp((t - TL.sun - .1) / .9);
        txt('RAYO', 140, y - 34, 26, { align: 'left', spacing: 4, weight: 700, alpha: sa, fill: '#bcd4ff' }); txt('≈ 30.000 °C', 940, y - 34, 34, { align: 'right', font: 'Montserrat', weight: 800, alpha: sa });
        g2.save(); g2.globalAlpha = sa; g2.fillStyle = '#bcd4ff'; g2.shadowColor = '#bcd4ff'; g2.shadowBlur = 20; g2.fillRect(140, y, 800 * easeOut(u), 22); g2.restore();
        txt('SOL (SUPERFICIE)', 140, y + 96, 26, { align: 'left', spacing: 4, weight: 700, alpha: sa, fill: '#ffc27a' }); txt('≈ 5.500 °C', 940, y + 96, 34, { align: 'right', font: 'Montserrat', weight: 800, alpha: sa });
        g2.save(); g2.globalAlpha = sa; g2.fillStyle = '#ffb060'; g2.fillRect(140, y + 130, 800 * .19 * easeOut(u), 22); g2.restore(); } });
  } else if (t < TL.ice) {
    // B · la nube de tormenta en corte: corrientes de aire de >100 km/h
    show({ land: true, cloud: true }); const lt = t - TL.where; const cut = smooth(TL.cloud + .3, TL.updraft, t); lit = .15 + .25 * Math.max(0, Math.sin(t * 1.3) ** 30);
    camOrbit(V3(60, 560, 0), lerp(2600, 2300, lt / 5.6), .08, .1, 40); expo = 1.3;
    const uk = smooth(TL.updraft - .2, TL.updraft + .5, t); const s = P.seed; if (uk > 0) for (let i = 0; i < 3500; i++) { const q = (i % P.n) * 4; const up = i % 3 !== 0; const u = fract(s[q] + t * (up ? .35 : .22)); const x = up ? (s[q + 1] - .5) * 220 : (s[q + 1] > .5 ? 1 : -1) * lerp(220, 300, s[q + 2]); const y = up ? lerp(220, 1050, u) : lerp(1000, 250, u);
      const f = uk * Math.sin(u * Math.PI) * .9; P.push(x + Math.sin(u * 6 + i) * 10, y, 60 + (s[q + 3] - .5) * 40, (up ? .9 : .4) * f, (up ? .7 : .6) * f, (up ? .4 : 1.2) * f); } P.mat.size = 22;
    hud.push(() => { titleHUD('¿Y DE DÓNDE', 'SALE?', L(t, 'where', 'cloud'), 300); titleHUD('DENTRO DE UNA', 'NUBE DE TORMENTA', L(t, 'cloud', 'updraft'), 300); titleHUD('EL AIRE SUBE Y BAJA A', 'MÁS DE 100 km/h', L(t, 'updraft'), 300);
      const pa = project(V3(0, 1150, 60)), pb = project(V3(0, 200, 0)); txt('≈ 10–12 km', 960, (pa.y + pb.y) / 2, 30, { align: 'right', weight: 700, alpha: smooth(TL.cloud + .5, TL.cloud + .9, t) * .85 });
      g2.save(); g2.globalAlpha = smooth(TL.cloud + .5, TL.cloud + .9, t) * .6; g2.strokeStyle = '#fff'; g2.lineWidth = 2; g2.beginPath(); g2.moveTo(980, pa.y); g2.lineTo(980, pb.y); g2.stroke(); g2.restore(); });
    drawCloud(t, 1, cut, lit);
  } else if (t < TL.small) {
    // C · hielo y granizo chocan y se roban electrones
    show({ ice: true }); const lt = t - TL.ice; const ek = smooth(TL.steal - .2, TL.steal + .6, t);
    crys.forEach((m, i) => { const d = m.userData; m.position.set(d.x + Math.sin(t * 1.5 + i) * .8, ((d.y0 + 20 + lt * 6 * (1 + d.s * .4)) % 40) - 20, d.z); m.rotation.set(t * (1 + d.s), t * .7 + i, 0); m.material.emissive.setRGB(.13 + ek * .5, .19 * (1 - ek) + ek * .12, .31 * (1 - ek) + .05 * ek); });
    grau.forEach((m, i) => { const d = m.userData; m.position.set(d.x, ((d.y0 + 20 - lt * 3.5 * (1 + d.s * .3)) % 40 + 40) % 40 - 20, d.z); m.rotation.set(t * .3 + i, t * .2, 0); m.material.emissive.setRGB(.06 * (1 - ek), .1 * (1 - ek) + ek * .12, .13 + ek * .5); });
    camOrbit(IC.clone(), lerp(62, 54, lt / 3.8), .2 + lt * .03, .05, 38); expo = 1.3; bloomS = .9;
    const s = P.seed; if (ek > 0) { let c = 0; for (const g of grau) for (let k = 0; k < 4; k++) { const cr = crys[(grau.indexOf(g) * 2 + k) % crys.length]; for (let i = 0; i < 30; i++) { const q = ((c++) % P.n) * 4; const u = fract(s[q] + t * 1.2); const a = cr.position.clone().lerp(g.position, u).add(IC); P.push(a.x + (s[q + 1] - .5) * .3, a.y + (s[q + 2] - .5) * .3, a.z, .5 * ek, .9 * ek, 2.4 * ek); } } P.mat.size = .5; }
    for (let i = 0; i < 2500; i++) { const q = ((i + 4000) % P.n) * 4; P.push(IC.x + (s[q] - .5) * 90, IC.y + (s[q + 1] - .5) * 70, IC.z + (s[q + 2] - .5) * 40 - 15, .05, .06, .09); }
    hud.push(() => { titleHUD('TROCITOS DE HIELO Y GRANIZO', 'CHOCAN ENTRE SÍ…', L(t, 'ice', 'steal'), 300); titleHUD('…Y SE ROBAN', 'ELECTRONES', L(t, 'steal'), 300);
      const la = smooth(TL.ice + .6, TL.ice + 1, t); txt('⬡ CRISTALES DE HIELO', 140, 1500, 28, { align: 'left', spacing: 3, weight: 700, alpha: la * .9, fill: '#cfe2ff' }); txt('● GRANIZO', 140, 1560, 28, { align: 'left', spacing: 3, weight: 700, alpha: la * .9, fill: '#cfe2ff' });
      if (ek > .3) { for (const m of crys.slice(0, 10)) { const p = project(m.position.clone().add(IC)); txt('+', p.x + 26, p.y - 26, 40, { font: 'Montserrat', weight: 800, alpha: ek, fill: '#ff8a5a' }); } for (const m of grau) { const p = project(m.position.clone().add(IC)); txt('−', p.x + 50, p.y - 40, 52, { font: 'Montserrat', weight: 800, alpha: ek, fill: '#7fb8ff' }); } } });
  } else if (t < TL.leader) {
    // D · cargas: + arriba, − abajo; E · el aire aísla y la tensión crece: cientos de millones de voltios
    show({ land: true, cloud: true }); const sep = easeInOut(smooth(TL.small - .1, TL.big + 1.2, t)); const gk = smooth(TL.insul, TL.insul + .8, t);
    camOrbit(V3(60, 560, 0), lerp(2350, 2250, (t - TL.small) / 10), .08, .1, 40); expo = 1.3; lit = .12 + .2 * Math.max(0, Math.sin(t * 1.7) ** 40);
    drawCloud(t, 1, 1, lit);
    if (gk > 0) { const s = P.seed; for (let i = 0; i < 3000; i++) { const q = (i % P.n) * 4; const x = (Math.floor(s[q] * 14) - 6.5) * 50; const u = fract(s[q + 1] + t * .5); const f = gk * .45 * (1 + Math.sin(t * 8) * .2 * smooth(TL.volts, TL.volts + .5, t)); P.push(x + Math.sin(u * 9 + x) * 6, lerp(320, 8, u), 0, f * .9, f * .8, f * .3); } P.mat.size = 16; }
    hud.push(() => { titleHUD('LOS PEQUEÑOS, CON CARGA +', 'SUBEN A LO ALTO', L(t, 'small', 'big'), 300); titleHUD('LOS GRANDES, CON CARGA −', 'SE QUEDAN ABAJO', L(t, 'big', 'insul'), 300);
      titleHUD('EL AIRE NO CONDUCE BIEN', 'LA CARGA SE ACUMULA', L(t, 'insul', 'volts'), 300); bigStat('HASTA', '100.000.000 V', 330, L(t, 'volts'), clamp((t - TL.volts) / 1.5)); txt('cientos de millones de voltios', W / 2, 440, 32, { weight: 300, alpha: L(t, 'volts') * smooth(TL.volts + .5, TL.volts + .9, t) });
      for (const c of CH) { const show_ = c.pos ? smooth(TL.small - .2, TL.small + .4, t) : smooth(TL.big - .2, TL.big + .4, t) * .3 + smooth(TL.small - .2, TL.small + .4, t) * .7; const p = project(c.m.clone().lerp(c.p, sep)); txt(c.pos ? '+' : '−', p.x, p.y, 44, { font: 'Montserrat', weight: 800, alpha: show_ * .95, fill: c.pos ? '#ff8a5a' : '#7fb8ff', shadow: 12 }); }
      for (const g of GCH) { const p = project(g); txt('+', p.x, p.y - 20, 36, { font: 'Montserrat', weight: 800, alpha: gk * .8, fill: '#ff8a5a' }); } });
  } else if (t < TL.touch) {
    // F · líder escalonado en zigzag (saltos de ~50 m); G · trazador ascendente desde edificios y árboles
    show({ land: true, cloud: true }); const lk = clamp((t - TL.leader - .3) / (TL.ground + .9 - TL.leader - .3)); const steps = Math.floor(lk * (NM - 1) + .001) + smooth(0, .4, fract(lk * (NM - 1))) * 0;
    const st = Math.min(NM - 1, lk * (NM - 1)); const stepPulse = 1 - fract(lk * (NM - 1)); drawPath(P, MAIN, st, 1.4 + stepPulse * 1.2, BLUEV, .3, .25);
    BR.forEach((b, j) => { if (b.i < st) drawPath(P, b.pts, Math.min(b.pts.length - 1, (st - b.i) * .7), .8, BLUEV, .4, .3, 7000 + j * 60); });
    const uk = clamp((t - TL.stream - .3) / (TL.touch - TL.stream - .4)); drawPath(P, UP, uk * (UP.length - 1), 1.1, BLUEV, .2, .1, 5000); drawPath(P, UPT, Math.min(UPT.length - 1, uk * (UPT.length - 1) * 1.2), .8, BLUEV, .2, .1, 5600);
    const tip = MAIN[Math.min(NM - 1, Math.ceil(st))]; const gz = easeInOut(smooth(TL.ground - .5, TL.stream + .5, t));
    const tgt = V3(lerp(-6, 0, gz), lerp(lerp(150, Math.max(tip.y - 20, 20), smooth(TL.zigzag - 1, TL.ground, t)), 14, gz), 0); camOrbit(tgt, lerp(lerp(420, 300, smooth(TL.leader, TL.zigzag, t)), 70, gz), .3 + (t - TL.leader) * .02, lerp(.02, .08, gz), 40);
    drawCloud(t, .7, 0, .15 + stepPulse * .1); Pc.mat.size = 70; P.mat.size = lerp(2.4, .9, gz); boltL.position.copy(tip); boltL.intensity = 300 + stepPulse * 400; expo = 1.25; bloomS = 1;
    hud.push(() => { titleHUD('DESDE LA NUBE BAJA UN', 'CAMINO DE AIRE CARGADO', L(t, 'leader', 'zigzag'), 300); titleHUD('EN ZIGZAG, A SALTOS DE', 'UNOS 50 METROS', L(t, 'zigzag', 'ground'), 300);
      titleHUD('CUANDO SE ACERCA AL SUELO…', '', L(t, 'ground', 'stream'), 300); titleHUD('DE ÁRBOLES Y EDIFICIOS', 'SUBE OTRA CHISPA', L(t, 'stream'), 300);
      callout(V3(0, 13 + uk * 6, 0), 150, 200, 'TRAZADOR ASCENDENTE', null, smooth(TL.stream + .8, TL.stream + 1.2, t), '#9fd0ff');
      const pa = project(MAIN[Math.max(0, Math.floor(st) - 1)]), pb = project(tip); const za = L(t, 'zigzag', 'ground'); if (za > .01 && pa.z < 1) { txt('≈ 50 m', pb.x + 90, (pa.y + pb.y) / 2, 32, { align: 'left', font: 'Montserrat', weight: 800, alpha: za }); } });
  } else if (t < TL.curious) {
    // H · se cierra el circuito: descarga de retorno ~30.000 A; I · 30.000 °C; el aire se expande: trueno
    show({ land: true, cloud: true }); const lt = t - TL.touch; const f1 = strike(t, TL.touch, P); const f2 = strike(t, TL.current + .3, P, .7) ; const f3 = t > TL.hot ? .25 + .1 * Math.sin(t * 30) : 0;
    const f = Math.max(f1, f2 * .7); boltL.position.set(0, 30, 0); boltL.intensity = f * 2500 + 200; hemi.intensity = .6 + f * .9; flash = Math.max(flash, f1 * .2); lit = f * .6;
    const hz = easeInOut(smooth(TL.hot - .4, TL.hot + .6, t)); const ez = smooth(TL.expand, TL.expand + .4, t);
    if (hz > 0) drawPath(P, MAIN, NM, hz * (1.2 + .2 * Math.sin(t * 25)) * (1 - ez * .5), [2, 1.6, 1.3], .15, .08, 9000);
    if (ez > 0) { const s = P.seed; const r = (t - TL.expand) * 6; for (let i = 0; i < 4000; i++) { const q = (i % P.n) * 4; const seg = Math.floor(s[q] * (NM - 1)); const a = MAIN[seg], b = MAIN[seg + 1]; const u = s[q + 1]; const ang = s[q + 2] * 6.283; const rr = r * (.85 + s[q + 3] * .3);
        const ff = 1.2 * Math.exp(-(t - TL.expand) * .6); P.push(lerp(a.x, b.x, u) + Math.cos(ang) * rr, lerp(a.y, b.y, u), lerp(a.z, b.z, u) + Math.sin(ang) * rr, ff * .8, ff * .9, ff * 1.3); } }
    camOrbit(V3(lerp(0, -2, hz), lerp(60, 70, hz), 0), lerp(lerp(320, 260, lt / 5), 70, hz), .35 + lt * .015, .05, 40); camera.position.add(shake(t, f1 * 3 + (t > TL.thunder ? Math.max(0, 1 - (t - TL.thunder) * 2) * 2 : 0)));
    drawCloud(t, .6, 0, lit); Pc.mat.size = 70; P.mat.size = lerp(1.3, .8, hz); bloomS = 1.1; expo = 1.2;
    hud.push(() => { titleHUD('AL TOCARSE', 'SE CIERRA EL CIRCUITO', L(t, 'touch', 'current'), 300); bigStat('UNA CORRIENTE DE UNOS', '30.000 A', 330, L(t, 'current', 'hot'), clamp((t - TL.current) / 1.5));
      bigStat('EL AIRE SE CALIENTA A', '30.000 °C', 330, L(t, 'hot', 'expand'), clamp((t - TL.hot) / 1.5)); txt('en una millonésima de segundo', W / 2, 440, 32, { weight: 300, alpha: L(t, 'hot', 'expand') * smooth(TL.hot + .5, TL.hot + .9, t) });
      titleHUD('SE EXPANDE DE GOLPE', '', L(t, 'expand', 'thunder'), 300); bigStat('ESO ES EL', 'TRUENO', 330, L(t, 'thunder'), .5); });
  } else if (t < TL.brand) {
    // J · luz casi instantánea; sonido ~3 s por km: cuenta y divide entre tres
    show({ land: true, cloud: true, house: true }); const lt = t - TL.curious; const f = Math.max(strike(t, TL.curious + .15, P), strike(t, TL.count + .3, P, .8)); boltL.position.set(0, 40, 0); boltL.intensity = f * 3000 + 100; hemi.intensity = .6 + f * .8; lit = f; flash = Math.max(flash, f * .3);
    camOrbit(V3(50, 35, 0), 345, .0, .08, 40); drawPath(P, MAIN, NM, .9, [1.2, 1.1, 1.5], .3, .1, 11000); drawCloud(t, .5, 0, lit); Pc.mat.size = 70; P.mat.size = 1.4;
    const sk = clamp((t - TL.sound) / (TL.count - TL.sound)); const s = P.seed; if (t > TL.sound - .2) for (let i = 0; i < 2500; i++) { const q = (i % P.n) * 4; const a = s[q] * Math.PI; const r = sk * 100 + (s[q + 1] - .5) * 2; const fa = 1.4 * (1 - smooth(.97, 1.05, sk) * .6); P.push(Math.cos(a) * r, Math.sin(a) * r * .9 + 1, (s[q + 2] - .5) * 30, fa * 1.6, fa * 1.1, fa * .4); }
    hud.push(() => { titleHUD('Y LO MÁS CURIOSO:', 'LA LUZ LLEGA CASI AL MOMENTO', smooth(0, .3, lt) * (1 - smooth(TL.sound - TL.curious - .1, TL.sound - TL.curious + .1, lt)), 300);
      titleHUD('EL SONIDO TARDA', '≈ 3 SEGUNDOS POR KM', L(t, 'sound', 'count'), 300); titleHUD('CUENTA LOS SEGUNDOS', 'ENTRE EL RAYO Y EL TRUENO', L(t, 'count', 'divide'), 300);
      const p0 = project(V3(0, 0, 0)), p1 = project(OBS); const la = smooth(TL.light - .2, TL.light + .2, t); arrowXY(p0.x, p0.y + 60, p1.x, p1.y + 60, la * 4 * (t < TL.sound ? 1 : 1), '#fff6c0', 8); txt('LUZ: 0,000003 s', (p0.x + p1.x) / 2, p0.y + 130, 28, { weight: 700, alpha: la * (1 - smooth(TL.count - .2, TL.count, t)), fill: '#fff6c0' });
      txt('TÚ', p1.x, p1.y - 90, 30, { font: 'Montserrat', weight: 800, alpha: la }); txt('1 km', (p0.x + p1.x) / 2, p0.y + 200, 34, { font: 'Montserrat', weight: 800, alpha: smooth(TL.sound, TL.sound + .3, t) });
      const sa = smooth(TL.sound, TL.sound + .3, t); if (sa > .01) { const secs = Math.min(3, (t - TL.sound) / (TL.count - TL.sound) * 3); txt('SONIDO: ' + secs.toFixed(1).replace('.', ',') + ' s', (p0.x + p1.x) / 2, p0.y + 270, 40, { font: 'Montserrat', weight: 800, alpha: sa * (1 - smooth(TL.count - .2, TL.count, t)), fill: '#ffc27a' }); }
      const ca2 = smooth(TL.count, TL.count + .3, t); if (ca2 > .01) { const n = Math.min(9, Math.floor((t - TL.count) / ((TL.divide - TL.count) / 9)) + 1); txt(String(n), W / 2, 760, 200, { font: 'Montserrat', weight: 800, alpha: ca2 * (1 - smooth(TL.divide - .1, TL.divide + .1, t)), fill: copperGrad(400, 680, 760, .5) }); txt('segundos', W / 2, 880, 36, { weight: 300, alpha: ca2 * (1 - smooth(TL.divide - .1, TL.divide + .1, t)) }); }
      const da = smooth(TL.divide, TL.divide + .3, t); if (da > .01) { bigStat('DIVIDE ENTRE TRES', '9 s ÷ 3 = 3 km', 800, da, clamp((t - TL.divide) / 1.5)); titleHUD('Y SABRÁS A CUÁNTOS', 'KILÓMETROS CAYÓ', da, 300); } });
  } else {
    // K · marca
    show({ land: true, cloud: true }); const lt = t - TL.brand; const f = strike(t, TL.brand + .4, P, .6); lit = f; hemi.intensity = .6 + f * 1.5; boltL.position.set(0, 60, 0); boltL.intensity = f * 5000; P.mat.size = 1.6;
    camOrbit(V3(0, 120, 0), 560 + lt * 10, .25 + lt * .02, .05, 40); drawCloud(t, .9, 0, lit); expo = .9; fade = Math.min(.5, lt * .45); dim = smooth(0, .8, lt) * .6;
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  if (!Pc.obj.visible) { Pc.begin(); Pc.end(); }
  P.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (dim > 0) hud.unshift(() => { g2.save(); g2.globalAlpha = dim * .7; g2.fillStyle = '#02050b'; g2.fillRect(0, 0, W, H); g2.restore(); });
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
function renderCover() { renderFrame(.2); coverText('¿DE DÓNDE', 'SALE UN RAYO?', 'Cinco veces más caliente que el Sol'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
