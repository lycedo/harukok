'use strict';

// Financial tools share the same edit → calculate → result behavior.
const inputCard = document.getElementById('calculator-inputs');
const calculateButton = document.getElementById('calcBtn');
const resultCard = document.getElementById('resultCard');
function clearOldEstimate() {
  resultCard.classList.add('hidden');
  const error = document.getElementById('inputError') || document.getElementById('formError');
  if (error) error.textContent = '';
}
inputCard.querySelectorAll('input').forEach(input => {
  input.addEventListener('input', clearOldEstimate);
  input.addEventListener('change', clearOldEstimate);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      calculateButton.click();
    }
  });
});
function syncChoices() {
  inputCard.querySelectorAll('.seg button').forEach(button => {
    button.setAttribute('aria-pressed', String(button.classList.contains('active')));
  });
}
inputCard.querySelectorAll('button').forEach(button => {
  if (button === calculateButton) return;
  button.addEventListener('click', () => {
    clearOldEstimate();
    syncChoices();
  });
});
syncChoices();
