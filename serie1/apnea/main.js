// NO LO SABÍAS — "¿Cuánto aguanta un humano sin respirar?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final. Unidades: metros.
// Récord de apnea estática (AIDA): Branko Petrović, 11:54 (2014). Reflejo de inmersión: bradicardia al mojar la cara con agua fría (nervio trigémino);
// en apneístas de élite se han medido < 30 lpm en profundidad. El impulso de respirar lo dispara sobre todo el CO2 (quimiorreceptores), no la falta de O2.
// Boyle: a 10 m (2 atm) el aire ocupa la mitad; a 100 m (11 atm), ~1/11. «Blood shift»: la sangre se desplaza al tórax.
// Flotabilidad negativa a partir de ~15–25 m (caída libre). Contracción del bazo: libera glóbulos rojos.
// Bajau (Ilardo et al., Cell 2018): bazo ~50 % mayor. Peso constante con aletas: > 130 m (AIDA).
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3,
  g2, camera, SOFT, BUBBLE, sea, U, SUN_DIR, skyDome, abyss, ocean, oceanMat, Particles, txt, copperGrad, project, callout, bar, fract,
  emitRise, camOrbit, arrowXY, bigStat, drawBrand, coverText, finish } from '../../lib/core.js';

const hemi = new THREE.HemisphereLight(0x9fc8ff, 0x10202a, 1.0); sea.add(hemi);
const sunL = new THREE.DirectionalLight(0xffc890, 2.2); sea.add(sunL); sea.add(sunL.target);
const keyL = new THREE.DirectionalLight(0xdfeeff, 1.3); keyL.position.set(-4, 8, 6); sea.add(keyL);
const fillL = new THREE.PointLight(0xbfe6ff, 0, 0, 1); sea.add(fillL);
const xray = c => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  uniforms: { uCol: { value: new THREE.Color(...c) }, uA: { value: 1 } },
  vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform vec3 uCol; uniform float uA; varying vec3 vN; varying vec3 vV; void main(){ float f=pow(clamp(1.-abs(dot(vN,vV)),0.,1.),2.); gl_FragColor=vec4(uCol*(f*.9+.06)*uA,(f*.7+.05)*uA); }` });
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .55, ...o });

// ==========================================================================
// APNEÍSTA (sin botella; aletas largas). Origen en la cadera; cuerpo hacia +y, cara hacia +x.
// ==========================================================================
function makeDiver(suit = 0x2e4256, accent = 0xc8743f) {
  const g = new THREE.Group(); const mS = M(suit, { roughness: .45 }), mA = M(accent);
  const part = (geo, mat, parent, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
  const torso = new THREE.Group(); g.add(torso);
  part(new THREE.CapsuleGeometry(.2, .45, 6, 14), mS, torso, 0, .33, 0).scale.set(1, 1, .75);
  part(new THREE.BoxGeometry(.05, .1, .44), mA, torso, .16, .5, 0).scale.set(1, 1, .8);
  const head = new THREE.Group(); head.position.set(.02, .82, 0); torso.add(head);
  part(new THREE.SphereGeometry(.13, 20, 16), mS, head, 0, 0, 0);
  const mask = part(new THREE.BoxGeometry(.05, .08, .17), new THREE.MeshStandardMaterial({ color: 0x9fe8ff, roughness: .05, metalness: .3, emissive: 0x0b3a48 }), head, .12, .03, 0);
  const limb = (parent, x, y, z, len, r) => { const j = new THREE.Group(); j.position.set(x, y, z); parent.add(j);
    part(new THREE.CapsuleGeometry(r, len, 5, 10), mS, j, 0, -len / 2 - r * .5, 0); const k = new THREE.Group(); k.position.y = -len - r; j.add(k);
    part(new THREE.CapsuleGeometry(r * .85, len, 5, 10), mS, k, 0, -len / 2 - r * .5, 0); return { j, k }; };
  const legs = [-1, 1].map(s => { const L = limb(g, 0, -.02, s * .1, .38, .075); part(new THREE.BoxGeometry(.015, .72, .2), M(0x23303e, { roughness: .4 }), L.k, .03, -.78, 0); return L; });
  const arms = [-1, 1].map(s => limb(torso, .02, .65, s * .26, .26, .055));
  g.userData = { torso, head, legs, arms, mask }; sea.add(g); return g;
}
function poseDiver(d, o) { const u = d.userData; const ph = o.kick ?? 0, amp = o.amp ?? 0;
  u.legs.forEach((L, i) => { L.j.rotation.z = (o.hip ?? 0) + Math.sin(ph + i * Math.PI) * .3 * amp; L.k.rotation.z = -(o.knee ?? 0) - Math.max(0, Math.sin(ph + i * Math.PI)) * .2 * amp; });
  u.arms.forEach((A, i) => { A.j.rotation.z = o.armZ ?? -.2; A.j.rotation.x = (i ? 1 : -1) * (o.armX ?? .15); A.k.rotation.z = o.elbow ?? .6; });
  u.torso.rotation.z = o.lean ?? 0; }
const diver = makeDiver(), buddy = makeDiver(0x1b2a3a, 0x7fd4ff);

// Cabo guía con plato al fondo
const rope = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, 200, 6), M(0x8a7a5a, { roughness: .9 })); rope.position.set(0, -100, 0); sea.add(rope);
const plate = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, .05, 32), M(0xd06a30, { emissive: 0x401608 })); plate.position.set(0, -131.2, 0); sea.add(plate);
const buoy = new THREE.Mesh(new THREE.TorusGeometry(.6, .18, 14, 32), M(0xff7a3a, { roughness: .4 })); buoy.rotation.x = Math.PI / 2; buoy.position.set(0, .05, 0); sea.add(buoy);

// ==========================================================================
// LABORATORIO (bajo el escenario): interruptor, corazón, cuerpo en rayos X, bazo
// ==========================================================================
const LAB = V3(0, -600, 0); const lab = new THREE.Group(); lab.position.copy(LAB); sea.add(lab);
const sw = new THREE.Group(); lab.add(sw);
{ const base = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.2, .5), M(0x5a6676, { roughness: .35, metalness: .4 })); sw.add(base);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(.5, 1.6, .2), M(0x0a0c10)); slot.position.z = .3; sw.add(slot); }
const lever = new THREE.Group(); lever.position.z = .35; sw.add(lever);
{ const st = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, 1.4, 20), M(0xd9d9dd, { metalness: .7, roughness: .25 })); st.position.y = .7; lever.add(st);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(.32, 24, 16), M(0xc8743f, { roughness: .35, emissive: 0x200800 })); knob.position.y = 1.45; lever.add(knob); }
const swLight = new THREE.Mesh(new THREE.SphereGeometry(.16, 16, 12), new THREE.MeshBasicMaterial({ color: 0x7fd4ff })); swLight.position.set(0, -1.15, .3); sw.add(swLight);
const heartGeo = (() => { const s = new THREE.Shape(); s.moveTo(0, -.9); s.bezierCurveTo(-.2, -.6, -1, -.2, -1, .3); s.bezierCurveTo(-1, .8, -.45, 1, 0, .55); s.bezierCurveTo(.45, 1, 1, .8, 1, .3); s.bezierCurveTo(1, -.2, .2, -.6, 0, -.9); const g = new THREE.ExtrudeGeometry(s, { depth: .4, bevelEnabled: true, bevelThickness: .25, bevelSize: .2, bevelSegments: 6, curveSegments: 20 }); g.center(); return g; })();
const heart = new THREE.Mesh(heartGeo, M(0xc8302a, { roughness: .6, emissive: 0x2a0404 })); lab.add(heart);
// cuerpo en rayos X (torso), pulmones, bazo
const body = new THREE.Group(); lab.add(body);
const bTorso = new THREE.Mesh(new THREE.CapsuleGeometry(1.5, 2.6, 8, 32), xray([.5, .75, 1.1])); bTorso.scale.set(1, 1, .6); body.add(bTorso);
const bHead = new THREE.Mesh(new THREE.SphereGeometry(.9, 32, 24), xray([.5, .75, 1.1])); bHead.position.y = 3.3; body.add(bHead);
const lungs = [-1, 1].map(s => { const m = new THREE.Mesh(new THREE.SphereGeometry(.62, 32, 24), new THREE.MeshStandardMaterial({ color: 0xff9a8a, emissive: 0x401010, roughness: .5, transparent: true, opacity: .85 })); m.position.set(s * .7, .9, 0); m.scale.set(1, 1.7, .8); body.add(m); return m; });
const spleen = new THREE.Mesh(new THREE.SphereGeometry(.4, 32, 24), M(0x8a1e3a, { roughness: .4, emissive: 0x2a0410 })); spleen.position.set(1.0, -.5, -.1); spleen.scale.set(1.5, .8, .7); body.add(spleen);
const tank = new THREE.Group(); lab.add(tank);
{ const c = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, 2.2, 32), M(0x3a8ad0, { metalness: .5, roughness: .3 })); tank.add(c); const top = new THREE.Mesh(new THREE.SphereGeometry(.42, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), c.material); top.position.y = 1.1; tank.add(top);
  const v = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .35, 12), M(0xcccccc, { metalness: .8, roughness: .2 })); v.position.y = 1.6; tank.add(v); }

// ==========================================================================
// POBLADO BAJAU: casas sobre pilotes y una barca
// ==========================================================================
const village = new THREE.Group(); sea.add(village);
{ const wood = M(0x8a6040, { roughness: .9 }), roof = M(0x6a5a3a, { roughness: .9 }); const r = rng(9);
  for (let i = 0; i < 7; i++) { const h = new THREE.Group(); const w = 3 + r() * 2, d = 3 + r() * 1.5; const box = new THREE.Mesh(new THREE.BoxGeometry(w, 2, d), wood); box.position.y = 3.2; h.add(box);
    const rf = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * .78, 1.6, 4), roof); rf.rotation.y = Math.PI / 4; rf.position.y = 5; rf.scale.set(1, 1, d / w); h.add(rf);
    for (const [px, pz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, 4.4, 8), wood); p.position.set(px * w * .42, .2, pz * d * .42); h.add(p); }
    h.position.set(-18 + i * 6.5 + r() * 2, 0, -22 - r() * 14); h.rotation.y = (r() - .5) * .4; village.add(h); }
  const boat = new THREE.Mesh(new THREE.CapsuleGeometry(.5, 5, 6, 16), M(0x3a6a8a, { roughness: .6 })); boat.rotation.z = Math.PI / 2; boat.scale.set(1, 1, .7); boat.position.set(3, .15, -8); village.add(boat); }

// Partículas
const PS = new Particles(24000, { size: .1, seed: 7 }); sea.add(PS.obj);
const BB = new Particles(1500, { size: .4, seed: 13, map: BUBBLE, blend: THREE.NormalBlending }); sea.add(BB.obj);
const O2C = [.5, .85, 1.5], CO2C = [1.5, .7, .3], BLOOD = [1.4, .2, .15];

// ==========================================================================
// HUD
// ==========================================================================
function stamp(s, x, y, a, rot = -.1, col = '#ff6a4a', size = 80) { if (a <= .01) return; const sc = lerp(1.6, 1, easeOut(clamp(a * 1.4)));
  g2.save(); g2.translate(x, y); g2.rotate(rot); g2.scale(sc, sc); g2.globalAlpha = clamp(a); g2.strokeStyle = col; g2.lineWidth = 8; g2.shadowColor = col; g2.shadowBlur = 25;
  g2.font = `800 ${size}px Montserrat`; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.letterSpacing = '6px'; const w = g2.measureText(s).width + 70; g2.strokeRect(-w / 2, -size * .8, w, size * 1.6); g2.fillStyle = col; g2.fillText(s, 0, 4); g2.restore(); }
function two(top, l1, l2, a, y = 300) { if (a <= .01) return; txt(l1, W / 2, y, 50, { font: 'Montserrat', weight: 800, alpha: a }); if (l2) txt(l2, W / 2, y + 62, 50, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(160, 920, y + 62, .5) }); if (top) txt(top, W / 2, y - 62, 24, { spacing: 7, alpha: a * .8, fill: '#e3a372' }); }
function depthBox(d, a, sub = null) { if (a <= .01) return; txt('PROFUNDIDAD', 80, 1470, 22, { align: 'left', spacing: 7, alpha: a * .7, fill: '#e3a372' });
  txt(Math.round(d) + ' m', 78, 1540, 74, { align: 'left', font: 'Montserrat', weight: 800, alpha: a }); if (sub) txt(sub, 80, 1610, 30, { align: 'left', weight: 300, alpha: a * .9 }); }
function ecg(x0, y0, w, bpm, t, a, col) { if (a <= .01) return; g2.save(); g2.globalAlpha = a; g2.strokeStyle = col; g2.lineWidth = 5; g2.shadowColor = col; g2.shadowBlur = 14; g2.beginPath(); const per = 60 / bpm;
  for (let i = 0; i <= 240; i++) { const x = x0 + i / 240 * w; const tt = t - (1 - i / 240) * 3; const ph = fract(tt / per) * per; let y = 0; if (ph < .08) y = -Math.sin(ph / .08 * Math.PI) * 70; else if (ph < .14) y = Math.sin((ph - .08) / .06 * Math.PI) * 25; if (i === 0) g2.moveTo(x, y0 + y); else g2.lineTo(x, y0 + y); } g2.stroke(); g2.restore(); }
// pulmón 2D: dos lóbulos que se encogen con la presión
function lung2D(x, y, s, a, col = '#ff9a8a') { if (a <= .01) return; g2.save(); g2.globalAlpha = clamp(a); g2.translate(x, y); g2.fillStyle = col; g2.shadowColor = col; g2.shadowBlur = 25;
  for (const sx of [-1, 1]) { g2.beginPath(); g2.ellipse(sx * 70 * s, 0, 58 * s, 110 * s, sx * .12, 0, 7); g2.fill(); }
  g2.globalAlpha = clamp(a) * .5; g2.strokeStyle = '#ffffff'; g2.lineWidth = 3; g2.setLineDash([8, 8]); for (const sx of [-1, 1]) { g2.beginPath(); g2.ellipse(sx * 70, 0, 58, 110, sx * .12, 0, 7); g2.stroke(); } g2.restore(); }
const win = (t, a, b, f = .3) => smooth(a, a + f, t) * (1 - smooth(b - f, b, t));
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;

// ==========================================================================
// ENTORNO
// ==========================================================================
function surfaceEnv(t) { skyDome.visible = true; abyss.visible = false; ocean.visible = true; skyDome.position.copy(camera.position); U.uTime.value = t;
  sea.fog.color.setRGB(.3, .18, .13); sea.fog.density = .002; sunL.position.copy(SUN_DIR).multiplyScalar(500); sunL.target.updateMatrixWorld(); hemi.intensity = 1; }
function underEnv(t, depth, seeSurface = false) { skyDome.visible = false; abyss.visible = true; abyss.position.copy(camera.position); ocean.visible = seeSurface; U.uTime.value = t; U.uDepthCam.value = depth * 2.2;
  const k = clamp(depth / 60); sea.fog.color.setRGB(lerp(.04, .005, k), lerp(.22, .04, k), lerp(.3, .09, k)); sea.fog.density = lerp(.03, .05, k); hemi.intensity = lerp(1.2, .7, k); fillL.intensity = lerp(12, 30, k); sunL.position.set(-50, 400, 80); sunL.target.updateMatrixWorld(); }
function labEnv(t) { skyDome.visible = false; abyss.visible = true; abyss.position.copy(camera.position); ocean.visible = false; U.uDepthCam.value = 120; sea.fog.density = 0; hemi.intensity = 1.4; fillL.intensity = 10; lab.visible = true; }
function snow(t, center, n, r, col = [.25, .35, .4]) { const s = PS.seed; for (let i = 0; i < n; i++) { const q = (i % PS.n) * 4; const y = fract(s[q] - t * .03) * r * 2 - r;
  PS.push(center.x + (s[q + 1] - .5) * r * 2, center.y + y, center.z + (s[q + 2] - .5) * r * 2, col[0], col[1], col[2]); } }
const rays = (t, c, n = 900) => { const s = PS.seed; for (let i = 0; i < n; i++) { const q = (i + 5000) * 4; const x = (s[q] - .5) * 30, z = (s[q + 1] - .5) * 30; const y = -fract(s[q + 2] + t * .05) * 25; const f = .06 * (1 - clamp(-y / 25));
  PS.push(c.x + x + y * .25, c.y + y, c.z + z, f * .8, f * 1.1, f * 1.2); } };

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .05; camera.far = 9000; camera.fov = 45;
  let bloomS = .55, flash = 0, ca = .0013, fade = 0, expo = 1;
  fillL.intensity = 0; PS.begin(); BB.begin(); PS.mat.size = .1; BB.mat.size = .4; for (const o of [diver, buddy, rope, plate, buoy, lab, village]) o.visible = false; diver.rotation.set(0, 0, 0); buddy.rotation.set(0, 0, 0);
  for (const o of lab.children) o.visible = false; oceanMat.uniforms.uFoam.value = 0;
  for (const c of ['record', 'reflex', 'bpm', 'co2', 'press', 'shift', 'fall', 'spleen', 'bajau', 'deep', 'rule', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];

  if (t < TL.how) {
    // A · apnea estática: flotando boca abajo, visto desde abajo; cronómetro
    underEnv(t, 4, true); diver.visible = true; diver.position.set(0, -.75, 0); diver.rotation.set(0, 0, -Math.PI / 2); poseDiver(diver, { hip: 0, knee: .05, armZ: 2.9, elbow: .1, armX: .25 });
    const lt = t; camera.position.set(-1.1, lerp(-4.0, -3.6, lt / 4), lerp(3.8, 3.2, lt / 4)); camera.lookAt(.4, -.35, 0); camera.fov = 55; rays(t, V3(0, 0, 0)); snow(t, V3(0, -2, 0), 400, 4, [.3, .45, .5]);
    hud.push(() => { two(null, '¿CUÁNTO AGUANTA UN HUMANO', 'SIN RESPIRAR?', smooth(.05, .3, t) * (1 - smooth(TL.record - .2, TL.record, t)), 300);
      const a = smooth(TL.record, TL.record + .3, t); if (a > 0) { const sec = Math.round(easeOut(smooth(TL.record, TL.how - .3, t)) * 714); txt('RÉCORD SIN RESPIRAR', W / 2, 262, 24, { spacing: 7, alpha: a * .8, fill: '#e3a372' });
        txt(Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'), W / 2, 390, 150, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(220, 860, 390, .5) }); txt('minutos, flotando quieto', W / 2, 490, 36, { weight: 300, alpha: a }); } });
  } else if (t < TL.face) {
    // B · el interruptor escondido: el reflejo de inmersión
    const lt = t - TL.how; labEnv(t); sw.visible = true; sw.position.set(0, 0, 0); sw.rotation.set(0, Math.sin(t * .5) * .25 - .15, 0);
    const k = easeInOut(smooth(TL.reflex - .1, TL.reflex + .35, t)); lever.rotation.x = lerp(.55, -.55, k); swLight.material.color.setRGB(lerp(.15, .5, k), lerp(.2, .85, k), lerp(.25, 1.6, k)); swLight.scale.setScalar(lerp(.6, 1.6, k)); bloomS = .9;
    camOrbit(LAB, lerp(8, 6.5, clamp(lt / 4.4)), -.35, .12, 45);
    for (let i = 0; i < 1500 * k; i++) { const s = PS.seed, q = i * 4; const a = s[q] * 6.283, r = 1 + fract(s[q + 1] + lt * .4) * 5; const f = .6 * (1 - r / 6); PS.push(LAB.x + Math.cos(a) * r, LAB.y + Math.sin(a) * r, LAB.z - .5, f * .5, f * .9, f * 1.5); } PS.mat.size = .08;
    hud.push(() => { two(null, '¿CÓMO ES POSIBLE?', 'UN INTERRUPTOR ESCONDIDO', win(t, TL.how, TL.reflex), 300); two('TODOS LO LLEVAMOS', 'EL REFLEJO', 'DE INMERSIÓN', smooth(TL.reflex, TL.reflex + .3, t), 300); });
  } else if (t < TL.urge) {
    if (t < TL.bpm) {
      // C · cara en agua fría
      const lt = t - TL.face; const dip = easeInOut(smooth(TL.face + .4, TL.face + 1.3, t)); surfaceEnv(t); diver.visible = true;
      diver.position.set(0, -.05, 0); diver.rotation.set(0, 0, lerp(-.35, -1.0, dip)); poseDiver(diver, { hip: .6, knee: .4, armZ: .9, elbow: .9 });
      camera.position.set(2.7, .7, -2.3); camera.lookAt(.2, .15, 0); camera.fov = 45;
      if (dip > .05 && lt < 2.6) { oceanMat.uniforms.uFoam.value = 1 - smooth(TL.face + 1.2, TL.face + 2.6, t); oceanMat.uniforms.uFoamPos.value.set(.5, 0, 0); oceanMat.uniforms.uFoamR.value = 1.2;
        const k0 = t - TL.face - .9; if (k0 > 0) for (let i = 0; i < 1200; i++) { const s = PS.seed, q = i * 4; const a = s[q] * 6.283, sp = .4 + s[q + 1] * 1.2, up = 1.5 + s[q + 2] * 2; const tt = k0 * (.6 + s[q + 3] * .6); const y = up * tt - 4.9 * tt * tt; if (y < -.05) continue; const f = 1.2 * (1 - clamp(k0 / 1)); PS.push(.55 + Math.cos(a) * sp * tt, y, Math.sin(a) * sp * tt, f, f * 1.05, f * 1.1); } PS.mat.size = .04; }
      hud.push(() => { two(null, 'BASTA MOJARTE LA CARA', 'CON AGUA FRÍA', win(t, TL.face, TL.face + 1.75), 300); two(null, 'Y TU CORAZÓN', 'FRENA SOLO', smooth(TL.face + 1.75, TL.face + 2.05, t), 300); stamp('FRÍA', W / 2 + 200, 1450, smooth(TL.face + 1.2, TL.face + 1.5, t), -.12, '#7fd4ff'); });
    } else {
      // D · el corazón frena
      const lt = t - TL.bpm; labEnv(t); fillL.intensity = 2; heart.visible = true; const bpm = lerp(72, 28, easeInOut(smooth(TL.bpm + .3, TL.urge - .6, t)));
      heart.position.set(0, .6, 0); camOrbit(LAB.clone().add(V3(0, .4, 0)), 6.5, Math.sin(t * .4) * .3, .05, 45);
      const beatPh = fract(beatAcc(t)); heart.scale.setScalar(1 + .14 * Math.exp(-beatPh * 12) + .06 * Math.exp(-Math.abs(beatPh - .15) * 20)); heart.rotation.y = Math.sin(t * .6) * .3;
      hud.push(() => { two('APNEÍSTAS DE ÉLITE', 'MENOS DE 30', 'LATIDOS POR MINUTO', smooth(TL.bpm + .2, TL.bpm + .5, t), 300);
        ecg(140, 1350, 800, bpm, t, .9, bpm < 40 ? '#7fd4ff' : '#ff6a5a'); txt(Math.round(bpm) + ' lpm', W / 2, 1560, 90, { font: 'Montserrat', weight: 800, alpha: smooth(TL.bpm, TL.bpm + .3, t), fill: copperGrad(300, 780, 1560, .5) }); });
    }
  } else if (t < TL.press) {
    // E · el CO2 es la alarma, no la falta de O2
    const lt = t - TL.urge; labEnv(t); body.visible = true; for (const o of body.children) o.visible = true; spleen.visible = false; body.position.set(0, -.6, 0); body.rotation.y = Math.sin(t * .4) * .25;
    lungs.forEach(l => l.scale.set(1, 1.7, .8)); camOrbit(LAB.clone().add(V3(0, .6, 0)), 9, .2, .05, 45); bloomS = .7;
    const co2 = smooth(TL.urge + .3, TL.train - .3, t), o2 = 1 - .25 * co2;
    for (let i = 0; i < 2600; i++) { const s = PS.seed, q = i * 4; const isC = s[q + 3] < .15 + .55 * co2; const L = s[q] < .5 ? -1 : 1; const a = s[q + 1] * 6.283, r = Math.sqrt(s[q + 2]); const y = Math.sin(a + t * .6 * (s[q] - .5)) * 1.0 * r * 1.6;
      const c = isC ? CO2C : O2C; const f = .55; PS.push(LAB.x + L * .7 + Math.cos(a + t * .3) * .5 * r, LAB.y + .3 + y, LAB.z + Math.sin(a * 1.7) * .4 * r, c[0] * f, c[1] * f, c[2] * f); } PS.mat.size = .07;
    hud.push(() => { two(null, '¿Y ESAS GANAS', 'DESESPERADAS DE RESPIRAR?', win(t, TL.urge, TL.co2), 300);
      two(null, 'NO FALTA OXÍGENO:', 'SOBRA DIÓXIDO DE CARBONO', win(t, TL.co2, TL.train), 300); two(null, 'POR ESO', 'SE PUEDE ENTRENAR', smooth(TL.train, TL.train + .3, t), 300);
      const ba = smooth(TL.co2 - .3, TL.co2 + .2, t); bar(140, 1560, 800, o2, 'OXÍGENO', Math.round(o2 * 100) + ' %', ba, '#7fb4ff'); bar(140, 1700, 800, .1 + .85 * co2, 'CO₂', co2 > .7 ? '¡ALARMA!' : '', ba, '#ff8a5a'); });
  } else if (t < TL.shift) {
    // F · bajar: los pulmones se encogen (Boyle)
    const lt = t - TL.press; const d = t < TL.ten ? lerp(0, 4, smooth(TL.press, TL.ten, t)) : t < TL.hund ? lerp(4, 10, smooth(TL.ten, TL.ten + 1.2, t)) : lerp(10, 100, easeInOut(smooth(TL.hund, TL.hund + 1.2, t)));
    const dv = Math.min(d, 26); underEnv(t, d, d < 6); diver.visible = true; rope.visible = true; diver.position.set(.35, -dv - .9, 0); diver.rotation.set(0, 0, Math.PI); poseDiver(diver, { kick: t * 3.2, amp: d < 18 ? .6 : 0, armZ: 3.0, elbow: .1, armX: .05 });
    camera.position.set(.35 + 4.2, -dv - .4, 4.6); camera.lookAt(-.4, -dv - .5, 0); camera.fov = 52; snow(t, diver.position, 900, 5, [.3, .42, .5]); emitRise(BB, diver.position.clone().add(V3(0, -1.0, 0)), 40, t, .15, 3, 1.2, [1, 1, 1]); BB.mat.size = .05;
    hud.push(() => { two(null, 'AL BAJAR,', 'EL AGUA APRIETA', win(t, TL.press, TL.ten), 300); const v = 1 / (1 + d / 10);
      two(null, 'A 10 METROS:', 'LA MITAD', win(t, TL.ten, TL.hund), 300); two(null, 'A 100 METROS:', 'UNA DÉCIMA PARTE', smooth(TL.hund, TL.hund + .3, t), 300);
      lung2D(W / 2 - 250, 1060, Math.sqrt(v), smooth(TL.press + .2, TL.press + .6, t)); txt('×' + (v > .95 ? '1' : v > .45 ? '1/2' : v > .12 ? '1/' + Math.round(1 / v) : '1/11'), W / 2 - 250, 1260, 54, { font: 'Montserrat', weight: 800, alpha: smooth(TL.ten, TL.ten + .3, t), fill: '#ffe2c0' });
      depthBox(d, smooth(TL.press + .2, TL.press + .5, t)); });
  } else if (t < TL.sink) {
    // G · blood shift: la sangre va al pecho
    const lt = t - TL.shift; labEnv(t); body.visible = true; for (const o of body.children) o.visible = true; spleen.visible = false; body.position.set(0, -.6, 0); body.rotation.y = .3 + Math.sin(t * .4) * .2;
    const sq = .55; lungs.forEach(l => l.scale.set(sq, 1.7 * sq, .8 * sq)); camOrbit(LAB.clone().add(V3(0, .3, 0)), 9.5, .2, .05, 45); bloomS = .8;
    const fl = smooth(TL.shift + .3, TL.shift + 1.8, t);
    for (let i = 0; i < 3000; i++) { const s = PS.seed, q = i * 4; const u = fract(s[q] + t * .25); const L = s[q + 1] < .5 ? -1 : 1; const from = V3(L * (1.3 + s[q + 2] * .6), -3.4 - s[q + 3] * 1.5, 0); const to = V3(L * .7 + (s[q + 2] - .5) * .5, .9 + (s[q + 3] - .5) * 1.4, (s[q + 1] - .5) * .5);
      const p = from.lerp(to, easeOut(u * fl + (1 - fl) * .0)); const f = .6 * smooth(0, .1, u) * (fl > .05 ? 1 : 0); PS.push(LAB.x + p.x, LAB.y - .6 + p.y, LAB.z + p.z, BLOOD[0] * f, BLOOD[1] * f, BLOOD[2] * f); } PS.mat.size = .08;
    hud.push(() => { two(null, 'PARA QUE NO SE APLASTEN,', 'LA SANGRE VA AL PECHO', smooth(.05, .3, lt), 300); callout(LAB.clone().add(V3(.7, .7, 0)), 160, -260, 'PULMONES', 'rellenos de sangre', smooth(TL.shift + 1.2, TL.shift + 1.6, t), '#ff8a6a'); });
  } else if (t < TL.spleen) {
    // H · a partir de ~20 m: caída libre
    const lt = t - TL.sink; const d = lerp(15, 45, smooth(TL.sink, TL.spleen, t)); underEnv(t, d); diver.visible = true; rope.visible = true;
    const free = smooth(TL.fall - .2, TL.fall + .4, t); diver.position.set(.35, -d, 0); diver.rotation.set(0, 0, Math.PI); poseDiver(diver, { kick: t * 3.2, amp: 1 - free, armZ: lerp(3.0, .05, free), elbow: lerp(.1, 0, free), armX: lerp(.05, .2, free) });
    camera.position.set(.35 + 1.6, -d + .6, lerp(5.2, 4.4, free)); camera.lookAt(.35, -d - .2, 0); camera.fov = 52; snow(t, diver.position, 1100, 6, [.25, .35, .45]); expo = .95;
    for (let i = 0; i < 400 * free; i++) { const s = PS.seed, q = (i + 9000) * 4; const y = fract(s[q] + t * 1.2) * 8 - 6; PS.push(.35 + (s[q + 1] - .5) * 2.5, -d + y, (s[q + 2] - .5) * 2.5, .25, .4, .5); }
    hud.push(() => { two(null, 'A PARTIR DE UNOS 20 METROS', 'PASA ALGO MÁGICO', win(t, TL.sink, TL.fall), 300); two(null, 'DEJAS DE FLOTAR', 'Y CAES SOLO', smooth(TL.fall, TL.fall + .3, t), 300);
      stamp('CAÍDA LIBRE', W / 2, 1250, smooth(TL.fall + 1.4, TL.fall + 1.7, t), -.08, '#7fd4ff', 70); depthBox(d, smooth(TL.sink, TL.sink + .3, t), free > .5 ? 'sin mover un dedo' : null); });
  } else if (t < TL.bajau) {
    // I · el bazo: reserva de glóbulos rojos
    const lt = t - TL.spleen; labEnv(t); body.visible = true; for (const o of body.children) o.visible = true; body.position.set(-.6, -.6, 0); body.rotation.y = -.35 + Math.sin(t * .4) * .15;
    lungs.forEach(l => l.scale.set(1, 1.7, .8)); const sq = smooth(TL.spleen + .6, TL.spleen + 1.8, t); spleen.scale.set(1.5 * (1 - .35 * sq), .8 * (1 - .35 * sq), .7 * (1 - .35 * sq));
    const tk = smooth(TL.tank, TL.tank + .6, t); tank.visible = tk > 0; tank.position.set(2.4, -.4, .5); tank.scale.setScalar(easeOut(tk) * .9 + .001); tank.rotation.set(.15, t * .6, -.15);
    camOrbit(LAB.clone().add(V3(.2, .2, 0)), lerp(10, 9, clamp(lt / 5)), .45, .05, 45); bloomS = .7;
    const sp = spleen.getWorldPosition(V3()); for (let i = 0; i < 2200 * sq; i++) { const s = PS.seed, q = i * 4; const u = fract(s[q] + t * .35); const a = s[q + 1] * 6.283; const dir = V3(Math.cos(a), Math.sin(a) * 1.4 + .6, (s[q + 2] - .5)); const p = sp.clone().add(dir.multiplyScalar(u * 3.5));
      const f = .7 * (1 - u); PS.push(p.x, p.y, p.z, BLOOD[0] * f, BLOOD[1] * f, BLOOD[2] * f); } PS.mat.size = .09;
    hud.push(() => { two(null, 'EL BAZO SE ENCOGE', 'Y SUELTA GLÓBULOS ROJOS', win(t, TL.spleen, TL.tank), 300); two(null, 'COMO UNA BOTELLA', 'DE OXÍGENO DE REPUESTO', smooth(TL.tank, TL.tank + .3, t), 300);
      callout(sp, -160, 330, 'BAZO', 'reserva de sangre', smooth(TL.spleen + .5, TL.spleen + .9, t) * (1 - smooth(TL.tank - .2, TL.tank, t)), '#ff8a6a'); });
  } else if (t < TL.deep) {
    // J · los bajau
    const lt = t - TL.bajau; surfaceEnv(t); village.visible = true; camera.position.set(lerp(-4, 2, clamp(lt / 5)), 2.6, 14); camera.lookAt(0, 3, -22); camera.fov = 50;
    hud.push(() => { two('SUDESTE ASIÁTICO', 'LOS BAJAU,', 'NÓMADAS DEL MAR', win(t, TL.bajau, TL.bajau + 2.6), 300); const a = smooth(TL.bajau + 2.4, TL.bajau + 2.8, t); two(null, 'LO LLEVAN EN LOS GENES', null, a, 300);
      bigStat('SU BAZO', '≈ 50 % MAYOR', 1480, a, .5); });
  } else if (t < TL.rule) {
    // K · más de 130 m con una bocanada
    const lt = t - TL.deep; const d = lerp(60, 130, easeOut(smooth(TL.deep, TL.deep + 2.6, t))); underEnv(t, d); diver.visible = true; rope.visible = true; plate.visible = true;
    diver.position.set(.35, -d, 0); diver.rotation.set(0, 0, Math.PI); poseDiver(diver, { armZ: .05, elbow: 0, armX: .2 }); camera.position.set(1.9, -d + .2, 4.4); camera.lookAt(.35, -d - .6, 0); camera.fov = 55; expo = .9;
    snow(t, diver.position, 1100, 6, [.15, .22, .3]); bloomS = .7;
    hud.push(() => { const a = smooth(.05, .3, lt); txt('PESO CONSTANTE · RÉCORD', W / 2, 250, 24, { spacing: 6, alpha: a * .85, fill: '#e3a372' }); txt('+' + Math.round(d) + ' m', W / 2, 380, 140, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(200, 880, 380, .5) });
      txt('con una sola bocanada', W / 2, 470, 38, { weight: 300, alpha: a }); });
  } else if (t < TL.brand) {
    // L · nunca solo
    const lt = t - TL.rule; underEnv(t, 5, true); diver.visible = true; buddy.visible = true; buoy.visible = true; rope.visible = true;
    const up = lerp(-9, -2.5, easeOut(smooth(TL.rule, TL.brand - .5, t))); diver.position.set(.35, up, 0); diver.rotation.set(0, 0, 0); poseDiver(diver, { kick: t * 3, amp: .6, armZ: -.1, elbow: .2 });
    buddy.position.set(-.9, -.35, .6); buddy.rotation.set(0, .3, -Math.PI / 2 - .5); poseDiver(buddy, { kick: t * 1.5, amp: .3, armZ: 2.4, elbow: .4 });
    camera.position.set(3.4, -5.6, 5.2); camera.lookAt(-.1, -3, 0); camera.fov = 55; rays(t, V3(0, 0, 0)); snow(t, V3(0, -4, 0), 600, 5, [.3, .45, .5]);
    hud.push(() => { two(null, 'PERO LA REGLA NÚMERO UNO:', null, smooth(.05, .3, lt), 300); stamp('NUNCA SOLO', W / 2, 520, smooth(TL.rule + 1.6, TL.rule + 1.9, t), -.06, '#ff6a4a', 84);
      callout(buddy.userData.head.getWorldPosition(V3()), -60, 380, 'TU COMPAÑERO', 'vigila desde arriba', smooth(TL.rule + 2.2, TL.rule + 2.6, t), '#7fd4ff'); });
  } else {
    // M · marca
    const lt = t - TL.brand; underEnv(t, 25, false); camera.position.set(Math.sin(lt * .1) * 2, -14 + lt * .4, 6); camera.lookAt(V3(0, -8, -4)); camera.fov = 55;
    snow(t, V3(0, -6, -8), 700, 5, [.3, .45, .5]); emitRise(BB, V3(0, -16, -6), 120, t, 1.5, 16, 4, [1, 1, 1], 300); BB.mat.size = .1; expo = .8; fade = Math.min(.45, lt * .4);
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  fillL.position.copy(camera.position).add(V3(0, 1.5, 0));
  PS.end(); BB.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  for (const h of hud) h();
  finish(sea, { t, flash, ca, fade, bloom: bloomS, expo });
}
// fase del latido integrando la frecuencia (72 → 28 lpm)
function beatAcc(t) { const a = TL.bpm + .3, b = TL.urge - .6; const N = 200; let ph = 0; const t0 = TL.bpm - .5; for (let i = 0; i < N; i++) { const tt = lerp(t0, t, (i + .5) / N); ph += lerp(72, 28, easeInOut(smooth(a, b, tt))) / 60 * (t - t0) / N; } return ph; }
function renderCover() { renderFrame(1.2); coverText('¿CUÁNTO AGUANTAS', 'SIN RESPIRAR?', 'lo que hace tu cuerpo bajo el agua'); }
window.renderCover = () => { renderCover(); return true; };
window.OBJ = { PS, scene: sea };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
