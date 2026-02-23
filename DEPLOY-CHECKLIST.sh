#!/bin/bash
# DalConnect Stripe Webhook + Telegram 배포 체크리스트
# 이 스크립트는 실행용이 아닌 참고용입니다!

set -e

echo "🚀 DalConnect Stripe Webhook + Telegram 배포 체크리스트"
echo "=============================================="
echo ""
echo "⚠️  이 파일은 자동 실행용이 아닙니다!"
echo "    각 단계를 수동으로 확인하면서 진행하세요."
echo ""

# 프로젝트 디렉토리로 이동
PROJECT_DIR="/Users/aaron/.openclaw/workspace-manager/projects/dalconnect"
cd "$PROJECT_DIR"

echo "📍 현재 위치: $(pwd)"
echo ""

# ============================================
# Step 1: Telegram Bot 설정
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Telegram Bot Token 확인"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "[ ] Telegram에서 @BotFather와 대화"
echo "    → /newbot 명령어로 새 봇 생성"
echo "    → 또는 기존 봇 토큰 사용"
echo ""
echo "[ ] Bot을 Hub-Projects 그룹에 추가 (Chat ID: -5291007114)"
echo "    → Bot에게 메시지 전송 권한 부여"
echo ""
echo "[ ] .env 파일에 토큰 추가:"
echo "    echo 'TELEGRAM_BOT_TOKEN=your_token' >> .env"
echo ""
echo "[ ] 테스트 실행:"
echo "    export \$(cat .env | grep TELEGRAM_BOT_TOKEN | xargs)"
echo "    node scripts/test-telegram.js"
echo ""
read -p "✅ Step 1 완료? (계속하려면 Enter) " -r

# ============================================
# Step 2: Vercel 환경변수 - Telegram
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Vercel에 TELEGRAM_BOT_TOKEN 추가"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "[ ] 명령어 실행:"
echo "    npx vercel env add TELEGRAM_BOT_TOKEN production"
echo ""
echo "    프롬프트에서 토큰 입력"
echo ""
read -p "✅ Step 2 완료? (계속하려면 Enter) " -r

# ============================================
# Step 3: 빌드 및 배포
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: 빌드 및 Git 배포"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "[ ] 클라이언트 빌드:"
echo "    npm run build:client"
echo ""
echo "[ ] Git status 확인:"
echo "    git status"
echo ""
echo "[ ] 변경사항 커밋:"
echo "    git add ."
echo "    git commit -m 'feat: Add Stripe webhook and Telegram notifications'"
echo ""
echo "[ ] 배포 (특수 SSH 키):"
echo "    GIT_SSH_COMMAND='ssh -i ~/.ssh/id_openclaw_dalconnect' git push origin main"
echo ""
echo "[ ] Vercel 배포 확인:"
echo "    https://vercel.com/dashboard"
echo ""
read -p "✅ Step 3 완료? (계속하려면 Enter) " -r

# ============================================
# Step 4: Stripe Webhook 등록
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: Stripe Webhook 등록"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "[ ] Stripe Secret Key 설정:"
echo "    export STRIPE_SECRET_KEY=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"
echo ""
echo "[ ] Webhook 등록 실행:"
echo "    node scripts/register-webhook.js"
echo ""
echo "[ ] 출력된 Webhook Secret을 복사하세요!"
echo "    형식: whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
echo ""
read -p "✅ Step 4 완료? Webhook Secret 복사했나요? (계속하려면 Enter) " -r

# ============================================
# Step 5: Webhook Secret 추가
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 5: Vercel에 STRIPE_WEBHOOK_SECRET 추가"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "[ ] 명령어 실행:"
echo "    npx vercel env add STRIPE_WEBHOOK_SECRET production"
echo ""
echo "    프롬프트에서 whsec_... 입력"
echo ""
read -p "✅ Step 5 완료? (계속하려면 Enter) " -r

# ============================================
# Step 6: 재배포
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 6: 환경변수 적용을 위한 재배포"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "[ ] Vercel 재배포:"
echo "    npx vercel --prod"
echo ""
echo "    또는 Vercel Dashboard에서 수동 재배포"
echo ""
read -p "✅ Step 6 완료? (계속하려면 Enter) " -r

# ============================================
# Step 7: 테스트
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 7: 시스템 테스트"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "[ ] Stripe CLI 설치 (없는 경우):"
echo "    brew install stripe/stripe-cli/stripe"
echo ""
echo "[ ] Stripe 로그인:"
echo "    stripe login"
echo ""
echo "[ ] Webhook 이벤트 테스트:"
echo "    stripe trigger checkout.session.completed"
echo "    stripe trigger customer.subscription.deleted"
echo "    stripe trigger invoice.payment_failed"
echo ""
echo "[ ] Hub-Projects 그룹에서 알림 확인"
echo ""
echo "[ ] Stripe Dashboard에서 webhook 로그 확인:"
echo "    https://dashboard.stripe.com/webhooks"
echo ""
echo "[ ] Vercel 로그 확인:"
echo "    npx vercel logs --follow"
echo ""
read -p "✅ Step 7 완료? (계속하려면 Enter) " -r

# ============================================
# 완료!
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 배포 체크리스트 완료!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ 확인 사항:"
echo "   • Telegram 알림이 Hub-Projects에 도착하는가?"
echo "   • Stripe webhook이 정상 작동하는가?"
echo "   • Database tier가 업데이트되는가?"
echo ""
echo "📚 추가 문서:"
echo "   • STRIPE-WEBHOOK-SETUP.md - 상세 가이드"
echo "   • IMPLEMENTATION-SUMMARY.md - 구현 내역"
echo ""
echo "📊 모니터링:"
echo "   • Stripe: https://dashboard.stripe.com/webhooks"
echo "   • Vercel: https://vercel.com/dashboard"
echo "   • Telegram: Hub-Projects 그룹"
echo ""
echo "🐛 문제 발생 시:"
echo "   1. Vercel 로그 확인: npx vercel logs"
echo "   2. Stripe webhook 로그 확인"
echo "   3. STRIPE-WEBHOOK-SETUP.md의 문제 해결 섹션 참조"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
