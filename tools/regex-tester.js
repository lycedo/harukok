'use strict';
function startRegexJob(payload, WorkerClass = Worker, timeoutMs = 750) {
  let worker, timer, done = false, rejectJob;
  const promise = new Promise((resolve, reject) => {
    rejectJob = reject;
    function finish(error, result) { if (done) return; done = true; clearTimeout(timer); if (worker) worker.terminate(); if (error) reject(error); else resolve(result); }
    try {
      if (typeof payload.pattern !== 'string' || payload.pattern.length > 2000 || typeof payload.text !== 'string' || payload.text.length > 20000) throw new Error('패턴은 2,000자, 검사할 글은 20,000자 이내로 입력하세요.');
      worker = new WorkerClass('/tools/regex-worker.js?v=20261103');
      worker.onmessage = event => { if (event.data && event.data.error) finish(new Error(event.data.error)); else if (event.data && event.data.result) finish(null, event.data.result); else finish(new Error('검사 결과를 읽지 못했습니다. 다시 실행하세요.')); };
      worker.onerror = () => finish(new Error('정규식 검사 작업을 시작하지 못했습니다. 최신 브라우저에서 다시 실행하세요.'));
      timer = setTimeout(() => finish(new Error('검사 시간이 0.75초를 넘어서 중단했습니다. 패턴이나 검사할 글을 줄이세요.')), timeoutMs);
      worker.postMessage(payload);
    } catch (error) { finish(error); }
  });
  return { promise, cancel() { if (done) return; done = true; clearTimeout(timer); if (worker) worker.terminate(); rejectJob(new Error('검사를 취소했습니다.')); } };
}
function regexResultText(result) {
  if (!result.matches.length) return '일치하는 부분이 없습니다.';
  return result.matches.map((match, index) => `${index + 1}. 위치 ${match.index} · ${JSON.stringify(match.value)}${match.groups.length ? '\n그룹: ' + JSON.stringify(match.groups) : ''}${match.named ? '\n이름 그룹: ' + JSON.stringify(match.named) : ''}`).join('\n\n') + (result.truncated ? '\n\n일치 결과가 많아 처음 200개만 표시합니다.' : '');
}
if (typeof module !== 'undefined') module.exports = { startRegexJob, regexResultText };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id); let version = 0, job = null;
  function clear() { version++; if (job) job.cancel(); job = null; $('result').hidden = true; $('output').value = ''; $('error').textContent = ''; $('copy-status').textContent = ''; $('run').disabled = false; $('run-status').textContent = ''; }
  $('converter').addEventListener('input', clear); $('converter').addEventListener('change', clear);
  $('converter').addEventListener('submit', async event => { event.preventDefault(); clear(); const token = version; try {
    if (!$('source').value.length) throw new Error('검사할 글을 입력하세요. 빈 패턴은 글자 사이의 빈 위치를 찾습니다.');
    if (typeof Worker === 'undefined') throw new Error('이 브라우저에서 별도 검사 작업을 사용할 수 없습니다. 최신 브라우저에서 사용하세요.');
    job = startRegexJob({ pattern: $('pattern').value, text: $('source').value, flags: $('flags').value.trim() }); $('run').disabled = true; $('run-status').textContent = '별도 작업에서 검사하고 있습니다.';
    const result = await job.promise; if (token !== version) return; job = null; $('run').disabled = false; $('run-status').textContent = `${result.matches.length}개 일치${result.truncated ? ' (처음 200개)' : ''}`; $('output').value = regexResultText(result); $('result').hidden = false; $('result').scrollIntoView({ block: 'nearest' });
  } catch (error) { if (token !== version) return; job = null; $('run').disabled = false; $('run-status').textContent = ''; $('error').textContent = error.message; } });
  $('example').addEventListener('click', () => { $('pattern').value = '(하루)(콕)'; $('source').value = '하루콕에서 배우는 정규식, 하루콕!'; $('flags').value = 'g'; $('converter').requestSubmit(); });
  $('copy').addEventListener('click', async () => { if ($('result').hidden) return; const token = version; try { await navigator.clipboard.writeText($('output').value); if (token === version) $('copy-status').textContent = '검사 결과를 복사했습니다.'; } catch { if (token !== version) return; $('output').focus(); $('output').select(); $('copy-status').textContent = '결과 칸의 글을 선택해 직접 복사하세요.'; } });
  window.addEventListener('pagehide', clear);
}
