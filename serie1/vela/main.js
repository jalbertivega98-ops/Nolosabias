// NO LO SABÍAS — "¿Cómo navega un velero contra el viento?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final.
// La vela trabaja como un ala (sustentación: menor presión en la cara de sotavento/extradós). La orza (quilla) resiste el abatimiento;
// la suma de ambas fuerzas hace avanzar en diagonal. Ceñida típica ≈ 40–45° al viento real; se avanza contra el viento en bordadas (virando).
// Los AC75 de la Copa América (hidroalas) superan los 50 nudos (≈ 95–100 km/h) con vientos de ~20 nudos (< 40 km/h).
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3,
  g2, camera, Particles, txt, copperGrad, project, callout, bar, fract, emitJet, arrowXY, bigStat, drawBrand, coverText, finish } from '../../lib/core.js';

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(new THREE.Color(.68, .8, .9), .004);
const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uTop: { value: new THREE.Color(.12, .34, .72) }, uHor: { value: new THREE.Color(.72, .84, .94) }, uSun: { value: V3(.5, .4, .8).normalize() }, uSunC: { value: new THREE.Color(1, .9, .7) } },
  vertexShader: `varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 uTop,uHor,uSunC,uSun; varying vec3 vD; void main(){ vec3 d=normalize(vD); float y=clamp(d.y,0.,1.); vec3 c=mix(uHor,uTop,pow(y,.5)); float s=max(dot(d,uSun),0.); c+=uSunC*(pow(s,40.)*.5+smoothstep(.9992,.9996,s)*2.); gl_FragColor=vec4(c,1.); }` });
const sky = new THREE.Mesh(new THREE.SphereGeometry(2800, 32, 16), skyMat); sky.renderOrder = -1; scene.add(sky);
const hemi = new THREE.HemisphereLight(0xe2f0ff, 0x2a4a5a, 1.8); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1dc, 2.6); sun.position.set(40, 50, 80); scene.add(sun);
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .6, ...o });
const COP = 0xc8743f;

const OS = 220, ON = 200; const oGeo = new THREE.PlaneGeometry(OS, OS, ON, ON); oGeo.rotateX(-Math.PI / 2);
const oBase = Float32Array.from(oGeo.attributes.position.array); const oCol = new Float32Array(oBase.length); oGeo.setAttribute('color', new THREE.BufferAttribute(oCol, 3));
const oMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .25, metalness: .05 });
const ocean = new THREE.Mesh(oGeo, oMat); scene.add(ocean);
let WAVES = [];
function setWaves(list) { WAVES = list.map(w => { const d = V3(Math.cos(w.dir), 0, Math.sin(w.dir)); const k = 2 * Math.PI / w.L; return { ...w, dx: d.x, dz: d.z, k, om: Math.sqrt(9.8 * k) * (w.sp || 1) }; }); }
function gerst(x0, z0, t) { let x = x0, y = 0, z = z0; for (const w of WAVES) { const ph = w.k * (w.dx * x0 + w.dz * z0) - w.om * t + (w.ph || 0); const c = Math.cos(ph); x -= (w.Q ?? .6) * w.A * w.dx * c; z -= (w.Q ?? .6) * w.A * w.dz * c; y += w.A * Math.sin(ph); } return V3(x, y, z); }
function waveH(x, z, t) { let y = 0; for (const w of WAVES) y += w.A * Math.sin(w.k * (w.dx * x + w.dz * z) - w.om * t + (w.ph || 0)); return y; }
function oceanUpdate(t, ox = 0, oz = 0, foam = .65, deep = [.02, .16, .28], shallow = [.1, .5, .6]) {
  const p = oGeo.attributes.position; let maxA = 0; for (const w of WAVES) maxA += w.A;
  for (let i = 0; i < p.count; i++) { const x0 = oBase[i * 3] + ox, z0 = oBase[i * 3 + 2] + oz; let x = x0, y = 0, z = z0;
    for (const w of WAVES) { const ph = w.k * (w.dx * x0 + w.dz * z0) - w.om * t + (w.ph || 0); const c = Math.cos(ph); x -= (w.Q ?? .6) * w.A * w.dx * c; z -= (w.Q ?? .6) * w.A * w.dz * c; y += w.A * Math.sin(ph); }
    p.setXYZ(i, x - ox, y, z - oz); const h = maxA > 0 ? clamp((y / maxA + 1) / 2) : .5; const f = smooth(foam, 1, h);
    oCol[i * 3] = lerp(lerp(deep[0], shallow[0], h), .95, f); oCol[i * 3 + 1] = lerp(lerp(deep[1], shallow[1], h), .97, f); oCol[i * 3 + 2] = lerp(lerp(deep[2], shallow[2], h), 1, f); }
  p.needsUpdate = true; oGeo.attributes.color.needsUpdate = true; oGeo.computeVertexNormals(); ocean.position.set(ox, 0, oz); }

// ==========================================================================
// VELERO (proa hacia -z local). heading: ángulo desde "contra el viento" (-z), positivo hacia +x
// ==========================================================================
function sailGeo(luffBot, luffTop, clew, camber, NU = 14, NV = 10) { const pos = [], idx = [];
  for (let j = 0; j <= NV; j++) { const v = j / NV; const L = luffBot.clone().lerp(luffTop, v); const C = clew.clone().lerp(luffTop, v);
    for (let i = 0; i <= NU; i++) { const u = i / NU; const p = L.clone().lerp(C, u); p.x += camber * Math.sin(Math.PI * u) * (1 - v * .8); pos.push(p.x, p.y, p.z); } }
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; }
function makeBoat(dark = false) { const g = new THREE.Group(); const heel = new THREE.Group(); g.add(heel);
  const hullM = M(dark ? 0x1a1d22 : 0xf3f1ea, { roughness: .35 }); const hull = new THREE.Mesh(new THREE.CapsuleGeometry(1.25, 7.5, 8, 24), hullM); hull.rotation.x = Math.PI / 2; hull.scale.set(1, 1, .55); hull.position.y = .15; heel.add(hull);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.1, .12, 7.6), M(dark ? 0x2a2d33 : 0xc9a578, { roughness: .7 })); deck.position.y = .82; heel.add(deck);
  const stripe = new THREE.Mesh(new THREE.CapsuleGeometry(1.27, 7.5, 8, 24, ), M(dark ? 0xc8743f : 0x1d4e8a)); stripe.rotation.x = Math.PI / 2; stripe.scale.set(1, 1, .08); stripe.position.y = .5; heel.add(stripe);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, 15, 8), M(0xcfd4da, { metalness: .6, roughness: .3 })); mast.position.set(0, 8.3, -1.2); heel.add(mast);
  const boomPivot = new THREE.Group(); boomPivot.position.set(0, 1.9, -1.2); heel.add(boomPivot);
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, 4.8, 8), M(0xcfd4da, { metalness: .6, roughness: .3 })); boom.rotation.x = Math.PI / 2; boom.position.z = 2.4; boomPivot.add(boom);
  const sailM = new THREE.MeshStandardMaterial({ color: dark ? 0x22252b : 0xfbfaf6, roughness: .6, side: THREE.DoubleSide, emissive: dark ? 0x000000 : 0x202020 });
  const main = new THREE.Mesh(sailGeo(V3(0, .1, 0), V3(0, 13.6, 0), V3(0, .1, 4.7), .6), sailM); boomPivot.add(main);
  const jibPivot = new THREE.Group(); jibPivot.position.set(0, 1.1, -4.6); heel.add(jibPivot);
  const jib = new THREE.Mesh(sailGeo(V3(0, 0, 0), V3(0, 11.5, 3.3), V3(0, .2, 3.6), .5), sailM); jibPivot.add(jib);
  const keelM = M(0x30343a, { roughness: .5 }); const keel = new THREE.Group(); heel.add(keel);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(.18, 2.4, 1.3), keelM); fin.position.set(0, -1.4, -.2); fin.rotation.x = -.15; keel.add(fin);
  const bulb = new THREE.Mesh(new THREE.CapsuleGeometry(.32, 1.6, 6, 12), keelM); bulb.rotation.x = Math.PI / 2; bulb.position.set(0, -2.65, 0); keel.add(bulb);
  const rud = new THREE.Mesh(new THREE.BoxGeometry(.12, 1.5, .55), keelM); rud.position.set(0, -.8, 3.7); heel.add(rud);
  g.userData = { heel, boomPivot, jibPivot, keel, keelM, sailM, hullM }; scene.add(g); return g; }
function poseBoat(B, heading, sheet = .3, heelA = .2) { B.rotation.set(0, -heading, 0); const u = B.userData; u.heel.rotation.z = heelA; u.boomPivot.rotation.y = -sheet; u.jibPivot.rotation.y = -sheet * .8; }
const boat = makeBoat(); const boat2 = makeBoat();
// barco de hidroalas (Copa América)
const foiler = new THREE.Group(); scene.add(foiler);
{ const k = M(0x16181c, { roughness: .3, metalness: .2 }); const hull = new THREE.Mesh(new THREE.CapsuleGeometry(1.4, 15, 8, 24), k); hull.rotation.x = Math.PI / 2; hull.scale.set(1.15, 1, .45); foiler.add(hull);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.9, .12, 12), M(0xc8743f, { emissive: 0x3a1404 })); stripe.position.y = .5; foiler.add(stripe);
  const wingS = new THREE.Mesh(sailGeo(V3(0, .6, -3), V3(0, 25, -1.5), V3(0, .6, 5), .9), new THREE.MeshStandardMaterial({ color: 0x23262c, roughness: .5, side: THREE.DoubleSide })); foiler.add(wingS); foiler.userData.sail = wingS;
  const jibS = new THREE.Mesh(sailGeo(V3(0, .6, -8.5), V3(0, 19, -3.4), V3(0, .8, -3.6), .5), new THREE.MeshStandardMaterial({ color: 0x2c3036, roughness: .5, side: THREE.DoubleSide })); foiler.add(jibS);
  for (const s of [-1, 1]) { const arm = new THREE.Mesh(new THREE.BoxGeometry(.25, 4.6, .9), k); arm.position.set(s * 2.4, -2.3, -.5); arm.rotation.z = s * .25; foiler.add(arm);
    const wfoil = new THREE.Mesh(new THREE.BoxGeometry(3.2, .12, .8), M(0xc8743f, { emissive: 0x2a0e02 })); wfoil.position.set(s * 2.9, -4.6, -.5); foiler.add(wfoil); }
  const rud = new THREE.Mesh(new THREE.BoxGeometry(.2, 4.4, .5), k); rud.position.set(0, -2.2, 7.6); foiler.add(rud); const rf = new THREE.Mesh(new THREE.BoxGeometry(2.4, .1, .5), k); rf.position.set(0, -4.3, 7.6); foiler.add(rf); }
// perfil alar (sección de la vela vista desde arriba)
const FOIL = V3(0, 600, 0); const foil = new THREE.Group(); foil.position.copy(FOIL); scene.add(foil);
const foilY = (x, up) => { const t = .06, c = .1; const yt = 5 * t * (.2969 * Math.sqrt(x) - .126 * x - .3516 * x * x + .2843 * x ** 3 - .1015 * x ** 4); const yc = c * (x < .4 ? (2 * .4 * x - x * x) / .16 : ((1 - .8) + 2 * .4 * x - x * x) / .36); return yc + (up ? yt : -yt); };
{ const s = new THREE.Shape(); const N = 60; for (let i = 0; i <= N; i++) { const x = 1 - i / N; const p = [x * 8 - 4, foilY(x, true) * 8]; i ? s.lineTo(...p) : s.moveTo(...p); } for (let i = 1; i <= N; i++) { const x = i / N; s.lineTo(x * 8 - 4, foilY(x, false) * 8); }
  const g = new THREE.ExtrudeGeometry(s, { depth: 1.2, bevelEnabled: false, curveSegments: 1 }); g.translate(0, 0, -.6); foil.add(new THREE.Mesh(g, M(0xf2efe6, { roughness: .5, emissive: 0x303030 }))); }
const buoy = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.4, 16), M(0xff7a2a, { emissive: 0x401000 })); scene.add(buoy);
const PS = new Particles(30000, { size: .1, seed: 5 }); scene.add(PS.obj);
const ALL = [ocean, boat, boat2, foiler, foil, buoy];
const FOAM = [1, 1, 1.05];

// ==========================================================================
// HUD
// ==========================================================================
function stamp(s, x, y, a, rot = -.08, col = '#ff6a4a', size = 86) { if (a <= .01) return; const sc = lerp(1.6, 1, easeOut(clamp(a * 1.4)));
  g2.save(); g2.translate(x, y); g2.rotate(rot); g2.scale(sc, sc); g2.globalAlpha = clamp(a); g2.strokeStyle = col; g2.lineWidth = 8; g2.shadowColor = col; g2.shadowBlur = 25;
  g2.font = `800 ${size}px Montserrat`; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.letterSpacing = '6px'; const w = g2.measureText(s).width + 70; g2.strokeRect(-w / 2, -size * .8, w, size * 1.6); g2.fillStyle = col; g2.fillText(s, 0, 4); g2.restore(); }
function two(top, l1, l2, a, y = 300) { if (a <= .01) return; txt(l1, W / 2, y, 50, { font: 'Montserrat', weight: 800, alpha: a }); if (l2) txt(l2, W / 2, y + 62, 50, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(160, 920, y + 62, .5) }); if (top) txt(top, W / 2, y - 62, 24, { spacing: 7, alpha: a * .8, fill: '#e3a372' }); }
const win = (t, a, b, f = .3) => smooth(a, a + f, t) * (1 - smooth(b - f, b, t));
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
function label(w, s, sub, a, col = '#ffe2c0', size = 40) { if (a <= .01) return; const p = project(w); txt(s, p.x, p.y, size, { font: 'Montserrat', weight: 800, alpha: a, fill: col }); if (sub) txt(sub, p.x, p.y + size * .9, 26, { alpha: a * .85 }); }

function poseB(B, heading, sheet = .2, heelA = .2) { const s = Math.sign(heading) || 1; B.rotation.set(0, -heading, 0); const u = B.userData; u.heel.rotation.z = -s * heelA; u.boomPivot.rotation.y = s * sheet; u.jibPivot.rotation.y = s * sheet * .7; }
const HD = th => V3(Math.sin(th), 0, -Math.cos(th));
function windZ(C, n, t, a, sx = 60, sy = 10, sz = 80, speed = 25, y0 = 1, len = .5) { const s = PS.seed; for (let i = 0; i < n; i++) { const q = i * 4; const u = fract(s[q] + t * speed / sz); const x = C.x + (s[q + 1] - .5) * sx, y = C.y + y0 + s[q + 2] * sy, z = C.z + (u - .5) * sz; const f = a * smooth(0, .1, u) * (1 - smooth(.9, 1, u)) * .7;
  for (let k = 0; k < 4; k++) PS.push(x, y, z - k * len, f * (1 - k * .2), f * (1 - k * .2), f * (1 - k * .2) * 1.05); } }
function topView(h, cx = 0, cz = 0) { camera.up.set(0, 0, -1); camera.position.set(cx, h, cz); camera.lookAt(cx, 0, cz); camera.fov = 40; }
function windArrows(a, y0 = 520, y1 = 760) { if (a <= .01) return; for (const x of [W * .2, W * .5, W * .8]) arrowXY(x, y0, x, y1, a * .9, '#7fd4ff', 10); txt('VIENTO', W * .5 + 70, y0 + 40, 30, { font: 'Montserrat', weight: 800, alpha: a, fill: '#7fd4ff', align: 'left' }); }
function arrowW(p0, p1, a, col, w = 12) { const A = project(p0), B = project(p1); arrowXY(A.x, A.y, B.x, B.y, a, col, w); }
let trav = V3();
function sail(B, tt, th, spd = 5, sheet = .2, heelA = .22, waves = .3) { ocean.visible = true; B.visible = true; setWaves([{ dir: 1.4, A: waves, L: 14, Q: .5 }, { dir: 2.0, A: waves * .5, L: 6 }, { dir: .9, A: waves * .3, L: 3.5 }]);
  const P = HD(th).multiplyScalar(tt * spd); oceanUpdate(tt, P.x, P.z, .97, [.02, .16, .3], [.1, .45, .6]); const g = waveH(P.x, P.z, tt); B.position.set(P.x, g * .6, P.z); poseB(B, th, sheet, heelA + Math.sin(tt * 1.3) * .03);
  const bow = P.clone().add(HD(th).multiplyScalar(5)); emitJet(PS, bow, V3(0, .6, 0).add(HD(th + Math.PI / 2).multiplyScalar(.5)), 500, tt, 2, 1.2, .6, FOAM, 6); emitJet(PS, bow.clone().setY(0), HD(th + Math.PI / 2 + .5).multiplyScalar(-1), 400, tt, 1.6, 1, .8, FOAM, 0, 900);
  for (let i = 0; i < 1400; i++) { const s = PS.seed, q = ((i + 3000) % PS.n) * 4; const d = s[q] * 30; const w = P.clone().sub(HD(th).multiplyScalar(4.5 + d)); const sp = (s[q + 1] - .5) * (1 + d * .12); const f = (1 - d / 30) * .8; PS.push(w.x + Math.cos(th) * sp, .1, w.z + Math.sin(th) * sp, f, f, f * 1.03); }
  PS.mat.size = .12; return P.clone(); }

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .05; camera.far = 6000; camera.fov = 42;
  let bloomS = .35, flash = 0, ca = .0012, fade = 0, expo = 1.12;
  PS.begin(); PS.mat.size = .1; for (const o of ALL) o.visible = false; scene.fog.density = .004; scene.fog.color.setRGB(.68, .8, .9); hemi.intensity = 1.8; sun.intensity = 2.6; sun.color.setRGB(1, .95, .86); sky.visible = true;
  skyMat.uniforms.uTop.value.setRGB(.12, .34, .72); skyMat.uniforms.uHor.value.setRGB(.72, .84, .94); skyMat.uniforms.uSunC.value.setRGB(1, .9, .7); skyMat.uniforms.uSun.value.set(.5, .4, .8).normalize(); scene.background = null;
  ocean.scale.setScalar(1); if (oMat.transparent) { oMat.transparent = false; oMat.needsUpdate = true; } oMat.opacity = 1; oMat.depthWrite = true; oMat.side = THREE.FrontSide; boat.scale.setScalar(1); boat.userData.keelM.emissive.setRGB(0, 0, 0); boat.userData.sailM.emissive.setRGB(.12, .12, .12);
  for (const c of ['imp', 'sheet', 'wing', 'fast', 'side', 'keel', 'diag', 'zig', 'deg', 'crazy', 'foil', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = []; let shadeBot = 0;

  if (t < TL.imp) {
    // A · velero ciñendo
    const th = .7, P = sail(boat, t + 3, th, 5);
    camera.position.copy(P).add(V3(26, 4, -15)); camera.fov = 48; camera.lookAt(P.clone().add(V3(0, 6, 0))); windZ(P, 1200, t, .8, 50, 16, 70, 22, 0, .6);
    hud.push(() => two(null, '¿CÓMO PUEDE UN VELERO', 'AVANZAR CONTRA EL VIENTO?', smooth(.05, .3, t), 300));
  } else if (t < TL.sheet) {
    // B · vista cenital: viento de cara
    const lt = t - TL.imp, th = .7, P = sail(boat, t + 3, th, 5); topView(lerp(62, 70, lt / 3), P.x, P.z + 6); windZ(P, 2500, t, 1, 60, 3, 140, 30, 14, 1.2); PS.mat.size = .25;
    hud.push(() => { two(null, 'PARECE IMPOSIBLE…', 'PERO LO HACE CADA DÍA', smooth(.05, .3, lt), 300); windArrows(smooth(.3, .7, lt));
      const b = project(P); arrowXY(b.x, b.y, b.x + 260 * Math.sin(th), b.y - 260 * Math.cos(th), smooth(1, 1.6, lt), '#7fe08a', 12); });
  } else if (t < TL.wing) {
    // C · la vela NO es una sábana
    const lt = t - TL.sheet; foil.visible = false; sky.visible = false; scene.background = new THREE.Color(.05, .07, .11); scene.fog.density = 0;
    boat2.visible = true; boat2.position.copy(FOIL).add(V3(0, -8, 0)); poseB(boat2, .1, 0, 0); boat2.rotation.y = .955; boat2.userData.heel.rotation.z = 0; boat2.userData.boomPivot.rotation.y = 0; boat2.userData.jibPivot.rotation.y = 0;
    camera.position.copy(FOIL).add(V3(-21, 0, 30)); camera.lookAt(FOIL.clone().add(V3(0, -2, 0))); camera.fov = 45;
    windZ(FOIL.clone().add(V3(0, -8, 0)), 2500, t, .9, 30, 14, 60, 18, 0, .7);
    hud.push(() => { two(null, 'EL TRUCO: LA VELA NO ES', 'UNA SÁBANA QUE EL VIENTO EMPUJA', smooth(.05, .3, lt), 300); stamp('NO', W / 2, 1560, smooth(1.6, 1.9, lt), -.08, '#ff6a4a', 90); });
  } else if (t < TL.fast) {
    // D · es un ala: vista desde lo alto del mástil
    const lt = t - TL.wing, th = .7, P = sail(boat, t + 3, th, 5); boat.userData.sailM.emissive.setRGB(.5 * win(t, TL.wing, TL.fast), .2 * win(t, TL.wing, TL.fast), .05);
    camera.up.set(...HD(th).toArray()); camera.position.copy(P).add(V3(0, 34, 0)); camera.lookAt(P.clone().add(V3(0, 0, .01))); camera.fov = 40;
    hud.push(() => { txt('ES UN', W / 2, 1380, 60, { font: 'Montserrat', weight: 800, alpha: smooth(0, .2, lt) }); txt('ALA', W / 2, 1530, 170, { font: 'Montserrat', weight: 800, alpha: smooth(.05, .25, lt), fill: copperGrad(300, 780, 1530, .5) }); });
  } else if (t < TL.side) {
    // E/F · perfil: el aire de fuera va más rápido → succión
    const lt = t - TL.fast; foil.visible = true; sky.visible = false; scene.background = new THREE.Color(.04, .06, .1); scene.fog.density = 0; bloomS = .6;
    const toPlane = smooth(TL.suck + 2.0, TL.suck + 2.8, t); foil.rotation.set(0, 0, lerp(Math.PI / 2, 0, toPlane));
    const R = foil.rotation.z, W2 = (lx, ly) => V3(FOIL.x + lx * Math.cos(R) - ly * Math.sin(R), FOIL.y + lx * Math.sin(R) + ly * Math.cos(R), 0);
    const s = PS.seed; let n = 0;
    for (let L = -9; L <= 9; L++) { if (L === 0) continue; const y0 = L * .32; const fastL = y0 > 0 ? 1 + .9 * Math.exp(-y0 / 1.4) : 1 - .3 * Math.exp(y0 / 1.4);
      for (let i = 0; i < 22; i++) { const q = ((n++) % PS.n) * 4; const u = fract(s[q] + t * .16 * fastL); const x = -9 + u * 18; const xn = clamp((x + 4) / 8); const y = y0 + (y0 > 0 ? foilY(xn, true) * 8 * Math.exp(-y0 / 1.6) : foilY(xn, false) * 8 * Math.exp(y0 / 1.6));
        const f = smooth(0, .08, u) * (1 - smooth(.92, 1, u)); const c = y0 > 0 ? [.5, .85, 1.3] : [1.1, .6, .3];
        for (let k = 0; k < 6; k++) { const xx = x - k * .12 * fastL; const xk = clamp((xx + 4) / 8); const yy = y0 + (y0 > 0 ? foilY(xk, true) * 8 * Math.exp(-y0 / 1.6) : foilY(xk, false) * 8 * Math.exp(y0 / 1.6)); const w = W2(xx, yy); const ff = f * (1 - k * .14); PS.push(w.x, w.y, w.z, c[0] * ff, c[1] * ff, c[2] * ff); } } }
    PS.mat.size = .3; camera.position.copy(FOIL).add(V3(0, 0, 17)); camera.lookAt(FOIL); camera.fov = 40;
    hud.push(() => { two(null, 'EL AIRE DE LA CARA DE FUERA', 'VA MÁS RÁPIDO', win(t, TL.fast, TL.fast + 2.2), 300); two(null, 'LA PRESIÓN BAJA…', null, win(t, TL.fast + 2.2, TL.suck), 300);
      two(null, 'Y LA VELA ES ASPIRADA', 'HACIA DELANTE', win(t, TL.suck, TL.suck + 2.1), 300); two(null, 'COMO EL ALA DE UN AVIÓN', 'HACIA ARRIBA', smooth(TL.suck + 2.1, TL.suck + 2.4, t), 300);
      const pa = smooth(TL.fast + 2.0, TL.fast + 2.5, t) * (1 - toPlane); const up = project(W2(2.6, 2.6)), dn = project(W2(2.6, -2.2));
      txt('−', up.x, up.y, 110, { font: 'Montserrat', weight: 800, alpha: pa, fill: '#7fd4ff' }); txt('PRESIÓN BAJA', up.x, up.y + 70, 28, { font: 'Montserrat', weight: 800, alpha: pa, fill: '#7fd4ff' });
      txt('+', dn.x, dn.y, 110, { font: 'Montserrat', weight: 800, alpha: pa, fill: '#ffb070' }); txt('PRESIÓN ALTA', dn.x, dn.y + 70, 28, { font: 'Montserrat', weight: 800, alpha: pa, fill: '#ffb070' });
      const c0 = project(W2(0, .4)), c1 = project(W2(0, 4.2)); arrowXY(c0.x, c0.y, c1.x, c1.y, smooth(TL.suck + .2, TL.suck + .8, t), '#ff9a50', 16);
      txt('VIENTO', W / 2, 1720, 30, { font: 'Montserrat', weight: 800, alpha: smooth(.2, .6, lt) * (1 - toPlane), fill: '#7fd4ff' }); });
  } else if (t < TL.keel) {
    // G · fuerza de lado
    const lt = t - TL.side, th = .78, P = sail(boat, t + 3, th, 2); topView(64, P.x + 3, P.z - 1); windZ(P, 1800, t, .8, 60, 3, 140, 30, 14, 1.2); PS.mat.size = .25;
    const C = P.clone().setY(2), F = C.clone().add(V3(9, 0, 0)), Fw = C.clone().add(HD(th).multiplyScalar(9 * Math.sin(th)));
    hud.push(() => { two(null, 'ESA FUERZA TAMBIÉN', 'TIRA DE LADO', win(t, TL.side, TL.side + 2.2), 300); two(null, 'Y AQUÍ ENTRA', 'LA PIEZA ESCONDIDA', smooth(TL.side + 2.2, TL.side + 2.5, t), 300); windArrows(smooth(.1, .5, lt) * .7, 560, 720);
      arrowW(C, F, smooth(.3, .8, lt), '#ff9a50', 13); arrowW(C, Fw, smooth(1.0, 1.5, lt), '#7fe08a', 11); arrowW(Fw, F, smooth(1.4, 1.9, lt), '#ff5a4a', 11);
      label(Fw.clone().add(HD(th).multiplyScalar(3)), 'AVANCE', null, smooth(1.2, 1.6, lt), '#7fe08a', 34); label(F.clone().add(V3(0, 0, 4)), 'DE LADO', null, smooth(1.6, 2, lt), '#ff7a6a', 34); });
  } else if (t < TL.diag) {
    // H · la orza, vista de frente medio bajo el agua
    const lt = t - TL.keel, P = sail(boat, t + 3, 0, 0, .25, .22, .12); oMat.transparent = true; oMat.needsUpdate = true; oMat.opacity = .35; oMat.depthWrite = false; scene.fog.density = .001;
    const k = win(t, TL.keel, TL.diag) * (.6 + .4 * Math.sin(lt * 6)); boat.userData.keelM.emissive.setRGB(.9 * k, .4 * k, .1 * k); bloomS = .6;
    camera.position.copy(P).add(V3(lerp(20, 17, lt / 4), 4, -24)); camera.lookAt(P.clone().add(V3(0, 2.5, 0))); camera.fov = 48;
    hud.push(() => { two(null, 'LA ORZA: UNA ALETA BAJO EL CASCO', 'QUE NO DEJA QUE EL BARCO DERRAPE', smooth(.05, .3, lt), 300);
      callout(P.clone().add(V3(0, -2.6, 0)), -230, 170, 'ORZA', 'aleta bajo el casco', smooth(.4, .8, lt), '#ffb070');
      arrowW(P.clone().add(V3(-1, 5, 0)), P.clone().add(V3(-7, 5, 0)), smooth(1.2, 1.7, lt), '#ff5a4a', 12); arrowW(P.clone().add(V3(-.5, -2, 0)), P.clone().add(V3(5, -2, 0)), smooth(1.8, 2.3, lt), '#7fe08a', 12);
      label(P.clone().add(V3(-5, 6.5, 0)), 'VIENTO: DE LADO', null, smooth(1.2, 1.7, lt), '#ffffff', 30); label(P.clone().add(V3(4, -3.6, 0)), 'AGUA: FRENA', null, smooth(1.8, 2.3, lt), '#7fe08a', 30); });
  } else if (t < TL.zig) {
    // I · resultado: sale en diagonal
    const lt = t - TL.diag, th = .78, P = sail(boat, t + 3, th, 6); topView(70, P.x, P.z + 4); windZ(P, 1800, t, .7, 60, 3, 140, 30, 14, 1.2); PS.mat.size = .25;
    const C = P.clone().setY(2);
    hud.push(() => { two(null, 'ENTRE LAS DOS, EL BARCO', 'SALE DISPARADO EN DIAGONAL', smooth(.05, .3, lt), 300); windArrows(.6, 560, 700); arrowW(C, C.clone().add(HD(th).multiplyScalar(11)), smooth(.4, 1.1, lt), '#ffb070', 16); });
  } else if (t < TL.deg) {
    // J · zigzag hasta la boya
    const lt = t - TL.zig; ocean.visible = true; setWaves([{ dir: 1.4, A: .15, L: 9 }]); ocean.scale.setScalar(3); oceanUpdate(t, 0, 0, .995, [.02, .16, .3], [.1, .45, .6]); scene.fog.density = .0004; boat.visible = true; boat.scale.setScalar(2.6); buoy.visible = true; buoy.position.set(0, 1.5, -104); buoy.scale.setScalar(3);
    const pts = [V3(0, 0, 120)]; for (let i = 1; i <= 5; i++) { const z = 120 - i * 46; pts.push(V3(i % 2 ? 44 : -10, 0, z)); } pts[5].set(0, 0, -100);
    const segL = []; let tot = 0; for (let i = 0; i < 5; i++) { const l = pts[i].distanceTo(pts[i + 1]); segL.push(l); tot += l; }
    const u = smooth(.3, 3.8, lt) * tot; let acc = 0, P = pts[0].clone(), th = .7; for (let i = 0; i < 5; i++) { if (u <= acc + segL[i] || i === 4) { const f = clamp((u - acc) / segL[i]); P = pts[i].clone().lerp(pts[i + 1], f); const d = pts[i + 1].clone().sub(pts[i]); th = Math.atan2(d.x, -d.z); break; } acc += segL[i]; }
    boat.position.copy(P); poseB(boat, th, .2, .2); topView(330, 17, -4); windZ(V3(0, 0, 0), 2500, t, .7, 200, 3, 400, 70, 20, 3); PS.mat.size = .7;
    hud.push(() => { two(null, 'NUNCA VA RECTO CONTRA EL VIENTO:', 'VA EN ZIGZAG', win(t, TL.zig, TL.zig + 2.0), 300); two(null, 'CAMBIANDO', 'DE BORDO', smooth(TL.zig + 2.0, TL.zig + 2.3, t), 300); windArrows(.6, 540, 680);
      g2.save(); g2.strokeStyle = '#ffb070'; g2.lineWidth = 7; g2.setLineDash([18, 14]); g2.shadowColor = '#ffb070'; g2.shadowBlur = 12; g2.globalAlpha = .9; g2.beginPath(); let a2 = 0; const p0 = project(pts[0]); g2.moveTo(p0.x, p0.y);
      for (let i = 0; i < 5; i++) { if (u <= a2) break; const f = clamp((u - a2) / segL[i]); const q = project(pts[i].clone().lerp(pts[i + 1], f)); g2.lineTo(q.x, q.y); a2 += segL[i]; } g2.stroke(); g2.restore();
      label(V3(0, 0, -128), 'META', null, smooth(.2, .6, lt), '#ffb070', 36); });
  } else if (t < TL.crazy) {
    // K · 45 grados: zona muerta
    const lt = t - TL.deg, th = .78, P = sail(boat, t + 3, th, 4); topView(64, P.x, P.z - 4); windZ(P, 1500, t, .6, 60, 3, 140, 30, 14, 1.2); PS.mat.size = .25;
    hud.push(() => { two(null, 'SE LLAMA CEÑIR', 'A UNOS 45° DEL VIENTO', smooth(.05, .3, lt), 300); const b = project(P); const R = 560, a = smooth(.4, .9, lt);
      g2.save(); g2.globalAlpha = a * .35; g2.fillStyle = '#ff5a4a'; g2.beginPath(); g2.moveTo(b.x, b.y); g2.arc(b.x, b.y, R, -Math.PI / 2 - Math.PI / 4, -Math.PI / 2 + Math.PI / 4); g2.closePath(); g2.fill(); g2.restore();
      txt('ZONA MUERTA', b.x, b.y - 380, 38, { font: 'Montserrat', weight: 800, alpha: a, fill: '#ffb0a0' }); txt('aquí las velas solo flamean', b.x, b.y - 330, 26, { alpha: a });
      arrowXY(b.x, b.y, b.x + 420 * Math.sin(th), b.y - 420 * Math.cos(th), smooth(1.0, 1.5, lt), '#7fe08a', 12); arrowXY(b.x, b.y, b.x, b.y - 300, smooth(.6, 1, lt) * .7, '#7fd4ff', 8);
      g2.save(); g2.globalAlpha = smooth(1.4, 1.8, lt); g2.strokeStyle = '#ffd08a'; g2.lineWidth = 6; g2.beginPath(); g2.arc(b.x, b.y, 200, -Math.PI / 2, -Math.PI / 2 + th); g2.stroke(); g2.restore();
      txt('45°', b.x + 130, b.y - 230, 60, { font: 'Montserrat', weight: 800, alpha: smooth(1.4, 1.8, lt), fill: copperGrad(b.x + 60, b.x + 200, b.y - 230, .5) }); });
  } else if (t < TL.brand) {
    // L/M/N · barcos con hidroalas: más rápidos que el viento
    const lt = t - TL.crazy; ocean.visible = true; foiler.visible = true; setWaves([{ dir: 1.4, A: .35, L: 14, Q: .5 }, { dir: 2.0, A: .18, L: 6 }]);
    const th = .5, spd = 26, P = HD(th).multiplyScalar(t * spd); oceanUpdate(t, P.x, P.z, .97, [.02, .16, .3], [.1, .45, .6]); const lift = smooth(TL.crazy + .3, TL.crazy + 2.6, t);
    foiler.position.set(P.x, lerp(.3, 3.4, lift) + Math.sin(t * 2) * .08, P.z); foiler.rotation.set(lerp(0, .03, lift), -th, lerp(.05, -.12, lift));
    for (const s of [-1, 1]) { const fp = foiler.localToWorld(V3(s * 2.9, -4.6, -.5)); fp.y = 0; const side = HD(th + Math.PI / 2).multiplyScalar(s); emitJet(PS, fp, V3(side.x * .6, 1.4, side.z * .6).sub(HD(th).multiplyScalar(.8)), 1500, t, lerp(2, 7, lift), 2.5, .5, FOAM, 9, s > 0 ? 0 : 2000); }
    for (let i = 0; i < 1600; i++) { const s = PS.seed, q = ((i + 6000) % PS.n) * 4; const d = s[q] * 45; const w = P.clone().sub(HD(th).multiplyScalar(d - 4)); const sp = (s[q + 1] - .5) * 2.4; const f = (1 - d / 45) * .9 * lift; PS.push(w.x + Math.cos(th) * sp, .12, w.z + Math.sin(th) * sp, f, f, f); }
    PS.mat.size = .14; windZ(P, 900, t, .5, 60, 20, 90, 18, 0, .8);
    const camK = smooth(TL.foil - .5, TL.foil + .5, t); const off = V3(lerp(-46, -34, camK), lerp(4, 2.5, camK), lerp(14, 30, camK)).applyAxisAngle(V3(0, 1, 0), -th);
    camera.position.copy(P).add(off); camera.lookAt(P.clone().add(V3(0, lerp(8, 7, camK), 0)).add(HD(th).multiplyScalar(4))); camera.fov = 46; shadeBot = smooth(TL.foil, TL.foil + .3, t);
    hud.push(() => { two(null, 'Y LO MÁS LOCO: ALGUNOS BARCOS', 'VAN MÁS RÁPIDO QUE EL VIENTO', win(t, TL.crazy, TL.foil), 300); two('COPA AMÉRICA', 'BARCOS CON HIDROALAS', 'QUE VUELAN SOBRE EL AGUA', win(t, TL.foil, TL.wind), 300);
      bigStat('VELOCIDAD', '≈ 100 km/h', 1600, win(t, TL.foil + .8, TL.wind), .5);
      const a = smooth(TL.wind, TL.wind + .3, t); if (a > .01) { const x0 = 140, x1 = 940, w = x1 - x0;
        txt('VIENTO', x0, 1420, 30, { font: 'Montserrat', weight: 800, alpha: a, align: 'left', fill: '#7fd4ff' }); txt('< 40 km/h', x1, 1420, 40, { font: 'Montserrat', weight: 800, alpha: a, align: 'right', fill: '#7fd4ff' });
        g2.save(); g2.globalAlpha = a * .25; g2.fillStyle = '#fff'; g2.fillRect(x0, 1450, w, 36); g2.fillRect(x0, 1610, w, 36); g2.globalAlpha = a; g2.fillStyle = '#7fd4ff'; g2.fillRect(x0, 1450, w * .38 * smooth(TL.wind, TL.wind + .6, t), 36);
        g2.fillStyle = '#ff9a50'; g2.fillRect(x0, 1610, w * smooth(TL.wind + .4, TL.wind + 1.2, t), 36); g2.restore();
        txt('BARCO', x0, 1580, 30, { font: 'Montserrat', weight: 800, alpha: a, align: 'left', fill: '#ffb070' }); txt('≈ 100 km/h', x1, 1580, 40, { font: 'Montserrat', weight: 800, alpha: a, align: 'right', fill: '#ffb070' }); shadeBot = 1; } });
    shadeBot = Math.max(shadeBot, smooth(TL.wind, TL.wind + .3, t));
  } else {
    // O · marca: velero al atardecer
    const lt = t - TL.brand; const P = sail(boat, t + 3, .7, 4, .25, .2, .2); skyMat.uniforms.uTop.value.setRGB(.06, .06, .16); skyMat.uniforms.uHor.value.setRGB(.95, .45, .2); skyMat.uniforms.uSun.value.set(-.3, .06, -1).normalize(); skyMat.uniforms.uSunC.value.setRGB(1.4, .6, .3);
    scene.fog.color.setRGB(.6, .32, .2); sun.color.setRGB(1, .55, .3); sun.position.set(-30, 8, -100); sun.intensity = 1.6; hemi.intensity = .7; camera.position.copy(P).add(V3(14, 2.5, 26)); camera.lookAt(P.clone().add(V3(-4, 6, -10))); fade = Math.min(.4, lt * .4);
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  if (t >= TL.brand) {} else sun.position.set(40, 50, 80);
  sky.position.copy(camera.position); PS.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (t < TL.brand) { const gr = g2.createLinearGradient(0, 0, 0, 600); gr.addColorStop(0, 'rgba(8,10,16,.75)'); gr.addColorStop(.6, 'rgba(8,10,16,.5)'); gr.addColorStop(1, 'rgba(8,10,16,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, W, 600); }
  if (shadeBot > .01) { const gb = g2.createLinearGradient(0, H - 700, 0, H); gb.addColorStop(0, 'rgba(8,10,16,0)'); gb.addColorStop(1, `rgba(8,10,16,${.7 * shadeBot})`); g2.fillStyle = gb; g2.fillRect(0, H - 700, W, 700); }
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, bloom: bloomS, expo });
}
function renderCover() { renderFrame(1.0); coverText('¿CÓMO VA UN VELERO', 'CONTRA EL VIENTO?', 'la vela no empuja: aspira'); }
window.renderCover = () => { renderCover(); return true; };
window.OBJ = { PS, scene };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
