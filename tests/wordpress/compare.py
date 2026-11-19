#!/usr/bin/env python3
"""Compare the WordPress pages with the static design, page by page.

  python3 tests/wordpress/compare.py http://127.0.0.1:8765/ http://localhost:8090/

Loads each pair in Chromium, runs the page scripts, then compares the text of <main>, the pictures it shows
(by file name) and the headings. Prints the differences and exits with 1 when any page differs.
"""
import difflib, sys
from playwright.sync_api import sync_playwright

STATIC, WP = sys.argv[1].rstrip('/') + '/', sys.argv[2].rstrip('/') + '/'
PAGES = [('index.html', ''), ('lab.html', 'lab/')] + [(f'{s}.html', f'treatments/{s}/') for s in
         ['one-week-one-kilo', 'coolsculpting', 'emsculpt-neo', 'fit-firm', 'iv-therapy', 'hbot', 'snorelase', 'exomind']]

GRAB = """() => {
  document.querySelectorAll('.consent a').forEach(a => a.remove());   // on purpose: WordPress links the privacy policy there
  const m = document.querySelector('main');
  const name = s => (s || '').split('?')[0].split('/').pop();
  return {
    text: m.innerText.split('\\n').map(s => s.replace(/\\s+/g, ' ').trim()).filter(Boolean),
    imgs: [...m.querySelectorAll('img[src], image')].map(i => name(i.getAttribute('src') || i.getAttribute('href'))).filter(Boolean),
    heads: [...m.querySelectorAll('h1,h2,h3')].map(h => h.tagName + ' ' + h.textContent.trim()),
    links: [...m.querySelectorAll('a[href]')].length,
    errors: window.__errs || [],
  };
}"""

def grab(page, url):
    errs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.goto(url, wait_until='networkidle')
    page.wait_for_timeout(400)
    d = page.evaluate(GRAB)
    d['errors'] = errs
    return d

bad = 0
with sync_playwright() as p:
    b = p.chromium.launch()
    for s, w in PAGES:
        a, c = grab(b.new_page(), STATIC + s), grab(b.new_page(), WP + w)
        diffs = []
        for k in ('text', 'imgs', 'heads'):
            if a[k] != c[k]:
                diffs += [f'  {k}: {l}' for l in difflib.unified_diff(a[k], c[k], 'static', 'wordpress', n=0, lineterm='') if not l.startswith(('---', '+++', '@@'))][:12]
        if a['links'] != c['links']:
            diffs.append(f"  links: static {a['links']}, wordpress {c['links']}")
        for e in c['errors']:
            diffs.append(f'  script error on WordPress: {e}')
        print(('OK   ' if not diffs else 'DIFF ') + w or '/')
        for d in diffs: print(d)
        bad += bool(diffs)
    b.close()
sys.exit(1 if bad else 0)
