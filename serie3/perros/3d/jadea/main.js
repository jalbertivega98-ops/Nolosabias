// NO LO SABÍAS — «Cuando tu perro jadea» (perro 3D de cuerpo entero: jadeo, almohadillas, patas en la nieve, nariz «infrarroja», patas que huelen a maíz)
// Glándulas sudoríparas ecrinas casi solo en las almohadillas; el jadeo (de ~30 a 300–400 resp/min) evapora agua de lengua y vías respiratorias.
// Ninomiya, Akiba, Nakazawa et al. 2011 (Veterinary Dermatology): plexos arteriovenosos en las almohadillas → intercambio a contracorriente.
// Bálint, Andics, Gácsi et al. 2020 (Scientific Reports): los perros detectan radiación térmica débil (objeto ~+11 °C a 1,6 m); la punta de la nariz está más fría.
// «Frito feet»: olor a maíz tostado por bacterias (Pseudomonas, Proteus) entre los dedos; normal si no hay irritación.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, V3, g2, camera, txt, copperGrad, project, titleHUD, bar, bigStat, arrowXY, drawBrand, coverText, finish, noise1, fract, Particles } from '../../lib/core.js';
import { scene, bg, floor, dog, inA, flashAt, stamp, question, cite, bands, big, label, ENV } from '../../perros3d/render/stage.js';

const CUTS = ['sweat', 'pant', 'paws', 'counter', 'nose', 'heat', 'prey', 'corn', 'you'];
const BLUE = '#9fd8ff', COP = '#e3a372', RED = '#ff7a5a', TAU = Math.PI * 2;
const STEAM = new Particles(700, { size: .55, seed: 3 }); scene.add(STEAM.obj);
const SNOW = new Particles(1800, { size: .85, seed: 9 }); scene.add(SNOW.obj);
const CORN = new Particles(500, { size: .7, seed: 21 }); scene.add(CORN.obj);
// objeto templado (fuente de calor) que el perro «siente»
const warm = new THREE.Mesh(new THREE.SphereGeometry(1.4, 32, 16), new THREE.MeshStandardMaterial({ color: 0x331a10, emissive: 0xff7a3a, emissiveIntensity: 1.2, roughness: .6, envMap: ENV }));
warm.visible = false; scene.add(warm);
const warmGlow = new THREE.PointLight(0xff8040, 0, 30); scene.add(warmGlow);
const noseMat = dog.head.nose.material; const noseEm = noseMat.emissive ? noseMat.emissive.clone() : new THREE.Color(0, 0, 0);
const FU = dog.fur; const TINT0 = FU.uTintC.value.clone();

function look(px, py, pz, tx, ty, tz, fov = 30) { camera.up.set(0, 1, 0); camera.fov = fov; camera.position.set(px, py, pz); camera.lookAt(tx, ty, tz); }
function orbit(az, d, y, ty = 6.5, tz = 0) { look(Math.sin(az) * d, y, Math.cos(az) * d + tz, 0, ty, tz); }
function place(x, z, ry = 0) { dog.root.position.set(x, 0, z); dog.root.rotation.set(0, ry, 0); }
const wp = (o) => { o.updateMatrixWorld(true); return o.getWorldPosition(new THREE.Vector3()); };
const noseC = () => new THREE.Box3().setFromObject(dog.head.nose).getCenter(new THREE.Vector3());
const paw = (n) => wp(dog.bone[n + 'p']).setY(.25);
const PANT = (t, f = 3) => ({ ph: TAU * f * t });

// vapor que sale de la lengua
function steam(t, k) { if (k <= .01) return; const o = wp(dog.head.tongue).add(V3(0, -.5, .6)); const s = STEAM.seed;
  for (let i = 0; i < STEAM.n; i++) { const q = i * 4, age = fract(s[q] + t / 1.6); const x = o.x + (s[q + 1] - .5) * (.6 + age * 3) + noise1(i + t) * .4 * age, y = o.y + age * 4.5, z = o.z + (s[q + 2] - .5) * (.6 + age * 2.5) + age * 1.2;
    const b = k * (1 - age) * .55; STEAM.push(x, y, z, .8 * b, .92 * b, 1.1 * b); } }
// nieve que cae alrededor (coordenadas de cámara relativas al origen)
function snow(t, k, vz = 0) { if (k <= .01) return; const s = SNOW.seed; for (let i = 0; i < SNOW.n; i++) { const q = i * 4; const y = 30 - fract(s[q] + t * (.12 + s[q + 3] * .08)) * 30;
    const x = (s[q + 1] - .5) * 70 + Math.sin(t * .7 + i) * .8, z = ((s[q + 2] - .5) * 80 + t * vz) % 40; const b = k * (.45 + s[q + 3] * .5); SNOW.push(x, y, z, b, b, b * 1.08); } }
// olor a maíz: volutas doradas que suben desde las patas
function corn(t, k) { if (k <= .01) return; const P = ['LF', 'RF', 'LH', 'RH'].map(paw); const s = CORN.seed;
  for (let i = 0; i < CORN.n; i++) { const q = i * 4, p = P[i % 4], age = fract(s[q] + t / 2.4); const r = .4 + age * 1.6, th = s[q + 1] * TAU + age * 5;
    const b = k * Math.sin(age * Math.PI) * .7; CORN.push(p.x + Math.cos(th) * r, p.y + age * 6, p.z + Math.sin(th) * r, 1.0 * b, .78 * b, .32 * b); } }
// glow en pantalla
function glow(x, y, r, col, a) { if (a <= .01) return; g2.save(); const gr = g2.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g2.globalAlpha = a; g2.globalCompositeOperation = 'lighter'; g2.fillStyle = gr; g2.fillRect(x - r, y - r, r * 2, r * 2); g2.restore(); }
function ring(x, y, r, col, a, lw = 5) { if (a <= .01) return; g2.save(); g2.globalAlpha = a; g2.strokeStyle = col; g2.lineWidth = lw; g2.shadowColor = col; g2.shadowBlur = 16; g2.beginPath(); g2.arc(x, y, r, 0, 7); g2.stroke(); g2.restore(); }
// onda de respiración (frecuencia creciente)
function breathWave(x, y, w, h, t, f, a, col = BLUE) { if (a <= .01) return; g2.save(); g2.globalAlpha = a; g2.strokeStyle = col; g2.lineWidth = 5; g2.shadowColor = col; g2.shadowBlur = 16; g2.beginPath();
  for (let i = 0; i <= 240; i++) { const u = i / 240, X = x + u * w, Y = y - Math.sin(TAU * f * (t - (1 - u) * 2)) * h; i ? g2.lineTo(X, Y) : g2.moveTo(X, Y); } g2.stroke(); g2.restore(); }
// intercambiador a contracorriente: arteria (baja, caliente) pegada a vena (sube, fría)
function counterflow(x, y0, y1, t, a) { if (a <= .01) return; const N = 40, gap = 46;
  for (let i = 0; i < N; i++) { const u = i / (N - 1), y = lerp(y0, y1, u);
    const ca = `rgb(${Math.round(lerp(255, 200, u))},${Math.round(lerp(90, 120, u))},${Math.round(lerp(70, 170, u))})`; // arteria: roja arriba → algo más fría abajo
    const cv = `rgb(${Math.round(lerp(230, 110, u))},${Math.round(lerp(120, 190, u))},${Math.round(lerp(130, 255, u))})`; // vena: fría abajo → templada arriba
    g2.save(); g2.globalAlpha = a; g2.fillStyle = ca; g2.fillRect(x - gap / 2 - 22, y, 22, (y1 - y0) / N + 1); g2.fillStyle = cv; g2.fillRect(x + gap / 2, y, 22, (y1 - y0) / N + 1); g2.restore(); }
  // flujo: puntos que bajan por la arteria y suben por la vena
  for (let i = 0; i < 7; i++) { const u = fract(i / 7 + t * .25); g2.save(); g2.globalAlpha = a; g2.fillStyle = '#fff'; g2.shadowColor = '#fff'; g2.shadowBlur = 10;
    g2.beginPath(); g2.arc(x - gap / 2 - 11, lerp(y0, y1, u), 6, 0, 7); g2.fill(); g2.beginPath(); g2.arc(x + gap / 2 + 11, lerp(y1, y0, u), 6, 0, 7); g2.fill(); g2.restore(); }
  // calor que salta de la arteria a la vena
  for (let i = 0; i < 6; i++) { const y = lerp(y0 + 60, y1 - 60, i / 5); const p = fract(t * 1.2 + i * .37); arrowXY(x - gap / 2 + 2, y, x + gap / 2 - 2 + p * 0, y, a * Math.sin(p * Math.PI), COP, 10); }
  txt('ARTERIA', x - gap / 2 - 40, y0 - 40, 26, { align: 'right', spacing: 4, alpha: a, fill: RED }); txt('↓ CALIENTE', x - gap / 2 - 40, y0 + 4, 24, { align: 'right', alpha: a, fill: '#fff' });
  txt('VENA', x + gap / 2 + 40, y0 - 40, 26, { align: 'left', spacing: 4, alpha: a, fill: BLUE }); txt('↑ FRÍA', x + gap / 2 + 40, y1 - 10, 24, { align: 'left', alpha: a, fill: '#fff' });
  txt('ALMOHADILLA', x, y1 + 50, 24, { spacing: 5, alpha: a, fill: COP }); }

function renderFrame(t) {
  g2.clearRect(0, 0, W, H); STEAM.begin(); SNOW.begin(); CORN.begin();
  let flash = 0; for (const c of CUTS) flash = Math.max(flash, flashAt(t, TL[c], .22, .3));
  const hud = []; let fade = 0, expo = 1; const U = floor.material.uniforms; U.uGrid.value = 0; U.uOff.value.set(0, 0); U.uCompass.value = 0; bg.material.uniforms.uWarm.value = 0;
  FU.uTint.value = 0; FU.uTintC.value.copy(TINT0); warm.visible = false; warmGlow.intensity = 0; if (noseMat.emissive) noseMat.emissive.copy(noseEm);
  place(0, 0, 0);
  if (t < TL.sweat) {
    // A · gancho: jadea con la lengua fuera; calor
    const lt = t; bg.material.uniforms.uWarm.value = .6; dog.pose({ pant: PANT(t, 3), tail: { ph: t * 4, amp: .15, up: .25 }, headPitch: -.05, ear: .1 });
    scene.updateMatrixWorld(true); steam(t, .8); const h = wp(dog.dogHead); look(lerp(18, 12, lt / 5), 11, 34, h.x, h.y - 1.2, h.z - 2, 34);
    hud.push(() => { question('CUANDO TU PERRO', 'JADEA…', smooth(0, .25, t), 300); stamp('AIRE ACONDICIONADO', W / 2, 1520, smooth(2.6, 2.8, lt), -.05, BLUE, 54); });
  } else if (t < TL.pant) {
    // B · casi no suda: glándulas en las almohadillas
    const lt = t - TL.sweat; dog.pose({ pant: PANT(t, 3), tail: { ph: t * 4, amp: .12, up: .2 }, headPitch: .15 });
    scene.updateMatrixWorld(true); const az = lerp(.55, .35, lt / 6); look(Math.sin(az) * 40, 6, Math.cos(az) * 40, 0, 5, 0, 34);
    const P = ['LF', 'RF', 'LH', 'RH'].map(paw);
    hud.push(() => { const a = smooth(0, .3, lt); question('CASI NO SUDA', '', a, 280); label('SUS GLÁNDULAS DEL SUDOR ESTÁN…', W / 2, 380, smooth(.8, 1.1, lt), '#fff', 28);
      const b = smooth(2.2, 2.6, lt); P.forEach((p, i) => { const q = project(p); glow(q.x, q.y, 110, 'rgba(120,200,255,.9)', b * (.7 + .3 * Math.sin(t * 5 + i))); ring(q.x, q.y, 46 + 6 * Math.sin(t * 4 + i), BLUE, b); });
      titleHUD('SOBRE TODO EN LAS', 'ALMOHADILLAS', b, 1500); });
  } else if (t < TL.paws) {
    // C · se enfría respirando: 30 → 300+ respiraciones/min
    const lt = t - TL.pant; const dur = TL.paws - TL.pant; const k = easeInOut(smooth(1.0, dur * .55, lt)); const bpm = lerp(30, 320, k); const f = bpm / 60;
    bg.material.uniforms.uWarm.value = .3 + .4 * k; dog.pose({ pant: { ph: TAU * f * t * 1 }, tail: { ph: t * 4, amp: .1, up: .2 }, headPitch: -.08, ear: .1 });
    scene.updateMatrixWorld(true); steam(t, .3 + .9 * smooth(dur * .5, dur * .7, lt)); const h = wp(dog.dogHead);
    look(h.x + lerp(-9, -5, lt / dur), h.y + .5, h.z + 15, h.x, h.y - 1.5, h.z + 1, 34);
    hud.push(() => { const a = smooth(0, .3, lt); question('SE ENFRÍA', 'RESPIRANDO', a, 280);
      txt(Math.round(bpm) + (bpm > 300 ? '+' : ''), W / 2, 1420, 120, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(300, 780, 1420, .5) }); label('RESPIRACIONES POR MINUTO', W / 2, 1510, a, '#fff', 26);
      breathWave(140, 1640, 800, 40, t, Math.min(f, 2.2), a * .8);
      txt('EL AGUA QUE SE EVAPORA EN LA LENGUA SE LLEVA EL CALOR', W / 2, 1740, 26, { weight: 700, alpha: smooth(dur * .62, dur * .62 + .3, lt), fill: BLUE }); });
  } else if (t < TL.counter) {
    // D · ¿cómo pisa la nieve descalzo?
    const lt = t - TL.paws; const ph = lt * 4.6 / 4.6 * TAU * .9; dog.pose({ walk: { ph, amp: .8 }, tail: { ph: t * 5, amp: .15, up: .3 }, ear: .1 });
    U.uGrid.value = .4; U.uOff.value.set(0, lt * 4.2); snow(t, 1); orbit(lerp(.9, .7, lt / 3), 46, 8, 5.5, 0);
    hud.push(() => { question('¿Y CÓMO PISA LA NIEVE', 'DESCALZO?', smooth(0, .25, lt), 300); stamp('SIN CONGELARSE', W / 2, 1520, smooth(1.4, 1.6, lt), -.05, BLUE, 54); });
  } else if (t < TL.nose) {
    // E · intercambio a contracorriente en la pata
    const lt = t - TL.counter; const ph = lt * TAU * .9; dog.pose({ walk: { ph, amp: .8 }, tail: { ph: t * 5, amp: .15, up: .3 }, ear: .1 });
    U.uGrid.value = .4; U.uOff.value.set(0, (t - TL.paws) * 4.2); snow(t, .8); place(0, 0, 0); look(-30, 7, 22, -2, 5, 0, 34);
    hud.push(() => { const a = smooth(0, .3, lt); label('2011 · JAPÓN', W / 2, 240, a, COP, 28); big('ARTERIAS PEGADAS', 310, a, '#fff', 56); big('A LAS VENAS', 380, a, null, 60);
      g2.save(); g2.globalAlpha = .55 * smooth(.6, 1, lt); g2.fillStyle = 'rgba(2,6,14,.75)'; g2.beginPath(); g2.roundRect(560, 560, 440, 900, 30); g2.fill(); g2.restore();
      counterflow(780, 660, 1300, t, smooth(.8, 1.2, lt));
      titleHUD('LA SANGRE CALIENTE CALIENTA', 'LA FRÍA QUE SUBE', smooth(3.6, 3.9, lt), 1560); txt('CASI NO PIERDE CALOR', W / 2, 1700, 38, { font: 'Montserrat', weight: 800, alpha: smooth(7.4, 7.7, lt), fill: BLUE });
      cite('Ninomiya et al. · Veterinary Dermatology, 2011', a); });
  } else if (t < TL.heat) {
    // F–G · la nariz; vista térmica: la punta está más fría
    const lt = t - TL.nose; const th = smooth(TL.cold - TL.nose, TL.cold - TL.nose + .6, lt);
    dog.pose({ headPitch: -.1, ear: .15, tail: { ph: t * 3, amp: .1, up: .2 } }); scene.updateMatrixWorld(true); const h = wp(dog.dogHead); const n = noseC();
    look(h.x + lerp(5, 2, lt / 6), h.y + 1.5, h.z + 16, n.x, n.y - .2, n.z - 2.5, 30);
    FU.uTint.value = .9 * th; FU.uTintC.value.setRGB(1.6, 1.25, .45); bg.material.uniforms.uWarm.value = 0; if (noseMat.emissive) noseMat.emissive.setRGB(.05 * th, .25 * th, .9 * th);
    hud.push(() => { const a = smooth(0, .3, lt); question('LO MÁS RARO:', 'LA NARIZ', inA(t, TL.nose, TL.heat, .3), 300);
      const q = project(n); glow(q.x, q.y, 160, 'rgba(90,170,255,.95)', th * .8); ring(q.x, q.y, 80, BLUE, th);
      label('CÁMARA TÉRMICA', 900, 1700, th * .7, '#fff', 20);
      if (th > .01) { g2.save(); g2.globalAlpha = th * .8; g2.fillStyle = 'rgba(2,6,14,.85)'; g2.beginPath(); g2.roundRect(110, 1420, 860, 170, 26); g2.fill(); g2.restore(); }
      titleHUD('LA PUNTA ESTÁ MÁS FRÍA', 'QUE EL RESTO DE LA CARA', th, 1500);
      // escala térmica
      if (th > .01) { g2.save(); g2.globalAlpha = th; const gr = g2.createLinearGradient(0, 640, 0, 1040); gr.addColorStop(0, '#ff5a2a'); gr.addColorStop(.5, '#ffd060'); gr.addColorStop(1, '#3a8cff'); g2.fillStyle = gr; g2.fillRect(970, 640, 26, 400); g2.restore();
        txt('+', 983, 610, 30, { alpha: th, weight: 800 }); txt('−', 983, 1075, 30, { alpha: th, weight: 800 }); } });
  } else if (t < TL.prey) {
    // H · nota el calor de un objeto a 1,5 m sin verlo
    const lt = t - TL.heat; const turn = easeInOut(smooth(1.0, 2.6, lt));
    warm.visible = true; warm.position.set(-10, 8, 16); warmGlow.position.copy(warm.position); warmGlow.intensity = 30 * smooth(0, .6, lt); warm.material.emissiveIntensity = 1 + .3 * Math.sin(t * 3);
    dog.pose({ headYaw: -.55 * turn, headPitch: -.05, ear: .35 * turn, tail: { ph: 0, amp: 0, up: .3 } }); scene.updateMatrixWorld(true); const n = noseC();
    look(-4, 30, 64, -5, 6, 7, 32); FU.uTint.value = .6 * (1 - smooth(0, 1, lt)); FU.uTintC.value.setRGB(1.6, 1.25, .45);
    hud.push(() => { const a = smooth(0, .3, lt); label('2020 · HUNGRÍA Y SUECIA', W / 2, 240, a, COP, 28); big('NOTA EL CALOR', 310, a, '#fff', 58); big('SIN VERLO', 380, a, null, 62);
      const q = project(n), w = project(warm.position); // ondas térmicas del objeto a la nariz
      for (let i = 0; i < 5; i++) { const u = fract(t * .7 + i / 5); const x = lerp(w.x, q.x, u), y = lerp(w.y, q.y, u); ring(x, y, 18 + 30 * (1 - u), '#ff9a50', a * Math.sin(u * Math.PI) * .9, 4); }
      // cota de 1,5 m
      const b = smooth(2.6, 3.0, lt); if (b > .01) { g2.save(); g2.globalAlpha = b; g2.strokeStyle = '#fff'; g2.lineWidth = 3; g2.setLineDash([12, 10]); g2.beginPath(); g2.moveTo(w.x, w.y + 70); g2.lineTo(q.x, q.y + 70); g2.stroke(); g2.restore();
        txt('1,5 m', (w.x + q.x) / 2, (w.y + q.y) / 2 + 110, 44, { font: 'Montserrat', weight: 800, alpha: b }); }
      titleHUD('COMO UN SENSOR', 'DE INFRARROJOS', smooth(5.0, 5.3, lt), 1520); cite('Bálint et al. · Scientific Reports, 2020', a); });
  } else if (t < TL.corn) {
    // I · para encontrar presas de sangre caliente
    const lt = t - TL.prey; warm.visible = true; warm.position.set(-10, 1.4, 16 + Math.sin(t * 2) * .4); warmGlow.position.copy(warm.position); warmGlow.intensity = 30; warm.material.emissiveIntensity = 1 + .4 * Math.max(0, Math.sin(t * 9));
    dog.pose({ crouch: .4 * smooth(0, 1, lt), headYaw: -.6, headPitch: .25, ear: .5, tail: { ph: 0, amp: 0, up: .5, stiff: .8 } }); look(-2, 15, 64, -4, 4, 7, 32);
    hud.push(() => { const a = smooth(0, .3, lt); question('LE SIRVE PARA', 'CAZAR', a, 300); titleHUD('PRESAS DE', 'SANGRE CALIENTE', smooth(1.0, 1.3, lt), 1520); });
  } else if (t < TL.you) {
    // J · patas que huelen a maíz tostado
    const lt = t - TL.corn; dog.pose({ pant: PANT(t, 2.5), tail: { ph: t * 6, amp: .3, up: .4 }, ear: .2 }); scene.updateMatrixWorld(true); corn(t, smooth(.8, 1.6, lt));
    const az = lerp(.7, .45, lt / 8); look(Math.sin(az) * 38, 5, Math.cos(az) * 38, 0, 4.2, 0, 34); bg.material.uniforms.uWarm.value = .4 * smooth(.8, 1.6, lt);
    hud.push(() => { const a = smooth(0, .3, lt); label('UN ÚLTIMO DETALLE', W / 2, 250, a, COP, 28); big('¿HUELEN A', 320, smooth(.5, .8, lt), '#fff', 58); big('MAÍZ TOSTADO?', 395, smooth(.5, .8, lt), null, 64);
      stamp('ES NORMAL', W / 2, 1480, smooth(2.3, 2.5, lt), -.06, COP, 54); titleHUD('BACTERIAS QUE VIVEN', 'ENTRE SUS DEDOS', smooth(3.5, 3.8, lt), 1660); });
  } else if (t < TL.brand) {
    // K · pregunta final
    const lt = t - TL.you; bg.material.uniforms.uWarm.value = .35; dog.pose({ bow: .95 + .05 * Math.sin(t * 5), pant: PANT(t, 3), tail: { ph: t * 14, amp: .55, up: 1 }, ear: .5, headPitch: -.25, headYaw: Math.sin(lt * 1.5) * .12 });
    scene.updateMatrixWorld(true); corn(t, .5); orbit(lerp(.55, .8, lt / 5), 46, 8.5, 5.5, -.5);
    hud.push(() => { const a = smooth(.1, .4, lt); question('¿Y LAS PATAS DEL TUYO?', '¿HUELEN A MAÍZ?', a, 270);
      txt('COMPRUÉBALO…', W / 2, 1480, 46, { font: 'Montserrat', weight: 800, alpha: smooth(1.4, 1.7, lt) });
      txt('Y CUÉNTANOSLO EN COMENTARIOS ↓', W / 2, 1570, 34, { font: 'Montserrat', weight: 800, alpha: smooth(2.4, 2.8, lt), fill: COP, spacing: 2 }); });
  } else {
    const lt = t - TL.brand; dog.pose({ bow: .95, pant: PANT(t, 3), tail: { ph: t * 14, amp: .5, up: 1 }, ear: .5, headPitch: -.25 }); orbit(.8 + lt * .03, 46 + lt * 2, 8.5 + lt * .3, 5.5, -.5);
    expo = .85; fade = Math.min(.72, lt * .6); hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  STEAM.end(); SNOW.end(); CORN.end();
  U.uC.value.set(dog.root.position.x, dog.root.position.z);
  camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); bg.position.copy(camera.position); scene.updateMatrixWorld(true);
  if (t < TL.brand) bands();
  for (const h of hud) h();
  finish(scene, { t, flash, fade, bloom: .35, expo, grain: .03 });
}
function renderCover() { renderFrame(TL.pant + (TL.paws - TL.pant) * .8); coverText('CUANDO TU PERRO', 'JADEA', 'Y por qué su nariz siente el calor'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
