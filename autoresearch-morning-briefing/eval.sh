#!/usr/bin/env bash
# eval.sh — TTS 스크립트 품질 평가
# 사용법: ./eval.sh <tts-script.txt 경로>
# 출력:   각 eval 합격/불합격 + 총 점수

SCRIPT="$1"
if [[ ! -f "$SCRIPT" ]]; then
  echo "사용법: ./eval.sh <tts-script.txt>"
  exit 1
fi

CONTENT=$(cat "$SCRIPT")
PASS=0
FAIL=0
TOTAL=7

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Eval: $(basename $SCRIPT)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Binary Eval 1: 오프닝 ─────────────────────────────────────
if echo "$CONTENT" | grep -q "안녕하세요" && echo "$CONTENT" | grep -q "달커넥트 아침 브리핑"; then
  echo "✅ E1 오프닝: '안녕하세요' + '달커넥트 아침 브리핑' 존재"
  PASS=$((PASS+1))
else
  echo "❌ E1 오프닝: 형식 오류"
  FAIL=$((FAIL+1))
fi

# ── Binary Eval 2: 마지막 소식 클로징 ──────────────────────────
if echo "$CONTENT" | grep -q "마지막 소식입니다"; then
  echo "✅ E2 마지막: '마지막 소식입니다' 존재"
  PASS=$((PASS+1))
else
  echo "❌ E2 마지막: '마지막 소식입니다' 없음 — 슬라이드 마지막 전환 실패"
  FAIL=$((FAIL+1))
fi

# ── Binary Eval 3: 모든 순서 번호에 '소식입니다' 포함 (핵심!) ──
# "번째 소식입니다" 패턴: 첫번째, 두번째, ..., 아홉번째 소식입니다 모두 체크
ORDINAL_WITH_SOSHIK=$(echo "$CONTENT" | grep -oE '[일이삼사오육칠팔구열첫두세네다섯여섯일곱여덟아홉]+\s?번째\s?소식입니다' | wc -l | tr -d ' ')
ORDINAL_WITHOUT_SOSHIK=$(echo "$CONTENT" | grep -oE '[일이삼사오육칠팔구열첫두세네다섯여섯일곱여덟아홉]+\s?번째입니다' | grep -v '소식' | wc -l | tr -d ' ')

if [[ "$ORDINAL_WITHOUT_SOSHIK" -eq 0 ]]; then
  echo "✅ E3 순서번호: 모든 '번째' 뒤에 '소식입니다' 포함 (슬라이드 전환 정상)"
  PASS=$((PASS+1))
else
  echo "❌ E3 순서번호: '소식' 없는 번째 ${ORDINAL_WITHOUT_SOSHIK}개 — 슬라이드 전환 누락"
  FAIL=$((FAIL+1))
fi

# ── Binary Eval 4: 엔딩 ──────────────────────────────────────
if echo "$CONTENT" | grep -q "달커넥트 뉴스 여기까지" && echo "$CONTENT" | grep -q "달커넥트닷컴"; then
  echo "✅ E4 엔딩: '달커넥트 뉴스 여기까지' + '달커넥트닷컴' 존재"
  PASS=$((PASS+1))
else
  echo "❌ E4 엔딩: 엔딩 형식 오류"
  FAIL=$((FAIL+1))
fi

# ── Binary Eval 5: 온도 기호/영어 없음 ────────────────────────
if echo "$CONTENT" | grep -qE '°F|℉|화씨|Fahrenheit|°C|℃'; then
  echo "❌ E5 온도: 온도 기호/영어 포함됨 — TTS 발화 오류"
  FAIL=$((FAIL+1))
else
  echo "✅ E5 온도: 온도 기호/영어 없음"
  PASS=$((PASS+1))
fi

# ── Binary Eval 6: 날씨 최저/최고 포함 ───────────────────────
if echo "$CONTENT" | grep -q "최저" && echo "$CONTENT" | grep -q "최고"; then
  echo "✅ E6 날씨: '최저'+'최고' 존재"
  PASS=$((PASS+1))
else
  echo "❌ E6 날씨: 날씨 멘트 누락"
  FAIL=$((FAIL+1))
fi

# ── Binary Eval 7: 뉴스 개수 (최소 7개) ─────────────────────
NEWS_COUNT=$(echo "$CONTENT" | grep -cE '번째 소식입니다|마지막 소식입니다' || true)
if [[ "$NEWS_COUNT" -ge 7 ]]; then
  echo "✅ E7 뉴스수: ${NEWS_COUNT}개 (최소 7개 충족)"
  PASS=$((PASS+1))
else
  echo "❌ E7 뉴스수: ${NEWS_COUNT}개 (최소 7개 미달)"
  FAIL=$((FAIL+1))
fi

# ── 최종 점수 ────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
CHAR_COUNT=$(wc -c < "$SCRIPT" | tr -d ' ')
echo "📝 글자수: ${CHAR_COUNT}자"
echo "🎯 Binary 점수: ${PASS}/${TOTAL} ($(echo "scale=0; $PASS * 100 / $TOTAL" | bc)%)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
