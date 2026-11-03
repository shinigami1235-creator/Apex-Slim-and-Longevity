# Treatment article content for tools/build_tx.py.
# Each entry builds one page. Edit the text here, then run:
#   python3 tools/build_tx.py
# Body HTML goes inside .prose. FAQ is a list of (question, answer).
# Sources print at the bottom of the article under "Sources".

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

PAGES = [

# ---------------------------------------------------------------- 1 Week 1 Kilo
dict(
slug="one-week-one-kilo", sym="Wk", cls="", group="treatments",
name="1 Week 1 Kilo", ft="Doctor-led weight loss",
temp=("Weight loss", "Weekly with the doctor"),
goal="weight",
desc="1 Week 1 Kilo at Apex Slim and Longevity: a weight-loss plan run by a doctor who sees you every week and works on the hunger that brings weight back.",
note=("Why weight comes back after a diet", "Hunger rises when you eat less, and the 1 Week 1 Kilo plan works on that hunger."),
hook=[
"If you have lost weight before and watched it come back, willpower was probably not the problem. When you eat less, your body raises the hormone that makes you hungry and lowers the ones that make you feel full, and it keeps doing this long after the diet ends.",
"In a study in the New England Journal of Medicine, 50 people lost an average of 13.5 kg on a 10-week diet. A year later their hunger hormones had still not gone back to normal and they felt hungrier than before they started. 1 Week 1 Kilo is a weight-loss plan run by a doctor who sees you every week and treats that hunger as part of the problem.",
],
protocol=[
("Visits", "Once a week with the doctor"),
("First visit", "Body composition scan, BMI and waist on the Asian scale, and your goals"),
("Plan length", "At least 3 months"),
("First change", "Weight often starts to drop in 2 to 4 weeks"),
("Suits", "BMI 30 or more, or overweight with a related condition such as diabetes or high blood pressure"),
("Downtime", "None"),
],
body="""
<h2>Why the weight comes back</h2>
<p>Fat tissue makes a hormone called leptin that tells your brain how much energy you have stored. When you diet and lose fat, leptin drops and your brain reads the drop as a food shortage. Your stomach then releases more ghrelin, the hormone that makes you hungry, while your gut releases less of the hormones that make you feel full after a meal.</p>
<p>The NEJM study measured these hormones in the same people for more than a year. Leptin and the fullness hormones were still low and ghrelin was still high at the 62-week check, more than a year after the diet started.</p>
<p>Eating less on your own means fighting this hunger every day, so the plan tracks your hunger as closely as your weight and adjusts every week.</p>

<h2>Why Thailand uses a lower BMI scale</h2>
<p>A WHO expert panel found that Asian people carry more body fat and a higher risk of diabetes and heart disease than Europeans at the same BMI. Thailand counts a BMI of 23 as overweight and 25 as obese for that reason, where many Western charts use 25 and 30.</p>
<p>Your waist tells the doctor where the fat sits. A waist of 90 cm or more for men or 80 cm or more for women points to fat around the organs, and so does a waist larger than half your height. You can check both numbers in the <a href="lab.html">Wellness Lab</a> before your visit.</p>

<h2>How the plan works</h2>
<ol>
<li>Your first visit is a consultation with the doctor, who goes through your health and weight history with your scan results.</li>
<li>You set a goal together. The first target is usually 5 to 10 percent of your body weight since that amount already improves blood pressure and blood sugar.</li>
<li>If the doctor prescribes medicine to control hunger, it starts at the lowest dose and goes up step by step to keep side effects down.</li>
<li>You get an eating plan you can follow at home with a daily target for water.</li>
<li>You come back every week to weigh in and talk through hunger, meals and side effects, and the doctor adjusts the plan.</li>
<li>Exercise is added as you go, building up to 150 to 300 minutes a week.</li>
</ol>

<h2>The weekly visit</h2>
<p>Each visit starts with a weigh-in and a waist measurement. The doctor then asks how hungry you have been, what you ate and how you felt, and changes one or two things for the coming week. A body composition scan at set points shows how much of the change is fat and how much is water or muscle.</p>

<h2>What to bring to your first visit</h2>
<ul>
<li>A list of the medicines and supplements you take</li>
<li>Any blood test results from the past year</li>
<li>Your weight history, including diets you have tried and how much came back</li>
</ul>

<h2>Who should not join</h2>
<p>The doctor will not start the plan, or will leave medicine out of it, if you:</p>
<ul>
<li>are pregnant, breastfeeding or planning a pregnancy</li>
<li>have a family history of medullary thyroid cancer or a hormone gland tumour</li>
<li>have had pancreatitis</li>
<li>have severe stomach, bowel, liver or kidney disease</li>
<li>have severe depression</li>
</ul>

<h2>Side effects</h2>
<p>If the plan includes medicine, the common side effects are nausea, bloating, vomiting, constipation and diarrhoea. They are most likely in the first weeks and after a dose goes up, and they usually ease as the body adjusts. Losing weight quickly also raises the chance of gallstones, so tell the doctor straight away about strong pain in the upper right of your stomach.</p>
""",
faq=[
("Will I lose 1 kilo every week?", "The name is the pace the plan aims for. Weight often starts to come off in 2 to 4 weeks, and the doctor keeps the pace at what is safe for your body."),
("Do I have to give up foods I like?", "No food is banned. The eating plan works out portions you can keep up for months since a plan you drop after two weeks does nothing."),
("Can I combine it with CoolSculpting?", "Yes. CoolSculpting removes fat from one area without changing your weight much, so the doctor often starts with 1 Week 1 Kilo and treats a stubborn area once you are near your goal."),
("What happens when the plan ends?", "The doctor plans the end with you. The eating and exercise habits you build at the weekly visits are what keep the weight off afterwards."),
],
pair=("Cs", "CoolSculpting", "coolsculpting.html", "cold", "CoolSculpting takes off a stubborn patch of fat once the scale is moving."),
refs=[
'Sumithran P, Prendergast LA, Delbridge E, et al. Long-term persistence of hormonal adaptations to weight loss. <i>N Engl J Med</i>. 2011;365(17):1597-1604. <a href="https://doi.org/10.1056/NEJMoa1105816" target="_blank" rel="noopener">doi:10.1056/NEJMoa1105816</a>',
'WHO Expert Consultation. Appropriate body-mass index for Asian populations and its implications for policy and intervention strategies. <i>Lancet</i>. 2004;363(9403):157-163. <a href="https://pubmed.ncbi.nlm.nih.gov/14726171/" target="_blank" rel="noopener">PubMed 14726171</a>',
f'Apex Medical Center. Weight-loss program and obesity articles. <a href="{APEX}" target="_blank" rel="noopener">apexmedicalcenter.co.th</a>',
],
),

# ---------------------------------------------------------------- CoolSculpting
dict(
slug="coolsculpting", sym="Cs", cls="cold", group="treatments",
name="CoolSculpting", ft="Fat freezing, also called cryolipolysis",
temp=("Slimming", "No needles, no cuts"),
goal="fat",
desc="CoolSculpting at Apex Slim and Longevity: about 35 minutes per area, back to work the same day, results clearest at 3 months.",
note=("How cold removes fat cells", "Fat cells freeze at a higher temperature than skin, and CoolSculpting works in that gap."),
hook=[
"Most people have one patch of fat that stays put through every diet and workout, such as the lower belly, the love handles or the fold under the bra strap. CoolSculpting cools that patch until the fat cells in it die, with no needles and no surgery.",
"The idea started with reports of children who got a small dent in the cheek after sucking on ice pops. Doctors at Harvard worked out that fat cells freeze at a warmer temperature than skin, and in 2008 they showed that controlled cold could destroy the fat under the skin of pigs while the skin above it stayed unharmed.",
],
protocol=[
("Session time", "About 35 minutes per area"),
("Sessions", "Often 1 per area, with 2 or 3 if needed, spaced 1 to 3 months apart"),
("Downtime", "Back to work the same day"),
("After", "Redness, numbness and tingling that fade within a few days to 2 weeks"),
("Results", "Show over 1 to 3 months"),
("Areas", '<div class="chips"><span>Belly</span><span>Flanks</span><span>Inner thighs</span><span>Outer thighs</span><span>Upper arms</span><span>Under the chin</span><span>Bra line</span><span>Back</span><span>Under the buttocks</span></div>'),
],
extra="stages",
body="""
<h2>What the studies show</h2>
<p>A 2015 review in Plastic and Reconstructive Surgery pooled 19 studies of fat freezing. Measured with calipers, the fat layer in a treated area was 14.7 to 28.5 percent thinner after treatment, and ultrasound showed a drop of 10.3 to 25.5 percent. Most results sit around a fifth of the fat in the treated spot.</p>
<p>The body clears the dead fat cells over the following weeks, which is why the change shows slowly and is clearest at 3 months.</p>

<h2>Before the session</h2>
<p>Your first visit starts with a body composition scan and a consultation with the doctor. The doctor pinches the area to check that the fat is soft enough to fit the applicator, then marks the spot and takes photos so you can compare them at 3 months.</p>
<p>Eat a normal meal beforehand and wear loose clothes. There is no need to stop exercising or change your diet before the session.</p>

<h2>During the session</h2>
<p>A gel pad goes on the skin to protect it, and the applicator is placed on top. The applicator pulls the fold of fat in with suction and starts cooling. The first 5 to 10 minutes feel very cold and tight, and the area then goes numb.</p>
<p>Most people read, use their phone or work on a laptop for the rest of the session. When the applicator comes off, the area looks firm and pale for a few minutes, and the nurse massages it for about 2 minutes to help break up the frozen cells.</p>

<h2>After the session</h2>
<p>You can go back to work, drive and exercise the same day. The area can stay red, swollen, numb or tingly for a few days to 2 weeks, and some people get bruising where the applicator pulled.</p>
<p>A rare side effect is paradoxical adipose hyperplasia, where the treated fat grows larger and firmer a few months later. A 2014 report put it at about 1 in 20,000 treatments and later reports have put it higher, so the doctor goes over it with you before you start.</p>

<h2>Who it suits</h2>
<p>CoolSculpting suits people close to their goal weight with soft fat they can pinch, such as a lower belly that stays after diet and exercise, and a BMI under 35. It reduces fat in the treated area rather than body weight, so the doctor may pair it with 1 Week 1 Kilo for people who also want to lose weight.</p>
<p>It is not used for people with hives from cold (cold urticaria), cryoglobulinaemia, cold agglutinin disease, paroxysmal cold haemoglobinuria or a bleeding disorder, and it is put off during pregnancy.</p>

<h2>CoolSculpting or liposuction?</h2>
<p>Liposuction removes more fat in one go through small cuts, under anaesthetic, with a week or more of recovery and a compression garment afterwards. CoolSculpting removes less fat per session with no cuts and no time off, and the change builds over 3 months. People who want a large change in several areas at once are usually better served by surgery, and the doctor tells you which fits your goal.</p>
""",
faq=[
("Does it hurt?", "The first 5 to 10 minutes feel very cold and tight while the area goes numb. The massage after the applicator comes off can sting for a minute."),
("How many sessions will I need?", "One session is often enough for an area, and some areas need 2 or 3. The doctor decides after measuring the fat at your first visit."),
("Will the fat come back?", "Treated fat cells are cleared for good. The fat cells left in the area can still grow if you gain weight."),
("Will I weigh less?", "Only a little. One treated area holds a small amount of fat by weight, so the change shows in how your clothes fit and in the photos at 3 months."),
("Can I exercise after?", "Yes. Normal activity and exercise can continue the same day."),
("Is it FDA cleared?", "Yes. The FDA cleared CoolSculpting for fat on the flanks in 2010 and has since added the belly, thighs, upper arms, under the chin, the bra line, the back and under the buttocks."),
],
pair=("En", "Emsculpt Neo", "emsculpt-neo.html", "", "Emsculpt Neo builds the muscle under an area that CoolSculpting has thinned."),
refs=[
'Manstein D, Laubach H, Watanabe K, Farinelli W, Zurakowski D, Anderson RR. Selective cryolysis: a novel method of non-invasive fat removal. <i>Lasers Surg Med</i>. 2008;40(9):595-604. <a href="https://doi.org/10.1002/lsm.20719" target="_blank" rel="noopener">doi:10.1002/lsm.20719</a>',
'Ingargiola MJ, Motakef S, Chung MT, Vasconez HC, Sasaki GH. Cryolipolysis for fat reduction and body contouring: safety and efficacy of current treatment paradigms. <i>Plast Reconstr Surg</i>. 2015;135(6):1581-1590. <a href="https://pubmed.ncbi.nlm.nih.gov/26017594/" target="_blank" rel="noopener">PubMed 26017594</a>',
'Jalian HR, Avram MM, Garibyan L, Mihm MC, Anderson RR. Paradoxical adipose hyperplasia after cryolipolysis. <i>JAMA Dermatol</i>. 2014;150(3):317-319.',
f'Apex Medical Center. CoolSculpting service page. <a href="{APEX}" target="_blank" rel="noopener">apexmedicalcenter.co.th</a>',
],
),

# ---------------------------------------------------------------- Emsculpt Neo
dict(
slug="emsculpt-neo", sym="En", cls="", group="treatments",
name="Emsculpt Neo", ft="Heat and magnetic pulses for fat and muscle",
temp=("Slimming", "No needles, no cuts"),
goal="tone",
desc="Emsculpt Neo at Apex Slim and Longevity: 30 minutes per area to thin the fat layer and build the muscle under it.",
note=("What Emsculpt Neo does in 30 minutes", "Heat and magnetic pulses work on fat and muscle in the same session."),
hook=[
"Sit-ups do not burn the fat that sits on top of your stomach, and dieting does not build the muscle under it. Emsculpt Neo works on both in the same 30 minutes while you lie on a bed.",
"The applicator heats the fat layer with radiofrequency while magnetic pulses make the muscle under it contract harder than you can contract it yourself. In an MRI study of 41 people who had 3 treatments on the belly, the fat layer was 30.8 percent thinner and the muscle 26.1 percent thicker 3 months later.",
],
protocol=[
("Session time", "30 minutes per area"),
("Sessions", "At least 4 to 6, spaced 2 to 3 days apart"),
("Feels like", "Warmth with strong muscle contractions"),
("Downtime", "None, with tired muscles like after a workout"),
("Results", "Build over 3 months"),
("Areas", '<div class="chips"><span>Belly</span><span>Buttocks</span><span>Upper arms</span><span>Thighs</span><span>Calves</span></div>'),
],
body="""
<h2>Two kinds of energy in one applicator</h2>
<p>Radiofrequency (RF) warms the fat layer to a temperature that fat cells cannot survive for long, and the body clears the damaged cells over the following weeks. At the same time, high-intensity focused electromagnetic (HIFEM) pulses reach the muscle under the fat and make it contract harder than you can by training, because the pulses fire the nerve that controls the muscle directly.</p>
<p>A muscle pushed this hard adapts the way it does after heavy training, by growing thicker and stronger. The authors of the trials credit part of the result to the warmth from the RF, since heat also helps muscle grow.</p>

<h2>What the studies show</h2>
<p>In the MRI study, 41 people had 3 treatments on the belly, one a week. At 3 months the fat layer was 30.8 percent thinner, the abdominal muscle was 26.1 percent thicker, the gap down the middle of the abdominal muscle was 18.8 percent narrower and waists were 5.87 cm smaller on average.</p>
<p>A second trial in Plastic and Reconstructive Surgery compared 48 people who had the real treatment with 24 who had a fake version set to 5 percent power. One month after 3 sessions, the treated group had 20.5 percent less belly fat and 21.5 percent thicker muscle, rising to 28.3 and 24.2 percent at 3 months, while the fake-treatment group showed no change. The results were still there at 6 months.</p>

<h2>What a session feels like</h2>
<p>You lie on a bed with the applicator strapped over the area. The skin warms up over the first few minutes, and the muscle then tightens and releases in strong, rhythmic pulses. The nurse raises the intensity as you get used to it and turns it down whenever you ask.</p>
<p>You can go straight back to work afterwards. The muscles can feel tired or sore, the same as after a hard workout.</p>

<h2>A belly that stays soft after pregnancy</h2>
<p>Pregnancy stretches the two sides of the main abdominal muscle apart, and in many women the gap down the middle stays wider after the birth (diastasis recti). The belly then pushes forward even when the weight has come off. In the MRI study that gap was 18.8 percent narrower 3 months after treatment.</p>
<p>Wait until your own doctor clears you for exercise after the birth before you start. A wide gap may still need physiotherapy or surgery, and the doctor checks it at your consult.</p>

<h2>When you will see a change</h2>
<p>The muscle often feels firmer after the first few sessions. Fat loss shows from about 1 month, and in the trials both the fat and muscle results were largest at 3 months.</p>

<h2>Who it suits</h2>
<p>Emsculpt Neo suits people close to a healthy weight who want a flatter, firmer belly, a lifted buttock or toned arms and thighs. The fat it removes comes from the treated area only, so it does not replace weight loss for people with a lot to lose.</p>
<p>It is not used during pregnancy, or for people with a pacemaker, another electronic implant or metal implants in or near the area.</p>
""",
faq=[
("Does it hurt?", "The contractions are strong and the warmth builds through the session. The nurse turns the intensity down whenever you ask."),
("Will I get a six-pack?", "Emsculpt Neo thickens the muscle and thins the fat over it. How defined the muscle looks afterwards depends on how much fat was there to start."),
("How long do the results last?", "In the trial the results were still there 6 months later. Muscle you stop using shrinks over time, so regular exercise keeps the result."),
("Can I combine it with CoolSculpting?", "Yes. CoolSculpting removes more fat from a thick area while Emsculpt Neo builds the muscle under it, and the doctor plans which comes first."),
],
pair=("Cs", "CoolSculpting", "coolsculpting.html", "cold", "CoolSculpting removes more fat from a thick area before Emsculpt Neo tones it."),
refs=[
'Jacob C, Kent D, Ibrahim O. Efficacy and safety of simultaneous application of HIFEM and synchronized radiofrequency for abdominal fat reduction and muscle toning: a multicenter magnetic resonance imaging evaluation study. <i>Dermatol Surg</i>. 2021;47(7):969-973. <a href="https://doi.org/10.1097/DSS.0000000000003086" target="_blank" rel="noopener">doi:10.1097/DSS.0000000000003086</a>',
'Samuels JB, Katz B, Weiss RA. Radiofrequency heating and high-intensity focused electromagnetic treatment delivered simultaneously: the first sham-controlled randomized trial. <i>Plast Reconstr Surg</i>. 2022;149(5):893e-900e. <a href="https://doi.org/10.1097/PRS.0000000000009030" target="_blank" rel="noopener">doi:10.1097/PRS.0000000000009030</a>',
f'Apex Medical Center. Emsculpt service page. <a href="{APEX}" target="_blank" rel="noopener">apexmedicalcenter.co.th</a>',
],
),

# ---------------------------------------------------------------- FIT FIRM
dict(
slug="fit-firm", sym="Ff", cls="", group="treatments",
name="FIT FIRM", ft="Radiofrequency with muscle stimulation",
temp=("Firming", "No needles, no cuts"),
goal="firm",
desc="FIT FIRM at Apex Slim and Longevity: radiofrequency and muscle stimulation to firm the belly, thighs and upper arms with no downtime.",
note=("How heat firms loose skin", "Radiofrequency builds new collagen while muscle stimulation tones the layer underneath."),
hook=[
"Loose skin on the thighs and a soft belly often stay after the weight has gone, and exercise alone is slow to change them. FIT FIRM is the Apex Slim program for firming these areas without needles or downtime.",
"It combines two kinds of energy. Radiofrequency (RF) heats the deeper layer of the skin, which makes the body build new collagen over the following months, and electromagnetic stimulation makes the muscle underneath contract over and over the way it does in training.",
],
protocol=[
("Energy", "Radiofrequency with electromagnetic muscle stimulation"),
("Sessions", "A course set by the doctor after looking at the area"),
("Feels like", "Warmth with rhythmic muscle tightening"),
("Downtime", "None"),
("Results", "Build over the weeks after your sessions"),
("Areas", '<div class="chips"><span>Belly</span><span>Thighs</span><span>Upper arms</span></div>'),
],
body="""
<h2>How heat firms skin</h2>
<p>Collagen is the protein that keeps skin firm, and the body makes less of it as you age. When RF heats the deeper layer of the skin to a controlled temperature, the collagen fibres already there tighten and the heat switches on the cells that make new collagen. The new collagen forms over weeks to months, so the skin keeps firming after the sessions end.</p>

<h2>Why add muscle stimulation</h2>
<p>A firm muscle under the skin makes an area look tighter. Electromagnetic stimulation makes the muscle contract in strong, repeated pulses while you lie still, and a muscle worked this way over a course of sessions gets firmer.</p>
<p>A 2022 study gave 38 people 3 sessions of combined RF and muscle stimulation. Fat thickness and body measurements were smaller after treatment, the participants were satisfied with the result and there were no serious side effects. Results differ between devices, and the doctor shows you the device Apex uses at your consult.</p>

<h2>What to expect after a session</h2>
<p>Straight after a session the area can look tighter and feel warm. Part of that early change is warmth and fluid that settles within a day or two, and the lasting change comes from new collagen and firmer muscle over the following weeks.</p>
<p>You can go back to work straight away. The skin can stay pink for a few hours and the muscles can feel worked, the same as after exercise.</p>

<h2>Your course step by step</h2>
<ol>
<li>At your consult the doctor pinches and measures the area, checks how loose the skin is and takes photos to compare later.</li>
<li>The doctor sets the number of sessions and the gap between them from what the area needs.</li>
<li>At each session a gel or pad goes on the skin and the applicator is moved or strapped over the area while it warms and the muscle contracts.</li>
<li>You come back after the course for measurements and photos, which show the change better than the mirror does since it builds slowly.</li>
</ol>

<h2>Who it suits</h2>
<p>FIT FIRM suits people with mild looseness or softness in the belly, thighs or upper arms, often after weight loss or pregnancy. Very loose skin after a large weight loss may need surgery to remove, and the doctor tells you at the consult if FIT FIRM cannot give you the change you want.</p>
<p>It is not used during pregnancy, for people with a pacemaker or other electronic implant, over metal implants, or on skin with an infection or open wound.</p>
""",
faq=[
("How is FIT FIRM different from Emsculpt Neo?", "Both pair heat with muscle stimulation. Emsculpt Neo is built to remove fat and build muscle, while FIT FIRM works on firming the skin and toning the muscle under it."),
("How many sessions will I need?", "The doctor sets the number at your consult after looking at the area. Firming builds over a course of sessions since new collagen takes weeks to form."),
("Does it hurt?", "It feels warm with strong muscle contractions. The nurse turns the settings down if it gets too hot."),
("When will I see the result?", "The skin keeps firming for weeks after the last session since new collagen takes time to form. The photos at your review show the change most clearly."),
("Can men do it?", "Yes. FIT FIRM works the same way for men, most often on the belly and the upper arms."),
("Can I do it after CoolSculpting?", "Yes. FIT FIRM can firm the skin over an area after CoolSculpting has thinned the fat, and the doctor plans the timing."),
],
pair=("Wk", "1 Week 1 Kilo", "one-week-one-kilo.html", "", "FIT FIRM firms skin that loosens as weight comes off with 1 Week 1 Kilo."),
refs=[
'Dayan E, Chilukuri S, Bucky L, Bharti G, Gold MH, Rohrich R. Combination non-invasive radiofrequency and electrical muscle stimulation: a synergistic combination for body contouring. <i>J Cosmet Dermatol</i>. 2022;21 Suppl 1:S29-S36. <a href="https://doi.org/10.1111/jocd.15393" target="_blank" rel="noopener">doi:10.1111/jocd.15393</a>',
f'Apex Slim. FIT FIRM promotion and Slim Shape contouring page. <a href="{APEX}" target="_blank" rel="noopener">apexmedicalcenter.co.th</a>',
],
),

# ---------------------------------------------------------------- IV Therapy
dict(
slug="iv-therapy", sym="Iv", cls="long", group="longevity",
name="IV Therapy", ft="Vitamins and fluids by drip",
temp=("Longevity", "30 to 60 minutes"),
goal="energy",
desc="IV therapy at Apex Slim and Longevity: vitamins, minerals and fluids by drip in 30 to 60 minutes, and where the evidence behind it is strong or thin.",
note=("What a drip can do that a tablet cannot", "Vitamin C by drip reaches levels in the blood that tablets cannot, and the doctor explains where that helps."),
hook=[
"Vitamins you swallow pass through your gut first, and your body only absorbs so much at a time. An IV drip puts vitamins, minerals and fluid straight into your blood.",
"The difference can be large. In a study at the US National Institutes of Health, 1.25 g of vitamin C reached a peak of 885 µmol/L in the blood when given by drip and 135 µmol/L when swallowed, more than six times higher. A higher blood level is still only a number, so this page sets out where a drip has good evidence behind it and where the evidence is thin.",
],
protocol=[
("Drip time", "30 to 60 minutes"),
("Before", "Health check and blood pressure, with blood tests when needed"),
("What goes in", "Fluids, salts and vitamins mixed by the doctor for your goal"),
("Downtime", "None"),
("After", "Sometimes a small bruise where the needle went in"),
],
body="""
<h2>Where a drip clearly helps</h2>
<p>A drip replaces fluid and salts quickly after vomiting, diarrhoea, heavy sweating or a fever, when drinking enough is hard. It also treats a proven lack of a vitamin or mineral, especially in people whose gut absorbs poorly, such as after weight-loss surgery or with a bowel condition. These uses have strong medical evidence behind them.</p>

<h2>Where the evidence is still thin</h2>
<p>People also book drips for more energy, recovery after a long flight or a heavy week, and better skin. Many say they feel better afterwards, while large trials comparing a real drip with a fake one are few, so the size of the benefit for healthy people is not yet known. Doctors at Cleveland Clinic call its value as a general wellness tool uncertain, and the doctor at your consult tells you the same.</p>
<p>Claims that a drip clears toxins from the body or slows ageing are not backed by good studies yet.</p>

<h2>What goes in the bag</h2>
<p>The base is a saline fluid with salts called electrolytes. The doctor adds vitamins and minerals for your goal, most often B vitamins, vitamin C, magnesium and zinc, and sets the dose from your health check.</p>

<h2>Common drips and what they are for</h2>
<ul>
<li><b>Hydration drip.</b> Fluid and electrolytes after a stomach bug, a fever or a day in the heat.</li>
<li><b>Vitamin B drip.</b> For people with low vitamin B12 levels, which is more common in vegetarians, older adults and people on some long-term medicines.</li>
<li><b>Vitamin C drip.</b> For people with a low vitamin C level, or when the doctor wants a higher level than tablets can give.</li>
</ul>
<p>A blood test shows whether you are low in a vitamin, and the doctor uses it to decide what goes in your drip.</p>

<h2>Your visit</h2>
<p>The doctor asks about your health and medicines and checks your blood pressure. A nurse places a thin tube in a vein in your arm, and the drip runs for 30 to 60 minutes while you sit back, read or use your phone. You can go back to your day as soon as the tube comes out.</p>

<h2>Risks</h2>
<ul>
<li>Bruising, soreness or swelling where the needle went in</li>
<li>Irritation of the vein</li>
<li>Infection at the needle site, which is rare with clean technique</li>
<li>Too much of a vitamin or mineral, or salts out of balance</li>
<li>Fluid overload in people with heart or kidney disease</li>
</ul>

<h2>Check with the doctor first</h2>
<p>Tell the doctor before your first drip if you have heart disease, kidney disease or high blood pressure, or if you are pregnant or breastfeeding.</p>
<p>G6PD deficiency is common in Thailand, and high-dose vitamin C by drip can break down red blood cells in people who have it. The doctor may test for it before giving you a high-dose vitamin C drip.</p>
""",
faq=[
("How often can I have one?", "The doctor sets how often from your goal and your blood tests. A drip for dehydration is often a one-off, and a drip for a deficiency follows a course until your levels are back to normal."),
("Is a drip better than taking vitamins?", "For a healthy person who eats well, food and tablets cover daily needs. A drip helps when you need fluid fast, when your gut cannot absorb enough, or when the doctor wants a level that tablets cannot reach."),
("Does it hurt?", "You feel a small sting as the needle goes in, and the fluid can feel cool in your arm while it runs."),
("Can I drive afterwards?", "Yes. You can drive and go back to work as soon as the drip is finished."),
],
pair=("Hb", "HBOT", "hbot.html", "long", "Ask the doctor about booking a drip and an HBOT session on the same visit."),
refs=[
'Padayatty SJ, Sun H, Wang Y, et al. Vitamin C pharmacokinetics: implications for oral and intravenous use. <i>Ann Intern Med</i>. 2004;140(7):533-537. <a href="https://pubmed.ncbi.nlm.nih.gov/15068981/" target="_blank" rel="noopener">PubMed 15068981</a>',
'Cleveland Clinic. Is IV vitamin therapy worth it? <i>Health Essentials</i>. <a href="https://health.clevelandclinic.org/iv-vitamin-therapy" target="_blank" rel="noopener">health.clevelandclinic.org</a>',
f'Apex Medical Center. Vitamin drip page. <a href="{APEX}" target="_blank" rel="noopener">apexmedicalcenter.co.th</a>',
],
),

# ---------------------------------------------------------------- HBOT
dict(
slug="hbot", sym="Hb", cls="long", group="longevity",
name="HBOT", ft="Hyperbaric oxygen therapy",
temp=("Longevity", "60 to 90 minutes"),
goal="energy",
desc="HBOT at Apex Slim and Longevity: pure oxygen in a pressurised chamber for 60 to 90 minutes, how it works and what the research shows.",
note=("How pressure puts more oxygen in your blood", "Pure oxygen under pressure dissolves into the plasma and raises the oxygen your blood carries."),
hook=[
"The air you breathe is 21 percent oxygen, and nearly all of it rides on your red blood cells, which are already close to full. Hyperbaric oxygen therapy (HBOT) gets more oxygen into your blood by dissolving it into the plasma, the liquid part of the blood.",
"You breathe pure oxygen inside a chamber pressurised to 2 to 3 times normal air pressure, the same treatment hospitals use for divers with decompression sickness. At about 2.4 times normal pressure, the oxygen dissolved in your plasma rises from about 0.3 mL to about 5 to 6 mL in every 100 mL of blood.",
],
protocol=[
("Session time", "60 to 90 minutes in the chamber"),
("Pressure", "2 to 3 times normal air pressure"),
("You breathe", "Pure oxygen through a mask or hood"),
("Feels like", "Ear pressure like a plane coming in to land, then quiet"),
("Downtime", "None"),
("Before", "A doctor checks your ears, lungs and medicines"),
],
body="""
<h2>Why the pressure matters</h2>
<p>Red blood cells are about 97 percent full of oxygen when you breathe normal air, so breathing more oxygen at normal pressure adds very little. Pressure gets around this by pushing oxygen into the plasma. The harder a gas is pressed against a liquid, the more of it dissolves, which is how a soft drink holds its fizz until the cap comes off.</p>
<p>Oxygen carried in the plasma reaches places red blood cells struggle to reach, such as swollen tissue and the edges of a wound, and hospitals use HBOT to help difficult wounds heal for that reason.</p>

<h2>What it is approved for</h2>
<p>The US FDA has cleared hyperbaric chambers for a set list of conditions, including decompression sickness, air bubbles in the blood, carbon monoxide poisoning, burns, severe infections, slow-healing diabetic wounds, radiation injury and severe anaemia when a transfusion is not possible. For wound healing, hospitals give daily sessions of 1.5 to 2 hours for 20 to 40 days.</p>

<h2>HBOT for wellness and recovery</h2>
<p>At Apex Slim, HBOT is offered as a wellness and recovery session, outside that medical list. The best-known study in this area comes from Israel, where 35 adults aged 64 and over had 60 sessions at 2 times normal pressure over 3 months. Telomeres, the caps on the ends of chromosomes that shorten with age, grew more than 20 percent longer in several types of immune cell, and worn-out helper T cells fell by 37 percent.</p>
<p>The study was small, had no comparison group and measured blood cells only, so it shows a change in those cells while the effect on ageing in the body is still unknown. The FDA also warns against centres that promise HBOT will cure conditions it has not been cleared for, and the doctor walks you through the research at your consult.</p>

<h2>Your session</h2>
<ol>
<li>Change into cotton clothing. Phones, lighters, hand warmers, lotions and hair oil stay outside since pure oxygen under pressure is a fire risk.</li>
<li>The chamber door closes and the pressure rises over several minutes. Your ears fill up the way they do when a plane lands, so swallow, yawn or pinch your nose and blow gently to clear them.</li>
<li>You breathe pure oxygen through a mask or hood for the session, and you can rest or sleep.</li>
<li>The pressure comes down slowly at the end and your ears may pop again. You can go back to your day straight after.</li>
</ol>

<h2>Side effects</h2>
<ul>
<li>Ear pain or pressure from the pressure change, the most common problem</li>
<li>Sinus pain, more likely if you have a cold</li>
<li>Short-sightedness that builds over many sessions and goes back to normal after the course ends</li>
<li>Feeling closed in, for people who dislike small spaces</li>
<li>A seizure caused by the oxygen, which is rare at about 1 to 4 in every 10,000 treatments</li>
</ul>
<p>A collapsed lung that has not been treated rules HBOT out. The doctor also asks about recent ear or chest surgery and your medicines before your first session, and a bad cold or blocked nose means waiting until it clears.</p>
""",
faq=[
("Does it hurt?", "Your ears can hurt for a moment as the pressure rises if they do not clear, and the staff can slow the pressure change for you. The rest of the session feels like sitting in a quiet room."),
("How many sessions will I need?", "The doctor sets the number from your goal at the consult. The study on ageing used 60 sessions over 3 months."),
("Is it the same as breathing oxygen from a tank?", "No. Oxygen from a tank at normal pressure only tops up red blood cells that are already nearly full. The pressure in the chamber is what dissolves the extra oxygen into your plasma."),
("Can I bring my phone?", "No. Phones and other electronics stay outside since a spark is dangerous in pure oxygen."),
("I don't like small spaces. Can I still do it?", "Tell the doctor at your consult. The staff stay in contact with you the whole time and the session can be stopped if you need to come out."),
],
pair=("Iv", "IV Therapy", "iv-therapy.html", "long", "Ask the doctor about booking an HBOT session and a drip on the same visit."),
refs=[
'US Food and Drug Administration. Hyperbaric oxygen therapy: get the facts. <a href="https://www.fda.gov/consumers/consumer-updates/hyperbaric-oxygen-therapy-get-facts" target="_blank" rel="noopener">fda.gov</a>',
'Thom SR. Hyperbaric oxygen: its mechanisms and efficacy. <i>Plast Reconstr Surg</i>. 2011;127 Suppl 1:131S-141S. <a href="https://doi.org/10.1097/PRS.0b013e3181fbe2bf" target="_blank" rel="noopener">doi:10.1097/PRS.0b013e3181fbe2bf</a>',
'Hachmo Y, Hadanny A, Abu Hamed R, et al. Hyperbaric oxygen therapy increases telomere length and decreases immunosenescence in isolated blood cells: a prospective trial. <i>Aging (Albany NY)</i>. 2020;12(22):22445-22456. <a href="https://doi.org/10.18632/aging.202188" target="_blank" rel="noopener">doi:10.18632/aging.202188</a>',
],
),

# ---------------------------------------------------------------- Snorelase
dict(
slug="snorelase", sym="Sl", cls="long", group="longevity",
name="Snorelase", ft="Laser treatment for snoring",
temp=("Longevity", "No cuts, no anaesthetic"),
goal="sleep",
desc="Snorelase at Apex Slim and Longevity: a laser tightens the soft palate to reduce snoring, about 30 minutes a session with no cuts and no anaesthetic.",
note=("Why snoring happens and how a laser quiets it", "Loose tissue at the back of the throat flaps as you breathe, and heat tightens it."),
hook=[
"Most people who snore never hear it, and the person next to them hears all of it. Snoring is the sound of the soft palate and the tissue at the back of your throat flapping as air squeezes past it while you sleep.",
"Snorelase uses a laser to warm that tissue without cutting it, which makes it tighten so it flaps less. In a 2022 trial where half the patients got a fake laser, bed partners rated the snoring 7.9 out of 10 before treatment and 4.7 after 3 sessions, while the fake-laser group stayed at 8.",
],
protocol=[
("Session time", "About 30 minutes"),
("Sessions", "3 to 6"),
("Anaesthetic", "None needed"),
("Downtime", "None"),
("After", "A mild dry or scratchy throat"),
("Treats", "Snoring, once sleep apnoea has been ruled out"),
],
body="""
<h2>What makes the sound</h2>
<p>When you fall asleep, the muscles in your throat relax and the soft palate, the uvula and the tissue around them sag into the airway. Air squeezing through the narrower gap makes the loose tissue flap, and the flapping is the snore. It gets worse with age, alcohol, sleeping on your back and extra weight around the neck.</p>

<h2>How the laser tightens it</h2>
<p>Snorelase uses an erbium laser (Er:YAG) in a gentle mode that heats without cutting. Short pulses warm the lining of the mouth and throat without breaking the surface, which makes the collagen in the tissue shrink and tighten and starts the growth of new collagen over the following weeks. Firmer tissue flaps less, so the snoring gets quieter, and imaging studies have measured a wider airway after treatment.</p>

<h2>What the studies show</h2>
<p>The 2022 trial took 40 adults who snored without significant sleep apnoea and gave half of them a fake treatment with a handpiece that blocked the laser beam. After 3 sessions, bed partners rated the snoring of the treated group down from 7.9 to 4.7 out of 10, and the fake-laser group stayed at 8. Patients rated the discomfort 3 out of 10 on average, nobody needed an anaesthetic and there were no complications.</p>
<p>A review of 7 studies with 247 patients found that 80 percent were satisfied with the result. A 2025 review found the effect usually lasts 12 to 24 months and that 25 to 40 percent of people needed a top-up session to keep it.</p>

<h2>Snoring or sleep apnoea?</h2>
<p>Snoring can be a sign of obstructive sleep apnoea, where the airway closes completely and breathing stops many times a night. See a doctor about a sleep test first if:</p>
<ul>
<li>someone has seen you stop breathing or gasp in your sleep</li>
<li>you feel sleepy during the day after a full night in bed</li>
<li>you wake up with headaches</li>
<li>you have high blood pressure</li>
</ul>
<p>In the review of 7 studies the laser made snoring quieter while the number of breathing pauses stayed about the same, so Snorelase treats snoring and is no replacement for sleep apnoea care.</p>

<h2>Your sessions</h2>
<p>You sit in the chair with protective glasses on, and the doctor passes the laser over the soft palate, the uvula, the sides of the throat and sometimes the back of the tongue. Each session takes about 30 minutes and feels warm. You can eat, talk and go back to work straight after, and your throat can feel dry or scratchy for a day or so.</p>
<p>Most people need 3 to 6 sessions, and the doctor sets the gap between them.</p>

<h2>Who it suits</h2>
<p>Snorelase suits adults whose snoring comes from a loose soft palate and throat. Snoring caused by a blocked nose or large tonsils needs a different treatment, and the doctor checks for both at the first visit. Losing weight also reduces snoring for people who carry extra weight around the neck.</p>

<h2>Other ways to reduce snoring</h2>
<p>Some snoring eases with simple changes, and the doctor goes through these with you first:</p>
<ul>
<li>sleeping on your side instead of your back</li>
<li>cutting down on alcohol in the evening</li>
<li>losing weight</li>
<li>a mouth guard that holds the lower jaw forward while you sleep</li>
</ul>
<p>Surgery on the soft palate is the option for snoring that nothing else helps, and a CPAP machine is the standard treatment for sleep apnoea.</p>
""",
faq=[
("Does it hurt?", "It feels warm. In the trial, people rated the discomfort 3 out of 10 and none of them needed an anaesthetic."),
("When will my partner notice a difference?", "Some couples notice a change after the first session, and the full effect builds over the course as new collagen forms."),
("How long does it last?", "Usually 12 to 24 months. A top-up session can be booked when the snoring starts to come back."),
("My partner says I stop breathing at night.", "Book a sleep test before Snorelase. Stopping breathing points to sleep apnoea, which needs its own treatment."),
],
pair=("Wk", "1 Week 1 Kilo", "one-week-one-kilo.html", "", "Extra weight around the neck narrows the airway, so losing weight with 1 Week 1 Kilo can reduce snoring too."),
refs=[
'Picavet VA, Dellian M, Gehrking E, Sauter A, Hasselbacher K. Treatment of snoring using a non-invasive Er:YAG laser with SMOOTH mode (NightLase): a randomized controlled trial. <i>Eur Arch Otorhinolaryngol</i>. 2023;280(1):307-312. <a href="https://doi.org/10.1007/s00405-022-07539-9" target="_blank" rel="noopener">doi:10.1007/s00405-022-07539-9</a>',
'Neruntarat C, Khuancharee K, Shoowit P. Er:YAG laser for snoring: a systemic review and meta-analysis. <i>Lasers Med Sci</i>. 2020;35(6):1231-1238. <a href="https://doi.org/10.1007/s10103-020-02987-3" target="_blank" rel="noopener">doi:10.1007/s10103-020-02987-3</a>',
'Dembicka-Mączka D, Gryka-Deszczyńska M, Sitkiewicz J, Makara A, Fiegler-Rudol J, Wiench R. Effectiveness of the Er:YAG laser in snoring treatment based on systematic review and meta-analysis results. <i>J Clin Med</i>. 2025;14(12):4371. <a href="https://doi.org/10.3390/jcm14124371" target="_blank" rel="noopener">doi:10.3390/jcm14124371</a>',
f'Apex Medical Center. SnoreLase page. <a href="{APEX}" target="_blank" rel="noopener">apexmedicalcenter.co.th</a>',
],
),
]
