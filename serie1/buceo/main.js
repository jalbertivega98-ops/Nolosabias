// NO LO SABÍAS — "Los secretos del buceo"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final. Unidades: metros (salvo primeros planos).
// Entrada de espaldas («back roll»): botella + plomos + chaleco superan los 15 kg; caer de espaldas protege máscara y regulador.
// Presión: +1 atm cada 10 m de agua de mar; a 10 m, 2 atm absolutas. El aire del oído medio se comprime (Boyle) → compensar (Valsalva).
// Luz: el agua absorbe antes el rojo; a partir de ~10 m apenas queda, la sangre se ve verdosa y todo azul.
// Narcosis por nitrógeno: «ley del martini», a partir de ~30 m cada 10 m ≈ una copa.
// Descompresión: el N2 disuelto a presión forma burbujas si se sube deprisa; parada de seguridad 3 min a 5 m.
// Ahmed Gabr, Mar Rojo (Dahab), 18-19 sept 2014: 332,35 m con botella; ~15 min de bajada y ~14 h de subida.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3, shake,
  g2, camera, SOFT, BUBBLE, sea, U, SUN_DIR, skyDome, abyss, ocean, oceanMat, Particles, txt, copperGrad, project, fmt, callout, bar, fract,
  emitRise, emitCurveW, camOrbit, arrowXY, bigStat, drawBrand, coverText, finish } from '../../lib/core.js';

skyDome.renderOrder = -1; abyss.renderOrder = -1;
const hemi = new THREE.HemisphereLight(0x9fc8ff, 0x10202a, 1.0); sea.add(hemi);
const sunL = new THREE.DirectionalLight(0xffc890, 2.2); sea.add(sunL); sea.add(sunL.target);
const keyL = new THREE.DirectionalLight(0xdfeeff, 1.3); keyL.position.set(-4, 8, 6); sea.add(keyL);

const xray = c => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  uniforms: { uCol: { value: new THREE.Color(...c) }, uA: { value: 1 } },
  vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform vec3 uCol; uniform float uA; varying vec3 vN; varying vec3 vV; void main(){ float f=pow(clamp(1.-abs(dot(vN,vV)),0.,1.),2.); gl_FragColor=vec4(uCol*(f*.9+.06)*uA,(f*.7+.05)*uA); }` });
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .55, ...o });

// ==========================================================================
// BUZO (escala humana, 1 = 1 m). Origen en la cadera.
// ==========================================================================
function makeDiver(suit = 0x15181e, accent = 0xc8743f) {
  const g = new THREE.Group(); const mS = M(suit, { roughness: .45 }), mA = M(accent), mT = M(0xe8b830, { metalness: .5, roughness: .3 }), mK = M(0x222428);
  const part = (geo, mat, parent, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
  const torso = new THREE.Group(); g.add(torso);
  part(new THREE.CapsuleGeometry(.2, .45, 6, 14), mS, torso, 0, .33, 0).scale.set(1, 1, .75);
  part(new THREE.BoxGeometry(.42, .5, .5), mK, torso, -.08, .36, 0); // chaleco
  part(new THREE.BoxGeometry(.06, .12, .52), mA, torso, .14, .5, 0);
  const tank = part(new THREE.CylinderGeometry(.1, .1, .62, 24), mT, torso, -.3, .38, 0);
  part(new THREE.SphereGeometry(.1, 16, 10), mT, torso, -.3, .69, 0);
  part(new THREE.CylinderGeometry(.03, .03, .1, 10), M(0x888888, { metalness: .8, roughness: .25 }), torso, -.3, .8, 0);
  const head = new THREE.Group(); head.position.set(.02, .82, 0); torso.add(head);
  part(new THREE.SphereGeometry(.13, 20, 16), mS, head, 0, 0, 0);
  const mask = part(new THREE.BoxGeometry(.06, .09, .18), new THREE.MeshStandardMaterial({ color: 0x9fe8ff, roughness: .05, metalness: .3, emissive: 0x0b3a48 }), head, .12, .03, 0);
  part(new THREE.CylinderGeometry(.035, .035, .08, 12), mA, head, .14, -.07, 0).rotation.z = Math.PI / 2; // regulador
  const limb = (parent, x, y, z, len, r) => { const j = new THREE.Group(); j.position.set(x, y, z); parent.add(j);
    part(new THREE.CapsuleGeometry(r, len, 5, 10), mS, j, 0, -len / 2 - r * .5, 0); const k = new THREE.Group(); k.position.y = -len - r; j.add(k);
    part(new THREE.CapsuleGeometry(r * .85, len, 5, 10), mS, k, 0, -len / 2 - r * .5, 0); return { j, k }; };
  const legs = [-1, 1].map(s => { const L = limb(g, 0, -.02, s * .1, .38, .075); const fin = part(new THREE.BoxGeometry(.5, .02, .2), mA, L.k, .18, -.5, 0); fin.rotation.z = -.15; return L; });
  const arms = [-1, 1].map(s => limb(torso, .02, .65, s * .26, .26, .055));
  g.userData = { torso, head, legs, arms, mask, tank }; sea.add(g); return g;
}
function poseDiver(d, o) { const u = d.userData; const ph = o.kick ?? 0, amp = o.amp ?? 0;
  u.legs.forEach((L, i) => { L.j.rotation.z = (o.hip ?? 0) + Math.sin(ph + i * Math.PI) * .35 * amp; L.k.rotation.z = -(o.knee ?? 0) - Math.max(0, Math.sin(ph + i * Math.PI)) * .3 * amp; });
  u.arms.forEach((A, i) => { A.j.rotation.z = o.armZ ?? -.2; A.j.rotation.x = (i ? 1 : -1) * (o.armX ?? .15); A.k.rotation.z = o.elbow ?? .6; });
  u.torso.rotation.z = o.lean ?? 0; }
const diver = makeDiver();

// Barco (costado bajo de una neumática / barca de buceo)
const boat = new THREE.Group(); sea.add(boat);
{ const hull = new THREE.Mesh(new THREE.BoxGeometry(7, 1.3, 3.2), M(0xe9edf0, { roughness: .4 })); hull.position.set(3.5, .45, 0); boat.add(hull);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, 7.2, 24), M(0x2a3340, { roughness: .6 })); tube.rotation.z = Math.PI / 2; tube.position.set(3.5, 1.2, 1.6); boat.add(tube);
  const tube2 = tube.clone(); tube2.position.z = -1.6; boat.add(tube2);
  const side = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, 3.2, 24), M(0x2a3340, { roughness: .6 })); side.rotation.x = Math.PI / 2; side.position.set(.05, 1.2, 0); boat.add(side);
  for (let i = 0; i < 3; i++) { const tk = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .62, 20), M(0xe8b830, { metalness: .5, roughness: .3 })); tk.position.set(4.5 + i * .5, 1.45, -.9); boat.add(tk); } }

// ==========================================================================
// OÍDO EN RAYOS X (escala libre, centro en HEADP)
// ==========================================================================
const HEADP = V3(0, -400, 0);
const earSet = new THREE.Group(); earSet.position.copy(HEADP); sea.add(earSet);
const skull = new THREE.Mesh(new THREE.SphereGeometry(3, 48, 32), xray([.5, .75, 1.1])); skull.scale.set(1, 1.15, 1); earSet.add(skull);
const canal = new THREE.Mesh(new THREE.CylinderGeometry(.32, .38, 1.8, 32, 1, true), xray([.9, .6, .45])); canal.rotation.z = Math.PI / 2; canal.position.set(-3.1, 0, 0); earSet.add(canal);
const drum = new THREE.Mesh(new THREE.SphereGeometry(.42, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2.4), new THREE.MeshStandardMaterial({ color: 0xffb08a, emissive: 0x401010, roughness: .4, side: THREE.DoubleSide, transparent: true, opacity: .9 }));
drum.rotation.z = Math.PI / 2; drum.position.set(-2.2, 0, 0); earSet.add(drum);
const cavMat = new THREE.MeshStandardMaterial({ color: 0x7fd4ff, emissive: 0x1a5f80, transparent: true, opacity: .35, roughness: .2, depthWrite: false });
const cavity = new THREE.Mesh(new THREE.SphereGeometry(.7, 32, 24), cavMat); cavity.position.set(-1.45, 0, 0); earSet.add(cavity);
const eust = new THREE.CatmullRomCurve3([V3(-1.2, -.5, 0), V3(-.8, -1.4, .2), V3(-.2, -2.2, .3), V3(.4, -2.8, .3)]);
const eustMesh = new THREE.Mesh(new THREE.TubeGeometry(eust, 40, .12, 12), xray([.9, .7, .5])); earSet.add(eustMesh);
const nose = new THREE.Mesh(new THREE.SphereGeometry(.5, 20, 14), xray([.9, .6, .45])); nose.position.set(2.8, -.4, 1.8); nose.scale.set(.8, 1.2, .6); earSet.add(nose);

// ==========================================================================
// VASO SANGUÍNEO (descompresión), centro en VESP
// ==========================================================================
const VESP = V3(0, -800, 0);
const vessel = new THREE.Group(); vessel.position.copy(VESP); sea.add(vessel);
const vWall = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 14, 48, 1, true), xray([1.2, .35, .3])); vWall.rotation.z = Math.PI / 2; vessel.add(vWall);

// Partículas
const PS = new Particles(20000, { size: .1, seed: 7 }); sea.add(PS.obj);
const BB = new Particles(1500, { size: .4, seed: 13, map: BUBBLE, blend: THREE.NormalBlending }); sea.add(BB.obj);
const WATER = [.55, .8, 1.25], AIR = [.4, .85, 1.6], HOT = [1.6, .7, .3], N2 = [.7, 1.1, 1.6];

// ==========================================================================
// HUD
// ==========================================================================
function stamp(s, x, y, a, rot = -.1, col = '#ff6a4a', size = 92) { if (a <= .01) return; const sc = lerp(1.6, 1, easeOut(clamp(a * 1.4)));
  g2.save(); g2.translate(x, y); g2.rotate(rot); g2.scale(sc, sc); g2.globalAlpha = clamp(a); g2.strokeStyle = col; g2.lineWidth = 8; g2.shadowColor = col; g2.shadowBlur = 25;
  g2.font = `800 ${size}px Montserrat`; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.letterSpacing = '6px'; const w = g2.measureText(s).width + 70; g2.strokeRect(-w / 2, -size * .8, w, size * 1.6); g2.fillStyle = col; g2.fillText(s, 0, 4); g2.restore(); }
function two(top, l1, l2, a, y = 300) { if (a <= .01) return; txt(l1, W / 2, y, 50, { font: 'Montserrat', weight: 800, alpha: a }); if (l2) txt(l2, W / 2, y + 62, 50, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(160, 920, y + 62, .5) }); if (top) txt(top, W / 2, y - 62, 24, { spacing: 7, alpha: a * .8, fill: '#e3a372' }); }
function depthBox(d, a, sub = null) { if (a <= .01) return; txt('PROFUNDIDAD', 80, 1470, 22, { align: 'left', spacing: 7, alpha: a * .7, fill: '#e3a372' });
  txt(Math.round(d) + ' m', 78, 1540, 74, { align: 'left', font: 'Montserrat', weight: 800, alpha: a }); if (sub) txt(sub, 80, 1610, 30, { align: 'left', weight: 300, alpha: a * .9 }); }
function martini(x, y, s, a) { if (a <= .01) return; g2.save(); g2.globalAlpha = clamp(a); g2.translate(x, y); g2.scale(s, s); g2.strokeStyle = '#ffe2c0'; g2.lineWidth = 5; g2.shadowColor = 'rgba(255,170,100,.8)'; g2.shadowBlur = 18;
  g2.beginPath(); g2.moveTo(-50, -60); g2.lineTo(50, -60); g2.lineTo(0, 0); g2.closePath(); g2.stroke(); g2.globalAlpha = clamp(a) * .35; g2.fillStyle = '#7fd4ff'; g2.beginPath(); g2.moveTo(-38, -48); g2.lineTo(38, -48); g2.lineTo(0, 0); g2.fill(); g2.globalAlpha = clamp(a);
  g2.beginPath(); g2.moveTo(0, 0); g2.lineTo(0, 55); g2.moveTo(-28, 58); g2.lineTo(28, 58); g2.stroke(); g2.fillStyle = '#8fbf5a'; g2.beginPath(); g2.arc(10, -40, 9, 0, 7); g2.fill(); g2.restore(); }
const win = (t, a, b, f = .3) => smooth(a, a + f, t) * (1 - smooth(b - f, b, t));
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;

// ==========================================================================
// ENTORNO: superficie (atardecer) o bajo el agua (abismo según profundidad)
// ==========================================================================
function surfaceEnv(t) { skyDome.visible = true; abyss.visible = false; ocean.visible = true; skyDome.position.copy(camera.position); U.uTime.value = t;
  sea.fog.color.setRGB(.3, .18, .13); sea.fog.density = .002; sunL.position.copy(SUN_DIR).multiplyScalar(500); sunL.target.updateMatrixWorld(); hemi.intensity = 1; }
function underEnv(t, depth, seeSurface = false) { skyDome.visible = false; abyss.visible = true; abyss.position.copy(camera.position); ocean.visible = seeSurface; U.uTime.value = t; U.uDepthCam.value = depth * 2.2;
  const k = clamp(depth / 60); sea.fog.color.setRGB(lerp(.04, .005, k), lerp(.22, .04, k), lerp(.3, .09, k)); sea.fog.density = lerp(.03, .06, k); hemi.intensity = lerp(1.1, .45, k); sunL.position.set(-50, 400, 80); sunL.target.updateMatrixWorld(); }
// absorción aproximada por canal (1/m) para R,G,B
const ABS = [.32, .055, .025];
const att = (c, d) => [c[0] * Math.exp(-ABS[0] * d), c[1] * Math.exp(-ABS[1] * d), c[2] * Math.exp(-ABS[2] * d)];
const BLOOD = [1.3, .2, .1];
function snow(t, center, n, r, col = [.25, .35, .4]) { const s = PS.seed; for (let i = 0; i < n; i++) { const q = (i % PS.n) * 4; const y = fract(s[q] - t * .03) * r * 2 - r;
  PS.push(center.x + (s[q + 1] - .5) * r * 2, center.y + y, center.z + (s[q + 2] - .5) * r * 2, col[0], col[1], col[2]); } }

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .05; camera.far = 9000; camera.fov = 45;
  let bloomS = .55, flash = 0, ca = .0013, fade = 0, expo = 1, focus = V3();
  PS.begin(); BB.begin(); PS.mat.size = .1; BB.mat.size = .4; diver.visible = false; boat.visible = false; earSet.visible = false; vessel.visible = false; diver.rotation.set(0, 0, 0);
  oceanMat.uniforms.uFoam.value = 0;
  for (const c of ['ears', 'blood', 'narc', 'slow', 'stop', 'gabr', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];

  if (t < TL.ears) {
    // A · entrada de espaldas desde la barca
    const lt = t - TL.hook; boat.visible = true; diver.visible = true;
    const r0 = TL.roll + .5, r1 = r0 + 1.0; const rk = smooth(r0, r1, t); const fall = clamp((t - r1) / .6);
    const bob = Math.sin(t * 1.1) * .06; boat.position.y = bob; boat.rotation.x = Math.sin(t * .8) * .02;
    diver.position.set(lerp(.05, -.3, rk) - fall * .5, 1.45 + bob - easeOut(fall) * 0 - (t > r1 ? Math.min(2.2, (t - r1) * 2.4) : 0), 0);
    diver.rotation.z = lerp(0, 2.3, easeInOut(rk)) + fall * .4; poseDiver(diver, { hip: lerp(1.5, .6, rk), knee: lerp(1.4, .2, rk), armZ: lerp(-.3, 1.2, rk), elbow: 1.6, armX: .2 });
    const inWater = t > r1 + .15; const under = t > r1 + 1.4;
    if (!under) { surfaceEnv(t); focus = V3(.2, 1.0, 0); camera.position.set(lerp(-2.4, -2.9, clamp(lt / 6)), 1.9, lerp(5.2, 6, clamp(lt / 6))); camera.lookAt(focus); camera.fov = 50;
      if (inWater) { oceanMat.uniforms.uFoam.value = 1 - smooth(r1, r1 + 1.6, t); oceanMat.uniforms.uFoamPos.value.set(-1.2, 0, 0); oceanMat.uniforms.uFoamR.value = 3;
        const k = t - r1 - .15; for (let i = 0; i < 2500; i++) { const s = PS.seed, q = i * 4; const a = s[q] * 6.283, sp = 1.5 + s[q + 1] * 3.5, up = 3 + s[q + 2] * 4; const tt = k * (.6 + s[q + 3] * .6);
          const y = up * tt - 4.9 * tt * tt; if (y < -.05) continue; const f = 1.3 * (1 - clamp(k / 1.2)); PS.push(-1.2 + Math.cos(a) * sp * tt, y, Math.sin(a) * sp * tt, f, f * 1.05, f * 1.1); } PS.mat.size = .09;
        flash = Math.max(flash, flashAt(t, r1 + .15, .3, .25)); } }
    else { const k = t - r1 - 1.4; underEnv(t, 3, true); boat.visible = true; diver.position.set(-1.3, -2.2 - k * .5, 0); diver.rotation.z = Math.PI * .5 + Math.sin(t) * .1; poseDiver(diver, { kick: t * 3, amp: .5, armZ: .3, elbow: .4 });
      focus = diver.position.clone().add(V3(0, .3, 0)); camera.position.set(-1.3 + 2.5, -3.6, 4.5); camera.lookAt(focus); camera.fov = 55;
      emitRise(BB, diver.position.clone().add(V3(.6, .5, 0)), 180, t, .35, 4, 1.6, [1, 1, 1]); BB.mat.size = .12; }
    hud.push(() => { two(null, '¿POR QUÉ SE TIRAN', 'DE ESPALDAS?', smooth(.1, .4, lt) * (1 - smooth(TL.kg - .2, TL.kg, t)), 300);
      const ka = win(t, TL.kg, TL.roll + .4); if (ka > 0) { bigStat('EQUIPO A LA ESPALDA', '+15 kg', 470, ka, .5); callout(diver.localToWorld(V3(-.3, .4, 0)), -60, 260, 'BOTELLA + PLOMOS', 'y chaleco', ka, '#ffe2c0'); }
      const pa = win(t, TL.roll + .2, r1 + 1.4); callout(diver.userData.mask.getWorldPosition(V3()), 70, -280, 'MÁSCARA', 'y regulador, a salvo', pa * (1 - smooth(r0 + .4, r0 + .6, t)), '#7fd4ff');
      two(null, 'CAES SOBRE LA BOTELLA:', 'NADA TE GOLPEA LA CARA', smooth(r1 + .1, r1 + .5, t), 300); });
  } else if (t < TL.blood) {
    // B · el oído: +1 atm cada 10 m, el aire se comprime, compensar
    const lt = t - TL.ears; earSet.visible = true; underEnv(t, 8);
    const depth = lerp(0, 10, smooth(TL.atm, TL.squash, t)); const P = 1 + depth / 10;
    const eq = smooth(TL.equal + 1.2, TL.equal + 2.6, t); const squeeze = (1 - 1 / P) * (1 - eq);
    cavity.scale.setScalar(Math.cbrt(1 - squeeze)); drum.scale.set(1, lerp(1, -.2, squeeze * 2), 1); drum.position.x = -2.2 + squeeze * .3;
    drum.material.emissive.setRGB(lerp(.25, 1.2, squeeze * 2), lerp(.06, .1, squeeze), .05);
    focus = HEADP.clone().add(V3(-1.6, -.4, 0)); camOrbit(focus, lerp(9.5, 8, clamp(lt / 8)), lerp(-.35, -.15, clamp(lt / 8)), .12, 42); bloomS = .7;
    // presión del agua empujando por el canal
    const pw = smooth(TL.atm, TL.atm + .5, t) * (1 - eq * .7); for (let i = 0; i < 1200 * pw; i++) { const s = PS.seed, q = i * 4; const u = fract(s[q] + t * .7); const x = lerp(-5.6, -2.5, u); const r = Math.sqrt(s[q + 1]) * .3, a = s[q + 2] * 6.283;
      PS.push(HEADP.x + x, HEADP.y + Math.cos(a) * r, HEADP.z + Math.sin(a) * r, WATER[0] * .7, WATER[1] * .7, WATER[2] * .7); }
    // aire del oído medio (se aprieta) y aire que entra al soplar
    for (let i = 0; i < 700; i++) { const s = PS.seed, q = (i + 3000) * 4; const r = Math.cbrt(s[q]) * .62 * cavity.scale.x, a = s[q + 1] * 6.283, b = Math.acos(2 * s[q + 2] - 1); const j = Math.sin(t * 3 + i) * .03;
      PS.push(HEADP.x - 1.45 + r * Math.sin(b) * Math.cos(a) + j, HEADP.y + r * Math.cos(b), HEADP.z + r * Math.sin(b) * Math.sin(a), AIR[0] * .8, AIR[1] * .8, AIR[2] * .8); }
    const blow = win(t, TL.equal + .9, TL.blood - .2); if (blow > 0) emitCurveW(PS, new THREE.CatmullRomCurve3([...eust.points].reverse()), 500, t, .9, [AIR[0] * blow, AIR[1] * blow, AIR[2] * blow], .12, 6000, p => p.add(HEADP));
    PS.mat.size = .07;
    hud.push(() => { two(null, '¿POR QUÉ DUELEN', 'LOS OÍDOS AL BAJAR?', smooth(.1, .4, lt) * (1 - smooth(TL.atm - .2, TL.atm, t)), 300);
      const pa = smooth(TL.atm, TL.atm + .4, t); if (pa > 0) { txt('PRESIÓN', W / 2, 262, 24, { spacing: 7, alpha: pa * .8, fill: '#e3a372' }); txt(P.toFixed(1).replace('.', ',') + ' atm', W / 2, 360, 104, { font: 'Montserrat', weight: 800, alpha: pa, fill: P > 1.95 ? copperGrad(240, 840, 360, .5) : '#fff' }); depthBox(depth, pa, '+1 atm cada 10 m'); }
      stamp('×2', 860, 520, smooth(TL.double + .3, TL.double + .6, t) * (1 - smooth(TL.equal - .2, TL.equal, t)), -.08, '#ff6a4a', 80);
      callout(HEADP.clone().add(V3(-2.2, .35, 0)), -40, -380, 'TÍMPANO', 'empujado hacia dentro', smooth(TL.squash + .2, TL.squash + .6, t) * (1 - eq), '#ff8a6a');
      callout(HEADP.clone().add(V3(-1.45, .5, 0)), 80, -420, 'AIRE APLASTADO', 'en el oído medio', smooth(TL.squash + .8, TL.squash + 1.2, t) * (1 - eq), '#7fd4ff');
      two('MANIOBRA DE VALSALVA', 'TÁPATE LA NARIZ', 'Y SOPLA', smooth(TL.equal + .2, TL.equal + .6, t), 1420);
      callout(HEADP.clone().add(V3(-.6, -1.6, .25)), 120, 200, 'TROMPA DE EUSTAQUIO', 'el aire sube y compensa', smooth(TL.equal + 1.2, TL.equal + 1.6, t), '#7fd4ff'); });
  } else if (t < TL.narc) {
    // C · el color: el agua se bebe el rojo
    const lt = t - TL.blood; const depth = lerp(3, 22, smooth(TL.blood + .3, TL.narc - .5, t)); underEnv(t, depth);
    diver.visible = true; diver.position.set(0, -depth, 0); diver.rotation.set(0, .3, Math.PI * .42); poseDiver(diver, { kick: t * 2.5, amp: .4, armZ: 1.2, elbow: .3 });
    const hand = diver.userData.arms[1].k.localToWorld(V3(0, -.35, 0));
    // nube de «sangre» de un pequeño corte en la mano
    const bc = att(BLOOD, depth); const amb = [.01, .05, .07];
    for (let i = 0; i < 2600; i++) { const s = PS.seed, q = i * 4; const age = fract(s[q] + t * .12); const a = s[q + 1] * 6.283, r = Math.sqrt(s[q + 2]) * (.05 + age * .5); const f = (1 - age) * .9;
      PS.push(hand.x + Math.cos(a) * r + age * .4, hand.y + (s[q + 3] - .5) * age * .5 + age * .2, hand.z + Math.sin(a) * r, (bc[0] + amb[0]) * f, (bc[1] + amb[1]) * f, (bc[2] + amb[2]) * f); }
    PS.mat.size = .05; PS.mat.blending = THREE.AdditiveBlending;
    focus = hand.clone(); camera.position.copy(focus).add(V3(1.3, .35, 2.3)); camera.lookAt(focus); camera.fov = 40; snow(t, focus, 600, 4); bloomS = .5;
    hud.push(() => { two(null, '¿LA SANGRE', 'SE VE VERDE?', smooth(.1, .4, lt) * (1 - smooth(TL.red - .2, TL.red, t)), 300);
      const sa = smooth(TL.red, TL.red + .4, t); depthBox(depth, smooth(.2, .6, lt));
      const bands = [['ROJO', .32, '#ff4a3a'], ['NARANJA', .12, '#ff9a3a'], ['AMARILLO', .06, '#ffe05a'], ['VERDE', .03, '#5ad06a'], ['AZUL', .015, '#4aa8ff']];
      if (sa > 0) { txt('LA LUZ QUE QUEDA', W / 2, 250, 24, { spacing: 7, alpha: sa * .8, fill: '#e3a372' }); bands.forEach(([n, k, c], i) => bar(170, 330 + i * 78, 740, Math.exp(-k * depth), n, Math.round(Math.exp(-k * depth) * 100) + ' %', sa, c)); }
      callout(hand, -60, 300, depth > 9 ? 'SANGRE: VERDE' : 'SANGRE', depth > 9 ? 'el rojo ya no llega' : null, smooth(.4, .8, lt), depth > 9 ? '#7fe08a' : '#ff6a5a');
      two(null, 'TODO SE', 'VUELVE AZUL', smooth(TL.blue + 1.4, TL.blue + 1.8, t), 1420); });
  } else if (t < TL.slow) {
    // D · narcosis: la ley del martini
    const lt = t - TL.narc; const depth = lerp(22, 52, smooth(TL.narc, TL.slow - .4, t)); underEnv(t, depth); diver.visible = true;
    const drunk = smooth(30, 52, depth); diver.position.set(0, -depth, 0); diver.rotation.set(Math.sin(t * .9) * .25 * drunk, .4 + Math.sin(t * .6) * .4 * drunk, Math.PI * .45 + Math.sin(t * 1.3) * .3 * drunk);
    poseDiver(diver, { kick: t * 2, amp: .3, armZ: .6 + Math.sin(t * 2) * .5 * drunk, elbow: .5 });
    focus = diver.position.clone(); const sw = shake(t, .25 * drunk, 1.5); camOrbit(focus.clone().add(sw), lerp(4.5, 3.6, clamp(lt / 6)), .6 + t * .05, .15, 45); camera.up.set(Math.sin(t * .8) * .25 * drunk, 1, 0); camera.lookAt(focus);
    ca = .0013 + drunk * .006; bloomS = .6 + drunk * .3;
    // moléculas de N2 (parejas) alrededor
    for (let i = 0; i < 500; i++) { const s = PS.seed, q = i * 4; const p = focus.clone().add(V3((s[q] - .5) * 6, (fract(s[q + 1] + t * .02) - .5) * 6, (s[q + 2] - .5) * 6)); const a = s[q + 3] * 6.28 + t;
      const o = V3(Math.cos(a) * .05, Math.sin(a) * .05, 0); const f = smooth(TL.n2, TL.n2 + .6, t) * .9; PS.push(p.x + o.x, p.y + o.y, p.z, N2[0] * f, N2[1] * f, N2[2] * f); PS.push(p.x - o.x, p.y - o.y, p.z, N2[0] * f, N2[1] * f, N2[2] * f); }
    PS.mat.size = .06; snow(t, focus, 500, 4);
    hud.push(() => { two(null, 'MÁS ABAJO,', 'ALGO MÁS RARO', smooth(.1, .4, lt) * (1 - smooth(TL.n2 - .2, TL.n2, t)), 300);
      two('NARCOSIS', 'EL NITRÓGENO,', 'A PRESIÓN, EMBORRACHA', win(t, TL.n2, TL.martini), 300);
      const ma = smooth(TL.martini, TL.martini + .4, t); if (ma > 0) { txt('LA LEY DEL', W / 2, 250, 40, { font: 'Montserrat', weight: 800, alpha: ma }); txt('MARTINI', W / 2, 340, 104, { font: 'Montserrat', weight: 800, alpha: ma, fill: copperGrad(200, 880, 340, .5) }); }
      const ca2 = smooth(TL.copas, TL.copas + .3, t); [30, 40, 50].forEach((m, i) => { const a = ca2 * smooth(m - 1, m + 1, depth); martini(300 + i * 240, 600, 1.1, a); txt(m + ' m', 300 + i * 240, 690, 30, { font: 'Montserrat', weight: 800, alpha: a }); });
      depthBox(depth, smooth(.2, .6, lt), depth > 30 ? (depth > 40 ? (depth > 50 ? '3 copas' : '2 copas') : '1 copa') : null); });
  } else if (t < TL.gabr) {
    if (t < TL.stop) {
      // E · descompresión: N2 disuelto → burbujas si subes rápido
      const lt = t - TL.slow; vessel.visible = true; underEnv(t, 20); focus = VESP.clone(); camOrbit(focus, lerp(9, 7.5, clamp(lt / 6)), .25 + lt * .03, .2, 45); bloomS = .7;
      const fast = smooth(TL.bubbles, TL.bubbles + 1.2, t);
      for (let i = 0; i < 900; i++) { const s = PS.seed, q = i * 4; const x = (fract(s[q] + t * .12) - .5) * 14; const r = Math.sqrt(s[q + 1]) * 1.4, a = s[q + 2] * 6.283; PS.push(VESP.x + x, VESP.y + Math.cos(a) * r, VESP.z + Math.sin(a) * r, 1.1, .18, .14); }
      const dis = smooth(TL.dissolve, TL.dissolve + .5, t); for (let i = 0; i < 1500 * dis; i++) { const s = PS.seed, q = (i + 2000) * 4; const x = (fract(s[q] + t * .12) - .5) * 14; const r = Math.sqrt(s[q + 1]) * 1.45, a = s[q + 2] * 6.283;
        const f = .8 * (1 - fast * .8); PS.push(VESP.x + x, VESP.y + Math.cos(a) * r, VESP.z + Math.sin(a) * r, N2[0] * f, N2[1] * f, N2[2] * f); }
      PS.mat.size = .13;
      if (fast > 0) { for (let i = 0; i < 60; i++) { const s = BB.seed, q = i * 4; const x = (fract(s[q] + t * .12) - .5) * 14; const r = Math.sqrt(s[q + 1]) * 1.1, a = s[q + 2] * 6.283; if (s[q + 3] > fast) continue; BB.push(VESP.x + x, VESP.y + Math.cos(a) * r, VESP.z + Math.sin(a) * r, 1, 1, 1); }
        BB.mat.size = lerp(.2, .9, fast); }
      hud.push(() => { two(null, '¿POR QUÉ SUBEN', 'TAN DESPACIO?', smooth(.1, .4, lt) * (1 - smooth(TL.dissolve - .2, TL.dissolve, t)), 300);
        callout(VESP.clone().add(V3(1.5, .6, 0)), 60, -340, 'NITRÓGENO DISUELTO', 'a presión, en la sangre', win(t, TL.dissolve + .3, TL.bubbles + .3), '#7fd4ff');
        two('SUBIDA RÁPIDA', 'SE FORMAN BURBUJAS', 'COMO EN UN REFRESCO', smooth(TL.bubbles + .2, TL.bubbles + .6, t), 300); arrowXY(W / 2, 1500, W / 2, 1250, smooth(TL.bubbles, TL.bubbles + .5, t), '#ff8a6a'); });
    } else {
      // parada de seguridad: 3 min a 5 m
      const lt = t - TL.stop; underEnv(t, 5, true); diver.visible = true; diver.position.set(0, -5, 0); diver.rotation.set(0, .5, Math.PI * .08); poseDiver(diver, { hip: .25, knee: .4, armZ: 2.4, elbow: .3, kick: t, amp: .15 });
      focus = diver.position.clone().add(V3(0, .3, 0)); camera.position.set(2.8, -5.0, 3.6); camera.lookAt(focus.clone().add(V3(0, -.3, 0))); camera.fov = 50;
      emitRise(BB, diver.userData.head.getWorldPosition(V3()).add(V3(.15, -.05, 0)), 200, t, .2, 5, 1.8, [1, 1, 1]); BB.mat.size = .1; snow(t, focus, 500, 4, [.4, .55, .6]);
      // cabo de ascenso
      for (let i = 0; i < 300; i++) { const y = -9 + i / 300 * 9; PS.push(-.35, y, -.2, .9, .8, .6); } PS.mat.size = .05;
      hud.push(() => { const sec = Math.max(0, 180 - Math.floor(smooth(TL.stop + .8, TL.gabr - .3, t) * 180)); txt('PARADA DE SEGURIDAD', W / 2, 262, 24, { spacing: 7, alpha: smooth(.1, .4, lt) * .8, fill: '#e3a372' });
        txt(Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'), W / 2, 380, 130, { font: 'Montserrat', weight: 800, alpha: smooth(.1, .4, lt), fill: copperGrad(240, 840, 380, .5) }); depthBox(5, smooth(.2, .5, lt), 'antes de salir'); });
    }
  } else if (t < TL.brand) {
    // F · Ahmed Gabr, 332 m: 15 min de bajada, ~14 h de subida
    const lt = t - TL.gabr; underEnv(t, 300); focus = V3(0, -332, 0); camOrbit(focus, 6, t * .05, .1, 45); snow(t, focus, 1200, 5, [.15, .22, .3]); diver.visible = true; diver.position.copy(focus).add(V3(0, -.4, -1.5)); diver.rotation.set(0, .3, Math.PI * .5); poseDiver(diver, { kick: t * 2, amp: .3, armZ: .3, elbow: .4 }); expo = .9;
    hud.push(() => { const a = smooth(.1, .4, lt); txt('2014 · MAR ROJO · AHMED GABR', W / 2, 250, 26, { spacing: 6, alpha: a * .85, fill: '#e3a372' }); txt('332 m', W / 2, 380, 140, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(200, 880, 380, .5) });
      txt('con botella', W / 2, 470, 38, { weight: 300, alpha: a });
      // perfil de la inmersión (tiempo lineal: 0–14,3 h)
      const x0 = 140, x1 = 940, y0 = 620, y1 = 1380, Tm = 14.3, X = h => lerp(x0, x1, h / Tm), Y = d => lerp(y0, y1, d / 332); const ca = smooth(.3, .7, lt);
      g2.save(); g2.globalAlpha = ca * .5; g2.strokeStyle = '#ffffff'; g2.lineWidth = 2; g2.beginPath(); g2.moveTo(x0, y0); g2.lineTo(x1, y0); g2.moveTo(x0, y0); g2.lineTo(x0, y1); g2.stroke(); g2.restore();
      txt('0 m', x0 - 14, y0, 22, { align: 'right', alpha: ca * .7, weight: 300 }); txt('332 m', x0 - 14, y1, 22, { align: 'right', alpha: ca * .7, weight: 300 }); txt('14 h', x1, y0 - 30, 22, { align: 'right', alpha: ca * .7, weight: 300 });
      const dk = smooth(TL.down - .6, TL.down + .4, t); const uk = smooth(TL.up, TL.brand - .2, t);
      g2.save(); g2.lineCap = 'round'; g2.lineJoin = 'round'; g2.lineWidth = 8; g2.shadowBlur = 20;
      if (dk > 0) { g2.strokeStyle = '#ff8a5a'; g2.shadowColor = '#ff8a5a'; g2.beginPath(); g2.moveTo(X(0), Y(0)); g2.lineTo(X(.25 * dk), Y(332 * dk)); g2.stroke(); }
      if (uk > 0) { g2.strokeStyle = '#7fd4ff'; g2.shadowColor = '#7fd4ff'; g2.beginPath(); g2.moveTo(X(.25), Y(332)); const N = 120; for (let i = 1; i <= N * uk; i++) { const u = i / N; const h = .25 + u * (Tm - .25); const d = 332 * Math.pow(1 - u, 2.2); const ds = Math.round(d / 9) * 9; g2.lineTo(X(h), Y(u > .02 ? ds : d)); } g2.stroke(); }
      g2.restore();
      if (dk > .5) { txt('BAJADA', X(.25) + 40, Y(332) - 70, 24, { align: 'left', spacing: 5, alpha: smooth(.5, 1, dk), fill: '#ff8a5a' }); txt('15 min', X(.25) + 40, Y(332) - 25, 46, { align: 'left', font: 'Montserrat', weight: 800, alpha: smooth(.5, 1, dk) }); }
      if (uk > 0) { const hh = .25 + uk * (Tm - .25); txt('SUBIDA', W / 2 + 120, Y(120) - 40, 24, { spacing: 5, alpha: smooth(0, .2, uk), fill: '#7fd4ff' }); txt('≈ ' + Math.round(hh) + ' h', W / 2 + 120, Y(120) + 20, 70, { font: 'Montserrat', weight: 800, alpha: smooth(0, .2, uk), fill: copperGrad(500, 900, Y(120) + 20, .5) }); } });
  } else {
    // G · marca
    const lt = t - TL.brand; underEnv(t, 25, false); focus = V3(0, -6, 0); camera.position.set(Math.sin(lt * .1) * 2, -14 + lt * .4, 6); camera.lookAt(V3(0, -8, -4)); camera.fov = 55;
    snow(t, V3(0, -6, -8), 700, 5, [.3, .45, .5]); emitRise(BB, V3(0, -16, -6), 120, t, 1.5, 16, 4, [1, 1, 1], 300); BB.mat.size = .1; expo = .8; fade = Math.min(.45, lt * .4);
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  PS.end(); BB.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  for (const h of hud) h();
  finish(sea, { t, flash, ca, fade, bloom: bloomS, expo });
}
function renderCover() { renderFrame(TL.roll + .9); coverText('LOS SECRETOS', 'DEL BUCEO', 'y la física que hay detrás'); }
window.renderCover = () => { renderCover(); return true; };
window.OBJ = { diver, boat, earSet, vessel, PS, BB };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
