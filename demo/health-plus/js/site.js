/* Health Plus Clinic demo — language switch, page router, services card, liquid glass, small UI bits. */
(function () {
  'use strict';

  /* ---------------- config ---------------- */
  const CLINIC = {
    whatsapp: ''            // e.g. '91XXXXXXXXXX' once the clinic confirms an official number
  };
  const DEFAULT_LANG = 'mni'; // Romanised Meiteilon by default; the EN switch shows English
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------------- i18n ----------------
     English lives in the HTML itself. On load we read it into EN, so the page,
     the translation sheet and the switch all share one source of copy. */
  const EN = {};
  const MNI = window.HP_I18N_MNI || {};
  $$('[data-i18n]').forEach(el => {
    const k = el.dataset.i18n;
    if (!(k in EN)) EN[k] = el.textContent.trim().replace(/\s+/g, ' ');
  });
  $$('[data-i18n-attr]').forEach(el => {
    el.dataset.i18nAttr.split(';').forEach(pair => {
      const [attr, k] = pair.split(':');
      if (!(k in EN)) EN[k] = el.getAttribute(attr) || '';
    });
  });
  window.HP_I18N_EN = EN;

  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // [SQUARE BRACKET CAPS] = information still to be confirmed by the clinic
  const fmt = s => esc(s).replace(/\[([^\]]+)\]/g, '<span class="ph">$1</span>');
  let lang = DEFAULT_LANG;
  const t = k => (lang === 'mni' && MNI[k]) || EN[k] || '';

  function applyLang(next, announce) {
    lang = next === 'mni' ? 'mni' : 'en';
    document.documentElement.lang = lang === 'mni' ? 'mni-Latn' : 'en';
    $$('[data-i18n]').forEach(el => {
      const v = t(el.dataset.i18n);
      if (el.tagName === 'TITLE' || el.tagName === 'OPTION') el.textContent = v;
      else el.innerHTML = fmt(v);
    });
    $$('[data-i18n-attr]').forEach(el => {
      el.dataset.i18nAttr.split(';').forEach(pair => {
        const [attr, k] = pair.split(':');
        el.setAttribute(attr, t(k));
      });
    });
    $$('.lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    store.set('hp-lang', lang);
    setSeo(current);
    window.HP_onLang && window.HP_onLang();
    if (announce && lang === 'mni' && !Object.keys(MNI).length) toast(t('toast.mni'));
  }
  $$('.lang button').forEach(b => b.addEventListener('click', () => applyLang(b.dataset.lang, true)));

  /* ---------------- toast ---------------- */
  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 4200);
  }

  /* ---------------- router ---------------- */
  const pages = $$('.page');
  const routes = pages.map(p => p.dataset.route);
  let current = 'home';

  function setSeo(route) {
    const title = t('seo.' + route + '.title'), desc = t('seo.' + route + '.desc');
    if (title) document.title = title;
    const m = $('meta[name="description"]'); if (m && desc) m.setAttribute('content', desc);
  }

  function go() {
    const r = (location.hash.replace(/^#\/?/, '').split(/[/?]/)[0]) || 'home';
    const route = routes.includes(r) ? r : 'home';
    const changed = route !== current;
    current = route;
    pages.forEach(p => {
      const on = p.dataset.route === route;
      p.hidden = !on;
      if (on) { p.classList.remove('enter'); void p.offsetWidth; p.classList.add('enter'); }
    });
    $$('[data-route-link]').forEach(a => a.classList.toggle('active', a.dataset.routeLink === route));
    document.body.dataset.route = route;
    onScroll();
    setSeo(route);
    closeMenu();
    if (changed) window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    requestAnimationFrame(() => { observeReveals(); loadMaps(); window.dispatchEvent(new Event('resize')); });
  }
  addEventListener('hashchange', go);

  /* ---------------- nav ---------------- */
  const nav = $('#nav'), burger = $('.burger');
  function closeMenu() { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', () => {
    const o = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(o));
  });
  const onScroll = () => {
    nav.classList.toggle('scrolled', scrollY > 24);
    document.body.classList.toggle('past-hero', current !== 'home' || scrollY > innerHeight * 0.6);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------------- reveal on scroll ---------------- */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }) : null;
  function observeReveals() {
    $$('.page:not([hidden]) .rv:not(.in)').forEach(el => io ? io.observe(el) : el.classList.add('in'));
  }

  /* ---------------- maps (loaded when the page shows) ----------------
     A still picture of the locality sits underneath; the live Google map loads on top.
     Where the host blocks embedded frames (a preview sandbox), the frame is dropped and
     the picture stays, still linking to Google Maps. */
  const mapLink = q => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
  let framesBlocked = false;
  document.addEventListener('securitypolicyviolation', e => {
    if (!/frame-src|child-src|default-src/.test(e.violatedDirective) || !/google/.test(e.blockedURI || '')) return;
    framesBlocked = true;
    $$('.map iframe').forEach(f => f.remove());
  });
  function loadMaps() {
    $$('.page:not([hidden]) .map:not(.loaded)').forEach(m => {
      m.classList.add('loaded');
      const a = document.createElement('a');
      a.className = 'map-still'; a.href = mapLink(m.dataset.q); a.target = '_blank'; a.rel = 'noopener';
      a.setAttribute('aria-label', 'Open the map in Google Maps');
      m.appendChild(a);
      if (framesBlocked) return;
      const f = document.createElement('iframe');
      f.loading = 'lazy'; f.title = 'Map';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      f.src = 'https://www.google.com/maps?q=' + encodeURIComponent(m.dataset.q) + '&z=15&output=embed';
      m.appendChild(f);
    });
  }

  /* ---------------- enquiry form ---------------- */
  const form = $('#enquiry');
  form && form.addEventListener('submit', e => {
    e.preventDefault();
    const d = new FormData(form), msg = $('.form-msg', form);
    if (!d.get('name').trim() || !d.get('phone').trim()) { msg.textContent = t('form.missing'); return; }
    if (CLINIC.whatsapp) {
      const text = `Hello Health Plus Clinic, I would like to enquire about ${d.get('service')}.\nName: ${d.get('name')}\nPhone: ${d.get('phone')}\n${d.get('message')}`;
      location.href = 'https://wa.me/' + CLINIC.whatsapp + '?text=' + encodeURIComponent(text);
    } else {
      msg.textContent = t('form.sent');
      form.reset();
    }
  });

  /* ---------------- pixel pictures ----------------
     Each canvas.px holds one of the clinic's inner-logo drawings. It resolves from big pixels
     to sharp when it comes into view, and the active one in the services card does it again
     now and then. */
  const pxImgs = {};
  function pixelate(cv, steps) {
    const src = cv.dataset.src;
    const img = pxImgs[src] || (pxImgs[src] = Object.assign(new Image(), { src }));
    const run = () => {
      const w = img.naturalWidth, h = img.naturalHeight;
      if (cv.width !== w) { cv.width = w; cv.height = h; }
      const g = cv.getContext('2d'), tmp = document.createElement('canvas'), tg = tmp.getContext('2d');
      const token = cv._px = {};
      let i = 0;
      const step = () => {
        if (cv._px !== token) return;
        const k = steps[i++];
        g.clearRect(0, 0, w, h);
        if (k <= 1) { g.imageSmoothingEnabled = true; g.drawImage(img, 0, 0); return; }
        tmp.width = Math.ceil(w / k); tmp.height = Math.ceil(h / k);
        tg.drawImage(img, 0, 0, tmp.width, tmp.height);
        g.imageSmoothingEnabled = false; g.drawImage(tmp, 0, 0, w, h);
        setTimeout(step, 70);
      };
      step();
    };
    img.complete && img.naturalWidth ? run() : img.addEventListener('load', run, { once: true });
  }
  const RESOLVE = [72, 48, 32, 22, 14, 9, 6, 4, 2, 1];
  const pxIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting && !e.target.closest('.care-slide')) { pixelate(e.target, RESOLVE); pxIO.unobserve(e.target); }
  }), { threshold: 0.3 }) : null;
  $$('canvas.px').forEach(c => pxIO ? pxIO.observe(c) : pixelate(c, [1]));

  /* ---------------- services card: scroll moves through the four ---------------- */
  const care = $('#care');
  if (care) {
    const btns = $$('.care-track button', care), slides = $$('.care-slide', care);
    const track = $('.care-track', care), bar = $('.care-bar', care), count = $('.care-count b', care);
    let ci = -1;
    const centre = () => {
      const b = btns[ci]; if (!b) return;
      track.style.transform = `translateX(${Math.round(bar.clientWidth / 2 - (b.offsetLeft + b.offsetWidth / 2))}px)`;
    };
    const setCare = i => {
      if (i === ci) return;
      ci = i;
      btns.forEach((b, k) => b.classList.toggle('on', k === i));
      slides.forEach((sl, k) => sl.classList.toggle('on', k === i));
      count.textContent = String(i + 1).padStart(2, '0');
      centre(); setTimeout(centre, 420);
      pixelate($('canvas', slides[i]), RESOLVE);
    };
    const careScroll = () => {
      if (current !== 'home') return;
      const total = care.offsetHeight - innerHeight;
      const p = Math.min(0.999, Math.max(0, -care.getBoundingClientRect().top / total));
      setCare(Math.floor(p * btns.length));
    };
    btns.forEach((b, k) => b.addEventListener('click', () => {
      const total = care.offsetHeight - innerHeight;
      scrollTo({ top: care.offsetTop + total * (k + 0.5) / btns.length, behavior: 'smooth' });
    }));
    addEventListener('scroll', careScroll, { passive: true });
    addEventListener('resize', centre);
    window.HP_onLang = () => setTimeout(centre, 60);
    setCare(0);
    // a small pixel flicker on the showing drawing every few seconds
    setInterval(() => {
      if (current === 'home' && !document.hidden && care.getBoundingClientRect().top < innerHeight) pixelate($('canvas', slides[ci]), [10, 6, 3, 1]);
    }, 5200);
  }

  /* ---------------- find us: falling binary under small glass caps ---------------- */
  const bin = $('.binary');
  if (bin) {
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    let html = '';
    for (let i = 0; i < 24; i++) {
      const len = 10 + Math.floor(rnd() * 12);
      let str = ''; for (let j = 0; j < len; j++) str += rnd() < 0.5 ? '0' : '1';
      html += `<span class="row" style="top:${(i * 4.1).toFixed(1)}%;left:${(i * 2.1 + rnd() * 8).toFixed(1)}%">${str}</span>`;
    }
    const caps = [[18, 4, 15, 13, 'sq'], [26, 13, 13, 11, 'sq'], [6, 22, 14, 13, 'sq'], [36, 28, 14, 12, 'sq'], [50, 29, 4.5, 12, ''], [18, 39, 14, 12, 'sq'],
      [52, 49, 18, 13, 'sq'], [52, 58, 4.5, 12, ''], [76, 52, 4.5, 13, ''], [64, 63, 5, 11, ''], [86, 60, 5, 13, ''], [56, 78, 4.5, 11, ''], [80, 77, 5, 13, '']];
    caps.forEach(([x, y, w, h, c], i) => {
      html += `<i class="cap ${c}" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%;--dx:${(i % 3 - 1) * 5}px;--dy:${8 + i % 4 * 3}px;animation-delay:${-i * 0.7}s"></i>`;
    });
    bin.innerHTML = html;
  }

  /* ---------------- liquid glass refraction (Chromium) ----------------
     Each .lg element gets its own SVG filter: an edge-normal map drawn on a canvas
     drives feDisplacementMap through backdrop-filter, so what sits behind the rim is
     pulled inwards and magnified while the centre stays clear. Safari and Firefox keep
     the CSS rim and shadow only. */
  const brands = (navigator.userAgentData && navigator.userAgentData.brands) || [];
  const chromium = brands.some(b => /Chromium/.test(b.brand));
  const NS = 'http://www.w3.org/2000/svg';
  let lgDefs = null, lgId = 0;
  function edgeMap(w, h, r, band) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
    const hx = w / 2 - r, hy = h / 2 - r;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const px = x + 0.5 - w / 2, py = y + 0.5 - h / 2;
      const qx = Math.abs(px) - hx, qy = Math.abs(py) - hy;
      let nx, ny, inside;
      if (qx > 0 && qy > 0) { const l = Math.hypot(qx, qy) || 1; nx = qx / l * Math.sign(px); ny = qy / l * Math.sign(py); inside = r - l; }
      else if (qx > qy) { nx = Math.sign(px); ny = 0; inside = r - Math.max(qx, 0); }
      else { nx = 0; ny = Math.sign(py); inside = r - Math.max(qy, 0); }
      const t = Math.max(0, 1 - inside / band), m = t * t;
      const i = (y * w + x) * 4;
      d[i] = 128 - nx * m * 127; d[i + 1] = 128 - ny * m * 127; d[i + 2] = 128; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c.toDataURL();
  }
  function refract(el) {
    const w = el.offsetWidth, h = el.offsetHeight;
    if (!w || !h) return;
    if (!lgDefs) {
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('aria-hidden', 'true'); svg.style.cssText = 'position:absolute;width:0;height:0';
      lgDefs = document.createElementNS(NS, 'defs'); svg.appendChild(lgDefs); document.body.appendChild(svg);
    }
    let f = el._lgFilter;
    if (!f) {
      f = document.createElementNS(NS, 'filter');
      f.id = 'glass-' + (++lgId);
      f.setAttribute('filterUnits', 'userSpaceOnUse'); f.setAttribute('primitiveUnits', 'userSpaceOnUse');
      f.setAttribute('color-interpolation-filters', 'sRGB');
      f.innerHTML = '<feImage result="map" preserveAspectRatio="none"/><feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="G"/>';
      lgDefs.appendChild(f); el._lgFilter = f;
    }
    const r = Math.min(h / 2, w / 2, parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0);
    const band = Math.min(16, h / 2.4);
    ['x', 'y'].forEach(a => f.setAttribute(a, 0));
    f.setAttribute('width', w); f.setAttribute('height', h);
    const im = f.firstChild;
    im.setAttribute('x', 0); im.setAttribute('y', 0); im.setAttribute('width', w); im.setAttribute('height', h);
    im.setAttribute('href', edgeMap(w, h, r, band));
    f.lastChild.setAttribute('scale', Math.round(band * 1.6));
    el.style.backdropFilter = `url(#${f.id}) blur(1px)`;
  }
  const glassAll = () => $$('.lg').forEach(el => { if (el.offsetParent !== null || el.id === 'nav') refract(el); });
  if (chromium) {
    let gt; addEventListener('resize', () => { clearTimeout(gt); gt = setTimeout(glassAll, 150); });
    addEventListener('hashchange', () => setTimeout(glassAll, 60));
    document.fonts && document.fonts.ready.then(glassAll);
    setTimeout(glassAll, 300);
  }

  const ribbon = $('#ribbon');
  if (store.get('hp-ribbon') === 'x') ribbon.remove();
  else $('#ribbon-x').addEventListener('click', () => { ribbon.remove(); store.set('hp-ribbon', 'x'); });

  /* ---------------- start ---------------- */
  applyLang(store.get('hp-lang') || DEFAULT_LANG, false);
  current = '';
  go();
})();
