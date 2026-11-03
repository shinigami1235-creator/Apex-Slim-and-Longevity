/* Body check: BMI and waist on the Thai scale, a 3D body built from the numbers, and
   programs to ask the doctor about. The body is the MakeHuman CC0 base mesh with thin,
   average and heavy shapes for each sex plus a belly shape (tools/slimbody builds it). */
import * as THREE from '../vendor/three/three.module.js';

const $ = id => document.getElementById(id);
const form = $('bc-form'), canvas = $('bc-canvas');
if (form && canvas) init();

async function init() {
  /* ---------- treatments ---------- */
  const T = {
    wk: { sym: 'Wk', name: '1 Week 1 Kilo', url: 'index.html#treatments', goal: 'weight', time: 'Once a week for 4 weeks' },
    cs: { sym: 'Cs', name: 'CoolSculpting', url: 'coolsculpting.html', goal: 'fat', cls: 'cold', time: 'About 35 min per area' },
    en: { sym: 'En', name: 'Emsculpt Neo', url: 'index.html#treatments', goal: 'tone', time: '30 min, 4 sessions' },
    ff: { sym: 'Ff', name: 'FIT FIRM', url: 'index.html#treatments', goal: 'firm', time: 'Buttocks and thighs' },
    iv: { sym: 'Iv', name: 'IV Therapy', url: 'index.html#longevity', goal: 'energy', cls: 'long', time: '30 to 60 min drip' },
    hb: { sym: 'Hb', name: 'HBOT', url: 'index.html#longevity', goal: 'energy', cls: 'long', time: '60 to 90 min in the chamber' }
  };

  /* ---------- Thai scale (Department of Health) ---------- */
  const category = b => b < 18.5 ? ['Underweight', 'warn'] : b < 23 ? ['Healthy', 'ok'] : b < 25 ? ['Overweight', 'warn'] : b < 30 ? ['Obese level 1', 'warn'] : ['Obese level 2', 'warn'];
  const suggest = (bmi, whtr) => {
    const out = [];
    if (bmi < 18.5) {
      out.push(['iv', 'Vitamins, minerals and fluids mixed by the doctor, since your BMI is under 18.5 and slimming programs don\'t suit you.']);
      out.push(['hb', 'Oxygen therapy for recovery and energy.']);
      return out;
    }
    if (bmi >= 23) out.push(['wk', 'A weekly program prescribed by the doctor, since your BMI is 23 or more.']);
    if (whtr >= 0.5 && bmi < 25) out.push(['cs', 'Freezes belly and flank fat, since your waist is over half your height and CoolSculpting suits people close to their goal weight.']);
    if (bmi < 30) out.push(['en', bmi >= 25 ? 'Builds muscle and reduces fat in the same session, once your weight is coming down.' : 'Builds muscle and reduces fat in the same session.']);
    if (bmi < 25) out.push(['ff', 'Firms the buttocks and thighs.']);
    return out;
  };

  /* ---------- body mesh ---------- */
  const buf = await fetch('assets/lab/slimbody.bin').then(r => r.ok ? r.arrayBuffer() : null).catch(() => null);
  if (!buf) { $('bc-msg').textContent = 'The 3D body could not be loaded.'; return; }
  const dv = new DataView(buf);
  const N = dv.getUint32(0, true), E = dv.getUint32(4, true);
  const h = new Float32Array(buf.slice(8, 28)); const c = [h[0], h[1], h[2]], s = h[3], sb = h[4];
  let off = 28;
  const readP = (scale, cc) => { const q = new Int16Array(buf, off, N * 3); off += N * 6; const p = new Float32Array(N * 3); for (let i = 0; i < N * 3; i++) p[i] = q[i] / 32767 * scale + cc[i % 3]; return p; };
  const shapes = { female: [readP(s, c), readP(s, c), readP(s, c)], male: [readP(s, c), readP(s, c), readP(s, c)] };
  const belly = { female: readP(sb, [0, 0, 0]), male: readP(sb, [0, 0, 0]) };
  const edges = new Uint16Array(buf, off, E * 2); off += E * 4;
  const region = new Uint8Array(buf, off, N);
  const feet = {}; for (const k of ['female', 'male']) { let m = 1e9; const a = shapes[k][1]; for (let i = 1; i < N * 3; i += 3) m = Math.min(m, a[i]); feet[k] = m; }

  /* ---------- three.js scene ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 1, 200);
  camera.position.set(0, 8.6, 38); camera.lookAt(0, 8.2, 0);
  const group = new THREE.Group(); scene.add(group);
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const lgeo = new THREE.BufferGeometry();
  lgeo.setAttribute('position', geo.getAttribute('position'));
  lgeo.setIndex(new THREE.BufferAttribute(new Uint16Array(edges), 1));
  const pmat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
    uniforms: { size: { value: 3.2 * renderer.getPixelRatio() } },
    vertexShader: 'uniform float size; varying vec3 vC; void main(){ vC=color; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=size*(38.0/-mv.z); gl_Position=projectionMatrix*mv; }',
    fragmentShader: 'varying vec3 vC; void main(){ vec2 d=gl_PointCoord-0.5; float r=length(d); if(r>0.5) discard; float a=smoothstep(0.5,0.0,r); gl_FragColor=vec4(vC*a, a); }'
  });
  const lmat = new THREE.LineBasicMaterial({ color: 0x9a6cc8, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false });
  group.add(new THREE.LineSegments(lgeo, lmat), new THREE.Points(geo, pmat));

  /* ---------- state and morph ---------- */
  const lerp = (a, b, t) => a + (b - a) * t;
  const curve = (x, pts) => { if (x <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return lerp(y0, y1, (x - x0) / (x1 - x0)); } return pts[pts.length - 1][1]; };
  const bmiToW = b => curve(b, [[16, -1.1], [18.5, -0.75], [21, -0.2], [23, 0.15], [27.5, 0.75], [32, 1.1], [40, 1.6]]);
  const whtrToB = r => curve(r, [[0.42, 0], [0.5, 0.25], [0.55, 0.5], [0.62, 0.9], [0.7, 1.1]]);
  const view = { sex: 'female', w: 0, b: 0, warm: 0 };
  const target = { w: 0, b: 0, warm: 0 };
  const base = new THREE.Color(0xc9a8f2), warmC = new THREE.Color(0xf5b97a), white = new THREE.Color(0xf6eefb);
  const morph = () => {
    const [mn, av, mx] = shapes[view.sex], bl = belly[view.sex], w = view.w, b = view.b, f = feet[view.sex];
    for (let i = 0; i < N * 3; i++) {
      const a = av[i], v = w < 0 ? a + (mn[i] - a) * -w : a + (mx[i] - a) * w;
      pos[i] = v + bl[i] * b;
    }
    for (let i = 0; i < N; i++) { pos[i * 3] -= c[0]; pos[i * 3 + 1] -= f; pos[i * 3 + 2] -= c[2]; }
    for (let i = 0; i < N; i++) {
      const r = region[i], mid = r === 4 || r === 6;
      const cc = mid ? base.clone().lerp(warmC, view.warm) : (r === 1 ? base.clone().lerp(white, 0.25) : base);
      col[i * 3] = cc.r * 0.85; col[i * 3 + 1] = cc.g * 0.85; col[i * 3 + 2] = cc.b * 0.85;
    }
    geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
    const m = view.sex === 'male'; camera.position.set(0, m ? 9.2 : 8.6, m ? 41 : 38); camera.lookAt(0, m ? 8.8 : 8.2, 0);
  };

  /* ---------- inputs ---------- */
  const num = id => parseFloat($(id).value);
  const gw = $('bc-gw');
  let mode = 'now', goalTouched = false;
  const read = () => ({ sex: form.elements.sex.value, h: num('bc-h'), w: num('bc-w'), waist: num('bc-waist') });
  const valid = d => {
    if (!(d.h >= 120 && d.h <= 220)) return 'Enter a height between 120 and 220 cm.';
    if (!(d.w >= 30 && d.w <= 250)) return 'Enter a weight between 30 and 250 kg.';
    if (!(d.waist >= 40 && d.waist <= 200)) return 'Enter a waist between 40 and 200 cm.';
    return '';
  };
  const update = () => {
    const d = read(), err = valid(d);
    $('bc-msg').textContent = err;
    if (err) return;
    const m = d.h / 100, bmi = d.w / (m * m), whtr = d.waist / d.h, half = d.h / 2;
    const [cat, tone] = category(bmi);
    $('bc-bmi').textContent = bmi.toFixed(1); $('bc-cat').textContent = cat; $('bc-cat').className = tone;
    $('bc-wv').textContent = Math.round(d.waist) + ' cm';
    const over = whtr >= 0.5;
    $('bc-wcat').textContent = over ? 'Over half your height' : 'Under half your height'; $('bc-wcat').className = over ? 'warn' : 'ok';
    $('bc-note').textContent = `The Thai guide puts a healthy BMI at 18.5 to 22.9 and a healthy waist under half your height, which for you is ${Math.round(half)} cm.`;
    // goal slider: from the healthy minimum up to the current weight
    const lo = Math.ceil(18.5 * m * m * 2) / 2, hi = Math.max(lo, Math.round(d.w * 2) / 2);
    gw.min = lo; gw.max = hi;
    if (!goalTouched) gw.value = Math.max(lo, Math.min(hi, Math.round(22.9 * m * m * 2) / 2));
    const g = parseFloat(gw.value), gbmi = g / (m * m);
    $('bc-gwv').textContent = g + ' kg';
    $('bc-gnote').textContent = hi - lo < 0.5 ? 'Your weight is already at the low end of the healthy range.' : `That's a BMI of ${gbmi.toFixed(1)}, ${(d.w - g).toFixed(1)} kg less than now. The goal body is a picture of your goal, not a predicted result.`;
    // body
    view.sex = d.sex;
    if (mode === 'now') { target.w = bmiToW(bmi); target.b = whtrToB(whtr); target.warm = over ? 0.85 : 0; }
    else { const gwaist = Math.max(d.h * 0.4, d.waist - (d.w - g)); target.w = bmiToW(gbmi); target.b = whtrToB(gwaist / d.h); target.warm = 0; }
    // programs
    const list = suggest(bmi, whtr);
    $('bc-list').innerHTML = list.map(([k, why]) => { const t = T[k]; return `<a class="rx-card" href="${t.url}"><span class="mini ${t.cls || ''}"><b>${t.sym}</b></span><span class="rx-text"><b class="rx-name">${t.name}</b><span class="rx-desc">${why}</span><span class="rx-time">${t.time}</span></span></a>`; }).join('');
    const goals = [...new Set(list.map(([k]) => T[k].goal))];
    $('bc-book').href = 'index.html?goals=' + goals.join(',') + '#consult';
  };
  form.addEventListener('input', e => { if (e.target === gw) goalTouched = true; update(); });
  gw.addEventListener('input', () => { goalTouched = true; if (mode !== 'goal') setMode('goal'); update(); });
  const setMode = m => {
    mode = m;
    document.querySelectorAll('.bc-tabs button').forEach(b => { const on = b.dataset.view === m; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    update();
  };
  document.querySelectorAll('.bc-tabs button').forEach(b => b.addEventListener('click', () => setMode(b.dataset.view)));

  /* ---------- drag to turn, slow turn otherwise ---------- */
  let drag = null, spin = 0.004, rotY = 0.35;
  canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, r: rotY }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (drag) rotY = drag.r + (e.clientX - drag.x) * 0.01; });
  addEventListener('pointerup', () => { drag = null; });
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const resize = () => { const r = canvas.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); };
  addEventListener('resize', resize); resize();

  update(); Object.assign(view, target); morph();
  let lastSex = view.sex;
  const loop = () => {
    let changed = false;
    for (const k of ['w', 'b', 'warm']) { const d = target[k] - view[k]; if (Math.abs(d) > 0.001) { view[k] += d * (reduce ? 1 : 0.12); changed = true; } }
    if (view.sex !== lastSex) { lastSex = view.sex; changed = true; }
    if (changed) morph();
    if (!drag && !reduce) rotY += spin;
    group.rotation.y = rotY;
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  };
  loop();
}
