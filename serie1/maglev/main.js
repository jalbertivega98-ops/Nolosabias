// NO LO SABÍAS — "¿Cómo flota un tren maglev?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final. Esquema, no a escala (el hueco de 1 cm se exagera).
// Transrapid de Shanghái (2004): suspensión electromagnética (EMS), el tren abraza la viga y unos electroimanes atraen el raíl de acero por debajo; hueco ~10 mm regulado continuamente; 431 km/h comerciales.
// Propulsión: motor lineal síncrono de estator largo en la vía. SCMaglev L0 (Japón): 603 km/h en 2015. Un avión de pasajeros despega a unos 250–300 km/h.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, easeIn, rng, V3, g2, camera, Particles, txt, copperGrad, project, callout, titleHUD, fract, camOrbit, bigStat, drawBrand, coverText, finish, noise1 } from '../../lib/core.js';

const scene = new THREE.Scene(); const SKY = new THREE.Color(0x9cc0e0); scene.background = SKY.clone();
const hemi = new THREE.HemisphereLight(0xe0ecff, 0x3a4030, 1.5); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2e0, 2.6); sun.position.set(200, 300, 260); scene.add(sun);
const fillL = new THREE.DirectionalLight(0x8ab0ff, .6); fillL.position.set(-200, 60, -150); scene.add(fillL);
const M = (c, r = .6, m = .2, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: e });
const box = (w, h, d, mat, x = 0, y = 0, z = 0, parent = scene) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; };
const RED = [1.9, .45, .35], BLUE = [.4, .7, 1.9], WHITE = [1.3, 1.35, 1.4], GOLD = [1.9, 1.5, .5];
const dummy = new THREE.Object3D();

// ---- tren: cuerpo redondeado + morro alargado + faldones que abrazan la viga ----
function makeTrain(len, noseLen, col, stripe, cars = 1) { const g = new THREE.Group(); const bodyM = M(col, .3, .4); const R = 1.85;
  for (let c = 0; c < cars; c++) { const x0 = -c * (len + .6); const b = new THREE.Mesh(new THREE.CylinderGeometry(R, R, len, 40), bodyM); b.rotation.z = Math.PI / 2; b.scale.set(1, 1, .98); b.position.set(x0 - len / 2, 2.1, 0); g.add(b);
    box(len, .5, 3.4, bodyM, x0 - len / 2, .5, 0, g); box(len, .45, 3.75, M(stripe, .3, .3), x0 - len / 2, 2.6, 0, g); box(len - 2, .55, 3.76, M(0x101820, .1, .6), x0 - len / 2 - .5, 3.0, 0, g);
    for (const s of [-1, 1]) { box(len, .4, .25, bodyM, x0 - len / 2, .45, s * 1.75, g); } }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(R, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2), bodyM); nose.rotation.z = -Math.PI / 2; nose.scale.set(1, noseLen / R, .98); nose.position.set(0, 2.1, 0); g.add(nose);
  const tail = nose.clone(); tail.rotation.z = Math.PI / 2; tail.scale.set(1, 1.2, .98); tail.position.x = -cars * (len + .6) + .6; g.add(tail);
  const wind = new THREE.Mesh(new THREE.SphereGeometry(R * 1.01, 32, 16, 0, Math.PI * 2, Math.PI * .12, Math.PI * .2), M(0x101820, .1, .6)); wind.rotation.z = -Math.PI / 2; wind.scale.set(1, noseLen / R, .98); 
  return g; }

// ==========================================================================
// RECORRIDO: viga elevada en T con pilares; el paisaje se mueve
// ==========================================================================
const run = new THREE.Group(); scene.add(run);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(8000, 8000), M(0x6a8048, .95, 0)); ground.rotation.x = -Math.PI / 2; run.add(ground);
const BEAM_Y = 10; const beamM = M(0xb8b4ac, .85, 0); box(6000, 2.2, 2.8, beamM, 0, BEAM_Y - 1.1, 0, run); box(6000, .3, 3.3, M(0x707880, .5, .6), 0, BEAM_Y - .15, 0, run);
const NP = 40; const pillars = new THREE.InstancedMesh(new THREE.BoxGeometry(1.6, BEAM_Y - 2.2, 1.6), beamM, NP); run.add(pillars);
const NT = 220; const trees = new THREE.InstancedMesh(new THREE.ConeGeometry(2.2, 7, 8), M(0x2f5a2a, .9, 0), NT); run.add(trees); const treePos = []; { const r = rng(4); for (let i = 0; i < NT; i++) treePos.push([r() * 1600 - 800, (r() < .5 ? -1 : 1) * (14 + r() * 120), .7 + r() * .8]); }
const train = makeTrain(26, 9, 0xf2f4f6, 0x1a6ad0, 3); train.position.y = BEAM_Y + .1; run.add(train); // cuerpo a +0.35 sobre la viga
function moveScenery(x) { for (let i = 0; i < NP; i++) { const px = ((i * 40 - x) % 1600 + 1600) % 1600 - 800; dummy.position.set(px, (BEAM_Y - 2.2) / 2, 0); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); pillars.setMatrixAt(i, dummy.matrix); } pillars.instanceMatrix.needsUpdate = true;
  for (let i = 0; i < NT; i++) { const [tx, tz, s] = treePos[i]; const px = ((tx - x) % 1600 + 1600) % 1600 - 800; dummy.position.set(px, 3.5 * s, tz); dummy.scale.set(s, s, s); dummy.updateMatrix(); trees.setMatrixAt(i, dummy.matrix); } trees.instanceMatrix.needsUpdate = true; }

// ==========================================================================
// IMANES DE BARRA (N/S)
// ==========================================================================
const MG = V3(20000, 0, 0); const mg = new THREE.Group(); mg.position.copy(MG); scene.add(mg);
function barMagnet(parent) { const g = new THREE.Group(); box(4, 2, 2, M(0xd03a30, .4, .2), 2, 0, 0, g); box(4, 2, 2, M(0x3a5ad0, .4, .2), -2, 0, 0, g); parent.add(g); return g; } // +x = N (rojo), −x = S (azul)
const magA = barMagnet(mg), magB = barMagnet(mg);

// ==========================================================================
// SECCIÓN TRANSVERSAL: viga, raíl de acero, brazo que abraza, electroimán, sensor
// ==========================================================================
const XS = V3(-20000, 0, 0); const xs = new THREE.Group(); xs.position.copy(XS); scene.add(xs);
box(4, 2.2, 2.8, M(0xb8b4ac, .85, 0), 0, -1.1, 0, xs); box(4, .3, 3.6, M(0x8a9098, .4, .7), 0, -.15, 0, xs);
for (const s of [-1, 1]) box(4, .18, .5, M(0x5a6068, .35, .8), 0, -.39, s * 1.55, xs); // raíl de acero (cara inferior)
const xsT = new THREE.Group(); xs.add(xsT); // parte que se mueve con el tren
{ const bm = M(0xf2f4f6, .3, .4); box(4, 2.4, 4.2, bm, 0, 1.55, 0, xsT); box(4, .4, 4.3, M(0x1a6ad0, .3, .3), 0, 2.2, 0, xsT);
  for (const s of [-1, 1]) { box(4, 1.6, .25, bm, 0, -.2, s * 2.0, xsT); box(4, .25, .9, bm, 0, -1.05, s * 1.65, xsT); } }
const emags = [-1, 1].map(s => { const g = new THREE.Group(); g.position.set(0, -.8, s * 1.55); xsT.add(g); box(3.6, .12, .5, M(0x6a7078, .4, .7), 0, .06, 0, g); const coil = box(3.4, .22, .42, M(0xc87a40, .3, .9, 0x000000), 0, -.09, 0, g); g.userData.coil = coil; return g; });
const sensor = box(.3, .2, .3, M(0x30c060, .4, .3, 0x0a3010), -1.7, -.74, 1.55, xsT);
const REST = .26, LEV = .07; // hueco electroimán–raíl (posado / levitando)

// ==========================================================================
// ESTATOR LARGO: bobinas en la vía y onda magnética viajera
// ==========================================================================
const LS = V3(0, 0, 20000); const ls = new THREE.Group(); ls.position.copy(LS); scene.add(ls);
box(240, 1, 6, M(0x9a968e, .85, 0), 0, -.5, 0, ls); const NCOIL = 60; const coils = [];
for (let i = 0; i < NCOIL; i++) { const c = new THREE.Mesh(new THREE.TorusGeometry(1.1, .32, 10, 24), new THREE.MeshStandardMaterial({ color: 0xc87a40, roughness: .3, metalness: .9, emissive: 0x000000 })); c.rotation.x = Math.PI / 2; c.position.set(-118 + i * 4, .35, 0); ls.add(c); coils.push(c); }
const lsTrain = new THREE.Group(); ls.add(lsTrain); { const t2 = makeTrain(18, 6, 0xf2f4f6, 0x1a6ad0, 1); t2.position.y = 3.2; t2.scale.setScalar(.9); lsTrain.add(t2); }
const LAM = 16; const tMag = []; for (let k = 0; k < 6; k++) { const m = box(2.4, .5, 3, M(k % 2 ? 0x3a5ad0 : 0xd03a30, .4, .2, k % 2 ? 0x081030 : 0x300808), -2 - k * LAM / 2, 1.6, 0, lsTrain); tMag.push(m); }
// motor redondo que se desenrolla
const UR = V3(0, 0, -20000); const ur = new THREE.Group(); ur.position.copy(UR); scene.add(ur);
const NU = 28, RU = 9; const ucoils = []; for (let i = 0; i < NU; i++) { const c = new THREE.Mesh(new THREE.TorusGeometry(.9, .28, 10, 24), new THREE.MeshStandardMaterial({ color: 0xc87a40, roughness: .3, metalness: .9, emissive: 0x000000 })); ur.add(c); ucoils.push(c); }
const urRotor = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 3, 40), M(0x6a7078, .35, .7)); urRotor.rotation.x = Math.PI / 2; ur.add(urRotor);
const urTrain = makeTrain(18, 6, 0xf2f4f6, 0x1a6ad0, 1); urTrain.scale.setScalar(.8); ur.add(urTrain);

// ==========================================================================
// JAPÓN: guía en U y tren de morro larguísimo
// ==========================================================================
const JP = V3(20000, 0, 20000); const jp = new THREE.Group(); jp.position.copy(JP); scene.add(jp);
const jground = new THREE.Mesh(new THREE.PlaneGeometry(8000, 8000), M(0x5a7040, .95, 0)); jground.rotation.x = -Math.PI / 2; jp.add(jground);
box(6000, .6, 6, M(0xa8a49c, .85, 0), 0, .3, 0, jp); for (const s of [-1, 1]) box(6000, 2.6, .5, M(0xa8a49c, .85, 0), 0, 1.3, s * 3.2, jp);
const jMarks = new THREE.InstancedMesh(new THREE.BoxGeometry(.4, 2.2, .1), M(0x5a6068, .5, .4), 80); jp.add(jMarks);
const jTrain = makeTrain(24, 14, 0xf4f6f8, 0x1a50b0, 2); jTrain.position.y = 1.2; jTrain.scale.set(1, .85, .85); jp.add(jTrain);
const jTrees = new THREE.InstancedMesh(new THREE.ConeGeometry(2.4, 8, 8), M(0x2f5a2a, .9, 0), 160); jp.add(jTrees);

// ==========================================================================
// TIMELINE
// ==========================================================================
const P = new Particles(20000, { size: .5, seed: 43 }); scene.add(P.obj);
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
const L = (t, a, b) => smooth(TL[a], TL[a] + .3, t) * (b ? 1 - smooth(TL[b] - .1, TL[b] + .1, t) : 1);
function show(o) { run.visible = !!o.run; mg.visible = !!o.mg; xs.visible = !!o.xs; ls.visible = !!o.ls; ur.visible = !!o.ur; jp.visible = !!o.jp; }
function speedLines(t, c, n, spd, amp, len = 30, box3 = [300, 30, 80]) { const s = P.seed; for (let i = 0; i < n; i++) { const q = (i % P.n) * 4; const x = c.x + (fract(s[q] - t * spd) - .5) * box3[0]; const y = c.y + (s[q + 1] - .5) * box3[1], z = c.z + (s[q + 2] - .5) * box3[2];
  for (let k = 0; k < 8; k++) { const f = amp * (1 - k / 8); P.push(x + k * len / 8, y, z, f, f, f * 1.05); } } }
function fieldLines(a, b, n, col, amp, t, sd = 0, bow = .6) { const s = P.seed; for (let i = 0; i < n; i++) { const q = ((i + sd) % P.n) * 4; const u = fract(s[q] + t * .8); const off = (s[q + 1] - .5) * 2; const p = a.clone().lerp(b, u); p.z += off * bow * Math.sin(u * Math.PI); p.y += (s[q + 2] - .5) * .1; P.push(p.x, p.y, p.z, col[0] * amp, col[1] * amp, col[2] * amp); } }
function coilColor(m, ph, amp = 1) { const v = Math.sin(ph); const a = Math.abs(v) * amp; if (v > 0) m.material.emissive.setRGB(.9 * a, .12 * a, .08 * a); else m.material.emissive.setRGB(.1 * a, .25 * a, 1 * a); }

function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .05; camera.far = 9000;
  let bloomS = .6, flash = 0, ca = .0012, fade = 0, grain = .03, expo = 1.05, dim = 0;
  P.begin(); P.mat.size = .6; show({}); scene.background.copy(SKY); hemi.intensity = 1.5;
  for (const c of ['how', 'shanghai', 'close', 'sensors', 'wheels', 'unrolled', 'air', 'curious', 'brand']) flash = Math.max(flash, flashAt(t, TL[c], .28, .2));
  const hud = [];
  if (t < TL.how || (t >= TL.air && t < TL.curious)) {
    // A · 430 km/h sin tocar la vía   ·   H · el aire, su gran enemigo
    show({ run: true }); const v = 120; moveScenery(t * v); const air = t >= TL.air;
    if (!air) { const z = easeInOut(smooth(TL.notouch - .2, TL.notouch + 1, t)); camOrbit(V3(lerp(-14, -6, z), lerp(BEAM_Y + 2, BEAM_Y + .3, z), 0), lerp(lerp(42, 36, t / TL.notouch), 15, z), lerp(.75, .12, z), lerp(.1, .01, z), 38);
      speedLines(t, V3(0, BEAM_Y + 4, 0), 500, 2.2, .35, 40, [400, 30, 120]); P.mat.size = 1.2;
      const ga = smooth(TL.notouch + .3, TL.notouch + .8, t); if (ga > 0) { const s = P.seed; for (let i = 0; i < 1200; i++) { const q = (i % P.n) * 4; const x = -80 * s[q]; P.push(x, BEAM_Y + .2, (s[q + 1] - .5) * 3, GOLD[0] * ga, GOLD[1] * ga, GOLD[2] * ga); } }
      hud.push(() => { titleHUD('ESTE TREN VA A MÁS DE', '400 km/h…', smooth(.1, .4, t) * (1 - smooth(TL.notouch - .1, TL.notouch + .1, t)), 300); titleHUD('…Y NO TOCA', 'LAS VÍAS', L(t, 'notouch'), 300);
        callout(V3(-6, BEAM_Y + .2, 1.6), 60, 260, 'AIRE', 'ni una rueda', smooth(TL.notouch + .6, TL.notouch + 1, t), '#ffd070'); });
    } else { const lt = t - TL.air; camOrbit(V3(-4, BEAM_Y + 2.5, 0), lerp(42, 36, lt / 4.3), .9 - lt * .05, .1, 38); P.mat.size = .7;
      const s = P.seed; const nl = 9; for (let i = 0; i < 2600; i++) { const q = (i % P.n) * 4; const u = fract(s[q] + t * 1.8); const x = lerp(30, -40, u); const a = s[q + 1] * Math.PI * 2; const r0 = .3 + s[q + 2] * 4.2; const yc = BEAM_Y + .1 + 2.1;
        let r = r0; if (x < nl && x > -80) { const xn = clamp((nl - x) / nl, 0, 1); const nr = 1.85 * Math.sqrt(Math.max(0, 1 - (1 - xn) * (1 - xn))) + .25; r = Math.max(r0, nr + r0 * .35); }
        const y = yc + Math.sin(a) * r, z = Math.cos(a) * r; if (y < BEAM_Y) continue; const press = x > 0 && x < 6 && r0 < 1.6 ? 1.8 : 1; const f = .5 * Math.sin(u * Math.PI) * press; P.push(x, y, z, f * (press > 1 ? 1.6 : 1), f, f * (press > 1 ? .6 : 1.1)); }
      hud.push(() => { titleHUD('COMO NO ROZA CON LA VÍA,', 'SU ENEMIGO ES EL AIRE', L(t, 'air', 'nose'), 300); titleHUD('POR ESO TIENE EL MORRO', 'TAN ALARGADO', L(t, 'nose'), 300); }); }
  } else if (t < TL.shanghai) {
    // B · polos iguales se repelen; opuestos se atraen
    show({ mg: true }); scene.background.setRGB(.05, .07, .1); const lt = t - TL.how; const att = smooth(TL.attract - .2, TL.attract + .3, t);
    const gapR = lerp(5, 9, easeOut(smooth(TL.poles + .3, TL.poles + 1.2, t))); const gapA = lerp(9, 1.2, easeIn(smooth(TL.attract + .2, TL.attract + 1, t)));
    const gap = att < .5 ? gapR : gapA; magA.position.set(-2 - gap / 2, 0, 0); magA.rotation.y = 0; magB.position.set(2 + gap / 2, 0, 0); magB.rotation.y = att < .5 ? Math.PI : 0; // B: N enfrentado a N; luego S enfrentado a N
    const xa = -gap / 2, xb = gap / 2; const s = P.seed;
    for (let i = 0; i < 1400; i++) { const q = (i % P.n) * 4; const u = fract(s[q] + t * .6); const ang = (s[q + 1] - .5) * 2.6;
      if (att < .5) { for (const side of [-1, 1]) { const r = .4 + u * 6; const x = side * (.2 + Math.abs(Math.sin(ang)) * .2) + 0 * r; const y = Math.sin(ang) * r * .9, z = Math.cos(ang) * r * .3; const f = .7 * (1 - u) * smooth(TL.poles, TL.poles + .4, t); P.push(MG.x + (xa + .1) * (side < 0 ? 1 : 0) + (xb - .1) * (side > 0 ? 1 : 0) + side * -Math.cos(ang) * r * .25 * 0, MG.y + y, MG.z + z, RED[0] * f, RED[1] * f, RED[2] * f); } }
      else { const yy = Math.sin(ang) * 1.6 * Math.sin(u * Math.PI); const x = lerp(xa, xb, u); const f = .9 * smooth(TL.attract, TL.attract + .4, t); P.push(MG.x + x, MG.y + yy, MG.z + (s[q + 2] - .5) * 1.4, GOLD[0] * f, GOLD[1] * f, GOLD[2] * f); } }
    camOrbit(MG.clone(), lerp(44, 40, lt / 4.9), .25, .25, 38); P.mat.size = .45; bloomS = .9;
    hud.push(() => { titleHUD('¿CÓMO FLOTA?', 'CON IMANES', L(t, 'how', 'poles'), 300); titleHUD('POLOS IGUALES', 'SE REPELEN', L(t, 'poles', 'attract'), 300); titleHUD('POLOS OPUESTOS', 'SE ATRAEN', L(t, 'attract'), 300);
      const lab = (m, x, l, c) => { const p = project(m.localToWorld(V3(x, 1.6, 0))); txt(l, p.x, p.y - 20, 48, { weight: 800, fill: c, alpha: smooth(TL.poles - .2, TL.poles + .2, t) }); };
      lab(magA, 2, 'N', '#ff6a5a'); lab(magA, -2, 'S', '#6a9aff'); lab(magB, 2, 'N', '#ff6a5a'); lab(magB, -2, 'S', '#6a9aff'); });
  } else if (t < TL.wheels) {
    // C/D/E · sección: abraza la viga; electroimanes atraen el raíl; demasiado cerca → pegado; sensores → 1 cm
    show({ xs: true }); scene.background.setRGB(.06, .08, .12); const lt = t - TL.shanghai;
    let gap = REST; const on = smooth(TL.pull, TL.pull + .3, t);
    if (t < TL.close) gap = lerp(REST, LEV, easeInOut(smooth(TL.pull + .2, TL.pull + 1.4, t)));
    else if (t < TL.sensors) gap = lerp(LEV, 0, easeIn(smooth(TL.close + .3, TL.stuck + .3, t)));
    else { const u = t - TL.sensors; gap = LEV + .12 * Math.exp(-u * 1.1) * Math.cos(u * 7) * (t < TL.adjust ? 1 : Math.exp(-(t - TL.adjust) * 2)); }
    xsT.position.y = REST - gap; const stuck = t > TL.stuck + .2 && t < TL.sensors; if (stuck) flash = Math.max(flash, flashAt(t, TL.stuck + .3, .3, .35));
    emags.forEach(e => e.userData.coil.material.emissive.setRGB(.5 * on, .2 * on, .05 * on));
    for (const s of [-1, 1]) { const a = V3(XS.x, XS.y - .8 + REST - gap + .12, XS.z + s * 1.55), b = V3(XS.x, XS.y - .48, XS.z + s * 1.55); fieldLines(a, b, 500, stuck ? RED : GOLD, 1.2 * on, t, s > 0 ? 0 : 600, .25); }
    if (t > TL.sensors) { const s = P.seed; const sp = sensor.getWorldPosition(V3()); for (let k = 0; k < 4; k++) { const u = fract(t * 3 + k / 4); for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI; const r = u * .5; P.push(sp.x + Math.cos(a) * r, sp.y + Math.sin(a) * r, sp.z, .4 * (1 - u), 1.6 * (1 - u), .6 * (1 - u)); } } }
    const zoom = easeInOut(smooth(TL.pull + .5, TL.pull + 1.5, t)) * (1 - easeInOut(smooth(TL.adjust, TL.adjust + 1, t)));
    camOrbit(XS.clone().add(V3(0, lerp(.4, -.6, zoom), lerp(0, 1.4, zoom))), lerp(lerp(21, 19, lt / 5), 8.5, zoom), Math.PI / 2 - .12, .1, 38); P.mat.size = .06; bloomS = 1; expo = 1.2;
    hud.push(() => { titleHUD('EL TREN ABRAZA LA VÍA', 'POR DEBAJO', L(t, 'shanghai', 'pull'), 300); titleHUD('ELECTROIMANES TIRAN', 'HACIA EL RAÍL', L(t, 'pull', 'close'), 300); titleHUD('SI SE ACERCAN DEMASIADO…', '', L(t, 'close', 'stuck'), 300);
      titleHUD('', '…SE QUEDARÍAN PEGADOS', L(t, 'stuck', 'sensors'), 300); titleHUD('SENSORES MIDEN EL HUECO', 'MILES DE VECES POR SEGUNDO', L(t, 'sensors', 'adjust'), 300); titleHUD('Y AJUSTAN LA FUERZA:', 'HUECO DE 1 cm', L(t, 'adjust'), 300);
      callout(XS.clone().add(V3(0, -.4, 1.55)), 60, -300, 'RAÍL DE ACERO', null, smooth(TL.hug, TL.hug + .4, t) * (1 - smooth(TL.close - .3, TL.close, t)), '#c8c8c8');
      callout(emags[1].getWorldPosition(V3()).add(V3(0, -.1, 0)), 60, 300, 'ELECTROIMÁN', null, smooth(TL.pull, TL.pull + .4, t) * (1 - smooth(TL.close - .3, TL.close, t)));
      if (stuck) txt('¡CLAC!', W / 2, 1450, 90, { font: 'Montserrat', weight: 800, fill: '#ff6a5a', alpha: smooth(TL.stuck + .2, TL.stuck + .35, t) });
      const ga = smooth(TL.sensors + .2, TL.sensors + .6, t); if (ga > .01) { const x0 = 140, x1 = 940, y0 = 1380, hh = 220; g2.save(); g2.globalAlpha = ga; g2.fillStyle = 'rgba(0,0,0,.35)'; g2.fillRect(x0 - 20, y0 - 30, x1 - x0 + 40, hh + 70); g2.strokeStyle = 'rgba(255,255,255,.25)'; g2.lineWidth = 2; const yT = y0 + hh / 2; g2.setLineDash([10, 10]); g2.beginPath(); g2.moveTo(x0, yT); g2.lineTo(x1, yT); g2.stroke(); g2.setLineDash([]);
        g2.strokeStyle = '#7fe0a0'; g2.lineWidth = 5; g2.beginPath(); const span = t - TL.sensors; for (let i = 0; i <= 200; i++) { const u = i / 200 * span; const tt = TL.sensors + u; const gg = .12 * Math.exp(-u * 1.1) * Math.cos(u * 7) * (tt < TL.adjust ? 1 : Math.exp(-(tt - TL.adjust) * 2)); const x = x0 + (x1 - x0) * u / Math.max(span, 6.5); const y = yT - gg * 700; i ? g2.lineTo(x, y) : g2.moveTo(x, y); } g2.stroke(); g2.restore();
        txt('HUECO', x0, y0 - 6, 24, { align: 'left', spacing: 4, alpha: ga * .8 }); txt('1 cm', x1, yT - 14, 30, { align: 'right', weight: 800, alpha: ga, fill: '#7fe0a0' }); } });
  } else if (t < TL.unrolled) {
    // F · bobinas en la vía; los polos corren y arrastran el tren
    show({ ls: true }); scene.background.setRGB(.08, .1, .14); const lt = t - TL.wheels; const on = smooth(TL.seq - .3, TL.seq + .3, t); const fq = .45;
    const ph = t * fq * 6.283; coils.forEach(c => coilColor(c, c.position.x / LAM * 6.283 - ph, on)); const tx = (t - TL.seq) > 0 ? (t - TL.seq) * LAM * fq : 0; lsTrain.position.x = -10 + tx;
    tMag.forEach((m, k) => { const a = .25 + .2 * Math.sin(t * 3); m.material.emissive.setRGB(k % 2 ? .02 * a : .5 * a, .05 * a, k % 2 ? .5 * a : .02 * a); });
    if (t > TL.front) { const s = P.seed; for (const [dx, col] of [[8, GOLD], [-30, RED]]) for (let i = 0; i < 300; i++) { const q = (i % P.n) * 4; const u = fract(s[q] + t * 1.2); const x = LS.x + lsTrain.position.x + dx + (col === GOLD ? 1 - u : u) * 6 * (col === GOLD ? -1 : 1); const f = .9 * Math.sin(u * Math.PI) * smooth(TL.front, TL.front + .3, t);
      P.push(x, LS.y + 1 + (s[q + 1] - .5) * 1.6, LS.z + (s[q + 2] - .5) * 2, col[0] * f, col[1] * f, col[2] * f); } }
    camOrbit(LS.clone().add(V3(lsTrain.position.x - 8, 1, 0)), lerp(78, 64, lt / 11), -.32, .38, 38); P.mat.size = .35; bloomS = .6; expo = 1.0;
    hud.push(() => { titleHUD('¿Y SIN RUEDAS,', 'CÓMO AVANZA?', L(t, 'wheels', 'coils'), 300); titleHUD('LA VÍA ESTÁ LLENA', 'DE BOBINAS', L(t, 'coils', 'seq'), 300); titleHUD('LA CORRIENTE SALTA', 'DE UNA A OTRA', L(t, 'seq', 'run'), 300);
      titleHUD('LOS POLOS CORREN', 'A LO LARGO DE LA VÍA', L(t, 'run', 'front'), 300); titleHUD('TIRAN DEL TREN', 'HACIA DELANTE…', L(t, 'front', 'back'), 300); titleHUD('…Y LO EMPUJAN', 'DESDE ATRÁS', L(t, 'back'), 300);
      const la = smooth(TL.run, TL.run + .3, t); for (const c of coils) { const p = project(c.getWorldPosition(V3())); if (p.x < 40 || p.x > W - 40) continue; const v = Math.sin(c.position.x / LAM * 6.283 - t * .45 * 6.283); if (Math.abs(v) > .92) txt(v > 0 ? 'N' : 'S', p.x, p.y + 70, 34, { weight: 800, fill: v > 0 ? '#ff6a5a' : '#6a9aff', alpha: la }); } });
  } else if (t < TL.air) {
    // G · como un motor eléctrico desenrollado
    show({ ur: true }); scene.background.setRGB(.06, .08, .12); const lt = t - TL.unrolled; const k = easeInOut(smooth(TL.unrolled + .6, TL.unrolled + 2.4, t)); const ph = t * .45 * 6.283;
    ucoils.forEach((c, i) => { const th = i / NU * 6.283; const pc = V3(RU * Math.sin(th), RU * Math.cos(th), 0); const pl = V3((th - Math.PI) * RU * 1.1, -RU, 0); c.position.copy(pc.lerp(pl, k)); c.rotation.set(Math.PI / 2 * k, 0, -th * (1 - k)); coilColor(c, th * 2 - ph, 1); });
    urRotor.rotation.z = -t * 1.3; urRotor.scale.setScalar(1 - k * .999); urTrain.visible = k > .5; urTrain.position.set(lerp(-12, 4, smooth(TL.unrolled + 2, TL.air, t)), -RU + 2.4, 0);
    camOrbit(UR.clone().add(V3(0, lerp(0, -RU + 2, k), 0)), lerp(40, 70, k), .05, .15, 38); bloomS = 1; expo = 1.15;
    hud.push(() => { titleHUD('ES COMO UN MOTOR ELÉCTRICO', 'DESENROLLADO', L(t, 'unrolled'), 300); txt('estirado a lo largo de kilómetros', W / 2, 1500, 34, { weight: 300, alpha: smooth(TL.unrolled + 2.2, TL.unrolled + 2.6, t) }); });
  } else if (t < TL.brand) {
    // I · Japón 2015: 603 km/h; más rápido que un avión al despegar
    show({ jp: true }); const lt = t - TL.curious; const v = 167; const X = t * v; const s = P.seed;
    for (let i = 0; i < 80; i++) { const px = ((i * 25 - X) % 2000 + 2000) % 2000 - 1000; dummy.position.set(px, 1.4, 3.0); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); jMarks.setMatrixAt(i, dummy.matrix); } jMarks.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < 160; i++) { const tx = s[(i * 4) % P.n] * 2000, tz = (s[(i * 4 + 1) % P.n] < .5 ? -1 : 1) * (12 + s[(i * 4 + 2) % P.n] * 140); const px = ((tx - X) % 2000 + 2000) % 2000 - 1000; dummy.position.set(px, 4, tz); dummy.updateMatrix(); jTrees.setMatrixAt(i, dummy.matrix); } jTrees.instanceMatrix.needsUpdate = true;
    speedLines(t, JP.clone().add(V3(0, 4, 0)), 600, 3, .4, 60, [400, 20, 100]); P.mat.size = 1.1;
    const pl = smooth(TL.plane - .1, TL.plane + .4, t); dim = pl * .6;
    camOrbit(JP.clone().add(V3(-12, 3, 0)), lerp(62, 52, lt / 7.8), .6 + lt * .03, .22, 38);
    hud.push(() => { titleHUD('Y LO MÁS', 'CURIOSO', L(t, 'curious', 'japan'), 300); titleHUD('2015 · UN MAGLEV JAPONÉS', '', L(t, 'japan'), 300);
      const sp = Math.round(lerp(0, 603, easeOut(clamp((t - TL.kmh) / 1.6)))); bigStat('', sp + ' km/h', 430, L(t, 'kmh'), clamp((t - TL.kmh) / 1.5));
      if (pl > .01) { const x0 = 180, x1 = 900; g2.save(); g2.globalAlpha = pl; const bar = (y, v, c, l) => { const w = (x1 - x0) * v / 650 * smooth(TL.plane, TL.plane + 1, t); g2.fillStyle = c; g2.fillRect(x0, y, w, 46); txt(l, x0, y - 22, 28, { align: 'left', spacing: 3, weight: 700 }); txt(v + ' km/h', x0 + w + 12, y + 34, 32, { align: 'left', weight: 800 }); };
        bar(1250, 280, '#9aa4b0', 'AVIÓN AL DESPEGAR'); bar(1380, 603, '#e3a372', 'MAGLEV'); g2.restore(); } });
  } else {
    // J · marca
    show({ jp: true }); const lt = t - TL.brand; speedLines(t, JP.clone().add(V3(0, 4, 0)), 400, 3, .3, 60, [400, 20, 100]); P.mat.size = 1.1; camOrbit(JP.clone().add(V3(-10, 3, 0)), 48 + lt * 6, .8 + lt * .03, .12, 38); expo = .9; dim = smooth(0, .8, lt) * .6;
    hud.push(() => drawBrand(lt - .3)); fade = smooth(TL.end - .6, TL.end, t) * .3;
  }
  P.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (dim > 0) hud.unshift(() => { g2.save(); g2.globalAlpha = dim * .7; g2.fillStyle = '#02050b'; g2.fillRect(0, 0, W, H); g2.restore(); });
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
function renderCover() { renderFrame(1.8); coverText('¿CÓMO FLOTA', 'ESTE TREN?', 'A 430 km/h sin tocar las vías'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
