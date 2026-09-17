(() => {
  const root = document.documentElement;
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = 'system';
  try {
    const saved = localStorage.getItem('color-mode');
    if (['light', 'dark', 'system'].includes(saved)) preference = saved;
  } catch (_) { /* Preferences still work when storage is unavailable. */ }
  let control;
  const apply = () => {
    root.dataset.theme = preference === 'system' ? (system.matches ? 'dark' : 'light') : preference;
    root.dataset.appearance = preference;
    control?.querySelectorAll('input').forEach(input => { input.checked = input.value === preference; });
  };
  apply();
  system.addEventListener('change', apply);
  document.addEventListener('DOMContentLoaded', () => {
    control = document.querySelector('.theme-control');
    if (!control) return;
    const button = control.querySelector('button');
    const options = control.querySelector('fieldset');
    const motion = getComputedStyle(root);
    const feedback = parseFloat(motion.getPropertyValue('--motion-feedback')) || 180;
    const expand = parseFloat(motion.getPropertyValue('--motion-expand')) || 280;
    const easing = motion.getPropertyValue('--motion-ease').trim() || 'ease-out';
    let closeTimer;
    let menuAnimation;
    let expanded = false;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const settle = () => {
      options.hidden = !expanded;
      menuAnimation?.cancel();
      menuAnimation = null;
    };
    const show = next => {
      clearTimeout(closeTimer);
      if (expanded === next) return;
      expanded = next;
      const start = options.hidden
        ? { opacity: 0, transform: 'translateY(-5px) scale(.97)' }
        : { opacity: getComputedStyle(options).opacity, transform: getComputedStyle(options).transform };
      menuAnimation?.cancel();
      menuAnimation = null;
      options.hidden = false;
      options.inert = !expanded;
      button.setAttribute('aria-expanded', String(expanded));
      if (reduced.matches || !options.animate) { settle(); return; }
      menuAnimation = options.animate([
        start,
        expanded ? { opacity: 1, transform: 'translateY(0) scale(1)' }
          : { opacity: 0, transform: 'translateY(-3px) scale(.98)' }
      ], {
        duration: expanded ? expand : feedback,
        easing,
        fill: 'both'
      });
      menuAnimation.onfinish = settle;
    };
    const open = () => show(true);
    const close = (restoreFocus = false) => {
      show(false);
      if (restoreFocus) button.focus();
    };
    reduced.addEventListener('change', () => { if (menuAnimation) settle(); });
    control.hidden = false;
    apply();
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('theme-ready')));
    control.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') open();
    });
    control.addEventListener('pointerleave', event => {
      if (event.pointerType === 'mouse') closeTimer = setTimeout(() => {
        if (!options.contains(document.activeElement)) close();
      }, 180);
    });
    button.addEventListener('click', () => {
      preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('color-mode', preference); } catch (_) {}
      apply();
      // Touch users can still reach all three choices after a direct toggle.
      open();
    });
    button.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        open();
        options.querySelector('input:checked').focus();
      }
    });
    options.addEventListener('change', event => {
      if (!event.target.matches('input[name="appearance"]')) return;
      preference = event.target.value;
      try { localStorage.setItem('color-mode', preference); } catch (_) {}
      apply();
    });
    document.addEventListener('pointerdown', event => { if (!control.contains(event.target)) close(); });
    control.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); close(true); }
    });
    control.addEventListener('focusout', event => {
      if (!control.contains(event.relatedTarget)) close();
    });
  });
})();
