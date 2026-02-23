# DalConnect - Live URLs ✅

**배포 상태:** 🟢 LIVE

## Production URLs

### Main Site
- https://dalconnect-phi.vercel.app
- https://dalconnect.buildkind.tech
- https://dalconnect-info-47339927s-projects.vercel.app

### 주요 페이지

#### 1. 홈페이지
`https://dalconnect-phi.vercel.app/`
- Featured businesses
- 카테고리 그리드
- 최신 뉴스

#### 2. Pricing (결제 페이지)
`https://dalconnect-phi.vercel.app/pricing`
- ✅ Stripe 결제 연동
- 3 Tiers: Free, Premium ($49), Elite ($99)
- 클릭 → Checkout Session 생성

#### 3. Admin Dashboard
`https://dalconnect-phi.vercel.app/admin`
- 수익 통계
- 비즈니스 승인 대기 목록
- 최근 구독 내역

#### 4. Payment Success
`https://dalconnect-phi.vercel.app/payment-success`
- Stripe 결제 완료 후 리디렉션
- Next steps 가이드

#### 5. Business Listings
`https://dalconnect-phi.vercel.app/listings`
- 전체 비즈니스 목록
- 필터 (카테고리, 도시, 검색)

#### 6. News
`https://dalconnect-phi.vercel.app/news`
- 한인 커뮤니티 뉴스
- 카테고리별 필터

## API Endpoints

### Health Check
`https://dalconnect-phi.vercel.app/api/health`

### Businesses
- `GET /api/businesses` - 목록
- `GET /api/businesses/:id` - 상세
- `GET /api/featured` - Featured만

### News
- `GET /api/news` - 목록
- `GET /api/news/:id` - 상세

### Stripe
- `POST /api/stripe/create-checkout` - 결제 세션 생성
- `POST /api/stripe/webhook` - Webhook handler

## 배포 정보

- **플랫폼:** Vercel
- **GitHub:** buildkindtech/Dalconnect
- **마지막 배포:** 2026-02-23
- **빌드 시간:** ~20초
- **자동 배포:** Git push → 자동 배포

## 환경변수 (Vercel)

✅ 설정됨:
- `DATABASE_URL` - Neon PostgreSQL

⏳ 추가 필요:
- `STRIPE_SECRET_KEY`
- `GOOGLE_MAPS_API_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_VISION_API_KEY`
- `SENDGRID_API_KEY`

## 다음 단계

1. ✅ 사이트 라이브 확인
2. ⏳ 모든 페이지 routing 확인 (2분 후)
3. ⏳ API 키 추가
4. ⏳ Cron jobs 설정
5. ⏳ 초기 데이터 수집 (500 businesses)

---

**Status:** 🚀 **DEPLOYMENT SUCCESSFUL**
