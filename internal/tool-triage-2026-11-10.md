# 도구 정리 목록 — 2026-11-10

비공개 작업 문서입니다(배포 대상 아님). 이 목록은 2026-11-12에 dev 작업 트리에 적용했습니다(맨 아래 적용 기록 참고). 커밋·배포는 하지 않았습니다.

## 요약

| 처리 | 개수 | 뜻 |
| --- | ---: | --- |
| 유지 A (핵심) | 105 | 주소를 그대로 두고 내용·사용성을 보강 |
| 유지 B (관찰) | 50 | 일단 남기고 8주 뒤 노출이 없으면 삭제 |
| 통합 | 364 | 대표 도구의 옵션으로 흡수하고 옛 주소는 301 연결 |
| 삭제 | 481 | 페이지 제거(404), 사이트맵·홈에서 제외 |
| 합계 | 1000 | |

정리 후 남는 도구는 **155개**입니다.

## Search Console 실제 수치

Google Search Console, 2026-08-30 ~ 2026-11-08 (약 10주), 웹 검색 기준입니다.

- 사이트 전체: 클릭 89회, 노출 772회, 평균 게재순위 29.4위. 하루 평균 클릭 1.3회입니다.
- 노출이 한 번이라도 잡힌 주소는 34개이고, 그중 현재 도구에 해당하는 것은 28개입니다(나머지는 홈 21클릭·53노출, 개인정보 1클릭·29노출, 소개 15노출, 옛 가이드 2개 등).
- 로또 번호 생성기 한 페이지가 클릭 55회(62%)입니다. 인기 검색어 10개 중 8개가 로또 관련입니다("로또 번호 생성기" 15클릭·18.4위, "로또번호생성기" 6클릭·22.8위).
- 로또 외에 클릭이 난 검색어는 "태명 짓기 사이트"(6.0위), "물감 섞기 프로그램"(6.0위)입니다.
- 색인 현황(11월 6일 갱신): 색인 생성 30개, 미생성 22개(발견됨·미색인 12, 404 5, 리디렉션 4, 대체 페이지 1).
- 11월 3~8일에 추가한 약 960개 도구는 노출이 0입니다. 다만 추가된 지 2~7일이라 아직 수집 전일 수 있어, 0이라는 사실만으로 삭제 근거로 쓰지는 않았습니다.
- 옛 주소 수치는 현재 도구에 합쳤습니다: 디데이 계산기(72노출) → 날짜·디데이 계산기, 점심 뽑기(6노출) → 오늘 뭐 먹지?.

## 판단 기준

- 유지 A: 실제 검색 유입이 확인됐거나, 한국어로 흔히 찾는 작업이고 지금 구현으로 바로 쓸 수 있는 도구.
- 유지 B: 찾는 사람은 있지만 층이 좁거나 재설계가 필요한 도구.
- 통합: 입력이 같고 옵션만 다른 도구. 대표 도구 한 곳에 모읍니다.
- 삭제: 검색 수요가 사실상 없거나, 표를 직접 붙여 넣어야 해서 일반 사용자가 쓰기 어려운 도구.
- 클릭·노출은 Search Console 2026-08-30 ~ 2026-11-08 기준입니다. 11월 3~8일에 추가한 도구는 수치가 쌓이기 전이라 0으로 나옵니다.

## 유지 A (핵심) — 105개

| 분류 | 도구 | 주소 | 통합 후 이름 | 흡수 | 비고 | 클릭 | 노출 |
| --- | --- | --- | --- | ---: | --- | ---: | ---: |
| 생활 | 퍼센트·할인율 계산기 | `/tools/percent-calculator` |  |  |  | 0 | 13 |
| 생활 | 날짜·디데이 계산기 | `/tools/date-calculator` |  | 8 |  | 0 | 74 |
| 생활 | 영업일 계산기 | `/tools/business-day-calculator` |  | 2 |  | 0 | 0 |
| 생활 | 시간 합산 계산기 | `/tools/time-duration-calculator` |  | 3 |  | 0 | 0 |
| 생활 | 파일 용량 단위 변환기 | `/tools/file-size-converter` |  | 1 |  | 0 | 0 |
| 생활 | 만 나이 계산기 | `/tools/age-calculator` |  |  |  | 0 | 35 |
| 생활 | 평수 계산기 | `/tools/area-calculator` |  |  |  | 0 | 1 |
| 생활 | 단위 변환기 | `/tools/unit-converter` |  |  |  | 0 | 8 |
| 생활 | 레시피 인분 계산기 | `/tools/recipe-scale-calculator` |  | 2 |  | 0 | 0 |
| 생활 | 세계 시간 변환기 | `/tools/time-zone-converter` |  | 2 |  | 0 | 0 |
| 생활 | 러닝 페이스 계산기 | `/tools/pace-calculator` |  |  |  | 0 | 0 |
| 생활 | 카운트다운 타이머 | `/tools/countdown-timer` |  |  |  | 0 | 0 |
| 생활 | 스톱워치 | `/tools/stopwatch` |  |  |  | 0 | 0 |
| 생활 | 연비·주유비 계산기 | `/tools/fuel-consumption-calculator` |  |  |  | 0 | 0 |
| 생활 | 단가 비교 계산기 | `/tools/unit-price-calculator` |  | 3 |  | 0 | 0 |
| 생활 | 더치페이 계산기 | `/tools/split-bill-calculator` |  | 3 |  | 0 | 0 |
| 생활 | 박스 CBM·부피무게 계산기 | `/tools/shipping-volume-calculator` |  |  |  | 0 | 0 |
| 생활 | 전력 사용량·비용 계산기 | `/tools/electricity-cost-calculator` | 전기요금 계산기 | 1 |  | 0 | 0 |
| 생활 | 타일 수량 계산기 | `/tools/tile-calculator` | 셀프 인테리어 자재 계산기 | 11 | 타일·벽지·페인트·바닥재를 한 화면에서 선택 | 0 | 0 |
| 생활 | 교대 주기 근무표 만들기 | `/tools/rotation-schedule-generator` | 근무표·당번표 만들기 | 2 |  | 0 | 0 |
| 생활 | 리그 대진표 만들기 | `/tools/round-robin-schedule-generator` | 대진표 만들기 | 2 |  | 0 | 0 |
| 문서·개발 | 글자 수·바이트 세기 | `/tools/character-counter` |  | 4 |  | 0 | 1 |
| 문서·개발 | 중복 줄·빈 줄 정리 | `/tools/text-line-cleaner` | 텍스트 정리 도구 | 15 | 줄 정렬·번호·바꾸기·줄바꿈 제거를 옵션으로 | 0 | 0 |
| 문서·개발 | 두 글 비교하기 | `/tools/text-diff` |  | 3 |  | 0 | 0 |
| 문서·개발 | JSON 정리·검사 | `/tools/json-formatter` |  | 9 |  | 0 | 0 |
| 문서·개발 | URL 인코딩·디코딩 | `/tools/url-encoder` |  | 5 |  | 0 | 0 |
| 문서·개발 | Base64 인코딩·디코딩 | `/tools/base64-converter` |  | 3 |  | 0 | 0 |
| 문서·개발 | CSV·JSON 변환기 | `/tools/csv-json-converter` | JSON 변환기 | 8 |  | 0 | 0 |
| 문서·개발 | 유닉스 시간 변환기 | `/tools/unix-time-converter` |  | 5 |  | 0 | 0 |
| 문서·개발 | UUID 생성기 | `/tools/uuid-generator` |  | 5 |  | 0 | 0 |
| 문서·개발 | 정규식 테스트 | `/tools/regex-tester` |  | 2 |  | 0 | 0 |
| 문서·개발 | 진수 변환기 | `/tools/number-base-converter` |  | 2 |  | 0 | 0 |
| 문서·개발 | 비밀번호 생성기 | `/tools/password-generator` |  |  |  | 0 | 2 |
| 문서·개발 | SHA 해시 생성기 | `/tools/hash-generator` | 해시 생성기 | 4 |  | 0 | 0 |
| 문서·개발 | 영문 대소문자 변환기 | `/tools/text-case-converter` |  |  |  | 0 | 0 |
| 문서·개발 | 숫자 한글 읽기 | `/tools/korean-number-reader` | 숫자·금액 한글 변환 | 3 |  | 0 | 0 |
| 문서·개발 | CSV 열 선택기 | `/tools/csv-column-selector` | CSV 편집기 | 33 | 열 선택·정렬·필터·중복 제거·합계를 한 화면에서 | 0 | 0 |
| 문서·개발 | 한글 초성·자모 분리기 | `/tools/hangul-jamo-converter` |  |  |  | 0 | 0 |
| 문서·개발 | 한영 키보드 오타 변환기 | `/tools/korean-keyboard-converter` |  |  |  | 0 | 0 |
| 문서·개발 | 명찰·명함·이름표 만들기 | `/tools/name-badge-card-builder` |  |  |  | 0 | 0 |
| 문서·개발 | SRT·VTT 자막 변환 | `/tools/subtitle-srt-vtt-converter` | 자막 편집기 | 8 | 싱크 이동·형식 변환 중심 | 0 | 0 |
| 문서·개발 | 표로 차트 만들기 | `/tools/table-svg-chart-builder` | 그래프 만들기 |  |  | 0 | 0 |
| 문서·개발 | 줄·격자·점 노트 용지 | `/tools/printable-writing-paper` | 모눈종이·노트 용지 인쇄 |  |  | 0 | 0 |
| 문서·개발 | PDF 합치기 | `/tools/pdf-merge-files` |  | 3 |  | 0 | 0 |
| 문서·개발 | PDF 나누기 | `/tools/pdf-split-ranges` | PDF 나누기·페이지 정리 | 4 |  | 0 | 0 |
| 문서·개발 | PDF 페이지 번호 넣기 | `/tools/pdf-add-page-numbers` | PDF 번호·워터마크 넣기 | 3 |  | 0 | 0 |
| 문서·개발 | PDF 글자 추출 | `/tools/pdf-extract-selectable-text` |  | 1 |  | 0 | 0 |
| 문서·개발 | PDF를 PNG로 | `/tools/pdf-pages-to-png` | PDF를 이미지로 | 3 |  | 0 | 0 |
| 문서·개발 | ZIP 압축하기 | `/tools/zip-create-files` | ZIP 압축·풀기 | 11 |  | 0 | 0 |
| 문서·개발 | 텍스트 파일 인코딩 변환 | `/tools/text-file-encoding-converter` | 한글 깨짐 복구(인코딩 변환) |  |  | 0 | 0 |
| 문서·개발 | CSV 파일을 Excel로 변환 | `/tools/csv-file-to-xlsx` | 엑셀·CSV 변환 | 3 |  | 0 | 0 |
| 문서·개발 | QR 코드 만들기 | `/tools/qr-code-generator` | QR 코드 만들기·읽기 | 1 |  | 0 | 0 |
| 수학·측정 | 분수 계산기 | `/tools/fraction-calculator` |  | 1 |  | 0 | 0 |
| 수학·측정 | 평균·중앙값 계산기 | `/tools/average-calculator` | 평균·표준편차 계산기 | 3 |  | 0 | 0 |
| 수학·측정 | 학점 계산기 | `/tools/gpa-calculator` |  |  |  | 0 | 0 |
| 수학·측정 | 도형 넓이·둘레 계산기 | `/tools/geometry-calculator` | 도형 계산기 | 7 |  | 0 | 0 |
| 수학·측정 | 속력·거리·시간 계산기 | `/tools/speed-distance-time-calculator` |  |  |  | 0 | 0 |
| 수학·측정 | 비례식 계산기 | `/tools/ratio-calculator` |  |  |  | 0 | 0 |
| 월급 | 연봉 실수령액 계산기 | `/tools/salary-calculator` |  |  |  | 0 | 28 |
| 월급 | 시급 계산기 | `/tools/hourly-wage-calculator` |  |  |  | 0 | 54 |
| 월급 | 근무시간 계산기 | `/tools/work-time-calculator` |  |  |  | 0 | 0 |
| 월급 | 주휴수당 계산기 | `/tools/weekly-holiday-pay-calculator` |  |  |  | 0 | 11 |
| 월급 | 연말정산 예상세액 계산기 | `/tools/year-end-tax-calculator` |  |  |  | 0 | 33 |
| 퇴사 | 퇴직금 계산기 | `/tools/severance-pay-calculator` |  |  |  | 0 | 24 |
| 퇴사 | 실업급여 계산기 | `/tools/unemployment-benefit-calculator` |  |  |  | 0 | 3 |
| 퇴사 | 연차수당 계산기 | `/tools/annual-leave-pay-calculator` |  |  |  | 0 | 19 |
| 사진 | 사진 크기·용량 줄이기 | `/tools/image-resizer` |  |  |  | 0 | 0 |
| 사진 | 흰 배경 지우기 | `/tools/background-remover` |  | 1 |  | 0 | 18 |
| 사진 | 사진 자르기 | `/tools/image-cropper` |  | 3 |  | 0 | 0 |
| 사진 | 사진 회전·뒤집기 | `/tools/image-rotate-flip` |  |  |  | 0 | 0 |
| 사진 | 사진 합치기 | `/tools/image-merger` |  | 2 |  | 0 | 0 |
| 사진 | 사진 워터마크 넣기 | `/tools/image-watermark` |  |  |  | 0 | 0 |
| 사진 | 사진 모자이크 | `/tools/image-mosaic` |  | 1 |  | 0 | 0 |
| 사진 | 화면 비율 계산기 | `/tools/aspect-ratio-calculator` |  | 2 |  | 0 | 0 |
| 사진 | 사진 색상 추출기 | `/tools/image-color-picker` |  |  |  | 0 | 0 |
| 사진 | 사진 격자 나누기 | `/tools/image-grid-splitter` |  | 1 |  | 0 | 0 |
| 사진 | 사진 필터 | `/tools/image-filter` | 사진 보정·필터 | 9 |  | 0 | 0 |
| 사진 | 사진 위치·촬영정보 지우기 | `/tools/image-metadata-stripper` |  |  |  | 0 | 0 |
| 사진 | 사진을 PDF로 합치기 | `/tools/images-to-pdf-file` |  |  |  | 0 | 0 |
| 사진 | 사진으로 GIF 만들기 | `/tools/images-to-gif` | GIF 만들기·편집 | 3 |  | 0 | 0 |
| 추첨 | 로또 번호 생성기 | `/fun/lotto-generator` |  |  | 검색 클릭의 62% | 55 | 283 |
| 추첨 | 상장 만들기 | `/tools/certificate-maker` |  |  | 검색 클릭 확인된 도구 | 2 | 15 |
| 추첨 | 오늘 뭐 먹지? | `/fun/food-picker` |  |  |  | 0 | 6 |
| 추첨 | 이름 뽑기 | `/tools/random-picker` |  |  |  | 0 | 2 |
| 추첨 | 랜덤 숫자 추첨기 | `/tools/random-number-generator` |  | 1 |  | 0 | 0 |
| 추첨 | 팀 나누기 | `/tools/team-generator` |  |  |  | 0 | 3 |
| 추첨 | 오늘의 운세 | `/fun/fortune-today` |  |  | 검색 클릭 확인 | 1 | 13 |
| 육아 | 육아휴직급여 계산기 | `/tools/parental-leave-calculator` |  |  |  | 0 | 0 |
| 육아 | 태명 추천 | `/fun/baby-name-generator` |  |  | 검색 클릭 확인 | 2 | 12 |
| 육아 | 출산 예정일 계산기 | `/tools/due-date-calculator` |  |  |  | 1 | 12 |
| 만들기·색상 | 물감 배합 비율 계산기 | `/tools/paint-color-mixer` |  | 1 | 검색 클릭 3위. 물감 섞기와 서로 링크 | 6 | 62 |
| 만들기·색상 | 물감 섞기 | `/tools/paint-mixer-simulator` |  |  | 검색 클릭 확인 | 1 | 21 |
| 만들기·색상 | 색상 코드 변환기 | `/tools/color-converter` |  | 1 |  | 0 | 0 |
| 만들기·색상 | 용지 크기·픽셀 계산기 | `/tools/paper-size-calculator` |  |  |  | 0 | 0 |
| 만들기·색상 | 쿠폰 만들기 | `/fun/coupon-maker` |  |  |  | 0 | 13 |
| 만들기·색상 | 색상 팔레트 만들기 | `/tools/color-palette-generator` |  |  |  | 0 | 0 |
| 만들기·색상 | 오디오 자르기 | `/tools/audio-file-trimmer` | 오디오 편집기 | 14 | 자르기·합치기·볼륨·속도·페이드를 한 화면에서 | 0 | 0 |
| 반려동물 | 반려동물 나이 계산기 | `/tools/pet-age-calculator` |  |  |  | 0 | 9 |
| 금융 | 대출 상환 계산기 | `/tools/loan-payment-calculator` | 대출 이자 계산기 | 5 |  | 0 | 0 |
| 금융 | 복리 계산기 | `/tools/compound-interest-calculator` | 예적금·복리 계산기 | 3 |  | 0 | 0 |
| 금융 | 수익률 ROI 계산기 | `/tools/roi-calculator` | 수익률 계산기 | 3 |  | 0 | 0 |
| 금융 | 평균 매입가 계산기 | `/tools/average-purchase-price-calculator` | 물타기(평균 매입가) 계산기 |  |  | 0 | 0 |
| 금융 | 마진·마크업 계산기 | `/tools/margin-markup-calculator` |  | 3 |  | 0 | 0 |
| 금융 | 부가세 포함·별도 계산기 | `/tools/vat-calculator` |  |  |  | 0 | 0 |
| 금융 | 보증금·월세 전환 계산기 | `/tools/lease-deposit-converter` | 전월세 전환 계산기 | 1 |  | 0 | 0 |

## 유지 B (관찰) — 50개

| 분류 | 도구 | 주소 | 통합 후 이름 | 흡수 | 비고 | 클릭 | 노출 |
| --- | --- | --- | --- | ---: | --- | ---: | ---: |
| 생활 | 영상 저장 용량 계산기 | `/tools/video-storage-calculator` | 영상 용량·비트레이트 계산기 | 3 |  | 0 | 0 |
| 생활 | 희석 농도 계산기 | `/tools/dilution-calculator` |  | 2 |  | 0 | 0 |
| 생활 | 경사도·각도 계산기 | `/tools/ramp-slope-calculator` |  |  |  | 0 | 0 |
| 생활 | 월간 텍스트 달력 만들기 | `/tools/calendar-month-calculator` | 달력 만들기 |  | 인쇄용 달력으로 재설계해야 수요에 맞음 | 0 | 0 |
| 생활 | 뜨개 게이지 계산기 | `/tools/knitting-gauge-calculator` | 뜨개 계산기 | 4 |  | 0 | 0 |
| 생활 | 베이커스 퍼센트 계산기 | `/tools/bakers-percentage-calculator` | 베이킹 계산기 | 8 |  | 0 | 0 |
| 문서·개발 | HTML 엔티티 변환기 | `/tools/html-entity-converter` |  |  |  | 0 | 0 |
| 문서·개발 | 유니코드 변환기 | `/tools/unicode-converter` |  | 4 |  | 0 | 0 |
| 문서·개발 | 마크다운 표 만들기 | `/tools/markdown-table-generator` | 표 만들기(마크다운·HTML) | 3 |  | 0 | 0 |
| 문서·개발 | JWT 디코더 | `/tools/jwt-decoder` |  |  |  | 0 | 0 |
| 문서·개발 | 크론 표현식 만들기 | `/tools/cron-expression-builder` |  |  |  | 0 | 0 |
| 문서·개발 | 모스 부호 변환기 | `/tools/morse-code-converter` |  |  |  | 0 | 0 |
| 문서·개발 | 이메일 추출기 | `/tools/email-extractor` | 이메일·URL 추출기 | 2 |  | 0 | 0 |
| 문서·개발 | SQL INSERT 만들기 | `/tools/sql-values-generator` | SQL 문 만들기 | 2 |  | 0 | 0 |
| 문서·개발 | IPv4 서브넷 계산기 | `/tools/ipv4-subnet-calculator` | 서브넷 계산기 | 5 |  | 0 | 0 |
| 문서·개발 | HTML 메타 태그 만들기 | `/tools/html-meta-generator` | SEO 태그 생성기 | 13 |  | 0 | 0 |
| 문서·개발 | HTTP 상태 코드 조회 | `/tools/http-status-lookup` |  | 1 |  | 0 | 0 |
| 문서·개발 | XML 정리기 | `/tools/xml-formatter` |  |  |  | 0 | 0 |
| 문서·개발 | chmod 권한 변환기 | `/tools/unix-permission-converter` |  | 1 |  | 0 | 0 |
| 문서·개발 | 로렘 입숨 만들기 | `/tools/lorem-ipsum-generator` |  |  |  | 0 | 0 |
| 문서·개발 | 배송·우편 주소 라벨 | `/tools/shipping-address-labels` | 라벨 만들기 | 1 |  | 0 | 0 |
| 문서·개발 | 견적·청구 문서 만들기 | `/tools/commercial-document-builder` | 견적서 만들기 |  | 표 붙여넣기 대신 입력 폼으로 재설계 필요 | 0 | 0 |
| 문서·개발 | 이력서 문서 만들기 | `/tools/resume-document-builder` | 이력서 만들기 |  | 표 붙여넣기 대신 입력 폼으로 재설계 필요 | 0 | 0 |
| 문서·개발 | 조직도 만들기 | `/tools/organization-chart-builder` |  |  |  | 0 | 0 |
| 문서·개발 | 연락처 표·VCF 변환 | `/tools/contact-vcard-converter` | 연락처 엑셀·VCF 변환 | 3 |  | 0 | 0 |
| 문서·개발 | 메일 서명 만들기 | `/tools/email-signature-builder` |  |  |  | 0 | 0 |
| 문서·개발 | HTML 본문 글 추출 | `/tools/html-plain-text-extractor` | HTML 태그 제거 | 2 |  | 0 | 0 |
| 문서·개발 | 마크다운을 문서 HTML로 | `/tools/markdown-html-converter` | 마크다운 변환기 | 2 |  | 0 | 0 |
| 문서·개발 | 프롬프터 대본 보기 | `/tools/teleprompter-script` | 프롬프터 |  |  | 0 | 0 |
| 문서·개발 | 안내문 만들기 | `/tools/announcement-poster-document` | 안내문·전단지 만들기 | 2 |  | 0 | 0 |
| 문서·개발 | 대기·번호표 만들기 | `/tools/queue-number-tickets` |  |  |  | 0 | 0 |
| 문서·개발 | 서명 명부 만들기 | `/tools/attendance-signature-sheet` | 출석부·서명 명부 만들기 |  |  | 0 | 0 |
| 문서·개발 | PDF 여백 자르기 | `/tools/pdf-crop-pages` | PDF 여백·용지 크기 | 4 |  | 0 | 0 |
| 문서·개발 | PDF 정보 확인 | `/tools/pdf-document-info` | PDF 정보 확인·수정 | 3 |  | 0 | 0 |
| 문서·개발 | Word 텍스트 추출 | `/tools/docx-extract-text-file` | Word·PPT 글·사진 꺼내기 | 3 |  | 0 | 0 |
| 수학·측정 | 옴의 법칙 계산기 | `/tools/ohms-law-calculator` |  | 5 |  | 0 | 0 |
| 사진 | 파비콘 PNG 만들기 | `/tools/favicon-generator` | 파비콘·아이콘 만들기 | 2 |  | 0 | 0 |
| 사진 | 기울어진 문서 원근 보정 | `/tools/image-perspective-fix` | 문서 스캔 보정 | 1 |  | 0 | 0 |
| 추첨 | 이름궁합 테스트 | `/fun/name-compatibility` |  |  |  | 0 | 0 |
| 추첨 | 오늘 뭐 볼까 | `/fun/watch-picker` |  |  |  | 0 | 0 |
| 만들기·색상 | CSS 그림자 만들기 | `/tools/box-shadow-generator` | CSS 생성기 | 27 | 속성을 골라 쓰는 한 화면 | 0 | 0 |
| 만들기·색상 | 코드 조옮김 도구 | `/tools/chord-transposer` |  | 4 |  | 0 | 0 |
| 만들기·색상 | 사인파 소리 생성기 | `/tools/tone-generator` | 주파수 소리 생성기 | 1 |  | 0 | 0 |
| 만들기·색상 | BPM 탭 측정기 | `/tools/bpm-tapper` |  | 2 |  | 0 | 0 |
| 만들기·색상 | 책등 두께 계산기 | `/tools/book-spine-calculator` | 인쇄·제본 계산기 | 4 |  | 0 | 0 |
| 만들기·색상 | 피사계심도 계산기 | `/tools/depth-of-field-calculator` | 사진 촬영 계산기 | 6 |  | 0 | 0 |
| 반려동물 | 반려동물 사료량 계산기 | `/tools/pet-food-calculator` |  |  |  | 0 | 12 |
| 반려동물 | 반려동물 이름 뽑기 | `/fun/pet-name-generator` |  |  |  | 0 | 0 |
| 금융 | 물가상승·구매력 계산기 | `/tools/inflation-calculator` |  |  |  | 0 | 0 |
| 금융 | 광고 ROAS 계산기 | `/tools/ad-roas-calculator` |  | 1 |  | 0 | 0 |

## 통합 — 364개

대표 도구별로 흡수되는 도구입니다. 옛 주소는 대표 도구로 301 연결합니다.

### 날짜·디데이 계산기 (`/tools/date-calculator`) ← 8개

- 월말·개월 계산기 `/tools/month-end-calculator`
- 날짜 기간 겹침 계산기 `/tools/date-overlap-calculator`
- 연중 일수 날짜 변환기 `/tools/ordinal-date-converter`
- 기간 안 요일 날짜 찾기 `/tools/weekday-occurrences-calculator`
- 몇 번째 요일 날짜 찾기 `/tools/nth-weekday-calculator`
- 날짜 목록 생성기 `/tools/date-list-generator`
- 주차 계산기 `/tools/week-number-calculator`
- 월 주기 날짜 일정 만들기 `/tools/recurring-date-scheduler`

### 영업일 계산기 (`/tools/business-day-calculator`) ← 2개

- 마감 역산 작업일 계획기 `/tools/deadline-backplanner`
- 주문 마감·배송일 계산기 `/tools/delivery-working-day-estimator`

### 시간 합산 계산기 (`/tools/time-duration-calculator`) ← 3개

- 소수 시간 변환기 `/tools/decimal-hour-converter`
- 기간별 근무시간 합산기 `/tools/business-day-duration-calculator`
- 시간 구간 빼기 `/tools/time-interval-subtractor`

### 파일 용량 단위 변환기 (`/tools/file-size-converter`) ← 1개

- 다운로드 시간 계산기 `/tools/download-time-calculator`

### 레시피 인분 계산기 (`/tools/recipe-scale-calculator`) ← 2개

- 재료 부피·무게 환산기 `/tools/ingredient-volume-weight-calculator`
- 달걀 질량 대체 계산기 `/tools/egg-mass-substitution-calculator`

### 세계 시간 변환기 (`/tools/time-zone-converter`) ← 2개

- 시간대 겹침 계산기 `/tools/time-overlap-calculator`
- 도시별 근무시간 겹침 계산기 `/tools/timezone-overlap-calculator`

### 글자 수·바이트 세기 (`/tools/character-counter`) ← 4개

- 단어 빈도수 세기 `/tools/word-frequency-counter`
- 문자별 빈도 분석기 `/tools/character-frequency-counter`
- 읽기 시간 계산기 `/tools/reading-time-calculator`
- N그램 빈도 분석기 `/tools/ngram-counter`

### 텍스트 정리 도구 (`/tools/text-line-cleaner`) ← 15개

- 텍스트 줄 정렬기 `/tools/text-sorter`
- 텍스트 일괄 바꾸기 `/tools/text-replacer`
- 줄 앞뒤 글자 붙이기 `/tools/text-prefix-suffix`
- 줄 번호 붙이기 `/tools/text-numbering`
- 텍스트 나누기 `/tools/text-chunk-splitter`
- 텍스트 줄바꿈 도구 `/tools/text-wrapper`
- 공통 들여쓰기 제거 `/tools/text-indent-cleaner`
- 탭·공백 변환기 `/tools/tab-space-converter`
- 문단 정렬기 `/tools/paragraph-sorter`
- 문장 나누기 `/tools/sentence-splitter`
- 문단 안 줄바꿈 합치기 `/tools/text-line-unwrapper`
- 글이 들어간 줄 찾기 `/tools/text-find-line-positions`
- 두 글 목록 번갈아 합치기 `/tools/text-line-interleaver`
- 글자 수 맞춤 채우기 `/tools/text-column-padding`
- 문자 대응표 치환기 `/tools/text-substitution-mapper`

### 두 글 비교하기 (`/tools/text-diff`) ← 3개

- 목록 비교 도구 `/tools/text-list-comparison`
- 두 글 대조 인쇄 문서 `/tools/two-column-review-document`
- 목록 순서 변경 비교 `/tools/ordered-list-change-report`

### JSON 정리·검사 (`/tools/json-formatter`) ← 9개

- JSON 키 정렬기 `/tools/json-key-sorter`
- JSON 비교 도구 `/tools/json-diff`
- JSON 경로 추출기 `/tools/json-path-extractor`
- JSON 평탄화 도구 `/tools/json-flattener`
- JSON 문자열 이스케이프 `/tools/json-string-escape`
- JSON 빈 값 제거기 `/tools/json-prune-empty`
- JSON 깊이·자료형 분석기 `/tools/json-depth-analyzer`
- JSON 구조 뼈대 만들기 `/tools/json-structural-skeleton`
- JSON 값 위치 찾기 `/tools/json-leaf-value-search`

### URL 인코딩·디코딩 (`/tools/url-encoder`) ← 5개

- 쿼리스트링 분석기 `/tools/query-string-parser`
- URL 쿼리 만들기 `/tools/url-builder`
- URL 추적 매개변수 지우기 `/tools/url-list-tracking-remover`
- URL 정규화 도구 `/tools/url-normalizer`
- 퓨니코드 도메인 변환기 `/tools/punycode-converter`

### Base64 인코딩·디코딩 (`/tools/base64-converter`) ← 3개

- 사진 Base64 변환 `/tools/image-to-base64`
- Data URI 분석기 `/tools/data-uri-parser`
- Basic 인증 문자열 변환기 `/tools/http-basic-auth-converter`

### JSON 변환기 (`/tools/csv-json-converter`) ← 8개

- JSONL·JSON 변환기 `/tools/json-lines-converter`
- INI·JSON 변환기 `/tools/ini-json-converter`
- JSON TypeScript 변환기 `/tools/json-to-typescript`
- JSON Schema 만들기 `/tools/json-schema-generator`
- XML JSON 트리 변환기 `/tools/xml-json-converter`
- JSON 트리 XML 만들기 `/tools/json-xml-builder`
- 환경변수 파일 JSON 변환기 `/tools/dotenv-parser`
- JSON 환경변수 파일 만들기 `/tools/json-to-env`

### 유닉스 시간 변환기 (`/tools/unix-time-converter`) ← 5개

- ISO 8601 기간·초 변환기 `/tools/iso-duration-converter`
- HTTP 날짜 변환기 `/tools/http-date-converter`
- 엑셀 일련 날짜 변환기 `/tools/excel-serial-date-converter`
- NTP 타임스탬프 변환기 `/tools/ntp-timestamp-converter`
- Windows FILETIME 변환기 `/tools/windows-filetime-converter`

### UUID 생성기 (`/tools/uuid-generator`) ← 5개

- UUID 분석기 `/tools/uuid-inspector`
- ULID 생성기 `/tools/ulid-generator`
- 랜덤 ID 생성기 `/tools/random-id-generator`
- UUID v5 만들기 `/tools/uuid-v5-generator`
- UUID v7 만들기 `/tools/uuid-v7-generator`

### 정규식 테스트 (`/tools/regex-tester`) ← 2개

- 정규식 이스케이프 도구 `/tools/regex-escape-generator`
- 목록으로 정규식 만들기 `/tools/regex-alternation-builder`

### 진수 변환기 (`/tools/number-base-converter`) ← 2개

- 비트 연산 계산기 `/tools/bitwise-calculator`
- 2의 보수 변환기 `/tools/twos-complement-converter`

### 유니코드 변환기 (`/tools/unicode-converter`) ← 4개

- UTF-8 16진수 변환기 `/tools/utf8-hex-converter`
- 유니코드 정규화 도구 `/tools/unicode-normalizer`
- 보이지 않는 문자 검사기 `/tools/invisible-character-inspector`
- 전각·반각 변환기 `/tools/fullwidth-halfwidth-converter`

### 해시 생성기 (`/tools/hash-generator`) ← 4개

- CRC32 계산기 `/tools/crc32-calculator`
- Adler-32 체크섬 계산기 `/tools/adler32-calculator`
- HMAC-SHA1 인증코드 계산기 `/tools/hmac-sha1-generator`
- 파일 SHA-256 확인서 `/tools/file-sha256-manifest`

### 표 만들기(마크다운·HTML) (`/tools/markdown-table-generator`) ← 3개

- HTML 표 만들기 `/tools/html-table-generator`
- 마크다운 표 CSV 변환기 `/tools/markdown-table-to-csv`
- 텍스트 표 정렬 `/tools/text-table-aligner`

### 분수 계산기 (`/tools/fraction-calculator`) ← 1개

- 소수·분수 변환기 `/tools/decimal-fraction-converter`

### 평균·표준편차 계산기 (`/tools/average-calculator`) ← 3개

- 분산·표준편차 계산기 `/tools/statistics-calculator`
- 가중평균 계산기 `/tools/weighted-average-calculator`
- 백분위수·사분위수 계산기 `/tools/quantile-calculator`

### 도형 계산기 (`/tools/geometry-calculator`) ← 7개

- 부피 계산기 `/tools/volume-calculator`
- 겉넓이 계산기 `/tools/surface-area-calculator`
- 삼각형 계산기 `/tools/triangle-calculator`
- 피타고라스 계산기 `/tools/pythagorean-calculator`
- 타원 넓이·둘레 계산기 `/tools/ellipse-calculator`
- 정다각형 계산기 `/tools/regular-polygon-calculator`
- 원뿔대 부피·겉넓이 계산기 `/tools/cone-frustum-calculator`

### 흰 배경 지우기 (`/tools/background-remover`) ← 1개

- 투명·단색 여백 자르기 `/tools/image-auto-trim`

### 사진 자르기 (`/tools/image-cropper`) ← 3개

- 사진 기울기 미세 조정 `/tools/image-deskew`
- 사진 모서리 둥글게 `/tools/image-rounded-corners`
- 사진 테두리 넣기 `/tools/image-border`

### 사진 합치기 (`/tools/image-merger`) ← 2개

- 사진 목록 한 장으로 `/tools/image-contact-sheet`
- 두 사진 겹쳐 합성 `/tools/image-layer-blender`

### 사진 모자이크 (`/tools/image-mosaic`) ← 1개

- 사진 흐림 효과 `/tools/image-gaussian-blur`

### 화면 비율 계산기 (`/tools/aspect-ratio-calculator`) ← 2개

- 화면 PPI 계산기 `/tools/screen-ppi-calculator`
- 픽셀 종횡비 SAR·DAR 계산기 `/tools/pixel-aspect-ratio-calculator`

### 사진 격자 나누기 (`/tools/image-grid-splitter`) ← 1개

- 긴 스크린샷 나누기 `/tools/long-screenshot-split`

### 사진 보정·필터 (`/tools/image-filter`) ← 9개

- 사진 선명하게 `/tools/image-unsharp-mask`
- 사진 점 잡티 줄이기 `/tools/image-median-denoise`
- 이미지 특정 색 바꾸기 `/tools/image-color-replace`
- 사진 두 가지 색으로 `/tools/image-duotone`
- 이미지 색 단계 줄이기 `/tools/image-posterize`
- 사진 흑백 디더링 `/tools/image-floyd-dither`
- 사진 인쇄 망점 효과 `/tools/image-halftone`
- 사진 밝기 범위 자동 보정 `/tools/image-auto-levels`
- 사진 중간 밝기 보정 `/tools/image-gamma-adjust`

### 파비콘·아이콘 만들기 (`/tools/favicon-generator`) ← 2개

- 아이콘 ICO 만들기 `/tools/image-ico-generator`
- SVG를 PNG로 변환 `/tools/svg-to-png`

### 랜덤 숫자 추첨기 (`/tools/random-number-generator`) ← 1개

- 랜덤 날짜 뽑기 `/tools/random-date-generator`

### 물감 배합 비율 계산기 (`/tools/paint-color-mixer`) ← 1개

- 배합량 계산기 `/tools/mixing-amount-calculator`

### 색상 코드 변환기 (`/tools/color-converter`) ← 1개

- 색상 대비 확인 `/tools/color-contrast-checker`

### CSS 생성기 (`/tools/box-shadow-generator`) ← 27개

- 그라데이션 만들기 `/tools/gradient-generator`
- CSS 모서리 만들기 `/tools/border-radius-generator`
- CSS clamp 만들기 `/tools/css-clamp-generator`
- CSS Grid 만들기 `/tools/css-grid-generator`
- CSS Flex 만들기 `/tools/css-flex-generator`
- CSS px·rem·em·vw·vh 변환기 `/tools/css-unit-converter`
- CSS transform 생성기 `/tools/css-transform-generator`
- CSS 애니메이션 키프레임 만들기 `/tools/css-animation-generator`
- CSS 삼각형 만들기 `/tools/css-triangle-generator`
- CSS 글자 그림자 만들기 `/tools/css-text-shadow-generator`
- CSS filter 생성기 `/tools/css-filter-generator`
- CSS 고정 비율 박스 만들기 `/tools/css-aspect-ratio-generator`
- CSS 이미지 맞춤 만들기 `/tools/css-object-fit-generator`
- CSS 다단 문서 만들기 `/tools/css-columns-generator`
- CSS 스크롤 스냅 만들기 `/tools/css-scroll-snap-generator`
- CSS 고정 머리글 만들기 `/tools/css-sticky-header-generator`
- CSS 변수 묶음 만들기 `/tools/css-custom-property-generator`
- CSS 베지어 시간 함수 계산기 `/tools/css-cubic-bezier-evaluator`
- CSS 변형 기준점 만들기 `/tools/css-transform-origin-generator`
- CSS 포커스 테두리 만들기 `/tools/css-outline-generator`
- CSS 테두리 만들기 `/tools/css-border-generator`
- CSS 밑줄 꾸미기 `/tools/css-text-decoration-generator`
- CSS 글꼴 단축 속성 만들기 `/tools/css-font-shorthand-generator`
- CSS 배경 이미지 배치 만들기 `/tools/css-background-size-generator`
- CSS 페이드 마스크 만들기 `/tools/css-linear-mask-generator`
- CSS 다각형 자르기 만들기 `/tools/css-clip-path-polygon-generator`
- CSS 자동 번호 목록 만들기 `/tools/css-counter-list-generator`

### 단가 비교 계산기 (`/tools/unit-price-calculator`) ← 3개

- 실사용량 반영 대용량 비교기 `/tools/bulk-usable-price-comparison`
- 묶음 구매 단위 원가 계산기 `/tools/purchase-pack-unit-cost`
- 매장별 장바구니 비교기 `/tools/shopping-basket-store-comparison`

### 더치페이 계산기 (`/tools/split-bill-calculator`) ← 3개

- 모임 비용 정산 계산기 `/tools/expense-settlement-calculator`
- 여행 숙박일별 비용 정산기 `/tools/trip-stay-cost-splitter`
- 거주일 반영 공과금 배분기 `/tools/utility-occupancy-split`

### 전기요금 계산기 (`/tools/electricity-cost-calculator`) ← 1개

- 시간대별 가전 전기요금 계산기 `/tools/time-of-use-appliance-cost`

### 영상 용량·비트레이트 계산기 (`/tools/video-storage-calculator`) ← 3개

- 영상 비트레이트 단계 계산기 `/tools/video-bitrate-ladder-calculator`
- PCM 오디오 용량 계산기 `/tools/audio-storage-calculator`
- 촬영 백업 용량 계획기 `/tools/photo-backup-storage-calculator`

### 셀프 인테리어 자재 계산기 (`/tools/tile-calculator`) ← 11개

- 벽지 소요량 계산기 `/tools/wallpaper-calculator`
- 페인트 소요량 계산기 `/tools/paint-coverage-calculator`
- 방 벽면적 계산기 `/tools/wall-area-calculator`
- 콘크리트 소요량 계산기 `/tools/concrete-volume-calculator`
- 흙·자갈 소요량 계산기 `/tools/soil-gravel-calculator`
- 벽돌 수량 계산기 `/tools/brick-quantity-calculator`
- 줄눈재 소요량 계산기 `/tools/grout-quantity-calculator`
- 데크 판재 수량 계산기 `/tools/deck-board-calculator`
- 바닥재 줄·끝폭 배치 계산기 `/tools/laminate-course-layout-calculator`
- 잔디 롤 수량 계산기 `/tools/turf-roll-calculator`
- 엇갈림 무늬 벽지 재단 계산기 `/tools/wallpaper-half-drop-calculator`

### 옴의 법칙 계산기 (`/tools/ohms-law-calculator`) ← 5개

- 전력·전압·전류 계산기 `/tools/electrical-power-calculator`
- 직렬·병렬 저항 계산기 `/tools/resistor-series-parallel`
- LED 저항 계산기 `/tools/led-resistor-calculator`
- 분압 저항 계산기 `/tools/voltage-divider-calculator`
- 저항 색띠 계산기 `/tools/resistor-color-code`

### 이메일·URL 추출기 (`/tools/email-extractor`) ← 2개

- URL 추출기 `/tools/url-extractor`
- 구분자 사이 글 추출 `/tools/text-between-extractor`

### SQL 문 만들기 (`/tools/sql-values-generator`) ← 2개

- SQL IN절 만들기 `/tools/sql-in-clause-generator`
- CSV SQL UPDATE 만들기 `/tools/csv-to-sql-update`

### 코드 조옮김 도구 (`/tools/chord-transposer`) ← 4개

- 화음 구성음 만들기 `/tools/chord-tone-generator`
- 음계 생성기 `/tools/scale-generator`
- 장조·단조 조표 찾기 `/tools/key-signature-calculator`
- 5도권 생성기 `/tools/circle-of-fifths-generator`

### 주파수 소리 생성기 (`/tools/tone-generator`) ← 1개

- 음표 주파수 계산기 `/tools/note-frequency-calculator`

### BPM 탭 측정기 (`/tools/bpm-tapper`) ← 2개

- BPM 딜레이 계산기 `/tools/bpm-delay-calculator`
- 박자·마디 길이 계산기 `/tools/time-signature-calculator`

### 근무표·당번표 만들기 (`/tools/rotation-schedule-generator`) ← 2개

- 청소 당번 순환표 만들기 `/tools/cleaning-duty-rotation-generator`
- 행사 스태프 순환 배치기 `/tools/event-staff-rota-generator`

### 희석 농도 계산기 (`/tools/dilution-calculator`) ← 2개

- 소금물 질량농도 계산기 `/tools/brine-salinity-calculator`
- 음료 희석·얼음 질량 계산기 `/tools/beverage-dilution-calculator`

### 서브넷 계산기 (`/tools/ipv4-subnet-calculator`) ← 5개

- IP 범위 CIDR 변환기 `/tools/cidr-range-calculator`
- CIDR 서브넷 나누기 `/tools/cidr-subnet-splitter`
- IPv4 정수 변환기 `/tools/ipv4-integer-converter`
- IPv6 서브넷 범위 계산기 `/tools/ipv6-subnet-calculator`
- IPv6 주소 펼치기 `/tools/ipv6-expander`

### 숫자·금액 한글 변환 (`/tools/korean-number-reader`) ← 3개

- 숫자 영어 읽기 `/tools/number-to-english-words`
- 금액과 한글 금액 대조 `/tools/korean-amount-word-audit`
- 로마 숫자 변환기 `/tools/roman-numeral-converter`

### 대출 이자 계산기 (`/tools/loan-payment-calculator`) ← 5개

- 대출 조건 비교 계산기 `/tools/loan-comparison-calculator`
- 조기상환 효과 계산기 `/tools/early-loan-repayment-calculator`
- 고정금액 상환기간 계산기 `/tools/debt-payoff-calculator`
- 소득 대비 상환액 비율 계산기 `/tools/debt-income-ratio-calculator`
- 현금·할부 총지출 비교기 `/tools/cash-installment-price-comparison`

### 예적금·복리 계산기 (`/tools/compound-interest-calculator`) ← 3개

- 목표 저축액 계산기 `/tools/savings-goal-calculator`
- 정기 적립 계산기 `/tools/recurring-savings-calculator`
- 실효 연이율 계산기 `/tools/effective-interest-calculator`

### 수익률 계산기 (`/tools/roi-calculator`) ← 3개

- 연평균 성장률 계산기 `/tools/cagr-calculator`
- 배당금·배당수익률 계산기 `/tools/dividend-calculator`
- 포트폴리오 수익률 계산기 `/tools/portfolio-return-calculator`

### 마진·마크업 계산기 (`/tools/margin-markup-calculator`) ← 3개

- 판매 수수료 계산기 `/tools/sales-commission-calculator`
- 목표 순이익 판매가 계산기 `/tools/target-selling-price-calculator`
- 손익분기점 계산기 `/tools/break-even-calculator`

### 인쇄·제본 계산기 (`/tools/book-spine-calculator`) ← 4개

- 인쇄 도련·안전선 계산기 `/tools/print-bleed-calculator`
- 책 표지 펼침 크기 계산기 `/tools/cover-spread-calculator`
- 용지 평량·총무게 계산기 `/tools/paper-gsm-weight-calculator`
- 인쇄 용지 배치 계산기 `/tools/print-sheet-layout-calculator`

### CSV 편집기 (`/tools/csv-column-selector`) ← 33개

- 표 행열 바꾸기 `/tools/text-transpose`
- 표 열 추출기 `/tools/text-column-extractor`
- CSV 구분자 변환기 `/tools/csv-delimiter-converter`
- CSV 행 조건 필터 `/tools/csv-row-filter`
- CSV 행 정렬기 `/tools/csv-sorter`
- CSV 중복 행 제거기 `/tools/csv-deduplicator`
- CSV 키 결합기 `/tools/csv-joiner`
- CSV 그룹 합계 계산기 `/tools/csv-group-sum`
- CSV 피벗 합계 만들기 `/tools/csv-pivot-table`
- CSV 셀 공백 정리기 `/tools/csv-cell-trimmer`
- CSV 수식 시작 문자 처리 `/tools/csv-formula-guard`
- CSV 열 자료형 분석기 `/tools/csv-schema-profiler`
- CSV 열 이름 바꾸기 `/tools/csv-column-renamer`
- CSV 행 번호 추가기 `/tools/csv-row-numberer`
- CSV 세로 펼치기 `/tools/csv-unpivot`
- CSV 값 빈도표 `/tools/csv-column-frequency`
- CSV 빈칸 채우기 `/tools/csv-null-filler`
- CSV 교차 빈도표 `/tools/csv-cross-tab-count`
- CSV 행 구간 선택기 `/tools/csv-row-range`
- CSV 열 나누기 `/tools/csv-split-column`
- CSV 열 합치기 `/tools/csv-merge-columns`
- CSV 두 열 산술 계산기 `/tools/csv-column-calculator`
- CSV 누적 합계 계산기 `/tools/csv-running-total`
- CSV 셀 대소문자 변환기 `/tools/csv-cell-case-converter`
- CSV 미일치 행 찾기 `/tools/csv-anti-join`
- CSV 양쪽 전체 결합기 `/tools/csv-full-outer-join`
- CSV 키 기준 행 갱신기 `/tools/csv-row-update-by-key`
- CSV 데이터 차이 비교기 `/tools/csv-dataset-diff`
- CSV 파일 행 합치기 `/tools/csv-row-append`
- CSV 값 대응표 바꾸기 `/tools/csv-column-value-mapper`
- CSV 열 이름 일괄 정리 `/tools/csv-header-normalizer`
- CSV 빈 행·열 제거기 `/tools/csv-drop-empty-rows-columns`
- CSV 셀 줄바꿈 정리 `/tools/csv-cell-linebreak-cleaner`

### SEO 태그 생성기 (`/tools/html-meta-generator`) ← 13개

- 사이트맵 XML 만들기 `/tools/sitemap-generator`
- robots.txt 만들기 `/tools/robots-txt-generator`
- robots.txt 문법 검사기 `/tools/robots-txt-auditor`
- 사이트맵 XML 검사기 `/tools/sitemap-xml-auditor`
- 웹 앱 manifest 만들기 `/tools/web-app-manifest-generator`
- 이동 경로 JSON-LD 만들기 `/tools/breadcrumb-jsonld-generator`
- FAQ JSON-LD 만들기 `/tools/faq-jsonld-generator`
- 조직 JSON-LD 만들기 `/tools/organization-jsonld-generator`
- 글 JSON-LD 만들기 `/tools/article-jsonld-generator`
- 행사 JSON-LD 만들기 `/tools/event-jsonld-generator`
- 상품 JSON-LD 만들기 `/tools/product-jsonld-generator`
- 영상 JSON-LD 만들기 `/tools/video-jsonld-generator`
- 지역 사업체 JSON-LD 만들기 `/tools/local-business-jsonld-generator`

### HTTP 상태 코드 조회 (`/tools/http-status-lookup`) ← 1개

- 파일 확장자 MIME 조회 `/tools/mime-type-lookup`

### 전월세 전환 계산기 (`/tools/lease-deposit-converter`) ← 1개

- 임대수익률 계산기 `/tools/rent-yield-calculator`

### 광고 ROAS 계산기 (`/tools/ad-roas-calculator`) ← 1개

- CPC·CPM·CTR 계산기 `/tools/ad-metrics-calculator`

### 뜨개 계산기 (`/tools/knitting-gauge-calculator`) ← 4개

- 뜨개 실 소요량 계산기 `/tools/yarn-length-calculator`
- 실 교체 볼 수 계산기 `/tools/yarn-substitution-calculator`
- 코바늘 원형 늘림 배치기 `/tools/crochet-circle-increase-planner`
- 래글런 늘림 단수 계산기 `/tools/raglan-increase-calculator`

### 베이킹 계산기 (`/tools/bakers-percentage-calculator`) ← 8개

- 반죽 수분율 계산기 `/tools/dough-hydration-calculator`
- 발효종 먹이 비율 계산기 `/tools/starter-feeding-calculator`
- 발효종 포함 밀가루 배분 계산기 `/tools/preferment-flour-calculator`
- 생이스트·건조이스트 환산기 `/tools/yeast-conversion-calculator`
- 베이킹 팬 크기 환산기 `/tools/baking-pan-converter`
- 밀가루 단백질 배합 계산기 `/tools/flour-protein-blend-calculator`
- 식빵틀 반죽 투입량 계산기 `/tools/bread-tin-dough-calculator`
- 피자 크기별 반죽 분할 계산기 `/tools/pizza-dough-ball-calculator`

### 사진 촬영 계산기 (`/tools/depth-of-field-calculator`) ← 6개

- 사진 노출값 EV 계산기 `/tools/exposure-value-calculator`
- ND 필터 노출시간 계산기 `/tools/nd-filter-calculator`
- 등가 노출 계산기 `/tools/exposure-equivalence-calculator`
- 렌즈 화각 계산기 `/tools/field-of-view-calculator`
- 초점거리 환산 계산기 `/tools/crop-factor-calculator`
- 타임랩스 계산기 `/tools/timelapse-calculator`

### chmod 권한 변환기 (`/tools/unix-permission-converter`) ← 1개

- umask 권한 계산기 `/tools/unix-umask-calculator`

### 대진표 만들기 (`/tools/round-robin-schedule-generator`) ← 2개

- 토너먼트 대진·부전승 만들기 `/tools/knockout-bracket-generator`
- 리그 승점 순위 계산기 `/tools/league-standings-calculator`

### 라벨 만들기 (`/tools/shipping-address-labels`) ← 1개

- 상품 바코드 라벨 `/tools/barcode-label-document`

### 연락처 엑셀·VCF 변환 (`/tools/contact-vcard-converter`) ← 3개

- VCF 주소록 합치기 `/tools/vcard-file-merger`
- 연락처 중복 내용 합치기 `/tools/contact-duplicate-merger`
- LDIF 주소록 표 변환 `/tools/ldif-contact-converter`

### HTML 태그 제거 (`/tools/html-plain-text-extractor`) ← 2개

- 워드 붙여넣기 HTML 정리 `/tools/word-html-cleaner`
- 마크다운 일반 글 변환 `/tools/markdown-plain-text-converter`

### 마크다운 변환기 (`/tools/markdown-html-converter`) ← 2개

- 마크다운 링크 만들기 `/tools/markdown-link-generator`
- 마크다운 제목 목차 추출 `/tools/markdown-heading-outline`

### 자막 편집기 (`/tools/subtitle-srt-vtt-converter`) ← 8개

- SRT 자막 시간 이동기 `/tools/srt-time-shifter`
- 가까운 자막 합치기 `/tools/subtitle-nearby-cue-merger`
- 자막을 대본 글로 `/tools/subtitle-transcript-extractor`
- 자막 번호 정리 `/tools/subtitle-sequence-renumber`
- 자막 시간·읽기량 검사 `/tools/subtitle-timing-audit`
- 자막 줄 길이 정리 `/tools/subtitle-line-wrapper`
- 자막 속도 보정 `/tools/subtitle-speed-corrector`
- 자막 화자별 대본 `/tools/subtitle-speaker-report`

### 안내문·전단지 만들기 (`/tools/announcement-poster-document`) ← 2개

- 연락처 떼는 전단지 `/tools/tearoff-contact-flyer`
- 큰 글씨 문서 만들기 `/tools/large-print-document`

### PDF 합치기 (`/tools/pdf-merge-files`) ← 3개

- PDF 앞뒤 스캔 합치기 `/tools/pdf-interleave-scans`
- PDF 표지 넣기 `/tools/pdf-insert-text-cover`
- PDF 빈 페이지 넣기 `/tools/pdf-insert-blank-page`

### PDF 나누기·페이지 정리 (`/tools/pdf-split-ranges`) ← 4개

- PDF 페이지 추출 `/tools/pdf-extract-pages`
- PDF 페이지 삭제 `/tools/pdf-delete-pages`
- PDF 페이지 순서 바꾸기 `/tools/pdf-reorder-pages`
- PDF 회전 `/tools/pdf-rotate-pages`

### PDF 번호·워터마크 넣기 (`/tools/pdf-add-page-numbers`) ← 3개

- PDF 글자 워터마크 `/tools/pdf-text-watermark`
- PDF 이미지 워터마크 `/tools/pdf-image-watermark`
- PDF 글자 추가 `/tools/pdf-add-text`

### PDF 여백·용지 크기 (`/tools/pdf-crop-pages`) ← 4개

- PDF 여백 추가 `/tools/pdf-add-margins`
- PDF 용지 크기 변경 `/tools/pdf-resize-pages`
- PDF 두 쪽 모아찍기 `/tools/pdf-two-up-print`
- PDF 소책자 배열 `/tools/pdf-booklet-layout`

### PDF 정보 확인·수정 (`/tools/pdf-document-info`) ← 3개

- PDF 문서 정보 수정 `/tools/pdf-edit-metadata`
- PDF 주석 지우기 `/tools/pdf-remove-annotations`
- PDF 양식 고정 `/tools/pdf-flatten-form-fields`

### PDF 글자 추출 (`/tools/pdf-extract-selectable-text`) ← 1개

- PDF 링크 추출 `/tools/pdf-export-links`

### PDF를 이미지로 (`/tools/pdf-pages-to-png`) ← 3개

- PDF 미리보기 모음 `/tools/pdf-contact-sheet`
- PDF를 이미지 PDF로 `/tools/pdf-rasterize-pages`
- PDF 흑백 변환 `/tools/pdf-grayscale-pages`

### ZIP 압축·풀기 (`/tools/zip-create-files`) ← 11개

- ZIP 압축 풀기 `/tools/zip-extract-files`
- ZIP 파일 합치기 `/tools/zip-merge-archives`
- ZIP 파일 골라 저장 `/tools/zip-filter-files`
- ZIP 안 파일 이름 바꾸기 `/tools/zip-rename-entries`
- ZIP 중복 파일 제거 `/tools/zip-remove-duplicate-files`
- ZIP을 TAR로 변환 `/tools/zip-to-tar-file`
- TAR 파일 만들기 `/tools/tar-create-files`
- TAR 압축 풀기 `/tools/tar-extract-files`
- TAR를 ZIP으로 변환 `/tools/tar-to-zip-file`
- GZIP 압축하기 `/tools/gzip-compress-file`
- GZIP 압축 풀기 `/tools/gzip-decompress-file`

### Word·PPT 글·사진 꺼내기 (`/tools/docx-extract-text-file`) ← 3개

- Word 사진 추출 `/tools/docx-extract-images`
- PowerPoint 텍스트 추출 `/tools/pptx-extract-slide-text`
- PowerPoint 사진 추출 `/tools/pptx-extract-images`

### 엑셀·CSV 변환 (`/tools/csv-file-to-xlsx`) ← 3개

- Excel을 CSV로 변환 `/tools/xlsx-export-csv-files`
- Excel을 JSON으로 변환 `/tools/xlsx-export-json-file`
- HTML 표를 엑셀 표로 `/tools/html-table-tsv-extractor`

### 문서 스캔 보정 (`/tools/image-perspective-fix`) ← 1개

- 스캔 문서 흑백 정리 `/tools/image-scan-cleanup`

### GIF 만들기·편집 (`/tools/images-to-gif`) ← 3개

- GIF 프레임 추출 `/tools/gif-frame-extractor`
- GIF 크기·속도 편집 `/tools/gif-file-editor`
- GIF를 움직이는 PNG로 `/tools/gif-to-apng`

### 오디오 편집기 (`/tools/audio-file-trimmer`) ← 14개

- 오디오 이어 붙이기 `/tools/audio-file-merger`
- 오디오 겹쳐 합치기 `/tools/audio-file-mixer`
- 오디오 볼륨 일정하게 `/tools/audio-peak-normalizer`
- 오디오 앞뒤 무음 자르기 `/tools/audio-silence-trimmer`
- 오디오 페이드 인·아웃 `/tools/audio-fade-editor`
- 오디오 재생 속도 바꾸기 `/tools/audio-playback-speed`
- 오디오 샘플레이트 변환 `/tools/audio-sample-rate-converter`
- 스테레오를 모노로 `/tools/audio-mono-converter`
- 오디오 거꾸로 재생 `/tools/audio-file-reverser`
- 오디오 최대 볼륨 제한 `/tools/audio-peak-limiter`
- 오디오 작은 배경음 줄이기 `/tools/audio-noise-gate`
- 오디오 저음·중음·고음 조절 `/tools/audio-three-band-eq`
- 오디오 파형 이미지 저장 `/tools/audio-waveform-image`
- 오디오 음량·클리핑 검사 `/tools/audio-file-analysis`

### QR 코드 만들기·읽기 (`/tools/qr-code-generator`) ← 1개

- 사진 QR 코드 읽기 `/tools/qr-code-reader`

## 삭제 — 481개

### 학습·이론용(11월 8일 정리 방침과 같은 기준) — 17개

- **숫자 반올림**: 반올림·올림·버림 계산기
- **확률·분석**: 선형회귀 계산기
- **전기·전자**: 주파수·주기 변환기
- **물리·단위**: 밀도 계산기, RPM·각속도 변환기
- **유체·열전달**: 유량 계산기
- **소리·빛**: 데시벨·비율 변환기
- **흩어짐·이상치**: IQR 이상치 계산기
- **순위·연관성**: 동순위 순위 계산기, 도수분포표 계산기, 예측오차 MAE·RMSE 계산기
- **추세·정규화**: 단순 이동평균 계산기, 최소·최대 정규화 계산기
- **신뢰구간·표본수**: 설문 표본수 계산기
- **재료·열·구동**: 다층 열저항 계산기, 풀리·벨트 속도 계산기
- **교류·삼상**: 삼상 전력 계산기

### 특정 취미·작업 전용으로 검색 수요가 낮음 — 74개

- **시간·일정**: 시계 각도 계산기, 회의 시간·비용 계산기
- **생활·설계**: 인쇄 확대·축소 계산기, 박스 격자 포장 계산기
- **일정·정산**: 예산 비율 배분 계산기
- **DIY 배치**: 울타리 기둥 계산기, 계단 단수·치수 계산기, 벽체 스터드 배치 계산기, 격자 나사 배치 계산기
- **바느질·뜨개**: 커튼 원단 계산기, 원단 수축 계산기, 퀼트 바인딩 계산기, 원형 치마 계산기
- **요리·배합**: 요리 원가 계산기, 커피 추출 비율 계산기, 조리분 용기 배분 계산기
- **여행 계획**: 경유 여정 시간 계산기, 여행 짐 무게 계산기, 여행 예산 계산기
- **달력 규칙**: 회계연도 분기 계산기, 율리우스 적일 변환기, 날짜 구간 합치기
- **시간·학습 계획**: 빈 시간 예약 구간 찾기, 작업·휴식 시간표 만들기, 운동 구간 시간표 만들기
- **지붕·배수 재료**: 엇갈림 보도블록 배치 계산기, 빗물받이 연결 재료 계산기, 경사 지붕 면적 계산기, 지붕판 겹침 수량 계산기, 서까래 기하 길이 계산기, 계단 옆판 기하 길이 계산기, 블라인드 슬랫 배치 계산기
- **목재·재단**: 다각형 연귀 절단각 계산기, 크라운 몰딩 복합 절단각 계산기, 목재 절단 목록 배치기, 목재 보드피트 계산기, 배관 보온재 부피 계산기, 흡음판 면적 배치 계산기, 천장 패널 가장자리 배치 계산기
- **가구·벽 배치**: 수납장 문 덮임 치수 계산기, 서랍 상자 재단 치수 계산기, 선반 균등 간격 계산기, 경첩 위치 배치 계산기, 액자 벽면 배치 계산기
- **정원 수량 계획**: 텃밭 씨앗 간격 배치 계산기, 발아율 반영 파종 수량 계산기, 관수 목표량·시간 계산기, 화분 배수층·흙 계산기
- **제빵·재료 조합**: 초콜릿 카카오 배합 계산기
- **주방·행사 준비**: 보관 라벨 날짜 만들기, 용기 채움 수량 계산기, 행사 식수·묶음 수량 계산기
- **뜨개·퀼트·소품**: 삼각 퀼트 재단 크기 계산기, 퀼트 블록·테두리 계산기, 박스 파우치 재단 계산기, 고무줄 허리밴드 재단 계산기
- **생활 날짜·알림**: 월별 고정비 결제일 정리기, 예약 앞뒤 여유 충돌 검사기, 제품 보증기간 날짜 정리기, 집 관리 다음 점검일 정리기
- **이사·숙박 준비**: 이삿짐 박스 수량 정리기, 이삿짐 차량 운행 수 계산기, 이사 조건별 견적 비교기, 숙박 객실 수량 배분기
- **행사 운영**: 행사 참가비·목표 인원 계산기, 행사 테이블 인원 배치기, 행사 운영 시간표 만들기, 장비 대여 시간·일 요금 계산기
- **집안일·장보기**: 집안일 주간 소요시간 정리기, 제품 기준 세제 사용량 계산기, 식단 재료 묶음 장보기 계산기, 식재료 표시기한 정리기, 식사 완성 역산 조리 시간표, 조리 기구 배치·총시간 계산기

### 개발자용 세부 기능으로 검색 수요가 낮음 — 135개

- **데이터 형식**: Base32 변환기, Base58 변환기
- **주소·텍스트 추출**: HTTP 헤더 분석기
- **네트워크 주소**: MAC 주소 변환기
- **비트·체크섬**: 바이트 순서 변환기, Float32 분석기, Luhn 체크디짓 검사, ISBN 검사기, EAN·UPC 검사기, 해밍 거리 계산기
- **문자·줄바꿈**: NATO 음성 알파벳 변환기
- **JSON 구조 편집**: JSON Merge Patch 적용기, JSON 객체 값 역색인, JSON Patch 적용기, JSON 객체 키 바꾸기
- **JSON 배열 분석**: JSON 배열 조건 필터, JSON 배열 정렬기, JSON 배열 그룹 묶기, JSON 배열 키 선택기
- **문자 비교·치환**: 시저 암호·ROT13 변환기, 애너그램 검사기, 회문 검사기, 알파벳 숫자 변환기
- **HTML·웹 설정**: iframe HTML 만들기, 반응형 이미지 HTML 만들기, 기본 CSP 헤더 만들기, Permissions Policy 헤더 만들기
- **코드 문자열 처리**: SQL 식별자 따옴표 도구, SQL LIKE 와일드카드 이스케이프, 셸 인수 따옴표 도구, gitignore 초안 만들기
- **버전·기간·바이트**: SemVer 버전 비교기, Cookie 요청 헤더 분석기, 바이트 빈도·엔트로피 분석기
- **URL·IP 주소**: 상대 URL 절대 주소 변환기, URL 동일 출처 비교기
- **HTTP·메일 형식**: Content-Type 헤더 분석기, 메일 제목 인코딩 디코더, Quoted-Printable 변환기, HTTP 바이트 Range 계산기
- **JSON 정리·검사**: JSON 필드 규칙 검사기, JSON 필드 가리기, JSON 키 표기 변환기, JSON 배열 중복 제거기, JSON 배열 짝 묶기, JSON 배열 묶음 나누기
- **JSON 레코드 작업**: JSON 숫자 필드 집계기, JSON 배열 집합 연산기, JSON 배열 키 결합기, JSON 배열 객체 변환기, JSON 객체 키·값 목록 만들기, JSON 레코드 키 누락 검사
- **XML 문서 작업**: XML 태그 경로 추출기, XML 태그 개수 세기, XML 본문 글 추출기, XML 속성 목록 추출기, XML 네임스페이스 선언 보기
- **서버·캐시 코드**: Node Dockerfile 만들기, dockerignore 만들기, Nginx 정적 사이트 설정 만들기, 웹 서버 리다이렉트 규칙 만들기, CORS 응답 헤더 만들기, Cache-Control 헤더 만들기, HTML 리소스 힌트 만들기, 서비스 워커 미리 캐시 코드 만들기
- **HTML 부품 만들기**: HTML 입력 폼 만들기, HTML 선택 목록 만들기, HTML 접기 영역 만들기, HTML 진행률 만들기, HTML 오디오·영상 만들기, HTML 다운로드 링크 만들기, HTML 설명 목록 만들기, HTML 입력 추천 목록 만들기
- **문단·줄 작업**: 줄 첫 글자 모으기, 텍스트 줄 순환 이동, 반복 글 블록 줄이기
- **마크다운 문서 작업**: 마크다운 특수문자 이스케이프, 마크다운 링크 추출기, 마크다운 코드 블록 추출기, 마크다운 체크리스트 집계, 마크다운 머리말 나누기, 안전한 코드 블록 감싸기
- **인코딩·웹 진단**: Ascii85 변환기, Base45 변환기, Base62 정수 변환기, URL 목록 도메인별 묶기
- **바이너리 자료 작업**: 16진수 덤프 변환기, 파일 시그니처 확인기, Base128 Varint 변환기, BCD 숫자 변환기, 그레이 코드 변환기, 비트 플래그 만들기, 정수 바이트 배열 변환기, Protocol Buffers 바이트 분석기
- **HTTP 응답·협상**: Accept 헤더 분석기, Accept-Language 분석기, Set-Cookie 응답 헤더 분석기, Cache-Control 분석기, Content-Disposition 분석기, HTTP Link 헤더 분석기, ETag 조건 비교기
- **주소·DNS 형식**: URL 쿼리 차이 비교기, URL 템플릿 확장기, 주소 슬러그 만들기, 역방향 DNS 이름 변환기, MAC EUI-64 변환기, DNS 레코드 문장 만들기, 이메일 주소 형식 검사기
- **시스템 시간·경로**: POSIX 경로 정리기, 경로 glob 검사기
- **요청·설정·로그 작업**: 환경변수 키 차이 비교기, cURL 요청 명령 만들기, JavaScript fetch 요청 만들기, HTTP 요청 파일 만들기, HAR 네트워크 요청 요약, cURL을 HTTP 요청으로 변환, 접속 로그 상태 코드 집계
- **인증·설정 검사**: TOTP 일회용 코드 계산기, Bech32 체크섬 변환기, Fletcher-16 체크섬 계산기, package.json 의존성 목록 추출, Git 충돌 표시 찾기
- **로그·테스트 자료**: 로그 레벨 집계기, 로그 인증정보 가리기, 로그 시각 간격 계산기, 테스트 이메일 목록 만들기, JSON 테스트 자료 만들기
- **날짜·시간 자료 정리**: 날짜 열 형식 통일, 시간 열 형식 통일, 일시 열을 날짜·시간으로, 날짜 목록 휴일 표시, 생일·기념일 다음 날짜 목록, 시작·종료 날짜 오류 검사, 날짜 목록 누락·중복 찾기, 날짜에 주·월 분류 붙이기

### 쓰는 경우가 드문 파일 작업 — 16개

- **텍스트 분석·검색 파일**: 편집 거리 계산기, 자카드 유사도 계산기, 런 길이 인코딩
- **PDF 인쇄**: PDF 페이지 이름 바꾸기
- **PDF 양식**: PDF 양식 채우기, PDF 양식 목록 추출
- **PDF 정보**: PDF 첨부파일 꺼내기, PDF 첨부파일 지우기, PDF에 파일 첨부
- **파일 편집**: 큰 파일 나누기, 나눈 파일 합치기, 파일 바이트 수정
- **Word 파일**: Word 작성자 정보 삭제
- **PowerPoint 파일**: PowerPoint 발표자 노트 삭제
- **Excel 파일**: Excel 외부 통합문서 연결 삭제, Excel 수식을 값으로 바꾸기

### 세부 상황 전용 계산으로 검색 수요가 낮음 — 54개

- **수익·현금흐름**: 현금흐름 NPV 계산기
- **사업·원가**: 정액법 감가상각 계산기, 재고 회전율 계산기, 사업 손익 계산기
- **판매·광고**: 고객 생애가치 계산기, 고객 이탈률 계산기, 판매 퍼널 계산기
- **자금·투자 계산**: 지분 희석 계산기, 채권 현재가 계산기, 교차환율 계산기, 환전 수수료 계산기, 현금 권종 계산기, 현금 소진기간 계산기
- **재고 계획**: 재주문점 계산기, 경제적 주문량 계산기
- **재무 비율**: 자산 대비 대출 비율 계산기, 유동비율 계산기, 당좌비율 계산기
- **기업 수익 분석**: 잉여현금흐름 계산기, 상품 구성 손익분기점 계산기, 판매가격·수량 차이 분석기
- **판매·가격 조건**: 반품 반영 매출 계산기, 구간별 요금 계산기, 묶음 증정 실질 할인 계산기, 쿠폰 적용 순서 비교기, 무료배송 추가구매 비교기, 구독 결제기간 비용 계산기, 외상 결제 할인 연환산 계산기
- **청구·지출 계획**: 미수금 연령 분석기, 청구기간 일할 요금 계산기, 사용량·최소요금 청구 계산기, 임대·구매 현금흐름 비교기, 공급업체 묶음 견적 비교기
- **장바구니·정산**: 상품별 판매 정산표, 주문 할인액 배분기, 무게별 배송비 배분기, 주문 부분 환불 계산기, 쿠폰 최소금액 조건 검사기
- **가계부·결제 계획**: 예산·실제 지출 비교기, 현금 봉투 예산 배분기, 분할 납부 날짜·금액 계획기, 상품권 잔액 정리기, 카드 마감·결제일 계산기, 구독 갱신 날짜 계획기
- **판매·포인트 관리**: 공동구매 최소수량 손익 계산기, 영업일별 매출 목표 계산기, 사용 횟수별 제품 비용 비교기, 쿠폰 만료·사용조건 정리기, 결제 잔돈 저축 정리기, 포인트·현금 결제 비교기
- **청구·잔액 대조**: 현금 시재 마감표, 세금 포함 견적 비교기, 청구·입금 대조표, 개인 빌림·상환 잔액표

### 전문 분야 전용으로 검색 수요가 낮음 — 50개

- **음악·오디오 계산**: 음정·주파수 비율 계산기
- **인쇄·출판 계산**: 봉투 수납 크기 계산기
- **사진 노출**: 파노라마 촬영 장수 계산기
- **렌즈·촬영**: 접사 튜브 배율 계산기, 슬로모션 길이 계산기
- **영상·음향 편집**: 프레임·타임코드 변환기, 셔터각도 계산기, 오디오 크로스페이드 표 만들기, 스프라이트 시트 좌표 계산기
- **음악 이론·악기**: 잇단음표 길이 계산기, 기타 프렛 위치 계산기, 현 길이·음높이 장력비 계산기
- **플래시·접사 노출**: 플래시 가이드넘버 계산기, 플래시 출력·거리 환산기, 포커스 스태킹 간격 계획기
- **촬영·필름 계획**: 노출 브래킷 순서 만들기, 필름 길이별 프레임 계산기, 필름 스캔 픽셀 계산기, 시프트 촬영 합성 범위 계산기
- **화면·타임코드**: 영상 레터박스 좌표 계산기, 영상 안전영역 좌표 계산기, 드롭프레임 타임코드 변환기, 영상 편집 여유 프레임 계산기, 멀티캠 동기화 프레임 계산기
- **오디오 신호·버퍼**: 오디오 샘플·시간 변환기, 재생 속도 음높이 계산기
- **믹싱·영상 인코딩**: 오디오 버퍼 지연 계산기, 플러그인 지연 합산 계산기, 영상 GOP·분할 길이 계산기
- **촬영·납품 작업**: 촬영 컷 목록 정리기, 촬영일 콜타임 계획기, 프리랜서 작업 견적 계산기, 추가 수정 작업비 계산기, 납품 영상 규격 대조표, 사진 인화 주문 비용 계산기
- **제본·종이**: 소책자 중철 페이지 배치기, 중철 제본 밀림 계산기, 롤 인쇄 재단 길이 계산기, 라벨 용지 좌표 배치기, 포스터 분할 인쇄 계산기
- **공예·인쇄 재료**: 인쇄 잉크 사용량 계산기, 스크린 유제 사용량 계산기, 십자수 원단 크기 계산기, 접지 패널·접는선 계산기, 제본 구멍 좌표 배치기
- **오디오 편집**: 오디오 중간 무음 넣기
- **오디오 변환**: 오디오 좌우 채널 분리, 오디오 좌우 바꾸기, 오디오 위상 반전, 오디오 DC 편향 제거

### 표를 직접 붙여 넣어야 해서 일반 사용자가 쓰기 어렵고 검색 수요가 낮음 — 127개

- **표 오류·항목 검사**: 표 필수항목 누락 검사, 중복 코드 내용 충돌 찾기, 수량·단가·금액 대조, 분류별 비율 합계 검사, 붙여넣은 표 열 수 맞추기, 표 숨은 문자 정리, 품목·문서 코드 규칙 검사, 업로드 양식 열 맞추기
- **표 재구성·출력**: 수량만큼 표 행 펼치기, 셀 안 목록을 여러 행으로, 분류별 소계 행 넣기, 분류별 표 파일 나누기, 표를 정보 카드 문서로, 표로 문서 메일머지, 코드별 최신 기록 고르기, 분류별 상위 항목 표
- **셀 문자·연락처**: 표 열의 앞·뒤·중간 글 추출, 구분자 앞뒤 글자 열 추출, 전화번호 목록 서식 정리, 통화·숫자 표기 정리, 다른 문자 숫자 표기 통일, 표 개인정보 가리기, 괄호 내용 표 열 분리
- **엑셀 수식 편집**: 엑셀 절대참조 바꾸기, 엑셀 수식 참조 이동, 엑셀 수식 참조 목록, 엑셀 수식 구분자 변환, 수식 괄호·따옴표 검사, 엑셀 수식 줄바꿈 정리, 셀 주소 목록·범위 정리, 외부 통합문서 참조 찾기
- **주문·출고 문서**: 주문 피킹 목록 만들기, 포장 명세서 만들기, 포장 중량 대조표, 주문·출고 수량 대조, 반품 검수 대장, 미출고 주문 재고 배정, 상자별 상품 묶음 계획
- **실사·재고 기록**: 재고 실사 대조표, 입출고 이력 잔액 검사, 재고 ABC 관리 분류, 기한별 재고 출고 배정, 보관 위치 사용 현황, 창고 이동 명세서, 자산 인수인계 이력, 장비 대여·반납 대조
- **구매·거래처 업무**: 구매 묶음·최소수량 맞추기, 구매 요청서 만들기, 입고 확인서 만들기, 구매 단가 이력 비교, 거래처 납기 소요일 보고, 거래처 정시 납품 집계, 거래처 담당자 연락망, 견적 요청서 만들기
- **작업·경비 기록**: 경비 정산 신청서, 영수증 파일 누락 대조, 출장 거리·여비 내역서, 프로젝트 작업시간 대장, 작업시간 중복 기록 찾기, 출퇴근 예외 내역, 업무 인수인계서, 휴가 신청서 만들기
- **회의·업무 배분**: 회의록 만들기, 후속 작업 대장, 업무 책임 RACI 표, 작업 의존 일정 계획, 담당자 업무 부하 보고, 작업 분량 균등 배정, 업무 우선순위 평가표, 프로젝트 위험 관리 대장
- **검토·결재 관리**: 이슈 지연·응답시간 보고, 대안 가중 비교표, 문서 개정 대장, 문서번호 중복·누락 검사, 결재 순서표 만들기, 점검 체크리스트 만들기, 지적사항·조치내역 대조, 검사 로트 합불 집계
- **업무 문서 만들기**: 서비스 작업 지시서, 물품 인수인계 확인서, 제품 사양 비교 문서, 작업 완료 확인서, 수리 접수 문서, 반품 요청 문서, 입력 서식 문서 만들기
- **지원·조직 문서**: 자기소개서 문서 서식, 지원 현황 대장, 면접 평가 기록서, 요구·보유 기술 대조표, 포트폴리오 목차 문서, 경력 프로젝트 기술서
- **연락처·메일 자료**: 받는사람·참조 중복 정리, 메일 답장 인용 정리, 주소록 생일 일정 파일
- **캘린더 파일 작업**: 일정 표·ICS 변환, ICS 일정 파일 합치기, 일정 내용 중복 정리, 캘린더 일정 겹침 검사, 캘린더 시각 일괄 이동, 반복 일정 표로 펼치기, 바쁨 시간 ICS 만들기, 일정 파일 인쇄 목록
- **문서 글·표 변환**: RTF·일반 글 변환, 고정폭 보고서를 표로
- **설문·검토 자료**: 설문지 문서 만들기, 설문 응답 집계, 입력폼 답변을 표로, 서술 답변 가로표 만들기, 자료 검토 묶음 배정, 여러 검토자 판정 대조, 제출 서류 파일 대조, 사용자 키워드로 응답 분류
- **안내문·발표 문서**: 발표 메모 카드 만들기, 한 장 보고서 만들기
- **인쇄용 자료 만들기**: 프린터 확인 페이지, 재단 가이드 만들기, 영수증 정리 대지, 보관 상자 문서 색인
- **명단·문서 대조**: 회의 대안 투표 집계, 회의 시간 후보 응답 집계, 참석 응답 명단 집계, 문서 갱신 예정 대장, 업무 파일명 규칙 검사, 검토 주석 정리표, 문서 목차 번호 정리
- **일괄 금액·규격 정리**: 여러 통화 금액 환산표, 규격표 단위 일괄 변환

### 용도가 좁아 찾는 사람이 적음 — 8개

- **이미지 편집**: 두 이미지 차이 찾기
- **사진 색상**: 사진을 문자 그림으로, 사진 밝기 분포 보기, 사진 RGB·투명도 분리
- **이미지 출력**: 사진 투명도 마스크 적용, 이미지 스프라이트 아틀라스, 비슷한 사진 중복 찾기, PNG 인쇄 DPI 바꾸기

삭제 대상의 주소는 함께 만든 `tool-triage-2026-11-10.json`에 있습니다.

## 다음 단계

1. 이 목록에서 살리거나 지울 항목을 사용자가 확정합니다.
2. 통합 대표 도구에 흡수 기능을 옵션으로 넣고, 옛 주소를 `_redirects`에 301로 추가합니다.
3. 삭제 페이지와 전용 스크립트·검증 파일을 지우고 홈·사이트맵에서 뺍니다.
4. 홈을 검색창·인기 도구·분류 허브 구조로 바꿉니다.

## 적용 기록 — 2026-11-12

사용자가 이 목록을 승인해 dev 작업 트리에 적용했습니다. 커밋·푸시·운영 배포는 하지 않았습니다.

- 공개 도구 페이지는 155개입니다. 홈·소개·개인정보를 합친 검색 대상은 158개입니다.
- 삭제 481개는 페이지와 전용 스크립트를 지웠습니다. 주소는 404가 됩니다. 쓰는 페이지가 없어진 공용 스크립트 4개(`office1000-dates`, `office1000-formulas`, `office1000-projects`, `office1000-responses`)도 지웠습니다.
- 통합 364개는 계산·처리 코드를 그대로 둔 채 페이지 틀(메뉴·제목·광고·푸터)만 뗀 조각 문서로 `tools/embed/`에 옮겼습니다. 대표 도구 85개에 기능 선택(8개 이하는 버튼, 그보다 많으면 선택 상자)을 넣었고, 고른 기능의 조각 문서를 같은 자리에 iframe으로 보여 줍니다. 공용 자산은 `tools/tool-modes.js`, `tools/tool-modes.css`입니다.
- 옛 주소는 `_redirects`에서 대표 주소의 `?mode=옛-슬러그`로 301 연결했습니다. 조각 문서는 `noindex`이고 `robots.txt`·`_headers`에서도 검색 제외로 지정했습니다.
- 통합 후 이름이 있는 대표 도구는 h1·검색 제목·공유 제목·구조화 데이터 이름을 새 이름으로 바꿨습니다. 검색 설명과 사용방법 문구는 그대로입니다.
- 홈 목록은 분류 카드 14개로 다시 만들었습니다. 흡수한 기능 이름은 대표 도구의 검색 키워드에 넣어 홈 검색으로 찾을 수 있습니다.
- 기준 기록은 `internal/catalog-consolidation-2026-11-10.json`입니다(유지·통합·삭제 슬러그, 남긴 스크립트 522개의 SHA-256).

### 검증

- 디자인 검사(`scripts/check-design.js`), 빌드(`scripts/build.js`), `verify/` 검증 37종이 통과했습니다.
- 사라진 페이지를 직접 참조하던 검증 17종은 2026-11-08 선례대로 `internal/retired-tests-2026-11-10/`로 옮겼습니다. 대신 `verify/verify-consolidation.js`가 페이지·조각 문서·301·링크 정리, 남긴 스크립트 해시 일치, 기존 QA 벡터 343개의 실제 계산 결과를 검사합니다. 파일 입력이 필요한 도구(PDF·ZIP·오디오·이미지 등)는 Node 벡터가 없어 해시 검사만 받습니다.
- `verify/verify-tool-directory.js`는 기대 수치를 155개 목록에 맞게 고쳤습니다.
- 브라우저(1280px·375px)에서 홈, 기능 전환, `?mode=` 직접 진입, 통합 화면 안 계산 실행(CSV 구분자 변환)을 확인했고, 조각 문서 364개를 모두 불러 스크립트 오류 0건을 확인했습니다.
- 확인하지 못한 것: `_redirects`의 301은 로컬 미리보기 서버가 처리하지 않아 Cloudflare Pages(dev 미리보기)에서 확인이 필요합니다. 파일을 실제로 올려 처리하는 기능(PDF·오디오 등)은 통합 화면 안에서 직접 실행해 보지 않았습니다.

### 남은 일

- 홈을 검색창·인기 도구·분류 허브 구조로 바꾸기, 도구 페이지 설명·예시 보강, 광고 클릭 차단(sandbox) 결정은 이번 범위가 아닙니다.
- 유지 B 50개는 8주 뒤 Search Console 노출을 보고 다시 판단합니다.
