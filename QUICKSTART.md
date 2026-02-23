# 🚀 DalConnect Stripe + Telegram 빠른 시작 가이드

## 📝 5분 요약

### 완료된 작업
✅ Stripe webhook 처리 로직 (`api/stripe-checkout.ts`)  
✅ Telegram 알림 통합 (`api/stripe-checkout.ts`, `api/businesses.ts`)  
✅ Webhook 등록 스크립트 (`scripts/register-webhook.js`)  
✅ Telegram 테스트 스크립트 (`scripts/test-telegram.js`)  
✅ 완전한 문서화

### 필요한 작업 (30분)
1. Telegram Bot 토큰 설정
2. 환경변수 추가 (Vercel)
3. 배포
4. Stripe Webhook 등록
5. 테스트

---

## ⚡ 빠른 배포 (복사-붙여넣기)

### 1️⃣ Telegram Bot 설정 (5분)

```bash
# Telegram에서:
# 1. @BotFather와 대화
# 2. /newbot 입력하여 새 봇 생성
# 3. Bot을 Hub-Projects 그룹에 추가 (Chat ID: -5291007114)

# 로컬 .env에 추가
cd /Users/aaron/.openclaw/workspace-manager/projects/dalconnect
echo "TELEGRAM_BOT_TOKEN=YOUR_TOKEN_HERE" >> .env

# 테스트
export $(cat .env | grep TELEGRAM_BOT_TOKEN | xargs)
node scripts/test-telegram.js
```

### 2️⃣ Vercel 환경변수 추가 (2분)

```bash
# Telegram Bot Token
npx vercel env add TELEGRAM_BOT_TOKEN production
# → 프롬프트에 토큰 입력
```

### 3️⃣ 빌드 및 배포 (5분)

```bash
cd /Users/aaron/.openclaw/workspace-manager/projects/dalconnect

# 빌드
npm run build:client

# 커밋
git add .
git commit -m "feat: Add Stripe webhook and Telegram notifications"

# 배포
GIT_SSH_COMMAND="ssh -i ~/.ssh/id_openclaw_dalconnect" git push origin main

# Vercel 자동 배포 확인 (2-3분 소요)
```

### 4️⃣ Stripe Webhook 등록 (3분)

```bash
# Stripe Secret Key 설정
export STRIPE_SECRET_KEY=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

# Webhook 등록
node scripts/register-webhook.js

# 출력된 Webhook Secret을 복사!
# whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 5️⃣ Webhook Secret 추가 및 재배포 (3분)

```bash
# Vercel에 Secret 추가
npx vercel env add STRIPE_WEBHOOK_SECRET production
# → 프롬프트에 whsec_... 입력

# 재배포
npx vercel --prod
```

### 6️⃣ 테스트 (10분)

```bash
# Stripe CLI 설치 (처음만)
brew install stripe/stripe-cli/stripe
stripe login

# 이벤트 테스트
stripe trigger checkout.session.completed
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed

# Hub-Projects 그룹에서 알림 확인!
```

---

## 🎯 성공 체크리스트

배포 후 이것들이 작동하면 성공:

- [ ] Telegram 테스트 메시지가 Hub-Projects에 도착
- [ ] Stripe webhook이 등록됨 (Dashboard에서 확인)
- [ ] Vercel에 환경변수 2개 설정됨:
  - TELEGRAM_BOT_TOKEN
  - STRIPE_WEBHOOK_SECRET
- [ ] `stripe trigger` 명령어로 알림 테스트 성공
- [ ] Hub-Projects에서 다음 알림 수신:
  - 💰 결제 완료
  - ⚠️ 구독 취소
  - 🔴 결제 실패

---

## 🆘 문제 발생 시

### Telegram 알림 안 옴
```bash
# 1. Bot Token 확인
echo $TELEGRAM_BOT_TOKEN

# 2. 직접 테스트
node scripts/test-telegram.js

# 3. Vercel 환경변수 확인
npx vercel env ls | grep TELEGRAM
```

### Webhook 실패
```bash
# 1. Stripe Dashboard 확인
# https://dashboard.stripe.com/webhooks

# 2. Vercel 로그 확인
npx vercel logs --follow

# 3. Webhook Secret 확인
npx vercel env ls | grep STRIPE_WEBHOOK
```

### 배포 실패
```bash
# 1. 빌드 로그 확인
npm run build:client

# 2. Git 상태 확인
git status

# 3. Vercel 상태 확인
npx vercel ls
```

---

## 📚 상세 문서

더 자세한 정보가 필요하면:

- **배포 가이드**: `STRIPE-WEBHOOK-SETUP.md`
- **구현 내역**: `IMPLEMENTATION-SUMMARY.md`
- **단계별 체크리스트**: `DEPLOY-CHECKLIST.sh`

---

## 🔗 빠른 링크

- **Stripe Dashboard**: https://dashboard.stripe.com/webhooks
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Live Site**: https://dalconnect.buildkind.tech
- **Hub-Projects**: Telegram Group (Chat ID: -5291007114)

---

## 💡 팁

1. **Telegram 테스트 먼저**: 배포 전에 로컬에서 Telegram 테스트부터!
2. **Webhook Secret 저장**: 한 번만 보여주므로 반드시 저장
3. **재배포 필수**: 환경변수 추가 후 꼭 재배포
4. **로그 모니터링**: 첫 배포 후 `npx vercel logs --follow`로 실시간 확인

---

**예상 소요 시간**: 30분  
**난이도**: 중  
**전제 조건**: Telegram Bot, Stripe 계정, Vercel 계정
