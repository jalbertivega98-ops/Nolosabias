// NO LO SABÍAS — "¿Qué hace el ABS?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final. Esquema, no a escala.
// ABS: sensor inductivo/magnético frente a un aro dentado (rueda fónica) en cada rueda; la centralita compara velocidades;
// el modulador hidráulico (válvulas de entrada/salida) baja, mantiene y vuelve a subir la presión ~10–20 veces por segundo.
// Origen aeronáutico: sistema antideslizante Dunlop Maxaret, usado en aviones desde principios de los años 50.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, easeIn, rng, V3, g2, camera, Particles, txt, copperGrad, project, callout, titleHUD, fract, camOrbit, bigStat, drawBrand, coverText, finish, noise1, arrowXY, bar, renderer } from '../../lib/core.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const scene = new THREE.Scene(); scene.background = new THREE.Color(0x05080f);
{ const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .45; }
const hemi = new THREE.HemisphereLight(0xc8d8ff, 0x404650, 2.0); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0e0, 3.0); sun.position.set(60, 120, 80); scene.add(sun);
const fillL = new THREE.DirectionalLight(0xffb070, .6); fillL.position.set(-80, 30, -60); scene.add(fillL);
const M = (c, r = .6, m = .2, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: e });
const box = (w, h, d, mat, x = 0, y = 0, z = 0, parent = scene) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; };
const cyl = (r, h, mat, x = 0, y = 0, z = 0, parent = scene, seg = 32) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat); m.position.set(x, y, z); parent.add(m); return m; };
const cylZ = (r, h, mat, x, y, z, parent, seg = 32, open = false) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg, 1, open), mat); m.rotation.x = Math.PI / 2; m.position.set(x, y, z); parent.add(m); return m; };
const ORANGE = [1.8, .9, .3], BLUE = [.35, .8, 1.8], RED = [2, .35, .25], GREEN = [.4, 1.8, .7], SMOKE = [.55, .56, .6];
const dummy = new THREE.Object3D();
const R_W = .33; // radio de rueda (m)

// cielo (cúpula con degradado; sigue a la cámara)
const sky = (() => { const g = new THREE.SphereGeometry(4000, 32, 16); const c = []; const p = g.attributes.position; const lo = new THREE.Color(0xd08a60), mid = new THREE.Color(0x4a6088), hi = new THREE.Color(0x101a34);
  for (let i = 0; i < p.count; i++) { const y = p.getY(i) / 4000; const col = y < .06 ? lo.clone().lerp(mid, clamp(y / .06)) : mid.clone().lerp(hi, clamp((y - .06) / .5)); c.push(col.r, col.g, col.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, depthWrite: false, fog: false })); scene.add(m); return m; })();

// ==========================================================================
// COCHE (unidades: metros; morro hacia +x, izquierda hacia −z)
// ==========================================================================
const paintM = new THREE.MeshStandardMaterial({ color: 0xc8443a, roughness: .5, metalness: .25, transparent: true });
const glassM = new THREE.MeshStandardMaterial({ color: 0x0c1218, roughness: .08, metalness: .9, transparent: true, opacity: .92 });
const tyreM = new THREE.MeshStandardMaterial({ color: 0x1a1b1e, roughness: .85, metalness: 0, transparent: true, side: THREE.DoubleSide });
const rimM = M(0xc4c8d0, .25, .9), barrelM = new THREE.MeshStandardMaterial({ color: 0x2a2c32, roughness: .5, metalness: .7, side: THREE.DoubleSide });
const discM = new THREE.MeshStandardMaterial({ color: 0x8a8e96, roughness: .35, metalness: .85, emissive: 0x000000 });
const caliperM = new THREE.MeshStandardMaterial({ color: 0xc8302a, roughness: .4, metalness: .4, emissive: 0x000000 });
const ghostM = new THREE.MeshStandardMaterial({ color: 0x40ff90, roughness: .4, metalness: .1, emissive: 0x064018, transparent: true, opacity: .3, depthWrite: false });
const tailM = new THREE.MeshStandardMaterial({ color: 0x400808, emissive: 0xff1810, emissiveIntensity: .4 });
const headM = new THREE.MeshStandardMaterial({ color: 0x505050, emissive: 0xfff4e0, emissiveIntensity: .25 });
const shape = pts => { const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]); return s; };
const lowerGeo = new THREE.ExtrudeGeometry(shape([[-2.3, .3], [2.28, .3], [2.36, .58], [2.22, .8], [1.0, .95], [-1.95, 1.0], [-2.32, .92]]), { depth: 1.6, bevelEnabled: true, bevelThickness: .06, bevelSize: .06, bevelSegments: 3, curveSegments: 4 }); lowerGeo.translate(0, 0, -.8);
const cabinGeo = new THREE.ExtrudeGeometry(shape([[1.02, .95], [.42, 1.36], [-.9, 1.4], [-1.95, 1.0]]), { depth: 1.42, bevelEnabled: true, bevelThickness: .04, bevelSize: .04, bevelSegments: 2 }); cabinGeo.translate(0, 0, -.71);
const WP = [[1.4, -.86], [1.4, .86], [-1.35, -.86], [-1.35, .86]]; // FL, FR, RL, RR
function makeWheel(parent, x, z, ghost) {
  const mount = new THREE.Group(); mount.position.set(x, R_W, z); parent.add(mount); const spin = new THREE.Group(); mount.add(spin); const flip = z < 0;
  const tm = ghost ? ghostM : tyreM; const tread = new THREE.Mesh(new THREE.CylinderGeometry(R_W, R_W, .22, 48, 1, true), tm); tread.rotation.x = Math.PI / 2; spin.add(tread);
  for (const s of [1, -1]) { const r = new THREE.Mesh(new THREE.RingGeometry(.22, R_W, 48), tm); r.position.z = .11 * s; spin.add(r); }
  if (!ghost) { const lip = new THREE.Mesh(new THREE.TorusGeometry(.215, .018, 8, 40), rimM); lip.position.z = .1; spin.add(lip); cylZ(.215, .2, barrelM, 0, 0, 0, spin, 32, true);
    for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283; const sp = new THREE.Mesh(new THREE.BoxGeometry(.05, .2, .025), rimM); sp.position.set(Math.cos(a) * .11, Math.sin(a) * .11, .1); sp.rotation.z = a - Math.PI / 2; spin.add(sp); }
    cylZ(.045, .04, rimM, 0, 0, .11, spin, 16); cylZ(.19, .025, discM, 0, 0, -.02, spin, 40);
    for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283; const sl = new THREE.Mesh(new THREE.BoxGeometry(.06, .015, .03), M(0x303236, .6, .5)); sl.position.set(Math.cos(a) * .14, Math.sin(a) * .14, -.02); sl.rotation.z = a; spin.add(sl); }
    const cal = new THREE.Mesh(new THREE.BoxGeometry(.13, .07, .09), caliperM); cal.position.set(-.06, .165, -.02); cal.rotation.z = .35; mount.add(cal); }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.42, .02, 8, 48), new THREE.MeshBasicMaterial({ color: 0x40ff90, transparent: true, opacity: 0, depthWrite: false })); mount.add(ring);
  return { mount, spin, flip, ring };
}
function makeCar(ghost = false) {
  const g = new THREE.Group(); scene.add(g); const body = new THREE.Group(); g.add(body);
  body.add(new THREE.Mesh(lowerGeo, ghost ? ghostM : paintM)); body.add(new THREE.Mesh(cabinGeo, ghost ? ghostM : glassM));
  if (!ghost) { box(1.3, .05, 1.44, paintM, -.25, 1.4, 0, body); for (const s of [-1, 1]) { box(.06, .08, .3, headM, 2.31, .66, .55 * s, body); box(.06, .09, .36, tailM, -2.36, .84, .6 * s, body); } }
  const ecu = box(.28, .18, .22, new THREE.MeshStandardMaterial({ color: 0x4a4e56, roughness: .4, metalness: .7, emissive: 0x000000 }), 1.75, .72, -.42, body);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(lowerGeo, 25), new THREE.LineBasicMaterial({ color: 0x9ad0ff, transparent: true, opacity: 0, depthWrite: false })); body.add(edges);
  const edges2 = new THREE.LineSegments(new THREE.EdgesGeometry(cabinGeo, 25), edges.material); body.add(edges2);
  const w = WP.map(([x, z]) => makeWheel(g, x, z, ghost));
  const wires = WP.map(([x, z]) => { const geo = new THREE.BufferGeometry().setFromPoints([V3(1.75, .72, -.42), V3(lerp(1.75, x, .5), .55, z * .4), V3(x, .4, z * .62)]); const l = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffb070, transparent: true, opacity: 0 })); g.add(l); return l; });
  return { g, body, w, ecu, wires, edges };
}
const car = makeCar(), ghost = makeCar(true);
function poseCar(c, x, z, yaw, pitch, th, steer) {
  c.g.position.set(x, 0, z); c.g.rotation.y = yaw; c.body.rotation.z = pitch; c.body.position.y = pitch * 2;
  c.w.forEach((w, k) => { const a = Array.isArray(th) ? th[k] : th; w.mount.rotation.y = (w.flip ? Math.PI : 0) + (k < 2 ? steer : 0); w.spin.rotation.z = (w.flip ? 1 : -1) * a; });
}
const wheelWorld = (c, k) => c.w[k].mount.getWorldPosition(V3());
function xray(a) { headM.emissiveIntensity = lerp(.25, 0, a); paintM.opacity = lerp(1, .1, a); paintM.depthWrite = a < .5; glassM.opacity = lerp(.92, .08, a); glassM.depthWrite = a < .5; tyreM.opacity = lerp(1, .3, a); tyreM.depthWrite = a < .5;
  car.wires.forEach(l => l.material.opacity = a * .9); car.edges.material.opacity = a * .55; }

// ==========================================================================
// CARRETERA de noche (a lo largo de +x)
// ==========================================================================
const road = new THREE.Group(); scene.add(road);
{ const asph = new THREE.Mesh(new THREE.PlaneGeometry(8000, 7.4), M(0x4a4c52, .85, 0)); asph.rotation.x = -Math.PI / 2; asph.position.set(3500, 0, -1.8); road.add(asph);
  const grd = new THREE.Mesh(new THREE.PlaneGeometry(8000, 600), M(0x2c3628, .95, 0)); grd.rotation.x = -Math.PI / 2; grd.position.set(3500, -.02, -1.8); road.add(grd);
  const lineM = new THREE.MeshStandardMaterial({ color: 0xa8a8a2, roughness: .8, metalness: 0 });
  for (const z of [1.75, -5.35]) box(8000, .01, .14, lineM, 3500, .006, z, road);
  const n = 800; const dash = new THREE.InstancedMesh(new THREE.BoxGeometry(3, .01, .13), lineM, n); for (let i = 0; i < n; i++) { dummy.position.set(-200 + i * 9, .006, -1.8); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); dash.setMatrixAt(i, dummy.matrix); } road.add(dash);
  const np = 90; const pole = new THREE.InstancedMesh(new THREE.CylinderGeometry(.08, .1, 7, 8), M(0x50545c, .5, .6), np); const arm = new THREE.InstancedMesh(new THREE.BoxGeometry(.08, .08, 2.2), M(0x50545c, .5, .6), np);
  const head = new THREE.InstancedMesh(new THREE.BoxGeometry(.6, .12, .3), new THREE.MeshBasicMaterial({ color: 0x9a8264 }), np);
  for (let i = 0; i < np; i++) { const x = -150 + i * 35; dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.position.set(x, 3.5, 3.2); dummy.updateMatrix(); pole.setMatrixAt(i, dummy.matrix);
    dummy.position.set(x, 7, 2.2); dummy.updateMatrix(); arm.setMatrixAt(i, dummy.matrix); dummy.position.set(x, 6.92, 1.2); dummy.updateMatrix(); head.setMatrixAt(i, dummy.matrix); } road.add(pole, arm, head); }

// ==========================================================================
// PISTA DE PRUEBAS (vista cenital): conos marcando la curva
// ==========================================================================
const TD = V3(0, 0, 4000); const td = new THREE.Group(); td.position.copy(TD); scene.add(td); const RC = 18;
{ const asph = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), M(0x5a5c62, .85, 0)); asph.rotation.x = -Math.PI / 2; td.add(asph);
  const lm = M(0x8a8a84, .7, 0); for (let i = -6; i <= 6; i++) { box(300, .01, .1, lm, 0, .005, i * 12 + 6, td); }
  const coneM = M(0xff6a1a, .5, 0, 0x401000), stripeM = M(0xffffff, .4, 0);
  const cone = (x, z) => { const c = new THREE.Mesh(new THREE.ConeGeometry(.2, .55, 16), coneM); c.position.set(x, .275, z); td.add(c); const s = new THREE.Mesh(new THREE.CylinderGeometry(.115, .14, .1, 16), stripeM); s.position.set(x, .3, z); td.add(s); box(.42, .03, .42, coneM, x, .015, z, td); };
  for (const r of [RC - 2.6, RC + 2.6]) for (let d = -30; d <= 100; d += 10) { const th = d * Math.PI / 180; let x, z; if (th < 0) { x = th * RC; z = RC - r; } else { x = r * Math.sin(th); z = -RC + r * Math.cos(th); } z = th < 0 ? (r < RC ? 2.6 : -2.6) : z; if (Math.abs(z) < 1.6 && x > -1) continue; cone(x, z); } }
const arcPt = (s, R = RC) => s < 0 ? V3(s, 0, 0) : V3(R * Math.sin(s / R), 0, -(R - R * Math.cos(s / R)));

// ==========================================================================
// SENSOR: aro dentado (rueda fónica) + sensor magnético (escala ×20)
// ==========================================================================
const SE = V3(-4000, 0, 0); const se = new THREE.Group(); se.position.copy(SE); scene.add(se); const NT = 44, RT = 2.6;
const tone = new THREE.Group(); se.add(tone); const steelM = M(0xc8ccd2, .25, .9);
{ const ann = new THREE.Shape(); ann.absarc(0, 0, RT, 0, Math.PI * 2, false); const hole = new THREE.Path(); hole.absarc(0, 0, 1.6, 0, Math.PI * 2, true); ann.holes.push(hole);
  const rg = new THREE.ExtrudeGeometry(ann, { depth: .7, bevelEnabled: false, curveSegments: 64 }); rg.translate(0, 0, -.35); tone.add(new THREE.Mesh(rg, steelM));
  const teeth = new THREE.InstancedMesh(new THREE.BoxGeometry(.24, .36, .7), steelM, NT); for (let k = 0; k < NT; k++) { const a = k / NT * 6.283; dummy.position.set(Math.cos(a) * (RT + .17), Math.sin(a) * (RT + .17), 0); dummy.rotation.set(0, 0, a - Math.PI / 2); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); teeth.setMatrixAt(k, dummy.matrix); } tone.add(teeth);
  cylZ(1.6, 7, M(0x3a3c42, .5, .7), 0, 0, -1.5, tone, 32); const disc = cylZ(5.2, .5, new THREE.MeshStandardMaterial({ color: 0x8a8e96, roughness: .35, metalness: .85, transparent: true, opacity: .35, depthWrite: false }), 0, 0, -2.2, tone, 64);
  for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; box(.5, .12, .55, M(0x303236, .6, .5), Math.cos(a) * 4.2, Math.sin(a) * 4.2, -2.2, tone).rotation.z = a; }
  const tyreG = new THREE.Mesh(new THREE.TorusGeometry(8.2, 2.1, 24, 80), new THREE.MeshStandardMaterial({ color: 0x5a6070, roughness: .7, transparent: true, opacity: .1, depthWrite: false })); tyreG.position.z = -1.2; tyreG.scale.z = 1.3; tone.add(tyreG); }
const sensor = new THREE.Group(); sensor.position.set(0, RT + .36 + .12, 0); se.add(sensor);
{ const bodyS = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, 2.6, 32), M(0x1c1d20, .5, .1)); bodyS.position.y = 1.55; sensor.add(bodyS);
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(.44, .44, .3, 32), M(0xc87a40, .3, .9)); tip.position.y = .15; sensor.add(tip);
  box(1.6, .2, .9, M(0x50545c, .4, .7), .6, 1.9, 0, sensor);
  const cab = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(0, 2.8, 0), V3(0, 4.2, 0), V3(1.5, 5.4, .5), V3(4, 6, 1)]), 40, .16, 10), M(0x18191c, .6, 0)); sensor.add(cab); }
const sensorTip = () => sensor.getWorldPosition(V3()).add(V3(0, 0, 0));
const ringRate = 6.283 * .14; // rad/s
const ringPhi = t => (t - TL.sensor) * ringRate;
function toothSig(t) { const p = 6.283 / NT; const u = fract((Math.PI / 2 + ringPhi(t)) / p); return smooth(.3, .22, Math.min(u, 1 - u)) ; }

// ==========================================================================
// HIDRÁULICA: disco + pinza (rayos X) + latiguillo + bloque de válvulas (escala ×10)
// ==========================================================================
const HY = V3(-4000, 0, 4000); const hy = new THREE.Group(); hy.position.copy(HY); scene.add(hy);
const hDiscM = new THREE.MeshStandardMaterial({ color: 0x9a9ea6, roughness: .3, metalness: .85, emissive: 0x000000 });
const hDisc = new THREE.Group(); hy.add(hDisc); cylZ(3, .35, hDiscM, 0, 0, 0, hDisc, 72); cylZ(1.3, .9, M(0xb0b4bc, .3, .85), 0, 0, .55, hDisc, 48);
for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283; for (const z of [.18, -.18]) { const s = box(.9, .1, .02, M(0x2a2c30, .6, .4), Math.cos(a) * 2.2, Math.sin(a) * 2.2, z, hDisc); s.rotation.z = a + .5; } }
for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283; cylZ(.14, .3, M(0xd0d4da, .2, .9), Math.cos(a) * .8, Math.sin(a) * .8, 1.1, hDisc, 12); }
const calG = new THREE.Group(); calG.position.set(0, 2.5, 0); hy.add(calG);
box(2.6, 1.3, 2.2, new THREE.MeshStandardMaterial({ color: 0xd8302a, roughness: .4, metalness: .3, transparent: true, opacity: .22, depthWrite: false }), 0, 0, 0, calG);
const pads = [1, -1].map(s => { const g = new THREE.Group(); calG.add(g); box(2.1, .95, .2, M(0x3a3430, .9, 0), 0, 0, 0, g); box(2.2, 1.05, .08, M(0x9aa0a8, .4, .8), 0, 0, s * .14, g); const pis = new THREE.Mesh(new THREE.CylinderGeometry(.38, .38, .5, 24), M(0xd8dce2, .2, .9)); pis.rotation.x = Math.PI / 2; pis.position.z = s * .43; g.add(pis); g.userData.s = s; return g; });
const linePath = new THREE.CatmullRomCurve3([V3(0, 3.15, 0), V3(0, 4.6, 0), V3(-.8, 6.2, 0), V3(-1.4, 7.4, 0), V3(-1.5, 8.2, 0)]);
hy.add(new THREE.Mesh(new THREE.TubeGeometry(linePath, 80, .16, 12), new THREE.MeshStandardMaterial({ color: 0xb8c0c8, roughness: .3, metalness: .6, transparent: true, opacity: .3, depthWrite: false })));
const blk = new THREE.Group(); blk.position.set(-1.5, 9.5, 0); hy.add(blk);
box(3.4, 2.6, 2.4, new THREE.MeshStandardMaterial({ color: 0x9aa4b4, roughness: .3, metalness: .7, transparent: true, opacity: .16, depthWrite: false }), 0, 0, 0, blk);
const valves = [-.75, .75].map((x, k) => { const g = new THREE.Group(); g.position.set(x, 0, 0); blk.add(g); for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.TorusGeometry(.42, .07, 8, 24), M(0xc87a40, .35, .9)); c.rotation.x = Math.PI / 2; c.position.y = -.5 + i * .2; g.add(c); }
  const pl = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, 1.3, 20), M(0xd8dce2, .2, .9, 0x000000)); g.add(pl); g.userData.pl = pl; return g; });
cylZ(.7, 1.6, M(0x30343a, .4, .6), -1.5, 9.5, -2, hy);
const hydroP = t => { if (t < TL.valves) return 1; if (t < TL.press) return lerp(1, .15, smooth(TL.valves, TL.valves + .35, t)); if (t < TL.cycle) return lerp(.15, 1, smooth(TL.press, TL.press + .3, t));
  const dw = .53; const u = (t - TL.cycle) / dw; const uu = u < 4 ? u : 4 + (t - TL.cycle - 4 * dw) * 5; return .575 - .425 * Math.cos(Math.PI * uu); };
const wheelS = t => { if (t < TL.valves + .2) return .95 - .62 * smooth(TL.valves - 1.6, TL.valves + .2, t); if (t < TL.press) return lerp(.33, .9, smooth(TL.valves + .3, TL.spin + .3, t));
  if (t < TL.cycle) return lerp(.9, .74, smooth(TL.press, TL.press + 1.2, t)); return .74 - .09 * (hydroP(t - .18) - .575) / .425; };
function hydroAngle(t) { let a = 0; const t0 = TL.valves - 2, dt = 1 / 60; for (let x = t0; x < t; x += dt) a += wheelS(x) * 7 * dt; return a; }

// ==========================================================================
// PEDAL: pie sobre el pedal de freno (escala real, m)
// ==========================================================================
const PD = V3(4000, 0, 4000); const pd = new THREE.Group(); pd.position.copy(PD); scene.add(pd);
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), M(0x30323a, .95, 0)); fl.rotation.x = -Math.PI / 2; pd.add(fl);
  const fw = new THREE.Mesh(new THREE.PlaneGeometry(3, 2), M(0x3a3c44, .9, 0)); fw.position.set(.42, .6, 0); fw.rotation.y = -Math.PI / 2; pd.add(fw); fw.rotation.z = 0;
  box(.04, .3, .3, M(0x2e3036, .6, .5), .38, .7, 0, pd); }
const pedal = new THREE.Group(); pedal.position.set(.32, .78, 0); pd.add(pedal);
{ box(.035, .5, .03, M(0xb0b4bc, .3, .8), 0, -.25, 0, pedal).rotation.z = .25; const pad = box(.03, .1, .13, M(0x45474e, .8, .2), -.07, -.5, 0, pedal); pad.name = 'pad';
  for (let i = 0; i < 4; i++) box(.006, .012, .12, M(0x505258, .6, .4), -.087, -.535 + i * .024, 0, pedal); }
const gas = new THREE.Group(); gas.position.set(.33, .7, -.25); pd.add(gas); box(.025, .26, .07, M(0x2a2b2e, .8, .2), -.04, -.2, 0, gas).rotation.z = .2;
const shoe = new THREE.Group(); pedal.add(shoe); shoe.visible = false;
{ const sm = M(0x5a3c2a, .5, .05); box(.03, .34, .115, M(0x15151a, .9, 0), -.1, -.45, 0, shoe); const up = new THREE.Mesh(new THREE.CapsuleGeometry(.06, .24, 8, 16), sm); up.position.set(-.16, -.45, 0); up.scale.z = .9; shoe.add(up);
  const lace = new THREE.Mesh(new THREE.CapsuleGeometry(.045, .12, 6, 12), M(0x2a3a5a, .7, 0)); lace.position.set(-.2, -.48, 0); shoe.add(lace); }
const pdLamp = new THREE.PointLight(0xffd8b0, 7, 3, 1.5); pdLamp.position.set(-.3, .9, .6); pd.add(pdLamp);
const padWorld = () => pedal.getObjectByName('pad').getWorldPosition(V3());

// ==========================================================================
// AVIÓN de hélice de los años 50 aterrizando (genérico, m)
// ==========================================================================
const PA = V3(0, 0, -6000); const pa = new THREE.Group(); pa.position.copy(PA); scene.add(pa);
{ const rw = new THREE.Mesh(new THREE.PlaneGeometry(3000, 45), M(0x2a2c30, .85, 0)); rw.rotation.x = -Math.PI / 2; rw.position.x = 1000; pa.add(rw);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(7000, 3000), M(0x18221c, .95, 0)); gr.rotation.x = -Math.PI / 2; gr.position.set(1000, -.03, 0); pa.add(gr);
  const lm = new THREE.MeshStandardMaterial({ color: 0xa8a8a2, roughness: .8 }); const n = 60; const cl = new THREE.InstancedMesh(new THREE.BoxGeometry(24, .01, .7), lm, n);
  for (let i = 0; i < n; i++) { dummy.position.set(-480 + i * 50, .01, 0); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); cl.setMatrixAt(i, dummy.matrix); } pa.add(cl);
  for (const z of [-21.5, 21.5]) box(3000, .01, .5, lm, 1000, .01, z, pa); for (let i = 0; i < 8; i++) box(30, .01, 1.6, lm, -470, .01, -16 + i * 4.5, pa); }
const plane = new THREE.Group(); pa.add(plane); const alu = M(0xc8ccd4, .3, .85), aluD = M(0x9aa0a8, .35, .8);
const propsL = [], gearW = [];
{ const f = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 24, 40), alu); f.rotation.z = Math.PI / 2; plane.add(f);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(1.7, 32, 20), alu); nose.scale.set(2.2, 1, 1); nose.position.x = 12; plane.add(nose);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(1.7, .35, 10, 32), alu); tail.rotation.z = Math.PI / 2; tail.position.set(-17, .5, 0); tail.rotation.y = 0; plane.add(tail);
  box(24, .32, 3.46, M(0xc87a40, .35, .8), 0, .15, 0, plane); box(5.6, .9, 2.9, M(0x0c1016, .1, .9), 15.6, .75, 0, plane);
  for (let i = 0; i < 16; i++) box(.45, .55, 3.42, M(0x10141a, .2, .6), 9 - i * 1.25, .75, 0, plane);
  const wingS = shape([[3.5, 0], [-1.5, 0], [-.5, 20], [2, 20]]); const wg = new THREE.ExtrudeGeometry(wingS, { depth: .4, bevelEnabled: false }); for (const s of [1, -1]) { const w = new THREE.Mesh(wg, alu); w.rotation.x = s * Math.PI / 2; w.position.set(0, -.6, 0); w.scale.y = 1; plane.add(w); if (s < 0) w.position.y = -.2; }
  const fin = new THREE.Mesh(new THREE.ExtrudeGeometry(shape([[-16, 1.4], [-22.3, 1.4], [-22.6, 7.2], [-20.2, 7.2]]), { depth: .3, bevelEnabled: false }), alu); fin.position.z = -.15; plane.add(fin);
  const st = new THREE.ExtrudeGeometry(shape([[-18, 0], [-22.4, 0], [-21.8, 6.5], [-20.4, 6.5]]), { depth: .25, bevelEnabled: false }); for (const s of [1, -1]) { const m = new THREE.Mesh(st, alu); m.rotation.x = s * Math.PI / 2; m.position.y = .9; plane.add(m); }
  for (const z of [-12, -6, 6, 12]) { const nac = new THREE.Mesh(new THREE.CylinderGeometry(.75, .9, 5, 24), aluD); nac.rotation.z = Math.PI / 2; nac.position.set(2.6, -.3, z); plane.add(nac);
    const pg = new THREE.Group(); pg.position.set(5.2, -.3, z); plane.add(pg); const hub = new THREE.Mesh(new THREE.SphereGeometry(.4, 16, 10), M(0xd8302a, .4, .5)); hub.scale.x = 1.6; pg.add(hub);
    for (let b = 0; b < 3; b++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(.12, 2.2, .3), M(0x18191c, .6, .3)); bl.position.y = 1.1; const bg = new THREE.Group(); bg.rotation.x = b / 3 * 6.283; bg.add(bl); pg.add(bg); }
    const disk = new THREE.Mesh(new THREE.CircleGeometry(2.25, 40), new THREE.MeshBasicMaterial({ color: 0x9aa0b0, transparent: true, opacity: .07, side: THREE.DoubleSide, depthWrite: false })); disk.rotation.y = Math.PI / 2; disk.position.x = .1; pg.add(disk); propsL.push(pg); }
  const gearM = M(0x50545c, .4, .7); const wM = M(0x141518, .85, 0);
  for (const [x, z, r, n] of [[2.2, -6, .6, 2], [2.2, 6, .6, 2], [11, 0, .42, 2]]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 2.6, 10), gearM); leg.position.set(x, -2.3, z); plane.add(leg);
    for (let i = 0; i < n; i++) { const wg2 = new THREE.Group(); wg2.position.set(x, -3.75 + (r === .6 ? 0 : .18), z + (i - .5) * .7); plane.add(wg2); const ty = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .32, 28), wM); ty.rotation.x = Math.PI / 2; wg2.add(ty);
      const hb = new THREE.Mesh(new THREE.CylinderGeometry(r * .5, r * .5, .34, 6), gearM); hb.rotation.x = Math.PI / 2; wg2.add(hb); gearW.push({ g: wg2, r, main: r === .6 }); } } }
const PL_V = 62, X_TD = 300, GEAR_H = 4.35;
const planeAlt = tau => tau <= 0 ? 0 : tau < 1.5 ? 3.2 * tau * tau / 3 : 3.2 * (tau - .75);
const planeX = t => X_TD + PL_V * (t - TL.land);
const mainGearW = (t, s) => V3(planeX(t) + 2.2, GEAR_H - 3.75 - .6 + planeAlt(TL.land - t), s * 6).add(PA);

// ==========================================================================
// TIMELINE
// ==========================================================================
const P = new Particles(24000, { size: .5, seed: 43 }); scene.add(P.obj);
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
const L = (t, a, b) => smooth(TL[a], TL[a] + .3, t) * (b ? 1 - smooth(TL[b] - .1, TL[b] + .1, t) : 1);
function show(o) { for (const [k, v] of [['road', road], ['td', td], ['se', se], ['hy', hy], ['pd', pd], ['pa', pa]]) v.visible = !!o[k]; car.g.visible = !!o.car; ghost.g.visible = !!o.ghost; sky.visible = !!o.sky; }
// humo que queda en el mundo: emitido en el punto de contacto de cada instante te
function smoke(contact, t0, t1, t, n, life, amp, sd = 0, rise = 1.4, spread = 1.6) { const s = P.seed; for (let i = 0; i < n; i++) { const q = ((i + sd) % P.n) * 4; const age = fract(s[q] + t / life); const te = t - age * life; if (te < t0 || te > t1) continue;
  const c = contact(te, i); const r = (.15 + age * spread); const f = amp * (1 - age) * smooth(0, .08, age);
  P.push(c.x + (s[q + 1] - .5) * r * 2, c.y + age * rise * (.4 + s[q + 3]), c.z + (s[q + 2] - .5) * r * 2, SMOKE[0] * f, SMOKE[1] * f, SMOKE[2] * f); } }
function ball(c, n, R, col, amp, sd = 0) { const s = P.seed; for (let i = 0; i < n; i++) { const q = ((i + sd) % P.n) * 4; const a = s[q] * 6.283, b = Math.acos(s[q + 1] * 2 - 1); const r = R * Math.cbrt(s[q + 2]); P.push(c.x + Math.sin(b) * Math.cos(a) * r, c.y + Math.cos(b) * r, c.z + Math.sin(b) * Math.sin(a) * r, col[0] * amp, col[1] * amp, col[2] * amp); } }
// marcas de frenada (4 tiras negras)
const skidM = new THREE.MeshBasicMaterial({ color: 0x050505, transparent: true, opacity: .75, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
const skids = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, .2), skidM); m.rotation.x = -Math.PI / 2; scene.add(m); return m; });
function setSkids(base, x0, x1, on) { skids.forEach((m, k) => { m.visible = on && x1 - x0 > .05; const [wx, wz] = WP[k]; m.position.set(base.x + (x0 + x1) / 2 + wx, base.y + .012, base.z + wz); m.scale.x = Math.max(.01, x1 - x0); }); }
// HUD: polilínea discontinua de puntos del mundo
function worldPath(pts, a, col, dash = [22, 16], w = 8, prog = 1) { if (a <= .01) return; const n = Math.max(2, Math.floor(pts.length * prog)); g2.save(); g2.globalAlpha = a; g2.strokeStyle = col; g2.lineWidth = w; g2.lineCap = 'round'; g2.setLineDash(dash); g2.shadowColor = col; g2.shadowBlur = 16;
  g2.beginPath(); for (let i = 0; i < n; i++) { const p = project(pts[i]); i ? g2.lineTo(p.x, p.y) : g2.moveTo(p.x, p.y); } g2.stroke(); g2.restore(); }
// HUD: gráfica que avanza
function graph(x0, y0, w, h, span, t, fns, a, label) { if (a <= .01) return; g2.save(); g2.globalAlpha = a * .5; g2.fillStyle = 'rgba(4,8,16,.55)'; g2.fillRect(x0 - 20, y0 - 50, w + 40, h + 70); g2.globalAlpha = a * .35; g2.strokeStyle = '#ffffff'; g2.lineWidth = 1.5; g2.beginPath(); g2.moveTo(x0, y0 + h); g2.lineTo(x0 + w, y0 + h); g2.stroke();
  for (const fn of fns) { g2.globalAlpha = a; g2.strokeStyle = fn.col; g2.lineWidth = 5; g2.shadowColor = fn.col; g2.shadowBlur = 12; g2.lineJoin = 'round'; g2.beginPath(); for (let i = 0; i <= 160; i++) { const tt = t - span + span * i / 160; const v = fn.f(tt); const x = x0 + w * i / 160, y = y0 + h - clamp(v) * h; i ? g2.lineTo(x, y) : g2.moveTo(x, y); } g2.stroke();
    g2.fillStyle = fn.col; g2.beginPath(); g2.arc(x0 + w, y0 + h - clamp(fn.f(t)) * h, 8, 0, 7); g2.fill(); } g2.restore();
  fns.forEach((fn, i) => txt(fn.label, x0 + i * 330, y0 - 28, 22, { align: 'left', spacing: 4, alpha: a * .9, fill: fn.col })); if (label) txt(label, x0 + w, y0 - 28, 22, { align: 'right', spacing: 4, alpha: a * .6 }); }
function absIcon(x, y, s, a) { if (a <= .01) return; g2.save(); g2.globalAlpha = a; g2.strokeStyle = '#ffb030'; g2.fillStyle = '#ffb030'; g2.shadowColor = '#ffb030'; g2.shadowBlur = 30; g2.lineWidth = 9 * s;
  g2.beginPath(); g2.arc(x, y, 70 * s, 0, 7); g2.stroke(); for (const d of [-1, 1]) { g2.beginPath(); g2.arc(x, y, 100 * s, d > 0 ? -.75 : Math.PI - .75, d > 0 ? .75 : Math.PI + .75); g2.stroke(); } g2.restore();
  txt('ABS', x, y + 2, 50 * s, { font: 'Montserrat', weight: 800, alpha: a, fill: '#ffb030', shadow: 25 }); }
function check(x, y, a) { if (a <= .01) return; g2.save(); g2.globalAlpha = a; g2.strokeStyle = '#50f090'; g2.lineWidth = 14; g2.lineCap = 'round'; g2.shadowColor = '#50f090'; g2.shadowBlur = 20; const k = easeOut(clamp(a));
  g2.beginPath(); g2.moveTo(x - 40, y); g2.lineTo(x - 10, y + 30); if (k > .4) g2.lineTo(lerp(x - 10, x + 50, (k - .4) / .6), lerp(y + 30, y - 40, (k - .4) / .6)); g2.stroke(); g2.restore(); }

// cinemática del coche en cada escena
const A_tb = .45, A_v0 = 28, A_dec = 3.6;
const xA = t => t < A_tb ? A_v0 * t : A_v0 * A_tb + A_v0 * (t - A_tb) - .5 * A_dec * (t - A_tb) ** 2;
const B_x0 = 300, B_v0 = 22, B_dec = 6.5, G_dec = 8.5; const B_tL = () => TL.locked - TL.why;
const xB = t => { const tau = t - TL.why, tl = B_tL(); if (tau < tl) return B_x0 + B_v0 * tau; const d = Math.min(tau - tl, B_v0 / B_dec); return B_x0 + B_v0 * tl + B_v0 * d - .5 * B_dec * d * d; };
const vB = t => { const tau = t - TL.why, tl = B_tL(); return tau < tl ? B_v0 : Math.max(0, B_v0 - B_dec * (tau - tl)); };
const S_v0 = 17, S_dec = 5; const sS = t => { const tau = Math.max(0, t - TL.steer); const d = Math.min(tau, S_v0 / S_dec); return -9 + S_v0 * d - .5 * S_dec * d * d; };
const sR = t => -8 + 9 * (t - TL.rolling);
const xD = t => 600 + 20 * (t - TL.abs);
const flF = t => 1 - .68 * smooth(TL.oneWheel + .4, TL.lock + .1, t);
function flAngle(t) { let a = 0; const dt = .02; for (let x = TL.abs; x < t; x += dt) a += flF(x) * dt; return a * 20 / R_W * .15; }

function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .05; camera.far = 9000;
  let bloomS = .8, flash = 0, ca = .0013, fade = 0, grain = .035, expo = 1.2, dim = 0;
  P.begin(); P.mat.size = .25; show({}); hemi.intensity = 2.0; sun.intensity = 3.0; scene.background.setHex(0x05080f); xray(0); setSkids(V3(), 0, 0, false);
  discM.emissive.setRGB(0, 0, 0); caliperM.emissive.setRGB(0, 0, 0); tailM.emissiveIntensity = .4; car.ecu.material.emissive.setRGB(0, 0, 0); car.w.forEach(w => w.ring.material.opacity = 0);
  for (const c of ['why', 'steer', 'rolling', 'abs', 'sensor', 'computer', 'valves', 'pedal', 'curious', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  flash = Math.max(flash, flashAt(t, TL.locked, .25, .25), flashAt(t, TL.lock, .3, .3), flashAt(t, TL.land, .3, .35));
  const hud = [];
  if (t < TL.why) {
    // A · frenazo a fondo: la pinza suelta y aprieta >10 veces por segundo
    show({ road: true, car: true, sky: true }); const x = xA(t); const brk = smooth(A_tb - .1, A_tb + .15, t); const pulse = t > A_tb ? (Math.sin(6.283 * 7 * (t - A_tb)) > 0 ? 1 : .25) : 0;
    poseCar(car, x, 0, 0, -.028 * brk * (1 - .25 * pulse), x / R_W * .12 - .25 * brk * pulse, 0); tailM.emissiveIntensity = .4 + 1.4 * brk;
    caliperM.emissive.setRGB(1.6 * brk * pulse, .5 * brk * pulse, .1 * brk * pulse); discM.emissive.setRGB(.5 * brk * (.4 + .6 * pulse), .14 * brk * (.4 + .6 * pulse), .02 * brk);
    if (t < TL.tenx) camOrbit(V3(x + lerp(.6, .2, t / TL.tenx), .65, 0), lerp(10, 7, easeInOut(t / TL.tenx)), lerp(1.15, .8, t / TL.tenx), .1, 38);
    else { const u = easeInOut(smooth(TL.tenx, TL.tenx + .9, t)); camOrbit(V3(x + 1.4, .38, .9), lerp(7, 1.9, u), lerp(.8, .3, u) + (t - TL.tenx) * .03, lerp(.1, .06, u), 36); }
    expo = 1.3; bloomS = 1;
    hud.push(() => { titleHUD('SI FRENAS A FONDO, TU COCHE…', '…SUELTA Y APRIETA', smooth(.15, .45, t) * (1 - smooth(TL.tenx - .1, TL.tenx + .1, t)), 300); titleHUD('LOS FRENOS', '', smooth(.15, .45, t) * (1 - smooth(TL.tenx - .1, TL.tenx + .1, t)), 200);
      bigStat('VECES POR SEGUNDO', 'MÁS DE 10', 1480, L(t, 'tenx', 'why'), clamp((t - TL.tenx) / 1.5));
      titleHUD('', 'SIN QUE TÚ HAGAS NADA', smooth(TL.tenx + 1.7, TL.tenx + 2, t) * (1 - smooth(TL.why - .1, TL.why + .1, t)), 260);
      callout(wheelWorld(car, 1).add(V3(-.06, .17, .1)), 120, -260, 'PINZA DE FRENO', pulse > .5 ? 'aprieta' : 'suelta', smooth(TL.tenx + .9, TL.tenx + 1.2, t) * (1 - smooth(TL.why - .2, TL.why, t)), pulse > .5 ? '#ff8a50' : '#9ad0ff'); });
  } else if (t < TL.steer) {
    // B · rueda bloqueada: deja de girar, patina, humo y marcas; frena peor que una que gira
    show({ road: true, car: true, sky: true, ghost: t > TL.less }); const x = xB(t); const xL = xB(TL.locked); const lk = t >= TL.locked; const v = vB(t);
    const th = (lk ? xL : x) / R_W * .12; poseCar(car, x, 0, 0, lk && v > 0 ? -.035 : 0, th, 0); tailM.emissiveIntensity = lk ? 1.8 : .4; setSkids(V3(), xL, x, lk);
    if (lk) smoke((te, i) => { const k = i % 4; return V3(xB(te) + WP[k][0] - .3, .08, WP[k][1]); }, TL.locked, TL.locked + (B_v0 / B_dec) - .1, t, 5000, 2.4, .11, 0, 1.6, 2);
    const gx = xL + B_v0 * B_v0 / (2 * G_dec); poseCar(ghost, gx, 0, 0, 0, 0, 0);
    const wide = easeInOut(smooth(TL.less - .3, TL.less + 1.2, t)); const mid = V3((gx + xB(TL.less + 3)) / 2, .6, 0);
    const near = V3(x + .3, .8, 0); const tgt = near.clone().lerp(mid, wide);
    camOrbit(tgt, lerp(t < TL.skid ? lerp(9, 10, (t - TL.why) / 2.6) : lerp(10, 13, smooth(TL.skid, TL.less, t)), 40, wide), lerp(t < TL.skid ? .35 : lerp(.35, .7, smooth(TL.skid, TL.less, t)), .03, wide), lerp(.14, .3, wide), 38);
    P.mat.size = .9; expo = 1.3; bloomS = .9;
    hud.push(() => { titleHUD('¿POR QUÉ? PORQUE UNA', 'RUEDA BLOQUEADA…', L(t, 'why', 'locked'), 300); titleHUD('…ES PELIGROSA:', 'DEJA DE GIRAR…', L(t, 'locked', 'skid'), 300);
      titleHUD('…Y PATINA', 'SOBRE EL ASFALTO', L(t, 'skid', 'less'), 300); titleHUD('AGARRA MENOS', 'TARDA MÁS EN PARAR', L(t, 'less', 'steer'), 300);
      callout(wheelWorld(car, 1), 90, -260, 'RUEDA BLOQUEADA', '0 vueltas', smooth(TL.locked + .3, TL.locked + .6, t) * (1 - smooth(TL.less - .3, TL.less, t)), '#ff7060');
      const ca2 = smooth(TL.less + .8, TL.less + 1.2, t); callout(V3(gx + 1.5, 1.4, 0), 40, -340, 'RUEDAS GIRANDO', 'para antes', ca2, '#50f090'); callout(V3(x - .5, 1.4, 0), -40, -180, 'BLOQUEADAS', 'sigue deslizando', ca2, '#ff7060');
      if (ca2 > .01) { const a = project(V3(gx + 2.3, .2, 1.4)), b = project(V3(x + 2.3, .2, 1.4)); arrowXY(a.x, a.y + 60, b.x, b.y + 60, ca2 * smooth(TL.less + 1.2, TL.less + 1.8, t), '#ff7060', 8); } });
  } else if (t < TL.abs) {
    // B2/C · vista cenital: bloqueada sigue recto aunque gires; girando, sigue la curva
    show({ td: true, car: true }); const roll = t >= TL.rolling; hemi.intensity = 1.5; sun.intensity = 2.6; scene.background.setHex(0x101418);
    let s, pos, yaw, steer; if (!roll) { s = sS(t); pos = V3(s, 0, 0); yaw = 0; steer = .45 * smooth(TL.steer + .1, TL.steer + .6, t); poseCar(car, TD.x + pos.x, TD.z + pos.z, 0, -.03, 0, steer); setSkids(TD, -9, s, true);
      smoke((te, i) => { const k = i % 4; return V3(TD.x + sS(te) + WP[k][0] - .3, .08, TD.z + WP[k][1]); }, TL.steer, TL.steer + S_v0 / S_dec, t, 4000, 2.2, .1, 0, 1.4, 2); }
    else { s = sR(t); pos = arcPt(s); yaw = s < 0 ? 0 : s / RC; steer = .45 * smooth(-3, 0, s); poseCar(car, TD.x + pos.x, TD.z + pos.z, yaw, 0, s / R_W * .2, steer); }
    camOrbit(TD.clone().add(V3(7, 0, -5)), 50, -Math.PI / 2, 1.42, 40); P.mat.size = .9; expo = 1.15;
    const arc = []; for (let i = 0; i <= 60; i++) arc.push(TD.clone().add(arcPt(-9 + i * (9 + 32) / 60)).add(V3(0, .05, 0)));
    hud.push(() => { titleHUD('AUNQUE GIRES EL VOLANTE', 'EL COCHE SIGUE RECTO', L(t, 'steer', 'rolling'), 300);
      worldPath(arc, (roll ? .5 : .9) * smooth(TL.steer + .3, TL.steer + .7, t), '#50f090', [26, 18], 8); const ra = smooth(TL.steer + .9, TL.steer + 1.3, t) * (1 - smooth(TL.rolling - .2, TL.rolling, t));
      if (ra > .01) { const a = project(TD.clone().add(V3(-6, .1, 0))), b = project(TD.clone().add(V3(26, .1, 0))); arrowXY(a.x, a.y, b.x, b.y, ra, '#ff6050', 12); }
      callout(TD.clone().add(arcPt(20)), -50, 70, 'LO QUE QUIERES', null, smooth(TL.steer + .5, TL.steer + .9, t) * (1 - smooth(TL.rolling - .2, TL.rolling, t)), '#50f090');
      callout(TD.clone().add(V3(15, 0, 0)), -50, 0, 'LO QUE HACE', null, ra, '#ff6050');
      titleHUD('UNA RUEDA QUE AÚN GIRA…', '', L(t, 'rolling', 'abs'), 300); titleHUD('', '…AGARRA MUCHO MEJOR', L(t, 'grip', 'abs'), 330);
      callout(wheelWorld(car, 0), -60, -120, 'GIRA = AGARRA', null, smooth(TL.grip, TL.grip + .3, t) * (1 - smooth(TL.abs - .2, TL.abs, t)), '#50f090'); });
  } else if (t < TL.valves && !(t >= TL.sensor && t < TL.computer)) {
    // D/E · ABS en rayos X: sensores en las 4 ruedas, cables a la centralita; una rueda cae → a punto de bloquearse
    show({ road: true, car: true, sky: true }); const x = xD(t); const xr = smooth(TL.abs + .1, TL.abs + .8, t); xray(xr);
    const thO = (x - 600) / R_W * .15; const thF = flAngle(t); poseCar(car, x, 0, 0, 0, [thF, thO, thO, thO], 0);
    car.ecu.material.emissive.setRGB(.35 * xr, .15 * xr, .05 * xr); const lockA = smooth(TL.oneWheel + .4, TL.lock, t);
    car.w.forEach((w, k) => { w.ring.material.opacity = xr * .8; w.ring.material.color.setRGB(k === 0 ? lerp(.25, 1, lockA) : .25, k === 0 ? lerp(1, .3, lockA) : 1, k === 0 ? lerp(.55, .25, lockA) : .55); });
    const s = P.seed; for (let k = 0; k < 4; k++) { const a = wheelWorld(car, k), e = car.ecu.getWorldPosition(V3()); for (let i = 0; i < 70; i++) { const q = ((i + k * 70) % P.n) * 4; const u = fract(s[q] + t * 1.4) * .85; const p = a.clone().lerp(e, u); const f = xr * .45 * (k === 0 ? 1 + 2 * lockA : 1); P.push(p.x, p.y + Math.sin(u * 3.14) * .15, p.z, ORANGE[0] * f, ORANGE[1] * f, ORANGE[2] * f); } }
    const top = t >= TL.computer; camOrbit(V3(x + .2, top ? -.6 : .2, 0), top ? lerp(10.5, 9.5, (t - TL.computer) / 6) : lerp(10, 8.5, (t - TL.abs) / 1.8), top ? .95 + (t - TL.computer) * .03 : .9 + (t - TL.abs) * .04, top ? .62 : .32, 40); P.mat.size = .12; expo = 1.3; bloomS = 1.1;
    hud.push(() => { bigStat('AHÍ ENTRA EL', 'ABS', 1480, L(t, 'abs', 'sensor'), clamp((t - TL.abs) / 1.2)); callout(car.ecu.getWorldPosition(V3()), 60, -300, 'MÓDULO ABS', 'centralita + válvulas', smooth(TL.abs + .6, TL.abs + 1, t) * (t < TL.sensor ? 1 : 0));
      titleHUD('EL ORDENADOR SABE CÓMO', 'GIRA CADA RUEDA', L(t, 'computer', 'oneWheel'), 300); titleHUD('SI UNA FRENA DE GOLPE', 'MÁS QUE LAS OTRAS…', L(t, 'oneWheel', 'lock'), 300);
      titleHUD('…ESTÁ A PUNTO', 'DE BLOQUEARSE', L(t, 'lock', 'valves'), 300);
      const ba = smooth(TL.computer + .3, TL.computer + .7, t); const v = [72 * flF(t), 72, 72, 72]; const nm = ['DEL. IZQ.', 'DEL. DCHA.', 'TRAS. IZQ.', 'TRAS. DCHA.'];
      for (let k = 0; k < 4; k++) bar(140 + (k % 2) * 440, 1420 + Math.floor(k / 2) * 120, 360, v[k] / 80, nm[k], Math.round(v[k]) + ' km/h', ba, k === 0 && lockA > .3 ? '#ff6050' : '#50f090');
      callout(wheelWorld(car, 0), -50, -230, '¡A PUNTO DE BLOQUEARSE!', null, smooth(TL.lock, TL.lock + .3, t), '#ff6050'); });
  } else if (t < TL.computer) {
    // D2 · sensor de rueda: aro dentado + imán que cuenta los dientes
    show({ se: true }); scene.background.setHex(0x070b14); tone.rotation.z = -ringPhi(t); const sg = toothSig(t); const tip = sensorTip();
    const s = P.seed; const fa = smooth(TL.magnet, TL.magnet + .4, t); for (let i = 0; i < 1400; i++) { const q = (i % P.n) * 4; const a = s[q] * 6.283; const u = s[q + 1]; const lp = .2 + s[q + 2] * .7; const ph = fract(s[q + 3] + t * .9);
      const ang = ph * 6.283; const px = Math.cos(a) * lp * (1 + Math.cos(ang)) * .6, py = -Math.abs(Math.sin(ang)) * lp * .9 * (.4 + .6 * sg) + .1, pz = Math.sin(a) * lp * (1 + Math.cos(ang)) * .4; const f = fa * (.15 + .85 * sg) * .5; P.push(tip.x + px, tip.y + py, tip.z + pz, BLUE[0] * f, BLUE[1] * f, BLUE[2] * f); }
    if (fa > 0) ball(tip.clone().add(V3(0, -.1, 0)), 300, .35, BLUE, fa * sg * 1.6, 5000);
    const z = easeInOut(smooth(TL.ring - .3, TL.magnet + .4, t)); camOrbit(SE.clone().add(V3(0, lerp(1.2, 3, z), 0)), lerp(lerp(30, 24, (t - TL.sensor) / 1.6), 10, z), lerp(.5, .38, z) + (t - TL.sensor) * .02, lerp(.25, .1, z), 38); P.mat.size = .12; expo = 1.25; bloomS = 1;
    hud.push(() => { titleHUD('EN CADA RUEDA', 'HAY UN SENSOR', L(t, 'sensor', 'ring'), 300); titleHUD('UN ARO CON DIENTES', 'QUE GIRA CON ELLA', L(t, 'ring', 'magnet'), 300); titleHUD('UN IMÁN CUENTA', 'LOS DIENTES AL PASAR', L(t, 'magnet', 'computer'), 300);
      callout(SE.clone().add(V3(RT * Math.cos(2.5), RT * Math.sin(2.5), .35)), 60, 260, 'ARO DENTADO', 'gira con la rueda', smooth(TL.ring + .3, TL.ring + .6, t), '#e3a372');
      callout(SE.clone().add(V3(.42, RT + 1.5, 0)), 80, -120, 'SENSOR MAGNÉTICO', null, smooth(TL.magnet + .2, TL.magnet + .5, t), '#9ad0ff');
      graph(160, 1440, 760, 110, 1.6, t, [{ f: tt => tt < TL.sensor ? 0 : .1 + .8 * toothSig(tt), col: '#9ad0ff', label: 'SEÑAL' }], smooth(TL.magnet + .5, TL.magnet + .9, t), 'cada pico = 1 diente');
      const n = Math.max(0, Math.floor((ringPhi(t) - ringPhi(TL.magnet + .5)) / (6.283 / NT))); txt(n + ' DIENTES', W / 2, 1650, 34, { font: 'Montserrat', weight: 800, alpha: smooth(TL.magnet + .5, TL.magnet + .9, t) }); });
  } else if (t < TL.pedal) {
    // F · válvulas: quitan presión → la rueda vuelve a girar → aprietan otra vez; suelta/aprieta
    show({ hy: true }); hemi.intensity = 1.2; const p = hydroP(t); hDisc.rotation.z = -hydroAngle(t); const gap = lerp(.3, 0, p);
    pads.forEach(g => g.position.z = g.userData.s * (.175 + .1 + gap)); valves[0].userData.pl.position.y = lerp(.45, 0, p); valves[1].userData.pl.position.y = lerp(0, .45, p);
    valves.forEach((v, k) => v.userData.pl.material.emissive.setRGB(k === 0 ? .6 * p : .1, k === 0 ? .25 * p : .3 * (1 - p), k === 0 ? .05 : .6 * (1 - p)));
    hDiscM.emissive.setRGB(.55 * p, .16 * p, .03 * p);
    const s = P.seed; const col = [lerp(BLUE[0], ORANGE[0], p), lerp(BLUE[1], ORANGE[1], p), lerp(BLUE[2], ORANGE[2], p)]; for (let i = 0; i < 1100; i++) { const q = (i % P.n) * 4; const u = fract(s[q] - t * (.15 + .5 * p)); const pp = linePath.getPointAt(u).add(HY); const f = .7 + .6 * p;
      P.push(pp.x + (s[q + 1] - .5) * .2, pp.y + (s[q + 2] - .5) * .2, pp.z + (s[q + 3] - .5) * .2, col[0] * f, col[1] * f, col[2] * f); }
    camOrbit(HY.clone().add(V3(-.7, 4.0, 0)), lerp(30, 28, clamp((t - TL.valves) / 8)), .45 + (t - TL.valves) * .02, .12, 40); P.mat.size = .14; expo = 1.25; bloomS = 1;
    hud.push(() => { titleHUD('LAS VÁLVULAS LE QUITAN', 'PRESIÓN AL FRENO', L(t, 'valves', 'spin'), 300); titleHUD('LA RUEDA', 'VUELVE A GIRAR…', L(t, 'spin', 'press'), 300); titleHUD('…Y SE VUELVE', 'A APRETAR', L(t, 'press', 'cycle'), 300);
      const cu = (t - TL.cycle) / .53; const w = cu < 4 ? (Math.floor(cu) % 2 ? 'APRIETA' : 'SUELTA') : (p > .575 ? 'APRIETA' : 'SUELTA'); bigStat(cu < 4 ? '' : 'MÁS DE 10 VECES POR SEGUNDO', w, 300, L(t, 'cycle', 'pedal'), .5);
      callout(blk.getWorldPosition(V3()).add(V3(1.7, 0, 0)), 90, 60, 'VÁLVULAS', null, smooth(TL.valves + .3, TL.valves + .7, t) * (1 - smooth(TL.cycle - .2, TL.cycle, t)));
      callout(calG.getWorldPosition(V3()).add(V3(1, 0, 0)), 80, -200, 'PINZA', p > .5 ? 'aprieta el disco' : 'suelta', smooth(TL.valves + .5, TL.valves + .9, t), p > .5 ? '#ff8a50' : '#9ad0ff');
      graph(160, 1560, 760, 130, 3, t, [{ f: hydroP, col: '#ff8a50', label: 'PRESIÓN' }, { f: wheelS, col: '#9ad0ff', label: 'GIRO DE LA RUEDA' }], smooth(TL.valves + .2, TL.valves + .6, t)); });
  } else if (t < TL.curious) {
    // G · el pedal vibra bajo el pie: no es una avería
    show({ pd: true }); hemi.intensity = 2.2; sun.intensity = 3.2; scene.background.setHex(0x10141c); const vib = smooth(TL.pedal + .2, TL.pedal + .5, t);
    const ang = .22 + vib * .018 * Math.sin(6.283 * 13 * t) + vib * .008 * noise1(t * 40); pedal.rotation.z = ang; const pw = padWorld().sub(PD);
    camOrbit(PD.clone().add(V3(.25, .4, -.08)), lerp(1.3, 1.15, clamp((t - TL.pedal) / 5)), -.55 + (t - TL.pedal) * .03, .15, 40); expo = 1.7; bloomS = .9;
    const nf = smooth(TL.notfault, TL.notfault + .4, t); dim = nf * .55;
    hud.push(() => { titleHUD('POR ESO, AL FRENAR FUERTE', 'EL PEDAL VIBRA', L(t, 'pedal', 'notfault'), 300);
      const pp = project(padWorld()); const va = vib * (1 - nf); if (va > .01) { g2.save(); g2.strokeStyle = '#ffb070'; g2.lineWidth = 5; g2.shadowColor = '#ffb070'; g2.shadowBlur = 14; for (let k = 0; k < 3; k++) { const ph = fract(t * 2.5 + k / 3); g2.globalAlpha = va * (1 - ph); g2.beginPath(); g2.arc(pp.x, pp.y, 60 + ph * 140, -1, 1); g2.stroke(); g2.beginPath(); g2.arc(pp.x, pp.y, 60 + ph * 140, Math.PI - 1, Math.PI + 1); g2.stroke(); } g2.restore(); }
      absIcon(W / 2, 860, 1.2, nf); titleHUD('NO ES UNA AVERÍA:', 'ES EL ABS TRABAJANDO', L(t, 'notfault', 'curious'), 300); check(W / 2, 1180, smooth(TL.notfault + .7, TL.notfault + 1.3, t)); });
  } else if (t < TL.brand) {
    // H · el ABS nació para los aviones (años 50): aterrizaje
    show({ pa: true, sky: true }); hemi.intensity = 1.1; sun.intensity = 1.8; const px = planeX(t), alt = planeAlt(TL.land - t); plane.position.set(px, GEAR_H + alt, 0); plane.rotation.z = .02 + .05 * smooth(TL.land - 1.6, TL.land - .2, t) * (1 - smooth(TL.land + .2, TL.land + 1.5, t));
    propsL.forEach(p => p.rotation.x = t * 37); gearW.forEach(w => w.g.rotation.z = -Math.max(0, px - X_TD) / w.r);
    const s = P.seed; for (let i = 0; i < 100; i++) for (const z of [-22, 22]) { const x = -500 + i * 30; const d = Math.abs(x - px); P.push(PA.x + x, .4, PA.z + z, 1.6, 1.3, .8); }
    for (let i = 0; i < 12; i++) P.push(PA.x - 520 - i * 30, .5, PA.z, 1.8, 1.6, 1.2);
    for (const z of [-9, 9]) { const lp = plane.localToWorld(V3(3.4, -.6, z)); ball(lp, 30, .25, [2, 1.9, 1.7], .5, 7000 + z * 10); }
    if (fract(t * .9) < .1) { const b = plane.localToWorld(V3(-2, 1.9, 0)); ball(b, 40, .3, RED, 2, 7400); }
    smoke((te, i) => mainGearW(te, i % 2 ? 1 : -1).add(V3(0, .1, 0)), TL.land, TL.land + .45, t, 4000, 1.8, .14, 0, 2.2, 4);
    const lt = t - TL.curious; const pp = plane.position.clone().add(PA);
    if (t < TL.fifties) camOrbit(pp.clone().add(V3(-2, 0, 0)), lerp(85, 62, clamp(lt / 4.2)), lerp(1.3, .75, clamp(lt / 4.2)), .1, 38);
    else { const u = easeInOut(smooth(TL.fifties, TL.land - .3, t)); camOrbit(pp.clone().add(V3(lerp(-2, 2, u), lerp(0, -2.5, u), lerp(0, 3, u))), lerp(62, 58, u), lerp(.75, 1.15, u), lerp(.1, .05, u), 38); }
    P.mat.size = .9; expo = 1.25; bloomS = 1.1;
    hud.push(() => { titleHUD('Y LO MÁS', 'CURIOSO', L(t, 'curious', 'planes'), 300); titleHUD('NO NACIÓ PARA LOS COCHES', 'SINO PARA LOS AVIONES', L(t, 'planes', 'fifties'), 300);
      bigStat('YA SE USABA EN LOS', 'AÑOS 50', 300 + 100, L(t, 'fifties', 'land'), clamp((t - TL.fifties) / 1.5)); txt('sistema Maxaret · Dunlop', W / 2, 500, 30, { weight: 300, alpha: smooth(TL.fifties + .6, TL.fifties + 1, t) * (1 - smooth(TL.land - .1, TL.land + .1, t)) });
      titleHUD('PARA QUE LAS RUEDAS NO', 'PATINEN NI REVIENTEN', L(t, 'land'), 300); callout(mainGearW(t, 1).add(V3(0, .6, 0)), 60, 220, 'TOMA DE TIERRA', null, smooth(TL.land + .1, TL.land + .4, t), '#e3a372'); });
  } else {
    // I · marca
    show({ road: true, car: true, sky: true }); const lt = t - TL.brand; const x = 1500 + 18 * lt; poseCar(car, x, 0, 0, 0, x / R_W * .12, 0); tailM.emissiveIntensity = 1.2;
    camOrbit(V3(x + 4, 1, -.8), 13 + lt * 1.2, -1.15, .22, 40); expo = 1.1; dim = smooth(0, .8, lt) * .55; bloomS = .9;
    hud.push(() => drawBrand(lt - .3)); fade = smooth(TL.end - .6, TL.end, t) * .3;
  }
  sky.position.copy(camera.position);
  P.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (dim > 0) hud.unshift(() => { g2.save(); g2.globalAlpha = dim * .7; g2.fillStyle = '#02050b'; g2.fillRect(0, 0, W, H); g2.restore(); });
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
function renderCover() { renderFrame(TL.oneWheel + 2.6); coverText('¿POR QUÉ VIBRA', 'EL FRENO?', 'Tu coche suelta y aprieta 10 veces por segundo'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
