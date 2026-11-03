# 하루콕 작업 안내 (에이전트용)

한국어 정적 사이트(harukok.com, Cloudflare Pages). 빌드: `node scripts/build.js`.

## 화면(HTML/CSS)을 건드리기 전에

1. **`internal/design-system.md`를 먼저 읽는다.** 글꼴·색·크기·버튼 규칙이 거기 있다.
2. 모든 페이지는 마지막에 `/tools/site-ui.css`를 불러온다. 공통 모양은 이 파일에만 쓴다.
3. 작업이 끝나면 `node scripts/check-design.js`, `node scripts/build.js`, `verify/verify-*.js`를 모두 통과시킨다.
4. 390px 모바일과 데스크톱에서 직접 화면을 확인한다(초등학생도 쓸 수 있는 크기·단순함이 기준).

## 지켜야 할 것

- 운영(main) 병합·배포는 사용자가 명시적으로 허락한 뒤에만 한다. 커밋·푸시는 요청받았을 때만, 기본 브랜치는 `dev`.
- `internal/`, `verify/`, `scripts/`는 `dist/`에 넣지 않는다.
- 새 라이브러리·기능을 임의로 추가하지 않는다. 계산 로직·입력값·URL·저장 기능은 디자인 작업에서 바꾸지 않는다.
