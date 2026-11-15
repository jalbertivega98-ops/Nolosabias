// NO LO SABÍAS — «¿Qué sueña tu perro?» (perro 3D de cuerpo entero, salón de noche, tarjetas de datos con fuente)
// Coren (Psychology Today): ~20 min hasta el primer sueño; perros pequeños sueñan más a menudo (≈ cada 10 min), grandes menos (≈ cada 90 min) pero más largo.
// Jouvet & Delorme 1965: gatos sin la atonía del REM (lesión en el puente) «representan» sus sueños: acechan y saltan dormidos.
// Louie & Wilson 2001 (Neuron, MIT): las neuronas de lugar de ratas repiten en REM la secuencia del laberinto recorrido despiertas.
// Kis et al. 2017 (Scientific Reports, Budapest): tras aprender órdenes nuevas cambia el EEG del sueño y lo recuerdan mejor después.
// Deirdre Barrett (Harvard, 2016): probablemente sueñan con su dueño.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, V3, g2, camera, txt, copperGrad, project, titleHUD, drawBrand, coverText, finish, fract } from '../../lib/core.js';
import { scene, bg, floor, dog, key, inA, flashAt, stamp, question, cite, bands, big, label, person } from '../../perros3d/render/stage.js';
import { TAU, BLUE, COP, RED, GREEN, look, orbit, place, roll, glow, ring, panel, heart } from '../../perros3d/render/extras.js';

const CUTS = ['dream', 'cycle', 'brake', 'jouvet', 'leak', 'rats', 'learn', 'size', 'you', 'wake', 'ask'];
const FUR = new THREE.Color().setRGB(.82, .50, .22, THREE.SRGBColorSpace);

// ---------- salón de noche ----------
const ROOM = new THREE.Group(); scene.add(ROOM);
const std = (c, r = .9, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, emissive: c, emissiveIntensity: e });
// pared del fondo con ventana (luz de luna)
const wall = new THREE.Mesh(new THREE.PlaneGeometry(160, 70), new THREE.ShaderMaterial({ depthWrite: true, uniforms: { uMoon: { value: 1 } },
  vertexShader: `varying vec2 vU; void main(){ vU=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform float uMoon; varying vec2 vU; void main(){ vec2 p=vU*vec2(160.,70.)-vec2(80.,0.);
    vec3 c=mix(vec3(.010,.022,.050),vec3(.020,.040,.085),smoothstep(0.,60.,p.y));
    vec2 w=p-vec2(-24.,30.); vec2 hw=vec2(9.,13.);
    float inside=step(abs(w.x),hw.x)*step(abs(w.y),hw.y);
    float mull=1.-step(.45,abs(w.x))*step(.45,abs(w.y));
    vec3 sky=mix(vec3(.10,.17,.32),vec3(.22,.33,.55),smoothstep(-13.,13.,w.y));
    float moon=smoothstep(2.6,2.2,length(w-vec2(4.,6.))); sky+=vec3(.9,.92,1.)*moon*1.4; sky+=vec3(.3,.4,.6)*exp(-length(w-vec2(4.,6.))*.25)*.6;
    c=mix(c,sky*(1.-mull*.85)*uMoon,inside);
    float frame=step(abs(w.x),hw.x+.8)*step(abs(w.y),hw.y+.8)*(1.-inside); c=mix(c,vec3(.05,.07,.12),frame);
    c+=vec3(.18,.24,.4)*exp(-length((w)/vec2(18.,22.)))*.12*uMoon;
    float base=step(p.y,3.); c=mix(c,vec3(.03,.05,.09),base);
    gl_FragColor=vec4(c,1.); }` }));
wall.position.set(0, 0, -34); wall.position.y = 35 - .01; ROOM.add(wall);
// sofá (azul oscuro) a la derecha del fondo
{ const m = std(0x1a2c55, .95, .06); const sofa = new THREE.Group(); const box = (w, h, d, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); sofa.add(b); };
  box(30, 6, 11, 0, 3, 0); box(30, 11, 3.5, 0, 9, -4.5); box(3.5, 9, 11, -15.5, 4.5, 0); box(3.5, 9, 11, 15.5, 4.5, 0);
  for (const x of [-7.2, 7.2]) { const c = new THREE.Mesh(new THREE.BoxGeometry(14, 2.2, 9), std(0x22386a, .95, .05)); c.position.set(x, 7.1, .6); sofa.add(c); }
  sofa.position.set(20, 0, -24); sofa.rotation.y = -.15; ROOM.add(sofa); }
// lámpara de pie (luz cálida)
const LAMP = new THREE.Group(); { const m = std(0x2a2a30, .5); const pole = new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, 22, 10), m); pole.position.y = 11; LAMP.add(pole);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, .5, 24), m); base.position.y = .25; LAMP.add(base);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.6, 4, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0xffc58a, emissive: 0xe3a372, emissiveIntensity: 1.1, side: THREE.DoubleSide, roughness: .8 })); shade.position.y = 23; LAMP.add(shade); }
LAMP.position.set(-14, 0, -20); ROOM.add(LAMP);
const lampLight = new THREE.PointLight(0xffb070, 900, 90, 1.5); lampLight.position.set(-14, 21, -18); ROOM.add(lampLight);
const fill = new THREE.PointLight(0xffc89a, 200, 60, 1.6); fill.position.set(6, 22, 16); ROOM.add(fill);
const moonLight = new THREE.DirectionalLight(0x9fbfff, .9); moonLight.position.set(-30, 40, -40); ROOM.add(moonLight);
// planta
{ const pot = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 1.7, 4, 20), std(0xb9b2a6, .8)); pot.position.set(-26, 2, -26); ROOM.add(pot);
  const lm = std(0x1f5a3a, .8, .05); for (let i = 0; i < 9; i++) { const l = new THREE.Mesh(new THREE.ConeGeometry(.9, 9, 6), lm); const a = i / 9 * TAU; l.position.set(-26 + Math.cos(a) * 1.2, 7.5 + (i % 3), -26 + Math.sin(a) * 1.2); l.rotation.set(Math.sin(a) * .35, 0, -Math.cos(a) * .35); ROOM.add(l); } }
// alfombra redonda con anillos cobre
function rugTex() { const cv = document.createElement('canvas'); cv.width = cv.height = 512; const x = cv.getContext('2d'); x.fillStyle = '#1b2a4a'; x.beginPath(); x.arc(256, 256, 255, 0, 7); x.fill();
  for (const [r, c, w] of [[240, '#e3a372', 6], [222, '#7a4e2e', 3], [150, '#2a3d66', 40], [80, '#e3a372', 3]]) { x.strokeStyle = c; x.lineWidth = w; x.beginPath(); x.arc(256, 256, r, 0, 7); x.stroke(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; }
const rug = new THREE.Mesh(new THREE.CircleGeometry(20, 64), new THREE.MeshStandardMaterial({ map: rugTex(), roughness: 1, transparent: true }));
rug.rotation.x = -Math.PI / 2; rug.position.set(.3, .05, .6); ROOM.add(rug);
// cama del perro: cojín (toro) + base
const BED = new THREE.Group(); { const fab = new THREE.MeshStandardMaterial({ color: 0x6b3a22, roughness: .95 }); const inner = new THREE.MeshStandardMaterial({ color: 0x5a4636, roughness: 1 });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(10.5, 1.5, 20, 64), fab); rim.rotation.x = -Math.PI / 2; rim.position.y = 1.1; BED.add(rim);
  const bot = new THREE.Mesh(new THREE.CylinderGeometry(10.2, 10.2, .7, 48), inner); bot.position.y = .35; BED.add(bot); }
BED.scale.set(.95, 1, 1.12); BED.position.set(.3, 0, .6); ROOM.add(BED);

// párpados (ojos cerrados al dormir)
const LIDS = []; { const D = dog.head; const r = D.B.eyeR; const lm = new THREE.MeshStandardMaterial({ color: FUR, roughness: .9 }); const cm = new THREE.MeshBasicMaterial({ color: 0x1a0c06 });
  for (const piv of D.eyes) { const g = new THREE.Group(); g.position.copy(piv.position); D.head.add(g);
    const lid = new THREE.Mesh(new THREE.SphereGeometry(r * 1.32, 32, 20), lm); lid.scale.set(1, .92, .75); lid.position.z = r * .12; g.add(lid);
    const cr = new THREE.Mesh(new THREE.TorusGeometry(r * .82, r * .07, 8, 24, Math.PI), cm); cr.rotation.z = Math.PI; cr.position.z = r * 1.1; cr.scale.x = 1.25; cr.scale.y = .45; g.add(cr);
    LIDS.push(g); } }
function eyes(closed) { for (const g of LIDS) g.visible = closed; }

// perro dormido de lado en la cama; paddle = intensidad del pataleo (0..1)
function sleep(t, paddle = 0, o = {}) {
  const ph = t * (7 + 3 * paddle); const breath = Math.sin(t * 2.0) * .04;
  dog.pose({ walk: { ph, amp: .12 + .75 * paddle }, headPitch: .25 + (o.lift || 0) * -.5, headRoll: 0, ear: -.2 + .25 * paddle * Math.sin(t * 9), tail: { ph: t * 6, amp: .08 * paddle, up: -.2 } });
  roll(dog, Math.PI / 2 - .05, 0, 0, 0); dog.root.position.y += .5; dog.body.scale.set(1, 1 + breath, 1 + breath * .5);
  const tw = o.twitch || 0; dog.head.nose.scale.setScalar(1 + tw * .06 * Math.max(0, Math.sin(t * 23))); eyes(true);
}

// ---------- HUD ----------
const ZZ = (t, a, x, y) => { for (let i = 0; i < 3; i++) { const u = fract(t * .35 + i / 3); txt('z', x + u * 90 + i * 10, y - u * 220, 40 + u * 40, { font: 'Montserrat', weight: 800, alpha: a * Math.sin(u * Math.PI), fill: BLUE }); } };
function card(y, h, a) { panel(80, y, 920, h, a); g2.save(); g2.globalAlpha = a * .5; g2.strokeStyle = COP; g2.lineWidth = 2; g2.beginPath(); g2.roundRect(80, y, 920, h, 26); g2.stroke(); g2.restore(); }
function line(pts, col, a, lw = 6, blur = 16) { if (a <= .01 || pts.length < 2) return; g2.save(); g2.globalAlpha = a; g2.strokeStyle = col; g2.lineWidth = lw; g2.lineJoin = 'round'; g2.lineCap = 'round'; g2.shadowColor = col; g2.shadowBlur = blur; g2.beginPath(); pts.forEach(([x, y], i) => i ? g2.lineTo(x, y) : g2.moveTo(x, y)); g2.stroke(); g2.restore(); }
function partial(pts, k) { if (k >= 1) return pts; const L = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); tot += d; }
  let r = tot * Math.max(0, k); const out = [pts[0]]; for (let i = 1; i < pts.length; i++) { if (r >= L[i - 1]) { out.push(pts[i]); r -= L[i - 1]; } else { const u = r / L[i - 1]; out.push([lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)]); break; } } return out; }
// hipnograma: despierto → profundo → REM a los ~20 min
function hypno(lt, a) { const y0 = 1250; card(y0, 470, a); if (a <= .01) return;
  const X0 = 300, X1 = 940, Y = { aw: y0 + 110, rem: y0 + 210, deep: y0 + 330 };
  label('DESPIERTO', 270, Y.aw + 8, a, '#fff', 22, 'right'); label('REM', 270, Y.rem + 8, a, BLUE, 26, 'right'); label('PROFUNDO', 270, Y.deep + 8, a, '#fff', 22, 'right');
  const xm = (m) => X0 + (X1 - X0) * m / 30;
  const P = [[xm(0), Y.aw], [xm(2), Y.aw], [xm(5), Y.deep], [xm(19), Y.deep], [xm(20), Y.rem], [xm(26), Y.rem], [xm(27), Y.deep], [xm(30), Y.deep]];
  const k = easeInOut(smooth(.3, 3.6, lt)); line(partial(P, k), COP, a, 6);
  const rk = smooth(2.4, 2.9, lt); g2.save(); g2.globalAlpha = a * rk * .35; g2.fillStyle = BLUE; g2.fillRect(xm(20), Y.rem - 30, xm(26) - xm(20), 60); g2.restore();
  for (let m = 0; m <= 30; m += 10) txt(m + ' min', xm(m), y0 + 420, 22, { alpha: a * .7, spacing: 1 });
  txt('≈ 20 MIN', xm(20), Y.rem - 52, 30, { font: 'Montserrat', weight: 800, alpha: a * rk, fill: BLUE }); }
// candado
function lock(x, y, s, a, k, col = COP) { if (a <= .01) return; g2.save(); g2.translate(x, y); g2.scale(s, s); g2.globalAlpha = a; g2.strokeStyle = col; g2.fillStyle = 'rgba(10,20,36,.9)'; g2.lineWidth = 9; g2.shadowColor = col; g2.shadowBlur = 20;
  g2.beginPath(); g2.arc(0, -30 - 22 * (1 - k), 34, Math.PI, 0); g2.lineTo(34, -10 - 22 * (1 - k)); g2.moveTo(-34, -30 - 22 * (1 - k)); g2.lineTo(-34, -10); g2.stroke();
  g2.beginPath(); g2.roundRect(-52, -14, 104, 84, 12); g2.fill(); g2.stroke(); g2.beginPath(); g2.arc(0, 18, 9, 0, 7); g2.fillStyle = col; g2.fill(); g2.restore(); }
// gato (silueta) saltando
function cat(x, y, s, a, j, col = BLUE) { if (a <= .01) return; g2.save(); g2.translate(x, y - Math.sin(j * Math.PI) * 120); g2.rotate(-.35 * Math.sin(j * Math.PI * 2) * .6); g2.scale(s, s); g2.globalAlpha = a; g2.fillStyle = 'rgba(10,20,36,.85)'; g2.strokeStyle = col; g2.lineWidth = 5; g2.shadowColor = col; g2.shadowBlur = 18;
  g2.beginPath(); g2.ellipse(0, 0, 70, 30, 0, 0, 7); g2.fill(); g2.stroke();
  g2.beginPath(); g2.arc(78, -22, 26, 0, 7); g2.fill(); g2.stroke();
  g2.beginPath(); g2.moveTo(64, -40); g2.lineTo(70, -66); g2.lineTo(82, -46); g2.moveTo(88, -46); g2.lineTo(100, -64); g2.lineTo(100, -38); g2.stroke();
  const st = Math.sin(j * Math.PI); for (const [lx, d] of [[40, 1], [-45, -1]]) { g2.beginPath(); g2.moveTo(lx, 20); g2.lineTo(lx + d * 30 * st + 10 * d, 60 - 20 * st); g2.stroke(); }
  g2.beginPath(); g2.moveTo(-68, -6); g2.quadraticCurveTo(-120, -10, -112, -70); g2.stroke(); g2.restore(); }
// laberinto con recorrido (despierta en cobre, dormida en azul)
const MAZE = [[0, 0], [0, 2], [1, 2], [1, 1], [2, 1], [2, 3], [3, 3], [3, 0], [4, 0], [4, 3]];
function maze(lt, a) { const y0 = 1240; card(y0, 500, a); if (a <= .01) return; const cs = 120, ox = 300, oy = y0 + 70;
  g2.save(); g2.globalAlpha = a * .35; g2.strokeStyle = '#fff'; g2.lineWidth = 3; for (let i = 0; i <= 5; i++) { g2.beginPath(); g2.moveTo(ox + i * cs - cs / 2, oy - cs / 2 + 10); g2.lineTo(ox + i * cs - cs / 2, oy + 3 * cs + cs / 2 - 10); g2.stroke(); } g2.restore();
  const P = MAZE.map(([c, r]) => [ox + c * cs, oy + r * cs]);
  const k1 = easeInOut(smooth(.6, 3.0, lt)), k2 = easeInOut(smooth(3.6, 6.0, lt));
  line(partial(P, k1), COP, a, 12, 18); line(partial(P, k2), BLUE, a, 5, 22);
  const dot = (k, col) => { const q = partial(P, k).at(-1); g2.save(); g2.globalAlpha = a; g2.fillStyle = col; g2.shadowColor = col; g2.shadowBlur = 24; g2.beginPath(); g2.arc(q[0], q[1], 14, 0, 7); g2.fill(); g2.restore(); };
  if (k1 > 0 && k1 < 1) dot(k1, COP); if (k2 > 0) dot(k2, BLUE);
  txt('DESPIERTA', 230, y0 + 470, 26, { font: 'Montserrat', weight: 800, alpha: a * smooth(.6, 1, lt), fill: COP, align: 'left' });
  txt('DORMIDA', 850, y0 + 470, 26, { font: 'Montserrat', weight: 800, alpha: a * smooth(3.6, 4, lt), fill: BLUE, align: 'right' }); }
// pasos: aprende → duerme → recuerda
function steps(lt, a) { const y0 = 1300; card(y0, 380, a); if (a <= .01) return; const xs = [250, 540, 830];
  const ic = [(x, y, k) => { txt('¡SIT!', x, y + 10, 46, { font: 'Montserrat', weight: 800, alpha: k, fill: COP }); },
    (x, y, k) => { ZZ(lt, k, x - 40, y + 40); txt('☾', x, y + 14, 70, { alpha: k, fill: BLUE }); },
    (x, y, k) => { txt('✓', x, y + 18, 80, { font: 'Montserrat', weight: 800, alpha: k, fill: GREEN }); }];
  const lab = ['APRENDE ÓRDENES', 'DUERME', 'LAS RECUERDA MEJOR'];
  xs.forEach((x, i) => { const k = a * smooth(.4 + i * 1.3, .8 + i * 1.3, lt); ring(x, y0 + 140, 78, [COP, BLUE, GREEN][i], k * .9, 4); ic[i](x, y0 + 140, k); txt(lab[i], x, y0 + 290, 23, { font: 'Montserrat', weight: 800, alpha: k, spacing: 1 });
    if (i) { const kk = a * smooth(.2 + i * 1.3, .6 + i * 1.3, lt); txt('→', (x + xs[i - 1]) / 2, y0 + 155, 44, { alpha: kk, fill: '#fff' }); } }); }
// sueños según el tamaño (90 min)
function sizes(lt, a) { const y0 = 1240; card(y0, 500, a); if (a <= .01) return; const X0 = 220, X1 = 940; const xm = (m) => X0 + (X1 - X0) * m / 90;
  const r1 = y0 + 150, r2 = y0 + 340; const k = smooth(.4, 3.2, lt);
  txt('PEQUEÑO', 160, r1 - 60, 26, { font: 'Montserrat', weight: 800, alpha: a, fill: BLUE, align: 'left' }); txt('cada ~10 min', 940, r1 - 60, 24, { alpha: a, align: 'right' });
  txt('GRANDE', 160, r2 - 60, 26, { font: 'Montserrat', weight: 800, alpha: a * smooth(2.4, 2.8, lt), fill: COP, align: 'left' }); txt('cada ~90 min, más largo', 940, r2 - 60, 24, { alpha: a * smooth(2.4, 2.8, lt), align: 'right' });
  for (const r of [r1, r2]) line([[X0, r], [X1, r]], 'rgba(255,255,255,.35)', a, 2, 0);
  g2.save(); g2.globalAlpha = a; g2.shadowBlur = 16;
  for (let m = 10; m <= 90; m += 10) { if (m / 90 > k) break; g2.fillStyle = BLUE; g2.shadowColor = BLUE; g2.fillRect(xm(m) - 18, r1 - 22, 36, 44); }
  const k2 = smooth(2.8, 4.2, lt); if (k2 > 0) { g2.fillStyle = COP; g2.shadowColor = COP; g2.fillRect(xm(90) - 150 * k2, r2 - 26, 150 * k2, 52); }
  g2.restore(); txt('0', X0, y0 + 460, 22, { alpha: a * .6 }); txt('90 min', X1, y0 + 460, 22, { alpha: a * .6 }); }
// burbuja de sueño sobre la cabeza
function bubble(lt, a, hx, hy) { if (a <= .01) return; const cx = W / 2 + 40, cy = 640, R = 250;
  for (let i = 0; i < 3; i++) { const u = (i + 1) / 4; const k = a * smooth(.1 + i * .15, .3 + i * .15, lt); g2.save(); g2.globalAlpha = k; g2.fillStyle = 'rgba(159,216,255,.18)'; g2.strokeStyle = BLUE; g2.lineWidth = 3; g2.beginPath(); g2.arc(lerp(hx, cx, u), lerp(hy, cy + R, u), 14 + i * 12, 0, 7); g2.fill(); g2.stroke(); g2.restore(); }
  const k = a * smooth(.5, .9, lt); if (k <= .01) return; g2.save(); g2.globalAlpha = k; const gr = g2.createRadialGradient(cx, cy, 20, cx, cy, R); gr.addColorStop(0, 'rgba(40,70,120,.85)'); gr.addColorStop(1, 'rgba(8,16,34,.9)'); g2.fillStyle = gr; g2.strokeStyle = BLUE; g2.lineWidth = 5; g2.shadowColor = BLUE; g2.shadowBlur = 30; g2.beginPath(); g2.arc(cx, cy, R, 0, 7); g2.fill(); g2.stroke(); g2.restore();
  g2.save(); g2.beginPath(); g2.arc(cx, cy, R - 6, 0, 7); g2.clip();
  // parque → olores → tú
  const s1 = inA(lt, .6, 2.6, .4), s2 = inA(lt, 2.4, 4.2, .4), s3 = smooth(4.0, 4.5, lt);
  if (s1 > .01) { g2.globalAlpha = k * s1; g2.fillStyle = '#2f6b45'; g2.beginPath(); g2.ellipse(cx, cy + 190, 320, 130, 0, 0, 7); g2.fill(); for (const [x, h] of [[-120, 120], [90, 150]]) { g2.fillStyle = '#245236'; g2.beginPath(); g2.arc(cx + x, cy + 40 - h * .4, 60, 0, 7); g2.fill(); g2.fillStyle = '#5a3b22'; g2.fillRect(cx + x - 8, cy + 40 - h * .4 + 40, 16, 70); }
    const bx = cx + Math.sin(lt * 3) * 120; g2.fillStyle = '#c8e04a'; g2.beginPath(); g2.arc(bx, cy + 60 - Math.abs(Math.sin(lt * 6)) * 80, 20, 0, 7); g2.fill(); txt('SU PARQUE', cx, cy - 150, 30, { font: 'Montserrat', weight: 800, alpha: k * s1 }); }
  if (s2 > .01) { for (let i = 0; i < 4; i++) { g2.globalAlpha = k * s2 * .9; g2.strokeStyle = COP; g2.lineWidth = 5; g2.shadowColor = COP; g2.shadowBlur = 14; g2.beginPath(); const x = cx - 120 + i * 80; for (let j = 0; j <= 20; j++) { const yy = cy + 120 - j * 12; const xx = x + Math.sin(j * .6 + lt * 3 + i) * 16; j ? g2.lineTo(xx, yy) : g2.moveTo(xx, yy); } g2.stroke(); } g2.shadowBlur = 0; txt('SUS OLORES', cx, cy - 150, 30, { font: 'Montserrat', weight: 800, alpha: k * s2 }); }
  g2.restore();
  if (s3 > .01) { person(cx, cy + 60, 1.05, k * s3, COP); for (let i = 0; i < 3; i++) { const u = fract(lt * .5 + i / 3); heart(cx - 120 + i * 120, cy - 40 - u * 120, .9, k * s3 * Math.sin(u * Math.PI)); } txt('TÚ', cx, cy - 165, 40, { font: 'Montserrat', weight: 800, alpha: k * s3, fill: copperGrad(cx - 60, cx + 60, cy - 165, .5) }); } }

// ---------- fotograma ----------
function renderFrame(t) {
  g2.clearRect(0, 0, W, H);
  let flash = 0; for (const c of CUTS) flash = Math.max(flash, flashAt(t, TL[c], .22, .28));
  const hud = []; let fade = 0, expo = 1; const U = floor.material.uniforms; U.uGrid.value = 0; U.uOff.value.set(0, 0); U.uCompass.value = 0; U.uR.value = 34;
  bg.material.uniforms.uWarm.value = .15; key.intensity = 1.3; key.color.setHex(0xb8ccff); lampLight.intensity = 900; fill.intensity = 200; wall.material.uniforms.uMoon.value = 1;
  dog.body.scale.set(1, 1, 1); dog.head.nose.scale.setScalar(1);
  const zHead = () => { const p = dog.head.head.localToWorld(V3(0, 1.2, 0)); return project(p); };
  if (t < TL.dream) {
    // A · dormido… y patalea
    const lt = t; const pd = smooth(1.2, 1.8, lt); sleep(t, pd, { twitch: pd });
    orbit(lerp(.45, .6, lt / 4), lerp(58, 50, lt / 4), 24, 2.5, 1, -.5);
    hud.push(() => { question('CUANDO TU PERRO', 'PATALEA DORMIDO…', smooth(0, .25, t), 280); const h = zHead(); ZZ(t, 1 - pd, h.x + 30, h.y - 40); });
  } else if (t < TL.cycle) {
    // B · está soñando (primer plano de la cara)
    const lt = t - TL.dream; sleep(t, .5, { twitch: 1 }); const h = dog.head.head.localToWorld(V3(0, 0, 0));
    look(h.x + 16, h.y + 7, h.z + 14, h.x, h.y, h.z - 1, 30);
    hud.push(() => { stamp('ESTÁ SOÑANDO', W / 2, 1500, smooth(.4, .6, lt), -.05, BLUE, 60); });
  } else if (t < TL.brake) {
    // C · ciclo de sueño: profundo → REM ≈ 20 min
    const lt = t - TL.cycle; sleep(t, .0); orbit(lerp(.55, .7, lt / 7), 70, 34, 2, 1, 0); expo = .9;
    hud.push(() => { const a = smooth(0, .3, lt); label('DUERME COMO TÚ', W / 2, 250, a, COP, 28); big('FASES DEL SUEÑO', 330, a, '#fff', 58); hypno(lt, a); cite('Stanley Coren · Psychology Today', a); const h = zHead(); ZZ(t, a, h.x + 30, h.y - 40); });
  } else if (t < TL.jouvet) {
    // D · el freno: músculos bloqueados
    const lt = t - TL.brake; sleep(t, 0); orbit(lerp(.9, .8, lt / 5), 56, 16, 3, 1, 0); expo = .85;
    hud.push(() => { const a = smooth(0, .3, lt); label('EN LA FASE REM', W / 2, 250, a, COP, 28); big('EL CEREBRO PONE', 320, a, '#fff', 54); big('UN FRENO', 395, a, null, 66);
      lock(W / 2, 1480, 1.6, smooth(.8, 1.1, lt), easeOut(smooth(1.6, 2.1, lt))); txt('MÚSCULOS BLOQUEADOS', W / 2, 1680, 38, { font: 'Montserrat', weight: 800, alpha: smooth(2.0, 2.3, lt), fill: COP, spacing: 2 }); });
  } else if (t < TL.leak) {
    // E · Jouvet: gatos sin freno cazan dormidos
    const lt = t - TL.jouvet; sleep(t, 0); orbit(lerp(.6, .7, lt / 7), 80, 40, 1, 1, 0); expo = .55; lampLight.intensity = 500; fill.intensity = 200;
    hud.push(() => { const a = smooth(0, .3, lt); label('AÑOS 60 · LYON', W / 2, 250, a, COP, 28); big('GATOS SIN FRENO', 330, a, '#fff', 60);
      card(1240, 480, a); lock(260, 1430, .9, a, 1 - easeOut(smooth(1.0, 1.6, lt)), RED); const j = fract(Math.max(0, lt - 2.8) / 1.6); cat(640, 1560, 1.35, a * smooth(2.6, 3.0, lt), lt > 2.8 ? j : 0);
      txt('DORMIDOS… CAZABAN', W / 2, 1690, 34, { font: 'Montserrat', weight: 800, alpha: smooth(3.2, 3.5, lt), fill: BLUE, spacing: 1 }); cite('Jouvet & Delorme · 1965', a); });
  } else if (t < TL.rats) {
    // F · en tu perro el freno se escapa: patas, hocico, ladridos
    const lt = t - TL.leak; const pd = .6 + .4 * Math.max(0, Math.sin(lt * 1.3)); sleep(t, pd, { twitch: 1 }); orbit(lerp(.4, .55, lt / 6), 50, 18, 2.5, 1, -.5);
    hud.push(() => { const a = smooth(0, .3, lt); label('EN TU PERRO', W / 2, 250, a, COP, 28); big('EL FRENO SE ESCAPA', 330, a, '#fff', 56);
      const paw = project(dog.root.localToWorld(V3(1.4, 1, 2.6))); const nose = project(dog.head.nose.localToWorld(V3(0, 0, 0)));
      const tag = (s, p, dx, dy, k) => { if (k <= .01) return; line([[p.x, p.y], [p.x + dx, p.y + dy]], COP, k, 3, 8); ring(p.x, p.y, 16, COP, k, 3); txt(s, p.x + dx, p.y + dy + (dy < 0 ? -14 : 40), 32, { font: 'Montserrat', weight: 800, alpha: k, fill: '#fff', spacing: 2 }); };
      tag('PATAS', paw, 120, 260, smooth(1.4, 1.7, lt)); tag('HOCICO', nose, 150, -230, smooth(2.3, 2.6, lt));
      for (let i = 0; i < 3; i++) { const u = fract((lt - 3.0) * .7 + i / 3); if (lt > 3) txt('wuf', nose.x - 140 - u * 60, nose.y + 40 - u * 120, 30 + u * 14, { font: 'Montserrat', weight: 800, alpha: Math.sin(u * Math.PI) * .9, fill: BLUE }); }
      txt('PEQUEÑOS LADRIDOS', W / 2, 1640, 34, { font: 'Montserrat', weight: 800, alpha: smooth(3.4, 3.7, lt), fill: BLUE, spacing: 1 }); });
  } else if (t < TL.learn) {
    // G · MIT 2001: las ratas repiten el laberinto dormidas
    const lt = t - TL.rats; sleep(t, .3); orbit(lerp(.5, .6, lt / 8), 76, 44, 1, 1, 0); expo = .6;
    hud.push(() => { const a = smooth(0, .3, lt); label('¿Y QUÉ SUEÑA?', W / 2, 220, a, BLUE, 30); label('2001 · MIT', W / 2, 290, smooth(.5, .8, lt), COP, 28); big('REPETÍAN EL LABERINTO', 365, smooth(.5, .8, lt), '#fff', 50); maze(lt, smooth(.5, .8, lt)); cite('Louie & Wilson · Neuron, 2001', smooth(.5, .8, lt)); });
  } else if (t < TL.size) {
    // H · Budapest 2017: repasa su día
    const lt = t - TL.learn; sleep(t, .2); orbit(lerp(.95, .8, lt / 7), 60, 24, 2.5, 1, 0); expo = .85;
    hud.push(() => { const a = smooth(0, .3, lt); label('2017 · BUDAPEST', W / 2, 250, a, COP, 28); big('REPASA SU DÍA', 330, a, '#fff', 62); steps(lt, a); cite('Kis et al. · Scientific Reports, 2017', a); });
  } else if (t < TL.you) {
    // I · el tamaño importa
    const lt = t - TL.size; sleep(t, .4); orbit(lerp(.6, .7, lt / 7), 72, 36, 2, 1, 0); expo = .7;
    hud.push(() => { const a = smooth(0, .3, lt); label('EL TAMAÑO IMPORTA', W / 2, 250, a, COP, 28); big('¿CADA CUÁNTO SUEÑA?', 330, a, '#fff', 54); sizes(lt, a); cite('Stanley Coren · Psychology Today', a); });
  } else if (t < TL.wake) {
    // J · sueña con su parque, sus olores… y contigo
    const lt = t - TL.you; sleep(t, .35, { twitch: .5 }); orbit(lerp(.9, .8, lt / 6), 62, 10, 6, 1, 0); bg.material.uniforms.uWarm.value = .35;
    hud.push(() => { const h = zHead(); bubble(lt, 1, h.x, h.y - 30); const a = smooth(4.0, 4.4, lt); label('SEGÚN DEIRDRE BARRETT · HARVARD', W / 2, 1560, a, COP, 24); big('PROBABLEMENTE, CONTIGO', 1640, a, null, 50); cite('Deirdre Barrett · Universidad de Harvard', a); });
  } else if (t < TL.ask) {
    // K · no le despiertes de golpe
    const lt = t - TL.wake; const pd = .5 * (1 - smooth(1.0, 2.6, lt)); sleep(t, pd); orbit(lerp(.5, .65, lt / 4), lerp(56, 50, lt / 4), 18, 2.5, 1, -.5); expo = .8; lampLight.intensity = 700;
    hud.push(() => { const a = smooth(0, .3, lt); question('SI PATALEA, NO LE', 'DESPIERTES DE GOLPE', a, 280); stamp('DÉJALE TERMINAR', W / 2, 1520, smooth(2.2, 2.4, lt), -.05, BLUE, 52); const h = zHead(); ZZ(t, smooth(2.0, 2.6, lt), h.x + 30, h.y - 40); });
  } else if (t < TL.brand) {
    // L · se despierta y te mira: pregunta
    const lt = t - TL.ask; eyes(false); place(dog, 2, -1, -.25); dog.pose({ down: 1, headPitch: -.1, headYaw: .15 + Math.sin(lt * 1.5) * .1, ear: .4, tail: { ph: t * 14, amp: .55, up: .3 } }); dog.root.position.y = .45;
    orbit(lerp(.25, .15, lt / 3), 58, 12, 4, -1, 2); bg.material.uniforms.uWarm.value = .35;
    hud.push(() => { const a = smooth(.1, .4, lt); question('¿EL TUYO TAMBIÉN', 'PATALEA CUANDO SUEÑA?', a, 280); txt('CUÉNTANOSLO EN COMENTARIOS ↓', W / 2, 1560, 34, { font: 'Montserrat', weight: 800, alpha: smooth(1.2, 1.6, lt), fill: COP, spacing: 2 }); });
  } else {
    const lt = t - TL.brand; eyes(false); place(dog, 2, -1, -.25); dog.pose({ down: 1, headPitch: -.1, headYaw: .15, ear: .4, tail: { ph: t * 14, amp: .5, up: .3 } }); dog.root.position.y = .45;
    orbit(.15 + lt * .03, 58 + lt * 2, 12 + lt * .3, 4, -1, 2);
    expo = .85; fade = Math.min(.72, lt * .6); hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  U.uC.value.set(.3, .6);
  camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); bg.position.copy(camera.position); scene.updateMatrixWorld(true);
  if (t < TL.brand) bands(.5);
  for (const h of hud) h();
  finish(scene, { t, flash, fade, bloom: .4, expo, grain: .03 });
}
function renderCover() { renderFrame(TL.you + 4.6); coverText('¿QUÉ SUEÑA', 'TU PERRO?', 'Por qué patalea dormido y con quién sueña'); }
window.renderCover = () => { renderCover(); return true; };
window.DBG = () => { const bb = new THREE.Box3().setFromObject(dog.body); console.log("body", JSON.stringify(bb.min), JSON.stringify(bb.max)); const hb = new THREE.Box3().setFromObject(dog.head.root); console.log("head", JSON.stringify(hb.min), JSON.stringify(hb.max)); LIDS.forEach(g => { const w = g.getWorldPosition(new THREE.Vector3()); console.log("lid", g.visible, JSON.stringify(w)); }); dog.head.eyes.forEach(e => console.log("eye", JSON.stringify(e.getWorldPosition(new THREE.Vector3())))); };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
