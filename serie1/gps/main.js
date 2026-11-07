// NO LO SABÍAS — "¿Cómo sabe el GPS dónde estás?"
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final. Unidades: km.
// Referencia: constelación GPS (31 satélites operativos, 6 planos orbitales a 55°, órbita de 26.560 km de radio ≈ 20.200 km de altura,
// periodo ≈ 11 h 58 min, ≈ 3,9 km/s ≈ 14.000 km/h). Relojes atómicos de rubidio/cesio. Retardo de la señal ≈ 67–86 ms.
// Relatividad: −7 µs/día (velocidad, relatividad especial) +45 µs/día (gravedad más débil, relatividad general) = +38 µs/día.
// Frecuencia del reloj ajustada en fábrica a 10,22999999543 MHz en lugar de 10,23 MHz. Sin corrección: ≈ 10–11 km de error por día.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, rng, V3,
  g2, camera, SOFT, Particles, txt, copperGrad, project, fmt, callout, titleHUD, fract, camOrbit, arrowXY, bigStat, drawBrand, coverText, finish } from '../../lib/core.js';

const scene = new THREE.Scene(); scene.background = new THREE.Color(0x01030a);
const SUN = V3(1, .3, .55).normalize();
const hemi = new THREE.HemisphereLight(0xbfd4ff, 0x203040, .55); scene.add(hemi); const sunL = new THREE.DirectionalLight(0xfff2e0, 2.6); sunL.position.copy(SUN).multiplyScalar(1e5); scene.add(sunL);
function xray(col) { return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  uniforms: { uCol: { value: col }, uA: { value: 1 } },
  vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform vec3 uCol; uniform float uA; varying vec3 vN; varying vec3 vV; void main(){ float f=pow(clamp(1.-abs(dot(vN,vV)),0.,1.),2.); gl_FragColor=vec4(uCol*(f*.8+.05)*uA,(f*.7+.04)*uA); }` }); }

// ==========================================================================
// TIERRA (radio 6.371 km)
// ==========================================================================
const RE = 6371, RS = 26560;
const earthMat = new THREE.ShaderMaterial({ uniforms: { uSun: { value: SUN } },
  vertexShader: `varying vec3 vP; varying vec3 vN; varying vec3 vW; void main(){ vP=normalize(position); vN=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `uniform vec3 uSun; varying vec3 vP; varying vec3 vN; varying vec3 vW;
    float h3(vec3 p){ p=fract(p*.3183099+.1); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
    float n3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
      return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z); }
    float fbm(vec3 p){ float a=.5,s=0.; for(int i=0;i<6;i++){ s+=a*n3(p); p*=2.03; a*=.5; } return s; }
    void main(){ vec3 n=normalize(vN); float d=dot(n,uSun); float day=smoothstep(-.08,.25,d);
      float c=fbm(vP*3.2+vec3(1.7,.3,2.2)); float land=smoothstep(.52,.56,c);
      vec3 ocean=vec3(.02,.09,.2), ground=mix(vec3(.16,.2,.09),vec3(.42,.33,.2),fbm(vP*9.)); float ice=smoothstep(.82,.9,abs(vP.y));
      vec3 col=mix(ocean,ground,land); col=mix(col,vec3(.85,.9,.95),ice); float cl=smoothstep(.55,.8,fbm(vP*6.+vec3(4.,1.,2.)))*.85; col=mix(col,vec3(.95),cl);
      vec3 V=normalize(cameraPosition-vW); float spec=pow(max(dot(reflect(-uSun,n),V),0.),60.)*(1.-land)*(1.-cl)*.8;
      vec3 dayC=col*(.15+1.1*max(d,0.))+vec3(1.,.9,.7)*spec; float city=land*(1.-cl)*step(.62,fbm(vP*40.))*.9; vec3 nightC=vec3(1.,.7,.35)*city*.7+col*.02;
      vec3 o=mix(nightC,dayC,day); float rim=pow(1.-max(dot(n,V),0.),3.); o+=vec3(.3,.55,1.)*rim*.9*smoothstep(-.3,.3,d); gl_FragColor=vec4(o,1.); }` });
const earth = new THREE.Mesh(new THREE.SphereGeometry(RE, 160, 120), earthMat); scene.add(earth);
const atmo = new THREE.Mesh(new THREE.SphereGeometry(RE * 1.02, 128, 96), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide, uniforms: { uSun: { value: SUN } },
  vertexShader: `varying vec3 vN; varying vec3 vW; void main(){ vN=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `uniform vec3 uSun; varying vec3 vN; varying vec3 vW; void main(){ vec3 V=normalize(cameraPosition-vW); float f=pow(1.-abs(dot(normalize(vN),V)),4.)*1.2; float d=smoothstep(-.3,.4,dot(normalize(vN),uSun)); gl_FragColor=vec4(vec3(.25,.5,1.)*f*d,f*d); }` })); scene.add(atmo);
const stars = (() => { const n = 5000, p = new Float32Array(n * 3), c = new Float32Array(n * 3); const r = rng(12); for (let i = 0; i < n; i++) { const v = V3(r() - .5, r() - .5, r() - .5).normalize().multiplyScalar(900000); p.set([v.x, v.y, v.z], i * 3); const k = .3 + r() * .9; c.set([k, k, k * 1.1], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, map: SOFT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); })(); scene.add(stars);
// el usuario: un punto en la superficie (lado de día)
const USER = V3(.62, .55, .56).normalize().multiplyScalar(RE);
const userGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: SOFT, color: new THREE.Color(.4, .8, 1.6), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); scene.add(userGlow); userGlow.position.copy(USER).multiplyScalar(1.002);

// ==========================================================================
// CONSTELACIÓN: 6 planos a 55°, 31 satélites
// ==========================================================================
const NS = 31; const satDef = []; { for (let i = 0; i < NS; i++) { const pl = i % 6, k = Math.floor(i / 6); satDef.push({ O: pl * Math.PI / 3, u0: k * 2 * Math.PI / (i < 30 ? 5 : 6) + pl * .45 + (i === 30 ? 1.3 : 0) }); } }
const INC = 55 * Math.PI / 180, OMEGA = 2 * Math.PI / 60; // giro visual (1 vuelta = 60 s de vídeo)
function satPos(i, tt, out = V3()) { const d = satDef[i]; const u = d.u0 + OMEGA * tt; const x = Math.cos(u) * RS, y0 = Math.sin(u) * RS;
  const y = y0 * Math.cos(INC), z = y0 * Math.sin(INC); return out.set(x * Math.cos(d.O) - z * Math.sin(d.O), y, x * Math.sin(d.O) + z * Math.cos(d.O)); }
const T0 = 9; // instante congelado para la trilateración
const used = (() => { const up = USER.clone().normalize(); const arr = []; for (let i = 0; i < NS; i++) { const p = satPos(i, T0); const el = p.clone().sub(USER).normalize().dot(up); arr.push([el, i]); } arr.sort((a, b) => b[0] - a[0]); return arr.slice(0, 4).map(a => a[1]); })();
const goldMat = new THREE.MeshStandardMaterial({ color: 0xc89a4a, metalness: .8, roughness: .35 }), panelMat = new THREE.MeshStandardMaterial({ color: 0x1b3b7a, metalness: .5, roughness: .3, emissive: 0x050c20 });
function makeSat() { const g = new THREE.Group(); const body = new THREE.Mesh(new THREE.BoxGeometry(1, 1.4, 1), goldMat); g.add(body); g.userData.body = body;
  for (const s of [-1, 1]) { const arm = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 1.2, 6), goldMat); arm.rotation.z = Math.PI / 2; arm.position.x = s * 1.05; g.add(arm); const pn = new THREE.Mesh(new THREE.BoxGeometry(2.6, .04, 1.1), panelMat); pn.position.x = s * 2.9; g.add(pn); }
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(.35, .25, .3, 16), new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: .4, roughness: .4 })); ant.position.y = -.85; g.add(ant); return g; }
const satGlowMat = new THREE.SpriteMaterial({ map: SOFT, color: new THREE.Color(1.5, 1.1, .6), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
const sats = []; for (let i = 0; i < NS; i++) { const s = makeSat(); const gl = new THREE.Sprite(satGlowMat); gl.scale.setScalar(7); s.add(gl); s.userData.glow = gl; scene.add(s); sats.push(s); }
// relojes atómicos dentro del satélite protagonista
const hero = sats[used[0]]; const clocks = new THREE.Group(); hero.add(clocks); clocks.visible = false;
for (const x of [-.22, .22]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .7, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, .7, .25) })); c.position.set(x, 0, 0); clocks.add(c); }
const heroX = xray(new THREE.Color(.35, .7, 1.2));
// pulsos de señal: esferas que crecen desde cada satélite
const pulses = []; for (let i = 0; i < NS; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), xray(new THREE.Color(.3, .75, 1.4))); scene.add(m); pulses.push(m); }
// esferas de trilateración (radio = distancia satélite-usuario)
const tri = used.map((i, k) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), xray(new THREE.Color(...[[1.3, .6, .25], [.35, .75, 1.4], [.6, 1.3, .55], [1.3, .4, .9]][k]))); scene.add(m); return m; });
const ringGeo = new THREE.BufferGeometry(); ringGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(129 * 3), 3)); const ring = new THREE.Line(ringGeo, new THREE.LineBasicMaterial({ color: new THREE.Color(1.6, 1.4, .8) })); scene.add(ring); ring.frustumCulled = false;
function setRing(a, b) { // círculo de intersección de dos esferas centradas en a, b que pasan por USER
  const ab = b.clone().sub(a), d = ab.length(), n = ab.clone().normalize(); const ra = a.distanceTo(USER), rb = b.distanceTo(USER); const x = (d * d + ra * ra - rb * rb) / (2 * d); const r = Math.sqrt(Math.max(0, ra * ra - x * x));
  const c = a.clone().addScaledVector(n, x); const u = V3(0, 1, 0).cross(n).normalize(), v = n.clone().cross(u); const p = ringGeo.attributes.position;
  for (let i = 0; i <= 128; i++) { const t = i / 128 * Math.PI * 2; p.setXYZ(i, c.x + (u.x * Math.cos(t) + v.x * Math.sin(t)) * r, c.y + (u.y * Math.cos(t) + v.y * Math.sin(t)) * r, c.z + (u.z * Math.cos(t) + v.z * Math.sin(t)) * r); } p.needsUpdate = true; }
const beamGeo = new THREE.BufferGeometry(); beamGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(8 * 6), 3)); const beams = new THREE.LineSegments(beamGeo, new THREE.LineBasicMaterial({ color: new THREE.Color(.5, .9, 1.6), transparent: true, opacity: .7 })); scene.add(beams); beams.frustumCulled = false;
function setBeams(list, a) { const p = beamGeo.attributes.position; for (let k = 0; k < 8; k++) { const s = list[k]; if (s) { p.setXYZ(k * 2, s.x, s.y, s.z); p.setXYZ(k * 2 + 1, USER.x, USER.y, USER.z); } else { p.setXYZ(k * 2, 0, 0, 0); p.setXYZ(k * 2 + 1, 0, 0, 0); } } p.needsUpdate = true; beams.material.opacity = a; beams.visible = a > .01; }
const P = new Particles(8000, { size: 200, seed: 5 }); scene.add(P.obj);

// ==========================================================================
// HUD
// ==========================================================================
function rr(x, y, w, h, r) { g2.beginPath(); g2.moveTo(x + r, y); g2.arcTo(x + w, y, x + w, y + h, r); g2.arcTo(x + w, y + h, x, y + h, r); g2.arcTo(x, y + h, x, y, r); g2.arcTo(x, y, x + w, y, r); g2.closePath(); }
// móvil con mapa: el punto azul en (dx, dy) píxeles respecto al centro; err = radio del halo de error
function phone(a, dx = 0, dy = 0, err = 30, pan = 0, label = null, ghost = null) { if (a <= .01) return; const w = 520, h = 1040, x = W / 2 - w / 2, y = 470;
  g2.save(); g2.globalAlpha = a; g2.shadowColor = 'rgba(0,0,0,.7)'; g2.shadowBlur = 50; g2.fillStyle = '#0b0e13'; rr(x - 18, y - 18, w + 36, h + 36, 64); g2.fill(); g2.shadowBlur = 0;
  g2.save(); rr(x, y, w, h, 48); g2.clip(); g2.fillStyle = '#e9e4da'; g2.fillRect(x, y, w, h);
  // calles y manzanas deterministas
  const r = rng(77); g2.translate(W / 2 - pan, y + h / 2); g2.fillStyle = '#d7e8c8'; for (let i = 0; i < 14; i++) { g2.fillRect((r() - .5) * 1600, (r() - .5) * 1100, 60 + r() * 140, 50 + r() * 120); }
  g2.fillStyle = '#b9d6ee'; g2.beginPath(); g2.ellipse(-420, 260, 260, 140, .4, 0, 7); g2.fill();
  g2.strokeStyle = '#ffffff'; for (let i = -12; i <= 12; i++) { g2.lineWidth = i % 4 ? 10 : 22; g2.beginPath(); g2.moveTo(i * 120 - 40, -700); g2.lineTo(i * 120 + 60, 700); g2.stroke(); g2.beginPath(); g2.moveTo(-1500, i * 110); g2.lineTo(1500, i * 110 + 40); g2.stroke(); }
  g2.strokeStyle = '#f2c46d'; g2.lineWidth = 26; g2.beginPath(); g2.moveTo(-1500, -80); g2.bezierCurveTo(-400, -260, 300, 120, 1500, -40); g2.stroke();
  g2.restore();
  const cx = W / 2 + dx, cy = y + h / 2 + dy;
  if (ghost) { g2.fillStyle = 'rgba(255,106,74,.18)'; g2.beginPath(); g2.arc(W / 2 + ghost[0], y + h / 2 + ghost[1], 40, 0, 7); g2.fill(); }
  g2.save(); rr(x, y, w, h, 48); g2.clip(); g2.fillStyle = 'rgba(66,133,244,.18)'; g2.beginPath(); g2.arc(cx, cy, err, 0, 7); g2.fill(); g2.strokeStyle = 'rgba(66,133,244,.5)'; g2.lineWidth = 2; g2.stroke();
  g2.fillStyle = '#fff'; g2.beginPath(); g2.arc(cx, cy, 22, 0, 7); g2.fill(); g2.fillStyle = '#4285f4'; g2.beginPath(); g2.arc(cx, cy, 15, 0, 7); g2.fill(); g2.restore();
  g2.fillStyle = '#0b0e13'; rr(W / 2 - 70, y + 16, 140, 34, 17); g2.fill(); g2.restore();
  if (label) txt(label, cx, cy - 60, 30, { font: 'Montserrat', weight: 800, alpha: a, fill: '#1d2a3a', shadow: 0 }); }
function dial(cx, cy, r, ang, label, val, col, a) { if (a <= .01) return; g2.save(); g2.globalAlpha = a; g2.fillStyle = 'rgba(5,8,13,.75)'; g2.beginPath(); g2.arc(cx, cy, r + 14, 0, 7); g2.fill();
  g2.strokeStyle = col; g2.lineWidth = 5; g2.shadowColor = col; g2.shadowBlur = 16; g2.beginPath(); g2.arc(cx, cy, r, 0, 7); g2.stroke(); g2.shadowBlur = 0;
  for (let i = 0; i < 60; i++) { const q = i / 60 * Math.PI * 2; const l = i % 5 ? 8 : 18; g2.lineWidth = i % 5 ? 2 : 4; g2.beginPath(); g2.moveTo(cx + Math.sin(q) * (r - 6), cy - Math.cos(q) * (r - 6)); g2.lineTo(cx + Math.sin(q) * (r - 6 - l), cy - Math.cos(q) * (r - 6 - l)); g2.stroke(); }
  g2.strokeStyle = '#fff'; g2.lineWidth = 6; g2.lineCap = 'round'; g2.beginPath(); g2.moveTo(cx, cy); g2.lineTo(cx + Math.sin(ang) * r * .8, cy - Math.cos(ang) * r * .8); g2.stroke(); g2.fillStyle = col; g2.beginPath(); g2.arc(cx, cy, 9, 0, 7); g2.fill(); g2.restore();
  txt(label, cx, cy - r - 50, 24, { spacing: 5, alpha: a, fill: col }); if (val) txt(val, cx, cy + r + 56, 40, { font: 'Montserrat', weight: 800, alpha: a }); }
function typeLine(s, x, y, k, a, size = 34, col = '#7fd4ff') { if (a <= .01) return; const n = Math.floor(s.length * clamp(k)); txt(s.slice(0, n) + (k < 1 && Math.floor(Date.now() / 1e9) === 0 ? '▌' : ''), x, y, size, { align: 'left', font: 'Montserrat', weight: 800, alpha: a, fill: col }); }
function packet(a, k) { if (a <= .01) return; const x = 90, y = 1330, w = 900, h = 260; g2.save(); g2.globalAlpha = a * .7; g2.fillStyle = '#05080d'; g2.fillRect(x, y, w, h); g2.globalAlpha = a; g2.strokeStyle = '#7fd4ff'; g2.lineWidth = 2; g2.strokeRect(x, y, w, h); g2.restore();
  txt('MENSAJE', x + 30, y + 36, 20, { align: 'left', spacing: 6, alpha: a * .85, fill: '#e3a372' });
  typeLine('SOY EL SATÉLITE 12', x + 30, y + 92, smooth(0, .3, k), a); typeLine('ESTOY AQUÍ: 26.560 km · 55° · …', x + 30, y + 146, smooth(.3, .6, k), a); typeLine('SON LAS 12:00:00,000000000', x + 30, y + 200, smooth(.6, .95, k), a, 34, '#ffe2c0'); }
function microBar(x, y, w, v, max, label, col, a) { if (a <= .01) return; txt(label, x, y - 40, 24, { align: 'left', spacing: 4, alpha: a, fill: col }); g2.save(); g2.globalAlpha = a * .25; g2.fillStyle = '#fff'; g2.fillRect(x, y, w, 26); g2.globalAlpha = a; g2.fillStyle = col; g2.shadowColor = col; g2.shadowBlur = 14;
  const f = v / max; if (f >= 0) g2.fillRect(x + w / 2, y, w / 2 * f, 26); else g2.fillRect(x + w / 2 + w / 2 * f, y, -w / 2 * f, 26); g2.restore(); g2.save(); g2.globalAlpha = a; g2.fillStyle = '#fff'; g2.fillRect(x + w / 2 - 2, y - 10, 4, 46); g2.restore(); }

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.near = 10; camera.far = 2e6; camera.fov = 40;
  let bloomS = .55, flash = 0, ca = .0013, fade = 0, grain = .035, expo = 1, dim = 0;
  P.begin(); P.mat.size = 200;
  const tt = (t >= TL.one && t < TL.net) ? T0 : t * .35 + T0 - TL.one * .35 * 0; const S = 380;
  for (let i = 0; i < NS; i++) { satPos(i, tt, sats[i].position); sats[i].lookAt(0, 0, 0); sats[i].scale.setScalar(S); sats[i].visible = true; sats[i].userData.glow.visible = true; pulses[i].visible = false; }
  hero.userData.body.material = goldMat; clocks.visible = false; tri.forEach(m => m.visible = false); ring.visible = false; setBeams([], 0); userGlow.scale.setScalar(900); userGlow.material.opacity = 0;
  earth.rotation.y = 0;
  for (const c of ['how', 'clock', 'light', 'one', 'fourq', 'einstein', 'net', 'km10', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];
  const pulseAll = (amp, list = null) => { for (let i = 0; i < NS; i++) { if (list && !list.includes(i)) continue; const age = fract(t * .5 + i * .137); pulses[i].visible = amp > .01; pulses[i].position.copy(sats[i].position); pulses[i].scale.setScalar(200 + age * 9000); pulses[i].material.uniforms.uA.value = amp * (1 - age) * .8; } };

  if (t < TL.how) {
    // A · gancho: la constelación emitiendo la hora; zoom al usuario
    const lt = t; pulseAll(smooth(0, .4, lt)); const z = smooth(TL.phone - .2, TL.how, t);
    camOrbit(V3().lerp(USER, z * .6), lerp(lerp(98000, 90000, lt / 3.4), 30000, easeInOut(z)), .75 + lt * .03, lerp(.35, .55, z), 40); fade = 1 - smooth(0, .3, t);
    userGlow.material.opacity = smooth(TL.phone, TL.phone + .4, t); userGlow.scale.setScalar(lerp(900, 1600, Math.sin(t * 6) * .5 + .5));
    setBeams(used.map(i => sats[i].position), smooth(TL.phone, TL.phone + .5, t) * .8);
    hud.push(() => { bigStat('AHORA MISMO', '+30 SATÉLITES', 430, smooth(0, .25, lt) * (1 - smooth(TL.phone - .15, TL.phone + .1, lt)), .3 + lt * .3);
      titleHUD('EMITIENDO LA HORA', 'Y TU MÓVIL SABE DÓNDE ESTÁS', smooth(TL.phone, TL.phone + .3, lt), 330);
      const q = project(USER); txt('TÚ', q.x + 50, q.y - 30, 34, { align: 'left', font: 'Montserrat', weight: 800, alpha: smooth(TL.phone + .2, TL.phone + .5, lt), fill: '#7fd4ff' }); });
  } else if (t < TL.clock) {
    // B · una vuelta cada 12 h a 20.200 km
    const lt = t - TL.how; const i0 = used[0]; for (let i = 0; i < NS; i++) sats[i].visible = i === i0 || lt < .3; sats[i0].scale.setScalar(900);
    P.mat.size = 700; { const d = satDef[i0]; for (let k = 0; k < 900; k++) { const u = k / 900 * Math.PI * 2; const ang = d.u0 + OMEGA * tt; const dd = (u - ang % (Math.PI * 2) + Math.PI * 4) % (Math.PI * 2); const p = V3(); const save = satDef[i0].u0; satDef[i0].u0 = u - OMEGA * tt; satPos(i0, tt, p); satDef[i0].u0 = save; const f = .5 * (1 - dd / (Math.PI * 2)) + .1; P.push(p.x, p.y, p.z, 1.3 * f, .7 * f, .3 * f); } }
    camOrbit(V3(0, 0, 0), lerp(95000, 85000, lt / 5.5), .4 + lt * .04, .9, 40);
    hud.push(() => { txt('¿CÓMO?', W / 2, 330, 64, { font: 'Montserrat', weight: 800, alpha: smooth(0, .2, lt) * (1 - smooth(TL.orbit - TL.how - .1, TL.orbit - TL.how + .1, lt)) });
      bigStat('UNA VUELTA CADA', '12 HORAS', 430, smooth(TL.orbit - TL.how, TL.orbit - TL.how + .3, lt) * (1 - smooth(TL.alt - TL.how - .1, TL.alt - TL.how + .1, lt)), .5);
      bigStat('DE ALTURA', '20.200 km', 430, smooth(TL.alt - TL.how, TL.alt - TL.how + .3, lt), .5);
      const a2 = smooth(TL.alt - TL.how + .2, TL.alt - TL.how + .6, lt); const pe = project(sats[i0].position.clone().normalize().multiplyScalar(RE)), ps = project(sats[i0].position);
      g2.save(); g2.globalAlpha = a2; g2.strokeStyle = '#e3a372'; g2.lineWidth = 3; g2.setLineDash([12, 8]); g2.beginPath(); g2.moveTo(pe.x, pe.y); g2.lineTo(ps.x, ps.y); g2.stroke(); g2.restore(); });
  } else if (t < TL.light) {
    // C · relojes atómicos dentro; D · el mensaje que emite sin parar
    const lt = t - TL.clock; const sp = sats[used[0]].position.clone(); hero.scale.setScalar(380); hero.userData.glow.visible = false; const xr = smooth(.3, .8, lt) > .5 && t < TL.msg + .2; if (xr) { hero.userData.body.material = heroX; clocks.visible = true; bloomS = .9; }
    const dirOut = sp.clone().normalize(); const side = V3(0, 1, 0).cross(dirOut).normalize();
    const camP = sp.clone().addScaledVector(SUN, lerp(2600, 3400, lt / 9.7)).addScaledVector(side, lerp(900, 400, lt / 9.7)).add(V3(0, 600, 0)); camera.position.copy(camP); camera.lookAt(sp.clone().add(V3(0, t > TL.say ? 700 : 0, 0)));
    if (t > TL.msg) { const age = fract((t - TL.msg) * .7); pulses[used[0]].visible = true; pulses[used[0]].position.copy(sp); pulses[used[0]].scale.setScalar(300 + age * 6000); pulses[used[0]].material.uniforms.uA.value = (1 - age) * .9; }
    hud.push(() => { callout(sp.clone(), 80, -260, 'RELOJES ATÓMICOS', 'precisos a la milmillonésima de segundo', smooth(.9, 1.3, lt) * (1 - smooth(TL.msg - TL.clock - .2, TL.msg - TL.clock, lt)));
      bigStat('ERROR', '0,000000001 s', 430, smooth(TL.clock - TL.clock + 2.4, 2.8, lt) * (1 - smooth(TL.msg - TL.clock - .2, TL.msg - TL.clock, lt)), .5);
      titleHUD('EMITE SIN PARAR', 'UN MENSAJE', smooth(TL.msg - TL.clock, TL.msg - TL.clock + .3, lt), 330); packet(smooth(TL.say - TL.clock - .2, TL.say - TL.clock + .1, lt), (t - TL.say) / 3.2); });
  } else if (t < TL.one) {
    // E · viaja a la velocidad de la luz y tarda 0,07 s; F · el retraso da la distancia
    const lt = t - TL.light; const sp = sats[used[0]].position; const k = smooth(.5, TL.delay - TL.light + 1.6, lt); const pp = sp.clone().lerp(USER, easeInOut(k));
    for (let i = 0; i < 400; i++) { const q = sp.clone().lerp(USER, easeInOut(Math.max(0, k - i * .0015))); const f = (1 - i / 400) * 1.2; P.push(q.x, q.y, q.z, .5 * f, .9 * f, 1.6 * f); } P.mat.size = 1100;
    setBeams([sp], .35); userGlow.material.opacity = 1; userGlow.scale.setScalar(1400);
    const mid = sp.clone().lerp(USER, .5); camOrbit(mid, lerp(40000, 36000, lt / 10), .35 + lt * .015, .25, 40);
    const ms = 67 * easeInOut(k);
    hud.push(() => { titleHUD('VIAJA A LA VELOCIDAD DE LA LUZ', 'Y AUN ASÍ TARDA', smooth(.1, .4, lt) * (1 - smooth(TL.delay - TL.light - .1, TL.delay - TL.light + .1, lt)), 330);
      bigStat('RETRASO', (ms / 1000).toFixed(3).replace('.', ',') + ' s', 430, smooth(TL.delay - TL.light, TL.delay - TL.light + .3, lt) * (1 - smooth(TL.compare - TL.light - .1, TL.compare - TL.light + .1, lt)), .5);
      const c0 = TL.compare - TL.light; const a3 = smooth(c0, c0 + .3, lt);
      dial(W / 2 - 220, 1480, 120, (t * 2) % 6.283, 'HORA DEL MENSAJE', '12:00:00,000', '#ffb27a', a3); dial(W / 2 + 220, 1480, 120, (t * 2 + .42) % 6.283, 'HORA DE TU MÓVIL', '12:00:00,067', '#7fd4ff', a3);
      bigStat('0,067 s × LUZ =', '20.200 km', 430, smooth(TL.dist - TL.light + .3, TL.dist - TL.light + .7, lt), .5); });
  } else if (t < TL.fourq) {
    // G · trilateración: esfera → círculo → punto
    const lt = t - TL.one; const sp = used.map(i => sats[i].position.clone());
    const a1 = smooth(.2, 1, lt), a2 = smooth(TL.two - TL.one, TL.two - TL.one + .8, lt), a3 = smooth(TL.three - TL.one, TL.three - TL.one + .8, lt);
    [a1, a2, a3].forEach((a, k) => { tri[k].visible = a > .01; tri[k].position.copy(sp[k]); tri[k].scale.setScalar(sp[k].distanceTo(USER) * lerp(.3, 1, easeOut(a))); tri[k].material.uniforms.uA.value = a * (k ? .55 : .7) * (1 - a3 * .4 * (k < 2)); });
    if (a2 > .6) { ring.visible = true; setRing(sp[0], sp[1]); ring.material.color.setRGB(1.6 * (1 - a3 * .5), 1.4, .8); }
    userGlow.material.opacity = a3; userGlow.scale.setScalar(lerp(4000, 1200, a3)); bloomS = .7;
    camOrbit(USER.clone().multiplyScalar(lerp(.2, .9, smooth(TL.three - .2, TL.fourq, t))), lerp(130000, 70000, smooth(.2, TL.three - TL.one + 1.6, lt)), .2 + lt * .05, .3, 40);
    hud.push(() => { titleHUD('CON 1 SATÉLITE', 'ESTÁS EN UNA ESFERA', smooth(.2, .5, lt) * (1 - smooth(TL.two - TL.one - .1, TL.two - TL.one + .1, lt)), 330);
      titleHUD('CON 2', 'EN UN CÍRCULO', smooth(TL.two - TL.one, TL.two - TL.one + .3, lt) * (1 - smooth(TL.three - TL.one - .1, TL.three - TL.one + .1, lt)), 330);
      titleHUD('CON 3', 'EN UN SOLO PUNTO', smooth(TL.three - TL.one, TL.three - TL.one + .3, lt), 330);
      const q = project(USER); txt('TÚ', q.x + 50, q.y - 30, 34, { align: 'left', font: 'Montserrat', weight: 800, alpha: a3, fill: '#7fd4ff' }); });
  } else if (t < TL.einstein) {
    // H · ¿para qué el cuarto? el reloj del móvil es malo: 1 µs = 300 m
    const lt = t - TL.fourq; dim = .75; camOrbit(USER.clone().multiplyScalar(.9), 70000, .2 + (t - TL.one) * .05, .3, 40);
    const errOn = smooth(TL.err - .2, TL.err + .8, t), fixK = smooth(TL.fix + 2.2, TL.fix + 3.2, t); const e = errOn * (1 - fixK);
    hud.push(() => { txt('¿Y PARA QUÉ EL CUARTO?', W / 2, 330, 50, { font: 'Montserrat', weight: 800, alpha: smooth(0, .2, lt) * (1 - smooth(TL.bad - TL.fourq - .1, TL.bad - TL.fourq + .1, lt)) });
      phone(smooth(TL.bad - TL.fourq - .3, TL.bad - TL.fourq, lt), 160 * e, -110 * e, lerp(30, 220, e), 0, null, e > .05 ? [0, 0] : null);
      titleHUD('EL RELOJ DE TU MÓVIL', 'ES MALO', smooth(TL.bad - TL.fourq, TL.bad - TL.fourq + .3, lt) * (1 - smooth(TL.err - TL.fourq - .1, TL.err - TL.fourq + .1, lt)), 330);
      bigStat('UNA MILLONÉSIMA DE SEGUNDO', '= 300 m', 400, smooth(TL.err - TL.fourq, TL.err - TL.fourq + .3, lt) * (1 - smooth(TL.fix - TL.fourq - .1, TL.fix - TL.fourq + .1, lt)), .5);
      titleHUD('EL 4.º SATÉLITE CALCULA', 'LA HORA EXACTA', smooth(TL.fix - TL.fourq, TL.fix - TL.fourq + .3, lt), 330); });
  } else if (t < TL.net) {
    // I · Einstein: −7 µs/día por velocidad, +45 µs/día por gravedad
    const lt = t - TL.einstein; const sp = sats[used[0]].position.clone(); hero.scale.setScalar(380); const dirOut = sp.clone().normalize(); const side = V3(0, 1, 0).cross(dirOut).normalize();
    hero.userData.glow.visible = false; camera.position.copy(sp).addScaledVector(dirOut, 9000 + lt * 250).addScaledVector(side, 4500).add(V3(0, 1200, 0)); camera.lookAt(sp.clone().lerp(V3(), .3)); dim = .3;
    // estela de velocidad
    { const i0 = used[0]; for (let k = 0; k < 600; k++) { const p = V3(); const save = satDef[i0].u0; satDef[i0].u0 = save - k * .0006; satPos(i0, tt, p); satDef[i0].u0 = save; const f = (1 - k / 600) * .7 * smooth(TL.speed - TL.einstein, TL.speed - TL.einstein + .5, lt); P.push(p.x, p.y, p.z, 1.3 * f, .7 * f, .3 * f); } P.mat.size = 120; }
    const vS = smooth(TL.slow - .2, TL.slow + .8, t), vG = smooth(TL.p45 - .3, TL.p45 + .8, t);
    hud.push(() => { bigStat('UN PROBLEMA QUE NADIE ESPERABA', 'EINSTEIN', 430, smooth(TL.einstein - TL.einstein + .9, 1.3, lt) * (1 - smooth(TL.speed - TL.einstein - .1, TL.speed - TL.einstein + .1, lt)), .5);
      bigStat('VAN A', '14.000 km/h', 430, smooth(TL.speed - TL.einstein, TL.speed - TL.einstein + .3, lt) * (1 - smooth(TL.grav - TL.einstein - .1, TL.grav - TL.einstein + .1, lt)), .5);
      titleHUD('ALLÍ ARRIBA', 'LA GRAVEDAD ES MÁS DÉBIL', smooth(TL.grav - TL.einstein, TL.grav - TL.einstein + .3, lt), 330);
      const aB = smooth(TL.rel - TL.einstein, TL.rel - TL.einstein + .4, lt);
      microBar(140, 1460, 800, -7 * vS, 50, 'VELOCIDAD → SU TIEMPO VA MÁS DESPACIO', '#7fd4ff', aB); txt(vS > .05 ? '−7 µs/día' : '', 140 + 400 - 60, 1545, 34, { align: 'right', font: 'Montserrat', weight: 800, alpha: aB, fill: '#7fd4ff' });
      microBar(140, 1640, 800, 45 * vG, 50, 'GRAVEDAD DÉBIL → SU TIEMPO VA MÁS DEPRISA', '#ffb27a', smooth(TL.grav - TL.einstein, TL.grav - TL.einstein + .4, lt)); txt(vG > .05 ? '+45 µs/día' : '', 140 + 400 + 60, 1725, 34, { align: 'left', font: 'Montserrat', weight: 800, alpha: smooth(TL.p45 - TL.einstein, TL.p45 - TL.einstein + .3, lt), fill: '#ffb27a' }); });
  } else if (t < TL.km10) {
    // J · +38 µs/día; los ajustan en tierra para que vayan lentos
    const lt = t - TL.net; camOrbit(V3(0, 0, 0), lerp(90000, 80000, lt / 8), 1.2 + lt * .03, .25, 40); pulseAll(.5); dim = .45;
    hud.push(() => { bigStat('SUS RELOJES ADELANTAN', '+38 µs/día', 430, smooth(0, .3, lt) * (1 - smooth(TL.tune - TL.net - .1, TL.tune - TL.net + .1, lt)), .5);
      dial(W / 2 - 220, 1400, 130, (t * 1.5 + .4) % 6.283, 'SATÉLITE', null, '#ffb27a', smooth(.4, .8, lt) * (1 - smooth(TL.tune - TL.net - .1, TL.tune - TL.net + .1, lt))); dial(W / 2 + 220, 1400, 130, (t * 1.5) % 6.283, 'TIERRA', null, '#7fd4ff', smooth(.4, .8, lt) * (1 - smooth(TL.tune - TL.net - .1, TL.tune - TL.net + .1, lt)));
      titleHUD('ANTES DEL LANZAMIENTO', 'LOS AJUSTAN', smooth(TL.tune - TL.net, TL.tune - TL.net + .3, lt), 330);
      const a = smooth(TL.tune - TL.net + .6, TL.tune - TL.net + 1, lt); txt('10,23 MHz', W / 2, 1300, 64, { font: 'Montserrat', weight: 800, alpha: a * (1 - smooth(TL.tune - TL.net + 1.6, TL.tune - TL.net + 2.2, lt)) });
      txt('10,22999999543 MHz', W / 2, 1300, 62, { font: 'Montserrat', weight: 800, alpha: a * smooth(TL.tune - TL.net + 1.6, TL.tune - TL.net + 2.2, lt), fill: copperGrad(150, 930, 1300, .5) });
      txt('en tierra van un poco lentos… y arriba, exactos', W / 2, 1390, 30, { weight: 300, alpha: a * smooth(TL.tune - TL.net + 2.2, TL.tune - TL.net + 2.6, lt) }); });
  } else if (t < TL.brand) {
    // K · sin corrección: 10 km más cada día; Einstein tenía razón
    const lt = t - TL.km10; dim = .8; camOrbit(USER.clone().multiplyScalar(.9), 70000, .9 + lt * .02, .3, 40);
    const day = clamp((t - TL.km10 - .6) / 3) * 3; const ok = smooth(TL.map, TL.map + .6, t);
    hud.push(() => { titleHUD('SIN ESA CORRECCIÓN', '+10 km DE ERROR CADA DÍA', smooth(.1, .4, lt) * (1 - smooth(TL.map - TL.km10 - .1, TL.map - TL.km10 + .1, lt)), 330);
      phone(1, 0, 0, 30, (1 - ok) * day * 420, (1 - ok) > .5 ? null : 'TÚ', null);
      if (ok < .5) { txt('DÍA ' + Math.floor(day + 1), W / 2, 1600, 40, { font: 'Montserrat', weight: 800, alpha: smooth(.3, .6, lt), fill: '#ff8a6a' }); txt('error: ' + fmt(day * 11.4) + ' km', W / 2, 1650, 30, { weight: 600, alpha: smooth(.3, .6, lt) }); }
      titleHUD('CADA VEZ QUE USAS EL MAPA', 'COMPRUEBAS QUE EINSTEIN', smooth(TL.map - TL.km10, TL.map - TL.km10 + .3, lt) * (1 - smooth(TL.right - TL.km10 - .1, TL.right - TL.km10 + .1, lt)), 330);
      titleHUD('COMPRUEBAS QUE EINSTEIN', 'TENÍA RAZÓN', smooth(TL.right - TL.km10, TL.right - TL.km10 + .3, lt), 330); });
  } else {
    // L · marca
    const lt = t - TL.brand; camOrbit(V3(0, 0, 0), 100000 + lt * 4000, 1.5 + lt * .05, .3, 40); pulseAll(.4); expo = .9; fade = Math.min(.5, lt * .45);
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  P.end(); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (dim > 0) hud.unshift(() => { g2.save(); g2.globalAlpha = dim * .7; g2.fillStyle = '#02050b'; g2.fillRect(0, 0, W, H); g2.restore(); });
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
function renderCover() { renderFrame(TL.three + 1.2); coverText('¿CÓMO SABE', 'DÓNDE ESTÁS?', 'Tu GPS funciona gracias a Einstein'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
