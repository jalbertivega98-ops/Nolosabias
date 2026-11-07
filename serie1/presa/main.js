// NO LO SABÍAS — "¿Por qué no se rompe una presa?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final. Unidades: metros.
// Presa de gravedad genérica (125 m de alto, coronación 12 m, base 95 m) y presa bóveda genérica. Presión hidrostática p = ρ·g·h:
// a 100 m ≈ 9,8 bar ≈ 10 veces la presión atmosférica. Central a pie de presa: tubería forzada → turbina Francis → generador síncrono.
// Tres Gargantas: 22.500 MW (≈ 20 reactores de ~1.100 MW). Hoover: el hormigón habría tardado ~125 años en enfriarse; se enfrió con ~937 km de tubo de 1".
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, easeIn, rng, V3, g2, camera, Particles, txt, copperGrad, project, callout, titleHUD, fract, camOrbit, bigStat, bar, drawBrand, coverText, finish, arrowXY, noise1 } from '../../lib/core.js';

const scene = new THREE.Scene(); scene.background = new THREE.Color(0x05070d);
const hemi = new THREE.HemisphereLight(0xc8d8ff, 0x4a3c30, 1.5); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffd8b0, 2.4); sun.position.set(500, 600, 700); scene.add(sun);
const fillL = new THREE.DirectionalLight(0x9ab8ff, .9); fillL.position.set(-500, 300, 800); scene.add(fillL);
const M = (c, r = .5, m = .3, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: e });
const box = (w, h, d, mat, x = 0, y = 0, z = 0, parent = scene) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; };
function xray(col, k = 1) { return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  uniforms: { uCol: { value: col.clone() }, uA: { value: k } },
  vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform vec3 uCol; uniform float uA; varying vec3 vN; varying vec3 vV; void main(){ float f=pow(clamp(1.-abs(dot(vN,vV)),0.,1.),2.); gl_FragColor=vec4(uCol*(f*.8+.05)*uA,(f*.7+.04)*uA); }` }); }
// cielo
const skyU = { uTop: { value: new THREE.Color(.03, .06, .14) }, uHor: { value: new THREE.Color(.55, .38, .26) } };
scene.add(new THREE.Mesh(new THREE.SphereGeometry(20000, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: skyU,
  vertexShader: `varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 uTop; uniform vec3 uHor; varying vec3 vP; void main(){ float h=clamp(vP.y,0.,1.); gl_FragColor=vec4(mix(uHor, uTop, pow(h,.5)),1.); }` })));
const waterMat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 } }, transparent: true,
  vertexShader: `varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `uniform float uT; varying vec3 vW; void main(){ vec3 V=normalize(cameraPosition-vW); float r=sin(vW.x*.08+uT)*sin(vW.z*.06-uT*.7)*.5+.5; float fr=pow(1.-max(V.y,0.),3.);
    vec3 c=mix(vec3(.02,.09,.16), vec3(.35,.45,.55), fr*.7)+vec3(.04,.08,.1)*r; gl_FragColor=vec4(c,.96); }` });
// roca con ruido
function rock(w, h, d, seed, col = 0x6b5a4a) { const g = new THREE.BoxGeometry(w, h, d, 24, 16, 40); const p = g.attributes.position; const r = rng(seed);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const n = noise1(x * .02 + z * .013 + seed) * 18 + noise1(y * .05 + z * .03 + seed * 3) * 9 + noise1(x * .1 + y * .09) * 3; p.setXYZ(i, x + n * Math.sign(x) * .6, y + n * .3, z + n * .2); }
  g.computeVertexNormals(); return new THREE.Mesh(g, M(col, .95, .02)); }

// ==========================================================================
// PRESA DE GRAVEDAD (cañón a lo largo de z, el río fluye hacia +z)
// ==========================================================================
const DH = 125, CW = 12, BW = 95, HALFW = 150, WL = 112;
const damShape = new THREE.Shape(); damShape.moveTo(0, 0); damShape.lineTo(0, DH); damShape.lineTo(CW, DH); damShape.lineTo(CW, DH - 14); damShape.lineTo(BW, 0); damShape.lineTo(0, 0);
const concTex = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#bdb6aa'; x.fillRect(0, 0, 256, 256); const r = rng(4); for (let i = 0; i < 3000; i++) { x.fillStyle = `rgba(${r() < .5 ? '60,55,50' : '255,250,240'},${r() * .06})`; x.fillRect(r() * 256, r() * 256, 3, 3); }
  x.strokeStyle = 'rgba(70,64,58,.55)'; x.lineWidth = 3; for (let y = 0; y <= 256; y += 32) { x.beginPath(); x.moveTo(0, y); x.lineTo(256, y); x.stroke(); } for (let xx = 0; xx <= 256; xx += 128) { x.beginPath(); x.moveTo(xx, 0); x.lineTo(xx, 256); x.stroke(); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / 60, 1 / 60); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const concrete = new THREE.MeshStandardMaterial({ map: concTex, roughness: .85, metalness: .05 }), damX = xray(new THREE.Color(.55, .6, .7), .7);
const dam = new THREE.Mesh(new THREE.ExtrudeGeometry(damShape, { depth: 2 * HALFW, bevelEnabled: false }), concrete); dam.rotation.y = -Math.PI / 2; dam.position.x = HALFW; scene.add(dam);
for (let k = 0; k < 6; k++) box(1, 4, 2, M(0xffe0a0, .5, 0, 0xffc060), -125 + k * 50, DH + 2, 6);
const wallL = rock(400, 200, 2400, 3), wallR = rock(400, 200, 2400, 7); wallL.position.set(-HALFW - 195, 70, -300); wallR.position.set(HALFW + 195, 70, -300); scene.add(wallL, wallR);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(6000, 8000), M(0x3a3026, .95, 0)); floor.rotation.x = -Math.PI / 2; floor.position.y = -1; scene.add(floor);
const reservoir = new THREE.Mesh(new THREE.PlaneGeometry(2 * HALFW, 1500), waterMat); reservoir.rotation.x = -Math.PI / 2; reservoir.position.set(0, WL, -750); scene.add(reservoir);
const waterVol = box(2 * HALFW, WL, 1500, new THREE.MeshStandardMaterial({ color: 0x2a7ab8, emissive: 0x0a2a48, transparent: true, opacity: .6, roughness: .2, depthWrite: false }), 0, WL / 2, -750);
const river = new THREE.Mesh(new THREE.PlaneGeometry(2 * HALFW, 3000), waterMat); river.rotation.x = -Math.PI / 2; river.position.set(0, 4, 1600); scene.add(river);
// tubería forzada y central
const penC = new THREE.CatmullRomCurve3([V3(0, 72, -6), V3(0, 70, 6), V3(0, 50, 35), V3(0, 22, 70), V3(0, 10, 92), V3(0, 9, 112)]);
const pen = new THREE.Mesh(new THREE.TubeGeometry(penC, 80, 4.5, 16, false), xray(new THREE.Color(.4, .75, 1.3), 1)); scene.add(pen);
const powerhouse = box(60, 30, 34, M(0x8a857c, .8, .1), 0, 15, 115); const phX = new THREE.Mesh(powerhouse.geometry, xray(new THREE.Color(.8, .7, .5), .8)); phX.position.copy(powerhouse.position); scene.add(phX);
const intake = box(16, 16, 4, M(0x30343a, .5, .6), 0, 72, -2);

// ==========================================================================
// PRESA BÓVEDA (escena aparte)
// ==========================================================================
const AR = V3(5000, 0, 0); const arch = new THREE.Group(); arch.position.copy(AR); scene.add(arch);
const RA = 230, PHI = 50 * Math.PI / 180; const archPts = []; for (let i = 0; i <= 40; i++) { const f = lerp(-PHI, PHI, i / 40); archPts.push([RA * Math.sin(f), -RA * Math.cos(f) + RA]); }
const aShape = new THREE.Shape(); archPts.forEach(([x, z], i) => i ? aShape.lineTo(x, -z) : aShape.moveTo(x, -z)); for (let i = 40; i >= 0; i--) { const f = lerp(-PHI, PHI, i / 40); aShape.lineTo((RA + 9) * Math.sin(f), -(-(RA + 9) * Math.cos(f) + RA)); }
const archMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(aShape, { depth: 140, bevelEnabled: false }), concrete); archMesh.rotation.x = -Math.PI / 2; arch.add(archMesh);
for (const s of [-1, 1]) { const r = rock(500, 190, 500, s > 0 ? 11 : 13); r.position.set(s * (RA * Math.sin(PHI) + 245), 70, 160); arch.add(r); }
{ const ws = new THREE.Shape(); ws.moveTo(-600, -1500); ws.lineTo(600, -1500); ws.lineTo(600, 140); archPts.slice().reverse().forEach(([x, z]) => ws.lineTo(x, z)); ws.lineTo(-600, 140); const wm = new THREE.Mesh(new THREE.ShapeGeometry(ws), new THREE.MeshStandardMaterial({ color: 0x2a6a9a, transparent: true, opacity: .45, roughness: .15, depthWrite: false })); wm.rotation.x = Math.PI / 2; wm.position.y = 128; arch.add(wm); }
const archFloor = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), M(0x3a3026, .95, 0)); archFloor.rotation.x = -Math.PI / 2; archFloor.position.y = 0; arch.add(archFloor);

// ==========================================================================
// TURBINA Y GENERADOR (laboratorio)
// ==========================================================================
const TB = V3(0, 5000, 0); const tb = new THREE.Group(); tb.position.copy(TB); scene.add(tb);
const runner = new THREE.Group(); tb.add(runner); { const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 2.2, 2.2, 32), M(0xb8a070, .3, .9)); runner.add(hub); const band = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.0, .5, 48, 1, true), M(0xb8a070, .3, .9)); band.position.y = -1; band.material.side = THREE.DoubleSide; runner.add(band);
  for (let k = 0; k < 13; k++) { const b = box(2.2, 1.9, .12, M(0xd8c090, .25, .9), 0, 0, 0, runner); const a = k / 13 * Math.PI * 2; b.position.set(Math.cos(a) * 2.2, -.1, Math.sin(a) * 2.2); b.rotation.set(.5, -a + .9, 0); } }
const casing = new THREE.Mesh(new THREE.TorusGeometry(4.6, 1.3, 16, 64), xray(new THREE.Color(.4, .75, 1.3), .9)); casing.rotation.x = Math.PI / 2; tb.add(casing);
const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, 9, 16), M(0x9aa3ad, .3, .9)); shaft.position.y = 4.8; tb.add(shaft);
const rotor = new THREE.Group(); rotor.position.y = 9; tb.add(rotor); { const d = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 2.4, 48), M(0x3a3e44, .5, .7)); rotor.add(d);
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; const mg = box(1.2, 2.2, .7, M(k % 2 ? 0xd03a2a : 0x2a5ad0, .4, .4, k % 2 ? 0x300804 : 0x040a30), Math.cos(a) * 5.2, 0, Math.sin(a) * 5.2, rotor); mg.rotation.y = -a; } }
const coilMat = M(0xc87a40, .3, .9, 0x000000); const stator = new THREE.Group(); stator.position.y = 9; tb.add(stator);
for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; const c = new THREE.Mesh(new THREE.TorusGeometry(.7, .22, 8, 16), coilMat); c.position.set(Math.cos(a) * 6.5, 0, Math.sin(a) * 6.5); c.rotation.y = -a + Math.PI / 2; stator.add(c); }
const statorRing = new THREE.Mesh(new THREE.CylinderGeometry(7.6, 7.6, 3, 64, 1, true), xray(new THREE.Color(.9, .6, .35), .8)); statorRing.position.y = 9; tb.add(statorRing);

// ==========================================================================
// LÍNEAS ELÉCTRICAS Y CIUDAD (aguas abajo)
// ==========================================================================
const lines = []; { const r = rng(5); let prev = null; const pts = []; for (let k = 0; k < 14; k++) { const z = 300 + k * 260, x = 260 + Math.sin(k * .7) * 120; pts.push(V3(x, 0, z)); const tw = new THREE.Group(); tw.position.set(x, 0, z); scene.add(tw);
    const lm = M(0x5a5f66, .6, .6); for (const s of [-1, 1]) { const l = box(1.2, 55, 1.2, lm, s * 5, 27, 0, tw); l.rotation.z = -s * .08; } box(28, 1.2, 1.2, lm, 0, 50, 0, tw); box(18, 1.2, 1.2, lm, 0, 40, 0, tw); }
  for (const off of [-12, 0, 12]) { const cp = []; for (let k = 0; k < pts.length - 1; k++) for (let j = 0; j < 8; j++) { const a = pts[k], b = pts[k + 1], u = j / 8; cp.push(V3(lerp(a.x, b.x, u) + off, 50 - 10 * 4 * u * (1 - u), lerp(a.z, b.z, u))); } lines.push(new THREE.CatmullRomCurve3(cp)); } }
const CITY = V3(400, 0, 4200); const cityPts = []; { const r = rng(9); for (let i = 0; i < 2600; i++) { const a = r() * 6.283, d = Math.pow(r(), .6) * 900; cityPts.push([CITY.x + Math.cos(a) * d, 2 + r() * 6, CITY.z + Math.sin(a) * d * .6, r()]); } }

// ==========================================================================
// CONSTRUCCIÓN: bloques de hormigón calientes y tuberías de refrigeración
// ==========================================================================
const CN = V3(0, 8000, 0); const cn = new THREE.Group(); cn.position.copy(CN); scene.add(cn);
const blocks = []; { const r = rng(21); for (let i = 0; i < 8; i++) for (let j = 0; j < 5; j++) { const h = 6 + Math.floor(r() * 6) * 1.5; const m = M(0x9a948a, .9, .05, 0x000000); const b = box(14, h, 14, m, -56 + i * 16, h / 2, -32 + j * 16, cn); blocks.push({ b, m, h, x: -56 + i * 16, z: -32 + j * 16, ph: r() }); } }
const pipeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(.25, .6, 1.2) }); const pipes = [];
for (const bl of blocks) for (let lv = 1.2; lv < bl.h; lv += 1.5) { const pts = []; for (let k = 0; k < 6; k++) { const zz = bl.z - 6 + k * 2.4; pts.push(V3(bl.x + (k % 2 ? 6.6 : -6.6), lv, zz), V3(bl.x + (k % 2 ? -6.6 : 6.6), lv, zz)); }
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .02), 60, .2, 5, false), pipeMat); cn.add(m); pipes.push({ m, ord: bl.ph }); }

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
const P = new Particles(16000, { size: 2, seed: 13 }); scene.add(P.obj);
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
function presArrows(a, x = HALFW + 1, scale = .55) { if (a <= .01) return; for (let d = 10; d <= WL; d += 12.5) { const y = WL - d, len = d * scale; const p0 = project(V3(x, y, -len - 4)), p1 = project(V3(x, y, -2)); const k = d / WL;
  const col = `rgb(${Math.round(lerp(110, 255, k))},${Math.round(lerp(190, 110, k))},${Math.round(lerp(255, 80, k))})`; arrowXY(p0.x, p0.y, p1.x, p1.y, a * smooth(0, .15, a - k * .5 + .3), col, lerp(5, 10, k)); } }
function penFlow(t, amp, n = 1800) { const s = P.seed; for (let i = 0; i < n; i++) { const q = (i % P.n) * 4; const u0 = fract(s[q] + t * .35); const u = Math.pow(u0, .6); const p = penC.getPointAt(u); const f = amp * (.6 + u * .8);
  P.push(p.x + (s[q + 1] - .5) * 6, p.y + (s[q + 2] - .5) * 6, p.z + (s[q + 3] - .5) * 6, .4 * f, .8 * f, 1.4 * f); } }
function setScene(o) { const sec = !!o.section; wallR.visible = !sec; waterVol.visible = sec; dam.material = o.damX ? damX : concrete; pen.visible = !!o.pen; phX.visible = !!o.pen; powerhouse.visible = !o.pen; }
function reactorIcons(n, a) { if (a <= .01) return; for (let i = 0; i < 20; i++) { const cx = 180 + (i % 5) * 180, cy = 1150 + Math.floor(i / 5) * 165; const on = i < n; g2.save(); g2.globalAlpha = a * (on ? 1 : .25);
  g2.fillStyle = on ? '#e3a372' : '#ffffff'; g2.beginPath(); g2.moveTo(cx - 55, cy + 55); g2.quadraticCurveTo(cx - 22, cy + 5, cx - 38, cy - 40); g2.lineTo(cx + 38, cy - 40); g2.quadraticCurveTo(cx + 22, cy + 5, cx + 55, cy + 55); g2.closePath(); g2.fill();
  if (on) { g2.globalAlpha = a * .35; g2.fillStyle = '#ffffff'; g2.beginPath(); g2.ellipse(cx, cy - 58, 46, 18, 0, 0, 7); g2.ellipse(cx + 20, cy - 72, 40, 16, 0, 0, 7); g2.fill(); } g2.restore(); } }
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .5; camera.far = 30000;
  let bloomS = .6, flash = 0, ca = .0013, fade = 0, grain = .035, expo = 1, dim = 0;
  P.begin(); P.mat.size = 2; waterMat.uniforms.uT.value = t; setScene({}); coilMat.emissive.setRGB(0, 0, 0); blocks.forEach(b => b.m.emissive.setRGB(0, 0, 0)); pipes.forEach(p => p.m.visible = false);
  for (const c of ['why', 'm100', 'arch', 'how', 'gen', 'city', 'howmuch', 'curious', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];
  if (t < TL.why) {
    // A · millones de toneladas de agua empujando
    camOrbit(V3(0, 80, 0), lerp(560, 470, easeOut(t / TL.why)), .5 - t * .03, .3, 38); bloomS = .7; expo = 1.2;
    const pk = smooth(TL.push, TL.push + .3, t); if (pk > 0) { const s = P.seed; for (let i = 0; i < 2500; i++) { const q = (i % P.n) * 4; const u = fract(s[q] + t * .8); const x = (s[q + 1] - .5) * 290, y = s[q + 2] * WL; const d = (WL - y) / WL; P.push(x, y, lerp(-60 * d - 8, -1, u), .4 * pk * (1 - u) * (.5 + d), .75 * pk * (1 - u) * (.5 + d), 1.4 * pk * (1 - u) * (.5 + d)); } }
    hud.push(() => { titleHUD('DETRÁS DE ESTE MURO HAY', 'MILLONES DE TONELADAS', smooth(.1, .4, t) * (1 - smooth(TL.push - .1, TL.push + .1, t)), 300); txt('DE AGUA…', W / 2, 440, 48, { font: 'Montserrat', weight: 800, alpha: smooth(1.8, 2.1, t) * (1 - smooth(TL.push - .1, TL.push + .1, t)), fill: copperGrad(300, 780, 440, .5) });
      bigStat('', 'EMPUJANDO', 380, smooth(TL.push, TL.push + .25, t), clamp((t - TL.push) / 1)); });
  } else if (t < TL.arch) {
    // B/C · por su forma: más ancha abajo; la presión crece con la profundidad
    const lt = t - TL.why; setScene({ section: true }); const ck = easeInOut(smooth(0, 1.4, lt));
    camOrbit(V3(HALFW, lerp(62, 72, ck), 0), lerp(520, 390, ck), lerp(.9, Math.PI / 2 - .02, ck), lerp(.25, .02, ck), 38); expo = 1.25;
    const pa = smooth(TL.deep - .2, TL.deep + 1.6, t);
    hud.push(() => { titleHUD('¿POR QUÉ', 'NO LO TIRA?', smooth(0, .3, lt) * (1 - smooth(TL.shape - TL.why - .1, TL.shape - TL.why + .1, lt)), 300);
      titleHUD('PRIMERO,', 'POR SU FORMA', smooth(TL.shape - TL.why, TL.shape - TL.why + .3, lt) * (1 - smooth(TL.wide - TL.why - .1, TL.wide - TL.why + .1, lt)), 300);
      const wa = smooth(TL.wide - TL.why, TL.wide - TL.why + .4, lt) * (1 - smooth(TL.deep - TL.why - .2, TL.deep - TL.why, lt));
      if (wa > .01) { const a = project(V3(HALFW + 1, DH + 6, 0)), b = project(V3(HALFW + 1, DH + 6, CW)), c = project(V3(HALFW + 1, -6, 0)), d = project(V3(HALFW + 1, -6, BW));
        g2.save(); g2.globalAlpha = wa; g2.strokeStyle = '#ffe2c0'; g2.lineWidth = 3; for (const [p, q] of [[a, b], [c, d]]) { g2.beginPath(); g2.moveTo(p.x, p.y); g2.lineTo(q.x, q.y); g2.stroke(); } g2.restore();
        txt('12 m', (a.x + b.x) / 2, a.y - 30, 32, { weight: 600, alpha: wa }); txt('95 m', (c.x + d.x) / 2, c.y + 34, 40, { font: 'Montserrat', weight: 800, alpha: wa, fill: copperGrad(c.x, d.x, c.y, .5) });
        titleHUD('MÁS ANCHA ABAJO', 'QUE ARRIBA', wa, 300); }
      titleHUD('EL AGUA EMPUJA MÁS', 'CUANTO MÁS HONDO', smooth(TL.deep - TL.why, TL.deep - TL.why + .3, lt) * (1 - smooth(TL.m100 - TL.why - .1, TL.m100 - TL.why + .1, lt)), 300);
      presArrows(pa);
      if (t > TL.m100) { const p = project(V3(HALFW + 1, WL - 100, -2)); g2.save(); g2.globalAlpha = smooth(TL.m100, TL.m100 + .3, t); g2.strokeStyle = '#ffe2c0'; g2.setLineDash([8, 8]); g2.lineWidth = 2; const q = project(V3(HALFW + 1, WL, -2)); g2.beginPath(); g2.moveTo(q.x - 160, q.y); g2.lineTo(q.x - 160, p.y); g2.stroke(); g2.restore();
        txt('100 m', q.x - 180, (q.y + p.y) / 2, 34, { align: 'right', weight: 700, alpha: smooth(TL.m100, TL.m100 + .3, t) }); }
      bigStat('A 100 m DE PROFUNDIDAD', '× 10', 330, smooth(TL.m100, TL.m100 + .3, t), clamp((t - TL.m100) / 1.5)); txt('LA PRESIÓN DEL AIRE', W / 2, 430, 34, { weight: 300, spacing: 4, alpha: smooth(TL.x10, TL.x10 + .3, t) }); });
  } else if (t < TL.how) {
    // D · presa bóveda: desvía el empuje hacia las montañas
    const lt = t - TL.arch; camOrbit(AR.clone().add(V3(0, 60, 120)), lerp(1250, 1150, lt / 4.4), Math.PI + .3 - lt * .04, 1.0, 38); P.mat.size = 8; expo = 1.4; bloomS = 1;
    const fk = smooth(TL.sides - TL.arch - .4, TL.sides - TL.arch + .6, lt); const s = P.seed;
    for (let i = 0; i < 3000; i++) { const q = (i % P.n) * 4; const f0 = lerp(-PHI, PHI, s[q + 1]); const side = f0 >= 0 ? 1 : -1; const u = fract(s[q] + t * .45); const h = 20 + s[q + 2] * 100;
      let f = f0, rr = RA - 60 + u * 64; if (fk > 0 && u > .5) { const v = (u - .5) / .5; f = lerp(f0, side * PHI, v * fk); rr = RA + 4; } const rx = rr * Math.sin(f), rz = -rr * Math.cos(f) + RA; let ex = 0, ez = 0;
      if (fk > 0 && u > .9) { const v = (u - .9) / .1; ex = side * v * 60 * fk; ez = v * 20 * fk; } const c = u < .5 ? [.4, .75, 1.4] : [lerp(.4, 2, fk), lerp(.75, .9, fk), lerp(1.4, .35, fk)]; const a = Math.sin(Math.PI * u) * 1.1;
      P.push(AR.x + rx + ex, 132 + s[q + 2] * 6, AR.z + rz + ez, c[0] * a, c[1] * a, c[2] * a); }
    hud.push(() => { titleHUD('OTRAS SON CURVAS', 'COMO UN ARCO', smooth(0, .3, lt) * (1 - smooth(TL.sides - TL.arch - .1, TL.sides - TL.arch + .1, lt)), 300);
      titleHUD('DESVÍAN EL EMPUJE HACIA', 'LAS MONTAÑAS DE LOS LADOS', smooth(TL.sides - TL.arch, TL.sides - TL.arch + .3, lt), 300); });
  } else if (t < TL.gen) {
    // E · tuberías dentro del muro: el agua cae, gana velocidad y mueve la turbina
    const lt = t - TL.how; setScene({ section: true, damX: true, pen: true }); const pk = smooth(TL.pipes - .3, TL.pipes + .5, t);
    camOrbit(V3(HALFW * .3, 50, 50), lerp(470, 380, easeInOut(smooth(0, 4, lt))), Math.PI / 2 - .25 + lt * .01, .1, 38); P.mat.size = 2.4; bloomS = .9; expo = 1.25;
    if (t > TL.falls - .3) penFlow(t, smooth(TL.falls - .3, TL.falls + .4, t)); if (t > TL.turbine) { const s = P.seed; for (let i = 0; i < 900; i++) { const q = ((i + 4000) % P.n) * 4; const u = fract(s[q] + t * .5); P.push((s[q + 1] - .5) * 50, 4 + s[q + 2] * 4, 132 + u * 200, .4 * (1 - u), .8 * (1 - u), 1.3 * (1 - u)); } }
    pen.material.uniforms.uA.value = .4 + pk * .8;
    hud.push(() => { titleHUD('¿Y CÓMO SE CONVIERTE', 'EL AGUA EN ELECTRICIDAD?', smooth(0, .3, lt) * (1 - smooth(TL.pipes - TL.how - .1, TL.pipes - TL.how + .1, lt)), 300);
      titleHUD('DENTRO DEL MURO', 'TUBERÍAS ENORMES', smooth(TL.pipes - TL.how, TL.pipes - TL.how + .3, lt) * (1 - smooth(TL.falls - TL.how - .1, TL.falls - TL.how + .1, lt)), 300);
      titleHUD('EL AGUA CAE Y', 'GANA VELOCIDAD', smooth(TL.falls - TL.how, TL.falls - TL.how + .3, lt) * (1 - smooth(TL.turbine - TL.how - .1, TL.turbine - TL.how + .1, lt)), 300);
      titleHUD('Y HACE GIRAR', 'UNA TURBINA', smooth(TL.turbine - TL.how, TL.turbine - TL.how + .3, lt), 300);
      callout(V3(0, 15, 112), 60, 150, 'TURBINA', null, smooth(TL.turbine - TL.how + .2, TL.turbine - TL.how + .6, lt), '#7fd4ff'); });
  } else if (t < TL.city) {
    // F · la turbina mueve un generador: imanes que giran dentro de bobinas de cobre
    const lt = t - TL.gen; const sp = 2.2 + lt * .4; runner.rotation.y = -t * sp; rotor.rotation.y = -t * sp; const mk = smooth(TL.magnets - TL.gen - .3, TL.magnets - TL.gen + .6, lt);
    coilMat.emissive.setRGB(mk * (.6 + .4 * Math.sin(t * 20)), mk * .25, mk * .05); statorRing.material.uniforms.uA.value = lerp(.8, .35, mk);
    camOrbit(TB.clone().add(V3(0, lerp(4, 9, mk), 0)), lerp(34, 24, mk), .6 + lt * .1, lerp(.18, .5, mk), 38); P.mat.size = .25; bloomS = 1;
    const s = P.seed; for (let i = 0; i < 1800; i++) { const q = (i % P.n) * 4; const u = fract(s[q] + t * .7); const a = s[q + 1] * 6.283 + u * 5; const r = lerp(5, 2, u); P.push(TB.x + Math.cos(a) * r, TB.y + lerp(0, -4, Math.max(0, u - .7) / .3) + (s[q + 2] - .5) * 1.4, TB.z + Math.sin(a) * r, .4, .8, 1.3); }
    if (mk > 0) for (let i = 0; i < 800; i++) { const q = ((i + 5000) % P.n) * 4; const a = s[q] * 6.283; const f = mk * (.5 + .5 * Math.sin(t * 25 + i)); P.push(TB.x + Math.cos(a) * 6.5, TB.y + 9 + (s[q + 1] - .5) * 2.2, TB.z + Math.sin(a) * 6.5, 2 * f, 1.1 * f, .4 * f); }
    hud.push(() => { titleHUD('LA TURBINA MUEVE', 'UN GENERADOR', smooth(0, .3, lt) * (1 - smooth(TL.magnets - TL.gen - .1, TL.magnets - TL.gen + .1, lt)), 300);
      titleHUD('IMANES QUE GIRAN DENTRO', 'DE BOBINAS DE COBRE', smooth(TL.magnets - TL.gen, TL.magnets - TL.gen + .3, lt), 300);
      callout(TB.clone().add(V3(0, 9, 5.2)), -80, 140, 'IMANES', null, smooth(TL.magnets - TL.gen + .3, TL.magnets - TL.gen + .7, lt), '#ff8a7a'); callout(TB.clone().add(V3(6.5, 9.4, 0)), 70, -120, 'BOBINAS', null, smooth(TL.magnets - TL.gen + .5, TL.magnets - TL.gen + .9, lt), '#e3a372'); });
  } else if (t < TL.howmuch) {
    // G · la corriente sale hacia las ciudades
    const lt = t - TL.city; camOrbit(V3(350, 0, 2600), lerp(2900, 3200, lt / 2), Math.PI * .86 + lt * .02, .5, 38); P.mat.size = 22; bloomS = 1.2; expo = 1.2;
    const s = P.seed; for (const c of lines) for (let i = 0; i < 400; i++) { const q = ((i + lines.indexOf(c) * 400) % P.n) * 4; const u = fract(s[q] + t * .5); if (u > lt / 1.2) continue; const p = c.getPointAt(u); P.push(p.x, p.y, p.z, 2, 1.4, .6); }
    const ck = smooth(.6, 1.6, lt); for (const [x, y, z, r] of cityPts) { const f = ck * (.5 + .5 * Math.sin(t * 3 + r * 40)) * .9; P.push(x, y, z, 2 * f, 1.5 * f, .8 * f); }
    hud.push(() => { titleHUD('Y LA CORRIENTE SALE', 'HACIA LAS CIUDADES', smooth(0, .3, lt), 300); });
  } else if (t < TL.curious) {
    // H · Tres Gargantas ≈ 20 reactores nucleares
    const lt = t - TL.howmuch; camOrbit(V3(0, 70, 0), lerp(820, 950, lt / 5.5), .15 + lt * .03, .32, 38); expo = 1.2; dim = smooth(TL.tg - .2, TL.tg + .5, t) * .35;
    const s = P.seed; for (let i = 0; i < 1500; i++) { const q = (i % P.n) * 4; const u = fract(s[q] + t * .4); P.push((s[q + 1] - .5) * 60, 4 + s[q + 2] * 8 + u * 3, 132 + u * 400, .5 * (1 - u), .8 * (1 - u), 1.2 * (1 - u)); }
    const n = Math.floor(20 * clamp((t - TL.x20 + .3) / 1.4)) + (t > TL.x20 - .3 ? 1 : 0);
    hud.push(() => { titleHUD('¿Y', 'CUÁNTA?', smooth(0, .3, lt) * (1 - smooth(TL.tg - TL.howmuch - .1, TL.tg - TL.howmuch + .1, lt)), 300);
      bigStat('TRES GARGANTAS · CHINA', '22.500 MW', 330, smooth(TL.tg - TL.howmuch, TL.tg - TL.howmuch + .3, lt), clamp((lt - 1) / 1.5));
      txt('≈ 20 REACTORES NUCLEARES', W / 2, 1000, 44, { font: 'Montserrat', weight: 800, alpha: smooth(TL.x20 - TL.howmuch - .2, TL.x20 - TL.howmuch + .2, lt) }); reactorIcons(Math.min(20, n), smooth(TL.x20 - TL.howmuch - .4, TL.x20 - TL.howmuch, lt)); });
  } else if (t < TL.brand) {
    // I · Hoover: el hormigón habría tardado más de 100 años en enfriarse; tuberías de agua helada
    const lt = t - TL.curious; const pk = smooth(TL.coolpipes - .3, TL.coolpipes + 2.2, t); blocks.forEach(b => { b.m.transparent = pk > 0; b.m.opacity = lerp(1, .3, smooth(TL.coolpipes - .3, TL.coolpipes + .5, t)); b.m.depthWrite = pk <= 0; }); const heat = smooth(.4, 2, lt) * (1 - pk * .85);
    blocks.forEach(b => { const h = heat * (.7 + .3 * Math.sin(b.ph * 30 + t)); b.m.emissive.setRGB(h * .9, h * .3, h * .06); });
    pipes.forEach(p => p.m.visible = t > TL.coolpipes - .3 && p.ord < (t - TL.coolpipes + .3) / 1.5); bloomS = 1.0;
    camOrbit(CN.clone().add(V3(0, 4, 0)), lerp(130, 95, lt / 10), .7 + lt * .04, .55, 38); P.mat.size = .8;
    const s = P.seed; if (heat > .05) for (let i = 0; i < 1500; i++) { const q = (i % P.n) * 4; const b = blocks[i % blocks.length]; const age = fract(s[q] + t * .4); const f = heat * (1 - age) * .6; P.push(CN.x + b.x + (s[q + 1] - .5) * 14, CN.y + b.h + age * 18, CN.z + b.z + (s[q + 2] - .5) * 14, 1.4 * f, .5 * f, .12 * f); }
    const yrs = Math.round(125 * easeOut(smooth(TL.years - .2, TL.years + 1.6, t)));
    hud.push(() => { titleHUD('Y LO MÁS CURIOSO', 'EL HORMIGÓN DE LA PRESA HOOVER…', smooth(0, .3, lt) * (1 - smooth(TL.years - TL.curious - .4, TL.years - TL.curious - .2, lt)), 300);
      bigStat('HABRÍA TARDADO EN ENFRIARSE', '+' + yrs + ' AÑOS', 330, smooth(TL.years - TL.curious - .2, TL.years - TL.curious + .1, lt) * (1 - smooth(TL.coolpipes - TL.curious - .1, TL.coolpipes - TL.curious + .1, lt)), clamp((lt - 3.5) / 1.5));
      const ca2 = smooth(TL.crack - TL.curious, TL.crack - TL.curious + .4, lt) * (1 - smooth(TL.coolpipes - TL.curious, TL.coolpipes - TL.curious + .6, lt));
      if (ca2 > .01) { g2.save(); g2.globalAlpha = ca2; g2.strokeStyle = '#1a0e08'; g2.lineWidth = 4; for (const b of blocks.slice(0, 16)) { const p = project(CN.clone().add(V3(b.x, b.h, b.z))); const r = rng(Math.floor(b.ph * 1000)); g2.beginPath(); g2.moveTo(p.x - 30, p.y); let x = p.x - 30, y = p.y; for (let k = 0; k < 6; k++) { x += 10 + r() * 6; y += (r() - .5) * 18; g2.lineTo(x, y); } g2.stroke(); } g2.restore(); }
      titleHUD('PARA QUE NO SE AGRIETARA…', '', ca2, 300);
      bigStat('TUBERÍAS DE AGUA HELADA', '≈ 937 km', 330, smooth(TL.coolpipes - TL.curious, TL.coolpipes - TL.curious + .3, lt), clamp((t - TL.coolpipes) / 1.5)); txt('metidas dentro del muro', W / 2, 430, 34, { weight: 300, alpha: smooth(TL.coolpipes - TL.curious + .3, TL.coolpipes - TL.curious + .6, lt) }); });
  } else {
    // J · marca
    const lt = t - TL.brand; camOrbit(V3(0, 70, 40), 600 + lt * 25, .55 + lt * .03, .3, 38); expo = .9; fade = Math.min(.5, lt * .45); dim = smooth(0, .8, lt) * .6;
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  P.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (dim > 0) hud.unshift(() => { g2.save(); g2.globalAlpha = dim * .7; g2.fillStyle = '#02050b'; g2.fillRect(0, 0, W, H); g2.restore(); });
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
function renderCover() { renderFrame(TL.magnets + 1.2); coverText('¿CÓMO AGUANTA', 'UNA PRESA?', 'Y cómo convierte el agua en luz'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
