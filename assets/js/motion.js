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
