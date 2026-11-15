/* Treatment pages: tap a case photo or a leaflet to see it full size.
   Leaflets page through with the arrows or the keyboard.
   Native <dialog> with showModal(), so focus stays inside, the page behind is inert
   and Esc closes it. Clicking the dark area around the picture closes it too. */
(() => {
  const items = [...document.querySelectorAll('.zoomable')];
  if (!items.length) return;
  const box = document.createElement('dialog');
  box.className = 'tx-zoom';
  box.setAttribute('aria-label', 'Picture');
  box.innerHTML = '<form method="dialog"><button class="btn ghost tx-close">Close</button></form>' +
    '<button class="tx-nav prev" type="button" aria-label="Previous">&#8249;</button>' +
    '<img alt=""><button class="tx-nav next" type="button" aria-label="Next">&#8250;</button><p class="tx-count" aria-live="polite"></p>';
  document.body.appendChild(box);
  const img = box.querySelector('img'), count = box.querySelector('.tx-count');
  let set = [], i = 0;

  const show = () => {
    const b = set[i];
    img.src = b.dataset.full; img.alt = b.querySelector('img').alt;
    box.setAttribute('aria-label', img.alt || 'Picture');
    const many = set.length > 1;
    box.querySelectorAll('.tx-nav').forEach(n => { n.hidden = !many; });
    count.textContent = many ? `${i + 1} of ${set.length}` : '';
  };
  const open = b => {
    set = b.dataset.set ? items.filter(x => x.dataset.set === b.dataset.set) : [b];
    i = set.indexOf(b); show();
    box.showModal(); document.documentElement.style.overflow = 'hidden';
  };
  const go = d => { i = (i + d + set.length) % set.length; show(); };

  items.forEach(b => b.addEventListener('click', () => open(b)));
  box.addEventListener('close', () => { document.documentElement.style.overflow = ''; });
  box.addEventListener('click', e => {
    if (e.target === box) box.close();
    else if (e.target.closest('.prev')) go(-1);
    else if (e.target.closest('.next')) go(1);
  });
  box.addEventListener('keydown', e => {
    if (set.length < 2) return;
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  });
})();

/* FAQ: one answer open at a time. <details name="faq"> does it natively; older Safari and Firefox get this. */
(() => {
  if ('name' in HTMLDetailsElement.prototype) return;
  const all = [...document.querySelectorAll('details[name="faq"]')];
  all.forEach(d => d.addEventListener('toggle', () => { if (d.open) all.forEach(o => { if (o !== d) o.open = false; }); }));
})();
