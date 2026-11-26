// NO LO SABÍAS — "Lo que pasa en un partido de fútbol y nadie te explica"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final. Unidades: metros.
// Datos: campo 105 × 68 m, portería 7,32 × 2,44 m, penalti a 11 m, barrera a 9,15 m.
// Riego: la hierba mojada reduce el rozamiento del balón (rueda más rápido y bota de forma uniforme).
// Efecto Magnus: un balón que gira desvía el aire hacia un lado y recibe una fuerza hacia el otro.
// Roberto Carlos, Francia–Brasil, Tournoi de France, 3 de junio de 1997: falta a unos 35 m.
// Centrocampistas: más de 10 km por partido. Penaltis: el balón llega en < 0,5 s.
// Bar-Eli et al. (2007), Journal of Economic Psychology: 311 penaltis; los porteros se tiran a un lado ~94 % de las veces;
// parando en el centro detenían ~33 % frente a ~14 % tirándose. «Sesgo de acción».
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3,
  g2, camera, SOFT, Particles, txt, copperGrad, project, fmt, callout, titleHUD, bar, fract, camOrbit, arrowXY, bigStat, drawBrand, coverText, finish } from '../../lib/core.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(.01, .02, .045);
scene.fog = new THREE.FogExp2(new THREE.Color(.012, .025, .05), .006);
const hemi = new THREE.HemisphereLight(0x9fb8ff, 0x0b1a10, .55); scene.add(hemi);
const key = new THREE.DirectionalLight(0xfff2e0, 2.4); key.position.set(-40, 60, 30); scene.add(key);
const rim = new THREE.DirectionalLight(0xffb070, 1.1); rim.position.set(50, 30, -40); scene.add(rim);

// ==========================================================================
// ESTADIO: césped a rayas, líneas, porterías, gradas con público y torres de luz
// ==========================================================================
const L2 = 52.5, W2 = 34;
const grassTex = (() => { const c = document.createElement('canvas'); c.width = 2048; c.height = 1024; const x = c.getContext('2d'); const r = rng(9);
  for (let i = 0; i < 20; i++) { x.fillStyle = i % 2 ? '#1f5a26' : '#246b2c'; x.fillRect(i * 2048 / 20, 0, 2048 / 20 + 1, 1024); }
  for (let i = 0; i < 60000; i++) { const v = r(); x.fillStyle = `rgba(${v > .5 ? 60 : 10},${v > .5 ? 120 : 50},${v > .5 ? 50 : 20},.18)`; x.fillRect(r() * 2048, r() * 1024, 2, 3); }
  // líneas (coordenadas: 2048 px = 105 m, 1024 px = 68 m)
  const sx = 2048 / 105, sz = 1024 / 68, X = m => (m + L2) * sx, Z = m => (m + W2) * sz; x.strokeStyle = 'rgba(240,240,235,.92)'; x.lineWidth = 5;
  x.strokeRect(X(-L2 + .3), Z(-W2 + .3), (105 - .6) * sx, (68 - .6) * sz); x.beginPath(); x.moveTo(X(0), Z(-W2)); x.lineTo(X(0), Z(W2)); x.stroke();
  x.beginPath(); x.ellipse(X(0), Z(0), 9.15 * sx, 9.15 * sz, 0, 0, 7); x.stroke();
  for (const s of [-1, 1]) { const g = s * L2; x.strokeRect(Math.min(X(g), X(g - s * 16.5)), Z(-20.16), 16.5 * sx, 40.32 * sz); x.strokeRect(Math.min(X(g), X(g - s * 5.5)), Z(-9.16), 5.5 * sx, 18.32 * sz);
    x.fillStyle = 'rgba(240,240,235,.92)'; x.beginPath(); x.arc(X(g - s * 11), Z(0), 5, 0, 7); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; })();
const grassMat = new THREE.MeshStandardMaterial({ map: grassTex, roughness: .92, metalness: 0 });
const pitch = new THREE.Mesh(new THREE.PlaneGeometry(105, 68), grassMat); pitch.rotation.x = -Math.PI / 2; scene.add(pitch);
const apron = new THREE.Mesh(new THREE.PlaneGeometry(150, 110), new THREE.MeshStandardMaterial({ color: 0x163d1b, roughness: .95 })); apron.rotation.x = -Math.PI / 2; apron.position.y = -.02; scene.add(apron);
// brillo de agua (zona mojada)
const wetMat = new THREE.MeshStandardMaterial({ color: 0x2a6a30, roughness: .42, metalness: 0, transparent: true, opacity: 0 });
const wetSheet = new THREE.Mesh(new THREE.PlaneGeometry(105, 68), wetMat); wetSheet.rotation.x = -Math.PI / 2; wetSheet.position.y = .01; scene.add(wetSheet);
// porterías
function makeGoal(s) { const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color: 0xf4f4f0, roughness: .35, metalness: .2 });
  const post = new THREE.CylinderGeometry(.06, .06, 2.44, 12); for (const z of [-3.66, 3.66]) { const p = new THREE.Mesh(post, m); p.position.set(0, 1.22, z); g.add(p); }
  const cb = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 7.44, 12), m); cb.rotation.x = Math.PI / 2; cb.position.set(0, 2.44, 0); g.add(cb);
  const net = []; const d = 2.0; for (let z = -3.66; z <= 3.661; z += .25) { net.push(0, 2.44, z, s * d, 2.0, z, s * d, 2.0, z, s * d, 0, z); }
  for (let y = 0; y <= 2.44; y += .25) { const xx = s * d * (y > 2 ? (2.44 - y) / .44 : 1); net.push(xx, y, -3.66, xx, y, 3.66); }
  for (let x = 0; x <= d; x += .25) for (const z of [-3.66, 3.66]) net.push(s * x, 0, z, s * x, lerp(2.44, 2.0, x / d), z);
  const ng = new THREE.BufferGeometry(); ng.setAttribute('position', new THREE.Float32BufferAttribute(net, 3));
  g.add(new THREE.LineSegments(ng, new THREE.LineBasicMaterial({ color: 0xdfe6ee, transparent: true, opacity: .35 }))); g.position.set(s * L2, 0, 0); scene.add(g); return g; }
const goalR = makeGoal(1); makeGoal(-1);
// gradas y público (puntos)
const crowd = (() => { const r = rng(21); const pos = [], col = []; const pal = [[.9, .9, .92], [.85, .45, .2], [.15, .3, .7], [.7, .1, .12], [.95, .8, .3], [.2, .2, .25]];
  for (let i = 0; i < 26000; i++) { const side = Math.floor(r() * 4); const row = r(); const along = r() * 2 - 1; const h = 1.5 + row * 26, back = 8 + row * 30;
    let x, z; if (side < 2) { x = along * (L2 + 6); z = (side ? 1 : -1) * (W2 + back); } else { z = along * (W2 + 6); x = (side === 2 ? 1 : -1) * (L2 + back); }
    pos.push(x, h, z); const c = pal[Math.floor(r() * pal.length)]; const k = .35 + r() * .5; col.push(c[0] * k, c[1] * k, c[2] * k); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ size: .75, vertexColors: true, sizeAttenuation: true })); scene.add(p); return p; })();
const standMat = new THREE.MeshStandardMaterial({ color: 0x0d1420, roughness: .9 });
for (const [x, z, w, d, ry] of [[0, -(W2 + 23), 120, 34, 0], [0, W2 + 23, 120, 34, 0], [L2 + 23, 0, 34, 80, 0], [-(L2 + 23), 0, 34, 80, 0]]) {
  const s = new THREE.Mesh(new THREE.BoxGeometry(w, 1, d), standMat); s.position.set(x, 13, z); s.rotation.set(z ? (z > 0 ? -.75 : .75) : 0, 0, x ? (x > 0 ? .75 : -.75) : 0); scene.add(s); }
// torres de luz
const lights = new THREE.Group(); scene.add(lights);
for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const p = V3(sx * (L2 + 14), 45, sz * (W2 + 18));
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: SOFT, color: new THREE.Color(2.4, 2.2, 1.9), blending: THREE.AdditiveBlending, depthWrite: false })); sp.position.copy(p); sp.scale.setScalar(26); lights.add(sp);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.5, .8, 45, 8), standMat); pole.position.set(p.x, 22.5, p.z); lights.add(pole); }

// ==========================================================================
// BALÓN: 12 pentágonos oscuros (direcciones del icosaedro) sobre esfera blanca
// ==========================================================================
const ICO = (() => { const t = (1 + Math.sqrt(5)) / 2; const v = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]]; return v.map(a => V3(...a).normalize()); })();
function ballGeo(R) { const g = new THREE.SphereGeometry(R, 64, 48); const p = g.attributes.position, col = []; const v = V3();
  for (let i = 0; i < p.count; i++) { v.set(p.getX(i), p.getY(i), p.getZ(i)).normalize(); let m = -1; for (const d of ICO) m = Math.max(m, v.dot(d));
    const dark = m > .925; const seam = Math.abs(m - .925) < .006 || (m > .82 && m < .826); const c = dark ? [.08, .09, .12] : seam ? [.45, .45, .48] : [.95, .95, .93]; col.push(...c); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return g; }
const BALLR = .11;
const ballMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .38, metalness: .02 });
const ball = new THREE.Mesh(ballGeo(BALLR), ballMat); scene.add(ball);
const ball2 = new THREE.Mesh(ball.geometry, ballMat); scene.add(ball2);
const bigBall = new THREE.Mesh(ballGeo(1), ballMat); scene.add(bigBall);
const ballShadowMat = new THREE.MeshBasicMaterial({ map: SOFT, color: 0x000000, transparent: true, opacity: .55, depthWrite: false });
function shadowFor(b) { const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), ballShadowMat.clone()); s.rotation.x = -Math.PI / 2; scene.add(s); s.userData.b = b; return s; }
const sh1 = shadowFor(ball), sh2 = shadowFor(ball2);
function syncShadow(s) { const b = s.userData.b; s.visible = b.visible; s.position.set(b.position.x, .012, b.position.z); const k = .35 + b.position.y * .15; s.scale.set(k, k, 1); s.material.opacity = .5 / (1 + b.position.y * .6); }

// ==========================================================================
// JUGADOR (maniquí estilizado, sin escudos ni marcas)
// ==========================================================================
function makePlayer(shirt, shorts, skin = 0xc79a7a, sock = 0x0e1828) {
  const g = new THREE.Group(); const M = c => new THREE.MeshStandardMaterial({ color: c, roughness: .6 });
  const mS = M(shirt), mP = M(shorts), mK = M(skin), mSo = M(sock), mB = M(0x111111);
  const part = (geo, mat, parent, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
  const hips = new THREE.Group(); hips.position.y = .95; g.add(hips);
  const torso = new THREE.Group(); hips.add(torso);
  part(new THREE.CapsuleGeometry(.19, .42, 6, 14), mS, torso, 0, .33, 0).scale.set(1, 1, .7);
  part(new THREE.SphereGeometry(.12, 18, 14), mK, torso, 0, .78, 0);
  part(new THREE.CapsuleGeometry(.17, .12, 6, 12), mP, hips, 0, -.02, 0).scale.set(1.1, 1, .8);
  const limb = (parent, x, y, len, r, mats) => { const j = new THREE.Group(); j.position.set(x, y, 0); parent.add(j);
    const up = part(new THREE.CapsuleGeometry(r, len, 5, 10), mats[0], j, 0, -len / 2 - r * .5, 0); const k = new THREE.Group(); k.position.y = -len - r; j.add(k);
    const lo = part(new THREE.CapsuleGeometry(r * .85, len, 5, 10), mats[1], k, 0, -len / 2 - r * .5, 0); return { j, k, up, lo }; };
  const legs = [-1, 1].map(s => { const L = limb(hips, 0, -.05, .36, .075, [mK, mSo]); L.j.position.z = s * .1; const foot = part(new THREE.BoxGeometry(.24, .08, .1), mB, L.k, .06, -.47, 0); return L; });
  const arms = [-1, 1].map(s => { const A = limb(torso, 0, .62, .25, .055, [mS, mK]); A.j.position.z = s * .25; return A; });
  g.userData = { hips, torso, legs, arms }; scene.add(g); return g; }
function posePlayer(p, o) { const u = p.userData; const ph = o.run ?? 0, amp = o.amp ?? 0;
  u.legs.forEach((L, i) => { const s = i ? 1 : -1; L.j.rotation.z = Math.sin(ph + (i ? Math.PI : 0)) * .7 * amp + (o.legZ?.[i] ?? 0); L.k.rotation.z = -Math.max(0, Math.sin(ph + (i ? Math.PI : 0) + 1.2)) * 1.1 * amp - (o.knee?.[i] ?? 0); L.j.rotation.x = (o.spread ?? 0) * s; });
  u.arms.forEach((A, i) => { const s = i ? 1 : -1; A.j.rotation.z = -Math.sin(ph + (i ? Math.PI : 0)) * .6 * amp + (o.armZ ?? 0); A.j.rotation.x = s * (o.armUp ?? .1); A.k.rotation.z = .5 * amp + (o.elbow ?? 0); });
  u.torso.rotation.z = (o.lean ?? 0); u.hips.position.y = .95 + (o.drop ?? 0) + Math.abs(Math.sin(ph)) * .05 * amp; }
const NAVY = 0x16243c, COPPER = 0xc8743f;
const kicker = makePlayer(COPPER, 0xf0f0f0, 0xc79a7a, 0x16243c);
const keeper = makePlayer(0xe8c33a, 0x111111, 0xb98a6a, 0x222222);
const wall = [0, 1, 2, 3].map(i => makePlayer(0xf2f2f2, 0x1a1a1a, i % 2 ? 0x8a5a40 : 0xd2a888, 0xf2f2f2));
const runner = makePlayer(COPPER, 0xf0f0f0);
const allPlayers = [kicker, keeper, ...wall, runner];

// PIERNA EN PRIMER PLANO (gemelo con media cortada)
const legRig = new THREE.Group(); scene.add(legRig);
const calfGeo = (() => { const pts = []; for (let i = 0; i <= 40; i++) { const y = i / 40; const r = .052 + .03 * Math.exp(-Math.pow((y - .62) / .17, 2)) - .012 * (1 - y); pts.push(new THREE.Vector2(r, y * .46)); } return new THREE.LatheGeometry(pts, 48); })();
const skinMat = new THREE.MeshStandardMaterial({ color: 0xc79a7a, roughness: .55 });
const calf = new THREE.Mesh(calfGeo, skinMat); legRig.add(calf);
const sockGeo = (() => { const pts = []; for (let i = 0; i <= 40; i++) { const y = i / 40; const r = (.052 + .03 * Math.exp(-Math.pow((y - .62) / .17, 2)) - .012 * (1 - y)) * 1.04; pts.push(new THREE.Vector2(r, y * .44)); } return new THREE.LatheGeometry(pts, 48); })();
const sockMat = new THREE.MeshStandardMaterial({ color: 0x16243c, roughness: .8 });
const sockM = new THREE.Mesh(sockGeo, sockMat); legRig.add(sockM);
const stripeMat = new THREE.MeshStandardMaterial({ color: COPPER, roughness: .6 });
for (const y of [.36, .39]) { const st = new THREE.Mesh(new THREE.TorusGeometry(.081, .006, 6, 48), stripeMat); st.rotation.x = Math.PI / 2; st.position.y = y; legRig.add(st); }
const holes = []; { const r = rng(5); for (let i = 0; i < 7; i++) { const a = -.9 + i * .3 + (r() - .5) * .1, y = .22 + (i % 3) * .06; const h = new THREE.Mesh(new THREE.CircleGeometry(.012 + r() * .006, 18), skinMat);
  const R = .087; h.position.set(Math.sin(a) * R, y, Math.cos(a) * R); h.lookAt(V3(Math.sin(a) * 2, y, Math.cos(a) * 2)); legRig.add(h); holes.push(h); } }
const knee = new THREE.Mesh(new THREE.SphereGeometry(.058, 20, 14), skinMat); knee.position.y = .47; legRig.add(knee);
const boot = new THREE.Mesh(new THREE.BoxGeometry(.11, .07, .26), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: .4 })); boot.position.set(0, -.02, .05); legRig.add(boot);
const pumpGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: SOFT, color: new THREE.Color(1.6, .35, .15), blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 })); pumpGlow.position.set(0, .3, .09); pumpGlow.scale.setScalar(.35); legRig.add(pumpGlow);
legRig.position.set(-30, 0, 20);

// Partículas
const PS = new Particles(16000, { size: .06, seed: 7 }); scene.add(PS.obj);
const WATER = [.55, .8, 1.25], AIR = [.4, .85, 1.6], HOT = [1.6, .7, .3];

// ==========================================================================
// HUD
// ==========================================================================
function stamp(s, x, y, a, rot = -.1, col = '#ff6a4a', size = 92) { if (a <= .01) return; const sc = lerp(1.6, 1, easeOut(clamp(a * 1.4)));
  g2.save(); g2.translate(x, y); g2.rotate(rot); g2.scale(sc, sc); g2.globalAlpha = clamp(a); g2.strokeStyle = col; g2.lineWidth = 8; g2.shadowColor = col; g2.shadowBlur = 25;
  g2.font = `800 ${size}px Montserrat`; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.letterSpacing = '6px'; const w = g2.measureText(s).width + 70; g2.strokeRect(-w / 2, -size * .8, w, size * 1.6); g2.fillStyle = col; g2.fillText(s, 0, 4); g2.restore(); }
function two(top, l1, l2, a, y = 300) { if (a <= .01) return; txt(l1, W / 2, y, 50, { font: 'Montserrat', weight: 800, alpha: a }); if (l2) txt(l2, W / 2, y + 62, 50, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(160, 920, y + 62, .5) }); if (top) txt(top, W / 2, y - 62, 24, { spacing: 7, alpha: a * .8, fill: '#e3a372' }); }
function timer(sec, a, y = 470) { if (a <= .01) return; txt('TIEMPO DEL BALÓN', W / 2, y - 95, 24, { spacing: 7, alpha: a * .8, fill: '#e3a372' });
  txt(sec.toFixed(2).replace('.', ',') + ' s', W / 2, y, 120, { font: 'Montserrat', weight: 800, alpha: a, fill: sec > .44 ? copperGrad(240, 840, y, .5) : '#ffffff' }); }

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
const SPRINK = [[-30, -18], [-10, 14], [12, -12], [32, 16], [0, 0], [-40, 8], [40, -6]].map(([x, z]) => V3(x, .3, z));
function sprinklers(t, k) { if (k <= .01) return; PS.mat.size = .7; const s = PS.seed; let i = 0;
  for (const p of SPRINK) for (let n = 0; n < 1300; n++, i++) { const q = (i % PS.n) * 4; const age = fract(s[q] + t * .9); const ang = t * 1.6 + s[q + 1] * .5 + (n % 2 ? Math.PI : 0); const sp = 9 + s[q + 2] * 3;
    const tt = age * 1.6; const x = p.x + Math.cos(ang) * sp * tt, z = p.z + Math.sin(ang) * sp * tt, y = p.y + 6 * tt - 4.9 * tt * tt; if (y < 0) continue; const f = k * (1 - age) * 1.6; PS.push(x, y, z, WATER[0] * f, WATER[1] * f, WATER[2] * f); } }
function setBall(b, p, spinAxis, ang) { b.position.copy(p); b.quaternion.setFromAxisAngle(spinAxis, ang); }
// trayectoria de la falta (Roberto Carlos): sale hacia fuera y entra pegada al palo
const FK0 = V3(L2 - 35, BALLR, -7);
const FK = new THREE.CubicBezierCurve3(FK0.clone(), V3(L2 - 22, 1.2, -16), V3(L2 - 7, 2.2, -8.5), V3(L2 + .3, 1.3, -3.2));
const PEN = V3(L2 - 11, BALLR, 0), PEN_T = V3(L2 + .2, .45, -3.0);

function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .05; camera.far = 2000; camera.fov = 40;
  let bloomS = .55, flash = 0, ca = .0013, fade = 0, expo = 1, focus = V3(0, 0, 0);
  PS.begin(); PS.mat.size = .06; for (const p of allPlayers) p.visible = false; legRig.visible = false; bigBall.visible = false; ball.visible = true; ball2.visible = false; wetMat.opacity = 0; lights.visible = true;
  for (const c of ['curve', 'rc', 'socks', 'km', 'calf', 'pen', 'study', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];

  if (t < TL.curve) {
    // A · riego antes del partido; balón en seco vs en mojado
    const lt = t; const sp = 1 - smooth(TL.wet - .6, TL.wet, t); sprinklers(t, sp); wetMat.opacity = smooth(.5, TL.wet, t) * .55;
    if (t < TL.wet) { focus = V3(0, 2, 0); camOrbit(focus, lerp(60, 48, lt / TL.wet), .9 + lt * .04, lerp(.3, .2, lt / TL.wet), 42); fade = 1 - smooth(0, .3, t);
      ball.position.set(0, BALLR, 0); }
    else { const k = t - TL.wet; ball2.visible = true;
      const dry = 10 * (1 - Math.exp(-k / 1.2)) * 1.0, wet = 8 * k - .25 * k * k; // seco: se frena; mojado: sigue rodando
      setBall(ball, V3(-20 + dry, BALLR, -.55), V3(0, 0, -1), dry / BALLR); setBall(ball2, V3(-20 + Math.max(0, wet), BALLR, .55), V3(0, 0, -1), wet / BALLR);
      wetMat.opacity = .4; const mid = (ball.position.x + ball2.position.x) / 2; focus = V3(mid + 2, .15, 0); camera.position.set(Math.min(ball.position.x, ball2.position.x) - 4.5, 1.5, 0); camera.lookAt(focus); camera.fov = 50;
      // salpicaduras del balón mojado
      for (let i = 0; i < 600; i++) { const s = PS.seed, q = i * 4; const age = fract(s[q] + t * 2.2); const back = age * 1.2; const f = (1 - age) * .6; PS.push(ball2.position.x - back, .02 + Math.sin(age * 3.14) * .12 * s[q + 1], ball2.position.z + (s[q + 2] - .5) * .25, WATER[0] * f, WATER[1] * f, WATER[2] * f); } PS.mat.size = .06; }
    hud.push(() => { two(null, '¿POR QUÉ RIEGAN', 'EL CÉSPED?', smooth(.1, .4, lt) * (1 - smooth(TL.wet - .3, TL.wet, lt)));
      if (t > TL.wet) { callout(ball.position.clone().add(V3(0, .15, 0)), -40, -260, 'SECO', 'se frena', smooth(TL.wet + .3, TL.wet + .7, t), '#ffb27a'); callout(ball2.position.clone().add(V3(0, .15, 0)), 40, -380, 'MOJADO', 'resbala y corre', smooth(TL.wet + .6, TL.wet + 1, t), '#7fd4ff'); }
      two(null, 'MÁS RÁPIDO', 'Y BOTA IGUAL', smooth(TL.wet + 1.6, TL.wet + 2, t) * (1 - smooth(TL.toque - .2, TL.toque, t)), 1470);
      two('EQUIPOS DE TOQUE', 'PIDEN RIEGO', null, smooth(TL.toque, TL.toque + .4, t), 1500); });
  } else if (t < TL.rc) {
    // B · efecto Magnus en primer plano
    const lt = t - TL.curve; ball.visible = false; bigBall.visible = true; lights.visible = false;
    const spin = smooth(TL.side - .2, TL.side + .4, t); const ang = (t - TL.side) * 9 * spin; bigBall.position.set(0, 30, 0); bigBall.quaternion.setFromAxisAngle(V3(0, 1, 0), ang);
    focus = bigBall.position.clone(); camOrbit(focus, lerp(9, 7.5, lt / (TL.rc - TL.curve)), .0, 1.25, 40); camera.up.set(1, 0, 0); camera.lookAt(focus);
    // flujo de aire: viene de −x hacia +x (el balón avanza hacia −x); estela desviada hacia −z, fuerza hacia +z
    const air = smooth(TL.air - .4, TL.air + .3, t) + (1 - smooth(TL.side, TL.side + .3, t)) * .5; const def = smooth(TL.air, TL.air + 1.2, t);
    if (air > .01) for (let i = 0; i < 7000; i++) { const s = PS.seed, q = i * 4; const z0 = (s[q + 1] - .5) * 5.5; const u = fract(s[q] + t * .45); const x = lerp(-6, 6, u);
      let z = z0; const r = Math.hypot(x, z0); if (r < 1.25) { z = z0 + Math.sign(z0 || 1) * (1.25 - Math.abs(z0)) * Math.exp(-x * x * .8); }
      z += Math.sign(z0 || 1) * Math.max(0, 1.3 - Math.abs(z0)) * Math.exp(-x * x * .5) * .2; if (x > 0) z -= def * 1.1 * Math.exp(-Math.abs(z0) * .6) * smooth(0, 3, x);
      if (Math.hypot(x, z) < 1.02) continue; const sideSlow = z0 > 0 ? def : 0; const f = air * .7;
      const c = sideSlow > .1 && Math.abs(z0) < 1.6 && x > -1.5 && x < 1.5 ? HOT : AIR; PS.push(x, 30 + (s[q + 2] - .5) * .3, z, c[0] * f, c[1] * f, c[2] * f); }
    PS.mat.size = .16; bloomS = .7;
    hud.push(() => { two(null, '¿CÓMO SE CURVA', 'UN DISPARO?', smooth(.1, .4, lt) * (1 - smooth(TL.side - TL.curve - .2, TL.side - TL.curve, lt)));
      two(null, 'GOLPÉALO DE LADO', 'Y GIRA', smooth(TL.side - TL.curve + .1, TL.side - TL.curve + .4, lt) * (1 - smooth(TL.air - TL.curve - .2, TL.air - TL.curve, lt)));
      const a = smooth(TL.air - TL.curve + .4, TL.air - TL.curve + .8, lt) * (1 - smooth(TL.magnus - TL.curve - .1, TL.magnus - TL.curve + .2, lt));
      callout(V3(0, 30, -1.05), 120, 300, 'EL AIRE ACOMPAÑA', 'y se desvía', a, '#7fd4ff'); callout(V3(0, 30, 1.05), 120, -300, 'EL AIRE CHOCA', 'y frena', a * smooth(TL.air - TL.curve + 1.2, TL.air - TL.curve + 1.6, lt), '#ffb27a');
      const fa = smooth(TL.air - TL.curve + 1.8, TL.air - TL.curve + 2.3, lt); const c = project(V3(0, 30, 1.2)), d = project(V3(0, 30, 3.2)); arrowXY(c.x, c.y, d.x, d.y, fa, '#ffe2c0', 16);
      bigStat('EFECTO', 'MAGNUS', 1470, smooth(TL.magnus - TL.curve, TL.magnus - TL.curve + .3, lt), .5); });
  } else if (t < TL.socks) {
    // C · la falta de 1997: sale hacia fuera… y entra
    const lt = t - TL.rc; const dur = TL.socks - TL.rc; const shot0 = TL.goal ? Math.max(.8, TL.goal - TL.rc - 1.6) : Math.min(1.6, dur * .3); const u = smooth(shot0, shot0 + 1.6, lt);
    wall.forEach((p, i) => { p.visible = true; p.position.set(FK0.x + 9.15 * .97, 0, FK0.z + 9.15 * .25 + (i - 1.5) * .55); p.rotation.y = Math.PI; posePlayer(p, { armUp: .15, armZ: -.4 }); });
    keeper.visible = true; keeper.position.set(L2 - .5, 0, lerp(-.8, -2.2, smooth(shot0 + .8, shot0 + 1.6, lt))); keeper.rotation.y = Math.PI; posePlayer(keeper, { spread: .25, drop: -.08, armUp: .5 });
    kicker.visible = true; const kr = smooth(0, shot0, lt); kicker.position.set(FK0.x - lerp(5, .6, kr), 0, FK0.z - lerp(2.5, .5, kr)); kicker.rotation.y = -.25; posePlayer(kicker, { run: lt * 11, amp: (1 - smooth(shot0 - .2, shot0 + .2, lt)) * 1 });
    const bp = u > 0 ? FK.getPointAt(Math.min(u, 1)) : FK0.clone(); setBall(ball, bp, V3(0, 1, 0), lt * 30);
    if (u > .02) for (let i = 0; i < 900; i++) { const k = (i / 900) * Math.min(u, 1); const q = FK.getPointAt(k); const f = .7 * (k / Math.max(u, .01)); PS.push(q.x, q.y, q.z, HOT[0] * f, HOT[1] * f, HOT[2] * f); }
    PS.mat.size = .35; const net = smooth(shot0 + 1.55, shot0 + 1.7, lt); if (net > 0) flash = Math.max(flash, flashAt(lt, shot0 + 1.6, .3, .25));
    focus = V3(L2 - 18, 1, -7); camera.position.set(FK0.x - 6.5, lerp(3.2, 4.2, smooth(0, dur, lt)), FK0.z - 2.2); camera.lookAt(focus.lerp(V3(L2, 1, -3), u * .5)); camera.fov = 45;
    hud.push(() => { two('1997 · FRANCIA – BRASIL', 'ROBERTO CARLOS', null, smooth(.1, .4, lt) * (1 - smooth(shot0 + 2.4, shot0 + 2.8, lt)), 330);
      bigStat('DISTANCIA', '+30 m', 520, smooth(.4, .8, lt) * (1 - smooth(shot0 - .1, shot0 + .2, lt)), .5);
      if (u > .1 && u < .75) callout(bp.clone(), 70, -180, 'SALE HACIA FUERA', null, smooth(.1, .25, u) * (1 - smooth(.6, .75, u)), '#ffb27a');
      stamp('¡DENTRO!', W / 2, 520, smooth(shot0 + 1.7, shot0 + 2, lt), -.08, '#ffe2c0', 96); });
  } else if (t < TL.pen) {
    // D · medias cortadas, 10 km y gemelos hinchados
    const lt = t - TL.socks; const top = t >= TL.km && t < TL.calf; ball.visible = false;
    if (!top) { legRig.visible = true; const cut = t >= TL.calf ? 1 : smooth(.6, 1.4, lt); holes.forEach((h, i) => { h.visible = cut > i / holes.length; });
      const pump = t >= TL.calf ? smooth(TL.calf + .3, TL.calf + 1.5, t) : 0; calf.scale.set(1 + pump * .1, 1, 1 + pump * .1); sockM.scale.set(1 + pump * .05, 1, 1 + pump * .05);
      pumpGlow.material.opacity = pump * (.55 + .2 * Math.sin(t * 7)); focus = legRig.position.clone().add(V3(0, .3, 0));
      camOrbit(focus, lerp(.62, .52, clamp((t >= TL.calf ? t - TL.calf : lt) / 4)), .15 + Math.sin(t * .3) * .2, .05, 40); bloomS = .6; lights.visible = false; }
    else { const k = t - TL.km; runner.visible = true; const path = s => V3(-25 + Math.sin(s * .9) * 13 + Math.sin(s * 2.3) * 4, 0, Math.sin(s * .6 + 1) * 15 + Math.cos(s * 1.7) * 4);
      const S = k * 2.2; const p = path(S); runner.position.copy(p); const d = path(S + .01).sub(p); runner.rotation.y = Math.atan2(-d.z, d.x); posePlayer(runner, { run: t * 12, amp: 1 });
      for (let i = 0; i < 4000; i++) { const s = S * i / 4000; const q = path(s); const f = .55; PS.push(q.x, .05, q.z, HOT[0] * f, HOT[1] * f, HOT[2] * f); } PS.mat.size = 1.1;
      focus = V3(-25, 0, 0); camera.position.set(-25, 72, 18); camera.lookAt(focus); camera.fov = 40; }
    hud.push(() => { two(null, '¿POR QUÉ LLEVAN', 'AGUJEROS EN LAS MEDIAS?', smooth(.1, .4, lt) * (1 - smooth(TL.km - TL.socks - .2, TL.km - TL.socks, lt)), 300);
      if (top) { const k = t - TL.km; bigStat('UN CENTROCAMPISTA CORRE', lerp(0, 10.5, smooth(.2, TL.calf - TL.km - .3, k)).toFixed(1).replace('.', ',') + ' km', 470, smooth(0, .3, k), .5); }
      if (t >= TL.calf) { const k = t - TL.calf; two(null, 'EL GEMELO SE HINCHA', 'Y LA MEDIA APRIETA', smooth(.1, .4, k) * (1 - smooth(2.4, 2.8, k)), 300);
        stamp('CALAMBRE', W / 2, 1450, smooth(1.6, 2, k), -.08, '#ff6a4a', 84); two('LA SOLUCIÓN', 'CORTARLA', null, smooth(2.8, 3.2, k), 300); } });
  } else if (t < TL.brand) {
    // E · el penalti: < 0,5 s; el portero adivina; el estudio de 311 penaltis
    const lt = t - TL.pen; keeper.visible = true; keeper.rotation.y = Math.PI; kicker.visible = true;
    const shotT = 1.0, slow = 2.6; const flight = clamp((lt - shotT) / slow); const real = flight * .45;
    kicker.position.set(PEN.x - lerp(4, .7, smooth(0, shotT, lt)), 0, -.4); kicker.rotation.y = 0; posePlayer(kicker, { run: lt * 10, amp: 1 - smooth(shotT - .2, shotT + .1, lt) });
    const bp = lt < shotT ? PEN.clone() : PEN.clone().lerp(PEN_T, flight).setY(lerp(BALLR, PEN_T.y, flight) + Math.sin(flight * Math.PI) * .25); setBall(ball, bp, V3(0, 0, 1), -flight * 40);
    // el portero se tira (a su derecha = −z… pero adivina el lado contrario en la segunda mitad)
    const dive = t < TL.study ? smooth(shotT + .2, shotT + slow * .7, lt) : smooth(TL.study + .2, TL.study + 1, t);
    const side = t < TL.study ? 1 : (t < TL.why ? 1 : 0);
    keeper.position.set(L2 - .6, lerp(0, .5, Math.sin(dive * Math.PI) * side), side * lerp(0, 2.6, easeOut(dive))); keeper.rotation.x = -side * lerp(0, 1.35, easeOut(dive)); posePlayer(keeper, { spread: .2 + dive * .3, armUp: .5 + dive * 1.2, drop: -.05 });
    focus = V3(L2, 1.0, -.3); camera.position.set(PEN.x - 6.5, 2.4, 2.4); camera.lookAt(focus); camera.fov = 38;
    if (flight > 0 && flight < 1) for (let i = 0; i < 500; i++) { const k = i / 500 * flight; const q = PEN.clone().lerp(PEN_T, k).setY(lerp(BALLR, PEN_T.y, k) + Math.sin(k * Math.PI) * .25); const f = .6 * k / flight; PS.push(q.x, q.y, q.z, HOT[0] * f, HOT[1] * f, HOT[2] * f); }
    PS.mat.size = .14;
    if (t >= TL.study) { expo = .55; bloomS = .4; }
    hud.push(() => { timer(real, smooth(shotT - .2, shotT, lt) * (1 - smooth(TL.guess - TL.pen + 1.4, TL.guess - TL.pen + 1.8, lt)));
      two(null, 'NO DA TIEMPO A REACCIONAR:', 'TIENE QUE ADIVINAR', smooth(TL.guess - TL.pen, TL.guess - TL.pen + .4, lt) * (1 - smooth(TL.study - TL.pen - .2, TL.study - TL.pen, lt)), 1460);
      if (t >= TL.study) { const k = t - TL.study; const a = smooth(.1, .5, k) * (1 - smooth(TL.why - TL.study + 1.6, TL.why - TL.study + 2, k));
        txt('311 PENALTIS', W / 2, 330, 30, { spacing: 8, alpha: a, fill: '#e3a372' });
        bar(140, 470, 800, .94 * smooth(.3, 1.2, k), 'SE TIRA A UN LADO', '94 %', a); bar(140, 590, 800, .06 * smooth(.3, 1.2, k), 'SE QUEDA EN EL CENTRO', '6 %', a, '#7fd4ff');
        const b = smooth(2.2, 2.6, k) * a; txt('LOS QUE PARA', W / 2, 760, 26, { spacing: 7, alpha: b, fill: '#e3a372' });
        bar(140, 860, 800, .14 * smooth(2.4, 3.2, k), 'TIRÁNDOSE', '14 %', b); bar(140, 980, 800, .33 * smooth(2.4, 3.2, k), 'QUIETO EN EL CENTRO', '33 %', b, '#7fd4ff');
        if (t >= TL.why) { const w = t - TL.why; stamp('SESGO DE ACCIÓN', W / 2, 1300, smooth(.2, .6, w), -.06, '#ffe2c0', 64); txt('si no se tira, parece que no lo ha intentado', W / 2, 1440, 34, { weight: 300, alpha: smooth(.6, 1, w) }); } } });
  } else {
    // F · marca
    const lt = t - TL.brand; focus = V3(0, 3, 0); camOrbit(focus, 100 + lt * 6, .45 + lt * .03, .5, 42); lights.visible = false; expo = .8; fade = Math.min(.5, lt * .45); ball.position.set(0, BALLR, 0);
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  syncShadow(sh1); syncShadow(sh2);
  PS.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, bloom: bloomS, expo });
}
function renderCover() { renderFrame(TL.rc + 2.2); coverText('LO QUE PASA', 'EN UN PARTIDO', 'y nadie te explica'); }
window.renderCover = () => { renderCover(); return true; };
window.OBJ = { ball, ball2, sh1, sh2, PS, lights, crowd, wetSheet, bigBall };
window.DBG = () => ({ k: PS.k, cam: camera.position.toArray().map(v=>+v.toFixed(2)), b1: ball.position.toArray().map(v=>+v.toFixed(2)), b2: ball2.position.toArray().map(v=>+v.toFixed(2)), b2v: ball2.visible, bb: bigBall.visible, sh: sh1.position.toArray(), shv: sh1.visible, sz: PS.mat.size });
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
