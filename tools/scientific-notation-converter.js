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

function decimalParts(raw){
  const text=String(raw??'').trim();if(text.length>2100)throw new Error('숫자는 최대 1,000자리로 입력하세요.');
  const m=text.match(/^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d{1,4}))?$/);if(!m)throw new Error('올바른 숫자를 입력하세요.');
  const fraction=m[3]??m[4]??'',whole=m[2]??'',rawDigits=whole+fraction,exponent=Number(m[5]??0);
  if(rawDigits.length>1000||Math.abs(exponent)>1000)throw new Error('숫자 1,000자리·지수 ±1,000까지 지원합니다.');
  let digits=rawDigits.replace(/^0+/,'');if(!digits)return {negative:false,digits:'0',scale:0};
  let scale=exponent-fraction.length;while(digits.endsWith('0')){digits=digits.slice(0,-1);scale++;}
  return {negative:m[1]==='-',digits,scale};
}
function calculate(v){
  const p=decimalParts(v.source);let output;
  if(v.mode==='scientific'){const exponent=p.scale+p.digits.length-1;output=(p.negative?'-':'')+p.digits[0]+(p.digits.length>1?'.'+p.digits.slice(1):'')+'e'+exponent;}
  else if(v.mode==='decimal'){let pos=p.digits.length+p.scale;output=pos<=0?'0.'+'0'.repeat(-pos)+p.digits:pos>=p.digits.length?p.digits+'0'.repeat(pos-p.digits.length):p.digits.slice(0,pos)+'.'+p.digits.slice(pos);output=(p.negative?'-':'')+output;}
  else throw new Error('변환 방향을 고르세요.');
  return {value:output,text:output};
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
