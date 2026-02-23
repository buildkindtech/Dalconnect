#!/bin/bash
# Vercel 환경변수 자동 추가 스크립트

set -e

echo "🔑 Vercel 환경변수 자동 추가 중..."

# 1. Vercel 로그인 (브라우저 열림)
echo "1️⃣ Vercel 로그인 중..."
vercel login

# 2. 프로젝트 연결
echo "2️⃣ Vercel 프로젝트 연결 중..."
vercel link --yes

# 3. .env에서 DATABASE_URL 읽기
if [ ! -f .env ]; then
  echo "❌ .env 파일이 없습니다!"
  exit 1
fi

DATABASE_URL=$(grep "^DATABASE_URL=" .env | cut -d '=' -f2-)

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL이 .env에 없습니다!"
  exit 1
fi

echo "✅ DATABASE_URL 찾음: ${DATABASE_URL:0:50}..."

# 4. Vercel 환경변수 추가 (Production, Preview, Development)
echo "3️⃣ Vercel 환경변수 추가 중..."

vercel env add DATABASE_URL production <<< "$DATABASE_URL"
vercel env add DATABASE_URL preview <<< "$DATABASE_URL"
vercel env add DATABASE_URL development <<< "$DATABASE_URL"

echo "✅ DATABASE_URL 추가 완료!"

# 5. 재배포
echo "4️⃣ Vercel 재배포 중..."
vercel --prod

echo ""
echo "🎉 완료! Vercel 배포 성공"
echo ""
echo "📱 URL 확인:"
vercel ls | head -5
