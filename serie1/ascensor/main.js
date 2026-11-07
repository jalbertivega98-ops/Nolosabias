// NO LO SABÍAS — "¿Por qué no se cae un ascensor?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final. Unidades: metros.
// Referencia: ascensor eléctrico de tracción (EN 81-20): varios cables de acero (coeficiente de seguridad ≥ 12), polea de tracción en la sala de máquinas,
// contrapeso = cabina + 40–50 % de la carga nominal. Limitador de velocidad centrífugo con cable propio; al dispararse frena su cable, que acciona
// el paracaídas de la cabina (cuñas que aprietan las guías). Elisha Otis, Crystal Palace de Nueva York, 1854: freno de muelle y cremallera.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, easeIn, rng, V3, g2, camera, SOFT, Particles, txt, copperGrad, project, callout, titleHUD, fract, camOrbit, bigStat, drawBrand, coverText, finish } from '../../lib/core.js';

const scene = new THREE.Scene(); scene.background = new THREE.Color(0x04060b);
const hemi = new THREE.HemisphereLight(0xc8d8ff, 0x302820, .9); scene.add(hemi);
const key = new THREE.DirectionalLight(0xfff1e0, 2.2); key.position.set(6, 20, 9); scene.add(key);
const rim = new THREE.DirectionalLight(0x7fb0ff, 1.3); rim.position.set(-6, 10, -8); scene.add(rim);
const fill = new THREE.DirectionalLight(0xffe8d8, 1.5); scene.add(fill);
function xray(col, k = 1) { return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  uniforms: { uCol: { value: col }, uA: { value: k } },
  vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform vec3 uCol; uniform float uA; varying vec3 vN; varying vec3 vV; void main(){ float f=pow(clamp(1.-abs(dot(vN,vV)),0.,1.),2.); gl_FragColor=vec4(uCol*(f*.8+.05)*uA,(f*.7+.04)*uA); }` }); }
const M = (c, r = .5, m = .3, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: e });
const box = (w, h, d, mat, x = 0, y = 0, z = 0, parent = scene) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; };

// ==========================================================================
// HUECO, GUÍAS, CABINA, CONTRAPESO, MÁQUINA, CABLES, LIMITADOR
// ==========================================================================
const TOP = 15.5, NF = 4, FLH = 3.5;
const shaft = new THREE.Group(); scene.add(shaft);
const concrete = M(0x464c56, .9, .05), steel = M(0x8c949e, .35, .85), dark = M(0x343842, .6, .5);
box(3.2, TOP + 1.5, .2, concrete, 0, (TOP + 1.5) / 2 - .5, -1.45, shaft);
const wallX = xray(new THREE.Color(.25, .45, .8), .3); for (const s of [-1, 1]) box(.2, TOP + 1.5, 3, wallX, s * 1.6, (TOP + 1.5) / 2 - .5, 0, shaft);
for (let f = 0; f <= NF; f++) { const y = f * FLH; box(3.0, .05, .05, M(0x7fd4ff, .5, 0, 0x2a5a80), 0, y, -1.33, shaft); }
box(3.2, .3, 3, concrete, 0, -.65, 0, shaft);
const rails = new THREE.Group(); scene.add(rails); for (const s of [-1, 1]) { box(.09, TOP + .4, .12, steel, s * .82, (TOP + .4) / 2 - .5, 0, rails); box(.07, TOP + .4, .08, steel, s * .55, (TOP + .4) / 2 - .5, -1.08, rails); }
// cabina
const cab = new THREE.Group(); scene.add(cab);
const cabBody = box(1.4, 2.3, 1.4, M(0xd4dae0, .35, .55), 0, 1.15, 0, cab);
for (const s2 of [-1, 1]) box(.66, 2.05, .02, M(0xe8edf2, .22, .9), s2 * .345, 1.06, .71, cab); box(.012, 2.05, .025, M(0x15181c, .5, .5), 0, 1.06, .715, cab); box(.3, .1, .02, M(0x111111, .4, .2, 0xff7a2a), 0, 2.18, .72, cab);
const cabX = new THREE.Mesh(cabBody.geometry, xray(new THREE.Color(.35, .75, 1.25))); cabX.position.copy(cabBody.position); cab.add(cabX);
const cabLight = box(1.0, .02, 1.0, M(0xffffff, .5, 0, 0x8a8478), 0, 2.29, 0, cab);
box(1.5, .14, .2, dark, 0, 2.55, 0, cab); for (const s of [-1, 1]) { box(.1, 2.75, .14, dark, s * .74, 1.32, 0, cab); box(.12, .25, .2, steel, s * .78, 2.45, 0, cab); }
box(1.6, .16, .3, dark, 0, -.08, 0, cab);
const wedges = []; for (const s of [-1, 1]) { const w = box(.06, .22, .14, M(0xd0a050, .3, .9, 0x000000), s * .82 - s * .07, .05, 0, cab); w.userData.s = s; wedges.push(w); box(.22, .3, .22, dark, s * .8, .05, 0, cab); }
const lever = new THREE.Group(); lever.position.set(.74, 2.4, .2); cab.add(lever); box(.5, .05, .05, M(0xe0b060, .3, .8), .25, 0, 0, lever);
const linkL = box(.03, 2.3, .03, M(0xe0b060, .3, .8), .62, 1.25, .2, cab);
// contrapeso
const cw = new THREE.Group(); scene.add(cw); box(.9, .12, .28, dark, 0, 2.2, 0, cw); for (let k = 0; k < 14; k++) box(.82, .13, .22, M(0x3b3f46, .7, .4), 0, .15 + k * .145, 0, cw); for (const s of [-1, 1]) box(.06, 2.3, .26, dark, s * .45, 1.15, 0, cw);
// máquina
const mach = new THREE.Group(); mach.position.set(0, TOP, -.5); scene.add(mach);
const sheave = new THREE.Group(); mach.add(sheave); { const d = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .5, 48, 1), steel); d.rotation.z = Math.PI / 2; sheave.add(d); for (let k = 0; k < 6; k++) { const sp = box(.52, .06, .9, dark, 0, 0, 0, sheave); sp.rotation.x = k * Math.PI / 6; } }
const motorBody = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .7, 32), M(0x2c5a8a, .45, .5)); motorBody.rotation.z = Math.PI / 2; motorBody.position.set(-.7, 0, 0); mach.add(motorBody); box(.3, .9, .9, dark, .45, -.1, 0, mach); box(2.1, .2, 1.3, dark, -.2, -.62, 0, mach);
// cables de tracción: 6 tramos verticales (cabina y contrapeso) + arco sobre la polea
const NR = 6, RX = i => -.15 + i * .06; const ropeMat = M(0x9aa3ad, .4, .9); const ropeGlow = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.1, .62, .28) });
const ropes = []; for (let i = 0; i < NR; i++) { const a = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, 1, 8), ropeMat), b = new THREE.Mesh(a.geometry, ropeMat); const arc = new THREE.Mesh(new THREE.TorusGeometry(.5, .012, 6, 32, Math.PI), ropeMat); arc.rotation.y = Math.PI / 2; arc.position.set(RX(i), TOP, -.5); scene.add(a, b, arc); ropes.push({ a, b, arc }); }
function seg(m, x, y0, y1, z) { m.visible = y1 - y0 > .01; m.position.set(x, (y0 + y1) / 2, z); m.scale.set(1, Math.max(.001, y1 - y0), 1); }
// limitador de velocidad (polea arriba, polea tensora abajo, cable en bucle)
const GX = 1.12, GZ = .55, GR = .28;
const gov = new THREE.Group(); gov.position.set(GX, TOP - .1, GZ); scene.add(gov);
const govWheel = new THREE.Group(); gov.add(govWheel); { const d = new THREE.Mesh(new THREE.CylinderGeometry(GR, GR, .08, 40), M(0xc8a040, .35, .8)); d.rotation.x = Math.PI / 2; govWheel.add(d); for (let k = 0; k < 4; k++) { const sp = box(.04, GR * 2, .1, dark, 0, 0, 0, govWheel); sp.rotation.z = k * Math.PI / 4; } }
const govX = new THREE.Mesh(new THREE.CylinderGeometry(GR + .02, GR + .02, .1, 40, 1, true), xray(new THREE.Color(1.3, .8, .35))); govX.rotation.x = Math.PI / 2; gov.add(govX);
const fly = []; for (const s of [-1, 1]) { const g = new THREE.Group(); govWheel.add(g); const w = box(.07, .14, .07, M(0xff8a4a, .3, .7, 0x401000), 0, 0, .07, g); g.userData = { s, w }; fly.push(g); }
const pawl = box(.06, .16, .06, M(0xff5a3a, .3, .6, 0x300000), GR + .02, GR * .3, .06, gov);
const tens = new THREE.Mesh(new THREE.CylinderGeometry(GR, GR, .08, 32), steel); tens.rotation.x = Math.PI / 2; tens.position.set(GX, -.2, GZ); scene.add(tens);
const govRopeMat = M(0xd8c090, .4, .7); const gA = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, 1, 6), govRopeMat), gB = new THREE.Mesh(gA.geometry, govRopeMat); scene.add(gA, gB);
seg(gA, GX - GR, -.2, TOP - .1, GZ); seg(gB, GX + GR, -.2, TOP - .1, GZ);

// ==========================================================================
// 1854: torre de madera de Otis (escena aparte, lejos)
// ==========================================================================
const OT = new THREE.Group(); OT.position.set(80, 0, 0); scene.add(OT);
const wood = M(0x5a3c22, .8, .05), wood2 = M(0x70492a, .75, .05), iron = M(0x3a3a3a, .5, .7);
for (const s of [-1, 1]) { box(.3, 9, .3, wood, s * 1.5, 4.5, 0, OT); for (let k = 0; k < 60; k++) { const tth = box(.08, .1, .2, iron, s * 1.3, .6 + k * .14, 0, OT); tth.rotation.z = s * .5; } }
box(3.6, .3, .4, wood, 0, 9.1, 0, OT); const otPulley = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .2, 24), iron); otPulley.rotation.x = Math.PI / 2; otPulley.position.set(0, 9.4, 0); OT.add(otPulley);
const plat = new THREE.Group(); OT.add(plat); box(2.6, .12, 2, wood2, 0, 0, 0, plat); for (const s of [-1, 1]) { box(.1, 1.0, .1, wood, s * 1.25, .5, .9, plat); box(.1, 1.0, .1, wood, s * 1.25, .5, -.9, plat); }
for (const s of [-1, 1]) box(.08, 2.1, .12, wood, s * 1.22, 1.05, 0, plat); box(2.5, .1, .14, wood, 0, 2.1, 0, plat);
const spring = new THREE.Mesh(new THREE.TorusGeometry(1.3, .035, 8, 40, Math.PI * .5), iron); spring.rotation.z = Math.PI * .25; spring.position.set(0, 1.0, 0); plat.add(spring);
const crates = [[-.7, .3, .4], [.6, .25, -.5], [.2, .2, .55]].map(([x, h, z]) => box(.45, h * 2, .45, wood2, x, h + .06, z, plat));
const man = new THREE.Group(); plat.add(man); man.position.set(-.3, .06, .45); { const sk = M(0x2a241e, .7, 0); const b = new THREE.Mesh(new THREE.CapsuleGeometry(.2, .75, 6, 16), sk); b.position.y = .95; man.add(b); const hd = new THREE.Mesh(new THREE.SphereGeometry(.15, 16, 12), sk); hd.position.y = 1.63; man.add(hd);
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .25, 16), sk); hat.position.y = 1.85; man.add(hat); const brim = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .02, 16), sk); brim.position.y = 1.73; man.add(brim);
  for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.CapsuleGeometry(.07, .6, 4, 8), sk); l.position.set(s * .1, .4, 0); man.add(l); } const arm = new THREE.Mesh(new THREE.CapsuleGeometry(.055, .55, 4, 8), sk); arm.position.set(.28, 1.45, 0); arm.rotation.z = -2.6; man.add(arm); man.userData.arm = arm; }
const otRope = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1, 8), M(0xb89a6a, .9, 0)); OT.add(otRope); const otRope2 = new THREE.Mesh(otRope.geometry, otRope.material); OT.add(otRope2);
const crowd = new THREE.Group(); OT.add(crowd); { const r = rng(4); const sk = M(0x0d0b09, .9, 0); for (let i = 0; i < 70; i++) { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CapsuleGeometry(.22, .8, 4, 10), sk); b.position.y = .75; g.add(b); const hd = new THREE.Mesh(new THREE.SphereGeometry(.15, 10, 8), sk); hd.position.y = 1.5; g.add(hd);
  if (r() < .5) { const hat = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .22, 10), sk); hat.position.y = 1.72; g.add(hat); } const row = Math.floor(i / 14); g.position.set(-5.5 + (i % 14) * .82 + r() * .3, 0, 3.4 + row * .75 + r() * .2); g.scale.setScalar(.92 + r() * .16); crowd.add(g); } }
const otFloor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), M(0x2a1e14, .9, 0)); otFloor.rotation.x = -Math.PI / 2; OT.add(otFloor);
const otLamp = new THREE.PointLight(0xffb070, 0, 30, 1.2); otLamp.position.set(3, 9, 12); OT.add(otLamp);

// ==========================================================================
// ESTADO: posición de cabina y contrapeso, cables, limitador
// ==========================================================================
const P = new Particles(9000, { size: .05, seed: 3 }); scene.add(P.obj);
let govAng = 0;
function setRig(cy, o = {}) { // cy = cota del suelo de la cabina
  const cabTop = cy + 2.55, travel = TOP - 3.2; const cwy = clamp(travel - cy, -.3, TOP - 3); cab.position.y = cy; cw.position.set(0, cwy, -1.05);
  const broken = o.broken || 0;
  for (let i = 0; i < NR; i++) { const r = ropes[i]; const x = RX(i); if (broken > 0) { const top = lerp(TOP, cabTop + 1.5 + i * .3, 0); seg(r.a, x, cabTop, cabTop + lerp(TOP - cabTop, 1 + i * .2, broken), 0); seg(r.b, x, TOP - lerp(0, 2 + i * .3, broken), TOP, -1.0); r.arc.visible = true; }
    else { seg(r.a, x, cabTop, TOP, 0); seg(r.b, x, cwy + 2.26, TOP, -1.0); r.arc.visible = true; }
    const gl = o.glow && (o.glow === 'all' || o.glow === i); r.a.material = r.b.material = r.arc.material = gl ? ropeGlow : ropeMat; }
  linkL.position.y = 1.25; lever.rotation.z = o.lever || 0;
  wedges.forEach(w => { w.position.y = .05 + (o.wedge || 0) * .16; w.position.x = w.userData.s * (.82 - .07 + (o.wedge || 0) * .015); w.material.emissive.setRGB((o.wedge || 0) * .6, (o.wedge || 0) * .25, 0); });
}
function setGov(speed, trip, dt = 1 / 30) { govWheel.rotation.z = -govAng; const sw = clamp(speed / 3) * (1 - trip) + trip; fly.forEach(g => { const s = g.userData.s; g.rotation.z = s * lerp(.1, .9, sw); g.userData.w.position.set(s * lerp(.06, .17, sw), lerp(.14, .1, sw), .07); }); pawl.position.y = GR * lerp(.3, .02, trip); pawl.material.emissive.setRGB(.3 + trip * 1.2, .05, 0); }
function govRopeDots(off, amp, col) { for (const side of [-1, 1]) for (let k = 0; k < 90; k++) { const y = fract(k / 90 + side * off / (TOP + .2)) * (TOP + .2) - .2; P.push(GX + side * GR, y, GZ, col[0] * amp, col[1] * amp, col[2] * amp); } }
function sparks(t, p, amp, n = 300, seedOff = 0) { for (let i = 0; i < n; i++) { const k = ((i + seedOff) % P.n) * 4, sd = P.seed; const u = fract(sd[k] + t * 2.2); const vx = (sd[k + 1] - .5) * 3, vy = sd[k + 2] * 2.5 + .5, vz = (sd[k + 3] - .5) * 3; const tt = u * .5;
    const f = (1 - u) * amp; P.push(p.x + vx * tt, p.y + vy * tt - 4.9 * tt * tt, p.z + vz * tt, 2.0 * f, 1.1 * f, .4 * f); } }
function weightBar(x, y, w, frac, label, val, col, a) { if (a <= .01) return; txt(label, x, y - 34, 22, { align: 'left', spacing: 5, alpha: a * .8, fill: col }); g2.save(); g2.globalAlpha = a * .22; g2.fillStyle = '#fff'; g2.fillRect(x, y, w, 30); g2.globalAlpha = a; g2.fillStyle = col; g2.fillRect(x, y, w * clamp(frac), 30); g2.restore(); txt(val, x + w, y - 34, 30, { align: 'right', font: 'Montserrat', weight: 800, alpha: a }); }

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .05; camera.far = 400;
  let bloomS = .6, flash = 0, ca = .0013, fade = 0, grain = .035, expo = 1, dim = 0;
  P.begin(); P.mat.size = .05; cabX.visible = false; cabBody.visible = true; govX.visible = false; otLamp.intensity = 0; hemi.intensity = .9; key.intensity = 2.2;
  for (const c of ['nofall', 'who', 'fail', 'gov', 'lever', 'curious', 'safe', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];
  if (t < TL.start) {
    // A · se rompen todos los cables… y no cae
    const snap = TL.hook + 1.33, fall = clamp((t - snap) / (TL.nofall - snap)); const y0 = 6.2; const brk = smooth(snap, snap + .25, t);
    const drop = t < snap ? 0 : (t < TL.nofall ? 4.9 * Math.pow(t - snap, 2) * .13 : 4.9 * Math.pow(TL.nofall - snap, 2) * .13);
    const cy = y0 - drop; setRig(cy, { broken: brk, wedge: smooth(TL.nofall - .25, TL.nofall, t), lever: -smooth(TL.nofall - .4, TL.nofall - .2, t) * .5 });
    govAng += 0; setGov(0, smooth(TL.nofall - .4, TL.nofall - .2, t));
    if (t > snap && t < snap + .6) for (let i = 0; i < NR; i++) sparks(t, V3(RX(i), cy + 3.7 + i * .2, 0), (1 - (t - snap) / .6) * .8, 40, i * 50);
    const sp = t > TL.nofall - .25 ? smooth(TL.nofall + 1.4, TL.nofall - .25, t) : 0; if (sp > 0) for (const s of [-1, 1]) sparks(t, V3(s * .82, cy + .05, 0), sp, 260, s > 0 ? 3000 : 4000);
    const sh = t > TL.nofall && t < TL.nofall + .4 ? (1 - (t - TL.nofall) / .4) * .06 : 0;
    camOrbit(V3(0, cy + 1.6 + Math.sin(t * 60) * sh, 0), lerp(7.5, 8.5, t / 4), .55 + t * .03, .12, 38); bloomS = .9;
    hud.push(() => { titleHUD('SI SE ROMPIERAN', 'TODOS LOS CABLES…', smooth(.1, .35, t) * (1 - smooth(TL.nofall - .1, TL.nofall + .1, t)), 300); bigStat('', 'NO CAERÍA', 400, smooth(TL.nofall, TL.nofall + .25, t), clamp((t - TL.nofall) / 1)); });
  } else if (t < TL.who) {
    // B · no cuelga de un cable: de varios, cada uno aguanta la cabina llena
    const lt = t - TL.start; const cy = 6.2; setRig(cy, { glow: t > TL.each ? 2 : (t > TL.several ? 'all' : null) }); setGov(0, 0); bloomS = .8;
    camOrbit(V3(0, lerp(cy + 3.2, cy + 3.8, lt / 6), -.3), lerp(6.5, 5.2, smooth(0, 5, lt)), .7 + lt * .05, .2, 38);
    hud.push(() => { titleHUD('PARA EMPEZAR', 'NO CUELGA DE UN CABLE', smooth(0, .3, lt) * (1 - smooth(TL.several - TL.start - .1, TL.several - TL.start + .1, lt)), 300);
      bigStat('CUELGA DE VARIOS', '6 CABLES DE ACERO', 400, smooth(TL.several - TL.start, TL.several - TL.start + .3, lt) * (1 - smooth(TL.each - TL.start - .1, TL.each - TL.start + .1, lt)), clamp((lt - 2) / 1.5));
      titleHUD('CADA UNO PODRÍA SOSTENER', 'ÉL SOLO LA CABINA LLENA', smooth(TL.each - TL.start, TL.each - TL.start + .3, lt), 300); });
  } else if (t < TL.notall) {
    // C · el motor arriba, con una rueda
    const lt = t - TL.who; const cy = lerp(6.2, 8.2, easeInOut(smooth(.3, 3, lt))); setRig(cy); govAng += 0; sheave.rotation.x = -(cy - 6.2) / .5; setGov(0, 0);
    camOrbit(V3(-.2, TOP, -.4), lerp(5, 4, lt / 3), .9 + lt * .04, .3, 38);
    hud.push(() => { titleHUD('¿Y QUIÉN TIRA', 'DE ELLOS?', smooth(0, .3, lt) * (1 - smooth(TL.motor - TL.who - .1, TL.motor - TL.who + .1, lt)), 300);
      titleHUD('UN MOTOR ARRIBA', 'CON UNA RUEDA', smooth(TL.motor - TL.who, TL.motor - TL.who + .3, lt), 300);
      callout(V3(-.7, TOP + .45, -.5), -60, -120, 'MOTOR', null, smooth(TL.motor - TL.who + .2, TL.motor - TL.who + .6, lt), '#7fd4ff'); callout(V3(.25, TOP + .5, -.5), 60, -170, 'POLEA', null, smooth(TL.motor - TL.who + .4, TL.motor - TL.who + .8, lt)); });
  } else if (t < TL.fail) {
    // D · contrapeso: cabina + casi la mitad de la carga; el motor solo mueve la diferencia
    const lt = t - TL.notall; const cy = 8.2 - 5 * easeInOut(smooth(1, 8.5, lt)); setRig(cy, {}); sheave.rotation.x = -(cy - 6.2) / .5; setGov(0, 0);
    camOrbit(V3(0, 7, -.5), 15, Math.PI / 2 - .35, .08, 38); cabBody.visible = true;
    const a1 = smooth(TL.cw - TL.notall, TL.cw - TL.notall + .4, lt), a2 = smooth(TL.heavy - TL.notall, TL.heavy - TL.notall + .4, lt), a3 = smooth(TL.diff - TL.notall, TL.diff - TL.notall + .4, lt);
    hud.push(() => { titleHUD('PERO NO LEVANTA', 'TODO EL PESO', smooth(0, .3, lt) * (1 - smooth(TL.cw - TL.notall - .1, TL.cw - TL.notall + .1, lt)), 300);
      titleHUD('AL OTRO LADO', 'UN CONTRAPESO', a1 * (1 - smooth(TL.diff - TL.notall - .1, TL.diff - TL.notall + .1, lt)), 300);
      callout(cw.position.clone().add(V3(0, 1.2, 0)), -80, -60, 'CONTRAPESO', null, a1, '#e3a372'); callout(cab.position.clone().add(V3(0, 1.2, .7)), 80, -60, 'CABINA', null, a1, '#7fd4ff');
      weightBar(140, 1430, 800, 1.315 / 1.63, 'CABINA + 1/2 CARGA', '1.315 kg', '#7fd4ff', a2); weightBar(140, 1550, 800, 1.285 / 1.63, 'CONTRAPESO = CABINA + 45 % CARGA', '1.285 kg', '#e3a372', a2);
      titleHUD('EL MOTOR SOLO MUEVE', 'LA DIFERENCIA', a3, 300); txt('≈ 30 kg en vez de 1.300 kg', W / 2, 460, 34, { weight: 300, alpha: a3 }); });
  } else if (t < TL.fast) {
    // E · ¿y si falla? otro cable hace girar una polea: el limitador de velocidad
    const lt = t - TL.fail; const fallK = smooth(.6, 2.5, lt); const v = fallK * 2.4; const cy = 6 - (lt > .6 ? .5 * 2.4 * Math.pow(Math.min(lt - .6, 1.9), 2) / 1.9 + Math.max(0, lt - 2.5) * 2.4 : 0); setRig(Math.max(cy, 1.5), {});
    govAng = (6 - Math.max(cy, 1.5)) / GR; setGov(v, 0); govRopeDots(6 - Math.max(cy, 1.5), .9, [1.4, 1.1, .6]); govX.visible = true; govX.material.uniforms.uA.value = smooth(TL.govname - TL.fail, TL.govname - TL.fail + .5, lt);
    const camK = smooth(TL.gov - TL.fail - .3, TL.govname - TL.fail, lt); camOrbit(V3(lerp(0, GX, camK), lerp(Math.max(cy, 1.5) + 1.4, TOP - .1, camK), lerp(0, GZ, camK)), lerp(8, 2.4, camK), lerp(.5, .35, camK), lerp(.1, .15, camK), 38);
    hud.push(() => { titleHUD('¿Y SI AUN ASÍ ALGO FALLA', 'Y EMPIEZA A CAER?', smooth(0, .3, lt) * (1 - smooth(TL.gov - TL.fail - .1, TL.gov - TL.fail + .1, lt)), 300);
      titleHUD('OTRO CABLE', 'HACE GIRAR UNA POLEA', smooth(TL.gov - TL.fail, TL.gov - TL.fail + .3, lt) * (1 - smooth(TL.govname - TL.fail - .1, TL.govname - TL.fail + .1, lt)), 300);
      titleHUD('EL LIMITADOR', 'DE VELOCIDAD', smooth(TL.govname - TL.fail, TL.govname - TL.fail + .3, lt), 300); });
  } else if (t < TL.lever) {
    // F · gira demasiado rápido: la fuerza centrífuga abre las pesas, se enganchan y frenan el cable
    const lt = t - TL.fast; const trip = smooth(TL.weights - TL.fast + .5, TL.weights - TL.fast + .9, lt); const v = lerp(2.6, 4.2, smooth(0, 2, lt)) * (1 - trip);
    govAng += 0; govAng = 30 + lt * 13 * (1 - trip * .9) - (trip > 0 ? 0 : 0); setGov(v, trip); govX.visible = true; govX.material.uniforms.uA.value = 1; setRig(4, {});
    govRopeDots(lt * 4.2 * (1 - trip * .95), .9, trip > .5 ? [1.8, .5, .3] : [1.4, 1.1, .6]);
    camOrbit(V3(GX, TOP - .3, GZ), lerp(2.4, 2.0, lt / 5), .45, .1, 38); bloomS = .9;
    hud.push(() => { titleHUD('SI GIRA DEMASIADO RÁPIDO', 'LA FUERZA CENTRÍFUGA', smooth(0, .3, lt) * (1 - smooth(TL.weights - TL.fast - .1, TL.weights - TL.fast + .1, lt)), 300);
      titleHUD('ABRE UNAS PESAS QUE', 'SE ENGANCHAN Y FRENAN', smooth(TL.weights - TL.fast, TL.weights - TL.fast + .3, lt), 300);
      const p = project(fly[0].userData.w.getWorldPosition(V3())); callout(fly[0].userData.w.getWorldPosition(V3()), -90, 140, 'PESAS', null, smooth(.6, 1, lt) * (1 - smooth(TL.weights - TL.fast - .2, TL.weights - TL.fast, lt)), '#ffb27a'); });
  } else if (t < TL.curious) {
    // G · tira de la palanca → cuñas aprietan los raíles → la cabina se detiene. Sin electricidad.
    const lt = t - TL.lever; const lv = smooth(.3, 1.2, lt); const wd = smooth(TL.wedges - TL.lever + .4, TL.wedges - TL.lever + 1.2, lt);
    const v = 3.2 * (1 - smooth(TL.wedges - TL.lever + .8, TL.stop - TL.lever + .1, lt)); const yy = 9 - (lt * 3.2 - Math.max(0, lt - (TL.wedges - TL.lever + .8)) * 1.6); const cy = Math.max(2, t < TL.stop + .1 ? yy : 9 - (TL.stop + .1 - TL.lever) * 3.2 + ((TL.stop + .1 - TL.lever) - (TL.wedges - TL.lever + .8)) * 1.6);
    setRig(cy, { lever: -lv * .55, wedge: wd }); setGov(0, 1); bloomS = .9; lever.children[0].material.emissive.setRGB(lv * .8, lv * .4, 0);
    if (wd > .3 && v > .1) for (const s of [-1, 1]) sparks(t, V3(s * .82, cy + .1, 0), clamp(v / 2), 300, s > 0 ? 3000 : 5000);
    const sh = t > TL.stop && t < TL.stop + .35 ? (1 - (t - TL.stop) / .35) * .05 : 0; const mk = smooth(TL.mech - TL.lever - .2, TL.mech - TL.lever + .8, lt);
    camOrbit(V3(0, cy + lerp(1.6, 1.0, smooth(TL.wedges - TL.lever - .5, TL.wedges - TL.lever + .3, lt)) + Math.sin(t * 70) * sh, .2), lerp(lerp(9, 7, smooth(TL.wedges - TL.lever - .5, TL.wedges - TL.lever + .3, lt)), 10, mk), .62 + lt * .03, .12, 38);
    hud.push(() => { titleHUD('AL FRENARSE, TIRA DE', 'UNA PALANCA EN LA CABINA', smooth(0, .3, lt) * (1 - smooth(TL.wedges - TL.lever - .1, TL.wedges - TL.lever + .1, lt)), 300);
      callout(lever.getWorldPosition(V3()).add(V3(.3, 0, 0)), 70, -90, 'PALANCA', null, smooth(.3, .7, lt) * (1 - smooth(TL.wedges - TL.lever - .2, TL.wedges - TL.lever, lt)), '#ffb27a');
      titleHUD('CUÑAS DE ACERO', 'APRIETAN LOS RAÍLES', smooth(TL.wedges - TL.lever, TL.wedges - TL.lever + .3, lt) * (1 - smooth(TL.stop - TL.lever - .1, TL.stop - TL.lever + .1, lt)), 300);
      callout(wedges[1].getWorldPosition(V3()), 80, 90, 'CUÑA', null, smooth(TL.wedges - TL.lever + .2, TL.wedges - TL.lever + .6, lt) * (1 - smooth(TL.stop - TL.lever - .2, TL.stop - TL.lever, lt)), '#ffb27a');
      bigStat('', 'SE DETIENE', 400, smooth(TL.stop - TL.lever, TL.stop - TL.lever + .25, lt) * (1 - smooth(TL.mech - TL.lever - .1, TL.mech - TL.lever + .1, lt)), clamp((t - TL.stop) / 1));
      titleHUD('SIN ELECTRICIDAD', 'SOLO MECÁNICA', smooth(TL.mech - TL.lever, TL.mech - TL.lever + .3, lt), 300); });
  } else if (t < TL.brand) {
    // H · Nueva York, 1854: Elisha Otis manda cortar la cuerda
    const lt = t - TL.curious; hemi.intensity = .25; key.intensity = 1.8; otLamp.intensity = 70; hemi.intensity = .9; expo = 1.9; grain = .06;
    const cutT = TL.cut + .6; const dropT = t - cutT; const py0 = 6; const py = dropT < 0 ? py0 : py0 - Math.min(.35, 4.9 * dropT * dropT);
    plat.position.y = py; spring.scale.y = dropT < 0 ? 1 : .55; spring.position.y = 1.0 + (dropT < 0 ? 0 : .2);
    seg(otRope, 0, py + 2.15, 9.1, 0); if (dropT < 0) { otRope2.visible = false; } else { seg(otRope, 0, lerp(py + 2.15, 9.1, smooth(0, .5, dropT)) , 9.1, 0); seg(otRope2, 0, py + 2.15, py + 2.15 + .6 * (1 - smooth(0, .5, dropT)) + .02, 0); }
    man.userData.arm.rotation.z = t > TL.safe ? -3.0 + Math.sin(t * 5) * .1 : -2.6;
    if (dropT > 0 && dropT < .7) for (const s of [-1, 1]) sparks(t, V3(80 + s * 1.3, py + 1.0, 0), (1 - dropT / .7), 160, s > 0 ? 3000 : 5000);
    const ck = smooth(TL.otis - TL.curious - .6, TL.otis - TL.curious + .8, lt);
    camera.position.set(80 + lerp(-3, 1.5, ck) + Math.sin(lt * .1) * .5, lerp(3.2, 6.5, ck), lerp(17, 11, ck)); camera.lookAt(80, lerp(6.2, 7.6, ck), 0); camera.fov = 38;
    hud.push(() => { titleHUD('Y LO MÁS CURIOSO', 'ESTE FRENO SE PRESENTÓ…', smooth(0, .3, lt) * (1 - smooth(TL.y1854 - TL.curious - .1, TL.y1854 - TL.curious + .1, lt)), 300);
      bigStat('NUEVA YORK', '1854', 420, smooth(TL.y1854 - TL.curious, TL.y1854 - TL.curious + .3, lt) * (1 - smooth(TL.otis - TL.curious - .1, TL.otis - TL.curious + .1, lt)), clamp((t - TL.y1854) / 1.5));
      titleHUD('SU INVENTOR', 'ELISHA OTIS', smooth(TL.otis - TL.curious, TL.otis - TL.curious + .3, lt) * (1 - smooth(TL.cut - TL.curious - .1, TL.cut - TL.curious + .1, lt)), 300);
      titleHUD('MANDÓ CORTAR LA CUERDA', 'DELANTE DEL PÚBLICO', smooth(TL.cut - TL.curious, TL.cut - TL.curious + .3, lt) * (1 - smooth(TL.safe - TL.curious - .1, TL.safe - TL.curious + .1, lt)), 300);
      txt('«¡TODO A SALVO,', W / 2, 330, 72, { font: 'Montserrat', weight: 800, alpha: smooth(TL.safe - TL.curious + .1, TL.safe - TL.curious + .4, lt), fill: copperGrad(140, 940, 330, .5) });
      txt('CABALLEROS!»', W / 2, 420, 72, { font: 'Montserrat', weight: 800, alpha: smooth(TL.safe - TL.curious + .6, TL.safe - TL.curious + .9, lt), fill: copperGrad(140, 940, 420, .5) }); });
  } else {
    // I · marca
    const lt = t - TL.brand; setRig(6.2); setGov(0, 0); camOrbit(V3(0, 7.5, 0), 20 + lt * 1.5, .5 + lt * .04, .1, 38); expo = .9; fade = Math.min(.5, lt * .45); dim = smooth(0, .8, lt) * .6;
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  fill.position.copy(camera.position).add(V3(0, 3, 0));
  P.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (dim > 0) hud.unshift(() => { g2.save(); g2.globalAlpha = dim * .7; g2.fillStyle = '#02050b'; g2.fillRect(0, 0, W, H); g2.restore(); });
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
function renderCover() { renderFrame(TL.nofall + .05); coverText('¿POR QUÉ NO', 'SE CAE?', 'Aunque se rompan todos los cables'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
