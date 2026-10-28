# Health Plus Clinic demo: design decisions

The demo lives in `demo-health-plus.html` and `demo/health-plus/`. It follows the clinic's own Home Screen designs (screens 1 to 5, the intro and the phone layout). Stick to that layout; improve it in code, don't redesign it.

## Fonts (from the design file)
- **Bakbak One:** the nav, page headings, the services bar and the giant footer word.
- **Bai Jamjuree 400/500/600:** body text, framed text and buttons.
- **Baloo Paaji 2:** the big "4", the Find Us section and the footer.
- **Baloo Da 2:** the fact line beside the 4 and the blue band.
- **Noto Sans Meetei Mayek:** fallback in every stack.

## Colour
- White page #FFFFFF, black text #0D0D0D, grey #9A9A9A for inactive items.
- One blue, #3477E2, taken from the design. The logo keeps its own blue #0075F0.
- Footer #0F0F0F. No gradients anywhere.

## Pieces
- **Liquid glass (`.lg`):** clear, no tint, 2px blur, thin dark rim, with edge refraction in Chromium. Used on the nav, the services bar and the service pills.
- **Services bar radius:** top-left 70, top-right 40, bottom-right 70, bottom-left 40.
- **Crosshair frame (`.xframe`):** hand-drawn lines running past the corners, slightly tilted.
- **Photo (`.photo`):** centred, balanced corner radius, 3px blue rim. Text sits around it, never on it.
- **Riveted card (`.rivet`):** black border, blue offset edge, four black screws in the corners.
- **Pill button:** white, thin black border, grey underside that presses in.
- **Link:** blue underline with a ↗ arrow.

## Home, one line per screen
1. **Intro:** dotted hands (sampled from Home Screen 1) reach the blue mark on black. On touch the mark turns black, the name appears below it, the page goes white, the dots go grey and black, and the hands pull back. Click, scroll or a key skips it; `?intro=0` starts at the end.
2. **Neighbourhood:** centred heading, framed text left and right, family photo in the middle, then the pill and the link.
3. **Services:** pinned while scrolling. The 01/04 counter, the glass bar (active item blue in brackets, the rest grey and blurred), and the inner-logo drawing under the text, resolving from big pixels.
4. **The 4:** two image tiles above, the big blue 4 with the fact line, then the full-width blue band.
5. **Find us and footer:** facts on the left, the map in a thick blue frame, falling binary under glass caps on the right. Dark footer with the logo block, ruled link columns and the outlined HEALTH PLUS.

## Inner pages
Same vocabulary: centred heading, then framed text / photo / framed text. After that, alternating split sections, riveted cards, crosshair frames and a blue band to close.

## Phone
Keep the desktop arrangement and shrink it, as in the phone layout design: the three columns stay side by side with smaller text and a smaller photo. Only long reading sections stack.
