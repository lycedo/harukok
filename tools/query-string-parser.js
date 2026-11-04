'use strict';
function parseQueryString(text) {
  if (typeof text !== 'string' || !text.trim() || text.length > 100000) throw new Error('URL이나 쿼리를 100,000자 이내로 넣으세요.');
  let query = text.trim();
  if (/^[a-zA-Z][\w+.-]*:\/\//.test(query)) {
    let url; try { url = new URL(query); } catch { throw new Error('URL 형식을 확인하세요.'); }
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('http 또는 https URL만 지원합니다.');
    query = url.search.slice(1);
  } else query = query.replace(/^\?/, '').split('#')[0];
  if (/%(?![\da-fA-F]{2})/.test(query)) throw new Error('% 뒤에 두 자리 16진수를 넣으세요.');
  try { for (const part of query.split('&')) for (const value of part.split('=')) decodeURIComponent(value.replace(/\+/g, ' ')); } catch { throw new Error('UTF-8 퍼센트 인코딩이 올바르지 않습니다.'); }
  const entries = [...new URLSearchParams(query)].map(([key, value]) => ({ key, value }));
  if (entries.length > 2000) throw new Error('항목은 최대 2,000개입니다.');
  return entries;
}
if (typeof module !== 'undefined') module.exports = { parseQueryString };

if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id); let version = 0;
  function clear() { version++; $('result').hidden = true; $('output').value = ''; $('summary').textContent = ''; $('error').textContent = ''; $('copy-status').textContent = ''; $('run').disabled = false; }
  $('converter').addEventListener('input', clear); $('converter').addEventListener('change', clear);
  async function runFromInputs() { const entries=parseQueryString($('source').value);return {text:JSON.stringify(entries,null,2),summary:entries.length+'개 항목'}; }
  $('converter').addEventListener('submit', async event => { event.preventDefault(); clear(); const token = version; $('run').disabled = true; try { const r = await runFromInputs(); if (token !== version) return; $('output').value = r.text; $('summary').textContent = r.summary || ''; $('result').hidden = false; $('result').scrollIntoView({block:'nearest'}); } catch (error) { if (token === version) $('error').textContent = error.message; } finally { if (token === version) $('run').disabled = false; } });
  $('copy').addEventListener('click', async () => { if ($('result').hidden) return; const token = version; try { await navigator.clipboard.writeText($('output').value); if (token === version) $('copy-status').textContent = '복사했습니다.'; } catch { if (token !== version) return; $('output').focus(); $('output').select(); $('copy-status').textContent = '결과를 선택해 복사하세요.'; } });
}
