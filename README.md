# MilliTech website

Static site for MilliTech, a web service agency in Imphal, Manipur. No build step: Vercel serves the files as they are.

- `index.html`: the whole home page (3D conveyor hero with three.js, offer carousel, sample demos, claim form).
- `service-menu.html` (served at `/service-menu`): landing page style menu. Three.js cover, 11 style spreads, and an order form that sends the picked style to WhatsApp. Style data is the `STYLES` array in the page; images live in `menu/img/` as `<slug>-main.webp`, `<slug>-2.webp`, `<slug>-3.webp` (2 and 3 are cropped to the first screen, 16:10).
- `privacy.html`, `terms.html`, `refunds.html`, `cookies.html`: legal pages.
- `favicon.svg`: the emblem.

## Common edits

- **Prices / launch offer**: search `index.html` for `₹1,000`, `₹2,000` and the `OFFERS` object.
- **WhatsApp number**: `MT_WA` in `index.html` and the `wa.me/916009271012` links.
- **Google Analytics**: set `GA_ID` near the bottom of `index.html`. The cookie banner only appears once it is set.

## Deploy

Import this repo at vercel.com/new. Framework preset: Other. No build command. Every push to `main` redeploys.
