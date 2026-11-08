// NO LO SABÍAS — "¿Cómo borran el ruido unos auriculares?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final. Unidades: cm (esquema, no a escala).
// Cancelación activa de ruido (ANC): micrófonos exteriores (feed-forward) → procesador → señal en antifase por el altavoz → interferencia destructiva.
// Eficaz sobre todo en graves (< ~1 kHz) y ruidos estables; voces y agudos se atenúan menos (sobre todo los atenúan las almohadillas).
// Paul Lueg, patente US 2.043.416 (1936), «Process of silencing sound oscillations». Primeros cascos ANC prácticos: aviación (años 50–80).
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, easeIn, rng, V3, g2, camera, Particles, txt, copperGrad, project, callout, titleHUD, fract, camOrbit, bigStat, bar, drawBrand, coverText, finish, arrowXY, noise1 } from '../../lib/core.js';

const scene = new THREE.Scene(); scene.background = new THREE.Color(0x05070d);
const hemi = new THREE.HemisphereLight(0xc8d8ff, 0x302820, 1.3); scene.add(hemi);
const key = new THREE.DirectionalLight(0xffe8d0, 2.4); key.position.set(30, 40, 60); scene.add(key);
const fillL = new THREE.DirectionalLight(0x8ab0ff, 1.1); fillL.position.set(-50, 10, 30); scene.add(fillL);
const rim = new THREE.DirectionalLight(0xffa070, 1.4); rim.position.set(0, 20, -60); scene.add(rim);
const M = (c, r = .5, m = .3, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: e });
const box = (w, h, d, mat, x = 0, y = 0, z = 0, parent = scene) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; };
function xray(col, k = 1) { return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  uniforms: { uCol: { value: col.clone() }, uA: { value: k } },
  vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform vec3 uCol; uniform float uA; varying vec3 vN; varying vec3 vV; void main(){ float f=pow(clamp(1.-abs(dot(vN,vV)),0.,1.),2.); gl_FragColor=vec4(uCol*(f*.8+.05)*uA,(f*.7+.04)*uA); }` }); }

// ==========================================================================
// AURICULARES (genéricos, sin marca)
// ==========================================================================
const hp = new THREE.Group(); scene.add(hp);
const shellMat = new THREE.MeshStandardMaterial({ color: 0x6a707c, roughness: .55, metalness: .05, transparent: true }); const padMat = M(0x18191c, .9, 0); const accent = M(0xd08848, .3, .9);
const band = new THREE.Mesh(new THREE.TorusGeometry(10, .75, 16, 64, Math.PI), shellMat); band.scale.set(1, 1.15, 1.6); band.position.y = 3; hp.add(band);
const bandPad = new THREE.Mesh(new THREE.TorusGeometry(10, .5, 12, 48, Math.PI * .5), padMat); bandPad.rotation.z = Math.PI * .25; bandPad.scale.set(.95, 1.1, 1.6); bandPad.position.y = 3; hp.add(bandPad);
const cups = []; for (const s of [-1, 1]) { const g = new THREE.Group(); g.position.set(s * 10.6, -1, 0); hp.add(g);
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.9, 2.6, 48), shellMat); shell.rotation.z = Math.PI / 2; g.add(shell); const shX = new THREE.Mesh(shell.geometry, xray(new THREE.Color(.5, .75, 1.3), 1)); shX.rotation.z = Math.PI / 2; shX.visible = false; g.add(shX);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(4.75, .14, 8, 64), accent); ring.rotation.y = Math.PI / 2; ring.position.x = s * 1.3; g.add(ring);
  const pad = new THREE.Mesh(new THREE.TorusGeometry(3.6, 1.15, 16, 48), padMat); pad.rotation.y = Math.PI / 2; pad.position.x = -s * 1.9; g.add(pad);
  const mics = []; for (const [y, z] of [[2.6, 2.2], [-2.6, -2.2]]) { const m = new THREE.Mesh(new THREE.SphereGeometry(.32, 16, 10), new THREE.MeshBasicMaterial({ color: 0x000000 })); m.position.set(s * 1.32, y, z); g.add(m); mics.push(m); }
  const drv = new THREE.Mesh(new THREE.CylinderGeometry(3, 1, .9, 32, 1, true), M(0x9aa0aa, .5, .3)); drv.rotation.z = -s * Math.PI / 2; drv.position.x = -s * .4; drv.visible = false; g.add(drv);
  const magnet = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, .8, 24), M(0x505660, .4, .7)); magnet.rotation.z = Math.PI / 2; magnet.position.x = s * .4; magnet.visible = false; g.add(magnet);
  const chip = box(.3, 1.6, 1.6, M(0x1e5a3a, .6, .2, 0x041a0c), s * .9, 0, -2.6, g); chip.visible = false; const traceMat = new THREE.MeshBasicMaterial({ color: 0x000000 }); const tr = box(.05, .08, 4, traceMat, s * .95, 1.2, -.4, g); tr.visible = false;
  cups.push({ g, s, shell, shX, mics, drv, magnet, chip, tr, traceMat }); }
function hpXray(k) { shellMat.opacity = 1 - k * .88; cups.forEach(c => { c.shX.visible = k > 0; c.shX.material.uniforms.uA.value = k; c.drv.visible = c.magnet.visible = c.chip.visible = c.tr.visible = k > .05; }); padMat.transparent = true; padMat.opacity = 1 - k * .8; }
const cupW = (i, x, y, z) => V3(x, y, z).applyMatrix4(cups[i].g.matrixWorld);

// ==========================================================================
// AVIÓN (pilotos)
// ==========================================================================
const AP = V3(0, 600, 0); const ap = new THREE.Group(); ap.position.copy(AP); scene.add(ap);
const planeMat = M(0xd8dce2, .45, .4); { const f = new THREE.Mesh(new THREE.CapsuleGeometry(1.6, 13, 8, 24), planeMat); f.rotation.z = Math.PI / 2; ap.add(f);
  box(4, .25, 22, planeMat, 1.2, 0, 0, ap); box(1.8, .2, 7, planeMat, -7.4, .4, 0, ap); const fin = box(2, 3.2, .2, planeMat, -7.4, 1.9, 0, ap); fin.rotation.z = -.25;
  const cock = new THREE.Mesh(new THREE.SphereGeometry(1.25, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x2a4a6a, roughness: .1, metalness: .6, emissive: 0x0a1a2a })); cock.scale.set(1.8, 1, 1); cock.position.set(3.5, 1.1, 0); ap.add(cock); }
const prop = new THREE.Group(); prop.position.set(8.4, 0, 0); ap.add(prop); for (let k = 0; k < 3; k++) { const b = box(.15, 4.4, .5, M(0x2a2a2e, .5, .4), 0, 0, 0, prop); b.geometry.translate(0, 2.2, 0); b.rotation.x = k * 2.094; }
const propDisc = new THREE.Mesh(new THREE.CircleGeometry(4.4, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .08, side: THREE.DoubleSide })); propDisc.rotation.y = Math.PI / 2; propDisc.position.x = 8.45; ap.add(propDisc);

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
const P = new Particles(16000, { size: .4, seed: 29 }); scene.add(P.obj);
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
const NOISE = [[-38, 12, 8], [34, -6, 14], [-20, -20, -26], [26, 22, -18], [6, -30, 22], [-30, 30, 4]];
function noiseWaves(t, amp, shield = 0, n = 480) { if (amp <= 0) return; const s = P.seed; let o = 0; for (const [sx, sy, sz] of NOISE) { const src = V3(sx, sy, sz).multiplyScalar(1.1); const d = src.length();
  for (let w = 0; w < 4; w++) { const r = fract(t * .55 + w / 4 + o * .13) * d; for (let i = 0; i < n; i++) { const q = ((i + w * 400 + o * 1700) % P.n) * 4; const th = s[q] * 6.283, ph = Math.acos(2 * s[q + 1] - 1); const dir = V3(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th));
    const p = src.clone().addScaledVector(dir, r); const near = p.length(); const k = shield > 0 ? 1 - shield * smooth(16, 8, near) : 1; const f = amp * k * (1 - r / d) * 1.8; if (f <= .02) continue; P.push(p.x, p.y, p.z, 2 * f, .7 * f, .25 * f); } } o++; } }
function antiWaves(t, amp) { if (amp <= 0) return; const s = P.seed; cups.forEach((c, ci) => { for (let w = 0; w < 3; w++) { const r = 1 + fract(t * 1.4 + w / 3) * 7; for (let i = 0; i < 260; i++) { const q = ((i + 9000 + ci * 900 + w * 300) % P.n) * 4; const th = s[q] * 6.283, ph = Math.acos(2 * s[q + 1] - 1);
  const p = c.g.position.clone().add(V3(c.s * Math.abs(Math.sin(ph) * Math.cos(th)) * r, Math.cos(ph) * r, Math.sin(ph) * Math.sin(th) * r)); const f = amp * (1 - (r - 1) / 7); P.push(p.x, p.y, p.z, .35 * f, .8 * f, 2 * f); } } }); }
function lattice(t, amp, A = 1.4, still = 0) { if (amp <= 0) return; const k = .35, w = 7; for (let ix = 0; ix < 60; ix++) for (let iy = 0; iy < 9; iy++) for (let iz = 0; iz < 4; iz++) { const x0 = -30 + ix + (iy % 2) * .5, y0 = -6 + iy * 1.5, z0 = -3 + iz * 2;
  const dx = A * (1 - still) * Math.sin(k * x0 - w * t); const dens = 1 - (1 - still) * Math.cos(k * x0 - w * t) * .8; const f = amp * lerp(.35, 1.1, dens / 1.8); P.push(x0 + dx, y0 + 300, z0, 1.1 * f, 1.8 * f, 3.2 * f); } }
function waveHUD(y, amp, freq, phase, col, a, lw = 6, fn = null) { if (a <= .01) return; g2.save(); g2.globalAlpha = a; g2.strokeStyle = col; g2.lineWidth = lw; g2.shadowColor = col; g2.shadowBlur = 16; g2.beginPath();
  for (let x = 110; x <= 970; x += 4) { const u = (x - 110) / 860; const v = fn ? fn(u) : Math.sin(u * freq * 6.283 + phase); x === 110 ? g2.moveTo(x, y - v * amp) : g2.lineTo(x, y - v * amp); } g2.stroke(); g2.restore(); }
const jag = (u, t) => Math.sin(u * 6.283 * 9 + t * 30) * .5 + Math.sin(u * 6.283 * 17 - t * 41) * .3 + Math.sin(u * 6.283 * 4 + t * 12) * .35;
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .1; camera.far = 5000;
  let bloomS = .8, flash = 0, ca = .0013, fade = 0, grain = .035, expo = 1.15, dim = 0;
  P.begin(); P.mat.size = .4; hp.visible = true; ap.visible = false; hpXray(0); hp.rotation.set(0, 0, 0); hp.position.set(0, 0, 0); hp.updateMatrixWorld(true);
  cups.forEach(c => { c.mics.forEach(m => m.material.color.setRGB(.05, .05, .05)); c.traceMat.color.setRGB(0, 0, 0); c.drv.position.x = -c.s * .4; });
  for (const c of ['how', 'wave', 'mics', 'chip', 'inverse', 'speaker', 'silence', 'bass', 'curious', 'pilots', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];
  if (t < TL.wave) {
    // A · borran el ruido… añadiendo más ruido
    hp.rotation.y = .5 + t * .12; hp.updateMatrixWorld(true); camOrbit(V3(0, 0, 0), lerp(100, 80, easeOut(t / TL.wave)), .2, .12, 38); P.mat.size = .8; bloomS = 1;
    const ak = smooth(TL.adding - .1, TL.adding + .6, t); noiseWaves(t, 1, ak * .9); antiWaves(t, ak);
    hud.push(() => { titleHUD('ESTOS AURICULARES', 'BORRAN EL RUIDO…', smooth(.05, .3, t) * (1 - smooth(TL.adding - .1, TL.adding + .1, t)), 300);
      titleHUD('…AÑADIENDO', 'MÁS RUIDO', smooth(TL.adding, TL.adding + .3, t) * (1 - smooth(TL.how - .1, TL.how + .1, t)), 300); titleHUD('¿CÓMO ES', 'POSIBLE?', smooth(TL.how, TL.how + .3, t), 300); });
  } else if (t < TL.mics) {
    // B · el sonido es una onda: el aire se comprime y se estira
    hp.visible = false; const lt = t - TL.wave; camOrbit(V3(0, 300, 0), lerp(76, 70, lt / 4.5), .15 + lt * .02, .12, 38); P.mat.size = .7; bloomS = .9; lattice(t, 1);
    hud.push(() => { titleHUD('EL SONIDO', 'ES UNA ONDA', smooth(0, .3, lt) * (1 - smooth(TL.squeeze - TL.wave - .1, TL.squeeze - TL.wave + .1, lt)), 300);
      titleHUD('EL AIRE SE COMPRIME', 'Y SE ESTIRA', smooth(TL.squeeze - TL.wave, TL.squeeze - TL.wave + .3, lt) * (1 - smooth(TL.hundreds - TL.wave - .1, TL.hundreds - TL.wave + .1, lt)), 300);
      titleHUD('CIENTOS DE VECES', 'POR SEGUNDO', smooth(TL.hundreds - TL.wave, TL.hundreds - TL.wave + .3, lt), 300);
      waveHUD(1300, 70, 2.2, -t * 7 * 1, '#7fb8ff', smooth(.6, 1.2, lt), 5, u => Math.sin((-30 + u * 60) * .35 - t * 7));
      const cx = W / 2; txt('COMPRESIÓN', 250, 1430, 24, { spacing: 5, alpha: smooth(TL.squeeze - TL.wave + .3, TL.squeeze - TL.wave + .7, lt) * .8, fill: '#9fd0ff' }); txt('EXPANSIÓN', 830, 1430, 24, { spacing: 5, alpha: smooth(TL.squeeze - TL.wave + .5, TL.squeeze - TL.wave + .9, lt) * .8, fill: '#9fd0ff' }); });
  } else if (t < TL.inverse) {
    // C/D · micrófonos exteriores y chip
    const lt = t - TL.mics; hpXray(smooth(TL.mics + .2, TL.mics + 1, t)); hp.rotation.y = lerp(-.9, -1.1, lt / 6.8); hp.updateMatrixWorld(true);
    const lk = smooth(TL.listen - .2, TL.listen + .3, t), ck = smooth(TL.chip - .2, TL.chip + .4, t); cups.forEach(c => { c.mics.forEach(m => m.material.color.setRGB(.2 + .5 * lk, .5 + .5 * lk, .9 + .3 * lk)); c.traceMat.color.setRGB(ck * .3, ck * (.9 + .3 * Math.sin(t * 30)), ck * .5); });
    const tg = cups[1].g.getWorldPosition(V3(0, 0, 0)); camOrbit(tg.clone().add(V3(0, lerp(.5, 0, ck), 0)), lerp(30, 20, easeInOut(smooth(TL.mics, TL.chip + .5, t))), lerp(-.6, -.35, ck) + Math.PI * .0 + 1.2, .15, 38); bloomS = .9; expo = 1.25;
    const s = P.seed; for (let w = 0; w < 5; w++) { const xx = lerp(30, 2, fract(t * .7 + w / 5)); for (let i = 0; i < 260; i++) { const q = ((i + w * 300) % P.n) * 4; const y = (s[q] - .5) * 16, z = (s[q + 1] - .5) * 16; const p = cupW(1, xx + (y * y + z * z) * .02, y, z); const f = (1 - smooth(4, 2, xx)) * .9; P.push(p.x, p.y, p.z, 2 * f, .7 * f, .25 * f); } } P.mat.size = .3;
    if (ck > 0) for (let i = 0; i < 300; i++) { const q = ((i + 6000) % P.n) * 4; const u = fract(s[q] + t * 1.5); const p = cupW(1, 1.0, lerp(1.2, 0, u * 0) + (s[q + 1] - .5) * .1, lerp(1.6, -2.4, u)); P.push(p.x, p.y, p.z, 1.6 * ck, 1.2 * ck, .3 * ck); }
    hud.push(() => { titleHUD('POR FUERA DE CADA AURICULAR', 'MICRÓFONOS DIMINUTOS', smooth(0, .3, lt) * (1 - smooth(TL.listen - TL.mics - .1, TL.listen - TL.mics + .1, lt)), 300);
      titleHUD('QUE ESCUCHAN', 'EL RUIDO QUE LLEGA', smooth(TL.listen - TL.mics, TL.listen - TL.mics + .3, lt) * (1 - smooth(TL.chip - TL.mics - .1, TL.chip - TL.mics + .1, lt)), 300);
      callout(cupW(1, 1.35, 2.6, 2.2), 80, -200, 'MICRÓFONO', null, smooth(.6, 1, lt) * (1 - smooth(TL.chip - TL.mics - .2, TL.chip - TL.mics, lt)), '#9fd0ff');
      titleHUD('UN CHIP', 'ANALIZA ESA ONDA', smooth(TL.chip - TL.mics, TL.chip - TL.mics + .3, lt) * (1 - smooth(TL.fast - TL.mics - .1, TL.fast - TL.mics + .1, lt)), 300);
      callout(cupW(1, .9, 0, -2.6), -80, 220, 'PROCESADOR', null, smooth(TL.chip - TL.mics + .3, TL.chip - TL.mics + .7, lt), '#7dffa0');
      bigStat('EN UNA FRACCIÓN DE', '< 1 ms', 330, smooth(TL.fast - TL.mics, TL.fast - TL.mics + .3, lt), clamp((t - TL.fast) / 1.5)); });
  } else if (t < TL.bass) {
    // E/F · onda al revés; el altavoz la reproduce; se anulan → silencio
    const lt = t - TL.inverse; const sk = smooth(TL.speaker - .3, TL.speaker + .5, t); hpXray(.9 * sk); hp.rotation.y = -1.2 + lt * .03; hp.updateMatrixWorld(true);
    cups.forEach(c => { c.drv.position.x = -c.s * (.4 + Math.sin(t * 40) * .12 * sk * (1 - smooth(TL.silence, TL.silence + 1, t))); });
    const sil = smooth(TL.cancel - .2, TL.silence + .3, t); camOrbit(V3(0, 5, 0), lerp(100, 88, lt / 9.5), -1.2 + .9 + lt * .03, .12, 38); dim = (1 - sk) * .55 + sk * .25; bloomS = 1;
    noiseWaves(t, .8 * sk, sil * .95); antiWaves(t, sk * (1 - sil * .6)); P.mat.size = .45;
    hud.push(() => { const L = (a, b) => smooth(TL[a], TL[a] + .3, t) * (b ? 1 - smooth(TL[b] - .1, TL[b] + .1, t) : 1);
      titleHUD('FABRICA OTRA', 'EXACTAMENTE AL REVÉS', L('inverse', 'speaker'), 300); titleHUD('EL ALTAVOZ LA REPRODUCE', 'JUNTO A TU MÚSICA', L('speaker', 'join'), 300);
      titleHUD('CUANDO LAS DOS ONDAS SE JUNTAN', 'SE ANULAN', L('join', 'silence'), 300); bigStat('', 'SILENCIO', 380, L('silence'), clamp((t - TL.silence) / 1));
      const ga = (1 - smooth(TL.silence - .2, TL.silence + .2, t)); const ph = -t * 6;
      const na = L('inverse') * ga, ia = smooth(TL.inverse + .5, TL.inverse + .9, t) * ga, sa = smooth(TL.join, TL.join + .4, t) * ga, flat = smooth(TL.join + .3, TL.cancel + .2, t);
      waveHUD(980, 90, 2, ph, '#ff8a3a', na, 6); waveHUD(1180, 90, 2, ph + Math.PI, '#5aa8ff', ia, 6);
      txt('RUIDO', 120, 860, 24, { align: 'left', spacing: 5, alpha: na * .85, fill: '#ffb27a' }); txt('ANTIRRUIDO', 120, 1060, 24, { align: 'left', spacing: 5, alpha: ia * .85, fill: '#9fd0ff' });
      if (t > TL.push - .2 && t < TL.speaker) { const a = smooth(TL.push, TL.push + .3, t); const xp = 110 + 860 * ((((Math.PI / 2 - ph) / 6.283) % .5 + .5) % .5) * 1; txt('EMPUJA', 300, 860, 30, { font: 'Montserrat', weight: 800, alpha: a, fill: '#ffb27a' }); txt('TIRA', 300, 1290, 30, { font: 'Montserrat', weight: 800, alpha: smooth(TL.pull, TL.pull + .3, t), fill: '#9fd0ff' });
        arrowXY(300, 900, 300, 940, a, '#ffb27a', 6); arrowXY(300, 1250, 300, 1220, smooth(TL.pull, TL.pull + .3, t), '#9fd0ff', 6); }
      waveHUD(1380, 90 * (1 - flat), 2, ph, '#ffffff', sa, 6); txt('SUMA', 120, 1270, 24, { align: 'left', spacing: 5, alpha: sa * .85 }); });
  } else if (t < TL.curious) {
    // G · funciona mejor con graves constantes; voces y agudos se cuelan
    const lt = t - TL.bass; hp.rotation.y = .4 + lt * .05; hp.updateMatrixWorld(true); camOrbit(V3(0, 0, 0), 100, .2, .1, 38); dim = .55; noiseWaves(t, .4, .7); antiWaves(t, .5);
    hud.push(() => { const vk = smooth(TL.voices - .1, TL.voices + .2, t); titleHUD('FUNCIONA MEJOR CON', 'GRAVES Y CONSTANTES', smooth(0, .3, lt) * (1 - vk), 300); titleHUD('LAS VOCES Y LOS AGUDOS', 'SE CUELAN UN POCO MÁS', smooth(TL.voices, TL.voices + .3, t), 300);
      const ph = -t * 4; const ga = smooth(.2, .6, lt); txt('GRAVES · MOTOR DE AVIÓN', W / 2, 640, 26, { spacing: 4, alpha: ga * .85, fill: '#ffb27a' });
      waveHUD(800, 100, 1.2, ph, '#ff8a3a', ga * .35, 5); const g1 = smooth(TL.plane - .5, TL.plane + 1, t); waveHUD(800, 100 * (1 - .92 * g1), 1.2, ph, '#ffffff', ga, 6); txt('−30 dB', 930, 700, 34, { align: 'right', font: 'Montserrat', weight: 800, alpha: g1 * ga, fill: '#7dffa0' });
      txt('AGUDOS · VOCES', W / 2, 1060, 26, { spacing: 4, alpha: vk * .85, fill: '#9fd0ff' }); waveHUD(1230, 90, 1, 0, '#5aa8ff', vk * .35, 4, u => jag(u, t)); const g2k = smooth(TL.leak - .3, TL.leak + .8, t); waveHUD(1230, 90 * (1 - .35 * g2k), 1, 0, '#ffffff', vk, 5, u => jag(u, t));
      txt('SE CUELAN', 930, 1120, 34, { align: 'right', font: 'Montserrat', weight: 800, alpha: g2k * vk, fill: '#ff6a5a' }); });
  } else if (t < TL.brand) {
    // H · patentada en 1936; los primeros en llevarla: los pilotos
    const lt = t - TL.curious; const pk = smooth(TL.pilots - .4, TL.pilots + .1, t);
    if (pk < .5) { hp.rotation.y = .3 + lt * .15; hp.updateMatrixWorld(true); camOrbit(V3(0, 0, 0), lerp(100, 90, lt / 6), .2, .15, 38); dim = .45; scene.background.setRGB(.05, .04, .03); }
    else { hp.visible = false; ap.visible = true; const lp = t - TL.pilots; prop.rotation.x = t * 40; ap.rotation.set(Math.sin(t * .8) * .05, 0, Math.sin(t * .6) * .03); scene.background.setRGB(.25, .38, .6); hemi.intensity = 1.8;
      camOrbit(AP.clone().add(V3(1, 0, 0)), lerp(42, 34, lp / 4.7), .75 + lp * .05, .18, 38); expo = 1.1;
      const s = P.seed; for (let i = 0; i < 1400; i++) { const q = (i % P.n) * 4; const u = fract(s[q] - t * .35); if (i < 500) P.push(AP.x + lerp(80, -80, u), AP.y + (s[q + 1] - .5) * 50 - 8, AP.z + (s[q + 2] - .5) * 60 - 25, .22, .24, .27); } P.mat.size = 5;
      for (let w = 0; w < 4; w++) { const r = 2 + fract(t * 1.6 + w / 4) * 14; for (let i = 0; i < 220; i++) { const q = ((i + 8000 + w * 300) % P.n) * 4; const th = s[q] * 6.283, ph = Math.acos(2 * s[q + 1] - 1); const f = (1 - r / 16) * .1;
        P.push(AP.x + 8.4 + Math.sin(ph) * Math.cos(th) * r, AP.y + Math.cos(ph) * r, AP.z + Math.sin(ph) * Math.sin(th) * r, 2 * f, .7 * f, .25 * f); } } }
    hud.push(() => { titleHUD('Y LO MÁS', 'CURIOSO…', smooth(0, .3, lt) * (1 - smooth(TL.y1936 - TL.curious - .1, TL.y1936 - TL.curious + .1, lt)), 300);
      const ya = smooth(TL.y1936 - TL.curious, TL.y1936 - TL.curious + .3, lt) * (1 - smooth(TL.pilots - TL.curious - .3, TL.pilots - TL.curious - .1, lt)); bigStat('LA IDEA SE PATENTÓ EN', '1936', 330, ya, clamp((t - TL.y1936) / 1.5));
      txt('Paul Lueg · patente US 2.043.416', W / 2, 430, 30, { weight: 300, alpha: ya * smooth(TL.decades - .5, TL.decades, t) });
      titleHUD('LOS PRIMEROS EN LLEVARLA', 'FUERON LOS PILOTOS', smooth(TL.pilots - TL.curious, TL.pilots - TL.curious + .3, lt) * (1 - smooth(TL.cockpit - TL.curious - .1, TL.cockpit - TL.curious + .1, lt)), 300);
      titleHUD('PARA SOPORTAR EL', 'ESTRUENDO DE LA CABINA', smooth(TL.cockpit - TL.curious, TL.cockpit - TL.curious + .3, lt), 300); });
  } else {
    // I · marca
    const lt = t - TL.brand; hp.rotation.y = .5 + lt * .2; hp.updateMatrixWorld(true); camOrbit(V3(0, 0, 0), 100 + lt * 3, .2, .12, 38); antiWaves(t, .5); expo = .9; fade = Math.min(.5, lt * .45); dim = smooth(0, .8, lt) * .6;
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  hemi.intensity = ap.visible ? 1.8 : 1.3; if (!ap.visible && !(t >= TL.curious && t < TL.brand)) scene.background.setRGB(.02, .027, .05);
  P.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (dim > 0) hud.unshift(() => { g2.save(); g2.globalAlpha = dim * .7; g2.fillStyle = '#02050b'; g2.fillRect(0, 0, W, H); g2.restore(); });
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
function renderCover() { renderFrame(TL.adding + 1.2); coverText('¿CÓMO BORRAN', 'EL RUIDO?', 'Añadiendo más ruido'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
