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

function calculate(v){
  const first=num(v.first,'첫항',-1e9,1e9),step=num(v.step,'공차 또는 공비',-1e6,1e6),n=integer(v.n,'n',1,10000);let term,sum;
  if(v.mode==='arithmetic'){term=first+(n-1)*step;sum=n*(first+term)/2;}
  else if(v.mode==='geometric') {term=first;sum=first;let correction=0;for(let i=1;i<n;i++){const previous=term;term*=step;if(previous!==0&&step!==0&&term===0)throw new Error('항이 너무 작아 표시할 수 없습니다.');const y=term-correction,t=sum+y;correction=(t-sum)-y;sum=t;if(!Number.isFinite(term)||!Number.isFinite(sum)||Math.abs(term)>1e300||Math.abs(sum)>1e300)throw new Error('결과가 너무 큽니다. 항 번호나 공비를 줄이세요.');}}
  else throw new Error('수열 종류를 고르세요.');
  return {value:fmt(term),text:n+'번째 항: '+fmt(term)+'\n첫 '+n+'항의 합: '+fmt(sum)};
}

const FIELD_IDS = ["mode", "first", "step", "n"];

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
