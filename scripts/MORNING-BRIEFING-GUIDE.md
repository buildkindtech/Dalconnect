# 📰 DalKonnect 아침 브리핑 릴스 — 프로덕션 가이드

> 최종 확정: 2026-04-12 | 매일 아침 포스팅 (Aaron "올려" 승인 후)
> **이 파일은 아침 브리핑 릴스 제작의 유일한 기준. 반드시 먼저 읽고 따를 것.**

---

## 0. 🚨 운영 절대 규칙 (4/10 업데이트 — 반드시 준수)

### WAV 파일 받으면 즉시 파이프라인 실행 (질문 금지)
- Aaron이 Telegram으로 WAV/음성 파일을 보내면 → **즉시 `briefing-pipeline.sh` 실행**
- Drive 어디에 있냐 묻지 말 것 — Telegram 첨부파일로 직접 받은 경우 그 파일 사용
- 파일명, TTS 방법, 경로 등 확인 질문 일절 금지
- **예외 없음: 음성 파일 도착 = 파이프라인 즉시 시작**

```
# WAV 받으면 바로 실행:
./cron/briefing-pipeline.sh 2026-04-10 /path/to/received.wav
```

### 포스팅은 Aaron "올려" 후에만 (자동 포스팅 절대 금지)
- 파이프라인은 영상+썸네일 생성 후 **Telegram 미리보기 전송**에서 멈춤
- `briefing-pipeline.sh` Step 5 = 미리보기 전송 (포스팅 아님)
- Aaron이 "올려"라고 답장 → `cron/briefing-post.cjs YYYY-MM-DD` 실행

### 슬라이드 전환 자동 감지 (4/12 최종 — 하이브리드 방식)
- **카테고리 헤더 감지**: 스크립트에서 "달라스 로컬 소식입니다", "한국 뉴스입니다" 등 감지 → 첫 슬라이드 전환
- **카테고리 내 추가 슬라이드**: subtitle 키워드를 Whisper에서 검색 → 정확한 전환 시점
- **CTA**: "여기까지" 감지 → 마지막 슬라이드
- Fallback: 감지 < 절반 → 균등 분배

### 타이밍 시스템 (4/12 리팩터 — 드리프트 원천 차단)
- **절대 타임스탬프 방식**: 각 프레임에 Whisper startTime 저장
- duration = `startTime[i+1] - startTime[i]`, 마지막 = `totalDur - lastStartTime`
- `sum(dur) = totalDur` 수학적으로 보장 → 드리프트 불가능
- 페이드 프레임 제거 (드리프트 원인이었음, 시각 효과 미미)
- 렌더 끝에 자동 검증 로그: `🔍 타이밍 검증: 프레임 합산 Xs / 오디오 Xs (차이: 0.000s)`

---

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

### ⚠️ 날짜 규칙 (반드시 지킬 것 — 2026-04-08 실수 기록)
- TTS 날짜 = **Aaron이 음성 파일을 전송하는 당일 날짜**
- 뉴스 후보 리스트(4:45am)는 "내일" 기준이지만, 실제 TTS 녹음과 포스팅은 **그 다음날 아침** (= 당일)
- Aaron이 수요일에 오디오 전송 → "4월 8일 수요일" (오늘 날짜 사용)
- **절대 내일 날짜 쓰지 말 것**

### 구조 (확정 형식 — 2026-04-08 기준)
```
안녕하세요, 달커넥트 아침 브리핑입니다.
{M}월 {D}일 {요일}, 달라스 날씨 먼저 전해드리겠습니다.
오늘은 [날씨 설명] 최저 {min}도, 최고 {max}도가 예상됩니다.
오늘 소식 {N}가지 전해드리겠습니다.

첫번째 소식입니다. {뉴스 2-3문장}

두번째입니다. {뉴스 2-3문장}

세번째입니다. {뉴스 2-3문장}

...

마지막 소식입니다. {뉴스 2-3문장}

오늘 달커넥트 뉴스 여기까지입니다.
더 자세한 내용은 달커넥트닷컴에서 만나보세요.
즐거운 {요일} 되세요. 감사합니다.
```

### 핵심 규칙
- **순서 번호 방식**: "첫번째 소식입니다 / 두번째입니다 / 마지막 소식입니다" (카테고리명 금지)
- **각 소식 2-3문장** (너무 길면 안 됨 — 전체 130초 이내 목표)
- 뉴스 소식 개수는 Aaron이 선택한 후보 수에 맞춤

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

## 5. 프로덕션 파이프라인 (2026-04-10 현행)

### Phase 1: 뉴스 후보 선정 (4:45am 자동 크론)
```bash
node cron/news-candidates.cjs
# → DB 48h 뉴스 조회 → 12개 후보 → Telegram 달커넥트 방 전송
```

### Phase 2: TTS 스크립트 생성 (Aaron 선택 후)
```bash
node cron/briefing-tts-gen.cjs 1,3,5,7,9   # Aaron이 선택한 번호
# → tts-script.txt 생성 → Telegram으로 스크립트 전송
# Aaron이 Freepik Leda로 녹음 → Telegram으로 WAV 파일 전송
```

### Phase 3: 영상 제작 파이프라인 (WAV 받으면 즉시 실행)
```bash
./cron/briefing-pipeline.sh YYYY-MM-DD /path/to/voice.wav
```

파이프라인 내부 단계:
```
Step 1: ffmpeg 1.2x atempo 변환 (voice_raw.wav → voice_1.20x.mp3)
Step 2: mlx_whisper (Apple Silicon 최적화, ~30초) 전사 → voice_1.20x.json
        명령: mlx_whisper voice_1.20x.mp3 --model mlx-community/whisper-small-mlx
              --language Korean --word-timestamps True --output-format json
Step 2.5: briefing-auto-config.cjs → briefing-config.json 생성
          (Claude AI로 뉴스 파싱 + 슬라이드 구조 생성)
Step 3: briefing-render.cjs → frames/ + news-briefing-MMDD.mp4
          ✅ 슬라이드 전환: "소식입니다" 단어 직접 감지 (한글/아라비아숫자/필러 모두 커버)
          ✅ Slide-aware display groups: 슬라이드 경계에서 자막 그룹 재빌드 (단어 잘림 방지)
          ⚠️ fallback: 감지 < 절반일 때만 균등 분배 사용
Step 4: briefing-thumbnail.cjs → thumbnail.jpg
Step 5: Telegram 미리보기 전송 (영상 + 썸네일)
        → "확인 후 '올려' 라고 답장해주세요"
        ⛔ 포스팅은 여기서 멈춤 — Aaron 승인 대기
```

### Phase 4: 포스팅 (Aaron "올려" 후 실행)
```bash
node cron/briefing-post.cjs YYYY-MM-DD
# → Firebase 업로드 → IG Reel(cover_url) + FB Video(thumb)
# → Telegram 완료 보고 (IG 링크 포함)
```

### 렌더링 상세 (briefing-render.cjs — 4/12 리팩터)

#### 타이밍 소스 (우선순위)
1. `slide-timings.json` — 수동 지정 (최우선)
2. `tts-script.txt` + Whisper → DP 정렬 (스크립트 텍스트 표시, Whisper 타이밍)
3. `tts-script.txt` 글자 수 비례 계산 (Whisper 없을 때)
4. Whisper 전사 기반 (구형 fallback)
5. 균등 분배 (최후 수단)

#### 슬라이드 전환 — 절대 규칙 (4/13 확정)
- **"N번째 소식입니다"가 들리는 순간, 이미 해당 뉴스 슬라이드로 바뀌어 있어야 함**
- 전환 시점 = 순서 번호 단어("첫", "두", "세" 등)의 Whisper START 타임스탬프
- "소식입니다" 끝이 아니라 "첫 번째"의 "첫"이 시작될 때 슬라이드 전환
- "마지막 소식입니다" → "마지막"의 START 시점에 전환
- **CTA**: "여기까지" 감지 → 마지막 슬라이드

#### 슬라이드 전환 감지 (`detectTransitionsFromScript`)
- **순서번호 패턴**: "번째" 포함 단어 감지 → i-1 위치(순서번호 시작 단어)의 타임스탬프로 전환
- **"마지막"**: "마지막 소식입니다" 패턴 → "마지막" 시작 시점에 전환
- **CTA**: "여기까지" → 마지막 CTA 슬라이드
- Fallback: 감지 < 절반일 때만 균등 분배 사용

#### 자막 표시 (display groups)
- 스크립트 단어를 슬라이드별로 분류 후 문장 경계에서 그룹 분할 (최대 14단어)
- 그룹 내 단어는 항상 동일 슬라이드 배경 위에 표시
- 현재 말하는 단어: `#FFD700` (골드) 하이라이트

#### 절대 타임스탬프 프레임 생성 (드리프트 방지)
- 각 프레임에 Whisper `startTime` 저장 (duration 누적 ❌)
- 렌더 후 `dur[i] = startTime[i+1] - startTime[i]`
- 마지막 프레임: `dur = totalDur - lastStartTime`
- `sum(dur) = totalDur` 보장 → 드리프트 원천 차단
- 긴 쉼(>0.5s): 하이라이트 0.4s 표시 → 하이라이트 없는 blank 프레임

#### Whisper 오타 교정
- `briefing-config.json`의 `wordCorrections` 우선 → DEFAULT_CORRECTIONS fallback
- Chirp3-HD 필러('으', '어', '음') 자동 제거

---

## 6. 썸네일 스펙

### ⚠️ 중요: 반드시 레퍼런스 스크립트 기반으로 만들 것
- 레퍼런스: `memory/morning-reels/2026-04-02/gen-thumbnail-0402.cjs`
- **그린 배경, 밝은 배경 절대 금지** — 항상 다크 네이비

### 레이아웃
- 1080 × 1920px
- 전체 중앙 정렬 (flex column, justify-content: center)
- 배경: `linear-gradient(180deg, #0a0f1e 0%, #0d1530 40%, #091020 100%)`
- 중앙: 날짜 → 헤드라인(오늘 핵심 뉴스 한 줄) → ☀️ → "달커넥트" → "아침 브리핑" → 서브타이틀 → 구분선 → 카테고리 카드 5개
- 카테고리 카드: 오늘 다룬 소식 카테고리 아이콘+라벨 (고정값 아님, 매일 바꿀 것)
- **매일 날짜 + 헤드라인 + 카테고리 카드만 교체** — 나머지 동일

### 색상
- 배경: `linear-gradient(180deg, #0a0f1e 0%, #0d1530 40%, #091020 100%)` 다크 네이비
- 날짜: `rgba(255,255,255,0.9)`, 38px, letter-spacing 2px
- 헤드라인: `#fbbf24` (앰버), 32px
- 타이틀 "달커넥트": `#22d3ee` (시안), 96px
- 타이틀 "아침 브리핑": `#ffffff`, 96px
- 구분선: `#22d3ee`, 60px width
- 카테고리 카드: `rgba(255,255,255,0.07)` 배경, 160px width

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
├── voice_raw.wav            # TTS 원본 (Leda 1.0x)
├── voice_1.20x.mp3          # ffmpeg 1.2x atempo 변환
├── voice_1.20x.json         # Whisper word-level 타임스탬프
├── tts-script.txt           # TTS 스크립트 원문 (자막 텍스트 소스)
├── briefing-config.json     # 슬라이드 구조 + 오타 교정
├── thumbnail.png            # 썸네일 원본
├── thumbnail.jpg            # 썸네일 JPEG (IG용)
├── concat.txt               # ffmpeg concat demuxer 입력 (절대 타임스탬프 기반)
├── frames/                  # Puppeteer 프레임들
│   ├── frame_00000.png
│   └── ... (~280개, 절대 타임스탬프 방식)
└── news-briefing-MMDD.mp4   # 최종 릴스 (4-5MB)
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
