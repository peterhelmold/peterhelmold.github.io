(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('details.course-group, details.research-summary').forEach(details => {
    const summary = details.querySelector('summary');
    let animation = null;
    let expanded = details.open;
    const finish = () => {
      animation?.cancel();
      animation = null;
      details.open = expanded;
      details.style.removeProperty('overflow');
    };
    summary.addEventListener('click', event => {
      event.preventDefault();
      const start = details.getBoundingClientRect().height;
      expanded = animation ? !expanded : !details.open;
      animation?.cancel();
      animation = null;
      if (reduced.matches) { finish(); return; }
      // Measure the destination before keeping the content visible for animation.
      details.open = expanded;
      const end = details.getBoundingClientRect().height;
      details.open = true;
      details.style.overflow = 'hidden';
      animation = details.animate(
        [{ height: `${start}px` }, { height: `${end}px` }],
        { duration: 260, easing: 'cubic-bezier(.22,1,.36,1)' }
      );
      animation.onfinish = finish;
    });
    window.addEventListener('resize', () => { if (animation) finish(); });
    reduced.addEventListener('change', () => { if (animation) finish(); });
  });
})();
