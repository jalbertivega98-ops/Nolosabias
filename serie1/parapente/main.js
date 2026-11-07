// NO LO SABÍAS — "¿Cómo vuela un parapente?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final. Unidades: metros.
// Referencia: parapente de escuela (EN-A): ~4–5 kg, ~25 m² de superficie, ~11 m de envergadura, ~40 celdas abiertas por delante,
// cientos de metros de cordino de ~1 mm (ensayo de carga EN 926-1 a 8 g), carga alar ≈ 100 kg / 25 m² ≈ 4 kg/m²,
// tasa de caída mínima ≈ 1 m/s, fineza ≈ 9, velocidad ≈ 38 km/h; térmicas de 1–5 m/s coronadas por cúmulos.
// Ewa Wiśnierska (14/02/2007, Australia): absorbida por un cumulonimbo hasta 9.946 m, ≈ −50 °C; perdió el conocimiento y sobrevivió.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3,
  renderer, g2, camera, SOFT, skyDome, SUN_DIR, Particles, txt, copperGrad, project, fmt, callout, titleHUD, fract, camOrbit, arrowXY, bigStat, drawBrand, coverText, finish } from '../../lib/core.js';

const scene = new THREE.Scene(); scene.add(skyDome); skyDome.renderOrder = -1;
scene.fog = new THREE.FogExp2(new THREE.Color(.62, .55, .52), .00011);
const hemi = new THREE.HemisphereLight(0xbfd4ff, 0x3a3020, .9); scene.add(hemi);
const sunL = new THREE.DirectionalLight(0xffd2a0, 2.6); scene.add(sunL); scene.add(sunL.target);
const fillL = new THREE.DirectionalLight(0xbfd0ff, .6); scene.add(fillL); scene.add(fillL.target);
function lightAt(p) { sunL.position.copy(p).addScaledVector(SUN_DIR.clone().normalize(), 300); sunL.target.position.copy(p); sunL.target.updateMatrixWorld();
  fillL.position.copy(camera.position).add(V3(0, 50, 0)); fillL.target.position.copy(p); fillL.target.updateMatrixWorld(); }
const xrayMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  uniforms: { uCol: { value: new THREE.Color(.3, .7, 1.15) } },
  vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform vec3 uCol; varying vec3 vN; varying vec3 vV; void main(){ float f=pow(clamp(1.-abs(dot(vN,vV)),0.,1.),2.); gl_FragColor=vec4(uCol*(f*.8+.05),f*.7+.05); }` });

// ==========================================================================
// TERRENO: sierra al oeste (−x), valle al este (+x). Despegue en (0, H, 0).
// ==========================================================================
function hash(x, z) { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, z) { const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi; const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  return lerp(lerp(hash(xi, zi), hash(xi + 1, zi), u), lerp(hash(xi, zi + 1), hash(xi + 1, zi + 1), u), v); }
function Ht(x, z) { const ridge = 1 / (1 + Math.exp((x + 150) / 650)); let h = 230 + 1500 * ridge;
  h += (vnoise(x / 700, z / 700) - .5) * 520 * (.3 + ridge) + (vnoise(x / 180, z / 180) - .5) * 110 * (.25 + ridge) + (vnoise(x / 45, z / 45) - .5) * 14;
  return padH(x, z, h); }
let PAD0 = null; function padH(x, z, h) { if (PAD0 === null) return h; const r = Math.hypot(x, z); const k = smooth(70, 30, r); return lerp(h, PAD0 - x * .12, k); }
PAD0 = Ht(0, 0);
const terrain = (() => { const S = 16000, N = 280; const g = new THREE.PlaneGeometry(S, S, N, N); g.rotateX(-Math.PI / 2); const p = g.attributes.position; const col = [];
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); const h = Ht(x, z) - (Math.hypot(x, z) < 110 ? 6 : 0); p.setY(i, h); }
  g.computeVertexNormals(); const n = g.attributes.normal;
  for (let i = 0; i < p.count; i++) { const h = p.getY(i), sl = 1 - n.getY(i); const r = hash(p.getX(i) * .01, p.getZ(i) * .01);
    let c = new THREE.Color().setRGB(.16 + r * .05, .24 + r * .06, .09); c.lerp(new THREE.Color(.36, .31, .24), smooth(.12, .35, sl)); c.lerp(new THREE.Color(.42, .4, .38), smooth(1300, 1700, h) * .7); c.lerp(new THREE.Color(.85, .87, .9), smooth(1750, 1950, h) * smooth(.4, .1, sl));
    col.push(c.r, c.g, c.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95 })); scene.add(m); return m; })();
const padMesh = (() => { const S = 280, N = 140; const g = new THREE.PlaneGeometry(S, S, N, N); g.rotateX(-Math.PI / 2); const p = g.attributes.position; const col = [];
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, Ht(x, z)); const r = hash(x * .37, z * .37), q = vnoise(x / 6, z / 6);
    const c = new THREE.Color().setRGB(.34 + r * .06 + q * .07, .46 + r * .07 + q * .09, .18 + q * .04); col.push(c.r, c.g, c.b); }
  g.computeVertexNormals(); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9 })); scene.add(m); return m; })();
const LAUNCH = V3(0, Ht(0, 0), 0);
// campo que se calienta (origen de la térmica) en el valle
const TH = V3(1700, 0, -500); TH.y = Ht(TH.x, TH.z);
const hotDisc = new THREE.Mesh(new THREE.CircleGeometry(320, 48), new THREE.MeshBasicMaterial({ map: SOFT, color: new THREE.Color(1.4, .55, .15), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
hotDisc.rotation.x = -Math.PI / 2; hotDisc.position.copy(TH).add(V3(0, 4, 0)); scene.add(hotDisc);

// ==========================================================================
// PARAPENTE (x = hacia delante, y = arriba, z = envergadura)
// ==========================================================================
const WG = { R: 6.2, thMax: .82, c0: 2.75, NC: 40, N: 161, M: 56 };
function airfoil(xi) { const t = .155; const yt = 5 * t * (.2969 * Math.sqrt(xi) - .126 * xi - .3516 * xi * xi + .2843 * xi ** 3 - .1036 * xi ** 4); const yc = xi < .35 ? .045 / .1225 * (.7 * xi - xi * xi) : .045 / .4225 * (.3 + 1.3 * xi - xi * xi - .6); return [yc, yt]; }
const wingState = { inf: 1, brakeR: 0, brakeL: 0, flat: 0 };
const wingGeo = new THREE.BufferGeometry(); { const n = WG.N * (WG.M + 1); wingGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3)); const idx = [];
  for (let i = 0; i < WG.N - 1; i++) for (let j = 0; j < WG.M; j++) { const a = i * (WG.M + 1) + j, b = a + WG.M + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); } wingGeo.setIndex(idx);
  const col = []; for (let i = 0; i < WG.N; i++) { const s = i / (WG.N - 1) * 2 - 1; const band = Math.abs(s); for (let j = 0; j <= WG.M; j++) { const ph = j / WG.M * Math.PI * 2; const xi = .5 * (1 + Math.cos(ph)); const upper = ph < Math.PI;
    let c = band < .22 ? [.95, .93, .9] : band < .5 ? [.82, .42, .2] : band < .58 ? [.95, .93, .9] : [.1, .32, .62]; if (!upper) c = c.map(v => v * .7);
    if ((!upper && xi < .08) || xi < .012) c = [.03, .03, .04]; // entradas de aire
    col.push(...c); } } wingGeo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); }
function wingPoint(s, xi, sign, out) { const th = s * WG.thMax; const c = WG.c0 * Math.sqrt(Math.max(.06, 1 - .72 * s * s)); const xo = -(WG.c0 - c) * .35;
  let [yc, yt] = airfoil(xi); const cell = Math.abs(Math.sin(Math.PI * WG.NC * (s + 1) / 2)); yt *= wingState.inf * (.9 + .14 * cell); yc *= lerp(.2, 1, wingState.inf);
  let y = (yc + sign * yt) * c; let x = (.5 - xi) * c + xo;
  const br = s > 0 ? wingState.brakeR : wingState.brakeL; if (br > 0 && xi > .6) y -= br * Math.pow((xi - .6) / .4, 2) * c * .28 * smooth(.15, .6, Math.abs(s));
  const fl = wingState.flat, th2 = th * (1 - fl); const py = (-WG.R + WG.R * Math.cos(th)) * (1 - fl), pz = lerp(WG.R * Math.sin(th), s * WG.R * WG.thMax * 1.05, fl); out.set(x, py + y * Math.cos(th2), pz + y * Math.sin(th2)); return out; }
function buildWing() { const p = wingGeo.attributes.position, v = V3(); for (let i = 0; i < WG.N; i++) { const s = i / (WG.N - 1) * 2 - 1; for (let j = 0; j <= WG.M; j++) { const ph = j / WG.M * Math.PI * 2; const xi = .5 * (1 + Math.cos(ph)); wingPoint(s, xi, ph < Math.PI ? 1 : -1, v); p.setXYZ(i * (WG.M + 1) + j, v.x, v.y, v.z); } }
  p.needsUpdate = true; wingGeo.computeVertexNormals(); wingGeo.computeBoundingSphere(); }
buildWing();
const glider = new THREE.Group(); scene.add(glider);
const wingRig = new THREE.Group(); glider.add(wingRig); wingRig.position.y = 7.6;  // ala 7,6 m por encima del piloto
const wingMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .55, metalness: .05, side: THREE.DoubleSide });
const wing = new THREE.Mesh(wingGeo, wingMat); wingRig.add(wing);
// costillas (solo en rayos X)
const ribs = new THREE.Group(); wingRig.add(ribs); ribs.visible = false;
{ const v = V3(); const mat = new THREE.LineBasicMaterial({ color: new THREE.Color(.5, 1, 1.8), transparent: true, opacity: .8 }); for (let k = 0; k <= WG.NC; k++) { const s = k / WG.NC * 2 - 1; const pts = [];
  for (let j = 0; j <= 40; j++) { const ph = j / 40 * Math.PI * 2; const xi = .5 * (1 + Math.cos(ph)); pts.push(wingPoint(s * .999, xi, ph < Math.PI ? 1 : -1, v).clone()); }
  ribs.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat)); } }
// cordinos: puntos de anclaje bajo el intradós → bandas del piloto
const lineGeo = new THREE.BufferGeometry(); const lineAnch = []; { const v = V3(); for (const s of [-.92, -.78, -.64, -.5, -.36, -.22, -.08, .08, .22, .36, .5, .64, .78, .92]) for (const xi of [.12, .32, .55, .8]) lineAnch.push({ s, xi }); }
lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(lineAnch.length * 6), 3));
const lineMat = new THREE.LineBasicMaterial({ color: new THREE.Color(.85, .85, .8), transparent: true, opacity: .55 }); const lines = new THREE.LineSegments(lineGeo, lineMat); glider.add(lines);
function updateLines() { const p = lineGeo.attributes.position, v = V3(); lineAnch.forEach((a, i) => { wingPoint(a.s, a.xi, -1, v); v.y += wingRig.position.y; v.applyEuler(wingRig.rotation); const rz = a.s > 0 ? .22 : -.22; p.setXYZ(i * 2, v.x, v.y, v.z); p.setXYZ(i * 2 + 1, -.05, .55, rz); }); p.needsUpdate = true; lineGeo.computeBoundingSphere(); }
// piloto con silla
const pilot = new THREE.Group(); glider.add(pilot);
{ const suit = new THREE.MeshStandardMaterial({ color: 0x1a2430, roughness: .7 }), acc = new THREE.MeshStandardMaterial({ color: 0xc87a45, roughness: .4, metalness: .3 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.2, .55, 6, 12), suit); body.position.set(0, .2, 0); body.rotation.z = .35; pilot.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.15, 20, 14), acc); head.position.set(.12, .62, 0); pilot.add(head);
  const pod = new THREE.Mesh(new THREE.CapsuleGeometry(.24, .8, 6, 12), new THREE.MeshStandardMaterial({ color: 0x2c3540, roughness: .6 })); pod.rotation.z = Math.PI / 2 - .25; pod.position.set(.35, -.12, 0); pilot.add(pod);
  for (const z of [-.2, .2]) { const leg = new THREE.Mesh(new THREE.CapsuleGeometry(.08, .6, 4, 8), suit); leg.position.set(.1, -.35, z); leg.userData.leg = true; pilot.add(leg); } }
const xrayParts = [wing];
function gliderXray(k) { wing.material = k ? xrayMat : wingMat; ribs.visible = !!k; }
function placeGlider(p, heading, bank = 0, pitch = 0) { glider.position.copy(p); glider.rotation.set(0, 0, 0); glider.rotateY(heading); glider.rotateX(bank); glider.rotateZ(pitch); glider.updateMatrixWorld(true); }
const GW = v => { glider.updateMatrixWorld(true); return glider.localToWorld(v.clone()); };

// ==========================================================================
// NUBES (cúmulo y cumulonimbo) y partículas
// ==========================================================================
const cloudTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 62); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.5, 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); return t; })();
function cloudPuffs(n, seed, shape) { const r = rng(seed); const pos = [], col = []; for (let i = 0; i < n; i++) { const [x, y, z, k] = shape(r); pos.push(x, y, z); col.push(k, k, k); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const m = new THREE.PointsMaterial({ map: cloudTex, size: 90, vertexColors: true, transparent: true, opacity: .9, depthWrite: false, sizeAttenuation: true }); const p = new THREE.Points(g, m); scene.add(p); return p; }
const CB = TH.clone().setY(TH.y + 1700);   // base del cúmulo
const cumulus = cloudPuffs(500, 3, r => { const a = r() * 6.283, rr = Math.sqrt(r()) * 260, h = Math.pow(r(), .8) * 380; const w = rr * (1 - h / 520); return [CB.x + Math.cos(a) * w, CB.y + h, CB.z + Math.sin(a) * w, .55 + h / 380 * .3]; });
cumulus.material.size = 150;
const CBS = V3(5200, 0, -3200); CBS.y = 900;   // cumulonimbo (lejos)
const storm = cloudPuffs(4500, 8, r => { const h = Math.pow(r(), .9) * 11500; const anvil = smooth(8500, 11000, h); const a = r() * 6.283; const rr = Math.sqrt(r()) * (1600 + anvil * 3800);
  return [CBS.x + Math.cos(a) * rr + anvil * 1500, CBS.y + h, CBS.z + Math.sin(a) * rr, lerp(.1, .55, smooth(500, 10000, h)) * (.75 + .25 * r())]; });
storm.material.size = 950; storm.visible = false;
const P = new Particles(14000, { size: 1.2, seed: 5 }); scene.add(P.obj);
const AIR = [.4, .85, 1.6], WARM = [1.5, .7, .25];

// ==========================================================================
// HUD
// ==========================================================================
function stamp(s, x, y, a, rot = -.1, col = '#ff6a4a') { if (a <= .01) return; const sc = lerp(1.6, 1, easeOut(clamp(a * 1.4)));
  g2.save(); g2.translate(x, y); g2.rotate(rot); g2.scale(sc, sc); g2.globalAlpha = clamp(a); g2.strokeStyle = col; g2.lineWidth = 8; g2.shadowColor = col; g2.shadowBlur = 25;
  g2.font = '800 100px Montserrat'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.letterSpacing = '8px'; const w = g2.measureText(s).width + 70; g2.strokeRect(-w / 2, -75, w, 150); g2.fillStyle = col; g2.fillText(s, 0, 4); g2.restore(); }
function vario(v, alt, a) { if (a <= .01) return; const x = 80, y = 230; g2.save(); g2.globalAlpha = a * .55; g2.fillStyle = '#05080d'; g2.fillRect(x - 20, y - 70, 330, 190); g2.restore();
  txt('VARIÓMETRO', x, y - 40, 20, { align: 'left', spacing: 6, alpha: a * .8, fill: '#e3a372' });
  const s = (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1).replace('.', ',') + ' m/s'; txt(s, x, y + 20, 56, { align: 'left', font: 'Montserrat', weight: 800, alpha: a, fill: v >= 0 ? '#9cff9c' : '#ff9a7a' });
  if (alt !== null) txt(fmt(alt) + ' m', x, y + 85, 34, { align: 'left', font: 'Montserrat', weight: 600, alpha: a * .9 }); }
function altBar(alt, a) { if (a <= .01) return; const x = 960, y0 = 1650, y1 = 330, top = 10000; g2.save(); g2.globalAlpha = a * .8; g2.strokeStyle = '#e3a372'; g2.lineWidth = 3;
  g2.beginPath(); g2.moveTo(x, y0); g2.lineTo(x, y1); g2.stroke(); for (let m = 0; m <= top; m += 1000) { const y = lerp(y0, y1, m / top); g2.beginPath(); g2.moveTo(x - (m % 5000 ? 14 : 26), y); g2.lineTo(x, y); g2.stroke(); if (m % 2000 === 0) txt(fmt(m), x - 40, y, 22, { align: 'right', weight: 300, alpha: a * .7 }); } g2.restore();
  const ye = lerp(y0, y1, 8849 / top); g2.save(); g2.globalAlpha = a; g2.strokeStyle = '#7fd4ff'; g2.setLineDash([10, 8]); g2.lineWidth = 3; g2.beginPath(); g2.moveTo(120, ye); g2.lineTo(x, ye); g2.stroke(); g2.restore();
  txt('EVEREST · 8.849 m', 130, ye - 26, 26, { align: 'left', font: 'Montserrat', weight: 800, alpha: a, fill: '#7fd4ff' });
  const yy = lerp(y0, y1, clamp(alt / top)); g2.save(); g2.globalAlpha = a; g2.fillStyle = '#ffe2c0'; g2.shadowColor = '#ffb070'; g2.shadowBlur = 20; g2.beginPath(); g2.moveTo(x - 8, yy); g2.lineTo(x - 34, yy - 14); g2.lineTo(x - 34, yy + 14); g2.fill(); g2.restore();
  txt(fmt(alt) + ' m', x - 46, yy, 40, { align: 'right', font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(500, 920, yy, .5) }); }

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
const FLY0 = V3(1300, 2950, 600);  // tramo del gancho
function flyPath(t, p0, hd, sink) { return p0.clone().add(V3(Math.cos(hd) * 10.5 * t, -sink * t, -Math.sin(hd) * 10.5 * t)); }
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .3; camera.far = 30000; camera.fov = 40;
  let bloomS = .5, flash = 0, ca = .0013, fade = 0, grain = .035, expo = 1, focus;
  P.begin(); gliderXray(0); wingState.inf = 1; wingState.brakeR = wingState.brakeL = 0; wingState.flat = 0; wingRig.position.set(0, 7.6, 0); wingRig.rotation.set(0, 0, 0); glider.visible = true; pilot.visible = true; lines.visible = true; lineMat.color.setRGB(.85, .85, .8); lineMat.opacity = .55;
  cumulus.visible = true; cumulus.material.opacity = .9; storm.visible = false; hotDisc.material.opacity = 0; scene.fog.density = .00011;
  for (const c of ['how', 'run', 'load', 'why', 'sun', 'where', 'turn', 'glide', 'strong', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = []; let rebuild = false;

  if (t < TL.how) {
    // A · gancho: 4 kg de tela a 3.000 m
    const lt = t; const p = flyPath(lt, FLY0, 2.6, -1.2); placeGlider(p, 2.6, Math.sin(t * .7) * .05, 0); focus = p.clone().add(V3(0, 4, 0));
    const k = lt / TL.how; camOrbit(focus, lerp(22, 30, k), 2.6 + Math.PI * .5 + lerp(-.9, -.55, k), lerp(-.05, .12, k), 42); fade = 1 - smooth(0, .3, t);
    hud.push(() => { bigStat('DE TELA', '4 kg', 430, smooth(0, .25, lt) * (1 - smooth(TL.nomotor - .15, TL.nomotor, lt)), .3 + lt * .3);
      titleHUD('SIN MOTOR', 'SIN PIEZAS RÍGIDAS', smooth(TL.nomotor, TL.nomotor + .3, lt) * (1 - smooth(TL.up3000 - .1, TL.up3000 + .1, lt)), 330);
      bigStat('ALTITUD', fmt(lerp(2600, 3000, smooth(TL.up3000, TL.how - .3, lt))) + ' m', 430, smooth(TL.up3000, TL.up3000 + .3, lt), .5); });
  } else if (t < TL.run) {
    // B · en el suelo cabe en una mochila; el borde de ataque está abierto
    const lt = t - TL.how; wingState.inf = .08; rebuild = true;
    placeGlider(LAUNCH.clone().add(V3(.3, 0, 0)), Math.PI, 0, 0); wingRig.position.set(0, 0, 0); wingRig.rotation.set(0, 0, 0);
    // ala extendida en la ladera, detrás del piloto, boca arriba
    wingState.flat = 1; { const wp = GW(V3(-7.2, 0, 0)); wingRig.position.set(-7.2, .45 + Math.max(0, Ht(wp.x, wp.z) - glider.position.y), 0); wingRig.rotation.set(0, 0, .06 - .25); } pilot.visible = true;
    const edgeV = smooth(TL.edge - .3, TL.edge + .5, t); focus = GW(V3(lerp(-4.5, -6, edgeV), lerp(.6, .5, edgeV), lerp(0, 1.5, edgeV)));
    if (edgeV < .5) camOrbit(focus, lerp(17, 14, lt / 2), Math.PI + 1.15, .55, 42); else { camera.position.copy(GW(V3(-3.2, 1.1, 3.2))); camera.lookAt(GW(V3(-6.2, .45, 1.2))); camera.fov = 50; }
    hud.push(() => { txt('¿CÓMO VUELA ALGO', W / 2, 300, 48, { font: 'Montserrat', weight: 800, alpha: smooth(0, .3, lt) * (1 - smooth(TL.edge - TL.how - .2, TL.edge - TL.how, lt)) }); txt('QUE CABE EN UNA MOCHILA?', W / 2, 360, 48, { font: 'Montserrat', weight: 800, alpha: smooth(0, .3, lt) * (1 - smooth(TL.edge - TL.how - .2, TL.edge - TL.how, lt)) });
      if (t > TL.edge + .4) callout(GW(V3(-6.05, .42, 2.2)), 60, -320, 'ENTRADAS DE AIRE', null, smooth(TL.edge + .5, TL.edge + .9, t));
      titleHUD('EL BORDE DE DELANTE', 'ESTÁ ABIERTO', smooth(TL.edge - TL.how + .3, TL.edge - TL.how + .7, lt), 330); });
  } else if (t < TL.load) {
    // C · inflado en carrera y ala hecha de aire (rayos X con costillas)
    const lt = t - TL.run; const up = smooth(.2, 2.6, lt); wingState.inf = lerp(.08, 1, smooth(.1, 2.2, lt)); rebuild = true;
    const run = Math.min(lt, 3.6) * 2.4 + Math.max(0, lt - 3.6) * 10; const base = V3(-run * Math.cos(Math.PI), 0, 0).add(LAUNCH); base.y = Ht(base.x, base.z) + Math.max(0, lt - 3) * 2.5 + .9;
    placeGlider(base, Math.PI, 0, 0); const phi = easeInOut(up) * Math.PI * .47; wingState.flat = 1 - smooth(.1, .9, up); const wp = GW(V3(-7.2, 0, 0)); const dy = Math.max(0, Ht(wp.x, wp.z) - glider.position.y); wingRig.position.set(-7.6 * Math.cos(phi) - .2, .45 + dy * (1 - up) + 7.4 * Math.sin(phi), 0); wingRig.rotation.set(0, 0, lerp(-.19, -.12, up));
    pilot.children.forEach(c => { if (c.userData.leg) c.rotation.x = Math.sin(t * 12) * .5 * (1 - smooth(3, 3.8, lt)); });
    const xr = smooth(TL.wing - .3, TL.wing + .3, t); if (xr > .5) { gliderXray(1); bloomS = .7; }
    // aire que entra por las bocas
    const inA = smooth(.3, .8, lt) * (xr > .5 ? 1.4 : .9 * smooth(.3, .6, up)); const v = V3();
    for (let i = 0; i < 2600; i++) { const s = P.seed, k = i * 4; const ss = s[k + 1] * 2 - 1, age = fract(s[k] + t * (xr > .5 ? .5 : 1.4));
      if (xr > .5) { const xi = .05 + age * .85; wingPoint(ss, xi, s[k + 2] > .5 ? .5 : -.5, v); } else { wingPoint(ss, .02, -1, v); v.x += (1 - age) * 3.5; }
      v.y += wingRig.position.y; v.applyEuler(wingRig.rotation); const w = GW(v); const f = inA * (xr > .5 ? .5 : (age > .85 ? 0 : age)); P.push(w.x, w.y, w.z, AIR[0] * f, AIR[1] * f, AIR[2] * f); }
    P.mat.size = .12; focus = GW(V3(lerp(-4, -.6, up), lerp(1.2, 4.5, up), 0));
    camOrbit(focus, xr > .5 ? lerp(13, 11, (t - TL.wing) / 3.6) : lerp(15, 18, lt / 3.8), xr > .5 ? Math.PI + 2.3 : Math.PI + lerp(2.5, 2.1, lt / 3.8), xr > .5 ? .35 : .2, 42);
    if (xr < .5) { const k = smooth(.9, 2.4, lt); const cp = GW(V3(11, 3.8, 1.5)); camera.position.lerpVectors(cp, camera.position.clone(), k); camera.lookAt(focus); }
    hud.push(() => { titleHUD('EL AIRE ENTRA A PRESIÓN', 'E HINCHA LAS CELDAS', smooth(.3, .7, lt) * (1 - smooth(TL.wing - TL.run - .2, TL.wing - TL.run, lt)), 330);
      titleHUD('UN ALA COMO LA DE UN AVIÓN', 'HECHA SOLO DE AIRE', smooth(TL.wing - TL.run + .2, TL.wing - TL.run + .6, lt), 330);
      if (xr > .5) callout(GW(V3(.9, 7.4, -.8)), -60, 300, '40 CELDAS', 'separadas por costillas', smooth(TL.wing - TL.run + 1, TL.wing - TL.run + 1.4, lt)); });
  } else if (t < TL.why) {
    // D · 4 kg/m² y cientos de metros de cordino
    const lt = t - TL.load; const p = flyPath(lt, LAUNCH.clone().add(V3(260, 120, 0)), Math.PI * 0 + .0, .9); placeGlider(p, 0, Math.sin(t * .8) * .04, 0);
    const ln = smooth(TL.lines - .3, TL.lines + .4, t); focus = GW(V3(0, lerp(7.2, 4, ln), 0));
    camOrbit(focus, lerp(lerp(14, 12, lt / 4.5), 13, ln), lerp(-2.3, -1.9, ln) + (lt * .03), lerp(.55, .05, ln), 42);
    if (ln > 0) { lineMat.color.setRGB(lerp(.85, 1.6, ln), lerp(.85, .9, ln), lerp(.8, .4, ln)); lineMat.opacity = lerp(.55, 1, ln); bloomS = .65; }
    hud.push(() => { const a1 = smooth(.2, .6, lt) * (1 - smooth(TL.lines - TL.load - .2, TL.lines - TL.load, lt));
      if (a1 > .01) { const c = [V3(-.5, 7.75, -.5), V3(.5, 7.75, -.5), V3(.5, 7.75, .5), V3(-.5, 7.75, .5)].map(v => project(GW(v)));
        g2.save(); g2.globalAlpha = a1; g2.strokeStyle = '#ffe2c0'; g2.lineWidth = 4; g2.shadowColor = '#e3a372'; g2.shadowBlur = 16; g2.beginPath(); c.forEach((q, i) => i ? g2.lineTo(q.x, q.y) : g2.moveTo(q.x, q.y)); g2.closePath(); g2.stroke(); g2.restore();
        const q = project(GW(V3(0, 7.75, 0))); txt('1 m²', q.x, q.y - 50, 30, { font: 'Montserrat', weight: 800, alpha: a1, fill: '#ffe2c0' }); }
      titleHUD('UNA PRESIÓN', 'RIDÍCULA', smooth(.2, .6, lt) * (1 - smooth(TL.kg4 - TL.load - .2, TL.kg4 - TL.load, lt)), 330);
      bigStat('POR CADA METRO CUADRADO', '4 kg', 430, smooth(TL.kg4 - TL.load, TL.kg4 - TL.load + .3, lt) * (1 - smooth(TL.lines - TL.load - .2, TL.lines - TL.load, lt)), .4);
      titleHUD('CIENTOS DE METROS', 'DE CUERDA DE 1 mm', smooth(TL.lines - TL.load + .2, TL.lines - TL.load + .6, lt) * (1 - smooth(TL.ton - TL.load - .2, TL.ton - TL.load, lt)), 330);
      bigStat('JUNTAS AGUANTAN', '+1 TONELADA', 430, smooth(TL.ton - TL.load, TL.ton - TL.load + .3, lt), .5); });
  } else if (t < TL.sun) {
    // E · siempre baja: −1 m/s; el truco: aire que sube más deprisa
    const lt = t - TL.why; const p = flyPath(lt, V3(700, 1400, 300), .35, 1.0); placeGlider(p, .35, 0, 0); focus = p.clone().add(V3(0, 3.5, 0));
    camOrbit(focus, lerp(36, 30, lt / 7.7), .35 + Math.PI * .5 + lerp(-2.4, -2.0, lt / 7.7), lerp(.12, .02, lt / 7.7), 42);
    // estela de caída
    for (let i = 0; i < 600; i++) { const age = i / 600 * 6; const q = flyPath(lt - age, V3(700, 1400, 300), .35, 1.0).add(V3(0, 4, 0)); const f = (1 - i / 600) * .35 * smooth(TL.yes - TL.why, TL.yes - TL.why + .5, lt); P.push(q.x, q.y, q.z, AIR[0] * f, AIR[1] * f, AIR[2] * f); } P.mat.size = .5;
    hud.push(() => { txt('¿Y SIN MOTOR,', W / 2, 300, 48, { font: 'Montserrat', weight: 800, alpha: smooth(0, .3, lt) * (1 - smooth(TL.yes - TL.why - .1, TL.yes - TL.why + .1, lt)) }); txt('CÓMO NO BAJAS?', W / 2, 360, 48, { font: 'Montserrat', weight: 800, alpha: smooth(0, .3, lt) * (1 - smooth(TL.yes - TL.why - .1, TL.yes - TL.why + .1, lt)) });
      stamp('SÍ BAJA', W / 2, 400, smooth(TL.yes - TL.why, TL.yes - TL.why + .25, lt) * (1 - smooth(TL.trick - TL.why - .2, TL.trick - TL.why, lt)), -.08);
      vario(-1.0, 1400 - lt * 1.0 + 90, smooth(TL.sink - TL.why, TL.sink - TL.why + .3, lt));
      titleHUD('EL TRUCO: AIRE QUE SUBE', 'MÁS DEPRISA', smooth(TL.trick - TL.why, TL.trick - TL.why + .4, lt), 1460); });
  } else if (t < TL.where) {
    // F · térmicas: el sol calienta el suelo, columnas de aire caliente; +3 −1 = +2; giros en círculo
    const lt = t - TL.sun; hotDisc.material.opacity = smooth(TL.sun - .2, TL.sun + .5, t) * 1; const col = smooth(TL.thermal - .3, TL.thermal + 1.2, t);
    const top = CB.y; for (let i = 0; i < 6000; i++) { const s = P.seed, k = i * 4; const age = fract(s[k] + t * .07); const h = TH.y + age * (top - TH.y); const a = s[k + 1] * 6.283, r = Math.sqrt(s[k + 2]) * (60 + age * 60) + Math.sin(age * 9 + i) * 6;
      const f = col * (1 - age * .85) * .55; const w = clamp(1 - age * 1.3); P.push(TH.x + Math.cos(a + age * 2) * r, h, TH.z + Math.sin(a + age * 2) * r, lerp(AIR[0], WARM[0], w) * f, lerp(AIR[1], WARM[1], w) * f, lerp(AIR[2], WARM[2], w) * f); }
    P.mat.size = t < TL.math ? 28 : 3; cumulus.material.opacity = .9 * (1 - col * .6);
    const circ = smooth(TL.math - .5, TL.math + .5, t); const ang = (t - TL.math) * .42; const alt = lerp(TH.y + 600, TH.y + 600 + 2 * (t - TL.math), circ);
    const gp = TH.clone().add(V3(Math.cos(ang) * 45, 0, Math.sin(ang) * 45)); gp.y = alt; placeGlider(gp, -ang, -.32 * circ, 0); glider.visible = circ > 0;
    if (circ > 0) for (let i = 0; i < 900; i++) { const a2 = ang - i * .006; const h2 = alt - i * .006 / .42 * 2; P.push(TH.x + Math.cos(a2) * 45, h2 + 4, TH.z + Math.sin(a2) * 45, .25 * (1 - i / 900), .2 * (1 - i / 900), .12 * (1 - i / 900)); }
    if (t < TL.math) { focus = TH.clone().add(V3(0, 500, 0)); camOrbit(focus, lerp(2600, 2300, lt / 4.3), -1.25, lerp(.12, .2, lt / 4.3), 42); }
    else { focus = gp.clone().add(V3(0, 4, 0)); const out = V3(Math.cos(ang - .25), 0, Math.sin(ang - .25)); camera.position.copy(TH).setY(alt + 12).addScaledVector(out, 80); camera.lookAt(focus.clone().lerp(TH.clone().setY(alt), .12)); }
    hud.push(() => { titleHUD('EL SOL CALIENTA', 'EL SUELO', smooth(.2, .6, lt) * (1 - smooth(TL.thermal - TL.sun - .2, TL.thermal - TL.sun, lt)), 330);
      titleHUD('EL AIRE CALIENTE SUBE', 'TÉRMICAS', smooth(TL.thermal - TL.sun + .2, TL.thermal - TL.sun + .6, lt) * (1 - smooth(TL.math - TL.sun - .2, TL.math - TL.sun, lt)), 330);
      const m0 = TL.math - TL.sun; const aM = smooth(m0 + .2, m0 + .6, lt) * (1 - smooth(TL.circle - TL.sun + 1.6, TL.circle - TL.sun + 2, lt));
      if (aM > .01) { txt('TÉRMICA  +3 m/s', W / 2, 300, 44, { font: 'Montserrat', weight: 800, alpha: aM, fill: '#ffb27a' }); txt('TÚ  −1 m/s', W / 2, 370, 44, { font: 'Montserrat', weight: 800, alpha: aM * smooth(m0 + 1.2, m0 + 1.6, lt), fill: '#7fd4ff' }); }
      vario(2.0 * smooth(TL.gain - .2, TL.gain + .3, t) + (t < TL.gain ? -1 : 0) * (1 - smooth(TL.gain - .2, TL.gain + .3, t)) , Math.round(alt), smooth(m0 + .6, m0 + 1, lt));
      bigStat('GANAS', '+2 m/s', 520, smooth(TL.gain - TL.sun, TL.gain - TL.sun + .3, lt) * (1 - smooth(TL.circle - TL.sun - .1, TL.circle - TL.sun + .2, lt)), .5);
      titleHUD('GIRAN EN CÍRCULOS', 'PARA QUEDARSE DENTRO', smooth(TL.circle - TL.sun + .2, TL.circle - TL.sun + .6, lt), 1460); });
  } else if (t < TL.turn) {
    // G · el cúmulo marca la térmica
    const lt = t - TL.where; const form = smooth(TL.look, TL.cloud + 1.2, t); cumulus.material.opacity = lerp(.25, .95, form); cumulus.scale.setScalar(1);
    const ang = (t - TL.math) * .42, alt = TH.y + 600 + 2 * (t - TL.math); const gp = TH.clone().add(V3(Math.cos(ang) * 45, 0, Math.sin(ang) * 45)); gp.y = alt; placeGlider(gp, -ang, -.32, 0);
    for (let i = 0; i < 2500; i++) { const s = P.seed, k = i * 4; const age = fract(s[k] + t * .07); const h = TH.y + age * (CB.y - TH.y); const a = s[k + 1] * 6.283, r = Math.sqrt(s[k + 2]) * (60 + age * 60); const f = .35 * (1 - age * .8) * (1 - form * .5); P.push(TH.x + Math.cos(a) * r, h, TH.z + Math.sin(a) * r, WARM[0] * f, WARM[1] * f, WARM[2] * f); } P.mat.size = 9;
    focus = gp.clone().add(V3(0, 3, 0)); const lk = smooth(TL.look - .2, TL.look + 1.2, t);
    camera.position.copy(gp).add(V3(-28, 6, 14)); camera.lookAt(focus.clone().lerp(CB.clone().add(V3(0, 200, 0)), easeInOut(lk))); camera.fov = lerp(42, 60, lk);
    hud.push(() => { txt('¿Y CÓMO SABEN DÓNDE ESTÁN?', W / 2, 330, 46, { font: 'Montserrat', weight: 800, alpha: smooth(0, .3, lt) * (1 - smooth(TL.look - TL.where + .3, TL.look - TL.where + .6, lt)) });
      titleHUD('MIRANDO', 'ARRIBA', smooth(TL.look - TL.where + .4, TL.look - TL.where + .8, lt) * (1 - smooth(TL.cloud - TL.where + .1, TL.cloud - TL.where + .4, lt)), 330);
      titleHUD('EL CÚMULO MARCA', 'EL FINAL DE LA TÉRMICA', smooth(TL.cloud - TL.where + .3, TL.cloud - TL.where + .7, lt), 1460); });
  } else if (t < TL.glide) {
    // H · girar: el freno baja el borde de salida de un lado
    const lt = t - TL.turn; const br = smooth(TL.brake - .3, TL.brake + .6, t); wingState.brakeR = br; rebuild = true;
    const yaw = Math.max(0, t - TL.half) * .35 * smooth(TL.half - .2, TL.half + .5, t); const p = flyPath(lt, V3(900, 1500, 900), 1.2, 1.0); p.add(V3(0, 0, 0)); placeGlider(p, 1.2 - yaw, .3 * smooth(TL.half - .2, TL.half + .8, t), 0);
    focus = GW(V3(-.3, 6.5, 0)); camOrbit(focus, lerp(14, 12, lt / 5.5), 1.2 - yaw - Math.PI * .5 - 2.75, .22, 42);
    hud.push(() => { titleHUD('PARA GIRAR', 'TIRA DE UN FRENO', smooth(.2, .6, lt) * (1 - smooth(TL.brake - TL.turn - .1, TL.brake - TL.turn + .1, lt)), 330);
      callout(GW(V3(-1.2, 7.1, 4.8)), 80, -260, 'EL BORDE DE ATRÁS BAJA', null, smooth(TL.brake - TL.turn + .3, TL.brake - TL.turn + .7, lt) * (1 - smooth(TL.half - TL.turn + 1, TL.half - TL.turn + 1.4, lt)));
      titleHUD('ESA MITAD SE FRENA', 'Y EL ALA GIRA', smooth(TL.half - TL.turn + .2, TL.half - TL.turn + .6, lt), 330); });
  } else if (t < TL.strong) {
    // I · fineza 9: por cada metro que baja avanza nueve
    const lt = t - TL.glide; const p = flyPath(lt, V3(1200, 1250, 1600), 0, 10.5 / 9); placeGlider(p, 0, 0, 0); focus = p.clone().add(V3(0, 4, 0));
    camOrbit(focus, lerp(34, 40, lt / 4.9), -Math.PI / 2 + .25, .05, 42);
    for (let i = 0; i < 700; i++) { const q = flyPath(lt - i / 700 * 5, V3(1200, 1250, 1600), 0, 10.5 / 9).add(V3(0, 4, 0)); const f = (1 - i / 700) * .22; P.push(q.x, q.y, q.z, 1.2 * f, .7 * f, .35 * f); } P.mat.size = .6;
    hud.push(() => { const a = smooth(.3, .8, lt); const x0 = 135, y0 = 1250, Lx = 810, Ly = 90; const k = smooth(.4, 2.4, lt);
      g2.save(); g2.globalAlpha = a; g2.strokeStyle = 'rgba(255,255,255,.75)'; g2.lineWidth = 3; g2.beginPath(); g2.moveTo(x0, y0); g2.lineTo(x0, y0 + Ly); g2.lineTo(x0 + Lx * k, y0 + Ly); g2.stroke();
      g2.strokeStyle = '#e3a372'; g2.lineWidth = 6; g2.shadowColor = '#e3a372'; g2.shadowBlur = 18; g2.setLineDash([16, 10]); g2.beginPath(); g2.moveTo(x0, y0); g2.lineTo(x0 + Lx * k, y0 + Ly * k); g2.stroke(); g2.restore();
      const sw = smooth(TL.km9 - TL.glide - .1, TL.km9 - TL.glide + .3, lt);
      txt('1 m', x0 + 20, y0 + Ly / 2, 34, { align: 'left', font: 'Montserrat', weight: 800, alpha: a * (1 - sw) }); txt('9 m', x0 + Lx / 2, y0 + Ly + 50, 38, { font: 'Montserrat', weight: 800, alpha: a * smooth(1.6, 2.2, lt) * (1 - sw) });
      txt('1.000 m', x0 + 20, y0 + Ly / 2, 34, { align: 'left', font: 'Montserrat', weight: 800, alpha: sw, fill: '#ffe2c0' }); txt('9 km', x0 + Lx / 2, y0 + Ly + 50, 44, { font: 'Montserrat', weight: 800, alpha: sw, fill: '#ffe2c0' });
      bigStat('POR CADA METRO QUE BAJA', 'AVANZA 9', 430, smooth(.2, .5, lt), .5); });
  } else if (t < TL.brand) {
    // J · cumulonimbo: Ewa Wiśnierska, 2007, hasta 9.946 m
    const lt = t - TL.strong; storm.visible = true; cumulus.visible = false; scene.fog.density = .00004; expo = lerp(1, .55, smooth(TL.ewa, TL.alt, t));
    const lift = smooth(TL.ewa + .5, TL.faint, t); const alt = lerp(2500, 9946, easeInOut(lift)); const gp = CBS.clone().add(V3(-1500 + lift * 900, 0, 1400 - lift * 700)); gp.y = alt; placeGlider(gp, .8 + t * .3, Math.sin(t * 3) * .25 * lift, Math.sin(t * 2.3) * .2 * lift); glider.scale.setScalar(lerp(1, 60, smooth(TL.ewa, TL.ewa + 1.5, t)));
    focus = CBS.clone().add(V3(0, lerp(4000, 6500, lift), 0)); camOrbit(focus, lerp(26000, 22000, lt / 14), -2.2 + lt * .01, lerp(.05, .12, lift), 42);
    // relámpagos
    for (const tf of [TL.strong + 1.2, TL.ewa + .4, TL.alt + .2, TL.everest + 1.4, TL.faint + .5]) flash = Math.max(flash, flashAt(t, tf, .22, .6));
    // granizo / hielo
    if (lift > .2) for (let i = 0; i < 3000; i++) { const s = P.seed, k = i * 4; const age = fract(s[k] + t * .8); P.push(gp.x + (s[k + 1] - .5) * 3000, gp.y + (age - .5) * 4000, gp.z + (s[k + 2] - .5) * 3000, .8 * lift, .9 * lift, 1.1 * lift); } P.mat.size = 30;
    hud.push(() => { titleHUD('UNA TÉRMICA PUEDE SER', 'DEMASIADO FUERTE', smooth(.2, .6, lt) * (1 - smooth(TL.ewa - TL.strong - .2, TL.ewa - TL.strong, lt)), 330);
      titleHUD('2007 · EWA WIŚNIERSKA', 'ABSORBIDA POR UNA TORMENTA', smooth(TL.ewa - TL.strong, TL.ewa - TL.strong + .4, lt) * (1 - smooth(TL.everest - TL.strong - .2, TL.everest - TL.strong, lt)), 330);
      altBar(Math.round(alt), smooth(TL.ewa - TL.strong + .5, TL.ewa - TL.strong + 1, lt));
      bigStat('TEMPERATURA', '−50 °C', 430, smooth(TL.everest - TL.strong + 1.4, TL.everest - TL.strong + 1.8, lt) * (1 - smooth(TL.faint - TL.strong - .1, TL.faint - TL.strong + .2, lt)), .5);
      titleHUD('SE DESMAYÓ…', 'Y SOBREVIVIÓ', smooth(TL.faint - TL.strong + .2, TL.faint - TL.strong + .6, lt), 330); });
  } else {
    // K · marca
    const lt = t - TL.brand; const p = flyPath(lt, V3(1500, 2200, 900), 2.6, .6); placeGlider(p, 2.6, .1, 0); focus = p.clone().add(V3(0, 4, 0));
    camOrbit(focus, 60 + lt * 5, 2.6 + Math.PI * .5 - 2.4, .1, 42); expo = .85; fade = Math.min(.5, lt * .45);
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  if (t >= TL.glide && t < TL.strong) {} else glider.scale.setScalar(t >= TL.strong && t < TL.brand ? glider.scale.x : 1);
  if (rebuild) buildWing(); else if (wingState._last !== 1) { buildWing(); } wingState._last = rebuild ? 0 : 1;
  updateLines(); P.end();
  camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); skyDome.position.copy(camera.position); lightAt(focus || glider.position);
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
function renderCover() { renderFrame(2.2); coverText('¿CÓMO VUELA', 'UN PARAPENTE?', '4 kilos de tela… y te sube a 3.000 metros'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
