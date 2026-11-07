// NO LO SABÍAS — "¿Qué pasa de verdad dentro de un microondas?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final. Unidades: centímetros.
// Física: magnetrón a 2,45 GHz (λ = c/f ≈ 12,2 cm); calentamiento dieléctrico (rotación del dipolo del agua + fricción);
// la banda ISM 2,4–2,5 GHz no es una resonancia del agua (su absorción dieléctrica máxima a 25 °C está hacia 20 GHz);
// penetración de 1–2 cm en alimentos húmedos; ondas estacionarias con zonas calientes cada λ/2 ≈ 6,1 cm;
// rejilla de la puerta con agujeros de ~1 mm (mucho menores que λ); luz visible λ ≈ 0,5 µm (≈ 200.000 veces más corta);
// el hielo absorbe mucho menos porque sus moléculas no pueden girar; experimento del chocolate: c ≈ 2 · d · f.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3,
  renderer, g2, camera, SOFT, Particles, txt, copperGrad, project, fmt, callout, titleHUD, fract, camOrbit, arrowXY, bigStat, drawBrand, coverText, finish } from '../../lib/core.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const scene = new THREE.Scene();
{ const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .5; }
const bg = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
  vertexShader: `varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `varying vec3 vD; void main(){ float y=vD.y*.5+.5; vec3 c=mix(vec3(.004,.01,.025),vec3(.03,.06,.11),y); gl_FragColor=vec4(c,1.); }` }));
bg.renderOrder = -1; scene.add(bg);
const hemi = new THREE.HemisphereLight(0x9fc8ff, 0x0a0806, .55); scene.add(hemi);
const key = new THREE.DirectionalLight(0xffffff, 1.6); scene.add(key); scene.add(key.target);
const rim = new THREE.DirectionalLight(0xffa060, .8); scene.add(rim); scene.add(rim.target);
function lightAt(p) { key.position.copy(p).add(V3(-60, 90, 120)); key.target.position.copy(p); key.target.updateMatrixWorld(); rim.position.copy(p).add(V3(80, 20, -90)); rim.target.position.copy(p); rim.target.updateMatrixWorld(); }

const xrayMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  uniforms: { uA: { value: 1 }, uCol: { value: new THREE.Color(.3, .7, 1.15) } },
  vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform float uA; uniform vec3 uCol; varying vec3 vN; varying vec3 vV; void main(){ float f=pow(clamp(1.-abs(dot(vN,vV)),0.,1.),2.); gl_FragColor=vec4(uCol*(f*.8+.06),uA*(f*.7+.06)); }` });
const edgeMat = new THREE.LineBasicMaterial({ color: new THREE.Color(.4, .85, 1.4), transparent: true, opacity: .55 });
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

// Patrón de ondas estacionarias (zonas calientes cada λ/2 = 6,1 cm). Mismo patrón en GLSL y en JS.
const KS = Math.PI / 6.1, PA = .55, PB = 0.0;
const hotJS = (x, z) => Math.pow(Math.abs(Math.cos(KS * x + PA) * Math.cos(KS * z + PB)), 1.6);
const HOT_GLSL = `float hot(vec2 p){ return pow(abs(cos(${KS.toFixed(5)}*p.x+${PA.toFixed(3)})*cos(${KS.toFixed(5)}*p.y+${PB.toFixed(3)})),1.6); }`;
const heatCol = `vec3 heatCol(float h){ h=clamp(h,0.,1.); vec3 c=mix(vec3(.05,.12,.35),vec3(.9,.25,.08),smoothstep(.1,.55,h)); c=mix(c,vec3(1.,.75,.3),smoothstep(.55,.85,h)); return mix(c,vec3(1.,.95,.8),smoothstep(.88,1.,h)); }`;

// ==========================================================================
// MICROONDAS (origen en el suelo, frente de la puerta en z = +19)
// ==========================================================================
const oven = new THREE.Group(); scene.add(oven);
const CAV = { x0: -22, x1: 10, y0: 3, y1: 26, z0: -16, z1: 16 }; const CAVC = V3((CAV.x0 + CAV.x1) / 2, (CAV.y0 + CAV.y1) / 2, 0);
const shellMat = new THREE.MeshStandardMaterial({ color: 0x6a7076, roughness: .3, metalness: .8 });
const shells = [], knobs = [];
function shellBox(w, h, d, x, y, z, mat = shellMat) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); oven.add(m); shells.push(m); return m; }
shellBox(50, 1.5, 38, 0, 29.25, 0); shellBox(50, 1.5, 38, 0, .75, 0); shellBox(1.5, 27, 38, -24.25, 15, 0); shellBox(1.5, 27, 38, 24.25, 15, 0); shellBox(47, 27, 1.5, 0, 15, -18.25);
// cavidad interior
const cavMat = new THREE.MeshStandardMaterial({ color: 0xb8bcc0, roughness: .45, metalness: .5, side: THREE.BackSide });
const cavity = new THREE.Mesh(new THREE.BoxGeometry(CAV.x1 - CAV.x0, CAV.y1 - CAV.y0, CAV.z1 - CAV.z0), cavMat); cavity.position.copy(CAVC); oven.add(cavity); shells.push(cavity);
const cavEdges = new THREE.LineSegments(new THREE.EdgesGeometry(cavity.geometry), edgeMat); cavEdges.position.copy(CAVC); oven.add(cavEdges);
const lampL = new THREE.PointLight(0xffd59a, 0, 80, 1.5); lampL.position.set(-6, 24, 4); oven.add(lampL);
// suelo con el patrón de calor
const floorMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uA: { value: 0 }, uT: { value: 0 } },
  vertexShader: `varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `uniform float uA; uniform float uT; varying vec3 vW; ${HOT_GLSL} ${heatCol} void main(){ float h=hot(vW.xz); h*=.85+.15*sin(uT*6.); gl_FragColor=vec4(heatCol(h)*(.35+1.1*h),uA*(.35+.65*h)); }` });
const floorHeat = new THREE.Mesh(new THREE.PlaneGeometry(CAV.x1 - CAV.x0 - .2, CAV.z1 - CAV.z0 - .2), floorMat); floorHeat.rotation.x = -Math.PI / 2; floorHeat.position.set(CAVC.x, CAV.y0 + .05, 0); floorHeat.renderOrder = 2; oven.add(floorHeat);
// puerta con ventana y rejilla
const doorTex = canvasTex(512, 400, (x, w, h) => { x.fillStyle = '#16181b'; x.fillRect(0, 0, w, h); x.clearRect(52, 52, w - 104, h - 104);
  x.fillStyle = 'rgba(10,12,14,.55)'; x.fillRect(52, 52, w - 104, h - 104); x.fillStyle = 'rgba(0,0,0,.9)'; for (let j = 0; j < (h - 104) / 6; j++) for (let i = 0; i < (w - 104) / 6; i++) { x.beginPath(); x.arc(55 + i * 6 + (j % 2) * 3, 55 + j * 6, 1.6, 0, 7); x.fill(); } });
const doorMat = new THREE.MeshStandardMaterial({ map: doorTex, transparent: true, roughness: .2, metalness: .3, side: THREE.DoubleSide });
const door = new THREE.Mesh(new THREE.PlaneGeometry(37, 28.5), doorMat); door.position.set(-6, 15, 19.05); oven.add(door);
const doorGlass = new THREE.Mesh(new THREE.PlaneGeometry(37, 28.5), new THREE.MeshPhysicalMaterial({ color: 0x222831, roughness: .05, metalness: 0, transparent: true, opacity: .12, clearcoat: 1 })); doorGlass.position.set(-6, 15, 19.4); oven.add(doorGlass);
const handle = new THREE.Mesh(new THREE.BoxGeometry(1.2, 22, 1.6), new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: .25, metalness: 1 })); handle.position.set(10.2, 15, 20.2); oven.add(handle);
// panel de mandos con pantalla
const dispTex = canvasTex(256, 128, (x, w, h) => { x.fillStyle = '#05080a'; x.fillRect(0, 0, w, h); x.fillStyle = '#7fe8ff'; x.font = '700 72px Inter'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('0:30', w / 2, h / 2 + 4); });
const panel = new THREE.Mesh(new THREE.BoxGeometry(12, 28.5, .8), new THREE.MeshStandardMaterial({ color: 0x1c1e21, roughness: .4, metalness: .6 })); panel.position.set(18.2, 15, 18.9); oven.add(panel); shells.push(panel);
const disp = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.5), new THREE.MeshBasicMaterial({ map: dispTex, color: new THREE.Color(1.6, 1.6, 1.6) })); disp.position.set(18.2, 24.5, 19.35); oven.add(disp);
for (let i = 0; i < 2; i++) { const k = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 1.4, 40), new THREE.MeshStandardMaterial({ color: 0x8a9096, roughness: .3, metalness: 1 })); k.rotation.x = Math.PI / 2; k.position.set(18.2, 16 - i * 7.5, 19.9); oven.add(k); knobs.push(k); }
// plato giratorio y taza
const turn = new THREE.Group(); turn.position.set(CAVC.x, CAV.y0 + .9, 0); oven.add(turn);
const plateG = new THREE.Mesh(new THREE.CylinderGeometry(13, 13, .5, 72), new THREE.MeshPhysicalMaterial({ color: 0xc8e0e8, roughness: .05, transmission: .6, transparent: true, opacity: .55 })); turn.add(plateG);
const mug = new THREE.Group(); turn.add(mug); mug.position.set(0, .25, 0);
{ const body = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 3.9, 9, 48, 1, true), new THREE.MeshStandardMaterial({ color: 0xe9e4da, roughness: .35, side: THREE.DoubleSide })); body.position.y = 4.5; mug.add(body);
  const bot = new THREE.Mesh(new THREE.CircleGeometry(3.9, 48), body.material); bot.rotation.x = -Math.PI / 2; bot.position.y = .02; mug.add(bot);
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(4.05, 48), new THREE.MeshStandardMaterial({ color: 0x3a1e10, roughness: .15 })); coffee.rotation.x = -Math.PI / 2; coffee.position.y = 8; mug.add(coffee);
  const hd = new THREE.Mesh(new THREE.TorusGeometry(2.2, .5, 12, 32, Math.PI * 1.2), body.material); hd.position.set(4.6, 4.8, 0); hd.rotation.z = -Math.PI * .6; mug.add(hd); }
// pizza (escena del plato) con calor por zonas
const pizzaMat = new THREE.ShaderMaterial({ uniforms: { uHeat: { value: 0 }, uTurn: { value: 0 } },
  vertexShader: `varying vec3 vW; varying vec2 vL; void main(){ vL=position.xy; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `uniform float uHeat; uniform float uTurn; varying vec3 vW; varying vec2 vL; ${HOT_GLSL} ${heatCol}
    void main(){ float r=length(vL); float h=mix(hot(vW.xz), .32+.12*cos(r*1.03), uTurn)*uHeat; vec3 base=mix(vec3(.85,.62,.28),vec3(.95,.8,.45),.5+.5*sin(vL.x*2.1)*sin(vL.y*1.7));
      base=mix(base,vec3(.55,.12,.06),smoothstep(.6,.9,sin(vL.x*.9+1.)*sin(vL.y*.8)) *.6); if(r>9.) base=vec3(.75,.48,.22);
      vec3 c=base*.55+heatCol(h)*h*1.4; gl_FragColor=vec4(c,1.); }` });
const pizza = new THREE.Mesh(new THREE.CircleGeometry(10, 96), pizzaMat); pizza.rotation.x = -Math.PI / 2; pizza.position.y = .4; turn.add(pizza);
// magnetrón y guía de ondas (entre la cavidad y el panel)
const magG = new THREE.Group(); oven.add(magG);
const metal = new THREE.MeshStandardMaterial({ color: 0xa4aab0, roughness: .3, metalness: 1 });
const copper = new THREE.MeshStandardMaterial({ color: 0xc87a45, roughness: .3, metalness: 1 });
{ const body = new THREE.Mesh(new THREE.BoxGeometry(8, 7, 8), metal); body.position.set(17.2, 12, -6); magG.add(body);
  for (let i = 0; i < 7; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(10, .25, 10), copper); f.position.set(17.2, 8.2 + i * 1.1, -6); magG.add(f); }
  const mg = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.3, 1.6, 40), new THREE.MeshStandardMaterial({ color: 0x55585c, roughness: .6, metalness: .4 })); mg.position.set(17.2, 16.3, -6); magG.add(mg);
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(.7, .9, 3.4, 24), metal); ant.position.set(17.2, 18.6, -6); magG.add(ant);
  const wg1 = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 7), new THREE.MeshStandardMaterial({ color: 0x8e9398, roughness: .4, metalness: .9 })); wg1.position.set(17.2, 21.5, -6); magG.add(wg1);
  const wg2 = new THREE.Mesh(new THREE.BoxGeometry(8.5, 5, 7), wg1.material); wg2.position.set(12, 21.5, -6); magG.add(wg2); }
const magEdges = []; magG.children.forEach(m => { const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: new THREE.Color(1.4, .8, .4), transparent: true, opacity: 0 })); e.position.copy(m.position); magG.add(e); magEdges.push(e); });
function ovenXray(k) { knobs.forEach(m => m.visible = !k); disp.visible = !k; for (const m of shells) { if (!m.userData.m0) m.userData.m0 = m.material; m.material = k ? xrayMat : m.userData.m0; } door.visible = doorGlass.visible = handle.visible = !k; cavEdges.visible = !!k; }
// chocolatina del experimento (vértices fundidos en la CPU)
function chocoTex() { return canvasTex(512, 256, (x, w, h) => { x.fillStyle = '#3d1f12'; x.fillRect(0, 0, w, h); x.strokeStyle = '#2a140a'; x.lineWidth = 6; for (let i = 1; i < 8; i++) { x.beginPath(); x.moveTo(i * w / 8, 0); x.lineTo(i * w / 8, h); x.stroke(); } for (let j = 1; j < 3; j++) { x.beginPath(); x.moveTo(0, j * h / 3); x.lineTo(w, j * h / 3); x.stroke(); } x.strokeStyle = 'rgba(255,220,180,.12)'; x.lineWidth = 3; for (let i = 0; i < 8; i++) for (let j = 0; j < 3; j++) x.strokeRect(i * w / 8 + 8, j * h / 3 + 8, w / 8 - 16, h / 3 - 16); }); }
function makeChoco(L, Hh, D) { const g = new THREE.BoxGeometry(L, Hh, D, 120, 4, 24); g.translate(0, Hh / 2, 0); const m = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ map: chocoTex(), color: 0xffffff, roughness: .55, clearcoat: 0, clearcoatRoughness: .2 }));
  m.userData.p0 = Float32Array.from(g.attributes.position.array); m.userData.dims = [L, Hh, D]; return m; }
function meltChoco(m, f) { // f(xLocal, zLocal) → fusión 0..1
  const p = m.geometry.attributes.position, p0 = m.userData.p0, [L, Hh, D] = m.userData.dims; let mx = 0;
  for (let i = 0; i < p.count; i++) { const x = p0[i * 3], y = p0[i * 3 + 1], z = p0[i * 3 + 2]; const k = clamp(f(x, z)); mx = Math.max(mx, k);
    const sag = k * .75; const ny = y * (1 - sag); const spread = 1 + k * .35 * (1 - y / Hh); p.setXYZ(i, x, ny, z * spread); }
  p.needsUpdate = true; m.geometry.computeVertexNormals(); m.material.clearcoat = mx; m.material.roughness = lerp(.55, .2, mx); }
const bar = makeChoco(26, 1.4, 8); bar.position.set(CAVC.x, CAV.y0 + .02, 0); oven.add(bar); bar.visible = false;

// ==========================================================================
// 1945: RADAR (lejos, en z = −3000)
// ==========================================================================
const R0 = V3(0, 0, -3000); const radar = new THREE.Group(); radar.position.copy(R0); scene.add(radar);
{ const pts = []; for (let i = 0; i <= 40; i++) { const r = i / 40 * 160; pts.push(new THREE.Vector2(r, r * r / (4 * 110))); }
  const dish = new THREE.Mesh(new THREE.LatheGeometry(pts, 96), new THREE.MeshStandardMaterial({ color: 0x9aa0a4, roughness: .7, metalness: .4, side: THREE.DoubleSide })); dish.rotation.x = Math.PI / 2 - .5; dish.position.set(0, 260, 0); radar.add(dish);
  const ribs = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.LatheGeometry(pts, 24), 20), new THREE.LineBasicMaterial({ color: 0x3a4046 })); ribs.rotation.copy(dish.rotation); ribs.position.copy(dish.position); radar.add(ribs);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(10, 16, 260, 24), new THREE.MeshStandardMaterial({ color: 0x4a5056, roughness: .6, metalness: .6 })); mast.position.y = 130; radar.add(mast);
  const feed = new THREE.Mesh(new THREE.CylinderGeometry(4, 8, 30, 16), copper); const fp = V3(0, 110, 0).applyEuler(dish.rotation).add(dish.position); feed.position.copy(fp); feed.rotation.copy(dish.rotation); radar.add(feed);
  radar.userData.feed = fp.clone(); radar.userData.axis = V3(0, 1, 0).applyEuler(dish.rotation);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(900, 64), new THREE.MeshStandardMaterial({ color: 0x15181c, roughness: .9 })); ground.rotation.x = -Math.PI / 2; radar.add(ground); }
// chocolatina "del bolsillo" junto al radar
const choc1 = makeChoco(12, 1.2, 4.8); choc1.position.set(60, 120, 260); choc1.rotation.y = .5; radar.add(choc1);
const wrap = new THREE.Mesh(new THREE.BoxGeometry(6.5, 1.6, 5.4), new THREE.MeshStandardMaterial({ map: canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#b8261e'; x.fillRect(0, 0, w, h); x.fillStyle = '#f1d9a8'; x.fillRect(0, h * .35, w, h * .3); }), roughness: .5, metalness: .2 }));
wrap.position.set(-3.3, .75, 0); choc1.add(wrap);
const shelf = new THREE.Mesh(new THREE.BoxGeometry(70, 4, 40), new THREE.MeshStandardMaterial({ color: 0x3a3028, roughness: .8 })); shelf.position.set(60, 118, 260); radar.add(shelf);

// ==========================================================================
// MOLÉCULAS DE AGUA (en x = +3000) y RED DE HIELO
// ==========================================================================
const M0 = V3(3000, 0, 0); const molG = new THREE.Group(); molG.position.copy(M0); scene.add(molG);
const oMat = new THREE.MeshStandardMaterial({ color: 0xd8443a, roughness: .3, metalness: .1, emissive: new THREE.Color(0, 0, 0) });
const hMat = new THREE.MeshStandardMaterial({ color: 0xc9d2dc, roughness: .3, metalness: .1, emissive: new THREE.Color(0, 0, 0) });
const oGeo = new THREE.SphereGeometry(1, 32, 20), hGeo = new THREE.SphereGeometry(.62, 24, 16);
function makeMol(om = oMat, hm = hMat) { const g = new THREE.Group(); g.add(new THREE.Mesh(oGeo, om)); for (const s of [-1, 1]) { const h = new THREE.Mesh(hGeo, hm); h.position.set(s * .95, .73, 0); g.add(h); } return g; }
const mols = []; { const r = rng(4); for (let i = 0; i < 6; i++) for (let j = 0; j < 8; j++) for (let k = 0; k < 3; k++) { const m = makeMol(); const b = V3((i - 2.5) * 4.4 + (r() - .5) * 1.4, (j - 3.5) * 4.0 + (r() - .5) * 1.4, (k - 1) * 4.2 + (r() - .5) * 1.4);
  m.userData = { b, th0: r() * 6.283, ph: r() * 6.283, ax: r() * 6.283, sp: .6 + r() }; m.position.copy(b); molG.add(m); mols.push(m); } }
const hero = makeMol(); hero.position.set(0, 0, 9); hero.scale.setScalar(1.6); molG.add(hero);
const plateMatP = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: new THREE.Color(1, .3, .2), emissiveIntensity: .6, roughness: .4, metalness: .6 });
const plateMatN = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: new THREE.Color(.2, .5, 1.2), emissiveIntensity: .6, roughness: .4, metalness: .6 });
const elTop = new THREE.Mesh(new THREE.BoxGeometry(34, .8, 14), plateMatP); elTop.position.set(0, 18.5, 0); molG.add(elTop);
const elBot = new THREE.Mesh(new THREE.BoxGeometry(34, .8, 14), plateMatN); elBot.position.set(0, -18.5, 0); molG.add(elBot);
// hielo: red hexagonal rígida
const I0 = V3(3000, 0, 400); const iceG = new THREE.Group(); iceG.position.copy(I0); scene.add(iceG);
const oIce = new THREE.MeshStandardMaterial({ color: 0xc86058, roughness: .3 }), hIce = new THREE.MeshStandardMaterial({ color: 0xb8c8d8, roughness: .3 });
const ices = []; { for (let i = -3; i <= 3; i++) for (let j = -4; j <= 4; j++) for (let k = 0; k < 2; k++) { const m = makeMol(oIce, hIce); const x = i * 3.8 + (j % 2 ? 1.9 : 0), y = j * 3.3, z = (k - .5) * 3.8; m.position.set(x, y, z); m.rotation.z = ((i + j + k) % 3) * 2.094; m.userData.b = m.position.clone(); m.userData.r0 = m.rotation.z; iceG.add(m); ices.push(m); } }
const bonds = []; { const pos = []; for (const a of ices) for (const b of ices) if (a !== b && a.position.distanceTo(b.position) < 4.0 && a.id < b.id) pos.push(a.position.x, a.position.y, a.position.z, b.position.x, b.position.y, b.position.z);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: new THREE.Color(.5, .9, 1.5), transparent: true, opacity: .45 })); iceG.add(l); bonds.push(l); }

// ==========================================================================
// ALIMENTO EN CORTE (cámara térmica), en x = −3000
// ==========================================================================
const F0 = V3(-3000, 0, 0); const foodG = new THREE.Group(); foodG.position.copy(F0); scene.add(foodG);
const foodMat = new THREE.ShaderMaterial({ uniforms: { uHeat: { value: 0 }, uDiff: { value: 0 } }, side: THREE.DoubleSide,
  vertexShader: `varying vec3 vP; varying vec3 vN; void main(){ vP=position; vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform float uHeat; uniform float uDiff; varying vec3 vP; varying vec3 vN; ${heatCol}
    void main(){ float d=min(7.-length(vP.xz), 3.5-abs(vP.y)); d=max(d,0.); float h=mix(exp(-d/1.1), .25+.75*exp(-d/4.5), uDiff)*uHeat; float sh=.75+.25*abs(vN.z)+.1*vN.y;
      gl_FragColor=vec4(heatCol(h)*(.5+.45*h)*sh,1.); }` });
{ const half = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 7, 96, 1, false, 0, Math.PI), foodMat); foodG.add(half);
  const cut = new THREE.Mesh(new THREE.PlaneGeometry(14, 7), foodMat); cut.rotation.y = -Math.PI / 2; foodG.add(cut); }

// ==========================================================================
// REJILLA DE LA PUERTA (unidades: mm), en z = +3000
// ==========================================================================
const G0 = V3(0, 0, 3000); const meshG = new THREE.Group(); meshG.position.copy(G0); scene.add(meshG);
const holeTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 64, 64); x.fillStyle = '#000'; x.beginPath(); x.arc(32, 32, 20, 0, 7); x.fill(); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(250, 250); t.anisotropy = 8; return t; })();
const sheet = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: 0x9aa2aa, roughness: .4, metalness: .6, alphaMap: holeTex, alphaTest: .5, side: THREE.DoubleSide })); meshG.add(sheet);
const glassS = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: 0x9ab8c8, roughness: .05, transparent: true, opacity: .08 })); glassS.position.z = 3; meshG.add(glassS);

// partículas
const P = new Particles(16000, { size: .5, seed: 3, fog: false }); scene.add(P.obj);
const Pbig = new Particles(6000, { size: 3, seed: 7, fog: false }); scene.add(Pbig.obj);
// trayectorias de rebote dentro de la cavidad (desde la boca de la guía de ondas)
const bounces = []; { const r = rng(11); for (let n = 0; n < 9; n++) { let p = V3(CAV.x1 - .1, 21.5, -6); let d = V3(-1, (r() - .5) * 1.4, (r() - .5) * 1.6).normalize(); const pts = [p.clone()];
  for (let b = 0; b < 9; b++) { let tm = Infinity, ax = -1; for (const [i, lo, hi] of [[0, CAV.x0, CAV.x1], [1, CAV.y0, CAV.y1], [2, CAV.z0, CAV.z1]]) { const v = d.getComponent(i); if (Math.abs(v) < 1e-6) continue; const tt = ((v > 0 ? hi : lo) - p.getComponent(i)) / v; if (tt > 1e-4 && tt < tm) { tm = tt; ax = i; } }
    p = p.clone().addScaledVector(d, tm); pts.push(p.clone()); d.setComponent(ax, -d.getComponent(ax)); }
  const segs = []; let L = 0; for (let i = 1; i < pts.length; i++) { const l = pts[i].distanceTo(pts[i - 1]); segs.push([pts[i - 1], pts[i], L, l]); L += l; } bounces.push({ segs, L }); } }
function along(b, s) { s = Math.min(s, b.L - 1e-3); for (const [a, c, L0, l] of b.segs) if (s <= L0 + l) return a.clone().lerp(c, (s - L0) / l); return b.segs[b.segs.length - 1][1].clone(); }
const MW = [.35, .8, 1.6], LIGHT = [1.6, 1.3, .6];

// ==========================================================================
// HUD
// ==========================================================================
function stamp(s, x, y, a, rot = -.1, col = '#ff6a4a') { if (a <= .01) return; const sc = lerp(1.6, 1, easeOut(clamp(a * 1.4)));
  g2.save(); g2.translate(x, y); g2.rotate(rot); g2.scale(sc, sc); g2.globalAlpha = clamp(a); g2.strokeStyle = col; g2.lineWidth = 8; g2.shadowColor = col; g2.shadowBlur = 25;
  g2.font = '800 100px Montserrat'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.letterSpacing = '8px'; const w = g2.measureText(s).width + 70; g2.strokeRect(-w / 2, -75, w, 150); g2.fillStyle = col; g2.fillText(s, 0, 4); g2.restore(); }
function ruler(p0, p1, label, a, col = '#e3a372', off = 60) { if (a <= .01) return; const q0 = project(p0), q1 = project(p1); const k = easeOut(clamp(a * 1.3)); const xm = lerp(q0.x, q1.x, k), ym = lerp(q0.y, q1.y, k);
  g2.save(); g2.globalAlpha = clamp(a); g2.strokeStyle = col; g2.lineWidth = 4; g2.shadowColor = 'rgba(0,0,0,.6)'; g2.shadowBlur = 10;
  g2.beginPath(); g2.moveTo(q0.x, q0.y - off); g2.lineTo(xm, ym - off); g2.moveTo(q0.x, q0.y - off - 18); g2.lineTo(q0.x, q0.y - off + 18); g2.moveTo(q1.x, q1.y - off - 18 * k); g2.lineTo(q1.x, q1.y - off + 18 * k); g2.stroke();
  g2.setLineDash([6, 8]); g2.lineWidth = 2; g2.beginPath(); g2.moveTo(q0.x, q0.y); g2.lineTo(q0.x, q0.y - off); g2.moveTo(q1.x, q1.y); g2.lineTo(q1.x, q1.y - off); g2.stroke(); g2.restore();
  txt(label, (q0.x + q1.x) / 2, (q0.y + q1.y) / 2 - off - 46, 44, { font: 'Montserrat', weight: 800, alpha: a * smooth(.4, .9, a), fill: col }); }
function spectrum(a, t) { if (a <= .01) return; const x0 = 110, x1 = 970, y = 1180; const lx = g => lerp(x0, x1, (Math.log10(g) + 1) / 4); // 0,1 → 1000 GHz
  g2.save(); g2.globalAlpha = a; const gr = g2.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, '#16304f'); gr.addColorStop(1, '#2d5f8c'); g2.fillStyle = gr; g2.fillRect(x0, y - 14, x1 - x0, 28);
  g2.strokeStyle = 'rgba(255,255,255,.6)'; g2.lineWidth = 2; for (const g of [.1, 1, 10, 100, 1000]) { g2.beginPath(); g2.moveTo(lx(g), y + 18); g2.lineTo(lx(g), y + 34); g2.stroke(); } g2.restore();
  for (const [g, s] of [[.1, '0,1'], [1, '1'], [10, '10'], [100, '100'], [1000, '1000 GHz']]) txt(s, lx(g), y + 62, 26, { weight: 300, alpha: a * .8 });
  // banda ISM 2,4–2,5 GHz
  const b0 = lx(2.4), b1 = lx(2.5); const pa = a * (.75 + .25 * Math.sin(t * 6)); g2.save(); g2.globalAlpha = pa; g2.fillStyle = '#e3a372'; g2.shadowColor = '#e3a372'; g2.shadowBlur = 30; g2.fillRect(b0 - 5, y - 60, b1 - b0 + 10, 120); g2.restore();
  txt('2,45 GHz', lx(2.45), y - 160, 40, { font: 'Montserrat', weight: 800, alpha: a, fill: '#e3a372' }); txt('BANDA RESERVADA', lx(2.45), y - 112, 22, { spacing: 4, alpha: a * .9, fill: '#e3a372' });
  txt('wifi · bluetooth · microondas', lx(2.45), y + 112, 26, { weight: 300, alpha: a * .85 });
  // absorción del agua líquida (relajación dieléctrica, máximo hacia 20 GHz a 25 °C)
  const wa = a * smooth(.4, 1, a); g2.save(); g2.globalAlpha = wa * .9; g2.strokeStyle = '#7fd4ff'; g2.lineWidth = 4; g2.shadowColor = '#7fd4ff'; g2.shadowBlur = 16; g2.beginPath();
  for (let i = 0; i <= 120; i++) { const lg = -1 + i / 120 * 4, g = Math.pow(10, lg), wt = g / 20; const e = wt / (1 + wt * wt); const xx = lerp(x0, x1, i / 120), yy = y - 30 - e * 2 * 230; i ? g2.lineTo(xx, yy) : g2.moveTo(xx, yy); } g2.stroke(); g2.restore();
  txt('ABSORCIÓN DEL AGUA', lx(20), y - 330, 22, { spacing: 4, alpha: wa, fill: '#7fd4ff' }); txt('máximo hacia 20 GHz', lx(20), y - 296, 26, { weight: 300, alpha: wa }); }
function powerBar(t, t0, a) { if (a <= .01) return; const x0 = 140, x1 = 940, y = 1500; txt('POTENCIA AL DESCONGELAR', W / 2, y - 70, 24, { spacing: 6, alpha: a * .85, fill: '#e3a372' });
  for (let i = 0; i < 8; i++) { const xa = lerp(x0, x1, i / 8), on = i % 2 === 0; const lit = (t - t0) * 2.2 > i; g2.save(); g2.globalAlpha = a * (lit ? 1 : .25); g2.fillStyle = on ? '#e3a372' : '#2a3a52'; if (on && lit) { g2.shadowColor = '#e3a372'; g2.shadowBlur = 20; } g2.fillRect(xa + 4, y - (on ? 40 : 6), (x1 - x0) / 8 - 8, on ? 80 : 12); g2.restore(); }
  txt('ON', lerp(x0, x1, 1 / 16), y + 80, 24, { weight: 600, alpha: a * .8 }); txt('PAUSA', lerp(x0, x1, 3 / 16), y + 80, 24, { weight: 600, alpha: a * .8 }); }
function equation(t, a) { if (a <= .01) return; const l = t - TL.mult; const r1 = smooth(0, .4, l), r2 = smooth(.7, 1.1, l), r3 = smooth(TL.c - TL.mult, TL.c - TL.mult + .4, l);
  txt('6,1 cm × 2 = 12,2 cm', W / 2, 1280, 52, { font: 'Montserrat', weight: 800, alpha: a * r1 }); txt('LA ONDA ENTERA', W / 2, 1220, 22, { spacing: 6, alpha: a * r1 * .8, fill: '#e3a372' });
  txt('× 2.450.000.000 veces/s', W / 2, 1370, 46, { font: 'Montserrat', weight: 800, alpha: a * r2, fill: '#7fd4ff' });
  if (r3 > .01) { g2.save(); g2.globalAlpha = a * r3 * .7; g2.fillStyle = '#d98a52'; g2.fillRect(W / 2 - 300, 1430, 600, 3); g2.restore(); } }

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .5; camera.far = 8000;
  let bloomS = .6, flash = 0, ca = .0013, fade = 0, grain = .035, expo = 1, focus = V3(0, 15, 0);
  P.begin(); Pbig.begin(); ovenXray(0); floorMat.uniforms.uA.value = 0; floorMat.uniforms.uT.value = t; lampL.intensity = 0; turn.visible = true; mug.visible = true; turn.position.set(CAVC.x, CAV.y0 + .9, 0); plateG.material.opacity = .55; pizza.visible = false; bar.visible = false;
  magEdges.forEach(e => e.material.opacity = 0); dispTex.needsUpdate = false;
  for (const c of ['born', 'magnetron', 'water', 'myth1', 'myth2', 'plate', 'glass', 'ice', 'trick', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];
  radar.visible = t < TL.born; molG.visible = t >= TL.water && t < TL.myth2; foodG.visible = t >= TL.myth2 && t < TL.plate; meshG.visible = t >= TL.mesh && t < TL.ice; iceG.visible = t >= TL.ice && t < TL.trick; shells[0].visible = true;

  if (t < TL.born) {
    // A · 1945: radar y chocolatina que se derrite
    const lt = t; focus = R0.clone().add(V3(0, 200, 0)); const fp = radar.userData.feed.clone().add(R0), ax = radar.userData.axis;
    for (let i = 0; i < 2500; i++) { const s = P.seed, k = i * 4; const age = fract(s[k] + t * .35); const r = Math.sqrt(s[k + 1]) * 150, a = s[k + 2] * 6.283; const ring = Math.sin(age * 40 - t * 12) > .6 ? 1 : .15;
      const ux = V3(1, 0, 0), uy = V3().crossVectors(ax, ux).normalize(); const p = fp.clone().addScaledVector(ax, -110 + age * 900).addScaledVector(ux, Math.cos(a) * r * (1 + age)).addScaledVector(uy, Math.sin(a) * r * (1 + age)); const f = smooth(.06, .2, age) * (1 - age) * ring * .4; P.push(p.x, p.y, p.z, MW[0] * f, MW[1] * f, MW[2] * f); }
    P.mat.size = 5;
    const melt = smooth(TL.choco + .2, TL.choco + 1.8, t);
    meltChoco(choc1, (x) => melt * smooth(-2, 6, x) * (.7 + .3 * Math.sin(x * 1.3)));
    if (t < TL.choco) { const k = lt / TL.choco; camOrbit(R0.clone().add(V3(0, 230, 0)), lerp(1100, 950, k), lerp(.55, .45, k), lerp(.05, .1, k), 40); }
    else { const l2 = t - TL.choco; const c = choc1.position.clone().add(R0).add(V3(2, 1, 0)); camOrbit(c.add(V3(3, 0, 0)), lerp(40, 32, l2 / 2.5), 1.2 + l2 * .05, .6, 40); expo = 1.25; }
    lightAt(focus); fade = 1 - smooth(0, .3, t);
    hud.push(() => { bigStat('UN RADAR DE MICROONDAS', '1945', 430, smooth(0, .3, lt) * (1 - smooth(TL.choco - .2, TL.choco, lt)), .3 + lt * .2);
      txt('SE DERRITE', W / 2, 330, 52, { font: 'Montserrat', weight: 800, alpha: smooth(TL.choco + .8, TL.choco + 1.1, lt), fill: '#e3a372' }); });
  } else if (t < TL.magnetron) {
    // B · el microondas de tu cocina; dentro, la taza gira
    const lt = t - TL.born; lampL.intensity = 260; turn.rotation.y = t * .6; focus = V3(-2, 15, 0);
    const k = lt / (TL.magnetron - TL.born); const xr = smooth(TL.inside + .9, TL.magnetron - .2, t);
    camOrbit(V3(lerp(0, -4, k), 15, 0), lerp(150, 95, easeInOut(k)), lerp(-.5, -.15, k), lerp(.12, .2, k), 40);
    if (xr > .5) { ovenXray(1); bloomS = .75; }
    hud.push(() => { titleHUD('ASÍ NACIÓ', 'EL MICROONDAS', smooth(0, .3, lt) * (1 - smooth(TL.daily - TL.born + .6, TL.daily - TL.born + .8, lt)), 330);
      txt('¿QUÉ PASA AHÍ DENTRO?', W / 2, 330, 48, { font: 'Montserrat', weight: 800, alpha: smooth(TL.inside - TL.born, TL.inside - TL.born + .3, lt) }); });
  } else if (t < TL.water) {
    // C · magnetrón, ondas de 12 cm y rebotes en el metal
    const lt = t - TL.magnetron; ovenXray(1); bloomS = .8; turn.rotation.y = t * .6; lampL.intensity = 0;
    magEdges.forEach(e => e.material.opacity = smooth(0, .5, lt) * .9);
    const on = smooth(TL.waves - TL.magnetron - .2, TL.waves - TL.magnetron + .4, lt);
    // guía de ondas: antena → codo → boca
    if (on > 0) { const path = [V3(17.2, 18.6, -6), V3(17.2, 21.5, -6), V3(CAV.x1, 21.5, -6)];
      for (let i = 0; i < 700; i++) { const s = P.seed, k = i * 4; const u = fract(s[k] + t * 1.6); const p = u < .3 ? path[0].clone().lerp(path[1], u / .3) : path[1].clone().lerp(path[2], (u - .3) / .7); const f = on * (.5 + .5 * Math.sin(u * 40 - t * 20));
        P.push(p.x + (s[k + 1] - .5) * 2.5, p.y + (s[k + 2] - .5) * 2.5, p.z + (s[k + 3] - .5) * 3, MW[0] * f, MW[1] * f, MW[2] * f); } }
    // onda de 12,2 cm dibujada dentro de la cavidad
    const lw = smooth(TL.lambda_ - TL.magnetron, TL.lambda_ - TL.magnetron + .5, lt) * (1 - smooth(TL.bounce - TL.magnetron + .3, TL.bounce - TL.magnetron + .9, lt));
    if (lw > 0) for (let i = 0; i < 2600; i++) { const u = i / 2600; const x = lerp(CAV.x1, CAV.x0, u); const ph = 2 * Math.PI * (x / 12.2) + t * 5; const y = 15 + Math.sin(ph) * 4.5; const f = lw * (.55 + .45 * Math.cos(ph));
      P.push(x, y, 4, MW[0] * f * 1.4, MW[1] * f * 1.4, MW[2] * f * 1.4); }
    // rebotes
    const bw = smooth(TL.bounce - TL.magnetron, TL.bounce - TL.magnetron + .6, lt);
    if (bw > 0) { const tb = t - TL.bounce; for (let n = 0; n < bounces.length; n++) { const b = bounces[n]; const head = tb * 90 - n * 8; for (let i = 0; i < 520; i++) { const s = head - i * .45; if (s < 0 || s > b.L) continue; const p = along(b, s); const f = bw * 2.2 * Math.pow(1 - i / 520, 1.5) * (.6 + .4 * Math.sin(s * .5));
      P.push(p.x, p.y, p.z, MW[0] * f, MW[1] * f, MW[2] * f); } } }
    P.mat.size = 1.3;
    const k = lt / (TL.water - TL.magnetron); const sideV = smooth(TL.lambda_ - TL.magnetron - .4, TL.lambda_ - TL.magnetron + .4, lt) * (1 - smooth(TL.bounce - TL.magnetron, TL.bounce - TL.magnetron + .8, lt));
    camOrbit(V3(lerp(12, -6, smooth(0, .5, k)), lerp(15, 15, k), lerp(-3, 0, k)), lerp(lerp(72, 90, smooth(0, .5, k)), 96, sideV), lerp(.85, .35, smooth(0, .5, k)) * (1 - sideV) + .04 * sideV, lerp(.25, .1, sideV), 40);
    hud.push(() => { callout(V3(17.2, 12, -2), -40, 330, 'MAGNETRÓN', 'genera las microondas', smooth(.2, .6, lt) * (1 - smooth(TL.waves - TL.magnetron + 1.4, TL.waves - TL.magnetron + 1.8, lt)));
      bigStat('FRECUENCIA', '2,45 GHz', 430, smooth(TL.waves - TL.magnetron, TL.waves - TL.magnetron + .3, lt) * (1 - smooth(TL.lambda_ - TL.magnetron - .2, TL.lambda_ - TL.magnetron, lt)), .4);
      ruler(V3(-12.2 + 3.05 - 5 * 12.2 / (2 * Math.PI) * 0, 19.5, 4), V3(3.05, 19.5, 4), '12 cm', lw * smooth(.3, .9, lt - (TL.lambda_ - TL.magnetron)), '#7fd4ff', 70);
      txt('ONDAS DE', W / 2, 300, 24, { spacing: 8, alpha: lw * .8, fill: '#e3a372' });
      titleHUD('REBOTAN EN EL METAL', 'Y LLENAN LA CAJA', smooth(TL.bounce - TL.magnetron + .2, TL.bounce - TL.magnetron + .6, lt), 330); });
  } else if (t < TL.myth2) {
    // D/E · molécula de agua, campo que se invierte, fricción = calor; el mito de la frecuencia
    const lt = t - TL.water; focus = M0.clone(); bloomS = .7;
    const fOn = smooth(TL.field - .2, TL.field + .6, t); const e = Math.tanh(4 * Math.sin(t * 2 * Math.PI * .9)) * fOn;
    const heat = smooth(TL.heat - 1.5, TL.heat + 1, t); const spin = smooth(TL.spin, TL.spin + .8, t);
    for (const m of mols) { const u = m.userData; const al = fOn * (.78 - heat * .1); const jit = (.15 + spin * .35 + heat * .5);
      m.rotation.set(Math.sin(t * 1.3 * u.sp + u.ph) * .3 * (1 - al), Math.sin(t * 1.1 * u.sp + u.ax) * .3, u.th0 * (1 - al) + al * (Math.PI / 2) * (1 - e) + Math.sin(t * 9 * u.sp + u.ph) * jit * .5);
      m.position.set(u.b.x + Math.sin(t * 7 * u.sp + u.ph) * jit * .45, u.b.y + Math.sin(t * 6.3 * u.sp + u.ax) * jit * .45, u.b.z + Math.cos(t * 5.7 * u.sp + u.ph) * jit * .45); }
    oMat.emissive.setRGB(heat * .45, heat * .14, heat * .02); hMat.emissive.setRGB(heat * .35, heat * .16, heat * .04);
    plateMatP.emissive.setRGB(e > 0 ? 1.2 : .2, e > 0 ? .35 : .5, e > 0 ? .2 : 1.2); plateMatN.emissive.setRGB(e > 0 ? .2 : 1.2, e > 0 ? .5 : .35, e > 0 ? 1.2 : .2); plateMatP.emissiveIntensity = plateMatN.emissiveIntensity = .2 + fOn * .7;
    hero.visible = t < TL.field + .6; hero.rotation.set(0, Math.sin(t * .8) * .5, 0); hero.position.z = 46;
    const myth = t >= TL.myth1; const z = smooth(TL.field - .3, TL.field + .9, t);
    camOrbit(M0.clone().add(V3(0, lerp(0, 0, z), lerp(46, 0, z))), lerp(13, 98, easeInOut(z)) + (myth ? (t - TL.myth1) * 3 : 0), lerp(.25, -.3, z) + lt * .01, lerp(.1, .12, z), 40);
    bloomS = .55; if (myth) { fade = smooth(TL.myth1, TL.myth1 + .6, t) * .85; }
    lightAt(focus);
    hud.push(() => { const qa = smooth(.1, .5, lt) * (1 - smooth(TL.field - TL.water - .3, TL.field - TL.water, lt));
      if (qa > .01) { const pO = project(hero.localToWorld(V3(0, -.6, 0))), pH = project(hero.localToWorld(V3(0, 1.2, 0)));
        txt('δ−', pO.x - 150, pO.y + 70, 80, { font: 'Montserrat', weight: 800, alpha: qa, fill: '#7fd4ff' }); txt('δ+', pH.x + 150, pH.y - 60, 80, { font: 'Montserrat', weight: 800, alpha: qa, fill: '#ff8a5a' }); titleHUD('MOLÉCULA DE AGUA', 'UN IMÁN ELÉCTRICO', qa, 330); }
      const fa = fOn * (1 - smooth(TL.myth1 - .3, TL.myth1, t));
      if (fa > .01) { const up = e > 0; for (const xx of [90, 990]) arrowXY(xx, up ? 1350 : 650, xx, up ? 650 : 1350, fa * Math.abs(e), up ? '#ff8a5a' : '#7fd4ff', 12); txt('CAMPO', 90, 600, 22, { spacing: 4, alpha: fa * .8 }); }
      { const fa2 = smooth(TL.field - TL.water + .8, TL.field - TL.water + 1.2, lt) * (1 - smooth(TL.spin - TL.water + 1.4, TL.spin - TL.water + 1.8, lt)); titleHUD('CAMBIA DE SENTIDO', 'MILES DE MILLONES', fa2, 330); txt('DE VECES POR SEGUNDO', W / 2, 460, 30, { weight: 600, spacing: 3, alpha: fa2 }); }
      titleHUD('INTENTAN GIRAR', 'Y CHOCAN', smooth(TL.spin - TL.water + 1.8, TL.spin - TL.water + 2.2, lt) * (1 - smooth(TL.heat - TL.water - .2, TL.heat - TL.water, lt)), 330);
      stamp('CALOR', W / 2, 400, smooth(TL.heat - TL.water, TL.heat - TL.water + .25, lt) * (1 - smooth(TL.myth1 - TL.water - .2, TL.myth1 - TL.water, lt)), -.08, '#ff9a5a');
      if (myth) { const l3 = t - TL.myth1; txt('¿UNA FRECUENCIA', W / 2, 300, 48, { font: 'Montserrat', weight: 800, alpha: smooth(0, .3, l3) }); txt('ESPECIAL DEL AGUA?', W / 2, 360, 48, { font: 'Montserrat', weight: 800, alpha: smooth(0, .3, l3) });
        stamp('MITO', W / 2, 560, smooth(TL.band - TL.myth1, TL.band - TL.myth1 + .25, l3), -.1); spectrum(smooth(TL.band - TL.myth1 + .3, TL.band - TL.myth1 + 1, l3), t); } });
  } else if (t < TL.plate) {
    // F · no calienta de dentro hacia fuera: 1–2 cm y luego conducción
    const lt = t - TL.myth2; focus = F0.clone(); foodMat.uniforms.uHeat.value = smooth(TL.depth, TL.depth + 1.6, t) * .95 + .05; foodMat.uniforms.uDiff.value = smooth(TL.conduct + .2, TL.plate - .3, t);
    camOrbit(F0.clone().add(V3(0, -.5, 0)), lerp(56, 50, lt / 7), lerp(-1.25, -.95, lt / 7), .42, 40); lightAt(focus); bloomS = .7;
    for (let i = 0; i < 900; i++) { const s = P.seed, k = i * 4; const a = s[k] * Math.PI, age = fract(s[k + 1] + t * .9); const r = lerp(16, 7.2, age); const y = (s[k + 2] - .5) * 7; const f = smooth(TL.depth - .3, TL.depth + .3, t) * (1 - smooth(TL.conduct, TL.conduct + 1, t)) * age * .8;
      P.push(F0.x + Math.sin(a) * r, y, F0.z + Math.cos(a) * r, MW[0] * f, MW[1] * f, MW[2] * f); }
    P.mat.size = .6;
    hud.push(() => { txt('¿DE DENTRO', W / 2, 300, 48, { font: 'Montserrat', weight: 800, alpha: smooth(0, .3, lt) * (1 - smooth(TL.other - TL.myth2 + .5, TL.other - TL.myth2 + .8, lt)) }); txt('HACIA FUERA?', W / 2, 360, 48, { font: 'Montserrat', weight: 800, alpha: smooth(0, .3, lt) * (1 - smooth(TL.other - TL.myth2 + .5, TL.other - TL.myth2 + .8, lt)) });
      stamp('MITO', W / 2, 520, smooth(TL.other - TL.myth2, TL.other - TL.myth2 + .25, lt) * (1 - smooth(TL.depth - TL.myth2 + .5, TL.depth - TL.myth2 + .8, lt)), -.1);
      const d0 = TL.depth - TL.myth2; const aD = smooth(d0 + .8, d0 + 1.2, lt) * (1 - smooth(TL.conduct - TL.myth2 + .8, TL.conduct - TL.myth2 + 1.1, lt));
      if (aD > .01) ruler(F0.clone().add(V3(0, 3.5, -7)), F0.clone().add(V3(0, 3.5, -5.3)), '1–2 cm', aD, '#ffb27a', 70);
      titleHUD('LAS ONDAS SOLO ENTRAN', 'UN PAR DE CENTÍMETROS', smooth(d0 + .2, d0 + .6, lt) * (1 - smooth(TL.conduct - TL.myth2 - .2, TL.conduct - TL.myth2, lt)), 330);
      titleHUD('EL CENTRO SE CALIENTA', 'POR CONTACTO', smooth(TL.conduct - TL.myth2, TL.conduct - TL.myth2 + .4, lt), 330);
      txt('CÁMARA TÉRMICA', W / 2, 1650, 22, { spacing: 7, alpha: smooth(d0, d0 + .5, lt) * .7, fill: '#e3a372' }); });
  } else if (t < TL.glass) {
    // G · ondas estacionarias: zonas calientes fijas cada 6 cm; el plato gira para repartirlas
    const lt = t - TL.plate; ovenXray(1); shells[0].visible = false; bloomS = .75; mug.visible = false; pizza.visible = true;
    const st = smooth(TL.standing - .2, TL.standing + .8, t); floorMat.uniforms.uA.value = st * .9; const tr = smooth(TL.turn, TL.turn + .8, t);
    turn.rotation.y = t < TL.standing ? t * .6 : TL.standing * .6 + Math.max(0, t - TL.turn - .3) * .9 * tr;
    pizzaMat.uniforms.uHeat.value = smooth(TL.standing, TL.standing + 1.5, t); pizzaMat.uniforms.uTurn.value = smooth(TL.turn + .4, TL.glass - .3, t);
    camOrbit(V3(CAVC.x, 4, 0), lerp(70, 62, lt / 9), lerp(-.25, .15, lt / 9), lerp(.75, 1.25, smooth(TL.plate, TL.standing + .5, t)), 40);
    hud.push(() => { txt('¿POR QUÉ GIRA EL PLATO?', W / 2, 330, 48, { font: 'Montserrat', weight: 800, alpha: smooth(0, .3, lt) * (1 - smooth(TL.standing - TL.plate - .1, TL.standing - TL.plate + .2, lt)) });
      titleHUD('LAS ONDAS SE CRUZAN', 'ZONAS CALIENTES FIJAS', smooth(TL.standing - TL.plate + .2, TL.standing - TL.plate + .6, lt) * (1 - smooth(TL.turn - TL.plate - .2, TL.turn - TL.plate, lt)), 330);
      const xa = (-PA) / KS - 6.1, xb = xa + 6.1; ruler(V3(xa, CAV.y0 + 1, -12.2), V3(xb, CAV.y0 + 1, -12.2), '6 cm', smooth(TL.sep - TL.plate, TL.sep - TL.plate + .6, lt) * (1 - smooth(TL.turn - TL.plate + .6, TL.turn - TL.plate + 1, lt)), '#ffb27a', 50);
      titleHUD('GIRANDO, LA COMIDA', 'PASA POR TODAS', smooth(TL.turn - TL.plate, TL.turn - TL.plate + .4, lt), 330); });
  } else if (t < TL.ice) {
    // H · la rejilla de la puerta: la onda no cabe, la luz sí
    const lt = t - TL.glass; bloomS = .7;
    if (t < TL.mesh) { lampL.intensity = 260; turn.rotation.y = t * .6; camOrbit(V3(-4, 15, 19), lerp(80, 52, lt / 1.7), lerp(-.6, -.35, lt / 1.7), .12, 40); focus = V3(-4, 15, 0);
      for (const b of bounces.slice(0, 5)) for (let i = 0; i < 300; i++) { const s = fract(P.seed[i * 4] + t * .5) * b.L; const p = along(b, s); P.push(p.x, p.y, p.z, MW[0] * .5, MW[1] * .5, MW[2] * .5); } P.mat.size = .9; }
    else { focus = G0.clone(); const l2 = t - TL.mesh; P.mat.size = 6;
      const inc = smooth(TL.holes - .2, TL.holes + .6, t);
      // onda de 122 mm que llega desde dentro (z<0) y se refleja
      for (let i = 0; i < 2400; i++) { const u = i / 2400; const z = -420 + u * 420; const ph = 2 * Math.PI * z / 122 - t * 7; const f = inc * .9 * (.5 + .5 * Math.cos(ph)) * smooth(-420, -300, z);
        P.push(G0.x + Math.sin(ph) * 30, G0.y, G0.z + z - 2, MW[0] * f * 2.2, MW[1] * f * 2.2, MW[2] * f * 2.2);
        const ph2 = 2 * Math.PI * -z / 122 - t * 7; const f2 = inc * .5 * (.5 + .5 * Math.cos(ph2)) * smooth(-420, -300, z); P.push(G0.x + Math.sin(ph2) * 30, G0.y + 6, G0.z + z - 2, MW[0] * f2, MW[1] * f2, MW[2] * f2); }
      // luz: cruza los agujeros
      const la = smooth(TL.light - .1, TL.light + .6, t);
      if (la > 0) for (let i = 0; i < 2600; i++) { const s = P.seed, k = i * 4; const hx = Math.round((s[k + 1] - .5) * 60) * 1.6, hy = Math.round((s[k + 2] - .5) * 60) * 1.6 + (Math.round((s[k + 1] - .5) * 60) % 2 ? .8 : 0); const age = fract(s[k] + t * 1.2); const z = -160 + age * 320;
        const f = la * .9 * (1 - Math.abs(age - .5) * 1.6); P.push(G0.x + hx * 1.6, G0.y + hy * 1.6, G0.z + z, LIGHT[0] * f, LIGHT[1] * f, LIGHT[2] * f); }
      camOrbit(G0.clone().add(V3(0, 0, -60)), lerp(330, 280, l2 / 7), lerp(.75, .95, l2 / 7), lerp(.25, .32, l2 / 7), 40); }
    lightAt(focus);
    hud.push(() => { txt('¿POR QUÉ NO SE ESCAPAN', W / 2, 300, 46, { font: 'Montserrat', weight: 800, alpha: smooth(0, .3, lt) * (1 - smooth(TL.mesh - TL.glass + .6, TL.mesh - TL.glass + .9, lt)) }); txt('POR EL CRISTAL?', W / 2, 360, 46, { font: 'Montserrat', weight: 800, alpha: smooth(0, .3, lt) * (1 - smooth(TL.mesh - TL.glass + .6, TL.mesh - TL.glass + .9, lt)) });
      const m0 = TL.mesh - TL.glass; titleHUD('UNA REJILLA', 'DE METAL', smooth(m0 + .9, m0 + 1.3, lt) * (1 - smooth(TL.holes - TL.glass - .2, TL.holes - TL.glass, lt)), 330);
      if (t >= TL.mesh) callout(G0.clone().add(V3(0, 0, 0)), 60, -260, 'AGUJEROS DE ~1 mm', null, smooth(m0 + .5, m0 + .9, lt) * (1 - smooth(TL.light - TL.glass + 1.6, TL.light - TL.glass + 2, lt)));
      const h0 = TL.holes - TL.glass; titleHUD('LA ONDA MIDE 12 cm', 'Y NO CABE: REBOTA', smooth(h0 + .2, h0 + .6, lt) * (1 - smooth(TL.light - TL.glass - .2, TL.light - TL.glass, lt)), 330);
      { const la2 = smooth(TL.light - TL.glass, TL.light - TL.glass + .4, lt); bigStat('LA LUZ: ONDAS', '200.000×', 430, la2, .4); txt('MÁS CORTAS · SÍ PASA', W / 2, 540, 36, { font: 'Montserrat', weight: 800, alpha: la2 }); } });
  } else if (t < TL.trick) {
    // I · hielo: moléculas atrapadas; descongelar a pulsos
    const lt = t - TL.ice; focus = I0.clone(); bloomS = .7; const e = Math.tanh(4 * Math.sin(t * 2 * Math.PI * .9));
    for (const m of ices) { const u = m.userData; m.rotation.z = u.r0 + e * .07; m.position.set(u.b.x + Math.sin(t * 9 + u.b.y) * .06, u.b.y + Math.cos(t * 8 + u.b.x) * .06, u.b.z); }
    camOrbit(I0.clone().add(V3(0, 4, 0)), lerp(86, 76, lt / 5), lerp(.35, .1, lt / 5), .15, 40); lightAt(focus); bloomS = .5;
    hud.push(() => { txt('¿Y EL HIELO?', W / 2, 330, 52, { font: 'Montserrat', weight: 800, alpha: smooth(0, .3, lt) * (1 - smooth(TL.trapped - TL.ice + .3, TL.trapped - TL.ice + .6, lt)) });
      titleHUD('MOLÉCULAS ATRAPADAS', 'CASI NO PUEDEN GIRAR', smooth(TL.trapped - TL.ice + .4, TL.trapped - TL.ice + .8, lt) * (1 - smooth(TL.pulses - TL.ice - .2, TL.pulses - TL.ice, lt)), 330);
      titleHUD('POR ESO DESCONGELAR', 'VA A PULSOS', smooth(TL.pulses - TL.ice, TL.pulses - TL.ice + .4, lt), 330); powerBar(t, TL.pulses + .2, smooth(TL.pulses - TL.ice + .1, TL.pulses - TL.ice + .5, lt)); });
  } else if (t < TL.brand) {
    // J · el truco del chocolate: zonas fundidas a 6,1 cm → velocidad de la luz
    const lt = t - TL.trick; ovenXray(1); shells[0].visible = false; bloomS = .75; mug.visible = false;
    const out = smooth(TL.trick + .6, TL.bar - .2, t); turn.visible = out < .98; turn.position.y = CAV.y0 + .9 + out * 30; turn.position.x = CAVC.x + out * 0; plateG.material.opacity = .55 * (1 - out);
    const inB = smooth(TL.bar, TL.bar + 1, t); bar.visible = t >= TL.bar; bar.position.set(CAVC.x, CAV.y0 + .02, lerp(40, 0, easeOut(inB)));
    const melt = smooth(TL.measure - .6, TL.measure + 1.2, t); meltChoco(bar, (x, z) => melt * Math.pow(hotJS(x + CAVC.x, z), 1.3) * 1.15);
    floorMat.uniforms.uA.value = smooth(TL.measure - .8, TL.measure + .2, t) * .35 * (1 - smooth(TL.mult, TL.mult + .6, t));
    const eqv = smooth(TL.mult - .2, TL.mult + .6, t);
    camOrbit(V3(CAVC.x, CAV.y0 + 1, 0), lerp(lerp(70, 56, smooth(TL.bar, TL.measure, t)), 76, eqv), lerp(-.15, .05, lt / 9), lerp(.55, 1.05, smooth(TL.bar + .5, TL.measure, t)), 40);
    hud.push(() => { titleHUD('UN TRUCO:', 'QUITA EL PLATO', smooth(0, .3, lt) * (1 - smooth(TL.bar - TL.trick - .2, TL.bar - TL.trick, lt)), 330);
      txt('UNA TABLETA DE CHOCOLATE', W / 2, 330, 46, { font: 'Montserrat', weight: 800, alpha: smooth(TL.bar - TL.trick, TL.bar - TL.trick + .3, lt) * (1 - smooth(TL.measure - TL.trick - .2, TL.measure - TL.trick, lt)) });
      const xa = (-PA) / KS - 6.1 * 2, xb = xa + 6.1; ruler(V3(xa, CAV.y0 + 1.6, 0), V3(xb, CAV.y0 + 1.6, 0), '6,1 cm', smooth(TL.measure - TL.trick + .9, TL.measure - TL.trick + 1.5, lt), '#ffb27a', 90);
      titleHUD('MIDE LA DISTANCIA', 'ENTRE LAS ZONAS FUNDIDAS', smooth(TL.measure - TL.trick + .3, TL.measure - TL.trick + .7, lt) * (1 - smooth(TL.mult - TL.trick - .2, TL.mult - TL.trick, lt)), 330);
      equation(t, smooth(TL.mult - .1, TL.mult + .3, t));
      bigStat('LA VELOCIDAD DE LA LUZ', '≈ 300.000 km/s', 430, smooth(TL.c - TL.trick, TL.c - TL.trick + .4, lt), lt * .3 - 2);
      txt('CON CHOCOLATE.', W / 2, 1520, 56, { font: 'Montserrat', weight: 800, alpha: smooth(TL.choc2 - TL.trick, TL.choc2 - TL.trick + .3, lt), fill: '#e3a372' }); });
  } else {
    // K · marca
    const lt = t - TL.brand; lampL.intensity = 200 * (1 - smooth(.2, 1, lt)); disp.material.color.setRGB(1.6, 1.6, 1.6); turn.rotation.y = TL.brand * .6;
    camOrbit(V3(0, 15, 0), 170 + lt * 4, -.45 + lt * .02, .12, 40); expo = .85; fade = Math.min(.5, lt * .45);
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  if (t >= TL.brand || t < TL.born) { /* radar o marca: luces ya colocadas */ }
  if (!(t < TL.born) && !(t >= TL.water && t < TL.plate) && !(t >= TL.ice && t < TL.trick) && !(t >= TL.mesh && t < TL.ice)) lightAt(V3(0, 15, 0));
  P.end(); Pbig.end();
  camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); bg.position.copy(camera.position);
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
function renderCover() { renderFrame(TL.bounce + 1.4); coverText('¿CÓMO CALIENTA', 'EL MICROONDAS?', 'Spoiler: no es de dentro hacia fuera'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
