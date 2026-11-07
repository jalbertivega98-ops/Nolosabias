// NO LO SABÍAS — "¿Cómo enfría una nevera?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final. Unidades: metros.
// Referencia: frigorífico doméstico de compresión de vapor con isobutano (R600a, hierve a −11,7 °C a 1 atm). Evaporador en la pared interior,
// compresor hermético de pistón, condensador de rejilla trasero (gas de descarga 50–70 °C), tubo capilar como expansión.
// Einstein y Szilárd: patente US 1.781.541 «Refrigeration», concedida el 11 de noviembre de 1930 (frigorífico de absorción sin piezas móviles).
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3, g2, camera, SOFT, Particles, txt, copperGrad, project, callout, titleHUD, fract, camOrbit, bigStat, drawBrand, coverText, finish } from '../../lib/core.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const scene = new THREE.Scene(); scene.background = new THREE.Color(0x04060b);
scene.add(new THREE.HemisphereLight(0xc8d8ff, 0x1a1410, .6));
const key = new THREE.DirectionalLight(0xfff1e0, 2.2); key.position.set(3, 5, 4); scene.add(key);
const rim = new THREE.DirectionalLight(0x7fb0ff, 1.4); rim.position.set(-4, 3, -5); scene.add(rim);
const fill = new THREE.DirectionalLight(0xffe8d8, .7); scene.add(fill);
function xray(col, k = 1) { return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  uniforms: { uCol: { value: col }, uA: { value: k } },
  vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform vec3 uCol; uniform float uA; varying vec3 vN; varying vec3 vV; void main(){ float f=pow(clamp(1.-abs(dot(vN,vV)),0.,1.),2.); gl_FragColor=vec4(uCol*(f*.8+.05)*uA,(f*.7+.04)*uA); }` }); }
const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0x0b0e14, roughness: .8, metalness: .1 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
const halo = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshBasicMaterial({ map: SOFT, color: new THREE.Color(.1, .15, .28), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); halo.rotation.x = -Math.PI / 2; halo.position.y = .002; scene.add(halo);

// ==========================================================================
// NEVERA: carcasa, puerta, interior (estantes y comida), luz
// ==========================================================================
const FW = .62, FD = .66, FH = 1.75;
const white = new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: .3, metalness: .1, transparent: true });
const shellX = xray(new THREE.Color(.35, .75, 1.25));
const shell = new THREE.Mesh(new RoundedBoxGeometry(FW, FH, FD, 4, .03), white); shell.position.set(0, FH / 2 + .02, 0); scene.add(shell);
const shellG = new THREE.Mesh(shell.geometry, shellX); shellG.position.copy(shell.position); scene.add(shellG);
// hueco interior visible con la puerta abierta
const cavity = new THREE.Mesh(new THREE.BoxGeometry(FW - .08, FH - .2, FD - .06), new THREE.MeshStandardMaterial({ color: 0xf4f7fb, roughness: .6, side: THREE.BackSide, emissive: 0x000000 })); cavity.position.set(0, FH / 2 + .02, .03); scene.add(cavity);
const doorPivot = new THREE.Group(); doorPivot.position.set(-FW / 2, 0, FD / 2); scene.add(doorPivot);
const door = new THREE.Mesh(new RoundedBoxGeometry(FW, FH - .02, .06, 4, .025), white); door.position.set(FW / 2, FH / 2 + .02, .03); doorPivot.add(door);
const doorG = new THREE.Mesh(door.geometry, shellX); doorG.position.copy(door.position); doorPivot.add(doorG);
const handle = new THREE.Mesh(new THREE.BoxGeometry(.025, .45, .03), new THREE.MeshStandardMaterial({ color: 0x9aa3ad, metalness: .8, roughness: .3 })); handle.position.set(FW - .05, 1.15, .08); doorPivot.add(handle);
const inLight = new THREE.PointLight(0xdfefff, 0, 3, 1.5); inLight.position.set(0, 1.45, .1); scene.add(inLight);
const inner = new THREE.Group(); scene.add(inner);
for (const y of [.55, .95, 1.3]) { const s = new THREE.Mesh(new THREE.BoxGeometry(FW - .1, .012, FD - .14), new THREE.MeshStandardMaterial({ color: 0xcfe6f5, transparent: true, opacity: .45, roughness: .1 })); s.position.set(0, y, .02); inner.add(s); }
const FOODS = []; { const add = (geo, col, x, y, z, ry = 0) => { const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: col, roughness: .5, emissive: 0x000000 })); m.position.set(x, y, z); m.rotation.y = ry; inner.add(m); FOODS.push(m); return m; };
  add(new THREE.CylinderGeometry(.035, .035, .26, 20), 0x3f8f5a, -.17, .69, .05); add(new THREE.BoxGeometry(.09, .2, .07), 0xf2f2ea, -.05, .66, -.02, .3);
  add(new THREE.SphereGeometry(.045, 20, 14), 0xc8322a, .08, .6, .1); add(new THREE.SphereGeometry(.042, 20, 14), 0xd4462e, .16, .6, .04); add(new THREE.BoxGeometry(.14, .07, .1), 0xe8c25a, .1, 1.0, -.03, -.2);
  add(new THREE.CylinderGeometry(.06, .06, .08, 24), 0xe9e4dc, -.12, 1.0, .03); add(new THREE.CylinderGeometry(.03, .03, .22, 20), 0x8a2a3a, .18, 1.42, -.05); add(new THREE.BoxGeometry(.12, .09, .12), 0x4a7ac0, -.08, 1.36, 0); }
function setFridgeX(k) { white.opacity = 1 - k; white.depthWrite = k < .5; shell.visible = door.visible = k < .99; shellG.visible = doorG.visible = k > .01; shellX.uniforms.uA.value = k; cavity.visible = k < .5; handle.visible = k < .5; }

// ==========================================================================
// CIRCUITO DEL REFRIGERANTE
// ==========================================================================
const SEG = {}; const mk = (pts, r) => { const c = new THREE.CatmullRomCurve3(pts.map(p => V3(...p)), false, 'centripetal'); return { c, r }; };
{ const ev = []; const rowsY = [1.58, 1.5, 1.42, 1.34, 1.26]; rowsY.forEach((y, i) => { const a = i % 2 ? .22 : -.22; ev.push([a, y, -.285], [-a, y, -.285]); }); ev.unshift([-.24, 1.66, -.3]);
  SEG.evap = mk(ev, .009);
  SEG.suct = mk([[.22, 1.26, -.285], [.26, 1.2, -.33], [.26, 1.1, -.355], [.25, .5, -.36], [.18, .26, -.39], [.07, .2, -.42]], .008);
  const cd = [[-.07, .2, -.42], [-.2, .26, -.4], [-.26, .36, -.375]]; for (let i = 0; i < 10; i++) { const y = .42 + i * .125, a = i % 2 ? .25 : -.25; cd.push([a, y, -.375], [-a, y, -.375]); } cd.push([.27, 1.62, -.375]);
  SEG.cond = mk(cd, .008);
  const cp = [[.27, 1.62, -.375], [.24, 1.68, -.36]]; for (let k = 0; k <= 48; k++) { const u = k / 48, a = u * Math.PI * 2 * 6; cp.push([lerp(.18, -.14, u), 1.69 + Math.sin(a) * .03, -.35 + Math.cos(a) * .03]); } cp.push([-.2, 1.68, -.33], [-.24, 1.66, -.3]);
  SEG.cap = mk(cp, .0035); }
const copper = new THREE.MeshStandardMaterial({ color: 0xb87333, metalness: .85, roughness: .3 });
const segCol = { evap: new THREE.Color(.35, .75, 1.7), suct: new THREE.Color(.5, .8, 1.3), cond: new THREE.Color(1.7, .55, .25), cap: new THREE.Color(1.4, 1.1, .5) };
for (const [k, s] of Object.entries(SEG)) { s.geo = new THREE.TubeGeometry(s.c, k === 'cap' ? 600 : 300, s.r, 10, false); s.mesh = new THREE.Mesh(s.geo, copper); s.glow = new THREE.Mesh(s.geo, xray(segCol[k], 1)); scene.add(s.mesh, s.glow); s.n = s.geo.index.count; s.len = s.c.getLength(); }
function setPipes(solid, glow, draw = 1) { for (const s of Object.values(SEG)) { s.mesh.visible = solid > .01; s.glow.visible = glow > .01; s.glow.material.uniforms.uA.value = glow; const n = Math.floor(s.n * clamp(draw) / 3) * 3; s.geo.setDrawRange(0, n); } }
// compresor hermético (carcasa + pistón en rayos X)
const comp = new THREE.Group(); comp.position.set(0, .16, -.45); scene.add(comp);
const compShell = new THREE.Mesh(new THREE.CapsuleGeometry(.1, .08, 8, 24), new THREE.MeshStandardMaterial({ color: 0x1c1f24, metalness: .6, roughness: .45 })); comp.add(compShell);
const compX = new THREE.Mesh(compShell.geometry, xray(new THREE.Color(1.2, .6, .3), 1)); comp.add(compX);
const cyl = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .1, 20, 1, true), xray(new THREE.Color(.8, .9, 1.2), 1)); cyl.rotation.z = Math.PI / 2; cyl.position.set(.02, .04, 0); comp.add(cyl);
const piston = new THREE.Mesh(new THREE.CylinderGeometry(.032, .032, .03, 20), new THREE.MeshStandardMaterial({ color: 0xb8c0c8, metalness: .9, roughness: .25 })); piston.rotation.z = Math.PI / 2; comp.add(piston);
const motorCoil = new THREE.Mesh(new THREE.TorusGeometry(.05, .018, 12, 32), new THREE.MeshStandardMaterial({ color: 0xb06a2a, metalness: .7, roughness: .35, emissive: 0x200800 })); motorCoil.position.y = -.05; motorCoil.rotation.x = Math.PI / 2; comp.add(motorCoil);
function setComp(xk, t) { compShell.visible = xk < .99; compShell.material.transparent = true; compShell.material.opacity = 1 - xk; compX.visible = xk > .01; compX.material.uniforms.uA.value = xk; piston.visible = cyl.visible = motorCoil.visible = xk > .3; piston.position.set(.02 + Math.sin(t * 9) * .03, .04, 0); }

// piel con alcohol (escena aparte, lejos)
const skinG = new THREE.Group(); skinG.position.set(30, 0, 0); scene.add(skinG);
const skinSlab = new THREE.Mesh(new RoundedBoxGeometry(1.4, .3, 1, 6, .12), new THREE.MeshStandardMaterial({ color: 0xd9a083, roughness: .55, emissive: 0x2a1209 })); skinSlab.position.y = .15; skinG.add(skinSlab);
const dropA = new THREE.Mesh(new THREE.SphereGeometry(.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), xray(new THREE.Color(.7, .95, 1.5), 1.2)); dropA.position.y = .3; skinG.add(dropA);
// patente (escena aparte)
const pcv = document.createElement('canvas'); pcv.width = 820; pcv.height = 1120; { const c = pcv.getContext('2d'); c.fillStyle = '#efe8d8'; c.fillRect(0, 0, 820, 1120); const r = rng(9); for (let i = 0; i < 3000; i++) { c.fillStyle = `rgba(120,100,70,${r() * .06})`; c.fillRect(r() * 820, r() * 1120, 2, 2); }
  c.fillStyle = '#2a2622'; c.textAlign = 'center'; c.font = '600 30px serif'; c.fillText('UNITED STATES PATENT OFFICE', 410, 80); c.font = '22px serif'; c.fillText('ALBERT EINSTEIN AND LEO SZILARD, OF BERLIN, GERMANY', 410, 125); c.font = '700 34px serif'; c.fillText('REFRIGERATION', 410, 180);
  c.textAlign = 'left'; c.font = '22px serif'; c.fillText('Patented Nov. 11, 1930', 60, 225); c.textAlign = 'right'; c.fillText('1,781,541', 760, 225);
  c.strokeStyle = '#2a2622'; c.lineWidth = 3; const box = (x, y, w, h) => { c.strokeRect(x, y, w, h); }; box(140, 330, 150, 300); box(520, 300, 130, 220); box(330, 700, 180, 260); c.beginPath(); c.ellipse(215, 330, 75, 22, 0, 0, 7); c.stroke(); c.beginPath(); c.ellipse(585, 300, 65, 20, 0, 0, 7); c.stroke();
  c.beginPath(); c.moveTo(290, 420); c.lineTo(520, 420); c.moveTo(290, 560); c.bezierCurveTo(380, 600, 330, 700, 360, 700); c.moveTo(650, 470); c.bezierCurveTo(720, 600, 600, 760, 510, 780); c.moveTo(215, 630); c.lineTo(215, 900); c.lineTo(330, 900); c.stroke();
  for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(540, 330 + i * 22); c.lineTo(630, 330 + i * 22); c.stroke(); } c.font = 'italic 20px serif'; c.textAlign = 'left'; ['1', '2', '3', '4', '5'].forEach((s, i) => c.fillText(s, [120, 660, 520, 300, 230][i], [320, 290, 690, 560, 920][i]));
  c.font = '18px serif'; c.textAlign = 'center'; c.fillText('Fig. 1', 410, 1040); }
const ptex = new THREE.CanvasTexture(pcv); ptex.colorSpace = THREE.SRGBColorSpace; ptex.anisotropy = 4;
const patent = new THREE.Mesh(new THREE.PlaneGeometry(2.05, 2.8), new THREE.MeshStandardMaterial({ map: ptex, roughness: .9, emissive: 0x151210 })); patent.position.set(-30, 1.6, 0); scene.add(patent);

// ==========================================================================
// PARTÍCULAS: refrigerante dentro del tubo, calor, aire frío
// ==========================================================================
const P = new Particles(16000, { size: .03, seed: 11 }); scene.add(P.obj); const _p = V3();
function flow(segK, n, t, speed, colFn, jitter = .006, seedOff = 0, amp = 1) { const s = SEG[segK]; for (let i = 0; i < n; i++) { const k = ((i + seedOff) % P.n) * 4, sd = P.seed; const u = fract(sd[k] + t * speed / s.len); s.c.getPointAt(u, _p);
    const c = colFn(u, sd[k + 1]); P.push(_p.x + (sd[k + 1] - .5) * jitter, _p.y + (sd[k + 2] - .5) * jitter, _p.z + (sd[k + 3] - .5) * jitter, c[0] * amp, c[1] * amp, c[2] * amp); } }
const lc = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
const BLUE = [.35, .8, 1.9], VAP = [.7, .9, 1.4], RED = [1.9, .45, .2], ORA = [1.7, .8, .3], YEL = [1.5, 1.2, .55];
function circuit(t, amp, which = null) { const on = k => !which || which.includes(k);
  if (on('evap')) flow('evap', 900, t, .25, (u, r) => r < .35 + u * .5 ? lc(BLUE, [1.6, 1.8, 2], smooth(.1, 1, u) * .5) : BLUE, .012, 0, amp);
  if (on('suct')) flow('suct', 260, t, .45, () => VAP, .01, 2000, amp);
  if (on('cond')) flow('cond', 1200, t, .28, u => u < .12 ? RED : lc(ORA, YEL, smooth(.2, .95, u)), .01, 4000, amp);
  if (on('cap')) flow('cap', 600, t, .35, u => lc(YEL, BLUE, smooth(.75, .98, u)), .004, 7000, amp); }
// calor (partículas naranjas) de A hacia B
function heatStream(n, t, a, b, spread, life, col, seedOff, amp = 1) { for (let i = 0; i < n; i++) { const k = ((i + seedOff) % P.n) * 4, sd = P.seed; const u = fract(sd[k] + t / life); const f = Math.sin(u * Math.PI) * amp;
    const x = lerp(a.x, b.x, u) + (sd[k + 1] - .5) * spread * (1 - u * .5), y = lerp(a.y, b.y, u) + (sd[k + 2] - .5) * spread + Math.sin(u * 6 + i) * .02, z = lerp(a.z, b.z, u) + (sd[k + 3] - .5) * spread; P.push(x, y, z, col[0] * f, col[1] * f, col[2] * f); } }
function riseHeat(n, t, x0, x1, y0, z, h, col, seedOff, amp = 1) { for (let i = 0; i < n; i++) { const k = ((i + seedOff) % P.n) * 4, sd = P.seed; const u = fract(sd[k] + t * .35); const f = Math.sin(u * Math.PI) * amp;
    P.push(lerp(x0, x1, sd[k + 1]) + Math.sin(u * 8 + i) * .03, y0 + u * h, z - u * .25 * sd[k + 2], col[0] * f, col[1] * f, col[2] * f); } }
function coldSpill(n, t, amp) { for (let i = 0; i < n; i++) { const k = ((i + 9000) % P.n) * 4, sd = P.seed; const u = fract(sd[k] + t * .3); const f = (1 - u) * amp;
    const x = lerp(-.28, .28, sd[k + 1]) + (sd[k + 3] - .5) * u * .4, y = Math.max(.03, lerp(.15 + sd[k + 2] * 1.2, .02, smooth(0, .7, u))), z = .36 + u * .9; P.push(x, y, z, .35 * f, .65 * f, 1.1 * f); } }
function thermo(x, y, label, val, col, a) { if (a <= .01) return; txt(label, x, y - 46, 22, { spacing: 5, alpha: a * .8, fill: col }); txt(val, x, y, 60, { font: 'Montserrat', weight: 800, alpha: a, fill: col }); }

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .02; camera.far = 200;
  let bloomS = .6, flash = 0, ca = .0013, fade = 0, grain = .035, expo = 1, dim = 0;
  P.begin(); P.mat.size = .07; setFridgeX(0); setPipes(0, 0); setComp(0, t); doorPivot.rotation.y = 0; inLight.intensity = 0; inner.visible = false; FOODS.forEach(f => f.material.emissive.setRGB(0, 0, 0));
  for (const c of ['how', 'boil', 'alcohol', 'vapor', 'grille', 'liq', 'door', 'curious', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = []; const C0 = V3(0, .9, 0);
  if (t < TL.how) {
    // A · abre la puerta… no fabrica frío; saca el calor y lo tira a la cocina
    const op = easeInOut(smooth(.05, .9, t)) * (1 - smooth(TL.none + .6, TL.out, t)); doorPivot.rotation.y = -op * 1.7; inLight.intensity = op * 2.5; inner.visible = true;
    const xk = smooth(TL.out, TL.out + .7, t); setFridgeX(xk); if (op > .05) coldSpill(700, t, op * .9);
    camOrbit(V3(0, lerp(1.0, .95, xk), 0), lerp(4.6, 4.9, t / 6), lerp(.45, .9, smooth(TL.out, TL.how, t)), .18, 35);
    const hk = smooth(TL.out + .3, TL.out + 1, t); if (hk > 0) { FOODS.forEach((f, i) => heatStream(40, t + i * .3, f.position, V3(0, 1.4, -.3), .05, 1.4, ORA, 600 + i * 50, hk));
      const ok = smooth(TL.kitchen - .2, TL.kitchen + .5, t); riseHeat(900, t, -.3, .3, .35, -.42, 1.8, ORA, 3000, ok); setPipes(0, .5 * hk); }
    hud.push(() => { titleHUD('', 'TU NEVERA NO FABRICA FRÍO', smooth(.1, .35, t) * (1 - smooth(TL.none - .1, TL.none + .1, t)), 300);
      titleHUD('', 'NADA PUEDE FABRICARLO', smooth(TL.none, TL.none + .3, t) * (1 - smooth(TL.out - .1, TL.out + .1, t)), 300);
      titleHUD('LO QUE HACE ES', 'SACAR EL CALOR DE DENTRO', smooth(TL.out, TL.out + .3, t) * (1 - smooth(TL.kitchen - .1, TL.kitchen + .1, t)), 300);
      titleHUD('Y TIRARLO', 'A TU COCINA', smooth(TL.kitchen, TL.kitchen + .3, t), 300); });
  } else if (t < TL.boil) {
    // B · el circuito: líquido que hierve a −12 °C, tubos escondidos en las paredes
    const lt = t - TL.how; setFridgeX(1); inner.visible = true; const dr = smooth(TL.liquid - TL.how, TL.pipes - TL.how + 1.5, lt); setPipes(0, 1, dr); bloomS = .8;
    if (dr > .98) circuit(t, smooth(TL.pipes - TL.how + 1.4, TL.pipes - TL.how + 2, lt));
    camOrbit(V3(0, lerp(.95, 1.25, smooth(0, 4, lt)), -.1), lerp(4.4, 3.2, smooth(0, 5, lt)), .9 + lt * .08, .22, 35);
    hud.push(() => { titleHUD('', '¿CÓMO?', smooth(0, .2, lt) * (1 - smooth(TL.liquid - TL.how - .1, TL.liquid - TL.how + .1, lt)), 300);
      bigStat('UN LÍQUIDO QUE HIERVE A', '−12 °C', 400, smooth(TL.liquid - TL.how, TL.liquid - TL.how + .3, lt) * (1 - smooth(TL.pipes - TL.how - .1, TL.pipes - TL.how + .1, lt)), clamp((lt - .8) / 1.5));
      callout(SEG.evap.c.getPointAt(.5), -90, -140, 'EVAPORADOR', 'en la pared interior', smooth(TL.pipes - TL.how, TL.pipes - TL.how + .4, lt), '#7fd4ff');
      titleHUD('CORRE POR TUBOS', 'ESCONDIDOS EN LAS PAREDES', smooth(TL.pipes - TL.how, TL.pipes - TL.how + .3, lt), 300); });
  } else if (t < TL.alcohol) {
    // C · dentro hace más calor que −12 °C: hierve y roba el calor a la comida
    const lt = t - TL.boil; setFridgeX(1); inner.visible = true; setPipes(0, 1); bloomS = .85; P.mat.size = .022;
    circuit(t, 1, ['evap', 'cap']); const sk = smooth(TL.steal - .3, TL.steal + .8, t);
    FOODS.forEach((f, i) => { const warm = 1 - sk * .8; f.material.emissive.setRGB(.12 * warm, .04 * warm, 0); heatStream(70, t + i * .2, f.position, SEG.evap.c.getPointAt(fract(i * .37)), .04, 1.1, ORA, 600 + i * 80, smooth(TL.energy - .3, TL.energy + .5, t)); });
    camOrbit(V3(0, 1.25, -.12), lerp(1.7, 1.35, smooth(0, 5, lt)), .55 + lt * .05, .12, 35);
    hud.push(() => { titleHUD('DENTRO HACE MÁS CALOR', 'ASÍ QUE HIERVE', smooth(0, .3, lt) * (1 - smooth(TL.energy - TL.boil - .1, TL.energy - TL.boil + .1, lt)), 300);
      thermo(W / 2 - 220, 1300, 'INTERIOR', '+4 °C', '#ffb27a', smooth(.4, .8, lt) * (1 - smooth(TL.energy - TL.boil - .1, TL.energy - TL.boil + .1, lt))); thermo(W / 2 + 220, 1300, 'REFRIGERANTE', '−12 °C', '#7fd4ff', smooth(.4, .8, lt) * (1 - smooth(TL.energy - TL.boil - .1, TL.energy - TL.boil + .1, lt)));
      titleHUD('PARA HERVIR', 'NECESITA ENERGÍA', smooth(TL.energy - TL.boil, TL.energy - TL.boil + .3, lt) * (1 - smooth(TL.steal - TL.boil - .1, TL.steal - TL.boil + .1, lt)), 300);
      titleHUD('Y SE LA ROBA', 'A TU COMIDA', smooth(TL.steal - TL.boil, TL.steal - TL.boil + .3, lt), 300); });
  } else if (t < TL.vapor) {
    // D · como el alcohol que se evapora en tu piel
    const lt = t - TL.alcohol; const ev = smooth(.3, 2.6, lt); dropA.scale.set(1 - ev * .85, (1 - ev * .9), 1 - ev * .85); bloomS = .9;
    for (let i = 0; i < 800; i++) { const k = (i % P.n) * 4, sd = P.seed; const u = fract(sd[k] + t * .5); const f = (1 - u) * (.4 + ev * .6); const a = sd[k + 1] * 6.28, r = sd[k + 2] * .22 * (1 - ev * .6);
      P.push(30 + Math.cos(a) * r + Math.sin(u * 5 + i) * .03 * u, .32 + u * .9, Math.sin(a) * r, .45 * f, .8 * f, 1.4 * f); }
    for (let i = 0; i < 400; i++) { const k = ((i + 3000) % P.n) * 4, sd = P.seed; const u = fract(sd[k] + t * .4); const f = Math.sin(u * Math.PI) * .9; const a = sd[k + 1] * 6.28, r = .7 * (1 - u) + .2;
      P.push(30 + Math.cos(a) * r, .31, Math.sin(a) * r * .7, 1.6 * f, .7 * f, .3 * f); }
    P.mat.size = .035; camOrbit(V3(30, .35, 0), 2.1, .4 + lt * .05, .5, 35);
    hud.push(() => { titleHUD('LO MISMO QUE SIENTES CUANDO', 'EL ALCOHOL SE EVAPORA', smooth(0, .3, lt), 300); txt('el líquido que se evapora se lleva el calor de tu piel', W / 2, 460, 30, { weight: 300, alpha: smooth(.6, 1, lt) }); });
  } else if (t < TL.grille) {
    // E · el vapor llega al compresor; lo aprieta: +50 °C, más caliente que tu cocina
    const lt = t - TL.vapor; setFridgeX(1); P.mat.size = .05; setPipes(0, 1); const xk = smooth(TL.comp - TL.vapor - .3, TL.comp - TL.vapor + .5, lt); setComp(xk, t); bloomS = .85;
    circuit(t, 1, ['suct', 'evap']); const sq = smooth(TL.squeeze - .2, TL.squeeze + .6, t); if (sq > 0) flow('cond', Math.floor(500 * sq), t, .28, u => u < .12 ? RED : lc(ORA, YEL, smooth(.2, .95, u)), .01, 4000);
    // gas comprimido dentro del cilindro
    for (let i = 0; i < 260 * xk; i++) { const k = ((i + 12000) % P.n) * 4, sd = P.seed; const sp = lerp(.045, .02, sq * (.5 + .5 * Math.sin(t * 9))); const c = lc(VAP, RED, sq);
      P.push(.02 + .05 + (sd[k] - .5) * sp * 2, .2 + (sd[k + 1] - .5) * .05, -.45 + (sd[k + 2] - .5) * .05, c[0], c[1], c[2]); }
    const cT = smooth(TL.comp - TL.vapor - .5, TL.comp - TL.vapor + 1, lt); P.mat.size = lerp(.05, .018, cT); camOrbit(V3(0, lerp(.85, .2, cT), lerp(-.35, -.45, cT)), lerp(3.2, .9, cT), 2.5 + lt * .03, lerp(.18, .25, cT), 35);
    hud.push(() => { titleHUD('ESE VAPOR CARGADO DE CALOR', 'LLEGA AL COMPRESOR', smooth(0, .3, lt) * (1 - smooth(TL.motor - TL.vapor - .1, TL.motor - TL.vapor + .1, lt)), 300);
      titleHUD('EL MOTOR', 'QUE OYES ZUMBAR', smooth(TL.motor - TL.vapor, TL.motor - TL.vapor + .3, lt) * (1 - smooth(TL.squeeze - TL.vapor - .1, TL.squeeze - TL.vapor + .1, lt)), 300);
      bigStat('LO APRIETA TANTO QUE SE CALIENTA A', '+50 °C', 400, smooth(TL.squeeze - TL.vapor, TL.squeeze - TL.vapor + .3, lt) * (1 - smooth(TL.hot - TL.vapor - .1, TL.hot - TL.vapor + .1, lt)), clamp((t - TL.squeeze) / 1.5));
      titleHUD('AHORA ESTÁ MÁS CALIENTE', 'QUE TU COCINA', smooth(TL.hot - TL.vapor, TL.hot - TL.vapor + .3, lt), 300);
      const ha = smooth(TL.hot - TL.vapor + .2, TL.hot - TL.vapor + .6, lt); thermo(W / 2 - 220, 1300, 'GAS', '+50 °C', '#ff8a5a', ha); thermo(W / 2 + 220, 1300, 'COCINA', '+22 °C', '#e3e3e3', ha); });
  } else if (t < TL.liq) {
    // F · la rejilla de atrás suelta el calor: por eso está caliente
    const lt = t - TL.grille; setFridgeX(lerp(1, .3, smooth(TL.back - TL.grille, TL.back - TL.grille + .8, lt))); setPipes(smooth(TL.back - TL.grille, TL.back - TL.grille + .8, lt), lerp(1, .6, smooth(TL.back - TL.grille, TL.back - TL.grille + .8, lt))); setComp(.3, t); bloomS = .85;
    circuit(t, 1, ['cond']); riseHeat(1400, t, -.3, .3, .35, -.42, 1.9, ORA, 3000, smooth(.2, .8, lt));
    camOrbit(V3(0, .95, -.35), lerp(3.4, 3.0, lt / 5), Math.PI + .55 - lt * .05, .15, 35);
    hud.push(() => { callout(SEG.cond.c.getPointAt(.55), 90, -120, 'CONDENSADOR', 'la rejilla de atrás', smooth(.3, .7, lt) * (1 - smooth(TL.back - TL.grille - .2, TL.back - TL.grille, lt)), '#ffb27a');
      titleHUD('PASA POR LA REJILLA', 'Y SUELTA EL CALOR', smooth(0, .3, lt) * (1 - smooth(TL.back - TL.grille - .1, TL.back - TL.grille + .1, lt)), 300);
      titleHUD('POR ESO LA PARTE DE ATRÁS', 'ESTÁ CALIENTE', smooth(TL.back - TL.grille, TL.back - TL.grille + .3, lt), 300); });
  } else if (t < TL.door) {
    // G · vuelve a ser líquido, tubo capilar, pierde presión… helado; una y otra vez
    const lt = t - TL.liq; setFridgeX(1); setPipes(0, 1); setComp(.6, t); bloomS = .85; const wide = smooth(TL.loop - TL.liq - .3, TL.loop - TL.liq + .8, lt);
    circuit(t, 1, wide > .1 ? null : ['cond', 'cap', 'evap']); P.mat.size = lerp(.012, .03, wide);
    if (wide < .9) { camOrbit(V3(lerp(.12, -.2, smooth(TL.cap - TL.liq, TL.cold - TL.liq + .5, lt)), 1.68, -.35), lerp(.75, .55, smooth(0, 3, lt)), 2.6 + lt * .1, .3, 35); P.mat.size = .012; }
    else camOrbit(C0, 4.2, 2.2 + lt * .25, .2, 35);
    hud.push(() => { titleHUD('AL ENFRIARSE', 'VUELVE A SER LÍQUIDO', smooth(0, .3, lt) * (1 - smooth(TL.cap - TL.liq - .1, TL.cap - TL.liq + .1, lt)), 300);
      titleHUD('PASA POR UN', 'TUBO FINÍSIMO', smooth(TL.cap - TL.liq, TL.cap - TL.liq + .3, lt) * (1 - smooth(TL.press - TL.liq - .1, TL.press - TL.liq + .1, lt)), 300);
      titleHUD('PIERDE PRESIÓN…', 'Y VUELVE A ESTAR HELADO', smooth(TL.press - TL.liq, TL.press - TL.liq + .3, lt) * (1 - smooth(TL.loop - TL.liq - .1, TL.loop - TL.liq + .1, lt)), 300);
      thermo(W / 2, 1320, '', '≈ −20 °C', '#7fd4ff', smooth(TL.cold - TL.liq, TL.cold - TL.liq + .3, lt) * (1 - smooth(TL.loop - TL.liq - .1, TL.loop - TL.liq + .1, lt)));
      titleHUD('Y ASÍ,', 'UNA Y OTRA VEZ', smooth(TL.loop - TL.liq, TL.loop - TL.liq + .3, lt), 300); });
  } else if (t < TL.curious) {
    // H · puerta abierta: no enfría la cocina, la calienta
    const lt = t - TL.door; const op = easeInOut(smooth(.1, .8, lt)); doorPivot.rotation.y = -op * 1.7; inLight.intensity = op * 2.5; inner.visible = true; setPipes(.5, .6); setComp(.3, t);
    coldSpill(900, t, op); const wk = smooth(TL.warm - TL.door - .2, TL.warm - TL.door + .6, lt); riseHeat(Math.floor(500 + 1200 * wk), t, -.3, .3, .35, -.42, 2.0, ORA, 3000, .6 + wk * .6);
    for (let i = 0; i < 300 * wk; i++) { const k = ((i + 14000) % P.n) * 4, sd = P.seed; const u = fract(sd[k] + t * .4); const f = Math.sin(u * Math.PI); P.push((sd[k + 1] - .5) * .2, .2 + u * 1.2, -.45 - u * .3, 1.8 * f, .5 * f, .2 * f); }
    P.mat.size = .07; camOrbit(V3(0, .9, 0), lerp(4.6, 5.2, lt / 5), .95 + lt * .03, .25, 35);
    const room = 22 + wk * clamp((lt - (TL.warm - TL.door)) / 2.6) * .8;
    hud.push(() => { titleHUD('DEJAR LA PUERTA ABIERTA', 'NO ENFRÍA LA COCINA', smooth(0, .3, lt) * (1 - smooth(TL.warm - TL.door - .1, TL.warm - TL.door + .1, lt)), 300);
      titleHUD('LA CALIENTA', 'CALOR QUE SACA + EL DEL MOTOR', smooth(TL.warm - TL.door, TL.warm - TL.door + .3, lt), 300);
      thermo(W / 2, 1290, 'COCINA', '+' + room.toFixed(1).replace('.', ',') + ' °C', room > 22.05 ? '#ff8a5a' : '#e3e3e3', smooth(.6, 1, lt)); });
  } else if (t < TL.brand) {
    // I · 1930: Einstein y Szilárd patentan una nevera sin piezas móviles
    const lt = t - TL.curious; const pk = smooth(TL.einstein - TL.curious - .4, TL.einstein - TL.curious + .4, lt);
    if (pk < .5) { setFridgeX(1); setPipes(0, .8); circuit(t, .7); camOrbit(C0, lerp(4.2, 5.5, lt / 2.4), 2.2 + lt * .2, .2, 35); dim = .2; }
    else { const pl = t - TL.einstein; camera.position.set(-30 + .5 - pl * .03, 2.05 - pl * .02, lerp(4.8, 4.0, smooth(0, 6, pl))); camera.lookAt(-30, 2.0, 0); camera.fov = 40; key.intensity = 2.2; }
    hud.push(() => { titleHUD('Y LO MÁS CURIOSO', 'EN 1930…', smooth(0, .3, lt) * (1 - smooth(TL.einstein - TL.curious - .3, TL.einstein - TL.curious, lt)), 300);
      const a2 = smooth(TL.einstein - TL.curious, TL.einstein - TL.curious + .3, lt); titleHUD('ALBERT EINSTEIN PATENTÓ', 'UNA NEVERA', a2 * (1 - smooth(TL.family - TL.curious - .1, TL.family - TL.curious + .1, lt)), 210);
      txt('sin piezas móviles', W / 2, 340, 32, { weight: 300, alpha: a2 * (1 - smooth(TL.family - TL.curious - .1, TL.family - TL.curious + .1, lt)) });
      titleHUD('TRAS LEER QUE UNA FAMILIA', 'MURIÓ POR UNA FUGA DE GAS', smooth(TL.family - TL.curious, TL.family - TL.curious + .3, lt), 210); });
  } else {
    // J · marca
    const lt = t - TL.brand; setFridgeX(1); setPipes(0, .8); circuit(t, .8); camOrbit(C0, 5 + lt * .4, 2.2 + lt * .1, .2, 35); expo = .9; fade = Math.min(.5, lt * .45); dim = smooth(0, .8, lt) * .6;
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  fill.position.copy(camera.position).add(V3(0, 2, 0));
  P.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (dim > 0) hud.unshift(() => { g2.save(); g2.globalAlpha = dim * .7; g2.fillStyle = '#02050b'; g2.fillRect(0, 0, W, H); g2.restore(); });
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
function renderCover() { renderFrame(TL.grille + 1.5); coverText('¿CÓMO ENFRÍA', 'TU NEVERA?', 'No fabrica frío: te roba el calor'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
