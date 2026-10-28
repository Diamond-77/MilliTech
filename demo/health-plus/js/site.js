/* Health Plus Clinic demo — language switch, page router, liquid glass, small UI bits. */
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

  /* ---------------- photos ---------------- */
  const fluted = $$('.fluted');
  fluted.forEach(el => {
    el.style.backgroundImage = `url("${el.dataset.src}")`;
    el.style.backgroundPosition = el.dataset.pos || '50% 50%';
  });

  /* ---------------- reveal on scroll ---------------- */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }) : null;
  function observeReveals() {
    $$('.page:not([hidden]) .rv:not(.in)').forEach(el => io ? io.observe(el) : el.classList.add('in'));
  }

  /* ---------------- maps (loaded when the page shows) ---------------- */
  function loadMaps() {
    $$('.page:not([hidden]) .map:not(.loaded)').forEach(m => {
      m.classList.add('loaded');
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

  /* ---------------- hero bits ---------------- */
  // Liquid-glass refraction (an SVG filter inside backdrop-filter) only renders properly in
  // Chromium; Safari and Firefox keep the plain blur + saturate glass.
  const brands = (navigator.userAgentData && navigator.userAgentData.brands) || [];
  if (brands.some(b => /Chromium/.test(b.brand))) document.documentElement.classList.add('lg-refract');

  // keep the HOPE border at 1.5 screen pixels whatever size the word is drawn at
  const ring = $('#hope-ring feMorphology'), hopeBox = $('.hope');
  const sizeRing = () => { if (ring && hopeBox.clientWidth) ring.setAttribute('radius', (1.5 * 1000 / hopeBox.clientWidth).toFixed(2)); };
  addEventListener('resize', sizeRing); sizeRing();

  // a little depth: the greens and the branch drift apart as the pointer moves
  const hero = $('#hero');
  if (hero && matchMedia('(pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    addEventListener('pointermove', e => {
      hero.style.setProperty('--mx', (e.clientX / innerWidth - 0.5).toFixed(3));
      hero.style.setProperty('--my', (e.clientY / innerHeight - 0.5).toFixed(3));
    }, { passive: true });
  }

  const ribbon = $('#ribbon');
  if (store.get('hp-ribbon') === 'x') ribbon.remove();
  else $('#ribbon-x').addEventListener('click', () => { ribbon.remove(); store.set('hp-ribbon', 'x'); });

  /* ---------------- start ---------------- */
  applyLang(store.get('hp-lang') || DEFAULT_LANG, false);
  current = '';
  go();
})();
