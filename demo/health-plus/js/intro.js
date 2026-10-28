/* Health Plus Clinic demo — intro.
   Two dotted hands (sampled from the Home Screen 1 design, see hands-data.js) reach slowly
   for the blue mark on black. When they touch it the mark turns black, the name appears under
   it, the page fades to white, the dots turn grey and black, and the hands draw back to rest.
   The dots are drawn with three.js: the wrists rock, each finger bends on its own beat, and
   patches of dots blink off, sweep away and come back as small square pixels.
   Without WebGL the same hands are drawn still on a 2D canvas.
   Click, scroll or press a key to skip. Add ?intro=0 to the URL to start at the end. */
(function () {
  'use strict';
  const D = window.HP_HANDS, hero = document.getElementById('hero'), cv = document.getElementById('hands');
  const body = document.body;
  const finish = () => body.classList.remove('intro');
  if (!D || !hero || !cv) { finish(); return; }

  const mark = hero.querySelector('.hero-mark');
  // design-space offsets of each hand, relative to where it rests in the design
  const START = { L: [-330, 46], R: [330, 34] };
  let W = 0, H = 0, dpr = 1, s = 1, mx = 0, my = 0, touch = { L: [0, 0], R: [0, 0] };
  let REST = { L: [0, 0], R: [0, 0] };

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = t => Math.max(0, Math.min(1, t));
  const ease = t => 0.5 - Math.cos(Math.PI * clamp(t)) / 2;
  const bgOf = light => { const v = Math.round(255 * light); return `rgb(${v},${v},${v})`; };

  function measure() {
    const r = hero.getBoundingClientRect();
    W = r.width; H = r.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
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
  }

  /* ---------- three.js renderer: the moving hands ---------- */
  const VERT = `
    attribute vec2 meta;              // hand (0 left, 1 right), random 0-1
    uniform float uT, uS, uMove, uDpr, uLight, uAlpha;
    uniform vec2 uRes, uMark, uDesignMark, uOffL, uOffR;
    varying float vC, vA, vSq;
    vec2 rot(vec2 p, vec2 c, float a) { p -= c; float sn = sin(a), cs = cos(a); return c + vec2(cs * p.x - sn * p.y, sn * p.x + cs * p.y); }
    float hash(float n) { return fract(sin(n) * 43758.5453); }
    void main() {
      vec2 p = position.xy;
      float tone = position.z / 255.0, isL = 1.0 - meta.x, r = meta.y, t = uT;
      float sgn = isL > 0.5 ? 1.0 : -1.0;
      // landmarks in design pixels: wrist, knuckle line and the way the fingers point
      vec2 wrist = mix(vec2(1700.0, 500.0), vec2(230.0, 470.0), isL);
      vec2 knuck = mix(vec2(1420.0, 560.0), vec2(470.0, 470.0), isL);
      vec2 dir = normalize(mix(vec2(-1.0, 0.5), vec2(1.0, 0.6), isL));
      vec2 nrm = vec2(-dir.y, dir.x);
      // the wrist rocks the whole hand a little
      float wa = smoothstep(0.0, 260.0, dot(p - wrist, dir));
      p = rot(p, wrist, sgn * wa * uMove * 0.05 * sin(t * 0.8 + meta.x * 2.1));
      // each finger bends from its own knuckle, on its own beat
      float along = dot(p - knuck, dir), across = dot(p - knuck, nrm);
      float ph = across * 0.028 + meta.x * 1.3;
      float k = smoothstep(-20.0, 220.0, along);
      float curl = (0.11 * sin(t * 1.25 + ph) + 0.04 * sin(t * 2.3 + ph * 1.7)) * uMove;
      p = rot(p, knuck + nrm * across, sgn * curl * k * k);
      p += vec2(sin(t * 0.7 + meta.x), cos(t * 0.9 + meta.x * 2.0)) * 3.0 * uMove;
      // on and off: single dots blink, a soft band sweeps across and takes some dots with it
      float blink = step(0.955, hash(r * 97.3 + floor(t * 5.0 + r * 40.0) * 1.7));
      float band = abs(fract(dot(p, vec2(0.0011, 0.0004)) - t * 0.11 + meta.x * 0.37) - 0.5);
      float swept = (1.0 - smoothstep(0.03, 0.07, band)) * step(r, 0.55);
      vA = uAlpha * (1.0 - blink * min(1.0, uMove * 2.0)) * (1.0 - swept * uMove);
      // a few dots turn into square pixels for a moment
      vSq = step(0.93, hash(r * 13.1 + floor(t * 1.5 + r * 9.0))) * step(0.01, uMove);
      vec2 o = meta.x < 0.5 ? uOffL : uOffR;
      vec2 sp = uMark + (p - uDesignMark + o) * uS;
      gl_Position = vec4(sp.x / uRes.x * 2.0 - 1.0, 1.0 - sp.y / uRes.y * 2.0, 0.0, 1.0);
      float rr = max(0.55, sqrt(min(1.0, tone * 1.28)) * 5.2 * uS) * (1.0 + 0.3 * vSq);
      gl_PointSize = rr * 2.0 * uDpr + 1.0;
      // the dots flip quickly around mid-grey so they never sink into the background
      float dl = clamp((uLight - 0.38) / 0.24, 0.0, 1.0);
      vC = mix(80.0 + 175.0 * tone, 205.0 - 205.0 * tone, dl) / 255.0;
    }`;
  const FRAG = `
    varying float vC, vA, vSq;
    void main() {
      vec2 q = gl_PointCoord * 2.0 - 1.0;
      float d = mix(length(q), max(abs(q.x), abs(q.y)), vSq);
      float a = (1.0 - smoothstep(0.78, 1.0, d)) * vA;
      if (a < 0.01) discard;
      gl_FragColor = vec4(vec3(vC), a);
    }`;

  function glRenderer() {
    const T3 = window.THREE;
    if (!T3) return null;
    let renderer;
    try { renderer = new T3.WebGLRenderer({ canvas: cv, alpha: true, antialias: false, premultipliedAlpha: false }); }
    catch (e) { return null; }
    renderer.setClearColor(0x000000, 0);
    const pos = [], meta = [];
    ['L', 'R'].forEach((k, h) => {
      const a = D[k];
      for (let i = 0; i < a.length; i += 3) {
        pos.push(a[i], a[i + 1], a[i + 2]);
        meta.push(h, ((i / 3) * 0.6180339887 + h * 0.31) % 1);
      }
    });
    const geo = new T3.BufferGeometry();
    geo.setAttribute('position', new T3.Float32BufferAttribute(pos, 3));
    geo.setAttribute('meta', new T3.Float32BufferAttribute(meta, 2));
    const u = {
      uT: { value: 0 }, uS: { value: 1 }, uMove: { value: 0 }, uDpr: { value: 1 }, uLight: { value: 0 }, uAlpha: { value: 0 },
      uRes: { value: new T3.Vector2() }, uMark: { value: new T3.Vector2() }, uDesignMark: { value: new T3.Vector2(D.mark[0], D.mark[1]) },
      uOffL: { value: new T3.Vector2() }, uOffR: { value: new T3.Vector2() }
    };
    const mat = new T3.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthTest: false, depthWrite: false });
    const pts = new T3.Points(geo, mat); pts.frustumCulled = false;
    const scene = new T3.Scene(); scene.add(pts);
    const cam = new T3.Camera();
    return {
      layout() {
        renderer.setPixelRatio(dpr); renderer.setSize(W, H, false);
        u.uRes.value.set(W, H); u.uMark.value.set(mx, my); u.uS.value = s; u.uDpr.value = dpr;
      },
      draw(off, light, alpha, t, move) {
        hero.style.background = bgOf(light);
        u.uOffL.value.set(off.L[0], off.L[1]); u.uOffR.value.set(off.R[0], off.R[1]);
        u.uLight.value = light; u.uAlpha.value = alpha; u.uT.value = t; u.uMove.value = move;
        renderer.render(scene, cam);
      }
    };
  }

  /* ---------- 2D fallback: the same hands, still ---------- */
  function flatRenderer() {
    const g = cv.getContext('2d'), LEVELS = 8;
    let paths = null;
    return {
      layout() {
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        paths = {};
        ['L', 'R'].forEach(k => {
          const lv = Array.from({ length: LEVELS }, () => new Path2D()), a = D[k];
          for (let i = 0; i < a.length; i += 3) {
            const v = a[i + 2], x = (a[i] - D.mark[0]) * s, y = (a[i + 1] - D.mark[1]) * s;
            const rr = Math.max(0.55, Math.sqrt(Math.min(1, v / 200)) * 5.2 * s);
            const p = lv[Math.min(LEVELS - 1, Math.floor(v / 256 * LEVELS))];
            p.moveTo(x + rr, y); p.arc(x, y, rr, 0, Math.PI * 2);
          }
          paths[k] = lv;
        });
      },
      draw(off, light, alpha) {
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        const dl = clamp((light - 0.38) / 0.24);
        g.fillStyle = bgOf(light); g.fillRect(0, 0, W, H);
        hero.style.background = g.fillStyle;
        g.globalAlpha = alpha;
        ['L', 'R'].forEach(k => {
          g.setTransform(dpr, 0, 0, dpr, (mx + off[k][0] * s) * dpr, (my + off[k][1] * s) * dpr);
          paths[k].forEach((p, l) => {
            const t = (l + 0.5) / LEVELS, c = Math.round(lerp(80 + 175 * t, 205 - 205 * t, dl));
            g.fillStyle = `rgb(${c},${c},${c})`; g.fill(p);
          });
        });
        g.globalAlpha = 1;
      }
    };
  }

  let R = null;
  const layout = () => { measure(); R.layout(); };
  const mix = (a, b, t) => ({ L: [lerp(a.L[0], b.L[0], t), lerp(a.L[1], b.L[1], t)], R: [lerp(a.R[0], b.R[0], t), lerp(a.R[1], b.R[1], t)] });

  // timeline in ms
  const T = { fade: 700, reach0: 300, reach1: 4600, touch: 4600, light0: 4800, light1: 6400, back0: 5000, back1: 8600, nav: 7800 };
  let t0 = 0, done = false, raf = 0;

  function frame(now) {
    if (!t0) t0 = now;
    const t = now - t0;
    const off = t < T.touch
      ? mix(START, touch, ease((t - T.reach0) / (T.reach1 - T.reach0)))
      : mix(touch, REST, ease((t - T.back0) / (T.back1 - T.back0)));
    const light = ease((t - T.light0) / (T.light1 - T.light0));
    // the fingers already move while reaching, and come fully alive after the touch
    const move = t < T.touch ? 0.45 : lerp(0.45, 1, ease((t - T.touch) / 1500));
    hero.classList.toggle('touching', t > T.touch - 350 && t < T.touch + 300);
    if (t >= T.touch) hero.classList.add('touched');
    if (t >= T.nav) finish();
    R.draw(off, light, clamp(t / T.fade), now / 1000, move);
    if (t < T.back1) raf = requestAnimationFrame(frame);
    else { done = true; idle(); }
  }

  // after the intro the hands keep moving while the hero is on screen
  let idleRaf = 0;
  function idle() {
    cancelAnimationFrame(idleRaf);
    const loop = now => {
      idleRaf = requestAnimationFrame(loop);
      if (!hero.offsetParent || hero.getBoundingClientRect().bottom < 0 || document.hidden) return;
      R.draw(REST, 1, 1, now / 1000, 1);
    };
    idleRaf = requestAnimationFrame(loop);
  }

  function skip() {
    if (done || !R) return;
    done = true; cancelAnimationFrame(raf);
    hero.classList.remove('touching'); hero.classList.add('touched');
    finish(); R.draw(REST, 1, 1, performance.now() / 1000, 1); idle();
    ['click', 'keydown', 'wheel', 'touchstart'].forEach(e => removeEventListener(e, skip));
  }

  const start = () => {
    R = glRenderer() || flatRenderer();
    layout();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const still = reduced || /[?&]intro=0/.test(location.search) || (location.hash && !/^#\/?home/.test(location.hash));
    if (still) {
      done = true; hero.classList.add('touched'); finish();
      if (reduced) R.draw(REST, 1, 1, 0, 0); else idle();
      return;
    }
    ['click', 'keydown', 'wheel', 'touchstart'].forEach(e => addEventListener(e, skip, { passive: true }));
    R.draw(START, 0, 0, 0, 0);
    raf = requestAnimationFrame(frame);
  };
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (!R) return; layout(); if (done) R.draw(REST, 1, 1, performance.now() / 1000, 1); }, 120); });
  addEventListener('hashchange', () => { if (!R) return; if (!done) skip(); setTimeout(layout, 50); });
  const img = mark.querySelector('img');
  (img.complete ? Promise.resolve() : new Promise(r => img.addEventListener('load', r, { once: true }))).then(start);
})();
