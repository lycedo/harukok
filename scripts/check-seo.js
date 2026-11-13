#!/usr/bin/env node
'use strict';

// 신규 페이지가 생겨도 검색 설정·사이트맵·정적 내부 링크 누락을 빌드에서 잡는다.
// 검색 순위나 실제 색인 여부를 판단하는 검사는 아니다. 외부 패키지 없이 실행한다.
const fs = require('node:fs');
const path = require('node:path');
const ORIGIN = 'https://harukok.com';
const EXCLUDED = new Set(['404.html', 'ad-frame.html']);

function attrs(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)]
    .map(([, key, , value]) => [key.toLowerCase(), value.replace(/&amp;/g, '&')]));
}

function checkSite(root) {
  const errors = [];
  const fail = (file, message) => errors.push(file + ': ' + message);
  const files = fs.readdirSync(root).filter(file => file.endsWith('.html'));
  for (const dir of ['tools', 'fun']) {
    for (const file of fs.readdirSync(path.join(root, dir))) {
      if (file.endsWith('.html')) files.push(dir + '/' + file);
    }
  }
  const pages = new Map();
  const titles = new Set();
  const descriptions = new Set();
  for (const file of files) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    const meta = [...html.matchAll(/<meta\b[^>]*>/gi)].map(match => attrs(match[0]));
    const noindex = meta.some(tag => /^(robots|googlebot)$/i.test(tag.name || '') && /\bnoindex\b/i.test(tag.content || ''));
    if (EXCLUDED.has(file)) {
      if (!noindex) fail(file, '검색 제외 페이지의 noindex 누락');
      continue;
    }
    const pathname = '/' + file.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '');
    const canonical = ORIGIN + pathname;
    const links = [...html.matchAll(/<link\b[^>]*>/gi)].map(match => attrs(match[0]));
    const canonicals = links.filter(tag => /\bcanonical\b/i.test(tag.rel || ''));
    if (canonicals.length !== 1 || canonicals[0].href !== canonical) fail(file, 'canonical은 실제 공개 주소와 하나만 일치해야 함: ' + canonical);
    if (noindex) fail(file, '공개 콘텐츠에 noindex가 있음');
    const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1]?.trim();
    const descriptionTags = meta.filter(tag => tag.name === 'description');
    const description = descriptionTags[0]?.content?.trim();
    if (!title || titles.has(title)) fail(file, '검색 제목 누락 또는 중복');
    if (descriptionTags.length !== 1 || !description || descriptions.has(description)) fail(file, '검색 설명 누락 또는 중복');
    titles.add(title);
    descriptions.add(description);
    const ogURLs = meta.filter(tag => tag.property === 'og:url');
    if (ogURLs.length !== 1 || ogURLs[0].content !== canonical) fail(file, 'og:url이 canonical과 일치하지 않음');
    if ((html.match(/<h1\b/gi) || []).length !== 1) fail(file, '페이지 제목 h1은 하나여야 함');
    if (/^(tools|fun)\//.test(file)) {
      const ads = [...html.matchAll(/<script\b[^>]*\bsrc=["']\/ad-banner-isolated\.js(?:\?[^"']*)?["'][^>]*>/gi)];
      if (ads.length !== 1) fail(file, '도구 광고 스크립트는 하나여야 함');
    }
    for (const [, src] of html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) {
      const asset = new URL(src, canonical);
      if (asset.origin === ORIGIN && !fs.existsSync(path.join(root, decodeURIComponent(asset.pathname).replace(/^\//, '')))) fail(file, '없는 로컬 스크립트: ' + asset.pathname);
    }
    for (const [, json] of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
      try {
        const data = JSON.parse(json);
        const nodes = Array.isArray(data) ? data : data['@graph'] || [data];
        for (const node of nodes) {
          if (node.url && node.url !== canonical) fail(file, '구조화 데이터의 url이 canonical과 다름');
        }
      } catch {
        fail(file, '구조화 데이터 JSON 문법 오류');
      }
    }
    // 스크립트 문자열 속 링크 대신 실제 HTML 앵커만 검사한다.
    const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
    const anchors = [...markup.matchAll(/<a\b[^>]*>/gi)].map(match => attrs(match[0])).filter(tag => tag.href);
    const localLinks = new Set();
    for (const anchor of anchors) {
      const url = new URL(anchor.href, canonical);
      if (url.origin !== ORIGIN) continue;
      const target = decodeURIComponent(url.pathname);
      const rel = target.replace(/^\//, '');
      if (!['', '.html'].includes(path.extname(rel))) {
        if (!fs.existsSync(path.join(root, rel))) fail(file, '없는 로컬 파일 링크: ' + target);
        continue;
      }
      const clean = target.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
      localLinks.add(clean);
    }
    pages.set(pathname, { file, canonical, html, meta, links: localLinks });
  }

  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  const listed = new Set();
  for (const [, entry] of sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = (entry.match(/<loc>(.*?)<\/loc>/) || [])[1];
    const lastmod = (entry.match(/<lastmod>(.*?)<\/lastmod>/) || [])[1];
    if (!loc || listed.has(loc)) fail('sitemap.xml', '주소 누락 또는 중복: ' + loc);
    listed.add(loc);
    if (!lastmod || !/^\d{4}-\d{2}-\d{2}$/.test(lastmod) || Number.isNaN(Date.parse(lastmod)) || new Date(lastmod).toISOString().slice(0, 10) !== lastmod) fail('sitemap.xml', '올바른 lastmod 날짜 필요: ' + loc);
  }
  const expected = new Set([...pages.values()].map(page => page.canonical));
  for (const url of expected) if (!listed.has(url)) fail('sitemap.xml', '공개 페이지 누락: ' + url);
  for (const url of listed) if (!expected.has(url)) fail('sitemap.xml', '없는 페이지·비표준 주소·검색 제외 페이지: ' + url);
  for (const page of pages.values()) {
    for (const link of page.links) if (!pages.has(link)) fail(page.file, '없는 페이지 링크: ' + link);
  }
  const reachable = new Set();
  function visit(url) {
    if (reachable.has(url) || !pages.has(url)) return;
    reachable.add(url);
    for (const link of pages.get(url).links) visit(link);
  }
  visit('/');
  for (const [url, page] of pages) if (!reachable.has(url)) fail(page.file, '홈에서 정적 링크로 도달할 수 없음');
  const home = pages.get('/');
  if (/home-guides-title|계산이\s*헷갈릴\s*때\s*가이드/.test(home?.html || '')) fail('index.html', '삭제한 홈 가이드 영역이 남아 있음');
  const toolCount = [...pages.keys()].filter(url => /^\/(tools|fun)\//.test(url)).length;
  const homeCount = home?.html.match(/id="directory-status"[^>]*>전체 도구 (\d+)개/);
  if (!homeCount || Number(homeCount[1]) !== toolCount) fail('index.html', '전체 도구 개수가 실제 공개 도구 수와 다름: ' + toolCount);
  for (const tag of home?.meta || []) {
    if (tag.name !== 'description' && tag.property !== 'og:description') continue;
    for (const [, count] of (tag.content || '').matchAll(/도구\s*(\d+)개/g)) {
      if (Number(count) !== toolCount) fail('index.html', '검색·공유 설명의 도구 수가 오래됨: ' + count);
    }
  }
  // 홈 위쪽 인기 도구 카드가 아니라 전체 도구 목록 안에 있어야 한다(목록에서 빠진 도구를 카드가 가리지 않도록).
  const directory = (home?.html.match(/<div class="goal-grid" id="tool-directory">([\s\S]*?)\n\s*<\/div>/) || [])[1] || '';
  const directoryLinks = new Set([...directory.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)]
    .map(match => decodeURIComponent(new URL(match[1], ORIGIN).pathname).replace(/\.html$/, '')));
  for (const [url, page] of pages) {
    if (/^\/(tools|fun)\//.test(url) && !directoryLinks.has(url)) fail(page.file, '홈 전체 도구 목록에 링크 누락');
  }
  const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
  if (!robots.includes('Sitemap: ' + ORIGIN + '/sitemap.xml')) fail('robots.txt', '사이트맵 주소 누락');
  if (/^Disallow:\s*\/\s*(?:#.*)?$/mi.test(robots)) fail('robots.txt', '전체 사이트 크롤링 차단');
  return { errors, pageCount: pages.size };
}

function assertSite(root) {
  const result = checkSite(root);
  if (result.errors.length) throw new Error('검색 기본 검사 실패:\n' + result.errors.map(error => 'FAIL - ' + error).join('\n'));
  console.log('PASS - 검색 기본 검사 (' + result.pageCount + '개 페이지: 제목·설명·canonical·구조화 데이터·사이트맵·내부 링크)');
  return result;
}

module.exports = { checkSite, assertSite };
if (require.main === module) {
  try { assertSite(path.join(__dirname, '..')); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
