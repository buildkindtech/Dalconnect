# DalConnect - 프로젝트 컨텍스트

**마지막 업데이트:** 2026-02-25 (화) 23:59
**채팅방:** DalConnect (Telegram -5280678324)
**참여자:** Aaron (Abe Ahn), OpenClaw

---

## 📌 프로젝트 개요

**DalConnect (달라스 한인 디렉토리)**
- **목적:** DFW 지역 한인 비즈니스 + 뉴스 + 커뮤니티 플랫폼
- **URL:** https://dalconnect.buildkind.tech (Vercel 호스팅)
- **스택:** React + TypeScript + Express + PostgreSQL (Neon)
- **위치:** `/Users/aaron/.openclaw/workspace-manager/projects/dalconnect`
- **ClickUp:** Products & Stores > DFW Korean Directory (List ID: 901325690153)

**주요 기능:**
1. 비즈니스 디렉토리 (Google Places API 스크래핑)
2. 한인 뉴스 수집
3. 카테고리별 검색/필터
4. Featured 비즈니스

---

## 🔥 현재 발생한 문제 (2026-02-25)

### 타임라인

**어제 (2/24):**
- ✅ Google Maps 스크래퍼 정상 작동
- ✅ 비즈니스 데이터 수집 성공
- ✅ 화면에 데이터 표시됨

**오늘 (2/25 아침):**
- ❌ Aaron이 텔레그램 메시지 받음:
  > "DalConnect Google Maps Scraper Failed"
  > "403 error: You're calling a legacy API, which is not enabled"
- ❌ 12/12 카테고리 모두 실패
- ❌ 화면에 데이터 안 보임

**Aaron의 반응:**
> "이건 어제잘되다가 오늘은 왜 안되는거야 같은 api 쓰는거 아냐?"

**오늘 (2/25 오후) - 해결:**
- ✅ Opus 4.6으로 근본 원인 파악: 시스템 환경 변수 충돌
- ✅ `unset DATABASE_URL` → 10초만에 해결
- ✅ 1,161개 비즈니스 데이터 안전 확인
- ✅ DB 연결 정상화

**Aaron의 교훈:**
> "어제 저녁에 opus4.6로 해서 잘 했다가 아침에 sonnet4.5 로 바뀌면서 작업을 못하는거야, 확실히 어떻게 작업해야하는지 메모리에 기억해놔야겠다"

### 발견한 문제들

#### 1. **Google Places API 403 에러**
```
Error: "You're calling a legacy API, which is not enabled for your project."
```

**실제 상황:**
- 코드는 새 Places API 사용 중: `places.googleapis.com/v1/`
- API Key: `AIzaSyAzcujFS2IfcaxVmtYvFEb4omQhVlOQCOE`
- 에러 메시지가 헷갈리지만, 실제로는 새 API가 비활성화된 것으로 추정

**가능한 원인:**
1. Google이 API 정책 변경
2. Billing 계정 문제
3. API 할당량 소진
4. 어제와 오늘 사이 Console 설정 변경

#### 2. **Neon PostgreSQL 연결 실패**
```
Error: getaddrinfo ENOTFOUND base
password authentication failed for user 'neondb_owner'
```

**현재 DATABASE_URL:**
```
[DATABASE_URL from .env]
```

**테스트 결과:**
- `npx tsx scripts/test-db-connection.ts` 실패
- 호스트를 못 찾음 (DNS 문제 또는 연결 문자열 만료)

#### 3. **근본적인 구조 문제**

**Aaron의 지적:**
> "우선 문제는 매일 데이터를 리프래시해서 새로 올리지 말고 있는 데이터는 킵하고 필요한 부분만 업데이트 되는걸로 해야지. 연결 끊겼다고 어제 있던 데이터를 다 안보이게 하는건 문제가 있다 어떻게 생각해?"

**OpenClaw 답변:**
> "**완전 동의합니다.** 연결 끊겼다고 기존 데이터가 사라지는 건 말이 안 돼요."

**현재 방식:**
- API 실패 → 화면에 아무것도 안 보임
- 매일 전체 리프레시 (기존 데이터 날아감)

**올바른 방식:**
- DB에 저장된 데이터는 영구 보존
- API는 신규 추가 + 변경사항만 업데이트 (Upsert)
- API 실패해도 기존 데이터 계속 표시

---

## 📋 ClickUp 태스크 생성 완료

**ClickUp 리스트:** Products & Stores > DFW Korean Directory (901325690153)

### 즉시 해결 (오늘)

**1. 🔥 Neon DB 연결 복구 (최우선)** - P1
- **Task ID:** 86afp2hzn
- **예상 시간:** 5분
- **조치:**
  1. Neon Console: https://console.neon.tech
  2. Connection Details → 새 연결 문자열 복사
  3. `.env` 업데이트 (DATABASE_URL)
  4. 테스트: `npx tsx scripts/test-db-connection.ts`
- **목표:** 기존 비즈니스/뉴스 데이터를 화면에 표시

**2. 🔑 Google Places API 활성화** - P2
- **Task ID:** 86afp2hvf
- **예상 시간:** 3분
- **조치:**
  1. Google Cloud Console: https://console.cloud.google.com
  2. API Key 확인: `AIzaSyAzcujFS2IfcaxVmtYvFEb4omQhVlOQCOE`
  3. Places API (New) 활성화: https://console.cloud.google.com/apis/library/places-backend.googleapis.com
  4. Billing 계정 연결 확인
  5. API 할당량 확인
- **테스트:** `npx tsx scripts/scrape-businesses.ts`
- **목표:** 새 비즈니스 스크래핑 재개

**3. ⏸️ Cron Job 상태 확인** - P3
- **Task ID:** 86afp2j50
- **예상 시간:** 2분
- **조치:**
  ```bash
  openclaw cron list
  ```
  - DalConnect 뉴스/비즈니스 수집 job 찾기
  - DB 연결 복구 전: 일시 비활성화
  - DB 테스트 성공 후: 재활성화
- **목적:** 실패 방지

### 구조 개선 (이번 주)

**4. 🔧 데이터 업데이트 로직 개선 (Upsert)** - P3
- **Task ID:** 86afp2vbf
- **예상 시간:** 30분
- **목적:** API 실패해도 기존 데이터 유지
- **수정 파일:**
  - `scripts/scrape-businesses.ts`
  - `scripts/collect-news.ts` (있다면)
- **개선 내용:**
  ```typescript
  // 현재 (잘못된 방식)
  await db.delete(businesses).execute();
  await db.insert(businesses).values(newData);
  
  // 개선 (Upsert)
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

**5. 🛡️ 에러 핸들링 강화** - P3
- **Task ID:** 86afp2vkd
- **예상 시간:** 15분
- **목적:** API/DB 실패 시에도 사용자 경험 유지
- **개선 사항:**
  - **프론트엔드:** localStorage 캐시 사용, API 실패 시 캐시된 데이터 표시
  - **백엔드:** DB 실패 시 503 에러 + retry 플래그
- **수정 파일:**
  - `client/src/pages/*.tsx`
  - `server/routes.ts`

---

## 🔍 대화 요약 (2026-02-25)

### Aaron의 문제 제기
> "이건 어제잘되다가 오늘은 왜 안되는거야 같은 api 쓰는거 아냐?"

### OpenClaw 분석
1. 코드 확인: 실제로는 새 Places API 사용 중
2. API Key 발견: `AIzaSyAzcujFS2IfcaxVmtYvFEb4omQhVlOQCOE`
3. 에러 원인 추정:
   - Places API (New) 비활성화
   - Billing 문제
   - API 정책 변경

### Aaron의 근본적 지적
> "우선 문제는 매일 데이터를 리프래시해서 새로 올리지 말고 있는 데이터는 킵하고 필요한 부분만 업데이트 되는걸로 해야지"

> "연결 끊겼다고 어제 있던 데이터를 다 안보이게 하는건 문제가 있다 어떻게 생각해?"

### OpenClaw 동의
> "**완전 동의합니다.** DB에 이미 있는 비즈니스/뉴스 데이터는 계속 보여야 하고, API는 **추가/업데이트만** 담당해야죠."

### Aaron의 다음 지시
> "응 최근에 있었던 데이터들로 우선 다 보여주고 태스크 정리해서 하나씩 풀어보는걸로 해줘"

### 결과
- ClickUp 태스크 5개 생성/업데이트
- `DALCONNECT-FIX-PLAN.md` 작성
- `test-db-connection.ts` 스크립트 생성

### Aaron의 피드백 (프로젝트 관리)
> "지금 보니까 프로잭트에 대한 이야기를 할때 여러개의 토픽을 한군데서 하니까 좋지 않은거 같아"

> "디태일한 내용들이 다 들어가있어야 다시 설명을 안하지. 그렇게 정리된 파일을 알려주면 내가 이 달코넥트 이름으로 채팅방을 열어서 거기는 그 프로잭트 이야기만 하는걸로 해놓을께 어때?"

**→ 이 파일이 그 목적으로 작성됨**

---

## 📂 관련 파일

### 프로젝트 루트
- `/projects/dalconnect/`

### 환경 설정
- `.env` - 환경 변수 (DATABASE_URL, GOOGLE_MAPS_API_KEY)

### 스크립트
- `scripts/scrape-businesses.ts` - Google Places API 스크래퍼
- `scripts/collect-news.ts` - 뉴스 수집 (확인 필요)
- `scripts/test-db-connection.ts` - DB 연결 테스트 (새로 생성)

### 문서
- `DALCONNECT-FIX-PLAN.md` - 상세 수정 계획
- `PROJECT-CONTEXT.md` - 이 파일 (프로젝트 컨텍스트)

### 백엔드
- `server/routes.ts` - API 엔드포인트
- `server/storage.ts` - DB 쿼리 로직
- `server/db.ts` - DB 연결

### 프론트엔드
- `client/src/pages/` - React 페이지들

### 스키마
- `shared/schema.ts` - Drizzle ORM 스키마

---

## 🚀 다음 스텝 (순서대로)

### Aaron이 해야 할 것

**1. Neon DB 연결 문자열 받기** (5분)
```
1. https://console.neon.tech 접속
2. 프로젝트 선택
3. Connection Details 클릭
4. "Pooled connection" 복사
5. OpenClaw에게 전달
```

**2. Google Places API 활성화** (3분)
```
1. https://console.cloud.google.com 접속
2. API & Services → Library
3. "Places API (New)" 검색
4. Enable 클릭
5. Billing 계정 연결 확인
```

### OpenClaw가 할 것

**1. DATABASE_URL 업데이트**
```bash
cd /Users/aaron/.openclaw/workspace-manager/projects/dalconnect
nano .env  # DATABASE_URL 교체
```

**2. 연결 테스트**
```bash
npx tsx scripts/test-db-connection.ts
```

**3. 화면 확인**
- Vercel 배포 또는 로컬 테스트
- 기존 데이터가 표시되는지 확인

**4. Places API 테스트**
```bash
npx tsx scripts/scrape-businesses.ts
```

**5. Cron Job 확인**
```bash
openclaw cron list
```

**6. 구조 개선 (Aaron 승인 후)**
- Upsert 방식으로 변경
- 에러 핸들링 강화
- 테스트 + 배포

---

## 💡 배운 교훈

### 1. **데이터 영속성 우선**
- API는 실패할 수 있다
- 기존 데이터는 항상 보존해야 한다
- Upsert 방식이 delete+insert보다 안전하다

### 2. **Graceful Degradation**
- API 실패 시에도 사용자 경험 유지
- 캐시 활용 (localStorage, DB)
- 명확한 에러 메시지

### 3. **프로젝트별 컨텍스트 분리**
- 여러 프로젝트를 한 방에서 섞지 말 것
- 디테일한 기록 필수 (반복 설명 방지)
- 프로젝트별 전용 채팅방 유용

### 4. **인프라 의존성 파악**
- Google API는 정책이 자주 변경됨
- DB 연결 문자열은 만료될 수 있음
- 헬스체크 + 모니터링 필수

---

## 📊 현재 상태 (2026-02-25 기준)

### ✅ 해결 완료 (2026-02-25 오후)
- ✅ **Neon PostgreSQL 연결 복구** - 1,161개 비즈니스 데이터 안전 확인
  - **근본 원인**: 시스템 환경 변수 `DATABASE_URL=<password-only>` (비밀번호만) → `.env` 파일 덮어씀
  - **해결**: `unset DATABASE_URL` 실행
  - **교훈**: Opus 4.6이 근본 원인 찾음 (Sonnet 4.5는 표면적 해결책만 제시)

### 작동 중
- ✅ 프론트엔드 (Vercel)
- ✅ 백엔드 API (Express)
- ✅ Neon PostgreSQL (1,161 businesses)

### 고장 중
- ❌ Google Places API (403 에러 - 활성화 필요)
- ❌ 비즈니스 스크래퍼 (Places API 의존)
- ❌ 뉴스 수집 (추정)

### 대기 중
- ⏸️ Cron Jobs (비활성화 예정)

---

## 🔗 중요 링크

### 개발
- **Vercel:** https://dalconnect.buildkind.tech
- **GitHub:** (확인 필요)
- **Neon Console:** https://console.neon.tech
- **Google Cloud Console:** https://console.cloud.google.com

### ClickUp
- **Space:** Products & Stores (901313362098)
- **List:** DFW Korean Directory (901325690153)
- **태스크:**
  - 86afp2hzn (DB 연결)
  - 86afp2hvf (Places API)
  - 86afp2j50 (Cron Job)
  - 86afp2vbf (Upsert)
  - 86afp2vkd (에러 핸들링)

---

**이 파일을 DalConnect 전용 채팅방에서 읽으면, 프로젝트 전체 컨텍스트를 파악하고 바로 작업할 수 있습니다.**

**마지막 대화:** 2026-02-25 23:59 (DalConnect 전용방)
**다음 액션:** 2-3일 내 Soft Launch 준비 (크론잡 + GA + 소셜 미디어)

---

## 🎉 2026-02-25 완료 작업 요약

### ✅ 핵심 성과
1. **DB 연결 복구** (10초 해결) ⚡
   - Opus 4.6이 근본 원인 발견
   - 1,210개 비즈니스 데이터 안전 확인
   
2. **Google Places API 활성화**
   - 313개 비즈니스 수집 성공
   - 비용: $0/월 (무료 할당량)
   
3. **Upsert 로직 구현** (가장 중요!)
   - 기존 데이터 보존 + 자동 업데이트
   - 평점/리뷰/전화번호/영업시간 자동 갱신
   
4. **런치 준비 완료**
   - CRON-SCHEDULE.md (자동화 전략)
   - LAUNCH-CHECKLIST.md (2-3일 플랜)

### 📊 현재 상태
- **비즈니스**: 1,210개 (95% rating, 97% phone)
- **뉴스**: 336개
- **쿠폰/딜**: 30개
- **인기순위**: 40개
- **블로그**: 39개
- **마켓플레이스**: 27개
- **커뮤니티**: 29개

### 🚀 Soft Launch 준비
**타임라인**: 2-3일 내 가능
- Day 1: 크론잡 + GA + 테스트
- Day 2: 소셜 미디어 + 콘텐츠
- Day 3: **공개 런칭** 🎉

**비용**: $0 (Phase 1)

### 📋 ClickUp 업데이트
- ✅ 완료 3개: DB 복구, API 활성화, Upsert
- 🆕 신규 4개: 런치 준비, 크론잡, GA, 테스트
