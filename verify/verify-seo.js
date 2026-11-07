'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { checkSite } = require('../scripts/check-seo');
const root = path.join(__dirname, '..');
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'harukok-seo-'));
let checks = 0;
try {
  // 실제 HTML의 메타·링크를 변형하여 검사가 문제를 잡는지 확인한다.
  for (const dir of ['', 'tools', 'fun']) {
    fs.mkdirSync(path.join(fixture, dir), { recursive: true });
    for (const name of fs.readdirSync(path.join(root, dir))) {
      if (name.endsWith('.html') || name.endsWith('.js') || (dir === '' && ['robots.txt', 'sitemap.xml'].includes(name))) {
        fs.copyFileSync(path.join(root, dir, name), path.join(fixture, dir, name));
      }
    }
  }
  // 파일 처리 도구가 참조하는 고정 버전 공개 라이브러리도 복사한다.
  fs.cpSync(path.join(root, 'tools', 'vendor'), path.join(fixture, 'tools', 'vendor'), { recursive: true });
  // 다운로드 링크로 참조된 로컬 파일도 검사할 수 있게 복사한다.
  for (const dir of ['', 'tools', 'fun']) {
    for (const name of fs.readdirSync(path.join(root, dir))) {
      if (!name.endsWith('.html')) continue;
      const html = fs.readFileSync(path.join(root, dir, name), 'utf8');
      for (const [, href] of html.matchAll(/<a\b[^>]*href="(\/[^"?#]+)"/g)) {
        const rel = href.slice(1);
        if (path.extname(rel) && !rel.endsWith('.html') && fs.statSync(path.join(root, rel)).isFile()) {
          fs.mkdirSync(path.dirname(path.join(fixture, rel)), { recursive: true });
          fs.copyFileSync(path.join(root, rel), path.join(fixture, rel));
        }
      }
    }
  }
  assert.deepEqual(checkSite(fixture).errors, []);
  assert.equal(checkSite(fixture).pageCount, checkSite(root).pageCount);
  checks++;
  function mutation(name, file, transform, expected) {
    const target = path.join(fixture, file);
    const original = fs.readFileSync(target, 'utf8');
    try {
      const changed = transform(original);
      assert.notEqual(changed, original, name + ' must change the fixture');
      fs.writeFileSync(target, changed);
      assert.ok(checkSite(fixture).errors.some(error => expected.test(error)), name);
      checks++;
    } finally { fs.writeFileSync(target, original); }
  }
  mutation('Missing sitemap entry', 'sitemap.xml', html => html.replace(/<url>\s*<loc>https:\/\/harukok.com\/tools\/percent-calculator<\/loc>[\s\S]*?<\/url>/, ''), /공개 페이지 누락.*percent-calculator/);
  mutation('Wrong canonical', 'tools/percent-calculator.html', html => html.replace('rel="canonical" href="https://harukok.com/tools/percent-calculator"', 'rel="canonical" href="https://example.com/"'), /canonical은 실제/);
  mutation('Missing tool ad', 'tools/percent-calculator.html', html => html.replace(/<script src="\/ad-banner-isolated\.js[^"\n]*"><\/script>/, ''), /도구 광고 스크립트는 하나/);
  mutation('Duplicate tool ad', 'tools/percent-calculator.html', html => html.replace('</main>', '<script src="/ad-banner-isolated.js?v=20261027-banner"></script></main>'), /도구 광고 스크립트는 하나/);
  mutation('Missing local script', 'tools/percent-calculator.html', html => html.replace('</head>', '<script src="/tools/missing-expansion.js"></script></head>'), /없는 로컬 스크립트/);
  mutation('Accidental noindex', 'tools/percent-calculator.html', html => html.replace('</head>', '<meta name="robots" content="noindex"></head>'), /공개 콘텐츠에 noindex/);
  mutation('Malformed structured data', 'tools/percent-calculator.html', html => html.replace('"@context":', '"@context" '), /JSON 문법 오류/);
  mutation('Broken internal link', 'index.html', html => html.replace('href="/tools/percent-calculator"', 'href="/tools/does-not-exist"'), /없는 페이지 링크/);
  mutation('Missing home tool entry', 'index.html', html => html.replace('href="/tools/percent-calculator"', 'href="/"'), /홈 전체 도구 목록에 링크 누락/);
  mutation('Removed home guides return', 'index.html', html => html.replace('</main>', '<section><h2 id="home-guides-title">계산이 헷갈릴 때 가이드</h2></section></main>'), /삭제한 홈 가이드 영역/);
  mutation('Stale tool count', 'index.html', html => html.replace(/전체 도구 \d+개/, '전체 도구 0개'), /전체 도구 개수가/);
  mutation('Stale search description', 'index.html', html => html.replace('name="description" content="', 'name="description" content="무료 도구 0개. '), /검색·공유 설명의 도구 수/);
  mutation('Crawler block', 'robots.txt', html => html + '\nDisallow: /\n', /전체 사이트 크롤링 차단/);
  mutation('Nonexistent sitemap date', 'sitemap.xml', html => html.replace(/<lastmod>.*?<\/lastmod>/, '<lastmod>2026-02-30</lastmod>'), /올바른 lastmod/);
  console.log('PASS - ' + checks + ' SEO checks including deliberate sitemap, canonical, noindex, JSON, link, count and robots failures');
} finally {
  // 이 실행이 생성한 임시 폴더만 정리한다.
  if (path.dirname(fixture) !== path.resolve(os.tmpdir()) || !path.basename(fixture).startsWith('harukok-seo-')) throw new Error('Unexpected fixture path');
  fs.rmSync(fixture, { recursive: true, force: true });
}
