#!/usr/bin/env python3
"""Cut Cindy's Apex posters (Nov 2026) into site images.

Source posters: assets/From Cindy on Gid's laptop, copied to /home/claude/cindy/src/01..20.jpg
(the album's images 21 to 40 are duplicates of 1 to 20). Boxes come from the transcription
notes in tools/cindy_notes/. Run: python3 tools/cindy_prep.py
"""
from pathlib import Path
from PIL import Image, ImageFilter
SRC = Path('/home/claude/cindy/src')
OUT = Path(__file__).resolve().parent.parent / 'assets/img/tx'
RES = Path(__file__).resolve().parent.parent / 'assets/img/results'
OUT.mkdir(parents=True, exist_ok=True)
im = lambda n: Image.open(SRC / f'{n:02d}.jpg').convert('RGB')

def save(img, name, q=82):
    img.save(OUT / name, 'WEBP', quality=q, method=6)

# leaflets: full poster and thumbnail
for n in range(1, 21):
    p = im(n); a = p.copy(); a.thumbnail((1400, 1400), Image.LANCZOS); save(a, f'leaflet-{n:02d}.webp', 80)
    t = p.copy(); t.thumbnail((420, 420), Image.LANCZOS); save(t, f'leaflet-{n:02d}-t.webp', 76)

def crop(n, box, name, maxw=900):
    c = im(n).crop(box); c.thumbnail((maxw, maxw), Image.LANCZOS); save(c, name, 86); return c

# machines
crop(15, (78, 958, 590, 1668), 'device-emsculpt-neo.webp')
crop(20, (740, 205, 1232, 1052), 'device-coolsculpting-elite.webp')
crop(1, (250, 1400, 1415, 1850), 'device-hbot.webp', 1200)
crop(4, (310, 590, 1340, 1490), 'device-hbot-render.webp')
crop(13, (404, 52, 554, 208), 'device-snorelase-mouth.webp')

# before and after cells
EM = [((46,385,320,566),(322,385,597,566)), ((642,385,916,566),(918,385,1193,566)),
      ((46,655,320,836),(322,655,597,836)), ((642,655,916,836),(918,655,1193,836)),
      ((46,925,320,1106),(322,925,597,1106)), ((642,925,916,1106),(918,925,1193,1106)),
      ((46,1195,320,1376),(322,1195,597,1376)), ((642,1195,916,1376),(918,1195,1193,1376)),
      ((46,1465,320,1646),(322,1465,597,1646)), ((642,1465,916,1646),(918,1465,1193,1646))]
for i, (b, a) in enumerate(EM, 1):
    crop(14, b, f'em-{i:02d}-before.webp'); crop(14, a, f'em-{i:02d}-after.webp')
COL = [(276, 595), (832, 1151)]; ROW = [[(401, 576), (598, 773), (795, 970)], [(1094, 1269), (1292, 1466), (1489, 1663)]]
for poster in (18, 19):
    k = 0
    for r in range(2):
        for c in range(2):
            k += 1
            for s, (y0, y1) in enumerate(ROW[r]):
                crop(poster, (COL[c][0], y0, COL[c][1], y1), f'cs-{poster}-{k}-{s}.webp')
crop(10, (232, 350, 580, 676), 'ff-1-before.webp'); crop(10, (662, 350, 1008, 676), 'ff-1-after.webp')
crop(10, (232, 822, 581, 1150), 'ff-2-before.webp'); crop(10, (662, 822, 1010, 1150), 'ff-2-after.webp')
crop(10, (232, 1298, 581, 1626), 'ff-3-before.webp'); crop(10, (662, 1298, 1010, 1626), 'ff-3-after.webp')

# Results machine: subject fitted in the middle of a 600x900 frame on a blurred copy of itself,
# inside the 600x717 band that both the 2:3 pod and the 540:645 panel show
def pod(n, box, name):
    s = im(n).crop(box)
    # fill with the photo's own corner colour so it reads as one print
    px = [s.getpixel(q) for q in ((2, 2), (s.width - 3, 2), (2, s.height - 3), (s.width - 3, s.height - 3))]
    bg = Image.new('RGB', (600, 900), tuple(sum(c[i] for c in px) // 4 for i in range(3)))
    f = s.copy(); f.thumbnail((580, 700), Image.LANCZOS)
    if f.width < 580:
        sc = min(580 / s.width, 700 / s.height); f = s.resize((int(s.width*sc), int(s.height*sc)), Image.LANCZOS)
    bg.paste(f, ((600 - f.width)//2, (900 - f.height)//2))
    bg.save(RES / name, 'WEBP', quality=86, method=6)
pod(19, (832, 401, 1151, 576), 'cs-abdomen-flanks-before.webp'); pod(19, (832, 795, 1151, 970), 'cs-abdomen-flanks-after.webp')
pod(18, (276, 401, 595, 576), 'cs-bra-before.webp'); pod(18, (276, 795, 595, 970), 'cs-bra-after.webp')
pod(14, EM[0][0], 'em-1-before.webp'); pod(14, EM[0][1], 'em-1-after.webp')
pod(10, (232, 350, 580, 676), 'ff-abdomen-before.webp'); pod(10, (662, 350, 1008, 676), 'ff-abdomen-after.webp')
print('done')
