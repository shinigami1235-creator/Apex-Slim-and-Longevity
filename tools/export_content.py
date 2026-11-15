#!/usr/bin/env python3
"""Write wordpress/import/content.json: every editable text and picture of the site, for `wp slim import`.

Run from the repo root:  python3 tools/export_content.py
The treatment pages come from tools/tx_content.py, tx_body.py and tx_media.py. The home page, the lab,
the Results cases and the meals are copied here from index.html, lab.html and the scripts, so a change
to those files has to be made here too. The theme's check (wp slim check, tests/wordpress/compare.py)
fails when the WordPress pages and the static pages stop matching.
"""
import json, math, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from tx_content import PAGES  # noqa: E402
from tx_media import MEDIA, LEAFLET_ALT  # noqa: E402
from build_tx import words  # noqa: E402

TX = "img/tx/"

# what the home page tiles, the mixing bench and the body check say about each treatment
HOME_TILE = {'one-week-one-kilo': 'Weekly with the doctor', 'coolsculpting': '35 to 75 min per area', 'emsculpt-neo': '30 min, 4 to 6 sessions',
             'fit-firm': 'Cellulite and firmer skin', 'iv-therapy': '30 to 60 min drip', 'hbot': '60 min in the chamber', 'snorelase': '30 min, no cuts'}
BENCH = {
    'one-week-one-kilo': ('Weekly visits for 3 months or more', 'A weekly program prescribed by the doctor that works on the hunger that rises when you eat less.'),
    'coolsculpting': ('35 to 75 min per area', 'Cools a fold of fat until the fat cells in it die, and you go back to work the same day.'),
    'emsculpt-neo': ('30 min, 4 to 6 sessions', 'Heat and magnetic pulses work on fat and muscle in the same session.'),
    'fit-firm': ('20 min, cellulite and firmer skin', 'Radiofrequency warms the layer under the skin to smooth cellulite and firm loose skin.'),
    'iv-therapy': ('30 to 60 min drip', 'Vitamins, minerals and fluids through a drip, mixed by the doctor for your goal.'),
    'hbot': ('60 min in the chamber', 'You breathe pure oxygen in a pressurised chamber, which raises the oxygen carried in your blood.'),
    'snorelase': ('3 to 6 sessions, no cuts', 'A laser tightens the soft palate to reduce snoring, with no anaesthetic.'),
}
LONG_CARD = {
    'iv-therapy': 'Vitamins, minerals and fluids given through a drip in 30 to 60 minutes, mixed by the doctor for your goal.',
    'hbot': 'You breathe pure oxygen in a pressurised chamber for 60 minutes, which raises the oxygen carried in your blood.',
    'snorelase': 'A laser tightens the soft palate to reduce snoring over 3 to 6 sessions of about 30 minutes with no cuts and no anaesthetic.',
}
AREAS_INTRO = ('A cycle is one round of cooling on one spot. A bigger area takes more cycles since each applicator covers a set size, '
               'and the Elite can run two cycles at once. These are the usual starting numbers, and the doctor plans yours at the consult.')


def cells(lst):
    return [{'src': TX + f, 'cap': c} for f, c in lst]


def treatment(p, order):
    m = MEDIA.get(p['slug'], {})
    pair = next(q for q in PAGES if q['sym'] == p['pair'][0])
    t = {
        'key': p['slug'], 'order': order, 'name': p['name'], 'sym': p['sym'], 'cls': p['cls'], 'group': p['group'], 'goal': p['goal'],
        'tile': {'page': p['ft'], 'home': HOME_TILE[p['slug']]}, 'temp': list(p['temp']),
        'bench': {'time': BENCH[p['slug']][0], 'desc': BENCH[p['slug']][1]},
        'longCard': LONG_CARD.get(p['slug'], ''),
        'note': {'h': p['note'][0], 'p': p['note'][1], 'mins': max(1, math.ceil(words(p) / 200))},
        'desc': p['desc'], 'hook': p['hook'], 'protocol': [{'k': k, 'v': v} for k, v in p['protocol']],
        'extra': p.get('extra', ''), 'body': p['body'].strip(),
        'faq': [{'q': q, 'a': a} for q, a in p['faq']], 'refs': p['refs'],
        'pair': {'to': pair['slug'], 'text': p['pair'][4]},
    }
    if 'device' in m:
        t['device'] = {'src': TX + m['device'][0], 'cap': m['device'][1]}
    if 'gallery' in m:
        g = m['gallery']
        t['gallery'] = {'title': g['title'], 'note': g['note'],
                        'cases': [{'label': c[0], 'sub': c[2] if len(c) > 2 else '', 'cells': cells(c[1])} for c in g['cases']]}
    if 'areas' in m:
        t['areas'] = {'title': 'Areas and cycles', 'intro': AREAS_INTRO, 'map': TX + m['area_map'] if m.get('area_map') else '',
                      'items': [{'name': r[0], 'cycles': r[1], 'imgs': [TX + f for f in (r[2] if isinstance(r[2], list) else [r[2]])],
                                 'note': r[3] if len(r) > 3 else ''} for r in m['areas']]}
    if 'plan' in m:
        pl = m['plan']
        t['plan'] = {'title': pl['title'], 'intro': pl['intro'], 'credit': pl['credit'],
                     'groups': [{'h': h, 'text': x, 'cells': cells(c)} for h, x, c in pl['groups']]}
    if 'people' in m:
        pp = m['people']
        t['people'] = {'title': pp['title'], 'note': pp['note'], 'items': [{'src': TX + f, 'en': en, 'th': th} for f, en, th in pp['items']]}
    if 'reviews' in m:
        rv = m['reviews']
        t['reviews'] = {'title': rv['title'], 'note': rv['note'],
                        'items': [{'en': en, 'th': th, 'role': role, 'q': q, 'qth': qth,
                                   'face': f'{TX}snore-review-{i}-face.webp', 'tx': f'{TX}snore-review-{i}-tx.webp'} for i, en, th, role, q, qth in rv['items']]}
    if 'leaflets' in m:
        t['leaflets'] = [{'full': f'{TX}leaflet-{n:02d}.webp', 'thumb': f'{TX}leaflet-{n:02d}-t.webp', 'alt': LEAFLET_ALT[n]} for n in m['leaflets']]
    return t


def js_array(src, name):
    """The rows of a JS object literal like `const M = { Breakfast: [[...], ...], ... }` as Python data."""
    block = re.search(r'const ' + name + r' = (\{.*?\n  \});', src, re.S).group(1)
    block = re.sub(r'^(\s*)(\w+):', r'\1"\2":', block, flags=re.M)
    return json.loads(block.replace("'", '"'))


def cases():
    src = (ROOT / 'assets/js/results.js').read_text()
    out = []
    for m in re.finditer(r"\{ id: '([^']+)', title: '([^']+)', tx: \[(.*?)\],\s*before: '([^']+)', after: '([^']+)', raw: \['([^']+)', '([^']+)'\],(?: (wide): true,)? bdate: '([^']*)', adate: '([^']*)',\s*facts: \[(.*?)\], video: null, img: '([^']+)', imgCap: '([^']+)' \}", src, re.S):
        out.append({
            'key': m[1], 'title': m[2], 'tx': re.findall(r"sym: '(\w+)'", m[3]),
            'pod': ['img/results/' + m[4], 'img/results/' + m[5]], 'raw': ['img/' + m[6], 'img/' + m[7]], 'wide': bool(m[8]),
            'bdate': m[9], 'adate': m[10], 'facts': [{'k': a, 'v': b} for a, b in re.findall(r"\['([^']+)', '([^']+)'\]", m[11])],
            'video': '', 'img': m[12].replace('assets/', ''), 'imgCap': m[13],
        })
    if len(out) != 4:
        sys.exit(f'expected 4 Results cases in results.js, found {len(out)}')
    return out


def meals():
    src = (ROOT / 'assets/js/meals.js').read_text()
    block = re.search(r'const M = \{(.*?)\n  \};', src, re.S).group(1)
    out = []
    for meal, rows in re.findall(r"(\w+): \[(.*?)\n    \]", block + "\n", re.S):
        out.append({'meal': meal, 'dishes': [{'en': a, 'th': b, 'tip': c} for a, b, c in re.findall(r"\['((?:[^'\\]|\\.)*)', '((?:[^'\\]|\\.)*)', '((?:[^'\\]|\\.)*)'\]", rows)]})
    for x in out:
        for d in x['dishes']:
            for k in d: d[k] = d[k].replace("\\'", "'")
    return out


SETTINGS = {
    'brand': 'Apex Slim', 'brandSmall': 'and Longevity', 'siteName': 'Apex Slim and Longevity',
    'groupLine': 'Part of the Apex Medical Center group.', 'vary': 'Results may vary from person to person.',
    'line': {'id': '@apexslim', 'url': 'https://lin.ee/z7vQnrT'},
    'socials': [{'x': 'LINE', 'h': 'https://lin.ee/z7vQnrT'}, {'x': 'Instagram', 'h': 'https://www.instagram.com/apex_hospital_slim_wellness/'},
                {'x': 'Facebook', 'h': 'https://www.facebook.com/apexlifecenter3/'}],
    'consult': {'h': 'Book a consult', 'p': 'Send the form and the Apex Slim team will contact you to set a time for your first visit.',
                'formHead': 'Request form', 'consent': 'I agree to Apex Slim using these details to contact me about my consultation.',
                'times': ['Weekday morning', 'Weekday afternoon', 'Weekday evening', 'Weekend'],
                'sent': 'Thank you. The Apex Slim team will contact you soon.'},
    'notify': '', 'keepDays': 365, 'permit': '', 'company': 'APEX Medical Center Co., Ltd.',
}

HOME = {
    'seoTitle': 'Apex Slim and Longevity | Slim science and wellness',
    'seoDesc': 'Body fat, muscle tone, energy and sleep treatments at Apex Slim and Longevity, part of the Apex Medical Center group. CoolSculpting, Emsculpt Neo, 1 Week 1 Kilo, FIT FIRM, IV Therapy, HBOT and Snorelase.',
    'h1': 'Slim science and wellness',
    'lede': 'Apex Slim and Longevity treats body fat, muscle tone and the health behind them, and is part of the Apex Medical Center group.',
    'shelf': 'Tap the ingredients you want, then mix them.',
    'rxIntro': 'These treatments match the goals you picked. At your first visit the doctor reads your body composition scan with you and confirms which of them suit you.',
    'txH': 'Treatments', 'txP': 'Tap a treatment to see how it works, how long a session takes and what to expect after.',
    'ask': {'nm': 'Not sure which?', 'ft': 'Start with a body scan'},
    'visit': {'h': 'Your first visit', 'p': 'Every plan at Apex Slim starts with a body composition scan and a doctor consultation since the scan shows how much of your weight is fat, muscle and water.',
              'slipH': 'First visit', 'slipTag': 'Included in every plan',
              'steps': [{'b': 'Body composition scan', 's': 'Fat mass, muscle mass and body water, measured on the day.'},
                        {'b': 'Doctor consultation', 's': 'The doctor reads the scan with you and goes over your health history.'},
                        {'b': 'Plan with a nutritionist', 's': 'Meals and treatment sessions planned around your week.'}]},
    'longH': 'Longevity', 'longP': 'Longevity at Apex Slim covers recovery, energy and sleep, and each treatment can run alongside a slimming plan.',
    'resultsH': 'Results', 'resultsP': 'Pick a case and the pod runs it, then sends the before and after to the terminal.',
    'notesH': 'Lab Notes', 'notesP': 'How each treatment works, how long it takes and what to expect after.',
    'labNote': {'h': 'Check your BMI on the Thai scale', 'p': 'Enter your height, weight and waist to see where you sit before your first visit.'},
    'playH': 'Slim Wellness Lab', 'playP': 'Check your BMI and waist on the Thai scale and see a 3D body built from your numbers. Games and more tools are being added to the lab.',
    'playBtn': 'Open the lab',
}

LAB = {
    'seoTitle': 'Slim Wellness Lab | Apex Slim and Longevity',
    'h1': 'Slim Wellness Lab',
    'lede': 'Tools to try before your first visit. Start with the body check, then book a consult with what it suggests.',
    'bcP': 'Enter your height, weight and waist to see your BMI on the Thai scale and a 3D body built from your numbers. It lists programs to ask the doctor about, since only the doctor can say which suit you.',
    'bcHint': 'Measure your waist around your belly button in the morning, before you eat.',
    'bcSmall': 'Every plan at Apex Slim starts with a body composition scan and a doctor consultation. This check is a guide, not a diagnosis.',
    'gpP': "Pick a front photo of your face or body and set how slim you'd like to be. Your photo stays on this device and nothing is uploaded or saved.",
    'gpDisc': "This is a goal you set, not a predicted result. Your doctor will tell you what's realistic for you.",
    'mlP': 'A healthy Thai breakfast, lunch, dinner and snack for each day, built on the 2:1:1 plate: two parts vegetables, one part rice or noodles and one part protein.',
    'plate': 'Half the plate vegetables, a quarter rice or noodles, a quarter fish, chicken, egg or tofu. Ask for less sugar, oil and sauce when you order.',
    'mlSmall': "Sample menu. Apex's nutritionist checks the list before the site goes live.",
}


def main():
    lab_html = (ROOT / 'lab.html').read_text()
    m = re.search(r'<meta name="description" content="([^"]+)"', lab_html)
    lab = dict(LAB, seoDesc=m[1], meals=meals())
    data = {'version': 1, 'settings': SETTINGS, 'home': HOME, 'lab': lab,
            'treatments': [treatment(p, i) for i, p in enumerate(PAGES)], 'cases': cases()}
    out = ROOT / 'wordpress' / 'import' / 'content.json'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, ensure_ascii=False, indent=1))
    print(out.relative_to(ROOT), f"{len(data['treatments'])} treatments, {len(data['cases'])} cases, {sum(len(x['dishes']) for x in lab['meals'])} dishes")


if __name__ == '__main__':
    main()
