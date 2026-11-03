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
import { createBuddy } from './buddy-art.js?v=2';

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
  <p class="buddy-say" aria-hidden="true"></p>
  <button class="buddy-x" type="button" aria-label="Hide ${NAME}">×</button>`;
document.body.append(root);
const turn = root.querySelector('.buddy-turn'), body = root.querySelector('.buddy-body'), bubble = root.querySelector('.buddy-say'), hideBtn = root.querySelector('.buddy-x');
const SIZE = () => phone() ? 66 : 92;
let rigSize = SIZE(), rig = createBuddy(root.querySelector('.buddy-art'), rigSize);
const W = () => SIZE(), H = () => SIZE() * 200 / 230;
const viewH = () => window.visualViewport ? visualViewport.height : innerHeight;

let base = { pose: 'idle', expr: 'happy' };
let actTimer = 0, sayTimer = 0, lastSay = 0, lastInput = Date.now(), asleep = false, held = false, facing = 1;
const born = Date.now();

const move = m => { if (reduce || !m) return; body.classList.remove('m-hop', 'm-wiggle', 'm-bob'); void body.offsetWidth; body.classList.add('m-' + m); };
const setFace = dir => { if (dir === facing) return; facing = dir; turn.classList.toggle('flip', dir < 0); };
const rest = () => { if (!held && !asleep && !flying) rig.set(base); };

function act(name) {
  const e = EVENTS[name]; if (!e || root.classList.contains('away')) return;
  if (asleep) wake();
  clearTimeout(actTimer);
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
function sleep() { asleep = true; rig.set({ pose: 'sleep', expr: 'sleepy', ms: 900 }); body.classList.add('m-sleep'); }
function wake() {
  asleep = false; body.classList.remove('m-sleep');
  rig.set({ pose: 'idle', expr: 'surprised', ms: 300 });
  setTimeout(() => { if (!asleep && !held && rig.expr === 'surprised') rig.set(base); }, 600);
}
const poke = () => { lastInput = Date.now(); if (asleep) wake(); };
['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(t => addEventListener(t, poke, { passive: true }));
setInterval(() => { if (!asleep && !held && !flying && Date.now() - lastInput > 45000) sleep(); }, 3000);

/* eyes follow the mouse on desktop, smoothly */
if (fine) addEventListener('pointermove', e => {
  lastInput = Date.now(); if (asleep) return;
  const dx = e.clientX - (pos.x + W() / 2), dy = e.clientY - (pos.y + H() / 2);
  const d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 260);
  rig.look(dx / d * k * facing, dy / d * k);
}, { passive: true });

/* tap: a hop and a wink, five quick taps for a heart */
let taps = [];
body.addEventListener('click', () => {
  const t = Date.now(); taps = taps.filter(x => t - x < 2000); taps.push(t);
  if (taps.length >= 5) { taps = []; act('love'); } else act('tap');
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
function frame(now) {
  requestAnimationFrame(frame);
  if (document.hidden || root.classList.contains('away')) { lastT = now; return; }
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  if (SIZE() !== rigSize) { rigSize = SIZE(); rig = createBuddy(root.querySelector('.buddy-art'), rigSize); }
  const vh = viewH();
  const c = typing && !fine ? null : choose(vh);
  perch = c ? c.p : null; perchEl = c ? c.el : null;
  const tx = c ? c.s.x : 8, ty = c ? c.s.y : vh - H() - 16;
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
    flying = true; root.classList.remove('talking');
    if (free) { rig.set({ pose: 'hop', expr: 'happy', ms: 240 }); body.classList.add('m-glide'); }
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
    const a = perch.arrive; rig.set({ pose: a.pose, expr: a.expr }); clearTimeout(actTimer);
    busyUntil = Date.now() + a.ms; actTimer = setTimeout(() => { busyUntil = 0; rest(); }, a.ms);
  } else rig.set({ pose: 'idle', expr: base.expr, ms: 380 });
}

/* events from the rest of the site */
document.addEventListener('buddy', e => { e.detail === 'done' ? done() : act(e.detail); });

if (store('buddy-away')) { root.classList.add('away'); peek.classList.add('on'); }
else setTimeout(() => act('hello'), 3000);
requestAnimationFrame(frame);
