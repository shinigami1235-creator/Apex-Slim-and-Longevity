(() => {
  const T = {
    wk: { sym: 'Wk', name: '1 Week 1 Kilo', url: 'index.html#treatments', time: 'Once a week for 4 weeks',
      desc: 'A weekly program prescribed by the doctor that works on the hunger that rises when you eat less.' },
    cs: { sym: 'Cs', name: 'CoolSculpting', url: 'coolsculpting.html', cls: 'cold', time: 'About 35 min per area',
      desc: 'Cools a fold of fat until the fat cells in it die, and you go back to work the same day.' },
    en: { sym: 'En', name: 'Emsculpt Neo', url: 'index.html#treatments', time: '30 min, 4 sessions',
      desc: 'Heat and magnetic pulses work on fat and muscle in the same session.' },
    ff: { sym: 'Ff', name: 'FIT FIRM', url: 'index.html#treatments', time: 'Buttocks and thighs',
      desc: '' },
    iv: { sym: 'Iv', name: 'IV Therapy', url: 'index.html#longevity', cls: 'long', time: '30 to 60 min drip',
      desc: 'Vitamins, minerals and fluids through a drip, mixed by the doctor for your goal.' },
    hb: { sym: 'Hb', name: 'HBOT', url: 'index.html#longevity', cls: 'long', time: '60 to 90 min in the chamber',
      desc: 'You breathe pure oxygen in a pressurised chamber, which raises the oxygen carried in your blood.' },
    sl: { sym: 'Sl', name: 'Snorelase', url: 'index.html#longevity', cls: 'long', time: '3 sessions, no cuts',
      desc: 'A laser tightens the soft palate to reduce snoring, with no anaesthetic.' }
  };
  const GOALS = {
    weight: { label: 'Lose weight', color: '#D27FD0', t: ['wk'] },
    fat: { label: 'Belly and flank fat', color: '#5DB3E8', t: ['cs'] },
    tone: { label: 'Muscle tone', color: '#8B4FC4', t: ['en'] },
    firm: { label: 'Firmer buttocks', color: '#F07E7E', t: ['ff'] },
    energy: { label: 'Energy and recovery', color: '#F2B33D', t: ['iv', 'hb'] },
    sleep: { label: 'Sleep without snoring', color: '#86DCCB', t: ['sl'] }
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
    /* 8 mix motions x 8 finishing touches = 64 pairs; each of the 63 combinations gets its own */
    const MIXES = ['swirl', 'fizz', 'shift', 'rise', 'sink', 'sweep', 'bloom', 'glow'];
    const FINISHES = ['steam', 'halo', 'drop', 'glints', 'column', 'shine', 'motes', 'pulse'];
    const COMBO = {};
    Array.from({ length: 63 }, (_, i) => i + 1)
      .map(m => ORDER.filter((g, b) => m & (1 << b)))
      .sort((a, b) => a.length - b.length)
      .forEach((ids, n) => { COMBO[ids.join('-')] = [MIXES[(3 * n) % 8], FINISHES[(5 * n + (n >> 3)) % 8]]; });
    const picked = [];
    let busy = false, run = 0, cancelPour = null;
    const chem = document.getElementById('chem'), hForm = document.getElementById('h-formula');
    const formula = chem.closest('.formula');
    const book = document.getElementById('book-formula'), restart = document.getElementById('restart');
    const rx = document.getElementById('rx'), rxList = document.getElementById('rx-list');
    const seeRx = document.getElementById('see-rx'), status = document.getElementById('st-status');
    const finish = document.getElementById('st-finish');
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
    const rxHTML = ids => {
      const keys = [...new Set(ids.flatMap(id => GOALS[id].t))];
      return keys.map(k => {
        const t = T[k], goal = ids.find(id => GOALS[id].t.includes(k));
        return `<a class="rx-card" href="${t.url}"><span class="mini ${t.cls || ''}"><b>${t.sym}</b></span><span class="rx-text"><span class="rx-for">For ${GOALS[goal].label.toLowerCase()}</span><b class="rx-name">${t.name}</b>${t.desc ? `<span class="rx-desc">${t.desc}</span>` : ''}<span class="rx-time">${t.time}</span></span></a>`;
      }).join('');
    };
    const hsl = hex => {
      const n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
      if (!d) return [0, 0, l];
      const sat = d / (1 - Math.abs(2 * l - 1));
      const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      return [(h * 60 + 360) % 360, sat, l];
    };
    const mixColour = ids => {
      let x = 0, y = 0, sat = 0, l = 0;
      ids.forEach(id => { const [h, s2, l2] = hsl(GOALS[id].color); x += Math.cos(h * Math.PI / 180); y += Math.sin(h * Math.PI / 180); sat = Math.max(sat, s2); l += l2; });
      const h = Math.round((Math.atan2(y, x) * 180 / Math.PI + 360) % 360);
      return { h, s: Math.round(Math.max(.6, sat) * 100), l: Math.round(l / ids.length * 100) };
    };
    const setStatus = txt => { status.textContent = txt; status.classList.toggle('on', !!txt); };
    const refresh = () => {
      const ids = sorted();
      chem.innerHTML = ids.length ? tileHTML(ids) : '<span class="empty">Tap an ingredient on the shelf to add it.</span>';
      startOver.hidden = !(ids.length || busy || formula.classList.contains('ready'));
    };
    const resetStage = () => {
      run++;
      if (cancelPour) cancelPour();
      liquid.innerHTML = ''; liquid.style.filter = ''; liquid.style.clipPath = ''; liquid.style.opacity = '';
      fx.innerHTML = ''; foam.style.opacity = 0; bubbles.innerHTML = ''; finish.innerHTML = '';
      mixed.classList.remove('on'); video.classList.remove('on'); video.pause();
      formula.classList.remove('ready'); hForm.textContent = 'Your formula';
      rx.hidden = true; seeRx.hidden = true; mixBtn.hidden = false; setStatus('');
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

    const holder = () => { const d = document.createElement('div'); d.className = 'st-clip'; d.style.clipPath = region(1); fx.appendChild(d); return d; };
    const maskOn = (im, m) => { im.style.webkitMaskImage = m; im.style.maskImage = m; };
    const lit = (im, p) => { const k = p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3; im.style.filter = `brightness(${(1 + 0.28 * k).toFixed(3)}) saturate(${(1 + 0.4 * k).toFixed(3)})`; };
    const surf = () => M.curves[40][20][1];
    const NECK = 0.335;
    const glass = () => {
      const pts = [...M.bottom, ...M.right.map(p => [p[0] + 0.008, p[1]]), [0.572, 0.548], [0.572, NECK], [0.428, NECK], [0.428, 0.548], ...M.left.map(p => [p[0] - 0.008, p[1]]).reverse()];
      return 'polygon(' + pts.map(p => pct(p[0]) + ' ' + pct(p[1])).join(',') + ')';
    };
    const add = (parent, cls, css) => { const e = document.createElement('i'); e.className = cls; e.style.cssText = css; parent.appendChild(e); return e; };

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
        const set = y => maskOn(im, `linear-gradient(to top,#000 ${y}%,transparent ${y + 10}%)`);
        set(-4); fizz(22, false);
        await tween(1900, p => { set(lerp(-4, 48, ease(p))); lit(im, p); });
        placeFoam(0.05);
        await tween(1300, p => {
          foam.style.opacity = (Math.sin(p * Math.PI) * 0.85).toFixed(3);
          foam.style.transform = `translateY(${(-10 * Math.sin(p * Math.PI)).toFixed(1)}px) scaleY(${(1 + Math.sin(p * Math.PI)).toFixed(2)})`;
        });
        mixed.classList.add('on');
      },
      async sink(src, c) {
        /* colour drops from the surface in clouds and settles to the bottom */
        const im = fxLayer(src); im.style.opacity = 1;
        const set = y => maskOn(im, `linear-gradient(to bottom,#000 ${y}%,transparent ${y + 9}%)`);
        set(45);
        const h = holder(), top = surf();
        for (let i = 0; i < 7; i++) {
          add(h, 'cloud', `left:${pct(lerp(0.44, 0.54, Math.random()))};top:${pct(top - 0.01)};background:hsla(${c.h},${c.s}%,${Math.min(c.l, 55)}%,.55);animation-delay:${(i * 0.18).toFixed(2)}s;--y:${Math.round((0.86 - top) * stage.clientHeight * (0.6 + Math.random() * 0.4))}px;--x:${Math.round((Math.random() - 0.5) * 50)}px`);
        }
        await tween(2300, p => { set(lerp(45, 100, ease(p))); lit(im, p); });
        mixed.classList.add('on');
      },
      async sweep(src) {
        /* a wave front sloshes across from one side and back */
        const im = fxLayer(src); im.style.opacity = 1;
        await tween(2400, p => {
          const x = lerp(22, 82, ease(p)), a = 90 + 22 * Math.sin(p * Math.PI * 3);
          maskOn(im, `linear-gradient(${a.toFixed(1)}deg,#000 ${x.toFixed(1)}%,transparent ${(x + 7).toFixed(1)}%)`); lit(im, p);
        });
        fizz(14, false);
        mixed.classList.add('on');
      },
      async bloom(src) {
        /* the colour opens out from the middle of the liquid */
        const im = fxLayer(src); im.style.opacity = 1;
        const W = stage.clientWidth;
        fizz(24, true);
        await tween(2200, p => {
          const r = lerp(0, 0.26 * W, ease(p)), wob = 1 + 0.08 * Math.sin(p * Math.PI * 6);
          maskOn(im, `radial-gradient(${(r * 1.15 * wob).toFixed(1)}px ${(r * wob).toFixed(1)}px at 50% 76%,#000 70%,transparent 100%)`); lit(im, p);
        });
        mixed.classList.add('on');
      },
      async glow(src, c) {
        /* the liquid lights up from inside, pulses twice, then settles */
        const im = fxLayer(src);
        const h = holder();
        const core = add(h, 'core', `left:50%;top:76%;background:radial-gradient(circle,hsla(${c.h},100%,92%,.95) 0,hsla(${c.h},${c.s}%,70%,.5) 35%,transparent 70%)`);
        await tween(2500, p => {
          im.style.opacity = Math.min(1, p * 3).toFixed(3);
          const beat = Math.abs(Math.sin(p * Math.PI * 2.5)) * (1 - p);
          im.style.filter = `brightness(${(1 + 0.5 * beat).toFixed(3)}) saturate(${(1 + 0.6 * beat).toFixed(3)})`;
          core.style.opacity = (beat * 1.1).toFixed(3);
          core.style.transform = `translate(-50%,-50%) scale(${(0.6 + beat).toFixed(3)})`;
        });
        mixed.classList.add('on');
      }
    };

    /* finishing touches, played once the formula is ready, in the mix colour */
    const finishes = {
      steam(c) {
        for (let i = 0; i < 5; i++) add(finish, 'steam', `left:${pct(0.5 + (i - 2) * 0.018)};top:${pct(NECK - 0.2)};background:radial-gradient(ellipse at 50% 60%,hsla(${c.h},${c.s}%,72%,.95) 0,hsla(${c.h},${c.s}%,85%,.5) 40%,transparent 70%);animation-delay:${(i * 0.32).toFixed(2)}s;--dx:${Math.round((Math.random() - 0.5) * 40)}px`);
      },
      halo(c) {
        add(finish, 'halo', `background:radial-gradient(circle at 50% 66%,hsla(${c.h},${c.s}%,72%,.75) 0,hsla(${c.h},${c.s}%,85%,.35) 22%,transparent 46%)`);
      },
      drop(c) {
        const top = surf(), H = stage.clientHeight;
        add(finish, 'droplet', `left:50%;top:${pct(NECK - 0.14)};background:hsl(${c.h},${c.s}%,${c.l}%);--y:${Math.round((top - NECK + 0.14) * H)}px`);
        for (let i = 0; i < 3; i++) add(finish, 'ring', `left:50%;top:${pct(top)};border-color:hsl(${c.h},${c.s}%,${Math.max(c.l - 18, 25)}%);animation-delay:${(0.55 + i * 0.3).toFixed(2)}s`);
      },
      glints() {
        const spots = [[0.43, 0.38], [0.57, 0.46], [0.39, 0.68], [0.63, 0.74], [0.36, 0.86], [0.6, 0.6], [0.47, 0.82]];
        spots.forEach(([x, y], i) => add(finish, 'glint', `left:${pct(x)};top:${pct(y)};animation-delay:${(i * 0.22).toFixed(2)}s`));
      },
      column() {
        const top = surf(), H = stage.clientHeight;
        for (let i = 0; i < 26; i++) {
          const y = 0.88 - Math.random() * 0.04, size = 3 + Math.random() * 5;
          add(bubbles, '', `left:${pct(0.5 + (Math.random() - 0.5) * 0.025)};top:${pct(y)};width:${size}px;height:${size}px;animation-delay:${(i * 0.09).toFixed(2)}s;--h:-${Math.round((y - top) * H)}px;--d:${(1 + Math.random() * 0.4).toFixed(2)}s`);
        }
      },
      shine(c) {
        const s = add(finish, 'shine', `clip-path:${glass()};background-image:linear-gradient(105deg,transparent 38%,hsla(${c.h},100%,94%,.0) 42%,rgba(255,255,255,.75) 50%,hsla(${c.h},100%,90%,.35) 55%,transparent 62%)`);
        s.addEventListener('animationend', () => s.remove());
      },
      motes(c) {
        for (let i = 0; i < 16; i++) {
          const size = 3 + Math.random() * 4;
          add(finish, 'mote', `left:${pct(0.47 + Math.random() * 0.06)};top:${pct(NECK + 0.02)};width:${size}px;height:${size}px;background:hsl(${c.h},${c.s}%,${Math.min(c.l + 8, 75)}%);animation-delay:${(i * 0.13).toFixed(2)}s;--dx:${Math.round((Math.random() - 0.5) * 120)}px;--dy:-${Math.round(60 + Math.random() * 70)}px`);
        }
      },
      pulse(c) {
        /* a heartbeat trace runs across the liquid */
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('class', 'ecg-fin');
        svg.style.clipPath = region(1);
        svg.innerHTML = `<path d="M30 77H43L44.5 76 46 77H47.5L48.5 78.5 50 67 51.5 85 52.5 76.5H54L56 77H70" pathLength="1" stroke="hsl(${c.h},${c.s}%,96%)"/>`;
        finish.appendChild(svg);
      }
    };

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
      const [mixFx, finFx] = COMBO[ids.join('-')], colour = mixColour(ids);
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
        setStatus(n > 1 ? `Pouring ${GOALS[ids[i]].label.toLowerCase()}, ${i + 1} of ${n}` : `Pouring ${GOALS[ids[i]].label.toLowerCase()}`);
        if (reduce) { slices[i].style.clipPath = region((i + 1) / n); continue; }
        await playPour(ids[i], i % 2 ? 'L' : 'R', i / n, (i + 1) / n, slices[i]);
      }
      if (id !== run) return;
      video.classList.remove('on');
      setStatus('Mixing your formula');
      stage.dataset.mix = mixFx; stage.dataset.finish = finFx;
      if (reduce) mixed.classList.add('on'); else { await effects[mixFx](mixSrc, colour); await wait(500); }
      if (id !== run) return;
      liquid.innerHTML = ''; liquid.style.filter = ''; liquid.style.clipPath = ''; fx.innerHTML = ''; foam.style.opacity = 0;
      formula.classList.add('ready'); hForm.textContent = 'Your formula is ready';
      setStatus('Your formula is ready');
      if (!reduce) { finishes[finFx](colour); setTimeout(() => { if (id === run) finish.innerHTML = ''; }, 4500); }
      rxList.innerHTML = rxHTML(ids); rx.hidden = false;
      mixBtn.hidden = true; seeRx.hidden = false; book.dataset.goals = ids.join(',');
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
