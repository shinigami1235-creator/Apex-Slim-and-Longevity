#!/usr/bin/env python3
"""Cut the second batch of Apex material (Nov 2026, folder "Material Slim & Wellness" from Cindy)
into site images. Boxes are fractions of each poster: (left, top, right, bottom).
Run: python3 tools/cindy2_prep.py [source folder]
"""
import sys
from pathlib import Path
from PIL import Image

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else
           '/mnt/user-data/uploads/Apex Slim and Longevity/From Cindy/Material Slim & Wellness')
OUT = Path(__file__).resolve().parent.parent / 'assets/img/tx'
OUT.mkdir(parents=True, exist_ok=True)


def cut(rel, box, name, maxw=900):
    im = Image.open(SRC / rel).convert('RGB')
    w, h = im.size
    c = im.crop((round(box[0] * w), round(box[1] * h), round(box[2] * w), round(box[3] * h)))
    c.thumbnail((maxw, maxw), Image.LANCZOS)
    c.save(OUT / name, 'WEBP', quality=84, method=6)
    return c


# Exomind: the coil in use, and two posters as leaflets 21 and 22
cut('Exomind/Exomind-3-Pic_1.3.png', (0.0, 0.29, 1.0, 0.82), 'device-exomind.webp', 1000)
for n, rel in ((21, 'Exomind/ExoMind-02.png'), (22, 'Exomind/Exomind-3-Pic_1.3.png')):
    p = Image.open(SRC / rel).convert('RGB')
    a = p.copy(); a.thumbnail((1400, 1400), Image.LANCZOS); a.save(OUT / f'leaflet-{n:02d}.webp', 'WEBP', quality=80, method=6)
    t = p.copy(); t.thumbnail((420, 420), Image.LANCZOS); t.save(OUT / f'leaflet-{n:02d}-t.webp', 'WEBP', quality=76, method=6)

# FIT FIRM: Apex's own album, measured before and straight after one session
FF = 'Before After/FitFirm/LINE_ALBUM_FitFirm_261017_{}.jpg'
FF_BOX = {
    12: ((0.035, 0.20, 0.465, 0.72), (0.535, 0.20, 0.965, 0.72)),
    14: ((0.10, 0.22, 0.46, 0.68), (0.56, 0.22, 0.92, 0.68)),
    18: ((0.045, 0.225, 0.49, 0.575), (0.52, 0.225, 0.96, 0.575)),
    20: ((0.055, 0.26, 0.49, 0.61), (0.51, 0.26, 0.94, 0.61)),
    6: ((0.045, 0.23, 0.49, 0.59), (0.52, 0.23, 0.96, 0.59)),
}
for n, (b, a) in FF_BOX.items():
    cut(FF.format(n), b, f'ffa-{n}-before.webp')
    cut(FF.format(n), a, f'ffa-{n}-after.webp')

# CoolSculpting: Apex clients, THEN and NOW photos from their posters. คุณนุ่น's pair was taken straight after the session, on purpose.
CS = {'uan': 'ครูอ้วน', 'khun': 'คุณขุน', 'noon': 'คุณนุ่น', 'kelly': 'คุณเคลลี่'}
for slug, thai in CS.items():
    rel = f'CoolSculpting/Resize Coolsculpting Elite {thai}_0.png'
    cut(rel, (0.045, 0.38, 0.475, 0.68), f'csa-{slug}-then.webp')
    cut(rel, (0.045, 0.69, 0.475, 0.97), f'csa-{slug}-now.webp')

# Emsculpt Neo: Apex client คุณอั้ม, before and straight after the session
cut('Emsculpt/Emsculpt Neo_1080x1350 V2-04.png', (0.10, 0.26, 0.39, 0.51), 'ema-1-before.webp')
cut('Emsculpt/Emsculpt Neo_1080x1350 V2-04.png', (0.10, 0.53, 0.39, 0.76), 'ema-1-after.webp')

# FIT FIRM brochure page 3 (leaflet 10): the arm and thigh labels were on the wrong photos. Swap them so the arm
# reads 11 to 10 inches and the thigh 21.8 to 21, then write leaflet 10 again. Run after tools/cindy_prep.py.
ff = Image.open(SRC / 'FitFirm/information/170825_Sale_Kit_Data_โปรแกรม_Fit_Firm-03.png').convert('RGB')
Y = {2: (1152, 1199), 3: (1626, 1673)}; X = {'b': (267, 528), 'a': (704, 965)}
inner = lambda c, r: (X[c][0] + 4, Y[r][0] + 3, X[c][1] - 4, Y[r][1] - 3)
fixed = ff.copy()
for src, dst in ((('b', 3), ('b', 2)), (('b', 2), ('a', 2)), (('a', 3), ('b', 3)), (('a', 2), ('a', 3))):
    fixed.paste(ff.crop(inner(*src)), inner(*dst)[:2])
fixed.save(OUT.parent.parent.parent / 'tools/cindy_notes/fit-firm-page3-fixed.png')
a = fixed.copy(); a.thumbnail((1400, 1400), Image.LANCZOS); a.save(OUT / 'leaflet-10.webp', 'WEBP', quality=80, method=6)
t = fixed.copy(); t.thumbnail((420, 420), Image.LANCZOS); t.save(OUT / 'leaflet-10-t.webp', 'WEBP', quality=76, method=6)

# 1 Week 1 Kilo: Apex clients, the two photos without the poster's headline
WK = {43: 'คุณชมพู่', 44: 'คุณน้ำ', 45: 'คุณลิตเติ้ล', 46: 'คุณเจมส์', 47: 'คุณเจเจ', 48: 'คุณแพรววา', 49: 'คุณแอ๊ป', 50: 'เชฟป้อม'}
for n, thai in WK.items():
    cut(f'Before After/1 Week 1 Kilo (Hero Product)/{thai}_1W1K คลิกเดียวลดได้_1 ต่อ 1_0.png',
        (0.06, 0.29, 0.94, 0.95), f'wk-{n}.webp')

# Our doctors: the group photo without the APEX title and the caption plates
d = Image.open(SRC / '_Introduction/รวมหมอ_1920x1080_0.png').convert('RGB')
w, h = d.size
d = d.crop((round(0.13 * w), round(0.235 * h), round(0.89 * w), round(0.775 * h)))
d.thumbnail((1500, 1500), Image.LANCZOS)
d.save(OUT.parent / 'doctors.webp', 'WEBP', quality=84, method=6)
