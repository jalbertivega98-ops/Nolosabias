// NO LO SABÍAS — "¿Cómo viaja el wifi por el aire?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final. 1 u = 10 cm (esquema).
// Banda de 2,4 GHz: λ = c/f ≈ 12,5 cm. Modulación QAM (amplitud + fase; 256-QAM = 8 bits/símbolo, 1024-QAM = 10). OFDM: cientos de subportadoras.
// Atenuación por paredes, agua y metal; 5 GHz se atenúa más. Hornos microondas ~2,45 GHz → interferencias en 2,4 GHz.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, easeIn, rng, V3, g2, camera, Particles, txt, copperGrad, project, callout, titleHUD, fract, camOrbit, bigStat, drawBrand, coverText, finish, arrowXY, noise1, shake } from '../../lib/core.js';

const scene = new THREE.Scene(); scene.background = new THREE.Color(0x05070d);
scene.add(new THREE.HemisphereLight(0xc8d8ff, 0x302820, 1.3));
const key = new THREE.DirectionalLight(0xffe8d0, 2.2); key.position.set(60, 120, 80); scene.add(key);
const fillL = new THREE.DirectionalLight(0x8ab0ff, .9); fillL.position.set(-80, 40, 40); scene.add(fillL);
const M = (c, r = .7, m = .1, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: e });
const box = (w, h, d, mat, x = 0, y = 0, z = 0, parent = scene) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; };
const cylY = (r, h, mat, x, y, z, parent = scene, seg = 20) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat); m.position.set(x, y, z); parent.add(m); return m; };

// ==========================================================================
// CASA en corte (maqueta): suelo, paredes, muebles, router, móvil, microondas
// ==========================================================================
const house = new THREE.Group(); scene.add(house);
const floorMat = M(0x3a3028, .85, 0), wallMat = M(0xd8d2c8, .9, 0), wallIn = M(0xc8c0b4, .9, 0);
box(100, 1, 70, floorMat, 0, -.5, 0, house);
box(100, 26, 1.5, wallMat, 0, 13, -35, house); box(1.5, 26, 70, wallMat, -50, 13, 0, house);
const WX = 2, WZ = 0; box(1.2, 26, 34, wallIn, WX, 13, -18, house); box(1.2, 26, 22, wallIn, WX, 13, 24, house); box(36, 26, 1.2, wallIn, -32, 13, WZ, house); box(20, 26, 1.2, wallIn, 40, 13, WZ, house);
// salón (x>2, z>0): sofá y mesa; cocina (x<2, z>0): encimera y microondas; despacho (x<2, z<0): estantería con router
const sofaMat = M(0x2a4a6a, .9, 0); box(30, 8, 10, sofaMat, 28, 4, 28, house); box(30, 10, 3, sofaMat, 28, 8, 33, house);
box(14, 1, 10, M(0x5a4030, .6, .1), 26, 7, 12, house); for (const [x, z] of [[20, 8], [32, 8], [20, 16], [32, 16]]) box(.8, 7, .8, M(0x3a2a20, .6, .1), x, 3.5, z, house);
box(30, 10, 10, M(0xe8e4dc, .5, .1), -32, 5, 28, house); box(30, 1, 11, M(0x404448, .4, .3), -32, 10.5, 28, house);
box(16, 1, 8, M(0x6a5040, .7, 0), -32, 12, -30, house); box(16, 1, 8, M(0x6a5040, .7, 0), -32, 20, -30, house); box(1, 22, 8, M(0x6a5040, .7, 0), -40, 11, -30, house); box(1, 22, 8, M(0x6a5040, .7, 0), -24, 11, -30, house);
box(20, 10, 12, M(0x3a3a40, .6, .2), 30, 5, -26, house); box(16, 10, 1, M(0x101418, .3, .5, 0x0a1a30), 30, 16, -31, house); // escritorio + monitor
// router
const ROUT = V3(-32, 14.6, -30); const router = new THREE.Group(); router.position.copy(ROUT); house.add(router);
const routMat = new THREE.MeshStandardMaterial({ color: 0xeceff2, roughness: .4, metalness: .1, transparent: true });
const rbody = box(9, 2.2, 6, routMat, 0, 0, 0, router); const leds = []; for (let i = 0; i < 4; i++) leds.push(box(.5, .3, .2, new THREE.MeshBasicMaterial({ color: 0x40ff90 }), -3 + i * 1.6, .2, 3.05, router));
const antMat = new THREE.MeshStandardMaterial({ color: 0x202226, roughness: .5, metalness: .2, transparent: true }); const ants = [-3, 0, 3].map((x, i) => { const g = new THREE.Group(); g.position.set(x, 1.1, -2.4); g.rotation.z = (i - 1) * .18; router.add(g); cylY(.35, 9, antMat, 0, 4.5, 0, g, 12); return g; });
const antCore = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 8.4, 6), M(0xd08848, .3, .9, 0x301000)); antCore.position.y = 4.5; ants[1].add(antCore); antCore.visible = false;
// móvil
const PHONE = V3(26, 7.8, 12); const phone = new THREE.Group(); phone.position.copy(PHONE); phone.rotation.set(-Math.PI / 2 + .25, 0, .4); house.add(phone);
box(4, 8, .4, M(0x16181c, .4, .5), 0, 0, 0, phone); const scrC = document.createElement('canvas'); scrC.width = 180; scrC.height = 360; const scrX = scrC.getContext('2d'); const scrT = new THREE.CanvasTexture(scrC); scrT.colorSpace = THREE.SRGBColorSpace;
const scr = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 7.4), new THREE.MeshBasicMaterial({ map: scrT, toneMapped: false })); scr.position.z = .21; phone.add(scr);
function drawScreen(t, mode) { const x = scrX; const gr = x.createLinearGradient(0, 0, 180, 360); gr.addColorStop(0, '#1d3a6a'); gr.addColorStop(1, '#6a2a4a'); x.fillStyle = gr; x.fillRect(0, 0, 180, 360);
  for (let i = 0; i < 6; i++) { x.fillStyle = `hsla(${(i * 50 + t * 40) % 360},70%,60%,.35)`; x.beginPath(); x.arc(90 + Math.sin(t * 1.3 + i) * 60, 180 + Math.cos(t * 1.1 + i * 2) * 120, 30 + i * 6, 0, 7); x.fill(); }
  x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(16, 330, 148, 6); x.fillStyle = '#ff5a4a'; x.fillRect(16, 330, 148 * (mode === 'buffer' ? .42 : (t * .03) % 1), 6);
  if (mode === 'buffer') { x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, 0, 180, 360); x.strokeStyle = '#fff'; x.lineWidth = 8; x.lineCap = 'round'; x.beginPath(); x.arc(90, 180, 26, t * 6, t * 6 + 4.2); x.stroke(); }
  scrT.needsUpdate = true; }
// microondas (cocina)
const MICRO = V3(-38, 15.5, 28); const micro = new THREE.Group(); micro.position.copy(MICRO); house.add(micro);
box(14, 9, 8, M(0xd0d2d6, .4, .4), 0, 0, 0, micro); const mwin = box(8, 6, .2, M(0x101010, .3, .2, 0x000000), -2, 0, 4.05, micro); box(2.5, 6, .3, M(0x2a2a2e, .5, .3), 4.8, 0, 4.1, micro);
const mlight = mwin.material;
const walls = [[WX, -35, WX, -1], [WX, 13, WX, 35], [-50, WZ, -14, WZ], [30, WZ, 50, WZ]];

// ==========================================================================
// TIMELINE
// ==========================================================================
const P = new Particles(16000, { size: .5, seed: 41 }); scene.add(P.obj);
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
const L = (t, a, b) => smooth(TL[a], TL[a] + .3, t) * (b ? 1 - smooth(TL[b] - .1, TL[b] + .1, t) : 1);
function wallsCrossed(p) { let n = 0; if ((p.x - WX) * (ROUT.x - WX) < 0 && !(p.z > -1 && p.z < 13)) n++; if ((p.z - WZ) * (ROUT.z - WZ) < 0 && !(p.x > -14 && p.x < 30)) n++; return n; }
// ondas esféricas desde el router (frentes de onda)
function waves(t, n, speed, col, amp, lossK = 0, R = 110, sd = 0, src = ROUT) { const s = P.seed; const NR = 6; for (let i = 0; i < n; i++) { const q = ((i + sd) % P.n) * 4; const ring = i % NR; const r = fract(t * speed + ring / NR) * R; const u = s[q] * 2 - 1, a = s[q + 1] * 6.283; const sq = Math.sqrt(1 - u * u);
    const p = V3(src.x + sq * Math.cos(a) * r, src.y + u * r * .5, src.z + sq * Math.sin(a) * r); if (p.y < .3 || p.y > 26 || p.x < -50 || p.x > 50 || p.z < -35 || p.z > 35) continue;
    const loss = Math.pow(lossK, wallsCrossed(p)); const f = amp * (1 - r / R) * (lossK ? loss : 1); if (f < .02) continue; P.push(p.x, p.y, p.z, col[0] * f, col[1] * f, col[2] * f); } }
const ICONS = ['▶', '✉', '♪', '■', '❤', '▶', '✉', '■'];

function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .1; camera.far = 3000;
  let bloomS = .7, flash = 0, ca = .0013, fade = 0, grain = .035, expo = 1.4, dim = 0;
  P.begin(); P.mat.size = 2.2; routMat.opacity = 1; antMat.opacity = 1; antCore.visible = false; mlight.emissive.setRGB(0, 0, 0); leds.forEach((l, i) => l.material.color.setRGB(.25, 1, .55 * (1 + Math.sin(t * 12 + i * 2)) / 2 + .2));
  let screenMode = 'play';
  for (const c of ['nocable', 'router', 'how', 'ofdm', 'why', 'curious', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];
  if (t < TL.router) {
    // A · la casa en corte: el wifi la atraviesa con ondas invisibles
    const vis = smooth(TL.invis - .2, TL.invis + .6, t) * (1 - smooth(TL.nocable + .2, TL.air, t) * .0); waves(t, 9000, .35, [.5, .9, 1.6], 1.4 + .6 * vis); P.mat.size = 3.2;
    camOrbit(V3(0, 4, 0), lerp(205, 185, t / TL.router), .55 + t * .03, .72 - t * .015, 38); bloomS = .9;
    hud.push(() => { titleHUD('AHORA MISMO TE ATRAVIESAN', 'VÍDEOS, FOTOS Y MENSAJES', smooth(.1, .4, t) * (1 - smooth(TL.invis - .1, TL.invis + .1, t)), 300); titleHUD('…Y NO', 'LOS VES', L(t, 'invis', 'nocable'), 300);
      titleHUD('TU WIFI NO VIAJA', 'POR CABLES', L(t, 'nocable', 'air'), 300); titleHUD('VIAJA POR EL AIRE', 'CON ONDAS INVISIBLES', L(t, 'air'), 300);
      const ia = smooth(.3, .8, t) * (1 - smooth(TL.router - .5, TL.router, t)); for (let i = 0; i < 8; i++) { const u = fract(t * .18 + i / 8); const p = project(ROUT.clone().lerp(PHONE, u).add(V3(Math.sin(i * 3) * 8, 6 + Math.sin(u * 3.14) * 10, Math.cos(i * 2) * 6))); txt(ICONS[i], p.x, p.y, 40, { alpha: ia * Math.sin(u * Math.PI), fill: '#cfe6ff', weight: 800 }); } });
  } else if (t < TL.how) {
    // B · la antena empuja electrones 2.400 millones de veces por segundo; onda de ~12 cm que atraviesa paredes
    const lt = t - TL.router; const xk = smooth(TL.router + .3, TL.router + 1.1, t) * (1 - smooth(TL.wave + .5, TL.wave + 1.2, t)); routMat.opacity = 1 - xk * .8; antMat.opacity = 1 - xk * .85; antCore.visible = xk > .05;
    router.updateMatrixWorld(true); const aw = ants[1].localToWorld(V3(0, 4.5, 0)); const wz = t >= TL.wave ? 1 : 0;
    camOrbit(aw.clone().lerp(V3(-2, 8, -8), wz), lerp(36, 150 - (t - TL.wave) * 3, wz), lerp(.4, .55, wz), lerp(.12, 1.0, wz), 38); bloomS = .9;
    const s = P.seed; const osc = Math.sin(t * 9); if (xk > .05) for (let i = 0; i < 260; i++) { const q = (i % P.n) * 4; const y = (s[q] - .5) * 7.6 + osc * 2.2; const p = ants[1].localToWorld(V3((s[q + 1] - .5) * .25, 4.5 + y, (s[q + 2] - .5) * .25)); P.push(p.x, p.y, p.z, .5 * xk, 1 * xk, 2.4 * xk); }
    if (xk > .05) for (let i = 0; i < 800; i++) { const q = ((i + 500) % P.n) * 4; const a = s[q] * 6.283; const r = 1 + fract(s[q + 1] - t * .9) * 10; const p = aw.clone().add(V3(Math.cos(a) * r, Math.sin(t * 9 - r * .9) * 2.5 * (s[q + 2] - .5), Math.sin(a) * r)); const f = .6 * xk * (1 - r / 11); P.push(p.x, p.y, p.z, .4 * f, .9 * f, 1.6 * f); }
    const wk = smooth(TL.wave - .2, TL.wave + .4, t); if (wk > 0) { // onda transversal hacia el salón, atravesando la pared
      const A = aw.clone(), B = PHONE.clone().add(V3(0, 6, 0)); const dir = B.clone().sub(A); const Lw = dir.length(); dir.normalize(); const up = V3(0, 1, 0); const lam = 12.5 / 10 * 10; // 12,5 cm → 1,25 u; mostramos λ ampliada ×10 en el dibujo
      for (let i = 0; i < 1500; i++) { const d = i / 1500 * Lw; const ph = d / lam * 6.283 - t * 8; const p = A.clone().addScaledVector(dir, d).addScaledVector(up, Math.sin(ph) * 2.2); const f = wk * .5 * (1 - d / Lw * .4); P.push(p.x, p.y, p.z, .5 * f, 1 * f, 1.8 * f); } waves(t, 3000, .35, [.4, .7, 1.3], .45 * wk, 0, 110, 3000); }
    P.mat.size = lerp(.35, 1.6, wz);
    hud.push(() => { titleHUD('DENTRO DEL ROUTER, UNA ANTENA', 'EMPUJA ELECTRONES', L(t, 'router', 'ghz'), 300);
      bigStat('ARRIBA Y ABAJO, CADA SEGUNDO', '2.400.000.000', 330, L(t, 'ghz', 'wave'), clamp((t - TL.ghz) / 1.5)); txt('veces · 2,4 GHz', W / 2, 440, 34, { weight: 300, alpha: L(t, 'ghz', 'wave') * smooth(TL.ghz + .4, TL.ghz + .8, t) });
      titleHUD('LANZA UNA ONDA DE', 'UNOS 12 CENTÍMETROS', L(t, 'wave'), 300); txt('…que atraviesa las paredes', W / 2, 440, 34, { weight: 300, alpha: L(t, 'cm') });
      const ra = L(t, 'cm'); if (ra > .01) { const x0 = 300, x1 = 780, y = 1560; g2.save(); g2.globalAlpha = ra; g2.strokeStyle = '#7fd4ff'; g2.lineWidth = 6; g2.shadowColor = '#7fd4ff'; g2.shadowBlur = 14; g2.beginPath(); for (let x = x0 - 120; x <= x1 + 120; x += 3) { const yy = y - Math.sin((x - x0) / (x1 - x0) * 6.283) * 60; x === x0 - 120 ? g2.moveTo(x, yy) : g2.lineTo(x, yy); } g2.stroke(); g2.shadowBlur = 0;
        g2.strokeStyle = '#fff'; g2.lineWidth = 2; g2.beginPath(); g2.moveTo(x0, y + 90); g2.lineTo(x1, y + 90); g2.moveTo(x0, y + 78); g2.lineTo(x0, y + 102); g2.moveTo(x1, y + 78); g2.lineTo(x1, y + 102); g2.stroke(); g2.restore(); txt('≈ 12,5 cm', W / 2, y + 130, 36, { font: 'Montserrat', weight: 800, alpha: ra }); } });
  } else if (t < TL.ofdm) {
    // C · modulación: amplitud y fase → códigos de varios bits (QAM)
    camOrbit(V3(-10, 8, -10), 180, .7, .6, 38); dim = .8; waves(t, 3000, .35, [.4, .7, 1.3], .4, 0);
    hud.push(() => { titleHUD('¿Y CÓMO LLEVA', 'UN VÍDEO DENTRO?', L(t, 'how', 'change'), 300); titleHUD('CAMBIANDO LA ONDA', '', L(t, 'change', 'amp'), 300); titleHUD('SU FUERZA…', '', L(t, 'amp', 'phase'), 300); titleHUD('…Y EL MOMENTO EN QUE', 'SUBE Y BAJA', L(t, 'phase', 'code'), 300);
      titleHUD('CADA CAMBIO ES', 'UN CÓDIGO', L(t, 'code', 'bits'), 300); titleHUD('CADA CÓDIGO VALE', 'VARIOS UNOS Y CEROS', L(t, 'bits', 'rate'), 300);
      // osciloscopio: símbolos con distinta amplitud y fase
      const SYM = [[1, 0], [.4, 0], [1, Math.PI], [.7, Math.PI / 2], [.4, -Math.PI / 2], [1, Math.PI / 4], [.7, -3 * Math.PI / 4], [.4, Math.PI]]; const sa = smooth(TL.how + .3, TL.change, t);
      const useA = smooth(TL.amp - .2, TL.amp + .2, t), useP = smooth(TL.phase - .2, TL.phase + .2, t); const x0 = 90, x1 = 990, y0 = 640, nS = 8;
      if (sa > .01) { g2.save(); g2.globalAlpha = sa; g2.fillStyle = 'rgba(8,14,26,.75)'; g2.fillRect(60, 480, 960, 330); g2.strokeStyle = 'rgba(255,255,255,.18)'; g2.lineWidth = 1; for (let k = 0; k <= nS; k++) { const x = lerp(x0, x1, k / nS); g2.beginPath(); g2.moveTo(x, 500); g2.lineTo(x, 790); g2.stroke(); }
        g2.strokeStyle = '#7fd4ff'; g2.lineWidth = 5; g2.shadowColor = '#7fd4ff'; g2.shadowBlur = 14; g2.beginPath(); const sc = (t * .6) % 1;
        for (let x = x0; x <= x1; x += 2) { const u = (x - x0) / (x1 - x0) * nS; const k = (Math.floor(u + sc * nS)) % nS; const [a, ph] = SYM[k]; const A = lerp(1, a, useA), PH = lerp(0, ph, useP); const yy = y0 - Math.sin(u * 6.283 * 2 + PH) * 120 * A; x === x0 ? g2.moveTo(x, yy) : g2.lineTo(x, yy); } g2.stroke(); g2.restore();
        txt(useP > .5 ? 'FUERZA + MOMENTO' : useA > .5 ? 'FUERZA (AMPLITUD)' : 'ONDA PORTADORA', 80, 460, 24, { align: 'left', spacing: 4, weight: 700, alpha: sa * .85, fill: '#9fe0ff' }); }
      // constelación: 16 puntos = 4 bits (en la realidad, hasta 1024 puntos = 10 bits)
      const ca2 = smooth(TL.code - .2, TL.code + .3, t); if (ca2 > .01) { const cx = W / 2, cy = 1180, sp = 92; const cur = Math.floor(t * 2.2) % 16; g2.save(); g2.globalAlpha = ca2; g2.strokeStyle = 'rgba(255,255,255,.35)'; g2.lineWidth = 2; g2.beginPath(); g2.moveTo(cx - 2.3 * sp, cy); g2.lineTo(cx + 2.3 * sp, cy); g2.moveTo(cx, cy - 2.3 * sp); g2.lineTo(cx, cy + 2.3 * sp); g2.stroke(); g2.restore();
        for (let k = 0; k < 16; k++) { const i = k % 4, j = Math.floor(k / 4); const x = cx + (i - 1.5) * sp, y = cy + (j - 1.5) * sp; const on = k === cur; g2.save(); g2.globalAlpha = ca2 * (on ? 1 : .55); g2.fillStyle = on ? '#ffe2c0' : '#7fd4ff'; g2.shadowColor = g2.fillStyle; g2.shadowBlur = on ? 26 : 8; g2.beginPath(); g2.arc(x, y, on ? 16 : 10, 0, 7); g2.fill(); g2.restore();
          const bits = ((k ^ (k >> 1)) >>> 0).toString(2).padStart(4, '0'); if (on || L(t, 'bits') > .5) txt(bits, x, y + 34, on ? 30 : 20, { font: 'Montserrat', weight: 800, alpha: ca2 * (on ? 1 : .6 * L(t, 'bits')), fill: on ? '#ffe2c0' : '#cfe6ff' }); } }
      bigStat('ASÍ CABEN', 'CIENTOS DE MILLONES', 330, L(t, 'rate'), clamp((t - TL.rate) / 1.5)); txt('de bits cada segundo', W / 2, 440, 34, { weight: 300, alpha: L(t, 'rate') }); });
  } else if (t < TL.why) {
    // D · cientos de frecuencias a la vez (OFDM), como carriles; el móvil descifra y reconstruye el vídeo
    const lt = t - TL.ofdm; const pk = smooth(TL.phone - .3, TL.phone + .8, t); router.updateMatrixWorld(true); const A = ants[1].localToWorld(V3(0, 7, 0)); const B = PHONE.clone().add(V3(0, 1, 0));
    const s = P.seed; const NL = 24; for (let i = 0; i < 7000; i++) { const q = (i % P.n) * 4; const lane = i % NL; const u = fract(s[q] + t * .35); const off = (lane - NL / 2) * 1.1; const p = A.clone().lerp(B, u); p.y += off * (1 - u) + Math.sin(u * 40 - t * 10 + lane) * .25 * (1 - u); p.x += off * .3 * (1 - u);
      const hue = lane / NL; const c = new THREE.Color().setHSL(.5 + hue * .35, .9, .6); const f = .45 * Math.sin(u * Math.PI) ** .3; P.push(p.x, p.y, p.z, c.r * f, c.g * f, c.b * f); }
    camOrbit(V3(-3, 15, -9).lerp(PHONE, pk * .8), lerp(lerp(120, 105, lt / 5), 34, easeInOut(pk)), lerp(-.6, .4, pk), lerp(.4, .5, pk), 38); P.mat.size = lerp(1.6, .5, pk); bloomS = .9;
    hud.push(() => { titleHUD('LA INFORMACIÓN SE REPARTE EN', 'CIENTOS DE FRECUENCIAS', L(t, 'ofdm', 'lanes'), 300); titleHUD('COMO LOS CARRILES', 'DE UNA AUTOPISTA', L(t, 'lanes', 'phone'), 300);
      titleHUD('TU MÓVIL ESCUCHA, DESCIFRA', 'Y RECONSTRUYE EL VÍDEO', L(t, 'phone'), 300);
      const sa = smooth(TL.ofdm + .3, TL.ofdm + .8, t) * (1 - smooth(TL.phone - .2, TL.phone + .2, t)); if (sa > .01) { const x0 = 100, x1 = 980, y0 = 1560; const N = 40; g2.save(); g2.globalAlpha = sa; g2.fillStyle = 'rgba(8,14,26,.7)'; g2.fillRect(70, 1330, 940, 280);
        for (let k = 0; k < N; k++) { const c = lerp(x0, x1, (k + .5) / N); const h = 150 + 40 * Math.sin(k * 1.7 + t * 4); const col = new THREE.Color().setHSL(.5 + k / N * .35, .9, .6); g2.strokeStyle = '#' + col.getHexString(); g2.lineWidth = 3; g2.beginPath(); for (let x = c - 40; x <= c + 40; x += 2) { const v = (x - c) / 11; const yy = y0 - h * (Math.abs(v) < 1e-3 ? 1 : Math.abs(Math.sin(Math.PI * v) / (Math.PI * v))); x === c - 40 ? g2.moveTo(x, yy) : g2.lineTo(x, yy); } g2.stroke(); } g2.restore();
        txt('FRECUENCIA →', x1, y0 + 30, 22, { align: 'right', spacing: 4, alpha: sa * .7 }); } });
  } else if (t < TL.curious) {
    // E · por qué va peor lejos: paredes, agua y metal; 5 GHz se rinde antes
    const lt = t - TL.why; const fk = smooth(TL.five - .2, TL.five + .5, t); waves(t, 7000, .3, [.5, .9, 1.6], 1.1, lerp(.35, .3, fk), lerp(110, 70, fk)); if (fk > 0) waves(t, 4000, .5, [1.4, .7, 1.4], 1.1 * fk, .15, 50, 8000);
    camOrbit(V3(0, 0, 0), lerp(170, 160, lt / 7.6), .0 + lt * .01, 1.25, 38); bloomS = .9;
    hud.push(() => { titleHUD('¿Y POR QUÉ VA PEOR EN', 'LA OTRA PUNTA DE LA CASA?', L(t, 'why', 'walls'), 300); titleHUD('PAREDES, AGUA Y METAL', 'SE COMEN LA ONDA', L(t, 'walls', 'five'), 300); titleHUD('LA DE 5 GHz, MÁS RÁPIDA,', 'SE RINDE ANTES', L(t, 'five'), 300);
      const la = smooth(TL.five, TL.five + .4, t); txt('● 2,4 GHz', 120, 1560, 30, { align: 'left', weight: 800, alpha: la, fill: '#8fd0ff' }); txt('● 5 GHz', 120, 1610, 30, { align: 'left', weight: 800, alpha: la, fill: '#ff9aff' });
      const pr = project(ROUT); callout(ROUT.clone().add(V3(0, 3, 0)), -60, -170, 'ROUTER', null, smooth(TL.why + .2, TL.why + .6, t), '#9fd0ff');
      const wa = L(t, 'walls', 'five'); if (wa > .01) { const pw = project(V3(WX, 26, 6)); txt('PARED', pw.x + 60, pw.y - 30, 26, { spacing: 4, weight: 700, alpha: wa, fill: '#ffc27a' }); } });
  } else if (t < TL.brand) {
    // F · el microondas usa casi la misma frecuencia: al calentar la leche, se corta el vídeo
    const lt = t - TL.curious; const mk = smooth(TL.milk - .2, TL.milk + .3, t); mlight.emissive.setRGB(1.2 * mk, .8 * mk, .3 * mk); screenMode = t > TL.cut ? 'buffer' : 'play';
    waves(t, 5000, .35, [.5, .9, 1.6], .9 * (1 - mk * .5), .45, 110); if (mk > 0) waves(t * 1.4, 5000, .5, [1.6, .8, .3], 1.0 * mk, .55, 90, 7000, MICRO);
    const pz = easeInOut(smooth(TL.cut - .4, TL.cut + .3, t)); camOrbit(V3(-24, 10, 14).lerp(PHONE, pz), lerp(lerp(150, 130, lt / 8), 26, pz), lerp(.15, .3, pz), lerp(.55, .6, pz), 38); bloomS = .9; P.mat.size = lerp(2.2, .6, pz);
    hud.push(() => { titleHUD('Y LO MÁS CURIOSO:', 'EL WIFI Y TU MICROONDAS…', smooth(0, .3, lt) * (1 - smooth(TL.micro - TL.curious - .1, TL.micro - TL.curious + .1, lt)), 300);
      titleHUD('…USAN CASI LA', 'MISMA FRECUENCIA', L(t, 'micro', 'milk'), 300); const ba = L(t, 'micro', 'milk'); txt('WIFI ≈ 2,40–2,48 GHz', W / 2, 440, 32, { weight: 700, alpha: ba, fill: '#9fd0ff' }); txt('MICROONDAS ≈ 2,45 GHz', W / 2, 490, 32, { weight: 700, alpha: ba, fill: '#ffc27a' });
      titleHUD('AL CALENTAR LA LECHE…', '', L(t, 'milk', 'cut'), 300); titleHUD('', 'SE CORTA EL VÍDEO', L(t, 'cut'), 300);
      callout(MICRO.clone().add(V3(0, 5, 0)), 120, -240, 'MICROONDAS', null, smooth(TL.micro, TL.micro + .4, t) * (1 - smooth(TL.cut - .5, TL.cut - .2, t)), '#ffc27a'); });
  } else {
    // G · marca
    const lt = t - TL.brand; waves(t, 5000, .35, [.5, .9, 1.6], .8, 0); camOrbit(V3(0, 4, 0), 200 + lt * 5, .55 + lt * .04, .7, 38); expo = .9; fade = Math.min(.5, lt * .45); dim = smooth(0, .8, lt) * .6;
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  drawScreen(t, screenMode);
  P.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (dim > 0) hud.unshift(() => { g2.save(); g2.globalAlpha = dim * .7; g2.fillStyle = '#02050b'; g2.fillRect(0, 0, W, H); g2.restore(); });
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
function renderCover() { renderFrame(2.0); coverText('¿CÓMO VIAJA', 'EL WIFI?', 'Ondas invisibles que atraviesan tu casa'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
