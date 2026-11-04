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

function gcd(a,b){a=a<0n?-a:a;b=b<0n?-b:b;while(b){[a,b]=[b,a%b];}return a;}
function calculate(v){
  const s=String(v.source??'').trim();let numerator,denominator;
  if(s.length>405)throw new Error('각 숫자는 최대 200자리입니다.');
  if(v.mode==='fraction'){
    const m=s.match(/^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))$/);if(!m)throw new Error('유한소수를 입력하세요.');
    const fraction=m[3]??m[4]??'',digits=(m[2]??'')+fraction;if(digits.length>200)throw new Error('숫자는 최대 200자리입니다.');
    numerator=BigInt(digits||'0')*(m[1]==='-'?-1n:1n);denominator=10n**BigInt(fraction.length);
  }else if(v.mode==='decimal'){
    const m=s.match(/^([+-]?\d{1,200})\s*\/\s*([+-]?\d{1,200})$/);if(!m)throw new Error('분수는 1/8 형식으로 입력하세요.');numerator=BigInt(m[1]);denominator=BigInt(m[2]);if(!denominator)throw new Error('분모는 0이 될 수 없습니다.');
  }else throw new Error('변환 방향을 고르세요.');
  if(denominator<0n){numerator=-numerator;denominator=-denominator;}
  const divisor=gcd(numerator,denominator);numerator/=divisor;denominator/=divisor;
  const fraction=numerator+'/'+denominator;if(v.mode==='fraction')return {value:fraction,text:'기약분수: '+fraction};
  const negative=numerator<0n,n=negative?-numerator:numerator;let remainder=n%denominator,digits='',test=denominator;
  while(test%2n===0n)test/=2n;while(test%5n===0n)test/=5n;
  const limit=test===1n?700:20;
  while(remainder&&digits.length<limit){remainder*=10n;digits+=(remainder/denominator).toString();remainder%=denominator;}
  const approximate=remainder!==0n;
  const decimal=(negative?'-':'')+(n/denominator)+(digits?'.'+digits:'')+(approximate?'…':'');
  return {value:(approximate?'≈ ':'')+decimal,text:'기약분수: '+fraction+'\n소수 '+(approximate?'≈ ':'= ')+decimal};
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
