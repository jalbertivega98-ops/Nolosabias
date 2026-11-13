// NO LO SABÍAS — «Cuando tu perro mueve la cola» (perro 3D de cuerpo entero)
// Quaranta, Siniscalchi y Vallortigara 2007 (Current Biology): cola más a la derecha ante el dueño, más a la izquierda ante un perro dominante desconocido.
// Siniscalchi, Lusito, Vallortigara y Quaranta 2013 (Current Biology): ver un perro que mueve la cola a la izquierda sube la frecuencia cardiaca y la ansiedad.
// Leaver y Reimchen 2008 (Behaviour): réplica de perro con cola larga que se mueve → acercamientos sin dudar; cola corta → más cautela.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, V3, g2, camera, txt, copperGrad, project, titleHUD, arrowXY, drawBrand, coverText, finish, noise1, fract } from '../../lib/core.js';
import { scene, bg, floor, dog, other, robot, inA, flashAt, stamp, question, cite, bands, big, label, person, ecg, brain } from '../../perros3d/render/stage.js';

const CUTS = ['side', 'study', 'owner', 'stranger', 'brain', 'others', 'heart', 'height', 'robot', 'long', 'short', 'you'];
const BLUE = '#9fd8ff', COP = '#e3a372';
function look(px, py, pz, tx, ty, tz, fov = 30) { camera.fov = fov; camera.position.set(px, py, pz); camera.lookAt(tx, ty, tz); }
function happy(t, bias = 0, amp = .55, up = .6) { return { ph: t * 13, amp, bias, up }; }
function place(D, x, z, ry = 0) { D.root.position.set(x, 0, z); D.root.rotation.set(0, ry, 0); D.root.visible = true; }
function tailScreen(D) { return project(D.tailTip()); }

function renderFrame(t) {
  g2.clearRect(0, 0, W, H);
  let flash = 0; for (const c of CUTS) flash = Math.max(flash, flashAt(t, TL[c], .22, .3));
  const hud = []; let fade = 0, expo = 1;
  dog.root.visible = true; robot.visible = false; floor.material.uniforms.uGrid.value = 0; floor.material.uniforms.uOff.value.set(0, 0); bg.material.uniforms.uWarm.value = 0;
  const O = (t >= TL.stranger && t < TL.brain) || (t >= TL.others && t < TL.height) ? other() : null; if (!O && (globalThis._oth)) globalThis._oth.root.visible = false; if (O) globalThis._oth = O;
  place(dog, 0, 0, 0);
  const L = (a, b) => inA(t, TL[a], TL[b]);
  if (t < TL.side) {
    // A · gancho: cola moviéndose, vista trasera 3/4
    const lt = t; dog.pose({ tail: happy(t), ear: .2, headYaw: noise1(t * .4) * .15 });
    const az = lerp(1.15, 1.35, lt / 3.6); look(Math.sin(az) * 58, 10, Math.cos(az) * 58, 0, 7, -.5);
    hud.push(() => { question('CUANDO TU PERRO', 'MUEVE LA COLA…', smooth(0, .25, t), 300); titleHUD('NO SIEMPRE SIGNIFICA', 'QUE ESTÉ CONTENTO', smooth(1.5, 1.8, lt), 1480); });
  } else if (t < TL.study) {
    // B · fíjate en el lado
    const lt = t - TL.side; dog.pose({ tail: happy(t, 0, .7), ear: .2 }); const k = easeInOut(smooth(0, 1.2, lt)); const az = lerp(1.35, Math.PI, k);
    look(Math.sin(az) * 40, 9, Math.cos(az) * 40, 0, 6.5, -2);
    hud.push(() => { question('FÍJATE', 'EN EL LADO', smooth(0, .2, lt), 300); const p = tailScreen(dog); const a = smooth(.2, .5, lt);
      arrowXY(p.x - 90, p.y, p.x - 330, p.y, a, BLUE, 14); arrowXY(p.x + 90, p.y, p.x + 330, p.y, a, COP, 14); });
  } else if (t < TL.owner) {
    // C · 2007, Italia: grabaron a perros mirando cosas distintas
    const lt = t - TL.study; dog.pose({ tail: happy(t, 0, .3, .4), headYaw: Math.sin(lt * 1.3) * .45, ear: .4 });
    look(-20, 9.5, 38 - lt * .8, 0, 6.5, 0);
    hud.push(() => { const a = smooth(0, .3, lt); label('2007 · ITALIA', W / 2, 250, a, COP, 28); big('GRABARON A PERROS', 320, a, '#fff', 52); big('MIRANDO COSAS DISTINTAS', 390, a, null, 54);
      // marco de grabación
      g2.save(); g2.globalAlpha = a * .9; g2.strokeStyle = '#fff'; g2.lineWidth = 5; const x0 = 110, y0 = 520, x1 = 970, y1 = 1380, c = 70;
      for (const [x, y, dx, dy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) { g2.beginPath(); g2.moveTo(x, y + dy * c); g2.lineTo(x, y); g2.lineTo(x + dx * c, y); g2.stroke(); }
      g2.fillStyle = '#ff4a3a'; g2.globalAlpha = a * (fract(t) < .6 ? 1 : .25); g2.beginPath(); g2.arc(x0 + 40, y0 + 45, 13, 0, 7); g2.fill(); g2.restore();
      txt('REC', x0 + 64, y0 + 46, 30, { align: 'left', font: 'Montserrat', weight: 800, alpha: a }); const s = Math.floor(lt * 30); txt(`00:0${Math.floor(lt)}:${String(s % 30).padStart(2, '0')}`, x1 - 30, y0 + 46, 28, { align: 'right', alpha: a * .8 });
      cite('Quaranta, Siniscalchi y Vallortigara · Current Biology, 2007', a); });
  } else if (t < TL.stranger) {
    // D · ve a su dueño → más a su derecha
    const lt = t - TL.owner; dog.pose({ tail: happy(t, .5 * smooth(.2, .8, lt), .45, .7), ear: .3 });
    look(0, 12, -42, 0, 9, 4);
    hud.push(() => { const a = smooth(0, .3, lt); txt('VE A SU DUEÑO', W / 2, 300, 56, { font: 'Montserrat', weight: 800, alpha: a }); person(W / 2, 470, .7 + lt * .02, a);
      const p = tailScreen(dog); arrowXY(W / 2 + 40, 1370, W / 2 + 360, 1370, smooth(.5, 1, lt), COP, 16);
      big('MÁS A SU DERECHA', 1500, smooth(.6, .9, lt), null, 62); label('(LA DERECHA DEL PERRO)', W / 2, 1570, smooth(.9, 1.2, lt), '#fff', 24);
      cite('Quaranta et al. · Current Biology, 2007', a); });
  } else if (t < TL.brain) {
    // E · perro grande desconocido → más a su izquierda
    const lt = t - TL.stranger; place(O, 0, 30, Math.PI); O.root.scale.setScalar(1.22); O.pose({ tail: { ph: 0, amp: 0, up: 1.1, stiff: 1 }, ear: 1, headPitch: -.05 });
    dog.pose({ tail: { ph: t * 10, amp: .3, bias: -.5 * smooth(.3, .9, lt), up: .15 }, crouch: .12 * smooth(0, .8, lt), headPitch: .15, ear: -.3 });
    look(4, 15, -44, 0, 8, 12);
    hud.push(() => { const a = smooth(0, .3, lt); txt('PERRO GRANDE DESCONOCIDO', W / 2, 270, 44, { font: 'Montserrat', weight: 800, alpha: a }); label('QUE LE IMPONE', W / 2, 330, a, BLUE, 28);
      const p = tailScreen(dog); arrowXY(W / 2 - 40, 1370, W / 2 - 360, 1370, smooth(.5, 1, lt), BLUE, 16);
      big('MÁS A SU IZQUIERDA', 1500, smooth(.6, .9, lt), BLUE, 62); cite('Quaranta et al. · Current Biology, 2007', a); });
  } else if (t < TL.others) {
    // F · el cerebro: cada mitad mueve el lado contrario
    const lt = t - TL.brain; const kL = smooth(6.0, 6.3, lt) * (1 - smooth(7.3, 7.6, lt)), kR = smooth(7.4, 7.7, lt);
    dog.pose({ tail: happy(t, .5 * kL - .5 * kR, .4, .6), ear: .2 }); look(0, 13, -42, 0, 10.5, 2, 32);
    hud.push(() => { const a = smooth(0, .3, lt); question('¿POR QUÉ?', '', a * (1 - smooth(1.2, 1.5, lt)), 260);
      brain(W / 2, 560, 1.15, a, .25 + kL, .25 + kR, t); txt('IZQ.', W / 2 - 220, 560, 30, { font: 'Montserrat', weight: 800, alpha: a * .8, fill: COP }); txt('DCHA.', W / 2 + 230, 560, 30, { font: 'Montserrat', weight: 800, alpha: a * .8, fill: BLUE });
      // cruce: cada hemisferio → lado contrario
      const c = smooth(1.2, 2.4, lt); const tp = tailScreen(dog); arrowXY(W / 2 - 90, 680, W / 2 + 330, 1250, c * (.35 + kL), COP, 9); arrowXY(W / 2 + 90, 680, W / 2 - 330, 1250, c * (.35 + kR), BLUE, 9);
      titleHUD('CADA MITAD DEL CEREBRO', 'MUEVE EL LADO CONTRARIO', smooth(1.2, 1.5, lt) * (1 - smooth(5.6, 5.9, lt)), 1440);
      if (lt > 5.6) { big('ACERCARSE → DERECHA', 1440, kL + smooth(7.4, 7.7, lt) * .35, null, 50); big('ALEJARSE → IZQUIERDA', 1530, kR, BLUE, 50); } });
  } else if (t < TL.heart) {
    // G · los otros perros lo leen
    const lt = t - TL.others; place(dog, 0, -8, 0); place(O, 0, 8, Math.PI); O.root.scale.setScalar(1); O.pose({ tail: happy(t, 0, .4, .5), ear: .5 });
    dog.pose({ tail: happy(t, 0, .3, .4), ear: .6, headPitch: -.05 }); const az = lerp(1.35, 1.5, lt / 3); look(Math.sin(az) * 64, 10, Math.cos(az) * 64, 0, 7, 0);
    hud.push(() => question('Y LO MÁS LOCO:', 'LOS OTROS PERROS LO LEEN', smooth(0, .3, lt), 300));
  } else if (t < TL.height) {
    // H · 2013: cola a la izquierda → se le acelera el corazón
    const lt = t - TL.heart; const lf = smooth(2.4, 3.0, lt); place(dog, 0, -8, 0); place(O, 0, 8, Math.PI); O.root.scale.setScalar(1);
    O.pose({ tail: { ph: t * 12, amp: .4, bias: -.55 * lf, up: .5 }, ear: .3 }); dog.pose({ tail: { ph: t * 9, amp: .2 * (1 - lf), up: .3 - lf * .2 }, ear: .6 + lf * .4, crouch: lf * .12, headPitch: .05 * lf });
    look(-64, 10, 1 + lt * .4, 0, 7, 0);
    const bpm = lerp(78, 132, smooth(3.0, 5.0, lt));
    hud.push(() => { const a = smooth(0, .3, lt); label('2013 · VÍDEOS DE PERROS MOVIENDO LA COLA', W / 2, 250, a, COP, 26);
      ecg(140, 470, 560, 110, t, bpm, smooth(1.0, 1.4, lt)); txt(Math.round(bpm) + '', 900, 440, 80, { font: 'Montserrat', weight: 800, alpha: smooth(1.0, 1.4, lt), fill: lf > .5 ? '#ff7a5a' : '#fff' }); label('PULSACIONES', 900, 510, smooth(1, 1.4, lt), '#fff', 20);
      big('COLA A LA IZQUIERDA', 1440, lf, BLUE, 52); stamp('ALERTA', W / 2, 1560, smooth(4.2, 4.5, lt), -.06, '#ff7a5a', 50);
      cite('Siniscalchi et al. · Current Biology, 2013', a); });
  } else if (t < TL.robot) {
    // I · cola alta, rígida y vibrando: tensión
    const lt = t - TL.height; dog.pose({ tail: { ph: t * 42, amp: .09 * smooth(.3, .8, lt), up: 1.25, stiff: 1 }, ear: 1, headPitch: -.1 });
    const az = lerp(2.2, 2.45, lt / 4.7); look(Math.sin(az) * 48, 10, Math.cos(az) * 48, 0, 7.5, -3.5);
    hud.push(() => { const a = smooth(0, .3, lt); question('NO ES SOLO EL LADO:', '', a, 250); const tp = tailScreen(dog);
      const items = [['ALTA', 1.2], ['RÍGIDA', 1.7], ['VIBRA MUY RÁPIDO', 2.2]]; items.forEach(([s, d], i) => { const b = smooth(d, d + .25, lt); txt('• ' + s, 150, 400 + i * 70, 46, { align: 'left', font: 'Montserrat', weight: 800, alpha: b, fill: i === 2 ? COP : '#fff' }); });
      g2.save(); g2.globalAlpha = smooth(1.2, 1.5, lt) * .9; g2.strokeStyle = COP; g2.lineWidth = 4; g2.setLineDash([10, 10]); g2.beginPath(); g2.arc(tp.x, tp.y, 90, 0, 7); g2.stroke(); g2.restore();
      stamp('TENSIÓN, NO ALEGRÍA', W / 2, 1520, smooth(3.0, 3.3, lt), -.05, '#ff7a5a', 50); });
  } else if (t < TL.brand) {
    // J–M · perro robot (cola larga / corta) y pregunta final
    const inYou = t >= TL.you; robot.visible = !inYou; robot.position.set(2, 0, 12); robot.rotation.y = Math.PI + .95;
    const isShort = t >= TL.short; robot.userData.pose(t * 11, isShort ? .5 : .75, isShort ? 1 : 6, .9);
    if (t < TL.long) { const lt = t - TL.robot; place(dog, -2.5, -14, 0); dog.pose({ tail: { ph: t * 8, amp: .2, up: .4 }, ear: .7 + .2 * Math.sin(t * 3), headPitch: -.05 });
      look(-16, 24, -60 + lt * .4, 0, 7, 3);
      hud.push(() => { const a = smooth(0, .3, lt); label('CANADÁ', W / 2, 250, a, COP, 28); big('UN PERRO ROBOT', 320, a, '#fff', 56); big('CON COLA', 390, a, null, 60); cite('Leaver y Reimchen · Behaviour, 2008', a); });
    } else if (t < TL.short) { const lt = t - TL.long; const k = clamp(lt / 3.2); const z = lerp(-14, -1.5, easeOut(k)); place(dog, -2.5, z, 0);
      const ph = (z + 14) / 4.6 * Math.PI * 2; dog.pose({ walk: { ph, amp: 1 - smooth(.85, 1, k) }, tail: happy(t, 0, .5, .6), ear: .5 });
      look(-16, 24, -60 + lt * 1.2, 0, 7, 4);
      hud.push(() => { const a = smooth(0, .3, lt); const r = project(V3(5, 14, 16)); label('COLA LARGA', r.x, r.y - 40, a, COP, 30);
        big('✓ SE ACERCABAN', 1460, smooth(.6, .9, lt), '#fff', 56); big('SIN MIEDO', 1535, smooth(.6, .9, lt), null, 60); cite('Leaver y Reimchen · Behaviour, 2008', a); });
    } else if (t < TL.you) { const lt = t - TL.short; const z = lerp(-1.5, -6, easeInOut(smooth(.3, 1.6, lt))); place(dog, -2.5, z, 0);
      dog.pose({ walk: { ph: -(z + 1.5) / 4.6 * Math.PI * 2, amp: .6 * smooth(.3, .6, lt) * (1 - smooth(1.4, 1.6, lt)) }, tail: { ph: t * 6, amp: .08, up: .1 }, ear: -.2, headPitch: .25 * smooth(.2, .8, lt), crouch: .1 });
      look(-16, 24, -56 - lt * .4, 0, 7, 4);
      hud.push(() => { const a = smooth(0, .3, lt); const r = project(V3(5, 14, 16)); label('COLA CORTA', r.x, r.y - 40, a, BLUE, 30);
        const hp = project(dog.head.root.localToWorld(V3(0, 2.5, 0))); for (let i = 0; i < 3; i++) { const b = smooth(.6 + i * .3, .9 + i * .3, lt); txt('?', hp.x - 70 + i * 70, hp.y - 30 - 20 * Math.sin(t * 3 + i), 70 + i * 6, { font: 'Montserrat', weight: 800, alpha: b, fill: BLUE }); }
        big('DUDABAN MÁS', 1480, smooth(.6, .9, lt), BLUE, 62); cite('Leaver y Reimchen · Behaviour, 2008', a); });
    } else { const lt = t - TL.you; dog.pose({ tail: happy(t, .35 * Math.sin(lt * .9), .6, .7), ear: .3, headYaw: Math.sin(lt * .7) * .2 }); bg.material.uniforms.uWarm.value = .3;
      const az = lerp(2.3, 2.75, lt / 5); look(Math.sin(az) * 42, 9, Math.cos(az) * 42, 0, 6.5, -1.5);
      hud.push(() => { const a = smooth(.1, .4, lt); question('¿Y EL TUYO?', '¿HACIA QUÉ LADO', a, 260); big('MUEVE LA COLA AL VERTE?', 460, a, null, 54);
        const p = tailScreen(dog); const b = smooth(1.2, 1.6, lt); arrowXY(W / 2 - 40, 1330, W / 2 - 330, 1330, b, BLUE, 12); arrowXY(W / 2 + 40, 1330, W / 2 + 330, 1330, b, COP, 12);
        txt('FÍJATE ESTA NOCHE', W / 2, 1490, 40, { font: 'Montserrat', weight: 800, alpha: smooth(2.2, 2.6, lt) });
        txt('CUÉNTANOSLO EN COMENTARIOS ↓', W / 2, 1570, 34, { font: 'Montserrat', weight: 800, alpha: smooth(2.6, 3.0, lt), fill: COP, spacing: 2 }); }); }
  } else {
    // N · marca
    const lt = t - TL.brand; dog.pose({ tail: happy(t, 0, .5, .6), ear: .3 }); const az = 2.75 + lt * .05; look(Math.sin(az) * (42 + lt * 2), 9 + lt * .3, Math.cos(az) * (42 + lt * 2), 0, 6.5, -1.5);
    expo = .85; fade = Math.min(.72, lt * .6); hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  floor.material.uniforms.uC.value.set(dog.root.position.x, dog.root.position.z);
  camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); bg.position.copy(camera.position);
  scene.updateMatrixWorld(true);
  if (t < TL.brand) bands();
  for (const h of hud) h();
  finish(scene, { t, flash, fade, bloom: .35, expo, grain: .03 });
}
function renderCover() { renderFrame(TL.owner + 1.6); coverText('CUANDO TU PERRO', 'MUEVE LA COLA', 'No siempre significa que esté contento'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
