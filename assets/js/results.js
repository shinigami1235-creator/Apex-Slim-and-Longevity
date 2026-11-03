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
  const frame = $('rx-frame'), panels = $('rx-panels'), picker = $('rx-picker'), again = $('rx-again');
  const photo = $('rx-photo'), photoImg = $('rx-photo-img'), crown = $('rx-crown'), crownText = $('rx-crown-text');
  const fog = $('rx-fog'), pan = $('rx-pan'), dial = $('rx-dial');
  const pathEl = $('rx-path-line'), pulses = [...stage.querySelectorAll('.rx-path circle')];
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
    dial.style.left = MAP.podDial[0]*100 + '%'; dial.style.top = MAP.podDial[1]*100 + '%';
    const isWide = wide.matches;
    panels.querySelectorAll('.rx-panel').forEach((el, i) => {
      if (!isWide) { el.style.transform = ''; return; }
      const q = MAP[['panelL', 'panelC', 'panelR'][i]];
      place(el, +el.dataset.w, +el.dataset.h, quad(q, W, H));
    });
  };
  pathEl.setAttribute('d', 'M' + MAP.path.map(p => (p[0]*1000).toFixed(1) + ' ' + (p[1]*625).toFixed(1)).join(' L'));

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
    const to = setTimeout(() => done(v.readyState >= 2), 6000);
    v.oncanplaythrough = () => done(true); v.onerror = () => done(false);
    if (v.preload === 'none') { v.preload = 'auto'; v.load(); }
  });
  const playClip = (v, onTime) => new Promise(async res => {
    const id = run;
    if (!(await ready(v)) || id !== run) return res(false);
    v.currentTime = 0;
    const tick = () => { if (id !== run) return; if (onTime) onTime(v.currentTime); if (!v.ended) requestAnimationFrame(tick); };
    v.onended = () => { v.onended = null; res(true); };
    v.play().then(() => requestAnimationFrame(tick)).catch(() => res(false));
  });
  const sendPulses = () => new Promise(res => {
    const id = run, len = pathEl.getTotalLength(), t0 = performance.now(), dur = 1500;
    const frameFn = now => {
      if (id !== run) return res();
      const p = (now - t0) / dur;
      pulses.forEach((c, i) => {
        const q = p * 1.35 - i * 0.18;
        if (q < 0 || q > 1) { c.style.opacity = 0; return; }
        const pt = pathEl.getPointAtLength(q * len);
        c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y); c.style.opacity = 1;
      });
      p < 1 ? requestAnimationFrame(frameFn) : (pulses.forEach(c => c.style.opacity = 0), res());
    };
    requestAnimationFrame(frameFn);
  });
  const setPhoto = (src, on) => { photoImg.style.filter = ''; photoImg.style.opacity = ''; photoImg.src = src; photo.classList.toggle('on', on); };
  const lock = on => { busy = on; picker.querySelectorAll('.rx-chip').forEach(b => b.disabled = on); again.hidden = on || stage.dataset.step !== 'terminal'; };

  /* the sequence */
  const start = async c => {
    run++; const id = run; current = c; fill(c); lock(true);
    panels.classList.remove('on'); panels.hidden = true; fog.pause(); pan.pause();
    if (reduce) { step('terminal'); panels.hidden = false; layout(); panels.classList.add('on'); lock(false); return; }
    // 1. photo in, treatment dialled in
    step('loaded'); crownText.textContent = c.tx.map(t => t.name).join(' + ');
    setPhoto(IMG + c.before, false); await wait(60); photo.classList.add('on');
    dial.classList.remove('on'); void dial.offsetWidth; dial.classList.add('on');
    pan.preload = 'auto'; pan.load();
    await wait(1600); if (id !== run) return;
    // 2. fog fills, the after shows as it clears
    crownText.textContent = 'Processing'; buddy('scanning');
    let swapped = false;
    const ok = await playClip(fog, t => {
      if (t < 1.4) { const k = ease((t - 0.15) / 1.0); photoImg.style.opacity = 1 - k; photoImg.style.filter = `blur(${k * 6}px)`; }
      else if (!swapped) { swapped = true; photoImg.src = IMG + c.after; photoImg.style.opacity = 0; }
      if (t > 2.4) { const k = ease((t - 2.4) / 1.5); photoImg.style.opacity = k; photoImg.style.filter = `blur(${(1 - k) * 8}px)`; }
    });
    if (!ok) photoImg.src = IMG + c.after;
    if (id !== run) return;
    photoImg.style.opacity = 1; photoImg.style.filter = ''; buddy('reveal');
    // 3. data goes to the terminal
    step('sending'); crownText.textContent = 'Sending';
    await sendPulses(); if (id !== run) return;
    step('awake'); crownText.textContent = 'Done';
    await wait(900); if (id !== run) return;
    // 4. the photo leaves as light and the camera moves to the terminal
    photoImg.style.transition = 'opacity .45s ease, filter .45s ease'; photoImg.style.filter = 'brightness(2.4) blur(3px)'; photoImg.style.opacity = 0;
    await wait(450); if (id !== run) return;
    photoImg.style.transition = '';
    const panned = await playClip(pan);
    if (id !== run) return;
    // 5. terminal
    step('terminal'); panels.hidden = false; layout();
    await wait(panned ? 250 : 0); panels.classList.add('on');
    lock(false);
  };
  // playClip resolves after playback, so show the clip layer as soon as it starts
  [fog, pan].forEach(v => v.addEventListener('playing', () => step(v === fog ? 'fog' : 'pan')));

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

  /* load the fog clip once the section is near */
  new IntersectionObserver((en, ob) => { if (en[0].isIntersecting) { fog.preload = 'auto'; fog.load(); ob.disconnect(); } }, { rootMargin: '400px' }).observe(stage);
  addEventListener('resize', layout);
  wide.addEventListener('change', layout);
  fill(current); picker.querySelectorAll('.rx-chip').forEach(b => b.setAttribute('aria-pressed', 'false'));
  layout();
})();
