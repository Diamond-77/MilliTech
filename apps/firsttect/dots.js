/* Dotted extras: theme switch, LED ticker, big dot wordmark, scroll reveals, live batch strip. */
(function () {
  var html = document.documentElement;
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var still = false;
  try { still = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  /* ---- light / dark ---- */
  var ink = '#ededed';
  function readInk() { var v = getComputedStyle(html).getPropertyValue('--text'); if (v) ink = v.replace(/^\s+|\s+$/g, '') || ink; }
  function setTheme(t) {
    html.setAttribute('data-theme', t);
    try { localStorage.setItem('ft-theme', t); } catch (e) {}
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', t === 'light' ? '#f5f5f5' : '#0a0a0a');
    readInk();
    try { document.dispatchEvent(new Event('ft-theme')); } catch (e) {}
    $$('iframe').forEach(function (f) { try { f.contentDocument.documentElement.setAttribute('data-theme', t); f.contentDocument.dispatchEvent(new Event('ft-theme')); } catch (e) {} });
  }
  readInk();
  $$('[data-theme-toggle]').forEach(function (b) {
    b.addEventListener('click', function () { setTheme(html.getAttribute('data-theme') === 'light' ? 'dark' : 'light'); });
  });

  /* ---- canvas helpers ---- */
  function fit(cv) {
    var r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
    if (!r.width || !r.height) return null;
    if (cv._w !== r.width || cv._h !== r.height) { cv._w = r.width; cv._h = r.height; cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); }
    var c = cv.getContext('2d');
    c.setTransform(d, 0, 0, d, 0, 0);
    c.clearRect(0, 0, r.width, r.height);
    return { c: c, w: r.width, h: r.height };
  }
  var jobs = [];

  /* ---- LED ticker: text scrolling across a board of dots ---- */
  $$('canvas.led').forEach(function (cv) {
    var text = cv.getAttribute('data-text') + '   ', cells = fontCells(text), cols = text.length * 6, on = {};
    cells.forEach(function (p) { on[p[0] + ',' + p[1]] = 1; });
    jobs.push(function (t) {
      var f = fit(cv); if (!f) return;
      var pitch = f.h / 11, r = pitch * 0.3, n = Math.ceil(f.w / pitch) + 1, off = still ? 0 : t * 9, base = Math.floor(off), frac = off - base;
      for (var x = 0; x < n; x++) {
        var col = ((x + base) % cols + cols) % cols;
        for (var y = 0; y < 7; y++) {
          f.c.globalAlpha = on[col + ',' + y] ? 1 : 0.13;
          f.c.fillStyle = ink;
          f.c.beginPath();
          f.c.arc((x - frac) * pitch + pitch / 2, (y + 2) * pitch + pitch / 2, r, 0, 6.2832);
          f.c.fill();
        }
      }
      f.c.globalAlpha = 1;
    });
  });

  /* ---- big wordmark: grey dots, a white wave passes through, the pointer lights what it touches ---- */
  $$('canvas.wm').forEach(function (cv) {
    var text = cv.getAttribute('data-text'), cells = fontCells(text), cols = text.length * 6 - 1, mx = -999, my = -999;
    var seed = cells.map(function () { return Math.random() * 6.28; });
    cv.addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
    cv.addEventListener('pointerleave', function () { mx = my = -999; });
    jobs.push(function (t) {
      var f = fit(cv); if (!f) return;
      var pitch = Math.min(f.w / (cols + 1), f.h / 9), x0 = (f.w - cols * pitch) / 2, y0 = (f.h - 7 * pitch) / 2, r = pitch * 0.36;
      var dark = html.getAttribute('data-theme') !== 'light', lift = dark ? 0.3 : 0;
      var wave = still ? -99 : ((t * 0.22) % 1.6 - 0.3) * cols;
      f.c.fillStyle = ink;
      for (var i = 0; i < cells.length; i++) {
        var x = x0 + cells[i][0] * pitch + pitch / 2, y = y0 + cells[i][1] * pitch + pitch / 2;
        var a = 0.32 + lift + 0.08 * Math.sin(t * 1.3 + seed[i]);
        var dw = Math.abs(cells[i][0] - wave); if (dw < 5) a += (1 - dw / 5) * 0.7;
        var dm = Math.sqrt((x - mx) * (x - mx) + (y - my) * (y - my)); if (dm < pitch * 5) a += (1 - dm / (pitch * 5)) * 0.8;
        f.c.globalAlpha = Math.min(1, a);
        f.c.beginPath(); f.c.arc(x, y, r, 0, 6.2832); f.c.fill();
      }
      f.c.globalAlpha = 1;
    });
  });

  if (jobs.length) {
    var t0 = Date.now(), last = 0;
    var tick = function () {
      var now = Date.now();
      if (now - last > 45) { last = now; for (var i = 0; i < jobs.length; i++) jobs[i]((now - t0) / 1000); }
      if (!still) requestAnimationFrame(tick);
    };
    tick();
    document.addEventListener('ft-theme', function () { if (still) { last = 0; tick(); } });
  }

  /* ---- reveal on scroll. Content is only hidden once this script is running, and a
     timer shows everything anyway if the observer never reports. ---- */
  var rv = $$('.rv');
  function showAll() { rv.forEach(function (el) { el.className += ' in'; }); }
  if (!still && 'IntersectionObserver' in window && rv.length) {
    html.className += ' rv-on';
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.className += ' in'; io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(function (el) { io.observe(el); });
    window.addEventListener('load', function () { setTimeout(function () { rv.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < window.innerHeight && !/\bin\b/.test(el.className)) el.className += ' in'; }); }, 1500); });
  } else showAll();

  /* ---- which batch is running right now (Imphal time) ---- */
  function nowBatch() {
    var d = new Date(), h = (d.getUTCHours() + 5 + (d.getUTCMinutes() + 30 >= 60 ? 1 : 0)) % 24;
    $$('[data-hour]').forEach(function (el) { el.className = el.className.replace(/\s*now/g, '') + (+el.getAttribute('data-hour') === h ? ' now' : ''); });
    $$('[data-slot]').forEach(function (el) { var s = +el.getAttribute('data-slot'); el.className = el.className.replace(/\s*live/g, '') + (h >= s && h < s + 2 ? ' live' : ''); });
  }
  nowBatch();
  setInterval(nowBatch, 60000);
})();
