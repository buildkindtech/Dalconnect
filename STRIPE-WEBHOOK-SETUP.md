# DalConnect Stripe Webhook + Telegram 알림 설정 가이드

## 📋 개요

이 문서는 DalConnect의 Stripe 결제 시스템과 Telegram 알림 통합을 위한 완전한 설정 가이드입니다.

## ✅ 완료된 작업

### 1. 코드 수정
- ✅ `api/stripe-checkout.ts` - Webhook 처리 로직 추가
  - 체크아웃 세션 생성 (기존)
  - Webhook 이벤트 처리 (신규)
  - Telegram 알림 통합 (신규)
  
- ✅ `api/businesses.ts` - Telegram 알림 추가
  - 업체 등록 시 알림
  - 업체 클레임 시 알림

### 2. Webhook 이벤트 처리
- ✅ `checkout.session.completed` - 결제 완료
  - business_claims.tier 업데이트
  - businesses.tier 업데이트
  - businesses.featured = true (엘리트만)
  - Telegram 알림 전송
  
- ✅ `customer.subscription.deleted` - 구독 취소
  - tier를 'free'로 다운그레이드
  - featured = false
  - Telegram 알림 전송
  
- ✅ `invoice.payment_failed` - 결제 실패
  - Telegram 알림 전송

### 3. 유틸리티 스크립트
- ✅ `scripts/register-webhook.js` - Stripe Webhook 등록
- ✅ `scripts/test-telegram.js` - Telegram 알림 테스트

## 🚀 배포 단계

### Step 1: Telegram Bot Token 확인

현재 프로젝트에 TELEGRAM_BOT_TOKEN이 없습니다. 다음 중 하나를 선택하세요:

**옵션 A: 기존 Bot 사용**
```bash
# .env 파일에 추가
echo "TELEGRAM_BOT_TOKEN=your_existing_token" >> .env
```

**옵션 B: 새 Bot 생성**
1. Telegram에서 @BotFather와 대화
2. `/newbot` 명령어로 새 봇 생성
3. Bot Token을 .env에 추가

**Bot을 Hub-Projects 그룹에 추가:**
1. Bot을 그룹에 초대
2. Bot에게 관리자 권한 부여 (메시지 전송 권한 필요)

### Step 2: Telegram 알림 테스트

```bash
cd /Users/aaron/.openclaw/workspace-manager/projects/dalconnect

# .env 파일에서 토큰 로드 후 테스트
export $(cat .env | grep TELEGRAM_BOT_TOKEN | xargs)
node scripts/test-telegram.js
```

성공하면 Hub-Projects 그룹에 테스트 메시지가 표시됩니다.

### Step 3: Vercel 환경변수 설정

```bash
# Telegram Bot Token 추가
npx vercel env add TELEGRAM_BOT_TOKEN production
# 프롬프트에서 토큰 입력

# Stripe Webhook Secret은 Step 5 이후 추가
```

### Step 4: 코드 빌드 및 배포

```bash
cd /Users/aaron/.openclaw/workspace-manager/projects/dalconnect

# 클라이언트 빌드
npm run build:client

# Git 커밋
git add .
git commit -m "Add Stripe webhook handling and Telegram notifications"

# 배포 (특수 SSH 키 사용)
GIT_SSH_COMMAND="ssh -i ~/.ssh/id_openclaw_dalconnect" git push origin main
```

Vercel이 자동으로 배포를 시작합니다. 배포 완료를 확인하세요.

### Step 5: Stripe Webhook 등록

```bash
cd /Users/aaron/.openclaw/workspace-manager/projects/dalconnect

# Stripe 환경변수 설정 (이미 있으면 스킵)
export STRIPE_SECRET_KEY=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

# Webhook 등록
node scripts/register-webhook.js
```

스크립트가 Webhook Secret을 출력합니다. **반드시 저장하세요!**

```
🔐 Webhook Secret (save this!):
   whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 6: Webhook Secret을 Vercel에 추가

```bash
npx vercel env add STRIPE_WEBHOOK_SECRET production
# 프롬프트에서 whsec_xxx... 입력
```

### Step 7: 변경사항 재배포

환경변수를 추가했으므로 재배포가 필요합니다:

```bash
# Vercel CLI로 재배포 트리거
npx vercel --prod
```

또는 Vercel Dashboard에서 수동으로 재배포:
1. https://vercel.com/dashboard
2. dalconnect 프로젝트 선택
3. "Deployments" → 최신 배포 → "Redeploy"

## 🧪 테스트

### 1. Telegram 알림 테스트
```bash
# 이미 Step 2에서 완료
node scripts/test-telegram.js
```

### 2. Stripe Webhook 테스트

**옵션 A: Stripe CLI 사용 (권장)**
```bash
# Stripe CLI 설치 (없는 경우)
brew install stripe/stripe-cli/stripe

# Stripe 로그인
stripe login

# Webhook 테스트
stripe trigger checkout.session.completed
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed
```

**옵션 B: Stripe Dashboard**
1. https://dashboard.stripe.com/webhooks
2. 등록된 webhook 클릭
3. "Send test webhook" 버튼 클릭
4. 각 이벤트 타입 테스트

### 3. 실제 결제 테스트 (선택사항)

⚠️ **주의**: 현재 라이브 모드이므로 실제 결제가 발생합니다!

테스트하려면:
1. Stripe Dashboard에서 테스트 모드로 전환
2. 테스트 키로 환경변수 교체
3. 테스트 카드 사용: `4242 4242 4242 4242`

## 📊 모니터링

### Stripe Webhook 로그
- https://dashboard.stripe.com/webhooks
- 각 webhook 이벤트의 성공/실패 확인
- 실패한 이벤트는 자동으로 재시도됨

### Vercel 로그
```bash
# 실시간 로그 확인
npx vercel logs --follow

# 최근 로그
npx vercel logs
```

### Telegram 알림 확인
Hub-Projects 그룹에서 다음 알림이 표시되어야 합니다:
- 💰 새 프리미엄 고객 (결제 완료)
- 📝 새 업체 등록 요청
- 🏢 업체 클레임 요청
- ⚠️ 구독 취소
- 🔴 결제 실패

## 🔧 문제 해결

### Telegram 알림이 안 옴
1. Bot Token이 올바른지 확인
2. Bot이 Hub-Projects 그룹에 있는지 확인
3. Bot에게 메시지 전송 권한이 있는지 확인
4. Vercel 환경변수에 TELEGRAM_BOT_TOKEN이 설정되어 있는지 확인

```bash
# Vercel 환경변수 확인
npx vercel env ls
```

### Webhook이 실패함
1. Stripe Dashboard에서 webhook 로그 확인
2. STRIPE_WEBHOOK_SECRET이 올바른지 확인
3. Vercel 함수 로그에서 에러 확인
4. Webhook URL이 올바른지 확인 (https://dalconnect.buildkind.tech/api/stripe-checkout)

### Database 업데이트 실패
1. DATABASE_URL이 올바른지 확인
2. Database 스키마 확인:
   - `businesses` 테이블에 `tier`, `featured` 컬럼이 있는지
   - `business_claims` 테이블에 `tier` 컬럼이 있는지

## 📚 관련 파일

### API Endpoints
- `/api/stripe-checkout` - 체크아웃 세션 생성 + Webhook 처리
- `/api/businesses` - 업체 등록/클레임 + Telegram 알림

### Scripts
- `scripts/register-webhook.js` - Stripe Webhook 등록
- `scripts/test-telegram.js` - Telegram 테스트

### Frontend
- `client/src/pages/PaymentSuccess.tsx` - 결제 완료 페이지

## 🎯 다음 단계

1. [ ] Telegram Bot Token 확인/생성
2. [ ] Telegram 알림 테스트
3. [ ] Vercel에 TELEGRAM_BOT_TOKEN 추가
4. [ ] 코드 빌드 및 배포
5. [ ] Stripe Webhook 등록
6. [ ] Vercel에 STRIPE_WEBHOOK_SECRET 추가
7. [ ] 재배포
8. [ ] 전체 시스템 테스트

## 📞 지원

문제가 발생하면:
1. Vercel 로그 확인
2. Stripe Dashboard에서 webhook 로그 확인
3. Hub-Projects 그룹에서 알림 확인

---

**작성일**: 2026-02-23  
**작성자**: OpenClaw Agent  
**프로젝트**: DalConnect Payment System Integration
