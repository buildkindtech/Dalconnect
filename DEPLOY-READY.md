# DalConnect 배포 준비 현황 (3/12)

## ✅ 완료된 작업
1. **DB 정리**
   - city 정규화: dallas→Dallas, austin→Austin (108건)
   - 가짜 딜 21개 삭제 (URL 없는 placeholder)
   - 카테고리 영→한 통일 (business→취업/사업 등)
   
2. **뉴스 시스템 v2**
   - SearXNG 의존 → RSS 기반으로 전환
   - 소스: Fox 4 DFW, WFAA, ESPN, NYT, 연합뉴스, 한겨레, 동아일보, Soompi
   - 81개 새 뉴스 수집 완료
   - 로컬뉴스 20개 (DFW 실제 뉴스!)
   
3. **썸네일 보충**
   - OG image 추출 스크립트 작성
   - 100개 중 61개 보충 완료
   
4. **소셜 자동 포스팅**
   - `scripts/social-auto-post.cjs` 완성
   - Facebook Page + Instagram Business 포스팅
   - --preview 모드 테스트 완료
   - 4개 포스트 자동 생성 확인

## ⏳ Aaron 확인 필요
1. **Vercel 프로젝트 재생성** — dalconnect 프로젝트가 삭제되어 있음
   ```bash
   cd projects/dalconnect
   vercel  # 새 프로젝트 생성 → dalconnect.buildkind.tech 도메인 연결
   ```
2. **환경변수 설정** (Vercel 대시보드):
   - `DATABASE_URL` (Neon)
   - `GOOGLE_MAPS_API_KEY`
   - `STRIPE_SECRET_KEY`
   
3. **소셜 계정 생성**:
   - Facebook Page: "DalConnect - DFW 한인 커뮤니티" 생성
   - Instagram Business: @dalconnect 생성 → FB Page 연결
   - Facebook Graph API 토큰 발급
   
4. **git push** → Vercel 자동 배포

## 현재 DB 현황
- 비즈니스: 1,210개
- 뉴스: 417개 (로컬 20 + 한국 135 + 미국 61 + ...)
- 블로그: 58개
- 딜: 36개 (실제 URL 있는 것만)
- 커뮤니티: 20개
