(() => {
  const header = document.querySelector('.header');
  const label = header.querySelector('.current-section');
  const backToTop = document.querySelector('.back-to-top');
  const sections = [...document.querySelectorAll('main > .section')];
  const links = [...header.querySelectorAll('nav a')];
  const nav = header.querySelector('nav');
  const indicator = document.createElement('span');
  indicator.className = 'nav-indicator';
  indicator.setAttribute('aria-hidden', 'true');
  nav.prepend(indicator);
  nav.classList.add('has-indicator');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let labelAnimation;
  const update = () => {
    let current = null;
    const threshold = header.offsetHeight + 26;
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= threshold) current = section;
    }
    const title = current ? current.querySelector('h2').textContent : '';
    if (label.textContent !== title) {
      labelAnimation?.cancel();
      label.textContent = title;
      if (title && !reducedMotion.matches) {
        labelAnimation = label.animate(
          [{ opacity: 0, transform: 'translateY(5px)' }, { opacity: 1, transform: 'translateY(0)' }],
          { duration: 220, easing: 'ease-out' }
        );
      }
    }
    header.classList.toggle('is-scrolled', window.scrollY > 32);
    if (backToTop) {
      const visible = window.scrollY > 32;
      backToTop.classList.toggle('is-visible', visible);
      backToTop.setAttribute('aria-hidden', String(!visible));
      backToTop.tabIndex = visible ? 0 : -1;
    }
    for (const link of links) {
      if (current && link.getAttribute('href') === `#${current.id}`) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    }
    const active = links.find(link => link.hasAttribute('aria-current'));
    if (active) {
      indicator.style.width = `${active.offsetWidth}px`;
      indicator.style.height = `${active.offsetHeight}px`;
      indicator.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
    }
    indicator.classList.toggle('is-visible', Boolean(active));
  };
  update();
  let scheduled = false;
  window.addEventListener('scroll', () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; update(); });
  }, { passive: true });
  const measure = () => {
    document.documentElement.style.setProperty('--header-offset', `${header.offsetHeight + 24}px`);
    update();
  };
  const observer = new ResizeObserver(measure);
  observer.observe(header);
  observer.observe(nav);
  document.fonts.ready.then(measure);
  measure();
})();
