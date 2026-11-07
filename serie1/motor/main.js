// NO LO SABÍAS — "¿Cómo funciona el motor de un coche?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final. Unidades: centímetros.
// Referencia: motor de gasolina de 4 cilindros en línea y 4 tiempos (ciclo Otto). Diámetro 8,6 cm, carrera 8,6 cm (manivela 4,3), biela 14 cm,
// relación de compresión ≈ 10:1. Orden de encendido 1-3-4-2 (cada cilindro explota una vez cada dos vueltas del cigüeñal).
// Presión máxima de combustión ≈ 60 bar sobre un pistón de 58 cm² → ≈ 35 kN ≈ 3,5 toneladas-fuerza.
// A 3.000 rpm: 50 vueltas/s → 25 explosiones/s por cilindro, 100/s en total. Rendimiento térmico típico 25–35 % (máx. ≈ 40 % en los mejores motores).
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, easeIn, rng, V3, g2, camera, Particles, txt, copperGrad, project, callout, titleHUD, fract, camOrbit, bigStat, bar, drawBrand, coverText, finish, arrowXY } from '../../lib/core.js';

const scene = new THREE.Scene(); scene.background = new THREE.Color(0x04060b);
const hemi = new THREE.HemisphereLight(0xc8d8ff, 0x302820, .9); scene.add(hemi);
const key = new THREE.DirectionalLight(0xfff1e0, 2.2); key.position.set(60, 120, 90); scene.add(key);
const rim = new THREE.DirectionalLight(0x7fb0ff, 1.3); rim.position.set(-60, 60, -80); scene.add(rim);
const fill = new THREE.DirectionalLight(0xffe8d8, 1.2); scene.add(fill);
function xray(col, k = 1) { return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  uniforms: { uCol: { value: col.clone() }, uA: { value: k } },
  vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform vec3 uCol; uniform float uA; varying vec3 vN; varying vec3 vV; void main(){ float f=pow(clamp(1.-abs(dot(vN,vV)),0.,1.),2.); gl_FragColor=vec4(uCol*(f*.8+.05)*uA,(f*.7+.04)*uA); }` }); }
const M = (c, r = .5, m = .3, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: e });
const box = (w, h, d, mat, x = 0, y = 0, z = 0, parent = scene) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; };
const cylX = (r, len, mat, parent, seg = 32) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mat); m.rotation.z = Math.PI / 2; parent.add(m); return m; };
const tube = (pts, r, mat, parent = scene) => { const c = new THREE.CatmullRomCurve3(pts); const m = new THREE.Mesh(new THREE.TubeGeometry(c, 48, r, 12, false), mat); parent.add(m); return { m, c }; };

// ==========================================================================
// GEOMETRÍA DEL MOTOR
// ==========================================================================
const XS = [-13.5, -4.5, 4.5, 13.5], OFF = [0, 180, 540, 360];
const R = 4.3, L = 14, BORE = 4.3, CROWN = 3, HEAD = 22.26; // corona del pistón = bulón + 3; PMS: 21.3 → cámara ≈ 0,96 cm → 10:1
const pinY = a => R * Math.cos(a) + Math.sqrt(L * L - Math.pow(R * Math.sin(a), 2));
const steel = M(0x9aa3ad, .3, .9), dark = M(0x30343c, .6, .5), alu = M(0xc4c9cf, .35, .7), copper = M(0xc07a45, .35, .8);
const engine = new THREE.Group(); scene.add(engine);
// bloque y culata en rayos X
const blockX = xray(new THREE.Color(.25, .5, .9), .55); const blk = box(40, 17, 12, blockX, 0, 13.8, 0, engine);
const crankcaseX = box(44, 13, 14, xray(new THREE.Color(.2, .38, .7), .4), 0, -1, 0, engine);
const headX = xray(new THREE.Color(1.1, .6, .3), .5); box(40, 7, 13, headX, 0, 25.8, 0, engine);
const liners = XS.map(x => { const m = new THREE.Mesh(new THREE.CylinderGeometry(BORE + .05, BORE + .05, 15.3, 48, 1, true), xray(new THREE.Color(.45, .85, 1.3), .9)); m.position.set(x, 14.65, 0); engine.add(m); return m; });
// cigüeñal: apoyos, muñequillas, brazos y contrapesos
const crank = new THREE.Group(); scene.add(crank);
const crankMat = M(0xb8c0c8, .25, .95), crankGlow = M(0xb8c0c8, .25, .95, 0x000000);
const mains = []; for (const x of [-18, -9, 0, 9, 18]) { const m = cylX(2.6, 2.6, crankGlow, crank); m.position.x = x; mains.push(m); }
const throws = XS.map((x, i) => { const g = new THREE.Group(); g.position.x = x; crank.add(g);
  const pin = cylX(2.2, 3.4, crankGlow, g); pin.position.y = R;
  for (const s of [-1, 1]) { const w = box(1.1, R + 5.4, 5.2, crankGlow, s * 2.2, R / 2 - .6, 0, g); const cw = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5.6, 1.1, 32, 1, false, Math.PI * .5 + .5, Math.PI - 1), crankGlow); cw.rotation.z = Math.PI / 2; cw.position.x = s * 2.2; g.add(cw); }
  return g; });
const flywheel = new THREE.Group(); flywheel.position.x = 22.5; crank.add(flywheel); { cylX(10, 1.8, dark, flywheel, 64); const rimT = cylX(10.2, 1.2, steel, flywheel, 64); for (let k = 0; k < 6; k++) { const h = cylX(1.2, 2, M(0x15181c, .6, .3), flywheel, 16); const a = k * Math.PI / 3; h.position.set(0, Math.cos(a) * 6, Math.sin(a) * 6); } }
const pulley = new THREE.Group(); pulley.position.x = -21.5; crank.add(pulley); cylX(5, 2.2, dark, pulley); { const mk = box(.6, 2, 2.4, M(0xffffff, .5, 0, 0x555555), 0, 4, 0, pulley); }
// pistones, bielas, válvulas, bujías
const pistonMat = alu, rodMat = steel;
const cyl = XS.map((x, i) => {
  const piston = new THREE.Group(); scene.add(piston); const pb = new THREE.Mesh(new THREE.CylinderGeometry(BORE - .1, BORE - .1, 5, 40), pistonMat); pb.position.y = .5; piston.add(pb);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(BORE - .1, BORE - .1, .2, 40), M(0x8a8f96, .45, .6, 0x000000)); crown.position.y = 2.95; piston.add(crown);
  for (const y of [2.4, 1.9, 1.4]) { const rg = new THREE.Mesh(new THREE.TorusGeometry(BORE - .08, .08, 6, 40), M(0x30343c, .4, .8)); rg.rotation.x = Math.PI / 2; rg.position.y = y; piston.add(rg); }
  const gp = cylX(.8, 5, steel, piston);
  const rodG = new THREE.Group(); scene.add(rodG); const rodGeo = new THREE.BoxGeometry(1.3, 1, .9); rodGeo.translate(0, .5, 0); const rod = new THREE.Mesh(rodGeo, rodMat); rodG.add(rod);
  const big = new THREE.Mesh(new THREE.TorusGeometry(2.6, .6, 8, 24), rodMat); big.rotation.y = Math.PI / 2; rodG.add(big);
  const valves = [-2.1, 2.1].map(z => { const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g); const head = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.1, .35, 24), M(0xd0d4d8, .3, .8)); g.add(head);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.28, .28, 7, 8), M(0xd0d4d8, .3, .8)); stem.position.y = 3.6; g.add(stem); const spr = new THREE.Mesh(new THREE.TorusGeometry(.9, .12, 6, 16), M(0x70a0ff, .4, .4)); spr.rotation.x = Math.PI / 2; spr.position.y = 6; g.add(spr); return g; });
  const plug = new THREE.Group(); plug.position.set(x, HEAD, 0); scene.add(plug); { const e = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, 3, 12), M(0x9aa3ad, .3, .9)); e.position.y = 1.4; plug.add(e); const cer = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, 4, 16), M(0xf0ece4, .3, 0)); cer.position.y = 5; plug.add(cer); const tip = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, 1, 12), M(0x2c2c2c, .4, .5)); tip.position.y = 7.4; plug.add(tip); }
  const light = new THREE.PointLight(0xff8a3a, 0, 60, 1.2); light.position.set(x, 19, 0); scene.add(light);
  return { x, piston, crown, rodG, rod, valves, plug, light, i };
});
// conductos: admisión (−z, azul) y escape (+z, cobre)
const inMat = xray(new THREE.Color(.3, .65, 1.2), .8), exMat = xray(new THREE.Color(1.3, .6, .3), .8);
const runners = XS.map(x => ({ inn: tube([V3(x, 24.5, -2.1), V3(x, 27.5, -4.5), V3(x, 28, -9), V3(x, 27.5, -13)], 1.3, inMat, engine), ex: tube([V3(x, 24.5, 2.1), V3(x, 26.5, 5), V3(x, 25, 9), V3(x, 22, 11.5)], 1.3, exMat, engine) }));
box(40, 4, 4, inMat, 0, 27.5, -14, engine);
const collector = tube([V3(-13.5, 22, 11.5), V3(0, 21, 12), V3(16, 19, 12), V3(22, 12, 13), V3(23, -4, 14)], 2.0, exMat, engine);
// radiador (delante del motor) y manguitos
const RZ = 30; const rad = new THREE.Group(); rad.position.set(0, 9, RZ); scene.add(rad);
const finTex = (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 512; const x = c.getContext('2d'); x.fillStyle = '#1a1d22'; x.fillRect(0, 0, 512, 512);
  x.strokeStyle = '#5a616b'; x.lineWidth = 2; for (let i = 0; i < 512; i += 6) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 512); x.stroke(); } x.fillStyle = '#8a929c'; for (let j = 12; j < 512; j += 32) x.fillRect(0, j, 512, 7); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const radMat = new THREE.MeshStandardMaterial({ map: finTex, roughness: .6, metalness: .5, emissive: new THREE.Color(0, 0, 0) });
const radCore = box(28, 18, 2.5, radMat, 0, 0, 0, rad); box(30, 2, 4, dark, 0, 10, 0, rad); box(30, 2, 4, dark, 0, -10, 0, rad); for (const s of [-1, 1]) box(2, 22, 4, dark, s * 15, 0, 0, rad);
const hoseMat = M(0x15171a, .7, .1); const hoseTop = tube([V3(19, 26, 4), V3(21, 25, 14), V3(16, 19, 24), V3(12, 17, RZ - 2)], 1.4, hoseMat); const hoseBot = tube([V3(-12, 1, RZ - 2), V3(-16, -2, 22), V3(-21, 2, 12), V3(-21, 8, 5)], 1.4, hoseMat);
rad.visible = false; hoseTop.m.visible = hoseBot.m.visible = false;

// ==========================================================================
// ESTADO DEL MOTOR
// ==========================================================================
const P = new Particles(14000, { size: .2, seed: 7 }); scene.add(P.obj);
const mod = (a, n) => ((a % n) + n) % n;
const rad2 = d => d * Math.PI / 180;
const vlift = (c, a0, a1) => (c >= a0 && c <= a1) ? Math.sin(Math.PI * (c - a0) / (a1 - a0)) : 0;
const state = [];
function setEngine(th, o = {}) { // th = ángulo de ciclo del cilindro 1 (grados, 720 por ciclo)
  const show = o.show || [1, 1, 1, 1];
  for (const T of throws) T.rotation.x = 0; crank.rotation.x = rad2(th);
  cyl.forEach((C, i) => { const c = mod(th + OFF[i], 720), a = rad2(c); const ca = rad2(th); // todos comparten el cigüeñal; la fase está en la geometría de los codos
    const ta = rad2(mod(OFF[i], 360)); throws[i].rotation.x = ta; // codo del cilindro i
    const yp = pinY(a); C.piston.position.set(C.x, yp, 0); const pz = R * Math.sin(a), py = R * Math.cos(a);
    C.rodG.position.set(C.x, py, pz); const dy = yp - py, dz = -pz; C.rod.scale.y = Math.hypot(dy, dz); C.rod.rotation.x = Math.atan2(dz, dy); C.rodG.rotation.set(0, 0, 0);
    const li = vlift(c, 0, 190), le = vlift(c, 530, 720); C.valves[0].position.y = HEAD - .25 - li * 1.0; C.valves[1].position.y = HEAD - .25 - le * 1.0;
    const vis = !!show[i]; C.piston.visible = C.rodG.visible = vis; C.valves.forEach(v => v.visible = vis); C.plug.visible = vis;
    state[i] = { c, yp, crownY: yp + CROWN, li, le, vis };
  });
  // el grupo de codos gira con el cigüeñal: la rotación del cilindro i ya incluye su fase
}
// Ajuste fino: los codos cuelgan de 'crank' (que gira th); su fase propia es OFF mod 360 (0/180/180/0)
// Gas dentro de cada cilindro, coloreado por tiempo del ciclo
function gasColor(c) {
  if (c < 180) return [.35, .75, 1.15, .75];
  if (c < 360) { const k = (c - 180) / 180; return [lerp(.35, .7, k), lerp(.75, .95, k), lerp(1.15, 1.4, k), lerp(.75, 1.25, k)]; }
  if (c < 540) { const k = (c - 360) / 180; const f = Math.exp(-k * 6); return [lerp(1.3, 2.4, f), lerp(.45, 1.8, f), lerp(.12, 1.0, f), lerp(.75, 1.6, f) * (1 - k * .35)]; }
  const k = (c - 540) / 180; return [.5, .44, .4, .55 * (1 - k * .5)];
}
function gas(i, t, amp = 1, n = 260, o = {}) {
  const S = state[i]; if (!S.vis || amp <= .01) return; const C = cyl[i]; const s = P.seed; const col = o.col || gasColor(S.c); const top = HEAD - .1, bot = S.crownY + .15;
  for (let k = 0; k < n; k++) { const q = ((k + i * 700) % P.n) * 4; const ang = s[q] * 6.283 + t * (1.5 + s[q + 3]); const r = Math.sqrt(s[q + 1]) * (BORE - .35); const y = lerp(bot, top, s[q + 2]);
    const fl = .8 + .4 * Math.sin(t * 9 + k); const A = amp * col[3] * fl; P.push(C.x + Math.cos(ang) * r, y, Math.sin(ang) * r, col[0] * A, col[1] * A, col[2] * A); }
  // corriente de admisión / escape a través de las válvulas
  if (S.li > .05) for (let k = 0; k < 140; k++) { const q = ((k + 3000 + i * 300) % P.n) * 4; const u = fract(s[q] + t * 1.3); let p;
    if (u < .5) { const v = u / .5; p = V3(C.x + (s[q + 1] - .5) * 1.6, lerp(28, 23.2, v), lerp(-11, -2.1, v) + (s[q + 2] - .5) * 1.4); }
    else { const v = (u - .5) / .5; const ang = s[q + 1] * 6.283, r = Math.sqrt(s[q + 2]) * (BORE - .4) * v; p = V3(C.x + Math.cos(ang) * r * .9, lerp(22, bot + 1, v * s[q + 3]), -2.1 * (1 - v) + Math.sin(ang) * r); }
    const A = amp * S.li * .9; P.push(p.x, p.y, p.z, .4 * A, .85 * A, 1.3 * A); }
  if (S.le > .05) for (let k = 0; k < 140; k++) { const q = ((k + 5000 + i * 300) % P.n) * 4; const u = fract(s[q] + t * 1.4); const p = runners[i].ex.c.getPointAt(u);
    const A = amp * S.le * .7; P.push(p.x + (s[q + 1] - .5) * 1.4, p.y + (s[q + 2] - .5) * 1.4, p.z + (s[q + 3] - .5) * 1.4, .7 * A, .55 * A, .45 * A); }
}
// Chispa y explosión
function sparkFx(i, t, k) { if (k <= .01) return; const C = cyl[i]; const s = P.seed; for (let q = 0; q < 60; q++) { const j = ((q + 8000 + i * 80) % P.n) * 4; const ang = s[j] * 6.283 + t * 40, r = s[j + 1] * .9 * (.6 + .4 * Math.sin(t * 50 + q));
    P.push(C.x + Math.cos(ang) * r, HEAD - .25 - s[j + 2] * .5, Math.sin(ang) * r, 2.2 * k, 2.6 * k, 3.4 * k); } }
function fireLight(i, c, boost = 1) { const C = cyl[i]; const k = (c >= 358 && c < 540) ? Math.exp(-(c - 358) / 35) : 0; C.light.intensity = k * 160 * boost; C.light.position.y = state[i].crownY + 1.2; C.crown.material.emissive.setRGB(k * .9, k * .35, k * .08); return k; }

// ==========================================================================
// ÁNGULO DE CIGÜEÑAL EN CADA PLANO
// ==========================================================================
function thetaAt(t) {
  if (t < TL.inside) return 1080 * t;
  if (t < TL.four) return 90 + 216 * (t - TL.inside);
  if (t < TL.intake) return lerp(-150, 0, easeOut(smooth(TL.four, TL.intake, t)));
  if (t < TL.comp) return lerp(0, 180, easeInOut(smooth(TL.intake + .1, TL.comp, t)));
  if (t < TL.spark) return lerp(180, 345, easeInOut(smooth(TL.comp + .1, TL.spark, t)));
  if (t < TL.boom) return lerp(345, 360, smooth(TL.spark, TL.boom, t));
  if (t < TL.exhaust) return 360 + 180 * easeOut(smooth(TL.boom, TL.exhaust - .4, t));
  if (t < TL.how) return lerp(540, 720, easeInOut(smooth(TL.exhaust + .1, TL.how - .2, t)));
  if (t < TL.rpm) return 720 + 160 * (t - TL.how);
  if (t < TL.brand) { const base = 720 + 160 * (TL.rpm - TL.how); const dt = t - TL.rpm, ramp = 1.6; // rampa de 160 a 1800 °/s
    const w0 = 160, w1 = 1800; return base + (dt < ramp ? w0 * dt + (w1 - w0) * dt * dt / (2 * ramp) : w0 * ramp + (w1 - w0) * ramp / 2 + w1 * (dt - ramp)); }
  return 300 * (t - TL.brand);
}

// Pedal de bici (recuadro 2D)
function bikeInset(cx, cy, ang, a) { if (a <= .01) return; g2.save(); g2.globalAlpha = a; g2.fillStyle = 'rgba(4,8,16,.72)'; g2.strokeStyle = 'rgba(227,163,114,.5)'; g2.lineWidth = 2; g2.beginPath(); g2.roundRect(cx - 190, cy - 330, 380, 470, 24); g2.fill(); g2.stroke();
  const pr = 85; const px = cx + Math.sin(ang) * pr, py = cy - Math.cos(ang) * pr; const hip = { x: cx - 40, y: cy - 260 }; const Lt = 175, Ls = 175;
  const dx = px - hip.x, dy = py - hip.y, d = Math.min(Math.hypot(dx, dy), Lt + Ls - 1); const base = Math.atan2(dy, dx), k = Math.acos((Lt * Lt + d * d - Ls * Ls) / (2 * Lt * d)); const kx = hip.x + Math.cos(base - k) * Lt, ky = hip.y + Math.sin(base - k) * Lt;
  g2.lineCap = 'round'; g2.strokeStyle = '#7fd4ff'; g2.lineWidth = 22; g2.beginPath(); g2.moveTo(hip.x, hip.y); g2.lineTo(kx, ky); g2.lineTo(px, py); g2.stroke();
  g2.strokeStyle = '#8a929c'; g2.lineWidth = 6; g2.beginPath(); g2.arc(cx, cy, 52, 0, 7); g2.stroke(); g2.strokeStyle = '#e3a372'; g2.lineWidth = 12; g2.beginPath(); g2.moveTo(cx, cy); g2.lineTo(px, py); g2.stroke();
  g2.fillStyle = '#ffe2c0'; g2.fillRect(px - 26, py - 7, 52, 14); g2.beginPath(); g2.arc(cx, cy, 10, 0, 7); g2.fill(); g2.restore();
  txt('PIERNA = BIELA', cx, cy + 105, 22, { spacing: 4, alpha: a * .85, fill: '#7fd4ff' }); }

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
const STROKES = [['1 · ADMISIÓN', 'ENTRA AIRE + GASOLINA', '#7fd4ff'], ['2 · COMPRESIÓN', 'APRIETA LA MEZCLA', '#b8e6ff'], ['3 · EXPLOSIÓN', 'LA MEZCLA ESTALLA', '#ffb27a'], ['4 · ESCAPE', 'SALEN LOS GASES', '#c8c0b8']];
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .5; camera.far = 3000;
  let bloomS = .7, flash = 0, ca = .0013, fade = 0, grain = .035, expo = 1, dim = 0;
  P.begin(); P.mat.size = .2; rad.visible = false; hoseTop.m.visible = hoseBot.m.visible = false; blockX.uniforms.uCol.value.setRGB(.25, .5, .9); headX.uniforms.uA.value = .5; blockX.uniforms.uA.value = .55;
  crankGlow.emissive.setRGB(0, 0, 0); radMat.emissive.setRGB(0, 0, 0); cyl.forEach(C => { C.light.intensity = 0; C.crown.material.emissive.setRGB(0, 0, 0); });
  for (const c of ['inside', 'four', 'boom', 'how', 'crank', 'rpm', 'curious', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const th = thetaAt(t); const hud = [];
  if (t < TL.inside) {
    // A · miles de explosiones por minuto
    setEngine(th); for (let i = 0; i < 4; i++) { gas(i, t, 1, 200); const k = fireLight(i, state[i].c); if (k > .3) flash = Math.max(flash, (k - .3) * .12); }
    camOrbit(V3(0, 11, 0), lerp(118, 98, easeOut(t / TL.inside)), .62 + t * .04, .22, 38); P.mat.size = 1.0; bloomS = 1.0;
    hud.push(() => { titleHUD('TU COCHE FUNCIONA CON', 'MILES DE EXPLOSIONES', smooth(.1, .4, t), 300); txt('POR MINUTO', W / 2, 440, 40, { font: 'Montserrat', weight: 800, alpha: smooth(1.6, 1.9, t), fill: copperGrad(300, 780, 440, clamp(t / 3)) }); });
  } else if (t < TL.four) {
    // B · cilindros, y en cada uno un pistón que sube y baja
    const lt = t - TL.inside; setEngine(th); for (let i = 0; i < 4; i++) gas(i, t, .6, 150);
    camOrbit(V3(lerp(0, -6, smooth(1.8, 3.5, lt)), lerp(13, 15, lt / 4), 0), lerp(95, 62, easeInOut(smooth(0, 3.8, lt))), .5 - lt * .05, .14, 38); P.mat.size = .9;
    liners.forEach((m, i) => m.material.uniforms.uA.value = .9 + .9 * smooth(.2, .7, lt) * (1 - smooth(TL.piston - TL.inside, TL.piston - TL.inside + .5, lt)));
    hud.push(() => { titleHUD('DENTRO DEL MOTOR', 'HAY CILINDROS', smooth(0, .3, lt) * (1 - smooth(TL.piston - TL.inside - .1, TL.piston - TL.inside + .1, lt)), 300);
      XS.forEach((x, i) => callout(V3(x, 23, 0), i < 2 ? -30 : 30, -150 - i * 0, String(i + 1), null, smooth(.3 + i * .15, .7 + i * .15, lt) * (1 - smooth(TL.piston - TL.inside - .2, TL.piston - TL.inside, lt)), '#7fd4ff'));
      titleHUD('EN CADA UNO, UN PISTÓN', 'QUE SUBE Y BAJA', smooth(TL.piston - TL.inside, TL.piston - TL.inside + .3, lt), 300);
      callout(V3(XS[1], state[1].crownY, 0), -60, 160, 'PISTÓN', null, smooth(TL.piston - TL.inside + .2, TL.piston - TL.inside + .6, lt), '#e3a372'); });
  } else if (t < TL.how) {
    // C/D · cuatro tiempos (vista en sección del cilindro 1)
    setEngine(th, { show: [1, 0, 0, 0] }); const S = state[0];
    let sk = 0; if (t > TL.spark + 1.2 && t < TL.boom) sk = (.6 + .4 * Math.sin(t * 90)) * smooth(TL.spark + 1.2, TL.spark + 1.4, t);
    sparkFx(0, t, sk); cyl[0].light.intensity = sk * 120; cyl[0].light.position.y = HEAD - 1; cyl[0].light.color.setRGB(.6, .75, 1);
    if (t >= TL.boom) { cyl[0].light.color.setRGB(1, .55, .25); const k = fireLight(0, S.c, 1.4); bloomS = 1 + k * .6; }
    gas(0, t, t < TL.four + .1 ? .6 : 1, 520);
    const boomK = t > TL.boom ? Math.exp(-(t - TL.boom) * 3) : 0; const sh = boomK * .35;
    camOrbit(V3(-13.5, lerp(17, 16, smooth(TL.four, TL.intake, t)) + Math.sin(t * 61) * sh, 0 + Math.cos(t * 53) * sh), lerp(66, 60, smooth(TL.four, TL.how, t)), -Math.PI / 2 + .12 + (t - TL.four) * .003, .05, 38); P.mat.size = .7; blockX.uniforms.uA.value = .25; headX.uniforms.uA.value = .4;
    liners.forEach(m => m.material.uniforms.uA.value = .9);
    const sIdx = t < TL.intake ? -1 : t < TL.comp ? 0 : t < TL.spark ? 1 : t < TL.exhaust ? 2 : 3; const sStart = [TL.intake, TL.comp, TL.spark, TL.exhaust][sIdx] ?? TL.four, sEnd = [TL.comp, TL.spark, TL.exhaust, TL.how][sIdx] ?? TL.intake;
    hud.push(() => {
      bigStat('TODO PASA EN', '4 TIEMPOS', 380, smooth(TL.four, TL.four + .25, t) * (1 - smooth(TL.intake - .15, TL.intake + .05, t)), clamp((t - TL.four) / 1.5));
      if (sIdx >= 0) { const [a, b, col] = STROKES[sIdx]; const al = smooth(sStart, sStart + .25, t) * (1 - smooth(sEnd - .15, sEnd + .05, t)); titleHUD(a, b, al, 260);
        // marcador de los cuatro tiempos
        for (let k = 0; k < 4; k++) { g2.save(); g2.globalAlpha = (k === sIdx ? 1 : .3) * smooth(TL.intake, TL.intake + .3, t); g2.fillStyle = k === sIdx ? STROKES[k][2] : '#ffffff'; g2.fillRect(W / 2 - 230 + k * 120, 420, 100, 8); g2.restore(); } }
      if (sIdx === 0) { callout(V3(-13.5, 23.5, -2.1), 60, 230, 'VÁLVULA DE ADMISIÓN', null, smooth(TL.intake + .5, TL.intake + .9, t), '#7fd4ff'); }
      if (sIdx === 1) { bigStat('', '≈ 10 VECES', 1500, smooth(TL.comp + 2.0, TL.comp + 2.4, t), clamp((t - TL.comp - 2) / 1.2)); txt('MENOS VOLUMEN', W / 2, 1590, 34, { weight: 300, spacing: 4, alpha: smooth(TL.comp + 2.2, TL.comp + 2.6, t) }); }
      if (sIdx === 2) { callout(V3(-13.5, HEAD + 3, 0), 80, -130, 'BUJÍA', 'miles de voltios', smooth(TL.spark + .3, TL.spark + .7, t) * (1 - smooth(TL.boom - .2, TL.boom, t)), '#b8e6ff');
        bigStat('FUERZA SOBRE EL PISTÓN: UNAS', '3 TONELADAS', 1500, smooth(TL.tons, TL.tons + .3, t), clamp((t - TL.tons) / 1.2));
        if (t > TL.power) arrowXY(W / 2, 1000, W / 2, 1250, smooth(TL.power, TL.power + .6, t) * (1 - smooth(TL.exhaust - .2, TL.exhaust, t)), '#ffb27a', 16); }
      if (sIdx === 3) callout(V3(-13.5, 25.5, 4.5), -60, 260, 'HACIA EL ESCAPE', null, smooth(TL.exhaust + .6, TL.exhaust + 1, t), '#c8c0b8'); });
    flash = Math.max(flash, flashAt(t, TL.boom, .4, .3));
  } else if (t < TL.rpm) {
    // E/F · ¿cómo se convierte el sube y baja en giro? el cigüeñal, como los pedales de una bici
    const lt = t - TL.how; setEngine(th); for (let i = 0; i < 4; i++) { gas(i, t, .5, 120); fireLight(i, state[i].c, .5); }
    const ck = smooth(TL.crank - TL.how - .2, TL.crank - TL.how + 1.2, lt); const glow = smooth(TL.crank - TL.how, TL.crank - TL.how + .6, lt);
    crankGlow.emissive.setRGB(glow * .3, glow * .14, glow * .04); blockX.uniforms.uA.value = lerp(.55, .2, ck); headX.uniforms.uA.value = lerp(.5, .15, ck);
    camOrbit(V3(0, lerp(12, 6, ck), 0), lerp(105, 88, ck), lerp(.75, .55, ck) + lt * .02, lerp(.25, .32, ck), 38); P.mat.size = .9;
    const pushA = smooth(TL.push - TL.how, TL.push - TL.how + .3, lt);
    hud.push(() => { titleHUD('¿Y CÓMO SE CONVIERTE', 'ESE SUBE Y BAJA EN GIRO?', smooth(0, .3, lt) * (1 - smooth(TL.crank - TL.how - .1, TL.crank - TL.how + .1, lt)), 300);
      titleHUD('CON EL CIGÜEÑAL', 'UN EJE CON CODOS', smooth(TL.crank - TL.how, TL.crank - TL.how + .3, lt) * (1 - smooth(TL.bike - TL.how - .1, TL.bike - TL.how + .1, lt)), 300);
      titleHUD('COMO LOS PEDALES', 'DE UNA BICI', smooth(TL.bike - TL.how, TL.bike - TL.how + .3, lt) * (1 - smooth(TL.push - TL.how - .1, TL.push - TL.how + .1, lt)), 300);
      titleHUD('CADA PISTÓN EMPUJA UN CODO', 'Y EL EJE GIRA', pushA, 300);
      bikeInset(W / 2, 1480, rad2(th), smooth(TL.bike - TL.how, TL.bike - TL.how + .4, lt));
      callout(V3(XS[2], 0, 0), 120, 170, 'CIGÜEÑAL', null, smooth(TL.crank - TL.how + .4, TL.crank - TL.how + .8, lt) * (1 - smooth(TL.bike - TL.how - .2, TL.bike - TL.how, lt)), '#ffb27a'); });
  } else if (t < TL.curious) {
    // G · 3.000 rpm → 25 explosiones/s por cilindro, 100 en total
    const lt = t - TL.rpm; setEngine(th); let any = 0; for (let i = 0; i < 4; i++) { gas(i, t, 1, 200); any = Math.max(any, fireLight(i, state[i].c)); }
    flash = Math.max(flash, any * .08); bloomS = 1.1; const sh = smooth(0, 1.6, lt) * .18;
    camOrbit(V3(Math.sin(t * 47) * sh, 11 + Math.cos(t * 59) * sh, 0), lerp(80, 100, smooth(0, 6, lt)), .9 - lt * .06, .2, 38); P.mat.size = 1.0;
    const rpm = Math.round(lerp(800, 3000, easeOut(smooth(0, 1.6, lt))) / 10) * 10;
    hud.push(() => { txt('REVOLUCIONES POR MINUTO', W / 2, 230, 24, { spacing: 7, alpha: smooth(0, .3, lt) * .8, fill: '#e3a372' }); txt(rpm >= 1000 ? Math.floor(rpm / 1000) + '.' + String(rpm % 1000).padStart(3, '0') : String(rpm), W / 2, 330, 112, { font: 'Montserrat', weight: 800, alpha: smooth(0, .3, lt), fill: copperGrad(200, 880, 330, clamp(lt / 2)) });
      bigStat('EXPLOSIONES POR SEGUNDO EN CADA CILINDRO', '25', 1500, smooth(TL.x25 - TL.rpm, TL.x25 - TL.rpm + .3, lt) * (1 - smooth(TL.four_cyl - TL.rpm - .1, TL.four_cyl - TL.rpm + .1, lt)), clamp((lt - 2) / 1.5));
      txt('× 4 CILINDROS', W / 2, 1330, 34, { weight: 300, spacing: 4, alpha: smooth(TL.four_cyl - TL.rpm, TL.four_cyl - TL.rpm + .3, lt) });
      bigStat('EXPLOSIONES CADA SEGUNDO', '100', 1520, smooth(TL.x100 - TL.rpm, TL.x100 - TL.rpm + .25, lt), clamp((t - TL.x100) / 1.2));  });
  } else if (t < TL.brand) {
    // H · solo un tercio mueve el coche; el resto es calor → radiador
    const lt = t - TL.curious; setEngine(th); for (let i = 0; i < 4; i++) { gas(i, t, .8, 160); fireLight(i, state[i].c, .6); }
    const hk = smooth(TL.heat - TL.curious, TL.heat - TL.curious + 1.5, lt), rk = smooth(TL.radiator - TL.curious - .6, TL.radiator - TL.curious + .6, lt);
    blockX.uniforms.uCol.value.setRGB(lerp(.25, 1.4, hk), lerp(.5, .45, hk), lerp(.9, .2, hk)); blockX.uniforms.uA.value = .55 + hk * .3;
    rad.visible = true; hoseTop.m.visible = hoseBot.m.visible = true; radMat.emissive.setRGB(rk * .5, rk * .16, rk * .03);
    if (hk > .02) { // calor: por el escape y por el circuito de refrigeración
      const s = P.seed; for (let k = 0; k < 500; k++) { const q = ((k + 9000) % P.n) * 4; const u = fract(s[q] + t * .45); const p = hoseTop.c.getPointAt(u); P.push(p.x + (s[q + 1] - .5), p.y + (s[q + 2] - .5), p.z + (s[q + 3] - .5), 1.6 * hk, .6 * hk, .15 * hk); }
      for (let k = 0; k < 700; k++) { const q = ((k + 10000) % P.n) * 4; const u = fract(s[q] + t * .35); const x = (s[q + 1] - .5) * 26, y = lerp(8, -8, u); const c = 1 - u; P.push(x, 9 + y, RZ + 1.6, lerp(.3, 1.6, c) * hk, lerp(.6, .6, c) * hk, lerp(1.2, .15, c) * hk); }
      for (let k = 0; k < 400; k++) { const q = ((k + 11000) % P.n) * 4; const u = fract(s[q] + t * .4); const p = hoseBot.c.getPointAt(u); P.push(p.x + (s[q + 1] - .5), p.y + (s[q + 2] - .5), p.z + (s[q + 3] - .5), .35 * hk, .7 * hk, 1.3 * hk); }
      for (let k = 0; k < 600; k++) { const q = ((k + 12000) % P.n) * 4; const age = fract(s[q] + t * .5); const x = (s[q + 1] - .5) * 28, y = 9 + (s[q + 2] - .5) * 16; const f = (1 - age) * hk * rk; P.push(x + Math.sin(t * 3 + k) * age, y + age * 4, RZ + 2 + age * 22, 1.3 * f, .5 * f, .15 * f); }
      for (let k = 0; k < 500; k++) { const q = ((k + 13000) % P.n) * 4; const age = fract(s[q] + t * .6); const p = V3(0, 30 + age * 18, 0).add(V3((s[q + 1] - .5) * 40, 0, (s[q + 2] - .5) * 12)); const f = (1 - age) * hk * .7; P.push(p.x, p.y, p.z, 1.4 * f, .5 * f, .12 * f); }
    }
    camOrbit(V3(0, 10, lerp(10, 14, rk)), lerp(118, 112, rk), .3 + lt * .02, lerp(.42, .5, rk), 38); P.mat.size = 1.1;
    hud.push(() => { titleHUD('Y LO MÁS CURIOSO', 'DE TODA LA GASOLINA…', smooth(0, .3, lt) * (1 - smooth(TL.third - TL.curious - .1, TL.third - TL.curious + .1, lt)), 260);
      bigStat('SOLO MUEVE EL COCHE', '≈ 1/3', 330, smooth(TL.third - TL.curious, TL.third - TL.curious + .3, lt) * (1 - smooth(TL.heat - TL.curious - .1, TL.heat - TL.curious + .1, lt)), clamp((lt - 2.6) / 1.2));
      const ba = smooth(TL.third - TL.curious + .2, TL.third - TL.curious + .6, lt); bar(140, 1440, 800, .3 * smooth(TL.third - TL.curious + .2, TL.third - TL.curious + 1.2, lt), 'MOVIMIENTO', '≈ 30 %', ba, '#7fd4ff');
      bar(140, 1560, 800, .7 * smooth(TL.heat - TL.curious, TL.heat - TL.curious + 1.2, lt), 'CALOR', '≈ 70 %', smooth(TL.heat - TL.curious, TL.heat - TL.curious + .4, lt), '#ff8a4a');
      titleHUD('EL RESTO SE ESCAPA', 'COMO CALOR', smooth(TL.heat - TL.curious, TL.heat - TL.curious + .3, lt) * (1 - smooth(TL.radiator - TL.curious - .1, TL.radiator - TL.curious + .1, lt)), 260);
      titleHUD('POR ESO NECESITA', 'UN RADIADOR', smooth(TL.radiator - TL.curious, TL.radiator - TL.curious + .3, lt), 260);
      callout(V3(10, 16, RZ + 1), 60, -100, 'RADIADOR', null, smooth(TL.radiator - TL.curious + .2, TL.radiator - TL.curious + .6, lt), '#ff8a4a'); });
  } else {
    // I · marca
    const lt = t - TL.brand; setEngine(th); for (let i = 0; i < 4; i++) { gas(i, t, .6, 120); fireLight(i, state[i].c, .5); }
    camOrbit(V3(0, 10, 0), 110 + lt * 6, .6 + lt * .05, .2, 38); expo = .9; fade = Math.min(.5, lt * .45); dim = smooth(0, .8, lt) * .6; P.mat.size = 1.0;
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  fill.position.copy(camera.position).add(V3(0, 30, 0));
  P.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (dim > 0) hud.unshift(() => { g2.save(); g2.globalAlpha = dim * .7; g2.fillStyle = '#02050b'; g2.fillRect(0, 0, W, H); g2.restore(); });
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
function renderCover() { renderFrame(1.25); coverText('¿CÓMO FUNCIONA', 'UN MOTOR?', 'Miles de explosiones por minuto'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
