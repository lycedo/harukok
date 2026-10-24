'use strict';
function calculatePercent(mode, a, b) {
  if (![a,b].every(n => Number.isFinite(n) && Math.abs(n) <= 1e12)) throw new Error('각 값은 -1조에서 1조 사이의 숫자로 입력해 주세요.');
  switch (mode) {
    case 'of': return {value:a*b/100};
    case 'ratio':
      if (b <= 0) throw new Error('전체 값은 0보다 커야 합니다.');
      return {value:a/b*100};
    case 'change':
      if (a <= 0) throw new Error('증감률의 기준이 되는 이전 값은 0보다 커야 합니다.');
      return {value:(b-a)/a*100, difference:b-a};
    case 'discount':
      if (a < 0 || b < 0 || b > 100) throw new Error('원가는 0 이상, 할인율은 0~100%로 입력해 주세요.');
      return {value:a*(1-b/100), saving:a*b/100};
    default: throw new Error('계산 종류를 선택해 주세요.');
  }
}
if (typeof module !== 'undefined') module.exports = {calculatePercent};
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  const modes = {
    of: ['전체 숫자','몇 %를 구할까요?','예: 200의 10%는 20입니다.','계산 결과',''],
    ratio: ['일부 숫자 (예: 30개)','전체 숫자 (예: 200개)','예: 200개 중 30개가 차지하는 비율','차지하는 비율','%'],
    change: ['바뀌기 전 숫자','바뀐 후 숫자','예: 3,000에서 3,300으로 바뀌었을 때의 증감률','증감률','%'],
    discount: ['할인 전 가격 (원)','몇 % 할인하나요?','예: 80,000원을 15% 할인한 최종 가격','할인 후 가격','원']
  };
  const fmt = n => n.toLocaleString('ko-KR',{maximumFractionDigits:6});
  function clearResult() { $('result').hidden = true; $('error').textContent = ''; }
  function changeMode() {
    const [a,b,hint] = modes[$('mode').value];
    $('label-a').textContent = a; $('label-b').textContent = b; $('mode-hint').textContent = hint;
    const examples={of:['200','10'],ratio:['30','200'],change:['3000','3300'],discount:['80000','15']};
    $('a').placeholder='예: '+examples[$('mode').value][0]; $('b').placeholder='예: '+examples[$('mode').value][1];
    document.querySelectorAll('[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===$('mode').value)));
    $('a').value = ''; $('b').value = ''; clearResult();
  }
  $('mode').addEventListener('change',changeMode);
  document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{ $('mode').value=button.dataset.mode; changeMode(); }));
  $('calculator').addEventListener('input',clearResult);
  $('calculator').addEventListener('submit',event => {
    event.preventDefault(); clearResult();
    try {
      if ($('a').value.trim() === '' || $('b').value.trim() === '') throw new Error('두 값을 모두 입력해 주세요.');
      const a = Number($('a').value), b = Number($('b').value), mode = $('mode').value;
      const result = calculatePercent(mode,a,b);
      $('result-label').textContent = modes[mode][3];
      $('result-value').textContent = fmt(result.value) + modes[mode][4];
      $('result-detail').textContent = mode === 'discount' ? '할인되는 금액: ' + fmt(result.saving) :
        mode === 'change' ? '차이: ' + fmt(result.difference) + (result.value < 0 ? ' · 감소' : result.value > 0 ? ' · 증가' : ' · 변동 없음') : '';
      $('formula').textContent = {
        of: `${fmt(a)} × ${fmt(b)} ÷ 100`, ratio: `${fmt(a)} ÷ ${fmt(b)} × 100`,
        change: `(${fmt(b)} − ${fmt(a)}) ÷ ${fmt(a)} × 100`, discount: `${fmt(a)} × (1 − ${fmt(b)} ÷ 100)`
      }[mode];
      $('result').hidden = false;
      $('result').scrollIntoView({block:'nearest'});
    } catch (error) { $('error').textContent = error.message; }
  });
  document.querySelectorAll('[data-example]').forEach(button => button.addEventListener('click',() => {
    const [mode,a,b] = button.dataset.example.split(',');
    $('mode').value = mode; changeMode(); $('a').value = a; $('b').value = b; $('calculator').requestSubmit();
  }));
}
