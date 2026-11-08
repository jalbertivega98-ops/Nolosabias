// NO LO SABÍAS — "¿Cómo funciona una central nuclear?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final. Esquema, no a escala.
// Pastilla de UO2 (~1 cm) ≈ energía de ~1 t de carbón (NEI). Fisión U-235 + n → Ba-141 + Kr-92 + 3 n + ~200 MeV.
// Barras de control de boro/cadmio absorben neutrones. Torres de refrigeración: emiten vapor de agua. Defecto de masa ≈ 0,1 %.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, easeIn, rng, V3, g2, camera, Particles, txt, copperGrad, project, callout, titleHUD, fract, camOrbit, bigStat, drawBrand, coverText, finish, noise1 } from '../../lib/core.js';

const scene = new THREE.Scene(); scene.background = new THREE.Color(0x04060b);
const hemi = new THREE.HemisphereLight(0xc8d8ff, 0x302820, 1.1); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2e0, 2.6); sun.position.set(200, 260, 160); scene.add(sun);
const fillL = new THREE.DirectionalLight(0x8ab0ff, .7); fillL.position.set(-120, 40, 80); scene.add(fillL);
const M = (c, r = .6, m = .2, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: e });
const box = (w, h, d, mat, x = 0, y = 0, z = 0, parent = scene) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; };
const cyl = (r, h, mat, x = 0, y = 0, z = 0, parent = scene, seg = 32) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat); m.position.set(x, y, z); parent.add(m); return m; };
const ORANGE = [1.8, .9, .3], BLUE = [.35, .8, 1.8], NEU = [1.4, 1.5, 1.7];
const dummy = new THREE.Object3D();

// ==========================================================================
// A · PASTILLA en la yema del dedo frente a 1 tonelada de carbón (unidades: cm)
// ==========================================================================
const PEL = V3(0, 0, 0); const pel = new THREE.Group(); scene.add(pel);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), M(0x4a4c56, .7, 0)); floor.rotation.x = -Math.PI / 2; pel.add(floor);
const finger = new THREE.Mesh(new THREE.CapsuleGeometry(.9, 5, 12, 24), M(0xb98a76, .7, 0)); finger.rotation.z = Math.PI / 2; finger.position.set(-1.2, .9, 0); finger.scale.set(1, 1, .85); pel.add(finger);
const nail = new THREE.Mesh(new THREE.SphereGeometry(.7, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), M(0xe8c0b0, .3, 0)); nail.scale.set(1, .25, .9); nail.position.set(-3.6, 1.75, 0); 
const pellet = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, 1.0, 40), M(0x6a6c72, .3, .75, 0x141418)); pellet.position.set(1.0, 2.3, 0); pel.add(pellet);
const pelGlow = new THREE.Mesh(new THREE.TorusGeometry(.62, .03, 8, 48), new THREE.MeshBasicMaterial({ color: 0xffb070 })); pelGlow.rotation.x = Math.PI / 2; pelGlow.position.copy(pellet.position); pel.add(pelGlow);
const COAL = V3(150, 0, -40); const coalN = 900; const coal = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), M(0x62626c, .45, .2, 0x0c0c10), coalN); pel.add(coal);
{ const r = rng(11); for (let i = 0; i < coalN; i++) { const a = r() * 6.283, d = Math.sqrt(r()) * 85; const hmax = 62 * (1 - d / 85); const y = r() ** .7 * hmax; const s = 3 + r() * 6;
  dummy.position.set(COAL.x + Math.cos(a) * d, y + s * .5, COAL.z + Math.sin(a) * d); dummy.rotation.set(r() * 6, r() * 6, r() * 6); dummy.scale.set(s, s * (.7 + r() * .5), s * (.8 + r() * .4)); dummy.updateMatrix(); coal.setMatrixAt(i, dummy.matrix); } coal.instanceMatrix.needsUpdate = true; }

// ==========================================================================
// B/E · NÚCLEO DEL REACTOR: barras de combustible + barras de control, agua con brillo azul
// ==========================================================================
const CORE = V3(20000, 0, 0); const core = new THREE.Group(); core.position.copy(CORE); scene.add(core);
const vessel = new THREE.Mesh(new THREE.CylinderGeometry(42, 42, 96, 64, 1, true), new THREE.MeshStandardMaterial({ color: 0x9aa4b0, roughness: .3, metalness: .7, transparent: true, opacity: .14, side: THREE.DoubleSide, depthWrite: false })); core.add(vessel);
cyl(42, 2, M(0x6a7078, .4, .7), 0, -48, 0, core, 64);
const fuelPos = [], ctrlPos = []; for (let i = -7; i <= 7; i++) for (let j = -7; j <= 7; j++) { const x = i * 4, z = j * 4; if (Math.hypot(x, z) > 31) continue; if ((i % 3 === 0) && (j % 3 === 0) && !(i === 0 && j === 0)) ctrlPos.push([x, z]); else fuelPos.push([x, z]); }
const fuelMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: .3, metalness: .8, emissive: 0x0a1a40 });
const fuel = new THREE.InstancedMesh(new THREE.CylinderGeometry(1.1, 1.1, 76, 16), fuelMat, fuelPos.length); fuelPos.forEach(([x, z], i) => { dummy.position.set(x, -4, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); fuel.setMatrixAt(i, dummy.matrix); }); core.add(fuel);
const ctrl = new THREE.InstancedMesh(new THREE.CylinderGeometry(1.3, 1.3, 80, 16), M(0x1c1e22, .5, .6), ctrlPos.length); core.add(ctrl);
const drive = new THREE.Group(); core.add(drive); box(70, 2, 70, M(0x4a5058, .5, .6), 0, 0, 0, drive);
function setCtrl(ins) { const y = lerp(80, 0, ins) - 4; ctrlPos.forEach(([x, z], i) => { dummy.position.set(x, y, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); ctrl.setMatrixAt(i, dummy.matrix); }); ctrl.instanceMatrix.needsUpdate = true; drive.position.y = y + 41; }
// barra seccionada con pastillas apiladas (primer plano)
const cut = new THREE.Group(); cut.position.set(0, 0, 55); core.add(cut); { const clad = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 32, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0xc0c8d0, roughness: .2, metalness: .8, transparent: true, opacity: .25, side: THREE.DoubleSide, depthWrite: false })); clad.position.y = 1; cut.add(clad); }
const cutPel = []; for (let k = 0; k < 14; k++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.85, .85, 1.9, 24), M(0x55565c, .35, .7)); p.position.set(0, -12 + k * 2.05, 0); cut.add(p); cutPel.push(p); }

// ==========================================================================
// C · NÚCLEO DE URANIO-235 (92 p + 143 n) + neutrón → Ba-141 + Kr-92 + 3 n
// ==========================================================================
const NUC = V3(-20000, 0, 0); const nucG = new THREE.Group(); nucG.position.copy(NUC); scene.add(nucG);
const NB = 236; const nP = [], isP = [], grp = [];
{ const r = rng(5); const R = 5.6; while (nP.length < NB) { const p = V3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).multiplyScalar(R); if (p.length() < R) nP.push(p); }
  for (let it = 0; it < 60; it++) { for (let i = 0; i < NB; i++) for (let j = i + 1; j < NB; j++) { const d = nP[j].clone().sub(nP[i]); const l = d.length(); if (l < 1.75 && l > 1e-4) { d.multiplyScalar((1.75 - l) / l * .5); nP[i].sub(d); nP[j].add(d); } } for (const p of nP) p.multiplyScalar(.995); }
  const idx = [...nP.keys()]; const pIdx = idx.slice().sort(() => r() - .5).slice(0, 92); pIdx.forEach(i => isP[i] = true);
  const neuts = idx.filter(i => !isP[i]); const free = neuts.slice().sort((a, b) => nP[b].z - nP[a].z).slice(0, 3); // 3 neutrones libres
  const rest = idx.filter(i => !free.includes(i)).sort((a, b) => nP[a].y - nP[b].y); rest.forEach((i, k) => grp[i] = k < 141 ? 0 : 1); free.forEach((i, k) => grp[i] = 2 + k); }
const cen = [V3(), V3()]; { const c = [0, 0]; nP.forEach((p, i) => { if (grp[i] < 2) { cen[grp[i]].add(p); c[grp[i]]++; } }); cen[0].divideScalar(c[0]); cen[1].divideScalar(c[1]); }
function makeNucleus(parent) { const m = new THREE.InstancedMesh(new THREE.SphereGeometry(.92, 20, 14), new THREE.MeshStandardMaterial({ roughness: .35, metalness: .15 }), NB); const cP = new THREE.Color(0xd8643c), cN = new THREE.Color(0x8c9cb4); for (let i = 0; i < NB; i++) m.setColorAt(i, isP[i] ? cP : cN); parent.add(m); return m; }
const nucM = makeNucleus(nucG); const inN = new THREE.Mesh(new THREE.SphereGeometry(.92, 20, 14), M(0x8c9cb4, .35, .15, 0x223040)); nucG.add(inN);
const FREE_DIR = [V3(1, .25, .3).normalize(), V3(-1, .1, .4).normalize(), V3(.7, -.2, .8).normalize()];
// k: 0 → núcleo entero; >0 → fragmentos separados por k (unidades)
function setNucleus(m, t, k, wob = 0, compact = 0) { const d0 = V3(.08, 1, 0).normalize(); const kk = Math.max(0, k);
  for (let i = 0; i < NB; i++) { const p = nP[i].clone(); const g = grp[i];
    if (g < 2) { const c = cen[g]; p.sub(c).multiplyScalar(1 - compact * .12).add(c); const sgn = g === 0 ? -1 : 1; p.addScaledVector(d0, sgn * kk); if (kk > 0) { p.sub(c).applyAxisAngle(V3(1, 0, 0), sgn * kk * .02).add(c); } }
    else p.addScaledVector(FREE_DIR[g - 2], kk * 1.9);
    if (wob) { p.x *= 1 + wob * Math.sin(t * 7); p.y *= 1 - wob * Math.sin(t * 7); }
    dummy.position.copy(p); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); } m.instanceMatrix.needsUpdate = true; }

// ==========================================================================
// D · REACCIÓN EN CADENA (árbol de fisiones, partículas)
// ==========================================================================
const CH = V3(0, 0, 20000);
const tree = []; { const r = rng(17); tree.push({ p: V3(0, 0, 0), gen: 0, par: -1 }); let front = [0];
  for (let g = 1; g <= 4; g++) { const nf = []; for (const pi of front) { const par = tree[pi]; const nk = g === 1 ? 3 : (r() < .55 ? 3 : 2); const base = Math.atan2(par.p.y, par.p.x) + (g === 1 ? 0 : 0);
    for (let k = 0; k < nk; k++) { const a = g === 1 ? k / 3 * 6.283 + .4 : base + (k - (nk - 1) / 2) * 1.0 + (r() - .5) * .5; const d = 15 + r() * 6; const p = par.p.clone().add(V3(Math.cos(a) * d, Math.sin(a) * d, (r() - .5) * 10)); tree.push({ p, gen: g, par: pi }); nf.push(tree.length - 1); } } front = nf; } }

// ==========================================================================
// F · CENTRAL: reactor → vapor → turbina → generador; agua de vuelta
// ==========================================================================
const PL = V3(0, 0, -20000); const plant = new THREE.Group(); plant.position.copy(PL); scene.add(plant);
const pFloor = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), M(0x1a1c22, .9, 0)); pFloor.rotation.x = -Math.PI / 2; plant.add(pFloor);
const rv = new THREE.Mesh(new THREE.CylinderGeometry(11, 11, 34, 48), new THREE.MeshStandardMaterial({ color: 0xb0b8c4, roughness: .3, metalness: .7, transparent: true, opacity: .35, depthWrite: false })); rv.position.set(-52, 17, 0); plant.add(rv);
const rvCore = cyl(7, 18, new THREE.MeshStandardMaterial({ color: 0x2040a0, roughness: .4, metalness: .2, emissive: 0x1840c0 }), -52, 12, 0, plant);
const dome = new THREE.Mesh(new THREE.SphereGeometry(20, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xd8d4cc, roughness: .8, transparent: true, opacity: .16, depthWrite: false, side: THREE.DoubleSide })); dome.position.set(-52, 18, 0); plant.add(dome);
const domeWall = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 18, 48, 1, true), dome.material); domeWall.position.set(-52, 9, 0); plant.add(domeWall);
const steamPath = new THREE.CatmullRomCurve3([V3(-52, 34, 0), V3(-52, 46, 0), V3(-36, 50, 0), V3(-16, 46, 0), V3(-10, 26, 0)]);
const waterPath = new THREE.CatmullRomCurve3([V3(18, 12, 0), V3(18, 3, 6), V3(-10, 3, 8), V3(-40, 3, 8), V3(-52, 3, 0)]);
const pipeMat = new THREE.MeshStandardMaterial({ color: 0xa8b0bc, roughness: .3, metalness: .7, transparent: true, opacity: .45, depthWrite: false });
plant.add(new THREE.Mesh(new THREE.TubeGeometry(steamPath, 80, 2.4, 16), pipeMat)); plant.add(new THREE.Mesh(new THREE.TubeGeometry(waterPath, 80, 2, 16), pipeMat));
const turb = new THREE.Group(); turb.position.set(4, 20, 0); plant.add(turb);
const casing = new THREE.Mesh(new THREE.CylinderGeometry(9, 12, 34, 48, 1, true), new THREE.MeshStandardMaterial({ color: 0xc0c6ce, roughness: .3, metalness: .7, transparent: true, opacity: .2, side: THREE.DoubleSide, depthWrite: false })); casing.rotation.z = Math.PI / 2; turb.add(casing);
const rotor = new THREE.Group(); turb.add(rotor); { const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 40, 16), M(0xc8ccd0, .25, .9)); shaft.rotation.z = Math.PI / 2; rotor.add(shaft);
  for (let s = 0; s < 6; s++) { const x = -13 + s * 5.2, R = 6 + s * .9; for (let b = 0; b < 18; b++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(.5, R, 1.6), M(0xd8b070, .3, .9)); const a = b / 18 * 6.283; bl.position.set(x, Math.cos(a) * R / 2, Math.sin(a) * R / 2); bl.rotation.x = -a; bl.rotation.y = .5; rotor.add(bl); } } }
const gen = new THREE.Group(); gen.position.set(38, 20, 0); plant.add(gen); { const gc = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 22, 48), M(0x3a5a78, .4, .6)); gc.rotation.z = Math.PI / 2; gen.add(gc);
  for (let k = 0; k < 5; k++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(10.2, .5, 8, 48), M(0xc87a40, .3, .9)); ring.rotation.y = Math.PI / 2; ring.position.x = -8 + k * 4; gen.add(ring); } }
const genGlow = new THREE.MeshBasicMaterial({ color: 0xffd060, transparent: true, opacity: 0 }); const bolt = new THREE.Mesh(new THREE.SphereGeometry(3, 20, 14), genGlow); bolt.position.set(52, 20, 0); plant.add(bolt);
box(1, 40, 1, M(0x8a8e96, .5, .6), 64, 20, 0, plant); box(14, .8, .8, M(0x8a8e96, .5, .6), 64, 38, 0, plant);

// ==========================================================================
// G · TORRES DE REFRIGERACIÓN (hiperboloide) con penacho de vapor
// ==========================================================================
const TW = V3(20000, 0, 20000); const tw = new THREE.Group(); tw.position.copy(TW); scene.add(tw);
const twFloor = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), M(0x4a5a3a, .95, 0)); twFloor.rotation.x = -Math.PI / 2; tw.add(twFloor);
function tower(x, z, s) { const pts = []; for (let i = 0; i <= 40; i++) { const y = i / 40 * 150; const r = 34 * Math.sqrt(1 + ((y - 112) / 55) ** 2); pts.push(new THREE.Vector2(Math.min(r, 58), y)); } const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 72), M(0xb8b2a6, .85, 0)); m.material.side = THREE.DoubleSide; m.position.set(x, 0, z); m.scale.setScalar(s); tw.add(m); return m; }
const T1 = tower(0, 0, 1), T2 = tower(-150, -140, .95);
const Pv = new Particles(9000, { size: 40, seed: 91 }); scene.add(Pv.obj);
function plume(base, scale, t, n, sd, amp = 1) { const s = Pv.seed; for (let i = 0; i < n; i++) { const q = ((i + sd) % Pv.n) * 4; const life = fract(s[q] + t * .12); const y = life * 260 * scale; const spread = (14 + life * 90) * scale;
  const a = s[q + 1] * 6.283, rr = Math.sqrt(s[q + 2]) * spread; const wx = life * life * 120 * scale + noise1(s[q + 3] * 30 + t * .3) * 10 * life;
  const f = amp * .045 * (1 - life) ** 1.2 * Math.min(1, life * 8); const c = .85 + s[q + 3] * .15; Pv.push(base.x + Math.cos(a) * rr + wx, base.y + y, base.z + Math.sin(a) * rr, c * f, c * f, c * 1.03 * f); } }

// ==========================================================================
// H · BALANZA: núcleo entero frente a sus trozos → pesan un poquito menos
// ==========================================================================
const BL = V3(-20000, 0, 20000); const bal = new THREE.Group(); bal.position.copy(BL); scene.add(bal);
cyl(2, 50, M(0xb8bcc4, .3, .8), 0, 0, 0, bal); cyl(10, 2, M(0x6a6e76, .4, .7), 0, -25, 0, bal);
const beam = new THREE.Group(); beam.position.set(0, 25, 0); bal.add(beam); box(62, 1.6, 2, M(0xd0a060, .3, .9), 0, 0, 0, beam);
const tri = new THREE.Mesh(new THREE.ConeGeometry(3, 5, 3), M(0xd0a060, .3, .9)); tri.position.y = -1; beam.add(tri);
const pans = [-1, 1].map(sx => { const p = new THREE.Group(); bal.add(p); const plate = new THREE.Mesh(new THREE.CylinderGeometry(11, 9, 1.4, 48), M(0xc8ccd2, .25, .9)); p.add(plate);
  for (let k = 0; k < 3; k++) { const a = k / 3 * 6.283; const s = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, 30, 6), M(0xa0a4ac, .3, .9)); s.position.set(Math.cos(a) * 5, 15, Math.sin(a) * 5); s.rotation.set(Math.sin(a) * .17, 0, -Math.cos(a) * .17); p.add(s); } p.userData.sx = sx; return p; });
const nucL = new THREE.Group(); pans[0].add(nucL); nucL.scale.setScalar(1); nucL.position.y = 6.5; const nucLM = makeNucleus(nucL);
const nucR = new THREE.Group(); pans[1].add(nucR); nucR.scale.setScalar(1); nucR.position.y = 6.5; const nucRM = makeNucleus(nucR);
function setBalance(tilt) { beam.rotation.z = tilt; pans.forEach(p => { const sx = p.userData.sx; p.position.set(Math.cos(tilt) * 29 * sx, 25 + Math.sin(tilt) * 29 * sx - 31, 0); }); }

// ==========================================================================
// TIMELINE
// ==========================================================================
const P = new Particles(20000, { size: .5, seed: 43 }); scene.add(P.obj);
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
const L = (t, a, b) => smooth(TL[a], TL[a] + .3, t) * (b ? 1 - smooth(TL[b] - .1, TL[b] + .1, t) : 1);
function show(o) { pel.visible = !!o.pel; core.visible = !!o.core; nucG.visible = !!o.nuc; plant.visible = !!o.plant; tw.visible = !!o.tw; bal.visible = !!o.bal; Pv.obj.visible = !!o.tw; }
function burst(c, t, t0, n, R, col, sd = 0, dur = .9) { const u = (t - t0) / dur; if (u < 0 || u > 1) return; const s = P.seed; for (let i = 0; i < n; i++) { const q = ((i + sd) % P.n) * 4; const a = s[q] * 6.283, b = Math.acos(s[q + 1] * 2 - 1); const r = R * easeOut(u) * (.5 + s[q + 2] * .6); const f = (1 - u) * 1.6;
  P.push(c.x + Math.sin(b) * Math.cos(a) * r, c.y + Math.cos(b) * r, c.z + Math.sin(b) * Math.sin(a) * r, col[0] * f, col[1] * f, col[2] * f); } }
function ball(c, n, R, col, amp, sd = 0) { const s = P.seed; for (let i = 0; i < n; i++) { const q = ((i + sd) % P.n) * 4; const a = s[q] * 6.283, b = Math.acos(s[q + 1] * 2 - 1); const r = R * Math.cbrt(s[q + 2]); P.push(c.x + Math.sin(b) * Math.cos(a) * r, c.y + Math.cos(b) * r, c.z + Math.sin(b) * Math.sin(a) * r, col[0] * amp, col[1] * amp, col[2] * amp); } }
function neutronDot(p, amp = 1, trail = null) { ball(p, 30, .5, NEU, 1.3 * amp, 9000); if (trail) for (let i = 0; i < 30; i++) { const u = i / 30; const q = p.clone().addScaledVector(trail, -u * 6); P.push(q.x, q.y, q.z, NEU[0] * (1 - u) * amp, NEU[1] * (1 - u) * amp, NEU[2] * (1 - u) * amp); } }
// neutrones rebotando dentro del núcleo del reactor (cantidad ∝ potencia)
function coreNeutrons(t, pw) { const s = P.seed; const n = Math.floor(2500 * pw); for (let i = 0; i < n; i++) { const q = (i % P.n) * 4; const x = (fract(s[q] + t * (.05 + s[q + 3] * .08)) - .5) * 60, z = (fract(s[q + 1] + t * (.04 + s[q + 2] * .07)) - .5) * 60, y = (fract(s[q + 2] + t * .06) - .5) * 70 - 4;
  if (Math.hypot(x, z) > 32) continue; const f = 1.4 * pw; P.push(CORE.x + x, CORE.y + y, CORE.z + z, BLUE[0] * f, BLUE[1] * f, BLUE[2] * f); } }

function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .1; camera.far = 9000;
  let bloomS = .8, flash = 0, ca = .0013, fade = 0, grain = .035, expo = 1.15, dim = 0;
  P.begin(); Pv.begin(); P.mat.size = .6; show({}); hemi.intensity = 1.1; scene.background.setHex(0x04060b);
  for (const c of ['how', 'nucleus', 'chain', 'control', 'heat', 'towers', 'curious', 'einstein', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  flash = Math.max(flash, flashAt(t, TL.split, .4, .45));
  const hud = [];
  if (t < TL.how) {
    // A · pastilla en la yema del dedo… frente a una tonelada de carbón
    show({ pel: true }); const z = easeInOut(smooth(TL.coal - .1, TL.coal + 1.3, t)); pelGlow.material.color.setRGB(1, .65, .35); pelGlow.visible = z > .05; pelGlow.scale.setScalar(1 + z * 3);
    const tgt = V3(lerp(.2, 85, z), lerp(1.9, 34, z), lerp(0, -20, z)); camOrbit(tgt, lerp(lerp(16, 13, t / TL.coal), 720, z), lerp(.45, .3, z), lerp(.3, .22, z), 35); expo = 1.5;
    hud.push(() => { titleHUD('UNA PASTILLA DEL TAMAÑO', 'DE LA PUNTA DE TU DEDO…', smooth(.1, .4, t) * (1 - smooth(TL.coal - .1, TL.coal + .1, t)), 300);
      titleHUD('…DA TANTA ENERGÍA COMO', '1 TONELADA DE CARBÓN', L(t, 'coal'), 300);
      callout(pellet.getWorldPosition(V3()), -160, 300, 'URANIO', '≈ 1 cm', smooth(.6, 1, t) * (1 - smooth(TL.coal - .2, TL.coal, t)));
      callout(pellet.getWorldPosition(V3()), 60, -300, '1 PASTILLA', null, smooth(TL.coal + 1, TL.coal + 1.4, t));
      callout(COAL.clone().add(V3(0, 64, 0)), 40, -200, '1.000 kg', 'de carbón', smooth(TL.coal + 1.2, TL.coal + 1.6, t), '#c8c8c8'); });
  } else if (t < TL.nucleus) {
    // B · núcleo del reactor: miles de barras llenas de pastillas
    show({ core: true }); setCtrl(.55); const lt = t - TL.how; coreNeutrons(t, .6); fuelMat.emissive.setRGB(.02, .05, .15); P.mat.size = 3.2;
    const zi = easeInOut(smooth(TL.core + 2.2, TL.nucleus - .2, t)); cut.visible = zi > .01; 
    camOrbit(CORE.clone().add(V3(0, 0, 55 * zi)).add(V3(0, lerp(4, 0, zi), 0)), lerp(lerp(380, 330, lt / 3.5), 70, zi), .6 + lt * .05, lerp(.45, .1, zi), 36); bloomS = 1; expo = 1.25;
    hud.push(() => { titleHUD('¿CÓMO ES', 'POSIBLE?', L(t, 'how', 'core'), 300); titleHUD('EN EL CORAZÓN DEL REACTOR', 'MILES DE BARRAS', L(t, 'core'), 300);
      callout(CORE.clone().add(V3(fuelPos[40][0], 30, fuelPos[40][1])), 80, -160, 'BARRA DE COMBUSTIBLE', 'unos 4 m de largo', smooth(TL.core + .6, TL.core + 1, t) * (1 - smooth(TL.core + 2, TL.core + 2.3, t)));
      callout(cutPel[8].getWorldPosition(V3()), 140, -120, 'CIENTOS DE PASTILLAS', 'apiladas en cada barra', smooth(TL.core + 3, TL.core + 3.4, t)); });
  } else if (t < TL.chain) {
    // C · uranio-235: un neutrón lo parte en dos + energía + 3 neutrones
    show({ nuc: true }); const lt = t - TL.nucleus; const k = t < TL.split ? 0 : easeOut(smooth(TL.split, TL.split + 2.4, t)) * 13 + (t - TL.split) * .6; const wob = t < TL.split ? .035 + .03 * smooth(TL.hit, TL.split, t) : 0;
    setNucleus(nucM, t, k, wob, smooth(TL.split, TL.split + 1, t));
    const hp = TL.hit + .2; const u = clamp((t - hp) / (TL.split - hp)); inN.visible = t < TL.split; inN.position.copy(V3(-42, 10, 4).lerp(V3(-5, .5, 0), u)); if (t > hp - .4 && t < TL.split) neutronDot(inN.position.clone().add(NUC), 1, V3(37, -9.5, -4).normalize());
    burst(NUC, t, TL.split, 1500, 30, ORANGE, 0, .9); burst(NUC, t, TL.split + .1, 1500, 22, [2, 1.6, 1], 3000, .7);
    if (t > TL.split) for (let g = 0; g < 3; g++) { const ip = nP.findIndex((_, i) => grp[i] === 2 + g); const p = nP[ip].clone().addScaledVector(FREE_DIR[g], k * 1.9).add(NUC); ball(p, 60, 1.3, NEU, 1.2 * smooth(TL.neutrons - .2, TL.neutrons + .2, t) + .2, 9200 + g * 80); }
    camOrbit(NUC.clone(), lerp(lerp(52, 44, smooth(TL.nucleus, TL.hit, t)), 120, easeInOut(smooth(TL.split, TL.neutrons + 1, t))), .25 + lt * .03, .12, 36); P.mat.size = 1.1; bloomS = 1.1;
    hud.push(() => { titleHUD('EL NÚCLEO DE UN ÁTOMO DE URANIO', 'ENORME E INESTABLE', L(t, 'nucleus', 'hit'), 300); titleHUD('SI LE ACIERTA', 'UN NEUTRÓN…', L(t, 'hit', 'split'), 300); titleHUD('', '…SE PARTE EN DOS', L(t, 'split', 'neutrons'), 300);
      titleHUD('Y SUELTA ENERGÍA', 'Y 2 O 3 NEUTRONES NUEVOS', L(t, 'neutrons'), 300);
      txt('92 PROTONES  ·  143 NEUTRONES', W / 2, 1520, 30, { spacing: 3, weight: 700, alpha: L(t, 'nucleus', 'split') * .9 }); txt('URANIO-235', W / 2, 1470, 46, { font: 'Montserrat', weight: 800, alpha: L(t, 'nucleus', 'split'), fill: copperGrad(300, 780, 1470, .5) });
      if (t < TL.split) callout(inN.getWorldPosition(V3()), -40, -180, 'NEUTRÓN', null, smooth(TL.hit + .3, TL.hit + .6, t), '#cfe0ff');
      const fa = smooth(TL.split + .8, TL.split + 1.2, t); const d0 = V3(.08, 1, 0).normalize(); callout(NUC.clone().add(cen[0]).addScaledVector(d0, -k), 200, 60, 'BARIO', null, fa); callout(NUC.clone().add(cen[1]).addScaledVector(d0, k), 200, -60, 'KRIPTÓN', null, fa);
      txt('≈ 200 MeV', W / 2, 960, 64, { font: 'Montserrat', weight: 800, alpha: smooth(TL.neutrons + .3, TL.neutrons + .7, t), fill: copperGrad(300, 780, 960, .5) }); txt('en cada fisión', W / 2, 1020, 30, { weight: 300, alpha: smooth(TL.neutrons + .3, TL.neutrons + .7, t) }); });
  } else if (t < TL.control) {
    // D · reacción en cadena
    const lt = t - TL.chain; const T0 = TL.chain - .4; const genT = g => T0 + [0, .9, 2.1, 3.1, 4.1][g];
    let done = 0; const s = P.seed;
    tree.forEach((nd, i) => { const ts = genT(nd.gen); const c = nd.p.clone().add(CH);
      if (nd.par >= 0) { const pp = tree[nd.par].p.clone().add(CH); const tp = genT(tree[nd.par].gen); const u = (t - tp) / (ts - tp); if (u > 0 && u < 1) { const p = pp.clone().lerp(c, u); neutronDot(p, 1, c.clone().sub(pp).normalize()); } }
      if (t < ts) { ball(c, 160, 3.2, [1.6, .6, .25], 1.2, i * 37); } else { done++; const k = easeOut(clamp((t - ts) / 1.6)) * 4; const dir = V3(Math.cos(i * 2.1), Math.sin(i * 2.1), 0); const fa = 1 - .7 * clamp((t - ts) / 3);
        ball(c.clone().addScaledVector(dir, k), 70, 1.8, [1.4, .55, .25], .9 * fa, i * 37); ball(c.clone().addScaledVector(dir, -k), 50, 1.6, [1.4, .55, .25], .9 * fa, i * 37 + 70); burst(c, t, ts, 260, 9, ORANGE, i * 53, .6); } });
    const gl = smooth(TL.cadena, TL.cadena + 1, t); camOrbit(CH.clone(), lerp(70, 200, easeInOut(clamp(lt / 4.2))), .05 + lt * .03, .1, 38); P.mat.size = lerp(1.0, 1.8, clamp(lt / 4)); bloomS = 1.1 + gl * .3; expo = 1.2 + gl * .2;
    hud.push(() => { titleHUD('ESOS NEUTRONES', 'PARTEN OTROS NÚCLEOS', L(t, 'chain', 'more'), 300); titleHUD('Y ESTOS,', 'OTROS MÁS…', L(t, 'more', 'cadena'), 300); titleHUD('ES UNA', 'REACCIÓN EN CADENA', L(t, 'cadena'), 300);
      bigStat('', done + (done === 1 ? ' FISIÓN' : ' FISIONES'), 1500, smooth(TL.chain, TL.chain + .3, t), clamp(lt / 1.5)); });
  } else if (t < TL.heat) {
    // E · barras de control: se tragan neutrones; bajas → más lento; subes → más rápido
    show({ core: true }); const lt = t - TL.control; cut.visible = false;
    const ins = t < TL.down ? lerp(.2, .45, smooth(TL.rods, TL.rods + 1, t)) : t < TL.up ? lerp(.45, .92, easeInOut(smooth(TL.down, TL.down + 1.4, t))) : lerp(.92, .2, easeInOut(smooth(TL.up, TL.up + 1.4, t)));
    setCtrl(ins); const pw = clamp(1.05 - ins * 1.0, .08, 1); coreNeutrons(t, pw); fuelMat.emissive.setRGB(.01 + .03 * pw, .02 + .08 * pw, .04 + .3 * pw); P.mat.size = 3.2;
    camOrbit(CORE.clone().add(V3(0, 18, 0)), lerp(380, 350, lt / 7), .7 + lt * .04, .32, 38); bloomS = 1; expo = 1.2;
    hud.push(() => { titleHUD('PARA QUE NO SE DESBOQUE…', '', L(t, 'control', 'rods'), 300); titleHUD('BARRAS DE CONTROL', 'QUE SE TRAGAN NEUTRONES', L(t, 'rods', 'down'), 300);
      titleHUD('SI LAS BAJAS', 'MÁS LENTO', L(t, 'down', 'up'), 300); titleHUD('SI LAS SUBES', 'MÁS RÁPIDO', L(t, 'up'), 300);
      callout(CORE.clone().add(V3(ctrlPos[3][0], 80 - ins * 80 - 4 + 30, ctrlPos[3][1])), -60, -150, 'BORO / CADMIO', null, smooth(TL.rods + .5, TL.rods + .9, t) * (1 - smooth(TL.down - .2, TL.down, t)), '#c8c8c8');
      const a = smooth(TL.rods, TL.rods + .4, t); if (a > .01) { const x0 = 190, x1 = 890, y = 1520; g2.save(); g2.globalAlpha = a; g2.fillStyle = 'rgba(255,255,255,.12)'; g2.fillRect(x0, y, x1 - x0, 22); const gr = g2.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, '#4aa0ff'); gr.addColorStop(1, '#ff8a40'); g2.fillStyle = gr; g2.fillRect(x0, y, (x1 - x0) * pw, 22); g2.restore();
        txt('POTENCIA', x0, y - 26, 24, { align: 'left', spacing: 4, alpha: a * .85 }); txt(Math.round(pw * 100) + ' %', x1, y - 26, 28, { align: 'right', weight: 800, alpha: a }); } });
  } else if (t < TL.towers) {
    // F · calor → vapor → turbina → generador
    show({ plant: true }); const lt = t - TL.heat; const s = P.seed; const st = smooth(TL.steam - .3, TL.steam + .3, t); const spin = smooth(TL.steam, TL.turbine, t);
    rotor.rotation.x = (t - TL.steam) > 0 ? (t - TL.steam) ** 2 * 1.6 + Math.max(0, t - TL.turbine) * 4 : 0; rvCore.material.emissive.setRGB(.1, .25, .8); hemi.intensity = 1.8;
    for (let i = 0; i < 900; i++) { const q = (i % P.n) * 4; const u = fract(s[q] + t * .55); const p = steamPath.getPointAt(u).add(V3((s[q + 1] - .5) * 3, (s[q + 2] - .5) * 3, (s[q + 3] - .5) * 3)).add(PL); const f = st * .8; P.push(p.x, p.y, p.z, f, f, f * 1.1); }
    for (let i = 0; i < 1400; i++) { const q = ((i + 900) % P.n) * 4; const x = lerp(-12, 20, fract(s[q] + t * .7)); const a = s[q + 1] * 6.283, r = 2 + s[q + 2] * 8; const f = st * spin * .5; P.push(PL.x + 4 + x, PL.y + 20 + Math.cos(a) * r, PL.z + Math.sin(a) * r, f, f, f * 1.1); }
    for (let i = 0; i < 500; i++) { const q = ((i + 2400) % P.n) * 4; const u = fract(s[q] + t * .3); const p = waterPath.getPointAt(u).add(V3((s[q + 1] - .5) * 2, (s[q + 2] - .5) * 2, (s[q + 3] - .5) * 2)).add(PL); const f = st * .8; P.push(p.x, p.y, p.z, BLUE[0] * f * .5, BLUE[1] * f * .5, BLUE[2] * f * .5); }
    for (let i = 0; i < 600; i++) { const q = ((i + 3000) % P.n) * 4; const a = s[q] * 6.283, r = s[q + 1] * 9; const y = fract(s[q + 2] + t * .8) * 18; const f = .6 + .6 * smooth(TL.heat, TL.heat + .6, t); P.push(PL.x - 52 + Math.cos(a) * r, PL.y + 12 + y, PL.z + Math.sin(a) * r, ORANGE[0] * f * .5, ORANGE[1] * f * .5, ORANGE[2] * f * .5); }
    const el = smooth(TL.turbine + .5, TL.turbine + 1, t); genGlow.opacity = el * (.6 + .4 * Math.sin(t * 20)); for (let i = 0; i < 400; i++) { const q = ((i + 3600) % P.n) * 4; const u = fract(s[q] + t * 1.5); const p = V3(52 + u * 12, 20 + (s[q + 1] - .5) * 1.5 + u * 18, (s[q + 2] - .5) * 1.5).add(PL); P.push(p.x, p.y, p.z, 2 * el, 1.7 * el, .4 * el); }
    const px = t < TL.steam ? -45 : t < TL.turbine ? lerp(-45, -4, easeInOut(smooth(TL.steam - .2, TL.steam + .8, t))) : t < TL.gencoal ? lerp(-4, 30, easeInOut(smooth(TL.turbine - .2, TL.turbine + .8, t))) : lerp(30, -4, easeInOut(smooth(TL.gencoal, TL.gencoal + 1.2, t)));
    camOrbit(PL.clone().add(V3(px, 24, 0)), t < TL.gencoal ? 170 : lerp(170, 300, easeInOut(smooth(TL.gencoal, TL.gencoal + 1.2, t))), .12 + lt * .025, .2, 38); P.mat.size = 1.3; bloomS = 1; expo = 1.2;
    hud.push(() => { titleHUD('TODO ESE CALOR', 'HIERVE AGUA', L(t, 'heat', 'steam'), 300); titleHUD('EL VAPOR MUEVE', 'UNA TURBINA', L(t, 'steam', 'turbine'), 300); titleHUD('Y LA TURBINA,', 'UN GENERADOR', L(t, 'turbine', 'gencoal'), 300);
      titleHUD('IGUAL QUE UNA', 'CENTRAL DE CARBÓN…', L(t, 'gencoal', 'nofire'), 300); titleHUD('…PERO SIN', 'QUEMAR NADA', L(t, 'nofire'), 300);
      const ca2 = smooth(TL.heat + .5, TL.heat + .9, t) * (1 - smooth(TL.towers - .3, TL.towers, t)); callout(rv.getWorldPosition(V3()).add(V3(0, -4, 0)), -40, 260, 'REACTOR', t > TL.nofire ? 'fisión, no fuego' : null, ca2);
      callout(turb.getWorldPosition(V3()).add(V3(0, 9, 0)), 0, -240, 'TURBINA', null, smooth(TL.steam + .5, TL.steam + .9, t) * (1 - smooth(TL.towers - .3, TL.towers, t)));
      callout(gen.getWorldPosition(V3()).add(V3(0, -10, 0)), 30, 260, 'GENERADOR', null, smooth(TL.turbine + .4, TL.turbine + .8, t) * (1 - smooth(TL.towers - .3, TL.towers, t))); });
  } else if (t < TL.curious) {
    // G · torres: no es humo, es vapor de agua; enfrían y devuelven el agua
    show({ tw: true }); const lt = t - TL.towers; hemi.intensity = 1.9; scene.background.setRGB(.42, .55, .72);
    plume(TW.clone().add(V3(0, 150, 0)), 1, t + 40, 3000, 0, 1); plume(TW.clone().add(V3(-150, 142, -140)), .95, t + 47, 2200, 3000, .9); Pv.mat.size = 48;
    const cl = smooth(TL.cool - .2, TL.cool + .6, t); if (cl > 0) { const s = P.seed; for (let i = 0; i < 2000; i++) { const q = (i % P.n) * 4; const a = s[q] * 6.283, r = Math.sqrt(s[q + 1]) * 50; const y = 30 - fract(s[q + 2] + t * 1.4) * 30; P.push(TW.x + Math.cos(a) * r, y, TW.z + Math.sin(a) * r, BLUE[0] * cl * .4, BLUE[1] * cl * .4, BLUE[2] * cl * .4); } }
    camOrbit(TW.clone().add(V3(lerp(-40, 0, clamp(lt / 6)), lerp(150, 70, easeInOut(smooth(TL.cool - .3, TL.cool + 1, t))), 0)), lerp(lerp(620, 560, lt / 4), 440, easeInOut(smooth(TL.cool - .3, TL.cool + 1, t))), .55 + lt * .03, lerp(.12, .05, smooth(TL.cool - .3, TL.cool + 1, t)), 40); expo = 1.1; bloomS = .6; P.mat.size = 2.2;
    hud.push(() => { titleHUD('¿Y ESAS TORRES GIGANTES', 'QUE ECHAN HUMO?', L(t, 'towers', 'vapor'), 300); titleHUD('NO ES HUMO:', 'ES VAPOR DE AGUA', L(t, 'vapor', 'cool'), 300); titleHUD('ENFRÍAN EL AGUA', 'Y VUELVE AL CICLO', L(t, 'cool'), 300);
      txt('H₂O', W / 2, 760, 90, { font: 'Montserrat', weight: 800, alpha: L(t, 'vapor', 'cool'), fill: '#ffffff' }); });
  } else if (t < TL.brand) {
    // H · defecto de masa: los trozos pesan un poquito menos → E = mc²
    show({ bal: true }); const lt = t - TL.curious; setNucleus(nucLM, t, 0, .015, 0); setNucleus(nucRM, t, 3.4, 0, 1);
    const tilt = t < TL.lighter ? 0 : 0.075 * easeInOut(smooth(TL.lighter + .3, TL.lighter + 1.6, t)); setBalance(tilt);
    const cv = smooth(TL.convert, TL.convert + .6, t) * (1 - smooth(TL.einstein + .5, TL.einstein + 1.2, t)); if (cv > 0) { const s = P.seed; const c = nucR.getWorldPosition(V3()); for (let i = 0; i < 2600; i++) { const q = (i % P.n) * 4; const u = fract(s[q] + t * .5); const a = s[q + 1] * 6.283; const r = 4 + u * 40;
      P.push(c.x + Math.cos(a) * r, c.y + u * 50 + (s[q + 2] - .5) * 6, c.z + Math.sin(a) * r, ORANGE[0] * cv * (1 - u), ORANGE[1] * cv * (1 - u), ORANGE[2] * cv * (1 - u)); } }
    const em = smooth(TL.einstein - .2, TL.einstein + .6, t); dim = em * .85;
    hemi.intensity = 1.7; camOrbit(BL.clone().add(V3(0, 6, 0)), lerp(265, 240, clamp(lt / 9)), .08 + lt * .015, .12, 38); P.mat.size = 1.5; bloomS = 1; expo = 1.2;
    hud.push(() => { titleHUD('Y LO MÁS', 'CURIOSO', L(t, 'curious', 'mass'), 300); titleHUD('LA ENERGÍA SALE DE UNA', 'PÉRDIDA DE MASA DIMINUTA', L(t, 'mass', 'lighter'), 300);
      titleHUD('LOS TROZOS PESAN', 'UN POQUITO MENOS', L(t, 'lighter', 'convert'), 300); titleHUD('Y ESA MASA PERDIDA', 'SE CONVIERTE EN ENERGÍA', L(t, 'convert', 'einstein'), 300);
      const ba = smooth(TL.mass, TL.mass + .4, t) * (1 - em); callout(nucL.getWorldPosition(V3()).add(V3(0, 6, 0)), -30, -240, 'NÚCLEO ENTERO', null, ba); callout(nucR.getWorldPosition(V3()).add(V3(0, 6, 0)), 30, -240, 'TROZOS', null, ba);
      txt('−0,1 %', W / 2, 1480, 76, { font: 'Montserrat', weight: 800, alpha: smooth(TL.lighter + 1.2, TL.lighter + 1.6, t) * (1 - em), fill: copperGrad(300, 780, 1480, .5) }); txt('de la masa', W / 2, 1540, 30, { weight: 300, alpha: smooth(TL.lighter + 1.2, TL.lighter + 1.6, t) * (1 - em) });
      titleHUD('LA FÓRMULA MÁS FAMOSA', 'DE EINSTEIN', L(t, 'einstein', 'emc'), 300); bigStat('', 'E = mc²', 880, L(t, 'emc'), clamp((t - TL.emc) / 1.5));
      txt('c = 300.000 km/s  →  c² es enorme', W / 2, 1060, 34, { weight: 300, alpha: smooth(TL.emc + .8, TL.emc + 1.2, t) }); });
  } else {
    // I · marca
    show({ tw: true }); const lt = t - TL.brand; scene.background.setRGB(.42, .55, .72); plume(TW.clone().add(V3(0, 150, 0)), 1, t + 40, 3000, 0, 1); plume(TW.clone().add(V3(-150, 142, -140)), .95, t + 47, 2200, 3000, .9); Pv.mat.size = 48;
    camOrbit(TW.clone().add(V3(0, 150, 0)), 620 + lt * 30, .7 + lt * .02, .12, 40); expo = .9; dim = smooth(0, .8, lt) * .6; bloomS = .6;
    hud.push(() => drawBrand(lt - .3)); fade = smooth(TL.end - .6, TL.end, t) * .3;
  }
  P.end(); Pv.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (dim > 0) hud.unshift(() => { g2.save(); g2.globalAlpha = dim * .7; g2.fillStyle = '#02050b'; g2.fillRect(0, 0, W, H); g2.restore(); });
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
function renderCover() { renderFrame(TL.split + 1.0); coverText('¿DE DÓNDE SALE', 'TANTA ENERGÍA?', 'Una pastilla = 1 tonelada de carbón'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
