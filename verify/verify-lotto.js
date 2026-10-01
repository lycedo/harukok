// 로또 번호 생성기(fun/lotto-generator.html) 검증 — 실제 HTML의 <script>를 그대로 실행한다.
// 가상 금액→줄 수 매핑, 기존 기록 호환, 공유 링크 왕복(동일 결과), 잘못된 공유 데이터 방어,
// 공유 열람 시 재추첨·내 기록 자동 저장이 없는지를 검증한다.
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
    navigator: { clipboard: { writeText: () => Promise.resolve() } },
    alert: () => {},
    setTimeout: (fn) => fn(),
  };
  sandbox.window.document = doc;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: HTML });
  return { doc, localStorage: ls, location: loc };
}

// memoRows는 innerHTML 문자열로 채워지므로(실제 브라우저 DOM 파싱과 달리 이 shim은
// appendChild로 추가된 자식만 .children에 반영한다), 결과 확인은 innerHTML 문자열을
// 파싱해서 검증한다.
function parseMemoRows(html) {
  const rowHtmls = html.match(/<div class="memo-row">[\s\S]*?<\/div>\s*(?=<div class="memo-row">|$)/g) || [];
  return rowHtmls.map(rowHtml => [...rowHtml.matchAll(/<span class="ball[^"]*"[^>]*>(\d+)<\/span>/g)].map(m => Number(m[1])));
}

console.log('=== 1. 가상 금액 → 줄 수 매핑 (1,000~5,000원 → 1~5줄) ===');
{
  const expectedLines = { 1000: 1, 2000: 2, 3000: 3, 4000: 4, 5000: 5 };
  let idx = 0;
  for (const [amountStr, lines] of Object.entries(expectedLines)) {
    const amount = Number(amountStr);
    const { doc } = load({});
    const amountBtn = doc.getElementById('amountGrid').children[idx];
    idx++;
    amountBtn.click();
    doc.getElementById('genBtn').click();
    const rows = parseMemoRows(doc.getElementById('memoRows').innerHTML);
    check(amount + '원 선택 시 ' + lines + '줄 생성됨', rows.length, lines);
    check(amount + '원 결과의 각 줄이 공 6개로 구성됨', rows.every(r => r.length === 6), true);
  }
}

console.log('\n=== 2. 각 줄은 1~45 중 서로 다른 정수 6개 ===');
{
  const { doc, localStorage } = load({});
  [...doc.getElementById('amountGrid').children][4].click(); // 5,000원
  doc.getElementById('genBtn').click();
  const saved = JSON.parse(localStorage.getItem('harukok-lotto-history'))[0];
  let allValid = true;
  for (const line of saved.lines) {
    const uniq = new Set(line);
    if (uniq.size !== 6) allValid = false;
    for (const n of line) if (!Number.isInteger(n) || n < 1 || n > 45) allValid = false;
  }
  check('5줄 모두 1~45 범위의 서로 다른 정수 6개', allValid, true);
  check('저장된 기록의 amount가 5000', saved.amount, 5000);
}

console.log('\n=== 3. 기존 레코드 호환 — {nums,date} 1줄 기록과 신규 {amount,lines,date} 기록이 함께 표시됨 ===');
{
  const legacy = { nums: [1,2,3,4,5,6], date: '2026-09-01T00:00:00.000Z' };
  const { doc } = load({ seedStorage: { 'harukok-lotto-history': JSON.stringify([legacy]) } });
  check('레거시 1줄 기록이 공 모양으로 표시됨', collectHtml(doc.getElementById('historyList')).includes('balls'), true);

  [...doc.getElementById('amountGrid').children][1].click(); // 2,000원
  doc.getElementById('genBtn').click();
  const html = collectHtml(doc.getElementById('historyList'));
  check('신규 생성 후에도 레거시 1줄 기록이 함께 남아있음', html.includes('balls'), true);
  check('신규 묶음 기록도 함께 표시됨(2,000원 · 2줄)', html.includes('2,000원') && html.includes('2줄'), true);
}

console.log('\n=== 4. 잘못된 저장값 방어 — 초기화가 중단되지 않고 유효한 기록만 보존 ===');
{
  const mixed = [
    { nums: [1,2,3,4,5,6], date: Date.now() },                 // 정상(레거시)
    { amount: 3000, lines: [[1,2,3,4,5,6],[7,8,9,10,11,12],[13,14,15,16,17,18]], date: Date.now() }, // 정상(신규)
    { amount: 3000, lines: [[1,2,3]], date: Date.now() },       // 줄 길이 불량
    { nums: [1,2,3], date: Date.now() },                        // nums 길이 불량
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
  check('정상 레거시 기록은 보존됨', html.includes('balls'), true);
  check('정상 신규 기록(3,000원 · 3줄)은 보존됨', html.includes('3,000원') && html.includes('3줄'), true);

  // 배열 자체가 아닌 손상된 저장값
  let threw2 = false;
  try { load({ seedStorage: { 'harukok-lotto-history': '{"broken":true}' } }); }
  catch (e) { threw2 = true; }
  check('저장값 자체가 배열이 아니어도 오류 없이 초기화됨', threw2, false);
}

console.log('\n=== 5. 공유 링크 — 생성한 결과와 동일한 데이터가 링크에 담기고, 다시 열면 같은 결과가 보임 ===');
{
  const { doc, location } = load({});
  [...doc.getElementById('amountGrid').children][2].click(); // 3,000원
  doc.getElementById('genBtn').click();
  doc.getElementById('shareBtn').click();
  check('공유 버튼 클릭 시 URL에 #s= 공유 조각이 생김', location.hash.startsWith('#s='), true);

  // 저장된 결과와 URL에 인코딩된 결과가 동일한지 확인
  const encoded = JSON.parse(decodeURIComponent(location.hash.slice(3)));
  const savedHistoryRaw = collectHtml(doc.getElementById('historyList'));
  check('공유 조각의 가상 금액이 3000', encoded.amount, 3000);
  check('공유 조각의 줄 수가 3', encoded.lines.length, 3);

  // 같은 해시로 새 문서를 열면(=링크를 다시 열면) 동일한 번호가 그대로 보여야 함
  const { doc: doc2 } = load({ hash: location.hash });
  const sharedRows = parseMemoRows(doc2.getElementById('memoRows').innerHTML);
  check('공유 링크를 다시 열면 동일한 번호 조합이 그대로 보임', sharedRows, encoded.lines);
  check('공유 열람 화면에 "공유된 결과입니다" 배지가 보임', doc2.getElementById('sharedBadgeBlock').style.display !== 'none', true);
}

console.log('\n=== 6. 공유 열람 시 재추첨하지 않고, 방문자의 기록을 자동으로 바꾸지 않음 ===');
{
  const shareData = { amount: 2000, lines: [[1,2,3,4,5,6],[7,8,9,10,11,12]] };
  const hash = '#s=' + encodeURIComponent(JSON.stringify(shareData));
  const { doc, localStorage } = load({ hash, seedStorage: { 'harukok-lotto-history': JSON.stringify([{ nums: [9,9,9,9,9,9].map((_,i)=>i+1), date: Date.now() }]) } });
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
    '#s=' + encodeURIComponent(JSON.stringify({ amount: 9999, lines: [[1,2,3,4,5,6]] })), // 허용되지 않는 금액
    '#s=' + encodeURIComponent(JSON.stringify({ amount: 2000, lines: [[1,2,3,4,5,6]] })), // 금액-줄수 불일치
    '#s=' + encodeURIComponent(JSON.stringify({ amount: 1000, lines: [[1,2,3,4,5,5]] })), // 중복 숫자
    '#s=' + encodeURIComponent(JSON.stringify({ amount: 1000, lines: [[1,2,3,4,5,46]] })), // 범위 초과
    '#s=' + encodeURIComponent(JSON.stringify({ amount: 1000, lines: [[1,2,3,4,5,'x']] })), // 정수 아님
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

console.log('\n=== 8. 가상 금액은 표시용일 뿐 결제·구매 관련 기능이 없음(문구 점검) ===');
{
  const html = fs.readFileSync(HTML, 'utf8');
  const forbidden = ['결제하기', '구매하기', '충전하기', '발권하기', '장바구니'];
  const found = forbidden.filter(w => html.includes(w));
  check('결제·구매·발권을 뜻하는 문구가 버튼/UI에 없음', found, []);
  check('"번호 생성" 버튼 라벨이 존재함', html.includes('>번호 생성<'), true);
}

console.log('\n=== 9. 회귀: 공유 조각의 유효성 검사를 제거하면 잘못된 데이터도 통과해야 함 ===');
{
  const src = fs.readFileSync(HTML, 'utf8');
  const broken = src.replace('if (!AMOUNTS.includes(data.amount)) return null;', '// (검사 제거됨)');
  if (broken === src) { console.log('FAIL - 깨뜨릴 코드를 찾지 못함'); fail++; }
  else {
    const tmp = path.join(require('os').tmpdir(), 'lotto-broken.html');
    fs.writeFileSync(tmp, broken, 'utf8');
    const html2 = fs.readFileSync(tmp, 'utf8');
    const doc = new FakeDocument();
    doc.registerFromHtml(html2);
    const code2 = extractInlineScripts(html2);
    const hash = '#s=' + encodeURIComponent(JSON.stringify({ amount: 6000, lines: [[1,2,3,4,5,6],[1,2,3,4,5,6],[1,2,3,4,5,6],[1,2,3,4,5,6],[1,2,3,4,5,6],[1,2,3,4,5,6]] }));
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
    check('허용 금액 검사를 제거하면 9999원 같은 잘못된 금액도 공유 화면으로 받아들여짐(테스트가 회귀를 잡아냄)', doc.getElementById('selectionBlock').style.display === 'none', true);
    fs.unlinkSync(tmp);
  }
}

console.log('\n=== 10. 최근 생성 기록 — "번호 다시 보기"로 저장된 번호를 그대로 다시 봄 ===');
{
  // 서로 다른 두 묶음을 생성한다.
  const { doc, localStorage } = load({});
  doc.getElementById('amountGrid').children[2].click(); // 3,000원
  doc.getElementById('genBtn').click();
  doc.getElementById('amountGrid').children[0].click(); // 1,000원
  doc.getElementById('genBtn').click();
  const historyBefore = localStorage.getItem('harukok-lotto-history');
  const savedList = JSON.parse(historyBefore);
  check('두 번 생성 후 기록 2건', savedList.length, 2);

  // "새로고침"을 흉내내기 위해 같은 저장값으로 완전히 새 문서를 연다.
  const { doc: doc2, localStorage: ls2, location: loc2 } = load({ seedStorage: { 'harukok-lotto-history': historyBefore } });
  const viewBtns = [...doc2.getElementById('historyList').children].map(row => row.children[1]); // [top, viewBtn]

  // 가장 최근 기록(1,000원 · 1줄) 다시 보기
  viewBtns[0].click();
  let rows = parseMemoRows(doc2.getElementById('memoRows').innerHTML);
  check('최근 기록(1,000원·1줄) 다시 보기 — 번호가 저장 당시와 동일', rows, savedList[0].lines);
  check('다시 보기 안내에 "저장된 기록"과 원래 생성일이 표시됨', doc2.getElementById('memoSub').textContent.includes('저장된 기록'), true);
  check('원래 생성 날짜가 함께 표시됨', doc2.getElementById('memoSub').textContent.includes(String(new Date(savedList[0].date).getDate())), true);
  check('다시 보기는 기록을 중복 추가하지 않음', JSON.parse(ls2.getItem('harukok-lotto-history')).length, 2);
  check('다시 보기는 기록 내용 자체를 바꾸지 않음(저장값 그대로)', ls2.getItem('harukok-lotto-history'), historyBefore);

  // 두 번째 기록(3,000원 · 3줄) 다시 보기 — 다른 기록으로 바뀌는지 확인
  viewBtns[1].click();
  rows = parseMemoRows(doc2.getElementById('memoRows').innerHTML);
  check('다른 기록(3,000원·3줄)을 다시 보면 그 기록 번호로 바뀜', rows, savedList[1].lines);

  // 다시 본 결과도 저장·복사·공유가 가능해야 한다.
  check('다시 보기 후 이미지 저장 버튼 활성화', doc2.getElementById('saveImgBtn').disabled, false);
  check('다시 보기 후 텍스트 복사 버튼 활성화', doc2.getElementById('copyTextBtn').disabled, false);
  check('다시 보기 후 공유 버튼 활성화', doc2.getElementById('shareBtn').disabled, false);

  doc2.getElementById('shareBtn').click();
  const sharedFrag = JSON.parse(decodeURIComponent(loc2.hash.slice(3)));
  check('다시 본 기록을 공유하면 그 기록과 동일한 번호가 담김', sharedFrag.lines, savedList[1].lines);
  check('다시 본 기록을 공유하면 그 기록과 동일한 금액이 담김', sharedFrag.amount, savedList[1].amount);
}

console.log('\n=== 11. 기존 {nums,date} 1줄 기록도 "번호 다시 보기"로 동일하게 다시 볼 수 있음 ===');
{
  const legacy = { nums: [2,9,18,27,33,44], date: '2026-09-01T00:00:00.000Z' };
  const { doc, localStorage } = load({ seedStorage: { 'harukok-lotto-history': JSON.stringify([legacy]) } });
  const row = doc.getElementById('historyList').children[0];
  const viewBtn = row.children[1];
  viewBtn.click();
  const rows = parseMemoRows(doc.getElementById('memoRows').innerHTML);
  check('레거시 1줄 기록도 다시 보기로 동일한 번호가 표시됨', rows, [legacy.nums]);
  check('레거시 기록 다시 보기 후에도 기록은 1건 그대로(중복 추가 없음)', JSON.parse(localStorage.getItem('harukok-lotto-history')).length, 1);
  check('레거시 기록 다시 보기 후에도 저장값 자체는 변경되지 않음', JSON.parse(localStorage.getItem('harukok-lotto-history'))[0].date, legacy.date);
}

console.log('\n결과: ' + pass + '개 통과, ' + fail + '개 실패');
if (fail > 0) process.exit(1);
