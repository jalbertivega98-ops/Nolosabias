// NO LO SABÍAS — "El muro del kilómetro 30"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final.
// Glucógeno muscular+hepático ≈ 2.000 kcal: alcanza para ~30-32 km; después predomina la grasa (más lenta en dar ATP) → «el muro».
// ~35.000-45.000 pasos en un maratón; fuerza de reacción del suelo ≈ 2-3 veces el peso corporal. Sudor: 0,5-2 L/h.
// 42,195 km: Juegos de Londres 1908 (salida en Windsor, meta frente al palco real del estadio de White City); oficial desde 1921.
// Récord mundial: Kelvin Kiptum, 2:00:35 (Chicago, 8 oct 2023) → 2:51 min/km. Leyenda de Filípides (Maratón → Atenas).
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3,
  g2, camera, SOFT, Particles, txt, copperGrad, project, callout, bar, fract, arrowXY, bigStat, drawBrand, coverText, finish } from '../../lib/core.js';

const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(new THREE.Color(.75, .8, .88), .006);
const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uTop: { value: new THREE.Color(.2, .42, .78) }, uHor: { value: new THREE.Color(.8, .86, .94) }, uSun: { value: V3(.5, .35, -.8).normalize() }, uSunC: { value: new THREE.Color(1, .9, .7) } },
  vertexShader: `varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 uTop,uHor,uSunC,uSun; varying vec3 vD; void main(){ vec3 d=normalize(vD); float y=clamp(d.y,0.,1.); vec3 c=mix(uHor,uTop,pow(y,.5)); float s=max(dot(d,uSun),0.); c+=uSunC*(pow(s,40.)*.5+smoothstep(.9992,.9996,s)*2.); gl_FragColor=vec4(c,1.); }` });
const sky = new THREE.Mesh(new THREE.SphereGeometry(2800, 32, 16), skyMat); scene.add(sky);
const hemi = new THREE.HemisphereLight(0xe2f0ff, 0x4a4030, 1.6); scene.add(hemi);
const sunL = new THREE.DirectionalLight(0xfff1dc, 2.4); sunL.position.set(30, 50, 40); scene.add(sunL);
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .6, ...o });

// ==========================================================================
// CORREDOR (1 = 1 m; origen en los pies; corre hacia -z)
// ==========================================================================
const SKIN = [0xc98d6a, 0x8a5a3a, 0xe0b090, 0x5a3a28];
function makeRunner(seed = 1, shirt = null) { const r = rng(seed * 7 + 3); const g = new THREE.Group();
  const sh = M(shirt ?? [0xd04a3a, 0x2a6ad0, 0xe8b830, 0x2a9a6a, 0xf2f2f2, 0x8a3ad0][seed % 6]), sk = M(SKIN[seed % 4]), pa = M(0x1a1c22), shoe = M(0xf0f0f0);
  const hips = new THREE.Group(); hips.position.y = .95; g.add(hips);
  const torso = new THREE.Group(); hips.add(torso); const tb = new THREE.Mesh(new THREE.CapsuleGeometry(.17, .42, 4, 12), sh); tb.position.y = .3; tb.scale.set(1, 1, .7); torso.add(tb);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.12, 16, 12), sk); head.position.y = .72; torso.add(head);
  const bib = new THREE.Mesh(new THREE.PlaneGeometry(.16, .12), M(0xffffff)); bib.position.set(0, .3, -.125); bib.rotation.y = Math.PI; torso.add(bib);
  const limb = (parent, y, x, len, r0, m1, m2) => { const j = new THREE.Group(); j.position.set(x, y, 0); parent.add(j); const a = new THREE.Mesh(new THREE.CapsuleGeometry(r0, len, 4, 8), m1); a.position.y = -len / 2; j.add(a);
    const k = new THREE.Group(); k.position.y = -len - r0 * .3; j.add(k); const b = new THREE.Mesh(new THREE.CapsuleGeometry(r0 * .85, len, 4, 8), m2); b.position.y = -len / 2; k.add(b); return { j, k }; };
  const legs = [-1, 1].map(s => { const L = limb(hips, 0, s * .1, .4, .07, pa, sk); const f = new THREE.Mesh(new THREE.BoxGeometry(.1, .07, .24), shoe); f.position.set(0, -.44, -.05); L.k.add(f); return L; });
  const arms = [-1, 1].map(s => limb(torso, .55, s * .22, .26, .045, sk, sk));
  g.userData = { hips, torso, legs, arms, phase: r() * 6.283, mats: [sk, pa], skin0: new THREE.Color(SKIN[seed % 4]) }; scene.add(g); return g; }
function poseRun(R, t, o = {}) { const u = R.userData; const cad = o.cad ?? 1.45; const ph = t * cad * 6.283 + u.phase; const amp = o.amp ?? 1;
  u.legs.forEach((L, i) => { const p = ph + i * Math.PI; L.j.rotation.x = Math.sin(p) * .7 * amp; L.k.rotation.x = -(.25 + Math.max(0, -Math.cos(p)) * 1.3) * amp - .05; });
  u.arms.forEach((A, i) => { const p = ph + i * Math.PI; A.j.rotation.x = -Math.sin(p) * .6 * amp; A.k.rotation.x = -1.4; A.j.rotation.z = (i ? 1 : -1) * .1; });
  u.torso.rotation.x = -(o.lean ?? .12); u.hips.position.y = .95 + Math.abs(Math.sin(ph)) * .05 * amp - (o.sag ?? 0); }

// ==========================================================================
// CARRETERA, VALLAS, PÚBLICO, ARCO KM 30, MURO
// ==========================================================================
const road = new THREE.Group(); scene.add(road);
{ const asp = new THREE.Mesh(new THREE.PlaneGeometry(10, 800), M(0x3a3c42, { roughness: .9 })); asp.rotation.x = -Math.PI / 2; asp.position.z = -300; road.add(asp);
  const side = new THREE.Mesh(new THREE.PlaneGeometry(200, 800), M(0x7a8a5a, { roughness: 1 })); side.rotation.x = -Math.PI / 2; side.position.set(0, -.02, -300); road.add(side);
  for (let i = 0; i < 160; i++) { const d = new THREE.Mesh(new THREE.PlaneGeometry(.15, 2), M(0xf0f0f0)); d.rotation.x = -Math.PI / 2; d.position.set(0, .01, 100 - i * 5); road.add(d); }
  const r = rng(5); const crowdM = [0xd04a3a, 0x2a6ad0, 0xe8b830, 0x2a9a6a, 0xf2f2f2, 0x333333].map(c => M(c));
  for (let i = 0; i < 260; i++) { const s = i % 2 ? 1 : -1; const p = new THREE.Mesh(new THREE.CapsuleGeometry(.2, .9, 3, 6), crowdM[i % 6]); p.position.set(s * (6 + r() * 2.5), .65, 100 - i * 2.2 - r()); road.add(p);
    const h = new THREE.Mesh(new THREE.SphereGeometry(.13, 8, 6), M(SKIN[i % 4])); h.position.set(p.position.x, 1.35, p.position.z); road.add(h); }
  for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(.08, .9, 800), M(0x2a6ad0)); b.position.set(s * 5.3, .45, -300); road.add(b); }
  for (let i = 0; i < 40; i++) { const tr = new THREE.Group(); const tk = new THREE.Mesh(new THREE.CylinderGeometry(.2, .25, 3, 8), M(0x6a4a30)); tk.position.y = 1.5; tr.add(tk); const cr = new THREE.Mesh(new THREE.SphereGeometry(2, 12, 10), M(0x3a7a3a)); cr.position.y = 4; tr.add(cr); tr.position.set((i % 2 ? 1 : -1) * (13 + r() * 6), 0, 100 - i * 20); road.add(tr); } }
const arch = new THREE.Group(); road.add(arch);
{ for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(.5, 5, .5), M(0xc8743f)); p.position.set(s * 5.6, 2.5, 0); arch.add(p); } const top = new THREE.Mesh(new THREE.BoxGeometry(11.7, 1.3, .5), M(0xc8743f)); top.position.y = 5.3; arch.add(top);
  const c = document.createElement('canvas'); c.width = 512; c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#c8743f'; x.fillRect(0, 0, 512, 64); x.fillStyle = '#fff'; x.font = '800 48px Montserrat'; x.textAlign = 'center'; x.fillText('KM 30', 256, 50);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; const lbl = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.1), new THREE.MeshBasicMaterial({ map: tex })); lbl.position.set(0, 5.3, .27); arch.add(lbl); arch.position.z = -40; }
const wall = new THREE.Group(); road.add(wall);
{ const bm = [M(0x9a4a32, { roughness: .9 }), M(0x8a3e2a, { roughness: .9 }), M(0xa8583c, { roughness: .9 })]; for (let row = 0; row < 14; row++) for (let i = 0; i < 18; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.58, .26, .4), bm[(row * 3 + i) % 3]); b.position.set(-5.1 + i * .6 + (row % 2) * .3, .14 + row * .28, 0); wall.add(b); } wall.position.z = -44; }

// Estadio de 1908 (pista + palco real)
const STD = V3(0, -400, 0); const stadium = new THREE.Group(); stadium.position.copy(STD); scene.add(stadium);
{ const field = new THREE.Mesh(new THREE.CircleGeometry(1, 64), M(0x4a8a3a, { roughness: 1 })); field.rotation.x = -Math.PI / 2; field.scale.set(30, 50, 1); stadium.add(field);
  const track = new THREE.Mesh(new THREE.RingGeometry(1, 1.18, 96), M(0xb8583a, { roughness: .9, side: THREE.DoubleSide })); track.rotation.x = -Math.PI / 2; track.position.y = .02; track.scale.set(30, 50, 1); stadium.add(track);
  const stands = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.45, 96), M(0x8a8a90, { roughness: .9, side: THREE.DoubleSide })); stands.rotation.x = -Math.PI / 2; stands.position.y = 2; stands.scale.set(30, 50, 1); stadium.add(stands);
  const box = new THREE.Group(); const base = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 3), M(0x6a1a2a)); base.position.y = 1.5; box.add(base); const roof = new THREE.Mesh(new THREE.BoxGeometry(9, .4, 4), M(0xe8b830, { metalness: .5, roughness: .3 })); roof.position.y = 4.5; box.add(roof);
  for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, 1.5, 8), M(0xe8b830, { metalness: .5, roughness: .3 })); c.position.set(s * 4, 3.7, 1.5); box.add(c); }
  box.position.set(39, 0, 0); box.rotation.y = -Math.PI / 2; stadium.add(box); }
// Grecia: colinas y camino
const GRC = V3(0, -800, 0); const greece = new THREE.Group(); greece.position.copy(GRC); scene.add(greece);
{ const g = new THREE.Mesh(new THREE.PlaneGeometry(300, 300, 80, 80), M(0xb89a68, { roughness: 1 })); g.rotation.x = -Math.PI / 2; const p = g.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, Math.abs(x) > 8 ? (Math.sin(x * .06) * Math.cos(y * .05) + 1) * Math.min(1, (Math.abs(x) - 8) / 20) * 9 : 0); } g.geometry.computeVertexNormals(); greece.add(g);
  const path = new THREE.Mesh(new THREE.PlaneGeometry(4, 300), M(0xd8c090, { roughness: 1 })); path.rotation.x = -Math.PI / 2; path.position.y = .03; greece.add(path);
  const r = rng(8); for (let i = 0; i < 60; i++) { const o = new THREE.Mesh(new THREE.SphereGeometry(1 + r(), 8, 6), M(0x6a7a4a)); o.scale.y = .7; o.position.set((r() < .5 ? -1 : 1) * (6 + r() * 30), 1, 100 - r() * 250); greece.add(o); } }
// Medalla
const medal = new THREE.Group(); scene.add(medal);
{ const d = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .14, 64), M(0xe8b830, { metalness: .3, roughness: .35, emissive: 0x3a2a08 })); d.rotation.x = Math.PI / 2; medal.add(d);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1, .07, 12, 64), M(0xc8943a, { metalness: .3, roughness: .3, emissive: 0x2a1a04 })); medal.add(rim);
  const rb = new THREE.Mesh(new THREE.BoxGeometry(.7, 2.6, .03), M(0x2a6ad0)); rb.position.y = 2.2; medal.add(rb);
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#5a3a10'; x.font = '800 64px Montserrat'; x.textAlign = 'center'; x.fillText('42,195', 128, 120); x.font = '700 40px Montserrat'; x.fillText('KM', 128, 170);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; const face = new THREE.Mesh(new THREE.CircleGeometry(.85, 48), new THREE.MeshStandardMaterial({ map: tex, transparent: true, metalness: .2, roughness: .4 })); face.position.z = .08; medal.add(face); }
const gels = []; for (let i = 0; i < 6; i++) { const gm = new THREE.Mesh(new THREE.BoxGeometry(.09, .14, .02), M([0xff7a3a, 0x3ad07a, 0xe8d030][i % 3], { roughness: .3 })); scene.add(gm); gels.push(gm); }

const runners = []; for (let i = 0; i < 14; i++) runners.push(makeRunner(i + 1));
const hero = runners[0]; const greek = makeRunner(40, 0xe8e0d0);
const ALL = [road, stadium, greece, medal, greek, ...runners, ...gels, wall, arch];
const PS = new Particles(20000, { size: .1, seed: 5 }); scene.add(PS.obj);
const DROP = new Particles(3000, { size: .05, seed: 9, blend: THREE.NormalBlending }); scene.add(DROP.obj);

// ==========================================================================
// HUD
// ==========================================================================
function stamp(s, x, y, a, rot = -.08, col = '#ff6a4a', size = 86) { if (a <= .01) return; const sc = lerp(1.6, 1, easeOut(clamp(a * 1.4)));
  g2.save(); g2.translate(x, y); g2.rotate(rot); g2.scale(sc, sc); g2.globalAlpha = clamp(a); g2.strokeStyle = col; g2.lineWidth = 8; g2.shadowColor = col; g2.shadowBlur = 25;
  g2.font = `800 ${size}px Montserrat`; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.letterSpacing = '6px'; const w = g2.measureText(s).width + 70; g2.strokeRect(-w / 2, -size * .8, w, size * 1.6); g2.fillStyle = col; g2.fillText(s, 0, 4); g2.restore(); }
function two(top, l1, l2, a, y = 300) { if (a <= .01) return; txt(l1, W / 2, y, 50, { font: 'Montserrat', weight: 800, alpha: a }); if (l2) txt(l2, W / 2, y + 62, 50, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(160, 920, y + 62, .5) }); if (top) txt(top, W / 2, y - 62, 24, { spacing: 7, alpha: a * .8, fill: '#e3a372' }); }
function fuel(x, y, w, h, frac, a, col) { if (a <= .01) return; g2.save(); g2.globalAlpha = clamp(a); g2.strokeStyle = '#ffffff'; g2.lineWidth = 5; g2.strokeRect(x, y, w, h); g2.fillRect(x + w, y + h * .3, 14, h * .4);
  g2.fillStyle = col; g2.shadowColor = col; g2.shadowBlur = 20; g2.fillRect(x + 8, y + 8, (w - 16) * clamp(frac), h - 16); g2.restore(); }
const win = (t, a, b, f = .3) => smooth(a, a + f, t) * (1 - smooth(b - f, b, t));
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
const fmtT = s => { const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), ss = Math.floor(s % 60); return h + ':' + String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0'); };

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .05; camera.far = 6000; camera.fov = 42;
  let bloomS = .4, flash = 0, ca = .0012, fade = 0, expo = 1.1;
  PS.begin(); DROP.begin(); PS.mat.size = .1; for (const o of ALL) o.visible = false; scene.fog.density = .006; scene.fog.color.setRGB(.75, .8, .88); hemi.intensity = 1.6; sunL.intensity = 2.4;
  skyMat.uniforms.uTop.value.setRGB(.2, .42, .78); skyMat.uniforms.uHor.value.setRGB(.8, .86, .94); skyMat.uniforms.uSunC.value.setRGB(1, .9, .7); arch.visible = false; wall.visible = false;
  for (const R of [...runners, greek]) { R.rotation.set(0, 0, 0); R.scale.setScalar(1); R.userData.mats[1].color.setHex(0x1a1c22); R.userData.mats[0].color.copy(R.userData.skin0); }
  for (const c of ['wall', 'fat', 'gels', 'steps', 'dist', 'london', 'record', 'legend', 'you', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];
  const pack = (tt, n, speed = 5.2, z0 = 0) => { road.visible = true; for (let i = 0; i < n; i++) { const R = runners[i]; R.visible = true; const lane = ((i * 37) % 9) / 9 * 7 - 3.5; const row = Math.floor(i / 3) * 1.8 + (i % 3) * .5; R.position.set(i ? lane : 0, 0, z0 - tt * speed + (i ? row - 1 + Math.sin(tt * .7 + i) * .3 : 0)); poseRun(R, tt + i * .13); } return runners[0].position.clone(); };

  if (t < TL.glyco) {
    // A–B · el pelotón llega al km 30… y el muro
    const P = pack(t, 12, 5.2, 0); arch.visible = true; arch.position.z = -24; const wk = smooth(TL.wall - .2, TL.wall + .4, t); wall.visible = wk > 0; wall.position.z = -27.5; wall.position.y = lerp(-4.2, 0, easeOut(wk));
    camera.position.copy(P).add(V3(3.5, 2.2, 7)); camera.lookAt(P.clone().add(V3(0, 1.6, -6))); camera.fov = 48;
    if (t > TL.wall) { const hit = smooth(TL.wall + .5, TL.wall + .9, t); hero.position.z = Math.max(hero.position.z, -27.0); }
    hud.push(() => { two(null, '¿POR QUÉ TANTOS CORREDORES', 'SE DERRUMBAN EN EL KM 30?', win(t, 0, TL.wall), 300); stamp('EL MURO', W / 2, 1520, smooth(TL.wall + .1, TL.wall + .4, t), -.06, '#ff6a4a', 100); });
  } else if (t < TL.gels) {
    // C · glucógeno → grasa → piernas de piedra
    const lt = t - TL.glyco; const stone = smooth(TL.stone, TL.stone + 1.2, t); const slow = smooth(TL.fat + .5, TL.stone + 1, t);
    road.visible = true; hero.visible = true; hero.position.set(0, 0, -lt * lerp(5.2, 2.2, slow)); poseRun(hero, t * lerp(1, .7, slow), { amp: lerp(1, .55, slow), lean: lerp(.12, .3, slow), sag: slow * .05 });
    hero.userData.mats[1].color.lerpColors(new THREE.Color(0x1a1c22), new THREE.Color(0x8a8a8a), stone); hero.userData.mats[0].color.lerpColors(hero.userData.skin0, new THREE.Color(0x9a9a9a), stone);
    const P = hero.position.clone(); camera.position.copy(P).add(V3(3.6, 1.7, -3.2)); camera.lookAt(P.clone().add(V3(0, .85, 0))); camera.fov = 45;
    if (stone > 0) for (let i = 0; i < 600 * stone; i++) { const s = PS.seed, q = i * 4; const u = fract(s[q] + t * .5); PS.push(P.x + (s[q + 1] - .5) * .6, P.y + u * .9, P.z + (s[q + 2] - .5) * .4, .4 * (1 - u), .4 * (1 - u), .4 * (1 - u)); }
    const km = Math.min(30, lerp(0, 30, smooth(TL.glyco + .5, TL.fat, t))); const g = 1 - km / 30;
    hud.push(() => { two(null, 'TUS MÚSCULOS GUARDAN', 'GLUCÓGENO', win(t, TL.glyco, TL.fat), 300); two(null, 'CUANDO SE ACABA,', 'EL CUERPO TIRA DE GRASA', win(t, TL.fat, TL.stone), 300); two(null, 'Y LAS PIERNAS SE VUELVEN', 'DE PIEDRA', smooth(TL.stone, TL.stone + .3, t), 300);
      const a = smooth(TL.glyco + .2, TL.glyco + .5, t) * (1 - smooth(TL.stone - .3, TL.stone, t)); txt('GLUCÓGENO', 170, 1450, 30, { font: 'Montserrat', weight: 800, alpha: a, align: 'left', fill: '#ffb070' }); fuel(170, 1480, 640, 90, g, a, g < .2 ? '#ff4a3a' : '#ffb070'); txt('KM ' + Math.round(km), 900, 1525, 48, { font: 'Montserrat', weight: 800, alpha: a });
      const fa = smooth(TL.fat + .3, TL.fat + .7, t) * (1 - smooth(TL.stone - .3, TL.stone, t)); txt('GRASA: ENERGÍA LENTA', 170, 1650, 30, { font: 'Montserrat', weight: 800, alpha: fa, align: 'left', fill: '#e8d070' }); fuel(170, 1680, 640, 60, .2 + .05 * Math.sin(t * 3), fa, '#e8d070'); });
  } else if (t < TL.steps) {
    // D · geles
    const lt = t - TL.gels; const P = pack(t, 6, 5.2, 0); camera.position.copy(P).add(V3(-2.6, 1.5, -3)); camera.lookAt(P.clone().add(V3(0, 1.1, 0))); camera.fov = 45;
    gels.forEach((gm, i) => { gm.visible = true; const a = i / 6 * 6.283 + t * 1.5; gm.position.copy(P).add(V3(Math.cos(a) * .7, 1.2 + Math.sin(a * 2) * .2, Math.sin(a) * .7)); gm.rotation.set(t * 2 + i, t * 3, 0); gm.scale.setScalar(easeOut(smooth(TL.gels + i * .1, TL.gels + .5 + i * .1, t)) * 2 + .001); });
    hud.push(() => { two(null, 'POR ESO VAN TOMANDO', 'GELES POR EL CAMINO', smooth(.05, .3, lt), 300); bigStat('UN GEL', '≈ 100 kcal', 1560, smooth(.6, 1, lt), .5); });
  } else if (t < TL.dist) {
    // E–F · 40.000 pasos, 3 veces tu peso, sudor
    const lt = t - TL.steps; road.visible = true; hero.visible = true; hero.position.set(0, 0, -t * 5.2); poseRun(hero, t); const P = hero.position.clone();
    if (t < TL.sweat) { camera.position.copy(P).add(V3(1.6, .35, .2)); camera.lookAt(P.clone().add(V3(0, .3, -.4))); camera.fov = 50; }
    else { camera.position.copy(P).add(V3(1.5, 1.6, -1.6)); camera.lookAt(P.clone().add(V3(0, 1.2, 0))); camera.fov = 45; }
    // ondas de impacto en cada pisada
    const per = 1 / (1.45 * 2); for (let k = 0; k < 2; k++) { const ph = fract((t * 1.45 + k * .5 + hero.userData.phase / 6.283)); const age = ph; const foot = hero.userData.legs[k]; const fp = V3(); foot.k.getWorldPosition(fp);
      const rr = .1 + age * 1.2; const f = (1 - age) * .9 * smooth(TL.impact, TL.impact + .3, t) * (t < TL.sweat ? 1 : 0); for (let i = 0; i < 80; i++) { const a = i / 80 * 6.283; PS.push(fp.x + Math.cos(a) * rr, .03, fp.z + Math.sin(a) * rr, f * 1.6, f * .9, f * .4); } }
    PS.mat.size = .05;
    if (t > TL.sweat) { for (let i = 0; i < 400; i++) { const s = DROP.seed, q = i * 4; const u = fract(s[q] + t * .9); const x = P.x + (s[q + 1] - .5) * .5, z = P.z + (s[q + 2] - .5) * .3 + u * 1.2; DROP.push(x, 1.5 - u * 1.4, z, .7, .85, 1); } DROP.mat.size = .04; }
    const steps = Math.round(lerp(0, 40000, easeInOut(smooth(TL.steps + .2, TL.impact, t))));
    hud.push(() => { const a = win(t, TL.steps, TL.sweat); txt('PASOS', W / 2, 262, 24, { spacing: 7, alpha: a * .8, fill: '#e3a372' }); txt(String(steps).replace(/\B(?=(\d{3})+(?!\d))/g, '.'), W / 2, 390, 140, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(220, 860, 390, .5) });
      const ia = win(t, TL.impact, TL.sweat); txt('EN CADA PISADA', W / 2, 1450, 30, { font: 'Montserrat', weight: 800, alpha: ia, fill: '#ffe2c0' }); txt('×3 TU PESO', W / 2, 1560, 110, { font: 'Montserrat', weight: 800, alpha: ia, fill: copperGrad(240, 840, 1560, .5) });
      two(null, 'PUEDES SUDAR', 'MÁS DE 1 LITRO POR HORA', smooth(TL.sweat, TL.sweat + .3, t), 300); });
  } else if (t < TL.record) {
    // G · 42,195: Londres 1908, meta frente al palco real
    const lt = t - TL.dist; stadium.visible = true; scene.fog.density = .002;
    const ang = lerp(-.6, .02, easeInOut(smooth(TL.london, TL.stay, t))); const rp = V3(Math.cos(ang) * 30 * 1.09, 0, Math.sin(ang) * 50 * 1.09); hero.visible = true; hero.position.copy(STD).add(rp); hero.rotation.y = -ang; hero.scale.setScalar(4); poseRun(hero, t);
    camera.position.copy(STD).add(V3(lerp(-8, 8, clamp(lt / 11)), 150, 85)); camera.lookAt(STD.clone().add(V3(4, 0, 4))); camera.fov = 48;
    for (let i = 0; i < 200; i++) { const a = lerp(-.6, .02, i / 200); const f = .9 * smooth(TL.london + .6, TL.london + 1.2, t); PS.push(STD.x + Math.cos(a) * 33, STD.y + .15, STD.z + Math.sin(a) * 55, f * 1.6, f * 1.1, f * .4); } PS.mat.size = 2.2;
    hud.push(() => { const a = win(t, TL.dist, TL.london); txt('¿POR QUÉ', W / 2, 260, 40, { font: 'Montserrat', weight: 800, alpha: a }); txt('42,195 km?', W / 2, 390, 130, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(200, 880, 390, .5) }); stamp('¿195 METROS?', W / 2, 1560, win(t, TL.dist + 2.6, TL.london), -.06, '#ff6a4a', 56);
      two('1908 · JUEGOS DE LONDRES', 'ALARGARON LA CARRERA', 'HASTA EL PALCO REAL', win(t, TL.london, TL.stay), 300); two(null, 'Y SE QUEDÓ ASÍ', 'PARA SIEMPRE', smooth(TL.stay, TL.stay + .3, t), 300);
      const pb = project(STD.clone().add(V3(39, 4, 0))); txt('PALCO REAL', pb.x - 40, pb.y - 60, 34, { font: 'Montserrat', weight: 800, alpha: smooth(TL.london + 1, TL.london + 1.4, t), fill: '#e8b830' }); });
  } else if (t < TL.legend) {
    // H · récord: 2:00:35, menos de 3 min/km
    const lt = t - TL.record; road.visible = true; hero.visible = true; hero.position.set(0, 0, -t * 5.9); poseRun(hero, t, { cad: 1.6, lean: .16 }); const P = hero.position.clone();
    camera.position.copy(P).add(V3(lerp(5, -5, clamp(lt / 7.7)), 1.5, lerp(-2, 4.5, clamp(lt / 7.7)))); camera.lookAt(P.clone().add(V3(0, 1, 0))); camera.fov = 45;
    for (let i = 0; i < 600; i++) { const s = PS.seed, q = i * 4; const u = fract(s[q] + t * 2); PS.push(P.x + (s[q + 1] - .5) * 6, .3 + s[q + 2] * 2.5, P.z + u * 14 - 2, .5, .55, .6); } PS.mat.size = .05;
    const clock = lerp(0, 7235, easeOut(smooth(TL.record + .3, TL.record + 2.6, t)));
    hud.push(() => { const a = smooth(.05, .3, lt); txt('RÉCORD MUNDIAL · KELVIN KIPTUM', W / 2, 250, 24, { spacing: 5, alpha: a * .85, fill: '#e3a372' }); txt(fmtT(clock), W / 2, 380, 140, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(180, 900, 380, .5) });
      const pa = smooth(TL.pace, TL.pace + .3, t); txt('2:51', W / 2, 1520, 130, { font: 'Montserrat', weight: 800, alpha: pa, fill: '#ffffff' }); txt('POR KILÓMETRO', W / 2, 1610, 34, { font: 'Montserrat', weight: 800, alpha: pa, spacing: 4, fill: '#ffb070' });
      txt('× 42 seguidos', W / 2, 1680, 36, { weight: 300, alpha: smooth(TL.pace + 1.6, TL.pace + 2, t) }); });
  } else if (t < TL.brand) {
    if (t < TL.you) {
      // I · la leyenda de Filípides
      const lt = t - TL.legend; greece.visible = true; greek.visible = true; skyMat.uniforms.uHor.value.setRGB(.95, .78, .55); skyMat.uniforms.uTop.value.setRGB(.35, .5, .75); scene.fog.color.setRGB(.9, .8, .65); scene.fog.density = .008;
      const fall = smooth(TL.you - 1.4, TL.you - .6, t); greek.position.copy(GRC).add(V3(0, 0, -lt * lerp(4.8, 1.4, fall))); poseRun(greek, t, { amp: 1 - fall * .8 }); greek.rotation.x = -fall * 1.45; greek.position.y += fall * .1;
      const P = greek.position.clone(); camera.position.copy(P).add(V3(4, 2, 3)); camera.lookAt(P.clone().add(V3(0, .8, -1))); camera.fov = 45;
      for (let i = 0; i < 300; i++) { const s = PS.seed, q = i * 4; const u = fract(s[q] + t * .8); const f = .25 * (1 - u); PS.push(P.x + (s[q + 1] - .5) * 1.2, .1 + u * .6, P.z + u * 2.5, f * 1.1, f, f * .8); } PS.mat.size = .25;
      hud.push(() => { two('490 a. C. · LA LEYENDA', 'DE MARATÓN A ATENAS', 'PARA ANUNCIAR LA VICTORIA', smooth(.05, .3, lt) * (1 - smooth(TL.you - 1.6, TL.you - 1.3, t)), 300); two(null, 'Y CAYÓ MUERTO', null, smooth(TL.you - 1.3, TL.you - 1, t), 300); });
    } else {
      // J · la medalla
      const lt = t - TL.you; medal.visible = true; medal.position.set(0, 2000, 0); medal.rotation.set(.1, Math.sin(t * .8) * .6, 0); scene.fog.density = 0; skyMat.uniforms.uTop.value.setRGB(.05, .06, .12); skyMat.uniforms.uHor.value.setRGB(.15, .12, .14); hemi.intensity = .8; sunL.intensity = 3;
      camera.position.set(0, 2000.9, 7.2); camera.lookAt(0, 2000.9, 0); camera.fov = 45; bloomS = .6;
      for (let i = 0; i < 500; i++) { const s = PS.seed, q = i * 4; const y = 2004 - fract(s[q] + t * .12) * 8; PS.push((s[q + 1] - .5) * 7, y, (s[q + 2] - .5) * 3 - 1, ...[[1.4, .5, .3], [.4, .7, 1.4], [1.4, 1.2, .4]][i % 3].map(c => c * .5)); } PS.mat.size = .06;
      hud.push(() => { two(null, 'SI HAS TERMINADO UNO,', 'YA LO HAS HECHO MEJOR QUE ÉL', smooth(.05, .3, lt), 300); });
    }
  } else {
    // K · marca
    const lt = t - TL.brand; const P = pack(t, 8, 4.5, 0); skyMat.uniforms.uTop.value.setRGB(.06, .06, .16); skyMat.uniforms.uHor.value.setRGB(.95, .45, .2); skyMat.uniforms.uSunC.value.setRGB(1.4, .6, .3); scene.fog.color.setRGB(.6, .32, .2); sunL.color.setRGB(1, .55, .3); hemi.intensity = .7;
    camera.position.copy(P).add(V3(-2.5, 1.2, 5)); camera.lookAt(P.clone().add(V3(0, 1.8, -12))); fade = Math.min(.4, lt * .4);
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  if (!(t >= TL.brand)) sunL.color.setRGB(1, .95, .86);
  sky.position.copy(camera.position); PS.end(); DROP.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (t < TL.brand) { const gr = g2.createLinearGradient(0, 0, 0, 620); gr.addColorStop(0, 'rgba(5,10,25,.55)'); gr.addColorStop(1, 'rgba(5,10,25,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, W, 620); }
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, bloom: bloomS, expo });
}
function renderCover() { renderFrame(TL.wall + .9); coverText('EL MURO', 'DEL KILÓMETRO 30', 'lo que le pasa a tu cuerpo en un maratón'); }
window.renderCover = () => { renderCover(); return true; };
window.OBJ = { PS, scene };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
