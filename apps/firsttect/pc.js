/* The big dotted computer: a 2D-canvas point cloud (no WebGL).
   Drag to spin it. Its screen prints a terminal log in dot-matrix type.
   Click the screen and it turns to face you, zooms in, and shows the live site inside. */
(function () {
  var MINI = /\bmini\b/.test(document.documentElement.className);
  var still = false;
  try { still = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  /* ---- model ---- */
  var STEP = 0.05, Z = 0.85, T = -1.2, B = 0.95, R = 0.16;
  var SX0 = -0.74, SX1 = 0.74, SY0 = -0.98, SY1 = 0.08, SZ = Z - 0.05;   /* screen glass */
  var pts = [];
  function add(x, y, z, nx, ny, nz) { pts.push([x, y, z, nx, ny, nz, Math.random() * 6.28, 0.5 + Math.random() * 1.7]); }
  function grid(a0, a1, b0, b1, fn) {
    var na = Math.round((a1 - a0) / STEP), nb = Math.round((b1 - b0) / STEP);
    for (var i = 0; i <= na; i++) for (var j = 0; j <= nb; j++) fn(a0 + i * STEP, b0 + j * STEP);
  }
  function round(x, y, x0, x1, y0, y1) {          /* is the point inside a rounded rectangle */
    var dx = Math.max(x0 + R - x, 0, x - (x1 - R)), dy = Math.max(y0 + R - y, 0, y - (y1 - R));
    return dx * dx + dy * dy <= R * R + 1e-6;
  }
  grid(-1, 1, T, B, function (x, y) {
    if (!round(x, y, -1, 1, T, B)) return;
    var screen = x > SX0 - 0.02 && x < SX1 + 0.02 && y > SY0 - 0.02 && y < SY1 + 0.02;
    var slot = x > 0.2 && x < 0.78 && y > 0.43 && y < 0.5;
    if (!screen && !slot) add(x, y, Z, 0, 0, 1);
  });
  grid(-1, 1, T, B, function (x, y) {
    if (!round(x, y, -1, 1, T, B)) return;
    var vent = y > -0.7 && y < 0.25 && x > -0.6 && x < 0.6 && Math.round(y / STEP) % 3 === 0;
    if (!vent) add(x, y, -Z, 0, 0, -1);
  });
  grid(-Z + STEP, Z - STEP, T + R, B - R, function (z, y) { add(-1, y, z, -1, 0, 0); add(1, y, z, 1, 0, 0); });
  grid(-1 + R, 1 - R, -Z + STEP, Z - STEP, function (x, z) { add(x, T, z, 0, -1, 0); });
  grid(-0.8, 0.8, B + 0.1, B + 0.3, function (x, y) { add(x, y, 0.68, 0, 0, 1); add(x, y, -0.68, 0, 0, -1); });
  grid(-0.68 + STEP, 0.68 - STEP, B + 0.1, B + 0.3, function (z, y) { add(-0.8, y, z, -1, 0, 0); add(0.8, y, z, 1, 0, 0); });

  /* ---- terminal log on the screen ---- */
  var LOG = [
    ['$ npx install firsttect', 0], ['resolving imphal.manipur', 0], ['fetch courses/ccc-cbc', 1], ['fetch courses/dca', 1],
    ['fetch courses/adca', 1], ['fetch courses/pgdca', 1], ['fetch courses/tally', 1], ['fetch courses/dtp', 1],
    ['fetch courses/multimedia', 1], ['fetch batches 06-18', 2], ['fetch faculty 8', 2], ['link exam-result', 3],
    ['link admit-card', 3], ['link certificate', 3], ['build practical ... ok', 0], ['[##########....] 71%', 0],
    ['[##############] 100%', 0], ['done. learn create grow', 0], ['', 0], ['click screen to open', 0]
  ].map(function (l) { return { cells: fontCells(l[0]), col: l[1] }; });
  var PITCH = (SX1 - SX0 - 0.08) / 144, ROWS = 12;

  /* ---- colours follow the theme ---- */
  var ink = '#ededed', cols = ['#ededed', '#6ea8ff', '#5fd39a', '#f0b24a'];
  function readTheme() {
    var cs = getComputedStyle(document.documentElement);
    var g = function (n, d) { var v = cs.getPropertyValue(n); return v ? v.replace(/^\s+|\s+$/g, '') || d : d; };
    ink = g('--text', ink);
    cols = [ink, g('--c1', cols[1]), g('--c2', cols[2]), g('--c3', cols[3])];
  }
  readTheme();
  document.addEventListener('ft-theme', readTheme);

  function View(wrap) {
    var cv = wrap.querySelector('canvas'), ctx = cv.getContext('2d');
    var v = { yaw: -0.5, pitch: 0.2, vy: 0, zoom: 1, ox: 0, oy: 0, mode: 'idle', hold: 0, t0: Date.now(), W: 0, H: 0, d: 1 };
    var mirror = null, drag = null, anim = null;

    function size() {
      var r = wrap.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
      if (!r.width || !r.height) return false;
      if (v.W !== r.width || v.H !== r.height) { v.W = r.width; v.H = r.height; v.d = d; cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); }
      return true;
    }
    function base() { return Math.min(v.W / 3.2, v.H / 3.5); }
    function project(x, y, z, o) {
      var ca = o.ca, sa = o.sa, cp = o.cp, sp = o.sp;
      var x1 = x * ca + z * sa, z1 = -x * sa + z * ca;
      var y1 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
      var k = 5 / (5 - z2);
      o.x = o.cx + x1 * k * o.s; o.y = o.cy + y1 * k * o.s; o.k = k;
    }
    function cam() {
      var s = base() * v.zoom;
      return { ca: Math.cos(v.yaw), sa: Math.sin(v.yaw), cp: Math.cos(v.pitch), sp: Math.sin(v.pitch), s: s, cx: v.W / 2 + v.ox, cy: v.H / 2 + v.oy - 0.05 * s };
    }
    function draw(t) {
      if (!size()) return;
      var d = v.d, o = cam(), c = ctx;
      c.setTransform(d, 0, 0, d, 0, 0);
      c.clearRect(0, 0, v.W, v.H);
      c.fillStyle = ink;
      var rad = Math.max(0.6, o.s * STEP * 0.2), i, p, nz, f, r;
      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        nz = -p[3] * o.sa + p[5] * o.ca;
        f = p[4] * o.sp + nz * o.cp;
        if (f < 0.14) continue;
        project(p[0], p[1], p[2], o);
        c.globalAlpha = Math.min(1, 0.06 + f * 1.1) * (0.6 + 0.4 * Math.sin(t * p[7] + p[6]));
        r = rad * o.k * (0.75 + f * 0.5);
        c.beginPath(); c.arc(o.x, o.y, r, 0, 6.2832); c.fill();
      }
      /* screen: dot-matrix terminal log, scrolling a line at a time */
      var fs = o.cp * o.ca;
      if (fs > 0.14 && !mirror) {
        var first = still ? 0 : Math.floor(t / 0.75), a = Math.min(1, fs * 1.25), pr = Math.max(0.5, PITCH * o.s * 0.42);
        for (var ln = 0; ln < ROWS; ln++) {
          var L = LOG[(first + ln) % LOG.length];
          c.fillStyle = cols[L.col];
          c.globalAlpha = a * (ln === ROWS - 1 && !still ? Math.min(1, (t / 0.75) % 1 * 3) : 1);
          for (var q = 0; q < L.cells.length; q++) {
            project(SX0 + 0.05 + L.cells[q][0] * PITCH, SY0 + 0.06 + (ln * 8.4 + L.cells[q][1]) * PITCH, SZ, o);
            c.fillRect(o.x - pr, o.y - pr, pr * 2, pr * 2);
          }
        }
        if (!still && Math.floor(t * 2.2) % 2 === 0) {      /* cursor */
          c.fillStyle = ink; c.globalAlpha = a;
          project(SX0 + 0.05, SY0 + 0.06 + (ROWS * 8.4 - 5) * PITCH, SZ, o);
          c.fillRect(o.x, o.y, PITCH * o.s * 5, PITCH * o.s * 1.4);
        }
      }
      c.globalAlpha = 1;
    }
    function screenRect() {
      var o = cam(), a = {}, b = {};
      project(SX0, SY0, SZ, o); a.x = o.x; a.y = o.y;
      project(SX1, SY1, SZ, o); b.x = o.x; b.y = o.y;
      return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
    }
    function overScreen(px, py) {
      if (Math.cos(v.yaw) * Math.cos(v.pitch) < 0.5) return false;
      var o = cam(), xs = [], ys = [];
      [[SX0, SY0], [SX1, SY0], [SX0, SY1], [SX1, SY1]].forEach(function (k) { project(k[0], k[1], SZ, o); xs.push(o.x); ys.push(o.y); });
      return px > Math.min.apply(0, xs) && px < Math.max.apply(0, xs) && py > Math.min.apply(0, ys) && py < Math.max.apply(0, ys);
    }

    /* ---- the site inside the screen ---- */
    function tween(to, ms, done) {
      var from = { yaw: v.yaw, pitch: v.pitch, zoom: v.zoom, ox: v.ox, oy: v.oy }, s0 = Date.now();
      from.yaw = Math.atan2(Math.sin(from.yaw), Math.cos(from.yaw));
      anim = function () {
        var k = still ? 1 : Math.min(1, (Date.now() - s0) / ms), e = 1 - Math.pow(1 - k, 3);
        for (var n in to) v[n] = from[n] + (to[n] - from[n]) * e;
        if (k >= 1) { anim = null; if (done) done(); }
      };
    }
    function open() {
      if (MINI || v.mode !== 'idle') return;
      v.mode = 'opening'; v.vy = 0;
      wrap.className += ' zoomed';
      /* zoom until the screen nearly fills the panel, centred on the screen */
      var s = base(), k = 5 / (5 - SZ);
      var zoom = Math.min(0.92 * v.W / ((SX1 - SX0) * k * s), 0.9 * v.H / ((SY1 - SY0) * k * s));
      var oy = -((SY0 + SY1) / 2) * k * s * zoom + 0.05 * s * zoom;
      tween({ yaw: 0, pitch: 0, zoom: zoom, ox: 0, oy: oy }, 700, function () {
        v.mode = 'open';
        var r = screenRect(), vw = window.innerWidth <= 820 ? 960 : 1280, sc = r.w / vw;
        mirror = document.createElement('div');
        mirror.className = 'pc-mirror';
        mirror.style.cssText = 'left:' + r.x + 'px;top:' + r.y + 'px;width:' + r.w + 'px;height:' + r.h + 'px';
        var f = document.createElement('iframe');
        f.title = 'The site, inside the computer';
        f.src = location.pathname + '?mini=1';
        f.style.cssText = 'width:' + vw + 'px;height:' + (r.h / sc) + 'px;transform:scale(' + sc + ')';
        mirror.appendChild(f);
        var x = document.createElement('button');
        x.type = 'button'; x.className = 'pc-close'; x.textContent = 'Close screen';
        x.addEventListener('click', close);
        wrap.appendChild(mirror); wrap.appendChild(x);
        setTimeout(function () { if (mirror) mirror.className += ' on'; }, 30);
      });
    }
    function close() {
      if (v.mode !== 'open') return;
      v.mode = 'closing';
      var x = wrap.querySelector('.pc-close');
      if (x) wrap.removeChild(x);
      if (mirror) { wrap.removeChild(mirror); mirror = null; }
      wrap.className = wrap.className.replace(/\s*zoomed/g, '');
      tween({ yaw: -0.3, pitch: 0.2, zoom: 1, ox: 0, oy: 0 }, 600, function () { v.mode = 'idle'; v.hold = Date.now(); });
    }
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

    /* ---- drag to spin ---- */
    function pos(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    cv.addEventListener('pointerdown', function (e) {
      if (v.mode !== 'idle') return;
      var p = pos(e);
      drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: Date.now(), moved: false, onScreen: overScreen(p.x, p.y) };
      v.vy = 0;
      try { cv.setPointerCapture(e.pointerId); } catch (er) {}
    });
    cv.addEventListener('pointermove', function (e) {
      if (!drag) { var p = pos(e); cv.style.cursor = v.mode === 'idle' && !MINI && overScreen(p.x, p.y) ? 'zoom-in' : 'grab'; return; }
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) > 6) drag.moved = true;
      v.yaw += dx * 0.011; v.vy = dx * 0.011;
      v.pitch = Math.max(-0.5, Math.min(0.6, v.pitch + dy * 0.006));
      drag.x = e.clientX; drag.y = e.clientY;
      cv.style.cursor = 'grabbing';
    });
    function up() {
      if (!drag) return;
      var tap = !drag.moved && Date.now() - drag.t < 500, on = drag.onScreen;
      drag = null; v.hold = Date.now(); cv.style.cursor = 'grab';
      if (tap && on) open();
    }
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', function () { drag = null; v.hold = Date.now(); });

    v.step = function (now) {
      if (cv.offsetParent === null) return;
      var t = (now - v.t0) / 1000;
      if (anim) anim();
      else if (v.mode === 'idle' && !drag && !still) {
        v.yaw += v.vy; v.vy *= 0.94;
        if (now - v.hold > 2600 && Math.abs(v.vy) < 0.002) {     /* drift back to a slow sway around the front */
          var target = -0.1 + 0.5 * Math.sin(t * 0.35), cur = Math.atan2(Math.sin(v.yaw), Math.cos(v.yaw));
          v.yaw = cur + (target - cur) * 0.03;
          v.pitch += (0.2 - v.pitch) * 0.03;
        }
      }
      draw(still ? 0 : t);
    };
    return v;
  }

  var views = Array.prototype.slice.call(document.querySelectorAll('.pcw')).map(View);
  if (!views.length) return;
  var last = 0;
  function frame() {
    var now = Date.now();
    if (now - last > 38) { last = now; for (var i = 0; i < views.length; i++) views[i].step(now); }
    requestAnimationFrame(frame);
  }
  for (var i = 0; i < views.length; i++) views[i].step(Date.now());   /* first frame without waiting */
  requestAnimationFrame(frame);
})();
