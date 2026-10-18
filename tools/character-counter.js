'use strict';
function countText(raw) {
  const text = raw.replace(/\r\n?/g,'\n');
  const chars = Array.from(text);
  return {withSpaces:chars.length,withoutSpaces:chars.filter(char=>!(/\s/u.test(char))).length,
    bytes:new TextEncoder().encode(text).length,words:text.trim()?text.trim().split(/\s+/u).length:0,
    lines:text?text.split('\n').length:0,utf16:text.length};
}
if (typeof module !== 'undefined') module.exports = {countText};
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  let previous = '', timer;
  function update() {
    clearTimeout(timer);
    const counts = countText($('text').value);
    for (const key of Object.keys(counts)) $(key).textContent=counts[key].toLocaleString('ko-KR');
    const limit = Number($('limit').value), used = counts[$('limit-mode').value];
    if (!Number.isInteger(limit) || limit<1 || limit>1000000) {
      $('limit-status').textContent='목표 분량은 1~1,000,000 사이의 정수로 입력해 주세요.'; $('progress').hidden=true;
    } else {
      $('progress').hidden=false; $('progress').max=limit; $('progress').value=Math.min(used,limit);
      const unit=$('limit-mode').value==='bytes'?'바이트':'자';
      $('limit-status').textContent=`${used.toLocaleString('ko-KR')} / ${limit.toLocaleString('ko-KR')}${unit} · ${Math.abs(limit-used).toLocaleString('ko-KR')}${unit} ${used>limit?'초과':'남음'}`;
    }
    $('copy').disabled=!$('text').value; $('clear').disabled=!$('text').value;
  }
  $('text').addEventListener('input',() => { $('copy-status').textContent=''; clearTimeout(timer); timer=setTimeout(update,120); });
  $('limit').addEventListener('input',update); $('limit-mode').addEventListener('change',update);
  $('clear').addEventListener('click',() => {previous=$('text').value; $('text').value=''; $('undo').hidden=false; $('copy-status').textContent=''; update(); $('text').focus();});
  $('undo').addEventListener('click',() => {$('text').value=previous; previous=''; $('undo').hidden=true; update(); $('text').focus();});
  $('copy').addEventListener('click',async () => {
    try { await navigator.clipboard.writeText($('text').value); $('copy-status').textContent='입력한 글을 복사했습니다.'; }
    catch { $('copy-status').textContent='자동 복사를 사용할 수 없습니다. 입력창에서 글을 선택해 직접 복사해 주세요.'; }
  });
  update();
}
