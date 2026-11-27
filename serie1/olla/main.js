// NO LO SABÍAS — "¿Por qué la olla a presión cocina tan rápido?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final.
// Ebullición: cuando la presión de vapor iguala la presión exterior. Olla a presión ≈ +1 bar (≈ 2 bar absolutos) → hierve a ≈ 120 °C.
// Cocción hasta ~3 veces más rápida. La válvula limita la presión. Abrirla en caliente: el agua sobrecalentada (>100 °C) se vaporiza de golpe
// (1 L de agua → ≈ 1.700 L de vapor). En la cima del Everest (≈ 1/3 atm) el agua hierve a ≈ 70 °C.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3,
  g2, camera, Particles, txt, copperGrad, project, callout, bar, fract, emitJet, emitRise, arrowXY, bigStat, drawBrand, coverText, finish } from '../../lib/core.js';

const scene = new THREE.Scene(); scene.background = new THREE.Color(.1, .09, .1);
const hemi = new THREE.HemisphereLight(0xfff2e2, 0x2a2228, 1.4); scene.add(hemi);
const keyL = new THREE.DirectionalLight(0xfff1dc, 2.6); keyL.position.set(3, 6, 4); scene.add(keyL);
const rimL = new THREE.DirectionalLight(0x9fc8ff, 1.4); rimL.position.set(-5, 3, -4); scene.add(rimL);
const fillL = new THREE.PointLight(0xffb070, 2, 0, 1); fillL.position.set(1.5, 1.2, 2.5); scene.add(fillL);
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .6, ...o });

// ==========================================================================
// COCINA + OLLA (cortada en 3/4 para ver dentro). Unidades: metros
// ==========================================================================
const kitchen = new THREE.Group(); scene.add(kitchen);
{ const top = new THREE.Mesh(new THREE.BoxGeometry(4, .06, 1.6), M(0x2a2a2e, { roughness: .35 })); top.position.y = -.03; kitchen.add(top);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(4, .9, 1.6), M(0xe8e2d6)); cab.position.y = -.51; kitchen.add(cab);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), M(0x3a4a5a)); wall.position.set(0, 1, -.8); kitchen.add(wall);
  for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) { const tl = new THREE.Mesh(new THREE.BoxGeometry(.28, .14, .01), M(j % 2 ? 0xd8dde2 : 0xe8ecef, { roughness: .3 })); tl.position.set(-1.1 + i * .3 + (j % 2) * .15, .25 + j * .16, -.79); tl.material.color.multiplyScalar(.75); kitchen.add(tl); }
  const burner = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .02, 24), M(0x111111)); burner.position.y = .01; kitchen.add(burner); }
const steelM = M(0xc9ced4, { metalness: .35, roughness: .3 }); const darkM = M(0x1a1a1c, { roughness: .5 });
const pot = new THREE.Group(); scene.add(pot);
const potBody = new THREE.Group(); pot.add(potBody);
const CUTA = Math.PI * 1.5; let potFull, potCut;
{ const pts = [V3(0, .02, 0), V3(.17, .02, 0), V3(.18, .04, 0), V3(.18, .26, 0), V3(.19, .27, 0)]; potFull = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), steelM); potBody.add(potFull);
  potCut = new THREE.Mesh(new THREE.LatheGeometry(pts, 48, Math.PI * .25, CUTA), new THREE.MeshStandardMaterial({ color: 0xc9ced4, metalness: .35, roughness: .3, side: THREE.DoubleSide })); potBody.add(potCut);
  for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.BoxGeometry(.16, .03, .05), darkM); h.position.set(s * .26, .24, 0); potBody.add(h); } }
const water = new THREE.Group(); pot.add(water);
const waterFull = new THREE.Mesh(new THREE.CylinderGeometry(.175, .175, .14, 48), new THREE.MeshStandardMaterial({ color: 0x3a8ac8, roughness: .15, transparent: true, opacity: .8, emissive: 0x08203a })); waterFull.position.y = .1; water.add(waterFull);
const waterCut = new THREE.Mesh(new THREE.CylinderGeometry(.175, .175, .14, 48, 1, false, Math.PI * .25, CUTA), new THREE.MeshStandardMaterial({ color: 0x3a8ac8, roughness: .15, transparent: true, opacity: .85, emissive: 0x08203a, side: THREE.DoubleSide })); waterCut.position.y = .1; water.add(waterCut);
const lid = new THREE.Group(); pot.add(lid);
{ const d = new THREE.Mesh(new THREE.SphereGeometry(.2, 48, 12, 0, Math.PI * 2, 0, Math.PI * .22), steelM); d.scale.y = .9; d.position.y = .27 - .2 * .9 * Math.cos(Math.PI * .22) + .0; lid.add(d);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.19, .008, 8, 48), steelM); rim.rotation.x = Math.PI / 2; rim.position.y = .275; lid.add(rim);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(.34, .03, .05), darkM); handle.position.set(.05, .32, 0); lid.add(handle);
  const vb = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .05, 12), steelM); vb.position.set(-.06, .33, 0); lid.add(vb);
  const vw = new THREE.Mesh(new THREE.CylinderGeometry(.025, .02, .03, 12), darkM); vw.position.set(-.06, .365, 0); lid.add(vw); lid.userData.valve = vw; }
const VALVE = () => lid.userData.valve.getWorldPosition(V3()).add(V3(0, .02, 0));
// llama
const flameM = new THREE.MeshBasicMaterial({ color: new THREE.Color(.4, .7, 2.2), transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false });
const flames = new THREE.Group(); scene.add(flames); for (let i = 0; i < 16; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(.012, .05, 6), flameM); const a = i / 16 * Math.PI * 2; f.position.set(Math.cos(a) * .1, .03, Math.sin(a) * .1); flames.add(f); }
// huevo
const egg = new THREE.Mesh(new THREE.SphereGeometry(.03, 24, 16), M(0xf2ead8, { roughness: .5 })); egg.scale.y = 1.3; scene.add(egg);
// montaña (Everest) para la última escena
const EV = V3(0, -300, 0); const mount = new THREE.Group(); mount.position.copy(EV); scene.add(mount);
{ const g = new THREE.ConeGeometry(40, 30, 7, 6); const p = g.attributes.position; const r = rng(3); for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < 14.9) { p.setX(i, p.getX(i) * (1 + (r() - .5) * .3)); p.setZ(i, p.getZ(i) * (1 + (r() - .5) * .3)); } } g.computeVertexNormals();
  const m = new THREE.Mesh(g, M(0xe8eef6, { roughness: .9, flatShading: true })); m.position.set(0, -15.02, 0); mount.add(m);
  for (let i = 0; i < 5; i++) { const g2_ = new THREE.ConeGeometry(25, 20, 6); const mm = new THREE.Mesh(g2_, M(0xd2dbe6, { roughness: .9, flatShading: true })); mm.position.set(-60 + i * 30, -30, -70 - (i % 2) * 20); mount.add(mm); } }
const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 24, 12), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: {}, vertexShader: `varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `varying vec3 vD; void main(){ float y=clamp(vD.y,0.,1.); gl_FragColor=vec4(mix(vec3(.62,.74,.9),vec3(.03,.12,.38),pow(y,.5)),1.); }` })); scene.add(sky);
const PS = new Particles(30000, { size: .1, seed: 5 }); scene.add(PS.obj);
const ALL = [kitchen, pot, flames, egg, mount, sky];
const MOL = V3(0, 300, 0);

// ==========================================================================
// HUD
// ==========================================================================
function stamp(s, x, y, a, rot = -.08, col = '#ff6a4a', size = 86) { if (a <= .01) return; const sc = lerp(1.6, 1, easeOut(clamp(a * 1.4)));
  g2.save(); g2.translate(x, y); g2.rotate(rot); g2.scale(sc, sc); g2.globalAlpha = clamp(a); g2.strokeStyle = col; g2.lineWidth = 8; g2.shadowColor = col; g2.shadowBlur = 25;
  g2.font = `800 ${size}px Montserrat`; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.letterSpacing = '6px'; const w = g2.measureText(s).width + 70; g2.strokeRect(-w / 2, -size * .8, w, size * 1.6); g2.fillStyle = col; g2.fillText(s, 0, 4); g2.restore(); }
function two(top, l1, l2, a, y = 300) { if (a <= .01) return; txt(l1, W / 2, y, 50, { font: 'Montserrat', weight: 800, alpha: a }); if (l2) txt(l2, W / 2, y + 62, 50, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(160, 920, y + 62, .5) }); if (top) txt(top, W / 2, y - 62, 24, { spacing: 7, alpha: a * .8, fill: '#e3a372' }); }
const win = (t, a, b, f = .3) => smooth(a, a + f, t) * (1 - smooth(b - f, b, t));
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
function thermo(x, y, frac, val, a, col = '#ff6a4a') { if (a <= .01) return; const h = 520; g2.save(); g2.globalAlpha = a * .7; g2.fillStyle = 'rgba(8,10,16,.75)'; g2.beginPath(); g2.roundRect(x - 80, y - h - 40, 420, h + 140, 30); g2.fill(); g2.globalAlpha = a; g2.fillStyle = 'rgba(255,255,255,.15)'; g2.strokeStyle = '#ffffff'; g2.lineWidth = 5;
  g2.beginPath(); g2.roundRect(x - 26, y - h, 52, h, 26); g2.fill(); g2.stroke(); g2.beginPath(); g2.arc(x, y + 30, 50, 0, Math.PI * 2); g2.fillStyle = col; g2.fill(); g2.stroke();
  g2.fillStyle = col; g2.shadowColor = col; g2.shadowBlur = 16; const fh = (h - 30) * clamp(frac); g2.fillRect(x - 14, y - fh, 28, fh + 10); g2.restore();
  txt(val, x + 70, y - fh, 70, { font: 'Montserrat', weight: 800, alpha: a, align: 'left', fill: copperGrad(x + 70, x + 340, y - fh, .5) }); }
function gauge(x, y, r, v, a, label = 'bar') { if (a <= .01) return; g2.save(); g2.globalAlpha = a; g2.fillStyle = 'rgba(10,12,18,.75)'; g2.strokeStyle = '#d8dde2'; g2.lineWidth = 8; g2.beginPath(); g2.arc(x, y, r, 0, Math.PI * 2); g2.fill(); g2.stroke();
  for (let i = 0; i <= 3; i++) { const an = Math.PI * .75 + i / 3 * Math.PI * 1.5; g2.beginPath(); g2.moveTo(x + Math.cos(an) * r * .78, y + Math.sin(an) * r * .78); g2.lineTo(x + Math.cos(an) * r * .92, y + Math.sin(an) * r * .92); g2.stroke(); txt(String(i), x + Math.cos(an) * r * .6, y + Math.sin(an) * r * .6, 30, { font: 'Montserrat', weight: 800, alpha: a }); }
  const an = Math.PI * .75 + clamp(v / 3) * Math.PI * 1.5; g2.strokeStyle = '#ff6a4a'; g2.shadowColor = '#ff6a4a'; g2.shadowBlur = 12; g2.beginPath(); g2.moveTo(x, y); g2.lineTo(x + Math.cos(an) * r * .8, y + Math.sin(an) * r * .8); g2.stroke(); g2.restore();
  txt(label, x, y + r * .55, 26, { alpha: a, spacing: 4 }); }
function steam(p0, n, t, a, spd = .5, spread = .08, life = 1.6, seedOff = 0, size = 1) { const s = PS.seed; for (let i = 0; i < n; i++) { const k = ((i + seedOff) % PS.n) * 4; const age = fract(s[k] + t / life); const ang = s[k + 1] * 6.28, r = Math.sqrt(s[k + 2]) * spread * (1 + age * 3);
  const f = a * (1 - age) * .5; PS.push(p0.x + Math.cos(ang) * r + Math.sin(t * 2 + i) * .02 * age, p0.y + age * spd * life, p0.z + Math.sin(ang) * r, f, f, f * 1.05); } }

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .005; camera.far = 3000; camera.fov = 40;
  let bloomS = .35, flash = 0, ca = .0012, fade = 0, expo = 1.1;
  PS.begin(); PS.mat.size = .1; for (const o of ALL) o.visible = false; scene.background = new THREE.Color(.1, .09, .1); hemi.intensity = 1.4; keyL.intensity = 2.6; fillL.intensity = 2;
  pot.position.set(0, .045, 0); pot.rotation.set(0, 0, 0); lid.position.set(0, 0, 0); lid.rotation.set(0, 0, 0); potFull.visible = true; potCut.visible = false; waterFull.visible = true; waterCut.visible = false; lid.visible = true;
  for (const c of ['notal', 'escape', 'close', 'double', 'twenty', 'valve', 'never', 'burst', 'everest', 'egg', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];
  const kit = (cut = false, fl = 1) => { kitchen.visible = pot.visible = flames.visible = true; potFull.visible = !cut; potCut.visible = cut; waterFull.visible = !cut; waterCut.visible = cut; flames.children.forEach((f, i) => { f.scale.set(1, fl * (.8 + .4 * Math.sin(t * 20 + i * 2)), 1); }); flameM.opacity = .8 * fl; };
  const bubbles = (n, t, a = 1) => { const s = PS.seed; for (let i = 0; i < n; i++) { const k = ((i + 4000) % PS.n) * 4; const age = fract(s[k] + t / .9); const ang = s[k + 1] * 6.28, r = Math.sqrt(s[k + 2]) * .16; PS.push(Math.cos(ang) * r, .04 + age * .13, Math.sin(ang) * r, .7 * a, .85 * a, 1 * a); } };

  if (t < TL.notal) {
    // A · olla a presión silbando en el fuego
    kit(false); const u = smooth(0, TL.notal, t); steam(VALVE(), 1200, t, 1, .6, .01, 1.4); PS.mat.size = .02; lid.userData.valve.rotation.y = t * 20;
    camera.position.set(Math.sin(lerp(.5, .9, u)) * lerp(1.4, 1.2, u), lerp(.75, .62, u), Math.cos(lerp(.5, .9, u)) * lerp(1.4, 1.2, u)); camera.lookAt(0, .3, 0); camera.fov = 42;
    hud.push(() => two(null, '¿POR QUÉ EN LA OLLA A PRESIÓN', 'LA COMIDA SE HACE TAN RÁPIDO?', smooth(.05, .3, t), 300));
  } else if (t < TL.escape) {
    // B · el agua no siempre hierve a 100 °C
    const lt = t - TL.notal; kit(true); lid.visible = false; bubbles(500, t); steam(V3(0, .17, 0), 900, t, .8, .25, .12, 1.6, 7000); PS.mat.size = .012;
    camera.position.set(.3, .62, 1.15); camera.lookAt(0, .16, 0); camera.fov = 40;
    hud.push(() => { two(null, 'EL AGUA NO SIEMPRE', 'HIERVE A 100 °C', smooth(.05, .3, lt), 300); thermo(220, 1650, .55, '100 °C?', smooth(.3, .7, lt)); });
  } else if (t < TL.double) {
    // C/D/E · moléculas que escapan · la olla se cierra · más presión
    const closed = t >= TL.close; const lt = t - TL.escape;
    if (t < TL.close || t >= TL.energy) {
      // vista molecular
      scene.background = new THREE.Color(.04, .06, .1); const s = PS.seed; const press = t >= TL.energy ? 1 : 0;
      for (let i = 0; i < 1400; i++) { const k = i * 4; const x = (s[k] - .5) * 5, z = (s[k + 2] - .5) * 2; const y = -2.4 + s[k + 1] * 2.2 + Math.sin(t * 6 + i) * .06; PS.push(MOL.x + x + Math.cos(t * 5 + i) * .05, MOL.y + y, MOL.z + z, .45, .8, 1.6); }
      for (let i = 0; i < 90; i++) { const k = (i + 2000) * 4; const life = 1.6; const age = fract(s[k] + t / life); const x = (s[k + 1] - .5) * 4.5; const maxH = press ? .35 : 3.2; const yy = -.2 + (press ? Math.sin(age * Math.PI) * maxH : age * maxH);
        const f = press ? 1 : (1 - age); for (let q = 0; q < 3; q++) PS.push(MOL.x + x + q * .01, MOL.y + yy, MOL.z + (s[k + 2] - .5), 2.2 * f, 1.2 * f, .5 * f); }
      const nAir = press ? 1400 : 350; for (let i = 0; i < nAir; i++) { const k = (i + 3000) * 4; const x = (s[k] - .5) * 5, z = (s[k + 2] - .5) * 2; const y = fract(s[k + 1] - t * .25) * 3.2 + .2; PS.push(MOL.x + x, MOL.y + y, MOL.z + z, .85, .85, .9); }
      PS.mat.size = .14; camera.position.copy(MOL).add(V3(0, 0, 7.5)); camera.lookAt(MOL.clone().add(V3(0, -.1, 0))); camera.fov = 42; bloomS = .6;
      hud.push(() => { two(null, 'HIERVE CUANDO SUS MOLÉCULAS', 'TIENEN FUERZA PARA ESCAPAR', win(t, TL.escape, TL.escape + 2.4), 300); two(null, 'EMPUJANDO EL AIRE', 'QUE TIENEN ENCIMA', win(t, TL.escape + 2.4, TL.close), 300);
        two(null, 'Y EL AGUA NECESITA MÁS ENERGÍA', 'PARA HERVIR', smooth(TL.energy, TL.energy + .3, t), 300);
        const w = project(MOL.clone().add(V3(0, -1.3, 0))), a = project(MOL.clone().add(V3(0, 1.1, 0))); txt('AGUA', w.x, w.y + 200, 40, { font: 'Montserrat', weight: 800, alpha: smooth(.3, .7, lt), fill: '#7fd4ff' }); txt(t >= TL.energy ? 'VAPOR Y AIRE A PRESIÓN' : 'AIRE', a.x, a.y, 36, { font: 'Montserrat', weight: 800, alpha: smooth(.3, .7, lt), fill: '#e8e8f0' });
        if (t >= TL.energy) for (const x of [W * .25, W * .5, W * .75]) arrowXY(x, 700, x, 860, smooth(TL.energy + .2, TL.energy + .6, t), '#ffffff', 10); });
    } else {
      // la olla se cierra y la presión sube
      const lt2 = t - TL.close; kit(true); const c = easeInOut(smooth(.1, .9, lt2)); lid.position.y = lerp(.25, 0, c); lid.rotation.y = lerp(.8, 0, c);
      bubbles(400, t); const dens = smooth(1, 3, lt2); const s = PS.seed; for (let i = 0; i < 1500 * dens; i++) { const k = ((i + 8000) % PS.n) * 4; const ang = Math.PI * .25 + s[k] * CUTA, r = Math.sqrt(s[k + 1]) * .17; PS.push(Math.cos(ang) * r, .19 + s[k + 2] * .08 + Math.sin(t * 4 + i) * .005, -Math.sin(ang) * r, .5, .5, .55); }
      PS.mat.size = .01; camera.position.set(.3, .6, 1.05); camera.lookAt(0, .18, 0); camera.fov = 40;
      hud.push(() => { two(null, 'SI CIERRAS LA OLLA,', 'EL VAPOR NO PUEDE SALIR', win(t, TL.close, TL.close + 2.2), 300); two(null, 'LA PRESIÓN', 'SUBE…', smooth(TL.close + 2.2, TL.close + 2.5, t), 300); gauge(W - 210, 1560, 140, lerp(1, 1.9, smooth(1.2, 3.3, lt2)), smooth(.8, 1.2, lt2)); });
    }
  } else if (t < TL.valve) {
    // F/G · 2 bar → 120 °C → hasta 3 veces más rápido
    const lt = t - TL.double; kit(true); bubbles(350, t * .7); camera.position.set(-.35, .6, 1.1); camera.lookAt(-.05, .2, 0); camera.fov = 42; lid.userData.valve.rotation.y = t * 8;
    hud.push(() => { two(null, 'CON CASI EL DOBLE DE PRESIÓN', 'HIERVE A UNOS 120 °C', win(t, TL.double, TL.twenty), 300); two(null, 'Y ESOS 20 GRADOS DE MÁS', 'LO CAMBIAN TODO', win(t, TL.twenty, TL.three), 300); two(null, 'LA COMIDA SE HACE', 'HASTA 3 VECES MÁS RÁPIDO', smooth(TL.three, TL.three + .3, t), 300);
      const ta = win(t, TL.double + .2, TL.three + .1); gauge(W - 210, 1100, 130, 2, ta * smooth(TL.double, TL.double + .5, t)); thermo(200, 1650, lerp(.55, .75, smooth(TL.double + .5, TL.double + 1.8, t)), Math.round(lerp(100, 120, smooth(TL.double + .5, TL.double + 1.8, t))) + ' °C', ta);
      const ba = smooth(TL.three + .2, TL.three + .6, t); if (ba > .01) { const x0 = 130, w = 820; g2.save(); g2.globalAlpha = ba * .8; g2.fillStyle = 'rgba(8,10,16,.7)'; g2.fillRect(x0 - 40, 1360, w + 80, 360); g2.restore();
        bar(x0, 1460, w, smooth(TL.three + .3, TL.three + 1.2, t), 'OLLA NORMAL · 100 °C', '×1', ba, '#7fd4ff'); bar(x0, 1620, w, smooth(TL.three + .6, TL.three + 1.5, t) / 3, 'OLLA A PRESIÓN · 120 °C', '⅓ del tiempo', ba, '#ffb070'); } });
  } else if (t < TL.burst) {
    // H/I · la válvula silba · nunca abrir en caliente
    const lt = t - TL.valve; kit(false); const v = VALVE(); lid.userData.valve.rotation.y = t * 30; steam(v, 2500, t, 1.3, 1.2, .006, .9); PS.mat.size = .012;
    const shake = t >= TL.never ? Math.sin(t * 60) * .002 : 0; pot.position.x = shake;
    camera.position.copy(v).add(V3(.36, .08, .52)); camera.lookAt(v.clone().add(V3(0, .05, 0))); camera.fov = 40; bloomS = .5;
    hud.push(() => { two(null, 'POR ESO LA VÁLVULA SILBA:', 'DEJA ESCAPAR EL VAPOR', win(t, TL.valve, TL.never), 300); callout(VALVE(), -220, 220, 'VÁLVULA', 'limita la presión', win(t, TL.valve + .3, TL.never), '#ffb070');
      two(null, 'NUNCA HAY QUE ABRIRLA', 'EN CALIENTE', smooth(TL.never, TL.never + .3, t), 300); stamp('¡NO!', W / 2, 1560, smooth(TL.never + .4, TL.never + .7, t), -.08, '#ff5a4a', 110); });
  } else if (t < TL.everest) {
    // J · vapor de golpe
    const lt = t - TL.burst; kit(true, .6); const pop = smooth(.7, 1.0, lt); lid.position.set(-pop * .1, pop * .5, 0); lid.rotation.z = pop * 1.2;
    emitJet(PS, V3(0, .2, 0), V3(0, 1, 0), 6000, Math.max(0, lt - .7), 1.2, 1.6, 1.2, [.8, .8, .85], 0); if (lt < .75) PS.k = 0; bubbles(800, t * 2); PS.mat.size = .03;
    camera.position.set(.3, .55, 1.3); camera.lookAt(0, .35, 0); camera.fov = 44; flash = Math.max(flash, flashAt(t, TL.burst + .7, .3, .5));
    hud.push(() => { two(null, 'EL AGUA POR ENCIMA DE 100 °C', 'SE CONVIERTE EN VAPOR DE GOLPE', smooth(.05, .3, lt), 300); bigStat('1 LITRO DE AGUA →', '1.700 L de vapor', 1600, smooth(1.2, 1.6, lt), .5); });
  } else if (t < TL.brand) {
    // K/L · Everest: hierve a 70 °C · el huevo tarda una eternidad
    const lt = t - TL.everest; mount.visible = true; sky.visible = true; pot.visible = flames.visible = true; pot.position.copy(EV).add(V3(0, .01, 0)); flames.position.copy(EV); potFull.visible = false; potCut.visible = true; waterCut.visible = true; waterFull.visible = false; lid.visible = false;
    flames.children.forEach((f, i) => f.scale.set(1, .8 + .4 * Math.sin(t * 20 + i * 2), 1)); keyL.intensity = 3; hemi.intensity = 1.8;
    const s = PS.seed; for (let i = 0; i < 300; i++) { const k = ((i + 4000) % PS.n) * 4; const age = fract(s[k] + t / .9); const ang = s[k + 1] * 6.28, r = Math.sqrt(s[k + 2]) * .16; PS.push(EV.x + Math.cos(ang) * r, EV.y + .05 + age * .13, EV.z + Math.sin(ang) * r, .7, .85, 1); }
    for (let i = 0; i < 2000; i++) { const k = ((i + 9000) % PS.n) * 4; PS.push(EV.x + fract(s[k] + t * .3) * 6 - 3, EV.y + fract(s[k + 1] - t * .05) * 3 - .5, EV.z + (s[k + 2] - .5) * 4, .9, .9, .95); } PS.mat.size = .012;
    egg.visible = t >= TL.egg; egg.position.copy(EV).add(V3(Math.sin(t * 3) * .02, .1, Math.cos(t * 2) * .02)); egg.rotation.z = Math.sin(t * 2) * .4;
    const k = easeInOut(smooth(TL.everest, TL.egg + .5, t)); camera.position.copy(EV).add(V3(lerp(2.4, .5, k), lerp(1.4, .42, k), lerp(4.2, .7, k))); camera.lookAt(EV.clone().add(V3(0, lerp(.6, .12, k), 0))); camera.fov = 44;
    hud.push(() => { two('8.849 m', 'EN LA CIMA DEL EVEREST', 'EL AGUA HIERVE A UNOS 70 °C', win(t, TL.everest, TL.egg), 300); thermo(200, 1650, .38, '70 °C', win(t, TL.everest + .6, TL.egg));
      two(null, 'Y UN HUEVO DURO', 'TARDA UNA ETERNIDAD', smooth(TL.egg, TL.egg + .3, t), 300); const ca_ = smooth(TL.egg + .3, TL.egg + .6, t); if (ca_ > .01) { const cx = W / 2, cy = 1560, r = 110; g2.save(); g2.globalAlpha = ca_; g2.strokeStyle = '#fff'; g2.lineWidth = 8; g2.fillStyle = 'rgba(8,10,16,.6)'; g2.beginPath(); g2.arc(cx, cy, r, 0, 6.29); g2.fill(); g2.stroke();
        const a1 = t * 9, a2 = t * .75; g2.lineCap = 'round'; g2.beginPath(); g2.moveTo(cx, cy); g2.lineTo(cx + Math.sin(a1) * r * .8, cy - Math.cos(a1) * r * .8); g2.stroke(); g2.strokeStyle = '#ffb070'; g2.beginPath(); g2.moveTo(cx, cy); g2.lineTo(cx + Math.sin(a2) * r * .5, cy - Math.cos(a2) * r * .5); g2.stroke(); g2.restore(); } });
  } else {
    // M · marca: cocina con vapor
    const lt = t - TL.brand; kit(false, .7); steam(VALVE(), 1200, t, .8, .5, .01, 1.6); PS.mat.size = .02; hemi.intensity = .8; camera.position.set(-.7, .45, .9); camera.lookAt(0, .32, 0); fade = Math.min(.45, lt * .4);
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  if (!(t >= TL.everest && t < TL.brand)) flames.position.set(0, 0, 0);
  PS.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (t < TL.brand) { const gr = g2.createLinearGradient(0, 0, 0, 600); gr.addColorStop(0, 'rgba(8,10,16,.75)'); gr.addColorStop(.6, 'rgba(8,10,16,.5)'); gr.addColorStop(1, 'rgba(8,10,16,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, W, 600); }
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, bloom: bloomS, expo });
}
function renderCover() { renderFrame(1.6); coverText('EL SECRETO DE', 'LA OLLA A PRESIÓN', 'por qué cocina 3 veces más rápido'); }
window.renderCover = () => { renderCover(); return true; };
window.OBJ = { PS, scene };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
