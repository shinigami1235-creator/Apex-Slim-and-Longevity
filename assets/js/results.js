(() => {
  const buddy = e => document.dispatchEvent(new CustomEvent('buddy', { detail: e }));
  const stage = document.getElementById('rx-stage');
  if (!stage || !window.RX_MAP) return;
  const MAP = window.RX_MAP;
  const IMG = 'assets/img/results/';
  const CASES = [
    { id: 'jaw', title: 'Orthognathic surgery', tx: [{ sym: 'Og', name: 'Orthognathic surgery' }],
      before: 'jaw-front-before.webp', after: 'jaw-front-after.webp', bdate: '9 Mar 2026', adate: '22 Jun 2026',
      facts: [['Time between photos', '15 weeks']], video: 'assets/video/jaw-case.mp4', poster: 'jaw-video-poster.webp' },
    { id: 'vline', title: 'V-line facial bone surgery', tx: [{ sym: 'Vl', name: 'V-line facial bone surgery' }],
      before: 'vline-before.webp', after: 'vline-after.webp', bdate: '9 Mar 2026', adate: '22 Jun 2026',
      facts: [['Time between photos', '15 weeks'], ['Change', '7 mm']], video: null }
  ];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wide = matchMedia('(min-width: 760px)');
  const $ = id => document.getElementById(id);
  const panels = $('rx-panels'), picker = $('rx-picker'), again = $('rx-again');
  const photo = $('rx-photo'), photoImg = $('rx-photo-img'), crown = $('rx-crown'), crownText = $('rx-crown-text');
  const film = $('rx-run');
  let current = CASES[0], run = 0, busy = false;

  /* map a w x h element onto four points (tl, tr, br, bl in px) with a matrix3d */
  const adj = m => [m[4]*m[8]-m[5]*m[7], m[2]*m[7]-m[1]*m[8], m[1]*m[5]-m[2]*m[4], m[5]*m[6]-m[3]*m[8], m[0]*m[8]-m[2]*m[6], m[2]*m[3]-m[0]*m[5], m[3]*m[7]-m[4]*m[6], m[1]*m[6]-m[0]*m[7], m[0]*m[4]-m[1]*m[3]];
  const mm = (a, b) => { const c = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { let s = 0; for (let k = 0; k < 3; k++) s += a[3*i+k]*b[3*k+j]; c[3*i+j] = s; } return c; };
  const mv = (m, v) => [m[0]*v[0]+m[1]*v[1]+m[2]*v[2], m[3]*v[0]+m[4]*v[1]+m[5]*v[2], m[6]*v[0]+m[7]*v[1]+m[8]*v[2]];
  const basis = p => { const m = [p[0][0], p[1][0], p[2][0], p[0][1], p[1][1], p[2][1], 1, 1, 1]; const v = mv(adj(m), [p[3][0], p[3][1], 1]); return mm(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]]); };
  const place = (el, w, h, pts) => {
    const s = basis([[0, 0], [w, 0], [0, h], [w, h]]);
    const d = basis([pts[0], pts[1], pts[3], pts[2]]);
    const t = mm(d, adj(s)); for (let i = 0; i < 9; i++) t[i] /= t[8];
    el.style.transform = `matrix3d(${t[0]},${t[3]},0,${t[6]},${t[1]},${t[4]},0,${t[7]},0,0,1,0,${t[2]},${t[5]},0,${t[8]})`;
  };
  // RX_MAP quads are bl, br, tr, tl in 0..1 of the stage
  const quad = (q, W, H) => [q[3], q[2], q[1], q[0]].map(p => [p[0]*W, p[1]*H]);
  const layout = () => {
    const r = stage.getBoundingClientRect(), W = r.width, H = r.height;
    place(photo, 200, 300, quad(MAP.podPhoto, W, H));
    place(crown, 240, 48, quad(MAP.crown, W, H));
    const isWide = wide.matches;
    panels.querySelectorAll('.rx-panel').forEach((el, i) => {
      if (!isWide) { el.style.transform = ''; return; }
      const q = MAP[['panelL', 'panelC', 'panelR'][i]];
      place(el, +el.dataset.w, +el.dataset.h, quad(q, W, H));
    });
  };

  /* panel content */
  const fill = c => {
    $('rx-tx').innerHTML = c.tx.map(t => `<div class="rx-tile"><b>${t.sym}</b><span>${t.name}<small>Dialled in</small></span></div>`).join('');
    $('rx-cases').innerHTML = CASES.map(k => `<button class="rx-case" type="button" data-id="${k.id}" aria-current="${k === c}"><img src="${IMG + k.before}" alt="">${k.title}</button>`).join('');
    $('rx-title').textContent = c.title;
    $('rx-before').src = IMG + c.before; $('rx-before').alt = c.title + ', before';
    $('rx-after').src = IMG + c.after; $('rx-after').alt = c.title + ', after';
    $('rx-bdate').textContent = c.bdate; $('rx-adate').textContent = c.adate;
    $('rx-vid').innerHTML = c.video
      ? `<video controls playsinline preload="none" poster="${IMG + c.poster}" src="${c.video}"></video>`
      : '<p>No video for this case.</p>';
    $('rx-facts').innerHTML = c.facts.map(f => `<dt>${f[0]}</dt><dd>${f[1]}</dd>`).join('');
    picker.querySelectorAll('.rx-chip').forEach(b => b.setAttribute('aria-pressed', b.dataset.id === c.id));
  };
  picker.innerHTML = '<span class="lbl">Pick a case</span>' + CASES.map(c => `<button class="rx-chip" type="button" data-id="${c.id}" aria-pressed="false"><b>${c.tx[0].sym}</b>${c.title}</button>`).join('');

  /* helpers */
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const step = s => { stage.dataset.step = s; };
  const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
  const ready = v => new Promise(res => {
    if (v.readyState >= 3) return res(true);
    const done = ok => { v.oncanplaythrough = v.onerror = null; clearTimeout(to); res(ok); };
    const to = setTimeout(() => done(v.readyState >= 2), 8000);
    v.oncanplaythrough = () => done(true); v.onerror = () => done(false);
    if (v.preload !== 'auto') { v.preload = 'auto'; v.load(); }
  });
  const lock = on => { busy = on; picker.querySelectorAll('.rx-chip').forEach(b => b.disabled = on); again.hidden = on || stage.dataset.step !== 'terminal'; };

  /* the doors: the photo is cut to the gap between the two door edges, frame by frame */
  const pl = MAP.podPhoto[3][0], pr = MAP.podPhoto[2][0];
  function clipToDoors(f) {
    const g = MAP.gap[f];
    if (!g) { photo.style.clipPath = f > 30 && f < 118 ? 'inset(0 50% 0 50%)' : ''; return; }
    const l = g[0] == null ? 0 : Math.max(0, Math.min(1, (g[0] - pl) / (pr - pl)));
    const r = g[1] == null ? 1 : Math.max(0, Math.min(1, (g[1] - pl) / (pr - pl)));
    photo.style.clipPath = r <= l ? 'inset(0 50% 0 50%)' : `inset(0 ${((1 - r) * 100).toFixed(2)}% 0 ${(l * 100).toFixed(2)}%)`;
  }

  /* one film, frame 1 to 292: doors close 1-24, scan 25-120, doors open with fog 121-208, the camera follows the data 209-292 */
  function sync(c, f, st) {
    clipToDoors(f);
    if (f <= 24) crownText.textContent = c.tx.map(t => t.name).join(' + ');
    else if (f <= 120) {
      crownText.textContent = `Processing ${Math.min(100, Math.round((f - 25) / 95 * 100))}%`;
      if (!st.swapped && f > 40) { st.swapped = true; photoImg.src = IMG + c.after; }
    } else if (f <= 200) crownText.textContent = 'Done';
    else crownText.textContent = 'Sending';
    // the after shows only as the fog thins, then leaves as light when the data goes
    let o = 1, blur = 0, glow = 1;
    if (f > 120 && f < 196) { const k = ease((f - 150) / 45); o = k; blur = (1 - k) * 8; }
    if (f >= 200) { const k = ease((f - 200) / 9); o = 1 - k; glow = 1 + k * 1.6; blur = k * 3; }
    photoImg.style.opacity = o.toFixed(3);
    photoImg.style.filter = `blur(${blur.toFixed(1)}px) brightness(${glow.toFixed(2)})`;
    if (f >= 196 && !st.revealed) { st.revealed = true; buddy('reveal'); }
    if (f >= 25 && !st.scanning) { st.scanning = true; buddy('scanning'); }
    stage.classList.toggle('rx-moving', f >= 209);
  }

  /* the sequence */
  const start = async c => {
    run++; const id = run; current = c; fill(c); lock(true);
    panels.classList.remove('on'); panels.hidden = true; film.pause();
    if (reduce) { step('terminal'); panels.hidden = false; layout(); panels.classList.add('on'); lock(false); return; }
    step('loaded'); stage.classList.remove('rx-moving');
    photoImg.style.opacity = ''; photoImg.style.filter = ''; photo.style.clipPath = '';
    photoImg.src = IMG + c.before; photo.classList.add('on');
    crownText.textContent = c.tx.map(t => t.name).join(' + ');
    const ok = await ready(film); if (id !== run) return;
    await wait(900); if (id !== run) return;
    const st = {};
    if (ok) {
      film.currentTime = 0;
      await new Promise(res => {
        const tick = () => {
          if (id !== run) return res();
          sync(c, Math.min(MAP.frames, Math.floor(film.currentTime * MAP.fps) + 1), st);
          if (film.ended) return res();
          requestAnimationFrame(tick);
        };
        film.onended = () => { film.onended = null; res(); };
        film.play().then(() => { step('run'); requestAnimationFrame(tick); }).catch(() => res());
      });
    }
    if (id !== run) return;
    buddy('done'); photo.classList.remove('on');
    step('terminal'); panels.hidden = false; layout();
    await wait(250); panels.classList.add('on');
    lock(false);
  };

  picker.addEventListener('click', e => { const b = e.target.closest('.rx-chip'); if (b && !busy) start(CASES.find(c => c.id === b.dataset.id)); });
  again.addEventListener('click', () => { if (!busy) start(current); });
  $('rx-cases').addEventListener('click', e => {
    const b = e.target.closest('.rx-case'); if (!b) return;
    current = CASES.find(c => c.id === b.dataset.id); fill(current);
  });

  /* tap the before and after to see them large */
  const zoom = document.createElement('div'); zoom.className = 'rx-zoom'; zoom.hidden = true;
  zoom.innerHTML = '<button class="rx-btn" type="button">Close</button><div class="ba"><figure><img alt=""><p><b>Before</b><span></span></p></figure><figure><img alt=""><p><b>After</b><span></span></p></figure></div>';
  document.body.appendChild(zoom);
  panels.querySelector('.rx-ba').addEventListener('click', () => {
    const imgs = zoom.querySelectorAll('img'), spans = zoom.querySelectorAll('p span');
    imgs[0].src = IMG + current.before; imgs[1].src = IMG + current.after;
    imgs[0].alt = current.title + ', before'; imgs[1].alt = current.title + ', after';
    spans[0].textContent = current.bdate; spans[1].textContent = current.adate;
    zoom.hidden = false; zoom.querySelector('button').focus();
  });
  zoom.addEventListener('click', e => { if (e.target === zoom || e.target.closest('button')) zoom.hidden = true; });
  addEventListener('keydown', e => { if (e.key === 'Escape') zoom.hidden = true; });

  /* load the film once the section is near */
  new IntersectionObserver((en, ob) => { if (en[0].isIntersecting) { film.preload = 'auto'; film.load(); ob.disconnect(); } }, { rootMargin: '400px' }).observe(stage);
  addEventListener('resize', layout);
  wide.addEventListener('change', layout);
  fill(current); picker.querySelectorAll('.rx-chip').forEach(b => b.setAttribute('aria-pressed', 'false'));
  layout();
})();
