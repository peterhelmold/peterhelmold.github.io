(() => {
  const root = document.documentElement;
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let themeTimer;
  const finishTheme = () => {
    clearTimeout(themeTimer);
    root.classList.remove('theme-transitioning');
  };
  reduced.addEventListener('change', finishTheme);
  let preference = 'system';
  // Each document load starts in System; manual choices last for this page only.
  let control;
  let syncSelection = () => {};
  const apply = () => {
    const next = preference === 'system' ? (system.matches ? 'dark' : 'light') : preference;
    if (next !== root.dataset.theme && root.classList.contains('theme-ready') && !reduced.matches) {
      clearTimeout(themeTimer);
      root.classList.add('theme-transitioning');
      // Establish transitions before changing the palette, including rapid reversals.
      getComputedStyle(document.body).backgroundColor;
      const duration = parseFloat(getComputedStyle(root).getPropertyValue('--motion-expand')) || 280;
      themeTimer = setTimeout(finishTheme, duration + 50);
    }
    root.dataset.theme = next;
    root.dataset.appearance = preference;
    control?.querySelector('button')?.setAttribute('aria-label', `Appearance: ${preference}. Toggle light or dark; hover, hold, or press Arrow Down for options`);
    control?.querySelectorAll('input').forEach(input => { input.checked = input.value === preference; });
    syncSelection();
  };
  apply();
  system.addEventListener('change', apply);
  document.addEventListener('DOMContentLoaded', () => {
    control = document.querySelector('.theme-control');
    if (!control) return;
    const button = control.querySelector('button');
    const options = control.querySelector('fieldset');
    const selection = document.createElement('span');
    selection.className = 'theme-selection';
    selection.setAttribute('aria-hidden', 'true');
    options.append(selection);
    options.classList.add('has-selection');
    syncSelection = () => {
      if (options.hidden) return;
      const label = options.querySelector('input:checked')?.closest('label');
      if (!label) return;
      selection.style.height = `${label.offsetHeight}px`;
      selection.style.transform = `translateY(${label.offsetTop}px)`;
    };
    window.addEventListener('resize', syncSelection);
    const motion = getComputedStyle(root);
    const feedback = parseFloat(motion.getPropertyValue('--motion-feedback')) || 180;
    const expand = parseFloat(motion.getPropertyValue('--motion-expand')) || 280;
    const easing = motion.getPropertyValue('--motion-ease').trim() || 'ease-out';
    let hoverTimer;
    let pressTimer;
    let pressOrigin = null;
    let longPressed = false;
    const clearPress = () => {
      clearTimeout(pressTimer);
      pressOrigin = null;
    };
    let menuAnimation;
    let expanded = false;
    const settle = () => {
      options.hidden = !expanded;
      menuAnimation?.cancel();
      menuAnimation = null;
    };
    const show = next => {
      if (expanded === next) return;
      expanded = next;
      const start = options.hidden
        ? { opacity: 0, transform: 'translateY(-5px) scale(.97)' }
        : { opacity: getComputedStyle(options).opacity, transform: getComputedStyle(options).transform };
      menuAnimation?.cancel();
      menuAnimation = null;
      options.hidden = false;
      syncSelection();
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
      clearTimeout(hoverTimer);
      clearPress();
      show(false);
      if (restoreFocus) button.focus();
    };
    reduced.addEventListener('change', () => { if (menuAnimation) settle(); });
    control.hidden = false;
    apply();
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('theme-ready')));
    control.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') {
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(open, 650);
      }
    });
    control.addEventListener('pointerleave', event => {
      clearTimeout(hoverTimer);
      clearPress();
      // Crossing the gap or clicking a label must not dismiss an open menu.
    });
    button.addEventListener('pointerdown', event => {
      if (event.button !== 0 || !event.isPrimary) return;
      clearTimeout(hoverTimer);
      clearPress();
      longPressed = false;
      pressOrigin = { x: event.clientX, y: event.clientY };
      pressTimer = setTimeout(() => {
        longPressed = true;
        open();
      }, 500);
    });
    button.addEventListener('pointermove', event => {
      if (pressOrigin && Math.hypot(event.clientX - pressOrigin.x, event.clientY - pressOrigin.y) > 10) clearPress();
    });
    button.addEventListener('pointerleave', clearPress);
    document.addEventListener('pointerup', clearPress);
    document.addEventListener('pointercancel', () => { clearPress(); longPressed = false; });
    button.addEventListener('contextmenu', event => {
      if (longPressed || pressOrigin) event.preventDefault();
    });
    button.addEventListener('click', event => {
      clearTimeout(hoverTimer);
      clearPress();
      if (longPressed && event.detail !== 0) {
        event.preventDefault();
        longPressed = false;
        return;
      }
      longPressed = false;
      preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
      apply();
    });
    button.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        clearTimeout(hoverTimer);
        open();
        options.querySelector('input:checked').focus();
      }
    });
    options.addEventListener('change', event => {
      if (!event.target.matches('input[name="appearance"]')) return;
      preference = event.target.value;
      apply();
    });
    document.addEventListener('pointerdown', event => { if (!control.contains(event.target)) close(); });
    control.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); close(true); }
      if (event.key === 'Tab') {
        // Wait for native keyboard focus movement. Pointer clicks on labels
        // can temporarily blur the radio before its change event is delivered.
        setTimeout(() => {
          if (!control.contains(document.activeElement)) close();
        }, 0);
      }
    });
  });
})();
