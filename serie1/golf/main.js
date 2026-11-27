// NO LO SABÍAS — "¿Por qué las pelotas de golf tienen agujeros?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final.
// Pelota lisa: capa límite laminar, se separa hacia ~80° desde el punto de remanso → estela ancha, Cd ≈ 0,5.
// Con hoyuelos: capa límite turbulenta, separación hacia ~110-120° → estela estrecha, Cd ≈ 0,25 (casi la mitad).
// Backspin: efecto Magnus, la estela se desvía hacia abajo y aparece sustentación. Pelotas modernas: ~300-500 hoyuelos.
// Siglo XIX (gutta-percha, desde 1848): las pelotas marcadas por el uso volaban más; se empezaron a martillear y luego a moldear con relieve.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3,
  g2, camera, Particles, txt, copperGrad, project, bar, fract, arrowXY, drawBrand, coverText, finish } from '../../lib/core.js';

const scene = new THREE.Scene();
const hemi = new THREE.HemisphereLight(0xe8f0ff, 0x3a4a2a, 1.2); scene.add(hemi);
const sunL = new THREE.DirectionalLight(0xfff1dc, 2.8); sunL.position.set(30, 50, 20); scene.add(sunL); scene.add(sunL.target);
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .6, ...o });
const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uZen: { value: new THREE.Color(.12, .32, .7) }, uHor: { value: new THREE.Color(.75, .85, .95) }, uSep: { value: 0 } },
  vertexShader: `varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 uZen,uHor; uniform float uSep; varying vec3 vD; void main(){ float y=clamp(vD.y,0.,1.); vec3 c=mix(uHor,uZen,pow(y,.5)); float l=dot(c,vec3(.3,.59,.11)); c=mix(c,vec3(l*1.1,l*.92,l*.7),uSep); gl_FragColor=vec4(c,1.); }` });
const sky = new THREE.Mesh(new THREE.SphereGeometry(3000, 32, 16), skyMat); sky.renderOrder = -1; scene.add(sky);
scene.fog = new THREE.FogExp2(new THREE.Color(.75, .84, .92), .0015);

// ==========================================================================
// PELOTAS: con hoyuelos, lisa, antigua (gutta-percha) lisa y con golpes
// ==========================================================================
function fib(n) { const out = []; const g = Math.PI * (3 - Math.sqrt(5)); for (let i = 0; i < n; i++) { const y = 1 - (i + .5) / n * 2, r = Math.sqrt(1 - y * y); out.push(V3(Math.cos(g * i) * r, y, Math.sin(g * i) * r)); } return out; }
function dimpledGeo(centers, rad, depth, seg = 220) { const g = new THREE.SphereGeometry(1, seg, seg / 2); const p = g.attributes.position; const v = V3(); const cosR = Math.cos(rad);
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).normalize(); let best = -1, bd = 0; for (const c of centers) { const d = v.dot(c); if (d > best) { best = d; bd = d; } }
    let r = 1; if (bd > cosR) { const a = Math.acos(Math.min(1, bd)) / rad; r = 1 - depth[0] * (1 - a * a) * (depth[1] ? (.6 + .4 * Math.sin(i)) : 1); } p.setXYZ(i, v.x * r, v.y * r, v.z * r); }
  g.computeVertexNormals(); return g; }
const DIMPLES = fib(392);
const ballGeo = dimpledGeo(DIMPLES, .105, [.035, 0]);
const whiteM = new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: .5 });
const ball = new THREE.Mesh(ballGeo, whiteM); scene.add(ball);
const smoothBall = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), whiteM); scene.add(smoothBall);
const oldM = new THREE.MeshStandardMaterial({ color: 0x8a6446, roughness: .5 });
const oldBall = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), oldM); scene.add(oldBall);
const battered = (() => { const r = rng(17); const cs = []; for (let i = 0; i < 70; i++) cs.push(V3(r() - .5, r() - .5, r() - .5).normalize()); return new THREE.Mesh(dimpledGeo(cs, .16, [.05, 1], 160), oldM); })(); scene.add(battered);
const BALLS = [ball, smoothBall, oldBall, battered];

// ==========================================================================
// CAMPO DE GOLF
// ==========================================================================
const course = new THREE.Group(); scene.add(course);
{ const g = new THREE.PlaneGeometry(1600, 1600, 160, 160); g.rotateX(-Math.PI / 2); const p = g.attributes.position; const col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); const fair = Math.abs(x - Math.sin(-z * .004) * 30) < 28 && z < 20 && z > -330; const stripe = Math.floor(-z / 12) % 2 ? 1 : .9;
    const h = fair ? 0 : (Math.sin(x * .02) * Math.cos(z * .017) + 1) * 2.2 * smooth(30, 80, Math.abs(x)); p.setY(i, h); const c = fair ? [.36 * stripe, .62 * stripe, .26 * stripe] : [.22, .42, .18]; col.set(c, i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); course.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95 })));
  const green = new THREE.Mesh(new THREE.CircleGeometry(16, 48), M(0x4fa040, { roughness: .9 })); green.rotation.x = -Math.PI / 2; green.position.set(Math.sin(300 * .004) * 30, .05, -300); course.add(green);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 4, 8), M(0xeeeeee)); pole.position.set(green.position.x, 2, -300); course.add(pole);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1), new THREE.MeshStandardMaterial({ color: 0xd8342a, side: THREE.DoubleSide })); flag.position.set(green.position.x + .8, 3.5, -300); course.add(flag);
  const r = rng(5); const cone = new THREE.ConeGeometry(1, 2.4, 8); const lm = M(0x2a4a26, { roughness: .9 });
  for (let i = 0; i < 160; i++) { const side = r() < .5 ? -1 : 1; const z = -r() * 420 + 30; const x = side * (40 + r() * 140); const s = 3 + r() * 5; const tr = new THREE.Mesh(cone, lm); tr.scale.set(s, s * 1.3, s); tr.position.set(x, s * 1.3, z); course.add(tr); }
  const tee = new THREE.Mesh(new THREE.CylinderGeometry(.0055, .0018, .05, 12), M(0xe8e0c8)); tee.position.set(0, .025, 0); course.add(tee); }
// trayectorias (física simple: arrastre + sustentación)
function flight(cd, cl, v0 = 72, ang = 12) { const pts = []; let x = 0, y = .05, vx = v0 * Math.cos(ang * Math.PI / 180), vy = v0 * Math.sin(ang * Math.PI / 180); const k = 1.2 * .00143 / (2 * .0459), dt = .02;
  for (let i = 0; i < 2000 && y >= 0; i++) { const v = Math.hypot(vx, vy); const ax = -k * v * (cd * vx + cl * vy), ay = -9.81 + k * v * (cl * vx - cd * vy); vx += ax * dt; vy += ay * dt; x += vx * dt; y += vy * dt; pts.push(V3(0, Math.max(0, y), -x)); } return pts; }
function makeTrail(pts, col) { const sub = pts.filter((p, i) => i % 3 === 0 || i === pts.length - 1); const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sub), sub.length, .45, 8, false); const l = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .9, depthWrite: false, fog: false })); l.frustumCulled = false; scene.add(l); l.userData.pts = pts; l.userData.segs = sub.length; return l; }
const PT_D = flight(.25, .17), PT_S = flight(.5, .05), PT_OLD = flight(.48, .05, 55), PT_OLDB = flight(.3, .12, 55);
const trD = makeTrail(PT_D, new THREE.Color(1.8, 1.4, .9)), trS = makeTrail(PT_S, new THREE.Color(1.2, 1.4, 1.8)), trO = makeTrail(PT_OLD, new THREE.Color(1.2, 1.4, 1.8)), trOB = makeTrail(PT_OLDB, new THREE.Color(1.8, 1.4, .9));
const TRAILS = [trD, trS, trO, trOB];
const distOf = pts => -pts[pts.length - 1].z;
function showTrail(l, k, dx = 0) { l.visible = k > 0; l.position.x = dx; const n = Math.max(2, Math.floor(l.userData.pts.length * clamp(k))); l.geometry.setDrawRange(0, Math.floor(l.userData.segs * clamp(k)) * 8 * 6); return l.userData.pts[n - 1].clone().add(V3(dx, 0, 0)); }
const marker = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(2, 2, 2) })), marker2 = marker.clone(); scene.add(marker, marker2);

// ==========================================================================
// TÚNEL DE VIENTO (plano z = 0, pelota de radio 1 en el origen). Aire de derecha a izquierda: la pelota "avanza" hacia +x.
// ==========================================================================
const LAB = V3(0, 2000, 0);
const PS = new Particles(40000, { size: .1, seed: 5 }); scene.add(PS.obj);
const NS = 34, XS = 160, X0 = -7, X1 = 6; const psis = []; for (let i = 0; i < NS; i++) { const s = (i + .5) / NS; psis.push((i % 2 ? 1 : -1) * (.03 + Math.pow(s, 1.4) * 3.4)); }
const potY = (x, psi) => { const a = Math.abs(psi); let lo = Math.sqrt(Math.max(0, 1 - x * x)) + 1e-4, hi = a + 2.5; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; const f = m * (1 - 1 / (x * x + m * m)) - a; f > 0 ? hi = m : lo = m; } return (lo + hi) / 2 * Math.sign(psi); };
const TAB = psis.map(ps => { const a = new Float32Array(XS); for (let j = 0; j < XS; j++) a[j] = potY(lerp(X0, X1, j / (XS - 1)), ps); return a; });
// flujo con separación (marco: aire hacia +x; luego se refleja x → −x)
function flowY(i, xf, sepDeg, spread, floor) { const j = clamp((xf - X0) / (X1 - X0) * (XS - 1), 0, XS - 1); const j0 = Math.floor(j), f = j - j0; let y = lerp(TAB[i][j0], TAB[i][Math.min(XS - 1, j0 + 1)], f);
  const ph = sepDeg * Math.PI / 180; const xs = -Math.cos(ph), ys = Math.sin(ph); if (xf > xs) { const hw = Math.max(floor, ys + (xf - xs) * spread); if (Math.abs(y) < hw) y = Math.sign(y) * hw; } return y; }
function wind(t, o) { // o: {sep, spread, floor, a, spin, bl, turb, wake}
  const { sep, spread, floor } = o; const ph = sep * Math.PI / 180, xs = -Math.cos(ph), ys = Math.sin(ph); const L = o.L ?? 5;
  const defl = (xf) => xf > .3 ? -(xf - .3) * .38 * (o.spin || 0) : 0;
  for (let i = 0; i < NS; i++) { for (let k = 0; k < 140; k++) { const s = PS.seed[(20000 + i * 140 + k) * 4 % (PS.n * 4)]; const u = fract(s + t * .35); const xf = lerp(X0, X1, u); let y = flowY(i, xf, sep, spread, floor) + defl(xf) * smooth(1.5, 0, Math.abs(psis[i]));
      const al = o.a * 1.3 * smooth(0, .08, u) * (1 - smooth(.92, 1, u)); PS.push(LAB.x - xf, LAB.y + y, LAB.z, al * .75, al * .9, al * 1.1); } }
  // capa límite (desde el remanso hasta la separación, por los dos lados)
  if (o.bl > 0) for (let k = 0; k < 1600; k++) { const s = PS.seed[(4000 + k) * 4], s2 = PS.seed[(4000 + k) * 4 + 1]; const side = k % 2 ? 1 : -1; const u = fract(s + t * .5); const a = u * ph;
    const r = 1.035 + (o.turb || 0) * (.03 + .05 * Math.abs(Math.sin(k * 12.9 + t * 9))) * smooth(.15, .5, u) + s2 * .012; const xf = -Math.cos(a) * r, y = side * Math.sin(a) * r; const al = o.bl * .9;
    PS.push(LAB.x - xf, LAB.y + y + (o.turb ? Math.sin(k * 7.1 + t * 13) * .012 : 0), LAB.z + .2, al * 1.4, al * 1.1, al * .6); }
  // estela: remolinos
  if (o.wake > 0) for (let k = 0; k < 3500; k++) { const q = (8000 + k) * 4; const s = PS.seed; const ux = s[q], uy = s[q + 1] * 2 - 1; const xf = xs + .1 + ux * L; const hw = Math.max(floor, ys + (xf - xs) * spread) * .95;
    const fp = (t * 1.2) % 1; const jv = Math.floor((xf - xs) / .9 - fp); const cx = xs + (jv + fp + .5) * .9; const sg = (jv + Math.floor(t * 1.2)) % 2 ? 1 : -1; const ang = t * 4 * sg + s[q + 2] * 6.28; const rr = s[q + 3] * hw * .7;
    let x = lerp(xf, cx + Math.cos(ang) * rr, .5), y = lerp(uy * hw, sg * hw * .35 + Math.sin(ang) * rr, .5); y += defl(x); const al = o.wake * 2.2 * (1 - ux * .7);
    PS.push(LAB.x - x, LAB.y + y, LAB.z + .15, al * 1.6, al * .7, al * .35); }
}

// ==========================================================================
// HUD
// ==========================================================================
function stamp(s, x, y, a, rot = -.08, col = '#ff6a4a', size = 76) { if (a <= .01) return; const sc = lerp(1.6, 1, easeOut(clamp(a * 1.4)));
  g2.save(); g2.translate(x, y); g2.rotate(rot); g2.scale(sc, sc); g2.globalAlpha = clamp(a); g2.strokeStyle = col; g2.lineWidth = 8; g2.shadowColor = col; g2.shadowBlur = 25;
  g2.font = `800 ${size}px Montserrat`; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.letterSpacing = '6px'; const w = g2.measureText(s).width + 70; g2.strokeRect(-w / 2, -size * .8, w, size * 1.6); g2.fillStyle = col; g2.fillText(s, 0, 4); g2.restore(); }
function two(top, l1, l2, a, y = 300) { if (a <= .01) return; txt(l1, W / 2, y, 50, { font: 'Montserrat', weight: 800, alpha: a }); if (l2) txt(l2, W / 2, y + 62, 50, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(160, 920, y + 62, .5) }); if (top) txt(top, W / 2, y - 62, 24, { spacing: 7, alpha: a * .8, fill: '#e3a372' }); }
function topGrad(a = 1) { const gr = g2.createLinearGradient(0, 0, 0, 600); gr.addColorStop(0, `rgba(8,10,16,${.75 * a})`); gr.addColorStop(1, 'rgba(8,10,16,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, W, 600); }
function label(w, s, sub, a, col = '#ffe2c0', size = 40, dy = 0) { if (a <= .01) return; const p = project(w); txt(s, p.x, p.y + dy, size, { font: 'Montserrat', weight: 800, alpha: a, fill: col }); if (sub) txt(sub, p.x, p.y + dy + size * .95, 28, { alpha: a * .85 }); }
const win = (t, a, b, f = .3) => smooth(a, a + f, t) * (1 - smooth(b - f, b, t));
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
function sepDot(deg, a, col) { if (a <= .01) return; for (const s of [-1, 1]) { const ph = deg * Math.PI / 180; const p = project(LAB.clone().add(V3(Math.cos(ph) * 1.06, s * Math.sin(ph) * 1.06, .3))); g2.save(); g2.globalAlpha = a; g2.fillStyle = col; g2.shadowColor = col; g2.shadowBlur = 20; g2.beginPath(); g2.arc(p.x, p.y, 13, 0, 7); g2.fill(); g2.restore(); } }
function arrowW(a3, b3, a, col, lw = 10) { if (a <= .01) return; const p = project(a3), q = project(b3); g2.save(); g2.globalAlpha = a; g2.strokeStyle = col; g2.fillStyle = col; g2.lineWidth = lw; g2.shadowColor = col; g2.shadowBlur = 16; g2.lineCap = 'round';
  g2.beginPath(); g2.moveTo(p.x, p.y); g2.lineTo(q.x, q.y); g2.stroke(); const an = Math.atan2(q.y - p.y, q.x - p.x); g2.beginPath(); g2.moveTo(q.x + Math.cos(an) * 22, q.y + Math.sin(an) * 22); g2.lineTo(q.x + Math.cos(an + 2.4) * 30, q.y + Math.sin(an + 2.4) * 30); g2.lineTo(q.x + Math.cos(an - 2.4) * 30, q.y + Math.sin(an - 2.4) * 30); g2.closePath(); g2.fill(); g2.restore(); }

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
function setCourse(sep = 0) { course.visible = true; sky.visible = true; skyMat.uniforms.uSep.value = sep; scene.fog.density = .0015; hemi.intensity = 1.2; sunL.intensity = 2.8; sunL.position.set(30, 50, 20); sunL.target.position.set(0, 0, 0); }
function setLab() { sky.visible = false; scene.background = new THREE.Color(.02, .03, .05); scene.fog.density = 0; hemi.intensity = .6; sunL.intensity = 2.4; sunL.position.copy(LAB).add(V3(3, 4, 6)); sunL.target.position.copy(LAB); }
function trajScene(t, t0, A, B, la, lb, sep = 0) {
  setCourse(sep); const k = easeOut(smooth(t0 + .2, t0 + 2.6, t)); const pa = showTrail(A, k, -3), pb = showTrail(B, k, 3);
  marker.visible = marker2.visible = true; marker.position.copy(pa); marker2.position.copy(pb); const ms = .5 + .002 * -pa.z; marker.scale.setScalar(ms); marker2.scale.setScalar(.5 + .002 * -pb.z);
  const far = distOf(A.userData.pts); camera.position.set(lerp(40, 70, k), lerp(14, 40, k), lerp(25, 0, k)); camera.lookAt(0, 8, lerp(-60, -far * .55, k)); camera.fov = 50;
  return () => { label(pa.clone().add(V3(0, 6, 0)), la, null, smooth(t0 + 1.4, t0 + 1.8, t), '#ffd08a', 36); label(pb.clone().add(V3(0, 6, 0)), lb, null, smooth(t0 + 1.4, t0 + 1.8, t), '#9fd0ff', 36); };
}
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .02; camera.far = 8000; camera.fov = 42; scene.background = null;
  let bloomS = .45, flash = 0, ca = .0012, fade = 0, expo = 1;
  PS.begin(); PS.mat.size = .06; course.visible = false; for (const b of BALLS) { b.visible = false; b.rotation.set(0, 0, 0); b.scale.setScalar(1); } for (const l of TRAILS) l.visible = false; marker.visible = marker2.visible = false;
  for (const c of ['half', 'layer', 'wake', 'dimples', 'small', 'spin', 'glide', 'count', 'accident', 'farther', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];

  if (t < TL.half) {
    // A · la pelota en el tee
    setCourse(); ball.visible = true; ball.scale.setScalar(.0214); ball.position.set(0, .0714, 0); ball.rotation.y = t * .3; const k = smooth(0, TL.half, t);
    camera.position.set(lerp(.16, .1, k), lerp(.1, .085, k), lerp(.22, .15, k)); camera.lookAt(0, .07, 0); camera.fov = 40; camera.near = .005;
    hud.push(() => { topGrad(); two(null, '¿POR QUÉ LA PELOTA DE GOLF', 'TIENE AGUJEROS?', 1, 300); });
  } else if (t < TL.layer) {
    // B · lisa: la mitad de distancia
    const f = trajScene(t, TL.half, trD, trS, 'CON HOYUELOS', 'LISA');
    hud.push(() => { topGrad(); two(null, 'UNA PELOTA LISA VOLARÍA', 'MÁS O MENOS LA MITAD', 1, 300); f(); stamp('×2', W / 2, 1600, smooth(TL.half + 2.2, TL.half + 2.5, t), -.06, '#ffd070', 90); });
  } else if (t < TL.dimples) {
    // C–E · pelota lisa en el túnel: capa límite, separación temprana, gran estela
    setLab(); smoothBall.visible = true; smoothBall.position.copy(LAB);
    const lt = t - TL.layer; camera.position.copy(LAB).add(V3(-1.3, .2, lerp(9.5, 10.5, clamp(lt / 6)))); camera.lookAt(LAB.clone().add(V3(-1.3, 0, 0))); camera.fov = 50;
    wind(t, { sep: 82, spread: .16, floor: .5, a: 1, bl: smooth(TL.layer + .3, TL.layer + 1, t), turb: 0, wake: smooth(TL.early + .6, TL.wake + .4, t), L: 5.5 });
    PS.mat.size = .16;
    hud.push(() => { two(null, 'EL AIRE SE PEGA A LA PELOTA', 'EN UNA CAPA MUY FINA', win(t, TL.layer, TL.early), 300); two('PELOTA LISA', 'SE DESPEGA', 'MUY PRONTO', win(t, TL.early, TL.wake), 300); two('PELOTA LISA', 'UN REMOLINO ENORME', 'QUE LA FRENA', smooth(TL.wake, TL.wake + .3, t), 300);
      sepDot(180 - 82, smooth(TL.early + .4, TL.early + .8, t), '#ff6a4a'); txt('AIRE', 1000, 1450, 30, { font: 'Montserrat', weight: 800, alpha: .8, fill: '#9fd0ff', align: 'right' }); arrowXY(990, 1500, 820, 1500, .8, '#9fd0ff');
      bar(140, 1660, 800, 1, 'RESISTENCIA', '100 %', smooth(TL.wake + .5, TL.wake + .9, t), '#ff6a4a'); });
  } else if (t < TL.spin) {
    // F–I · con hoyuelos: capa turbulenta, separación tardía, estela pequeña, resistencia a la mitad
    setLab(); const k = smooth(TL.stick, TL.stick + 1.6, t); ball.visible = true; ball.position.copy(LAB); ball.rotation.z = t * .2;
    const lt = t - TL.dimples; const zoom = 1 - smooth(TL.dimples + .2, TL.dimples + 1.4, t) + smooth(TL.dimples + 2, TL.dimples + 2.8, t);
    camera.position.copy(LAB).add(V3(lerp(-.5, -1.3, zoom), .2, lerp(3.2, 10, zoom))); camera.lookAt(LAB.clone().add(V3(lerp(-.5, -1.3, zoom), lerp(.4, 0, zoom), 0))); camera.fov = 50;
    wind(t, { sep: lerp(82, 118, k), spread: lerp(.16, -.06, k), floor: .5, a: 1, bl: 1, turb: smooth(TL.dimples + .6, TL.dimples + 1.4, t), wake: 1 - smooth(TL.small - .2, TL.small + 1.2, t) * .45, L: lerp(5.5, 3.5, k) });
    PS.mat.size = lerp(.06, .16, zoom);
    hud.push(() => { two(null, 'LOS HOYUELOS LA VUELVEN', 'TURBULENTA', win(t, TL.dimples, TL.stick), 300); two(null, 'EL AIRE SE QUEDA PEGADO', 'MÁS TIEMPO', win(t, TL.stick, TL.small), 300); two(null, 'LA ESTELA SE HACE', 'MUCHO MÁS PEQUEÑA', win(t, TL.small, TL.drag), 300);
      two(null, 'Y LA RESISTENCIA', 'CAE CASI A LA MITAD', smooth(TL.drag, TL.drag + .3, t), 300); sepDot(180 - lerp(82, 118, k), smooth(TL.stick + .2, TL.stick + .6, t), '#7fe07f');
      const dk = smooth(TL.drag + .2, TL.drag + 1.4, t); bar(140, 1660, 800, lerp(1, .5, dk), 'RESISTENCIA', Math.round(lerp(100, 50, dk)) + ' %', smooth(TL.small + .5, TL.small + .9, t), dk > .5 ? '#7fe07f' : '#ff6a4a'); });
  } else if (t < TL.count) {
    if (t < TL.glide) {
      // J–K · backspin: desvía el aire abajo, sustentación arriba
      setLab(); ball.visible = true; ball.position.copy(LAB); ball.rotation.z = t * 3.2; const sp = smooth(TL.spin + .4, TL.spin + 1.4, t);
      camera.position.copy(LAB).add(V3(-1.1, .3, 10)); camera.lookAt(LAB.clone().add(V3(-1.1, -.2, 0))); camera.fov = 50;
      wind(t, { sep: 118, spread: -.06, floor: .5, a: 1, bl: .8, turb: 1, wake: .55, L: 3.5, spin: sp * smooth(TL.down, TL.down + .8, t) });
      PS.mat.size = .16;
      hud.push(() => { two(null, 'EL PALO LE DA', 'UN GIRO HACIA ATRÁS', win(t, TL.spin, TL.down), 300); two(null, 'DESVÍA EL AIRE HACIA ABAJO…', 'Y EL AIRE LA EMPUJA ARRIBA', smooth(TL.down, TL.down + .3, t), 300);
        const p = project(LAB); const a = sp * .9; if (a > 0) { g2.save(); g2.globalAlpha = a; g2.strokeStyle = '#ffd070'; g2.lineWidth = 8; g2.shadowColor = '#ffd070'; g2.shadowBlur = 18; const R = project(LAB.clone().add(V3(1.35, 0, 0))).x - p.x; g2.beginPath(); g2.arc(p.x, p.y, R, -2.6, -.5); g2.stroke();
          const e = -2.6; g2.beginPath(); g2.moveTo(p.x + Math.cos(e) * R - 16, p.y + Math.sin(e) * R + 22); g2.lineTo(p.x + Math.cos(e) * R - 20, p.y + Math.sin(e) * R - 18); g2.lineTo(p.x + Math.cos(e) * R + 18, p.y + Math.sin(e) * R + 2); g2.closePath(); g2.fillStyle = '#ffd070'; g2.fill(); g2.restore(); }
        arrowW(LAB.clone().add(V3(-1.8, -.9, 0)), LAB.clone().add(V3(-2.8, -2.1, 0)), smooth(TL.down + .6, TL.down + 1, t), '#9fd0ff'); txt('AIRE', project(LAB.clone().add(V3(-2.9, -2.4, 0))).x, project(LAB.clone().add(V3(-2.9, -2.4, 0))).y + 30, 30, { font: 'Montserrat', weight: 800, alpha: smooth(TL.down + .6, TL.down + 1, t), fill: '#9fd0ff' });
        arrowW(LAB.clone().add(V3(0, 1.3, 0)), LAB.clone().add(V3(0, 2.3, 0)), smooth(TL.down + 1.6, TL.down + 2, t), '#ffb070', 14); txt('SUSTENTACIÓN', project(LAB.clone().add(V3(0, 2.0, 0))).x + 40, project(LAB.clone().add(V3(0, 2.0, 0))).y, 34, { align: 'left', font: 'Montserrat', weight: 800, alpha: smooth(TL.down + 1.6, TL.down + 2, t), fill: '#ffb070' }); });
    } else {
      // L · sube y planea
      const f = trajScene(t, TL.glide - .6, trD, trS, 'CON GIRO', 'SIN GIRO');
      hud.push(() => { topGrad(); two(null, 'POR ESO SUBE', 'Y PLANEA', 1, 300); f(); });
    }
  } else if (t < TL.accident) {
    // M · 300–500 hoyuelos
    setLab(); scene.background = new THREE.Color(.03, .05, .04); ball.visible = true; ball.position.copy(LAB); ball.rotation.set(.3, t * .5, 0); const lt = t - TL.count;
    camera.position.copy(LAB).add(V3(0, 0, lerp(6.4, 5.6, clamp(lt / 3)))); camera.lookAt(LAB.clone().add(V3(0, .4, 0))); camera.fov = 50;
    hud.push(() => { topGrad(); two(null, 'SUELE TENER ENTRE', '300 Y 500 HOYUELOS', 1, 300); const n = Math.round(lerp(0, 392, easeOut(smooth(TL.count + .3, TL.count + 2.2, t))));
      txt(String(n), W / 2, 1560, 120, { font: 'Montserrat', weight: 800, alpha: smooth(TL.count + .2, TL.count + .5, t), fill: copperGrad(380, 700, 1560, .5) }); txt('en esta pelota', W / 2, 1650, 30, { weight: 300, alpha: smooth(TL.count + 2.2, TL.count + 2.5, t) }); });
  } else if (t < TL.brand) {
    if (t < TL.farther) {
      // N–O · siglo XIX: gutta-percha nueva (lisa) y vieja (con golpes)
      setLab(); scene.background = new THREE.Color(.07, .055, .04); hemi.intensity = 1.6; sunL.intensity = 3.4; const lt = t - TL.accident; const both = smooth(TL.old - .2, TL.old + .8, t);
      battered.visible = true; battered.position.copy(LAB).add(V3(lerp(0, 1.25, both), 0, 0)); battered.rotation.set(.4, t * .5, .2);
      oldBall.visible = both > .01; oldBall.position.copy(LAB).add(V3(-1.25, 0, 0)); oldBall.scale.setScalar(Math.max(.01, both));
      camera.position.copy(LAB).add(V3(0, .3, lerp(5.5, 10.5, both))); camera.lookAt(LAB.clone().add(V3(0, .3, 0))); camera.fov = 50;
      hud.push(() => { two('SIGLO XIX', 'SE DESCUBRIÓ', 'POR ACCIDENTE', win(t, TL.accident, TL.old), 300); two('SIGLO XIX', 'LAS PELOTAS VIEJAS,', 'LLENAS DE GOLPES…', smooth(TL.old, TL.old + .3, t), 300);
        label(LAB.clone().add(V3(-1.25, -1.5, 0)), 'NUEVA', null, smooth(TL.old + .6, TL.old + 1, t), '#9fd0ff', 40); label(LAB.clone().add(V3(1.25, -1.5, 0)), 'VIEJA', null, smooth(TL.old + 1.6, TL.old + 2, t), '#ffd08a', 40); });
    } else {
      // P · volaban más lejos
      const f = trajScene(t, TL.farther - .3, trOB, trO, 'VIEJA', 'NUEVA', .85); expo = .95;
      hud.push(() => { topGrad(); two('SIGLO XIX', 'VOLABAN MÁS LEJOS', 'QUE LAS NUEVAS', 1, 300); f(); });
    }
  } else {
    // Q · marca
    setCourse(); ball.visible = true; ball.scale.setScalar(.0214); ball.position.set(0, .0714, 0); ball.rotation.y = t * .3; const lt = t - TL.brand;
    camera.position.set(.12, .09 + lt * .01, .2 + lt * .03); camera.lookAt(0, .08, 0); camera.near = .005; camera.fov = 42; fade = Math.min(.5, lt * .45);
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  sky.position.copy(camera.position); PS.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, bloom: bloomS, expo });
}
function renderCover() { renderFrame(TL.half - .3); coverText('¿POR QUÉ TIENE', 'AGUJEROS?', 'la pelota de golf'); }
window.renderCover = () => { renderCover(); return true; };
window.OBJ = { PS, scene };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
