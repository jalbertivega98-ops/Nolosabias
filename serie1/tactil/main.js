// NO LO SABÍAS — "¿Cómo funciona una pantalla táctil?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final. Unidades: cm.
// Referencia: pantalla capacitiva proyectada de capacidad mutua. Rejilla de ITO (óxido de indio y estaño, ~100 nm de espesor;
// un pelo mide ~50–100 µm) en filas emisoras (Tx) y columnas receptoras (Rx). Cada cruce = condensador de ~1–2 pF; el dedo
// (conductor, agua con sales) roba parte del campo y la capacidad mutua baja ~0,1–1 pF. El controlador barre la matriz a 60–240 Hz.
// Guantes de tela: aíslan. Gotas de agua: conducen y crean toques fantasma. Corea del Sur, invierno de 2010: salchichas como puntero.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3,
  g2, camera, SOFT, Particles, txt, copperGrad, project, callout, titleHUD, fract, camOrbit, bigStat, drawBrand, coverText, finish } from '../../lib/core.js';

const scene = new THREE.Scene(); scene.background = new THREE.Color(0x04060b);
scene.add(new THREE.HemisphereLight(0xbfd4ff, 0x1a1410, .55));
const key = new THREE.DirectionalLight(0xfff1e0, 2.4); key.position.set(6, 12, 7); scene.add(key);
const rim = new THREE.DirectionalLight(0x7fb0ff, 1.6); rim.position.set(-7, 5, -9); scene.add(rim);
const fill = new THREE.DirectionalLight(0xffe8d8, .9); scene.add(fill);
function xray(col, k = 1) { return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  uniforms: { uCol: { value: col }, uA: { value: k } },
  vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform vec3 uCol; uniform float uA; varying vec3 vN; varying vec3 vV; void main(){ float f=pow(clamp(1.-abs(dot(vN,vV)),0.,1.),2.); gl_FragColor=vec4(uCol*(f*.8+.06)*uA,(f*.7+.05)*uA); }` }); }

// suelo de laboratorio con halo
const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: 0x0a0d13, roughness: .85, metalness: .1 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -1.0; scene.add(floor);
const halo = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ map: SOFT, color: new THREE.Color(.10, .16, .3), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); halo.rotation.x = -Math.PI / 2; halo.position.y = -.98; scene.add(halo);

// ==========================================================================
// MÓVIL: cuerpo, pantalla (lienzo dinámico), rejilla de ITO, cristal
// ==========================================================================
const PW = 7.2, PL = 15.2, SW = 6.6, SL = 14.4;
const shape = (() => { const s = new THREE.Shape(), w = PW / 2, l = PL / 2, r = 1.0; s.moveTo(-w + r, -l); s.lineTo(w - r, -l); s.quadraticCurveTo(w, -l, w, -l + r); s.lineTo(w, l - r); s.quadraticCurveTo(w, l, w - r, l); s.lineTo(-w + r, l); s.quadraticCurveTo(-w, l, -w, l - r); s.lineTo(-w, -l + r); s.quadraticCurveTo(-w, -l, -w + r, -l); return s; })();
const bodyGeo = new THREE.ExtrudeGeometry(shape, { depth: .7, bevelEnabled: true, bevelThickness: .1, bevelSize: .1, bevelSegments: 4, curveSegments: 24 }); bodyGeo.rotateX(-Math.PI / 2); bodyGeo.translate(0, -.82, 0);
const phone = new THREE.Group(); scene.add(phone);
const body = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ color: 0x1b1f26, metalness: .7, roughness: .32 })); phone.add(body);
const scv = document.createElement('canvas'); scv.width = 440; scv.height = 960; const sc = scv.getContext('2d');
const screenTex = new THREE.CanvasTexture(scv); screenTex.colorSpace = THREE.SRGBColorSpace; screenTex.anisotropy = 4;
const screenMat = new THREE.MeshBasicMaterial({ map: screenTex }); const screen = new THREE.Mesh(new THREE.PlaneGeometry(SW, SL), screenMat); screen.rotation.x = -Math.PI / 2; screen.position.y = .005; phone.add(screen);
const glassTop = new THREE.Mesh(new THREE.PlaneGeometry(PW - .3, PL - .3), new THREE.MeshStandardMaterial({ color: 0x000000, transparent: true, opacity: .12, roughness: .3, metalness: .5 })); glassTop.rotation.x = -Math.PI / 2; phone.add(glassTop);
const glassX = new THREE.Mesh(new THREE.BoxGeometry(PW - .3, .14, PL - .3), xray(new THREE.Color(.35, .75, 1.2), .8)); phone.add(glassX);
// rejilla: filas emisoras (cobre) y columnas receptoras (azul)
const NC = 8, NR = 16; const XC = [...Array(NC)].map((_, j) => -2.8 + j * .8), ZR = [...Array(NR)].map((_, i) => -6.5 + i * 13 / 15);
const rowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(.95, .45, .2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
const colMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(.2, .5, 1.05), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
const rows = new THREE.Group(), cols = new THREE.Group(); phone.add(rows, cols);
for (const z of ZR) { const m = new THREE.Mesh(new THREE.BoxGeometry(6.2, .02, .13), rowMat); m.position.z = z; rows.add(m); }
for (const x of XC) { const m = new THREE.Mesh(new THREE.BoxGeometry(.13, .02, 13.6), colMat); m.position.x = x; cols.add(m); }
let EX = 0; const yRow = () => .02 + EX * 1.0, yCol = () => .02 + EX * 1.35, yGlass = () => .03 + EX * 2.4;
function setPhone(e, gridA, glassXA) { EX = e; rows.position.y = yRow(); cols.position.y = yCol(); glassTop.position.y = yGlass() + .075 * e + .002; glassX.position.y = yGlass();
  glassX.visible = glassXA > .01; glassX.material.uniforms.uA.value = glassXA; rowMat.opacity = gridA[0]; colMat.opacity = gridA[1]; rows.visible = gridA[0] > .01; cols.visible = gridA[1] > .01; }

// contenido de la pantalla
const ICONS = ['#e0785a', '#5ab0e0', '#7ac77a', '#e6c25a', '#a07ae0', '#e07ab0', '#5ad0c0', '#d0d0d0', '#e09a5a', '#5a7ae0', '#c0e05a', '#e05a6a', '#7ae0e0', '#b07a5a', '#5ae08a', '#e0b07a'];
function drawScreen(o) {
  const w = scv.width, h = scv.height; sc.save(); sc.clearRect(0, 0, w, h);
  if (o.mode === 'map') {
    const z = o.zoom || 1; sc.fillStyle = '#18202c'; sc.fillRect(0, 0, w, h); sc.translate(w / 2, h / 2); sc.scale(z, z); sc.translate(-w / 2, -h / 2);
    sc.fillStyle = '#1f3a2a'; sc.fillRect(40, 520, 150, 120); sc.fillRect(280, 180, 120, 90);
    sc.strokeStyle = '#2b5f8a'; sc.lineWidth = 26; sc.beginPath(); sc.moveTo(-50, 330); sc.bezierCurveTo(150, 260, 260, 460, 500, 380); sc.stroke();
    sc.strokeStyle = '#3c4a5e'; for (let i = -2; i < 14; i++) { sc.lineWidth = i % 4 ? 5 : 11; sc.beginPath(); sc.moveTo(-60, i * 80); sc.lineTo(520, i * 80 + 40); sc.stroke(); }
    for (let i = -2; i < 9; i++) { sc.lineWidth = i % 3 ? 5 : 11; sc.beginPath(); sc.moveTo(i * 70, -40); sc.lineTo(i * 70 - 30, 1000); sc.stroke(); }
    sc.fillStyle = '#ff6a4a'; sc.beginPath(); sc.arc(w / 2, h / 2 - 14, 14, Math.PI, 0); sc.lineTo(w / 2, h / 2 + 12); sc.closePath(); sc.fill();
    sc.setTransform(1, 0, 0, 1, 0, 0);
  } else {
    const gr = sc.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#1d2a5c'); gr.addColorStop(.6, '#33204f'); gr.addColorStop(1, '#5a2a3a'); sc.fillStyle = gr; sc.fillRect(0, 0, w, h);
    sc.fillStyle = 'rgba(255,255,255,.85)'; sc.font = '600 22px Inter'; sc.textAlign = 'left'; sc.fillText('15:00', 30, 40);
    if (o.mode === 'lock' && (o.unlock || 0) < 1) {
      const a = 1 - (o.unlock || 0); sc.globalAlpha = a; sc.textAlign = 'center'; sc.font = '200 120px Inter'; sc.fillText('15:00', w / 2, 260); sc.font = '400 24px Inter'; sc.fillText('Martes, 12 de enero', w / 2, 310);
      sc.beginPath(); sc.arc(w / 2, 840, 30, 0, 7); sc.strokeStyle = 'rgba(255,255,255,.8)'; sc.lineWidth = 3; sc.stroke(); sc.globalAlpha = 1;
    }
    const ia = o.mode === 'lock' ? (o.unlock || 0) : 1;
    if (ia > 0) { sc.globalAlpha = ia; for (let k = 0; k < 20; k++) { const cx = 62 + (k % 4) * 105, cy = 120 + Math.floor(k / 4) * 125; sc.fillStyle = ICONS[k % 16]; rr(cx - 36, cy - 36, 72, 72, 18); sc.fill();
        sc.fillStyle = 'rgba(255,255,255,.85)'; if (k % 3 === 0) { sc.beginPath(); sc.arc(cx, cy, 15, 0, 7); sc.fill(); } else if (k % 3 === 1) { sc.fillRect(cx - 14, cy - 14, 28, 28); } else { sc.beginPath(); sc.moveTo(cx - 16, cy + 14); sc.lineTo(cx, cy - 16); sc.lineTo(cx + 16, cy + 14); sc.fill(); } }
      sc.fillStyle = 'rgba(255,255,255,.12)'; rr(20, 820, w - 40, 110, 34); sc.fill(); for (let k = 0; k < 4; k++) { sc.fillStyle = ICONS[(k * 5 + 3) % 16]; rr(52 + k * 98, 840, 70, 70, 18); sc.fill(); } sc.globalAlpha = 1; }
  }
  for (const [u, v, age] of (o.ripples || [])) { if (age < 0 || age > 1) continue; sc.strokeStyle = `rgba(255,255,255,${(1 - age) * .9})`; sc.lineWidth = 6 * (1 - age) + 1; sc.beginPath(); sc.arc(u * w, v * h, 10 + age * 120, 0, 7); sc.stroke();
    sc.fillStyle = `rgba(255,255,255,${(1 - age) * .35})`; sc.beginPath(); sc.arc(u * w, v * h, 30 * (1 - age) + 8, 0, 7); sc.fill(); }
  if (o.ghost) for (const [u, v, a] of o.ghost) { sc.fillStyle = `rgba(255,120,90,${a * .6})`; sc.beginPath(); sc.arc(u * w, v * h, 26, 0, 7); sc.fill(); }
  sc.restore(); screenTex.needsUpdate = true;
  function rr(x, y, ww, hh, r) { sc.beginPath(); sc.moveTo(x + r, y); sc.arcTo(x + ww, y, x + ww, y + hh, r); sc.arcTo(x + ww, y + hh, x, y + hh, r); sc.arcTo(x, y + hh, x, y, r); sc.arcTo(x, y, x + ww, y, r); sc.closePath(); }
}
const uvOf = (x, z) => [x / SW + .5, z / SL + .5];

// ==========================================================================
// DEDO (con uña), guante y salchicha. Eje local +Y desde la yema; la yema mira a +Z local.
// ==========================================================================
const FR = .78, FLEN = 6.5;
const skin = new THREE.MeshStandardMaterial({ color: 0xe2a888, roughness: .5, metalness: 0, emissive: 0x2c130b });
const fingerX = xray(new THREE.Color(.35, .75, 1.3));
function makeFinger() { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.CapsuleGeometry(FR, FLEN, 10, 24), skin); m.position.y = FR + FLEN / 2; g.add(m);
  const nail = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), new THREE.MeshStandardMaterial({ color: 0xf2c9b8, roughness: .25, metalness: .05 })); nail.scale.set(.52, .85, .12); nail.position.set(0, .7, -FR * .8); g.add(nail);
  g.userData = { m, nail }; return g; }
const f1 = makeFinger(), f2 = makeFinger(); scene.add(f1, f2);
const knitCv = document.createElement('canvas'); knitCv.width = 128; knitCv.height = 128; { const c = knitCv.getContext('2d'); c.fillStyle = '#9a4050'; c.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 16) for (let x = 0; x < 128; x += 16) { c.fillStyle = (x / 16 + y / 16) % 2 ? '#c25a6a' : '#a84a5a'; c.beginPath(); c.ellipse(x + 4, y + 8, 4, 8, .4, 0, 7); c.fill(); c.beginPath(); c.ellipse(x + 12, y + 8, 4, 8, -.4, 0, 7); c.fill(); } }
const knit = new THREE.CanvasTexture(knitCv); knit.wrapS = knit.wrapT = THREE.RepeatWrapping; knit.repeat.set(3, 4); knit.colorSpace = THREE.SRGBColorSpace;
const glove = new THREE.Group(); { const m = new THREE.Mesh(new THREE.CapsuleGeometry(FR + .28, FLEN + .6, 10, 24), new THREE.MeshStandardMaterial({ map: knit, roughness: .9, bumpMap: knit, bumpScale: .6, emissive: 0x3a1418 })); m.position.y = FR + .28 + (FLEN + .6) / 2; glove.add(m); } scene.add(glove);
const sausage = new THREE.Group(); { const m = new THREE.Mesh(new THREE.CapsuleGeometry(.72, 5.2, 10, 24), new THREE.MeshStandardMaterial({ color: 0xb04a32, roughness: .38, metalness: .05, emissive: 0x200604 })); m.position.y = .72 + 2.6; sausage.add(m);
  for (const s of [-1, 1]) { const tie = new THREE.Mesh(new THREE.TorusGeometry(.18, .06, 8, 16), new THREE.MeshStandardMaterial({ color: 0xe8d7b0 })); tie.position.y = s > 0 ? 7.1 : -.05; tie.rotation.x = Math.PI / 2; if (s > 0) sausage.add(tie); } } scene.add(sausage);
const _b = new THREE.Box3();
// coloca un objeto para que su punto más bajo quede en (x, y+lift, z) aprox. (yema: offset por la inclinación)
function placeTip(obj, x, z, y, pitch, yaw, lift = 0, r = FR) { obj.visible = true; obj.rotation.set(pitch, yaw, 0, 'YXZ'); const off = r * Math.sin(pitch);
  obj.position.set(x - Math.sin(yaw) * off, 0, z - Math.cos(yaw) * off); obj.updateMatrixWorld(true); _b.setFromObject(obj, true); obj.position.y += y + lift - _b.min.y; obj.updateMatrixWorld(true); }
function setFingerX(f, on) { f.userData.m.material = on ? fingerX : skin; f.userData.nail.visible = !on; }

// ==========================================================================
// CAMPO ELÉCTRICO y PARTÍCULAS
// ==========================================================================
const P = new Particles(14000, { size: .12, seed: 7 }); scene.add(P.obj);
const _q = V3(), _a = V3(), _c = V3(), _e = V3();
const bez = (a, c, e, u, out) => out.set(0, 0, 0).addScaledVector(a, (1 - u) * (1 - u)).addScaledVector(c, 2 * u * (1 - u)).addScaledVector(e, u * u);
// arcos de campo en cada cruce cercano a (x0,z0); F = punta del dedo (o null), steal = 0..1
function fieldArcs(t, x0, z0, R, amp, F = null, steal = 0) {
  const yr = yRow(), yc = yCol(); let n = 0; const res = [];
  for (let j = 0; j < NC; j++) for (let i = 0; i < NR; i++) { const x = XC[j], z = ZR[i]; const d = Math.hypot(x - x0, z - z0); if (d > R) continue; const fade = amp * smooth(R, R * .7, d);
    let w = 0; if (F) { const df = Math.hypot(x - F.x, z - F.z); w = steal * smooth(1.6, .3, df); } res.push([j, i, w]);
    for (let s = -1; s <= 1; s += 2) for (let k = 0; k < 2; k++) { const zz = z + (k - .5) * .16; _a.set(x + s * .55, yr + .01, zz); _e.set(x + s * .14, yc - .01, zz); _c.set(x + s * .62, yc + .5, zz);
      for (let p = 0; p < 10; p++) { const sd = P.seed[(n * 4) % (P.n * 4)], sd2 = P.seed[(n * 4 + 1) % (P.n * 4)]; n++;
        const u = fract(sd + t * .9); const stolen = F && sd2 < w * .85;
        if (stolen) { _q.set(F.x + (sd - .5) * .5, F.y + .2, F.z + (sd2 - .5) * .4); const cc = V3(x + s * .4, (yc + F.y) * .5 + .4, zz); const pp = bez(_a, cc, _q, u, V3()); const f = fade * Math.sin(u * Math.PI) * 1.2; P.push(pp.x, pp.y, pp.z, .5 * f, 1.1 * f, 1.8 * f); }
        else { const pp = bez(_a, _c, _e, u, V3()); const f = fade * Math.sin(u * Math.PI) * (1 - w * .7); P.push(pp.x, pp.y, pp.z, 1.7 * f, 1.25 * f, .8 * f); } } } }
  return res;
}
// lectura del sensor (para la gráfica): 1 = normal; baja cuando el dedo roba campo
function signalGraph(a, histFn, t, label, col = '#7fd4ff') { if (a <= .01) return; const x = 120, y = 1250, w = 840, h = 220;
  g2.save(); g2.globalAlpha = a * .7; g2.fillStyle = '#05080d'; g2.fillRect(x, y, w, h); g2.globalAlpha = a; g2.strokeStyle = 'rgba(127,212,255,.35)'; g2.lineWidth = 2; g2.strokeRect(x, y, w, h);
  g2.setLineDash([8, 8]); g2.beginPath(); g2.moveTo(x, y + 60); g2.lineTo(x + w, y + 60); g2.stroke(); g2.setLineDash([]);
  g2.strokeStyle = col; g2.lineWidth = 5; g2.shadowColor = col; g2.shadowBlur = 14; g2.beginPath();
  for (let k = 0; k <= 120; k++) { const tt = t - 2.4 + k / 120 * 2.4; const v = histFn(tt) + Math.sin(tt * 47) * .008; const px = x + k / 120 * w, py = y + 60 + (1 - v) * 360; k ? g2.lineTo(px, py) : g2.moveTo(px, py); } g2.stroke(); g2.restore();
  txt(label, x + 24, y + 30, 22, { align: 'left', spacing: 5, alpha: a * .9, fill: '#e3a372' }); }
function cross(x, y, a, s = 70) { if (a <= .01) return; g2.save(); g2.globalAlpha = a; g2.strokeStyle = '#ff5a4a'; g2.lineWidth = 16; g2.lineCap = 'round'; g2.shadowColor = '#ff5a4a'; g2.shadowBlur = 24;
  g2.beginPath(); g2.moveTo(x - s, y - s); g2.lineTo(x + s, y + s); g2.moveTo(x + s, y - s); g2.lineTo(x - s, y + s); g2.stroke(); g2.restore(); }
function reticle(p, a, label) { if (a <= .01) return; const r = lerp(140, 70, easeOut(clamp(a))); g2.save(); g2.globalAlpha = clamp(a); g2.strokeStyle = '#ffb27a'; g2.lineWidth = 4; g2.shadowColor = '#ffb27a'; g2.shadowBlur = 18;
  for (let k = 0; k < 4; k++) { const q = k * Math.PI / 2 + Math.PI / 4; g2.beginPath(); g2.arc(p.x, p.y, r, q - .35, q + .35); g2.stroke(); } g2.beginPath(); g2.moveTo(p.x - r - 26, p.y); g2.lineTo(p.x - r + 14, p.y); g2.moveTo(p.x + r - 14, p.y); g2.lineTo(p.x + r + 26, p.y); g2.stroke(); g2.restore();
  if (label) txt(label, p.x, p.y + r + 50, 34, { font: 'Montserrat', weight: 800, alpha: clamp(a), fill: '#ffb27a' }); }
// matriz de cruces vista desde arriba (sobre el cristal): base azul, fila barrida brillante, cruces con señal baja en naranja
function matrixDots(t, scanRow, hot, a) { const y = yGlass() + .09; for (let j = 0; j < NC; j++) for (let i = 0; i < NR; i++) { let hv = 0; for (const [hj, hi, hw] of hot) hv = Math.max(hv, hw * smooth(1.2, .2, Math.hypot(j - hj, (i - hi) * .92)));
    const sweep = scanRow === null ? 0 : smooth(1.5, 0, Math.abs(i - scanRow)); const f = a; const r = (.25 + .8 * sweep + 1.6 * hv) * f, gg = (.45 + .9 * sweep + .6 * hv) * f, b = (.9 + .9 * sweep - .5 * hv) * f;
    P.push(XC[j], y, ZR[i], r, gg, b); if (hv > .3) for (let k = 0; k < 3; k++) P.push(XC[j] + (k - 1) * .05, y + .02, ZR[i], 1.4 * hv * f, .6 * hv * f, .25 * hv * f); } }
const nearestJ = x => XC.reduce((b, v, k) => Math.abs(v - x) < Math.abs(XC[b] - x) ? k : b, 0), nearestI = z => ZR.reduce((b, v, k) => Math.abs(v - z) < Math.abs(ZR[b] - z) ? k : b, 0);
// gotas de agua sobre el cristal
const dropMat = xray(new THREE.Color(.6, .9, 1.4), 1.1), drops = []; { const r = rng(31); for (let k = 0; k < 7; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), dropMat); const s = .35 + r() * .45; m.scale.set(s, s * .55, s * (.8 + r() * .4));
  m.userData.p = [lerp(-2.6, 2.6, r()), lerp(-6, 6, r())]; m.userData.t = r(); scene.add(m); drops.push(m); } }
const specMat = new THREE.SpriteMaterial({ map: SOFT, color: new THREE.Color(1.6, 1.7, 1.9), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
const specs = drops.map(() => { const s = new THREE.Sprite(specMat); s.scale.setScalar(.35); scene.add(s); return s; });

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
const tapAge = (t, t0, d = .9) => (t - t0) / d;
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .05; camera.far = 2000;
  let bloomS = .6, flash = 0, ca = .0013, fade = 0, grain = .035, expo = 1, dim = 0;
  P.begin(); P.mat.size = .12; f1.visible = f2.visible = glove.visible = sausage.visible = false; setFingerX(f1, false); drops.forEach((d, k) => { d.visible = false; specs[k].visible = false; });
  phone.rotation.set(0, 0, 0); phone.position.set(0, 0, 0); setPhone(0, [0, 0], 0); screenMat.color.setScalar(1);
  for (const c of ['what', 'grid', 'field', 'body', 'scan', 'multi', 'glove', 'water', 'curious', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];
  if (t < TL.what) {
    // A · el dedo toca la pantalla (respuesta) · presión · uña (nada)
    const lt = t; const tx = .9, tz = 1.6; const nailK = smooth(TL.nail - .1, TL.nail + .5, t);
    camOrbit(V3(.5, .6, 1.2), lerp(19, 15, smooth(0, TL.what, t)), .75 - t * .03, .62, 35);
    const down = smooth(-.05, .22, lt) * (1 - smooth(TL.nail - .2, TL.nail + .2, t)); const push = smooth(TL.press, TL.press + .4, t) * (1 - smooth(TL.press + 1.2, TL.press + 1.6, t));
    if (nailK < .5) placeTip(f1, tx, tz, .03, .95, 2.3, lerp(3, 0, easeOut(down)) - push * .05);
    else { const nd = smooth(TL.nail + .3, TL.nail + .75, t) * (1 - smooth(TL.nail + 2.3, TL.nail + 2.7, t)); placeTip(f1, tx, tz, .03, -.8, 2.3, lerp(2.2, 0, easeOut(nd)), FR); }
    const rip = [[...uvOf(tx, tz), tapAge(t, .22)], [...uvOf(tx, tz), tapAge(t, .5)]]; drawScreen({ mode: 'home', ripples: nailK < .5 ? rip : [] });
    hud.push(() => { titleHUD('', 'TU DEDO NO TOCA NADA', smooth(.15, .4, lt) * (1 - smooth(TL.press - .1, TL.press + .1, t)), 300);
      titleHUD('LA PANTALLA', 'NO NOTA LA PRESIÓN', smooth(TL.press, TL.press + .3, t) * (1 - smooth(TL.nail - .1, TL.nail + .1, t)), 300);
      titleHUD('CON UNA UÑA', 'NO PASA NADA', smooth(TL.nail, TL.nail + .3, t), 300);
      const p = project(V3(tx, .1, tz)); for (let k = 0; k < 3; k++) { const a = push * (1 - smooth(TL.press + 1.2, TL.press + 1.5, t)); g2.save(); g2.globalAlpha = a * .8; g2.strokeStyle = '#ffb27a'; g2.lineWidth = 6; g2.beginPath(); g2.arc(p.x, p.y + 10, 60 + k * 26 + Math.sin(t * 9) * 4, Math.PI * 1.1, Math.PI * 1.9); g2.stroke(); g2.restore(); }
      const sx = smooth(TL.nail + .8, TL.nail + 1.1, t) * (1 - smooth(TL.what - .3, TL.what, t)); if (sx > 0) { const q = project(V3(tx, 0, tz)); cross(q.x, q.y - 260, sx, 60); } });
  } else if (t < TL.grid) {
    // B · ¿qué nota? tu electricidad (chispas alrededor de la yema)
    const lt = t - TL.what; const tx = .9, tz = 1.6; placeTip(f1, tx, tz, .03, .95, 2.3, lerp(1.4, .35, smooth(0, 1.2, lt)));
    drawScreen({ mode: 'home' }); camOrbit(V3(tx, 1.2, tz), lerp(12, 10, lt / 2.3), .6 + lt * .06, .3, 35);
    const ek = smooth(TL.elec - .2, TL.elec + .4, t); const F = V3(tx, .35, tz);
    for (let k = 0; k < 500 * ek; k++) { const sd = P.seed[k * 4], s2 = P.seed[k * 4 + 1], s3 = P.seed[k * 4 + 2]; const u = fract(sd + t * .7); const a = s2 * 6.283 + t * (s3 - .5) * 3; const rr = .2 + u * 1.2;
      const pp = V3(F.x + Math.cos(a) * rr, F.y + .3 + (s3 - .5) * 1.8 * (1 - u * .4) - u * .25, F.z + Math.sin(a) * rr - .2); const f = (1 - u) * ek * .55; P.push(pp.x, pp.y, pp.z, .45 * f, 1.0 * f, 1.8 * f); }
    P.mat.size = .1; bloomS = .9;
    hud.push(() => { titleHUD('', '¿ENTONCES QUÉ NOTA?', smooth(0, .25, lt) * (1 - smooth(TL.elec - TL.what - .1, TL.elec - TL.what + .1, lt)), 300);
      bigStat('LO QUE NOTA ES', 'TU ELECTRICIDAD', 380, smooth(TL.elec - TL.what, TL.elec - TL.what + .3, lt), clamp((lt - 1.2) / 1.2)); });
  } else if (t < TL.field) {
    // C · vista explosionada: cristal / rejilla (filas + columnas de ITO) / pantalla
    const lt = t - TL.grid; const e = easeInOut(smooth(0, 1.6, lt)); const ra = smooth(.6, 1.4, lt), ca2 = smooth(TL.ito - TL.grid, TL.ito - TL.grid + .8, lt) ;
    setPhone(e, [ra, Math.max(ca2, ra * .0)], e * .9); drawScreen({ mode: 'home' }); screenMat.color.setScalar(lerp(1, .55, e));
    camOrbit(V3(0, lerp(.3, 1.2, e), .5), lerp(24, 27, e), .55 + lt * .045, lerp(.5, .38, e), 35); bloomS = .8;
    hud.push(() => { callout(V3(3.2, yGlass(), -6.6), 60, -70, 'CRISTAL', null, smooth(1.2, 1.6, lt) * (1 - smooth(TL.thin - TL.grid - .2, TL.thin - TL.grid, lt)));
      callout(V3(3.1, yRow(), ZR[2]), 70, -10, 'REJILLA INVISIBLE', null, smooth(1.4, 1.8, lt) * (1 - smooth(TL.thin - TL.grid - .2, TL.thin - TL.grid, lt)));
      callout(V3(3.2, 0, 6.6), 50, 70, 'PANTALLA', null, smooth(1.6, 2.0, lt) * (1 - smooth(TL.thin - TL.grid - .2, TL.thin - TL.grid, lt)));
      titleHUD('BAJO EL CRISTAL', 'UNA REJILLA INVISIBLE', smooth(.3, .6, lt) * (1 - smooth(TL.ito - TL.grid - .1, TL.ito - TL.grid + .1, lt)), 300);
      titleHUD('FILAS Y COLUMNAS DE ÓXIDO', 'TRANSPARENTE Y CONDUCTOR', smooth(TL.ito - TL.grid, TL.ito - TL.grid + .3, lt) * (1 - smooth(TL.thin - TL.grid - .1, TL.thin - TL.grid + .1, lt)), 300);
      bigStat('MIL VECES MÁS FINO QUE UN PELO', '≈ 0,0001 mm', 380, smooth(TL.thin - TL.grid, TL.thin - TL.grid + .3, lt), clamp((lt - 5.4) / 1.4)); });
  } else if (t < TL.scan) {
    // D/E · campo en los cruces, condensador; el dedo roba campo y la señal cae
    const lt = t - TL.field; setPhone(1, [.5, .55], .4); drawScreen({ mode: 'home' }); screenMat.color.setScalar(.45);
    const j0 = 4, i0 = 8, x0 = XC[j0], z0 = ZR[i0]; const amp = smooth(0, .8, lt);
    const bodyK = smooth(TL.body - .1, TL.body + .5, t); const nearK = easeInOut(smooth(TL.near, TL.near + 1.6, t)); const steal = smooth(TL.near + .6, TL.drop + .3, t);
    let F = null; if (bodyK > 0) { F = V3(x0 + .05, yGlass() + .08, z0 + .1); placeTip(f1, F.x, F.z, F.y, .9, .35, lerp(2.4, 0, nearK) + (1 - bodyK) * 5); setFingerX(f1, true); fingerX.uniforms.uA.value = bodyK;
      // iones (agua salada) dentro del dedo
      f1.updateMatrixWorld(true); for (let k = 0; k < 260; k++) { const s = P.seed, b = (k * 4 + 1000) % (P.n * 4); const a = s[b] * 6.283, rr = Math.sqrt(s[b + 1]) * FR * .85, yy = FR + (s[b + 2] - .5) * (FLEN + FR);
        const lp = V3(Math.cos(a + t * (s[b + 3] - .5)) * rr, yy + Math.sin(t * 2 + k) * .05, Math.sin(a + t * (s[b + 3] - .5)) * rr); lp.applyMatrix4(f1.matrixWorld); const f = bodyK * .9; k % 2 ? P.push(lp.x, lp.y, lp.z, 1.5 * f, .7 * f, .3 * f) : P.push(lp.x, lp.y, lp.z, .35 * f, .9 * f, 1.6 * f); } }
    const fFree = F ? V3(F.x, F.y + lerp(2.4, 0, nearK), F.z) : null;
    fieldArcs(t, x0, z0, 3.2, amp, fFree, steal); P.mat.size = .14; bloomS = .85;
    const camK = smooth(TL.body - .4, TL.body + 1, t); camOrbit(V3(x0 + .3, lerp(yRow() + .4, yRow() + 1.5, camK), z0 + .2), lerp(lerp(6.2, 5, smooth(0, TL.cap - TL.field, lt)), 10, camK), 1.25 - lt * .02, lerp(.28, .3, camK), 35);
    const sig = tt => 1 - .35 * smooth(TL.near + .6, TL.drop + .3, tt);
    hud.push(() => { callout(V3(x0 - 1.7, yRow(), z0 + .9), -80, -110, 'FILAS', 'emiten un campo', smooth(.3, .7, lt) * (1 - smooth(TL.cap - TL.field - .2, TL.cap - TL.field, lt)), '#ffb27a');
      callout(V3(x0 + .9, yCol(), z0 + 1.8), 90, -150, 'COLUMNAS', 'lo recogen', smooth(TL.cols - TL.field, TL.cols - TL.field + .4, lt) * (1 - smooth(TL.cap - TL.field - .2, TL.cap - TL.field, lt)), '#7fd4ff');
      const ck = smooth(TL.cap - TL.field, TL.cap - TL.field + .4, lt) * (1 - smooth(TL.body - TL.field - .2, TL.body - TL.field, lt)); if (ck > 0) { const p = project(V3(x0, (yRow() + yCol()) / 2, z0)); g2.save(); g2.globalAlpha = ck; g2.strokeStyle = '#ffe2c0'; g2.lineWidth = 4; g2.shadowColor = '#ffb27a'; g2.shadowBlur = 20; g2.beginPath(); g2.arc(p.x, p.y, 90, 0, 7); g2.stroke(); g2.restore(); }
      titleHUD('CADA CRUCE ES', 'UN DIMINUTO CONDENSADOR', ck, 300);
      titleHUD('TU CUERPO: AGUA SALADA', 'CONDUCE', smooth(TL.body - TL.field, TL.body - TL.field + .3, lt) * (1 - smooth(TL.near - TL.field - .1, TL.near - TL.field + .1, lt)), 300);
      titleHUD('AL ACERCAR EL DEDO', 'TE LLEVAS PARTE DEL CAMPO', smooth(TL.near - TL.field, TL.near - TL.field + .3, lt) * (1 - smooth(TL.drop - TL.field - .1, TL.drop - TL.field + .1, lt)), 300);
      titleHUD('EN ESE CRUCE', 'LA SEÑAL CAE', smooth(TL.drop - TL.field, TL.drop - TL.field + .3, lt) * (1 - smooth(TL.pf - TL.field - .1, TL.pf - TL.field + .1, lt)), 300);
      bigStat('UNA VARIACIÓN DE', '≈ 1 pF', 400, smooth(TL.pf - TL.field, TL.pf - TL.field + .3, lt), clamp((t - TL.pf) / 1.5));
      txt('una billonésima de faradio', W / 2, 470, 34, { weight: 300, alpha: smooth(TL.pf - TL.field + .4, TL.pf - TL.field + .8, lt) });
      signalGraph(smooth(TL.near - TL.field + .2, TL.near - TL.field + .6, lt), sig, t, 'SEÑAL EN ESE CRUCE', steal > .5 ? '#ffb27a' : '#7fd4ff'); });
  } else if (t < TL.glove) {
    // F/G · barrido del chip (vista cenital) · aquí está tu dedo · multitáctil y zoom
    const lt = t - TL.scan; const multi = t >= TL.multi; setPhone(0, [.5, .5], 0);
    const az = .0, el = lerp(1.0, 1.42, smooth(0, 1.2, lt)); camOrbit(V3(0, 0, -.6), lerp(33, 31, smooth(0, 4, lt)), az, el, 35); camera.up.set(0, 1, 0);
    const scanRow = multi && t > TL.multi + 1.5 ? null : (t * 6.5) % NR; let hot = [];
    if (!multi) { const tx = .8, tz = 1.75; placeTip(f1, tx, tz, .03, .85, .25, lerp(3, 0, smooth(.1, .7, lt))); hot = [[nearestJ(tx), nearestI(tz), smooth(.5, .9, lt) * (lt > 1.5 ? 1 : 0.6)]]; screenMat.color.setScalar(.35); drawScreen({ mode: 'home' }); }
    else { const mk = t - TL.multi; const sp = easeInOut(smooth(TL.zoom - .5, TL.zoom + 1.4, t)); const c = V3(.2, 0, .6), dir = V3(.55, 0, -.85).normalize();
      const pA = c.clone().addScaledVector(dir, lerp(.9, 3.6, sp)), pB = c.clone().addScaledVector(dir, -lerp(.9, 3.6, sp)); const dn = lerp(3, 0, smooth(.1, .7, mk));
      placeTip(f1, pA.x, pA.z, .03, .8, .1, dn); placeTip(f2, pB.x, pB.z, .03, .8, -.6, dn); hot = [[nearestJ(pA.x), nearestI(pA.z), smooth(.5, .9, mk)], [nearestJ(pB.x), nearestI(pB.z), smooth(.5, .9, mk)]];
      screenMat.color.setScalar(lerp(.35, 1, smooth(TL.zoom - .6, TL.zoom, t))); drawScreen({ mode: 'map', zoom: lerp(1, 2.4, sp) }); }
    matrixDots(t, scanRow, hot, multi ? lerp(1, .35, smooth(TL.zoom - .6, TL.zoom, t)) : 1); P.mat.size = 1.0; bloomS = .9;
    hud.push(() => { bigStat('UN CHIP RECORRE TODOS LOS CRUCES', '+100 VECES/s', 330, smooth(0, .3, lt) * (1 - smooth(TL.found - TL.scan - .1, TL.found - TL.scan + .1, lt)), clamp(lt / 3));
      if (!multi) { const p = project(V3(XC[nearestJ(.8)], 0, ZR[nearestI(1.75)])); reticle({ x: p.x, y: p.y }, smooth(TL.found - TL.scan + .3, TL.found - TL.scan + .8, lt), 'AQUÍ ESTÁ TU DEDO'); }
      titleHUD('MIDE CADA CRUCE POR SEPARADO', 'VARIOS DEDOS A LA VEZ', smooth(TL.multi - TL.scan, TL.multi - TL.scan + .3, lt) * (1 - smooth(TL.zoom - TL.scan - .1, TL.zoom - TL.scan + .1, lt)), 300);
      titleHUD('POR ESO PUEDES HACER', 'ZOOM CON DOS', smooth(TL.zoom - TL.scan, TL.zoom - TL.scan + .3, lt), 300); });
  } else if (t < TL.water) {
    // H · guante: la tela aísla, el campo no se mueve
    const lt = t - TL.glove; setPhone(1, [.5, .55], .4); drawScreen({ mode: 'home' }); screenMat.color.setScalar(.45); const j0 = 3, i0 = 7, x0 = XC[j0], z0 = ZR[i0];
    const F = V3(x0 + .05, yGlass() + .08, z0 + .1); const dk = easeInOut(smooth(.2, 1.6, lt)); placeTip(glove, F.x, F.z, F.y, .9, 2.7, lerp(5, 0, dk), FR + .28);
    fieldArcs(t, x0, z0, 3.2, 1, null, 0); P.mat.size = .14; bloomS = .8;
    camOrbit(V3(x0 + .3, yRow() + 1.4, z0 + .2), 10.5, 1.1 - lt * .02, .3, 35);
    hud.push(() => { titleHUD('¿Y POR QUÉ NO FUNCIONA', 'CON GUANTES?', smooth(0, .3, lt) * (1 - smooth(TL.aisla - TL.glove - .1, TL.aisla - TL.glove + .1, lt)), 300);
      titleHUD('LA TELA AÍSLA', 'TU ELECTRICIDAD NO LLEGA', smooth(TL.aisla - TL.glove, TL.aisla - TL.glove + .3, lt), 300);
      signalGraph(smooth(.6, 1, lt), () => 1, t, 'SEÑAL EN ESE CRUCE'); cross(W / 2, 1360, smooth(TL.aisla - TL.glove + .3, TL.aisla - TL.glove + .6, lt), 55); });
  } else if (t < TL.curious) {
    // I · gotas de agua: toques fantasma
    const lt = t - TL.water; setPhone(0, [.35, .35], 0); camOrbit(V3(0, 0, .2), lerp(23, 21, lt / 3.6), .25 + lt * .03, lerp(1.0, 1.1, lt / 3.6), 35);
    const ghosts = [], hot = []; drops.forEach((d, k) => { const [x, z] = d.userData.p; const on = smooth(d.userData.t * .9, d.userData.t * .9 + .25, lt); if (on <= 0) return; d.visible = true; d.scale.y = d.scale.x * .55 * on; d.position.set(x, .03, z);
      specs[k].visible = true; specs[k].position.set(x + .1, .03 + d.scale.y * .9, z - .1); specs[k].scale.setScalar(.45 * on);
      const blink = .6 + .4 * Math.sin(t * 13 + k * 2); ghosts.push([...uvOf(x, z), on * blink]); hot.push([nearestJ(x), nearestI(z), on * blink * smooth(.3, .6, lt)]); });
    screenMat.color.setScalar(.8); drawScreen({ mode: 'home', ghost: ghosts }); matrixDots(t, (t * 6.5) % NR, hot, .8); P.mat.size = .9; bloomS = .8;
    hud.push(() => { titleHUD('LAS GOTAS DE AGUA', 'SÍ LA CONFUNDEN', smooth(0, .3, lt) * (1 - smooth(TL.cond - TL.water - .1, TL.cond - TL.water + .1, lt)), 300);
      titleHUD('TOQUES FANTASMA', 'TAMBIÉN CONDUCEN', smooth(TL.cond - TL.water, TL.cond - TL.water + .3, lt), 300); });
  } else if (t < TL.brand) {
    // J · cualquier cosa conductora y húmeda… Corea del Sur, salchichas
    const lt = t - TL.curious; const sk = t - TL.sausage; const tx = 0, tz = 5.4; camOrbit(V3(0, .5, 1.2), lerp(19, 16, smooth(0, 8, lt)), -.5 + lt * .04, .6, 35);
    const tap1 = smooth(-.2, 1.0, sk) * (1 - smooth(1.15, 1.4, sk)), tap2 = smooth(1.4, 1.6, sk) * (1 - smooth(1.9, 2.3, sk)); const unlock = smooth(1.65, 2.3, sk);
    if (sk > -.4) placeTip(sausage, tx, tz, .03, 1.15, -.5 + lt * .04 + 1.5, lerp(6, 0, easeOut(clamp(tap1 + tap2))), .72);
    drawScreen({ mode: 'lock', unlock, ripples: [[...uvOf(tx, tz), tapAge(t, TL.sausage + 1.0)], [...uvOf(tx, tz), tapAge(t, TL.sausage + 1.6)]] });
    // nieve (Corea, invierno)
    const sn = smooth(TL.korea - TL.curious - .3, TL.korea - TL.curious + .6, lt); for (let k = 0; k < 1600 * sn; k++) { const s = P.seed, b = k * 4; const u = fract(s[b] + t * (.08 + s[b + 3] * .05));
      P.push((s[b + 1] - .5) * 30 + Math.sin(t + k) * .3, lerp(14, -1, u), (s[b + 2] - .5) * 30, .9 * sn, .95 * sn, 1.05 * sn); } P.mat.size = .14; bloomS = .7;
    hud.push(() => { titleHUD('FUNCIONA CON CUALQUIER COSA', 'CONDUCTORA Y HÚMEDA', smooth(0, .3, lt) * (1 - smooth(TL.korea - TL.curious - .1, TL.korea - TL.curious + .1, lt)), 300);
      titleHUD('COREA DEL SUR · INVIERNO DE 2010', '', smooth(TL.korea - TL.curious, TL.korea - TL.curious + .3, lt), 300);
      bigStat('', 'SALCHICHAS', 400, smooth(TL.sausage - TL.curious + .2, TL.sausage - TL.curious + .5, lt), clamp((sk - .3) / 1.5));
      txt('para usar el móvil sin quitarse los guantes', W / 2, 480, 32, { weight: 300, alpha: smooth(TL.sausage - TL.curious + .8, TL.sausage - TL.curious + 1.2, lt) }); });
  } else {
    // K · marca
    const lt = t - TL.brand; drawScreen({ mode: 'home' }); camOrbit(V3(0, 0, 0), 18 + lt * 2, -.3 + lt * .05, .7, 35); expo = .9; fade = Math.min(.55, lt * .45);
    dim = smooth(0, .8, lt) * .8; hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  fill.position.copy(camera.position).add(V3(0, 4, 0));
    P.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (dim > 0) hud.unshift(() => { g2.save(); g2.globalAlpha = dim * .7; g2.fillStyle = '#02050b'; g2.fillRect(0, 0, W, H); g2.restore(); });
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
function renderCover() { renderFrame(TL.near + 2.2); coverText('¿CÓMO SABE', 'DÓNDE TOCAS?', 'Tu pantalla no nota la presión'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
