// NO LO SABÍAS — "¿Qué hay dentro de una batería?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final. Unidades arbitrarias (esquema, no a escala).
// Celda de ion-litio genérica: ánodo de grafito sobre cobre, separador poroso + electrolito líquido, cátodo de óxido metálico laminar sobre aluminio.
// Carga: los electrones salen del cátodo por el circuito externo (impulsados por el cargador) y los Li+ cruzan el electrolito y se intercalan en el grafito.
// Descarga: al revés; los electrones no atraviesan el separador y recorren el circuito del móvil. Envejecimiento: el litio queda atrapado (capa SEI, depósitos).
// 4.000 mAh = 14.400 C → 14.400 / 1,602e-19 ≈ 9·10²² cargas ≈ 90.000 trillones. Litio: 0,534 g/cm³; 2 Li + 2 H₂O → 2 LiOH + H₂.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, easeIn, rng, V3, g2, camera, Particles, txt, copperGrad, project, callout, titleHUD, fract, camOrbit, bigStat, bar, drawBrand, coverText, finish, arrowXY, noise1 } from '../../lib/core.js';

const scene = new THREE.Scene(); scene.background = new THREE.Color(0x05070d);
const hemi = new THREE.HemisphereLight(0xc8d8ff, 0x403830, 1.6); scene.add(hemi);
const key = new THREE.DirectionalLight(0xffe0c0, 2.4); key.position.set(30, 50, 60); scene.add(key);
const fillL = new THREE.DirectionalLight(0x8ab0ff, 1.0); fillL.position.set(-50, 10, 40); scene.add(fillL);
const rim = new THREE.DirectionalLight(0xffa070, 1.2); rim.position.set(0, -30, -60); scene.add(rim);
const M = (c, r = .5, m = .3, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: e });
const box = (w, h, d, mat, x = 0, y = 0, z = 0, parent = scene) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; };
function xray(col, k = 1) { return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  uniforms: { uCol: { value: col.clone() }, uA: { value: k } },
  vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform vec3 uCol; uniform float uA; varying vec3 vN; varying vec3 vV; void main(){ float f=pow(clamp(1.-abs(dot(vN,vV)),0.,1.),2.); gl_FragColor=vec4(uCol*(f*.8+.05)*uA,(f*.7+.04)*uA); }` }); }
function roundRect(w, h, r) { const s = new THREE.Shape(); s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2); return s; }
// pantalla de móvil (textura de lienzo, se redibuja solo si cambia)
function screenTex() { const c = document.createElement('canvas'); c.width = 360; c.height = 760; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; let last = '';
  t.draw = (pct, mode) => { const k = mode + pct; if (k === last) return; last = k; const x = c.getContext('2d'); const gr = x.createLinearGradient(0, 0, 360, 760);
    if (mode === 'wall') { gr.addColorStop(0, '#2a6ad8'); gr.addColorStop(.5, '#8a3ad0'); gr.addColorStop(1, '#e8704a'); x.fillStyle = gr; x.fillRect(0, 0, 360, 760); x.fillStyle = 'rgba(255,255,255,.9)'; x.font = '700 92px Montserrat'; x.textAlign = 'center'; x.fillText('12:00', 180, 220); x.font = '300 30px Inter'; x.fillText('sábado, 7 de noviembre', 180, 270);
      for (let i = 0; i < 8; i++) { x.fillStyle = `rgba(255,255,255,${.22})`; const bx = 40 + (i % 4) * 75, by = 520 + Math.floor(i / 4) * 90; x.beginPath(); x.roundRect(bx, by, 58, 58, 14); x.fill(); } }
    else { gr.addColorStop(0, '#05080f'); gr.addColorStop(1, '#0b1322'); x.fillStyle = gr; x.fillRect(0, 0, 360, 760); x.strokeStyle = '#7dffa0'; x.lineWidth = 8; x.beginPath(); x.roundRect(110, 250, 140, 250, 18); x.stroke(); x.fillStyle = '#7dffa0'; x.fillRect(150, 232, 60, 18);
      const f = pct / 100; x.fillStyle = 'rgba(125,255,160,.85)'; x.fillRect(122, 488 - 226 * f, 116, 226 * f); x.fillStyle = '#05080f'; x.beginPath(); x.moveTo(190, 300); x.lineTo(150, 390); x.lineTo(182, 390); x.lineTo(168, 455); x.lineTo(212, 360); x.lineTo(180, 360); x.closePath(); x.fill();
      x.fillStyle = '#ffffff'; x.font = '800 64px Montserrat'; x.textAlign = 'center'; x.fillText(pct + ' %', 180, 590); }
    t.needsUpdate = true; }; return t; }

// ==========================================================================
// A · MÓVIL CARGANDO (rayos X: batería dentro)
// ==========================================================================
const PH = V3(0, 1000, 0); const ph = new THREE.Group(); ph.position.copy(PH); scene.add(ph);
const bodyGeo = new THREE.ExtrudeGeometry(roundRect(7.4, 15.4, 1.1), { depth: .8, bevelEnabled: true, bevelSize: .12, bevelThickness: .12, bevelSegments: 3, curveSegments: 10 }); bodyGeo.translate(0, 0, -.4);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4a505c, roughness: .4, metalness: .45, transparent: true }); const body = new THREE.Mesh(bodyGeo, bodyMat); ph.add(body);
const bodyX = new THREE.Mesh(bodyGeo, xray(new THREE.Color(.5, .75, 1.3), .9)); ph.add(bodyX);
const scrT = screenTex(); const scrMat = new THREE.MeshBasicMaterial({ map: scrT, transparent: true, toneMapped: false, color: new THREE.Color(.75, .75, .75) }); const scr = new THREE.Mesh(new THREE.ShapeGeometry(roundRect(6.9, 14.9, .9)), scrMat); scr.position.z = .54; ph.add(scr);
{ const uv = scr.geometry.attributes.uv, p = scr.geometry.attributes.position; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 6.9 + .5, p.getY(i) / 14.9 + .5); }
const pouch = box(6, 9.6, .5, M(0xa8aeb8, .35, .7), 0, -1.6, 0, ph); const board = box(6.2, 3.2, .2, M(0x1e5a3a, .6, .2, 0x041a0c), 0, 5.4, 0, ph);
const chip = box(1.4, 1.4, .3, M(0x202226, .4, .5), -1, 5.4, .1, ph);
const cableC = new THREE.CatmullRomCurve3([V3(0, -7.9, 0), V3(0, -10, 0), V3(.6, -14, -1.5), V3(2, -22, -4)]); const cable = new THREE.Mesh(new THREE.TubeGeometry(cableC, 40, .35, 10, false), M(0xe8e8e8, .6, .05)); ph.add(cable);
box(1.6, 1.6, .9, M(0xdedede, .5, .1), 0, -8.4, 0, ph);
const phoneParts = [pouch, board, chip];

// ==========================================================================
// B · ROLLO DE ELECTRODOS (jelly roll)
// ==========================================================================
const JR = V3(0, 2000, 0); const jr = new THREE.Group(); jr.position.copy(JR); scene.add(jr);
function spiralRibbon(off, col, hgt = 10, turns = 6, emis = 0) { const pos = [], idx = []; const N = 360 * turns / 4; const pitch = 1.0;
  for (let i = 0; i <= N; i++) { const th = i / N * turns * Math.PI * 2; const r = 1 + pitch * th / (Math.PI * 2) + off; const x = Math.cos(th) * r, z = Math.sin(th) * r; pos.push(x, -hgt / 2, z, x, hgt / 2, z); if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ color: col, roughness: .5, metalness: .4, emissive: emis, side: THREE.DoubleSide }); return new THREE.Mesh(g, m); }
const jrParts = [spiralRibbon(0, 0x5a5f68), spiralRibbon(.25, 0xd8dee4, 10, 6, 0x101214), spiralRibbon(.5, 0x3a5ac8, 10, 6, 0x0a1430), spiralRibbon(.75, 0xd8dee4, 10, 6, 0x101214)];
[[0, 0x60646c, 0x0a0a0c], [.25, 0xe8eef4, 0x30343a], [.5, 0x4a72ff, 0x10204a], [.75, 0xe8eef4, 0x30343a]].forEach(([o, c, e]) => jrParts.push(spiralCap(o, c, e)));
jrParts.forEach(p => jr.add(p)); function spiralCap(off, col, emis, turns = 6) { const pos = [], idx = []; const N = 360 * turns / 4;
  for (let i = 0; i <= N; i++) { const th = i / N * turns * Math.PI * 2; const r = 1 + th / (Math.PI * 2) + off; pos.push(Math.cos(th) * r, 5.01, Math.sin(th) * r, Math.cos(th) * (r + .23), 5.01, Math.sin(th) * (r + .23)); if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: col, emissive: emis, roughness: .6, metalness: .1, side: THREE.DoubleSide })); }
const jrCase = new THREE.Mesh(new THREE.CylinderGeometry(8.4, 8.4, 11.4, 64, 1, true), xray(new THREE.Color(.6, .7, .9), .7)); jr.add(jrCase);

// ==========================================================================
// C–F · LA CELDA (esquema laminar, apilado en vertical)
// ==========================================================================
const cell = new THREE.Group(); scene.add(cell);
const cuMat = M(0xc8743c, .3, .9), alMat = M(0xb8bec6, .3, .9);
const cu = box(16.4, .6, 10, cuMat, 0, -13.3, 0, cell), al = box(16.4, .6, 10, alMat, 0, 13.3, 0, cell);
const graph = []; const grMat = M(0x6a707c, .55, .15, 0x0c0e12); for (let i = 0; i < 15; i++) graph.push(box(.22, 9.8, 9.6, grMat, -7 + i, -7.9, 0, cell));
const oxide = []; const oxMat = M(0x4a6ad0, .5, .15, 0x0a1838); for (let i = 0; i < 16; i++) oxide.push(box(.3, 9.8, 9.6, oxMat, -7.5 + i, 7.9, 0, cell));
const sepTex = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 256; const x = c.getContext('2d'); x.fillStyle = 'rgba(240,244,250,1)'; x.fillRect(0, 0, 256, 256); const r = rng(8); x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 160; i++) { x.beginPath(); x.ellipse(r() * 256, r() * 256, 3 + r() * 6, 2 + r() * 4, r() * 3, 0, 7); x.fill(); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 1); return t; })();
const sepMat = new THREE.MeshStandardMaterial({ map: sepTex, transparent: true, opacity: .9, roughness: .8, metalness: 0, emissive: 0x30343a, depthWrite: false, side: THREE.DoubleSide }); const sep = box(16.4, 1.2, 10, sepMat, 0, 0, 0, cell);
const elyMat = new THREE.MeshStandardMaterial({ color: 0x4aa0ff, emissive: 0x0a2850, transparent: true, opacity: .14, depthWrite: false, roughness: .1 }); const ely = box(16.2, 26, 9.9, elyMat, 0, 0, 0, cell);
const caseX = new THREE.Mesh(new THREE.BoxGeometry(17.4, 28.2, 11), xray(new THREE.Color(.55, .65, .85), .5)); cell.add(caseX);
const seiMat = M(0xa08a68, .9, .05, 0x2a2010); const sei = box(14.8, 1, 9.6, seiMat, 0, -2.9, 0, cell);
// circuito externo (del colector de cobre al de aluminio, por la derecha)
const wireC = new THREE.CatmullRomCurve3([V3(8.2, -13.3, 0), V3(11, -13.3, 0), V3(13.5, -11, 0), V3(13.5, -4.6, 0), V3(13.5, 0, 0), V3(13.5, 4.6, 0), V3(13.5, 11, 0), V3(11, 13.3, 0), V3(8.2, 13.3, 0)], false, 'catmullrom', .2);
const wire = new THREE.Mesh(new THREE.TubeGeometry(wireC, 120, .28, 8, false), M(0xd08848, .35, .8)); cell.add(wire);
const charger = new THREE.Group(); charger.position.set(13.5, 0, 0); cell.add(charger); box(3.6, 4, 3.6, M(0xf0f0f0, .5, .05), 0, 0, 0, charger);
{ const bolt = new THREE.Shape(); bolt.moveTo(.2, 1.3); bolt.lineTo(-.7, -.1); bolt.lineTo(-.05, -.1); bolt.lineTo(-.3, -1.3); bolt.lineTo(.7, .2); bolt.lineTo(.05, .2); bolt.closePath(); const b = new THREE.Mesh(new THREE.ShapeGeometry(bolt), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.2, .3) })); b.position.z = 1.82; charger.add(b); }
const cphone = new THREE.Group(); cphone.position.set(13.5, 0, .5); cell.add(cphone); { const b = new THREE.Mesh(new THREE.ExtrudeGeometry(roundRect(4.6, 9.4, .7), { depth: .5, bevelEnabled: false }), M(0x1a1c22, .35, .8)); b.position.z = -.25; cphone.add(b); }
const scr2T = screenTex(); const scr2Mat = new THREE.MeshBasicMaterial({ map: scr2T, toneMapped: false, color: 0x000000 }); const scr2 = new THREE.Mesh(new THREE.ShapeGeometry(roundRect(4.2, 9, .55)), scr2Mat); scr2.position.z = .27; cphone.add(scr2);
{ const uv = scr2.geometry.attributes.uv, p = scr2.geometry.attributes.position; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 4.2 + .5, p.getY(i) / 9 + .5); }
// iones de litio (instanciados) — sitio en el cátodo ↔ sitio en el grafito
const ions = []; { const r = rng(31); for (let gx = 0; gx < 14; gx++) for (let ly = 0; ly < 5; ly++) for (let lz = 0; lz < 3; lz++) ions.push({ ax: -6.5 + gx, ay: -11.8 + ly * 1.9 + (r() - .5) * .3, cx: -7 + gx + (gx > 6 ? 1 : 0), cy: 4.1 + ly * 1.9 + (r() - .5) * .3, z: -3.2 + lz * 3.2 + (r() - .5) * .6, o: r(), tr: r(), w: r() * 6.28 }); }
const ionGeo = new THREE.SphereGeometry(.3, 14, 10); const ionMat = new THREE.MeshBasicMaterial({ color: 0xffffff }); const ionM = new THREE.InstancedMesh(ionGeo, ionMat, ions.length); cell.add(ionM);
const _m = new THREE.Matrix4(), _c = new THREE.Color(); const LI = new THREE.Color(1.15, .45, 2.0), DEAD = new THREE.Color(.75, .7, .62);
function ionPos(o, u) { // u: 0 = cátodo, 1 = ánodo
  const yA = o.ay, yC = o.cy; if (u <= 0) return [o.cx, yC, o.z]; if (u >= 1) return [o.ax, yA, o.z];
  if (u < .22) { const k = easeInOut(u / .22); return [o.cx, lerp(yC, 2.6, k), o.z]; }
  if (u < .78) { const k = (u - .22) / .56; const e = easeInOut(k); return [lerp(o.cx, o.ax, e) + Math.sin(k * 9 + o.w) * .25, lerp(2.6, -2.6, e), o.z + Math.cos(k * 7 + o.w) * .35]; }
  const k = easeInOut((u - .78) / .22); return [o.ax, lerp(-2.6, yA, k), o.z]; }
function setIons(g, trapped = 0, vis = 1) { ionM.visible = vis > 0; let n = 0;
  for (const o of ions) { const dead = o.tr < trapped; let p; if (dead) { p = [o.ax + Math.sin(o.w) * .3, -3.0 - (o.tr * 37 % 1) * .3, o.z + Math.cos(o.w * 3) * .8]; _c.copy(DEAD); }
    else { const u = clamp((g - o.o * .8) / .2); p = ionPos(o, u); _c.copy(LI).multiplyScalar(vis); }
    _m.makeTranslation(p[0], p[1], p[2]); ionM.setMatrixAt(n, _m); ionM.setColorAt(n, _c); n++; }
  ionM.instanceMatrix.needsUpdate = true; ionM.instanceColor.needsUpdate = true; }
const wp = (x, y, z) => V3(x, y, z).applyMatrix4(cell.matrixWorld);

// ==========================================================================
// G · LITIO METÁLICO EN AGUA
// ==========================================================================
const LW = V3(0, 3000, 0); const lw = new THREE.Group(); lw.position.copy(LW); scene.add(lw);
const liGeo = (() => { const g = new THREE.IcosahedronGeometry(1, 6); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const n = 1 + noise1(x * 2.3 + y * 1.7 + 3) * .18 + noise1(z * 3.1 - y * 2.2) * .1; p.setXYZ(i, x * n * 1.7, y * n * .8, z * n * 1.3); } g.computeVertexNormals(); return g; })();
const liMat = new THREE.MeshStandardMaterial({ color: 0xc4ccd8, roughness: .75, metalness: .25, emissive: 0x1c1e22 }); const li = new THREE.Mesh(liGeo, liMat); lw.add(li);
const plinth = new THREE.Mesh(new THREE.CylinderGeometry(4, 4.4, 1.2, 48), M(0x22252c, .5, .4)); plinth.position.y = -1.4; lw.add(plinth);
const BK = V3(0, 0, 0); const beaker = new THREE.Group(); lw.add(beaker);
const glass = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 13, 64, 1, true), xray(new THREE.Color(.7, .85, 1.1), .9)); glass.position.y = -4.5; beaker.add(glass);
const waterV = new THREE.Mesh(new THREE.CylinderGeometry(6.9, 6.9, 9, 64), new THREE.MeshStandardMaterial({ color: 0x3a8ad8, emissive: 0x0a2a50, transparent: true, opacity: .35, roughness: .05, depthWrite: false })); waterV.position.y = -6.5; beaker.add(waterV);
const surfMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uT: { value: 0 } }, vertexShader: `varying vec2 vU; void main(){ vU=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform float uT; varying vec2 vU; void main(){ float r=length(vU); float w=sin(r*3.-uT*4.)*.5+.5; gl_FragColor=vec4(vec3(.25,.5,.8)+w*.12, .55); }` });
const surf = new THREE.Mesh(new THREE.CircleGeometry(6.9, 64), surfMat); surf.rotation.x = -Math.PI / 2; surf.position.y = -2; beaker.add(surf);

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
const P = new Particles(16000, { size: .5, seed: 17 }); scene.add(P.obj);
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
function show(o) { ph.visible = !!o.ph; jr.visible = !!o.jr; cell.visible = !!o.cell; lw.visible = !!o.lw; }
function cellSet(o) { const f = (k, d = 1) => o[k] ?? d; ely.visible = f('ely') > 0; elyMat.opacity = .14 * f('ely'); sep.visible = f('sep') > 0; sepMat.opacity = .9 * f('sep'); wire.visible = !!o.wire; charger.visible = !!o.charger; cphone.visible = !!o.phone;
  sei.visible = (o.sei || 0) > 0; sei.scale.y = Math.max(.01, o.sei || 0); sei.position.y = -2.65 - .25 * (o.sei || 0); graph.forEach(g => g.visible = f('graph') > 0); oxide.forEach(g => g.visible = f('oxide') > 0); cu.visible = f('graph') > 0; al.visible = f('oxide') > 0; }
// electrones: dir = +1 del ánodo al cátodo (descarga), −1 al revés (carga)
function electrons(t, dir, amp, n = 260) { if (amp <= 0) return; const s = P.seed; for (let i = 0; i < n; i++) { const q = ((i + 9000) % P.n) * 4; let u = fract(s[q] + t * .32 * dir); const p = wireC.getPointAt(u); const w = wp(p.x + (s[q + 1] - .5) * .3, p.y + (s[q + 2] - .5) * .3, p.z + (s[q + 3] - .5) * .3); P.push(w.x, w.y, w.z, 2.2 * amp, 1.8 * amp, .4 * amp); } }
function liGlow(g, trapped, amp) { const s = P.seed; let i = 0; for (const o of ions) { i++; if (o.tr < trapped) continue; const u = clamp((g - o.o * .8) / .2); if (u <= 0 || u >= 1) continue; const p = ionPos(o, u); const w = wp(p[0], p[1], p[2]); P.push(w.x, w.y, w.z, 1.0 * amp, .4 * amp, 1.8 * amp); } }
function solvent(t, amp, n = 900) { if (amp <= 0) return; const s = P.seed; for (let i = 0; i < n; i++) { const q = ((i + 3000) % P.n) * 4; const x = (s[q] - .5) * 15.6 + Math.sin(t * .7 + i) * .3, y = lerp(-12.6, 12.6, s[q + 1]) + Math.cos(t * .5 + i * 1.3) * .3, z = (s[q + 2] - .5) * 9.4;
  const w = wp(x, y, z); P.push(w.x, w.y, w.z, .12 * amp, .3 * amp, .6 * amp); } }
// estado de carga g(t)
function chargeG(t) { if (t < TL.charge + .4) return 0; if (t < TL.use) return easeInOut(smooth(TL.charge + .4, TL.use - .3, t)) * 1.02;
  if (t < TL.wear) return 1.02 * (1 - easeInOut(smooth(TL.back - .3, TL.screen + 1.6, t)));
  const k = clamp((t - TL.wear - .5) / (TL.curious - TL.wear - 1)) * 4.5; return .5 - .5 * Math.cos(k * Math.PI * 2) * 1.04 + .02; }
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .1; camera.far = 20000;
  let bloomS = .7, flash = 0, ca = .0013, fade = 0, grain = .035, expo = 1.1, dim = 0;
  P.begin(); P.mat.size = .5; show({}); cell.updateMatrixWorld(true);
  for (const c of ['inside', 'anode', 'charge', 'use', 'wear', 'curious', 'float', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];
  if (t < TL.inside) {
    // A · cada vez que cargas el móvil mueves ~90.000 trillones de átomos de litio
    show({ ph: true }); const xk = smooth(1.0, 2.0, t); bodyMat.opacity = 1 - xk * .92; bodyX.visible = true; bodyX.material.uniforms.uA.value = .35 + xk * .6; scrMat.opacity = 1 - xk * .95; phoneParts.forEach(p => p.visible = xk > .05);
    scrT.draw(Math.round(lerp(37, 41, t / TL.inside)), 'chg'); ph.rotation.set(0, lerp(-.35, .2, easeInOut(t / TL.inside)), 0); ph.updateMatrixWorld(true);
    camOrbit(PH.clone().add(V3(0, -1, 0)), lerp(44, 33, easeOut(t / TL.inside)), 0, .05, 38); bloomS = .9; P.mat.size = .45;
    const s = P.seed, sk = smooth(TL.sides - .3, TL.sides + .3, t);
    for (let i = 0; i < 2600; i++) { const q = (i % P.n) * 4; const u = fract(s[q] + t * (.25 + sk * .4)); const x = (s[q + 1] - .5) * 5.4, z = (s[q + 2] - .5) * .4; const y = lerp(2.8, -6.0, u); const f = xk * Math.sin(Math.PI * u);
      const w = V3(x + Math.sin(u * 12 + i) * .15, y, z + .1).applyMatrix4(ph.matrixWorld); P.push(w.x, w.y, w.z, 1.4 * f, .55 * f, 2.4 * f); } P.mat.size = .6;
    for (let i = 0; i < 300; i++) { const q = ((i + 6000) % P.n) * 4; const u = fract(s[q] - t * .5); const p = cableC.getPointAt(u); const w = p.applyMatrix4(ph.matrixWorld); P.push(w.x + (s[q + 1] - .5) * .3, w.y, w.z + (s[q + 2] - .5) * .3, 2, 1.6, .4); }
    hud.push(() => { titleHUD('CADA VEZ QUE CARGAS', 'EL MÓVIL…', smooth(.05, .3, t) * (1 - smooth(TL.num - .2, TL.num, t)), 300);
      const na = smooth(TL.num, TL.num + .3, t) * (1 - smooth(TL.sides - .2, TL.sides, t)); bigStat('ÁTOMOS DE LITIO QUE MUEVES', '≈ 90.000', 330, na, clamp((t - TL.num) / 1.5)); txt('TRILLONES', W / 2, 430, 46, { font: 'Montserrat', weight: 800, spacing: 6, alpha: na });
      titleHUD('DE UN LADO', 'A OTRO', smooth(TL.sides, TL.sides + .3, t), 300);
      const p = project(PH.clone().add(V3(3.6, 2.6, 0).applyEuler(ph.rotation))), q = project(PH.clone().add(V3(3.6, -6.2, 0).applyEuler(ph.rotation))); arrowXY(p.x + 70, p.y, q.x + 70, q.y, smooth(TL.sides, TL.sides + .8, t), '#c07aff', 12); });
  } else if (t < TL.anode) {
    // B · dos capas muy finas, enrolladas o apiladas
    show({ jr: true }); const lt = t - TL.inside; jr.rotation.y = t * .25; const ck = smooth(TL.layers - .2, TL.layers + .6, t); jrCase.material.uniforms.uA.value = lerp(.9, .35, ck);
    camOrbit(JR.clone().add(V3(0, 3.5, 0)), lerp(52, 40, easeOut(lt / 4.5)), .3, lerp(.35, .95, easeInOut(smooth(0, 3, lt))), 38); bloomS = .6; expo = 1.2;
    hud.push(() => { titleHUD('¿QUÉ HAY DENTRO', 'DE UNA BATERÍA?', smooth(0, .3, lt) * (1 - smooth(TL.layers - TL.inside - .1, TL.layers - TL.inside + .1, lt)), 300);
      titleHUD('DOS CAPAS', 'MUY FINAS', smooth(TL.layers - TL.inside, TL.layers - TL.inside + .3, lt) * (1 - smooth(TL.roll - TL.inside - .1, TL.roll - TL.inside + .1, lt)), 300);
      titleHUD('ENROLLADAS', 'O APILADAS', smooth(TL.roll - TL.inside, TL.roll - TL.inside + .3, lt), 300); });
  } else if (t < TL.charge) {
    // C · ánodo (grafito), cátodo (óxido metálico), electrolito y separador
    show({ cell: true }); const lt = t - TL.anode; const ek = smooth(TL.sep - .1, TL.sep + .6, t), sk = smooth(TL.lamina - .2, TL.lamina + .5, t);
    cellSet({ ely: ek, sep: sk, oxide: t > TL.cathode - .3 ? 1 : 0 }); setIons(0, 0, t > TL.cathode - .3 ? 1 : 0);
    let tgt, dist, az, el; if (t < TL.cathode) { tgt = V3(0, -7.5, 0); dist = 38; az = .3 - lt * .03; el = .12; } else if (t < TL.sep) { tgt = V3(0, 7.5, 0); dist = 38; az = .25; el = .1; } else if (t < TL.separator) { tgt = V3(0, 0, 0); dist = lerp(66, 60, smooth(TL.sep, TL.separator, t)); az = .3; el = .1; } else { tgt = V3(-2, 0, 1); dist = 26; az = .35; el = .18; }
    const k = smooth(-.1, .5, t - (t < TL.cathode ? TL.anode : t < TL.sep ? TL.cathode : t < TL.separator ? TL.sep : TL.separator)); camOrbit(tgt, dist * lerp(1.15, 1, easeOut(k)), az, el, 38); solvent(t, ek); bloomS = .7; expo = 1.6;
    hud.push(() => { titleHUD('ÁNODO', 'GRAFITO', smooth(TL.anode, TL.anode + .3, t) * (1 - smooth(TL.cathode - .1, TL.cathode + .1, t)), 300);
      titleHUD('CÁTODO', 'ÓXIDO METÁLICO', smooth(TL.cathode, TL.cathode + .3, t) * (1 - smooth(TL.sep - .1, TL.sep + .1, t)), 300);
      callout(wp(-7, -4, 4.8), -60, -120, 'CAPAS DE GRAFITO', 'carbono', smooth(TL.anode + .4, TL.anode + .8, t) * (1 - smooth(TL.cathode - .1, TL.cathode, t)), '#c8ccd6');
      callout(wp(7.5, 11, 4.8), 60, -140, 'ÓXIDO METÁLICO', 'con litio dentro', smooth(TL.cathode + .4, TL.cathode + .8, t) * (1 - smooth(TL.sep - .1, TL.sep, t)), '#7fa4ff');
      titleHUD('ENTRE ELLAS', 'UN LÍQUIDO…', smooth(TL.sep, TL.sep + .3, t) * (1 - smooth(TL.lamina - .1, TL.lamina + .1, t)), 300);
      titleHUD('…Y UNA LÁMINA CON', 'POROS DIMINUTOS', smooth(TL.lamina, TL.lamina + .3, t) * (1 - smooth(TL.separator - .1, TL.separator + .1, t)), 300);
      callout(wp(-6, 10, 5), -40, -150, 'ELECTROLITO', 'líquido', smooth(TL.sep + .4, TL.sep + .8, t) * (1 - smooth(TL.separator - .1, TL.separator, t)), '#7fd4ff');
      titleHUD('EL', 'SEPARADOR', smooth(TL.separator, TL.separator + .3, t), 300); callout(wp(2, .6, 5), 60, -260, 'SEPARADOR', 'deja pasar iones, no electrones', smooth(TL.separator + .3, TL.separator + .7, t), '#ffffff'); });
  } else if (t < TL.wear) {
    // D/E · carga y descarga
    show({ cell: true }); const g = chargeG(t); const chg = t < TL.use; cellSet({ wire: true, charger: chg, phone: !chg }); setIons(g); liGlow(g, 0, .9); solvent(t, .6, 500);
    const lt = t - TL.charge; let tgt = V3(3, 0, 0), dist = 74, az = .35 + Math.sin(t * .2) * .05, el = .12;
    if (chg && t > TL.cards - .2) { const k = easeInOut(smooth(TL.cards - .2, TL.cards + .8, t)); tgt = V3(lerp(3, -1, k), lerp(0, -6, k), 0); dist = lerp(74, 22, k); az = lerp(.35, .14, k); el = lerp(.12, .04, k); }
    if (!chg) { const k1 = easeInOut(smooth(TL.electrons - .3, TL.electrons + .6, t)) * (1 - easeInOut(smooth(TL.outside - .3, TL.outside + .5, t))); const k2 = easeInOut(smooth(TL.circuit - .2, TL.circuit + .8, t));
      tgt = V3(lerp(lerp(3, 0, k1), 13.5, k2), lerp(lerp(0, -2, k1), 0, k2), 0); dist = lerp(lerp(74, 26, k1), 22, k2); az = lerp(.35, .2, k2); el = .1; }
    camOrbit(tgt, dist, az, el, 38); bloomS = .9; expo = 1.6;
    const eAmp = chg ? smooth(TL.charge + .2, TL.charge + .8, t) * (1 - smooth(TL.use - .5, TL.use, t)) : smooth(TL.outside - .4, TL.outside + .3, t) * (1 - smooth(TL.wear - .4, TL.wear, t));
    electrons(t, chg ? -1 : 1, eAmp);
    const blk = !chg ? smooth(TL.electrons, TL.electrons + .3, t) * (1 - smooth(TL.outside - .3, TL.outside, t)) : 0;
    if (blk > 0) { const s = P.seed; for (let i = 0; i < 160; i++) { const q = ((i + 11000) % P.n) * 4; const u = fract(s[q] + t * .9); const y = -3.6 + 2.6 * Math.sin(Math.PI * u); const w = wp((s[q + 1] - .5) * 14, y, (s[q + 2] - .5) * 8); P.push(w.x, w.y, w.z, 2.2 * blk, 1.8 * blk, .4 * blk); } }
    const sc = smooth(TL.screen - .2, TL.screen + .6, t); scr2T.draw(0, 'wall'); scr2Mat.color.setScalar(chg ? 0 : sc * .75);
    hud.push(() => { const L = (a, b) => smooth(TL[a], TL[a] + .3, t) * (b ? 1 - smooth(TL[b] - .1, TL[b] + .1, t) : 1);
      titleHUD('AL CARGAR, EL CARGADOR', 'ARRANCA ELECTRONES', L('charge', 'ions'), 300); titleHUD('Y LOS IONES DE LITIO', 'CRUZAN EL LÍQUIDO', L('ions', 'graphite'), 300);
      titleHUD('SE METEN ENTRE', 'LAS CAPAS DEL GRAFITO', L('graphite', 'cards'), 300); titleHUD('COMO CARTAS', 'EN UNA BARAJA', L('cards', 'use'), 300);
      callout(wp(13.5, 2.2, 1.8), -40, -230, 'CARGADOR', null, smooth(TL.charge + .3, TL.charge + .7, t) * (1 - smooth(TL.cards - .4, TL.cards - .2, t)), '#ffe08a');
      callout(wp(13.5, 9, 0), -30, -330, 'ELECTRONES', 'por el cable', smooth(TL.charge + .8, TL.charge + 1.2, t) * (1 - smooth(TL.ions - .2, TL.ions, t)), '#ffd060');
      callout(wp(2, 1, 4), 40, -330, 'IONES DE LITIO', 'Li⁺', smooth(TL.ions + .3, TL.ions + .7, t) * (1 - smooth(TL.graphite - .1, TL.graphite, t)), '#d08aff');
      titleHUD('AL USAR EL MÓVIL', 'PASA AL REVÉS', L('use', 'back'), 300); titleHUD('LOS IONES', 'VUELVEN AL CÁTODO', L('back', 'electrons'), 300);
      titleHUD('LOS ELECTRONES NO PUEDEN', 'ATRAVESAR EL SEPARADOR', L('electrons', 'outside'), 300);
      if (blk > .01) { const p = project(wp(0, 0, 5)); g2.save(); g2.globalAlpha = blk; g2.strokeStyle = '#ff4a4a'; g2.lineWidth = 16; g2.lineCap = 'round'; g2.shadowColor = '#ff2a2a'; g2.shadowBlur = 20; g2.beginPath(); g2.moveTo(p.x - 70, p.y - 70); g2.lineTo(p.x + 70, p.y + 70); g2.moveTo(p.x + 70, p.y - 70); g2.lineTo(p.x - 70, p.y + 70); g2.stroke(); g2.restore(); }
      titleHUD('DAN LA VUELTA POR FUERA', 'POR LOS CIRCUITOS DEL MÓVIL', L('outside', 'screen'), 300); titleHUD('ESA CORRIENTE ENCIENDE', 'TU PANTALLA', L('screen'), 300); });
  } else if (t < TL.curious) {
    // F · en cada carga se atrapa un poco de litio → tras cientos de ciclos dura menos
    show({ cell: true }); const lt = t - TL.wear; const cyc = clamp((t - TL.wear - .5) / (TL.curious - TL.wear - 1)); const trapped = .2 * Math.pow(cyc, 1.6); const g = chargeG(t);
    cellSet({ sei: smooth(TL.trapped - .3, TL.cycles + 2, t) }); setIons(g, trapped); liGlow(g, trapped, .9); solvent(t, .5, 400);
    camOrbit(V3(0, lerp(1, -2, smooth(TL.trapped - .5, TL.trapped + .5, t)), 0), lerp(68, 52, easeInOut(smooth(TL.trapped - .5, TL.trapped + .8, t))), .3 + lt * .02, .14, 38); dim = .15; bloomS = .9; expo = 1.6;
    const ncyc = Math.round(lerp(1, 500, Math.pow(cyc, 1.6)));
    hud.push(() => { titleHUD('¿Y POR QUÉ', 'SE GASTAN?', smooth(0, .3, lt) * (1 - smooth(TL.trapped - TL.wear - .1, TL.trapped - TL.wear + .1, lt)), 300);
      titleHUD('EN CADA CARGA, UN POCO DE LITIO', 'SE QUEDA ATRAPADO', smooth(TL.trapped - TL.wear, TL.trapped - TL.wear + .3, lt) * (1 - smooth(TL.cycles - TL.wear - .1, TL.cycles - TL.wear + .1, lt)), 300);
      callout(wp(3, -3.1, 4.8), 60, 170, 'LITIO ATRAPADO', 'ya no vuelve', smooth(TL.trapped - TL.wear + 1.6, TL.trapped - TL.wear + 2, lt) * (1 - smooth(TL.cycles - TL.wear - .1, TL.cycles - TL.wear, lt)), '#b0aaa4');
      const ba = smooth(TL.cycles - TL.wear, TL.cycles - TL.wear + .3, lt); bigStat('CICLOS DE CARGA', fmtN(ncyc), 330, ba, clamp((t - TL.cycles) / 1.5));
      bar(160, 470, 760, 1 - .2 * ncyc / 500, 'CAPACIDAD', Math.round(100 - 20 * ncyc / 500) + ' %', ba, '#7dffa0'); });
  } else if (t < TL.brand) {
    // G · el litio: el metal más ligero, flota en el agua y burbujea
    show({ lw: true }); const lt = t - TL.curious; const inW = t > TL.float - .7; surfMat.uniforms.uT.value = t; beaker.visible = inW; plinth.visible = !inW;
    let y = .3; if (inW) { const fk = smooth(TL.float - .7, TL.float - .05, t); y = lerp(9, -2.1, easeIn(fk)); if (fk >= 1) y = -2.1 + Math.sin((t - TL.float) * 5) * .35 * Math.exp(-(t - TL.float) * 1.6); }
    const fz = smooth(TL.react - .1, TL.fizz + .4, t); const drift = Math.max(0, t - TL.react); li.position.set(inW ? Math.sin(drift * 1.3) * 2.4 * fz : 0, y, inW ? Math.cos(drift * 1.1) * 1.6 * fz - 1.6 * fz : 0);
    li.rotation.set(Math.sin(t * .7) * .1, t * (inW ? .6 + fz : .35), Math.sin(t * .9) * .08); li.scale.setScalar(1 - .18 * smooth(TL.fizz, TL.brand, t)); liMat.color.setScalar(lerp(.85, .65, fz));
    camOrbit(LW.clone().add(V3(0, inW ? -2 : .2, 0)), inW ? lerp(24, 17, smooth(TL.float - .5, TL.brand, t)) : lerp(16, 12, lt / 3.5), .3 + lt * .03, inW ? .38 : .2, 38); bloomS = .55; expo = 1.15;
    if (inW && fz > 0) { const s = P.seed; const n = Math.round(2400 * fz); const sc = li.scale.x; for (let i = 0; i < n; i++) { const q = (i % P.n) * 4; const age = fract(s[q] + t * (.8 + s[q + 3] * .6)); const a = s[q + 1] * 6.283; const f = (1 - age) * .9;
        let x, y, z; if (i % 3 === 0) { const r = sc * (.6 + s[q + 2] * .9); x = Math.cos(a) * r * 1.6; z = Math.sin(a) * r * 1.2; y = -2.9 + age * 1.1; } else { const r = sc * (1.5 + age * 1.6 + s[q + 2] * .4); x = Math.cos(a) * r * 1.3; z = Math.sin(a) * r; y = -1.95 + Math.sin(age * 3.14) * .5 * s[q + 2]; }
        P.push(LW.x + li.position.x + x, LW.y + y, LW.z + li.position.z + z, 1.5 * f, 1.6 * f, 1.9 * f); } P.mat.size = .26; }
    hud.push(() => { titleHUD('Y LO MÁS', 'CURIOSO…', smooth(0, .3, lt) * (1 - smooth(TL.light - TL.curious - .1, TL.light - TL.curious + .1, lt)), 300);
      const la = smooth(TL.light - TL.curious, TL.light - TL.curious + .3, lt) * (1 - smooth(TL.float - TL.curious - .7, TL.float - TL.curious - .5, lt)); bigStat('EL METAL MÁS LIGERO QUE EXISTE', '0,53 g/cm³', 330, la, clamp((t - TL.light) / 1.5)); txt('LITIO · Li', W / 2, 430, 36, { weight: 300, spacing: 6, alpha: la });
      titleHUD('TAN LIGERO QUE', 'FLOTA EN EL AGUA', smooth(TL.float - TL.curious, TL.float - TL.curious + .3, lt) * (1 - smooth(TL.react - TL.curious - .1, TL.react - TL.curious + .1, lt)), 300);
      txt('AGUA: 1 g/cm³', W / 2, 440, 34, { weight: 300, spacing: 4, alpha: smooth(TL.float - TL.curious + .3, TL.float - TL.curious + .6, lt) * (1 - smooth(TL.react - TL.curious - .1, TL.react - TL.curious + .1, lt)) });
      titleHUD('Y TAN REACTIVO QUE', 'EMPIEZA A BURBUJEAR', smooth(TL.react - TL.curious, TL.react - TL.curious + .3, lt), 300);
      callout(LW.clone().add(V3(li.position.x - 1, -.6, li.position.z)), -150, -150, 'HIDRÓGENO', 'H₂', smooth(TL.fizz - TL.curious + .2, TL.fizz - TL.curious + .6, lt), '#9fd8ff'); });
  } else {
    // H · marca
    show({ cell: true }); const lt = t - TL.brand; cellSet({ wire: true, phone: true }); setIons(.5); liGlow(.5 + Math.sin(t) * .1, 0, .6); scr2T.draw(0, 'wall'); scr2Mat.color.setScalar(.6);
    camOrbit(V3(3, 0, 0), 80 + lt * 3, .35 + lt * .03, .15, 38); expo = .9; fade = Math.min(.5, lt * .45); dim = smooth(0, .8, lt) * .6;
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  P.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (dim > 0) hud.unshift(() => { g2.save(); g2.globalAlpha = dim * .7; g2.fillStyle = '#02050b'; g2.fillRect(0, 0, W, H); g2.restore(); });
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
const fmtN = n => n >= 1000 ? Math.floor(n / 1000) + '.' + String(n % 1000).padStart(3, '0') : String(n);
function renderCover() { renderFrame(TL.graphite + .6); coverText('¿QUÉ HAY DENTRO', 'DE UNA BATERÍA?', 'Y por qué se gasta con el tiempo'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
