/* Page behaviour: header title and navigation pill, disclosures, citations,
   copying and the back-to-top button. Durations follow the tiers in site.css
   (120 / 300 / 450 ms, no overshoot).
   Every animation is skipped when the system asks for reduced motion. */
(() => {
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const EASE = 'cubic-bezier(.25,1,.35,1)';
  const animates = el => !reduced.matches && typeof el.animate === 'function';

  /* ---------- Height animation shared by every collapsible block ---------- */
  // Measures before cancelling, so a reversal starts from the height on screen.
  const animateHeight = (body, opening, { prepare, done } = {}) => {
    const inner = body.firstElementChild;
    const from = body.getBoundingClientRect().height;
    body._animation?.cancel();
    body._animation = null;
    inner?.getAnimations().forEach(a => a.cancel());
    prepare?.();
    if (opening) body.hidden = false;
    const to = opening ? body.scrollHeight : 0;
    if (!animates(body)) { if (!opening) body.hidden = true; done?.(); return; }
    const duration = Math.max(300, Math.min(450, 200 + Math.abs(to - from) * 0.4));
    const animation = body.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration, easing: EASE });
    body._animation = animation;
    inner?.animate(opening
      ? [{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }]
      : [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-6px)' }],
      { duration: opening ? duration : duration * 0.6, easing: EASE, fill: opening ? 'none' : 'forwards' });
    animation.onfinish = () => {
      body._animation = null;
      if (!opening) body.hidden = true;
      inner?.getAnimations().forEach(a => a.cancel());
      done?.();
    };
  };

  /* ---------- Disclosures: plus turns into minus; choices are remembered ---------- */
  const STATE_KEY = 'hengyi-site:disclosures';
  let remembered = {};
  try {
    const value = JSON.parse(localStorage.getItem(STATE_KEY) || '{}');
    if (value && typeof value === 'object' && !Array.isArray(value)) remembered = value;
  } catch { /* Defaults apply. */ }
  const remember = (id, open) => {
    remembered[id] = open;
    try { localStorage.setItem(STATE_KEY, JSON.stringify(remembered)); } catch { /* Not remembered. */ }
  };
  const firstVisit = Object.keys(remembered).length === 0;

  const disclosures = [...document.querySelectorAll('details.disclosure')];
  disclosures.forEach(details => {
    const summary = details.querySelector('summary');
    const body = details.querySelector('.disclosure-body');
    if (typeof remembered[details.id] === 'boolean') details.open = remembered[details.id];
    let open = details.open;
    const sync = () => {
      details.classList.toggle('is-open', open);
      summary.setAttribute('aria-expanded', String(open));
    };
    // Set the initial state without animating the plus into a minus.
    details.classList.add('is-settling');
    sync();
    requestAnimationFrame(() => requestAnimationFrame(() => details.classList.remove('is-settling')));
    if (open && firstVisit && details.dataset.hint !== undefined) details.classList.add('is-hinting');

    const toggle = () => {
      details.classList.remove('is-hinting');
      open = !open;
      sync();
      remember(details.id, open);
      animateHeight(body, open, {
        prepare: () => { if (open) details.open = true; },
        done: () => { if (!open) { details.open = false; body.hidden = false; } }
      });
    };
    details._toggle = toggle;
    details._isOpen = () => open;
    summary.addEventListener('click', event => { event.preventDefault(); toggle(); });
  });

  // A long course list ends with a button that scrolls back to its heading, then closes it.
  document.querySelectorAll('.course').forEach(details => {
    const button = details.querySelector('.course-collapse');
    if (!button) return;
    button.hidden = false;
    button.addEventListener('click', () => {
      const summary = details.querySelector('summary');
      const bar = document.querySelector('.bar').getBoundingClientRect().height;
      const target = Math.max(0, window.scrollY + summary.getBoundingClientRect().top - bar - 16);
      const close = () => { if (details._isOpen()) details._toggle(); summary.focus({ preventScroll: true }); };
      if (!animates(button) || Math.abs(target - window.scrollY) < 2) { window.scrollTo({ top: target, behavior: 'instant' }); close(); return; }
      const start = window.scrollY;
      const began = performance.now();
      const duration = Math.min(900, 360 + Math.abs(target - start) * 0.25);
      let frame;
      const stop = () => { cancelAnimationFrame(frame); ['wheel', 'touchstart', 'keydown'].forEach(t => window.removeEventListener(t, stop)); };
      ['wheel', 'touchstart', 'keydown'].forEach(t => window.addEventListener(t, stop, { passive: true }));
      const step = now => {
        const p = Math.min(1, (now - began) / duration);
        window.scrollTo({ top: start + (target - start) * (1 - Math.pow(1 - p, 3)), behavior: 'instant' });
        if (p < 1) frame = requestAnimationFrame(step); else { stop(); close(); }
      };
      frame = requestAnimationFrame(step);
    });
  });

  // Print everything, then restore.
  let printed = [];
  window.addEventListener('beforeprint', () => { printed = disclosures.filter(d => !d.open); printed.forEach(d => { d.open = true; }); });
  window.addEventListener('afterprint', () => { printed.forEach(d => { d.open = false; }); printed = []; });

  /* ---------- Citations ---------- */
  document.querySelectorAll('.cite').forEach(button => {
    const box = document.getElementById(button.getAttribute('aria-controls'));
    button.hidden = false;
    button.addEventListener('click', () => {
      const opening = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(opening));
      animateHeight(box, opening);
    });
  });

  /* ---------- Copying: the icon turns into a check mark; a status is spoken ---------- */
  const status = document.getElementById('status');
  // Messages in the page's language come from data-label-* on <html>.
  const words = document.documentElement.dataset;
  const copy = async (text, button) => {
    clearTimeout(button._timer);
    button.classList.remove('is-done', 'is-error');
    try {
      await navigator.clipboard.writeText(text);
      button.classList.add('is-done');
      if (status) status.textContent = words.labelCopied || 'Copied to clipboard';
    } catch {
      button.classList.add('is-error');
      if (status) status.textContent = words.labelCopyFailed || 'Could not copy. Please select the text instead.';
      if (animates(button)) button.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(0)' }], { duration: 300 });
    }
    button._timer = setTimeout(() => {
      button.classList.remove('is-done', 'is-error');
      if (status) status.textContent = '';
    }, 1800);
  };
  if (navigator.clipboard?.writeText) {
    document.querySelectorAll('[data-copy]').forEach(button => {
      button.hidden = false;
      button.addEventListener('click', () => {
        const source = document.querySelector(button.dataset.copy);
        if (source) copy(source.textContent.trim(), button);
      });
    });
  }

  /* ---------- Header: one section title at a time, and a sliding pill ---------- */
  const bar = document.querySelector('.bar');
  const label = bar.querySelector('.current');
  const nav = bar.querySelector('.nav');
  const links = [...nav.querySelectorAll('a')];
  const sections = [...document.querySelectorAll('[data-section]')];
  const overview = document.querySelector('.overview');
  const toTop = document.querySelector('.to-top');
  const pill = document.createElement('span');
  pill.className = 'nav-pill is-placing';
  pill.setAttribute('aria-hidden', 'true');
  nav.prepend(pill);

  let shown = '';
  let target = '';
  let labelAnimation = null;
  const setLabel = text => {
    if (text === target) return;
    target = text;
    labelAnimation?.cancel();
    labelAnimation = null;
    if (!animates(label)) { label.textContent = shown = text; return; }
    const enter = () => {
      label.textContent = shown = target;
      if (!target) return;
      labelAnimation = label.animate(
        [{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }],
        { duration: 300, easing: EASE });
    };
    if (!shown) { enter(); return; }
    labelAnimation = label.animate(
      [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-4px)' }],
      { duration: 120, easing: 'ease-in', fill: 'forwards' });
    labelAnimation.onfinish = enter;
  };

  let clicked = null;
  let settleTimer;
  const update = () => {
    const barBottom = bar.getBoundingClientRect().bottom;
    let current = null;
    for (const section of sections) if (section.getBoundingClientRect().top <= barBottom + 24) current = section;
    // The bar takes over the title only once the page heading has gone under it.
    const heading = current?.querySelector('h2');
    setLabel(heading && heading.getBoundingClientRect().bottom <= barBottom ? heading.textContent : '');
    bar.classList.toggle('is-scrolled', window.scrollY > 8);

    const selected = clicked || current;
    let active = null;
    links.forEach(link => {
      if (selected && link.getAttribute('href') === `#${selected.id}`) { link.setAttribute('aria-current', 'location'); active = link; }
      else link.removeAttribute('aria-current');
    });
    if (active) {
      const appearing = !pill.classList.contains('is-visible');
      if (appearing) pill.classList.add('is-placing');
      pill.style.width = `${active.offsetWidth}px`;
      pill.style.height = `${active.offsetHeight}px`;
      pill.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
      if (appearing) { pill.getBoundingClientRect(); pill.classList.remove('is-placing'); }
    }
    pill.classList.toggle('is-visible', Boolean(active));

    if (toTop) {
      const visible = overview.getBoundingClientRect().bottom <= barBottom;
      toTop.classList.toggle('is-visible', visible);
      toTop.tabIndex = visible ? 0 : -1;
      toTop.setAttribute('aria-hidden', String(!visible));
    }
  };

  // Keep the clicked tab selected through its smooth scroll; any user input takes over.
  const release = () => { clearTimeout(settleTimer); if (clicked) { clicked = null; update(); } };
  // Back to top: the scroll is driven frame by frame (not native smooth scrolling)
  // so any input from the reader stops it at once.
  let ride = null;
  const land = () => { if (ride) { cancelAnimationFrame(ride); ride = null; } };
  links.forEach(link => link.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    clicked = sections.find(s => `#${s.id}` === link.getAttribute('href')) || null;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(release, 250);
    update();
  }));
  ['wheel', 'touchstart'].forEach(type => window.addEventListener(type, () => { release(); land(); }, { passive: true }));
  window.addEventListener('pointerdown', event => { if (!toTop?.contains(event.target)) land(); }, { passive: true });
  window.addEventListener('keydown', event => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) { release(); land(); }
  });

  let queued = false;
  window.addEventListener('scroll', () => {
    if (clicked) { clearTimeout(settleTimer); settleTimer = setTimeout(release, 250); }
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; update(); });
  }, { passive: true });
  // Only layout changes from outside (window size, fonts arriving) snap the pill into place;
  // moving between sections always slides.
  const snap = () => {
    pill.classList.add('is-placing');
    update();
    pill.getBoundingClientRect();
    pill.classList.remove('is-placing');
  };
  window.addEventListener('resize', snap);
  document.fonts?.ready.then(snap);
  update();

  toTop?.addEventListener('click', event => {
    event.preventDefault();
    release();
    land();
    document.getElementById('main')?.focus({ preventScroll: true });
    const start = window.scrollY;
    if (start < 2 || !animates(toTop)) { window.scrollTo({ top: 0, behavior: 'instant' }); return; }
    const began = performance.now();
    const duration = Math.min(1100, 350 + start * 0.25);
    let expected = start;
    const step = now => {
      // Moving down, or away from where we put it, means the reader took over.
      if (Math.abs(window.scrollY - expected) > 2) { land(); return; }
      const p = Math.min(1, (now - began) / duration);
      expected = Math.round(start * Math.pow(1 - p, 3));
      window.scrollTo({ top: expected, behavior: 'instant' });
      ride = p < 1 ? requestAnimationFrame(step) : null;
    };
    ride = requestAnimationFrame(step);
  });

  /* ---------- Language switch: fade out, then go ---------- */
  // The next page fades in on its own (appearance.js). Plain links still work without this.
  document.querySelectorAll('a[hreflang]').forEach(link => link.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (reduced.matches) return;
    event.preventDefault();
    try { sessionStorage.setItem('hengyi-site:language-switch', '1'); } catch { /* No fade-in then. */ }
    root.classList.add('lang-leaving');
    setTimeout(() => { window.location.href = link.href; }, 150);
  }));
  root.addEventListener('animationend', event => {
    if (event.animationName === 'lang-arrive') root.classList.remove('lang-arriving');
  });
  // Coming back with the Back button restores the page as it was left: faded out.
  window.addEventListener('pageshow', event => {
    if (event.persisted) root.classList.remove('lang-leaving', 'lang-arriving');
  });
})();
