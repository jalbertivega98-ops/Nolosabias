// Utilidades compartidas de los vídeos de perros 3D (serie 4): cámara, juguetes, piernas de persona, voltereta y HUD extra.
import { THREE, W, H, V3, g2, camera, txt, lerp, smooth, fract } from '../../lib/core.js';
import { scene, dog, ENV } from './stage.js';

export const TAU = Math.PI * 2, BLUE = '#9fd8ff', COP = '#e3a372', RED = '#ff7a5a', GREEN = '#8fe0a0';
export function look(px, py, pz, tx, ty, tz, fov = 30) { camera.up.set(0, 1, 0); camera.fov = fov; camera.position.set(px, py, pz); camera.lookAt(tx, ty, tz); }
export function orbit(az, d, y, ty = 6.5, tz = 0, tx = 0) { look(tx + Math.sin(az) * d, y, Math.cos(az) * d + tz, tx, ty, tz); }
export function place(D, x, z, ry = 0) { D.root.position.set(x, 0, z); D.root.rotation.set(0, ry, 0); D.shadow.visible = true; D.shadow.position.y = .02; }
export const wp = (o) => { o.updateMatrixWorld(true); return o.getWorldPosition(new THREE.Vector3()); };
export const noseC = (D = dog) => new THREE.Box3().setFromObject(D.head.nose).getCenter(new THREE.Vector3());
// boca: delante del hueco de la lengua
export function mouth(D = dog) { const t = D.head.tongue; t.updateMatrixWorld(true); return t.localToWorld(new THREE.Vector3(0, -.1, -.15)); }

// voltereta: a = ángulo de giro sobre el eje del cuerpo (0 de pie, π/2 de lado, π panza arriba). Ajusta altura para que apoye en el suelo.
export function roll(D, a, x = 0, z = 0, ry = 0) { D.root.rotation.set(0, ry, 0); D.root.rotateZ(a); const c = V3(0, 6.4, -1); const rc = c.clone().applyQuaternion(D.root.quaternion);
  const r = 2.0 + 4.4 * Math.max(0, Math.cos(a)) ** 2; D.root.position.set(x - rc.x + Math.sin(ry) * 0, r - rc.y, z - rc.z + c.z * 0); D.shadow.visible = a < .3; }

// ---------- juguetes ----------
function stripeTex(c1, c2) { const cv = document.createElement('canvas'); cv.width = 256; cv.height = 32; const x = cv.getContext('2d'); for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? c1 : c2; x.beginPath(); x.moveTo(i * 16, 0); x.lineTo(i * 16 + 16, 0); x.lineTo(i * 16 + 32, 32); x.lineTo(i * 16 + 16, 32); x.fill(); }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1); t.colorSpace = THREE.SRGBColorSpace; return t; }
export function makeRope(c1 = '#d8402e', c2 = '#f1e6d0', len = 4.2) { const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ map: stripeTex(c1, c2), roughness: .85, envMap: ENV, envMapIntensity: .4 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, len, 16, 1), m); body.rotation.z = Math.PI / 2; g.add(body);
  for (const s of [-1, 1]) { const k = new THREE.Mesh(new THREE.SphereGeometry(.5, 20, 14), m); k.position.x = s * len / 2; k.scale.set(.9, 1, 1); g.add(k);
    for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.CylinderGeometry(.06, .03, .7, 6), m); const a = i / 6 * TAU; f.position.set(s * (len / 2 + .75), Math.cos(a) * .18, Math.sin(a) * .18); f.rotation.z = Math.PI / 2 + s * Math.cos(a) * .3; g.add(f); } }
  g.visible = false; scene.add(g); return g; }
export function makeBall(col = 0xc8e04a, r = .95) { const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color: col, roughness: .9, envMap: ENV, envMapIntensity: .4, emissive: col, emissiveIntensity: .08 });
  g.add(new THREE.Mesh(new THREE.SphereGeometry(r, 28, 18), m)); const seam = new THREE.Mesh(new THREE.TorusGeometry(r * 1.0, .04, 8, 64), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .6 })); seam.rotation.x = 1.2; seam.scale.set(1, .75, 1); g.add(seam);
  g.visible = false; scene.add(g); return g; }
// cilindro entre dos puntos (cuerda tensa)
export function makeStick(r = .2, mat) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 12, 1), mat || new THREE.MeshStandardMaterial({ map: stripeTex('#d8402e', '#f1e6d0'), roughness: .85 })); m.visible = false; scene.add(m); return m; }
export function stick(m, a, b) { const d = b.clone().sub(a); const l = d.length(); m.position.copy(a).add(b).multiplyScalar(.5); m.scale.set(1, l, 1); m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); m.visible = true; if (m.material.map) m.material.map.repeat.set(1, l / 1.2); }

// ---------- piernas de una persona sentada (de las rodillas abajo) ----------
export function makeLegs() { const g = new THREE.Group(); const jean = new THREE.MeshStandardMaterial({ color: 0x2e4c78, roughness: .85, envMap: ENV, envMapIntensity: .3 });
  const shoe = new THREE.MeshStandardMaterial({ color: 0x9aa0aa, roughness: .6, envMap: ENV, envMapIntensity: .35 }); const sole = new THREE.MeshStandardMaterial({ color: 0x3a3a40, roughness: .8 });
  const feet = [];
  for (const s of [-1, 1]) { const leg = new THREE.Group(); leg.position.set(s * 1.9, 0, 0); g.add(leg);
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(.95, .8, 7.6, 20), jean); shin.position.set(0, 4.6, -.4); leg.add(shin);
    const knee = new THREE.Mesh(new THREE.SphereGeometry(1.05, 20, 14), jean); knee.position.set(0, 8.4, -.4); leg.add(knee);
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.05, 12, 20), jean); thigh.rotation.x = Math.PI / 2; thigh.position.set(0, 8.4, -6.4); leg.add(thigh);
    const foot = new THREE.Group(); foot.position.set(0, 0, 0); leg.add(foot);
    const up = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), shoe); up.scale.set(1.15, .85, 2.4); up.position.set(0, .95, 1.2); foot.add(up);
    const so = new THREE.Mesh(new THREE.BoxGeometry(2.3, .35, 5.2), sole); so.position.set(0, .18, 1.2); foot.add(so);
    feet.push(foot); }
  g.userData.feet = feet; g.visible = false; scene.add(g); return g; }

// ---------- HUD ----------
export function glow(x, y, r, col, a) { if (a <= .01) return; g2.save(); const gr = g2.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g2.globalAlpha = a; g2.globalCompositeOperation = 'lighter'; g2.fillStyle = gr; g2.fillRect(x - r, y - r, r * 2, r * 2); g2.restore(); }
export function ring(x, y, r, col, a, lw = 5) { if (a <= .01) return; g2.save(); g2.globalAlpha = a; g2.strokeStyle = col; g2.lineWidth = lw; g2.shadowColor = col; g2.shadowBlur = 16; g2.beginPath(); g2.arc(x, y, r, 0, 7); g2.stroke(); g2.restore(); }
export function panel(x, y, w, h, a, col = 'rgba(2,6,14,.78)') { if (a <= .01) return; g2.save(); g2.globalAlpha = a; g2.fillStyle = col; g2.beginPath(); g2.roundRect(x, y, w, h, 26); g2.fill(); g2.restore(); }
// línea de lista con marca ✓ / ✗
export function item(ok, s, y, a, col) { if (a <= .01) return; const c = col || (ok ? GREEN : RED); txt(ok ? '✓' : '✗', 150, y, 46, { font: 'Montserrat', weight: 800, alpha: a, fill: c }); txt(s, 205, y, 36, { align: 'left', font: 'Montserrat', weight: 800, alpha: a }); }
export function strike(x0, x1, y, k, a, col = RED) { if (a <= .01 || k <= 0) return; g2.save(); g2.globalAlpha = a; g2.strokeStyle = col; g2.lineWidth = 9; g2.lineCap = 'round'; g2.shadowColor = col; g2.shadowBlur = 14; g2.beginPath(); g2.moveTo(x0, y); g2.lineTo(lerp(x0, x1, k), y); g2.stroke(); g2.restore(); }
// corazón
export function heart(x, y, s, a, col = '#ff7a8a') { if (a <= .01) return; g2.save(); g2.translate(x, y); g2.scale(s, s); g2.globalAlpha = a; g2.fillStyle = col; g2.shadowColor = col; g2.shadowBlur = 24; g2.beginPath(); g2.moveTo(0, 18); g2.bezierCurveTo(-34, -6, -22, -34, 0, -18); g2.bezierCurveTo(22, -34, 34, -6, 0, 18); g2.fill(); g2.restore(); }
// gráfico de barras sencillo
export function bars(x, y, w, h, vals, labels, a, cols, k = 1) { if (a <= .01) return; const n = vals.length, bw = w / n * .62; g2.save(); g2.globalAlpha = a;
  g2.strokeStyle = 'rgba(255,255,255,.35)'; g2.lineWidth = 2; g2.beginPath(); g2.moveTo(x, y); g2.lineTo(x + w, y); g2.stroke();
  vals.forEach((v, i) => { const bx = x + (i + .5) * w / n - bw / 2; const hh = h * v * clamp01((k * n - i)); const c = cols[i] || COP; g2.fillStyle = c; g2.shadowColor = c; g2.shadowBlur = 14; g2.fillRect(bx, y - hh, bw, hh); g2.shadowBlur = 0;
    txt(labels[i], bx + bw / 2, y + 34, 22, { alpha: a, spacing: 2, fill: '#fff' }); }); g2.restore(); }
const clamp01 = (v) => Math.max(0, Math.min(1, v));
