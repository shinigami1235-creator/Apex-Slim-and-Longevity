# CoolSculpting deck crops

Source: Apex's CoolSculpting Elite training deck (Allergan), Nov 2026. It's a staff deck, so only the parts a client can use went on the site.

How the crops were made:

1. `soffice --headless --convert-to pdf deck.pptx`, then `pdftoppm -r 150 -png deck.pdf s`.
2. On each slide, find the photo boxes with scipy `ndimage.label` on a non-white mask and keep boxes bigger than 120 x 90 px.
3. Save each box with PIL as WebP, quality 82.

What came out, all in `assets/img/tx/`:

- `ppt-area-02` to `ppt-area-11`: applicator placement per area (slides 2 to 11). Used in the "Areas and cycles" cards on the CoolSculpting page, listed in `tools/tx_media.py`.
- `ppt-case-14-*`, `15-*`, `16-*`, `20-*`, `21-*`, `22-*`: Allergan before and after cases with cycle counts. Used first in the CoolSculpting gallery, credited to Allergan.

Not used yet: slides 17 to 19 (good and poor outer-thigh candidates).
