# Pictures for the treatment pages, cut from the Apex posters Cindy sent in Nov 2026
# (tools/cindy_prep.py makes the files in assets/img/tx). Edit captions here.

CS_STAGES = ("Before", "4 weeks after the 1st session", "8 weeks after the 2nd session")

MEDIA = {
"one-week-one-kilo": dict(),

"coolsculpting": dict(
    leaflets=[17, 18, 19, 20],
    device=("device-coolsculpting-elite.webp", "The CoolSculpting Elite machine Apex uses, with two applicators."),
    gallery=dict(
        title="Case photos",
        note="From Apex's CoolSculpting Elite leaflets. Each case shows the same area before treatment, 4 weeks after the 1st session and 8 weeks after the 2nd.",
        cases=[(name, [(f"cs-{p}-{k}-{s}.webp", CS_STAGES[s]) for s in range(3)]) for p, k, name in [
            (18, 1, "Bra line"), (18, 2, "Upper arm"), (18, 3, "Lower belly and love handles"), (18, 4, "Love handles and bra line"),
            (19, 1, "Lower belly and love handles"), (19, 2, "Belly and flanks"), (19, 3, "Belly"), (19, 4, "Love handles")]],
    ),
),

"emsculpt-neo": dict(
    leaflets=[14, 15, 16],
    device=("device-emsculpt-neo.webp", "The Emsculpt Neo machine. The applicator on the left is strapped over the area."),
    gallery=dict(
        title="Case photos",
        note="From Apex's Emsculpt Neo leaflet: 12 weeks after the 4th treatment, photos courtesy of Arash Akhavan, M.D.",
        cases=[(f"Case {i}", [(f"em-{i:02d}-before.webp", "Before"), (f"em-{i:02d}-after.webp", "12 weeks after")]) for i in range(1, 11)],
    ),
),

"fit-firm": dict(
    leaflets=[8, 9, 10],
    gallery=dict(
        title="Case photos",
        note="From Apex's FIT FIRM leaflet.",
        cases=[("Belly", [("ff-1-before.webp", "Before: 31 inches"), ("ff-1-after.webp", "After: 29.5 inches")])],
    ),
),

"iv-therapy": dict(
    leaflets=[5, 6, 7],
),

"hbot": dict(
    leaflets=[1, 2, 3, 4],
    device=("device-hbot.webp", "The chamber at Apex. You lie inside and can see out through the window."),
),

"snorelase": dict(
    leaflets=[11, 12, 13],
    device=("device-snorelase-mouth.webp", "The laser treats the soft palate, the inside of the cheeks and the base of the tongue."),
),
}

LEAFLET_ALT = {
1: "HBOT leaflet: a woman floating in a bubble above the chamber",
2: "HBOT leaflet: Khun M, Khun Aye and Khun Chaya at the chambers",
3: "HBOT leaflet: who it suits",
4: "HBOT leaflet: the 60-minute program",
5: "Drip B-A-R menu in English",
6: "Drip B-A-R menu in Thai",
7: "Drip B-A-R menu with Premium NAD+",
8: "FIT FIRM leaflet: the program and its steps",
9: "FIT FIRM leaflet: areas and questions",
10: "FIT FIRM leaflet: before and after photos",
11: "Snorelase leaflet: why you snore",
12: "Snorelase leaflet: reviews from Ping Adison, Khun Lindy and Bew Kittipat",
13: "Snorelase leaflet: who it suits and the study",
14: "Emsculpt Neo leaflet: before and after photos",
15: "Emsculpt Neo leaflet: the machine and results",
16: "Emsculpt Neo leaflet: who it suits and the steps",
17: "CoolSculpting Elite leaflet: side effects and questions",
18: "CoolSculpting Elite leaflet: before and after photos",
19: "CoolSculpting Elite leaflet: more before and after photos",
20: "CoolSculpting Elite leaflet: how it works",
}
