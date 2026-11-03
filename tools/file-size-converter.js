'use strict';
const FILE_SIZE_UNITS = Object.freeze({
  B: 1n, KB: 1000n, MB: 1000000n, GB: 1000000000n, TB: 1000000000000n,
  KiB: 1024n, MiB: 1048576n, GiB: 1073741824n, TiB: 1099511627776n
});
const FILE_SIZE_SCALE = 1000000n;

function parseFileSize(value) {
  const text = String(value).trim();
  if (text.length > 40 || !/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,6})?$/.test(text)) {
    throw new Error('0 이상의 숫자를 소수점 6자리 이내로 입력하세요. 예: 1.5 또는 1,000');
  }
  const [whole, fraction = ''] = text.replace(/,/g, '').split('.');
  const scaled = BigInt(whole) * FILE_SIZE_SCALE + BigInt(fraction.padEnd(6, '0'));
  if (scaled > 1000000000000n * FILE_SIZE_SCALE) throw new Error('입력값은 1조 이하여야 합니다.');
  return scaled;
}

function formatFileSize(numerator, denominator) {
  const rounded = (numerator * FILE_SIZE_SCALE + denominator / 2n) / denominator;
  if (numerator > 0n && rounded === 0n) return '0.000001 미만';
  const whole = (rounded / FILE_SIZE_SCALE).toLocaleString('ko-KR');
  const fraction = (rounded % FILE_SIZE_SCALE).toString().padStart(6, '0').replace(/0+$/, '');
  return whole + (fraction ? '.' + fraction : '');
}

function convertFileSize(value, unit) {
  if (!Object.hasOwn(FILE_SIZE_UNITS, unit)) throw new Error('입력 단위를 선택하세요.');
  const bytes = parseFileSize(value) * FILE_SIZE_UNITS[unit];
  return Object.entries(FILE_SIZE_UNITS).map(([name, factor]) => ({
    unit: name, value: formatFileSize(bytes, FILE_SIZE_SCALE * factor)
  }));
}

if (typeof module !== 'undefined') module.exports = { FILE_SIZE_UNITS, parseFileSize, convertFileSize };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  let version = 0;
  function clearResult() {
    version++;
    $('size-result').hidden = true;
    $('size-output').value = '';
    $('size-error').textContent = '';
    $('copy-status').textContent = '';
  }
  $('size-form').addEventListener('input', clearResult);
  $('size-form').addEventListener('change', clearResult);
  $('size-form').addEventListener('submit', event => {
    event.preventDefault();
    clearResult();
    try {
      const results = convertFileSize($('size-value').value, $('size-unit').value);
      $('size-output').value = results.map(item => item.value + ' ' + item.unit).join('\n');
      $('size-result').hidden = false;
      $('size-result').scrollIntoView({ block: 'nearest' });
    } catch (error) { $('size-error').textContent = error.message; }
  });
  $('size-example').addEventListener('click', () => {
    $('size-value').value = '1';
    $('size-unit').value = 'GiB';
    $('size-form').requestSubmit();
  });
  $('copy-size').addEventListener('click', async () => {
    const current = version;
    if ($('size-result').hidden) return;
    try {
      await navigator.clipboard.writeText($('size-output').value);
      if (current === version) $('copy-status').textContent = '변환 결과를 복사했습니다.';
    } catch {
      if (current !== version) return;
      $('copy-status').textContent = '결과 칸의 글을 선택해 직접 복사하세요.';
      $('size-output').focus();
      $('size-output').select();
    }
  });
}
