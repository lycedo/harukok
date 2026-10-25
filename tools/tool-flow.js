'use strict';

// Keep both calculators usable without JavaScript; show one at a time when enabled.
const purposeButtons = document.querySelectorAll('[data-tool-panel]');
function showToolPanel(id) {
  purposeButtons.forEach(button => {
    const selected = button.dataset.toolPanel === id;
    button.setAttribute('aria-pressed', String(selected));
    document.getElementById(button.dataset.toolPanel).hidden = !selected;
  });
}
if (purposeButtons.length) {
  purposeButtons.forEach(button => button.addEventListener('click', () => showToolPanel(button.dataset.toolPanel)));
  document.querySelector('.purpose-switch').hidden = false;
  showToolPanel(purposeButtons[0].dataset.toolPanel);
}
