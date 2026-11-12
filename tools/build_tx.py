#!/usr/bin/env python3
"""Build the treatment pages from tools/tx_content.py.

Run from the repo root:  python3 tools/build_tx.py
Writes one .html page per treatment and refreshes the Lab Notes cards in index.html.
"""
import html, math, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from tx_content import PAGES, ICONS  # noqa: E402
from tx_media import MEDIA, LEAFLET_ALT  # noqa: E402

CSS_V = "22"
JS = '<script src="assets/js/slim.js?v=8"></script>\n<script src="assets/js/tx.js?v=1"></script>\n<script type="module" src="assets/js/buddy.js?v=17"></script>'
STAGES = (ROOT / "tools" / "tx_stages.html").read_text()

GOALS = [("weight", "Lose weight"), ("fat", "Belly and flank fat"), ("tone", "Muscle tone"),
         ("firm", "Firmer buttocks"), ("energy", "Energy and recovery"), ("sleep", "Sleep without snoring")]


def icon(sym):
    return f'<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">{ICONS[sym]}</svg>'


IMG = "assets/img/tx/"


def device_fig(m):
    if "device" not in m:
        return ""
    f, cap = m["device"]
    return f'<figure class="tx-device"><img src="{IMG}{f}" alt="{html.escape(cap)}" loading="lazy"><figcaption>{cap}</figcaption></figure>\n'


def gallery(m, name):
    g = m.get("gallery")
    if not g:
        return ""
    cases = []
    for label, cells in g["cases"]:
        figs = "".join(f'<figure><button type="button" class="zoomable" data-full="{IMG}{f}"><img src="{IMG}{f}" alt="{html.escape(label)}, {html.escape(c.lower())}" loading="lazy"></button><figcaption>{c}</figcaption></figure>' for f, c in cells)
        cases.append(f'<div class="tx-case" style="--n:{len(cells)}"><h3>{label}</h3><div class="tx-cells">{figs}</div></div>')
    return f"""
<section class="sec tx-gallery" aria-labelledby="h-cases">
<div class="wrap">
<div class="sec-head"><h2 id="h-cases">{g['title']}</h2><p>{g['note']}</p></div>
<div class="tx-cases">
{chr(10).join(cases)}
</div>
</div>
</section>
"""


def leaflets(m, name):
    ls = m.get("leaflets")
    if not ls:
        return ""
    items = "".join(f'<li><button type="button" class="zoomable" data-full="{IMG}leaflet-{n:02d}.webp" data-set="leaflets"><img src="{IMG}leaflet-{n:02d}-t.webp" alt="{html.escape(LEAFLET_ALT[n])}" loading="lazy"></button></li>' for n in ls)
    return f"""
<section class="sec tx-leaflets" aria-labelledby="h-leaflets">
<div class="wrap">
<div class="sec-head"><h2 id="h-leaflets">Apex leaflets</h2><p>The {html.escape(name)} leaflets Apex hands out at the clinic, in Thai. Tap one to see it full size.</p></div>
<ul class="leaflet-row">{items}</ul>
</div>
</section>
"""


def words(p):
    text = " ".join(p["hook"]) + p["body"] + " ".join(q + a for q, a in p["faq"])
    text = re.sub(r"<[^>]+>", " ", text)
    return len(text.split())


def page(p):
    group_href = "index.html#treatments" if p["group"] == "treatments" else "index.html#longevity"
    group_name = "Treatments" if p["group"] == "treatments" else "Longevity"
    nav_cur = lambda g: ' aria-current="page"' if g == p["group"] else ""
    cls = (" " + p["cls"]) if p["cls"] else ""
    rows = "\n".join(f'<tr><th scope="row">{k}</th><td>{v}</td></tr>' for k, v in p["protocol"])
    hook = "\n".join(f'<p class="lede hook">{h}</p>' for h in p["hook"])
    faq = "\n".join(f"<details><summary>{q}</summary><p>{a}</p></details>" for q, a in p["faq"])
    refs = "\n".join(f"<li>{r}</li>" for r in p["refs"])
    ps, pn, ph, pc, pt = p["pair"]
    pc = (" " + pc) if pc else ""
    checks = "\n".join(
        f'<label><input type="checkbox" name="goal" value="{v}"><span>{t}</span></label>' for v, t in GOALS)
    extra = STAGES if p.get("extra") == "stages" else ""
    body_top = ' style="padding-top:0"' if extra else ""
    title = html.escape(p["name"])
    m = MEDIA.get(p["slug"], {})
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="only light">
<title>{title} | Apex Slim and Longevity</title>
<meta name="description" content="{html.escape(p['desc'])}">
<meta name="robots" content="noindex">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="preload" href="assets/fonts/LINESeed-Bd-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/slim.css?v={CSS_V}">
</head>
<body>

<header class="top">
<div class="wrap">
<a class="brand" href="index.html">
<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="16" fill="#6A388C"/><path d="M18 48 32 16l14 32" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M24 38h16" stroke="#C9B3DD" stroke-width="4" stroke-linecap="round"/></svg>
<span>Apex Slim<small>and Longevity</small></span>
</a>
<button class="menu-btn" aria-expanded="false" aria-controls="nav" aria-label="Menu"><svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>
<nav class="nav" id="nav" aria-label="Main">
<a href="index.html#treatments"{nav_cur('treatments')}>Treatments</a>
<a href="index.html#longevity"{nav_cur('longevity')}>Longevity</a>
<a href="index.html#results">Results</a>
<a href="index.html#notes">Lab Notes</a>
<a href="lab.html">Wellness Lab</a>
<a class="btn" href="#consult">Book a consult</a>
</nav>
</div>
</header>

<main>

<section class="tx-top" aria-labelledby="h-tx">
<div class="wrap">
<div class="specimen">
<div class="el{cls}" aria-hidden="true">{icon(p['sym'])}<span class="sym">{p['sym']}</span><span><span class="nm">{title}</span><br><span class="ft">{p['ft']}</span></span></div>
<div class="temp"><span>{p['temp'][0]}</span><span>{p['temp'][1]}</span></div>
</div>
<div>
<p class="crumbs"><a href="{group_href}">{group_name}</a> / {title}</p>
<h1 id="h-tx">{title}</h1>
{hook}
<table class="protocol">
{rows}
</table>
<div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:32px">
<a class="btn" href="#consult">Book a consult</a>
<a class="btn ghost" href="https://lin.ee/z7vQnrT" target="_blank" rel="noopener">Chat on LINE</a>
</div>
</div>
</div>
</section>

{extra}
<section class="sec" id="article"{body_top} aria-label="Article">
<div class="wrap article">
<div class="prose">
{device_fig(m)}{p['body'].strip()}

<h2>Questions</h2>
<div class="faq">
{faq}
</div>

<h2 class="refs-h">Sources</h2>
<ol class="refs">
{refs}
</ol>
<p class="note-mark">Results vary from person to person. The doctor checks whether a treatment suits you at your consult.</p>
</div>
<aside class="aside" aria-labelledby="h-pair">
<h3 id="h-pair">Pairs with</h3>
<div class="chem"><a class="mini{cls}" href="{p['slug']}.html"><b>{p['sym']}</b><small>{title}</small></a><span class="plus" aria-hidden="true">+</span><a class="mini{pc}" href="{ph}"><b>{ps}</b><small>{pn}</small></a></div>
<p style="color:var(--ink-2)">{pt}</p>
<a class="btn" href="#consult" style="width:100%">Book a consult</a>
</aside>
</div>
</section>
{gallery(m, p['name'])}{leaflets(m, p['name'])}

<section class="sec" id="consult" style="padding-top:0" aria-labelledby="h-consult">
<div class="wrap request">
<div>
<h2 id="h-consult">Book a consult</h2>
<p class="lede" style="margin-top:20px">Send the form and the Apex Slim team will contact you to set a time for your first visit.</p>
<a class="line-link" href="https://lin.ee/z7vQnrT" target="_blank" rel="noopener"><span class="qr">LINE</span><span><b>Chat on LINE</b>@apexslim</span></a>
</div>
<form class="form" id="request" data-goals="{p['goal']}" novalidate>
<div class="form-head"><b>Request form</b><span>Apex Slim and Longevity</span></div>
<div class="form-body">
<div class="row2">
<div class="field"><label for="f-name">Name</label><input id="f-name" name="name" autocomplete="name"></div>
<div class="field"><label for="f-contact">Phone or LINE ID</label><input id="f-contact" name="contact" autocomplete="tel"></div>
</div>
<fieldset class="field">
<legend>Goals</legend>
<div class="checks">
{checks}
</div>
</fieldset>
<div class="field"><label for="f-time">Best time to call</label>
<select id="f-time" name="time"><option>Weekday morning</option><option>Weekday afternoon</option><option>Weekday evening</option><option>Weekend</option></select>
</div>
<label class="consent"><input type="checkbox" name="consent">I agree to Apex Slim using these details to contact me about my consultation.</label>
<div><button class="btn" type="submit">Send request</button></div>
<p class="form-msg" role="status"></p>
</div>
</form>
</div>
</section>

</main>

<footer class="foot">
<div class="wrap">
<div><b>Apex Slim and Longevity</b><br>Part of the Apex Medical Center group.<br>Results may vary from person to person.</div>
<nav aria-label="Social">
<a href="https://lin.ee/z7vQnrT" target="_blank" rel="noopener">LINE</a>
<a href="https://www.instagram.com/apex_hospital_slim_wellness/" target="_blank" rel="noopener">Instagram</a>
<a href="https://www.facebook.com/apexlifecenter3/" target="_blank" rel="noopener">Facebook</a>
</nav>
</div>
</footer>

{JS}
</body>
</html>
"""


def notes():
    cards = []
    for p in PAGES:
        mins = max(1, math.ceil(words(p) / 200))
        h, t = p["note"]
        cards.append(f'      <a class="note" href="{p["slug"]}.html"><span class="tagline"><b>{p["sym"]}</b>{mins} min read</span><h3>{h}</h3><p>{t}</p></a>')
    cards.append('      <a class="note" href="lab.html"><span class="tagline"><b>Lab</b>Tool</span><h3>Check your BMI on the Thai scale</h3><p>Enter your height, weight and waist to see where you sit before your first visit.</p></a>')
    return "\n".join(cards)


def main():
    for p in PAGES:
        out = ROOT / f"{p['slug']}.html"
        out.write_text(page(p))
        print(f"{out.name:28} {words(p):5} words")
    idx = ROOT / "index.html"
    s = idx.read_text()
    s2, n = re.subn(r'(<div class="notes">\n).*?(\n    </div>)', lambda m: m.group(1) + notes() + m.group(2), s, flags=re.S)
    if n != 1:
        sys.exit("Lab Notes block not found in index.html")
    idx.write_text(s2)
    print("index.html Lab Notes refreshed")


if __name__ == "__main__":
    main()
