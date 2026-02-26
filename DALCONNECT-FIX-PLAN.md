# DalConnect 긴급 수정 계획

**현재 상황:**
- ❌ Neon PostgreSQL 연결 실패 (`getaddrinfo ENOTFOUND`)
- ❌ Google Places API 403 에러
- ❌ 화면에 데이터 안 보임

**근본 문제:**
- API/DB 실패 시 기존 데이터도 안 보이는 구조
- 매번 전체 데이터를 리프레시하는 방식

---

## 🎯 즉시 해결 (우선순위 순서)

### 1. **Neon DB 연결 복구** (5분) 🔥
**목적:** 기존 DB 데이터를 화면에 표시

**단계:**
1. Neon Console 접속: https://console.neon.tech
2. 프로젝트 선택 → Connection Details 클릭
3. 새 연결 문자열 복사 (Pooled connection)
4. `.env` 업데이트:
   ```bash
   cd ~/.openclaw/workspace-manager/projects/dalconnect
   nano .env  # DATABASE_URL 교체
   ```
5. 연결 테스트:
   ```bash
   npx tsx scripts/test-db-connection.ts
   ```
6. 성공하면 서버 재시작 (Vercel auto-deploy 또는 로컬 테스트)

**예상 결과:** 기존 비즈니스/뉴스 데이터가 화면에 표시됨

---

### 2. **Google Places API 활성화** (3분) 🔑
**목적:** 새 비즈니스 스크래핑 재개

**단계:**
1. Google Cloud Console: https://console.cloud.google.com
2. API Key 확인: `AIzaSyAzcujFS2IfcaxVmtYvFEb4omQhVlOQCOE`
3. Places API (New) 활성화:
   - https://console.cloud.google.com/apis/library/places-backend.googleapis.com
   - "Enable API" 클릭
4. Billing 계정 연결 확인
5. API 할당량 확인:
   - https://console.cloud.google.com/apis/api/places-backend.googleapis.com/quotas

**테스트:**
```bash
cd ~/.openclaw/workspace-manager/projects/dalconnect
npx tsx scripts/scrape-businesses.ts
```

**예상 결과:** 새 비즈니스가 DB에 추가됨

---

### 3. **뉴스 수집 Cron Job 확인** (2분) ⏸️
**목적:** DB 연결 복구 전까지 실패 방지

**단계:**
```bash
openclaw cron list
```

**찾을 Job:** DalConnect 뉴스 수집 관련

**조치:**
- DB 연결 수정 완료 전: 비활성화
- DB 테스트 성공 후: 재활성화

---

## 🔧 장기 해결 (구조 개선)

### 4. **데이터 업데이트 로직 변경** (30분)
**목적:** API 실패해도 기존 데이터 유지

**현재 문제:**
```typescript
// 매번 전체 삭제 후 새로 추가
await db.delete(businesses).execute();
await db.insert(businesses).values(newData);
```

**개선 방안:**
```typescript
// Upsert: 존재하면 업데이트, 없으면 추가
await db.insert(businesses)
  .values(newData)
  .onConflictDoUpdate({
    target: businesses.google_place_id,
    set: { 
      name_en: sql`excluded.name_en`,
      rating: sql`excluded.rating`,
      updated_at: sql`NOW()`
    }
  });
```

**수정 파일:**
- `scripts/scrape-businesses.ts` - 비즈니스 스크래퍼
- `scripts/collect-news.ts` - 뉴스 수집기 (있다면)

**장점:**
- 기존 데이터 보존
- API 실패해도 화면에 계속 표시
- 변경사항만 업데이트 (효율적)

---

### 5. **에러 핸들링 강화** (15분)
**목적:** API/DB 실패 시 graceful degradation

**개선 사항:**

**프론트엔드 (client/):**
```typescript
// API 실패 시 빈 배열 대신 캐시된 데이터 표시
const [businesses, setBusinesses] = useState([]);
const [lastFetch, setLastFetch] = useState(null);

useEffect(() => {
  fetch('/api/businesses')
    .then(res => res.json())
    .then(data => {
      setBusinesses(data);
      setLastFetch(Date.now());
      localStorage.setItem('businesses_cache', JSON.stringify(data));
    })
    .catch(() => {
      // API 실패 시 캐시에서 로드
      const cached = localStorage.getItem('businesses_cache');
      if (cached) setBusinesses(JSON.parse(cached));
    });
}, []);
```

**백엔드 (server/routes.ts):**
```typescript
app.get("/api/businesses", async (req, res) => {
  try {
    const results = await storage.getBusinesses(filters);
    res.json(results);
  } catch (error) {
    console.error("DB error:", error);
    // DB 실패 시 빈 배열 대신 에러 상태 명시
    res.status(503).json({ 
      error: "Database temporarily unavailable",
      retry: true,
      cached: false
    });
  }
});
```

---

## 📋 체크리스트

### 즉시 (오늘)
- [ ] Neon DB 연결 문자열 업데이트
- [ ] DB 연결 테스트 성공 확인
- [ ] 화면에 기존 데이터 표시 확인
- [ ] Google Places API 활성화
- [ ] API 스크래핑 테스트
- [ ] Cron job 상태 확인

### 단기 (이번 주)
- [ ] 스크래퍼를 upsert 방식으로 변경
- [ ] 뉴스 수집도 upsert 적용
- [ ] 에러 핸들링 강화 (캐시 사용)
- [ ] 테스트 + 배포

### 모니터링
- [ ] 매일 DB 연결 상태 체크
- [ ] API 할당량 모니터링
- [ ] Cron job 실패 알림 설정

---

## 🚀 빠른 실행 명령어

```bash
# 1. DB 연결 테스트
cd ~/.openclaw/workspace-manager/projects/dalconnect
npx tsx scripts/test-db-connection.ts

# 2. Places API 테스트
npx tsx scripts/scrape-businesses.ts

# 3. Cron job 확인
openclaw cron list

# 4. 서버 로컬 실행 (테스트)
npm run dev
```

---

**다음 스텝:** 
1. Aaron이 Neon Console에서 새 DATABASE_URL 받기
2. OpenClaw가 .env 업데이트 + 테스트 실행
3. 성공하면 구조 개선 시작
