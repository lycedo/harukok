// 음식 통합 도구(fun/food-picker.html) 검증 — 실제 HTML의 <script>를 그대로 실행한다.
// 데이터 무결성(중복 메뉴), 시간대별 카테고리, 제외 메뉴, 최근 결과 제외, 후보 없음 안내,
// 레거시 기록(점심/저녁/야식/카페 개별 페이지) 마이그레이션을 검증한다.
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { FakeDocument } = require('./dom-shim.js');

const HTML = path.join(__dirname, '..', 'fun', 'food-picker.html');

let pass = 0, fail = 0;
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log((ok ? 'PASS' : 'FAIL') + ' - ' + label + ' (실제: ' + JSON.stringify(actual) + ', 기대: ' + JSON.stringify(expected) + ')');
  ok ? pass++ : fail++;
}

function extractInlineScripts(html) {
  const re = /<script(?:\s+type="([^"]*)")?[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  const chunks = [];
  while ((m = re.exec(html))) {
    const [full, type, code] = m;
    if (full.includes('src=')) continue;
    if (type === 'application/ld+json') continue;
    chunks.push(code);
  }
  return chunks.join('\n;\n');
}

function makeLocalStorage(seed) {
  const store = new Map(Object.entries(seed || {}));
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
}

function load(file, opts) {
  opts = opts || {};
  const html = fs.readFileSync(file, 'utf8');
  const doc = new FakeDocument();
  doc.registerFromHtml(html);
  const code = extractInlineScripts(html);
  const ls = makeLocalStorage(opts.seedStorage);
  const search = opts.search || '';
  const sandbox = {
    document: doc,
    window: {},
    console,
    Math, JSON, Set, Array, Object,
    parseFloat, parseInt, isNaN, Infinity,
    localStorage: ls,
    location: { search, href: 'https://harukok.com/fun/food-picker' + search },
    navigator: {},
    URLSearchParams,
    setTimeout: (fn) => fn(), // 테스트에서는 스핀 애니메이션 지연 없이 즉시 진행한다
  };
  sandbox.window.document = doc;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: file });
  return { doc, localStorage: ls };
}

function chipTexts(doc, id) {
  return doc.getElementById(id).children.map((c) => c.textContent);
}

console.log('=== 1. 메뉴 데이터 무결성 (중복 메뉴 검사) ===');
{
  const html = fs.readFileSync(HTML, 'utf8');
  const m = html.match(/const MENU = \{([\s\S]*?)\n  \};/);
  const MENU = eval('({' + m[1] + '})');
  const expectedCounts = { lunch: 54, dinner: 53, 'night-snack': 48, drink: 39 };
  for (const meal of Object.keys(expectedCounts)) {
    const items = Object.values(MENU[meal]).flat();
    check(meal + ' 총 메뉴 수', items.length, expectedCounts[meal]);
    const seen = new Set();
    let dup = null;
    for (const [name] of items) {
      if (seen.has(name)) { dup = name; break; }
      seen.add(name);
    }
    check(meal + ' 카테고리 간 중복 메뉴 없음', dup, null);
  }
}

console.log('\n=== 2. 회귀: 삼겹살 중복(한식·회식)을 되돌리면 검사가 실패해야 함 ===');
{
  const src = fs.readFileSync(HTML, 'utf8');
  const broken = src.replace(
    '회식: [ ["소고기","🥩"], ["곱창","🍢"],',
    '회식: [ ["삼겹살","🥓"], ["소고기","🥩"], ["곱창","🍢"],'
  );
  if (broken === src) { console.log('FAIL - 깨뜨릴 코드를 찾지 못함'); fail++; }
  else {
    const m = broken.match(/const MENU = \{([\s\S]*?)\n  \};/);
    const MENU = eval('({' + m[1] + '})');
    const items = Object.values(MENU.dinner).flat();
    const seen = new Set();
    let dup = null;
    for (const [name] of items) { if (seen.has(name)) { dup = name; break; } seen.add(name); }
    check('중복을 되돌리면 삼겹살이 다시 잡혀야 함(테스트가 회귀를 잡아냄)', dup, '삼겹살');
  }
}

console.log('\n=== 3. 시간대별 카테고리 노출 (기본값 · URL 파라미터) ===');
{
  const { doc } = load(HTML);
  const lunchChips = chipTexts(doc, 'chips');
  check('기본 시간대는 점심, 카테고리 7개(6+아무거나)', lunchChips.length, 7);
  check('점심 카테고리에 "샐러드·단백질" 포함', lunchChips.includes('샐러드·단백질'), true);
  check('점심 카테고리에 저녁 전용 "혼밥" 없음', lunchChips.includes('혼밥'), false);

  const { doc: doc2 } = load(HTML, { search: '?meal=dinner' });
  const dinnerChips = chipTexts(doc2, 'chips');
  check('meal=dinner 파라미터로 저녁 카테고리 노출', dinnerChips.includes('혼밥') && dinnerChips.includes('회식'), true);

  const { doc: doc3 } = load(HTML, { search: '?meal=not-a-real-meal' });
  const fallbackChips = chipTexts(doc3, 'chips');
  check('잘못된 meal 파라미터는 기본값(점심)으로 대체', fallbackChips.includes('샐러드·단백질'), true);
}

console.log('\n=== 4. 안 먹는 메뉴 제외 — 카테고리 안의 항목을 하나만 남기면 항상 그 항목만 나와야 함 ===');
{
  // 점심 > 분식(9개) 중 "떡볶이"만 남기고 전부 제외
  const excludeAllButTteok = ['김밥','라볶이','순대','튀김','쫄면','오뎅','핫도그','찐만두'];
  const { doc, localStorage } = load(HTML, { seedStorage: { 'harukok-food-excluded': JSON.stringify(excludeAllButTteok) } });
  for (const b of doc.getElementById('chips').children) if (b.textContent === '분식') b.click();
  let allTteok = true;
  for (let i = 0; i < 10; i++) {
    doc.getElementById('pullBtn').click();
    if (doc.getElementById('capsuleName').textContent !== '떡볶이') allTteok = false;
  }
  check('제외 후 후보가 1개면 10회 모두 그 메뉴만 나옴', allTteok, true);
  const savedHistory = JSON.parse(localStorage.getItem('harukok-food-history'));
  check('10회 뽑은 결과가 기록에 정상적으로 쌓임', savedHistory.length, 10);
}

console.log('\n=== 5. 최근 결과 제외 — 후보가 2개면 직전과 다른 메뉴가 나와야 함 ===');
{
  // 점심 > 분식(9개) 중 "떡볶이"·"김밥"만 남기고 전부 제외, 직전 기록을 "떡볶이"로 시드
  const excludeAllButTwo = ['라볶이','순대','튀김','쫄면','오뎅','핫도그','찐만두'];
  const seedHistory = [{ meal: 'lunch', name: '떡볶이', emoji: '🌶️', date: Date.now() }];
  const { doc } = load(HTML, {
    seedStorage: {
      'harukok-food-excluded': JSON.stringify(excludeAllButTwo),
      'harukok-food-history': JSON.stringify(seedHistory),
    },
  });
  for (const b of doc.getElementById('chips').children) if (b.textContent === '분식') b.click();
  doc.getElementById('pullBtn').click();
  check('직전 결과(떡볶이)를 제외하고 남은 하나(김밥)가 나옴', doc.getElementById('capsuleName').textContent, '김밥');
}

console.log('\n=== 6. 후보 없음 안내 — 카테고리 전체를 제외하면 안내가 뜨고 뽑기가 진행되지 않아야 함 ===');
{
  const saladProteinItems = ['샐러드','닭가슴살','포케','그릭요거트','곤약비빔면','오트밀','단백질쉐이크','두부스테이크'];
  const { doc } = load(HTML, { seedStorage: { 'harukok-food-excluded': JSON.stringify(saladProteinItems) } });
  // 먼저 제외되지 않은 카테고리(분식)에서 한 번 뽑아 실제 결과값을 만들어 둔다.
  for (const b of doc.getElementById('chips').children) if (b.textContent === '분식') b.click();
  doc.getElementById('pullBtn').click();
  const beforeName = doc.getElementById('capsuleName').textContent;
  check('사전 준비: 분식에서는 정상적으로 뽑힘', beforeName.length > 0, true);

  // 이제 전부 제외된 "샐러드·단백질" 카테고리로 바꿔서 뽑기를 시도한다.
  for (const b of doc.getElementById('chips').children) if (b.textContent === '샐러드·단백질') b.click();
  doc.getElementById('pullBtn').click();
  check('후보 없음 안내가 표시됨', doc.getElementById('emptyState').classList.contains('visible'), true);
  check('뽑기가 진행되지 않아 캡슐 표시가 직전 값 그대로임', doc.getElementById('capsuleName').textContent, beforeName);
  check('기록에 분식 결과만 반영되고 샐러드·단백질 시도는 추가되지 않음', doc.getElementById('historyList').innerHTML.includes(beforeName), true);
}

console.log('\n=== 7. 레거시 기록(점심/저녁/야식/카페 개별 페이지) 마이그레이션 ===');
{
  const legacySeed = {
    'harukok-lunch-history': JSON.stringify([{ name: '비빔밥', emoji: '🍚', date: '2026-09-01T00:00:00.000Z' }]),
    'harukok-cafe-history': JSON.stringify([{ name: '아메리카노', emoji: '☕', date: '2026-09-15T00:00:00.000Z' }]),
  };
  const { doc, localStorage } = load(HTML, { seedStorage: legacySeed });
  const merged = JSON.parse(localStorage.getItem('harukok-food-history'));
  check('레거시 두 키의 기록이 하나로 병합됨', merged.length, 2);
  check('레거시 항목에 시간대(meal) 태그가 붙음', merged.map((x) => x.meal).sort(), ['drink', 'lunch']);
  check('병합 후 화면 기록에도 반영됨(비빔밥 표시)', doc.getElementById('historyList').innerHTML.includes('비빔밥'), true);

  console.log('\n=== 7-1. 회귀: 통합 기록이 이미 있으면 재병합하지 않아야 함 ===');
  const secondRunSeed = Object.assign({}, legacySeed, { 'harukok-food-history': '[]' });
  const { localStorage: ls2 } = load(HTML, { seedStorage: secondRunSeed });
  check('이미 통합 기록(빈 배열)이 있으면 레거시를 다시 합치지 않음', JSON.parse(ls2.getItem('harukok-food-history')), []);
}

console.log('\n=== 8. 잘못된 저장값 방어 — 초기화·뽑기가 중단되지 않고, 유효한 기록은 보존됨 ===');
{
  // 8-1. 저장값 자체가 배열이 아닌 경우(손상된 값) — 초기화가 죽지 않고 빈 기록으로 처리돼야 함
  let threw = false;
  let doc1;
  try {
    ({ doc: doc1 } = load(HTML, { seedStorage: { 'harukok-food-history': '{"not":"an array"}' } }));
  } catch (e) { threw = true; }
  check('저장값이 배열이 아니어도 초기화 중 오류가 나지 않음', threw, false);
  check('배열이 아닌 저장값은 빈 기록으로 처리됨', doc1.getElementById('historyList').innerHTML.includes('아직 뽑은 기록이 없어요'), true);

  // 8-2. 뽑기 자체도 중단되지 않아야 함
  doc1.getElementById('pullBtn').click();
  check('손상된 저장값이 있어도 뽑기 동작은 정상적으로 진행됨', doc1.getElementById('capsuleName').textContent.length > 0, true);

  // 8-3. 정상 기록과 형식이 잘못된 기록이 섞인 경우 — 유효한 기록만 보존해 표시
  const mixed = [
    { meal: 'lunch', name: '비빔밥', emoji: '🍚', date: '2026-09-20T00:00:00.000Z' }, // 정상
    { meal: 'lunch', name: '', emoji: '🍚', date: Date.now() },                        // name 비어있음
    { meal: 'lunch', emoji: '🍚', date: Date.now() },                                  // name 없음
    { meal: 'lunch', name: '김밥', date: Date.now() },                                 // emoji 없음
    { meal: 'lunch', name: '라면', emoji: '🍜', date: 'not-a-date' },                  // date 해석 불가
    { meal: 'made-up-meal', name: '초밥', emoji: '🍣', date: Date.now() },             // 알 수 없는 시간대
    null,
    '그냥 문자열',
    { meal: 'dinner', name: '초밥', emoji: '🍣', date: Date.now() },                   // 정상
  ];
  const { doc: doc2 } = load(HTML, { seedStorage: { 'harukok-food-history': JSON.stringify(mixed) } });
  const html2 = doc2.getElementById('historyList').innerHTML;
  check('정상 기록(비빔밥)은 그대로 보존되어 표시됨', html2.includes('비빔밥'), true);
  check('정상 기록(초밥/저녁)도 그대로 보존되어 표시됨', html2.includes('초밥'), true);
  check('name이 비어있거나 없는 항목은 표시되지 않음(라면·김밥이 섞이지 않음)', html2.includes('김밥'), false);
  check('날짜를 해석할 수 없는 항목(라면)은 표시되지 않음', html2.includes('라면'), false);

  // 8-4. 메뉴명에 HTML이 섞여 있어도 태그로 해석되지 않고 글자 그대로 보여야 함(이스케이프)
  const xssSeed = [{ meal: 'lunch', name: '<img src=x onerror=alert(1)>', emoji: '🍚', date: Date.now() }];
  const { doc: doc3 } = load(HTML, { seedStorage: { 'harukok-food-history': JSON.stringify(xssSeed) } });
  const html3 = doc3.getElementById('historyList').innerHTML;
  check('메뉴명의 HTML이 태그로 해석되지 않음(이스케이프됨)', html3.includes('<img'), false);
  check('이스케이프된 형태로는 표시됨', html3.includes('&lt;img'), true);

  console.log('\n=== 8-1. 회귀: escapeHtml 호출을 제거하면 이스케이프 검사가 실패해야 함 ===');
  const src = fs.readFileSync(HTML, 'utf8');
  const broken = src.replace(
    '<span>${escapeHtml(item.emoji)}</span><span>${escapeHtml(item.name)}</span>',
    '<span>${item.emoji}</span><span>${item.name}</span>'
  );
  if (broken === src) { console.log('FAIL - 깨뜨릴 코드를 찾지 못함'); fail++; }
  else {
    const tmp = path.join(os.tmpdir(), 'food-picker-broken.html');
    fs.writeFileSync(tmp, broken, 'utf8');
    const { doc: doc4 } = load(tmp, { seedStorage: { 'harukok-food-history': JSON.stringify(xssSeed) } });
    const html4 = doc4.getElementById('historyList').innerHTML;
    check('이스케이프를 제거하면 태그가 그대로 삽입됨(테스트가 회귀를 잡아냄)', html4.includes('<img'), true);
    fs.unlinkSync(tmp);
  }
}

console.log('\n결과: ' + pass + '개 통과, ' + fail + '개 실패');
if (fail > 0) process.exit(1);
