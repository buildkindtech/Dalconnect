# DalConnect Multi-City Architecture

## 도메인 매핑

| 도시 | 도메인 | 타겟 지역 |
|---|---|---|
| Dallas | dalkonnect.com | DFW Metroplex |
| Houston | houkonnect.com | Houston Metro |
| Austin | auskonnect.com | Austin Metro |
| Los Angeles | lakonnect.com | LA / SoCal |
| New York | nykonnect.com | NYC Metro |
| Atlanta | atkonnect.com | Atlanta Metro |
| Chicago | chikonnect.com | Chicago Metro |
| San Francisco | sfkonnect.com | SF Bay Area |

## 공유 vs 도시별 데이터

### 공유 (Shared across all cities)
- **사용자 계정** — 한 번 가입, 모든 도시 이용
- **인증 시스템** — 통합 auth (OAuth, JWT)
- **카테고리 체계** — 업소록 카테고리 동일
- **UI 컴포넌트** — 코드베이스 하나, 테마/브랜딩만 도시별 변경
- **관리자 대시보드** — 슈퍼어드민은 모든 도시 관리

### 도시별 (City-specific)
- **업소록 (Businesses)** — 각 도시 로컬 업체
- **뉴스 (News)** — 도시별 RSS 소스, 로컬 뉴스
- **사고팔기 (Marketplace)** — 지역 제한 거래
- **커뮤니티 게시판** — 도시별 게시판
- **광고** — 로컬 광고주
- **차트/트렌딩** — 도시별 인기 검색어

## DB 구조

### Option A: Single DB, city_id Column (권장 — 초기)
```sql
-- 모든 주요 테이블에 city_id 추가
ALTER TABLE businesses ADD COLUMN city_id VARCHAR(3) NOT NULL DEFAULT 'dal';
ALTER TABLE news ADD COLUMN city_id VARCHAR(3) NOT NULL DEFAULT 'dal';
ALTER TABLE marketplace ADD COLUMN city_id VARCHAR(3) NOT NULL DEFAULT 'dal';

-- 도시 테이블
CREATE TABLE cities (
  id VARCHAR(3) PRIMARY KEY,        -- dal, hou, aus, la, ny, atl, chi, sf
  name VARCHAR(100) NOT NULL,        -- Dallas, Houston, ...
  name_ko VARCHAR(100) NOT NULL,     -- 달라스, 휴스턴, ...
  domain VARCHAR(255) NOT NULL,      -- dalkonnect.com
  timezone VARCHAR(50) NOT NULL,     -- America/Chicago
  lat DECIMAL(10,6),
  lng DECIMAL(10,6),
  active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_businesses_city ON businesses(city_id);
CREATE INDEX idx_news_city ON news(city_id);
CREATE INDEX idx_marketplace_city ON marketplace(city_id);
```

### Option B: Separate DB per City (트래픽 증가 시)
- 각 도시별 Neon branch 또는 별도 DB
- 연결 문자열을 도메인/서브도메인으로 라우팅
- 마이그레이션 복잡도 높음 — 초기에는 비추천

## 확장 방법 (새 도시 추가)

### Step 1: 도시 등록
```sql
INSERT INTO cities (id, name, name_ko, domain, timezone, lat, lng, active)
VALUES ('hou', 'Houston', '휴스턴', 'houkonnect.com', 'America/Chicago', 29.7604, -95.3698, false);
```

### Step 2: 도메인 설정
1. DNS: `houkonnect.com` → Vercel CNAME
2. Vercel: 프로젝트에 커스텀 도메인 추가
3. 환경변수: `CITY_ID=hou` (또는 도메인 기반 자동 감지)

### Step 3: 뉴스 소스 설정
- `scripts/rss-sources.json`에 도시별 RSS 피드 추가
- 크론잡은 모든 활성 도시 자동 순회

### Step 4: 시드 데이터
- 해당 도시 업소록 초기 데이터 입력
- 카테고리는 공유이므로 추가 불필요

### Step 5: 활성화
```sql
UPDATE cities SET active = true WHERE id = 'hou';
```

## 코드 구조 변경 (향후)

```
client/
  src/
    config/
      cities.ts          # 도시 설정 (도메인→city_id 매핑)
    hooks/
      useCity.ts          # 현재 도시 컨텍스트 훅
    components/
      CitySelector.tsx    # 도시 전환 UI

server/
  middleware/
    cityResolver.ts      # 요청 도메인 → city_id 미들웨어
```

### 도메인 기반 자동 감지
```typescript
// cityResolver.ts
const DOMAIN_MAP: Record<string, string> = {
  'dalkonnect.com': 'dal',
  'houkonnect.com': 'hou',
  'auskonnect.com': 'aus',
  'lakonnect.com': 'la',
  'nykonnect.com': 'ny',
  'atkonnect.com': 'atl',
  'chikonnect.com': 'chi',
  'sfkonnect.com': 'sf',
};

export function resolveCity(hostname: string): string {
  return DOMAIN_MAP[hostname] || 'dal'; // default: Dallas
}
```

## 타임라인 제안

1. **Phase 1 (현재)**: Dallas 단독 운영, 안정화
2. **Phase 2**: DB에 city_id 컬럼 추가, 코드에 city context 도입
3. **Phase 3**: Houston 파일럿 론칭
4. **Phase 4**: 나머지 도시 순차 확장

## 비용 고려

- **Neon DB**: Free tier → 각 도시 추가 시 row 증가, Pro 플랜 전환 시점 모니터링
- **Vercel**: 도메인 추가는 무료, 함수 호출 증가분만 체크
- **뉴스 크론**: 도시 수 × 하루 3회 = API 호출 증가 (RSS는 무료)
