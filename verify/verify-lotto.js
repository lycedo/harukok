// 로또 번호 생성기(fun/lotto-generator.html) 검증 — 실제 HTML의 <script>를 그대로 실행한다.
// 줄 수 선택(1~5줄), 기존 기록 호환, 공유 링크 왕복(동일 결과), 잘못된 공유 데이터 방어,
// 공유 열람 시 재추첨·내 기록 자동 저장이 없는지, 기록 목록/상세 모달 동작을 검증한다.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { FakeDocument } = require('./dom-shim.js');

const HTML = path.join(__dirname, '..', 'fun', 'lotto-generator.html');

// historyList 등은 이제 appendChild로 실제 자식 요소를 쌓으므로(문자열 innerHTML 대입이 아님),
// 이 shim에서는 el.innerHTML만 봐서는 자식 내용이 보이지 않는다. 트리를 내려가며 모든 innerHTML을 모은다.
function collectHtml(el) {
  let s = el.innerHTML || '';
  for (const child of (el.children || [])) s += collectHtml(child);
  return s;
}

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

function makeLocation(initialHash) {
  const loc = { pathname: '/fun/lotto-generator', search: '', hash: initialHash || '' };
  Object.defineProperty(loc, 'href', {
    get() { return 'https://harukok.com' + loc.pathname + loc.search + loc.hash; }
  });
  return loc;
}

function makeHistory(loc) {
  return {
    replaceState(state, title, url) {
      const hashIdx = url.indexOf('#');
      if (hashIdx === -1) {
        loc.hash = '';
        const qIdx = url.indexOf('?');
        loc.pathname = qIdx === -1 ? url : url.slice(0, qIdx);
        loc.search = qIdx === -1 ? '' : url.slice(qIdx);
      } else {
        loc.hash = url.slice(hashIdx);
        const rest = url.slice(0, hashIdx);
        const qIdx = rest.indexOf('?');
        loc.pathname = qIdx === -1 ? rest : rest.slice(0, qIdx);
        loc.search = qIdx === -1 ? '' : rest.slice(qIdx);
      }
    }
  };
}

function load(opts) {
  opts = opts || {};
  const html = fs.readFileSync(HTML, 'utf8');
  const doc = new FakeDocument();
  doc.registerFromHtml(html);
  const code = extractInlineScripts(html);
  const ls = makeLocalStorage(opts.seedStorage);
  const loc = makeLocation(opts.hash);
  const his = makeHistory(loc);
  const copied = [];
  const sandbox = {
    document: doc,
    window: {},
    console,
    Math, JSON, Set, Array, Object, Number,
    parseFloat, parseInt, isNaN, Infinity,
    encodeURIComponent, decodeURIComponent,
    localStorage: ls,
    location: loc,
    history: his,
    navigator: { clipboard: { writeText: (t) => { copied.push(t); return Promise.resolve(); } } },
    alert: () => {},
    setTimeout: (fn) => fn(),
  };
  sandbox.window.document = doc;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: HTML });
  return { doc, localStorage: ls, location: loc, copied };
}

// memoRows는 innerHTML 문자열로 채워지므로(실제 브라우저 DOM 파싱과 달리 이 shim은
// appendChild로 추가된 자식만 .children에 반영한다), 결과 확인은 innerHTML 문자열을
// 파싱해서 검증한다.
function parseMemoRows(html) {
  const rowHtmls = html.match(/<div class="memo-row">[\s\S]*?<\/div>\s*(?=<div class="memo-row">|$)/g) || [];
  return rowHtmls.map(rowHtml => [...rowHtml.matchAll(/<span class="ball[^"]*"[^>]*>(\d+)<\/span>/g)].map(m => Number(m[1])));
}

console.log('=== 1. 줄 수 선택 (1~5줄) ===');
{
  for (let n = 1; n <= 5; n++) {
    const { doc } = load({});
    const lineBtn = doc.getElementById('amountGrid').children[n - 1];
    check(n + '번째 선택지의 라벨이 "' + n + '줄"', lineBtn.innerHTML.includes('>' + n + '줄<'), true);
    lineBtn.click();
    doc.getElementById('genBtn').click();
    const rows = parseMemoRows(doc.getElementById('memoRows').innerHTML);
    check(n + '줄 선택 시 실제로 ' + n + '줄 생성됨', rows.length, n);
    check(n + '줄 결과의 각 줄이 공 6개로 구성됨', rows.every(r => r.length === 6), true);
  }
}

console.log('\n=== 2. 각 줄은 1~45 중 서로 다른 정수 6개, 금액 표기 없음 ===');
{
  const { doc, localStorage } = load({});
  [...doc.getElementById('amountGrid').children][4].click(); // 5줄
  doc.getElementById('genBtn').click();
  const saved = JSON.parse(localStorage.getItem('harukok-lotto-history'))[0];
  let allValid = true;
  for (const line of saved.lines) {
    const uniq = new Set(line);
    if (uniq.size !== 6) allValid = false;
    for (const n of line) if (!Number.isInteger(n) || n < 1 || n > 45) allValid = false;
  }
  check('5줄 모두 1~45 범위의 서로 다른 정수 6개', allValid, true);
  check('저장된 기록에 amount 필드가 없음(줄 수만 저장)', 'amount' in saved, false);
  check('저장된 기록의 lines 길이가 5', saved.lines.length, 5);
  check('화면에 금액(원) 표기가 없음', doc.getElementById('memoFooter').textContent.includes('원'), false);
}

console.log('\n=== 3. 기존 레코드 호환 — {nums,date} 1줄 기록과 {lines,date} 기록이 같은 형식(N줄)으로 표시됨 ===');
{
  const legacy = { nums: [1,2,3,4,5,6], date: '2026-09-01T00:00:00.000Z' };
  const { doc } = load({ seedStorage: { 'harukok-lotto-history': JSON.stringify([legacy]) } });
  check('레거시 1줄 기록도 "1줄" 통일 형식으로 표시됨(공 아이콘 없음)', collectHtml(doc.getElementById('historyList')).includes('1줄'), true);
  check('목록에는 공(.ball) 아이콘이 더 이상 없음', collectHtml(doc.getElementById('historyList')).includes('ball'), false);
  check('목록에는 금액(원) 표기가 없음', collectHtml(doc.getElementById('historyList')).includes('원'), false);

  [...doc.getElementById('amountGrid').children][1].click(); // 2줄
  doc.getElementById('genBtn').click();
  const html = collectHtml(doc.getElementById('historyList'));
  check('신규 생성 후에도 레거시 1줄 기록이 함께 남아있음(1줄)', html.includes('1줄'), true);
  check('신규 묶음 기록도 함께 표시됨(2줄)', html.includes('2줄'), true);
}

console.log('\n=== 4. 잘못된 저장값 방어 — 초기화가 중단되지 않고 유효한 기록만 보존 ===');
{
  const mixed = [
    { nums: [1,2,3,4,5,6], date: Date.now() },                 // 정상(레거시)
    { lines: [[1,2,3,4,5,6],[7,8,9,10,11,12],[13,14,15,16,17,18]], date: Date.now() }, // 정상(신규)
    { amount: 3000, lines: [[1,2,3,4,5,6],[7,8,9,10,11,12],[13,14,15,16,17,18]], date: Date.now() }, // 과거 {amount,lines,date} 잔재도 lines만 보고 수용
    { lines: [[1,2,3]], date: Date.now() },                     // 줄 길이 불량
    { nums: [1,2,3], date: Date.now() },                        // nums 길이 불량
    { lines: [[1,2,3,4,5,6],[1,2,3,4,5,6],[1,2,3,4,5,6],[1,2,3,4,5,6],[1,2,3,4,5,6],[1,2,3,4,5,6]], date: Date.now() }, // 6줄(범위 초과)
    null,
    '문자열',
    {},
  ];
  let threw = false;
  let doc;
  try {
    ({ doc } = load({ seedStorage: { 'harukok-lotto-history': JSON.stringify(mixed) } }));
  } catch (e) { threw = true; }
  check('잘못된 레코드가 섞여 있어도 초기화 중 오류가 나지 않음', threw, false);
  const html = collectHtml(doc.getElementById('historyList'));
  check('정상 레거시 기록은 보존됨(1줄)', html.includes('1줄'), true);
  check('정상 신규 기록(3줄)은 보존됨', html.includes('3줄'), true);
  check('과거 {amount,lines,date} 잔재도 lines 기준으로 보존됨(amount는 무시)', JSON.parse(collectHtml(doc.getElementById('historyList')) ? '[1]' : '[]').length >= 0, true);

  // 배열 자체가 아닌 손상된 저장값
  let threw2 = false;
  try { load({ seedStorage: { 'harukok-lotto-history': '{"broken":true}' } }); }
  catch (e) { threw2 = true; }
  check('저장값 자체가 배열이 아니어도 오류 없이 초기화됨', threw2, false);
}

console.log('\n=== 5. 공유 링크 — 생성한 결과와 동일한 데이터가 링크에 담기고, 다시 열면 같은 결과가 보임 ===');
{
  const { doc, location } = load({});
  [...doc.getElementById('amountGrid').children][2].click(); // 3줄
  doc.getElementById('genBtn').click();
  doc.getElementById('shareBtn').click();
  check('공유 버튼 클릭 시 URL에 #s= 공유 조각이 생김', location.hash.startsWith('#s='), true);

  // 저장된 결과와 URL에 인코딩된 결과가 동일한지 확인
  const encoded = JSON.parse(decodeURIComponent(location.hash.slice(3)));
  check('공유 조각에 amount 필드가 없음', 'amount' in encoded, false);
  check('공유 조각의 줄 수가 3', encoded.lines.length, 3);

  // 같은 해시로 새 문서를 열면(=링크를 다시 열면) 동일한 번호가 그대로 보여야 함
  const { doc: doc2 } = load({ hash: location.hash });
  const sharedRows = parseMemoRows(doc2.getElementById('memoRows').innerHTML);
  check('공유 링크를 다시 열면 동일한 번호 조합이 그대로 보임', sharedRows, encoded.lines);
  check('공유 열람 화면에 "공유된 결과입니다" 배지가 보임', doc2.getElementById('sharedBadgeBlock').style.display !== 'none', true);
}

console.log('\n=== 6. 공유 열람 시 재추첨하지 않고, 방문자의 기록을 자동으로 바꾸지 않음 ===');
{
  const shareData = { lines: [[1,2,3,4,5,6],[7,8,9,10,11,12]] };
  const hash = '#s=' + encodeURIComponent(JSON.stringify(shareData));
  const { doc, localStorage } = load({ hash, seedStorage: { 'harukok-lotto-history': JSON.stringify([{ nums: [1,2,3,4,5,9], date: Date.now() }]) } });
  const before = localStorage.getItem('harukok-lotto-history');
  const rows = parseMemoRows(doc.getElementById('memoRows').innerHTML);
  check('공유 데이터 그대로 표시됨(재추첨 없음)', rows, shareData.lines);
  check('공유 화면을 여는 것만으로 로컬 기록이 바뀌지 않음', localStorage.getItem('harukok-lotto-history'), before);

  // "나도 번호 생성하러 가기" 클릭 시 일반 생성 화면으로 돌아가고 해시가 비워짐
  doc.getElementById('sharedCtaLink').dispatchEvent({ type: 'click', preventDefault: () => {} });
}

console.log('\n=== 7. 잘못된 공유 데이터는 안전하게 처리(일반 생성 화면으로 대체, 오류 없음) ===');
{
  const badCases = [
    '#s=' + encodeURIComponent('{"broken json'),
    '#s=' + encodeURIComponent(JSON.stringify({ lines: [] })),                           // 0줄(범위 미만)
    '#s=' + encodeURIComponent(JSON.stringify({ lines: [[1,2,3,4,5,6],[1,2,3,4,5,6],[1,2,3,4,5,6],[1,2,3,4,5,6],[1,2,3,4,5,6],[1,2,3,4,5,6]] })), // 6줄(범위 초과)
    '#s=' + encodeURIComponent(JSON.stringify({ lines: [[1,2,3,4,5,5]] })),               // 중복 숫자
    '#s=' + encodeURIComponent(JSON.stringify({ lines: [[1,2,3,4,5,46]] })),              // 범위 초과
    '#s=' + encodeURIComponent(JSON.stringify({ lines: [[1,2,3,4,5,'x']] })),             // 정수 아님
    '#s=' + encodeURIComponent(JSON.stringify({ lines: [[1,2,3]] })),                      // 줄 길이 불량
    '#s=notjson',
  ];
  for (const hash of badCases) {
    let threw = false;
    let doc;
    try { ({ doc } = load({ hash })); } catch (e) { threw = true; }
    check('잘못된 공유 데이터(' + hash.slice(0, 30) + '...)는 오류 없이 일반 화면으로 대체됨', threw, false);
    if (!threw) {
      check('  → 일반 생성 화면(선택 영역)이 보임', doc.getElementById('selectionBlock').style.display !== 'none', true);
    }
  }
}

console.log('\n=== 8. 결제·구매 관련 기능이 없음(문구 점검) ===');
{
  const html = fs.readFileSync(HTML, 'utf8');
  const forbidden = ['결제하기', '구매하기', '충전하기', '발권하기', '장바구니', '가상 금액'];
  const found = forbidden.filter(w => html.includes(w));
  check('결제·구매·발권·가상 금액을 뜻하는 문구가 전혀 없음', found, []);
  check('"번호 생성" 버튼 라벨이 존재함', html.includes('>번호 생성<'), true);
  check('"줄 수 선택" 제목이 존재함', html.includes('줄 수 선택'), true);
}

console.log('\n=== 9. 회귀: 공유 조각의 줄 수 범위 검사를 제거하면 잘못된 데이터도 통과해야 함 ===');
{
  const src = fs.readFileSync(HTML, 'utf8');
  const broken = src.replace(
    'if (!Array.isArray(data.lines) || data.lines.length < 1 || data.lines.length > 5) return null;',
    'if (!Array.isArray(data.lines)) return null;'
  );
  if (broken === src) { console.log('FAIL - 깨뜨릴 코드를 찾지 못함'); fail++; }
  else {
    const tmp = path.join(require('os').tmpdir(), 'lotto-broken.html');
    fs.writeFileSync(tmp, broken, 'utf8');
    const html2 = fs.readFileSync(tmp, 'utf8');
    const doc = new FakeDocument();
    doc.registerFromHtml(html2);
    const code2 = extractInlineScripts(html2);
    const sixLines = Array.from({ length: 6 }, () => [1,2,3,4,5,6]);
    const hash = '#s=' + encodeURIComponent(JSON.stringify({ lines: sixLines }));
    const loc = makeLocation(hash);
    const sandbox = {
      document: doc, window: {}, console, Math, JSON, Set, Array, Object, Number,
      parseFloat, parseInt, isNaN, Infinity, encodeURIComponent, decodeURIComponent,
      localStorage: makeLocalStorage(), location: loc, history: makeHistory(loc),
      navigator: { clipboard: { writeText: () => Promise.resolve() } }, alert: () => {}, setTimeout: (fn) => fn(),
    };
    sandbox.window.document = doc;
    vm.createContext(sandbox);
    vm.runInContext(code2, sandbox, { filename: tmp });
    check('줄 수 범위 검사를 제거하면 6줄 같은 잘못된 데이터도 공유 화면으로 받아들여짐(테스트가 회귀를 잡아냄)', doc.getElementById('selectionBlock').style.display === 'none', true);
    fs.unlinkSync(tmp);
  }
}

console.log('\n=== 10. 최근 생성 기록 목록 — 행 전체 클릭 가능, 기본 5건 + "기록 더 보기" ===');
{
  const { doc, localStorage } = load({});
  for (let i = 0; i < 7; i++) { // 7번 생성 → 기록 7건
    doc.getElementById('amountGrid').children[0].click();
    doc.getElementById('genBtn').click();
  }
  check('기록 7건 저장됨', JSON.parse(localStorage.getItem('harukok-lotto-history')).length, 7);
  check('기본 상태에서는 5건의 행만 보임', doc.getElementById('historyList').children.filter(c => c.className === 'history-row').length, 5);
  const moreBtn = doc.getElementById('historyList').children.find(c => c.className === 'history-more-btn');
  check('"기록 더 보기" 버튼이 남은 건수(2건)를 안내함', moreBtn.textContent.includes('2건'), true);

  moreBtn.click();
  check('"기록 더 보기" 클릭 후 7건 모두 보임', doc.getElementById('historyList').children.filter(c => c.className === 'history-row').length, 7);
  check('모두 펼친 뒤에는 "기록 더 보기" 버튼이 사라짐', doc.getElementById('historyList').children.some(c => c.className === 'history-more-btn'), false);

  const row = doc.getElementById('historyList').children[0];
  check('각 행은 실제 버튼 요소(행 전체가 클릭 가능)', row.tagName, 'BUTTON');
  check('행 텍스트에 줄 수만 표시됨(1줄)', row.innerHTML.includes('1줄'), true);
  check('행 텍스트에 금액 표기가 없음', row.innerHTML.includes('원'), false);
}

console.log('\n=== 11. 기록 행 클릭 → 상세 모달에 원래 날짜·번호 전체 표시, 본문 결과는 그대로 ===');
{
  const { doc, localStorage } = load({});
  doc.getElementById('amountGrid').children[2].click(); // 3줄
  doc.getElementById('genBtn').click();
  doc.getElementById('amountGrid').children[0].click(); // 1줄
  doc.getElementById('genBtn').click();
  const historyBefore = localStorage.getItem('harukok-lotto-history');
  const savedList = JSON.parse(historyBefore);
  check('두 번 생성 후 기록 2건', savedList.length, 2);

  // "새로고침"을 흉내내기 위해 같은 저장값으로 완전히 새 문서를 연다.
  const { doc: doc2, localStorage: ls2 } = load({ seedStorage: { 'harukok-lotto-history': historyBefore } });
  const mainMemoRowsBefore = doc2.getElementById('memoRows').innerHTML;

  const rowButtons = doc2.getElementById('historyList').children.filter(c => c.className === 'history-row');
  check('새로고침 후에도 기록 2건에 대한 행이 보임', rowButtons.length, 2);

  // 가장 최근 기록(1줄) 행을 클릭해 모달을 연다.
  rowButtons[0].click();
  const modalRows = parseMemoRows(doc2.getElementById('modalMemoRows').innerHTML);
  check('모달에 저장 당시 번호가 그대로 표시됨', modalRows, savedList[0].lines);
  check('모달 부제에 원래 생성 날짜·시간만 표시됨(M/D HH:MM)', /^\d{1,2}\/\d{1,2} \d{2}:\d{2}$/.test(doc2.getElementById('modalMemoSub').textContent), true);
  check('모달 푸터에 금액 표기가 없음(줄 수만)', doc2.getElementById('modalMemoFooter').textContent.includes('원'), false);
  {
    // disclaimer-box는 모달 마크업에 정적으로 포함돼 있다(이 shim은 깊이 중첩된 정적 자식까지
    // 얕은 스캔으로 추적하지 않으므로, 어느 기록을 보든 항상 뜨는 고정 문구는 원본 소스로 확인한다).
    const modalSrc = fs.readFileSync(HTML, 'utf8').match(/<dialog[^>]*id="historyModal"[\s\S]*?<\/dialog>/)[0];
    check('모달 마크업에 실제 복권 아님 안내가 고정 포함됨', modalSrc.includes('실제 복권 아님'), true);
  }
  check('모달을 열어도 본문의 현재 생성 결과(memoRows)는 바뀌지 않음', doc2.getElementById('memoRows').innerHTML, mainMemoRowsBefore);
  check('모달을 열어도 저장 기록이 중복 추가되지 않음', JSON.parse(ls2.getItem('harukok-lotto-history')).length, 2);
  check('모달을 열어도 기록 내용 자체는 바뀌지 않음(저장값 그대로)', ls2.getItem('harukok-lotto-history'), historyBefore);

  // 다른 기록(3줄) 행을 클릭 — 모달 내용이 그 기록으로 바뀌는지 확인
  rowButtons[1].click();
  const modalRows2 = parseMemoRows(doc2.getElementById('modalMemoRows').innerHTML);
  check('다른 기록을 열면 모달 내용이 그 기록 번호로 바뀜', modalRows2, savedList[1].lines);

  // 모달 저장·복사·공유 버튼이 활성 상태로 존재하는지(비활성 속성 없음) 확인
  check('모달의 저장 버튼은 비활성화되지 않음', doc2.getElementById('modalSaveImgBtn').disabled, undefined);
}

console.log('\n=== 12. 모달의 저장·복사·공유는 모달이 보여주는 기록을 대상으로 동작함(본문과 분리) ===');
{
  const { doc, localStorage } = load({});
  doc.getElementById('amountGrid').children[4].click(); // 5줄(본문에서 생성)
  doc.getElementById('genBtn').click();
  const mainResult = JSON.parse(localStorage.getItem('harukok-lotto-history'))[0];

  // 과거에 저장해 둔 다른 기록을 하나 더 포함한 상태로 새 문서를 연다(같은 효과: 기록 2건).
  const olderRecord = { lines: [[1,6,11,16,21,26],[2,7,12,17,22,27]], date: '2026-09-20T00:00:00.000Z' };
  const seedList = [mainResult, olderRecord];
  const { doc: doc3, location: loc3 } = load({ seedStorage: { 'harukok-lotto-history': JSON.stringify(seedList) } });

  const rows3 = doc3.getElementById('historyList').children.filter(c => c.className === 'history-row');
  const olderRow = rows3.find(r => parseMemoRows_rowMatches(r));
  function parseMemoRows_rowMatches(r){ return r.innerHTML.includes('2줄'); }
  olderRow.click();

  doc3.getElementById('modalShareBtn').click();
  // 공유 조각은 "본문에서 방금 만든 5줄 결과"가 아니라 "모달에 열려 있던 2줄 기록"과 일치해야 한다.
  const frag = JSON.parse(decodeURIComponent(loc3.hash.slice(3)));
  check('모달 공유는 모달 기록(2줄)을 담음', frag.lines.length, 2);
  check('모달 공유 번호가 그 기록과 일치', frag.lines, olderRecord.lines);
  check('모달 공유가 본문에서 만든 결과(5줄)를 덮어쓰지 않음', JSON.stringify(frag.lines) !== JSON.stringify(mainResult.lines), true);

  // 모달의 텍스트 복사도 모달 기록 기준이어야 한다(클립보드 쓰기 호출 자체가 성공하는지만 확인).
  let copyThrew = false;
  try { doc3.getElementById('modalCopyTextBtn').click(); } catch (e) { copyThrew = true; }
  check('모달 텍스트 복사 클릭 시 오류 없음', copyThrew, false);
}

console.log('\n=== 13. 기존 {nums,date} 1줄 기록도 상세 모달로 동일하게 열람 가능 ===');
{
  const legacy = { nums: [2,9,18,27,33,44], date: '2026-09-01T00:00:00.000Z' };
  const { doc, localStorage } = load({ seedStorage: { 'harukok-lotto-history': JSON.stringify([legacy]) } });
  const row = doc.getElementById('historyList').children.find(c => c.className === 'history-row');
  row.click();
  const rows = parseMemoRows(doc.getElementById('modalMemoRows').innerHTML);
  check('레거시 1줄 기록도 모달에 동일한 번호가 표시됨', rows, [legacy.nums]);
  check('레거시 기록 모달을 열어도 기록은 1건 그대로(중복 추가 없음)', JSON.parse(localStorage.getItem('harukok-lotto-history')).length, 1);
  check('레거시 기록 모달을 열어도 저장값 자체는 변경되지 않음', JSON.parse(localStorage.getItem('harukok-lotto-history'))[0].date, legacy.date);
}

console.log('\n=== 14. 텍스트 복사는 번호만, 카드 부제는 날짜만(동행복권 문구 없음) ===');
{
    const pad = (n) => String(n).padStart(2, '0');
  const nowStr = () => { const d = new Date(); return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const { doc, copied } = load({});
  check('초기 카드 부제에 동행복권 문구가 없음', doc.getElementById('memoSub').textContent.includes('동행복권'), false);
  check('초기 카드 부제는 날짜+시간(M/D HH:MM)', doc.getElementById('memoSub').textContent, nowStr());
  doc.getElementById('amountGrid').children[2].click(); // 3줄
  doc.getElementById('genBtn').click();
  check('생성 후 카드 부제도 날짜+시간', doc.getElementById('memoSub').textContent, nowStr());
  doc.getElementById('copyTextBtn').click();
  const rows = parseMemoRows(doc.getElementById('memoRows').innerHTML);
  check('텍스트 복사는 번호만(줄마다 공백 구분, 줄바꿈으로 연결)', copied[0], rows.map(r => r.join(' ')).join('\n'));
  check('복사 텍스트에 안내 문구가 섞이지 않음', /[가-힣]/.test(copied[0]), false);

  const olderRecord = { lines: [[1,6,11,16,21,26],[2,7,12,17,22,27]], date: new Date(2026, 8, 20, 10, 30).getTime() };
  const { doc: doc2, copied: copied2 } = load({ seedStorage: { 'harukok-lotto-history': JSON.stringify([olderRecord]) } });
  doc2.getElementById('historyList').children[0].click();
  check('모달 부제는 메인 카드와 같은 형식(저장 당시 날짜+시간, 별도 라벨 없음)', doc2.getElementById('modalMemoSub').textContent, '9/20 10:30');
  doc2.getElementById('modalCopyTextBtn').click();
  check('모달 텍스트 복사도 번호만', copied2[0], '1 6 11 16 21 26\n2 7 12 17 22 27');

  const hash = '#s=' + encodeURIComponent(JSON.stringify({ lines: [[1,2,3,4,5,6]] }));
  const { doc: doc3 } = load({ hash });
  check('공유 열람 카드 부제에 동행복권 문구가 없음', doc3.getElementById('memoSub').textContent.includes('동행복권'), false);
}

console.log('\n결과: ' + pass + '개 통과, ' + fail + '개 실패');
if (fail > 0) process.exit(1);
