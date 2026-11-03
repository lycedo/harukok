'use strict';
const GPA_SCALES = {
  '4.5': { 'A+': 4.5, A: 4, 'B+': 3.5, B: 3, 'C+': 2.5, C: 2, 'D+': 1.5, D: 1, F: 0, P: null },
  '4.3': { 'A+': 4.3, A: 4, 'A-': 3.7, 'B+': 3.3, B: 3, 'B-': 2.7, 'C+': 2.3, C: 2, 'C-': 1.7, 'D+': 1.3, D: 1, 'D-': 0.7, F: 0, P: null }
};
function calculateGPA(courses, scale) {
  const grades = Object.hasOwn(GPA_SCALES, scale) ? GPA_SCALES[scale] : null;
  if (!grades) throw new Error('4.5 또는 4.3 만점을 선택해 주세요.');
  if (!Array.isArray(courses) || courses.length < 1 || courses.length > 30) throw new Error('과목은 1개부터 30개까지 입력해 주세요.');
  let creditHalves = 0, weightedTenths = 0, excludedCount = 0;
  courses.forEach((course, index) => {
    if (!course || typeof course !== 'object') throw new Error((index + 1) + '번째 과목을 확인해 주세요.');
    const credit = !['number', 'string'].includes(typeof course.credits) || (typeof course.credits === 'string' && !course.credits.trim()) ? NaN : Number(course.credits);
    if (!Number.isFinite(credit) || credit < 0.5 || credit > 10 || !Number.isInteger(credit * 2)) throw new Error((index + 1) + '번째 과목의 학점을 0.5~10 사이에서 0.5 단위로 입력해 주세요.');
    if (!Object.hasOwn(grades, course.grade)) throw new Error((index + 1) + '번째 과목의 성적을 선택해 주세요.');
    const points = grades[course.grade];
    if (points === null) { excludedCount++; return; }
    creditHalves += credit * 2;
    weightedTenths += Math.round(points * 10) * credit * 2;
  });
  if (!creditHalves) throw new Error('P를 제외하고 평균에 반영할 과목이 한 개 이상 필요합니다.');
  return { gpa: weightedTenths / (creditHalves * 10), includedCredits: creditHalves / 2,
    weightedPoints: weightedTenths / 20, includedCount: courses.length - excludedCount, excludedCount };
}
if (typeof module !== 'undefined') module.exports = { GPA_SCALES, calculateGPA };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  const rows = [];
  let nextID = 0, version = 0;
  function clear() { version++; $('result').hidden = true; $('result-text').value = ''; $('error').textContent = ''; $('copy-status').textContent = ''; }
  function element(tag, text) { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; return node; }
  function updateGrades(select, previous) {
    select.replaceChildren();
    const empty = element('option', '성적 선택'); empty.value = ''; select.append(empty);
    for (const [grade, points] of Object.entries(GPA_SCALES[$('scale').value])) {
      const option = element('option', grade === 'P' ? 'P — 평균에서 제외' : grade + ' (' + points.toFixed(1) + ')');
      option.value = grade; select.append(option);
    }
    select.value = Object.hasOwn(GPA_SCALES[$('scale').value], previous) ? previous : '';
  }
  function updateRows() {
    $('add-course').disabled = rows.length >= 30;
    $('course-count').textContent = rows.length + '개 과목 · 최대 30개';
    for (const row of rows) row.remove.disabled = rows.length === 1;
  }
  function addCourse() {
    if (rows.length >= 30) return;
    clear();
    const id = ++nextID, box = element('fieldset'); box.id = 'course-' + id;
    box.append(element('legend', '과목 ' + id));
    function field(labelText, node, suffix) {
      const field = element('div'); field.className = 'field';
      const label = element('label', labelText); node.id = 'course-' + id + '-' + suffix; label.htmlFor = node.id; field.append(label, node); return field;
    }
    const name = element('input'); name.type = 'text'; name.maxLength = 100; name.placeholder = '예: 수학 (선택)';
    const credits = element('input'); credits.type = 'number'; credits.min = '0.5'; credits.max = '10'; credits.step = '0.5'; credits.value = '3'; credits.inputMode = 'decimal';
    const grade = element('select'); updateGrades(grade, 'A');
    const fields = element('div'); fields.className = 'fields'; fields.append(field('학점', credits, 'credits'), field('성적', grade, 'grade'));
    const remove = element('button', '이 과목 삭제'); remove.type = 'button'; remove.className = 'secondary';
    box.append(field('과목 이름 (선택)', name, 'name'), fields, remove);
    const row = { box, name, credits, grade, remove }; rows.push(row); $('courses').append(box);
    remove.addEventListener('click', () => { if (rows.length <= 1) return; rows.splice(rows.indexOf(row), 1); box.remove(); clear(); updateRows(); });
    updateRows();
  }
  $('calculator').addEventListener('input', clear); $('calculator').addEventListener('change', clear);
  $('scale').addEventListener('change', () => { for (const row of rows) updateGrades(row.grade, row.grade.value); clear(); });
  $('add-course').addEventListener('click', addCourse);
  $('calculator').addEventListener('submit', event => {
    event.preventDefault(); clear();
    try {
      const r = calculateGPA(rows.map(row => ({ credits: row.credits.value, grade: row.grade.value })), $('scale').value);
      const f = value => value.toLocaleString('ko-KR', { maximumFractionDigits: 6 });
      $('result-value').textContent = f(r.gpa) + ' / ' + $('scale').value;
      $('result-detail').textContent = '반영 ' + r.includedCount + '과목 · ' + f(r.includedCredits) + '학점 · P ' + r.excludedCount + '과목 제외';
      $('result-text').value = '학점 평균: ' + f(r.gpa) + ' (' + $('scale').value + ' 만점)\n' + $('result-detail').textContent + '\n학점×평점 합계: ' + f(r.weightedPoints);
      $('result').hidden = false; $('result').scrollIntoView({ block: 'nearest' });
    } catch (error) { $('error').textContent = error.message; }
  });
  $('copy').addEventListener('click', async () => {
    const current = version, text = $('result-text').value;
    if ($('result').hidden || !text) return;
    try { await navigator.clipboard.writeText(text); if (current === version) $('copy-status').textContent = '결과를 복사했습니다.'; }
    catch { if (current !== version) return; $('copy-status').textContent = '결과 칸의 글을 선택해 직접 복사해 주세요.'; $('result-text').focus(); $('result-text').select(); }
  });
  addCourse();
}
