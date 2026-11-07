// NO LO SABÍAS — "¿Cómo viaja internet por la fibra óptica?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final. Esquema, no a escala.
// Fibra monomodo: núcleo ≈ 9 µm, revestimiento 125 µm (≈ grosor de un pelo). Reflexión total interna (n_núcleo > n_revest.). v ≈ c/1,47 ≈ 204 000 km/s.
// Atenuación ≈ 0,2 dB/km. WDM: decenas de longitudes de onda por fibra. Cables submarinos: > 1,4 millones de km; ~99 % del tráfico intercontinental.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3, g2, camera, Particles, txt, copperGrad, project, callout, titleHUD, fract, camOrbit, bigStat, drawBrand, coverText, finish, noise1, arrowXY, bar, renderer } from '../../lib/core.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const scene = new THREE.Scene(); const BG = new THREE.Color(0x02060e); scene.background = BG;
{ const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .4; }
const hemi = new THREE.HemisphereLight(0x80b0ff, 0x101820, 1.0); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xd0e8ff, 1.6); sun.position.set(20, 60, 30); scene.add(sun);
const M = (c, r = .6, m = 0, e = 0, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r, metalness: m, emissive: e }, extra));
const R = rng(51);
const canvasTex = (w, h, draw, rep) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; };
const LIGHT = [1.2, 2.0, 3.0], RED = [3.0, .5, .4];
const COLS = [[3, .4, .4], [3, 1.6, .3], [2.4, 2.8, .4], [.4, 3, .8], [.4, 1.8, 3], [1.8, .6, 3]];

// ==========================================================================
// FONDO MARINO con cable
// ==========================================================================
const sea = new THREE.Group(); scene.add(sea);
const sandTex = canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#3a3828'; x.fillRect(0, 0, w, h); for (let i = 0; i < 6000; i++) { const v = 40 + R() * 50 | 0; x.fillStyle = `rgba(${v + 10},${v + 8},${v - 6},.5)`; x.fillRect(R() * w, R() * h, 2, 2); } }, [12, 12]);
const bedGeo = new THREE.PlaneGeometry(600, 600, 120, 120); { const p = bedGeo.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, noise1(p.getX(i) * .03) * 2 + noise1(p.getY(i) * .04 + 7) * 2); bedGeo.computeVertexNormals(); }
const bed = new THREE.Mesh(bedGeo, M(0xffffff, .95, 0, 0, { map: sandTex })); bed.rotation.x = -Math.PI / 2; sea.add(bed);
const cablePts = []; for (let i = 0; i <= 60; i++) { const z = 60 - i * 8; cablePts.push(V3(Math.sin(i * .25) * 6 + noise1(i * .3) * 4, 1.2 + noise1(i * .5 + 3) * .6 + 1.2, z)); }
const cableCurve = new THREE.CatmullRomCurve3(cablePts);
const cableM = M(0x3a4250, .45, .3);
const cable = new THREE.Mesh(new THREE.TubeGeometry(cableCurve, 400, 1.2, 16), cableM); sea.add(cable);
// tiburón low-poly
const shark = new THREE.Group(); sea.add(shark);
const sharkM = new THREE.MeshStandardMaterial({ color: 0x8a8a86, roughness: .6, flatShading: true });
{ const body = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), sharkM); body.scale.set(2.2, 2.2, 9); shark.add(body);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8, 0, Math.PI * 2, Math.PI * .55, Math.PI * .45), new THREE.MeshStandardMaterial({ color: 0xc8ccd0, roughness: .7, flatShading: true })); belly.scale.set(2.15, 2.15, 8.8); shark.add(belly);
  const fin = (w, h, x, y, z, rx, rz) => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(w, 0); s.lineTo(w * .2, h); s.lineTo(0, 0); const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: .25, bevelEnabled: false }), sharkM); m.position.set(x, y, z); m.rotation.set(rx, Math.PI / 2, rz); shark.add(m); return m; };
  fin(4, 4, 0, 1.6, 1.5, 0, 0); const tl = fin(3.6, 5, 0, .2, -8.2, 0, 0); tl.rotation.z = .3; const tl2 = fin(3, 3.6, 0, -.2, -8.4, 0, 0); tl2.rotation.set(Math.PI, Math.PI / 2, .3);
  const pf1 = fin(3, 2.4, 1.6, -1, 2, 0, 0); pf1.rotation.set(0, Math.PI / 2 - .3, -2.2); const pf2 = fin(3, 2.4, -1.6, -1, 2, 0, 0); pf2.rotation.set(0, Math.PI / 2 + .3, 2.2);
  const eyeM = new THREE.MeshBasicMaterial({ color: 0x050505 }); for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.22, 8, 6), eyeM); e.position.set(s * 1.25, .5, 6.8); shark.add(e); } }
const jaw = new THREE.Mesh(new THREE.BoxGeometry(2.2, .5, 2.2), sharkM); jaw.position.set(0, -1.2, 7.4); shark.add(jaw);

// ==========================================================================
// FIBRA (escala exagerada): núcleo, revestimiento, recubrimiento; pelo para comparar; láser
// ==========================================================================
const fib = new THREE.Group(); scene.add(fib);
const FL = 120;
const coreM = new THREE.MeshPhysicalMaterial({ color: 0xbfe6ff, roughness: .05, transparent: true, opacity: .35, emissive: 0x0a2840, depthWrite: false });
const cladM = new THREE.MeshPhysicalMaterial({ color: 0x8ab8d8, roughness: .1, transparent: true, opacity: .14, depthWrite: false, side: THREE.DoubleSide });
const coatM = new THREE.MeshStandardMaterial({ color: 0x3a6ab0, roughness: .5, transparent: true, opacity: .0, depthWrite: false, side: THREE.DoubleSide });
const CR = .7, CLR = 2.0;
const core = new THREE.Mesh(new THREE.CylinderGeometry(CR, CR, FL, 32, 1, true), coreM); core.rotation.z = Math.PI / 2; fib.add(core);
const clad = new THREE.Mesh(new THREE.CylinderGeometry(CLR, CLR, FL, 48, 1, true), cladM); clad.rotation.z = Math.PI / 2; fib.add(clad);
const coat = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, FL, 48, 1, true), coatM); coat.rotation.z = Math.PI / 2; fib.add(coat);
const endCap = new THREE.Mesh(new THREE.RingGeometry(CR, CLR, 48), new THREE.MeshBasicMaterial({ color: 0x4a7aa8, transparent: true, opacity: .5, side: THREE.DoubleSide })); endCap.rotation.y = Math.PI / 2; endCap.position.x = -FL / 2; fib.add(endCap);
const coreCap = new THREE.Mesh(new THREE.CircleGeometry(CR, 32), new THREE.MeshBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: .6, side: THREE.DoubleSide })); coreCap.rotation.y = Math.PI / 2; coreCap.position.x = -FL / 2 + .01; fib.add(coreCap);
const laser = new THREE.Group(); laser.position.set(-FL / 2 - 5, 0, 0); fib.add(laser);
const lBody = new THREE.Mesh(new THREE.BoxGeometry(6, 3.4, 3.4), M(0x2a2e36, .4, .6)); laser.add(lBody);
const lNose = new THREE.Mesh(new THREE.CylinderGeometry(.8, 1.2, 1.6, 24), M(0xc8ccd4, .3, .9)); lNose.rotation.z = -Math.PI / 2; lNose.position.x = 3.6; laser.add(lNose);
const lLed = new THREE.Mesh(new THREE.CircleGeometry(.5, 16), new THREE.MeshBasicMaterial({ color: 0xff3020 })); lLed.position.set(-1.5, 1.71, 0); lLed.rotation.x = -Math.PI / 2; laser.add(lLed);
const hairG = new THREE.Group(); fib.add(hairG); const hair = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, FL, 24, 1, true), M(0x7a5232, .5, 0)); hair.rotation.z = Math.PI / 2; hairG.add(hair);
const scaleTex = canvasTex(256, 64, (x, w, h) => { x.fillStyle = '#5a3a22'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(30,18,8,.6)'; x.lineWidth = 2; for (let i = 0; i < 18; i++) { x.beginPath(); x.moveTo(i * 15, 0); x.quadraticCurveTo(i * 15 + 8, h / 2, i * 15, h); x.stroke(); } }, [1, 12]); hair.material.map = scaleTex; hair.material.color.setHex(0xffffff);
// rayo en zigzag (reflexión total) — trazado de puntos en el plano xy
function zigzag(x0, len, ang, phase = 0) { const pts = []; const r = CR * .92; const dx = 2 * r / Math.tan(ang); let x = x0, y = -r + phase * 2 * r, dir = 1; pts.push(V3(x, y, 0)); while (x < x0 + len) { const ny = dir > 0 ? r : -r; const nx = x + Math.abs(ny - y) / (2 * r) * dx; pts.push(V3(nx, ny, 0)); x = nx; y = ny; dir = -dir; } return pts; }
function polyAt(pts, d) { let acc = 0; for (let i = 0; i < pts.length - 1; i++) { const l = pts[i].distanceTo(pts[i + 1]); if (acc + l >= d) return pts[i].clone().lerp(pts[i + 1], (d - acc) / l); acc += l; } return pts[pts.length - 1].clone(); }
const polyLen = pts => { let a = 0; for (let i = 0; i < pts.length - 1; i++) a += pts[i].distanceTo(pts[i + 1]); return a; };
const rayM = new THREE.LineBasicMaterial({ color: 0x9ad8ff, transparent: true, opacity: 0 }); const rayGeo = new THREE.BufferGeometry(); rayGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * 4000), 3)); const setRay = (pts, al = 1) => { for (let i = 0; i < pts.length; i++) { const f = al * 1.3 * (.35 + .65 * i / pts.length); P.push(pts[i].x, pts[i].y, pts[i].z, LIGHT[0] * f, LIGHT[1] * f, LIGHT[2] * f); } setRayL(pts); }; const setRayL = pts => { const a = rayGeo.attributes.position; const n = Math.min(pts.length, 4000); for (let i = 0; i < n; i++) a.setXYZ(i, pts[i].x, pts[i].y, pts[i].z); a.needsUpdate = true; rayGeo.setDrawRange(0, n); rayGeo.computeBoundingSphere(); }; const ray = new THREE.Line(rayGeo, rayM); fib.add(ray);

// ==========================================================================
// OCÉANO EN CORTE (transparencia) y GLOBO con cables
// ==========================================================================
const ocean = new THREE.Group(); scene.add(ocean);
const waterCol = new THREE.Mesh(new THREE.BoxGeometry(40, 110, 30), new THREE.MeshStandardMaterial({ color: 0x0a3a6a, transparent: true, opacity: .3, roughness: .2, depthWrite: false, side: THREE.DoubleSide })); waterCol.position.y = -55; ocean.add(waterCol);
const surfGeo = new THREE.PlaneGeometry(40, 30, 40, 30); surfGeo.rotateX(-Math.PI / 2); const surf = new THREE.Mesh(surfGeo, new THREE.MeshStandardMaterial({ color: 0x3a8ac8, roughness: .15, metalness: .2, transparent: true, opacity: .7, side: THREE.DoubleSide })); ocean.add(surf);
const trench = new THREE.Mesh(new THREE.BoxGeometry(40, 4, 30), M(0x2a2620, .95)); trench.position.y = -112; ocean.add(trench);
const boat = new THREE.Mesh(new THREE.ConeGeometry(3, 2, 4), M(0xd8d0c0, .6)); boat.rotation.x = Math.PI; boat.scale.set(1.6, 1, .7); boat.position.set(0, 1, 0); ocean.add(boat);
const sub = new THREE.Mesh(new THREE.CapsuleGeometry(1.2, 4, 6, 12), M(0xe0a020, .4, .4)); sub.rotation.z = Math.PI / 2; sub.position.set(4, -108, 0); ocean.add(sub);
const globe = new THREE.Group(); scene.add(globe);
const gTex = canvasTex(1024, 512, (x, w, h) => { x.fillStyle = '#0a1e3a'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(120,170,230,.18)'; x.lineWidth = 1; for (let i = 0; i <= 12; i++) { x.beginPath(); x.moveTo(0, i * h / 12); x.lineTo(w, i * h / 12); x.stroke(); } for (let i = 0; i <= 24; i++) { x.beginPath(); x.moveTo(i * w / 24, 0); x.lineTo(i * w / 24, h); x.stroke(); }
  const blobs = [[.2, .3, .13, .16], [.27, .62, .07, .16], [.5, .3, .07, .09], [.53, .55, .08, .15], [.68, .32, .17, .13], [.83, .7, .06, .06]]; x.fillStyle = 'rgba(60,90,70,.85)';
  for (const [cx, cy, rx, ry] of blobs) { x.beginPath(); for (let a = 0; a <= 64; a++) { const t = a / 64 * Math.PI * 2; const rr = 1 + .25 * Math.sin(t * 5 + cx * 20) + .15 * Math.sin(t * 9 + cy * 30); const px = cx * w + Math.cos(t) * rx * w * rr, py = cy * h + Math.sin(t) * ry * h * rr; a ? x.lineTo(px, py) : x.moveTo(px, py); } x.fill(); } });
const earth = new THREE.Mesh(new THREE.SphereGeometry(20, 64, 48), new THREE.MeshStandardMaterial({ map: gTex, roughness: .8, emissiveMap: gTex, emissive: 0xffffff, emissiveIntensity: .6 })); globe.add(earth);
const ll = (lat, lon, r = 20.15) => { const p = lat * Math.PI / 180, l = lon * Math.PI / 180; return V3(r * Math.cos(p) * Math.sin(l), r * Math.sin(p), r * Math.cos(p) * Math.cos(l)); };
const ROUTES = [[[40, -74], [50, -5]], [[38, -9], [-23, -43]], [[36, -6], [1, 104]], [[35, 139], [34, -120]], [[22, 114], [-33, 151]], [[51, -8], [42, -70]], [[30, 32], [19, 72]], [[-34, 18], [6, 3]], [[13, 100], [25, 55]], [[47, -53], [55, -8]], [[21, -158], [37, -122]], [[-12, -77], [9, -79]]];
const arcs = ROUTES.map(([a, b]) => { const A = ll(...a), B = ll(...b); const pts = []; for (let i = 0; i <= 64; i++) { const k = i / 64; const p = A.clone().lerp(B, k).normalize().multiplyScalar(20.15); pts.push(p); } return new THREE.CatmullRomCurve3(pts); });
const arcM = new THREE.MeshBasicMaterial({ color: 0xffa050, transparent: true, opacity: 0 }); arcs.forEach(c => globe.add(new THREE.Mesh(new THREE.TubeGeometry(c, 64, .12, 6), arcM)));
const sat = new THREE.Group(); globe.add(sat); { const b = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 2.2), M(0xd8c070, .4, .7)); sat.add(b); for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(5, .1, 1.8), M(0x2a3a7a, .3, .5)); p.position.x = s * 3.4; sat.add(p); } } sat.position.set(6, 27, 8);

// ==========================================================================
// TIMELINE
// ==========================================================================
const P = new Particles(16000, { size: .5, seed: 71 }); scene.add(P.obj);
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
const L = (t, a, b) => smooth(TL[a], TL[a] + .3, t) * (b ? 1 - smooth(TL[b] - .1, TL[b] + .1, t) : 1);
const S = () => P.seed; const tmp = V3();
let CAMD = 60; const cam = (tg, d, az, el, f = 38) => { camOrbit(tg, d, az, el, f); CAMD = d; };
const BITS = [1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1];
function cablePulses(a, t) { if (a <= .01) return; const s = S(); for (let i = 0; i < 1400; i++) { const q = (i % P.n) * 4; const u = fract(s[q] * .2 + Math.floor(i / 70) / 20 + t * .06); const on = BITS[Math.floor(i / 70) % BITS.length]; if (!on) continue; cableCurve.getPointAt(1 - u, tmp); const f = a * 2.2; P.push(tmp.x + (s[q + 1] - .5) * .7, tmp.y + 1.25 + (s[q + 2] - .5) * .2, tmp.z + (s[q + 3] - .5) * .7, LIGHT[0] * f, LIGHT[1] * f, LIGHT[2] * f); } }
function marine(a, t) { if (a <= .01) return; const s = S(); for (let i = 0; i < 700; i++) { const q = ((i + 5000) % P.n) * 4; const f = a * .25 * (.5 + .5 * Math.sin(t * 2 + i)); P.push((s[q] - .5) * 120, s[q + 1] * 50 + Math.sin(t * .3 + i) * .5, 40 - s[q + 2] * 300, .5 * f, .8 * f, 1 * f); } }
function setSea(on) { sea.visible = on; hemi.intensity = on ? 2.4 : 1.0; sun.intensity = on ? 2.6 : 1.6; if (on) { scene.fog = new THREE.FogExp2(0x062238, .008); scene.background = new THREE.Color(0x062238); } else { scene.fog = null; scene.background = BG; } }
function pulsesInCore(a, t, col = LIGHT, lanes = 1, x0 = -FL / 2, spd = 22, dens = 1) { if (a <= .01) return; const s = S();
  for (let k = 0; k < lanes; k++) { const c = lanes > 1 ? COLS[k % COLS.length] : col; const ang = lanes > 1 ? .25 + k * .07 : .32; const zz = zigzag(x0, FL, ang, (k * .37) % 1); const len = polyLen(zz);
    for (let i = 0; i < 520 * dens; i++) { const q = ((i + k * 600) % P.n) * 4; const bit = Math.floor(i / 26); if (!BITS[(bit + k * 3) % BITS.length]) continue; const d = fract((bit / 20 + s[q] * .03) + t * spd / len) * len; const p = polyAt(zz, d); const f = a * 1.8; P.push(p.x, p.y, p.z + (s[q + 1] - .5) * .2, c[0] * f, c[1] * f, c[2] * f); } } }

function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .2; camera.far = 3000;
  let bloomS = .7, flash = 0, ca = .0013, fade = 0, grain = .035, expo = 1.15, dim = 0;
  P.begin(); setSea(false); fib.visible = false; ocean.visible = false; globe.visible = false; hairG.visible = false; laser.visible = false; rayM.opacity = 0; coatM.opacity = 0; cladM.opacity = .14; coreM.opacity = .35; clad.visible = true; shark.visible = false; jaw.position.y = -1.2; arcM.opacity = 0; sat.visible = false;
  for (const c of ['fiber', 'how', 'escape', 'total', 'pure', 'colors', 'curious', 'bite', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];
  if (t < TL.how) {
    // A · gancho: cable en el fondo del mar con pulsos de luz → corte: hilo de vidrio del grosor de un pelo
    if (t < TL.thread + .4) { setSea(true); cablePulses(1, t); marine(1, t); const k = clamp(t / (TL.thread + .4)); cableCurve.getPointAt(lerp(.15, .32, k), tmp); cam(tmp.clone().add(V3(0, 1, 0)), lerp(30, 14, easeInOut(k)), lerp(.6, .9, k), lerp(.35, .15, k)); }
    else { fib.visible = true; hairG.visible = true; coatM.opacity = .12; cladM.opacity = .22; const lt = t - TL.thread - .4; hairG.position.set(0, 7, 0); pulsesInCore(1.4, t);
      cam(V3(-38, 3.5, 0), lerp(34, 40, clamp(lt / 3)), -1.05 + lt * .04, .3); }
    hud.push(() => { titleHUD('ESTE VÍDEO PUEDE HABER CRUZADO', 'EL FONDO DEL MAR…', smooth(.1, .4, t) * (1 - smooth(TL.thread - .1, TL.thread + .1, t)), 300); titleHUD('…DENTRO DE UN HILO DE VIDRIO', 'DEL GROSOR DE UN PELO', L(t, 'thread', 'fiber'), 300); bigStat('', 'FIBRA ÓPTICA', 1560, L(t, 'fiber', 'how'), clamp((t - TL.fiber) / .8));
      const ha = smooth(TL.hair + .4, TL.hair + .7, t) * (1 - smooth(TL.how - .2, TL.how, t)); callout(V3(-44, 9.4, 0), -60, -220, 'PELO', '≈ 0,07 mm', ha, '#c89a70'); callout(V3(-40, -2.6, 0), -80, 240, 'FIBRA', '0,125 mm', ha, '#7ab8ff'); });
  } else if (t < TL.escape) {
    // B · luz: el láser se enciende y se apaga miles de millones de veces por segundo → unos y ceros
    fib.visible = true; laser.visible = true; coatM.opacity = 0; const lt = t - TL.how; pulsesInCore(smooth(TL.light, TL.light + .3, t), t, LIGHT, 1, -FL / 2, 14);
    const on = BITS[Math.floor(t * 6) % BITS.length]; lLed.material.color.setRGB(on ? 1 : .2, on ? .2 : .05, on ? .1 : .03);
    cam(V3(-FL / 2 - 1, 0, 0), lerp(30, 25, clamp(lt / 6)), -.75 + lt * .025, .32); bloomS = .9;
    hud.push(() => { titleHUD('¿CÓMO LLEVA', 'LA INFORMACIÓN?', L(t, 'how', 'light'), 300); titleHUD('CON LUZ: UN LÁSER', 'SE ENCIENDE Y SE APAGA', L(t, 'light', 'billions'), 300); titleHUD('MILES DE MILLONES', 'DE VECES POR SEGUNDO', L(t, 'billions', 'one'), 300);
      const ba = smooth(TL.one, TL.one + .3, t); if (ba > .01) { const n = 10; for (let i = 0; i < n; i++) { const b = BITS[(i + Math.floor(t * 4)) % BITS.length]; const x = W / 2 - 360 + i * 80; txt(String(b), x, 1560, 70, { font: 'Montserrat', weight: 800, alpha: ba * (i < 5 || t > TL.zero ? 1 : .2), fill: b ? '#9ad8ff' : '#3a4a5a' }); } txt('DESTELLO = 1 · APAGÓN = 0', W / 2, 1660, 28, { spacing: 5, alpha: ba, fill: '#e3a372' }); } });
  } else if (t < TL.pure) {
    // C · ¿por qué no se escapa? núcleo + revestimiento → reflexión total, rebote tras rebote, 200 000 km/s
    fib.visible = true; const lt = t - TL.escape; const showClad = smooth(TL.cladding - .2, TL.cladding + .4, t); cladM.opacity = .02 + .2 * showClad;
    const zz = zigzag(-30, 80, .42, 0); const len = polyLen(zz); const front = (t < TL.edge ? 0 : (t - TL.edge) * 9) % len; const pts = [];
    if (t >= TL.edge) { for (let d = Math.max(0, front - 40); d <= front; d += .1) pts.push(polyAt(zz, d)); setRay(pts.length > 1 ? pts : [V3(), V3()]); rayM.opacity = 1; const head = polyAt(zz, front); const s = S(); for (let i = 0; i < 120; i++) { const q = i * 4; const f = 1.6 * (1 - s[q]); P.push(head.x - s[q] * 1.5, head.y + (s[q + 1] - .5) * .3, (s[q + 2] - .5) * .3, LIGHT[0] * f, LIGHT[1] * f, LIGHT[2] * f); } }
    else { // sin revestimiento: un rayo se escapa por el lado
      const k = clamp((t - TL.escape - .3) / 1.6); const a = V3(-30, 0, 0), b = V3(-30 + 6, CR, 0), c = V3(-30 + 14, CR + 10, 0); const pp = [a, b, c]; const L2 = polyLen(pp); const fr = k * L2; const out = []; for (let d = 0; d <= fr; d += .1) out.push(polyAt(pp, d)); const ao = 1 - smooth(TL.core, TL.core + .3, t); setRay(out.length > 1 ? out : [V3(), V3()], ao); rayM.opacity = ao; }
    if (t > TL.advance) pulsesInCore(smooth(TL.advance, TL.advance + .4, t), t, LIGHT, 1, -FL / 2, 20);
    const z = easeInOut(smooth(TL.edge - .2, TL.edge + .6, t)); const head = polyAt(zz, Math.min(front, len)); const fx = t > TL.edge ? head.x : -25;
    cam(V3(lerp(-24, fx, z * (1 - smooth(TL.advance, TL.advance + 1, t))), 0, 0), lerp(lerp(24, 20, clamp(lt / 4)), 16, z) + smooth(TL.advance, TL.speed, t) * 14, lerp(.0, .02, z), lerp(.05, .02, z)); bloomS = .9;
    hud.push(() => { titleHUD('¿Y POR QUÉ LA LUZ NO SE', 'ESCAPA POR LOS LADOS?', L(t, 'escape', 'core'), 300); titleHUD('UN NÚCLEO DE VIDRIO…', '', L(t, 'core', 'cladding'), 300); titleHUD('…RODEADO DE OTRO VIDRIO', 'UN POCO DISTINTO', L(t, 'cladding', 'edge'), 300);
      callout(V3(-20, 0, 0), -40, -230, 'NÚCLEO', null, smooth(TL.core + .2, TL.core + .5, t) * (1 - smooth(TL.edge - .2, TL.edge, t)), '#9ad8ff'); callout(V3(-14, -CLR + .2, 0), 40, 230, 'REVESTIMIENTO', null, smooth(TL.cladding + .2, TL.cladding + .5, t) * (1 - smooth(TL.edge - .2, TL.edge, t)), '#e3a372');
      titleHUD('CUANDO LLEGA MUY INCLINADA…', '…REBOTA ENTERA HACIA DENTRO', L(t, 'edge', 'total'), 300); titleHUD('REFLEXIÓN', 'TOTAL', L(t, 'total', 'advance'), 300); titleHUD('REBOTE', 'TRAS REBOTE', L(t, 'advance', 'speed'), 300);
      bigStat('KILÓMETROS POR SEGUNDO', fmt(Math.round(lerp(0, 200000, easeOut(clamp((t - TL.speed) / 1.2))) / 1000) * 1000), 1580, L(t, 'speed'), .5); });
  } else if (t < TL.colors) {
    // D · tan puro que, si el mar fuera así de transparente, verías el fondo de la fosa más honda
    ocean.visible = true; const lt = t - TL.pure; const clear = smooth(TL.bottom, TL.deep + .8, t); waterCol.material.opacity = lerp(.85, .18, clear); waterCol.material.color.setRGB(lerp(.02, .05, clear), lerp(.12, .25, clear), lerp(.25, .45, clear));
    const p = surf.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, Math.sin(p.getX(i) * .4 + t * 2) * .3 + Math.cos(p.getZ(i) * .5 + t * 1.6) * .3); p.needsUpdate = true;
    const s = S(); for (let i = 0; i < 900 * clear; i++) { const q = i * 4; const y = -s[q] * 110; const f = clear * .6 * (1 - s[q] * .4); P.push((s[q + 1] - .5) * 3, y, (s[q + 2] - .5) * 3, 1.2 * f, 1.6 * f, 2 * f); }
    cam(V3(0, lerp(-38, -38, easeInOut(smooth(TL.sea, TL.deep + 1, t))), 0), lerp(290, 305, clamp(lt / 6)), .5 + lt * .03, .12); bloomS = .8;
    hud.push(() => { titleHUD('EL VIDRIO ES', 'TAN PURO…', L(t, 'pure', 'sea'), 300); titleHUD('SI EL MAR FUERA', 'ASÍ DE TRANSPARENTE…', L(t, 'sea', 'bottom'), 300); titleHUD('PODRÍAS VER EL FONDO', 'DESDE LA SUPERFICIE', L(t, 'bottom', 'deep'), 300); titleHUD('INCLUSO EN LOS', 'PUNTOS MÁS HONDOS', L(t, 'deep'), 300);
      bigStat('PROFUNDIDAD', '11 km', 1600, smooth(TL.deep, TL.deep + .3, t), clamp((t - TL.deep) / 1)); });
  } else if (t < TL.curious) {
    // E · muchos colores de luz por un solo hilo, cada uno con su conversación
    fib.visible = true; const lt = t - TL.colors; const n = Math.round(lerp(1, 6, smooth(TL.colors, TL.many + .4, t))); pulsesInCore(1, t, LIGHT, n, -FL / 2, 20, .8); cladM.opacity = .18;
    cam(V3(0, 0, 0), lerp(36, 26, clamp(lt / 5)), .35 + lt * .06, .25); bloomS = .95;
    hud.push(() => { titleHUD('POR UN SOLO HILO VIAJAN', 'MUCHOS COLORES DE LUZ', L(t, 'colors', 'convo'), 300); titleHUD('CADA UNO CON SU', 'PROPIA CONVERSACIÓN', L(t, 'convo'), 300);
      const ca = smooth(TL.many, TL.many + .3, t); for (let k = 0; k < 6; k++) { const c = COLS[k]; g2.save(); g2.globalAlpha = ca * (k < n ? 1 : .2); g2.fillStyle = `rgb(${Math.min(255, c[0] * 85)},${Math.min(255, c[1] * 85)},${Math.min(255, c[2] * 85)})`; g2.beginPath(); g2.arc(W / 2 - 250 + k * 100, 1580, 26, 0, 7); g2.fill(); g2.restore(); } });
  } else if (t < TL.brand) {
    // F · casi todo internet entre continentes va por cables en el fondo del océano (no por satélite) … y a veces los muerden los tiburones
    const lt = t - TL.curious;
    if (t < TL.sharks - .2) { globe.visible = true; sat.visible = t < TL.cables; arcM.opacity = smooth(TL.cables - .2, TL.cables + .8, t); globe.rotation.y = -1.2 + lt * .12; const s = S();
      if (arcM.opacity > .05) for (let i = 0; i < 1200; i++) { const q = (i % P.n) * 4; const c = arcs[i % arcs.length]; c.getPointAt(fract(s[q] + t * .15 * (i % 2 ? 1 : -1)), tmp); tmp.applyEuler(globe.rotation); const f = arcM.opacity * 1.4; P.push(tmp.x, tmp.y, tmp.z, 2.6 * f, 1.3 * f, .4 * f); }
      cam(V3(0, 3, 0), lerp(118, 105, clamp(lt / 6)), .3, .25); }
    else { setSea(true); shark.visible = true; marine(1, t); cablePulses(1, t); const k = clamp((t - TL.sharks) / (TL.bite - TL.sharks + .2)); cableCurve.getPointAt(.25, tmp); const tgt = tmp.clone();
      shark.position.copy(tgt.clone().add(V3(lerp(-36, -6.5, easeOut(k)), lerp(8, 3.0, easeOut(k)), lerp(14, 0, easeOut(k))))); shark.rotation.set(0, lerp(2.4, Math.PI / 2 + .2, easeOut(k)), Math.sin(t * 6) * .06); shark.position.y += Math.sin(t * 3) * .3;
      const bite = smooth(TL.bite - .1, TL.bite + .1, t) * (1 - smooth(TL.bite + .5, TL.bite + .8, t)); jaw.position.y = -1.2 - (1 - bite) * .9 * smooth(TL.bite - .6, TL.bite - .2, t);
      cam(tgt.clone().add(V3(0, 3, 0)), lerp(62, 50, k), lerp(.9, .6, k), .22); }
    hud.push(() => { titleHUD('LO MÁS CURIOSO:', 'INTERNET ENTRE CONTINENTES…', L(t, 'curious', 'sat'), 300); titleHUD('…NO VA POR', 'SATÉLITE', L(t, 'sat', 'cables'), 300);
      const sa = L(t, 'sat', 'cables'); if (sa > .01) { const p = project(sat.getWorldPosition(V3())); g2.save(); g2.globalAlpha = sa; g2.strokeStyle = '#ff5a3a'; g2.lineWidth = 12; g2.lineCap = 'round'; g2.beginPath(); g2.moveTo(p.x - 60, p.y - 60); g2.lineTo(p.x + 60, p.y + 60); g2.moveTo(p.x + 60, p.y - 60); g2.lineTo(p.x - 60, p.y + 60); g2.stroke(); g2.restore(); }
      titleHUD('VA POR CABLES EN', 'EL FONDO DEL OCÉANO', L(t, 'cables', 'sharks'), 300); bigStat('KILÓMETROS DE CABLE', '+1.000.000', 1580, smooth(TL.million, TL.million + .3, t) * (1 - smooth(TL.sharks - .3, TL.sharks - .1, t)), clamp((t - TL.million) / 1.2));
      titleHUD('Y A VECES…', 'LOS MUERDEN LOS TIBURONES', L(t, 'sharks'), 300); });
  } else {
    // G · marca
    const lt = t - TL.brand; setSea(true); cablePulses(1, t); marine(1, t); cableCurve.getPointAt(.3, tmp); cam(tmp.clone().add(V3(0, 2, 0)), 30 + lt * 3, .7 + lt * .05, .3); dim = smooth(0, .8, lt) * .6; expo = 1.05;
    hud.push(() => drawBrand(lt - .3)); fade = smooth(TL.end - .6, TL.end, t) * .3;
  }
  if (COVER) { P.begin(); setSea(true); sea.visible = true; fib.visible = false; globe.visible = false; ocean.visible = false; shark.visible = true; cablePulses(1, t); marine(1, t); cableCurve.getPointAt(.25, tmp); shark.position.copy(tmp.clone().add(V3(-8, 5, 6))); shark.rotation.set(0, 2.0, 0); cam(tmp.clone().add(V3(0, 8, 0)), 34, .8, .15); }
  P.mat.size = Math.max(.2, CAMD * .0085);
  P.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (dim > 0) hud.unshift(() => { g2.save(); g2.globalAlpha = dim * .7; g2.fillStyle = '#02050b'; g2.fillRect(0, 0, W, H); g2.restore(); });
  if (!COVER) for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
let COVER = false;
function renderCover() { COVER = true; renderFrame(TL.bite + .3); coverText('INTERNET VA', 'BAJO EL MAR', 'La fibra óptica, por dentro'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
