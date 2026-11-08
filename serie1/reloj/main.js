// NO LO SABÍAS — "¿Por qué un reloj de cuarzo es tan exacto?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final. Unidades: mm (esquema, no a escala).
// Resonador de cuarzo en forma de diapasón a 32.768 Hz = 2¹⁵; efecto piezoeléctrico directo e inverso; divisor binario de 15 etapas → 1 Hz → motor paso a paso (Lavet).
// Precisión típica: cuarzo estándar ±15 s/mes; cronómetro mecánico certificado (COSC) −4/+6 s/día.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, easeIn, rng, V3, g2, camera, Particles, txt, copperGrad, project, callout, titleHUD, fract, camOrbit, bigStat, bar, drawBrand, coverText, finish, arrowXY, noise1 } from '../../lib/core.js';

const scene = new THREE.Scene(); scene.background = new THREE.Color(0x05070d);
const hemi = new THREE.HemisphereLight(0xc8d8ff, 0x302820, 1.4); scene.add(hemi);
const key = new THREE.DirectionalLight(0xffe8d0, 2.6); key.position.set(30, 50, 70); scene.add(key);
const fillL = new THREE.DirectionalLight(0x8ab0ff, 1.1); fillL.position.set(-60, 0, 40); scene.add(fillL);
const rim = new THREE.DirectionalLight(0xffa070, 1.4); rim.position.set(0, 30, -60); scene.add(rim);
const M = (c, r = .5, m = .3, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: e });
const box = (w, h, d, mat, x = 0, y = 0, z = 0, parent = scene) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; };
const cyl = (r, h, mat, x, y, z, parent, seg = 48) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat); m.rotation.x = Math.PI / 2; m.position.set(x, y, z); parent.add(m); return m; };
function xray(col, k = 1) { return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  uniforms: { uCol: { value: col.clone() }, uA: { value: k } },
  vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform vec3 uCol; uniform float uA; varying vec3 vN; varying vec3 vV; void main(){ float f=pow(clamp(1.-abs(dot(vN,vV)),0.,1.),2.); gl_FragColor=vec4(uCol*(f*.8+.05)*uA,(f*.7+.04)*uA); }` }); }
const quartzMat = () => new THREE.MeshStandardMaterial({ color: 0xdfeaff, roughness: .08, metalness: .1, transparent: true, opacity: .55, emissive: 0x1a2a40, side: THREE.DoubleSide });
function forkMesh(scale, mat, elMat) { const g = new THREE.Group(); const base = box(4, 3, 1, mat, 0, -4, 0, g); const pL = new THREE.Group(), pR = new THREE.Group(); pL.position.set(-1.4, -2.5, 0); pR.position.set(1.4, -2.5, 0); g.add(pL, pR);
  box(1.1, 8, 1, mat, 0, 4, 0, pL); box(1.1, 8, 1, mat, 0, 4, 0, pR); if (elMat) { box(1.14, 7, .08, elMat, 0, 4, .54, pL); box(1.14, 7, .08, elMat, 0, 4, .54, pR); box(3.6, .5, .08, elMat, 0, -4.6, .54, g); }
  g.scale.setScalar(scale); g.prongs = [pL, pR]; return g; }

// ==========================================================================
// RELOJ (genérico, sin marca)
// ==========================================================================
const watch = new THREE.Group(); scene.add(watch);
const caseMat = new THREE.MeshStandardMaterial({ color: 0xc8ccd4, roughness: .25, metalness: .6, transparent: true });
const wcase = cyl(20, 7, caseMat, 0, 0, 0, watch, 72); const wcaseX = new THREE.Mesh(wcase.geometry, xray(new THREE.Color(.55, .75, 1.2), 1)); wcaseX.rotation.x = Math.PI / 2; wcaseX.visible = false; watch.add(wcaseX);
const bezel = new THREE.Mesh(new THREE.TorusGeometry(19.2, 1.1, 16, 72), caseMat); bezel.position.z = 3.6; watch.add(bezel);
const crown = cyl(1.6, 3, caseMat, 21, 0, 0, watch, 20); crown.rotation.set(0, 0, Math.PI / 2);
const strapMat = M(0x4a2c1c, .8, .05); for (const s of [-1, 1]) { const st = box(16, 40, 3, strapMat, 0, s * 38, -1.5, watch); }
const dialTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); const gr = x.createRadialGradient(256, 230, 20, 256, 256, 256); gr.addColorStop(0, '#1d2a44'); gr.addColorStop(1, '#0a1020'); x.fillStyle = gr; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2; const big = i % 5 === 0; x.save(); x.translate(256, 256); x.rotate(a); x.fillStyle = big ? '#e3a372' : 'rgba(255,255,255,.55)'; x.fillRect(-(big ? 5 : 1.5), -240, big ? 10 : 3, big ? 34 : 14); x.restore(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const dialMat = new THREE.MeshStandardMaterial({ map: dialTex, roughness: .5, metalness: .2, transparent: true }); const dial = new THREE.Mesh(new THREE.CircleGeometry(18.2, 72), dialMat); dial.position.z = 3.62; watch.add(dial);
const handMat = M(0xf0f2f6, .3, .6), secMat = M(0xd08848, .3, .8, 0x2a1000);
const hH = new THREE.Group(), hM = new THREE.Group(), hS = new THREE.Group(); hH.position.z = 3.8; hM.position.z = 4.0; hS.position.z = 4.2; watch.add(hH, hM, hS);
box(1.6, 10, .3, handMat, 0, 4.5, 0, hH); box(1.1, 15, .3, handMat, 0, 7, 0, hM); box(.4, 18, .2, secMat, 0, 6, 0, hS); cyl(1, .6, secMat, 0, 0, 4.4, watch, 24);
// movimiento interior
const mov = new THREE.Group(); mov.visible = false; watch.add(mov);
cyl(17.5, .8, M(0x1e5a3a, .6, .2, 0x041a0c), 0, 0, -1.5, mov); const batt = cyl(6.5, 2, M(0xc0c4cc, .25, .8), 6, -6, 0, mov); const chipB = box(4, 4, 1, M(0x18191c, .5, .3), 4, 7, -.6, mov);
const can = new THREE.Group(); can.position.set(-8, 7, 0); can.rotation.z = -.5; mov.add(can); const canShell = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 6, 24), xray(new THREE.Color(.8, .85, 1), 1)); can.add(canShell);
const miniFork = forkMesh(.28, quartzMat(), M(0xd8b060, .3, .9)); miniFork.position.y = .4; can.add(miniFork);
const coilMat = M(0xc8743c, .3, .9, 0x000000); const coil = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 8, 24), coilMat); coil.rotation.z = Math.PI / 2; coil.position.set(-6, -8, 0); mov.add(coil);
box(12, 1.4, 1, M(0x8a8e96, .4, .7), -6, -10.5, 0, mov); const rotor = cyl(1.8, 1.2, M(0xd03a2a, .4, .4), 1.5, -9, 0, mov, 24);
const gears = []; for (const [r, x, y] of [[4, 0, 0], [2.6, 3.5, -6], [3, -3, -3]]) { const g = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .6, 24), M(0xd8b060, .3, .9)); g.rotation.x = Math.PI / 2; g.position.set(x, y, 1); mov.add(g); gears.push(g); }
function watchX(k) { caseMat.opacity = 1 - k * .85; dialMat.opacity = 1 - k * .92; strapMat.transparent = true; strapMat.opacity = 1 - k * .7; wcaseX.visible = k > 0; wcaseX.material.uniforms.uA.value = k; mov.visible = k > .02; }
// reloj mecánico (comparación)
const mech = new THREE.Group(); mech.position.set(-26, 0, -6); mech.visible = false; scene.add(mech);
cyl(17, 6, M(0xc8a060, .3, .8), 0, 0, 0, mech, 64); const mDial = new THREE.Mesh(new THREE.CircleGeometry(15.5, 64), M(0xb8ae9c, .8, .05)); mDial.position.z = 3.1; mech.add(mDial);
const balance = new THREE.Group(); balance.position.set(5, -5, 3.3); mech.add(balance); { const r = new THREE.Mesh(new THREE.TorusGeometry(4, .35, 10, 40), M(0xd8b060, .3, .9)); balance.add(r); box(8, .4, .3, M(0xd8b060, .3, .9), 0, 0, 0, balance); }
{ const hole = new THREE.Mesh(new THREE.CircleGeometry(5, 40), M(0x222222, .6, .3)); hole.position.set(5, -5, 3.15); mech.add(hole); }
const mh = new THREE.Group(); mh.position.z = 3.5; mech.add(mh); box(1.4, 12, .3, M(0x202020, .4, .3), 0, 5, 0, mh);

// ==========================================================================
// LABORATORIO: cristal de cuarzo (piezoelectricidad) y diapasón grande
// ==========================================================================
const QZ = V3(0, 500, 0); const qz = new THREE.Group(); qz.position.copy(QZ); scene.add(qz);
const crys = new THREE.Group(); qz.add(crys); { const m = quartzMat(); const body = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 14, 6), m); crys.add(body); const tip = new THREE.Mesh(new THREE.ConeGeometry(5, 6, 6), m); tip.position.y = 10; crys.add(tip); const tip2 = tip.clone(); tip2.rotation.z = Math.PI; tip2.position.y = -10; crys.add(tip2); }
const plateMat = M(0x9aa0aa, .4, .7); const plateT = box(14, 1.2, 12, plateMat, 0, 14, 0, qz), plateB = box(14, 1.2, 12, plateMat, 0, -14, 0, qz);
const elMat = M(0xd8b060, .4, .3, 0x3a2a08); const elL = box(.4, 10, 8, elMat, -5.2, 0, 0, qz), elR = box(.4, 10, 8, elMat, 5.2, 0, 0, qz);
const wireL = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(-5.4, 0, 0), V3(-12, 0, 0), V3(-14, -10, 0), V3(-6, -20, 0)]), 40, .3, 8), M(0xc8743c, .35, .8)); qz.add(wireL);
const wireR = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(5.4, 0, 0), V3(12, 0, 0), V3(14, -10, 0), V3(6, -20, 0)]), 40, .3, 8), M(0xc8743c, .35, .8)); qz.add(wireR);
const bat = box(12, 4, 4, M(0x2a2e36, .5, .4), 0, -21, 0, qz); box(12.2, 1.2, 4.2, M(0xd08848, .4, .6), 0, -19.6, 0, qz);
const FK = V3(0, 1000, 0); const fk = forkMesh(2.2, quartzMat(), M(0xd8b060, .4, .3, 0x3a2a08)); fk.position.copy(FK); scene.add(fk);

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
const P = new Particles(16000, { size: .4, seed: 31 }); scene.add(P.obj);
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
function setHands(t, tickT = null) { const sec = tickT !== null ? tickT : Math.floor(t); hS.rotation.z = -sec / 60 * Math.PI * 2 - .5; hM.rotation.z = -(10 + t / 60) / 60 * Math.PI * 2 * 1 - 1.2; hH.rotation.z = -2.6; }
function show(o) { watch.visible = !!o.watch; qz.visible = !!o.qz; fk.visible = !!o.fk; mech.visible = !!o.mech; }
function vibr(g, amp, t, f = 40) { const a = amp * Math.sin(t * f); g.prongs[0].rotation.z = a; g.prongs[1].rotation.z = -a; }
const DIV = [32768, 16384, 8192, 4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1];
const fmtN = n => n >= 1000 ? Math.floor(n / 1000) + '.' + String(n % 1000).padStart(3, '0') : String(n);
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .05; camera.far = 5000;
  let bloomS = .7, flash = 0, ca = .0013, fade = 0, grain = .035, expo = 1.15, dim = 0;
  P.begin(); P.mat.size = .4; show({}); watchX(0); watch.position.set(0, 0, 0); watch.rotation.set(0, 0, 0); watch.scale.setScalar(1); coilMat.emissive.setRGB(0, 0, 0); vibr(miniFork, 0, t); vibr(fk, 0, t);
  for (const c of ['why', 'fork', 'whynum', 'chip', 'motor', 'curious', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];
  if (t < TL.why) {
    // A · un trocito de cristal vibra 32.768 veces por segundo
    show({ watch: true }); setHands(t); const xk = smooth(TL.crystal - .3, TL.crystal + .6, t); watchX(xk); vibr(miniFork, .12 * xk, t, 60); watch.rotation.set(-.15, lerp(-.35, .1, t / TL.why), 0); watch.updateMatrixWorld(true);
    const cp = can.getWorldPosition(V3(0, 0, 0)); const zk = easeInOut(smooth(TL.crystal, TL.num + .8, t)); camOrbit(V3(0, 0, 0).lerp(cp, zk), lerp(lerp(160, 140, t / 2), 22, zk), .05, .05, 38); bloomS = .9; expo = 1.25;
    if (xk > 0) { const s = P.seed; for (let i = 0; i < 300; i++) { const q = (i % P.n) * 4; const a = s[q] * 6.283, r = 1.5 + fract(s[q + 1] + t * 2) * 3; const p = V3(Math.cos(a) * r * .5, Math.sin(a) * r, 0).applyMatrix4(can.matrixWorld); const f = xk * (1 - (r - 1.5) / 3) * .8; P.push(p.x, p.y, p.z, .6 * f, .9 * f, 1.8 * f); } P.mat.size = .15; }
    hud.push(() => { titleHUD('DENTRO DE ESTE RELOJ', 'UN TROCITO DE CRISTAL', smooth(.1, .4, t) * (1 - smooth(TL.num - .2, TL.num, t)), 300);
      bigStat('VIBRA CADA SEGUNDO', fmtN(Math.round(32768 * easeOut(smooth(TL.num, TL.num + 1.6, t)))), 330, smooth(TL.num, TL.num + .3, t), clamp((t - TL.num) / 1.5)); txt('VECES', W / 2, 430, 40, { font: 'Montserrat', weight: 800, spacing: 6, alpha: smooth(TL.num + .3, TL.num + .6, t) }); });
  } else if (t < TL.fork) {
    // B · piezoelectricidad: apretar → electricidad; electricidad → se dobla
    show({ qz: true }); const lt = t - TL.why; const sq = smooth(TL.squeeze + .1, TL.squeeze + .6, t) * (1 - smooth(TL.volt - .3, TL.volt, t)); const vk = smooth(TL.volt, TL.volt + .3, t); const bend = smooth(TL.bends - .2, TL.bends + .2, t);
    plateT.position.y = lerp(22, 14 - sq * .8, smooth(TL.squeeze - .5, TL.squeeze, t)) * (1 - vk) + 30 * vk; plateB.position.y = -plateT.position.y * (1 - vk) - 40 * vk; plateT.visible = plateB.visible = vk < .9;
    crys.scale.set(1 + sq * .03, 1 - sq * .05, 1 + sq * .03); crys.rotation.z = bend * Math.sin(t * 10) * .06; elL.visible = elR.visible = true; wireL.visible = wireR.visible = bat.visible = vk > .05; bat.parent.children.forEach(c => { });
    camOrbit(QZ.clone().add(V3(0, -2, 0)), lerp(80, 70, lt / 6.4), .35 + lt * .03, .12, 38); bloomS = .9; expo = 1.25;
    const s = P.seed; if (sq > .05) for (let i = 0; i < 700; i++) { const q = (i % P.n) * 4; const side = i % 2 ? 1 : -1; const y = (s[q] - .5) * 9, z = (s[q + 1] - .5) * 7; const f = sq * (.6 + .4 * Math.sin(t * 20 + i)); const p = V3(side * 5.6, y, z).add(QZ); P.push(p.x, p.y, p.z, side > 0 ? 2 * f : .4 * f, side > 0 ? .5 * f : .8 * f, side > 0 ? .3 * f : 2 * f); }
    if (vk > .05) { const cL = wireL.geometry.parameters.path, cR = wireR.geometry.parameters.path; for (let i = 0; i < 400; i++) { const q = ((i + 2000) % P.n) * 4; const u = fract(s[q] + t * .8); const p = (i % 2 ? cL : cR).getPointAt(i % 2 ? 1 - u : u).add(QZ); P.push(p.x, p.y, p.z, 1.8 * vk, 1.4 * vk, .3 * vk); } }
    hud.push(() => { const L = (a, b) => smooth(TL[a], TL[a] + .3, t) * (b ? 1 - smooth(TL[b] - .1, TL[b] + .1, t) : 1);
      titleHUD('¿POR', 'QUÉ?', L('why', 'trick'), 300); titleHUD('EL CUARZO', 'TIENE UN TRUCO', L('trick', 'squeeze'), 300); titleHUD('SI LO APRIETAS', 'GENERA ELECTRICIDAD', L('squeeze', 'volt'), 300);
      if (sq > .05) { const a = project(V3(-7, 6, 4).add(QZ)), b = project(V3(7, 6, 4).add(QZ)); txt('−', a.x - 20, a.y, 70, { font: 'Montserrat', weight: 800, alpha: sq, fill: '#7fb8ff' }); txt('+', b.x + 20, b.y, 70, { font: 'Montserrat', weight: 800, alpha: sq, fill: '#ff8a5a' }); }
      titleHUD('Y SI LE DAS ELECTRICIDAD…', '…SE DOBLA', L('volt'), 300); });
  } else if (t < TL.whynum) {
    // C · diapasón de cuarzo; empujones eléctricos; vibra siempre al mismo ritmo
    show({ fk: true }); const lt = t - TL.fork; const vk = smooth(TL.kicks - .2, TL.kicks + .6, t); vibr(fk, vk * .045, t, 26);
    camOrbit(FK.clone().add(V3(0, 1, 0)), lerp(68, 56, lt / 9.8), .4 + lt * .025, .12, 38); bloomS = .9; expo = 1.3;
    const s = P.seed; if (vk > 0) for (let i = 0; i < 800; i++) { const q = (i % P.n) * 4; const side = i % 2 ? 1 : -1; const u = fract(s[q] + t * 1.2); const y = lerp(-10, 14, u); const p = V3(side * 3.1 * 2.2 / 2.2 * 1 + side * .0, y, 1.2).add(FK); const f = vk * (.5 + .5 * Math.sin(t * 26 + side)); P.push(p.x + Math.sin(t * 26) * side * y * .045 * vk * 2.2, p.y, p.z, 1.8 * f, 1.4 * f, .3 * f); }
    hud.push(() => { const L = (a, b) => smooth(TL[a], TL[a] + .3, t) * (b ? 1 - smooth(TL[b] - .1, TL[b] + .1, t) : 1);
      titleHUD('UNA PIEZA DE CUARZO CON FORMA DE', 'DIAPASÓN DIMINUTO', L('fork', 'circuit'), 300); txt('≈ 4 mm', W / 2, 440, 34, { weight: 300, spacing: 4, alpha: L('forkname', 'circuit') });
      titleHUD('UN CIRCUITO LE DA', 'EMPUJONES ELÉCTRICOS', L('circuit', 'vibrates'), 300); titleHUD('VIBRA SIEMPRE', 'AL MISMO RITMO', L('vibrates', 'bell'), 300); titleHUD('COMO UNA', 'CAMPANA PERFECTA', L('bell'), 300);
      const wa = smooth(TL.vibrates, TL.vibrates + .5, t); if (wa > .01) { g2.save(); g2.globalAlpha = wa; g2.strokeStyle = '#7fd4ff'; g2.lineWidth = 5; g2.shadowColor = '#7fd4ff'; g2.shadowBlur = 16; g2.beginPath(); for (let x = 110; x <= 970; x += 3) { const y = 1430 - Math.sin((x - 110) / 860 * 6.283 * 6 - t * 12) * 50; x === 110 ? g2.moveTo(x, y) : g2.lineTo(x, y); } g2.stroke(); g2.restore(); txt('32.768 Hz', 970, 1340, 32, { align: 'right', font: 'Montserrat', weight: 800, alpha: wa, fill: '#9fe0ff' }); } });
  } else if (t < TL.motor) {
    // D · 2¹⁵ = 32.768; el chip divide entre dos quince veces → 1 pulso por segundo
    show({ watch: true }); setHands(t); watchX(1); watch.rotation.set(-.1, .3, 0); watch.updateMatrixWorld(true); vibr(miniFork, .1, t, 60); camOrbit(chipB.getWorldPosition(V3(0, 0, 0)), 70, .3, .1, 38); dim = .6; bloomS = .8;
    hud.push(() => { const L = (a, b) => smooth(TL[a], TL[a] + .3, t) * (b ? 1 - smooth(TL[b] - .1, TL[b] + .1, t) : 1);
      titleHUD('¿Y POR QUÉ', 'JUSTO ESE NÚMERO?', L('whynum', 'pow'), 300); bigStat('PORQUE ES', '2¹⁵', 330, L('pow', 'chip'), clamp((t - TL.pow) / 1.5)); txt('= 2 × 2 × 2 × … (15 veces) = 32.768', W / 2, 440, 32, { weight: 300, alpha: L('pow', 'chip') * smooth(TL.pow + .6, TL.pow + 1, t) });
      titleHUD('UN CHIP LO DIVIDE', 'ENTRE DOS', L('chip', 'again'), 300); titleHUD('Y OTRA VEZ, Y OTRA…', 'QUINCE VECES SEGUIDAS', L('again', 'onehz'), 300); titleHUD('QUEDA EXACTAMENTE', 'UN PULSO POR SEGUNDO', L('onehz'), 300);
      const ga = smooth(TL.chip - .2, TL.chip + .2, t); if (ga > .01) { const n = clamp((t - TL.chip) / (TL.onehz - TL.chip - .2)) * 15; for (let i = 0; i < 16; i++) { const col = i % 4, row = Math.floor(i / 4); const x = 175 + col * 243, y = 640 + row * 190; const on = i <= n + .001; const last = i === 15;
          const a = ga * (on ? 1 : .22); g2.save(); g2.globalAlpha = a; g2.fillStyle = last && on ? 'rgba(227,163,114,.25)' : 'rgba(255,255,255,.07)'; g2.strokeStyle = last && on ? '#ffe2c0' : on ? '#7fd4ff' : 'rgba(255,255,255,.4)'; g2.lineWidth = last && on ? 4 : 2; g2.beginPath(); g2.roundRect(x - 105, y - 62, 210, 124, 18); g2.fill(); g2.stroke(); g2.restore();
          txt(fmtN(DIV[i]), x, y - 10, last ? 56 : 42, { font: 'Montserrat', weight: 800, alpha: a, fill: last && on ? copperGrad(x - 80, x + 80, y, .5) : '#fff' }); txt('Hz', x, y + 36, 22, { weight: 300, alpha: a * .8 });
          if (i < 15 && i < n) txt('÷2', x + (col < 3 ? 121 : 0), y + (col < 3 ? 0 : 95), 24, { weight: 700, alpha: ga * .9, fill: '#e3a372' }); } } });
  } else if (t < TL.curious) {
    // E · el pulso mueve un motorcito y la aguja avanza: tic
    show({ watch: true }); const lt = t - TL.motor; const tickT = Math.floor(lt) + (t >= TL.tic ? 1 : 0) + 7; setHands(t, Math.min(tickT, 7 + Math.floor(lt))); const pulse = Math.max(0, 1 - fract(lt) * 5); const tk = t >= TL.tic ? Math.max(0, 1 - (t - TL.tic) * 4) : 0;
    const xk = 1 - smooth(TL.hand - .2, TL.hand + .5, t); watchX(xk); coilMat.emissive.setRGB(.6 * Math.max(pulse * xk, tk), .22 * Math.max(pulse * xk, tk), .03); rotor.rotation.y = Math.floor(lt) * Math.PI; gears.forEach((g, i) => g.rotation.y = Math.floor(lt) * (i % 2 ? .3 : -.2));
    if (t >= TL.tic) hS.rotation.z = -(8 + Math.floor(lt - (TL.tic - TL.motor))) / 60 * Math.PI * 2 - .5;
    watch.rotation.set(-.1, lerp(.2, -.05, lt / 3.6), 0); watch.updateMatrixWorld(true); const cw = coil.getWorldPosition(V3(0, 0, 0)); const zk = easeInOut(smooth(TL.hand - .3, TL.hand + .8, t));
    camOrbit(cw.clone().lerp(V3(0, 0, 0), zk), lerp(62, 140, zk), .15, .08, 38); bloomS = .9; expo = 1.25;
    hud.push(() => { titleHUD('ESE PULSO MUEVE', 'UN MOTORCITO', smooth(0, .3, lt) * (1 - smooth(TL.hand - TL.motor - .1, TL.hand - TL.motor + .1, lt)), 300); callout(cw.clone().add(V3(0, 2, 2)), 60, -200, 'BOBINA DEL MOTOR', null, smooth(.4, .8, lt) * (1 - smooth(TL.hand - TL.motor - .2, TL.hand - TL.motor, lt)), '#e3a372');
      titleHUD('Y LA AGUJA', 'AVANZA', smooth(TL.hand - TL.motor, TL.hand - TL.motor + .3, lt) * (1 - smooth(TL.tic - TL.motor - .1, TL.tic - TL.motor, lt)), 300); bigStat('', 'TIC', 380, smooth(TL.tic - TL.motor, TL.tic - TL.motor + .1, lt), .5); });
  } else if (t < TL.brand) {
    // F · mecánico: varios segundos al día; cuarzo barato: ~15 s al mes
    show({ watch: true, mech: true }); const lt = t - TL.curious; setHands(t); watch.position.set(-9, -16, 0); watch.scale.setScalar(.55); watch.rotation.set(-.05, -.15, 0); mech.position.set(-9, 14, 0); mech.scale.setScalar(.65); mech.rotation.set(-.05, .15, 0); strapMat.transparent = true; strapMat.opacity = 0; balance.rotation.z = Math.sin(t * 2 * Math.PI * 3) * 2.2; mh.rotation.z = -t * .5;
    camOrbit(V3(0, 4, 0), lerp(142, 134, lt / 10), .03, .05, 38); bloomS = .7; expo = 1.2;
    hud.push(() => { titleHUD('Y LO MÁS CURIOSO', 'ANTES DEL CUARZO…', smooth(0, .3, lt) * (1 - smooth(TL.mech - TL.curious - .1, TL.mech - TL.curious + .1, lt)), 300);
      const pm = project(V3(-9, 14, 0)), pq = project(V3(-9, -16, 0)); pm.x = 810; pq.x = 810; pm.y -= 70; pq.y -= 70; const ma = smooth(TL.mech - TL.curious, TL.mech - TL.curious + .3, lt), qa = smooth(TL.quartz - TL.curious, TL.quartz - TL.curious + .3, lt);
      titleHUD('LOS MEJORES RELOJES MECÁNICOS', 'VARIOS SEGUNDOS AL DÍA', ma * (1 - qa), 300); titleHUD('UNO DE CUARZO BARATO', '±15 SEGUNDOS AL MES', qa, 300);
      txt('MECÁNICO', pm.x, pm.y + 40, 26, { spacing: 5, alpha: ma * .85, fill: '#e3c27a' }); txt('± 5 s / día', pm.x, pm.y + 100, 46, { font: 'Montserrat', weight: 800, alpha: smooth(TL.perday - TL.curious, TL.perday - TL.curious + .3, lt) });
      txt('CUARZO', pq.x, pq.y + 40, 26, { spacing: 5, alpha: qa * .85, fill: '#9fd0ff' }); txt('± 15 s / mes', pq.x, pq.y + 100, 46, { font: 'Montserrat', weight: 800, alpha: smooth(TL.month - TL.curious - .4, TL.month - TL.curious, lt), fill: copperGrad(pq.x - 160, pq.x + 160, pq.y + 100, .5) }); });
  } else {
    // G · marca
    show({ watch: true }); const lt = t - TL.brand; setHands(t); watch.rotation.set(-.15, .2 + lt * .05, 0); camOrbit(V3(0, 0, 0), 150 + lt * 3, .1, .05, 38); expo = .9; fade = Math.min(.5, lt * .45); dim = smooth(0, .8, lt) * .6;
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  P.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (dim > 0) hud.unshift(() => { g2.save(); g2.globalAlpha = dim * .7; g2.fillStyle = '#02050b'; g2.fillRect(0, 0, W, H); g2.restore(); });
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
function renderCover() { renderFrame(1.9); coverText('¿POR QUÉ ES', 'TAN EXACTO?', 'El cristal que vibra 32.768 veces por segundo'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
