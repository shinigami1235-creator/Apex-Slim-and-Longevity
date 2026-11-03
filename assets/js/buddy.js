/* Nong Tape: the Apex Slim buddy.
   It moves like the butterfly on the CSA site: it always lives on the screen (position fixed),
   picks the perch nearest the reading line (42% down the screen) and follows it with a damped
   spring every frame, so scrolling drags it along smoothly instead of leaving it behind.
   Perches are the things worth standing next to (the flask, the results machine, the 3D body,
   the goal photo) plus the end of each section heading. With no perch on screen it waits in the
   bottom-left corner.
   Other scripts tell it what happened with document.dispatchEvent(new CustomEvent('buddy', { detail: 'formula' })).
   Rules that keep it cute and out of the way:
   - it only talks on big moments, never in the first 3 seconds, and at most once every 15 seconds
   - each line is said once per visit; the rest of the time it reacts with a face and a move
   - it never comments on weight, BMI or waist numbers
   - perches sit in empty space beside the content */
import { createBuddy } from './buddy-art.js?v=7';

const NAME = 'Nong Tape';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const phone = () => innerWidth < 760;
const store = (k, v) => { try { return v === undefined ? localStorage.getItem(k) : localStorage.setItem(k, v); } catch (e) { return null; } };
const said = new Set((() => { try { return JSON.parse(sessionStorage.getItem('buddy-said') || '[]'); } catch (e) { return []; } })());
const remember = k => { said.add(k); try { sessionStorage.setItem('buddy-said', JSON.stringify([...said])); } catch (e) {} };

/* what each event does: pose, face, how long, an optional line, and a body move */
const EVENTS = {
  hello:    { pose: 'wave', expr: 'happy', ms: 2200, move: 'wiggle', line: `Hi, I'm ${NAME}.` },
  tap:      { pose: 'hop', expr: 'wink', ms: 700, move: 'hop' },
  love:     { pose: 'heart', expr: 'love', ms: 1800, move: 'bob' },
  mixing:   { pose: 'think', expr: 'thinking', ms: 0 },
  formula:  { pose: 'flask', expr: 'excited', ms: 3000, move: 'hop', line: 'Your formula is ready.' },
  measure:  { pose: 'measure', expr: 'thinking', ms: 1800 },
  goal:     { pose: 'idle', expr: 'proud', ms: 1400 },
  scanning: { pose: 'think', expr: 'thinking', ms: 0 },
  reveal:   { pose: 'cheer', expr: 'surprised', ms: 1800, move: 'hop' },
  photo:    { pose: 'cover', expr: 'shy', ms: 2600, line: "I won't peek. No photo uploaded." },
  oops:     { pose: 'idle', expr: 'oops', ms: 2200 },
  meals:    { pose: 'hop', expr: 'happy', ms: 600, move: 'hop' },
  sent:     { pose: 'heart', expr: 'love', ms: 3200, move: 'bob', line: 'See you at Apex Slim.' }
};

/* perches. at: in-bl = inside the bottom-left corner, out-r / out-l = beside it with bottoms lined up,
   end = standing on the right end, text = right after a heading's text (or on top of it when there's no room).
   bonus pulls it toward the perches that matter. desk: desktop only. */
const PERCHES = [
  { sel: '.flask-box', at: 'in-bl', dx: 10, dy: -4, face: 'right', bonus: 80 },
  { sel: '#rx-stage', at: 'in-bl', dx: 22, dy: -14, face: 'right', bonus: 80, arrive: { pose: 'idle', expr: 'curious', ms: 1200 } },
  { sel: '#bc-canvas', at: 'in-bl', dx: 14, dy: -10, face: 'right', bonus: 80, arrive: { pose: 'measure', expr: 'thinking', ms: 1800 } },
  { sel: '.gp-view', at: 'in-bl', dx: 14, dy: -10, face: 'right', bonus: 80 },
  { sel: '#treatments .legend', at: 'end', dx: 0, dy: -6, face: 'left', desk: true, arrive: { pose: 'point', expr: 'curious', ms: 1600 } },
  { sel: '#play .btn', at: 'out-r', dx: 18, dy: 6, face: 'left', bonus: 40, arrive: { pose: 'point', expr: 'happy', ms: 1400 } },
  { sel: '#request', at: 'out-l', dx: -36, dy: 0, face: 'right', desk: true, bonus: 40, arrive: { pose: 'wave', expr: 'happy', ms: 1400 } },
  { sel: '#ml-next', at: 'out-l', dx: -14, dy: 8, face: 'right', desk: true, arrive: { pose: 'point', expr: 'happy', ms: 1400 } },
  { sel: 'main section h2', at: 'text', dx: 14, dy: 2, face: 'left', all: true }
];

/* quips: one when it lands in a section, at most once per section per visit (or again after 4 minutes),
   never within 25 seconds of another line. The next visit starts from the next quip in the list. */
const QUIPS = {
  bench: ["You've got this!", "Let's mix something!", 'Hi again!'],
  treatments: ['Take your time.', 'One step at a time.', 'So many options!'],
  longevity: ['Rest counts too.', 'Sleep is self-care!', 'Be kind to yourself.'],
  results: ['Ooh, look!', 'So exciting!', 'Look at that change!'],
  notes: ['Nice, a reader!', 'Learning is fun!', 'Smart move.'],
  play: ['Wanna play?', 'This part is fun!', 'Come try the lab!'],
  consult: ["You're almost there!", 'Big step, nice!', "We'd love to meet you!"],
  'body-check': ['No judging here!', "You're doing great!", 'Every body is welcome.'],
  'goal-photo': [{ t: "I won't peek!", pose: 'cover', expr: 'shy', ms: 2600 }, 'Dream big!', 'Goals are good!'],
  meals: ['Yum!', 'Hungry yet?', 'Eat well, feel well.'],
  how: ['Brr, chilly!', 'Cool stuff!', 'Ooh, science!']
};
const QUIP_GAP = 25000, QUIP_AGAIN = 240000;
const quipped = (() => { try { return JSON.parse(sessionStorage.getItem('buddy-quipped') || '{}'); } catch (e) { return {}; } })();
function quip(el) {
  const sec = el && el.closest('section[id], .bench'); if (!sec) return;
  const key = sec.id || 'bench', list = QUIPS[key]; if (!list) return;
  const t = Date.now();
  if (t - born < 6000 || t - lastSay < QUIP_GAP || root.classList.contains('talking')) return;
  if (quipped[key] && t - quipped[key] < QUIP_AGAIN) return;
  let n = 0; try { n = +(localStorage.getItem('buddy-q-' + key) || 0); } catch (e) {}
  quipped[key] = t; try { sessionStorage.setItem('buddy-quipped', JSON.stringify(quipped)); localStorage.setItem('buddy-q-' + key, n + 1); } catch (e) {}
  const q = list[n % list.length];
  if (typeof q === 'string') { speak(q); return; }
  // a quip with a move, like covering its eyes for "I won't peek!"
  clearTimeout(actTimer); rig.set({ pose: q.pose, expr: q.expr }); speak(q.t);
  busyUntil = Date.now() + q.ms; actTimer = setTimeout(() => { busyUntil = 0; rest(); }, q.ms);
}

/* ---------- build ---------- */
const root = document.createElement('div');
root.className = 'buddy';
root.innerHTML = `<div class="buddy-turn"><button class="buddy-body" type="button" aria-label="${NAME}, tap to say hi"><span class="buddy-art"></span></button></div>
  <span class="buddy-float" aria-hidden="true"></span>
  <span class="buddy-nap" aria-hidden="true"><i class="bub"></i><b>z</b><b>z</b><b>Z</b></span>
  <p class="buddy-say" aria-hidden="true"></p>
  <button class="buddy-x" type="button" aria-label="Hide ${NAME}">×</button>`;
document.body.append(root);
const turn = root.querySelector('.buddy-turn'), body = root.querySelector('.buddy-body'), bubble = root.querySelector('.buddy-say'), hideBtn = root.querySelector('.buddy-x');
const SIZE = () => phone() ? 66 : 92;
let rigSize = SIZE(), rig = createBuddy(root.querySelector('.buddy-art'), rigSize);
const W = () => SIZE(), H = () => SIZE() * 200 / 230;
const viewH = () => window.visualViewport ? visualViewport.height : innerHeight;

let base = { pose: 'idle', expr: 'happy', turn: 0 };
let actTimer = 0, sayTimer = 0, lastSay = 0, lastInput = Date.now(), asleep = false, held = false, facing = 1;
const born = Date.now();

const MOVES = ['m-hop', 'm-wiggle', 'm-bob', 'm-startle', 'm-giggle', 'm-spin', 'm-boing', 'm-wobble', 'm-trip'];
const move = m => { if (reduce || !m) return; body.classList.remove(...MOVES); void body.offsetWidth; body.classList.add('m-' + m); };
body.addEventListener('animationend', e => { if (/buddy-(hop|wiggle|bob|startle|giggle|spin|boing|wobble|trip)/.test(e.animationName)) body.classList.remove(...MOVES); });
const setFace = dir => { if (dir === facing) return; facing = dir; turn.classList.toggle('flip', dir < 0); };
const rest = () => { if (!held && !asleep && !flying) rig.set(base); };

function act(name) {
  const e = EVENTS[name]; if (!e || root.classList.contains('away') || mode !== 'follow') return;
  if (asleep) wake();
  stopFidget(); clearTimeout(actTimer);
  rig.set({ pose: e.pose, expr: e.expr }); move(e.move);
  held = e.ms === 0;                       // 0 means hold this until another event or 'done'
  if (!held) actTimer = setTimeout(() => { busyUntil = 0; rest(); }, e.ms);
  busyUntil = held ? Infinity : Date.now() + e.ms;
  if (e.line) say(name, e.line);
}
let busyUntil = 0;
const sideOfBubble = () => root.classList.toggle('say-left', pos.x + W() + 230 > innerWidth);
function say(key, text) {
  const t = Date.now();
  if (said.has(key) || t - born < 2900 || t - lastSay < 15000) return;
  remember(key); speak(text);
}
function speak(text) {
  lastSay = Date.now();
  bubble.textContent = text; sideOfBubble();
  root.classList.add('talking');
  clearTimeout(sayTimer); sayTimer = setTimeout(() => root.classList.remove('talking'), Math.min(5500, 2600 + text.length * 45));
}
function done() { held = false; busyUntil = 0; clearTimeout(actTimer); rig.set(base); }

/* blink by closing the eyes, every few seconds */
(function blink() { setTimeout(() => { if (!held && !asleep && !flying) rig.blink(); blink(); }, 2600 + Math.random() * 3400); })();

/* dozes off after 45 seconds with nothing happening */
function sleep() {
  asleep = true; root.classList.add('napping'); rig.set({ pose: 'sleep', expr: 'sleepy', ms: 900 }); body.classList.add('m-sleep');
  // after a few breaths the nose bubble grows around him and he floats off in it
  clearTimeout(bubbleT);
  if (!reduce) bubbleT = setTimeout(() => { if (asleep && mode === 'follow') { root.classList.add('bubbled'); mode = 'float'; floatT0 = performance.now(); } }, 6500);
}
let bubbleT = 0, floatT0 = 0;
/* tapped or grabbed while floating: the bubble pops and he drops back to his level */
function popFloat() {
  clearTimeout(bubbleT); popBubble();
  asleep = false; root.classList.remove('napping', 'bubbled'); body.classList.remove('m-sleep');
  mode = 'fall'; vel.x = 0; vel.y = -120; stopFidget(); clearTimeout(actTimer); busyUntil = Infinity; lastInput = Date.now();
  rig.set({ pose: 'cheer', expr: 'surprised', ms: 160, turn: 0 }); move('startle');
}
/* tapped awake: startled jump, then a quick giggle */
function wakeByTap() {
  clearTimeout(bubbleT);
  asleep = false; root.classList.remove('napping'); popBubble(); body.classList.remove('m-sleep'); stopFidget(); clearTimeout(actTimer);
  lastInput = Date.now(); yawned = false;
  rig.set({ pose: 'cheer', expr: 'surprised', ms: 160 }); move('startle');
  busyUntil = Date.now() + 1900;
  actTimer = setTimeout(() => {
    rig.set({ pose: 'cover', expr: 'giggle', ms: 260 }); move('giggle'); hehe('hehe!');
    actTimer = setTimeout(() => { busyUntil = 0; rest(); }, 1200);
  }, 650);
}
function hehe(text) {
  if (reduce) return;
  const h = document.createElement('span'); h.className = 'buddy-hehe'; h.textContent = text;
  root.append(h); setTimeout(() => h.remove(), 1200);
}
function popBubble() { if (reduce) return; root.classList.add('pop'); setTimeout(() => root.classList.remove('pop'), 420); }
function wake() {
  asleep = false; root.classList.remove('napping'); body.classList.remove('m-sleep');
  rig.set({ pose: 'idle', expr: 'surprised', ms: 300 });
  setTimeout(() => { if (!asleep && !held && rig.expr === 'surprised') rig.set(base); }, 600);
}
const poke = () => { lastInput = Date.now(); };   // a nap only ends with a tap on him or a real event
['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(t => addEventListener(t, poke, { passive: true }));
setInterval(() => { if (mode === 'follow' && !asleep && !held && !flying && !fidgeting && Date.now() - lastInput > 45000) sleep(); }, 3000);

/* idle play: every 7 to 14 seconds of resting it does one small thing on its own.
   A yawn after 25 seconds with no input comes before the nap at 45. */
const FIDGETS = [
  [{ pose: 'idle', expr: 'curious', look: [-1, 0], ms: 900 }, { pose: 'idle', expr: 'curious', look: [1, 0], ms: 900 }, { pose: 'idle', expr: 'happy', look: [0, 0], ms: 300 }],
  [{ pose: 'cheer', expr: 'excited', ms: 650, move: 'hop' }, { pose: 'idle', expr: 'happy', ms: 300 }],
  [{ pose: 'measure', expr: 'thinking', ms: 1100 }, { pose: 'idle', expr: 'proud', ms: 700 }],
  [{ pose: 'wave', expr: 'happy', ms: 1300, move: 'wiggle' }],
  [{ pose: 'hop', expr: 'wink', ms: 500, move: 'hop' }, { pose: 'hop', expr: 'happy', ms: 500, move: 'hop' }],
  [{ pose: 'think', expr: 'thinking', ms: 1400 }, { pose: 'idle', expr: 'surprised', ms: 400 }, { pose: 'idle', expr: 'happy', ms: 300 }],
  [{ pose: 'shy', expr: 'shy', ms: 1200 }, { pose: 'idle', expr: 'happy', ms: 300 }],
  [{ pose: 'heart', expr: 'love', ms: 1300, move: 'bob' }]
];
const YAWN = [{ pose: 'idle', expr: 'sleepy', ms: 1300, move: 'bob' }, { pose: 'idle', expr: 'happy', ms: 300 }];
let fidgeting = false, fidgetTimers = [], lastFidget = -1, yawned = false;
function stopFidget() { fidgetTimers.forEach(clearTimeout); fidgetTimers = []; if (fidgeting) { fidgeting = false; rig.look(0, 0); } }
function playFidget(seq) {
  fidgeting = true; let t = 0;
  seq.forEach(st => {
    fidgetTimers.push(setTimeout(() => {
      rig.set({ pose: st.pose, expr: st.expr }); move(st.move);
      if (st.look) rig.look(st.look[0] * facing, st.look[1]);
    }, t));
    t += st.ms;
  });
  fidgetTimers.push(setTimeout(() => { fidgeting = false; rig.set(base); }, t));
}
(function idlePlay() {
  setTimeout(() => {
    const quiet = Date.now() - lastInput;
    const free = mode === 'follow' && !reduce && !held && !asleep && !flying && !fidgeting && Date.now() > busyUntil
      && !root.classList.contains('talking') && !root.classList.contains('away') && !document.hidden;
    if (free) {
      if (quiet > 25000 && !yawned) { yawned = true; playFidget(YAWN); }
      else if (quiet < 25000 || Math.random() < 0.5) {
        let i; do { i = Math.floor(Math.random() * FIDGETS.length); } while (i === lastFidget);
        lastFidget = i; playFidget(FIDGETS[i]);
      }
    }
    if (quiet < 25000) yawned = false;
    idlePlay();
  }, 7000 + Math.random() * 7000);
})();

/* eyes follow the mouse on desktop, smoothly */
if (fine) addEventListener('pointermove', e => {
  lastInput = Date.now(); if (asleep || fidgeting) return;
  const dx = e.clientX - (pos.x + W() / 2), dy = e.clientY - (pos.y + H() / 2);
  const d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 260);
  rig.look(dx / d * k * facing, dy / d * k);
}, { passive: true });

/* tap: a hop and a wink, five quick taps for a heart */
let taps = [];
/* taps: a different little reaction each time; tapping fast makes him dizzy, keep going and he gives a heart */
const TAPS = [
  { pose: 'cover', expr: 'giggle', ms: 1100, move: 'giggle', hehe: 'hehe' },
  { pose: 'hop', expr: 'wink', ms: 700, move: 'hop' },
  { pose: 'idle', expr: 'excited', ms: 900, move: 'spin' },
  { pose: 'cheer', expr: 'excited', ms: 900, move: 'boing' },
  { pose: 'wave', expr: 'happy', ms: 1100, move: 'wiggle' },
  { pose: 'shy', expr: 'shy', ms: 1100 },
  { pose: 'idle', expr: 'surprised', ms: 700, move: 'boing' },
  { pose: 'measure', expr: 'proud', ms: 1100 }
];
let lastTap = -1;
body.addEventListener('click', () => {
  if (mode === 'float' && !grab.moved) { popFloat(); return; }
  if (grab.moved || mode !== 'follow') { grab.moved = false; return; }
  if (asleep) { wakeByTap(); return; }
  const t = Date.now(); taps = taps.filter(x => t - x < 1800); taps.push(t);
  stopFidget(); clearTimeout(actTimer); lastInput = t;
  let r;
  if (taps.length >= 7) { taps = []; act('love'); hehe('♥'); return; }
  if (taps.length >= 4) r = { pose: 'idle', expr: 'dizzy', ms: 1500, move: 'wobble' };
  else { let i; do { i = Math.floor(Math.random() * TAPS.length); } while (i === lastTap); lastTap = i; r = TAPS[i]; }
  rig.set({ pose: r.pose, expr: r.expr }); move(r.move); if (r.hehe) hehe(r.hehe);
  busyUntil = t + r.ms; actTimer = setTimeout(() => { busyUntil = 0; rest(); }, r.ms);
});

/* hide and bring back */
const peek = document.createElement('button');
peek.className = 'buddy-peek'; peek.type = 'button'; peek.setAttribute('aria-label', `Bring back ${NAME}`);
document.body.append(peek);
const setAway = on => { root.classList.toggle('away', on); peek.classList.toggle('on', on); store('buddy-away', on ? '1' : ''); };
hideBtn.addEventListener('click', () => setAway(true));
peek.addEventListener('click', () => { setAway(false); act('hello'); });

/* typing on a phone: the keyboard takes the bottom of the screen, so it steps aside to the corner */
let typing = false;
const field = 'input:not([type=checkbox]):not([type=radio]):not([type=range]),textarea,select';
document.addEventListener('focusin', e => { if (e.target.matches(field)) typing = true; });
document.addEventListener('focusout', () => { typing = false; });

/* ---------- perches ---------- */
const textRect = el => {
  const r = document.createRange(); r.selectNodeContents(el);
  const rs = [...r.getClientRects()]; return rs.length ? rs[rs.length - 1] : el.getBoundingClientRect();
};
function spotFor(p, el, vh) {
  const r = el.getBoundingClientRect(); if (!r.width || !r.height) return null;
  const w = W(), h = H(), room = innerWidth - w - (innerWidth >= 1000 ? 38 : 8);
  let x, y;
  if (p.at === 'in-bl') {
    x = r.left + p.dx; y = r.bottom - h + p.dy;
    if (y + h > vh - 8) y = Math.max(r.top + 20, vh - h - 16);     // bottom below the screen: as low as the screen allows
    x = Math.max(6, Math.min(room, x));
  } else if (p.at === 'text') {
    const t = textRect(el);
    x = t.right + p.dx; y = t.bottom - h + p.dy;
    if (x > room) { x = Math.min(room, t.right - w); y = t.top - h + 8; }  // no room beside it: stand on top of the heading
  } else if (p.at === 'out-r') { x = r.right + p.dx; y = r.bottom - h + p.dy; if (x > room) return null; }
  else if (p.at === 'out-l') { x = r.left - w + p.dx; y = r.bottom - h + p.dy; if (x < 6) return null; }
  else { x = Math.min(room, r.right - w + p.dx); y = r.bottom - h + p.dy; }
  if (y < 76 || y + h > vh - 6) return null;                        // only perches fully on screen
  return { x, y };
}
let perch = null, perchEl = null;
function choose(vh) {
  const line = vh * 0.42, h = H();
  let best = null, bestScore = Infinity, cur = null;
  for (const p of PERCHES) {
    if (p.desk && phone()) continue;
    const els = p.all ? document.querySelectorAll(p.sel) : [document.querySelector(p.sel)];
    for (const el of els) {
      if (!el) continue;
      const s = spotFor(p, el, vh); if (!s) continue;
      const score = Math.abs(s.y + h / 2 - line) - (p.bonus || 0);
      if (el === perchEl) cur = { p, el, s, score };
      if (score < bestScore) { bestScore = score; best = { p, el, s, score }; }
    }
  }
  if (cur && best && best.el !== cur.el && cur.score - best.score < 60) best = cur;   // stay put unless clearly better
  return best;
}

/* ---------- motion: a damped spring toward the perch, every frame ---------- */
const pos = { x: 8, y: 0 }, vel = { x: 0, y: 0 };
let flying = false, lean = 0, first = true, lastT = performance.now(), arrivedAt = null;
let mode = 'follow', lastTY = 0;            // follow, drag, fall, run
const draw = () => { root.style.transform = `translate3d(${pos.x.toFixed(1)}px,${pos.y.toFixed(1)}px,0) rotate(${lean.toFixed(2)}deg)`; };
function frame(now) {
  requestAnimationFrame(frame);
  if (document.hidden || root.classList.contains('away')) { lastT = now; return; }
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  if (SIZE() !== rigSize) { rigSize = SIZE(); rig = createBuddy(root.querySelector('.buddy-art'), rigSize); }
  const vh = viewH();
  const c = typing && !fine ? null : choose(vh);
  perch = c ? c.p : null; perchEl = c ? c.el : null;
  const tx = c ? c.s.x : 8, ty = c ? c.s.y : vh - H() - 16;
  lastTY = ty;
  if (mode !== 'follow') { physics(dt, tx, ty); return; }
  if (first || reduce) { pos.x = tx; pos.y = ty; vel.x = vel.y = 0; first = false; }
  else {
    const k = 5.5;                                   // same spring as the CSA butterfly
    vel.x += ((tx - pos.x) * k * k - vel.x * 2 * k) * dt;
    vel.y += ((ty - pos.y) * k * k - vel.y * 2 * k) * dt;
    pos.x += vel.x * dt; pos.y += vel.y * dt;
  }
  const speed = Math.hypot(vel.x, vel.y);
  lean += ((reduce ? 0 : Math.max(-14, Math.min(14, vel.x * 0.02))) - lean) * Math.min(1, dt * 8);
  root.style.transform = `translate3d(${pos.x.toFixed(1)}px,${pos.y.toFixed(1)}px,0) rotate(${lean.toFixed(2)}deg)`;

  // travelling: a hop pose and facing the way it goes; landing: the perch's own move
  const free = !held && !asleep && Date.now() > busyUntil;
  if (!flying && speed > 140 && Math.hypot(tx - pos.x, ty - pos.y) > 30) {
    flying = true; root.classList.remove('talking'); stopFidget();
    if (free) { rig.set({ pose: 'hop', expr: 'happy', ms: 240, turn: 1 }); body.classList.add('m-glide'); }
  }
  if (flying && Math.abs(vel.x) > 60) setFace(vel.x > 0 ? 1 : -1);
  if (flying && speed < 30) {
    flying = false; body.classList.remove('m-glide'); sideOfBubble();
    setFace(perch && perch.face === 'left' ? -1 : 1);
    land(free);
  } else if (!flying && speed < 30 && perchEl && perchEl !== arrivedAt) land(free);   // drifted onto a new perch slowly
}
function land(free) {
  const fresh = perchEl !== arrivedAt; arrivedAt = perchEl;
  if (!free) return;
  if (fresh) setTimeout(() => { if (!flying && perchEl === arrivedAt) quip(perchEl); }, 500);
  if (fresh && perch && perch.arrive && Date.now() - born > 2500) {
    const a = perch.arrive; rig.set({ pose: a.pose, expr: a.expr, turn: 0 }); clearTimeout(actTimer);
    busyUntil = Date.now() + a.ms; actTimer = setTimeout(() => { busyUntil = 0; rest(); }, a.ms);
  } else rig.set({ pose: 'idle', expr: base.expr, ms: 380, turn: 0 });
}

/* ---------- picking him up: drag, drop, fall to his perch's level, then run back ---------- */
const grab = { id: null, dx: 0, dy: 0, sx: 0, sy: 0, moved: false, lx: 0, lt: 0, vx: 0 };
let run = null, legT = 0, windT = 0, landT = 0;
body.style.touchAction = 'none';
body.addEventListener('pointerup', () => setTimeout(() => body.blur(), 0));
root.querySelector('.buddy-float').addEventListener('click', () => { if (mode === 'float') popFloat(); });
body.addEventListener('pointerdown', e => {
  if (root.classList.contains('away')) return;
  grab.id = e.pointerId; grab.sx = e.clientX; grab.sy = e.clientY; grab.moved = false;
  grab.dx = e.clientX - pos.x; grab.dy = e.clientY - pos.y; grab.lx = e.clientX; grab.lt = performance.now(); grab.vx = 0;
});
addEventListener('pointermove', e => {
  if (grab.id !== e.pointerId) return;
  if (!grab.moved && Math.hypot(e.clientX - grab.sx, e.clientY - grab.sy) < 7) return;
  if (!grab.moved) {                     // picked up
    grab.moved = true; mode = 'drag'; run = null; flying = false; body.classList.remove('m-glide', 'm-run', 'm-sleep');
    if (asleep) popBubble();
    clearTimeout(bubbleT); root.classList.remove('bubbled');
    asleep = false; root.classList.remove('napping'); stopFidget(); clearTimeout(actTimer); busyUntil = Infinity; root.classList.remove('talking');
    rig.set({ pose: 'cheer', expr: 'surprised', ms: 200, turn: 0 }); move('startle');
    try { body.setPointerCapture(e.pointerId); } catch (err) {}
    setTimeout(() => { if (mode === 'drag') rig.set({ pose: 'cheer', expr: Math.random() < .5 ? 'excited' : 'giggle' }); }, 900);
  }
  const t = performance.now(), dt = Math.max(1, t - grab.lt);
  grab.vx = grab.vx * 0.7 + ((e.clientX - grab.lx) / dt * 1000) * 0.3; grab.lx = e.clientX; grab.lt = t;
  pos.x = e.clientX - grab.dx; pos.y = e.clientY - grab.dy;
}, { passive: true });
const drop = e => {
  if (grab.id !== e.pointerId) return;
  grab.id = null;
  if (!grab.moved) return;
  vel.x = grab.vx * 0.25; vel.y = 0;
  if (pos.y > Math.min(lastTY, viewH() - H() - 6) + 4) {   // dropped below his level: he hops back up instead of falling
    mode = 'follow'; busyUntil = 0; rig.set({ pose: 'hop', expr: 'happy', ms: 200 }); return;
  }
  mode = 'fall'; rig.set({ pose: 'hop', expr: 'surprised', ms: 200 });
};
addEventListener('pointerup', drop); addEventListener('pointercancel', drop);

function physics(dt, tx, ty) {
  const h = H(), floor = Math.min(ty, viewH() - h - 6);
  if (mode === 'drag') {
    const swing = Math.max(-28, Math.min(28, -grab.vx * 0.03));
    lean += (swing - lean) * Math.min(1, dt * 10); grab.vx *= Math.pow(0.02, dt);
  } else if (mode === 'fall') {
    vel.y += 2600 * dt; vel.x *= Math.pow(0.4, dt);
    pos.x += vel.x * dt; pos.y += vel.y * dt; lean += (0 - lean) * Math.min(1, dt * 6);
    if (pos.y >= floor) {                // landed on the perch's level
      pos.y = floor; const hard = vel.y > 900; vel.x = vel.y = 0; lean = 0;
      move('boing'); rig.set({ pose: 'idle', expr: hard ? 'dizzy' : 'oops', ms: 160, turn: 0 });
      mode = 'run'; run = { phase: 'shake', until: performance.now() + (hard ? 900 : 550), style: pickRun() };
    } else if (pos.y < floor - 400 && vel.y < 0) pos.y = floor - 400;
  } else if (mode === 'run') runStep(dt, tx, floor);
  else if (mode === 'float') {                // drifting around inside the bubble, near his spot
    const t = (performance.now() - floatT0) / 1000, w = W(), vh = viewH();
    const fx = Math.max(10, Math.min(innerWidth - w - 40, tx + Math.sin(t * 0.21) * 150 + Math.sin(t * 0.07) * 60));
    const fy = Math.max(84, Math.min(vh - h - 40, ty - 80 + Math.sin(t * 0.33) * 34));
    const k = 1.4;
    vel.x += ((fx - pos.x) * k * k - vel.x * 2 * k) * dt; vel.y += ((fy - pos.y) * k * k - vel.y * 2 * k) * dt;
    pos.x += vel.x * dt; pos.y += vel.y * dt;
    lean += (Math.sin(t * 0.9) * 6 + vel.x * 0.02 - lean) * Math.min(1, dt * 3);
  }
  draw();
}
function pickRun() { const r = Math.random(); return r < 0.3 ? 'dash' : r < 0.55 ? 'trip' : 'jog'; }
function runStep(dt, tx, floor) {
  const now = performance.now();
  pos.y += (floor - pos.y) * Math.min(1, dt * 10);           // stay on the line if the page scrolls
  if (run.phase === 'shake') {
    if (now < run.until) return;
    run.phase = 'go'; run.start = pos.x; setFace(tx >= pos.x ? 1 : -1);
    rig.set({ pose: 'runA', expr: run.style === 'dash' ? 'excited' : 'happy', ms: 220, turn: 1 });
    body.classList.add(run.style === 'dash' ? 'm-dash' : 'm-run');
    if (run.style === 'trip') run.tripAt = Math.abs(tx - pos.x) > 120 ? 0.45 + Math.random() * 0.2 : 2;
  }
  if (run.phase === 'trip') {
    if (now < run.until) return;
    run.phase = 'go'; rig.set({ pose: 'runA', expr: 'happy', ms: 220, turn: 1 }); body.classList.add('m-run');
  }
  if (run.phase !== 'go') return;
  const dx = tx - pos.x, dir = Math.sign(dx) || 1;
  const speed = run.style === 'dash' ? 760 : 300;
  setFace(dir);
  lean += (dir * (run.style === 'dash' ? 10 : 3) - lean) * Math.min(1, dt * 8);
  // legs: alternate two poses for a little run cycle
  const stride = run.style === 'dash' ? 0.1 : 0.16;
  legT += dt; if (legT > stride) { legT = 0; rig.set({ pose: rig.pose === 'runA' ? 'runB' : 'runA', ms: stride * 1000 - 10 }); }
  if (run.style === 'dash') { windT += dt; if (windT > 0.06) { windT = 0; wind(dir); } }
  const step = Math.min(Math.abs(dx), speed * dt);
  pos.x += dir * step;
  const total = Math.abs(tx - run.start) || 1, done = 1 - Math.abs(tx - pos.x) / total;
  if (run.style === 'trip' && done > run.tripAt) {          // trips, laughs it off
    run.tripAt = 2; run.phase = 'trip'; run.until = now + 1300;
    body.classList.remove('m-run'); move('trip'); rig.set({ pose: 'splat', expr: 'oops', ms: 300, turn: 1 });
    setTimeout(() => { if (mode === 'run') rig.set({ expr: 'dizzy' }); }, 420);
    setTimeout(() => { if (mode === 'run') { rig.set({ pose: 'cover', expr: 'giggle', ms: 360, turn: 0.4 }); move('giggle'); hehe('hehe'); } }, 900);
    run.until = now + 1700;
    return;
  }
  if (Math.abs(tx - pos.x) < 3) {                          // home
    body.classList.remove('m-run', 'm-dash'); mode = 'follow'; run = null; vel.x = vel.y = 0; lean = 0;
    busyUntil = 0; arrivedAt = null; flying = false;
    setFace(perch && perch.face === 'left' ? -1 : 1);
    rig.set({ pose: 'cheer', expr: 'proud', ms: 300, turn: 0 }); move('hop');
    clearTimeout(actTimer); actTimer = setTimeout(rest, 700);
  }
}
/* swirly wind puffs behind him on a dash */
function wind(dir) {
  if (reduce) return;
  const w = document.createElement('span'); w.className = 'buddy-wind';
  const x = pos.x + (dir > 0 ? -10 : W() - 18) + (Math.random() * 10 - 5), y = pos.y + H() * (0.35 + Math.random() * 0.4);
  w.style.left = x + 'px'; w.style.top = y + 'px'; w.style.setProperty('--d', -dir);
  w.innerHTML = '<svg viewBox="0 0 40 20" width="34" height="17"><path d="M2 12c8 0 12-9 20-9 6 0 8 5 4 7-3 2-6-1-4-3M6 17h16" fill="none" stroke="#B58CDD" stroke-width="2.4" stroke-linecap="round"/></svg>';
  if (dir < 0) w.firstChild.style.transform = 'scaleX(-1)';
  document.body.append(w); setTimeout(() => w.remove(), 600);
}

/* events from the rest of the site */
document.addEventListener('buddy', e => { e.detail === 'done' ? done() : act(e.detail); });

if (store('buddy-away')) { root.classList.add('away'); peek.classList.add('on'); }
else setTimeout(() => act('hello'), 3000);
requestAnimationFrame(frame);
