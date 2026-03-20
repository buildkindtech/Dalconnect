# 📐 DalKonnect Instagram 비주얼 스타일 가이드

> **규칙**: 새 포스트 만들기 전 반드시 이 파일 읽기.
> 카테고리별 컬러/레이아웃/폰트 통일이 핵심.
> 업데이트 시 날짜 기록.

---

## 🎨 공통 디자인 시스템

### 폰트
```css
font-family: 'Apple SD Gothic Neo', sans-serif;  /* 반드시 local() — Google Fonts 금지 */
제목:    font-size: 60-72px; font-weight: 900;
소제목:  font-size: 28-32px; font-weight: 700;
본문:    font-size: 24-28px; font-weight: 500;
배지/태그: font-size: 18-22px; font-weight: 700;
```

### 캔버스 크기
```
단일 이미지 / 업체 스팟라이트: 1080×1080px
릴스 슬라이드:                 1080×1920px
```

### 공통 브랜딩 요소 (모든 포스트)
```
우하단 또는 하단 중앙: DALKONNECT.COM (흰색 반투명, letter-spacing:4px)
브랜드 도트: width:9px, height:9px, background:#2ED8A3, border-radius:50%
```

---

## 📦 카테고리 1: 업체 스팟라이트 🔍

**레퍼런스 파일**: `gen-biz-card.cjs`, `spotlight_clickit.png`, `spotlight_dental.png`, `spotlight_nail.png`

### 레이아웃
```
배경:     업체 실제 사진 full-bleed (center/cover)
오버레이:  gradient to bottom
           투명(0%) → 15%(30%) → 60%(62%) → 95%(100%)
콘텐츠:   하단 정렬 (bottom padding 56px) — 가운데 정렬(text-align:center)
```

### 스타일 토큰
```css
/* 상단 배지 (좌) */
.badge { background: #e8372a; border-radius: 50px; padding: 10px 28px; color: #fff; font-size: 20px; font-weight: 700; }

/* 평점 배지 (우) */
.rating { background: rgba(0,0,0,0.55); border: 1px solid rgba(255,255,255,0.25); border-radius: 50px; padding: 10px 24px; }

/* 카테고리 텍스트 */
.category { color: #FF9F43; font-size: 20px; font-weight: 700; letter-spacing: 2px; }

/* 업체명 */
.name { color: #fff; font-size: 68-72px; font-weight: 900; text-shadow: 0 2px 20px rgba(0,0,0,0.8); }

/* 구분선 */
.divider { width: 56px; height: 5px; background: #FF9F43; border-radius: 3px; margin: 16px auto; }

/* 설명 */
.desc { color: rgba(255,255,255,0.85); font-size: 28px; line-height: 1.65; }

/* 정보 (주소/전화) */
.info { color: rgba(255,255,255,0.75); font-size: 20px; }

/* CTA 버튼 */
.cta { background: #FF9F43; border-radius: 50px; padding: 16px 52px; }
.cta-text { color: #000; font-size: 21px; font-weight: 900; }
```

### 카테고리별 배지 텍스트
| 업종 | 배지 |
|---|---|
| 식당/맛집 | 🍱 업체 스팟라이트 |
| 미용/네일 | 💅 업체 스팟라이트 |
| 병원/치과 | 🏥 업체 스팟라이트 |
| 학원/교육 | 📚 업체 스팟라이트 |
| 사진관/스튜디오 | 📸 업체 스팟라이트 |
| 기타 서비스 | ✨ 업체 스팟라이트 |

### 캡션 템플릿
```
{이모지} 이주의 달라스 업소 스팟라이트!

✨ {업체명}
📍 {도시/지역}

⭐ {평점} 별점 · 리뷰 {수}개
{한줄 임팩트 설명}

{설명 2-3줄}

📞 {전화번호}
🌐 {웹사이트}

👉 달커넥트에서 더 많은 DFW 한인 업소 찾기
dalkonnect.com/businesses

#달커넥트 #DalKonnect #달라스한인 #DFW한인 #{도시} #달라스생활 #DFWKorean #KoreanDallas #{업종태그} #{업종태그2} #달라스데이트 #재미교포
```

---

## 📦 카테고리 2: 뉴스 카드 📰

**레퍼런스 파일**: `gen-local-news.cjs`, `news-fishing-card.jpg`, `news-0317-*.png`

### 레이아웃
```
배경:     기사 실제 이미지 (OG 또는 DB thumbnail_url) full-bleed
오버레이:  카테고리 색상 기반 gradient
콘텐츠:   가운데 정렬 (absolute center) 또는 하단 정렬
```

### 카테고리별 컬러 시스템
```css
/* 로컬 긴급뉴스 */
배지배경:  #dc2626  오버레이: rgba(100,0,0,0.75)  accent: #f87171

/* 건강/안전 경고 */
배지배경:  #d97706  오버레이: rgba(80,40,0,0.8)   accent: #fbbf24

/* 이민/비자 */
배지배경:  #1D4ED8  오버레이: rgba(0,20,80,0.82)  accent: #93c5fd

/* K-POP/연예 */
배지배경:  #7C3AED  오버레이: rgba(30,0,60,0.82)  accent: #c084fc

/* 일반 지역뉴스 */
배지배경:  #374151  오버레이: rgba(0,0,0,0.85)    accent: #60a5fa
```

### 스타일 토큰
```css
/* 카테고리 배지 (좌상단) */
badge { border-radius: 8px; padding: 8px 20px; font-size: 20px; font-weight: 700; }

/* 출처 배지 (우상단) */
source { background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.3); border-radius: 50px; }

/* 헤드라인 */
headline { font-size: 60-66px; font-weight: 900; color: #fff; text-shadow: 0 2px 12px rgba(0,0,0,0.9); }

/* 서브 설명 */
summary { font-size: 27-30px; color: rgba(255,255,255,0.75); line-height: 1.7; }

/* divider */
divider { width: 60px; height: 4px; border-radius: 2px; }  /* 색상은 카테고리 accent */

/* 하단 태그 */
ftag { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 30px; padding: 8px 20px; font-size: 18px; }
```

### 이미지 소싱 우선순위
1. **기사 직접 사진** (Aaron 전송) → 그대로 BG
2. **DB thumbnail_url** → `SELECT thumbnail_url FROM news WHERE title ILIKE '%키워드%'`
3. **OG 이미지 추출** → fetch URL → `og:image` meta 파싱
4. **이미지 없을 때** → 어두운 단색 gradient BG (텍스트 카드 스타일)

---

## 📦 카테고리 3: 맛집 캐러셀 🍗

**레퍼런스 파일**: `gen-gukbap-carousel.cjs`, `gen-chicken-carousel.cjs`

### 슬라이드 구성
```
[0] 커버:   타이틀 + 음식 이모지 (dark gradient BG, 주황 glow)
[1-4] 업체: 실제 음식 사진 + 업체정보
[5] CTA:    "댓글로 알려주세요" + dalkonnect.com
```

### 스타일 토큰
```css
/* 커버 배경 */
background: linear-gradient(135deg, #0d1117 0%, #1a2332 100%);
glow: radial-gradient(circle, rgba(255,160,50,0.25) 0%, transparent 70%);

/* accent */
accent: #FFA032 (주황)

/* 업체 카드 오버레이 */
gradient: 투명(0%) → 검정97%(100%) — 하단 무거운 스타일

/* 순번 배지 */
.num { width:56px; height:56px; background:#FFA032; border-radius:50%; color:#000; font-size:28px; font-weight:900; }

/* 업체명 */
font-size: 54-60px; font-weight: 900;

/* CTA 슬라이드 배경 */
background: linear-gradient(135deg, #0d1117, #1a2332);
button: #FFA032, color: #000, border-radius: 50px
```

---

## 📦 카테고리 4: 날씨 카드 🌦️

**레퍼런스 파일**: `gen-weather-card.cjs`, `weather-norther-0317.png`

### 스타일 토큰
```css
배경: dark blue/grey gradient
accent: 날씨 상태별 (맑음:#FBBF24 / 비:#60A5FA / 한파:#93C5FD / 더위:#F97316)
아이콘: 날씨 이모지 크게 (160px+)
온도: 120px+ font-weight:900
```

---

## 📦 카테고리 5: 건강정보 릴스 🏥

**레퍼런스 파일**: `gen-health-reels-v4.cjs`, `REELS-HOWTO.md`

### 핵심 규칙
- 형식: **카라오케 스타일** (현재 단어 🟡 #FFD700 + glow, 나머지 흰색)
- BGM: Inspiration.mp3 (건강/라이프스타일)
- 속도: 1.20x
- 슬라이드: s1-hook / s2-s4-tip / s5-cta
- 캔버스: 1080×1920

---

## 📦 카테고리 6: 생활정보 릴스 🏡

**레퍼런스 파일**: `gen-spring-reels.cjs`

### 핵심 규칙
- 형식: **카라오케 스타일** (현재 단어 #FFD700)
- BGM: LoFi.mp3 (달라스 생활/음식)
- 속도: 1.20x
- 마지막 슬라이드: 협찬 업체 실제 사진 + CTA
- 캔버스: 1080×1920

---

## 📦 카테고리 7: 딜/할인 카드 🛍️

**레퍼런스 파일**: `gen-deal-card.cjs`

### 스타일 토큰
```css
배경: 어두운 gradient + 초록 glow
accent: #10B981 (초록)
배지: 🛍️ 특별할인 (초록 배경)
가격 강조: font-size:88px; font-weight:900; color:#10B981
```

---

## 🚦 포스트 제작 체크리스트

### 이미지 생성 전
- [ ] 카테고리 확인 → 위 가이드에서 accent 색상 찾기
- [ ] 이미지 소싱 (실제 사진 우선, 텍스트카드 최후 수단)
- [ ] 폰트: `local('Apple SD Gothic Neo')` (Google Fonts 절대 금지)
- [ ] 캔버스 사이즈 확인 (단일=1080×1080, 릴스=1080×1920)

### 이미지 생성 후
- [ ] Aaron에게 미리보기 전송
- [ ] 수정 요청 반영
- [ ] 캡션 + 해시태그 준비

### 포스팅 전
- [ ] 토큰 유효 확인 (`me?access_token=TOKEN`)
- [ ] "올려" 확인 받기
- [ ] Firebase Signed URL로 업로드 (makePublic 금지 — uniform ACL)

---

## 🎯 포스팅 빈도 전략

| 카테고리 | 빈도 | 최적 시간 |
|---|---|---|
| 🍱 맛집/업체 스팟라이트 | 주 2-3회 | 11am / 6pm |
| 📰 뉴스 카드 | 이슈 있을 때 | 바로 |
| 🏡 생활정보 릴스 | 주 1-2회 | 10am |
| 🏥 건강 릴스 | 주 1회 | 아침 |
| 🌦️ 날씨 | 주요 변화 시 | 6am |
| 🛍️ 딜/할인 | 발견 즉시 | 바로 |

---

## 🔄 파일 네이밍 규칙

```
생성 스크립트:  gen-{카테고리}-{세부}.cjs
포스팅 스크립트: post-{카테고리}-{세부}.cjs
이미지 출력:    memory/spotlight-{업체}.jpg
                memory/news-{주제}.jpg
                memory/reels-{주제}/output.mp4
sns-cards/:     {카테고리}/{MMDD}-{업체/주제}.png
```

---

*최종 업데이트: 2026-03-19 | 담당: OpenClaw*
