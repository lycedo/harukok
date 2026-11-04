'use strict';
function rgbToHsl(r, g, b) {
  const channels = [r, g, b].map(value => value / 255);
  const max = Math.max(...channels), min = Math.min(...channels), delta = max - min, l = (max + min) / 2;
  let h = 0, s = 0;
  if (delta) {
    s = Math.min(1, Math.max(0, delta / (1 - Math.abs(2 * l - 1))));
    const [red, green, blue] = channels;
    h = max === red ? ((green - blue) / delta) % 6 : max === green ? (blue - red) / delta + 2 : (red - green) / delta + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: s * 100, l: l * 100 };
}
function convertColor(mode, values) {
  let rgb;
  if (mode === 'hex') {
    let hex = String(values[0]).trim().replace(/^#/, '');
    if (!/^(?:[\da-f]{3}|[\da-f]{6})$/i.test(hex)) throw new Error('HEX는 #RGB 또는 #RRGGBB 형식으로 입력해 주세요. 예: #B23A2E');
    if (hex.length === 3) hex = hex.split('').map(char => char + char).join('');
    rgb = [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16));
  } else if (mode === 'rgb') {
    rgb = values.map(Number);
    if (rgb.length !== 3 || !rgb.every(value => Number.isInteger(value) && value >= 0 && value <= 255)) throw new Error('R·G·B는 각각 0부터 255 사이의 정수로 입력해 주세요.');
  } else if (mode === 'hsl') {
    const [h, s, l] = values.map(Number);
    if (values.length !== 3 || ![h, s, l].every(Number.isFinite) || h < 0 || h > 360 || s < 0 || s > 100 || l < 0 || l > 100) throw new Error('색조는 0~360, 채도·명도는 0~100 사이로 입력해 주세요.');
    const hue = (h % 360) / 60, saturation = s / 100, lightness = l / 100;
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const x = chroma * (1 - Math.abs(hue % 2 - 1)), offset = lightness - chroma / 2;
    const sectors = [[chroma, x, 0], [x, chroma, 0], [0, chroma, x], [0, x, chroma], [x, 0, chroma], [chroma, 0, x]];
    rgb = sectors[Math.floor(hue)].map(value => Math.round((value + offset) * 255));
  } else throw new Error('입력할 색상 형식을 선택해 주세요.');
  const hex = '#' + rgb.map(value => value.toString(16).padStart(2, '0')).join('').toUpperCase();
  const hsl = rgbToHsl(...rgb);
  const fmt = value => String(Number(value.toFixed(2)));
  return { hex, rgb, hsl, rgbText: `rgb(${rgb.join(', ')})`, hslText: `hsl(${fmt(hsl.h)}, ${fmt(hsl.s)}%, ${fmt(hsl.l)}%)` };
}
if (typeof module !== 'undefined') module.exports = { rgbToHsl, convertColor };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  let version = 0;
  function clear() { version++; $('color-result').hidden = true; $('color-output').value = ''; $('color-error').textContent = ''; $('copy-status').textContent = ''; }
  function setMode() { clear(); for (const mode of ['hex', 'rgb', 'hsl']) $(mode + '-fields').hidden = $('color-mode').value !== mode; }
  $('color-mode').addEventListener('change', setMode);
  $('color-form').addEventListener('input', clear);
  $('color-form').addEventListener('change', clear);
  $('color-form').addEventListener('submit', event => {
    event.preventDefault(); clear();
    try {
      const mode = $('color-mode').value;
      const ids = mode === 'hex' ? ['hex-value'] : mode === 'rgb' ? ['red', 'green', 'blue'] : ['hue', 'saturation', 'lightness'];
      if (ids.some(id => !$(id).value.trim())) throw new Error('선택한 형식의 값을 모두 입력해 주세요.');
      const result = convertColor(mode, ids.map(id => $(id).value));
      $('hex-result').textContent = result.hex;
      $('color-output').value = [result.hex, result.rgbText, result.hslText].join('\n');
      $('color-preview').style.backgroundColor = result.hex;
      $('color-result').hidden = false;
    } catch (error) { $('color-error').textContent = error.message; }
  });
  $('color-example')?.addEventListener('click', () => { $('color-mode').value = 'hex'; setMode(); $('hex-value').value = '#B23A2E'; $('color-form').requestSubmit(); });
  $('copy-color').addEventListener('click', async () => {
    if ($('color-result').hidden) return;
    const current = version;
    try { await navigator.clipboard.writeText($('color-output').value); if (current === version) $('copy-status').textContent = '색상 코드를 복사했습니다.'; }
    catch { if (current !== version) return; $('copy-status').textContent = '결과 칸의 글을 선택해 직접 복사해 주세요.'; $('color-output').focus(); $('color-output').select(); }
  });
  setMode();
}
