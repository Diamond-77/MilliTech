/* Health Plus Clinic demo — intro.
   Two dotted hands (sampled from the Home Screen 1 design, see hands-data.js) reach slowly
   for the blue mark on black. When they touch it the mark turns black, the name appears under
   it, the page fades to white, the dots turn grey and black, and the hands draw back to rest.
   Click, scroll or press a key to skip. Add ?intro=0 to the URL to start at the end. */
(function () {
  'use strict';
  const D = window.HP_HANDS, hero = document.getElementById('hero'), cv = document.getElementById('hands');
  const body = document.body;
  const finish = () => body.classList.remove('intro');
  if (!D || !hero || !cv) { finish(); return; }

  const g = cv.getContext('2d');
  const mark = hero.querySelector('.hero-mark');
  const LEVELS = 8;
  // design-space offsets of each hand, relative to where it rests in the design
  const START = { L: [-330, 46], R: [330, 34] };
  let W = 0, H = 0, dpr = 1, s = 1, mx = 0, my = 0, touch = { L: [0, 0], R: [0, 0] };
  let paths = null, REST = { L: [0, 0], R: [0, 0] };

  function layout() {
    const r = hero.getBoundingClientRect();
    W = r.width; H = r.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    s = W / D.w * (W / H < 0.8 ? 1.9 : 1);
    const m = mark.getBoundingClientRect();
    mx = m.left - r.left + m.width / 2; my = m.top - r.top + m.height / 2;
    const half = m.width / 2 + 3 * s;
    // fingertips just meet the edges of the mark
    touch = {
      L: [(-half - (D.tipL[0] - D.mark[0]) * s) / s, D.mark[1] - D.tipL[1]],
      R: [(half - (D.tipR[0] - D.mark[0]) * s) / s, D.mark[1] - D.tipR[1]]
    };
    // on tall screens the hands rest closer in, so more than the fingertips stay on screen
    const k = W / H < 0.8 ? 0.55 : 0;
    REST = { L: [touch.L[0] * k, touch.L[1] * k], R: [touch.R[0] * k, touch.R[1] * k] };
    paths = {};
    ['L', 'R'].forEach(k => {
      const lv = Array.from({ length: LEVELS }, () => new Path2D()), a = D[k];
      for (let i = 0; i < a.length; i += 3) {
        const v = a[i + 2];
        const x = (a[i] - D.mark[0]) * s, y = (a[i + 1] - D.mark[1]) * s;
        const rr = Math.max(0.55, Math.sqrt(Math.min(1, v / 200)) * 5.2 * s);
        const p = lv[Math.min(LEVELS - 1, Math.floor(v / 256 * LEVELS))];
        p.moveTo(x + rr, y); p.arc(x, y, rr, 0, Math.PI * 2);
      }
      paths[k] = lv;
    });
  }

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = t => Math.max(0, Math.min(1, t));
  const ease = t => 0.5 - Math.cos(Math.PI * clamp(t)) / 2;

  // light: 0 = black page with white dots, 1 = white page with black dots
  function draw(off, light, alpha) {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bg = Math.round(255 * light);
    // the dots flip quickly around mid-grey so they never sink into the background
    const dl = clamp((light - 0.38) / 0.24);
    g.fillStyle = `rgb(${bg},${bg},${bg})`; g.fillRect(0, 0, W, H);
    hero.style.background = g.fillStyle;
    g.globalAlpha = alpha;
    ['L', 'R'].forEach(k => {
      g.setTransform(dpr, 0, 0, dpr, (mx + off[k][0] * s) * dpr, (my + off[k][1] * s) * dpr);
      paths[k].forEach((p, l) => {
        const t = (l + 0.5) / LEVELS;
        const c = Math.round(lerp(80 + 175 * t, 205 - 205 * t, dl));
        g.fillStyle = `rgb(${c},${c},${c})`; g.fill(p);
      });
    });
    g.globalAlpha = 1;
  }

  const mix = (a, b, t) => ({ L: [lerp(a.L[0], b.L[0], t), lerp(a.L[1], b.L[1], t)], R: [lerp(a.R[0], b.R[0], t), lerp(a.R[1], b.R[1], t)] });

  // timeline in ms
  const T = { fade: 700, reach0: 300, reach1: 4600, touch: 4600, light0: 4800, light1: 6400, back0: 5000, back1: 8600, nav: 7800 };
  let t0 = 0, done = false, raf = 0;

  function frame(now) {
    if (!t0) t0 = now;
    const t = now - t0;
    let off, light;
    if (t < T.touch) off = mix(START, touch, ease((t - T.reach0) / (T.reach1 - T.reach0)));
    else off = mix(touch, REST, ease((t - T.back0) / (T.back1 - T.back0)));
    light = ease((t - T.light0) / (T.light1 - T.light0));
    hero.classList.toggle('touching', t > T.touch - 350 && t < T.touch + 300);
    if (t >= T.touch) hero.classList.add('touched');
    if (t >= T.nav) finish();
    draw(off, light, clamp(t / T.fade));
    if (t < T.back1) raf = requestAnimationFrame(frame);
    else { done = true; idle(); }
  }

  // after the intro: a slow breath so the dots never feel frozen
  let idleRaf = 0;
  function idle() {
    cancelAnimationFrame(idleRaf);
    const loop = now => {
      if (!hero.offsetParent || hero.getBoundingClientRect().bottom < 0) { idleRaf = requestAnimationFrame(loop); return; }
      const k = now / 1000;
      draw({ L: [Math.sin(k * 0.6) * 5, Math.sin(k * 0.9) * 3], R: [-Math.sin(k * 0.6 + 1) * 5, Math.sin(k * 0.8 + 2) * 3] }, 1, 1);
      idleRaf = requestAnimationFrame(loop);
    };
    idleRaf = requestAnimationFrame(loop);
  }

  function skip() {
    if (done) return;
    done = true; cancelAnimationFrame(raf);
    hero.classList.remove('touching'); hero.classList.add('touched');
    finish(); draw(REST, 1, 1); idle();
    ['click', 'keydown', 'wheel', 'touchstart'].forEach(e => removeEventListener(e, skip));
  }

  const start = () => {
    layout();
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
      || /[?&]intro=0/.test(location.search)
      || (location.hash && !/^#\/?home/.test(location.hash));
    if (still) { skip(); return; }
    ['click', 'keydown', 'wheel', 'touchstart'].forEach(e => addEventListener(e, skip, { passive: true }));
    draw(START, 0, 0);
    raf = requestAnimationFrame(frame);
  };
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { layout(); if (done) draw(REST, 1, 1); }, 120); });
  addEventListener('hashchange', () => { if (!done) skip(); setTimeout(layout, 50); });
  const img = mark.querySelector('img');
  (img.complete ? Promise.resolve() : new Promise(r => img.addEventListener('load', r, { once: true }))).then(start);
})();
