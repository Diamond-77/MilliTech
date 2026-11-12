(function () {
  var WA = '916009896955';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* turning dotted 3D computer: a small 2D-canvas point cloud, no WebGL.
     Draws one frame straight away, so it still shows if animation frames never come. */
  (function () {
    var pts = [], step = 0.1;
    function add(x, y, z, nx, ny, nz) { pts.push([x, y, z, nx, ny, nz]); }
    function grid(a0, a1, b0, b1, fn) {
      for (var a = a0; a <= a1 + 1e-6; a += step) for (var b = b0; b <= b1 + 1e-6; b += step) fn(a, b);
    }
    var Z = 0.8, T = -1.2, B = 0.9;
    grid(-1, 1, T, B, function (x, y) {             /* front, with screen and disk slot cut out */
      var screen = x > -0.75 && x < 0.75 && y > -0.98 && y < 0.12;
      var slot = x > 0.18 && x < 0.78 && y > 0.4 && y < 0.5;
      if (!screen && !slot) add(x, y, Z, 0, 0, 1);
    });
    add(-0.55, -0.8, Z - 0.1, 0, 0, 1); add(-0.4, -0.8, Z - 0.1, 0, 0, 1); add(-0.3, -0.8, Z - 0.1, 0, 0, 1); /* prompt on the screen */
    grid(-1, 1, T, B, function (x, y) { if (!(y > -0.6 && y < 0.2 && Math.round(y * 10) % 2 === 0 && x > -0.6 && x < 0.6)) add(x, y, -Z, 0, 0, -1); }); /* back, with vents */
    grid(-Z, Z, T, B, function (z, y) { add(-1, y, z, -1, 0, 0); add(1, y, z, 1, 0, 0); });
    grid(-1, 1, -Z, Z, function (x, z) { add(x, T, z, 0, -1, 0); });
    grid(-0.8, 0.8, B + 0.1, B + 0.3, function (x, y) { add(x, y, 0.65, 0, 0, 1); add(x, y, -0.65, 0, 0, -1); });
    grid(-0.65, 0.65, B + 0.1, B + 0.3, function (z, y) { add(-0.8, y, z, -1, 0, 0); add(0.8, y, z, 1, 0, 0); });

    var still = false;
    try { still = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    var views = $$('canvas.pc3d').map(function (cv) { return { cv: cv, ctx: cv.getContext('2d'), w: 0, h: 0 }; });
    function size(v) {
      var r = v.cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
      if (!r.width || !r.height) return false;
      if (v.w !== r.width || v.h !== r.height) { v.w = r.width; v.h = r.height; v.cv.width = Math.round(r.width * d); v.cv.height = Math.round(r.height * d); v.d = d; }
      return true;
    }
    function draw(v, ang) {
      if (!v.ctx || !size(v)) return;
      var c = v.ctx, d = v.d, W = v.cv.width, H = v.cv.height;
      var s = Math.min(W / 4.2, H / 3.9), cx = W / 2, cy = H / 2 + 0.05 * s;
      var ca = Math.cos(ang), sa = Math.sin(ang), cp = Math.cos(0.22), sp = Math.sin(0.22);
      c.clearRect(0, 0, W, H);
      c.fillStyle = '#ededed';
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        /* how much this point's face looks at the viewer; faces turned away are not drawn */
        var nz = -p[3] * sa + p[5] * ca;
        var f = p[4] * sp + nz * cp;
        if (f < 0.16) continue;
        var x = p[0] * ca + p[2] * sa, z = -p[0] * sa + p[2] * ca;
        var y = p[1] * cp - z * sp, z2 = p[1] * sp + z * cp;
        var k = 5 / (5 - z2);
        c.globalAlpha = Math.min(1, 0.05 + f * 1.15);
        var r = s * 0.1 * (0.34 + f * 0.3) * k;
        c.beginPath();
        c.arc(cx + x * k * s, cy + y * k * s, r / 2, 0, 6.2832);
        c.fill();
      }
      c.globalAlpha = 1;
    }
    var t0 = Date.now(), last = 0;
    function frame() {
      var now = Date.now();
      if (now - last > 40) {
        last = now;
        var ang = -0.45 + (still ? 0 : (now - t0) / 1000 * 0.35);
        for (var i = 0; i < views.length; i++) if (views[i].cv.offsetParent !== null) draw(views[i], ang);
      }
      if (!still) requestAnimationFrame(frame);
    }
    if (views.length) { frame(); window.addEventListener('resize', function () { if (still) frame(); }); }
  })();

  /* phone: pager and tabs */
  var pager = $('.m-pager'), tabs = $$('.m-tabs button'), tTitle = $('.m-top .tt b'), tSub = $('.m-top .tt span');
  var meta = JSON.parse($('#m-meta').textContent);
  var active = 0;
  function setTab(i) {
    if (i === active || !tabs[i]) return;
    active = i;
    tabs.forEach(function (b, k) { b.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
    tTitle.textContent = meta[i][0];
    tSub.textContent = meta[i][1];
  }
  function goTab(i) {
    var x = i * pager.clientWidth;
    try { pager.scrollTo({ left: x, behavior: 'smooth' }); } catch (e) { pager.scrollLeft = x; }
    setTimeout(function () { if (Math.abs(pager.scrollLeft - x) > 4) pager.scrollLeft = x; setTab(i); }, 500);
  }
  if (pager) {
    pager.addEventListener('scroll', function () {
      var w = pager.clientWidth || 1;
      setTab(Math.round(pager.scrollLeft / w));
    }, { passive: true });
    tabs.forEach(function (b, i) { b.addEventListener('click', function () { goTab(i); }); });
    $$('[data-tab]').forEach(function (b) { b.addEventListener('click', function () { goTab(+b.getAttribute('data-tab')); }); });
  }

  /* course carousel counter */
  var rail = $('.m-courses .snap'), count = $('#cc-count');
  if (rail && count) {
    var cards = $$('.cc', rail);
    rail.addEventListener('scroll', function () {
      var step = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : 1;
      var i = Math.min(cards.length - 1, Math.max(0, Math.round(rail.scrollLeft / step)));
      count.textContent = (i + 1 < 10 ? '0' : '') + (i + 1) + ' / ' + (cards.length < 10 ? '0' : '') + cards.length;
    }, { passive: true });
  }

  /* bottom sheets */
  var scrim = $('.scrim'), open = null;
  function closeSheet() {
    if (!open) return;
    open.classList.remove('on');
    scrim.classList.remove('on');
    open = null;
  }
  function openSheet(id) {
    var s = document.getElementById(id);
    if (!s) return;
    if (open && open !== s) open.classList.remove('on');
    open = s;
    s.scrollTop = 0;
    s.classList.add('on');
    scrim.classList.add('on');
  }
  if (scrim) scrim.addEventListener('click', closeSheet);
  $$('[data-close]').forEach(function (b) { b.addEventListener('click', closeSheet); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });
  $$('[data-sheet]').forEach(function (b) {
    b.addEventListener('click', function () { openSheet(b.getAttribute('data-sheet')); });
  });
  /* drag a sheet down to dismiss */
  $$('.sheet').forEach(function (s) {
    var y0 = null, dy = 0;
    s.addEventListener('touchstart', function (e) { y0 = s.scrollTop <= 0 ? e.touches[0].clientY : null; dy = 0; }, { passive: true });
    s.addEventListener('touchmove', function (e) { if (y0 !== null) dy = e.touches[0].clientY - y0; }, { passive: true });
    s.addEventListener('touchend', function () { if (y0 !== null && dy > 90) closeSheet(); y0 = null; });
  });

  /* course detail sheet */
  var courses = JSON.parse($('#c-data').textContent), pick = null;
  $$('[data-course]').forEach(function (b) {
    b.addEventListener('click', function () {
      pick = courses[+b.getAttribute('data-course')];
      $('#cs-title').textContent = pick.t;
      $('#cs-desc').textContent = pick.d;
      $('#cs-dur').textContent = pick.m ? pick.m + ' Months' : 'Ask the institute';
      openSheet('sh-course');
    });
  });
  var csEnq = $('#cs-enq');
  if (csEnq) csEnq.addEventListener('click', function () {
    var f = $('#sh-enquiry form');
    f.elements.topic.value = 'Admission';
    if (pick && !f.elements.message.value) f.elements.message.value = 'I would like to know about admission for ' + pick.t + '.';
    openSheet('sh-enquiry');
  });

  /* enquiry: opens WhatsApp to the institute with the answers filled in */
  $$('form.enq-form').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = f.elements;
      var t = 'Enquiry from the FIRSTTECT website\n' +
        'Name: ' + v.name.value + '\n' +
        'Mobile: ' + v.mobile.value + '\n' +
        (v.email.value ? 'Email: ' + v.email.value + '\n' : '') +
        'Enquiry about: ' + v.topic.value + '\n' +
        'Message: ' + v.message.value;
      window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(t), '_blank', 'noopener');
    });
  });

  /* replay the intro */
  $$('[data-replay]').forEach(function (b) {
    b.addEventListener('click', function () {
      try { sessionStorage.removeItem('ft-intro'); } catch (e) {}
      location.href = location.pathname + '?intro';
    });
  });
})();
