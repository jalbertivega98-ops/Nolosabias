// NO LO SABÍAS — "¿Cómo funciona un aerogenerador?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final. Esquema, no a escala salvo el gancho (metros).
// Palas de ~107–115 m (GE Haliade-X, Vestas V236); punta a ~80–90 m/s (~300 km/h); rotor a ~7–12 rpm; multiplicadora → ~1.500 rpm en máquinas con caja.
// Orientación (yaw) con veleta/anemómetro; parada por encima de ~25 m/s con las palas en bandera. Límite de Betz: 16/27 ≈ 59,3 %.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, easeIn, rng, V3, g2, camera, Particles, txt, copperGrad, project, callout, titleHUD, fract, camOrbit, bigStat, drawBrand, coverText, finish, noise1 } from '../../lib/core.js';

const scene = new THREE.Scene(); const SKY = new THREE.Color(0x8fb4d8); scene.background = SKY.clone();
const hemi = new THREE.HemisphereLight(0xdfeaff, 0x30404a, 1.5); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2e0, 2.8); sun.position.set(300, 400, 500); scene.add(sun);
const fillL = new THREE.DirectionalLight(0x8ab0ff, .6); fillL.position.set(-200, 50, -100); scene.add(fillL);
const M = (c, r = .6, m = .2, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: e });
const box = (w, h, d, mat, x = 0, y = 0, z = 0, parent = scene) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; };
const cylZ = (r, len, mat, z, parent, seg = 32, r2 = r) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r2, r, len, seg), mat); m.rotation.x = Math.PI / 2; m.position.z = z; parent.add(m); return m; };
const COPPER = [1.8, .9, .4], BLUEP = [.4, .9, 1.9], WHITE = [1.3, 1.35, 1.4];
function canvasTex(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

// ---- pala: sección elíptica, cuerda decreciente y torsión ----
const BL = 115; const bladeGeo = (() => { const g = new THREE.CylinderGeometry(.5, .5, 1, 18, 48); g.translate(0, .5, 0); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const u = p.getY(i); const ch = u < .08 ? lerp(3.2, 6.5, u / .08) : lerp(6.5, .9, Math.pow((u - .08) / .92, .8)); const th = u < .08 ? 3.2 : lerp(2.2, .25, (u - .08) / .92);
    let x = p.getX(i) * 2 * ch, z = p.getZ(i) * 2 * th; x += (x > 0 ? .25 : 0) * ch * (1 - u); const tw = (1 - u) * .5; const c = Math.cos(tw), s = Math.sin(tw); p.setXYZ(i, x * c - z * s, u * BL, x * s + z * c); } g.computeVertexNormals(); return g; })();
const bladeMat = M(0xf2f4f6, .45, .05); const towerMat = M(0xe8eaec, .5, .1); const nacMat = M(0xf0f2f4, .4, .1);
function makeTurbine() { const g = new THREE.Group(); const tw = new THREE.Mesh(new THREE.CylinderGeometry(3, 5, 150, 32), towerMat); tw.position.y = 75; g.add(tw);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(5.05, 5.05, 14, 32), M(0xe8c020, .5, .1)); band.position.y = 7; g.add(band);
  const yaw = new THREE.Group(); yaw.position.y = 150; g.add(yaw); const nac = box(9, 9, 22, nacMat, 0, 2, -4, yaw);
  const rotor = new THREE.Group(); rotor.position.set(0, 2, 9); yaw.add(rotor); const hub = new THREE.Mesh(new THREE.SphereGeometry(4.2, 32, 20), nacMat); hub.scale.z = 1.4; rotor.add(hub);
  const blades = []; for (let k = 0; k < 3; k++) { const arm = new THREE.Group(); arm.rotation.z = k / 3 * Math.PI * 2; rotor.add(arm); const pitch = new THREE.Group(); arm.add(pitch); const b = new THREE.Mesh(bladeGeo, bladeMat); b.position.y = 2.5; pitch.add(b); blades.push(pitch); }
  return { g, yaw, rotor, blades, nac }; }

// ==========================================================================
// MAR con aerogenerador principal + parque marino
// ==========================================================================
const sea = new THREE.Group(); scene.add(sea);
const water = new THREE.Mesh(new THREE.PlaneGeometry(30000, 30000, 1, 1), M(0x2e6a8e, .85, 0)); water.rotation.x = -Math.PI / 2; sea.add(water);
const T = makeTurbine(); sea.add(T.g);
const farm = []; { const r = rng(9); for (let i = 0; i < 14; i++) { const t = makeTurbine(); const row = Math.floor(i / 5), col = i % 5; t.g.position.set(-900 + col * 450 + row * 200, 0, -600 - row * 500 - r() * 80); sea.add(t.g); t.ph = r() * 6; farm.push(t); } }
const fieldTex = canvasTex(1050, 680, (x, w, h) => { for (let i = 0; i < 10; i++) { x.fillStyle = i % 2 ? '#3f8a3a' : '#469542'; x.fillRect(i * w / 10, 0, w / 10, h); } x.strokeStyle = '#fff'; x.lineWidth = 6; x.strokeRect(6, 6, w - 12, h - 12); x.beginPath(); x.moveTo(w / 2, 6); x.lineTo(w / 2, h - 6); x.stroke(); x.beginPath(); x.arc(w / 2, h / 2, 91, 0, 7); x.stroke();
  x.strokeRect(6, h / 2 - 201, 165, 402); x.strokeRect(w - 171, h / 2 - 201, 165, 402); x.strokeRect(6, h / 2 - 92, 55, 184); x.strokeRect(w - 61, h / 2 - 92, 55, 184); });
const field = new THREE.Mesh(new THREE.PlaneGeometry(68, 105), new THREE.MeshBasicMaterial({ map: fieldTex, transparent: true, opacity: .9, side: THREE.DoubleSide, depthWrite: false })); sea.add(field);
fieldTex.center.set(.5, .5); fieldTex.rotation = Math.PI / 2;

// ==========================================================================
// PERFIL DE ALA (sección de la pala)
// ==========================================================================
const AF = V3(20000, 0, 0); const afG = new THREE.Group(); afG.position.copy(AF); scene.add(afG);
// NACA 4412 (cuerda 40)
const CH = 40; function naca(x) { const m = .04, p = .4, tt = .12; const yt = 5 * tt * (.2969 * Math.sqrt(x) - .126 * x - .3516 * x * x + .2843 * x ** 3 - .1015 * x ** 4); const yc = x < p ? m / p / p * (2 * p * x - x * x) : m / (1 - p) ** 2 * (1 - 2 * p + 2 * p * x - x * x); return [yc + yt, yc - yt, yc]; }
const afShape = new THREE.Shape(); { const N = 60; for (let i = 0; i <= N; i++) { const x = 1 - (1 - Math.cos(i / N * Math.PI)) / 2; const [u] = naca(x); const X = (x - .5) * CH, Y = u * CH; i ? afShape.lineTo(X, Y) : afShape.moveTo(X, Y); } for (let i = 1; i <= N; i++) { const x = (1 - Math.cos(i / N * Math.PI)) / 2; const [, l] = naca(x); afShape.lineTo((x - .5) * CH, l * CH); } }
const afMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(afShape, { depth: 30, bevelEnabled: false }), M(0xf2f4f6, .4, .05)); afMesh.position.z = -15; afMesh.rotation.z = -.08; afG.add(afMesh);
const afCap = new THREE.Mesh(new THREE.ShapeGeometry(afShape), M(0xc8ccd2, .5, .1)); afCap.position.z = 15.05; afCap.rotation.z = -.08; afG.add(afCap);

// ==========================================================================
// GÓNDOLA SECCIONADA: eje lento → multiplicadora → eje rápido → generador
// ==========================================================================
const NC = V3(-20000, 0, 0); const ncG = new THREE.Group(); ncG.position.copy(NC); scene.add(ncG);
const glass = (c, o) => new THREE.MeshStandardMaterial({ color: c, roughness: .6, metalness: 0, transparent: true, opacity: o, depthWrite: false, side: THREE.DoubleSide });
const housing = box(8, 7, 26, glass(0xe8ecf0, .12), 0, 0, -3, ncG);
const ncHub = new THREE.Mesh(new THREE.SphereGeometry(3.4, 32, 20), M(0xf0f2f4, .4, .1)); ncHub.scale.z = 1.3; ncHub.position.z = 12; ncG.add(ncHub);
const roots = new THREE.Group(); roots.position.z = 12; ncG.add(roots); for (let k = 0; k < 3; k++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 9, 24), M(0xf2f4f6, .45, .05)); const a = k / 3 * 6.283; r.position.set(Math.sin(a) * 6.5, Math.cos(a) * 6.5, 0); r.rotation.z = -a; roots.add(r); }
const slow = new THREE.Group(); ncG.add(slow); cylZ(.9, 9, M(0xa8b0b8, .3, .9), 6, slow, 24); for (let k = 0; k < 4; k++) box(.25, 1.9, .5, M(0xd0a060, .3, .9), 0, 0, 3 + k * 2, slow).position.y = .9;
const gearbox = new THREE.Group(); gearbox.position.z = -1; ncG.add(gearbox); cylZ(3, 4.4, glass(0x9aa4b0, .22), 0, gearbox, 40);
function gear(r, n, th, mat) { const g = new THREE.Group(); cylZ(r, th, mat, 0, g, 32); for (let i = 0; i < n; i++) { const a = i / n * 6.283; const tth = box(r * .22, r * .3, th, mat, Math.cos(a) * r, Math.sin(a) * r, 0, g); tth.rotation.z = a; } return g; }
const gMat = M(0xc8a060, .3, .9); const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, .25, 8, 48), gMat); gearbox.add(ring);
const sunG = gear(.8, 10, 1.6, gMat); gearbox.add(sunG); const planets = []; for (let k = 0; k < 3; k++) { const p = gear(.9, 11, 1.6, M(0xb08a50, .3, .9)); gearbox.add(p); planets.push(p); }
const fast = new THREE.Group(); ncG.add(fast); cylZ(.35, 5, M(0xc0c6cc, .25, .9), -6, fast, 16); for (let k = 0; k < 3; k++) box(.15, .8, .3, M(0xff8040, .3, .5, 0x401000), 0, .4, -5 + k * 1.2, fast);
const genG = new THREE.Group(); genG.position.z = -11; ncG.add(genG); cylZ(2.6, 5, glass(0x8090a8, .2), 0, genG, 40);
for (let k = 0; k < 6; k++) { const c = new THREE.Mesh(new THREE.TorusGeometry(2.3, .22, 8, 40), M(0xc87a40, .3, .9)); c.position.z = -2 + k * .8; genG.add(c); }
const genRotor = new THREE.Group(); genG.add(genRotor); cylZ(1.3, 4.4, M(0x6a7078, .3, .8), 0, genRotor, 24); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; const m = box(.6, .5, 4.2, M(k % 2 ? 0xc03030 : 0x3050c0, .4, .3), Math.cos(a) * 1.45, Math.sin(a) * 1.45, 0, genRotor); m.rotation.z = a; }
// veleta y anemómetro sobre la góndola
const vane = new THREE.Group(); vane.position.set(0, 4.8, -13); ncG.add(vane); box(.15, 2.4, .15, M(0x9aa0a8, .4, .7), 0, 0, 0, vane); const fin = box(.08, 1, 1.8, M(0xe0e4e8, .4, .3), 0, 1.2, -1, vane);
const anem = new THREE.Group(); anem.position.set(1.8, 6.2, -13); ncG.add(anem); box(.12, 2.4, .12, M(0x9aa0a8, .4, .7), 0, -1.2, 0, anem); const cups = new THREE.Group(); anem.add(cups); for (let k = 0; k < 3; k++) { const a = k / 3 * 6.283; const c = new THREE.Mesh(new THREE.SphereGeometry(.28, 12, 8, 0, Math.PI), M(0xe0e4e8, .4, .3)); c.position.set(Math.cos(a) * .8, 0, Math.sin(a) * .8); c.rotation.y = -a; cups.add(c); }

// ==========================================================================
// TIMELINE
// ==========================================================================
const P = new Particles(22000, { size: .5, seed: 43 }); scene.add(P.obj);
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
const L = (t, a, b) => smooth(TL[a], TL[a] + .3, t) * (b ? 1 - smooth(TL[b] - .1, TL[b] + .1, t) : 1);
function show(o) { sea.visible = !!o.sea; afG.visible = !!o.af; ncG.visible = !!o.nc; field.visible = !!o.field; farm.forEach(f => f.g.visible = !!o.farm); }
function setPitch(tb, a) { tb.blades.forEach(b => b.rotation.y = a); }
// ángulo integrado del rotor: rpm(t) a trozos (rad/s), integrado numéricamente y cacheado
const rotTab = []; const rotW = t => { if (t < TL.tip) return 0; if (t < TL.storm) return 1.05 * smooth(TL.tip, TL.tip + 1, t); return 1.05 * (1 - smooth(TL.feather, TL.stop + .5, t)); };
{ let a = 0; for (let i = 0; i <= 2400; i++) { rotTab.push(a); a += rotW(i / 30) / 30; } }
const rotA = t => { const i = clamp(t * 30, 0, 2399); const k = Math.floor(i); return lerp(rotTab[k], rotTab[k + 1], i - k); };
// partículas de viento en el mar
function wind(t, c, n, spd, amp, dir = V3(0, 0, -1), size = [300, 220, 260], sd = 0) { const s = P.seed; for (let i = 0; i < n; i++) { const q = ((i + sd) % P.n) * 4; const u = fract(s[q] + t * spd); const p = c.clone().add(V3((s[q + 1] - .5) * size[0], (s[q + 2] - .3) * size[1], 0)).addScaledVector(dir, (u - .5) * size[2]); const f = amp * Math.sin(u * Math.PI); for (let k = 0; k < 3; k++) { const pk = p.clone().addScaledVector(dir, -k * 3); P.push(pk.x, pk.y, pk.z, WHITE[0] * f, WHITE[1] * f, WHITE[2] * f); } } }

function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .3; camera.far = 20000;
  let bloomS = .6, flash = 0, ca = .0012, fade = 0, grain = .03, expo = 1.05, dim = 0;
  P.begin(); P.mat.size = .6; show({}); scene.background.copy(SKY); scene.fog = null; hemi.intensity = 1.5;
  for (const c of ['how', 'wing', 'three', 'elec', 'generator', 'thinks', 'storm', 'why', 'curious', 'brand']) flash = Math.max(flash, flashAt(t, TL[c], .28, .2));
  const hud = []; const ra = rotA(t);
  T.yaw.rotation.y = 0; setPitch(T, 0); T.rotor.rotation.z = ra;
  if (t < TL.how) {
    // A · una pala más larga que un campo de fútbol; la punta a 300 km/h
    show({ sea: true, field: t < TL.tip + .6 }); const z = easeInOut(smooth(TL.tip - .2, TL.tip + 1.2, t)); T.rotor.rotation.z = Math.PI / 2 + ra; // una pala hacia la izquierda
    field.position.set(-62, 104, 11); field.rotation.z = Math.PI / 2; field.material.opacity = .9 * (1 - smooth(TL.tip, TL.tip + .6, t));
    camOrbit(V3(lerp(-55, -10, z), lerp(118, 130, z), 0), lerp(lerp(340, 310, t / TL.tip), 430, z), lerp(.08, .55, z), lerp(.05, .12, z), 38);
    if (t > TL.tip) { const s = P.seed; const n = 700; for (let i = 0; i < n; i++) { const u = i / n; const a = ra + Math.PI / 2 - u * 1.4 * smooth(TL.tip, TL.tip + .5, t); for (let k = 0; k < 3; k++) { const ang = a + k / 3 * 6.283 - Math.PI / 2; const R = BL + 2; const p = V3(Math.cos(ang) * R, 152 + Math.sin(ang) * R, 9); const f = (1 - u) * 1.2; P.push(p.x, p.y, p.z, f * 1.4, f * 1.2, f * .8); } } P.mat.size = 2.2; }
    hud.push(() => { titleHUD('CADA PALA MIDE MÁS QUE', 'UN CAMPO DE FÚTBOL…', smooth(.1, .4, t) * (1 - smooth(TL.tip - .1, TL.tip + .1, t)), 300);
      const fa = smooth(.9, 1.3, t) * (1 - smooth(TL.tip - .2, TL.tip, t)); callout(V3(-62, 80, 11), 40, 300, '105 m', 'campo de fútbol', fa, '#9fe39a'); callout(V3(-70, 153, 12), 40, -150, '115 m', 'una pala', fa);
      titleHUD('…Y SU PUNTA GIRA A', '', L(t, 'tip'), 300); bigStat('', '300 km/h', 420, L(t, 'tip'), clamp((t - TL.tip) / 1.5)); });
  } else if (t < TL.three) {
    // B · no la empuja como a una vela: perfil de ala; más rápido arriba → menos presión → tira
    show({ af: true }); scene.background.setRGB(.05, .08, .12); const lt = t - TL.how; const s = P.seed; const on = smooth(TL.sail, TL.wing + .5, t);
    const fast2 = smooth(TL.faster - .2, TL.faster + .6, t);
    for (let li = 0; li < 34; li++) { const y0 = (li - 16.5) * 1.9 + (li >= 17 ? 1.2 : -1.2); const z0 = 0; const up = y0 > 0; const sp = up ? lerp(.5, .9, fast2) : .5; const decay = Math.exp(-Math.abs(y0) / 9);
      for (let i = 0; i < 420; i++) { const x = lerp(-70, 70, i / 419); const xn = clamp(x / CH + .5, 0, 1); const inside = x > -CH / 2 && x < CH / 2; const [uu, ll] = naca(xn); const surf = up ? uu * CH : ll * CH;
        let y = y0 + (inside ? surf * decay * (up ? 1.4 : .7) : 0) - (x > CH / 2 ? (x - CH / 2) * .05 * decay : 0); if (inside) y = up ? Math.max(y, uu * CH + .8) : Math.min(y, ll * CH - .8);
        const dash = Math.pow(.5 + .5 * Math.cos((x / 14 - t * sp * 6 + li * .37) * 6.283), 6); const edge = smooth(-70, -55, x) * (1 - smooth(55, 70, x)); const f = on * edge * (.35 + 1.3 * dash) * (.4 + .6 * decay);
        const col = up ? [lerp(.6, .45, fast2), lerp(1, 1.3, fast2), lerp(1.6, 1.9, fast2)] : [1.4, 1.1, .7]; const ca2 = Math.cos(-.08), sa2 = Math.sin(-.08); P.push(AF.x + x * ca2 - y * sa2, AF.y + x * sa2 + y * ca2, AF.z + 16, col[0] * f, col[1] * f, col[2] * f); } }
    camOrbit(AF.clone().add(V3(0, 2, 0)), lerp(112, 104, lt / 10), .12, .1, 36); P.mat.size = 1.0; bloomS = .9; expo = 1.15;
    const lift = smooth(TL.pressure + .3, TL.pressure + 1, t);
    hud.push(() => { titleHUD('¿Y CÓMO LO MUEVE', 'EL VIENTO?', L(t, 'how', 'sail'), 300); titleHUD('NO LO EMPUJA', 'COMO A UNA VELA', L(t, 'sail', 'wing'), 300); titleHUD('LAS PALAS TIENEN FORMA', 'DE ALA DE AVIÓN', L(t, 'wing', 'faster'), 300);
      titleHUD('EL AIRE VA MÁS RÁPIDO', 'POR ARRIBA', L(t, 'faster', 'pressure'), 300); titleHUD('LA DIFERENCIA DE PRESIÓN', 'TIRA DE LA PALA', L(t, 'pressure'), 300);
      const pa = project(AF.clone().add(V3(-2, 16, 0))), pb = project(AF.clone().add(V3(-2, -12, 0))); const pr = smooth(TL.pressure, TL.pressure + .4, t);
      txt('− PRESIÓN', pa.x, pa.y - 60, 40, { weight: 800, alpha: pr, fill: '#7fd4ff' }); txt('+ PRESIÓN', pb.x, pb.y + 90, 40, { weight: 800, alpha: pr, fill: '#ffb070' });
      if (lift > 0) { const c = project(AF.clone().add(V3(-2, 2, 0))); g2.save(); g2.globalAlpha = lift; g2.strokeStyle = '#e3a372'; g2.fillStyle = '#e3a372'; g2.lineWidth = 10; const L2 = 260 * lift; g2.beginPath(); g2.moveTo(c.x, c.y); g2.lineTo(c.x, c.y - L2); g2.stroke(); g2.beginPath(); g2.moveTo(c.x - 26, c.y - L2 + 10); g2.lineTo(c.x + 26, c.y - L2 + 10); g2.lineTo(c.x, c.y - L2 - 34); g2.fill(); g2.restore();
        txt('FUERZA', c.x + 110, c.y - L2 * .6, 30, { weight: 800, spacing: 3, alpha: lift }); } });
  } else if (t < TL.elec) {
    // C · las tres palas giran el rotor… despacio: ~10 rpm
    show({ sea: true }); const lt = t - TL.three; wind(t, V3(0, 130, 120), 500, .6, .5, V3(0, 0, -1), [300, 240, 300]);
    camOrbit(V3(0, 120, 0), lerp(470, 440, lt / 4.5), .75 + lt * .03, .08, 40); P.mat.size = 1.6;
    hud.push(() => { titleHUD('LAS TRES JUNTAS HACEN', 'GIRAR EL ROTOR…', L(t, 'three', 'slow'), 300); titleHUD('…PERO DESPACIO', '', L(t, 'slow'), 300); bigStat('', '≈ 10 vueltas/min', 430, L(t, 'ten'), clamp((t - TL.ten) / 1.2)); });
  } else if (t < TL.thinks) {
    // D · góndola: multiplicadora y generador
    show({ nc: true }); scene.background.setRGB(.05, .07, .1); const lt = t - TL.elec; const aS = t * 1.05; roots.rotation.z = aS; ncHub.rotation.z = aS; slow.rotation.z = aS;
    const mult = smooth(TL.multiply, TL.multiply + 1.5, t); const wF = lerp(1.05, 16, mult); const aF = t * wF; fast.rotation.z = aF; genRotor.rotation.z = aF; sunG.rotation.z = aF * .9; ring.rotation.z = 0;
    planets.forEach((p, k) => { const a = k / 3 * 6.283 + aS * .6; p.position.set(Math.cos(a) * 1.7, Math.sin(a) * 1.7, 0); p.rotation.z = -aF * .6; });
    const cur = smooth(TL.current - .3, TL.current + .5, t); if (cur > 0) { const s = P.seed; for (let i = 0; i < 1600; i++) { const q = (i % P.n) * 4; const u = fract(s[q] + t * 1.2); const a = s[q + 1] * 6.283; const p = u < .4 ? V3(Math.cos(a) * 2.4, Math.sin(a) * 2.4, -11 + (s[q + 2] - .5) * 4) : V3((s[q + 2] - .5) * .5, -3.5 - (u - .4) * 40, -13 + (s[q + 3] - .5) * .5);
      const f = cur * (u < .4 ? 1 : 1.4); P.push(NC.x + p.x, NC.y + p.y, NC.z + p.z, 1.8 * f, 1.5 * f, .4 * f); } }
    const zT = t < TL.gearbox ? 4 : t < TL.generator ? lerp(4, -1, easeInOut(smooth(TL.gearbox - .2, TL.gearbox + .8, t))) : lerp(-1, -9, easeInOut(smooth(TL.generator - .2, TL.generator + .8, t)));
    camOrbit(NC.clone().add(V3(0, 0, zT)), t < TL.nacelle ? lerp(80, 64, lt / 1.8) : lerp(60, 54, lt / 11), 1.3, .3, 38); P.mat.size = .35; bloomS = .9; expo = 1.2; hemi.intensity = 1.3;
    hud.push(() => { titleHUD('¿Y ESO BASTA PARA', 'HACER ELECTRICIDAD?', L(t, 'elec', 'nacelle'), 300); titleHUD('ARRIBA, EN LA GÓNDOLA:', 'CAJA DE ENGRANAJES', L(t, 'nacelle', 'multiply'), 300);
      titleHUD('MULTIPLICA EL GIRO', '', L(t, 'multiply', 'generator'), 300); titleHUD('EL GENERADOR: IMANES', 'DENTRO DE BOBINAS DE COBRE', L(t, 'generator', 'current'), 300); titleHUD('EL GIRO SE CONVIERTE', 'EN CORRIENTE', L(t, 'current'), 300);
      const ga = smooth(TL.multiply, TL.multiply + .4, t) * (1 - smooth(TL.generator, TL.generator + .3, t));
      callout(NC.clone().add(V3(0, 1, 6)), 60, 330, '10 rpm', 'eje lento', ga, '#c8c8c8'); callout(NC.clone().add(V3(0, .4, -6.5)), 70, 360, Math.round(lerp(10, 1500, mult)).toLocaleString('es-ES') + ' rpm', 'eje rápido', ga * smooth(TL.multiply + .2, TL.multiply + .6, t));
      callout(NC.clone().add(V3(0, 2.6, -11)), 40, -240, 'IMANES + COBRE', null, smooth(TL.magnets, TL.magnets + .4, t) * (1 - smooth(TL.current + 1, TL.current + 1.3, t))); });
  } else if (t < TL.storm) {
    // E · el molino piensa: veleta + motores de orientación
    show({ nc: true }); scene.background.setRGB(.14, .2, .28); const lt = t - TL.thinks; roots.rotation.z = ncHub.rotation.z = slow.rotation.z = t * 1.05; fast.rotation.z = genRotor.rotation.z = t * 16;
    const wd = lerp(.9, 0, easeInOut(smooth(TL.thinks + .5, TL.vane + .8, t))) * 0 + .9; const yaw = lerp(0, .9, easeInOut(smooth(TL.yaw, TL.yaw + 2.2, t))); ncG.rotation.y = yaw; vane.rotation.y = wd - yaw; cups.rotation.y = t * 9;
    const s = P.seed; const dir = V3(-Math.sin(wd), 0, -Math.cos(wd)); for (let i = 0; i < 700; i++) { const q = (i % P.n) * 4; const u = fract(s[q] + t * .7); const side = V3(Math.cos(wd), 0, -Math.sin(wd)); const p = NC.clone().addScaledVector(side, (s[q + 1] - .5) * 60).add(V3(0, (s[q + 2] - .5) * 30, 0)).addScaledVector(dir, (u - .5) * 80);
      for (let k = 0; k < 4; k++) { const pk = p.clone().addScaledVector(dir, -k * .8); const f = .5 * Math.sin(u * Math.PI); P.push(pk.x, pk.y, pk.z, f, f * 1.05, f * 1.15); } }
    camOrbit(NC.clone().add(V3(0, 2, -4)), lerp(64, 58, lt / 5.7), .7 - lt * .02, .85, 38); P.mat.size = .5; expo = 1.15;
    hud.push(() => { titleHUD('ADEMÁS,', 'EL MOLINO PIENSA', L(t, 'thinks', 'vane'), 300); titleHUD('UNA VELETA', 'MIDE EL VIENTO', L(t, 'vane', 'yaw'), 300); titleHUD('LOS MOTORES GIRAN LA CABEZA', 'PARA MIRARLO DE FRENTE', L(t, 'yaw'), 300);
      callout(vane.getWorldPosition(V3()).add(V3(0, 2, 0)), -60, -220, 'VELETA', null, smooth(TL.vane, TL.vane + .4, t) * (1 - smooth(TL.yaw + .5, TL.yaw + .8, t)), '#9fd4ff');
      callout(anem.getWorldPosition(V3()), 60, -260, 'ANEMÓMETRO', null, smooth(TL.vane + .4, TL.vane + .8, t) * (1 - smooth(TL.yaw + .5, TL.yaw + .8, t)), '#9fd4ff'); });
  } else if (t < TL.why) {
    // F · tormenta: palas en bandera y parada
    show({ sea: true }); scene.background.setRGB(.36, .42, .5); hemi.intensity = 1.1; const lt = t - TL.storm; const fe = easeInOut(smooth(TL.feather, TL.feather + 1.2, t)); setPitch(T, fe * Math.PI / 2);
    wind(t, V3(0, 130, 120), 1400, 1.6, .55, V3(.15, -.05, -1).normalize(), [380, 260, 340]);
    camOrbit(V3(0, 140, 0), lerp(380, 340, lt / 4), .9 + lt * .02, .12, 40); P.mat.size = 1.6;
    hud.push(() => { titleHUD('SI SOPLA', 'DEMASIADO FUERTE…', L(t, 'storm', 'feather'), 300); titleHUD('PONEN LAS PALAS', 'DE CANTO', L(t, 'feather', 'stop'), 300); titleHUD('…Y SE PARA', 'PARA NO ROMPERSE', L(t, 'stop'), 300);
      txt('viento > 90 km/h', W / 2, 1520, 34, { weight: 700, alpha: L(t, 'storm', 'stop') }); });
  } else if (t < TL.curious) {
    // G · ¿por qué no todo el viento? tubo de corriente; límite de Betz 59 %
    show({ sea: true }); const lt = t - TL.why; T.rotor.rotation.z = t * 1.05; T.yaw.rotation.y = 0; const s = P.seed;
    const full = smooth(TL.brake, TL.brake + .8, t) * (1 - smooth(TL.betz - .3, TL.betz + .3, t)); const opt = smooth(TL.betz - .3, TL.betz + .3, t);
    if (full > .5) T.rotor.rotation.z = TL.brake * 1.05;
    for (let i = 0; i < 1600; i++) { const q = (i % P.n) * 4; const a = s[q] * 6.283, rr = Math.sqrt(s[q + 1]) * 100; const sp = .5; let u = fract(s[q + 2] + t * sp * (1 - full * .85));
      // z de 300 (delante) a -300 (detrás); tras el rotor se frena y se ensancha
      const z = lerp(320, -320, u); const behind = z < 9 ? 1 : 0; const slowF = behind ? lerp(1, 1.0 + .25 * opt + .9 * full, smooth(9, -120, z)) : 1; let zz = z;
      if (full > .01 && z < 9) zz = lerp(z, 9 - (9 - z) * .15, full);
      const ex = 1 + (behind ? .35 * opt * smooth(9, -150, z) : -.08 * opt * smooth(320, 9, z)); const p = V3(Math.cos(a) * rr * ex, 152 + Math.sin(a) * rr * ex, zz);
      const col = behind ? [lerp(1.3, .5, opt), lerp(1.35, .9, opt), lerp(1.4, 1.6, opt)] : WHITE; const f = 1.1 * Math.sin(u * Math.PI); P.push(p.x, p.y, p.z, col[0] * f, col[1] * f, col[2] * f); for (let k = 1; k < 4; k++) P.push(p.x, p.y, p.z + k * 7 * (1 - full * .8), col[0] * .5 * (1 - k / 4), col[1] * .5 * (1 - k / 4), col[2] * .5 * (1 - k / 4)); }
    camOrbit(V3(0, 145, -40), lerp(560, 520, lt / 8.7), 1.42, .1, 40); P.mat.size = 5; scene.background.setRGB(.3, .42, .56);
    hud.push(() => { titleHUD('¿Y POR QUÉ NO CAPTURA', 'TODO EL VIENTO?', L(t, 'why', 'brake'), 300); titleHUD('SI LO FRENARA DEL TODO', 'EL AIRE SE ATASCARÍA DETRÁS', L(t, 'brake', 'betz'), 300);
      titleHUD('COMO MÁXIMO, PUEDE APROVECHAR', '', L(t, 'betz'), 300); bigStat('', '59 %', 430, L(t, 'betz'), clamp((t - TL.betz) / 1.4)); txt('límite de Betz (1919)', W / 2, 560, 32, { weight: 300, alpha: smooth(TL.betz + .8, TL.betz + 1.2, t) });
      txt('VIENTO →', W * .2, 1500, 30, { weight: 800, spacing: 3, alpha: L(t, 'why') * .8 }); });
  } else if (t < TL.brand) {
    // H · parque marino; una vuelta = ~2 días de una casa
    show({ sea: true, farm: true }); const lt = t - TL.curious; scene.background.setRGB(lerp(.56, .92, smooth(TL.curious, TL.brand, t)), lerp(.7, .68, smooth(TL.curious, TL.brand, t)), lerp(.85, .5, smooth(TL.curious, TL.brand, t))); dim = .55 * L(t, 'days'); sun.color.setRGB(1, .9, .78);
    T.rotor.rotation.z = t * 1.05; farm.forEach(f => f.rotor.rotation.z = t * 1.05 + f.ph);
    const turnU = clamp((t - TL.turn) / (TL.days - TL.turn)); const turnA = turnU * 6.283;
    if (t > TL.turn - .2) { T.rotor.rotation.z = TL.turn * 1.05 + turnA; const n = 900; for (let i = 0; i < n; i++) { const u = i / n; const a = TL.turn * 1.05 + Math.PI / 2 + u * turnA; const p = V3(Math.cos(a) * (BL + 2), 152 + Math.sin(a) * (BL + 2), 9); const f = 1.6 * smooth(0, .1, u) * (.6 + .4 * u); P.push(p.x, p.y, p.z, f * 1.1, f * .85, f * .45); } }
    camOrbit(t < TL.turn ? V3(-120, 110, -500) : V3(0, 140, 0), t < TL.turn ? lerp(1500, 1350, lt / 3) : lerp(470, 440, (t - TL.turn) / 4), t < TL.turn ? .4 : .1, t < TL.turn ? .1 : .05, 40); P.mat.size = 3;
    hud.push(() => { titleHUD('Y LO MÁS', 'CURIOSO', L(t, 'curious', 'offshore'), 300); titleHUD('EN LOS AEROGENERADORES', 'MARINOS MÁS GRANDES…', L(t, 'offshore', 'turn'), 300);
      titleHUD('UNA SOLA VUELTA', '', L(t, 'turn'), 300); txt(Math.round(turnU * 360) + '°', W / 2, 470, 70, { font: 'Montserrat', weight: 800, alpha: L(t, 'turn') * (1 - smooth(TL.days - .2, TL.days, t)) });
      bigStat('UNA CASA DURANTE', '≈ 2 DÍAS', 470, L(t, 'days'), clamp((t - TL.days) / 1.2)); });
  } else {
    // I · marca
    show({ sea: true, farm: true }); const lt = t - TL.brand; scene.background.setRGB(.92, .68, .5); T.rotor.rotation.z = t * 1.05; farm.forEach(f => f.rotor.rotation.z = t * 1.05 + f.ph);
    camOrbit(V3(-120, 110, -500), 1500 + lt * 40, .4 + lt * .02, .1, 40); expo = .9; dim = smooth(0, .8, lt) * .6;
    hud.push(() => drawBrand(lt - .3)); fade = smooth(TL.end - .6, TL.end, t) * .3;
  }
  if (!(t >= TL.curious)) sun.color.setRGB(1, .95, .88);
  if (!(t >= TL.thinks && t < TL.storm)) ncG.rotation.y = 0;
  P.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (dim > 0) hud.unshift(() => { g2.save(); g2.globalAlpha = dim * .7; g2.fillStyle = '#02050b'; g2.fillRect(0, 0, W, H); g2.restore(); });
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
function renderCover() { renderFrame(1.6); coverText('¿CÓMO FUNCIONA', 'ESTE GIGANTE?', 'Cada pala, más larga que un campo de fútbol'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
