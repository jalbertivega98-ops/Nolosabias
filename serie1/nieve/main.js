// NO LO SABÍAS — "¿Por qué cada copo de nieve es distinto?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final.
// Datos: el copo nace en la nube (~−15 °C) sobre un núcleo (polvo, polen) por deposición (vapor → hielo).
// Hielo Ih: red hexagonal → simetría de 6. Diagrama de Nakaya: ~−2 °C placas, ~−5 °C agujas/columnas, ~−15 °C dendritas.
// Caída ~1 m/s: del orden de una hora desde la nube. Brazos iguales porque crecen a la vez en las mismas condiciones.
// Nieve blanca: dispersión múltiple en las caras de los cristales. Nieve recién caída: 90–95 % aire → aislante y absorbe el sonido.
// Cruje (chirría) sobre todo por debajo de unos −10 °C.
import { THREE, mergeGeometries, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3,
  g2, camera, Particles, txt, copperGrad, project, callout, bar, fract, emitRise, emitJet, arrowXY, bigStat, drawBrand, coverText, finish } from '../../lib/core.js';

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(new THREE.Color(.03, .06, .12), .01);
const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uTop: { value: new THREE.Color(.01, .02, .06) }, uHor: { value: new THREE.Color(.06, .12, .24) } },
  vertexShader: `varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 uTop,uHor; varying vec3 vD; void main(){ vec3 d=normalize(vD); float y=clamp(d.y*.5+.5,0.,1.); gl_FragColor=vec4(mix(uHor,uTop,pow(y,.8)),1.); }` });
const sky = new THREE.Mesh(new THREE.SphereGeometry(2800, 32, 16), skyMat); sky.renderOrder = -1; scene.add(sky);
const hemi = new THREE.HemisphereLight(0xcfe4ff, 0x1a2436, 1.3); scene.add(hemi);
const key = new THREE.DirectionalLight(0xf2f6ff, 2.4); key.position.set(4, 8, 10); scene.add(key);
const rim = new THREE.DirectionalLight(0xffb070, 1.2); rim.position.set(-8, 3, -6); scene.add(rim);
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .6, ...o });
const ICE = new THREE.MeshPhysicalMaterial({ color: 0xe6f4ff, emissive: 0x5f9ad0, emissiveIntensity: .45, roughness: .18, metalness: .1, clearcoat: 1, transparent: true, opacity: .93, side: THREE.DoubleSide });
const COP = 0xc8743f;

// ==========================================================================
// GENERADOR DE COPOS (6 brazos idénticos, cada semilla una forma distinta)
// ==========================================================================
function flakeGeo(seed, g, type = 'star') {
  const r = rng(seed); const th = .035; const parts = [];
  if (type === 'plate') { const R = .55 * g; const p = new THREE.CylinderGeometry(R, R, th, 6); p.rotateX(Math.PI / 2); parts.push(p);
    const p2 = new THREE.CylinderGeometry(R * .62, R * .62, th * 2.2, 6); p2.rotateX(Math.PI / 2); parts.push(p2);
    for (let k = 0; k < 6; k++) { const b = new THREE.BoxGeometry(R * .95, .025, th * 2.6); b.translate(R * .47, 0, 0); b.rotateZ(k * Math.PI / 3 + Math.PI / 6); parts.push(b); }
    return mergeGeometries(parts.map(q => q.toNonIndexed())); }
  if (type === 'needle') { const c = new THREE.CylinderGeometry(.07, .07, 1.7 * g, 6); parts.push(c); const c2 = new THREE.CylinderGeometry(.035, .035, 1.75 * g, 6); c2.translate(.02, 0, .02); parts.push(c2);
    return mergeGeometries(parts.map(q => q.toNonIndexed())); }
  const core = .09 + r() * .08; const hub = new THREE.CylinderGeometry(core, core, th * 1.6, 6); hub.rotateX(Math.PI / 2); parts.push(hub);
  const nb = 3 + Math.floor(r() * 4); const br = []; for (let i = 0; i < nb; i++) { const p = .22 + .62 * (i + r() * .6) / nb; br.push({ p, l: (.12 + r() * .32) * (1.1 - p * .7), w: .028 + r() * .022, tip: r() < .45, ang: Math.PI / 3 * (r() < .8 ? 1 : .8) }); }
  const sw = .045 + r() * .025, tipPlate = r() < .6;
  const arm = []; const L = g; const sp = new THREE.BoxGeometry(L, sw, th); sp.translate(L / 2, 0, 0); arm.push(sp);
  if (tipPlate && g > .55) { const tr = .07 * smooth(.55, 1, g) + .02; const tp = new THREE.CylinderGeometry(tr, tr, th, 6); tp.rotateX(Math.PI / 2); tp.translate(L, 0, 0); arm.push(tp); }
  for (const b of br) { if (g <= b.p) continue; const bl = b.l * clamp((g - b.p) / (1 - b.p) * 1.4); if (bl < .01) continue;
    for (const s of [1, -1]) { const bx = new THREE.BoxGeometry(bl, b.w, th); bx.translate(bl / 2, 0, 0); bx.rotateZ(s * b.ang); bx.translate(b.p, 0, 0); arm.push(bx);
      if (b.tip && bl > .08) { const q = new THREE.CylinderGeometry(.035, .035, th, 6); q.rotateX(Math.PI / 2); q.translate(b.p + Math.cos(b.ang) * bl, s * Math.sin(b.ang) * bl, 0); arm.push(q); } } }
  const armG = mergeGeometries(arm.map(q => q.toNonIndexed()));
  for (let k = 0; k < 6; k++) { const a = armG.clone(); a.rotateZ(k * Math.PI / 3); parts.push(a); }
  return mergeGeometries(parts.map(q => q.index ? q.toNonIndexed() : q));
}
function makeFlake(seed, type = 'star', mat = ICE) { const m = new THREE.Mesh(flakeGeo(seed, 1, type), mat); m.userData = { seed, type, g: 1 }; scene.add(m); return m; }
function growFlake(m, g) { g = Math.max(.02, g); if (Math.abs(m.userData.g - g) < 1e-3) return; m.geometry.dispose(); m.geometry = flakeGeo(m.userData.seed, g, m.userData.type); m.userData.g = g; }

// Copos principales
const hero = makeFlake(11); const plate = makeFlake(3, 'plate'); const needle = makeFlake(4, 'needle'); const star = makeFlake(21);
const grid = [5, 8, 13, 17, 29, 33].map(s => makeFlake(s));
// Copos de fondo (instanciados)
const bgGeo = flakeGeo(7, 1); const bg = new THREE.InstancedMesh(bgGeo, ICE, 260); bg.frustumCulled = false; scene.add(bg);
const BGS = (() => { const r = rng(3); return Array.from({ length: 260 }, () => ({ x: (r() - .5) * 26, y: r() * 40, z: -r() * 30 + 4, s: .08 + r() * .14, sp: .6 + r() * .6, rot: r() * 6 })); })();
function snowfall(t, c, scale = 1, speed = 1) { const d = new THREE.Object3D(); bg.visible = true;
  for (let i = 0; i < BGS.length; i++) { const b = BGS[i]; const y = ((b.y - t * b.sp * speed) % 40 + 40) % 40 - 20; d.position.set(c.x + b.x + Math.sin(t * .6 + b.rot) * .4, c.y + y, c.z + b.z); d.rotation.set(t * .5 + b.rot, b.rot, t * .3); d.scale.setScalar(b.s * scale); d.updateMatrix(); bg.setMatrixAt(i, d.matrix); }
  bg.instanceMatrix.needsUpdate = true; }

// ==========================================================================
// NÚCLEO DE POLVO
// ==========================================================================
const dust = new THREE.Mesh(new THREE.IcosahedronGeometry(.09, 1), M(0x6b4a2e, { roughness: .9, emissive: 0x2a1508 })); { const p = dust.geometry.attributes.position; const r = rng(2); for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * (.7 + r() * .6), p.getY(i) * (.7 + r() * .6), p.getZ(i) * (.7 + r() * .6)); dust.geometry.computeVertexNormals(); } scene.add(dust);
const seedPrism = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .5, 6), ICE); seedPrism.rotation.x = Math.PI / 2; scene.add(seedPrism);

// ==========================================================================
// RED DE MOLÉCULAS (hielo hexagonal)
// ==========================================================================
const MOL = V3(0, 500, 0); const mol = new THREE.Group(); mol.position.copy(MOL); scene.add(mol);
let HEXC = []; {
  const verts = new Map(); const S3 = Math.sqrt(3); const key = (x, y) => Math.round(x * 100) + ',' + Math.round(y * 100);
  for (let i = -5; i <= 5; i++) for (let j = -7; j <= 7; j++) { const cx = i * 1.5, cy = j * S3 + (i & 1 ? S3 / 2 : 0); if (Math.hypot(cx, cy * .8) > 9) continue; HEXC.push(V3(cx, cy, 0));
    for (let k = 0; k < 6; k++) { const x = cx + Math.cos(k * Math.PI / 3), y = cy + Math.sin(k * Math.PI / 3); verts.set(key(x, y), V3(x, y, (k & 1) ? .25 : -.25)); } }
  const V = [...verts.values()]; const O = new THREE.InstancedMesh(new THREE.SphereGeometry(.2, 16, 12), M(0xe0503c, { roughness: .35, emissive: 0x3a0a04 }), V.length);
  const Hm = new THREE.InstancedMesh(new THREE.SphereGeometry(.11, 12, 10), M(0xf4f6fa, { roughness: .3, emissive: 0x303844 }), V.length * 2);
  const d = new THREE.Object3D(); const seg = []; let h = 0;
  V.forEach((v, i) => { d.position.copy(v); d.scale.setScalar(1); d.updateMatrix(); O.setMatrixAt(i, d.matrix); const nb = V.filter(u => u !== v && u.distanceTo(v) < 1.15);
    nb.forEach(u => { if (u.x > v.x || (u.x === v.x && u.y > v.y)) seg.push(v.x, v.y, v.z, u.x, u.y, u.z); });
    nb.slice(0, 2).forEach((u, k) => { const p = v.clone().lerp(u, .32); p.z += k ? .12 : -.12; d.position.copy(p); d.updateMatrix(); Hm.setMatrixAt(h++, d.matrix); }); });
  Hm.count = h; mol.add(O, Hm);
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3)); mol.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x9fc4ff, transparent: true, opacity: .55 })));
}
const hexRing = new THREE.Mesh(new THREE.TorusGeometry(1, .07, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffb070 })); hexRing.rotation.z = Math.PI / 6 * 0; mol.add(hexRing);

// ==========================================================================
// CAPAS DE AIRE (caída)
// ==========================================================================
const FALL = V3(500, 0, 0); const fallG = new THREE.Group(); fallG.position.copy(FALL); scene.add(fallG);
const LAYERS = [[.35, .5, .9], [.9, .6, .3], [.4, .8, .7], [.7, .4, .8], [.3, .6, 1], [.9, .8, .4]];
LAYERS.forEach((c, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(40, 7), new THREE.MeshBasicMaterial({ color: new THREE.Color(c[0] * .25, c[1] * .25, c[2] * .25), transparent: true, opacity: .9, depthWrite: false, fog: false })); m.position.set(0, -i * 8, -6); fallG.add(m); });

// ==========================================================================
// HIELO vs NIEVE, CRISTALES (rebote de luz), BLOQUE DE NIEVE
// ==========================================================================
const LAB = V3(-500, 0, 0); const lab = new THREE.Group(); lab.position.copy(LAB); scene.add(lab);
const cube = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6), new THREE.MeshPhysicalMaterial({ color: 0xcfe8ff, roughness: .05, transparent: true, opacity: .28, clearcoat: 1, emissive: 0x0a1a2a, depthWrite: false })); cube.position.set(0, 1.6, 0); lab.add(cube);
const cubeEdges = new THREE.LineSegments(new THREE.EdgesGeometry(cube.geometry), new THREE.LineBasicMaterial({ color: 0xbfe0ff, transparent: true, opacity: .8 })); cube.add(cubeEdges);
const pile = new THREE.Mesh(new THREE.SphereGeometry(1.1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), M(0xf6f9ff, { roughness: .95, emissive: 0x30384a })); { const p = pile.geometry.attributes.position; const r = rng(4); for (let i = 0; i < p.count; i++) { const k = 1 + (r() - .5) * .06; p.setXYZ(i, p.getX(i) * k * 1.2, p.getY(i) * k * .85, p.getZ(i) * k * 1.2); } pile.geometry.computeVertexNormals(); } pile.position.set(0, -1.9, 0); lab.add(pile);
const table = new THREE.Mesh(new THREE.BoxGeometry(5, .12, 2.6), M(0x1c2638, { roughness: .7 })); table.position.set(0, -1.96, 0); lab.add(table);
const XT = V3(-500, 300, 0); const xt = new THREE.Group(); xt.position.copy(XT); scene.add(xt);
const cryst = new THREE.InstancedMesh(new THREE.CylinderGeometry(.5, .5, .08, 6), new THREE.MeshPhysicalMaterial({ color: 0xe6f4ff, emissive: 0x3a6a9a, emissiveIntensity: .5, roughness: .1, transparent: true, opacity: .55, clearcoat: 1, depthWrite: false }), 160);
{ const r = rng(9); const d = new THREE.Object3D(); for (let i = 0; i < 160; i++) { d.position.set((r() - .5) * 9, (r() - .5) * 14, (r() - .5) * 6); d.rotation.set(r() * 6, r() * 6, r() * 6); d.scale.setScalar(.5 + r() * .9); d.updateMatrix(); cryst.setMatrixAt(i, d.matrix); } } xt.add(cryst);
const RAY = (() => { const r = rng(12); const pts = [V3(-7, 6, 0)]; let p = V3(-2.5, 3.5, .5); pts.push(p.clone()); for (let i = 0; i < 9; i++) { p = p.clone().add(V3((r() - .5) * 4, (r() - .5) * 4, (r() - .5) * 2)); p.x = clamp(p.x, -3.5, 3.5); p.y = clamp(p.y, -5, 5); pts.push(p.clone()); } pts.push(V3(7, -6, 1)); return pts; })();
const blockG = new THREE.Group(); blockG.position.set(0, -300, 0); lab.add(blockG); const blockEdges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(4, 4, 4)), new THREE.LineBasicMaterial({ color: 0xbfe0ff, transparent: true, opacity: .7 })); blockG.add(blockEdges);
const blockFl = new THREE.InstancedMesh(flakeGeo(19, .8), ICE, 70); { const r = rng(15); const d = new THREE.Object3D(); for (let i = 0; i < 70; i++) { d.position.set((r() - .5) * 3.4, (r() - .5) * 3.4, (r() - .5) * 3.4); d.rotation.set(r() * 6, r() * 6, r() * 6); d.scale.setScalar(.35 + r() * .25); d.updateMatrix(); blockFl.setMatrixAt(i, d.matrix); } } blockG.add(blockFl);

// ==========================================================================
// PAISAJE NEVADO (iglú, sonido, pisada)
// ==========================================================================
const LAND = V3(0, -500, 0); const land = new THREE.Group(); land.position.copy(LAND); scene.add(land);
{ const g = new THREE.PlaneGeometry(260, 260, 160, 160); g.rotateX(-Math.PI / 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, Math.sin(x * .07) * Math.cos(z * .05) * 1.2 + Math.sin(x * .3 + z * .2) * .15 + (z < -60 ? (-60 - z) * .25 * (1 + Math.sin(x * .05)) : 0)); }
  g.computeVertexNormals(); land.add(new THREE.Mesh(g, M(0xeef4ff, { roughness: .95, emissive: 0x18243a }))); }
const igloo = new THREE.Group(); igloo.position.set(-3, 0, -14); land.add(igloo);
{ const dome = new THREE.Mesh(new THREE.SphereGeometry(3, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), M(0xf2f6ff, { roughness: .9, emissive: 0x1c2840 })); igloo.add(dome);
  const lines = []; for (let k = 1; k < 5; k++) { const a = k / 5 * Math.PI / 2; const ring = new THREE.Mesh(new THREE.TorusGeometry(3.01 * Math.cos(a), .03, 4, 48), M(0xaab8d0)); ring.rotation.x = Math.PI / 2; ring.position.y = 3 * Math.sin(a); igloo.add(ring); }
  const tun = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 2.2, 24, 1, false, 0, Math.PI), M(0xf2f6ff, { roughness: .9, emissive: 0x1c2840, side: THREE.DoubleSide })); tun.rotation.set(Math.PI / 2, 0, -Math.PI / 2); tun.position.set(0, 0, 3.2); igloo.add(tun);
  const door = new THREE.Mesh(new THREE.CircleGeometry(.95, 24, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0xffa050 })); door.position.set(0, 0, 4.31); igloo.add(door); }
const iglooLight = new THREE.PointLight(0xffa050, 0, 14, 1.5); iglooLight.position.set(-3, 1, -9.5); land.add(iglooLight);
const boot = new THREE.Group(); { const bm = M(0x3a2a20, { roughness: .7 }); const sole = new THREE.Mesh(new THREE.BoxGeometry(.5, .14, 1.25), M(0x161618, { roughness: .8 })); sole.position.y = .07; boot.add(sole);
  const up = new THREE.Mesh(new THREE.CylinderGeometry(.24, .27, 1.1, 16), bm); up.position.set(0, .68, -.28); boot.add(up); const toe = new THREE.Mesh(new THREE.SphereGeometry(.26, 16, 10), bm); toe.scale.set(1, .7, 1.5); toe.position.set(0, .28, .2); boot.add(toe);
  const lace = new THREE.Mesh(new THREE.BoxGeometry(.3, .5, .05), M(COP, { emissive: 0x3a1a08 })); lace.position.set(0, .6, .02); lace.rotation.x = -.5; boot.add(lace); } land.add(boot);
const prints = []; for (let i = 0; i < 4; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(.55, 1.3), new THREE.MeshStandardMaterial({ color: 0xaebad4, roughness: 1, transparent: true, opacity: .85 })); p.rotation.x = -Math.PI / 2; land.add(p); prints.push(p); }

// Partículas
const PS = new Particles(30000, { size: .1, seed: 5 }); scene.add(PS.obj);
const ALL = [hero, plate, needle, star, ...grid, bg, dust, seedPrism, mol, fallG, lab, xt, land];

// ==========================================================================
// HUD
// ==========================================================================
function stamp(s, x, y, a, rot = -.08, col = '#ff6a4a', size = 86) { if (a <= .01) return; const sc = lerp(1.6, 1, easeOut(clamp(a * 1.4)));
  g2.save(); g2.translate(x, y); g2.rotate(rot); g2.scale(sc, sc); g2.globalAlpha = clamp(a); g2.strokeStyle = col; g2.lineWidth = 8; g2.shadowColor = col; g2.shadowBlur = 25;
  g2.font = `800 ${size}px Montserrat`; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.letterSpacing = '6px'; const w = g2.measureText(s).width + 70; g2.strokeRect(-w / 2, -size * .8, w, size * 1.6); g2.fillStyle = col; g2.fillText(s, 0, 4); g2.restore(); }
function two(top, l1, l2, a, y = 300) { if (a <= .01) return; txt(l1, W / 2, y, 50, { font: 'Montserrat', weight: 800, alpha: a }); if (l2) txt(l2, W / 2, y + 62, 50, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(160, 920, y + 62, .5) }); if (top) txt(top, W / 2, y - 62, 24, { spacing: 7, alpha: a * .8, fill: '#e3a372' }); }
const win = (t, a, b, f = .3) => smooth(a, a + f, t) * (1 - smooth(b - f, b, t));
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
function polyPS(pts, head, col, n = 60) { const segs = pts.length - 1; for (let s = 0; s < segs; s++) { const u0 = s / segs; if (u0 > head) break; const u1 = Math.min((s + 1) / segs, head); const f = (u1 - u0) * segs;
  for (let i = 0; i <= n * f; i++) { const p = pts[s].clone().lerp(pts[s + 1], i / n); PS.push(p.x, p.y, p.z, col[0], col[1], col[2]); } } }
function label(w, s, sub, a, col = '#ffe2c0') { if (a <= .01) return; const p = project(w); txt(s, p.x, p.y, 34, { font: 'Montserrat', weight: 800, alpha: a, fill: col }); if (sub) txt(sub, p.x, p.y + 40, 26, { alpha: a * .85 }); }

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .02; camera.far = 6000; camera.fov = 42;
  let bloomS = .5, flash = 0, ca = .0012, fade = 0, expo = 1.05;
  PS.begin(); PS.mat.size = .1; for (const o of ALL) o.visible = false; scene.fog.density = .01; scene.fog.color.setRGB(.03, .06, .12); hemi.intensity = 1.3; key.intensity = 2.4; rim.intensity = 1.2; iglooLight.intensity = 0; boot.visible = false; prints.forEach(p => p.visible = false);
  skyMat.uniforms.uTop.value.setRGB(.01, .02, .06); skyMat.uniforms.uHor.value.setRGB(.06, .12, .24); ICE.emissiveIntensity = .45;
  for (const c of ['cloud', 'six', 'hex', 'shape', 'fall', 'unique', 'white', 'bounce', 'air', 'warm', 'crunch', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];

  if (t < TL.cloud) {
    // A · gancho: un copo enorme entre la nevada
    hero.visible = true; growFlake(hero, 1); hero.position.set(0, 0, 0); hero.rotation.set(.25 + Math.sin(t * .7) * .1, t * .45, t * .15); snowfall(t, V3(0, 0, -2), 1.2);
    camera.position.set(0, -.2, lerp(4.4, 3.9, t / TL.cloud)); camera.lookAt(0, -.15, 0); bloomS = .7;
    hud.push(() => two(null, '¿POR QUÉ CADA COPO', 'ES DISTINTO?', smooth(.05, .3, t), 300));
  } else if (t < TL.six) {
    // B · dentro de la nube: núcleo de polvo y vapor que se congela
    const lt = t - TL.cloud; dust.visible = true; dust.position.set(0, 0, 0); dust.rotation.set(t * .3, t * .5, 0); scene.fog.density = .02; scene.fog.color.setRGB(.12, .15, .2);
    skyMat.uniforms.uTop.value.setRGB(.1, .12, .16); skyMat.uniforms.uHor.value.setRGB(.16, .19, .25);
    const z = smooth(TL.dust - .6, TL.dust + 1, t); camera.position.set(Math.sin(t * .2) * lerp(3, .3, z), lerp(1, .05, z), lerp(14, .9, easeInOut(z))); camera.lookAt(0, 0, 0);
    const s = PS.seed; for (let i = 0; i < 4000; i++) { const q = i * 4; const x = (s[q] - .5) * 30, y = (s[q + 1] - .5) * 40, zz = (s[q + 2] - .5) * 30; const f = .09; PS.push(x + Math.sin(t * .3 + i) * .5, y, zz, f, f * 1.05, f * 1.15); } PS.mat.size = lerp(3, .9, z);
    const va = smooth(TL.vapor, TL.vapor + .5, t); if (va > 0) { PS.mat.size = .03; for (let i = 0; i < 2500; i++) { const q = i * 4; const u = fract(s[q] + t * .35); const R = lerp(.9, .1, u); const th = s[q + 1] * 6.283 + u * 2, ph = (s[q + 2] - .5) * 2.4;
      const f = va * smooth(0, .2, u) * (1 - smooth(.85, 1, u)) * .8; PS.push(R * Math.cos(th) * Math.cos(ph), R * Math.sin(ph), R * Math.sin(th) * Math.cos(ph), f * .5, f * .8, f * 1.4); } }
    const gr = smooth(TL.vapor + .8, TL.six, t); seedPrism.visible = gr > 0; seedPrism.position.set(0, 0, 0); seedPrism.scale.set(lerp(.05, .2, gr), lerp(.05, .14, gr), lerp(.05, .2, gr)); seedPrism.rotation.set(Math.PI / 2 + .4, t * .4, 0);
    hud.push(() => { const ca1 = win(t, TL.cloud, TL.dust); two(null, 'TODO EMPIEZA', 'DENTRO DE UNA NUBE', ca1, 300); bigStat('A UNOS', '−15 °C', 1450, ca1, .5);
      const da = win(t, TL.dust, TL.vapor); two(null, 'ALREDEDOR DE', 'UNA MOTA DE POLVO', da, 300); if (da > 0) callout(dust.position, 140, 220, 'NÚCLEO', 'polvo, polen o sal', da, '#ffb070');
      two(null, 'EL VAPOR SE CONGELA', 'DIRECTAMENTE', smooth(TL.vapor, TL.vapor + .3, t), 300); stamp('SIN PASAR POR LÍQUIDO', W / 2, 1500, smooth(TL.vapor + 1.6, TL.vapor + 1.9, t), -.05, '#9fd0ff', 52); });
  } else if (t < TL.hex) {
    // C · ¿por qué seis brazos? el prisma se ramifica
    const lt = t - TL.six; hero.visible = true; growFlake(hero, lerp(.15, .55, smooth(TL.six, TL.hex, t))); hero.position.set(0, 0, 0); hero.rotation.set(0, Math.sin(t * .5) * .3, t * .1); snowfall(t, V3(0, 0, -6), .8, .5);
    camera.position.set(0, 0, lerp(2, 2.4, lt / 2)); camera.lookAt(0, 0, 0); bloomS = .7;
    hud.push(() => { two(null, '¿Y POR QUÉ SIEMPRE', 'TIENE SEIS BRAZOS?', smooth(.05, .3, lt), 300); });
  } else if (t < TL.shape) {
    // D · moléculas en hexágonos
    const lt = t - TL.hex; mol.visible = true; mol.rotation.set(-.35 + lt * .03, lt * .05, 0); scene.fog.density = .012;
    const z = smooth(TL.hex, TL.shape, t); camera.position.copy(MOL).add(V3(0, -1.5, lerp(7, 15, easeInOut(z)))); camera.lookAt(MOL); hexRing.material.color.setRGB(1, .55 + .2 * Math.sin(t * 6), .25); hexRing.scale.setScalar(1 + .04 * Math.sin(t * 6));
    hud.push(() => { two(null, 'LAS MOLÉCULAS DE AGUA', 'SE ENGANCHAN EN HEXÁGONOS', smooth(.05, .3, lt), 300); callout(MOL.clone().add(V3(.5, -.87, 0).applyEuler(mol.rotation)), 40, 420, 'HEXÁGONO', '6 lados → 6 brazos', smooth(1, 1.4, lt), '#ffb070');
      const p = project(MOL.clone().add(V3(-4, -4.5, 0).applyEuler(mol.rotation))); const a = smooth(.5, .9, lt); txt('● oxígeno', W / 2 - 160, 1700, 32, { alpha: a, fill: '#ff7a5c', font: 'Montserrat', weight: 700 }); txt('● hidrógeno', W / 2 + 160, 1700, 32, { alpha: a, fill: '#f4f6fa', font: 'Montserrat', weight: 700 }); });
  } else if (t < TL.fall) {
    // E · la forma depende del frío: placas, agujas, estrellas
    const lt = t - TL.shape; for (const m of [plate, needle, star]) m.visible = true; snowfall(t, V3(0, 0, -10), .7, .4);
    const ap = smooth(TL.plates - .2, TL.plates + .4, t), an = smooth(TL.needles - .2, TL.needles + .4, t), as = smooth(TL.stars - .2, TL.stars + .6, t);
    growFlake(plate, Math.max(.02, ap)); growFlake(needle, Math.max(.02, an)); growFlake(star, Math.max(.02, as));
    plate.position.set(0, .75, 0); plate.rotation.set(.5, t * .5, 0); needle.position.set(0, -.55, 0); needle.rotation.set(.2, t * .6, 1.2); star.position.set(0, -1.95, 0); star.rotation.set(.3, t * .4, t * .1);
    camera.position.set(0, -.5, 6.6); camera.fov = 40; camera.lookAt(0, -.45, 0); bloomS = .65;
    hud.push(() => { two(null, 'PERO LA FORMA', 'DEPENDE DEL FRÍO', smooth(.05, .3, lt), 250);
      const rows = [[plate, '−2 °C', 'PLACAS', ap], [needle, '−5 °C', 'AGUJAS', an], [star, '−15 °C', 'ESTRELLAS', as]];
      for (const [m, tc, nm, a] of rows) { const p = project(m.position); txt(tc, 210, p.y - 18, 52, { font: 'Montserrat', weight: 800, alpha: a, fill: '#9fd0ff' }); txt(nm, 870, p.y - 18, 40, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(700, 1040, p.y, .5) }); } });
  } else if (t < TL.same) {
    // F · la caída: casi una hora cruzando aire distinto → cada copo es único
    const lt = t - TL.fall;
    if (t < TL.unique) { fallG.visible = true; hero.visible = true; const u = clamp(lt / (TL.unique - TL.fall)); const y = -u * 40; growFlake(hero, lerp(.25, 1, u)); hero.position.copy(FALL).add(V3(Math.sin(u * 9) * .6, y, 0)); hero.rotation.set(.35 + Math.sin(t * 1.3) * .15, Math.sin(t * .9) * .35, t * .3);
      camera.position.copy(hero.position).add(V3(0, .8, 5.5)); camera.lookAt(hero.position); scene.fog.density = 0;
      const li = Math.min(LAYERS.length - 1, Math.floor(-y / 8 + .5)); const lc = LAYERS[li]; skyMat.uniforms.uTop.value.setRGB(lc[0] * .15, lc[1] * .15, lc[2] * .15); skyMat.uniforms.uHor.value.setRGB(lc[0] * .25, lc[1] * .25, lc[2] * .25);
      const s = PS.seed; for (let i = 0; i < 1500; i++) { const q = i * 4; PS.push(hero.position.x + (s[q] - .5) * 12, hero.position.y + ((s[q + 1] + t * .6) % 1 - .5) * 16, hero.position.z + (s[q + 2] - .5) * 6 - 2, .3, .35, .45); } PS.mat.size = .05;
      const LBL = [['−12 °C', 'seco'], ['−14 °C', 'húmedo'], ['−6 °C', 'muy húmedo'], ['−16 °C', 'seco'], ['−4 °C', 'húmedo'], ['−9 °C', 'nube baja']];
      hud.push(() => { two(null, 'CADA COPO TARDA', 'CASI UNA HORA EN CAER', smooth(.05, .3, lt), 300); const [a1, a2] = LBL[li]; txt(a1, W - 200, 1400, 56, { font: 'Montserrat', weight: 800, alpha: smooth(.3, .6, lt), fill: '#9fd0ff' }); txt(a2, W - 200, 1460, 30, { alpha: smooth(.3, .6, lt) });
        txt('CRUZANDO AIRE DISTINTO', W / 2, 1650, 34, { font: 'Montserrat', weight: 700, alpha: smooth(1.6, 2, lt), fill: '#ffe2c0' }); });
    } else { const lu = t - TL.unique; grid.forEach((m, i) => { m.visible = true; const cx = (i % 2 - .5) * 2.0, cy = [.95, -.6, -2.15][Math.floor(i / 2)]; m.position.set(cx, cy, 0); m.rotation.set(.2 * Math.sin(t + i), t * .35 + i, t * .1); m.scale.setScalar(.68 * easeOut(smooth(i * .08, i * .08 + .4, lu))); });
      snowfall(t, V3(0, 0, -10), .7, .4); camera.position.set(0, -.2, 8.2); camera.fov = 42; camera.lookAt(0, -.25, 0); bloomS = .6;
      hud.push(() => { two(null, 'CADA UNO VIVE', 'UN VIAJE ÚNICO', smooth(.05, .3, lu), 250); stamp('NINGUNO IGUAL', W / 2, 1800, smooth(1, 1.3, lu), -.04, '#ffe2c0', 60); }); }
  } else if (t < TL.white) {
    // G · brazos iguales: crecen a la vez
    const lt = t - TL.same; star.visible = true; star.scale.setScalar(1); const g = t < TL.grow ? 1 : lerp(.08, 1, easeInOut(smooth(TL.grow + .2, TL.white - .3, t))); growFlake(star, g); star.position.set(0, -.1, 0); star.rotation.set(0, 0, t * .08);
    snowfall(t, V3(0, 0, -8), .6, .4); camera.position.set(0, -.25, 4.3); camera.lookAt(0, -.25, 0); bloomS = .7;
    const s = PS.seed; if (t > TL.grow) for (let i = 0; i < 2500; i++) { const q = i * 4; const a = s[q] * 6.283, rr = 1.6 - fract(s[q + 1] + t * .4) * 1.2; PS.push(Math.cos(a) * rr, Math.sin(a) * rr - .1, (s[q + 2] - .5) * .3, .2, .35, .6); } PS.mat.size = .03;
    hud.push(() => { two(null, '¿Y POR QUÉ SUS SEIS', 'BRAZOS SON IGUALES?', win(t, TL.same, TL.grow), 300); two(null, 'CRECEN A LA VEZ', 'EN EL MISMO AIRE', smooth(TL.grow, TL.grow + .3, t), 300);
      if (t < TL.grow) for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + t * .08; const p = project(V3(Math.cos(a) * 1.08, Math.sin(a) * 1.08 - .1, 0)); g2.save(); g2.globalAlpha = smooth(TL.same + .5, TL.same + .9, t) * (.6 + .4 * Math.sin(t * 6)); g2.strokeStyle = '#ffb070'; g2.lineWidth = 5; g2.beginPath(); g2.arc(p.x, p.y, 38, 0, 6.283); g2.stroke(); g2.restore(); } });
  } else if (t < TL.air) {
    if (t < TL.bounce) {
      // H · hielo transparente vs nieve blanca
      const lt = t - TL.white; lab.visible = true; for (const o of [blockEdges, blockFl]) o.visible = false; cube.visible = pile.visible = table.visible = true;
      cube.position.set(0, .85, 0); cube.rotation.set(.3, t * .3, 0); pile.position.set(0, -1.9, 0); camera.position.copy(LAB).add(V3(0, .1, 10)); camera.lookAt(LAB.clone().add(V3(0, -.5, 0))); scene.fog.density = 0; key.intensity = 3;
      hud.push(() => { two(null, 'SI EL HIELO ES TRANSPARENTE,', '¿POR QUÉ LA NIEVE ES BLANCA?', smooth(.05, .3, lt), 300); label(LAB.clone().add(V3(0, -.42, 0)), 'HIELO', 'transparente', smooth(.6, .9, lt)); label(LAB.clone().add(V3(0, -2.65, 0)), 'NIEVE', 'blanca', smooth(1, 1.3, lt)); });
    } else {
      // I · la luz rebota en millones de caras → todos los colores → blanco
      const lt = t - TL.bounce; xt.visible = true; xt.rotation.set(0, Math.sin(t * .2) * .1, 0); scene.fog.density = 0; camera.position.copy(XT).add(V3(0, 0, 16)); camera.lookAt(XT); bloomS = .9;
      const pts = RAY.map(p => p.clone().add(XT)); const head = smooth(TL.bounce + .2, TL.mix - .2, t);
      if (t < TL.mix) polyPS(pts, head, [2.2, 2.1, 1.8], 90); else { const m = smooth(TL.mix, TL.mix + 1.4, t);
        const C = [[2.4, .3, .3], [.3, 2.4, .5], [.4, .6, 2.6]]; const tgt = XT.clone().add(V3(0, -2, 1)); C.forEach((c, k) => { const from = XT.clone().add(V3(-6, 5.5 - k * 4, 0)); polyPS([from, tgt], m, c, 120); });
        if (m >= 1) { const o = smooth(TL.mix + 1.4, TL.mix + 2.2, t); polyPS([tgt, XT.clone().add(V3(6, -6.5, 1))], o, [2.6, 2.6, 2.6], 120); } }
      PS.mat.size = .3;
      hud.push(() => { two(null, 'LA LUZ REBOTA EN MILLONES', 'DE CARAS DIMINUTAS', win(t, TL.bounce, TL.mix), 300); two(null, 'Y SALEN TODOS', 'LOS COLORES MEZCLADOS', smooth(TL.mix, TL.mix + .3, t), 300); stamp('= BLANCO', W / 2, 1650, smooth(TL.mix + 2.1, TL.mix + 2.4, t), -.05, '#ffffff', 70); });
    }
  } else if (t < TL.warm) {
    // J · casi todo aire
    const lt = t - TL.air; lab.visible = true; cube.visible = pile.visible = table.visible = false; blockEdges.visible = blockFl.visible = true; const C = LAB.clone().add(V3(0, -300, 0));
    blockG.rotation.set(.35, lt * .25, 0);
    camera.position.copy(C).add(V3(0, -.6, 12)); camera.lookAt(C.clone().add(V3(0, -.3, 0))); scene.fog.density = 0;
    hud.push(() => { two(null, 'LA NIEVE RECIÉN CAÍDA', 'ES CASI TODO AIRE', smooth(.05, .3, lt), 300); const a = smooth(.8, 1.2, lt); bar(140, 1560, 800, .9 * smooth(1, 2.2, lt), 'AIRE', Math.round(90 * smooth(1, 2.2, lt)) + ' %', a, '#9fd0ff'); bar(140, 1700, 800, .1 * smooth(1, 2.2, lt), 'HIELO', Math.round(10 * smooth(1, 2.2, lt)) + ' %', a, '#ffe2c0'); });
  } else {
    // K · paisaje nevado: iglú, silencio, crujido
    land.visible = true; scene.fog.density = .018; scene.fog.color.setRGB(.05, .08, .16); skyMat.uniforms.uTop.value.setRGB(.01, .02, .06); skyMat.uniforms.uHor.value.setRGB(.08, .12, .24); hemi.intensity = .9; key.intensity = 1.2; key.position.set(-6, 10, 8);
    if (t < TL.quiet) { const lt = t - TL.warm; iglooLight.intensity = 10; const ig = LAND.clone().add(V3(-3, 0, -14)); camera.position.copy(ig).add(V3(lerp(7, 5, lt / 1.6), 3, 19)); camera.lookAt(ig.clone().add(V3(0, 1.6, 0))); snowfall(t, ig.clone().add(V3(0, 8, 6)), .6, .5);
      hud.push(() => { two(null, 'POR ESO', 'AÍSLA DEL FRÍO', smooth(.05, .3, lt), 300); callout(ig.clone().add(V3(0, 3, 0)), 140, -180, 'IGLÚ', 'dentro: hasta 0 °C o más', smooth(.4, .8, lt), '#ffb070'); });
    } else if (t < TL.crunch) { const lt = t - TL.quiet; iglooLight.intensity = 8; const C = LAND.clone(); camera.position.copy(C).add(V3(0, 9, 24)); camera.lookAt(C.clone().add(V3(0, 0, -6))); snowfall(t, C.clone().add(V3(0, 10, 4)), .6, .5);
      const S = C.clone().add(V3(-2.5, 1.0, 7)); const s = PS.seed; for (let ring = 0; ring < 7; ring++) { const rr = fract(t * .35 + ring / 7) * 22; const amp = Math.exp(-rr / 5); for (let i = 0; i < 260; i++) { const a = i / 260 * 6.283; PS.push(S.x + Math.cos(a) * rr, S.y + .3 + Math.sin(a * 9 + t * 8) * .08, S.z + Math.sin(a) * rr, amp * 1.6, amp * 1.1, amp * .6); } }
      for (let i = 0; i < 60; i++) PS.push(S.x + (PS.seed[i * 4] - .5) * .5, S.y + PS.seed[i * 4 + 1] * .6, S.z, 2, 1.2, .6); PS.mat.size = .3;
      hud.push(() => { two(null, 'TRAS UNA NEVADA', 'TODO QUEDA EN SILENCIO', win(t, TL.quiet, TL.quiet + 2.3), 300); two(null, 'EL AIRE ATRAPADO', 'SE TRAGA EL SONIDO', smooth(TL.quiet + 2.3, TL.quiet + 2.6, t), 300); callout(S, 120, -260, 'SONIDO', 'se apaga en la nieve', smooth(.5, .9, lt), '#ffb070'); });
    } else { const lt = t - TL.crunch; const C = LAND.clone(); boot.visible = true; const step = Math.floor(lt / .62), ph = fract(lt / .62); const k = Math.min(step, 3);
      const bx = (k % 2 ? .45 : -.45), bz = 3 - k * 1.5; boot.position.set(bx, lerp(.9, -.05, easeInOut(clamp(ph * 1.6))) + (ph > .8 ? (ph - .8) * 3 : 0) * (step < 3 ? 1 : 0), bz); boot.rotation.set(-.15 * (1 - clamp(ph * 1.6)), 0, 0);
      prints.forEach((p, i) => { p.visible = i < step || (i === step && ph > .62); p.position.set((i % 2 ? .45 : -.45), .06 + Math.sin(i) * .01, 3 - i * 1.5); }); boot.visible = true;
      camera.position.copy(C).add(V3(3.2, 3.4, 8.8)); camera.lookAt(C.clone().add(V3(0, .1, 1))); snowfall(t, C.clone().add(V3(0, 6, 0)), .4, .5);
      for (let i = 0; i <= Math.min(step, 3); i++) { const tt = lt - i * .62 - .38; if (tt > 0 && tt < .9) emitJet(PS, C.clone().add(V3((i % 2 ? .45 : -.45), .1, 3 - i * 1.5)), V3(0, 1, 0), 300, tt, 1.6, 1.4, .8, [1.1, 1.15, 1.3], 9.8, i * 7); } PS.mat.size = .05;
      hud.push(() => { two(null, 'SI CRUJE AL PISARLA…', null, smooth(.05, .3, lt), 300); bigStat('ESTÁIS A MÁS DE', '−10 °C', 520, smooth(1.4, 1.8, lt), .5);
        for (let i = 0; i <= Math.min(step, 3); i++) { const a = win(lt, i * .62 + .38, i * .62 + .9, .1); if (a > 0) stamp('CRUNCH', W / 2 + (i % 2 ? 180 : -180), 1500 - i * 40, a, (i % 2 ? .1 : -.1), '#ffe2c0', 48); } }); }
  }
  if (t >= TL.brand) {
    for (const o of ALL) o.visible = false; land.visible = true; boot.visible = false; prints.forEach(p => p.visible = false); const lt = t - TL.brand; iglooLight.intensity = 9; const C = LAND.clone(); camera.position.copy(C).add(V3(4, 2.4, 6)); camera.lookAt(C.clone().add(V3(-2, 2.4, -14)));
    snowfall(t, C.clone().add(V3(0, 8, -4)), .6, .5); fade = Math.min(.45, lt * .45); hud.length = 0; hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  sky.position.copy(camera.position); PS.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, bloom: bloomS, expo });
}
function renderCover() { renderFrame(.9); coverText('¿POR QUÉ CADA', 'COPO ES ÚNICO?', 'el viaje de un copo de nieve'); }
window.renderCover = () => { renderCover(); return true; };
window.OBJ = { PS, scene };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
