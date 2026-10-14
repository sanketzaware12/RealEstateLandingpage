/* =========================================================
   Nivaas Property Advisors - interactions (vanilla JS)
   ========================================================= */

/* ---------- CONFIG: replace with real details ---------- */
const CONFIG = {
  // Digits only, with country code. Example: "919812345678"
  whatsappNumber: '910000000000',
  placeholderNumber: '910000000000'
};

(function () {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const whatsappConfigured = CONFIG.whatsappNumber !== CONFIG.placeholderNumber;

  /* ---------- Icons ---------- */
  function renderIcons() {
    if (window.lucide) window.lucide.createIcons();
  }
  renderIcons();

  /* ---------- Footer year ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- WhatsApp links ---------- */
  function whatsappUrl(text) {
    const base = 'https://wa.me/' + CONFIG.whatsappNumber;
    return text ? base + '?text=' + encodeURIComponent(text) : base;
  }
  if (whatsappConfigured) {
    $$('[data-whatsapp]').forEach((link) => {
      link.href = whatsappUrl('Hello, I would like to talk about a property.');
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    });
  }

  /* ---------- Header: scrolled state + back to top ---------- */
  const header = $('#site-header');
  const backToTop = $('#back-to-top');

  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 16);
    backToTop.classList.toggle('is-visible', y > 700);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    header.style.setProperty('--p', max > 0 ? Math.min(y / max, 1).toFixed(4) : 0);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });

  /* ---------- Mobile menu ---------- */
  const menuToggle = $('#menu-toggle');
  const mobileMenu = $('#mobile-menu');
  const iconOpen = $('.icon-open', menuToggle);
  const iconClose = $('.icon-close', menuToggle);

  function setMenu(open) {
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    header.classList.toggle('menu-open', open);
    iconOpen.classList.toggle('hidden', open);
    iconClose.classList.toggle('hidden', !open);

    if (open) {
      mobileMenu.hidden = false;
      // next frame so the CSS transition runs
      requestAnimationFrame(() => { mobileMenu.dataset.open = 'true'; });
    } else {
      mobileMenu.dataset.open = 'false';
      window.setTimeout(() => {
        if (menuToggle.getAttribute('aria-expanded') === 'false') mobileMenu.hidden = true;
      }, 250);
    }
  }

  menuToggle.addEventListener('click', () => {
    setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
  });
  $$('a', mobileMenu).forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuToggle.focus();
    }
  });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (event) => {
    if (event.matches) setMenu(false);
  });

  /* ---------- Active nav link on scroll ---------- */
  const navLinks = $$('.nav-link');
  const sectionMap = navLinks
    .map((link) => ({ link, section: $(link.getAttribute('href')) }))
    .filter((item) => item.section);

  if ('IntersectionObserver' in window && sectionMap.length) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        sectionMap.forEach(({ link, section }) => {
          link.classList.toggle('is-current', section === entry.target);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sectionMap.forEach(({ section }) => navObserver.observe(section));
  }

  /* ---------- Scroll reveal ---------- */
  const revealEls = $$('[data-reveal]');
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('reveal-in');
        observer.unobserve(el);
        // Clean up afterwards so hover transitions on cards work normally.
        window.setTimeout(() => {
          el.classList.remove('reveal-init', 'reveal-in', 'reveal-d1', 'reveal-d2', 'reveal-d3');
        }, 1200);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach((el) => {
      const delay = el.dataset.delay;
      el.classList.add('reveal-init');
      if (delay) el.classList.add('reveal-d' + delay);
      revealObserver.observe(el);
    });
  }

  /* ---------- Process: draw the connector + pulse the steps when visible ---------- */
  const stepsEl = $('.steps');
  if (stepsEl) {
    if ('IntersectionObserver' in window) {
      const stepsObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.25 });
      stepsObserver.observe(stepsEl);
    } else {
      stepsEl.classList.add('in-view');
    }
  }

  /* ---------- Image fallback (no inline onerror handlers) ---------- */
  $$('img').forEach((img) => {
    img.addEventListener('error', () => {
      const frame = img.closest('.prop-media, .arch-frame, .about-frame');
      if (frame) frame.classList.add('img-fallback');
    });
    // Handle images that failed before this script ran
    if (img.complete && img.naturalWidth === 0) img.dispatchEvent(new Event('error'));
  });

  /* ---------- Property filtering ---------- */
  const grid = $('#property-grid');
  const cards = $$('.prop-card', grid);
  const pills = $$('.filter-pill');
  const resultCount = $('#result-count');
  const emptyState = $('#empty-state');
  const emptyTitle = $('#empty-title');
  const emptyText = $('#empty-text');

  const filters = { purpose: 'any', type: 'any', location: 'any', budget: 'any' };

  function matches(card) {
    const d = card.dataset;
    if (filters.purpose !== 'any' && d.purpose !== filters.purpose) return false;
    if (filters.type !== 'any' && d.type !== filters.type) return false;
    // "Pune" is the umbrella area, so it matches every listing.
    if (filters.location !== 'any' && filters.location !== 'pune' && d.location !== filters.location) return false;
    // Rentals are priced monthly, so the purchase budget bands do not apply to them.
    if (filters.budget !== 'any' && d.purpose !== 'rent' && d.budget !== filters.budget) return false;
    return true;
  }

  function applyFilters() {
    const sellOnly = filters.purpose === 'sell';
    let visible = 0;

    cards.forEach((card) => {
      const show = !sellOnly && matches(card);
      card.classList.toggle('is-filtered-out', !show);
      if (show) visible += 1;
    });

    pills.forEach((pill) => {
      const active = pill.dataset.filter === filters.purpose;
      pill.classList.toggle('is-active', active);
      pill.setAttribute('aria-pressed', String(active));
    });

    resultCount.textContent = sellOnly
      ? ''
      : 'Showing ' + visible + ' of ' + cards.length + ' properties';

    emptyState.classList.toggle('hidden', visible > 0);
    if (sellOnly) {
      emptyTitle.textContent = 'Want to sell your property?';
      emptyText.textContent = 'Share the location and type of property in the enquiry form and I will get back to you.';
    } else {
      emptyTitle.textContent = 'No matching properties yet';
      emptyText.textContent = 'Try a different combination, or tell me what you need and I will look for it.';
    }
  }

  function syncSelects() {
    $('#s-purpose').value = filters.purpose;
    $('#s-type').value = filters.type;
    $('#s-location').value = filters.location;
    $('#s-budget').value = filters.budget;
  }

  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      filters.purpose = pill.dataset.filter;
      syncSelects();
      applyFilters();
    });
  });

  $('#reset-filters').addEventListener('click', () => {
    Object.keys(filters).forEach((key) => { filters[key] = 'any'; });
    syncSelects();
    applyFilters();
  });

  $('#search-form').addEventListener('submit', (event) => {
    event.preventDefault();
    filters.purpose = $('#s-purpose').value;
    filters.type = $('#s-type').value;
    filters.location = $('#s-location').value;
    filters.budget = $('#s-budget').value;
    applyFilters();
    $('#properties').scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });

  applyFilters();

  /* ---------- Enquire links pre-fill the contact form ---------- */
  const form = $('#contact-form');
  const status = $('#form-status');

  $$('[data-enquire]').forEach((link) => {
    link.addEventListener('click', () => {
      $('#c-message').value = 'I am interested in: ' + link.dataset.enquire + '.';
      $('#c-interest').value = link.dataset.interest;
      $('#c-location').value = link.dataset.area;
    });
  });

  /* ---------- Contact form validation ---------- */
  const fields = {
    name: { el: $('#c-name'), err: $('#c-name-err') },
    phone: { el: $('#c-phone'), err: $('#c-phone-err') },
    email: { el: $('#c-email'), err: $('#c-email-err') }
  };

  function validate() {
    const errors = {};
    const name = fields.name.el.value.trim();
    const phone = fields.phone.el.value.replace(/[\s-]/g, '');
    const email = fields.email.el.value.trim();

    if (name.length < 2) errors.name = 'Enter your name.';
    if (!/^(\+91|0)?[6-9]\d{9}$/.test(phone)) errors.phone = 'Enter a valid 10-digit mobile number.';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address, or leave this blank.';

    Object.keys(fields).forEach((key) => {
      const { el, err } = fields[key];
      err.textContent = errors[key] || '';
      el.setAttribute('aria-invalid', errors[key] ? 'true' : 'false');
    });
    return errors;
  }

  Object.keys(fields).forEach((key) => {
    fields[key].el.addEventListener('input', () => {
      if (fields[key].el.getAttribute('aria-invalid') === 'true') validate();
    });
  });

  function setStatus(message, type) {
    status.textContent = message;
    status.classList.remove('field-status-ok', 'field-status-error');
    if (type) status.classList.add('field-status-' + type);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const errors = validate();
    const firstInvalid = Object.keys(errors)[0];

    if (firstInvalid) {
      fields[firstInvalid].el.focus();
      setStatus('Please fix the highlighted fields.', 'error');
      return;
    }

    if (!whatsappConfigured) {
      setStatus('The form is valid, but no WhatsApp number is set yet. Add it in CONFIG at the top of js/script.js.', 'error');
      return;
    }

    const data = new FormData(form);
    const lines = [
      'New property enquiry',
      'Name: ' + data.get('name'),
      'Phone: ' + data.get('phone'),
      data.get('email') ? 'Email: ' + data.get('email') : null,
      'Interested in: ' + data.get('interest'),
      'Location: ' + data.get('location'),
      'Budget: ' + data.get('budget'),
      data.get('message') ? 'Message: ' + data.get('message') : null
    ].filter(Boolean);

    window.open(whatsappUrl(lines.join('\n')), '_blank', 'noopener');
    setStatus('Opening WhatsApp with your enquiry. Press send there to deliver it.', 'ok');
    form.reset();
  });
})();
