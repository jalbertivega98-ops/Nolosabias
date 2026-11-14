// NO LO SABÍAS — «Cuando tu perro te trae un juguete y no te lo da» (perro 3D de cuerpo entero)
// Pullen, Merrill & Bradshaw 2012 (Animal Cognition): en rondas repetidas de 30 s con el mismo juguete, el juego cae enseguida (habituación); un juguete nuevo lo recupera (deshabituación).
// Rooney & Bradshaw 2002 (Applied Animal Behaviour Science): ganar al tira y afloja no cambió las medidas de dominancia; los perros que ganaban mostraron más juego y búsqueda de atención con la persona.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, V3, g2, camera, txt, copperGrad, project, titleHUD, drawBrand, coverText, finish, fract } from '../../lib/core.js';
import { scene, bg, floor, dog, inA, flashAt, stamp, question, cite, bands, big, label } from '../../perros3d/render/stage.js';
import { TAU, BLUE, COP, RED, GREEN, look, orbit, place, wp, mouth, makeRope, makeBall, makeStick, stick, glow, ring, bars, panel } from '../../perros3d/render/extras.js';

const CUTS = ['invite', 'alone', 'study', 'novel', 'trick', 'tug', 'win', 'you'];
const ROPE = makeRope(); ROPE.scale.setScalar(.72); const BALL = makeBall(); const TOYS = [makeRope('#3a7bd5', '#f1e6d0', 3.6), makeBall(0xff6a3a, .9), makeRope('#2fae6a', '#f5d742', 3.2), makeBall(0x9b6bff, .8)];
const TUG = makeStick(.22); const hq = new THREE.Quaternion();
function inMouth(toy, D = dog) { const m = mouth(D); D.dogHead.getWorldQuaternion(hq); toy.position.copy(m); toy.quaternion.copy(hq); toy.visible = true; }
function circle(t, t0, R, speed, cx = 0, cz = 0) { const s = (t - t0) * speed; const a = s / R; place(dog, cx + Math.sin(a) * R, cz + Math.cos(a) * R - R, a + Math.PI / 2); return s / 9 * TAU; }

function renderFrame(t) {
  g2.clearRect(0, 0, W, H);
  let flash = 0; for (const c of CUTS) flash = Math.max(flash, flashAt(t, TL[c], .22, .3));
  const hud = []; let fade = 0, expo = 1; const U = floor.material.uniforms; U.uGrid.value = 0; U.uOff.value.set(0, 0); U.uCompass.value = 0; bg.material.uniforms.uWarm.value = 0;
  for (const o of [ROPE, BALL, TUG, ...TOYS]) o.visible = false; place(dog, 0, 0, 0);
  if (t < TL.invite) {
    // A · llega con la cuerda en la boca, se planta y se aparta cuando vas a cogerla
    const lt = t; const walk = 1 - smooth(1.4, 2.0, lt); place(dog, 0, lerp(-14, 0, easeOut(smooth(0, 2.0, lt))), 0);
    const dodge = smooth(2.5, 3.1, lt); dog.root.rotation.y = -.7 * dodge; dog.root.position.x = 2.5 * dodge;
    dog.pose({ walk: { ph: lt * 9, amp: .8 * walk }, tail: { ph: t * 14, amp: .5, up: .9 }, ear: .3, headYaw: .35 * dodge, bow: .5 * smooth(1.7, 2.2, lt) * (1 - dodge) });
    scene.updateMatrixWorld(true); inMouth(ROPE); orbit(.35, 44, 8, 5, -1);
    hud.push(() => { question('CUANDO TU PERRO TE TRAE', 'UN JUGUETE…', smooth(0, .25, t), 280); txt('…Y NO TE LO SUELTA', W / 2, 1460, 48, { font: 'Montserrat', weight: 800, alpha: smooth(1.6, 1.9, lt) });
      stamp('NO TE ESTÁ VACILANDO', W / 2, 1580, smooth(2.9, 3.1, lt), -.05, COP, 46); });
  } else if (t < TL.alone) {
    // B · invitación a jugar: reverencia y carrera con la cuerda
    const lt = t - TL.invite; const run = smooth(1.3, 1.7, lt);
    if (run < .01) { place(dog, 0, 0, -.4); dog.pose({ bow: .95 + .05 * Math.sin(t * 6), tail: { ph: t * 16, amp: .6, up: 1 }, ear: .5, headPitch: -.2 }); }
    else { const ph = circle(t, TL.invite + 1.3, 9, 18, 0, 0); dog.pose({ walk: { ph, gait: 'gallop', amp: run }, tail: { ph: t * 10, amp: .3, up: .5 }, ear: -.3 }); U.uGrid.value = run; }
    scene.updateMatrixWorld(true); inMouth(ROPE); if (run < .01) orbit(.6, 62, 10, 5, -1); else orbit(.6, 76, 16, 4, -9);
    hud.push(() => { const a = smooth(0, .3, lt); question('TE ESTÁ INVITANDO', 'A JUGAR', a, 280);
      stamp('¡PERSÍGUEME!', W / 2 - 170, 1480, smooth(1.4, 1.6, lt), -.08, BLUE, 44); stamp('¡TIRA!', W / 2 + 230, 1600, smooth(2.2, 2.4, lt), .06, COP, 50); });
  } else if (t < TL.study) {
    // C · solo con un juguete se aburre
    const lt = t - TL.alone; const bored = smooth(.5, 2.5, lt);
    dog.pose({ down: 1, headPitch: .25 + .3 * bored, ear: -.2 * bored, tail: { ph: t * 3, amp: .2 * (1 - bored), up: 0 } }); ROPE.visible = true; ROPE.position.set(2.5, .4, 12); ROPE.rotation.set(0, .4, 0);
    const az = lerp(.95, .7, lt / 3.7); orbit(az, 52, 11, 3.5, 3);
    hud.push(() => { const a = smooth(0, .3, lt); question('PREFIERE JUGAR', 'CONTIGO', a, 280); titleHUD('SOLO CON UN JUGUETE', 'SE ABURRE ENSEGUIDA', smooth(1.2, 1.5, lt), 1520); });
  } else if (t < TL.novel) {
    // D · el estudio: el juego cae ronda a ronda
    const lt = t - TL.study; const dur = TL.novel - TL.study;
    dog.pose({ down: 1, headPitch: .45, ear: -.2, tail: { ph: 0, amp: 0, up: 0 } }); ROPE.visible = true; ROPE.position.set(2.5, .4, 12); ROPE.rotation.set(0, .4, 0);
    orbit(.75, 52, 12, 3.5, 3); expo = .8;
    hud.push(() => { const a = smooth(0, .3, lt); label('2012 · REINO UNIDO', W / 2, 250, a, COP, 28); big('EL MISMO JUGUETE…', 320, a, '#fff', 56);
      panel(90, 1230, 900, 470, a); txt('TIEMPO JUGANDO', 140, 1290, 24, { align: 'left', spacing: 4, alpha: a, fill: COP });
      bars(140, 1620, 800, 260, [1, .62, .4, .27, .2], ['RONDA 1', '2', '3', '4', '5'], a, [COP, COP, COP, COP, COP], smooth(.8, dur - 1.6, lt));
      txt('RONDAS DE 30 s', W - 140, 1290, 22, { align: 'right', alpha: a * .8 }); cite('Pullen, Merrill & Bradshaw · Animal Cognition, 2012', a); });
  } else if (t < TL.trick) {
    // E · juguete nuevo: vuelve a jugar como al principio
    const lt = t - TL.novel; const up = smooth(.3, 1.0, lt);
    BALL.visible = true; const by = Math.max(0, 9 - 30 * (lt * lt)) ; const bb = Math.abs(Math.sin(lt * 6)) * 1.2 * Math.exp(-lt * 1.5) * smooth(.5, .6, lt); BALL.position.set(-2, .95 + by + bb, 11); BALL.rotation.x = lt * 3;
    dog.pose({ down: 1 - up, bow: up * (.9 + .1 * Math.sin(t * 6)), headPitch: -.1 * up, ear: .5 * up, tail: { ph: t * 16, amp: .6 * up, up: up } }); ROPE.visible = true; ROPE.position.set(4.4, .5, 6); ROPE.rotation.set(0, .9, 0);
    orbit(.7, 44, 10, 3.5, 3); bg.material.uniforms.uWarm.value = .25 * up;
    hud.push(() => { const a = smooth(0, .3, lt); big('PERO CON UNO NUEVO…', 300, a, '#fff', 56);
      panel(90, 1230, 900, 470, a); txt('TIEMPO JUGANDO', 140, 1290, 24, { align: 'left', spacing: 4, alpha: a, fill: COP });
      bars(140, 1620, 800, 260, [1, .62, .4, .27, .2, 1.0 * easeOut(smooth(.6, 1.6, lt))], ['1', '2', '3', '4', '5', 'NUEVO'], a, [COP, COP, COP, COP, COP, GREEN], 1);
      stamp('COMO AL PRINCIPIO', W / 2, 400, smooth(1.8, 2.0, lt), -.05, GREEN, 46); });
  } else if (t < TL.tug) {
    // F · truco: rota sus juguetes
    const lt = t - TL.trick; dog.pose({ sit: 1, headYaw: Math.sin(lt * 1.6) * .35, headPitch: .2, ear: .3, tail: { ph: t * 10, amp: .35, up: .2 } });
    TOYS.forEach((o, i) => { const a = i / 4 * TAU + lt * .6; o.visible = true; o.position.set(Math.sin(a) * 9, .9, 9 + Math.cos(a) * 4); o.rotation.set(0, a, 0); });
    const hi = Math.floor(lt * 1.5) % 4; orbit(.2, 62, 16, 6, 3);
    hud.push(() => { const a = smooth(0, .3, lt); label('TRUCO', W / 2, 250, a, COP, 30); big('GUARDA SUS JUGUETES', 320, a, '#fff', 54);
      const p = project(TOYS[hi].position); ring(p.x, p.y, 70, GREEN, a); titleHUD('Y SACA UNO DISTINTO', 'CADA POCOS DÍAS', smooth(1.0, 1.3, lt), 1560); });
  } else if (t < TL.win) {
    // G · tira y afloja: ganar no le vuelve dominante
    const lt = t - TL.tug; const pull = Math.sin(lt * 5); place(dog, 0, -.6 * pull, 0);
    dog.pose({ crouch: .35, headPitch: .1 + .08 * pull, headYaw: .15 * pull, bones: { neck: -.1 }, ear: .1, tail: { ph: t * 12, amp: .4, up: .7 } });
    scene.updateMatrixWorld(true); inMouth(ROPE); const m = mouth(); stick(TUG, m.clone().add(V3(-1.6, 0, .4)), V3(-26, 12, 30));
    orbit(-.6, 46, 9, 5.5, 1);
    hud.push(() => { const a = smooth(0, .3, lt); question('¿Y SI LE DEJAS GANAR', 'AL TIRA Y AFLOJA?', a, 280);
      stamp('NO LE VUELVE DOMINANTE', W / 2, 1520, smooth(2.8, 3.1, lt), -.05, GREEN, 44); cite('Rooney & Bradshaw · Applied Animal Behaviour Science, 2002', smooth(2.6, 2.9, lt)); });
  } else if (t < TL.you) {
    // H · los que ganaban buscaban aún más jugar contigo: vuelve y te la deja delante
    const lt = t - TL.win; const k = easeInOut(smooth(0, 1.6, lt)); place(dog, lerp(-6, 0, k), lerp(-4, 2, k), lerp(1.2, 0, k));
    dog.pose({ walk: { ph: lt * 9, amp: .8 * (1 - smooth(1.4, 1.8, lt)) }, bow: smooth(1.8, 2.4, lt) * (.9 + .1 * Math.sin(t * 6)), tail: { ph: t * 16, amp: .6, up: 1 }, ear: .5, headPitch: -.15 });
    scene.updateMatrixWorld(true); inMouth(ROPE); orbit(.15, 44, 9, 5, 0); bg.material.uniforms.uWarm.value = .25;
    hud.push(() => { const a = smooth(0, .3, lt); label('AL CONTRARIO', W / 2, 250, a, COP, 30); big('LOS QUE GANABAN', 320, a, '#fff', 56); big('BUSCABAN MÁS JUGAR', 395, a, null, 56);
      txt('CON SU HUMANO', W / 2, 470, 44, { font: 'Montserrat', weight: 800, alpha: smooth(1.2, 1.5, lt) }); });
  } else if (t < TL.brand) {
    // I · pregunta final
    const lt = t - TL.you; const dodge = Math.max(0, Math.sin(lt * 2.2)); place(dog, 1.5 * dodge, 0, -.5 * dodge);
    dog.pose({ bow: .95, headYaw: .3 * dodge, tail: { ph: t * 16, amp: .6, up: 1 }, ear: .5, headPitch: -.2 }); scene.updateMatrixWorld(true); inMouth(ROPE);
    orbit(lerp(.5, .75, lt / 3.2), 44, 8.5, 5, -.5); bg.material.uniforms.uWarm.value = .3;
    hud.push(() => { const a = smooth(.1, .4, lt); question('¿EL TUYO TE LO TRAE…', '…Y NO TE LO DA?', a, 280);
      txt('CUÉNTANOSLO EN COMENTARIOS ↓', W / 2, 1560, 34, { font: 'Montserrat', weight: 800, alpha: smooth(1.4, 1.8, lt), fill: COP, spacing: 2 }); });
  } else {
    const lt = t - TL.brand; dog.pose({ bow: .95, tail: { ph: t * 14, amp: .5, up: 1 }, ear: .5, headPitch: -.2 }); scene.updateMatrixWorld(true); inMouth(ROPE); orbit(.75 + lt * .03, 44 + lt * 2, 8.5 + lt * .3, 5, -.5);
    expo = .85; fade = Math.min(.72, lt * .6); hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  U.uC.value.set(dog.root.position.x, dog.root.position.z);
  camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); bg.position.copy(camera.position); scene.updateMatrixWorld(true);
  if (t < TL.brand) bands();
  for (const h of hud) h();
  finish(scene, { t, flash, fade, bloom: .35, expo, grain: .03 });
}
function renderCover() { renderFrame(1.9); coverText('TU PERRO', 'Y SU JUGUETE', 'Por qué te lo trae y no te lo da'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
