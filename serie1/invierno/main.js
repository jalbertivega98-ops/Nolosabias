// NO LO SABÍAS — "¿Por qué hace frío si estamos más cerca del Sol?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final.
// Perihelio (~3-4 ene): ~147,1 M km; afelio (~4 jul): ~152,1 M km → ~5 M km (≈3 %). Oblicuidad: 23,44°.
// Ángulo de incidencia: la misma luz se reparte en un área 1/sen(h) mayor. Madrid, solsticio de invierno: ~9 h 17 min de luz; de verano: ~15 h 3 min.
// Retraso estacional: el mínimo de temperatura llega ~3-5 semanas después del solsticio (inercia térmica del suelo y el mar).
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3,
  g2, camera, SOFT, Particles, txt, copperGrad, project, callout, bar, fract, arrowXY, bigStat, drawBrand, coverText, finish } from '../../lib/core.js';

const scene = new THREE.Scene(); scene.background = new THREE.Color(0x02040a);
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .6, ...o });
const hemi = new THREE.HemisphereLight(0x6fa0ff, 0x101820, .25); scene.add(hemi);
const sunLight = new THREE.PointLight(0xfff0d8, 3, 0, 0); scene.add(sunLight);
const keyL = new THREE.DirectionalLight(0xfff1dc, 0); scene.add(keyL); scene.add(keyL.target);
const stars = (() => { const n = 4000, p = new Float32Array(n * 3), c = new Float32Array(n * 3); const r = rng(12); for (let i = 0; i < n; i++) { const v = V3(r() - .5, r() - .5, r() - .5).normalize().multiplyScalar(3000); p.set([v.x, v.y, v.z], i * 3); const k = .25 + r() * .8; c.set([k, k, k * 1.1], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ size: 2, sizeAttenuation: false, vertexColors: true, map: SOFT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); })();
scene.add(stars);

// ==========================================================================
// TIERRA: textura dibujada (continentes aproximados en lon/lat)
// ==========================================================================
const LANDS = [
  [[-168, 65], [-150, 72], [-100, 72], [-80, 65], [-62, 58], [-55, 48], [-70, 42], [-76, 35], [-80, 26], [-90, 30], [-97, 26], [-97, 18], [-90, 15], [-80, 8], [-92, 15], [-107, 23], [-117, 32], [-124, 40], [-125, 49], [-135, 58], [-150, 60], [-165, 55]],
  [[-80, 8], [-60, 10], [-35, -6], [-40, -22], [-55, -35], [-68, -55], [-75, -45], [-71, -18], [-81, -5]],
  [[-50, 60], [-20, 70], [-25, 82], [-60, 82], [-73, 77]],
  [[-10, 36], [-9, 43], [-1, 46], [-5, 48], [2, 51], [8, 54], [5, 58], [10, 63], [20, 70], [40, 68], [60, 70], [80, 73], [110, 76], [140, 72], [170, 70], [180, 66], [160, 60], [140, 55], [135, 45], [122, 40], [122, 30], [110, 20], [106, 10], [100, 13], [100, 2], [95, 15], [90, 22], [80, 15], [77, 8], [72, 20], [60, 25], [57, 20], [52, 15], [45, 13], [35, 30], [28, 37], [22, 37], [15, 40], [12, 44], [8, 44], [3, 43], [3, 39], [-2, 37], [-6, 36]],
  [[-17, 15], [-17, 21], [-10, 30], [-6, 36], [10, 37], [20, 32], [32, 31], [35, 28], [43, 12], [51, 11], [40, -3], [40, -15], [35, -25], [20, -35], [17, -28], [12, -17], [13, -5], [8, 4], [-8, 5], [-13, 8]],
  [[114, -22], [122, -18], [130, -12], [137, -12], [142, -11], [146, -19], [153, -26], [150, -37], [140, -38], [132, -32], [115, -34]],
  [[-5, 50], [1, 51], [-3, 56], [-6, 58], [-5, 54]], [[130, 31], [140, 35], [142, 42], [136, 36]], [[44, -14], [50, -16], [47, -25], [43, -22]]];
const earthTex = (() => { const c = document.createElement('canvas'); c.width = 2048; c.height = 1024; const x = c.getContext('2d'); const X = lo => (lo + 180) / 360 * 2048, Y = la => (90 - la) / 180 * 1024;
  const gr = x.createLinearGradient(0, 0, 0, 1024); gr.addColorStop(0, '#1a4f80'); gr.addColorStop(.5, '#2a78b8'); gr.addColorStop(1, '#1a4f80'); x.fillStyle = gr; x.fillRect(0, 0, 2048, 1024);
  for (const P of LANDS) { x.beginPath(); P.forEach(([lo, la], i) => i ? x.lineTo(X(lo), Y(la)) : x.moveTo(X(lo), Y(la))); x.closePath(); const g = x.createLinearGradient(0, 0, 0, 1024); g.addColorStop(0, '#e8edf0'); g.addColorStop(.18, '#7a9a50'); g.addColorStop(.38, '#b8a060'); g.addColorStop(.5, '#5a9a40'); g.addColorStop(.62, '#c8a468'); g.addColorStop(.85, '#8a9a58'); g.addColorStop(1, '#d8dde0'); x.fillStyle = g; x.fill(); }
  x.fillStyle = '#e8eef2'; x.fillRect(0, Y(-68), 2048, 1024); x.globalAlpha = .9; x.fillRect(0, 0, 2048, Y(80));
  const r = rng(3); x.globalAlpha = .06; for (let i = 0; i < 4000; i++) { x.fillStyle = r() < .5 ? '#000' : '#fff'; x.fillRect(r() * 2048, r() * 1024, 3 + r() * 8, 2 + r() * 5); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; })();
// posición sobre la esfera según la UV de SphereGeometry
const geoPos = (lon, lat, r = 1) => { const u = (lon + 180) / 360, v = (90 - lat) / 180; return V3(-r * Math.cos(u * 2 * Math.PI) * Math.sin(v * Math.PI), r * Math.cos(v * Math.PI), r * Math.sin(u * 2 * Math.PI) * Math.sin(v * Math.PI)); };
const TILT = 23.44 * Math.PI / 180;
function makeEarth(R) { const g = new THREE.Group(); const tilt = new THREE.Group(); g.add(tilt); const spin = new THREE.Group(); tilt.add(spin);
  const e = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), new THREE.MeshStandardMaterial({ map: earthTex, roughness: .8, emissiveMap: earthTex, emissive: new THREE.Color(.12, .14, .2) })); spin.add(e);
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.04, 64, 48), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
    vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `varying vec3 vN; varying vec3 vV; void main(){ float f=pow(1.-abs(dot(vN,vV)),3.); gl_FragColor=vec4(vec3(.3,.6,1.)*f*1.2,f); }` })); g.add(atmo);
  const axis = new THREE.Mesh(new THREE.CylinderGeometry(R * .015, R * .015, R * 3, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.1, .8, .55) })); tilt.add(axis);
  g.userData = { tilt, spin, axis, R }; scene.add(g); return g; }
const earth = makeEarth(1); // grande (primeros planos)
const earthO = makeEarth(1); // en órbita
// Sol
const sun = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.1, 1.1) })); scene.add(sun);
const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: SOFT, color: new THREE.Color(1.6, .9, .4), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); scene.add(sunGlow);
// órbita (elipse exagerada)
const ORB = { a: 30, e: .25 }; const orbPos = th => { const r = ORB.a * (1 - ORB.e * ORB.e) / (1 + ORB.e * Math.cos(th)); return V3(r * Math.cos(th), 0, -r * Math.sin(th)); };
const orbit = (() => { const pts = []; for (let i = 0; i <= 256; i++) pts.push(orbPos(i / 256 * Math.PI * 2)); return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: new THREE.Color(1.2, 1.4, 1.8), transparent: true, opacity: .8 })); })(); scene.add(orbit);

// ==========================================================================
// SUELO + RAYOS (incidencia) y LINTERNA (mesa)
// ==========================================================================
const GRD = V3(0, -500, 0); const ground = new THREE.Group(); ground.position.copy(GRD); scene.add(ground);
{ const pl = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), M(0x6a8a4a, { roughness: .95 })); pl.rotation.x = -Math.PI / 2; ground.add(pl); }
const patch = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 1.5, .7), transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false })); patch.rotation.x = -Math.PI / 2; patch.position.y = .02; ground.add(patch);
const TBL = V3(0, -900, 0); const table = new THREE.Group(); table.position.copy(TBL); scene.add(table);
{ const top = new THREE.Mesh(new THREE.BoxGeometry(14, .3, 10), M(0x6a4a30, { roughness: .7 })); top.position.y = -.15; top.receiveShadow = true; table.add(top);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), M(0x202630, { roughness: .9 })); wall.position.set(0, 8, -6); table.add(wall); }
const torch = new THREE.Group(); table.add(torch);
{ const body = new THREE.Mesh(new THREE.CylinderGeometry(.28, .28, 2.2, 32), M(0x9a9ea8, { metalness: .5, roughness: .35 })); body.position.y = 1.1; torch.add(body);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(.5, .3, .6, 32), M(0xc8743f, { metalness: .5, roughness: .3 })); head.position.y = -.25; torch.add(head);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(.46, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.6, 2) })); lens.rotation.x = Math.PI / 2; lens.position.y = -.56; torch.add(lens); }
const spot = new THREE.SpotLight(0xfff0d0, 400, 0, .32, .25, 2); torch.add(spot); spot.position.set(0, -.6, 0); const spotT = new THREE.Object3D(); spotT.position.set(0, -10, 0); torch.add(spotT); spot.target = spotT;
// playa (Australia)
const BEACH = V3(0, -1300, 0); const beach = new THREE.Group(); beach.position.copy(BEACH); scene.add(beach);
{ const sand = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), M(0xe8d2a0, { roughness: 1 })); sand.rotation.x = -Math.PI / 2; sand.position.z = 5; beach.add(sand);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(200, 80), M(0x1a7fa8, { roughness: .2, metalness: .1 })); sea.rotation.x = -Math.PI / 2; sea.position.set(0, -.05, -45); beach.add(sea);
  const tree = new THREE.Group(); for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(1.5 - i * .3, 1.6, 20), M(0x2f6a35)); c.position.y = 1.4 + i * .9; tree.add(c); }
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, 1, 10), M(0x6a4a30)); trunk.position.y = .5; tree.add(trunk); const star = new THREE.Mesh(new THREE.OctahedronGeometry(.3), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.2, .6) })); star.position.y = 4.9; tree.add(star);
  const r = rng(4); for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.14, 12, 8), M([0xd03030, 0xe8b830, 0x3a7fd0][i % 3], { roughness: .3, metalness: .4 })); const h = .3 + r() * 3; const a = r() * 6.28; b.position.set(Math.cos(a) * (1.4 - h * .3), 1.3 + h, Math.sin(a) * (1.4 - h * .3)); tree.add(b); }
  tree.position.set(-2.5, 0, 2); beach.add(tree);
  const umb = new THREE.Group(); const pole = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 3.2, 8), M(0xeeeeee)); pole.position.y = 1.6; umb.add(pole); const can = new THREE.Mesh(new THREE.ConeGeometry(2, .7, 16), M(0xd04a3a, { side: THREE.DoubleSide })); can.position.y = 3.3; umb.add(can); umb.position.set(3, 0, 0); umb.rotation.z = .12; beach.add(umb);
  const towel = new THREE.Mesh(new THREE.BoxGeometry(1.2, .03, 2.4), M(0x3a8ad0)); towel.position.set(2.2, .02, 2.5); towel.rotation.y = .3; beach.add(towel); }

const ALL = [earth, earthO, sun, sunGlow, orbit, ground, table, beach, stars];
const PS = new Particles(20000, { size: .1, seed: 5 }); scene.add(PS.obj);

// ==========================================================================
// HUD
// ==========================================================================
function stamp(s, x, y, a, rot = -.08, col = '#ff6a4a', size = 76) { if (a <= .01) return; const sc = lerp(1.6, 1, easeOut(clamp(a * 1.4)));
  g2.save(); g2.translate(x, y); g2.rotate(rot); g2.scale(sc, sc); g2.globalAlpha = clamp(a); g2.strokeStyle = col; g2.lineWidth = 8; g2.shadowColor = col; g2.shadowBlur = 25;
  g2.font = `800 ${size}px Montserrat`; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.letterSpacing = '6px'; const w = g2.measureText(s).width + 70; g2.strokeRect(-w / 2, -size * .8, w, size * 1.6); g2.fillStyle = col; g2.fillText(s, 0, 4); g2.restore(); }
function two(top, l1, l2, a, y = 300) { if (a <= .01) return; txt(l1, W / 2, y, 50, { font: 'Montserrat', weight: 800, alpha: a }); if (l2) txt(l2, W / 2, y + 62, 50, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(160, 920, y + 62, .5) }); if (top) txt(top, W / 2, y - 62, 24, { spacing: 7, alpha: a * .8, fill: '#e3a372' }); }
function label(w, s, sub, a, col = '#ffe2c0', size = 40, dy = 0) { if (a <= .01) return; const p = project(w); txt(s, p.x, p.y + dy, size, { font: 'Montserrat', weight: 800, alpha: a, fill: col }); if (sub) txt(sub, p.x, p.y + dy + size * .95, 28, { alpha: a * .85 }); }
// esfera de 24 h: arco de luz
function dayDial(cx, cy, R, hours, a, title, col = '#ffb070') { if (a <= .01) return; g2.save(); g2.globalAlpha = clamp(a); g2.lineCap = 'round';
  g2.strokeStyle = 'rgba(120,140,190,.35)'; g2.lineWidth = 26; g2.beginPath(); g2.arc(cx, cy, R, 0, 7); g2.stroke();
  const a0 = -Math.PI / 2 - hours / 24 * Math.PI; g2.strokeStyle = col; g2.shadowColor = col; g2.shadowBlur = 25; g2.beginPath(); g2.arc(cx, cy, R, a0, a0 + hours / 24 * 2 * Math.PI); g2.stroke(); g2.restore();
  txt(hours.toFixed(0) + ' h', cx, cy + 10, 76, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(cx - 120, cx + 120, cy, .5) }); txt('de luz', cx, cy + 70, 30, { weight: 300, alpha: a }); txt(title, cx, cy - R - 50, 30, { font: 'Montserrat', weight: 800, alpha: a, spacing: 4, fill: '#ffe2c0' }); }
const win = (t, a, b, f = .3) => smooth(a, a + f, t) * (1 - smooth(b - f, b, t));
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
function setSunAt(p) { sun.position.copy(p); sunGlow.position.copy(p); sunLight.position.copy(p); }
function placeEarth(E, pos, R, spinA, northAway = true) { E.visible = true; E.position.copy(pos); E.scale.setScalar(R); E.userData.tilt.rotation.set(0, 0, 0); E.userData.tilt.rotation.z = TILT; E.userData.spin.rotation.y = spinA; E.rotation.y = northAway ? 0 : Math.PI; }
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .05; camera.far = 8000; camera.fov = 42;
  let bloomS = .6, flash = 0, ca = .0012, fade = 0, expo = 1;
  PS.begin(); PS.mat.size = .1; for (const o of ALL) o.visible = false; stars.visible = true; sunLight.intensity = 0; keyL.intensity = 0; hemi.intensity = .25; spot.intensity = 0; scene.background.setRGB(.008, .016, .04);
  for (const o of [earth, earthO]) o.userData.axis.visible = false;
  for (const c of ['why', 'dist', 'tilt', 'rays', 'torch', 'short', 'aus', 'lag', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];

  if (t < TL.tilt) {
    // A–C · la órbita: en enero, más cerca
    setSunAt(V3(ORB.a * ORB.e, 0, 0).multiplyScalar(0)); sun.visible = true; sunGlow.visible = true; sun.scale.setScalar(3.2); sunGlow.scale.setScalar(26); sunLight.intensity = 3; orbit.visible = true;
    const th = t < TL.dist ? lerp(-.5, 0, smooth(0, TL.dist, t)) : t < TL.nothing ? lerp(0, Math.PI, easeInOut(smooth(TL.dist + .6, TL.nothing - .3, t))) : Math.PI + (t - TL.nothing) * .05;
    const ep = orbPos(th); placeEarth(earthO, ep, 2.6, t * 1.5); keyL.intensity = 3.4; keyL.position.set(0, 0, 0); keyL.target.position.copy(ep); hemi.intensity = .35;
    const coldK = win(t, TL.why, TL.dist); if (coldK > 0) for (let i = 0; i < 1200; i++) { const s = PS.seed, q = i * 4; const y = fract(s[q] - t * .15) * 8 - 4; PS.push(ep.x + (s[q + 1] - .5) * 8, ep.y + y, ep.z + (s[q + 2] - .5) * 8 + 2, coldK * .7, coldK * .8, coldK); }
    PS.mat.size = .12;
    const camT = t < TL.why ? ep.clone().lerp(V3(0, 0, 0), .45) : t < TL.dist ? ep.clone() : V3(-4, 0, 0);
    if (t < TL.why) { camera.position.set(ep.x * .5 + 2, 26, ep.z * .5 + 42); camera.lookAt(camT); }
    else if (t < TL.dist) { camera.position.copy(ep).add(V3(-2, 2, 9)); camera.lookAt(ep); }
    else { camera.up.set(-1, 0, 0); camera.position.set(-13, lerp(128, 134, smooth(TL.dist, TL.tilt, t)), 8); camera.lookAt(-13, 0, 0); }
    camera.fov = 42;
    const near = orbPos(0), far = orbPos(Math.PI);
    hud.push(() => { two(null, 'EN INVIERNO, LA TIERRA ESTÁ', 'MÁS CERCA DEL SOL', win(t, 0, TL.why), 300); two(null, 'ENTONCES…', '¿POR QUÉ HACE FRÍO?', win(t, TL.why, TL.dist), 300);
      if (t < TL.why) label(ep, 'ENERO', null, smooth(.6, 1, t), '#7fd4ff', 40, 90);
      const a1 = smooth(TL.dist + .2, TL.dist + .6, t); label(near, 'ENERO', '147 M km', a1, '#7fd4ff', 40, 80); label(far, 'JULIO', '152 M km', smooth(TL.nothing - .6, TL.nothing - .2, t), '#ffb070', 40, 80);
      two(null, 'UNOS 5 MILLONES DE KM', 'MÁS CERCA EN ENERO', win(t, TL.dist, TL.nothing), 300); two(null, 'PERO ESO', 'APENAS CAMBIA NADA', smooth(TL.nothing, TL.nothing + .3, t), 300);
      stamp('≈ 3 %', W / 2, 1600, smooth(TL.nothing + .5, TL.nothing + .8, t), -.06, '#ffb070', 80); });
  } else if (t < TL.rays) {
    // D–E · la inclinación: 23,5°
    keyL.intensity = 3.2; keyL.position.set(-8, 1, 7); keyL.target.position.set(0, 0, 0); hemi.intensity = .25;
    const lt = t - TL.tilt; placeEarth(earth, V3(0, 0, 0), 1, lt * .6); earth.userData.axis.visible = true; const tk = easeInOut(smooth(TL.tilt + .4, TL.tilt + 1.6, t)); earth.userData.tilt.rotation.z = lerp(0, TILT, tk);
    const away = smooth(TL.away, TL.away + 1.2, t); camera.position.set(lerp(0, 1.6, away), lerp(.2, .6, away), lerp(7.2, 6.8, away)); camera.lookAt(0, -.15, 0); camera.fov = 40;
    if (away > 0) { for (let i = 0; i < 2500 * away; i++) { const s = PS.seed, q = i * 4; const u = fract(s[q] + t * .6); const y = (s[q + 1] - .5) * 2.4, z = (s[q + 2] - .5) * 2.4; if (y * y + z * z > 1.4) continue; const x = lerp(-6, -Math.sqrt(Math.max(0, 1 - y * y - z * z)), u); const f = .35 * smooth(0, .1, u); PS.push(x, y, z, f * 1.5, f * 1.1, f * .5); } PS.mat.size = .03; }
    const madrid = geoPos(-3.7, 40.4, 1.01);
    hud.push(() => { two(null, 'LO QUE MANDA ES', 'LA INCLINACIÓN', win(t, TL.tilt, TL.away), 300); const p0 = project(V3(0, 0, 0)), pt = project(V3(-Math.sin(TILT * tk) * 1.6, Math.cos(TILT * tk) * 1.6, 0)), pu = project(V3(0, 1.6, 0));
      if (tk > .05 && t < TL.away) { g2.save(); g2.globalAlpha = smooth(TL.tilt + 1.4, TL.tilt + 1.8, t); g2.setLineDash([10, 10]); g2.strokeStyle = '#ffffff'; g2.lineWidth = 3; g2.beginPath(); g2.moveTo(p0.x, p0.y); g2.lineTo(pu.x, pu.y); g2.stroke(); g2.restore();
        txt('23,5°', W / 2 + 230, 640, 64, { font: 'Montserrat', weight: 800, alpha: smooth(TL.tilt + 1.6, TL.tilt + 2, t), fill: copperGrad(400, 700, pu.y, .5) }); }
      two(null, 'EN INVIERNO, NUESTRO', 'HEMISFERIO MIRA HACIA FUERA', smooth(TL.away, TL.away + .3, t), 300); txt('SOL', 120, 1000, 34, { font: 'Montserrat', weight: 800, alpha: smooth(TL.away + .6, TL.away + 1, t), fill: '#ffb070', align: 'left' }); arrowXY(110, 1060, 330, 1060, smooth(TL.away + .6, TL.away + 1, t), '#ffb070');
      const wp = madrid.clone(); earth.userData.spin.localToWorld(wp); label(wp, '• ESPAÑA', null, smooth(TL.away + 1, TL.away + 1.4, t), '#7fd4ff', 34, -10); });
  } else if (t < TL.torch) {
    // E2 · rayos tumbados: la misma luz en más suelo
    const lt = t - TL.rays; keyL.intensity = 1.5; keyL.position.copy(GRD).add(V3(-10, 12, 5)); keyL.target.position.copy(GRD); ground.visible = true; hemi.intensity = .9; scene.background.setRGB(.05, .07, .12);
    const k = easeInOut(smooth(TL.rays + .6, TL.rays + 2.2, t)); const elev = lerp(Math.PI / 2 - .05, .45, k); const dir = V3(Math.cos(elev), -Math.sin(elev), 0); const Rb = 1.6;
    patch.scale.set(Rb / Math.sin(elev), Rb, 1); patch.material.opacity = .85 * Math.pow(Math.sin(elev), .8);
    camera.position.copy(GRD).add(V3(2, 9, 14)); camera.lookAt(GRD.clone().add(V3(0, 2, 0))); camera.fov = 45;
    for (let i = 0; i < 5000; i++) { const s = PS.seed, q = i * 4; const ang = Math.floor(s[q] * 14) / 14 * 6.283, rr = Rb * (Math.floor(s[q + 1] * 3) + 1) / 3; const a = Math.cos(ang) * rr, b = Math.sin(ang) * rr; const u = fract(s[q + 2] + t * .7);
      const g = V3(a / Math.sin(elev), 0, b); const p = g.sub(dir.clone().multiplyScalar((1 - u) * 14)); const f = .45 * smooth(0, .1, u); PS.push(GRD.x + p.x, GRD.y + p.y + .05, GRD.z + p.z, f * 1.6, f * 1.25, f * .55); } PS.mat.size = .14;
    hud.push(() => { two(null, 'LOS RAYOS LLEGAN TUMBADOS', null, win(t, TL.rays, TL.rays + 2.4), 300); two(null, 'LA MISMA LUZ SE REPARTE', 'EN MUCHO MÁS SUELO', smooth(TL.rays + 2.4, TL.rays + 2.7, t), 300);
      bar(140, 1640, 800, lerp(1, Math.sin(.45), k), 'CALOR POR METRO²', Math.round(lerp(100, Math.sin(.45) * 100, k)) + ' %', smooth(TL.rays + .4, TL.rays + .8, t), '#ffb070'); });
  } else if (t < TL.short) {
    // F · la linterna
    const lt = t - TL.torch; table.visible = true; hemi.intensity = 1.3; keyL.intensity = 2.4; keyL.position.copy(TBL).add(V3(-4, 10, 8)); keyL.target.position.copy(TBL); scene.background.setRGB(.02, .025, .035); spot.intensity = 300; bloomS = .7;
    const k = easeInOut(smooth(TL.tilted - .2, TL.tilted + .8, t)); torch.position.set(lerp(0, -2.6, k), lerp(3.0, 2.2, k), 0); torch.rotation.set(0, 0, lerp(0, .95, k));
    camera.position.copy(TBL).add(V3(0, 8, 11)); camera.lookAt(TBL.clone().add(V3(0, 1.3, 0))); camera.fov = 45;
    hud.push(() => { two(null, 'HAZ LA PRUEBA', 'CON UNA LINTERNA', win(t, TL.torch, TL.front), 300); two('DE FRENTE', 'UN CÍRCULO', 'BRILLANTE', win(t, TL.front, TL.tilted), 300); two('INCLINADA', 'UNA MANCHA', 'LARGA Y FLOJA', smooth(TL.tilted, TL.tilted + .3, t), 300);
      txt('VERANO', W / 2, 1600, 54, { font: 'Montserrat', weight: 800, alpha: win(t, TL.front + .3, TL.tilted), fill: '#ffb070' }); txt('INVIERNO', W / 2, 1600, 54, { font: 'Montserrat', weight: 800, alpha: smooth(TL.tilted + .8, TL.tilted + 1.1, t), fill: '#7fd4ff' }); });
  } else if (t < TL.aus) {
    // G · días más cortos: 9 h frente a 15 h
    keyL.intensity = 3; keyL.position.set(-6, 3, 7); keyL.target.position.set(0, 0, 0); hemi.intensity = .2; const lt = t - TL.short;
    placeEarth(earth, V3(0, 0, 0), 1, -1.2 + lt * .5); camera.position.set(.8, 1.6, 3.6); camera.lookAt(0, .35, 0); camera.fov = 40; expo = .8;
    hud.push(() => { two(null, 'ADEMÁS, EL DÍA', 'ES MÁS CORTO', win(t, TL.short, TL.madrid), 300); const a1 = smooth(TL.madrid, TL.madrid + .3, t), a2 = smooth(TL.june, TL.june + .3, t);
      txt('MADRID', W / 2, 250, 26, { spacing: 7, alpha: a1 * .85, fill: '#e3a372' }); dayDial(a2 > 0 ? lerp(W / 2, 290, easeInOut(a2)) : W / 2, 1300, 170, 9.3, a1, '21 DICIEMBRE', '#7fd4ff'); dayDial(790, 1300, 170, 15.05, a2, '21 JUNIO', '#ffb070');
      two(null, 'MENOS HORAS, Y CADA RAYO', 'CALIENTA MENOS', smooth(TL.less, TL.less + .3, t), 360); });
  } else if (t < TL.lag) {
    // H · Australia: Navidad en la playa
    const lt = t - TL.aus; beach.visible = true; keyL.intensity = 3.2; keyL.position.copy(BEACH).add(V3(4, 20, 10)); keyL.target.position.copy(BEACH); hemi.intensity = 1.2; scene.background.setRGB(.35, .62, .9); stars.visible = false;
    camera.position.copy(BEACH).add(V3(lerp(-.5, .8, clamp(lt / 3.7)), 3.2, 16)); camera.lookAt(BEACH.clone().add(V3(.3, 2.4, 0))); camera.fov = 45;
    hud.push(() => { two(null, 'MIENTRAS TANTO, EN AUSTRALIA', 'ES VERANO', smooth(.05, .3, lt), 300); stamp('NAVIDAD EN LA PLAYA', W / 2, 1600, smooth(TL.aus + 1.6, TL.aus + 1.9, t), -.06, '#ff6a4a', 56); });
  } else if (t < TL.brand) {
    // I · el día más frío no es el más corto: retraso estacional
    const lt = t - TL.lag; scene.background.setRGB(.03, .05, .09); for (let i = 0; i < 1500; i++) { const s = PS.seed, q = i * 4; PS.push((s[q + 1] - .5) * 30, fract(s[q] - t * .05) * 30 - 15, -10 + s[q + 2] * 8, .5, .55, .65); } PS.mat.size = .12;
    camera.position.set(0, 0, 10); camera.lookAt(0, 0, 0); camera.fov = 50;
    hud.push(() => { two(null, 'Y LO MÁS CURIOSO:', 'EL DÍA MÁS FRÍO NO ES EL MÁS CORTO', win(t, TL.lag, TL.weeks), 300); two(null, 'EL SUELO Y EL MAR TARDAN', 'SEMANAS EN ENFRIARSE', smooth(TL.weeks, TL.weeks + .3, t), 300);
      const x0 = 110, x1 = 970, yC = 1000, A = 230; const ca = smooth(TL.lag + .3, TL.lag + .7, t); const months = ['SEP', 'OCT', 'NOV', 'DIC', 'ENE', 'FEB', 'MAR']; const X = m => lerp(x0, x1, m / 6);
      g2.save(); g2.globalAlpha = ca * .5; g2.strokeStyle = '#fff'; g2.lineWidth = 2; g2.beginPath(); g2.moveTo(x0, yC + A + 40); g2.lineTo(x1, yC + A + 40); g2.stroke(); g2.restore(); months.forEach((m, i) => txt(m, X(i), yC + A + 80, 24, { alpha: ca * .7, spacing: 3 }));
      const curve = (shift, col, prog) => { g2.save(); g2.strokeStyle = col; g2.shadowColor = col; g2.shadowBlur = 18; g2.lineWidth = 7; g2.lineCap = 'round'; g2.beginPath(); for (let i = 0; i <= 200 * prog; i++) { const m = i / 200 * 6; const y = yC - Math.cos((m - 3.67 - shift) / 6 * Math.PI) * A * .9 * -1; i ? g2.lineTo(X(m), y) : g2.moveTo(X(m), y); } g2.stroke(); g2.restore(); };
      const p1 = smooth(TL.lag + .5, TL.lag + 1.8, t), p2 = smooth(TL.lag + 1.8, TL.weeks, t); curve(0, '#ffb070', p1); curve(.8, '#7fd4ff', p2);
      txt('HORAS DE SOL', 150, yC - A - 30, 28, { font: 'Montserrat', weight: 800, align: 'left', alpha: smooth(TL.lag + .8, TL.lag + 1.2, t), fill: '#ffb070' }); txt('TEMPERATURA', 150, yC - A + 10, 28, { font: 'Montserrat', weight: 800, align: 'left', alpha: smooth(TL.lag + 2.2, TL.lag + 2.6, t), fill: '#7fd4ff' });
      const a3 = smooth(TL.weeks + .6, TL.weeks + 1, t); if (a3 > 0) { const xa = X(3.67), xb = X(4.47), y = yC + A * .9 + 10; g2.save(); g2.globalAlpha = a3; g2.strokeStyle = '#ffe2c0'; g2.setLineDash([8, 8]); g2.lineWidth = 3; g2.beginPath(); g2.moveTo(xa, yC - A); g2.lineTo(xa, y + 20); g2.moveTo(xb, yC - A); g2.lineTo(xb, y + 20); g2.stroke(); g2.restore();
        txt('21 DIC', xa, yC - A - 30, 24, { alpha: a3, fill: '#ffb070', font: 'Montserrat', weight: 800 }); txt('ENERO', xb + 20, yC - A - 30, 24, { alpha: a3, fill: '#7fd4ff', font: 'Montserrat', weight: 800 }); }
      stamp('EL FRÍO LLEGA EN ENERO', W / 2, 1620, smooth(TL.weeks + 2.6, TL.weeks + 2.9, t), -.05, '#7fd4ff', 50); });
  } else {
    // J · marca
    const lt = t - TL.brand; keyL.intensity = 3; keyL.position.set(-3, 2, 7); keyL.target.position.set(0, 0, 0); placeEarth(earth, V3(0, -1.5, 0), 1, lt * .2); earth.userData.tilt.rotation.z = TILT;
    camera.position.set(2.6, .3, 5.2); camera.lookAt(0, -.3, 0); camera.fov = 45; expo = .85; fade = Math.min(.45, lt * .4);
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  stars.position.copy(camera.position); PS.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, bloom: bloomS, expo });
}
function renderCover() { renderFrame(TL.away + 1.8); coverText('¿POR QUÉ HACE FRÍO', 'EN INVIERNO?', 'si la Tierra está más cerca del Sol'); }
window.renderCover = () => { renderCover(); return true; };
window.OBJ = { PS, scene };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
