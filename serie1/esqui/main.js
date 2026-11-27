// NO LO SABÍAS — "Los secretos del esquí"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final.
// Cera: el roce funde una película de agua finísima bajo la suela; la cera (hidrófoba) evita que el agua «pegue» y el esquí desliza mejor.
// Cintura (sidecut): esquí más estrecho en el centro; al cantearlo y flexarlo, el canto describe un arco → giro conducido (carving).
// UV (OMS): la nieve fresca refleja hasta el 80 % de la radiación UV; la espuma de mar ~25 %; la arena ~15 %. La UV aumenta con la altitud.
// Fotoqueratitis = «ceguera de la nieve» (quemadura de la córnea).
// Crujido de la nieve: con mucho frío (≲ −10 °C) los cristales se fracturan al pisarlos en vez de deslizar.
// Aludes con víctimas: la mayoría los desencadena la propia víctima o su grupo. Supervivencia en avalancha: ~90 % si se rescata en ~15–18 min; luego cae en picado.
// Récord de kilómetro lanzado (speed skiing) por encima de 250 km/h.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3, shake,
  g2, camera, SOFT, BUBBLE, Particles, txt, copperGrad, project, fmt, callout, bar, fract, camOrbit, arrowXY, bigStat, drawBrand, coverText, finish } from '../../lib/core.js';

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(new THREE.Color(.55, .65, .8), .002);
const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uTop: { value: new THREE.Color(.05, .16, .42) }, uHor: { value: new THREE.Color(.62, .74, .9) } },
  vertexShader: `varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 uTop,uHor; varying vec3 vD; void main(){ float y=clamp(vD.y,0.,1.); gl_FragColor=vec4(mix(uHor,uTop,pow(y,.6)),1.); }` });
const sky = new THREE.Mesh(new THREE.SphereGeometry(3000, 32, 16), skyMat); sky.renderOrder = -1; scene.add(sky);
const hemi = new THREE.HemisphereLight(0xcfe0ff, 0x5a6a80, 1.1); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1dc, 2.6); sun.position.set(-60, 90, 40); scene.add(sun);
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .55, ...o });
function hash(x, z) { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, z) { const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi; const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  return lerp(lerp(hash(xi, zi), hash(xi + 1, zi), u), lerp(hash(xi, zi + 1), hash(xi + 1, zi + 1), u), v); }
const fbm = (x, z) => vnoise(x, z) * .5 + vnoise(x * 2.1, z * 2.1) * .25 + vnoise(x * 4.3, z * 4.3) * .125 + vnoise(x * 9.1, z * 9.1) * .07;
const snowMat = M(0xe6eef9, { roughness: .85 });
function terrain(w, h, n, amp, freq, f = null) { const g = new THREE.PlaneGeometry(w, h, n, n); g.rotateX(-Math.PI / 2); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, (fbm(x * freq + 3, z * freq) - .5) * amp + (f ? f(x, z) : 0)); } g.computeVertexNormals(); return new THREE.Mesh(g, snowMat); }

// ==========================================================================
// A · SUELA DEL ESQUÍ EN MACRO (escala libre: 1 = 1 mm)
// ==========================================================================
const macro = new THREE.Group(); macro.position.set(0, 500, 0); scene.add(macro);
const grains = terrain(60, 30, 220, 1.2, .9); macro.add(grains);
const skiBase = new THREE.Group(); macro.add(skiBase);
const baseMat = M(0x151820, { roughness: .5, metalness: .1 });
{ const base = new THREE.Mesh(new THREE.BoxGeometry(80, .55, 9), baseMat); base.position.y = 1.28; skiBase.add(base);
  const core = new THREE.Mesh(new THREE.BoxGeometry(80, 1.1, 9), M(0xe8d2a8, { roughness: .6 })); core.position.y = 2.1; skiBase.add(core);
  const top = new THREE.Mesh(new THREE.BoxGeometry(80, .3, 9.2), M(0xc8743f, { roughness: .35 })); top.position.y = 2.8; skiBase.add(top);
  for (let i = -8; i <= 8; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(1.2, .32, 9.3), M(0x16243c, { roughness: .35 })); st.position.set(i * 5, 2.8, 0); skiBase.add(st); }
  for (const z of [-4.6, 4.6]) { const e = new THREE.Mesh(new THREE.BoxGeometry(80, .6, .4), M(0xaab4c0, { metalness: .9, roughness: .2 })); e.position.set(0, 1.3, z); skiBase.add(e); } }
const waxMat = new THREE.MeshStandardMaterial({ color: 0x9fe0ff, roughness: .05, metalness: .2, transparent: true, opacity: 0, emissive: 0x1a5a80 });
const waxCoat = new THREE.Mesh(new THREE.BoxGeometry(80, .12, 9.05), waxMat); waxCoat.position.y = .98; skiBase.add(waxCoat);
const filmMat = new THREE.MeshBasicMaterial({ color: 0x4fb4ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
const film = new THREE.Mesh(new THREE.BoxGeometry(80, .22, 9), filmMat); film.position.y = .8; skiBase.add(film);

// ==========================================================================
// B · CINTURA DEL ESQUÍ Y CARVING (1 = 1 m)
// ==========================================================================
const slopeB = new THREE.Group(); slopeB.position.set(0, 0, 0); scene.add(slopeB);
const fieldB = terrain(120, 120, 120, .4, .05); slopeB.add(fieldB);
const SKL = 1.7; const skiShape = (() => { const s = new THREE.Shape(); const hw = x => { const u = x / SKL; return lerp(.085, .05, Math.sin(Math.PI * clamp(u * 1.05))) + (u > .97 ? -(u - .97) * 1.5 : 0); };
  const N = 60; s.moveTo(0, -hw(0)); for (let i = 1; i <= N; i++) { const x = i / N * SKL; s.lineTo(x, -lerp(.10, .11, i / N) * 0 - hw(x)); }
  s.quadraticCurveTo(SKL + .12, 0, SKL, hw(SKL)); for (let i = N; i >= 0; i--) { const x = i / N * SKL; s.lineTo(x, hw(x)); } s.quadraticCurveTo(-.05, 0, 0, -hw(0)); return s; })();
const skiGeo = new THREE.ExtrudeGeometry(skiShape, { depth: .02, bevelEnabled: false, curveSegments: 24 }); skiGeo.rotateX(Math.PI / 2); skiGeo.translate(-SKL / 2, .02, 0);
const skiBase0 = Float32Array.from(skiGeo.attributes.position.array);
const ski = new THREE.Mesh(skiGeo, [M(0xc8743f, { roughness: .35 }), M(0x16243c, { roughness: .4 })]); slopeB.add(ski);
{ const bnd = new THREE.Mesh(new THREE.BoxGeometry(.34, .06, .075), M(0x16243c, { roughness: .4, metalness: .4 })); bnd.position.y = .06; ski.add(bnd);
  const bt = new THREE.Mesh(new THREE.BoxGeometry(.3, .12, .1), M(0x2a3a55, { roughness: .6 })); bt.position.y = .14; ski.add(bt); }
function bendSki(k, R) { const p = skiGeo.attributes.position; for (let i = 0; i < p.count; i++) { const x = skiBase0[i * 3], y = skiBase0[i * 3 + 1], z = skiBase0[i * 3 + 2];
    // flexión: el esquí canteado se curva en planta (arco de radio R)
    const zz = z - k * (x * x) / (2 * R) * 1; p.setXYZ(i, x, y, zz); } p.needsUpdate = true; skiGeo.computeVertexNormals(); }

// ==========================================================================
// C · OJO Y RAYOS UV
// ==========================================================================
const eyeSet = new THREE.Group(); eyeSet.position.set(0, -500, 0); scene.add(eyeSet);
const eyeball = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), M(0xf2ede6, { roughness: .3, emissive: 0x4a4440 })); eyeSet.add(eyeball);
const iris = new THREE.Mesh(new THREE.SphereGeometry(1.004, 48, 12, 0, Math.PI * 2, 0, .44), M(0x3a7aa0, { roughness: .3 })); iris.rotation.x = Math.PI / 2; eyeSet.add(iris);
const pupil = new THREE.Mesh(new THREE.SphereGeometry(1.008, 32, 8, 0, Math.PI * 2, 0, .18), M(0x050505)); pupil.rotation.x = Math.PI / 2; eyeSet.add(pupil);
const corneaMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: .18, roughness: .02, metalness: 0, emissive: 0x000000, depthWrite: false });
const cornea = new THREE.Mesh(new THREE.SphereGeometry(.55, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2.5), corneaMat); cornea.rotation.x = Math.PI / 2; cornea.position.z = .72; cornea.scale.set(1, .55, 1); eyeSet.add(cornea);
const lid = new THREE.Mesh(new THREE.SphereGeometry(1.08, 48, 24, 0, Math.PI * 2, 0, Math.PI * .42), M(0xc9946f, { roughness: .6, side: THREE.DoubleSide })); lid.rotation.x = -.35; eyeSet.add(lid);
const snowC = terrain(80, 80, 80, 1, .08); snowC.position.set(0, -506, 0); scene.add(snowC);

// ==========================================================================
// D · CRISTALES DE NIEVE EN MACRO
// ==========================================================================
const crys = new THREE.Group(); crys.position.set(0, -1000, 0); scene.add(crys);
const iceMat = new THREE.MeshStandardMaterial({ color: 0xdff2ff, roughness: .1, metalness: .2, emissive: 0x3f6f9c, transparent: true, opacity: .92 });
const flakes = []; { const r = rng(5); for (let i = 0; i < 26; i++) { const f = new THREE.Group(); const arms = [];
    for (let a = 0; a < 6; a++) { const arm = new THREE.Group(); arm.rotation.z = a * Math.PI / 3; const m = new THREE.Mesh(new THREE.BoxGeometry(1, .08, .04), iceMat); m.position.x = .5; arm.add(m);
      for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(.32, .05, .04), iceMat); b.position.set(.6, s * .1, 0); b.rotation.z = s * .9; arm.add(b); } f.add(arm); arms.push(arm); }
    f.position.set((r() - .5) * 7, (r() - .5) * 3.2, (r() - .5) * 3); f.rotation.set(r() * 3, r() * 3, r() * 3); f.scale.setScalar(.45 + r() * .4); f.userData = { arms, home: f.position.clone(), r: [r(), r(), r(), r()] }; crys.add(f); flakes.push(f); } }
const boot = new THREE.Group(); { const bm = M(0x5a6478, { roughness: .8, emissive: 0x1c2230 }); const sole = new THREE.Mesh(new THREE.BoxGeometry(9, .8, 4), bm); boot.add(sole);
  for (let i = -3; i <= 3; i++) { const lug = new THREE.Mesh(new THREE.BoxGeometry(.7, .4, 3.6), M(0x2a3140, { roughness: .9 })); lug.position.set(i * 1.25, -.55, 0); boot.add(lug); } } boot.position.set(0, 9, 0); crys.add(boot);

// ==========================================================================
// E · LADERA Y ALUD (1 = 1 m)
// ==========================================================================
const SLOPE = .55; const slopeE = new THREE.Group(); slopeE.position.set(1000, 0, 0); scene.add(slopeE);
const fieldE = terrain(400, 400, 160, 6, .02, (x, z) => -z * SLOPE); slopeE.add(fieldE);
const slabY = (x, z) => (fbm(x * .02 + 3, z * .02) - .5) * 6 - z * SLOPE;
const crackLine = []; for (let i = 0; i <= 200; i++) { const x = -70 + i * .7; const z = -40 + Math.sin(x * .08) * 6; crackLine.push(V3(x, slabY(x, z) + .4, z)); }
function makeSkier(col = 0xc8743f) { const g = new THREE.Group(); const m = M(col), d = M(0x16243c);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.22, .6, 6, 12), m); body.position.y = 1.0; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.16, 16, 12), M(0xe8e8ee, { roughness: .3 })); head.position.y = 1.55; g.add(head);
  const leg = new THREE.Mesh(new THREE.CapsuleGeometry(.11, .55, 6, 10), d); leg.position.set(0, .45, .12); g.add(leg); const leg2 = leg.clone(); leg2.position.z = -.12; g.add(leg2);
  for (const z of [-.12, .12]) { const s = new THREE.Mesh(new THREE.BoxGeometry(1.7, .03, .09), M(0xc8743f)); s.position.set(.1, .02, z); g.add(s); }
  g.userData = { body, head }; scene.add(g); return g; }
const skierE = makeSkier(0xe84a3a); slopeE.add(skierE);
{ const r = rng(21), dum = new THREE.Object3D(); const N = 420; const tr = new THREE.InstancedMesh(new THREE.ConeGeometry(2.4, 9, 7), M(0x1d3a2b, { roughness: .9 }), N); let k = 0;
  while (k < N) { const x = (r() - .5) * 390, z = (r() - .5) * 390; if (Math.abs(x) < 85 && z > -160) continue; const sc = .7 + r() * .7; dum.position.set(x, slabY(x, z) + 4 * sc - .5, z); dum.scale.setScalar(sc); dum.rotation.y = r() * 6; dum.updateMatrix(); tr.setMatrixAt(k++, dum.matrix); }
  slopeE.add(tr);
  const rk = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(3, 0), M(0x3d434c, { roughness: .95 }), 40); for (let i = 0; i < 40; i++) { const x = (r() - .5) * 360, z = -100 - r() * 95; dum.position.set(x, slabY(x, z), z); dum.scale.set(1 + r() * 2, .6 + r(), 1 + r() * 2); dum.rotation.set(r(), r() * 6, r()); dum.updateMatrix(); rk.setMatrixAt(i, dum.matrix); } slopeE.add(rk); }

// ==========================================================================
// F · RÉCORD DE VELOCIDAD (pista muy empinada)
// ==========================================================================
const SPEEDP = V3(-1000, 0, 0); const slopeF = new THREE.Group(); slopeF.position.copy(SPEEDP); scene.add(slopeF);
const fieldF = terrain(600, 3000, 200, 3, .01, (x, z) => -z * .9); slopeF.add(fieldF);
const racer = makeSkier(0xc8743f); slopeF.add(racer);
{ const dum = new THREE.Object3D(); const N = 240; const pl = new THREE.InstancedMesh(new THREE.CylinderGeometry(.06, .06, 1.6, 8), M(0xe84a3a, { roughness: .5 }), N);
  for (let i = 0; i < N; i++) { const side = i % 2 ? 1 : -1, z = -1500 + Math.floor(i / 2) * 25; const x = side * 9; dum.position.set(x, (fbm(x * .01 + 3, z * .01) - .5) * 3 - z * .9 + .7, z); dum.updateMatrix(); pl.setMatrixAt(i, dum.matrix); } slopeF.add(pl); }

// Partículas
const PS = new Particles(24000, { size: .1, seed: 7 }); scene.add(PS.obj);
const BB = new Particles(1500, { size: .4, seed: 13, map: BUBBLE, blend: THREE.NormalBlending }); scene.add(BB.obj);
const WATER = [.55, .9, 1.4], UVC = [1.0, .45, 1.6], HOT = [1.6, .7, .3], SNOW = [1, 1, 1.05];

// ==========================================================================
// HUD
// ==========================================================================
function stamp(s, x, y, a, rot = -.1, col = '#ff6a4a', size = 92) { if (a <= .01) return; const sc = lerp(1.6, 1, easeOut(clamp(a * 1.4)));
  g2.save(); g2.translate(x, y); g2.rotate(rot); g2.scale(sc, sc); g2.globalAlpha = clamp(a); g2.strokeStyle = col; g2.lineWidth = 8; g2.shadowColor = col; g2.shadowBlur = 25;
  g2.font = `800 ${size}px Montserrat`; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.letterSpacing = '6px'; const w = g2.measureText(s).width + 70; g2.strokeRect(-w / 2, -size * .8, w, size * 1.6); g2.fillStyle = col; g2.fillText(s, 0, 4); g2.restore(); }
function two(top, l1, l2, a, y = 300) { if (a <= .01) return; txt(l1, W / 2, y, 50, { font: 'Montserrat', weight: 800, alpha: a }); if (l2) txt(l2, W / 2, y + 62, 50, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(160, 920, y + 62, .5) }); if (top) txt(top, W / 2, y - 62, 24, { spacing: 7, alpha: a * .8, fill: '#e3a372' }); }
const win = (t, a, b, f = .3) => smooth(a, a + f, t) * (1 - smooth(b - f, b, t));
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
function snowfall(t, c, n, r, sp = .4, col = SNOW) { const s = PS.seed; for (let i = 0; i < n; i++) { const q = ((i + 9000) % PS.n) * 4; const y = r - fract(s[q] + t * sp * .1) * r * 2;
  PS.push(c.x + (s[q + 1] - .5) * r * 2 + Math.sin(t + i) * .2, c.y + y, c.z + (s[q + 2] - .5) * r * 2, col[0] * .8, col[1] * .8, col[2] * .8); } }

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .05; camera.far = 6000; camera.fov = 42;
  let bloomS = .45, flash = 0, ca = .0013, fade = 0, expo = 1, focus = V3();
  PS.begin(); BB.begin(); PS.mat.size = .1; BB.mat.size = .4; PS.mat.blending = THREE.AdditiveBlending;
  for (const g of [macro, slopeB, eyeSet, snowC, crys, slopeE, slopeF]) g.visible = false; scene.fog.density = .002; scene.fog.color.setRGB(.55, .65, .8); hemi.intensity = 1.1; sun.intensity = 2.6;
  for (const c of ['cut', 'goggles', 'crunch', 'aval', 'speed', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];

  if (t < TL.cut) {
    // A · la suela: película de agua y cera
    const lt = t - TL.hook; macro.visible = true; scene.fog.density = .004; sky.position.copy(macro.position);
    const v = lerp(14, 26, smooth(TL.wax + .5, TL.wax + 1.5, t)); grains.position.x = -((t * v) % 20) + 10; // la nieve pasa por debajo
    skiBase.position.y = lerp(0, .35, smooth(TL.melt, TL.water, t));
    focus = macro.position.clone().add(V3(0, 1.9, 0)); camera.position.copy(focus).add(V3(-3 + lt * .25, -.4, 13)); camera.lookAt(focus); camera.fov = 40;
    const film = smooth(TL.melt + .3, TL.water + .3, t); const wax = smooth(TL.wax, TL.wax + 1, t);
    filmMat.opacity = film * .55 * (1 - wax * .55); waxMat.opacity = wax * .8; baseMat.roughness = lerp(.5, .1, wax);
    if (film > 0) for (let i = 0; i < 6000 * film; i++) { const s = PS.seed, q = i * 4; const x = (fract(s[q] - t * v / 80) - .5) * 80; const z = (s[q + 1] - .5) * 8.6; const f = .9 * (1 - wax * .6);
      PS.push(macro.position.x + x, macro.position.y + skiBase.position.y + .72 + s[q + 2] * .25, macro.position.z + z, WATER[0] * f, WATER[1] * f, WATER[2] * f); }
    PS.mat.size = .22; bloomS = .6;
    if (wax > 0) { for (let i = 0; i < 160; i++) { const s = BB.seed, q = i * 4; if (s[q + 3] > wax) continue; const x = (fract(s[q] - t * v / 80) - .5) * 80; BB.push(macro.position.x + x, macro.position.y + skiBase.position.y + .78, macro.position.z + (s[q + 1] - .5) * 8.6, .8, .95, 1.1); } BB.mat.size = .9; }
    // estelas de velocidad
    const sp = smooth(TL.wax + .5, TL.wax + 1.2, t); if (sp > 0) for (let i = 0; i < 300; i++) { const s = PS.seed, q = (i + 8000) * 4; const x = (fract(s[q] - t * 1.6) - .5) * 70; PS.push(macro.position.x + x, macro.position.y + 4 + s[q + 1] * 4, macro.position.z + (s[q + 2] - .5) * 14, sp * .7, sp * .8, sp); }
    hud.push(() => { two(null, '¿POR QUÉ HAY QUE', 'ENCERAR LOS ESQUÍS?', smooth(.1, .4, lt) * (1 - smooth(TL.melt - .2, TL.melt, t)), 300);
      two('AL DESLIZAR', 'EL ROCE DERRITE', 'LA NIEVE', win(t, TL.melt, TL.water), 300);
      two(null, 'VAS SOBRE', 'UNA CAPA DE AGUA', win(t, TL.water, TL.wax), 300);
      callout(macro.position.clone().add(V3(6, 1.0, 4.4)), 80, 260, 'AGUA', 'micras de espesor', smooth(TL.water + .3, TL.water + .7, t) * (1 - smooth(TL.wax, TL.wax + .3, t)), '#7fd4ff');
      two('CERA', 'REPELE EL AGUA', 'Y VAS MÁS RÁPIDO', smooth(TL.wax + .2, TL.wax + .6, t), 300); });
  } else if (t < TL.goggles) {
    // B · la cintura: cantear y flexar = carving
    const lt = t - TL.cut; slopeB.visible = true; sky.position.copy(camera.position);
    const tilt = smooth(TL.edge, TL.edge + .8, t), flex = smooth(TL.bend, TL.bend + 1, t), go = smooth(TL.turn - .2, TL.carve + 1.5, t);
    const R = 15; const ang = go * 1.2; const c = V3(0, 0, R); const pos = V3(Math.sin(ang) * R, .02, R - Math.cos(ang) * R);
    ski.position.copy(go > 0 ? pos : V3(0, .3, 0)); ski.rotation.set(0, -ang, 0); ski.rotateX(-tilt * .9); bendSki(flex, 2.2);
    if (go > 0) { for (let i = 0; i < 1600; i++) { const a = i / 1600 * ang; for (const off of [-.04, .04]) PS.push(Math.sin(a) * (R + off), .04, R - Math.cos(a) * (R + off), HOT[0] * .7, HOT[1] * .7, HOT[2] * .7); }
      for (let i = 0; i < 400; i++) { const s = PS.seed, q = i * 4; const a = ang - s[q] * .05; PS.push(Math.sin(a) * R + (s[q + 1] - .5) * .3, .05 + s[q + 2] * .4, R - Math.cos(a) * R, SNOW[0] * .6, SNOW[1] * .6, SNOW[2] * .6); } PS.mat.size = .06; }
    if (go <= 0) { focus = V3(0, .3, 0); camera.up.set(1, 0, 0); camera.position.copy(focus).add(V3(-.5 * tilt, lerp(2.5, 2.3, clamp(lt / 3)), .9 * tilt)); camera.lookAt(focus); camera.fov = 42; }
    else { focus = ski.position.clone(); camera.up.set(Math.cos(ang), 0, Math.sin(ang)); camera.position.copy(focus).add(V3(-Math.cos(ang) * 1.2 * go, lerp(2.4, 4.2, go), -Math.sin(ang) * 1.2 * go + .3)); camera.lookAt(focus.clone().add(V3(Math.cos(ang) * .6 * go, 0, Math.sin(ang) * .6 * go))); camera.fov = 45; }
    hud.push(() => { two(null, '¿POR QUÉ SON MÁS', 'ESTRECHOS POR EL MEDIO?', smooth(.1, .4, lt) * (1 - smooth(TL.edge - .2, TL.edge, t)), 300);
      const la = win(t, TL.cut + .6, TL.edge + .3); if (la > 0) { callout(V3(.8, .3, .06), 40, -300, 'PUNTA', 'más ancha', la, '#ffe2c0'); callout(V3(0, .3, .035), 60, 300, 'CINTURA', 'más estrecha', la, '#ff8a5a'); callout(V3(-.8, .3, .055), -40, -300, 'COLA', 'más ancha', la, '#ffe2c0'); }
      two(null, 'LO INCLINAS', 'SOBRE EL CANTO', win(t, TL.edge, TL.bend), 300); two(null, 'LA CINTURA', 'LO DOBLA EN CURVA', win(t, TL.bend, TL.turn), 300);
      two(null, 'Y GIRA SOLO,', 'SIN DERRAPAR', win(t, TL.turn, TL.carve + .1), 300); stamp('CARVING', W / 2, 360, smooth(TL.carve, TL.carve + .3, t), -.06, '#ffe2c0', 96); });
  } else if (t < TL.crunch) {
    // C · UV reflejada y ceguera de la nieve
    const lt = t - TL.goggles; eyeSet.visible = true; snowC.visible = true; sky.position.copy(camera.position); scene.fog.density = .01;
    const burn = smooth(TL.blind + .2, TL.blind + 1.6, t); corneaMat.emissive.setRGB(burn * .9, burn * .12, burn * .1); corneaMat.opacity = .18 + burn * .4;
    const sq = Math.sin(t * 9) * .02 * burn; lid.rotation.x = -.35 + burn * .25 + sq;
    focus = eyeSet.position.clone(); camOrbit(focus, lerp(4.2, 3.4, clamp(lt / 8)), .35 + lt * .02, .05, 40);
    const uvA = smooth(TL.uv, TL.uv + .6, t) * (1 + smooth(TL.alt, TL.alt + 1.5, t) * .6);
    if (uvA > 0) for (let i = 0; i < 2200; i++) { const s = PS.seed, q = i * 4; const u = fract(s[q] + t * .5); const sx = (s[q + 1] - .5) * 10, sz = (s[q + 2] - .5) * 6 - 2;
      const hit = V3(sx, -505.9, sz + 2); const top = hit.clone().add(V3(-6, 12, -4)); const p = u < .5 ? top.clone().lerp(hit, u * 2) : hit.clone().lerp(focus.clone().add(V3(0, 0, .9)), (u - .5) * 2);
      const f = Math.min(1, uvA) * .55; PS.push(p.x, p.y, p.z, UVC[0] * f, UVC[1] * f, UVC[2] * f); }
    PS.mat.size = .05; bloomS = .65;
    hud.push(() => { two(null, '¿Y LAS GAFAS?', null, smooth(.1, .4, lt) * (1 - smooth(TL.uv - .2, TL.uv, t)), 300);
      const ba = win(t, TL.uv, TL.alt + .2); if (ba > 0) { txt('LUZ ULTRAVIOLETA REFLEJADA', W / 2, 250, 24, { spacing: 6, alpha: ba * .8, fill: '#e3a372' });
        bar(170, 340, 740, .8, 'NIEVE FRESCA', 'hasta 80 %', ba, '#c89aff'); bar(170, 430, 740, .25, 'ESPUMA DE MAR', '25 %', ba * .8, '#9fb8d8'); bar(170, 520, 740, .15, 'ARENA', '15 %', ba * .8, '#9fb8d8'); }
      const aa = win(t, TL.alt, TL.blind); if (aa > 0) { const alt = lerp(0, 3000, smooth(TL.alt, TL.alt + 1.6, t)); bigStat('ALTITUD', fmt(alt) + ' m', 420, aa, .5); txt('más altura = más UV', W / 2, 500, 36, { weight: 300, alpha: aa }); }
      two('FOTOQUERATITIS', 'SE QUEMA LA CÓRNEA:', 'CEGUERA DE LA NIEVE', smooth(TL.blind + .2, TL.blind + .6, t), 300);
      callout(focus.clone().add(V3(0, .2, .95)), 80, 380, 'CÓRNEA', 'quemada por UV', smooth(TL.blind + 1, TL.blind + 1.4, t), '#ff8a6a'); });
  } else if (t < TL.aval) {
    // D · el crujido: cristales que se rompen con mucho frío
    const lt = t - TL.crunch; crys.visible = true; scene.fog.density = .01; scene.fog.color.setRGB(.05, .1, .2); sky.position.copy(camera.position); hemi.intensity = .7;
    const press = smooth(TL.crystals - .2, TL.crystals + .4, t); boot.position.y = lerp(10, 2.4, press); const brk = smooth(TL.crystals, TL.crystals + .3, t);
    flakes.forEach((f, i) => { const u = f.userData; f.position.copy(u.home).add(V3(0, -.7, 0)); f.position.y -= press * (u.home.y + 1.6) * .3;
      u.arms.forEach((a, j) => { const o = brk * (1 + u.r[j % 4] * 2) * (t - TL.crystals); a.position.set(Math.cos(j * 1.047) * o * .8, Math.sin(j * 1.047) * o * .8 - o * o * .2, 0); a.rotation.y = o * 2 * u.r[1]; }); });
    focus = crys.position.clone(); camOrbit(focus, lerp(9.5, 8, clamp(lt / 6)), .25 + lt * .04, .25, 40); bloomS = .65; expo = 1.1;
    if (brk > 0) for (let i = 0; i < 1500; i++) { const s = PS.seed, q = i * 4; const k = (t - TL.crystals) * (1 + s[q] * 3); PS.push(crys.position.x + (s[q + 1] - .5) * 7 + (s[q + 1] - .5) * k * 2, crys.position.y + 1.4 - k * .5 + s[q + 2], crys.position.z + (s[q + 3] - .5) * 3, .9 * (1 - brk * .5), 1, 1.2); }
    PS.mat.size = .05;
    hud.push(() => { two(null, '¿HAS OÍDO CRUJIR', 'LA NIEVE AL PISARLA?', smooth(.1, .4, lt) * (1 - smooth(TL.cold - .2, TL.cold, t)), 300);
      const ta = smooth(TL.cold, TL.cold + .4, t); if (ta > 0) { const temp = Math.round(lerp(0, -12, smooth(TL.cold, TL.cold + 2.5, t))); txt('TEMPERATURA', W / 2, 262, 24, { spacing: 7, alpha: ta * .8, fill: '#e3a372' }); txt((temp < 0 ? '−' : '') + Math.abs(temp) + ' °C', W / 2, 380, 120, { font: 'Montserrat', weight: 800, alpha: ta, fill: temp <= -10 ? '#9fdcff' : '#fff' }); }
      stamp('¡CRIC, CRAC!', W / 2, 1450, smooth(TL.crystals + .1, TL.crystals + .4, t), -.06, '#9fdcff', 80); txt('los cristales se rompen en vez de deslizar', W / 2, 1600, 34, { weight: 300, alpha: smooth(TL.crystals + .5, TL.crystals + .9, t) }); });
  } else if (t < TL.speed) {
    // E · el alud: lo provoca la víctima; se endurece; 15 min
    const lt = t - TL.aval; slopeE.visible = true; sky.position.copy(camera.position); scene.fog.density = .0012;
    const go = smooth(TL.self + .9, TL.cement + .4, t); const sk = V3(-10, 0, -50); skierE.position.set(sk.x + lt * 1.2, slabY(sk.x + lt * 1.2, sk.z) + .05, sk.z); skierE.rotation.y = -.6; skierE.visible = go < .25; skierE.rotation.z = -SLOPE * .5;
    const cr = smooth(TL.aval + .2, TL.aval + .9, t); for (let i = 0; i < crackLine.length * cr; i++) { const p = crackLine[i]; for (let k = 0; k < 4; k++) PS.push(1000 + p.x + k * .12, p.y + k * .05, p.z, HOT[0] * 1.4, HOT[1] * .6, HOT[2] * .5); }
    if (go > 0) for (let i = 0; i < 9000; i++) { const s = PS.seed, q = i * 4; const x = -70 + s[q] * 140; const z0 = -40 + Math.sin(x * .08) * 6; const age = clamp(go * 1.3 - s[q + 1] * .3); const z = z0 + age * 62 + s[q + 2] * 10;
      const y = slabY(x, z) + 1 + s[q + 3] * 9 * Math.sin(age * Math.PI) + age * s[q + 3] * 2.5; const f = .62 + s[q + 3] * .35; PS.push(1000 + x, y, z, f * .92, f * .97, f * 1.08); }
    PS.mat.size = .9; PS.mat.blending = THREE.NormalBlending;
    { const wide = smooth(TL.self + .7, TL.self + 2.2, t); const tgtS = V3(1000 + skierE.position.x, skierE.position.y + 1, skierE.position.z + 4), tgtW = V3(1000, slabY(0, 0), 0);
      focus = tgtS.clone().lerp(tgtW, wide); camera.position.set(1000 + 25, slabY(25, 70) + 16, 70); camera.lookAt(focus); camera.fov = lerp(14, 50, wide); camera.position.add(shake(t, go * .8, 6)); }
    hud.push(() => { two(null, 'LO MÁS SERIO:', 'LOS ALUDES', smooth(.1, .4, lt) * (1 - smooth(TL.self - .2, TL.self, t)), 300);
      callout(skierE.position.clone().add(V3(1000, 1.5, 0)), 70, -200, 'LA PROPIA VÍCTIMA', 'o su grupo', win(t, TL.self, TL.cement), '#ff6a5a'); two('EN LA MAYORÍA', 'LO PROVOCA', 'QUIEN LO SUFRE', win(t, TL.self, TL.cement), 300);
      stamp('COMO CEMENTO', W / 2, 380, win(t, TL.cement + .3, TL.min15, .2), -.06, '#ffe2c0', 80);
      const ca = smooth(TL.min15, TL.min15 + .4, t); if (ca > 0) { // curva de supervivencia (aprox.)
        g2.save(); g2.globalAlpha = ca * .85; g2.fillStyle = 'rgba(6,14,30,.75)'; g2.fillRect(80, 1080, 920, 640); g2.restore();
        const x0 = 170, x1 = 940, y0 = 1180, y1 = 1600, X = m => lerp(x0, x1, m / 120), Y = p => lerp(y1, y0, p);
        const pts = [[0, 1], [10, .96], [15, .9], [18, .88], [25, .6], [35, .34], [60, .28], [90, .24], [120, .2]];
        txt('SUPERVIVENCIA BAJO UN ALUD', W / 2, 1130, 24, { spacing: 6, alpha: ca * .85, fill: '#e3a372' });
        g2.save(); g2.globalAlpha = ca * .5; g2.strokeStyle = '#fff'; g2.lineWidth = 2; g2.beginPath(); g2.moveTo(x0, y0); g2.lineTo(x0, y1); g2.lineTo(x1, y1); g2.stroke(); g2.restore();
        txt('100 %', x0 - 12, y0, 20, { align: 'right', alpha: ca * .7, weight: 300 }); txt('2 h', x1, y1 + 30, 20, { align: 'right', alpha: ca * .7, weight: 300 });
        const dk = smooth(TL.min15 + .2, TL.drop + 1.6, t); const mEnd = lerp(0, 120, dk);
        g2.save(); g2.lineWidth = 8; g2.lineJoin = 'round'; g2.lineCap = 'round'; g2.shadowBlur = 18; g2.beginPath(); let first = true;
        for (let m = 0; m <= mEnd; m += 1) { let p = 0; for (let j = 0; j < pts.length - 1; j++) if (m >= pts[j][0] && m <= pts[j + 1][0]) p = lerp(pts[j][1], pts[j + 1][1], (m - pts[j][0]) / (pts[j + 1][0] - pts[j][0])); if (first) { g2.moveTo(X(m), Y(p)); first = false; } else g2.lineTo(X(m), Y(p)); }
        g2.strokeStyle = t > TL.drop ? '#ff6a5a' : '#7fe08a'; g2.shadowColor = g2.strokeStyle; g2.stroke(); g2.restore();
        const la = smooth(TL.min15 + .8, TL.min15 + 1.2, t); txt('15 min', X(15) + 20, Y(.9) - 60, 26, { align: 'left', alpha: la, fill: '#7fe08a' }); txt('≈ 9 de cada 10', X(15) + 20, Y(.9) - 20, 40, { align: 'left', font: 'Montserrat', weight: 800, alpha: la });
        two(null, 'DESPUÉS,', 'CAE EN PICADO', smooth(TL.drop + .1, TL.drop + .5, t), 300); } });
  } else if (t < TL.brand) {
    // F · récord de velocidad
    const lt = t - TL.speed; slopeF.visible = true; sky.position.copy(camera.position); scene.fog.density = .0015;
    const v = lerp(60, 255, smooth(TL.speed, TL.gravity, t)) / 3.6; const z = -600 + (lt * lt * 8 + lt * 25); const pz = Math.min(z, 1200);
    racer.position.set(0, (fbm(3, pz * .01) - .5) * 3 - pz * .9 + .05, pz); racer.rotation.set(.73, -Math.PI / 2, 0); racer.userData.body.rotation.z = -1.15; racer.userData.body.position.set(.15, .62, 0); racer.userData.head.position.set(.62, .82, 0); racer.userData.head.scale.setScalar(1.25);
    const rp = racer.position.clone().add(SPEEDP); focus = rp.clone().add(V3(0, .8, 0)); camera.position.copy(focus).add(V3(2.6, -2.4, 4.8)); camera.lookAt(focus.clone().add(V3(0, .3, 0))); camera.fov = 50; camera.position.add(shake(t, .05, 12)); ca = .002 + smooth(TL.speed, TL.gravity, t) * .004;
    for (let i = 0; i < 1400; i++) { const s = PS.seed, q = i * 4; const zz = pz + 40 - fract(s[q] + t * 2.5) * 60; const x = (s[q + 1] - .5) * 30; const y = -zz * .9 + s[q + 2] * 6; const f = .6; PS.push(SPEEDP.x + x, y, SPEEDP.z + zz, f, f, f * 1.1); }
    PS.mat.size = .08; bloomS = .5;
    hud.push(() => { const a = smooth(.1, .4, lt); const kmh = Math.round(v * 3.6); txt('RÉCORD DE VELOCIDAD CON ESQUÍS', W / 2, 262, 24, { spacing: 6, alpha: a * .85, fill: '#e3a372' });
      txt((kmh >= 250 ? '+' : '') + kmh + ' km/h', W / 2, 390, 130, { font: 'Montserrat', weight: 800, alpha: a, fill: kmh >= 250 ? copperGrad(160, 920, 390, .5) : '#fff' });
      two(null, 'SIN MOTOR.', 'SOLO GRAVEDAD.', smooth(TL.gravity, TL.gravity + .4, t), 1450); });
  } else {
    // G · marca
    const lt = t - TL.brand; slopeB.visible = true; sky.position.copy(camera.position); skyMat.uniforms.uTop.value.setRGB(.01, .02, .06); skyMat.uniforms.uHor.value.setRGB(.06, .1, .2);
    focus = V3(0, 3, 0); camOrbit(focus, 30 + lt * 2, .3 + lt * .03, .25, 45); hemi.intensity = .35; sun.intensity = .4; expo = .8; fade = Math.min(.45, lt * .4);
    snowfall(t, focus.clone().add(V3(0, 0, -6)), 2500, 14, .8); PS.mat.size = .07;
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  if (t < TL.brand) { skyMat.uniforms.uTop.value.setRGB(.05, .16, .42); skyMat.uniforms.uHor.value.setRGB(.62, .74, .9); }
  PS.end(); BB.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, bloom: bloomS, expo });
}
function renderCover() { renderFrame(TL.speed + 3.5); coverText('LOS SECRETOS', 'DEL ESQUÍ', 'y la física que hay detrás'); }
window.renderCover = () => { renderCover(); return true; };
window.OBJ = { PS, BB, ski, flakes, boot, crys, scene };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
