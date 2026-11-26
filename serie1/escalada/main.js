// NO LO SABÍAS — "Las manías de los escaladores"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final. Unidades: metros (salvo primeros planos, a escala libre).
// Pies de gato: se usan ajustados, con los dedos flexionados, para cargar todo el peso en la punta sobre cantos de milímetros.
// Gomas blandas de alta fricción que se deforman y se adaptan a las rugosidades de la roca.
// Magnesio = carbonato de magnesio (MgCO3), absorbe el sudor.
// «Bombeo» de antebrazo: la contracción mantenida comprime los vasos y limita el flujo de sangre; se acumulan metabolitos.
// Lesión típica: rotura de la polea A2 de los dedos al apretar regletas («crimp»), a menudo con un chasquido audible.
// Alex Honnold, 3 de junio de 2017: Freerider (El Capitán, ~900 m) en solo integral, 3 h 56 min.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3,
  g2, camera, SOFT, Particles, txt, copperGrad, project, fmt, callout, titleHUD, bar, fract, camOrbit, arrowXY, bigStat, drawBrand, coverText, finish } from '../../lib/core.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(.012, .022, .045);
scene.fog = new THREE.FogExp2(new THREE.Color(.015, .03, .06), .0004);
const hemi = new THREE.HemisphereLight(0xb8ccff, 0x2a1d12, .7); scene.add(hemi);
const key = new THREE.DirectionalLight(0xffe2c0, 2.6); key.position.set(-3, 5, 4); scene.add(key);
const rimL = new THREE.DirectionalLight(0x7fb4ff, 1.2); rimL.position.set(4, 2, -3); scene.add(rimL);
const xray = c => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  uniforms: { uCol: { value: new THREE.Color(...c) }, uA: { value: 1 } },
  vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform vec3 uCol; uniform float uA; varying vec3 vN; varying vec3 vV; void main(){ float f=pow(clamp(1.-abs(dot(vN,vV)),0.,1.),2.); gl_FragColor=vec4(uCol*(f*.9+.06)*uA,(f*.7+.05)*uA); }` });
function hash(x, z) { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, z) { const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi; const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  return lerp(lerp(hash(xi, zi), hash(xi + 1, zi), u), lerp(hash(xi, zi + 1), hash(xi + 1, zi + 1), u), v); }
const fbm = (x, z) => vnoise(x, z) * .5 + vnoise(x * 2.1, z * 2.1) * .25 + vnoise(x * 4.3, z * 4.3) * .125 + vnoise(x * 9.1, z * 9.1) * .07;
const rockMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95, metalness: 0 });
function rockPlane(w, h, nx, ny, amp, freq, seedC, tint = [.42, .38, .34]) { const g = new THREE.PlaneGeometry(w, h, nx, ny); const p = g.attributes.position; const col = [];
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); const n = fbm(x * freq + seedC, y * freq); p.setZ(i, (n - .5) * amp); const k = .75 + n * .5; col.push(tint[0] * k, tint[1] * k, tint[2] * k); }
  g.computeVertexNormals(); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return new THREE.Mesh(g, rockMat); }

// ==========================================================================
// A · PARED CON UN CANTO Y PIE DE GATO (escala 1 = 10 cm)
// ==========================================================================
const shoeSet = new THREE.Group(); scene.add(shoeSet);
const wallA = rockPlane(20, 30, 160, 240, .25, .8, 3); wallA.position.set(0, 0, -.2); shoeSet.add(wallA);
const edge = new THREE.Mesh(new THREE.BoxGeometry(6, .18, .5), new THREE.MeshStandardMaterial({ color: 0x8a7a68, roughness: .9 })); edge.position.set(0, 0, .05); shoeSet.add(edge);
const shoeProfile = (() => { const s = new THREE.Shape(); // silueta lateral (x hacia la punta, y arriba), arqueada hacia abajo
  s.moveTo(-1.3, .9); s.bezierCurveTo(-.6, 1.25, .5, 1.15, 1.05, .6); s.bezierCurveTo(1.35, .3, 1.4, -.05, 1.25, -.2); s.bezierCurveTo(1.0, -.3, .5, -.05, 0, -.1);
  s.bezierCurveTo(-.6, -.15, -1.1, -.35, -1.35, -.1); s.bezierCurveTo(-1.55, .15, -1.55, .6, -1.3, .9); return s; })();
const shoeGeo = new THREE.ExtrudeGeometry(shoeProfile, { depth: .8, bevelEnabled: true, bevelThickness: .18, bevelSize: .16, bevelSegments: 6, curveSegments: 32 }); shoeGeo.translate(0, 0, -.4);
const shoeMat = new THREE.MeshStandardMaterial({ color: 0xc8743f, roughness: .55 });
const shoe = new THREE.Group(); shoeSet.add(shoe);
const shoeMesh = new THREE.Mesh(shoeGeo, shoeMat); shoe.add(shoeMesh);
const soleMat = new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: .35 });
const rand = new THREE.Mesh(new THREE.TorusGeometry(1, .1, 8, 40, Math.PI * .9), soleMat); rand.scale.set(1.2, .5, 4.2); rand.rotation.set(0, 0, -Math.PI * 1.05); rand.position.set(.35, -.05, 0); shoe.add(rand);
const strap = new THREE.Mesh(new THREE.BoxGeometry(.25, 1.25, 1.25), new THREE.MeshStandardMaterial({ color: 0x16243c, roughness: .6 })); strap.position.set(-.2, .55, 0); strap.rotation.z = -.25; shoe.add(strap);
// huesos del pie (rayos X): metatarsos y falanges encogidas
const bones = new THREE.Group(); shoe.add(bones); const boneMat = xray([.4, .9, 1.6]);
for (let i = 0; i < 4; i++) { const z = -.28 + i * .19; const m = new THREE.Mesh(new THREE.CapsuleGeometry(.07, .9, 4, 10), boneMat); m.rotation.z = Math.PI / 2 - .25; m.position.set(-.35, .45 + i * .01, z); bones.add(m);
  const p1 = new THREE.Mesh(new THREE.CapsuleGeometry(.06, .3, 4, 10), boneMat); p1.position.set(.32, .5, z); p1.rotation.z = -.9; bones.add(p1);
  const p2 = new THREE.Mesh(new THREE.CapsuleGeometry(.05, .2, 4, 10), boneMat); p2.position.set(.55, .25, z); p2.rotation.z = .5; bones.add(p2);
  const k = new THREE.Mesh(new THREE.SphereGeometry(.08, 12, 10), boneMat); k.position.set(.45, .7, z); bones.add(k); }
const heel = new THREE.Mesh(new THREE.SphereGeometry(.35, 16, 12), boneMat); heel.position.set(-1.15, .3, 0); bones.add(heel);
shoe.position.set(-1.2, 1.25, .25); shoe.rotation.set(0, 0, -.35);

// ==========================================================================
// B · MICROSCOPIO: GOMA ADAPTÁNDOSE A LA ROCA
// ==========================================================================
const micro = new THREE.Group(); scene.add(micro); micro.position.set(200, 0, 0);
const rockMicro = rockPlane(8, 8, 200, 200, .9, 1.3, 11, [.62, .54, .45]); rockMicro.rotation.x = -Math.PI / 2; micro.add(rockMicro);
const rubGeo = new THREE.PlaneGeometry(7.6, 7.6, 190, 190); const rubBase = Float32Array.from(rubGeo.attributes.position.array);
const rubber = new THREE.Mesh(rubGeo, new THREE.MeshStandardMaterial({ color: 0x3a3e48, roughness: .35, side: THREE.DoubleSide })); rubber.rotation.x = -Math.PI / 2; micro.add(rubber);
function rubberFit(k, drop) { const p = rubGeo.attributes.position; for (let i = 0; i < p.count; i++) { const x = rubBase[i * 3], y = rubBase[i * 3 + 1]; const rockZ = (fbm(x * 1.3 + 11, y * 1.3) - .5) * .9; // misma superficie
    const flat = .55 + drop; p.setZ(i, Math.max(rockZ + .03, lerp(flat, Math.max(rockZ + .03, flat - .9), k) ) * (1) ); } p.needsUpdate = true; rubGeo.computeVertexNormals(); }

// ==========================================================================
// C · MANO Y MAGNESIO
// ==========================================================================
const handSet = new THREE.Group(); scene.add(handSet); handSet.position.set(-200, 0, 0);
const skin = new THREE.MeshStandardMaterial({ color: 0xc89a7c, roughness: .55 });
const hand = new THREE.Group(); handSet.add(hand);
const palm = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), skin); palm.scale.set(.5, .58, .2); hand.add(palm);

const fingers = []; for (let i = 0; i < 4; i++) { const f = new THREE.Group(); f.position.set(-.33 + i * .22, .5, 0); hand.add(f); const segs = [];
  let parent = f; const L = [.36, .24, .2][0] * (i === 0 || i === 3 ? .85 : 1);
  for (let s = 0; s < 3; s++) { const j = new THREE.Group(); if (s) j.position.y = [.4, .28, .22][s - 1] * (i === 0 || i === 3 ? .85 : 1); parent.add(j); const len = [.36, .24, .18][s] * (i === 0 || i === 3 ? .85 : 1);
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(.085, len, 4, 10), skin); m.position.y = len / 2 + .04; j.add(m); segs.push(j); parent = j; }
  fingers.push(segs); }
const thumb = new THREE.Group(); thumb.position.set(-.48, -.1, .1); thumb.rotation.z = .9; hand.add(thumb); { const m = new THREE.Mesh(new THREE.CapsuleGeometry(.1, .45, 4, 10), skin); m.position.y = .28; thumb.add(m); }
const bag = new THREE.Mesh(new THREE.CylinderGeometry(.9, .8, 1.3, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0x16243c, roughness: .8, side: THREE.DoubleSide })); bag.position.set(0, -1.9, 0); handSet.add(bag);
const chalkTop = new THREE.Mesh(new THREE.CircleGeometry(.86, 32), new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 1 })); chalkTop.rotation.x = -Math.PI / 2; chalkTop.position.set(0, -1.45, 0); handSet.add(chalkTop);
const handChalk = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0 })); hand.add(handChalk);
function curl(a) { fingers.forEach(seg => seg.forEach((j, s) => { j.rotation.x = a * [1.0, 1.4, 1.1][s]; })); }

// ==========================================================================
// D · ANTEBRAZO EN SECCIÓN: músculos que aplastan las venas
// ==========================================================================
const arm = new THREE.Group(); scene.add(arm); arm.position.set(0, 0, 200);
const skinX = new THREE.Mesh(new THREE.CylinderGeometry(1, .8, 5, 48, 1, true), xray([.9, .6, .45])); skinX.rotation.z = Math.PI / 2; arm.add(skinX);
const muscles = []; { const r = rng(4); for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; const m = new THREE.Mesh(new THREE.CapsuleGeometry(.24, 3.6, 6, 16), new THREE.MeshStandardMaterial({ color: new THREE.Color(.55 + r() * .1, .14, .14), roughness: .5, transparent: true, opacity: .9 }));
  m.rotation.z = Math.PI / 2; m.position.set(0, Math.cos(a) * .5, Math.sin(a) * .5); m.userData.a = a; arm.add(m); muscles.push(m); } }
const veinMat = new THREE.MeshStandardMaterial({ color: 0x2a5ad8, emissive: 0x10308a, roughness: .4 }); const artMat = new THREE.MeshStandardMaterial({ color: 0xd8302a, emissive: 0x6a0e0a, roughness: .4 });
const vein = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 5.2, 20), veinMat); vein.rotation.z = Math.PI / 2; vein.position.set(0, .2, .82); arm.add(vein);
const artery = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, 5.2, 20), artMat); artery.rotation.z = Math.PI / 2; artery.position.set(0, -.25, .2); arm.add(artery);
const pumpGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: SOFT, color: new THREE.Color(1.8, .45, .2), blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 })); pumpGlow.scale.set(6, 3, 1); arm.add(pumpGlow);

// ==========================================================================
// E · DEDO EN REGLETA: huesos, tendón y polea A2
// ==========================================================================
const fing = new THREE.Group(); scene.add(fing); fing.position.set(0, 0, -200);
const fbone = xray([.4, .9, 1.6]); const fskin = xray([.9, .62, .48]);
const ph1 = new THREE.Mesh(new THREE.CapsuleGeometry(.16, 1.5, 6, 14), fbone); ph1.rotation.z = Math.PI / 2; ph1.position.set(-1.1, 0, 0); fing.add(ph1);
const midJ = new THREE.Group(); midJ.position.set(-.1, 0, 0); fing.add(midJ);
const ph2 = new THREE.Mesh(new THREE.CapsuleGeometry(.14, .9, 6, 14), fbone); ph2.rotation.z = Math.PI / 2; ph2.position.set(.6, 0, 0); midJ.add(ph2);
const tipJ = new THREE.Group(); tipJ.position.set(1.25, 0, 0); midJ.add(tipJ);
const ph3 = new THREE.Mesh(new THREE.CapsuleGeometry(.12, .5, 6, 14), fbone); ph3.rotation.z = Math.PI / 2; ph3.position.set(.38, 0, 0); tipJ.add(ph3);
const fingSkin = new THREE.Mesh(new THREE.CapsuleGeometry(.42, 3.6, 8, 20), fskin); fingSkin.rotation.z = Math.PI / 2; fingSkin.position.set(-.1, 0, 0); fing.add(fingSkin);
const tendonGeo = new THREE.BufferGeometry(); tendonGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(40 * 3), 3));
const tendon = new THREE.Line(tendonGeo, new THREE.LineBasicMaterial({ color: new THREE.Color(2, 1.1, .5) })); fing.add(tendon);
const pulleyMat = new THREE.MeshStandardMaterial({ color: 0xffe2c0, emissive: 0xc8743f, emissiveIntensity: .8, roughness: .3 });
const pulleyA = new THREE.Mesh(new THREE.TorusGeometry(.26, .05, 10, 40, Math.PI * 1.2), pulleyMat); pulleyA.rotation.y = Math.PI / 2; pulleyA.position.set(-1.1, 0, 0); fing.add(pulleyA);
const pulleyB = new THREE.Mesh(new THREE.TorusGeometry(.26, .05, 10, 40, Math.PI * .8), pulleyMat); pulleyB.rotation.set(0, Math.PI / 2, Math.PI * 1.2); pulleyB.position.set(-1.1, 0, 0); fing.add(pulleyB);
const crimp = new THREE.Mesh(new THREE.BoxGeometry(1.2, .25, 2), new THREE.MeshStandardMaterial({ color: 0x8a7a68, roughness: .9 })); crimp.position.set(1.95, -.55, 0); fing.add(crimp);
const crimpWall = rockPlane(8, 8, 60, 60, .3, .8, 2); crimpWall.rotation.y = -Math.PI / 2; crimpWall.position.set(2.6, 0, 0); fing.add(crimpWall);

// ==========================================================================
// F · EL CAPITÁN (granito de ~900 m) con escalador minúsculo
// ==========================================================================
const cap = new THREE.Group(); scene.add(cap); cap.position.set(0, -2000, 0);
const capWall = (() => { const g = new THREE.PlaneGeometry(3200, 1300, 300, 180); const p = g.attributes.position; const col = [];
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); const prow = -Math.abs(x) * .35; const n = fbm(x * .004 + 5, y * .004) * 160 + fbm(x * .03, y * .03) * 25; p.setZ(i, prow + n);
    const k = .72 + fbm(x * .02, y * .05) * .45 - smooth(400, 560, y) * .2; col.push(.62 * k, .6 * k, .56 * k); }
  g.computeVertexNormals(); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); const m = new THREE.Mesh(g, rockMat); m.position.y = 550; cap.add(m); return m; })();
const valley = new THREE.Mesh(new THREE.PlaneGeometry(6000, 3000), new THREE.MeshStandardMaterial({ color: 0x1b2e1c, roughness: 1 })); valley.rotation.x = -Math.PI / 2; valley.position.set(0, 0, 900); cap.add(valley);
const trees = (() => { const r = rng(6); const pos = [], col = []; for (let i = 0; i < 9000; i++) { pos.push((r() - .5) * 3000, r() * 30, 60 + r() * 1400); const k = .3 + r() * .4; col.push(.08 * k, .25 * k, .1 * k); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); const p = new THREE.Points(g, new THREE.PointsMaterial({ size: 9, vertexColors: true })); cap.add(p); return p; })();
const climbDot = new THREE.Sprite(new THREE.SpriteMaterial({ map: SOFT, color: new THREE.Color(2.4, 1.3, .6), blending: THREE.AdditiveBlending, depthWrite: false })); climbDot.scale.setScalar(26); cap.add(climbDot);
const routeY = u => 20 + u * 880, routeX = u => Math.sin(u * 9) * 40 + Math.sin(u * 23) * 12 - 40;
function capZ(x, y) { return -Math.abs(x) * .35 + fbm(x * .004 + 5, (y - 550) * .004) * 160 + fbm(x * .03, (y - 550) * .03) * 25; }

const PS = new Particles(14000, { size: .05, seed: 3 }); scene.add(PS.obj);
const AIR = [.4, .85, 1.6], HOT = [1.6, .7, .3], SWEAT = [.5, .85, 1.5];

// ==========================================================================
// HUD
// ==========================================================================
function stamp(s, x, y, a, rot = -.1, col = '#ff6a4a', size = 92) { if (a <= .01) return; const sc = lerp(1.6, 1, easeOut(clamp(a * 1.4)));
  g2.save(); g2.translate(x, y); g2.rotate(rot); g2.scale(sc, sc); g2.globalAlpha = clamp(a); g2.strokeStyle = col; g2.lineWidth = 8; g2.shadowColor = col; g2.shadowBlur = 25;
  g2.font = `800 ${size}px Montserrat`; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.letterSpacing = '6px'; const w = g2.measureText(s).width + 70; g2.strokeRect(-w / 2, -size * .8, w, size * 1.6); g2.fillStyle = col; g2.fillText(s, 0, 4); g2.restore(); }
function two(top, l1, l2, a, y = 300) { if (a <= .01) return; txt(l1, W / 2, y, 50, { font: 'Montserrat', weight: 800, alpha: a }); if (l2) txt(l2, W / 2, y + 62, 50, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(160, 920, y + 62, .5) }); if (top) txt(top, W / 2, y - 62, 24, { spacing: 7, alpha: a * .8, fill: '#e3a372' }); }
const win = (t, a, b, f = .3) => smooth(a, a + f, t) * (1 - smooth(b - f, b, t));

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .05; camera.far = 8000; camera.fov = 40;
  let bloomS = .55, flash = 0, ca = .0013, fade = 0, expo = 1, focus = V3();
  for (const g of [shoeSet, micro, handSet, arm, fing, cap]) g.visible = false;
  scene.background.setRGB(.012, .022, .045); scene.fog.color.setRGB(.015, .03, .06);
  PS.begin(); PS.mat.size = .05; bones.visible = false; shoeMat.transparent = false; shoeMat.opacity = 1; scene.fog.density = .0004;
  for (const c of ['rubber', 'chalk', 'shake', 'crack', 'limit', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];

  if (t < TL.rubber) {
    // A · pies de gato pequeños: los dedos encogidos cargan todo en la punta
    shoeSet.visible = true;
    const lt = t; const xr = smooth(TL.toe - .2, TL.toe + .5, t); bones.visible = xr > .02; boneMat.uniforms.uA.value = xr; shoeMat.transparent = true; shoeMat.opacity = lerp(1, .25, xr);
    const step = smooth(.3, 1.6, lt); shoe.position.set(lerp(-1.6, -1.05, step), lerp(2.2, 1.25, step), .25); shoe.rotation.z = lerp(-.1, -.35, step);
    focus = V3(-1.0, 1.1, 0); camOrbit(focus, lerp(10, 8.5, clamp(lt / TL.rubber)), lerp(.75, .5, clamp(lt / TL.rubber)), .12, 40); fade = 1 - smooth(0, .3, t);
    if (xr > .3) { const tip = shoe.localToWorld(V3(1.3, -.15, 0)); for (let i = 0; i < 900; i++) { const s = PS.seed, q = i * 4; const age = fract(s[q] + t * .8); const from = shoe.localToWorld(V3(-1.2 + s[q + 1] * .6, .9, (s[q + 2] - .5) * .6)); const p = from.lerp(tip, age); const f = xr * .9 * age; PS.push(p.x, p.y, p.z, HOT[0] * f, HOT[1] * f, HOT[2] * f); } PS.mat.size = .12; bloomS = .7; }
    hud.push(() => { two(null, '2 TALLAS', 'MÁS PEQUEÑOS', win(lt, .1, TL.nopose), 300); stamp('NO ES POSTUREO', W / 2, 330, win(t, TL.nopose, TL.toe + .3), -.06, '#ffe2c0', 60);
      two(null, 'TODA LA FUERZA', 'EN LA PUNTA', smooth(TL.toe + .6, TL.toe + 1, t), 300);
      callout(V3(-.25, 1.07, .3), 60, 260, 'CANTO DE POCOS mm', null, smooth(TL.toe + 1.6, TL.toe + 2, t), '#ffe2c0'); });
  } else if (t < TL.chalk) {
    // B · la goma blanda se mete en cada rugosidad
    micro.visible = true;
    const lt = t - TL.rubber; const k = smooth(.4, (TL.chalk - TL.rubber) * .7, lt); rubberFit(k, 0);
    focus = micro.position.clone().add(V3(0, .3, 0)); camOrbit(focus, lerp(8, 6.5, clamp(lt / 4)), .5 + lt * .04, lerp(.55, .3, clamp(lt / 3)), 40); rubber.visible = true;
    hud.push(() => { two('AL MICROSCOPIO', 'LA GOMA SE ADAPTA', 'A CADA RUGOSIDAD', smooth(.2, .6, lt), 300); });
  } else if (t < TL.shake) {
    // C · magnesio: se bebe el sudor
    handSet.visible = true;
    const lt = t - TL.chalk; const dip = win(lt, .2, TL.mg - TL.chalk + 1.5, .6); hand.position.set(0, lerp(1.2, -.9, dip), 0); hand.rotation.set(-.25, .4, 0); curl(.15 + dip * .2);
    const coat = smooth(.8, 1.6, lt); handChalk.material.opacity = coat * .55; handChalk.scale.set(.52, .6, .22);
    focus = handSet.position.clone().add(V3(0, .1, 0)); camOrbit(focus, 7.8, 1.1, .2, 40);
    // nube de magnesio
    for (let i = 0; i < 2500; i++) { const s = PS.seed, q = i * 4; const age = fract(s[q] + t * .35); const a = s[q + 1] * 6.283, r = Math.sqrt(s[q + 2]) * (.5 + age * 1.2); const f = .5 * (1 - age) * smooth(.6, 1.2, lt);
      PS.push(handSet.position.x + Math.cos(a) * r, -1.3 + age * 2.2 + hand.position.y * .2, Math.sin(a) * r, f, f, f * .95); }
    // gotas de sudor que desaparecen
    const sw = smooth(TL.sweat - .2, TL.sweat + .3, t); for (let i = 0; i < 40; i++) { const s = PS.seed, q = (3000 + i) * 4; const gone = smooth(TL.sweat + .4 + s[q] * 1.5, TL.sweat + .8 + s[q] * 1.5, t);
      const p = hand.localToWorld(V3((s[q + 1] - .5) * .8, (s[q + 2] - .5) * .9, .2)); const f = sw * (1 - gone) * 1.5; PS.push(p.x, p.y, p.z, SWEAT[0] * f, SWEAT[1] * f, SWEAT[2] * f); }
    PS.mat.size = .14;
    hud.push(() => { two(null, '¿Y ESE POLVO', 'BLANCO?', win(lt, .05, TL.mg - TL.chalk), 300); two('MgCO₃', 'CARBONATO', 'DE MAGNESIO', win(t, TL.mg, TL.sweat), 330);
      two(null, 'SE BEBE EL SUDOR', null, smooth(TL.sweat, TL.sweat + .3, t) * (1 - smooth(TL.sweat + 1.8, TL.sweat + 2.1, t)), 300);
      bar(150, 1450, 780, .45, 'MANO MOJADA', 'RESBALA', smooth(TL.sweat + 1.9, TL.sweat + 2.2, t), '#7fd4ff'); bar(150, 1580, 780, .95, 'MANO SECA', 'AGARRA', smooth(TL.sweat + 2.2, TL.sweat + 2.5, t)); });
  } else if (t < TL.crack) {
    // D · antebrazo «petado»
    arm.visible = true;
    const lt = t - TL.shake; const sq = smooth(TL.squeeze, TL.squeeze + 1.5, t); const sw = 1 + sq * .22;
    muscles.forEach(m => { m.scale.set(sw, 1, sw); m.position.y = Math.cos(m.userData.a) * .5 * (1 + sq * .1); m.position.z = Math.sin(m.userData.a) * .5 * (1 + sq * .1); });
    vein.scale.set(lerp(1, .25, sq), 1, lerp(1, .25, sq)); pumpGlow.material.opacity = smooth(TL.burn, TL.burn + 1, t) * (.6 + .25 * Math.sin(t * 8));
    focus = arm.position.clone(); camOrbit(focus, lerp(8, 6.5, clamp(lt / 6)), .55 + lt * .03, .3, 40); bloomS = .65;
    // sangre: entra por la arteria, no sale por la vena
    const blk = smooth(TL.blood, TL.blood + 1, t);
    for (let i = 0; i < 1600; i++) { const s = PS.seed, q = i * 4; const age = fract(s[q] + t * .35); const x = lerp(-2.5, 2.5, age); PS.push(arm.position.x + x, arm.position.y - .25 + (s[q + 1] - .5) * .1, arm.position.z + .2 + (s[q + 2] - .5) * .1, 1.6, .25, .2); }
    for (let i = 0; i < 1000; i++) { const s = PS.seed, q = (2000 + i) * 4; const speed = lerp(.35, .02, blk); const age = fract(s[q] + t * speed); const x = lerp(2.5, -2.5, age) ; if (blk > .5 && x < -.2) continue; PS.push(arm.position.x + x, arm.position.y + .2 + (s[q + 1] - .5) * .1 * vein.scale.x, arm.position.z + .82 + (s[q + 2] - .5) * .1 * vein.scale.x, .4, .6, 1.8); }
    PS.mat.size = .14;
    hud.push(() => { two(null, '¿POR QUÉ SACUDEN', 'EL BRAZO?', win(lt, .05, TL.squeeze - TL.shake), 300);
      two(null, 'EL MÚSCULO SE HINCHA', 'Y APLASTA SUS VENAS', win(t, TL.squeeze, TL.blood), 300);
      callout(arm.position.clone().add(V3(-1.5, -.25, .2)), -40, 330, 'ARTERIA: ENTRA', null, smooth(TL.blood, TL.blood + .4, t) * (1 - smooth(TL.petado - .2, TL.petado, t)), '#ff8a7a');
      callout(arm.position.clone().add(V3(1.2, .2, .82)), 40, -330, 'VENA: NO SALE', null, smooth(TL.blood + .8, TL.blood + 1.2, t) * (1 - smooth(TL.petado - .2, TL.petado, t)), '#7fd4ff');
      two(null, 'SE CARGA, ARDE…', 'Y LA MANO SE ABRE', win(t, TL.burn, TL.petado), 300); stamp('PETADO', W / 2, 1450, smooth(TL.petado, TL.petado + .3, t), -.08, '#ff6a4a', 110); });
  } else if (t < TL.limit) {
    // E · polea A2: regleta y chasquido
    fing.visible = true;
    const lt = t - TL.crack; const grip = smooth(.2, 1.2, lt); midJ.rotation.z = -grip * .9; tipJ.rotation.z = grip * .55;
    const snap = smooth(TL.snap, TL.snap + .15, t); pulleyA.position.y = lerp(0, .5, snap); pulleyB.position.y = lerp(0, -.5, snap); pulleyA.rotation.x = snap * 1.2; pulleyB.rotation.x = -snap * 1.2;
    pulleyMat.emissive.setRGB(lerp(.78, 1, snap), lerp(.45, .1, snap), lerp(.25, .05, snap)); if (t >= TL.snap) flash = Math.max(flash, flashAt(t, TL.snap, .35, .55));
    // tendón: del antebrazo a la punta, pegado al hueso por la polea (o separado si se rompe → «cuerda de arco»)
    const tp = tendonGeo.attributes.position; const tipW = V3(); for (let i = 0; i < 40; i++) { const u = i / 39; let p;
      if (u < .4) p = V3(lerp(-3, -1.1, u / .4), -.19, 0); else { const loc = u < .7 ? V3(lerp(-.1, 1.25, (u - .4) / .3) - .1, -.17, 0) : V3(lerp(0, .7, (u - .7) / .3), -.13, 0);
        p = u < .7 ? midJ.localToWorld(loc.clone().add(V3(.1, 0, 0))).sub(fing.position) : tipJ.localToWorld(loc).sub(fing.position); }
      if (u > .2 && u < .55) p.y -= snap * .45 * Math.sin((u - .2) / .35 * Math.PI); tp.setXYZ(i, p.x, p.y, p.z); } tp.needsUpdate = true;
    const force = grip * (1 - snap); if (force > .05) { for (let i = 0; i < 500; i++) { const s = PS.seed, q = i * 4; const a = s[q] * 6.283; const r = .3 + fract(s[q + 1] + t * .8) * .25; PS.push(fing.position.x - 1.1, fing.position.y + Math.cos(a) * r, fing.position.z + Math.sin(a) * r, HOT[0] * force * .5, HOT[1] * force * .5, HOT[2] * force * .5); } PS.mat.size = .05; }
    focus = fing.position.clone().add(V3(.4, -.2, 0)); camOrbit(focus, lerp(10, 9, clamp(lt / 6)), lerp(.35, .2, clamp(lt / 6)), .15, 40); bloomS = .7;
    hud.push(() => { two(null, '¿Y ESE CHASQUIDO', 'EN UN DEDO?', win(lt, .05, TL.pulley - TL.crack), 300);
      callout(fing.position.clone().add(V3(-1.1, .3, 0)), -60, -300, 'POLEA A2', 'sujeta el tendón al hueso', smooth(TL.pulley + .3, TL.pulley + .7, t) * (1 - smooth(TL.snap - .1, TL.snap + .1, t)), '#ffe2c0');
      two(null, 'TODO TU PESO', 'EN UNA REGLETA', win(t, TL.pulley, TL.snap), 300); stamp('¡CRAC!', W / 2, 440, smooth(TL.snap, TL.snap + .2, t), -.08, '#ff6a4a', 120);
      two('LA LESIÓN MÁS TÍPICA', 'DE LA ESCALADA', null, smooth(TL.injury, TL.injury + .3, t), 1480); });
  } else if (t < TL.brand) {
    // F · El Capitán sin cuerda: ~900 m en menos de 4 horas
    cap.visible = true;
    const lt = t - TL.limit; scene.fog.density = .00012; const u = smooth(TL.honnold + .3, TL.brand - .5, t); const cy = routeY(u), cx = routeX(u);
    climbDot.position.set(cx, cy, capZ(cx, cy) + 8);
    for (let i = 0; i < 1500; i++) { const k = i / 1500 * u; const y = routeY(k), x = routeX(k); const f = .6 * (k / Math.max(u, .001)); PS.push(cap.position.x + x, cap.position.y + y, cap.position.z + capZ(x, y) + 6, HOT[0] * f, HOT[1] * f, HOT[2] * f); } PS.mat.size = 10; scene.background.setRGB(.2, .3, .45); scene.fog.color.setRGB(.25, .33, .45);
    focus = cap.position.clone().add(V3(0, lerp(250, 520, smooth(0, TL.brand - TL.limit, lt)), 0)); camOrbit(focus, lerp(2600, 2300, clamp(lt / 10)), .35 + lt * .01, lerp(-.02, .08, clamp(lt / 10)), 40);
    expo = 1.1; bloomS = .5;
    hud.push(() => { two(null, 'Y HAY QUIEN', 'LO LLEVA AL LÍMITE', win(lt, .05, TL.honnold - TL.limit), 300);
      two('2017 · ALEX HONNOLD', 'EL CAPITÁN', 'SIN CUERDA', smooth(TL.honnold, TL.honnold + .3, t), 300);
      const h = Math.round(lerp(0, 900, u)), mins = Math.round(lerp(0, 236, u)); bigStat('ALTURA', fmt(h) + ' m', 1400, smooth(TL.honnold + .4, TL.honnold + .8, t), .5);
      txt(`${Math.floor(mins / 60)} h ${String(mins % 60).padStart(2, '0')} min`, W / 2, 1530, 54, { font: 'Montserrat', weight: 800, alpha: smooth(TL.honnold + .8, TL.honnold + 1.2, t) }); });
  } else {
    // G · marca
    cap.visible = true;
    const lt = t - TL.brand; scene.fog.density = .00012; scene.background.setRGB(.12, .18, .28); scene.fog.color.setRGB(.15, .2, .28); climbDot.position.set(routeX(1), routeY(1), capZ(routeX(1), routeY(1)) + 8);
    focus = cap.position.clone().add(V3(0, 600, 0)); camOrbit(focus, 2600 + lt * 60, .45, .1, 40); expo = .8; fade = Math.min(.5, lt * .45);
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  PS.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, bloom: bloomS, expo });
}
function renderCover() { renderFrame(TL.toe + 2.2); coverText('LAS MANÍAS', 'DEL ESCALADOR', 'y la ciencia que hay detrás'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
