/* Tape Buddy art: one function draws the character as SVG for any expression and pose.
   The site and the expression sheet both use it, so they always match. */
const P = { plumD: '#3A175A', plum: '#6A388C', plumL: '#B58CDD', face: '#F6F0FB', ring: '#C9B3DD', ink: '#2A0F40',
  tape: '#F6E3A6', tapeD: '#C9A24E', metal: '#D9DCE3', blush: '#F59AB5', mint: '#8DF0C6' };

let uid = 0;
export function buddySVG({ expr = 'happy', pose = 'idle', look = [0, 0], size = 200 } = {}) {
  const id = 'b' + (++uid);
  const [lx, ly] = look;                              // eye look offset, -1..1
  const ex = lx * 4, ey = ly * 3;
  const tilt = { think: -8, curious: 10, sleep: 14, shy: -6, cheer: 0, hop: 0 }[pose] ?? 0;
  const lift = pose === 'hop' ? -14 : 0;
  const squash = pose === 'hop' ? 'scale(0.96 1.04)' : '';

  /* ---------- eyes ---------- */
  const eye = (cx, side) => {
    const x = cx + ex, y = 96 + ey;
    switch (expr) {
      case 'blink': case 'proud': case 'shy':
        return `<path d="M${x - 9} ${y + 1}q9 ${expr === 'shy' ? 6 : -9} 18 0" fill="none" stroke="${P.ink}" stroke-width="4.5" stroke-linecap="round"/>`;
      case 'wink': return side === 'L'
        ? `<path d="M${x - 9} ${y + 1}q9 -9 18 0" fill="none" stroke="${P.ink}" stroke-width="4.5" stroke-linecap="round"/>`
        : eyeOpen(x, y, 1);
      case 'oops': return side === 'L'
        ? `<path d="M${x - 8} ${y - 6}l12 6-12 6" fill="none" stroke="${P.ink}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`
        : eyeOpen(x, y, 1);
      case 'sleepy': return `<path d="M${x - 9} ${y}h18" stroke="${P.ink}" stroke-width="4.5" stroke-linecap="round"/><path d="M${x - 8} ${y + 1}q8 7 16 0" fill="${P.ink}"/>`;
      case 'love': return `<path transform="translate(${x} ${y})" d="M0 9C-14 0-11-11-5-11c3 0 5 2 5 4 0-2 2-4 5-4 6 0 9 11-5 20z" fill="#E8457A"/><circle cx="${x - 4}" cy="${y - 5}" r="2.2" fill="#fff"/>`;
      case 'excited': return eyeOpen(x, y, 1.18, true);
      case 'surprised': return `<circle cx="${x}" cy="${y}" r="11" fill="#fff" stroke="${P.ink}" stroke-width="3"/><circle cx="${x}" cy="${y}" r="5" fill="${P.ink}"/>`;
      case 'thinking': return eyeOpen(x - 2, y - 3, 0.95);
      default: return eyeOpen(x, y, 1);
    }
  };
  function eyeOpen(x, y, s, sparkle) {
    return `<ellipse cx="${x}" cy="${y}" rx="${9.5 * s}" ry="${11 * s}" fill="${P.ink}"/>
      <circle cx="${x + 3.2 * s}" cy="${y - 4 * s}" r="${3.6 * s}" fill="#fff"/><circle cx="${x - 3 * s}" cy="${y + 4 * s}" r="${1.7 * s}" fill="#fff"/>
      ${sparkle ? `<path transform="translate(${x - 3} ${y - 1}) scale(.5)" d="M0-9 2-2 9 0 2 2 0 9-2 2-9 0-2-2z" fill="#fff"/>` : ''}`;
  }

  /* ---------- mouth ---------- */
  const mx = 100 + ex * 0.6, my = 118 + ey * 0.6;
  const mouth = {
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
    oops: `<path d="M${mx - 11} ${my - 1}h22q-2 10-11 10t-11-10z" fill="${P.ink}"/><path d="M${mx - 9} ${my}h18v3h-18z" fill="#fff"/>`
  }[expr] || '';
  const blushA = { proud: .85, shy: 1, love: .9, excited: .7 }[expr] ?? .5;
  const extras = {
    sleepy: `<text x="150" y="44" font-family="sans-serif" font-weight="700" font-size="20" fill="${P.plumL}">z</text><text x="164" y="28" font-family="sans-serif" font-weight="700" font-size="14" fill="${P.ring}">z</text>`,
    oops: `<path d="M150 70q6 9 0 13-6-4 0-13z" fill="#9CD4F5"/>`,
    excited: `<path transform="translate(40 40)" d="M0-8 2-2 8 0 2 2 0 8-2 2-8 0-2-2z" fill="${P.mint}"/><path transform="translate(164 56) scale(.7)" d="M0-8 2-2 8 0 2 2 0 8-2 2-8 0-2-2z" fill="${P.plumL}"/>`,
    love: `<path transform="translate(160 46) scale(.7)" d="M0 9C-14 0-11-11-5-11c3 0 5 2 5 4 0-2 2-4 5-4 6 0 9 11-5 20z" fill="#F59AB5"/>`,
    thinking: `<circle cx="150" cy="54" r="4" fill="${P.ring}"/><circle cx="160" cy="40" r="6" fill="${P.ring}"/>`,
    surprised: `<path d="M44 52l-8-6M40 64l-10 0M150 52l8-6" stroke="${P.plumL}" stroke-width="3" stroke-linecap="round"/>`
  }[expr] || '';

  /* ---------- arms: left arm is a stubby arm, right arm is the tape ---------- */
  const tapes = {
    idle: 'M160 104c18 2 26 16 22 32',
    wave: 'M160 104c18-6 22-26 16-44',
    point: 'M160 104h56',
    measure: 'M160 104h120',
    cheer: 'M160 100c16-10 20-30 14-48',
    cover: 'M160 100c-6-20-34-14-44-4',
    hop: 'M160 104c18 2 24 18 18 34',
    think: 'M160 106c14 14 2 30-22 24',
    heart: 'M160 104c20-6 36-30 20-38c-12-6-18 6-18 12c0-6-6-18-18-12',
    sleep: 'M160 108c16 6 18 22 6 32',
    shy: 'M160 104c12 8 8 26-8 30',
    curious: 'M160 104c18 0 26 12 22 28',
    flask: 'M160 104c16 4 20 18 14 30'
  };
  const lefts = {
    idle: 'M40 108q-14 10-12 26', wave: 'M40 108q-14 10-12 26', point: 'M40 108q-14 10-12 26', measure: 'M40 104q-24 0-28 4',
    cheer: 'M40 100q-16-16-12-40', cover: 'M42 100q8-20 34-12', hop: 'M40 106q-16 2-20 16', think: 'M40 108q-14 10-12 26',
    heart: 'M40 108q-14 10-12 26', sleep: 'M40 112q-12 10-8 22', shy: 'M42 108q12 18 34 18', curious: 'M40 108q-14 10-12 26', flask: 'M40 110q-6 18 14 26'
  };
  const tp = tapes[pose] || tapes.idle, lp = lefts[pose] || lefts.idle;
  const endOf = d => {          // end point of a path written as M x y then relative c, q or h segments
    let x = 0, y = 0;
    for (const m of d.matchAll(/([MmCcQqHh])([^MmCcQqHh]*)/g)) {
      const n = m[2].trim().split(/[\s,]+|(?=-)/).filter(Boolean).map(Number), c = m[1];
      if (c === 'M') { x = n[0]; y = n[1]; }
      else if (c === 'h') x += n[0];
      else { const k = c === 'c' ? 6 : 4; for (let i = 0; i + k <= n.length; i += k) { x += n[i + k - 2]; y += n[i + k - 1]; } }
    }
    return [x, y];
  };
  const hand = endOf(lp), tEnd = endOf(tp);
  const flask = pose === 'flask'
    ? `<g transform="translate(40 128)"><path d="M-6-22h12v10l12 22q3 7-5 8h-26q-8-1-5-8l12-22z" fill="#fff" fill-opacity=".55" stroke="${P.ring}" stroke-width="2.5"/><path d="M-13 4h26l4 7q2 5-4 6h-26q-6-1-4-6z" fill="#B58CDD"/></g>` : '';
  const legs = pose === 'sleep'
    ? `<path d="M80 160l-6 10M118 160l8 8" stroke="${P.plum}" stroke-width="10" stroke-linecap="round"/>`
    : pose === 'hop'
      ? `<path d="M84 160l-8 12M116 160l8 12" stroke="${P.plum}" stroke-width="10" stroke-linecap="round"/>`
      : `<path d="M86 160l-2 18M114 160l2 18" stroke="${P.plum}" stroke-width="10" stroke-linecap="round"/><path d="M76 180h14M110 180h14" stroke="${P.plumD}" stroke-width="8" stroke-linecap="round"/>`;
  const w = pose === 'measure' ? 300 : 230;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-15 0 ${w} 200" width="${size * w / 230}" height="${size * 200 / 230}" class="buddy-svg" data-expr="${expr}" data-pose="${pose}">
  <defs>
    <linearGradient id="${id}c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${P.plumL}"/><stop offset=".5" stop-color="${P.plum}"/><stop offset="1" stop-color="${P.plumD}"/></linearGradient>
    <radialGradient id="${id}f" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="${P.face}"/></radialGradient>
    <linearGradient id="${id}m" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#F4F5F8"/><stop offset="1" stop-color="#A9ADB8"/></linearGradient>
  </defs>
  <ellipse cx="100" cy="188" rx="${pose === 'hop' ? 34 : 44}" ry="7" fill="${P.ink}" opacity="${pose === 'hop' ? .08 : .14}"/>
  <g transform="translate(0 ${lift}) rotate(${tilt} 100 110)">
    <g transform="${squash}" transform-origin="100 160">
      ${legs}
      <path d="${lp}" transform="translate(0 0)" fill="none" stroke="${P.plum}" stroke-width="9" stroke-linecap="round"/>
      <path d="${tp}" fill="none" stroke="${P.tapeD}" stroke-width="15" stroke-linecap="round"/>
      <path d="${tp}" fill="none" stroke="${P.tape}" stroke-width="12" stroke-linecap="round"/>
      <path d="${tp}" fill="none" stroke="${P.tapeD}" stroke-width="5" stroke-dasharray="1.6 5" stroke-linecap="butt" transform="translate(0 0)"/>
      <circle cx="100" cy="104" r="62" fill="url(#${id}c)"/>
      <path d="M58 72a52 52 0 0 1 60-26" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="6" stroke-linecap="round"/>
      <rect x="152" y="94" width="18" height="22" rx="5" fill="${P.plumD}"/>
      <g transform="rotate(-38 100 104)"><rect x="93" y="38" width="14" height="12" rx="4" fill="url(#${id}m)" stroke="#8E929C" stroke-width="1"/></g>
      <circle cx="100" cy="104" r="52" fill="${P.tape}"/>
      <g stroke="${P.tapeD}" stroke-width="1.6">${Array.from({ length: 60 }, (_, i) => { const a = i / 60 * Math.PI * 2, r1 = 52, r2 = i % 5 ? 49.5 : 47.5; return `<path d="M${(100 + r1 * Math.cos(a)).toFixed(1)} ${(104 + r1 * Math.sin(a)).toFixed(1)}L${(100 + r2 * Math.cos(a)).toFixed(1)} ${(104 + r2 * Math.sin(a)).toFixed(1)}"/>`; }).join('')}</g>
      <circle cx="100" cy="104" r="45" fill="url(#${id}f)"/>
      <circle cx="100" cy="104" r="45" fill="none" stroke="${P.ring}" stroke-width="3"/>
      <ellipse cx="${74 + ex * .5}" cy="${112 + ey * .5}" rx="9" ry="5.5" fill="${P.blush}" opacity="${blushA}"/>
      <ellipse cx="${126 + ex * .5}" cy="${112 + ey * .5}" rx="9" ry="5.5" fill="${P.blush}" opacity="${blushA}"/>
      ${eye(82, 'L')}${eye(118, 'R')}
      ${mouth}
      <circle cx="${hand[0]}" cy="${hand[1]}" r="7.5" fill="${P.plumL}"/>
      <rect x="${tEnd[0] - 5}" y="${tEnd[1] - 8}" width="10" height="16" rx="3" fill="url(#${id}m)" stroke="#8E929C" stroke-width="1.2"/>
      ${flask}
    </g>
  </g>
  ${extras}
</svg>`;
}
export const EXPRESSIONS = ['happy', 'blink', 'wink', 'excited', 'proud', 'curious', 'thinking', 'surprised', 'shy', 'love', 'sleepy', 'oops'];
export const POSES = ['idle', 'wave', 'point', 'measure', 'cheer', 'cover', 'hop', 'think', 'heart', 'shy', 'flask', 'sleep'];
