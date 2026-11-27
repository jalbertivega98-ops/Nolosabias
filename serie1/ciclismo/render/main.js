// NO LO SABÍAS — "Los secretos del ciclismo"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final.
// Datos: a >30 km/h, ~80–90 % de la resistencia es aerodinámica. A rueda: ahorro ~30 %; en mitad del pelotón,
// hasta un 90–95 % menos de arrastre (Blocken et al., 2018). Piernas depiladas: ~7 % menos de arrastre en túnel,
// ~1 min 19 s en 40 km (test de Specialized, 2014). Tour: 5 000–8 000 kcal en etapas duras. Induráin: ~28 ppm en reposo.
// Esprint: picos de ~1 800–2 000 W. Bajadas: >100 km/h con neumáticos de ~25–28 mm.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3,
  g2, camera, Particles, txt, copperGrad, project, callout, bar, fract, emitJet, arrowXY, bigStat, drawBrand, coverText, finish } from '../../lib/core.js';

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(new THREE.Color(.62, .72, .82), .006);
const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uTop: { value: new THREE.Color(.16, .36, .7) }, uHor: { value: new THREE.Color(.75, .84, .92) }, uSun: { value: V3(.4, .35, -1).normalize() }, uSunC: { value: new THREE.Color(1, .9, .7) } },
  vertexShader: `varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 uTop,uHor,uSunC,uSun; varying vec3 vD; void main(){ vec3 d=normalize(vD); float y=clamp(d.y,0.,1.); vec3 c=mix(uHor,uTop,pow(y,.5)); float s=max(dot(d,uSun),0.); c+=uSunC*(pow(s,30.)*.5+smoothstep(.9992,.9996,s)*2.); gl_FragColor=vec4(c,1.); }` });
const sky = new THREE.Mesh(new THREE.SphereGeometry(2800, 32, 16), skyMat); sky.renderOrder = -1; scene.add(sky);
const hemi = new THREE.HemisphereLight(0xe8f2ff, 0x4a4438, 1.5); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1dc, 2.6); sun.position.set(30, 40, 20); scene.add(sun);
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .6, ...o });
const COP = 0xc8743f; const UPV = V3(0, 1, 0);

// ==========================================================================
// CICLISTA (bici + cuerpo con pedaleo por cinemática inversa)
// ==========================================================================
const tyreMat = M(0x141416, { roughness: .8 }), frameMats = [0x1c2a44, 0xc8743f, 0xe8e8ea, 0x222226, 0xb02a2a], skinMat = M(0xc98d6a, { roughness: .65 }), shortsMat = M(0x111114, { roughness: .7 });
const JERSEY = [0xe0a030, 0x2a5fc0, 0xd03a2a, 0x1a8a5a, 0xf2f2f2, 0x6a2a9a, 0x101012, 0xe06a20, 0x2ab0c0, 0xd8d040];
function cyl(r, mat) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 10), mat); m.userData.r = r; return m; }
function between(m, a, b) { const d = b.clone().sub(a); const L = d.length(); m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(UPV, d.normalize()); m.scale.set(1, L, 1); }
function bikeWheel() { const g = new THREE.Group(); const tyre = new THREE.Mesh(new THREE.TorusGeometry(.335, .014, 8, 48), tyreMat); g.add(tyre);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.31, .02, 6, 40), M(0x202024, { metalness: .5, roughness: .4 })); g.add(rim);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .1, 10), M(0x888a90, { metalness: .7 })); hub.rotation.x = Math.PI / 2; g.add(hub);
  for (let i = 0; i < 9; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(.61, .006, .006), M(0x9a9ca0, { metalness: .7 })); s.rotation.z = i * Math.PI / 9; g.add(s); } return g; }
function makeRider(seed = 1) {
  const r = rng(seed); const root = new THREE.Group(); const jm = M(JERSEY[seed % JERSEY.length], { roughness: .55 }); const fm = M(frameMats[seed % frameMats.length], { roughness: .3, metalness: .3 });
  const wR = bikeWheel(), wF = bikeWheel(); wR.position.set(-.41, .34, 0); wF.position.set(.59, .34, 0); root.add(wR, wF);
  const BB = V3(0, .28, 0), ST = V3(-.2, .9, 0), HT = V3(.5, .82, 0), HB = V3(.47, .66, 0), RA = V3(-.41, .34, 0), FA = V3(.59, .34, 0);
  for (const [a, b] of [[BB, ST], [BB, HB], [ST, HT], [BB, RA], [ST, RA], [HT, FA]]) { const m = cyl(.02, fm); between(m, a, b); root.add(m); }
  const saddle = new THREE.Mesh(new THREE.BoxGeometry(.26, .04, .1), M(0x111111)); saddle.position.set(-.22, .93, 0); root.add(saddle);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .42, 8), M(0x111111)); bar.rotation.x = Math.PI / 2; bar.position.set(.58, .86, 0); root.add(bar);
  const stem = cyl(.018, M(0x111111)); between(stem, HT, V3(.58, .86, 0)); root.add(stem);
  const body = new THREE.Group(); root.add(body);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.15, .42, 4, 10), jm); body.add(torso);
  const head = new THREE.Group(); const skull = new THREE.Mesh(new THREE.SphereGeometry(.1, 14, 10), skinMat); head.add(skull);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(.125, 16, 10, 0, Math.PI * 2, 0, Math.PI / 1.9), M(JERSEY[(seed * 3 + 1) % JERSEY.length], { roughness: .3 })); helmet.scale.set(1.25, 1, 1); helmet.position.set(-.02, .02, 0); head.add(helmet);
  const glasses = new THREE.Mesh(new THREE.BoxGeometry(.04, .035, .19), M(0x111111, { metalness: .8, roughness: .1 })); glasses.position.set(.09, 0, 0); head.add(glasses); body.add(head);
  const limbs = {}; for (const s of ['L', 'R']) { limbs['th' + s] = cyl(.07, shortsMat); limbs['sh' + s] = cyl(.05, skinMat); limbs['ua' + s] = cyl(.045, jm); limbs['fa' + s] = cyl(.035, skinMat); limbs['ft' + s] = new THREE.Mesh(new THREE.BoxGeometry(.25, .06, .09), M(0xf2f2f2, { roughness: .4 })); for (const k of ['th', 'sh', 'ua', 'fa', 'ft']) body.add(limbs[k + s]); }
  const crank = new THREE.Group(); crank.position.copy(BB); const ring = new THREE.Mesh(new THREE.TorusGeometry(.1, .012, 6, 24), M(0x777a80, { metalness: .8 })); ring.position.z = .06; crank.add(ring); root.add(crank);
  root.userData = { wR, wF, body, torso, head, limbs, crank, ST, phase: r() * 6.283, jm };
  scene.add(root); return root;
}
function ik(hip, foot, l1, l2, bendDir) { const d = foot.clone().sub(hip); const L = Math.min(d.length(), l1 + l2 - 1e-3); const a = Math.acos(clamp((l1 * l1 + L * L - l2 * l2) / (2 * l1 * L), -1, 1)); const dir = d.clone().normalize(); const perp = V3(-dir.y, dir.x, 0).multiplyScalar(bendDir); return hip.clone().add(dir.multiplyScalar(l1 * Math.cos(a))).add(perp.multiplyScalar(l1 * Math.sin(a))); }
function poseRider(R, t, o = {}) { const u = R.userData; const cad = o.cad ?? 1.5; const th = t * cad * 6.283 + u.phase; const lean = o.tuck ?? .55;
  const hip = V3(-.2, .98, 0); const sh = hip.clone().add(V3(Math.cos(lean) * .55, Math.sin(lean) * .55, 0)); const out = o.dance ?? 0;
  u.torso.position.copy(hip).lerp(sh, .5); u.torso.quaternion.setFromUnitVectors(UPV, sh.clone().sub(hip).normalize()); u.head.position.copy(sh).add(V3(.12, .13, 0)); u.head.rotation.z = -.2;
  if (out) { R.userData.body.position.set(.12 * out, .12 * out, 0); R.rotation.x = Math.sin(th) * .12 * out; } else { R.userData.body.position.set(0, 0, 0); }
  for (const [s, z, off] of [['L', .1, 0], ['R', -.1, Math.PI]]) { const a = th + off; const pedal = V3(Math.cos(a) * .17, .28 + Math.sin(a) * .17, z); const hp = hip.clone(); hp.z = z * .9; const knee = ik(V3(hp.x, hp.y, 0), V3(pedal.x, pedal.y, 0), .45, .46, 1); knee.z = z;
    between(u.limbs['th' + s], hp, knee); between(u.limbs['sh' + s], knee, pedal); u.limbs['ft' + s].position.copy(pedal).add(V3(.04, -.02, 0)); u.limbs['ft' + s].rotation.z = Math.sin(a) * .2;
    const shp = sh.clone(); shp.z = z * 1.5; const hand = o.handUp && s === 'R' ? sh.clone().add(V3(.15, .12, -.04)) : V3(.56, .83, z * 1.9); const elbow = ik(V3(shp.x, shp.y, 0), V3(hand.x, hand.y, 0), .29, .3, -1); elbow.z = z * 1.7; between(u.limbs['ua' + s], shp, elbow); between(u.limbs['fa' + s], elbow, hand); }
  u.crank.rotation.z = th; const sp = o.wheelSpin ?? t * 25; u.wR.rotation.z = -sp; u.wF.rotation.z = -sp; }

// ==========================================================================
// CARRETERA Y PAISAJE
// ==========================================================================
const road = new THREE.Group(); scene.add(road);
{ const asph = new THREE.Mesh(new THREE.PlaneGeometry(4000, 9), M(0x6b6f76, { roughness: .92 })); asph.rotation.x = -Math.PI / 2; road.add(asph);
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(4000, 600), M(0x5a7a3a, { roughness: 1 })); grass.rotation.x = -Math.PI / 2; grass.position.y = -.02; road.add(grass);
  for (const z of [-4.3, 4.3]) { const l = new THREE.Mesh(new THREE.PlaneGeometry(4000, .12), M(0xf0f0f0)); l.rotation.x = -Math.PI / 2; l.position.set(0, .01, z); road.add(l); }
  const dash = new THREE.InstancedMesh(new THREE.PlaneGeometry(3, .12), M(0xf0f0f0), 700); const d = new THREE.Object3D(); for (let i = 0; i < 700; i++) { d.position.set(-2000 + i * 6, .012, 0); d.rotation.x = -Math.PI / 2; d.updateMatrix(); dash.setMatrixAt(i, d.matrix); } road.add(dash);
  const trees = new THREE.InstancedMesh(new THREE.ConeGeometry(1.6, 5, 7), M(0x2f5a2a, { roughness: 1 }), 500); const r = rng(4); for (let i = 0; i < 500; i++) { const side = r() < .5 ? -1 : 1; d.position.set(-2000 + r() * 4000, 2.5, side * (12 + r() * 120)); d.rotation.set(0, 0, 0); d.scale.setScalar(.7 + r() * .8); d.updateMatrix(); trees.setMatrixAt(i, d.matrix); } road.add(trees);
  const hills = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), M(0x6a8a5a, { roughness: 1 })); hills.scale.set(500, 90, 200); hills.position.set(0, -40, -520); road.add(hills); }

// Pelotón
const NP = 36; const riders = []; for (let i = 0; i < NP; i++) riders.push(makeRider(i * 3 + 1));
const PEL = (() => { const r = rng(21); const out = []; for (let i = 0; i < NP; i++) { const row = Math.floor(i / 4); const col = i % 4; out.push({ x: -row * 1.75 + (r() - .5) * .35, z: (col - 1.5) * .72 + (r() - .5) * .25 + (row % 2) * .2 }); } out[0] = { x: 1.9, z: .1 }; return out; })();

// ==========================================================================
// TÚNEL DE VIENTO, PIERNA, COMIDA, CORAZÓN, SECADOR, PULGAR
// ==========================================================================
const LAB = V3(0, 0, 3000); const lab = new THREE.Group(); lab.position.copy(LAB); scene.add(lab);
{ const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), M(0x2a2e36, { roughness: .8 })); floor.rotation.x = -Math.PI / 2; lab.add(floor);
  const tun = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 30, 40, 1, true), M(0x1c2230, { side: THREE.BackSide, roughness: .7 })); tun.rotation.z = Math.PI / 2; tun.position.y = 2.2; lab.add(tun);
  for (let i = -6; i <= 6; i++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(3.95, .04, 6, 48), new THREE.MeshBasicMaterial({ color: 0x3a6a9a })); ring.rotation.y = Math.PI / 2; ring.position.set(i * 2.2, 2.2, 0); lab.add(ring); } }
const tunRider = makeRider(99); scene.remove(tunRider); lab.add(tunRider);
const leg = new THREE.Group(); { const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(.13, .5, 6, 16), shortsMat); thigh.position.set(0, .55, 0); leg.add(thigh); const calf = new THREE.Mesh(new THREE.CapsuleGeometry(.1, .55, 6, 16), skinMat); calf.position.set(0, -.15, 0); calf.scale.set(1, 1, 1.15); leg.add(calf);
  const sock = new THREE.Mesh(new THREE.CylinderGeometry(.085, .08, .14, 16), M(0xf2f2f2)); sock.position.set(0, -.55, 0); leg.add(sock); const shoe = new THREE.Mesh(new THREE.BoxGeometry(.3, .09, .12), M(0xf2f2f2, { roughness: .4 })); shoe.position.set(.06, -.66, 0); leg.add(shoe);
  const hairs = new THREE.InstancedMesh(new THREE.CylinderGeometry(.002, .002, .035, 3), M(0x2a1a10), 900); const r = rng(3); const d = new THREE.Object3D(); for (let i = 0; i < 900; i++) { const a = r() * 6.283, y = -.45 + r() * .65; d.position.set(Math.cos(a) * .105, y, Math.sin(a) * .12); d.rotation.set(0, 0, Math.cos(a) * .4 - .3); d.updateMatrix(); hairs.setMatrixAt(i, d.matrix); } leg.add(hairs); leg.userData.hairs = hairs;
  const rash = new THREE.Mesh(new THREE.PlaneGeometry(.12, .2), new THREE.MeshStandardMaterial({ color: 0xb02a2a, roughness: .9, transparent: true, emissive: 0x300808 })); rash.position.set(0, -.12, .122); leg.add(rash); leg.userData.rash = rash;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(.108, .106, .24, 20, 1, true), M(0xf4efe4, { roughness: .9, side: THREE.DoubleSide })); band.position.set(0, -.12, 0); band.scale.set(1, 1, 1.15); leg.add(band); leg.userData.band = band; }
lab.add(leg);
const heartGeo = (() => { const s = new THREE.Shape(); s.moveTo(0, -.9); s.bezierCurveTo(-.2, -.6, -1, -.2, -1, .3); s.bezierCurveTo(-1, .8, -.45, 1, 0, .55); s.bezierCurveTo(.45, 1, 1, .8, 1, .3); s.bezierCurveTo(1, -.2, .2, -.6, 0, -.9); const g = new THREE.ExtrudeGeometry(s, { depth: .4, bevelEnabled: true, bevelThickness: .25, bevelSize: .2, bevelSegments: 6, curveSegments: 20 }); g.center(); return g; })();
const heartMat = M(0xc8302a, { roughness: .35, emissive: 0x3a0606 }); const hearts = [new THREE.Mesh(heartGeo, heartMat), new THREE.Mesh(heartGeo, heartMat)]; hearts.forEach(h => lab.add(h));
const dryer = new THREE.Group(); { const dm = M(0xe8e8ea, { roughness: .35 }); const b = new THREE.Mesh(new THREE.CylinderGeometry(.32, .36, .9, 24), dm); b.rotation.z = Math.PI / 2; dryer.add(b); const n = new THREE.Mesh(new THREE.CylinderGeometry(.22, .3, .4, 24), M(0x333338)); n.rotation.z = Math.PI / 2; n.position.x = .62; dryer.add(n);
  const h = new THREE.Mesh(new THREE.BoxGeometry(.22, .8, .2), dm); h.position.set(-.15, -.5, 0); h.rotation.z = .25; dryer.add(h); const back = new THREE.Mesh(new THREE.CylinderGeometry(.33, .33, .05, 24), M(COP, { emissive: 0x401808 })); back.rotation.z = Math.PI / 2; back.position.x = -.46; dryer.add(back); } lab.add(dryer);
const people = []; for (let i = 0; i < 3; i++) { const p = new THREE.Group(); const b = new THREE.Mesh(new THREE.CapsuleGeometry(.32, .9, 6, 14), M(0x8a96aa, { roughness: .5 })); b.position.y = .8; p.add(b); const hd = new THREE.Mesh(new THREE.SphereGeometry(.26, 16, 12), M(0x8a96aa, { roughness: .5 })); hd.position.y = 1.65; p.add(hd); lab.add(p); people.push(p); }
const plates = new THREE.InstancedMesh(new THREE.CylinderGeometry(.42, .36, .06, 24), M(0xf2f2f2, { roughness: .35 }), 30); lab.add(plates);
const thumb = new THREE.Group(); { const f = new THREE.Mesh(new THREE.CapsuleGeometry(.11, .38, 8, 16), skinMat); f.rotation.z = Math.PI / 2; thumb.add(f); const nail = new THREE.Mesh(new THREE.BoxGeometry(.16, .02, .15), M(0xe8c0b0, { roughness: .3 })); nail.position.set(.18, .1, 0); thumb.add(nail); } lab.add(thumb);
const bigWheel = bikeWheel(); bigWheel.scale.setScalar(1); lab.add(bigWheel);

// ==========================================================================
// PUERTO DE MONTAÑA (bajada)
// ==========================================================================
const MTN = V3(-3000, 0, 0); const mtn = new THREE.Group(); mtn.position.copy(MTN); scene.add(mtn);
const SLOPE = -.12; { const g = new THREE.PlaneGeometry(600, 400, 120, 80); g.rotateX(-Math.PI / 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); const base = x * SLOPE; const side = Math.abs(z); p.setY(i, base + (side > 6 ? (side - 6) * (z < 0 ? 1.1 : -.6) + Math.sin(x * .05 + z * .1) * 3 : 0)); }
  g.computeVertexNormals(); mtn.add(new THREE.Mesh(g, M(0xa8a290, { roughness: 1 })));
  const rd = new THREE.Mesh(new THREE.PlaneGeometry(600, 7), M(0x62666e, { roughness: .9 })); rd.rotation.x = -Math.PI / 2; rd.rotation.y = 0; const q = new THREE.Group(); q.add(rd); q.rotation.z = Math.atan(SLOPE); q.position.y = .05; mtn.add(q);
  const ln = new THREE.Mesh(new THREE.PlaneGeometry(600, .12), M(0xf0f0f0)); ln.rotation.x = -Math.PI / 2; ln.position.set(0, .01, 3.2); q.add(ln); const ln2 = ln.clone(); ln2.position.z = -3.2; q.add(ln2);
  const peaks = new THREE.InstancedMesh(new THREE.ConeGeometry(60, 120, 6), M(0x8a8f9a, { roughness: 1 }), 14); const d = new THREE.Object3D(); const r = rng(6); for (let i = 0; i < 14; i++) { d.position.set(-300 + i * 50 + r() * 20, -20 + r() * 20, -200 - r() * 100); d.scale.set(1, .6 + r() * .7, 1); d.updateMatrix(); peaks.setMatrixAt(i, d.matrix); } mtn.add(peaks); }
const desc = makeRider(55); scene.remove(desc); mtn.add(desc);

// Partículas
const PS = new Particles(30000, { size: .05, seed: 5 }); scene.add(PS.obj);
const ALL = [road, ...riders, lab, mtn];

// ==========================================================================
// HUD
// ==========================================================================
function stamp(s, x, y, a, rot = -.08, col = '#ff6a4a', size = 86) { if (a <= .01) return; const sc = lerp(1.6, 1, easeOut(clamp(a * 1.4)));
  g2.save(); g2.translate(x, y); g2.rotate(rot); g2.scale(sc, sc); g2.globalAlpha = clamp(a); g2.strokeStyle = col; g2.lineWidth = 8; g2.shadowColor = col; g2.shadowBlur = 25;
  g2.font = `800 ${size}px Montserrat`; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.letterSpacing = '6px'; const w = g2.measureText(s).width + 70; g2.strokeRect(-w / 2, -size * .8, w, size * 1.6); g2.fillStyle = col; g2.fillText(s, 0, 4); g2.restore(); }
function two(top, l1, l2, a, y = 300) { if (a <= .01) return; txt(l1, W / 2, y, 50, { font: 'Montserrat', weight: 800, alpha: a }); if (l2) txt(l2, W / 2, y + 62, 50, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(160, 920, y + 62, .5) }); if (top) txt(top, W / 2, y - 62, 24, { spacing: 7, alpha: a * .8, fill: '#e3a372' }); }
const fmtK = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const win = (t, a, b, f = .3) => smooth(a, a + f, t) * (1 - smooth(b - f, b, t));
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
function label(w, s, sub, a, col = '#ffe2c0', size = 40) { if (a <= .01) return; const p = project(w); txt(s, p.x, p.y, size, { font: 'Montserrat', weight: 800, alpha: a, fill: col }); if (sub) txt(sub, p.x, p.y + size * .9, 26, { alpha: a * .85 }); }
function ecg(x0, y0, w, bpm, t, a, col) { if (a <= .01) return; g2.save(); g2.globalAlpha = a; g2.strokeStyle = col; g2.lineWidth = 5; g2.shadowColor = col; g2.shadowBlur = 14; g2.beginPath(); const per = 60 / bpm;
  for (let i = 0; i <= 240; i++) { const x = x0 + i / 240 * w; const tt = t - (1 - i / 240) * 2.2; const ph = fract(tt / per) * per; let y = 0; if (ph < .08) y = -Math.sin(ph / .08 * Math.PI) * 70; else if (ph < .14) y = Math.sin((ph - .08) / .06 * Math.PI) * 25; if (i === 0) g2.moveTo(x, y0 + y); else g2.lineTo(x, y0 + y); } g2.stroke(); g2.restore(); }
function airflow(C, t, n, a, wake = 1, speed = 6) { const s = PS.seed; for (let i = 0; i < n; i++) { const q = i * 4; const u = fract(s[q] + t * speed / 10); const x = lerp(3, -7, u); let y = .2 + s[q + 1] * 1.7, z = (s[q + 2] - .5) * 1.6;
    const dx = x - .1, dy = y - 1.0, dz = z; const r2 = dx * dx / .45 + dy * dy / .35 + dz * dz / .09; if (r2 < 2.2 && x > -.3) { const k = (2.2 - r2) / 2.2; y += Math.sign(dy || 1) * k * .45; z += Math.sign(dz || 1) * k * .35; }
    let col = [.55, .8, 1.1]; if (x < -.3 && Math.abs(dy) < .6 && Math.abs(dz) < .4 && wake > 0) { const k = clamp(1 + x / 6) * wake; y += Math.sin(t * 9 + i) * .12 * k; z += Math.cos(t * 7 + i * 1.3) * .12 * k; col = [lerp(.55, 1.6, k), lerp(.8, .55, k), lerp(1.1, .25, k)]; }
    const f = a * smooth(0, .08, u) * (1 - smooth(.9, 1, u)); PS.push(C.x + x, C.y + y, C.z + z, col[0] * f, col[1] * f, col[2] * f); } }

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .02; camera.far = 6000; camera.fov = 42;
  let bloomS = .4, flash = 0, ca = .0012, fade = 0, expo = 1.3;
  PS.begin(); PS.mat.size = .05; lab.children[0].material.color.setHex(0x2a2e36); for (const o of ALL) o.visible = false; scene.fog.density = .006; hemi.intensity = 2.1; sun.intensity = 2.8;
  skyMat.uniforms.uTop.value.setRGB(.16, .36, .7); skyMat.uniforms.uHor.value.setRGB(.75, .84, .92); skyMat.uniforms.uSunC.value.setRGB(1, .9, .7); scene.fog.color.setRGB(.62, .72, .82);
  for (const c of ['aero', 'wheel', 'pelo', 'shave', 'tunnel', 'food', 'heart', 'sprint', 'descent', 'tyre', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = []; const V = 12; // m/s ≈ 43 km/h
  const placePel = (X, n = NP, spread = 1) => { for (let i = 0; i < n; i++) { const R = riders[i]; R.visible = true; const p = PEL[i]; R.position.set(X + p.x * spread + Math.sin(t * .7 + i) * .08, 0, p.z + Math.sin(t * .5 + i * 2) * .05); R.rotation.set(0, 0, 0); poseRider(R, t, { cad: 1.55 }); } };

  if (t < TL.aero) {
    // A · el pelotón a toda velocidad
    road.visible = true; const X = t * V; placePel(X); camera.position.set(X + 3.5 + t * .4, .9, 5.2); camera.fov = 48; camera.lookAt(X - 3, .9, 0);
    hud.push(() => two(null, '¿POR QUÉ LOS CICLISTAS', 'VAN SIEMPRE PEGADOS?', smooth(.05, .3, t), 300));
  } else if (t < TL.wheel) {
    // B · el 90 % del esfuerzo es apartar el aire
    const lt = t - TL.aero; road.visible = true; const R = riders[0]; R.visible = true; const X = t * V; R.position.set(X, 0, 0); R.rotation.set(0, 0, 0); poseRider(R, t);
    camera.position.set(X + lerp(2.6, 1.6, smooth(0, 3, lt)), 1.3, 3.8); camera.fov = 46; camera.lookAt(X - .6, .85, 0); airflow(V3(X, 0, 0), t, 6000, smooth(TL.aero, TL.aero + .6, t), 1); PS.mat.size = .05; bloomS = .6;
    hud.push(() => { two('A MÁS DE 30 KM/H', 'CASI TODO TU ESFUERZO', 'ES APARTAR EL AIRE', smooth(.05, .3, lt), 300); bigStat('DEL ESFUERZO', '90 %', 1560, smooth(.6, 1, lt), .5); });
  } else if (t < TL.relay) {
    if (t < TL.pelo) {
      // C · a rueda: −30 %
      const lt = t - TL.wheel; road.visible = true; const X = t * V; for (const [i, dx] of [[0, 0], [1, -1.15]]) { const R = riders[i]; R.visible = true; R.position.set(X + dx, 0, 0); R.rotation.set(0, 0, 0); poseRider(R, t); }
      camera.position.set(X - .3, 1.6, 4.6); camera.fov = 46; camera.lookAt(X - .55, .8, 0); airflow(V3(X, 0, 0), t, 6000, 1, 1.3); PS.mat.size = .05; bloomS = .6;
      hud.push(() => { two(null, 'A RUEDA DE OTRO', 'AHORRAS HASTA UN 30 %', smooth(.05, .3, lt), 300); { const a = smooth(.4, .8, lt); const p1 = project(riders[1].position.clone().add(V3(0, 1, 0))), p0 = project(riders[0].position.clone().add(V3(.2, 1, 0))); txt('−30 %', p1.x, 1560, 72, { font: 'Montserrat', weight: 800, alpha: a, fill: '#7fe08a' }); txt('detrás', p1.x, 1630, 30, { alpha: a }); txt('100 %', p0.x, 1560, 60, { font: 'Montserrat', weight: 800, alpha: a, fill: '#ff8a6a' }); txt('delante', p0.x, 1630, 30, { alpha: a }); } });
    } else {
      // D · en mitad del pelotón: −90 %
      const lt = t - TL.pelo; road.visible = true; const X = t * V; placePel(X); camera.position.set(X + 6, 26, 4); camera.fov = 44; camera.up.set(1, 0, 0); camera.lookAt(X - 3.5, 0, 0);
      const s = PS.seed; for (let i = 0; i < NP; i++) { const p = PEL[i]; const row = Math.floor(i / 4); const k = i === 0 ? 0 : clamp(row / 4); const col = [lerp(2, .4, k), lerp(.5, 1.2, k), lerp(.3, 2, k)]; const a = smooth(TL.pelo + .3, TL.pelo + .9, t);
        for (let j = 0; j < 40; j++) { const ang = j / 40 * 6.283; PS.push(X + p.x + Math.cos(ang) * .55, .05, p.z + Math.sin(ang) * .4, col[0] * a, col[1] * a, col[2] * a); } } PS.mat.size = .14; bloomS = .5;
      hud.push(() => { two(null, 'EN MITAD DEL PELOTÓN', 'HASTA UN 90 % MENOS', smooth(.05, .3, lt), 300); label(V3(X - 7, 1.5, 0), '−90 %', 'casi van de paseo', smooth(.8, 1.2, lt), '#7fb4ff', 70); label(V3(X + 1.9, 1.5, 0), '100 %', null, smooth(.5, .9, lt), '#ff8a6a', 44); });
    }
  } else if (t < TL.shave) {
    // E · relevos: el de delante se aparta y pasa atrás
    const lt = t - TL.relay; road.visible = true; const X = t * V; const n = 6; const u = fract(lt / 1.6);
    for (let i = 0; i < n; i++) { const R = riders[i]; R.visible = true; let slot = (i - Math.floor(lt / 1.6) % n + n) % n; let x = -slot * 1.15, z = 0; if (slot === 0) { z = lerp(0, .8, smooth(0, .3, u)); x = lerp(0, -n * 1.15, smooth(.25, 1, u)); } else x += smooth(.25, 1, u) * 1.15; R.position.set(X + x, 0, -z); R.rotation.set(0, 0, 0); poseRider(R, t); }
    camera.position.set(X + 3.5, 6.5, 7.5); camera.fov = 46; camera.lookAt(X - 3.2, .4, 0);
    hud.push(() => { two(null, 'POR ESO SE RELEVAN', 'CADA POCO', win(t, TL.relay, TL.relay + 1.8), 300); two(null, 'EL DE DELANTE', 'ES EL QUE MÁS SUFRE', smooth(TL.relay + 1.8, TL.relay + 2.1, t), 300); });
  } else if (t < TL.tunnel) {
    // F · piernas depiladas: por las caídas
    const lt = t - TL.shave; lab.visible = true; for (const o of lab.children) o.visible = false; leg.visible = true; lab.children[0].visible = true; leg.position.set(0, 1.4, 0); leg.rotation.set(0, Math.sin(t * .4) * .3 - .2, .08);
    const shaved = smooth(TL.shave + .6, TL.shave + 1.4, t); leg.userData.hairs.count = Math.floor(900 * (1 - shaved)); leg.userData.rash.visible = t > TL.crash; leg.userData.rash.material.opacity = smooth(TL.crash, TL.crash + .3, t); leg.userData.band.visible = t > TL.crash + 1.6; leg.userData.band.scale.y = smooth(TL.crash + 1.6, TL.crash + 2.1, t) + .01;
    camera.position.copy(LAB).add(V3(0, 1.3, 2.2)); camera.lookAt(LAB.clone().add(V3(0, 1.25, 0))); scene.fog.density = 0; skyMat.uniforms.uTop.value.setRGB(.04, .06, .1); skyMat.uniforms.uHor.value.setRGB(.1, .13, .18); skyMat.uniforms.uSunC.value.setRGB(0, 0, 0);
    hud.push(() => { two(null, '¿Y POR QUÉ SE DEPILAN', 'LAS PIERNAS?', win(t, TL.shave, TL.crash), 300); two('POR LAS CAÍDAS', 'LAS HERIDAS SE LIMPIAN', 'Y SE CURAN MEJOR', smooth(TL.crash, TL.crash + .3, t), 300); });
  } else if (t < TL.food) {
    // G · túnel de viento
    const lt = t - TL.tunnel; lab.visible = true; for (const o of lab.children) o.visible = true; for (const o of [leg, ...hearts, dryer, ...people, plates, thumb, bigWheel]) o.visible = false; tunRider.visible = true; tunRider.position.set(0, 0, 0); poseRider(tunRider, t, { cad: 1.4 });
    camera.position.copy(LAB).add(V3(2.2, 1.5, 5.4)); camera.fov = 50; camera.lookAt(LAB.clone().add(V3(-.6, .9, 0))); airflow(LAB, t, 7000, 1, .8, 8); PS.mat.size = .045; scene.fog.density = 0; bloomS = .6;
    const sec = Math.round(79 * smooth(TL.tunnel + 1.2, TL.tunnel + 3, t));
    hud.push(() => { two('AUNQUE EN EL TÚNEL DE VIENTO', 'PIERNAS DEPILADAS', 'AHORRAN MÁS DE 1 MINUTO', smooth(.05, .3, lt), 300); bigStat('EN 40 KM', '−' + Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'), 1600, smooth(1, 1.3, lt), .5); });
  } else if (t < TL.heart) {
    if (t < TL.ride) {
      // H · 8 000 kcal = tres personas
      const lt = t - TL.food; lab.visible = true; for (const o of lab.children) o.visible = false; lab.children[0].visible = true; scene.fog.density = 0; skyMat.uniforms.uTop.value.setRGB(.04, .06, .1); skyMat.uniforms.uHor.value.setRGB(.12, .14, .2); skyMat.uniforms.uSunC.value.setRGB(0, 0, 0);
      const n = Math.floor(30 * smooth(TL.food + .2, TL.kcal + 2, t)); plates.visible = true; plates.count = n; const d = new THREE.Object3D(); for (let i = 0; i < n; i++) { d.position.set(0, .03 + i * .07, 0); d.rotation.set(0, i * .7, (i % 3 - 1) * .04); d.updateMatrix(); plates.setMatrixAt(i, d.matrix); } plates.instanceMatrix.needsUpdate = true; plates.position.set(0, 0, 0);
      people.forEach((p, i) => { p.visible = t > TL.kcal + .4 + i * .35; p.position.set((i - 1) * 1.3, 0, -1.6); p.scale.setScalar(easeOut(smooth(TL.kcal + .4 + i * .35, TL.kcal + .8 + i * .35, t))); });
      camera.position.copy(LAB).add(V3(0, 2.6, 5.2)); camera.lookAt(LAB.clone().add(V3(0, 1.2, -.5)));
      hud.push(() => { two(null, '¿CUÁNTO COMEN', 'EN EL TOUR?', win(t, TL.food, TL.kcal), 300); const a = smooth(TL.kcal, TL.kcal + .3, t); bigStat('HASTA, CADA DÍA', fmtK(Math.round(8000 * smooth(TL.kcal, TL.kcal + 1.6, t))) + ' kcal', 330, a, .5); txt('= LO QUE COMEN 3 PERSONAS', W / 2, 1660, 38, { font: 'Montserrat', weight: 800, alpha: smooth(TL.kcal + 1.4, TL.kcal + 1.8, t), fill: '#ffe2c0' }); });
    } else {
      // I · comiendo sobre la bici
      const lt = t - TL.ride; road.visible = true; const X = t * V; const R = riders[2]; R.visible = true; R.position.set(X, 0, 0); R.rotation.set(0, 0, 0); poseRider(R, t, { handUp: true });
      camera.position.set(X + 1.6, 1.5, 2.4); camera.lookAt(X + .1, 1.25, 0);
      hud.push(() => { two(null, 'Y BUENA PARTE', 'PEDALEANDO', smooth(.05, .3, lt), 300); callout(R.position.clone().add(V3(.4, 1.4, -.1)), 120, 220, 'BARRITA', 'a 40 km/h', smooth(.3, .6, lt), '#ffb070'); });
    }
  } else if (t < TL.sprint) {
    // J · el corazón de Induráin
    const lt = t - TL.heart; lab.visible = true; for (const o of lab.children) o.visible = false; scene.fog.density = 0; skyMat.uniforms.uTop.value.setRGB(.03, .04, .08); skyMat.uniforms.uHor.value.setRGB(.1, .08, .12); skyMat.uniforms.uSunC.value.setRGB(0, 0, 0);
    const two_ = t > TL.indu; const beat = (bpm, ph = 0) => { const p = fract(t * bpm / 60 + ph); return 1 + .12 * Math.exp(-p * 14) + .06 * Math.exp(-Math.abs(p - .15) * 20); };
    hearts[0].visible = true; hearts[0].position.set(two_ ? 0 : 0, two_ ? 1.6 : .2, 0); hearts[0].scale.setScalar(beat(28) * (two_ ? .9 : 1.1)); hearts[0].rotation.set(0, Math.sin(t * .6) * .3, 0);
    hearts[1].visible = two_; hearts[1].position.set(0, -1.55, 0); hearts[1].scale.setScalar(beat(70, .3) * .9 * smooth(TL.indu + 1.6, TL.indu + 2, t)); hearts[1].rotation.set(0, Math.sin(t * .6 + 1) * .3, 0);
    camera.position.copy(LAB).add(V3(0, 0, 9.5)); camera.lookAt(LAB); bloomS = .5;
    hud.push(() => { two(null, '¿Y SU CORAZÓN?', null, win(t, TL.heart, TL.indu), 300); const a1 = smooth(TL.indu, TL.indu + .3, t), a2 = smooth(TL.indu + 1.6, TL.indu + 2, t);
      two('MIGUEL INDURÁIN', '28 PULSACIONES', 'POR MINUTO EN REPOSO', a1, 300); ecg(140, 1000, 800, 28, t, a1 * .9, '#ffb070'); txt('TÚ: UNAS 70', W / 2, 1740, 56, { font: 'Montserrat', weight: 800, alpha: a2, fill: '#ffffff' }); ecg(140, 1600, 800, 70, t, a2 * .9, '#ff6a5a'); });
  } else if (t < TL.descent) {
    // K · esprint: 2 000 W = un secador
    const lt = t - TL.sprint; road.visible = true; const X = t * V * 1.3; const R = riders[4]; R.visible = true; R.position.set(X, 0, 0); poseRider(R, t, { cad: 2.1, dance: 1, tuck: .75 });
    camera.position.set(X + 3.2, .7, 2.6); camera.fov = 50; camera.lookAt(X - .2, .9, 0); airflow(V3(X, 0, 0), t, 3000, .6, 1, 9); PS.mat.size = .03;
    const w = Math.round(1980 * easeOut(smooth(TL.sprint + .3, TL.sprint + 2, t)));
    const dA = smooth(TL.sprint + 2.4, TL.sprint + 2.8, t); lab.visible = dA > 0; if (lab.visible) { for (const o of lab.children) o.visible = false; dryer.visible = true; }
    hud.push(() => { two(null, 'EN UN ESPRINT', 'CASI 2.000 VATIOS', smooth(.05, .3, lt), 300); bigStat('POTENCIA', fmtK(w) + ' W', 1560, smooth(.2, .5, lt), .5); txt('= UN SECADOR A TOPE', W / 2, 1720, 46, { font: 'Montserrat', weight: 800, alpha: dA, fill: '#ffe2c0' }); });
    if (dA > 0) { dryer.position.set(0, 0, 0); lab.position.set(X - .2, 1.85, .7); dryer.rotation.set(0, .5, .15); dryer.scale.setScalar(.32 * easeOut(dA)); }
  } else if (t < TL.brand) {
    lab.position.copy(LAB);
    if (t < TL.tyre) {
      // L · bajada a más de 100 km/h
      const lt = t - TL.descent; mtn.visible = true; scene.fog.density = .003; const sp = 29; const x = 120 - lt * sp; const y = x * SLOPE + .05; desc.visible = true; desc.position.set(x, y, 0); desc.rotation.set(0, Math.PI, -Math.atan(SLOPE)); poseRider(desc, t, { cad: 0, tuck: .25, wheelSpin: t * 80 });
      const D = MTN.clone().add(desc.position); camera.position.copy(D).add(V3(4.2, 1.2, 2.2)); camera.fov = 52; camera.lookAt(D.clone().add(V3(-.5, .7, 0))); PS.mat.size = .04;
      const s = PS.seed; for (let i = 0; i < 2500; i++) { const q = i * 4; const u = fract(s[q] + t * 2.4); PS.push(D.x + lerp(-6, 8, u), D.y + .2 + s[q + 1] * 2.2, D.z + (s[q + 2] - .5) * 3, .9, .95, 1); }
      const kmh = Math.round(lerp(78, 104, smooth(TL.descent, TL.tyre, t)));
      hud.push(() => { two(null, 'EN LAS BAJADAS', 'PASAN DE 100 KM/H', smooth(.05, .3, lt), 300); bigStat('VELOCIDAD', kmh + ' km/h', 1600, smooth(.3, .6, lt), .5); });
    } else {
      // M · neumático del ancho de un pulgar
      const lt = t - TL.tyre; lab.visible = true; for (const o of lab.children) o.visible = false; lab.children[0].visible = true; bigWheel.visible = true; thumb.visible = true; scene.fog.density = 0; skyMat.uniforms.uTop.value.setRGB(.04, .06, .1); skyMat.uniforms.uHor.value.setRGB(.12, .14, .2); skyMat.uniforms.uSunC.value.setRGB(0, 0, 0);
      bigWheel.position.set(0, .335, 0); bigWheel.rotation.set(0, Math.PI / 2, -t * .4); thumb.scale.setScalar(.1); thumb.position.set(.032, .012, .0); thumb.rotation.set(0, Math.PI / 2, 0);
      lab.children[0].material.color.setHex(0x9a9fa8); camera.position.copy(LAB).add(V3(.3, .11, .3)); camera.lookAt(LAB.clone().add(V3(0, .05, 0))); camera.fov = 40; camera.near = .005;
      hud.push(() => { two(null, 'SOBRE NEUMÁTICOS', 'DEL ANCHO DE UN PULGAR', smooth(.05, .3, lt), 300); callout(LAB.clone().add(V3(0, .005, .03)), -140, 300, '25 mm', 'de goma', smooth(.6, 1, lt), '#ffb070'); });
    }
  } else {
    // N · marca: puerto al atardecer
    const lt = t - TL.brand; mtn.visible = true; desc.visible = true; const x = 60 - lt * 6; desc.position.set(x, x * SLOPE + .05, 0); desc.rotation.set(0, Math.PI, -Math.atan(SLOPE)); poseRider(desc, t, { cad: 1.2, tuck: .5 });
    skyMat.uniforms.uTop.value.setRGB(.06, .06, .16); skyMat.uniforms.uHor.value.setRGB(.95, .45, .2); skyMat.uniforms.uSun.value.set(-1, .05, -.3).normalize(); skyMat.uniforms.uSunC.value.setRGB(1.4, .6, .3); scene.fog.color.setRGB(.55, .3, .2); scene.fog.density = .004; hemi.intensity = 1.1; sun.intensity = 1.8; sun.color.setRGB(1, .6, .35);
    const D = MTN.clone().add(desc.position); camera.position.copy(D).add(V3(6, 2, 6)); camera.lookAt(D.clone().add(V3(-6, 3.2, -2))); fade = Math.min(.4, lt * .4);
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  if (t < TL.brand) { skyMat.uniforms.uSun.value.set(.4, .35, -1).normalize(); sun.color.setRGB(1, .95, .86); }
  sky.position.copy(camera.position); PS.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, bloom: bloomS, expo });
}
function renderCover() { renderFrame(.8); coverText('LOS SECRETOS', 'DEL CICLISMO', 'lo que pasa dentro del pelotón'); }
window.renderCover = () => { renderCover(); return true; };
window.OBJ = { PS, scene };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
