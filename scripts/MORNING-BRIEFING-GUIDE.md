# 📰 DalKonnect 아침 브리핑 릴스 — 프로덕션 가이드

> 최종 확정: 2026-03-20 | 매일 아침 8시 전 IG+FB 포스팅
> **이 파일은 아침 브리핑 릴스 제작의 유일한 기준. 반드시 먼저 읽고 따를 것.**

---

## 1. 최종 디자인 스펙

### 캔버스
- **크기**: 1080 × 1920px (9:16 세로, 릴스 표준)
- **FPS**: 30
- **폰트**: Apple SD Gothic Neo (로컬 렌더링)
- **BGM**: `memory/reels-diabetes/bgm-lofi.mp3` (볼륨 12%, 루프)

### 레이아웃 (절대 위치 — 자막 줄 수와 무관하게 고정)

```
┌──────────────────────────────┐
│                              │
│       [상단 배지]             │ ← top: 72px, 수평 중앙
│    🔵 📰 뉴스 브리핑          │   bg: rgba(0,0,0,0.65)
│                              │   border: rgba(255,255,255,0.18)
│                              │   border-radius: 50px
│                              │   font: 24px, bold, white
│                              │   accent dot: 12px 원
│                              │
│                              │
│       [카테고리 아이콘]        │ ← top: 320px, 수평 중앙, 고정!
│           🏙️                 │   font-size: 90px
│                              │   margin-bottom: 12px
│       달라스 로컬             │   font: 52px, weight 900, #fff
│       교통사고 주의            │   font: 28px, weight 700, accent색
│       ─────                  │   4px, accent색, margin-top: 16px
│                              │
│                              │
│                              │
│    [TikTok 자막 영역]         │ ← bottom: 620px, 수평 중앙, 고정!
│                              │   left/right: 50px 패딩
│    I-35E와 635 합류           │   font: 58px, weight 900
│    구간 출근길에 우회하세요      │   line-height: 1.5
│                              │   word-break: keep-all
│                              │
│                              │
│                              │
│      DALKONNECT.COM          │ ← bottom: 100px, 워터마크
│                              │   rgba(255,255,255,0.2)
│                              │   font: 18px, weight 600
│                              │   letter-spacing: 4px
└──────────────────────────────┘
```

### ⚠️ 핵심 규칙 (절대 변경 금지)
1. **아이콘/타이틀 = top:320px 고정** — 자막이 1줄이든 3줄이든 위치 불변
2. **자막 = bottom:620px 고정** — 아이콘/타이틀과 독립적 위치
3. **배지 = 슬라이드 전환 시 같이 교체** (카테고리 이름+아이콘 변경)
4. **슬라이드 전환 시 이전 주제 자막 절대 넘어가지 않음** — 세그먼트 중간점(segMid) 기준 필터링
5. **배경은 전부 그라디언트** — 실제 이미지 사용 안 함

---

## 2. 색상 시스템

### 카테고리별 색상 (7개 슬라이드)

| # | 카테고리 | 아이콘 | accent | 배경 gradient (160deg) | 배지 텍스트 |
|---|---------|--------|--------|----------------------|------------|
| 0 | 인트로 | ☀️ | `#60a5fa` | `#0a0c14 → #1a2540 → #0a0c14` | 📰 뉴스 브리핑 |
| 1 | 달라스 로컬 | 🏙️ | `#60a5fa` | `#0f1a2e → #1e3a5f → #0f1a2e` | 🏙️ 달라스 로컬 |
| 2 | 한국 뉴스 | 🚨 | `#f87171` | `#1a0a0a → #3b1010 → #1a0a0a` | 🚨 한국 긴급 |
| 3 | 문화/연예 | 🎤 | `#c084fc` | `#1a0a2e → #3b1060 → #1a0a2e` | 🎵 문화 소식 |
| 4 | 환율/경제 | 💸 | `#fbbf24` | `#1a1400 → #3b3000 → #1a1400` | 💸 환율/경제 |
| 5 | 이민/비자 | 📋 | `#4ade80` | `#0a1a0a → #103b10 → #0a1a0a` | 📋 이민/비자 |
| 6 | CTA | 👇 | `#60a5fa` | `#0a0c14 → #1a2540 → #0a0c14` | 📰 뉴스 브리핑 |

### 자막 색상
- **현재 말하는 단어**: `#FFD700` (골드)
  - text-shadow: `0 0 25px rgba(255,215,0,0.45), 0 2px 6px rgba(0,0,0,1)`
- **나머지 단어**: `#FFFFFF` (흰색)
  - text-shadow: `0 2px 6px rgba(0,0,0,0.9)`

### 글로우 효과
- 위치: top 30%, 중앙
- 크기: 700×700px
- 색상: `radial-gradient(circle, {accent}18 0%, transparent 70%)`

---

## 3. TTS 스크립트 작성 규칙

### 구조 (항상 동일)
```
좋은 아침이에요, 달커넥트입니다.

{카테고리 1 인트로}
{뉴스 내용 2-3문장}

{카테고리 2 인트로}
{뉴스 내용 2-3문장}

...반복 (총 5개 카테고리)...

더 자세한 뉴스는 달커넥트 닷컴에서 확인하세요.
팔로우하고 매일 아침 받아보세요!
```

### 발음 규칙
- **고속도로**: 영어 그대로 "I-35E", "I-30" (한국어 변환 금지)
- **635**: "육삼오" (육백삼십오 ❌)
- **숫자**: 금액/통계는 한국어 읽기 ("천오백원대", "열네 명")
- **영문 약어**: 그대로 ("USCIS", "BTS")
- **문장 길이**: 짧게 끊기 (TTS가 자연스럽게 읽도록)

### 목소리
- **Freepik Leda** (현재 사용 중)
- 속도: **1.0x로 생성** → ffmpeg에서 **1.2x** 처리
- Aaron이 Freepik에서 수동 생성 → Google Drive `뉴스브리핑{MMDD}.wav`

---

## 4. 뉴스 선택 기준 (매일 5개)

| 순서 | 카테고리 | 소스 우선순위 |
|------|---------|-------------|
| 1 | 로컬뉴스 | WFAA → Fox4 RSS → DB `로컬뉴스` |
| 2 | 한국/미주뉴스 | 연합뉴스 RSS → DB `한국뉴스` `미주뉴스` |
| 3 | 문화/연예 | K-POP/스포츠 → DB `문화` `연예` |
| 4 | 환율/경제 | CNBC → 연합경제 → DB `경제` `부동산` |
| 5 | 이민/비자 or 건강 | Immigration Forum → DB `이민/비자` `건강` |

### 선택 원칙
- **임팩트 큰 뉴스** 우선 (사고, 속보, 정책 변경)
- **달라스 한인 직접 관련** 우선
- **어제 이미 다룬 뉴스** 제외
- **가짜/추측 뉴스** 제외

---

## 5. 프로덕션 파이프라인

### 전체 흐름 (목표: 8시 전 포스팅)
```
[6:00am]  ① 뉴스 수집 — DB에서 카테고리별 최신 1개씩 자동 선택
              ↓
[6:05am]  ② TTS 스크립트 생성 — Gemini로 자연스러운 한국어 변환
              ↓
[6:10am]  ③ TTS 음성 생성 ← ⚠️ 현재 병목 (Aaron 수동)
              ↓
[6:15am]  ④ ffmpeg 1.2x 속도 변환
              ↓
[6:16am]  ⑤ Whisper 전사 (word_timestamps) → JSON
              ↓
[6:18am]  ⑥ 슬라이드 전환 시점 계산 (Whisper 키워드 감지)
              ↓
[6:20am]  ⑦ Puppeteer 프레임 렌더링 (~1,540프레임, ~5분)
              ↓
[6:25am]  ⑧ ffmpeg 합성: 프레임 + 음성 + BGM(12%)
              ↓
[6:26am]  ⑨ 썸네일 생성 (날짜만 교체)
              ↓
[6:27am]  ⑩ Firebase 업로드 → IG Reel(cover_url) + FB Video(thumb)
              ↓
[7:00am]  ✅ 완료
```

### 슬라이드 전환 시점 자동 계산 방법
Whisper JSON에서 카테고리 전환 키워드 감지:
```javascript
const TRANSITION_KEYWORDS = [
  '달라스', '소식부터',           // → 달라스 로컬 슬라이드
  '한국', '소식입니다',           // → 한국 뉴스 슬라이드
  '문화', '소식이에요',           // → 문화 슬라이드
  '환율정보', '환율',             // → 환율/경제 슬라이드
  '이민', '비자', '업데이트',     // → 이민/비자 슬라이드
  '자세한', '뉴스는',             // → CTA 슬라이드
];
```

### Whisper 오타 교정 딕셔너리 (누적 — 매일 추가)
```javascript
const CORRECTIONS = {
  '오해하세요.': '우회하세요.',
  '화제가': '화재가',
  '도절': '두절',
  '한국의': '한국에',
  '동양': '동향',
  '잔여': '자녀',
  '재산기준을': '계산 기준을',
  '팔로워하고': '팔로우하고',
  'uscis가': 'USCIS가',
  '$1': '원달러',
};
// 새 오타 발견 시 여기에 추가
```

### 세그먼트 분리 규칙
- Whisper 세그먼트를 **0.3초 이상 갭** 기준으로 재분할
- 슬라이드 전환 시 **세그먼트 중간점(segMid) 기준** 필터링
  - `segMid >= slideStart && segMid < nextSlideStart`
  - 이렇게 해야 경계에 걸린 세그먼트가 누락되지 않음

---

## 6. 썸네일 스펙

### 레이아웃
- 1080 × 1920px
- 전체 중앙 정렬 (flex column, justify-content: center)
- 상단 배지: "DAILY NEWS BRIEFING"
- 중앙: 날짜 → ☀️ 이모지 → "달커넥트 아침 브리핑" → 서브타이틀
- 카테고리 아이콘 5개 그리드 (🏙️🚨🎵💸📋)
- 하단: dalkonnect.com URL 뱃지 + 워터마크
- **매일 날짜만 교체** — 나머지 동일

### 색상
- 배경: `#0a0c14 → #111827` 다크 네이비
- accent: `#60a5fa` (블루)
- 구분선: `linear-gradient(90deg, #60a5fa, #fbbf24)`
- URL 뱃지: 블루 테두리
- 워터마크: `#2ED8A3` (민트)

---

## 7. 포스팅 스펙

### 캡션 템플릿
```
☀️ 달커넥트 아침 브리핑 | {월}월 {일}일

오늘 꼭 알아야 할 달라스 & 한국 소식 ⬇️

🏙️ {로컬뉴스 한 줄}
🚨 {한국뉴스 한 줄}
🎵 {문화 한 줄}
💸 {경제 한 줄}
📋 {이민/건강 한 줄}

매일 아침 달라스 한인 뉴스 👉 dalkonnect.com
팔로우하고 매일 받아보세요!

#달커넥트 #달라스한인 #DFW한인 #아침뉴스 #달라스뉴스
#한인커뮤니티 #DFWKorean #뉴스브리핑 #이민비자 #환율 #달라스생활
```

### API 포스팅 순서
1. **MP4 + 썸네일 JPG** → Firebase Storage 업로드 (signed URL 발급)
2. **IG Reel**: `POST /{IG_ID}/media` → `media_type: REELS`, `cover_url: {썸네일URL}`, `share_to_feed: true` → 30초 대기 → `/{IG_ID}/media_publish`
3. **FB Video**: `POST /graph-video/{PAGE_ID}/videos` → `source: MP4`, `thumb: JPG`, `description: 캡션`

### ID 참조
- IG Business Account: `17841440398453483`
- FB Page ID: `1077704625421219`
- Firebase Bucket: `konnect-ceedb.firebasestorage.app`
- Token: `.env.local` → `FACEBOOK_PAGE_ACCESS_TOKEN`

---

## 8. 파일 구조 (매일 생성)

```
memory/morning-reels/YYYY-MM-DD/
├── voice_raw.wav            # TTS 원본 (Leda)
├── voice_1.20x.mp3          # 1.2x 속도 변환
├── voice_1.20x.json         # Whisper 단어 타임스탬프
├── thumbnail.png            # 썸네일 원본
├── thumbnail.jpg            # 썸네일 JPEG (IG용)
├── frames/                  # Puppeteer 프레임들
│   ├── frame_00000.png
│   ├── frame_00001.png
│   └── ... (~1,540개)
├── news-briefing-final.mp4  # 최종 릴스
└── gen-briefing.cjs         # 생성 스크립트 (당일 설정 포함)
```

---

## 9. ⚠️ TTS 병목 — Aaron 결정 필요

| 방식 | 완전자동 | 품질 | 비용 |
|------|---------|------|------|
| **Freepik Leda** (현재) | ❌ Aaron 수동 | ⭐⭐⭐⭐⭐ | 무료 |
| **OpenAI TTS** (shimmer 1.15x) | ✅ API 자동 | ⭐⭐⭐⭐ | ~$0.03/일 |
| **ElevenLabs** (Yuna/Minji) | ✅ API 자동 | ⭐⭐⭐⭐⭐ | 크레딧 부족 |

**Leda 유지** → Aaron이 전날 밤 or 아침에 Freepik에서 생성 → Drive 업로드 → 크론이 나머지 처리
**OpenAI 전환** → 완전 자동 6am 크론 (뉴스 선택 → TTS → 렌더링 → 포스팅)

---

## 10. 레퍼런스 스크립트

### 최종 작동 스크립트 (2026-03-20 확정)
- **렌더링**: `memory/morning-reels/2026-03-20/gen-briefing-v3.cjs`
- **썸네일**: `memory/morning-reels/2026-03-20/gen-thumbnail.cjs`
- **캐러셀 참고**: `scripts/gen-gukbap-carousel.cjs`, `scripts/gen-jjamppong-carousel.cjs`
- **릴스 참고**: `scripts/gen-health-reels-v4.cjs`, `scripts/gen-spring-reels.cjs`
- **포스팅 참고**: `scripts/post-gukbap-carousel.cjs`, `scripts/post-health-reels.cjs`
