# 배포 및 애드센스 신청 가이드

## 개발 워크플로 (2026-09-01부터 적용)

메인(운영 사이트)에 바로 반영하지 않고, `dev` 브랜치에서 먼저 확인 후 배포합니다.

- **작업/수정**: `dev` 브랜치에 커밋 & push
- **확인**: [dev.harukok.pages.dev](https://dev.harukok.pages.dev) 에서 확인 (실제 서비스 `harukok.com`엔 영향 없음)
- **실제 배포**: 확인 후 `dev` → `main` 병합(merge) → 자동으로 `harukok.com`에 반영

```bash
# dev에서 작업 후 확인 끝나면 main에 반영하는 명령어 예시
git checkout main
git merge dev
git push
```

## 1단계. GitHub 저장소 만들기
1. github.com 가입 (무료)
2. 우측 상단 + → New repository
3. 저장소 이름 예: `harukok` (Public으로 설정)
4. 이 zip 파일 안의 모든 파일(index.html, tools/, fun/, privacy.html 등)을
   저장소에 그대로 업로드 (웹 화면에서 "Add file → Upload files" 로 드래그 앤 드롭 가능)

## 2단계. Cloudflare Pages 연결
1. dash.cloudflare.com 가입 (무료)
2. 좌측 메뉴 Workers & Pages → Create → Pages → Connect to Git
3. 방금 만든 GitHub 저장소 선택
4. Build settings는 아래처럼 **반드시 설정**(과거에는 비워두고 출력 디렉터리를 저장소
   루트(`/`)로 뒀는데, 그러면 `internal/`(운영자 비공개 메모)·`verify/`(개발용 검증
   스크립트)·`DEPLOY_GUIDE.md`·`PROJECT_NOTES.md` 같은 비공개 파일까지 그대로
   배포되어 버립니다. 지금은 `scripts/build.js`가 공개 대상만 골라 `dist/`에
   모아주므로 그 폴더만 배포하도록 바꿔야 합니다):
   - Build command: `node scripts/build.js`
   - Build output directory: `dist`
   - (참고) 저장소에는 여전히 `internal/`·`verify/`·`*.md`가 남아있지만, 이 설정으로
     바꾸면 Cloudflare는 `dist/` 안의 내용만 실제로 서빙합니다. `robots.txt` 차단이나
     `noindex` 메타 태그는 검색엔진에게 "색인하지 말아달라"고 부탁하는 것일 뿐 접근 자체를
     막지 못하므로, 비공개를 위한 수단으로 쓰지 않았습니다 — 애초에 배포 결과물에서
     빼는 것이 유일하게 확실한 방법입니다.
5. Save and Deploy 클릭 → 1~2분 후 `프로젝트명.pages.dev` 주소로 사이트 생성 완료
6. 로컬에서 미리 확인하려면: `node scripts/build.js` 실행 후 `dist/` 폴더 내용을
   확인하세요. 이 명령은 빌드가 끝나면 `scripts/check-dist.js`를 자동으로 함께
   실행해서 `internal/`·`verify/`·`.md` 파일이 섞여 들어가지 않았는지, `index.html`
   등 꼭 필요한 파일이 빠지지 않았는지 검사합니다. `node scripts/check-dist.js`만
   따로 실행할 수도 있습니다.

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

## 8단계. 404 페이지 확인 (배포 후 점검)
저장소 루트의 `404.html`이 `scripts/build.js`를 통해 `dist/` 최상위로 복사되므로,
Cloudflare Pages는 존재하지 않는 경로 요청에 이 페이지를 보여줍니다. Cloudflare Pages
공식 문서에 따르면 빌드 출력 최상위에 `404.html`이 있으면 실제 HTTP 404 상태 코드와
함께 이 페이지가 반환됩니다(반대로 이 파일이 없으면 SPA로 간주해 없는 경로도 홈페이지를
200으로 돌려줄 수 있습니다). **다만 이 동작은 로컬에서는 확인할 수 없으므로, 실제
배포 후에 아래를 직접 확인해야 합니다** (이번 작업에서는 로컬 파일 검토까지만 했고
실제 HTTP 응답은 확인하지 않았습니다):
- [ ] 존재하지 않는 주소(예: `https://harukok.com/no-such-page`)에 접속했을 때 이
      404.html이 뜨는지
- [ ] 브라우저 개발자도구 Network 탭에서 그 요청의 상태 코드가 실제로 `404`인지
      (200으로 뜬 채 404.html '내용만' 보여주는 SPA 폴백이 아닌지)

## 9단계. 배포 전 최종 법적 체크리스트
- [x] privacy.html의 이메일을 실제 연락처(`contact@harukok.com`, Cloudflare Email Routing으로 개인 지메일에 전달)로 교체했는가
- [ ] 애드센스 승인 후 pub-ID를 전체 파일에 반영했는가
- [ ] 제휴 링크를 넣었다면 수수료 수취 사실을 명시했는가
- [ ] 사업소득(애드센스 수익) 발생 시 종합소득세 신고 대상이 될 수 있음을 인지했는가
      (국세청 홈택스에서 기타소득/사업소득 신고 방법 확인, 필요 시 세무사 상담)
- [ ] 계산기 결과가 법률·세무 자문이 아닌 참고용 추정치임을 각 페이지에 명시했는가
      (현재 전 계산기에 disclaimer로 반영되어 있음)
