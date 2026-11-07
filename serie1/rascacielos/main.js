// NO LO SABÍAS — "¿Cómo aguanta un rascacielos un terremoto?" (Taipei 101)
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final.
// Referencia: Taipei 101 (508 m con la aguja; 101 plantas; núcleo + 8 megacolumnas de acero rellenas de hormigón;
// 380 pilotes hasta 80 m; amortiguador de masa sintonizada de 660 t entre las plantas 87 y 92, esfera de ~5,5 m;
// 8 amortiguadores hidráulicos; reduce el balanceo hasta un 40 %; tifón Soudelor 2015: la esfera se movió 1 m).
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, noise1, shake, V3,
  renderer, g2, camera, SOFT, sea, U, SUN_DIR, skyDome, abyss, ocean, Particles,
  txt, copperGrad, project, fmt, callout, arrow2D, titleHUD, fract, camOrbit, arrowXY, bigStat, drawBrand, coverText, finish } from '../../lib/core.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

abyss.visible = false; ocean.visible = false; skyDome.renderOrder = -1;
const FLOOR = 4.2;
// ==========================================================================
// MATERIALES
// ==========================================================================
function windowTex(seed, lit = .35) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const x = c.getContext('2d'); const r = rng(seed);
  x.fillStyle = '#000'; x.fillRect(0, 0, 256, 256);
  for (let j = 0; j < 8; j++) for (let i = 0; i < 16; i++) { const on = r() < lit; const k = on ? 150 + r() * 105 : 8 + r() * 10;
    x.fillStyle = on ? `rgb(${k},${k * .78 | 0},${k * .5 | 0})` : `rgb(${k},${k},${k + 4})`; x.fillRect(i * 16 + 2, j * 32 + 5, 12, 22); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
const WT = windowTex(3, .45);
const glassMat = new THREE.MeshStandardMaterial({ color: 0x2d6a6a, metalness: .55, roughness: .28, emissive: new THREE.Color(1, .8, .55), emissiveMap: WT, emissiveIntensity: 2.0 });
const xrayMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  uniforms: { uA: { value: 1 }, uCol: { value: new THREE.Color(.3, .7, 1.15) } },
  vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform float uA; uniform vec3 uCol; varying vec3 vN; varying vec3 vV; void main(){ float f=pow(clamp(1.-abs(dot(vN,vV)),0.,1.),2.); gl_FragColor=vec4(uCol*(f*.8+.05),uA*(f*.7+.05)); }` });
const edgeMat = new THREE.LineBasicMaterial({ color: new THREE.Color(.35, .8, 1.3), transparent: true, opacity: .45, blending: THREE.AdditiveBlending, depthWrite: false });
const colMat = new THREE.MeshStandardMaterial({ color: 0x8a6040, roughness: .4, metalness: .6, emissive: new THREE.Color(1.6, .75, .35), emissiveIntensity: .6 });
const coreMat = new THREE.MeshStandardMaterial({ color: 0x506070, roughness: .5, metalness: .4, emissive: new THREE.Color(.3, .7, 1.2), emissiveIntensity: .25, transparent: true, opacity: .55 });
const goldMat = new THREE.MeshStandardMaterial({ color: 0xe0a640, metalness: 1, roughness: .22, emissive: new THREE.Color(.5, .3, .1), emissiveIntensity: .15 });
const redX = xrayMat.clone(); redX.uniforms = { uA: { value: 1 }, uCol: { value: new THREE.Color(1.3, .35, .25) } };

// ==========================================================================
// TORRE (rebanadas que se pueden doblar: primer modo de vibración)
// ==========================================================================
const HROOF = 424, HTOP = 508;
const SECS = [[0, 36, 68, 60], [36, 72, 60, 52], [72, 109, 52, 44]];
for (let i = 0; i < 8; i++) SECS.push([109 + i * 33.6, 109 + (i + 1) * 33.6, 41, 51]);
SECS.push([377.8, 400, 34, 30], [400, 424, 27, 22], [424, 450, 11, 8], [450, 508, 3.2, .5]);
const mode1 = h => 1 - Math.cos(Math.PI / 2 * clamp(h / HTOP));
function sqFrustum(h, wb, wt) { const g = new THREE.CylinderGeometry(wt / Math.SQRT2, wb / Math.SQRT2, h, 4, 1, false); g.rotateY(Math.PI / 4); g.translate(0, h / 2, 0); const n = g.toNonIndexed(); n.computeVertexNormals(); return n; }
function buildTower(withInternals = true) {
  const g = new THREE.Group(); const slices = [];
  SECS.forEach(([h0, h1, wb, wt], si) => {
    const s = new THREE.Group(); s.position.y = h0; g.add(s);
    const geo = sqFrustum(h1 - h0, wb, wt); const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 4 * wb / 34, uv.getY(i) * (h1 - h0) / (FLOOR * 8));
    const shell = new THREE.Mesh(geo, glassMat); s.add(shell);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat); edges.visible = false; s.add(edges);
    // aleros de cada módulo (la "pagoda")
    if (si >= 3 && si < 11) { const lip = new THREE.Mesh(sqFrustum(1.6, wt + 1.2, wt + 2.2), new THREE.MeshStandardMaterial({ color: 0x1d3b3d, metalness: .6, roughness: .3 })); lip.position.y = h1 - h0 - 1.6; s.add(lip); s.userData.lip = lip; }
    const inner = new THREE.Group(); inner.visible = false; s.add(inner);
    if (withInternals && h1 <= HROOF + 1) {
      const hh = h1 - h0; const cw = Math.min(22, wt * .55);
      const core = new THREE.Mesh(new THREE.BoxGeometry(cw, hh, cw), coreMat); core.position.y = hh / 2; inner.add(core);
      const off = Math.min(wb, wt) / 2 - 3.5, o2 = off * .42;
      if (h1 <= 378) for (const [x, z] of [[off, o2], [off, -o2], [-off, o2], [-off, -o2], [o2, off], [-o2, off], [o2, -off], [-o2, -off]]) { const c = new THREE.Mesh(new THREE.BoxGeometry(3.2, hh, 3.2), colMat); c.position.set(x, hh / 2, z); inner.add(c); }
      // forjados
      for (let y = 0; y < hh; y += FLOOR * 2) { const f = new THREE.Mesh(new THREE.BoxGeometry(Math.min(wb, wt) - 2, .3, Math.min(wb, wt) - 2), xrayMat); f.position.y = y; inner.add(f); }
    }
    slices.push({ s, h0, h1, shell, edges, inner });
  });
  g.userData.slices = slices; return g;
}
function setXray(tw, k, mat = xrayMat) { for (const sl of tw.userData.slices) { sl.shell.material = k ? mat : glassMat; sl.edges.visible = !!k; sl.inner.visible = !!k && mat === xrayMat; if (sl.s.userData.lip) sl.s.userData.lip.visible = !k; } }
// desplazamiento lateral: base en gx, cabeza con amplitud A (m)
function sway(tw, gx, A, extra = null) {
  for (const sl of tw.userData.slices) { const u0 = A * mode1(sl.h0), u1 = A * mode1(sl.h1);
    let x = gx + u0; if (extra) x += extra(sl.h0); sl.s.position.x = x; sl.s.rotation.z = -Math.atan2(u1 - u0, sl.h1 - sl.h0); }
}
const tower = buildTower(true); sea.add(tower);
const rigid = buildTower(false); sea.add(rigid); rigid.visible = false; setXray(rigid, 1, redX);
// Esfera del amortiguador dentro de la torre (visible en rayos X)
const tmdT = new THREE.Group(); tower.add(tmdT); tmdT.visible = false;
{ const sp = new THREE.Mesh(new THREE.SphereGeometry(2.75, 40, 24), goldMat); sp.position.y = -6; tmdT.add(sp);
  for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 14, 6), colMat); c.position.set(x * 1.6, 1, z * 1.6); tmdT.add(c); } }
const TMD_H = 380;

// ==========================================================================
// CIUDAD, SUELO EN CORTE Y PILOTES
// ==========================================================================
const city = new THREE.Group(); sea.add(city);
{ const gm = new THREE.MeshStandardMaterial({ color: 0x0b0e12, roughness: .95 }); const gr = new THREE.Mesh(new THREE.PlaneGeometry(14000, 14000), gm); gr.rotation.x = -Math.PI / 2; city.add(gr);
  const N = 1700, r = rng(9); const box = new THREE.BoxGeometry(1, 1, 1); box.translate(0, .5, 0);
  const mats = [0, 1, 2].map(i => { const t = windowTex(20 + i, .22 + i * .08); t.repeat.set(2, 3); return new THREE.MeshStandardMaterial({ color: 0x151a20, roughness: .6, metalness: .3, emissive: new THREE.Color(1, .78, .5), emissiveMap: t, emissiveIntensity: 1.1 }); });
  mats.forEach((m, mi) => { const im = new THREE.InstancedMesh(box, m, N / 3 | 0); const M = new THREE.Matrix4();
    for (let i = 0; i < im.count; i++) { let x, z; do { const a = r() * 6.283, d = 90 + Math.pow(r(), 1.6) * 3200; x = Math.cos(a) * d; z = Math.sin(a) * d; } while (Math.hypot(x, z) < 300);
      const w = 18 + r() * 30, h = 12 + Math.pow(r(), 2.2) * (Math.hypot(x, z) < 800 ? 140 : 70); M.compose(V3(x, 0, z), new THREE.Quaternion(), V3(w, h, w * (.7 + r() * .6))); im.setMatrixAt(i, M); }
    city.add(im); });
  // farolas / tráfico
  const lp = new Particles(5000, { size: 5, seed: 31, fog: true }); city.add(lp.obj); city.userData.lp = lp;
  const rr = rng(33); city.userData.L = Array.from({ length: 5000 }, () => { const a = rr() * 6.283, d = 80 + Math.pow(rr(), 1.3) * 4000; return [Math.cos(a) * d, 1.5, Math.sin(a) * d, 1.8, 1.1 + rr() * .4, .5]; });
}
// Corte del terreno (modo sección)
const section = new THREE.Group(); sea.add(section); section.visible = false;
const soilTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 512; const x = c.getContext('2d'); const cols = ['#3a2a1e', '#4a3423', '#2f2419', '#54402c', '#3d2e21', '#2a2018'];
  let y = 0, i = 0; const r = rng(2); while (y < 512) { const h = 40 + r() * 80; x.fillStyle = cols[i++ % cols.length]; x.fillRect(0, y, 64, h); y += h; }
  for (let k = 0; k < 900; k++) { x.fillStyle = `rgba(0,0,0,${r() * .3})`; x.fillRect(r() * 64, r() * 512, 2, 2); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const soil = new THREE.Mesh(new THREE.BoxGeometry(1400, 500, 300), new THREE.MeshStandardMaterial({ map: soilTex, roughness: 1, transparent: true, opacity: 1, emissive: new THREE.Color(.35, .22, .14), emissiveMap: soilTex, emissiveIntensity: 1.1 }));
soil.position.set(0, -250, -150 + 2); section.add(soil);
const slab = new THREE.Mesh(new THREE.BoxGeometry(900, 2, 600), new THREE.MeshStandardMaterial({ color: 0x15181c, roughness: .9 })); slab.position.y = -1; section.add(slab);
const piles = (() => { const g = new THREE.CylinderGeometry(.75, .75, 80, 10); g.translate(0, -40, 0); const im = new THREE.InstancedMesh(g, colMat, 380); const M = new THREE.Matrix4(); let k = 0;
  for (let i = 0; i < 20 && k < 380; i++) for (let j = 0; j < 20 && k < 380; j++) { const x = -31 + i * 3.27, z = -31 + j * 3.27; if ((i === 0 || i === 19) && (j === 0 || j === 19)) continue; M.makeTranslation(x, -3, z); im.setMatrixAt(k++, M); }
  im.count = k; return im; })();
section.add(piles); piles.visible = false; piles.material = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: .45, metalness: .5, emissive: new THREE.Color(1.2, .6, .3), emissiveIntensity: .12 });
const mat0 = new THREE.Mesh(new THREE.BoxGeometry(80, 6, 80), new THREE.MeshStandardMaterial({ color: 0x3a3f46, roughness: .8 })); mat0.position.y = -3; section.add(mat0);

// Japón: aislamiento sísmico de base (dos edificios: con y sin aisladores)
const jp = new THREE.Group(); sea.add(jp); jp.visible = false; jp.position.set(4000, 0, 0);
const jpGround = new THREE.Mesh(new THREE.BoxGeometry(400, 160, 160), new THREE.MeshStandardMaterial({ map: soilTex, roughness: 1, emissive: new THREE.Color(.3, .2, .12), emissiveMap: soilTex, emissiveIntensity: .5 })); jpGround.position.y = -80; jp.add(jpGround);
const bTex = windowTex(44, .4); bTex.repeat.set(3, 1.25);
const bMat = new THREE.MeshStandardMaterial({ color: 0x2a3138, roughness: .5, metalness: .3, emissive: new THREE.Color(1, .8, .55), emissiveMap: bTex, emissiveIntensity: .9 });
function jpBuilding() { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(30, 40, 30), bMat); b.position.y = 20; g.add(b); const base = new THREE.Mesh(new THREE.BoxGeometry(34, 1.4, 34), new THREE.MeshStandardMaterial({ color: 0x555b62, roughness: .7 })); base.position.y = -.7; g.add(base); return g; }
const jpFixed = jpBuilding(); jp.add(jpFixed); jpFixed.position.set(-24, 0, 0);
const jpIso = jpBuilding(); jp.add(jpIso); jpIso.position.set(24, 3.4, 0);
const bearTex = (() => { const c = document.createElement('canvas'); c.width = 8; c.height = 128; const x = c.getContext('2d'); for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? '#9aa1a8' : '#16181a'; x.fillRect(0, i * 8, 8, 8); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const bearMat = new THREE.MeshStandardMaterial({ map: bearTex, roughness: .6, metalness: .3, emissive: new THREE.Color(.6, .35, .15), emissiveIntensity: 0 });
const bearings = []; for (const x of [-12, 0, 12]) for (const z of [-12, 0, 12]) { const g = new THREE.CylinderGeometry(2.2, 2.2, 2, 32); g.translate(0, 1, 0); const m = new THREE.Mesh(g, bearMat); m.matrixAutoUpdate = false; m.userData.p = V3(24 + x, 0, z); jp.add(m); bearings.push(m); }
const jpLight = new THREE.PointLight(0xffd0a0, 600, 60, 1.5); jpLight.position.set(34, 5, 26); jp.add(jpLight);
const jpSlabTop = new THREE.Mesh(new THREE.BoxGeometry(40, 1.2, 40), new THREE.MeshStandardMaterial({ color: 0x4a5058, roughness: .8 })); jp.add(jpSlabTop);

// Lluvia y viento (tifón)
const rain = new Particles(9000, { size: 1.6, seed: 71, fog: false }); sea.add(rain.obj);
const wind = new Particles(5000, { size: 3, seed: 72, fog: true }); sea.add(wind.obj);

// Luces del exterior
const hemi = new THREE.HemisphereLight(0x8fb0d8, 0x1a1410, .9); sea.add(hemi);
const keyL = new THREE.DirectionalLight(0xffd0a0, 1.6); sea.add(keyL); sea.add(keyL.target);
const rimL = new THREE.DirectionalLight(0x7fb0ff, 1.4); sea.add(rimL); sea.add(rimL.target);
const towerLight = new THREE.PointLight(0xffc890, 2.5, 600, 1.2); sea.add(towerLight);

// ==========================================================================
// INTERIOR: el péndulo de 660 t (plantas 87–92)
// ==========================================================================
const inside = new THREE.Scene(); inside.fog = new THREE.FogExp2(new THREE.Color(.02, .03, .05), .006);
{ const pm = new THREE.PMREMGenerator(renderer); inside.environment = pm.fromScene(new RoomEnvironment(), .04).texture; inside.environmentIntensity = .55; }
const bldg = new THREE.Group(); inside.add(bldg);
const interiorMat = new THREE.MeshStandardMaterial({ color: 0x1a1d22, roughness: .7, metalness: .2 });
{ const fl = new THREE.Shape(); fl.moveTo(-26, -26); fl.lineTo(26, -26); fl.lineTo(26, 26); fl.lineTo(-26, 26); fl.closePath(); const hole = new THREE.Path(); hole.absarc(0, 0, 6.5, 0, Math.PI * 2, true); fl.holes.push(hole);
  for (const y of [-11, -4.5, 15]) { const g = new THREE.ExtrudeGeometry(fl, { depth: .6, bevelEnabled: false, curveSegments: 48 }); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, interiorMat); m.position.y = y - .6; bldg.add(m); }
  // barandilla del mirador
  const rail = new THREE.Mesh(new THREE.TorusGeometry(7, .08, 8, 64), new THREE.MeshStandardMaterial({ color: 0xc0c6cc, metalness: 1, roughness: .2 })); rail.rotation.x = Math.PI / 2; rail.position.y = -3.4; bldg.add(rail);
  // muro cortina con montantes
  const mull = new THREE.MeshStandardMaterial({ color: 0x0d0f12, roughness: .6 });
  for (let i = -6; i <= 6; i++) for (const s of [-1, 1]) { const a = new THREE.Mesh(new THREE.BoxGeometry(.3, 24, .3), mull); a.position.set(i * 4.2, 3, s * 25.5); bldg.add(a); const b = a.clone(); b.position.set(s * 25.5, 3, i * 4.2); bldg.add(b); }
  // luces cálidas del techo
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: SOFT, color: new THREE.Color(2.2, 1.6, 1), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); s.position.set(Math.cos(a) * 14, 14.2, Math.sin(a) * 14); s.scale.setScalar(2.5); bldg.add(s); }
}
// telón de fondo: la ciudad de noche a través del cristal
{ const c = document.createElement('canvas'); c.width = 2048; c.height = 512; const x = c.getContext('2d'); const gr = x.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#05070d'); gr.addColorStop(.55, '#1a1420'); gr.addColorStop(.62, '#3a2416'); gr.addColorStop(1, '#07080a'); x.fillStyle = gr; x.fillRect(0, 0, 2048, 512);
  const r = rng(5); for (let i = 0; i < 9000; i++) { const y = 320 + Math.pow(r(), .5) * 190; x.fillStyle = `rgba(255,${180 + r() * 60 | 0},${100 + r() * 60 | 0},${.3 + r() * .7})`; x.fillRect(r() * 2048, y, 1.5, 1.5); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping;
  const bd = new THREE.Mesh(new THREE.CylinderGeometry(240, 240, 300, 64, 1, true), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false })); bd.position.y = -60; inside.add(bd); }
const rainIn = new Particles(5000, { size: .12, seed: 73, fog: false }); inside.add(rainIn.obj);
const sphere = new THREE.Mesh(new THREE.SphereGeometry(2.75, 64, 40), goldMat); inside.add(sphere);
const cables = []; for (let i = 0; i < 8; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, 1, 8), new THREE.MeshStandardMaterial({ color: 0x9aa1a8, metalness: 1, roughness: .3 })); inside.add(c); cables.push(c); }
const dampers = []; const dampMat = new THREE.MeshStandardMaterial({ color: 0x3a4048, metalness: .8, roughness: .35, emissive: new THREE.Color(2.4, .9, .25), emissiveIntensity: 0 });
const rodMat = new THREE.MeshStandardMaterial({ color: 0xe0e4e8, metalness: 1, roughness: .15 });
for (let i = 0; i < 8; i++) { const g = new THREE.Group(); const body = new THREE.Mesh(new THREE.CylinderGeometry(.28, .28, 1, 16), dampMat); const rod = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, 1, 10), rodMat); g.add(body); g.add(rod); g.userData = { body, rod }; inside.add(g); dampers.push(g); }
const people = []; { const pm = new THREE.MeshStandardMaterial({ color: 0x08090b, roughness: .9 }); const r = rng(8);
  for (let i = 0; i < 14; i++) { const a = -1.2 + i * .19 + r() * .08; const h = 1.6 + r() * .25; const p = new THREE.Group(); const b = new THREE.Mesh(new THREE.CapsuleGeometry(.22, h - .7, 4, 10), pm); b.position.y = h / 2; p.add(b); const hd = new THREE.Mesh(new THREE.SphereGeometry(.13, 12, 8), pm); hd.position.y = h + .05; p.add(hd); p.position.set(Math.cos(a) * 8.2, -4.5, Math.sin(a) * 8.2); bldg.add(p); people.push(p); } }
const inKey = new THREE.SpotLight(0xffd8a8, 900, 120, .6, .5, 1.6); inKey.position.set(-14, 13, 18); inside.add(inKey); inside.add(inKey.target);
const inRim = new THREE.PointLight(0x7fb4ff, 300, 80, 1.6); inRim.position.set(12, -2, -14); inside.add(inRim);
inside.add(new THREE.HemisphereLight(0x8fa8c8, 0x140f0a, .35));
const SPH_Y = 0; const ANCH = [[3.6, 3.6], [-3.6, 3.6], [3.6, -3.6], [-3.6, -3.6]];
function orient(obj, a, b) { const d = b.clone().sub(a); const L = d.length(); obj.position.copy(a).add(b).multiplyScalar(.5); obj.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); return L; }
// bx: desplazamiento del edificio; sx: desplazamiento de la esfera (absolutos, m)
function pendulum(bx, sx, heat) {
  bldg.position.x = bx; sphere.position.set(sx, SPH_Y, 0);
  ANCH.forEach(([x, z], i) => { for (let k = 0; k < 2; k++) { const top = V3(bx + x + (k ? .25 : -.25), 15, z); const bot = V3(sx + x * .45 + (k ? .1 : -.1), SPH_Y + 2.2, z * .45); const L = orient(cables[i * 2 + k], top, bot); cables[i * 2 + k].scale.y = L; } });
  for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + .39; const p0 = V3(sx + Math.cos(a) * 1.6, SPH_Y - 2.3, Math.sin(a) * 1.6); const p1 = V3(bx + Math.cos(a) * 6.2, -10.4, Math.sin(a) * 6.2);
    const d = dampers[i]; const L = p0.distanceTo(p1); const mid = p0.clone().lerp(p1, .45); const dir = p1.clone().sub(p0).normalize();
    d.userData.body.position.copy(p1.clone().addScaledVector(dir, -L * .3)); d.userData.body.quaternion.setFromUnitVectors(V3(0, 1, 0), dir); d.userData.body.scale.y = L * .6;
    d.userData.rod.position.copy(p0.clone().addScaledVector(dir, L * .25)); d.userData.rod.quaternion.setFromUnitVectors(V3(0, 1, 0), dir); d.userData.rod.scale.y = L * .5; }
  dampMat.emissiveIntensity = heat;
}

// ==========================================================================
// HUD propio
// ==========================================================================
function stamp(s, x, y, a, rot = -.12, col = '#ff6a4a') {
  if (a <= .01) return; const sc = lerp(1.6, 1, easeOut(clamp(a * 1.4)));
  g2.save(); g2.translate(x, y); g2.rotate(rot); g2.scale(sc, sc); g2.globalAlpha = clamp(a); g2.strokeStyle = col; g2.lineWidth = 8; g2.shadowColor = col; g2.shadowBlur = 25;
  g2.font = '800 110px Montserrat'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.letterSpacing = '8px'; const w = g2.measureText(s).width + 70;
  g2.strokeRect(-w / 2, -80, w, 160); g2.fillStyle = col; g2.fillText(s, 0, 4); g2.restore();
}
function waveGraph(y0, a, tt, ampF, label, col = '#7fd4ff', pushes = 0) {
  if (a <= .01) return; const x0 = 120, x1 = W - 120, Hh = 110;
  g2.save(); g2.globalAlpha = a * .5; g2.strokeStyle = 'rgba(255,255,255,.4)'; g2.lineWidth = 2; g2.beginPath(); g2.moveTo(x0, y0); g2.lineTo(x1, y0); g2.stroke(); g2.restore();
  g2.save(); g2.globalAlpha = a; g2.strokeStyle = col; g2.lineWidth = 5; g2.shadowColor = col; g2.shadowBlur = 16; g2.beginPath();
  const n = 300; for (let i = 0; i <= n; i++) { const u = i / n; const tau = tt - (1 - u) * 6; const y = y0 - Math.sin(tau * 2 * Math.PI / 1.6) * Hh * ampF(tau); i ? g2.lineTo(lerp(x0, x1, u), y) : g2.moveTo(lerp(x0, x1, u), y); } g2.stroke(); g2.restore();
  if (pushes) { for (let k = 0; k < 8; k++) { const tau = Math.floor(tt / 1.6) * 1.6 - k * 1.6 + .4; const u = 1 - (tt - tau) / 6; if (u < 0 || u > 1) continue; const x = lerp(x0, x1, u); arrowXY(x - 60, y0 - Hh - 40, x + 10, y0 - Hh - 40, a * pushes, '#e3a372', 8); } }
  txt(label, W / 2, y0 + Hh + 60, 26, { spacing: 6, alpha: a * .85, fill: col });
}
function bars(a, k) {
  if (a <= .01) return; const y = 1500, x0 = 200, w = 680;
  txt('BALANCEO EN LA CIMA', W / 2, y - 120, 24, { spacing: 7, alpha: a * .8, fill: '#e3a372' });
  const b = (yy, f, lab, col) => { g2.save(); g2.globalAlpha = a; g2.fillStyle = 'rgba(255,255,255,.12)'; g2.fillRect(x0, yy, w, 30); g2.fillStyle = col; g2.shadowColor = col; g2.shadowBlur = 18; g2.fillRect(x0, yy, w * f, 30); g2.restore(); txt(lab, x0, yy - 26, 24, { align: 'left', alpha: a * .9, weight: 600 }); };
  b(y - 40, 1, 'SIN PÉNDULO', '#ff6a4a'); b(y + 60, lerp(1, .6, k), 'CON PÉNDULO', '#7fd4ff');
  txt('−40 %', x0 + w * lerp(1, .6, k) + 20, y + 74, 54, { align: 'left', font: 'Montserrat', weight: 800, alpha: a * smooth(.3, .8, k), fill: copperGrad(600, 900, y + 74, .5) });
}
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;

// ==========================================================================
// ENTORNO
// ==========================================================================
function envUpdate(mode, t) {
  city.visible = mode === 'city'; section.visible = mode === 'section'; jp.visible = mode === 'japan';
  skyDome.position.copy(camera.position); U.uTime.value = t;
  if (mode === 'city') { sea.fog.color.setRGB(.16, .1, .09); sea.fog.density = .00042;
    const lp = city.userData.lp; lp.begin(); for (const L of city.userData.L) lp.push(...L); lp.end(); }
  else { sea.fog.color.setRGB(.03, .04, .06); sea.fog.density = .0006; }
  const tg = V3(0, 250, 0);
  keyL.position.copy(SUN_DIR).multiplyScalar(1000).add(V3(0, 250, 0)); keyL.target.position.copy(tg); keyL.target.updateMatrixWorld();
  rimL.position.set(700, 300, 600); rimL.target.position.copy(tg); rimL.target.updateMatrixWorld();
  towerLight.position.set(0, 60, 120);
}

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.fov = 35;
  let scene = sea, mode = 'city', bloomS = .6, flash = 0, ca = .0013, fade = 0, grain = .035, expo = 1;
  tower.visible = true; rigid.visible = false; skyDome.visible = true; setXray(tower, 0); tmdT.visible = false; piles.visible = false; soil.material.opacity = 1; sway(tower, 0, 0); tower.position.set(0, 0, 0);
  rain.begin(); wind.begin(); rainIn.begin(); bearMat.emissiveIntensity = 0;
  for (const c of ['taipei', 'quake', 'why', 'skeleton', 'piles', 'danger', 'solution', 'ton', 'cut', 'japan', 'isol', 'record', 'tourist', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];
  const W1 = 2 * Math.PI / 6.5;   // ritmo propio (ilustrativo) de la torre

  if (t < TL.quake) {
    // A · GANCHO: 508 m de acero y cristal… diseñado para moverse
    const k = t / TL.quake; const A = t > TL.move ? Math.sin((t - TL.move) * 2.2) * 6 * smooth(TL.move, TL.move + .6, t) * (1 - smooth(TL.taipei - .3, TL.taipei, t)) : 0;
    sway(tower, 0, A);
    if (t < TL.taipei) { camera.position.set(lerp(-95, -150, k * 1.6), lerp(5, 40, k * 1.6), lerp(-150, -230, k * 1.6)); camera.lookAt(0, lerp(300, 330, k), 0); camera.fov = 52; }
    else { const l2 = (t - TL.taipei) / (TL.quake - TL.taipei); camOrbit(V3(0, 250, 0), lerp(1500, 1700, l2), lerp(-2.4, -2.2, l2), lerp(.16, .2, l2), 40); }
    fade = 1 - smooth(0, .3, t);
    hud.push(() => {
      bigStat('ALTURA', '508 m', 470, smooth(.1, .5, t) * (1 - smooth(TL.move - .2, TL.move, t)), .2 + t * .2);
      titleHUD('Y ESTÁ DISEÑADO', 'PARA MOVERSE', smooth(TL.move, TL.move + .3, t) * (1 - smooth(TL.taipei - .3, TL.taipei, t)), 1460);
      if (A !== 0) { const p = project(V3(A, HTOP, 0)); arrowXY(p.x - 120, p.y - 60, p.x + 120, p.y - 60, Math.abs(A) / 6, '#e3a372', 8); }
      titleHUD('TAIPEI 101 · TAIWÁN', '101 PLANTAS', smooth(TL.taipei + .1, TL.taipei + .5, t) * (1 - smooth(TL.zone - .2, TL.zone, t)), 1460);
      const az = smooth(TL.zone, TL.zone + .4, t); txt('TERREMOTOS', W / 2 - 200, 1520, 40, { font: 'Montserrat', weight: 800, alpha: az, fill: '#ff8a5a' }); txt('+', W / 2, 1520, 40, { font: 'Montserrat', weight: 800, alpha: az });
      txt('TIFONES', W / 2 + 190, 1520, 40, { font: 'Montserrat', weight: 800, alpha: smooth(TL.zone + .9, TL.zone + 1.3, t), fill: '#7fd4ff' });
    });
  } else if (t < TL.skeleton) {
    // B · EL SUELO SE DESLIZA DE LADO · ¿POR QUÉ NO RÍGIDO? → SE ROMPE
    mode = 'section'; const lt = t - TL.quake; const why = t >= TL.why;
    const gx = (tt) => (Math.sin(tt * 9) * 2.2 + Math.sin(tt * 5.3) * 1.5) * smooth(TL.quake + .2, TL.quake + .8, tt) * 1.8;
    if (!why) { const g = gx(t); sway(tower, g, -g * .9 + Math.sin(lt * 1.3) * 4 * smooth(0, 2, lt)); section.position.x = g;
      camera.position.set(lerp(-60, -40, lt / 4.6), 180, 1250); camera.lookAt(0, 120, 0); camera.position.add(shake(t, 2.5, 8)); ca = .0025; }
    else { const l2 = t - TL.why; section.position.x = 0; tower.position.x = 70; rigid.visible = true; rigid.position.x = -70;
      const bend = Math.sin(l2 * 2.4) * 14 * smooth(.3, 1, l2); sway(tower, 0, bend); sway(rigid, 0, 0);
      const crack = smooth(TL.snap + 1.9 - TL.why, TL.snap + 2.4 - TL.why, l2); if (crack > 0) { for (const sl of rigid.userData.slices) if (sl.h0 >= 109) { sl.s.position.x = -crack * (sl.h0 - 100) * .12; sl.s.rotation.z = crack * .18; sl.s.position.y = sl.h0 - crack * 8; } }
      camera.position.set(0, 200, 1550); camera.lookAt(0, 170, 0); flash = Math.max(flash, flashAt(t, TL.snap + 1.95, .3, .45)); }
    hud.push(() => {
      if (!why) { const a = smooth(.4, .8, lt); const p = project(V3(section.position.x, -30, 0)); arrowXY(p.x - 200, p.y + 160, p.x + 200, p.y + 160, a, '#ff8a5a', 12); arrowXY(p.x + 200, p.y + 160, p.x - 200, p.y + 160, a * (Math.sin(t * 9) > 0 ? 1 : .2), '#ff8a5a', 12);
        titleHUD('EL SUELO SE DESLIZA', 'DE LADO', a, 1500); callout(V3(section.position.x, 20, 0), 140, -200, 'LA BASE', 'arrastrada por el suelo', smooth(TL.slide + 2.5 - TL.quake, TL.slide + 3 - TL.quake, lt)); }
      else { const l2 = t - TL.why; const pr = project(V3(-70, 540, 0)), pf = project(V3(70, 540, 0));
        txt('RÍGIDO', pr.x, pr.y, 40, { font: 'Montserrat', weight: 800, alpha: smooth(.2, .5, l2), fill: '#ff6a4a' }); txt('FLEXIBLE', pf.x, pf.y, 40, { font: 'Montserrat', weight: 800, alpha: smooth(.2, .5, l2), fill: '#7fd4ff' });
        txt('¿POR QUÉ NO RÍGIDO?', W / 2, 1480, 44, { font: 'Montserrat', weight: 800, alpha: smooth(.1, .4, l2) * (1 - smooth(1.9, 2.2, l2)) });
        const s0 = TL.snap + 1.95 - TL.why; stamp('SE ROMPE', pr.x + 60, 1500, smooth(s0, s0 + .25, l2), -.1);
        txt('SE DOBLA Y VUELVE', pf.x - 40, 1380, 30, { weight: 600, alpha: smooth(s0 + .4, s0 + .8, l2), fill: '#7fd4ff' }); }
    });
  } else if (t < TL.danger) {
    // C · ESQUELETO: núcleo + 8 megacolumnas; pilotes hasta 80 m
    const lt = t - TL.skeleton; const pl = t >= TL.piles; mode = pl ? 'section' : 'city'; setXray(tower, 1); bloomS = .75;
    const fx = t >= TL.flex && !pl ? Math.sin((t - TL.flex) * 3) * 16 * smooth(TL.flex, TL.flex + .4, t) * (1 - smooth(TL.piles - .5, TL.piles, t)) : 0; sway(tower, 0, fx);
    if (!pl) { camOrbit(V3(0, lerp(260, 230, lt / 6), 0), lerp(780, 680, lt / 6), -2.5 + lt * .06, lerp(.35, .12, easeInOut(clamp(lt / 3))), 40); }
    else { const l2 = t - TL.piles; piles.visible = true; soil.material.opacity = .16; skyDome.visible = false; camOrbit(V3(0, lerp(-30, -45, l2 / 3.9), 0), lerp(300, 260, l2 / 3.9), .35 + l2 * .05, .03, 42); }
    hud.push(() => {
      if (!pl) { callout(V3(0, 300, 0), 120, -220, 'NÚCLEO CENTRAL', null, smooth(.3, .7, lt) * (1 - smooth(TL.columns - TL.skeleton - .1, TL.columns - TL.skeleton + .2, lt)));
        const c0 = TL.columns - TL.skeleton; callout(V3(19, 200, 8), 120, -150, '8 MEGACOLUMNAS', 'acero relleno de hormigón', smooth(c0, c0 + .4, lt));
        titleHUD('SE FLEXIONAN', 'Y VUELVEN A SU SITIO', smooth(TL.flex - TL.skeleton, TL.flex - TL.skeleton + .4, lt), 1460); }
      else { const l2 = t - TL.piles; bigStat('PILOTES', '380', 420, smooth(.2, .6, l2), .3 + l2 * .2);
        const p0 = project(V3(36, 0, 34)), p1 = project(V3(36, -83, 34)); if (smooth(1.2, 1.6, l2) > 0) { line2(p0, p1, smooth(1.2, 1.6, l2), '#e3a372', 4); txt('80 m', p1.x + 30, (p0.y + p1.y) / 2, 54, { align: 'left', font: 'Montserrat', weight: 800, alpha: smooth(1.4, 1.8, l2), fill: copperGrad(p1.x, p1.x + 200, p1.y, .5) }); } }
    });
  } else if (t < TL.solution) {
    // D · RESONANCIA: cada edificio tiene su ritmo; empujar a ese ritmo lo amplifica
    const lt = t - TL.danger; const grow = t >= TL.push ? 1 + (t - TL.push) * .9 : 1; const A = Math.sin(lt * W1) * (t < TL.rhythm ? 3 : 7 * grow);
    sway(tower, 0, A); camOrbit(V3(0, 260, 0), 1550, -2.4 + lt * .02, .12, 40); expo = .95;
    if (t >= TL.push) { const s = wind.seed; for (let i = 0; i < 3000; i++) { const k = i * 4; const u = fract(s[k] + t * .6); const ph = Math.sin(t * W1) > 0 ? 1 : .25; wind.push(lerp(-500, 300, u), 80 + s[k + 1] * 420, (s[k + 2] - .5) * 200, .6 * ph, .8 * ph, 1.1 * ph); } }
    hud.push(() => {
      txt('EL PELIGRO:', W / 2, 260, 30, { spacing: 6, alpha: smooth(.1, .4, lt), fill: '#e3a372' }); txt('LA RESONANCIA', W / 2, 320, 60, { font: 'Montserrat', weight: 800, alpha: smooth(.2, .5, lt), fill: copperGrad(200, 880, 320, .5) });
      const r0 = TL.rhythm - TL.danger; waveGraph(1480, smooth(r0, r0 + .4, lt), lt * 1.6 / (2 * Math.PI / W1) * 1, tau => (t < TL.push ? .4 : Math.min(1, .4 + Math.max(0, tau - (TL.push - TL.danger) * 1.6 / 6.5 * 0) * 0 + (t - TL.push) * .22)), t < TL.push ? 'SU PROPIO RITMO' : t < TL.grows ? 'EMPUJONES AL MISMO RITMO' : 'EL BALANCEO CRECE… Y CRECE', t < TL.grows ? '#7fd4ff' : '#ff6a4a', t >= TL.push ? 1 : 0);
    });
  } else if (t < TL.ton) {
    // E · LA SOLUCIÓN: subimos a las plantas 87–92
    const lt = t - TL.solution; setXray(tower, 1); tmdT.visible = true; bloomS = .8;
    tmdT.position.set(0, TMD_H, 0); sway(tower, 0, Math.sin(lt * 1.2) * 3); tmdT.position.x = 3 * mode1(TMD_H) * Math.sin(lt * 1.2) * .3;
    const k = easeInOut(clamp(lt / 3.8)); camOrbit(V3(0, lerp(250, TMD_H - 6, k), 0), lerp(900, 240, k), -2.4 + lt * .08, lerp(.15, .2, k), 40);
    hud.push(() => { txt('¿LA SOLUCIÓN?', W / 2, 300, 54, { font: 'Montserrat', weight: 800, alpha: smooth(0, .3, lt) * (1 - smooth(1, 1.3, lt)) });
      titleHUD('ENTRE LAS PLANTAS', '87 Y 92', smooth(1.4, 1.8, lt), 1460); callout(V3(0, TMD_H - 6, 0), 140, -220, 'UNA ESFERA DE ACERO', null, smooth(TL.sphere - TL.solution + 1.2, TL.sphere - TL.solution + 1.6, lt)); });
  } else if (t < TL.cut) {
    // F · EL PÉNDULO DE 660 t (interior)
    scene = inside; const lt = t - TL.ton; bloomS = .55;
    let bx = 0, sx = 0, heat = 0; const ph = t >= TL.pend ? (t - TL.pend) : 0;
    if (t < TL.pend) { sx = Math.sin(lt * 1.1) * .15; }
    else if (t < TL.lean) { sx = Math.sin(ph * 2) * 1.1; }
    else { const l2 = t - TL.lean; const Bx = Math.sin(l2 * 1.25) * 1.6 * smooth(0, .5, l2); bx = Bx; sx = -Math.sin(l2 * 1.25 - 1.1) * .9 * smooth(0, .6, l2) + Bx * .1; }
    if (t >= TL.dampers) heat = .9 * smooth(TL.heat, TL.heat + .6, t) * (.7 + .3 * Math.abs(Math.sin((t - TL.lean) * 1.25)));
    pendulum(bx, sx, heat);
    if (t < TL.lean) camOrbit(V3(0, .5, 0), lerp(24, 19, lt / 3.3), -.5 + lt * .05, .05, 45);
    else if (t < TL.dampers) camOrbit(V3(bx * .5, 1, 0), 26, .05, .05, 45);
    else camOrbit(V3(sx * .5, -6, 0), lerp(19, 15, (t - TL.dampers) / 3.2), .5 + (t - TL.dampers) * .05, -.1, 45);
    inKey.target.position.copy(sphere.position);
    hud.push(() => {
      bigStat('PESO DE LA ESFERA', '660 t', 420, smooth(.1, .5, lt) * (1 - smooth(TL.pend - TL.ton - .2, TL.pend - TL.ton, lt)), .3 + lt * .2);
      titleHUD('UN PÉNDULO', 'GIGANTE', smooth(TL.pend - TL.ton, TL.pend - TL.ton + .3, lt) * (1 - smooth(TL.lean - TL.ton - .2, TL.lean - TL.ton, lt)), 1460);
      if (t >= TL.lean && t < TL.dampers) { const l2 = t - TL.lean; const pb = project(V3(bx, 9, 0)), ps = project(sphere.position.clone());
        const v = Math.cos(l2 * 1.25); const db = Math.sign(v) * 160;
        arrowXY(pb.x - db / 2, pb.y - 60, pb.x + db / 2, pb.y - 60, smooth(.2, .5, l2), '#ffffff', 12); txt('LA TORRE', pb.x, pb.y - 120, 28, { font: 'Montserrat', weight: 800, alpha: smooth(.2, .5, l2) });
        txt('LA ESFERA SE QUEDA ATRÁS', W / 2, 1460, 36, { font: 'Montserrat', weight: 800, alpha: smooth(TL.lag - TL.lean, TL.lag - TL.lean + .4, l2), fill: '#e3a372' });
        const pa = smooth(TL.pull - TL.lean, TL.pull - TL.lean + .4, l2); arrowXY(ps.x, ps.y + 140, ps.x - db, ps.y + 140, pa, '#ffb27a', 12); txt('Y TIRA AL REVÉS', W / 2, 1530, 36, { font: 'Montserrat', weight: 800, alpha: pa, fill: '#ffb27a' }); }
      if (t >= TL.dampers) { const l3 = t - TL.dampers; const p = dampers[1].userData.body.getWorldPosition(V3(0, 0, 0));
        callout(p, 160, 220, '8 AMORTIGUADORES', 'hidráulicos', smooth(.2, .6, l3)); titleHUD('EL VAIVÉN', 'SE CONVIERTE EN CALOR', smooth(TL.heat - TL.dampers, TL.heat - TL.dampers + .4, l3), 1460); }
    });
  } else if (t < TL.japan) {
    // G · RESULTADO: hasta −40 %
    const lt = t - TL.cut; setXray(tower, 1); tmdT.visible = true; tmdT.position.set(0, TMD_H, 0); const A = Math.sin(lt * W1) * 7 * lerp(1, .6, smooth(.5, 2, lt)); sway(tower, 0, A); tmdT.position.x = -A * .6;
    camOrbit(V3(0, 260, 0), 1350, -2.2, .15, 40); mode = 'city'; expo = .9;
    hud.push(() => bars(smooth(.1, .4, lt), smooth(.6, 2, lt)));
  } else if (t < TL.record) {
    // H · JAPÓN: aisladores de goma y acero
    mode = 'japan'; tower.visible = false; const lt = t - TL.japan;
    const shk = t >= TL.ground ? (Math.sin(t * 11) * 1.4 + Math.sin(t * 6.7) * 1.0) * smooth(TL.ground, TL.ground + .3, t) : t < TL.isol ? (Math.sin(t * 11) * .7 + Math.sin(t * 6.7) * .5) * smooth(TL.japan + .3, TL.japan + .8, t) : 0;
    jpGround.position.x = shk; jpFixed.position.x = -24 + shk; jpFixed.rotation.z = -shk * .012; const bxI = shk * .08; jpIso.position.x = 24 + bxI; jpSlabTop.position.set(24 + shk, -.0, 0);
    for (const b of bearings) { const p = b.userData.p; const s = (bxI - shk) / 2.0; const M = new THREE.Matrix4().makeShear(0, 0, s, 0, 0, 0); M.setPosition(p.x + shk, .6, p.z); b.matrix.copy(M); }
    bearMat.emissiveIntensity = t >= TL.isol && t < TL.ground ? .25 : 0;
    const iso = t >= TL.isol && t < TL.ground;
    if (iso) { const l2 = t - TL.isol; camera.position.set(4000 + 30 - l2 * .6, 2.4, 22.5); camera.lookAt(4000 + 24, 1.7, 12); camera.fov = 40; }
    else camOrbit(V3(4000, 14, 0), lerp(175, 160, lt / 6), .12, .07, 40);
    camera.position.add(shake(t, t >= TL.ground ? .9 : .3, 9));
    hud.push(() => {
      if (!iso) { const pf = project(V3(4000 - 24, 50, 0)), pi = project(V3(4000 + 24, 50, 0)); const a = smooth(.3, .7, lt);
        txt('SIN AISLADORES', pf.x, pf.y - 40, 30, { font: 'Montserrat', weight: 800, alpha: a, fill: '#ff6a4a' }); txt('CON AISLADORES', pi.x, pi.y - 40, 30, { font: 'Montserrat', weight: 800, alpha: a, fill: '#7fd4ff' });
        titleHUD('JAPÓN', 'EDIFICIOS SOBRE AISLADORES', smooth(.2, .6, lt) * (1 - smooth(TL.isol - TL.japan - .3, TL.isol - TL.japan, lt)), 330);
        if (t >= TL.ground) titleHUD('EL SUELO TIEMBLA…', 'EL EDIFICIO APENAS SE ENTERA', smooth(TL.calm, TL.calm + .4, t), 330); }
      else { const l2 = t - TL.isol; callout(V3(4000 + 24, 1.6, 12), -120, -300, 'AISLADOR', 'capas de goma y acero', smooth(.2, .6, l2)); }
    });
  } else if (t < TL.tourist) {
    // I · TIFÓN SOUDELOR 2015: la esfera se movió 1 metro
    const lt = t - TL.record; const inS = t >= TL.meter;
    const camRain = (P, n, spread, life) => { const s = P.seed; const fw = V3(0, 0, -1).applyQuaternion(camera.quaternion), rt = V3(1, 0, 0).applyQuaternion(camera.quaternion);
      for (let i = 0; i < n; i++) { const k = i * 4; const u = fract(s[k] + t / life); const d = spread * (.3 + s[k + 3] * .9); const c = camera.position.clone().addScaledVector(fw, d).addScaledVector(rt, (s[k + 1] - .5) * d * .8 + u * d * .25);
        c.y += (s[k + 2] - .5) * d * 1.4 - u * d * .6; P.push(c.x, c.y, c.z, .45, .6, .8); } };
    if (!inS) { const A = Math.sin(lt * W1 * 1.2) * 6; sway(tower, 0, A); camOrbit(V3(0, 300, 0), lerp(1300, 1150, lt / 3.5), -2.4 + lt * .03, .1, 40); camera.updateMatrixWorld(); camRain(rain, 8000, 300, .45); expo = .8; ca = .002; bloomS = .5; }
    else { scene = inside; const l2 = t - TL.meter; const sx = Math.sin(l2 * 1.3) * 1.0 * smooth(0, .5, l2); pendulum(0, sx, .3); camOrbit(V3(0, 0, 0), lerp(21, 18, l2 / 2.2), .02, .04, 45); camera.updateMatrixWorld(); camRain(rainIn, 4000, 40, .4); }
    hud.push(() => { titleHUD('TIFÓN SOUDELOR', '2015', smooth(.1, .5, lt) * (1 - smooth(TL.meter - TL.record - .2, TL.meter - TL.record, lt)), 1460);
      if (inS) { const l2 = t - TL.meter; const p0 = project(V3(0, -3.6, 0)), p1 = project(V3(sphere.position.x, -3.6, 0)); const a = smooth(.1, .4, l2);
        line2(p0, { x: p0.x, y: p0.y - 330 }, a * .7, 'rgba(255,255,255,.7)', 2, [10, 8]); line2({ x: p0.x, y: p0.y + 30 }, { x: p1.x, y: p1.y + 30 }, a, '#e3a372', 6);
        bigStat('LA ESFERA SE DESPLAZÓ', '1 METRO', 420, a, .3 + l2 * .1);
        txt('SU RÉCORD', W / 2, 520, 30, { spacing: 6, alpha: smooth(1.1, 1.5, l2), fill: '#e3a372' }); } });
  } else if (t < TL.brand) {
    // J · ATRACCIÓN TURÍSTICA
    scene = inside; const lt = t - TL.tourist; pendulum(0, Math.sin(lt * .9) * .25, 0); camOrbit(V3(0, -.5, 0), lerp(30, 26, lt / 3), -2.0 + lt * .06, .02, 45);
    hud.push(() => titleHUD('MIRADOR · PLANTA 89', 'PUEDES VERLA EN PERSONA', smooth(.2, .6, lt), 1460));
  } else {
    // K · MARCA
    const lt = t - TL.brand; camOrbit(V3(0, 300, 0), 2300, -2.3 + lt * .02, .1, 40); expo = .85; fade = Math.min(.45, lt * .4);
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  rain.end(); wind.end(); rainIn.end();
  camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (scene === sea) envUpdate(mode, t);
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
function line2(p0, p1, a, col, w = 3, dash = null) { if (a <= .01) return; g2.save(); g2.globalAlpha = a; g2.strokeStyle = col; g2.lineWidth = w; if (dash) g2.setLineDash(dash); g2.beginPath(); g2.moveTo(p0.x, p0.y); g2.lineTo(p1.x, p1.y); g2.stroke(); g2.restore(); }
function renderCover() { renderFrame(TL.ton + 1.2); coverText('¿CÓMO AGUANTA', 'UN TERREMOTO?', 'Taipei 101 y su péndulo de 660 toneladas'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
window._dbg = { camera, tower, inside, sphere };
