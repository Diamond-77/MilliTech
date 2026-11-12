/* Intro: timer-driven scene machine. No video, canvas, WebGL or animation events.
   Every scene is a data-s value on #intro; CSS holds the end state of each scene, so if a
   browser drops the transitions (battery saver) the picture still lands in the right place. */
(function () {
  var html = document.documentElement;
  var root = document.getElementById('intro');
  if (!root || !/\bintro-on\b/.test(html.className)) return;

  var KEY = 'ft-intro';
  var CMD = 'npx install firsttect-institute';
  var done = false, cur = -1, waiting = false;
  var started = Date.now(), waitedMs = 0, waitStart = 0, expected = started + 4000;
  var timers = [], ticker = null, dog = null;
  var rm = false;
  try { rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var stage = root.querySelector('.i-stage');
  var logEl = root.querySelector('.i-log');
  var cmdEl = root.querySelector('.i-cmd');
  var typed = root.querySelector('.i-typed');
  var runBtn = root.querySelector('.i-run');
  var skipBtn = root.querySelector('.i-skip');

  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }

  function finish() {
    if (done) return;
    done = true;
    for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
    if (ticker) clearInterval(ticker);
    clearInterval(blinker);
    if (dog) clearInterval(dog);
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
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
    ['fetch 200 courses/ccc-cbc        3 months', ''],
    ['fetch 200 courses/dca            6 months', ''],
    ['fetch 200 courses/adca           12 months', ''],
    ['fetch 200 courses/programming    c c++ java python mysql', ''],
    ['fetch 200 courses/accounting-tally   4 months', ''],
    ['fetch 200 courses/dtp            3 months', ''],
    ['fetch 200 courses/data-entry     2 months', ''],
    ['fetch 200 courses/multimedia     4 months', ''],
    ['fetch 200 courses/pgdca          12 months', ''],
    ['fetch 200 batches/06-08 08-10 10-12 12-14 14-16 16-18', ''],
    ['fetch 200 faculty/ranjita meiteileima naresh yaiphabi', ''],
    ['fetch 200 faculty/sawalkumar ringkhuanliu kritika sinthaleima', ''],
    ['link student-services/exam-application', ''],
    ['link student-services/admit-card-download', ''],
    ['link student-services/student-dashboard', ''],
    ['link student-services/exam-result', ''],
    ['link certificate-verify notice-board enquiry', ''],
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
        if (i + 1 < total) { line(LINES[i + 1][0], LINES[i + 1][1]); i++; }
        i++;
        prog = line(bar(Math.min(1, i / total)), 'hi');
      } else {
        clearInterval(ticker); ticker = null;
        endLog();
      }
    }, 150);
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
    { n: 'pc', d: 1900 },
    { n: 'zoom', d: 1800 },
    { n: 'type', d: 1700, on: type },
    { n: 'wait', d: 0, on: wait },
    { n: 'log', d: 2000, on: startLog },
    { n: 'end', d: 650, on: endLog }
  ];

  function go(i) {
    if (done) return;
    if (i >= scenes.length) { finish(); return; }
    cur = i;
    var s = scenes[i];
    root.setAttribute('data-s', s.n);
    expected = Date.now() + s.d;
    if (s.on) { try { s.on(); } catch (e) { finish(); return; } }
    if (s.d > 0) later(function () { if (cur === i) go(i + 1); }, s.d);
  }

  function run() {
    if (done || !waiting) return;
    waiting = false;
    waitedMs += Date.now() - waitStart;
    if (rm) { cmdEl.style.display = 'none'; line('$ ' + CMD, 'w'); endLog(); root.setAttribute('data-s', 'end'); later(finish, 500); cur = scenes.length; expected = Date.now() + 500; return; }
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
    if (now - started - waitedMs > 12000) { finish(); return; }
    if (now > expected + 2500) { if (cur + 1 >= scenes.length) finish(); else go(cur + 1); }
  }, 250);

  runBtn.addEventListener('click', run);
  skipBtn.addEventListener('click', finish);
  document.addEventListener('keydown', onKey);
  window.addEventListener('error', function () { if (!done) finish(); });

  try {
    if (rm) {
      root.className += ' rm';
      cur = 3;
      root.setAttribute('data-s', 'wait');
      wait();
    } else {
      root.style.setProperty('--S', (stage.offsetWidth / 156).toFixed(3));
      void root.offsetWidth;
      go(0);
    }
  } catch (e) { finish(); }
})();
