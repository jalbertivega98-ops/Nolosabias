// NO LO SABÍAS — «Cuando tu perro corre» (perro 3D de cuerpo entero: galope con fase de vuelo, doble suspensión del galgo, espalda muelle, olfateo a ~5 Hz)
// Galope rotatorio: fase de suspensión «recogida»; el galgo añade una segunda suspensión «extendida» (doble suspensión). La flexión–extensión de la columna alarga la zancada.
// Galgo: récords en torno a 70 km/h (≈ 19–20 m/s) en carreras de velocidad.
// Craven, Paterson & Settles 2010 (J. R. Soc. Interface): olfateo ~5 Hz; espiración por las hendiduras laterales de las narinas, hacia atrás y a los lados; el chorro arrastra aire con olor hacia la nariz.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, V3, g2, camera, txt, copperGrad, project, titleHUD, bar, bigStat, arrowXY, drawBrand, coverText, finish, noise1, fract, Particles } from '../../lib/core.js';
import { buildBody } from '../../perros3d/render/body.js';
import { scene, bg, floor, dog, ENV, SH, furLight, GOLDEN, inA, flashAt, stamp, question, cite, bands, big, label } from '../../perros3d/render/stage.js';

const CUTS = ['gallop', 'double', 'spine', 'speed', 'sniff', 'slits', 'you'];
const BLUE = '#9fd8ff', COP = '#e3a372', RED = '#ff7a5a', TAU = Math.PI * 2;
const SPEED = new Particles(500, { size: .25, seed: 5 }); scene.add(SPEED.obj);
const AIR = new Particles(1400, { size: .32, seed: 13 }); scene.add(AIR.obj);
const DUST = new Particles(400, { size: .6, seed: 17 }); scene.add(DUST.obj);
function look(px, py, pz, tx, ty, tz, fov = 30) { camera.up.set(0, 1, 0); camera.fov = fov; camera.position.set(px, py, pz); camera.lookAt(tx, ty, tz); }
function orbit(az, d, y, ty = 6.5, tz = 0) { look(Math.sin(az) * d, y, Math.cos(az) * d + tz, 0, ty, tz); }
const wp = (o) => { o.updateMatrixWorld(true); return o.getWorldPosition(new THREE.Vector3()); };
const noseC = (D) => new THREE.Box3().setFromObject(D.head.nose).getCenter(new THREE.Vector3());

// galope explícito. s = fase de zancada (0..1). s≈0: suspensión EXTENDIDA (manos delante, patas atrás); s≈0.5: suspensión RECOGIDA (todas bajo el cuerpo).
// dbl = 1 → galgo (dos vuelos); dbl = 0 → perro corriente (solo el recogido). Devuelve {bones, lift, phase}
function gallop(s, amp = 1, dbl = 1) { const f = TAU * s, c = Math.cos(f);
  const ext = .95 * amp * (.8 + .2 * dbl), F = -ext * c, Hh = ext * c;
  const fSwing = Math.max(0, Math.sin(f - Math.PI)) * amp; // manos vuelven adelante (s .5→1): plegadas
  const hSwing = Math.max(0, Math.sin(f)) * amp; // patas vuelven adelante (s 0→.5): plegadas
  const lead = .08 * amp; const b = {};
  for (const [n, d] of [['LF', 0], ['RF', lead]]) { b[n + 'u'] = F + d; b[n + 'l'] = fSwing * 1.1; b[n + 'p'] = -fSwing * .7 + (c > 0 ? -.15 * c * amp : 0); }
  for (const [n, d] of [['LH', 0], ['RH', lead]]) { b[n + 'u'] = Hh + d; b[n + 'l'] = -hSwing * .9 - .05; b[n + 'p'] = hSwing * .9; }
  // columna: recogido → arqueada (muelle comprimido); extendido → estirada
  const flex = (-c) * amp * (.5 + .5 * dbl); // +1 recogido, −1 extendido
  b.pelvis = -.12 * flex; b.chest = .2 * flex; b.neck = -.12 * flex;
  const fly = (x) => Math.max(0, Math.cos(TAU * x)) ** 3; // picos de vuelo
  const lift = amp * (1.1 * Math.max(0, -c) ** 4 + 1.0 * dbl * Math.max(0, c) ** 4);
  return { bones: b, lift, flex, phase: c > .8 ? 'ext' : c < -.8 ? 'rec' : '' };
}
function run(D, s, amp, dbl, extra = {}) { const g = gallop(s, amp, dbl); D.pose({ bones: g.bones, tail: { ph: s * TAU, amp: .15, up: .1 }, ear: -.5, ...extra }); D.root.position.y = g.lift; D.shadow.position.y = .02 - g.lift; D.shadow.material.opacity = 1 - g.lift * .35; return g; }
function speedLines(lt, k = 1, v = 1.4) { for (let i = 0; i < SPEED.n; i++) { const s = SPEED.seed, q = i * 4; const z = 20 - fract(s[q] + lt * v) * 40; const y = 1 + s[q + 1] * 11, x = (s[q + 2] - .5) * 16; const b = .25 * k; SPEED.push(x, y, z, b, b * .8, b * .6); } }
function dust(D, lt, k) { const s = DUST.seed; for (let i = 0; i < DUST.n; i++) { const q = i * 4, age = fract(s[q] + lt * 1.3); const p = D.root.position; DUST.push(p.x + (s[q + 1] - .5) * 3, .3 + age * 2 * s[q + 2], p.z - 4 - age * 14, .3 * k * (1 - age), .24 * k * (1 - age), .18 * k * (1 - age)); } }
// aire del olfateo: entra por delante (azul), sale por las rendijas hacia atrás y a los lados (cobre)
function sniffAir(D, t, f, k, pull = 0) { if (k <= .01) return; const n = noseC(D); const R = D.root.matrixWorld; const fw = V3(0, 0, 1).transformDirection(R), sd = V3(1, 0, 0).transformDirection(R), up = V3(0, 1, 0);
  const s = AIR.seed;
  for (let i = 0; i < AIR.n; i++) { const q = i * 4; const age = fract(s[q] + t * 1.4); const tb = t - age / 1.4; const ph = fract(f * tb); const inh = ph < .5;
    if (i % 3 === 0) { // entrada: desde el suelo por delante hacia la nariz
      const u = age; const o = n.clone().addScaledVector(fw, 4.5 * (1 - u) + .3).addScaledVector(up, -n.y * (1 - u) * .9 + (s[q + 1] - .5) * .8 * (1 - u)).addScaledVector(sd, (s[q + 2] - .5) * 2 * (1 - u));
      const b = k * (pull ? .55 + .5 * pull : .5) * (1 - u * .5); AIR.push(o.x, o.y, o.z, .45 * b, .8 * b, 1.1 * b); }
    else if (!inh || pull) { // salida: chorros laterales hacia atrás
      const side = i % 2 ? 1 : -1; const u = age; const o = n.clone().addScaledVector(fw, -.4 - u * 3.2).addScaledVector(sd, side * (.35 + u * 2.6 + (s[q + 1] - .5) * u)).addScaledVector(up, -u * 1.4 + (s[q + 2] - .5) * u);
      const b = k * (1 - u) * .9; AIR.push(o.x, o.y, o.z, 1.0 * b, .6 * b, .3 * b); } } }
function arcPts(D) { const B = D.bone; return [wp(B.t0), wp(B.pelvis), wp(B.chest), wp(B.neck), wp(B.head)].map(project); }
function drawSpine(D, flex, a) { if (a <= .01) return; const P = arcPts(D); const col = flex > 0 ? COP : BLUE; g2.save(); g2.globalAlpha = a; g2.strokeStyle = col; g2.lineWidth = 9; g2.lineCap = 'round'; g2.shadowColor = col; g2.shadowBlur = 22;
  g2.beginPath(); g2.moveTo(P[0].x, P[0].y - 40); for (let i = 1; i < P.length - 1; i++) { const xc = (P[i].x + P[i + 1].x) / 2, yc = (P[i].y + P[i + 1].y) / 2 - 40; g2.quadraticCurveTo(P[i].x, P[i].y - 40, xc, yc); } g2.stroke(); g2.restore(); }

let G = null; // galgo
const GALGO = { ...GOLDEN, snoutLen: 1.5, snoutR: [.44, .25], earUp: 0, wolf: 0, fur: [.55, .52, .5], furLight: [.86, .84, .8], furDark: [.28, .26, .25], iris: [.3, .18, .08], eyeR: .17 };
function galgo() { if (!G) { G = buildBody(GALGO, { shells: SH, env: ENV }); scene.add(G.root); furLight(G, V3(.5, .8, .6)); G.root.scale.set(.78, 1.04, 1.12); } return G; }

function renderFrame(t) {
  g2.clearRect(0, 0, W, H); SPEED.begin(); AIR.begin(); DUST.begin();
  let flash = 0; for (const c of CUTS) flash = Math.max(flash, flashAt(t, TL[c], .22, .3));
  const hud = []; let fade = 0, expo = 1; const U = floor.material.uniforms; U.uGrid.value = 0; U.uOff.value.set(0, 0); bg.material.uniforms.uWarm.value = 0;
  const useG = t >= TL.double && t < TL.sniff; const D = useG ? galgo() : dog; dog.root.visible = !useG; if (G) G.root.visible = useG;
  D.root.position.set(0, 0, 0); D.root.rotation.set(0, 0, 0); D.shadow.position.y = .02; D.shadow.material.opacity = 1;
  if (t < TL.gallop) {
    // A · gancho: galope a cámara lenta, vuela
    const lt = t; const sm = lerp(1.2, .4, smooth(.4, 1.6, lt)); const s = lt * sm; const g = run(D, s, 1, 0);
    U.uGrid.value = 1; U.uOff.value.set(0, s * 14); speedLines(s, .8); dust(D, s, .8); orbit(lerp(1.0, 1.2, lt / 4), 72, 9, 5.5, -2);
    hud.push(() => { question('CUANDO TU PERRO', 'CORRE…', smooth(0, .25, t), 300); stamp('VUELA', W / 2, 1520, smooth(2.4, 2.6, lt) * (g.lift > .5 ? 1 : .85), -.06, COP, 64); label('CÁMARA LENTA', 900, 1700, .6 * smooth(.8, 1.2, lt), '#fff', 20); });
  } else if (t < TL.double) {
    // B · las cuatro patas en el aire
    const lt = t - TL.gallop; const s = lt * .32; const g = run(D, s + .3, 1, 0);
    U.uGrid.value = 1; U.uOff.value.set(0, s * 14); speedLines(s, .6); look(78, 6.5, -3, 0, 5.5, -3, 30);
    hud.push(() => { const a = smooth(0, .3, lt); label('AL GALOPE RÁPIDO', W / 2, 260, a, COP, 28); big('EN CADA ZANCADA', 330, a, '#fff', 54);
      const fl = smooth(.35, .6, g.lift); big('4 PATAS EN EL AIRE', 1500, Math.max(fl, smooth(2.6, 3, lt) * .35), null, 62);
      if (fl > .01) { const p = project(V3(0, .1, 0)); g2.save(); g2.globalAlpha = fl; g2.strokeStyle = '#fff'; g2.lineWidth = 3; g2.setLineDash([14, 10]); g2.beginPath(); g2.moveTo(p.x - 360, p.y); g2.lineTo(p.x + 360, p.y); g2.stroke(); g2.restore(); }
      label('CÁMARA LENTA', 900, 1700, .6 * a, '#fff', 20); });
  } else if (t < TL.spine) {
    // C · galgo: doble suspensión (extendida y recogida)
    const lt = t - TL.double; const s = lt * .26; const g = run(D, s + .9, 1, 1);
    U.uGrid.value = 1; U.uOff.value.set(0, s * 18); speedLines(s, .6); look(84, 7, -3, 0, 6, -3, 30);
    hud.push(() => { const a = smooth(0, .3, lt); label('LOS GALGOS', W / 2, 260, a, COP, 30); big('VUELAN DOS VECES', 330, a, '#fff', 56); big('POR ZANCADA', 400, a, null, 60);
      const e = smooth(.75, .95, Math.cos(TAU * (s + .9))) * smooth(1.2, 1.6, lt), r = smooth(.75, .95, -Math.cos(TAU * (s + .9))) * smooth(1.2, 1.6, lt);
      stamp('1 · ESTIRADAS', W / 2, 1480, e, -.04, BLUE, 52); stamp('2 · RECOGIDAS', W / 2, 1480, r, -.04, COP, 52);
      label('CÁMARA LENTA', 900, 1700, .6 * a, '#fff', 20); });
  } else if (t < TL.speed) {
    // D · la espalda muelle
    const lt = t - TL.spine; const s = lt * .3; const g = run(D, s + .4, 1, 1);
    U.uGrid.value = 1; U.uOff.value.set(0, s * 18); look(84, 9, -3, 0, 6.5, -3, 30); scene.updateMatrixWorld(true);
    hud.push(() => { const a = smooth(0, .3, lt); question('EL TRUCO:', 'LA ESPALDA', a, 280); drawSpine(D, g.flex, smooth(.6, 1, lt));
      txt(g.flex > 0 ? 'SE DOBLA' : 'SE ESTIRA', W / 2, 1420, 52, { font: 'Montserrat', weight: 800, alpha: smooth(.8, 1.2, lt) * Math.min(1, Math.abs(g.flex) * 1.6), fill: g.flex > 0 ? COP : BLUE });
      titleHUD('COMO UN MUELLE:', 'ZANCADA MÁS LARGA', smooth(3.2, 3.5, lt), 1600); label('CÁMARA LENTA', 900, 1720, .6 * a, '#fff', 20); });
  } else if (t < TL.sniff) {
    // E · más de 70 km/h
    const lt = t - TL.speed; const s = lt * 2.6; run(D, s, 1, 1); const v = 70 * easeOut(smooth(0, 2.2, lt));
    U.uGrid.value = 1; U.uOff.value.set(0, s * 18); speedLines(lt, 1, 2.4); dust(D, lt, 1); orbit(lerp(.75, .95, lt / 3), 66, 10, 6, -2);
    hud.push(() => { const a = smooth(0, .3, lt); label('UN GALGO PUEDE PASAR DE', W / 2, 1360, a, COP, 26);
      txt(Math.round(v) + (v > 69.5 ? '+' : ''), W / 2, 1480, 150, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(300, 780, 1480, .5) }); label('KM/H', W / 2, 1590, a, '#fff', 34); });
  } else if (t < TL.slits) {
    // F–G · corre con el hocico pegado al suelo; olfatea ~5 veces por segundo
    const lt = t - TL.sniff; const inRate = t >= TL.rate; const ph = lt * 1.6 * TAU;
    dog.pose({ walk: { ph, amp: .75 }, crouch: .15, headPitch: .55, bones: { neck: .55 }, ear: .2, tail: { ph: t * 6, amp: .2, up: .4 } }); dog.root.position.y = 0;
    U.uGrid.value = .6; U.uOff.value.set(0, lt * 7); scene.updateMatrixWorld(true);
    const sf = inRate ? 5 * .25 : 5; sniffAir(dog, inRate ? t * .25 : t, 5, inRate ? 1 : .6);
    if (!inRate) orbit(lerp(.9, .65, lt / 3), 56, 10, 4.5, -1); else { const n = noseC(dog); look(n.x + 30, n.y + 4, n.z + 12, n.x - 2, n.y + 1.5, n.z - 5, 30); }
    hud.push(() => { if (!inRate) { question('Y CON EL HOCICO', 'PEGADO AL SUELO…', smooth(0, .25, lt), 300); stamp('VA OLIENDO', W / 2, 1520, smooth(1.4, 1.6, lt), -.05, BLUE, 54); }
      else { const l2 = t - TL.rate, a = smooth(0, .3, l2); bigStat('OLFATEA UNAS', '5', 380, a, .5); label('VECES POR SEGUNDO', W / 2, 470, a, '#fff', 30);
        const x = W / 2 + Math.sin(TAU * 5 * t) * 160; g2.save(); g2.globalAlpha = a; g2.fillStyle = BLUE; g2.shadowColor = BLUE; g2.shadowBlur = 20; g2.beginPath(); g2.arc(x, 560, 12, 0, 7); g2.fill(); g2.restore();
        label('CÁMARA LENTA', 900, 1700, .6 * a, '#fff', 20); cite('Craven, Paterson & Settles · J. R. Soc. Interface, 2010', a); } });
  } else if (t < TL.you) {
    // H–I · espira por las rendijas laterales, hacia atrás; el chorro arrastra olor nuevo
    const lt = t - TL.slits; const inPull = t >= TL.pull;
    dog.pose({ crouch: .15, headPitch: .55, bones: { neck: .55 }, ear: .2, tail: { ph: t * 4, amp: .15, up: .4 } }); scene.updateMatrixWorld(true);
    const tt = TL.slits + lt * .25; sniffAir(dog, tt, 5, 1, inPull ? smooth(0, .8, t - TL.pull) : 0); const n = noseC(dog);
    const az = inPull ? lerp(1.0, 1.25, (t - TL.pull) / 3.3) : lerp(-.25, .25, lt / 6.5); const dd = inPull ? 32 : 26; look(n.x + Math.sin(az) * dd, n.y + (inPull ? 4 : 9), n.z + Math.cos(az) * dd, n.x, n.y + .5, n.z - 2.5, 30);
    hud.push(() => { const q = project(n); if (!inPull) { const a = smooth(0, .3, lt); question('NO ECHA EL AIRE', 'POR DONDE LO COGE', a, 280);
        label('ENTRA ↓', q.x, q.y - 150, smooth(.6, 1, lt), BLUE, 26); label('SALE POR LOS LADOS, HACIA ATRÁS', W / 2, q.y + 230, smooth(1.4, 1.8, lt), COP, 26);
        stamp('NO SOPLA EL RASTRO', W / 2, 1560, smooth(4.6, 4.9, lt), -.05, COP, 50); label('CÁMARA LENTA', 900, 1700, .6 * a, '#fff', 20); cite('Craven, Paterson & Settles · J. R. Soc. Interface, 2010', a); }
      else { const l2 = t - TL.pull, a = smooth(0, .3, l2); question('Y ESE CHORRO', 'ARRASTRA OLOR NUEVO', a, 280); label('HACIA LA NARIZ', W / 2, 440, a, '#fff', 30); } });
  } else if (t < TL.brand) {
    // J · pregunta final: ¿galgo o de los que se paran a olerlo todo?
    const lt = t - TL.you; bg.material.uniforms.uWarm.value = .3; dog.pose({ bow: .95 + .05 * Math.sin(t * 5), tail: { ph: t * 14, amp: .55, up: 1 }, ear: .5, headPitch: -.25, headYaw: Math.sin(lt * 1.5) * .12 });
    orbit(lerp(.55, .8, lt / 5), 46, 8.5, 5.5, -.5);
    hud.push(() => { const a = smooth(.1, .4, lt); question('¿Y EL TUYO?', '', a, 270);
      txt('A · CORRE COMO UN GALGO', W / 2, 1420, 44, { font: 'Montserrat', weight: 800, alpha: smooth(.9, 1.2, lt), fill: BLUE });
      txt('B · SE PARA A OLERLO TODO', W / 2, 1500, 44, { font: 'Montserrat', weight: 800, alpha: smooth(1.9, 2.2, lt), fill: COP });
      txt('CUÉNTANOSLO EN COMENTARIOS ↓', W / 2, 1600, 34, { font: 'Montserrat', weight: 800, alpha: smooth(3.4, 3.8, lt), spacing: 2 }); });
  } else {
    const lt = t - TL.brand; dog.pose({ bow: .95, tail: { ph: t * 14, amp: .5, up: 1 }, ear: .5, headPitch: -.25 }); orbit(.8 + lt * .03, 46 + lt * 2, 8.5 + lt * .3, 5.5, -.5);
    expo = .85; fade = Math.min(.72, lt * .6); hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  SPEED.end(); AIR.end(); DUST.end();
  U.uC.value.set(D.root.position.x, D.root.position.z);
  camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); bg.position.copy(camera.position); scene.updateMatrixWorld(true);
  if (t < TL.brand) bands();
  for (const h of hud) h();
  finish(scene, { t, flash, fade, bloom: .35, expo, grain: .03 });
}
function renderCover() { renderFrame(TL.gallop + 1.5); coverText('CUANDO TU PERRO', 'CORRE', 'Durante un instante, vuela'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
