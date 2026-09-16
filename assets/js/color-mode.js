(() => {
  const root = document.documentElement;
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = null;
  try {
    const saved = localStorage.getItem('color-mode');
    if (saved === 'dark' || saved === 'light') preference = saved;
  } catch (_) { /* The toggle still works when storage is unavailable. */ }
  let button;
  let transitionTimer;
  const apply = () => {
    const dark = (preference || (system.matches ? 'dark' : 'light')) === 'dark';
    if (button && root.dataset.theme !== (dark ? 'dark' : 'light')) {
      clearTimeout(transitionTimer);
      root.classList.add('theme-changing');
      transitionTimer = setTimeout(() => root.classList.remove('theme-changing'), 350);
    }
    root.dataset.theme = dark ? 'dark' : 'light';
    if (button) {
      button.setAttribute('aria-pressed', String(dark));
      button.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
    }
  };
  apply();
  system.addEventListener('change', apply);
  document.addEventListener('DOMContentLoaded', () => {
    button = document.querySelector('.theme-toggle');
    if (!button) return;
    button.hidden = false;
    apply();
    button.addEventListener('click', () => {
      preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('color-mode', preference); } catch (_) {}
      apply();
    });
  });
})();
