#!/usr/bin/env node
// 최소 배포 빌드 스크립트 — 외부 패키지 의존성 없이 Node 내장 fs/path만 사용한다.
//
// 목적: 지금까지는 Cloudflare Pages의 빌드 출력 디렉터리가 저장소 루트(/)였기 때문에,
// internal/(운영자 비공개 메모), verify/(개발용 검증 스크립트), *.md(개발 문서) 같은
// 공개할 의도가 없는 파일들도 그대로 배포되고 있었다. 이 스크립트는 "공개해도 되는
// 파일만" 골라 dist/ 로 복사해서, Cloudflare Pages의 빌드 출력 디렉터리를 dist/로
// 바꾸면 그 파일들만 실제로 배포되게 한다.
//
// 사용법: node scripts/build.js
// 결과: 저장소 루트에 dist/ 디렉터리를 새로 만들고 공개 대상 파일만 복사한다.
//       복사가 끝나면 scripts/check-dist.js 검사를 이어서 실행해, 비공개 대상이
//       실수로 섞여 들어가지 않았는지 확인한다.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// 공개 대상(허용 목록). 여기 없는 파일·폴더는 새로 생겨도 자동으로 배포되지 않는다 —
// 새 공개 페이지를 추가했다면 이 목록에도 추가해야 한다.
const PUBLIC_FILES = [
  'index.html',
  'about.html',
  'privacy.html',
  '404.html',
  'sitemap.xml',
  'robots.txt',
  'ads.txt',
  'favicon.png',
  'apple-touch-icon.png',
  'og-image.png',
];

const PUBLIC_DIRS = [
  'tools',
  'fun',
  'guides',
];

function rmrf(target) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

function copyFile(rel) {
  const src = path.join(ROOT, rel);
  const dest = path.join(DIST, rel);
  if (!fs.existsSync(src)) {
    console.log('WARN - 허용 목록에 있는 파일이 존재하지 않음(건너뜀): ' + rel);
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDir(rel) {
  const src = path.join(ROOT, rel);
  if (!fs.existsSync(src)) {
    console.log('WARN - 허용 목록에 있는 폴더가 존재하지 않음(건너뜀): ' + rel);
    return;
  }
  const dest = path.join(DIST, rel);
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const relChild = path.join(rel, entry.name);
    if (entry.isDirectory()) {
      copyDir(relChild);
    } else if (entry.isFile()) {
      copyFile(relChild);
    }
  }
}

function build() {
  console.log('dist/ 초기화...');
  rmrf(DIST);
  fs.mkdirSync(DIST, { recursive: true });

  console.log('공개 파일 복사...');
  for (const f of PUBLIC_FILES) copyFile(f);

  console.log('공개 폴더 복사...');
  for (const d of PUBLIC_DIRS) copyDir(d);

  console.log('빌드 완료: ' + DIST);
}

build();

// 빌드 직후 바로 검사까지 실행한다(둘 다 통과해야 배포 준비가 된 것으로 본다).
try {
  require('./check-dist.js');
} catch (e) {
  console.error('검사 스크립트 실행 실패: ' + e.message);
  process.exit(1);
}
