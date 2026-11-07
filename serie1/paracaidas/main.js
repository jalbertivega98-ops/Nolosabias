// NO LO SABÍAS — "¿Cómo funciona un paracaídas?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final. Unidades: metros.
// Referencia: paracaídas deportivo ram-air de 9 celdas (~17–20 m², ~7 m de envergadura), extractor (pilot chute) de ~0,9 m,
// slider, velocidad terminal en caída boca abajo ≈ 200 km/h (≈ 55 m/s), apertura a ~1.000 m en ~3 s, vuelo ≈ 40 km/h y ≈ 5 m/s de caída.
// DAA tipo CYPRES (modo experto): abre la reserva si a ~225 m (750 ft) se cae a más de 35 m/s.
// Felix Baumgartner, 14/10/2012: salto desde 38.969 m, velocidad máxima 1.357,6 km/h (Mach 1,25).
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3,
  renderer, g2, camera, SOFT, skyDome, SUN_DIR, Particles, txt, copperGrad, project, fmt, callout, titleHUD, fract, camOrbit, arrowXY, bigStat, drawBrand, coverText, finish } from '../../lib/core.js';

const scene = new THREE.Scene(); scene.add(skyDome); skyDome.renderOrder = -1;
scene.fog = new THREE.FogExp2(new THREE.Color(.62, .55, .52), .00011);
const hemi = new THREE.HemisphereLight(0xbfd4ff, 0x3a3020, .9); scene.add(hemi);
const sunL = new THREE.DirectionalLight(0xffd2a0, 2.6); scene.add(sunL); scene.add(sunL.target);
const fillL = new THREE.DirectionalLight(0xbfd0ff, .6); scene.add(fillL); scene.add(fillL.target);
function lightAt(p) { sunL.position.copy(p).addScaledVector(SUN_DIR.clone().normalize(), 300); sunL.target.position.copy(p); sunL.target.updateMatrixWorld();
  fillL.position.copy(camera.position).add(V3(0, 50, 0)); fillL.target.position.copy(p); fillL.target.updateMatrixWorld(); }
function xray(col) { return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  uniforms: { uCol: { value: col }, uA: { value: 1 } },
  vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform vec3 uCol; uniform float uA; varying vec3 vN; varying vec3 vV; void main(){ float f=pow(clamp(1.-abs(dot(vN,vV)),0.,1.),2.); gl_FragColor=vec4(uCol*(f*.8+.06)*uA,(f*.7+.05)*uA); }` }); }
const xrayMat = xray(new THREE.Color(.3, .7, 1.15));

// ==========================================================================
// TERRENO: llanura de campos con una zona de saltos (pista + diana en el origen)
// ==========================================================================
function hash(x, z) { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, z) { const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi; const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  return lerp(lerp(hash(xi, zi), hash(xi + 1, zi), u), lerp(hash(xi, zi + 1), hash(xi + 1, zi + 1), u), v); }
function Gh(x, z) { const r = Math.hypot(x, z); return ((vnoise(x / 2200, z / 2200) - .5) * 160 + (vnoise(x / 500, z / 500) - .5) * 30) * smooth(300, 1500, r); }
function fieldCol(x, z, c) { const cx = Math.floor((x + z * .35) / 260), cz = Math.floor((z - x * .2) / 190); const h = hash(cx, cz), q = vnoise(x / 40, z / 40);
  const pal = [[.25, .36, .13], [.36, .42, .16], [.52, .46, .22], [.42, .33, .2], [.2, .3, .12], [.58, .52, .28]]; const p = pal[Math.floor(h * pal.length)];
  return c.setRGB(p[0] * (.85 + q * .3), p[1] * (.85 + q * .3), p[2] * (.85 + q * .3)); }
const terrain = (() => { const S = 40000, N = 320; const g = new THREE.PlaneGeometry(S, S, N, N); g.rotateX(-Math.PI / 2); const p = g.attributes.position; const col = []; const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, Gh(x, z) - (Math.hypot(x, z) < 900 ? 3 : 0)); fieldCol(x, z, c); col.push(c.r, c.g, c.b); }
  g.computeVertexNormals(); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95 })); scene.add(m); return m; })();
const pad = (() => { const S = 1600, N = 200; const g = new THREE.PlaneGeometry(S, S, N, N); g.rotateX(-Math.PI / 2); const p = g.attributes.position; const col = []; const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, Gh(x, z)); const r = hash(x * .37, z * .37), q = vnoise(x / 5, z / 5);
    c.setRGB(.3 + r * .05 + q * .07, .43 + r * .06 + q * .08, .16 + q * .04); if (Math.abs(z - 90) < 14 && Math.abs(x) < 600) c.setRGB(.33 + r * .03, .32 + r * .03, .3 + r * .03); col.push(c.r, c.g, c.b); }
  g.computeVertexNormals(); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9 })); scene.add(m); return m; })();
const target = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  for (const [r, col] of [[250, '#e8e2d6'], [200, '#d9632e'], [140, '#e8e2d6'], [80, '#d9632e'], [26, '#e8e2d6']]) { x.fillStyle = col; x.beginPath(); x.arc(256, 256, r, 0, 7); x.fill(); }
  const m = new THREE.Mesh(new THREE.CircleGeometry(14, 64), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(c), roughness: .8, transparent: true }));
  m.rotation.x = -Math.PI / 2; m.position.y = .06; scene.add(m); return m; })();
const hangar = new THREE.Mesh(new THREE.BoxGeometry(40, 12, 26), new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: .6, metalness: .3 })); hangar.position.set(-160, 6, 140); scene.add(hangar);

// ==========================================================================
// PARACAIDISTA (local: y = arriba de la cabeza, x = pecho, z = lado; origen = centro del cuerpo)
// ==========================================================================
const suit = new THREE.MeshStandardMaterial({ color: 0x1d2a3a, roughness: .7 }), acc = new THREE.MeshStandardMaterial({ color: 0xc87a45, roughness: .4, metalness: .3 });
const contMat = new THREE.MeshStandardMaterial({ color: 0x2a2f36, roughness: .6 });
const body = new THREE.Group();
const bodyParts = [];
{ const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.17, .5, 6, 12), suit); torso.position.y = .1; body.add(torso); bodyParts.push(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.13, 20, 14), acc); head.position.set(.02, .62, 0); body.add(head); bodyParts.push(head); }
const cont = new THREE.Group(); cont.position.set(-.24, .12, 0); body.add(cont);
const contMain = new THREE.Mesh(new THREE.BoxGeometry(.13, .3, .36), contMat); contMain.position.y = -.1; cont.add(contMain);
const contRes = new THREE.Mesh(new THREE.BoxGeometry(.13, .2, .36), contMat); contRes.position.y = .16; cont.add(contRes);
const aad = new THREE.Mesh(new THREE.BoxGeometry(.06, .05, .09), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, .5, .2) })); aad.position.set(0, .16, 0); cont.add(aad); aad.visible = false;
const limbs = {};
for (const [k, y, z, len, r] of [['armR', .4, .22, .55, .06], ['armL', .4, -.22, .55, .06], ['legR', -.25, .1, .82, .08], ['legL', -.25, -.1, .82, .08]]) {
  const piv = new THREE.Group(); piv.position.set(0, y, z); const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 8), suit); m.position.y = -len / 2 - r; piv.add(m); body.add(piv); limbs[k] = piv; bodyParts.push(m); }
function setPose(k) { // 0 = caída libre en cruz; 1 = colgado del paracaídas con las manos en los frenos
  limbs.armR.rotation.set(0, 0, 0); limbs.armL.rotation.set(0, 0, 0); limbs.armR.rotation.x = lerp(-1.95, -2.75, k); limbs.armL.rotation.x = lerp(1.95, 2.75, k);
  limbs.armR.rotation.z = lerp(.35, .1, k); limbs.armL.rotation.z = lerp(.35, .1, k);
  limbs.legR.rotation.set(lerp(-.4, -.08, k), 0, lerp(-.5, 0, k)); limbs.legL.rotation.set(lerp(.4, .08, k), 0, lerp(-.5, 0, k)); }
const bodyXray = xray(new THREE.Color(.35, .6, 1.)); let bodyXrayOn = false;
function setBodyXray(k) { if (k === bodyXrayOn) return; bodyXrayOn = k; for (const m of bodyParts) m.material = k ? bodyXray : suit; contMain.material = k ? xray(new THREE.Color(1.3, .6, .25)) : contMat; contRes.material = k ? xray(new THREE.Color(.4, .8, 1.5)) : contMat; aad.visible = k; }

// ==========================================================================
// VELA RAM-AIR de 9 celdas (x = hacia delante, y = arriba, z = envergadura)
// ==========================================================================
const WG = { R: 10, thMax: .37, c0: 2.75, NC: 9, N: 91, M: 48 };
function airfoil(xi) { const t = .16; const yt = 5 * t * (.2969 * Math.sqrt(xi) - .126 * xi - .3516 * xi * xi + .2843 * xi ** 3 - .1036 * xi ** 4); const yc = xi < .35 ? .04 / .1225 * (.7 * xi - xi * xi) : .04 / .4225 * (.3 + 1.3 * xi - xi * xi - .6); return [yc, yt]; }
const wingState = { inf: 1, brakeR: 0, brakeL: 0 };
const wingGeo = new THREE.BufferGeometry(); { const n = WG.N * (WG.M + 1); wingGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3)); const idx = [];
  for (let i = 0; i < WG.N - 1; i++) for (let j = 0; j < WG.M; j++) { const a = i * (WG.M + 1) + j, b = a + WG.M + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); } wingGeo.setIndex(idx);
  const col = []; for (let i = 0; i < WG.N; i++) { const s = i / (WG.N - 1) * 2 - 1; const cell = Math.min(8, Math.floor((s + 1) / 2 * 9)); for (let j = 0; j <= WG.M; j++) { const ph = j / WG.M * Math.PI * 2; const xi = .5 * (1 + Math.cos(ph)); const upper = ph < Math.PI;
    let c = [[.1, .32, .62], [.95, .93, .9], [.82, .42, .2], [.95, .93, .9], [.82, .42, .2], [.95, .93, .9], [.82, .42, .2], [.95, .93, .9], [.1, .32, .62]][cell]; if (!upper) c = c.map(v => v * .7);
    if ((!upper && xi < .08) || xi < .012) c = [.03, .03, .04]; col.push(...c); } } wingGeo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); }
function wingPoint(s, xi, sign, out) { const th = s * WG.thMax; const c = WG.c0 * Math.sqrt(Math.max(.25, 1 - .45 * s * s)); const xo = -(WG.c0 - c) * .3;
  let [yc, yt] = airfoil(xi); const cell = Math.abs(Math.sin(Math.PI * WG.NC * (s + 1) / 2)); yt *= wingState.inf * (.86 + .2 * cell); yc *= lerp(.2, 1, wingState.inf);
  let y = (yc + sign * yt) * c; let x = (.5 - xi) * c + xo;
  const br = s > 0 ? wingState.brakeR : wingState.brakeL; if (br > 0 && xi > .55) y -= br * Math.pow((xi - .55) / .45, 2) * c * .32 * smooth(0, .5, Math.abs(s) + .2);
  out.set(x, -WG.R + WG.R * Math.cos(th) + y * Math.cos(th), WG.R * Math.sin(th) + y * Math.sin(th)); return out; }
function buildWing() { const p = wingGeo.attributes.position, v = V3(); for (let i = 0; i < WG.N; i++) { const s = i / (WG.N - 1) * 2 - 1; for (let j = 0; j <= WG.M; j++) { const ph = j / WG.M * Math.PI * 2; const xi = .5 * (1 + Math.cos(ph)); wingPoint(s, xi, ph < Math.PI ? 1 : -1, v); p.setXYZ(i * (WG.M + 1) + j, v.x, v.y, v.z); } }
  p.needsUpdate = true; wingGeo.computeVertexNormals(); wingGeo.computeBoundingSphere(); }
buildWing();
const sys = new THREE.Group(); scene.add(sys); sys.add(body);
const RIG_Y = 6.4;
const wingRig = new THREE.Group(); sys.add(wingRig);
const wingMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .55, metalness: .05, side: THREE.DoubleSide });
const wing = new THREE.Mesh(wingGeo, wingMat); wingRig.add(wing);
const ribs = new THREE.Group(); wingRig.add(ribs); ribs.visible = false;
{ const v = V3(); const mat = new THREE.LineBasicMaterial({ color: new THREE.Color(.5, 1, 1.8), transparent: true, opacity: .85 }); for (let k = 0; k <= 18; k++) { const s = k / 18 * 2 - 1; const pts = [];
  for (let j = 0; j <= 40; j++) { const ph = j / 40 * Math.PI * 2; const xi = .5 * (1 + Math.cos(ph)); pts.push(wingPoint(s * .999, xi, ph < Math.PI ? 1 : -1, v).clone()); }
  ribs.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat)); } }
// cordinos (con slider): cada uno = anclaje → esquina del slider → elevador del hombro
const lineAnch = []; for (const s of [-.95, -.7, -.45, -.2, .2, .45, .7, .95]) for (const xi of [.08, .33, .6, .88]) lineAnch.push({ s, xi });
const lineGeo = new THREE.BufferGeometry(); lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(lineAnch.length * 12), 3));
const lineMat = new THREE.LineBasicMaterial({ color: new THREE.Color(.85, .85, .8), transparent: true, opacity: .6 }); const lines = new THREE.LineSegments(lineGeo, lineMat); sys.add(lines); lines.frustumCulled = false;
const slider = new THREE.Group(); sys.add(slider);
{ const sm = new THREE.MeshStandardMaterial({ color: 0xe9e4da, roughness: .7, side: THREE.DoubleSide, transparent: true, opacity: .92 }); const pl = new THREE.Mesh(new THREE.PlaneGeometry(.9, 1.0), sm); pl.rotation.x = -Math.PI / 2; slider.add(pl);
  const gm = new THREE.MeshStandardMaterial({ color: 0xc8c8c8, metalness: .9, roughness: .3 }); for (const [x, z] of [[.42, .47], [-.42, .47], [.42, -.47], [-.42, -.47]]) { const r = new THREE.Mesh(new THREE.TorusGeometry(.05, .015, 8, 16), gm); r.rotation.x = Math.PI / 2; r.position.set(x, 0, z); slider.add(r); } }
let sliderY = 0; // altura del slider en coords de sys
const RIS = [V3(-.05, .48, .22), V3(-.05, .48, -.22)]; // elevadores (hombros)
function updateLines() { const p = lineGeo.attributes.position, v = V3(); let k = 0;
  lineAnch.forEach(a => { wingPoint(a.s, a.xi, -1, v); v.multiply(wingRig.scale); v.applyEuler(wingRig.rotation); v.add(wingRig.position);
    const r = a.s > 0 ? RIS[0] : RIS[1]; const c = V3(a.xi < .5 ? .42 : -.42, sliderY, a.s > 0 ? .47 : -.47).applyEuler(slider.rotation);
    c.set(slider.position.x + c.x, sliderY, slider.position.z + c.z);
    p.setXYZ(k++, v.x, v.y, v.z); p.setXYZ(k++, c.x, c.y, c.z); p.setXYZ(k++, c.x, c.y, c.z); p.setXYZ(k++, r.x, r.y, r.z); }); p.needsUpdate = true; lineGeo.computeBoundingSphere(); }
// extractor (pilot chute), bolsa y bridas
const pc = new THREE.Group(); scene.add(pc);
const pcMat = new THREE.MeshStandardMaterial({ color: 0xd9632e, roughness: .6, side: THREE.DoubleSide });
const pcDome = new THREE.Mesh(new THREE.SphereGeometry(.45, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), pcMat); pc.add(pcDome);
const bag = new THREE.Mesh(new THREE.BoxGeometry(.3, .22, .4), new THREE.MeshStandardMaterial({ color: 0x3a3f46, roughness: .6 })); scene.add(bag);
const bridleGeo = new THREE.BufferGeometry().setFromPoints([V3(), V3(), V3()]); const bridle = new THREE.Line(bridleGeo, new THREE.LineBasicMaterial({ color: 0xe8e2d6 })); scene.add(bridle); bridle.frustumCulled = false;
function setBridle(a, b, c) { const p = bridleGeo.attributes.position; p.setXYZ(0, a.x, a.y, a.z); p.setXYZ(1, b.x, b.y, b.z); p.setXYZ(2, c.x, c.y, c.z); p.needsUpdate = true; }
// cúpula redonda "fantasma" (lo que NO es)
const roundGhost = new THREE.Mesh(new THREE.SphereGeometry(4.2, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), xray(new THREE.Color(1.4, .45, .3))); scene.add(roundGhost);
const SW = v => { sys.updateMatrixWorld(true); return sys.localToWorld(v.clone()); };
const BW = v => { sys.updateMatrixWorld(true); return body.localToWorld(v.clone()); };
function placeSys(p, heading = 0, bank = 0, pitch = 0) { sys.position.copy(p); sys.rotation.set(0, 0, 0); sys.rotateY(heading); sys.rotateX(bank); sys.rotateZ(pitch); sys.updateMatrixWorld(true); }
function freefallBody() { body.position.set(0, 0, 0); body.rotation.set(0, 0, -Math.PI / 2); setPose(0); }
function hangBody(sw = 0) { body.position.set(0, 0, 0); body.rotation.set(0, 0, sw); setPose(1); }

// ==========================================================================
// ESTRATOSFERA (Tierra curva; 1 unidad = 106,2 m → radio terrestre 60.000)
// ==========================================================================
const space = new THREE.Scene(); space.background = new THREE.Color(0x01020a);
const SUN = V3(1, .25, .5).normalize();
const earthMat = new THREE.ShaderMaterial({ uniforms: { uSun: { value: SUN } },
  vertexShader: `varying vec3 vP; varying vec3 vN; varying vec3 vW; void main(){ vP=normalize(position); vN=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `uniform vec3 uSun; varying vec3 vP; varying vec3 vN; varying vec3 vW;
    float h3(vec3 p){ p=fract(p*.3183099+.1); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
    float n3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
      return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z); }
    float fbm(vec3 p){ float a=.5,s=0.; for(int i=0;i<6;i++){ s+=a*n3(p); p*=2.03; a*=.5; } return s; }
    void main(){ vec3 n=normalize(vN); float d=dot(n,uSun);
      float c=fbm(vP*40.+vec3(1.7,.3,2.2)); float land=smoothstep(.48,.53,c);
      vec3 ocean=vec3(.02,.09,.2), ground=mix(vec3(.2,.24,.1),vec3(.48,.38,.24),fbm(vP*160.));
      vec3 col=mix(ocean,ground,land); float cl=smoothstep(.55,.8,fbm(vP*90.+vec3(4.,1.,2.)))*.85; col=mix(col,vec3(.95),cl);
      vec3 V=normalize(cameraPosition-vW); vec3 o=col*(.18+1.1*max(d,0.));
      float rim=pow(1.-max(dot(n,V),0.),3.); o+=vec3(.3,.55,1.)*rim*.9; gl_FragColor=vec4(o,1.); }` });
const ES = 60000; const earth = new THREE.Mesh(new THREE.SphereGeometry(ES, 256, 180), earthMat); space.add(earth);
const atmo = new THREE.Mesh(new THREE.SphereGeometry(ES * 1.0025, 200, 120), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide, uniforms: { uSun: { value: SUN } },
  vertexShader: `varying vec3 vN; varying vec3 vW; void main(){ vN=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `uniform vec3 uSun; varying vec3 vN; varying vec3 vW; void main(){ vec3 V=normalize(cameraPosition-vW); float f=pow(1.-abs(dot(normalize(vN),V)),5.)*1.6; gl_FragColor=vec4(vec3(.3,.6,1.)*f,f); }` })); space.add(atmo);
const stars = (() => { const n = 4000, p = new Float32Array(n * 3), c = new Float32Array(n * 3); const r = rng(12); for (let i = 0; i < n; i++) { const v = V3(r() - .5, Math.abs(r() - .5) + .05, r() - .5).normalize().multiplyScalar(200000); p.set([v.x, v.y, v.z], i * 3); const k = .3 + r() * .8; c.set([k, k, k * 1.1], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ size: 1.5, sizeAttenuation: false, vertexColors: true, map: SOFT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); })(); space.add(stars);
const spHemi = new THREE.HemisphereLight(0xbfd4ff, 0x203040, .7); space.add(spHemi); const spSun = new THREE.DirectionalLight(0xfff2e0, 2.8); spSun.position.copy(SUN).multiplyScalar(100); space.add(spSun);
const capsule = new THREE.Group(); space.add(capsule);
{ const m = new THREE.MeshStandardMaterial({ color: 0xd8d8d0, roughness: .4, metalness: .4 }); const sph = new THREE.Mesh(new THREE.SphereGeometry(2.4, 32, 20), m); sph.position.y = 1.2; capsule.add(sph);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, .5, 32), m); capsule.add(ring); const step = new THREE.Mesh(new THREE.BoxGeometry(1.6, .12, 1.2), m); step.position.set(2.9, -.1, 0); capsule.add(step);
  const door = new THREE.Mesh(new THREE.CircleGeometry(.9, 24), new THREE.MeshBasicMaterial({ color: 0x050505 })); door.position.set(2.3, 1.2, 0); door.rotation.y = Math.PI / 2; capsule.add(door); }
const machCone = new THREE.Mesh(new THREE.ConeGeometry(2.2, 5, 40, 1, true), xray(new THREE.Color(.7, .9, 1.6))); space.add(machCone);

const P = new Particles(12000, { size: .1, seed: 5 }); scene.add(P.obj);
const AIR = [.4, .85, 1.6], WARM = [1.5, .7, .25];

// ==========================================================================
// HUD
// ==========================================================================
function stamp(s, x, y, a, rot = -.1, col = '#ff6a4a') { if (a <= .01) return; const sc = lerp(1.6, 1, easeOut(clamp(a * 1.4)));
  g2.save(); g2.translate(x, y); g2.rotate(rot); g2.scale(sc, sc); g2.globalAlpha = clamp(a); g2.strokeStyle = col; g2.lineWidth = 8; g2.shadowColor = col; g2.shadowBlur = 25;
  g2.font = '800 92px Montserrat'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.letterSpacing = '6px'; const w = g2.measureText(s).width + 70; g2.strokeRect(-w / 2, -70, w, 140); g2.fillStyle = col; g2.fillText(s, 0, 4); g2.restore(); }
function panel(label, value, x, y, a, col = '#fff', w = 360) { if (a <= .01) return; g2.save(); g2.globalAlpha = a * .55; g2.fillStyle = '#05080d'; g2.fillRect(x - 20, y - 62, w, 150); g2.restore();
  txt(label, x, y - 32, 20, { align: 'left', spacing: 6, alpha: a * .85, fill: '#e3a372' }); txt(value, x, y + 30, 58, { align: 'left', font: 'Montserrat', weight: 800, alpha: a, fill: col }); }
const kmh = v => fmt(v) + ' km/h';
function areaBoxes(a) { if (a <= .01) return; const cx = W / 2, y = 1530; const s1 = 70, s2 = 70 * Math.sqrt(20 / .7) * .62;
  g2.save(); g2.globalAlpha = a; g2.lineWidth = 4; g2.strokeStyle = '#7fd4ff'; g2.shadowColor = '#7fd4ff'; g2.shadowBlur = 14; g2.strokeRect(cx - 330, y - s1 / 2, s1, s1);
  const k = easeOut(smooth(.2, 1, a)); g2.strokeStyle = '#ffb27a'; g2.shadowColor = '#ffb27a'; g2.fillStyle = 'rgba(255,178,122,.12)'; g2.fillRect(cx - 40, y - s2 * k / 2, s2 * k * 1.35, s2 * k); g2.strokeRect(cx - 40, y - s2 * k / 2, s2 * k * 1.35, s2 * k); g2.restore();
  txt('TU CUERPO', cx - 295, y + 80, 24, { spacing: 4, alpha: a, fill: '#7fd4ff' }); txt('≈ 0,7 m²', cx - 295, y + 118, 30, { font: 'Montserrat', weight: 800, alpha: a });
  txt('PARACAÍDAS', cx - 40 + s2 * 1.35 / 2, y + s2 / 2 + 40, 24, { spacing: 4, alpha: a * k, fill: '#ffb27a' }); txt('≈ 20 m²', cx - 40 + s2 * 1.35 / 2, y + s2 / 2 + 80, 34, { font: 'Montserrat', weight: 800, alpha: a * k }); }
function speedGraph(tau, vt, a) { if (a <= .01) return; const x0 = 140, y0 = 1700, w = 800, h = 260, T = 14;
  g2.save(); g2.globalAlpha = a * .55; g2.fillStyle = '#05080d'; g2.fillRect(x0 - 40, y0 - h - 70, w + 90, h + 120); g2.restore();
  g2.save(); g2.globalAlpha = a; g2.strokeStyle = 'rgba(255,255,255,.6)'; g2.lineWidth = 2; g2.beginPath(); g2.moveTo(x0, y0 - h); g2.lineTo(x0, y0); g2.lineTo(x0 + w, y0); g2.stroke();
  g2.setLineDash([10, 8]); g2.strokeStyle = '#7fd4ff'; g2.beginPath(); g2.moveTo(x0, y0 - h * .92); g2.lineTo(x0 + w, y0 - h * .92); g2.stroke(); g2.setLineDash([]);
  g2.strokeStyle = '#e3a372'; g2.lineWidth = 6; g2.shadowColor = '#e3a372'; g2.shadowBlur = 14; g2.beginPath(); const tt = Math.min(tau, T);
  for (let i = 0; i <= 120; i++) { const u = tt * i / 120; const v = Math.tanh(9.81 * u / vt); const x = x0 + u / T * w, y = y0 - v * h * .92; i ? g2.lineTo(x, y) : g2.moveTo(x, y); } g2.stroke();
  const v = Math.tanh(9.81 * tt / vt); g2.fillStyle = '#ffe2c0'; g2.beginPath(); g2.arc(x0 + tt / T * w, y0 - v * h * .92, 10, 0, 7); g2.fill(); g2.restore();
  txt('VELOCIDAD', x0, y0 - h - 40, 20, { align: 'left', spacing: 6, alpha: a * .8, fill: '#e3a372' }); txt('200 km/h', x0 + w - 6, y0 - h * .92 - 26, 24, { align: 'right', font: 'Montserrat', weight: 800, alpha: a, fill: '#7fd4ff' });
  txt('TIEMPO →', x0 + w, y0 + 26, 18, { align: 'right', spacing: 4, alpha: a * .6 }); }
function altBarKm(alt, a) { if (a <= .01) return; const x = 960, y0 = 1650, y1 = 300, top = 40000; g2.save(); g2.globalAlpha = a * .8; g2.strokeStyle = '#e3a372'; g2.lineWidth = 3;
  g2.beginPath(); g2.moveTo(x, y0); g2.lineTo(x, y1); g2.stroke(); for (let m = 0; m <= top; m += 5000) { const y = lerp(y0, y1, m / top); g2.beginPath(); g2.moveTo(x - (m % 10000 ? 14 : 26), y); g2.lineTo(x, y); g2.stroke(); if (m % 10000 === 0) txt(m / 1000 + ' km', x - 40, y, 22, { align: 'right', weight: 300, alpha: a * .7 }); } g2.restore();
  for (const [h, s] of [[8849, 'EVEREST'], [11000, 'AVIONES']]) { const ye = lerp(y0, y1, h / top); g2.save(); g2.globalAlpha = a * .8; g2.strokeStyle = '#7fd4ff'; g2.setLineDash([8, 8]); g2.lineWidth = 2; g2.beginPath(); g2.moveTo(700, ye); g2.lineTo(x, ye); g2.stroke(); g2.restore(); txt(s, 690, ye, 20, { align: 'right', spacing: 4, alpha: a * .85, fill: '#7fd4ff' }); }
  const yy = lerp(y0, y1, clamp(alt / top)); g2.save(); g2.globalAlpha = a; g2.fillStyle = '#ffe2c0'; g2.shadowColor = '#ffb070'; g2.shadowBlur = 20; g2.beginPath(); g2.moveTo(x - 8, yy); g2.lineTo(x - 34, yy - 14); g2.lineTo(x - 34, yy + 14); g2.fill(); g2.restore();
  txt(fmt(alt) + ' m', x - 46, yy, 36, { align: 'right', font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(500, 920, yy, .5) }); }
function machBar(v, a) { if (a <= .01) return; const x0 = 120, y = 1560, w = 700, top = 1500; g2.save(); g2.globalAlpha = a * .3; g2.fillStyle = '#fff'; g2.fillRect(x0, y, w, 18); g2.globalAlpha = a;
  const gr = g2.createLinearGradient(x0, 0, x0 + w, 0); gr.addColorStop(0, '#a85a2c'); gr.addColorStop(1, '#ffe2c0'); g2.fillStyle = gr; g2.fillRect(x0, y, w * clamp(v / top), 18);
  const xs = x0 + w * 1100 / top; g2.strokeStyle = '#7fd4ff'; g2.lineWidth = 4; g2.shadowColor = '#7fd4ff'; g2.shadowBlur = 14; g2.beginPath(); g2.moveTo(xs, y - 30); g2.lineTo(xs, y + 48); g2.stroke(); g2.restore();
  txt('SONIDO ≈ 1.100', xs, y + 76, 22, { spacing: 3, alpha: a, fill: '#7fd4ff' }); txt('VELOCIDAD', x0, y - 90, 20, { align: 'left', spacing: 6, alpha: a * .85, fill: '#e3a372' });
  txt(kmh(v), x0, y - 36, 62, { align: 'left', font: 'Montserrat', weight: 800, alpha: a, fill: v > 1100 ? copperGrad(x0, x0 + 500, y - 36, .5) : '#fff' }); }

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
// lluvia de partículas que "suben" alrededor del cuerpo (aire que pasa)
function airStream(c, n, v, t, spread, col, len = 30) { for (let i = 0; i < n; i++) { const s = P.seed, k = i * 4; const age = fract(s[k] + t * v / len); const a = s[k + 1] * 6.283, r = 1.2 + Math.sqrt(s[k + 2]) * spread;
  const f = Math.sin(age * Math.PI) * .7; P.push(c.x + Math.cos(a) * r, c.y - len / 2 + age * len, c.z + Math.sin(a) * r, col[0] * f, col[1] * f, col[2] * f); } }
// planeo y aproximación: posición a partir del final (toma de tierra en el origen)
function landPath(u, T) { const uf = T - 4.4; let x = 0, y = 0; const st = 160; for (let i = 0; i < st; i++) { const a = lerp(u, T, (i + .5) / st); const k = smooth(uf, T - .4, a);
  x += lerp(11, 1.2, k) * (T - u) / st; y += lerp(5, .15, k) * (T - u) / st; } return V3(-x - 1.5, y + 1.05, 0); }
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .2; camera.far = 50000; camera.fov = 40;
  let bloomS = .5, flash = 0, ca = .0013, fade = 0, grain = .035, expo = 1, focus, sc = scene;
  P.begin(); P.mat.size = .1; scene.add(sys); scene.add(P.obj); sys.scale.setScalar(1); sys.visible = true; wingRig.visible = true; lines.visible = true; slider.visible = true; pc.visible = false; bag.visible = false; bridle.visible = false; roundGhost.visible = false;
  wing.material = wingMat; ribs.visible = false; wingState.inf = 1; wingState.brakeR = wingState.brakeL = 0; wingRig.position.set(0, RIG_Y, 0); wingRig.rotation.set(0, 0, 0); wingRig.scale.set(1, 1, 1); sliderY = 1.0; slider.position.set(0, 0, 0); slider.rotation.set(0, 0, 0);
  hangBody(0); setBodyXray(false); lineMat.opacity = .6; scene.fog.density = .00011; machCone.visible = false; capsule.visible = true;
  for (const c of ['how', 'why', 'area', 'pilot', 'rip', 'look', 'fwd', 'land', 'fail', 'crazy', 'boom', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];

  if (t < TL.slow) {
    // A · gancho: caída libre a 200 km/h
    const lt = t; const p = V3(0, 3600 - lt * 55, 0); placeSys(p, .4); freefallBody(); wingRig.visible = lines.visible = slider.visible = false; focus = p.clone();
    camOrbit(focus, lerp(4.2, 5.2, lt / 3), .4 + Math.PI * .5 + lerp(-.6, -.35, lt / 3), lerp(.5, .35, lt / 3), 50); camera.position.add(V3(Math.sin(t * 31) * .02, Math.sin(t * 27) * .02, 0)); fade = 1 - smooth(0, .3, t);
    airStream(p, 900, 55, t, 5, [.7, .75, .8], 26); P.mat.size = .05; ca = .0028;
    hud.push(() => { bigStat('CAYENDO A', '200 km/h', 430, smooth(0, .25, lt), .3 + lt * .3); });
  } else if (t < TL.how) {
    // A2 · en tres segundos un trozo de tela te deja a veinte
    const lt = t - TL.slow; const o = smooth(0, 1.6, lt); const p = V3(0, 1500 - lt * 8, 0); placeSys(p, .4); hangBody(Math.sin(t * 1.5) * .05);
    wingState.inf = lerp(.3, 1, o); wingRig.scale.set(lerp(.6, 1, o), lerp(.7, 1, o), lerp(.3, 1, o)); sliderY = lerp(5.8, 1.0, smooth(.3, 2.2, lt)); slider.position.y = sliderY;
    focus = p.clone().add(V3(0, 3.5, 0)); camOrbit(focus, lerp(16, 19, lt / 2.7), .4 + Math.PI * .5 - .9, lerp(-.35, -.25, lt / 2.7), 45); camera.position.add(V3(Math.sin(t * 25) * .05 * (1 - o), 0, 0));
    const v = lerp(200, 20, easeOut(smooth(0, 2.6, lt)));
    hud.push(() => { bigStat('EN 3 SEGUNDOS', kmh(v), 430, 1, .5); });
  } else if (t < TL.area) {
    // B · velocidad terminal: el freno del aire crece con el cuadrado de la velocidad
    const lt = t - TL.how; const tau = Math.max(0, (t - TL.why) * 1.0); const vt = 55.6; const v = vt * Math.tanh(9.81 * tau / vt); const p = V3(0, 3800, 0); placeSys(p, .3); freefallBody(); wingRig.visible = lines.visible = slider.visible = false;
    focus = p.clone(); camOrbit(focus, lerp(6.5, 7.5, lt / 15), .3 + Math.PI * .5 - 1.35, .08, 45); camera.position.add(V3(0, Math.sin(t * 29) * .015 * v / vt, 0)); ca = .0018;
    airStream(p, 1200, Math.max(4, v), t, 6, [.6, .7, .85], 28); P.mat.size = .05;
    hud.push(() => { const c = project(p); const kD = Math.pow(v / vt, 2); const aA = smooth(TL.drag - TL.how, TL.drag - TL.how + .4, lt);
      arrowXY(c.x - 120, c.y + 80, c.x - 120, c.y + 80 + 300, aA, '#ffb27a', 14); txt('PESO', c.x - 120, c.y + 430, 26, { font: 'Montserrat', weight: 800, alpha: aA, fill: '#ffb27a' });
      arrowXY(c.x + 120, c.y - 80, c.x + 120, c.y - 80 - 300 * Math.max(kD, .02), aA, '#7fd4ff', 14); txt('FRENO DEL AIRE', c.x + 120, c.y - 120 - 300 * Math.max(kD, .02) - 30, 26, { font: 'Montserrat', weight: 800, alpha: aA, fill: '#7fd4ff' });
      txt('¿POR QUÉ NO CAES', W / 2, 300, 48, { font: 'Montserrat', weight: 800, alpha: smooth(TL.why - TL.how, TL.why - TL.how + .3, lt) * (1 - smooth(TL.drag - TL.how - .1, TL.drag - TL.how + .2, lt)) });
      txt('CADA VEZ MÁS RÁPIDO?', W / 2, 360, 48, { font: 'Montserrat', weight: 800, alpha: smooth(TL.why - TL.how, TL.why - TL.how + .3, lt) * (1 - smooth(TL.drag - TL.how - .1, TL.drag - TL.how + .2, lt)) });
      bigStat('AL DOBLE DE VELOCIDAD', '×4 FRENO', 430, smooth(TL.sq - TL.how, TL.sq - TL.how + .3, lt) * (1 - smooth(TL.term - TL.how - .1, TL.term - TL.how + .2, lt)), .5);
      titleHUD('A 200 km/h EL FRENO', 'IGUALA TU PESO', smooth(TL.term - TL.how + .2, TL.term - TL.how + .6, lt) * (1 - smooth(TL.tv - TL.how - .2, TL.tv - TL.how, lt)), 330);
      titleHUD('DEJAS DE ACELERAR', 'VELOCIDAD TERMINAL', smooth(TL.tv - TL.how, TL.tv - TL.how + .3, lt), 330);
      speedGraph(tau, vt, smooth(TL.drag - TL.how + .3, TL.drag - TL.how + .8, lt)); });
  } else if (t < TL.pilot) {
    // C · hace falta mucha más superficie
    const lt = t - TL.area; const p = V3(0, 3000, 0); placeSys(p, .3); freefallBody(); wingRig.visible = lines.visible = slider.visible = false;
    focus = p.clone(); camera.position.copy(p).add(V3(.6, -lerp(5.5, 7, lt / 4), 1.2)); camera.lookAt(focus); camera.fov = 48; camera.up.set(1, 0, 0); camera.lookAt(focus);
    airStream(p, 800, 55, t, 6, [.6, .7, .85], 28); P.mat.size = .05;
    hud.push(() => { titleHUD('PARA FRENAR', 'NECESITAS SUPERFICIE', smooth(.2, .6, lt), 330); areaBoxes(smooth(TL.area + .8, TL.area + 1.6, t)); });
  } else if (t < TL.rip) {
    // D · a 1.000 m: el extractor arrastra fuera al principal
    const lt = t - TL.pilot; const p = V3(0, 1000, 0); placeSys(p, .3); freefallBody(); wingRig.visible = lines.visible = slider.visible = false;
    const thr = smooth(TL.pc - .4, TL.pc + .2, t); limbs.armR.rotation.x = lerp(-1.95, -.4, thr); limbs.armR.rotation.z = lerp(.35, -1.2, thr);
    const back = BW(V3(-.32, -.05, 0)); const up = V3(0, 1, 0);
    const pr = smooth(TL.pc, TL.pc + 1.0, t); const pcPos = back.clone().add(V3(.5 * (1 - pr), 0, .9 * (1 - pr))).addScaledVector(up, lerp(.3, 5.5, easeOut(pr)) + smooth(TL.pcpull, TL.rip, t) * 3);
    const bg = smooth(TL.pcpull, TL.pcpull + 1.4, t); const bagPos = back.clone().addScaledVector(up, lerp(.05, 4.2, easeOut(bg)));
    if (t > TL.pc - .1) { pc.visible = true; pc.position.copy(pcPos); pc.scale.setScalar(lerp(.35, 1, smooth(TL.pc, TL.pc + .5, t))); bridle.visible = true; bag.visible = true; bag.position.copy(bagPos); setBridle(back, bagPos, pcPos); }
    if (bg > 0) { lines.visible = true; const pl = lineGeo.attributes.position; let k = 0; const b2 = sys.worldToLocal(bagPos.clone()); const r0 = sys.worldToLocal(BW(V3(-.2, .35, .2))), r1 = sys.worldToLocal(BW(V3(-.2, .35, -.2)));
      lineAnch.forEach((a, i) => { const r = a.s > 0 ? r0 : r1; for (const q of [b2, b2, r, r]) pl.setXYZ(k++, q.x + (a.s * .1), q.y, q.z + a.xi * .05); }); pl.needsUpdate = true; }
    focus = p.clone().add(V3(0, lerp(.5, 2.2, smooth(TL.pc, TL.rip, t)), 0)); camOrbit(focus, lerp(4.5, 9, smooth(TL.pilot, TL.rip, t)), .3 + Math.PI * .5 - 1.1, .12, 45);
    airStream(p, 700, 55, t, 6, [.6, .7, .85], 28); P.mat.size = .05;
    hud.push(() => { panel('ALTÍMETRO', '1.000 m', 80, 1560, smooth(0, .3, lt), '#fff');
      callout(pcPos, 90, -160, 'EXTRACTOR', 'un paracaídas diminuto', smooth(TL.pc - TL.pilot + .3, TL.pc - TL.pilot + .7, lt));
      titleHUD('A 1.000 METROS', 'SUELTAS UNA BOLSA', smooth(.2, .6, lt) * (1 - smooth(TL.pcpull - TL.pilot - .2, TL.pcpull - TL.pilot, lt)), 330);
      titleHUD('ARRASTRA FUERA', 'AL PARACAÍDAS GRANDE', smooth(TL.pcpull - TL.pilot, TL.pcpull - TL.pilot + .4, lt), 330); });
    if (t > TL.pc - .1 && lines.visible) { /* líneas ya escritas */ }
  } else if (t < TL.look) {
    // E · el slider frena la apertura: unos 3 segundos
    const lt = t - TL.rip; const p = V3(0, 980 - lt * 5, 0); const o = smooth(TL.slide - .4, TL.three + .4, t); const rot = smooth(0, 1.6, lt);
    placeSys(p, .3); body.rotation.set(0, 0, lerp(-Math.PI / 2, 0, easeInOut(rot))); setPose(rot);
    wingState.inf = lerp(.12, 1, o); wingRig.scale.set(lerp(.45, 1, o), lerp(.6, 1, o), lerp(.16, 1, o)); wingRig.position.y = lerp(RIG_Y + .6, RIG_Y, o);
    sliderY = lerp(5.9, 1.0, easeInOut(smooth(TL.slide, TL.three + .6, t))); slider.position.y = sliderY; slider.scale.setScalar(1);
    const top = SW(V3(0, wingRig.position.y + .4, 0)); pc.visible = true; pc.scale.setScalar(.9); pc.position.copy(top).add(V3(0, 3.2, 0)); bridle.visible = true; setBridle(top, top.clone().add(V3(0, 1.6, 0)), pc.position);
    const sl = smooth(TL.slider - .2, TL.slider + .4, t);
    focus = SW(V3(0, lerp(5.2, 3.6, o), 0)); camOrbit(focus, lerp(18, 15, lt / 9), .3 + Math.PI * .5 - lerp(1.2, .9, lt / 9), lerp(-.15, .05, lt / 9), 45); camera.position.add(V3(Math.sin(t * 23) * .04 * (1 - o), 0, 0));
    airStream(p.clone().add(V3(0, 3, 0)), 700, lerp(40, 6, o), t, 7, [.6, .7, .85], 30); P.mat.size = .05;
    hud.push(() => { txt('¿Y POR QUÉ NO TE PARTE', W / 2, 300, 46, { font: 'Montserrat', weight: 800, alpha: smooth(0, .3, lt) * (1 - smooth(TL.slider - TL.rip - .1, TL.slider - TL.rip + .2, lt)) });
      txt('EN DOS AL ABRIRSE?', W / 2, 360, 46, { font: 'Montserrat', weight: 800, alpha: smooth(0, .3, lt) * (1 - smooth(TL.slider - TL.rip - .1, TL.slider - TL.rip + .2, lt)) });
      callout(SW(V3(.42, sliderY, .47)), 80, -150, 'SLIDER', 'frena la apertura', sl);
      titleHUD('SE HINCHA', 'POCO A POCO', smooth(TL.slide - TL.rip + .2, TL.slide - TL.rip + .6, lt) * (1 - smooth(TL.three - TL.rip - .2, TL.three - TL.rip, lt)), 330);
      bigStat('APERTURA', (Math.min(3, Math.max(0, t - TL.slide))).toFixed(1).replace('.', ',') + ' s', 430, smooth(TL.three - TL.rip, TL.three - TL.rip + .3, lt), .5); });
  } else if (t < TL.fwd) {
    // F · no es una cúpula redonda: es un ala de celdas
    const lt = t - TL.look; const p = V3(lt * 11, 900 - lt * 5, 0); placeSys(p, 0); hangBody(Math.sin(t * 1.3) * .04);
    const gh = smooth(.2, .6, lt) * (1 - smooth(TL.wing - TL.look - .3, TL.wing - TL.look + .1, lt)); roundGhost.visible = gh > .01; roundGhost.position.copy(SW(V3(0, 3.0, 0))); roundGhost.material.uniforms.uA.value = gh;
    const xr = smooth(TL.wing - .2, TL.wing + .2, t); if (xr > .5) { wing.material = xrayMat; ribs.visible = true; bloomS = .7; }
    if (xr > .5) { const v = V3(); for (let i = 0; i < 2200; i++) { const s = P.seed, k = i * 4; const ss = s[k + 1] * 2 - 1, age = fract(s[k] + t * .5); wingPoint(ss, .04 + age * .85, s[k + 2] > .5 ? .5 : -.5, v); v.add(wingRig.position); const w = SW(v); const f = .5; P.push(w.x, w.y, w.z, AIR[0] * f, AIR[1] * f, AIR[2] * f); } P.mat.size = .1; }
    focus = SW(V3(0, 4.2, 0)); camOrbit(focus, lerp(15, 13, lt / 5.6), -2.25, lerp(.25, .38, lt / 5.6), 45);
    hud.push(() => { titleHUD('Y FÍJATE: NO ES', 'UNA CÚPULA REDONDA', smooth(.1, .4, lt) * (1 - smooth(TL.wing - TL.look - .2, TL.wing - TL.look, lt)), 330);
      stamp('NO', W / 2, 760, smooth(.6, .9, lt) * (1 - smooth(TL.wing - TL.look - .3, TL.wing - TL.look, lt)), -.12);
      titleHUD('ES UN ALA', 'COMO LA DE UN PARAPENTE', smooth(TL.wing - TL.look + .1, TL.wing - TL.look + .5, lt), 330);
      if (xr > .5) callout(SW(V3(.6, RIG_Y + .3, -1.2)), -60, 320, '9 CELDAS', 'que se hinchan con el aire', smooth(TL.wing - TL.look + 1.2, TL.wing - TL.look + 1.6, lt)); });
  } else if (t < TL.land) {
    // G · vuela hacia delante: ~40 km/h, baja ~5 m/s
    const lt = t - TL.fwd; const p = V3(-900 + lt * 11, 700 - lt * 5, -300); placeSys(p, 0); hangBody(Math.sin(t * 1.3) * .04); focus = SW(V3(0, 3.4, 0));
    camOrbit(focus, lerp(30, 34, lt / 5.6), -Math.PI / 2 + .3, .05, 42);
    for (let i = 0; i < 700; i++) { const a = i / 700 * 6; const q = V3(-900 + (lt - a) * 11, 700 - (lt - a) * 5 + 3.4, -300); const f = (1 - i / 700) * .25; P.push(q.x, q.y, q.z, 1.2 * f, .7 * f, .35 * f); } P.mat.size = .6;
    hud.push(() => { const c = project(focus); const a1 = smooth(.3, .7, lt), a2 = smooth(TL.sink - TL.fwd, TL.sink - TL.fwd + .4, lt);
      arrowXY(c.x + 140, c.y + 40, c.x + 420, c.y + 40, a1, '#ffb27a', 12); txt('40 km/h', c.x + 300, c.y - 10, 40, { font: 'Montserrat', weight: 800, alpha: a1, fill: '#ffb27a' });
      arrowXY(c.x - 60, c.y + 180, c.x - 60, c.y + 360, a2, '#7fd4ff', 12); txt('5 m/s', c.x - 90, c.y + 280, 40, { align: 'right', font: 'Montserrat', weight: 800, alpha: a2, fill: '#7fd4ff' });
      titleHUD('NO SOLO CAE', 'VUELA HACIA DELANTE', smooth(.1, .5, lt), 330); });
  } else if (t < TL.fail) {
    // H · la recogida (flare): frenos a fondo, el ala casi se para
    const lt = t - TL.land; const T = TL.step - TL.land; const u = Math.min(lt, T); const p = landPath(u, T); const fl = smooth(TL.flare + .4, TL.flare + 1.6, t) * (1 - smooth(TL.step + .6, TL.step + 2, t) * .3);
    wingState.brakeR = wingState.brakeL = fl; placeSys(p, 0, 0, fl * .14); hangBody(fl * .12); limbs.armR.rotation.x = lerp(-2.75, -.5, fl); limbs.armL.rotation.x = lerp(2.75, .5, fl);
    if (lt > T) { const d = lt - T; limbs.legR.rotation.x = -.08; wingRig.rotation.z = smooth(.2, 2, d) * .5; wingState.inf = lerp(1, .5, smooth(.4, 2, d)); }
    focus = SW(V3(0, 2.8, 0)); camera.position.set(p.x * .8 + 3, Math.max(2.2, p.y * .45 + 2), 27); camera.lookAt(focus); camera.fov = 42;
    const vx = lerp(11, 1.2, smooth(T - 4.4, T - .4, u)), vy = lerp(5, .15, smooth(T - 4.4, T - .4, u)); const done = lt > T;
    hud.push(() => { txt('¿Y CÓMO ATERRIZAS', W / 2, 300, 46, { font: 'Montserrat', weight: 800, alpha: smooth(0, .3, lt) * (1 - smooth(TL.flare - TL.land - .1, TL.flare - TL.land + .2, lt)) });
      txt('SIN ROMPERTE LOS TOBILLOS?', W / 2, 360, 46, { font: 'Montserrat', weight: 800, alpha: smooth(0, .3, lt) * (1 - smooth(TL.flare - TL.land - .1, TL.flare - TL.land + .2, lt)) });
      titleHUD('JUSTO ANTES DEL SUELO', 'LOS DOS FRENOS A FONDO', smooth(TL.flare - TL.land, TL.flare - TL.land + .4, lt) * (1 - smooth(TL.lift - TL.land - .2, TL.lift - TL.land, lt)), 330);
      titleHUD('VELOCIDAD → SUSTENTACIÓN', 'CASI SE PARA', smooth(TL.lift - TL.land, TL.lift - TL.land + .4, lt) * (1 - smooth(TL.step - TL.land - .2, TL.step - TL.land, lt)), 330);
      titleHUD('COMO BAJAR', 'UN ESCALÓN', smooth(TL.step - TL.land, TL.step - TL.land + .3, lt), 330);
      panel('HACIA DELANTE', done ? '0 km/h' : Math.round(vx * 3.6) + ' km/h', 80, 1560, smooth(.3, .7, lt), '#ffb27a', 400); panel('BAJANDO', done ? '0 m/s' : vy.toFixed(1).replace('.', ',') + ' m/s', 560, 1560, smooth(.3, .7, lt), '#7fd4ff', 400); });
  } else if (t < TL.crazy) {
    // I · reserva y DAA: corta un lazo a 225 m
    const lt = t - TL.fail; const alt = Math.max(225, 225 + (TL.cut - t) * 55.6); const p = V3(0, alt + 400, 0); placeSys(p, .3); freefallBody(); wingRig.visible = lines.visible = slider.visible = false;
    const xr = smooth(TL.reserve - .3, TL.reserve + .2, t) > .5; setBodyXray(xr); if (xr) bloomS = .75;
    const fire = smooth(TL.cut, TL.cut + .9, t); if (t > TL.cut) { pc.visible = true; pc.scale.setScalar(.8); const top = BW(V3(-.3, .3, 0)); pc.position.copy(top).add(V3(0, easeOut(fire) * 4.5, 0)); bridle.visible = true; setBridle(top, top.clone().lerp(pc.position, .5), pc.position); flash = Math.max(flash, flashAt(t, TL.cut, .3, .5)); }
    focus = BW(V3(-.25, .1, 0)); const zm = smooth(TL.aad - .3, TL.aad + .8, t) * (1 - smooth(TL.cut - .2, TL.cut + .6, t) * .6);
    camOrbit(focus, lerp(4.8, 2.4, zm), .3 + Math.PI * .5 - 2.5 + lt * .03, lerp(.7, .9, zm), 45); camera.up.set(1, 0, 0); camera.lookAt(focus);
    airStream(p, 700, 55, t, 5, [.6, .7, .85], 26); P.mat.size = .05;
    const blink = (Math.sin(t * 12) > 0 ? 1 : .4); aad.material.color.setRGB(1.6 * blink, .5 * blink, .2 * blink);
    hud.push(() => { stamp('¿Y SI NO SE ABRE?', W / 2, 360, smooth(0, .25, lt) * (1 - smooth(TL.reserve - TL.fail - .2, TL.reserve - TL.fail, lt)), -.06);
      callout(BW(V3(-.3, .28, .2)), 90, -220, 'RESERVA', 'un segundo paracaídas', smooth(TL.reserve - TL.fail + .3, TL.reserve - TL.fail + .7, lt) * (1 - smooth(TL.aad - TL.fail - .1, TL.aad - TL.fail + .2, lt)));
      callout(BW(V3(-.3, .28, 0)), -90, 230, 'ORDENADOR', 'vigila altura y velocidad', smooth(TL.aad - TL.fail + .4, TL.aad - TL.fail + .8, lt) * (1 - smooth(TL.cut - TL.fail + .8, TL.cut - TL.fail + 1.2, lt)));
      const aP = smooth(TL.aad - TL.fail + .6, TL.aad - TL.fail + 1, lt); panel('ALTURA', fmt(alt) + ' m', 80, 1560, aP, alt <= 226 ? '#ff6a4a' : '#fff', 400); panel('VELOCIDAD', '200 km/h', 560, 1560, aP, '#fff', 400);
      titleHUD('SI A 225 m SIGUES', 'CAYENDO A TODA VELOCIDAD', smooth(TL.m225 - TL.fail, TL.m225 - TL.fail + .4, lt) * (1 - smooth(TL.cut - TL.fail - .2, TL.cut - TL.fail, lt)), 300);
      titleHUD('CORTA UN LAZO', 'Y LA ABRE SOLO', smooth(TL.cut - TL.fail + .1, TL.cut - TL.fail + .5, lt), 300); });
  } else if (t < TL.brand) {
    // J · Baumgartner, 2012: 38.969 m y 1.357,6 km/h
    sc = space; space.add(sys); space.add(P.obj); const lt = t - TL.crazy; camera.near = .5; camera.far = 4e5;
    const j0 = TL.felix + 1.4; const tf = Math.max(0, t - j0); const v = Math.min(1357.6, 1357.6 * smooth(0, TL.boom - j0, tf) ** .8);
    const altM = 38969 - (tf * tf * 4.9 * .55 + tf * 20) * 9; const ALT = 38969 / 106.2; const fallU = (38969 - altM) / 106.2;
    earth.position.set(0, -ES - ALT, 0); atmo.position.copy(earth.position);
    const S = 1.6; sys.scale.setScalar(S); wingRig.visible = lines.visible = slider.visible = false; freefallBody(); body.rotation.set(0, 0, -Math.PI / 2 + Math.sin(t * 2) * .1);
    const pp = V3(3.6, -fallU * .02, 0); if (tf <= 0) { body.rotation.set(0, 0, -.1); setPose(.9); pp.set(3.2, -.2 + 1.0 * S, 0); } placeSys(pp, Math.PI);
    capsule.position.set(0, tf > 0 ? fallU * .98 + tf * 4 : 0, 0);
    focus = pp.clone(); const k = smooth(TL.felix, TL.thin, t);
    camOrbit(focus, lerp(14, 9, k), lerp(1.1, .6, k) + lt * .02, lerp(.25, .55, k), 50); if (tf > 0) camera.position.add(V3(Math.sin(t * 37) * .03 * v / 1357, Math.sin(t * 31) * .03 * v / 1357, 0));
    if (tf > 0) { for (let i = 0; i < 900; i++) { const s = P.seed, kk = i * 4; const age = fract(s[kk] + t * (.2 + v / 700)); const a = s[kk + 1] * 6.283, r = 1 + Math.sqrt(s[kk + 2]) * 6; const f = Math.sin(age * Math.PI) * .6 * smooth(200, 900, v); P.push(pp.x + Math.cos(a) * r, pp.y - 14 + age * 28, pp.z + Math.sin(a) * r, .7 * f, .8 * f, 1 * f); } P.mat.size = .06; }
    const bm = smooth(TL.boom - .05, TL.boom + .3, t) * (1 - smooth(TL.boom + .9, TL.nomotor + .5, t)); machCone.visible = bm > .01; machCone.position.copy(pp).add(V3(0, 2.2, 0)); machCone.material.uniforms.uA.value = bm * 1.4; machCone.scale.setScalar(lerp(.6, 1.1, bm));
    flash = Math.max(flash, flashAt(t, TL.boom, .4, .7)); ca = lerp(.0013, .004, bm); bloomS = .6 + bm * .6;
    hud.push(() => { titleHUD('Y LO MÁS LOCO', '2012 · FELIX BAUMGARTNER', smooth(.1, .4, lt) * (1 - smooth(TL.thin - TL.crazy - .2, TL.thin - TL.crazy, lt)), 330);
      altBarKm(Math.max(0, Math.round(altM)), smooth(TL.felix - TL.crazy + .4, TL.felix - TL.crazy + .8, lt));
      titleHUD('ALLÍ ARRIBA', 'CASI NO HAY AIRE', smooth(TL.thin - TL.crazy, TL.thin - TL.crazy + .4, lt) * (1 - smooth(TL.boom - TL.crazy - .2, TL.boom - TL.crazy, lt)), 330);
      machBar(v, smooth(TL.thin - TL.crazy + .4, TL.thin - TL.crazy + .8, lt));
      titleHUD('ROMPIÓ LA', 'BARRERA DEL SONIDO', smooth(TL.boom - TL.crazy, TL.boom - TL.crazy + .3, lt) * (1 - smooth(TL.nomotor - TL.crazy - .1, TL.nomotor - TL.crazy + .1, lt)), 330);
      titleHUD('SIN MOTOR', 'SOLO CAYENDO', smooth(TL.nomotor - TL.crazy, TL.nomotor - TL.crazy + .3, lt), 330); });
  } else {
    // K · marca
    const lt = t - TL.brand; const p = V3(-300 + lt * 11, 1400 - lt * 5, 500); placeSys(p, 0); hangBody(.03); focus = SW(V3(0, 3.4, 0));
    camOrbit(focus, 40 + lt * 6, -Math.PI / 2 + .9, .12, 42); expo = .85; fade = Math.min(.5, lt * .45);
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  buildWing(); if (sliderY !== 1.0 || true) { slider.position.y = sliderY; }
  if (!(t >= TL.pilot && t < TL.rip)) updateLines();
  P.end();
  camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); skyDome.position.copy(camera.position); lightAt(focus || sys.position);
  for (const h of hud) h();
  finish(sc, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
function renderCover() { renderFrame(TL.look + .05); coverText('¿CÓMO FUNCIONA', 'UN PARACAÍDAS?', 'De 200 km/h a 20… en tres segundos'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
