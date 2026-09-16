(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motion = getComputedStyle(document.documentElement);
  const duration = parseFloat(motion.getPropertyValue('--motion-expand')) || 280;
  const easing = motion.getPropertyValue('--motion-ease').trim() || 'ease-out';
  document.querySelectorAll('details.course-group, details.research-summary').forEach(details => {
    const summary = details.querySelector('summary');
    const content = summary.nextElementSibling;
    let animation = null;
    let contentAnimation = null;
    let expanded = details.open;
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
      sync();
    };
    sync();
    summary.addEventListener('click', event => {
      event.preventDefault();
      const start = details.getBoundingClientRect().height;
      const opacity = details.open ? getComputedStyle(content).opacity : '0';
      expanded = animation ? !expanded : !details.open;
      animation?.cancel();
      contentAnimation?.cancel();
      animation = null;
      contentAnimation = null;
      sync();
      if (reduced.matches || !details.animate) { finish(); return; }
      // Measure the destination before keeping the content visible for animation.
      details.open = expanded;
      const end = details.getBoundingClientRect().height;
      details.open = true;
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
      if (!animation) { expanded = details.open; sync(); }
    });
    window.addEventListener('resize', () => { if (animation) finish(); });
    window.addEventListener('beforeprint', finish);
    reduced.addEventListener('change', () => { if (animation) finish(); });
  });
})();
