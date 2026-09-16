(() => {
  const button = document.querySelector('.copy-email');
  if (!button || !navigator.clipboard?.writeText) return;
  const link = document.querySelector('.email-actions a');
  const status = document.querySelector('.copy-status');
  let timer;
  button.hidden = false;
  button.addEventListener('click', async () => {
    button.disabled = true;
    clearTimeout(timer);
    status.textContent = '';
    try {
      await navigator.clipboard.writeText(link.textContent.trim());
      button.classList.add('is-copied');
      button.removeAttribute('title');
      status.textContent = 'Copied';
      status.classList.remove('copy-error');
    } catch (_) {
      button.classList.remove('is-copied'); button.title = 'Copy email address';
      status.textContent = 'Could not copy. Please select the email address.';
      status.classList.add('copy-error');
    } finally {
      button.disabled = false;
      timer = setTimeout(() => { button.classList.remove('is-copied'); button.title = 'Copy email address'; status.textContent = ''; }, 3000);
    }
  });
})();
