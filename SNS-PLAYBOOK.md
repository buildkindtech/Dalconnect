# DalKonnect SNS 포스팅 플레이북

*최종 업데이트: 2026-03-15*

---

## 📐 카드 제작 규칙

### 공통 규칙
- **사이즈**: 1080×1080px (Instagram 정방형)
- **폰트**: Noto Sans KR (Google Fonts)
- **중앙 정렬 필수** — IG 그리드에서 좌우 잘리지 않게
- **이미지 소스**: Firebase Storage DB 업체 사진 (직접 접근 가능) ✅
- **차단된 이미지 소스**: 조선일보, 연합뉴스 (403) → 텍스트 카드 대체
- **Unsplash 사용 금지** — 검색 정확도 낮음, 엉뚱한 사진 나옴
- **거짓/무관한 이미지 절대 사용 금지** — 신뢰 최우선

### 색상 테마별 용도
| 테마 | 사용 |
|---|---|
| `#2ED8A3` (민트) | DalKonnect 브랜드, 업체 스팟라이트 |
| `#a855f7` (보라) | K-POP, 엔터테인먼트, 커뮤니티 |
| `#ef4444` (빨강) | 국제뉴스, 긴급, 경고 |
| `#3b82f6` (파랑) | 외교, 한국 관련 뉴스 |
| `#f59e0b` (주황) | 여행, 음식, 라이프스타일 |
| `#4ade80` (초록) | 봄방학, 자연, 가족 |

---

## 📰 뉴스 포스트

### 스크립트
- 생성: `/scripts/gen-news-img-posts.cjs`
- 포스팅: `/scripts/post-news-3.cjs`
- 중앙정렬 버전: `/scripts/gen-news-centered.cjs`

### 워크플로우
1. DB에서 최신 뉴스 뽑기 (카테고리별 상위 3개)
2. `thumbnail_url` 이미지 접근 가능 여부 확인 (`curl -s -o /dev/null -w "%{http_code}"`)
3. 이미지 있으면 배경 사용, 없으면 텍스트 카드
4. Puppeteer로 1080×1080 PNG 생성
5. Aaron 확인 후 IG/FB 포스팅

### 콘텐츠 선정 기준
- 달라스 한인에게 직접 연관된 것 우선
- 국제 뉴스는 로컬 임팩트 각도로 (예: 유류할증료 → 달라스 운전자)
- 엔터/K-POP은 Soompi 소스 (이미지 접근 가능)

---

## ✨ 업체 스팟라이트

### 스크립트
- 커버+리뷰 생성: `/scripts/gen-spotlight-*.cjs`
- 포스팅: `/scripts/post-spotlight-*.cjs`

### 워크플로우
1. DB에서 업체 선택 (조건: 사진 보유 + rating ≥ 4.5 + 리뷰 30개+)
2. Google Places API로 실제 리뷰 3개 가져오기
   - API Key: `GOOGLE_PLACES_API_KEY` (`.env`에 저장)
   - Endpoint: `maps.googleapis.com/maps/api/place/details/json`
   - fields: `name,rating,reviews` / language: `ko`
3. 5장 캐러셀 생성: 커버 → 리뷰1 → 리뷰2 → 리뷰3 → CTA
4. IG 캐러셀 + FB 멀티이미지 포스팅

### 좋은 업체 기준 SQL
```sql
SELECT name_ko, name_en, category, rating, review_count, photos
FROM businesses
WHERE photos IS NOT NULL AND jsonb_array_length(photos::jsonb) > 0
  AND rating::numeric >= 4.5
  AND review_count >= 30
ORDER BY review_count DESC;
```

---

## 🌸 라이프스타일 / 커뮤니티 포스트

### 스크립트
- 생성: `/scripts/gen-springbreak.cjs`, `/scripts/gen-travel*.cjs`
- 포스팅: `/scripts/post-travel-3.cjs`

### 워크플로우
1. 시즌/이슈 파악 (봄방학, 추수감사절, 크리스마스, 설날 등)
2. 달라스 한인 관점으로 콘텐츠 기획
3. 실용 정보 포함 필수: 거리, 비용, 나이대, 팁
4. 커뮤니티 참여형은 댓글 유도 CTA 포함

### 콘텐츠 공식
- **정보형**: "달라스 봄방학 TOP 5" — 리스트 + 실용 데이터
- **맛집형**: DB 업체 실사 배경 + 간단 설명
- **참여형**: 댓글 유도 ("여러분은 어디 가세요?")

---

## 📤 IG/FB API 포스팅

### 환경변수 (`.env.local`)
```
FACEBOOK_PAGE_ACCESS_TOKEN=...
```

### 계정 ID
- Facebook Page ID: `1077704625421219`
- Instagram Business ID: `17841440398453483`

### 싱글 이미지 포스팅
```js
// 1. 로컬 파일 → FB Photos API 업로드 (published: false)
// 2. 업로드된 photo ID로 이미지 URL 가져오기
// 3. IG media 컨테이너 생성 → 8초 대기 → media_publish
// 4. FB feed에 attached_media로 포스팅
```

### 캐러셀 포스팅
```js
// 1. 모든 슬라이드 업로드 → URL 확보
// 2. 각 URL로 is_carousel_item:true IG media 생성
// 3. media_type:CAROUSEL 컨테이너 생성 → 8초 대기 → publish
// 4. FB feed에 attached_media 배열로 포스팅
```

### 포스트 간 대기
- 같은 계정 연속 포스팅: 15초 대기 필수

---

## 📅 오늘 포스팅 현황 (2026-03-15)

| 포스트 | 타입 | IG ID | 상태 |
|---|---|---|---|
| K-POP 빌보드 | 뉴스 | 18128178127553863 | ✅ |
| F1·피날리시마 취소 | 뉴스 | 18441876739114577 | ✅ |
| 호르무즈 군함 | 뉴스 | 17963942133022010 | ✅ |
| 김상우 안과 스팟라이트 | 캐러셀 | 18262154047292078 | ✅ |
| 봄방학 드라이브 여행 | 라이프 | 18075260618445007 | ✅ |
| 달라스 당일치기 | 라이프 | 18081283229610627 | ✅ |
| DFW 직항 여행 | 라이프 | 18037331135569099 | ✅ |

**총 7개 포스팅 완료**

---

## 💡 레슨 런 (2026-03-15)

- IG 그리드에서 좌우 잘림 → **중앙 정렬 필수**
- 외부 뉴스 이미지는 대부분 핫링크 차단 → 텍스트 카드로 대체
- DB Firebase 업체 사진은 직접 접근 가능 ✅
- 실제 정보(거리/비용/나이) 없으면 "도움이 안 된다"는 피드백 → 항상 실용 데이터 포함
- 캐러셀 포스팅 시 children 배열 `,` 구분자 사용 (배열 아닌 문자열)
