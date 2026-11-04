'use strict';
function decodeJwtSegment(segment) {
  if (!/^[A-Za-z0-9_-]+$/.test(segment) || segment.length % 4 === 1) throw new Error('JWT의 Base64url 형식을 확인하세요.');
  let value;
  try { const binary = atob(segment.replace(/-/g,'+').replace(/_/g,'/') + '='.repeat((4 - segment.length % 4) % 4)); value = JSON.parse(new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(Uint8Array.from(binary,c=>c.charCodeAt(0)))); }
  catch { throw new Error('헤더·페이로드가 UTF-8 JSON이 아닙니다.'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('헤더·페이로드는 JSON 객체여야 합니다.');
  return value;
}
function decodeJWT(text) {
  if (typeof text !== 'string' || !text.trim() || text.length > 50000) throw new Error('JWT를 50,000자 이내로 넣으세요.');
  const parts = text.trim().split('.');
  if (parts.length !== 3 || !/^[A-Za-z0-9_-]*$/.test(parts[2])) throw new Error('점으로 나눈 3부분 JWT만 지원합니다. 암호화된 JWE는 지원하지 않습니다.');
  const header = decodeJwtSegment(parts[0]), payload = decodeJwtSegment(parts[1]);
  let expiry = '';
  if (Object.hasOwn(payload,'exp')) {
    const date = typeof payload.exp === 'number' && Number.isFinite(payload.exp) ? new Date(payload.exp * 1000) : null;
    expiry = date && Number.isFinite(date.getTime()) ? date.toISOString() : 'exp 값이 올바른 날짜가 아닙니다.';
  }
  return {header,payload,expiry};
}
if (typeof module !== 'undefined') module.exports = { decodeJWT, decodeJwtSegment };

if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id); let version = 0;
  function clear() { version++; $('result').hidden = true; $('output').value = ''; $('summary').textContent = ''; $('error').textContent = ''; $('copy-status').textContent = ''; $('run').disabled = false; }
  $('converter').addEventListener('input', clear); $('converter').addEventListener('change', clear);
  async function runFromInputs() { const r=decodeJWT($('source').value);return {text:'헤더\n'+JSON.stringify(r.header,null,2)+'\n\n페이로드\n'+JSON.stringify(r.payload,null,2)+(r.expiry?'\n\nexp (UTC): '+r.expiry:''),summary:'서명·유효성 검증 안 함'}; }
  $('converter').addEventListener('submit', async event => { event.preventDefault(); clear(); const token = version; $('run').disabled = true; try { const r = await runFromInputs(); if (token !== version) return; $('output').value = r.text; $('summary').textContent = r.summary || ''; $('result').hidden = false; $('result').scrollIntoView({block:'nearest'}); } catch (error) { if (token === version) $('error').textContent = error.message; } finally { if (token === version) $('run').disabled = false; } });
  $('copy').addEventListener('click', async () => { if ($('result').hidden) return; const token = version; try { await navigator.clipboard.writeText($('output').value); if (token === version) $('copy-status').textContent = '복사했습니다.'; } catch { if (token !== version) return; $('output').focus(); $('output').select(); $('copy-status').textContent = '결과를 선택해 복사하세요.'; } });
}
