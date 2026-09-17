(() => {
  const header = document.querySelector('.header');
  const label = header.querySelector('.current-section');
  const intro = document.querySelector('.overview');
  const backToTop = document.querySelector('.back-to-top');
  const sections = [...document.querySelectorAll('main .section')];
  const links = [...header.querySelectorAll('nav a')];
  const nav = header.querySelector('nav');
  const indicator = document.createElement('span');
  indicator.className = 'nav-indicator';
  indicator.setAttribute('aria-hidden', 'true');
  nav.prepend(indicator);
  nav.classList.add('has-indicator');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motion = getComputedStyle(document.documentElement);
  const feedback = parseFloat(motion.getPropertyValue('--motion-feedback')) || 180;
  const easing = motion.getPropertyValue('--motion-ease').trim() || 'ease-out';
  let labelAnimation;
  let labelTarget = label.textContent;
  const settleLabel = () => {
    labelAnimation?.cancel();
    labelAnimation = null;
    label.textContent = labelTarget;
  };
  const animateLabel = (from, to, complete) => {
    const animation = label.animate([from, to], { duration: feedback, easing, fill: 'both' });
    labelAnimation = animation;
    animation.onfinish = () => {
      if (labelAnimation !== animation) return;
      complete();
    };
  };
  const setLabel = title => {
    // Compare destinations, not the text retained while fading out.
    if (title === labelTarget) return;
    labelTarget = title;
    const style = getComputedStyle(label);
    const from = { opacity: style.opacity, transform: style.transform };
    const previous = label.textContent;
    labelAnimation?.cancel();
    labelAnimation = null;
    if (reducedMotion.matches || !label.animate) { settleLabel(); return; }
    const enter = () => {
      labelAnimation?.cancel();
      label.textContent = labelTarget;
      animateLabel(
        { opacity: 0, transform: 'translateY(3px)' },
        { opacity: 1, transform: 'translateY(0)' }, settleLabel
      );
    };
    if (!previous) { enter(); return; }
    if (previous === title) {
      // Reverse an interrupted fade without snapping back to full opacity.
      animateLabel(from, { opacity: 1, transform: 'translateY(0)' }, settleLabel);
    } else {
      animateLabel(from, { opacity: 0, transform: 'translateY(3px)' },
        title ? enter : settleLabel);
    }
  };
  let clickedSection = null;
  let navigating = false;
  let settleTimer;
  const update = () => {
    let current = null;
    const threshold = header.offsetHeight + 26;
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= threshold) current = section;
    }
    // The left title follows visibility, independently of the navigation tabs.
    // Wait until the whole heading has passed behind the sticky header.
    const heading = current?.querySelector('h2');
    const title = heading && heading.getBoundingClientRect().bottom <= header.getBoundingClientRect().bottom
      ? heading.textContent : '';
    setLabel(title);
    header.classList.toggle('is-scrolled', window.scrollY > 32);
    if (backToTop) {
      const visible = intro ? intro.getBoundingClientRect().bottom <= header.offsetHeight : window.scrollY >= window.innerHeight;
      backToTop.classList.toggle('is-visible', visible);
      backToTop.setAttribute('aria-hidden', String(!visible));
      backToTop.tabIndex = visible ? 0 : -1;
    }
    const selected = clickedSection || current;
    for (const link of links) {
      if (selected && link.getAttribute('href') === `#${selected.id}`) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    }
    const active = links.find(link => link.hasAttribute('aria-current'));
    if (active) {
      // Appear in place when entering the first section; only slide between tabs.
      const appearing = !indicator.classList.contains('is-visible');
      if (appearing) indicator.classList.add('is-positioning');
      indicator.style.width = `${active.offsetWidth}px`;
      indicator.style.height = `${active.offsetHeight}px`;
      indicator.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
      if (appearing) {
        indicator.getBoundingClientRect();
        indicator.classList.remove('is-positioning');
      }
    }
    indicator.classList.toggle('is-visible', Boolean(active));
  };
  const cancelNavigation = () => {
    clearTimeout(settleTimer);
    clickedSection = null;
    navigating = false;
    update();
  };
  for (const link of links) {
    link.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      clickedSection = sections.find(section => `#${section.id}` === link.getAttribute('href'));
      navigating = true;
      clearTimeout(settleTimer);
      // Also settle a click on the current anchor, which may produce no scroll.
      settleTimer = setTimeout(() => { navigating = false; }, 180);
      update();
    });
  }
  // User input takes control back immediately, including interrupted smooth scrolls.
  window.addEventListener('wheel', cancelNavigation, { passive: true });
  window.addEventListener('touchstart', cancelNavigation, { passive: true });
  window.addEventListener('keydown', event => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) cancelNavigation();
  });
  backToTop?.addEventListener('click', cancelNavigation);
  update();
  let scheduled = false;
  window.addEventListener('scroll', () => {
    if (navigating) {
      clearTimeout(settleTimer);
      // Keep the clicked tab selected through the entire smooth scroll.
      settleTimer = setTimeout(() => { navigating = false; }, 180);
    } else {
      clickedSection = null;
    }
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; update(); });
  }, { passive: true });
  const measure = () => {
    indicator.classList.add('is-positioning');
    document.documentElement.style.setProperty('--header-offset', `${header.offsetHeight + 24}px`);
    update();
    indicator.getBoundingClientRect();
    indicator.classList.remove('is-positioning');
  };
  const observer = new ResizeObserver(measure);
  observer.observe(header);
  observer.observe(nav);
  if (intro) observer.observe(intro);
  document.fonts.ready.then(measure);
  measure();
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) settleLabel();
  });
})();
