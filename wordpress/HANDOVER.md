# Apex Slim and Longevity website: WordPress handover

This is the Apex Slim and Longevity website as a WordPress theme, in English. It is written for P'Mac, Apex's IT, who hosts, installs and maintains it, and for the staff who edit it. Install it on a staging copy first and follow the steps in order.

## Who does what

- **P'Mac (Apex IT)** runs hosting on Apex's own servers, the domain and DNS, and maintenance after launch, installs the theme with the steps below, and sets up Google Analytics, Tag Manager and the Meta Pixel from Apex's central accounts once the site is complete.
- **Apex Slim staff** edit the content in WordPress: treatments, Results cases, the home and lab page text, the meals, the footer and the consult form. None of it needs a developer.
- **K. Eye**, Dr. Nan's secretary, submits the site for the สบส. advertising permit once it is complete and uploaded. The permit number then goes in Apex Slim › Settings.
- **Apex** signs off every claim, review and before and after photo on the site.
- **Gid** sends bigger changes, a new tool or a new section, as a new theme zip. "Updating the theme" at the end says how to install one without losing content.

## What is in the package

| File | What it is |
|---|---|
| `apex-slim-1.0.0.zip` | The theme. Every page of the site is drawn by it. It holds the styles, scripts, fonts, pictures and `content.json`, the site's content as it was designed. |
| `HANDOVER.pdf` | This document. |

The source is in the repository `shinigami1235-creator/Apex-Slim-and-Longevity` under `wordpress/theme/apex-slim/`. `python3 tools/build_theme.py` builds the zip from it.

## What the server needs

- WordPress 6.5 or newer. Tested on 6.8.3.
- PHP 8.0 or newer with the GD extension and WebP support. Tested on PHP 8.3. GD cuts the Results pod pictures and saves uploads as WebP.
- MySQL 5.7+ or MariaDB 10.4+, and HTTPS.
- An upload limit of 40 MB or more for the theme zip (it is 33 MB), since it carries the 3D body and the face and body tracking models. If the host's limit is lower, unzip `apex-slim/` into `wp-content/themes/` by FTP or SFTP instead.
- Outgoing email that works: the host's mailer or WP Mail SMTP. New consult requests are emailed with `wp_mail`.
- Two-step login for every Administrator and Editor account, since those accounts read enquiries: the Two Factor plugin or Wordfence Login Security.
- A daily backup of the database and `wp-content/uploads/`, kept 30 days, from the host or UpdraftPlus.
- A page cache (the host's own, LiteSpeed Cache or WP Super Cache) with logged-in users and `/wp-json/` left out of it, which is their default.

No other plugin is needed. An SEO plugin (Yoast, Rank Math, SEOPress, All in One SEO) is optional: when one is active it writes the descriptions, Open Graph tags and structured data, and the theme only sets the page titles.

## Install

1. Install WordPress on staging. In Settings › General set the site language to English and the time zone to Bangkok.
2. Settings › Permalinks: choose **Post name**.
3. Appearance › Themes › Add New › Upload Theme: upload `apex-slim-1.0.0.zip`, then **Activate**.
4. Tools › Apex Slim content › **Import the content that came with the theme**. This makes the Home, Slim Wellness Lab and Privacy policy pages, sets Home as the front page, and adds the 7 treatments and 4 Results cases. On the command line it is `wp slim import`.
5. Apex Slim › Settings: put the Apex Slim team's email addresses in **Send new requests to**, separated by commas. Check the footer lines and the LINE link.
6. Pages › Privacy policy: the import publishes Apex Medical Center's own privacy policy, the same text and contacts as apexmedicalcenter.co.th/en/privacy-policy/, as Apex asked. A short "This website" section is added for the consult form and the lab. It states that requests are kept 365 days, the same as **Keep requests for (days)** in Settings; change both together. When Apex Medical Center's policy changes, paste the new text here too.
7. Settings › Reading: tick **Discourage search engines** on staging only.
8. Send a test request from the form at the foot of the home page. It shows under **Enquiries** and arrives by email.
9. Tools › Apex Slim content shows a **Check** list. Fix every line marked Fix. Lines marked Note are reminders.
10. When staging passes "Checks before going live", repeat steps 1 to 6 on the live server, or move the staging database across with the host's migration tool.

### Settings in wp-config.php

| Line | When |
|---|---|
| `define( 'SLIM_IP_HEADER', 'HTTP_CF_CONNECTING_IP' );` | Behind Cloudflare or another proxy, so the spam limit counts each visitor and not the proxy. Use the header your proxy sets. |
| `define( 'SLIM_HSTS', 86400 );` | Once every address works over HTTPS. Browsers then refuse plain HTTP for that many seconds. Start with a day and raise it to 31536000 after a week. |
| `define( 'SLIM_MEDIA_BASE', 'https://cdn.example.com/' );` | Only if uploads are served from another address. |

## Addresses

| Page | Address |
|---|---|
| Home | `/` |
| Treatments | `/treatments/coolsculpting/`, `/treatments/emsculpt-neo/` and so on, one per treatment |
| Slim Wellness Lab | `/lab/` |
| Privacy policy | `/privacy-policy/` |
| Sitemap | `/wp-sitemap.xml` (WordPress's own; off while search engines are discouraged) |
| Consult form | `POST /wp-json/slim/v1/consult` |

Anything else (blog posts, archives, search, attachment pages) shows the "Page not found" page.

## Where staff edit what

| What | Where |
|---|---|
| A treatment's page, its tile on the home page, its Lab Notes card and its card on the mixing bench | **Treatments**, one screen per treatment. The article is in the editor box; use its Text tab to keep the figures and boxes as they are. |
| The order of the treatments | **Order** on each treatment (Page attributes, on the right). |
| Before and after cases in the Results section | **Results cases**. Choose the before and after photos and save; the pod pictures are cut from them. |
| Home page text: headings, the first visit slip, the Longevity and Results lines | **Apex Slim › Home page** |
| Lab text and the meals list | **Apex Slim › Slim Wellness Lab page** |
| Logo text, footer, LINE, footer links, the consult form's text and times, where requests go, how long they are kept | **Apex Slim › Settings** |
| Google Tag Manager and custom code | **Apex Slim › Tracking and code** (Administrators) |

The six goals on the mixing bench and the form (Lose weight, Belly and flank fat, Muscle tone, Firmer buttocks, Energy and recovery, Sleep without snoring) are fixed, since each has its own bottle picture. Each treatment chooses which goal leads to it.

Uploaded JPEG and PNG photos are saved as WebP. Settings › Media turns that off.

## Enquiries and privacy

- Each request holds the name, phone, LINE ID, goals, best time to call, the page it came from, and the consent record: the date and time, the consent line the visitor agreed to and the privacy policy version (the date the policy was last changed). It also keeps a one-way code made from the visitor's internet address, never the address itself.
- Administrators and Editors can read enquiries. Each enquiry has a status (New, Contacted, Booked, Closed) and a note for staff. The menu shows how many are New.
- Requests older than the keep period (365 days unless Settings says otherwise, never under 30) are deleted every night at 03:00 by WordPress's scheduler. On a quiet site, make the host call `wp-cron.php` every 15 minutes so the job runs.
- When someone asks for their details to be removed, open the enquiry and use **Delete for good**.
- **Enquiries › Access log** (Administrators) lists who opened, changed or deleted an enquiry, who imported content, changed settings or a user's role, and logins of staff who can read enquiries. It keeps the newest 3,000 entries from the last 400 days.

## Spam and limits

The form has a hidden field people never fill in, accepts requests only from this site's own pages, and allows 5 requests and 30 tries per connection in 10 minutes. Logins lock for 15 minutes after 8 wrong passwords for one user name from one connection.

## Tracking

Nothing from Google or Facebook loads until a Tag Manager container is set in Apex Slim › Tracking and code. Load GA4 and the Meta Pixel through that container, not as separate plugins, so the cookie banner controls them. With one set, a cookie banner asks first, Consent Mode v2 keeps analytics and ads off until the visitor accepts, and **Cookie settings** appears in the footer. A sent request pushes `consult:submit` to the dataLayer; use it as the conversion trigger.

## Security the theme sets

No comments, no XML-RPC, no user listing at `/wp-json/wp/v2/users` or `/?author=1`, the same message for a wrong user name or password, no SVG uploads, and the headers `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` and `Permissions-Policy`. The server's side is the host's: file permissions, no PHP running in `wp-content/uploads/`, automatic minor WordPress updates and a firewall.

## Checks before going live

1. Tools › Apex Slim content shows no line marked Fix.
2. The privacy policy is published and linked in the footer and from the consent box.
3. The domain points at the live server and every page opens over HTTPS.
4. A test request arrives in Enquiries and by email.
5. Settings › Reading: **Discourage search engines** is off on live, and `/wp-sitemap.xml` opens.
6. In a private window with cookies declined, the browser's network tab shows no request to Google, Facebook or fonts.googleapis.com.
7. PageSpeed Insights on mobile for the home page and one treatment page.
8. Paste the home page and one treatment page into a LINE chat and check the picture and title. Set a 1200 x 630 picture in Settings › **Picture for shared links** first.
9. A backup restores cleanly to staging.

When the สบส. permit is issued, its number goes in Apex Slim › Settings › **Advertising permit number** and shows in the footer.

## Updating the theme

Gid sends a new zip with a higher version. Appearance › Themes › Add New › Upload Theme, upload it and choose **Replace current with uploaded**. Content lives in the database, so it stays. Do it on staging first. The version shows at the bottom right of every admin page.

Before a big change, Tools › Apex Slim content › **Download content.json** keeps a copy of every text and picture address; importing it puts them back.

## Versions

| Version | Date | What changed |
|---|---|---|
| 1.0.0 | 15 November 2026 | First release: home, 7 treatment pages, Slim Wellness Lab, privacy policy, Enquiries inbox, import, export and check. |
