#!/usr/bin/env node
// 화면 디자인 규칙 검사 — internal/design-system.md 의 "하지 말 것"을 자동으로 확인한다.
//   node scripts/check-design.js
// 실패하면 종료 코드 1. 공개 페이지(루트·tools·fun·guides의 .html/.css)만 검사한다.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIRS = ['.', 'tools', 'fun', 'guides'];
const SKIP_FILES = new Set(['ad-frame.html', 'site-ui.css']);
const MIN_FONT_PX = 13;            // 이보다 작은 글자는 쓰지 않는다
const CERT_FILE = 'tools/certificate-maker.html'; // 상장 미리보기(.cert*)는 명조 허용

let problems = 0;
function fail(file, msg) { console.log('FAIL - ' + file + ': ' + msg); problems++; }

for (const d of DIRS) {
  for (const name of fs.readdirSync(path.join(ROOT, d))) {
    if (!/\.(html|css)$/.test(name) || SKIP_FILES.has(name)) continue;
    const rel = (d === '.' ? name : d + '/' + name);
    const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');

    if (name.endsWith('.html')) {
      if (!src.includes('/tools/site-ui.css')) fail(rel, '공통 CSS(/tools/site-ui.css)를 불러오지 않음');
      if (!/family=Do\+Hyeon&family=Noto\+Sans\+KR/.test(src)) fail(rel, '공통 글꼴 링크(Do Hyeon + Noto Sans KR)가 없음');
      if (/family=Pretendard|family=IBM\+Plex\+Mono|family=Noto\+Serif\+KR/.test(src)) fail(rel, '쓰지 않는 글꼴 링크(Pretendard·IBM Plex Mono·Noto Serif KR)가 남아 있음');
      if (/<footer style=/.test(src)) fail(rel, '푸터에 인라인 스타일을 쓰지 말 것(공통 CSS가 담당)');
      if (!/<meta name="viewport"/.test(src)) fail(rel, 'viewport 메타가 없음');
    }

    // 글자 크기 하한
    for (const m of src.matchAll(/font-size:\s*([\d.]+)px/g)) {
      if (parseFloat(m[1]) < MIN_FONT_PX) { fail(rel, 'font-size ' + m[1] + 'px (최소 ' + MIN_FONT_PX + 'px)'); break; }
    }

    // 명조·모노 글꼴 금지(상장 미리보기 예외)
    if (rel !== CERT_FILE && /Noto Serif KR|IBM Plex Mono|font-family:\s*['"]?Pretendard/.test(src)) {
      fail(rel, '공통 글꼴 토큰 대신 개별 글꼴을 지정함(var(--font-display)/var(--font-body) 사용)');
    }
  }
}

if (!fs.existsSync(path.join(ROOT, 'tools/site-ui.css'))) fail('tools/site-ui.css', '파일이 없음');

if (problems) { console.log('\n디자인 규칙 위반 ' + problems + '건'); process.exit(1); }
console.log('PASS - 디자인 규칙 검사 통과');
