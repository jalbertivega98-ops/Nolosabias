// NO LO SABÍAS — "¿Cómo se vuelan 500 km en parapente sin motor?" (vuelo de distancia / cross-country)
// Reutiliza el terreno, el ala y el HUD del vídeo «¿Cómo vuela un parapente?». Unidades: metros.
// Datos: récords de distancia libre en parapente por encima de 500 km (Brasil, desde 2015), vuelos de más de 10 h;
// ascendencia dinámica de ladera; térmicas 1–5 m/s; acelerador: velocidad de compensación ≈ 38 km/h → 50+ km/h (EN-B/C),
// la tasa de caída sube de ≈ 1,1 a ≈ 1,8–2 m/s; calles de nubes alineadas con el viento.
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
// EXTRAS: barra de acelerador, varias térmicas, calles de nubes, viento de ladera
// ==========================================================================
const speedBar = new THREE.Group(); pilot.add(speedBar);
{ const m = new THREE.MeshStandardMaterial({ color: 0xe3a372, roughness: .35, metalness: .6, emissive: 0x3a1a08 });
  const b = new THREE.Mesh(new THREE.CapsuleGeometry(.05, .5, 4, 8), m); b.rotation.x = Math.PI / 2; speedBar.add(b); }
const barLineGeo = new THREE.BufferGeometry(); barLineGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(12), 3));
const barLines = new THREE.LineSegments(barLineGeo, new THREE.LineBasicMaterial({ color: 0xe3a372, transparent: true, opacity: .9 })); pilot.add(barLines);
function setBar(k) { speedBar.position.set(lerp(.62, .95, k), lerp(-.42, -.36, k), 0); const p = barLineGeo.attributes.position;
  p.setXYZ(0, speedBar.position.x, speedBar.position.y, -.2); p.setXYZ(1, .05, .9, -.22); p.setXYZ(2, speedBar.position.x, speedBar.position.y, .2); p.setXYZ(3, .05, .9, .22);
  p.setXYZ(4, 0, 0, 0); p.setXYZ(5, 0, 0, 0); p.needsUpdate = true;
  pilot.children.forEach(c => { if (c.userData.leg) { c.rotation.z = lerp(0, -1.1, k); c.position.x = lerp(.1, .3, k); } }); }
const THS = [V3(1700, 0, -500), V3(3700, 0, 300), V3(5700, 0, -350)]; THS.forEach(p => p.y = Ht(p.x, p.z));
const cumuli = THS.slice(1).map((p, i) => { const c = p.clone().setY(p.y + 1700); const m = cloudPuffs(380, 11 + i, r => { const a = r() * 6.283, rr = Math.sqrt(r()) * 240, h = Math.pow(r(), .8) * 340; const w = rr * (1 - h / 480);
  return [c.x + Math.cos(a) * w, c.y + h, c.z + Math.sin(a) * w, .55 + h / 340 * .3]; }); m.material.size = 140; return m; });
// calles de nubes: 3 filas paralelas al viento (eje x), sobre el valle
const streets = cloudPuffs(5200, 21, r => { const row = Math.floor(r() * 3); const zc = (row - 1) * 1500 + 400; const ci = Math.floor(r() * 14); const xc = 1200 + ci * 820 + (r() - .5) * 200;
  const a = r() * 6.283, rr = Math.sqrt(r()) * (200 + 60 * Math.sin(ci * 1.7 + row)), h = Math.pow(r(), .8) * 300; const w = rr * (1 - h / 440);
  return [xc + Math.cos(a) * w * 1.4, 2350 + h, zc + Math.sin(a) * w, .55 + h / 300 * .32]; });
streets.material.size = 150; streets.visible = false;
const RIDGE = (() => { let x = -350; return V3(x, Ht(x, 0), 0); })();
function thermalCol(c, n, t, amp, top, seedOff = 0) { for (let i = 0; i < n; i++) { const s = P.seed, k = ((i + seedOff) % 14000) * 4; const age = fract(s[k] + t * .07); const h = c.y + age * (top - c.y);
  const a = s[k + 1] * 6.283, r = Math.sqrt(s[k + 2]) * (60 + age * 70) + Math.sin(age * 9 + i) * 6; const f = amp * (1 - age * .85); const w = clamp(1 - age * 1.3);
  P.push(c.x + Math.cos(a + age * 2) * r, h, c.z + Math.sin(a + age * 2) * r, lerp(AIR[0], WARM[0], w) * f, lerp(AIR[1], WARM[1], w) * f, lerp(AIR[2], WARM[2], w) * f); } }
// ruta de distancia: sube en espiral en cada térmica y planea a la siguiente (u ∈ [0,1])
function xcPath(u) { const seg = u * 3; const i = Math.min(2, Math.floor(seg)); const f = seg - i; const c = THS[i]; const base = c.y + 700;
  if (f < .55) { const k = f / .55; const ang = k * 6.283 * 2.5; return V3(c.x + Math.cos(ang) * 70, base + k * 900, c.z + Math.sin(ang) * 70); }
  const k = (f - .55) / .45; const n = THS[Math.min(2, i + 1)]; const a = V3(c.x + 70, base + 900, c.z); const b = i < 2 ? V3(n.x - 70, n.y + 700, n.z) : V3(c.x + 1500, base + 600, c.z + 400); return a.lerp(b, k); }
// texto 2D en dos líneas para preguntas
function question(l1, l2, a, y = 300) { if (a <= .01) return; txt(l1, W / 2, y, 48, { font: 'Montserrat', weight: 800, alpha: a }); if (l2) txt(l2, W / 2, y + 60, 48, { font: 'Montserrat', weight: 800, alpha: a }); }
function speedo(v, a, label = 'VELOCIDAD') { if (a <= .01) return; const x = 80, y = 560; g2.save(); g2.globalAlpha = a * .55; g2.fillStyle = '#05080d'; g2.fillRect(x - 20, y - 70, 380, 160); g2.restore();
  txt(label, x, y - 40, 20, { align: 'left', spacing: 6, alpha: a * .8, fill: '#e3a372' }); txt(Math.round(v) + ' km/h', x, y + 25, 60, { align: 'left', font: 'Montserrat', weight: 800, alpha: a, fill: v > 45 ? copperGrad(80, 440, y, .6) : '#fff' }); }
const inA = (t, a, b, f = .3, o = .2) => smooth(a, a + f, t) * (1 - smooth(b - o, b, t));

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
function flyPath(t, p0, hd, sink, v = 10.5) { return p0.clone().add(V3(Math.cos(hd) * v * t, -sink * t, -Math.sin(hd) * v * t)); }
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .3; camera.far = 30000; camera.fov = 40;
  let bloomS = .5, flash = 0, ca = .0013, fade = 0, grain = .035, expo = 1, focus;
  P.begin(); P.mat.size = 1.2; gliderXray(0); wingState.inf = 1; wingState.brakeR = wingState.brakeL = 0; wingState.flat = 0; wingRig.position.set(0, 7.6, 0); wingRig.rotation.set(0, 0, 0);
  glider.visible = true; pilot.visible = true; lines.visible = true; lineMat.color.setRGB(.85, .85, .8); lineMat.opacity = .55; glider.scale.setScalar(1); setBar(0); if (t >= TL.ridge && t < TL.therm) glider.scale.setScalar(lerp(8, 1, smooth(TL.dyn - .5, TL.dyn + 1.2, t))); speedBar.visible = false; barLines.visible = false;
  cumulus.visible = true; cumulus.material.opacity = .9; cumuli.forEach(c => { c.visible = true; c.material.opacity = .9; }); streets.visible = false; storm.visible = false; hotDisc.material.opacity = 0; scene.fog.density = .00011;
  for (const c of ['how', 'jump', 'ridge', 'therm', 'faster', 'wind', 'line', 'brazil', 'you', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = []; let rebuild = false;

  if (t < TL.how) {
    // A · gancho: más de 500 km en un día; Madrid–Barcelona
    const lt = t; const p = flyPath(lt, V3(1300, 2950, 600), 2.6, -.8, 11); placeGlider(p, 2.6, Math.sin(t * .7) * .05, 0); focus = p.clone().add(V3(0, 4, 0));
    const k = lt / TL.how; camOrbit(focus, lerp(20, 34, k), 2.6 + Math.PI * .5 + lerp(-.95, -.5, k), lerp(-.06, .14, k), 42); fade = 1 - smooth(0, .3, t);
    if (0) for (let i = 0; i < 900; i++) { const q = flyPath(lt - i / 900 * 7, V3(1300, 2950, 600), 2.6, -.8, 11).add(V3(0, 4, 0)); const f = (1 - i / 900) * .3; P.push(q.x, q.y, q.z, 1.2 * f, .7 * f, .35 * f); } P.mat.size = .5;
    hud.push(() => { bigStat('DISTANCIA SIN MOTOR', '+' + fmt(lerp(0, 500, easeOut(smooth(.05, 1.2, lt)))) + ' km', 430, smooth(0, .2, lt) * (1 - smooth(TL.madrid - .15, TL.madrid, lt)), .3 + lt * .3);
      titleHUD('EN PARAPENTE · SIN MOTOR', 'EN UN SOLO DÍA', inA(lt, TL.nomotor, TL.madrid), 1460);
      const am = smooth(TL.madrid, TL.madrid + .3, lt); if (am > .01) { const k2 = easeInOut(smooth(TL.madrid + .2, TL.madrid + 1.6, lt)); const A = [250, 520], B = [830, 330];
        g2.save(); g2.globalAlpha = am * .55; g2.fillStyle = '#05080d'; g2.fillRect(140, 210, 800, 420); g2.restore();
        g2.save(); g2.globalAlpha = am; g2.strokeStyle = '#e3a372'; g2.lineWidth = 6; g2.shadowColor = '#e3a372'; g2.shadowBlur = 18; g2.setLineDash([18, 12]); g2.beginPath(); g2.moveTo(A[0], A[1]);
        g2.quadraticCurveTo(560, 330, lerp(A[0], B[0], k2), lerp(A[1], B[1], k2) - Math.sin(k2 * Math.PI) * 60); g2.stroke(); g2.setLineDash([]); g2.fillStyle = '#ffe2c0';
        for (const [x, y] of [A, k2 > .98 ? B : null].filter(Boolean)) { g2.beginPath(); g2.arc(x, y, 12, 0, 7); g2.fill(); } g2.restore();
        txt('MADRID', A[0], A[1] + 50, 32, { font: 'Montserrat', weight: 800, alpha: am }); txt('BARCELONA', B[0], B[1] - 48, 32, { font: 'Montserrat', weight: 800, alpha: am * smooth(.9, 1, k2) });
        txt('≈ 500 km EN LÍNEA RECTA', W / 2, 585, 28, { spacing: 4, alpha: am * smooth(.9, 1, k2), fill: '#e3a372' }); } });
  } else if (t < TL.jump) {
    // B · siempre baja
    const lt = t - TL.how; const p0 = V3(700, 1400, 300); const p = flyPath(lt, p0, .35, 1.0); placeGlider(p, .35, 0, 0); focus = p.clone().add(V3(0, 3.5, 0));
    camOrbit(focus, lerp(30, 26, lt / 1.7), .35 + Math.PI * .5 - 2.2, .08, 42);
    for (let i = 0; i < 600; i++) { const q = flyPath(lt - i / 600 * 6, p0, .35, 1.0).add(V3(0, 4, 0)); const f = (1 - i / 600) * .35; P.push(q.x, q.y, q.z, AIR[0] * f, AIR[1] * f, AIR[2] * f); } P.mat.size = .5;
    hud.push(() => { question('¿CÓMO, SI UN PARAPENTE', 'SIEMPRE BAJA?', smooth(0, .3, lt), 470); vario(-1.1, 1400 - lt, smooth(.3, .6, lt)); stamp('SIEMPRE BAJA', W / 2, 1500, smooth(.6, .85, lt), -.08); });
  } else if (t < TL.ridge) {
    // C · vista de pájaro: sube en una térmica, planea a la siguiente
    const lt = t - TL.jump; const u = clamp(lt / (TL.ridge - TL.jump) * 1.05); P.mat.size = 22;
    THS.forEach((c, i) => thermalCol(c, 2200, t, .8, c.y + 1700, i * 3000)); hotDisc.material.opacity = .6; P.mat.size = 40;
    const gp = xcPath(Math.max(.02, u)); placeGlider(gp, 0, 0, 0); glider.scale.setScalar(16);
    for (let i = 0; i < 1400; i++) { const q = xcPath(u * i / 1400); const f = 1.6 * (.3 + .7 * i / 1400); P.push(q.x, q.y + 5, q.z, 1.6 * f, .9 * f, .45 * f); }
    focus = V3(2900, 1450, -100); camOrbit(focus, lerp(6600, 6000, lt / 2.5), -1.3 + lt * .02, .2, 42);
    hud.push(() => { titleHUD('SALTANDO DE UNA CORRIENTE', 'DE AIRE QUE SUBE A OTRA', smooth(.1, .4, lt), 1460); });
  } else if (t < TL.therm) {
    // D · dinámica: el viento choca con la ladera y sube
    const lt = t - TL.ridge; const zz = Math.sin(lt * .22) * 160; const x = -330; const gp = V3(x, Ht(x, zz) + 70 + Math.sin(lt * .5) * 2, zz);
    placeGlider(gp, Math.PI / 2 * Math.sign(Math.cos(lt * .22)) * -1 + Math.PI, .12, 0);
    for (let i = 0; i < 7000; i++) { const s = P.seed, k = i * 4; const age = fract(s[k] + t * .12); const z = (s[k + 1] - .5) * 900; const off = 4 + s[k + 2] * 160;
      const px = lerp(900, -700, age); const lift = smooth(500, -500, px) * off * .4; const py = Ht(px, z) + off + lift; const f = .9 * Math.sin(age * Math.PI);
      P.push(px, py, z, AIR[0] * f, AIR[1] * f, AIR[2] * f); } P.mat.size = lerp(14, 2.5, smooth(TL.dyn - .5, TL.dyn + 1.2, t));
    focus = gp.clone().add(V3(0, 3, 0)); const wide = smooth(TL.dyn - .5, TL.dyn + 1.2, t);
    camOrbit(focus.clone().lerp(V3(-200, Ht(-200, 0) + 60, 0), 1 - wide), lerp(1300, 32, wide), lerp(.25, 1.05, wide) + lt * .01, lerp(.12, .08, wide), 42);
    hud.push(() => { titleHUD('EL VIENTO CHOCA CON LA LADERA', 'Y SOLO PUEDE SUBIR', inA(lt, .1, TL.dyn - TL.ridge), 1460);
      if (lt < TL.dyn - TL.ridge) arrowXY(980, 1150, 620, 1150, smooth(.4, 1.2, lt) * (1 - smooth(TL.dyn - TL.ridge - .3, TL.dyn - TL.ridge, lt)), '#7fd4ff', 12);
      titleHUD('DINÁMICA', 'HORAS SOBRE LA MISMA MONTAÑA', smooth(TL.dyn - TL.ridge + .2, TL.dyn - TL.ridge + .5, lt), 1460);
      vario(.6, Math.round(gp.y), smooth(TL.dyn - TL.ridge + .6, TL.dyn - TL.ridge + 1, lt)); });
  } else if (t < TL.faster) {
    // E · térmicas: burbujas de aire caliente; subes girando y sales hacia la siguiente
    const lt = t - TL.therm; const TH0 = THS[0]; hotDisc.material.opacity = smooth(TL.therm - .2, TL.therm + .5, t);
    // burbujas: anillos de partículas que suben
    for (let i = 0; i < 6000; i++) { const s = P.seed, k = i * 4; const b = Math.floor(s[k + 3] * 4); const age = fract(b * .25 + t * .09); const h = TH0.y + age * 1700;
      const a = s[k + 1] * 6.283, cz = s[k + 2] * 2 - 1, rr = Math.cbrt(fract(s[k + 1] * 7.31 + s[k + 2] * 3.7)) * (110 + age * 70), sx = Math.sqrt(1 - cz * cz); const f = .55 * (1 - age * .8) * smooth(0, .1, age); const w = clamp(1 - age * 1.3);
      P.push(TH0.x + Math.cos(a) * sx * rr, h + cz * rr * .8, TH0.z + Math.sin(a) * sx * rr, lerp(AIR[0], WARM[0], w) * f, lerp(AIR[1], WARM[1], w) * f, lerp(AIR[2], WARM[2], w) * f); }
    const c0 = TL.climb, out = c0 + 1.9; const ang = (t - c0) * .55; const base = TH0.y + 900;
    if (t < c0) { P.mat.size = 30; focus = TH0.clone().add(V3(0, 700, 0)); camOrbit(focus, lerp(2700, 2400, lt / 3.7), -1.25, lerp(.1, .18, lt / 3.7), 42); glider.visible = false; }
    else { P.mat.size = 3; let gp, hd, bank;
      if (t < out) { gp = TH0.clone().add(V3(Math.cos(ang) * 45, 0, Math.sin(ang) * 45)); gp.y = base + 3 * (t - c0); hd = -ang; bank = -.32; }
      else { const a0 = (out - c0) * .55; const s0 = TH0.clone().add(V3(Math.cos(a0) * 45, base + 3 * (out - c0) - TH0.y, Math.sin(a0) * 45)); const dir = V3(1, 0, .15).normalize(); const d = (t - out) * 14 * smooth(out, out + .4, t);
        gp = s0.clone().addScaledVector(dir, d); gp.y -= d / 9; hd = Math.atan2(-dir.z, dir.x); bank = -.32 * (1 - smooth(out, out + .5, t)); }
      placeGlider(gp, hd, bank, 0); focus = gp.clone().add(V3(0, 4, 0));
      if (t < out) { const o = V3(Math.cos(ang - .25), 0, Math.sin(ang - .25)); camera.position.copy(TH0).setY(gp.y + 12).addScaledVector(o, 80); camera.lookAt(focus.clone().lerp(TH0.clone().setY(gp.y), .12)); }
      else { camOrbit(focus, 26, hd + Math.PI * .5 - 2.6, .1, 44); } }
    hud.push(() => { titleHUD('TÉRMICAS', 'BURBUJAS DE AIRE CALIENTE', inA(lt, .2, TL.climb - TL.therm), 1460);
      vario(t < out ? 3.0 : -1.1, Math.round(TH0.y + 900 + 3 * Math.min(Math.max(0, t - c0), out - c0)), smooth(c0 + .1, c0 + .4, t));
      titleHUD('SUBES GIRANDO…', 'Y SALES HACIA LA SIGUIENTE', smooth(c0 + .2, c0 + .5, t), 1460); });
  } else if (t < TL.wind) {
    // F · el acelerador: barra con los pies → ala más plana → 38 → 50+ km/h; bajas más deprisa; correr o flotar
    const lt = t - TL.faster; const push = smooth(TL.bar + .9, TL.nose + .9, t) * (1 - smooth(TL.choose + .6, TL.choose + 1.4, t) * .0);
    const v = lerp(38, 52, smooth(TL.nose + .5, TL.nose + 3.2, t)); const sink = lerp(1.1, 1.9, smooth(TL.nose + .5, TL.nose + 3.2, t));
    const p0 = V3(900, 1600, 900); const p = flyPath(lt, p0, 1.2, 1.0, 10.5 + lt * .4 * smooth(TL.nose, TL.nose + 2, t)); placeGlider(p, 1.2, Math.sin(t * .8) * .03, 0);
    speedBar.visible = barLines.visible = true; setBar(push); wingRig.rotation.z = -.13 * push; wingRig.position.x = .5 * push; rebuild = false;
    const close = smooth(TL.bar - .3, TL.bar + .5, t) * (1 - smooth(TL.nose + 1.6, TL.nose + 2.6, t));
    focus = GW(V3(lerp(-.3, .2, close), lerp(4.5, 3.9, close), 0));
    camOrbit(focus, lerp(16, 15, close), 1.2 - Math.PI * .5 - lerp(2.6, Math.PI / 2 + .25, close) + lt * .01, lerp(.15, .05, close), 42);
    if (t > TL.choose) { const k = smooth(TL.choose, TL.choose + 1.5, t); camOrbit(focus, lerp(16, 60, k), 1.2 - Math.PI * .5 - 2.6 + lt * .01, lerp(.15, .3, k), 42); }
    for (let i = 0; i < 2500; i++) { const s = P.seed, k = i * 4; const age = fract(s[k] + t * (.9 + push * .5)); const q = GW(V3(lerp(30, -40, age), (s[k + 1] - .5) * 18 + 4, (s[k + 2] - .5) * 26)); const f = .25 * Math.sin(age * Math.PI);
      P.push(q.x, q.y, q.z, AIR[0] * f, AIR[1] * f, AIR[2] * f); } P.mat.size = .08;
    hud.push(() => { question('¿Y CÓMO VAS', 'MÁS RÁPIDO?', inA(lt, 0, TL.bar - TL.faster + .2));
      callout(GW(V3(lerp(.62, .95, push), -.42, .22)), 180, -60, 'ACELERADOR', 'lo empujas con los pies', inA(t, TL.bar + .2, TL.nose + .4));
      titleHUD('BAJA EL BORDE DE DELANTE', 'EL ALA VA MÁS PLANA', inA(t, TL.nose, TL.nose + 2.6), 1460);
      speedo(v, smooth(TL.nose + .2, TL.nose + .5, t));
      vario(-sink, null, smooth(TL.sink - .1, TL.sink + .2, t)); stamp('BAJAS MÁS DEPRISA', W / 2, 1500, inA(t, TL.sink + .2, TL.choose, .25), -.08);
      titleHUD('EN CADA TRAMO DECIDES', '¿CORRER O FLOTAR?', smooth(TL.choose + .1, TL.choose + .4, t), 1460); });
  } else if (t < TL.line) {
    // G · viento a favor: velocidad sobre el suelo = aire + viento
    const lt = t - TL.wind; const p0 = V3(-200, 1900, -300); const p = flyPath(lt, p0, -.05, 1.1, 18.9); placeGlider(p, -.05, 0, 0); focus = p.clone().add(V3(0, 4, 0));
    camOrbit(focus, lerp(40, 70, lt / 5.5), -.05 + Math.PI * .5 - 2.4, lerp(.1, .35, lt / 5.5), 42);
    const wk = smooth(.3, 1.2, lt); for (let i = 0; i < 4000; i++) { const s = P.seed, k = i * 4; const age = fract(s[k] + t * .6); const q = p.clone().add(V3(lerp(-160, 160, age) + (s[k + 3] - .5) * 40, (s[k + 1] - .5) * 80, (s[k + 2] - .5) * 160)); const f = .35 * wk * Math.sin(age * Math.PI);
      P.push(q.x, q.y, q.z, AIR[0] * f, AIR[1] * f, AIR[2] * f); } P.mat.size = .9;
    hud.push(() => { titleHUD('EL MEJOR ALIADO', 'EL VIENTO A FAVOR', inA(lt, .1, TL.plus - TL.wind), 1460);
      const a = smooth(TL.plus - TL.wind, TL.plus - TL.wind + .3, lt); const y0 = 300; if (a > .01) { g2.save(); g2.globalAlpha = a * .55; g2.fillStyle = '#05080d'; g2.fillRect(120, y0 - 70, 840, 350); g2.restore();
        txt('TU VELOCIDAD EN EL AIRE', 160, y0, 26, { align: 'left', spacing: 4, alpha: a, fill: '#e3a372' }); txt('38 km/h', 920, y0, 44, { align: 'right', font: 'Montserrat', weight: 800, alpha: a });
        const b = smooth(TL.plus - TL.wind + .8, TL.plus - TL.wind + 1.1, lt); txt('+ VIENTO', 160, y0 + 90, 26, { align: 'left', spacing: 4, alpha: b, fill: '#7fd4ff' }); txt('+30 km/h', 920, y0 + 90, 44, { align: 'right', font: 'Montserrat', weight: 800, alpha: b, fill: '#7fd4ff' });
        const c = smooth(TL.plus - TL.wind + 1.8, TL.plus - TL.wind + 2.1, lt); g2.save(); g2.globalAlpha = c * .7; g2.fillStyle = '#e3a372'; g2.fillRect(160, y0 + 140, 760, 3); g2.restore();
        txt('SOBRE EL SUELO', 160, y0 + 200, 26, { align: 'left', spacing: 4, alpha: c, fill: '#e3a372' }); txt('68 km/h', 920, y0 + 200, 60, { align: 'right', font: 'Montserrat', weight: 800, alpha: c, fill: copperGrad(600, 940, y0 + 200, .6) }); } });
  } else if (t < TL.brazil) {
    // H · calles de nubes
    const lt = t - TL.line; streets.visible = true; cumulus.visible = false; cumuli.forEach(c => c.visible = false); const form = smooth(TL.line, TL.streets + .6, t); streets.material.opacity = .9 * form;
    const st = smooth(TL.straight - .6, TL.straight + .4, t); const p0 = V3(9800, 1500, 400); const p = flyPath(t - TL.line, p0, Math.PI, -.4, 13); placeGlider(p, Math.PI, 0, 0); glider.scale.setScalar(lerp(14, 1, st));
    for (let i = 0; i < 4000; i++) { const s = P.seed, k = i * 4; const row = Math.floor(s[k + 3] * 3); const age = fract(s[k] + t * .05); const x = 1200 + s[k + 1] * 11500; const z = (row - 1) * 1500 + 400 + (s[k + 2] - .5) * 500;
      const f = .3 * form * Math.sin(age * Math.PI) * (1 - st); P.push(x, lerp(600, 2300, age), z, WARM[0] * f, WARM[1] * f, WARM[2] * f); } P.mat.size = 26 * (1 - st) + 2;
    if (st < .5) { focus = V3(6500, 1900, 400); camOrbit(focus, lerp(9500, 8000, lt / 5), -2.0 + lt * .02, lerp(.25, .32, lt / 5), 42); }
    else { focus = p.clone().add(V3(0, 4, 0)); camera.position.copy(p).add(V3(34, 5, 12)); camera.lookAt(focus.clone().add(V3(-60, 4, 0))); camera.fov = 50; }
    hud.push(() => { titleHUD('CUANDO EL VIENTO', 'PONE LAS NUBES EN FILA', inA(lt, .1, TL.streets - TL.line), 1460);
      titleHUD('CALLES DE NUBES', 'KILÓMETROS DE AIRE QUE SUBE', inA(t, TL.streets + .1, TL.straight), 1460);
      titleHUD('AQUÍ SE VUELA', 'SIN GIRAR', smooth(TL.straight + .2, TL.straight + .5, t), 1460); vario(1.5, null, smooth(TL.straight + .3, TL.straight + .6, t)); });
  } else if (t < TL.you) {
    // I · récords en Brasil: más de 10 horas en el aire
    const lt = t - TL.brazil; const p0 = V3(2500, 2300, 1200); const p = flyPath(lt, p0, 2.2, .3, 12); placeGlider(p, 2.2, Math.sin(t) * .04, 0); focus = p.clone().add(V3(0, 4, 0));
    camOrbit(focus, lerp(45, 120, lt / 4.5), 2.2 + Math.PI * .5 - 2.2 + lt * .03, lerp(.05, .2, lt / 4.5), 42); expo = lerp(1, .8, lt / 4.5);
    hud.push(() => { titleHUD('ASÍ SE BATEN LOS RÉCORDS', 'EN BRASIL', smooth(.1, .4, lt), 330);
      bigStat('TIEMPO EN EL AIRE', '+10 h', 640, smooth(1.4, 1.7, lt), .3 + lt * .2);
      const a = smooth(2.4, 2.8, lt); if (a > .01) { const k = smooth(2.5, 4.3, lt); const x0 = 180, x1 = 900, y = 1480; g2.save(); g2.globalAlpha = a * .5; g2.strokeStyle = '#fff'; g2.lineWidth = 3; g2.beginPath(); g2.moveTo(x0, y); g2.lineTo(x1, y); g2.stroke();
        g2.globalAlpha = a; g2.strokeStyle = '#e3a372'; g2.lineWidth = 8; g2.shadowColor = '#e3a372'; g2.shadowBlur = 18; g2.beginPath(); g2.moveTo(x0, y); g2.lineTo(lerp(x0, x1, k), y); g2.stroke(); g2.fillStyle = '#ffe2c0'; g2.beginPath(); g2.arc(lerp(x0, x1, k), y, 14, 0, 7); g2.fill(); g2.restore();
        txt('MAÑANA', x0, y + 50, 26, { spacing: 4, alpha: a }); txt('ATARDECER', x1, y + 50, 26, { spacing: 4, alpha: a * smooth(.8, 1, k) }); } });
  } else if (t < TL.brand) {
    // J · pregunta a la comunidad
    const lt = t - TL.you; const p0 = V3(1500, 2200, 900); const p = flyPath(lt, p0, 2.6, .4); placeGlider(p, 2.6, .12, 0); focus = p.clone().add(V3(0, 4, 0));
    camOrbit(focus.clone().add(V3(0, 1.5, 0)), lerp(24, 32, lt / 5.3), 2.6 + Math.PI * .5 - 1.0 + lt * .04, .02, 42);
    hud.push(() => { titleHUD('¿Y TÚ?', '¿TU VUELO MÁS LARGO?', smooth(.1, .4, lt), 330); txt('CUÉNTANOSLO EN COMENTARIOS ↓', W / 2, 1520, 34, { font: 'Montserrat', weight: 800, alpha: smooth(1.6, 2, lt), fill: '#e3a372', spacing: 2 }); });
  } else {
    // K · marca
    const lt = t - TL.brand; const p = flyPath(lt, V3(1500, 2200, 900), 2.6, .6); placeGlider(p, 2.6, .1, 0); focus = p.clone().add(V3(0, 4, 0));
    camOrbit(focus, 60 + lt * 5, 2.6 + Math.PI * .5 - 2.4, .1, 42); expo = .85; fade = Math.min(.5, lt * .45);
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  if (rebuild) buildWing(); else if (wingState._last !== 1) { buildWing(); } wingState._last = rebuild ? 0 : 1;
  updateLines(); P.end();
  camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); skyDome.position.copy(camera.position); lightAt(focus || glider.position);
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
function renderCover() { renderFrame(TL.jump + 1.6); coverText('¿500 KM', 'EN PARAPENTE?', 'Sin motor y en un solo día'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
