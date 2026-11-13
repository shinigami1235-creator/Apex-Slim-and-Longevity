# Pictures for the treatment pages, cut from the Apex posters Cindy sent in Nov 2026
# (tools/cindy_prep.py makes the files in assets/img/tx). Edit captions here.

CS_STAGES = ("Before", "4 weeks after the 1st session", "8 weeks after the 2nd session")

MEDIA = {
"one-week-one-kilo": dict(),

"coolsculpting": dict(
    leaflets=[17, 18, 19, 20],
    areas=[  # from Allergan's treatment guide by area in Apex's CoolSculpting deck
        ("Belly", "4 to 8", "ppt-area-02.webp"), ("Flanks", "4 to 8", "ppt-area-03.webp"),
        ("Bra line", "4 to 6", "ppt-area-04.webp"), ("Upper arms", "2 to 4", "ppt-area-05.webp"),
        ("Inner thighs", "2 to 4", ["ppt-area-06.webp", "ppt-area-07.webp"], "Larger or smaller applicator, depending on the thigh."),
        ("Under the buttocks", "2 to 4", "ppt-area-08.webp"),
        ("Under the chin", "2 to 3", "ppt-area-09.webp"), ("Fat by the armpit", "2 to 4", "ppt-area-10.webp"),
        ("Above the knees", "4", "ppt-area-11.webp"), ("Outer thighs", "2", "ppt-good-0.webp", "Works best on a clear pocket of fat at the side."),
        ("Male chest", "2 to 4", "ppt-area-malechest.webp")],
    area_map="ppt-map.webp",
    plan=dict(
        title="Why the doctor plans the cycles",
        intro="Clinics used to give everyone the same plan, one cycle on each area. On some people that left a hard edge or a dip next to the treated spot. Now the number and placement of cycles is planned for each person, and the outer thighs show why picking the right person matters.",
        groups=[
            ("One cycle on each area, the old way",
             "These two cases had one cycle on the flank and one on the belly. The flank was left with a step at the edge and the belly with a dip around the navel.",
             [("ppt-s13-0.webp", "Flank, before"), ("ppt-s13-1.webp", "After one cycle"), ("ppt-s13-2.webp", "Belly, before"), ("ppt-s13-3.webp", "After one cycle")]),
            ("Outer thighs: who it suits",
             "The outer thighs respond well when the fat forms a clear pocket that sticks out at the side, marked with dots here. A thigh with no clear pocket or peak is a poor fit.",
             [("ppt-good-0.webp", "Good fit"), ("ppt-good-1.webp", "Good fit"), ("ppt-poor-0.webp", "Poor fit"), ("ppt-poor-1.webp", "Poor fit"), ("ppt-poor-2.webp", "Poor fit")]),
            ("Outer thighs: planned and not planned",
             "On the left, a good fit treated to plan. On the right, a thigh treated off the plan, which left an uneven result.",
             [("ppt-s17-0.webp", "Good fit, before"), ("ppt-s17-1.webp", "16 weeks after"), ("ppt-s17-2.webp", "Off the plan, before"), ("ppt-s17-3.webp", "12 weeks after")]),
        ],
        credit="Photos from Allergan, the maker of CoolSculpting. The good fit and poor fit photos are models. The one-cycle cases are from Kotlus and Mok, 2013.",
    ),
    device=("device-coolsculpting-elite.webp", "Our CoolSculpting Elite machine, with two applicators."),
    gallery=dict(
        title="Case photos",
        note="Each case is the same person before and after CoolSculpting. The first six photos are from Allergan, the maker of CoolSculpting.",
        cases=[
            ("Belly", [("ppt-case-14-0.webp", "Before"), ("ppt-case-14-1.webp", "3 months after the 2nd session")], "10 cycles over 2 sessions, 5 in each"),
            ("Flanks", [("ppt-case-15-0.webp", "Before"), ("ppt-case-15-1.webp", "17 weeks after the 2nd session")], "8 cycles over 2 sessions, 6 then 2"),
            ("Inner and outer thighs", [("ppt-case-16-0.webp", "Before"), ("ppt-case-16-1.webp", "19 weeks after the 2nd session")], "6 cycles over 2 sessions, 4 then 2"),
            ("Under the buttocks", [("ppt-case-20-0.webp", "Before, side"), ("ppt-case-20-1.webp", "27 weeks after the 2nd session"), ("ppt-case-20-2.webp", "Before, back"), ("ppt-case-20-3.webp", "27 weeks after the 2nd session")], "6 cycles over 2 sessions"),
            ("Under the chin", [("ppt-case-21-0.webp", "Before"), ("ppt-case-21-1.webp", "12 weeks after the session")], "2 cycles in 1 session"),
            ("Upper arms", [("ppt-case-22-0.webp", "Before"), ("ppt-case-22-1.webp", "11 weeks after the session")], "1 cycle on each arm"),
        ] + [(name, [(f"cs-{p}-{k}-{s}.webp", CS_STAGES[s]) for s in range(3)]) for p, k, name in [
            (18, 1, "Bra line"), (18, 2, "Upper arm"), (18, 3, "Lower belly and love handles"), (18, 4, "Love handles and bra line"),
            (19, 1, "Lower belly and love handles"), (19, 2, "Belly and flanks"), (19, 3, "Belly"), (19, 4, "Love handles")]],
    ),
),

"emsculpt-neo": dict(
    leaflets=[14, 15, 16],
    device=("device-emsculpt-neo.webp", "The Emsculpt Neo machine. The applicator on the left is strapped over the area."),
    gallery=dict(
        title="Case photos",
        note="Each case is the same person before and 12 weeks after the 4th treatment. Photos courtesy of Arash Akhavan, M.D.",
        cases=[(f"Case {i}", [(f"em-{i:02d}-before.webp", "Before"), (f"em-{i:02d}-after.webp", "12 weeks after")]) for i in range(1, 11)],
    ),
),

"fit-firm": dict(
    leaflets=[8, 9, 10],
    gallery=dict(
        title="Case photos",
        note="The belly measured around the navel before and after FIT FIRM.",
        cases=[("Belly", [("ff-1-before.webp", "Before: 31 inches"), ("ff-1-after.webp", "After: 29.5 inches")])],
    ),
),

"iv-therapy": dict(
    leaflets=[5, 6, 7],
),

"hbot": dict(
    leaflets=[1, 2, 3, 4],
    device=("device-hbot.webp", "Our chamber. You lie inside and can see out through the window."),
    people=dict(
        title="Our clients",
        note="Three of our clients who come in for HBOT.",
        items=[("hbot-client-m.webp", "Khun M", "คุณเอ็ม"), ("hbot-client-aye.webp", "Khun Aye", "คุณอาย"), ("hbot-client-chaya.webp", "Khun Chaya", "คุณชาญ่า")],
    ),
),

"snorelase": dict(
    leaflets=[11, 12, 13],
    device=("device-snorelase-mouth.webp", "The laser treats the soft palate, the inside of the cheeks and the base of the tongue."),
    reviews=dict(
        title="Reviews",
        note="Three of our clients on their Snorelase treatment. We translated their words from Thai, and the Thai is under each one.",
        items=[
            (1, "Ping Adison", "ปิ๊ง อดิสรณ์", "",
             "I saw real results from the very first session. Get it treated soon, and don't let it become a burden on the person next to you.",
             "เห็นผลจริงตั้งแต่ทำครั้งแรก รีบรักษาเถอะครับ อย่าปล่อยให้เป็นภาระคนข้างๆ"),
            (2, "Khun Lindy", "คุณลินดี้", "",
             "Women snore too, and it can be treated. It's easy, it doesn't hurt and it's over quickly. Very chill.",
             "ผู้หญิงก็กรนได้ และก็รักษาได้ ง่าย ไม่เจ็บ ทำแปปเดียว ชิลมากเลยค่ะ"),
            (3, "Bew Kittipat", "บิว กิตติพัฒน์", "Actor",
             "I was afraid of dying from snoring. I saw it happen to someone close to me, so I made a point of choosing the best treatment.",
             "กลัวตายจากการนอนกรน เห็นตัวอย่างจากคนใกล้ชิด เลยตั้งใจเลือกวิธีรักษาที่ดีที่สุด"),
        ],
    ),
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
