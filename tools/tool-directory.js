'use strict';
(() => {
  const search = document.getElementById('tool-search');
  const filters = [...document.querySelectorAll('[data-category-filter]')];
  const groups = [...document.querySelectorAll('[data-tool-group]')];
  const status = document.getElementById('directory-status');
  const empty = document.getElementById('empty-search');
  const reset = document.getElementById('reset-search');
  const featured = document.getElementById('featured-tools');
  let category = 'all';
  const normalize = value => value.normalize('NFC').toLocaleLowerCase('ko').replace(/\s+/g, '');

  function update() {
    const query = normalize(search.value.trim());
    let count = 0;
    for (const group of groups) {
      let matches = 0;
      for (const item of group.querySelectorAll('li')) {
        const text = normalize(item.textContent + ' ' + (item.dataset.keywords || ''));
        const visible = (category === 'all' || group.dataset.toolGroup === category) && text.includes(query);
        item.hidden = !visible;
        if (visible) matches++;
      }
      group.hidden = matches === 0;
      count += matches;
    }
    for (const button of filters) button.setAttribute('aria-pressed', String(button.dataset.categoryFilter === category));
    const selected = filters.find(button => button.dataset.categoryFilter === category);
    status.textContent = query ? `검색 결과 ${count}개` : category !== 'all' ? `${selected.textContent} 도구 ${count}개` : `전체 도구 ${count}개`;
    featured.hidden = Boolean(query) || category !== 'all';
    empty.hidden = count !== 0;
    reset.hidden = !query && category === 'all';
  }
  function clear() {
    search.value = '';
    category = 'all';
    update();
    search.focus();
  }
  search.addEventListener('input', () => { category = 'all'; update(); });
  search.addEventListener('keydown', event => { if (event.key === 'Escape') clear(); });
  for (const button of filters) button.addEventListener('click', () => { search.value = ''; category = button.dataset.categoryFilter; update(); });
  reset.addEventListener('click', clear);
  document.getElementById('show-all-tools').addEventListener('click', clear);
  document.getElementById('empty-reset').addEventListener('click', clear);
  document.getElementById('directory-controls').hidden = false;
  update();
})();
