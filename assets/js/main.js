/* =============================================================================
   Niké TOP Liga — landing page
   Odpočet, odhaľovanie sekcií, mobilná lišta, prenos UTM parametrov.
   ========================================================================== */

(function () {
  'use strict';

  /* --------------------------------------------------------------- termíny */
  // Uzávierka pre súčasné tímy (a zároveň nižšie štartovné) a pre nové tímy.
  // Čas v pásme Európa/Bratislava, v auguste UTC+2.
  var DEADLINES = [
    { at: new Date('2026-08-17T23:59:59+02:00'), label: 'Do konca nižšieho štartovného zostáva' },
    { at: new Date('2026-08-31T23:59:59+02:00'), label: 'Do uzávierky prihlášok zostáva' }
  ];

  function activeDeadline() {
    var now = Date.now();
    for (var i = 0; i < DEADLINES.length; i++) {
      if (DEADLINES[i].at.getTime() > now) return DEADLINES[i];
    }
    return null;
  }

  /* -------------------------------------------------------------- odpočet */
  function initCountdown() {
    var box = document.querySelector('[data-countdown]');
    var dock = document.querySelector('[data-dock-days]');
    if (!box && !dock) return;

    var target = activeDeadline();

    if (!target) {
      if (box) box.style.display = 'none';
      if (dock) dock.textContent = '—';
      return;
    }

    if (box) {
      var labelEl = box.querySelector('[data-cd-label]');
      if (labelEl) labelEl.textContent = target.label;
    }

    var out = {};
    ['d', 'h', 'm', 's'].forEach(function (k) {
      out[k] = box ? box.querySelector('[data-cd="' + k + '"]') : null;
    });

    function pad(n) { return n < 10 ? '0' + n : String(n); }

    function tick() {
      var left = target.at.getTime() - Date.now();
      if (left <= 0) { location.reload(); return; }

      var s = Math.floor(left / 1000);
      var d = Math.floor(s / 86400);
      var h = Math.floor((s % 86400) / 3600);
      var m = Math.floor((s % 3600) / 60);
      var sec = s % 60;

      if (out.d) out.d.textContent = d;
      if (out.h) out.h.textContent = pad(h);
      if (out.m) out.m.textContent = pad(m);
      if (out.s) out.s.textContent = pad(sec);

      if (dock) dock.textContent = d > 0 ? (d + ' dní') : (h + ' hod');
    }

    tick();
    setInterval(tick, 1000);
  }

  /* ------------------------------------------- zosivenie termínov v minulosti */
  function initTimeline() {
    var list = document.querySelector('[data-timeline]');
    if (!list) return;
    var now = Date.now();
    Array.prototype.forEach.call(list.querySelectorAll('li[data-date]'), function (li) {
      var d = new Date(li.getAttribute('data-date') + 'T23:59:59+02:00');
      if (d.getTime() < now) li.classList.add('is-past');
    });
  }

  /* ------------------------------------------------------ odhaľovanie sekcií */
  function initReveal() {
    var items = document.querySelectorAll('.rv');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });

    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
  }

  /* -------------------------------------------- mobilná lišta s CTA po scrolle */
  function initDock() {
    var dock = document.querySelector('[data-dock]');
    var hero = document.querySelector('.hero');
    if (!dock || !hero) return;

    document.body.classList.add('has-dock');

    function check() {
      var past = window.scrollY > (hero.offsetHeight * 0.75);
      dock.classList.toggle('is-on', past);
    }

    check();
    window.addEventListener('scroll', check, { passive: true });
  }

  /* ------------------------------------------------------------ UTM a zdroj */
  // Zdroj návštevy si uložíme a neskôr ho pripneme k registrácii,
  // aby sa dalo vyhodnotiť, ktorá kreatíva reálne priviedla tím.
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];

  function captureSource() {
    var qs = new URLSearchParams(location.search);
    var found = {};
    var any = false;

    UTM_KEYS.forEach(function (k) {
      var v = qs.get(k);
      if (v) { found[k] = v; any = true; }
    });

    try {
      var stored = JSON.parse(sessionStorage.getItem('tl_source') || '{}');
      if (any) {
        found.landed_at = new Date().toISOString();
        found.referrer = document.referrer || '';
        sessionStorage.setItem('tl_source', JSON.stringify(found));
      } else if (!stored.landed_at) {
        sessionStorage.setItem('tl_source', JSON.stringify({
          landed_at: new Date().toISOString(),
          referrer: document.referrer || ''
        }));
      }
    } catch (e) { /* privátny režim — ignorujeme */ }
  }

  // Zdroj prenesieme aj do URL formulárov, nech prežije aj bez sessionStorage.
  function decorateLinks() {
    var src;
    try { src = JSON.parse(sessionStorage.getItem('tl_source') || '{}'); } catch (e) { src = {}; }

    var pass = UTM_KEYS.filter(function (k) { return src[k]; });
    if (!pass.length) return;

    Array.prototype.forEach.call(document.querySelectorAll('a[href$=".html"]'), function (a) {
      var u = new URL(a.getAttribute('href'), location.href);
      pass.forEach(function (k) { u.searchParams.set(k, src[k]); });
      a.setAttribute('href', u.pathname.split('/').pop() + u.search);
    });
  }

  /* ------------------------------------------------------------- meranie */
  // Jediné miesto, cez ktoré ide meranie. Keď doplníš Meta Pixel / GA4,
  // udalosti sa začnú posielať automaticky, tu už nič meniť nemusíš.
  window.tlTrack = function (name, params) {
    params = params || {};
    if (typeof window.fbq === 'function') window.fbq('trackCustom', name, params);
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
    if (window.dataLayer && typeof window.dataLayer.push === 'function') {
      window.dataLayer.push(Object.assign({ event: name }, params));
    }
  };

  function initCtaTracking() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-cta]'), function (a) {
      a.addEventListener('click', function () {
        window.tlTrack('cta_click', { placement: a.getAttribute('data-cta') });
      });
    });
  }

  /* ------------------------------------------------------------------ štart */
  captureSource();
  initCountdown();
  initTimeline();
  initReveal();
  initDock();
  initCtaTracking();
  decorateLinks();
})();
