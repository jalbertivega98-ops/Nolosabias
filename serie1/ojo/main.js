// NO LO SABÍAS — "¿Cómo funciona el ojo humano?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final. Esquema, no a escala exacta (ojo ≈ 24 mm; 1 unidad ≈ 1 mm).
// Córnea ≈ 2/3 de la potencia óptica; cristalino acomoda (músculo ciliar); retina: ~120 M bastones + ~6 M conos (S, M, L);
// la imagen retiniana está invertida; punto ciego en la papila óptica; experimento de las gafas inversoras de George M. Stratton (1896–1897).
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3, g2, camera, Particles, txt, copperGrad, project, callout, titleHUD, fract, camOrbit, bigStat, drawBrand, coverText, finish, noise1, renderer } from '../../lib/core.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

renderer.localClippingEnabled = true;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x04060b);
{ const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .4; }
const hemi = new THREE.HemisphereLight(0xc8d8ff, 0x302830, 1.4); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2e6, 2.6); sun.position.set(60, 80, 90); scene.add(sun);
const rim = new THREE.DirectionalLight(0x8ab0ff, 1.4); rim.position.set(-80, 20, -60); scene.add(rim);
const M = (c, r = .6, m = 0, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: e });
const box = (w, h, d, mat, x = 0, y = 0, z = 0, parent = scene) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; };
const dummy = new THREE.Object3D();
const WARM = [1.9, 1.6, 1.0], BLUE = [.4, .8, 1.8], ORANGE = [1.8, .9, .3];

// ==========================================================================
// OJO (frente hacia +x). Plano de corte z = 0 para las vistas en sección.
// ==========================================================================
const clipZ = new THREE.Plane(V3(0, 0, -1), 0); const eyeMats = [];
const EM = (o) => { const m = new THREE.MeshStandardMaterial(Object.assign({ side: THREE.DoubleSide }, o)); eyeMats.push(m); return m; };
let cutState = null; function setCut(on) { if (cutState === on) return; cutState = on; eyeMats.forEach(m => { m.clippingPlanes = on ? [clipZ] : []; m.needsUpdate = true; }); }
const eye = new THREE.Group(); scene.add(eye);
const irisTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); const r = rng(7);
  const g = x.createRadialGradient(256, 256, 30, 256, 256, 256); g.addColorStop(0, '#2a1a10'); g.addColorStop(.25, '#7a4a1c'); g.addColorStop(.5, '#3f7a6a'); g.addColorStop(.85, '#2c5a68'); g.addColorStop(.97, '#0c1418'); g.addColorStop(1, '#0c1418'); x.fillStyle = g; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) { const a = r() * 6.283, r0 = 40 + r() * 60, r1 = r0 + 60 + r() * 150; x.strokeStyle = `rgba(${200 + r() * 55 | 0},${170 + r() * 80 | 0},${120 + r() * 80 | 0},${.08 + r() * .14})`; x.lineWidth = .6 + r() * 1.6; x.beginPath(); x.moveTo(256 + Math.cos(a) * r0, 256 + Math.sin(a) * r0); x.lineTo(256 + Math.cos(a + (r() - .5) * .08) * r1, 256 + Math.sin(a + (r() - .5) * .08) * r1); x.stroke(); }
  x.strokeStyle = 'rgba(230,170,90,.5)'; x.lineWidth = 6; x.beginPath(); for (let i = 0; i <= 64; i++) { const a = i / 64 * 6.283, rr = 95 + 10 * Math.sin(a * 9); i ? x.lineTo(256 + Math.cos(a) * rr, 256 + Math.sin(a) * rr) : x.moveTo(256 + Math.cos(a) * rr, 256 + Math.sin(a) * rr); } x.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const scleraTex = (() => { const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const x = c.getContext('2d'); x.fillStyle = '#f2ece6'; x.fillRect(0, 0, 1024, 512); const r = rng(3);
  for (let i = 0; i < 40; i++) { let px = r() * 1024, py = 200 + r() * 112; x.strokeStyle = `rgba(190,60,60,${.15 + r() * .25})`; x.lineWidth = .6 + r() * 1.4; x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 8; k++) { px += (r() - .5) * 30; py += (r() - .5) * 26; x.lineTo(px, py); } x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const scleraM = EM({ color: 0xd8d0c8, map: scleraTex, roughness: .45, transparent: true });
const scGeo = new THREE.SphereGeometry(12, 96, 64, 0, Math.PI * 2, .6, Math.PI - .6); scGeo.rotateZ(-Math.PI / 2); const sclera = new THREE.Mesh(scGeo, scleraM); eye.add(sclera);
const retGeo = new THREE.SphereGeometry(11.6, 96, 48, 0, Math.PI * 2, 0, 2.15); retGeo.rotateZ(Math.PI / 2);
const retM = EM({ color: 0xd2563c, roughness: .55, emissive: 0x200604 }); const retina = new THREE.Mesh(retGeo, retM); eye.add(retina);
const corGeo = new THREE.SphereGeometry(7.6, 64, 24, 0, Math.PI * 2, 0, .95); corGeo.rotateZ(-Math.PI / 2);
const corM = EM({ color: 0xcfe8ff, roughness: .04, metalness: .1, transparent: true, opacity: .22, depthWrite: false }); const cornea = new THREE.Mesh(corGeo, corM); cornea.position.x = 5.6; eye.add(cornea);
const irisM = EM({ map: irisTex, roughness: .55, side: THREE.FrontSide }); const iris = new THREE.Mesh(new THREE.CircleGeometry(6.3, 96), irisM); iris.rotation.y = Math.PI / 2; iris.position.x = 9.7; eye.add(iris);
const pupilM = new THREE.MeshBasicMaterial({ color: 0x010101 }); const pupil = new THREE.Mesh(new THREE.CircleGeometry(1, 64), pupilM); pupil.rotation.y = Math.PI / 2; pupil.position.x = 9.74; eye.add(pupil);
const flaps = new THREE.Group(); eye.add(flaps); const flapM = M(0x5a4a2a, .6, 0); const flapT = box(.5, 1, .3, flapM, 9.6, 0, 0, flaps), flapB = box(.5, 1, .3, flapM, 9.6, 0, 0, flaps);
function setPupil(r) { pupil.scale.setScalar(r); const h = 6.1 - r; flapT.scale.y = h; flapT.position.y = r + h / 2; flapB.scale.y = h; flapB.position.y = -(r + h / 2); }
const lensM = EM({ color: 0xf0e2b0, roughness: .15, transparent: true, opacity: .5, depthWrite: false, emissive: 0x201808 }); const lens = new THREE.Mesh(new THREE.SphereGeometry(4.6, 64, 32), lensM); lens.position.x = 7.0; eye.add(lens);
const ciliM = EM({ color: 0xb04a40, roughness: .6 }); const cili = new THREE.Mesh(new THREE.TorusGeometry(5.6, .7, 16, 64), ciliM); cili.rotation.y = Math.PI / 2; cili.position.x = 7.0; eye.add(cili);
const nerveM = EM({ color: 0x9a7a62, roughness: .85 }); const nerve = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.9, 18, 32), nerveM); nerve.rotation.z = Math.PI / 2; nerve.position.set(-19.5, -2.6, 0); eye.add(nerve);
const disc = new THREE.Mesh(new THREE.CircleGeometry(1.6, 32), new THREE.MeshBasicMaterial({ color: 0x0a0a0a, transparent: true, opacity: 0 })); disc.position.set(-11.0, -2.6, 0); disc.rotation.y = Math.PI / 2; eye.add(disc);
const NERVE_HEAD = V3(-11.4, -2.6, 0);
// árbol (objeto) y su imagen invertida en la retina
const treeTex = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#8a5a30'; x.fillRect(56, 80, 16, 44); x.fillStyle = '#4ad070'; x.beginPath(); x.moveTo(64, 6); x.lineTo(112, 92); x.lineTo(16, 92); x.fill(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const OBJ = V3(70, 0, 0); const tree = new THREE.Group(); tree.position.copy(OBJ); scene.add(tree);
{ const tr = new THREE.Mesh(new THREE.CylinderGeometry(.8, 1, 5, 12), M(0x7a5030, .8)); tr.position.y = -3.5; tree.add(tr); const cn = new THREE.Mesh(new THREE.ConeGeometry(4.2, 8, 24), M(0x3aa860, .7, 0, 0x08200c)); cn.position.y = 2.5; tree.add(cn); }
const img = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6), new THREE.MeshBasicMaterial({ map: treeTex, transparent: true, depthWrite: false, opacity: 0, side: THREE.DoubleSide })); img.position.set(-8.6, .2, .3); img.rotation.z = Math.PI; img.scale.setScalar(1.1); eye.add(img);
// trayectorias de los rayos: punta del árbol → abajo en la retina, base → arriba
const RAYS = [[V3(70, 6.5, 0), V3(13.1, 2.2, 0), V3(7, 1.2, 0), V3(-11.2, -1.9, 0)], [V3(70, -6, 0), V3(13.1, -2.1, 0), V3(7, -1.1, 0), V3(-11.2, 2.4, 0)], [V3(70, .3, 0), V3(13.3, .1, 0), V3(7, .05, 0), V3(-11.2, -.1, 0)]];
const rayLen = RAYS.map(r => { let L = 0; for (let i = 1; i < r.length; i++) L += r[i].distanceTo(r[i - 1]); return L; });
const rayLines = RAYS.map(r => { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(r), new THREE.LineBasicMaterial({ color: 0xffd890, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); scene.add(l); return l; });
function rayPt(k, u) { const r = RAYS[k]; let d = u * rayLen[k]; for (let i = 1; i < r.length; i++) { const l = r[i].distanceTo(r[i - 1]); if (d <= l) return r[i - 1].clone().lerp(r[i], d / l); d -= l; } return r[r.length - 1].clone(); }

// ==========================================================================
// RETINA AL MICROSCOPIO: bastones y conos (escala libre)
// ==========================================================================
const CL = V3(0, 0, 5000); const cl = new THREE.Group(); cl.position.copy(CL); scene.add(cl);
const CONE_COLS = [[1, .25, .2], [.3, 1, .35], [.3, .5, 1]]; const cells = []; { const r = rng(21); for (let i = 0; i < 16; i++) for (let j = 0; j < 10; j++) { const cone = r() < .22; const ci = Math.floor(r() * 3); cells.push({ x: (i - 7.5) * 1.25 + (r() - .5) * .3, z: (j - 4.5) * 1.25 + (r() - .5) * .3, cone, ci, col: cone ? CONE_COLS[ci] : null, ph: r() }); } }
const rodM = new THREE.MeshStandardMaterial({ roughness: .5, emissive: 0xffffff, emissiveIntensity: 1 }); const coneM = new THREE.MeshBasicMaterial({ color: 0xffffff });
const rodsI = new THREE.InstancedMesh(new THREE.CapsuleGeometry(.3, 6, 6, 12), rodM, cells.filter(c => !c.cone).length); const conesI = new THREE.InstancedMesh(new THREE.ConeGeometry(.6, 5.2, 20), coneM, cells.filter(c => c.cone).length); cl.add(rodsI, conesI);
{ let a = 0, b = 0; for (const c of cells) { dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); if (c.cone) { dummy.position.set(c.x, 2.6, c.z); dummy.updateMatrix(); conesI.setMatrixAt(b, dummy.matrix); c.idx = b++; } else { dummy.position.set(c.x, 3.3, c.z); dummy.updateMatrix(); rodsI.setMatrixAt(a, dummy.matrix); c.idx = a++; } }
  const base = new THREE.Mesh(new THREE.BoxGeometry(24, .8, 16), M(0x6a2a24, .7)); base.position.y = -.6; cl.add(base); const fib = new THREE.Mesh(new THREE.BoxGeometry(24, .3, 16), M(0xe0c0a0, .6)); fib.position.y = -1.4; cl.add(fib); }
function cellColors(rodsLit, coneLit, which) { const c0 = new THREE.Color(); for (const c of cells) { if (c.cone) { const on = coneLit * (which < 0 || c.col === undefined ? 1 : 1); let k = on; if (which >= 0) k = on * (c.col === [[1, .25, .2], [.3, 1, .35], [.3, .5, 1]][which] ? 1 : .15); c0.setRGB(.12 + c.col[0] * k * .9, .12 + c.col[1] * k * .9, .12 + c.col[2] * k * .9); conesI.setColorAt(c.idx, c0); } else { const k = .1 + rodsLit * .7 * (.7 + .3 * Math.sin(c.ph * 9)); c0.setRGB(k * .8, k * .85, k); rodsI.setColorAt(c.idx, c0); } }
  rodsI.instanceColor.needsUpdate = true; conesI.instanceColor.needsUpdate = true; }

function lightCells(rodsLit, coneLit, which) { const c0 = new THREE.Color(); for (const c of cells) { if (c.cone) { const k = coneLit * (which < 0 || c.ci === which ? 1 : .12); c0.setRGB(.08 + c.col[0] * k * 1.2, .08 + c.col[1] * k * 1.2, .08 + c.col[2] * k * 1.2); conesI.setColorAt(c.idx, c0); } else { const k = .08 + rodsLit * .5 * (.75 + .25 * Math.sin(c.ph * 9)); c0.setRGB(k * .8, k * .85, k); rodsI.setColorAt(c.idx, c0); } } rodsI.instanceColor.needsUpdate = true; conesI.instanceColor.needsUpdate = true; }
rodM.emissiveIntensity = 0;

// ==========================================================================
// MUNDO DE LAS GAFAS (1896): paisaje visto boca abajo
// ==========================================================================
const GW = V3(0, 0, -5000); const gw = new THREE.Group(); gw.position.copy(GW); scene.add(gw);
{ const gr = new THREE.Mesh(new THREE.CircleGeometry(600, 64), M(0x4a7a3a, .95)); gr.rotation.x = -Math.PI / 2; gw.add(gr); const path = new THREE.Mesh(new THREE.PlaneGeometry(4, 600), M(0xb09a78, .9)); path.rotation.x = -Math.PI / 2; path.position.set(0, .02, -300); gw.add(path);
  const r = rng(9); for (let i = 0; i < 40; i++) { const x = (r() < .5 ? -1 : 1) * (5 + r() * 40), z = -10 - r() * 160; const s = .8 + r() * .9; const t = new THREE.Group(); t.position.set(x, 0, z); t.scale.setScalar(s); gw.add(t);
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(.3, .4, 3, 8), M(0x6a4428, .8)); tr.position.y = 1.5; t.add(tr); const cn = new THREE.Mesh(new THREE.ConeGeometry(2.2, 5, 12), M(0x2f8a48, .8)); cn.position.y = 5; t.add(cn); }
  const house = new THREE.Group(); house.position.set(9, 0, -34); gw.add(house); box(8, 5, 7, M(0xe8dcc8, .7), 0, 2.5, 0, house); const roof = new THREE.Mesh(new THREE.ConeGeometry(6.4, 3.5, 4), M(0xb04a30, .7)); roof.position.y = 6.7; roof.rotation.y = Math.PI / 4; house.add(roof); box(1.4, 2.4, .1, M(0x5a3a22, .7), 0, 1.2, 3.52, house);
  const sunM = new THREE.Mesh(new THREE.SphereGeometry(8, 24, 16), new THREE.MeshBasicMaterial({ color: 0xfff0c0 })); sunM.position.set(-40, 60, -260); gw.add(sunM); }
const goggles = new THREE.Group(); scene.add(goggles);
{ const gm = M(0x3a3028, .5, .3), lm = new THREE.MeshStandardMaterial({ color: 0x9ad0ff, roughness: .05, metalness: .2, transparent: true, opacity: .35 }), br = M(0xb8863a, .3, .8);
  for (const s of [-1, 1]) { const tb = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.5, 3.6, 32, 1, true), gm); tb.material.side = THREE.DoubleSide; tb.rotation.x = Math.PI / 2; tb.position.set(s * 1.9, 0, 0); goggles.add(tb);
    const ln = new THREE.Mesh(new THREE.CircleGeometry(1.4, 32), lm); ln.position.set(s * 1.9, 0, 1.8); goggles.add(ln); const rg = new THREE.Mesh(new THREE.TorusGeometry(1.45, .14, 10, 40), br); rg.position.set(s * 1.9, 0, 1.8); goggles.add(rg); }
  box(1.2, .3, .3, br, 0, .2, 1.2, goggles); const strap = new THREE.Mesh(new THREE.TorusGeometry(4.2, .25, 8, 48, Math.PI), M(0x5a3a22, .8)); strap.rotation.x = Math.PI / 2; strap.position.z = -1.2; strap.rotation.z = Math.PI; goggles.add(strap); }

// ==========================================================================
// TIMELINE
// ==========================================================================
const P = new Particles(20000, { size: .5, seed: 43 }); scene.add(P.obj);
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
const L = (t, a, b) => smooth(TL[a], TL[a] + .3, t) * (b ? 1 - smooth(TL[b] - .1, TL[b] + .1, t) : 1);
function show(o) { eye.visible = !!o.eye; tree.visible = !!o.tree; cl.visible = !!o.cl; gw.visible = !!o.gw; goggles.visible = !!o.gog; }
function rays(t, amp, ks = [0, 1, 2], speed = .5, n = 220) { const s = P.seed; ks.forEach(k => { rayLines[k].material.opacity = Math.min(1, amp) * (k === 2 ? .2 : .45); rayLines[k].geometry.setFromPoints(RAYS[k]); }); ks.forEach(k => { for (let i = 0; i < n; i++) { const q = ((i + k * n) % P.n) * 4; const u = fract(s[q] + t * speed); const p = rayPt(k, u); const f = amp * (k === 2 ? .5 : 1); P.push(p.x + (s[q + 1] - .5) * .25, p.y + (s[q + 2] - .5) * .25, p.z, WARM[0] * f, WARM[1] * f, WARM[2] * f); } }); }
function ball(c, n, R, col, amp, sd = 0) { const s = P.seed; for (let i = 0; i < n; i++) { const q = ((i + sd) % P.n) * 4; const a = s[q] * 6.283, b = Math.acos(s[q + 1] * 2 - 1); const r = R * Math.cbrt(s[q + 2]); P.push(c.x + Math.sin(b) * Math.cos(a) * r, c.y + Math.cos(b) * r, c.z + Math.sin(b) * Math.sin(a) * r, col[0] * amp, col[1] * amp, col[2] * amp); } }
function treeIcon(x, y, s, rot, a, col = '#4ad070') { if (a <= .01) return; g2.save(); g2.globalAlpha = a; g2.translate(x, y); g2.rotate(rot); g2.shadowColor = col; g2.shadowBlur = 25; g2.fillStyle = '#c08a50'; g2.fillRect(-8 * s, 20 * s, 16 * s, 34 * s); g2.fillStyle = col; g2.beginPath(); g2.moveTo(0, -56 * s); g2.lineTo(44 * s, 24 * s); g2.lineTo(-44 * s, 24 * s); g2.fill(); g2.restore(); }
function sideCam(tgt, dist, az = .0, el = .05, fov = 36) { camOrbit(tgt, dist, az, el, fov); }

function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .1; camera.far = 9000;
  let bloomS = .8, flash = 0, ca = .0013, fade = 0, grain = .035, expo = 1.2, dim = 0, roll = 0;
  P.begin(); P.mat.size = .35; show({}); scene.background.setHex(0x04060b); hemi.intensity = 1.4; setCut(false); scleraM.opacity = 1; scleraM.depthWrite = true; img.material.opacity = 0; disc.material.opacity = 0; flaps.visible = false; cili.visible = false; rayLines.forEach(l => l.material.opacity = 0); setPupil(2.2); lens.scale.set(.45, 1, 1); retM.emissive.setRGB(.12, .02, .01);
  for (const c of ['how', 'pupil', 'lens', 'retina', 'cells', 'camera', 'more', 'curious', 'goggles', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  flash = Math.max(flash, flashAt(t, TL.flipped, .35, .4), flashAt(t, TL.blind, .3, .3));
  const hud = [];
  // restaurar trayectorias
  if (t >= TL.retina || t < TL.lens) { tree.position.x = 70; if (RAYS[0][0].x !== 70) { RAYS.forEach(r => r[0].x = 70); rayLen.forEach((_, k) => { let Lr = 0; for (let i = 1; i < RAYS[k].length; i++) Lr += RAYS[k][i].distanceTo(RAYS[k][i - 1]); rayLen[k] = Lr; }); } }
  const xr = (a) => { setCut(true); scleraM.opacity = 1; flaps.visible = true; cili.visible = true; };
  if (t < TL.how) {
    // A · gancho: el ojo nos mira… y por dentro la imagen está al revés
    show({ eye: true, tree: t > 1.4 }); const u = easeInOut(smooth(1.3, 2.6, t)); setPupil(2.4 - .4 * u); if (u > .02) { setCut(true); flaps.visible = true; cili.visible = true; }
    img.material.opacity = smooth(2.2, 2.8, t); if (u > .3) rays(t, smooth(1.6, 2.3, t) * .9);
    expo = lerp(1.0, 1.25, u);
    camOrbit(V3(lerp(6, 0, u), 0, 0), lerp(lerp(80, 72, t / 1.3), 92, u), lerp(Math.PI / 2 - .25, .02, u), lerp(.08, .02, u), 36); P.mat.size = .45; bloomS = .9;
    hud.push(() => { titleHUD('AHORA MISMO, TUS OJOS', 'VEN EL MUNDO…', smooth(.1, .4, t) * (1 - smooth(2.3, 2.5, t)), 300); titleHUD('', '…AL REVÉS', smooth(2.4, 2.7, t), 330);
      callout(V3(-11.2, 2.4, 0), -40, 260, 'IMAGEN EN LA RETINA', null, smooth(2.6, 2.9, t)); });
  } else if (t < TL.pupil) {
    // B · córnea: la cúpula transparente que hace la mayor parte del enfoque
    show({ eye: true, tree: true }); xr(); img.material.opacity = 1; const lt = t - TL.how; rays(t, 1);
    const z = easeInOut(smooth(TL.cornea - .3, TL.dome + .6, t)); sideCam(V3(lerp(0, 9, z), lerp(0, 1, z), 0), lerp(92, 40, z), lerp(.02, .35, z) + lt * .01, lerp(.02, .15, z)); P.mat.size = lerp(.45, .3, z); corM.opacity = .22 + .3 * smooth(TL.cornea, TL.cornea + .5, t); corM.emissive.setRGB(.05 * z, .2 * z, .4 * z);
    hud.push(() => { titleHUD('¿CÓMO FUNCIONA', 'UN OJO?', L(t, 'how', 'cornea'), 300); titleHUD('LA LUZ ENTRA POR', 'LA CÓRNEA', L(t, 'cornea', 'focus'), 300); titleHUD('HACE LA MAYOR PARTE', 'DEL ENFOQUE', L(t, 'focus', 'pupil'), 300);
      callout(V3(13.1, 3.8, 0), 60, -220, 'CÓRNEA', 'cúpula transparente', smooth(TL.dome, TL.dome + .4, t));
      bigStat('DEL ENFOQUE', '2/3', 1480, smooth(TL.focus + .5, TL.focus + .9, t), clamp((t - TL.focus) / 1.5)); });
    corM.emissive.setRGB(0, 0, 0);
  } else if (t < TL.lens) {
    // C · pupila e iris: un agujero y un músculo que lo abre y lo cierra
    show({ eye: true }); const lt = t - TL.pupil; const dk = smooth(TL.dark - .1, TL.dark + .6, t) * (1 - smooth(TL.bright - .1, TL.bright + .5, t)); const br = smooth(TL.bright - .1, TL.bright + .5, t);
    setPupil(lerp(lerp(2.2, 4.6, dk), 1.1, br)); hemi.intensity = lerp(1.4, .45, dk) + br * .9; sun.intensity = lerp(2.6, .8, dk) + br * 1.4;
    const s = P.seed; const la = smooth(TL.pupil, TL.pupil + .5, t) * (1 - smooth(TL.iris, TL.iris + .4, t)); for (let i = 0; i < 1200; i++) { const q = (i % P.n) * 4; const u = fract(s[q] + t * .6); const a = s[q + 1] * 6.283, r = Math.sqrt(s[q + 2]) * 2; P.push(lerp(40, 9.8, u), Math.cos(a) * r * (1 + (1 - u) * 1.5), Math.sin(a) * r * (1 + (1 - u) * 1.5), WARM[0] * la * .5, WARM[1] * la * .5, WARM[2] * la * .5); }
    camOrbit(V3(9.7, 0, 0), lerp(64, 56, clamp(lt / 7)), Math.PI / 2 - .18 + lt * .01, .06, 36); expo = 1.05 - dk * .1;
    hud.push(() => { titleHUD('LUEGO PASA POR', 'LA PUPILA', L(t, 'pupil', 'hole'), 300); titleHUD('ESE CÍRCULO NEGRO', 'ES UN AGUJERO', L(t, 'hole', 'iris'), 300); titleHUD('EL IRIS ES', 'UN MÚSCULO', L(t, 'iris', 'dark'), 300);
      titleHUD('POCA LUZ:', 'SE ABRE', L(t, 'dark', 'bright'), 300); titleHUD('MUCHA LUZ:', 'SE CIERRA', L(t, 'bright'), 300);
      callout(V3(9.8, 0, 0), 120, 330, 'PUPILA', null, smooth(TL.pupil + .4, TL.pupil + .7, t) * (1 - smooth(TL.iris - .2, TL.iris, t)));
      callout(V3(9.8, 4.6, 0), 100, -230, 'IRIS', 'la parte de color', smooth(TL.iris + .3, TL.iris + .6, t) * (1 - smooth(TL.dark - .2, TL.dark, t))); });
  } else if (t < TL.retina) {
    // D · cristalino: lente blanda que cambia de forma (lejos fina, cerca gruesa)
    show({ eye: true, tree: true }); xr(); img.material.opacity = 1; const lt = t - TL.lens; const nearA = smooth(TL.near - .2, TL.near + .4, t); const flex = t < TL.far ? .5 + .5 * Math.sin((t - TL.flex) * 4) * smooth(TL.flex, TL.flex + .3, t) : 0;
    const th = t < TL.far ? lerp(.45, .62, flex) : lerp(.42, .64, nearA); lens.scale.set(th, 1, 1); ciliM.emissive.setRGB(.3 * nearA + .2 * flex, .05, .03);
    tree.position.x = lerp(70, 40, nearA); RAYS.forEach(r => r[0].x = lerp(70, 40, nearA)); rays(t, smooth(TL.lens, TL.lens + .5, t)); rayLen.forEach((_, k) => { let Lr = 0; for (let i = 1; i < RAYS[k].length; i++) Lr += RAYS[k][i].distanceTo(RAYS[k][i - 1]); rayLen[k] = Lr; });
    sideCam(V3(7, .5, 0), lerp(38, 30, clamp(lt / 6)), .4 + lt * .02, .12); lensM.emissive.setRGB(.25, .18, .05); P.mat.size = .3;
    hud.push(() => { titleHUD('DETRÁS ESTÁ EL CRISTALINO', 'UNA LENTE BLANDA', L(t, 'lens', 'flex'), 300); titleHUD('UNOS MÚSCULOS', 'LA ESTIRAN O ABOMBAN', L(t, 'flex', 'far'), 300); titleHUD('PARA ENFOCAR', t < TL.near ? 'LO QUE ESTÁ LEJOS' : 'LO QUE ESTÁ CERCA', L(t, 'far'), 300);
      callout(V3(7, 3.4, 0), -60, -200, 'CRISTALINO', null, smooth(TL.lens + .4, TL.lens + .8, t), '#f0d890'); callout(V3(7, -5.6, 0), 60, 200, 'MÚSCULO CILIAR', null, smooth(TL.flex + .2, TL.flex + .6, t), '#ff8a70');
      txt(t < TL.near ? 'LEJOS → FINA' : 'CERCA → GRUESA', W / 2, 1480, 44, { font: 'Montserrat', weight: 800, alpha: smooth(TL.far, TL.far + .3, t), fill: copperGrad(250, 830, 1480, .5) }); });
    lensM.emissive.setRGB(.12, .09, .03);
  } else if (t < TL.camera) {
    // E · retina: bastones (poca luz, blanco y negro) y conos (rojo, verde, azul)
    const lt = t - TL.retina;
    if (t < TL.cells) { show({ eye: true, tree: true }); xr(); img.material.opacity = 1; rays(t, 1); retM.emissive.setRGB(.25, .05, .02); sideCam(V3(lerp(0, -8, easeInOut(clamp(lt / 2.6))), 0, 0), lerp(48, 26, easeInOut(clamp(lt / 2.6))), .3 + lt * .05, .1); P.mat.size = .3;
      hud.push(() => { titleHUD('Y LA LUZ LLEGA AL FONDO:', 'LA RETINA', L(t, 'retina', 'cells'), 300); callout(V3(-11.4, 5, 0), 60, -200, 'RETINA', null, smooth(TL.retina + .5, TL.retina + .9, t), '#ff8a70'); }); }
    else { show({ cl: true }); const rl = smooth(TL.cells + .4, TL.cells + 1.2, t) * (t < TL.cones ? 1 : .35); const cn = t < TL.cones ? .15 : smooth(TL.cones, TL.cones + .5, t); const which = t < TL.red ? -1 : t < TL.green ? 0 : t < TL.blue ? 1 : 2;
      lightCells(rl, cn, which); hemi.intensity = .8; const s = P.seed;
      for (let i = 0; i < 1400; i++) { const q = (i % P.n) * 4; const c = cells[Math.floor(s[q + 3] * cells.length)]; const u = fract(s[q] + t * .7); const y = lerp(16, c.cone ? 3.4 : 6.4, u); const col = t < TL.cones || !c.cone ? (t < TL.cones ? [1, 1, 1.2] : [.6, .6, .7]) : CONE_COLS[c.ci].map(v => v * 1.6);
        const on = (c.cone ? (which < 0 || c.ci === which ? 1 : .15) : 1) * smooth(TL.cells, TL.cells + .5, t); P.push(CL.x + c.x + (s[q + 1] - .5) * .6, CL.y + y, CL.z + c.z + (s[q + 2] - .5) * .6, col[0] * on * .14, col[1] * on * .14, col[2] * on * .14); }
      for (let i = 0; i < 900; i++) { const q = ((i + 3000) % P.n) * 4; const c = cells[Math.floor(s[q] * cells.length)]; const u = fract(s[q + 1] + t * 1.3); const f = smooth(TL.cells + .6, TL.cells + 1.2, t) * 1.2; P.push(CL.x + c.x, CL.y - 1.4 - u * .2, CL.z + c.z + u * 8 - 4, BLUE[0] * f, BLUE[1] * f, BLUE[2] * f); }
      camOrbit(CL.clone().add(V3(0, 3.5, 0)), lerp(30, 25, clamp((t - TL.cells) / 10)), .55 + (t - TL.cells) * .03, .55, 38);
      for (const c of cells) if (c.cone && t > TL.cones) { const k = which < 0 || c.ci === which ? 1 : 0; if (k) ball(CL.clone().add(V3(c.x, 5.4, c.z)), 40, .7, CONE_COLS[c.ci].map(v => v * 1.6), .55 * smooth(TL.cones, TL.cones + .4, t), c.idx * 41); } P.mat.size = .35; bloomS = 1.1; expo = 1.3;
      hud.push(() => { bigStat('CÉLULAS QUE LA CONVIERTEN EN ELECTRICIDAD', '+100 MILLONES', 300 + 100, L(t, 'cells', 'rods'), clamp((t - TL.cells) / 1.5)); titleHUD('BASTONES: VEN CON POCA LUZ', 'EN BLANCO Y NEGRO', L(t, 'rods', 'cones'), 300);
        titleHUD('CONOS:', 'VEN LOS COLORES', L(t, 'cones', 'red'), 300); const cw = ['ROJO', 'VERDE', 'AZUL'], cc = ['#ff5a4a', '#5af07a', '#5a8aff']; if (which >= 0) txt(cw[which], W / 2, 360, 96, { font: 'Montserrat', weight: 800, alpha: smooth(TL[['red', 'green', 'blue'][which]], TL[['red', 'green', 'blue'][which]] + .2, t) * (1 - smooth(TL.camera - .2, TL.camera, t)), fill: cc[which] });
        const rc = cells.find(c => !c.cone), cc2 = cells.find(c => c.cone && c.ci === 0); callout(CL.clone().add(V3(rc.x, 6.6, rc.z)), -60, -160, 'BASTÓN', null, smooth(TL.rods + .3, TL.rods + .6, t) * (1 - smooth(TL.cones + 1, TL.cones + 1.3, t)), '#d8e0ff');
        callout(CL.clone().add(V3(cc2.x, 3.4, cc2.z)), 60, -120, 'CONO', null, smooth(TL.cones + .3, TL.cones + .6, t) * (1 - smooth(TL.red - .2, TL.red, t)), '#ffb070'); }); }
  } else if (t < TL.more) {
    // F · como una cámara antigua: los rayos se cruzan y la imagen llega del revés; el cerebro la gira
    show({ eye: true, tree: true }); xr(); const lt = t - TL.camera; img.material.opacity = smooth(TL.flipped - .1, TL.flipped + .3, t); rays(t, 1.2, [0, 1], .45, 320);
    const s = P.seed; const sg = smooth(TL.brain, TL.brain + .4, t); for (let i = 0; i < 600; i++) { const q = (i % P.n) * 4; const u = fract(s[q] + t * 1.2); const p = V3(lerp(-11.4, -40, u), -2.6 + (s[q + 1] - .5) * 2.4, (s[q + 2] - .5) * 2.4); P.push(p.x, p.y, p.z, BLUE[0] * sg * .3, BLUE[1] * sg * .3, BLUE[2] * sg * .3); }
    const pb = easeInOut(smooth(TL.brain - .2, TL.brain + 1, t)); sideCam(V3(lerp(0, -8, pb), 0, 0), lerp(lerp(94, 86, smooth(TL.camera, TL.flipped, t)), 100, pb), .02 + lt * .01, .03); P.mat.size = .45; bloomS = 1;
    hud.push(() => { titleHUD('COMO EN UNA', 'CÁMARA ANTIGUA', L(t, 'camera', 'cross'), 300); titleHUD('LA LENTE', 'CRUZA LOS RAYOS…', L(t, 'cross', 'flipped'), 300); titleHUD('…Y LA IMAGEN', 'LLEGA DEL REVÉS', L(t, 'flipped', 'brain'), 300); titleHUD('TU CEREBRO', 'LE DA LA VUELTA', L(t, 'brain'), 300);
      const fa = smooth(TL.brain + .3, TL.brain + .7, t); treeIcon(W / 2, 1480, 1.8, Math.PI * (1 - easeInOut(smooth(TL.brain + .7, TL.brain + 1.4, t))), fa); callout(V3(-30, -1.5, 0), 0, 240, 'NERVIO ÓPTICO', 'al cerebro', fa * .9, '#9ad0ff'); });
  } else if (t < TL.curious) {
    // G · punto ciego donde sale el nervio óptico; el cerebro lo rellena
    show({ eye: true }); xr(); const lt = t - TL.more; disc.material.opacity = smooth(TL.blind - .2, TL.blind + .4, t) * .95; retM.emissive.setRGB(.2, .04, .02);
    const z = easeInOut(smooth(TL.nerve - .4, TL.blind, t)); sideCam(V3(lerp(-6, -12, z), -2.6 * z, 0), lerp(55, 26, z), lerp(.2, .9, z), lerp(.1, .05, z)); const fl = smooth(TL.fill, TL.fill + .5, t); dim = fl * .8;
    const s = P.seed; const na = smooth(TL.nerve, TL.nerve + .4, t) * (1 - fl); for (let i = 0; i < 700; i++) { const q = (i % P.n) * 4; const u = fract(s[q] + t * 1.1); const a = s[q + 1] * 6.283, r = Math.sqrt(s[q + 2]) * 1.5; P.push(lerp(-11.6, -30, u), -2.6 + Math.cos(a) * r, Math.sin(a) * r, BLUE[0] * na, BLUE[1] * na, BLUE[2] * na); }
    P.mat.size = .35;
    hud.push(() => { titleHUD('Y AÚN', 'HAY MÁS', L(t, 'more', 'nerve'), 300); titleHUD('DONDE SALE EL NERVIO ÓPTICO', 'NO HAY CÉLULAS', L(t, 'nerve', 'blind'), 300); titleHUD('ES UN', 'PUNTO CIEGO', L(t, 'blind', 'fill'), 300); titleHUD('TU CEREBRO', 'SE INVENTA LO QUE FALTA', L(t, 'fill'), 300);
      callout(NERVE_HEAD.clone().add(V3(.3, 0, 0)), 80, -220, 'PUNTO CIEGO', '0 células', smooth(TL.blind + .3, TL.blind + .6, t) * (1 - fl), '#ff8a70');
      if (fl > .01) { const cx = W / 2, cy = 1000; for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) { const x = cx + i * 90, y = cy + j * 90; const d = Math.hypot(i, j); const hole = d < 2.2; const a = fl * (hole ? smooth(TL.fill + .9, TL.fill + 1.8, t) : 1); if (a < .01) continue; g2.save(); g2.globalAlpha = a; g2.fillStyle = hole ? '#e3a372' : '#ffffff'; g2.shadowColor = hole ? '#e3a372' : 'rgba(0,0,0,0)'; g2.shadowBlur = hole ? 18 : 0; g2.beginPath(); g2.arc(x, y, 14, 0, 7); g2.fill(); g2.restore(); }
        const ha = fl * (1 - smooth(TL.fill + .9, TL.fill + 1.6, t)); g2.save(); g2.globalAlpha = ha; g2.strokeStyle = '#ff8a70'; g2.setLineDash([12, 10]); g2.lineWidth = 4; g2.beginPath(); g2.arc(cx, cy, 200, 0, 7); g2.stroke(); g2.restore(); } });
  } else if (t < TL.brand) {
    // H · 1896: gafas que giran el mundo; a los pocos días, el cerebro se adapta
    const pov = t > TL.goggles + 1.15; show({ gw: true, gog: !pov }); scene.background.setRGB(.5, .68, .9); hemi.intensity = 2; sun.intensity = 3;
    if (!pov) { const lt = t - TL.curious; goggles.position.copy(GW.clone().add(V3(0, 1.7, -8))); goggles.rotation.set(.15, lt * .25 - .4, 0); const push = easeInOut(smooth(TL.goggles + .4, TL.goggles + 1.3, t)); camOrbit(goggles.position.clone().add(V3(lerp(0, 1.9, push), 0, 0)), lerp(16, 1.2, push), lerp(.5 - lt * .05, 0, push), lerp(.15, 0, push), 40); }
    else { const back = easeInOut(smooth(TL.normal - .3, TL.normal + 1.1, t)); roll = Math.PI * (1 - back); camera.position.copy(GW.clone().add(V3(0, 1.7, 6 - (t - TL.goggles) * 1.2))); camera.lookAt(GW.clone().add(V3(0, 2.5, -60))); camera.fov = 50; camera.rotateZ(roll); }
    expo = 1.1; bloomS = .6; const da = pov ? smooth(TL.adapt, TL.adapt + .3, t) : 0;
    hud.push(() => { if (pov) { g2.save(); g2.fillStyle = 'rgba(2,4,8,.9)'; g2.beginPath(); g2.rect(0, 0, W, H); g2.moveTo(W / 2 + 470, H / 2 + 60); g2.arc(W / 2, H / 2 + 60, 470, 0, 6.2832, true); g2.closePath(); g2.fill('evenodd'); g2.restore(); }
      titleHUD('Y LO MÁS', 'CURIOSO', L(t, 'curious', 'goggles'), 300); bigStat('', '1896', 1480, L(t, 'curious', 'goggles'), clamp((t - TL.curious) / 1.5));
      titleHUD('UN PSICÓLOGO SE PUSO GAFAS', 'QUE GIRABAN EL MUNDO', L(t, 'goggles', 'adapt'), 300); titleHUD('A LOS POCOS DÍAS', 'SU CEREBRO SE ADAPTÓ', L(t, 'adapt', 'normal'), 300); titleHUD('Y EL MUNDO LE PARECÍA', 'CADA VEZ MÁS NORMAL', L(t, 'normal'), 300);
      const day = 1 + Math.min(2, Math.floor(smooth(TL.adapt + .3, TL.normal + .6, t) * 2.99)); txt('DÍA ' + day, W / 2, 1640, 46, { font: 'Montserrat', weight: 800, alpha: da, fill: copperGrad(300, 780, 1640, .5) }); });
  } else {
    // I · marca
    show({ eye: true }); const lt = t - TL.brand; setPupil(2.3 + .2 * Math.sin(lt * 2)); camOrbit(V3(9.7, 0, 0), 76 + lt * 3, Math.PI / 2 - .2 + lt * .03, .05, 36); expo = .95; dim = smooth(0, .8, lt) * .6;
    hud.push(() => drawBrand(lt - .3)); fade = smooth(TL.end - .6, TL.end, t) * .3;
  }
  P.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (dim > 0) hud.unshift(() => { g2.save(); g2.globalAlpha = dim * .7; g2.fillStyle = '#02050b'; g2.fillRect(0, 0, W, H); g2.restore(); });
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
function renderCover() { renderFrame(TL.flipped + 1.0); coverText('TUS OJOS VEN', 'AL REVÉS', 'Y tu cerebro le da la vuelta'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
