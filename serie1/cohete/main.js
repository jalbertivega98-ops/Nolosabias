// NO LO SABÍAS — "¿Cómo llega un cohete a la órbita?" (Falcon 9)
// Escena 3D programada con Three.js; window.renderFrame(t) dibuja el instante t del vídeo final.
// Referencia: Falcon 9 (SpaceX): 549 t al despegue, ~70 m, 3,7 m de diámetro; 9 motores Merlin 1D (queroseno RP-1 + oxígeno líquido),
// cámara a ~97 bar, gases a ~2,8 km/s; separación de etapas hacia los 2:30; 2.ª etapa con un Merlin de vacío.
// Órbita baja: ~7,8 km/s ≈ 28.000 km/h. En la ISS (≈400 km) la gravedad es ≈ 90 % de la de la superficie.
import { THREE, W, H, TL, clamp, lerp, smooth, easeInOut, easeOut, easeIn, rng, shake, V3,
  renderer, g2, camera, SOFT, sea, U, SUN_DIR, skyDome, abyss, ocean, Particles,
  txt, copperGrad, project, fmt, callout, arrow2D, titleHUD, fract, emitJet, camOrbit, arrowXY, bigStat, drawBrand, coverText, finish } from '../../lib/core.js';

abyss.visible = false; ocean.visible = false; skyDome.renderOrder = -1;
// ==========================================================================
// MATERIALES
// ==========================================================================
const white = new THREE.MeshStandardMaterial({ color: 0xe9ecef, roughness: .45, metalness: .1 });
const black = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: .55, metalness: .3 });
const bellMat = new THREE.MeshStandardMaterial({ color: 0x3a3330, roughness: .35, metalness: .85, side: THREE.DoubleSide, emissive: new THREE.Color(1.4, .45, .12), emissiveIntensity: 0 });
const xrayMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  uniforms: { uA: { value: 1 }, uCol: { value: new THREE.Color(.3, .7, 1.15) } },
  vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform float uA; uniform vec3 uCol; varying vec3 vN; varying vec3 vV; void main(){ float f=pow(clamp(1.-abs(dot(vN,vV)),0.,1.),2.); gl_FragColor=vec4(uCol*(f*.8+.05),uA*(f*.7+.05)); }` });
const loxMat = new THREE.MeshStandardMaterial({ color: 0x3c8cff, emissive: new THREE.Color(.25, .6, 1.4), emissiveIntensity: .7, transparent: true, opacity: .85, roughness: .3 });
const rpMat = new THREE.MeshStandardMaterial({ color: 0xd88a3a, emissive: new THREE.Color(1.4, .6, .2), emissiveIntensity: .7, transparent: true, opacity: .85, roughness: .3 });
const plumeMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  uniforms: { uA: { value: 0 }, uT: { value: 0 }, uWide: { value: 0 } },
  vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform float uA,uT,uWide; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    float h(float x){return fract(sin(x*91.7)*4375.5);}
    void main(){ float y=vUv.y; float f=pow(clamp(abs(dot(vN,vV)),0.,1.),1.5);
      float flick=.85+.15*sin(uT*60.+y*30.);
      float diam=step(.5,fract(y*9.-uT*.0))*0.;
      vec3 core=mix(vec3(1.4,1.2,1.0),vec3(2.2,.9,.3),smoothstep(.85,.4,y));
      vec3 col=mix(core,vec3(.4,.6,1.4),uWide*.6);
      float a=uA*f*smoothstep(0.,.25,y)*pow(y,.6)*flick;
      gl_FragColor=vec4(col*a,a); }` });

// ==========================================================================
// COHETE (metros; y = arriba, base en y = 0)
// ==========================================================================
const R = 1.83;
function cyl(r0, r1, y0, y1, mat, seg = 48) { const g = new THREE.CylinderGeometry(r1, r0, y1 - y0, seg, 1, true); g.translate(0, (y0 + y1) / 2, 0); return new THREE.Mesh(g, mat); }
function lathe(pts, mat, seg = 48) { return new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg), mat); }
function bell(rt, re, len) { const pts = []; for (let i = 0; i <= 16; i++) { const u = i / 16; pts.push([lerp(rt, re, Math.pow(u, .65)), -u * len]); } return lathe(pts, bellMat, 32); }
function buildRocket() {
  const rk = new THREE.Group(); const s1 = new THREE.Group(), s2 = new THREE.Group(); rk.add(s1); rk.add(s2);
  const shells = [];
  const add = (grp, m) => { grp.add(m); if (m.material !== bellMat) shells.push(m); return m; };
  add(s1, cyl(R, R, 1.2, 41.2, white)); add(s1, cyl(R, R, 41.2, 46.8, black));
  add(s1, lathe([[0, 1.2], [R, 1.2]], black)); // fondo
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + Math.PI / 4; const leg = new THREE.Mesh(new THREE.BoxGeometry(.5, 9, .25), black); leg.position.set(Math.cos(a) * (R + .1), 5.6, Math.sin(a) * (R + .1)); leg.rotation.y = -a; s1.add(leg); shells.push(leg);
    const gf = new THREE.Mesh(new THREE.BoxGeometry(1.2, .1, 1.4), black); gf.position.set(Math.cos(a + Math.PI / 4) * (R + .7), 45.5, Math.sin(a + Math.PI / 4) * (R + .7)); gf.rotation.y = -(a + Math.PI / 4); s1.add(gf); shells.push(gf); }
  // octaweb: 8 + 1 motores
  const bells = []; for (let i = 0; i < 9; i++) { const a = i / 8 * Math.PI * 2; const r = i === 8 ? 0 : 1.25; const b = bell(.22, .46, 1.35); b.position.set(Math.cos(a) * r, 1.2, Math.sin(a) * r); s1.add(b); bells.push(b); }
  // segunda etapa y cofia
  add(s2, cyl(R, R, 46.8, 59.8, white));
  const fair = []; for (let i = 0; i <= 20; i++) { const u = i / 20; fair.push([u < .25 ? 2.6 : 2.6 * Math.sqrt(Math.max(0, 1 - Math.pow((u - .25) / .75, 2.2))), 59.8 + .4 + u * 12.4]); }
  add(s2, lathe([[R, 59.8], [2.6, 60.2], ...fair], white));
  const mvac = bell(.3, 1.3, 3.2); mvac.position.y = 46.8; mvac.visible = false; s2.add(mvac);
  // anillo de cobre (logotipo) en la cofia
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.75, .09, 8, 48, Math.PI * 1.7), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.3, .66, .36) })); ring.position.set(0, 64.5, 2.62); ring.rotation.z = .5; s2.add(ring);
  // depósitos (visibles en rayos X)
  const tanks = new THREE.Group(); tanks.visible = false; rk.add(tanks);
  const T = [[2, 22.5, rpMat, s1], [23.5, 40.6, loxMat, s1], [47.8, 52.5, rpMat, s2], [53, 59.2, loxMat, s2]].map(([y0, y1, m, st]) => { const g = new THREE.CylinderGeometry(R * .93, R * .93, 1, 40); g.translate(0, .5, 0); const me = new THREE.Mesh(g, m); me.position.y = y0; me.scale.y = y1 - y0; me.userData = { y0, y1 }; (st === s1 ? s1 : s2).add(me); me.visible = false; return me; });
  return { rk, s1, s2, shells, bells, mvac, tanks: T };
}
const ROCKET = buildRocket();
const rocket = ROCKET.rk; sea.add(rocket);
function xray(on) { for (const m of ROCKET.shells) { if (!m.userData.mat0) m.userData.mat0 = m.material; m.material = on ? xrayMat : m.userData.mat0; } for (const t of ROCKET.tanks) t.visible = !!on; }
function fill(k1, k2 = 1) { for (let i = 0; i < 4; i++) { const t = ROCKET.tanks[i], k = i < 2 ? k1 : k2; t.scale.y = Math.max(.01, (t.userData.y1 - t.userData.y0) * k); } }
// Llama (cono aditivo) bajo la primera etapa y bajo el motor de vacío
const plumeGeo = new THREE.CylinderGeometry(4.5, 1.8, 40, 40, 20, true); plumeGeo.translate(0, -20, 0);
const plume = new THREE.Mesh(plumeGeo, plumeMat); plume.position.y = 1.2 - 1.3; ROCKET.s1.add(plume);
const plume2 = new THREE.Mesh(plumeGeo, plumeMat.clone()); plume2.scale.set(.6, .8, .6); plume2.position.y = 46.8 - 3.2; ROCKET.s2.add(plume2); plume2.visible = false;

// ==========================================================================
// PLATAFORMA DE LANZAMIENTO (noche)
// ==========================================================================
const pad = new THREE.Group(); sea.add(pad);
{ const gr = new THREE.Mesh(new THREE.PlaneGeometry(20000, 20000), new THREE.MeshStandardMaterial({ color: 0x0c0e10, roughness: .95 })); gr.rotation.x = -Math.PI / 2; pad.add(gr);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(40, 2, 40), new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: .8 })); deck.position.y = -1; pad.add(deck);
  // torre de servicio (celosía)
  const tm = new THREE.MeshStandardMaterial({ color: 0x5a3a2a, roughness: .6, metalness: .5 }); const tw = new THREE.Group(); tw.position.set(-9, 0, 0); pad.add(tw);
  for (const [x, z] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) { const c = new THREE.Mesh(new THREE.BoxGeometry(.4, 80, .4), tm); c.position.set(x, 40, z); tw.add(c); }
  for (let y = 4; y < 80; y += 4) { for (const [x, z, rx, ry] of [[0, -2, 4, .3], [0, 2, 4, .3]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(rx, ry, .3), tm); b.position.set(x, y, z); tw.add(b); } const b2 = new THREE.Mesh(new THREE.BoxGeometry(.3, .3, 4), tm); b2.position.set(-2, y, 0); tw.add(b2); const b3 = b2.clone(); b3.position.x = 2; tw.add(b3); }
  // focos y luces de la zona
  const lp = new Particles(800, { size: 3, seed: 4, fog: false }); pad.add(lp.obj); const r = rng(6); lp.begin();
  for (let i = 0; i < 4; i++) { const a = i / 4 * 6.283 + .4; lp.push(Math.cos(a) * 60, 12, Math.sin(a) * 60, 3, 2.6, 2); }
  for (let y = 10; y < 80; y += 10) lp.push(-9, y, 2.3, 2.6, .3, .2);
  for (let i = 0; i < 700; i++) { const a = r() * 6.283, d = 600 + r() * 5000; lp.push(Math.cos(a) * d, 2, Math.sin(a) * d, 1.6, 1.1, .6); } lp.end();
}
const smoke = new Particles(6000, { size: 6, seed: 21, fog: true, blend: THREE.NormalBlending }); sea.add(smoke.obj);
const fire = new Particles(5000, { size: 2.4, seed: 22, fog: false }); sea.add(fire.obj);
const padKey = new THREE.SpotLight(0xffe0c0, 700, 300, .35, .6, 1.4); padKey.position.set(60, 20, 70); sea.add(padKey); sea.add(padKey.target);
const glowL = new THREE.PointLight(0xffa050, 0, 400, 1.2); sea.add(glowL);
sea.add(new THREE.HemisphereLight(0x6f8fbf, 0x120c08, .5));

// ==========================================================================
// ESPACIO (metros alrededor del cohete; la Tierra a escala angular correcta)
// ==========================================================================
const space = new THREE.Scene();
const SUN = V3(1, .35, .6).normalize();
function earthMat(scaleKm) {
  return new THREE.ShaderMaterial({ uniforms: { uSun: { value: SUN }, uS: { value: scaleKm } },
    vertexShader: `varying vec3 vP; varying vec3 vN; varying vec3 vW; void main(){ vP=normalize(position); vN=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform vec3 uSun; varying vec3 vP; varying vec3 vN; varying vec3 vW;
      float h3(vec3 p){ p=fract(p*.3183099+.1); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
      float n3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
        return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z); }
      float fbm(vec3 p){ float a=.5,s=0.; for(int i=0;i<6;i++){ s+=a*n3(p); p*=2.03; a*=.5; } return s; }
      void main(){ vec3 n=normalize(vN); float d=dot(n,uSun); float day=smoothstep(-.08,.25,d);
        float c=fbm(vP*3.2+vec3(1.7,.3,2.2)); float land=smoothstep(.52,.56,c);
        vec3 ocean=vec3(.02,.09,.2), ground=mix(vec3(.16,.2,.09),vec3(.42,.33,.2),fbm(vP*9.));
        float ice=smoothstep(.82,.9,abs(vP.y));
        vec3 col=mix(ocean,ground,land); col=mix(col,vec3(.85,.9,.95),ice);
        float cl=smoothstep(.55,.8,fbm(vP*6.+vec3(4.,1.,2.)))*.85; col=mix(col,vec3(.95),cl);
        vec3 V=normalize(cameraPosition-vW); float spec=pow(max(dot(reflect(-uSun,n),V),0.),60.)*(1.-land)*(1.-cl)*.8;
        vec3 dayC=col*(.15+1.1*max(d,0.))+vec3(1.,.9,.7)*spec;
        float city=land*(1.-cl)*step(.62,fbm(vP*40.))*.9; vec3 nightC=vec3(1.,.7,.35)*city*.7+col*.02;
        vec3 o=mix(nightC,dayC,day);
        float rim=pow(1.-max(dot(n,V),0.),3.); o+=vec3(.3,.55,1.)*rim*.9*smoothstep(-.3,.3,d);
        gl_FragColor=vec4(o,1.); }` });
}
const ES = 60000;   // radio de la Tierra en la escena "space" (unidades = m de la escena)
const earthS = new THREE.Mesh(new THREE.SphereGeometry(ES, 160, 120), earthMat(1)); space.add(earthS);
const atmoMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide, uniforms: { uSun: { value: SUN } },
  vertexShader: `varying vec3 vN; varying vec3 vW; void main(){ vN=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `uniform vec3 uSun; varying vec3 vN; varying vec3 vW; void main(){ vec3 V=normalize(cameraPosition-vW); float f=pow(1.-abs(dot(normalize(vN),V)),4.)*1.2; float d=smoothstep(-.3,.4,dot(normalize(vN),uSun)); gl_FragColor=vec4(vec3(.25,.5,1.)*f*d,f*d); }` });
const atmoS = new THREE.Mesh(new THREE.SphereGeometry(ES * 1.012, 128, 96), atmoMat); space.add(atmoS);
const stars = (() => { const n = 5000, p = new Float32Array(n * 3), c = new Float32Array(n * 3); const r = rng(12); for (let i = 0; i < n; i++) { const v = V3(r() - .5, r() - .5, r() - .5).normalize().multiplyScalar(400000); p.set([v.x, v.y, v.z], i * 3); const k = .3 + r() * .9; c.set([k, k, k * 1.1], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, map: SOFT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); })();
space.add(stars);
const sunS = new THREE.DirectionalLight(0xfff2e0, 3.0); space.add(sunS); space.add(sunS.target); space.add(new THREE.HemisphereLight(0x6fa0ff, 0x101820, .35));
const rocketS = buildRocket(); space.add(rocketS.rk);
const plumeS = new THREE.Mesh(plumeGeo, plumeMat.clone()); plumeS.material.uniforms.uWide.value = 1; plumeS.scale.set(2.2, 1.2, 2.2); plumeS.position.y = -.1; rocketS.s1.add(plumeS);
const plumeS2 = new THREE.Mesh(plumeGeo, plumeMat.clone()); plumeS2.material.uniforms.uWide.value = 1; plumeS2.scale.set(1.4, 1.1, 1.4); plumeS2.position.y = 46.8 - 3.2; rocketS.s2.add(plumeS2);
const sepP = new Particles(2000, { size: .25, seed: 81, fog: false }); space.add(sepP.obj);
// Estación espacial (esquemática, metros)
const iss = new THREE.Group(); space.add(iss); iss.visible = false;
{ const tm = new THREE.MeshStandardMaterial({ color: 0xb8bcc2, roughness: .5, metalness: .6 }); const pm = new THREE.MeshStandardMaterial({ color: 0x1b2a55, roughness: .25, metalness: .7, emissive: new THREE.Color(.05, .1, .25), side: THREE.DoubleSide });
  const truss = new THREE.Mesh(new THREE.BoxGeometry(108, 2.5, 2.5), tm); iss.add(truss);
  for (const x of [-46, -34, 34, 46]) for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(11.6, .1, 34), pm); p.position.set(x, 0, s * 19); iss.add(p); }
  for (const [x, z, l] of [[0, 0, 40], [0, 0, 0]]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 50, 24), tm); m.rotation.x = Math.PI / 2; m.position.set(0, -4, 0); iss.add(m); break; }
  const lab2 = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 22, 24), tm); lab2.rotation.z = Math.PI / 2; lab2.position.set(0, -4, -18); iss.add(lab2);
  for (const x of [-20, 20]) { const r = new THREE.Mesh(new THREE.BoxGeometry(6, .1, 12), new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: .4 })); r.position.set(x, 3, 0); iss.add(r); } }

// ==========================================================================
// GLOBO (km): 100 km, caída balística y cañón de Newton
// ==========================================================================
const globe = new THREE.Scene(); const RE = 6371;
const earthG = new THREE.Mesh(new THREE.SphereGeometry(RE, 160, 120), earthMat(1)); globe.add(earthG);
const atmoG = new THREE.Mesh(new THREE.SphereGeometry(RE * 1.012, 128, 96), atmoMat); globe.add(atmoG);
globe.add(stars.clone()); const sunG = new THREE.DirectionalLight(0xfff2e0, 2); sunG.position.copy(SUN).multiplyScalar(1e4); globe.add(sunG);
// Trayectorias del cañón de Newton (integración en el plano x-y, km y s)
const MU = 398600; const H0 = 1500;
function traj(v, maxT = 7000) { const pts = []; let x = 0, y = RE + H0, vx = v, vy = 0, dt = 5; for (let tt = 0; tt < maxT; tt += dt) { pts.push(V3(x, y, 0)); const r = Math.hypot(x, y); if (r < RE) break; const a = -MU / (r * r * r); vx += a * x * dt; vy += a * y * dt; x += vx * dt; y += vy * dt; } return pts; }
const TRAJ = [3.6, 5.3, 6.4, 7.116].map((v, i) => { const pts = traj(v, i === 3 ? 7000 : 9000); const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length - 1, i === 3 ? 45 : 30, 6, false);
  const m = new THREE.MeshBasicMaterial({ color: i === 3 ? new THREE.Color(2.2, 1.2, .55) : new THREE.Color(.5, .85, 1.4), transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false });
  const l = new THREE.Mesh(g, m); l.geometry.setDrawRange(0, 0); l.userData.per = 36; globe.add(l); return { l, pts, v }; });
const karman = new THREE.Mesh(new THREE.TorusGeometry(RE + 100, 2.5, 6, 360), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 1, .5), transparent: true, opacity: 0 })); globe.add(karman);
const dotG = new THREE.Mesh(new THREE.SphereGeometry(18, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.2, 1.4) })); globe.add(dotG);
const vertLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V3(0, RE, 0), V3(0, RE + 400, 0)]), new THREE.LineBasicMaterial({ color: new THREE.Color(.6, .9, 1.4), transparent: true, opacity: 0 })); globe.add(vertLine);

// ==========================================================================
// LABORATORIO: motor en corte y patinador
// ==========================================================================
const lab = new THREE.Scene(); lab.fog = new THREE.FogExp2(new THREE.Color(.01, .02, .04), .02);
{ const bg = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec3 vD; void main(){ float y=vD.y*.5+.5; vec3 c=mix(vec3(.004,.012,.03),vec3(.03,.07,.12),y); gl_FragColor=vec4(c,1.); }` })); lab.add(bg); }
lab.add(new THREE.HemisphereLight(0x9fc8ff, 0x0a0806, .7));
const labKey = new THREE.DirectionalLight(0xffffff, 2); labKey.position.set(-5, 8, 10); lab.add(labKey);
const labRim = new THREE.DirectionalLight(0xffa060, 1.6); labRim.position.set(6, -2, -8); lab.add(labRim);
const eng = new THREE.Group(); lab.add(eng);
const engX = xrayMat.clone(); engX.uniforms = { uA: { value: 1 }, uCol: { value: new THREE.Color(1.2, .6, .3) } };
{ // cámara + garganta + tobera (perfil de revolución), apuntando hacia abajo
  const prof = []; const add = (r, y) => prof.push(new THREE.Vector2(r, y));
  add(.0, 1.6); add(.55, 1.55); add(.62, 1.3); for (let i = 0; i <= 8; i++) { const u = i / 8; add(.62 - .38 * Math.sin(u * Math.PI / 2), 1.3 - u * 1.0); } for (let i = 1; i <= 20; i++) { const u = i / 20; add(.24 + .96 * Math.pow(u, .62), .3 - u * 2.8); }
  const shell = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), engX); eng.add(shell);
  const inj = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .08, 40), new THREE.MeshStandardMaterial({ color: 0x9aa3ac, metalness: .9, roughness: .3 })); inj.position.y = 1.5; eng.add(inj);
  // turbobomba al lado
  const tp = new THREE.Group(); tp.position.set(1.5, 2.2, 0); eng.add(tp); eng.userData.tp = tp;
  const hous = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, 1.2, 32), engX); hous.rotation.z = Math.PI / 2; tp.add(hous);
  const rot = new THREE.Group(); tp.add(rot); eng.userData.rot = rot;
  for (let i = 0; i < 14; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.9, .04, .12), new THREE.MeshStandardMaterial({ color: 0xc0c6cc, metalness: 1, roughness: .2, emissive: new THREE.Color(.4, .7, 1), emissiveIntensity: .05 })); b.position.y = .2; const p = new THREE.Group(); p.rotation.x = i / 14 * Math.PI * 2; p.add(b); rot.add(p); }
  const pipeM = new THREE.MeshStandardMaterial({ color: 0x8090a0, metalness: .8, roughness: .3, transparent: true, opacity: .6 });
  const pipe = (pts, r = .09) => { const c = new THREE.CatmullRomCurve3(pts); const m = new THREE.Mesh(new THREE.TubeGeometry(c, 40, r, 10), pipeM); eng.add(m); return c; };
  eng.userData.cLox = pipe([V3(1.5, 4, -.25), V3(1.5, 2.8, -.25), V3(1.0, 2.2, -.2), V3(.3, 1.75, -.1), V3(.2, 1.6, 0)]);
  eng.userData.cRp = pipe([V3(1.5, 4, .25), V3(1.5, 2.8, .25), V3(1.0, 2.2, .2), V3(.3, 1.75, .1), V3(-.2, 1.6, 0)]);
}
const engP = new Particles(9000, { size: .05, seed: 91, fog: false }); lab.add(engP.obj);
const skate = new THREE.Group(); lab.add(skate); skate.visible = false;
const ice = new THREE.Mesh(new THREE.CircleGeometry(30, 64), new THREE.MeshStandardMaterial({ color: 0x9fc4e0, roughness: .08, metalness: .2, transparent: true, opacity: .8 })); ice.rotation.x = -Math.PI / 2; skate.add(ice);
const skater = new THREE.Group(); skate.add(skater);
{ const m = new THREE.MeshStandardMaterial({ color: 0x1c2026, roughness: .5 }); const b = new THREE.Mesh(new THREE.CapsuleGeometry(.28, .9, 6, 16), m); b.position.y = 1.15; skater.add(b); const h = new THREE.Mesh(new THREE.SphereGeometry(.17, 16, 12), m); h.position.y = 1.95; skater.add(h);
  for (const z of [-.15, .15]) { const l = new THREE.Mesh(new THREE.CapsuleGeometry(.1, .7, 4, 8), m); l.position.set(0, .45, z); skater.add(l); const bl = new THREE.Mesh(new THREE.BoxGeometry(.5, .04, .04), new THREE.MeshStandardMaterial({ color: 0xd0d6dc, metalness: 1, roughness: .2 })); bl.position.set(0, .02, z); skater.add(bl); }
  const arm = new THREE.Mesh(new THREE.CapsuleGeometry(.08, .6, 4, 8), m); arm.position.set(-.35, 1.45, 0); arm.rotation.z = 1.2; skater.add(arm); skater.userData.arm = arm; }
const ball = new THREE.Mesh(new THREE.SphereGeometry(.32, 32, 20), new THREE.MeshStandardMaterial({ color: 0xe3a372, metalness: .8, roughness: .3, emissive: new THREE.Color(.5, .25, .1), emissiveIntensity: .3 })); skate.add(ball);

// ==========================================================================
// HUD
// ==========================================================================
function line2(p0, p1, a, col, w = 3, dash = null) { if (a <= .01) return; g2.save(); g2.globalAlpha = a; g2.strokeStyle = col; g2.lineWidth = w; if (dash) g2.setLineDash(dash); g2.shadowColor = col; g2.shadowBlur = 10; g2.beginPath(); g2.moveTo(p0.x, p0.y); g2.lineTo(p1.x, p1.y); g2.stroke(); g2.restore(); }
function fuelSpiral(a, k) {   // la «tiranía» del cohete: más combustible → más peso → más combustible
  if (a <= .01) return; const x0 = 170, y0 = 1640, w = 120;
  const labs = ['CARGA', '+ COMBUSTIBLE', '+ SU PESO', '+ MÁS COMBUSTIBLE', '+ …']; let hh = 30;
  for (let i = 0; i < 5; i++) { const ai = a * smooth(i * .18, i * .18 + .25, k); if (ai <= .01) break; const h = hh; hh *= 1.75;
    g2.save(); g2.globalAlpha = ai; g2.fillStyle = i === 0 ? '#ffffff' : i % 2 ? '#e3a372' : '#c7743f'; g2.shadowColor = '#e3a372'; g2.shadowBlur = i ? 14 : 0; g2.fillRect(x0 + i * (w + 30), y0 - h, w, h); g2.restore();
    txt(labs[i], x0 + i * (w + 30) + w / 2, y0 + 34, 19, { alpha: ai, weight: 600, spacing: 1 }); }
}
function fuelBar(a, k, label = 'COMBUSTIBLE') {
  if (a <= .01) return; const x = 140, y = 1500, w = 800;
  g2.save(); g2.globalAlpha = a; g2.fillStyle = 'rgba(255,255,255,.12)'; g2.fillRect(x, y, w, 34); const gr = g2.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, '#3c8cff'); gr.addColorStop(1, '#e3a372'); g2.fillStyle = gr; g2.fillRect(x, y, w * k, 34); g2.restore();
  txt(label, x, y - 30, 24, { align: 'left', spacing: 6, alpha: a * .85, fill: '#e3a372' }); txt(Math.round(k * 100) + ' %', x + w, y - 30, 40, { align: 'right', font: 'Montserrat', weight: 800, alpha: a });
}
const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
function setNearFar(n, f) { camera.near = n; camera.far = f; }

// ==========================================================================
// LÍNEA DE TIEMPO
// ==========================================================================
function renderFrame(t) {
  g2.clearRect(0, 0, W, H); camera.up.set(0, 1, 0); camera.fov = 35; setNearFar(.1, 6000);
  let scene = sea, bloomS = .65, flash = 0, ca = .0013, fade = 0, grain = .035, expo = 1;
  xray(false); fill(1, 1); rocket.position.set(0, 0, 0); rocket.rotation.set(0, 0, 0); ROCKET.s2.position.set(0, 0, 0); plume.visible = true; plumeMat.uniforms.uA.value = 0; plumeMat.uniforms.uT.value = t;
  bellMat.emissiveIntensity = 0; glowL.intensity = 0; pad.visible = true; skyDome.visible = true; smoke.begin(); fire.begin(); engP.begin(); sepP.begin();
  eng.visible = true; skate.visible = false; iss.visible = false; rocketS.rk.visible = true; ROCKET.mvac.visible = false; plume2.visible = false;
  for (const c of ['why', 'engines', 'turbo', 'throw', 'space', 'skater', 'meco', 'sep', 'surprise', 'side', 'iss', 'brand']) flash = Math.max(flash, flashAt(t, TL[c]));
  const hud = [];
  sea.fog.color.setRGB(.05, .06, .09); sea.fog.density = .0009; U.uTime.value = t;

  if (t < TL.engines) {
    // A · GANCHO: 549 t en la plataforma; casi todo combustible
    const lt = t; const xr = t >= TL.fuel; xray(xr); fill(.98, .98); bloomS = xr ? .8 : .65;
    const vent = 1; for (let i = 0; i < 1500; i++) { const s = smoke.seed, k = i * 4; const age = fract(s[k] + t * .25); const y = 20 + s[k + 1] * 36; smoke.push(R + 1 + age * 14, y - age * 6, (s[k + 2] - .5) * 6 + age * 4, .55 * (1 - age) * vent, .6 * (1 - age) * vent, .68 * (1 - age) * vent); }
    if (t < TL.why) { camOrbit(V3(0, lerp(42, 36, lt / 4), 0), lerp(140, 118, lt / 4), lerp(.5, .65, lt / 4), lerp(-.02, .05, lt / 4), 40); }
    else { const l2 = t - TL.why; camOrbit(V3(0, 35, 0), lerp(122, 112, l2 / 9), .65 + l2 * .03, .05, 40);
      // flechas de empuje y peso
      bloomS = .8; }
    padKey.target.position.set(0, 35, 0); padKey.target.updateMatrixWorld();
    fade = 1 - smooth(0, .3, t);
    hud.push(() => {
      bigStat('PESO AL DESPEGUE', '549 t', 430, smooth(.1, .5, t) * (1 - smooth(TL.why - .2, TL.why, t)), .2 + t * .2);
      fuelBar(smooth(TL.fuel, TL.fuel + .3, t) * (1 - smooth(TL.why - .2, TL.why, t)), lerp(0, .93, easeOut(smooth(TL.fuel, TL.fuel + 1.2, t))), 'COMBUSTIBLE Y OXÍGENO');
      if (t >= TL.why) { const l2 = t - TL.why; txt('¿POR QUÉ TANTO?', W / 2, 330, 54, { font: 'Montserrat', weight: 800, alpha: smooth(0, .3, l2) * (1 - smooth(1, 1.3, l2)) });
        const pb = project(V3(0, 0, 0)), pt = project(V3(0, 70, 0)); const w0 = TL.weight - TL.why;
        arrowXY(pb.x - 230, pb.y - 100, pb.x - 230, pb.y - 520, smooth(w0, w0 + .5, l2), '#ffe2c0', 14); txt('EMPUJE', pb.x - 230, pb.y - 560, 30, { font: 'Montserrat', weight: 800, alpha: smooth(w0, w0 + .5, l2) });
        arrowXY(pt.x + 230, pt.y + 120, pt.x + 230, pt.y + 520, smooth(w0 + 1.6, w0 + 2.1, l2), '#ff6a4a', 14); txt('SU PROPIO PESO', pt.x + 200, pt.y + 80, 28, { font: 'Montserrat', weight: 800, alpha: smooth(w0 + 1.6, w0 + 2.1, l2), fill: '#ff6a4a' });
        const s0 = TL.spiral - TL.why; fuelSpiral(smooth(s0, s0 + .3, l2), smooth(s0, s0 + 3.5, l2)); }
    });
  } else if (t < TL.turbo) {
    // B · 9 MOTORES (vista desde abajo, encendido)
    const lt = t - TL.engines; const ig = smooth(.3, .9, lt); bellMat.emissiveIntensity = ig * .3; plumeMat.uniforms.uA.value = ig * .12; glowL.intensity = ig * 10; glowL.position.set(0, -5, 0); plume.visible = false;
    camera.position.set(5, -9, 7); camera.lookAt(0, 2, 0); camera.fov = 55; camera.position.add(shake(t, .08 * ig, 20)); pad.visible = false; skyDome.visible = true; ca = .002 + ig * .002;
    for (const b of ROCKET.bells) { const p = b.getWorldPosition(V3(0, 0, 0)); emitJet(fire, p.add(V3(0, -1.4, 0)), V3(0, -1, 0), 60, t, 12, 1.2, .25, [.7 * ig, .32 * ig, .12 * ig]); }
    bloomS = .45; expo = .85;
    hud.push(() => { bigStat('MOTORES', '9', 430, smooth(.1, .4, lt), .3 + lt * .2); titleHUD('QUEROSENO', '+ OXÍGENO LÍQUIDO', smooth(.6, 1, lt), 1460); });
  } else if (t < TL.throw) {
    // C · DENTRO DEL MOTOR: turbobomba → cámara (~100 atm) → tobera (~3 km/s)
    scene = lab; const lt = t - TL.turbo; bloomS = .85;
    eng.userData.rot.rotation.x = t * 25;
    const zoomC = t >= TL.chamber, zoomN = t >= TL.nozzle;
    const tgt = zoomN ? V3(0, -1.2, 0) : zoomC ? V3(0, 1.0, 0) : V3(1.0, 2.2, 0); const dist = zoomN ? 9 : zoomC ? 6.5 : 6;
    camOrbit(tgt, dist + Math.sin(lt * .5) * .3, .35 + lt * .05, .15, 40);
    const s = engP.seed;
    for (let i = 0; i < 1800; i++) { const k = i * 4; const u = fract(s[k] + t * .7); const c = (i % 2 ? eng.userData.cLox : eng.userData.cRp).getPointAt(u); const col = i % 2 ? [.4, .8, 1.6] : [1.6, .8, .3]; engP.push(c.x + (s[k + 1] - .5) * .1, c.y, c.z + (s[k + 2] - .5) * .1, ...col); }
    for (let i = 1800; i < 7000; i++) { const k = i * 4; const u = fract(s[k] + t * .9); const y = 1.45 - Math.pow(u, 1.6) * 6.5; const rr = y > .3 ? .55 : y > -.7 ? lerp(.24, .55, (y + .7) / 1.0) * 1.0 : .24 + (-.7 - y) * .4; const r = Math.sqrt(s[k + 1]) * rr * .95; const th = s[k + 2] * 6.283;
      const hot = y > .3 ? 1 : clamp(1 - (.3 - y) / 5); const I = (y < -2.6 ? clamp(1 - (-2.6 - y) / 2.4) : 1); engP.push(Math.cos(th) * r, y, Math.sin(th) * r, 2.6 * hot * I + .3 * I, 1.3 * hot * I + .4 * I, .5 * hot * I + .9 * I * (1 - hot)); }
    hud.push(() => {
      callout(V3(1.5, 2.5, 0), 110, -200, 'TURBOBOMBAS', 'inyectan el combustible', smooth(.2, .6, lt) * (1 - smooth(TL.chamber - TL.turbo - .1, TL.chamber - TL.turbo + .2, lt)));
      if (zoomC && !zoomN) { const l2 = t - TL.chamber; callout(V3(.5, 1.0, 0), 120, -260, 'CÁMARA DE COMBUSTIÓN', null, smooth(.1, .4, l2)); bigStat('PRESIÓN', '≈ 100 atm', 1520, smooth(.6, 1, l2), .3 + l2 * .2); }
      if (zoomN) { const l3 = t - TL.nozzle; callout(V3(.9, -1.6, 0), 130, -120, 'TOBERA', 'acelera el gas', smooth(.1, .5, l3)); bigStat('VELOCIDAD DEL GAS', '≈ 3 km/s', 430, smooth(1.4, 1.8, l3), .3 + l3 * .2);
        const p0 = project(V3(0, -2.4, 0)), p1 = project(V3(0, -5, 0)); arrowXY(p0.x - 230, p0.y, p1.x - 230, p1.y, smooth(.6, 1.1, l3), '#ffb27a', 12); }
    });
  } else if (t < TL.space) {
    // D · DESPEGUE: lanza gas hacia abajo → sube
    const lt = t - TL.throw; const ig = 1; bellMat.emissiveIntensity = .9; plumeMat.uniforms.uA.value = 1; const Y = Math.max(0, lt - .5); const y = 1.3 * Y * Y * 1.2; rocket.position.y = y;
    glowL.intensity = 80; glowL.position.set(0, y - 8, 0);
    for (let i = 0; i < 5000; i++) { const s = smoke.seed, k = i * 4; const age = fract(s[k] + t * .3); const a = s[k + 1] * 6.283; const r = 6 + age * 70 * (.5 + s[k + 2]); const I = (1 - age) * .9; smoke.push(Math.cos(a) * r, 2 + age * 18 * s[k + 3], Math.sin(a) * r, .7 * I + .5 * (1 - age) * smooth(0, .3, 1 - age), .55 * I, .45 * I); }
    for (const b of ROCKET.bells) { const p = b.getWorldPosition(V3(0, 0, 0)); emitJet(fire, p.add(V3(0, -1.4, 0)), V3(0, -1, 0), 350, t, 34, 4, .3, [2.4, 1.1, .4]); }
    camera.position.set(lerp(90, 80, lt / 3), lerp(10, 30 + y * .6, lt / 3), lerp(140, 120, lt / 3)); camera.lookAt(0, 30 + y * .8, 0); camera.position.add(shake(t, .5 * (1 - lt / 4), 16)); ca = .003; bloomS = .95; expo = 1.05;
    hud.push(() => { const pb = project(V3(0, y - 6, 0)), pt = project(V3(0, y + 72, 0));
      arrowXY(pb.x + 220, pb.y - 120, pb.x + 220, pb.y + 200, smooth(.3, .7, lt), '#ffb27a', 14); txt('GAS HACIA ABAJO', pb.x + 220, pb.y + 250, 28, { font: 'Montserrat', weight: 800, alpha: smooth(.3, .7, lt), fill: '#ffb27a' });
      arrowXY(pt.x - 220, pt.y + 200, pt.x - 220, pt.y - 120, smooth(1.2, 1.6, lt), '#ffe2c0', 14); txt('COHETE HACIA ARRIBA', pt.x - 180, pt.y - 170, 28, { font: 'Montserrat', weight: 800, alpha: smooth(1.2, 1.6, lt) }); });
  } else if (t < TL.skater) {
    // E · EN EL ESPACIO FUNCIONA IGUAL: empuja sus propios gases
    scene = space; setNearFar(1, 5e5); const lt = t - TL.space; const alt = 3000;
    earthS.position.set(0, -ES - alt, 0); atmoS.position.copy(earthS.position); rocketS.rk.position.set(0, 0, 0); rocketS.rk.rotation.set(0, 0, -.35);
    for (const b of rocketS.bells) b.material = bellMat; bellMat.emissiveIntensity = .9; plumeS.material.uniforms.uA.value = .5; plumeS.material.uniforms.uT.value = t; plumeS.visible = true; plumeS2.visible = false; rocketS.s2.position.set(0, 0, 0);
    camOrbit(V3(-6, 18, 0), lerp(150, 130, lt / 6.4), .9 + lt * .04, .08, 40); sunS.position.copy(SUN).multiplyScalar(1000); sunS.target.position.set(0, 0, 0); sunS.target.updateMatrixWorld(); bloomS = .8;
    hud.push(() => {
      txt('¿Y SIN AIRE?', W / 2, 330, 54, { font: 'Montserrat', weight: 800, alpha: smooth(.1, .4, lt) * (1 - smooth(TL.same - TL.space - .2, TL.same - TL.space, lt)) });
      titleHUD('EN EL ESPACIO', 'FUNCIONA IGUAL', smooth(TL.same - TL.space, TL.same - TL.space + .3, lt) * (1 - smooth(TL.gases - TL.space - .1, TL.gases - TL.space + .2, lt)), 330);
      const g0 = TL.gases - TL.space; txt('NO EMPUJA EL AIRE:', W / 2, 300, 32, { weight: 600, alpha: smooth(g0, g0 + .3, lt) }); txt('EMPUJA SUS PROPIOS GASES', W / 2, 360, 44, { font: 'Montserrat', weight: 800, alpha: smooth(g0 + .8, g0 + 1.2, lt), fill: copperGrad(160, 920, 360, .5) });
    });
  } else if (t < TL.meco) {
    // F · EL PATINADOR (acción y reacción)
    scene = lab; eng.visible = false; skate.visible = true; const lt = t - TL.skater; const t0 = 1.2, d = Math.max(0, lt - t0);
    skater.position.set(.3 + d * .45, 0, 0); ball.position.set(d > 0 ? -.45 - d * 1.8 : -.55, d > 0 ? 1.45 + d * .8 - 4.9 * d * d * .25 : 1.45, 0); if (ball.position.y < .32) ball.position.y = .32;
    skater.userData.arm.rotation.z = d > 0 ? lerp(1.2, -.3, smooth(0, .25, d)) : lerp(1.2, 1.8, smooth(.4, 1.2, lt));
    camOrbit(V3(-.25 - d * .5, 1.0, 0), 12 + d * 3.8, .05, .12, 40); labKey.position.set(-3, 8, 8);
    hud.push(() => { const pb = project(ball.position), ps = project(skater.position.clone().add(V3(0, 1.2, 0)));
      const a = smooth(t0 + .1, t0 + .4, lt); arrowXY(pb.x + 60, pb.y - 120, pb.x - 160, pb.y - 120, a, '#e3a372', 12); txt('BOLA', pb.x - 40, pb.y - 175, 28, { font: 'Montserrat', weight: 800, alpha: a, fill: '#e3a372' });
      arrowXY(ps.x - 40, ps.y - 220, ps.x + 160, ps.y - 220, a, '#7fd4ff', 12); txt('PATINADOR', ps.x + 60, ps.y - 275, 28, { font: 'Montserrat', weight: 800, alpha: a, fill: '#7fd4ff' });
      titleHUD('ACCIÓN Y REACCIÓN', 'LA BOLA = LOS GASES', smooth(t0 + 1, t0 + 1.4, lt), 1460); });
  } else if (t < TL.surprise) {
    // G · SEPARACIÓN DE ETAPAS (2:30)
    scene = space; setNearFar(1, 5e5); const lt = t - TL.meco; const alt = 5200; earthS.position.set(0, -ES - alt, 0); atmoS.position.copy(earthS.position);
    sunS.position.copy(SUN).multiplyScalar(1000); sunS.target.position.set(0, 0, 0); sunS.target.updateMatrixWorld();
    const sepT = TL.sep - TL.meco, s2T = TL.second - TL.meco; const d = Math.max(0, lt - sepT); const d2 = Math.max(0, lt - s2T - .3);
    rocketS.rk.rotation.set(0, 0, -1.0); for (const b of rocketS.bells) b.material = bellMat;
    // agotamiento de la 1.ª etapa
    const k1 = lerp(.12, .03, smooth(0, sepT, lt)); const xr = lt < sepT + .2; for (const m of rocketS.shells) { if (!m.userData.mat0) m.userData.mat0 = m.material; m.material = xr && lt > .8 ? xrayMat : m.userData.mat0; } for (const T of rocketS.tanks) T.visible = xr && lt > .8;
    rocketS.tanks.forEach((T, i) => { const k = i < 2 ? k1 : 1; T.scale.y = Math.max(.01, (T.userData.y1 - T.userData.y0) * k); });
    plumeS.material.uniforms.uA.value = lt < .6 ? .9 : 0; plumeS.material.uniforms.uT.value = t; bellMat.emissiveIntensity = lt < .6 ? .9 : .3 * (1 - smooth(.6, 3, lt));
    rocketS.s1.position.set(-d * 1.2, -d * 4 - d * d * .4, 0); rocketS.s1.rotation.z = -d * .05;
    rocketS.s2.position.set(0, d * 2.5 + d2 * d2 * 2.5, 0); plumeS2.visible = d2 > 0; plumeS2.material.uniforms.uA.value = smooth(0, .4, d2); plumeS2.material.uniforms.uT.value = t;
    // empujadores neumáticos / chispa de separación
    if (d > 0 && d < 1.2) for (let i = 0; i < 600; i++) { const s = sepP.seed, k = i * 4; const r = d * 10 * s[k]; const a = s[k + 1] * 6.283; const p = V3(Math.cos(a) * r, 46.8 + (s[k + 2] - .5) * 2, Math.sin(a) * r).applyEuler(rocketS.rk.rotation); const I = (1 - d / 1.2) * 1.4; sepP.push(p.x, p.y, p.z, I, I * .9, I * .8); }
    rocketS.s2.children.forEach(c => { if (c === rocketS.mvac) c.visible = d2 > 0 || d > .2; });
    const cm = V3(0, 40, 0).applyEuler(rocketS.rk.rotation); camOrbit(cm.add(V3(0, d * 2, 0)), lerp(130, 115, lt / 8.9), 1.2 + lt * .03, .15, 40); bloomS = .8;
    hud.push(() => {
      bigStat('TIEMPO DE VUELO', '2:30', 430, smooth(.1, .5, lt) * (1 - smooth(TL.why2 - TL.meco - .3, TL.why2 - TL.meco, lt)), .3 + lt * .2);
      fuelBar(smooth(.8, 1.1, lt) * (1 - smooth(sepT - .3, sepT, lt)), k1, '1.ª ETAPA · COMBUSTIBLE');
      txt('¿PARA QUÉ CARGAR CON UN TANQUE VACÍO?', W / 2, 330, 34, { font: 'Montserrat', weight: 800, alpha: smooth(TL.why2 - TL.meco, TL.why2 - TL.meco + .3, lt) * (1 - smooth(sepT - .1, sepT + .2, lt)) });
      titleHUD('SEPARACIÓN', 'SE SUELTA', smooth(sepT, sepT + .2, lt) * (1 - smooth(s2T - .1, s2T + .2, lt)), 1460);
      titleHUD('2.ª ETAPA · UN SOLO MOTOR', 'MUCHO MÁS LIGERA', smooth(s2T + .2, s2T + .6, lt), 1460);
    });
  } else if (t < TL.side) {
    // H · LLEGAR ES FÁCIL (100 km); QUEDARSE ES LO DIFÍCIL
    scene = globe; setNearFar(5, 2e5); const lt = t - TL.surprise;
    const k = easeInOut(smooth(0, 3, lt)); camera.position.set(0, lerp(RE * .7, RE - 150, k), lerp(RE * 3.2, 3400, k)); camera.lookAt(0, lerp(0, RE + 40, k), 0);
    karman.material.opacity = smooth(TL.km100 - TL.surprise, TL.km100 - TL.surprise + .5, lt); karman.rotation.set(0, 0, 0);
    // si solo subes, vuelves a caer: punto que sube y baja en vertical
    const f0 = TL.fall - TL.surprise; const fd = Math.max(0, lt - f0); const hh = fd > 0 ? Math.max(0, 300 * Math.sin(Math.min(Math.PI, fd * 1.6))) : 0; dotG.position.set(0, RE + hh, 0); dotG.visible = fd > 0; vertLine.material.opacity = fd > 0 ? .6 : 0;
    for (const T of TRAJ) T.l.geometry.setDrawRange(0, 0);
    hud.push(() => {
      txt('LO SORPRENDENTE:', W / 2, 300, 32, { spacing: 4, alpha: smooth(.1, .4, lt) * (1 - smooth(2.9, 3.1, lt)), fill: '#e3a372' }); txt('LLEGAR AL ESPACIO ES FÁCIL', W / 2, 360, 44, { font: 'Montserrat', weight: 800, alpha: smooth(1, 1.4, lt) * (1 - smooth(2.9, 3.1, lt)) });
      const a1 = karman.material.opacity * (1 - smooth(f0 - .3, f0, lt)); const pk = project(V3(0, RE + 100, 0)); txt('100 km · AQUÍ EMPIEZA EL ESPACIO', W / 2, pk.y - 60, 30, { font: 'Montserrat', weight: 800, alpha: a1, fill: '#ffb27a' });
      titleHUD('LO DIFÍCIL', 'ES QUEDARSE', smooth(TL.stay - TL.surprise, TL.stay - TL.surprise + .3, lt) * (1 - smooth(f0 - .2, f0, lt)), 1460);
      titleHUD('SI SOLO SUBES…', 'VUELVES A CAER', smooth(f0, f0 + .3, lt), 1460);
    });
  } else if (t < TL.iss) {
    // I · CAÑÓN DE NEWTON: de lado a 28.000 km/h, caer y fallar el suelo
    scene = globe; setNearFar(5, 2e5); const lt = t - TL.side; karman.material.opacity = 0; vertLine.material.opacity = 0;
    const k = easeInOut(smooth(0, 2.5, lt)); camera.position.set(lerp(0, 2000, k), lerp(RE + 2500, 1500, k), lerp(9000, 33000, k)); camera.lookAt(0, lerp(RE, 0, k), 0); camera.fov = 50;
    const show = [[0, 1.2], [.8, 2.2], [1.6, 3.6], [TL.v28 - TL.side, TL.orbit - TL.side + 1.5]];
    let dotPos = null;
    TRAJ.forEach((T, i) => { const [a, dur] = show[i]; const u = clamp((lt - a) / dur); const n = Math.floor(u * (T.pts.length - 1)); T.l.geometry.setDrawRange(0, n * 36); T.l.material.opacity = i < 3 ? (1 - .6 * smooth(TL.curve - TL.side, TL.curve - TL.side + 1, lt)) : 1; if (i === 3 && n > 0) dotPos = T.pts[Math.min(T.pts.length - 1, n)]; });
    dotG.visible = !!dotPos; if (dotPos) dotG.position.copy(dotPos); dotG.scale.setScalar(lerp(1, 6, k));
    bloomS = .8;
    hud.push(() => {
      titleHUD('PARA NO CAER', 'HAY QUE IR DE LADO', smooth(.1, .4, lt) * (1 - smooth(TL.v28 - TL.side - .2, TL.v28 - TL.side, lt)), 1460);
      bigStat('VELOCIDAD ORBITAL', '28.000 km/h', 430, smooth(TL.v28 - TL.side, TL.v28 - TL.side + .4, lt), .3 + lt * .1);
      txt('≈ 7,8 km/s', W / 2, 530, 32, { weight: 600, alpha: smooth(TL.v28 - TL.side + .6, TL.v28 - TL.side + 1, lt), fill: '#e3a372' });
      titleHUD('LA TIERRA SE CURVA', 'TAN DEPRISA COMO CAEMOS', smooth(TL.curve - TL.side, TL.curve - TL.side + .4, lt) * (1 - smooth(TL.orbit - TL.side - .2, TL.orbit - TL.side, lt)), 1460);
      titleHUD('UNA ÓRBITA ES', 'CAER… Y FALLAR EL SUELO', smooth(TL.orbit - TL.side, TL.orbit - TL.side + .4, lt), 1460);
    });
  } else if (t < TL.brand) {
    // J · LA ESTACIÓN ESPACIAL: ~90 % de gravedad; flotan porque caen
    scene = space; setNearFar(1, 5e5); const lt = t - TL.iss; rocketS.rk.visible = false; iss.visible = true; const alt = 400 / 6371 * ES;
    earthS.position.set(0, -ES - alt, 0); atmoS.position.copy(earthS.position); earthS.rotation.y = -lt * .01;
    iss.position.set(0, 0, 0); iss.rotation.set(.15, lt * .03, 0);
    sunS.position.copy(SUN).multiplyScalar(1000); sunS.target.position.set(0, 0, 0); sunS.target.updateMatrixWorld();
    const fl = TL.float - TL.iss; camOrbit(V3(0, -4, 0), lerp(260, 170, easeInOut(clamp(lt / 8))), .5 + lt * .04, lerp(.25, .1, clamp(lt / 8)), 40); bloomS = .7;
    hud.push(() => {
      titleHUD('ESTACIÓN ESPACIAL · 400 km', 'GRAVEDAD ≈ 90 %', smooth(.3, .7, lt) * (1 - smooth(fl - .2, fl, lt)), 1460);
      const pc = project(V3(0, -4, 0)); const a2 = smooth(fl + 2.4, fl + 2.9, lt);
      arrowXY(pc.x, pc.y + 60, pc.x, pc.y + 420, a2, '#ffb27a', 14); txt('CAYENDO… SIN PARAR', W / 2, 1520, 46, { font: 'Montserrat', weight: 800, alpha: a2, fill: copperGrad(200, 880, 1520, .5) });
      txt('NO FLOTAN POR FALTA DE GRAVEDAD', W / 2, 330, 34, { font: 'Montserrat', weight: 800, alpha: smooth(fl, fl + .3, lt) * (1 - smooth(fl + 2.3, fl + 2.6, lt)) });
      const p2 = project(V3(0, -4, 0)); arrowXY(p2.x + 280, p2.y - 140, p2.x + 520, p2.y - 160, a2, '#7fd4ff', 12); txt('7,8 km/s', p2.x + 400, p2.y - 210, 28, { font: 'Montserrat', weight: 800, alpha: a2, fill: '#7fd4ff' });
    });
  } else {
    // K · MARCA
    scene = space; setNearFar(1, 5e5); const lt = t - TL.brand; rocketS.rk.visible = false; iss.visible = false; earthS.position.set(0, -ES - 2500, 0); atmoS.position.copy(earthS.position);
    camera.position.set(0, 0, 0); camera.lookAt(1, -.12 + lt * .005, .2); expo = .9; fade = Math.min(.4, lt * .35);
    hud.push(() => drawBrand(lt - .3)); fade = Math.max(fade, smooth(TL.end - .6, TL.end, t) * .3);
  }
  smoke.end(); fire.end(); engP.end(); sepP.end();
  camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (scene === sea) { skyDome.position.copy(camera.position); }
  for (const h of hud) h();
  finish(scene, { t, flash, ca, fade, grain, bloom: bloomS, expo });
}
function renderCover() { renderFrame(TL.throw + 2.2); coverText('¿CÓMO LLEGA', 'A LA ÓRBITA?', '549 toneladas… y casi todo es combustible'); }
window.renderCover = () => { renderCover(); return true; };
window.TL = TL; window.renderFrame = (t) => { renderFrame(t); return true; }; window.ready = true;
window._dbg = { camera, rocket, ROCKET, rocketS, space, globe };
