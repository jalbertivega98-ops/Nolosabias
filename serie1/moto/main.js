// NO LO SABÍAS — "Los secretos de las motos de carreras"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final.
// Inclinación en curva en MotoGP: más de 60°. El deslizador de la rodilla roza el asfalto y sirve de referencia.
// Contramanillar: para girar a la derecha se empuja el puño derecho hacia delante; la rueda gira un instante a la izquierda y la moto cae hacia la derecha.
// Huella de contacto de cada neumático ≈ tamaño de una tarjeta de crédito. Mantas calefactoras antes de salir: goma fría = poco agarre.
// Discos de freno de carbono: por encima de 800 °C en frenadas fuertes (se ven al rojo). Frenada > 1 g: el piloto empuja el manillar con más que su peso.
// Pérdida de peso por sudor en carrera: hasta ~2 kg. Récord de velocidad punta en MotoGP: 366,1 km/h (Mugello 2023).
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3, shake,
  g2, camera, Particles, txt, copperGrad, project, fmt, callout, bar, fract, emitRise, emitJet, arrowXY, bigStat, drawBrand, coverText, finish } from '../../lib/core.js';

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(new THREE.Color(.62, .7, .82), .004);
const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uTop: { value: new THREE.Color(.08, .2, .48) }, uHor: { value: new THREE.Color(.85, .75, .62) } },
  vertexShader: `varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 uTop,uHor; varying vec3 vD; void main(){ float y=clamp(vD.y,0.,1.); gl_FragColor=vec4(mix(uHor,uTop,pow(y,.5)),1.); }` });
const sky = new THREE.Mesh(new THREE.SphereGeometry(3000, 32, 16), skyMat); sky.renderOrder = -1; scene.add(sky);
const hemi = new THREE.HemisphereLight(0xdfe8ff, 0x6a6a60, 1.6); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe6c8, 2.8); sun.position.set(25, 80, -45); scene.add(sun);
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .55, ...o });
const COP = 0xc8743f, NAVY = 0x16243c, WHITE = 0xeeeeee;

// ==========================================================================
// CIRCUITO: curva (centro en el origen) + recta (z = -300) + garaje
// ==========================================================================
const grass = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), M(0x3f6a34, { roughness: .95 })); grass.rotation.x = -Math.PI / 2; grass.position.y = -.02; scene.add(grass);
const asphaltMat = M(0x4a4e55, { roughness: .9 });
function striped(geo, n, colA, colB, angular) { const g = geo.toNonIndexed(); const p = g.attributes.position; const c = new Float32Array(p.count * 3); const A = new THREE.Color(colA), B = new THREE.Color(colB);
  for (let i = 0; i < p.count; i += 3) { let cx = 0, cy = 0; for (let k = 0; k < 3; k++) { cx += p.getX(i + k) / 3; cy += p.getY(i + k) / 3; }
    const u = angular ? (Math.atan2(cy, cx) / (Math.PI * 2) + 1) * n : cx / n; const col = Math.floor(u) % 2 ? A : B; for (let k = 0; k < 3; k++) c.set([col.r, col.g, col.b], (i + k) * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return new THREE.Mesh(g, M(0xffffff, { vertexColors: true, roughness: .6 })); }
const RIN = 37.5, RPATH = 38.6;
{ const ring = new THREE.Mesh(new THREE.RingGeometry(RIN, 52, 256, 1), asphaltMat); ring.rotation.x = -Math.PI / 2; scene.add(ring);
  const kerb = striped(new THREE.RingGeometry(RIN - 1.4, RIN, 512, 1), 180, 0xd23a2e, 0xf2f2f2, true); kerb.rotation.x = -Math.PI / 2; kerb.position.y = .01; scene.add(kerb);
  const line = new THREE.Mesh(new THREE.RingGeometry(51.6, 51.85, 256, 1), M(0xffffff, { roughness: .6 })); line.rotation.x = -Math.PI / 2; line.position.y = .01; scene.add(line);
  const dum = new THREE.Object3D(); const N = 90; const bd = new THREE.InstancedMesh(new THREE.BoxGeometry(5.5, 1.1, .12), M(0xffffff), N);
  for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2; dum.position.set(Math.cos(a) * 56, .55, Math.sin(a) * 56); dum.rotation.y = -a + Math.PI / 2; dum.updateMatrix(); bd.setMatrixAt(i, dum.matrix); bd.setColorAt(i, new THREE.Color(i % 2 ? COP : NAVY)); }
  scene.add(bd); }
const ZS = -300; // recta a lo largo de x
{ const st = new THREE.Mesh(new THREE.PlaneGeometry(3000, 14), asphaltMat); st.rotation.x = -Math.PI / 2; st.position.set(0, 0, ZS); scene.add(st);
  for (const s of [-1, 1]) { const k = striped(new THREE.PlaneGeometry(3000, 1.2, 1500, 1), 2, 0xd23a2e, 0xf2f2f2, false); k.rotation.x = -Math.PI / 2; k.position.set(0, .01, ZS + s * 7.6); scene.add(k); }
  const dum = new THREE.Object3D(); const N = 300; const bd = new THREE.InstancedMesh(new THREE.BoxGeometry(5.5, 1.1, .12), M(0xffffff), N);
  for (let i = 0; i < N; i++) { const s = i % 2 ? 1 : -1; dum.position.set(-1500 + Math.floor(i / 2) * 20, .55, ZS + s * 12); dum.updateMatrix(); bd.setMatrixAt(i, dum.matrix); bd.setColorAt(i, new THREE.Color((i >> 1) % 2 ? COP : NAVY)); }
  scene.add(bd);
  const ln = new THREE.InstancedMesh(new THREE.PlaneGeometry(3, .15), M(0xffffff), 400); for (let i = 0; i < 400; i++) { dum.position.set(-1500 + i * 8, .012, ZS); dum.rotation.set(-Math.PI / 2, 0, 0); dum.updateMatrix(); ln.setMatrixAt(i, dum.matrix); } scene.add(ln); }
// Garaje (pit box) para las mantas
const GAR = V3(0, 0, 320); const garage = new THREE.Group(); garage.position.copy(GAR); scene.add(garage);
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), M(0x55595f, { roughness: .35, metalness: .1 })); fl.rotation.x = -Math.PI / 2; fl.position.y = .005; garage.add(fl);
  const wl = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), M(0x1b2535, { roughness: .8 })); wl.position.set(0, 3, -3); garage.add(wl);
  for (let i = -2; i <= 2; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(1.6, .5, .02), M(COP, { emissive: 0x3a1a08 })); p.position.set(i * 2.4, 3.6, -2.98); garage.add(p); } }
const garLight = new THREE.PointLight(0xffd9b0, 0, 12, 1.5); garLight.position.set(1.5, 3, 2); garage.add(garLight);

// ==========================================================================
// MOTO + PILOTO (1 = 1 m; adelante +x, derecha +z)
// ==========================================================================
const UPV = V3(0, 1, 0);
function limb(r, mat) { const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, 1, 4, 10), mat); m.userData.r = r; return m; }
function setLimb(m, a, b) { const d = b.clone().sub(a); const L = d.length(); m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(UPV, d.normalize()); m.scale.set(1, Math.max(.05, L - m.userData.r * 0) / 1 * .8, 1); }
function wheel(front) { const g = new THREE.Group(); const tyreMat = M(0x18191c, { roughness: .8 });
  const tyre = new THREE.Mesh(new THREE.TorusGeometry(.245, .07, 14, 48), tyreMat); g.add(tyre);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .05, 32), M(0x2a2d33, { metalness: .6, roughness: .35 })); rim.rotation.x = Math.PI / 2; g.add(rim);
  for (let i = 0; i < 3; i++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(.36, .03, .06), M(COP, { metalness: .4, roughness: .35 })); sp.rotation.z = i * Math.PI / 3; g.add(sp); }
  let discMat = null; if (front) { discMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2c, roughness: .5, metalness: .3, emissive: 0x000000 });
    for (const z of [-.075, .075]) { const d = new THREE.Mesh(new THREE.CylinderGeometry(.17, .17, .012, 40, 1, false), discMat); d.rotation.x = Math.PI / 2; d.position.z = z; g.add(d);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .016, 24), M(0x3a3d44, { metalness: .6 })); hub.rotation.x = Math.PI / 2; hub.position.z = z; g.add(hub); } }
  return { g, tyre, tyreMat, discMat }; }
function makeBike() { const root = new THREE.Group(); const lean = new THREE.Group(); root.add(lean); const pitch = new THREE.Group(); lean.add(pitch);
  const cop = M(COP, { roughness: .3, metalness: .15 }), navy = M(NAVY, { roughness: .35 }), dark = M(0x111216, { roughness: .6 }), white = M(WHITE, { roughness: .35 });
  const add = (m, x, y, z = 0) => { m.position.set(x, y, z); pitch.add(m); return m; };
  const tank = add(new THREE.Mesh(new THREE.CapsuleGeometry(.16, .55, 6, 14), cop), .08, .66); tank.rotation.z = Math.PI / 2 + .12; tank.scale.set(1, 1, .78);
  const nose = add(new THREE.Mesh(new THREE.ConeGeometry(.17, .42, 18), cop), .66, .7); nose.rotation.z = -Math.PI / 2 - .2; nose.scale.set(1, 1, .8);
  const side = add(new THREE.Mesh(new THREE.BoxGeometry(.72, .26, .3), navy), .18, .46);
  const belly = add(new THREE.Mesh(new THREE.BoxGeometry(.6, .1, .22), dark), .1, .3);
  const tail = add(new THREE.Mesh(new THREE.BoxGeometry(.5, .14, .22), cop), -.55, .8); tail.rotation.z = .18;
  const seat = add(new THREE.Mesh(new THREE.BoxGeometry(.3, .05, .2), dark), -.28, .77);
  const scr = add(new THREE.Mesh(new THREE.SphereGeometry(.13, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x223344, transparent: true, opacity: .7, roughness: .05 })), .5, .84); scr.rotation.z = -.9; scr.scale.set(1, 1.3, .9);
  const stripe = add(new THREE.Mesh(new THREE.BoxGeometry(.6, .04, .31), white), .2, .56);
  const swing = add(new THREE.Mesh(new THREE.BoxGeometry(.62, .06, .16), dark), -.38, .34); swing.rotation.z = .16;
  const exh = add(new THREE.Mesh(new THREE.CylinderGeometry(.045, .055, .4, 12), M(0x8a8f99, { metalness: .9, roughness: .25 })), -.5, .52, .13); exh.rotation.z = Math.PI / 2 + .35;
  const rear = wheel(false); rear.g.position.set(-.7, .315, 0); pitch.add(rear.g);
  const steer = new THREE.Group(); steer.position.set(.6, 0, 0); pitch.add(steer); steer.rotation.order = 'YXZ';
  const front = wheel(true); front.g.position.set(.12, .315, 0); steer.add(front.g);
  for (const z of [-.09, .09]) { const f = limb(.025, M(0xc9a640, { metalness: .8, roughness: .25 })); setLimb(f, V3(.12, .315, z), V3(-.08, .85, z)); steer.add(f); }
  const bars = new THREE.Mesh(new THREE.BoxGeometry(.04, .03, .62), dark); bars.position.set(-.1, .86, 0); steer.add(bars);
  const caliper = new THREE.Mesh(new THREE.BoxGeometry(.08, .1, .04), M(0xd23a2e, { roughness: .4 })); caliper.position.set(.02, .48, .1); steer.add(caliper);
  // piloto
  const suit = M(0x1d2a44, { roughness: .6 }), suit2 = M(COP, { roughness: .5 }), glove = M(0x111111);
  const torso = limb(.15, suit); pitch.add(torso); const helmet = new THREE.Mesh(new THREE.SphereGeometry(.145, 24, 16), white); pitch.add(helmet);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(.147, 20, 12, -.9, 1.8, 1.1, .7), M(0x0b0e14, { roughness: .05, metalness: .5 })); helmet.add(visor); visor.rotation.y = Math.PI / 2;
  const hstripe = new THREE.Mesh(new THREE.TorusGeometry(.146, .015, 6, 32, Math.PI), suit2); hstripe.rotation.y = Math.PI / 2; helmet.add(hstripe);
  const hump = new THREE.Mesh(new THREE.SphereGeometry(.12, 12, 10), suit2); pitch.add(hump);
  const L = {}; for (const k of ['thL', 'shL', 'thR', 'shR']) { L[k] = limb(.075, k.startsWith('th') ? suit : suit2); pitch.add(L[k]); }
  for (const k of ['uaL', 'faL', 'uaR', 'faR']) { L[k] = limb(.055, suit); pitch.add(L[k]); }
  const slider = new THREE.Mesh(new THREE.SphereGeometry(.06, 16, 10), M(0xf0f0f0, { roughness: .3 })); slider.scale.set(1.2, .5, 1); pitch.add(slider);
  const bike = { root, lean, pitch, steer, front, rear, torso, helmet, hump, L, slider, dist: 0, knee: 0, tuck: 1, steerA: 0 };
  scene.add(root); return bike; }
const BK = makeBike();
const _q = new THREE.Vector3();
function poseBike(b) { // piloto según steer/knee/tuck
  b.steer.rotation.y = b.steerA; const tk = b.tuck;
  const hip = V3(-.24, .86, 0), sh = V3(lerp(.12, .05, 1 - tk), lerp(1.0, 1.15, 1 - tk), 0), head = V3(lerp(.3, .14, 1 - tk), lerp(1.04, 1.3, 1 - tk), 0);
  setLimb(b.torso, hip, sh); b.helmet.position.copy(head); b.hump.position.set(-.05, lerp(1.0, 1.08, 1 - tk), 0);
  const grip = s => V3(-.1, .86, s * .3).applyAxisAngle(UPV, b.steerA).add(V3(.6, 0, 0));
  for (const [s, k] of [[-1, 'L'], [1, 'R']]) { const shp = sh.clone().add(V3(0, -.04, s * .17)); const g = grip(s); const el = shp.clone().lerp(g, .5).add(V3(-.02, -.1, s * .1));
    setLimb(b.L['ua' + k], shp, el); setLimb(b.L['fa' + k], el, g);
    const out = s > 0 ? b.knee : 0; const knee = V3(lerp(.16, .1, out), lerp(.62, .53, out), s * lerp(.2, .3, out)); const foot = V3(-.2, .42, s * lerp(.15, .2, out));
    setLimb(b.L['th' + k], hip.clone().add(V3(0, 0, s * .1)), knee); setLimb(b.L['sh' + k], knee, foot); if (s > 0) b.slider.position.copy(knee).add(V3(0, -.06, .03 * out)); }
  b.front.g.children[0].parent.rotation.z = -b.dist / .315; b.rear.g.rotation.z = -b.dist / .315;
}
function sliderWorld(b) { b.root.updateMatrixWorld(true); return b.slider.getWorldPosition(new THREE.Vector3()); }
function bikeFwd(b) { return V3(Math.cos(b.root.rotation.y), 0, -Math.sin(b.root.rotation.y)); }
function bikeRight(b) { return V3(Math.sin(b.root.rotation.y), 0, Math.cos(b.root.rotation.y)); }
// En la curva: centro a la derecha (+z local)
function onCorner(b, phi) { const h = -phi; b.root.rotation.set(0, h, 0); const r = bikeRight(b); b.root.position.copy(r.multiplyScalar(-RPATH)); b.dist = phi * RPATH; }
// Huellas y tarjeta
const patchMat = new THREE.MeshBasicMaterial({ color: 0xffb070, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
const patches = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.BoxGeometry(.11, .004, .07), patchMat); scene.add(m); return m; });
const cardTex = (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 324; const x = c.getContext('2d'); const gr = x.createLinearGradient(0, 0, 512, 324); gr.addColorStop(0, '#1d3a6a'); gr.addColorStop(1, '#0d1a30'); x.fillStyle = gr; x.fillRect(0, 0, 512, 324);
  x.fillStyle = '#d9b26a'; x.fillRect(50, 110, 80, 60); x.fillStyle = '#e8eef8'; x.font = '600 34px monospace'; x.fillText('4242  ••••  ••••  0000', 40, 240); x.font = '800 30px sans-serif'; x.fillStyle = '#e3a372'; x.fillText('NO LO SABÍAS', 300, 60); return new THREE.CanvasTexture(c); })();
cardTex.colorSpace = THREE.SRGBColorSpace;
const card = new THREE.Mesh(new THREE.BoxGeometry(.0856, .0015, .054), [M(0x0d1a30), M(0x0d1a30), new THREE.MeshStandardMaterial({ map: cardTex, emissiveMap: cardTex, emissive: 0xffffff, emissiveIntensity: .7, roughness: .35 }), M(0x0d1a30), M(0x0d1a30), M(0x0d1a30)]); scene.add(card);
// Manta calefactora
const blanketMat = new THREE.MeshStandardMaterial({ color: 0x2a2f3a, roughness: .9, emissive: 0x000000 });
const blanket = new THREE.Mesh(new THREE.TorusGeometry(.245, .092, 14, 48, Math.PI * 1.55), blanketMat); scene.add(blanket);

// Partículas
const PS = new Particles(20000, { size: .03, seed: 11 }); scene.add(PS.obj);
const HOT = [1.8, .8, .3], SWEAT = [.5, .8, 1.4], COLD = [.7, .9, 1.4];

// ==========================================================================
// HUD
// ==========================================================================
function stamp(s, x, y, a, rot = -.08, col = '#ff6a4a', size = 86) { if (a <= .01) return; const sc = lerp(1.6, 1, easeOut(clamp(a * 1.4)));
  g2.save(); g2.translate(x, y); g2.rotate(rot); g2.scale(sc, sc); g2.globalAlpha = clamp(a); g2.strokeStyle = col; g2.lineWidth = 8; g2.shadowColor = col; g2.shadowBlur = 25;
  g2.font = `800 ${size}px Montserrat`; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.letterSpacing = '6px'; const w = g2.measureText(s).width + 70; g2.strokeRect(-w / 2, -size * .8, w, size * 1.6); g2.fillStyle = col; g2.fillText(s, 0, 4); g2.restore(); }
function two(top, l1, l2, a, y = 300) { if (a <= .01) return; txt(l1, W / 2, y, 50, { font: 'Montserrat', weight: 800, alpha: a }); if (l2) txt(l2, W / 2, y + 62, 50, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(160, 920, y + 62, .5) }); if (top) txt(top, W / 2, y - 62, 24, { spacing: 7, alpha: a * .8, fill: '#e3a372' }); }
const win = (t, a, b, f = .3) => smooth(a, a + f, t) * (1 - smooth(b - f, b, t));
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
function dashed(x0, y0, x1, y1, a, col = '#ffffff', w = 4) { g2.save(); g2.globalAlpha = a; g2.strokeStyle = col; g2.lineWidth = w; g2.setLineDash([16, 14]); g2.beginPath(); g2.moveTo(x0, y0); g2.lineTo(x1, y1); g2.stroke(); g2.restore(); }
function leanGauge(b, a, deg) { if (a <= .01) return; const P0 = b.root.position.clone(); const up = V3(0, 1.25, 0); const ax = up.clone().applyAxisAngle(bikeFwd(b), -b.lean.rotation.x).add(P0);
  const p = project(P0), v = project(P0.clone().add(up)), q = project(ax);
  dashed(p.x, p.y, v.x, v.y, a * .8); g2.save(); g2.globalAlpha = a; g2.strokeStyle = '#ffb070'; g2.shadowColor = '#ff8a3a'; g2.shadowBlur = 20; g2.lineWidth = 7; g2.beginPath(); g2.moveTo(p.x, p.y); g2.lineTo(q.x, q.y); g2.stroke();
  const a0 = Math.atan2(v.y - p.y, v.x - p.x), a1 = Math.atan2(q.y - p.y, q.x - p.x); const R = Math.min(Math.hypot(v.x - p.x, v.y - p.y), Math.hypot(q.x - p.x, q.y - p.y)) * .55;
  g2.lineWidth = 5; g2.beginPath(); g2.arc(p.x, p.y, R, Math.min(a0, a1), Math.max(a0, a1)); g2.stroke(); g2.restore();
  const m = (a0 + a1) / 2; txt(deg, clamp(p.x + Math.cos(m) * (R + 90), 170, W - 170), p.y + Math.sin(m) * (R + 60), 76, { font: 'Montserrat', weight: 800, alpha: a, fill: '#ffe2c0', shadow: 20 }); }

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
let last = 0;
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .02; camera.far = 6000; camera.fov = 40;
  let bloomS = .45, flash = 0, ca = .0013, fade = 0, expo = 1.4, focus = V3();
  for (const k of ['torso', 'helmet', 'hump', 'slider']) BK[k].visible = true; for (const k in BK.L) BK.L[k].visible = true;
  PS.begin(); PS.mat.size = .03; PS.mat.blending = THREE.AdditiveBlending;
  scene.fog.density = .004; hemi.intensity = 2.1; sun.intensity = 3.4; garLight.intensity = 0; patchMat.opacity = 0; card.visible = false; blanket.visible = false;
  skyMat.uniforms.uTop.value.setRGB(.08, .2, .48); skyMat.uniforms.uHor.value.setRGB(.85, .75, .62);
  BK.front.discMat.emissive.setRGB(0, 0, 0); BK.front.tyreMat.color.setHex(0x18191c); BK.front.tyreMat.emissive.setRGB(0, 0, 0); BK.rear.tyreMat.color.setHex(0x18191c); BK.rear.tyreMat.emissive.setRGB(0, 0, 0);
  BK.lean.rotation.set(0, 0, 0); BK.pitch.rotation.set(0, 0, 0); BK.pitch.position.set(0, 0, 0); BK.steerA = 0; BK.knee = 0; BK.tuck = 1;
  for (const c of ['how', 'grip', 'brake', 'fast', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];

  if (t < TL.how) {
    // A · curva a fondo: inclinación y rodilla
    const lt = t - TL.hook; const phi = .2 + lt * .55; onCorner(BK, phi); const lean = lerp(.95, 1.02, smooth(TL.lean, TL.lean + 1.2, t)); BK.lean.rotation.x = lean; BK.knee = 1; poseBike(BK);
    const f = bikeFwd(BK), r = bikeRight(BK), P = BK.root.position.clone();
    const zoom = smooth(TL.sensor, TL.touch + .5, t);
    if (t < TL.sensor) { focus = P.clone().add(V3(0, .45, 0)).add(r.clone().multiplyScalar(.35)); camera.position.copy(P).add(f.clone().multiplyScalar(lerp(4.2, 3.0, smooth(0, TL.lean, t)))).add(r.clone().multiplyScalar(-.9)).add(V3(0, .75, 0)); camera.fov = 44; }
    else { const kw = sliderWorld(BK); focus = kw.clone().lerp(P.clone().add(V3(0, .4, 0)), .35 * (1 - zoom)); camera.position.copy(kw).add(f.clone().multiplyScalar(lerp(3.0, 1.3, zoom))).add(r.clone().multiplyScalar(lerp(.2, .55, zoom))).add(V3(0, lerp(.6, .22, zoom), 0)); camera.position.y = Math.max(.14, camera.position.y); camera.fov = lerp(44, 40, zoom); }
    camera.lookAt(focus); camera.position.add(shake(t, .015, 14));
    const sp = smooth(TL.touch - .3, TL.touch, t); if (sp > 0) { const kw = sliderWorld(BK); kw.y = Math.max(kw.y, .02); emitJet(PS, kw, f.clone().multiplyScalar(-1).add(V3(0, .25, 0)), 700 * sp, t, 3.5, 1.4, .35, HOT, 6); PS.mat.size = .02; bloomS = .7; }
    hud.push(() => { two(null, '¿POR QUÉ SACAN', 'LA RODILLA?', smooth(.1, .4, lt) * (1 - smooth(TL.lean - .2, TL.lean, t)), 300);
      leanGauge(BK, win(t, TL.lean, TL.sensor + .2), '+60°'); two('EN CURVA', 'SE TUMBA MÁS', 'DE 60 GRADOS', win(t, TL.lean, TL.sensor), 300);
      two(null, 'LA RODILLA', 'ES SU SENSOR', win(t, TL.sensor, TL.how), 300);
      callout(sliderWorld(BK), -60, -330, 'DESLIZADOR', 'roza el asfalto', smooth(TL.touch + .2, TL.touch + .6, t) * (1 - smooth(TL.how - .3, TL.how, t)), '#ffb070'); });
  } else if (t < TL.grip) {
    // B · contramanillar en la recta
    const lt = t - TL.how; const x = 40 + lt * 22; const push = smooth(TL.push + .3, TL.push + 1.2, t) * (1 - smooth(TL.fall - .1, TL.fall + .6, t));
    const fall = smooth(TL.fall - .1, TL.fall + 1.0, t); const turn = smooth(TL.fall + .3, TL.grip, t);
    BK.steerA = push * .3 - fall * .04; BK.lean.rotation.x = fall * .85; BK.root.rotation.set(0, -turn * turn * .5, 0); BK.root.position.set(x, 0, ZS - 3 + turn * turn * 5); BK.dist = x; BK.knee = fall; BK.tuck = lerp(.4, 1, fall); poseBike(BK);
    const P = BK.root.position.clone(); const f = bikeFwd(BK);
    if (t < TL.push) { focus = P.clone().add(V3(1.5, .7, 0)); camera.position.copy(P).add(V3(lerp(-6, -4, clamp(lt / 3)), 1.6, 1.2)); camera.fov = 40; camera.lookAt(focus); }
    else if (t < TL.fall + .2) { focus = P.clone().add(V3(.62, .6, 0)); camera.up.set(1, 0, 0); camera.position.copy(P).add(V3(.4, 2.1, 0)); camera.fov = 44; camera.lookAt(focus); for (const k of ['torso', 'helmet', 'hump']) BK[k].visible = false; }
    else { const k = smooth(TL.fall + .2, TL.fall + 1.6, t); focus = P.clone().add(V3(0, .7, 0)); camera.position.copy(P).add(f.clone().multiplyScalar(-4.2)).add(V3(0, 1.3 + k * .3, -.4)); camera.fov = 42; camera.lookAt(focus); }
    hud.push(() => { two(null, '¿Y CÓMO LA TUMBAN', 'TAN RÁPIDO?', smooth(.1, .4, lt) * (1 - smooth(TL.trick - .2, TL.trick, t)), 300);
      two(null, 'UN TRUCO QUE', 'CASI NADIE CONOCE', win(t, TL.trick, TL.push), 300);
      if (t >= TL.push && t < TL.fall + .2) { BK.root.updateMatrixWorld(true); const gR = V3(-.1, .86, .3).applyAxisAngle(UPV, BK.steerA).add(V3(.6, 0, 0)); BK.pitch.localToWorld(gR); const p = project(gR);
        const aa = smooth(TL.push + .1, TL.push + .5, t); const px = Math.min(W - 150, p.x + 40); arrowXY(px, p.y + 170, px, p.y - 40, aa, '#ffb070', 16); txt('EMPUJA', px, p.y + 235, 40, { font: 'Montserrat', weight: 800, alpha: aa, fill: '#ffb070' });
        const fw = V3(.72, .32, 0).applyAxisAngle(UPV, BK.steerA).add(V3(.12 * 0, 0, 0)); const fw0 = BK.front.g.getWorldPosition(new THREE.Vector3()); const pf = project(fw0);
        two(null, 'PARA GIRAR A LA DERECHA', 'PUÑO DERECHO ADELANTE', win(t, TL.push, TL.reverse + .1), 300);
        const ra = smooth(TL.reverse, TL.reverse + .3, t); two(null, 'LA RUEDA GIRA', '¡AL REVÉS!', ra, 300); callout(fw0.clone().add(V3(.25, .3, 0)), 160, 200, '⟵ IZQUIERDA', 'un instante', ra * (1 - smooth(TL.fall, TL.fall + .2, t)), '#ff8a5a'); }
      two(null, 'Y LA MOTO CAE', 'HACIA LA DERECHA', win(t, TL.fall + .1, TL.name), 300);
      stamp('CONTRAMANILLAR', W / 2, 330, smooth(TL.name, TL.name + .3, t), -.05, '#ffe2c0', 70); });
  } else if (t < TL.brake) {
    // C · huella de contacto y mantas
    const lt = t - TL.grip;
    if (t < TL.warm) { const x = 200; BK.root.position.set(x, 0, ZS); BK.root.rotation.set(0, 0, 0); BK.dist = 0; BK.tuck = .2; poseBike(BK);
      const pr = V3(x - .7, .003, ZS), pf = V3(x + .72, .003, ZS); patches[0].position.copy(pr); patches[1].position.copy(pf);
      const pa = smooth(TL.card - .2, TL.card + .4, t); patchMat.opacity = pa * (.75 + .25 * Math.sin(t * 7)); const close = smooth(TL.card + 1.6, TL.card + 3.0, t);
      card.visible = close > 0; card.position.set(x + .72 + .17, .001 + .0008, ZS + .17); card.rotation.y = .35;
      if (close <= 0) { focus = V3(x, .4, ZS); camera.position.set(x + 1.2, .5, ZS + 3.8); camera.fov = 40; camera.lookAt(focus); }
      else { focus = V3(x + .82, .02, ZS + .08); camera.position.copy(V3(x + .78, .03, ZS).add(V3(lerp(1.2, .62, close), lerp(.5, .16, close), lerp(3.8, .3, close)))); camera.fov = lerp(40, 46, close); camera.lookAt(focus); }
      hud.push(() => { two(null, '¿Y CÓMO', 'NO SE CAEN?', smooth(.1, .4, lt) * (1 - smooth(TL.card - .2, TL.card, t)), 300);
        two('TODO EL AGARRE', 'DOS TROZOS DE GOMA', null, win(t, TL.card, TL.card + 1.8), 300);
        if (close <= .1) for (const p of patches) callout(p.position, p === patches[0] ? -140 : 120, 260, 'HUELLA', 'de contacto', pa * (1 - smooth(TL.card + 1.2, TL.card + 1.6, t)), '#ffb070');
        two(null, 'DEL TAMAÑO DE UNA', 'TARJETA DE CRÉDITO', smooth(TL.card + 2.0, TL.card + 2.4, t), 300); });
    } else { // garaje: manta calefactora → goma fría
      const P = GAR.clone(); BK.root.position.copy(P); BK.root.rotation.set(0, .5, 0); BK.dist = 0; BK.tuck = 0; BK.pitch.position.y = .06; poseBike(BK);
      for (const k of ['torso', 'helmet', 'hump', 'slider']) BK[k].visible = false; for (const k in BK.L) BK.L[k].visible = false;
      hemi.intensity = 1.3; sun.intensity = 1.2; garLight.intensity = 30; scene.fog.density = .01;
      const heat = smooth(TL.warm + .3, TL.cold - .1, t), cold = smooth(TL.cold, TL.cold + .4, t);
      BK.root.updateMatrixWorld(true); const rw = BK.rear.g.getWorldPosition(new THREE.Vector3()); blanket.visible = cold < .5; blanket.position.copy(rw); blanket.quaternion.copy(BK.root.quaternion); blanket.rotation.z = Math.PI * .72;
      blanketMat.emissive.setRGB(heat * .45, heat * .12, heat * .02);
      if (cold > 0) { for (const tm of [BK.rear.tyreMat, BK.front.tyreMat]) { tm.color.setRGB(lerp(.09, .45, cold), lerp(.09, .6, cold), lerp(.1, .8, cold)); tm.emissive.setRGB(0, cold * .06, cold * .14); }
        emitRise(PS, rw.clone().add(V3(0, -.1, 0)), 500 * cold, t, .35, .6, 1.6, COLD); PS.mat.size = .012; }
      else if (heat > 0) { emitRise(PS, rw.clone().add(V3(0, .25, 0)), 600 * heat, t, .25, .8, 1.4, [1.2 * heat, .5 * heat, .2 * heat]); PS.mat.size = .015; }
      focus = rw.clone().add(V3(0, .05, 0)); const az = .9 + (t - TL.warm) * .05; camera.position.copy(focus).add(V3(Math.sin(az) * 1.6, .35, Math.cos(az) * 1.6)); camera.fov = 42; camera.lookAt(focus); bloomS = .6;
      hud.push(() => { two('ANTES DE SALIR', 'MANTAS ELÉCTRICAS', 'EN LAS RUEDAS', win(t, TL.warm + .1, TL.cold), 300);
        const ba = win(t, TL.warm + .5, TL.cold); bar(170, 1560, 740, heat, 'TEMPERATURA DE LA GOMA', heat > .9 ? 'caliente' : 'calentando…', ba, heat > .5 ? '#ff8a4a' : '#9fb8d8');
        two(null, 'LA GOMA FRÍA', 'NO AGARRA', cold, 300); stamp('SIN AGARRE', W / 2, 1500, smooth(TL.cold + .4, TL.cold + .7, t), -.06, '#9fdcff', 74); });
    }
  } else if (t < TL.fast) {
    // D · frenada: disco al rojo, fuerza y sudor
    const lt = t - TL.brake; const dec = smooth(TL.brake, TL.force + 2.5, t); const v = lerp(60, 14, dec); const x = 500 + (lt * 60 - lt * lt * 2.5); BK.root.position.set(x, 0, ZS - 2); BK.root.rotation.set(0, 0, 0); BK.dist = x;
    const dive = smooth(TL.brake, TL.brake + .6, t) * (1 - smooth(TL.sweat + 1, TL.fast, t)); BK.pitch.rotation.z = -dive * .07; BK.pitch.position.y = dive * .05; BK.tuck = lerp(1, .3, dive); poseBike(BK);
    const heat = smooth(TL.brake + .3, TL.red + .3, t); const e = heat; BK.front.discMat.emissive.setRGB(e * 2.2, e * e * .55, e * e * e * .1); bloomS = .55 + heat * .35;
    BK.root.updateMatrixWorld(true); const fw = BK.front.g.getWorldPosition(new THREE.Vector3());
    if (t < TL.force) { focus = fw.clone().add(V3(-.05, .05, 0)); camera.position.copy(fw).add(V3(lerp(.9, .5, clamp(lt / 3)), .15, -1.25)); camera.fov = 40; camera.lookAt(focus); camera.position.add(shake(t, .01, 20));
      if (heat > .3) { emitRise(PS, fw.clone().add(V3(0, 0, -.08)), 600 * heat, t, .15, .5, .5, [heat * 1.4, heat * .4, .1]); PS.mat.size = .006; } }
    else if (t < TL.sweat) { focus = BK.root.position.clone().add(V3(.15, .75, 0)); camera.position.copy(focus).add(V3(.5, .25, -3.4)); camera.fov = 40; camera.lookAt(focus); }
    else { const hw = BK.helmet.getWorldPosition(new THREE.Vector3()); focus = hw.clone().add(V3(-.25, -.2, 0)); camera.position.copy(focus).add(V3(1.5, .35, -2.5)); camera.fov = 40; camera.lookAt(focus);
      const sw = smooth(TL.sweat, TL.sweat + .6, t); emitJet(PS, hw.clone().add(V3(-.2, -.15, 0)), V3(-1, -.4, 0), 1600 * sw, t, 1.4, 1.2, .8, SWEAT, 5); PS.mat.size = .022; }
    hud.push(() => { two(null, 'AL FRENAR', 'LOS DISCOS DE CARBONO', smooth(.1, .4, lt) * (1 - smooth(TL.red - .2, TL.red, t)), 300);
      const tc = Math.round(lerp(150, 830, heat)); const sa = smooth(TL.brake + .4, TL.brake + .8, t) * (1 - smooth(TL.force - .3, TL.force, t)); bigStat('TEMPERATURA DEL DISCO', (tc >= 800 ? '+800' : fmt(tc)) + ' °C', 1560, sa, .5);
      two(null, 'SE PONEN', 'AL ROJO VIVO', win(t, TL.red, TL.force), 300);
      if (t >= TL.force && t < TL.sweat) { const aa = smooth(TL.force + .3, TL.force + .8, t); BK.root.updateMatrixWorld(true);
        for (const s of [1]) { const sh = BK.torso.getWorldPosition(new THREE.Vector3()).add(V3(.1, .05, s * -.1)); const g = V3(-.1, .86, -.3).applyAxisAngle(UPV, BK.steerA).add(V3(.6, 0, 0)); BK.pitch.localToWorld(g); const a = project(sh), b = project(g); arrowXY(a.x, a.y, b.x + (b.x - a.x) * .25, b.y + (b.y - a.y) * .25, aa, '#ff6a4a', 16); }
        two('FRENADA BESTIA', 'EMPUJA MÁS FUERTE', 'QUE SU PROPIO PESO', smooth(TL.force, TL.force + .4, t) * (1 - smooth(TL.sweat - .2, TL.sweat, t)), 300); }
      const wa = smooth(TL.sweat + .2, TL.sweat + .6, t); bigStat('SUDOR EN UNA CARRERA', '−2 kg', 420, wa, .5); });
  } else if (t < TL.brand) {
    // E · recta a fondo: 366 km/h
    const lt = t - TL.fast; const v = lerp(70, 101.7, smooth(TL.speed, TL.brand - 1, t)); const x = -800 + lt * 75 + smooth(TL.speed, TL.brand, t) * 120; BK.root.position.set(x, 0, ZS + 2); BK.root.rotation.set(0, 0, 0); BK.dist = x; BK.tuck = 1; poseBike(BK);
    BK.pitch.position.y = Math.sin(t * 40) * .003; const P = BK.root.position.clone();
    const k = smooth(TL.speed - .2, TL.speed + 1.4, t); focus = P.clone().add(V3(lerp(.6, 0, k), .55, 0)); camera.position.copy(P).add(V3(lerp(3.5, -3.8, k), lerp(.35, .9, k), lerp(-2.4, -1.1, k))); camera.fov = lerp(38, 52, k); camera.lookAt(focus);
    camera.position.add(shake(t, .02 + k * .03, 20)); ca = .0015 + k * .004;
    for (let i = 0; i < 900; i++) { const s = PS.seed, q = i * 4; const zz = (s[q + 1] - .5) * 16; const xx = P.x + 30 - fract(s[q] + t * 3) * 60; PS.push(xx, s[q + 2] * 3, ZS + 2 + zz, .5 * k, .5 * k, .55 * k); } PS.mat.size = .03;
    hud.push(() => { two(null, '¿Y LO MÁS', 'RÁPIDO?', smooth(.1, .4, lt) * (1 - smooth(TL.speed - .2, TL.speed, t)), 300);
      const sa = smooth(TL.speed, TL.speed + .3, t); const kmh = Math.round(lerp(180, 366, smooth(TL.speed, TL.speed + 3.2, t)));
      txt('RÉCORD DE MOTOGP EN RECTA', W / 2, 262, 24, { spacing: 6, alpha: sa * .85, fill: '#e3a372' }); txt(kmh + ' km/h', W / 2, 390, 130, { font: 'Montserrat', weight: 800, alpha: sa, fill: kmh >= 366 ? copperGrad(160, 920, 390, .5) : '#fff' }); });
  } else {
    // F · marca: noche en la recta
    const lt = t - TL.brand; BK.root.position.set(1200, 0, ZS); BK.root.rotation.set(0, 0, 0); BK.dist = 0; BK.tuck = .2; poseBike(BK);
    skyMat.uniforms.uTop.value.setRGB(.01, .02, .06); skyMat.uniforms.uHor.value.setRGB(.08, .08, .14); hemi.intensity = .25; sun.intensity = .35; scene.fog.color.setRGB(.03, .04, .08); scene.fog.density = .02;
    focus = V3(1200.2, .6, ZS); const az = 1.2 + lt * .08; camera.position.copy(focus).add(V3(Math.sin(az) * 4.5, .7, Math.cos(az) * 4.5)); camera.fov = 40; camera.lookAt(focus); fade = Math.min(.45, lt * .4); expo = .85;
    BK.front.discMat.emissive.setRGB(.5, .08, .01);
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  if (t < TL.brand) scene.fog.color.setRGB(.62, .7, .82);
  sky.position.copy(camera.position); PS.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, bloom: bloomS, expo });
}
function renderCover() { renderFrame(TL.lean + .8); coverText('LOS SECRETOS', 'DE LAS MOTOS', 'de carreras que nadie te cuenta'); }
window.renderCover = () => { renderCover(); return true; };
window.OBJ = { PS, BK, scene };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
