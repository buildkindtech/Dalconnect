#!/bin/bash
# ============================================================
# DalKonnect Pre-Deploy Check
# 배포 전 반드시 ALL PASS 확인. 하나라도 실패하면 push 금지.
# 사용법: bash scripts/predeploy-check.sh
# ============================================================

set -e
PASS=0
FAIL=0

echo "=================================================="
echo "🔍 DalKonnect Pre-Deploy Check"
echo "=================================================="

# 1. TypeScript 타입 검사
echo ""
echo "📘 1. TypeScript 타입 검사..."
if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
  echo "  ❌ TypeScript 에러 있음:"
  npx tsc --noEmit 2>&1 | grep "error TS"
  FAIL=$((FAIL+1))
else
  echo "  ✅ TypeScript 에러 없음"
  PASS=$((PASS+1))
fi

# 2. 클라이언트 빌드
echo ""
echo "🔨 2. 클라이언트 빌드..."
if npm run build:client > /tmp/build.log 2>&1; then
  echo "  ✅ 빌드 성공"
  PASS=$((PASS+1))
else
  echo "  ❌ 빌드 실패:"
  tail -20 /tmp/build.log
  FAIL=$((FAIL+1))
fi

# 3. 로컬 서버 헬스체크
echo ""
echo "🏥 3. 로컬 서버 헬스체크..."
if curl -s http://localhost:5000/api/news > /dev/null 2>&1; then
  RESULT=$(node scripts/health-check.cjs 2>&1)
  if echo "$RESULT" | grep -q "ALL PASS"; then
    echo "  ✅ 헬스체크 ALL PASS"
    PASS=$((PASS+1))
  else
    echo "  ❌ 헬스체크 실패:"
    echo "$RESULT" | grep "❌\|결과"
    FAIL=$((FAIL+1))
  fi
else
  echo "  ⚠️  로컬 서버 꺼져있음 — 서버 시작 후 재실행"
  FAIL=$((FAIL+1))
fi

# 결과
echo ""
echo "=================================================="
if [ $FAIL -eq 0 ]; then
  echo "✅ ALL PASS ($PASS/3) — 배포 준비 완료"
  echo "   다음 단계: Aaron에게 확인 후 git push origin main"
  exit 0
else
  echo "❌ 실패 $FAIL개 — 수정 후 재실행"
  exit 1
fi
