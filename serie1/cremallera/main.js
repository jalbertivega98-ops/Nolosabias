// NO LO SABÍAS — "¿Cómo funciona una cremallera?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final. Esquema, no a escala (1 unidad ≈ 1 mm).
// Dientes con resalte arriba y hueco abajo, filas desfasadas medio paso; cursor con canal en Y y cuña central.
// Whitcomb Judson (1893, "clasp locker"); Gideon Sundback (1913, "hookless fastener"); YKK fabrica cerca de la mitad de las cremalleras del mundo.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3, g2, camera, Particles, txt, copperGrad, project, callout, titleHUD, fract, camOrbit, bigStat, drawBrand, coverText, finish, noise1, arrowXY, renderer } from '../../lib/core.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const scene = new THREE.Scene(); scene.background = new THREE.Color(0x070a12);
{ const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .7; }
const hemi = new THREE.HemisphereLight(0xd0dcff, 0x302830, 1.3); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0e0, 2.4); sun.position.set(30, 50, 60); scene.add(sun);
const rim = new THREE.DirectionalLight(0x8ab0ff, 1.2); rim.position.set(-40, -10, -30); scene.add(rim);
const M = (c, r = .6, m = 0, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: e });
const dummy = new THREE.Object3D();
const ORANGE = [1.8, .9, .3];

// ==========================================================================
// CREMALLERA vertical (eje y). Dientes izquierdos en y = k, derechos en y = k + 0.5.
// ==========================================================================
const NK = 70, K0 = -35, PITCH = 1;
const brass = M(0xd4a650, .28, .95), brassHi = new THREE.MeshStandardMaterial({ color: 0xd4a650, roughness: .28, metalness: .95, emissive: 0x000000 });
const toothGeo = new THREE.BoxGeometry(1.3, .46, .5); toothGeo.translate(.65, 0, 0); // desde el borde de la cinta hacia el centro (+x local)
const bumpGeo = new THREE.CylinderGeometry(.15, .17, .14, 16); bumpGeo.rotateX(Math.PI / 2); bumpGeo.translate(1.05, 0, .3);
const holeGeo = new THREE.CircleGeometry(.17, 16); holeGeo.rotateX(Math.PI); holeGeo.translate(1.05, 0, -.255);
const teethL = new THREE.InstancedMesh(toothGeo, brassHi, NK), teethR = new THREE.InstancedMesh(toothGeo, brassHi, NK);
const bumpL = new THREE.InstancedMesh(bumpGeo, brass, NK), bumpR = new THREE.InstancedMesh(bumpGeo, brass, NK);
const holeM = new THREE.MeshBasicMaterial({ color: 0x2a1a08 }); const holeL = new THREE.InstancedMesh(holeGeo, holeM, NK), holeR = new THREE.InstancedMesh(holeGeo, holeM, NK);
const zip = new THREE.Group(); scene.add(zip); zip.add(teethL, teethR, bumpL, bumpR, holeL, holeR);
[teethL, teethR].forEach(m => { const c = new THREE.Color(1, 1, 1); for (let i = 0; i < NK; i++) m.setColorAt(i, c); });
// cintas + tela (tiras que siguen la separación)
const NR = 2 * NK + 1; function strip(col) { const g = new THREE.BufferGeometry(); const pos = new Float32Array(NR * 4 * 3), colr = new Float32Array(NR * 4 * 3), idx = [];
  for (let i = 0; i < NR - 1; i++) for (let j = 0; j < 3; j++) { const a = i * 4 + j, b = a + 1, c = a + 4, d = a + 5; idx.push(a, c, b, b, c, d); }
  g.setIndex(idx); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(colr, 3));
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9, side: THREE.DoubleSide })); zip.add(m); return m; }
const tapeL = strip(), tapeR = strip();
const tapeC = new THREE.Color(0x1c2230), fabC = new THREE.Color(0x24406a), fabC2 = new THREE.Color(0x1a2e4e);
// estado: sep(y) = separación lateral de cada lado; drop = índice de diente roto
let SEP = () => 0, DROP = -999, dropT = 0;
function setTape(mesh, side) { const p = mesh.geometry.attributes.position.array, c = mesh.geometry.attributes.color.array;
  for (let i = 0; i < NR; i++) { const y = K0 + i * .5; const s = SEP(y); const xin = side * (.08 + s), z = 0; const xs = [xin, xin + side * .9, xin + side * 2.2, xin + side * 16];
    for (let j = 0; j < 4; j++) { const o = (i * 4 + j) * 3; p[o] = xs[j]; p[o + 1] = y; p[o + 2] = z - (j === 3 ? .3 : 0) - Math.min(s, 3) * .15 * (j / 3); const cc = j < 2 ? tapeC : (j === 2 ? fabC : fabC2); c[o] = cc.r; c[o + 1] = cc.g; c[o + 2] = cc.b; } }
  mesh.geometry.attributes.position.needsUpdate = true; mesh.geometry.attributes.color.needsUpdate = true; mesh.geometry.computeVertexNormals(); }
function setTeeth(t) { for (const [side, tm, bm, hm] of [[-1, teethL, bumpL, holeL], [1, teethR, bumpR, holeR]]) for (let i = 0; i < NK; i++) { const y = K0 + i * PITCH + (side > 0 ? PITCH / 2 : 0); const s = SEP(y);
    const gone = side < 0 && i === DROP; const ft = gone ? clamp(dropT) : 0;
    dummy.position.set(side * (1.0 + s) + (gone ? side * ft * 6 : 0), y - ft * ft * 14, gone ? ft * 5 : 0); dummy.rotation.set(gone ? ft * 9 : 0, side > 0 ? Math.PI : 0, gone ? ft * 6 : 0); if (side > 0) dummy.rotation.x = Math.PI + (gone ? ft * 9 : 0);
    dummy.scale.setScalar(gone && ft >= 1 ? .0001 : 1); dummy.updateMatrix(); tm.setMatrixAt(i, dummy.matrix); bm.setMatrixAt(i, dummy.matrix); hm.setMatrixAt(i, dummy.matrix); }
  [teethL, teethR, bumpL, bumpR, holeL, holeR].forEach(m => m.instanceMatrix.needsUpdate = true); }
// NB: el lado derecho se gira π en y (apunta a −x) y π en x para mantener el resalte arriba (+z)
// cursor (tirador) con canal en Y
const slider = new THREE.Group(); zip.add(slider);
const sbM = new THREE.MeshStandardMaterial({ color: 0xc8ccd4, roughness: .25, metalness: .9, transparent: true });
const sBody = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.6, 2.0), sbM); slider.add(sBody);
const flange = new THREE.Mesh(new THREE.BoxGeometry(4.6, .25, 2.3), sbM); flange.position.y = 1.7; slider.add(flange);
const chanM = new THREE.MeshBasicMaterial({ color: 0xffa050, transparent: true, opacity: 0 });
const chanPts = [[V3(-1.6, 1.9, 0), V3(-.6, .5, 0), V3(0, -.4, 0)], [V3(1.6, 1.9, 0), V3(.6, .5, 0), V3(0, -.4, 0)], [V3(0, -.4, 0), V3(0, -1.9, 0)]];
chanPts.forEach(pts => slider.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, .32, 10), chanM)));
const wedgeM = new THREE.MeshStandardMaterial({ color: 0xff7040, roughness: .4, metalness: .3, emissive: 0x000000, transparent: true, opacity: 0 });
const wedge = new THREE.Mesh(new THREE.CylinderGeometry(.7, .7, 2.0, 3), wedgeM); wedge.rotation.x = Math.PI / 2; wedge.rotation.y = Math.PI / 2; wedge.rotation.z = 0; wedge.position.set(0, 1.25, 0); wedge.scale.set(1, 1, .9); slider.add(wedge);
const tabTex = (letters) => { const c = document.createElement('canvas'); c.width = 256; c.height = 512; const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 256, 512); g.addColorStop(0, '#e8c070'); g.addColorStop(.5, '#b88a3a'); g.addColorStop(1, '#e0b868'); x.fillStyle = g; x.fillRect(0, 0, 256, 512);
  x.strokeStyle = 'rgba(80,50,10,.6)'; x.lineWidth = 8; x.strokeRect(14, 14, 228, 484); if (letters) { x.font = '800 92px Montserrat, Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = 'rgba(70,40,8,.9)'; x.fillText(letters, 128, 300); x.fillStyle = 'rgba(255,240,200,.35)'; x.fillText(letters, 126, 297); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
const texBlank = tabTex(''), texYKK = tabTex('YKK');
const tabM = new THREE.MeshStandardMaterial({ map: texBlank, color: 0x8a7a64, roughness: .6, metalness: .3, envMapIntensity: .4 });
const tabG = new THREE.Group(); tabG.position.set(0, .6, 1.25); slider.add(tabG); const tab = new THREE.Mesh(new THREE.BoxGeometry(2.0, 4.6, .3), [M(0xa07838, .45, .7), M(0xa07838, .45, .7), M(0xa07838, .45, .7), M(0xa07838, .45, .7), tabM, M(0xa07838, .45, .7)]); tab.position.y = -2.6; tabG.add(tab);
const ring = new THREE.Mesh(new THREE.TorusGeometry(.5, .14, 10, 24), M(0xc8ccd4, .25, .9)); ring.position.y = -.1; tabG.add(ring);
const sliderY = { v: 0 };
// mapa del mundo esquemático para "casi la mitad" (gráfico circular en HUD)

// ==========================================================================
// TIMELINE
// ==========================================================================
const P = new Particles(12000, { size: .5, seed: 43 }); scene.add(P.obj);
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
const L = (t, a, b) => smooth(TL[a], TL[a] + .3, t) * (b ? 1 - smooth(TL[b] - .1, TL[b] + .1, t) : 1);
// separación en V por encima del cursor (cursor en ys); 'closedBelow' = cerrado por debajo
const vSep = (ys, k = .32, max = 2.6) => y => y < ys - 1.6 ? 0 : Math.min(max, Math.max(0, (y - ys + 1.6) * k));
function highlight(side, i, col) { (side < 0 ? teethL : teethR).setColorAt(i, col); }
function resetHi() { const c = new THREE.Color(1, 1, 1); for (let i = 0; i < NK; i++) { teethL.setColorAt(i, c); teethR.setColorAt(i, c); } }

function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .1; camera.far = 2000;
  let bloomS = .7, flash = 0, ca = .0013, fade = 0, grain = .035, expo = 1.15, dim = 0;
  P.begin(); P.mat.size = .3; sbM.opacity = 1; sbM.depthWrite = true; chanM.opacity = 0; wedgeM.opacity = 0; tabM.map = texBlank; tab.visible = true; DROP = -999; dropT = 0; resetHi(); brassHi.emissive.setRGB(0, 0, 0); slider.visible = true; tabG.visible = true;
  for (const c of ['how', 'slider', 'locked', 'open', 'broken', 'history', 'curious', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  flash = Math.max(flash, flashAt(t, TL.ykk, .3, .35));
  const hud = []; let ys = 0;
  if (t < TL.how) {
    // A · gancho: el cursor sube y cierra; zoom al tirador: "tres letras"
    ys = lerp(-22, 4, easeInOut(smooth(0, 2.2, t))); SEP = vSep(ys);
    const z = easeInOut(smooth(1.8, TL.reason + .4, t)); camOrbit(V3(0, ys + lerp(-2, -3.4, z), lerp(0, 1.4, z)), lerp(lerp(46, 40, t / 2), 11, z), lerp(.35, .12, z), lerp(.25, .1, z), 38); expo = 1.2;
    hud.push(() => { titleHUD('MIRA TU CREMALLERA:', 'TIENE TRES LETRAS…', smooth(.1, .4, t) * (1 - smooth(TL.reason - .1, TL.reason + .1, t)), 300); titleHUD('', '…Y HAY UNA RAZÓN', L(t, 'reason', 'how'), 330);
      const p = project(tab.getWorldPosition(V3())); const a = smooth(TL.reason, TL.reason + .4, t) * (1 - smooth(TL.how - .1, TL.how + .1, t)); if (a > .01) txt('? ? ?', p.x, p.y + 20, 90, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(p.x - 150, p.x + 150, p.y, .5) }); });
  } else if (t < TL.slider) {
    // B · dientes: fila por lado, resalte arriba y hueco abajo, desfasados medio diente
    ys = -30; SEP = y => 1.8; slider.visible = false; const lt = t - TL.how;
    const zt = easeInOut(smooth(TL.bump - .4, TL.bump + .6, t)) * (1 - easeInOut(smooth(TL.offset - .3, TL.offset + .6, t)));
    const under = smooth(TL.hole - .2, TL.hole + .6, t) * (1 - smooth(TL.offset - .3, TL.offset + .3, t));
    const tgt = V3(lerp(0, -1.0 + 1.05 - 1.8, zt), lerp(0, 0, zt), 0); const el = lerp(lerp(.9, .7, clamp(lt / 3)), lerp(.55, -.6, under), zt);
    camOrbit(tgt, lerp(lerp(26, 22, clamp(lt / 3)), 5.5, zt), lerp(.25 + lt * .02, .6, zt), el, 38);
    if (t > TL.bump) highlight(-1, 35, new THREE.Color(1.6, 1.2, .6)); teethL.instanceColor.needsUpdate = true; teethR.instanceColor.needsUpdate = true;
    hud.push(() => { titleHUD('¿CÓMO', 'FUNCIONA?', L(t, 'how', 'sides'), 300); titleHUD('CADA LADO TIENE', 'UNA FILA DE DIENTES', L(t, 'sides', 'bump'), 300); titleHUD('CADA DIENTE TIENE', 'UN BULTO ARRIBA…', L(t, 'bump', 'hole'), 300); titleHUD('…Y UN HUECO', 'POR DEBAJO', L(t, 'hole', 'offset'), 300);
      titleHUD('LOS DOS LADOS ESTÁN DESPLAZADOS', 'MEDIO DIENTE', L(t, 'offset', 'slider'), 300);
      const wp = V3(-1.8 - 1.0 + 1.05, 0, .37); callout(wp, 90, -200, 'BULTO', null, smooth(TL.bump + .3, TL.bump + .6, t) * (1 - smooth(TL.hole - .1, TL.hole + .1, t)));
      callout(V3(-1.8 - 1.0 + 1.05, 0, -.26), 90, 200, 'HUECO', null, smooth(TL.hole + .5, TL.hole + .8, t) * (1 - smooth(TL.offset - .3, TL.offset, t)));
      const oa = smooth(TL.offset + .5, TL.offset + .9, t); if (oa > .01) { for (let k = -3; k <= 3; k++) { const a = project(V3(-1.8, k, .3)), b = project(V3(1.8, k + .5, .3)); g2.save(); g2.globalAlpha = oa * .8; g2.strokeStyle = '#ff9a50'; g2.setLineDash([8, 8]); g2.lineWidth = 3; g2.beginPath(); g2.moveTo(a.x - 140, a.y); g2.lineTo(a.x + 10, a.y); g2.stroke(); g2.strokeStyle = '#9ad0ff'; g2.beginPath(); g2.moveTo(b.x - 10, b.y); g2.lineTo(b.x + 140, b.y); g2.stroke(); g2.restore(); }
        txt('½ DIENTE', W / 2, 1480, 56, { font: 'Montserrat', weight: 800, alpha: oa, fill: copperGrad(300, 780, 1480, .5) }); } });
  } else if (t < TL.locked) {
    // C · cursor en Y: empuja los dientes en ángulo; cada bulto entra en el hueco de enfrente, alternando
    const lt = t - TL.slider; const xr = smooth(TL.yshape - .3, TL.yshape + .3, t); sbM.opacity = lerp(1, .22, xr); sbM.depthWrite = xr < .5; chanM.opacity = xr * .85; tabG.visible = xr < .3;
    ys = t < TL.up ? -6 : lerp(-6, 8, smooth(TL.up, TL.locked, t)); SEP = vSep(ys);
    const ia = TL.alt, words = [24.5 - .0, 25.07, 25.7, 26.27].map(w => w); const wi = t >= ia ? Math.min(3, Math.floor((t - ia) / .64)) : -1;
    for (let i = 0; i < NK; i++) { for (const side of [-1, 1]) { const y = K0 + i + (side > 0 ? .5 : 0); const d = ys - 1.6 - y; if (d > 0 && d < 1.2 && t > TL.fit) highlight(side, i, side < 0 ? new THREE.Color(2, 1.1, .5) : new THREE.Color(.6, 1.2, 2)); } }
    teethL.instanceColor.needsUpdate = true; teethR.instanceColor.needsUpdate = true;
    camOrbit(V3(0, ys - 1, 0), lerp(lerp(24, 18, clamp(lt / 3)), 15, smooth(TL.fit, TL.alt, t)), .3 + lt * .02, lerp(.35, .55, smooth(TL.up, TL.fit, t)), 38); bloomS = .9;
    hud.push(() => { titleHUD('¿Y EL TIRADOR?', '', L(t, 'slider', 'yshape'), 300); titleHUD('POR DENTRO TIENE', 'FORMA DE Y', L(t, 'yshape', 'up'), 300); titleHUD('AL SUBIRLO, EMPUJA LOS DIENTES', 'UNO CONTRA OTRO', L(t, 'up', 'fit'), 300);
      titleHUD('CADA BULTO ENTRA', 'EN EL HUECO DE ENFRENTE', L(t, 'fit', 'alt'), 300);
      if (wi >= 0) { const w = wi % 2 ? 'DERECHA' : 'IZQUIERDA'; txt(w, W / 2, 330, 96, { font: 'Montserrat', weight: 800, alpha: L(t, 'alt', 'locked'), fill: wi % 2 ? '#7ab8ff' : '#ffa060' }); }
      callout(slider.getWorldPosition(V3()).add(V3(0, 1.2, 1.1)), 120, -200, 'CANAL EN Y', null, smooth(TL.yshape + .4, TL.yshape + .8, t) * (1 - smooth(TL.fit - .2, TL.fit, t)), '#ffb070'); });
  } else if (t < TL.open) {
    // D · encajados: tiras hacia los lados y no se separan
    ys = 12; SEP = y => 0; const pull = smooth(TL.pull, TL.pull + .4, t); const sh = pull * Math.sin(t * 40) * .04; teethL.position.x = 0;
    zip.position.x = 0; camOrbit(V3(0, -2, 0), 12, .2 + (t - TL.locked) * .03, .5, 38); brassHi.emissive.setRGB(.15 * pull, .08 * pull, .02 * pull);
    hud.push(() => { titleHUD('ENCAJADOS ASÍ', 'NO SE PUEDEN SEPARAR', L(t, 'locked'), 300); const a = smooth(TL.pull, TL.pull + .3, t) * (1 - smooth(TL.open - .2, TL.open, t)); const c = project(V3(0, -2, 0));
      arrowXY(c.x - 120, c.y, c.x - 420 + Math.sin(t * 40) * 6, c.y, a, '#ff8a50', 16); arrowXY(c.x + 120, c.y, c.x + 420 - Math.sin(t * 40) * 6, c.y, a, '#ff8a50', 16); txt('TIRANDO HACIA LOS LADOS', W / 2, 1480, 34, { spacing: 4, alpha: a, weight: 700 }); });
  } else if (t < TL.broken) {
    // E · abrir: la cuña del centro empuja los dientes hacia fuera y los desengancha
    const lt = t - TL.open; const xr = smooth(TL.wedge - .3, TL.wedge + .3, t); sbM.opacity = lerp(1, .22, xr); sbM.depthWrite = xr < .5; wedgeM.opacity = xr; wedgeM.emissive.setRGB(.6 * xr, .2 * xr, .05 * xr); chanM.opacity = xr * .4; tabG.visible = xr < .3;
    ys = lerp(10, -10, easeInOut(smooth(TL.open + .2, TL.broken - .2, t))); SEP = vSep(ys);
    camOrbit(V3(0, ys + .5, 0), lerp(22, 15, smooth(TL.open, TL.wedge, t)), .3 - lt * .02, .45, 38); bloomS = .9;
    hud.push(() => { titleHUD('PARA ABRIRLA, UNA CUÑA', 'EN EL CENTRO', L(t, 'open', 'unhook'), 300); titleHUD('LOS EMPUJA HACIA FUERA', 'Y LOS DESENGANCHA', L(t, 'unhook'), 300);
      callout(slider.getWorldPosition(V3()).add(V3(0, 1.25, .9)), 120, -180, 'CUÑA', null, smooth(TL.wedge + .3, TL.wedge + .6, t), '#ff8a50'); });
  } else if (t < TL.history) {
    // F · un diente roto: la cremallera se abre por ahí
    DROP = 33; dropT = smooth(TL.broken + .4, TL.broken + 1.6, t); const yb = K0 + DROP; const op = smooth(TL.opens - .1, TL.opens + 1.2, t);
    ys = 10; SEP = y => { const d = Math.abs(y - yb); return op * Math.max(0, 2.2 - d * .45); };
    camOrbit(V3(0, yb + 1, 0), lerp(16, 20, op), .35, .5, 38); const s = P.seed; if (dropT > 0 && dropT < 1) for (let i = 0; i < 120; i++) { const q = (i % P.n) * 4; const f = (1 - dropT) * 1.4; P.push(-1 + (s[q] - .5) * 2 * dropT * 3, yb + (s[q + 1] - .5) * 2 * dropT * 3, (s[q + 2]) * dropT * 3, ORANGE[0] * f, ORANGE[1] * f, ORANGE[2] * f); }
    hud.push(() => { titleHUD('POR ESO, SI SE ROMPE', 'UN DIENTE…', L(t, 'broken', 'opens'), 300); titleHUD('…LA CREMALLERA', 'SE ABRE POR AHÍ', L(t, 'opens'), 300); });
  } else if (t < TL.curious) {
    // G · historia: finales del XIX → 1913
    ys = lerp(-20, 14, easeInOut(smooth(TL.history, TL.curious, t))); SEP = vSep(ys); const lt = t - TL.history; camOrbit(V3(0, ys - 4, 0), 30, -.4 + lt * .12, .25, 38); dim = .25;
    hud.push(() => { titleHUD('LA INVENTARON A FINALES', 'DEL SIGLO XIX', L(t, 'history', 'modern'), 300); titleHUD('Y LA VERSIÓN MODERNA', 'LLEGÓ EN…', L(t, 'modern'), 300);
      bigStat('', t < TL.modern ? '1893' : '1913', 1480, smooth(TL.history + .3, TL.history + .6, t), clamp((t - TL.history) / 1.5)); txt(t < TL.modern ? 'Whitcomb Judson' : 'Gideon Sundback', W / 2, 1570, 32, { weight: 300, alpha: smooth(TL.history + .6, TL.history + 1, t) }); });
  } else if (t < TL.brand) {
    // H · casi la mitad las fabrica una empresa japonesa: YKK
    ys = 6; SEP = vSep(ys); const lt = t - TL.curious; if (t > TL.ykk - .1) tabM.map = texYKK; const z = easeInOut(smooth(TL.yours - .3, TL.ykk, t));
    camOrbit(V3(0, lerp(-2, ys - 3.2, z), lerp(0, 1.4, z)), lerp(lerp(34, 30, clamp(lt / 4)), 9.5, z), lerp(-.2 + lt * .05, .05, z), lerp(.3, .05, z), 38); dim = (1 - z) * smooth(TL.half, TL.half + .4, t) * .7;
    hud.push(() => { titleHUD('Y LO MÁS', 'CURIOSO', L(t, 'curious', 'half'), 300); titleHUD('CASI LA MITAD DE LAS', 'CREMALLERAS DEL MUNDO', L(t, 'half', 'yours'), 300);
      const pa = smooth(TL.half + .2, TL.half + .6, t) * (1 - smooth(TL.yours - .2, TL.yours + .1, t)); if (pa > .01) { const cx = W / 2, cy = 900, R = 240; const sw = easeOut(clamp((t - TL.half - .2) / 1.4)) * Math.PI;
        g2.save(); g2.globalAlpha = pa; g2.fillStyle = 'rgba(255,255,255,.12)'; g2.beginPath(); g2.arc(cx, cy, R, 0, 7); g2.fill(); g2.fillStyle = copperGrad(cx - R, cx + R, cy, .5); g2.shadowColor = '#e3a372'; g2.shadowBlur = 30; g2.beginPath(); g2.moveTo(cx, cy); g2.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + sw); g2.closePath(); g2.fill(); g2.restore();
        txt('≈ 50 %', cx, cy + R + 90, 80, { font: 'Montserrat', weight: 800, alpha: pa }); txt(t > TL.japan ? 'UNA SOLA EMPRESA JAPONESA' : '', cx, cy + R + 170, 34, { spacing: 4, weight: 700, alpha: pa, fill: '#e3a372' }); }
      titleHUD('MIRA LA TUYA:', 'SEGURAMENTE PONE…', L(t, 'yours', 'ykk'), 300); bigStat('', 'YKK', 1600, L(t, 'ykk'), clamp((t - TL.ykk) / 1.2)); });
  } else {
    // I · marca
    const lt = t - TL.brand; ys = lerp(6, 16, clamp(lt / 4)); SEP = vSep(ys); tabM.map = texYKK; camOrbit(V3(0, ys - 4, 0), 30 + lt * 2, .4 + lt * .05, .3, 38); dim = smooth(0, .8, lt) * .6; expo = 1.05;
    hud.push(() => drawBrand(lt - .3)); fade = smooth(TL.end - .6, TL.end, t) * .3;
  }
  slider.position.set(0, ys, 0); tabG.rotation.x = -.25 + .08 * Math.sin(t * 1.3); setTeeth(t); setTape(tapeL, -1); setTape(tapeR, 1);
  P.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (dim > 0) hud.unshift(() => { g2.save(); g2.globalAlpha = dim * .7; g2.fillStyle = '#02050b'; g2.fillRect(0, 0, W, H); g2.restore(); });
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
function renderCover() { renderFrame(TL.fit + 1.4); coverText('¿POR QUÉ NO', 'SE ABRE SOLA?', 'La cremallera, por dentro'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
