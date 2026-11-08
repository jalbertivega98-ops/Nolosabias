// NO LO SABÍAS — "¿Cómo funciona un código QR?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final.
// QR real (versión 5, corrección H ≈ 30 %) generado con segno a partir del texto «NO LO SABIAS - El mundo tiene mas historias»; se carga de qr.json.
// Patrones de posición con proporción 1:1:3:1:1 (ISO/IEC 18004). Corrección Reed-Solomon (también en CD). Inventado por Denso Wave (Toyota) en 1994; patente sin ejercer.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, easeIn, rng, V3, g2, camera, Particles, txt, copperGrad, project, callout, titleHUD, fract, camOrbit, bigStat, drawBrand, coverText, finish, noise1 } from '../../lib/core.js';

const QR = await (await fetch('qr.json')).json(); const N = QR.length; const HALF = (N - 1) / 2; // 37
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0b0f16);
const hemi = new THREE.HemisphereLight(0xe8eeff, 0x302820, 1.4); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2e0, 2.2); sun.position.set(60, 120, 160); scene.add(sun);
const fillL = new THREE.DirectionalLight(0x8ab0ff, .5); fillL.position.set(-100, -40, 80); scene.add(fillL);
const M = (c, r = .6, m = .2, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: e });
const box = (w, h, d, mat, x = 0, y = 0, z = 0, parent = scene) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; };
const GREEN = '#5dff8a', dummy = new THREE.Object3D();
const mx = i => i - HALF, my = j => HALF - j; // columna i, fila j → plano XY
const inFinder = (i, j) => (i < 8 && j < 8) || (i > N - 9 && j < 8) || (i < 8 && j > N - 9);
const inTear = (i, j) => i >= 19 && j >= 19;
const inLogo = (i, j) => Math.abs(i - HALF) <= 4 && Math.abs(j - HALF) <= 4;
const isEC = (i, j) => !inFinder(i, j) && ((i * 7 + j * 13) % 10 < 4); // ilustrativo: ~40 % de módulos de corrección

// ==========================================================================
// TARJETA QR: módulos negros como cubos sobre papel; esquina rasgable
// ==========================================================================
const card = new THREE.Group(); scene.add(card); const paper = M(0xffffff, .9, 0, 0x1a1a1a); const Q = 4; const E = HALF + .5 + Q;
box(2 * E, E + 1 - .5 + 0, .6, paper, 0, (E + .5) / 2 - 0, -.31, card).scale.y = 1; // parte superior (y > 0.5)
const topCard = card.children[0]; topCard.geometry = new THREE.BoxGeometry(2 * E, E + .5, .6); topCard.position.set(0, (E - .5) / 2, -.31);
box(E + .5, E - .5, .6, paper, (-E + .5) / 2, -(E + .5) / 2, -.31, card); // abajo-izquierda
const piece = new THREE.Group(); card.add(piece); box(E - .5, E - .5, .6, paper, (E + .5) / 2, -(E + .5) / 2, -.31, piece);
const cells = []; for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (QR[j][i]) cells.push([i, j]);
const modMat = M(0x111316, .5, .1); const modGeo = new THREE.BoxGeometry(.96, .96, .35);
const mods = new THREE.InstancedMesh(modGeo, modMat, cells.length); card.add(mods); const tearMods = new THREE.InstancedMesh(modGeo, modMat, cells.length); piece.add(tearMods);
mods.instanceColor = null;
const colBase = new THREE.Color(0x111316); for (let k = 0; k < cells.length; k++) { mods.setColorAt(k, colBase); }
const stainM = new THREE.Mesh(new THREE.CircleGeometry(11.5, 48), new THREE.MeshBasicMaterial({ color: 0x5a3a1a, transparent: true, opacity: .5, depthWrite: false })); stainM.position.set(mx(26), my(25), .45); card.add(stainM); stainM.visible = false;
const logo = new THREE.Group(); card.add(logo); { box(8.6, 8.6, .4, paper, 0, 0, .05, logo); const ring = new THREE.Mesh(new THREE.TorusGeometry(3, .45, 12, 48), M(0xc8783c, .3, .8)); ring.position.z = .4; logo.add(ring); const dot = new THREE.Mesh(new THREE.SphereGeometry(.8, 20, 14), M(0xe3a372, .3, .8, 0x301000)); dot.position.z = .5; logo.add(dot); }
// layout por fotograma: tearK (0 pegado → 1 arrancado), missK (módulos ausentes), logoK
function layoutQR(t, o = {}) { const lift = o.lift || 0; let a = 0, b = 0;
  for (let k = 0; k < cells.length; k++) { const [i, j] = cells[k]; const torn = inTear(i, j); const logoHide = o.logoK > .5 && inLogo(i, j);
    let s = 1, z = .175; if (o.miss && o.miss(i, j)) s = 0; if (logoHide) s = 0;
    if (o.pop) { const p = o.pop(i, j); z += p; }
    dummy.position.set(mx(i), my(j), z + lift); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(Math.max(s, 1e-4)); dummy.updateMatrix();
    if (torn && o.tearAsPiece) { tearMods.setMatrixAt(b++, dummy.matrix); } else mods.setMatrixAt(a++, dummy.matrix);
    if (o.color) mods.setColorAt(a - 1, o.color(i, j)); }
  mods.count = a; tearMods.count = b; mods.instanceMatrix.needsUpdate = true; tearMods.instanceMatrix.needsUpdate = true; if (mods.instanceColor) mods.instanceColor.needsUpdate = true; }

// ==========================================================================
// CD girando · FÁBRICA con cajas etiquetadas
// ==========================================================================
const CDZ = V3(20000, 0, 0); const cdG = new THREE.Group(); cdG.position.copy(CDZ); scene.add(cdG);
const cd = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, .25, 96, 1), new THREE.MeshStandardMaterial({ map: (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); const g = x.createConicGradient(0, 256, 256); ['#c8d0e0', '#ff9ad0', '#9ad8ff', '#d0ffb0', '#fff0a0', '#c8d0e0', '#a0c0ff', '#ffb0e0', '#c8d0e0'].forEach((cc, k, a) => g.addColorStop(k / (a.length - 1), cc)); x.fillStyle = g; x.fillRect(0, 0, 512, 512); const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx; })(), metalness: .5, roughness: .2, emissive: 0x202428 })); cd.rotation.x = Math.PI / 2; cdG.add(cd);
const hole = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, .3, 40), M(0x0b0f16, 1, 0)); hole.rotation.x = Math.PI / 2; cdG.add(hole);
const qrTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 360; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 360, 360); const s = 360 / (N + 8); x.fillStyle = '#111'; for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (QR[j][i]) x.fillRect((i + 4) * s, (j + 4) * s, s + .5, s + .5); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const FZ = V3(-20000, 0, 0); const fac = new THREE.Group(); fac.position.copy(FZ); scene.add(fac);
const fFloor = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), M(0x4a4e56, .9, 0)); fFloor.rotation.x = -Math.PI / 2; fac.add(fFloor);
box(260, 2, 14, M(0x2a2e34, .6, .4), 0, 8, 0, fac); for (let i = -6; i <= 6; i++) box(1.2, 8, 12, M(0x606670, .5, .6), i * 20, 4, 0, fac);
const boxes = []; for (let k = 0; k < 9; k++) { const g = new THREE.Group(); fac.add(g); box(10, 8, 10, M(0xb08a5a, .9, 0), 0, 0, 0, g); const lab = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshStandardMaterial({ map: qrTex, roughness: .8 })); lab.position.set(0, .5, 5.01); g.add(lab); const part = new THREE.Mesh(new THREE.TorusGeometry(2.2, .8, 12, 24), M(0x9aa0a8, .3, .9)); part.position.set(0, 5.2, 0); part.rotation.x = Math.PI / 2; g.add(part); boxes.push(g); }

// ==========================================================================
// TIMELINE
// ==========================================================================
const P = new Particles(12000, { size: .5, seed: 43 }); scene.add(P.obj);
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
const L = (t, a, b) => smooth(TL[a], TL[a] + .3, t) * (b ? 1 - smooth(TL[b] - .1, TL[b] + .1, t) : 1);
function show(o) { card.visible = !!o.card; cdG.visible = !!o.cd; fac.visible = !!o.fac; }
const W3 = (i, j, z = .5) => card.localToWorld(V3(mx(i), my(j), z));
function viewfinder(a, col = GREEN) { if (a < .01) return; const c = [W3(-4.5, -4.5), W3(N + 3.5, -4.5), W3(N + 3.5, N + 3.5), W3(-4.5, N + 3.5)].map(project); g2.save(); g2.globalAlpha = a; g2.strokeStyle = col; g2.lineWidth = 8; g2.lineCap = 'round';
  for (let k = 0; k < 4; k++) { const p = c[k], pn = c[(k + 1) % 4], pp = c[(k + 3) % 4]; const L1 = .14; g2.beginPath(); g2.moveTo(p.x + (pn.x - p.x) * L1, p.y + (pn.y - p.y) * L1); g2.lineTo(p.x, p.y); g2.lineTo(p.x + (pp.x - p.x) * L1, p.y + (pp.y - p.y) * L1); g2.stroke(); } g2.restore(); }
function finderBoxes(a, t) { if (a < .01) return; g2.save(); g2.globalAlpha = a; g2.strokeStyle = '#e3a372'; g2.lineWidth = 6; g2.shadowColor = '#e3a372'; g2.shadowBlur = 20;
  for (const [i0, j0] of [[0, 0], [N - 7, 0], [0, N - 7]]) { const q = [W3(i0 - .9, j0 - .9), W3(i0 + 6.9, j0 - .9), W3(i0 + 6.9, j0 + 6.9), W3(i0 - .9, j0 + 6.9)].map(project); g2.beginPath(); q.forEach((p, k) => k ? g2.lineTo(p.x, p.y) : g2.moveTo(p.x, p.y)); g2.closePath(); g2.stroke(); } g2.restore(); }
function scanLine(t, a, from, to) { if (a < .01) return; const u = fract(t * .6); const p = project(card.localToWorld(V3(0, lerp(from, to, u), .6))); const l = project(card.localToWorld(V3(-E, lerp(from, to, u), .6))), r = project(card.localToWorld(V3(E, lerp(from, to, u), .6)));
  g2.save(); g2.globalAlpha = a * .9; g2.strokeStyle = GREEN; g2.lineWidth = 6; g2.shadowColor = GREEN; g2.shadowBlur = 24; g2.beginPath(); g2.moveTo(l.x, l.y); g2.lineTo(r.x, r.y); g2.stroke(); g2.restore(); }
function checkmark(a, y = 1480) { if (a < .01) return; g2.save(); g2.globalAlpha = a; g2.fillStyle = 'rgba(30,200,100,.9)'; g2.beginPath(); g2.arc(W / 2, y, 70, 0, 7); g2.fill(); g2.strokeStyle = '#fff'; g2.lineWidth = 14; g2.lineCap = 'round'; g2.beginPath(); g2.moveTo(W / 2 - 32, y + 2); g2.lineTo(W / 2 - 8, y + 26); g2.lineTo(W / 2 + 34, y - 24); g2.stroke(); g2.restore(); }

function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .1; camera.far = 5000;
  let bloomS = .5, flash = 0, ca = .001, fade = 0, grain = .03, expo = 1.05, dim = 0;
  P.begin(); P.mat.size = .6; show({}); stainM.visible = false; hemi.intensity = 1.4; card.rotation.set(0, 0, 0); card.position.set(0, 0, 0); piece.position.set(0, 0, 0); piece.rotation.set(0, 0, 0); logo.visible = false;
  for (const c of ['how', 'where', 'grid', 'broken', 'logo', 'curious', 'brand']) flash = Math.max(flash, flashAt(t, TL[c], .28, .2));
  const hud = [];
  if (t < TL.how) {
    // A · le falta casi un tercio… y funciona
    show({ card: true }); const tk = easeIn(smooth(.6, 1.6, t)); piece.position.set(tk * 40, -tk * 55, tk * 6); piece.rotation.set(tk * .4, tk * .6, -tk * .9);
    layoutQR(t, { tearAsPiece: true }); camOrbit(V3(0, 0, 0), lerp(118, 112, t / TL.how), .18 - t * .02, .1, 38); expo = 1.1;
    hud.push(() => { titleHUD('A ESTE CÓDIGO LE FALTA', 'CASI UN TERCIO…', smooth(.1, .4, t) * (1 - smooth(TL.works - .1, TL.works + .1, t)), 300); titleHUD('…Y AUN ASÍ', 'FUNCIONA', L(t, 'works'), 300);
      viewfinder(smooth(TL.works - .6, TL.works - .2, t)); scanLine(t, smooth(TL.works - .6, TL.works - .2, t) * (1 - smooth(TL.works + .2, TL.works + .4, t)), E - 4, -E + 4); checkmark(smooth(TL.works + .2, TL.works + .5, t)); });
  } else if (t < TL.where) {
    // B · los tres cuadrados de las esquinas · proporción 1:1:3:1:1
    show({ card: true }); const lt = t - TL.how; layoutQR(t, { pop: (i, j) => inFinder(i, j) ? 1.2 * smooth(TL.finders, TL.finders + .6, t) : 0 });
    const zr = easeInOut(smooth(TL.ratio - .3, TL.ratio + .6, t)) * (1 - easeInOut(smooth(TL.chance + .3, TL.where - .1, t)));
    camOrbit(V3(lerp(0, mx(3), zr), lerp(0, my(3) - 3, zr), 0), lerp(lerp(112, 104, lt / 11), 58, zr), .12, .08, 38); expo = 1.1;
    hud.push(() => { titleHUD('¿CÓMO LO LEE', 'TU MÓVIL?', L(t, 'how', 'finders'), 300); titleHUD('PRIMERO BUSCA LOS TRES', 'CUADRADOS DE LAS ESQUINAS', L(t, 'finders', 'same'), 300); titleHUD('SIEMPRE IGUALES:', 'UNA PROPORCIÓN ÚNICA', L(t, 'same', 'ratio'), 300);
      titleHUD('CASI NUNCA APARECE', 'POR CASUALIDAD', L(t, 'chance'), 300); finderBoxes(smooth(TL.finders + .3, TL.finders + .7, t) * (1 - zr), t);
      const ra = smooth(TL.ratio, TL.ratio + .4, t) * (1 - smooth(TL.chance + .2, TL.chance + .5, t)); if (ra > .01) { const y = my(3); const l = project(card.localToWorld(V3(mx(-.5), y, .8))), r = project(card.localToWorld(V3(mx(6.5), y, .8)));
        g2.save(); g2.globalAlpha = ra; g2.strokeStyle = GREEN; g2.lineWidth = 6; g2.shadowColor = GREEN; g2.shadowBlur = 20; g2.beginPath(); g2.moveTo(l.x - 60, l.y); g2.lineTo(r.x + 60, r.y); g2.stroke(); g2.restore();
        g2.save(); g2.globalAlpha = ra * .8; g2.fillStyle = '#0b0f16'; g2.fillRect(0, 1520, W, 230); g2.restore(); const seg = [1, 1, 3, 1, 1]; let x = 0; const u = 100; seg.forEach((s, k) => { const x0 = 190 + x * u, x1 = 190 + (x + s) * u; txt(String(s), (x0 + x1) / 2, 1700, 80, { font: 'Montserrat', weight: 800, alpha: ra * smooth(TL.ratio + k * .55, TL.ratio + k * .55 + .2, t), fill: k % 2 ? '#ffffff' : '#e3a372' });
          g2.save(); g2.globalAlpha = ra * smooth(TL.ratio + k * .55, TL.ratio + k * .55 + .2, t); g2.fillStyle = k % 2 ? '#f4f2ec' : '#111316'; g2.strokeStyle = '#e3a372'; g2.lineWidth = 3; g2.fillRect(x0 + 3, 1560, x1 - x0 - 6, 50); g2.strokeRect(x0 + 3, 1560, x1 - x0 - 6, 50); g2.restore(); x += s; }); } });
  } else if (t < TL.grid) {
    // C · dónde está, cuánto girado y desde qué ángulo
    show({ card: true }); const lt = t - TL.where; layoutQR(t, {}); const rk = easeInOut(smooth(TL.rotated - .4, TL.rotated + .6, t)), ak = easeInOut(smooth(TL.angle - .3, TL.angle + .7, t));
    card.rotation.set(-ak * .75, ak * .35, rk * .55); card.position.set(lerp(0, 0, rk), 0, 0);
    camOrbit(V3(0, 0, 0), lerp(118, 122, lt / 4.6), .05, .05, 38); expo = 1.1;
    hud.push(() => { titleHUD('CON ELLOS, EL MÓVIL SABE', 'DÓNDE ESTÁ', L(t, 'where', 'rotated'), 300); titleHUD('CUÁNTO ESTÁ', 'GIRADO', L(t, 'rotated', 'angle'), 300); titleHUD('Y DESDE QUÉ ÁNGULO', 'LO MIRAS', L(t, 'angle'), 300);
      const c = [[3, 3], [N - 4, 3], [3, N - 4]].map(([i, j]) => project(W3(i, j, 1))); const a = smooth(TL.where + .2, TL.where + .6, t); g2.save(); g2.globalAlpha = a; g2.strokeStyle = GREEN; g2.lineWidth = 6; g2.setLineDash([18, 12]);
      g2.beginPath(); g2.moveTo(c[1].x, c[1].y); g2.lineTo(c[0].x, c[0].y); g2.lineTo(c[2].x, c[2].y); g2.stroke(); g2.setLineDash([]); g2.fillStyle = GREEN; c.forEach(p => { g2.beginPath(); g2.arc(p.x, p.y, 16, 0, 7); g2.fill(); }); g2.restore();
      txt(Math.round(rk * 31) + '°', W / 2, 1500, 70, { font: 'Montserrat', weight: 800, alpha: L(t, 'rotated') * .95, fill: GREEN }); });
  } else if (t < TL.broken) {
    // D · cuadrícula → unos y ceros → bytes → letras
    show({ card: true }); const lt = t - TL.grid; layoutQR(t, {}); const zr = easeInOut(smooth(TL.bits - .5, TL.bits + .6, t)) * (1 - easeInOut(smooth(TL.uses - .2, TL.uses + .6, t)));
    const ZI = 24.5, ZJ = 12; camOrbit(V3(lerp(0, mx(ZI), zr), lerp(0, my(ZJ), zr), 0), lerp(112, 44, zr), .04, .04, 38); expo = 1.1;
    hud.push(() => { titleHUD('LUEGO DIVIDE EL RESTO', 'EN UNA CUADRÍCULA', L(t, 'grid', 'bits'), 300); titleHUD('NEGRO = 1', 'BLANCO = 0', L(t, 'bits', 'bytes'), 300); titleHUD('DE OCHO EN OCHO', 'FORMAN LETRAS', L(t, 'bytes', 'uses'), 300); titleHUD('UNA WEB · UN MENÚ', 'UN PAGO', L(t, 'uses'), 300);
      const ga = smooth(TL.grid, TL.grid + .5, t) * (1 - smooth(TL.uses, TL.uses + .4, t)); if (ga > .01) { g2.save(); g2.globalAlpha = ga * .55; g2.strokeStyle = '#4aa0ff'; g2.lineWidth = 1.5; for (let k = 0; k <= N; k++) { const a = project(card.localToWorld(V3(mx(k) - .5, my(0) + .5, .6))), b = project(card.localToWorld(V3(mx(k) - .5, my(N - 1) - .5, .6))); g2.beginPath(); g2.moveTo(a.x, a.y); g2.lineTo(b.x, b.y); g2.stroke();
        const c = project(card.localToWorld(V3(mx(0) - .5, my(k) + .5, .6))), d = project(card.localToWorld(V3(mx(N - 1) + .5, my(k) + .5, .6))); g2.beginPath(); g2.moveTo(c.x, c.y); g2.lineTo(d.x, d.y); g2.stroke(); } g2.restore(); }
      const da = smooth(TL.bits + .3, TL.bits + .8, t) * (1 - smooth(TL.uses - .3, TL.uses, t)); if (da > .01) for (let j = ZJ - 4; j <= ZJ + 4; j++) for (let i = ZI - 5; i <= ZI + 5; i++) { if (i < 0 || i >= N) continue; const v = QR[j][i]; const p = project(W3(i, j, v ? .9 : .4)); const inB = j === ZJ && i >= 21 && i < 29; const ba = smooth(TL.bytes, TL.bytes + .3, t);
        if (inB && ba > .01) { g2.save(); g2.globalAlpha = da * ba; g2.strokeStyle = '#e3a372'; g2.lineWidth = 5; g2.strokeRect(p.x - 52, p.y - 52, 104, 104); g2.restore(); }
        txt(v ? '1' : '0', p.x, p.y + 18, 54, { font: 'Montserrat', weight: 800, alpha: da * (inB ? 1 : .75 - .4 * ba), fill: v ? '#e3a372' : '#1a2230' }); }
      const by = QR[ZJ].slice(21, 29).join(''); const ch = String.fromCharCode(parseInt(by, 2)); const la = smooth(TL.letters, TL.letters + .3, t) * (1 - smooth(TL.uses - .3, TL.uses, t));
      txt(by + '  →  ' + (/[A-Za-z0-9]/.test(ch) ? ch : 'N'), W / 2, 1500, 56, { font: 'Montserrat', weight: 800, alpha: la, fill: '#ffffff' });
      const msg = 'NO LO SABIAS - El mundo tiene mas historias'; const ua = L(t, 'uses'); if (ua > .01) { const n = Math.floor(clamp((t - TL.uses) / 1.6) * msg.length); txt(msg.slice(0, n), W / 2, 1500, 40, { weight: 700, alpha: ua, fill: GREEN }); } });
  } else if (t < TL.logo) {
    // E · roto o manchado → información de sobra (Reed-Solomon, CD) → reconstruye hasta 30 %
    const lt = t - TL.broken; const cdOn = t > TL.cd - .1 && t < TL.rebuild - .1;
    if (cdOn) { show({ cd: true }); cd.rotation.y = t * 4; hole.rotation.y = t * 4; camOrbit(CDZ.clone(), 46, .3, .45, 38); expo = 1.2; bloomS = .7;
      hud.push(() => { titleHUD('LA MISMA QUE', 'USABAN LOS CD', 1, 300); }); }
    else { show({ card: true }); const rb = smooth(TL.rebuild + .2, TL.thirty + .6, t); const r = rng(9);
      const stain = (i, j) => { if (inFinder(i, j)) return false; const d = Math.hypot(i - 26, j - 25) + noise1(i * .7 + j * 1.3) * 4; const hole2 = d < 10.5; if (!hole2) return false; const ord = fract(Math.sin(i * 12.9898 + j * 78.233) * 43758.5); return ord > rb; };
      const ecC = new THREE.Color(0xc8783c), base = new THREE.Color(0x111316); const ec = smooth(TL.extra + .4, TL.extra + 1, t) * (1 - smooth(TL.rebuild, TL.rebuild + .5, t));
      layoutQR(t, { miss: t > TL.broken + .2 ? stain : null, color: (i, j) => isEC(i, j) && ec > .5 ? ecC : base, pop: (i, j) => (rb > 0 && rb < 1 && Math.hypot(i - 26, j - 25) < 11 && fract(Math.sin(i * 12.9898 + j * 78.233) * 43758.5) < rb && fract(Math.sin(i * 12.9898 + j * 78.233) * 43758.5) > rb - .12) ? 2 : 0 });
      stainM.visible = t > TL.broken + .2; stainM.material.opacity = .4 * (1 - rb) * smooth(TL.broken + .2, TL.broken + .5, t);
      camOrbit(V3(0, 0, 0), lerp(112, 106, lt / 12), .1, .06, 38); expo = 1.1;
      hud.push(() => { titleHUD('¿Y SI UNA PARTE ESTÁ', 'ROTA O MANCHADA?', L(t, 'broken', 'extra'), 300); titleHUD('AÑADE INFORMACIÓN DE SOBRA', 'CALCULADA CON MATEMÁTICAS', L(t, 'extra', 'rs'), 300); titleHUD('CORRECCIÓN DE ERRORES', 'REED-SOLOMON', L(t, 'rs', 'cd'), 300);
        titleHUD('EL MÓVIL PUEDE RECONSTRUIR', 'LO QUE FALTA', L(t, 'rebuild', 'logo'), 300); bigStat('', 'HASTA 30 %', 1480, L(t, 'thirty'), clamp((t - TL.thirty) / 1.3));
        txt('en cobre: datos de corrección', W / 2, 1500, 32, { weight: 300, alpha: ec * (1 - smooth(TL.rs + 1, TL.rs + 1.4, t)) }); }); }
  } else if (t < TL.curious) {
    // F · logo en medio… y siguen funcionando
    show({ card: true }); const lt = t - TL.logo; logo.visible = true; const lk = easeOut(smooth(TL.logo + .1, TL.logo + .8, t)); logo.position.z = lerp(30, .2, lk); logo.rotation.z = (1 - lk) * 2; layoutQR(t, { logoK: lk });
    camOrbit(V3(0, 0, 0), lerp(110, 104, lt / 3), .12, .06, 38); expo = 1.1;
    hud.push(() => { titleHUD('POR ESO HAY CÓDIGOS', 'CON UN LOGO EN MEDIO…', L(t, 'logo', 'still'), 300); titleHUD('…Y SIGUEN', 'FUNCIONANDO', L(t, 'still'), 300);
      viewfinder(smooth(TL.still - .6, TL.still - .2, t)); scanLine(t, smooth(TL.still - .6, TL.still - .2, t) * (1 - smooth(TL.still + .2, TL.still + .4, t)), E - 4, -E + 4); checkmark(smooth(TL.still + .2, TL.still + .5, t)); });
  } else if (t < TL.brand) {
    // G · 1994, Japón: piezas de coche en una fábrica; y no cobró por usarlo
    show({ fac: true }); scene.background.setRGB(.12, .14, .18); hemi.intensity = 2.2; const lt = t - TL.curious; boxes.forEach((b, k) => { b.position.set(((k * 26 + t * 9) % 234) - 117, 13, 0); b.rotation.y = 0; });
    camOrbit(FZ.clone().add(V3(0, 13, 0)), lerp(110, 95, lt / 9.8), .5 - lt * .03, .2, 38); expo = 1.15;
    hud.push(() => { titleHUD('Y LO MÁS', 'CURIOSO', L(t, 'curious', 'year'), 300); bigStat('', '1994 · JAPÓN', 600, L(t, 'year', 'free'), clamp((t - TL.year) / 1.2));
      titleHUD('UNA EMPRESA DE PIEZAS DE COCHE', 'PARA SEGUIR LOS RECAMBIOS', L(t, 'denso', 'free'), 300); titleHUD('Y DECIDIÓ NO COBRAR', 'A NADIE POR USARLO', L(t, 'free'), 300); bigStat('', 'GRATIS', 600, L(t, 'free'), clamp((t - TL.free) / 1.2)); });
  } else {
    // H · marca
    show({ card: true }); const lt = t - TL.brand; logo.visible = true; layoutQR(t, { logoK: 1 }); camOrbit(V3(0, 0, 0), 110 + lt * 20, .12 + lt * .03, .06, 38); expo = .9; dim = smooth(0, .8, lt) * .6;
    hud.push(() => drawBrand(lt - .3)); fade = smooth(TL.end - .6, TL.end, t) * .3;
  }
  if (t >= TL.how && !(t >= TL.curious && t < TL.brand)) scene.background.setHex(0x0b0f16);
  if (t < TL.how) scene.background.setHex(0x0b0f16);
  P.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); scene.updateMatrixWorld();
  if (dim > 0) hud.unshift(() => { g2.save(); g2.globalAlpha = dim * .7; g2.fillStyle = '#02050b'; g2.fillRect(0, 0, W, H); g2.restore(); });
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
function renderCover() { renderFrame(TL.works + .9); coverText('¿POR QUÉ SIGUE', 'FUNCIONANDO?', 'Un QR roto que tu móvil lee igual'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
