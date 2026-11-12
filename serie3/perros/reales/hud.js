// NO LO SABÍAS — «Lo que tu perro te dice sin hablar»: capa de textos/HUD (transparente) sobre clips reales de Pexels.
// Datos: Sommese et al. 2021 (Animal Cognition): perros «gifted word learners» inclinan la cabeza en el 43 % de los ensayos al oír nombres de juguetes; los típicos, ~2 %.
// Quaranta, Siniscalchi y Vallortigara 2007 (Current Biology): cola más a la derecha ante el dueño, más a la izquierda ante un perro dominante desconocido.
// Siniscalchi et al. 2013: otros perros reaccionan distinto según el lado. Romero et al. 2013 (PLoS ONE): contagio de bostezo mayor con el dueño.
// Glándulas sudoríparas/olfativas en las almohadillas e interdigitales. Kaminski et al. 2019 (PNAS): músculo LAOM de la ceja, desarrollado en perros y casi ausente en lobos.
import { THREE, W, H, TL, clamp, lerp, smooth, easeOut, easeInOut, renderer, g2, txt, copperGrad, titleHUD, bigStat, drawBrand, coverText, bar, arrowXY, fract } from '../../lib/core.js';
renderer.domElement.style.display = 'none';
const inA = (t, a, b, f = .25) => smooth(a, a + f, t) * (1 - smooth(b - f, b, t));
function question(l1, l2, a, y = 300) { if (a <= .01) return; txt(l1, W / 2, y, 50, { font: 'Montserrat', weight: 800, alpha: a, spacing: 1 }); if (l2) txt(l2, W / 2, y + 66, 60, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(160, 920, y + 66, .5), spacing: 1 }); }
function stamp(s, x, y, a, rot = -.06, col = '#ff7a5a') { if (a <= .01) return; g2.save(); g2.translate(x, y); g2.rotate(rot); g2.globalAlpha = a; g2.strokeStyle = col; g2.lineWidth = 6; g2.font = '800 52px Montserrat'; const w = g2.measureText(s).width + 70;
  g2.strokeRect(-w / 2, -48, w, 96); g2.restore(); txt(s, x, y + 2, 52, { font: 'Montserrat', weight: 800, alpha: a, fill: col }); }
function cite(s, a) { txt(s, W / 2, 1810, 22, { weight: 300, alpha: a * .7, spacing: 2 }); }
function bands(a = .55) { let gr = g2.createLinearGradient(0, 0, 0, 640); gr.addColorStop(0, `rgba(2,6,14,${a})`); gr.addColorStop(1, 'rgba(2,6,14,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, W, 640);
  gr = g2.createLinearGradient(0, H, 0, H - 760); gr.addColorStop(0, `rgba(2,6,14,${a + .15})`); gr.addColorStop(1, 'rgba(2,6,14,0)'); g2.fillStyle = gr; g2.fillRect(0, H - 760, W, 760); }
function ring(x, y, r, a, t) { if (a <= .01) return; g2.save(); g2.globalAlpha = a; g2.strokeStyle = '#e3a372'; g2.lineWidth = 5; g2.shadowColor = '#e3a372'; g2.shadowBlur = 20;
  g2.beginPath(); g2.arc(x, y, r * (1 + .04 * Math.sin(t * 6)), -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * easeOut(clamp(a * 1.4))); g2.stroke(); g2.restore(); }
function bigArrow(dir, a, t, col = '#e3a372') { if (a <= .01) return; const y = 960, k = easeOut(clamp(a)); const x0 = W / 2 - dir * 260 * k, x1 = W / 2 + dir * (220 + 30 * Math.sin(t * 5)) * k; arrowXY(x0, y, x1, y, a, col, 22); }
const flashAt = (t, c, d = .22, amp = .5) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
const CUTS = ['intent', 'study', 'p43', 'rest', 'focus', 'tail', 'right', 'left', 'others', 'yawn', 'contag', 'kick', 'glands', 'eyes', 'wolfm', 'select', 'you'];

function renderFrame(t) {
  g2.clearRect(0, 0, W, H);
  let fl = 0; for (const c of CUTS) fl = Math.max(fl, flashAt(t, TL[c], .22, .35));
  if (t < TL.brand) bands();
  const L = (a, b) => inA(t, TL[a], TL[b]);
  // A · gancho
  question('CUANDO TU PERRO', 'INCLINA LA CABEZA…', smooth(.0, .25, t) * (1 - smooth(TL.intent - .3, TL.intent, t)), 300);
  titleHUD('NO ESTÁ PONIENDO CARA DE BUENO', '', inA(t, 1.9, TL.intent), 1500);
  question('ESTÁ INTENTANDO', 'ENTENDERTE', L('intent', 'study'), 300);
  // B · estudio 2021
  txt('2021 · ESTUDIO', W / 2, 250, 28, { spacing: 8, alpha: L('study', 'p43'), fill: '#e3a372' });
  question('PERROS «GENIO»', 'SABEN DECENAS', inA(t, TL.study + 1.2, TL.p43), 320); txt('DE NOMBRES DE JUGUETES', W / 2, 455, 40, { font: 'Montserrat', weight: 800, alpha: inA(t, TL.study + 1.2, TL.p43) });
  cite('Sommese et al. · Animal Cognition, 2021', L('study', 'tail'));
  { const a = L('p43', 'rest') + L('rest', 'focus'); if (a > .01) { txt('AL OÍR EL NOMBRE DE UN JUGUETE…', W / 2, 250, 28, { spacing: 5, alpha: a, fill: '#e3a372' });
      const k = easeOut(smooth(TL.p43 + .6, TL.p43 + 2.6, t)); bar(150, 1400, 780, .43 * k, 'INCLINAN LA CABEZA · GENIOS', Math.round(43 * k) + ' %', a);
      const b = smooth(TL.rest, TL.rest + .3, t); bar(150, 1530, 780, .02, 'LOS DEMÁS', '≈ 2 %', a * b, '#9fd8ff'); } }
  question('SU FORMA DE', 'CONCENTRARSE EN TI', L('focus', 'tail'), 300);
  // C · la cola
  question('¿Y LA COLA?', 'NO DA IGUAL EL LADO', L('tail', 'right'), 300);
  { const a = L('right', 'left'); txt('VE A SU DUEÑO', W / 2, 300, 56, { font: 'Montserrat', weight: 800, alpha: a }); bigArrow(1, a, t); txt('MÁS A LA DERECHA', W / 2, 1520, 60, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(160, 920, 1520, .5) }); }
  { const a = L('left', 'others'); txt('PERRO DESCONOCIDO QUE LE INTIMIDA', W / 2, 300, 40, { font: 'Montserrat', weight: 800, alpha: a }); bigArrow(-1, a, t, '#9fd8ff'); txt('MÁS A LA IZQUIERDA', W / 2, 1520, 60, { font: 'Montserrat', weight: 800, alpha: a, fill: '#9fd8ff' }); }
  cite('Quaranta et al. · Current Biology, 2007', L('right', 'yawn'));
  titleHUD('Y OTROS PERROS', 'NOTAN LA DIFERENCIA', L('others', 'yawn'), 1480);
  // D · bostezo
  question('¿TE BOSTEZA', 'CUANDO LE RIÑES?', inA(t, TL.yawn, TL.nosleep + .3), 300);
  stamp('NO ES SUEÑO', W / 2, 1500, inA(t, TL.nosleep, TL.nosleep + 1.6), -.06);
  titleHUD('A MENUDO ES UNA SEÑAL', 'PARA CALMARSE', inA(t, TL.nosleep + 1.6, TL.contag), 1480);
  question('SE LE CONTAGIA MÁS', 'TU BOSTEZO', L('contag', 'kick'), 300); titleHUD('QUE EL DE UN EXTRAÑO', '', inA(t, TL.contag + 1.2, TL.kick), 1500);
  cite('Romero et al. · PLoS ONE, 2013', L('contag', 'kick'));
  // E · patadas
  question('¿Y ESAS PATADAS', 'AL SUELO?', L('kick', 'glands'), 300);
  titleHUD('GLÁNDULAS DE OLOR', 'ENTRE LOS DEDOS', inA(t, TL.glands, TL.sign), 1480);
  stamp('ESTÁ FIRMANDO', W / 2, 1500, L('sign', 'eyes'), -.06, '#e3a372');
  // F · ojos de cachorro
  question('ESOS OJOS', 'DE CACHORRO…', inA(t, TL.eyes, TL.muscle), 300);
  { const a = inA(t, TL.muscle, TL.wolfm); ring(575, 680, 125, smooth(TL.muscle + .2, TL.muscle + .9, t) * a, t);
    titleHUD('UN MÚSCULO JUNTO A LA CEJA', 'QUE LEVANTA LA MIRADA', a, 1480); }
  { const a = L('wolfm', 'select'); txt('LOBO', W / 2, 300, 64, { font: 'Montserrat', weight: 800, alpha: a, fill: '#9fd8ff' }); stamp('CASI NO LO TIENE', W / 2, 1500, smooth(TL.wolfm + .3, TL.wolfm + .6, t) * a, -.06, '#9fd8ff'); }
  cite('Kaminski et al. · PNAS, 2019', inA(t, TL.muscle, TL.you));
  question('LO SELECCIONAMOS', 'SIN QUERER…', L('select', 'you'), 300);
  titleHUD('PORQUE NO PODÍAMOS', 'DECIRLES QUE NO', inA(t, TL.select + 1.6, TL.you), 1480);
  // G · pregunta
  { const a = L('you', 'brand'); question('¿Y TU PERRO?', '¿QUÉ HACE QUE NUNCA', a, 280); txt('HAS ENTENDIDO?', W / 2, 412, 60, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(160, 920, 412, .5) });
    txt('CUÉNTANOSLO EN COMENTARIOS ↓', W / 2, 1560, 34, { font: 'Montserrat', weight: 800, alpha: a * smooth(TL.you + 1, TL.you + 1.4, t), fill: '#e3a372', spacing: 2 }); }
  // H · marca
  if (t >= TL.brand - .4) { const lt = t - TL.brand; g2.save(); g2.globalAlpha = smooth(-.4, .5, lt) * .82 + smooth(TL.end - .7, TL.end, t) * .18; g2.fillStyle = '#02060e'; g2.fillRect(0, 0, W, H); g2.restore(); drawBrand(lt - .2); }
  if (fl > .005) { g2.save(); g2.globalAlpha = fl; g2.fillStyle = 'rgb(255,238,218)'; g2.fillRect(0, 0, W, H); g2.restore(); }
}
window.renderCover = () => { renderFrame(1.0); coverText('CUANDO TU PERRO', 'INCLINA LA CABEZA', 'Lo que tu perro te dice sin hablar'); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
