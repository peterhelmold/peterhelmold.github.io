/* Appearance: System, Light or Dark.
   Loaded in <head> without defer so the palette is set before the first paint.
   Click toggles light and dark. Hover (650 ms), hold (500 ms) or Arrow Down
   opens a capsule of three icons; a pill slides behind the choice.
   Opened by pointer, the picker closes once the pointer has left for a moment;
   opened by keyboard, it stays until Escape, Tab or a click outside. */
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const KEY = 'hengyi-site:appearance';
  // Arriving from a language switch (site.js sets the flag): fade this page in.
  try {
    if (sessionStorage.getItem('hengyi-site:language-switch')) {
      sessionStorage.removeItem('hengyi-site:language-switch');
      if (!reduced.matches) root.classList.add('lang-arriving');
    }
  } catch { /* Storage can be unavailable; just show the page. */ }
  // Labels in the page's language come from data-label-* on <html>.
  const words = root.dataset;
  const NAMES = {
    system: words.labelSystem || 'System',
    light: words.labelLight || 'Light',
    dark: words.labelDark || 'Dark',
  };
  const HINT = words.labelAppearanceHint
    || 'Appearance: {mode}. Click to switch between light and dark; hover, hold, or press Arrow Down for options';
  let preference = 'system';
  try {
    const saved = localStorage.getItem(KEY);
    if (saved in NAMES) preference = saved;
  } catch { /* Storage can be unavailable; follow the system. */ }

  const resolved = () => preference === 'system' ? (system.matches ? 'dark' : 'light') : preference;
  let paintControl = () => {};
  // The browser chrome around the page (on iPhone, either side of the Dynamic Island)
  // follows theme-color, which on its own only tracks the system setting.
  const CHROME = { light: '#ffffff', dark: '#000000' };
  const paint = () => {
    const theme = resolved();
    root.dataset.theme = theme;
    root.dataset.appearance = preference;
    document.querySelectorAll('meta[name="theme-color"]').forEach(meta => meta.setAttribute('content', CHROME[theme]));
    paintControl();
  };
  paint();
  system.addEventListener('change', () => { if (preference === 'system') paint(); });

  document.addEventListener('DOMContentLoaded', () => {
    const control = document.querySelector('.appearance');
    if (!control) return;
    const button = control.querySelector('.appearance-button');
    const picker = control.querySelector('.appearance-menu');
    const options = [...picker.querySelectorAll('[role="radio"]')];
    const icons = [...button.querySelectorAll('.appearance-icon')];
    const pill = picker.querySelector('.theme-pill');
    const current = () => options.find(option => option.dataset.value === preference);

    const placePill = (instant = false) => {
      const option = current();
      if (!option || picker.hidden) return;
      if (instant) pill.classList.add('is-placing');
      pill.style.transform = `translateX(${option.offsetLeft}px)`;
      if (instant) { pill.getBoundingClientRect(); pill.classList.remove('is-placing'); }
    };

    paintControl = () => {
      icons.forEach(icon => icon.classList.toggle('is-current', icon.dataset.mode === preference));
      options.forEach(option => {
        const on = option.dataset.value === preference;
        option.setAttribute('aria-checked', String(on));
        option.tabIndex = on ? 0 : -1;
      });
      button.setAttribute('aria-label', HINT.replace('{mode}', NAMES[preference]));
      placePill();
    };
    paintControl();
    control.hidden = false;

    const setPreference = next => {
      if (next === preference) return;
      preference = next;
      try { localStorage.setItem(KEY, preference); } catch { /* Keep it for this page only. */ }
      // The palette switches in a single frame. Fading every colour stuttered on iPhone
      // (hundreds of text repaints), and View Transitions blanked part of the screen there.
      // Feedback comes from the button's icon turning instead.
      root.classList.add('theme-changing');
      paint();
      root.getBoundingClientRect();
      requestAnimationFrame(() => root.classList.remove('theme-changing'));
    };

    let expanded = false;
    let openedBy = null;
    let animation = null;
    const show = (next, via = null) => {
      if (expanded === next) { if (next && via === 'key') current()?.focus(); return; }
      expanded = next;
      openedBy = next ? via : null;
      const start = picker.hidden
        ? { opacity: 0, transform: 'translateY(-8px) scale(.9)' }
        : { opacity: getComputedStyle(picker).opacity, transform: getComputedStyle(picker).transform };
      animation?.cancel();
      animation = null;
      picker.hidden = false;
      picker.inert = !next;
      button.setAttribute('aria-expanded', String(next));
      if (next) { placePill(true); if (via === 'key') current()?.focus(); }
      if (reduced.matches || !picker.animate) { picker.hidden = !next; return; }
      animation = picker.animate(
        [start, next ? { opacity: 1, transform: 'none' } : { opacity: 0, transform: 'translateY(-6px) scale(.95)' }],
        { duration: next ? 300 : 120, easing: next ? 'cubic-bezier(.25,1,.35,1)' : 'ease-in', fill: 'both' }
      );
      animation.onfinish = () => { animation.cancel(); animation = null; picker.hidden = !expanded; };
    };

    let hoverTimer;
    let leaveTimer;
    let pressTimer;
    let longPressed = false;
    const close = (restoreFocus = false) => {
      clearTimeout(hoverTimer);
      clearTimeout(leaveTimer);
      clearTimeout(pressTimer);
      const hadFocus = control.contains(document.activeElement);
      show(false);
      if (restoreFocus || hadFocus) button.focus({ preventScroll: true });
    };

    button.addEventListener('click', () => {
      if (longPressed) { longPressed = false; return; }
      clearTimeout(hoverTimer);
      setPreference(resolved() === 'dark' ? 'light' : 'dark');
    });
    button.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown') { event.preventDefault(); show(true, 'key'); }
    });

    // Pointer: open after a pause, close shortly after leaving both button and picker.
    control.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse') return;
      clearTimeout(leaveTimer);
      if (!expanded) { clearTimeout(hoverTimer); hoverTimer = setTimeout(() => show(true, 'pointer'), 650); }
    });
    control.addEventListener('pointerleave', event => {
      if (event.pointerType !== 'mouse') return;
      clearTimeout(hoverTimer);
      if (expanded && openedBy === 'pointer') { clearTimeout(leaveTimer); leaveTimer = setTimeout(() => close(), 400); }
    });
    button.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      longPressed = false;
      clearTimeout(pressTimer);
      pressTimer = setTimeout(() => { longPressed = true; clearTimeout(hoverTimer); show(true, 'pointer'); }, 500);
    });
    ['pointerup', 'pointercancel'].forEach(type => button.addEventListener(type, () => clearTimeout(pressTimer)));
    button.addEventListener('contextmenu', event => { if (longPressed) event.preventDefault(); });

    // Choosing previews immediately and keeps the picker open for comparison.
    options.forEach((option, index) => {
      option.addEventListener('click', () => setPreference(option.dataset.value));
      option.addEventListener('keydown', event => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
        let next = null;
        if (step) next = options[(index + step + options.length) % options.length];
        else if (event.key === 'Home') next = options[0];
        else if (event.key === 'End') next = options[options.length - 1];
        if (!next) return;
        event.preventDefault();
        openedBy = 'key';
        next.focus();
        setPreference(next.dataset.value);
      });
    });

    document.addEventListener('pointerdown', event => { if (expanded && !control.contains(event.target)) close(); });
    document.addEventListener('keydown', event => { if (expanded && event.key === 'Escape') close(true); });
    control.addEventListener('focusout', event => {
      if (expanded && event.relatedTarget && !control.contains(event.relatedTarget)) close();
    });
    window.addEventListener('resize', () => placePill(true));
  });
})();
