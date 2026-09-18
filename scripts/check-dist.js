#!/usr/bin/env node
// dist/ 배포 결과 검사 — 비공개 대상(internal/, verify/, 개발용 .md 등)이
// 실수로 배포 결과에 섞여 있지 않은지, 그리고 꼭 있어야 할 공개 파일은 빠지지
// 않았는지 확인한다. node scripts/build.js가 빌드 직후 자동으로 이 스크립트를
// 실행하지만, `node scripts/check-dist.js`로 단독 실행도 가능하다.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const FORBIDDEN_DIR_NAMES = new Set(['internal', 'verify', '.git', 'scripts', 'node_modules']);
const FORBIDDEN_FILE_EXTENSIONS = new Set(['.md']);
// 실수로 섞여 들어가면 안 되는 파일명(확장자와 무관하게 이름 자체로 차단).
const FORBIDDEN_FILE_NAMES = new Set(['DEPLOY_GUIDE.md', 'PROJECT_NOTES.md']);

const REQUIRED_FILES = [
  'index.html',
  'about.html',
  'privacy.html',
  '404.html',
  'sitemap.xml',
  'robots.txt',
];

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push({ type: 'dir', full, name: entry.name });
      walk(full, out);
    } else if (entry.isFile()) {
      out.push({ type: 'file', full, name: entry.name });
    }
  }
}

function main() {
  if (!fs.existsSync(DIST)) {
    console.error('FAIL - dist/ 가 없습니다. 먼저 node scripts/build.js 를 실행하세요.');
    process.exit(1);
  }

  const entries = [];
  walk(DIST, entries);

  let violations = 0;

  for (const e of entries) {
    if (e.type === 'dir' && FORBIDDEN_DIR_NAMES.has(e.name)) {
      console.log('FAIL - 배포 결과에 비공개 폴더가 포함됨: ' + path.relative(DIST, e.full));
      violations++;
    }
    if (e.type === 'file') {
      const ext = path.extname(e.name);
      if (FORBIDDEN_FILE_EXTENSIONS.has(ext)) {
        console.log('FAIL - 배포 결과에 개발용 문서(.md)가 포함됨: ' + path.relative(DIST, e.full));
        violations++;
      }
      if (FORBIDDEN_FILE_NAMES.has(e.name)) {
        console.log('FAIL - 배포 결과에 개발 문서가 포함됨: ' + path.relative(DIST, e.full));
        violations++;
      }
    }
  }

  for (const rel of REQUIRED_FILES) {
    if (!fs.existsSync(path.join(DIST, rel))) {
      console.log('FAIL - 배포 결과에 꼭 있어야 할 파일이 없음: ' + rel);
      violations++;
    }
  }

  if (violations === 0) {
    console.log('PASS - dist/ 검사 통과 (' + entries.length + '개 항목 확인, internal/·verify/·*.md 없음, 필수 파일 모두 존재)');
  } else {
    console.error('\n검사 실패: ' + violations + '건의 문제. dist/를 배포하지 마세요.');
    process.exit(1);
  }
}

main();
