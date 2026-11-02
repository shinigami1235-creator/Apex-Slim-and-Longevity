(() => {
  const T = {
    wk: { sym: 'Wk', name: '1 Week 1 Kilo', url: 'index.html#treatments' },
    cs: { sym: 'Cs', name: 'CoolSculpting', url: 'coolsculpting.html', cls: 'cold' },
    en: { sym: 'En', name: 'Emsculpt Neo', url: 'index.html#treatments' },
    ff: { sym: 'Ff', name: 'FIT FIRM', url: 'index.html#treatments' },
    iv: { sym: 'Iv', name: 'IV Therapy', url: 'index.html#longevity', cls: 'long' },
    hb: { sym: 'Hb', name: 'HBOT', url: 'index.html#longevity', cls: 'long' },
    sl: { sym: 'Sl', name: 'Snorelase', url: 'index.html#longevity', cls: 'long' }
  };
  const GOALS = {
    weight: { label: 'Lose weight', color: '#A886CD', t: ['wk'] },
    fat: { label: 'Belly and flank fat', color: '#9CCBEA', t: ['cs'] },
    tone: { label: 'Muscle tone', color: '#6A388C', t: ['en'] },
    firm: { label: 'Firmer buttocks', color: '#D9C6EA', t: ['ff'] },
    energy: { label: 'Energy and recovery', color: '#86D3BE', t: ['iv', 'hb'] },
    sleep: { label: 'Sleep without snoring', color: '#BFE7DB', t: ['sl'] }
  };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* menu */
  const mb = document.querySelector('.menu-btn'), nav = document.querySelector('.nav');
  if (mb && nav) {
    mb.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      mb.setAttribute('aria-expanded', open);
    });
    nav.addEventListener('click', e => { if (e.target.closest('a')) { nav.classList.remove('open'); mb.setAttribute('aria-expanded', false); } });
  }

  /* tape measure: vertical on desktop, progress tape on mobile */
  const tape = document.createElement('div');
  tape.className = 'tape'; tape.setAttribute('aria-hidden', 'true');
  const tapeX = document.createElement('div');
  tapeX.className = 'tape-x'; tapeX.setAttribute('aria-hidden', 'true');
  tapeX.innerHTML = '<i></i>';
  document.body.append(tape, tapeX);
  const sizeTape = () => {
    const h = document.documentElement.scrollHeight;
    tape.style.height = h + 'px';
    let html = '';
    for (let y = 40, n = 1; y < h; y += 40, n++) html += `<span style="top:${y}px">${n}</span>`;
    tape.innerHTML = html;
  };
  const bar = tapeX.firstChild;
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (max > 0 ? scrollY / max * 100 : 0) + '%';
  };
  addEventListener('load', sizeTape);
  addEventListener('resize', sizeTape);
  addEventListener('scroll', onScroll, { passive: true });
  sizeTape(); onScroll();

  /* formula readout */
  const chemHTML = keys => keys.map(k => {
    const t = T[k];
    return `<a class="mini ${t.cls || ''}" href="${t.url}"><b>${t.sym}</b><small>${t.name}</small></a>`;
  }).join('<span class="plus" aria-hidden="true">+</span>');

  /* consult form goal ticks */
  const formChecks = () => [...document.querySelectorAll('#request input[name=goal]')];
  const tickGoals = ids => formChecks().forEach(c => { if (ids.includes(c.value)) c.checked = true; });

  /* flask: stacked Blender renders, one per goal colour and fill level */
  const stage = document.getElementById('stage');
  if (stage && window.FLASK) {
    const F = window.FLASK, LAB = 'assets/img/lab/';
    const COLORS = { weight: '#B470DA', fat: '#4FA6E0', tone: '#5B1F88', firm: '#D39BE8', energy: '#2FB892', sleep: '#7FD8C6' };
    const order = [];
    const chem = document.getElementById('chem');
    const book = document.getElementById('book-formula');
    const stream = document.getElementById('stream');
    const src = (c, l) => `${LAB}flask-${c}-${l}.webp`;
    const pct = v => (v * 100).toFixed(2) + '%';
    const below = i => {
      const c = F.curves[i];
      const pts = [[0, c[0][1]], ...c, [1, c[c.length - 1][1]], [1, 1], [0, 1]];
      return 'polygon(' + pts.map(p => pct(p[0]) + ' ' + pct(p[1])).join(',') + ')';
    };
    const surfaceY = i => F.curves[i][20][1];
    const img = (s, clip) => {
      const el = new Image(); el.className = 'st-img'; el.alt = ''; el.src = s; el.decoding = 'async';
      if (clip) el.style.clipPath = clip;
      return el;
    };
    const build = () => {
      const n = order.length, frag = document.createDocumentFragment();
      frag.append(img(n ? src(order[n - 1], n) : src('base', 0)));
      for (let k = n - 1; k >= 0; k--) frag.append(img(src(k === 0 ? 'base' : order[k - 1], 6), below(k)));
      return frag;
    };
    const render = (animate, color) => {
      const n = order.length;
      const old = [...stage.querySelectorAll('.st-img')];
      const fresh = build();
      const layers = [...fresh.children];
      const top = layers[0];
      if (animate && !reduce) {
        const from = surfaceY(n - 1) * 100, to = surfaceY(n) * 100 - 4;
        top.style.clipPath = `inset(${from}% 0 0 0)`;
        stage.insertBefore(fresh, stream);
        const keep = old[0];
        old.slice(1).forEach(e => e.remove());
        if (keep) stage.insertBefore(keep, stage.firstChild);
        stream.style.background = color;
        stream.style.top = '8%';
        stream.style.height = (surfaceY(n) * 100 - 8) + '%';
        stream.style.opacity = 1;
        const t0 = performance.now(), dur = 1100;
        const step = now => {
          const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
          top.style.clipPath = `inset(${(from + (Math.max(0, to) - from) * e).toFixed(2)}% 0 0 0)`;
          if (p > .55) stream.style.opacity = 0;
          if (p < 1) requestAnimationFrame(step);
          else { top.style.clipPath = ''; keep && keep.remove(); }
        };
        top.decode ? top.decode().catch(() => {}).then(() => requestAnimationFrame(step)) : requestAnimationFrame(step);
      } else {
        stage.insertBefore(fresh, stream);
        old.forEach(e => e.remove());
      }
    };
    const refresh = () => {
      const keys = [...new Set(order.flatMap(id => GOALS[id].t))];
      chem.innerHTML = keys.length ? chemHTML(keys) : '<span class="empty">Tap a goal on the shelf to add it to the flask.</span>';
      book.hidden = !keys.length;
      book.dataset.goals = order.join(',');
    };
    document.querySelectorAll('.bottle').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.goal, i = order.indexOf(id);
        if (i > -1) { order.splice(i, 1); btn.setAttribute('aria-pressed', 'false'); render(false); }
        else { order.push(id); btn.setAttribute('aria-pressed', 'true'); render(true, COLORS[id]); }
        refresh();
      });
    });
    book.addEventListener('click', () => tickGoals(book.dataset.goals.split(',')));
    refresh();
    const warm = () => Object.keys(COLORS).forEach(c => { for (let l = 1; l <= 6; l++) new Image().src = src(c, l); });
    'requestIdleCallback' in window ? requestIdleCallback(warm, { timeout: 3000 }) : setTimeout(warm, 1500);
  }

  /* consult form */
  const form = document.getElementById('request');
  if (form) {
    const pre = form.dataset.goals;
    if (pre) tickGoals(pre.split(','));
    form.addEventListener('submit', e => {
      e.preventDefault();
      const msg = form.querySelector('.form-msg');
      const name = form.elements.name.value.trim(), contact = form.elements.contact.value.trim();
      if (!name || !contact) { msg.textContent = 'Add your name and a phone number or LINE ID.'; return; }
      if (!form.elements.consent.checked) { msg.textContent = 'Tick the consent box to send the request.'; return; }
      msg.textContent = 'The form connects to Apex Slim in the build stage.';
      (window.dataLayer = window.dataLayer || []).push({ event: 'consult:submit' });
    });
  }
})();
