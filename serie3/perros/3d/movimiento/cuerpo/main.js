// NO LO SABÍAS — «Cuando tu perro se sacude» (perro 3D de cuerpo entero: sacudida, norte–sur, carreras locas, reverencia de juego)
// Dickerson, Mills, Hu et al. 2012 (J. R. Soc. Interface): perros ~4–5 Hz, quitan ~70 % del agua en ~4 s; la piel suelta amplía el latigazo; animales pequeños, más rápido (ratón ~27–30 Hz).
// Hart et al. 2013 (Frontiers in Zoology): 70 perros de 37 razas durante 2 años; con el campo magnético en calma prefieren el eje norte–sur al hacer sus necesidades.
// «Zoomies» (FRAPs: frenetic random activity periods). Bekoff 1995 (Behaviour): la reverencia de juego aparece justo antes o después de mordiscos de juego para señalar que es juego.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, V3, g2, camera, txt, copperGrad, project, titleHUD, bar, bigStat, arrowXY, drawBrand, coverText, finish, noise1, fract, Particles } from '../../lib/core.js';
import { scene, bg, floor, dog, inA, flashAt, stamp, question, cite, bands, big, label } from '../../perros3d/render/stage.js';

const CUTS = ['fast', 'skin', 'size', 'north', 'axis', 'compass', 'zoom', 'frap', 'bow', 'you'];
const BLUE = '#9fd8ff', COP = '#e3a372', TAU = Math.PI * 2;
const DROPS = new Particles(2600, { size: .7, seed: 11 }); scene.add(DROPS.obj);
const SPEED = new Particles(500, { size: .25, seed: 5 }); scene.add(SPEED.obj);
function look(px, py, pz, tx, ty, tz, fov = 30) { camera.up.set(0, 1, 0); camera.fov = fov; camera.position.set(px, py, pz); camera.lookAt(tx, ty, tz); }
function orbit(az, d, y, ty = 6.5, tz = -1) { look(Math.sin(az) * d, y, Math.cos(az) * d + tz, 0, ty, tz); }
function place(x, z, ry = 0) { dog.root.position.set(x, 0, z); dog.root.rotation.set(0, ry, 0); }
// gotas despedidas por la sacudida (coordenadas del perro en el origen, mirando a +z)
function drops(t, f, k, amp = 1) {
  if (k <= .01) return; const L = .8, s = DROPS.seed;
  for (let i = 0; i < DROPS.n; i++) { const q = i * 4; const age = fract(s[q] + t / L); const tb = t - age * L; const sgn = Math.cos(TAU * f * tb);
    const th = s[q + 1] * TAU, zz = lerp(-4.6, 3.4, s[q + 2]), rr = 2.3; const c = Math.cos(th), sn = Math.sin(th); if (sn < -.6) continue;
    const v = 8 * amp * sgn * (.6 + s[q + 3] * .8); const tt = age * L;
    const x = c * rr + (-sn * v + c * 1.5) * tt, y = 6.3 + sn * rr + (c * v + sn * 1.5 + 2) * tt - 12 * tt * tt, z = zz + (s[q + 3] - .5) * 2 * tt;
    if (y < 0) continue; const b = k * (1 - age * .7) * 1.3; DROPS.push(x, y, z, .55 * b, .85 * b, 1.2 * b); }
}
function circle(t, t0, R, speed, cx = 0, cz = 0, gait = 'trot') { const s = (t - t0) * speed; const a = s / R; place(cx + Math.sin(a) * R, cz + Math.cos(a) * R - R, a + Math.PI / 2); return s / (gait === 'gallop' ? 9 : 4.6) * TAU; }

function renderFrame(t) {
  g2.clearRect(0, 0, W, H); DROPS.begin(); SPEED.begin();
  let flash = 0; for (const c of CUTS) flash = Math.max(flash, flashAt(t, TL[c], .22, .3));
  const hud = []; let fade = 0, expo = 1; const U = floor.material.uniforms; U.uGrid.value = 0; U.uOff.value.set(0, 0); U.uCompass.value = 0; bg.material.uniforms.uWarm.value = 0;
  place(0, 0, 0);
  if (t < TL.fast) {
    // A · gancho: se sacude a cámara lenta y salpica
    const lt = t; const f = 1.3, k = smooth(.2, .6, lt); dog.pose({ shake: { ph: TAU * f * t, amp: k }, tail: { ph: TAU * f * t - 2, amp: .3 * k, up: .2 } }); drops(t, f, k, .8);
    orbit(lerp(.75, .95, lt / 4), 50, 9, 6.8, -.5);
    hud.push(() => { question('CUANDO TU PERRO', 'SE SACUDE…', smooth(0, .25, t), 300); stamp('APÁRTATE', W / 2, 1500, smooth(2.0, 2.2, lt), -.06, '#ff7a5a', 56); label('CÁMARA LENTA', 900, 1700, .6, '#fff', 20); });
  } else if (t < TL.skin) {
    // B · 4–5 veces por segundo; 70 % del agua en 4 s
    const lt = t - TL.fast; const f = 4.5; dog.pose({ shake: { ph: TAU * f * t, amp: .85 }, tail: { ph: TAU * f * t - 2, amp: .25, up: .2 } }); drops(t, f, 1, 1.2);
    orbit(lerp(.3, -.1, lt / 7), 50, 10, 6.8, -.5);
    const w = smooth(3.4, 6.6, lt);
    hud.push(() => { bigStat('UN PERRO MEDIANO', '4–5', 380, smooth(0, .3, lt), .5); label('SACUDIDAS POR SEGUNDO', W / 2, 470, smooth(.2, .5, lt), '#fff', 30);
      const b = smooth(3.2, 3.5, lt); bar(150, 1440, 780, 1 - .7 * w, 'AGUA EN EL PELO', Math.round(100 - 70 * w) + ' %', b, BLUE); txt((4 * w).toFixed(1) + ' s', 150, 1500, 34, { align: 'left', font: 'Montserrat', weight: 800, alpha: b });
      big('−70 % DEL AGUA EN 4 s', 1580, smooth(6.0, 6.3, lt), null, 50); cite('Dickerson et al. · J. R. Soc. Interface, 2012', smooth(0, .3, lt)); });
  } else if (t < TL.size) {
    // C · la piel suelta da latigazos
    const lt = t - TL.skin; const f = 1.0; dog.pose({ shake: { ph: TAU * f * t, amp: 1.15 }, tail: { ph: TAU * f * t - 2, amp: .35, up: .2 } }); drops(t, f, .7, .7);
    look(0, 11, -48 + lt * 1.2, 0, 7, -2);
    hud.push(() => { const a = smooth(0, .3, lt); question('EL TRUCO:', 'LA PIEL VA SUELTA', a, 300); const c = project(V3(0, 6.3, -3));
      const ph = Math.sin(TAU * f * t); for (const [r, col, k, lab] of [[150, '#fff', .35, 'CUERPO'], [270, COP, 1, 'PIEL']]) { g2.save(); g2.globalAlpha = a * .9; g2.strokeStyle = col; g2.lineWidth = 6; g2.shadowColor = col; g2.shadowBlur = 16;
        const a0 = -Math.PI / 2 - .9 * k, a1 = -Math.PI / 2 + .9 * k; g2.beginPath(); g2.arc(c.x, c.y, r, a0, a1); g2.stroke(); const am = -Math.PI / 2 + ph * .9 * k; g2.fillStyle = col; g2.beginPath(); g2.arc(c.x + Math.cos(am) * r, c.y + Math.sin(am) * r, 14, 0, 7); g2.fill(); g2.restore();
        txt(lab, c.x + r + 30, c.y - r * .55, 24, { align: 'left', spacing: 4, alpha: a, fill: col }); }
      titleHUD('DA LATIGAZOS MUCHO MÁS AMPLIOS', 'QUE EL PROPIO CUERPO', smooth(1.4, 1.7, lt), 1480); label('CÁMARA LENTA', 900, 1700, .6 * a, '#fff', 20); });
  } else if (t < TL.north) {
    // D · cuanto más pequeño, más rápido
    const lt = t - TL.size; const f = 4.5; dog.pose({ shake: { ph: TAU * f * t, amp: .8 }, tail: { ph: TAU * f * t - 2, amp: .25, up: .2 } }); drops(t, f, .8, 1.1);
    orbit(-.6, 56, 9, 9.5, -.5);
    hud.push(() => { const a = smooth(0, .3, lt); question('CUANTO MÁS PEQUEÑO,', 'MÁS RÁPIDO', a, 280);
      const b = smooth(1.2, 1.5, lt); bar(150, 560, 780, 4.5 / 30, 'PERRO', '≈ 4–5 /s', b, COP); const c = smooth(3.0, 3.3, lt); bar(150, 700, 780, 1 * easeOut(smooth(3.0, 4.2, lt)), 'RATÓN', '≈ 30 /s', c, BLUE);
      // metrónomos: punto que oscila a su frecuencia (la del ratón se ve como un borrón)
      for (const [y, fr, col, al] of [[620, 1.2, COP, b], [760, 8, BLUE, c]]) { if (al < .01) continue; const x = W / 2 + Math.sin(TAU * fr * t) * 120; g2.save(); g2.globalAlpha = al; g2.fillStyle = col; g2.shadowColor = col; g2.shadowBlur = 20; g2.beginPath(); g2.arc(x, y + 10, 10, 0, 7); g2.fill(); g2.restore(); }
      cite('Dickerson et al. · J. R. Soc. Interface, 2012', a); });
  } else if (t < TL.axis) {
    // E–F · vueltas antes de hacer caca; el estudio de 2013
    const lt = t - TL.north; const ph = circle(t, TL.north, 4.2, 4.5); dog.pose({ walk: { ph, amp: .8 }, tail: { ph: t * 6, amp: .15, up: .3 }, headPitch: .25, ear: .2 });
    look(-34, 50, 52, 0, 3, -4.2);
    hud.push(() => { question('¿POR QUÉ DA VUELTAS', 'ANTES DE HACER CACA?', inA(t, TL.north, TL.study + .2), 300);
      const a = smooth(TL.study - TL.north, TL.study - TL.north + .3, lt); label('2013 · CHEQUIA Y ALEMANIA', W / 2, 250, a, COP, 28);
      const n = Math.round(70 * easeOut(smooth(TL.study - TL.north + .6, TL.study - TL.north + 2.2, lt))); txt(n + ' PERROS', W / 2, 340, 66, { font: 'Montserrat', weight: 800, alpha: a });
      txt('DURANTE 2 AÑOS', W / 2, 420, 50, { font: 'Montserrat', weight: 800, alpha: smooth(TL.study - TL.north + 2.4, TL.study - TL.north + 2.7, lt), fill: copperGrad(160, 920, 420, .5) });
      cite('Hart et al. · Frontiers in Zoology, 2013', a); });
  } else if (t < TL.compass) {
    // G · vista cenital: se coloca en el eje norte–sur
    const lt = t - TL.axis; const k = easeInOut(smooth(0, 2.2, lt)); const a0 = 1.3, ang = lerp(a0, Math.PI, k);
    place(0, 0, ang); dog.pose({ walk: { ph: lt * 6, amp: .7 * (1 - smooth(1.6, 2.2, lt)) }, crouch: .25 * smooth(2.4, 3.2, lt), tail: { ph: 0, amp: 0, up: .5 * smooth(2.4, 3.2, lt) }, headPitch: .2 });
    U.uCompass.value = smooth(0, .6, lt); camera.up.set(0, 0, -1); camera.fov = 30; camera.position.set(0, 74, .01); camera.lookAt(0, 0, 0);
    hud.push(() => { const a = smooth(0, .4, lt); for (const [s, p, col] of [['N', V3(0, 0, -15.5), '#ff8a5a'], ['S', V3(0, 0, 15.5), BLUE], ['E', V3(15.5, 0, 0), '#fff'], ['O', V3(-15.5, 0, 0), '#fff']]) { const q = project(p); txt(s, q.x, q.y, 48, { font: 'Montserrat', weight: 800, alpha: a, fill: col }); }
      label('CON EL CAMPO MAGNÉTICO EN CALMA', W / 2, 250, a, COP, 26); stamp('EJE NORTE–SUR', W / 2, 1520, smooth(2.4, 2.7, lt), -.05, COP, 56); cite('Hart et al. · Frontiers in Zoology, 2013', a); });
  } else if (t < TL.zoom) {
    // H · lo notan… y nadie sabe para qué
    const lt = t - TL.compass; place(0, 0, Math.PI); dog.pose({ crouch: .25, tail: { ph: 0, amp: 0, up: .5 }, headPitch: .2, ear: .2 }); U.uCompass.value = 1 - smooth(1, 3, lt);
    const k = easeInOut(smooth(0, 2.5, lt)); look(lerp(0, 46, k), lerp(74, 20, k), lerp(.01, 30, k), 0, lerp(0, 5, k), 0);
    hud.push(() => { const a = smooth(0, .3, lt); // líneas de campo
      g2.save(); g2.globalAlpha = a * .5; g2.strokeStyle = BLUE; g2.lineWidth = 3; g2.setLineDash([18, 14]); g2.lineDashOffset = -t * 60; for (let i = 1; i <= 4; i++) { g2.beginPath(); g2.ellipse(W / 2, 1000, 120 + i * 90, 380 + i * 60, 0, 0, 7); g2.stroke(); } g2.restore();
      question('PARECE QUE LO NOTAN…', '', a, 300); big('¿PARA QUÉ?', 1470, smooth(1.4, 1.7, lt), null, 66); label('NADIE LO SABE TODAVÍA', W / 2, 1550, smooth(2.0, 2.3, lt), '#fff', 30); });
  } else if (t < TL.frap) {
    // I · carreras locas: galope con cámara siguiéndolo
    const lt = t - TL.zoom; const v = 26; const ph = lt * v / 9 * TAU; dog.pose({ walk: { ph, gait: 'gallop', amp: 1 }, tail: { ph: t * 8, amp: .3, up: .2 }, ear: -.4 });
    U.uGrid.value = 1; U.uOff.value.set(0, lt * v); orbit(lerp(1.2, 1.5, lt / 3.2), 64, 9, 6, 0);
    for (let i = 0; i < SPEED.n; i++) { const s = SPEED.seed, q = i * 4; const z = 20 - fract(s[q] + lt * 1.4) * 40; const y = 1 + s[q + 1] * 11, x = (s[q + 2] - .5) * 16; const b = .25; for (let j = 0; j < 1; j++) SPEED.push(x, y, z, b, b * .8, b * .6); }
    hud.push(() => question('¿Y ESAS CARRERAS', 'LOCAS POR CASA?', smooth(0, .25, lt), 300));
  } else if (t < TL.bow) {
    // J · FRAPs: periodos de actividad frenética
    const lt = t - TL.frap; const ph = circle(t, TL.frap, 20, 24, 0, 0, 'gallop'); dog.pose({ walk: { ph, gait: 'gallop', amp: 1 }, tail: { ph: t * 8, amp: .3, up: .2 }, ear: -.4 }); U.uGrid.value = 1;
    { const p = dog.root.position, cx = 0, cz = -20; const dx = p.x - cx, dz = p.z - cz, l = Math.hypot(dx, dz); look(cx - dx / l * 42, 26, cz - dz / l * 42, p.x, 5.5, p.z); }
    hud.push(() => { const a = smooth(0, .3, lt); label('TIENEN NOMBRE CIENTÍFICO', W / 2, 240, a, COP, 26); big('PERIODOS DE', 310, a, '#fff', 52); big('ACTIVIDAD FRENÉTICA', 380, a, null, 58);
      titleHUD('SU FORMA DE SOLTAR', 'ENERGÍA O TENSIÓN', smooth(2.9, 3.2, lt), 1400);
      txt('• DESPUÉS DEL BAÑO', W / 2, 1580, 38, { font: 'Montserrat', weight: 800, alpha: smooth(5.6, 5.9, lt), fill: BLUE }); txt('• TRAS ESTAR QUIETO MUCHO RATO', W / 2, 1640, 38, { font: 'Montserrat', weight: 800, alpha: smooth(6.8, 7.1, lt), fill: BLUE }); });
  } else if (t < TL.brand) {
    // K–M · reverencia de juego y pregunta final
    const lt = t - TL.bow; const you = t >= TL.you; const k = easeInOut(smooth(.2, 1.0, lt));
    const bounce = Math.max(0, Math.sin(lt * 5)) * .15 * smooth(1.6, 2, lt);
    dog.pose({ bow: you ? .95 + .05 * Math.sin(t * 5) : k * (1 - bounce), tail: { ph: t * 14, amp: .55, up: 1.0 * k, bias: 0 }, ear: .5, headPitch: -.25 * k, headYaw: Math.sin(lt * 1.5) * .12 });
    const az = you ? lerp(.55, .8, (t - TL.you) / 6.8) : lerp(.9, .55, lt / 7.9); orbit(az, 48, 8.5, 5.5, -.5);
    if (you) bg.material.uniforms.uWarm.value = .3;
    hud.push(() => { if (!you) { question('¿Y CUANDO SE AGACHA', 'CON EL CULO EN POMPA?', inA(t, TL.bow, TL.bowmean + .3), 300);
        const b = smooth(TL.bowmean - TL.bow, TL.bowmean - TL.bow + .3, lt); label('LA REVERENCIA DE JUEGO', W / 2, 260, b, COP, 30); big('«¡VAMOS A JUGAR!»', 340, smooth(TL.bowmean - TL.bow + 1.1, TL.bowmean - TL.bow + 1.4, lt), null, 64);
        titleHUD('ANTES O DESPUÉS DE UN', 'MORDISCO DE MENTIRA', smooth(TL.bowmean - TL.bow + 2.3, TL.bowmean - TL.bow + 2.6, lt), 1430); stamp('ES BROMA', W / 2, 1640, smooth(TL.bowmean - TL.bow + 4.7, TL.bowmean - TL.bow + 5.0, lt), -.06, COP, 46);
        cite('Bekoff · Behaviour, 1995', b); }
      else { const l2 = t - TL.you, a = smooth(.1, .4, l2); question('¿Y EL TUYO?', '¿DA VUELTAS ANTES', a, 260); big('DE HACER SUS COSAS?', 460, a, null, 56);
        txt('¿O SE VUELVE LOCO CORRIENDO?', W / 2, 1480, 42, { font: 'Montserrat', weight: 800, alpha: smooth(2.2, 2.6, l2) });
        txt('CUÉNTANOSLO EN COMENTARIOS ↓', W / 2, 1570, 34, { font: 'Montserrat', weight: 800, alpha: smooth(4.2, 4.6, l2), fill: COP, spacing: 2 }); } });
  } else {
    // N · marca
    const lt = t - TL.brand; dog.pose({ bow: .95, tail: { ph: t * 14, amp: .5, up: 1 }, ear: .5, headPitch: -.25 }); orbit(.8 + lt * .03, 48 + lt * 2, 8.5 + lt * .3, 5.5, -.5);
    expo = .85; fade = Math.min(.72, lt * .6); hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  DROPS.end(); SPEED.end();
  U.uC.value.set(dog.root.position.x, dog.root.position.z); if (t >= TL.axis && t < TL.zoom) U.uC.value.set(0, 0);
  camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); bg.position.copy(camera.position); scene.updateMatrixWorld(true);
  if (t < TL.brand) bands();
  for (const h of hud) h();
  finish(scene, { t, flash, fade, bloom: .35, expo, grain: .03 });
}
function renderCover() { renderFrame(1.9); coverText('CUANDO TU PERRO', 'SE SACUDE', 'Y otras cosas raras que hace con el cuerpo'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
