'use strict';
// 2026-11-10 도구 정리(유지 155·통합 364·삭제 481) 뒤의 상태를 검사한다.
// 기준 기록: internal/catalog-consolidation-2026-11-10.json, 실행 벡터: verify/consolidation-vectors.json
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const rec = JSON.parse(fs.readFileSync(path.join(root, 'internal/catalog-consolidation-2026-11-10.json'), 'utf8'));
const vectors = JSON.parse(fs.readFileSync(path.join(__dirname, 'consolidation-vectors.json'), 'utf8'));
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));
let checks = 0;
const ok = (value, label) => { assert.ok(value, label); checks++; };
const eq = (a, b, label) => { assert.deepEqual(a, b, label); checks++; };

(async () => {
  eq([rec.kept.length, rec.merged.length, rec.deleted.length], [155, 364, 481], '정리 개수');
  const pages = ['tools', 'fun'].flatMap(dir => fs.readdirSync(path.join(root, dir)).filter(f => f.endsWith('.html')).map(f => dir + '/' + f));
  eq(pages.length, rec.kept.length, '공개 도구 페이지 수');
  const pageOf = slug => pages.find(p => p.endsWith('/' + slug + '.html'));
  for (const slug of rec.kept) ok(pageOf(slug), slug + ' 유지 페이지 없음');

  // 삭제 도구: 페이지·전용 스크립트·조각 문서가 모두 없어야 한다.
  for (const slug of rec.deleted) {
    ok(!exists('tools/' + slug + '.html') && !exists('fun/' + slug + '.html'), slug + ' 삭제 페이지가 돌아옴');
    ok(!exists('tools/' + slug + '.js'), slug + ' 삭제 스크립트가 돌아옴');
    ok(!exists('tools/embed/' + slug + '.html'), slug + ' 삭제 도구의 조각 문서가 있음');
  }

  // 통합 도구: 옛 페이지는 없고, 조각 문서·301 연결·대표 도구의 기능 선택에 들어 있어야 한다.
  const redirects = read('_redirects').split(/\r?\n/);
  const hostCache = new Map();
  for (const { slug, into } of rec.merged) {
    ok(!exists('tools/' + slug + '.html'), slug + ' 통합 전 페이지가 남음');
    const embed = read('tools/embed/' + slug + '.html');
    ok(/<meta name="robots" content="noindex">/.test(embed) && /<base target="_top">/.test(embed), slug + ' 조각 문서 머리말');
    ok(!/ad-banner|rel="canonical"|<h1|site-nav|<footer/.test(embed), slug + ' 조각 문서에 페이지 틀이 남음');
    for (const [, src] of embed.matchAll(/<script\b[^>]*\bsrc="\/([^"?]+)/g)) ok(exists(src), slug + ' 조각 문서의 스크립트 없음: ' + src);
    ok(redirects.includes('/tools/' + slug + ' /tools/' + into + '?mode=' + slug + ' 301'), slug + ' 301 연결 없음');
    if (!hostCache.has(into)) hostCache.set(into, read(pageOf(into)));
    const host = hostCache.get(into);
    ok(host.includes('data-mode="' + slug + '"') || host.includes('<option value="' + slug + '">'), slug + ' 기능 선택에 없음');
  }
  for (const [into, host] of hostCache) {
    ok(host.includes('id="tool-mode-frame"') && /src="\/tools\/tool-modes\.js\?v=[^"]+" defer/.test(host) && /href="\/tools\/tool-modes\.css\?v=/.test(host), into + ' 기능 선택 자산');
    ok(host.indexOf('/tools/tool-modes.css') < host.indexOf('/tools/site-ui.css'), into + ' 공통 CSS가 마지막이어야 함');
    ok(host.includes('data-mode="' + into + '"') || host.includes('<option value="' + into + '">'), into + ' 자기 기능이 첫 선택지');
    eq((host.match(/ad-banner-isolated\.js/g) || []).length, 1, into + ' 광고 스크립트 수');
  }
  eq(fs.readdirSync(path.join(root, 'tools/embed')).length, rec.merged.length, '조각 문서 수');

  // 공개 파일 어디에도 없어진 주소로 가는 링크가 없어야 한다.
  const gone = new Set([...rec.deleted, ...rec.merged.map(m => m.slug)]);
  const publicFiles = ['index.html', 'about.html', 'privacy.html', '404.html', 'sitemap.xml', ...pages, ...fs.readdirSync(path.join(root, 'tools/embed')).map(f => 'tools/embed/' + f)];
  for (const file of publicFiles) {
    for (const m of read(file).matchAll(/(?:href="\/(?:tools|fun)\/|<loc>https:\/\/harukok\.com\/(?:tools|fun)\/)([a-z0-9-]+)(?=["<#?]|\.html)/g)) ok(!gone.has(m[1]), file + ' → 없어진 주소 ' + m[1]);
  }
  ok(/^Disallow: \/tools\/embed\/$/m.test(read('robots.txt')), 'robots.txt 조각 문서 제외');
  ok(/\/tools\/embed\/\*\r?\n\s+X-Robots-Tag: noindex/.test(read('_headers')), '_headers 조각 문서 noindex');

  // 남긴 계산·처리 코드는 검증을 마친 기준 커밋과 바이트가 같아야 한다.
  for (const { file, sha256 } of rec.retainedHashes) {
    eq(crypto.createHash('sha256').update(read(file).replace(/\r\n/g, '\n')).digest('hex'), sha256, file + ' 검증된 코드가 바뀜');
  }

  // 기존 QA 벡터로 실제 계산 결과를 다시 확인한다(브라우저 전용 도구는 해시 검사만 받는다).
  const live = new Set([...rec.kept, ...rec.merged.map(m => m.slug)]);
  let ran = 0;
  for (const v of vectors) {
    ok(live.has(v.slug), v.slug + ' 벡터 대상이 남은 도구가 아님');
    const mod = require(path.join(root, 'tools', v.slug + '.js'));
    const result = await mod.calculate({ ...v.fields, ...v.selects });
    ok(typeof result.text === 'string' && result.text.includes(v.expected), v.slug + ' 계산 결과가 기대와 다름');
    ok(!/\bNaN\b|\bInfinity\b|undefined/.test(result.text), v.slug + ' 결과에 비정상 값');
    ran++;
  }
  ok(ran >= 300, '실행 벡터가 너무 적음: ' + ran);
  console.log('PASS - ' + checks + ' consolidation checks: 유지 155·통합 364·삭제 481, 301 연결·조각 문서·링크 정리, 유지 코드 ' + rec.retainedHashes.length + '개 해시 일치, 실행 벡터 ' + ran + '개');
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
