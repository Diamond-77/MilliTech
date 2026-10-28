# MilliTech website

Static site for MilliTech, a web service agency in Imphal, Manipur. No build step: Vercel serves the files as they are.

- `index.html`: the whole home page (3D conveyor hero with three.js, offer carousel, sample demos, claim form).
- `service-menu.html` (served at `/service-menu`): landing page style menu. Three.js cover, 11 style spreads, and an order form that sends the picked style to WhatsApp. Style data is the `STYLES` array in the page; images live in `menu/img/` as `<slug>-main.webp`, `<slug>-2.webp`, `<slug>-3.webp` (2 and 3 are cropped to the first screen, 16:10).
- `demo-health-plus.html` (served at `/demo-health-plus`): client demo for Health Plus Clinic, kept apart from the agency pages (nothing links to it). Assets in `demo/health-plus/`. The hero is `js/branch.js`: a toon-shaded three.js branch (r128 from cdnjs, the same ink-outline style as the agency machine) that goes from dead to alive in about 4s; add `?p=0.5` (0 to 1) to the URL to freeze it at any moment. Design rules are in `DESIGN_DECISIONS.md`. Copy lives in the HTML with `data-i18n` keys; Romanised Meiteilon goes in `i18n/mni.js` (generate it from the translated content file with `i18n/txt-to-mni.py`), and `DEFAULT_LANG` in `js/site.js` picks the starting language.
- `privacy.html`, `terms.html`, `refunds.html`, `cookies.html`: legal pages.
- `favicon.svg`: the emblem.

## Common edits

- **Prices / launch offer**: search `index.html` for `₹1,000`, `₹2,000` and the `OFFERS` object.
- **WhatsApp number**: `MT_WA` in `index.html` and the `wa.me/916009271012` links.
- **Google Analytics**: set `GA_ID` near the bottom of `index.html`. The cookie banner only appears once it is set.

## Deploy

Import this repo at vercel.com/new. Framework preset: Other. No build command. Every push to `main` redeploys.
