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
  const ids = ['a','b','c','d'], missing = ids.filter(id => !String(v[id] ?? '').trim());
  if (missing.length !== 1) throw new Error('빈칸을 정확히 하나 남기세요.');
  const n = Object.fromEntries(ids.filter(id => id !== missing[0]).map(id => [id, num(v[id], id.toUpperCase())]));
  const id=missing[0]; let result;
  if (id === 'a') { if (!n.d) throw new Error('D가 0이면 값을 하나로 정할 수 없습니다.'); result=n.b*n.c/n.d; }
  else if (id === 'b') { if (!n.c) throw new Error('C가 0이면 값을 하나로 정할 수 없습니다.'); result=n.a*n.d/n.c; }
  else if (id === 'c') { if (!n.b) throw new Error('B가 0이면 값을 하나로 정할 수 없습니다.'); result=n.a*n.d/n.b; }
  else { if (!n.a) throw new Error('A가 0이면 값을 하나로 정할 수 없습니다.'); result=n.b*n.c/n.a; }
  n[id]=result;
  if (!n.b || !n.d || !Number.isFinite(result) || (result === 0 && ids.filter(i=>i!==id).every(i=>n[i]!==0))) throw new Error('분모가 0이 되거나 표시할 수 없는 비례식입니다.');
  return {value:id.toUpperCase()+' = '+fmt(result), text:ids.map(i=>i.toUpperCase()+' = '+fmt(n[i])).join('\n')+'\nA : B = C : D'};
}

const FIELD_IDS = ["a", "b", "c", "d"];

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

}
