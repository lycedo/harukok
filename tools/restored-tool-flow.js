'use strict';
// Preserve each recovered tool's calculation; share validation and result navigation.
(function () {
  const main = document.querySelector('main');
  if (!main) return;
  const calculate = document.getElementById('calcBtn');
  const result = document.getElementById('resultCard');
  if (calculate && result) {
    const fields = [...main.querySelectorAll('input[type=number],input[type=date]')];
    calculate.addEventListener('click', event => {
      const invalid = fields.find(field => !field.checkValidity());
      if (invalid) {
        event.stopImmediatePropagation();
        invalid.reportValidity();
        return;
      }
      setTimeout(() => {
        if (!result.classList.contains('hidden')) {
          result.setAttribute('tabindex', '-1');
          result.focus({ preventScroll: true });
          result.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }, 0);
    }, true);
    main.addEventListener('input', () => result.classList.add('hidden'));
    main.addEventListener('click', event => {
      if (event.target.closest('.seg button')) result.classList.add('hidden');
    });
    main.addEventListener('keydown', event => {
      if (event.key === 'Enter' && event.target.matches('input')) {
        event.preventDefault(); calculate.click();
      }
    });
  }
  main.querySelectorAll('.seg button,.mood-seg button').forEach(button => {
    button.setAttribute('aria-pressed', String(button.classList.contains('active')));
    button.addEventListener('click', () => {
      button.parentElement.querySelectorAll('button').forEach(peer => {
        peer.setAttribute('aria-pressed', String(peer.classList.contains('active')));
      });
    });
  });
})();
