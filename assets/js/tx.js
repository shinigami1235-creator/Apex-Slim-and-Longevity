/* Treatment pages: tap a case photo or a leaflet to see it full size.
   Leaflets page through with the arrows or the keyboard. */
(() => {
  const items = [...document.querySelectorAll('.zoomable')];
  if (!items.length) return;
  const box = document.createElement('div');
  box.className = 'tx-zoom'; box.hidden = true;
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Picture');
  box.innerHTML = '<button class="btn ghost tx-close" type="button">Close</button>' +
    '<button class="tx-nav prev" type="button" aria-label="Previous">&#8249;</button>' +
    '<img alt=""><button class="tx-nav next" type="button" aria-label="Next">&#8250;</button><p class="tx-count"></p>';
  document.body.appendChild(box);
  const img = box.querySelector('img'), count = box.querySelector('.tx-count');
  let set = [], i = 0, last = null;

  const show = () => {
    const b = set[i];
    img.src = b.dataset.full; img.alt = b.querySelector('img').alt;
    const many = set.length > 1;
    box.querySelectorAll('.tx-nav').forEach(n => { n.hidden = !many; });
    count.textContent = many ? `${i + 1} of ${set.length}` : '';
  };
  const open = b => {
    last = b;
    set = b.dataset.set ? items.filter(x => x.dataset.set === b.dataset.set) : [b];
    i = set.indexOf(b); show();
    box.hidden = false; document.body.style.overflow = 'hidden';
    box.querySelector('.tx-close').focus();
  };
  const close = () => { box.hidden = true; document.body.style.overflow = ''; if (last) last.focus(); };
  const go = d => { i = (i + d + set.length) % set.length; show(); };

  items.forEach(b => b.addEventListener('click', () => open(b)));
  box.addEventListener('click', e => {
    if (e.target.closest('.tx-close') || e.target === box) close();
    else if (e.target.closest('.prev')) go(-1);
    else if (e.target.closest('.next')) go(1);
  });
  addEventListener('keydown', e => {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft' && set.length > 1) go(-1);
    if (e.key === 'ArrowRight' && set.length > 1) go(1);
  });
})();
