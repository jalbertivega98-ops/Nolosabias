// NO LO SABÍAS — "¿Cómo se infla un airbag tan rápido?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final. Esquema, no a escala (1 u ≈ 10 cm en el coche).
// Acelerómetro MEMS (masa móvil con peines capacitivos) → centralita decide en milisegundos → iniciador → propulsor sólido (hoy nitrato de guanidina; antes azida sódica) → gas, sobre todo N₂.
// Bolsa del conductor llena en ~30 ms; frente de la bolsa a >200 km/h; orificios de venteo para desinflar y frenar al ocupante gradualmente. Parpadeo ≈ 100–150 ms.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, easeIn, V3, g2, camera, Particles, txt, copperGrad, project, callout, titleHUD, fract, camOrbit, bigStat, drawBrand, coverText, finish, arrowXY, noise1, shake } from '../../lib/core.js';

const scene = new THREE.Scene(); scene.background = new THREE.Color(0x05070d);
scene.add(new THREE.HemisphereLight(0xc8d8ff, 0x302820, 1.4));
const key = new THREE.DirectionalLight(0xffe8d0, 2.6); key.position.set(30, 50, 70); scene.add(key);
const fillL = new THREE.DirectionalLight(0x8ab0ff, 1.1); fillL.position.set(-60, 0, 40); scene.add(fillL);
const rim = new THREE.DirectionalLight(0xffa070, 1.4); rim.position.set(0, 30, -60); scene.add(rim);
const M = (c, r = .5, m = .3, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: e });
const box = (w, h, d, mat, x = 0, y = 0, z = 0, parent = scene) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; };
function xray(col, k = 1) { return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  uniforms: { uCol: { value: col.clone() }, uA: { value: k } },
  vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform vec3 uCol; uniform float uA; varying vec3 vN; varying vec3 vV; void main(){ float f=pow(clamp(1.-abs(dot(vN,vV)),0.,1.),2.); gl_FragColor=vec4(uCol*(f*.8+.08)*uA,(f*.7+.06)*uA); }` }); }

// ==========================================================================
// COCHE (genérico) con maniquí de pruebas, volante y airbag
// ==========================================================================
const car = new THREE.Group(); scene.add(car);
const prof = new THREE.Shape(); [[-22, 3], [22, 3], [22.5, 8], [19, 9.8], [8, 10.8], [1.5, 18], [-11, 18], [-19, 12], [-22.5, 10.5]].forEach(([x, y], i) => i ? prof.lineTo(x, y) : prof.moveTo(x, y)); prof.closePath();
const bodyG = new THREE.ExtrudeGeometry(prof, { depth: 17, bevelEnabled: true, bevelSize: .6, bevelThickness: .6, bevelSegments: 3, curveSegments: 4 }); bodyG.translate(0, 0, -8.5);
const paint = new THREE.MeshStandardMaterial({ color: 0x8a1c18, roughness: .55, metalness: .25, transparent: true });
const body = new THREE.Mesh(bodyG, paint); car.add(body);
const bodyX = new THREE.Mesh(bodyG, xray(new THREE.Color(.5, .75, 1.3), 1)); car.add(bodyX);
const edges = new THREE.LineSegments(new THREE.EdgesGeometry(bodyG, 25), new THREE.LineBasicMaterial({ color: 0x6fa8ff, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false })); car.add(edges);
const glass = new THREE.MeshStandardMaterial({ color: 0x0a1424, roughness: .1, metalness: .4, transparent: true, opacity: .85 });
const wheels = []; for (const x of [-14, 14]) for (const z of [-8.6, 8.6]) { const w = new THREE.Group(); w.position.set(x, 3.3, z); car.add(w);
  const tire = new THREE.Mesh(new THREE.TorusGeometry(2.6, 1, 14, 36), M(0x141414, .9, .05)); w.add(tire); const rimM = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 1.4, 24), M(0xb8bcc4, .3, .8)); rimM.rotation.x = Math.PI / 2; w.add(rimM); wheels.push(w); }
// interior
const inter = new THREE.Group(); car.add(inter);
const seatMat = M(0x1c1e24, .85, .05); box(5, 1.6, 5, seatMat, -3.5, 6.6, 4, inter); const seatBack = box(1.4, 8, 5, seatMat, -6.6, 10.5, 4, inter); seatBack.rotation.z = .18;
const dash = box(5, 3.2, 16, M(0x23262c, .7, .2), 9.5, 10, 0, inter);
const ecu = box(1.6, .6, 1.6, M(0x1a5a34, .5, .3, 0x0a2a14), 1.5, 5.4, 0, inter); box(1, .25, 1, M(0x111111, .4, .3), 1.5, 5.8, 0, inter);
// volante: el plano del aro mira al conductor (normal hacia −x y un poco arriba)
const wheelG = new THREE.Group(); wheelG.position.set(5, 11.6, 4); wheelG.rotation.z = -.42; inter.add(wheelG);
const swMat = M(0x16181c, .6, .2); { const ring = new THREE.Mesh(new THREE.TorusGeometry(2.3, .32, 12, 40), swMat); ring.rotation.y = Math.PI / 2; wheelG.add(ring);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .9, 24), M(0x2a2d33, .6, .2)); hub.rotation.z = Math.PI / 2; wheelG.add(hub); box(.3, 4.4, .4, swMat, 0, 0, 0, wheelG);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, 6, 12), M(0x2a2d33, .5, .3)); col.rotation.z = Math.PI / 2; col.position.x = 3; wheelG.add(col); }
// módulo airbag (en el volante)
const inflM = new THREE.Mesh(new THREE.CylinderGeometry(.7, .7, .6, 20), M(0xa0a4ac, .3, .8, 0)); inflM.rotation.z = Math.PI / 2; inflM.position.x = .3; wheelG.add(inflM);
// bolsa: esfera deformada con arrugas; crece hacia el conductor (−x local)
const BAG_SEG = [56, 36]; const bagGeo = new THREE.SphereGeometry(1, BAG_SEG[0], BAG_SEG[1]); const bagBase = bagGeo.attributes.position.array.slice();
const bagMat = new THREE.MeshStandardMaterial({ color: 0xe6e2da, roughness: 1, metalness: 0, side: THREE.DoubleSide, emissive: 0x1a1814 });
const bag = new THREE.Mesh(bagGeo, bagMat); wheelG.add(bag);
const ventMat = M(0x2a2620, .9, 0); const vents = [-1, 1].map(s => { const v = new THREE.Mesh(new THREE.CircleGeometry(.42, 20), ventMat); bag.add(v); v.userData.s = s; return v; });
function setBag(k, wr = 0, squash = 0, t = 0) {
  // k: 0 plegada → 1 llena; wr: arrugas al desinflar; squash: aplastada por el cuerpo
  bag.visible = k > .01; if (!bag.visible) return; const dep = 4.6 * k, rad = 3.4 * Math.min(1, k * 1.15);
  const p = bagGeo.attributes.position.array; for (let i = 0; i < p.length; i += 3) { const x = bagBase[i], y = bagBase[i + 1], z = bagBase[i + 2];
    let r = 1 + (wr * .22 + (1 - k) * .1) * noise1(x * 3.1 + y * 5.3 + z * 4.7 + 11) + .03 * Math.sin(x * 9 + t * 40) * (1 - smooth(.8, 1, k)) ;
    let xx = x * r; if (xx < 0) xx *= (1 - squash * .45); p[i] = xx; p[i + 1] = y * r * (1 + squash * .12); p[i + 2] = z * r * (1 + squash * .12); }
  bagGeo.attributes.position.needsUpdate = true; bagGeo.computeVertexNormals();
  bag.scale.set(dep / 2, rad, rad); bag.position.x = -dep / 2 + .2;
  for (const v of vents) { v.position.set(.25, .1, v.userData.s * .985); v.rotation.y = v.userData.s > 0 ? 0 : Math.PI; v.scale.set(1 / (dep / 2) * .9, 1 / rad * .9, 1); v.scale.multiplyScalar(1); }
}
// maniquí de pruebas (amarillo, genérico)
const dummyMat = M(0xe8b830, .55, .1), jointMat = M(0x2a2a2a, .5, .3);
const hip = new THREE.Group(); hip.position.set(-3.8, 7.6, 4); inter.add(hip);
const torso = new THREE.Group(); hip.add(torso);
box(2.6, 6.4, 3.8, dummyMat, 0, 3.4, 0, torso); const neck = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, 1.2, 12), jointMat); neck.position.y = 7.2; torso.add(neck);
const head = new THREE.Mesh(new THREE.SphereGeometry(1.55, 32, 24), dummyMat); head.position.set(.2, 9.1, 0); torso.add(head);
{ const tgt = new THREE.CanvasTexture((() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#e8b830'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#111'; x.beginPath(); x.moveTo(64, 64); x.arc(64, 64, 60, 0, Math.PI / 2); x.fill(); x.beginPath(); x.moveTo(64, 64); x.arc(64, 64, 60, Math.PI, Math.PI * 1.5); x.fill(); return c; })()); tgt.colorSpace = THREE.SRGBColorSpace;
  const d = new THREE.Mesh(new THREE.CircleGeometry(.75, 24), new THREE.MeshStandardMaterial({ map: tgt, roughness: .6 })); d.position.set(.2, 9.3, 1.56); torso.add(d); }
const arm = new THREE.Group(); arm.position.set(.4, 6.2, 1.2); torso.add(arm); box(5.6, .9, .9, dummyMat, 2.6, 0, 0, arm); arm.rotation.z = -.5;
box(5.6, 1.6, 2.6, dummyMat, 2.6, 0, 0, hip); const shin = box(1.4, 5, 2.2, dummyMat, 5.6, -2.4, 0, hip); shin.rotation.z = -.25;
const wall = box(3, 24, 30, M(0x6a6e74, .95, 0), 25, 12, 0); const floor = new THREE.Mesh(new THREE.PlaneGeometry(800, 200), M(0x15181e, .9, 0)); floor.rotation.x = -Math.PI / 2; scene.add(floor);
const stripes = []; for (let i = 0; i < 4; i++) stripes.push(box(.4, 24.2, 30.2, M(0xe8b830, .6, .1), 25, 12, 0)); stripes.forEach((s, i) => { s.scale.set(1, .06, 1); s.position.y = 3 + i * 6; });
function carX(k) { paint.opacity = 1 - k * .9; glass.opacity = .85 * (1 - k); bodyX.material.uniforms.uA.value = .25 + k * .9; edges.material.opacity = .2 + k * .5; }

// ==========================================================================
// ACELERÓMETRO MEMS (masa móvil + peines capacitivos), esquema ampliado
// ==========================================================================
const MS = V3(0, 600, 0); const mems = new THREE.Group(); mems.position.copy(MS); scene.add(mems);
const siMat = M(0xb8c2d2, .5, .35, 0x1a2230), fixMat = M(0x7a8290, .6, .3, 0x10141c), subMat = M(0x101622, .7, .2);
box(44, 34, 1, subMat, 0, 0, -2, mems);
const mass = new THREE.Group(); mems.add(mass); box(18, 9, 1.4, siMat, 0, 0, 0, mass);
for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) box(1, 1, .2, M(0x5a6270, .5, .6), i * 5, j * 2.6, .75, mass);
const FX = [-7.5, -4.5, -1.5, 1.5, 4.5, 7.5];
for (const s of [-1, 1]) { for (const x of FX) box(.8, 6, 1.4, siMat, x, s * 7.5, 0, mass); box(20, 1.4, 1.4, fixMat, 0, s * 12.3, 0, mems); for (const x of FX) box(.8, 6, 1.4, fixMat, x + 1.5, s * 8.6, 0, mems); }
const springs = [-1, 1].map(s => { const g = new THREE.Group(); g.position.x = s * 9; mems.add(g); box(2.6, 4, 2, fixMat, s * 9, 0, 0, g); return g; });
const springMesh = []; for (const s of [-1, 1]) { const pts = []; for (let i = 0; i <= 12; i++) pts.push(V3(i / 12, (i % 2 ? 1 : -1) * (i && i < 12 ? 1.6 : 0), 0)); const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .1), 80, .22, 6), siMat); mems.add(m); m.userData.s = s; springMesh.push(m); box(2.6, 5, 1.4, fixMat, s * 17, 0, 0, mems); }
function setMass(d) { mass.position.x = d; for (const m of springMesh) { const s = m.userData.s; const x0 = s * 9 + d, x1 = s * 15.7; m.position.set(x0, 0, 0); m.scale.set(x1 - x0, 1, 1); } }

// ==========================================================================
// GENERADOR DE GAS (corte): iniciador + pastillas de propulsor + filtro
// ==========================================================================
const GS = V3(0, 1200, 0); const gen = new THREE.Group(); gen.position.copy(GS); scene.add(gen);
const shellMat = new THREE.MeshStandardMaterial({ color: 0xb8bcc6, roughness: .3, metalness: .85, side: THREE.DoubleSide });
{ const sh = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 22, 48, 1, true, 0, Math.PI), shellMat); sh.rotation.z = Math.PI / 2; sh.rotation.y = 0; gen.add(sh); sh.rotation.x = -Math.PI / 2;
  const cap = new THREE.Mesh(new THREE.CircleGeometry(5, 48, 0, Math.PI), shellMat); cap.rotation.y = Math.PI / 2; cap.position.x = -11; gen.add(cap); const cap2 = cap.clone(); cap2.position.x = 11; gen.add(cap2); }
const filt = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 20, 40, 1, true, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x7a7060, roughness: .9, metalness: .3, wireframe: true, transparent: true, opacity: .35 })); filt.rotation.z = Math.PI / 2; filt.rotation.x = -Math.PI / 2; gen.add(filt);
const pellets = []; for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 1, 32), M(0x4a5a3a, .8, .05)); m.rotation.z = Math.PI / 2; m.position.x = -6.5 + i * 1.45; gen.add(m); pellets.push(m); }
const igniter = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 2.6, 20), M(0xd08848, .3, .8)); igniter.rotation.z = Math.PI / 2; igniter.position.x = -9.6; gen.add(igniter);
const wires = [-1, 1].map(s => { const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(-10.9, s * .5, 0), V3(-14, s * .8, 0), V3(-18, s * 2, 1)]), 20, .2, 8), M(s > 0 ? 0xc03020 : 0x202020, .5, .2)); gen.add(m); return m; });
const PORTS = []; for (let i = 0; i < 6; i++) for (const a of [-.9, -.3, .3, .9]) PORTS.push([-5 + i * 2.4, a]);

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
const P = new Particles(16000, { size: .4, seed: 37 }); scene.add(P.obj);
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
function show(o) { car.visible = !!o.car; wall.visible = stripes[0].visible = !!o.wall; stripes.forEach(s => s.visible = !!o.wall); floor.visible = !!o.car; mems.visible = !!o.mems; gen.visible = !!o.gen; }
function pose(lean = 0) { torso.rotation.z = -lean; arm.rotation.z = -.5 + lean * .6; }
const DRV = () => V3(-1, 12.5, 4).add(car.position);
const L = (t, a, b) => smooth(TL[a], TL[a] + .3, t) * (b ? 1 - smooth(TL[b] - .1, TL[b] + .1, t) : 1);
// curva de inflado (k frente al tiempo normalizado u, con pequeño rebote)
const inflK = u => u <= 0 ? 0 : u >= 1 ? 1 + .04 * Math.sin((u - 1) * 18) * Math.exp(-(u - 1) * 6) : easeOut(u) * 1.0;
function gasFromVents(t, k, n) { const s = P.seed; wheelG.updateMatrixWorld(true); for (const v of vents) { const wp = v.getWorldPosition(V3(0, 0, 0)); const dir = V3(0, 0, v.userData.s).applyQuaternion(wheelG.getWorldQuaternion(new THREE.Quaternion()));
    for (let i = 0; i < n; i++) { const q = ((i + (v.userData.s > 0 ? 0 : 3000)) % P.n) * 4; const age = fract(s[q] + t * 1.6); const sp = 7 * age; const f = k * (1 - age) * .9;
      P.push(wp.x + dir.x * sp + (s[q + 1] - .5) * 3 * age, wp.y + dir.y * sp + (s[q + 2] - .5) * 3 * age + age * 1.5, wp.z + dir.z * sp + (s[q + 3] - .5) * 3 * age, .8 * f, .95 * f, 1.3 * f); } } }

function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .1; camera.far = 5000;
  let bloomS = .7, flash = 0, ca = .0013, fade = 0, grain = .035, expo = 1.2, dim = 0;
  P.begin(); P.mat.size = .35; show({}); car.position.set(0, 0, 0); carX(0); setBag(0); pose(0); ecu.material.emissive.setRGB(.04, .16, .08); pellets.forEach(p => p.material.emissive.setRGB(0, 0, 0)); igniter.material.emissive.setRGB(0, 0, 0); wheels.forEach(w => w.rotation.z = 0);
  for (const c of ['how', 'mass', 'det', 'fill', 'but', 'curious', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  flash = Math.max(flash, flashAt(t, TL.crash, .35, .55));
  const hud = [];
  if (t < TL.how) {
    // A · gancho: la bolsa sale disparada del volante
    show({ car: true }); carX(1); const u = (t - .35) / .45; setBag(inflK(u), 0, 0, t); const lean = smooth(.3, .9, t) * .22; pose(lean);
    camOrbit(V3(1, 11.5, 4), lerp(38, 44, t / TL.how), .5 - t * .04, .12, 40); const sh = shake(t, .35 * Math.max(0, 1 - Math.abs(t - .6) * 3)); camera.position.add(sh); bloomS = .9; expo = 1.3;
    hud.push(() => { titleHUD('UN AIRBAG SE INFLA MÁS RÁPIDO', 'QUE UN PARPADEO', smooth(.15, .45, t), 300); });
  } else if (t < TL.mass) {
    // B · choque contra el muro; el sensor nota el frenazo
    show({ car: true, wall: true }); const lt = t - TL.how; const dx = t < TL.crash ? (t - TL.crash) * 34 : -Math.max(0, 1 - (t - TL.crash) * 8) * 0; car.position.x = Math.min(0, dx) - .4; wheels.forEach(w => w.rotation.z = -Math.min(0, dx) / 3.3 * -1);
    const xk = smooth(TL.sensor - .3, TL.sensor + .4, t); carX(.15 + xk * .85); const imp = t >= TL.crash ? Math.max(0, 1 - (t - TL.crash) * 2.5) : 0;
    const lean = t >= TL.crash ? smooth(TL.crash, TL.crash + .25, t) * .12 : 0; pose(lean); car.rotation.z = -imp * .03;
    const ek = smooth(TL.sensor, TL.sensor + .3, t); ecu.material.emissive.setRGB(.1 + ek * (.6 + .4 * Math.sin(t * 20)), .4 * ek + .16, .08);
    const tgt = V3(lerp(lerp(car.position.x - 1, 4, smooth(TL.crash - .8, TL.crash, t)), 0, xk), lerp(9, 8, xk), lerp(0, 2, xk)); camOrbit(tgt, lerp(118, 52, easeInOut(xk)), lerp(.32, .45, xk), lerp(.14, .3, xk), 38); camera.position.add(shake(t, imp * 1.6)); bloomS = .8;
    if (t >= TL.crash) { const s = P.seed; for (let i = 0; i < 600; i++) { const q = (i % P.n) * 4; const age = (t - TL.crash) * 1.2 + s[q] * .1; if (age > 1) continue; const f = (1 - age); P.push(23 - age * 8 * s[q + 1], 2 + s[q + 2] * 10 + age * 4 * (s[q + 3] - .3), (s[q + 3] - .5) * 18 + (s[q + 1] - .5) * age * 10, 1.4 * f, 1.1 * f, .7 * f); } P.mat.size = .45; }
    hud.push(() => { titleHUD('¿CÓMO LO HACE', 'TAN RÁPIDO?', L(t, 'how', 'crash'), 300); titleHUD('EL COCHE CHOCA…', 'UN SENSOR NOTA EL FRENAZO', L(t, 'crash'), 300);
      callout(ecu.getWorldPosition(V3(0, 0, 0)), -90, 280, 'SENSOR + CENTRALITA', 'en el centro del coche', smooth(TL.sensor + .3, TL.sensor + .6, t), '#7fe0a0'); });
  } else if (t < TL.det) {
    // C · acelerómetro MEMS: una masa diminuta se desplaza; la electrónica decide en milisegundos
    show({ mems: true }); const lt = t - TL.mass; const hit = smooth(TL.mass + .7, TL.mass + 1.0, t); const d = hit * 1.1 + Math.sin((t - TL.mass - 1) * 14) * .15 * hit * Math.exp(-Math.max(0, t - TL.mass - 1) * 1.5);
    setMass(d); camOrbit(MS.clone().add(V3(0, 0, 0)), lerp(78, 70, lt / 5), .18 - lt * .03, .28, 38); bloomS = .8; expo = 1.25; dim = smooth(TL.decide - .2, TL.decide + .3, t) * .55;
    const s = P.seed; for (let i = 0; i < 2400; i++) { const q = (i % P.n) * 4; const side = i % 2 ? 1 : -1; const fi = Math.floor(s[q] * 6); const xm = FX[fi] + d, xf = FX[fi] + 1.5; const gap = xf - xm - .8; const u = s[q + 1]; const y = side * (6 + s[q + 2] * 4.5);
      const f = clamp(.9 / Math.max(gap, .2)) * (.35 + .25 * Math.sin(t * 6 + i)); P.push(MS.x + lerp(xm + .4, xf - .4, u), MS.y + y, MS.z + .2, .4 * f, 1.3 * f, 1.0 * f); } P.mat.size = .2;
    hud.push(() => { titleHUD('DENTRO DE UN CHIP', 'UNA PIEZA DIMINUTA SE DESPLAZA', L(t, 'mass', 'decide'), 300);
      callout(mass.getWorldPosition(V3(0, 0, 0)).add(V3(0, 3.5, 1)), 150, -330, 'MASA MÓVIL', '≈ 0,1 mm de ancho', smooth(TL.mass + .5, TL.mass + .9, t) * (1 - smooth(TL.decide - .2, TL.decide, t)));
      callout(MS.clone().add(V3(-4.5 + d, -9, 1)), 140, 300, 'PEINES', 'miden el movimiento', smooth(TL.mass + 1.2, TL.mass + 1.6, t) * (1 - smooth(TL.decide - .2, TL.decide, t)), '#7fd4ff');
      if (t > TL.mass + .7 && t < TL.decide) arrowXY(W / 2 - 160, 1250, W / 2 + 160, 1250, smooth(TL.mass + .7, TL.mass + 1.1, t), '#ff8a5a', 10);
      // gráfica aceleración vs tiempo con umbral de disparo
      const ga = smooth(TL.decide, TL.decide + .3, t); if (ga > .01) { const x0 = 140, x1 = 940, y0 = 1150, y1 = 620, thr = 800; const u = clamp((t - TL.decide - .2) / 1.6);
        g2.save(); g2.globalAlpha = ga; g2.strokeStyle = 'rgba(255,255,255,.5)'; g2.lineWidth = 2; g2.beginPath(); g2.moveTo(x0, y1 - 20); g2.lineTo(x0, y0); g2.lineTo(x1, y0); g2.stroke();
        g2.setLineDash([12, 10]); g2.strokeStyle = '#ff8a5a'; g2.beginPath(); g2.moveTo(x0, thr); g2.lineTo(x1, thr); g2.stroke(); g2.setLineDash([]);
        g2.strokeStyle = '#7fd4ff'; g2.lineWidth = 6; g2.shadowColor = '#7fd4ff'; g2.shadowBlur = 16; g2.beginPath(); const N = 120; let cx = x0, cy = y0;
        for (let i = 0; i <= N * u; i++) { const v = i / N; const a = v < .12 ? .03 * Math.sin(v * 80) : (1 - Math.exp(-(v - .12) * 9)) * .9 + .05 * Math.sin(v * 50); cx = lerp(x0, x1, v); cy = y0 - a * (y0 - y1); i ? g2.lineTo(cx, cy) : g2.moveTo(cx, cy); } g2.stroke(); g2.restore();
        txt('UMBRAL', x1, thr - 28, 24, { align: 'right', spacing: 4, alpha: ga * .9, fill: '#ff8a5a' }); txt('FRENAZO', x0 + 10, y1 - 40, 24, { align: 'left', spacing: 4, alpha: ga * .8 });
        const ms = Math.round(u * 40); txt(ms + ' ms', x1, y0 + 50, 40, { align: 'right', font: 'Montserrat', weight: 800, alpha: ga });
        const fire = smooth(.45, .5, u); if (fire > 0) { const fx = lerp(x0, x1, .33); g2.save(); g2.globalAlpha = ga * fire; g2.fillStyle = '#ffe2c0'; g2.shadowColor = '#ff8a5a'; g2.shadowBlur = 30; g2.beginPath(); g2.arc(fx, thr, 12, 0, 7); g2.fill(); g2.restore(); txt('¡DISPARA!', fx + 20, 560, 52, { align: 'left', font: 'Montserrat', weight: 800, alpha: ga * fire, fill: copperGrad(fx, fx + 320, 560, .5) }); }
        titleHUD('LA ELECTRÓNICA DECIDE', 'EN MILÉSIMAS DE SEGUNDO', ga, 300); } });
  } else if (t < TL.fill) {
    // D · detonador → la pastilla arde → gas (sobre todo nitrógeno)
    show({ gen: true }); const lt = t - TL.det; const ig = smooth(TL.det + .7, TL.det + .9, t); igniter.material.emissive.setRGB(ig * 1.6, ig * .6, ig * .1);
    const burn = clamp((t - TL.pellet - .2) / 2.2); pellets.forEach((p, i) => { const b = clamp(burn * 13 - i); const g = b * (1 - smooth(.6, 1, burn) * .6) * (.8 + .2 * Math.sin(t * 30 + i)); p.material.emissive.setRGB(g * 1.8, g * .7, g * .15); p.scale.set(1, 1, 1); p.scale.setScalar(1 - b * smooth(TL.gas, TL.air, t) * .35); });
    camOrbit(GS.clone().add(V3(0, -2, 0)), lerp(84, 76, lt / 8.6), .1 + lt * .02, .42, 38); bloomS = 1; expo = 1.25;
    const s = P.seed; if (ig > 0 && t < TL.pellet + .4) for (let i = 0; i < 300; i++) { const q = (i % P.n) * 4; const age = fract(s[q] + t * 3); const f = ig * (1 - age); P.push(GS.x - 8.3 + age * 3 * s[q + 1], GS.y + (s[q + 2] - .5) * 3 * age, GS.z + (s[q + 3] - .5) * 3 * age, 2 * f, 1.2 * f, .3 * f); }
    const gk = smooth(TL.pellet + .3, TL.gas, t); if (gk > 0) for (let i = 0; i < 5000; i++) { const q = (i % P.n) * 4; const pt = PORTS[i % PORTS.length]; const age = fract(s[q] + t * .9); const r = 5 + age * 22 * (.6 + s[q + 1] * .6); const a = pt[1] + (s[q + 2] - .5) * .5 + Math.PI / 2;
      const hot = Math.max(0, 1 - age * 2.5); const f = gk * (1 - age) * 1.1; P.push(GS.x + pt[0] + (s[q + 3] - .5) * age * 10, GS.y + Math.sin(a) * r * 1, GS.z + Math.cos(a) * r * .9 + 2, (.5 + hot * 1.4) * f, (.8 + hot * .4) * f, 1.4 * f * (1 - hot * .6)); }
    P.mat.size = .6;
    hud.push(() => { titleHUD('ENCIENDE UN', 'PEQUEÑO DETONADOR', L(t, 'det', 'pellet'), 300); titleHUD('UNA PASTILLA QUÍMICA', 'ARDE DE GOLPE', L(t, 'pellet', 'gas'), 300);
      callout(igniter.getWorldPosition(V3(0, 0, 0)), 40, 300, 'DETONADOR', null, smooth(TL.det + .3, TL.det + .6, t) * (1 - smooth(TL.gas - .2, TL.gas, t)), '#ff8a5a');
      callout(pellets[6].getWorldPosition(V3(0, 0, 0)).add(V3(0, 2.5, 2)), 120, -260, 'PROPULSOR SÓLIDO', 'pastillas', smooth(TL.pellet + .2, TL.pellet + .5, t) * (1 - smooth(TL.gas - .2, TL.gas, t)));
      titleHUD('SUELTA MUCHÍSIMO GAS…', 'SOBRE TODO NITRÓGENO', L(t, 'gas', 'air'), 300);
      bigStat('', 'N₂', 1180, smooth(TL.n2, TL.n2 + .3, t), clamp((t - TL.n2) / 1.5));
      titleHUD('EL MISMO QUE', 'RESPIRAS EN EL AIRE', L(t, 'air'), 300);
      const aa = smooth(TL.air + .3, TL.air + .7, t); if (aa > .01) { const x = 190, w = 700, y = 1400; g2.save(); g2.globalAlpha = aa * .25; g2.fillStyle = '#fff'; g2.fillRect(x, y, w, 26); g2.globalAlpha = aa; g2.fillStyle = '#7fb8ff'; g2.fillRect(x, y, w * .78 * easeOut(clamp((t - TL.air - .3) / 1)), 26); g2.restore();
        txt('AIRE: 78 % NITRÓGENO', x, y - 34, 28, { align: 'left', spacing: 3, weight: 700, alpha: aa }); } });
  } else if (t < TL.curious) {
    // E · se llena en ~30 ms a >200 km/h; luego lo importante: desinflarse por los agujeros
    show({ car: true }); carX(.85); const lt = t - TL.fill; const u = (t - TL.fill - .2) / 1.5; let k = inflK(u);
    const bodyK = smooth(TL.body, TL.body + 1.2, t); const esc = smooth(TL.escape, TL.curious - .5, t); k = k * (1 - esc * .55); pose(bodyK * .42 + esc * .08); setBag(k, esc, bodyK * .6, t);
    const deflV = smooth(TL.holes - .3, TL.holes + .3, t);
    const tgt = V3(.5, 11.5, 4); camOrbit(tgt, lerp(42, 46, lt / 13), lerp(.45, .65, smooth(TL.but, TL.holes + .5, t)), .1, 40); bloomS = .85; expo = 1.3;
    if (t > TL.fill + .2 && t < TL.fill + 1.4) camera.position.add(shake(t, .25 * (1 - (t - TL.fill - .2) / 1.2)));
    if (esc > 0) { gasFromVents(t, Math.min(1, esc * 4) * (1 - smooth(.85, 1, esc)), 900); P.mat.size = .22; }
    hud.push(() => { const msN = Math.round(30 * clamp(u)); const fa = L(t, 'fill', 'but');
      titleHUD('LA BOLSA SE LLENA EN', 'UNOS 30 MILISEGUNDOS', smooth(TL.fill, TL.fill + .3, t) * (1 - smooth(TL.speed - .1, TL.speed + .1, t)), 300);
      txt(msN + ' ms', W / 2, 1520, 96, { font: 'Montserrat', weight: 800, alpha: fa, fill: copperGrad(300, 780, 1520, clamp(u)) });
      bigStat('LA TELA SALE A MÁS DE', '200 km/h', 330, L(t, 'speed', 'but'), clamp((t - TL.speed) / 1.5));
      titleHUD('PERO LO IMPORTANTE', 'NO ES INFLARSE…', L(t, 'but', 'deflate'), 300); titleHUD('…ES', 'DESINFLARSE', L(t, 'deflate', 'holes'), 300);
      titleHUD('LA BOLSA TIENE', 'AGUJEROS', L(t, 'holes', 'escape'), 300);
      const vp = vents[1].getWorldPosition(V3(0, 0, 0)); callout(vp, -150, -260, 'ORIFICIOS DE SALIDA', null, deflV * (1 - smooth(TL.curious - .3, TL.curious, t)), '#7fd4ff');
      titleHUD('EL GAS ESCAPA', 'Y TE FRENA POCO A POCO', L(t, 'escape'), 300);
      // gráfica de fuerza sobre el cuerpo: sin airbag (pico) vs con airbag (suave)
      const ga = smooth(TL.escape + .8, TL.escape + 1.2, t); if (ga > .01) { const x0 = 160, x1 = 920, y0 = 1560, y1 = 1180; const u2 = clamp((t - TL.escape - .9) / 1.4);
        g2.save(); g2.globalAlpha = ga; g2.fillStyle = 'rgba(2,5,11,.55)'; g2.fillRect(100, 1110, 880, 520); g2.strokeStyle = 'rgba(255,255,255,.45)'; g2.lineWidth = 2; g2.beginPath(); g2.moveTo(x0, y1); g2.lineTo(x0, y0); g2.lineTo(x1, y0); g2.stroke();
        const curve = (fn, col) => { g2.strokeStyle = col; g2.lineWidth = 6; g2.shadowColor = col; g2.shadowBlur = 14; g2.beginPath(); for (let i = 0; i <= 100 * u2; i++) { const v = i / 100; const x = lerp(x0, x1, v), y = y0 - fn(v) * (y0 - y1); i ? g2.lineTo(x, y) : g2.moveTo(x, y); } g2.stroke(); };
        curve(v => .95 * Math.exp(-Math.pow((v - .22) / .035, 2)), '#ff6a4a'); curve(v => .32 * Math.exp(-Math.pow((v - .45) / .2, 2)), '#e3a372'); g2.restore();
        txt('SIN AIRBAG', lerp(x0, x1, .22) + 40, y1 + 40, 26, { align: 'left', spacing: 3, weight: 700, alpha: ga * smooth(.2, .3, u2), fill: '#ff8a6a' }); txt('CON AIRBAG', x1, y0 - 170, 26, { align: 'right', spacing: 3, weight: 700, alpha: ga * smooth(.5, .7, u2), fill: '#e3a372' });
        txt('FUERZA SOBRE EL CUERPO', x0 + 10, 1150, 22, { align: 'left', spacing: 4, alpha: ga * .75 }); } });
    if (t > TL.escape + .8) dim = .25;
  } else if (t < TL.brand) {
    // F · un parpadeo (~150 ms) frente al airbag (30 ms inflado + desinflado)
    show({ car: true }); carX(.85); const lt = t - TL.curious; const cur = clamp((t - TL.close) / (TL.done + .8 - TL.close)) * 150;
    const u = cur / 30; let k = inflK(u); const esc = smooth(30, 150, cur); setBag(k * (1 - esc * .5), esc, smooth(20, 70, cur) * .6, t); pose(smooth(15, 80, cur) * .42 + esc * .08);
    camOrbit(V3(.5, 11, 4), 50, .5, .1, 40); dim = .7; bloomS = .7;
    if (esc > 0 && cur < 150) gasFromVents(t, Math.min(1, esc * 4), 600);
    hud.push(() => { titleHUD('Y LO MÁS CURIOSO:', 'UN PARPADEO DURA ~150 ms', smooth(0, .3, lt) * (1 - smooth(TL.close - TL.curious - .1, TL.close - TL.curious + .1, lt)), 300);
      titleHUD('CUANDO TERMINAS DE', 'CERRAR LOS OJOS…', L(t, 'close', 'done'), 300); titleHUD('EL AIRBAG YA SE HA INFLADO', 'Y ESTÁ DESINFLÁNDOSE', L(t, 'done'), 300);
      // ojo
      const ea = smooth(TL.blink - .2, TL.blink + .2, t); if (ea > .01) { const cx = W / 2, cy = 620, rw = 210, rh = 110; const lid = t < TL.close ? .08 * Math.max(0, Math.sin((t - TL.blink) * 2)) : clamp(cur / 150);
        g2.save(); g2.globalAlpha = ea; g2.beginPath(); g2.moveTo(cx - rw, cy); g2.quadraticCurveTo(cx, cy - rh * 2, cx + rw, cy); g2.quadraticCurveTo(cx, cy + rh * 2, cx - rw, cy); g2.closePath(); g2.fillStyle = '#f2efe8'; g2.fill(); g2.save(); g2.clip();
        g2.fillStyle = '#4a7aa0'; g2.beginPath(); g2.arc(cx, cy, 78, 0, 7); g2.fill(); g2.fillStyle = '#0a0d12'; g2.beginPath(); g2.arc(cx, cy, 34, 0, 7); g2.fill(); g2.fillStyle = '#fff'; g2.beginPath(); g2.arc(cx + 22, cy - 24, 12, 0, 7); g2.fill();
        g2.fillStyle = '#c99a78'; g2.fillRect(cx - rw, cy - rh * 1.1, rw * 2, rh * 2.2 * lid); g2.restore(); g2.strokeStyle = '#2a1a12'; g2.lineWidth = 8; g2.beginPath(); g2.moveTo(cx - rw, cy); g2.quadraticCurveTo(cx, cy - rh * 2, cx + rw, cy); g2.quadraticCurveTo(cx, cy + rh * 2, cx - rw, cy); g2.stroke(); g2.restore(); }
      // línea de tiempo 0–150 ms
      const ta = smooth(TL.blink, TL.blink + .4, t); if (ta > .01) { const x0 = 120, x1 = 960, X = ms => lerp(x0, x1, ms / 150); const yB = 1130, yA = 1270;
        g2.save(); g2.globalAlpha = ta; g2.strokeStyle = 'rgba(255,255,255,.5)'; g2.lineWidth = 2; g2.beginPath(); g2.moveTo(x0, 1360); g2.lineTo(x1, 1360); g2.stroke(); for (let ms = 0; ms <= 150; ms += 30) { g2.beginPath(); g2.moveTo(X(ms), 1352); g2.lineTo(X(ms), 1368); g2.stroke(); } g2.restore();
        for (let ms = 0; ms <= 150; ms += 30) txt(ms + '', X(ms), 1400, 24, { weight: 600, alpha: ta * .8 }); txt('ms', x1 + 10, 1440, 22, { align: 'right', weight: 300, alpha: ta * .7 });
        g2.save(); g2.globalAlpha = ta; g2.fillStyle = 'rgba(255,255,255,.12)'; g2.fillRect(x0, yB - 22, x1 - x0, 44); g2.fillStyle = '#c99a78'; g2.fillRect(x0, yB - 22, X(Math.min(cur, 150)) - x0, 44);
        g2.fillStyle = '#e3a372'; g2.fillRect(x0, yA - 22, X(Math.min(cur, 30)) - x0, 44); g2.fillStyle = '#7fb8ff'; if (cur > 30) g2.fillRect(X(30), yA - 22, X(cur) - X(30), 44); g2.restore();
        txt('PARPADEO', x0, yB - 48, 24, { align: 'left', spacing: 4, weight: 700, alpha: ta }); txt('AIRBAG', x0, yA - 48, 24, { align: 'left', spacing: 4, weight: 700, alpha: ta, fill: '#e3a372' });
        txt('INFLADO', X(15), yA, 20, { weight: 800, alpha: ta * smooth(28, 31, cur), fill: '#1a0e06' }); txt('DESINFLANDO', X(90), yA, 22, { weight: 800, alpha: ta * smooth(60, 80, cur), fill: '#06101c' });
        if (cur > 0) { g2.save(); g2.globalAlpha = ta; g2.strokeStyle = '#fff'; g2.lineWidth = 3; g2.shadowColor = '#fff'; g2.shadowBlur = 10; g2.beginPath(); g2.moveTo(X(cur), yB - 40); g2.lineTo(X(cur), 1360); g2.stroke(); g2.restore(); txt(Math.round(cur) + ' ms', X(cur), yB - 80, 34, { font: 'Montserrat', weight: 800, alpha: ta * (cur < 150 ? 1 : .8) }); } } });
  } else {
    // G · marca
    show({ car: true }); carX(.6); const lt = t - TL.brand; setBag(.6, 1, .3, t); pose(.3); camOrbit(V3(1, 10, 0), 70 + lt * 4, .6 + lt * .05, .15, 38); expo = .9; fade = Math.min(.5, lt * .45); dim = smooth(0, .8, lt) * .6;
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  P.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (dim > 0) hud.unshift(() => { g2.save(); g2.globalAlpha = dim * .7; g2.fillStyle = '#02050b'; g2.fillRect(0, 0, W, H); g2.restore(); });
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
function renderCover() { renderFrame(TL.fill + 1.5); coverText('¿MÁS RÁPIDO QUE', 'UN PARPADEO?', 'El airbag se infla en 30 milisegundos'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
