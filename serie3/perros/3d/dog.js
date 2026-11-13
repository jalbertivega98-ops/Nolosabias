// Cabeza de perro procedural (SDF + marching cubes + pelo por capas). Unidades: radio del cráneo ≈ 1.
import { THREE } from '../../lib/core.js';
import { edgeTable, triTable } from 'three/addons/objects/MarchingCubes.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const { Vector3 } = THREE;
// ---------- primitivas SDF ----------
const len3 = (x, y, z) => Math.sqrt(x * x + y * y + z * z);
export function sdEll(px, py, pz, c, r) { const x = (px - c[0]) / r[0], y = (py - c[1]) / r[1], z = (pz - c[2]) / r[2]; const k0 = len3(x, y, z); const k1 = len3(x / r[0], y / r[1], z / r[2]); return k1 < 1e-6 ? -Math.min(...r) : k0 * (k0 - 1) / k1; }
export function sdRoundCone(px, py, pz, a, b, r1, r2) {
  const bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2]; const pax = px - a[0], pay = py - a[1], paz = pz - a[2];
  const l2 = bax * bax + bay * bay + baz * baz, rr = r1 - r2, a2 = l2 - rr * rr, il2 = 1 / l2;
  const y = pax * bax + pay * bay + paz * baz, z = y - l2;
  const xx = (pax * l2 - bax * y) ** 2 + (pay * l2 - bay * y) ** 2 + (paz * l2 - baz * y) ** 2; const y2 = y * y * l2, z2 = z * z * l2;
  const k = Math.sign(rr) * rr * rr * xx;
  if (Math.sign(z) * a2 * z2 > k) return Math.sqrt(xx + z2) * il2 - r2;
  if (Math.sign(y) * a2 * y2 < k) return Math.sqrt(xx + y2) * il2 - r1;
  return (Math.sqrt(xx * a2 * il2) + y * rr) * il2 - r1;
}
export const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * .25; };
export const smax = (a, b, k) => -smin(-a, -b, k);

// ---------- parámetros de raza ----------
export const GOLDEN = {
  snoutLen: 1.12, snoutR: [.5, .33], earUp: 0, wolf: 0,
  fur: [.82, .50, .22], furLight: [.93, .72, .44], furDark: [.5, .27, .1], iris: [.42, .2, .07], eyeR: .19,
};
export const WOLF = {
  snoutLen: 1.25, snoutR: [.46, .27], earUp: 1, wolf: 1,
  fur: [.48, .46, .43], furLight: [.86, .84, .8], furDark: [.2, .19, .18], iris: [.85, .62, .22], eyeR: .15,
};

function headSDF(B) {
  const sz = 1.38 + (B.snoutLen - 1) * .9; // punta del hocico (centro de r2)
  const eyeY = .14, eyeZ = .74, eyeX = .37;
  return (x, y, z) => {
    const ax = Math.abs(x);
    let d = sdEll(x, y, z, [0, .16, -.12], [.93, .86, 1.0]);
    d = smin(d, sdEll(x, y, z, [0, .5, .1], [.68, .46, .72]), .3);
    d = smin(d, sdEll(ax, y, z, [.36, .33, .6], [.3, .2, .3]), .25);                 // cejas
    d = smin(d, sdEll(ax, y, z, [.58, -.14, .33], [.42, .44, .44]), .3);             // mejillas
    d = smin(d, sdRoundCone(x, y, z, [0, -.16, .5], [0, -.28 + (B.wolf ? .04 : 0), sz], B.snoutR[0], B.snoutR[1]), .3); // hocico
    d = smin(d, sdEll(ax, y, z, [.19, -.47, .95 + (B.snoutLen - 1) * .6], [.27, .24, .40 + (B.snoutLen - 1) * .3]), .14); // belfos
    d = smin(d, sdEll(x, y, z, [0, -.62, .72], [.33, .17, .5 + (B.snoutLen - 1) * .35]), .16); // mandíbula
    d = B.noNeck ? smin(d, sdRoundCone(x, y, z, [0, -.35, -.35], [0, -1.2, -.9], .8, .75), .4) : smin(d, sdRoundCone(x, y, z, [0, -.35, -.35], [0, -2.3, -1.0], .82, 1.15), .45); // cuello y pecho
    // comisura de la boca (surco)
    const mz = .55 + (B.snoutLen - 1) * .5;
    const groove = sdRoundCone(ax, y, z, [.3, -.55, mz], [.1, -.58, mz + .55], .028, .022); d = smax(d, -groove, .05);
    // cuencas de los ojos
    d = smax(d, -sdEll(ax, y, z, [eyeX, eyeY, eyeZ + .02], [B.eyeR * 1.12, B.eyeR * (B.wolf ? .8 : .95), B.eyeR * 1.0]), .06);
    return d;
  };
}
function noseSDF(B) {
  const sz = 1.38 + (B.snoutLen - 1) * .9 + B.snoutR[1] * .78;
  return (x, y, z) => {
    const ax = Math.abs(x);
    let d = sdEll(x, y, z, [0, -.15, sz], [.24, .16, .17]);
    d = smin(d, sdEll(x, y, z, [0, -.27, sz - .02], [.07, .1, .1]), .06);
    d = smax(d, -sdEll(ax, y, z, [.095, -.19, sz + .14], [.055, .035, .07]), .03);   // orificios
    return d;
  };
}
function earSDF(B) {
  return (x, y, z) => {
    if (B.earUp) { // oreja de lobo: triángulo de punta
      return smax(sdRoundCone(x, y, z, [0, 0, 0], [0, .62, -.02], .26, .03), Math.abs(z + .02) - .07, .05);
    }
    // oreja caída (golden): lámina gruesa colgando
    return smax(sdEll(x, y, z, [0, -.62, .05], [.5, .88, .5]), Math.abs(x) - .1, .08);
  };
}

// ---------- marching cubes sobre una caja ----------
export function mesh(sdf, lo, hi, step) {
  const nx = Math.ceil((hi[0] - lo[0]) / step) + 1, ny = Math.ceil((hi[1] - lo[1]) / step) + 1, nz = Math.ceil((hi[2] - lo[2]) / step) + 1;
  const F = new Float32Array(nx * ny * nz); const id = (i, j, k) => i + nx * (j + ny * k);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) F[id(i, j, k)] = sdf(lo[0] + i * step, lo[1] + j * step, lo[2] + k * step);
  const pos = []; const C = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]];
  const E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  const vl = new Array(12); const val = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    let ci = 0; for (let c = 0; c < 8; c++) { val[c] = F[id(i + C[c][0], j + C[c][1], k + C[c][2])]; if (val[c] < 0) ci |= 1 << c; }
    const eb = edgeTable[ci]; if (!eb) continue;
    for (let e = 0; e < 12; e++) if (eb & (1 << e)) { const [a, b] = E[e]; const t = val[a] / (val[a] - val[b]);
      vl[e] = [lo[0] + (i + C[a][0] + (C[b][0] - C[a][0]) * t) * step, lo[1] + (j + C[a][1] + (C[b][1] - C[a][1]) * t) * step, lo[2] + (k + C[a][2] + (C[b][2] - C[a][2]) * t) * step]; }
    const o = ci << 4; for (let q = 0; triTable[o + q] !== -1; q += 3) { pos.push(...vl[triTable[o + q]], ...vl[triTable[o + q + 2]], ...vl[triTable[o + q + 1]]); }
  }
  const g = new THREE.BufferGeometry(); const P = new Float32Array(pos); g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  const N = new Float32Array(P.length); const h = step * .5;
  for (let v = 0; v < P.length; v += 3) { const x = P[v], y = P[v + 1], z = P[v + 2];
    let gx = sdf(x + h, y, z) - sdf(x - h, y, z), gy = sdf(x, y + h, z) - sdf(x, y - h, z), gz = sdf(x, y, z + h) - sdf(x, y, z - h); const l = Math.hypot(gx, gy, gz) || 1; N[v] = gx / l; N[v + 1] = gy / l; N[v + 2] = gz / l; }
  g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); const m = mergeVertices(g, step * .02); console.log('mc tris', P.length / 9, 'verts', m.attributes.position.count); return m;
}

// ---------- material de pelo (capas) ----------
const furVS = `
  uniform float uLayer, uLen, uDroop; uniform vec3 uWind;
  attribute vec3 color; attribute float flen; varying float vL; varying vec3 vC; varying vec3 vN; varying vec3 vP; varying vec3 vW; varying vec3 vV; varying vec3 vNo;
  void main(){ vL=flen; vNo=normal; vec3 p=position+normal*uLen*uLayer*flen; p.y-=uDroop*uLayer*uLayer*flen; p+=uWind*uLayer*uLayer;
    vec4 w=modelMatrix*vec4(p,1.); vW=w.xyz; vP=position; vC=color; vN=normalize(mat3(modelMatrix)*normal); vV=normalize(cameraPosition-w.xyz);
    gl_Position=projectionMatrix*viewMatrix*w; }`;
const furFS = `
  uniform float uLayer, uDens, uAlpha; uniform vec3 uKey, uKeyC, uFillC, uRimC, uAmb; uniform float uTint; uniform vec3 uTintC;
  varying float vL; varying vec3 vC; varying vec3 vN; varying vec3 vP; varying vec3 vW; varying vec3 vV; varying vec3 vNo;
  float h3(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
  void main(){
    vec3 q=vP*uDens; vec3 c=floor(q); vec3 f=fract(q)-.5; float r=h3(c);
    vec3 no=normalize(vNo); vec3 ft=f-dot(f,no)*no; float strand=1.-length(ft)*1.6; // hebra en celda (proyectada en el plano tangente)
    if(uLayer>0.&&vL<.08) discard;
    if(uLayer>0.){ float th=uLayer*(.55+r*.6); if(r<uLayer*.9 || strand<uLayer*.8) discard; }
    vec3 n=normalize(vN); float ndl=dot(n,normalize(uKey));
    float diff=clamp(ndl*.6+.4,0.,1.); // envoltura suave
    float fill=clamp(-ndl*.5+.5,0.,1.)*.35;
    float rim=pow(1.-clamp(dot(n,vV),0.,1.),2.5);
    float ao=mix(.42,1.,uLayer); // capas internas más oscuras
    vec3 col=vC*(uKeyC*diff+uFillC*fill+uAmb)*ao + uRimC*rim*(.25+uLayer)*vC*1.6;
    col*=.9+r*.2;
    col=mix(col,uTintC*dot(col,vec3(.3,.5,.2))*2.,uTint);
    gl_FragColor=vec4(col,uAlpha);
  }`;
export function furMaterials(n, lenF, dens) {
  const shared = { uKey: { value: new Vector3(.6, .7, .9) }, uKeyC: { value: new THREE.Color(1.15, 1.0, .86) }, uFillC: { value: new THREE.Color(.35, .45, .7) },
    uRimC: { value: new THREE.Color(1.0, .75, .5) }, uAmb: { value: new THREE.Color(.1, .1, .14) }, uWind: { value: new Vector3() }, uTint: { value: 0 }, uTintC: { value: new THREE.Color(.5, .8, 1.2) }, uAlpha: { value: 1 } };
  const mats = []; for (let i = 0; i < n; i++) if (n === 1) mats.push(new THREE.ShaderMaterial({ vertexShader: furVS, fragmentShader: furFS, uniforms: { ...shared, uLayer: { value: 0 }, uLen: { value: 0 }, uDens: { value: dens }, uDroop: { value: 0 } } })); else for (let i = 0; i < n; i++) mats.push(new THREE.ShaderMaterial({ vertexShader: furVS, fragmentShader: furFS, transparent: false,
    uniforms: { ...shared, uLayer: { value: i / (n - 1) }, uLen: { value: lenF }, uDens: { value: dens }, uDroop: { value: lenF * .35 } } }));
  return { mats, shared };
}
export function flenAttr(g, fn) { const p = g.attributes.position; const a = new Float32Array(p.count); for (let i = 0; i < p.count; i++) a[i] = fn(p.getX(i), p.getY(i), p.getZ(i)); g.setAttribute('flen', new THREE.BufferAttribute(a, 1)); }
export function colorize(g, fn) { const p = g.attributes.position; const c = new Float32Array(p.count * 3); for (let i = 0; i < p.count; i++) { const v = fn(p.getX(i), p.getY(i), p.getZ(i)); c[i * 3] = v[0]; c[i * 3 + 1] = v[1]; c[i * 3 + 2] = v[2]; } g.setAttribute('color', new THREE.BufferAttribute(c, 3)); }
export const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---------- textura de la trufa (surcos) ----------
function noseTexture() {
  const N = 512, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'); const img = x.createImageData(N, N);
  const pts = []; let sd = 7; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 700; i++) pts.push([r() * N, r() * N]);
  const grid = {}; for (const p of pts) { const k = ((p[0] / 32) | 0) + ',' + ((p[1] / 32) | 0); (grid[k] = grid[k] || []).push(p); }
  for (let y = 0; y < N; y++) for (let X = 0; X < N; X++) { let d1 = 1e9, d2 = 1e9; const gx = (X / 32) | 0, gy = (y / 32) | 0;
    for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) { const L = grid[((gx + a + 16) % 16) + ',' + ((gy + b + 16) % 16)]; if (!L) continue; for (const p of L) { let dx = Math.abs(p[0] - X); dx = Math.min(dx, N - dx); let dy = Math.abs(p[1] - y); dy = Math.min(dy, N - dy); const d = dx * dx + dy * dy; if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; } }
    const e = Math.sqrt(d2) - Math.sqrt(d1); const v = Math.min(255, 40 + e * 22); const i = (y * N + X) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  x.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function sphUV(g, c) { const p = g.attributes.position; const uv = new Float32Array(p.count * 2); for (let i = 0; i < p.count; i++) { const x = p.getX(i) - c[0], y = p.getY(i) - c[1], z = p.getZ(i) - c[2];
  uv[i * 2] = (Math.atan2(x, z) / Math.PI + 1) * 2; uv[i * 2 + 1] = (Math.atan2(y, Math.hypot(x, z)) / Math.PI + .5) * 2; } g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); }
export const NOSETEX = noseTexture();

// ---------- ojo ----------
function eyeTexture(iris) {
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  x.fillStyle = '#120804'; x.fillRect(0, 0, 512, 512);
  const cx = 128, cy = 256; const ir = `rgb(${iris.map(v => Math.round(v * 255)).join(',')})`; const ir2 = `rgb(${iris.map(v => Math.round(v * 120)).join(',')})`;
  x.save(); x.translate(cx, cy); x.scale(.55, 1);
  const g = x.createRadialGradient(0, 0, 10, 0, 0, 125); g.addColorStop(0, '#000'); g.addColorStop(.44, '#000'); g.addColorStop(.5, ir2); g.addColorStop(.7, ir); g.addColorStop(.92, ir2); g.addColorStop(1, '#0a0503');
  x.fillStyle = g; x.beginPath(); x.arc(0, 0, 125, 0, 7); x.fill();
  let sd = 3; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  x.globalAlpha = .12; for (let i = 0; i < 260; i++) { const a = r() * 6.283; x.strokeStyle = r() < .5 ? '#000' : '#ffd9a0'; x.lineWidth = 1 + r() * 2; x.beginPath(); x.moveTo(Math.cos(a) * 58, Math.sin(a) * 58); x.lineTo(Math.cos(a + (r() - .5) * .3) * (90 + r() * 30), Math.sin(a + (r() - .5) * .3) * (90 + r() * 30)); x.stroke(); }
  x.restore();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

// ---------- montaje ----------
export function buildDog(B, opts = {}) {
  const env = opts.env || null;
  const step = opts.step || .04, shells = opts.shells || 14;
  const root = new THREE.Group(); const head = new THREE.Group(); root.add(head);
  const sdf = headSDF(B); const EX = .37, EY = .14;
  const g = mesh(sdf, [-1.35, -2.6, -1.9], [1.35, 1.2, 2.25 + (B.snoutLen - 1)], step);
  const sz = 1.38 + (B.snoutLen - 1) * .9;
  colorize(g, (x, y, z) => { let c = B.fur; const ax = Math.abs(x);
    c = mix3(c, B.furLight, sm(.0, -.9, y) * sm(-.2, .4, z) * .8);          // pecho/papada claros
    c = mix3(c, B.furLight, sm(.6, 1.4, z) * sm(.2, -.5, y) * .35);           // hocico
    c = mix3(c, B.furDark, sm(.35, .75, y) * sm(.2, 0, ax) * .25);             // raya de la frente
    if (B.wolf) { c = mix3(c, B.furDark, sm(.2, .7, y) * .6); c = mix3(c, B.furLight, sm(-.1, -.55, y) * sm(.5, 1.1, z)); c = mix3(c, B.furLight, sm(.3, .6, ax) * sm(.05, -.2, y) * .8); }
    c = mix3(c, [.08, .05, .04], sm(-.5, -.6, y) * sm(.9, 1.2, z) * 0);
    return c; });
  flenAttr(g, (x, y, z) => { const ax = Math.abs(x); const de = Math.hypot(ax - .37, y - .14, z - .74) / B.eyeR; let f = sm(1.15, 1.9, de);
    f *= 1 - sm(sz - .15, sz + .2, z) * sm(-.5, -.1, y) * .9;      // punta del hocico casi rasa
    f *= .6 + .4 * sm(1.3, .6, z);                                  // hocico corto
    f *= 1 + sm(-.4, -1.4, y) * .6;                                   // pecho más largo
    return f; });
  const { mats, shared } = furMaterials(shells, opts.furLen || .085, opts.dens || 46);
  const furMeshes = mats.map(m => { const me = new THREE.Mesh(g, m); head.add(me); return me; });
  // nariz
  const ng = mesh(noseSDF(B), [-.32, -.45, sz - .1], [.32, .05, sz + .55], .012);
  sphUV(ng, [0, -.15, sz - .2]);
  const nose = new THREE.Mesh(ng, new THREE.MeshPhysicalMaterial({ color: 0x2a2422, roughness: .45, roughnessMap: NOSETEX, bumpMap: NOSETEX, bumpScale: 2.5, clearcoat: .5, clearcoatRoughness: .3, envMap: env, envMapIntensity: .6 }));
  head.add(nose);
  // ojos
  const eyeTex = eyeTexture(B.iris); const eyes = [];
  for (const s of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(.37 * s, .14, .74 - B.eyeR * .3); head.add(piv);
    const eb = new THREE.Mesh(new THREE.SphereGeometry(B.eyeR, 48, 32), new THREE.MeshPhysicalMaterial({ map: eyeTex, roughness: .08, clearcoat: 1, clearcoatRoughness: .02, ior: 1.4, envMap: env, envMapIntensity: 1.2 }));
    eb.rotation.y = s * .18; piv.add(eb); eyes.push(piv);
    // párpado/contorno oscuro
    const lid = new THREE.Mesh(new THREE.TorusGeometry(B.eyeR * .97, B.eyeR * .09, 12, 48), new THREE.MeshStandardMaterial({ color: 0x140a06, roughness: .7 }));
    lid.position.copy(piv.position).add(new Vector3(0, 0, B.eyeR * .5)); lid.rotation.y = s * .25; lid.scale.y = B.wolf ? .78 : .92; head.add(lid);
  }
  // lágrima (menisco) en cada ojo
  const tearMat = new THREE.MeshPhysicalMaterial({ color: 0xbfd8ff, roughness: 0, transparent: true, opacity: 0, clearcoat: 1, metalness: .5, envMap: env, envMapIntensity: 2.5, emissive: 0x223344 });
  const drops = [-1, 1].map(s => { const m = new THREE.Mesh(new THREE.SphereGeometry(B.eyeR * .22, 20, 14), tearMat); m.position.set(.37 * s - s * B.eyeR * .75, .14 - B.eyeR * .55, .74 + B.eyeR * .35); m.scale.set(1, 1.3, .8); head.add(m); return m; });
  const tears = [-1, 1].map(s => { const m = new THREE.Mesh(new THREE.TorusGeometry(B.eyeR * .9, B.eyeR * .1, 10, 40, Math.PI * .9), tearMat); m.position.set(.37 * s, .14, .74 + B.eyeR * .55); m.rotation.set(0, s * .25, Math.PI * 1.05); head.add(m); return m; });
  // orejas (pivote arriba)
  const eg = mesh(earSDF(B), B.earUp ? [-.32, -.1, -.2] : [-.22, -1.6, -.55], B.earUp ? [.32, .75, .2] : [.22, .15, .65], .022);
  flenAttr(eg, () => 1);
  colorize(eg, (x, y) => B.earUp ? mix3(B.furDark, B.fur, .4) : mix3(B.fur, B.furDark, sm(-.2, -1.2, y) * .45));
  const earFur = furMaterials(Math.max(6, shells >> 1), (opts.furLen || .085) * 1.3, opts.dens || 46);
  earFur.mats.forEach(m => m.uniforms = { ...m.uniforms, ...shared, uLen: m.uniforms.uLen, uLayer: m.uniforms.uLayer, uDens: m.uniforms.uDens, uDroop: m.uniforms.uDroop });
  const ears = [-1, 1].map(s => { const piv = new THREE.Group(); piv.position.set(s * (B.earUp ? .5 : .8), B.earUp ? .78 : .5, B.earUp ? -.15 : .02); head.add(piv);
    piv.rotation.z = s * (B.earUp ? -.35 : .1); piv.rotation.y = s * (B.earUp ? .35 : 0);
    earFur.mats.forEach(m => piv.add(new THREE.Mesh(eg, m))); return piv; });
  return { root, head, eyes, ears, nose, tears, drops, tearMat, fur: shared, furMeshes, B };
}
