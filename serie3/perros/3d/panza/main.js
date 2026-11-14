// NO LO SABÍAS — «Cuando tu perro se pone panza arriba» (perro 3D de cuerpo entero)
// Norman, Pellis, Barrett & Henzi 2015 (Behavioural Processes, «Down but not out»): en el juego, casi ninguna voltereta era sumisión; eran tácticas para esquivar mordiscos o atacar desde abajo.
// Delante de una persona: relajación/confianza o señal de apaciguamiento (cuerpo tenso, lamerse los labios, mirar de reojo = mejor dejarle). Dormir panza arriba: tripa con menos pelo, pierde calor.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, V3, g2, camera, txt, copperGrad, project, titleHUD, drawBrand, coverText, finish, fract, Particles } from '../../lib/core.js';
import { scene, bg, floor, dog, other, inA, flashAt, stamp, question, cite, bands, big, label } from '../../perros3d/render/stage.js';
import { TAU, BLUE, COP, RED, GREEN, look, orbit, place, wp, roll, glow, ring, panel, item, strike } from '../../perros3d/render/extras.js';

const CUTS = ['myth', 'study', 'moves', 'human', 'signs', 'sleep', 'you'];
const HEAT = new Particles(300, { size: .6, seed: 7 }); scene.add(HEAT.obj);
const ZZ = (t, a, x, y) => { for (let i = 0; i < 3; i++) { const u = fract(t * .35 + i / 3); txt('z', x + u * 90 + i * 10, y - u * 220, 40 + u * 40, { font: 'Montserrat', weight: 800, alpha: a * Math.sin(u * Math.PI), fill: BLUE }); } };
// panza arriba con patas que se mueven (pataleo de juego)
function belly(D, t, opts = {}) { const { kick = 0, wag = 0, stiff = 0, x = 0, z = 0, ry = 0, a = Math.PI, headRoll = 0 } = opts;
  const k = (i) => Math.sin(t * 7 + i) * kick; D.pose({ curl: 1 - .3 * stiff, bones: { neck: .9, LFu: k(0), RFu: k(1.7), LHu: k(3.1) * .6, RHu: k(4.4) * .6 }, headPitch: .5, headRoll, tail: { ph: t * 12, amp: wag, up: 0, stiff } }); roll(D, a, x, z, ry); }

function renderFrame(t) {
  g2.clearRect(0, 0, W, H); HEAT.begin();
  let flash = 0; for (const c of CUTS) flash = Math.max(flash, flashAt(t, TL[c], .22, .3));
  const hud = []; let fade = 0, expo = 1; const U = floor.material.uniforms; U.uGrid.value = 0; U.uOff.value.set(0, 0); U.uCompass.value = 0; bg.material.uniforms.uWarm.value = 0;
  const twoDogs = t >= TL.study && t < TL.human; const O = twoDogs ? other() : null; if (globalThis._o) globalThis._o.root.visible = !!O; if (O) { globalThis._o = O; O.root.visible = true; }
  place(dog, 0, 0, 0);
  if (t < TL.myth) {
    // A · se tumba y se da la vuelta
    const lt = t; const d = smooth(.3, 1.1, lt), r = easeInOut(smooth(1.1, 2.4, lt));
    if (r < .01) { dog.pose({ down: d, tail: { ph: t * 10, amp: .4, up: .2 }, ear: .2 }); place(dog, 0, 0, 0); }
    else belly(dog, t, { a: Math.PI * r, kick: .25 * smooth(2.4, 3, lt), wag: .3 });
    orbit(lerp(.85, 1.0, lt / 3.7), 66, 20, 3, -1);
    hud.push(() => { question('CUANDO TU PERRO SE PONE', 'PANZA ARRIBA…', smooth(0, .25, t), 280); stamp('NO SIEMPRE PIDE CARICIAS', W / 2, 1520, smooth(2.6, 2.8, lt), -.05, COP, 44); });
  } else if (t < TL.study) {
    // B · ¿sumisión?
    const lt = t - TL.myth; belly(dog, t, { kick: .1, wag: .15 }); orbit(lerp(.85, .95, lt / 2.7), 68, 28, 2, -1.5);
    hud.push(() => { const a = smooth(0, .3, lt); label('DURANTE AÑOS SE DIJO…', W / 2, 260, a, COP, 28); big('¿SUMISIÓN?', 1500, smooth(.4, .7, lt), '#fff', 84);
      const w = g2.measureText ? 520 : 520; strike(W / 2 - 280, W / 2 + 280, 1500, easeOut(smooth(1.6, 2.2, lt)), 1, RED); });
  } else if (t < TL.moves) {
    // C · dos perros jugando: el de abajo no se rinde
    const lt = t - TL.study; belly(dog, t, { kick: .45, wag: .4, x: 0, ry: 0, headRoll: Math.sin(t * 3) * .3 });
    const lunge = Math.max(0, Math.sin(t * 3.2)); place(O, 7.5, 2 + lunge * 1.2, -Math.PI / 2 - .5); O.pose({ bow: .6 - .4 * lunge, tail: { ph: t * 14, amp: .5, up: 1 }, ear: .4, headPitch: .25 + .25 * lunge, headYaw: Math.sin(t * 2) * .2 });
    orbit(lerp(.25, .45, lt / 6.4), 72, 22, 3, 1, 3);
    hud.push(() => { const a = smooth(0, .3, lt); label('2015 · CANADÁ', W / 2, 250, a, COP, 28); big('VÍDEOS DE PERROS', 320, a, '#fff', 54); big('JUGANDO', 390, a, null, 60);
      titleHUD('CASI NINGUNA VOLTERETA', 'ERA SUMISIÓN', smooth(3.4, 3.7, lt), 1520); cite('Norman, Pellis, Barrett & Henzi · Behavioural Processes, 2015', a); });
  } else if (t < TL.human) {
    // D · eran jugadas: esquivar / atacar desde abajo
    const lt = t - TL.moves; const side = Math.sin(t * 2.4); belly(dog, t, { a: Math.PI + side * .45, kick: .6, wag: .4, headRoll: side * .4 });
    const lunge = Math.max(0, Math.sin(t * 2.4 + 1)); place(O, 7.5, 2 + lunge * 1.4, -Math.PI / 2 - .5); O.pose({ bow: .5 - .3 * lunge, tail: { ph: t * 14, amp: .5, up: 1 }, ear: .4, headPitch: .3 + .3 * lunge });
    orbit(.55, 68, 18, 3, 1, 3);
    hud.push(() => { const a = smooth(0, .3, lt); question('ERAN', 'JUGADAS', a, 280);
      stamp('ESQUIVAR UN MORDISCO', W / 2, 1460, smooth(.8, 1.0, lt), -.05, BLUE, 42); stamp('ATACAR DESDE ABAJO', W / 2, 1600, smooth(2.0, 2.2, lt), .04, COP, 42); });
  } else if (t < TL.signs) {
    // E · delante de ti: confía… o quiere calmar
    const lt = t - TL.human; belly(dog, t, { kick: .08, wag: .25, headRoll: .2 }); orbit(lerp(.8, .95, lt / 6), 68, 30, 1, -1.5); // tu punto de vista, mirando hacia abajo
    hud.push(() => { const a = smooth(0, .3, lt); question('DELANTE DE TI', 'PUEDE SIGNIFICAR:', a, 280);
      panel(90, 1330, 900, 330, smooth(.8, 1.1, lt)); txt('1 · ESTÁ RELAJADO Y CONFÍA EN TI', W / 2, 1420, 36, { font: 'Montserrat', weight: 800, alpha: smooth(.9, 1.2, lt), fill: BLUE });
      txt('2 · INTENTA CALMAR LA SITUACIÓN', W / 2, 1560, 36, { font: 'Montserrat', weight: 800, alpha: smooth(3.3, 3.6, lt), fill: COP }); });
  } else if (t < TL.sleep) {
    // F · fíjate en su cuerpo
    const lt = t - TL.signs; const dur = TL.sleep - TL.signs; const bad = smooth(dur * .4, dur * .4 + .5, lt);
    belly(dog, t, { kick: .15 * (1 - bad), wag: .45 * (1 - bad), stiff: bad, headRoll: .2 + .5 * bad });
    dog.head.tongue.visible = bad > .5 && fract(t * .8) < .25; // se lame los labios
    orbit(lerp(.95, 1.05, lt / 8), 68, 30, 1, -1.5);
    hud.push(() => { const a = smooth(0, .3, lt); question('FÍJATE EN', 'SU CUERPO', a, 260);
      panel(70, 1260, 940, 470, a * .9);
      const g = (1 - bad) * a; item(true, 'CUERPO SUELTO', 1340, g); item(true, 'MUEVE LA COLA', 1420, smooth(.6, .9, lt) * g); txt('→ ADELANTE', W / 2, 1560, 46, { font: 'Montserrat', weight: 800, alpha: smooth(1.4, 1.7, lt) * g, fill: GREEN });
      const r = bad * a; item(false, 'RÍGIDO', 1330, r); item(false, 'SE LAME LOS LABIOS', 1410, smooth(dur * .4 + 1.0, dur * .4 + 1.3, lt) * r); item(false, 'TE MIRA DE REOJO', 1490, smooth(dur * .4 + 2.0, dur * .4 + 2.3, lt) * r);
      txt('→ DÉJALE TRANQUILO', W / 2, 1640, 44, { font: 'Montserrat', weight: 800, alpha: smooth(dur * .4 + 3.0, dur * .4 + 3.3, lt) * r, fill: RED }); });
  } else if (t < TL.you) {
    // G · duerme panza arriba: seguro y fresquito
    const lt = t - TL.sleep; const dur = TL.you - TL.sleep; belly(dog, t * .2, { kick: 0, wag: 0, headRoll: .5 }); bg.material.uniforms.uWarm.value = 0; expo = .75;
    const hk = smooth(dur * .5, dur * .5 + .6, lt); const c = wp(dog.bone.chest);
    for (let i = 0; i < HEAT.n; i++) { const s = HEAT.seed, q = i * 4, age = fract(s[q] + lt * .5); const x = c.x + (s[q + 1] - .5) * 4, z = c.z + (s[q + 2] - .5) * 7 - 1.5, y = c.y + 1.2 + age * 7; const b = hk * Math.sin(age * Math.PI) * .6; HEAT.push(x, y, z, b, .5 * b, .2 * b); }
    orbit(lerp(.8, .95, lt / dur), 66, 26, 2, -1.5);
    hud.push(() => { const a = smooth(0, .3, lt); question('SI DUERME', 'PANZA ARRIBA…', inA(t, TL.sleep, TL.sleep + dur * .5 + .2), 280); ZZ(t, a, 640, 760);
      stamp('SE SIENTE SEGURO', W / 2, 1460, smooth(1.4, 1.6, lt) * (1 - hk), -.05, BLUE, 50); label('DEJA EXPUESTA SU PARTE MÁS VULNERABLE', W / 2, 1580, smooth(2.0, 2.3, lt) * (1 - hk), '#fff', 26);
      big('Y SE REFRESCA', 300, hk, null, 60); titleHUD('LA TRIPA TIENE', 'MENOS PELO', hk, 1520); });
  } else if (t < TL.brand) {
    const lt = t - TL.you; belly(dog, t, { kick: .35, wag: .5, headRoll: Math.sin(t * 2) * .3 }); orbit(lerp(.8, .95, lt / 2.4), 66, 22, 2.5, -1.5); bg.material.uniforms.uWarm.value = .3;
    hud.push(() => { const a = smooth(.1, .4, lt); question('¿EL TUYO DUERME', 'PANZA ARRIBA?', a, 280); txt('CUÉNTANOSLO EN COMENTARIOS ↓', W / 2, 1560, 34, { font: 'Montserrat', weight: 800, alpha: smooth(1.0, 1.4, lt), fill: COP, spacing: 2 }); });
  } else {
    const lt = t - TL.brand; belly(dog, t, { kick: .2, wag: .4 }); orbit(.95 + lt * .03, 66 + lt * 2, 22 + lt * .3, 2.5, -1.5);
    expo = .85; fade = Math.min(.72, lt * .6); hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  HEAT.end();
  U.uC.value.set(dog.root.position.x, dog.root.position.z);
  camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); bg.position.copy(camera.position); scene.updateMatrixWorld(true);
  if (t < TL.brand) bands();
  for (const h of hud) h();
  finish(scene, { t, flash, fade, bloom: .35, expo, grain: .03 });
}
function renderCover() { renderFrame(TL.you + 1); coverText('CUANDO TU PERRO', 'PANZA ARRIBA', 'No siempre te pide caricias'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
