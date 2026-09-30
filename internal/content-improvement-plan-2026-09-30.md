# 하루콕 콘텐츠 축소 및 품질 정비 — Claude 구현 지시서

> 최신 변경: 이 문서의 삭제 정리 단계 이후, 사용자는 음식 도구 통합 복원·영화 추천 조건부 추가·로또 묶음 생성과 공유·전체 도구 접근 복구 방향을 승인했다. 후속 구현은 `internal/next-phase-strategy-2026-09-30.md`를 우선한다. 본 문서의 음식·영화 삭제 유지 및 로또 신규 기능 금지 지시는 후속 문서와 충돌하는 범위에서 더 이상 적용하지 않는다.

작성일: 2026-09-30
상태: 사용자 최신 방향을 반영한 개정안. 이전의 '삭제 보류·로또 기능 확장 우선' 계획을 대체한다.

## 1. 목표와 범위

사용자 지시: 로또는 보존하고, 우선 불필요한 페이지를 정리한 뒤 필요한 콘텐츠에 집중한다.
이번 작업의 목적은 공개 콘텐츠의 관리 범위를 줄이고 남은 페이지의 실용성과 신뢰도를 높이는 것이다. 삭제 자체가 애드센스 승인 조건은 아니며 승인을 보장하지 않는다. 삭제 대상으로 분류한 페이지가 정책 위반이라는 뜻도 아니다.

이 문서는 리뷰 담당자가 작성한 구현 지시서다. 문서 작성 중 사이트 코드는 변경하지 않았다. 아래 삭제·수정은 Claude의 구현 범위다. 커밋·푸시·배포·재신청은 별도 후속 지시 전까지 하지 않는다.

Search Console 제공 화면에서 로또 페이지는 37클릭/204노출, 홈은 10클릭/27노출, 상장은 2클릭/7노출이었다. 화면에 나타난 페이지 클릭 49건 중 로또가 약 76%다. 기간과 전체 행은 미확인이므로 전체 사이트 실적이나 시장 검색량으로 확대 해석하지 않는다.

## 2. 우선순위

1. 아래 확정된 작업 목록에 맞춰 공개 페이지를 축소하고 모든 연결을 정리한다.
2. 로또의 기존 URL과 기능을 보존한다. 기능 추가를 먼저 하지 않는다.
3. 남길 계산기·가이드의 명확한 오류, 적용 조건, 설명 충돌을 수정한다.
4. 실제 결과물로 남은 사이트를 검증해 보고한다.

착수 전에 저장소 지침, git 상태, 현재 파일을 확인한다. 사용자 미커밋 작업을 덮어쓰지 않는다. 아래 목록과 다른 새 파일이 있으면 이름만 보고 임의 삭제하지 말고 차이를 보고한다. 목록의 파일이 이미 변경되어 있으면 해당 변경을 검토하고 복구 가능한 Git 기록을 확인한 뒤 작업한다. 원격 저장소·이력·백업까지 삭제하지 않는다.

## 3. 보존할 도구 — 9개

| 파일 | 역할 |
|---|---|
| fun/lotto-generator.html | 실제 검색 유입이 확인된 핵심 도구. URL·생성·저장·공유·기록 보존 |
| tools/certificate-maker.html | 검색 클릭이 확인된 결과물 제작 도구. 보조 기능으로 유지 |
| tools/salary-calculator.html | 월급 확인 |
| tools/hourly-wage-calculator.html | 시급과 월급 환산 |
| tools/weekly-holiday-pay-calculator.html | 주휴수당 확인 |
| tools/severance-pay-calculator.html | 퇴직금 준비 |
| tools/annual-leave-pay-calculator.html | 미사용 연차수당 확인 |
| tools/unemployment-benefit-calculator.html | 실업급여 확인 |
| tools/parental-leave-calculator.html | 육아휴직 수입 계획 |

상장은 유입 근거가 있어 보존한다. 나머지 보조 도구는 유용성이 전혀 없어서가 아니라, 이번에 집중 관리할 범위를 줄이기 위해 정리한다.

## 4. 공개 사이트에서 삭제할 도구 — 22개

### 재미 도구 — 10개
- fun/watch-picker.html
- fun/pet-name-generator.html
- fun/night-snack-picker.html
- fun/name-compatibility.html
- fun/lunch-picker.html
- fun/fortune-today.html
- fun/dinner-picker.html
- fun/coupon-maker.html
- fun/cafe-drink-picker.html
- fun/baby-name-generator.html

### 기타 도구 — 12개
- tools/background-remover.html
- tools/age-calculator.html
- tools/due-date-calculator.html
- tools/dday-calculator.html
- tools/image-grid-splitter.html
- tools/paint-color-mixer.html
- tools/paint-mixer-simulator.html
- tools/year-end-tax-calculator.html
- tools/unit-converter.html
- tools/pet-food-calculator.html
- tools/pet-age-calculator.html
- tools/password-generator.html

이번에는 메뉴 뽑기를 통합하거나 물감 도구를 다시 개발하지 않는다. 위 페이지는 공개 소스에서 제거하고 빌드 결과에서도 없어야 한다. 홈에서 링크만 숨기거나 noindex만 붙인 상태로 남겨두지 않는다. 심사 때만 숨겼다가 복구하는 운영도 하지 않는다.

## 5. 가이드 정리

현재 로컬 저장소에는 과거 보고의 4편보다 많은 8편이 존재한다. 최신 파일을 읽어 실제 완성도를 확인한다.

### 유지·검토할 가이드 — 6편
- guides/salary-vs-payslip.html
- guides/severance-bonus-input.html
- guides/unemployment-benefit-guide.html
- guides/parental-leave-monthly-comparison.html
- guides/minimum-wage-monthly-hours.html
- guides/annual-leave-guide.html

위 6편과 guides/index.html을 유지한다. 새로 발견된 글을 검토 없이 '검증 완료'로 보고하지 않는다. 계산기와 가이드가 서로 연결되고 각 글이 독립적으로 이해될 수 있어야 한다.

### 함께 삭제할 가이드 — 2편
- guides/year-end-tax-steps.html
- guides/due-date-weeks.html

대응 도구를 이번 범위에서 제외하므로 해당 주제도 함께 정리한다.

## 6. 홈·탐색·배포 산출물 정리

- 홈은 '바로 쓰는 도구(로또·상장)', '월급 확인', '퇴사 준비', '육아휴직 준비', '관련 가이드'로 간결하게 정리한다.
- 로또는 접힌 메뉴에만 의존하지 않고 첫 화면에서 찾기 쉬워야 한다. 기존 URL과 제목의 핵심 의미는 유지한다.
- 빈 카테고리, 삭제 페이지 검색 결과, 추천 카드, 관련 도구 링크를 제거한다. 각 살아 있는 페이지 내부 링크까지 검색한다.
- sitemap.xml은 남기는 공개 페이지만 포함하게 한다. canonical·메타·구조화 데이터에서 삭제된 링크가 있는지도 확인한다.
- 소개 페이지는 실제 남은 제공 범위로 맞춘다. 개인정보처리방침은 현재 남은 기능과 실제 저장 방식에 맞춰 설명한다. 기록을 저장하는 다른 도구를 삭제했다고 로또 기록 설명까지 삭제하지 않는다.
- 남은 페이지에서 쓰는 공통 이미지·스크립트·스타일은 보존한다. 파일 이름이나 폴더만으로 공유 자산을 삭제하지 않는다.
- 기존 404.html을 유지한다. 대응 콘텐츠가 없는 삭제 URL을 홈으로 일괄 리디렉션하지 않는다. 이 작업에서는 삭제 URL이 실제 404로 응답하는 구성을 사용한다.
- Git에 남은 이력은 유지한다. 공개 폴더에 old/backup 같은 복사본을 만들지 않는다.
- internal/ 문서와 verify/ 등 개발 파일은 공개 빌드에서 제외되어야 한다. 로컬 빌드 검증을 실제 호스팅 비공개 확인으로 오인하지 않는다.
- 광고 코드·게시자 ID·ads.txt·Cloudflare 설정은 별도 요청 없이 변경하지 않는다.

## 7. 남는 콘텐츠의 필수 점검

### 로또
- 기존 동작과 localStorage 기록을 보존한다. 삭제 정비와 관계없는 5게임 생성, 포함·제외 옵션, 새 API 등의 추가는 보류한다.
- 각 게임은 1~45의 서로 다른 정수 6개인지 확인한다.
- 생성 방식 안내와 코드가 일치해야 한다. AI 당첨 예측·확률 상승·보장 표현을 추가하지 않는다.
- 한 게임 내부 중복과 과거 기록에서 같은 조합이 다시 나오는 것을 구분해 설명한다.
- 기존 복사/공유·이미지 저장 기능이 실제로 작동하는지 확인한다.

### 급여·퇴사·육아휴직 도구와 가이드
- 입력 전 적용 대상·지원하지 않는 상황을 알리고, 결과에 중요한 가정을 표시한다.
- 본문·예시·FAQ·JSON-LD·계산 로직이 서로 충돌하지 않도록 한다.
- 공식 근거의 적용 연도와 시행일을 확인한다. 예시 숫자는 실제 코드 출력만 맞춰보지 말고 공식 산식으로 독립 확인한다.
- 전체 세법·노동법을 재구현하지 않는다. 불확실한 예외를 임의로 자동 판정하지 않는다.
- 가이드 분량을 맞추려는 문단·중복 FAQ·미검증 경험담을 추가하지 않는다.

### 실업급여의 이미 발견된 문제
- 2025년 10월 입법예고만 남아 있다면 이후 확정 공식 자료로 근거를 갱신한다.
- '비자발적 이직만 가능' 본문과 정당한 자발적 이직 예외 FAQ의 충돌을 수정한다.
- 하한액 66,048원의 8시간 기준을 명확히 한다. 다른 근로시간까지 지원하는지 실제 코드를 확인하고 지원하지 않으면 그 범위를 안내한다.
- 확인 출발점:
  - https://moel.go.kr/news/enews/report/enewsView.do?news_seq=18736
  - https://1350.moel.go.kr/rtmview.do?id=1000329198&page=1&type=ALL
- 이미 로컬에서 해결된 사항은 중복 수정하지 않는다.

## 8. 검증 기준

1. 공개 도구 9개, 가이드 본문 6편 및 가이드 목록이 남는지 확인한다. 삭제 도구 22개·가이드 2편은 소스와 공개 산출물에 없어야 한다.
2. 삭제 URL을 참조하는 홈·검색·본문·관련 도구·sitemap 링크가 없는지 확인한다. 내부 변경 이력의 언급까지 무조건 삭제할 필요는 없다.
3. 남은 도구의 대표 입력·결과와 오류 입력을 실제 브라우저에서 확인한다. 로또의 기존 기록도 확인한다.
4. 모바일 375px 및 데스크톱에서 버튼·결과·가이드·키보드 이동을 확인한다. 에뮬레이션과 실기기 검증을 구분한다.
5. 남은 도구에 해당하는 기존 회귀 검증을 실행한다. 삭제한 디데이·연말정산 테스트는 실행 대상에서 정리한다. 테스트 도구 삭제가 공유 검증 도구를 깨뜨리지 않게 한다.
6. 기존 빌드 실행 전 초기화 대상 dist가 저장소 내부인지 확인한다. 깨끗한 빌드 후 삭제 파일 및 internal/·verify/·개발 Markdown 부재를 검사한다.
7. HTML/JS/JSON-LD와 FAQ 정합성을 확인한다. 근거 검증과 프로그램 테스트 통과를 별개로 보고한다.
8. 배포하지 않은 상태에서는 운영 사이트 삭제 완료·HTTP 404 확인이라고 쓰지 않는다. 배포 후 살아 있는 페이지와 삭제 URL의 실제 상태 코드를 확인하는 후속 항목을 남긴다.

## 9. 완료 보고

- 유지·삭제·수정한 파일 목록과 실제 개수.
- 홈 및 로또의 PC·모바일 화면.
- 검증한 기능과 실행 결과, 미확인 사항.
- 법령·수치 변경이 있다면 원문 URL과 적용 기준.
- 로또 URL·기존 기능·저장 기록 보존 여부.
- 배포 후 확인할 URL 목록과 예상 상태(유지 200, 삭제 404).
- 커밋·푸시·배포는 하지 않았다는 실제 상태 보고.

'이제 애드센스 통과 가능'이나 '전체 기능에 문제 없음'으로 결론내리지 않는다. 이번 정비 범위의 완료와 심사 결과는 별개다.

## 10. 추가 작업 — 폴더와 개발 문서 정리

사용자 추가 요청: 콘텐츠 정리와 함께 지저분한 폴더도 정리한다. 공개 URL을 바꾸는 대규모 구조 개편 대신, 내부 문서와 삭제 페이지의 잔여물을 정리한다.

### 목표 구조

```text
프로젝트 루트/
  index.html, about.html, privacy.html, 404.html
  sitemap.xml, robots.txt, ads.txt
  favicon.png, apple-touch-icon.png, og-image.png
  .gitignore
  fun/
    lotto-generator.html
  tools/
    보존 도구 8개 HTML
  guides/
    index.html + 보존 가이드 6편
  scripts/
    build.js
    check-dist.js
  verify/
    dom-shim.js + 보존 도구의 검증 스크립트
  internal/
    DEPLOY_GUIDE.md
    PROJECT_NOTES.md
    operator-notes.md
    content-improvement-plan-2026-09-30.md
  dist/  (빌드로 생성, 직접 편집하지 않음, Git 제외)
```

### 이동·정리 지시

1. 루트 DEPLOY_GUIDE.md와 PROJECT_NOTES.md를 읽고 internal/ 아래 같은 이름으로 이동한다. 대상 파일이 이미 있으면 덮어쓰지 말고 내용 차이를 확인한다. 내부 문서에서 해당 경로를 참조하는 곳도 갱신한다. 유용한 운영 메모·이력은 보존하되 현재 상태를 설명하는 부분은 새 구조와 일치시킨다.
2. internal/을 내부 문서의 단일 위치로 사용한다. 별도 docs/archive/backup 폴더를 계속 늘리지 않는다. 이 지시서의 파일 경로는 유지한다.
3. verify/에서 삭제 도구 전용 검증 파일을 제거한다: verify-year-end-tax.js, verify-unit-converter.js, verify-due-date.js, verify-dday.js, verify-age.js. 먼저 실제 내용을 확인해 보존 도구의 검증도 포함되어 있다면 해당 검증을 적절한 기존 파일로 남긴다.
4. verify-annual-leave.js, verify-unemployment.js, verify-severance.js, verify-salary.js, verify-hourly-wage.js와 공용 dom-shim.js는 유지한다. 실행 명령·문서·스크립트에서 제거한 검증 파일의 참조를 정리한다. 폴더 이름을 tests/로 바꾸는 작업은 하지 않는다.
5. scripts/build.js와 scripts/check-dist.js를 유지하고 새 공개 파일 목록에 맞는 검사만 조정한다. 문서 이동을 이유로 빌드 시스템이나 프레임워크를 교체하지 않는다.
6. dist/는 생성물이다. 소스와 dist를 양쪽에서 수동으로 수정하지 않는다. 초기화 대상의 절대 경로가 이 저장소의 dist인지 확인한 뒤 기존 빌드로 재생성한다. 삭제 페이지가 이전 산출물에 남아 있지 않은지 확인한다.
7. fun/에 로또 하나만 남더라도 폴더를 없애거나 tools/로 옮기지 않는다. /fun/lotto-generator 주소 보존이 폴더 모양보다 우선이다.
8. 루트의 아이콘·OG 이미지와 공개 기본 HTML은 그대로 둔다. 정리만을 위해 assets/ 또는 public/로 옮기거나 링크 경로를 전부 바꾸지 않는다.
9. .git과 Git 이력, 사용자 미커밋 작업을 삭제하지 않는다. 미추적 파일이라는 이유로 일괄 삭제하지 않는다. 삭제 목록 밖의 임시 파일은 용도와 참조를 확인한 뒤 불필요하다고 확인된 파일만 정리하고 보고한다.
10. Markdown이 internal/로 이동했다는 이유만으로 비공개라고 단정하지 않는다. 실제 dist에 내부 문서가 없는지 확인하며, 배포 후 접근 확인은 후속 검증으로 남긴다.

### 정리 완료 기준

- 공개 URL은 삭제 대상으로 정한 것 외에는 바뀌지 않는다.
- 개발 문서는 internal/에 모이고, 삭제 도구 전용 테스트와 끊어진 실행 명령이 남지 않는다.
- 보존 도구의 공유 자산·테스트·스크립트 참조가 정상이다.
- Git 변경 목록에서 이동·삭제·수정이 의도한 범위인지 확인한다.
- 최종 폴더 트리와 파일 이동 목록, 제거한 검증 파일, 실행한 빌드·테스트를 완료 보고에 추가한다.
