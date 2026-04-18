---
name: morning-briefing
description: 달커넥트 아침 브리핑 자동 파이프라인. DB 뉴스 선별 → Gemini TTS 스크립트 → Google Leda 음성 → Whisper 전사 → Puppeteer 릴스 렌더링 → 썸네일 → Telegram 미리보기. "올려" 명령어로 Firebase 업로드 + IG/FB 포스팅. Trigger on "브리핑", "아침 브리핑", "morning briefing", "올려", "올라갔어?", or when user sends voice/video in dalconnect channel.
---

# Morning Briefing Skill

매일 아침 달커넥트 뉴스 브리핑 릴을 자동 생성하고 IG/FB에 포스팅하는 7단계 파이프라인.

---

## 파이프라인 개요

```
Phase 1: 뉴스 선별 + TTS 스크립트 생성  (news-candidates.cjs)
Phase 2: Google TTS Leda 음성 생성      (gen-leda-voice.cjs)
Phase 3: Whisper 전사                   (mlx_whisper)
Phase 4: briefing-config.json 생성      (briefing-auto-config.cjs)
Phase 5: Puppeteer 슬라이드 렌더링      (briefing-render.cjs)
Phase 6: 썸네일 생성                    (briefing-thumbnail.cjs)
Phase 7: Telegram 미리보기 전송
──── Aaron "올려" 확인 ────
Phase 8: Firebase 업로드 + IG/FB 포스팅 (briefing-post.cjs)
```

전체 실행: `./briefing-full-auto.sh [YYYY-MM-DD]`

---

## 핵심 경로

```
BASE = /Users/aaron/.openclaw/workspace-manager/projects/dalconnect
DATE_DIR = $BASE/memory/morning-reels/YYYY-MM-DD/
```

| 파일 | 역할 |
|---|---|
| `tts-script.txt` | Gemini가 생성한 TTS 낭독 스크립트 |
| `voice_1.20x.mp3` | Leda 1.2x 속도 음성 |
| `voice_1.20x.json` | Whisper 전사 (word-level timestamps) |
| `briefing-config.json` | 슬라이드 구성 (제목, 카테고리, 타이밍) |
| `frames/` | Puppeteer가 렌더링한 PNG 프레임들 |
| `news-briefing-MMDD.mp4` | 최종 릴 영상 |
| `thumbnail.png` | 포스팅용 썸네일 |

---

## Phase 1 — 뉴스 선별 + TTS 스크립트

**스크립트**: `cron/news-candidates.cjs`

1. DB에서 최근 48시간 뉴스 조회
2. Gemini로 7개 자동 선별 (카테고리 다양성 우선)
3. TTS 스크립트 형식:
   - 오프닝: "안녕하세요, [날짜] 달커넥트 아침 브리핑입니다"
   - 각 뉴스: "첫번째 소식입니다. [뉴스 내용]... 두번째 소식입니다..."
   - 클로징: "달커넥트 뉴스 여기까지입니다. 감사합니다"
4. `tts-script.txt` 저장 + Telegram 전송

**품질 기준**:
- 총 발화 시간 60~120초 (1.2x 적용 전 기준)
- 뉴스 7개, 카테고리 중복 최소화
- 순서 번호 멘트 필수: "첫번째/두번째/.../마지막 소식입니다"

---

## Phase 2 — Google TTS Leda 음성

**스크립트**: `cron/gen-leda-voice.cjs`

- 모델: `chirp3-hd-leda` (Google Cloud TTS)
- 속도: 1.2x (atempo)
- 출력: `voice_1.20x.mp3`
- SSML mark 태그로 슬라이드 전환 타임스탬프 동시 생성 → `slide-timings.json`

---

## Phase 3 — Whisper 전사

```bash
mlx_whisper voice_1.20x.mp3 \
  --model mlx-community/whisper-small-mlx \
  --language Korean \
  --word-timestamps True \
  --output-format json \
  --output-dir DATE_DIR
```

**⚠️ 절대 규칙**: `--word-timestamps True` 빠지면 자막 한 덩어리로 찍힘

---

## Phase 4 — briefing-config.json

**스크립트**: `cron/briefing-auto-config.cjs`

TTS 스크립트 + Whisper JSON → 슬라이드 구성 자동 추출:
- 각 뉴스별 제목, 카테고리, 이모지, 배경 색상
- 타이밍 소스 우선순위: `slide-timings.json` > 글자 수 비례 > Whisper fallback

---

## Phase 5 — 릴스 렌더링

**스크립트**: `cron/briefing-render.cjs`

### 슬라이드 디자인 (고정 — 변경 금지)

- **배경**: gradient-only (카테고리별 색상), 이미지 없음
- **레이아웃**: 아이콘/제목 `top:320px`, 캡션 `bottom:620px`
- **슬라이드 전환**: 순서 번호 멘트("번째 소식입니다") 감지 시 전환
- **BGM**: `memory/reels-diabetes/bgm-lofi.mp3`
- **해상도**: 1080×1920 (9:16 세로형)

### 카테고리별 배경색

| 카테고리 | 배경 | 강조색 |
|---|---|---|
| 달라스 로컬 | `#0f1a2e → #1e3a5f` | `#60a5fa` |
| 긴급/월드 | `#1a0800 → #3b1800` | `#f97316` |
| 한국 뉴스 | `#1a0a0a → #3b1010` | `#f87171` |
| 스포츠 | `#1a1000 → #3b2800` | `#fbbf24` |
| 이민/비자 | `#0a1a0a → #1a3b1a` | `#4ade80` |
| 건강 | `#0a0a1a → #1a1a3b` | `#a78bfa` |
| 연예/K-POP | `#1a0a1a → #3b1a3b` | `#e879f9` |

### 타이밍 (절대 타임스탬프 방식)

프레임 구조: `{file, startTime}` — 드리프트 0 보장.
`dur[i] = startTime[i+1] - startTime[i]`, 마지막 = `totalDur - lastStartTime`

---

## Phase 6 — 썸네일

**스크립트**: `cron/briefing-thumbnail.cjs`

- 요일별 테마 색상 (월=딥그린, 화=딥퍼플, 수=딥시안, 목=딥블루, 금=딥오렌지, 토=딥레드, 일=딥네이비)
- 달커넥트 로고 + 날짜 + 카테고리 박스 5개

---

## Phase 7 — Telegram 미리보기

영상 + 썸네일 → 달커넥트 방(-5280678324) 전송.
캡션: `"🎬 YYYY-MM-DD 아침 브리핑 — 확인 후 '올려'"`

---

## Phase 8 — 포스팅 ("올려" 트리거)

**스크립트**: `cron/briefing-post.cjs`

1. Firebase Storage 업로드 (버킷: `konnect-ceedb.appspot.com`)
2. Signed URL 획득 → IG Reels API 게시
3. FB 동영상 포스팅
4. 완료 보고: IG ID + FB ID → 달커넥트 방 전송

**⚠️ 포스팅 규칙**:
- Aaron "올려" 없이 자동 포스팅 절대 금지
- `cover_url: thumbUrl` 사용 — `thumb_offset` 사용 금지

---

## 자주 발생하는 오류

| 증상 | 원인 | 해결 |
|---|---|---|
| 자막이 한 덩어리 | `--word-timestamps True` 누락 | Phase 3 명령어 확인 |
| 드리프트 누적 | 페이드 프레임 사용 | 절대 타임스탬프 방식 유지 |
| IG 썸네일 없음 | `thumb_offset` 사용 | `cover_url` 으로 교체 |
| Whisper 오타 | 전사 결과 자막 사용 | 스크립트 원문 사용, Whisper는 타이밍만 |
| Firebase 403 | Public URL 사용 | Signed URL 사용 |

---

## Autoresearch 평가 기준

### Binary Evals (합격/불합격)
1. `tts-script.txt` 생성됨 (Phase 1 성공)
2. 뉴스 7개, 순서 번호("번째 소식입니다") 멘트 포함
3. `voice_1.20x.mp3` 생성됨 (Phase 2 성공)
4. Whisper JSON에 `word_segments` 배열 존재
5. 최종 MP4 생성됨, 60~180초 범위
6. 썸네일 생성됨
7. Telegram 미리보기 전송됨

### Comparative Evals (품질)
1. 뉴스 선별 다양성 (카테고리 중복 없음)
2. TTS 스크립트 자연스러움 (문장 흐름)
3. 슬라이드 전환 타이밍 (순서 번호 멘트와 일치)
4. 썸네일 시각 품질

---

## 전체 실행 방법

```bash
# 오늘 날짜 자동
cd /Users/aaron/.openclaw/workspace-manager/projects/dalconnect
./cron/briefing-full-auto.sh

# 특정 날짜
./cron/briefing-full-auto.sh 2026-04-13

# 개별 Phase 테스트
node cron/news-candidates.cjs
node cron/gen-leda-voice.cjs 2026-04-13
node cron/briefing-render.cjs 2026-04-13
```
