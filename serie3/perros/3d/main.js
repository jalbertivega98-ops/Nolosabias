// NO LO SABÍAS — «Cuando tu perro te mira a los ojos» (vídeo 3D de la serie de perros)
// Datos: Nagasawa et al. 2015 (Science): la mirada mutua perro–dueño sube la oxitocina de ambos; no en lobos criados por humanos.
// Murata et al. 2022 (Current Biology): aumenta el volumen de lágrimas al reencontrarse con el dueño, no con conocidos.
// Olfato: ~300 millones de receptores olfativos en el perro frente a ~6 millones en humanos; cada fosa nasal muestrea por separado.
// Hipótesis de A. Horowitz: el perro «huele el tiempo» por el decaimiento del olor del dueño. Perros de alerta de hipoglucemia.
// La trufa tiene un patrón de surcos único (identificación por huella nasal).
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3, renderer, g2, camera, SOFT, Particles, txt, copperGrad, project, fmt,
  callout, titleHUD, bar, fract, camOrbit, arrowXY, bigStat, drawBrand, coverText, finish, noise1 } from '../../lib/core.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildDog, GOLDEN, WOLF, NOSETEX } from './dog.js';

const pm = new THREE.PMREMGenerator(renderer); const ENV = pm.fromScene(new RoomEnvironment(), .04).texture;
const scene = new THREE.Scene();
// fondo: degradado azul profundo de la serie
const bg = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
  uniforms: { uWarm: { value: 0 } },
  vertexShader: `varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform float uWarm; varying vec3 vD; void main(){ float y=vD.y*.5+.5; vec3 c=mix(vec3(.004,.01,.03),vec3(.03,.07,.14),pow(y,1.3));
    c+=vec3(.35,.16,.06)*pow(max(dot(vD,normalize(vec3(-.6,.3,-.7))),0.),6.)*.25; c=mix(c,c*vec3(1.6,1.05,.7),uWarm); gl_FragColor=vec4(c,1.); }` }));
scene.add(bg);
scene.add(new THREE.HemisphereLight(0xbfd4ff, 0x302010, .55));
const key = new THREE.DirectionalLight(0xffe0c0, 2.2); scene.add(key);
const rimL = new THREE.DirectionalLight(0xffa060, 2.2); scene.add(rimL);

const QP = new URLSearchParams(location.search); const OPT = { shells: +(QP.get('sh') || 8), furLen: .05, dens: 120, env: ENV };
const dog = buildDog(GOLDEN, OPT); scene.add(dog.root);
const wolf = buildDog(WOLF, OPT); scene.add(wolf.root);
function furLight(D, k, rim) { D.fur.uKey.value.copy(k).normalize(); D.fur.uRimC.value.copy(rim); }

// polvo flotante
const DUST = new Particles(1400, { size: .05, seed: 5 }); scene.add(DUST.obj);
const P = new Particles(9000, { size: .04, seed: 9 }); scene.add(P.obj);

// ---------- molécula de oxitocina (estilizada: anillo de 6 aminoácidos con puente disulfuro + cola de 3) ----------
const mol = new THREE.Group(); scene.add(mol);
{ const r = rng(21); const atoms = []; const ring = 20;
  for (let i = 0; i < ring; i++) { const a = i / ring * Math.PI * 2; atoms.push(V3(Math.cos(a) * 1.6 + (r() - .5) * .25, Math.sin(a) * 1.25 + (r() - .5) * .25, (r() - .5) * .7)); }
  let p = atoms[5].clone(); for (let i = 0; i < 12; i++) { p = p.clone().add(V3(.32 + r() * .2, -.38 - r() * .1, (r() - .5) * .5)); atoms.push(p); }
  // ramas laterales
  const n0 = atoms.length; for (let i = 0; i < n0; i += 3) { const q = atoms[i].clone(); const d = q.clone().setZ(0).normalize(); atoms.push(q.clone().addScaledVector(d, .55).add(V3(0, 0, (r() - .5) * .6))); }
  const cols = [0xffd2a8, 0x7fc8ff, 0xff7a4a, 0xf0f0f0];
  atoms.forEach((a, i) => { const s = i === 0 || i === 6 ? 1 : 0; const m = new THREE.Mesh(new THREE.SphereGeometry(s ? .2 : .15, 20, 14), new THREE.MeshStandardMaterial({ color: s ? 0xffd040 : cols[i % 4], emissive: s ? 0x806010 : 0x000000, roughness: .3, metalness: .2, envMap: ENV })); m.position.copy(a); mol.add(m); });
  const stick = (a, b, c = 0xc89a78) => { const d = b.clone().sub(a); const m = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, d.length(), 8), new THREE.MeshStandardMaterial({ color: c, roughness: .5, envMap: ENV }));
    m.position.copy(a).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); mol.add(m); };
  for (let i = 0; i < ring; i++) stick(atoms[i], atoms[(i + 1) % ring]);
  for (let i = ring; i < ring + 12; i++) stick(atoms[i === ring ? 5 : i - 1], atoms[i]);
  for (let i = 0, k = n0; i < n0; i += 3, k++) stick(atoms[i], atoms[k]);
  stick(atoms[0], atoms[6], 0xffd040);
  mol.userData.atoms = atoms; }
mol.visible = false;

// ---------- utilidades ----------
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
const inA = (t, a, b, f = .3) => smooth(a, a + f, t) * (1 - smooth(b - f, b, t));
const _v = V3(0, 0, 0);
function aimEyes(D, target, k = 1) { D.eyes.forEach(e => { e.updateWorldMatrix(true, false); const loc = e.parent.worldToLocal(target.clone()); const dir = loc.sub(e.position).normalize(); const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 0, 1), dir); e.quaternion.identity().slerp(q, k); }); }
function idle(D, t, amp = 1) { D.head.rotation.x = noise1(t * .35) * .04 * amp; D.head.rotation.y = noise1(t * .3 + 9) * .05 * amp; D.head.position.y = Math.sin(t * 1.6) * .012 * amp; }
function earsPerk(D, k) { D.ears.forEach((e, i) => { const s = i ? 1 : -1; e.rotation.x = -k * .35; e.rotation.z = s * (.1 + k * .18); }); }
function place(D, pos, ry, rz = 0) { D.root.position.copy(pos); D.root.rotation.set(0, ry, rz); D.root.visible = true; }
function setTears(k) { dog.tearMat.opacity = k * .9; dog.tears.forEach(m => m.scale.set(1, 1, 1 + k * .6)); dog.drops.forEach((m, i) => { m.visible = k > .02; m.scale.setScalar(.3 + k * .9); m.scale.y *= 1.3; }); }
function stamp(s, x, y, a, rot = -.06, col = '#ff7a5a') { if (a <= .01) return; g2.save(); g2.translate(x, y); g2.rotate(rot); g2.globalAlpha = a; g2.strokeStyle = col; g2.lineWidth = 6; g2.font = '800 52px Montserrat'; const w = g2.measureText(s).width + 70;
  g2.strokeRect(-w / 2, -48, w, 96); g2.restore(); txt(s, x, y + 2, 52, { font: 'Montserrat', weight: 800, alpha: a, fill: col }); }
function question(l1, l2, a, y = 330) { if (a <= .01) return; txt(l1, W / 2, y, 50, { font: 'Montserrat', weight: 800, alpha: a, spacing: 1 }); txt(l2, W / 2, y + 66, 60, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(160, 920, y + 66, .5), spacing: 1 }); }
function cite(s, a) { txt(s, W / 2, 1800, 22, { weight: 300, alpha: a * .6, spacing: 2 }); }
function meter(x, label, frac, a, col = '#e3a372', note) { if (a <= .01) return; const y0 = 1180, h = 420, w = 110;
  g2.save(); g2.globalAlpha = a * .35; g2.fillStyle = '#ffffff'; g2.fillRect(x - w / 2, y0 - h, w, h); g2.globalAlpha = a; g2.fillStyle = col; g2.shadowColor = col; g2.shadowBlur = 25; g2.fillRect(x - w / 2, y0 - h * clamp(frac), w, h * clamp(frac)); g2.restore();
  txt(label, x, y0 + 46, 30, { font: 'Montserrat', weight: 800, alpha: a, spacing: 3 }); if (note) txt(note, x, y0 - h - 40, 26, { alpha: a, fill: col, spacing: 2 }); }
function humanProfile(x, y, s, a) { if (a <= .01) return; g2.save(); g2.translate(x, y); g2.scale(-s, s); g2.globalAlpha = a;
  g2.beginPath(); g2.moveTo(40, -330); g2.bezierCurveTo(-60, -330, -120, -250, -118, -150); g2.bezierCurveTo(-118, -110, -128, -95, -150, -60); g2.lineTo(-122, -48); g2.bezierCurveTo(-124, -20, -130, 0, -115, 10);
  g2.bezierCurveTo(-130, 25, -120, 40, -112, 52); g2.bezierCurveTo(-110, 90, -60, 110, -10, 100); g2.lineTo(10, 220); g2.lineTo(200, 260); g2.bezierCurveTo(200, 0, 200, -330, 40, -330); g2.closePath();
  const gr = g2.createLinearGradient(-150, 0, 200, 0); gr.addColorStop(0, '#1a2a44'); gr.addColorStop(1, '#05080f'); g2.fillStyle = gr; g2.fill();
  g2.strokeStyle = '#e3a372'; g2.lineWidth = 4; g2.shadowColor = '#e3a372'; g2.shadowBlur = 20; g2.stroke();
  g2.fillStyle = '#ffe2c0'; g2.beginPath(); g2.ellipse(-80, -150, 14, 9, 0, 0, 7); g2.fill(); g2.restore(); }
function gazeBeam(x0, y0, x1, y1, t, a) { if (a <= .01) return; g2.save(); g2.globalAlpha = a; for (let i = 0; i < 26; i++) { const u = fract(i / 26 + t * .35); const v = fract(i / 26 * 7.3 - t * .35);
  for (const [p, q, c] of [[u, 0, '#ffd0a0'], [v, 1, '#9fd8ff']]) { const xx = lerp(x0, x1, q ? 1 - p : p), yy = lerp(y0, y1, q ? 1 - p : p) + Math.sin(p * 9 + t * 3) * 10; g2.fillStyle = c; g2.shadowColor = c; g2.shadowBlur = 16; g2.beginPath(); g2.arc(xx, yy, 5 + 3 * Math.sin(p * Math.PI), 0, 7); g2.fill(); } } g2.restore(); }
function heart(x, y, s, a) { if (a <= .01) return; g2.save(); g2.translate(x, y); g2.scale(s, s); g2.globalAlpha = a; g2.fillStyle = copperGrad(-60, 60, 0, .5); g2.shadowColor = '#ff9a60'; g2.shadowBlur = 40;
  g2.beginPath(); g2.moveTo(0, 30); g2.bezierCurveTo(-70, -15, -40, -70, 0, -38); g2.bezierCurveTo(40, -70, 70, -15, 0, 30); g2.fill(); g2.restore(); }
function graph(pts, a, k, x0 = 140, y0 = 380, w = 800, h = 380, col = '#e3a372') { if (a <= .01) return; g2.save(); g2.globalAlpha = a * .5; g2.fillStyle = '#05080d'; g2.fillRect(x0 - 40, y0 - 70, w + 80, h + 130);
  g2.globalAlpha = a * .4; g2.strokeStyle = '#fff'; g2.lineWidth = 2; g2.beginPath(); g2.moveTo(x0, y0 + h); g2.lineTo(x0 + w, y0 + h); g2.stroke();
  g2.globalAlpha = a; g2.strokeStyle = col; g2.lineWidth = 7; g2.shadowColor = col; g2.shadowBlur = 18; g2.beginPath(); const n = Math.max(2, Math.round(pts.length * k));
  for (let i = 0; i < n; i++) { const [u, v] = pts[i]; const X = x0 + u * w, Y = y0 + (1 - v) * h; i ? g2.lineTo(X, Y) : g2.moveTo(X, Y); } g2.stroke(); g2.restore(); return pts[n - 1]; }
function fingerprint(cx, cy, R, a, t) { if (a <= .01) return; g2.save(); g2.globalAlpha = a; g2.strokeStyle = '#e3a372'; g2.lineWidth = 4; g2.shadowColor = '#e3a372'; g2.shadowBlur = 12;
  for (let i = 1; i < 22; i++) { const r0 = i / 22 * R; g2.beginPath(); for (let k = 0; k <= 90; k++) { const ang = k / 90 * Math.PI * 2; const w = 1 + .12 * Math.sin(ang * 2 + i * .3) + .05 * Math.sin(ang * 5 + i); const yy = Math.sin(ang) * r0 * w * 1.25 - (ang > Math.PI ? r0 * .15 : 0);
    const X = cx + Math.cos(ang) * r0 * w, Y = cy + yy; k ? g2.lineTo(X, Y) : g2.moveTo(X, Y); if (k > 90 * clamp(t * 1.3 - i / 40)) break; } g2.stroke(); } g2.restore(); }

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .05; camera.far = 1000; camera.fov = 35;
  let bloomS = .35, flash = 0, ca = .0013, fade = 0, grain = .035, expo = 1;
  P.begin(); DUST.begin(); P.mat.size = .04; mol.visible = false; dog.root.visible = false; wolf.root.visible = false; setTears(0); earsPerk(dog, 0); earsPerk(wolf, 0);
  bg.material.uniforms.uWarm.value = 0;
  key.position.set(3, 4, 5); rimL.position.set(-4, 2, -3); furLight(dog, V3(.6, .7, .9), new THREE.Color(1, .75, .5)); furLight(wolf, V3(.6, .7, .9), new THREE.Color(.8, .85, 1));
  for (const c of ['mother', 'y2015', 'rise', 'wolf', 'tears', 'smell', 'stereo', 'time', 'sugar', 'nose', 'you', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];
  // polvo en suspensión alrededor del origen
  for (let i = 0; i < 1400; i++) { const s = DUST.seed, k = i * 4; const x = (s[k] - .5) * 12, y = (s[k + 1] - .5) * 14 + Math.sin(t * .2 + i) * .3, z = (s[k + 2] - .5) * 10 + fract(s[k + 3] + t * .01) * 2; const f = .25 * s[k + 3]; DUST.push(x, y, z, f, f * .8, f * .6); }

  if (t < TL.y2015) {
    // A · gancho: te mira fijamente a los ojos
    const lt = t; place(dog, V3(0, 0, 0), 0); idle(dog, t, .6); fade = 1 - smooth(0, .35, t);
    const k = easeInOut(clamp(lt / TL.y2015)); camera.position.set(lerp(2.6, 1.5, k), lerp(.5, .3, k), lerp(7.6, 5.6, k)); camera.lookAt(.05, lerp(.25, .3, k), .6);
    aimEyes(dog, camera.position); earsPerk(dog, smooth(.4, 1.0, lt) * .4);
    hud.push(() => { question('CUANDO TU PERRO', 'TE MIRA A LOS OJOS…', smooth(0, .25, lt) * (1 - smooth(TL.mother - .2, TL.mother + .1, lt)), 270);
      titleHUD('EN TU CUERPO PASA LO MISMO QUE', 'ENTRE UNA MADRE Y SU BEBÉ', smooth(TL.mother + .1, TL.mother + .4, lt), 1430);
      heart(W / 2, 470, lerp(.6, 1, easeOut(smooth(TL.mother + .2, TL.mother + .8, lt))) * (1 + .06 * Math.sin(t * 7)), smooth(TL.mother + .2, TL.mother + .5, lt)); });
  } else if (t < TL.rise) {
    // B · la oxitocina (Japón, 2015)
    const lt = t - TL.y2015; mol.visible = true; mol.position.set(0, -.25, 0); mol.rotation.set(.3 + lt * .05, lt * .35, .1); mol.scale.setScalar(lerp(.7, 1, easeOut(smooth(0, 1.2, lt))));
    camera.position.set(0, .2, lerp(10.5, 9.5, lt / 5)); camera.lookAt(0, -.1, 0); bloomS = .7;
    for (let i = 0; i < 900; i++) { const s = P.seed, k = i * 4; const a = s[k] * 6.283 + t * .2, r = 2.5 + s[k + 1] * 2.5; const f = .4 * s[k + 2]; P.push(Math.cos(a) * r, (s[k + 3] - .5) * 6, Math.sin(a) * r * .5, f, f * .7, f * .5); } P.mat.size = .06;
    hud.push(() => { txt('JAPÓN · 2015', W / 2, 300, 26, { spacing: 8, alpha: smooth(0, .3, lt), fill: '#e3a372' });
      bigStat('LA HORMONA DEL APEGO', 'OXITOCINA', 1430, smooth(.6, 1.0, lt) * 1, .3 + lt * .15);
      txt('EN PERROS… Y EN SUS DUEÑOS', W / 2, 1560, 34, { weight: 600, spacing: 3, alpha: smooth(2.8, 3.2, lt) });
      cite('Nagasawa et al. · Science, 2015', smooth(.5, 1, lt)); });
  } else if (t < TL.tears) {
    // C/D · mirada mutua: los dos medidores suben… con el lobo no
    const lt = t - TL.rise; const isWolf = t >= TL.wolf; const D = isWolf ? wolf : dog;
    place(D, V3(-.3, -.55, 0), .95); idle(D, t, .5); camera.position.set(.9, .2, 10.5); camera.lookAt(.9, -.1, 0); camera.fov = 38;
    const hx = 880, hy = 860, hs = .78; aimEyes(D, V3(6, .9, 2));
    const g1 = isWolf ? .1 : lerp(.1, .6, easeOut(smooth(.6, TL.more - TL.rise, lt))) + lerp(0, .32, easeOut(smooth(TL.more - TL.rise, TL.wolf - TL.rise - .2, lt)));
    const g2v = isWolf ? .1 + .015 * Math.sin(t * 3) : g1 * .95; const col = isWolf ? '#9fd8ff' : '#e3a372';
    hud.push(() => { const a = smooth(0, .3, lt); D.eyes[1].updateWorldMatrix(true, false); const ep = project(D.eyes[1].getWorldPosition(V3(0, 0, 0)));
      humanProfile(hx, hy, hs, a); gazeBeam(ep.x + 20, ep.y - 10, hx + 80 * hs - 20, hy - 150 * hs, t, a * (isWolf ? .3 : 1));
      txt(isWolf ? 'LOBO CRIADO POR PERSONAS' : 'MIRADA MUTUA', W / 2, 250, 30, { spacing: 7, alpha: a, fill: col });
      bar(180, 1330, 720, g1, isWolf ? 'OXITOCINA · LOBO' : 'OXITOCINA · PERRO', isWolf ? '=' : '+', a, col); bar(180, 1440, 720, g2v, 'OXITOCINA · DUEÑO', isWolf ? '=' : '+', a, col);
      if (!isWolf) titleHUD(lt < TL.more - TL.rise ? 'DESPUÉS DE MIRARSE UN RATO' : 'CUANTO MÁS SE MIRAN', lt < TL.more - TL.rise ? 'A LOS DOS LES SUBE' : 'MÁS SUBE', smooth(.2, .5, lt), 1540);
      else stamp('NO PASA NADA', W / 2, 1600, smooth(TL.wolf - TL.rise + .6, TL.wolf - TL.rise + .9, lt), -.06, '#9fd8ff'); });
  } else if (t < TL.smell) {
    // E · lágrimas al reencontrarse (2022)
    const lt = t - TL.tears; place(dog, V3(0, 0, 0), 0); idle(dog, t, .3); const k = easeInOut(smooth(0, 3.5, lt));
    const eyeW = V3(-.37, .14, .74); const nt = t >= TL.notyou; camera.fov = 30;
    camera.position.set(lerp(1.0, -.6, k), lerp(.4, .35, k), lerp(7.6, 6.0, k)); camera.lookAt(lerp(.05, -.15, k), lerp(.3, .2, k), .6); aimEyes(dog, camera.position);
    const tk = nt ? 1 - smooth(TL.notyou + .2, TL.notyou + 1.2, t) : smooth(TL.tears + 2.6, TL.tears + 5.5, t); setTears(tk); bloomS = .45;
    // destello húmedo
    for (let i = 0; i < 60; i++) { const s = P.seed, k2 = i * 4; const a = s[k2] * Math.PI + Math.PI * .1; const f = tk * .6 * (.5 + .5 * Math.sin(t * 4 + i)); P.push(-.37 + Math.cos(a) * .19, .14 - Math.sin(a) * .17 - .02, .86, f, f, f * 1.1); } P.mat.size = .012;
    hud.push(() => { txt('2022 · DESCUBRIMIENTO', W / 2, 260, 26, { spacing: 8, alpha: smooth(0, .3, lt), fill: '#e3a372' });
      question('AL REENCONTRARTE', 'SE LE LLENAN LOS OJOS', smooth(.3, .6, lt) * (1 - smooth(TL.notyou - TL.tears - .2, TL.notyou - TL.tears, lt)), 330);
      bar(180, 1500, 720, tk, 'LÁGRIMAS', nt ? 'CONOCIDO' : 'DUEÑO', smooth(2.4, 2.8, lt));
      stamp('CON OTRA PERSONA: NO', W / 2, 360, smooth(TL.notyou - TL.tears + .2, TL.notyou - TL.tears + .5, lt), -.05, '#9fd8ff');
      cite('Murata et al. · Current Biology, 2022', smooth(.5, 1, lt)); });
  } else if (t < TL.time) {
    // F · te está oliendo: 300 millones de receptores; huele en estéreo
    const lt = t - TL.smell; place(dog, V3(0, 0, 0), 0); idle(dog, t, .3); const st = t >= TL.stereo; const sz = 1.38 + (GOLDEN.snoutLen - 1) * .9 + .3;
    const N0 = V3(0, -.17, sz); camera.fov = 32;
    if (!st) { const k = easeInOut(smooth(0, 2.5, lt)); camera.position.set(lerp(2.6, 2.0, k), lerp(.4, .25, k), lerp(7.2, 6.2, k)); camera.lookAt(lerp(0, .1, k), lerp(.2, .1, k), lerp(.8, 1.2, k)); }
    else { const k = easeInOut(smooth(TL.stereo, TL.stereo + 1.2, t)); camera.position.set(0, lerp(.3, .25, k), lerp(6.4, 5.6, k)); camera.lookAt(0, .1, 1.4); }
    aimEyes(dog, camera.position);
    // olor: hilos de partículas que entran por la nariz
    for (let i = 0; i < 4500; i++) { const s = P.seed, k = i * 4; const side = s[k + 3] < .5 ? -1 : 1; const age = fract(s[k] + t * .45);
      const src = st ? V3(side * 2.2, (s[k + 1] - .5) * .9, sz + 1.6 + (s[k + 2] - .5) * .6) : V3((s[k + 1] - .5) * 2.5, (s[k + 2] - .5) * 1.6, sz + 2.2);
      const dst = V3(side * .095, -.19, sz + .12); const p = src.clone().lerp(dst, easeIn2(age)); p.x += Math.sin(age * 8 + i) * .08 * (1 - age); p.y += Math.cos(age * 7 + i * .3) * .06 * (1 - age);
      const c = st ? (side < 0 ? [.35, .75, 1.4] : [1.5, .8, .35]) : [1.2, .85, .55]; const f = 1.1 * Math.sin(age * Math.PI) * smooth(0, .6, lt); P.push(p.x, p.y, p.z, c[0] * f, c[1] * f, c[2] * f); } P.mat.size = .05;
    hud.push(() => { question('Y MIENTRAS TE MIRA…', 'TE ESTÁ OLIENDO', inA(lt, 0, TL.recep - TL.smell), 300);
      const a = inA(t, TL.recep + .1, TL.stereo); if (a > .01) { txt('RECEPTORES DEL OLFATO', W / 2, 250, 26, { spacing: 7, alpha: a, fill: '#e3a372' });
        const k2 = easeOut(smooth(TL.recep + .3, TL.recep + 2, t)); txt(fmt(300 * k2) + ' MILLONES', W / 2, 340, 80, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(140, 940, 340, .5) });
        g2.save(); g2.globalAlpha = a; g2.fillStyle = '#e3a372'; g2.shadowColor = '#e3a372'; g2.shadowBlur = 20; g2.fillRect(140, 410, 800 * k2, 26); g2.restore(); txt('PERRO', 140, 470, 26, { align: 'left', spacing: 4, alpha: a });
        const b = smooth(TL.recep + 2.6, TL.recep + 3.0, t); g2.save(); g2.globalAlpha = b; g2.fillStyle = '#9fd8ff'; g2.fillRect(140, 520, 800 * 6 / 300 * Math.max(k2, .001) / Math.max(k2, .001), 26); g2.restore();
        txt('TÚ · 6 MILLONES', 190, 533, 28, { align: 'left', font: 'Montserrat', weight: 800, alpha: b, fill: '#9fd8ff' }); }
      const s2 = smooth(TL.stereo + .2, TL.stereo + .5, t); if (s2 > .01) { titleHUD('CADA FOSA NASAL HUELE POR SEPARADO', 'HUELE EN ESTÉREO', s2, 1450);
        txt('IZQ.', 170, 1130, 40, { font: 'Montserrat', weight: 800, alpha: s2, fill: '#9fd8ff' }); txt('DCHA.', 910, 1130, 40, { font: 'Montserrat', weight: 800, alpha: s2, fill: '#ffb27a' }); } });
  } else if (t < TL.sugar) {
    // G · «huele el tiempo»: tu olor se apaga a lo largo del día (hipótesis)
    const lt = t - TL.time; place(dog, V3(0, -.9, 0), .5); idle(dog, t, .5); dog.root.scale.setScalar(.9); earsPerk(dog, smooth(TL.sugar - 1.6, TL.sugar - .6, t));
    camera.position.set(1.4, .6, 8.8); camera.lookAt(.3, .3, 0); aimEyes(dog, V3(4, 1, 6));
    const day = clamp(lt / (TL.sugar - TL.time - .3)); const scent = lerp(1, .12, easeInOut(day));
    for (let i = 0; i < 3500; i++) { const s = P.seed, k = i * 4; if (s[k + 3] > scent) continue; const a = s[k] * 6.283 + t * .1, r = Math.sqrt(s[k + 1]) * 2.2; const y = 2.3 + (s[k + 2] - .5) * 1.5 + Math.sin(t * .5 + i) * .1;
      const f = .55 * scent; P.push(1.2 + Math.cos(a) * r, y, Math.sin(a) * r * .5, 1.3 * f, .75 * f, .4 * f); } P.mat.size = .05;
    hud.push(() => { const a = smooth(0, .3, lt); txt('HIPÓTESIS · A. HOROWITZ', W / 2, 220, 24, { spacing: 7, alpha: a, fill: '#9fd8ff' });
      // reloj
      const cx = W / 2, cy = 460, R = 150; g2.save(); g2.globalAlpha = a; g2.strokeStyle = '#e3a372'; g2.lineWidth = 5; g2.shadowColor = '#e3a372'; g2.shadowBlur = 16; g2.beginPath(); g2.arc(cx, cy, R, 0, 7); g2.stroke();
      for (let h = 0; h < 12; h++) { const an = h / 12 * 6.283; g2.beginPath(); g2.moveTo(cx + Math.sin(an) * R * .82, cy - Math.cos(an) * R * .82); g2.lineTo(cx + Math.sin(an) * R * .95, cy - Math.cos(an) * R * .95); g2.stroke(); }
      const hr = lerp(8, 18, day); const an = hr / 12 * 6.283, am = (hr % 1) * 6.283 + day * 6.283 * 10; g2.lineWidth = 8; g2.beginPath(); g2.moveTo(cx, cy); g2.lineTo(cx + Math.sin(an) * R * .5, cy - Math.cos(an) * R * .5); g2.stroke();
      g2.lineWidth = 4; g2.beginPath(); g2.moveTo(cx, cy); g2.lineTo(cx + Math.sin(am) * R * .8, cy - Math.cos(am) * R * .8); g2.stroke(); g2.restore();
      const hh = Math.floor(hr), mm = Math.floor((hr % 1) * 60); txt(String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0'), cx, cy + R + 60, 44, { font: 'Montserrat', weight: 800, alpha: a });
      bar(180, 1430, 720, scent, 'TU OLOR EN CASA', Math.round(scent * 100) + ' %', smooth(.4, .8, lt));
      titleHUD('CUANDO SE APAGA LO SUFICIENTE…', '«YA ESTÁ A PUNTO DE VOLVER»', smooth(TL.sugar - TL.time - 3.2, TL.sugar - TL.time - 2.8, lt), 1560); });
  } else if (t < TL.nose) {
    // H · perros de alerta: te avisan de la bajada de azúcar
    const lt = t - TL.sugar; place(dog, V3(0, -.35, 0), -.35 + smooth(.8, 1.6, lt) * .35); idle(dog, t, .4); earsPerk(dog, smooth(1.4, 2, lt));
    camera.position.set(-.5, .3, 7.4); camera.lookAt(0, .45, .3); aimEyes(dog, camera.position, smooth(.8, 1.6, lt));
    const pts = []; for (let i = 0; i <= 60; i++) { const u = i / 60; pts.push([u, .75 - .55 * smooth(.25, 1, u) + .02 * Math.sin(u * 30)]); }
    hud.push(() => { const a = smooth(0, .3, lt); const k = easeInOut(smooth(.2, 4.2, lt)); const p = graph(pts, a, k, 140, 300, 800, 300);
      txt('AZÚCAR EN SANGRE', 140, 260, 24, { align: 'left', spacing: 6, alpha: a, fill: '#e3a372' });
      const al = smooth(2.2, 2.4, lt); if (al > .01 && p) { const X = 140 + p[0] * 800, Y = 300 + (1 - p[1]) * 300; for (let r = 0; r < 3; r++) { const rr = fract(t * 1.2 + r / 3); g2.save(); g2.globalAlpha = al * (1 - rr); g2.strokeStyle = '#ff7a5a'; g2.lineWidth = 5; g2.beginPath(); g2.arc(X, Y, 20 + rr * 90, 0, 7); g2.stroke(); g2.restore(); } }
      stamp('¡AVISO!', 780, 800, al, -.08); titleHUD('PERROS DE ALERTA', 'TE AVISAN ANTES QUE TU CUERPO', smooth(.6, .9, lt), 1460); });
  } else if (t < TL.you) {
    // I · la trufa es única, como una huella dactilar
    const lt = t - TL.nose; place(dog, V3(0, 0, 0), 0); idle(dog, t, .2); const sz = 1.38 + (GOLDEN.snoutLen - 1) * .9 + .26; const pr = t >= TL.print;
    const k = easeInOut(smooth(0, 2.4, lt)); camera.fov = 30; camera.position.set(lerp(.6, 0, k), lerp(.25, .05, k), lerp(6.4, sz + 2.6, k)); camera.lookAt(0, lerp(.2, -.05, k), sz);
    aimEyes(dog, camera.position);
    hud.push(() => { question('Y LO ÚLTIMO:', 'SU NARIZ ES ÚNICA', smooth(.1, .4, lt) * (1 - smooth(TL.print - TL.nose + 1.2, TL.print - TL.nose + 1.5, lt)), 300);
      const f = smooth(TL.print - TL.nose + .3, TL.print - TL.nose + 2.5, lt); fingerprint(W / 2, 980, 330, f * .9, f);
      titleHUD('SUS SURCOS NO SE REPITEN', 'COMO TU HUELLA DACTILAR', smooth(TL.print - TL.nose + .2, TL.print - TL.nose + .5, lt), 1520); });
  } else if (t < TL.brand) {
    // J · pregunta a la comunidad (inclina la cabeza)
    const lt = t - TL.you; place(dog, V3(0, -.2, 0), -.25, Math.sin(smooth(.6, 1.4, lt) * Math.PI * .5) * .32 * (1 - smooth(3.6, 4.2, lt) * .5)); idle(dog, t, .3);
    camera.position.set(-.3, .25, 7.0); camera.lookAt(0, .35, .4); aimEyes(dog, camera.position); earsPerk(dog, smooth(.4, 1.0, lt) * .7); bg.material.uniforms.uWarm.value = .3;
    hud.push(() => { question('¿Y TU PERRO?', '¿QUÉ HACE QUE NUNCA', smooth(.1, .4, lt), 260); txt('HAS ENTENDIDO?', W / 2, 460, 60, { font: 'Montserrat', weight: 800, alpha: smooth(.1, .4, lt), fill: copperGrad(160, 920, 460, .5) });
      txt('CUÉNTANOSLO EN COMENTARIOS ↓', W / 2, 1560, 34, { font: 'Montserrat', weight: 800, alpha: smooth(1.2, 1.6, lt), fill: '#e3a372', spacing: 2 }); });
  } else {
    // K · marca
    const lt = t - TL.brand; place(dog, V3(0, -.2, 0), -.25); idle(dog, t, .3); camera.position.set(-.3, .25, 7.0 + lt * .5); camera.lookAt(0, .35 + lt * .15, .4); aimEyes(dog, camera.position);
    expo = .85; fade = Math.min(.72, lt * .6); hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  if (!dog.root.visible) dog.root.scale.setScalar(1);
  if (t < TL.time || t >= TL.sugar) dog.root.scale.setScalar(1);
  P.end(); DUST.end();
  camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); bg.position.copy(camera.position);
  { const a = .55; let gr = g2.createLinearGradient(0, 0, 0, 720); gr.addColorStop(0, `rgba(2,6,14,${a})`); gr.addColorStop(1, 'rgba(2,6,14,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, W, 720);
    gr = g2.createLinearGradient(0, H, 0, H - 720); gr.addColorStop(0, `rgba(2,6,14,${a + .1})`); gr.addColorStop(1, 'rgba(2,6,14,0)'); g2.fillStyle = gr; g2.fillRect(0, H - 720, W, 720); }
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
function easeIn2(x) { return x * x; }
function renderCover() { renderFrame(TL.mother + 1.2); coverText('CUANDO TU PERRO', 'TE MIRA A LOS OJOS', 'Lo que pasa en tu cuerpo (y en el suyo)'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
