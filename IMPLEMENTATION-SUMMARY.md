# DalConnect Stripe + Telegram 통합 구현 완료

## 📅 작업 일자
**2026-02-23 16:38 CST**

## ✅ 완료된 작업

### 1. API 파일 수정

#### `api/stripe-checkout.ts` (완전히 재작성)
**변경사항:**
- ✅ Webhook 시그니처 검증 로직 추가
- ✅ Webhook 이벤트 핸들러 추가:
  - `checkout.session.completed` - 결제 완료 처리
  - `customer.subscription.deleted` - 구독 취소 처리
  - `invoice.payment_failed` - 결제 실패 알림
- ✅ Telegram 알림 헬퍼 함수 추가
- ✅ Database 업데이트 로직 추가
- ✅ subscription_data.metadata에 businessId, tier 추가 (구독 취소 추적용)

**주요 기능:**
```typescript
// Method 분기
if (req.headers['stripe-signature']) {
  // Webhook 처리
} else {
  // 체크아웃 세션 생성
}
```

#### `api/businesses.ts` (Telegram 알림 추가)
**변경사항:**
- ✅ `sendTelegramAlert()` 헬퍼 함수 추가
- ✅ 업체 등록 시 Telegram 알림 전송
  - 업체명, 대표자, 이메일, 전화번호, 카테고리, 주소 포함
- ✅ 업체 클레임 시 Telegram 알림 전송
  - 업체명, 업체 ID, 대표자, 이메일, 전화번호 포함

### 2. 유틸리티 스크립트 생성

#### `scripts/register-webhook.js`
**기능:**
- Stripe API를 통해 webhook endpoint 등록
- 기존 webhook 확인 (중복 방지)
- Webhook secret 출력
- 이벤트: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`

**사용법:**
```bash
export STRIPE_SECRET_KEY=sk_live_...
node scripts/register-webhook.js
```

#### `scripts/test-telegram.js`
**기능:**
- Telegram Bot API 연결 테스트
- Hub-Projects 그룹에 테스트 메시지 전송
- 상세한 에러 메시지와 해결 방법 제공

**사용법:**
```bash
export TELEGRAM_BOT_TOKEN=your_token
node scripts/test-telegram.js
```

### 3. 문서 작성

#### `STRIPE-WEBHOOK-SETUP.md`
완전한 배포 가이드 포함:
- 단계별 설정 지침
- 환경변수 구성
- 테스트 방법
- 문제 해결 가이드

## 🔧 기술적 세부사항

### Webhook 처리 플로우

```
1. Stripe → POST /api/stripe-checkout
   ├─ Header: stripe-signature
   └─ Body: Webhook Event
   
2. 시그니처 검증
   └─ STRIPE_WEBHOOK_SECRET 사용
   
3. 이벤트 처리
   ├─ checkout.session.completed
   │  ├─ DB 업데이트 (tier, featured)
   │  └─ Telegram 알림
   ├─ customer.subscription.deleted
   │  ├─ DB 다운그레이드 (free tier)
   │  └─ Telegram 알림
   └─ invoice.payment_failed
      └─ Telegram 알림
```

### Database 업데이트

**결제 완료 시:**
```sql
-- business_claims 업데이트
UPDATE business_claims 
SET tier = 'premium' | 'elite' 
WHERE business_id = ?

-- businesses 업데이트
UPDATE businesses 
SET tier = 'premium' | 'elite',
    featured = true (elite만)
WHERE id = ?
```

**구독 취소 시:**
```sql
UPDATE business_claims SET tier = 'free' WHERE business_id = ?
UPDATE businesses SET tier = 'free', featured = false WHERE id = ?
```

### Telegram 알림 형식

**결제 완료:**
```
💰 새 프리미엄 고객!

업체: [업체명]
플랜: 프리미엄 $49/월
이메일: [email]
업체 ID: [id]
```

**업체 등록:**
```
📝 새 업체 등록 요청

업체: [이름]
대표: [이름]
이메일: [email]
전화: [번호]
카테고리: [category]
주소: [address]

승인하려면 DB에서 status='approved'로 변경
```

**업체 클레임:**
```
🏢 업체 클레임 요청

업체: [이름]
업체 ID: [id]
대표: [이름]
이메일: [email]
전화: [번호]

승인하려면 DB에서 verified=true로 변경
```

## 🚨 중요 주의사항

### 1. Vercel Serverless 함수 제한
- **현재**: 11개 API 파일 (12개 제한 중)
- **여유**: 1개 더 추가 가능
- **결정**: stripe-checkout.ts에 webhook 기능 통합 (별도 파일 생성 안 함)

### 2. Raw Body 처리
Webhook 시그니처 검증을 위해 raw body 필요:
```typescript
async function getRawBody(req: VercelRequest): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req as any) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}
```

### 3. Metadata 전파
구독 취소 이벤트를 위해 subscription에도 metadata 추가:
```typescript
subscription_data: {
  metadata: {
    businessId,
    tier,
  },
}
```

## 📋 다음 단계 (배포 체크리스트)

### Step 1: Telegram Bot 설정
- [ ] Bot Token 확인 또는 새로 생성
  - @BotFather에서 `/newbot` 사용
- [ ] Bot을 Hub-Projects 그룹에 추가
- [ ] Bot에게 메시지 전송 권한 부여
- [ ] `scripts/test-telegram.js`로 테스트

### Step 2: 환경변수 준비
```bash
# 로컬 .env에 추가
TELEGRAM_BOT_TOKEN=your_token_here

# 테스트
node scripts/test-telegram.js
```

### Step 3: Vercel 환경변수 설정
```bash
# Telegram
npx vercel env add TELEGRAM_BOT_TOKEN production

# Stripe Webhook Secret (Step 5 이후)
npx vercel env add STRIPE_WEBHOOK_SECRET production
```

### Step 4: 빌드 및 배포
```bash
cd /Users/aaron/.openclaw/workspace-manager/projects/dalconnect

# 빌드
npm run build:client

# 커밋
git add .
git commit -m "feat: Add Stripe webhook handling and Telegram notifications

- Add webhook event handling in stripe-checkout.ts
- Add Telegram notifications to businesses.ts
- Add webhook registration script
- Add Telegram test script
- Add comprehensive setup documentation"

# 배포 (특수 SSH 키 사용)
GIT_SSH_COMMAND="ssh -i ~/.ssh/id_openclaw_dalconnect" git push origin main
```

### Step 5: Stripe Webhook 등록
```bash
# Stripe Secret Key 설정
export STRIPE_SECRET_KEY=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

# Webhook 등록
node scripts/register-webhook.js

# 출력된 Webhook Secret을 저장
# whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 6: Webhook Secret 추가 및 재배포
```bash
# Vercel에 추가
npx vercel env add STRIPE_WEBHOOK_SECRET production
# → whsec_... 입력

# 재배포 (환경변수 적용)
npx vercel --prod
```

### Step 7: 테스트
```bash
# Stripe CLI 설치 (없는 경우)
brew install stripe/stripe-cli/stripe

# 로그인
stripe login

# 이벤트 테스트
stripe trigger checkout.session.completed
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed
```

## 📊 모니터링 포인트

### 1. Telegram 알림이 정상 도착하는지 확인
- Hub-Projects 그룹 모니터링
- 예상 알림:
  - 💰 결제 완료
  - 📝 업체 등록
  - 🏢 업체 클레임
  - ⚠️ 구독 취소
  - 🔴 결제 실패

### 2. Stripe Webhook 상태
- https://dashboard.stripe.com/webhooks
- 각 이벤트의 성공/실패 로그 확인
- 실패 시 자동 재시도 확인

### 3. Vercel 로그
```bash
# 실시간 로그
npx vercel logs --follow

# 최근 100개 로그
npx vercel logs
```

### 4. Database 확인
```sql
-- 결제 후 tier 확인
SELECT id, name_ko, tier, featured FROM businesses WHERE tier != 'free';

-- 클레임 확인
SELECT bc.*, b.name_ko 
FROM business_claims bc 
JOIN businesses b ON bc.business_id = b.id;
```

## 🐛 알려진 이슈 및 제한사항

### 1. 구독 취소 시 businessId 찾기
현재 구현:
- subscription.metadata.businessId 사용
- metadata가 없으면 취소 이벤트 처리 불가

**개선 방안 (미래):**
- customer_id를 database에 저장
- checkout.session.completed에서 customer_id 저장
- subscription.deleted에서 customer_id로 조회

### 2. 결제 실패 시 제한된 정보
현재:
- subscription을 통해 businessId 조회 시도
- 실패 시 customer 정보만 알림

### 3. Telegram 알림 실패 시 무시
현재:
- console.warn()만 출력
- 메인 로직에 영향 없음

**개선 방안 (미래):**
- 알림 실패를 별도 로그 테이블에 저장
- 재시도 로직 구현

## 📚 참고 자료

### Stripe 문서
- Webhooks: https://stripe.com/docs/webhooks
- Checkout Sessions: https://stripe.com/docs/api/checkout/sessions
- Subscriptions: https://stripe.com/docs/api/subscriptions

### Telegram Bot API
- sendMessage: https://core.telegram.org/bots/api#sendmessage
- HTML parse mode: https://core.telegram.org/bots/api#html-style

### Vercel
- Environment Variables: https://vercel.com/docs/projects/environment-variables
- Serverless Functions: https://vercel.com/docs/functions/serverless-functions

## 🎯 성공 기준

배포가 성공적으로 완료되면:

1. ✅ Stripe 결제 시 Telegram 알림 도착
2. ✅ Database tier가 자동으로 업데이트됨
3. ✅ 엘리트 플랜은 featured = true
4. ✅ 구독 취소 시 free tier로 다운그레이드
5. ✅ 업체 등록/클레임 시 Telegram 알림
6. ✅ Stripe Dashboard에서 webhook 성공 로그 확인

---

## 👤 작성자
**OpenClaw Subagent**: dalconnect-stripe-webhook  
**세션**: agent:manager:subagent:ff9da424-88ee-41fb-acf9-04328df85e08  
**요청자**: telegram:group:-5291007114

## 📞 문제 발생 시
1. `STRIPE-WEBHOOK-SETUP.md`의 문제 해결 섹션 참조
2. Vercel 로그 확인: `npx vercel logs`
3. Stripe Dashboard에서 webhook 이벤트 확인
4. Hub-Projects 그룹에서 알림 도착 여부 확인
