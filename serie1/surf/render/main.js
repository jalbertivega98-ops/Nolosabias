// NO LO SABÍAS — "Los secretos de las olas (surf)"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final.
// Mar de fondo: olas generadas por tormentas lejanas que viajan miles de km durante días.
// Movimiento orbital: el agua describe círculos (que se reducen con la profundidad); viaja la energía, no el agua.
// Rotura: al disminuir la profundidad la base frena y la cresta se adelanta; rompe cuando profundidad ≈ 1,3 × altura (H/d ≈ 0,78).
// Series: superposición de trenes de ondas de periodos parecidos (batido) → grupos de olas.
// Corrientes de retorno: canales estrechos hacia mar adentro; salir nadando en paralelo a la orilla.
// Cera (parafina) de la tabla: da agarre, no velocidad. Récord Guinness: 26,21 m, Sebastian Steudtner, Nazaré (2020). Cañón de Nazaré: hasta ~5 000 m.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3, shake,
  g2, camera, Particles, txt, copperGrad, project, fmt, callout, bar, fract, emitRise, emitJet, arrowXY, bigStat, drawBrand, coverText, finish } from '../../lib/core.js';

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(new THREE.Color(.65, .78, .9), .004);
const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uTop: { value: new THREE.Color(.1, .3, .7) }, uHor: { value: new THREE.Color(.75, .85, .95) }, uSun: { value: V3(-.3, .25, -1).normalize() }, uSunC: { value: new THREE.Color(1, .9, .7) } },
  vertexShader: `varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 uTop,uHor,uSunC,uSun; varying vec3 vD; void main(){ vec3 d=normalize(vD); float y=clamp(d.y,0.,1.); vec3 c=mix(uHor,uTop,pow(y,.5)); float s=max(dot(d,uSun),0.); c+=uSunC*(pow(s,40.)*.6+smoothstep(.9992,.9996,s)*2.); gl_FragColor=vec4(c,1.); }` });
const sky = new THREE.Mesh(new THREE.SphereGeometry(2800, 32, 16), skyMat); sky.renderOrder = -1; scene.add(sky);
const hemi = new THREE.HemisphereLight(0xdfefff, 0x2a4a5a, 1.4); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1dc, 2.6); sun.position.set(-30, 30, -100); scene.add(sun);
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .6, ...o });
const COP = 0xc8743f, NAVY = 0x16243c;

// ==========================================================================
// OCÉANO (olas de Gerstner calculadas en CPU)
// ==========================================================================
const OS = 220, ON = 200; const oGeo = new THREE.PlaneGeometry(OS, OS, ON, ON); oGeo.rotateX(-Math.PI / 2);
const oBase = Float32Array.from(oGeo.attributes.position.array); const oCol = new Float32Array(oBase.length); oGeo.setAttribute('color', new THREE.BufferAttribute(oCol, 3));
const oMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .25, metalness: .05 });
const ocean = new THREE.Mesh(oGeo, oMat); scene.add(ocean);
let WAVES = [];
function setWaves(list) { WAVES = list.map(w => { const d = V3(Math.cos(w.dir), 0, Math.sin(w.dir)); const k = 2 * Math.PI / w.L; return { ...w, dx: d.x, dz: d.z, k, om: Math.sqrt(9.8 * k) * (w.sp || 1) }; }); }
function gerst(x0, z0, t) { let x = x0, y = 0, z = z0; for (const w of WAVES) { const ph = w.k * (w.dx * x0 + w.dz * z0) - w.om * t + (w.ph || 0); const c = Math.cos(ph); x -= (w.Q ?? .6) * w.A * w.dx * c; z -= (w.Q ?? .6) * w.A * w.dz * c; y += w.A * Math.sin(ph); } return V3(x, y, z); }
function waveH(x, z, t) { let y = 0; for (const w of WAVES) y += w.A * Math.sin(w.k * (w.dx * x + w.dz * z) - w.om * t + (w.ph || 0)); return y; }
function oceanUpdate(t, ox = 0, oz = 0, foam = .65, deep = [.02, .16, .28], shallow = [.1, .5, .6]) {
  const p = oGeo.attributes.position; let maxA = 0; for (const w of WAVES) maxA += w.A;
  for (let i = 0; i < p.count; i++) { const x0 = oBase[i * 3] + ox, z0 = oBase[i * 3 + 2] + oz; let x = x0, y = 0, z = z0;
    for (const w of WAVES) { const ph = w.k * (w.dx * x0 + w.dz * z0) - w.om * t + (w.ph || 0); const c = Math.cos(ph); x -= (w.Q ?? .6) * w.A * w.dx * c; z -= (w.Q ?? .6) * w.A * w.dz * c; y += w.A * Math.sin(ph); }
    p.setXYZ(i, x - ox, y, z - oz); const h = maxA > 0 ? clamp((y / maxA + 1) / 2) : .5; const f = smooth(foam, 1, h);
    oCol[i * 3] = lerp(lerp(deep[0], shallow[0], h), .95, f); oCol[i * 3 + 1] = lerp(lerp(deep[1], shallow[1], h), .97, f); oCol[i * 3 + 2] = lerp(lerp(deep[2], shallow[2], h), 1, f); }
  p.needsUpdate = true; oGeo.attributes.color.needsUpdate = true; oGeo.computeVertexNormals(); ocean.position.set(ox, 0, oz); }

// Surfista
function makeSurfer() { const g = new THREE.Group(); const board = new THREE.Mesh(new THREE.CapsuleGeometry(.27, 1.6, 6, 16), M(0xf2efe6, { roughness: .35 })); board.rotation.z = Math.PI / 2; board.scale.set(.12, 1, 1); board.position.y = .03; g.add(board);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.9, .065, .05), M(COP)); stripe.position.y = .04; g.add(stripe);
  const suit = M(0x111318, { roughness: .7 }), skin = M(0xc98d6a);
  const body = new THREE.Group(); g.add(body); const legL = new THREE.Mesh(new THREE.CapsuleGeometry(.08, .6, 4, 8), suit); legL.position.set(.35, .45, 0); legL.rotation.z = .5; body.add(legL);
  const legR = legL.clone(); legR.position.set(-.35, .45, 0); legR.rotation.z = -.5; body.add(legR);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.16, .5, 4, 10), suit); torso.position.set(0, 1.05, 0); torso.rotation.z = .25; body.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.12, 12, 10), skin); head.position.set(-.12, 1.5, 0); body.add(head);
  const armL = new THREE.Mesh(new THREE.CapsuleGeometry(.05, .55, 4, 8), suit); armL.position.set(.35, 1.15, .1); armL.rotation.z = 1.2; body.add(armL);
  const armR = armL.clone(); armR.position.set(-.38, 1.1, -.1); armR.rotation.z = -1.1; body.add(armR);
  g.userData = { body, board }; scene.add(g); return g; }
const surfer = makeSurfer();

// ==========================================================================
// CORTES LATERALES (agua extruida)
// ==========================================================================
const SEC = V3(0, 0, 2000); const sec = new THREE.Group(); sec.position.copy(SEC); scene.add(sec);
const waterMat = new THREE.MeshStandardMaterial({ color: 0x2a9ad0, roughness: .2, transparent: true, opacity: .88, emissive: 0x0d4f75, side: THREE.DoubleSide, depthWrite: false });
const sandMat = M(0xd8b98a, { roughness: .95 });
let waterMesh = null, sandMesh = null, lipMesh = null;
const lipMat = new THREE.MeshStandardMaterial({ color: 0x5cc0e0, roughness: .2, transparent: true, opacity: .92, emissive: 0x1a6a88 });
function setWaterShape(pts, bottom) { const s = new THREE.Shape(); s.moveTo(pts[0].x, bottom); for (const p of pts) s.lineTo(p.x, p.y); s.lineTo(pts[pts.length - 1].x, bottom); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 5, bevelEnabled: false, curveSegments: 1 }); g.translate(0, 0, -2.5); if (waterMesh) { waterMesh.geometry.dispose(); waterMesh.geometry = g; } else { waterMesh = new THREE.Mesh(g, waterMat); sec.add(waterMesh); } }
function setSand(f, x0, x1, bottom) { const s = new THREE.Shape(); s.moveTo(x0, bottom); for (let x = x0; x <= x1 + 1e-6; x += .25) s.lineTo(x, f(x)); s.lineTo(x1, bottom); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 5.2, bevelEnabled: false }); g.translate(0, 0, -2.6); if (sandMesh) { sandMesh.geometry.dispose(); sandMesh.geometry = g; } else { sandMesh = new THREE.Mesh(g, sandMat); sec.add(sandMesh); } }
const buoy = new THREE.Mesh(new THREE.SphereGeometry(.35, 20, 14), M(0xe84a3a, { roughness: .4, emissive: 0x401008 })); sec.add(buoy);

// ==========================================================================
// PLAYA VISTA DESDE ARRIBA (corriente de retorno)
// ==========================================================================
const BEACH = V3(3000, 0, 0); const beach = new THREE.Group(); beach.position.copy(BEACH); scene.add(beach);
{ const sand = new THREE.Mesh(new THREE.PlaneGeometry(200, 60), M(0xe2c896, { roughness: .95 })); sand.rotation.x = -Math.PI / 2; sand.position.set(0, .05, 30); beach.add(sand);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), M(0x1a7fa0, { roughness: .3, emissive: 0x052535 })); sea.rotation.x = -Math.PI / 2; sea.position.set(0, 0, -100); beach.add(sea);
  const ch = new THREE.Mesh(new THREE.PlaneGeometry(9, 60), M(0x0e4f72, { roughness: .3, emissive: 0x021420, transparent: true, opacity: .85 })); ch.rotation.x = -Math.PI / 2; ch.position.set(0, .02, -28); beach.add(ch); }
const swimmer = new THREE.Group(); { const b = new THREE.Mesh(new THREE.CapsuleGeometry(.35, 1.2, 4, 10), M(0xffb070, { emissive: 0x4a2008 })); b.rotation.x = Math.PI / 2; swimmer.add(b); } beach.add(swimmer);
const paddler = makeSurfer(); scene.remove(paddler); beach.add(paddler); paddler.userData.body.visible = false;

// ==========================================================================
// TABLA CON CERA (macro)
// ==========================================================================
const WAX = V3(-3000, 0, 0); const waxG = new THREE.Group(); waxG.position.copy(WAX); scene.add(waxG);
const deck = new THREE.Mesh(new THREE.BoxGeometry(6, .3, 3), M(0xf2efe6, { roughness: .4 })); waxG.add(deck);
const bumps = new THREE.InstancedMesh(new THREE.SphereGeometry(.09, 10, 8), M(0xfff6dd, { roughness: .9 }), 900); { const r = rng(8), d = new THREE.Object3D();
  for (let i = 0; i < 900; i++) { d.position.set((r() - .5) * 5.6, .15, (r() - .5) * 2.8); d.scale.set(1 + r(), .5 + r() * .6, 1 + r()); d.updateMatrix(); bumps.setMatrixAt(i, d.matrix); } waxG.add(bumps); }
const foot = new THREE.Group(); { const skinM = M(0xc98d6a, { roughness: .6 }); const sh = new THREE.Shape(); const P = [[-1.3, 0], [-1.25, .3], [-1, .42], [-.4, .4], [.3, .48], [.85, .55], [1.05, .3], [1.05, -.1], [.9, -.42], [.4, -.45], [-.3, -.33], [-1, -.38], [-1.25, -.28]];
  sh.moveTo(P[0][0], P[0][1]); for (const q of P.slice(1)) sh.lineTo(q[0], q[1]); sh.closePath(); const sg = new THREE.ExtrudeGeometry(sh, { depth: .28, bevelEnabled: true, bevelThickness: .1, bevelSize: .1, bevelSegments: 4, curveSegments: 8 }); sg.rotateX(Math.PI / 2); sg.translate(0, .14, 0);
  foot.add(new THREE.Mesh(sg, skinM)); const toes = [[1.25, .42, .17], [1.27, .14, .13], [1.2, -.1, .12], [1.08, -.3, .11], [.92, -.47, .1]]; for (const [x, z, r] of toes) { const toe = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), skinM); toe.position.set(x, .02, -z); toe.scale.y = .8; foot.add(toe); } } waxG.add(foot);

// ==========================================================================
// CAÑÓN DE NAZARÉ (fondo marino)
// ==========================================================================
const NAZ = V3(0, -3000, 0); const naz = new THREE.Group(); naz.position.copy(NAZ); scene.add(naz);
const VS = 1 / 40; // exageración vertical: 1 unidad = 40 m de profundidad
const depthAt = (x, z) => { const shelf = -lerp(20, 200, smooth(-10, 80, -z)) ; const cw = lerp(6, 25, smooth(0, 120, -z)); const canyon = -5000 * smooth(-5, 140, -z) * Math.exp(-Math.pow((x + Math.sin(z * .03) * 10) / cw, 2)) - 600 * Math.exp(-Math.pow(x / (cw * .5), 2)) * smooth(-15, 0, -z); return (shelf + canyon) + (z > 0 ? 100 + z * 30 : 0); };
{ const g = new THREE.PlaneGeometry(240, 240, 220, 220); g.rotateX(-Math.PI / 2); const p = g.attributes.position; const c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i) - 100; const d = depthAt(x, z); p.setXYZ(i, x, d * VS, z); const k = clamp(-d / 5000);
    const col = d > 0 ? [.45, .5, .3] : [lerp(.75, .05, Math.pow(k, .4)), lerp(.7, .12, Math.pow(k, .4)), lerp(.55, .3, Math.pow(k, .4))]; c.set(col, i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.computeVertexNormals(); naz.add(new THREE.Mesh(g, M(0xffffff, { vertexColors: true, roughness: .9 })));
  const surf = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), new THREE.MeshStandardMaterial({ color: 0x2a8fc0, transparent: true, opacity: .18, roughness: .1, depthWrite: false })); surf.rotation.x = -Math.PI / 2; surf.position.z = -100; naz.add(surf); }

// Partículas
const PS = new Particles(30000, { size: .1, seed: 5 }); scene.add(PS.obj);
const FOAM = [1, 1, 1.05], AQUA = [.5, 1.2, 1.5], HOT = [1.8, .7, .25];

// ==========================================================================
// HUD
// ==========================================================================
function stamp(s, x, y, a, rot = -.08, col = '#ff6a4a', size = 86) { if (a <= .01) return; const sc = lerp(1.6, 1, easeOut(clamp(a * 1.4)));
  g2.save(); g2.translate(x, y); g2.rotate(rot); g2.scale(sc, sc); g2.globalAlpha = clamp(a); g2.strokeStyle = col; g2.lineWidth = 8; g2.shadowColor = col; g2.shadowBlur = 25;
  g2.font = `800 ${size}px Montserrat`; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.letterSpacing = '6px'; const w = g2.measureText(s).width + 70; g2.strokeRect(-w / 2, -size * .8, w, size * 1.6); g2.fillStyle = col; g2.fillText(s, 0, 4); g2.restore(); }
function two(top, l1, l2, a, y = 300) { if (a <= .01) return; txt(l1, W / 2, y, 50, { font: 'Montserrat', weight: 800, alpha: a }); if (l2) txt(l2, W / 2, y + 62, 50, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(160, 920, y + 62, .5) }); if (top) txt(top, W / 2, y - 62, 24, { spacing: 7, alpha: a * .8, fill: '#e3a372' }); }
const win = (t, a, b, f = .3) => smooth(a, a + f, t) * (1 - smooth(b - f, b, t));
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
function curve2(P, f, x0, x1, n, col, size = 1) { for (let i = 0; i <= n; i++) { const x = lerp(x0, x1, i / n); const p = f(x); PS.push(p.x, p.y, p.z, col[0] * size, col[1] * size, col[2] * size); } }

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .05; camera.far = 6000; camera.fov = 42;
  let bloomS = .45, flash = 0, ca = .0013, fade = 0, expo = 1.05, focus = V3();
  PS.begin(); PS.mat.size = .1; oMat.roughness = .25; sun.position.set(-30, 30, -100); skyMat.uniforms.uSunC.value.setRGB(1, .9, .7); for (const g of [sec, beach, waxG, naz]) g.visible = false; ocean.visible = false; surfer.visible = false;
  scene.fog.density = .004; scene.fog.color.setRGB(.65, .78, .9); hemi.intensity = 1.4; sun.intensity = 2.6; skyMat.uniforms.uTop.value.setRGB(.1, .3, .7); skyMat.uniforms.uHor.value.setRGB(.75, .85, .95); skyMat.uniforms.uSunC.value.setRGB(1, .9, .7);
  for (const c of ['storm', 'water', 'why', 'sets', 'back', 'wax', 'big', 'canyon', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];

  if (t < TL.storm) {
    // A · surfista en la ola
    ocean.visible = true; surfer.visible = true; setWaves([{ dir: Math.PI / 2, A: 1.1, L: 34, Q: .8 }, { dir: 1.3, A: .25, L: 9 }, { dir: 2, A: .15, L: 5 }]); oceanUpdate(t);
    const sx = 3 + t * 1.5, sz = 2; const y = waveH(sx, sz, t); surfer.position.set(sx, y + .05, sz); surfer.rotation.set(0, -.3, -.12);
    focus = surfer.position.clone().add(V3(0, .9, 0)); camera.position.copy(focus).add(V3(-3.5 + t * .5, .4, 5.5)); camera.fov = 44; camera.lookAt(focus);
    hud.push(() => two(null, '¿SABES DE DÓNDE', 'VIENE UNA OLA?', smooth(.05, .3, t), 300));
  } else if (t < TL.water) {
    // B · tormenta lejana → mar de fondo
    const lt = t - TL.storm; ocean.visible = true; setWaves([{ dir: Math.PI / 2, A: .5, L: 14, Q: .5, sp: 1 }, { dir: 1.15, A: .3, L: 8 }, { dir: 2.05, A: .25, L: 5.5 }, { dir: .6, A: .12, L: 3 }]); oceanUpdate(t * 2, 0, 0, .8, [.02, .1, .2], [.08, .32, .48]); oMat.roughness = .7; sun.position.set(20, 60, 140);
    skyMat.uniforms.uTop.value.setRGB(.05, .1, .2); skyMat.uniforms.uHor.value.setRGB(.3, .35, .45); scene.fog.density = .002; hemi.intensity = .9; sun.intensity = 1.2;
    camera.position.set(0, lerp(38, 46, clamp(lt / 6)), 40); camera.fov = 52; camera.lookAt(V3(0, 0, -55));
    const C = V3(0, 3, -90); const s = PS.seed;
    for (let i = 0; i < 6000; i++) { const q = i * 4; const r = Math.sqrt(s[q]) * 28; const a = s[q + 1] * 6.283 + t * (1.2 - r / 40) + r * .15; const fl = .85 + .9 * Math.pow(Math.max(0, Math.sin(t * 7.3) * Math.sin(t * 3.1)), 8); PS.push(C.x + Math.cos(a) * r, C.y + s[q + 2] * 6, C.z + Math.sin(a) * r * .6, .7 * fl, .74 * fl, .85 * fl); }
    const sw = smooth(TL.wind - .3, TL.wind + .5, t); for (let ring = 0; ring < 6; ring++) { const rr = fract(t * .12 + ring / 6) * 170; const n = 500; for (let i = 0; i < n; i++) { const a = lerp(.35, Math.PI - .35, i / n) ; const x = C.x + Math.cos(a) * rr, z = C.z + Math.sin(a) * rr; if (z > 95) continue; const f = sw * (1 - rr / 170) * 1.8; PS.push(x, .6, z, f, f * 1.05, f * 1.1); } }
    PS.mat.size = .7; bloomS = .6;
    hud.push(() => { two('TORMENTA', 'A MILES DE', 'KILÓMETROS', win(t, TL.storm, TL.wind), 300); callout(C.clone().add(V3(15, 6, 0)), 120, -160, 'TORMENTA', 'viento muy fuerte', win(t, TL.storm + .3, TL.wind + 1), '#ffb070');
      two(null, 'SU ENERGÍA VIAJA', 'DÍAS POR EL OCÉANO', smooth(TL.wind, TL.wind + .3, t), 300); });
  } else if (t < TL.why) {
    // C · el agua solo gira en círculos
    const lt = t - TL.water; sec.visible = true; skyMat.uniforms.uTop.value.setRGB(.04, .08, .16); skyMat.uniforms.uHor.value.setRGB(.12, .2, .32); scene.fog.density = 0;
    const k = 2 * Math.PI / 10, om = 1.6, a = .9; const sx = x0 => V3(x0 - a * Math.sin(k * x0 - om * t), a * Math.cos(k * x0 - om * t), 0);
    const pts = []; for (let x = -16; x <= 16; x += .2) { const p = sx(x); pts.push(p); } setWaterShape(pts, -7); if (sandMesh) sandMesh.visible = false; if (lipMesh) lipMesh.visible = false; waterMesh.visible = true;
    const s = PS.seed; let idx = 0; for (let gx = -12; gx <= 12; gx += 1.2) for (let gy = -.6; gy >= -6; gy -= 1.1) { const e = Math.exp(k * gy); const ph = k * gx - om * t; const x = gx - a * e * Math.sin(ph), y = gy + a * e * Math.cos(ph);
      PS.push(SEC.x + x, SEC.y + y, SEC.z + 2.6, .9, 1.1, 1.3); idx++; }
    const cA = smooth(TL.circle, TL.circle + .5, t); if (cA > 0) for (let i = 0; i < 160; i++) { const ph = i / 160 * 6.283; for (const gy of [0, -2.2, -4.4]) { const e = Math.exp(k * gy); PS.push(SEC.x + a * e * Math.sin(ph), SEC.y + gy + a * e * Math.cos(ph), SEC.z + 2.65, HOT[0] * cA * .6, HOT[1] * cA * .6, HOT[2] * cA * .6); } }
    const bp = sx(0); buoy.position.set(bp.x, bp.y + .2, 0); buoy.visible = true; PS.mat.size = .22; bloomS = .55;
    focus = SEC.clone().add(V3(0, -2, 0)); camera.position.copy(focus).add(V3(0, 1, 26)); camera.fov = 44; camera.lookAt(focus);
    hud.push(() => { two(null, 'PERO EL AGUA', 'NO VIAJA CON ELLA', smooth(.1, .4, lt) * (1 - smooth(TL.circle - .2, TL.circle, t)), 300);
      two(null, 'CADA GOTA SOLO', 'DA VUELTAS EN CÍRCULO', win(t, TL.circle, TL.pass), 300); two(null, 'Y LA OLA', 'PASA DE LARGO', smooth(TL.pass, TL.pass + .3, t), 300);
      const pa = smooth(TL.pass, TL.pass + .4, t); const p0 = project(SEC.clone().add(V3(-6, 3, 0))), p1 = project(SEC.clone().add(V3(6, 3, 0))); arrowXY(p0.x, p0.y, p1.x, p1.y, pa, '#ffb070', 14); txt('LA ENERGÍA →', W / 2, p0.y - 50, 34, { font: 'Montserrat', weight: 800, alpha: pa, fill: '#ffb070' }); });
  } else if (t < TL.sets) {
    // D · por qué rompe
    const lt = t - TL.why; sec.visible = true; buoy.visible = false; skyMat.uniforms.uSunC.value.setRGB(0, 0, 0); skyMat.uniforms.uTop.value.setRGB(.04, .08, .16); skyMat.uniforms.uHor.value.setRGB(.12, .2, .32); scene.fog.density = 0;
    const bed = x => lerp(-8, 1.2, smooth(-14, 16, x)); setSand(bed, -18, 18, -9); sandMesh.visible = true;
    const u = clamp((t - TL.why) / (TL.sets - TL.why - .3)); const xc = lerp(-14, 7.5, easeInOut(u)); const d = -bed(xc); const Hh = lerp(1.2, 3.0, smooth(-14, 4, xc)); const brk = smooth(3.5, 7.5, xc);
    const steep = smooth(-6, 4, xc); const wB = 4.5, wF = lerp(3.2, .9, steep);
    const pts = []; for (let x = -18; x <= 18; x += .15) { const dx = x - xc; const w = dx < 0 ? wB : wF; let y = Hh * Math.exp(-Math.pow(dx / w, 2)) * (1 - brk * .4 * smooth(0, 3, dx)); y = Math.max(y, bed(x) + .05); pts.push(V3(x, y, 0)); }
    setWaterShape(pts, -9); waterMesh.visible = true;
    if (brk > 0) { const c = new THREE.CatmullRomCurve3([V3(xc - .2, Hh * .95, 0), V3(xc + .8 * brk + .3, Hh * 1.02, 0), V3(xc + 1.8 * brk + .3, Hh * .7, 0), V3(xc + 2.3 * brk + .3, lerp(Hh * .7, .3, brk), 0)]);
      const g = new THREE.TubeGeometry(c, 32, .35 + brk * .15, 10, false); g.scale(1, 1, 1); if (lipMesh) { lipMesh.geometry.dispose(); lipMesh.geometry = g; } else { lipMesh = new THREE.Mesh(g, lipMat); lipMesh.scale.z = 6; sec.add(lipMesh); } lipMesh.visible = true;
      emitJet(PS, SEC.clone().add(V3(xc + 2.3 * brk + .3, .4, 2.6)), V3(.6, 1, 0), 900 * smooth(.6, 1, brk), t, 3, 2.5, .8, FOAM, 6); } else if (lipMesh) lipMesh.visible = false;
    PS.mat.size = .12; bloomS = .5;
    focus = SEC.clone().add(V3(lerp(-6, 6.5, u), -1.5, 0)); camera.position.copy(focus).add(V3(0, 1, 29)); camera.fov = 44; camera.lookAt(focus);
    hud.push(() => { two(null, '¿Y POR QUÉ', 'ROMPE?', smooth(.1, .4, lt) * (1 - smooth(TL.floor - .2, TL.floor, t)), 300);
      const fa = win(t, TL.floor + .3, TL.depth); if (fa > 0) { const top = project(SEC.clone().add(V3(xc, Hh, 2.6))), base = project(SEC.clone().add(V3(xc - 1, bed(xc) + .6, 2.6)));
        arrowXY(top.x - 40, top.y - 30, top.x + 200, top.y - 30, fa, '#ffb070', 14); txt('LA CRESTA SIGUE', top.x + 80, top.y - 90, 30, { font: 'Montserrat', weight: 800, alpha: fa, fill: '#ffb070' });
        arrowXY(base.x - 40, base.y, base.x + 40, base.y, fa, '#7fb4ff', 14); txt('LA BASE FRENA', base.x, base.y + 60, 30, { font: 'Montserrat', weight: 800, alpha: fa, fill: '#9fd4ff' }); }
      two(null, 'CUANDO EL FONDO SUBE,', 'LA BASE FRENA…', win(t, TL.floor, TL.crest), 300); two(null, 'LA CRESTA SE ADELANTA', 'Y SE CAE', win(t, TL.crest, TL.depth), 300);
      const da = smooth(TL.depth, TL.depth + .4, t); two('ROMPE CUANDO', 'PROFUNDIDAD ≈', '1,3 × ALTURA', da, 300); });
  } else if (t < TL.back) {
    // E · series: dos trenes de olas que se suman
    const lt = t - TL.sets; sec.visible = true; if (waterMesh) waterMesh.visible = false; if (sandMesh) sandMesh.visible = false; if (lipMesh) lipMesh.visible = false; buoy.visible = false;
    skyMat.uniforms.uTop.value.setRGB(.02, .04, .09); skyMat.uniforms.uHor.value.setRGB(.06, .1, .18); scene.fog.density = 0;
    const k1 = 2 * Math.PI / 3.0, k2 = 2 * Math.PI / 3.4, sp = 1.2; const A = (x, k, ph) => .9 * Math.sin(k * (x - t * sp * 3) + ph);
    const a1 = smooth(TL.mix, TL.mix + .5, t), a2 = smooth(TL.sum - .4, TL.sum + .3, t);
    curve2(PS, x => SEC.clone().add(V3(x, 5 + A(x, k1, 0), 0)), -16, 16, 900, [.3, .8, 1.8], a1);
    curve2(PS, x => SEC.clone().add(V3(x, 2 + A(x, k2, 1), 0)), -16, 16, 900, [1.8, .7, .25], a1);
    const a0 = smooth(TL.sets, TL.sets + .4, t) * (1 - smooth(TL.mix - .3, TL.mix + .2, t)); const aC = Math.max(a0, a2); curve2(PS, x => SEC.clone().add(V3(x, lerp(1, -3, smooth(TL.mix - .3, TL.mix + .2, t)) + A(x, k1, 0) + A(x, k2, 1), 0)), -16, 16, 1400, [1.4, 1.4, 1.5], aC);
    PS.mat.size = .22; bloomS = .7;
    focus = SEC.clone().add(V3(0, 1, 0)); camera.position.copy(focus).add(V3(0, 0, 30)); camera.fov = 44; camera.lookAt(focus);
    hud.push(() => { two(null, '¿Y POR QUÉ LLEGAN', 'POR SERIES?', smooth(.1, .4, lt) * (1 - smooth(TL.mix - .2, TL.mix, t)), 300);
      two(null, 'OLAS DE RITMOS', 'LIGERAMENTE DISTINTOS', win(t, TL.mix, TL.sum), 300);
      stamp('SE SUMAN', W / 2, 330, win(t, TL.sum, TL.cancel, .2), -.05, '#ffe2c0', 76); stamp('SE ANULAN', W / 2, 330, smooth(TL.cancel, TL.cancel + .2, t), .05, '#7fb4ff', 76);
      txt('= SERIE DE OLAS', W / 2, 1560, 38, { font: 'Montserrat', weight: 800, alpha: a2, fill: '#ffffff' }); });
  } else if (t < TL.wax) {
    // F · corriente de retorno desde arriba
    const lt = t - TL.back; beach.visible = true; const B = BEACH; skyMat.uniforms.uTop.value.setRGB(.1, .3, .7); scene.fog.density = .001;
    camera.up.set(0, 0, -1); camera.position.copy(B).add(V3(0, lerp(62, 55, clamp(lt / 8)), -14)); camera.fov = 50; camera.lookAt(B.clone().add(V3(0, 0, -14)));
    const s = PS.seed; for (let i = 0; i < 9000; i++) { const q = i * 4; const x = (s[q] - .5) * 90; const inC = Math.abs(x) < 4.5;
      if (inC) { const zz = -1 - fract(s[q + 1] + t * .25) * 50; const f = .55 + .45 * smooth(0, 4, Math.abs(zz) - 40) * 0; PS.push(B.x + x * (1 + (-zz) * .01), .3, B.z + zz, .25 * f, .55 * f, .9 * f); }
      else if (s[q + 3] < .45) { const row = Math.floor(s[q + 1] * 6); const zz = -50 + fract(row / 6 + t * .08) * 50; PS.push(B.x + x, .25, B.z + zz + (s[q + 2] - .5) * .8, .95, .97, 1); } }
    PS.mat.size = .45; bloomS = .45;
    const pa = smooth(TL.use, TL.use + .5, t); paddler.visible = pa > 0; paddler.position.set(1.2, .2, -2 - (t - TL.use) * 4); paddler.rotation.y = Math.PI / 2;
    const sw = smooth(TL.swim, TL.swim + .3, t); const st = Math.max(0, t - TL.swim); swimmer.visible = sw > 0; swimmer.position.set(-1 - st * 3.2 * (st < 1.6 ? 0 : 1) - 0, .2, -18 + Math.min(st, 1.6) * 0 + (st > 2.6 ? (st - 2.6) * 6 : 0));
    hud.push(() => { two(null, '¿Y CÓMO VUELVE', 'EL AGUA AL MAR?', smooth(.1, .4, lt) * (1 - smooth(TL.rip - .2, TL.rip, t)), 300);
      const ra = smooth(TL.rip, TL.rip + .4, t); two('CORRIENTE DE RETORNO', 'UN CANAL QUE TIRA', 'MAR ADENTRO', ra * (1 - smooth(TL.use - .2, TL.use, t)), 300);
      const c0 = project(B.clone().add(V3(6, .3, -6))), c1 = project(B.clone().add(V3(6, .3, -32))); arrowXY(c0.x + 30, c0.y, c1.x + 30, c1.y, ra, '#ff6a5a', 14);
      two(null, 'LOS SURFISTAS', 'LA USAN PARA SALIR', win(t, TL.use, TL.swim), 300); callout(paddler.position.clone().add(B), 120, 140, 'SURFISTA', 'sale sin remar tanto', win(t, TL.use + .3, TL.swim), '#ffe2c0');
      const s0 = project(B.clone().add(V3(-1, .3, -18))), s1 = project(B.clone().add(V3(-22, .3, -18))), s2 = project(B.clone().add(V3(-22, .3, -4)));
      const ga = smooth(TL.swim + .5, TL.swim + 1.1, t); arrowXY(s0.x, s0.y, s1.x, s1.y, ga, '#7fe08a', 14); arrowXY(s1.x, s1.y, s2.x, s2.y, smooth(TL.swim + 1.1, TL.swim + 1.7, t), '#7fe08a', 14);
      two('SI TE ATRAPA, NO LUCHES', 'NADA EN PARALELO', 'A LA ORILLA', smooth(TL.swim, TL.swim + .3, t), 300); });
  } else if (t < TL.big) {
    // G · la cera es para agarrarse
    const lt = t - TL.wax; waxG.visible = true; skyMat.uniforms.uTop.value.setRGB(.03, .06, .12); skyMat.uniforms.uHor.value.setRGB(.1, .17, .28); scene.fog.density = 0;
    const press = smooth(TL.wax + 1.2, TL.wax + 2, t); foot.position.set(0, lerp(2.2, .32, press), 0); const slip = (1 - press) * Math.sin(t * 4) * .2; foot.position.x += slip;
    focus = WAX.clone().add(V3(0, .3, 0)); camera.position.copy(focus).add(V3(Math.sin(.5 + lt * .06) * 7.5, 4.6, Math.cos(.5 + lt * .06) * 7.5)); camera.fov = 42; camera.lookAt(focus);
    hud.push(() => { two('POR CIERTO', 'LA CERA DE LA TABLA', 'NO ES PARA DESLIZAR', smooth(.1, .4, lt) * (1 - smooth(TL.wax + 2.4, TL.wax + 2.7, t)), 300);
      stamp('ES PARA AGARRARTE', W / 2, 360, smooth(TL.wax + 2.6, TL.wax + 2.9, t), -.05, '#ffe2c0', 62); callout(WAX.clone().add(V3(2, .2, 1)), 80, 260, 'CERA', 'rugosa = agarre', smooth(TL.wax + .8, TL.wax + 1.2, t), '#ffe2c0'); });
  } else if (t < TL.canyon) {
    // H · la ola gigante de Nazaré
    const lt = t - TL.big; ocean.visible = true; surfer.visible = true; setWaves([{ dir: Math.PI / 2, A: 11, L: 115, Q: 1, sp: .9 }, { dir: 1.4, A: .4, L: 14 }, { dir: 1.8, A: .25, L: 7 }]);
    const w0 = WAVES[0]; const zz = (Math.PI * .88 + w0.om * t) / w0.k; const zc = zz - (Math.PI * .38) / w0.k; skyMat.uniforms.uSunC.value.setRGB(.15, .13, .1); oceanUpdate(t, 0, zz, .74, [.02, .1, .18], [.12, .5, .6]);
    skyMat.uniforms.uTop.value.setRGB(.18, .26, .4); skyMat.uniforms.uHor.value.setRGB(.55, .62, .7); scene.fog.density = .0022; scene.fog.color.setRGB(.5, .58, .66); sun.position.set(40, 60, 200); oMat.roughness = .5;
    const gp = gerst(-15, zz, t); const y = gp.y; surfer.position.copy(gp).add(V3(0, .1, 0)); surfer.rotation.set(-.35, 0, 0);
    const pull = easeInOut(smooth(TL.naz - .4, TL.naz + 1.2, t)); focus = V3(lerp(-15, -22, pull), lerp(y + 1, 0, pull), lerp(gp.z, zz - 4, pull)); camera.position.set(lerp(-10, 38, pull), lerp(y + 1.6, 20, pull), lerp(gp.z + 6, zz + 58, pull)); camera.fov = lerp(50, 50, pull); camera.lookAt(focus.clone().add(V3(0, lerp(1.2, 0, pull), 0)));
    for (let j = 0; j < 7; j++) emitJet(PS, V3(-75 + j * 20, 10.5, zc + 2), V3(0, .5, 1), 500, t + j * .37, 6, 5, 1.6, FOAM, 3 + j); { const sp = surfer.position; for (let i = 0; i < 600; i++) { const u = i / 600; const gq = gerst(-17 - u * 14, zz, t); PS.push(gq.x, gq.y + .15, gq.z + Math.sin(u * 9 + i) * .4, 1.4 * (1 - u), 1.4 * (1 - u), 1.5 * (1 - u)); } } PS.mat.size = .5;
    hud.push(() => { two(null, '¿Y LA OLA MÁS', 'GRANDE SURFEADA?', smooth(.1, .4, lt) * (1 - smooth(TL.naz - .2, TL.naz, t)), 300);
      const na = smooth(TL.naz, TL.naz + .4, t); bigStat('NAZARÉ · PORTUGAL', '26 m', 420, na, .5);
      const b = project(V3(-30, -10, zc)), tp = project(V3(-30, 11, zc)); if (na > 0) { g2.save(); g2.globalAlpha = na; g2.strokeStyle = '#ffe2c0'; g2.lineWidth = 4; g2.beginPath(); g2.moveTo(140, b.y); g2.lineTo(140, tp.y); g2.moveTo(120, b.y); g2.lineTo(160, b.y); g2.moveTo(120, tp.y); g2.lineTo(160, tp.y); g2.stroke(); g2.restore(); txt('26 m', 150, (b.y + tp.y) / 2, 34, { align: 'left', font: 'Montserrat', weight: 800, alpha: na, fill: '#ffe2c0' }); }
      callout(surfer.position.clone().add(V3(0, 1.5, 0)), 120, 200, 'SURFISTA', '1,8 m', smooth(TL.naz + .8, TL.naz + 1.2, t), '#ffb070'); });
  } else if (t < TL.brand) {
    // I · el cañón submarino
    const lt = t - TL.canyon; naz.visible = true; skyMat.uniforms.uTop.value.setRGB(.02, .05, .1); skyMat.uniforms.uHor.value.setRGB(.05, .12, .2); scene.fog.density = .0015; scene.fog.color.setRGB(.03, .08, .14); hemi.intensity = 1.6; sun.intensity = 2.2;
    const az = -.6 + lt * .06; focus = NAZ.clone().add(V3(0, -40, -70)); camera.position.copy(focus).add(V3(Math.sin(az) * 170, 120, Math.cos(az) * 170)); camera.fov = 45; camera.lookAt(focus);
    const s = PS.seed; for (let i = 0; i < 5000; i++) { const q = i * 4; const u = fract(s[q] + t * .25); const x0 = (s[q + 1] - .5) * 160; const zz = -200 + u * 200; const fx = x0 * (1 - smooth(-200, -10, zz) * .75 * Math.exp(-Math.pow(x0 / 60, 2)));
      const f = smooth(0, .1, u) * (1 - smooth(.9, 1, u)) * (Math.exp(-Math.pow(fx / 12, 2)) * 1.2 + .3); PS.push(NAZ.x + fx, NAZ.y + .5, NAZ.z + zz - 100 + 100, f, f * 1.05, f * 1.1); }
    PS.mat.size = 1.1; bloomS = .55;
    hud.push(() => { two('CAÑÓN DE NAZARÉ', 'UN CAÑÓN SUBMARINO', 'DE CASI 5 KM', smooth(.1, .4, lt), 300); callout(NAZ.clone().add(V3(0, -60, -60)), 100, 280, 'HASTA 5 000 m', 'de profundidad', smooth(.8, 1.2, lt), '#7fb4ff');
      callout(NAZ.clone().add(V3(0, 4, 12)), -120, -200, 'NAZARÉ', 'la ola se concentra aquí', smooth(2.2, 2.6, lt), '#ffb070'); });
  } else {
    // J · marca: atardecer en el mar
    const lt = t - TL.brand; ocean.visible = true; setWaves([{ dir: Math.PI / 2, A: .6, L: 20, Q: .6 }, { dir: 1.3, A: .2, L: 7 }]); oceanUpdate(t, 0, 0, .9, [.02, .03, .06], [.2, .1, .1]);
    skyMat.uniforms.uTop.value.setRGB(.04, .05, .14); skyMat.uniforms.uHor.value.setRGB(.9, .4, .2); skyMat.uniforms.uSunC.value.setRGB(1.4, .6, .3); scene.fog.color.setRGB(.5, .25, .15); scene.fog.density = .004; sun.color.setRGB(1, .5, .3); sun.intensity = 1.6; hemi.intensity = .4;
    camera.position.set(0, 2.2, 12); camera.fov = 44; camera.lookAt(V3(0, 4, -100)); fade = Math.min(.4, lt * .4);
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  if (t < TL.brand) sun.color.setRGB(1, .95, .86);
  sky.position.copy(camera.position); PS.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, bloom: bloomS, expo });
}
function renderCover() { renderFrame(TL.big + .8); coverText('LOS SECRETOS', 'DE LAS OLAS', 'lo que todo surfista debería saber'); }
window.renderCover = () => { renderCover(); return true; };
window.OBJ = { PS, scene };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
