/* Nong Tape: the Apex Slim buddy.
   It glides to a spot beside whatever the visitor is looking at (the flask, the results machine,
   the 3D body) and waits in the bottom-left corner when nothing nearby needs it.
   Other scripts tell it what happened with document.dispatchEvent(new CustomEvent('buddy', { detail: 'formula' })).
   Rules that keep it cute and out of the way:
   - it only talks on big moments, never in the first 3 seconds, and at most once every 15 seconds
   - each line is said once per visit; the rest of the time it reacts with a face and a move
   - it never comments on weight, BMI or waist numbers
   - its spots sit in empty space beside the content, and in the corner it tucks away while you scroll on a phone or type */
import { createBuddy } from './buddy-art.js?v=2';

const NAME = 'Nong Tape';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const phone = () => innerWidth < 760;
/* on touch screens it floats in the viewport (position fixed) so scrolling never leaves it behind;
   with a mouse it stands on the page next to its spot */
const floating = () => !fine;
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
  photo:    { pose: 'cover', expr: 'shy', ms: 2600, line: "I'm not looking. Your photo never leaves this device." },
  oops:     { pose: 'idle', expr: 'oops', ms: 2200 },
  meals:    { pose: 'hop', expr: 'happy', ms: 600, move: 'hop' },
  sent:     { pose: 'heart', expr: 'love', ms: 3200, move: 'bob', line: 'See you at Apex Slim.' }
};

/* spots: where it stands for each part of the page. at: in-bl = inside the bottom-left corner,
   out-r / out-l = beside the element with bottoms lined up, under-r = just below the right end.
   face: which way it looks. arrive: what it does when it gets there. phone: also used on phones. */
const SPOTS = [
  { sel: '.flask-box', at: 'in-bl', dx: 10, dy: -4, face: 'right', phone: true },
  { sel: '#treatments .legend', at: 'end', dx: 0, dy: -6, face: 'left', arrive: { pose: 'point', expr: 'curious', ms: 1600 } },
  { sel: '#rx-stage', at: 'in-bl', dx: 22, dy: -14, face: 'right', phone: true, arrive: { pose: 'idle', expr: 'curious', ms: 1200 } },
  { sel: '#play .btn', at: 'out-r', dx: 18, dy: 6, face: 'left', arrive: { pose: 'point', expr: 'happy', ms: 1400 } },
  { sel: '#request', at: 'out-l', dx: -36, dy: 0, face: 'right', arrive: { pose: 'wave', expr: 'happy', ms: 1400 } },
  { sel: '#bc-canvas', at: 'in-bl', dx: 14, dy: -10, face: 'right', phone: true, arrive: { pose: 'measure', expr: 'thinking', ms: 1800 } },
  { sel: '.gp-view', at: 'in-bl', dx: 14, dy: -10, face: 'right', phone: true },
  { sel: '#ml-next', at: 'out-l', dx: -14, dy: 8, face: 'right', arrive: { pose: 'point', expr: 'happy', ms: 1400 } }
];

/* ---------- build ---------- */
const root = document.createElement('div');
root.className = 'buddy corner';
root.innerHTML = `<div class="buddy-turn"><button class="buddy-body" type="button" aria-label="${NAME}, tap to say hi"><span class="buddy-art"></span></button></div>
  <p class="buddy-say" aria-hidden="true"></p>
  <button class="buddy-x" type="button" aria-label="Hide ${NAME}">×</button>`;
document.body.append(root);
const turn = root.querySelector('.buddy-turn'), body = root.querySelector('.buddy-body'), bubble = root.querySelector('.buddy-say'), hideBtn = root.querySelector('.buddy-x');
const SIZE = () => phone() ? 66 : 92;
let rigSize = SIZE(), rig = createBuddy(root.querySelector('.buddy-art'), rigSize);
const W = () => SIZE(), H = () => SIZE() * 200 / 230;

let base = { pose: 'idle', expr: 'happy' };
let actTimer = 0, upTimer = 0, sayTimer = 0, lastSay = 0, lastInput = Date.now(), asleep = false, held = false, facing = 1;
const born = Date.now();

const move = m => { if (reduce || !m) return; body.classList.remove('m-hop', 'm-wiggle', 'm-bob'); void body.offsetWidth; body.classList.add('m-' + m); };
const setFace = dir => { facing = dir; turn.classList.toggle('flip', dir < 0); };
const rest = () => { if (!held && !asleep) rig.set(base); };

function act(name) {
  const e = EVENTS[name]; if (!e || root.classList.contains('away')) return;
  if (asleep) wake();
  clearTimeout(actTimer);
  rig.set({ pose: e.pose, expr: e.expr }); move(e.move);
  held = e.ms === 0;                       // 0 means hold this until another event or 'done'
  rise(held ? 0 : e.ms + (e.line ? 2400 : 300));
  if (!held) actTimer = setTimeout(rest, e.ms);
  if (e.line) say(name, e.line);
}
function say(key, text) {
  const t = Date.now();
  if (said.has(key) || t - born < 2900 || t - lastSay < 15000) return;
  remember(key); lastSay = t;
  bubble.textContent = text; sideOfBubble();
  root.classList.add('talking');
  clearTimeout(sayTimer); sayTimer = setTimeout(() => root.classList.remove('talking'), 3800);
}
function done() { held = false; clearTimeout(actTimer); rig.set(base); rise(400); }
/* in the corner it rests low with only its face showing, and stands up when something happens */
const restXY = mode => ({ x: 6, y: innerHeight - (mode === 'up' ? H() + 8 : mode === 'low' ? H() * 0.25 : H() * 0.55) });
let typing = false;
function floatRest(mode, ms) { const p = restXY(typing ? 'low' : mode); place(p.x, p.y, ms); }
function rise(ms) {
  clearTimeout(upTimer);
  if (floating()) {
    if (spot) return;
    floatRest('up', 320); if (ms) upTimer = setTimeout(() => { if (!spot) floatRest('rest', 450); }, ms);
    return;
  }
  root.classList.add('up'); if (ms) upTimer = setTimeout(() => root.classList.remove('up'), ms);
}

/* blink by closing the eyes, every few seconds */
(function blink() { setTimeout(() => { if (!held && !asleep) rig.blink(); blink(); }, 2600 + Math.random() * 3400); })();

/* dozes off after 45 seconds with nothing happening */
function sleep() { asleep = true; root.classList.remove('up'); if (floating() && !spot) floatRest('rest', 500); rig.set({ pose: 'sleep', expr: 'sleepy', ms: 900 }); body.classList.add('m-sleep'); }
function wake() {
  asleep = false; body.classList.remove('m-sleep');
  rig.set({ pose: 'idle', expr: 'surprised', ms: 300 });
  setTimeout(() => { if (!asleep && !held && rig.expr === 'surprised') rig.set(base); }, 600);
}
const poke = () => { lastInput = Date.now(); if (asleep) wake(); };
['pointerdown', 'keydown', 'scroll'].forEach(t => addEventListener(t, poke, { passive: true }));
setInterval(() => { if (!asleep && !held && !gliding && Date.now() - lastInput > 45000) sleep(); }, 3000);

/* eyes follow the mouse on desktop, smoothly */
if (fine) addEventListener('pointermove', e => {
  lastInput = Date.now(); if (asleep) return;
  const r = body.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
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
const setAway = on => { if (on) toCorner(true); root.classList.toggle('away', on); peek.classList.toggle('on', on); store('buddy-away', on ? '1' : ''); if (!on) { toCorner(true); pick(); } };
hideBtn.addEventListener('click', () => setAway(true));
peek.addEventListener('click', () => { setAway(false); act('hello'); });

/* ---------- spots and gliding ---------- */
let spot = null, gliding = false, glideEnd = 0;
const pos = { x: 0, y: 0 };               // document coordinates while on a spot
const place = (x, y, ms) => {
  pos.x = x; pos.y = y;
  root.style.transition = ms ? `transform ${ms}ms cubic-bezier(.45,.05,.25,1)` : 'none';
  root.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
};
function target(s) {
  const el = document.querySelector(s.sel); if (!el || !el.offsetParent) return null;
  const r = el.getBoundingClientRect(); if (!r.width) return null;
  const w = W(), h = H();
  let x, y;
  if (s.at === 'in-bl') {                  // bottom-left inside; when the bottom is below the screen, as low as the screen allows
    x = r.left + s.dx; y = r.bottom - h + s.dy;
    if (y + h > innerHeight - 8) y = Math.max(r.top + 20, innerHeight - h - 16);
  }
  else if (s.at === 'out-r') { x = r.right + s.dx; y = r.bottom - h + s.dy; }
  else if (s.at === 'out-l') { x = r.left - w + s.dx; y = r.bottom - h + s.dy; }
  else { x = r.right - w + s.dx; y = r.bottom - h + s.dy; }      // 'end': standing on the right end of a row
  const room = innerWidth - w - (innerWidth >= 1000 ? 38 : 8);
  if (x < 6 || x > room) { if (s.at === 'in-bl') x = Math.max(6, Math.min(room, x)); else return null; }
  const visible = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 70)) / Math.min(r.height, innerHeight - 70);
  const onScreen = y > 76 && y + h < innerHeight - 4;
  return { x: x + scrollX, y: y + scrollY, visible, onScreen };
}
function pick() {
  if (root.classList.contains('away')) return;
  let best = null, bt = null;
  for (const s of SPOTS) {
    if (phone() && !s.phone) continue;
    const t = target(s);
    if (t && t.onScreen && t.visible > 0.5 && (!bt || t.visible > bt.visible)) { best = s; bt = t; }
  }
  if (best && best === spot) {
    if (floating() && !gliding && Math.hypot(bt.x - scrollX - pos.x, bt.y - scrollY - pos.y) > 4) go(best, bt);
    return;
  }
  if (best) go(best, bt); else if (spot) toCorner();
}
let arrivedAt = null;
function go(s, t) {
  if (floating()) {
    const r = root.getBoundingClientRect(), tx = t.x - scrollX, ty = t.y - scrollY;
    root.classList.remove('corner', 'up', 'tucked'); root.classList.add('float');
    place(r.left, r.top, 0); void root.offsetWidth;
    const dist = Math.hypot(tx - r.left, ty - r.top), ms = reduce ? 0 : Math.max(420, Math.min(1000, dist * 1.1));
    spot = s; gliding = true; clearTimeout(glideEnd); clearTimeout(upTimer);
    if (Math.abs(tx - r.left) > 8) setFace(tx >= r.left ? 1 : -1);
    if (!held && !asleep && ms && dist > 40) { rig.set({ pose: 'hop', expr: 'happy', ms: 260 }); body.classList.add('m-glide'); }
    if (ms) root.classList.remove('talking');
    place(tx, ty, ms);
    glideEnd = setTimeout(() => arrive(s), ms + 30);
    return;
  }
  const r = root.getBoundingClientRect();
  const wasCorner = root.classList.contains('corner');
  const seen = r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && !wasCorner;
  root.classList.remove('corner', 'up', 'tucked'); root.classList.add('spot');
  let sx = r.left + scrollX, sy = r.top + scrollY;
  if (!seen && !wasCorner) {               // its old spot scrolled away: come in from the nearer side
    sx = t.x - scrollX < innerWidth / 2 ? scrollX - W() - 10 : scrollX + innerWidth + 10; sy = t.y;
  }
  place(sx, sy, 0); void root.offsetWidth;
  const dist = Math.hypot(t.x - sx, t.y - sy), ms = reduce ? 0 : Math.max(520, Math.min(1300, dist * 1.1));
  spot = s; gliding = true; clearTimeout(glideEnd);
  setFace(t.x >= sx ? 1 : -1);
  if (!held && !asleep && ms) { rig.set({ pose: 'hop', expr: 'happy', ms: 260 }); body.classList.add('m-glide'); }
  if (ms) root.classList.remove('talking');
  place(t.x, t.y, ms);
  glideEnd = setTimeout(() => arrive(s), ms + 30);
}
const sideOfBubble = () => { const r = root.getBoundingClientRect(); root.classList.toggle('say-left', r.left + W() + 230 > innerWidth); };
function arrive(s) {
  gliding = false; body.classList.remove('m-glide'); sideOfBubble();
  setFace(s.face === 'left' ? -1 : 1);
  if (held || asleep) return;
  const fresh = arrivedAt !== s; arrivedAt = s;
  if (!fresh) { if (!held && !asleep && rig.pose === 'hop') rig.set({ pose: 'idle', expr: base.expr, ms: 380 }); return; }
  if (s.arrive && Date.now() - born > 2500) {
    const a = s.arrive; rig.set({ pose: a.pose, expr: a.expr }); clearTimeout(actTimer); actTimer = setTimeout(rest, a.ms);
  } else rig.set({ pose: 'idle', expr: base.expr, ms: 380 });
}
function toCorner(instant) {
  spot = null; arrivedAt = null; gliding = false; clearTimeout(glideEnd); body.classList.remove('m-glide');
  if (floating()) {
    root.classList.remove('corner', 'spot'); root.classList.add('float');
    const r = root.getBoundingClientRect();
    if (!instant && !reduce && Math.abs(r.left - restXY('rest').x) > 8) setFace(-1);
    floatRest('rest', instant || reduce ? 0 : 700);
    setTimeout(() => { if (!spot) setFace(1); }, instant ? 0 : 720);
    if (!held && !asleep) rig.set(base);
    return;
  }
  const wasSpot = root.classList.contains('spot');
  root.classList.remove('spot'); root.classList.add('corner');
  root.style.transition = ''; root.style.transform = '';
  if (wasSpot && !instant && !reduce) {      // pop up from the bottom edge rather than jump
    root.classList.add('enter'); void root.offsetWidth; root.classList.remove('enter');
  }
  setFace(1); if (!held && !asleep) rig.set(base);
}
/* when it's on a spot, keep it there as the layout shifts */
function settle() {
  if (floating()) { if (!spot && !gliding) floatRest('rest', 0); return; }
  if (!spot || gliding) return;
  const t = target(spot); if (t) place(t.x, t.y, 0);
}

let scrollT = 0, pickT = 0;
addEventListener('scroll', () => {
  if (!fine && root.classList.contains('corner')) {
    root.classList.add('tucked'); clearTimeout(scrollT);
    scrollT = setTimeout(() => root.classList.remove('tucked'), 900);
  }
  clearTimeout(pickT); pickT = setTimeout(pick, floating() ? 220 : 320);
}, { passive: true });
addEventListener('resize', () => {
  clearTimeout(pickT);
  pickT = setTimeout(() => { const n = SIZE(); if (n !== rigSize) { rigSize = n; rig = createBuddy(root.querySelector('.buddy-art'), n); } settle(); pick(); }, 250);
});
new ResizeObserver(settle).observe(document.body);
const field = 'input:not([type=checkbox]):not([type=radio]):not([type=range]),textarea,select';
document.addEventListener('focusin', e => {
  if (!e.target.matches(field)) return;
  if (floating()) { typing = true; if (!spot) floatRest('rest', 300); }
  else if (root.classList.contains('corner')) root.classList.add('typing');
});
document.addEventListener('focusout', () => {
  root.classList.remove('typing');
  if (typing) { typing = false; if (floating() && !spot) floatRest('rest', 300); }
});

/* events from the rest of the site */
document.addEventListener('buddy', e => { e.detail === 'done' ? done() : act(e.detail); });

if (floating()) { root.classList.remove('corner'); root.classList.add('float'); floatRest('rest', 0); }
if (store('buddy-away')) { root.classList.add('away'); peek.classList.add('on'); }
else {
  setTimeout(pick, 400);
  setTimeout(() => act('hello'), 3000);
}
