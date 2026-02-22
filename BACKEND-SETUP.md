# 🚀 Backend Setup Guide

## ✅ 완료된 작업 (2026-02-21)

1. **DB 스키마 추가** - `shared/schema.ts`
   - `businesses` 테이블
   - `news` 테이블

2. **API 엔드포인트 구현** - `server/routes.ts`
   - GET `/api/businesses` (필터: category, city, tier, featured, search)
   - GET `/api/businesses/:id`
   - GET `/api/featured`
   - POST `/api/businesses`
   - GET `/api/news`
   - GET `/api/news/:category`
   - POST `/api/news`

3. **Seed 스크립트** - `server/seed.ts`
   - mockData 10개 비즈니스 → DB
   - mockData 4개 뉴스 → DB

---

## 🔧 Replit에서 실행 방법

### Step 1: DB Push (스키마 적용)
```bash
npm run db:push
```

**예상 출력**:
```
✓ Pushing schema changes to database...
✓ Tables created: businesses, news
```

---

### Step 2: Seed Data (초기 데이터 삽입)
```bash
npm run db:seed
```

**예상 출력**:
```
🌱 Seeding database...
  Clearing existing data...
  Inserting businesses...
  ✅ Inserted 10 businesses
  Inserting news...
  ✅ Inserted 4 news items

🎉 Seeding complete!
  Total: 10 businesses + 4 news
```

---

### Step 3: 서버 재시작
```bash
npm run dev
```

---

### Step 4: API 테스트

**브라우저에서**:
```
https://dalconnect.replit.app/api/businesses
https://dalconnect.replit.app/api/featured
https://dalconnect.replit.app/api/news
```

**예상 응답**:
```json
[
  {
    "id": "1",
    "name_en": "Gomone BBQ",
    "name_ko": "고모네",
    "category": "restaurants",
    ...
  }
]
```

---

## 🎯 다음 단계

### 프론트엔드 API 연동 필요:

**파일**: `client/src/pages/Home.tsx`

**변경 전**:
```typescript
import { MOCK_BUSINESSES, MOCK_NEWS } from "@/data/mockData";
const featuredBusinesses = MOCK_BUSINESSES.filter(b => b.featured);
```

**변경 후**:
```typescript
import { useQuery } from "@tanstack/react-query";

const { data: featuredBusinesses = [] } = useQuery({
  queryKey: ['featured'],
  queryFn: async () => {
    const res = await fetch('/api/featured');
    return res.json();
  }
});
```

**동일하게 변경 필요**:
- `client/src/pages/Listings.tsx`
- `client/src/pages/BusinessDetail.tsx`
- `client/src/pages/News.tsx`

---

## ⚠️ Troubleshooting

### "Table does not exist"
→ `npm run db:push` 먼저 실행

### "Seeding failed"
→ DB connection 확인, PostgreSQL 실행 중인지 확인

### API 404 Not Found
→ `server/routes.ts` 변경 후 서버 재시작

---

## ✅ 완료 확인

- [ ] `npm run db:push` 성공
- [ ] `npm run db:seed` 성공
- [ ] `/api/businesses` 접속 시 10개 비즈니스 응답
- [ ] `/api/news` 접속 시 4개 뉴스 응답
- [ ] 프론트엔드에서 실제 데이터 표시

---

**Created**: 2026-02-21 20:15 CST  
**Status**: ✅ Ready to deploy
