# DFW Korean Directory - 다음 단계

## 현재 상태 (2026-02-21)

### ✅ 완료 (70%)
- 프론트엔드 5개 페이지 완성
- shadcn/ui 전체 세팅
- mockData 10개 식당 + 4개 뉴스
- 모바일 반응형
- Vite + React 19 + TypeScript 빌드 시스템

### ❌ 미완성 (30%)
- DB 스키마 (businesses, news 테이블)
- API 엔드포인트 (/api/businesses, /api/news)
- 프론트-백 연동 (현재 mockData만 사용)

---

## 🚀 Phase 1: DB & API 완성 (우선순위 1)

### 1️⃣ DB 스키마 추가
**파일**: `shared/schema.ts`

```typescript
// businesses 테이블 추가
export const businesses = pgTable("businesses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name_en: varchar("name_en", { length: 255 }).notNull(),
  name_ko: varchar("name_ko", { length: 255 }),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  address: varchar("address", { length: 500 }),
  city: varchar("city", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 500 }),
  hours: json("hours").$type<Record<string, string>>(),
  logo_url: varchar("logo_url", { length: 500 }),
  cover_url: varchar("cover_url", { length: 500 }),
  photos: json("photos").$type<string[]>(),
  tier: varchar("tier", { length: 20 }).default('free'),
  featured: boolean("featured").default(false),
  claimed: boolean("claimed").default(false),
  rating: numeric("rating", { precision: 2, scale: 1 }).default('0'),
  review_count: integer("review_count").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// news 테이블 추가
export const news = pgTable("news", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 500 }).notNull(),
  url: varchar("url", { length: 1000 }).notNull().unique(),
  content: text("content"),
  category: varchar("category", { length: 100 }),
  published_date: timestamp("published_date"),
  source: varchar("source", { length: 255 }),
  thumbnail_url: varchar("thumbnail_url", { length: 500 }),
  created_at: timestamp("created_at").defaultNow()
});

// Indexes
CREATE INDEX idx_category ON businesses(category);
CREATE INDEX idx_city ON businesses(city);
CREATE INDEX idx_tier ON businesses(tier);
CREATE INDEX idx_featured ON businesses(featured);
CREATE INDEX idx_news_category ON news(category);
CREATE INDEX idx_news_date ON news(published_date DESC);
```

**실행**:
```bash
npm run db:push
```

---

### 2️⃣ API 엔드포인트 구현
**파일**: `server/routes.ts`

```typescript
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "../db";
import { businesses, news } from "@/shared/schema";
import { eq, and, like, desc } from "drizzle-orm";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // GET /api/businesses - 전체 리스팅 (필터 지원)
  app.get("/api/businesses", async (req, res) => {
    try {
      const { category, city, tier, featured } = req.query;
      
      let query = db.select().from(businesses);
      
      if (category) {
        query = query.where(eq(businesses.category, category as string));
      }
      if (city) {
        query = query.where(eq(businesses.city, city as string));
      }
      if (tier) {
        query = query.where(eq(businesses.tier, tier as string));
      }
      if (featured === 'true') {
        query = query.where(eq(businesses.featured, true));
      }
      
      const results = await query;
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch businesses" });
    }
  });
  
  // GET /api/businesses/:id - 개별 비즈니스
  app.get("/api/businesses/:id", async (req, res) => {
    try {
      const business = await db.select()
        .from(businesses)
        .where(eq(businesses.id, req.params.id))
        .limit(1);
      
      if (business.length === 0) {
        return res.status(404).json({ error: "Business not found" });
      }
      
      res.json(business[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch business" });
    }
  });
  
  // GET /api/featured - Featured 비즈니스
  app.get("/api/featured", async (req, res) => {
    try {
      const featured = await db.select()
        .from(businesses)
        .where(eq(businesses.featured, true))
        .limit(10);
      
      res.json(featured);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch featured businesses" });
    }
  });
  
  // GET /api/news - 뉴스 전체
  app.get("/api/news", async (req, res) => {
    try {
      const { category } = req.query;
      
      let query = db.select().from(news).orderBy(desc(news.published_date));
      
      if (category) {
        query = query.where(eq(news.category, category as string));
      }
      
      const results = await query.limit(20);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });
  
  // GET /api/news/:category - 카테고리별 뉴스
  app.get("/api/news/:category", async (req, res) => {
    try {
      const results = await db.select()
        .from(news)
        .where(eq(news.category, req.params.category))
        .orderBy(desc(news.published_date))
        .limit(20);
      
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  return httpServer;
}
```

---

### 3️⃣ Seed Data 추가
**파일**: `server/seed.ts` (새로 생성)

```typescript
import { db } from "../db";
import { businesses, news } from "@/shared/schema";
import { MOCK_BUSINESSES, MOCK_NEWS } from "../client/src/data/mockData";

async function seed() {
  console.log("🌱 Seeding database...");
  
  // Businesses 삽입
  for (const business of MOCK_BUSINESSES) {
    await db.insert(businesses).values(business);
  }
  console.log("✅ Inserted 10 businesses");
  
  // News 삽입
  for (const newsItem of MOCK_NEWS) {
    await db.insert(news).values(newsItem);
  }
  console.log("✅ Inserted 4 news items");
  
  console.log("🎉 Seeding complete!");
}

seed().catch(console.error);
```

**package.json에 스크립트 추가**:
```json
{
  "scripts": {
    "db:seed": "tsx server/seed.ts"
  }
}
```

**실행**:
```bash
npm run db:seed
```

---

### 4️⃣ 프론트엔드 API 연동
**파일**: `client/src/pages/Home.tsx` 수정

**변경 전** (mockData):
```typescript
import { MOCK_BUSINESSES, MOCK_NEWS } from "@/data/mockData";
const featuredBusinesses = MOCK_BUSINESSES.filter(b => b.featured).slice(0, 3);
```

**변경 후** (API):
```typescript
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const { data: featuredBusinesses = [] } = useQuery({
    queryKey: ['featured'],
    queryFn: async () => {
      const res = await fetch('/api/featured');
      return res.json();
    }
  });
  
  const { data: recentNews = [] } = useQuery({
    queryKey: ['news'],
    queryFn: async () => {
      const res = await fetch('/api/news');
      return res.json();
    }
  });
  
  // ...
}
```

---

## 🎯 Phase 2: OpenClaw 자동화 연동

### 5️⃣ 뉴스 자동 수집 API
**파일**: `server/routes.ts`에 추가

```typescript
// POST /api/news - 뉴스 추가 (OpenClaw automation용)
app.post("/api/news", async (req, res) => {
  try {
    const { title, url, content, category, source, thumbnail_url } = req.body;
    
    const newNews = await db.insert(news).values({
      title,
      url,
      content,
      category,
      source,
      thumbnail_url,
      published_date: new Date()
    }).returning();
    
    res.json(newNews[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to create news" });
  }
});
```

### 6️⃣ OpenClaw 스킬 연동
**갈렙/바울/요셉이 개발한 스킬들:**
- `local-news-curator` → `/api/news` POST
- `directory-automation` → 자동 뉴스레터
- `news-crawler` → SearXNG → Replit API

**연동 예시**:
```bash
# local-news-curator 스킬에서
curl -X POST https://dalconnect.replit.app/api/news \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Dallas Korean Festival 2026",
    "url": "https://...",
    "content": "...",
    "category": "Events",
    "source": "Korea Times TX",
    "thumbnail_url": "https://..."
  }'
```

---

## 📋 체크리스트

### Phase 1 - DB & API (이번 주)
- [ ] DB 스키마 추가 (`shared/schema.ts`)
- [ ] `npm run db:push` 실행
- [ ] Seed 스크립트 작성 (`server/seed.ts`)
- [ ] `npm run db:seed` 실행
- [ ] API 엔드포인트 구현 (`server/routes.ts`)
- [ ] 프론트엔드 API 연동 (Home, Listings, News 페이지)
- [ ] TanStack Query 설정
- [ ] 테스트 (브라우저에서 확인)

### Phase 2 - 자동화 (다음 주)
- [ ] OpenClaw → Replit API 연동 테스트
- [ ] 뉴스 자동 수집 Cron (매일 06:00)
- [ ] 500개 비즈니스 리스팅 수집
- [ ] Google Maps 연동
- [ ] SendGrid 뉴스레터

### Phase 3 - 런칭 (Week 3-4)
- [ ] 도메인 연결 (dfwkorean.com)
- [ ] Stripe 결제 연동
- [ ] Admin 대시보드
- [ ] 베타 테스트

---

## 🛠️ 빠른 실행 가이드

### 1. DB 스키마 먼저
```bash
# schema.ts 수정 후
npm run db:push
```

### 2. Seed 데이터
```bash
# seed.ts 생성 후
npm run db:seed
```

### 3. API 테스트
```bash
# 서버 실행
npm run dev

# 브라우저에서
http://localhost:5000/api/businesses
http://localhost:5000/api/news
```

### 4. 프론트엔드 연동
- Home.tsx에서 mockData → useQuery 변경
- 브라우저에서 확인

---

## 💡 개선 제안

### 즉시 개선 가능:
1. **검색 기능** - 현재 UI만 있고 작동 안 함
2. **Google Maps 연동** - BusinessDetail 페이지에 지도 추가
3. **페이지네이션** - Listings 페이지에 20개씩
4. **로딩 상태** - TanStack Query isLoading 활용

### 나중에:
1. **리뷰 시스템** - users 테이블 활용
2. **Claim Listing** - 사업자 인증
3. **Analytics 대시보드** - 조회수, 클릭 추적
4. **이메일 뉴스레터** - SendGrid 연동

---

**다음 액션: DB 스키마 추가부터 시작!**
