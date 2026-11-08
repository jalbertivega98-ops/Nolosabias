// NO LO SABÍAS — "¿Cómo calienta una bomba de calor con aire helado?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final. Esquema, no a escala.
// Ciclo de compresión de vapor: evaporador (fuera) → compresor → condensador (dentro) → válvula de expansión → evaporador.
// R-32 hierve a −51,7 °C a presión atmosférica. Descarga del compresor típica: 60–90 °C. COP típico aire-agua/aire-aire: 3–4.
// Lord Kelvin (William Thomson), 1852: «On the Economy of the Heating or Cooling of Buildings by Means of Currents of Air».
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, easeIn, rng, V3, g2, camera, Particles, txt, copperGrad, project, callout, titleHUD, fract, camOrbit, bigStat, bar, drawBrand, coverText, finish, arrowXY, noise1 } from '../../lib/core.js';

const scene = new THREE.Scene(); scene.background = new THREE.Color(0x04070f);
const hemi = new THREE.HemisphereLight(0xb8c8ff, 0x302830, 1.3); scene.add(hemi);
const key = new THREE.DirectionalLight(0xdfe8ff, 1.8); key.position.set(-30, 50, 60); scene.add(key);
const fillL = new THREE.DirectionalLight(0xffb070, .9); fillL.position.set(40, 10, 30); scene.add(fillL);
const M = (c, r = .5, m = .3, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: e });
const box = (w, h, d, mat, x = 0, y = 0, z = 0, parent = scene) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; };
function xray(col, k = 1) { return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  uniforms: { uCol: { value: col.clone() }, uA: { value: k } },
  vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform vec3 uCol; uniform float uA; varying vec3 vN; varying vec3 vV; void main(){ float f=pow(clamp(1.-abs(dot(vN,vV)),0.,1.),2.); gl_FragColor=vec4(uCol*(f*.8+.05)*uA,(f*.7+.04)*uA); }` }); }
function fanBlades(r, n, col) { const g = new THREE.Group(); for (let k = 0; k < n; k++) { const s = new THREE.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(r * .55, r * .25, r, r * .1); s.quadraticCurveTo(r * .7, -r * .25, 0, 0);
  const m = new THREE.Mesh(new THREE.ShapeGeometry(s), M(col, .5, .2)); m.rotation.z = k / n * Math.PI * 2; g.add(m); } const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * .18, r * .18, r * .1, 20), M(0x30343a, .5, .4)); hub.rotation.x = Math.PI / 2; g.add(hub); return g; }

// ==========================================================================
// CASA EN INVIERNO + UNIDAD EXTERIOR
// ==========================================================================
const house = new THREE.Group(); scene.add(house);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), M(0xdfe6f0, .9, 0, 0x1a2030)); ground.rotation.x = -Math.PI / 2; house.add(ground);
const wallMat = M(0xb89a80, .85, .05), roofMat = M(0x5a3a30, .7, .1);
box(8, 3.2, 6, wallMat, 0, 1.6, 0, house);
{ const s = new THREE.Shape(); s.moveTo(-4.4, 0); s.lineTo(4.4, 0); s.lineTo(0, 2.2); s.closePath(); const r = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 6.6, bevelEnabled: false }), roofMat); r.position.set(0, 3.2, -3.3); house.add(r);
  const sn = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 6.7, bevelEnabled: false }), M(0xf4f8ff, .9, 0, 0x202838)); sn.scale.set(1.01, .25, 1); sn.position.set(0, 4.85, -3.35); }
const winMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.3, .55) }); for (const x of [-2.4, 2.4]) box(1.4, 1.2, .05, winMat, x, 1.9, 3.03, house); box(1.1, 2, .05, M(0x4a2a1a, .7, .1), 0, 1, 3.03, house);
const chimney = box(.7, 1.6, .7, M(0x8a5a48, .8, .05), 2.2, 4.6, -1, house);
const ou = new THREE.Group(); ou.position.set(5.2, .45, 1.6); house.add(ou); box(1.3, .9, .5, M(0xeef0f2, .5, .1), 0, 0, 0, ou);
const ouFan = fanBlades(.36, 4, 0x3a3e46); ouFan.position.set(-.18, 0, .27); ou.add(ouFan); { const gr = new THREE.Mesh(new THREE.TorusGeometry(.38, .03, 6, 32), M(0x30343a, .5, .5)); gr.position.set(-.18, 0, .27); ou.add(gr); }
const pipeH = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(4.85, .7, 1.35), V3(4.6, 1.4, 1.2), V3(4.1, 2.2, 1.0)]), 20, .06, 8, false), M(0xd08848, .35, .8)); house.add(pipeH);
const pipeH2 = pipeH.clone(); pipeH2.position.y = -.25; house.add(pipeH2);

// ==========================================================================
// CICLO (esquema: dentro arriba, fuera abajo)
// ==========================================================================
const CY = V3(0, 500, 0); const cy = new THREE.Group(); cy.position.copy(CY); scene.add(cy);
const path = []; const P_ = (x, y) => path.push(V3(x, y, 0));
P_(-9, -2.5); P_(-7.5, -7); P_(-6, -8); P_(6, -8); P_(7.1, -9); P_(6, -10); P_(-6, -10); P_(-7.1, -11); P_(-6, -12); P_(6, -12); P_(8.2, -10.5); P_(9, -6.5); P_(9, -2.2); P_(9, 2.2); P_(9, 6); P_(7.6, 7.2);
P_(6, 12); P_(-6, 12); P_(-7.1, 11); P_(-6, 10); P_(6, 10); P_(7.1, 9); P_(6, 8); P_(-6, 8); P_(-8.3, 6.5); P_(-9, 3.5); P_(-9, 0);
const loopC = new THREE.CatmullRomCurve3(path, true, 'catmullrom', .35);
const tube = new THREE.Mesh(new THREE.TubeGeometry(loopC, 600, .42, 10, true), xray(new THREE.Color(.7, .7, .75), .9)); cy.add(tube);
const comp = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 5, 32), xray(new THREE.Color(.9, .8, .7), .9)); comp.position.set(9, 0, 0); cy.add(comp);
const compBody = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.85, 4.9, 32, 1, true), M(0x2a2e36, .5, .6)); compBody.position.copy(comp.position); compBody.material.transparent = true; compBody.material.opacity = .35; cy.add(compBody);
const piston = box(2.6, .9, 2.6, M(0xb0b6c0, .4, .4, 0x303438), 9, 0, 0, cy); piston.geometry = new THREE.CylinderGeometry(1.55, 1.55, .9, 32);
const valve = new THREE.Mesh(new THREE.SphereGeometry(.85, 24, 16), M(0xc89a48, .45, .5, 0x2a1a08)); valve.scale.set(1, 1.4, 1); valve.position.set(-9, .6, 0); cy.add(valve);
const evFan = fanBlades(3.2, 5, 0x8a909a); evFan.children.forEach(c => c.material.emissive && c.material.emissive.setRGB(.08, .1, .14)); evFan.position.set(0, -10, -4); cy.add(evFan); { const r = new THREE.Mesh(new THREE.TorusGeometry(3.4, .18, 8, 48), M(0x3a3e46, .5, .5)); r.position.copy(evFan.position); cy.add(r); }
const wallC = box(28, 1.4, 9, M(0x8a6a58, .9, .05), 0, 4.3, 0, cy);
const warmBg = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.MeshBasicMaterial({ color: new THREE.Color(.16, .07, .03) })); warmBg.position.set(0, 19, -8); cy.add(warmBg);
const coldBg = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.MeshBasicMaterial({ color: new THREE.Color(.02, .05, .12) })); coldBg.position.set(0, -11, -8); cy.add(coldBg);
const radiator = new THREE.Group(); radiator.visible = false; cy.add(radiator); for (let k = 0; k < 9; k++) box(.9, 2.6, .5, M(0xe8e4de, .4, .3), -4.4 + k * 1.1, 0, 0, radiator);
// u del circuito por zonas (muestreo)
const NS = 2000, SAMP = []; for (let i = 0; i < NS; i++) SAMP.push(loopC.getPointAt(i / NS));
function zoneAt(p) { if (p.x > 8.3 && p.y > -2.4 && p.y < 2.4) return 'comp'; if (p.y < -6.5 && Math.abs(p.x) < 7.3) return 'evap'; if (p.y > 6.5 && Math.abs(p.x) < 7.3) return 'cond'; if (p.x < -8.3 && p.y > -1 && p.y < 2.2) return 'valve'; return p.x > 0 ? (p.y < 0 ? 'toComp' : 'toCond') : (p.y > 0 ? 'toValve' : 'toEvap'); }
const ZONE = SAMP.map(zoneAt); const RANGE = {}; ZONE.forEach((z, i) => { RANGE[z] = RANGE[z] || [i, i]; RANGE[z][1] = i; });
// estado del refrigerante a lo largo del bucle: devuelve [r,g,b, jitter, densidad]
const COL = { liqCold: [.3, .7, 1.8], gasCold: [.55, .9, 1.6], gasHot: [2.2, .55, .25], liqWarm: [1.8, .8, .3] };
function fluidState(i) { const z = ZONE[i]; const k = RANGE[z] ? (i - RANGE[z][0]) / Math.max(1, RANGE[z][1] - RANGE[z][0]) : 0; const mix = (a, b, f) => [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)];
  if (z === 'evap') return [...mix(COL.liqCold, COL.gasCold, smooth(.15, .85, k)), lerp(.1, .45, k), lerp(1, .45, k)];
  if (z === 'toComp') return [...COL.gasCold, .45, .45]; if (z === 'comp') return [...mix(COL.gasCold, COL.gasHot, k), lerp(.45, .25, k), .7];
  if (z === 'toCond') return [...COL.gasHot, .3, .7]; if (z === 'cond') return [...mix(COL.gasHot, COL.liqWarm, smooth(.15, .85, k)), lerp(.3, .1, k), lerp(.7, 1, k)];
  if (z === 'toValve') return [...COL.liqWarm, .1, 1]; if (z === 'valve') return [...mix(COL.liqWarm, COL.liqCold, k), .15, 1]; return [...COL.liqCold, .12, 1]; }
const FS = SAMP.map((_, i) => fluidState(i));
const wc = (x, y, z) => V3(x, y, z).add(CY);

// ==========================================================================
// NEVERA (comparación)
// ==========================================================================
const FR = V3(0, 1000, 0); const fr = new THREE.Group(); fr.position.copy(FR); scene.add(fr);
const frBody = box(.75, 1.8, .7, M(0xeef0f2, .35, .2), 0, .9, 0, fr); const frX = new THREE.Mesh(frBody.geometry, xray(new THREE.Color(.6, .8, 1.2), .4)); frX.position.copy(frBody.position); fr.add(frX);
const frCoilC = (() => { const pts = []; for (let k = 0; k < 8; k++) { const y = .3 + k * .18; pts.push(V3(k % 2 ? .28 : -.28, y, -.4), V3(k % 2 ? -.28 : .28, y + .09, -.4)); } return new THREE.CatmullRomCurve3(pts); })();
const frCoilMat = M(0x222428, .5, .6, 0x000000); const frCoil = new THREE.Mesh(new THREE.TubeGeometry(frCoilC, 120, .02, 6, false), frCoilMat); fr.add(frCoil);
for (const y of [.5, 1.0, 1.45]) box(.65, .02, .6, xray(new THREE.Color(.7, .85, 1.1), .6), 0, y, .02, fr);
const frFloor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), M(0x3a3430, .9, 0)); frFloor.rotation.x = -Math.PI / 2; fr.add(frFloor);

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
const P = new Particles(16000, { size: .3, seed: 23 }); scene.add(P.obj);
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
function show(o) { house.visible = !!o.house; cy.visible = !!o.cy; fr.visible = !!o.fr; }
function snow(t, c, n, spread, h, amp = 1) { const s = P.seed; for (let i = 0; i < n; i++) { const q = ((i + 12000) % P.n) * 4; const u = fract(s[q] + t * (.08 + s[q + 3] * .05)); P.push(c.x + (s[q + 1] - .5) * spread + Math.sin(t + i) * .3, c.y + h * (1 - u), c.z + (s[q + 2] - .5) * spread, .8 * amp, .85 * amp, 1 * amp); } }
function fluid(t, amp, n = 3600, speed = .045) { if (amp <= 0) return; const s = P.seed; for (let i = 0; i < n; i++) { const q = (i % P.n) * 4; const u = fract(s[q] + t * speed); const j = Math.floor(u * NS) % NS; const f = FS[j]; if (s[q + 3] > f[4]) continue; const p = SAMP[j]; const jt = f[3];
  P.push(CY.x + p.x + (s[q + 1] - .5) * jt * 2, CY.y + p.y + (s[q + 2] - .5) * jt * 2, CY.z + (s[q + 3] - .5) * jt * 2, f[0] * amp, f[1] * amp, f[2] * amp); } }
function heatOut(t, amp) { if (amp <= 0) return; const s = P.seed; for (let i = 0; i < 1400; i++) { const q = ((i + 5000) % P.n) * 4; const age = fract(s[q] + t * .5); const x = (s[q + 1] - .5) * 13, y0 = [8, 10, 12][i % 3]; const f = amp * (1 - age) * .8;
  P.push(CY.x + x + Math.sin(age * 6 + i) * .3, CY.y + y0 + age * 6, CY.z + (s[q + 2] - .5) * 2, 2 * f, .8 * f, .3 * f); } }
function airIn(t, amp) { if (amp <= 0) return; const s = P.seed; for (let i = 0; i < 1600; i++) { const q = ((i + 7000) % P.n) * 4; const u = fract(s[q] + t * .55); const x = (s[q + 1] - .5) * 13, y = -12.5 + s[q + 2] * 5; const z = lerp(-4, 6, u); const hot = z < 0 ? 1 : Math.max(0, 1 - z / 3);
  const f = amp * Math.sin(Math.PI * u); P.push(CY.x + x, CY.y + y, CY.z + z, lerp(.9, 2.4, hot) * f, lerp(1.2, .9, hot) * f, lerp(2.2, .4, hot) * f); } }
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .05; camera.far = 5000;
  let bloomS = .7, flash = 0, ca = .0013, fade = 0, grain = .035, expo = 1.15, dim = 0;
  P.begin(); P.mat.size = .3; show({}); scene.background.setRGB(.016, .027, .06); hemi.color.set(0xb8c8ff); key.color.set(0xdfe8ff); winMat.color.setRGB(1.3, .78, .32);
  for (const c of ['how', 'inside', 'outside', 'comp', 'enters', 'valve', 'why', 'fridge', 'curious', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = []; ouFan.rotation.z = -t * 9;
  if (t < TL.inside) {
    // A · saca calor del aire de la calle, aunque haga frío
    show({ house: true }); const k = easeInOut(smooth(TL.how - .2, TL.inside, t));
    camOrbit(V3(lerp(1.2, 5.0, k), lerp(2.2, .7, k), lerp(0, 1.6, k)), lerp(lerp(22, 17, t / TL.how), 7, k), lerp(.55, .35, k), lerp(.18, .12, k), 38); snow(t, V3(0, 0, 0), 2500, 30, 12, .8); P.mat.size = .08; bloomS = .8; expo = 1.2;
    const s = P.seed; for (let i = 0; i < 700; i++) { const q = ((i + 3000) % P.n) * 4; const u = fract(s[q] + t * .7); const w = V3(5.0 + (s[q + 1] - .5) * .8, .45 + (s[q + 2] - .5) * .7, 1.6 + lerp(2.5, .3, u)); const f = Math.sin(Math.PI * u) * .9; P.push(w.x, w.y, w.z, .5 * f, .8 * f, 1.5 * f); }
    hud.push(() => { titleHUD('ESTE APARATO SACA CALOR', 'DEL AIRE DE LA CALLE', smooth(.1, .4, t) * (1 - smooth(TL.cold - .1, TL.cold + .1, t)), 300);
      const ca2 = smooth(TL.cold, TL.cold + .3, t) * (1 - smooth(TL.how - .1, TL.how + .1, t)); bigStat('AUNQUE FUERA HAGA FRÍO', '−5 °C', 330, ca2, clamp((t - TL.cold) / 1.2));
      callout(V3(5.2, .9, 1.6), -60, -260, 'BOMBA DE CALOR', 'unidad exterior', smooth(.6, 1, t) * (1 - smooth(TL.cold - .1, TL.cold, t)), '#7fd4ff');
      titleHUD('¿CÓMO PUEDE CALENTAR TU CASA', 'CON AIRE HELADO?', smooth(TL.how, TL.how + .3, t), 300); });
  } else if (t < TL.why) {
    // B–E · el ciclo: refrigerante, evaporador, compresor, condensador, válvula
    show({ cy: true }); const lt = t - TL.inside; evFan.rotation.z = -t * (t > TL.outside ? 6 : 1.5);
    const pk = Math.sin(t * 22); piston.position.y = t > TL.comp - .3 && t < TL.enters ? pk * 1.2 : 0;
    let tgt = V3(0, 0, 0), dist = 60, az = .25 + Math.sin(t * .2) * .05, el = .1;
    const seg = (a, b) => easeInOut(smooth(TL[a] - .2, TL[a] + .7, t)) * (b ? 1 - easeInOut(smooth(TL[b] - .2, TL[b] + .5, t)) : 1);
    const zOut = seg('outside', 'comp'), zComp = seg('comp', 'enters'), zIn = seg('enters', 'valve'), zVal = seg('valve', 'cycle');
    const zW = 1 - Math.max(zOut, zComp, zIn, zVal); tgt = V3(zComp * 9 + zVal * -8, zW * 1 - 10 * zOut + 1 * zComp + 10 * zIn, 0); dist = 60 - zOut * 28 - zComp * 42 - zIn * 30 - zVal * 44; az = az + zOut * .2 - zComp * .1; el = el + zOut * .12;
    camOrbit(tgt.add(CY), dist, az, el, 38); P.mat.size = lerp(.42, .2, Math.max(zComp, zVal)); bloomS = .9; expo = 1.3;
    if (zComp > .05) { const s = P.seed; const top = piston.position.y + .45; for (let i = 0; i < 700; i++) { const q = ((i + 10500) % P.n) * 4; const a = s[q] * 6.283, r = Math.sqrt(s[q + 1]) * 1.5; const y = lerp(top, 2.4, s[q + 2]); const h = smooth(TL.comp, TL.s60, t); const f = zComp * .9; P.push(CY.x + 9 + Math.cos(a) * r, CY.y + y, CY.z + Math.sin(a) * r, lerp(.55, 2.2, h) * f, lerp(.9, .55, h) * f, lerp(1.6, .25, h) * f); } }
    const fa = smooth(TL.inside, TL.inside + .8, t); fluid(t, fa); airIn(t, smooth(TL.outside + .3, TL.coil + .5, t) * (1 - smooth(TL.comp - .4, TL.comp, t))); heatOut(t, smooth(TL.enters + .3, TL.release + .5, t) * (1 - smooth(TL.valve - .3, TL.valve + .3, t)) + smooth(TL.cycle, TL.cycle + 1, t) * .5);
    radiator.children.forEach(b => b.material.emissive.setRGB(.5 * smooth(TL.release - .3, TL.release + 1, t), .15 * smooth(TL.release - .3, TL.release + 1, t), 0));
    if (zVal > .1) { const s = P.seed; for (let i = 0; i < 400; i++) { const q = ((i + 9000) % P.n) * 4; const age = fract(s[q] + t * 1.4); P.push(CY.x - 9 + (s[q + 1] - .5) * age * 1.8, CY.y - .4 - age * 2.4, CY.z + (s[q + 2] - .5) * age * 1.8, .5 * (1 - age), .9 * (1 - age), 1.8 * (1 - age)); } }
    hud.push(() => { const L = (a, b) => smooth(TL[a], TL[a] + .3, t) * (b ? 1 - smooth(TL[b] - .1, TL[b] + .1, t) : 1);
      txt('DENTRO DE CASA', 80, 760, 26, { align: 'left', spacing: 6, alpha: L('inside', 'outside') * .8, fill: '#ffb27a' }); txt('FUERA', 80, 1180, 26, { align: 'left', spacing: 6, alpha: L('inside', 'outside') * .8, fill: '#8fc8ff' });
      titleHUD('POR DENTRO CIRCULA', 'UN LÍQUIDO ESPECIAL', L('inside', 'refrig'), 300); titleHUD('EL', 'REFRIGERANTE', L('refrig', 'boils'), 300); titleHUD('QUE HIERVE A TEMPERATURAS', 'BAJÍSIMAS', L('boils', 'm50'), 300);
      bigStat('ALGUNOS HIERVEN A', '−50 °C', 330, L('m50', 'outside'), clamp((t - TL.m50) / 1.5));
      titleHUD('FUERA, PASA POR', 'UN SERPENTÍN', L('outside', 'absorb'), 300); titleHUD('ABSORBE EL CALOR DEL AIRE…', '…Y SE CONVIERTE EN GAS', L('absorb', 'comp'), 300);
      callout(wc(-6, -10, .5), -40, 190, 'EVAPORADOR', 'líquido → gas', smooth(TL.coil, TL.coil + .4, t) * (1 - smooth(TL.comp - .2, TL.comp, t)), '#8fc8ff');
      titleHUD('UN COMPRESOR', 'LO APRIETA CON FUERZA', L('comp', 'hot'), 300); titleHUD('AL COMPRIMIRLO', 'EL GAS SE CALIENTA', L('hot', 's60'), 300); bigStat('EL GAS SALE A MÁS DE', '+60 °C', 330, L('s60', 'enters'), clamp((t - TL.s60) / 1.5));
      titleHUD('EL GAS CALIENTE', 'ENTRA EN CASA', L('enters', 'release'), 300); titleHUD('SUELTA SU CALOR', 'EN LOS RADIADORES', L('release', 'liquid'), 300); titleHUD('…Y VUELVE A SER', 'LÍQUIDO', L('liquid', 'valve'), 300);
      callout(wc(-6, 10, .5), -40, -160, 'CONDENSADOR', 'gas → líquido', smooth(TL.release, TL.release + .4, t) * (1 - smooth(TL.valve - .2, TL.valve, t)), '#ffb27a');
      titleHUD('UNA VÁLVULA LE', 'BAJA LA PRESIÓN', L('valve', 'coldgas'), 300); titleHUD('SE ENFRÍA', 'DE GOLPE', L('coldgas', 'cycle'), 300); titleHUD('Y EL CICLO', 'EMPIEZA OTRA VEZ', L('cycle'), 300);
      const ck = smooth(TL.cycle + .3, TL.cycle + .8, t); callout(wc(-4, -12, .5), 60, 170, 'EVAPORADOR', null, ck, '#8fc8ff'); callout(wc(9, 2, 1.9), -60, -200, 'COMPRESOR', null, ck, '#ffffff');
      callout(wc(3, 12, .5), -40, -110, 'CONDENSADOR', null, ck, '#ffb27a'); callout(wc(-9, .6, .9), 60, -90, 'VÁLVULA', null, ck, '#e3c27a'); });
  } else if (t < TL.fridge) {
    // F · no fabrica el calor: lo mueve. 1 kWh de electricidad → 3–4 kWh de calor
    show({ cy: true }); const lt = t - TL.why; evFan.rotation.z = -t * 6; piston.position.y = Math.sin(t * 22) * 1.2; fluid(t, .8); airIn(t, .7); heatOut(t, .8); radiator.children.forEach(b => b.material.emissive.setRGB(.5, .15, 0));
    camOrbit(CY.clone(), 64 + lt * .8, .2 + lt * .02, .1, 38); P.mat.size = .3; bloomS = .8; expo = 1.2; dim = smooth(TL.kw - .3, TL.kw + .3, t) * .55;
    hud.push(() => { titleHUD('¿Y POR QUÉ ES', 'TAN EFICIENTE?', smooth(0, .3, lt) * (1 - smooth(TL.moves - TL.why - .1, TL.moves - TL.why + .1, lt)), 300);
      titleHUD('NO FABRICA EL CALOR', 'LO MUEVE', smooth(TL.moves - TL.why, TL.moves - TL.why + .3, lt) * (1 - smooth(TL.kw - TL.why - .1, TL.kw - TL.why + .1, lt)), 300);
      const ka = smooth(TL.kw - TL.why, TL.kw - TL.why + .3, lt); if (ka > .01) { txt('ELECTRICIDAD', 300, 1290, 28, { spacing: 5, alpha: ka * .85, fill: '#ffe08a' }); txt('CALOR', 780, 1290, 28, { spacing: 5, alpha: smooth(TL.x3 - TL.why - .3, TL.x3 - TL.why, lt) * .85, fill: '#ffb27a' });
        g2.save(); g2.globalAlpha = ka; g2.fillStyle = '#ffd04a'; g2.shadowColor = '#ffb020'; g2.shadowBlur = 30; g2.fillRect(240, 1180 - 170 * easeOut(clamp((lt - (TL.kw - TL.why)) / .5)), 120, 170 * easeOut(clamp((lt - (TL.kw - TL.why)) / .5))); g2.restore();
        txt('1 kWh', 300, 1230, 44, { font: 'Montserrat', weight: 800, alpha: ka });
        const hk = clamp((lt - (TL.x3 - TL.why)) / 1.2); for (let k = 0; k < 4; k++) { const a = clamp(hk * 4 - k) * (k === 3 ? .45 : 1); if (a <= 0) continue; g2.save(); g2.globalAlpha = a * ka; g2.fillStyle = '#ff8a3a'; g2.shadowColor = '#ff6a1a'; g2.shadowBlur = 30; g2.fillRect(720, 1180 - 170 * (k + 1) + 6, 120, 170 * (k === 3 ? .5 : 1) - 12 + (k === 3 ? 85 : 0)); g2.restore(); }
        txt('3–4 kWh', 780, 1230, 44, { font: 'Montserrat', weight: 800, alpha: smooth(TL.x3 - TL.why, TL.x3 - TL.why + .3, lt), fill: copperGrad(680, 880, 1240, .5) });
        arrowXY(400, 1030, 680, 1030, smooth(TL.x3 - TL.why - .2, TL.x3 - TL.why + .3, lt), '#ffffff', 8); titleHUD('POR CADA KILOVATIO', 'TRES O CUATRO DE CALOR', ka, 300); } });
  } else if (t < TL.curious) {
    // G · lo mismo que tu nevera, pero calentando la casa
    show({ fr: true }); const lt = t - TL.fridge; frCoilMat.emissive.setRGB(.9 * smooth(.3, 1, lt), .3 * smooth(.3, 1, lt), .05);
    camOrbit(FR.clone().add(V3(0, .95, 0)), lerp(4.6, 4.0, lt / 3.8), lerp(-2.2, -2.6, lt / 3.8), .15, 38); bloomS = .9; expo = 1.25; P.mat.size = .03;
    const s = P.seed; for (let i = 0; i < 1600; i++) { const q = (i % P.n) * 4; const age = fract(s[q] + t * .35); if (i % 2) { P.push(FR.x + (s[q + 1] - .5) * .6, FR.y + .2 + s[q + 2] * 1.5, FR.z + (s[q + 3] - .5) * .5, .3, .6, 1.3); }
      else { P.push(FR.x + (s[q + 1] - .5) * .6, FR.y + .3 + s[q + 2] * 1.3 + age * .8, FR.z - .45 - age * .4, 1.8 * (1 - age), .6 * (1 - age), .2 * (1 - age)); } }
    hud.push(() => { titleHUD('ES LO MISMO QUE HACE', 'TU NEVERA…', smooth(0, .3, lt) * (1 - smooth(TL.fridge - TL.fridge + 1.4, TL.fridge - TL.fridge + 1.6, lt)), 300);
      titleHUD('…PERO CALENTANDO TU CASA', 'EN VEZ DE ENFRIAR LA COMIDA', smooth(1.6, 1.9, lt), 300);
      callout(FR.clone().add(V3(.2, 1.3, -.42)), 160, -260, 'CALOR', 'sale por detrás', smooth(.5, .9, lt), '#ffb27a'); callout(FR.clone().add(V3(-.2, .7, 0)), -150, 300, 'FRÍO', 'dentro', smooth(.7, 1.1, lt), '#8fc8ff'); });
  } else if (t < TL.brand) {
    // H · Lord Kelvin, 1852
    show({ house: true }); const lt = t - TL.curious; scene.background.setRGB(.09, .06, .035); hemi.color.set(0xffd8a8); key.color.set(0xffc890); winMat.color.setRGB(1.4, .8, .3);
    camOrbit(V3(1.5, 2.2, 0), lerp(19, 15, lt / 8.4), .2 + lt * .03, .14, 38); bloomS = .8; expo = 1.1; P.mat.size = .1;
    const ak = smooth(TL.y1852 + 1.5, TL.y1852 + 2.5, t); if (ak > 0) { const s = P.seed; const c = new THREE.CatmullRomCurve3([V3(9, .5, 4), V3(5.2, .5, 2.2), V3(4.6, 1.6, 1.2), V3(2, 2, .5), V3(-1, 2.3, 0), V3(-3, 3, 0)]);
      for (let i = 0; i < 1200; i++) { const q = (i % P.n) * 4; const u = fract(s[q] + t * .25); const p = c.getPointAt(u); const hot = smooth(.4, .7, u); P.push(p.x + (s[q + 1] - .5) * .5, p.y + (s[q + 2] - .5) * .5, p.z + (s[q + 3] - .5) * .5, lerp(.5, 2, hot) * ak, lerp(.8, .7, hot) * ak, lerp(1.4, .3, hot) * ak); } }
    const yrs = Math.round(174 * easeOut(smooth(TL.years - .2, TL.years + 1.6, t)));
    hud.push(() => { titleHUD('Y LO MÁS', 'CURIOSO…', smooth(0, .3, lt) * (1 - smooth(TL.years - TL.curious - .1, TL.years - TL.curious + .1, lt)), 300);
      bigStat('LA IDEA TIENE MÁS DE', yrs + ' AÑOS', 330, smooth(TL.years - TL.curious, TL.years - TL.curious + .3, lt) * (1 - smooth(TL.kelvin - TL.curious - .1, TL.kelvin - TL.curious + .1, lt)), clamp((t - TL.years) / 1.5));
      const ka = smooth(TL.kelvin - TL.curious, TL.kelvin - TL.curious + .3, lt); bigStat('LORD KELVIN', '1852', 330, ka * smooth(TL.y1852 - TL.curious - .3, TL.y1852 - TL.curious, lt) + ka * .0, clamp((t - TL.y1852) / 1.5));
      titleHUD('LA PROPUSO', 'LORD KELVIN', ka * (1 - smooth(TL.y1852 - TL.curious - .4, TL.y1852 - TL.curious - .2, lt)), 300);
      const pa = smooth(TL.y1852 - TL.curious + 1.2, TL.y1852 - TL.curious + 1.6, lt); txt('«On the Economy of the Heating or Cooling', W / 2, 450, 30, { weight: 300, alpha: pa * .9 }); txt('of Buildings by Means of Currents of Air»', W / 2, 492, 30, { weight: 300, alpha: pa * .9 });
      txt('PARA CALENTAR EDIFICIOS CON EL AIRE DE LA CALLE', W / 2, 1500, 28, { spacing: 2, weight: 700, alpha: smooth(TL.y1852 - TL.curious + 1.8, TL.y1852 - TL.curious + 2.2, lt), fill: '#ffb27a' }); });
  } else {
    // I · marca
    show({ house: true }); const lt = t - TL.brand; camOrbit(V3(1.5, 2, 0), 20 + lt * 1.2, .5 + lt * .03, .2, 38); snow(t, V3(0, 0, 0), 1500, 30, 12, .5); P.mat.size = .08; expo = .9; fade = Math.min(.5, lt * .45); dim = smooth(0, .8, lt) * .6;
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  P.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (dim > 0) hud.unshift(() => { g2.save(); g2.globalAlpha = dim * .7; g2.fillStyle = '#02050b'; g2.fillRect(0, 0, W, H); g2.restore(); });
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
function renderCover() { renderFrame(3.3); coverText('¿CÓMO CALIENTA', 'CON AIRE HELADO?', 'Así funciona una bomba de calor'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
