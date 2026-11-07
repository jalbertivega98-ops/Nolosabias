// NO LO SABÍAS — "¿Cómo flota un barco de acero?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final.
// Referencia: petrolero de gran tamaño (VLCC, ~330 m de eslora, ~58 m de manga; más de 200.000 t cargado).
// Física: principio de Arquímedes; estabilidad por la posición relativa de G (gravedad) y B (carena), calculadas
// numéricamente sobre la sección del casco; mamparos estancos; Titanic (4 compartimentos inundados = flota; el iceberg abrió al menos 5);
// francobordo / marcas de carga (agua salada 1,025 t/m³ frente a dulce 1,000 t/m³).
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, shake, V3,
  renderer, g2, camera, SOFT, sea, U, SUN_DIR, skyDome, abyss, ocean, oceanMat, Particles,
  txt, copperGrad, project, fmt, callout, arrow2D, titleHUD, fract, emitRise, camOrbit, arrowXY, bigStat, drawBrand, coverText, finish } from '../../lib/core.js';

abyss.visible = false; skyDome.renderOrder = -1;
oceanMat.fragmentShader = oceanMat.fragmentShader.replace('dist*.00045', 'dist*.0003'); oceanMat.needsUpdate = true;
const xrayMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  uniforms: { uA: { value: 1 }, uCol: { value: new THREE.Color(.3, .7, 1.15) } },
  vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform float uA; uniform vec3 uCol; varying vec3 vN; varying vec3 vV; void main(){ float f=pow(clamp(1.-abs(dot(vN,vV)),0.,1.),2.); gl_FragColor=vec4(uCol*(f*.8+.05),uA*(f*.7+.05)); }` });

// ==========================================================================
// CASCO (generador): eslora L, manga B, puntal D (metros). x = proa, y = arriba, z = babor
// ==========================================================================
function hullFns(L, B, D) {
  const hb = u => B / 2 * (u > .78 ? Math.sqrt(Math.max(0, 1 - Math.pow((u - .78) / .22, 2))) * .98 + .02 : u < .1 ? .62 + .38 * Math.sqrt(u / .1) : 1);
  const keel = u => u > .9 ? Math.pow((u - .9) / .1, 1.5) * D * .55 : u < .05 ? (1 - u / .05) * D * .3 : 0;
  return { hb, keel };
}
function hullGeo(L, B, D) {
  const { hb, keel } = hullFns(L, B, D); const N = 90, M = 28; const pos = [], idx = [];
  for (let i = 0; i <= N; i++) { const u = i / N, x = (u - .5) * L, w = Math.max(.05, hb(u)), k = keel(u);
    for (let j = 0; j <= M; j++) { const ph = j / M * Math.PI; const c = Math.cos(ph), s = Math.sin(ph); const z = w * Math.sign(c) * Math.pow(Math.abs(c), .18); const y = k + (D - k) * (1 - Math.pow(Math.abs(s), 9)); pos.push(x, y, z); } }
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { const a = i * (M + 1) + j, b = a + M + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  // UV: v = altura (para el antiincrustante rojo bajo la flotación)
  const uv = []; for (let i = 0; i < pos.length; i += 3) uv.push(pos[i] / L + .5, pos[i + 1] / D); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}
function deckGeo(L, B, D) { const { hb } = hullFns(L, B, D); const sh = new THREE.Shape(); const N = 60; for (let i = 0; i <= N; i++) { const u = i / N; sh[i ? 'lineTo' : 'moveTo']((u - .5) * L, hb(u)); } for (let i = N; i >= 0; i--) { const u = i / N; sh.lineTo((u - .5) * L, -hb(u)); }
  const g = new THREE.ShapeGeometry(sh); g.rotateX(Math.PI / 2); g.translate(0, D, 0); return g; }
function paintTex(wl, top = '#1b1f24', bot = '#7a1f17', band = '#d9d9d2') { const c = document.createElement('canvas'); c.width = 16; c.height = 512; const x = c.getContext('2d'); const yw = 512 * (1 - wl);
  x.fillStyle = top; x.fillRect(0, 0, 16, yw); x.fillStyle = bot; x.fillRect(0, yw, 16, 512 - yw); x.fillStyle = band; x.fillRect(0, yw - 3, 16, 3); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
function buildShip(o) {
  const g = new THREE.Group(); const hullMat = new THREE.MeshStandardMaterial({ map: paintTex(o.wl, o.top, o.bot), roughness: .55, metalness: .3, side: THREE.DoubleSide });
  const hull = new THREE.Mesh(hullGeo(o.L, o.B, o.D), hullMat); g.add(hull);
  const deck = new THREE.Mesh(deckGeo(o.L, o.B, o.D), new THREE.MeshStandardMaterial({ color: o.deck, roughness: .8, side: THREE.DoubleSide })); g.add(deck);
  const shells = [hull, deck]; g.userData = { hull, deck, shells, o };
  return g;
}
// --- Petrolero (VLCC) ---
const SH = { L: 330, B: 58, D: 30, wl: .62, top: '#1c2a3a', bot: '#8a2418', deck: 0x6a3a2a };
const ship = buildShip(SH); sea.add(ship);
const superS = new THREE.Group(); ship.add(superS);
{ const wm = new THREE.MeshStandardMaterial({ color: 0xe8e8e2, roughness: .6 }); const winTex = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#e8e8e2'; x.fillRect(0, 0, 128, 64); x.fillStyle = '#1a2230'; for (let r = 0; r < 4; r++) for (let i = 0; i < 12; i++) x.fillRect(4 + i * 10.5, 6 + r * 15, 7, 6); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const em = new THREE.MeshStandardMaterial({ map: winTex, roughness: .6, emissive: new THREE.Color(1, .85, .6), emissiveMap: winTex, emissiveIntensity: .25 });
  const b = new THREE.Mesh(new THREE.BoxGeometry(28, 26, 46), [em, em, wm, wm, em, em]); b.position.set(-140, 30 + 13, 0); superS.add(b);
  const br = new THREE.Mesh(new THREE.BoxGeometry(12, 4, 58), em); br.position.set(-136, 30 + 26 + 2, 0); superS.add(br);
  const fn = new THREE.Mesh(new THREE.BoxGeometry(10, 16, 9), new THREE.MeshStandardMaterial({ color: 0x15181c })); fn.position.set(-152, 30 + 34, 0); superS.add(fn);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, .45, 8, 40, 5.3), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.3, .66, .36) })); ring.position.set(-152, 30 + 36, 4.6); ring.rotation.z = .5; superS.add(ring);
  // tuberías de cubierta
  const pm = new THREE.MeshStandardMaterial({ color: 0x9a9f86, roughness: .5, metalness: .4 });
  for (const z of [-6, -3, 0, 3, 6]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, 250, 8), pm); p.rotation.z = Math.PI / 2; p.position.set(10, 31, z); superS.add(p); }
  const mf = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 50), pm); mf.position.set(0, 31.5, 0); superS.add(mf);
}
// Interior en rayos X: tanques de carga y lastre
const inner = new THREE.Group(); ship.add(inner); inner.visible = false;
const oilMat = new THREE.MeshStandardMaterial({ color: 0x8a5a1a, emissive: new THREE.Color(1.4, .7, .2), emissiveIntensity: .5, transparent: true, opacity: .8 });
const oil = []; for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(36, 1, 50), oilMat); m.geometry.translate(0, .5, 0); m.position.set(-100 + 18 + i * 38 + 10, 3, 0); inner.add(m); oil.push(m); }
const bhMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(.35, .75, 1.2), transparent: true, opacity: .25, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
for (let i = 0; i <= 6; i++) { const b = new THREE.Mesh(new THREE.PlaneGeometry(52, 28), bhMat); b.rotation.y = Math.PI / 2; b.position.set(-100 + 10 + i * 38, 15, 0); inner.add(b); }
function shipXray(k) { for (const m of ship.userData.shells) { if (!m.userData.m0) m.userData.m0 = m.material; m.material = k ? xrayMat : m.userData.m0; } inner.visible = !!k; superS.visible = !k; }
// --- Transatlántico de 4 chimeneas (para la escena del Titanic) ---
const TI = { L: 269, B: 28, D: 20, wl: .55, top: '#101214', bot: '#7a1f17', deck: 0xb89a70 };
const liner = buildShip(TI); sea.add(liner); liner.visible = false;
{ const bm = new THREE.MeshStandardMaterial({ color: 0xc89a4a, roughness: .6 }), wm = new THREE.MeshStandardMaterial({ color: 0xe6e2d8, roughness: .6 });
  const sup = new THREE.Mesh(new THREE.BoxGeometry(170, 9, 22), wm); sup.position.set(-5, 20 + 4.5, 0); liner.add(sup);
  for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, 18, 24), bm); f.position.set(55 - i * 34, 29 + 9, 0); f.rotation.z = .08; liner.add(f); const tp = new THREE.Mesh(new THREE.CylinderGeometry(2.62, 2.62, 3, 24), new THREE.MeshStandardMaterial({ color: 0x111111 })); tp.position.set(55 - i * 34 + .7, 29 + 16.5, 0); liner.add(tp); } }
const comp = []; const water16 = new THREE.MeshStandardMaterial({ color: 0x2a7acc, emissive: new THREE.Color(.2, .6, 1.4), emissiveIntensity: .6, transparent: true, opacity: .75 });
for (let i = 0; i < 16; i++) { const w = TI.L * .86 / 16; const x = TI.L * .43 - (i + .5) * w; const m = new THREE.Mesh(new THREE.BoxGeometry(w * .96, 1, TI.B * .8), water16); m.geometry.translate(0, .5, 0); m.position.set(x, 1.5, 0); m.visible = false; liner.add(m); comp.push(m);
  const b = new THREE.Mesh(new THREE.PlaneGeometry(TI.B * .9, TI.D * .62), bhMat); b.rotation.y = Math.PI / 2; b.position.set(x + w / 2, TI.D * .31, 0); b.visible = false; liner.add(b); comp[i].userData.bh = b; }
function linerXray(k) { for (const m of liner.userData.shells) { if (!m.userData.m0) m.userData.m0 = m.material; m.material = k ? xrayMat : m.userData.m0; } liner.children.forEach(c => { if (!liner.userData.shells.includes(c) && !comp.includes(c) && c.material !== bhMat) if (!liner.userData.masks.includes(c)) c.visible = !k; }); }
// Mar "plano" para los cortes en rayos X: volumen de agua translúcido + rejilla; las máscaras de profundidad del casco
// hacen que el agua tiña solo lo que queda bajo la flotación.
const bpSea = new THREE.Group(); bpSea.visible = false;
{ const wm = new THREE.Mesh(new THREE.BoxGeometry(5000, 300, 5000), new THREE.MeshBasicMaterial({ color: new THREE.Color(.03, .16, .34), transparent: true, opacity: .62, depthWrite: false })); wm.position.y = -150.05; wm.renderOrder = 3; bpSea.add(wm);
  const gr = new THREE.GridHelper(5000, 125, 0x2a6aa8, 0x2a6aa8); gr.material.transparent = true; gr.material.opacity = .22; gr.material.depthWrite = false; gr.renderOrder = 3; bpSea.add(gr); }
function addMask(g) { const ms = []; for (const m of g.userData.shells) { const k = new THREE.Mesh(m.geometry, new THREE.MeshBasicMaterial({ colorWrite: false, transparent: true, depthWrite: true })); k.renderOrder = 2; k.visible = false; g.add(k); ms.push(k); } g.userData.masks = ms; }
addMask(ship); addMask(liner); ship.userData.hull.renderOrder = ship.userData.deck.renderOrder = 1; liner.userData.hull.renderOrder = liner.userData.deck.renderOrder = 1;
function toLab(g, on) { (on ? lab : sea).add(g); bpSea.visible = bpSea.visible || on; for (const k of g.userData.masks) k.visible = on; }
const spray = new Particles(4000, { size: .9, seed: 5, fog: false }); sea.add(spray.obj);
const hemi = new THREE.HemisphereLight(0x9fb8d8, 0x1a1410, 1.0); sea.add(hemi);
const sunL = new THREE.DirectionalLight(0xffb070, 2.2); sea.add(sunL); sea.add(sunL.target);
const keyL = new THREE.DirectionalLight(0xdfe8ff, 1.2); sea.add(keyL); sea.add(keyL.target);

// ==========================================================================
// LABORATORIO: tanque de agua (bola, cuenco, sección del casco, marcas)
// ==========================================================================
const lab = new THREE.Scene(); lab.fog = new THREE.FogExp2(new THREE.Color(.01, .02, .04), .015);
const labBg = (() => { const bg = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec3 vD; void main(){ float y=vD.y*.5+.5; vec3 c=mix(vec3(.004,.012,.03),vec3(.03,.07,.12),y); gl_FragColor=vec4(c,1.); }` })); bg.renderOrder = -1; lab.add(bg); return bg; })();
{ const pm = new THREE.PMREMGenerator(renderer); lab.environment = pm.fromScene(new (class extends THREE.Scene { constructor() { super(); const m = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), new THREE.MeshBasicMaterial({ color: 0x223344, side: THREE.BackSide })); this.add(m); const l = new THREE.Mesh(new THREE.PlaneGeometry(4, 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 6, 6) })); l.position.set(0, 4.9, 0); l.rotation.x = Math.PI / 2; this.add(l); } })(), .03).texture; lab.environmentIntensity = .8; }
lab.add(new THREE.HemisphereLight(0x9fc8ff, 0x0a0806, .6));
const labKey = new THREE.DirectionalLight(0xffffff, 2); labKey.position.set(-5, 8, 10); lab.add(labKey);
const labRim = new THREE.DirectionalLight(0xffa060, .45); labRim.position.set(6, -2, -8); lab.add(labRim);
const TK = { w: 14, h: 9, d: 5, wl: 6 };
const tank = new THREE.Group(); lab.add(tank);
{ const gl = new THREE.Mesh(new THREE.BoxGeometry(TK.w, TK.h, TK.d), xrayMat); gl.position.y = TK.h / 2; tank.add(gl);
  const ed = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(TK.w, TK.h, TK.d)), new THREE.LineBasicMaterial({ color: new THREE.Color(.4, .8, 1.3), transparent: true, opacity: .6 })); ed.position.y = TK.h / 2; tank.add(ed); }
const waterMat = new THREE.MeshStandardMaterial({ color: 0x1d6fb8, roughness: .1, metalness: 0, transparent: true, opacity: .42, depthWrite: false, emissive: new THREE.Color(.05, .2, .45), emissiveIntensity: .6, side: THREE.DoubleSide });
const water = new THREE.Mesh(new THREE.BoxGeometry(TK.w - .1, 1, TK.d - .1), waterMat); water.geometry.translate(0, .5, 0); tank.add(water);
const wlMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(.5, 1.0, 1.8), transparent: true, opacity: .9 });
const wlLine = new THREE.Group(); tank.add(wlLine); for (const z of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(TK.w - .1, .035, .035), wlMat); b.position.set(0, 0, z * (TK.d / 2 - .05)); wlLine.add(b); } for (const x of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(.035, .035, TK.d - .1), wlMat); b.position.set(x * (TK.w / 2 - .05), 0, 0); wlLine.add(b); }
const wsurf = new THREE.Mesh(new THREE.PlaneGeometry(TK.w - .1, TK.d - .1), new THREE.MeshBasicMaterial({ color: new THREE.Color(.15, .45, .9), transparent: true, opacity: .35, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })); wsurf.rotation.x = -Math.PI / 2; wlLine.add(wsurf); wlLine.position.y = TK.wl;
const steel = new THREE.MeshStandardMaterial({ color: 0x9aa2aa, roughness: .3, metalness: .9, envMapIntensity: 2.5 });
const ballM = new THREE.Mesh(new THREE.SphereGeometry(.7, 48, 32), steel); lab.add(ballM);
const bowl = new THREE.Mesh(new THREE.SphereGeometry(2.3, 64, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x9aa2aa, roughness: .35, metalness: .85, envMapIntensity: 2.5, side: THREE.DoubleSide })); lab.add(bowl);
const BOWL_H = 1.4; // calado del cuenco (casquete de 11,3 m³ = volumen de acero × densidad relativa 7,85)
const cap = new THREE.Mesh(new THREE.SphereGeometry(2.33, 64, 24, 0, Math.PI * 2, Math.PI - Math.acos((2.3 - BOWL_H) / 2.3), Math.acos((2.3 - BOWL_H) / 2.3)), new THREE.MeshBasicMaterial({ color: new THREE.Color(.3, .8, 1.6), transparent: true, opacity: .45, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })); lab.add(cap);
const bubbles = new Particles(3000, { size: .08, seed: 9, fog: false }); lab.add(bubbles.obj); lab.add(bpSea); lab.add(spray.obj);
// --- Sección del casco (estabilidad) ---
const SEC = { B: 6, D: 3.6, ch: .9 };
const secPoly = [[-SEC.B / 2 + SEC.ch, 0], [SEC.B / 2 - SEC.ch, 0], [SEC.B / 2, SEC.ch], [SEC.B / 2, SEC.D], [-SEC.B / 2, SEC.D], [-SEC.B / 2, SEC.ch]];
const section = new THREE.Group(); lab.add(section);
{ const sh = new THREE.Shape(secPoly.map(([x, y]) => new THREE.Vector2(x, y))); const inn = new THREE.Path([[-SEC.B / 2 + SEC.ch + .2, .2], [SEC.B / 2 - SEC.ch - .2, .2], [SEC.B / 2 - .2, SEC.ch + .1], [SEC.B / 2 - .2, SEC.D - .2], [-SEC.B / 2 + .2, SEC.D - .2], [-SEC.B / 2 + .2, SEC.ch + .1]].map(([x, y]) => new THREE.Vector2(x, y))); sh.holes.push(inn);
  const g = new THREE.ExtrudeGeometry(sh, { depth: 3.6, bevelEnabled: false }); g.translate(0, 0, -1.8); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: paintTex(.45, '#2a3442', '#8a2418'), roughness: .5, metalness: .4 }));
  // UV de la extrusión: usar altura
  const uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, .5, p.getY(i) / SEC.D); section.add(m);
  const deckS = new THREE.Mesh(new THREE.BoxGeometry(SEC.B, .2, 3.6), new THREE.MeshStandardMaterial({ color: 0x6a3a2a, roughness: .8 })); deckS.position.y = SEC.D; section.add(deckS); }
const cargo = new THREE.Group(); section.add(cargo);
{ const cols = [0xb8452a, 0x2f6fa8, 0xd8a23a, 0x3a8a5a, 0x9a9a9a]; for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.15, 3.2), new THREE.MeshStandardMaterial({ color: cols[(i + j * 2) % 5], roughness: .7 })); b.position.set(-1.9 + i * 1.9, SEC.D + .1 + .6 + j * 1.2, 0); cargo.add(b); } }
const ballastW = new THREE.Mesh(new THREE.BoxGeometry(SEC.B - 2.2, .1, 3.2), new THREE.MeshStandardMaterial({ color: 0x2a7acc, emissive: new THREE.Color(.2, .6, 1.4), emissiveIntensity: .8, transparent: true, opacity: .85 })); ballastW.geometry.translate(0, .05, 0); ballastW.position.y = .22; section.add(ballastW);
// área sumergida y centroide (B) para un balance θ y una flotación y=wl (coordenadas del tanque)
function clipBelow(poly, wl) { const out = []; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; const ia = a[1] <= wl, ib = b[1] <= wl; if (ia) out.push(a); if (ia !== ib) { const t = (wl - a[1]) / (b[1] - a[1]); out.push([a[0] + (b[0] - a[0]) * t, wl]); } } return out; }
function areaC(p) { let A = 0, cx = 0, cy = 0; for (let i = 0; i < p.length; i++) { const [x0, y0] = p[i], [x1, y1] = p[(i + 1) % p.length]; const c = x0 * y1 - x1 * y0; A += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c; } A /= 2; return A ? { A: Math.abs(A), x: cx / (6 * A), y: cy / (6 * A) } : { A: 0, x: 0, y: 0 }; }
function worldPoly(th, oy) { const c = Math.cos(th), s = Math.sin(th); return secPoly.map(([x, y]) => [x * c - y * s, x * s + y * c + oy]); }
const A0 = areaC(clipBelow(secPoly, 1.5)).A;   // calado de equilibrio en reposo: 1,5
function equil(th) { let lo = -6, hi = 6; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; const a = areaC(clipBelow(worldPoly(th, m), 0)).A; if (a > A0) lo = m; else hi = m; } return (lo + hi) / 2; }
// coloca la sección (flotación del tanque en TK.wl); G en coordenadas del cuerpo (gx, gy); devuelve puntos de mundo de G y B
function placeSection(th, gx, gy) { const oy = equil(th); section.position.set(0, TK.wl + oy, 0); section.rotation.set(0, 0, th);
  const sub = areaC(clipBelow(worldPoly(th, oy), 0)); const c = Math.cos(th), s = Math.sin(th);
  return { G: V3(gx * c - gy * s, gx * s + gy * c + oy + TK.wl, 2), B: V3(sub.x, sub.y + TK.wl, 2), oy }; }
// --- Pared del casco con marcas de francobordo (Plimsoll) ---
const plate = new THREE.Group(); lab.add(plate); plate.visible = false;
const markTex = (() => { const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
  x.fillStyle = '#1c2a3a'; x.fillRect(0, 0, 1024, 560); x.fillStyle = '#8a2418'; x.fillRect(0, 560, 1024, 464);
  x.strokeStyle = '#f0f0ea'; x.fillStyle = '#f0f0ea'; x.lineWidth = 13; x.beginPath(); x.arc(300, 420, 90, 0, 7); x.stroke(); x.fillRect(180, 413, 240, 14); x.font = '800 56px Montserrat'; x.textAlign = 'center'; x.fillText('L', 250, 398); x.fillText('R', 350, 398);
  x.fillRect(620, 260, 14, 360); const L = [['TF', 300], ['F', 340], ['T', 390], ['S', 420], ['W', 450], ['WNA', 480]];
  x.font = '800 27px Montserrat'; x.textAlign = 'left'; L.forEach(([s, y]) => { const left = s === 'TF' || s === 'F'; x.fillRect(left ? 530 : 634, y - 6, 90, 12); x.fillText(s, left ? 470 : 740, y + 10); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const plateM = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshStandardMaterial({ map: markTex, roughness: .6, metalness: .2 })); plateM.position.set(0, 6, -.05); plate.add(plateM);
{ const yr = 6 + (512 - 560) / 1024 * 12; const top = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), new THREE.MeshStandardMaterial({ color: 0x1c2a3a, roughness: .6, metalness: .2 })); top.position.set(0, yr + 20, -.1); plate.add(top);
  const bot = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), new THREE.MeshStandardMaterial({ color: 0x8a2418, roughness: .6, metalness: .2 })); bot.position.set(0, yr - 20, -.1); plate.add(bot); }
const pw = new THREE.Mesh(new THREE.BoxGeometry(90, 30, 10), new THREE.MeshStandardMaterial({ color: 0x1d6fb8, transparent: true, opacity: .62, roughness: .1, depthWrite: false, emissive: new THREE.Color(.05, .2, .45), emissiveIntensity: .7 })); pw.geometry.translate(0, -15, 5); plate.add(pw);
// las marcas: S a y=6+(512-420)/1024*12, F a (512-340)/1024*12 → separación ≈ 0,94 unidades
const MARK_S = 6 + (512 - 420) / 1024 * 12, MARK_F = 6 + (512 - 340) / 1024 * 12;

// ==========================================================================
// HUD
// ==========================================================================
function stamp(s, x, y, a, rot = -.1, col = '#ff6a4a') { if (a <= .01) return; const sc = lerp(1.6, 1, easeOut(clamp(a * 1.4)));
  g2.save(); g2.translate(x, y); g2.rotate(rot); g2.scale(sc, sc); g2.globalAlpha = clamp(a); g2.strokeStyle = col; g2.lineWidth = 8; g2.shadowColor = col; g2.shadowBlur = 25;
  g2.font = '800 100px Montserrat'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.letterSpacing = '8px'; const w = g2.measureText(s).width + 70; g2.strokeRect(-w / 2, -75, w, 150); g2.fillStyle = col; g2.fillText(s, 0, 4); g2.restore(); }
function dotLabel(p, col, label, a, dx = 40) { if (a <= .01) return; const q = project(p); g2.save(); g2.globalAlpha = a; g2.fillStyle = col; g2.shadowColor = col; g2.shadowBlur = 20; g2.beginPath(); g2.arc(q.x, q.y, 14, 0, 7); g2.fill(); g2.restore(); txt(label, q.x + dx, q.y, 34, { align: dx > 0 ? 'left' : 'right', font: 'Montserrat', weight: 800, alpha: a, fill: col }); return q; }
function line2(p0, p1, a, col, w = 3, dash = null) { if (a <= .01) return; g2.save(); g2.globalAlpha = a; g2.strokeStyle = col; g2.lineWidth = w; if (dash) g2.setLineDash(dash); g2.beginPath(); g2.moveTo(p0.x, p0.y); g2.lineTo(p1.x, p1.y); g2.stroke(); g2.restore(); }
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
function seaEnv(t) { skyDome.position.copy(camera.position); U.uTime.value = t; ocean.visible = true; const st = 1600 / 260; ocean.position.set(Math.round(camera.position.x / st) * st, 0, Math.round(camera.position.z / st) * st);
  sea.fog.color.setRGB(.3, .18, .13); sea.fog.density = .0004; sunL.position.copy(SUN_DIR).multiplyScalar(500); sunL.target.position.set(0, 0, 0); sunL.target.updateMatrixWorld(); keyL.position.copy(camera.position).add(V3(0, 200, 0)); keyL.target.updateMatrixWorld(); }
function shipRide(t, amp = 1) { return { y: Math.sin(t * .7) * .5 * amp, roll: Math.sin(t * .55) * .012 * amp, pitch: Math.sin(t * .4 + 1) * .006 * amp }; }

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.fov = 35; camera.near = .1; camera.far = 6000;
  let scene = sea, bloomS = .6, flash = 0, ca = .0013, fade = 0, grain = .035, expo = 1;
  shipXray(0); ship.visible = true; liner.visible = false; bubbles.begin(); spray.begin(); oceanMat.uniforms.uFoam.value = 0;
  bpSea.visible = false; toLab(ship, false); toLab(liner, false); lab.fog.density = .015;
  ballM.visible = bowl.visible = cap.visible = section.visible = false; plate.visible = false; tank.visible = true; cargo.visible = false; ballastW.scale.y = 1;
  for (const c of ['ball', 'what', 'air', 'capsize', 'when', 'ballast', 'hole', 'titanic', 'marks', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];

  if (t < TL.ball) {
    // A · GANCHO: el acero se hunde… y esto flota
    const lt = t; const r = shipRide(t); ship.position.set(0, -SH.D * SH.wl + r.y, 0); ship.rotation.set(r.roll, 0, r.pitch);
    const k = lt / TL.ball; camOrbit(V3(lerp(40, 15, k), 6, 0), lerp(560, 490, k), lerp(2.15, 1.98, k), lerp(.08, .15, k), 40); camera.position.y = Math.max(camera.position.y, 4);
    oceanMat.uniforms.uFoam.value = .6; oceanMat.uniforms.uFoamPos.value.set(165, 0, 0); oceanMat.uniforms.uFoamR.value = 50;
    fade = 1 - smooth(0, .3, t);
    hud.push(() => { txt('EL ACERO SE HUNDE.', W / 2, 330, 52, { font: 'Montserrat', weight: 800, alpha: smooth(0, .25, lt) * (1 - smooth(TL.ship - .2, TL.ship, lt)) });
      bigStat('CARGADO PESA MÁS DE', '200.000 t', 430, smooth(TL.weight, TL.weight + .4, lt), .3 + lt * .2); titleHUD('Y AUN ASÍ', 'FLOTA', smooth(TL.ship + .3, TL.ship + .7, lt) * (1 - smooth(TL.weight - .2, TL.weight, lt)), 1460); });
  } else if (t < TL.air) {
    // B/C/D · TANQUE: bola al fondo; el mismo acero en cuenco flota; agua desplazada
    scene = lab; const lt = t - TL.ball; water.scale.y = TK.wl; ship.visible = false;
    const bT = TL.bowl - TL.ball, fT = TL.floats - TL.ball;
    if (t < TL.bowl + .6) { ballM.visible = true; const d = Math.max(0, lt - .4); const y = Math.max(.7, TK.h + .5 - (d < .45 ? 4.9 * d * d * 2.2 : 2.2 + (d - .45) * 2.4)); ballM.position.set(0, y, 0); ballM.scale.setScalar(t >= TL.bowl ? 1 - smooth(TL.bowl, TL.bowl + .5, t) : 1);
      if (y < TK.wl) emitRise(bubbles, V3(0, y, 0), 300, t, .5, 4, 1.2, [.6, .8, 1.1]); }
    if (t >= TL.bowl) { bowl.visible = true; const m = smooth(TL.bowl, TL.bowl + .6, t); bowl.scale.setScalar(Math.max(.01, m)); const settle = smooth(TL.bowl + .6, TL.floats + .3, t); const yB = lerp(TK.h + 1, TK.wl + 2.3 - BOWL_H, easeOut(settle)) + Math.sin(t * 2.2) * .05 * settle; bowl.position.set(0, yB, 0); bowl.rotation.set(0, 0, Math.sin(t * 1.6) * .03); cap.visible = t >= TL.displ + .3; cap.position.copy(bowl.position); cap.rotation.copy(bowl.rotation); }
    flash = Math.max(flash, flashAt(t, TL.bowl, .4, .5));
    camOrbit(V3(0, 4.6, 0), 31, .22 + lt * .015, .16, 40);
    hud.push(() => {
      txt('BOLA DE ACERO', W / 2, 330, 44, { font: 'Montserrat', weight: 800, alpha: smooth(.1, .4, lt) * (1 - smooth(bT - .2, bT, lt)) });
      txt('EL MISMO ACERO, EN CUENCO', W / 2, 330, 44, { font: 'Montserrat', weight: 800, alpha: smooth(bT + .2, bT + .5, lt) * (1 - smooth(TL.what - TL.ball - .2, TL.what - TL.ball, lt)) });
      stamp('FLOTA', W / 2, 480, smooth(fT, fT + .25, lt) * (1 - smooth(TL.what - TL.ball - .2, TL.what - TL.ball, lt)), -.08, '#7fd4ff');
      txt('¿QUÉ HA CAMBIADO?', W / 2, 330, 48, { font: 'Montserrat', weight: 800, alpha: smooth(TL.what - TL.ball, TL.what - TL.ball + .3, lt) * (1 - smooth(TL.displ - TL.ball - .1, TL.displ - TL.ball + .2, lt)) });
      const d0 = TL.displ - TL.ball; callout(V3(1.2, TK.wl - .7, 2.3), 140, 220, 'AGUA APARTADA', null, smooth(d0 + .4, d0 + .8, lt) * (1 - smooth(TL.archi - TL.ball - .2, TL.archi - TL.ball, lt)));
      titleHUD('NO EL MATERIAL:', 'EL AGUA QUE APARTA', smooth(d0, d0 + .4, lt) * (1 - smooth(TL.archi - TL.ball - .2, TL.archi - TL.ball, lt)), 330);
      const a0 = TL.archi - TL.ball; const aA = smooth(a0, a0 + .5, lt); if (bowl.visible) { const pc = project(bowl.position.clone().add(V3(0, -.6, 2.4)));
        arrowXY(pc.x - 120, pc.y - 380, pc.x - 120, pc.y - 40, aA, '#ff8a5a', 14); txt('PESO', pc.x - 145, pc.y - 270, 30, { align: 'right', font: 'Montserrat', weight: 800, alpha: aA, fill: '#ff8a5a' }); txt('DEL BARCO', pc.x - 145, pc.y - 232, 30, { align: 'right', font: 'Montserrat', weight: 800, alpha: aA, fill: '#ff8a5a' });
        arrowXY(pc.x + 120, pc.y + 300, pc.x + 120, pc.y - 40, aA, '#7fd4ff', 14); txt('PESO DEL AGUA', pc.x + 145, pc.y + 190, 30, { align: 'left', font: 'Montserrat', weight: 800, alpha: aA, fill: '#7fd4ff' }); txt('APARTADA', pc.x + 145, pc.y + 228, 30, { align: 'left', font: 'Montserrat', weight: 800, alpha: aA, fill: '#7fd4ff' }); }
      titleHUD('FLOTA CUANDO', 'LOS DOS SON IGUALES', smooth(a0 + 1.2, a0 + 1.6, lt), 330);
    });
  } else if (t < TL.capsize) {
    // E/F · CASI TODO AIRE; al cargar se hunde hasta equilibrarse
    const lt = t - TL.air; scene = lab; toLab(ship, true); lab.fog.density = .0004; tank.visible = false; shipXray(1); const ld = t >= TL.load; const k = smooth(TL.load + .3, TL.eq + 1, t);
    const draft = lerp(9, 21, k); for (const o of oil) o.scale.y = Math.max(.1, k * 24); bloomS = .75;
    const r = shipRide(t, .4); ship.position.set(0, -draft + r.y, 0); ship.rotation.set(r.roll, 0, 0);
    camOrbit(V3(-5, -4, 0), lerp(560, 510, lt / 6.6), 1.0 + lt * .015, .3, 40);
    hud.push(() => { titleHUD('POR DENTRO', 'CASI TODO AIRE', smooth(.2, .6, lt) * (1 - smooth(TL.load - TL.air - .2, TL.load - TL.air, lt)), 330);
      if (ld) { const l2 = t - TL.load; titleHUD('CUANTO MÁS LO CARGAS', 'MÁS SE HUNDE', smooth(0, .4, l2) * (1 - smooth(TL.eq - TL.load - .2, TL.eq - TL.load, l2)), 330); bigStat('CALADO', fmt(draft) + ' m', 430, smooth(TL.eq - TL.load, TL.eq - TL.load + .3, l2), .4); } });
  } else if (t < TL.hole) {
    // G/H/I · ESTABILIDAD: G, B, ola, vuelco, lastre (física calculada en la sección)
    scene = lab; ship.visible = false; section.visible = true; water.scale.y = TK.wl; const lt = t - TL.capsize;
    let th = 0, gx = 0, gy = 1.6; const stage = t < TL.wave ? 0 : t < TL.when ? 1 : t < TL.ballast ? 2 : 3;
    if (stage === 0) th = Math.sin(lt * 1.3) * .03;
    else if (stage === 1) { const l2 = t - TL.wave; th = Math.sin(l2 * 1.8) * .26 * Math.exp(-l2 * .18); }
    else if (stage === 2) { const l3 = t - TL.when; cargo.visible = true; const hi = smooth(TL.high - TL.when, TL.high - TL.when + .8, l3); gy = lerp(1.6, 4.4, hi); const sh = smooth(TL.high - TL.when + 1.6, TL.high - TL.when + 2.6, l3); gx = sh * .9; cargo.position.x = sh * 1.6;
      th = lerp(.03, 0, hi) + smooth(TL.tumble - TL.when - .6, TL.tumble - TL.when + 2.4, l3) * 2.6 + sh * .2; }
    else { const l4 = t - TL.ballast; const bk = smooth(.3, 1.6, l4); ballastW.scale.y = lerp(1, 6, bk); gy = lerp(1.6, 1.1, bk); th = Math.sin(l4 * 1.9) * .28 * Math.exp(-l4 * .25) * smooth(1.2, 1.8, l4); }
    const GB = placeSection(th, gx, gy);
    const cz = stage === 2 ? smooth(TL.when, TL.high + .8, t) : 0; camOrbit(V3(0, lerp(5.6, 7.2, cz), 0), lerp(24, 31, cz), .06, .12, 40);
    hud.push(() => {
      const aG = smooth(TL.cg - TL.capsize, TL.cg - TL.capsize + .4, lt), aB = smooth(TL.cb - TL.capsize, TL.cb - TL.capsize + .4, lt);
      titleHUD('FLOTAR NO BASTA', 'NO PUEDE VOLCAR', smooth(.2, .6, lt) * (1 - smooth(TL.cg - TL.capsize - .2, TL.cg - TL.capsize, lt)), 330);
      const qG = dotLabel(GB.G, '#ffb27a', 'G', aG, -40), qB = dotLabel(GB.B, '#7fd4ff', 'B', aB, 40);
      if (qG && aG > .01) arrowXY(qG.x, qG.y + 24, qG.x, qG.y + 300, aG, '#ffb27a', 12); if (qB && aB > .01) arrowXY(qB.x, qB.y - 24, qB.x, qB.y - 300, aB, '#7fd4ff', 12);
      txt('PESO · CENTRO DE GRAVEDAD', W / 2, 1450, 28, { weight: 600, alpha: aG * (1 - smooth(TL.wave - TL.capsize - .2, TL.wave - TL.capsize, lt)), fill: '#ffb27a' });
      txt('EMPUJE · CENTRO DE LA PARTE SUMERGIDA', W / 2, 1500, 28, { weight: 600, alpha: aB * (1 - smooth(TL.wave - TL.capsize - .2, TL.wave - TL.capsize, lt)), fill: '#7fd4ff' });
      if (stage === 1) { const l2 = t - TL.wave; titleHUD('UNA OLA LO INCLINA…', 'EL EMPUJE SE DESPLAZA', smooth(0, .4, l2) * (1 - smooth(TL.shift - TL.wave - .1, TL.shift - TL.wave + .2, l2)), 330); titleHUD('PESO Y EMPUJE', 'LO ENDEREZAN', smooth(TL.shift - TL.wave + .2, TL.shift - TL.wave + .6, l2), 330); }
      if (stage === 2) { const l3 = t - TL.when; txt('¿Y CUÁNDO VUELCA?', W / 2, 330, 48, { font: 'Montserrat', weight: 800, alpha: smooth(0, .3, l3) * (1 - smooth(TL.high - TL.when - .1, TL.high - TL.when + .2, l3)) });
        titleHUD('PESO DEMASIADO ALTO', 'O CARGA CORRIDA', smooth(TL.high - TL.when + .2, TL.high - TL.when + .6, l3) * (1 - smooth(TL.tumble - TL.when - .2, TL.tumble - TL.when, l3)), 330); stamp('LO TUMBA', W / 2, 400, smooth(TL.tumble - TL.when + 1.6, TL.tumble - TL.when + 1.9, l3), -.08); }
      if (stage === 3) { const l4 = t - TL.ballast; callout(V3(1.0, section.position.y + .5, 1.8), 40, 300, 'AGUA DE LASTRE', null, smooth(.4, .8, l4)); titleHUD('PESO ABAJO', 'MÁS ESTABILIDAD', smooth(TL.ballast - TL.ballast + 1.8, 2.2, l4), 330); }
    });
  } else if (t < TL.titanic) {
    // J · MAMPAROS ESTANCOS: el agua inunda un compartimento y se queda ahí
    const lt = t - TL.hole; scene = lab; toLab(ship, true); lab.fog.density = .0004; tank.visible = false; shipXray(1); for (const o of oil) o.scale.y = 1; bloomS = .75; oilMat.color.set(0x2a7acc); oilMat.emissive.setRGB(.2, .6, 1.4);
    const fl = smooth(TL.flood - TL.hole, TL.flood - TL.hole + 2.2, lt); oil.forEach((o, i) => { o.visible = i === 5; }); oil[5].scale.y = Math.max(.1, fl * 22);
    ship.position.set(0, -20 + Math.sin(t * .7) * .3, 0); ship.rotation.set(0, 0, -fl * .012);
    const hp = W2s(V3(125, -9, 28.5)); if (lt > .2) for (let i = 0; i < 1200; i++) { const s = spray.seed, k = i * 4; const age = fract(s[k] + t * 1.5); spray.push(hp.x + (s[k + 1] - .5) * 3, hp.y + (s[k + 2] - .5) * 3, hp.z - age * 16, .4 * (1 - age), .7 * (1 - age), 1.2 * (1 - age)); }
    camOrbit(V3(70, -6, 0), lerp(440, 400, lt / 6.9), .95 + lt * .015, .28, 40);
    hud.push(() => { txt('¿Y SI SE ABRE UN AGUJERO?', W / 2, 330, 44, { font: 'Montserrat', weight: 800, alpha: smooth(0, .3, lt) * (1 - smooth(TL.bulk - TL.hole - .2, TL.bulk - TL.hole, lt)) });
      titleHUD('MAMPAROS', 'ESTANCOS', smooth(TL.bulk - TL.hole, TL.bulk - TL.hole + .4, lt) * (1 - smooth(TL.flood - TL.hole - .2, TL.flood - TL.hole, lt)), 330);
      titleHUD('EL AGUA SE QUEDA', 'EN UN COMPARTIMENTO', smooth(TL.flood - TL.hole + .2, TL.flood - TL.hole + .6, lt), 330); });
  } else if (t < TL.marks) {
    // K · TITANIC: 4 inundados → flota; el iceberg abrió al menos 5
    const lt = t - TL.titanic; scene = lab; toLab(liner, true); lab.fog.density = .0004; tank.visible = false; ship.visible = false; liner.visible = true; linerXray(1); bloomS = .75;
    const five = t >= TL.iceberg; const n = five ? 5 : 4; comp.forEach((c, i) => { c.visible = true; c.userData.bh.visible = true; c.scale.y = i < n ? lerp(1, TI.D * .62, smooth(i * .25, i * .25 + .9, five ? t - TL.iceberg + 1 : lt)) : .01; c.visible = i < n; });
    const trim = five ? smooth(TL.iceberg + .6, TL.iceberg + 3, t) * .08 : 0; liner.position.set(0, -TI.D * TI.wl + Math.sin(t * .6) * .2 - trim * 60, 0); liner.rotation.set(0, 0, -trim);
    camOrbit(V3(10, -4, 0), lerp(440, 400, lt / 5), 1.0 + lt * .015, .26, 40);
    hud.push(() => { bigStat('TITANIC · 1912', n === 4 ? '4 INUNDADOS' : '5 ABIERTOS', 430, smooth(.1, .4, lt), .3 + lt * .2);
      txt(n === 4 ? 'AÚN PODÍA FLOTAR' : 'DEMASIADOS: SE HUNDE', W / 2, 540, 36, { font: 'Montserrat', weight: 800, alpha: smooth(.4, .8, lt), fill: n === 4 ? '#7fd4ff' : '#ff6a4a' }); });
  } else if (t < TL.brand) {
    // L · MARCAS DE CARGA: salada vs dulce
    scene = lab; tank.visible = false; plate.visible = true; ship.visible = false; const lt = t - TL.marks; const rv = smooth(TL.river - TL.marks + .3, TL.river - TL.marks + 2.5, lt);
    const lvl = lerp(MARK_S, MARK_F, rv) + Math.sin(t * 1.5) * .04; pw.position.y = lvl; pw.material.color.setRGB(lerp(.11, .25, rv), lerp(.43, .4, rv), lerp(.72, .25, rv)); pw.material.emissive.setRGB(lerp(.05, .12, rv), lerp(.2, .16, rv), lerp(.45, .06, rv));
    camOrbit(V3(.15, 8.4, 0), lerp(21, 19.5, lt / 10), .02, .04, 40); labKey.position.set(-4, 6, 10);
    hud.push(() => {
      callout(V3(-1.5, 6.2, 0), -60, -380, 'MARCAS DE FRANCOBORDO', 'hasta dónde puede hundirse', smooth(.3, .7, lt) * (1 - smooth(TL.salt - TL.marks - .2, TL.salt - TL.marks, lt)));
      const s0 = TL.salt - TL.marks; const aS = smooth(s0, s0 + .4, lt) * (1 - smooth(TL.river - TL.marks - .2, TL.river - TL.marks, lt));
      bigStat('AGUA SALADA', '1.025 kg/m³', 430, aS, .4); txt('más densa: flota más alto', W / 2, 540, 32, { weight: 300, alpha: aS });
      const aR = smooth(TL.river - TL.marks, TL.river - TL.marks + .4, lt); bigStat('EN UN RÍO · AGUA DULCE', '1.000 kg/m³', 430, aR, .4);
      const pS = project(V3(-.45, MARK_S, .2)), pF = project(V3(-.45, MARK_F, .2)); if (aR > .01) { arrowXY(pS.x, pS.y + 10, pS.x, pF.y - 10, aR * smooth(.3, .8, lt - (TL.river - TL.marks)), '#e3a372', 10); txt('SE HUNDE DECENAS DE cm MÁS', W / 2, pS.y + 200, 36, { font: 'Montserrat', weight: 800, alpha: smooth(1.5, 2, lt - (TL.river - TL.marks)), fill: '#e3a372' }); }
    });
  } else {
    // M · MARCA
    const lt = t - TL.brand; const r = shipRide(t); ship.position.set(0, -SH.D * SH.wl + r.y, 0); ship.rotation.set(r.roll, 0, r.pitch);
    camOrbit(V3(-40, 20, 0), 900, -.6 + lt * .02, .08, 40); expo = .85; fade = Math.min(.45, lt * .4);
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  bubbles.end(); spray.end();
  camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (scene === sea) seaEnv(t); else labBg.position.copy(camera.position);
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
function W2s(v) { ship.updateMatrixWorld(true); return ship.localToWorld(v.clone()); }
function renderCover() { renderFrame(TL.eq + .8); coverText('¿CÓMO FLOTA', 'EL ACERO?', 'Más de 200.000 toneladas… y no se hunde'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
window._dbg = { camera, ship, section, placeSection, equil };
