// NO LO SABÍAS — "¿Qué tiene de especial la luz de un láser?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final. Esquema, no a escala.
// Emisión estimulada (Einstein, 1917): un fotón provoca la emisión de otro idéntico (misma frecuencia, fase, dirección y polarización).
// Cavidad óptica: medio activo entre un espejo total y otro parcial. Láser lunar: retrorreflectores Apolo 11, 14 y 15; la Luna se aleja ~3,8 cm/año.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, easeIn, rng, V3, g2, camera, Particles, txt, copperGrad, project, callout, titleHUD, fract, camOrbit, bigStat, drawBrand, coverText, finish, arrowXY, noise1, shake } from '../../lib/core.js';

const scene = new THREE.Scene(); scene.background = new THREE.Color(0x03050a);
scene.add(new THREE.HemisphereLight(0xc8d8ff, 0x202020, 1.1));
const sun = new THREE.DirectionalLight(0xfff2e0, 2.6); sun.position.set(200, 120, 160); scene.add(sun);
const fillL = new THREE.DirectionalLight(0x8ab0ff, .7); fillL.position.set(-80, 0, 60); scene.add(fillL);
const M = (c, r = .6, m = .2, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: e });
const box = (w, h, d, mat, x = 0, y = 0, z = 0, parent = scene) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; };
const GREEN = [.35, 1.7, .45];
function canvasTex(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

// ==========================================================================
// ESPACIO: Tierra con observatorio, Luna con retrorreflector
// ==========================================================================
const space = new THREE.Group(); scene.add(space);
const earthTex = canvasTex(1024, 512, (x, w, h) => { const r = rng(3); x.fillStyle = '#0a1a3a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(${30 + r() * 30},${60 + r() * 40},${30 + r() * 20},.9)`; x.beginPath(); x.ellipse(r() * w, h * .15 + r() * h * .7, 20 + r() * 70, 10 + r() * 40, r() * 3, 0, 7); x.fill(); }
  for (let i = 0; i < 260; i++) { x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.ellipse(r() * w, r() * h, 10 + r() * 60, 3 + r() * 10, r(), 0, 7); x.fill(); } });
const EARTH_R = 180; const earth = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R, 96, 64), new THREE.MeshStandardMaterial({ map: earthTex, roughness: .8, metalness: 0 })); earth.position.set(0, -EARTH_R, 0); space.add(earth);
const atmo = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R * 1.03, 64, 48), new THREE.ShaderMaterial({ transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
  vertexShader: `varying vec3 vN; void main(){ vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`, fragmentShader: `varying vec3 vN; void main(){ float f=pow(1.-abs(vN.z),3.); gl_FragColor=vec4(vec3(.3,.6,1.)*f*1.2,f); }` })); atmo.position.copy(earth.position); space.add(atmo);
const obs = new THREE.Group(); space.add(obs); { const dome = new THREE.Mesh(new THREE.SphereGeometry(1.4, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), M(0xe8e8ec, .4, .3)); dome.position.y = 1.2; obs.add(dome); box(3, 1.2, 3, M(0xb8b8bc, .6, .1), 0, .6, 0, obs); }
const moonTex = canvasTex(1024, 512, (x, w, h) => { const r = rng(8); x.fillStyle = '#8a8a88'; x.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(60,60,62,.55)'; x.beginPath(); x.ellipse(r() * w, r() * h, 30 + r() * 90, 20 + r() * 60, r() * 3, 0, 7); x.fill(); }
  for (let i = 0; i < 400; i++) { const cx = r() * w, cy = r() * h, rr = 2 + r() ** 3 * 30; x.strokeStyle = 'rgba(40,40,40,.5)'; x.lineWidth = 1 + rr * .1; x.beginPath(); x.arc(cx, cy, rr, 0, 7); x.stroke(); x.fillStyle = 'rgba(200,200,200,.15)'; x.beginPath(); x.arc(cx + rr * .2, cy + rr * .2, rr * .8, 0, 7); x.fill(); } });
const MOON = V3(80, 960, -260); const MOON_R = 70; const moon = new THREE.Mesh(new THREE.SphereGeometry(MOON_R, 96, 64), new THREE.MeshStandardMaterial({ map: moonTex, roughness: .95, metalness: 0, emissive: 0x2a2a2a, emissiveMap: moonTex })); moon.position.copy(MOON); space.add(moon);
const RR = MOON.clone().add(MOON.clone().negate().normalize().multiplyScalar(MOON_R)); // punto de la cara visible
const stars = new Particles(3000, { size: 2.2, seed: 77 }); scene.add(stars.obj); { const r = rng(4); stars.begin(); for (let i = 0; i < 3000; i++) { const u = r() * 2 - 1, a = r() * 6.283, s = Math.sqrt(1 - u * u); const d = 3000; const b = .2 + r() ** 3 * .8; stars.push(Math.cos(a) * s * d, u * d, Math.sin(a) * s * d, b, b, b * 1.1); } stars.end(); }
// superficie lunar con retrorreflector (primer plano)
const lunar = new THREE.Group(); lunar.position.set(0, 0, -20000); scene.add(lunar);
{ const g = new THREE.PlaneGeometry(400, 400, 120, 120); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); let z = noise1(x * .03 + 7) * noise1(y * .03 + 3) * 4; for (const [cx, cy, cr] of [[30, -20, 18], [-60, 40, 26], [10, 70, 12], [-20, -70, 30]]) { const d = Math.hypot(x - cx, y - cy) / cr; if (d < 1.3) z += (d < 1 ? -(1 - d * d) * cr * .25 : (1.3 - d) * cr * .15); } p.setZ(i, z); } g.computeVertexNormals();
  const gnd = new THREE.Mesh(g, M(0x8a8884, 1, 0)); gnd.rotation.x = -Math.PI / 2; lunar.add(gnd); }
const panel = new THREE.Group(); panel.position.set(0, 1.6, 0); panel.rotation.x = -.45; lunar.add(panel); box(12, .5, 12, M(0xc8ccd0, .3, .8), 0, -.3, 0, panel);
const cubes = []; for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.48, .48, .4, 20), new THREE.MeshStandardMaterial({ color: 0x9ab0c8, roughness: .05, metalness: .95, emissive: 0x000000 })); c.position.set(-5.4 + i * 1.2, 0, -5.4 + j * 1.2); panel.add(c); cubes.push(c); }
box(.3, 3, .3, M(0x9a9aa0, .4, .7), -6, -1.5, 6, panel); box(.3, 3, .3, M(0x9a9aa0, .4, .7), 6, -1.5, 6, panel);

// ==========================================================================
// LABORATORIO: bombilla frente a puntero láser
// ==========================================================================
const LAB = V3(0, 0, 20000); const lab = new THREE.Group(); lab.position.copy(LAB); scene.add(lab);
const bulb = new THREE.Group(); bulb.position.set(-8, 16, 0); lab.add(bulb); { const gl = new THREE.Mesh(new THREE.SphereGeometry(4, 32, 24), new THREE.MeshStandardMaterial({ color: 0xfff4e0, roughness: .1, transparent: true, opacity: .35, emissive: 0x806030 })); bulb.add(gl);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 3, 20), M(0xb8b0a0, .4, .8)); base.position.y = -4.8; bulb.add(base); const fil = new THREE.Mesh(new THREE.TorusGeometry(1, .12, 6, 20), new THREE.MeshBasicMaterial({ color: 0xffe0a0 })); bulb.add(fil); }
const pointer = new THREE.Group(); pointer.position.set(-14, -16, 0); lab.add(pointer); { const b = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 14, 24), M(0x8a8e96, .35, .6)); b.rotation.z = Math.PI / 2; pointer.add(b); const tip = new THREE.Mesh(new THREE.CylinderGeometry(.9, 1.1, 1.5, 24), M(0xc8ccd0, .3, .9)); tip.rotation.z = Math.PI / 2; tip.position.x = 7.6; pointer.add(tip); box(1.4, .4, .8, M(0xc03020, .5, .2), 1, 1.1, 0, pointer); }

// ==========================================================================
// ÁTOMOS y CAVIDAD
// ==========================================================================
const AT = V3(20000, 0, 0); const atoms = new THREE.Group(); atoms.position.copy(AT); scene.add(atoms);
function atomMesh(r = 1) { const g = new THREE.Group(); const n = new THREE.Mesh(new THREE.SphereGeometry(1.2 * r, 24, 16), M(0xe08a50, .4, .2, 0x301000)); g.add(n);
  const o1 = new THREE.Mesh(new THREE.TorusGeometry(4 * r, .06 * r, 6, 64), new THREE.MeshBasicMaterial({ color: 0x5a7aa0, transparent: true, opacity: .6 })); const o2 = new THREE.Mesh(new THREE.TorusGeometry(7 * r, .06 * r, 6, 64), new THREE.MeshBasicMaterial({ color: 0x5a7aa0, transparent: true, opacity: .6 })); g.add(o1, o2);
  const e = new THREE.Mesh(new THREE.SphereGeometry(.55 * r, 16, 12), new THREE.MeshBasicMaterial({ color: 0x7fc8ff })); g.add(e); g.userData = { e, r }; return g; }
const A1 = atomMesh(1); A1.position.set(-6, 0, 0); atoms.add(A1); const A2 = atomMesh(1); A2.position.set(14, -2, 0); atoms.add(A2);
const row = []; for (let i = 0; i < 8; i++) { const a = atomMesh(.45); a.position.set(-28 + i * 8, (i % 2 ? 2 : -2), 0); a.visible = false; atoms.add(a); row.push(a); }
function setElectron(a, level, t, ph = 0) { const R = lerp(4, 7, level) * a.userData.r; const w = lerp(2.2, 1.4, level); a.userData.e.position.set(Math.cos(t * w + ph) * R, Math.sin(t * w + ph) * R, 0); a.userData.e.material.color.setRGB(lerp(.5, 1.6, level), lerp(.8, 1.4, level), lerp(1.6, .5, level)); }
const CV = V3(-20000, 0, 0); const cav = new THREE.Group(); cav.position.copy(CV); scene.add(cav);
const rodMat = new THREE.MeshStandardMaterial({ color: 0x60ff90, roughness: .1, metalness: 0, transparent: true, opacity: .35, emissive: 0x0a3a14 });
const rod = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 40, 40), rodMat); rod.rotation.z = Math.PI / 2; cav.add(rod);
const mirMat = new THREE.MeshStandardMaterial({ color: 0xdfe6ee, roughness: .05, metalness: 1 }); const mirL = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, .8, 40), mirMat); mirL.rotation.z = Math.PI / 2; mirL.position.x = -24; cav.add(mirL);
const mirR = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, .8, 40), new THREE.MeshStandardMaterial({ color: 0xbfe6ff, roughness: .05, metalness: .6, transparent: true, opacity: .6 })); mirR.rotation.z = Math.PI / 2; mirR.position.x = 24; cav.add(mirR);
const lamp = new THREE.Mesh(new THREE.TorusGeometry(5, .4, 8, 40), M(0xffd080, .4, .2, 0x000000)); lamp.rotation.y = Math.PI / 2; const lamps = []; for (let i = 0; i < 6; i++) { const l = lamp.clone(); l.material = lamp.material; l.position.x = -15 + i * 6; cav.add(l); lamps.push(l); }

// ==========================================================================
// TIMELINE
// ==========================================================================
const P = new Particles(16000, { size: .5, seed: 43 }); scene.add(P.obj);
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
const L = (t, a, b) => smooth(TL[a], TL[a] + .3, t) * (b ? 1 - smooth(TL[b] - .1, TL[b] + .1, t) : 1);
function show(o) { space.visible = !!o.space; lab.visible = !!o.lab; atoms.visible = !!o.atoms; cav.visible = !!o.cav; lunar.visible = !!o.lunar; stars.obj.visible = !!o.space || !!o.lunar; }
function line(a, b, n, col, amp = 1, jit = 0, sd = 0) { const s = P.seed; for (let i = 0; i < n; i++) { const q = ((i + sd) % P.n) * 4; const u = i / n; P.push(lerp(a.x, b.x, u) + (s[q] - .5) * jit, lerp(a.y, b.y, u) + (s[q + 1] - .5) * jit, lerp(a.z, b.z, u) + (s[q + 2] - .5) * jit, col[0] * amp, col[1] * amp, col[2] * amp); } }
// tren de ondas (paquete de fotón) a lo largo de dir, centrado en c
function packet(c, dir, len, lam, amp, col, ph, n = 160, up = V3(0, 1, 0), env = true) { for (let i = 0; i < n; i++) { const u = i / (n - 1) - .5; const d = u * len; const e = env ? Math.exp(-u * u * 10) : 1; const y = Math.sin(d / lam * 6.283 - ph) * amp * e; const p = c.clone().addScaledVector(dir, d).addScaledVector(up, y); const f = .3 + .7 * e; P.push(p.x, p.y, p.z, col[0] * f, col[1] * f, col[2] * f); } }
function earthMoon(t, t0, dur, cam = true) { // pulso que sube y vuelve
  const A = V3(0, 2, 0), B = RR.clone(); const u = (t - t0) / dur; line(A, B, 2500, GREEN, 1.1, 1.2); if (u > 0 && u < 2) { const k = u < 1 ? u : 2 - u; const c = A.clone().lerp(B, k); const dir = B.clone().sub(A).normalize(); for (let i = 0; i < 300; i++) { const d = (i / 300 - .5) * 30; const p = c.clone().addScaledVector(dir, d); const f = 5 * Math.exp(-((i / 300 - .5) ** 2) * 30); P.push(p.x, p.y, p.z, GREEN[0] * f, GREEN[1] * f, GREEN[2] * f); } } return u; }

function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .1; camera.far = 8000;
  let bloomS = .8, flash = 0, ca = .0013, fade = 0, grain = .035, expo = 1.15, dim = 0;
  P.begin(); P.mat.size = .6; show({});
  for (const c of ['what', 'laser', 'how', 'trick', 'chain', 'mirrors', 'curious', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];
  if (t < TL.what) {
    // A · un láser a la Luna… y vuelve
    show({ space: true }); const u = earthMoon(t, .4, 1.1); P.mat.size = 7;
    camOrbit(V3(40, 540, -130), lerp(2100, 1950, t / TL.what), .9, .05, 40); expo = 1.25; bloomS = 1;
    hud.push(() => { titleHUD('DESDE LA TIERRA DISPARAMOS', 'UN LÁSER A LA LUNA…', smooth(.1, .4, t) * (1 - smooth(TL.back - .1, TL.back + .1, t)), 300); titleHUD('', '…Y LA LUZ VUELVE', L(t, 'back'), 300); });
  } else if (t < TL.how) {
    // B · bombilla: caos de colores y direcciones; láser: una sola onda ordenada
    show({ lab: true }); const s = P.seed; const lk = smooth(TL.laser - .2, TL.laser + .4, t);
    for (let i = 0; i < 2600; i++) { const q = (i % P.n) * 4; const a = s[q] * 6.283, b = Math.acos(s[q + 1] * 2 - 1); const r = 4.5 + fract(s[q + 2] + t * (.25 + s[q + 3] * .2)) * 22; const dir = V3(Math.sin(b) * Math.cos(a), Math.cos(b), Math.sin(b) * Math.sin(a));
      const wig = Math.sin(r * (1 + s[q + 3] * 2) * 2 - t * 10) * .6; const c = new THREE.Color().setHSL(s[q + 3], .9, .6); const f = (1 - (r - 4.5) / 22) * 1.6 * (1 - lk * .5); const p = bulb.position.clone().add(LAB).addScaledVector(dir, r).add(V3(0, wig, 0)); P.push(p.x, p.y, p.z, c.r * f, c.g * f, c.b * f); }
    if (lk > 0) { const st = pointer.position.clone().add(LAB).add(V3(8.4, 0, 0)); const len = 60 * smooth(TL.laser, TL.laser + .8, t); for (let i = 0; i < 900; i++) { const d = i / 900 * len; const y = Math.sin(d / 2.4 * 6.283 - t * 14) * 1.1; P.push(st.x + d, st.y + y, st.z, GREEN[0] * lk, GREEN[1] * lk, GREEN[2] * lk); } line(st, st.clone().add(V3(len, 0, 0)), 400, GREEN, .5 * lk, .15, 4000); }
    camOrbit(LAB.clone().add(V3(4, 0, 0)), lerp(92, 86, (t - TL.what) / 11), .12, .05, 40); P.mat.size = 1.3; bloomS = .9;
    hud.push(() => { titleHUD('¿QUÉ TIENE DE ESPECIAL', 'ESTA LUZ?', L(t, 'what', 'bulb'), 300); titleHUD('LA DE UNA BOMBILLA', 'ES UN CAOS', L(t, 'bulb', 'laser'), 300);
      const pb = project(bulb.position.clone().add(LAB).add(V3(0, -9, 0))); txt('MUCHOS COLORES · TODAS LAS DIRECCIONES', W / 2, pb.y + 40, 26, { spacing: 2, weight: 700, alpha: L(t, 'dirs') * .9, fill: '#ffd9a0' });
      titleHUD('LA DE UN LÁSER: UNA SOLA ONDA', 'DE UN SOLO COLOR', L(t, 'laser', 'ordered'), 300); titleHUD('', 'PERFECTAMENTE ORDENADA', L(t, 'ordered'), 300);
      const pl = project(pointer.position.clone().add(LAB).add(V3(20, -5, 0))); txt('UN COLOR · UNA DIRECCIÓN · MISMO RITMO', W / 2, pl.y + 40, 26, { spacing: 2, weight: 700, alpha: smooth(TL.laser + .5, TL.laser + .9, t) * .9, fill: '#9fffb0' }); });
  } else if (t < TL.chain) {
    // C · bombeo: el electrón sube; al caer suelta un fotón. D · emisión estimulada: un gemelo idéntico
    show({ atoms: true }); const lt = t - TL.how; const s = P.seed;
    const lev1 = t < TL.fall ? smooth(TL.jump, TL.jump + .4, t) : 1 - smooth(TL.fall + .3, TL.fall + .6, t); setElectron(A1, lev1, t);
    const lev2 = t < TL.trick ? 0 : t < TL.twin + .4 ? 1 : 1 - smooth(TL.twin + .4, TL.twin + .7, t); setElectron(A2, lev2, t, 1.3);
    const pk = smooth(TL.pump, TL.pump + .3, t) * (1 - smooth(TL.jump + .3, TL.jump + .6, t)); if (pk > 0) for (let i = 0; i < 500; i++) { const q = (i % P.n) * 4; const a = s[q] * 6.283; const r = 12 - fract(s[q + 1] + t * 1.5) * 9; const p = A1.position.clone().add(AT).add(V3(Math.cos(a) * r, Math.sin(a) * r, 0)); P.push(p.x, p.y, p.z, 1.6 * pk, 1.2 * pk, .3 * pk); }
    // fotón 1: nace en A1 al caer, viaja a la derecha pasando junto a A2
    const f0 = TL.fall + .45; if (t > f0) { const x = A1.position.x + (t - f0) * 3.1; const c = V3(x, 0, 0).add(AT); packet(c, V3(1, 0, 0), 10, 2, 1.1, GREEN, t * 14); }
    const t2 = TL.twin + .45; if (t > t2) { const x = A1.position.x + (t - f0) * 3.1; const c = V3(x, -2.6, 0).add(AT); packet(c, V3(1, 0, 0), 10, 2, 1.1, GREEN, t * 14, 160, V3(0, 1, 0)); }
    camOrbit(AT.clone().add(V3(lerp(-4, 6, smooth(TL.trick - .5, TL.trick + .5, t)) + 16 * smooth(TL.same, TL.chain, t), 0, 0)), lerp(60, 54, lt / 16), .05, .05, 38); P.mat.size = 1.0; bloomS = 1;
    hud.push(() => { titleHUD('¿CÓMO', 'SE CONSIGUE?', L(t, 'how', 'pump'), 300); titleHUD('PRIMERO DAS ENERGÍA', 'A LOS ÁTOMOS', L(t, 'pump', 'jump'), 300); titleHUD('SUS ELECTRONES SALTAN', 'A UN NIVEL MÁS ALTO', L(t, 'jump', 'fall'), 300);
      titleHUD('CUANDO UNO CAE, SUELTA', 'UN FOTÓN', L(t, 'fall', 'trick'), 300); titleHUD('Y AQUÍ ESTÁ', 'EL TRUCO', L(t, 'trick', 'pass_'), 300); titleHUD('SI UN FOTÓN PASA JUNTO A', 'OTRO ÁTOMO CON ENERGÍA…', L(t, 'pass_', 'twin'), 300);
      titleHUD('…LO OBLIGA A SOLTAR', 'UN GEMELO IDÉNTICO', L(t, 'twin', 'same'), 300); titleHUD('MISMO COLOR · MISMA DIRECCIÓN', 'MISMO RITMO', L(t, 'same'), 300);
      const pe = project(A1.userData.e.getWorldPosition(V3(0, 0, 0))); callout(A1.userData.e.getWorldPosition(V3(0, 0, 0)), -60, 240, 'ELECTRÓN', null, smooth(TL.pump + .3, TL.pump + .7, t) * (1 - smooth(TL.fall, TL.fall + .3, t)), '#7fd4ff');
      // diagrama de niveles
      const da = smooth(TL.jump - .3, TL.jump, t) * (1 - smooth(TL.trick - .2, TL.trick, t)); if (da > .01) { const x0 = 160, x1 = 920, yE1 = 1520, yE2 = 1340; g2.save(); g2.globalAlpha = da; g2.strokeStyle = 'rgba(255,255,255,.7)'; g2.lineWidth = 3; g2.beginPath(); g2.moveTo(x0, yE1); g2.lineTo(x1, yE1); g2.moveTo(x0, yE2); g2.lineTo(x1, yE2); g2.stroke();
        const y = lerp(yE1, yE2, lev1); g2.fillStyle = '#7fd4ff'; g2.shadowColor = '#7fd4ff'; g2.shadowBlur = 20; g2.beginPath(); g2.arc(W / 2, y, 14, 0, 7); g2.fill(); g2.restore(); txt('NIVEL ALTO', x0, yE2 - 30, 22, { align: 'left', spacing: 4, alpha: da * .8 }); txt('NIVEL BAJO', x0, yE1 - 30, 22, { align: 'left', spacing: 4, alpha: da * .8 }); } });
  } else if (t < TL.mirrors) {
    // E · reacción en cadena: 1 → 2 → 4 → 8
    show({ atoms: true }); A1.visible = A2.visible = false; row.forEach(a => a.visible = true); const lt = t - TL.chain; const s = P.seed;
    row.forEach((a, i) => setElectron(a, 1 - smooth(.3 + i * .35, .5 + i * .35, lt), t, i));
    const head = -32 + lt * 18; const n = Math.min(8, Math.pow(2, Math.floor(clamp((head + 28) / 8 + 1, 0, 3.9)))); for (let k = 0; k < n; k++) { const y = (k - (n - 1) / 2) * 1.6; packet(V3(head, y, 0).add(AT), V3(1, 0, 0), 12, 2, .5, GREEN, t * 14, 140); }
    camOrbit(AT.clone(), 74, .05, .05, 38); P.mat.size = 1.0; bloomS = 1;
    hud.push(() => { bigStat('', ['1', '2', '4', '8'][Math.round(Math.log2(n))] + ' FOTONES', 330, smooth(0, .3, lt), clamp(lt / 1.5)); titleHUD('DOS SE VUELVEN CUATRO…', 'CUATRO, OCHO…', L(t, 'chain'), 1480); });
    A1.visible = A2.visible = true;
  } else if (t < TL.curious) {
    // F · cavidad: dos espejos; la luz rebota; uno deja escapar un poco: el rayo, que casi no se abre
    show({ cav: true }); const lt = t - TL.mirrors; const s = P.seed; const grow = smooth(TL.mirrors, TL.leak, t); lamps.forEach(l => l.material.emissive.setRGB(.03, .02, .01));
    const nb = Math.floor(4 + grow * 26); for (let k = 0; k < nb; k++) { const q = (k % P.n) * 4; const u = fract(s[q] + t * .9); const dir = Math.floor(s[q] + t * .9) % 2 ? 1 : -1; const x = lerp(-23, 23, dir > 0 ? u : 1 - u); const y = (s[q + 1] - .5) * 3.4, z = (s[q + 2] - .5) * 3.4; packet(V3(x, y, z).add(CV), V3(dir, 0, 0), 6, 1.2, .25, [GREEN[0] * 1.6, GREEN[1] * 1.6, GREEN[2] * 1.6], t * 14, 50); }
    for (let i = 0; i < 1500; i++) { const q = ((i + 3000) % P.n) * 4; P.push(CV.x + (s[q] - .5) * 46, CV.y + (s[q + 1] - .5) * 5, CV.z + (s[q + 2] - .5) * 5, .1 * grow, .5 * grow, .15 * grow); }
    const bk = smooth(TL.leak + .3, TL.beam, t); if (bk > 0) { const len = 400 * smooth(TL.leak + .3, TL.thread + 1.5, t); const A = V3(24.5, 0, 0).add(CV); line(A, A.clone().add(V3(len, 0, 0)), 3500, GREEN, 2.2 * bk, .25, 6000); }
    const wz = easeInOut(smooth(TL.thread - .3, TL.thread + 1.2, t)); camOrbit(CV.clone().add(V3(lerp(0, 160, wz), 0, 0)), lerp(lerp(90, 80, lt / 7), 300, wz), lerp(.25, .5, wz), lerp(.12, .12, wz), 38); P.mat.size = lerp(1.0, 2.2, wz); bloomS = 1.1;
    hud.push(() => { titleHUD('EL MATERIAL ESTÁ ENTRE', 'DOS ESPEJOS', L(t, 'mirrors', 'bounce'), 300); titleHUD('LA LUZ REBOTA', 'UNA Y OTRA VEZ', L(t, 'bounce', 'leak'), 300); titleHUD('UNO DEJA ESCAPAR UN POCO:', 'ESE ES EL RAYO', L(t, 'leak', 'thread'), 300); titleHUD('CASI NO SE ABRE', 'KILÓMETROS COMO UN HILO', L(t, 'thread'), 300);
      callout(mirL.getWorldPosition(V3(0, 0, 0)).add(V3(0, 4.5, 0)), -40, -220, 'ESPEJO', 'refleja todo', smooth(TL.mirrors + .3, TL.mirrors + .7, t) * (1 - smooth(TL.thread - .4, TL.thread, t)));
      callout(mirR.getWorldPosition(V3(0, 0, 0)).add(V3(0, 4.5, 0)), 40, -220, 'ESPEJO PARCIAL', 'deja salir un poco', smooth(TL.mirrors + .6, TL.mirrors + 1, t) * (1 - smooth(TL.thread - .4, TL.thread, t)), '#9fffb0'); });
  } else if (t < TL.brand) {
    // G · espejos del Apolo en la Luna; tiempo de ida y vuelta; la Luna se aleja ~4 cm/año
    const lt = t - TL.curious;
    if (t < TL.fire) { show({ lunar: true }); const s = P.seed; cubes.forEach((c, i) => c.material.emissive.setRGB(.15, .25 + .12 * Math.sin(t * 3 + i), .35)); camOrbit(V3(0, 1, 0).add(lunar.position), lerp(34, 26, lt / 3.4), .5 + lt * .06, .75, 38); expo = 1.5;
      hud.push(() => { titleHUD('LOS ASTRONAUTAS DEL APOLO', 'DEJARON ESPEJOS EN LA LUNA', smooth(TL.apollo - .2, TL.apollo + .2, t), 300); titleHUD('Y LO MÁS', 'CURIOSO', smooth(0, .3, lt) * (1 - smooth(TL.apollo - .3, TL.apollo - .1, t)), 300); txt('100 reflectores en un panel de ~46 cm', W / 2, 1520, 30, { weight: 300, alpha: smooth(TL.apollo + .8, TL.apollo + 1.2, t) }); });
    } else { show({ space: true }); const u = earthMoon(t, TL.fire + .8, (TL.moon - TL.fire - .8) / 2); const mk = smooth(TL.moon, TL.cm + 1, t); moon.position.copy(MOON).addScaledVector(MOON.clone().normalize(), mk * 30); P.mat.size = 2.4;
      camOrbit(V3(40, 540, -130), 2050, .9, .05, 40); P.mat.size = 7; expo = 1.25; bloomS = 1;
      hud.push(() => { titleHUD('HOY SE LES DISPARA CON LÁSER', 'Y SE MIDE CUÁNTO TARDA', L(t, 'fire', 'moon'), 300); const ta = smooth(TL.time, TL.time + .3, t) * (1 - smooth(TL.moon - .2, TL.moon, t)); const secs = clamp(u, 0, 2) * 1.28;
        txt(secs.toFixed(2).replace('.', ',') + ' s', W / 2, 520, 110, { font: 'Montserrat', weight: 800, alpha: ta, fill: copperGrad(300, 780, 520, .5) }); txt('ida y vuelta: ≈ 2,5 s', W / 2, 610, 32, { weight: 300, alpha: ta });
        titleHUD('LA LUNA SE ALEJA DE NOSOTROS', '', L(t, 'moon'), 300); bigStat('', '≈ 4 cm / AÑO', 470, L(t, 'cm'), clamp((t - TL.cm) / 1.5)); }); }
  } else {
    // H · marca
    show({ space: true }); const lt = t - TL.brand; earthMoon(t, 99, 1); P.mat.size = 7; camOrbit(V3(40, 540, -130), 2050 + lt * 30, .9 + lt * .02, .05, 40); expo = .9; fade = Math.min(.5, lt * .45); dim = smooth(0, .8, lt) * .6;
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  if (!(t >= TL.fire && t < TL.brand)) moon.position.copy(MOON);
  P.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (dim > 0) hud.unshift(() => { g2.save(); g2.globalAlpha = dim * .7; g2.fillStyle = '#02050b'; g2.fillRect(0, 0, W, H); g2.restore(); });
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
function renderCover() { renderFrame(TL.leak + 2.2); coverText('¿QUÉ TIENE DE', 'ESPECIAL?', 'La luz que va a la Luna y vuelve'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
