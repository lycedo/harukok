'use strict';
function num(raw, name, min = -1e12, max = 1e12) {
  const text = String(raw ?? '').trim();
  if (!text || text.length > 100 || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text)) throw new Error(name + '에 숫자를 입력하세요.');
  const value = Number(text);
  if (!Number.isFinite(value) || (value === 0 && /[1-9]/.test(text.split(/[eE]/)[0])) || value < min || value > max) throw new Error(name + '의 허용 범위를 확인하세요.');
  return value;
}
function integer(raw, name, min, max) { const n = num(raw, name, min, max); if (!Number.isInteger(n)) throw new Error(name + '은 정수로 입력하세요.'); return n; }
function fmt(n) { return Number(n).toLocaleString('ko-KR', { maximumSignificantDigits: 12 }); }
function positive(raw, name) { const n = num(raw, name, 0, 1e9); if (n === 0) throw new Error(name + '은 0보다 커야 합니다.'); return n; }

function calculate(v) {
  if(!['cm','m'].includes(v.unit)) throw new Error('길이 단위를 고르세요.');
  const a=positive(v.a,'가로 또는 반지름');let volume;
  if(v.shape==='box') volume=a*positive(v.b,'세로')*positive(v.c,'높이');
  else if(v.shape==='cylinder'||v.shape==='cone') volume=Math.PI*a*a*positive(v.b,'높이')/(v.shape==='cone'?3:1);
  else if(v.shape==='sphere') volume=4*Math.PI*a*a*a/3;
  else throw new Error('입체를 고르세요.');
  const liters=volume*(v.unit==='cm'?0.001:1000);
  if(!Number.isFinite(liters)||volume===0) throw new Error('표시할 수 없는 부피입니다.');
  return {value:fmt(volume)+v.unit+'³',text:'부피: '+fmt(volume)+v.unit+'³\n리터: '+fmt(liters)+' L'};
}

const FIELD_IDS = ["shape", "unit", "a", "b", "c"];

if (typeof module !== 'undefined') module.exports = { calculate };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id); let version = 0;
  function clear() { version++; $('result').hidden = true; $('result-text').value = ''; $('result-value').textContent = ''; $('error').textContent = ''; $('copy-status').textContent = ''; }
  $('calculator').addEventListener('input', clear); $('calculator').addEventListener('change', clear);
  $('calculator').addEventListener('submit', event => { event.preventDefault(); clear(); try {
    const values = Object.fromEntries(FIELD_IDS.map(id => [id, $(id).value])); const result = calculate(values);
    $('result-value').textContent = result.value; $('result-text').value = result.text; $('result').hidden = false; $('result').scrollIntoView({ block: 'nearest' });
  } catch (error) { $('error').textContent = error.message; } });
  $('copy').addEventListener('click', async () => { if ($('result').hidden) return; const token = version;
    try { await navigator.clipboard.writeText($('result-text').value); if (version === token) $('copy-status').textContent = '복사했습니다.'; }
    catch { if (version !== token) return; $('copy-status').textContent = '결과를 선택해 복사하세요.'; $('result-text').focus(); $('result-text').select(); }
  });

  function shapeFields(){ const shape=$('shape').value; $('b-field').hidden=shape==='sphere';$('c-field').hidden=shape!=='box';document.querySelector('label[for="a"]').textContent=shape==='box'?'가로':'반지름';document.querySelector('label[for="b"]').textContent=shape==='box'?'세로':'높이'; }
  $('shape').addEventListener('change',shapeFields);shapeFields();

}
