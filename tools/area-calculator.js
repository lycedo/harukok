'use strict';

function convertArea(unit, value) {
  if (!Number.isFinite(value) || value < 0 || value > 1e9) throw new Error('면적은 0 이상 10억 이하의 숫자로 입력해 주세요.');
  if (unit !== 'sqm' && unit !== 'pyeong') throw new Error('입력할 면적 단위를 선택해 주세요.');
  const squareMetres = unit === 'sqm' ? value : value * (400 / 121);
  const pyeong = unit === 'pyeong' ? value : value * (121 / 400);
  if (value > 0 && (squareMetres === 0 || pyeong === 0)) throw new Error('계산하기에 너무 작은 값입니다.');
  return {squareMetres, pyeong};
}

function rectangleArea(width, length) {
  if (![width, length].every(value => Number.isFinite(value) && value >= 0 && value <= 1e6)) throw new Error('가로와 세로는 각각 0 이상 100만 m 이하로 입력해 주세요.');
  const area = width * length;
  if (width > 0 && length > 0 && area === 0) throw new Error('계산하기에 너무 작은 길이입니다.');
  if (area > 1e9) throw new Error('계산할 면적은 10억 ㎡ 이하여야 합니다.');
  return convertArea('sqm', area);
}

function formatArea(value, digits = 2) {
  if (value > 0 && value < 0.5 * 10 ** -digits) return digits === 2 ? '0.01 미만' : value.toExponential(5);
  return value.toLocaleString('ko-KR', {maximumFractionDigits: digits});
}

if (typeof module !== 'undefined') module.exports = {convertArea, rectangleArea, formatArea};
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  const fmt = value => formatArea(value, 6);
  function clearConversion() { $('area-result').hidden = true; $('area-error').textContent = ''; }
  function clearRectangle() { $('rectangle-result').hidden = true; $('rectangle-error').textContent = ''; }
  function changeLengthUnit() {
    const unit = $('length-unit').value;
    $('room-width').max = $('room-length').max = unit === 'cm' ? '100000000' : '1000000';
    $('room-width-label').textContent = `가로 (${unit})`;
    $('room-length-label').textContent = `세로 (${unit})`;
    $('room-width').placeholder = unit === 'cm' ? '예: 300' : '예: 3';
    $('room-length').placeholder = unit === 'cm' ? '예: 400' : '예: 4';
    clearRectangle();
  }
  $('length-unit').addEventListener('change', changeLengthUnit);
  function changeUnit() {
    $('area-label').textContent = $('area-unit').value === 'sqm' ? '면적 (㎡)' : '면적 (평)';
    clearConversion();
  }
  $('area-unit').addEventListener('change', changeUnit);
  $('area-form').addEventListener('input', clearConversion);
  $('area-form').addEventListener('submit', event => {
    event.preventDefault(); clearConversion();
    try {
      if ($('area-value').value.trim() === '') throw new Error('바꾸려는 면적을 입력해 주세요.');
      const value = Number($('area-value').value), unit = $('area-unit').value;
      const result = convertArea(unit, value), toPyeong = unit === 'sqm';
      $('area-result-label').textContent = toPyeong ? '같은 면적을 평으로 바꾸면' : '같은 면적을 제곱미터로 바꾸면';
      $('area-result-value').textContent = formatArea(toPyeong ? result.pyeong : result.squareMetres) + (toPyeong ? ' 평' : ' ㎡');
      $('area-formula').textContent = toPyeong ? `${fmt(value)} ㎡ × 121 ÷ 400 = ${fmt(result.pyeong)} 평` : `${fmt(value)} 평 × 400 ÷ 121 = ${fmt(result.squareMetres)} ㎡`;
      $('area-result').hidden = false; $('area-result').scrollIntoView({block:'nearest'});
    } catch (error) { $('area-error').textContent = error.message; }
  });
  document.querySelectorAll('[data-area-example]').forEach(button => button.addEventListener('click', () => {
    const [unit, value] = button.dataset.areaExample.split(',');
    $('area-unit').value = unit; changeUnit(); $('area-value').value = value;
    $('area-form').requestSubmit();
  }));
  $('rectangle-form').addEventListener('input', clearRectangle);
  $('rectangle-form').addEventListener('submit', event => {
    event.preventDefault(); clearRectangle();
    try {
      if ($('room-width').value.trim() === '' || $('room-length').value.trim() === '') throw new Error('가로와 세로를 모두 입력해 주세요.');
      const width = Number($('room-width').value), length = Number($('room-length').value);
      const unit = $('length-unit').value;
      if (!['m', 'cm'].includes(unit)) throw new Error('길이 단위를 선택해 주세요.');
      const scale = unit === 'cm' ? 100 : 1;
      const result = rectangleArea(width / scale, length / scale);
      $('rectangle-result-value').textContent = formatArea(result.squareMetres) + ' ㎡';
      $('rectangle-pyeong').textContent = '평으로 환산: ' + formatArea(result.pyeong) + ' 평';
      $('rectangle-formula').textContent = `${fmt(width)} ${unit} × ${fmt(length)} ${unit} = ${fmt(result.squareMetres)} ㎡`;
      $('rectangle-result').hidden = false; $('rectangle-result').scrollIntoView({block:'nearest'});
    } catch (error) { $('rectangle-error').textContent = error.message; }
  });
  $('rectangle-example').addEventListener('click', () => {
    $('length-unit').value = 'm'; changeLengthUnit();
    $('room-width').value = '3'; $('room-length').value = '4'; $('rectangle-form').requestSubmit();
  });
}
