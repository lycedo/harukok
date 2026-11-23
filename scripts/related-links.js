#!/usr/bin/env node
'use strict';

// 도구 페이지 아래 "함께 쓰는 도구" 링크를 다시 만든다. 실행: node scripts/related-links.js [--dry]
//
// 왜 필요한가: 예전에는 분류마다 검색 노출이 많은 도구 5개를 모든 페이지에 똑같이 달았다.
// 그 결과 인기 도구 5개가 링크를 24~26개씩 받고, 155개 중 66개는 다른 도구에서 링크를 하나도 받지 못했다.
// 홈 목록 말고는 들어오는 길이 없는 페이지를 없애려고, 분류 안에서 고리 모양으로 잇는다.
//
// 도구를 추가·삭제했다면 홈(index.html)의 목록을 먼저 고친 뒤 이 스크립트를 다시 돌린다.
// check-seo.js가 "다른 도구에서 받는 링크 3개 미만"을 빌드에서 막는다.
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const DRY = process.argv.includes('--dry');
const at = p => path.join(root, p);
const home = fs.readFileSync(at('index.html'), 'utf8');

// 1) 홈 목록에서 분류·이름·키워드를 읽는다. 링크에 적는 이름은 홈에 적힌 이름을 그대로 쓴다.
const all = [];
for (const section of home.matchAll(/<section class="goal-card" id="([a-z]+)-tools"[^>]*>([\s\S]*?)<\/section>/g)) {
  for (const item of section[2].matchAll(/<li data-keywords="([^"]*)"><a href="([^"]+)">([^<]*)<\/a>/g)) {
    all.push({ cat: section[1], keywords: item[1], path: item[2], name: item[3] });
  }
}
const byPath = new Map(all.map(tool => [tool.path, tool]));
const need = p => { if (!byPath.has(p)) throw new Error('홈 목록에 없는 도구: ' + p); return byPath.get(p); };

// 2) 비슷한 정도: 이름·키워드 낱말이 겹치는 비율에, 같은 계열(주소 앞머리)이면 가산점을 준다.
const STOP = new Set(['계산기', '변환기', '만들기', '생성기', '도구', '계산', '변환', '뽑기', '확인', '정리', '추천', '찾기']);
const FAMILY = { images: 'image', img: 'image', xlsx: 'csv', docx: 'csv', zip: 'file', tar: 'file' };
for (const tool of all) {
  tool.tokens = new Set((tool.name + ' ' + tool.keywords).toLowerCase().split(/[\s·,/()\-]+/).filter(t => t.length > 1 && !STOP.has(t)));
  const head = tool.path.split('/').pop().split('-')[0];
  tool.family = FAMILY[head] || head;
}
function similarity(a, b) {
  let common = 0;
  for (const token of a.tokens) if (b.tokens.has(token)) common++;
  const union = a.tokens.size + b.tokens.size - common;
  return (union ? common / union : 0) + (a.family === b.family ? 0.5 : 0);
}

// 3) 고리: 비슷한 것끼리 이웃하게 줄을 세우고 앞 2개·뒤 3개를 잇는다(끝은 처음과 이어진다).
//    고리 안의 모든 페이지가 정확히 5개를 주고 5개를 받는다. 월급과 퇴사는 내용이 이어져 한 고리로 묶는다.
const RING_OF = { salary: 'work', leaving: 'work' };
const CURATED_CATS = new Set(['family', 'pet']);   // 3개뿐이라 고리를 만들 수 없는 분류
const rings = new Map();
for (const tool of all.filter(tool => !CURATED_CATS.has(tool.cat))) {
  const ring = RING_OF[tool.cat] || tool.cat;
  if (!rings.has(ring)) rings.set(ring, []);
  rings.get(ring).push(tool);
}
const picks = new Map(all.map(tool => [tool.path, []]));
for (const [ring, members] of rings) {
  if (members.length < 6) throw new Error('고리를 만들기엔 도구가 적음: ' + ring + ' ' + members.length + '개 (가까운 분류와 묶거나 아래 CURATED에 넣을 것)');
  const rest = members.slice();
  const chain = [rest.shift()];
  while (rest.length) {
    const last = chain[chain.length - 1];
    let best = 0;
    for (let i = 1; i < rest.length; i++) if (similarity(last, rest[i]) > similarity(last, rest[best])) best = i;
    chain.push(rest.splice(best, 1)[0]);
  }
  chain.forEach((tool, i) => {
    for (const step of [-2, -1, 1, 2, 3]) picks.get(tool.path).push(chain[((i + step) % chain.length + chain.length) % chain.length]);
  });
}

// 4) 3개짜리 분류는 낱말 겹침으로는 맞는 짝이 나오지 않아(연말정산 옆에 태명 추천이 붙는다) 손으로 정한다.
//    out: 그 페이지에 다는 5개. from: 이 페이지로 오는 링크를 하나 더 다는 바깥 도구(그 도구는 6개가 된다).
const CURATED = {
  '/tools/parental-leave-calculator': {
    out: ['/tools/due-date-calculator', '/fun/baby-name-generator', '/tools/salary-calculator', '/tools/unemployment-benefit-calculator', '/tools/annual-leave-pay-calculator'],
    from: ['/tools/salary-calculator', '/tools/unemployment-benefit-calculator'],
  },
  '/tools/due-date-calculator': {
    out: ['/fun/baby-name-generator', '/tools/parental-leave-calculator', '/tools/date-calculator', '/tools/age-calculator', '/tools/calendar-month-calculator'],
    from: ['/tools/date-calculator', '/tools/calendar-month-calculator'],
  },
  '/fun/baby-name-generator': {
    out: ['/tools/due-date-calculator', '/tools/parental-leave-calculator', '/fun/name-compatibility', '/fun/pet-name-generator', '/fun/fortune-today'],
    from: ['/fun/name-compatibility', '/fun/fortune-today'],
  },
  '/tools/pet-age-calculator': {
    out: ['/tools/pet-food-calculator', '/fun/pet-name-generator', '/tools/age-calculator', '/tools/date-calculator', '/tools/unit-converter'],
    from: ['/tools/age-calculator'],
  },
  '/tools/pet-food-calculator': {
    out: ['/tools/pet-age-calculator', '/fun/pet-name-generator', '/tools/recipe-scale-calculator', '/tools/unit-converter', '/tools/percent-calculator'],
    from: ['/tools/recipe-scale-calculator', '/tools/unit-converter'],
  },
  '/fun/pet-name-generator': {
    out: ['/tools/pet-age-calculator', '/tools/pet-food-calculator', '/fun/baby-name-generator', '/tools/random-picker', '/fun/name-compatibility'],
    from: ['/tools/random-picker'],
  },
};
for (const tool of all.filter(tool => CURATED_CATS.has(tool.cat))) {
  const rule = CURATED[tool.path];
  if (!rule) throw new Error('짝을 정하지 않은 도구: ' + tool.path + ' (CURATED에 추가할 것)');
  for (const target of rule.out) picks.get(tool.path).push(need(target));
  for (const source of rule.from) picks.get(need(source).path).push(tool);
}
for (const curated of Object.keys(CURATED)) need(curated);

// 5) 적용. 고리에서 고른 5개는 비슷한 순으로 보여 주고, 손으로 정한 것은 적은 순서를 지킨다.
const escapeHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const inbound = new Map(all.map(tool => [tool.path, 0]));
let changed = 0;
for (const tool of all) {
  let targets = picks.get(tool.path);
  if (!CURATED[tool.path]) {
    const ringPart = targets.slice(0, 5).sort((a, b) => similarity(tool, b) - similarity(tool, a));
    targets = [...ringPart, ...targets.slice(5)];
  }
  if (targets.length < 5 || targets.length > 6 || new Set(targets).size !== targets.length || targets.includes(tool)) {
    throw new Error('링크 구성이 잘못됨: ' + tool.path + ' (' + targets.map(t => t.path).join(', ') + ')');
  }
  for (const target of targets) inbound.set(target.path, inbound.get(target.path) + 1);
  const nav = '<nav class="related" aria-label="함께 쓰는 도구"><h2 class="related-title">함께 쓰는 도구</h2>'
    + targets.map(target => '<a href="' + target.path + '">' + escapeHtml(target.name) + '</a>').join('') + '</nav>';
  const file = tool.path.slice(1) + '.html';
  const source = fs.readFileSync(at(file), 'utf8');
  const found = source.match(/<nav class="related"[^>]*>[\s\S]*?<\/nav>/g) || [];
  if (found.length !== 1) throw new Error('"함께 쓰는 도구" 영역이 ' + found.length + '개: ' + file);
  let output = source.replace(found[0], () => nav);
  if (/\r\n/.test(source)) output = output.replace(/\r?\n/g, '\r\n');
  if (output !== source) {
    changed++;
    if (!DRY) fs.writeFileSync(at(file), output);
  }
}

const counts = [...inbound.values()];
const spread = {};
for (const n of counts) spread[n] = (spread[n] || 0) + 1;
console.log((DRY ? '[모의] ' : '') + '바뀐 페이지 ' + changed + ' / ' + all.length);
console.log('다른 도구에서 받는 링크: 최소 ' + Math.min(...counts) + ' · 최대 ' + Math.max(...counts) + ' · 분포 ' + JSON.stringify(spread));
if (Math.min(...counts) < 3) { console.error('FAIL - 받는 링크가 3개 미만인 페이지가 있음'); process.exitCode = 1; }
