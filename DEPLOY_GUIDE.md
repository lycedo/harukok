# 배포 및 애드센스 신청 가이드

## 1단계. GitHub 저장소 만들기
1. github.com 가입 (무료)
2. 우측 상단 + → New repository
3. 저장소 이름 예: `pickday` (Public으로 설정)
4. 이 zip 파일 안의 모든 파일(index.html, tools/, fun/, privacy.html 등)을
   저장소에 그대로 업로드 (웹 화면에서 "Add file → Upload files" 로 드래그 앤 드롭 가능)

## 2단계. Cloudflare Pages 연결
1. dash.cloudflare.com 가입 (무료)
2. 좌측 메뉴 Workers & Pages → Create → Pages → Connect to Git
3. 방금 만든 GitHub 저장소 선택
4. Build settings는 전부 비워두기 (정적 HTML이라 빌드 과정 불필요)
   - Build command: (비워둠)
   - Build output directory: `/`
5. Save and Deploy 클릭 → 1~2분 후 `프로젝트명.pages.dev` 주소로 사이트 생성 완료

## 3단계. (선택) 커스텀 도메인 연결
1. 가비아, 후이즈, Namecheap 등에서 도메인 구매 (연 1만원대)
2. Cloudflare Pages 프로젝트 → Custom domains → Add a domain
3. 안내에 따라 DNS 설정 (Cloudflare에서 도메인 구매 시 자동 연동)

## 4단계. 파일 안의 주소/연락처 교체하기
아래 파일들 안에 있는 `your-domain.com`을 실제 도메인 또는
`프로젝트명.pages.dev` 주소로 바꿔주세요.
- sitemap.xml
- robots.txt

아래 파일 안의 `contact@example.com`도 실제 연락 가능한 이메일로 바꿔주세요
(개인정보처리방침에 표시되는 문의처라 실제 이메일이어야 합니다).
- index.html (하단 "문의하기" 링크)
- privacy.html (개인정보 보호책임자 연락처)

## 5단계. 구글 애드센스 신청
애드센스 로더 스크립트는 이미 모든 페이지 `<head>`에 삽입되어 있습니다 (게시자 ID만 비어있는 상태).
1. adsense.google.com 접속 → 가입
2. 사이트 URL 입력 (배포된 주소)
3. 심사 대기 (보통 며칠~4주)
4. **승인 후** 발급받은 게시자 ID(`ca-pub-XXXXXXXXXXXX`)로 아래 자리를 전부 교체:
   - 모든 HTML 파일의 `<head>` 안 스크립트 태그
   - 각 파일의 `<ins class="adsbygoogle">` 안 `data-ad-client`, `data-ad-slot`
   - `ads.txt` 파일 안의 `pub-XXXXXXXXXXXXXXXX`
5. 애드센스 대시보드 → 개인정보 보호 및 메시지에서 EU/영국 사용자 동의 메시지(CMP) 설정 확인
   (해외 방문자에게도 광고가 노출될 수 있어 구글이 요구하는 절차입니다)

## 6단계. 검색엔진에 알리기
1. Google Search Console (search.google.com/search-console) 가입
   → 속성 추가 → sitemap.xml 제출
2. 네이버 서치어드바이저 (searchadvisor.naver.com) 가입
   → 사이트 등록 → sitemap.xml 제출
   (한국 트래픽 절반 이상이 네이버이므로 필수)

## 7단계. 제휴 링크 실제로 채워넣기
각 도구 HTML 파일 안 `<!-- 제휴 링크 삽입 영역 -->` 자리를 쿠팡파트너스 등
실제 제휴 링크로 교체하세요. **제휴 링크를 넣을 때는 "이 포스팅은 파트너스 활동의
일환으로, 이에 따른 일정액의 수수료를 제공받습니다"와 같은 문구를 링크 주변에
반드시 표시해야 합니다** (공정거래위원회 추천·보증 등에 관한 표시·광고 심사지침).

## 8단계. 배포 전 최종 법적 체크리스트
- [ ] privacy.html의 `contact@example.com`을 실제 이메일로 교체했는가
- [ ] 애드센스 승인 후 pub-ID를 전체 파일에 반영했는가
- [ ] 제휴 링크를 넣었다면 수수료 수취 사실을 명시했는가
- [ ] 사업소득(애드센스 수익) 발생 시 종합소득세 신고 대상이 될 수 있음을 인지했는가
      (국세청 홈택스에서 기타소득/사업소득 신고 방법 확인, 필요 시 세무사 상담)
- [ ] 계산기 결과가 법률·세무 자문이 아닌 참고용 추정치임을 각 페이지에 명시했는가
      (현재 전 계산기에 disclaimer로 반영되어 있음)
