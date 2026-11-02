/*!
 * KiCo - India's Kitaab Copy (kicoedtech.xyz)
 * Main Behavioural Script (assets/js/site.js)
 * Vanilla ES6+, Zero Framework Dependencies
 */
(function () {
  'use strict';

  const docEl = document.documentElement;
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* --------------------------------------------------------------------------
   * 1. Header Scroll State, Chromium SVG Refraction Filter & Mobile Menu
   * -------------------------------------------------------------------------- */
  function initHeader() {
    const header = document.querySelector('.site-header');
    const menuBtn = document.getElementById('menu-toggle');
    const primaryNav = document.getElementById('primary-nav');

    // Inject hidden SVG refraction filter for Chromium header glass
    if (!document.getElementById('kico-svg-filters')) {
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.id = 'kico-svg-filters';
      svg.setAttribute('aria-hidden', 'true');
      svg.style.position = 'absolute';
      svg.style.width = '0';
      svg.style.height = '0';
      svg.style.overflow = 'hidden';
      svg.innerHTML = `
        <defs>
          <filter id="kico-liquid-refract" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      `;
      document.body.appendChild(svg);
      if (header && window.chrome) {
        header.classList.add('has-svg-refract');
      }
    }

    function onScroll() {
      if (!header) return;
      if (window.scrollY > 16) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
      if (window.Container && Array.isArray(window.Container.instances)) {
        window.Container.instances.forEach(inst => {
          if (inst && typeof inst.render === 'function') inst.render();
        });
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (menuBtn && primaryNav) {
      function syncNavForViewport() {
        if (window.innerWidth > 900) {
          primaryNav.hidden = false;
          menuBtn.setAttribute('aria-expanded', 'false');
        } else if (menuBtn.getAttribute('aria-expanded') !== 'true') {
          primaryNav.hidden = true;
        }
      }

      menuBtn.addEventListener('click', () => {
        const expanded = menuBtn.getAttribute('aria-expanded') === 'true';
        const next = !expanded;
        menuBtn.setAttribute('aria-expanded', String(next));
        primaryNav.hidden = !next;
        if (next) {
          const firstLink = primaryNav.querySelector('a');
          if (firstLink) firstLink.focus();
        }
      });

      primaryNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          if (window.innerWidth <= 900) {
            menuBtn.setAttribute('aria-expanded', 'false');
            primaryNav.hidden = true;
          }
        });
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && window.innerWidth <= 900 && !primaryNav.hidden) {
          menuBtn.setAttribute('aria-expanded', 'false');
          primaryNav.hidden = true;
          menuBtn.focus();
        }
      });

      window.addEventListener('resize', syncNavForViewport, { passive: true });
      syncNavForViewport();
    }
  }

  /* --------------------------------------------------------------------------
   * 2. Hero Crossfade Stage (1.6s fade, 5.6s hold, pauses on hidden tab)
   * -------------------------------------------------------------------------- */
  function initHeroCrossfade() {
    const cards = Array.from(document.querySelectorAll('[data-crossfade-item]'));
    const tabs = Array.from(document.querySelectorAll('[data-stage-tab]'));
    if (cards.length < 2) return;

    let currentIndex = 0;
    let timerId = null;
    const HOLD_MS = 5600;

    function showSlide(idx) {
      currentIndex = (idx + cards.length) % cards.length;
      cards.forEach((card, i) => {
        const active = i === currentIndex;
        card.classList.toggle('is-active', active);
        card.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
      tabs.forEach((tab, i) => {
        const active = i === currentIndex;
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    }

    function stopLoop() {
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
    }

    function startLoop() {
      stopLoop();
      if (reducedMotionQuery.matches || document.hidden) return;
      timerId = setInterval(() => {
        showSlide(currentIndex + 1);
      }, HOLD_MS);
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => {
        showSlide(i);
        startLoop();
      });
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopLoop();
      else startLoop();
    });

    reducedMotionQuery.addEventListener('change', () => {
      if (reducedMotionQuery.matches) stopLoop();
      else startLoop();
    });

    showSlide(0);
    startLoop();
  }

  /* --------------------------------------------------------------------------
   * 3. WebGL Liquid Glass Mount (with MutationObserver Fallback)
   * -------------------------------------------------------------------------- */
  function initLiquidGlass() {
    const mountNode = document.getElementById('hero-glass-mount-target');
    const heroSection = document.getElementById('hero-section');
    if (!mountNode || !heroSection) return;

    // Watch html class list for glass-fallback
    const observer = new MutationObserver(() => {
      if (docEl.classList.contains('glass-fallback')) {
        docEl.classList.remove('has-glass');
      }
    });
    observer.observe(docEl, { attributes: true, attributeFilter: ['class'] });

    // Check WebGL availability
    function hasWebGL() {
      try {
        const testCanvas = document.createElement('canvas');
        return Boolean(
          window.WebGLRenderingContext &&
          (testCanvas.getContext('webgl2') || testCanvas.getContext('webgl'))
        );
      } catch (_) {
        return false;
      }
    }

    function mountGlassPill() {
      if (!hasWebGL() || typeof window.Container !== 'function' || typeof window.Button !== 'function') {
        docEl.classList.add('glass-fallback');
        return;
      }

      try {
        window.Container.snapshotTarget = heroSection;
        const pillContainer = new window.Container({
          borderRadius: 28,
          type: 'pill',
          tintOpacity: 0.22
        });

        const items = [
          {
            text: '12 weeks',
            target: '#syllabus',
            label: '12 weeks - Jump to the 12-week syllabus and start-date planner'
          },
          {
            text: 'Live online',
            target: '#how-it-works',
            label: 'Live online - Jump to how the 12 live weeks run'
          },
          {
            text: 'Certified',
            target: '#benefits',
            label: 'Certified - Jump to certification and course benefits'
          }
        ];

        items.forEach(item => {
          const navigate = () => {
            const dest = document.querySelector(item.target);
            if (dest) dest.scrollIntoView({ behavior: reducedMotionQuery.matches ? 'auto' : 'smooth' });
          };
          const btn = new window.Button({
            text: item.text,
            size: 15,
            type: 'pill',
            tintOpacity: 0.28,
            onClick: navigate
          });
          btn.element.setAttribute('role', 'link');
          btn.element.setAttribute('tabindex', '0');
          btn.element.setAttribute('aria-label', item.label);
          btn.element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate();
            }
          });
          pillContainer.addChild(btn);
        });

        mountNode.appendChild(pillContainer.element);
        docEl.classList.add('has-glass');

        const canvasObserver = new MutationObserver(() => {
          if (mountNode.querySelectorAll('canvas').length === 0) {
            docEl.classList.add('glass-fallback');
            docEl.classList.remove('has-glass');
          }
        });
        canvasObserver.observe(mountNode, { childList: true, subtree: true });

        requestAnimationFrame(() => {
          window.Container.instances.forEach(inst => inst.updateSizeFromDOM());
        });
      } catch (_) {
        docEl.classList.add('glass-fallback');
        docEl.classList.remove('has-glass');
      }
    }

    const onReady = () => {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(mountGlassPill).catch(mountGlassPill);
      } else {
        mountGlassPill();
      }
    };

    if (document.readyState === 'complete') {
      onReady();
    } else {
      window.addEventListener('load', onReady, { once: true });
    }
  }

  /* --------------------------------------------------------------------------
   * 4. The "Live Thing": 12-Week Planner (en-IN Locale)
   * -------------------------------------------------------------------------- */
  function initTwelveWeekPlanner() {
    const plannerInput = document.getElementById('planner-start');
    const summaryRegion = document.getElementById('planner-summary');
    const enquiryStartInput = document.getElementById('enquiry-start');
    const stages = Array.from(document.querySelectorAll('.syllabus-stage[data-week-start]'));
    if (!plannerInput || !summaryRegion) return;

    let userEditedEnquiryDate = false;
    if (enquiryStartInput) {
      enquiryStartInput.addEventListener('input', () => {
        userEditedEnquiryDate = true;
      });
    }

    function toIsoDate(d) {
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      return `${yr}-${mo}-${da}`;
    }

    function parseIsoLocal(isoStr) {
      const parts = (isoStr || '').split('-').map(Number);
      if (parts.length !== 3 || parts.some(isNaN)) return null;
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }

    function addDays(baseDate, days) {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
      d.setDate(d.getDate() + days);
      return d;
    }

    const now = new Date();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const minIso = toIsoDate(todayLocal);
    plannerInput.min = minIso;
    if (enquiryStartInput) enquiryStartInput.min = minIso;

    // Default to next Monday (if today is Monday, next Monday is +7 days, or if unset)
    const dayOfWeek = todayLocal.getDay(); // 0=Sun, 1=Mon
    const daysUntilNextMonday = dayOfWeek === 1 ? 7 : ((8 - dayOfWeek) % 7);
    const defaultStart = addDays(todayLocal, daysUntilNextMonday);
    const defaultIso = toIsoDate(defaultStart);
    plannerInput.value = defaultIso;

    const shortFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });
    const fullFmt = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    function updateSchedule() {
      const start = parseIsoLocal(plannerInput.value) || defaultStart;
      // Friday of Week 12 = start date + (11 * 7) + 4 = +81 days
      const finishFriday = addDays(start, 81);

      summaryRegion.textContent = `Start ${fullFmt.format(start)} · Finish ${fullFmt.format(finishFriday)} (12 weeks, live online)`;

      stages.forEach(stage => {
        const wStart = parseInt(stage.getAttribute('data-week-start'), 10) || 1;
        const wEnd = parseInt(stage.getAttribute('data-week-end'), 10) || wStart;
        const stageStartDate = addDays(start, (wStart - 1) * 7);
        const stageEndDate = addDays(start, (wEnd - 1) * 7 + 4);
        const labelEl = stage.querySelector('.stage-week-label');
        if (labelEl) {
          const weekPrefix = wStart === wEnd ? `Week ${wStart}` : `Weeks ${wStart}–${wEnd}`;
          labelEl.textContent = `${weekPrefix}, ${shortFmt.format(stageStartDate)} – ${shortFmt.format(stageEndDate)}`;
        }
      });

      if (enquiryStartInput && !userEditedEnquiryDate) {
        enquiryStartInput.value = toIsoDate(start);
      }
    }

    plannerInput.addEventListener('change', updateSchedule);
    plannerInput.addEventListener('input', updateSchedule);
    updateSchedule();
  }

  /* --------------------------------------------------------------------------
   * 5. Interactive Single-Open Accordions (How It Works & FAQ)
   * -------------------------------------------------------------------------- */
  function initAccordions() {
    // C. "How the 12 weeks run" accordion (one open at a time, moves focus to opened panel)
    const howTriggers = Array.from(document.querySelectorAll('.accordion-trigger'));
    howTriggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        const targetId = trigger.getAttribute('aria-controls');
        const targetPanel = document.getElementById(targetId);
        if (!targetPanel) return;

        howTriggers.forEach(other => {
          const otherId = other.getAttribute('aria-controls');
          const otherPanel = document.getElementById(otherId);
          const isCurrent = other === trigger;
          other.setAttribute('aria-expanded', isCurrent ? 'true' : 'false');
          const ind = other.querySelector('.accordion-indicator');
          if (ind) ind.textContent = isCurrent ? '−' : '+';
          if (otherPanel) {
            otherPanel.hidden = !isCurrent;
          }
        });

        targetPanel.focus({ preventScroll: true });
      });
    });

    // D. FAQ accordion (first open on load, one open at a time, clicking open one closes it)
    const faqTriggers = Array.from(document.querySelectorAll('.faq-trigger'));
    faqTriggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        const isCurrentlyOpen = trigger.getAttribute('aria-expanded') === 'true';
        const targetId = trigger.getAttribute('aria-controls');
        const targetPanel = document.getElementById(targetId);

        faqTriggers.forEach(other => {
          const otherId = other.getAttribute('aria-controls');
          const otherPanel = document.getElementById(otherId);
          other.setAttribute('aria-expanded', 'false');
          const ind = other.querySelector('.accordion-indicator');
          if (ind) ind.textContent = '+';
          if (otherPanel) otherPanel.hidden = true;
        });

        if (!isCurrentlyOpen && targetPanel) {
          trigger.setAttribute('aria-expanded', 'true');
          const ind = trigger.querySelector('.accordion-indicator');
          if (ind) ind.textContent = '−';
          targetPanel.hidden = false;
          targetPanel.focus({ preventScroll: true });
        }
      });
    });
  }

  /* --------------------------------------------------------------------------
   * 6. Enquiry Form Validation & WhatsApp + Mailto Handover
   * -------------------------------------------------------------------------- */
  function initEnquiryForm() {
    const form = document.getElementById('enquiry-form');
    const statusBox = document.getElementById('form-status');
    if (!form || !statusBox) return;

    const nameField = document.getElementById('enquiry-name');
    const phoneField = document.getElementById('enquiry-phone');
    const emailField = document.getElementById('enquiry-email');
    const stateField = document.getElementById('enquiry-state');
    const cityField = document.getElementById('enquiry-city');
    const genderField = document.getElementById('enquiry-gender');
    const startField = document.getElementById('enquiry-start');
    const consentField = document.getElementById('enquiry-consent');

    const watchedFields = [nameField, phoneField, emailField, stateField, cityField, genderField, startField, consentField].filter(Boolean);
    watchedFields.forEach(field => {
      const clearInvalid = () => {
        field.removeAttribute('aria-invalid');
      };
      field.addEventListener('input', clearInvalid);
      field.addEventListener('change', clearInvalid);
    });

    function isValidIndianPhone(raw) {
      const cleaned = (raw || '').replace(/[\s-]/g, '');
      return /^(?:\+?91)?[6-9]\d{9}$/.test(cleaned);
    }

    function isValidEmail(raw) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((raw || '').trim());
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      statusBox.className = 'form-status';
      statusBox.textContent = '';

      const errors = [];
      let firstBadField = null;

      function markBad(field, message) {
        if (!field) return;
        field.setAttribute('aria-invalid', 'true');
        if (!firstBadField) firstBadField = field;
        errors.push(message);
      }

      const nameVal = (nameField?.value || '').trim();
      if (nameVal.length <= 1) {
        markBad(nameField, 'Enter your full name (at least 2 characters).');
      }

      const phoneVal = (phoneField?.value || '').trim();
      if (!isValidIndianPhone(phoneVal)) {
        markBad(phoneField, 'Enter a valid 10-digit Indian mobile number starting with 6–9 (optional +91).');
      }

      const emailVal = (emailField?.value || '').trim();
      if (!isValidEmail(emailVal)) {
        markBad(emailField, 'Enter a valid email address.');
      }

      if (!consentField?.checked) {
        markBad(consentField, 'Tick the consent checkbox so KiCo can reply to your enquiry.');
      }

      if (errors.length > 0) {
        statusBox.classList.add('is-error');
        statusBox.textContent = errors[0];
        if (firstBadField) firstBadField.focus();
        return;
      }

      const stateVal = (stateField?.value || '').trim();
      const cityVal = (cityField?.value || '').trim();
      const genderVal = (genderField?.value || '').trim();
      const startVal = (startField?.value || '').trim();

      let formattedStart = startVal;
      if (startVal) {
        const parts = startVal.split('-').map(Number);
        if (parts.length === 3 && !parts.some(isNaN)) {
          const dt = new Date(parts[0], parts[1] - 1, parts[2]);
          formattedStart = new Intl.DateTimeFormat('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          }).format(dt);
        }
      }

      const lines = [
        'Hello KiCo team, I would like to enquire about the 12-Week Digital Marketing Mastery Program.',
        `Name: ${nameVal}`,
        `Phone: ${phoneVal}`,
        `Email: ${emailVal}`
      ];

      const locParts = [cityVal, stateVal].filter(Boolean);
      if (locParts.length > 0) {
        lines.push(`Location: ${locParts.join(', ')}`);
      }
      if (genderVal) {
        lines.push(`Gender: ${genderVal}`);
      }
      if (formattedStart) {
        lines.push(`Preferred start: ${formattedStart}`);
      }

      const textBody = lines.join('\n');
      const waUrl = `https://wa.me/919315939588?text=${encodeURIComponent(textBody)}`;
      const mailtoSubject = encodeURIComponent(`Course Enquiry: ${nameVal} - Digital Marketing Mastery Program`);
      const mailtoUrl = `mailto:admin@kicoedtech.xyz?subject=${mailtoSubject}&body=${encodeURIComponent(textBody)}`;

      let popupOpened = false;
      try {
        const win = window.open(waUrl, '_blank');
        if (win) {
          win.opener = null;
          popupOpened = true;
        }
      } catch (_) {
        popupOpened = false;
      }

      statusBox.classList.add('is-success');
      if (popupOpened) {
        statusBox.innerHTML = `WhatsApp opened with your details. Just press send. Prefer email? <a href="${mailtoUrl}">Send via email to admin@kicoedtech.xyz</a>.`;
      } else {
        statusBox.innerHTML = `Your browser blocked the automatic tab. <a href="${waUrl}" target="_blank" rel="noopener">Open WhatsApp with your prefilled details</a> or <a href="${mailtoUrl}">email admin@kicoedtech.xyz</a>.`;
      }
    });
  }

  /* --------------------------------------------------------------------------
   * 7. Section Entrance Choreography (IntersectionObserver, 60–90ms stagger)
   * -------------------------------------------------------------------------- */
  function initEntrances() {
    const groups = Array.from(document.querySelectorAll('[data-reveal-group]'));
    groups.forEach(group => {
      const items = Array.from(group.querySelectorAll('[data-reveal]'));
      items.forEach((el, idx) => {
        el.style.setProperty('--reveal-delay', `${Math.min(idx * 55, 165)}ms`);
      });
    });

    const allReveal = Array.from(document.querySelectorAll('[data-reveal]'));
    if (!allReveal.length) return;

    if (reducedMotionQuery.matches || !('IntersectionObserver' in window)) {
      allReveal.forEach(el => el.classList.add('is-in'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.08
    });

    allReveal.forEach(el => io.observe(el));

    // Also reveal any element that has entered or passed the viewport on scroll
    function revealVisibleNow() {
      const vh = window.innerHeight;
      allReveal.forEach(el => {
        if (el.classList.contains('is-in')) return;
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.96) {
          el.classList.add('is-in');
          io.unobserve(el);
        }
      });
    }
    window.addEventListener('scroll', revealVisibleNow, { passive: true });
    revealVisibleNow();
    // Safety fallback for first-screen elements
    setTimeout(() => {
      allReveal.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight) {
          el.classList.add('is-in');
        }
      });
    }, 300);
  }

  /* Initialize Everything on DOMContentLoaded */
  function boot() {
    initHeader();
    initHeroCrossfade();
    initLiquidGlass();
    initTwelveWeekPlanner();
    initAccordions();
    initEnquiryForm();
    initEntrances();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
