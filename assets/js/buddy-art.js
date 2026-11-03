/* Tape Buddy art. The parts are shared by buddySVG (one still drawing, used by the expression sheet)
   and createBuddy (the live character on the site, which tweens between poses instead of swapping them). */
const P = { plumD: '#3A175A', plum: '#6A388C', plumL: '#B58CDD', face: '#F6F0FB', ring: '#C9B3DD', ink: '#2A0F40',
  tape: '#F6E3A6', tapeD: '#C9A24E', metal: '#D9DCE3', blush: '#F59AB5', mint: '#8DF0C6' };

export const EXPRESSIONS = ['happy', 'blink', 'wink', 'excited', 'proud', 'curious', 'thinking', 'surprised', 'shy', 'love', 'sleepy', 'oops', 'giggle', 'dizzy'];
export const POSES = ['idle', 'wave', 'point', 'measure', 'cheer', 'cover', 'hop', 'think', 'heart', 'shy', 'flask', 'sleep'];

const TILT = { think: -8, curious: 10, sleep: 14, shy: -6, runA: 7, runB: 4, splat: 84 };
const TAPES = {
  idle: 'M160 104c18 2 26 16 22 32', wave: 'M160 104c18-6 22-26 16-44', point: 'M160 104h56', measure: 'M160 104h120',
  cheer: 'M160 100c16-10 20-30 14-48', cover: 'M160 100c-6-20-34-14-44-4', hop: 'M160 104c18 2 24 18 18 34',
  think: 'M160 106c14 14 2 30-22 24', heart: 'M160 104c20-6 36-30 20-38c-12-6-18 6-18 12c0-6-6-18-18-12',
  runA: 'M160 106c14 4 22 12 26 24', runB: 'M160 104c12 10 6 26-6 32', splat: 'M160 98c10-18 12-40 6-60',
  sleep: 'M160 108c16 6 18 22 6 32', shy: 'M160 104c12 8 8 26-8 30', curious: 'M160 104c18 0 26 12 22 28', flask: 'M160 104c16 4 20 18 14 30'
};
const LEFTS = {
  idle: 'M40 108q-14 10-12 26', wave: 'M40 108q-14 10-12 26', point: 'M40 108q-14 10-12 26', measure: 'M40 104q-24 0-28 4',
  cheer: 'M40 100q-16-16-12-40', cover: 'M42 100q8-20 34-12', hop: 'M40 106q-16 2-20 16', think: 'M40 108q-14 10-12 26',
  runA: 'M40 108q-18 4-24 16', runB: 'M40 108q-4 14 6 24', splat: 'M42 100q-6-24 2-52',
  heart: 'M40 108q-14 10-12 26', sleep: 'M40 112q-12 10-8 22', shy: 'M42 108q12 18 34 18', curious: 'M40 108q-14 10-12 26', flask: 'M40 110q-6 18 14 26'
};

/* ---------- path maths: every arm becomes 3 cubic segments so any pose can blend into any other ---------- */
function toCubics(d) {
  let x = 0, y = 0; const segs = [];
  let start = [0, 0];
  for (const m of d.matchAll(/([MmCcQqHh])([^MmCcQqHh]*)/g)) {
    const n = m[2].trim().split(/[\s,]+|(?=-)/).filter(Boolean).map(Number), c = m[1];
    if (c === 'M') { x = n[0]; y = n[1]; start = [x, y]; }
    else if (c === 'h') { const ex = x + n[0]; segs.push([x + n[0] / 3, y, x + 2 * n[0] / 3, y, ex, y]); x = ex; }
    else if (c === 'c') for (let i = 0; i + 6 <= n.length; i += 6) { segs.push([x + n[i], y + n[i + 1], x + n[i + 2], y + n[i + 3], x + n[i + 4], y + n[i + 5]]); x += n[i + 4]; y += n[i + 5]; }
    else if (c === 'q') for (let i = 0; i + 4 <= n.length; i += 4) {
      const qx = x + n[i], qy = y + n[i + 1], ex = x + n[i + 2], ey = y + n[i + 3];
      segs.push([x + 2 / 3 * (qx - x), y + 2 / 3 * (qy - y), ex + 2 / 3 * (qx - ex), ey + 2 / 3 * (qy - ey), ex, ey]); x = ex; y = ey;
    }
  }
  const pts = [start];                      // flat list of points: start, then c1 c2 end per segment
  segs.forEach(s => pts.push([s[0], s[1]], [s[2], s[3]], [s[4], s[5]]));
  while (pts.length < 10) {                 // split the longest segment in half until there are 3
    let best = 0, bl = -1;
    for (let i = 0; i + 3 < pts.length; i += 3) { const l = Math.hypot(pts[i + 3][0] - pts[i][0], pts[i + 3][1] - pts[i][1]); if (l > bl) { bl = l; best = i; } }
    const [p0, p1, p2, p3] = pts.slice(best, best + 4), mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const a = mid(p0, p1), b = mid(p1, p2), c = mid(p2, p3), d2 = mid(a, b), e = mid(b, c), f = mid(d2, e);
    pts.splice(best + 1, 2, a, d2, f, e, c);
  }
  return pts;
}
const pathOf = pts => 'M' + pts[0].map(v => v.toFixed(1)).join(' ') + 'C' + pts.slice(1).map(p => p.map(v => v.toFixed(1)).join(' ')).join(' ');
const CUBE = {};
const cubes = pose => CUBE[pose] || (CUBE[pose] = { tape: toCubics(TAPES[pose] || TAPES.idle), left: toCubics(LEFTS[pose] || LEFTS.idle) });

/* ---------- face ---------- */
function eyeOpen(x, y, s, sparkle) {
  return `<ellipse cx="${x}" cy="${y}" rx="${9.5 * s}" ry="${11 * s}" fill="${P.ink}"/>
    <circle cx="${x + 3.2 * s}" cy="${y - 4 * s}" r="${3.6 * s}" fill="#fff"/><circle cx="${x - 3 * s}" cy="${y + 4 * s}" r="${1.7 * s}" fill="#fff"/>
    ${sparkle ? `<path transform="translate(${x - 3} ${y - 1}) scale(.5)" d="M0-9 2-2 9 0 2 2 0 9-2 2-9 0-2-2z" fill="#fff"/>` : ''}`;
}
function eye(expr, cx, side) {
  const x = cx, y = 96;
  switch (expr) {
    case 'blink': case 'proud': case 'shy': case 'giggle':
      return `<path d="M${x - 9} ${y + 1}q9 ${expr === 'shy' ? 6 : -9} 18 0" fill="none" stroke="${P.ink}" stroke-width="4.5" stroke-linecap="round"/>`;
    case 'wink': return side === 'L' ? `<path d="M${x - 9} ${y + 1}q9 -9 18 0" fill="none" stroke="${P.ink}" stroke-width="4.5" stroke-linecap="round"/>` : eyeOpen(x, y, 1);
    case 'oops': return side === 'L' ? `<path d="M${x - 8} ${y - 6}l12 6-12 6" fill="none" stroke="${P.ink}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>` : eyeOpen(x, y, 1);
    case 'sleepy': return `<path d="M${x - 9} ${y}h18" stroke="${P.ink}" stroke-width="4.5" stroke-linecap="round"/><path d="M${x - 8} ${y + 1}q8 7 16 0" fill="${P.ink}"/>`;
    case 'love': return `<path transform="translate(${x} ${y})" d="M0 9C-14 0-11-11-5-11c3 0 5 2 5 4 0-2 2-4 5-4 6 0 9 11-5 20z" fill="#E8457A"/><circle cx="${x - 4}" cy="${y - 5}" r="2.2" fill="#fff"/>`;
    case 'excited': return eyeOpen(x, y, 1.18, true);
    case 'dizzy': return `<path d="M${x} ${y}m-2 0a2 2 0 1 1 4 0a4 4 0 1 1 -8 0a6 6 0 1 1 12 0a8 8 0 1 1 -16 0" fill="none" stroke="${P.ink}" stroke-width="2.6" stroke-linecap="round"/>`;
    case 'surprised': return `<circle cx="${x}" cy="${y}" r="11" fill="#fff" stroke="${P.ink}" stroke-width="3"/><circle cx="${x}" cy="${y}" r="5" fill="${P.ink}"/>`;
    case 'thinking': return eyeOpen(x - 2, y - 3, 0.95);
    default: return eyeOpen(x, y, 1);
  }
}
function mouthOf(expr) {
  const mx = 100, my = 118;
  return {
    happy: `<path d="M${mx - 9} ${my}q9 9 18 0" fill="none" stroke="${P.ink}" stroke-width="4" stroke-linecap="round"/>`,
    blink: `<path d="M${mx - 9} ${my}q9 9 18 0" fill="none" stroke="${P.ink}" stroke-width="4" stroke-linecap="round"/>`,
    wink: `<path d="M${mx - 11} ${my - 1}q11 13 22 0z" fill="${P.ink}"/><path d="M${mx - 6} ${my + 5}q6 4 12 0" fill="#F27A9B"/>`,
    excited: `<path d="M${mx - 12} ${my - 2}q12 18 24 0z" fill="${P.ink}"/><path d="M${mx - 7} ${my + 7}q7 5 14 0" fill="#F27A9B"/>`,
    proud: `<path d="M${mx - 11} ${my - 1}q11 12 22 0" fill="none" stroke="${P.ink}" stroke-width="4" stroke-linecap="round"/>`,
    curious: `<ellipse cx="${mx + 2}" cy="${my + 2}" rx="4" ry="5" fill="${P.ink}"/>`,
    thinking: `<path d="M${mx - 8} ${my + 2}q4-4 8 0t8 0" fill="none" stroke="${P.ink}" stroke-width="3.5" stroke-linecap="round"/>`,
    sleepy: `<ellipse cx="${mx}" cy="${my + 2}" rx="3.5" ry="2.5" fill="${P.ink}"/>`,
    surprised: `<ellipse cx="${mx}" cy="${my + 3}" rx="6" ry="8" fill="${P.ink}"/>`,
    shy: `<path d="M${mx - 7} ${my + 1}q3.5 3 7 0t7 0" fill="none" stroke="${P.ink}" stroke-width="3.5" stroke-linecap="round"/>`,
    love: `<path d="M${mx - 10} ${my - 1}q10 12 20 0z" fill="${P.ink}"/>`,
    oops: `<path d="M${mx - 11} ${my - 1}h22q-2 10-11 10t-11-10z" fill="${P.ink}"/><path d="M${mx - 9} ${my}h18v3h-18z" fill="#fff"/>`,
    giggle: `<path d="M${mx - 11} ${my - 2}q11 16 22 0z" fill="${P.ink}"/><path d="M${mx - 6} ${my + 5}q6 4 12 0" fill="#F27A9B"/>`,
    dizzy: `<path d="M${mx - 9} ${my + 2}q3-4 6 0t6 0t6 0" fill="none" stroke="${P.ink}" stroke-width="3.5" stroke-linecap="round"/>`
  }[expr] || '';
}
const EXTRAS = {
  sleepy: `<text x="150" y="44" font-family="sans-serif" font-weight="700" font-size="20" fill="${P.plumL}">z</text><text x="164" y="28" font-family="sans-serif" font-weight="700" font-size="14" fill="${P.ring}">z</text>`,
  oops: `<path d="M150 70q6 9 0 13-6-4 0-13z" fill="#9CD4F5"/>`,
  excited: `<path transform="translate(40 40)" d="M0-8 2-2 8 0 2 2 0 8-2 2-8 0-2-2z" fill="${P.mint}"/><path transform="translate(164 56) scale(.7)" d="M0-8 2-2 8 0 2 2 0 8-2 2-8 0-2-2z" fill="${P.plumL}"/>`,
  love: `<path transform="translate(160 46) scale(.7)" d="M0 9C-14 0-11-11-5-11c3 0 5 2 5 4 0-2 2-4 5-4 6 0 9 11-5 20z" fill="#F59AB5"/>`,
  thinking: `<circle cx="150" cy="54" r="4" fill="${P.ring}"/><circle cx="160" cy="40" r="6" fill="${P.ring}"/>`,
  surprised: `<path d="M44 52l-8-6M40 64l-10 0M150 52l8-6" stroke="${P.plumL}" stroke-width="3" stroke-linecap="round"/>`,
  giggle: `<path d="M150 58q8-4 12 2M154 70q8-2 11 4" fill="none" stroke="${P.plumL}" stroke-width="3" stroke-linecap="round"/>`,
  dizzy: `<path transform="translate(60 40) scale(.55)" d="M0-8 2-2 8 0 2 2 0 8-2 2-8 0-2-2z" fill="${P.mint}"/><path transform="translate(140 34) scale(.45)" d="M0-8 2-2 8 0 2 2 0 8-2 2-8 0-2-2z" fill="${P.plumL}"/><path transform="translate(100 26) scale(.4)" d="M0-8 2-2 8 0 2 2 0 8-2 2-8 0-2-2z" fill="#F6E3A6"/>`
};
const BLUSH = { proud: .85, shy: 1, love: .9, excited: .7, giggle: 1, dizzy: .6 };
const face = expr => `<g class="bd-eyes">${eye(expr, 82, 'L')}${eye(expr, 118, 'R')}</g>${mouthOf(expr)}`;
/* legs are numbers (hip x, foot x, foot y for each leg) so they blend between poses and never vanish */
const LEGS = {
  idle: [86, 84, 178, 114, 116, 178], hop: [84, 77, 171, 116, 123, 171], sleep: [80, 74, 170, 118, 126, 168],
  runA: [92, 108, 172, 110, 96, 179], runB: [92, 80, 179, 110, 124, 171], splat: [86, 84, 180, 114, 116, 180]
};
const legsOf = p => LEGS[p] || LEGS.idle;
const legPaths = L => {
  const f = n => n.toFixed(1);
  return [`M${f(L[0])} 160L${f(L[1])} ${f(L[2])}`, `M${f(L[3])} 160L${f(L[4])} ${f(L[5])}`,
    `M${f(L[1] - 8)} ${f(L[2] + 2)}h14`, `M${f(L[4] - 6)} ${f(L[5] + 2)}h14`];
};
const legs = pose => { const d = legPaths(legsOf(pose));
  return `<path data-k="legL" d="${d[0]}" stroke="${P.plum}" stroke-width="10" stroke-linecap="round"/><path data-k="legR" d="${d[1]}" stroke="${P.plum}" stroke-width="10" stroke-linecap="round"/>`
    + `<path data-k="footL" d="${d[2]}" stroke="${P.plumD}" stroke-width="8" stroke-linecap="round"/><path data-k="footR" d="${d[3]}" stroke="${P.plumD}" stroke-width="8" stroke-linecap="round"/>`; };
const LIFT = { hop: -14, splat: 14, runA: -5, runB: 0 };
const FLASK = `<g transform="translate(40 128)"><path d="M-6-22h12v10l12 22q3 7-5 8h-26q-8-1-5-8l12-22z" fill="#fff" fill-opacity=".55" stroke="${P.ring}" stroke-width="2.5"/><path d="M-13 4h26l4 7q2 5-4 6h-26q-6-1-4-6z" fill="#B58CDD"/></g>`;
const ticks = Array.from({ length: 60 }, (_, i) => { const a = i / 60 * Math.PI * 2, r1 = 52, r2 = i % 5 ? 49.5 : 47.5; return `<path d="M${(100 + r1 * Math.cos(a)).toFixed(1)} ${(104 + r1 * Math.sin(a)).toFixed(1)}L${(100 + r2 * Math.cos(a)).toFixed(1)} ${(104 + r2 * Math.sin(a)).toFixed(1)}"/>`; }).join('');

/* the whole drawing; slots marked data-k are what the live rig changes */
let uid = 0;
function markup(id, size, s) {
  const c = cubes(s.pose), tp = pathOf(c.tape), lp = pathOf(c.left), hand = c.left[9], tEnd = c.tape[9];
  const hop = s.pose === 'hop';
  const lift = LIFT[s.pose] || 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-15 0 230 200" width="${size}" height="${size * 200 / 230}" class="buddy-svg" overflow="visible">
  <defs>
    <linearGradient id="${id}c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${P.plumL}"/><stop offset=".5" stop-color="${P.plum}"/><stop offset="1" stop-color="${P.plumD}"/></linearGradient>
    <radialGradient id="${id}f" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="${P.face}"/></radialGradient>
    <linearGradient id="${id}m" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#F4F5F8"/><stop offset="1" stop-color="#A9ADB8"/></linearGradient>
  </defs>
  <ellipse data-k="shadow" cx="100" cy="188" rx="${hop ? 34 : 44}" ry="7" fill="${P.ink}" opacity="${hop ? .08 : .14}"/>
  <g data-k="tilt" transform="translate(0 ${lift}) rotate(${TILT[s.pose] || 0} 100 110)">
    <g data-k="legs">${legs(s.pose)}</g>
    <path data-k="left" d="${lp}" fill="none" stroke="${P.plum}" stroke-width="9" stroke-linecap="round"/>
    <path data-k="t1" d="${tp}" fill="none" stroke="${P.tapeD}" stroke-width="15" stroke-linecap="round"/>
    <path data-k="t2" d="${tp}" fill="none" stroke="${P.tape}" stroke-width="12" stroke-linecap="round"/>
    <path data-k="t3" d="${tp}" fill="none" stroke="${P.tapeD}" stroke-width="5" stroke-dasharray="1.6 5"/>
    <circle cx="100" cy="104" r="62" fill="url(#${id}c)"/>
    <path d="M58 72a52 52 0 0 1 60-26" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="6" stroke-linecap="round"/>
    <rect x="152" y="94" width="18" height="22" rx="5" fill="${P.plumD}"/>
    <g transform="rotate(-38 100 104)"><rect x="93" y="38" width="14" height="12" rx="4" fill="url(#${id}m)" stroke="#8E929C" stroke-width="1"/></g>
    <circle cx="100" cy="104" r="52" fill="${P.tape}"/>
    <g stroke="${P.tapeD}" stroke-width="1.6">${ticks}</g>
    <circle cx="100" cy="104" r="45" fill="url(#${id}f)"/>
    <circle cx="100" cy="104" r="45" fill="none" stroke="${P.ring}" stroke-width="3"/>
    <g data-k="blush" opacity="${BLUSH[s.expr] ?? .5}"><ellipse cx="74" cy="112" rx="9" ry="5.5" fill="${P.blush}"/><ellipse cx="126" cy="112" rx="9" ry="5.5" fill="${P.blush}"/></g>
    <g data-k="look"><g data-k="face">${face(s.expr)}</g></g>
    <circle data-k="hand" cx="${hand[0]}" cy="${hand[1]}" r="7.5" fill="${P.plumL}"/>
    <rect data-k="hook" x="${tEnd[0] - 5}" y="${tEnd[1] - 8}" width="10" height="16" rx="3" fill="url(#${id}m)" stroke="#8E929C" stroke-width="1.2"/>
    <g data-k="flask" opacity="${s.pose === 'flask' ? 1 : 0}">${FLASK}</g>
  </g>
  <g data-k="extras">${EXTRAS[s.expr] || ''}</g>
</svg>`;
}

/* one still drawing (the expression sheet) */
export function buddySVG({ expr = 'happy', pose = 'idle', look = [0, 0], size = 200 } = {}) {
  const host = document.createElement('div');
  host.innerHTML = markup('b' + (++uid), size, { expr, pose });
  host.querySelector('[data-k=look]').setAttribute('transform', `translate(${look[0] * 4} ${look[1] * 3})`);
  return host.innerHTML;
}

/* the live character: poses blend over a short spring, faces cross-fade, eyes follow smoothly and blink by closing */
export function createBuddy(el, size) {
  const id = 'b' + (++uid);
  el.innerHTML = markup(id, size, { expr: 'happy', pose: 'idle' });
  const q = k => el.querySelector(`[data-k=${k}]`);
  const k = { shadow: q('shadow'), tilt: q('tilt'), legs: q('legs'), legL: q('legL'), legR: q('legR'), footL: q('footL'), footR: q('footR'), left: q('left'), t: [q('t1'), q('t2'), q('t3')], blush: q('blush'),
    look: q('look'), face: q('face'), hand: q('hand'), hook: q('hook'), flask: q('flask'), extras: q('extras') };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const num = (p, turn) => ({ tilt: TILT[p] || 0, lift: LIFT[p] || 0, sh: p === 'hop' ? 34 : p === 'splat' ? 58 : 44, flask: p === 'flask' ? 1 : 0, legs: legsOf(p), turn });
  let cur = { pose: 'idle', expr: 'happy', turn: 0, pts: cubes('idle'), n: num('idle', 0) };
  let from = null, to = null, t0 = 0, dur = 420, raf = 0;
  let look = [0, 0], lookT = [0, 0];
  const ease = x => { const c = 1.25; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };   // soft overshoot
  const lerp = (a, b, t) => a + (b - a) * t;
  const lerpPts = (A, B, t) => A.map((p, i) => [lerp(p[0], B[i][0], t), lerp(p[1], B[i][1], t)]);

  function paint(pts, n) {
    const tp = pathOf(pts.tape);
    k.t.forEach(p => p.setAttribute('d', tp));
    k.left.setAttribute('d', pathOf(pts.left));
    k.hand.setAttribute('cx', pts.left[9][0].toFixed(1)); k.hand.setAttribute('cy', pts.left[9][1].toFixed(1));
    k.hook.setAttribute('x', (pts.tape[9][0] - 5).toFixed(1)); k.hook.setAttribute('y', (pts.tape[9][1] - 8).toFixed(1));
    k.tilt.setAttribute('transform', `translate(0 ${n.lift.toFixed(1)}) rotate(${n.tilt.toFixed(1)} 100 110)`);
    k.shadow.setAttribute('rx', n.sh.toFixed(1));
    k.flask.setAttribute('opacity', Math.max(0, Math.min(1, n.flask)).toFixed(2));
    // turn 0 faces the viewer, 1 is a three-quarter view toward its right (the wrapper mirrors it for left)
    const tn = n.turn || 0;
    k.look.setAttribute('transform', `translate(${(look[0] * 4 + tn * 17 + 100).toFixed(2)} ${(look[1] * 3).toFixed(2)}) scale(${(1 - tn * 0.12).toFixed(3)} 1) translate(-100 0)`);
    k.blush.setAttribute('transform', `translate(${(tn * 12).toFixed(2)} 0)`);
    const d = legPaths(n.legs.map((v, i) => i % 3 === 2 ? v : v + tn * 6));
    k.legL.setAttribute('d', d[0]); k.legR.setAttribute('d', d[1]); k.footL.setAttribute('d', d[2]); k.footR.setAttribute('d', d[3]);
  }
  function frame(now) {
    raf = 0; let busy = false;
    if (to) {
      const x = Math.min(1, (now - t0) / dur), e = ease(x);
      cur.pts = { tape: lerpPts(from.pts.tape, to.pts.tape, e), left: lerpPts(from.pts.left, to.pts.left, e) };
      const s1 = Math.min(1, x * 1.15);            // legs and turn settle without overshoot
      cur.n = { tilt: lerp(from.n.tilt, to.n.tilt, e), lift: lerp(from.n.lift, to.n.lift, e), sh: lerp(from.n.sh, to.n.sh, e), flask: lerp(from.n.flask, to.n.flask, Math.min(1, x * 1.6)),
        legs: from.n.legs.map((v, i) => lerp(v, to.n.legs[i], s1)), turn: lerp(from.n.turn, to.n.turn, s1) };
      if (x >= 1) { cur.pts = to.pts; cur.n = to.n; to = null; } else busy = true;
    }
    const dx = lookT[0] - look[0], dy = lookT[1] - look[1];
    if (Math.abs(dx) + Math.abs(dy) > 0.01) { look = [look[0] + dx * 0.16, look[1] + dy * 0.16]; busy = true; }
    paint(cur.pts, cur.n);
    if (busy) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

  /* faces swap with a quick cross-fade instead of a cut */
  function setFace(expr) {
    if (expr === cur.expr) return;
    cur.expr = expr;
    const old = k.face, neu = old.cloneNode(false);
    neu.innerHTML = face(expr); neu.style.opacity = 0; neu.style.transition = 'opacity .16s ease';
    old.style.transition = 'opacity .16s ease';
    old.after(neu); k.face = neu;
    requestAnimationFrame(() => { neu.style.opacity = 1; old.style.opacity = 0; });
    setTimeout(() => old.remove(), 220);
    k.blush.style.transition = 'opacity .3s ease'; k.blush.setAttribute('opacity', BLUSH[expr] ?? .5);
    const ex = k.extras; ex.style.transition = 'opacity .16s ease'; ex.style.opacity = 0;
    setTimeout(() => { ex.innerHTML = EXTRAS[expr] || ''; ex.style.opacity = 1; }, 160);
  }
  function setPose(pose, ms, turn) {
    const tn = turn ?? cur.turn;
    if (pose === cur.pose && tn === cur.turn && !to) return;
    cur.pose = pose; cur.turn = tn;
    from = { pts: cur.pts, n: cur.n }; to = { pts: cubes(pose), n: num(pose, tn) };
    dur = reduce ? 1 : (ms || 420); t0 = performance.now(); kick();
  }
  return {
    set({ expr, pose, ms, turn } = {}) { if (expr) setFace(expr); if (pose || turn !== undefined) setPose(pose || cur.pose, ms, turn); },
    look(x, y) { lookT = [x, y]; if (reduce) look = lookT; kick(); },
    blink() {
      const eyes = k.face.querySelector('.bd-eyes'); if (!eyes || cur.expr !== 'happy') return;
      eyes.style.transformBox = 'fill-box'; eyes.style.transformOrigin = 'center'; eyes.style.transition = 'transform .07s ease-in';
      eyes.style.transform = 'scaleY(.12)';
      setTimeout(() => { eyes.style.transition = 'transform .11s ease-out'; eyes.style.transform = ''; }, 90);
    },
    get pose() { return cur.pose; }, get expr() { return cur.expr; }, get turn() { return cur.turn; }
  };
}
