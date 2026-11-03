/* Nong Tape: the Apex Slim buddy in the bottom-left corner.
   Other scripts tell it what happened with document.dispatchEvent(new CustomEvent('buddy', { detail: 'formula' })).
   Rules that keep it cute and out of the way:
   - it only talks on big moments, never in the first 3 seconds, and at most once every 15 seconds
   - each line is said once per visit; the rest of the time it reacts with a face and a move, no words
   - it never comments on weight, BMI or waist numbers
   - it tucks away while you scroll on a phone and while you type, and the x hides it until you bring it back */
import { buddySVG } from './buddy-art.js?v=1';

const NAME = 'Nong Tape';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const store = (k, v) => { try { return v === undefined ? localStorage.getItem(k) : localStorage.setItem(k, v); } catch (e) { return null; } };
const said = new Set((() => { try { return JSON.parse(sessionStorage.getItem('buddy-said') || '[]'); } catch (e) { return []; } })());
const remember = k => { said.add(k); try { sessionStorage.setItem('buddy-said', JSON.stringify([...said])); } catch (e) {} };

/* what each event does: pose, face, how long, an optional line, and a CSS move */
const EVENTS = {
  hello:    { pose: 'wave', expr: 'happy', ms: 2200, move: 'wiggle', line: `Hi, I'm ${NAME}.` },
  tap:      { pose: 'hop', expr: 'wink', ms: 700, move: 'hop' },
  love:     { pose: 'heart', expr: 'love', ms: 1800, move: 'bob' },
  section:  { pose: 'idle', expr: 'curious', ms: 1200 },
  mixing:   { pose: 'think', expr: 'thinking', ms: 0 },
  formula:  { pose: 'flask', expr: 'excited', ms: 3000, move: 'hop', line: 'Your formula is ready.' },
  measure:  { pose: 'measure', expr: 'thinking', ms: 1600 },
  goal:     { pose: 'idle', expr: 'proud', ms: 1400 },
  scanning: { pose: 'think', expr: 'thinking', ms: 0 },
  reveal:   { pose: 'cheer', expr: 'surprised', ms: 1800, move: 'hop' },
  photo:    { pose: 'cover', expr: 'shy', ms: 2600, line: "I'm not looking. Your photo never leaves this device." },
  oops:     { pose: 'idle', expr: 'oops', ms: 2200 },
  meals:    { pose: 'hop', expr: 'happy', ms: 600, move: 'hop' },
  sent:     { pose: 'heart', expr: 'love', ms: 3200, move: 'bob', line: 'See you at Apex Slim.' }
};

const root = document.createElement('div');
root.className = 'buddy';
root.innerHTML = `<button class="buddy-body" type="button" aria-label="${NAME}, tap to say hi"></button>
  <p class="buddy-say" aria-hidden="true"></p>
  <button class="buddy-x" type="button" aria-label="Hide ${NAME}">×</button>`;
document.body.append(root);
const body = root.querySelector('.buddy-body'), bubble = root.querySelector('.buddy-say'), hideBtn = root.querySelector('.buddy-x');

let base = { pose: 'idle', expr: 'happy' }, now = { ...base }, look = [0, 0];
let actTimer = 0, upTimer = 0, sayTimer = 0, lastSay = 0, lastInput = Date.now(), asleep = false, held = false;
const born = Date.now();

const draw = () => { body.innerHTML = buddySVG({ ...now, look, size: 92 }); body.dataset.pose = now.pose; };
const move = m => { if (reduce || !m) return; body.classList.remove('m-hop', 'm-wiggle', 'm-bob'); void body.offsetWidth; body.classList.add('m-' + m); };

function act(name) {
  const e = EVENTS[name]; if (!e || root.classList.contains('away')) return;
  if (asleep) wake();
  clearTimeout(actTimer);
  now = { pose: e.pose, expr: e.expr }; draw(); move(e.move);
  held = e.ms === 0;                       // 0 means hold this until another event or 'done'
  rise(held ? 0 : e.ms + (e.line ? 2400 : 300));
  if (!held) actTimer = setTimeout(() => { now = { ...base }; draw(); }, e.ms);
  if (e.line) say(name, e.line);
}
function say(key, text) {
  const t = Date.now();
  if (said.has(key) || t - born < 2900 || t - lastSay < 15000) return;
  remember(key); lastSay = t;
  bubble.textContent = text; root.classList.add('talking');
  clearTimeout(sayTimer); sayTimer = setTimeout(() => root.classList.remove('talking'), 3800);
}
function done() { held = false; clearTimeout(actTimer); now = { ...base }; draw(); rise(400); }
/* it rests low with only its face showing, and stands up when something happens */
function rise(ms) { clearTimeout(upTimer); root.classList.add('up'); if (ms) upTimer = setTimeout(() => root.classList.remove('up'), ms); }

/* blink every few seconds, but only when resting */
(function blink() {
  setTimeout(() => {
    if (!held && !asleep && now.expr === 'happy' && now.pose === 'idle') {
      now.expr = 'blink'; draw();
      setTimeout(() => { if (now.expr === 'blink') { now.expr = 'happy'; draw(); } }, 140);
    }
    blink();
  }, 2800 + Math.random() * 3200);
})();

/* dozes off after 45 seconds with nothing happening */
const sleep = () => { asleep = true; root.classList.remove('up'); now = { pose: 'sleep', expr: 'sleepy' }; draw(); body.classList.add('m-sleep'); };
function wake() {
  asleep = false; body.classList.remove('m-sleep');
  now = { pose: 'idle', expr: 'surprised' }; draw();
  setTimeout(() => { if (!asleep && now.expr === 'surprised' && !held) { now = { ...base }; draw(); } }, 500);
}
const poke = () => { lastInput = Date.now(); if (asleep) wake(); };
['pointerdown', 'keydown', 'scroll'].forEach(t => addEventListener(t, poke, { passive: true }));
setInterval(() => { if (!asleep && !held && Date.now() - lastInput > 45000) sleep(); }, 3000);

/* eyes follow the mouse on desktop */
if (fine && !reduce) {
  let raf = 0;
  addEventListener('pointermove', e => {
    lastInput = Date.now();
    if (raf || asleep) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const r = body.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 260);
      const nl = [+(dx / d * k).toFixed(1), +(dy / d * k).toFixed(1)];
      if (nl[0] !== look[0] || nl[1] !== look[1]) { look = nl; draw(); }
    });
  }, { passive: true });
}

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

/* get out of the way: tuck while scrolling on a phone, and while typing */
let scrollT = 0;
addEventListener('scroll', () => {
  if (fine) return;
  root.classList.add('tucked'); clearTimeout(scrollT);
  scrollT = setTimeout(() => root.classList.remove('tucked'), 900);
}, { passive: true });
document.addEventListener('focusin', e => { if (e.target.matches('input:not([type=checkbox]):not([type=radio]):not([type=range]),textarea,select')) root.classList.add('typing'); });
document.addEventListener('focusout', () => root.classList.remove('typing'));

/* look at each new section once, no words */
const seen = new Set();
const io = new IntersectionObserver(es => es.forEach(en => {
  if (!en.isIntersecting || seen.has(en.target)) return;
  seen.add(en.target);
  if (Date.now() - born > 2500 && !held) act('section');
}), { threshold: 0.4 });
document.querySelectorAll('main section[id]').forEach(s => io.observe(s));

/* events from the rest of the site */
document.addEventListener('buddy', e => { e.detail === 'done' ? done() : act(e.detail); });

draw();
if (store('buddy-away')) setAway(true);
else setTimeout(() => act('hello'), 3000);
