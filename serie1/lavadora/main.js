// NO LO SABÍAS — "¿Por qué tu lavadora lleva hormigón?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final. Esquema, no a escala exacta (1 unidad ≈ 1 cm).
// Lavado: aletas levantan la ropa y la dejan caer; tensioactivos (cabeza hidrófila, cola lipófila) forman micelas alrededor de la grasa.
// Centrifugado 1000–1400 rpm: a ≈ ω²r ≈ 300–550 g en un tambor de r ≈ 25 cm. Cuba suspendida en muelles + amortiguadores; contrapesos de hormigón (≈ 10–25 kg) atornillados a la cuba.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3, g2, camera, Particles, txt, copperGrad, project, callout, titleHUD, fract, camOrbit, bigStat, drawBrand, coverText, finish, noise1, arrowXY, bar, renderer } from '../../lib/core.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const scene = new THREE.Scene(); scene.background = new THREE.Color(0x070a12);
{ const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .55; }
const hemi = new THREE.HemisphereLight(0xd0dcff, 0x302830, 1.3); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0e0, 2.4); sun.position.set(60, 120, 140); scene.add(sun);
const rim = new THREE.DirectionalLight(0x8ab0ff, 1.2); rim.position.set(-80, 20, -60); scene.add(rim);
const M = (c, r = .6, m = 0, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: e });
const dummy = new THREE.Object3D();
const R = rng(77);
const canvasTex = (w, h, draw, rep) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } t.anisotropy = 8; return t; };

// ==========================================================================
// LAVADORA: mueble 60×85×55, cuba (y = 48) colgada de muelles, amortiguadores abajo
// ==========================================================================
const floor = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), M(0x151a24, .9)); floor.rotation.x = -Math.PI / 2; scene.add(floor);
const mach = new THREE.Group(); scene.add(mach);
const cabM = new THREE.MeshStandardMaterial({ color: 0xb4bcc6, roughness: .5, metalness: .05, transparent: true, side: THREE.DoubleSide });
const cab = new THREE.Mesh(new THREE.BoxGeometry(60, 85, 55), cabM); cab.position.y = 42.5 + 1.5; mach.add(cab);
const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(60, 85, 55)), new THREE.LineBasicMaterial({ color: 0x9ad0ff, transparent: true, opacity: 0 })); edges.position.copy(cab.position); mach.add(edges);
const panelM = new THREE.MeshStandardMaterial({ color: 0x2a3040, roughness: .4, metalness: .2, transparent: true });
const panel = new THREE.Mesh(new THREE.BoxGeometry(56, 9, 1.2), panelM); panel.position.set(0, 80, 28); mach.add(panel);
const knob = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 2, 32), new THREE.MeshStandardMaterial({ color: 0xc8ccd4, roughness: .3, metalness: .8, transparent: true })); knob.rotation.x = Math.PI / 2; knob.position.set(18, 80, 29); mach.add(knob);
const disp = new THREE.Mesh(new THREE.PlaneGeometry(12, 4), new THREE.MeshBasicMaterial({ color: 0x40d0ff, transparent: true })); disp.position.set(-8, 80, 28.7); mach.add(disp);
const doorM = new THREE.MeshStandardMaterial({ color: 0xc8ccd4, roughness: .25, metalness: .85, transparent: true });
const door = new THREE.Mesh(new THREE.TorusGeometry(17, 2.6, 16, 64), doorM); door.position.set(0, 48, 28.5); mach.add(door);
const glassM = new THREE.MeshPhysicalMaterial({ color: 0x8aa8c8, roughness: .05, metalness: 0, transparent: true, opacity: .25, depthWrite: false });
const glass = new THREE.Mesh(new THREE.CircleGeometry(16, 48), glassM); glass.position.set(0, 48, 28.9); mach.add(glass);
const feet = []; for (const x of [-25, 25]) for (const z of [-22, 22]) { const f = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 3, 12), M(0x303030, .7)); f.position.set(x, 1.5, z); mach.add(f); feet.push(f); }
const cabParts = [cabM, panelM, knob.material, doorM];

// --- cuba + tambor
const TUBY = 48, TR = 24, DR = 21, DL = 32;
const tubG = new THREE.Group(); tubG.position.y = TUBY; mach.add(tubG);
const tubM = new THREE.MeshStandardMaterial({ color: 0x8090a4, roughness: .5, metalness: .2, transparent: true, opacity: .45, side: THREE.DoubleSide, depthWrite: false });
const tub = new THREE.Mesh(new THREE.CylinderGeometry(TR, TR, DL + 4, 64, 1, true), tubM); tub.rotation.x = Math.PI / 2; tubG.add(tub);
const tubBack = new THREE.Mesh(new THREE.CircleGeometry(TR, 64), tubM); tubBack.position.z = -(DL + 4) / 2; tubG.add(tubBack);
const holes = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#c4cad2'; x.fillRect(0, 0, w, h); x.fillStyle = '#1a2230'; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.beginPath(); x.arc(16 + i * 32 + (j % 2) * 16, 16 + j * 32, 6, 0, 7); x.fill(); } }, [14, 4]);
const holesB = holes.clone(); holesB.repeat.set(5, 5); holesB.needsUpdate = true;
const drumM = new THREE.MeshStandardMaterial({ map: holes, roughness: .3, metalness: .85, side: THREE.DoubleSide });
const drumBM = new THREE.MeshStandardMaterial({ map: holesB, roughness: .35, metalness: .8 });
const drum = new THREE.Group(); tubG.add(drum);
const drumWall = new THREE.Mesh(new THREE.CylinderGeometry(DR, DR, DL, 64, 1, true), drumM); drumWall.rotation.x = Math.PI / 2; drum.add(drumWall);
const drumBack = new THREE.Mesh(new THREE.CircleGeometry(DR, 64), drumBM); drumBack.position.z = -DL / 2 + .1; drum.add(drumBack);
const lipM = M(0x7a828c, .55, .6); const lip = new THREE.Mesh(new THREE.TorusGeometry(DR, .8, 10, 64), lipM); lip.position.z = DL / 2; drum.add(lip);
const paddleM = new THREE.MeshStandardMaterial({ color: 0xd8dde4, roughness: .3, metalness: .7, emissive: 0x000000 });
for (let k = 0; k < 3; k++) { const a = k * Math.PI * 2 / 3; const pg = new THREE.Mesh(new THREE.BoxGeometry(5, 4, DL - 2), paddleM); pg.position.set(Math.cos(a) * (DR - 2.2), Math.sin(a) * (DR - 2.2), 0); pg.rotation.z = a + Math.PI / 2; drum.add(pg); }
// agua: segmento circular inferior
function segGeo(level) { const s = new THREE.Shape(); const a0 = Math.asin(clamp(level / (DR - .5), -1, 1)); s.moveTo(Math.cos(a0) * (DR - .5), level); s.absarc(0, 0, DR - .5, a0, Math.PI - a0, true); s.lineTo(Math.cos(a0) * (DR - .5), level);
  const g = new THREE.ExtrudeGeometry(s, { depth: DL - 1, bevelEnabled: false, curveSegments: 48 }); g.translate(0, 0, -(DL - 1) / 2); return g; }
const waterM = new THREE.MeshStandardMaterial({ color: 0x2a78c8, roughness: .1, metalness: 0, transparent: true, opacity: .5, emissive: 0x0a2040, depthWrite: false });
const waterGeos = [-11, -14, -17, -20].map(segGeo); const water = new THREE.Mesh(waterGeos[0], waterM); tubG.add(water);
// ropa: bultos deformados
const CLOTH_COLS = [0xb83a3a, 0x2a62b8, 0xc8a030, 0x389060, 0x8a8a90, 0x7a48a8, 0xc06428, 0x2a4a8a, 0xb85a88, 0x48a0a8, 0xa89a78, 0x404858];
const clothes = []; for (let i = 0; i < 12; i++) { const g = new THREE.IcosahedronGeometry(1, 2); const p = g.attributes.position; for (let j = 0; j < p.count; j++) { const v = V3(p.getX(j), p.getY(j), p.getZ(j)); const n = 1 + .28 * Math.sin(v.x * 3 + i) * Math.cos(v.y * 2.5 - i) + .15 * Math.sin(v.z * 4 + i * 2); v.multiplyScalar(n); p.setXYZ(j, v.x * 1.3, v.y * .8, v.z * 1.1); } g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: CLOTH_COLS[i], roughness: .95 })); m.scale.setScalar(3.2); m.userData = { off: i / 12 + R() * .05, z: (R() - .5) * 20, j: (R() - .5) * .8, rot: V3(R(), R(), R()) }; tubG.add(m); clothes.push(m); }
const lump = new THREE.Mesh(new THREE.SphereGeometry(6, 24, 16), new THREE.MeshStandardMaterial({ color: 0xd84a4a, roughness: .9, emissive: 0x000000 })); lump.scale.set(1.3, .8, 1.6); tubG.add(lump);
// contrapesos de hormigón (anclados a la cuba)
const conTex = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#8a8c8e'; x.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { const v = 90 + Math.floor(R() * 90); x.fillStyle = `rgba(${v},${v},${v + 4},.55)`; const r = R() * 3 + .5; x.beginPath(); x.arc(R() * w, R() * h, r, 0, 7); x.fill(); } for (let i = 0; i < 90; i++) { x.fillStyle = 'rgba(30,30,32,.6)'; x.beginPath(); x.arc(R() * w, R() * h, R() * 2.5 + .6, 0, 7); x.fill(); } }, [1, 1]);
const conM = new THREE.MeshStandardMaterial({ map: conTex, color: 0xffffff, roughness: .95, metalness: 0, emissive: 0x000000 });
const conTop = new THREE.Mesh(new THREE.BoxGeometry(34, 8, 22), conM); const CT0 = V3(0, TR + 3.5, -2); conTop.position.copy(CT0); tubG.add(conTop);
const frontShape = new THREE.Shape(); frontShape.moveTo(-26, 6); frontShape.lineTo(26, 6); frontShape.lineTo(26, 27); frontShape.lineTo(-26, 27); frontShape.lineTo(-26, 6); const hole = new THREE.Path(); hole.absarc(0, 0, 19, 0, Math.PI * 2, true); frontShape.holes.push(hole);
const conFront = new THREE.Mesh(new THREE.ExtrudeGeometry(frontShape, { depth: 6, bevelEnabled: false, curveSegments: 48 }), conM); const CF0 = V3(0, 0, DL / 2 + 2); conFront.position.copy(CF0); conFront.scale.set(1, 1, 1); tubG.add(conFront);
// recorte del bloque frontal: sólo la parte superior (y > 6)
const cfClip = new THREE.Plane(V3(0, 1, 0), 0); conM.clippingPlanes = null; renderer.localClippingEnabled = true;
const bolts = []; for (const [p, n] of [[V3(-12, TR + 7.6, -2), 0], [V3(12, TR + 7.6, -2), 0], [V3(-21, 18, DL / 2 + 8.1), 1], [V3(21, 18, DL / 2 + 8.1), 1]]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 1.2, 6), M(0xd0d4da, .25, .95)); b.position.copy(p); if (n) b.rotation.x = Math.PI / 2; tubG.add(b); bolts.push(b); }
// muelles (arriba) y amortiguadores (abajo): mallas unitarias estiradas entre extremos
const springGeo = (() => { const pts = []; for (let i = 0; i <= 400; i++) { const u = i / 400, a = u * Math.PI * 2 * 8; pts.push(V3(Math.cos(a) * 2.4, u * 18, Math.sin(a) * 2.4)); } const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 600, .45, 8); g.scale(1, 1 / 18, 1); return g; })();
const springM = new THREE.MeshStandardMaterial({ color: 0xc8ccd4, roughness: .3, metalness: .9, emissive: 0x000000 });
const damperBodyM = new THREE.MeshStandardMaterial({ color: 0x353a44, roughness: .45, metalness: .5, emissive: 0x000000 }), damperRodM = M(0xd0d4da, .2, .95);
const springs = [-1, 1].map(s => { const m = new THREE.Mesh(springGeo, springM); mach.add(m); return { m, s }; });
const dampers = [-1, 1].map(s => { const g = new THREE.Group(); const body = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 1, 16), damperBodyM); body.position.y = .3; body.scale.y = .6; const rod = new THREE.Mesh(new THREE.CylinderGeometry(.7, .7, 1, 12), damperRodM); rod.position.y = .7; rod.scale.y = .6; g.add(body, rod); mach.add(g); return { g, s }; });
const between = (obj, a, b) => { const d = b.clone().sub(a); obj.position.copy(a); obj.quaternion.setFromUnitVectors(V3(0, 1, 0), d.clone().normalize()); obj.scale.set(1, d.length(), 1); };
function updateSusp() { const tp = tubG.position;
  for (const { m, s } of springs) between(m, V3(s * 26, 82, -2), V3(tp.x + s * 16, tp.y + TR * .82, tp.z - 2));
  for (const { g, s } of dampers) between(g, V3(s * 20, 4, 0), V3(tp.x + s * 12, tp.y - TR * .85, tp.z)); }

// ==========================================================================
// MICRO: tela, mancha de grasa, moléculas de detergente (cabeza azul hidrófila + cola naranja lipófila)
// ==========================================================================
const micro = new THREE.Group(); scene.add(micro);
const fabTex = canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#1e3a66'; x.fillRect(0, 0, w, h); for (let i = 0; i < 32; i++) { for (let j = 0; j < 32; j++) { const over = (i + j) % 2; x.fillStyle = over ? '#3a64a8' : '#2c5088'; x.fillRect(i * 16 + (over ? 1 : 3), j * 16 + (over ? 3 : 1), over ? 14 : 10, over ? 10 : 14); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(i * 16, j * 16 + 14, 16, 2); } } }, [5, 5]);
const fabric = new THREE.Mesh(new THREE.PlaneGeometry(140, 140, 80, 80), new THREE.MeshStandardMaterial({ map: fabTex, roughness: .95 }));
{ const p = fabric.geometry.attributes.position; for (let j = 0; j < p.count; j++) p.setZ(j, .5 * Math.sin(p.getX(j) * .9) * Math.sin(p.getY(j) * .9)); fabric.geometry.computeVertexNormals(); }
fabric.rotation.x = -Math.PI / 2; micro.add(fabric);
const greaseM = new THREE.MeshStandardMaterial({ color: 0xc0902c, roughness: .2, metalness: .05, emissive: 0x2a1a04 });
const grease = new THREE.Mesh(new THREE.SphereGeometry(3.4, 40, 24), greaseM); micro.add(grease);
const stain = new THREE.Mesh(new THREE.CircleGeometry(5, 40), new THREE.MeshBasicMaterial({ color: 0x5a4418, transparent: true, opacity: .8, depthWrite: false })); stain.rotation.x = -Math.PI / 2; stain.position.y = .62; micro.add(stain);
const NM = 110; const headM = new THREE.MeshStandardMaterial({ color: 0x48a8ff, roughness: .3, emissive: 0x0a3060 }), tailM = new THREE.MeshStandardMaterial({ color: 0xff9a40, roughness: .45, emissive: 0x401800 });
const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(.62, 16, 12), headM, NM); const tailGeo = new THREE.CylinderGeometry(.16, .1, 2.6, 8); tailGeo.translate(0, 1.3, 0); const tails = new THREE.InstancedMesh(tailGeo, tailM, NM); micro.add(heads, tails);
const MOL = []; { const ga = Math.PI * (3 - Math.sqrt(5)); for (let i = 0; i < NM; i++) { const y = 1 - (i + .5) / NM * 2, r = Math.sqrt(1 - y * y), th = ga * i; MOL.push({ n: V3(Math.cos(th) * r, y, Math.sin(th) * r), free: V3((R() - .5) * 60, 4 + R() * 22, (R() - .5) * 40), d: V3(R() - .5, R() - .5, R() - .5).normalize(), w: V3(R() - .5, R() - .5, R() - .5), ph: R() * 6 }); } }
MOL[0].free.set(-6, 13, 8); for (let i = 1; i < NM; i++) { const d = MOL[i].free.clone().sub(V3(-5, 13, 8)); if (d.length() < 9) MOL[i].free.add(d.setLength(9 - d.length() + 2)); }
const qtmp = new THREE.Quaternion();
function setMol(i, head, dir) { dummy.position.copy(head); qtmp.setFromUnitVectors(V3(0, 1, 0), dir.clone().normalize()); dummy.quaternion.copy(qtmp); dummy.scale.setScalar(1); dummy.updateMatrix(); heads.setMatrixAt(i, dummy.matrix); tails.setMatrixAt(i, dummy.matrix); }

// ==========================================================================
// TIMELINE
// ==========================================================================
const P = new Particles(14000, { size: .5, seed: 47 }); scene.add(P.obj);
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
const L = (t, a, b) => smooth(TL[a], TL[a] + .3, t) * (b ? 1 - smooth(TL[b] - .1, TL[b] + .1, t) : 1);
const BLUE = [.5, 1.1, 2.0];
const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const inDrum = v => { door.visible = glass.visible = !v; };
function xray(a) { for (const m of cabParts) { m.opacity = 1 - a * .9; m.depthWrite = a < .5; } edges.material.opacity = a * .5; disp.material.opacity = 1 - a * .8; glassM.opacity = .25 * (1 - a); }
function tumble(t, w, level) { // ropa levantada por las aletas y soltada
  const ang = w * t; drum.rotation.z = ang; water.geometry = waterGeos[level];
  for (const c of clothes) { const u = fract(t / 1.9 + c.userData.off); const a1 = -Math.PI / 2 + 2.25; let p;
    if (u < .55) { const a = -Math.PI / 2 - .35 + (u / .55) * 2.6; p = V3(Math.cos(a) * 15.5, Math.sin(a) * 15.5, c.userData.z); }
    else { const s = (u - .55) / .45; const p1 = V3(Math.cos(a1) * 15.5, Math.sin(a1) * 15.5); const ab = -Math.PI / 2 - .5 + c.userData.j; const p2 = V3(Math.cos(ab) * 13, Math.sin(ab) * 13); p = V3(lerp(p1.x, p2.x, s), lerp(p1.y, p2.y, s * s) + 7 * s * (1 - s), c.userData.z);
      if (s > .9) { const k = (s - .9) / .1; for (let i = 0; i < 18; i++) { const q = ((c.id * 31 + i) % P.n) * 4; const sd = P.seed; P.push(p2.x + (sd[q] - .5) * 8 * k, p2.y + 2 + sd[q + 1] * 6 * k * (1 - k), c.userData.z + (sd[q + 2] - .5) * 6, BLUE[0] * (1 - k), BLUE[1] * (1 - k), BLUE[2] * (1 - k)); } } }
    c.position.copy(p); c.rotation.set(c.userData.rot.x * 6 + t * .6, c.userData.rot.y * 6 + t * .4, c.userData.rot.z * 6 + u * 3); c.scale.setScalar(3.2); c.visible = true; }
}
function spinPose(ang) { drum.rotation.z = ang; for (let i = 0; i < clothes.length; i++) { const c = clothes[i]; const a = ang + i / clothes.length * Math.PI * 2 + c.userData.j * .3; c.position.set(Math.cos(a) * (DR - 3), Math.sin(a) * (DR - 3), c.userData.z); c.rotation.set(0, 0, a); c.scale.set(3.2 * .6, 3.2 * 1.1, 3.2); c.visible = true; } }

function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .5; camera.far = 3000;
  let bloomS = .7, flash = 0, ca = .0013, fade = 0, grain = .035, expo = 1.15, dim = 0;
  P.begin(); P.mat.size = .5; inDrum(false); mach.visible = true; micro.visible = false; floor.visible = true; xray(0); tubM.opacity = .45; lump.visible = false;
  mach.position.set(0, 0, 0); mach.rotation.set(0, 0, 0); tubG.position.set(0, TUBY, 0); tubG.rotation.set(0, 0, 0); conTop.visible = conFront.visible = true; conTop.position.copy(CT0); conFront.position.copy(CF0); conTop.rotation.set(0, 0, 0); conFront.rotation.set(0, 0, 0);
  conM.emissive.setRGB(0, 0, 0); springM.emissive.setRGB(0, 0, 0); damperBodyM.emissive.setRGB(0, 0, 0); paddleM.emissive.setRGB(0, 0, 0); bolts.forEach(b => b.visible = true); water.visible = true; lump.material.emissive.setRGB(0, 0, 0);
  for (const c of ['how', 'det', 'spin', 'fly', 'concrete', 'stones', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  flash = Math.max(flash, flashAt(t, TL.bolt, .3, .35));
  const hud = [];
  if (t < TL.how) {
    // A · gancho: lavadora normal → rayos X → bloques de hormigón
    tumble(t, 1.5, 0); const xr = smooth(.7, 1.5, t); xray(xr); tubM.opacity = .45 * xr + .0;
    const g = smooth(1.2, 2.0, t); conM.emissive.setRGB(.14 * g * (.7 + .3 * Math.sin(t * 6)), .06 * g, .02 * g);
    camOrbit(V3(0, 50, 0), lerp(260, 215, easeInOut(clamp(t / TL.how))), lerp(.55, .3, easeInOut(clamp(t / TL.how))), lerp(.18, .3, clamp(t / TL.how)), 38); expo = 1.2;
    hud.push(() => { titleHUD('DENTRO DE TU LAVADORA', 'HAY HORMIGÓN', smooth(.1, .4, t) * (1 - smooth(TL.kilos - .1, TL.kilos + .1, t)), 300); titleHUD('BLOQUES DE', 'VARIOS KILOS', L(t, 'kilos', 'why'), 300);
      const a = smooth(TL.kilos + .2, TL.kilos + .5, t) * (1 - smooth(TL.how - .2, TL.how, t)); callout(conTop.getWorldPosition(V3()).add(V3(-10, 4, 0)), -120, -150, 'HORMIGÓN', '5–15 kg', a); callout(conFront.getWorldPosition(V3()).add(V3(18, 20, 6)), 110, 160, 'HORMIGÓN', '5–15 kg', a);
      bigStat('', '¿PARA QUÉ?', 1560, L(t, 'why', 'how'), clamp((t - TL.why) / .8)); });
  } else if (t < TL.det) {
    // B · lavado: el tambor gira despacio, las aletas levantan la ropa y la dejan caer
    const lt = t - TL.how; xray(1); inDrum(true); tumble(t, 1.5, 0); tubM.opacity = .12; conTop.visible = conFront.visible = false; bolts.forEach(b => b.visible = false);
    const pg = smooth(TL.paddles, TL.paddles + .4, t) * (1 - smooth(TL.fall + .2, TL.fall + .6, t)); paddleM.emissive.setRGB(.6 * pg, .3 * pg, .1 * pg);
    camOrbit(V3(0, TUBY - 1, 0), lerp(140, 128, clamp(lt / 5)), .06 * Math.sin(lt * .4), .06, 38); bloomS = .8; hemi.intensity = 1.5;
    hud.push(() => { titleHUD('PRIMERO,', '¿CÓMO LAVA?', L(t, 'how', 'drum'), 300); titleHUD('EL TAMBOR GIRA', 'DESPACIO', L(t, 'drum', 'paddles'), 300); titleHUD('UNAS ALETAS LEVANTAN LA ROPA', 'Y LA DEJAN CAER', L(t, 'paddles', 'again'), 300);
      titleHUD('UNA Y OTRA', 'VEZ', L(t, 'again', 'hand'), 300); titleHUD('COMO FROTARLA A MANO…', '…MILES DE VECES', L(t, 'hand'), 300);
      callout(drum.localToWorld(V3(Math.cos(Math.PI * 2 / 3 * 0) * (DR - 2.2), Math.sin(0) * (DR - 2.2), DL / 2)), 140, -120, 'ALETA', null, pg);
      const ca2 = smooth(TL.thousands, TL.thousands + .4, t); if (ca2 > .01) { const n = Math.floor(lerp(1, 2400, easeOut(clamp((t - TL.thousands) / 1.3)))); bigStat('GOLPES POR LAVADO', '×' + fmt(n), 1580, ca2, .5); } });
  } else if (t < TL.spin) {
    // C · detergente: molécula con cabeza que agarra agua y cola que agarra grasa; micela
    mach.visible = false; micro.visible = true; floor.visible = false; const lt = t - TL.det;
    const sur = (i) => easeInOut(smooth(TL.surround - .3 + (i % 23) * .025, TL.surround + .9 + (i % 23) * .025, t));
    const lift = easeInOut(smooth(TL.lift, TL.lift + 1.3, t)); const fl = Math.max(0, t - TL.float);
    const C = V3(fl * 1.6, lerp(2.6, 11, lift) + Math.sin(fl * 2) * .4 * lift, 0); grease.position.copy(C); grease.scale.set(lerp(1.35, 1, lift), lerp(.62, 1, lift), lerp(1.35, 1, lift)); stain.material.opacity = .8 * (1 - smooth(TL.lift + .2, TL.lift + 1.2, t));
    for (let i = 0; i < NM; i++) { const m = MOL[i]; const k = sur(i);
      const ft = t * .6 + m.ph; const fp = m.free.clone().add(V3(Math.sin(ft) * 1.5, Math.sin(ft * 1.3) * 1.0, Math.cos(ft * .8) * 1.5)); const fd = V3(Math.sin(ft + m.w.x * 5), Math.cos(ft * .7 + m.w.y * 5), Math.sin(ft * .5 + m.w.z * 5)).normalize();
      if (i === 0 && t < TL.surround + .2) { fp.set(-6, 13, 8); fd.set(1, 0, 0); }
      let n = m.n.clone(); if (n.y < -.25 && lift < 1) { const fl2 = V3(n.x, 0, n.z).normalize(); n.lerp(V3(fl2.x * .9, -.25, fl2.z * .9), 1 - lift).normalize(); }
      const rr = 3.4 * grease.scale.x * .5 + 3.4 * .5 + 2.7; const tp = C.clone().add(n.clone().multiply(V3(rr * grease.scale.x * .8 + .8, rr * grease.scale.y * 1.1 + .6, rr * grease.scale.z * .8 + .8)));
      const td = n.clone().negate(); setMol(i, fp.lerp(tp, k), fd.lerp(td, k)); }
    heads.instanceMatrix.needsUpdate = true; tails.instanceMatrix.needsUpdate = true;
    // agua alrededor de la cabeza destacada
    const wa = smooth(TL.water, TL.water + .4, t) * (1 - smooth(TL.surround - .1, TL.surround + .3, t)); if (wa > .01) { const s = P.seed; for (let i = 0; i < 60; i++) { const q = i * 4; const a = s[q] * 6.28, b = s[q + 1] * 3.14, r = 1.4 + s[q + 2] * .8 + .1 * Math.sin(t * 4 + i); P.push(-6 + Math.cos(a) * Math.sin(b) * r - .3, 13 + Math.cos(b) * r, 8 + Math.sin(a) * Math.sin(b) * r, BLUE[0] * wa, BLUE[1] * wa, BLUE[2] * wa); } }
    const gpos = V3(-6 + 2.6 + 1.2, 13, 8); const ga = smooth(TL.grease, TL.grease + .4, t) * (1 - smooth(TL.surround - .1, TL.surround + .3, t));
    tailM.emissive.setRGB(.1 + .45 * ga, .04 + .18 * ga, 0); headM.emissive.setRGB(.01, .06 + .25 * wa, .14 + .4 * wa);
    const z = easeInOut(smooth(TL.mol - .2, TL.mol + .8, t)) * (1 - easeInOut(smooth(TL.surround - .4, TL.surround + .8, t)));
    const base = V3(C.x * .7, lerp(6, 8, lift), 0); camOrbit(base.clone().lerp(V3(-4.7, 13, 8), z), lerp(lerp(70, 52, clamp(lt / 6)), 19, z), lerp(.2 + lt * .03, .05, z), lerp(lerp(.75, .4, clamp(lt / 3)), .12, z), 38);
    sun.intensity = 2.4; bloomS = .55;
    hud.push(() => { titleHUD('EL DETERGENTE', 'HACE EL RESTO', L(t, 'det', 'mol'), 300); titleHUD('SUS MOLÉCULAS TIENEN', 'DOS PUNTAS', L(t, 'mol', 'surround'), 300);
      callout(V3(-6, 13.6, 8), 40, -240, 'SE AGARRA AL AGUA', null, wa, '#7ab8ff'); callout(gpos, 110, 170, 'SE AGARRA A LA GRASA', null, ga, '#ffa060');
      titleHUD('RODEAN CADA', 'MANCHA', L(t, 'surround', 'lift'), 300); titleHUD('LA DESPEGAN', 'DE LA TELA', L(t, 'lift', 'float'), 300); titleHUD('Y LA DEJAN FLOTANDO', 'EN EL AGUA', L(t, 'float'), 300);
      callout(grease.getWorldPosition(V3()), 150, 260, 'GRASA', null, smooth(TL.surround + .8, TL.surround + 1.1, t) * (1 - smooth(TL.spin - .3, TL.spin, t)), '#e3a372'); });
  } else if (t < TL.fly) {
    // D · centrifugado: >1000 rpm, la ropa pegada a la pared, el agua sale por los agujeros
    const lt = t - TL.spin; xray(1); inDrum(true); tubM.opacity = .2; conTop.visible = conFront.visible = false; bolts.forEach(b => b.visible = false);
    const w0 = 1.5, wmax = 13; const ramp = (x) => clamp((x - TL.accel) / 3.2); const r = ramp(t); const ang = w0 * t + (t > TL.accel ? (wmax - w0) * (3.2 * (r * r * r / 3) * 1 + Math.max(0, t - TL.accel - 3.2)) : 0);
    if (t < TL.accel) tumble(t, 1.5, 0); else spinPose(ang);
    const lvl = Math.min(3, Math.floor(smooth(TL.accel, TL.out + .5, t) * 4)); water.geometry = waterGeos[lvl]; water.visible = t < TL.out + .8;
    const sp = smooth(TL.accel + 1, TL.rpm + 1, t) * (1 - smooth(TL.fly - .4, TL.fly, t)) * (t > TL.out ? 1.4 : .8); const s = P.seed;
    for (let i = 0; i < 2600 * sp; i++) { const q = (i % P.n) * 4; const age = fract(t * 1.8 + s[q + 3]); const a = s[q] * 6.283 + ang * .2; const rr = DR + age * 3.2; const f = (1 - age) * sp; P.push(Math.cos(a) * rr, TUBY + Math.sin(a) * rr, (s[q + 1] - .5) * DL, BLUE[0] * f, BLUE[1] * f, BLUE[2] * f); }
    if (t > TL.wall) { const wa = smooth(TL.wall, TL.wall + .5, t); for (let i = 0; i < clothes.length; i++) clothes[i].material.emissive.setRGB(.15 * wa, .08 * wa, .02 * wa); }
    const shk = sp * .25; camOrbit(V3(Math.sin(t * 37) * shk, TUBY - 1 + Math.cos(t * 41) * shk, 0), lerp(138, 126, clamp(lt / 7)), -.05 - lt * .01, .05, 38); bloomS = .9; ca = .0013 + sp * .001;
    hud.push(() => { titleHUD('LUEGO VIENE EL', 'CENTRIFUGADO', L(t, 'spin', 'accel'), 300); titleHUD('EL TAMBOR', 'ACELERA', L(t, 'accel', 'rpm'), 300);
      const ra = smooth(TL.accel + .2, TL.accel + .5, t) * (1 - smooth(TL.wall - .2, TL.wall, t)); bigStat('VUELTAS POR MINUTO', fmt(Math.round(lerp(50, 1200, easeInOut(clamp((t - TL.accel) / 3.4))))), 1580, ra, .5);
      titleHUD('LA ROPA SE PEGA', 'A LA PARED', L(t, 'wall', 'force'), 300); titleHUD('CON UNA FUERZA', 'CIENTOS DE VECES SU PESO', L(t, 'force', 'out'), 300); bigStat('FUERZA', '×300', 1580, L(t, 'force', 'out'), clamp((t - TL.force) / 1));
      titleHUD('Y EL AGUA SALE DISPARADA', 'POR LOS AGUJEROS', L(t, 'out'), 300); });
  } else if (t < TL.concrete) {
    // E · ¿por qué no sale volando? cuba colgada de muelles y amortiguadores; ropa mal repartida → desequilibrio
    const lt = t - TL.fly; const hop = t < TL.hang ? Math.abs(Math.sin(lt * 9)) * 5 * (1 - smooth(TL.hang - .5, TL.hang, t)) * smooth(TL.fly, TL.fly + .3, t) : 0;
    const xr = smooth(TL.hang - .2, TL.hang + .4, t); xray(xr); tubM.opacity = .35; conTop.visible = conFront.visible = false; bolts.forEach(b => b.visible = false); water.visible = false;
    mach.position.set(Math.sin(lt * 23) * hop * .5, hop, 0); mach.rotation.z = Math.sin(lt * 17) * hop * .012;
    const un = smooth(TL.uneven, TL.uneven + .6, t); const ang = 2 * t + 10 * Math.max(0, t - TL.unbal) ** 1.3;
    if (t < TL.uneven) spinPose(t * 6); else { clothes.forEach(c => c.visible = false); lump.visible = true; lump.position.set(Math.cos(ang) * (DR - 5), Math.sin(ang) * (DR - 5), 0); lump.rotation.z = ang; drum.rotation.z = ang; lump.material.emissive.setRGB(.5 * un, .05 * un, .02 * un); }
    const amp = 4.5 * smooth(TL.unbal, TL.shake, t); tubG.position.set(Math.cos(ang) * amp, TUBY + Math.sin(ang) * amp, 0);
    if (t > TL.shake) { const sh = smooth(TL.shake, TL.shake + .3, t) * 1.6; mach.position.x += Math.sin(t * 31) * sh; mach.position.y += Math.abs(Math.sin(t * 27)) * sh; mach.rotation.z += Math.sin(t * 19) * sh * .01; }
    const sg = smooth(TL.hang + .2, TL.hang + .6, t) * (1 - smooth(TL.uneven - .2, TL.uneven, t)); springM.emissive.setRGB(.22 * sg, .1 * sg, .03 * sg); const dg = smooth(TL.damp, TL.damp + .4, t) * (1 - smooth(TL.uneven - .2, TL.uneven, t)); damperBodyM.emissive.setRGB(.4 * dg, .18 * dg, .05 * dg);
    camOrbit(V3(0, 46, 0), lerp(265, 235, clamp(lt / 9)), lerp(.5, .3, clamp(lt / 9)), .16, 38); bloomS = .8;
    hud.push(() => { titleHUD('¿Y POR QUÉ NO SALE', 'VOLANDO POR LA COCINA?', L(t, 'fly', 'hang'), 300); titleHUD('EL TAMBOR CUELGA', 'DE MUELLES…', L(t, 'hang', 'damp'), 300); titleHUD('…Y AMORTIGUADORES', 'COMO UN COCHE', L(t, 'damp', 'uneven'), 300);
      callout(springs[1].m.localToWorld(V3(0, .5, 0)), 40, -170, 'MUELLE', null, sg, '#ffb070'); callout(dampers[0].g.localToWorld(V3(0, .4, 0)), -130, 150, 'AMORTIGUADOR', null, dg, '#ffb070');
      titleHUD('PERO LA ROPA NUNCA', 'QUEDA BIEN REPARTIDA', L(t, 'uneven', 'unbal'), 300); titleHUD('DESEQUILIBRADO A ESA VELOCIDAD…', '…LO ZARANDEARÍA TODO', L(t, 'unbal'), 300);
      bar(W / 2 - 300, 1600, 600, amp / 4.5, 'VIBRACIÓN', amp > 3 ? 'ENORME' : '', smooth(TL.unbal, TL.unbal + .4, t), '#ff6a4a'); });
  } else if (t < TL.brand) {
    // F · hormigón atornillado a la cuba: mucha más masa → el desequilibrio apenas la mueve
    const lt = t - TL.concrete; xray(1); tubM.opacity = .35; water.visible = false; clothes.forEach(c => c.visible = false); lump.visible = true;
    const ang = 2 * t + 10 * (t - TL.unbal) ** 1.3; lump.position.set(Math.cos(ang) * (DR - 5), Math.sin(ang) * (DR - 5), 0); lump.rotation.z = ang; drum.rotation.z = ang;
    const inT = easeOut(smooth(TL.concrete + .1, TL.concrete + .8, t)), inF = easeOut(smooth(TL.bolt - .4, TL.bolt + .2, t));
    conTop.position.copy(CT0).add(V3(0, (1 - inT) * 90, 0)); conTop.rotation.z = (1 - inT) * .6; conFront.position.copy(CF0).add(V3(0, 0, (1 - inF) * 120)); conFront.rotation.y = (1 - inF) * .4;
    bolts.forEach((b, i) => b.visible = t > TL.bolt + .1 + i * .12);
    const cg = smooth(TL.concrete, TL.concrete + .5, t) * (1 - smooth(TL.stones + 1.4, TL.stones + 2.4, t)); conM.emissive.setRGB(.12 * cg, .05 * cg, .015 * cg);
    const amp = 4.5 * (1 - .85 * smooth(TL.extra, TL.barely, t)) * (t > TL.stones ? lerp(1, .6, smooth(TL.stones, TL.stones + 1, t)) : 1); tubG.position.set(Math.cos(ang) * amp, TUBY + Math.sin(ang) * amp, 0);
    const shk = 1 - smooth(TL.concrete, TL.extra + .5, t); mach.position.set(Math.sin(t * 31) * shk * 1.2, Math.abs(Math.sin(t * 27)) * shk * 1.2, 0);
    const z = easeInOut(smooth(TL.stones - .2, TL.stones + 1.2, t)); camOrbit(V3(0, lerp(48, 60, z), lerp(0, 8, z)), lerp(lerp(235, 215, clamp(lt / 5)), 140, z), lerp(.4 - lt * .02, .55, z), lerp(.18, .32, z), 38); bloomS = .8;
    hud.push(() => { titleHUD('POR ESO LLEVA HORMIGÓN', 'ATORNILLADO AL TAMBOR', L(t, 'concrete', 'extra'), 300); titleHUD('CON TANTO PESO EXTRA…', '', L(t, 'extra', 'barely'), 300); titleHUD('…EL DESEQUILIBRIO', 'APENAS LO MUEVE', L(t, 'barely', 'stones'), 300);
      callout(conTop.getWorldPosition(V3()).add(V3(-12, 4, 0)), -130, -140, 'HORMIGÓN', null, smooth(TL.concrete + .8, TL.concrete + 1.1, t) * (1 - smooth(TL.stones - .2, TL.stones, t)), '#e3a372');
      bar(W / 2 - 300, 1600, 600, amp / 4.5, 'VIBRACIÓN', amp < 1.5 ? 'MÍNIMA' : '', (1 - smooth(TL.stones - .3, TL.stones, t)), amp < 1.5 ? '#6ad08a' : '#ff6a4a');
      titleHUD('SÍ: TU LAVADORA', 'LLEVA PIEDRAS DENTRO', L(t, 'stones'), 300); bigStat('DE HORMIGÓN', '≈ 25 kg', 1580, L(t, 'stones'), clamp((t - TL.stones) / 1.2)); });
  } else {
    // G · marca
    const lt = t - TL.brand; xray(1); tubM.opacity = .35; tumble(t, 1.5, 0); conM.emissive.setRGB(.08, .035, .01); camOrbit(V3(0, 46, 0), 240 + lt * 6, .4 + lt * .05, .22, 38); dim = smooth(0, .8, lt) * .6; expo = 1.05;
    hud.push(() => drawBrand(lt - .3)); fade = smooth(TL.end - .6, TL.end, t) * .3;
  }
  updateSusp(); hemi.intensity = t >= TL.how && t < TL.det ? 1.5 : 1.3; if (!(t >= TL.det && t < TL.spin)) sun.intensity = 2.4;
  if (!(t >= TL.spin && t < TL.fly)) clothes.forEach(c => c.material.emissive.setRGB(0, 0, 0));
  if (COVER) camOrbit(V3(0, 72, 0), 245, .42, .1, 38);
  P.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (dim > 0) hud.unshift(() => { g2.save(); g2.globalAlpha = dim * .7; g2.fillStyle = '#02050b'; g2.fillRect(0, 0, W, H); g2.restore(); });
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
let COVER = false;
function renderCover() { COVER = true; renderFrame(TL.bolt + 1.0); coverText('TU LAVADORA', 'LLEVA PIEDRAS', 'La lavadora, por dentro'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
