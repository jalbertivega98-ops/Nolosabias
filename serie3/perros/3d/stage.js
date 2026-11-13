// Escenario común de los vídeos de perros de cuerpo entero: fondo de la serie, suelo, luces, perro y utilidades de HUD.
import { THREE, W, H, clamp, lerp, smooth, easeOut, V3, renderer, g2, camera, txt, copperGrad, fract } from '../../lib/core.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildBody } from './body.js';
import { GOLDEN, WOLF } from './dog.js';

const pm = new THREE.PMREMGenerator(renderer); export const ENV = pm.fromScene(new RoomEnvironment(), .04).texture;
export const scene = new THREE.Scene();
export const bg = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
  uniforms: { uWarm: { value: 0 } },
  vertexShader: `varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform float uWarm; varying vec3 vD; void main(){ float y=vD.y*.5+.5; vec3 c=mix(vec3(.006,.014,.036),vec3(.03,.07,.14),pow(clamp(y,0.,1.),1.3));
    c+=vec3(.35,.16,.06)*pow(max(dot(vD,normalize(vec3(-.6,.3,-.7))),0.),6.)*.25; c=mix(c,c*vec3(1.6,1.05,.7),uWarm); gl_FragColor=vec4(c,1.); }` }));
scene.add(bg);
// suelo: charco de luz alrededor del perro que se funde con el fondo; rejilla cobre opcional que se desplaza
export const floor = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.ShaderMaterial({ depthWrite: true,
  uniforms: { uC: { value: new THREE.Vector2() }, uOff: { value: new THREE.Vector2() }, uGrid: { value: .0 }, uR: { value: 26 }, uCompass: { value: 0 } },
  vertexShader: `varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `uniform vec2 uC, uOff; uniform float uGrid, uR, uCompass; varying vec3 vW;
    void main(){ vec2 p=vW.xz; float r=length(p-uC)/uR; vec3 base=vec3(.006,.014,.036);
      vec3 c=mix(vec3(.05,.08,.14),base,smoothstep(0.,1.,r));
      vec2 g=abs(fract((p+uOff)/4.)-.5); float ln=1.-smoothstep(.0,.03,min(g.x,g.y));
      c+=vec3(.9,.55,.3)*ln*uGrid*.18*(1.-smoothstep(.3,1.3,r));
      // rosa de los vientos (vista cenital)
      if(uCompass>0.){ vec2 q=p-uC; float rr=length(q); float ring=1.-smoothstep(.0,.08,abs(rr-13.)); float ring2=1.-smoothstep(.0,.05,abs(rr-10.5));
        float ax=1.-smoothstep(.0,.1,abs(q.x)); ax*=step(rr,16.); float ns=step(q.y,0.);
        c+=uCompass*(vec3(.9,.55,.3)*(ring*.5+ring2*.25)+mix(vec3(.4,.75,1.),vec3(1.,.5,.3),ns)*ax*.5); }
      gl_FragColor=vec4(c,1.); }` }));
floor.rotation.x = -Math.PI / 2; scene.add(floor);
scene.add(new THREE.HemisphereLight(0xbfd4ff, 0x302010, .55));
export const key = new THREE.DirectionalLight(0xffe0c0, 2.2); key.position.set(30, 40, 30); scene.add(key);

const QP = new URLSearchParams(location.search);
export const SH = +(QP.get('sh') || 7);
export const dog = buildBody(GOLDEN, { shells: SH, env: ENV }); scene.add(dog.root);
export function furLight(D, k, rim) { D.fur.uKey.value.copy(k).normalize(); if (rim) D.fur.uRimC.value.copy(rim); }
furLight(dog, V3(.5, .8, .6));
let _other = null;
export function other() { if (!_other) { _other = buildBody(WOLF, { shells: Math.max(5, SH - 2), env: ENV }); scene.add(_other.root); furLight(_other, V3(.5, .8, .6)); } return _other; }

// ---------- perro robot (cajas metálicas) con cola de longitud variable ----------
export const robot = (() => { const g = new THREE.Group(); const M = new THREE.MeshStandardMaterial({ color: 0x7f90a6, metalness: .55, roughness: .5, envMap: ENV, envMapIntensity: .8, emissive: 0x0b121c });
  const J = new THREE.MeshStandardMaterial({ color: 0x2a3340, metalness: .6, roughness: .5, envMap: ENV });
  const LED = new THREE.MeshBasicMaterial({ color: 0x8fe6ff });
  const box = (w, h, d, x, y, z, m = M) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d, 1, 1, 1), m); b.position.set(x, y, z); g.add(b); return b; };
  box(3.6, 3.0, 8.5, 0, 6.6, -1); box(2.6, 2.4, 3.2, 0, 9.4, 4.4); box(1.6, 1.3, 1.8, 0, 8.9, 6.6); box(1.8, 1.8, 1.8, 0, 8.0, 3.4, J);
  for (const s of [-1, 1]) { box(.5, .5, .2, s * .65, 9.7, 6.05, LED); box(.5, 1.3, .3, s * .9, 11.0, 3.8); }
  for (const [x, z] of [[1.2, 2.2], [-1.2, 2.2], [1.2, -4.2], [-1.2, -4.2]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(.42, .36, 5.2, 12), M); l.position.set(x, 2.8, z); g.add(l); box(.9, .4, 1.3, x, .2, z + .25, J); const k = new THREE.Mesh(new THREE.SphereGeometry(.55, 12, 8), J); k.position.set(x, 5.4, z); g.add(k); }
  const tail = []; let par = new THREE.Group(); par.position.set(0, 7.4, -5.25); g.add(par);
  for (let i = 0; i < 6; i++) { const seg = new THREE.Group(); if (i) seg.position.set(0, 0, -1.0); par.add(seg); const c = new THREE.Mesh(new THREE.CylinderGeometry(.24 - i * .02, .26 - i * .02, 1.0, 10), i ? M : J); c.rotation.x = Math.PI / 2; c.position.z = -.5; seg.add(c); tail.push(seg); par = seg; }
  g.userData.tail = tail; g.visible = false; scene.add(g);
  g.userData.pose = (ph, amp, n, up = .35) => { tail.forEach((s, i) => { s.visible = i < n; s.rotation.y = Math.sin(ph - i * .5) * amp * (i ? .5 : .8); s.rotation.x = i ? -.04 : -up; }); };
  return g; })();

// ---------- HUD ----------
export const inA = (t, a, b, f = .3) => smooth(a, a + f, t) * (1 - smooth(b - f, b, t));
export const flashAt = (t, c, d = .28, amp = .3) => (t >= c && t < c + d) ? amp * (1 - (t - c) / d) : 0;
export function stamp(s, x, y, a, rot = -.06, col = '#ff7a5a', size = 52) { if (a <= .01) return; g2.save(); g2.translate(x, y); g2.rotate(rot); g2.globalAlpha = a; g2.strokeStyle = col; g2.lineWidth = 6; g2.font = `800 ${size}px Montserrat`; const w = g2.measureText(s).width + 70;
  g2.strokeRect(-w / 2, -size * .92, w, size * 1.85); g2.restore(); g2.save(); g2.translate(x, y); g2.rotate(rot); g2.translate(-x, -y); txt(s, x, y + 2, size, { font: 'Montserrat', weight: 800, alpha: a, fill: col }); g2.restore(); }
export function question(l1, l2, a, y = 300) { if (a <= .01) return; txt(l1, W / 2, y, 50, { font: 'Montserrat', weight: 800, alpha: a, spacing: 1 }); if (l2) txt(l2, W / 2, y + 66, 60, { font: 'Montserrat', weight: 800, alpha: a, fill: copperGrad(160, 920, y + 66, .5), spacing: 1 }); }
export function cite(s, a) { txt(s, W / 2, 1810, 22, { weight: 300, alpha: a * .65, spacing: 2 }); }
export function bands(a = .55) { let gr = g2.createLinearGradient(0, 0, 0, 700); gr.addColorStop(0, `rgba(2,6,14,${a})`); gr.addColorStop(1, 'rgba(2,6,14,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, W, 700);
  gr = g2.createLinearGradient(0, H, 0, H - 700); gr.addColorStop(0, `rgba(2,6,14,${a + .1})`); gr.addColorStop(1, 'rgba(2,6,14,0)'); g2.fillStyle = gr; g2.fillRect(0, H - 700, W, 700); }
export function big(s, y, a, col, size = 60) { if (a > .01) txt(s, W / 2, y, size, { font: 'Montserrat', weight: 800, alpha: a, fill: col || copperGrad(160, 920, y, .5), spacing: 1 }); }
export function label(s, x, y, a, col = '#e3a372', size = 26, align = 'center') { if (a > .01) txt(s, x, y, size, { spacing: 5, alpha: a, fill: col, align }); }
// pictograma de persona (frente)
export function person(x, y, s, a, col = '#e3a372') { if (a <= .01) return; g2.save(); g2.translate(x, y); g2.scale(s, s); g2.globalAlpha = a; g2.fillStyle = 'rgba(10,20,36,.8)'; g2.strokeStyle = col; g2.lineWidth = 4 / s; g2.shadowColor = col; g2.shadowBlur = 18;
  g2.beginPath(); g2.arc(0, -120, 34, 0, 7); g2.fill(); g2.stroke();
  g2.beginPath(); g2.moveTo(-58, 90); g2.lineTo(-58, -40); g2.quadraticCurveTo(-58, -76, -22, -76); g2.lineTo(22, -76); g2.quadraticCurveTo(58, -76, 58, -40); g2.lineTo(58, 90); g2.closePath(); g2.fill(); g2.stroke(); g2.restore(); }
// corazón con latido y ECG
export function ecg(x, y, w, h, t, bpm, a, col = '#ff7a5a') { if (a <= .01) return; g2.save(); g2.globalAlpha = a; g2.strokeStyle = col; g2.lineWidth = 5; g2.shadowColor = col; g2.shadowBlur = 18; g2.beginPath();
  const per = 60 / bpm; for (let i = 0; i <= 200; i++) { const u = i / 200; const tt = t - (1 - u) * 2.2; const ph = fract(tt / per); let v = 0;
    if (ph < .06) v = Math.sin(ph / .06 * Math.PI) * .15; else if (ph > .12 && ph < .15) v = -.2; else if (ph >= .15 && ph < .19) v = 1; else if (ph >= .19 && ph < .23) v = -.35; else if (ph > .4 && ph < .55) v = Math.sin((ph - .4) / .15 * Math.PI) * .22;
    const X = x + u * w, Y = y - v * h; i ? g2.lineTo(X, Y) : g2.moveTo(X, Y); } g2.stroke(); g2.restore(); }
// cerebro de dos hemisferios visto desde arriba
export function brain(x, y, s, a, kL, kR, t) { if (a <= .01) return; for (const [side, k, col] of [[-1, kL, '#e3a372'], [1, kR, '#9fd8ff']]) { g2.save(); g2.translate(x + side * 8 * s, y); g2.scale(s, s); g2.globalAlpha = a;
    g2.beginPath(); g2.ellipse(side * 70, 0, 68, 100, 0, 0, 7); g2.fillStyle = `rgba(${side < 0 ? '227,163,114' : '159,216,255'},${.12 + .45 * k})`; g2.fill();
    g2.strokeStyle = col; g2.lineWidth = 4; g2.shadowColor = col; g2.shadowBlur = 10 + 30 * k; g2.stroke();
    g2.globalAlpha = a * .5; g2.lineWidth = 3; for (let i = 0; i < 5; i++) { g2.beginPath(); const yy = -70 + i * 35; g2.moveTo(side * 20, yy); g2.bezierCurveTo(side * 60, yy - 22, side * 90, yy + 22, side * 125, yy - 4); g2.stroke(); } g2.restore(); } }
export { GOLDEN, WOLF };
