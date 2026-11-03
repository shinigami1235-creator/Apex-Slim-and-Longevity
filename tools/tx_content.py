# Treatment article content for tools/build_tx.py.
# Each entry builds one page. Edit the text here, then run:
#   python3 tools/build_tx.py
# The article wording (hook, body, FAQ, descriptions) lives in tools/tx_body.py.
# This file holds the tile, the session table, the pairing and the sources.

APEX = "https://www.apexmedicalcenter.co.th/"

ICONS = {
    "Wk": '<rect x="3.5" y="4" width="17" height="16" rx="4"/><path d="M8 9.5a4 4 0 0 1 8 0"/><path d="M12 9.5l2-2.2"/><path d="M8 16h8"/>',
    "Cs": '<path d="M12 2.5v19M3.8 7.2l16.4 9.6M3.8 16.8l16.4-9.6"/><path d="M9.5 4l2.5 2.5L14.5 4M9.5 20l2.5-2.5 2.5 2.5M4.3 11l3.4 1-1 3.4M19.7 13l-3.4-1 1-3.4"/>',
    "En": '<path d="M13.5 2.5 5.5 13.5h6l-1 8 8-11h-6z"/>',
    "Ff": '<path d="M6 8.5v7M18 8.5v7M3.5 10v4M20.5 10v4M6 12h12"/>',
    "Iv": '<path d="M7 3.5h10v8.5a5 5 0 0 1-10 0z"/><path d="M7 8h10M12 17v2.5M12 19.5c0 1.4 1 2 2.5 2"/><path d="M10 11.5h4"/>',
    "Hb": '<circle cx="9" cy="14" r="5.5"/><circle cx="17" cy="7.5" r="3.5"/><circle cx="18.5" cy="16.5" r="2"/><path d="M7.4 12.4a2.3 2.3 0 0 1 2.4-1"/>',
    "Sl": '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/><path d="M15 3.5h4l-4 4h4"/>',
}

from tx_body import TEXT

PAGES = [
dict(
slug='one-week-one-kilo',
sym='Wk',
cls='',
group='treatments',
name='1 Week 1 Kilo',
ft='Doctor-led weight loss',
temp=('Weight loss', 'Weekly with the doctor'),
goal='weight',
protocol=[('Visits', 'Once a week with the doctor'), ('First visit', 'Body composition scan, BMI and waist on the Asian scale, and your goals'), ('Plan length', 'At least 3 months'), ('First change', 'Weight often starts to drop in 2 to 4 weeks'), ('Suits', 'BMI 30 or more, or overweight with a related condition such as diabetes or high blood pressure'), ('Downtime', 'None')],
pair_to=('Cs', 'CoolSculpting', 'coolsculpting.html', 'cold'),
refs=[
'Sumithran P, Prendergast LA, Delbridge E, et al. Long-term persistence of hormonal adaptations to weight loss. <i>N Engl J Med</i>. 2011;365(17):1597-1604. <a href="https://doi.org/10.1056/NEJMoa1105816" target="_blank" rel="noopener">doi:10.1056/NEJMoa1105816</a>',
'WHO Expert Consultation. Appropriate body-mass index for Asian populations and its implications for policy and intervention strategies. <i>Lancet</i>. 2004;363(9403):157-163. <a href="https://pubmed.ncbi.nlm.nih.gov/14726171/" target="_blank" rel="noopener">PubMed 14726171</a>',
'Apex Medical Center. Weight-loss program and obesity articles. <a href="https://www.apexmedicalcenter.co.th/" target="_blank" rel="noopener">apexmedicalcenter.co.th</a>',
],
),
dict(
slug='coolsculpting',
sym='Cs',
cls='cold',
group='treatments',
name='CoolSculpting',
ft='Fat freezing, also called cryolipolysis',
temp=('Slimming', 'No needles, no cuts'),
goal='fat',
protocol=[('Session time', 'About 35 minutes per area'), ('Sessions', 'Often 1 per area, with 2 or 3 if needed, spaced 1 to 3 months apart'), ('Downtime', 'Back to work the same day'), ('After', 'Redness, numbness and tingling that fade within a few days to 2 weeks'), ('Results', 'Show over 1 to 3 months'), ('Areas', '<div class="chips"><span>Belly</span><span>Flanks</span><span>Inner thighs</span><span>Outer thighs</span><span>Upper arms</span><span>Under the chin</span><span>Bra line</span><span>Back</span><span>Under the buttocks</span></div>')],
extra='stages',
pair_to=('En', 'Emsculpt Neo', 'emsculpt-neo.html', ''),
refs=[
'Manstein D, Laubach H, Watanabe K, Farinelli W, Zurakowski D, Anderson RR. Selective cryolysis: a novel method of non-invasive fat removal. <i>Lasers Surg Med</i>. 2008;40(9):595-604. <a href="https://doi.org/10.1002/lsm.20719" target="_blank" rel="noopener">doi:10.1002/lsm.20719</a>',
'Ingargiola MJ, Motakef S, Chung MT, Vasconez HC, Sasaki GH. Cryolipolysis for fat reduction and body contouring: safety and efficacy of current treatment paradigms. <i>Plast Reconstr Surg</i>. 2015;135(6):1581-1590. <a href="https://pubmed.ncbi.nlm.nih.gov/26017594/" target="_blank" rel="noopener">PubMed 26017594</a>',
'Jalian HR, Avram MM, Garibyan L, Mihm MC, Anderson RR. Paradoxical adipose hyperplasia after cryolipolysis. <i>JAMA Dermatol</i>. 2014;150(3):317-319.',
'Apex Medical Center. CoolSculpting service page. <a href="https://www.apexmedicalcenter.co.th/" target="_blank" rel="noopener">apexmedicalcenter.co.th</a>',
],
),
dict(
slug='emsculpt-neo',
sym='En',
cls='',
group='treatments',
name='Emsculpt Neo',
ft='Heat and magnetic pulses for fat and muscle',
temp=('Slimming', 'No needles, no cuts'),
goal='tone',
protocol=[('Session time', '30 minutes per area'), ('Sessions', 'At least 4 to 6, spaced 2 to 3 days apart'), ('Feels like', 'Warmth with strong muscle contractions'), ('Downtime', 'None, with tired muscles like after a workout'), ('Results', 'Build over 3 months'), ('Areas', '<div class="chips"><span>Belly</span><span>Buttocks</span><span>Upper arms</span><span>Thighs</span><span>Calves</span></div>')],
pair_to=('Cs', 'CoolSculpting', 'coolsculpting.html', 'cold'),
refs=[
'Jacob C, Kent D, Ibrahim O. Efficacy and safety of simultaneous application of HIFEM and synchronized radiofrequency for abdominal fat reduction and muscle toning: a multicenter magnetic resonance imaging evaluation study. <i>Dermatol Surg</i>. 2021;47(7):969-973. <a href="https://doi.org/10.1097/DSS.0000000000003086" target="_blank" rel="noopener">doi:10.1097/DSS.0000000000003086</a>',
'Samuels JB, Katz B, Weiss RA. Radiofrequency heating and high-intensity focused electromagnetic treatment delivered simultaneously: the first sham-controlled randomized trial. <i>Plast Reconstr Surg</i>. 2022;149(5):893e-900e. <a href="https://doi.org/10.1097/PRS.0000000000009030" target="_blank" rel="noopener">doi:10.1097/PRS.0000000000009030</a>',
'Apex Medical Center. Emsculpt service page. <a href="https://www.apexmedicalcenter.co.th/" target="_blank" rel="noopener">apexmedicalcenter.co.th</a>',
],
),
dict(
slug='fit-firm',
sym='Ff',
cls='',
group='treatments',
name='FIT FIRM',
ft='Radiofrequency with muscle stimulation',
temp=('Firming', 'No needles, no cuts'),
goal='firm',
protocol=[('Energy', 'Radiofrequency with electromagnetic muscle stimulation'), ('Sessions', 'A course set by the doctor after looking at the area'), ('Feels like', 'Warmth with rhythmic muscle tightening'), ('Downtime', 'None'), ('Results', 'Build over the weeks after your sessions'), ('Areas', '<div class="chips"><span>Belly</span><span>Thighs</span><span>Upper arms</span></div>')],
pair_to=('Wk', '1 Week 1 Kilo', 'one-week-one-kilo.html', ''),
refs=[
'Dayan E, Chilukuri S, Bucky L, Bharti G, Gold MH, Rohrich R. Combination non-invasive radiofrequency and electrical muscle stimulation: a synergistic combination for body contouring. <i>J Cosmet Dermatol</i>. 2022;21 Suppl 1:S29-S36. <a href="https://doi.org/10.1111/jocd.15393" target="_blank" rel="noopener">doi:10.1111/jocd.15393</a>',
'Apex Slim. FIT FIRM promotion and Slim Shape contouring page. <a href="https://www.apexmedicalcenter.co.th/" target="_blank" rel="noopener">apexmedicalcenter.co.th</a>',
],
),
dict(
slug='iv-therapy',
sym='Iv',
cls='long',
group='longevity',
name='IV Therapy',
ft='Vitamins and fluids by drip',
temp=('Longevity', '30 to 60 minutes'),
goal='energy',
protocol=[('Drip time', '30 to 60 minutes'), ('Before', 'Health check and blood pressure, with blood tests when needed'), ('What goes in', 'Fluids, salts and vitamins mixed by the doctor for your goal'), ('Downtime', 'None'), ('After', 'Sometimes a small bruise where the needle went in')],
pair_to=('Hb', 'HBOT', 'hbot.html', 'long'),
refs=[
'Padayatty SJ, Sun H, Wang Y, et al. Vitamin C pharmacokinetics: implications for oral and intravenous use. <i>Ann Intern Med</i>. 2004;140(7):533-537. <a href="https://pubmed.ncbi.nlm.nih.gov/15068981/" target="_blank" rel="noopener">PubMed 15068981</a>',
'Cleveland Clinic. Is IV vitamin therapy worth it? <i>Health Essentials</i>. <a href="https://health.clevelandclinic.org/iv-vitamin-therapy" target="_blank" rel="noopener">health.clevelandclinic.org</a>',
'Apex Medical Center. Vitamin drip page. <a href="https://www.apexmedicalcenter.co.th/" target="_blank" rel="noopener">apexmedicalcenter.co.th</a>',
],
),
dict(
slug='hbot',
sym='Hb',
cls='long',
group='longevity',
name='HBOT',
ft='Hyperbaric oxygen therapy',
temp=('Longevity', '60 to 90 minutes'),
goal='energy',
protocol=[('Session time', '60 to 90 minutes in the chamber'), ('Pressure', '2 to 3 times normal air pressure'), ('You breathe', 'Pure oxygen through a mask or hood'), ('Feels like', 'Ear pressure like a plane coming in to land, then quiet'), ('Downtime', 'None'), ('Before', 'A doctor checks your ears, lungs and medicines')],
pair_to=('Iv', 'IV Therapy', 'iv-therapy.html', 'long'),
refs=[
'US Food and Drug Administration. Hyperbaric oxygen therapy: get the facts. <a href="https://www.fda.gov/consumers/consumer-updates/hyperbaric-oxygen-therapy-get-facts" target="_blank" rel="noopener">fda.gov</a>',
'Thom SR. Hyperbaric oxygen: its mechanisms and efficacy. <i>Plast Reconstr Surg</i>. 2011;127 Suppl 1:131S-141S. <a href="https://doi.org/10.1097/PRS.0b013e3181fbe2bf" target="_blank" rel="noopener">doi:10.1097/PRS.0b013e3181fbe2bf</a>',
'Hachmo Y, Hadanny A, Abu Hamed R, et al. Hyperbaric oxygen therapy increases telomere length and decreases immunosenescence in isolated blood cells: a prospective trial. <i>Aging (Albany NY)</i>. 2020;12(22):22445-22456. <a href="https://doi.org/10.18632/aging.202188" target="_blank" rel="noopener">doi:10.18632/aging.202188</a>',
],
),
dict(
slug='snorelase',
sym='Sl',
cls='long',
group='longevity',
name='Snorelase',
ft='Laser treatment for snoring',
temp=('Longevity', 'No cuts, no anaesthetic'),
goal='sleep',
protocol=[('Session time', 'About 30 minutes'), ('Sessions', '3 to 6'), ('Anaesthetic', 'None needed'), ('Downtime', 'None'), ('After', 'A mild dry or scratchy throat'), ('Treats', 'Snoring, once sleep apnoea has been ruled out')],
pair_to=('Wk', '1 Week 1 Kilo', 'one-week-one-kilo.html', ''),
refs=[
'Picavet VA, Dellian M, Gehrking E, Sauter A, Hasselbacher K. Treatment of snoring using a non-invasive Er:YAG laser with SMOOTH mode (NightLase): a randomized controlled trial. <i>Eur Arch Otorhinolaryngol</i>. 2023;280(1):307-312. <a href="https://doi.org/10.1007/s00405-022-07539-9" target="_blank" rel="noopener">doi:10.1007/s00405-022-07539-9</a>',
'Neruntarat C, Khuancharee K, Shoowit P. Er:YAG laser for snoring: a systemic review and meta-analysis. <i>Lasers Med Sci</i>. 2020;35(6):1231-1238. <a href="https://doi.org/10.1007/s10103-020-02987-3" target="_blank" rel="noopener">doi:10.1007/s10103-020-02987-3</a>',
'Dembicka-Mączka D, Gryka-Deszczyńska M, Sitkiewicz J, Makara A, Fiegler-Rudol J, Wiench R. Effectiveness of the Er:YAG laser in snoring treatment based on systematic review and meta-analysis results. <i>J Clin Med</i>. 2025;14(12):4371. <a href="https://doi.org/10.3390/jcm14124371" target="_blank" rel="noopener">doi:10.3390/jcm14124371</a>',
'Apex Medical Center. SnoreLase page. <a href="https://www.apexmedicalcenter.co.th/" target="_blank" rel="noopener">apexmedicalcenter.co.th</a>',
],
),
]

for _p in PAGES:
    _t = TEXT[_p["slug"]]
    _p.update(desc=_t["desc"], note=_t["note"], hook=_t["hook"], body=_t["body"], faq=_t["faq"],
              pair=(*_p.pop("pair_to"), _t["pair"]))
