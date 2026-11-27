// NO LO SABÍAS — "¿Qué hay debajo de un volcán?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final.
// Datos: magma ~700–1 250 °C (basáltico >1 000 °C). Asciende por flotabilidad (menos denso que la roca encajante).
// Gases disueltos (H2O, CO2, SO2) se exsuelven al bajar la presión. Magma fluido (basalto) → efusivo (La Palma 2021);
// viscoso (andesita/riolita) → explosivo. Coladas: normalmente < 5–10 km/h. Corrientes piroclásticas: 200–700 °C, >100 km/h.
// Ceniza volcánica: fragmentos de roca y vidrio volcánico (<2 mm), abrasivos. Eyjafjallajökull 2010: ~100 000 vuelos cancelados.
// ~1 350 volcanes potencialmente activos en tierra (USGS); la mayor parte del vulcanismo es submarino (dorsales).
import { THREE, renderer, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3, shake,
  g2, camera, Particles, txt, copperGrad, project, callout, bar, fract, emitRise, emitJet, arrowXY, bigStat, drawBrand, coverText, finish } from '../../lib/core.js';

renderer.localClippingEnabled = true;
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(new THREE.Color(.05, .03, .04), .004);
const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uTop: { value: new THREE.Color(.01, .01, .03) }, uHor: { value: new THREE.Color(.18, .06, .04) } },
  vertexShader: `varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 uTop,uHor; varying vec3 vD; void main(){ vec3 d=normalize(vD); float y=clamp(d.y,0.,1.); gl_FragColor=vec4(mix(uHor,uTop,pow(y,.45)),1.); }` });
const sky = new THREE.Mesh(new THREE.SphereGeometry(2800, 32, 16), skyMat); sky.renderOrder = -1; scene.add(sky);
const hemi = new THREE.HemisphereLight(0x9aa8c8, 0x2a1810, 1.4); scene.add(hemi);
const moon = new THREE.DirectionalLight(0xb8c8ff, 1.0); moon.position.set(-40, 60, 50); scene.add(moon);
const glow = new THREE.PointLight(0xff6a20, 0, 260, 1.4); scene.add(glow);
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .85, ...o });
const LAVA = (o = {}) => new THREE.MeshStandardMaterial({ color: 0x401000, emissive: 0xff5a10, emissiveIntensity: 1.6, roughness: .6, ...o });
const COP = 0xc8743f;

// ==========================================================================
// VOLCÁN (cono con cráter) + corte transversal
// ==========================================================================
const VH = 42; const coneH = r => { const base = VH * Math.exp(-Math.pow(r / 46, 1.25)); const crater = -9 * Math.exp(-Math.pow(r / 5, 2)); return base + crater; };
const terrH = (x, z) => { const r = Math.hypot(x, z); return coneH(r) + Math.sin(x * .21 + z * .13) * Math.cos(z * .17 - x * .07) * .8 + Math.sin(Math.atan2(z, x) * 13 + r * .2) * Math.min(1.6, r * .05); };
const clipCut = new THREE.Plane(V3(0, 0, -1), 0); // con el corte, solo z < 0
const volcMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95, clippingPlanes: [], side: THREE.DoubleSide });
const volc = new THREE.Group(); scene.add(volc);
{ const g = new THREE.PlaneGeometry(420, 420, 260, 260); g.rotateX(-Math.PI / 2); const p = g.attributes.position; const c = new Float32Array(p.count * 3); const r0 = rng(3);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z); const n = Math.sin(x * .21 + z * .13) * Math.cos(z * .17 - x * .07) * .8 + Math.sin(Math.atan2(z, x) * 13 + r * .2) * Math.min(1.6, r * .05); const y = coneH(r) + n;
    p.setY(i, y); const k = clamp(r / 120); c.set([lerp(.36, .3, k), lerp(.29, .27, k), lerp(.26, .24, k)], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.computeVertexNormals(); volc.add(new THREE.Mesh(g, volcMat)); }
const craterGlow = new THREE.Mesh(new THREE.CircleGeometry(4.2, 32), new THREE.MeshBasicMaterial({ color: 0xc84a12 })); craterGlow.rotation.x = -Math.PI / 2; craterGlow.position.y = coneH(0) + 1.4; volc.add(craterGlow);
// sección (en el plano z = 0)
const cut = new THREE.Group(); volc.add(cut);
{ const prof = []; for (let x = -150; x <= 150; x += 1) prof.push([x, coneH(Math.abs(x))]);
  const layers = [[0, 0x8a6a52], [-30, 0x9a7458], [-60, 0x6e5444], [-95, 0x7a5c4a]];
  for (const [y0, col] of layers) { const s = new THREE.Shape(); s.moveTo(-150, y0 - 35); for (const [x, y] of prof) s.lineTo(x, Math.min(y, y0 === 0 ? y : y0)); s.lineTo(150, y0 - 35); s.closePath(); const m = new THREE.Mesh(new THREE.ShapeGeometry(s, 1), M(col, { side: THREE.DoubleSide, emissive: col, emissiveIntensity: .25 })); m.position.z = .05 + (-y0) * .0001; cut.add(m); }
  const ch = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20), LAVA()); ch.scale.set(34, 13, 1); ch.position.set(0, -72, .3); cut.add(ch); cut.userData.ch = ch;
  const cs = new THREE.Shape(); cs.moveTo(-2.5, -62); cs.bezierCurveTo(-4, -30, 2, -10, -2.2, coneH(0)); cs.lineTo(2.2, coneH(0)); cs.bezierCurveTo(5, -10, -1, -30, 2.5, -62); cs.closePath(); const cond = new THREE.Mesh(new THREE.ShapeGeometry(cs, 24), LAVA({ side: THREE.DoubleSide })); cond.position.z = .25; cut.add(cond); cut.userData.cond = cond; }

// ==========================================================================
// BOTELLA DE REFRESCO
// ==========================================================================
const LAB = V3(0, 0, 3000); const lab = new THREE.Group(); lab.position.copy(LAB); scene.add(lab);
{ const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), M(0x1a1416, { roughness: .6 })); floor.rotation.x = -Math.PI / 2; lab.add(floor); }
const bottle = new THREE.Group(); { const pts = []; const prof = [[0, 0], [.42, 0], [.45, .08], [.45, 1.5], [.4, 1.75], [.2, 2.2], [.14, 2.45], [.14, 2.6]]; for (const [r, y] of prof) pts.push(new THREE.Vector2(r, y));
  const b = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), new THREE.MeshPhysicalMaterial({ color: 0x3a8a4a, roughness: .05, transparent: true, opacity: .35, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false })); bottle.add(b);
  const liq = new THREE.Mesh(new THREE.CylinderGeometry(.41, .41, 1.5, 32), new THREE.MeshStandardMaterial({ color: 0x5a2a10, transparent: true, opacity: .75, roughness: .2, emissive: 0x200800 })); liq.position.y = .8; bottle.add(liq);
  const lbl = new THREE.Mesh(new THREE.CylinderGeometry(.455, .455, .5, 32, 1, true), M(0xc8302a, { roughness: .5 })); lbl.position.y = .85; bottle.add(lbl);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.17, .17, .14, 24), M(0xd8d8dc, { metalness: .6, roughness: .3 })); cap.position.y = 2.66; bottle.add(cap); bottle.userData.cap = cap; } lab.add(bottle);
// Persona caminando
const walker = new THREE.Group(); { const wm = M(0xf2ede4, { roughness: .6, emissive: 0x302820 }), sk = M(0xc98d6a, { emissive: 0x201008 }); const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.2, .55, 4, 10), wm); torso.position.y = 1.25; walker.add(torso); const hd = new THREE.Mesh(new THREE.SphereGeometry(.15, 14, 10), sk); hd.position.y = 1.78; walker.add(hd);
  for (const s of [-1, 1]) { const lg = new THREE.Group(); lg.position.set(0, .88, s * .11); const l = new THREE.Mesh(new THREE.CapsuleGeometry(.08, .7, 4, 8), M(0x4a6aa8, { emissive: 0x101830 })); l.position.y = -.42; lg.add(l); walker.add(lg); walker.userData['leg' + s] = lg;
    const ag = new THREE.Group(); ag.position.set(0, 1.5, s * .27); const a = new THREE.Mesh(new THREE.CapsuleGeometry(.055, .55, 4, 8), wm); a.position.y = -.32; ag.add(a); walker.add(ag); walker.userData['arm' + s] = ag; } }
scene.add(walker);
// Esquirlas de ceniza (microscopio)
const MIC = V3(0, 3000, 0); const mic = new THREE.Group(); mic.position.copy(MIC); scene.add(mic);
const shardMat = new THREE.MeshPhysicalMaterial({ color: 0xd8d0c0, roughness: .15, metalness: .05, transparent: true, opacity: .85, clearcoat: 1, emissive: 0x4a3e30, side: THREE.DoubleSide });
const shards = []; { const r = rng(7); for (let i = 0; i < 26; i++) { const g = new THREE.IcosahedronGeometry(1, 0); const p = g.attributes.position; const sc = [.4 + r() * 1.6, .2 + r() * .5, .3 + r() * 1.2]; for (let k = 0; k < p.count; k++) p.setXYZ(k, p.getX(k) * sc[0] * (.6 + r() * .8), p.getY(k) * sc[1] * (.6 + r() * .8), p.getZ(k) * sc[2] * (.6 + r() * .8)); g.computeVertexNormals();
  const m = new THREE.Mesh(g, i % 3 ? shardMat : M(0x4a4036, { roughness: .7 })); m.position.set((r() - .5) * 9, (r() - .5) * 15, (r() - .5) * 5); m.rotation.set(r() * 6, r() * 6, r() * 6); m.userData.spin = V3(r() - .5, r() - .5, r() - .5).multiplyScalar(.4); mic.add(m); shards.push(m); } }
// Aeropuerto
const AIR = V3(3000, 0, 0); const air = new THREE.Group(); air.position.copy(AIR); scene.add(air);
{ const ap = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), M(0x3a3c40, { roughness: .9 })); ap.rotation.x = -Math.PI / 2; air.add(ap);
  const mk = (x, z, ry) => { const g = new THREE.Group(); const wm = M(0xeef0f4, { roughness: .4 }); const f = new THREE.Mesh(new THREE.CapsuleGeometry(1.9, 24, 8, 20), wm); f.rotation.z = Math.PI / 2; f.position.y = 3.4; g.add(f);
    const w = new THREE.Mesh(new THREE.BoxGeometry(6, .4, 34), wm); w.position.set(1, 2.8, 0); g.add(w); const tl = new THREE.Mesh(new THREE.BoxGeometry(4, 6, .4), M(COP)); tl.position.set(-12.5, 6.5, 0); g.add(tl); const hs = new THREE.Mesh(new THREE.BoxGeometry(3, .3, 11), wm); hs.position.set(-12.5, 3.8, 0); g.add(hs);
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 3.6, 16), M(0x9aa0a8, { metalness: .4 })); e.rotation.z = Math.PI / 2; e.position.set(2.5, 1.9, s * 7); g.add(e); }
    g.position.set(x, 0, z); g.rotation.y = ry; air.add(g); };
  for (let i = 0; i < 5; i++) mk(-40 + i * 2, -60 + i * 28, .5); }
// Globo terráqueo
const GLB = V3(-3000, 0, 0); const globe = new THREE.Group(); globe.position.copy(GLB); scene.add(globe);
const n3 = (x, y, z) => Math.sin(x * 1.7 + Math.sin(y * 2.3)) * Math.cos(y * 1.9 + Math.sin(z * 1.4)) + .5 * Math.sin(z * 3.1 + x * 2.2) * Math.cos(y * 2.7 - z);
{ const g = new THREE.SphereGeometry(10, 128, 64); const p = g.attributes.position; const c = new Float32Array(p.count * 3); for (let i = 0; i < p.count; i++) { const v = V3(p.getX(i), p.getY(i), p.getZ(i)).normalize(); const land = n3(v.x * 2, v.y * 2, v.z * 2) > .35; c.set(land ? [.32, .3, .2] : [.04, .12, .28], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); globe.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .8 }))); }
const VOLDOTS = (() => { const r = rng(11); const pts = []; const pac = V3(Math.cos(-2.8), 0, Math.sin(-2.8)).normalize(); for (let i = 0; i < 1300; i++) { let v; const k = r();
  if (k < .62) { const a = r() * 6.283; const ang = (62 + (r() - .5) * 14) * Math.PI / 180; const t1 = V3(0, 1, 0).cross(pac).normalize(), t2 = pac.clone().cross(t1); v = pac.clone().multiplyScalar(Math.cos(ang)).add(t1.multiplyScalar(Math.sin(ang) * Math.cos(a))).add(t2.multiplyScalar(Math.sin(ang) * Math.sin(a))); if (Math.abs(v.y) > .85 || (v.y < -.35 && r() < .6)) { i--; continue; } }
  else { v = V3(r() - .5, (r() - .5) * 1.4, r() - .5).normalize(); } pts.push(v.multiplyScalar(10.08)); } return pts; })();
// Fondo marino (dorsal)
const SEA = V3(0, -3000, 0); const seaG = new THREE.Group(); seaG.position.copy(SEA); scene.add(seaG);
{ const g = new THREE.PlaneGeometry(300, 300, 160, 160); g.rotateX(-Math.PI / 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, -Math.exp(-Math.pow(z / 6, 2)) * 3 + Math.abs(z) * .04 + Math.sin(x * .3) * Math.cos(z * .25) * .6); } g.computeVertexNormals();
  seaG.add(new THREE.Mesh(g, M(0x1a2228, { roughness: 1 }))); const crack = new THREE.Mesh(new THREE.PlaneGeometry(300, 1.2), new THREE.MeshBasicMaterial({ color: 0xff6a18 })); crack.rotation.x = -Math.PI / 2; crack.position.y = -2.9; seaG.add(crack);
  const pil = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 10), M(0x16181c, { roughness: .6, emissive: 0x1a0600 }), 300); const d = new THREE.Object3D(); const r = rng(5); for (let i = 0; i < 300; i++) { const z = (r() - .5) * 14; d.position.set((r() - .5) * 200, -2.6 + Math.abs(z) * .1, z); d.scale.set(1 + r(), .6 + r() * .4, .8 + r() * .6); d.updateMatrix(); pil.setMatrixAt(i, d.matrix); } seaG.add(pil);
  for (let i = 0; i < 6; i++) { const ch = new THREE.Mesh(new THREE.CylinderGeometry(.6, 1.4, 6 + i % 3 * 2, 10), M(0x2a2420, { roughness: 1 })); ch.position.set(-30 + i * 11, 0, 7 + (i % 2) * 4); seaG.add(ch); } }

// Partículas: brillo (aditivas) y humo/ceniza (normales)
const PS = new Particles(40000, { size: .3, seed: 5 }); scene.add(PS.obj);
const SM = new Particles(16000, { size: 3, seed: 9, blend: THREE.NormalBlending }); SM.mat.opacity = .55; scene.add(SM.obj);
const ALL = [volc, lab, walker, mic, air, globe, seaG];

// ==========================================================================
// HUD
// ==========================================================================
function stamp(s, x, y, a, rot = -.08, col = '#ff6a4a', size = 86) { if (a <= .01) return; const sc = lerp(1.6, 1, easeOut(clamp(a * 1.4)));
  g2.save(); g2.translate(x, y); g2.rotate(rot); g2.scale(sc, sc); g2.globalAlpha = clamp(a); g2.strokeStyle = col; g2.lineWidth = 8; g2.shadowColor = col; g2.shadowBlur = 25;
  g2.font = `800 ${size}px Montserrat`; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.letterSpacing = '6px'; const w = g2.measureText(s).width + 70; g2.strokeRect(-w / 2, -size * .8, w, size * 1.6); g2.fillStyle = col; g2.fillText(s, 0, 4); g2.restore(); }
function two(top, l1, l2, a, y = 300) { if (a <= .01) return; txt(l1, W / 2, y, 50, { font: 'Montserrat', weight: 800, alpha: a }); if (l2) txt(l2, W / 2, y + 62, 50, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(160, 920, y + 62, .5) }); if (top) txt(top, W / 2, y - 62, 24, { spacing: 7, alpha: a * .8, fill: '#e3a372' }); }
const win = (t, a, b, f = .3) => smooth(a, a + f, t) * (1 - smooth(b - f, b, t));
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
const LAVAC = [2.2, .8, .2], EMB = [2.6, 1.2, .35];
function smoke(p0, n, t, rise, spread, life, grey = .32, seed = 0, drift = V3(0, 0, 0)) { const s = SM.seed; for (let i = 0; i < n; i++) { const k = ((i + seed) % SM.n) * 4; const age = fract(s[k] + t / life); const a = s[k + 1] * 6.283, r = Math.sqrt(s[k + 2]) * spread * (.3 + age);
  const g = grey * (1 - age * .4) * (.8 + s[k + 3] * .4); SM.push(p0.x + Math.cos(a) * r + drift.x * age * life, p0.y + age * rise + drift.y * age * life, p0.z + Math.sin(a) * r + drift.z * age * life, g, g * .95, g * .92); } }
function lavaPath(phi, n, t, speed, width = 1.2, seed = 0, len = 70) { const s = PS.seed; for (let i = 0; i < n; i++) { const k = ((i + seed) % PS.n) * 4; const u = fract(s[k] + t * speed); const r = 4 + u * len; const a = phi + Math.sin(r * .08 + phi * 3) * .12 + (s[k + 1] - .5) * width / Math.max(r, 4);
  const x = Math.cos(a) * r, z = Math.sin(a) * r; const f = 1 - u * .55; PS.push(x, terrH(x, z) + .35, z, LAVAC[0] * f, LAVAC[1] * f, LAVAC[2] * f); } }

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .1; camera.far = 6000; camera.fov = 42;
  let bloomS = .7, flash = 0, ca = .0014, fade = 0, expo = 1.1;
  PS.begin(); SM.begin(); PS.mat.size = .2; SM.mat.size = 3; SM.mat.opacity = .55; for (const o of ALL) o.visible = false; scene.fog.density = .0022; scene.fog.color.setRGB(.05, .03, .04); hemi.intensity = 1.5; moon.intensity = 1.8; glow.intensity = 0; glow.position.set(0, coneH(0) + 8, 0);
  skyMat.uniforms.uTop.value.setRGB(.01, .01, .03); skyMat.uniforms.uHor.value.setRGB(.18, .06, .04); volcMat.clippingPlanes = []; cut.visible = false; craterGlow.visible = true;
  for (const c of ['magma', 'why', 'fluid', 'thick', 'slow', 'pyro', 'ash', 'planes', 'count', 'sea', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = []; let shk = 0;
  const erupt = (k = 1) => { glow.intensity = 1200 * k; emitJet(PS, V3(0, coneH(0) + 1, 0), V3(0, 1, 0), Math.floor(5000 * k), t, 26, 9, 1.7, EMB, 18); smoke(V3(0, coneH(0) + 6, 0), Math.floor(4000 * k), t, 90, 14, 6, .22, 0, V3(3, 0, 0)); };

  if (t < TL.magma) {
    // A · el volcán en erupción de noche
    volc.visible = true; erupt(1); lavaPath(.9, 3000, t, .05, 2.5); lavaPath(.1, 2500, t, .045, 2.5, 7000); PS.mat.size = 1.6;
    const az = .7 + t * .05; camera.position.set(Math.sin(az) * 160, 30, Math.cos(az) * 160); camera.lookAt(0, 26, 0); camera.fov = 46;
    hud.push(() => two(null, '¿QUÉ HAY DEBAJO', 'DE UN VOLCÁN?', smooth(.05, .3, t), 300));
  } else if (t < TL.gas) {
    // B/C · corte: cámara magmática a más de 1 000 °C y el magma que sube
    const lt = t - TL.magma; volc.visible = true; volcMat.clippingPlanes = [clipCut]; cut.visible = true; craterGlow.visible = false; scene.fog.density = 0; glow.intensity = 600; glow.position.set(0, -60, 30);
    const z = easeInOut(smooth(TL.magma - .2, TL.magma + 1.6, t)); camera.position.set(lerp(150, 30, z), lerp(40, -10, z), lerp(150, 230, z)); camera.fov = 46; camera.lookAt(0, lerp(20, -18, z), 0);
    cut.userData.ch.scale.set(34 + Math.sin(t * 2) * .6, 13 + Math.cos(t * 2.3) * .4, 1);
    if (t > TL.rise) { const s = PS.seed; for (let b = 0; b < 5; b++) { const u = fract(t * .18 + b / 5); const y = lerp(-62, coneH(0) - 4, u); const x = Math.sin(u * 6 + b) * 1.5; const R = 1.6; for (let i = 0; i < 300; i++) { const k = (i + b * 300) * 4; const a = s[k] * 6.283, rr = Math.sqrt(s[k + 1]) * R; PS.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr, 1, 3, 1.4, .4); } } PS.mat.size = .5; }
    hud.push(() => { two(null, 'ROCA FUNDIDA', 'A MÁS DE 1.000 °C', win(t, TL.magma, TL.rise), 300); callout(V3(20, -72, 1), 120, 260, 'MAGMA', 'cámara magmática', smooth(TL.magma + .6, TL.magma + 1, t), '#ffb070');
      two(null, 'SUBE PORQUE PESA MENOS', 'QUE LA ROCA DE ALREDEDOR', smooth(TL.rise, TL.rise + .3, t), 300); stamp('COMO ACEITE EN AGUA', W / 2, 1650, smooth(TL.rise + 1.8, TL.rise + 2.1, t), -.04, '#ffe2c0', 50);
      if (t > TL.rise + .5) { const p = project(V3(6, -20, 1)), q = project(V3(6, 10, 1)); arrowXY(p.x + 60, p.y, q.x + 60, q.y, smooth(TL.rise + .5, TL.rise + 1, t), '#ffb070', 12); } });
  } else if (t < TL.fluid) {
    // D/E · gas disuelto como en un refresco; al bajar la presión, escapa de golpe
    const lt = t - TL.gas; lab.visible = true; bottle.position.set(0, 0, 0); const pop = smooth(TL.press + 1.4, TL.press + 1.6, t); const cap = bottle.userData.cap;
    cap.position.set(pop * 1.5, 2.66 + pop * 3 + (t > TL.press + 1.5 ? (t - TL.press - 1.5) * 2 : 0), 0); cap.rotation.z = pop * 4;
    const s = PS.seed; const fizz = t < TL.press + 1.5 ? .15 : 1; for (let i = 0; i < 2200; i++) { const k = i * 4; const u = fract(s[k] + t * (fizz > .5 ? 1.2 : .25)); const a = s[k + 1] * 6.283, r = Math.sqrt(s[k + 2]) * .38; if (fizz < .5 && i > 900) break; const y = .05 + u * 1.5; PS.push(LAB.x + Math.cos(a) * r, LAB.y + y, LAB.z + Math.sin(a) * r, .9, .9, 1); }
    if (t > TL.press + 1.5) emitJet(PS, LAB.clone().add(V3(0, 2.6, 0)), V3(.15, 1, 0), 4000, t, 5, 1.6, .9, [1.2, .95, .7], 6);
    PS.mat.size = .07; bloomS = .5; shk = t > TL.press + 1.5 && t < TL.press + 2 ? .4 : 0;
    camera.position.copy(LAB).add(V3(0, 1.6, 6.2)); camera.lookAt(LAB.clone().add(V3(0, 1.7, 0))); scene.fog.density = 0; skyMat.uniforms.uHor.value.setRGB(.16, .08, .07); hemi.intensity = 2.2; moon.intensity = 3.5; glow.intensity = 60; glow.position.copy(LAB).add(V3(2.5, 2.5, 3));
    hud.push(() => { two(null, 'Y DENTRO LLEVA', 'GAS DISUELTO', win(t, TL.gas, TL.why), 300); two(null, '¿Y POR QUÉ', 'EXPLOTA?', win(t, TL.why, TL.press), 300); two(null, 'AL SUBIR, LA PRESIÓN BAJA…', 'Y EL GAS SE ESCAPA', smooth(TL.press, TL.press + .3, t), 300);
      const pr = 1 - smooth(TL.press + .3, TL.press + 1.5, t); bar(140, 1660, 800, pr, 'PRESIÓN', Math.round(pr * 100) + ' %', smooth(TL.press, TL.press + .3, t), '#ffb070'); });
  } else if (t < TL.slow) {
    volc.visible = true;
    if (t < TL.thick) {
      // F · magma fluido: ríos de lava (La Palma)
      const lt = t - TL.fluid; glow.intensity = 900; emitJet(PS, V3(0, coneH(0) + 1, 0), V3(0, 1, 0), 2500, t, 14, 4, 1.4, EMB, 18); lavaPath(1.2, 7000, t, .06, 3.2); lavaPath(1.9, 6000, t, .055, 3, 9000); lavaPath(.6, 5000, t, .05, 3, 17000); PS.mat.size = 1.3;
      smoke(V3(0, coneH(0) + 4, 0), 1500, t, 40, 6, 6, .2); const az = -.2 + lt * .06; camera.position.set(Math.sin(az) * 110 + 30, 55, Math.cos(az) * 110); camera.lookAt(10, 18, -10);
      hud.push(() => { two('MAGMA LÍQUIDO', 'EL GAS SALE FÁCIL:', 'RÍOS DE LAVA', smooth(.05, .3, lt), 300); callout(V3(Math.cos(1.2) * 40, coneH(40) + 1, Math.sin(1.2) * 40), 120, 260, 'COMO EN LA PALMA', '2021', smooth(1.2, 1.6, lt), '#ffb070'); });
    } else {
      // G · magma espeso: el gas queda atrapado… y revienta
      const lt = t - TL.thick; const boom = TL.thick + 1.4; const k = smooth(boom, boom + .4, t); craterGlow.visible = t > boom; glow.intensity = t < boom ? 100 + lt * 150 : 2000 * (1 - smooth(boom + 1.5, boom + 3, t) * .5);
      if (t < boom) { shk = lt * .5; smoke(V3(0, coneH(0) + 1, 0), 300, t, 6, 3, 3, .3); } else { const bt = t - boom; for (let i = 0; i < 9000; i++) { const s = PS.seed, q = i * 4; const a = s[q] * 6.283, el = .5 + s[q + 1] * 1.07; const sp = 25 + s[q + 2] * 45; const tt = bt * (.6 + s[q + 3] * .4); const f = Math.max(0, 1 - tt / 3);
          PS.push(Math.cos(a) * Math.cos(el) * sp * tt, coneH(0) + Math.sin(el) * sp * tt - 4.9 * tt * tt, Math.sin(a) * Math.cos(el) * sp * tt, EMB[0] * f, EMB[1] * f, EMB[2] * f); }
        const s2 = SM.seed; const top = 20 + bt * 55; for (let i = 0; i < 9000; i++) { const q = i * 4; const hu = s2[q + 2]; const h = hu * top; const cap = smooth(.75, 1, hu); const R0 = lerp(4 + bt * 4, 10 + bt * 22, cap) * (1 + Math.sin(hu * 20 + t) * .08); const a = s2[q] * 6.283, r = Math.sqrt(s2[q + 1]) * R0; const g = .3 * (.6 + s2[q + 3] * .5) * (1 - hu * .3); const warm = Math.max(0, 1 - hu * 3) * .25; SM.push(Math.cos(a) * r, coneH(0) + h + Math.sin(a * 3 + t) * cap * 4, Math.sin(a) * r, g + warm, g * .9 + warm * .4, g * .85); } shk = Math.max(0, 1.2 - bt * .8); }
      camera.position.set(120, 30, 130); camera.lookAt(0, lerp(30, 60, k), 0); camera.fov = 50; SM.mat.size = 12; SM.mat.opacity = .35; PS.mat.size = 1.2;
      hud.push(() => { two('MAGMA ESPESO', 'EL GAS QUEDA ATRAPADO…', 'Y REVIENTA', smooth(.05, .3, lt), 300); });
    }
  } else if (t < TL.ash) {
    volc.visible = true;
    if (t < TL.pyro) {
      // H · la lava avanza despacio: se puede escapar andando
      const lt = t - TL.slow; walker.visible = true; const front = 70 + lt * .9; lavaPath(-.6, 4000, t, .03, 6, 0, front - 4); glow.intensity = 12; glow.position.set(Math.cos(-.6) * front, coneH(front) + 6, Math.sin(-.6) * front);
      const wr = front + 6 + lt * 1.2; walker.position.set(Math.cos(-.6) * wr, 0, Math.sin(-.6) * wr); walker.position.y = terrH(walker.position.x, walker.position.z); walker.rotation.y = .6; walker.scale.setScalar(1.6); const sw = Math.sin(t * 7) * .5; walker.userData['leg-1'].rotation.z = sw; walker.userData.leg1.rotation.z = -sw; walker.userData['arm-1'].rotation.z = -sw * .7; walker.userData.arm1.rotation.z = sw * .7;
      const C = walker.position.clone().add(V3(-3.3, .8, 2.3)); camera.position.copy(C).add(V3(14.7, 7, 21.5)); camera.lookAt(C); camera.fov = 44; PS.mat.size = .5;
      for (let i = 0; i < 2500; i++) { const s = PS.seed, q = (i + 20000) * 4; const a = -.6 + (s[q] - .5) * .1, rr = front - s[q + 1] * 3; PS.push(Math.cos(a) * rr, terrH(Math.cos(a) * rr, Math.sin(a) * rr) + .3 + s[q + 2] * .5, Math.sin(a) * rr, 1.6, .55, .15); }
      hud.push(() => { two(null, 'LA LAVA SUELE IR DESPACIO', 'A POCOS KM/H', smooth(.05, .3, lt), 300); stamp('SE PUEDE ESCAPAR ANDANDO', W / 2, 1650, smooth(2.2, 2.5, lt), -.04, '#7fe08a', 46); });
    } else {
      // I · la nube ardiente: >100 km/h y cientos de grados
      const lt = t - TL.pyro; glow.intensity = 700; const phi = .9; const head = 8 + lt * 26; const s = SM.seed;
      for (let i = 0; i < 12000; i++) { const q = i * 4; const u = Math.pow(s[q], .7); const r = 6 + u * head; const a = phi + (s[q + 1] - .5) * (.35 + 14 / Math.max(r, 6)); const h = coneH(r) + 2 + s[q + 2] * (5 + u * 12) + Math.sin(t * 3 + i) * .6; const g = .28 * (.75 + s[q + 3] * .4); SM.push(Math.cos(a) * r, h, Math.sin(a) * r, g, g * .9, g * .85); }
      for (let i = 0; i < 5000; i++) { const q = i * 4; const u = Math.pow(PS.seed[q], .7); const r = 6 + u * head; const a = phi + (PS.seed[q + 1] - .5) * (.3 + 12 / Math.max(r, 6)); PS.push(Math.cos(a) * r, coneH(r) + 1, Math.sin(a) * r, 2, .7, .2); }
      SM.mat.size = 5.5; erupt(.5); const H0 = V3(Math.cos(phi) * head, coneH(head), Math.sin(phi) * head); camera.position.set(Math.cos(phi + .9) * 150, 40, Math.sin(phi + .9) * 150); camera.lookAt(H0.x * .5, 18, H0.z * .5); camera.fov = 50;
      const kmh = Math.round(lerp(60, 140, smooth(TL.pyro + .5, TL.pyro + 3, t)));
      hud.push(() => { two('LO PELIGROSO', 'LA NUBE ARDIENTE', 'GAS Y CENIZA A CIENTOS DE °C', smooth(.05, .3, lt), 300); bigStat('BAJA A', kmh + ' km/h', 1620, smooth(1.4, 1.8, lt), .5); });
    }
  } else if (t < TL.planes) {
    // J · la ceniza al microscopio: roca y vidrio triturados
    const lt = t - TL.ash; mic.visible = true; shards.forEach(m => { m.rotation.x += 0; m.rotation.set(m.rotation.x, m.rotation.y, m.rotation.z); }); mic.rotation.set(0, lt * .12, 0);
    shards.forEach((m, i) => { m.rotation.x = i + t * m.userData.spin.x; m.rotation.y = i * 2 + t * m.userData.spin.y; });
    camera.position.copy(MIC).add(V3(0, 0, lerp(16, 12, lt / 5))); camera.lookAt(MIC); scene.fog.density = 0; skyMat.uniforms.uTop.value.setRGB(.06, .05, .05); skyMat.uniforms.uHor.value.setRGB(.12, .1, .09); hemi.intensity = 2.4; moon.intensity = 3.5;
    hud.push(() => { two(null, '¿Y LA CENIZA?', 'NO ES CENIZA', win(t, TL.ash, TL.glass), 300); two(null, 'ES ROCA Y CRISTAL', 'TRITURADOS', smooth(TL.glass, TL.glass + .3, t), 300); stamp('CORTAN COMO VIDRIO', W / 2, 1650, smooth(TL.glass + 1.2, TL.glass + 1.5, t), -.04, '#ff6a4a', 52);
      txt('× 1.000', W - 150, 1840, 34, { font: 'Montserrat', weight: 800, alpha: smooth(.3, .6, lt), fill: '#9fd0ff' }); });
  } else if (t < TL.count) {
    // K · 2010: Islandia deja en tierra los aviones de media Europa
    const lt = t - TL.planes; air.visible = true; scene.fog.density = .006; scene.fog.color.setRGB(.42, .4, .38); skyMat.uniforms.uTop.value.setRGB(.3, .3, .3); skyMat.uniforms.uHor.value.setRGB(.5, .48, .45); hemi.intensity = 1.6; moon.intensity = 1.2;
    smoke(AIR.clone().add(V3(-60, 40, -80)), 8000, t, 20, 120, 12, .42, 0, V3(3, 0, 1)); SM.mat.size = 14; SM.mat.opacity = .5;
    camera.position.copy(AIR).add(V3(lerp(40, 25, lt / 4), 18, 90)); camera.lookAt(AIR.clone().add(V3(-35, 6, 0))); camera.fov = 48;
    hud.push(() => { two('2010 · ISLANDIA', 'UN VOLCÁN PARÓ LOS AVIONES', 'DE MEDIA EUROPA', smooth(.05, .3, lt), 300); stamp('CANCELADO', W / 2, 1450, smooth(1.2, 1.5, lt), -.08, '#ff6a4a', 70); txt('≈ 100.000 vuelos en una semana', W / 2, 1620, 36, { font: 'Montserrat', weight: 700, alpha: smooth(1.8, 2.2, lt), fill: '#ffe2c0' }); });
  } else if (t < TL.brand) {
    if (t < TL.sea) {
      // L · unos 1 300 volcanes activos
      const lt = t - TL.count; globe.visible = true; globe.rotation.y = 1.2 + lt * .25; scene.fog.density = 0; skyMat.uniforms.uTop.value.setRGB(0, 0, .01); skyMat.uniforms.uHor.value.setRGB(.01, .01, .03); hemi.intensity = 1.2; moon.intensity = 2.2;
      const n = Math.floor(VOLDOTS.length * smooth(TL.count + .3, TL.count + 2.2, t)); for (let i = 0; i < n; i++) { const p = VOLDOTS[i].clone().applyEuler(globe.rotation).add(GLB); for (let j = 0; j < 3; j++) PS.push(p.x, p.y, p.z, 2.6, 1, .3); } PS.mat.size = .25;
      camera.position.copy(GLB).add(V3(0, 4, 34)); camera.lookAt(GLB.clone().add(V3(0, -1, 0))); camera.fov = 44;
      hud.push(() => { two(null, 'EN LA TIERRA HAY UNOS', '1.300 VOLCANES ACTIVOS', smooth(.05, .3, lt), 300); bigStat('ACTIVOS EN TIERRA', fmtK(Math.round(1300 * smooth(TL.count + .3, TL.count + 2.2, t))), 1640, smooth(.3, .6, lt), .5); });
    } else {
      // M · bajo el mar: dorsales oceánicas
      const lt = t - TL.sea; seaG.visible = true; scene.fog.density = .025; scene.fog.color.setRGB(.01, .05, .1); skyMat.uniforms.uTop.value.setRGB(.01, .05, .1); skyMat.uniforms.uHor.value.setRGB(.01, .05, .1); hemi.intensity = 1.2; moon.intensity = 1; glow.intensity = 300; glow.position.copy(SEA).add(V3(0, 3, 0));
      emitRise(PS, SEA.clone().add(V3(0, -2.5, 0)), 3000, t, 40, 20, 4, [.6, .8, 1.1]); for (let i = 0; i < 6; i++) smoke(SEA.clone().add(V3(-30 + i * 11, 4 + i % 3, 7 + (i % 2) * 4)), 600, t, 14, 1.5, 4, .06, i * 600); SM.mat.size = 2.5; PS.mat.size = .18;
      camera.position.copy(SEA).add(V3(lerp(-14, 0, lt / 4), 16, 24)); camera.lookAt(SEA.clone().add(V3(0, -3, 0))); camera.fov = 48;
      hud.push(() => { two(null, 'LA MAYOR PARTE OCURRE', 'BAJO EL MAR', smooth(.05, .3, lt), 300); callout(SEA.clone().add(V3(5, -2.8, 0)), 140, 280, 'DORSAL OCEÁNICA', 'el fondo se abre y sale magma', smooth(.8, 1.2, lt), '#ffb070'); });
    }
  } else {
    // N · marca: el volcán de noche
    const lt = t - TL.brand; volc.visible = true; erupt(.6); lavaPath(-.6, 3000, t, .05, 2.5); PS.mat.size = 1.6; const az = 2.2 + lt * .04; camera.position.set(Math.sin(az) * 190, 26, Math.cos(az) * 190); camera.lookAt(0, 40, 0); fade = Math.min(.45, lt * .45);
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  if (shk > 0) { camera.position.x += (Math.sin(t * 61) + Math.sin(t * 37)) * shk * .5; camera.position.y += Math.cos(t * 53) * shk * .5; }
  sky.position.copy(camera.position); PS.end(); SM.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, bloom: bloomS, expo });
}
const fmtK = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
function renderCover() { renderFrame(1.2); coverText('¿QUÉ HAY DEBAJO', 'DE UN VOLCÁN?', 'y por qué unos explotan y otros no'); }
window.renderCover = () => { renderCover(); return true; };
window.OBJ = { PS, SM, scene };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
