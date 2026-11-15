/* Apex Slim admin forms: media picker and repeater rows. */
(function ($) {
  const A = window.SLIM_ADMIN || {};
  // the site keeps uploads as "~/wp-content/..." so content survives a change of domain
  const store = url => url && A.home && url.indexOf(A.home + 'wp-content/') === 0 ? '~/' + url.slice(A.home.length) : url;
  // pictures that ship with the theme are stored as img/...
  const show = src => !src ? '' : src.indexOf('~/') === 0 ? (A.media || A.home) + src.slice(2) : /^(img|video|lab)\//.test(src) ? A.theme + src : src;

  $(document).on('click', '.slim-media', function (e) {
    e.preventDefault();
    const input = document.getElementById(this.dataset.for);
    const frame = wp.media({title: this.textContent, button: {text: A.choose}, library: {type: 'image'}, multiple: false});
    frame.on('select', () => {
      const a = frame.state().get('selection').first().toJSON();
      input.value = store(a.url);
      $(input).trigger('change');
    });
    frame.open();
  });
  $(document).on('click', '.slim-media-add', function (e) {
    e.preventDefault();
    const box = document.getElementById(this.dataset.for);
    const frame = wp.media({title: this.textContent, button: {text: A.choose}, library: {type: this.dataset.type}, multiple: 'add'});
    frame.on('select', () => {
      const urls = frame.state().get('selection').toJSON().map(a => store(a.url));
      box.value = (box.value.trim() ? box.value.trim() + '\n' : '') + urls.join('\n');
    });
    frame.open();
  });
  // preview beside an image field
  $(document).on('change input', '.slim-image input', function () {
    const t = $(this).siblings('.slim-thumb');
    t.html(this.value ? $('<img alt="">').attr('src', show(this.value.trim())) : '');
  });

  // repeaters: rows are numbered again on every change so the form posts them in order
  // A repeater inside a row (treatments inside a group) has its own data-name, renamed with the row.
  const renumber = $rep => {
    const base = $rep.attr('data-name');
    const fix = n => (n.indexOf(base + '[') === 0 ? n : null);
    $rep.children('.slim-rows').children('.slim-row').each(function (i) {
      const at = (el, a) => {
        const n = el.getAttribute(a);
        if (!n || !fix(n)) return;
        el.setAttribute(a, base + n.slice(base.length).replace(/^\[[^\]]*\]/, '[' + i + ']'));
      };
      $(this).find('[name]').each(function () { at(this, 'name'); });
      $(this).find('.slim-repeater').each(function () { at(this, 'data-name'); });
    });
  };
  $(document).on('click', '.slim-add', function (e) {
    e.preventDefault();
    const $rep = $(this).closest('.slim-repeater');
    const tpl = $rep.children('template.slim-row-tpl')[0];
    const $row = $(tpl.content.cloneNode(true));
    // the template was drawn with this repeater's first name; a repeater inside a renumbered row has a new one
    const from = $rep.attr('data-tpl'), to = $rep.attr('data-name');
    if (from !== to) $row.find('[name],.slim-repeater').each(function () {
      ['name', 'data-name', 'data-tpl'].forEach(a => { const n = this.getAttribute(a); if (n && n.indexOf(from + '[') === 0) this.setAttribute(a, to + n.slice(from.length)); });
    });
    // fresh ids so labels and media buttons point at the new inputs
    $row.find('[id]').each(function () {
      const old = this.id, id = old + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      this.id = id;
      $row.find('[for="' + old + '"]').attr('for', id);
      $row.find('[data-for="' + old + '"]').attr('data-for', id);
    });
    $rep.children('.slim-rows').append($row);
    renumber($rep);
  });
  $(document).on('click', '.slim-del', function (e) {
    e.preventDefault();
    const $rep = $(this).closest('.slim-repeater');
    $(this).closest('.slim-row').remove();
    renumber($rep);
  });
  $(document).on('click', '.slim-up,.slim-down', function (e) {
    e.preventDefault();
    const $row = $(this).closest('.slim-row'), $rep = $row.closest('.slim-repeater');
    if ($(this).hasClass('slim-up')) $row.prev('.slim-row').before($row); else $row.next('.slim-row').after($row);
    renumber($rep);
  });

})(jQuery);
