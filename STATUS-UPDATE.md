# DalConnect - 현재 상태 업데이트

**일시:** 2026-02-23  
**배포 상태:** 🟡 PARTIAL (Frontend only)

## ✅ 완료된 작업

### 1. 웹사이트 배포
- **URL:** https://dalconnect.buildkind.tech
- **프론트엔드:** ✅ 완전 작동
- **백엔드:** ❌ API 라우트 작동 안 함

### 2. Vercel 설정
- ✅ GitHub Auto-Deploy
- ✅ Domain 연결 (dalconnect.buildkind.tech)
- ✅ 환경변수 추가:
  - DATABASE_URL (production, preview, development)
  - STRIPE_SECRET_KEY (production, preview, development)

### 3. Cron Jobs 설정 (3개)
- ✅ Daily Business Scraping (6 AM CST)
- ✅ SEO Sitemap Update (2 AM CST)
- ✅ Weekly Newsletter (Mon 9 AM CST)

### 4. 코드 업데이트
- ✅ Stripe 결제 시스템
- ✅ Admin 대시보드
- ✅ Payment Success 페이지
- ✅ 5개 자동화 스킬 문서
- ✅ Initial business seed script

## ❌ 현재 문제

### 1. API 라우트 작동 안 함
**원인:** Vercel이 Express 서버를 static build로만 배포  
**결과:** `/api/*` 엔드포인트 모두 404

**영향:**
- 비즈니스 목록 조회 불가
- Stripe 결제 불가
- Admin 기능 불가

### 2. DATABASE_URL 인증 실패
**원인:** Neon DB 비밀번호 만료 또는 변경됨  
**결과:** 로컬에서 seed script 실행 불가

## 🛠️ 해결 방법 (2가지 옵션)

### 옵션 1: Vercel Serverless Functions로 변환 ⭐ 추천
**시간:** 30-60분  
**난이도:** 중간  
**장점:** Vercel 그대로 사용, Auto-Deploy 유지

**작업:**
1. `api/` 폴더에 각 엔드포인트를 serverless function으로 분리
   - `api/businesses.ts`
   - `api/featured.ts`
   - `api/news.ts`
   - `api/stripe-checkout.ts`
   - `api/stripe-webhook.ts`
2. `vercel.json` rewrites 설정
3. Git push → 자동 배포

### 옵션 2: Railway.app으로 이동
**시간:** 10-15분  
**난이도:** 쉬움  
**장점:** Express 서버 그대로 사용, 복잡한 변환 불필요

**작업:**
1. Railway 계정 생성/로그인
2. GitHub 레포 연결
3. 환경변수 추가 (DATABASE_URL, STRIPE_SECRET_KEY)
4. Deploy 클릭
5. Domain 연결 (dalconnect.buildkind.tech)

## 📊 다음 우선순위

### 즉시 필요
1. **API 라우트 수정** (옵션 1 or 2)
2. **DATABASE_URL 갱신** (새 Neon DB 또는 Vercel Postgres)
3. **초기 데이터 추가** (14개 mock businesses)

### 단기 (1-2일)
4. **Google Maps API** 키 발급 (500 businesses 수집)
5. **OpenAI API** 키 발급 (content moderation)
6. **SendGrid API** 키 발급 (newsletter)
7. **Google Ads** 캠페인 생성 ($200/월)

### 중기 (1주)
8. SEO 최적화 (sitemap, meta tags)
9. Google Search Console 연동
10. Analytics 추가

## 💡 추천 액션

**지금 당장:**
- **옵션 1 실행** (Vercel Serverless Functions)
- 이유: 이미 Vercel 설정 완료, Auto-Deploy 작동 중

**필요한 것:**
- 없음! 모든 작업 자동화 가능

**예상 소요시간:** 30-45분

---

**다음 액션:** Vercel Serverless Functions 변환 시작?
