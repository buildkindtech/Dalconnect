# 📱 DalKonnect Instagram 포스팅 가이드

> **규칙**: 항상 이 가이드 보고 만들기. 새 포스트 타입 추가 시 여기 업데이트.

---

## 🔑 핵심 환경변수 (`.env.local`)
```
FACEBOOK_PAGE_ACCESS_TOKEN   ← 모든 포스팅에 사용
INSTAGRAM_BUSINESS_ACCOUNT_ID = 17841440398453483
PAGE_ID = 1077704625421219
```

---

## 📦 포스트 타입별 워크플로우

### 1. 뉴스 카드 (단일 이미지)
**언제**: 로컬뉴스, K-POP, 이민/비자, 건강 등 단일 기사
**스크립트**: `scripts/gen-local-news.cjs` (템플릿) → `scripts/post-news-3.cjs` (업로드)

**이미지 소싱 규칙**:
- ✅ **기사 URL 있으면** → URL에서 OG 이미지 자동 추출 (아래 참고)
- ✅ **Aaron이 사진 직접 보내면** → 그 사진 그대로 BG로 사용
- ❌ **스크린샷만 있으면** → 기사 URL 물어보거나 기사 제목으로 검색해서 썸네일 가져오기

**카드 스타일**:
```
배경: 기사 사진 full-bleed
오버레이: 위→아래 gradient (투명 → 진한 색)
배지: 카테고리 (🚨 달라스 긴급뉴스 / ⚠️ 건강경고 / 📋 이민비자 등)
헤드라인: 64px, font-weight:900, 흰색
divider: 4px accent color
sub: 26px, 설명 2줄
출처 pill + 날짜 pill
CTA: "더 알아보기 👉 dalkonnect.com/news"
로고: DALKONNECT.COM
```

**배지 컬러 기준**:
| 카테고리 | 배지색 | 오버레이 |
|---|---|---|
| 🚨 로컬 긴급 | `#dc2626` | `rgba(100,0,0,0.75)` |
| ⚠️ 건강/안전 | `#d97706` | `rgba(80,40,0,0.8)` |
| 📋 이민/비자 | `#1D4ED8` | `rgba(0,20,80,0.82)` |
| 🎵 K-POP | `#7C3AED` | `rgba(30,0,60,0.82)` |
| 🛍️ 딜/할인 | `#059669` | `rgba(0,50,20,0.82)` |
| 📰 일반뉴스 | `#374151` | `rgba(0,0,0,0.8)` |

---

### 2. 맛집 캐러셀 (여러 업체)
**언제**: 특정 음식 카테고리 맛집 모음 (치킨, 국밥, 라멘 등)
**스크립트**: `gen-{음식}-carousel.cjs` → `post-{음식}-carousel.cjs`
**예시**: `gen-gukbap-carousel.cjs` + `post-gukbap-carousel.cjs`

**이미지 소싱**:
1. DB에서 업체 검색: `name_ko ILIKE '%검색어%'`
2. `photos` 컬럼에서 실제 사진 다운로드
3. 음식 사진인지 확인 후 선택 (Aaron에게 미리 보여주기)

**슬라이드 구성** (6장):
```
[0] 커버: 타이틀 카드 (배경: 어두운 gradient)
[1-4] 업체 카드: 실제 음식 사진 + 업체명/위치/평점/설명
[5] CTA: "어디가 맛있어요? 댓글 → dalkonnect.com"
```

**업체 카드 스타일**:
```
배경: 음식 사진 full-bleed
오버레이: 하단 gradient (투명 → 검정 97%)
상단: 카테고리 태그(왼) + 평점 배지(오)
하단: 업체명(58px) + 위치 + divider + 설명 + CTA pill
accent color: #FFA032 (주황)
```

---

### 3. 업체 스팟라이트 (단일 업체)
**스크립트**: `gen-biz-card.cjs` → `post-biz.cjs`
**이미지**: DB photos[] 중 대표 음식 사진 선택

---

### 4. 이벤트/폐점 공지
**스크립트**: `gen-nordstrom-v2.cjs` 참고 (커스텀 제작)
**스타일**: 브랜드 색상 + 임팩트 있는 타이포

---

## 🖼️ 이미지 소싱 방법

### A. 기사 URL로 OG 이미지 추출
```javascript
// URL 하나로 썸네일 가져오기
const res = await fetch(url);
const html = await res.text();
const ogMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
const thumbUrl = ogMatch?.[1];
```

### B. DB 업체 사진 다운로드
```javascript
const { Pool } = require('pg');
require('dotenv').config(); // .env (not .env.local!)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const r = await pool.query(`SELECT photos FROM businesses WHERE name_ko ILIKE '%업체명%'`);
const photos = JSON.parse(r.rows[0].photos);
// photos[0] = 대표, photos[1] = 음식 사진 가능성 높음
```

### C. Aaron이 사진 직접 전송
```javascript
// 텔레그램으로 받은 사진
// 경로: /Users/aaron/.openclaw/media/inbound/file_XXXX.jpg
// 복사해서 memory/에 저장 후 사용
```

---

## 📤 실제 업로드 함수 (공통)

### Instagram 단일 사진
```javascript
// IG media container 생성 → publish
const container = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
  method: 'POST',
  body: JSON.stringify({ image_url: publicUrl, caption: CAPTION, access_token: TOKEN })
});
const publish = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media_publish`, {
  method: 'POST',
  body: JSON.stringify({ creation_id: container.id, access_token: TOKEN })
});
```

### Instagram 캐러셀
```javascript
// 1. 각 이미지 → carousel item ID
// 2. CAROUSEL container (children: item IDs)
// 3. media_publish
// 참고: post-gukbap-carousel.cjs
```

### Facebook 피드
```javascript
// FB에 먼저 비공개 업로드 → photo ID
// feed에 attached_media로 게시
// ⚠️ PAGE_TOKEN 필요 (user token X)
// 교환: GET /{PAGE_ID}?fields=access_token&access_token={USER_TOKEN}
```

---

## ⚠️ 주의사항
- FB 업로드는 **PAGE TOKEN** 필요 (user token으로 하면 `#200` 에러)
- IG 포스팅은 **USER/IG TOKEN** 사용
- 이미지는 반드시 **공개 URL** 또는 **FB photo upload** 거쳐야 함
- `dotenv`: DB 접근 = `.env` / 포스팅 = `.env.local`

---

## 📅 포스팅 전략 (성과 기반)
| 순위 | 카테고리 | Reach | 전략 |
|---|---|---|---|
| 1 | 🍗 음식/맛집 | 최고 | 주 2-3회 |
| 2 | 🌡️ 로컬 생활정보 | 높음 | 주 2회 |
| 3 | 🚨 로컬뉴스 | 중간 | 중요할 때만 |
| 4 | 🎵 K-POP | 낮음 | 빅뉴스만 |
