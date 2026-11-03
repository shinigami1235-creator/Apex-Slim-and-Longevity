/* Goal photo: slims a face or body photo in the browser as a goal picture. The photo is
   drawn to a canvas and never leaves the device. MediaPipe Face Mesh finds the face
   outline and MediaPipe Pose finds the body and its outline mask; both models load from
   this site (assets/vendor/README.md). The label is drawn into the image itself so
   saved copies and screenshots carry it. */
const $ = id => document.getElementById(id);
const canvas = $('gp-canvas');
if (canvas) init();

function init() {
  const VENDOR = new URL('../vendor/', import.meta.url).href;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const file = $('gp-file'), amt = $('gp-amt'), hold = $('gp-hold'), save = $('gp-save'), status = $('gp-status');
  const TIPS = {
    face: 'Use a front photo with your whole face showing, looking straight at the camera.',
    body: 'Use a front photo from head to knees, standing straight with your arms a little away from your body.'
  };
  const MAX = { face: 0.09, body: 0.15 };   // the most the outline moves in, as a share of the face or body width
  let mode = 'face', src = null, plan = null, busy = false;

  /* ---------- models ---------- */
  const script = url => new Promise((res, rej) => { const s = document.createElement('script'); s.src = url; s.onload = res; s.onerror = rej; document.head.append(s); });
  let faceP = null, poseP = null, queue = Promise.resolve();
  const faceModel = () => faceP || (faceP = (async () => {
    if (!window.FaceMesh) await script(VENDOR + 'face_mesh/face_mesh.js');
    const fm = new window.FaceMesh({ locateFile: f => VENDOR + 'face_mesh/' + f });
    fm.setOptions({ maxNumFaces: 1, refineLandmarks: false, minDetectionConfidence: 0.5, staticImageMode: true });
    return fm;
  })().catch(e => { faceP = null; throw e; }));
  const poseModel = () => poseP || (poseP = (async () => {
    if (!window.Pose) await script(VENDOR + 'pose/pose.js');
    const pm = new window.Pose({ locateFile: f => VENDOR + 'pose/' + f });
    pm.setOptions({ modelComplexity: 1, enableSegmentation: true, smoothSegmentation: false, minDetectionConfidence: 0.5, staticImageMode: true });
    return pm;
  })().catch(e => { poseP = null; throw e; }));
  const run = (model, image) => {
    const go = async () => {
      const m = await model();
      return new Promise((res, rej) => {
        const t = setTimeout(() => rej(new Error('timeout')), 30000);
        m.onResults(r => { clearTimeout(t); res(r); });
        try { m.reset && m.reset(); } catch (e) {}
        m.send({ image }).catch(e => { clearTimeout(t); rej(e); });
      });
    };
    const p = queue.then(go, go); queue = p.catch(() => {}); return p;
  };

  /* ---------- photo in ---------- */
  const toCanvas = (im, max = 1100) => {
    const w = im.naturalWidth, h = im.naturalHeight, k = Math.min(1, max / Math.max(w, h));
    const c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); return c;
  };
  const say = t => { status.textContent = t; };
  const enable = on => { amt.disabled = hold.disabled = save.disabled = !on; };

  async function analyse() {
    if (!src) return;
    busy = true; enable(false); plan = null;
    say(mode === 'face' ? 'Finding your face.' : 'Finding your body. The first photo takes a few seconds while the model loads.');
    try {
      plan = mode === 'face' ? await facePlan(src) : await bodyPlan(src);
    } catch (e) { plan = null; say('The photo tool could not start on this browser.'); busy = false; return; }
    busy = false;
    if (!plan) { canvas.classList.remove('on'); say(mode === 'face' ? 'No face found. Use a front photo with your whole face showing.' : 'No full body found. Use a front photo from head to knees.'); return; }
    say(''); enable(true); draw();
  }

  /* ---------- face: pull the cheeks and jaw toward the middle ---------- */
  const JAW = [234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323, 454];
  async function facePlan(c) {
    const r = await run(faceModel, c);
    const lm = r.multiFaceLandmarks && r.multiFaceLandmarks[0];
    if (!lm) return null;
    const W = c.width, H = c.height, P = i => ({ x: lm[i].x * W, y: lm[i].y * H });
    const L = P(234), R = P(454), chin = P(152), nose = P(1);
    const fw = Math.hypot(R.x - L.x, R.y - L.y), mid = (L.x + R.x) / 2;
    const top = Math.min(L.y, R.y);
    const pts = JAW.map(i => {
      const p = P(i);
      const low = Math.max(0, Math.min(1, (p.y - top) / (chin.y - top)));      // cheeks and jaw move most, temples least
      const side = (p.x - mid) / (fw / 2);
      return { x: p.x, y: p.y, dx: -side * fw * 0.5 * (0.3 + 0.7 * Math.sin(low * Math.PI * 0.85)), dy: -low * low * fw * 0.04 };
    });
    return { kind: 'face', pts, sigma: fw * 0.11, nose };
  }

  /* ---------- body: narrow the waist, hips and thighs around the centre line ---------- */
  async function bodyPlan(c) {
    const r = await run(poseModel, c);
    const lm = r.poseLandmarks;
    if (!lm || !r.segmentationMask) return null;
    const W = c.width, H = c.height, P = i => ({ x: lm[i].x * W, y: lm[i].y * H, v: lm[i].visibility ?? 1 });
    const need = [11, 12, 23, 24, 25, 26].map(P);
    if (need.some(p => p.v < 0.5 || p.x < 0 || p.x > W || p.y < 0 || p.y > H)) return null;
    const [ls, rs, lh, rh, lk, rk] = need;
    const sh = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 }, hp = { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 }, kn = { x: (lk.x + rk.x) / 2, y: (lk.y + rk.y) / 2 };
    // the outline mask, read at photo size
    const mc = document.createElement('canvas'); mc.width = W; mc.height = H;
    const mx = mc.getContext('2d'); mx.drawImage(r.segmentationMask, 0, 0, W, H);
    const md = mx.getImageData(0, 0, W, H).data;
    const inBody = (x, y) => md[(y * W + x) * 4] > 127 || md[(y * W + x) * 4 + 3] > 127 && md[(y * W + x) * 4] > 60;
    const y0 = Math.max(0, Math.round(sh.y)), y1 = Math.min(H - 1, Math.round(kn.y));
    const torso = hp.y - sh.y;
    if (torso < 20) return null;
    const cx = new Float32Array(H), half = new Float32Array(H), w = new Float32Array(H);
    const lerp = (a, b, t) => a + (b - a) * t;
    for (let y = 0; y < H; y++) {
      cx[y] = y < hp.y ? lerp(sh.x, hp.x, Math.max(0, (y - sh.y) / torso)) : lerp(hp.x, kn.x, Math.min(1, (y - hp.y) / Math.max(1, kn.y - hp.y)));
      if (y < y0 || y > y1) continue;
      // expected half width from the joints: shoulders, then hips (the hip points sit inside the hips), then knees
      const sw = Math.hypot(ls.x - rs.x, ls.y - rs.y) / 2, hw = Math.hypot(lh.x - rh.x, lh.y - rh.y) / 2, kw = Math.hypot(lk.x - rk.x, lk.y - rk.y) / 2;
      const est = y < hp.y ? lerp(sw * 1.0, hw * 1.75, Math.max(0, (y - sh.y) / torso)) : lerp(hw * 1.75, kw + hw * 0.55, Math.min(1, (y - hp.y) / Math.max(1, kn.y - hp.y)));
      half[y] = est;
      if (y < hp.y) {   // on the torso the outline mask refines it, using the nearer side so an arm or a neighbour doesn't widen it
        const c0 = Math.round(Math.max(0, Math.min(W - 1, cx[y])));
        let a = c0, b = c0;
        while (a > 0 && inBody(a - 1, y)) a--;
        while (b < W - 1 && inBody(b + 1, y)) b++;
        const m = Math.min(cx[y] - a, b - cx[y]);
        if (m > est * 0.6 && m < est * 1.25) half[y] = m;
      }
    }
    // smooth the outline width, then weight: waist most, then hips and thighs, chest least
    const sm = new Float32Array(H), K = Math.max(6, Math.round(torso * 0.08));
    for (let y = y0; y <= y1; y++) { let s = 0, n = 0; for (let k = -K; k <= K; k++) { const v = half[y + k]; if (v > 0) { s += v; n++; } } sm[y] = n ? s / n : 0; }
    const g = (y, c, sd) => Math.exp(-((y - c) ** 2) / (2 * sd * sd));
    for (let y = y0; y <= y1; y++) {
      const waist = sh.y + torso * 0.62;
      w[y] = Math.min(1, 1.0 * g(y, waist, torso * 0.18) + 0.85 * g(y, hp.y + torso * 0.08, torso * 0.16) + 0.6 * g(y, lerp(hp.y, kn.y, 0.45), torso * 0.25) + 0.3 * g(y, sh.y + torso * 0.3, torso * 0.12));
      const fade = Math.min(1, (y - y0) / (torso * 0.25), (y1 - y) / (torso * 0.3));
      w[y] *= Math.max(0, fade);
    }
    return { kind: 'body', cx, half: sm, w, y0, y1 };
  }

  /* ---------- warp and draw ---------- */
  function warp(c, p, a) {
    const W = c.width, H = c.height;
    const sd = c.getContext('2d').getImageData(0, 0, W, H), s = sd.data;
    const out = new ImageData(W, H), o = out.data;
    o.set(s);
    const sample = (x, y, i) => {
      x = Math.max(0, Math.min(W - 1.001, x)); y = Math.max(0, Math.min(H - 1.001, y));
      const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0, i00 = (y0 * W + x0) * 4, i10 = i00 + 4, i01 = i00 + W * 4, i11 = i01 + 4;
      for (let k = 0; k < 3; k++) o[i + k] = (s[i00 + k] * (1 - fx) + s[i10 + k] * fx) * (1 - fy) + (s[i01 + k] * (1 - fx) + s[i11 + k] * fx) * fy;
    };
    if (p.kind === 'face') {
      const k = a * MAX.face, s2 = 2 * p.sigma * p.sigma, reach = p.sigma * 3;
      let x0 = W, x1 = 0, y0 = H, y1 = 0;
      for (const q of p.pts) { x0 = Math.min(x0, q.x - reach); x1 = Math.max(x1, q.x + reach); y0 = Math.min(y0, q.y - reach); y1 = Math.max(y1, q.y + reach); }
      x0 = Math.max(0, x0 | 0); y0 = Math.max(0, y0 | 0); x1 = Math.min(W - 1, x1 | 0); y1 = Math.min(H - 1, y1 | 0);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        let dx = 0, dy = 0, se = 0, me = 0;
        for (const q of p.pts) { const e = Math.exp(-((x - q.x) ** 2 + (y - q.y) ** 2) / s2); dx += q.dx * e; dy += q.dy * e; se += e; if (e > me) me = e; }
        if (se < 1e-4) continue;
        dx = dx / se * me; dy = dy / se * me;
        if (Math.abs(dx) + Math.abs(dy) < 0.05) continue;
        sample(x - dx * k, y - dy * k, (y * W + x) * 4);
      }
    } else {
      const k = a * MAX.body;
      for (let y = p.y0; y <= p.y1; y++) {
        const hw = p.half[y], wt = p.w[y];
        if (hw < 4 || wt < 0.01) continue;
        const sc = 1 - k * wt, inv = 1 / sc, cx = p.cx[y];
        const xa = Math.max(0, Math.floor(cx - 2 * hw)), xb = Math.min(W - 1, Math.ceil(cx + 2 * hw));
        for (let x = xa; x <= xb; x++) {
          const u = (x - cx) / hw, au = Math.abs(u);
          const su = au <= 1 ? au * inv : au <= 2 ? inv + (au - 1) * (2 - inv) : au;
          sample(cx + Math.sign(u) * su * hw, y, (y * W + x) * 4);
        }
      }
    }
    return out;
  }

  const font = getComputedStyle(document.body).fontFamily;
  function label(g, W, H) {
    const bar = Math.max(34, Math.round(H * 0.05)), fs = Math.round(bar * 0.42);
    g.fillStyle = 'rgba(31,10,48,.82)'; g.fillRect(0, H - bar, W, bar);
    g.fillStyle = '#F6EEFB'; g.font = `700 ${fs}px ${font}`; g.textBaseline = 'middle';
    g.fillText('Goal preview', Math.round(bar * 0.4), H - bar / 2);
    const lw = g.measureText('Goal preview').width;
    g.font = `400 ${Math.round(fs * 0.85)}px ${font}`; g.fillStyle = '#C9B3DD';
    g.fillText('Not a predicted result', Math.round(bar * 0.4 + lw + fs), H - bar / 2);
    const sub = g.measureText('Not a predicted result').width, brand = g.measureText('Apex Slim').width;
    if (bar * 0.8 + lw + fs + sub + fs + brand < W) { g.textAlign = 'right'; g.fillText('Apex Slim', W - Math.round(bar * 0.4), H - bar / 2); g.textAlign = 'left'; }
  }
  let showing = 'goal', goalImg = null;
  function draw() {
    if (!src || !plan) return;
    const a = amt.value / 100;
    canvas.width = src.width; canvas.height = src.height;
    if (showing === 'goal') { goalImg = warp(src, plan, a); ctx.putImageData(goalImg, 0, 0); label(ctx, canvas.width, canvas.height); }
    else {
      ctx.drawImage(src, 0, 0);
      const bar = Math.max(34, Math.round(canvas.height * 0.05));
      ctx.fillStyle = 'rgba(31,10,48,.82)'; ctx.fillRect(0, canvas.height - bar, canvas.width, bar);
      ctx.fillStyle = '#F6EEFB'; ctx.font = `700 ${Math.round(bar * 0.42)}px ${font}`; ctx.textBaseline = 'middle';
      ctx.fillText('Before', Math.round(bar * 0.4), canvas.height - bar / 2);
    }
    canvas.classList.add('on');
  }

  /* ---------- controls ---------- */
  document.querySelectorAll('.gp-mode button').forEach(b => b.addEventListener('click', () => {
    if (busy || b.dataset.mode === mode) return;
    mode = b.dataset.mode;
    document.querySelectorAll('.gp-mode button').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
    $('gp-tip').textContent = TIPS[mode];
    analyse();
  }));
  file.addEventListener('change', () => {
    const f = file.files && file.files[0]; if (!f) return;
    const url = URL.createObjectURL(f), im = new Image();
    im.onload = () => { src = toCanvas(im); URL.revokeObjectURL(url); file.value = ''; analyse(); };
    im.onerror = () => { URL.revokeObjectURL(url); say('That file could not be opened as a photo.'); };
    im.src = url;
  });
  let raf = 0;
  amt.addEventListener('input', () => { $('gp-amtv').textContent = amt.value + '%'; cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); });
  const show = s => { if (showing === s) return; showing = s; draw(); };
  hold.addEventListener('pointerdown', () => show('before'));
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(e => hold.addEventListener(e, () => show('goal')));
  hold.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); show('before'); } });
  hold.addEventListener('keyup', () => show('goal'));
  save.addEventListener('click', () => {
    showing = 'goal'; draw();
    canvas.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'apex-slim-goal-preview.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }, 'image/png');
  });

  // test hook: lets the page tests load a photo without a file picker
  if (location.search.includes('gptest')) window.__goalPhoto = {
    load: async url => { const im = new Image(); im.src = url; await im.decode(); src = toCanvas(im); await analyse(); return !!plan; },
    info: () => plan && plan.kind === 'body' ? { y0: plan.y0, y1: plan.y1, H: src.height, W: src.width, wmax: Math.max(...plan.w), halfs: [0.2, 0.4, 0.6, 0.8].map(t => Math.round(plan.half[Math.round(plan.y0 + (plan.y1 - plan.y0) * t)])), ws: [0.2, 0.4, 0.6, 0.8].map(t => +plan.w[Math.round(plan.y0 + (plan.y1 - plan.y0) * t)].toFixed(2)) } : null
  };
}
