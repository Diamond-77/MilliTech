# MilliTech website

Static site for MilliTech, a web service agency in Imphal, Manipur. No build step: Vercel serves the files as they are.

- `index.html`: the whole home page (3D conveyor hero with three.js, offer carousel, sample demos, claim form).
- `privacy.html`, `terms.html`, `refunds.html`, `cookies.html`: legal pages.
- `favicon.svg`: the emblem.

## Common edits

- **Prices / launch offer**: search `index.html` for `₹1,000`, `₹2,000` and the `OFFERS` object.
- **WhatsApp number**: `MT_WA` in `index.html` and the `wa.me/916009271012` links.
- **Google Analytics**: set `GA_ID` near the bottom of `index.html`. The cookie banner only appears once it is set.

## Deploy

Import this repo at vercel.com/new. Framework preset: Other. No build command. Every push to `main` redeploys.
