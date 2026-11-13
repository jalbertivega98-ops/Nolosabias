// Perro de cuerpo entero: cuerpo SDF + marching cubes con «skinning» por CPU (huesos FK), pelo por capas y la cabeza de dog.js montada en el hueso de la cabeza.
// Unidades: las de la cabeza (radio del cráneo ≈ 1 ≈ 7 cm). El perro mira hacia +z, suelo en y = 0. Su derecha es −x.
import { THREE } from '../../lib/core.js';
import { buildDog, sdEll, sdRoundCone, smin, mesh, furMaterials, flenAttr, colorize, mix3, sm } from './dog.js';

const HEAD_AT = [0, 10.7, 5.9];
// ---------- huesos (posición de reposo, padre) ----------
const BONES = [
  ['pelvis', null, [0, 6.5, -3.4]],
  ['chest', 'pelvis', [0, 6.4, 0.6]],
  ['neck', 'chest', [0, 7.4, 3.2]],
  ['head', 'neck', HEAD_AT],
];
const LEGS = { LF: [1, 1], RF: [-1, 1], LH: [1, -1], RH: [-1, -1] };
for (const [n, [s, f]] of Object.entries(LEGS)) {
  if (f > 0) BONES.push([n + 'u', 'chest', [s * 1.35, 6.4, 2.3]], [n + 'l', n + 'u', [s * 1.4, 3.7, 2.0]], [n + 'p', n + 'l', [s * 1.35, 0.95, 2.3]]);
  else BONES.push([n + 'u', 'pelvis', [s * 1.3, 6.4, -3.7]], [n + 'l', n + 'u', [s * 1.35, 3.6, -2.6]], [n + 'p', n + 'l', [s * 1.3, 1.4, -4.1]]);
}
const TAILP = [[0, 7.2, -5.3], [0, 7.15, -6.5], [0, 6.95, -7.7], [0, 6.55, -8.8], [0, 6.0, -9.8], [0, 5.35, -10.6]];
for (let i = 0; i < 5; i++) BONES.push(['t' + i, i ? 't' + (i - 1) : 'pelvis', TAILP[i]]);

// ---------- partes del cuerpo (SDF) con su hueso ----------
function parts(B) {
  const P = [];
  const E = (bone, c, r, k = .4) => P.push([bone, (x, y, z) => sdEll(x, y, z, c, r), k]);
  const C = (bone, a, b, r1, r2, k = .4) => P.push([bone, (x, y, z) => sdRoundCone(x, y, z, a, b, r1, r2), k]);
  E('pelvis', [0, 6.5, -3.6], [1.75, 1.85, 2.0]);
  C('pelvis', [0, 6.55, -3.2], [0, 6.5, -.8], 1.75, 1.8, 1.4);
  C('chest', [0, 6.5, -.8], [0, 6.4, 1.6], 1.8, 1.95, 1.4);
  E('chest', [0, 6.05, 1.9], [1.95, 2.3, 2.0], 1.4);
  C('neck', [0, 7.0, 2.9], [0, 9.5, 5.0], 1.6, 1.3);
  for (const [n, [s, f]] of Object.entries(LEGS)) {
    if (f > 0) {
      C(n + 'u', [s * 1.35, 6.5, 2.4], [s * 1.4, 3.7, 2.0], .85, .5);
      C(n + 'l', [s * 1.4, 3.7, 2.0], [s * 1.35, .95, 2.3], .42, .33);
      E(n + 'p', [s * 1.35, .4, 2.7], [.5, .38, .7]);
      C(n + 'p', [s * 1.35, .95, 2.3], [s * 1.35, .5, 2.5], .33, .36);
    } else {
      C(n + 'u', [s * 1.25, 6.3, -3.7], [s * 1.35, 3.6, -2.6], 1.2, .55);
      C(n + 'l', [s * 1.35, 3.6, -2.6], [s * 1.3, 1.4, -4.1], .45, .3);
      C(n + 'p', [s * 1.3, 1.4, -4.1], [s * 1.3, .5, -3.75], .3, .33);
      E(n + 'p', [s * 1.3, .4, -3.35], [.5, .38, .68]);
    }
  }
  const TR = [.5, .36, .3, .25, .2, .14];
  for (let i = 0; i < 5; i++) C('t' + i, TAILP[i], TAILP[i + 1], TR[i], TR[i + 1], i ? .15 : .35);
  return P;
}

export function buildBody(B, opts = {}) {
  const root = new THREE.Group();
  const P = parts(B);
  const sdf = (x, y, z) => { let d = 1e9; for (const p of P) d = smin(d, p[1](x, y, z), p[2]); return d; };
  const g = mesh(sdf, [-2.6, -.2, -11.6], [2.6, 10.8, 5.8], opts.bstep || .1);
  // --- huesos ---
  const bone = {}, names = [];
  for (const [n, par, pos] of BONES) { const o = new THREE.Object3D(); o.name = n; o.userData.rest = new THREE.Vector3(...pos); bone[n] = o; names.push(n);
    if (par) { bone[par].add(o); o.position.set(pos[0], pos[1], pos[2]).sub(bone[par].userData.rest); } else o.position.set(...pos); }
  const skel = bone.pelvis; skel.updateMatrixWorld(true);
  const bind = names.map(n => bone[n].matrixWorld.clone().invert());
  // --- pesos: cada parte pesa según su propia distancia (las 4 mayores) ---
  const pos = g.attributes.position, nor = g.attributes.normal, nv = pos.count;
  const bi = new Uint8Array(nv * 4), bw = new Float32Array(nv * 4);
  const idx = Object.fromEntries(names.map((n, i) => [n, i]));
  const tmp = new Float32Array(names.length);
  for (let v = 0; v < nv; v++) { tmp.fill(0); const x = pos.getX(v), y = pos.getY(v), z = pos.getZ(v);
    for (const [bn, f] of P) { const d = Math.max(0, f(x, y, z)); tmp[idx[bn]] = Math.max(tmp[idx[bn]], Math.exp(-d * 5)); }
    const ord = [...tmp.keys()].sort((a, b) => tmp[b] - tmp[a]).slice(0, 4); let s = 0; for (const i of ord) s += tmp[i];
    ord.forEach((i, k) => { bi[v * 4 + k] = i; bw[v * 4 + k] = tmp[i] / s; }); }
  const P0 = Float32Array.from(pos.array), N0 = Float32Array.from(nor.array);
  // --- color y largo del pelo ---
  colorize(g, (x, y, z) => { let c = B.fur;
    c = mix3(c, B.furLight, sm(5.0, 3.6, y) * sm(-2.6, 2.0, z) * .55);    // vientre y patas claros
    c = mix3(c, B.furLight, sm(1.5, .3, y) * .5);                         // patas
    c = mix3(c, B.furDark, sm(6.8, 8.2, y) * sm(-4, 2, z) * .25);          // lomo
    c = mix3(c, B.furLight, sm(-6.5, -8.8, z) * .35);                      // cola, punta clara
    return c; });
  flenAttr(g, (x, y, z) => { let f = 1;
    f *= .45 + .55 * sm(.8, 3.0, y);                                       // patas cortas
    f *= 1 + sm(4.8, 3.6, y) * sm(-3, 2.5, z) * .7;                         // flecos del vientre
    f *= 1 + sm(-5.6, -7.0, z) * .9;                      // flecos de la cola (por debajo)
    f *= 1 + sm(4.5, 3.0, z) * sm(7, 4.5, y) * .5;                           // pechera
    return f; });
  const furLen = opts.furLen || .13, sh = opts.shells || 8;
  const { mats, shared } = furMaterials(sh, furLen, opts.dens || 55);
  const body = new THREE.Group(); root.add(body);
  const furMeshes = mats.map(m => { const me = new THREE.Mesh(g, m); me.frustumCulled = false; body.add(me); return me; });
  // --- cabeza (rígida) en el hueso de la cabeza ---
  const D = buildDog({ ...B, noNeck: 1 }, { env: opts.env, step: opts.step, shells: opts.headShells || sh, furLen: .05, dens: 120 });
  // comparte la luz del pelo
  for (const m of mats) for (const k of ['uKey', 'uKeyC', 'uFillC', 'uRimC', 'uAmb', 'uWind', 'uTint', 'uTintC', 'uAlpha']) m.uniforms[k] = D.fur[k];
  const holder = new THREE.Group(); holder.matrixAutoUpdate = false; root.add(holder);
  const hs = opts.headScale || 1.5; D.root.position.set(...HEAD_AT); D.root.scale.setScalar(hs); D.root.rotation.x = .12; holder.add(D.root);
  // --- sombra de contacto ---
  const sc = document.createElement('canvas'); sc.width = sc.height = 128; { const x = sc.getContext('2d'); const gr = x.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(0,0,0,.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); }
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = .02; shadow.scale.set(6.5, 15, 1); root.add(shadow);
  // --- pose ---
  const M = names.map(() => new THREE.Matrix4()); const rootInv = new THREE.Matrix4();
  function apply() {
    skel.updateMatrixWorld(true);
    for (let i = 0; i < names.length; i++) M[i].multiplyMatrices(bone[names[i]].matrixWorld, bind[i]);
    const pa = pos.array, na = nor.array, e = M.map(m => m.elements);
    for (let v = 0; v < nv; v++) { const x = P0[v * 3], y = P0[v * 3 + 1], z = P0[v * 3 + 2], a = N0[v * 3], b = N0[v * 3 + 1], c = N0[v * 3 + 2];
      let X = 0, Y = 0, Z = 0, NX = 0, NY = 0, NZ = 0;
      for (let k = 0; k < 4; k++) { const w = bw[v * 4 + k]; if (w < .002) continue; const m = e[bi[v * 4 + k]];
        X += w * (m[0] * x + m[4] * y + m[8] * z + m[12]); Y += w * (m[1] * x + m[5] * y + m[9] * z + m[13]); Z += w * (m[2] * x + m[6] * y + m[10] * z + m[14]);
        NX += w * (m[0] * a + m[4] * b + m[8] * c); NY += w * (m[1] * a + m[5] * b + m[9] * c); NZ += w * (m[2] * a + m[6] * b + m[10] * c); }
      const l = Math.hypot(NX, NY, NZ) || 1; pa[v * 3] = X; pa[v * 3 + 1] = Y; pa[v * 3 + 2] = Z; na[v * 3] = NX / l; na[v * 3 + 1] = NY / l; na[v * 3 + 2] = NZ / l; }
    pos.needsUpdate = true; nor.needsUpdate = true;
    holder.matrix.copy(M[idx.head]); holder.matrixWorldNeedsUpdate = true;
  }
  function reset() { for (const n of names) bone[n].rotation.set(0, 0, 0); const r = bone.pelvis.userData.rest; bone.pelvis.position.copy(r); }
  // Parámetros de pose (todos opcionales):
  // walk {ph, amp, gait:'trot'|'gallop'}, tail {ph, amp, bias(+ = su derecha), up}, shake {ph, amp}, bow (0..1), headYaw, headPitch, headRoll, crouch
  function pose(p = {}) {
    reset();
    const pel = bone.pelvis, ch = bone.chest;
    if (p.walk) { const { ph, amp = 1, gait = 'trot' } = p.walk;
      const off = gait === 'gallop' ? { LF: 0, RF: .35, LH: Math.PI, RH: Math.PI + .35 } : { LF: 0, RH: 0, RF: Math.PI, LH: Math.PI };
      const A = gait === 'gallop' ? .75 : .42;
      for (const n of Object.keys(LEGS)) { const q = ph + off[n]; const front = n[1] === 'F'; const s = Math.sin(q), c = Math.cos(q);
        bone[n + 'u'].rotation.x = -A * s * amp;
        const lift = Math.max(0, c) * amp; // fase de vuelo: pata adelante y doblada
        if (front) { bone[n + 'l'].rotation.x = lift * .9; bone[n + 'p'].rotation.x = -lift * .6; }
        else { bone[n + 'l'].rotation.x = -lift * .7 - .05; bone[n + 'p'].rotation.x = lift * .8; } }
      const bob = gait === 'gallop' ? Math.sin(ph) : Math.abs(Math.sin(ph * 2) * .5);
      pel.position.y += bob * .25 * amp;
      if (gait === 'gallop') { pel.rotation.x = Math.sin(ph) * .1 * amp; ch.rotation.x = -Math.sin(ph + .6) * .18 * amp; bone.neck.rotation.x = Math.sin(ph + 1.2) * .12 * amp; }
      else { pel.rotation.z = Math.sin(ph) * .03 * amp; bone.neck.rotation.x = Math.sin(ph * 2) * .03 * amp; } }
    if (p.bow) { const k = p.bow;
      pel.rotation.x = .42 * k; pel.position.y += .35 * k; // pecho abajo, culo arriba
      for (const n of ['LF', 'RF']) { bone[n + 'u'].rotation.x = -.05 * k; bone[n + 'l'].rotation.x = -1.6 * k; bone[n + 'p'].rotation.x = 1.15 * k; }
      for (const n of ['LH', 'RH']) { bone[n + 'u'].rotation.x = -.5 * k; bone[n + 'l'].rotation.x = .12 * k; bone[n + 'p'].rotation.x = .0 * k; }
      bone.neck.rotation.x = -.6 * k; }
    if (p.crouch) { const k = p.crouch; pel.position.y -= 1.2 * k; for (const n of Object.keys(LEGS)) { const f = n[1] === 'F'; bone[n + 'u'].rotation.x += (f ? .5 : -.6) * k; bone[n + 'l'].rotation.x += (f ? -1.0 : 1.1) * k; bone[n + 'p'].rotation.x += (f ? .5 : -.5) * k; } }
    if (p.shake) { const { ph, amp = 1 } = p.shake; // la ola va de la cabeza a la cola
      bone.neck.rotation.z = Math.sin(ph) * .55 * amp; bone.neck.rotation.y = Math.sin(ph) * .25 * amp;
      ch.rotation.z = Math.sin(ph - .9) * .32 * amp; pel.rotation.z = Math.sin(ph - 1.8) * .16 * amp;
      for (let i = 0; i < 5; i++) bone['t' + i].rotation.y += Math.sin(ph - 2.4 - i * .5) * .3 * amp; }
    { const tl = p.tail || {}; const { ph = 0, amp = 0, bias = 0, up = 0, stiff = 0 } = tl;
      for (let i = 0; i < 5; i++) { const b = bone['t' + i]; const lag = ph - i * (.55 - stiff * .45);
        b.rotation.y += (Math.sin(lag) * amp + bias) * (i ? .55 : .9); b.rotation.x = up * (i ? .1 : .7) - (i ? .04 * (1 - Math.min(1, up)) : 0); } }
    bone.head.rotation.set(p.headPitch || 0, p.headYaw || 0, p.headRoll || 0);
    if (p.headYaw) bone.neck.rotation.y += p.headYaw * .4;
    apply();
    D.ears.forEach((e, i) => { const s = i ? 1 : -1; e.rotation.z = s * (.1 + (p.ear || 0) * .18) + (p.shake ? Math.sin(p.shake.ph - .3) * .5 * (p.shake.amp || 1) : 0); e.rotation.x = -(p.ear || 0) * .35; });
  }
  pose({});
  return { root, body, bone, pose, head: D, dogHead: D.head, fur: D.fur, furMeshes, shadow, tailTip: () => { root.updateMatrixWorld(true); return root.localToWorld(bone.t4.localToWorld(new THREE.Vector3(...TAILP[5]).sub(bone.t4.userData.rest))); } };
}
