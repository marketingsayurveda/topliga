/* =============================================================================
   Niké TOP Liga — motor registračných formulárov
   Viackrokový formulár, validácia v slovenčine, rozpísaný koncept a odoslanie.

   >>> INTEGRAČNÝ BOD <<<
   Jediné miesto, kde sa rieši, kam dáta idú, je funkcia sendRegistration()
   na konci tohto súboru. Teraz posiela do Netlify Forms — pozri poznámku
   pri nej, testuj až na nasadenej stránke, lokálne to nefunguje.
   ========================================================================== */

(function () {
  'use strict';

  var form = document.querySelector('[data-mform]');
  if (!form) return;

  var FORM_ID = form.getAttribute('data-mform');
  var DRAFT_KEY = 'tl_draft_' + FORM_ID;

  var steps = Array.prototype.slice.call(form.querySelectorAll('[data-step]'));
  var fill = document.querySelector('[data-progress-fill]');
  var counter = document.querySelector('[data-progress-count]');
  var stepName = document.querySelector('[data-progress-name]');
  var btnNext = form.querySelector('[data-next]');
  var btnPrev = form.querySelector('[data-prev]');
  var btnSend = form.querySelector('[data-send]');
  var doneBox = document.querySelector('[data-done]');

  var current = 0;

  /* ====================================================== pomocné funkcie */

  function fieldOf(el) { return el.closest('.f') || el.closest('fieldset') || el.parentElement; }

  function markBad(el, msg) {
    var f = fieldOf(el);
    if (!f) return;
    f.classList.add('is-bad');
    var e = f.querySelector('.f__err');
    if (e && msg) e.textContent = msg;
  }

  function clearBad(scope) {
    Array.prototype.forEach.call(scope.querySelectorAll('.is-bad'), function (f) {
      f.classList.remove('is-bad');
    });
  }

  function isVisible(el) {
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }

  /* ========================================================== validácia */

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

  function validateStep(step) {
    clearBad(step);
    var firstBad = null;

    function fail(el, msg) {
      markBad(el, msg);
      if (!firstBad) firstBad = el;
    }

    /* --- bežné povinné polia --- */
    Array.prototype.forEach.call(step.querySelectorAll('[required]'), function (el) {
      if (!isVisible(el) && el.type !== 'radio' && el.type !== 'checkbox') return;

      if (el.type === 'checkbox') {
        if (!el.checked) fail(el, el.getAttribute('data-msg') || 'Bez tohto súhlasu registráciu nevieme prijať.');
        return;
      }

      if (el.type === 'radio') {
        var group = step.querySelectorAll('input[name="' + el.name + '"]');
        var picked = Array.prototype.some.call(group, function (r) { return r.checked; });
        if (!picked) fail(el, 'Vyber jednu možnosť.');
        return;
      }

      var v = (el.value || '').trim();
      if (!v) { fail(el, 'Toto pole musíme mať vyplnené.'); return; }

      if (el.type === 'email' && !EMAIL_RE.test(v)) {
        fail(el, 'E-mail nevyzerá správne. Skontroluj ho, budeme ti naň písať.');
        return;
      }

      if (el.type === 'tel' && v.replace(/[^0-9]/g, '').length < 9) {
        fail(el, 'Zadaj telefónne číslo aj s predvoľbou, napr. +421 900 123 456.');
        return;
      }

      var min = el.getAttribute('minlength');
      if (min && v.length < parseInt(min, 10)) {
        fail(el, 'Zadaj aspoň ' + min + ' znakov.');
        return;
      }

      var max = el.getAttribute('maxlength');
      if (max && v.length > parseInt(max, 10)) {
        fail(el, 'Maximálne ' + max + ' znakov.');
      }
    });

    /* --- skupiny zaškrtávacích políčok (aspoň jedna možnosť) --- */
    Array.prototype.forEach.call(step.querySelectorAll('[data-req-group]'), function (grp) {
      var boxes = grp.querySelectorAll('input[type="checkbox"]');
      var any = Array.prototype.some.call(boxes, function (b) { return b.checked; });
      if (!any && boxes.length) fail(boxes[0], 'Označ aspoň jednu možnosť.');
    });

    /* --- hodnotenie dní a časov: aspoň N položiek so známkou <= 3 --- */
    Array.prototype.forEach.call(step.querySelectorAll('[data-rate-group]'), function (grp) {
      var need = parseInt(grp.getAttribute('data-min-good') || '2', 10);
      var rows = grp.querySelectorAll('.rate');
      var unrated = 0;
      var good = 0;

      Array.prototype.forEach.call(rows, function (row) {
        var picked = row.querySelector('input:checked');
        if (!picked) { unrated++; return; }
        if (parseInt(picked.value, 10) <= 3) good++;
      });

      if (unrated > 0) {
        fail(grp, 'Oznámkuj všetky riadky — aj tie, ktoré vám vôbec nesedia (5).');
        return;
      }
      if (good < need) {
        fail(grp, 'Musíš označiť aspoň ' + need + ' možnosti so známkou 3 alebo lepšou. Inak vás nevieme zaradiť do rozpisu.');
      }
    });

    if (firstBad) {
      var f = fieldOf(firstBad);
      (f || firstBad).scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (typeof firstBad.focus === 'function') {
        setTimeout(function () { try { firstBad.focus({ preventScroll: true }); } catch (e) {} }, 320);
      }
      return false;
    }

    return true;
  }

  /* ======================================================== prepínanie krokov */

  function showStep(i, opts) {
    opts = opts || {};
    current = Math.max(0, Math.min(i, steps.length - 1));

    steps.forEach(function (s, idx) {
      s.classList.toggle('is-active', idx === current);
    });

    var pct = ((current + 1) / steps.length) * 100;
    if (fill) fill.style.width = pct + '%';
    if (counter) counter.innerHTML = 'Krok <b>' + (current + 1) + '</b> z ' + steps.length;
    if (stepName) stepName.textContent = steps[current].getAttribute('data-step-name') || '';

    var last = current === steps.length - 1;
    if (btnNext) btnNext.hidden = last;
    if (btnSend) btnSend.hidden = !last;
    if (btnPrev) btnPrev.hidden = current === 0;

    if (last) buildSummary();

    if (!opts.silent) {
      var top = document.querySelector('[data-form-top]') || form;
      top.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.tlTrack && window.tlTrack('form_step', { form: FORM_ID, step: current + 1 });
    }
  }

  if (btnNext) {
    btnNext.addEventListener('click', function () {
      if (!validateStep(steps[current])) return;
      saveDraft();
      showStep(current + 1);
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener('click', function () {
      saveDraft();
      showStep(current - 1);
    });
  }

  // Enter nemá odosielať formulár uprostred, len posunúť na ďalší krok.
  form.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      if (current < steps.length - 1 && btnNext) btnNext.click();
    }
  });

  // Chybu odstránime hneď, ako človek začne pole opravovať.
  form.addEventListener('input', function (e) {
    var f = fieldOf(e.target);
    if (f && f.classList.contains('is-bad')) f.classList.remove('is-bad');
  });
  form.addEventListener('change', function (e) {
    var f = fieldOf(e.target);
    if (f && f.classList.contains('is-bad')) f.classList.remove('is-bad');
    var grp = e.target.closest('[data-rate-group], [data-req-group]');
    if (grp && grp.classList.contains('is-bad')) grp.classList.remove('is-bad');
  });

  /* ============================================== zber dát a zhrnutie */

  function collect() {
    var data = {};

    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.disabled) return;

      if (el.type === 'checkbox') {
        if (el.getAttribute('data-multi') !== null) {
          data[el.name] = data[el.name] || [];
          if (el.checked) data[el.name].push(el.value);
        } else {
          data[el.name] = el.checked;
        }
        return;
      }

      if (el.type === 'radio') {
        if (el.checked) data[el.name] = el.value;
        else if (!(el.name in data)) data[el.name] = '';
        return;
      }

      if (el.type === 'file') {
        data[el.name] = el.files && el.files[0] ? el.files[0].name : '';
        return;
      }

      data[el.name] = (el.value || '').trim();
    });

    return data;
  }

  function buildSummary() {
    var box = form.querySelector('[data-summary]');
    if (!box) return;

    box.innerHTML = '';

    Array.prototype.forEach.call(form.querySelectorAll('[data-sum]'), function (el) {
      var label = el.getAttribute('data-sum');
      var val = '';

      if (el.tagName === 'SELECT') {
        val = el.selectedIndex > -1 ? el.options[el.selectedIndex].text : '';
        if (val === 'Vyberte' || val === '—') val = '';
      } else {
        val = (el.value || '').trim();
      }

      if (!val) return;

      var row = document.createElement('div');
      row.className = 'summary__row';
      var dt = document.createElement('dt');
      dt.textContent = label;
      var dd = document.createElement('dd');
      dd.textContent = val;
      row.appendChild(dt);
      row.appendChild(dd);
      box.appendChild(row);
    });

    if (!box.children.length) box.style.display = 'none';
    else box.style.display = '';
  }

  /* ================================================= rozpísaný koncept */

  function saveDraft() {
    try {
      var d = collect();
      delete d.suhlas;              // súhlas nech človek potvrdí vždy nanovo
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ at: Date.now(), data: d }));
    } catch (e) { /* nič, len prídeme o koncept */ }
  }

  function loadDraft() {
    var raw;
    try { raw = localStorage.getItem(DRAFT_KEY); } catch (e) { return; }
    if (!raw) return;

    var parsed;
    try { parsed = JSON.parse(raw); } catch (e) { return; }

    // Koncept starší ako 14 dní zahodíme.
    if (!parsed.at || Date.now() - parsed.at > 14 * 864e5) {
      try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
      return;
    }

    var d = parsed.data || {};
    var restored = 0;

    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || !(el.name in d) || el.type === 'file') return;
      var v = d[el.name];

      if (el.type === 'checkbox') {
        if (Array.isArray(v)) el.checked = v.indexOf(el.value) > -1;
        else if (el.name !== 'suhlas') el.checked = !!v;
        if (el.checked) restored++;
        return;
      }
      if (el.type === 'radio') {
        el.checked = (el.value === v);
        if (el.checked) restored++;
        return;
      }
      if (v) { el.value = v; restored++; }
    });

    if (restored > 2) {
      var note = document.querySelector('[data-draft-note]');
      if (note) note.hidden = false;
    }
  }

  var clearBtn = document.querySelector('[data-draft-clear]');
  if (clearBtn) {
    clearBtn.addEventListener('click', function (e) {
      e.preventDefault();
      try { localStorage.removeItem(DRAFT_KEY); } catch (err) {}
      location.reload();
    });
  }

  form.addEventListener('change', saveDraft);

  /* ======================================================== odoslanie */

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!validateStep(steps[current])) return;

    var payload = collect();

    // K registrácii pripneme zdroj návštevy, nech vieš, ktorá reklama ju priniesla.
    try {
      payload._source = JSON.parse(sessionStorage.getItem('tl_source') || '{}');
    } catch (err) { payload._source = {}; }

    var qs = new URLSearchParams(location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
      if (qs.get(k)) payload._source[k] = qs.get(k);
    });

    payload._form = FORM_ID;
    payload._sent_at = new Date().toISOString();

    btnSend.disabled = true;
    btnSend.textContent = 'Odosielam…';

    sendRegistration(payload)
      .then(function () {
        try { localStorage.removeItem(DRAFT_KEY); } catch (err) {}

        window.tlTrack && window.tlTrack('registration_submit', { form: FORM_ID });
        if (typeof window.fbq === 'function') window.fbq('track', 'CompleteRegistration');

        var wrap = document.querySelector('[data-form-wrap]');
        if (wrap) wrap.style.display = 'none';
        if (doneBox) {
          doneBox.classList.add('is-on');
          doneBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      })
      .catch(function (err) {
        console.error('[TOPLIGA] odoslanie zlyhalo:', err);
        btnSend.disabled = false;
        btnSend.textContent = 'Odoslať registráciu';
        var box = document.querySelector('[data-send-error]');
        if (box) { box.hidden = false; box.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      });
  });

  /* =========================================================================
     >>> INTEGRAČNÝ BOD — TU SA ROZHODUJE, KAM DÁTA IDÚ <<<

     Registrácie chodia do Netlify Forms. Aby to fungovalo, musia byť splnené
     dve veci naraz:

       1. v HTML pred </body> je skrytý statický formulár s data-netlify="true"
          a s rovnakým názvom, aký posiela FORM_NAMES nižšie — Netlify si polia
          načíta pri builde, nie za behu;
       2. POST ide ako application/x-www-form-urlencoded a v tele je form-name.

     Preto sa to NEDÁ otestovať lokálne cez serve.py — Netlify Forms žijú až
     na nasadenej stránke. Treba nahrať a odskúšať priamo tam.

     Súbory (logo, tímová fotka, profilovka) sa zámerne neposielajú — sú
     nepovinné a multipart odosielanie by to zbytočne komplikovalo. Cez formulár
     sa nazbierajú kontakty, súbory si vypýtaš pri follow-up telefonáte.
     ====================================================================== */

  var FORM_NAMES = {
    tim: 'registracia-tim',
    jednotlivec: 'registracia-jednotlivec'
  };

  // Polia typu file preskakujeme — v payloade je z nich aj tak len názov súboru.
  var FILE_FIELDS = {};
  Array.prototype.forEach.call(form.elements, function (el) {
    if (el.type === 'file' && el.name) FILE_FIELDS[el.name] = true;
  });

  function sendRegistration(payload) {
    var body = new URLSearchParams();
    body.append('form-name', FORM_NAMES[FORM_ID] || FORM_ID);

    Object.keys(payload).forEach(function (key) {
      if (FILE_FIELDS[key]) return;

      var v = payload[key];

      if (Array.isArray(v)) {
        v.forEach(function (item) { body.append(key, item); });
        return;
      }
      if (typeof v === 'boolean') {
        body.append(key, v ? 'áno' : 'nie');
        return;
      }
      if (v && typeof v === 'object') {
        body.append(key, JSON.stringify(v));
        return;
      }
      body.append(key, v == null ? '' : String(v));
    });

    return fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: body.toString()
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r;
    });
  }

  /* ------------------------------------------------------------------ štart */
  loadDraft();
  showStep(0, { silent: true });
})();
