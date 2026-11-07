// NO LO SABÍAS — "¿Cómo enfría el aire acondicionado?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final. Esquema, no a escala (1 unidad ≈ 2 cm).
// Ciclo de compresión de vapor: evaporador (interior) → línea de gas → compresor → condensador (exterior) → válvula de expansión → evaporador.
// R-32 / R-410A hierven a ≈ −50 °C a 1 atm. Willis Carrier, 1902: control de humedad para la imprenta Sackett-Wilhelms (Brooklyn).
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3, g2, camera, Particles, txt, copperGrad, project, callout, titleHUD, fract, camOrbit, bigStat, drawBrand, coverText, finish, noise1, arrowXY, bar, renderer } from '../../lib/core.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const scene = new THREE.Scene(); scene.background = new THREE.Color(0x070a12);
{ const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .45; }
const hemi = new THREE.HemisphereLight(0xd0dcff, 0x302830, 1.2); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0e0, 1.7); sun.position.set(40, 80, 90); scene.add(sun);
renderer.localClippingEnabled = true;
const CUT = new THREE.Plane(V3(0, 0, -1), 100); const clip = [CUT];
const M = (c, r = .6, m = 0, e = 0, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r, metalness: m, emissive: e }, extra));
const R = rng(41);
const canvasTex = (w, h, draw, rep) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; };
const dummy = new THREE.Object3D();
const COLD = [.35, .9, 2.4], ICY = [1.2, 1.7, 2.6], CYAN = [.5, 1.6, 1.9], HOT = [2.6, .7, .2], WARM = [2.2, 1.1, .3];
const mix = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

// ==========================================================================
// CASA: suelo interior, pared con corte, exterior
// ==========================================================================
const house = new THREE.Group(); scene.add(house);
const wood = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#6a4a30'; x.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#5e4028' : '#73523a'; x.fillRect(0, i * 32, w, 31); } for (let i = 0; i < 300; i++) { x.strokeStyle = 'rgba(40,25,10,.25)'; x.beginPath(); const y = R() * h; x.moveTo(R() * w, y); x.lineTo(R() * w, y + R() * 2); x.stroke(); } }, [2, 2]);
const floorIn = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), M(0xffffff, .7, 0, 0, { map: wood })); floorIn.rotation.x = -Math.PI / 2; floorIn.position.set(-31, 0, 4); house.add(floorIn);
const floorOut = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), M(0x3a3e46, .9)); floorOut.rotation.x = -Math.PI / 2; floorOut.position.set(31, -.05, 4); house.add(floorOut);
const backIn = new THREE.Mesh(new THREE.PlaneGeometry(60, 70), M(0x4a443e, .9)); backIn.position.set(-31, 35, -4.5); house.add(backIn);
const backOut = new THREE.Mesh(new THREE.PlaneGeometry(60, 70), M(0x2a2826, .95)); backOut.position.set(31, 35, -4.5); house.add(backOut);
const wallM = M(0x6a645c, .9); const wall = new THREE.Mesh(new THREE.BoxGeometry(2, 70, 16), wallM); wall.position.set(0, 35, 3.5); house.add(wall);
const wallCap = new THREE.Mesh(new THREE.PlaneGeometry(2, 70), M(0x6a6058, .9)); wallCap.position.set(0, 35, 11.55); house.add(wallCap);
// sol exterior
const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(4, 40), new THREE.MeshBasicMaterial({ color: 0xffc060 })); sunDisc.position.set(22, 52, -4.4); house.add(sunDisc);

// ==========================================================================
// CIRCUITO DEL REFRIGERANTE
// ==========================================================================
const pts = []; const KEY = {};
const mark = k => KEY[k] = pts.length - 1;
pts.push(V3(-3, 38.6, -2.6)); pts.push(V3(-5, 37.6, -1)); mark('evapIn');
for (let r = 0; r < 6; r++) { const y = 37.6 - r * 1.15; const xa = r % 2 ? -23 : -5, xb = r % 2 ? -5 : -23; if (r > 0) pts.push(V3(xa, y, -1)); pts.push(V3(xb, y, -1)); }
mark('evapOut'); pts.push(V3(-3, 31.85, -2.2)); pts.push(V3(1, 31.6, -2.2)); pts.push(V3(2.6, 30, -2.2)); pts.push(V3(2.6, 9, -2.2)); pts.push(V3(17, 9, -2.2)); pts.push(V3(20, 8.6, -1)); mark('compIn');
pts.push(V3(20, 2.2, -1)); mark('compOut'); pts.push(V3(22.4, 2.2, -1)); pts.push(V3(23, 12.5, -3.5)); mark('condIn');
for (let c = 0; c < 8; c++) { const x = 23 - c * 2; const ya = c % 2 ? 1.8 : 12.5, yb = c % 2 ? 12.5 : 1.8; if (c > 0) pts.push(V3(x, ya, -3.5)); pts.push(V3(x, yb, -3.5)); }
mark('condOut'); pts.push(V3(8.2, 13.6, -2.4)); pts.push(V3(6.6, 13.6, -2.4)); mark('valve'); pts.push(V3(5.2, 13.6, -3.6)); pts.push(V3(4.1, 15, -3.6)); pts.push(V3(4.1, 30.5, -3.6)); pts.push(V3(1, 32.6, -3.6)); pts.push(V3(-1.5, 38.6, -3.4)); pts.push(pts[0].clone());
const loop = new THREE.CurvePath(); for (let i = 0; i < pts.length - 1; i++) loop.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
const lens = loop.getCurveLengths(); const TOT = loop.getLength(); const U = {}; for (const k in KEY) U[k] = (KEY[k] === 0 ? 0 : lens[KEY[k] - 1]) / TOT;
const copper = M(0x9a5a34, .5, .8, 0, { transparent: true });
const pipeGeo = new THREE.TubeGeometry(loop, 900, .32, 8, false); const pipe = new THREE.Mesh(pipeGeo, copper); scene.add(pipe);
const thermGeo = new THREE.TubeGeometry(loop, 900, .36, 8, false); { const n = thermGeo.attributes.position.count, cols = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const seg = Math.floor(i / 9); const c = stateAt(Math.min(1, seg / 900)); const m = Math.max(c[0][0], c[0][1], c[0][2]); cols[i * 3] = c[0][0] / m; cols[i * 3 + 1] = c[0][1] / m; cols[i * 3 + 2] = c[0][2] / m; } thermGeo.setAttribute('color', new THREE.BufferAttribute(cols, 3)); }
const thermM = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false }); const therm = new THREE.Mesh(thermGeo, thermM); scene.add(therm);
// aislamiento negro en las líneas entre unidades
const insul = new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: .8 });
for (const [a, b] of [[KEY.evapOut, KEY.compIn - 1], [KEY.valve + 1, pts.length - 2]]) { const cp = new THREE.CurvePath(); for (let i = a; i < b; i++) cp.add(new THREE.LineCurve3(pts[i], pts[i + 1])); scene.add(new THREE.Mesh(new THREE.TubeGeometry(cp, 200, .62, 10, false), insul)); }
// temperatura/estado del refrigerante a lo largo del circuito
function stateAt(u) { // devuelve [color, esLíquido]
  if (u < U.evapIn) return [ICY, 1];
  if (u < U.evapOut) { const k = (u - U.evapIn) / (U.evapOut - U.evapIn); return [mix(ICY, CYAN, k), k < .7 ? 1 : 0]; }
  if (u < U.compIn) return [CYAN, 0];
  if (u < U.compOut) { const k = (u - U.compIn) / (U.compOut - U.compIn); return [mix(CYAN, HOT, k), 0]; }
  if (u < U.condIn) return [HOT, 0];
  if (u < U.condOut) { const k = (u - U.condIn) / (U.condOut - U.condIn); return [mix(HOT, WARM, k), k > .4 ? 1 : 0]; }
  if (u < U.valve) return [WARM, 1];
  return [ICY, 1]; }

// ==========================================================================
// UNIDAD INTERIOR (split) con evaporador y ventilador tangencial
// ==========================================================================
const indoor = new THREE.Group(); scene.add(indoor);
const shellM = M(0xb8bcc2, .5, .05, 0, { clippingPlanes: clip, side: THREE.DoubleSide, transparent: true });
const inBox = new THREE.Mesh(new THREE.BoxGeometry(24, 9, 6.4), shellM); inBox.position.set(-14, 34.6, -1.2); indoor.add(inBox);
const inVent = new THREE.Mesh(new THREE.BoxGeometry(20, .6, 1.2), M(0x30343a, .6)); inVent.position.set(-14, 30.3, 1.6); indoor.add(inVent);
const led = new THREE.Mesh(new THREE.CircleGeometry(.25, 12), new THREE.MeshBasicMaterial({ color: 0x40d0ff })); led.position.set(-4.5, 31.5, 2.05); indoor.add(led);
const finM = M(0xc8ccd4, .35, .8, 0, { transparent: true, opacity: .55 });
const fins = new THREE.InstancedMesh(new THREE.BoxGeometry(.06, 7.4, 2.4), finM, 24); for (let i = 0; i < 24; i++) { dummy.position.set(-23.5 + i * .8, 34.7, -1); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); fins.setMatrixAt(i, dummy.matrix); } indoor.add(fins);
const xfan = new THREE.Group(); xfan.position.set(-14, 31.2, .6); indoor.add(xfan);
const bladeM = M(0x9aa0a8, .5, .3); for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; const b = new THREE.Mesh(new THREE.BoxGeometry(18, .08, .7), bladeM); b.position.set(0, Math.cos(a) * .9, Math.sin(a) * .9); b.rotation.x = a + .5; xfan.add(b); }

// ==========================================================================
// UNIDAD EXTERIOR: carcasa, ventilador, condensador, compresor, válvula
// ==========================================================================
const outdoor = new THREE.Group(); scene.add(outdoor);
const outM = M(0xd8dade, .45, .1, 0, { clippingPlanes: clip, side: THREE.DoubleSide, transparent: true });
const outBox = new THREE.Mesh(new THREE.BoxGeometry(18, 14, 8), outM); outBox.position.set(15.5, 7.2, -.4); outdoor.add(outBox);
const grille = new THREE.Mesh(new THREE.TorusGeometry(4.6, .25, 8, 48), M(0x30343a, .6)); grille.position.set(13, 7.2, 3.7); outdoor.add(grille);
const grilleBars = new THREE.Group(); grilleBars.position.copy(grille.position); outdoor.add(grilleBars); for (let k = 0; k < 6; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(9.2, .12, .12), M(0x30343a, .6)); b.rotation.z = k * Math.PI / 6; grilleBars.add(b); }
const prop = new THREE.Group(); prop.position.set(13, 7.2, 2.6); outdoor.add(prop);
const propM = M(0x2a2e34, .5, .2); for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(4, 1.6, .2), propM); b.geometry.translate(2.2, 0, 0); b.rotation.set(.4, 0, k * Math.PI * 2 / 3); prop.add(b); }
const hub = new THREE.Mesh(new THREE.CylinderGeometry(.8, .8, .8, 16), propM); hub.rotation.x = Math.PI / 2; prop.add(hub);
const comp = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 6.4, 32), M(0x14161a, .4, .5)); comp.position.set(20, 5.2, -1); outdoor.add(comp);
const compTop = new THREE.Mesh(new THREE.SphereGeometry(2.3, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), comp.material); compTop.position.set(20, 8.4, -1); outdoor.add(compTop);
const compGlow = new THREE.Mesh(new THREE.CylinderGeometry(2.45, 2.45, 6.6, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0xff5020, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); compGlow.position.copy(comp.position); outdoor.add(compGlow);
const valveB = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, 1.6, 12), M(0x8a6a30, .6, .5, 0)); valveB.rotation.z = Math.PI / 2; valveB.position.set(7.4, 13.6, -2.4); outdoor.add(valveB);
const valveM = valveB.material;
const condFins = new THREE.InstancedMesh(new THREE.BoxGeometry(17, .05, 1.6), M(0xb8bcc4, .4, .8), 16); for (let i = 0; i < 16; i++) { dummy.position.set(16, 1.6 + i * .72, -3.5); dummy.updateMatrix(); condFins.setMatrixAt(i, dummy.matrix); } outdoor.add(condFins);
// bandeja de condensados y tubo de desagüe
const drain = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(-23.5, 30.6, -1), V3(-25.5, 29, -2), V3(-26, 22, -3.6)]), 20, .3, 8), M(0xe8e8e8, .6)); indoor.add(drain);

// ==========================================================================
// MATRAZ (refrigerante hirviendo a −50 °C) e IMPRENTA (1902)
// ==========================================================================
const flask = new THREE.Group(); flask.position.set(-14, 14, 4); scene.add(flask);
const flaskGlass = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 9, 32, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xcfe8ff, roughness: .05, transparent: true, opacity: .22, side: THREE.DoubleSide, depthWrite: false })); flaskGlass.position.y = 4.5; flask.add(flaskGlass);
const flaskLiq = new THREE.Mesh(new THREE.CylinderGeometry(2.85, 2.85, 4, 32), new THREE.MeshStandardMaterial({ color: 0x9ad8ff, roughness: .1, transparent: true, opacity: .6, emissive: 0x103050, depthWrite: false })); flaskLiq.position.y = 2.1; flask.add(flaskLiq);
const frost = new THREE.Mesh(new THREE.TorusGeometry(3.05, .16, 8, 40), new THREE.MeshStandardMaterial({ color: 0xc8d8e8, roughness: .9, emissive: 0x0a1018 })); frost.rotation.x = Math.PI / 2; frost.position.y = .2; flask.add(frost);
const press = new THREE.Group(); press.position.set(-12, 0, 2); scene.add(press);
const table = new THREE.Mesh(new THREE.BoxGeometry(26, 1, 12), M(0x4a3a2a, .8)); table.position.y = 10; press.add(table);
const rollM = M(0x202226, .4, .6); const rollers = []; for (const y of [13.4, 11.6]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, 10, 24), rollM); r.rotation.x = Math.PI / 2; r.position.set(-4, y, 0); press.add(r); rollers.push(r); }
const paperM = new THREE.MeshStandardMaterial({ color: 0x9a968c, roughness: .95, side: THREE.DoubleSide });
const NS = 5; const sheets = []; for (let i = 0; i < NS; i++) { const g = new THREE.PlaneGeometry(8, 8, 16, 16); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, paperM); m.userData.base = g.attributes.position.array.slice(); press.add(m); sheets.push(m); }
const inkTex = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#f2eee4'; x.fillRect(0, 0, w, h); const cols = ['#d04848', '#3a70c0', '#e0b030']; for (let k = 0; k < 3; k++) { x.fillStyle = cols[k]; x.globalAlpha = .7; x.fillRect(40 + k * 60, 60, 50, 140); } x.globalAlpha = 1; x.fillStyle = '#222'; x.font = '700 28px Georgia'; x.fillText('1902', 90, 40); });
paperM.map = inkTex;
function setSheets(t, humid) { for (let i = 0; i < NS; i++) { const m = sheets[i]; const p = m.geometry.attributes.position, b = m.userData.base; const ph = fract(t * .18 + i / NS);
    m.position.set(lerp(-14, 12, ph), 10.6 + i * .02, 0); m.visible = ph > .02 && ph < .98;
    for (let j = 0; j < p.count; j++) { const x = b[j * 3], z = b[j * 3 + 2]; p.setY(j, humid * (.9 * Math.sin(x * 1.1 + i) * Math.cos(z * .9 - i) + .5 * Math.sin(z * 1.7 + x * .5))); } p.needsUpdate = true; m.geometry.computeVertexNormals(); } }

// ==========================================================================
// TIMELINE
// ==========================================================================
const P = new Particles(18000, { size: .5, seed: 61 }); scene.add(P.obj);
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
const L = (t, a, b) => smooth(TL[a], TL[a] + .3, t) * (b ? 1 - smooth(TL[b] - .1, TL[b] + .1, t) : 1);
const S = () => P.seed;
const tmp = V3();
function refrig(a, t, spd = .05, hi = null) { if (a <= .01) return; const s = S(); const N = 4200;
  for (let i = 0; i < N; i++) { const q = (i % P.n) * 4; const u = fract(i / N + t * spd); const [c, liq] = stateAt(u); if (!liq && s[q] > .45) continue;
    loop.getPointAt(u, tmp); const j = liq ? .14 : .28; let f = a; if (hi && (u < hi[0] || u > hi[1])) f *= .25; f *= 1.6; P.push(tmp.x + (s[q + 1] - .5) * j, tmp.y + (s[q + 2] - .5) * j, tmp.z + (s[q + 3] - .5) * j, c[0] * f, c[1] * f, c[2] * f); } }
function roomAir(a, t, cold = 1, heat = 1) { if (a <= .01) return; const s = S();
  for (let i = 0; i < 1100; i++) { const q = ((i + 3000) % P.n) * 4; const age = fract(s[q] + t * .35);
    if (i < 500) { if (heat <= .01) continue; // aire caliente de la habitación hacia la unidad
      const p0 = V3(-34 + s[q + 1] * 30, 2 + s[q + 2] * 22, -2 + s[q + 3] * 10); const p1 = V3(-14 + (s[q + 1] - .5) * 20, 39.5, -1.2); const k = easeInOut(age); const f = a * heat * Math.sin(age * Math.PI) * .45; P.push(lerp(p0.x, p1.x, k), lerp(p0.y, p1.y, k), lerp(p0.z, p1.z, k), WARM[0] * f, WARM[1] * f, WARM[2] * f); }
    else { if (cold <= .01) continue; const x0 = -23 + s[q + 1] * 18; const k = age; const f = a * cold * (1 - k) * .9; P.push(x0 - k * 6, 30 - k * 16 - k * k * 6, 1.6 + k * 10 + (s[q + 2] - .5) * 3 * k, COLD[0] * f, COLD[1] * f, COLD[2] * f); } } }
function outAir(a, t) { if (a <= .01) return; const s = S(); for (let i = 0; i < 900; i++) { const q = ((i + 6000) % P.n) * 4; const age = fract(s[q] + t * .9); const r = Math.sqrt(s[q + 1]) * 4.2, an = s[q + 2] * 6.283; const f = a * (1 - age);
  P.push(13 + Math.cos(an) * r * (1 + age), 7.2 + Math.sin(an) * r * (1 + age) + age * 3, 3.8 + age * 16, HOT[0] * f, HOT[1] * f, HOT[2] * f); } }
function heatTransfer(a, t) { if (a <= .01) return; const s = S(); for (let i = 0; i < 900; i++) { const q = ((i + 9000) % P.n) * 4; const age = fract(s[q] + t * .3); const p0 = V3(-30 + s[q + 1] * 26, 3 + s[q + 2] * 26, (s[q + 3] - .5) * 8); const p1 = V3(30 + s[q + 1] * 8, 4 + s[q + 2] * 30, (s[q + 3] - .5) * 8); const mid = V3(0, 45, -2);
  const k = age; const p = p0.clone().lerp(mid, k).lerp(mid.clone().lerp(p1, k), k); const f = a * Math.sin(age * Math.PI) * 1.3; P.push(p.x, p.y, p.z, WARM[0] * f, WARM[1] * f, WARM[2] * f); } }

let CAMD = 60; const cam = (tg, d, az, el, f) => { camOrbit(tg, d, az, el, f); CAMD = d; };
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .3; camera.far = 2000;
  let bloomS = .7, flash = 0, ca = .0013, fade = 0, grain = .035, expo = 1.15, dim = 0;
  P.begin(); P.mat.size = .45; CUT.constant = 100; shellM.opacity = 1; outM.opacity = 1; shellM.depthWrite = outM.depthWrite = true; flask.visible = false; press.visible = false; house.visible = true; indoor.visible = outdoor.visible = pipe.visible = true;
  compGlow.material.opacity = 0; valveM.emissive.setRGB(0, 0, 0); finM.emissive.setRGB(0, 0, 0); copper.emissive.setRGB(0, 0, 0);
  xfan.rotation.x = -t * 9; prop.rotation.z = -t * 7;
  for (const c of ['how', 'indoor', 'comp', 'valve', 'fridge', 'curious', 'paper', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = []; const xr = a => { shellM.opacity = lerp(1, .12, a); outM.opacity = lerp(1, .12, a); shellM.depthWrite = outM.depthWrite = a < .5; copper.opacity = lerp(1, .15, a); copper.depthWrite = a < .5; thermM.opacity = .55 * a; };
  copper.opacity = 1; copper.depthWrite = true; thermM.opacity = 0;
  if (t < TL.how) {
    // A · gancho: no fabrica frío, saca el calor de casa y lo tira a la calle
    roomAir(1, t, 1 - smooth(TL.takes, TL.takes + .5, t), 0); heatTransfer(smooth(TL.takes, TL.takes + .6, t), t); outAir(smooth(TL.street - .5, TL.street, t), t);
    cam(V3(-2, 22, 0), lerp(150, 158, clamp(t / TL.how)), lerp(-.15, 0, easeInOut(clamp(t / TL.how))), .1, 38);
    hud.push(() => { titleHUD('TU AIRE ACONDICIONADO', 'NO FABRICA FRÍO…', smooth(.1, .4, t) * (1 - smooth(TL.takes - .1, TL.takes + .1, t)), 300); titleHUD('SACA EL CALOR DE TU CASA…', '…Y LO TIRA A LA CALLE', L(t, 'takes', 'how'), 300);
      const xa = smooth(.9, 1.2, t) * (1 - smooth(TL.takes - .2, TL.takes, t)); if (xa > .01) { const p = project(V3(-14, 28, 2)); g2.save(); g2.globalAlpha = xa; g2.strokeStyle = '#ff5a3a'; g2.lineWidth = 14; g2.lineCap = 'round'; g2.beginPath(); g2.moveTo(p.x - 70, p.y - 70); g2.lineTo(p.x + 70, p.y + 70); g2.moveTo(p.x + 70, p.y - 70); g2.lineTo(p.x - 70, p.y + 70); g2.stroke(); g2.restore(); }
      txt('DENTRO', W * .25, 1500, 30, { spacing: 6, alpha: L(t, 'takes', 'how'), fill: '#7ab8ff' }); txt('FUERA', W * .75, 1500, 30, { spacing: 6, alpha: L(t, 'takes', 'how'), fill: '#ffa060' }); });
  } else if (t < TL.indoor) {
    // B · ¿cómo? refrigerante: hierve a −50 °C a presión normal
    house.visible = false; indoor.visible = outdoor.visible = pipe.visible = false; flask.visible = true; flask.position.set(0, 0, 0); const lt = t - TL.how; const s = S();
    const boil = smooth(TL.liquid + .3, TL.minus, t); for (let i = 0; i < 700 * boil; i++) { const q = ((i + 1200) % P.n) * 4; const u = fract(s[q] + t * 1.3); const a2 = s[q + 1] * 6.283, r = Math.sqrt(s[q + 2]) * 2.6; const f = (1 - u * .5) * boil; P.push(Math.cos(a2) * r, .3 + u * (u < .45 ? 4 : 4 + (u - .45) * 14), Math.sin(a2) * r * .9, ICY[0] * f * .8, ICY[1] * f * .8, ICY[2] * f * .8); }
    P.mat.size = .3; frost.scale.setScalar(1 + .05 * Math.sin(t * 3)); cam(V3(0, 2.5, 0), lerp(34, 30, clamp(lt / 6)), .3 + lt * .05, .3, 38); bloomS = .8;
    hud.push(() => { titleHUD('¿CÓMO?', 'CON UN LÍQUIDO…', L(t, 'how', 'minus'), 300); titleHUD('QUE A PRESIÓN NORMAL', 'HIERVE A…', L(t, 'minus', 'refri'), 300); bigStat('', '−50 °C', 1640, smooth(TL.minus, TL.minus + .3, t), clamp((t - TL.minus) / 1.2));
      titleHUD('EL', 'REFRIGERANTE', L(t, 'refri'), 300); });
  } else if (t < TL.travel) {
    // C · unidad interior: serpentín helado, el ventilador sopla aire de la habitación, el refrigerante hierve → gas
    const lt = t - TL.indoor; xr(smooth(TL.indoor, TL.indoor + .6, t)); refrig(1, t, .05, [U.evapIn - .01, U.evapOut + .01]); roomAir(smooth(TL.fan, TL.fan + .5, t), t, smooth(TL.fan, TL.fan + .6, t), smooth(TL.fan, TL.fan + .6, t));
    const fg = smooth(TL.coil, TL.coil + .4, t) * (1 - smooth(TL.fan, TL.fan + .4, t)); finM.emissive.setRGB(.05 * fg, .2 * fg, .45 * fg);
    cam(V3(-14, 33, 0), lerp(lerp(70, 58, clamp(lt / 6)), 54, smooth(TL.absorbs, TL.gas, t)), -.15 + lt * .02, .12, 38); bloomS = .85;
    hud.push(() => { titleHUD('EN LA UNIDAD DE LA PARED', 'UN SERPENTÍN MUY FRÍO', L(t, 'indoor', 'fan'), 300); titleHUD('EL VENTILADOR SOPLA', 'EL AIRE DE LA HABITACIÓN', L(t, 'fan', 'absorbs'), 300);
      titleHUD('EL REFRIGERANTE ABSORBE SU CALOR', 'Y HIERVE', L(t, 'absorbs', 'gas'), 300); titleHUD('SE CONVIERTE', 'EN GAS', L(t, 'gas'), 300);
      callout(V3(-20, 36.4, -1), -60, -230, 'SERPENTÍN', null, smooth(TL.coil, TL.coil + .3, t) * (1 - smooth(TL.absorbs - .2, TL.absorbs, t)), '#7ab8ff'); callout(V3(-8, 31.2, .6), 60, 220, 'VENTILADOR', null, smooth(TL.fan + .2, TL.fan + .5, t) * (1 - smooth(TL.absorbs - .2, TL.absorbs, t)), '#e3a372');
      callout(V3(-6, 31.85, -1), 120, -260, 'GAS', null, smooth(TL.gas, TL.gas + .3, t), '#7ae0ff'); });
  } else if (t < TL.release) {
    // D · viaja al compresor, que lo aprieta: se calienta más que el aire de agosto
    const lt = t - TL.travel; xr(1); refrig(1, t, .05, t < TL.comp ? [U.evapOut, U.compIn] : [U.compIn - .01, U.condIn]); roomAir(.6, t, 1, .4);
    const cg = smooth(TL.squeeze, TL.squeeze + .6, t); compGlow.material.opacity = cg * (.25 + .1 * Math.sin(t * 12)); comp.position.y = 5.2 + Math.sin(t * 40) * .04 * cg;
    const z = easeInOut(smooth(TL.travel, TL.outdoor + .6, t)); const z2 = easeInOut(smooth(TL.comp - .3, TL.comp + .6, t));
    cam(V3(lerp(-6, 16, z), lerp(30, 8, z), 0), lerp(lerp(76, 70, z), 56, z2), lerp(-.1, .35, z2), lerp(.12, .2, z2), 38); bloomS = .85;
    hud.push(() => { titleHUD('ESE GAS VIAJA POR UN TUBO', 'HASTA LA MÁQUINA DE FUERA', L(t, 'travel', 'comp'), 300); titleHUD('UN COMPRESOR', 'LO APRIETA CON FUERZA', L(t, 'comp', 'hot'), 300);
      callout(V3(20, 6, 1.3), 80, -260, 'COMPRESOR', null, smooth(TL.comp + .2, TL.comp + .5, t) * (1 - smooth(TL.hot - .2, TL.hot, t)), '#ff8a50');
      titleHUD('AL COMPRIMIRLO', 'SE CALIENTA MUCHÍSIMO', L(t, 'hot', 'august'), 300); titleHUD('MÁS QUE LA CALLE', 'EN PLENO AGOSTO', L(t, 'august'), 300);
      const ba = smooth(TL.hot + .3, TL.hot + .6, t); bar(W / 2 - 300, 1500, 600, .55, 'CALLE EN AGOSTO', '40 °C', ba * smooth(TL.august, TL.august + .3, t), '#e3a372'); bar(W / 2 - 300, 1620, 600, lerp(.2, .95, easeOut(clamp((t - TL.hot - .3) / 1.4))), 'GAS COMPRIMIDO', '≈ 70 °C', ba, '#ff5a3a'); });
  } else if (t < TL.cools) {
    // E · condensador: suelta su calor fuera; el ventilador echa aire caliente
    const lt = t - TL.release; xr(1); refrig(1, t, .05, [U.compOut, U.condOut + .01]); outAir(smooth(TL.fan2, TL.fan2 + .4, t), t); roomAir(.5, t, 1, .3); compGlow.material.opacity = .15;
    cam(V3(15, 8, 0), lerp(46, 52, clamp(lt / 6)), lerp(.3, -.25, easeInOut(clamp(lt / 7))), .18, 38); bloomS = .85;
    hud.push(() => { titleHUD('ASÍ PUEDE SOLTAR SU CALOR', 'FUERA, EN OTRO SERPENTÍN', L(t, 'release', 'fan2'), 300); titleHUD('MIENTRAS UN', 'VENTILADOR LO SOPLA', L(t, 'fan2', 'hotair'), 300); titleHUD('POR ESO ECHA', 'AIRE CALIENTE', L(t, 'hotair'), 300);
      callout(V3(11, 12, -3.5), -80, -240, 'CONDENSADOR', null, smooth(TL.coil2, TL.coil2 + .3, t) * (1 - smooth(TL.hotair - .2, TL.hotair, t)), '#ff8a50'); });
  } else if (t < TL.fridge) {
    // F · vuelve a ser líquido, válvula estrecha: caída de presión → sale helado
    const lt = t - TL.cools; xr(1); refrig(1, t, .05, [U.condOut - .08, U.valve + .06]); outAir(.5, t); roomAir(.5, t, 1, .3);
    const vg = smooth(TL.valve, TL.valve + .4, t); valveM.emissive.setRGB(.18 * vg, .1 * vg, .02 * vg); const s = S();
    const ice = smooth(TL.drop, TL.drop + .5, t); for (let i = 0; i < 300 * ice; i++) { const q = ((i + 11000) % P.n) * 4; const age = fract(s[q] + t * .7); const f = ice * (1 - age) * 1.2; P.push(6.4 - age * 2 + (s[q + 1] - .5) * 1.4 * age, 13.6 + (s[q + 2] - .5) * 1.4 * age, -2.4 + (s[q + 3] - .5) * 1.4 * age, ICY[0] * f, ICY[1] * f, ICY[2] * f); }
    const z = easeInOut(smooth(TL.valve - .4, TL.valve + .5, t)); cam(V3(lerp(10, 7, z), lerp(10, 13.4, z), lerp(0, -2.4, z)), lerp(46, 14, z), lerp(-.25, .25, z), lerp(.18, .25, z), 38); bloomS = .85;
    hud.push(() => { titleHUD('AL ENFRIARSE', 'VUELVE A SER LÍQUIDO', L(t, 'cools', 'valve'), 300); titleHUD('UNA VÁLVULA ESTRECHA', 'LE BAJA LA PRESIÓN DE GOLPE…', L(t, 'valve', 'icy'), 300); titleHUD('…Y SALE', 'HELADO', L(t, 'icy', 'again'), 300); titleHUD('LISTO PARA', 'OTRA VUELTA', L(t, 'again'), 300);
      callout(V3(7.4, 14.2, -2.4), 60, -260, 'VÁLVULA', null, smooth(TL.valve + .3, TL.valve + .6, t) * (1 - smooth(TL.icy - .2, TL.icy, t)), '#e3c070');
      bar(W / 2 - 300, 1600, 600, t < TL.drop ? .85 : lerp(.85, .15, easeOut(clamp((t - TL.drop) / .5))), 'PRESIÓN', '', smooth(TL.valve + .2, TL.valve + .5, t) * (1 - smooth(TL.again - .2, TL.again, t)), '#e3a372'); });
  } else if (t < TL.curious) {
    // G · el mismo truco que la nevera; el agua que gotea es humedad condensada
    const lt = t - TL.fridge; xr(1); refrig(1, t, .05); roomAir(.8, t, 1, .5); outAir(.6, t); const s = S();
    const dr = smooth(TL.drip, TL.drip + .5, t); for (let i = 0; i < 500 * dr; i++) { const q = ((i + 13000) % P.n) * 4; const age = fract(s[q] + t * .5); let p;
      if (s[q + 1] < .6) p = V3(-23.5 + s[q + 2] * 19, 31 + (1 - age) * 7, -1 + (s[q + 3] - .5) * 2.4); else { const k = age; p = V3(-26, 22 - k * k * 20, -3.6); if (p.y < 0) continue; }
      const f = dr * .9; P.push(p.x, p.y, p.z, .7 * f, 1.1 * f, 1.8 * f); }
    const z = easeInOut(smooth(TL.drip - .3, TL.drip + .6, t)); cam(V3(lerp(0, -16, z), lerp(22, 28, z), 0), lerp(lerp(155, 150, clamp(lt / 3)), 62, z), lerp(0, -.2, z), .12, 38);
    hud.push(() => { titleHUD('ES EL MISMO TRUCO', 'QUE USA TU NEVERA', L(t, 'fridge', 'drip'), 300); titleHUD('EL AGUA QUE GOTEA ES', 'LA HUMEDAD DEL AIRE', L(t, 'drip', 'cond'), 300); titleHUD('QUE SE CONDENSA', 'EN EL SERPENTÍN FRÍO', L(t, 'cond'), 300);
      const fa = L(t, 'fridge', 'drip'); if (fa > .01) { const cx = W / 2, cy = 1560; g2.save(); g2.globalAlpha = fa; g2.strokeStyle = '#e3a372'; g2.lineWidth = 6; g2.lineJoin = 'round'; g2.strokeRect(cx - 55, cy - 110, 110, 220); g2.beginPath(); g2.moveTo(cx - 55, cy - 30); g2.lineTo(cx + 55, cy - 30); g2.moveTo(cx + 35, cy - 80); g2.lineTo(cx + 35, cy - 50); g2.moveTo(cx + 35, cy - 10); g2.lineTo(cx + 35, cy + 40); g2.stroke(); g2.restore(); } });
  } else if (t < TL.brand) {
    // H · 1902: no para las personas, sino para el papel de una imprenta
    house.visible = false; indoor.visible = outdoor.visible = pipe.visible = false; press.visible = true; const lt = t - TL.curious; const dry = smooth(TL.paper + .6, TL.print + 1.2, t);
    setSheets(t, lerp(1, .02, dry)); rollers[0].rotation.y = 0; rollers.forEach((r, i) => r.rotation.z = Math.PI / 2); rollers[0].rotateY(t * 3); rollers[1].rotateY(-t * 3);
    const s = S(); for (let i = 0; i < 600; i++) { const q = ((i + 15000) % P.n) * 4; const age = fract(s[q] + t * .25); const f = Math.sin(age * Math.PI) * .7; const c = mix([.6, .9, 1.4], COLD, dry);
      P.push(-12 + (s[q + 1] - .5) * 30 + (dry > .5 ? -age * 4 : 0), 11 + s[q + 2] * 14 - (dry > .5 ? age * 3 : 0), (s[q + 3] - .5) * 14, c[0] * f, c[1] * f, c[2] * f); }
    cam(V3(-10, 11, 0), lerp(62, 56, clamp(lt / 10)), -.35 + lt * .05, .6, 38); bloomS = .45;
    hud.push(() => { titleHUD('LO MÁS CURIOSO', '', L(t, 'curious', 'year'), 300); bigStat('', '1902', 600, L(t, 'year', 'paper'), clamp((t - TL.year) / 1.2)); titleHUD('NO SE INVENTÓ', 'PARA LAS PERSONAS…', L(t, 'people', 'paper'), 300);
      titleHUD('…SINO PARA QUE EL PAPEL', 'NO SE DEFORMARA', L(t, 'paper'), 300); bar(W / 2 - 300, 1600, 600, lerp(.9, .45, dry), 'HUMEDAD', dry > .6 ? 'CONTROLADA' : 'ALTA', smooth(TL.people, TL.people + .4, t), dry > .6 ? '#6ad08a' : '#7ab8ff');
      txt('Willis Carrier · imprenta de Brooklyn', W / 2, 1720, 28, { weight: 300, alpha: smooth(TL.print, TL.print + .4, t) }); });
  } else {
    // I · marca
    const lt = t - TL.brand; xr(1); refrig(1, t, .05); roomAir(.6, t, 1, .4); outAir(.5, t); cam(V3(-2, 22, 0), 155 + lt * 4, lt * .03, .1, 38); dim = smooth(0, .8, lt) * .6; expo = 1.05;
    hud.push(() => drawBrand(lt - .3)); fade = smooth(TL.end - .6, TL.end, t) * .3;
  }
  if (COVER) { xr(1); P.begin(); refrig(1, t, .05); roomAir(.8, t, 1, .5); outAir(.8, t); cam(V3(-2, 30, 0), 140, 0, .02, 38); }
  P.mat.size = Math.max(.25, CAMD * .0085);
  P.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (dim > 0) hud.unshift(() => { g2.save(); g2.globalAlpha = dim * .7; g2.fillStyle = '#02050b'; g2.fillRect(0, 0, W, H); g2.restore(); });
  if (!COVER) for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
let COVER = false;
function renderCover() { COVER = true; renderFrame(TL.release + 2); coverText('NO FABRICA', 'FRÍO', 'El aire acondicionado, por dentro'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
