// NO LO SABÍAS — "¿Cómo sube el café en la cafetera italiana?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final. Esquema, no a escala exacta (1 unidad ≈ 1 cm).
// Moka: el vapor y el aire calientes sobre el agua del depósito presurizan (≈ 1–1,5 bar) y empujan el agua por el embudo, a través del café y por la columna central.
// Espresso ≈ 9 bar. Válvula de seguridad lateral. Fase final "estromboliana" (gorgoteo): pasa vapor y el café se sobreextrae.
// Alfonso Bialetti, 1933 (Moka Express), inspirado según la historia de la marca en la "lisciveuse", caldera de colada con tubo central.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3, g2, camera, Particles, txt, copperGrad, project, callout, titleHUD, fract, camOrbit, bigStat, drawBrand, coverText, finish, noise1, arrowXY, bar, renderer } from '../../lib/core.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const scene = new THREE.Scene(); scene.background = new THREE.Color(0x070a12);
{ const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .42; }
const hemi = new THREE.HemisphereLight(0xd0dcff, 0x302830, 1.2); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0e0, 2.4); sun.position.set(30, 60, 50); scene.add(sun);
const rim = new THREE.DirectionalLight(0x8ab0ff, 1.3); rim.position.set(-40, 10, -30); scene.add(rim);
const fire = new THREE.PointLight(0x4a8aff, 0, 30, 1.5); fire.position.set(0, -1, 2); scene.add(fire);
renderer.localClippingEnabled = true;
const CUT = new THREE.Plane(V3(0, 0, -1), 100); const clip = [CUT];
const M = (c, r = .6, m = 0, e = 0, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r, metalness: m, emissive: e, clippingPlanes: clip, side: THREE.DoubleSide }, extra));
const R = rng(31);
const canvasTex = (w, h, draw, rep) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; };
const BLUE = [.7, 1.5, 3.0], BROWN = [2.0, 1.0, .4], WHITE = [1.6, 1.6, 1.7];
const unitCyl = (seg = 8) => { const g = new THREE.CylinderGeometry(1, 1, 1, seg); g.translate(0, .5, 0); return g; };

// ==========================================================================
// FOGÓN
// ==========================================================================
const stove = new THREE.Group(); scene.add(stove);
const top = new THREE.Mesh(new THREE.BoxGeometry(80, 1, 60), new THREE.MeshStandardMaterial({ color: 0x14161c, roughness: .35, metalness: .3 })); top.position.y = -3.5; stove.add(top);
const burner = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 4.2, 1.2, 32), new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: .85, metalness: .2 })); burner.position.y = -2.5; stove.add(burner);
const grate = new THREE.Group(); stove.add(grate); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; const b = new THREE.Mesh(new THREE.BoxGeometry(9, .8, .8), new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: .7, metalness: .4 })); b.position.set(Math.cos(a) * 6.5, -.4, Math.sin(a) * 6.5); b.rotation.y = -a; grate.add(b); }

// ==========================================================================
// CAFETERA (moka octogonal)
// ==========================================================================
const moka = new THREE.Group(); scene.add(moka);
const alu = M(0xb8bcc4, .5, .8, 0, { flatShading: true, envMapIntensity: .55 });
const bot = new THREE.Group(), mid = new THREE.Group(), upp = new THREE.Group(); moka.add(bot, mid, upp);
const boiler = new THREE.Mesh(new THREE.CylinderGeometry(4.3, 5.4, 7.5, 8, 1, true), alu); boiler.position.y = 3.75; bot.add(boiler);
const boilerBase = new THREE.Mesh(new THREE.CircleGeometry(5.4, 8), alu); boilerBase.rotation.x = -Math.PI / 2; boilerBase.position.y = .02; bot.add(boilerBase);
const valveG = new THREE.Group(); valveG.position.set(4.95, 4.6, -.45); valveG.rotation.y = Math.atan2(.45, 4.95); bot.add(valveG);
const valveBody = new THREE.Mesh(new THREE.CylinderGeometry(.55, .65, .9, 6), M(0x9aa0a8, .55, .7)); valveBody.rotation.z = -Math.PI / 2; valveBody.position.x = .3; valveG.add(valveBody);
const valvePin = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .8, 12), M(0x9a7838, .55, .7, 0)); valvePin.rotation.z = -Math.PI / 2; valvePin.position.x = .8; valveG.add(valvePin);
const valveM = valvePin.material;
const upper = new THREE.Mesh(new THREE.CylinderGeometry(5.0, 4.35, 8.6, 8, 1, true), alu); upper.position.y = 8.4 + 4.3; upp.add(upper);
const collar = new THREE.Mesh(new THREE.CylinderGeometry(4.55, 4.55, .9, 8, 1, true), alu); collar.position.y = 8.1; upp.add(collar);
const lid = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 5.05, 1.5, 8, 1, false), alu); lid.position.y = 17.75; upp.add(lid);
const knob = new THREE.Mesh(new THREE.SphereGeometry(.8, 16, 12), new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: .5, clippingPlanes: clip })); knob.position.y = 18.8; upp.add(knob);
const spout = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3.2, 4, 1, true), M(0x8a8e96, .75, .6, 0, { flatShading: true, envMapIntensity: .3 })); spout.rotation.z = Math.PI / 2 + .35; spout.position.set(-5.4, 16.2, 0); spout.scale.set(1, 1, .6); upp.add(spout);
const handle = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(4.6, 15.5, 0), V3(8.2, 15.2, 0), V3(8.8, 12.5, 0), V3(7.6, 9.6, 0), V3(4.7, 9.4, 0)]), 40, .75, 10), new THREE.MeshStandardMaterial({ color: 0x141416, roughness: .5, clippingPlanes: clip })); upp.add(handle);
// interior: embudo + café, filtro superior, columna, agua y café líquido
const funnelM = M(0xd8dce2, .3, .9);
const basket = new THREE.Mesh(new THREE.CylinderGeometry(3.9, 3.6, 2.6, 32, 1, true), funnelM); basket.position.y = 6.9; mid.add(basket);
const basketRim = new THREE.Mesh(new THREE.TorusGeometry(4.15, .25, 8, 32), funnelM); basketRim.rotation.x = Math.PI / 2; basketRim.position.y = 8.2; mid.add(basketRim);
const funTube = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, 5.2, 16, 1, true), funnelM); funTube.position.y = 3.0; mid.add(funTube);
const grounds = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#3a2214'; x.fillRect(0, 0, w, h); for (let i = 0; i < 4000; i++) { const v = R(); x.fillStyle = v > .5 ? 'rgba(110,70,40,.6)' : 'rgba(20,10,5,.6)'; x.fillRect(R() * w, R() * h, 2, 2); } }, [2, 1]);
const coffeeM = M(0xffffff, .95, 0, 0, { map: grounds });
const coffeeBed = new THREE.Mesh(new THREE.CylinderGeometry(3.75, 3.55, 2.3, 32), coffeeM); coffeeBed.position.y = 6.95; mid.add(coffeeBed);
const plate = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, .25, 32), M(0xc8ccd4, .35, .9)); plate.position.y = 8.55; upp.add(plate);
const column = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, 6.2, 16, 1, true), M(0xd8dce2, .3, .9)); column.position.y = 8.6 + 3.1; upp.add(column);
const colHi = new THREE.MeshBasicMaterial({ color: 0xffa050, transparent: true, opacity: 0, clippingPlanes: clip, depthWrite: false });
const colGlow = new THREE.Mesh(new THREE.CylinderGeometry(.75, .75, 6.2, 16, 1, true), colHi); colGlow.position.copy(column.position); upp.add(colGlow);
const tubeGlow = new THREE.Mesh(new THREE.CylinderGeometry(.7, .7, 5.2, 16, 1, true), colHi); tubeGlow.position.copy(funTube.position); mid.add(tubeGlow);
const waterM = new THREE.MeshStandardMaterial({ color: 0x3a88d8, roughness: .1, transparent: true, opacity: .62, emissive: 0x0a2040, clippingPlanes: clip, side: THREE.DoubleSide, depthWrite: false });
const water = new THREE.Mesh(unitCyl(), waterM); water.position.y = .15; bot.add(water);
const brewM = new THREE.MeshStandardMaterial({ color: 0x5a3018, roughness: .15, transparent: true, opacity: .85, emissive: 0x1a0a04, clippingPlanes: clip, side: THREE.DoubleSide, depthWrite: false });
const brew = new THREE.Mesh(unitCyl(), brewM); brew.position.y = 8.7; upp.add(brew);
const airM = new THREE.MeshBasicMaterial({ color: 0xffa060, transparent: true, opacity: 0, clippingPlanes: clip, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
const air = new THREE.Mesh(unitCyl(), airM); bot.add(air);
function setLevels(wl, bl) { // wl: altura del agua en el depósito (cm), bl: altura del café en la jarra
  const rw = 4.85 - .12 * wl; water.scale.set(rw, Math.max(.01, wl), rw); water.visible = wl > .05;
  air.position.y = .15 + wl; air.scale.set(4.5, Math.max(.01, 5.4 - wl), 4.5); brew.scale.set(4.45, Math.max(.01, bl), 4.45); brew.visible = bl > .05; }

// ==========================================================================
// LAVADORA DE CALDERA (colada con tubo central)
// ==========================================================================
const laund = new THREE.Group(); laund.position.set(-17, 0, 0); scene.add(laund);
const galv = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#9aa0a8'; x.fillRect(0, 0, w, h); for (let i = 0; i < 160; i++) { const v = 120 + R() * 80 | 0; x.fillStyle = `rgba(${v},${v},${v + 6},.35)`; x.beginPath(); x.arc(R() * w, R() * h, 4 + R() * 18, 0, 7); x.fill(); } }, [3, 1]);
const galvM = M(0xffffff, .45, .7, 0, { map: galv });
const tub = new THREE.Mesh(new THREE.CylinderGeometry(9.5, 8.5, 16, 40, 1, true), galvM); tub.position.y = 8; laund.add(tub);
const tubBase = new THREE.Mesh(new THREE.CircleGeometry(8.5, 40), galvM); tubBase.rotation.x = -Math.PI / 2; tubBase.position.y = .1; laund.add(tubBase);
const tubRim = new THREE.Mesh(new THREE.TorusGeometry(9.5, .4, 8, 40), galvM); tubRim.rotation.x = Math.PI / 2; tubRim.position.y = 16; laund.add(tubRim);
const lPipe = new THREE.Mesh(new THREE.CylinderGeometry(.8, .8, 19, 16, 1, true), M(0xc8ccd4, .3, .85)); lPipe.position.y = 9.5; laund.add(lPipe);
const lFoot = new THREE.Mesh(new THREE.CylinderGeometry(.8, 4, 2, 24, 1, true), M(0xc8ccd4, .3, .85)); lFoot.position.y = 1; laund.add(lFoot);
const lCap = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.4, 24, 1, true), M(0xc8ccd4, .3, .85)); lCap.position.y = 19.7; lCap.rotation.x = Math.PI; laund.add(lCap);
const lPipeGlow = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 19, 16, 1, true), colHi); lPipeGlow.position.copy(lPipe.position); laund.add(lPipeGlow);
const lWater = new THREE.Mesh(unitCyl(32), new THREE.MeshStandardMaterial({ color: 0x8ab8d8, roughness: .2, transparent: true, opacity: .5, emissive: 0x102030, clippingPlanes: clip, side: THREE.DoubleSide, depthWrite: false })); lWater.scale.set(8.6, 4, 8.6); lWater.position.y = .2; laund.add(lWater);
const CLOTH = [0x8a8274, 0x7a7266, 0x948c7e, 0x6a645a, 0x847c6e, 0x5a5650];
for (let i = 0; i < 16; i++) { const g = new THREE.IcosahedronGeometry(1, 2); const p = g.attributes.position; for (let j = 0; j < p.count; j++) { const v = V3(p.getX(j), p.getY(j), p.getZ(j)); v.multiplyScalar(1 + .3 * Math.sin(v.x * 3 + i) * Math.cos(v.y * 2 - i)); p.setXYZ(j, v.x * 1.5, v.y * .7, v.z * 1.2); } g.computeVertexNormals();
  const m = new THREE.Mesh(g, M(CLOTH[i % 6], .95)); const a = R() * 6.28, r = 2.5 + R() * 5; m.position.set(Math.cos(a) * r, 2 + R() * 9, Math.sin(a) * r); m.rotation.set(R() * 3, R() * 3, R() * 3); m.scale.setScalar(2.2 + R()); laund.add(m); }
const fireL = new THREE.Group(); laund.add(fireL); // brasas bajo la caldera
const coals = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(.6), new THREE.MeshStandardMaterial({ color: 0x201008, roughness: .9, emissive: 0xff4010, emissiveIntensity: .25 }), 24); fireL.add(coals);
{ const d = new THREE.Object3D(); for (let i = 0; i < 24; i++) { const a = R() * 6.28, r = R() * 7; d.position.set(Math.cos(a) * r, -2.7, Math.sin(a) * r); d.rotation.set(R() * 3, R() * 3, R() * 3); d.updateMatrix(); coals.setMatrixAt(i, d.matrix); } }

// ==========================================================================
// TIMELINE
// ==========================================================================
const P = new Particles(16000, { size: .5, seed: 53 }); scene.add(P.obj);
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
const L = (t, a, b) => smooth(TL[a], TL[a] + .3, t) * (b ? 1 - smooth(TL[b] - .1, TL[b] + .1, t) : 1);
const S = () => P.seed;
function flames(a, cx = 0) { if (a <= .01) return; const s = S(); for (let i = 0; i < 500 * a; i++) { const q = (i % P.n) * 4; const k = i % 36; const ang = k / 36 * 6.283; const age = fract(s[q] + performanceT * 2.2); const r = 3.4 + age * 1.6; const f = (1 - age) * a;
  P.push(cx + Math.cos(ang) * r + (s[q + 1] - .5) * .3, -2 + age * 1.6 * (1 + s[q + 2]), Math.sin(ang) * r + (s[q + 3] - .5) * .3, .35 * f, .7 * f, 2.2 * f); } }
let performanceT = 0;
// flujo: partículas por el embudo → café → columna → fuente
function flow(a, t, steamy = 0, wl = 3) { if (a <= .01) return; const s = S(); const n = 1400;
  for (let i = 0; i < n * a; i++) { const q = (i % P.n) * 4; const u = fract(s[q] + t * .55); let p, c;
    if (u < .3) { const k = u / .3; p = V3((s[q + 1] - .5) * .7, lerp(.6, 5.6, k), (s[q + 2] - .5) * .7); c = BLUE; }
    else if (u < .5) { const k = (u - .3) / .2; const a2 = s[q + 1] * 6.283, r = Math.sqrt(s[q + 2]) * 3.4 * Math.min(1, k * 3); p = V3(Math.cos(a2) * r, lerp(5.8, 8.2, k), Math.sin(a2) * r); c = [lerp(BLUE[0], BROWN[0], k), lerp(BLUE[1], BROWN[1], k), lerp(BLUE[2], BROWN[2], k)]; }
    else if (u < .72) { const k = (u - .5) / .22; p = V3((s[q + 1] - .5) * .8, lerp(8.6, 14.8, k), (s[q + 2] - .5) * .8); c = BROWN; }
    else { const k = (u - .72) / .28; const a2 = s[q + 1] * 6.283; const v = 1.4 + s[q + 3] * 2.2; p = V3(Math.cos(a2) * v * k * 1.3, 14.8 + 1.4 * k - 5 * k * k, Math.sin(a2) * v * k * 1.3); if (p.y < 8.9) continue; c = BROWN; }
    const st = steamy > 0 && s[q + 3] < steamy; if (st) c = WHITE; const f = a * (st ? .7 : 1); P.push(p.x, p.y, p.z, c[0] * f, c[1] * f, c[2] * f); } }
function bubbles(a, t, wl) { if (a <= .01) return; const s = S(); for (let i = 0; i < 300 * a; i++) { const q = ((i + 3000) % P.n) * 4; const u = fract(s[q] + t * .8); const a2 = s[q + 1] * 6.283, r = Math.sqrt(s[q + 2]) * 4.2; P.push(Math.cos(a2) * r, .3 + u * wl, Math.sin(a2) * r, .35 * a * (1 - u), .45 * a * (1 - u), .65 * a * (1 - u)); } }
function steamJet(a, t, from, dir) { if (a <= .01) return; const s = S(); for (let i = 0; i < 1600 * a; i++) { const q = ((i + 6000) % P.n) * 4; const age = fract(s[q] + t * 2.5); const sp = age * 9; const p = from.clone().add(dir.clone().multiplyScalar(sp)).add(V3((s[q + 1] - .5) * age * 2.5, (s[q + 2] - .5) * age * 2.5 + age * age * 2, (s[q + 3] - .5) * age * 2.5)); const f = (1 - age) * a; P.push(p.x, p.y, p.z, WHITE[0] * f, WHITE[1] * f, WHITE[2] * f); } }
function gauge(cx, cy, R0, frac, label, val, a, col) { if (a <= .01) return; g2.save(); g2.globalAlpha = a; g2.lineCap = 'round'; g2.lineWidth = 16; g2.strokeStyle = 'rgba(255,255,255,.14)'; g2.beginPath(); g2.arc(cx, cy, R0, Math.PI * .75, Math.PI * 2.25); g2.stroke();
  g2.strokeStyle = col; g2.shadowColor = col; g2.shadowBlur = 20; g2.beginPath(); g2.arc(cx, cy, R0, Math.PI * .75, Math.PI * (.75 + 1.5 * clamp(frac))); g2.stroke(); g2.restore();
  txt(val, cx, cy + 10, 64, { font: 'Montserrat', weight: 800, alpha: a }); txt(label, cx, cy + R0 + 40, 24, { spacing: 5, alpha: a * .8, fill: '#e3a372' }); }

function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .2; camera.far = 1000; performanceT = t;
  let bloomS = .7, flash = 0, ca = .0013, fade = 0, grain = .035, expo = 1.15, dim = 0;
  P.begin(); P.mat.size = .38; rim.intensity = .5; moka.visible = true; moka.position.set(0, 0, 0); moka.scale.setScalar(1); laund.visible = false; stove.visible = true; CUT.constant = 100;
  bot.position.set(0, 0, 0); mid.position.set(0, 0, 0); upp.position.set(0, 0, 0); moka.rotation.set(0, 0, 0); colHi.opacity = 0; airM.opacity = 0; valvePin.position.x = .8; valveM.emissive.setRGB(0, 0, 0);
  waterM.color.setHex(0x3a88d8); waterM.emissive.setHex(0x0a2040); brewM.color.setHex(0x5a3018); coffeeM.emissive.setRGB(0, 0, 0); coffeeBed.scale.set(1, 1, 1); fire.intensity = 0;
  for (const c of ['how', 'parts', 'fire', 'up', 'valve', 'gurgle', 'curious', 'born', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];
  if (t < TL.parts) {
    // A · gancho: cafetera en el fuego → corte → agua abajo, café en medio, café arriba
    const cut = easeInOut(smooth(.6, 1.8, t)); CUT.constant = lerp(8, 0, cut); flames(1); fire.intensity = 2;
    const bl = lerp(0, 3.2, smooth(TL.top - .2, TL.how + .6, t)); setLevels(lerp(5.4, 4.6, smooth(TL.top - .2, TL.parts, t)), bl);
    flow(smooth(TL.top - .4, TL.top, t), t);
    camOrbit(V3(0, 9, 0), lerp(62, 52, clamp(t / TL.parts)), lerp(.7, .25, easeInOut(clamp(t / TL.parts))), lerp(.35, .18, clamp(t / TL.parts)), 38); expo = 1.2;
    hud.push(() => { titleHUD('LO HAS VISTO', 'MILES DE VECES', smooth(.1, .4, t) * (1 - smooth(TL.water - .1, TL.water + .1, t)), 300);
      callout(V3(-2.5, 2.5, 0), -120, 60, 'AGUA', null, smooth(TL.water, TL.water + .3, t) * (1 - smooth(TL.how - .2, TL.how, t)), '#7ab8ff');
      callout(V3(2.4, 7, 0), 120, 40, 'CAFÉ', null, smooth(TL.coffee, TL.coffee + .3, t) * (1 - smooth(TL.how - .2, TL.how, t)), '#e3a372');
      callout(V3(-2.5, 10.5, 0), -120, -120, '¿CAFÉ?', null, smooth(TL.top, TL.top + .3, t) * (1 - smooth(TL.how - .2, TL.how, t)), '#ffd0a0');
      bigStat('', '¿CÓMO SUBE?', 1560, L(t, 'how', 'parts'), clamp((t - TL.how) / .8)); });
  } else if (t < TL.fire) {
    // B · despiece: depósito, embudo con café, jarra con tubo central
    const lt = t - TL.parts; CUT.constant = 0; stove.visible = lt < .2; const ex = easeInOut(smooth(TL.parts, TL.parts + 1, t)) * (1 - easeInOut(smooth(TL.fire - .8, TL.fire, t)));
    mid.position.y = ex * 5; upp.position.y = ex * 10; moka.position.y = lerp(0, -2, ex); setLevels(5.0, 0); colHi.opacity = .7 * smooth(TL.tube, TL.tube + .3, t) * (1 - smooth(TL.fire - .3, TL.fire, t));
    camOrbit(V3(0, lerp(9, 12, ex), 0), lerp(58, 74, ex), .25 + lt * .05, lerp(.18, .12, ex), 38);
    hud.push(() => { titleHUD('TIENE TRES', 'PARTES', L(t, 'parts', 'tank'), 300);
      const ca = (k, n) => smooth(TL[k], TL[k] + .3, t) * (1 - smooth(TL.fire - .5, TL.fire - .2, t));
      callout(bot.localToWorld(V3(-4.8, 3.5, 0)), -110, 30, 'DEPÓSITO', 'AGUA', ca('tank'), '#7ab8ff'); callout(mid.localToWorld(V3(3.9, 7.4, 0)), 120, 30, 'EMBUDO', 'CAFÉ MOLIDO', ca('funnel'), '#e3a372');
      callout(upp.localToWorld(V3(-4.8, 14, 0)), -110, -40, 'JARRA', null, ca('jug'), '#e3a372'); callout(upp.localToWorld(V3(.6, 13.5, 0)), 130, -150, 'TUBO CENTRAL', null, ca('tube'), '#ffb070'); });
  } else if (t < TL.small) {
    // C · el agua se calienta, el aire y el vapor de encima empujan el agua hacia abajo → embudo → café → tubo
    const lt = t - TL.fire; CUT.constant = 0; const fl = smooth(TL.fire, TL.fire + .5, t); flames(fl); fire.intensity = 2 * fl;
    const heat = smooth(TL.heats, TL.heats + 1.5, t); waterM.color.setRGB(lerp(.23, .42, heat), lerp(.53, .5, heat), lerp(.85, .8, heat)); waterM.emissive.setRGB(.1 * heat, .02 * heat, .04);
    const flowA = smooth(TL.up - .3, TL.up + .4, t); const wl = lerp(5.0, 3.6, smooth(TL.up, TL.small + 4, t)); setLevels(wl, lerp(0, 3.5, smooth(TL.out, TL.small + 4, t)));
    const ap = smooth(TL.air, TL.air + .5, t) * (1 - .5 * smooth(TL.up, TL.small, t)); airM.opacity = ap * (.32 + .1 * Math.sin(t * 8));
    bubbles(heat * .8, t, wl); flow(flowA, t);
    colHi.opacity = .45 * smooth(TL.exit, TL.exit + .3, t) * (1 - smooth(TL.out + .5, TL.small, t));
    const z = easeInOut(smooth(TL.air - .4, TL.air + .6, t)) * (1 - easeInOut(smooth(TL.exit, TL.up + .4, t)));
    camOrbit(V3(0, lerp(9, 6.5, z), 0), lerp(lerp(56, 50, clamp(lt / 6)), 42, z), .12 + lt * .02, lerp(.15, .1, z), 38); bloomS = .85;
    hud.push(() => { titleHUD('AL PONERLA AL FUEGO', 'EL AGUA SE CALIENTA', L(t, 'fire', 'air'), 300); titleHUD('EL AIRE Y EL VAPOR DE ENCIMA', 'SE EXPANDEN', L(t, 'air', 'push'), 300);
      titleHUD('ESA PRESIÓN EMPUJA', 'EL AGUA HACIA ABAJO…', L(t, 'push', 'exit'), 300); titleHUD('…Y LA ÚNICA SALIDA', 'ES SUBIR', L(t, 'exit', 'through'), 300); titleHUD('ATRAVIESA EL CAFÉ', 'Y SALE POR EL TUBO', L(t, 'through'), 300);
      const aa = smooth(TL.push, TL.push + .3, t) * (1 - smooth(TL.exit + .4, TL.exit + .8, t)); if (aa > .01) for (const x of [-3, -1.5, 1.5, 3]) { const p0 = project(V3(x, wl + 2.6, 0)), p1 = project(V3(x, wl + .5, 0)); arrowXY(p0.x, p0.y, p1.x, p1.y + Math.sin(t * 6) * 4, aa, '#ffa060', 12); }
      callout(V3(2.2, wl + 1.6, 0), 40, -330, 'AIRE + VAPOR', null, smooth(TL.air + .3, TL.air + .6, t) * (1 - smooth(TL.exit, TL.exit + .3, t)), '#ffa060'); });
  } else if (t < TL.valve) {
    // D · presión: ≈ 1,5 atm frente a 9 atm del espresso
    CUT.constant = 0; flames(1); fire.intensity = 2; const lt = t - TL.small; const wl = lerp(5.0, 3.6, smooth(TL.up, TL.small + 4, t)); setLevels(wl, lerp(0, 3.5, smooth(TL.out, TL.small + 4, t))); flow(1, t); bubbles(.6, t, wl); waterM.color.setRGB(.55, .35, .5);
    camOrbit(V3(0, 9, 0), 60 + lt * .5, .3 + lt * .04, .15, 38); dim = .55 * smooth(TL.small, TL.small + .5, t);
    hud.push(() => { titleHUD('LA PRESIÓN ES', 'PEQUEÑA', L(t, 'small', 'espresso'), 300); titleHUD('POR ESO NO ES UN', 'ESPRESSO DE VERDAD', L(t, 'espresso'), 300);
      const ga = smooth(TL.atm - .3, TL.atm + .1, t); gauge(W / 2 - (t > TL.espresso ? 220 : 0), 1450, 150, lerp(0, 1.5 / 10, easeOut(clamp((t - TL.atm) / .8))), 'CAFETERA ITALIANA', '1,5 atm', ga, '#e3a372');
      const ea = smooth(TL.espresso, TL.espresso + .3, t); gauge(W / 2 + 220, 1450, 150, lerp(0, .9, easeOut(clamp((t - TL.nine) / .8))), 'ESPRESSO', t > TL.nine ? '9 atm' : '', ea, '#ff6a4a'); });
  } else if (t < TL.gurgle) {
    // E · válvula de seguridad: el café se apelmaza, la presión sube, la válvula deja escapar el vapor
    CUT.constant = 0; const lt = t - TL.valve; setLevels(3.6, 3.5); waterM.color.setRGB(.55, .35, .5);
    const clog = smooth(TL.clog, TL.clog + .6, t); coffeeBed.scale.set(1, lerp(1, .82, clog), 1); coffeeM.emissive.setRGB(.25 * clog * (1 - smooth(TL.escape, TL.escape + .6, t)), 0, 0);
    flow(1 - clog, t); const pr = clamp(smooth(TL.clog, TL.escape, t) * 1.1) * (1 - .6 * smooth(TL.escape + .2, TL.burst + .5, t)); airM.opacity = .1 + pr * .25;
    const open0 = 0, open = smooth(TL.escape, TL.escape + .2, t) * (1 - smooth(TL.burst + .8, TL.gurgle, t)); valvePin.position.x = .8 + open * .7; valveM.emissive.setRGB(.6 * smooth(TL.valve + .2, TL.valve + .6, t), .3 * smooth(TL.valve + .2, TL.valve + .6, t), .05);
    steamJet(open, t, valveG.localToWorld(V3(1.5, 0, 0)), V3(4.95, 0, -.45).normalize());
    const z = easeInOut(smooth(TL.valve - .2, TL.valve + .8, t)) * (1 - easeInOut(smooth(TL.clog - .4, TL.clog + .4, t))) + easeInOut(smooth(TL.escape - .3, TL.escape + .3, t)) * .7; bloomS = .6; rim.intensity = lerp(.5, 0, clamp(z)); flames(1 - clamp(z * 1.6)); fire.intensity = 2 * (1 - clamp(z * 1.6));
    camOrbit(V3(lerp(0, 5, z), lerp(8, 5, z), lerp(0, 1.5, z)), lerp(56, 26, z), lerp(.5, .8, z), lerp(.15, .1, z), 38); CUT.constant = 0;
    hud.push(() => { titleHUD('¿Y ESA VÁLVULA', 'DEL LATERAL?', L(t, 'valve', 'safety'), 300); titleHUD('ES DE', 'SEGURIDAD', L(t, 'safety', 'clog'), 300); titleHUD('SI EL CAFÉ SE APELMAZA', 'Y ATASCA EL FILTRO…', L(t, 'clog', 'escape'), 300); titleHUD('…DEJA ESCAPAR', 'EL VAPOR', L(t, 'escape'), 300);
      callout(valveG.localToWorld(V3(1.2, 0, 0)), -60, -280, 'VÁLVULA', null, smooth(TL.valve + .3, TL.valve + .6, t) * (1 - smooth(TL.clog - .3, TL.clog, t)), '#ffb070');
      bar(W / 2 - 300, 1600, 600, pr, 'PRESIÓN', pr > .9 ? '¡PELIGRO!' : '', smooth(TL.clog, TL.clog + .3, t), pr > .7 ? '#ff5a3a' : '#e3a372'); });
  } else if (t < TL.curious) {
    // F · gorgoteo final: sale vapor en vez de agua → apagar
    CUT.constant = 0; const lt = t - TL.gurgle; const off = smooth(TL.off + .4, TL.off + 1.2, t); flames(1 - off); fire.intensity = 2 * (1 - off); setLevels(lerp(1.2, .5, clamp(lt / 3)), 4.4); waterM.color.setRGB(.55, .35, .5);
    const burst = Math.max(0, Math.sin(t * 9) * Math.sin(t * 5.3)); flow(.35 + .6 * burst * (1 - off * .7), t, .6); steamJet(.4 * burst * (1 - off), t, upp.localToWorld(V3(0, 14.9, 0)), V3(0, 1, 0));
    const bit = smooth(TL.bitter, TL.bitter + .8, t); brewM.color.setRGB(lerp(.35, .16, bit), lerp(.19, .08, bit), lerp(.09, .03, bit));
    camOrbit(V3(0, 11, 0), lerp(46, 52, clamp(lt / 6)), -.2 + lt * .05, .22, 38); bloomS = .9;
    hud.push(() => { titleHUD('EL GORGOTEO DEL FINAL', 'ES LA SEÑAL PARA APAGAR', L(t, 'gurgle', 'steam'), 300); titleHUD('YA SALE VAPOR', 'EN VEZ DE AGUA', L(t, 'steam', 'bitter'), 300); titleHUD('Y EL CAFÉ EMPIEZA', 'A AMARGAR', L(t, 'bitter'), 300);
      callout(upp.localToWorld(V3(.6, 15.2, 0)), 120, -150, 'VAPOR', null, smooth(TL.steam, TL.steam + .3, t) * (1 - smooth(TL.bitter - .2, TL.bitter, t)), '#dfe8ff'); });
  } else if (t < TL.brand) {
    // G · 1933: Bialetti y la lavadora de caldera (agua jabonosa por un tubo central sobre la ropa) → la cafetera
    const lt = t - TL.curious; laund.visible = true; P.mat.size = .8; stove.visible = true; CUT.constant = 0; setLevels(3.6, 3.5); const both = easeInOut(smooth(TL.born - .3, TL.born + .9, t));
    moka.position.set(lerp(40, 9, both), 0, 0); moka.scale.setScalar(lerp(1, 1.1, both)); laund.position.set(lerp(0, -10, both), 0, 0);
    const lf = smooth(TL.laundry, TL.laundry + .6, t); const s = S();
    for (let i = 0; i < 4000 * lf; i++) { const q = ((i + 2000) % P.n) * 4; const u = fract(s[q] + t * .5); let p; const lx = laund.position.x;
      if (u < .45) { const k = u / .45; p = V3(lx + (s[q + 1] - .5) * 1.1, lerp(1, 19.5, k), (s[q + 2] - .5) * 1.1); }
      else { const k = (u - .45) / .55; const a2 = s[q + 1] * 6.283, v = 2.5 + s[q + 3] * 4.5; p = V3(lx + Math.cos(a2) * v * Math.min(1, k * 1.6), 19.8 + 2 * k - 16 * k * k, Math.sin(a2) * v * Math.min(1, k * 1.6)); if (p.y < 4) continue; }
      const w = (s[q + 3] > .7 ? 1.4 : 1) * .8; P.push(p.x, p.y, p.z, 1.2 * w * lf, 1.6 * w * lf, 2.4 * w * lf); }
    for (let i = 0; i < 500; i++) { const q = ((i + 9000) % P.n) * 4; const age = fract(s[q] + t * 1.6); const a2 = s[q + 1] * 6.283, r = Math.sqrt(s[q + 2]) * 7; const f = (1 - age) * .9; P.push(laund.position.x + Math.cos(a2) * r, -2.5 + age * 2.2, Math.sin(a2) * r, 2.2 * f, .8 * f, .2 * f); }
    colHi.opacity = .55 * smooth(TL.rises, TL.rises + .4, t); if (both > .1) flow(both, t);
    flames(both, 0);
    const cx = lerp(laund.position.x, 0, both); camOrbit(V3(cx, lerp(10, 9, both), 0), lerp(lerp(70, 62, clamp(lt / 5)), 96, both), lerp(-.25 + lt * .04, .12, both), lerp(.3, .2, both), 38); dim = 0;
    hud.push(() => { titleHUD('LO MÁS CURIOSO ES', 'DE DÓNDE SALIÓ LA IDEA', L(t, 'curious', 'year'), 300); bigStat('', '1933', 400, L(t, 'year', 'laundry'), clamp((t - TL.year) / 1.2)); txt('ALFONSO BIALETTI', W / 2, 480, 34, { spacing: 6, weight: 700, alpha: smooth(TL.bialetti, TL.bialetti + .3, t) * (1 - smooth(TL.laundry - .1, TL.laundry + .1, t)), fill: '#e3a372' });
      titleHUD('UNA VIEJA', 'LAVADORA DE CALDERA', L(t, 'laundry', 'rises'), 300); titleHUD('EL AGUA SUBÍA POR UN TUBO', 'Y CAÍA SOBRE LA ROPA', L(t, 'rises', 'born'), 300);
      callout(laund.localToWorld(V3(.9, 14, 0)), 120, -200, 'TUBO CENTRAL', null, smooth(TL.rises, TL.rises + .3, t) * (1 - smooth(TL.born - .2, TL.born, t)), '#ffb070');
      titleHUD('TU CAFETERA NACIÓ', 'MIRANDO UNA LAVADORA', L(t, 'born'), 300); });
    stove.position.x = lerp(laund.position.x, moka.position.x, both);
  } else {
    // H · marca
    const lt = t - TL.brand; CUT.constant = 0; setLevels(3.6, 3.5); flames(.8); flow(.6, t); camOrbit(V3(0, 9, 0), 58 + lt * 3, .3 + lt * .06, .2, 38); dim = smooth(0, .8, lt) * .6; expo = 1.05;
    hud.push(() => drawBrand(lt - .3)); fade = smooth(TL.end - .6, TL.end, t) * .3;
  }
  if (!(t >= TL.curious && t < TL.brand)) stove.position.x = 0;
  if (COVER) { CUT.constant = 0; camOrbit(V3(0, 15.5, 0), 56, .3, .12, 38); }
  P.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (dim > 0) hud.unshift(() => { g2.save(); g2.globalAlpha = dim * .7; g2.fillStyle = '#02050b'; g2.fillRect(0, 0, W, H); g2.restore(); });
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
let COVER = false;
function renderCover() { COVER = true; renderFrame(TL.out + 1.2); coverText('¿CÓMO SUBE', 'EL CAFÉ?', 'La cafetera italiana, por dentro'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
