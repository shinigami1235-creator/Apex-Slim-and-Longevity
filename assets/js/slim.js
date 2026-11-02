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

  /* mixing bench: pick ingredients, pour each one, mix to one colour */
  const stage = document.getElementById('stage');
  if (stage && window.MIX) {
    const M = window.MIX, LAB = 'assets/img/lab/mix2/';
    const ORDER = ['weight', 'fat', 'tone', 'firm', 'energy', 'sleep'];
    const EFFECTS = ['swirl', 'fizz', 'shift', 'rise'];
    const picked = [];
    let busy = false, run = 0, cancelPour = null;
    const chem = document.getElementById('chem'), hForm = document.getElementById('h-formula');
    const formula = chem.closest('.formula');
    const book = document.getElementById('book-formula'), restart = document.getElementById('restart');
    const mixBtn = document.getElementById('mix-btn'), mixMsg = document.getElementById('mix-msg');
    const startOver = document.getElementById('start-over');
    const video = document.getElementById('st-video'), liquid = document.getElementById('st-liquid');
    const fx = document.getElementById('st-fx'), foam = document.getElementById('st-foam');
    const mixed = document.getElementById('st-mixed'), bubbles = document.getElementById('st-bubbles');
    const disp = document.getElementById('swirl-disp'), turb = document.getElementById('swirl-turb');
    const canWebm = video.canPlayType('video/webm; codecs="vp9"') !== '';

    const shares = n => { const base = Math.floor(100 / n); return Array.from({ length: n }, (_, i) => i === n - 1 ? 100 - base * (n - 1) : base); };
    const sorted = () => ORDER.filter(g => picked.includes(g));
    const pct = v => (v * 100).toFixed(2) + '%';
    const lerp = (a, b, t) => a + (b - a) * t;
    const ease = t => 1 - Math.pow(1 - t, 3);
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const at = (arr, f) => { const x = Math.max(0, Math.min(1, f)) * (arr.length - 1), i = Math.floor(x), t = x - i, j = Math.min(i + 1, arr.length - 1); return [arr[i], arr[j], t]; };
    const curve = f => { const [a, b, t] = at(M.curves, f); return a.map((p, k) => [lerp(p[0], b[k][0], t), lerp(p[1], b[k][1], t)]); };
    const edge = (arr, f) => { const n = Math.round(Math.max(0, Math.min(1, f)) * (arr.length - 1)); const out = arr.slice(0, n + 1); const [a, b, t] = at(arr, f); out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t)]); return out; };
    const region = f => {
      if (f <= 0) return 'polygon(0 0,0 0,0 0)';
      const pts = [...M.bottom, ...edge(M.right, f), ...curve(f).slice().reverse(), ...edge(M.left, f).reverse()];
      return 'polygon(' + pts.map(p => pct(p[0]) + ' ' + pct(p[1])).join(',') + ')';
    };
    const tween = (dur, fn) => new Promise(done => {
      const id = run, t0 = performance.now();
      const step = now => {
        if (id !== run) return done();
        const p = Math.min(1, (now - t0) / dur); fn(p);
        p < 1 ? requestAnimationFrame(step) : done();
      };
      requestAnimationFrame(step);
    });

    const tileHTML = ids => {
      const sh = shares(ids.length);
      return ids.map((id, i) => {
        const syms = GOALS[id].t.map(k => T[k].sym).join(' ');
        const cls = T[GOALS[id].t[0]].cls || '';
        return `<span class="mini ${cls}"><b>${syms}</b><small>${GOALS[id].label}</small><i>${sh[i]}%</i></span>`;
      }).join('<span class="plus" aria-hidden="true">+</span>');
    };
    const refresh = () => {
      const ids = sorted();
      chem.innerHTML = ids.length ? tileHTML(ids) : '<span class="empty">Tap an ingredient on the shelf to add it.</span>';
      startOver.hidden = !(ids.length || busy || formula.classList.contains('ready'));
    };
    const resetStage = () => {
      run++;
      if (cancelPour) cancelPour();
      liquid.innerHTML = ''; liquid.style.filter = ''; liquid.style.clipPath = ''; liquid.style.opacity = '';
      fx.innerHTML = ''; foam.style.opacity = 0; bubbles.innerHTML = '';
      mixed.classList.remove('on'); video.classList.remove('on'); video.pause();
      formula.classList.remove('ready'); hForm.textContent = 'Your formula';
      book.hidden = true; restart.hidden = true;
      document.body.classList.remove('stage-busy'); busy = false;
    };

    document.querySelectorAll('.bottle').forEach(btn => {
      btn.addEventListener('click', () => {
        if (busy) return;
        if (formula.classList.contains('ready')) resetStage();
        const id = btn.dataset.goal, i = picked.indexOf(id);
        if (i > -1) picked.splice(i, 1); else picked.push(id);
        btn.setAttribute('aria-pressed', i > -1 ? 'false' : 'true');
        mixMsg.textContent = '';
        refresh();
      });
    });

    const playPour = (g, side, from, to, slice) => new Promise(done => {
      video.src = `${LAB}pour-${g}-${side}${canWebm ? '.webm' : '.mp4'}`;
      video.playbackRate = picked.length > 3 ? 1.5 : 1.15;
      const start = 0.72, end = 1.86;
      let finished = false;
      const finish = () => { if (finished) return; finished = true; cancelPour = null; slice.style.clipPath = region(to); done(); };
      cancelPour = finish;
      const tick = () => {
        if (finished) return;
        const p = Math.max(0, Math.min(1, (video.currentTime - start) / (end - start)));
        slice.style.clipPath = region(lerp(from, to, 1 - Math.pow(1 - p, 1.6)));
        requestAnimationFrame(tick);
      };
      video.onended = finish;
      video.oncanplay = () => { video.oncanplay = null; video.classList.add('on'); video.play().catch(finish); requestAnimationFrame(tick); };
      video.onerror = finish;
      video.load();
    });

    const fxLayer = (src) => {
      const im = new Image(); im.alt = ''; im.src = src; im.style.clipPath = region(1); im.style.opacity = 0;
      fx.innerHTML = ''; fx.appendChild(im); return im;
    };
    const fizz = (n, speed) => {
      const top = M.curves[40][20][1];
      for (let i = 0; i < n; i++) {
        const b = document.createElement('i');
        const f = Math.random() * 0.85, [l] = at(M.left, f), [r] = at(M.right, f);
        const y = curve(f)[20][1], x = lerp(l[0] + 0.03, r[0] - 0.03, Math.random()), size = 2 + Math.random() * (speed ? 5 : 7);
        b.className = speed ? 'pop' : '';
        b.style.cssText = `left:${pct(x)};top:${pct(y)};width:${size}px;height:${size}px;animation-delay:${(i * (speed ? 0.035 : 0.09)).toFixed(2)}s;--h:-${Math.round((y - top) * stage.clientHeight)}px;--d:${((speed ? 0.6 : 1.1) + Math.random() * 0.7).toFixed(2)}s`;
        bubbles.appendChild(b);
        setTimeout(() => b.remove(), 4200);
      }
    };
    const placeFoam = (thick) => {
      const c = M.curves[40], x0 = c[0][0], x1 = c[c.length - 1][0], y = c[20][1];
      const w = (x1 - x0) * stage.clientWidth, h = Math.max(8, thick * stage.clientHeight);
      foam.style.cssText = `left:${pct(x0)};top:calc(${pct(y)} - ${h / 2}px);width:${w}px;height:${h}px;opacity:0`;
    };

    const effects = {
      async swirl(src) {
        liquid.style.filter = 'url(#swirl)'; liquid.style.clipPath = region(1);
        await tween(2300, p => {
          disp.setAttribute('scale', (Math.sin(p * Math.PI) * 22).toFixed(1));
          turb.setAttribute('baseFrequency', `${(0.012 + p * 0.01).toFixed(4)} ${(0.03 - p * 0.012).toFixed(4)}`);
          turb.setAttribute('seed', String(3 + Math.floor(p * 24)));
          if (p > 0.35) mixed.classList.add('on');
        });
        fizz(16, false);
      },
      async fizz(src) {
        const im = fxLayer(src);
        placeFoam(0.035);
        fizz(46, true);
        await tween(2400, p => {
          im.style.opacity = Math.min(1, p * 2.2).toFixed(3);
          im.style.filter = `brightness(${(1 + 0.12 * Math.sin(p * 30) * (1 - p)).toFixed(3)})`;
          foam.style.opacity = (Math.sin(Math.min(1, p * 1.4) * Math.PI) * 0.9).toFixed(3);
          foam.style.transform = `scaleY(${(1 + p * 1.6).toFixed(2)})`;
        });
        mixed.classList.add('on');
      },
      async shift(src) {
        const im = fxLayer(src);
        const hues = [0, 140, 260, 50, 0];
        await tween(2800, p => {
          im.style.opacity = Math.min(1, p * 4).toFixed(3);
          const x = p * (hues.length - 1), i = Math.min(hues.length - 2, Math.floor(x)), t = x - i;
          const h = lerp(hues[i], hues[i + 1], t * t * (3 - 2 * t));
          im.style.filter = `hue-rotate(${h.toFixed(1)}deg) saturate(${(1 + 0.5 * Math.sin(p * Math.PI)).toFixed(2)})`;
        });
        mixed.classList.add('on');
        fizz(12, false);
      },
      async rise(src) {
        const im = fxLayer(src); im.style.opacity = 1;
        const set = y => { const m = `linear-gradient(to top,#000 ${y}%,transparent ${y + 18}%)`; im.style.webkitMaskImage = m; im.style.maskImage = m; };
        set(-20); fizz(22, false);
        await tween(1700, p => set(lerp(-20, 100, ease(p))));
        placeFoam(0.05);
        await tween(1300, p => {
          foam.style.opacity = (Math.sin(p * Math.PI) * 0.85).toFixed(3);
          foam.style.transform = `translateY(${(-10 * Math.sin(p * Math.PI)).toFixed(1)}px) scaleY(${(1 + Math.sin(p * Math.PI)).toFixed(2)})`;
        });
        mixed.classList.add('on');
      }
    };
    const pickEffect = ids => EFFECTS[[...ids.join('')].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % EFFECTS.length];

    mixBtn.addEventListener('click', async () => {
      if (busy) return;
      const ids = sorted();
      if (!ids.length) { mixMsg.textContent = 'Pick at least one ingredient.'; return; }
      resetStage();
      busy = true; mixMsg.textContent = ''; const id = run;
      const r = stage.getBoundingClientRect();
      if (r.top < 70 || r.bottom > innerHeight) stage.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      document.body.classList.add('stage-busy'); refresh();
      hForm.textContent = 'Mixing your formula';
      chem.innerHTML = tileHTML(ids);
      const mixSrc = LAB + (ids.length === 1 ? 'full-' : 'mix-') + ids.join('-') + '.webp';
      new Image().src = mixSrc; mixed.src = mixSrc;
      const n = ids.length, slices = [];
      for (let i = 0; i < n; i++) {
        const sl = new Image(); sl.alt = ''; sl.src = LAB + 'full-' + ids[i] + '.webp';
        sl.style.clipPath = region(0); liquid.prepend(sl); slices.push(sl);
      }
      for (let i = 0; i < n; i++) {
        if (id !== run) return;
        slices[i].style.clipPath = region(i / n);
        if (reduce) { slices[i].style.clipPath = region((i + 1) / n); continue; }
        await playPour(ids[i], i % 2 ? 'L' : 'R', i / n, (i + 1) / n, slices[i]);
      }
      if (id !== run) return;
      video.classList.remove('on');
      if (reduce) mixed.classList.add('on'); else { await effects[pickEffect(ids)](mixSrc); await wait(500); }
      if (id !== run) return;
      liquid.innerHTML = ''; liquid.style.filter = ''; liquid.style.clipPath = ''; fx.innerHTML = ''; foam.style.opacity = 0;
      formula.classList.add('ready'); hForm.textContent = 'Your formula is ready';
      book.hidden = false; restart.hidden = false; book.dataset.goals = ids.join(',');
      document.body.classList.remove('stage-busy'); busy = false; refresh();
      (window.dataLayer = window.dataLayer || []).push({ event: 'formula:mixed', goals: ids.join(',') });
    });
    const over = () => {
      resetStage(); picked.length = 0; mixMsg.textContent = '';
      document.querySelectorAll('.bottle').forEach(b => b.setAttribute('aria-pressed', 'false'));
      refresh();
    };
    restart.addEventListener('click', over);
    startOver.addEventListener('click', over);
    book.addEventListener('click', () => tickGoals(book.dataset.goals.split(',')));
    refresh();
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
