// NO LO SABÍAS — "¿Por qué el arcoíris es curvo?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final.
// Arcoíris primario: refracción + 1 reflexión interna; ángulo respecto al punto antisolar ≈ 42° (rojo) – 40° (violeta).
// Secundario: 2 reflexiones internas, ≈ 50–53°, colores invertidos. Con el Sol a más de ~42° de altura el primario queda bajo el horizonte.
// Cada observador ve luz de gotas distintas (su propio cono centrado en la sombra de su cabeza). Desde un avión puede verse el círculo completo.
// Nota: en las vistas "de paisaje" el arco se dibuja con un radio visual menor (escala ANG/42) para que quepa en el formato vertical.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3,
  g2, camera, Particles, txt, copperGrad, project, fract, arrowXY, drawBrand, coverText, finish } from '../../lib/core.js';

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(new THREE.Color(.55, .58, .64), .0016);
const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { uZen: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uSun: { value: V3(0, 1, 0) }, uSunCol: { value: new THREE.Color() }, uHalo: { value: new THREE.Color() }, uHaloW: { value: 8 }, uStorm: { value: V3(0, 0, -1) }, uStormK: { value: .5 } },
  vertexShader: `varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 uZen,uHor,uSunCol,uHalo,uSun,uStorm; uniform float uHaloW,uStormK; varying vec3 vD;
    float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
    float n2(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y); }
    void main(){ vec3 d=normalize(vD); float y=clamp(d.y,0.,1.); vec3 c=mix(uHor,uZen,pow(y,.45));
      float s=max(dot(d,normalize(uSun)),0.); c+=uHalo*pow(s,uHaloW); c+=uSunCol*smoothstep(.9990,.9996,s)*3.;
      float st=max(dot(d,normalize(uStorm)),0.); vec2 q=d.xz/(d.y+.15)*2.; float cl=n2(q)*.6+n2(q*2.3)*.3+n2(q*5.1)*.1;
      c=mix(c, vec3(.16,.18,.23)*(.7+cl*.6), uStormK*smoothstep(.2,.9,st)*smoothstep(-.05,.12,d.y));
      gl_FragColor=vec4(c,1.); }` });
const sky = new THREE.Mesh(new THREE.SphereGeometry(2800, 48, 24), skyMat); sky.renderOrder = -1; scene.add(sky);
function setSky(zen, hor, sunDir, sunCol, halo, haloW = 8, storm = .5, stormDir = null) { const u = skyMat.uniforms; u.uZen.value.setRGB(...zen); u.uHor.value.setRGB(...hor); u.uSun.value.copy(sunDir).normalize(); u.uSunCol.value.setRGB(...sunCol); u.uHalo.value.setRGB(...halo); u.uHaloW.value = haloW; u.uStormK.value = storm; u.uStorm.value.copy(stormDir || sunDir.clone().negate().setY(.25)).normalize(); }
const hemi = new THREE.HemisphereLight(0xdfe8ff, 0x4a5a40, 1.1); scene.add(hemi);
const sunL = new THREE.DirectionalLight(0xffe2b8, 2.8); scene.add(sunL); scene.add(sunL.target);
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .6, ...o });
function hash(x, z) { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, z) { const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi; const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  return lerp(lerp(hash(xi, zi), hash(xi + 1, zi), u), lerp(hash(xi, zi + 1), hash(xi + 1, zi + 1), u), v); }
const fbm = (x, z) => vnoise(x, z) * .5 + vnoise(x * 2.1, z * 2.1) * .25 + vnoise(x * 4.3, z * 4.3) * .125 + vnoise(x * 9.1, z * 9.1) * .07;

// ==========================================================================
// PAISAJE: prado, observadores, árboles, sombra
// ==========================================================================
const earth = new THREE.Group(); scene.add(earth);
{ const g = new THREE.PlaneGeometry(2400, 2400, 200, 200); g.rotateX(-Math.PI / 2); const p = g.attributes.position; const col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); const r = Math.hypot(x, z); const n = fbm(x * .004 + 3, z * .004); p.setY(i, (n - .35) * 40 * smooth(60, 400, r) - .02);
    const k = .75 + fbm(x * .05, z * .05) * .5; col.set([.36 * k, .5 * k, .27 * k], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); const land = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95 })); earth.add(land); }
const trees = new THREE.Group(); earth.add(trees);
{ const r = rng(21); const cone = new THREE.ConeGeometry(1, 2.6, 7), trunk = new THREE.CylinderGeometry(.12, .16, .8, 6); const lm = M(0x2c4a2a, { roughness: .9 }), tm = M(0x4a3626);
  for (let i = 0; i < 90; i++) { const a = r() * 6.283, d = 25 + r() * 220; const x = Math.cos(a) * d, z = -Math.abs(Math.sin(a) * d) - 10; const s = 1.2 + r() * 2.2; const g = new THREE.Group();
    const c = new THREE.Mesh(cone, lm); c.position.y = 1.9; g.add(c); const tk = new THREE.Mesh(trunk, tm); tk.position.y = .4; g.add(tk); g.scale.setScalar(s); g.position.set(x, 0, z); trees.add(g); } }
function makePerson(col) { const g = new THREE.Group(); const m = M(col), sk = M(0xd9a37a);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.2, .7, 6, 12), m); body.position.y = 1.0; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.14, 16, 12), sk); head.position.y = 1.62; g.add(head);
  for (const x of [-.1, .1]) { const l = new THREE.Mesh(new THREE.CapsuleGeometry(.08, .5, 4, 8), M(0x2a2a2a)); l.position.set(x, .35, 0); g.add(l); }
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(.45, 1), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .45, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = .03; g.add(shadow);
  g.userData.shadow = shadow; earth.add(g); return g; }
const personA = makePerson(0x1d2a44), personB = makePerson(0x7a2a2a);
const EYE = 1.62;
function placeShadow(p, A) { const sh = p.userData.shadow; const hz = V3(A.x, 0, A.z).normalize(); const elev = Math.asin(clamp(-A.y, .02, 1)); const L = clamp(EYE / Math.tan(elev), 1, 40);
  sh.scale.set(1, L, 1); sh.position.set(hz.x * L / 2, .03, hz.z * L / 2); sh.rotation.set(-Math.PI / 2, Math.atan2(-hz.x, -hz.z), 0, 'YXZ'); }

// ==========================================================================
// ARCOÍRIS: anillo con espectro (rojo fuera, violeta dentro)
// ==========================================================================
function ringMat() { return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  uniforms: { uIn: { value: .88 }, uA: { value: 1 }, uRev: { value: 0 }, uClipY: { value: -1e5 }, uFill: { value: 0 } },
  vertexShader: `varying float vR; varying vec3 vW; void main(){ vR=length(position.xy); vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `uniform float uIn,uA,uRev,uClipY,uFill; varying float vR; varying vec3 vW;
    vec3 hsv(float h){ vec3 k=clamp(abs(mod(h*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.); return k; }
    void main(){ if(vW.y<uClipY) discard; float t=(vR-uIn)/(1.-uIn); vec3 c=vec3(0.); float a=0.;
      if(t>=0.&&t<=1.){ float tt=uRev>.5?1.-t:t; c=hsv(mix(.76,0.,tt)); c=pow(c,vec3(1.6))*1.1; a=smoothstep(0.,.22,t)*smoothstep(1.,.78,t); }
      else if(t<0.){ a=uFill*smoothstep(-6.,0.,t*4.)*.5; c=vec3(1.); }
      gl_FragColor=vec4(c*a*uA,1.); }` }); }
const ringGeo = new THREE.RingGeometry(0, 1, 360, 24);
const bow1 = new THREE.Mesh(ringGeo, ringMat()), bow2 = new THREE.Mesh(ringGeo, ringMat()), bowB = new THREE.Mesh(ringGeo, ringMat());
bow2.material.uniforms.uRev.value = 1; for (const b of [bow1, bow2, bowB]) { b.renderOrder = 5; scene.add(b); }
// coloca un arco centrado en el punto antisolar visto desde 'eye'
function setBow(b, eye, A, D, angDeg, alpha, opt = {}) { b.visible = alpha > .005; if (!b.visible) return; const c = eye.clone().add(A.clone().multiplyScalar(D)); b.position.copy(c); b.lookAt(eye);
  b.scale.setScalar(D * Math.tan(angDeg * Math.PI / 180)); const u = b.material.uniforms; u.uA.value = alpha; u.uIn.value = opt.inner ?? .88; u.uClipY.value = opt.clipY ?? -1e5; u.uFill.value = opt.fill ?? 0;
  b.material.depthTest = opt.depth ?? true; }
const ringPts = (eye, A, D, angDeg, n = 64) => { const c = eye.clone().add(A.clone().multiplyScalar(D)); const up = Math.abs(A.y) > .95 ? V3(1, 0, 0) : V3(0, 1, 0); const u = V3().crossVectors(A, up).normalize(), v = V3().crossVectors(u, A).normalize(); const R = D * Math.tan(angDeg * Math.PI / 180);
  const out = []; for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2; out.push(c.clone().add(u.clone().multiplyScalar(Math.cos(a) * R)).add(v.clone().multiplyScalar(Math.sin(a) * R))); } return out; };
// cono de rayos ojo → gotas
function makeCone(col) { const n = 48; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 2 * 3), 3));
  const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: .6, depthWrite: false, fog: false })); l.frustumCulled = false; l.renderOrder = 6; scene.add(l); l.userData.n = n; return l; }
const coneA = makeCone(new THREE.Color(1.4, 1.3, 1.1)), coneB = makeCone(new THREE.Color(1.6, .9, .5));
function setCone(l, eye, A, D, ang, a) { l.visible = a > .01; if (!l.visible) return; const pts = ringPts(eye, A, D, ang, l.userData.n); const p = l.geometry.attributes.position;
  for (let i = 0; i < l.userData.n; i++) { p.setXYZ(i * 2, eye.x, eye.y, eye.z); const q = pts[i]; p.setXYZ(i * 2 + 1, q.x, q.y, q.z); } p.needsUpdate = true; l.material.opacity = .55 * a; }
const axisL = (() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3)); const l = new THREE.Line(g, new THREE.LineDashedMaterial({ color: 0xffe2c0, dashSize: 1, gapSize: .7, transparent: true, depthWrite: false, fog: false })); l.frustumCulled = false; scene.add(l); return l; })();
function setAxis(a, b, al) { axisL.visible = al > .01; const p = axisL.geometry.attributes.position; p.setXYZ(0, a.x, a.y, a.z); p.setXYZ(1, b.x, b.y, b.z); p.needsUpdate = true; axisL.computeLineDistances(); axisL.material.opacity = al; }

// ==========================================================================
// GOTA (laboratorio) y AVIÓN
// ==========================================================================
const LAB = V3(0, 3000, 0); const lab = new THREE.Group(); lab.position.copy(LAB); scene.add(lab);
const dropMat = new THREE.MeshPhysicalMaterial({ color: 0xbfe3ff, transparent: true, opacity: .22, roughness: .02, metalness: 0, emissive: 0x1a3a5a, depthWrite: false });
const drop = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), dropMat); lab.add(drop);
const dropRim = new THREE.Mesh(new THREE.SphereGeometry(1.004, 64, 48), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `varying vec3 vN; varying vec3 vV; void main(){ float f=pow(1.-abs(dot(vN,vV)),2.5); gl_FragColor=vec4(vec3(.55,.8,1.)*f*1.3,f); }` })); lab.add(dropRim);
const lamp = new THREE.PointLight(0xffffff, 0, 0, 1.5); lamp.position.set(-3, 3, 4); lab.add(lamp);
const PLANE = V3(0, 1500, 0); const air = new THREE.Group(); air.position.copy(PLANE); scene.add(air);
const cloudDeck = (() => { const c = document.createElement('canvas'); c.width = c.height = 1024; const x = c.getContext('2d'); x.fillStyle = '#c9d2dc'; x.fillRect(0, 0, 1024, 1024); const r = rng(8);
  for (let i = 0; i < 2600; i++) { const px = r() * 1024, py = r() * 1024, rr = 10 + r() * 60; const g = x.createRadialGradient(px, py, 0, px, py, rr); const k = 200 + Math.floor(r() * 55); g.addColorStop(0, `rgba(${k},${k},${k + 6},.55)`); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(px - rr, py - rr, rr * 2, rr * 2); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshStandardMaterial({ map: t, roughness: 1, emissive: 0x5a6270, emissiveMap: t })); m.rotation.x = -Math.PI / 2; m.position.y = -300; air.add(m); return m; })();
const wing = new THREE.Group(); air.add(wing);
{ const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(9, -1.2); s.lineTo(9.4, -.6); s.lineTo(.4, 2.2); s.closePath(); const w = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: .15, bevelEnabled: false }), M(0xdfe3e8, { metalness: .4, roughness: .35 }));
  w.rotation.x = -Math.PI / 2; wing.add(w); const tip = new THREE.Mesh(new THREE.BoxGeometry(.1, 1, .6), M(0xd04040)); tip.position.set(9.2, .5, .9); wing.add(tip);
  const eng = new THREE.Mesh(new THREE.CylinderGeometry(.55, .5, 2.6, 24), M(0xc8ccd2, { metalness: .5, roughness: .3 })); eng.rotation.x = Math.PI / 2; eng.position.set(3.2, -.6, -.6); wing.add(eng); }
const PS = new Particles(20000, { size: .1, seed: 5 }); scene.add(PS.obj);
const ALL = [earth, lab, air, personA, personB];

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
const SPEC = [['#ff3a30', 1.3310], ['#ff8c20', 1.3322], ['#ffe030', 1.3333], ['#3ee060', 1.3350], ['#2fa0ff', 1.3378], ['#5a5cff', 1.3402], ['#b040ff', 1.3435]];
// trazado 2D de un rayo dentro de una gota (radio 1, y hacia arriba), k reflexiones internas. Dispersión exagerada ×EX para que se vea.
const EX = 2.6;
function refr(d, n, eta) { const ci = -(d[0] * n[0] + d[1] * n[1]); const k = 1 - eta * eta * (1 - ci * ci); const s = Math.sqrt(Math.max(0, k)); return [eta * d[0] + (eta * ci - s) * n[0], eta * d[1] + (eta * ci - s) * n[1]]; }
function trace(b, nIdx, k) { const n = 1.331 + (nIdx - 1.331) * EX; let P = [-Math.sqrt(1 - b * b), b]; const pts = [[-3.2, b], P.slice()]; let d = refr([1, 0], P, 1 / n);
  for (let j = 0; j <= k; j++) { const tt = -2 * (P[0] * d[0] + P[1] * d[1]); P = [P[0] + d[0] * tt, P[1] + d[1] * tt]; pts.push(P.slice()); if (j < k) { const dn = d[0] * P[0] + d[1] * P[1]; d = [d[0] - 2 * dn * P[0], d[1] - 2 * dn * P[1]]; } }
  const out = refr(d, [-P[0], -P[1]], n); pts.push([P[0] + out[0] * 3.4, P[1] + out[1] * 3.4]); return { pts, out }; }
function polyLen(ps) { let L = 0; for (let i = 1; i < ps.length; i++) L += Math.hypot(ps[i][0] - ps[i - 1][0], ps[i][1] - ps[i - 1][1]); return L; }
function drawPath(ps, prog, col, cx, cy, R, lw = 6, alpha = 1) { const L = polyLen(ps) * prog; let acc = 0; g2.save(); g2.globalAlpha = alpha; g2.strokeStyle = col; g2.lineWidth = lw; g2.lineCap = 'round'; g2.lineJoin = 'round'; g2.shadowColor = col; g2.shadowBlur = 16; g2.beginPath();
  g2.moveTo(cx + ps[0][0] * R, cy - ps[0][1] * R); for (let i = 1; i < ps.length; i++) { const sl = Math.hypot(ps[i][0] - ps[i - 1][0], ps[i][1] - ps[i - 1][1]); if (acc + sl >= L) { const f = (L - acc) / sl; g2.lineTo(cx + lerp(ps[i - 1][0], ps[i][0], f) * R, cy - lerp(ps[i - 1][1], ps[i][1], f) * R); break; } acc += sl; g2.lineTo(cx + ps[i][0] * R, cy - ps[i][1] * R); }
  g2.stroke(); g2.restore(); }
function dropDiagram(t, k, b, t0, tSplit, tAng, tViol, a) { if (a <= .01) return; const c = project(LAB), e = project(LAB.clone().add(V3(1, 0, 0))); const R = e.x - c.x, cx = c.x, cy = c.y;
  const prog = clamp((t - t0) / 2.2); g2.save(); g2.globalCompositeOperation = 'lighter';
  const sep = smooth(tSplit, tSplit + .8, t);
  SPEC.forEach(([col, n], i) => { const tr = trace(b, lerp(1.3333, n, sep), k); drawPath(tr.pts, prog, col, cx, cy, R, 6, a * (sep > .02 ? .85 : .5)); });
  g2.restore();
  if (prog < .02) return;
  // flecha de entrada «LUZ DEL SOL»
  txt('LUZ DEL SOL', Math.max(170, cx - R * 2.3), cy - b * R - 46, 30, { font: 'Montserrat', weight: 800, alpha: a * smooth(t0, t0 + .4, t), fill: '#fff3d8', spacing: 3 });
  const ang = (tt, col, lab, aa, rr) => { if (aa <= .01) return; const P = tt.pts[tt.pts.length - 2]; const X = cx + P[0] * R, Y = cy - P[1] * R; const o = Math.atan2(tt.out[1], tt.out[0]);
    g2.save(); g2.globalAlpha = aa; g2.setLineDash([12, 10]); g2.strokeStyle = 'rgba(255,255,255,.8)'; g2.lineWidth = 3; g2.beginPath(); g2.moveTo(X, Y); g2.lineTo(X - R * 2.6, Y); g2.stroke(); g2.setLineDash([]);
    g2.strokeStyle = col; g2.lineWidth = 6; g2.shadowColor = col; g2.shadowBlur = 18; g2.beginPath(); const a0 = Math.PI, a1 = -o; g2.arc(X, Y, rr, Math.min(a0, a1 + 2 * Math.PI * (a1 < 0 ? 1 : 0)), Math.max(a0, a1 + 2 * Math.PI * (a1 < 0 ? 1 : 0))); g2.stroke(); g2.restore();
    const mid = (Math.PI - (Math.PI - Math.abs(Math.PI - ((-o + 2 * Math.PI) % (2 * Math.PI))))) ; const am = (Math.PI + ((-o + 2 * Math.PI) % (2 * Math.PI))) / 2;
    txt(lab, X + Math.cos(am) * (rr + 70), Y + Math.sin(am) * (rr + 70), 58, { font: 'Montserrat', weight: 800, alpha: aa, fill: col }); };
  const red = trace(b, SPEC[0][1], k), vio = trace(b, SPEC[6][1], k);
  ang(red, '#ff5040', k === 1 ? '42°' : '51°', a * smooth(tAng, tAng + .4, t), R * 1.15);
  ang(vio, '#c070ff', k === 1 ? '40°' : '', a * smooth(tViol, tViol + .4, t), R * .75);
}
// medidor de altura del sol (inserto)
function sunGauge(elev, a) { if (a <= .01) return; const cx = 540, cy = 1640, R = 150; g2.save(); g2.globalAlpha = a; g2.fillStyle = 'rgba(8,10,16,.55)'; g2.beginPath(); g2.roundRect(cx - 330, cy - R - 70, 660, R + 140, 30); g2.fill();
  g2.strokeStyle = 'rgba(255,255,255,.5)'; g2.lineWidth = 3; g2.beginPath(); g2.moveTo(cx - R - 40, cy); g2.lineTo(cx + R + 40, cy); g2.stroke();
  g2.setLineDash([8, 8]); g2.beginPath(); g2.arc(cx, cy, R, Math.PI, Math.PI + 42 * Math.PI / 180, false); g2.strokeStyle = '#ff6a4a'; g2.stroke(); g2.setLineDash([]);
  const e = elev * Math.PI / 180; const sx = cx - Math.cos(e) * R, sy = cy - Math.sin(e) * R; g2.strokeStyle = '#ffd070'; g2.lineWidth = 4; g2.beginPath(); g2.moveTo(cx, cy); g2.lineTo(sx, sy); g2.stroke();
  const gl = g2.createRadialGradient(sx, sy, 0, sx, sy, 40); gl.addColorStop(0, '#fff6d0'); gl.addColorStop(.4, '#ffc040'); gl.addColorStop(1, 'rgba(255,160,40,0)'); g2.fillStyle = gl; g2.beginPath(); g2.arc(sx, sy, 40, 0, 7); g2.fill();
  g2.fillStyle = '#e8e8f0'; g2.fillRect(cx - 6, cy - 34, 12, 34); g2.beginPath(); g2.arc(cx, cy - 42, 9, 0, 7); g2.fill(); g2.restore();
  txt('SOL A ' + Math.round(elev) + '°', cx + 170, cy - 60, 40, { font: 'Montserrat', weight: 800, alpha: a, fill: elev > 42 ? '#ff6a4a' : '#ffd070' }); txt('límite: 42°', cx + 170, cy - 10, 26, { alpha: a * .8, fill: '#ff8a6a' }); }

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
const deg = Math.PI / 180;
const sunDirAt = (elevDeg, az = 0) => V3(Math.sin(az) * Math.cos(elevDeg * deg), Math.sin(elevDeg * deg), Math.cos(az) * Math.cos(elevDeg * deg)); // az=0 → sol detrás (+z), mirada hacia −z
const VIS = 24; // radio visual del arco en las vistas de paisaje (real: 42°)
function rain(eyeP, A, D, k, t, spread = 60) { for (let i = 0; i < 3500 * k; i++) { const s = PS.seed, q = i * 4; const c = eyeP.clone().add(A.clone().setY(0).normalize().multiplyScalar(D * (.6 + s[q + 3] * .7)));
  PS.push(c.x + (s[q + 1] - .5) * spread * 2.4, fract(s[q] - t * .9) * 70 - 6, c.z + (s[q + 2] - .5) * 40, .16 * k, .17 * k, .2 * k); } }
function landscape(elev, storm = .75) { earth.visible = true; const S = sunDirAt(elev); setSky([.22, .32, .5], [.75, .72, .66], S, [1.6, 1.3, .9], [.5, .35, .18], 5, storm); sunL.position.copy(S).multiplyScalar(100); sunL.target.position.set(0, 0, 0); sunL.intensity = 3; hemi.intensity = .9; scene.fog.color.setRGB(.55, .56, .6); scene.fog.density = .0016; return S; }

function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = .05; camera.far = 6000; camera.fov = 42;
  let bloomS = .5, flash = 0, ca = .0012, fade = 0, expo = 1;
  PS.begin(); PS.mat.size = .08; for (const o of ALL) o.visible = false; for (const b of [bow1, bow2, bowB]) b.visible = false; coneA.visible = coneB.visible = axisL.visible = false; personA.position.set(0, 0, 0); personB.position.set(0, 0, 0); personA.rotation.y = personB.rotation.y = 0;
  for (const c of ['circle', 'prism', 'split', 'ring', 'plane', 'behind', 'double', 'second', 'own', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = []; const E = V3(0, EYE, 0);

  if (t < TL.prism) {
    // A–B · el arco… que en realidad es un círculo
    const elev = 6, S = landscape(elev), A = S.clone().negate(); personA.visible = true; placeShadow(personA, A); const Av = sunDirAt(elev * VIS / 42).negate();
    const lt = t; const rise = smooth(TL.circle + .2, TL.circle + 1.6, t);
    camera.position.set(lerp(.6, .9, lt / 4), lerp(1.9, 1.9 + rise * 26, 1), lerp(5.5, 4.5, lt / 4) + rise * 14); camera.fov = 72; camera.lookAt(0, lerp(10, 30, rise) + 1.9, -120);
    setBow(bow1, E, Av, 300, VIS, smooth(0, .8, t) * .9, { fill: .35 }); setBow(bow2, E, Av, 300, VIS * 1.24, smooth(.4, 1.4, t) * .28);
    rain(E, A, 260, 1, t, 120); PS.mat.size = .5;
    hud.push(() => { topGrad(); two(null, '¿POR QUÉ EL ARCOÍRIS', 'SIEMPRE ES CURVO?', win(t, 0, TL.circle), 300); two(null, 'PORQUE EN REALIDAD', 'ES UN CÍRCULO', smooth(TL.circle, TL.circle + .3, t), 300);
      const a = smooth(TL.circle + .6, TL.circle + 1.2, t); if (a > 0) { const pts = ringPts(E, Av, 300, VIS, 96).map(project); g2.save(); g2.globalAlpha = a; g2.setLineDash([16, 14]); g2.strokeStyle = '#ffffff'; g2.lineWidth = 4; g2.shadowColor = '#000'; g2.shadowBlur = 10; g2.beginPath(); pts.forEach((p, i) => i ? g2.lineTo(p.x, p.y) : g2.moveTo(p.x, p.y)); g2.stroke(); g2.restore(); } });
  } else if (t < TL.shadow) {
    // C–E · una gota = un prisma: entra, se dobla, rebota, sale en colores; 42° y 40°
    lab.visible = true; scene.fog.density = 0; setSky([.02, .03, .06], [.05, .06, .1], V3(0, 1, 0), [0, 0, 0], [0, 0, 0], 8, 0); hemi.intensity = .3; sunL.intensity = 0;
    const lt = t - TL.prism; const k = easeOut(smooth(TL.prism, TL.prism + 1.2, t)); drop.scale.setScalar(1); dropRim.scale.setScalar(1);
    camera.position.copy(LAB).add(V3(lerp(-.3, -.2, k), .15, lerp(14, 8.2, k))); camera.lookAt(LAB.clone().add(V3(-.55, -.7, 0))); camera.fov = 50;
    for (let i = 0; i < 1400; i++) { const s = PS.seed, q = i * 4; const z = -6 - s[q + 2] * 30; PS.push(LAB.x + (s[q + 1] - .5) * 50, LAB.y + fract(s[q] - t * .25) * 40 - 20, LAB.z + z, .12, .14, .18); } PS.mat.size = .25;
    hud.push(() => { two(null, 'CADA GOTA DE LLUVIA', 'ES COMO UN PRISMA', win(t, TL.prism, TL.enter), 300);
      two(null, 'ENTRA, SE DOBLA', 'Y REBOTA DENTRO', win(t, TL.enter, TL.split), 300); two(null, 'Y SALE SEPARADA', 'EN COLORES', win(t, TL.split, TL.angle), 300);
      two(null, 'PERO SOLO CON', 'UN ÁNGULO CONCRETO', smooth(TL.angle, TL.angle + .3, t), 300);
      dropDiagram(t, 1, .862, TL.enter, TL.split, TL.angle + .8, TL.violet, smooth(TL.enter - .2, TL.enter + .2, t));
      txt('ROJO', 760, 1480, 40, { font: 'Montserrat', weight: 800, alpha: smooth(TL.angle + 1, TL.angle + 1.4, t), fill: '#ff5040', align: 'left' }); txt('42°', 960, 1480, 40, { font: 'Montserrat', weight: 800, alpha: smooth(TL.angle + 1, TL.angle + 1.4, t), fill: '#ffffff', align: 'left' });
      txt('VIOLETA', 760, 1560, 40, { font: 'Montserrat', weight: 800, alpha: smooth(TL.violet, TL.violet + .4, t), fill: '#c070ff', align: 'left' }); txt('40°', 960, 1560, 40, { font: 'Montserrat', weight: 800, alpha: smooth(TL.violet, TL.violet + .4, t), fill: '#ffffff', align: 'right' });
      txt('(dispersión exagerada para que se vea)', W / 2, 1780, 22, { alpha: .55 * smooth(TL.split, TL.split + .5, t) }); });
  } else if (t < TL.ground) {
    // F–G · la sombra de tu cabeza y el cono de 42°
    const elev = 14, S = landscape(elev, .6), A = S.clone().negate(); personA.visible = true; placeShadow(personA, A);
    const lt = t - TL.shadow; const side = smooth(TL.ring - .8, TL.ring + 1.2, t); const D = 40; const ang = lerp(VIS, 42, side);
    const behind = V3(1.2, 2.6, 6), sideP = V3(62, 26, 34); camera.position.copy(behind.clone().lerp(sideP, easeInOut(side))); camera.fov = lerp(72, 58, side); camera.lookAt(V3(0, 3.5, -20).lerp(V3(0, -2, -22), side));
    setBow(bow1, E, A, D, ang, .85, { depth: side < .5 }); setCone(coneA, E, A, D, ang, smooth(TL.shadow + 1.6, TL.shadow + 2.4, t)); setAxis(E.clone().add(S.clone().multiplyScalar(6)), E.clone().add(A.clone().multiplyScalar(D)), smooth(TL.shadow + .6, TL.shadow + 1.2, t) * .9);
    rain(E, A, 34, .6, t, 40); PS.mat.size = .12;
    const sh = E.clone().add(A.clone().multiplyScalar(EYE / Math.sin(elev * deg)));
    hud.push(() => { topGrad(); two(null, 'SOLO VES COLOR EN GOTAS A 42°', 'DE LA SOMBRA DE TU CABEZA', win(t, TL.shadow, TL.ring), 300); two(null, 'Y TODOS ESOS PUNTOS', 'FORMAN UN CÍRCULO', smooth(TL.ring, TL.ring + .3, t), 300);
      const a = win(t, TL.shadow + .8, TL.ring - .4); if (a > 0) { const p = project(sh); g2.save(); g2.globalAlpha = a; g2.fillStyle = '#ffd070'; g2.shadowColor = '#ffd070'; g2.shadowBlur = 20; g2.beginPath(); g2.arc(p.x, p.y, 14, 0, 7); g2.fill(); g2.restore(); txt('SOMBRA DE TU CABEZA', p.x, p.y + 60, 30, { font: 'Montserrat', weight: 800, alpha: a, fill: '#ffd070' }); }
      label(E.clone().add(A.clone().multiplyScalar(D * .55)).add(V3(0, D * .55 * Math.tan(ang * deg) * .55, 0)), '42°', null, smooth(TL.ring + 1, TL.ring + 1.5, t), '#ff6a4a', 56); });
  } else if (t < TL.plane) {
    // H · el suelo corta la mitad de abajo
    const elev = 8, S = landscape(elev), A = S.clone().negate(); personA.visible = true; placeShadow(personA, A); const Av = sunDirAt(elev * VIS / 42).negate();
    camera.position.set(.5, 2, 4.6); camera.fov = 72; camera.lookAt(0, 1, -120);
    setBow(bow1, E, Av, 300, VIS, .9, { fill: .35 }); rain(E, A, 260, 1, t, 120); PS.mat.size = .5;
    hud.push(() => { topGrad(); two(null, 'EL SUELO CORTA', 'LA MITAD DE ABAJO', 1, 300); const a = smooth(TL.ground + .5, TL.ground + 1, t);
      const pts = ringPts(E, Av, 300, VIS, 120); g2.save(); g2.globalAlpha = a; g2.setLineDash([16, 14]); g2.strokeStyle = '#ffffff'; g2.lineWidth = 4; g2.shadowColor = '#000'; g2.shadowBlur = 10; g2.beginPath(); let on = false;
      for (const w of pts) { const p = project(w); if (w.y < 0) { on ? g2.lineTo(p.x, p.y) : g2.moveTo(p.x, p.y); on = true; } else on = false; } g2.stroke(); g2.restore(); });
  } else if (t < TL.behind) {
    // I · desde un avión: el círculo entero
    air.visible = true; scene.fog.color.setRGB(.7, .78, .88); scene.fog.density = .0004; const S = sunDirAt(20, .15); setSky([.12, .3, .65], [.7, .8, .92], S, [1.6, 1.4, 1], [.4, .35, .25], 6, 0);
    sunL.position.copy(PLANE).add(S.clone().multiplyScalar(100)); sunL.target.position.copy(PLANE); sunL.intensity = 3; hemi.intensity = 1.2; const A = S.clone().negate(); const lt = t - TL.plane;
    const eye = PLANE.clone(); camera.position.copy(eye).add(V3(0, 0, lerp(0, -3, lt / 2))); camera.fov = 92; camera.lookAt(eye.clone().add(A.clone().multiplyScalar(10)).add(V3(0, 1.6, 0)));
    wing.position.set(-3.2, -3.6, -3); wing.scale.setScalar(.7); wing.rotation.set(0, Math.PI * .62, .04 + Math.sin(t * 1.3) * .01);
    setBow(bow1, eye, A, 260, 30, smooth(TL.plane, TL.plane + .8, t) * .32, { depth: false, fill: 0 }); bloomS = .2; expo = .9; setBow(bow2, eye, A, 260, 30 * 1.24, smooth(TL.plane + .4, TL.plane + 1.2, t) * .2, { depth: false });
    for (const b of [bow1, bow2]) b.position.y = Math.max(b.position.y, PLANE.y - 299);
    hud.push(() => { topGrad(); two('DESDE UN AVIÓN', 'SE PUEDE VER', 'ENTERO', smooth(TL.plane, TL.plane + .3, t), 300); stamp('360°', W / 2, 1600, smooth(TL.plane + 1, TL.plane + 1.3, t), -.06, '#ffd070', 80); });
  } else if (t < TL.double) {
    // J · el sol detrás y bajo; a mediodía en verano el arco queda bajo el suelo
    const e = lerp(12, 58, easeInOut(smooth(TL.behind + 1.4, TL.noon + 1.4, t))); const S = landscape(e, .7), A = S.clone().negate(); personA.visible = true; placeShadow(personA, A);
    const Av = sunDirAt(e * VIS / 42).negate(); camera.position.set(.5, 2, 4.6); camera.fov = 72; camera.lookAt(0, 1, -120);
    setBow(bow1, E, Av, 300, VIS, .9 * (1 - smooth(46, 52, e) * .6), { fill: .35 }); rain(E, A, 260, 1, t, 120); PS.mat.size = .5;
    hud.push(() => { topGrad(); two(null, 'EL SOL TIENE QUE ESTAR', 'DETRÁS DE TI, Y BAJO', win(t, TL.behind, TL.noon), 300); two(null, 'A MEDIODÍA EN VERANO', 'CASI NUNCA HAY ARCOÍRIS', smooth(TL.noon, TL.noon + .3, t), 300);
      sunGauge(e, smooth(TL.behind + .5, TL.behind + 1, t)); });
  } else if (t < TL.own) {
    // K · doble reflexión → segundo arco con los colores al revés
    if (t < TL.second) { lab.visible = true; scene.fog.density = 0; setSky([.02, .03, .06], [.05, .06, .1], V3(0, 1, 0), [0, 0, 0], [0, 0, 0], 8, 0); hemi.intensity = .3; sunL.intensity = 0;
      camera.position.copy(LAB).add(V3(.3, .1, 6.8)); camera.lookAt(LAB.clone().add(V3(.25, .45, 0))); camera.fov = 50;
      hud.push(() => { two(null, 'SI LA LUZ REBOTA', 'DOS VECES DENTRO…', 1, 300); dropDiagram(t, 2, -.951, TL.double + .2, TL.double + 1.4, 1e9, 1e9, 1); });
    } else { const elev = 6, S = landscape(elev), A = S.clone().negate(); personA.visible = true; placeShadow(personA, A); const Av = sunDirAt(elev * VIS / 42).negate();
      camera.position.set(.6, 2, 5); camera.fov = 76; camera.lookAt(0, 6, -120);
      setBow(bow1, E, Av, 300, VIS, .9, { fill: .35 }); setBow(bow2, E, Av, 300, VIS * 1.24, smooth(TL.second, TL.second + 1, t) * .65); rain(E, A, 260, 1, t, 120); PS.mat.size = .5;
      hud.push(() => { topGrad(); two(null, 'APARECE UN SEGUNDO ARCO', 'CON LOS COLORES AL REVÉS', smooth(TL.second, TL.second + .3, t), 300);
        const a = smooth(TL.second + 1.2, TL.second + 1.6, t); const p1 = project(ringPts(E, Av, 300, VIS, 8)[2]), p2 = project(ringPts(E, Av, 300, VIS * 1.24, 8)[2]);
        txt('42°', p1.x, p1.y + 70, 40, { font: 'Montserrat', weight: 800, alpha: a, fill: '#ffe2c0' }); txt('51°', p2.x, p2.y - 50, 40, { font: 'Montserrat', weight: 800, alpha: a, fill: '#ffe2c0' }); });
    }
  } else if (t < TL.brand) {
    // L–M · cada persona ve su propio arcoíris
    const elev = 14, S = landscape(elev, .6), A = S.clone().negate(); personA.visible = personB.visible = true; personA.position.set(-3, 0, 0); personB.position.set(3, 0, 0); placeShadow(personA, A); placeShadow(personB, A);
    const EA = V3(-3, EYE, 0), EB = V3(3, EYE, 0); const D = 20, lt = t - TL.own;
    camera.position.set(lerp(5, 9, clamp(lt / 6)), 16, lerp(32, 36, clamp(lt / 6))); camera.fov = 62; camera.lookAt(0, -3, -14);
    setBow(bow1, EA, A, D, 42, .5, { depth: false }); setBow(bowB, EB, A, D, 42, .5, { depth: false }); setCone(coneA, EA, A, D, 42, smooth(TL.own + .4, TL.own + 1.2, t)); setCone(coneB, EB, A, D, 42, smooth(TL.own + 1.2, TL.own + 2, t));
    rain(V3(0, EYE, 0), A, 20, .6, t, 30); PS.mat.size = .12;
    hud.push(() => { topGrad(); two('Y LO MÁS CURIOSO', 'CADA PERSONA VE', 'SU PROPIO ARCOÍRIS', win(t, TL.own, TL.never), 300); two(null, 'HECHO CON', 'GOTAS DISTINTAS', 0, 300);
      label(EA.clone().add(V3(-1.5, 1, 0)), 'TÚ', null, smooth(TL.own + .6, TL.own + 1, t), '#ffffff', 40, -40); label(EB.clone().add(V3(2.5, 1, 0)), 'TU AMIGO', null, smooth(TL.own + 1.4, TL.own + 1.8, t), '#ffb070', 40, -40);
      two(null, 'NUNCA HAY', 'DOS IGUALES', smooth(TL.never, TL.never + .3, t), 300); stamp('ÚNICO', W / 2, 1620, smooth(TL.never + .4, TL.never + .7, t), -.06, '#ff6a4a', 80); });
  } else {
    // N · marca
    const elev = 6, S = landscape(elev), A = S.clone().negate(); personA.visible = true; placeShadow(personA, A); const Av = sunDirAt(elev * VIS / 42).negate(); const lt = t - TL.brand;
    camera.position.set(.6, 2 + lt * .3, 5 + lt * 1.5); camera.fov = 72; camera.lookAt(0, 8, -120); setBow(bow1, E, Av, 300, VIS, .9, { fill: .35 }); setBow(bow2, E, Av, 300, VIS * 1.24, .3);
    rain(E, A, 260, 1, t, 120); PS.mat.size = .5; fade = Math.min(.5, lt * .45); hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  sky.position.copy(camera.position); PS.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, bloom: bloomS, expo });
}
function renderCover() { renderFrame(TL.circle - .25); coverText('¿POR QUÉ EL', 'ARCOÍRIS ES CURVO?', 'en realidad es un círculo'); }
window.renderCover = () => { renderCover(); return true; };
window.OBJ = { PS, scene };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
