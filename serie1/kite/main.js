// NO LO SABÍAS — "Los secretos del kitesurf"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final.
// Datos: la cometa es un perfil alar (sustentación = sobrepresión en el intradós + succión en el extradós).
// Viento aparente: al cruzar la ventana, la cometa alcanza varias veces la velocidad del viento; la fuerza crece con v².
// Ventana de viento: zona de potencia en el centro, borde de la ventana con tracción mínima. Ceñida: canto + aletas ≈ orza.
// Líneas típicas 20–27 m; el viento aumenta con la altura (capa límite). Récords de salto (WOO) por encima de 30 m.
// Tarifa: efecto embudo del Estrecho de Gibraltar (levante/poniente).
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

// Surfista
function makeSurfer() { const g = new THREE.Group(); const board = new THREE.Mesh(new THREE.CapsuleGeometry(.27, 1.6, 6, 16), M(0xf2efe6, { roughness: .35 })); board.rotation.z = Math.PI / 2; board.scale.set(.12, 1, 1); board.position.y = .03; g.add(board);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.9, .065, .05), M(COP)); stripe.position.y = .04; g.add(stripe);
  const suit = M(0x111318, { roughness: .7 }), skin = M(0xc98d6a);
  const body = new THREE.Group(); g.add(body); const legL = new THREE.Mesh(new THREE.CapsuleGeometry(.08, .6, 4, 8), suit); legL.position.set(.35, .45, 0); legL.rotation.z = .5; body.add(legL);
  const legR = legL.clone(); legR.position.set(-.35, .45, 0); legR.rotation.z = -.5; body.add(legR);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.16, .5, 4, 10), suit); torso.position.set(0, 1.05, 0); torso.rotation.z = .25; body.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.12, 12, 10), skin); head.position.set(-.12, 1.5, 0); body.add(head);
  const armL = new THREE.Mesh(new THREE.CapsuleGeometry(.05, .55, 4, 8), suit); armL.position.set(.35, 1.15, .1); armL.rotation.z = 1.2; body.add(armL);
  const armR = armL.clone(); armR.position.set(-.38, 1.1, -.1); armR.rotation.z = -1.1; body.add(armR);
  g.userData = { body, board }; scene.add(g); return g; }
const surfer = makeSurfer();

// ==========================================================================
// COMETA (ala en arco con borde de ataque hinchable) + líneas
// ==========================================================================
function kiteGeo(R = 4.2, span = 1.15, chord = 2.4) { const NS = 40, NC = 12; const pos = [], col = [], idx = [];
  for (let i = 0; i <= NS; i++) { const s = i / NS * 2 - 1; const th = s * span; const c = chord * (1 - .55 * s * s);
    for (let j = 0; j <= NC; j++) { const u = j / NC; const camber = Math.sin(u * Math.PI) * .12 * c; pos.push(R * Math.sin(th), (u - .3) * c, R * (1 - Math.cos(th)) - camber);
      const stripe = Math.abs(s) < .12 ? 1 : (Math.abs(Math.abs(s) - .55) < .06 ? 2 : 0); const cc = stripe === 1 ? [.95, .95, .95] : stripe === 2 ? [.08, .12, .2] : [.85, .38, .14]; col.push(...cc); } }
  for (let i = 0; i < NS; i++) for (let j = 0; j < NC; j++) { const a = i * (NC + 1) + j, b = a + NC + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; }
function makeKite() { const g = new THREE.Group(); const can = new THREE.Mesh(kiteGeo(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .5, side: THREE.DoubleSide })); g.add(can);
  const pts = []; for (let i = 0; i <= 30; i++) { const th = (i / 30 * 2 - 1) * 1.15; pts.push(V3(4.2 * Math.sin(th), -.72 * (1 - .55 * Math.pow(i / 15 - 1, 2)), 4.2 * (1 - Math.cos(th)))); } const le = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, .13, 8), M(0x111827, { roughness: .4 })); g.add(le);
  const tips = [V3(4.2 * Math.sin(1.15), 0, 4.2 * (1 - Math.cos(1.15))), V3(-4.2 * Math.sin(1.15), 0, 4.2 * (1 - Math.cos(1.15))), V3(1.2, 0, .2), V3(-1.2, 0, .2)]; g.userData.tips = tips; scene.add(g); return g; }
const kite = makeKite();
const lineGeo = new THREE.BufferGeometry(); lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(8 * 3), 3)); const lines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: 0x20242c })); lines.frustumCulled = false; scene.add(lines);
const bar_ = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .55, 8), M(0x111111)); scene.add(bar_);
function flyKite(rider, L, az, el, roll = 0, t = 0) { // viento hacia +x; az: 0 = centro de la ventana; el: elevación
  const hand = rider.position.clone().add(V3(.15, 1.15, 0)); const dir = V3(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)); kite.position.copy(hand).add(dir.clone().multiplyScalar(L));
  kite.up.copy(V3(0, 1, 0)); kite.lookAt(hand); kite.rotateZ(roll + Math.PI); kite.updateMatrixWorld(); const p = lineGeo.attributes.position; const bl = [V3(0, 0, .27), V3(0, 0, -.27), V3(0, 0, .06), V3(0, 0, -.06)];
  kite.userData.tips.forEach((tp, i) => { const w = tp.clone().applyMatrix4(kite.matrixWorld); p.setXYZ(i * 2, w.x, w.y, w.z); const b = hand.clone().add(bl[i]); p.setXYZ(i * 2 + 1, b.x, b.y, b.z); }); p.needsUpdate = true; bar_.position.copy(hand); bar_.rotation.set(Math.PI / 2, 0, 0); lines.visible = kite.visible = bar_.visible = true; }

// ==========================================================================
// PERFIL ALAR (corte)
// ==========================================================================
const FOIL = V3(0, 600, 0); const foil = new THREE.Group(); foil.position.copy(FOIL); scene.add(foil);
const foilY = (x, up) => { const t = .14, c = .06; const yt = 5 * t * (.2969 * Math.sqrt(x) - .126 * x - .3516 * x * x + .2843 * x ** 3 - .1015 * x ** 4); const yc = c * (x < .4 ? (2 * .4 * x - x * x) / .16 : ((1 - .8) + 2 * .4 * x - x * x) / .36); return yc + (up ? yt : -yt); };
{ const s = new THREE.Shape(); const N = 60; for (let i = 0; i <= N; i++) { const x = 1 - i / N; const p = [x * 8 - 4, foilY(x, true) * 8]; i ? s.lineTo(...p) : s.moveTo(...p); } for (let i = 1; i <= N; i++) { const x = i / N; s.lineTo(x * 8 - 4, foilY(x, false) * 8); }
  const g = new THREE.ExtrudeGeometry(s, { depth: 1.2, bevelEnabled: false, curveSegments: 1 }); g.translate(0, 0, -.6); foil.add(new THREE.Mesh(g, M(0xd9662a, { roughness: .4, emissive: 0x3a1004 }))); }
// Avión para la comparación
const plane = new THREE.Group(); { const wm = M(0xaab2be, { roughness: .6 }); const f = new THREE.Mesh(new THREE.CapsuleGeometry(.8, 9, 6, 16), wm); f.rotation.z = Math.PI / 2; plane.add(f); const w = new THREE.Mesh(new THREE.BoxGeometry(2.2, .16, 13), wm); w.position.x = .4; plane.add(w); const tl = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, .16), M(COP)); tl.position.set(-4.6, 1.4, 0); plane.add(tl); } foil.add(plane);

// ==========================================================================
// VENTANA DE VIENTO (cúpula coloreada)
// ==========================================================================
const winDome = (() => { const g = new THREE.SphereGeometry(1, 64, 32, -Math.PI / 2, Math.PI, 0, Math.PI / 2); const p = g.attributes.position; const c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const v = V3(p.getX(i), p.getY(i), p.getZ(i)); const k = clamp(V3(0, 0, 1).dot(v)); const col = k > .7 ? [1, .25, .15] : k > .35 ? [1, .75, .2] : [.3, .9, .45]; c.set(col.map(q => q * lerp(.6, 1, k)), i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.rotateY(Math.PI / 2); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: .32, side: THREE.DoubleSide, depthWrite: false, fog: false })); scene.add(m); return m; })();

// ==========================================================================
// EDIFICIO (comparación del salto) y ESTRECHO DE GIBRALTAR
// ==========================================================================
const building = new THREE.Group(); { for (let i = 0; i < 10; i++) { const fl = new THREE.Mesh(new THREE.BoxGeometry(8, 2.9, 6), M(i % 2 ? 0xd8d0c0 : 0xcac2b2, { roughness: .8 })); fl.position.y = 1.5 + i * 3; building.add(fl);
  for (let k = 0; k < 3; k++) { const wdw = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.4), M(0x2a4a6a, { emissive: 0x0a1a2a, roughness: .2 })); wdw.position.set(-2.5 + k * 2.5, 1.6 + i * 3, 3.01); building.add(wdw); } } } scene.add(building);
const MAP = V3(0, -600, 0); const map = new THREE.Group(); map.position.copy(MAP); scene.add(map);
const SP = [[-80, 34], [-40, 18], [-28, 10], [-18, 5], [-10, 3.5], [-4, 3], [2, 3.4], [8, 4.5], [14, 8], [24, 9], [40, 16], [80, 24], [80, 90], [-80, 90]];
const MO = [[-80, -60], [-40, -30], [-28, -14], [-18, -6], [-10, -3.8], [-4, -3.4], [2, -3.4], [8, -5], [14, -6], [24, -12], [40, -14], [80, -16], [80, -90], [-80, -90]];
const strait = x => { const f = pts => { for (let i = 0; i < 11; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; if (x >= x0 && x <= x1) return lerp(y0, y1, (x - x0) / (x1 - x0)); } return pts[0][1]; }; return [f(MO), f(SP)]; };
for (const [pts, col] of [[SP, 0xb8a27a], [MO, 0xc4a070]]) { const s = new THREE.Shape(); pts.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: 1.6, bevelEnabled: true, bevelThickness: .3, bevelSize: .4, bevelSegments: 2 }); g.rotateX(-Math.PI / 2); map.add(new THREE.Mesh(g, M(col, { roughness: .9 }))); }
{ const sea = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), M(0x1a5f8a, { roughness: .3, emissive: 0x041828 })); sea.rotation.x = -Math.PI / 2; sea.position.y = .2; map.add(sea); }

// Partículas
const PS = new Particles(30000, { size: .1, seed: 5 }); scene.add(PS.obj);
const ALL = [ocean, surfer, kite, lines, bar_, foil, winDome, building, map];
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
function windStreaks(C, n, t, a, sx = 60, sy = 20, sz = 40, speed = 30, y0 = 1) { const s = PS.seed; for (let i = 0; i < n; i++) { const q = i * 4; const u = fract(s[q] + t * speed / sx); const x = C.x + (u - .5) * sx, y = C.y + y0 + s[q + 1] * sy, z = C.z + (s[q + 2] - .5) * sz; const f = a * smooth(0, .1, u) * (1 - smooth(.9, 1, u)) * .7;
  for (let k = 0; k < 4; k++) PS.push(x - k * .35, y, z, f * (1 - k * .2), f * (1 - k * .2), f * (1 - k * .2) * 1.05); } }

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .05; camera.far = 6000; camera.fov = 42;
  let bloomS = .4, flash = 0, ca = .0012, fade = 0, expo = 1.15;
  PS.begin(); PS.mat.size = .1; for (const o of ALL) o.visible = false; scene.fog.density = .004; scene.fog.color.setRGB(.68, .8, .9); hemi.intensity = 1.8; sun.intensity = 2.6; sun.color.setRGB(1, .95, .86);
  skyMat.uniforms.uTop.value.setRGB(.12, .34, .72); skyMat.uniforms.uHor.value.setRGB(.72, .84, .94); skyMat.uniforms.uSunC.value.setRGB(1, .9, .7); skyMat.uniforms.uSun.value.set(.5, .4, .8).normalize(); building.scale.setScalar(1); surfer.scale.setScalar(1);
  for (const c of ['wing', 'lift', 'why', 'window', 'back', 'lines', 'jump', 'spain', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];
  const ride = (tt, spd = 9, H0 = .35) => { ocean.visible = true; surfer.visible = true; setWaves([{ dir: .3, A: H0, L: 12, Q: .6 }, { dir: 1.2, A: H0 * .5, L: 6 }, { dir: 2.2, A: H0 * .3, L: 3.5 }]); const z = -tt * spd; oceanUpdate(tt, 0, z, .8, [.02, .2, .32], [.12, .55, .62]);
    const g = gerst(0, z, tt); surfer.position.set(g.x, g.y + .05, g.z); surfer.rotation.set(0, Math.PI / 2, .35); emitJet(PS, surfer.position.clone().add(V3(.3, .05, .6)), V3(.6, .5, .4), 900, tt, 3, 1.4, .5, FOAM, 6); PS.mat.size = .06; return surfer.position.clone(); };

  if (t < TL.wing) {
    // A · kitesurfista y su cometa
    const P = ride(t); flyKite(surfer, 22, -.25 + Math.sin(t * .9) * .15, .55 + Math.sin(t * .7) * .08, 0, t);
    camera.position.copy(P).add(V3(-7, 2.2, -5)); camera.fov = 52; camera.lookAt(P.clone().add(V3(5, 6, 0)));
    hud.push(() => two(null, '¿CÓMO PUEDE UNA COMETA', 'ARRASTRARTE SOBRE EL AGUA?', smooth(.05, .3, t), 300));
  } else if (t < TL.why) {
    // B/C · no es una cometa: es un ala de avión, de lado → el viento empuja y aspira
    const lt = t - TL.wing; foil.visible = true; scene.fog.density = 0; skyMat.uniforms.uTop.value.setRGB(.05, .12, .3); skyMat.uniforms.uHor.value.setRGB(.2, .35, .55);
    const k = easeInOut(smooth(TL.wing + 1.4, TL.wing + 2.8, t)); plane.visible = k < 1; plane.position.set(0, lerp(0, -14, k), -6); plane.rotation.set(lerp(0, Math.PI / 2, smooth(TL.wing + .4, TL.wing + 1.4, t)), lerp(-.5, 0, k), 0); foil.children[0].visible = true; foil.children[0].scale.setScalar(easeOut(smooth(TL.wing + 1.6, TL.wing + 2.6, t)) + .001);
    foil.rotation.set(0, 0, lerp(0, Math.PI / 2 - .25, smooth(TL.wing + 2.6, TL.wing + 3.4, t)) * 0 + -.18);
    camera.position.copy(FOIL).add(V3(0, 0, 24)); camera.lookAt(FOIL); bloomS = .25;
    const fa = smooth(TL.lift - .4, TL.lift + .4, t); if (fa > 0) { const s = PS.seed; for (let i = 0; i < 9000; i++) { const q = i * 4; const u = fract(s[q] + t * .45); const x = lerp(-9, 9, u); const lane = (s[q + 1] - .5) * 9; const xf = (x + 4) / 8; const inF = xf > 0 && xf < 1;
        let y = lane; if (inF) { const up = foilY(xf, true) * 8, lo = foilY(xf, false) * 8; y = lane > 0 ? Math.max(lane, up + .15 + lane * .3) : Math.min(lane, lo - .15 + lane * .3); } else if (xf <= 0) y = lane + Math.exp(-xf * xf * 30) * .3; 
        const rot = -.18; const X = x * Math.cos(rot) - y * Math.sin(rot), Y = x * Math.sin(rot) + y * Math.cos(rot); const top = lane > 0; const f = fa * .9 * smooth(0, .05, u) * (1 - smooth(.95, 1, u)); PS.push(FOIL.x + X, FOIL.y + Y, FOIL.z + 1, top ? f * .6 : f * 1.4, top ? f * .9 : f * .8, top ? f * 1.6 : f * .5); } PS.mat.size = .07; }
    hud.push(() => { two(null, 'NO ES UNA COMETA:', 'ES UN ALA', win(t, TL.wing, TL.lift), 300); txt('como la de un avión… pero de lado', W / 2, 430, 36, { alpha: win(t, TL.wing + .8, TL.lift) });
      const la = smooth(TL.lift, TL.lift + .3, t); two(null, 'EL VIENTO LA EMPUJA…', 'Y ADEMÁS LA ASPIRA', la, 300);
      if (la > 0) { const c = project(FOIL.clone().add(V3(-.5, 0, 1))); arrowXY(c.x - 10, c.y + 330, c.x - 10, c.y + 90, smooth(TL.lift + .3, TL.lift + .8, t), '#ff9a5a', 16); txt('EMPUJA', c.x + 120, c.y + 260, 36, { font: 'Montserrat', weight: 800, alpha: smooth(TL.lift + .3, TL.lift + .8, t), fill: '#ff9a5a' });
        arrowXY(c.x - 10, c.y - 100, c.x - 10, c.y - 330, smooth(TL.lift + 1.2, TL.lift + 1.7, t), '#7fb4ff', 16); txt('ASPIRA', c.x + 120, c.y - 260, 36, { font: 'Montserrat', weight: 800, alpha: smooth(TL.lift + 1.2, TL.lift + 1.7, t), fill: '#7fb4ff' }); } });
  } else if (t < TL.back) {
    if (t < TL.window) {
      // D · la cometa cruza el cielo: más rápida que el viento → fuerza ×
      const lt = t - TL.why; const P = ride(t); const ph = lt * 1.3; const az = Math.sin(ph) * .75, el = .35 + Math.sin(ph * 2) * .12; flyKite(surfer, 22, az, el, -Math.cos(ph) * .6, t);
      camera.position.copy(P).add(V3(-9, 4, 0)); camera.fov = 58; camera.lookAt(P.clone().add(V3(10, 9, 0)));
      const vk = Math.abs(Math.cos(ph)) * 3 + .4; windStreaks(P.clone().add(V3(5, 0, 0)), 900, t, .8, 50, 18, 40, 25);
      hud.push(() => { two(null, '¿Y POR QUÉ LA MUEVEN', 'SIN PARAR?', win(t, TL.why, TL.fast), 300); two(null, 'AL CRUZAR EL CIELO VA MÁS', 'RÁPIDO QUE EL VIENTO', win(t, TL.fast, TL.mult), 300);
        const a = smooth(TL.fast + .3, TL.fast + .7, t); txt('VIENTO', 170, 1520, 30, { font: 'Montserrat', weight: 800, alpha: a, align: 'left', fill: '#9fd0ff' }); arrowXY(170, 1570, 170 + 180, 1570, a, '#9fd0ff', 12); txt('COMETA', 170, 1660, 30, { font: 'Montserrat', weight: 800, alpha: a, align: 'left', fill: '#ffb070' }); arrowXY(170, 1710, 170 + 180 * vk, 1710, a, '#ffb070', 12);
        two(null, 'Y SU FUERZA', 'SE MULTIPLICA', smooth(TL.mult, TL.mult + .3, t), 300); bar(140, 1820, 800, clamp(vk * vk / 12), 'FUERZA', '×' + (vk * vk).toFixed(1), smooth(TL.mult, TL.mult + .3, t), '#ff8a5a'); });
    } else {
      // E · la ventana de viento
      const lt = t - TL.window; const P = ride(t, 2); winDome.visible = true; winDome.position.copy(P).add(V3(.15, 1.15, 0)); winDome.scale.setScalar(22);
      const az = lerp(-1.45, 0, easeInOut(smooth(TL.zones + .3, TL.zones + 2.2, t))), el = lerp(.15, .3, smooth(TL.zones + .3, TL.zones + 2.2, t)); flyKite(surfer, 22, az, el, 0, t);
      camera.position.copy(P).add(V3(-46, 26, 44)); camera.fov = 56; camera.lookAt(P.clone().add(V3(4, 9, 0)));
      hud.push(() => { two(null, 'LO LLAMAN LA', 'VENTANA DE VIENTO', smooth(.05, .3, lt), 300); const C0 = P.clone().add(V3(18, 8, 0)), E0 = P.clone().add(V3(2, 5, -20)); label(C0, 'CENTRO', 'tira con todo', smooth(TL.zones, TL.zones + .3, t), '#ff6a4a', 44); label(E0, 'BORDE', 'casi nada', smooth(TL.zones + .9, TL.zones + 1.2, t), '#7fe08a', 44); });
    }
  } else if (t < TL.jump) {
    if (t < TL.lines) {
      // F · ceñir: volver a la playa con viento de tierra
      const lt = t - TL.back; ocean.visible = true; setWaves([{ dir: .3, A: .2, L: 10 }]); oceanUpdate(t, 0, 0, .9, [.02, .2, .32], [.12, .55, .62]); scene.fog.density = .002;
      const sand = building; sand.visible = false; surfer.scale.setScalar(3.5); camera.position.set(-2, 80, 18); camera.up.set(1, 0, 0); camera.lookAt(-2, 0, 0); camera.fov = 50;
      const u = smooth(TL.edge, TL.lines - .3, t); const path = []; for (let i = 0; i <= 5; i++) path.push(V3(lerp(26, -26, i / 5), .2, (i % 2 ? 1 : -1) * 13 * (i ? 1 : 0))); const seg = u * 5; const si = Math.min(4, Math.floor(seg)); const pp = path[si].clone().lerp(path[si + 1], seg - si);
      surfer.visible = t > TL.edge - .3; surfer.position.copy(pp); surfer.rotation.set(0, Math.atan2(path[si + 1].x - path[si].x, path[si + 1].z - path[si].z) - Math.PI / 2, 0); emitJet(PS, pp.clone(), V3(1, .3, 0), 500, t, 2, 1, .5, FOAM, 3);
      for (let i = 0; i <= si; i++) { const a = path[i], b = i < si ? path[i + 1] : pp; for (let k = 0; k <= 40; k++) { const q = a.clone().lerp(b, k / 40); PS.push(q.x, .3, q.z, 1.2, 1.2, 1.3); } }
      windStreaks(V3(0, 0, 0), 600, t, .9, 70, 2, 50, 18, .5); PS.mat.size = .35;
      const beach = new THREE.Vector3(-34, 0, 0); hud.push(() => { two(null, '¿Y CÓMO VUELVEN A LA PLAYA', 'SI EL VIENTO SOPLA HACIA FUERA?', win(t, TL.back, TL.edge), 300); two(null, 'LA TABLA CLAVA EL CANTO', 'COMO LA QUILLA DE UN VELERO', smooth(TL.edge, TL.edge + .3, t), 300);
        const b0 = project(V3(-30, 0, 0)); g2.save(); g2.fillStyle = '#e2c896'; g2.globalAlpha = .95; g2.fillRect(0, b0.y, W, H - b0.y); g2.restore(); txt('PLAYA', W / 2, b0.y + 80, 40, { font: 'Montserrat', weight: 800, fill: '#5a4020' });
        const a = smooth(TL.back + .3, TL.back + .7, t); const w0 = project(V3(-20, 0, 15)), w1 = project(V3(10, 0, 15)); arrowXY(w0.x, w0.y, w1.x, w1.y, a, '#9fd0ff', 14); txt('VIENTO', (w0.x + w1.x) / 2 + 90, (w0.y + w1.y) / 2, 30, { font: 'Montserrat', weight: 800, alpha: a, fill: '#9fd0ff' });
        stamp('CASI CONTRA EL VIENTO', W / 2, 520, smooth(TL.edge + 2.4, TL.edge + 2.7, t), -.04, '#7fe08a', 44); });
    } else {
      // G · líneas de 25 m: arriba el viento es más fuerte
      const lt = t - TL.lines; const P = ride(t, 6); flyKite(surfer, 25, .1, .75, 0, t); camera.position.copy(P).add(V3(4, 8, 34)); camera.fov = 52; camera.lookAt(P.clone().add(V3(6, 10, 0)));
      for (let h = 0; h < 7; h++) { const y = 1 + h * 3.6; const len = 2 + Math.pow(y / 25, .35) * 9; const p0 = P.clone().add(V3(-12, y, 0)); for (let k = 0; k < 60; k++) { const q = p0.clone().add(V3(len * k / 60, 0, 0)); PS.push(q.x, q.y, q.z, .8, 1.1, 1.5); } }
      windStreaks(P.clone().add(V3(0, 0, 0)), 500, t, .6, 60, 26, 10, 26); PS.mat.size = .14;
      hud.push(() => { two(null, 'LAS LÍNEAS MIDEN', 'UNOS 25 METROS', smooth(.05, .3, lt), 300); const a = project(P.clone().add(V3(.15, 1.15, 0))), b = project(kite.position); g2.save(); g2.globalAlpha = smooth(.4, .8, lt); g2.strokeStyle = '#ffe2c0'; g2.setLineDash([10, 10]); g2.lineWidth = 3; g2.beginPath(); g2.moveTo(a.x + 60, a.y); g2.lineTo(b.x + 60, b.y); g2.stroke(); g2.restore();
        txt('25 m', (a.x + b.x) / 2 + 120, (a.y + b.y) / 2, 50, { font: 'Montserrat', weight: 800, alpha: smooth(.4, .8, lt), fill: '#ffe2c0' }); txt('ARRIBA: MÁS VIENTO Y MÁS LIMPIO', W / 2, 1700, 34, { font: 'Montserrat', weight: 800, alpha: smooth(1.8, 2.2, lt), fill: '#9fd0ff' }); });
    }
  } else if (t < TL.spain) {
    // H · saltos de más de 30 m (un edificio de 10 plantas)
    const lt = t - TL.jump; ocean.visible = true; setWaves([{ dir: .3, A: .35, L: 12, Q: .6 }, { dir: 1.2, A: .18, L: 6 }]); oceanUpdate(t, 0, 0, .8, [.02, .2, .32], [.12, .55, .62]); surfer.visible = true;
    const jt = clamp((t - TL.high + .4) / (TL.spain - TL.high + .2)); const hgt = jt < .45 ? 31 * Math.sin(jt / .45 * Math.PI / 2) : 31 * (1 - Math.pow((jt - .45) / .55, 1.6)); surfer.position.set(0, Math.max(.05, hgt), lerp(14, -14, jt)); surfer.rotation.set(0, Math.PI / 2, jt < .45 ? jt * 3 : .2);
    flyKite(surfer, 22, -.05, 1.25 - .3 * (1 - jt), 0, t); building.visible = true; building.position.set(14, 0, -24); surfer.scale.setScalar(2); camera.position.set(-56, 20, 34); camera.fov = 56; camera.lookAt(4, 22, -6);
    if (jt > .95 || jt < .05) emitJet(PS, surfer.position.clone(), V3(0, 1, 0), 800, t, 4, 3, .6, FOAM, 6); PS.mat.size = .1;
    hud.push(() => { two(null, '¿Y LOS SALTOS?', null, win(t, TL.jump, TL.high), 300); two(null, 'LOS MEJORES PASAN', 'DE 30 METROS', win(t, TL.high, TL.glide), 300); two(null, 'Y BAJAN', 'PLANEANDO', smooth(TL.glide, TL.glide + .3, t), 300);
      label(V3(14, 33, -21), '10 PLANTAS', null, smooth(TL.high + .8, TL.high + 1.2, t), '#ffe2c0', 40); bigStat('ALTURA', Math.round(hgt) + ' m', 1680, smooth(TL.high, TL.high + .3, t), .5); });
  } else if (t < TL.brand) {
    // I · Tarifa: el Estrecho encajona el viento
    const lt = t - TL.spain; map.visible = true; scene.fog.density = 0; skyMat.uniforms.uTop.value.setRGB(.05, .1, .2); skyMat.uniforms.uHor.value.setRGB(.15, .25, .4);
    camera.position.copy(MAP).add(V3(0, lerp(150, 125, easeInOut(clamp(lt / 9))), 36)); camera.lookAt(MAP.clone().add(V3(0, 0, 2))); camera.fov = 44;
    const a = smooth(TL.tarifa, TL.tarifa + .6, t); const s = PS.seed; for (let i = 0; i < 6000; i++) { const q = i * 4; const u = fract(s[q] + t * .22 * (1 + .0 * s[q + 1])); const x = lerp(45, -45, u); const [lo, hi] = strait(x); const w = hi - lo; const v = s[q + 1]; const z = -(lo + .6 + v * (w - 1.2)); const f = a * smooth(0, .05, u) * (1 - smooth(.95, 1, u)) * lerp(.6, 1.6, clamp(3 / Math.max(w, 3)));
      PS.push(MAP.x + x, MAP.y + 2.2 + s[q + 2] * 1, MAP.z + z, f * .7, f * 1, f * 1.4); } PS.mat.size = .9; bloomS = .6;
    hud.push(() => { two(null, '¿Y EN ESPAÑA?', null, win(t, TL.spain, TL.tarifa), 300); two('TARIFA', 'EL ESTRECHO ENCAJONA', 'EL VIENTO', smooth(TL.tarifa, TL.tarifa + .3, t), 300);
      label(MAP.clone().add(V3(-6, 2, -26)), 'ESPAÑA', null, smooth(TL.spain + .2, TL.spain + .6, t), '#ffe2c0', 40); label(MAP.clone().add(V3(6, 2, 26)), 'MARRUECOS', null, smooth(TL.spain + .4, TL.spain + .8, t), '#ffe2c0', 40);
      callout(MAP.clone().add(V3(-1, 2, -3)), -60, -200, 'TARIFA', 'de lo más ventoso de Europa', smooth(TL.tarifa + 1, TL.tarifa + 1.4, t), '#ffb070'); });
  } else {
    // J · marca: atardecer
    const lt = t - TL.brand; const P = ride(t, 6, .25); flyKite(surfer, 22, -.3, .5, 0, t); skyMat.uniforms.uTop.value.setRGB(.06, .06, .16); skyMat.uniforms.uHor.value.setRGB(.95, .45, .2); skyMat.uniforms.uSun.value.set(1, .06, .25).normalize(); skyMat.uniforms.uSunC.value.setRGB(1.4, .6, .3);
    scene.fog.color.setRGB(.6, .32, .2); sun.color.setRGB(1, .55, .3); sun.intensity = 1.4; hemi.intensity = .7; camera.position.copy(P).add(V3(-14, 2.5, -9)); camera.lookAt(P.clone().add(V3(10, 8, 3))); fade = Math.min(.4, lt * .4);
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  sky.position.copy(camera.position); PS.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, bloom: bloomS, expo });
}
function renderCover() { renderFrame(TL.high + 1.0); coverText('LOS SECRETOS', 'DEL KITESURF', 'lo que pasa cuando el viento tira'); }
window.renderCover = () => { renderCover(); return true; };
window.OBJ = { PS, scene };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
