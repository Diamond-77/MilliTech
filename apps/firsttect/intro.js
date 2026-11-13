/* Intro: timer-driven scene machine. No video, canvas, WebGL or animation events.
   Every scene is a data-s value on #intro; CSS holds the end state of each scene, so if a
   browser drops the transitions (battery saver) the picture still lands in the right place. */
(function () {
  var html = document.documentElement;
  var root = document.getElementById('intro');
  if (!root || !/\bintro-on\b/.test(html.className)) return;

  var CMD = 'npx install firsttect-institute';
  var done = false, cur = -1, waiting = false;
  var started = Date.now(), waitedMs = 0, waitStart = 0, expected = started + 4000;
  var timers = [], ticker = null, dog = null;
  var rm = false;
  try { rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  rm = false; /* the intro always plays in full, whatever the phone's motion setting says */

  var stage = root.querySelector('.i-stage');
  var logEl = root.querySelector('.i-log');
  var cmdEl = root.querySelector('.i-cmd');
  var typed = root.querySelector('.i-typed');
  var runBtn = root.querySelector('.i-run');
  var skipBtn = root.querySelector('.i-skip');
  var fullBtn = root.querySelector('.i-full');

  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }

  function finish() {
    if (done) return;
    done = true;
    for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
    if (ticker) clearInterval(ticker);
    clearInterval(blinker);
    if (dog) clearInterval(dog);
    html.className = html.className.replace(/\bintro-lock\b/g, '');
    root.className += ' out';
    document.removeEventListener('keydown', onKey);
    setTimeout(function () {
      html.className = html.className.replace(/\bintro-on\b/g, '');
      if (root.parentNode) root.parentNode.removeChild(root);
    }, rm ? 0 : 600);
  }

  var blink = root.querySelector('#i-blink'), blinkOn = true;
  var blinker = setInterval(function () {
    if (done || !blink) { clearInterval(blinker); return; }
    blinkOn = !blinkOn;
    blink.setAttribute('opacity', blinkOn ? '1' : '0');
  }, 450);

  function type() {
    for (var k = 1; k <= CMD.length; k++) {
      (function (k) { later(function () { typed.textContent = CMD.slice(0, k); }, 150 + k * 42); })(k);
    }
  }

  function wait() {
    typed.textContent = CMD;
    waiting = true;
    waitStart = Date.now();
    try { runBtn.focus({ preventScroll: true }); } catch (e) {}
  }

  function line(text, cls) {
    var s = document.createElement('div');
    if (cls) s.className = cls;
    s.textContent = text;
    logEl.appendChild(s);
    while (logEl.childNodes.length > 34) logEl.removeChild(logEl.firstChild);
    return s;
  }

  var LINES = [
    ['resolving firsttect-institute@2026.11 from imphal.manipur', ''],
    ['fetch 200 courses/ccc-cbc        3 months', 'c1'],
    ['fetch 200 courses/dca            6 months', 'c1'],
    ['fetch 200 courses/adca           12 months', 'c1'],
    ['fetch 200 courses/programming    c c++ java python mysql', 'c1'],
    ['fetch 200 courses/accounting-tally   4 months', 'c1'],
    ['fetch 200 courses/dtp            3 months', 'c1'],
    ['fetch 200 courses/data-entry     2 months', 'c1'],
    ['fetch 200 courses/multimedia     4 months', 'c1'],
    ['fetch 200 courses/pgdca          12 months', 'c1'],
    ['fetch 200 batches/06-08 08-10 10-12 12-14 14-16 16-18', 'c2'],
    ['fetch 200 faculty/ranjita meiteileima naresh yaiphabi', 'c2'],
    ['fetch 200 faculty/sawalkumar ringkhuanliu kritika sinthaleima', 'c2'],
    ['link student-services/exam-application', 'c3'],
    ['link student-services/admit-card-download', 'c3'],
    ['link student-services/student-dashboard', 'c3'],
    ['link student-services/exam-result', 'c3'],
    ['link certificate-verify notice-board enquiry', 'c3'],
    ['build practical-training ............ ok', 'ok'],
    ['build learn create grow-your-career . ok', 'ok']
  ];

  function bar(p) {
    var n = Math.round(p * 24), s = '';
    for (var i = 0; i < 24; i++) s += i < n ? '#' : '.';
    return '[' + s + '] ' + (p * 100 < 10 ? ' ' : '') + Math.round(p * 100) + '%';
  }

  function startLog() {
    cmdEl.style.display = 'none';
    line('$ ' + CMD, 'w');
    var i = 0, prog = null, total = LINES.length;
    ticker = setInterval(function () {
      if (done) return;
      if (i < total) {
        if (prog && prog.parentNode) logEl.removeChild(prog);
        line(LINES[i][0], LINES[i][1]);
        i++;
        prog = line(bar(Math.min(1, i / total)), 'hi');
      } else {
        clearInterval(ticker); ticker = null;
        endLog();
      }
    }, 105);
  }

  var ended = false;
  function endLog() {
    if (ended) return;
    ended = true;
    if (ticker) { clearInterval(ticker); ticker = null; }
    line('added 9 courses, 6 daily batches, 8 faculty in 2.1s', 'w');
    line('done. opening FIRSTTECT Institute', 'ok');
  }

  var scenes = [
    { n: 'draw', d: 1500 },
    { n: 'power', d: 1200 },
    { n: 'zoom', d: 2300 },
    { n: 'type', d: 1700, on: type },
    { n: 'wait', d: 0, on: wait },
    { n: 'log', d: 2700, on: startLog },
    { n: 'end', d: 750, on: endLog }
  ];

  function mark(i) {
    var names = [];
    for (var k = 0; k <= i && k < scenes.length; k++) names.push(scenes[k].n);
    root.setAttribute('data-s', scenes[Math.min(i, scenes.length - 1)].n);
    root.setAttribute('data-p', names.join(' '));
  }

  function go(i) {
    if (done) return;
    if (i >= scenes.length) { finish(); return; }
    cur = i;
    var s = scenes[i];
    mark(i);
    expected = Date.now() + s.d;
    if (s.on) { try { s.on(); } catch (e) { finish(); return; } }
    if (s.d > 0) later(function () { if (cur === i) go(i + 1); }, s.d);
  }

  function run() {
    if (done || !waiting) return;
    waiting = false;
    waitedMs += Date.now() - waitStart;
    if (rm) { cmdEl.style.display = 'none'; line('$ ' + CMD, 'w'); endLog(); later(finish, 500); cur = scenes.length; expected = Date.now() + 500; return; }
    go(cur + 1);
  }

  function onKey(e) {
    if (e.key === 'Enter' && waiting) { e.preventDefault(); run(); }
    else if (e.key === 'Escape') finish();
  }

  /* Watchdog. Wall-clock based, so it still works when timers are throttled.
     The 12s budget counts only the automatic time, never the wait for the Run press. */
  dog = setInterval(function () {
    if (done || waiting) return;
    var now = Date.now();
    if (now - started - waitedMs > 30000) { finish(); return; }
    if (now > expected + 6000) { if (cur + 1 >= scenes.length) finish(); else go(cur + 1); }
  }, 250);

  runBtn.addEventListener('click', run);
  skipBtn.addEventListener('click', finish);
  document.addEventListener('keydown', onKey);

  try {
    if (rm) {
      /* reduced motion: no zoom and no drawing. The computer shows as a still picture with its screen lit,
         then the terminal replaces it. One tap on the button below plays the full animation instead. */
      root.className += ' rm';
      cur = 1;
      mark(1);
      expected = Date.now() + 1800;
      if (fullBtn) {
        fullBtn.hidden = false;
        fullBtn.addEventListener('click', function () {
          try { localStorage.setItem('ft-motion', '1'); } catch (e) {}
          location.href = location.pathname + '?intro';
        });
      }
      later(function () {
        if (done) return;
        cur = 4;
        mark(4);
        wait();
        expected = Date.now() + 1e9;
      }, 1800);
    } else {
      /* First visit: the page is still downloading and parsing, so the main thread is busy and the
         opening transitions would finish unseen. Wait until the page has loaded (max 3s), then two
         painted frames, and only then start the clock. */
      var begun = false;
      var begin = function () {
        if (begun || done) return;
        begun = true;
        root.style.setProperty('--S', (stage.offsetWidth / 156).toFixed(3));
        void root.offsetWidth;
        var kick = function () { started = Date.now(); expected = started + 1500; go(0); };
        if (window.requestAnimationFrame) requestAnimationFrame(function () { requestAnimationFrame(function () { setTimeout(kick, 60); }); });
        else kick();
      };
      expected = Date.now() + 1e9;
      if (document.readyState === 'complete') begin();
      else window.addEventListener('load', begin);
      later(begin, 3000);
      expected = Date.now() + 6000;
    }
  } catch (e) { finish(); }
})();
