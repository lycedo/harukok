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

const ZONES = new Set(['Asia/Seoul','Asia/Tokyo','Asia/Shanghai','Asia/Singapore','Asia/Kolkata','Asia/Dubai','Europe/London','Europe/Paris','America/New_York','America/Los_Angeles','Pacific/Honolulu','Australia/Sydney','UTC']);
function calculate(v){
  const m=String(v.source??'').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);if(!m)throw new Error('날짜와 시각을 입력하세요.');
  const [y,mo,d,h,mi,s]=m.slice(1).map(x=>Number(x??0));if(y<1900||y>2100||mo<1||mo>12||d<1||d>31||h>23||mi>59||s>59)throw new Error('1900~2100년의 올바른 날짜·시각을 넣으세요.');
  const local=Date.UTC(y,mo-1,d,h,mi,s),check=new Date(local);if(check.getUTCFullYear()!==y||check.getUTCMonth()!==mo-1||check.getUTCDate()!==d)throw new Error('실제 달력에 있는 날짜를 넣으세요.');
  if(!['KST','UTC'].includes(v['source-zone'])||!ZONES.has(v['target-zone']))throw new Error('시간대를 고르세요.');
  const date=new Date(local-(v['source-zone']==='KST'?9*3600000:0));
  const formatted=new Intl.DateTimeFormat('ko-KR',{timeZone:v['target-zone'],year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23',timeZoneName:'shortOffset'}).format(date);
  return {value:formatted,text:v['target-zone']+'\n'+formatted+'\nUTC: '+date.toISOString()};
}

const FIELD_IDS = ["source", "source-zone", "target-zone"];

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
