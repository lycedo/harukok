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
  const source=String(v.source??'').trim();if(!source||source.length>200000)throw new Error('숫자 목록을 최대 20만 자로 입력하세요.');
  const parts=source.split(/[\s,;]+/).filter(Boolean);if(!parts.length||parts.length>10000)throw new Error('숫자는 1~10,000개입니다.');
  const values=parts.map(s=>num(s,'자료',-1e12,1e12));if(!['population','sample'].includes(v.mode))throw new Error('계산 기준을 고르세요.');
  if(v.mode==='sample'&&values.length<2)throw new Error('표본 계산에는 숫자가 두 개 이상 필요합니다.');
  let count=0,mean=0,m2=0;for(const x of values){count++;const d=x-mean;mean+=d/count;m2+=d*(x-mean);}
  const variance=Math.max(0,m2/(count-(v.mode==='sample'?1:0))),deviation=Math.sqrt(variance);
  return {value:fmt(deviation),text:'표준편차: '+fmt(deviation)+'\n분산: '+fmt(variance)+'\n평균: '+fmt(mean)+'\n자료 수: '+count+'\n기준: '+(v.mode==='sample'?'표본 (N−1)':'모집단 (N)')};
}

const FIELD_IDS = ["source", "mode"];

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
