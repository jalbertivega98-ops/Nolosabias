// NO LO SABÍAS — «Cuando tu perro se sienta encima de tus pies» (perro 3D de cuerpo entero + piernas de su humano)
// Horn, Huber & Range 2013 (PLOS ONE): «efecto base segura»: los perros se esforzaban mucho menos por conseguir comida en juguetes-puzle sin su dueño; con el dueño presente (aunque callado) más; con un desconocido, no.
// Odendaal & Meintjes 2003 (The Veterinary Journal): la interacción tranquila perro–persona sube la oxitocina en los dos.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, V3, g2, camera, txt, copperGrad, project, titleHUD, drawBrand, coverText, finish, fract, Particles } from '../../lib/core.js';
import { scene, bg, floor, dog, key, inA, flashAt, stamp, question, cite, bands, big, label, person } from '../../perros3d/render/stage.js';
import { TAU, BLUE, COP, RED, GREEN, look, orbit, place, wp, makeLegs, glow, ring, panel, bars, heart } from '../../perros3d/render/extras.js';

const CUTS = ['contact', 'base', 'study', 'child', 'oxy', 'fear', 'you'];
const LEGS = makeLegs(); LEGS.position.set(0, 0, -4.0); const FEET = LEGS.userData.feet;
const RAIN = new Particles(1600, { size: .22, seed: 31 }); scene.add(RAIN.obj);
const LEGMATS = []; LEGS.traverse(o => { if (o.material && !LEGMATS.includes(o.material)) { o.material.transparent = true; LEGMATS.push(o.material); } });
function legsAlpha(a) { LEGS.visible = a > .01; for (const m of LEGMATS) { m.opacity = a; m.depthWrite = a > .99; } }
// sentado encima de los pies (la cadera sobre las zapatillas)
function onFeet(p = {}) { place(dog, 0, 0, 0); dog.pose({ sit: 1, ...p }); dog.root.position.y = .9; dog.shadow.position.y = .02 - .9; }
function rain(t, k) { if (k <= .01) return; const s = RAIN.seed; for (let i = 0; i < RAIN.n; i++) { const q = i * 4; const y = 34 - fract(s[q] + t * (1.4 + s[q + 3])) * 34; const x = (s[q + 1] - .5) * 70, z = (s[q + 2] - .5) * 60; const b = k * .12; RAIN.push(x, y, z, .6 * b, .75 * b, b); } }

function renderFrame(t) {
  g2.clearRect(0, 0, W, H); RAIN.begin();
  let flash = 0; for (const c of CUTS) flash = Math.max(flash, flashAt(t, TL[c], .22, .3));
  const hud = []; let fade = 0, expo = 1; const U = floor.material.uniforms; U.uGrid.value = 0; U.uOff.value.set(0, 0); U.uCompass.value = 0; bg.material.uniforms.uWarm.value = 0;
  legsAlpha(1); FEET.forEach(f => f.rotation.set(0, 0, 0)); key.intensity = 2.2;
  if (t < TL.contact) {
    // A · llega, se da la vuelta y se sienta encima de tus pies
    const lt = t; const w = smooth(0, 1.4, lt), turn = easeInOut(smooth(1.2, 1.9, lt)), sit = easeInOut(smooth(1.8, 2.5, lt));
    if (sit < .01) { const x = lerp(14, 0, easeOut(w)); place(dog, x, lerp(2, 0, turn), lerp(-Math.PI / 2, 0, turn)); dog.pose({ walk: { ph: lt * 9, amp: .8 * (1 - turn * .8) }, tail: { ph: t * 10, amp: .4, up: .5 }, ear: .2 }); }
    else { onFeet({ sit, tail: { ph: t * 10, amp: .35, up: .2 }, ear: .2 }); dog.root.position.y = .9 * sit; }
    orbit(lerp(1.15, 1.0, lt / 3.1), 64, 13, 5, -2);
    hud.push(() => { question('CUANDO TU PERRO SE SIENTA', 'ENCIMA DE TUS PIES…', smooth(0, .25, t), 280); stamp('NO ES CASUALIDAD', W / 2, 1530, smooth(2.4, 2.6, lt), -.05, COP, 50); });
  } else if (t < TL.base) {
    // B · nota cada movimiento tuyo
    const lt = t - TL.contact; const mv = Math.max(0, Math.sin((lt - 1.2) * 2.4)) * smooth(1.0, 1.3, lt) * (1 - smooth(4.4, 4.8, lt)); FEET[1].rotation.x = -.25 * mv; FEET[0].rotation.x = -.12 * mv;
    const look2 = smooth(.0, .4, mv); onFeet({ headYaw: -.9 * look2, ear: .2 + .6 * look2, tail: { ph: t * 6, amp: .2, up: .2 } });
    orbit(lerp(1.15, 1.3, lt / 5), 62, 10, 5, -2.5);
    hud.push(() => { const a = smooth(0, .3, lt); question('BUSCA', 'CONTACTO', a, 280); const f = project(V3(1.9, 1, -4)); for (let i = 0; i < 3; i++) { const u = fract(t * 1.2 + i / 3); ring(f.x, f.y, 30 + u * 140, BLUE, mv * (1 - u)); }
      titleHUD('SI TE LEVANTAS,', 'SE ENTERA AL INSTANTE', smooth(2.4, 2.7, lt), 1520); });
  } else if (t < TL.study) {
    // C · eres su base segura
    const lt = t - TL.base; onFeet({ headPitch: -.1, ear: .3, tail: { ph: t * 8, amp: .3, up: .2 } }); orbit(.95, 62, 24, 3, -3); bg.material.uniforms.uWarm.value = .25;
    hud.push(() => { const a = smooth(0, .25, lt); const c = project(V3(0, 0, -3)); g2.save(); g2.globalAlpha = a; g2.strokeStyle = COP; g2.lineWidth = 6; g2.shadowColor = COP; g2.shadowBlur = 24; g2.beginPath(); g2.ellipse(c.x, c.y, 320, 120, 0, 0, 7); g2.stroke(); g2.restore();
      label('PARA ÉL ERES', W / 2, 260, a, COP, 30); big('SU BASE SEGURA', 330, a, null, 66); });
  } else if (t < TL.child) {
    // D · Viena 2013: sin su dueño se esfuerza menos; con él, más
    const lt = t - TL.study; const dur = TL.child - TL.study; const back = smooth(dur * .55, dur * .55 + .6, lt);
    legsAlpha(Math.max(back, 1 - smooth(.3, 1.0, lt))); const sad = smooth(.6, 1.4, lt) * (1 - back);
    place(dog, 0, 0, 0); dog.pose({ sit: 1 - .7 * sad, down: .7 * sad, headPitch: .35 * sad - .1 * back, ear: -.3 * sad + .5 * back, tail: { ph: t * 10, amp: .5 * back, up: .2 * back } }); dog.root.position.y = .9 * (1 - sad);
    orbit(1.05, 62, 14, 4.5, -2.5); expo = 1 - .2 * sad;
    hud.push(() => { const a = smooth(0, .3, lt); label('2013 · VIENA', W / 2, 250, a, COP, 28); big('ESFUERZO POR UN PREMIO', 320, a, '#fff', 50);
      panel(90, 1260, 900, 430, a); bars(200, 1600, 680, 240, [.3, 1 * back], ['SIN SU DUEÑO', 'CON SU DUEÑO'], a, [RED, GREEN], 1);
      txt('AUNQUE NO DIJERA NADA', W / 2, 1740, 34, { font: 'Montserrat', weight: 800, alpha: smooth(dur * .55 + 1.4, dur * .55 + 1.7, lt), fill: BLUE }); cite('Horn, Huber & Range · PLOS ONE, 2013', a); });
  } else if (t < TL.oxy) {
    // E · como los niños pequeños con sus padres
    const lt = t - TL.child; onFeet({ headPitch: -.2, ear: .3, tail: { ph: t * 9, amp: .35, up: .2 } }); orbit(1.0, 62, 12, 5, -3); expo = .7;
    hud.push(() => { const a = smooth(0, .3, lt); question('IGUAL QUE LOS NIÑOS', 'PEQUEÑOS', a, 280); person(W / 2 - 110, 1480, 1.1, smooth(.4, .7, lt), COP); person(W / 2 + 90, 1540, .65, smooth(.8, 1.1, lt), BLUE);
      label('CON SUS PADRES', W / 2, 1720, smooth(1.0, 1.3, lt), '#fff', 30); });
  } else if (t < TL.fear) {
    // F · oxitocina en los dos
    const lt = t - TL.oxy; onFeet({ headPitch: -.35, headYaw: Math.sin(lt * 1.2) * .1, ear: .5, tail: { ph: t * 14, amp: .55, up: .3 } }); bg.material.uniforms.uWarm.value = .4; orbit(lerp(.85, 1.05, lt / 5.3), 58, 10, 6, -3);
    hud.push(() => { const a = smooth(0, .3, lt); label('EL CONTACTO OS SIENTA BIEN', W / 2, 250, a, COP, 26); big('OXITOCINA ↑', 330, smooth(.8, 1.1, lt), null, 70); label('LA HORMONA DEL APEGO', W / 2, 410, smooth(1.4, 1.7, lt), '#fff', 26);
      for (let i = 0; i < 5; i++) { const u = fract(t * .4 + i / 5); heart(220 + i * 160, 1500 - u * 300, .9 + .3 * Math.sin(i), a * Math.sin(u * Math.PI) * .9); }
      txt('EN ÉL  ·  Y EN TI', W / 2, 1620, 50, { font: 'Montserrat', weight: 800, alpha: smooth(2.6, 2.9, lt) }); cite('Odendaal & Meintjes · The Veterinary Journal, 2003', a); });
  } else if (t < TL.you) {
    // G · truenos o visitas: busca protección
    const lt = t - TL.fear; rain(t, 1); expo = .7; key.intensity = 1.2; const bolt = (fract(lt / 2.1) < .06) ? 1 : 0; flash = Math.max(flash, bolt * .3);
    place(dog, 0, 0, 0); dog.pose({ sit: .6, down: .4, crouch: .2, headPitch: .25, ear: -.7, tail: { ph: 0, amp: 0, up: -.4, stiff: 1 } }); dog.root.position.y = .5; dog.root.position.z = -.8;
    orbit(lerp(1.15, 1.0, lt / 5.3), 60, 12, 4.5, -3);
    hud.push(() => { const a = smooth(0, .3, lt); question('SI SOLO PASA CON', 'TRUENOS O VISITAS…', a, 280); stamp('BUSCA PROTECCIÓN', W / 2, 1520, smooth(2.6, 2.9, lt), -.05, BLUE, 50); });
  } else if (t < TL.brand) {
    const lt = t - TL.you; onFeet({ headPitch: -.2, ear: .4, tail: { ph: t * 14, amp: .55, up: .3 }, headYaw: Math.sin(lt * 1.5) * .15 }); bg.material.uniforms.uWarm.value = .3; orbit(lerp(.95, 1.1, lt / 3), 62, 12, 5, -2.5);
    hud.push(() => { const a = smooth(.1, .4, lt); question('¿EL TUYO TAMBIÉN', 'SE SIENTA EN TUS PIES?', a, 280); txt('CUÉNTANOSLO EN COMENTARIOS ↓', W / 2, 1560, 34, { font: 'Montserrat', weight: 800, alpha: smooth(1.2, 1.6, lt), fill: COP, spacing: 2 }); });
  } else {
    const lt = t - TL.brand; onFeet({ headPitch: -.2, ear: .4, tail: { ph: t * 14, amp: .5, up: .3 } }); orbit(1.1 + lt * .03, 62 + lt * 2, 12 + lt * .3, 5, -2.5);
    expo = .85; fade = Math.min(.72, lt * .6); hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  RAIN.end();

  U.uC.value.set(0, -2);
  camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); bg.position.copy(camera.position); scene.updateMatrixWorld(true);
  if (t < TL.brand) bands();
  for (const h of hud) h();
  finish(scene, { t, flash, fade, bloom: .35, expo, grain: .03 });
}
function renderCover() { renderFrame(TL.you + 1.2); coverText('CUANDO TU PERRO', 'EN TUS PIES', 'Por qué se sienta encima: no es casualidad'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
