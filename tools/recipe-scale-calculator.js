'use strict';
function scaleRecipe(original, target, ingredients) {
  const numeric = value => typeof value === 'string' && !value.trim() ? NaN : Number(value);
  const from = numeric(original), to = numeric(target);
  if (![from, to].every(n => Number.isFinite(n) && n >= 0.1 && n <= 100000)) throw new Error('인분은 0.1부터 100,000 사이의 숫자로 입력하세요.');
  if (!Array.isArray(ingredients) || ingredients.length < 1 || ingredients.length > 20) throw new Error('재료는 1개부터 20개까지 입력하세요.');
  const factor = to / from;
  const items = ingredients.map((item, index) => {
    if (!item || typeof item.name !== 'string' || !item.name.trim() || item.name.length > 40) throw new Error((index + 1) + '번째 재료 이름을 40자 이내로 입력하세요.');
    const amount = numeric(item.amount);
    if (!Number.isFinite(amount) || amount < 0 || amount > 1e9) throw new Error((index + 1) + '번째 재료 양을 0부터 10억 사이로 입력하세요.');
    if (typeof item.unit !== 'string' || item.unit.length > 12) throw new Error((index + 1) + '번째 단위는 12자 이내로 입력하세요.');
    return { name: item.name.trim(), amount: amount * factor, unit: item.unit.trim() };
  });
  return { factor, original: from, target: to, items };
}
if (typeof module !== 'undefined') module.exports = { scaleRecipe };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id), rows = [];
  let nextID = 0, version = 0;
  const fmt = n => n.toLocaleString('ko-KR', { maximumFractionDigits: 6 });
  function clear() { version++; $('result').hidden = true; $('result-output').value = ''; $('error').textContent = ''; $('copy-status').textContent = ''; }
  function create(tag, text) { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; return node; }
  function updateRows() { $('add-ingredient').disabled = rows.length >= 20; $('ingredient-count').textContent = rows.length + '개 재료 · 최대 20개'; for (const row of rows) row.remove.disabled = rows.length === 1; }
  function addIngredient(values = {}) {
    if (rows.length >= 20) return;
    clear(); const id = ++nextID, box = create('fieldset'); box.append(create('legend', '재료 ' + id));
    function field(labelText, suffix, value, placeholder) {
      const wrap = create('div'), label = create('label', labelText), input = create('input');
      wrap.className = 'field'; input.id = 'ingredient-' + id + '-' + suffix; input.type = suffix === 'amount' ? 'number' : 'text';
      if (suffix === 'amount') { input.min = '0'; input.max = '1000000000'; input.step = 'any'; input.inputMode = 'decimal'; }
      input.value = value ?? ''; input.placeholder = placeholder; label.htmlFor = input.id; wrap.append(label, input); return { wrap, input };
    }
    const name = field('재료 이름', 'name', values.name, '예: 밀가루');
    const amount = field('원래 재료 양', 'amount', values.amount, '예: 500');
    const unit = field('단위 (선택)', 'unit', values.unit, '예: g, ml, 개');
    const fields = create('div'); fields.className = 'fields'; fields.append(amount.wrap, unit.wrap);
    const remove = create('button', '이 재료 삭제'); remove.type = 'button'; remove.className = 'secondary';
    box.append(name.wrap, fields, remove); const row = { box, name: name.input, amount: amount.input, unit: unit.input, remove }; rows.push(row); $('ingredients').append(box);
    remove.addEventListener('click', () => { if (rows.length <= 1) return; rows.splice(rows.indexOf(row), 1); box.remove(); clear(); updateRows(); }); updateRows();
  }
  $('recipe-form').addEventListener('input', clear); $('recipe-form').addEventListener('change', clear);
  $('add-ingredient').addEventListener('click', () => addIngredient());
  $('recipe-form').addEventListener('submit', event => {
    event.preventDefault(); clear();
    try {
      const result = scaleRecipe($('original-servings').value, $('target-servings').value, rows.map(row => ({ name: row.name.value, amount: row.amount.value, unit: row.unit.value })));
      $('result-value').textContent = fmt(result.factor) + '배';
      $('result-output').value = fmt(result.original) + '인분 → ' + fmt(result.target) + '인분\n' + result.items.map(item => item.name + ': ' + fmt(item.amount) + (item.unit ? ' ' + item.unit : '')).join('\n');
      $('result').hidden = false; $('result').scrollIntoView({ block: 'nearest' });
    } catch (error) { $('error').textContent = error.message; }
  });
  $('recipe-example')?.addEventListener('click', () => {
    rows.length = 0; $('ingredients').replaceChildren(); $('original-servings').value = '4'; $('target-servings').value = '2';
    for (const ingredient of [{ name: '밀가루', amount: '500', unit: 'g' }, { name: '우유', amount: '300', unit: 'ml' }, { name: '달걀', amount: '2', unit: '개' }]) addIngredient(ingredient);
    $('recipe-form').requestSubmit();
  });
  $('copy-result').addEventListener('click', async () => {
    if ($('result').hidden) return; const current = version;
    try { await navigator.clipboard.writeText($('result-output').value); if (current === version) $('copy-status').textContent = '재료 양을 복사했습니다.'; }
    catch { if (current !== version) return; $('copy-status').textContent = '결과 칸을 선택해 직접 복사하세요.'; $('result-output').focus(); $('result-output').select(); }
  }); addIngredient();
}
