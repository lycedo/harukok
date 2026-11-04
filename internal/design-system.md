# 하루콕 디자인 규칙 (코덱스·작업자용)

이 문서는 화면(HTML/CSS)을 만들거나 고칠 때 **반드시 먼저 읽는** 규칙입니다.
공개되지 않는 내부 문서이며 `dist/`에 들어가지 않습니다(`internal/`).

## 1. 목표

- **초등학생도 혼자 쓸 수 있을 것.** 글자는 크게, 누르는 곳은 넓게, 실행 버튼은 한 가지 모양으로.
- **모든 페이지가 한 사이트처럼 보일 것.** 페이지마다 색·글꼴·버튼을 따로 만들지 않는다.
- **기존 정체성 유지.** 종이색 배경 + 남색 글자 + 빨간 도장(‘콕’) + 로고 글꼴(Do Hyeon).

## 2. 구조: 공통 CSS 한 장

| 파일 | 역할 |
| --- | --- |
| `tools/site-ui.css` | **모든 페이지가 마지막에 불러오는 공통 규칙.** 글꼴·색·크기·버튼·입력창·접기·푸터·메뉴. |
| `tools/home.css` | 홈 화면 전용(검색·분류 버튼·도구 카드 배치)만 담당 |
| `tools/everyday-tools.css`, `tool-controls.css`, `image-tools.css` | 도구 종류별 보조 배치. 색·글꼴을 새로 정의하지 않는다 |
| 각 페이지 `<style>` | 그 페이지에만 있는 부품(로또 공, 상장 미리보기, 음식 캡슐 등)만 |

**원칙:** 두 페이지 이상에서 같은 모양이 필요하면 페이지 `<style>`에 복사하지 말고 `site-ui.css`에 넣는다.
`site-ui.css`가 `<head>`의 가장 마지막 스타일이므로, 같은 선택자 우선순위면 항상 이긴다.

### 새 페이지 `<head>` 필수 조각

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<!-- 페이지 전용 <style> 이 있다면 그 뒤에 -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Do+Hyeon&family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/tools/site-ui.css?v=20261025-ui">
</head>
```

`site-ui.css`를 고치면 위 링크의 `?v=` 값(날짜)을 **모든 HTML에서 같이** 바꿔 캐시를 갱신한다.

### 새 페이지 본문 뼈대

```html
<body>
<div class="wrap">            <!-- .wrap / .stub / .page 모두 같은 폭(640px) -->
  <nav class="site-nav" aria-label="주요 메뉴">
    <a class="site-nav-brand" href="/">하루<span>콕</span></a>
    <div class="site-nav-links"><a href="/#all-tools">전체 도구</a></div>
  </nav>
  <main>
    <h1>도구 이름</h1>
    <p class="tool-help"><strong>사용방법</strong> 한 문장으로 무엇을 하면 되는지.</p>
    <section class="sheet"> … 입력 폼 … </section>
    …
  </main>
  <footer><a href="/about">소개</a> · <a href="/privacy">개인정보처리방침</a> · <a href="mailto:…">의견 보내기</a><p>© 2026 하루콕</p></footer>
</div>
</body>
```

## 3. 토큰

`site-ui.css`의 `:root`에 정의되어 있다. 색을 새로 만들지 말고 이 값을 쓴다.

| 토큰 | 값 | 쓰임 |
| --- | --- | --- |
| `--paper` | `#F4F0E6` | 페이지 배경(무늬·그라데이션 없음) |
| `--surface` | `#FFFDF8` | 입력 카드 배경 |
| `--ink` | `#16233D` | 글자·제목·실행 버튼 |
| `--ink-soft` | `#3D4860` | 본문 보조 글자 |
| `--muted` | `#586070` | 도움말·주의 문구(종이 배경 대비 5:1 이상) |
| `--line` | `#CDC4AB` | 카드·구분선 |
| `--field-line` | `#8C8470` | 입력칸·고르는 버튼 테두리(흰 바탕 대비 3:1 이상) |
| `--stamp` | `#B23A2E` | 로고의 ‘콕’, 포커스 윤곽, 가이드 링크 강조 |
| `--yolk` | `#F0AD3D` | 따뜻한 강조(‘사용방법’ 상자 배경 `#F8E9C6`) |
| `--font-display` | Do Hyeon | **모든 제목**(h1~h4, 카드 제목) |
| `--font-body` | Noto Sans KR | 일반 본문·입력·버튼 |
| `--font-code` | 시스템 고정폭 글꼴 | 복사할 코드·고정폭 표의 `.code-output` 결과칸에만 사용 |

- 둥글기: 카드 `14px`, 입력칸·버튼 `10~14px`, 칩 `999px`.
- 본문 폭 `640px`.

## 4. 크기 기준 (어린이 사용성)

- 본문 `17px`, 도움말·표 `15~16px`. **`13px` 미만 글자 금지**(`check-design`이 막는다).
- 칸 이름(label) `17px` 굵게. 입력칸 글자 `18px` 이상, 높이 `52px` 이상.
- 누르는 곳(버튼·링크·요약줄·칩) **높이 48px 이상**. 실행 버튼은 `58px`.
- 아이콘만 있는 버튼 금지 — 글자를 함께 쓴다.
- 안내 문장은 짧게, 존댓말 한 문장 + 구체적인 행동(예: ‘계산하기’를 누르세요).
- 어려운 용어를 처음 쓸 때는 바로 뒤에 쉬운 말을 붙인다.

## 5. 부품 규칙

**실행 버튼은 모든 페이지에서 한 가지**: 남색 바탕, 흰 글자, 아래쪽 4px 그림자, 누르면 살짝 눌림.
클래스 `.primary` `.calc-btn` `.pull-btn` `.cta` `.cta-btn`, 링크형은 `a.home-btn`.
→ 페이지별로 노랑·빨강 등 다른 색 실행 버튼을 만들지 않는다.

**보조 버튼**: `.secondary`, `.share-btn` 등 — 흰 바탕 + 2px 테두리.

**고르는 버튼(칩·탭·선택 상자)**: 기본 흰 바탕 + 테두리, **선택되면 남색 바탕 + 흰 글자**
(`aria-pressed="true"` 또는 `.active`/`.selected`). 색만으로 구분하지 않고 글자 굵기·체크도 함께 쓴다.

**입력칸**: 2px 테두리, 포커스 시 남색 테두리 + 연한 그림자. 단위는 `.input-row` 안 `.unit`.
플레이스홀더는 예시(‘예: 4000’)이며 칸 이름을 대신하지 않는다.

**접는 설명**: `<details><summary>`만 쓴다. 화살표는 공통 CSS가 그린다(`.arrow` 직접 만들지 말 것).
긴 설명·FAQ·출처는 접는 곳으로, 입력·결과·**결과에 영향을 주는 주의**는 접지 않는다.

**‘사용방법’ 한 줄**: `<p class="tool-help"><strong>사용방법</strong> …</p>` — 제목 바로 아래, 한 문장.

**결과**: 숫자는 큼직하게(`.result-value`/`.result-amount`), 표준 글꼴 + 자릿수 정렬.
계산 한계·가정은 결과 바로 옆에 짧게.

## 6. 하지 말 것 (자동 검사 대상)

`node scripts/check-design.js`가 아래를 검사한다.

1. 공통 CSS·글꼴 링크 누락 / 옛 글꼴 링크(Pretendard, IBM Plex Mono, Noto Serif KR) 남김
2. 글자 크기 `13px` 미만
3. `font-family`에 개별 글꼴 직접 지정(상장 미리보기 `.cert*`만 예외) → `var(--font-display)`/`var(--font-body)` 사용
4. `<footer style="…">` 인라인 스타일(푸터는 공통 CSS)

그 밖에도:
- 페이지별 배경 무늬·그라데이션, 제목 색 바꾸기(예: 빨간 h1) 금지.
- 새 라이브러리·프레임워크·아이콘 폰트 추가 금지.
- 광고 영역(`.ad-banner*`)의 크기·구조는 건드리지 않는다.
- 상장 미리보기(`.cert*`)는 인쇄·저장용 디자인이므로 공통 글꼴 규칙에서 제외한다.

## 7. 확인 절차

```bash
node scripts/check-design.js     # 디자인 규칙
node scripts/build.js            # dist 빌드 + check-dist
for f in verify/verify-*.js; do node $f; done   # 기능 검증(모두 통과해야 함)
```

화면 확인(필수): 로컬에서 `dist`를 열어 **390px 너비**와 데스크톱에서 아래를 눈으로 본다.
홈 · 계산기 1개(입력→결과) · 로또 · 음식 · 사진 도구 · 가이드 목록 · 가이드 글 · 소개.
- 첫 화면에 제목 → 사용방법 → 첫 입력칸이 보이는가
- 가로 스크롤이 없는가, 글자가 잘리거나 겹치지 않는가
- 실행 버튼이 한눈에 보이고 한 가지 모양인가

## 8. 배포 규칙(요약)

- 이 저장소의 운영 반영(main 병합·harukok.com 배포)은 **사용자의 명시적인 허락 뒤에만** 한다.
- 커밋·푸시도 사용자가 요청했을 때만, 기본은 `dev` 브랜치.
- `internal/`, `verify/`, `scripts/`는 `dist/`에 포함하지 않는다(`scripts/build.js` 허용 목록 유지).

## 9. 변경 이력

- 2026-10-25: 공통 CSS(`tools/site-ui.css`) 도입. 제목 글꼴을 Do Hyeon으로, 본문을 Noto Sans KR로 통일.
  작은 글자(11~15px)를 13~16px로 올림. 실행 버튼을 남색 한 가지로 통일. 소개·개인정보 페이지에 상단 메뉴 추가.
