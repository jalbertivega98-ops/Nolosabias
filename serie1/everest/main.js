// NO LO SABÍAS — "La zona de la muerte del Everest"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final.
// Fracción de O₂ constante (≈20,9 %) a cualquier altura; en la cima (8.849 m) la presión es ≈ 1/3 de la del nivel del mar (≈ 33 kPa).
// Por encima de ~8.000 m («zona de la muerte») no es posible aclimatarse: deterioro progresivo, hipoxia, deshidratación y policitemia
// (sangre espesa), riesgo de edema pulmonar (HAPE) y cerebral (HACE), juicio alterado. Aclimatación por rotaciones entre campos (C1–C4).
// 8 may 1978: Messner y Habeler, primera ascensión sin oxígeno embotellado. Sherpas/tibetanos: adaptaciones genéticas (p. ej. EPAS1, metabolismo).
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3,
  g2, camera, Particles, txt, copperGrad, project, callout, bar, fract, emitJet, arrowXY, bigStat, drawBrand, coverText, finish } from '../../lib/core.js';

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(new THREE.Color(.62, .72, .86), .012);
const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uTop: { value: new THREE.Color(.04, .14, .42) }, uHor: { value: new THREE.Color(.62, .74, .9) }, uSun: { value: V3(.6, .5, -.6).normalize() }, uSunC: { value: new THREE.Color(1, .9, .7) } },
  vertexShader: `varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 uTop,uHor,uSunC,uSun; varying vec3 vD; void main(){ vec3 d=normalize(vD); float y=clamp(d.y,0.,1.); vec3 c=mix(uHor,uTop,pow(y,.45)); float s=max(dot(d,uSun),0.); c+=uSunC*(pow(s,40.)*.5+smoothstep(.9992,.9996,s)*2.); gl_FragColor=vec4(c,1.); }` });
const sky = new THREE.Mesh(new THREE.SphereGeometry(2800, 32, 16), skyMat); sky.renderOrder = -1; scene.add(sky);
const hemi = new THREE.HemisphereLight(0xe2f0ff, 0x3a3a48, 1.6); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1dc, 2.8); sun.position.set(60, 50, -60); scene.add(sun);
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .7, ...o });

// ==========================================================================
// MONTAÑA (1 unidad = 1 km). Cima del Everest en (0, 8.85, 0)
// ==========================================================================
const R = rng(11); const NG = 64, nv = new Float32Array(NG * NG); for (let i = 0; i < nv.length; i++) nv[i] = R();
const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi; const g = (a, b) => nv[((a % NG + NG) % NG) + ((b % NG + NG) % NG) * NG]; const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  return lerp(lerp(g(xi, yi), g(xi + 1, yi), sx), lerp(g(xi, yi + 1), g(xi + 1, yi + 1), sx), sy); };
const ridged = (x, z) => { let s = 0, a = 1, f = .35; for (let o = 0; o < 5; o++) { s += a * (1 - Math.abs(vn(x * f, z * f) * 2 - 1)); a *= .5; f *= 2.1; } return s; };
const peak = (x, z, cx, cz, h, r) => h * Math.exp(-Math.pow(Math.hypot(x - cx, z - cz) / r, 1.25));
function heightAt(x, z) { let h = 4.6 + peak(x, z, 0, 0, 4.4, 4.2) + peak(x, z, 2.6, 2.4, 3.6, 2.8) + peak(x, z, -5, 3, 2.4, 3) + peak(x, z, 6, -4, 2.6, 3.4);
  h += (ridged(x + 40, z + 40) - 1) * .9 * smooth(0, 3, Math.hypot(x, z)); h -= smooth(9, 22, Math.hypot(x + 2, z - 10)) * 3; return h; }
const TS = 60, TN = 260; const tGeo = new THREE.PlaneGeometry(TS, TS, TN, TN); tGeo.rotateX(-Math.PI / 2);
{ const p = tGeo.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, heightAt(p.getX(i), p.getZ(i))); p.setY(0, p.getY(0)); tGeo.computeVertexNormals();
  const n = tGeo.attributes.normal, col = new Float32Array(p.count * 3); for (let i = 0; i < p.count; i++) { const y = p.getY(i), ny = n.getY(i); const snow = smooth(.62, .8, ny) * smooth(5.0, 6.0, y) + smooth(8.3, 8.6, y) * .7; const rock = [.22, .2, .21];
    const c = [lerp(rock[0], .93, snow), lerp(rock[1], .95, snow), lerp(rock[2], 1, snow)]; col.set(c, i * 3); } tGeo.setAttribute('color', new THREE.BufferAttribute(col, 3)); }
// la cima exacta
{ const p = tGeo.attributes.position; let mx = 0; for (let i = 0; i < p.count; i++) mx = Math.max(mx, p.getY(i)); const k = 8.85 / mx; for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) * k); tGeo.computeVertexNormals(); }
const terrain = new THREE.Mesh(tGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .85 })); scene.add(terrain);
const hAt = (x, z) => { const rc = new THREE.Raycaster(V3(x, 50, z), V3(0, -1, 0)); const hit = rc.intersectObject(terrain)[0]; return hit ? hit.point.y : 0; };
const SUMMIT = (() => { const p = tGeo.attributes.position; let b = 0, bi = 0; for (let i = 0; i < p.count; i++) if (p.getY(i) > b) { b = p.getY(i); bi = i; } return V3(p.getX(bi), b, p.getZ(bi)); })();
// plano de los 8.000 m
const deathPlane = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.MeshBasicMaterial({ color: 0xff3a2a, transparent: true, opacity: .25, side: THREE.DoubleSide, depthWrite: false })); deathPlane.rotation.x = -Math.PI / 2; deathPlane.position.set(SUMMIT.x, 8.0, SUMMIT.z); scene.add(deathPlane);
const deathRing = new THREE.Mesh(new THREE.TorusGeometry(9, .03, 6, 128), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, .5, .3) })); deathRing.rotation.x = Math.PI / 2; deathRing.position.copy(deathPlane.position); scene.add(deathRing);

// ==========================================================================
// ALPINISTA (escala real, metros) en una arista nevada separada: CL
// ==========================================================================
const CL = V3(0, -400, 0); const ridge = new THREE.Group(); ridge.position.copy(CL); scene.add(ridge);
{ const g = new THREE.PlaneGeometry(80, 80, 160, 160); g.rotateX(-Math.PI / 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, -Math.abs(x) * .55 + (vn(x * .3 + 9, z * .3) - .5) * 1.2 - z * .12 + (ridged(x * .2 + 3, z * .2) - 1) * .4); }
  g.computeVertexNormals(); ridge.add(new THREE.Mesh(g, M(0xf2f5fa, { roughness: .9 }))); }
function makeClimber(suit = 0xd9452a) { const g = new THREE.Group(); const S = M(suit, { roughness: .8 }), D = M(0x222428), Sk = M(0xc48a64);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.24, .55, 6, 12), S); body.position.y = 1.15; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.15, 16, 12), S); head.position.y = 1.72; g.add(head); const face = new THREE.Mesh(new THREE.SphereGeometry(.1, 12, 8), Sk); face.position.set(0, 1.7, -.08); g.add(face);
  const gog = new THREE.Mesh(new THREE.BoxGeometry(.2, .06, .05), M(0x111111, { metalness: .6, roughness: .2 })); gog.position.set(0, 1.74, -.15); g.add(gog);
  const pack = new THREE.Mesh(new THREE.BoxGeometry(.38, .5, .22), M(0x2a3a5a)); pack.position.set(0, 1.2, .25); g.add(pack);
  const tank = new THREE.Mesh(new THREE.CapsuleGeometry(.08, .4, 4, 10), M(0xff8a2a, { emissive: 0x401000 })); tank.position.set(0, 1.28, .4); g.add(tank);
  const mask = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), D); mask.position.set(0, 1.63, -.16); g.add(mask);
  const legs = [-1, 1].map(s => { const j = new THREE.Group(); j.position.set(s * .12, .85, 0); g.add(j); const l = new THREE.Mesh(new THREE.CapsuleGeometry(.1, .62, 4, 8), S); l.position.y = -.4; j.add(l); const b = new THREE.Mesh(new THREE.BoxGeometry(.16, .14, .3), D); b.position.set(0, -.8, -.05); j.add(b); return j; });
  const arms = [-1, 1].map(s => { const j = new THREE.Group(); j.position.set(s * .3, 1.4, 0); g.add(j); const a = new THREE.Mesh(new THREE.CapsuleGeometry(.07, .5, 4, 8), S); a.position.y = -.3; j.add(a); return j; });
  const axe = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .8, 6), D); axe.position.y = -.65; arms[1].add(axe);
  g.userData = { legs, arms, tank, mask }; scene.add(g); return g; }
function walk(C, ph, amp = .35) { C.userData.legs.forEach((j, i) => j.rotation.x = Math.sin(ph + i * Math.PI) * amp); C.userData.arms.forEach((j, i) => j.rotation.x = -Math.sin(ph + i * Math.PI) * amp * .8); }
const climbers = [0, 1, 2, 3, 4].map(i => makeClimber([0xd9452a, 0xf2b02a, 0x2a7ad9, 0x3aa84a, 0xd9452a][i]));

// ==========================================================================
// FRASCOS DE AIRE (moléculas), VASO SANGUÍNEO, ADN
// ==========================================================================
const JAR = V3(0, 500, 0); const jars = new THREE.Group(); jars.position.copy(JAR); scene.add(jars);
const glassM = new THREE.MeshStandardMaterial({ color: 0xbfe6ff, transparent: true, opacity: .12, roughness: .1, side: THREE.DoubleSide, depthWrite: false });
for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(3, 4.6, 3), glassM); b.position.set(s * 1.9, 0, 0); jars.add(b); const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(3, 4.6, 3)), new THREE.LineBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: .5 })); e.position.copy(b.position); jars.add(e); }
const BV = V3(0, 800, 0); const vessel = new THREE.Group(); vessel.position.copy(BV); scene.add(vessel);
{ const t = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 40, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0x8a1a22, roughness: .6, side: THREE.BackSide, emissive: 0x2a0406 })); t.rotation.z = Math.PI / 2; vessel.add(t); }
const cellGeo = (() => { const g = new THREE.TorusGeometry(.32, .16, 10, 24); return g; })(); const cellM = M(0xd2232e, { emissive: 0x3a0306, roughness: .4 });
const cells = new THREE.InstancedMesh(cellGeo, cellM, 400); vessel.add(cells);
const DNA = V3(0, 1100, 0); const dna = new THREE.Group(); dna.position.copy(DNA); scene.add(dna);
{ const a = M(0xc8743f, { emissive: 0x3a1404, roughness: .35 }), b = M(0x7fd4ff, { emissive: 0x0a2a3a, roughness: .35 }), r = M(0xe8e2d6, { roughness: .5 });
  for (let i = 0; i < 44; i++) { const y = (i - 22) * .34, ang = i * .42; for (const s of [0, 1]) { const ph = ang + s * Math.PI; const m = new THREE.Mesh(new THREE.SphereGeometry(.22, 12, 10), s ? b : a); m.position.set(Math.cos(ph) * 1.3, y, Math.sin(ph) * 1.3); dna.add(m); }
    const rung = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 2.6, 6), i === 22 || i === 23 ? M(0xffd08a, { emissive: 0x806020 }) : r); rung.rotation.z = Math.PI / 2; rung.rotation.y = -ang; rung.position.y = y; dna.add(rung); } }
// aldea sherpa
const VIL = V3(0, -800, 0); const village = new THREE.Group(); village.position.copy(VIL); scene.add(village);
{ const g = new THREE.PlaneGeometry(400, 400, 120, 120); g.rotateX(-Math.PI / 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, (ridged(x * .02, z * .02) - 1) * 6 + Math.max(0, -z - 40) * .25 * (ridged(x * .05, z * .05))); } g.computeVertexNormals(); village.add(new THREE.Mesh(g, M(0x6a6a50, { roughness: .95 })));
  const r = rng(4); for (let i = 0; i < 18; i++) { const h = new THREE.Group(); const w = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 5), M(0xe8e0d0)); w.position.y = 2; h.add(w); const roof = new THREE.Mesh(new THREE.BoxGeometry(6.6, .6, 5.6), M([0x2a5a8a, 0x8a2a2a, 0x3a6a3a][i % 3])); roof.position.y = 4.3; h.add(roof);
    const win = new THREE.Mesh(new THREE.BoxGeometry(1, 1, .1), M(0x2a1a10)); win.position.set(0, 2.4, -2.55); h.add(win); { const hx = (r() - .5) * 70, hz = (r() - .5) * 50; h.position.set(hx, (ridged(hx * .02, hz * .02) - 1) * 6 + Math.max(0, -hz - 40) * .25 * ridged(hx * .05, hz * .05) - .5, hz); } h.rotation.y = (r() - .5) * .6; village.add(h); }
  for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .8), new THREE.MeshStandardMaterial({ color: [0x2a5ad9, 0xf2f2f2, 0xd9302a, 0x3aa84a, 0xf2c02a][i % 5], side: THREE.DoubleSide })); f.position.set(-20 + i * 2, 7 - Math.abs(i - 2.5) * .5, 10); village.add(f); } }
const PS = new Particles(30000, { size: .1, seed: 5 }); scene.add(PS.obj);
const ALL = [terrain, deathPlane, deathRing, ridge, ...climbers, jars, vessel, dna, village];

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
function snow(C, n, t, a, sx = 20, sy = 12, sz = 20, wind = 6) { const s = PS.seed; for (let i = 0; i < n; i++) { const q = ((i + 9000) % PS.n) * 4; const x = C.x + fract(s[q] + t * wind / sx) * sx - sx / 2, y = C.y + fract(s[q + 1] - t * .08) * sy - 2, z = C.z + (s[q + 2] - .5) * sz; PS.push(x, y, z, a, a, a * 1.05); } }
function ecg(x0, y0, w, h, t, bpm, a, col = '#ff5a4a') { if (a <= .01) return; g2.save(); g2.globalAlpha = a; g2.strokeStyle = col; g2.lineWidth = 6; g2.shadowColor = col; g2.shadowBlur = 14; g2.beginPath();
  for (let i = 0; i <= 200; i++) { const x = x0 + i / 200 * w; const tt = t - (1 - i / 200) * 2.2; const ph = fract(tt * bpm / 60); const y = y0 - (ph < .05 ? Math.sin(ph / .05 * Math.PI) * h : ph < .1 ? -Math.sin((ph - .05) / .05 * Math.PI) * h * .3 : Math.sin(Math.max(0, ph - .3) / .2 * Math.PI) * h * .12 * (ph < .5 ? 1 : 0)); i ? g2.lineTo(x, y) : g2.moveTo(x, y); } g2.stroke(); g2.restore(); }

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .01; camera.far = 6000; camera.fov = 42;
  let bloomS = .35, flash = 0, ca = .0012, fade = 0, expo = 1.1;
  PS.begin(); PS.mat.size = .1; for (const o of ALL) o.visible = false; scene.fog.density = .012; scene.fog.color.setRGB(.62, .72, .86); hemi.intensity = 1.6; sun.intensity = 2.8; sun.color.setRGB(1, .95, .86); sky.visible = true; scene.background = null;
  skyMat.uniforms.uTop.value.setRGB(.04, .14, .42); skyMat.uniforms.uHor.value.setRGB(.62, .74, .9); skyMat.uniforms.uSunC.value.setRGB(1, .9, .7); skyMat.uniforms.uSun.value.set(.6, .5, -.6).normalize();
  climbers.forEach(c => { c.userData.tank.visible = true; c.userData.mask.visible = true; c.scale.setScalar(1); });
  for (const c of ['same', 'press', 'die', 'blood', 'slow', 'tank', 'almost', 'messner', 'sherpa', 'live', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = []; let dark = 0;
  const onRidge = (n, t0, spd = .35) => { ridge.visible = true; for (let i = 0; i < n; i++) { const C = climbers[i]; C.visible = true; const z = 6 - i * 3.2 - t0 * spd; C.position.set(CL.x, CL.y - z * .12 * -1 + 0, CL.z + z); C.position.y = CL.y - (-z) * .12 * 0 - z * .12 + .02; C.rotation.set(0, 0, 0); walk(C, t0 * 2.2 + i, .3); } };

  if (t < TL.same) {
    // A · Everest y la zona de la muerte
    terrain.visible = deathPlane.visible = deathRing.visible = true; const u = easeInOut(smooth(0, TL.same, t));
    const ang = lerp(.6, 1.1, u), dist = lerp(26, 17, u); camera.position.set(SUMMIT.x + Math.sin(ang) * dist, lerp(9.5, 9.2, u), SUMMIT.z + Math.cos(ang) * dist); camera.lookAt(SUMMIT.x, lerp(7.2, 7.8, u), SUMMIT.z); camera.fov = 44;
    deathPlane.material.opacity = .22 * smooth(.8, 1.6, t); deathRing.visible = t > .8; snow(camera.position.clone().add(V3(0, 0, 0)), 1500, t, .5, 30, 10, 30, 8); PS.mat.size = .05; scene.fog.density = .008;
    hud.push(() => { two(null, '¿POR QUÉ A MÁS DE 8.000 m', 'LO LLAMAN LA ZONA DE LA MUERTE?', smooth(.05, .3, t), 300); label(V3(SUMMIT.x, SUMMIT.y + .6, SUMMIT.z), 'EVEREST', '8.849 m', smooth(1, 1.4, t), '#ffffff', 40);
      label(V3(SUMMIT.x - 8, 8.0, SUMMIT.z + 2), '8.000 m', null, smooth(1.2, 1.6, t), '#ff7a6a', 36); });
  } else if (t < TL.die) {
    // B · mismo 21 %, presión 3 veces menor
    const lt = t - TL.same; jars.visible = true; sky.visible = false; scene.background = new THREE.Color(.04, .06, .1); scene.fog.density = 0; bloomS = .6;
    const spread = smooth(TL.press + .3, TL.press + 1.6, t); const breath = smooth(TL.third + .3, TL.third + .8, t);
    const s = PS.seed; for (const side of [-1, 1]) { const N = side < 0 ? 600 : Math.round(lerp(600, 200, spread)); for (let i = 0; i < N; i++) { const q = ((i + (side < 0 ? 0 : 1000)) % PS.n) * 4; const ox = (s[q] - .5) * 2.8, oy = (s[q + 1] - .5) * 4.4, oz = (s[q + 2] - .5) * 2.8;
      const jx = Math.sin(t * 3 + i) * .05, jy = Math.cos(t * 2.6 + i * 1.3) * .05; const o2 = s[q + 3] < .21; const p = V3(JAR.x + side * 1.9 + ox + jx, JAR.y + oy + jy, JAR.z + oz); const inB = breath > 0 && Math.hypot(ox, oy + .4) < 1.0;
      const k = inB ? 1.4 : (breath > 0 ? .45 : 1); const c = o2 ? [1.3 * k, .3 * k, .25 * k] : [.35 * k, .6 * k, 1.1 * k]; PS.push(p.x, p.y, p.z, ...c); } }
    PS.mat.size = .24; camera.position.copy(JAR).add(V3(0, .2, 20)); camera.lookAt(JAR); camera.fov = 40;
    hud.push(() => { two(null, 'EN LA CIMA, EL AIRE TIENE', 'EL MISMO OXÍGENO QUE AQUÍ ABAJO', win(t, TL.same, TL.press), 300); two(null, 'EL PROBLEMA ES LA PRESIÓN:', '3 VECES MÁS BAJA', win(t, TL.press, TL.third), 300); two(null, 'EN CADA RESPIRACIÓN TE ENTRA', 'SOLO UN TERCIO DEL OXÍGENO', smooth(TL.third, TL.third + .3, t), 300);
      const l = project(JAR.clone().add(V3(-1.9, -2.8, 0))), r = project(JAR.clone().add(V3(1.9, -2.8, 0))); const a = smooth(.2, .6, lt);
      txt('NIVEL DEL MAR', l.x, l.y + 30, 30, { font: 'Montserrat', weight: 800, alpha: a }); txt('CIMA · 8.849 m', r.x, r.y + 30, 30, { font: 'Montserrat', weight: 800, alpha: a, fill: '#ffb070' });
      const pa = win(t, TL.pct - .1, TL.press + .3); txt('21 % O₂', l.x, l.y + 90, 56, { font: 'Montserrat', weight: 800, alpha: pa, fill: '#ff7a6a' }); txt('21 % O₂', r.x, r.y + 90, 56, { font: 'Montserrat', weight: 800, alpha: pa, fill: '#ff7a6a' });
      const pr = smooth(TL.press + .3, TL.press + .8, t); txt('PRESIÓN', l.x, l.y + 90, 26, { alpha: pr * (1 - pa) , spacing: 5 }); txt('1 atm', l.x, l.y + 150, 60, { font: 'Montserrat', weight: 800, alpha: pr * (1 - pa) }); txt('PRESIÓN', r.x, r.y + 90, 26, { alpha: pr * (1 - pa), spacing: 5 }); txt('⅓ atm', r.x, r.y + 150, 60, { font: 'Montserrat', weight: 800, alpha: pr * (1 - pa), fill: copperGrad(r.x - 100, r.x + 100, r.y + 150, .5) });
      if (breath > 0) for (const side of [-1, 1]) { const c = project(JAR.clone().add(V3(side * 1.9, -.4, 0))), e = project(JAR.clone().add(V3(side * 1.9 + 1, -.4, 0))); g2.save(); g2.globalAlpha = breath; g2.strokeStyle = '#ffffff'; g2.lineWidth = 5; g2.setLineDash([14, 10]); g2.beginPath(); g2.arc(c.x, c.y, e.x - c.x, 0, Math.PI * 2); g2.stroke(); g2.restore(); }
      txt('una respiración', W / 2, 1720, 30, { alpha: breath * .9 }); });
  } else if (t < TL.slow) {
    if (t < TL.blood) {
      // C · el cuerpo se apaga aunque estés quieto
      const lt = t - TL.die; onRidge(1, 0); const C = climbers[0]; walk(C, 0, 0); C.position.set(CL.x, CL.y + .02, CL.z); C.rotation.set(0, .5, 0); C.userData.arms[1].rotation.x = -.3 + Math.sin(t * 1.4) * .05;
      skyMat.uniforms.uTop.value.setRGB(.02, .06, .24); scene.fog.density = .01; snow(CL.clone().add(V3(0, 2, 0)), 3000, t, .8, 24, 10, 20, 9); PS.mat.size = .05;
      camera.position.copy(CL).add(V3(lerp(4.5, 3.5, lt / 3.6), 2.0, lerp(-4.5, -3.5, lt / 3.6))); camera.lookAt(CL.clone().add(V3(0, 1.3, 0))); camera.fov = 45;
      hud.push(() => { two(null, 'TU CUERPO SE VA APAGANDO', 'AUNQUE ESTÉS QUIETO', smooth(.05, .3, lt), 300); ecg(140, 1600, 800, 110, t, 120, smooth(.4, .8, lt)); txt('PULSO', 140, 1470, 28, { spacing: 5, alpha: smooth(.4, .8, lt), align: 'left', fill: '#ff7a6a' }); txt('120', 940, 1470, 56, { font: 'Montserrat', weight: 800, alpha: smooth(.4, .8, lt), align: 'right', fill: '#ff7a6a' }); });
    } else if (t < TL.drunk) {
      // D · sangre espesa · pulmones y cerebro con líquido
      if (t < TL.fluid) { const lt = t - TL.blood; vessel.visible = true; sky.visible = false; scene.background = new THREE.Color(.1, .01, .02); scene.fog.color.setRGB(.25, .02, .04); scene.fog.density = .05; bloomS = .4;
        const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(); const r = PS.seed; const N = 380; for (let i = 0; i < 400; i++) { if (i >= N) { m.makeScale(0, 0, 0); cells.setMatrixAt(i, m); continue; } const k = i * 4; const x = fract(r[k] + t * .05) * 30 - 8, ang = r[k + 1] * 6.28, rr = Math.sqrt(r[k + 2]) * 1.8;
          e.set(r[k + 3] * 6 + t * .5, r[k] * 6, 0); q.setFromEuler(e); m.compose(V3(x, Math.cos(ang) * rr, Math.sin(ang) * rr), q, V3(1, 1, 1)); cells.setMatrixAt(i, m); } cells.instanceMatrix.needsUpdate = true;
        camera.position.copy(BV).add(V3(-15, .3, 0)); camera.lookAt(BV.clone().add(V3(10, 0, 0))); camera.fov = 50;
        hud.push(() => { two(null, 'LA SANGRE', 'SE ESPESA', smooth(.05, .3, lt), 300); txt('más glóbulos rojos · menos agua', W / 2, 1600, 32, { alpha: smooth(.3, .7, lt) }); });
      } else { const lt = t - TL.fluid; sky.visible = false; scene.background = new THREE.Color(.03, .05, .09); dark = 1;
        hud.push(() => { two(null, 'LOS PULMONES Y EL CEREBRO', 'PUEDEN LLENARSE DE LÍQUIDO', smooth(.05, .3, lt), 300); const lv = smooth(.4, 2.2, lt);
          const organ = (cx, cy, draw, name, a) => { g2.save(); g2.globalAlpha = a; g2.translate(cx, cy); g2.lineWidth = 8; g2.strokeStyle = '#ffd0c0'; g2.shadowColor = '#ff9a80'; g2.shadowBlur = 18; draw(); g2.save(); g2.clip(); g2.fillStyle = 'rgba(90,170,255,.55)'; g2.fillRect(-300, 160 - 320 * lv * .8, 600, 400); g2.restore(); g2.stroke(); g2.restore(); txt(name, cx, cy + 230, 34, { font: 'Montserrat', weight: 800, alpha: a, fill: '#ffd0c0' }); };
          organ(W / 2, 760, () => { g2.beginPath(); g2.ellipse(-60, 0, 120, 140, -.15, 0, Math.PI * 2); g2.moveTo(320, 0); g2.ellipse(60, 0, 120, 140, .15, 0, Math.PI * 2); }, 'CEREBRO', smooth(.2, .5, lt));
          organ(W / 2, 1260, () => { g2.beginPath(); g2.moveTo(-20, -150); g2.bezierCurveTo(-200, -160, -220, 120, -160, 170); g2.bezierCurveTo(-90, 200, -30, 140, -20, 60); g2.closePath(); g2.moveTo(20, -150); g2.bezierCurveTo(200, -160, 220, 120, 160, 170); g2.bezierCurveTo(90, 200, 30, 140, 20, 60); g2.closePath(); }, 'PULMONES', smooth(.4, .7, lt)); }); }
    } else {
      // E · pensar cuesta (visión doble, tambaleo)
      const lt = t - TL.drunk; onRidge(3, t - TL.drunk + 3, .25); skyMat.uniforms.uTop.value.setRGB(.02, .06, .24); snow(CL.clone().add(V3(0, 2, -2)), 2500, t, .8, 24, 10, 26, 9); PS.mat.size = .05;
      const wob = smooth(0, .8, lt); camera.position.copy(CL).add(V3(-1.2 + Math.sin(t * 1.7) * .4 * wob, 1.7 + Math.sin(t * 2.3) * .15 * wob, 9)); camera.lookAt(CL.clone().add(V3(Math.sin(t * 1.3) * .8 * wob, 1.2, -4))); camera.up.set(Math.sin(t * 1.1) * .12 * wob, 1, 0); camera.fov = 48; ca = .004 + .01 * wob; bloomS = .5;
      hud.push(() => two(null, 'Y PENSAR CUESTA', 'COMO SI ESTUVIERAS BORRACHO', smooth(.05, .3, lt), 300));
    }
  } else if (t < TL.almost) {
    if (t < TL.tank) {
      // F · aclimatación: subir y bajar entre campamentos
      const lt = t - TL.slow; terrain.visible = true; camera.position.set(SUMMIT.x - 4, 6.5, SUMMIT.z + 24); camera.lookAt(SUMMIT.x - 1, 6.6, SUMMIT.z); camera.fov = 44; scene.fog.density = .006;
      const CAMPS = [['CAMPO BASE', 5364], ['C1', 6065], ['C2', 6400], ['C3', 7162], ['C4', 7950], ['CIMA', 8849]];
      hud.push(() => { two(null, 'POR ESO LOS ALPINISTAS', 'SUBEN DESPACIO', win(t, TL.slow, TL.camps), 300); two(null, 'SEMANAS SUBIENDO Y BAJANDO', 'ENTRE CAMPAMENTOS', smooth(TL.camps, TL.camps + .3, t), 300);
        const x0 = 130, x1 = 950, y0 = 1720, y1 = 1050, alt = h => lerp(y0, y1, (h - 5000) / 3900); const a = smooth(.3, .7, lt);
        g2.save(); g2.globalAlpha = a * .85; g2.fillStyle = 'rgba(8,10,16,.55)'; g2.fillRect(x0 - 40, y1 - 60, x1 - x0 + 80, y0 - y1 + 120); g2.restore();
        for (const [n, h] of CAMPS) { const y = alt(h); g2.save(); g2.globalAlpha = a * .4; g2.strokeStyle = h > 8000 ? '#ff6a4a' : '#ffffff'; g2.lineWidth = 2; g2.setLineDash([8, 8]); g2.beginPath(); g2.moveTo(x0, y); g2.lineTo(x1, y); g2.stroke(); g2.restore(); txt(n, x1, y - 12, 22, { align: 'right', alpha: a * .9, font: 'Montserrat', weight: 800 }); }
        const rot = [5364, 6065, 5364, 6400, 5364, 7162, 6400, 5364, 7950, 8849]; const u = smooth(.6, TL.tank - TL.slow - .2, lt) * (rot.length - 1);
        g2.save(); g2.globalAlpha = a; g2.strokeStyle = '#ffb070'; g2.lineWidth = 7; g2.shadowColor = '#ffb070'; g2.shadowBlur = 12; g2.beginPath(); for (let i = 0; i <= Math.min(u, rot.length - 1) + 1e-6; i += .02) { const k = Math.min(Math.floor(i), rot.length - 2), f = i - k; const x = lerp(x0, x1 - 160, i / (rot.length - 1)), y = alt(lerp(rot[k], rot[k + 1], easeInOut(f))); i ? g2.lineTo(x, y) : g2.moveTo(x, y); } g2.stroke(); g2.restore();
        bar(x0, 960, x1 - x0, lerp(.45, .62, smooth(1, TL.tank - TL.slow, lt)), 'GLÓBULOS ROJOS', `+${Math.round(lerp(0, 40, smooth(1, TL.tank - TL.slow, lt)))} %`, smooth(TL.camps - TL.slow + .8, TL.camps - TL.slow + 1.2, lt), '#ff6a5a'); });
    } else {
      // G · oxígeno embotellado
      const lt = t - TL.tank; onRidge(1, 0); const C = climbers[0]; walk(C, t * 2, .25); C.position.set(CL.x, CL.y, CL.z); C.rotation.set(0, Math.PI + .6, 0); snow(CL.clone().add(V3(0, 2, 0)), 2500, t, .8, 24, 10, 20, 9); PS.mat.size = .05;
      camera.position.copy(CL).add(V3(2.6, 1.9, 4.4)); camera.lookAt(CL.clone().add(V3(0, 1.3, 0))); camera.fov = 42; bloomS = .5;
      hud.push(() => { two(null, 'Y CASI TODOS USAN', 'OXÍGENO EMBOTELLADO', smooth(.05, .3, lt), 300); callout(C.userData.tank.getWorldPosition(V3()), 220, -60, 'OXÍGENO', 'botella + mascarilla', smooth(.4, .8, lt), '#ffb070'); });
    }
  } else if (t < TL.sherpa) {
    // H · casi. Messner y Habeler, 1978, sin oxígeno
    const lt = t - TL.almost; onRidge(2, 0); climbers.slice(0, 2).forEach((C, i) => { C.userData.tank.visible = false; C.userData.mask.visible = false; walk(C, 0, 0); C.position.set(CL.x + (i ? .9 : -.6), CL.y + .05, CL.z + (i ? .4 : -.2)); C.rotation.set(0, .4 + i * .3, 0); C.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); if (t > TL.messner + 1) { C.userData.arms[1].rotation.z = Math.PI * .85 * (i ? -1 : 1); } });
    skyMat.uniforms.uTop.value.setRGB(.02, .08, .3); skyMat.uniforms.uHor.value.setRGB(.9, .78, .62); skyMat.uniforms.uSun.value.set(.8, .15, -.3).normalize(); sun.color.setRGB(1, .82, .62);
    const k = easeInOut(smooth(TL.almost, TL.sherpa, t)); camera.position.copy(CL).add(V3(lerp(2.4, 4.2, k), lerp(1.4, 2.2, k), lerp(-5.5, -7.5, k))); camera.lookAt(CL.clone().add(V3(.2, 1.3, 0))); camera.fov = 44; snow(CL.clone().add(V3(0, 2, 0)), 1000, t, .6, 24, 10, 20, 7); PS.mat.size = .05;
    hud.push(() => { stamp('CASI.', W / 2, 360, win(t, TL.almost, TL.messner + .2), -.06, '#ffb070', 90);
      two('8 DE MAYO DE 1978', 'MESSNER Y HABELER', 'EN LA CIMA SIN OXÍGENO', win(t, TL.messner, TL.doctors + .1), 300); two(null, 'MUCHOS MÉDICOS DECÍAN', 'QUE ERA IMPOSIBLE', smooth(TL.doctors, TL.doctors + .3, t), 300);
      const ia = smooth(TL.doctors + .6, TL.doctors + .9, t); stamp('IMPOSIBLE', W / 2, 1560, ia, -.06, '#ff6a4a', 70); if (ia > .5) { g2.save(); g2.globalAlpha = smooth(TL.doctors + 1.4, TL.doctors + 1.7, t); g2.strokeStyle = '#7fe08a'; g2.lineWidth = 12; g2.shadowColor = '#7fe08a'; g2.shadowBlur = 16; g2.beginPath(); g2.moveTo(W / 2 - 330, 1600); g2.lineTo(W / 2 + 330, 1520); g2.stroke(); g2.restore(); } });
  } else if (t < TL.brand) {
    if (t < TL.live) {
      // I · ADN sherpa
      const lt = t - TL.sherpa; dna.visible = true; sky.visible = false; scene.background = new THREE.Color(.03, .05, .1); scene.fog.density = 0; dna.rotation.set(0, t * .6, .25); bloomS = .6;
      camera.position.copy(DNA).add(V3(0, -.5, 19)); camera.lookAt(DNA); camera.fov = 44;
      hud.push(() => { two(null, 'LOS SHERPAS TIENEN', 'ADAPTACIONES GENÉTICAS', win(t, TL.sherpa, TL.sherpa + 2.6), 300); two(null, 'PARA APROVECHAR MEJOR', 'EL POCO OXÍGENO', smooth(TL.sherpa + 2.6, TL.sherpa + 2.9, t), 300);
        callout(DNA.clone().add(V3(0, 0, 0)), 250, 330, 'GENES DE ALTURA', 'p. ej. EPAS1', smooth(.8, 1.2, lt), '#ffd08a'); });
    } else {
      // J · aldea sherpa al pie del Himalaya
      const lt = t - TL.live; village.visible = true; terrain.visible = true; scene.fog.density = .004; camera.position.copy(VIL).add(V3(lerp(-26, -20, lt / 3), 4, 46)); camera.lookAt(VIL.clone().add(V3(0, 4, -20))); camera.fov = 48;
      terrain.position.set(0, 0, 0);
      hud.push(() => two(null, 'LLEVAN MILES DE AÑOS', 'VIVIENDO ALLÍ ARRIBA', smooth(.05, .3, lt), 300));
    }
  } else {
    // K · marca: atardecer en la cima
    const lt = t - TL.brand; terrain.visible = true; skyMat.uniforms.uTop.value.setRGB(.06, .06, .18); skyMat.uniforms.uHor.value.setRGB(.95, .5, .25); skyMat.uniforms.uSun.value.set(.9, .05, -.4).normalize(); skyMat.uniforms.uSunC.value.setRGB(1.4, .7, .35);
    scene.fog.color.setRGB(.55, .35, .3); scene.fog.density = .01; sun.color.setRGB(1, .6, .35); sun.position.set(80, 6, -40); sun.intensity = 2.2; hemi.intensity = .7;
    camera.position.set(SUMMIT.x - 14, 8.6, SUMMIT.z + 14); camera.lookAt(SUMMIT.x, 7.6, SUMMIT.z); fade = Math.min(.4, lt * .4);
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  if (t < TL.brand) sun.position.set(60, 50, -60);
  sky.position.copy(camera.position); PS.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (t < TL.brand) { const gr = g2.createLinearGradient(0, 0, 0, 600); gr.addColorStop(0, 'rgba(8,10,16,.75)'); gr.addColorStop(.6, 'rgba(8,10,16,.5)'); gr.addColorStop(1, 'rgba(8,10,16,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, W, 600); }
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, bloom: bloomS, expo });
}
function renderCover() { renderFrame(2.4); coverText('LA ZONA DE', 'LA MUERTE', 'qué le pasa a tu cuerpo a 8.000 m'); }
window.renderCover = () => { renderCover(); return true; };
window.OBJ = { PS, scene };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
