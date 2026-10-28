# Health Plus Clinic demo: design decisions

The demo lives in `demo-health-plus.html` and `demo/health-plus/`. Build from this file. Don't change these choices mid-build.

## Fonts (2 families + script fallback)
- **Display:** Bricolage Grotesque 800. Used for headlines, big numbers and HOPE.
- **Text:** Hanken Grotesk 400/500/700. Used for body copy, links and UI.
- **Fallback for Manipuri:** "Noto Sans Meetei Mayek" sits in both stacks, ahead of `sans-serif`.

## Size scale (px)
- **13:** meta, captions, footer small print
- **17:** body (line-height 1.55)
- **29:** headlines (small headings, hero headline)
- **52:** section headlines
- **104:** the big fact
- **232:** HOPE (scales down on phones: `min(232px, 31vw)`)

Headline tracking is -0.02em to -0.04em. Body line-height is 1.55.

## Colour (flat only: no gradients anywhere, no fades)
- **Page:** #FFFFFF
- **Text:** #111111. Secondary text is #111111 at 64% (`#5c5c5c`).
- **Accent, the single colour:** #1C4632, the deep green of the "Contact the Clinic" button. It's used for the solid button, links, the full-width line band and the footer.
- **Leaf green:** #3FA34D. Used only inside the 3D branch and its blossoms, never for UI.
- **Hairlines:** #111111 at 12%.

## Corner radii (2 only)
- **6px:** photos, inputs, the doctor placeholders. Things you look at.
- **999px:** things you press or that float: buttons, the nav bar, the language switch.

## Glass
- **Look:** clear "liquid" glass with almost no tint. Fill is at most rgba(255,255,255,.04), blur is 1px, and the rim is 1px from inset shadows (bright top-left, faint bottom-right). There's a small soft outer shadow.
- **Chromium:** also refracts through `backdrop-filter: url(#…)`, using an edge-normal displacement map drawn per element, so the edges bend and the centre stays clear.
- **Safari and Firefox:** rim and shadow only.
- **Used on:** the nav bar, the glass buttons and HOPE. HOPE gets an SVG lens filter: darker inner edge, clear centre, soft shadow.
- **Library:** liquid-glass-react needs React 19, and this page has no React, so the same technique is written by hand.

## Hero branch
- **Built with:** Three.js r128 (the same build as the MilliTech site), in the agency's toon style.
- **Shading:** MeshToonMaterial with a 3-step ramp, flat colours, and a dark-green ink outline (inverted hull) on the wood.
- **Leaves:** anime-style cards with inked edges.
- **Canvas:** transparent.
- **Animation:** plays once in about 4s. Bare wood with brown and orange leaves turns into green leaves growing out along the wood, then small blossoms. After that, a slow sway.

## Home page, one line per section
1. **Hero:** slim floating glass nav (logo left, links right). The branch enters top-right and runs diagonally down-left across about 60% of the width, cropped by the viewport. HOPE sits huge at bottom-left, with the branch over it. Under it: a 2-line 29px headline and one text link with an arrow.
2. **About:** a left-offset text column (the old hero paragraph plus links), with the family photo bleeding off the right edge.
3. **Services:** a plain numbered list. Hairlines, no cards, no icons.
4. **Fact:** one huge number, "4", with a single line beside it: four services under one roof.
5. **Line:** one full-width sentence on the accent green band.
6. **Visit:** address, phone and hours as plain text in two columns beside the map.

Section padding alternates: 120 / 72 / 160 / 48 / 104 px.

## Human detail
A hand-drawn SVG scribble underline under HOPE, drawn in once the branch has finished growing.

## Hover by element type
- **Text links:** the underline thickens and the arrow nudges.
- **List rows:** the number turns accent and the row indents.
- **Glass buttons:** the rim brightens.
- **Solid button:** darkens.
- **Photos:** no hover.
