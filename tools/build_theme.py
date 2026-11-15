#!/usr/bin/env python3
"""Build the WordPress theme package for Apex IT.

Run from the repo root:  python3 tools/build_theme.py
1. Checks the version in style.css and functions.php match.
2. Exports the design's content to wordpress/import/content.json (tools/export_content.py).
3. Copies the theme, the design's assets and content.json into build/apex-slim/, leaving out the pictures no
   page uses, and zips it as build/apex-slim-<version>.zip.
4. Writes HANDOVER.pdf from wordpress/HANDOVER.md next to the zip.
"""
import re, shutil, subprocess, sys, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
THEME = ROOT / 'wordpress' / 'theme' / 'apex-slim'
OUT = ROOT / 'build'
# pictures from earlier rounds that no page shows (audit, Nov 2026)
SKIP = [re.compile(p) for p in (r'^img/lab/mix/', r'^img/results/(jaw|vline)-')]

v_css = re.search(r'^Version:\s*(\S+)', (THEME / 'style.css').read_text(), re.M)[1]
v_php = re.search(r"define\( 'SLIM_VERSION', '([^']+)' \)", (THEME / 'functions.php').read_text())[1]
if v_css != v_php:
    sys.exit(f'Version in style.css ({v_css}) and functions.php ({v_php}) differ')
for f in sorted(THEME.rglob('*.php')):
    r = subprocess.run(['php', '-l', str(f)], capture_output=True, text=True)
    if r.returncode:
        sys.exit(r.stdout + r.stderr)

subprocess.run([sys.executable, str(ROOT / 'tools' / 'export_content.py')], check=True)

dest = OUT / 'apex-slim'
shutil.rmtree(dest, ignore_errors=True)
shutil.copytree(THEME, dest, symlinks=False, ignore=shutil.ignore_patterns('assets', 'content.json', '.gitignore'))
n = 0
for f in sorted((ROOT / 'assets').rglob('*')):
    rel = f.relative_to(ROOT / 'assets').as_posix()
    if f.is_dir() or any(p.search(rel) for p in SKIP) or f.name == '.DS_Store':
        continue
    (dest / 'assets' / rel).parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(f, dest / 'assets' / rel)
    n += 1
shutil.copy2(ROOT / 'wordpress' / 'import' / 'content.json', dest / 'content.json')

zpath = OUT / f'apex-slim-{v_css}.zip'
zpath.unlink(missing_ok=True)
with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_DEFLATED) as z:
    for f in sorted(dest.rglob('*')):
        if f.is_file():
            z.write(f, Path('apex-slim') / f.relative_to(dest))
print(f'{zpath.relative_to(ROOT)}  {n} asset files, {zpath.stat().st_size / 1e6:.1f} MB')

# HANDOVER.pdf: the markdown as a printed page
md = ROOT / 'wordpress' / 'HANDOVER.md'
html = OUT / 'HANDOVER.html'
css = ("#title-block-header{display:none}body{font:11pt/1.5 'Noto Sans','Noto Sans Thai',sans-serif;color:#2A1F33;max-width:760px;margin:auto}"
       "h1{color:#6A388C;font-size:20pt}h2{color:#6A388C;border-bottom:1px solid #C9B3DD;padding-bottom:4px;margin-top:28px}"
       "code{background:#F1EAF7;padding:1px 4px;border-radius:3px;font-size:9.5pt}pre{background:#F1EAF7;padding:10px;border-radius:6px;white-space:pre-wrap}"
       "table{border-collapse:collapse;width:100%}td,th{border:1px solid #C9B3DD;padding:4px 8px;text-align:left;vertical-align:top}")
subprocess.run(['pandoc', str(md), '-s', '-o', str(html), '--metadata', 'title=Apex Slim and Longevity: WordPress handover', '-V', 'mainfont=sans'], check=True)
h = html.read_text().replace('</head>', f'<style>{css}</style></head>')
html.write_text(h)
from playwright.sync_api import sync_playwright  # noqa: E402
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page()
    pg.goto(html.as_uri())
    pg.pdf(path=str(OUT / 'HANDOVER.pdf'), format='A4', margin={'top': '18mm', 'bottom': '18mm', 'left': '16mm', 'right': '16mm'})
    b.close()
html.unlink()
print('build/HANDOVER.pdf')
