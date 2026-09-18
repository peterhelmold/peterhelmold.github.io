(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motion = getComputedStyle(document.documentElement);
  const duration = parseFloat(motion.getPropertyValue('--motion-expand')) || 280;
  const easing = motion.getPropertyValue('--motion-ease').trim() || 'ease-out';
  const active = new Set();
  const release = details => {
    active.delete(details);
    document.documentElement.classList.toggle('disclosure-animating', active.size > 0);
  };
  document.querySelectorAll('details.course-group, details.research-summary').forEach(details => {
    const summary = details.querySelector('summary');
    const content = summary.nextElementSibling;
    let animation = null;
    let contentAnimation = null;
    let expanded = details.open;
    let cancelReturn = null;
    if (details.classList.contains('course-group')) {
      const footer = document.createElement('div');
      footer.className = 'course-collapse-footer';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'course-collapse';
      button.setAttribute('aria-label', `Collapse ${summary.textContent.trim()}`);
      const icon = summary.querySelector('svg').cloneNode(true);
      icon.classList.remove('disclosure-icon');
      button.append(icon);
      footer.append(button);
      details.append(footer);
      button.addEventListener('click', () => {
        if (!expanded || cancelReturn) return;
        // Keep the long list intact until its heading is back in view.
        const startY = window.scrollY;
        const headerHeight = document.querySelector('.header')?.getBoundingClientRect().height || 0;
        const targetY = Math.max(0, Math.min(
          startY + summary.getBoundingClientRect().top - headerHeight - 16,
          document.documentElement.scrollHeight - window.innerHeight
        ));
        let frame = null;
        const cleanup = () => {
          cancelAnimationFrame(frame);
          ['wheel', 'touchstart', 'keydown'].forEach(type => window.removeEventListener(type, cleanup));
          cancelReturn = null;
        };
        const collapse = () => {
          cleanup();
          if (!expanded) return;
          summary.focus({ preventScroll: true });
          summary.click();
        };
        if (reduced.matches || Math.abs(targetY - startY) < 2) {
          window.scrollTo({ top: targetY, behavior: 'instant' });
          collapse();
          return;
        }
        cancelReturn = cleanup;
        ['wheel', 'touchstart', 'keydown'].forEach(type => window.addEventListener(type, cleanup, { passive: true }));
        const started = performance.now();
        const step = now => {
          const progress = Math.min(1, (now - started) / (duration * 2));
          const eased = 1 - Math.pow(1 - progress, 3);
          window.scrollTo({ top: startY + (targetY - startY) * eased, behavior: 'instant' });
          if (progress < 1) frame = requestAnimationFrame(step);
          else collapse();
        };
        frame = requestAnimationFrame(step);
      });
    }
    const sync = () => {
      details.dataset.expanded = String(expanded);
      summary.setAttribute('aria-expanded', String(expanded));
    };
    const finish = () => {
      // Commit the native state before releasing the animated height.
      details.open = expanded;
      animation?.cancel();
      contentAnimation?.cancel();
      animation = null;
      contentAnimation = null;
      details.style.removeProperty('overflow');
      content.inert = !expanded;
      release(details);
      sync();
    };
    sync();
    summary.addEventListener('click', event => {
      event.preventDefault();
      cancelReturn?.();
      const start = details.getBoundingClientRect().height;
      const opacity = details.open ? getComputedStyle(content).opacity : '0';
      expanded = animation ? !expanded : !details.open;
      animation?.cancel();
      contentAnimation?.cancel();
      animation = null;
      contentAnimation = null;
      sync();
      content.inert = !expanded;
      if (reduced.matches || !details.animate) { finish(); return; }
      // Do not temporarily close the full list to measure it: that can clamp
      // scrollY near the page bottom before the animation has even started.
      active.add(details);
      document.documentElement.classList.add('disclosure-animating');
      details.open = true;
      const box = getComputedStyle(details);
      const end = expanded ? details.getBoundingClientRect().height
        : summary.getBoundingClientRect().height +
          ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth']
            .reduce((sum, key) => sum + (parseFloat(box[key]) || 0), 0);
      details.style.overflow = 'hidden';
      animation = details.animate(
        [{ height: `${start}px` }, { height: `${end}px` }],
        { duration, easing, fill: 'both' }
      );
      contentAnimation = content.animate(
        [{ opacity }, { opacity: expanded ? 1 : 0 }],
        { duration, easing, fill: 'both' }
      );
      animation.onfinish = finish;
    });
    // Preserve native details behavior for external state changes and no-JS use.
    details.addEventListener('toggle', () => {
      if (!animation) { expanded = details.open; content.inert = !expanded; sync(); }
    });
    window.addEventListener('resize', () => { if (animation) finish(); });
    window.addEventListener('beforeprint', finish);
    reduced.addEventListener('change', () => { if (animation) finish(); });
  });
})();
