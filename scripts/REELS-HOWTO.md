# 달커넥트 릴스 제작 완전 가이드
> 2026-03-19 완성 기준 — 이 파일 그대로 따라하면 됨

---

## 🔤 자막 글씨 스타일 (핵심)

### 현재 단어 (active)
```css
color: #FFD700;  /* 🟡 골든 옐로우 */
text-shadow: 0 0 25px rgba(255,215,0,0.4), 0 2px 6px rgba(0,0,0,1);
font-weight: 900;
font-size: 62px;
```

### 주변 단어 (inactive)
```css
color: #FFFFFF;  /* 흰색 */
text-shadow: 0 2px 6px rgba(0,0,0,0.9);
font-weight: 900;
font-size: 62px;
```

### 공통
- 폰트: `local('Apple SD Gothic Neo')` — 구글폰트 절대 금지 (타임아웃)
- 줄간격: `line-height: 1.45`
- 줄바꿈: `word-break: keep-all` (한국어 단어 중간 안 잘림)
- 텍스트 정렬: `text-align: center`
- 위치: `bottom: 400px` (인스타 UI 영역 피함)
- 좌우 여백: `left: 60px; right: 60px`

### 배경 오버레이 (텍스트 가독성)
```css
/* 하단으로 갈수록 어두워지는 그라데이션 */
background: linear-gradient(
  to bottom,
  transparent 0%,
  transparent 48%,
  rgba(0,0,0,0.35) 63%,
  rgba(0,0,0,0.78) 80%,
  rgba(0,0,0,0.93) 100%
);
```
→ 슬라이드 배경 위에 이 오버레이를 깔아야 글씨가 잘 보임

### 상단 뱃지
```css
background: rgba(0,0,0,0.65);
border: 1px solid rgba(255,255,255,0.15);
border-radius: 50px;
padding: 14px 40px;
/* 내용: 빨간 점 + 카테고리명 (흰색 24px Bold) */
```

### 하단 워터마크
```css
position: absolute;
bottom: 340px; right: 170px;  /* 오른쪽 아이콘 피함 */
color: rgba(255,255,255,0.22);
font-size: 17px; letter-spacing: 4px;
/* 텍스트: DALKONNECT.COM */
```

---

## 🎯 완성된 릴스 스펙

| 항목 | 값 |
|---|---|
| 해상도 | 1080×1920 (9:16 세로) |
| 영상 길이 | 나레이션 길이에 자동 맞춤 |
| 자막 스타일 | TikTok 카라오케 — 현재 단어 🟡 노란색, 나머지 흰색 |
| BGM | Inspiration.mp3 @ 0.15볼륨 (스테레오 44100Hz) |
| 배경 | Puppeteer로 생성한 슬라이드 5장 (주제별 색상) |
| 자막 위치 | bottom: 400px (인스타 UI 안 가림) |
| 폰트 | `local('Apple SD Gothic Neo')` 62px Bold |
| 상단 뱃지 | 다크 pill + 빨간 점 + 카테고리명 |

---

## 📁 파일 위치

```
dalconnect/
├── scripts/
│   ├── gen-health-reels-v4.cjs     ← 슬라이드+자막 영상 생성
│   ├── post-health-reels.cjs       ← IG 업로드
│   └── REELS-GUIDE.md              ← 카테고리별 가이드
└── memory/
    └── reels-diabetes/             ← 출력 파일들
        ├── s1-hook.png ~ s5-cta.png   (슬라이드 배경)
        ├── voice-health1-1.20x.mp3    (나레이션)
        ├── voice-health1-1.20x.json   (Whisper 타이밍)
        ├── bgm-inspiration.mp3        (BGM)
        ├── frames-v4/                 (생성된 프레임들)
        ├── health-reels-v4.mp4        (영상, BGM 없음)
        └── health-reels-v4-bgm.mp4    (최종 영상, BGM 포함)
```

---

## 🔄 전체 워크플로우 (단계별)

### STEP 1: 주제 선정 + 스크립트 작성

**규칙:**
- 앞에 반드시: `"달커넥트입니다."`
- 뒤에 반드시: `"달라스 한인 커뮤니티 달커넥트에서 더 많은 [주제] 정보를 확인하세요."`
- 길이: 35~45초 (너무 짧으면 정보 부족, 너무 길면 이탈)
- 언어: 한국어 (타겟: 달라스 한인)

---

### STEP 2: 나레이션 녹음 (Freepik TTS)

1. Freepik 접속 → AI Voice Generator
2. 스크립트 붙여넣기
3. 목소리: **Yi Minji** (여성, 자연스러운 한국어)
4. 다운로드 → `voice-[주제]1.wav` 저장

---

### STEP 3: 음성 속도 조정 (1.20x)

```bash
ffmpeg -y -i voice-[주제]1.wav \
  -filter:a "atempo=1.20" \
  -codec:a libmp3lame -b:a 192k \
  voice-[주제]1-1.20x.mp3
```

> ⚠️ 속도: 반드시 **1.20x** (Aaron 승인된 속도)

---

### STEP 4: Whisper 타이밍 추출

```bash
whisper voice-[주제]1-1.20x.mp3 \
  --language ko \
  --model base \
  --word_timestamps True \
  --output_format json \
  --output_dir ./memory/reels-[주제]/
```

→ `voice-[주제]1-1.20x.json` 생성됨 (단어별 start/end 타이밍)

---

### STEP 5: 슬라이드 배경 생성

**`gen-health-reels-v4.cjs` 상단의 슬라이드 HTML 수정:**

슬라이드 5장 기준:
- s1: 훅/도입 (배경색: 다크 레드 계열)
- s2: 문제 제기 (배경색: 다크 옐로우 계열)
- s3: 팁 1번 (배경색: 다크 인디고 계열)
- s4: 팁 2번 (배경색: 다크 그린 계열)
- s5: CTA (배경색: 다크 퍼플 계열)

주제 바뀌면 텍스트만 교체, 스타일은 유지.

---

### STEP 6: 오타 교정 사전 등록

Whisper가 잘못 인식하는 단어들 미리 등록:

```js
// gen-[주제]-reels-v4.cjs 내 CORRECTIONS 객체
const CORRECTIONS = {
  '설팅을': '설탕을',   // 당뇨편 예시
  '설팅': '설탕',
  '정황성이': '저항성이',
  // 새 주제마다 추가
};
```

---

### STEP 7: 영상 생성

```bash
node scripts/gen-health-reels-v4.cjs
```

**처리 내용:**
1. Whisper JSON → 12개 자연 문장 세그먼트로 그룹핑
2. 세그먼트별로 Puppeteer 프레임 생성 (75개)
3. 각 단어 = 1프레임 (그룹 내 단어 고정 + 현재 단어 🟡)
4. ffmpeg으로 concat + 나레이션 + BGM 믹스

**자막 핵심 로직:**
```
세그먼트(자연 문장) 안에서만 하이라이트 이동
→ 그룹 바뀔 때만 텍스트 교체 (흔들림 없음)
```

---

### STEP 8: BGM 믹스 (필요시 별도)

영상에 BGM이 안 들릴 때:

```bash
ffmpeg -y \
  -i health-reels-v4.mp4 \
  -i bgm-inspiration.mp3 \
  -filter_complex \
    "[0:a]aresample=44100,pan=stereo|c0=c0|c1=c0[voice];[1:a]volume=0.30[bgm];[voice][bgm]amix=inputs=2:duration=first:dropout_transition=3[aout]" \
  -map 0:v -map "[aout]" \
  -c:v copy \
  -c:a aac -b:a 192k -ar 44100 -ac 2 \
  -shortest \
  health-reels-v4-bgm.mp4
```

> BGM 파일: `memory/reels-diabetes/bgm-inspiration.mp3`
> (Google Drive: Konnect BGM 폴더 > Inspiration.mp3)

---

### STEP 9: 썸네일 생성

```bash
node /tmp/gen-thumbnail.js   # 또는 스크립트 별도 작성
```

**썸네일 스펙:**
- 1080×1920 JPEG
- 배경: 검정 + 글로우 효과
- 상단: 경고 뱃지 (빨간)
- 중앙: 큰 타이틀 (그라데이션)
- 하단: 태그 3-4개
- 워터마크: DALKONNECT.COM

---

### STEP 10: 인스타 업로드

```bash
node scripts/post-health-reels.cjs
```

**업로드 방식:**
1. Firebase Storage에 영상 + 썸네일 업로드 (Signed URL, 24시간)
2. IG Reels 컨테이너 생성 (`media_type: REELS`, `cover_url` 포함)
3. 처리 대기 (~70초)
4. 게시

---

## ⚠️ 인스타 세이프존 (필수!)

```
텍스트: bottom 400px 위 (하단 IG UI가 400px 덮음)
우측: 170px 여백 (❤️💬 아이콘 영역)
폰트: 62px (74px은 너무 큼)
```

---

## 🔑 토큰 관리

**Facebook Page Access Token 만료 시:**

1. https://developers.facebook.com/tools/explorer 접속
2. App: **DalKonnect (1344377567717574)** 선택
3. Generate Access Token (권한: pages_manage_posts, instagram_content_publish, instagram_basic)
4. 받은 User Token → Page Token으로 교환:

```bash
TOKEN="[새 User Token]"
curl "https://graph.facebook.com/v19.0/1077704625421219?fields=access_token&access_token=${TOKEN}"
```

5. `.env.local`의 `FACEBOOK_PAGE_ACCESS_TOKEN` 업데이트

---

## 📋 캡션 + 해시태그 템플릿

```
[이모지] [훅 제목]

[본문 2-3줄 — 핵심 정보]

👉 더 많은 달라스 한인 [주제] 정보 → dalkonnect.com

#달커넥트 #DalKonnect #달라스한인 #DFW한인 
#[주제태그1] #[주제태그2] #[주제태그3]
#DFWKorean #KoreanDallas #달라스생활
```

---

## 🎵 BGM 선택 방법

**소스: Google Drive → Konnect BGM 폴더**
- Drive 계정: `info@buildkind.tech`
- 폴더 ID: `1Mc8bWdlZLY1iKzvSWprtQFLdGfGhK_Zx`
- 4개 중에서 주제에 맞게 선택

| 파일명 | 분위기 | 추천 주제 |
|---|---|---|
| **Inspiration.mp3** | 따뜻하고 감성적 | 건강/생활 정보 ✅ (이번편) |
| **LoFi_Hip_Hop_Beat_Cozy_Rhodes_85_BPM_No_Vocals.mp3** | 여유롭고 차분 | 달라스 생활/맛집/부동산 |
| **The_perfect_ads.mp3** | 경쾌하고 밝음 | 홍보/이벤트/앱 소개 |
| **Tutorial.mp3** | 깔끔하고 정보적 | 가이드/사용법/뉴스 |

### BGM 다운로드 (gog CLI)
```bash
# 파일 ID로 다운로드
gog drive download [파일ID] --account info@buildkind.tech

# 또는 폴더 전체 목록 확인
gog drive list 1Mc8bWdlZLY1iKzvSWprtQFLdGfGhK_Zx --account info@buildkind.tech
```

### BGM 볼륨
- 믹스 볼륨: `0.15` (나레이션이 주, BGM은 배경)
- 스테레오 출력 필수 (`pan=stereo|c0=c0|c1=c0`)
- 샘플레이트: 44100Hz

---

## 🚨 주의사항

1. **슬라이딩 윈도우 금지** — 단어 윈도우가 이동하면 주변 글씨가 계속 바뀌어 이상해 보임
2. **세그먼트 그룹 고정** — Whisper 세그먼트 단위로 그룹핑해야 자연스러움
3. **Google Fonts 절대 금지** — Puppeteer에서 타임아웃 발생. `local('Apple SD Gothic Neo')` 사용
4. **waitUntil: 'domcontentloaded'** — `networkidle0` 쓰면 폰트 로딩 대기로 타임아웃
5. **BGM 스테레오** — 모노로 믹스하면 BGM 거의 안 들림. `pan=stereo|c0=c0|c1=c0` 필수
6. **올리기 전 Aaron 확인** — 영상/캡션 먼저 보여주고 "올려" 받아야 게시

---

## ✅ 체크리스트

- [ ] 스크립트 앞뒤 달커넥트 CTA 포함
- [ ] 나레이션 1.20x 속도 확인
- [ ] Whisper JSON 생성 확인
- [ ] 오타 교정 사전 업데이트
- [ ] 인스타 세이프존 (bottom 400px)
- [ ] BGM 스테레오 믹스 확인
- [ ] 썸네일 생성
- [ ] Aaron에게 영상 + 캡션 확인 요청
- [ ] "올려" 받은 후 업로드
- [ ] IG 게시 성공 확인

---

*완성: 2026-03-19 | 건강 릴스 (당뇨) 기준*
