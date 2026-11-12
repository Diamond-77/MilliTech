(function () {
  var WA = '916009896955';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* hero photo: local copy first, then the institute's own file if it loads */
  var big = new Image();
  big.onload = function () { if (big.naturalWidth > 300) $$('.hero-img').forEach(function (i) { i.src = big.src; }); };
  big.src = 'https://www.firsttect.in/images/sonia.jpg';

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
