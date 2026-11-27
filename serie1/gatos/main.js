// NO LO SABÍAS — "¿Por qué los gatos siempre caen de pie?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final.
// Reflejo de enderezamiento: vestíbulo (oído interno) + vista; modelo «doblar y girar» (Kane & Scher, 1969): dos mitades que giran
// alternando patas recogidas/estiradas, con momento angular total cero. Marey fotografió la caída en 1894.
// Columna muy flexible; clavícula flotante (no articulada con el hombro). Enderezamiento en ~0,3 s.
// Whitney & Mehlhaff (1987), 132 gatos en Nueva York: menos lesiones por encima de ~7 pisos (con sesgo de supervivencia).
// Velocidad terminal de un gato ≈ 100 km/h (60 mph).
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3,
  g2, camera, SOFT, Particles, txt, copperGrad, project, callout, bar, fract, arrowXY, bigStat, drawBrand, coverText, finish } from '../../lib/core.js';

const scene = new THREE.Scene(); scene.background = new THREE.Color(.1, .1, .14);
const hemi = new THREE.HemisphereLight(0xfff4e8, 0x3a3040, 1.5); scene.add(hemi);
const keyL = new THREE.DirectionalLight(0xfff1dc, 2.4); keyL.position.set(3, 6, 5); scene.add(keyL); scene.add(keyL.target);
const rimL = new THREE.DirectionalLight(0x9fc8ff, 1.2); rimL.position.set(-4, 3, -4); scene.add(rimL);
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .7, ...o });

// ==========================================================================
// GATO (atigrado). Eje del cuerpo = x (cabeza hacia +x). Mitad delantera y trasera giran por separado sobre x.
// ==========================================================================
const furTex = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#e08a3a'; x.fillRect(0, 0, 256, 64); x.fillStyle = '#a8551e';
  for (let i = 0; i < 9; i++) { x.beginPath(); x.moveTo(i * 30 + 8, 0); x.quadraticCurveTo(i * 30 + 20, 32, i * 30 + 6, 64); x.lineTo(i * 30 + 16, 64); x.quadraticCurveTo(i * 30 + 30, 32, i * 30 + 18, 0); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })();
function makeCat() { const cat = new THREE.Group(); const fur = new THREE.MeshStandardMaterial({ map: furTex, roughness: .85 }); const belly = M(0xf2e2c8, { roughness: .9 }); const pink = M(0xe89a9a);
  const fr = new THREE.Group(), bk = new THREE.Group(); cat.add(fr, bk);
  const chest = new THREE.Mesh(new THREE.CapsuleGeometry(.075, .16, 8, 16), fur); chest.rotation.z = Math.PI / 2; chest.position.x = .09; fr.add(chest);
  const head = new THREE.Group(); head.position.set(.27, .06, 0); fr.add(head);
  const sk = new THREE.Mesh(new THREE.SphereGeometry(.07, 24, 18), fur); sk.scale.set(1, .9, 1.05); head.add(sk);
  const muz = new THREE.Mesh(new THREE.SphereGeometry(.035, 16, 12), belly); muz.position.set(.055, -.02, 0); muz.scale.set(.8, .7, 1.1); head.add(muz);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(.009, 8, 6), pink); nose.position.set(.085, -.005, 0); head.add(nose);
  for (const s of [-1, 1]) { const ear = new THREE.Mesh(new THREE.ConeGeometry(.03, .06, 4), fur); ear.position.set(-.005, .07, s * .04); ear.rotation.set(s * .3, 0, -.1); head.add(ear);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.013, 12, 8), new THREE.MeshStandardMaterial({ color: 0x9ad04a, emissive: 0x2a4a08, roughness: .2 })); eye.position.set(.055, .02, s * .03); head.add(eye);
    const pup = new THREE.Mesh(new THREE.SphereGeometry(.006, 8, 6), M(0x050505)); pup.position.set(.066, .02, s * .03); pup.scale.set(.6, 1.4, .6); head.add(pup); }
  const canals = new THREE.Group(); head.add(canals); canals.position.set(-.01, .01, .045); for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(.018, .003, 8, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(.4, 1.4, 2.2), transparent: true, depthTest: false })); r.rotation.set(i === 0 ? Math.PI / 2 : 0, i === 1 ? Math.PI / 2 : 0, 0); canals.add(r); } canals.visible = false;
  const hip = new THREE.Mesh(new THREE.CapsuleGeometry(.08, .15, 8, 16), fur); hip.rotation.z = Math.PI / 2; hip.position.x = -.09; bk.add(hip);
  const leg = (parent, x, s, len) => { const j = new THREE.Group(); j.position.set(x, -.03, s * .045); parent.add(j); const l = new THREE.Mesh(new THREE.CapsuleGeometry(.022, len, 4, 8), fur); l.position.y = -len / 2 - .02; j.add(l);
    const paw = new THREE.Mesh(new THREE.SphereGeometry(.026, 10, 8), belly); paw.position.y = -len - .03; paw.scale.set(1.2, .7, 1); j.add(paw); return j; };
  const fl = [-1, 1].map(s => leg(fr, .14, s, .13)), bl = [-1, 1].map(s => leg(bk, -.15, s, .15));
  const tailPts = []; for (let i = 0; i <= 10; i++) tailPts.push(V3(-.25 - i * .03, Math.sin(i / 10 * 2) * .06, 0)); const tail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tailPts), 20, .016, 8), fur); bk.add(tail);
  cat.userData = { fr, bk, fl, bl, head, canals, tail, mats: [fur, belly] }; scene.add(cat); return cat; }
// pose: angF/angB = giro de cada mitad (0 = patas abajo, π = boca arriba); tuckF/tuckB = patas recogidas (0..1); bend = doblez en V; spread = patas abiertas (planeo)
function poseCat(C, o) { const u = C.userData; u.fr.rotation.set(o.angF ?? 0, 0, (o.bend ?? 0)); u.bk.rotation.set(o.angB ?? 0, 0, -(o.bend ?? 0));
  u.fl.forEach((j, i) => { const s = i ? 1 : -1; j.rotation.set(s * (o.spread ?? 0) * 1.2, 0, lerp(0, 1.5, o.tuckF ?? 0)); });
  u.bl.forEach((j, i) => { const s = i ? 1 : -1; j.rotation.set(s * (o.spread ?? 0) * 1.2, 0, lerp(0, -1.3, o.tuckB ?? 0)); }); }
// secuencia de enderezamiento u ∈ [0,1]
function righting(u) { const a = easeInOut(smooth(0, .42, u)), b = easeInOut(smooth(.38, .8, u)); return { angF: lerp(Math.PI, 0, a), angB: lerp(Math.PI, Math.PI + .35, a) * (1 - b) + 0 * b + (b > 0 ? lerp(Math.PI + .35, 0, b) - (Math.PI + .35) * (1 - b) * 0 : 0) * 0 + (b > 0 ? 0 : 0),
  _a: a, _b: b, tuckF: smooth(0, .1, u) * (1 - smooth(.35, .45, u)), tuckB: smooth(.3, .42, u) * (1 - smooth(.75, .85, u)), bend: .35 * smooth(0, .1, u) * (1 - smooth(.8, .95, u)) }; }
function rightPose(u) { const r = righting(u); const a = r._a, b = r._b; r.angB = b > 0 ? lerp(Math.PI + .35 * a, 0, b) : lerp(Math.PI, Math.PI + .35, a); return r; }
const cat = makeCat();
const ghosts = []; for (let i = 0; i < 6; i++) { const g = makeCat(); ghosts.push(g); }

// ==========================================================================
// SALÓN, ESTANTERÍA, EDIFICIO, VENTANA CON RED
// ==========================================================================
const room = new THREE.Group(); scene.add(room);
{ const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), M(0xa8784a, { roughness: .6 })); floor.rotation.x = -Math.PI / 2; room.add(floor);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), M(0x5a6a7a)); wall.position.set(0, 3, -2); room.add(wall);
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.2, .05, .35), M(0xe8e2d6)); shelf.position.set(-.3, 1.8, -1.8); room.add(shelf);
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1, 48), M(0x2a6a8a)); rug.rotation.x = -Math.PI / 2; rug.position.set(.2, .005, -.6); room.add(rug);
  const plant = new THREE.Group(); const pot = new THREE.Mesh(new THREE.CylinderGeometry(.18, .14, .3, 16), M(0xc8743f)); pot.position.y = .15; plant.add(pot); for (let i = 0; i < 6; i++) { const lf = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), M(0x3a8a4a)); lf.position.set(Math.cos(i) * .1, .4 + i * .06, Math.sin(i) * .1); plant.add(lf); } plant.position.set(1.2, 0, -1.5); room.add(plant); }
const BLD = V3(0, -300, 0); const bld = new THREE.Group(); bld.position.copy(BLD); scene.add(bld);
{ for (let i = 0; i < 12; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(10, 2.9, 6), M(i % 2 ? 0xd8cfc0 : 0xcac0b0, { roughness: .9 })); f.position.y = 1.5 + i * 3; bld.add(f);
    for (let k = 0; k < 3; k++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.4), M(0x2a4a6a, { emissive: 0x0a1a2a, roughness: .2 })); w.position.set(-3 + k * 3, 1.6 + i * 3, 3.01); bld.add(w); } }
  const st = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), M(0x5a5a5e)); st.rotation.x = -Math.PI / 2; st.position.z = 8; bld.add(st); }
const WIN = V3(0, -600, 0); const winG = new THREE.Group(); winG.position.copy(WIN); scene.add(winG);
{ const wall = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), M(0xe8dccb)); wall.position.z = -.05; winG.add(wall);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, .1), M(0xffffff)); frame.position.set(0, 1.5, 0); winG.add(frame);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(.55, .75, 1) })); glass.position.set(0, 1.5, .06); winG.add(glass);
  const net = new THREE.Group(); const nm = new THREE.LineBasicMaterial({ color: 0x222222, transparent: true, opacity: .8 }); const pts = []; for (let i = 0; i <= 20; i++) { const v = -1 + i * .1; pts.push(V3(v, -1, 0), V3(v, 1, 0), V3(-1, v, 0), V3(1, v, 0)); }
  net.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), nm)); net.position.set(0, 1.5, .2); winG.add(net);
  const sill = new THREE.Mesh(new THREE.BoxGeometry(2.6, .08, .6), M(0xffffff)); sill.position.set(0, .4, .3); winG.add(sill); }
const spineG = new THREE.Group(); scene.add(spineG); const vert = [];
for (let i = 0; i < 26; i++) { const v = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .022, 12), new THREE.MeshStandardMaterial({ color: 0xf2ead8, emissive: 0x3a3020, roughness: .4 })); v.rotation.z = Math.PI / 2; spineG.add(v); vert.push(v);
  const sp = new THREE.Mesh(new THREE.BoxGeometry(.006, .03, .006), v.material); sp.position.y = .025; v.add(sp); }
const clav = [-1, 1].map(s => { const c = new THREE.Mesh(new THREE.CapsuleGeometry(.005, .04, 4, 8), new THREE.MeshStandardMaterial({ color: 0xffd08a, emissive: 0x6a3a10 })); spineG.add(c); return c; });
const plank = new THREE.Mesh(new THREE.BoxGeometry(.5, .12, .16), M(0x9a7a5a, { roughness: .9 })); scene.add(plank);

const ALL = [cat, ...ghosts, room, bld, winG, spineG, plank];
const PS = new Particles(12000, { size: .02, seed: 5 }); scene.add(PS.obj);

// ==========================================================================
// HUD
// ==========================================================================
function stamp(s, x, y, a, rot = -.08, col = '#ff6a4a', size = 80) { if (a <= .01) return; const sc = lerp(1.6, 1, easeOut(clamp(a * 1.4)));
  g2.save(); g2.translate(x, y); g2.rotate(rot); g2.scale(sc, sc); g2.globalAlpha = clamp(a); g2.strokeStyle = col; g2.lineWidth = 8; g2.shadowColor = col; g2.shadowBlur = 25;
  g2.font = `800 ${size}px Montserrat`; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.letterSpacing = '6px'; const w = g2.measureText(s).width + 70; g2.strokeRect(-w / 2, -size * .8, w, size * 1.6); g2.fillStyle = col; g2.fillText(s, 0, 4); g2.restore(); }
function two(top, l1, l2, a, y = 300) { if (a <= .01) return; txt(l1, W / 2, y, 50, { font: 'Montserrat', weight: 800, alpha: a }); if (l2) txt(l2, W / 2, y + 62, 50, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(160, 920, y + 62, .5) }); if (top) txt(top, W / 2, y - 62, 24, { spacing: 7, alpha: a * .8, fill: '#e3a372' }); }
function rotArrow(cx, cy, r, a0, a1, a, col) { if (a <= .01) return; g2.save(); g2.globalAlpha = clamp(a); g2.strokeStyle = col; g2.fillStyle = col; g2.lineWidth = 8; g2.shadowColor = col; g2.shadowBlur = 16; g2.beginPath(); g2.arc(cx, cy, r, a0, a1, a1 < a0); g2.stroke();
  const ex = cx + Math.cos(a1) * r, ey = cy + Math.sin(a1) * r, d = a1 > a0 ? 1 : -1, tx = -Math.sin(a1) * d, ty = Math.cos(a1) * d; g2.beginPath(); g2.moveTo(ex + tx * 22, ey + ty * 22); g2.lineTo(ex - ty * 14, ey + tx * 14); g2.lineTo(ex + ty * 14, ey - tx * 14); g2.fill(); g2.restore(); }
const win = (t, a, b, f = .3) => smooth(a, a + f, t) * (1 - smooth(b - f, b, t));
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
const setGlow = (grp, k) => grp.traverse(o => { if (o.isMesh && o.material.emissive && o.material.map) o.material.emissive.setRGB(k * .5, k * .25, k * .05); });

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .01; camera.far = 3000; camera.fov = 40;
  let bloomS = .4, flash = 0, ca = .0012, fade = 0, expo = 1.05;
  PS.begin(); PS.mat.size = .02; for (const o of ALL) o.visible = false; scene.background.setRGB(.1, .1, .14); hemi.intensity = 1.5; keyL.intensity = 2.4;
  cat.position.set(0, 0, 0); cat.rotation.set(0, 0, 0); cat.scale.setScalar(1); cat.userData.canals.visible = false; cat.userData.mats[0].emissive.setRGB(0, 0, 0); poseCat(cat, {});
  for (const c of ['myst', 'phys', 'cheat', 'front', 'back', 'spine', 'fast', 'study', 'relax', 'nets', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];

  if (t < TL.myst) {
    // A · cae desde la estantería (cámara lenta) y aterriza de pie
    room.visible = true; cat.visible = true; scene.background.setRGB(.36, .42, .5);
    const u = smooth(.2, 1.9, t); const y = lerp(1.9, .2, u * u * .2 + u * .8); cat.position.set(-.3, Math.max(.2, y), -1.6 + u * .4); poseCat(cat, rightPose(u)); if (u >= 1) poseCat(cat, { tuckF: 0, tuckB: 0 });
    camera.position.set(.9, 1.05, .9); camera.lookAt(-.3, lerp(1.4, .5, u), -1.5); camera.fov = 42;
    hud.push(() => two(null, '¿POR QUÉ LOS GATOS', 'SIEMPRE CAEN DE PIE?', smooth(.05, .3, t), 300));
  } else if (t < TL.cheat) {
    if (t < TL.phys) {
      // B · 1894: Marey fotografía la caída
      const lt = t - TL.myst; scene.background.setRGB(.42, .33, .22); hemi.intensity = 2; keyL.intensity = 1.2;
      ghosts.forEach((g, i) => { g.visible = true; const u = i / 5; g.position.set(i % 2 ? .38 : -.38, .5 - Math.floor(i / 2) * .72, 0); g.scale.setScalar(.85); g.rotation.set(0, -.3, 0); poseCat(g, rightPose(u)); g.visible = lt > i * .25; });
      camera.position.set(0, -.15, 4.4); camera.lookAt(0, -.15, 0); camera.fov = 40;
      hud.push(() => { two(null, 'DURANTE SIGLOS FUE UN MISTERIO…', 'INCLUSO PARA LOS FÍSICOS', smooth(.05, .3, lt), 300); txt('1894 · ÉTIENNE-JULES MAREY', W / 2, 1460, 34, { font: 'Montserrat', weight: 800, alpha: smooth(.8, 1.2, lt), fill: '#ffd9a0' }); txt('las primeras fotos de un gato cayendo', W / 2, 1515, 30, { alpha: smooth(1, 1.4, lt), fill: '#f3e6d0' });
        g2.save(); g2.globalAlpha = .18; g2.fillStyle = '#6a4a20'; g2.fillRect(0, 0, W, H); g2.restore(); });
    } else {
      // C · un cuerpo rígido no puede girar solo
      const lt = t - TL.phys; plank.visible = true; scene.background.setRGB(.08, .09, .13); plank.position.set(0, lerp(.6, -.6, fract(lt / 2.2)), 0); plank.rotation.set(Math.PI + .5, .6, .2);
      camera.position.set(0, 0, 2.4); camera.lookAt(0, 0, 0);
      hud.push(() => { two(null, 'UN CUERPO QUE CAE SIN AGARRE', 'NO PUEDE GIRAR SOLO', smooth(.05, .3, lt), 300); stamp('GIRO = 0', W / 2, 1560, smooth(1.2, 1.5, lt), -.06, '#7fd4ff', 64); });
    }
  } else if (t < TL.front) {
    // D · trampa: el oído interno sabe dónde está el suelo
    const lt = t - TL.cheat; cat.visible = true; scene.background.setRGB(.06, .07, .11); poseCat(cat, { angF: Math.PI, angB: Math.PI, tuckF: .3, tuckB: .2 }); cat.rotation.set(0, -.5, 0);
    const ek = smooth(TL.ear, TL.ear + .5, t); cat.userData.canals.visible = ek > 0; cat.userData.canals.children.forEach(c => c.material.opacity = ek); bloomS = .8;
    const hp = V3(); cat.userData.head.getWorldPosition(hp); const z = lerp(2.3, 1.1, easeInOut(smooth(TL.ear - .2, TL.ear + 1, t)));
    camera.position.copy(hp).add(V3(.05, .05, 1.0 * z + .05).applyAxisAngle(V3(0, 1, 0), -.2)); camera.lookAt(hp.clone().add(V3(-.05 * (1 - z), .14 * z, 0))); camera.fov = 40;
    hud.push(() => { two(null, 'PERO EL GATO', 'HACE TRAMPA', win(t, TL.cheat, TL.ear), 300); two(null, 'SU OÍDO INTERNO LE DICE', 'DÓNDE ESTÁ EL SUELO', smooth(TL.ear, TL.ear + .3, t), 300);
      const ga = smooth(TL.ear + 1.2, TL.ear + 1.6, t); arrowXY(W / 2, 1300, W / 2, 1700, ga, '#7fd4ff'); txt('SUELO', W / 2 + 90, 1520, 40, { font: 'Montserrat', weight: 800, alpha: ga, fill: '#7fd4ff', align: 'left' }); txt('en milisegundos', W / 2 + 90, 1570, 28, { alpha: ga, align: 'left' }); });
  } else if (t < TL.spine) {
    // E · doblar y girar: primero delante, luego detrás
    const lt = t - TL.front; cat.visible = true; scene.background.setRGB(.06, .07, .11);
    const u = t < TL.back ? lerp(0, .4, smooth(TL.front + .6, TL.back - .2, t)) : t < TL.comp ? lerp(.4, .82, smooth(TL.back, TL.comp + .3, t)) : lerp(.82, 1, smooth(TL.comp + .3, TL.comp + 1.2, t));
    poseCat(cat, rightPose(u)); cat.rotation.set(0, -.35, 0); const fg = win(t, TL.front + .3, TL.back + .1) , bg = win(t, TL.back, TL.comp + .4);
    cat.userData.fr.traverse(o => { if (o.isMesh && o.material.map) o.material.emissive.setRGB(fg * .5 + bg * 0, fg * .25, fg * .05); }); if (bg > 0) cat.userData.mats[0].emissive.setRGB(bg * .5, bg * .25, bg * .05); if (fg > 0 && bg <= 0) cat.userData.mats[0].emissive.setRGB(0, 0, 0);
    camera.position.set(.35, .3, 2.3); camera.lookAt(0, -.02, 0); camera.fov = 40;
    // eje del cuerpo
    for (let i = 0; i < 200; i++) { const x = lerp(-.55, .55, i / 200); PS.push(Math.cos(.35) * x, 0, Math.sin(.35) * x, .6, .6, .7); } PS.mat.size = .006;
    hud.push(() => { two(null, 'SE DOBLA POR LA MITAD:', 'GIRA LA PARTE DE DELANTE', win(t, TL.front, TL.back), 300); two(null, 'Y DESPUÉS', 'LA DE ATRÁS', win(t, TL.back, TL.comp), 300); two(null, 'DOS CUERPOS', 'QUE SE COMPENSAN', smooth(TL.comp, TL.comp + .3, t), 300);
      const pf = project(V3(.18, 0, -.06)), pb = project(V3(-.18, 0, .06)); rotArrow(pf.x, pf.y, 150, -2.4, lerp(-2.4, .6, smooth(TL.front + .5, TL.back - .3, t)), win(t, TL.front + .4, TL.back), '#ffb070'); txt('1', pf.x, pf.y - 200, 60, { font: 'Montserrat', weight: 800, alpha: win(t, TL.front + .4, TL.back), fill: '#ffb070' });
      rotArrow(pb.x, pb.y, 150, -2.4, lerp(-2.4, .6, smooth(TL.back + .2, TL.comp + .2, t)), win(t, TL.back, TL.comp + .5), '#7fd4ff'); txt('2', pb.x, pb.y - 200, 60, { font: 'Montserrat', weight: 800, alpha: win(t, TL.back, TL.comp + .5), fill: '#7fd4ff' });
      txt('patas recogidas = gira más rápido', W / 2, 1640, 32, { weight: 300, alpha: win(t, TL.front + 1.2, TL.comp) }); });
  } else if (t < TL.study) {
    if (t < TL.fast) {
      // F · columna flexible y clavículas flotantes (rayos X)
      const lt = t - TL.spine; spineG.visible = true; scene.background.setRGB(.02, .04, .08); bloomS = .7;
      const tw = Math.sin(lt * 1.3) * .5 + .5; vert.forEach((v, i) => { const u = i / 25; v.position.set(lerp(.32, -.32, u), Math.sin(u * Math.PI) * .03, 0); v.rotation.set(lerp(0, Math.PI * .9, u) * tw, 0, Math.PI / 2); v.material.emissive.setHSL(lerp(.08, .55, u), .7, .15); });
      clav.forEach((c, i) => { c.position.set(.22, -.03 + Math.sin(lt * 2 + i) * .01, (i ? 1 : -1) * .07); c.rotation.set(Math.PI / 2, 0, .3); c.visible = t > TL.spine + 2.6; });
      spineG.rotation.set(.3, -.4 + lt * .1, 0); camera.position.set(0, .15, 1.9); camera.lookAt(0, 0, 0); camera.fov = 40;
      hud.push(() => { two(null, 'SU COLUMNA PUEDE RETORCERSE', 'CASI MEDIA VUELTA', win(t, TL.spine, TL.spine + 3.1), 300); txt('≈ 180°', W / 2, 1460, 110, { font: 'Montserrat', weight: 800, alpha: win(t, TL.spine + .5, TL.spine + 3.1), fill: copperGrad(300, 780, 1460, .5) });
        two(null, 'Y SUS CLAVÍCULAS', 'NO ESTÁN UNIDAS A LOS HOMBROS', smooth(TL.spine + 3.1, TL.spine + 3.4, t), 300); callout(clav[1].getWorldPosition(V3()), 120, 300, 'CLAVÍCULA FLOTANTE', 'hombros libres', smooth(TL.spine + 3.4, TL.spine + 3.8, t), '#ffd08a'); });
    } else {
      // G · en menos de un tercio de segundo; necesita altura
      const lt = t - TL.fast; room.visible = true; cat.visible = true; scene.background.setRGB(.36, .42, .5);
      const u = fract(lt / 1.6) * 1.15; cat.position.set(-.3, lerp(1.6, .2, clamp(u) * clamp(u)) , -1.4); poseCat(cat, rightPose(clamp(u * 1.6))); camera.position.set(.8, .95, .9); camera.lookAt(-.3, 1.0, -1.4); camera.fov = 55;
      hud.push(() => { const a = win(t, TL.fast, TL.low); txt('TODO EN', W / 2, 262, 30, { font: 'Montserrat', weight: 800, alpha: a, spacing: 4 }); txt('0,3 s', W / 2, 390, 150, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(240, 840, 390, .5) });
        two(null, 'POR ESO NECESITA ALTURA:', 'DESDE MUY BAJO NO LE DA TIEMPO', smooth(TL.low, TL.low + .3, t), 300); });
    }
  } else if (t < TL.relax) {
    // H · el estudio de 1987: por encima de 7 pisos, menos lesiones
    const lt = t - TL.study; bld.visible = true; scene.background.setRGB(.45, .62, .85); camera.position.copy(BLD).add(V3(-22, 16, 34)); camera.lookAt(BLD.clone().add(V3(0, 16, 0))); camera.fov = 50;
    hud.push(() => { two('1987 · NUEVA YORK · 132 GATOS', 'MÁS DE 7 PISOS:', 'MENOS DAÑO QUE DESDE 5', smooth(.05, .3, lt), 300);
      const x0 = 160, x1 = 920, y0 = 1700, hM = 380; const vals = [.25, .45, .6, .75, .85, .8, .55, .45, .4]; const bw = (x1 - x0) / vals.length; const a = smooth(.6, 1, lt);
      g2.save(); vals.forEach((v, i) => { const k = smooth(.8 + i * .12, 1.2 + i * .12, lt); const hh = v * hM * k; g2.globalAlpha = a; g2.fillStyle = i >= 6 ? '#7fe08a' : i === 3 ? '#ff6a4a' : '#ffb070'; g2.fillRect(x0 + i * bw + 8, y0 - hh, bw - 16, hh); txt(String(i + 2), x0 + i * bw + bw / 2, y0 + 36, 28, { alpha: a, font: 'Montserrat', weight: 800 }); }); g2.restore();
      txt('PISO', x1 + 10, y0 + 36, 22, { alpha: a * .8, align: 'left' }); txt('LESIONES', x0, y0 - hM - 40, 24, { alpha: a * .8, align: 'left', spacing: 4, fill: '#e3a372' }); });
  } else if (t < TL.nets) {
    // I · velocidad máxima: se relajan y planean
    const lt = t - TL.relax; cat.visible = true; scene.background.setRGB(.24, .37, .58); const sp = smooth(TL.relax + 1.6, TL.relax + 2.6, t);
    poseCat(cat, { spread: sp, tuckF: 0, tuckB: 0, bend: 0 }); cat.rotation.set(0, Math.sin(lt * .6) * .2, -.05); cat.userData.fr.rotation.x += Math.sin(lt * 3) * .03;
    camera.position.set(.45, -2.0, .8); camera.lookAt(0, 0, 0); camera.up.set(0, 0, -1); camera.fov = 45;
    for (let i = 0; i < 1500; i++) { const s = PS.seed, q = i * 4; const u = fract(s[q] + t * 1.4); PS.push((s[q + 1] - .5) * 2, lerp(-1.4, 1, u), (s[q + 2] - .5) * 2, .9, .95, 1); } PS.mat.size = .004;
    hud.push(() => { two(null, 'AL ALCANZAR SU VELOCIDAD MÁXIMA', 'SE RELAJAN Y ABREN LAS PATAS', win(t, TL.relax, TL.glide), 300); two(null, 'Y PLANEAN COMO', 'UNA ARDILLA VOLADORA', smooth(TL.glide, TL.glide + .3, t), 300);
      bigStat('VELOCIDAD MÁXIMA', '≈ 100 km/h', 1560, smooth(TL.relax + .5, TL.relax + .9, t), .5); });
  } else if (t < TL.brand) {
    // J · redes en las ventanas
    const lt = t - TL.nets; winG.visible = true; cat.visible = true; scene.background.setRGB(.9, .85, .78); cat.position.copy(WIN).add(V3(-.2, .78, .3)); cat.rotation.set(0, -.5, 0); poseCat(cat, {}); cat.scale.setScalar(1.7);
    camera.position.copy(WIN).add(V3(.4, 1.2, 3.6)); camera.lookAt(WIN.clone().add(V3(0, .9, 0))); camera.fov = 45;
    hud.push(() => { two(null, 'AUN ASÍ,', 'PONED REDES EN LAS VENTANAS', smooth(.05, .3, lt), 300); stamp('SIEMPRE', W / 2, 1600, smooth(1, 1.3, lt), -.06, '#7fe08a', 70); });
  } else {
    // K · marca
    const lt = t - TL.brand; room.visible = true; cat.visible = true; scene.background.setRGB(.2, .2, .26); hemi.intensity = .9; cat.position.set(.2, .2 * 0, -.6); cat.rotation.set(0, -2.4, 0); poseCat(cat, {}); cat.scale.setScalar(1);
    camera.position.set(.6, .55, 1.1); camera.lookAt(.1, .35, -.6); fade = Math.min(.45, lt * .4);
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  PS.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  { const gr = g2.createLinearGradient(0, 0, 0, 600); gr.addColorStop(0, 'rgba(8,10,16,.8)'); gr.addColorStop(.6, 'rgba(8,10,16,.55)'); gr.addColorStop(1, 'rgba(8,10,16,0)'); if (t < TL.brand) { g2.fillStyle = gr; g2.fillRect(0, 0, W, 600); }
    if (t >= TL.relax && t < TL.glide + 1) { const gb = g2.createLinearGradient(0, H - 600, 0, H); gb.addColorStop(0, 'rgba(8,10,16,0)'); gb.addColorStop(1, 'rgba(8,10,16,.6)'); g2.fillStyle = gb; g2.fillRect(0, H - 600, W, 600); } }
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, bloom: bloomS, expo });
}
function renderCover() { renderFrame(TL.front + 2.4); coverText('¿POR QUÉ LOS GATOS', 'CAEN DE PIE?', 'el truco que desconcertó a los físicos'); }
window.renderCover = () => { renderCover(); return true; };
window.OBJ = { PS, scene };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
