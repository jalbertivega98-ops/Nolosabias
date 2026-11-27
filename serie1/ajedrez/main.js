// NO LO SABÍAS — "Hay más partidas de ajedrez que átomos en el universo"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final.
// Tras 1 jugada de cada bando: 400 posiciones; tras 2: 71.852. Número de Shannon (1950): ~10^120 partidas posibles.
// Átomos en el universo observable ~10^80. Deep Blue venció a Kaspárov en 1997 (match de 6 partidas). Motores actuales (p. ej. Stockfish) superan a cualquier humano.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3,
  g2, camera, Particles, txt, copperGrad, project, callout, bar, fract, arrowXY, bigStat, drawBrand, coverText, finish } from '../../lib/core.js';

const scene = new THREE.Scene(); scene.background = new THREE.Color(.05, .05, .07);
const hemi = new THREE.HemisphereLight(0xfff2e2, 0x1a1a22, 1.0); scene.add(hemi);
const keyL = new THREE.SpotLight(0xffe8cc, 60, 0, .6, .5, 1.2); keyL.position.set(3, 7, 4); scene.add(keyL); scene.add(keyL.target);
const rimL = new THREE.DirectionalLight(0x8fb8ff, 1.4); rimL.position.set(-5, 3, -5); scene.add(rimL);
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .5, ...o });

// ==========================================================================
// TABLERO Y PIEZAS (1 casilla = 1 unidad; tablero centrado en el origen)
// ==========================================================================
const boardG = new THREE.Group(); scene.add(boardG);
{ const lightM = M(0xe8d6b4, { roughness: .45 }), darkM = M(0x7a4a2a, { roughness: .45 });
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const sq = new THREE.Mesh(new THREE.BoxGeometry(1, .12, 1), (i + j) % 2 ? lightM : darkM); sq.position.set(i - 3.5, -.06, j - 3.5); boardG.add(sq); }
  const frame = new THREE.Mesh(new THREE.BoxGeometry(9, .14, 9), M(0x3a2214, { roughness: .4 })); frame.position.y = -.08; boardG.add(frame);
  const table = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, .2, 64), M(0x1e1a18, { roughness: .6 })); table.position.y = -.25; boardG.add(table); }
const sq = (f, r) => V3(f - 3.5, 0, 3.5 - r); // f: 0..7 (a..h), r: 0..7 (1..8)
const prof = { p: [[0, 0], [.32, 0], [.32, .08], [.22, .14], [.12, .4], [.16, .46], [.1, .5], [.17, .62], [.12, .74], [0, .78]],
  r: [[0, 0], [.36, 0], [.36, .1], [.26, .18], [.22, .7], [.3, .76], [.3, .98], [0, .98]],
  b: [[0, 0], [.34, 0], [.34, .1], [.22, .18], [.13, .7], [.2, .76], [.12, .82], [.18, .98], [.1, 1.14], [.05, 1.2], [0, 1.24]],
  q: [[0, 0], [.38, 0], [.38, .1], [.26, .2], [.15, .9], [.26, .98], [.18, 1.06], [.27, 1.24], [.12, 1.3], [.07, 1.36], [0, 1.4]],
  k: [[0, 0], [.4, 0], [.4, .1], [.27, .2], [.16, .96], [.27, 1.04], [.2, 1.12], [.25, 1.3], [0, 1.34]],
  n: [[0, 0], [.34, 0], [.34, .1], [.24, .18], [.2, .4], [0, .42]] };
const geoCache = {}; const pieceGeo = k => geoCache[k] || (geoCache[k] = new THREE.LatheGeometry(prof[k].map(([x, y]) => new THREE.Vector2(x, y)), 40));
const whiteM = M(0xf2ead8, { roughness: .35 }), blackM = M(0x1c1a1e, { roughness: .3, metalness: .1 });
function makePiece(k, white) { const g = new THREE.Group(); const m = white ? whiteM : blackM; g.add(new THREE.Mesh(pieceGeo(k), m));
  if (k === 'n') { const neck = new THREE.Mesh(new THREE.BoxGeometry(.24, .5, .3), m); neck.position.set(0, .62, .02); neck.rotation.x = -.25; g.add(neck); const head = new THREE.Mesh(new THREE.BoxGeometry(.24, .2, .46), m); head.position.set(0, .82, -.12); head.rotation.x = .35; g.add(head);
    const ear = new THREE.Mesh(new THREE.ConeGeometry(.06, .14, 4), m); ear.position.set(0, .96, .08); g.add(ear); g.rotation.y = white ? 0 : Math.PI; }
  if (k === 'k') { const c1 = new THREE.Mesh(new THREE.BoxGeometry(.06, .26, .06), m); c1.position.y = 1.45; g.add(c1); const c2 = new THREE.Mesh(new THREE.BoxGeometry(.18, .06, .06), m); c2.position.y = 1.48; g.add(c2); }
  if (k === 'q') { for (let i = 0; i < 8; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), m); const a = i / 8 * 6.28; b.position.set(Math.cos(a) * .2, 1.27, Math.sin(a) * .2); g.add(b); } }
  scene.add(g); return g; }
const START = []; { const back = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r']; for (let f = 0; f < 8; f++) { START.push({ k: back[f], w: true, f, r: 0 }, { k: 'p', w: true, f, r: 1 }, { k: 'p', w: false, f, r: 6 }, { k: back[f], w: false, f, r: 7 }); } }
const pieces = START.map(s => ({ ...s, m: makePiece(s.k, s.w) }));
const findP = (f, r) => pieces.find(p => p.f === f && p.r === r);
function setPos(list) { // list of [k, w, f, r]
  pieces.forEach(p => p.m.visible = false); const used = new Set();
  for (const [k, w, f, r] of list) { const p = pieces.find(q => q.k === k && q.w === w && !used.has(q)); if (!p) continue; used.add(p); p.m.visible = true; p.m.position.copy(sq(f, r)); p.m.rotation.set(0, k === 'n' ? (w ? 0 : Math.PI) : 0, 0); p.m.scale.setScalar(1); } }
const startList = START.map(s => [s.k, s.w, s.f, s.r]);
const MID = [['k', true, 6, 0], ['r', true, 5, 0], ['p', true, 5, 1], ['p', true, 6, 1], ['p', true, 7, 1], ['q', true, 3, 2], ['n', true, 5, 2], ['b', true, 2, 3], ['p', true, 4, 3], ['p', true, 3, 3], ['r', true, 0, 0], ['p', true, 0, 2], ['p', true, 1, 1],
  ['k', false, 6, 7], ['r', false, 5, 7], ['p', false, 5, 6], ['p', false, 6, 5], ['p', false, 7, 6], ['q', false, 3, 6], ['n', false, 2, 5], ['b', false, 6, 6], ['p', false, 4, 4], ['p', false, 2, 4], ['r', false, 0, 7], ['p', false, 0, 5], ['p', false, 1, 6], ['b', false, 4, 5]];
// Deep Blue (armarios) y móvil
const deep = new THREE.Group(); scene.add(deep);
{ for (const s of [-1, 1]) { const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 4.2, 1.6), M(0x0e1018, { roughness: .3, metalness: .4 })); cab.position.set(s * 1.05, 2.1, 0); deep.add(cab);
    for (let i = 0; i < 10; i++) { const led = new THREE.Mesh(new THREE.BoxGeometry(1.2, .04, .02), new THREE.MeshBasicMaterial({ color: new THREE.Color(.3, .8, 2.4) })); led.position.set(s * 1.05, .6 + i * .34, .81); deep.add(led); } }
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(1.4, .4), new THREE.MeshBasicMaterial({ color: new THREE.Color(.4, .9, 2.4) })); logo.position.set(0, 3.9, .82); deep.add(logo); }
const screenTex = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 512; const x = c.getContext('2d'); x.fillStyle = '#111'; x.fillRect(0, 0, 256, 512); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#e8d6b4' : '#7a4a2a'; x.fillRect(8 + i * 30, 136 + j * 30, 30, 30); }
  x.fillStyle = '#7fe08a'; x.font = 'bold 26px sans-serif'; x.textAlign = 'center'; x.fillText('+9,7', 128, 110); x.fillStyle = '#fff'; x.font = '18px sans-serif'; x.fillText('MOTOR', 128, 420); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const phone = new THREE.Group(); scene.add(phone);
{ const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3, .14), M(0x15161a, { roughness: .2, metalness: .5 })); phone.add(body); const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 2.82), new THREE.MeshBasicMaterial({ map: screenTex })); scr.position.z = .071; phone.add(scr); }
const PS = new Particles(30000, { size: .1, seed: 5 }); scene.add(PS.obj);
const ALL = [boardG, deep, phone];

// ==========================================================================
// HUD
// ==========================================================================
function stamp(s, x, y, a, rot = -.08, col = '#ff6a4a', size = 86) { if (a <= .01) return; const sc = lerp(1.6, 1, easeOut(clamp(a * 1.4)));
  g2.save(); g2.translate(x, y); g2.rotate(rot); g2.scale(sc, sc); g2.globalAlpha = clamp(a); g2.strokeStyle = col; g2.lineWidth = 8; g2.shadowColor = col; g2.shadowBlur = 25;
  g2.font = `800 ${size}px Montserrat`; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.letterSpacing = '6px'; const w = g2.measureText(s).width + 70; g2.strokeRect(-w / 2, -size * .8, w, size * 1.6); g2.fillStyle = col; g2.fillText(s, 0, 4); g2.restore(); }
function two(top, l1, l2, a, y = 300) { if (a <= .01) return; txt(l1, W / 2, y, 50, { font: 'Montserrat', weight: 800, alpha: a }); if (l2) txt(l2, W / 2, y + 62, 50, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(160, 920, y + 62, .5) }); if (top) txt(top, W / 2, y - 62, 24, { spacing: 7, alpha: a * .8, fill: '#e3a372' }); }
const win = (t, a, b, f = .3) => smooth(a, a + f, t) * (1 - smooth(b - f, b, t));
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
const fmt = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
function power(base, exp, x, y, size, a, fill) { if (a <= .01) return; txt(base, x - size * .25, y, size, { font: 'Montserrat', weight: 800, alpha: a, fill }); txt(exp, x + size * .55, y - size * .45, size * .5, { font: 'Montserrat', weight: 800, alpha: a, fill, align: 'left' }); }
function tree(cx, cy, depth, a, t, spread = 380) { if (a <= .01) return; g2.save(); g2.globalAlpha = a; g2.lineWidth = 2; const r = rng(7);
  const draw = (x, y, d, w) => { if (d <= 0) return; const n = d === depth ? 6 : 4; for (let i = 0; i < n; i++) { const nx = x + (i / (n - 1) - .5) * w, ny = y + 140; g2.strokeStyle = `rgba(255,${180 - d * 20},${100 + d * 20},${.25 + .15 * d})`; g2.beginPath(); g2.moveTo(x, y); g2.lineTo(nx, ny); g2.stroke(); g2.fillStyle = '#ffd08a'; g2.fillRect(nx - 3, ny - 3, 6, 6); draw(nx, ny, d - 1, w / n * 1.1); } };
  draw(cx, cy, depth, spread * 2); g2.restore(); }

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .05; camera.far = 3000; camera.fov = 40;
  let bloomS = .35, flash = 0, ca = .0012, fade = 0, expo = 1.1;
  PS.begin(); PS.mat.size = .1; for (const o of ALL) o.visible = false; pieces.forEach(p => p.m.visible = false); scene.background = new THREE.Color(.05, .05, .07); keyL.intensity = 22; hemi.intensity = 1.0; whiteM.emissive.setRGB(0, 0, 0); blackM.emissive.setRGB(0, 0, 0);
  for (const c of ['one', 'two', 'whole', 'shannon', 'zeros', 'atoms', 'more', 'unique', 'machines', 'deep', 'phone', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];

  if (t < TL.one) {
    // A · tablero inicial
    boardG.visible = true; setPos(startList); const u = smooth(0, TL.one, t); camera.position.set(lerp(-3, -1, u), lerp(2.2, 3.2, u), lerp(7.5, 8.5, u)); camera.lookAt(0, .4, 0); camera.fov = 42;
    hud.push(() => two(null, '¿CUÁNTAS PARTIDAS DE AJEDREZ', 'DISTINTAS SE PUEDEN JUGAR?', smooth(.05, .3, t), 300));
  } else if (t < TL.whole) {
    // B · 400 posiciones tras 1 jugada; 71.852 tras 2
    const lt = t - TL.one; boardG.visible = true; setPos(startList);
    const e2 = findP(4, 1).m, e7 = findP(4, 6).m; const m1 = easeInOut(smooth(.3, .9, lt)), m2 = easeInOut(smooth(1.1, 1.7, lt));
    e2.position.copy(sq(4, 1).lerp(sq(4, 3), m1)); e2.position.y = Math.sin(m1 * Math.PI) * .5; e7.position.copy(sq(4, 6).lerp(sq(4, 4), m2)); e7.position.y = Math.sin(m2 * Math.PI) * .5;
    if (t > TL.two) { const n1 = easeInOut(smooth(TL.two, TL.two + .6, t)); const g1 = findP(6, 0).m; g1.position.copy(sq(6, 0).lerp(sq(5, 2), n1)); g1.position.y = Math.sin(n1 * Math.PI) * .7; }
    camera.position.set(0, 11.5, 6.5); camera.lookAt(0, 0, .6); camera.fov = 42;
    hud.push(() => { two(null, 'TRAS UNA JUGADA DE CADA UNO', 'YA HAY…', win(t, TL.one, TL.two), 300); two(null, 'TRAS DOS JUGADAS…', null, smooth(TL.two, TL.two + .3, t), 300);
      const c1 = t < TL.two ? lerp(0, 400, easeOut(smooth(TL.one + 1.8, TL.one + 3.4, t))) : lerp(400, 71852, easeInOut(smooth(TL.two + .2, TL.two + 1.6, t)));
      g2.save(); g2.globalAlpha = .8 * smooth(1.6, 1.9, lt); g2.fillStyle = 'rgba(8,10,16,.8)'; g2.beginPath(); g2.roundRect(140, 1420, 800, 270, 30); g2.fill(); g2.restore(); txt(fmt(c1), W / 2, 1540, 140, { font: 'Montserrat', weight: 800, alpha: smooth(1.6, 1.9, lt), fill: copperGrad(200, 880, 1540, .5) }); txt('POSICIONES POSIBLES', W / 2, 1640, 30, { spacing: 6, alpha: smooth(1.6, 1.9, lt) }); });
  } else if (t < TL.atoms) {
    // C · 10^120 y sus 120 ceros
    const lt = t - TL.whole; boardG.visible = true; setPos(startList); scene.background = new THREE.Color(.03, .03, .05); keyL.intensity = 25;
    camera.position.set(Math.sin(t * .2) * 9, 5, Math.cos(t * .2) * 9); camera.lookAt(0, 0, 0); camera.fov = 44;
    hud.push(() => { g2.save(); g2.globalAlpha = .55 * smooth(0, .4, lt); g2.fillStyle = '#05060a'; g2.fillRect(0, 0, W, H); g2.restore(); tree(W / 2, 620, 4, win(t, TL.whole, TL.shannon + 1.5) * .9, t);
      two(null, '¿Y EN UNA PARTIDA ENTERA?', null, win(t, TL.whole, TL.shannon), 300); two('CLAUDE SHANNON · 1950', 'NÚMERO DE PARTIDAS', 'POSIBLES', win(t, TL.shannon, TL.zeros), 300);
      power('10', '120', W / 2, 1300, 230, smooth(TL.shannon + 1.2, TL.shannon + 1.6, t), copperGrad(200, 880, 1300, .5));
      two(null, 'UN 1 SEGUIDO DE', '120 CEROS', smooth(TL.zeros, TL.zeros + .3, t), 300);
      const za = smooth(TL.zeros + .1, TL.zeros + .4, t); if (za > .01) { const n = Math.round(120 * smooth(TL.zeros + .2, TL.zeros + 2.0, t)); const s = '1' + '0'.repeat(n); const per = 20;
        for (let i = 0; i * per < s.length; i++) txt(s.slice(i * per, (i + 1) * per).split('').join(' '), W / 2, 720 + i * 62, 40, { font: 'Montserrat', weight: 800, alpha: za, fill: i === 0 ? '#ffd08a' : '#ffffff' }); } });
  } else if (t < TL.unique) {
    // D · átomos del universo observable
    const lt = t - TL.atoms; scene.background = new THREE.Color(.01, .01, .03); bloomS = .8; const s = PS.seed;
    for (let i = 0; i < 26000; i++) { const k = i * 4; const gi = i % 9; const ga = gi * 2.1 + 1, gr = 30 + gi * 14; const arm = i % 2; const rr = Math.pow(s[k], 1.4) * 8; const th = rr * .35 + arm * Math.PI + s[k + 1] * .6;
      const cx = (gi % 3 - 1) * 17 + Math.sin(gi * 3) * 3, cz = -40 - gi * 4, cy = (Math.floor(gi / 3) - 1) * 26 + Math.cos(gi * 2) * 4; const x = cx + Math.cos(th) * rr, z = cz + Math.sin(th) * rr * .5, y = cy + (s[k + 2] - .5) * 1.5 + Math.sin(th) * rr * .3; const c = gi % 3 === 0 ? [1, .75, .55] : gi % 3 === 1 ? [.6, .75, 1.2] : [1, .9, 1];
      const f = (1.2 + s[k + 3]) * (1.4 - rr / 8); PS.push(x, y, z, c[0] * f, c[1] * f, c[2] * f); }
    PS.mat.size = .9; const u = easeInOut(smooth(TL.atoms, TL.unique, t)); camera.position.set(0, 0, lerp(55, 42, u)); camera.lookAt(0, 0, -40); camera.fov = 50;
    hud.push(() => { two(null, 'EN TODO EL UNIVERSO OBSERVABLE', 'HAY UNOS…', win(t, TL.atoms, TL.more), 300); power('10', '80', W / 2, 1300, 230, win(t, TL.atoms + .9, TL.more), copperGrad(200, 880, 1300, .5)); txt('ÁTOMOS', W / 2, 1460, 46, { font: 'Montserrat', weight: 800, alpha: win(t, TL.atoms + 1.1, TL.more), spacing: 8 });
      two(null, 'HAY MUCHÍSIMAS MÁS PARTIDAS', 'QUE ÁTOMOS EN EL UNIVERSO', smooth(TL.more, TL.more + .3, t), 300); const ma = smooth(TL.more + .3, TL.more + .7, t);
      power('10', '120', W * .3, 1250, 150, ma, copperGrad(100, 500, 1250, .5)); txt('>', W / 2, 1250, 140, { font: 'Montserrat', weight: 800, alpha: ma }); power('10', '80', W * .72, 1250, 150, ma, '#9fc8ff');
      txt('PARTIDAS', W * .3, 1360, 30, { spacing: 5, alpha: ma }); txt('ÁTOMOS', W * .72, 1360, 30, { spacing: 5, alpha: ma }); txt('¡40 ceros más!', W / 2, 1500, 44, { font: 'Montserrat', weight: 800, alpha: smooth(TL.more + 1.2, TL.more + 1.5, t), fill: '#ffd08a' }); });
  } else if (t < TL.machines) {
    // E · cada partida es única
    const lt = t - TL.unique; boardG.visible = true; setPos(MID); const g = .25 + .2 * Math.sin(t * 3); whiteM.emissive.setRGB(g * .4, g * .25, .05); keyL.intensity = 26;
    camera.position.set(lerp(6, 4, lt / 5), lerp(4, 3.2, lt / 5), lerp(6, 7, lt / 5)); camera.lookAt(0, .3, 0); camera.fov = 44;
    hud.push(() => { two(null, 'TRAS LA APERTURA,', 'CASI CADA PARTIDA ES…', smooth(.05, .3, lt), 300); stamp('ÚNICA EN LA HISTORIA', W / 2, 1580, smooth(1.6, 1.9, lt), -.06, '#ffd08a', 56); });
  } else if (t < TL.phone) {
    // F · Deep Blue vs Kaspárov, 1997
    const lt = t - TL.machines; boardG.visible = true; deep.visible = true; deep.position.set(0, 0, -7); setPos(MID); keyL.intensity = 20; scene.background = new THREE.Color(.03, .04, .08);
    const fall = smooth(TL.deep + 3, TL.deep + 3.8, t); const wk = pieces.find(p => p.k === 'k' && p.w && p.m.visible); if (wk) { wk.m.rotation.z = fall * 1.45; wk.m.position.x += fall * .3; wk.m.position.y += Math.sin(fall * Math.PI) * .1; }
    const u = easeInOut(smooth(TL.machines, TL.phone, t)); camera.position.set(lerp(3, 1.5, u), lerp(2.8, 2, u), lerp(8.5, 7, u)); camera.lookAt(0, lerp(1.6, 1.2, u), -2); camera.fov = 46; bloomS = .6;
    hud.push(() => { two(null, 'Y AUN ASÍ', 'LAS MÁQUINAS YA NOS GANAN', win(t, TL.machines, TL.deep), 300); two('1997 · DEEP BLUE (IBM)', 'DERROTÓ AL CAMPEÓN', 'GARRI KASPÁROV', smooth(TL.deep, TL.deep + .3, t), 300); });
    function label3() { const p = project(V3(0, 4.4, -7)); txt('DEEP BLUE · IBM', p.x, p.y - 30, 32, { font: 'Montserrat', weight: 800, alpha: smooth(TL.deep + .3, TL.deep + .7, t), fill: '#9fd8ff' }); }
  } else if (t < TL.brand) {
    // G · un programa en tu móvil
    const lt = t - TL.phone; boardG.visible = true; phone.visible = true; setPos(MID); const u = easeOut(smooth(0, .8, lt)); phone.position.set(0, lerp(-2, 2.2, u), 1.2); phone.rotation.set(-.15, Math.sin(t * .8) * .15, 0); keyL.intensity = 20;
    camera.position.set(0, 2.6, 7.5); camera.lookAt(0, 1.8, 0); camera.fov = 44; bloomS = .5;
    hud.push(() => { two(null, 'HOY, UN PROGRAMA EN TU MÓVIL', 'JUEGA MEJOR QUE NINGÚN HUMANO', smooth(.05, .3, lt), 300); });
  } else {
    // H · marca: rey caído
    const lt = t - TL.brand; boardG.visible = true; setPos(MID); const wk = pieces.find(p => p.k === 'k' && p.w && p.m.visible); if (wk) { wk.m.rotation.z = 1.45; wk.m.position.x += .3; } keyL.intensity = 18; hemi.intensity = .6;
    camera.position.set(3.5 + Math.sin(lt * .2), 1.6, 3.6); camera.lookAt(1.5, .3, 2); fade = Math.min(.45, lt * .4);
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  PS.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (t < TL.brand) { const gr = g2.createLinearGradient(0, 0, 0, 600); gr.addColorStop(0, 'rgba(8,10,16,.75)'); gr.addColorStop(.6, 'rgba(8,10,16,.5)'); gr.addColorStop(1, 'rgba(8,10,16,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, W, 600); }
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, bloom: bloomS, expo });
}
function renderCover() { renderFrame(1.8); coverText('MÁS PARTIDAS', 'QUE ÁTOMOS', 'el número imposible del ajedrez'); }
window.renderCover = () => { renderCover(); return true; };
window.OBJ = { PS, scene };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
