# Apex Slim and Longevity

Website preview for Apex Slim and Longevity. English only for now. Thai and Chinese are added once the English site is finished.

Open `index.html` in a browser to view it. `coolsculpting.html` is the first treatment page.

## Look

- Colours are the Apex group tokens from the Apex Surgery site: plum #6A388C, night #1F0A30, lilac #A886CD, pale lilac #F1EAF7 and wash #FBF3FB. Ice blue #9CCBEA marks cold treatments and mint #86D3BE marks longevity.
- Font is LINE Seed, the same files as the Apex Surgery site.
- The home page opens on a lab bench. Visitors tap the ingredients they want on the shelf, then press Mix formula. The vials pour in turn, alternating right and left, then the flask mixes with one of four effects (swirl, fizz, colour shift or rise) and settles into one colour. Start over clears the bench at any point.
- Each ingredient has its own colour: orchid, ice blue, violet, coral, amber and pale teal. Every combination of 2 to 6 ingredients has its own mixed colour, worked out from the ingredient colours and rendered in Blender.
- The flask, vials and pours are Cycles renders from `blender/slim-glassware.blend` in the local project folder (kept out of this repo). `assets/img/lab/mix2` holds the empty flask, one full flask per ingredient, one flask for every mix and a right and left pour clip per ingredient. `assets/js/mix-data.js` holds the fill-level curves the page uses to cut the liquid.
- The pages tell browsers to keep the light colours, so a phone's forced dark mode leaves them alone.
- Lighting is the Studio Small 08 HDRI from Poly Haven (CC0).
- Treatments are laid out as a periodic table, with slimming in the top rows and longevity in the block underneath.
- A tape measure runs down the right edge on desktop and across the top on phones.
- Purple and the dark night colour come from the Apex brand, so they stay even though the AI look check bans purple with black by default.
- The tear edge on the first visit slip uses a radial gradient for the perforation.

## Content

- All article text is sample text written for the preview. Apex Slim checks it before launch.
- 1 Week 1 Kilo is a weekly doctor-prescribed program. The site does not name the drug, since Thailand bans advertising prescription drugs to the public.
- FIT FIRM details are still to come from Apex. Its tile says "Buttocks and thighs" going by the Instagram highlight drawing.
- Photos come from Apex later.
- The Play section is kept empty for the games.
- The consult form does not send yet. It connects to Apex in the build stage.
