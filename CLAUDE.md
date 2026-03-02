# CLAUDE.md — DalConnect

> DFW 한인 커뮤니티 디렉토리 & 리소스 허브
> Business listings, guides, deals, news, community board for Korean-Americans in Dallas-Fort Worth

---

## 🔗 핵심 링크
| 항목 | URL |
|------|-----|
| GitHub | https://github.com/buildkindtech/Dalconnect |
| 배포 (Production) | https://dalconnect.buildkind.tech |
| Vercel 대시보드 | https://vercel.com (buildkindtech 팀) |
| 기본 브랜치 | `main` |

---

## 🏗 프로젝트 구조

```
Dalconnect/
├── api/                  # Vercel Serverless Functions (각 파일 = 1 endpoint)
│   ├── businesses.ts     # 업체 목록/검색/등록/클레임 — 핵심 API
│   ├── blogs.ts          # 블로그 목록/상세
│   ├── blog-detail.ts    # 블로그 slug 조회
│   ├── deals.ts          # 딜/할인 정보
│   ├── news.ts           # 뉴스 크롤링 결과
│   ├── charts.ts         # 한인 차트 (드라마/음악/영화)
│   ├── community.ts      # 커뮤니티 게시판
│   ├── listings.ts       # 마켓플레이스 매물
│   ├── search.ts         # 통합 검색
│   ├── featured.ts       # 추천 업체
│   ├── newsletter.ts     # 뉴스레터 구독
│   ├── stripe-checkout.ts# 유료 플랜 결제
│   ├── _db.ts            # DB 연결 헬퍼 (Vercel에서 import 불가 — 인라인 사용)
│   ├── _cors.ts          # CORS 헬퍼 (Vercel에서 import 불가 — 인라인 사용)
│   └── _koreanTranslit.ts# 한글 변환 참고용 (Vercel에서 import 불가 — 인라인 사용)
│
├── client/src/
│   ├── pages/            # React 페이지 컴포넌트
│   │   ├── Home.tsx      # 랜딩 페이지
│   │   ├── Businesses.tsx# 업소록 (검색+필터 사이드바)
│   │   ├── Deals.tsx     # 딜 페이지
│   │   ├── Blog.tsx      # 블로그 목록
│   │   ├── News.tsx      # 뉴스
│   │   ├── Charts.tsx    # 차트
│   │   ├── Community.tsx # 커뮤니티 게시판
│   │   └── ...
│   ├── components/       # 공통 UI 컴포넌트
│   └── lib/              # API 클라이언트, 유틸
│
├── shared/
│   └── schema.ts         # Drizzle ORM DB 스키마 (단일 소스)
│
├── scripts/              # 시드 스크립트, 크론 작업
├── server/               # 로컬 개발 서버 (Express)
├── vercel.json           # Vercel 빌드/라우팅 설정
└── CLAUDE.md             # 이 파일
```

---

## 🗄 데이터베이스

- **DB**: PostgreSQL (Neon Serverless)
- **ORM**: Drizzle ORM
- **스키마 파일**: `shared/schema.ts`
- **환경변수**: `DATABASE_URL` (Vercel 환경변수에 설정됨)

### 테이블 목록
| 테이블 | 용도 |
|--------|------|
| `businesses` | 업체 정보 (이름/카테고리/주소/평점 등) |
| `news` | 크롤링된 한인 뉴스 |
| `blogs` | 가이드 블로그 포스트 |
| `listings` | 마켓플레이스 매물 |
| `deals` | 딜/할인 정보 |
| `community_posts` | 커뮤니티 게시글 |
| `community_comments` | 커뮤니티 댓글 |
| `community_trends` | 인기 태그/트렌드 |
| `charts` | 한인 드라마/음악/영화 차트 |
| `search_logs` | 검색어 로그 |
| `newsletter_subscribers` | 뉴스레터 구독자 |
| `news_submissions` | 뉴스 제보 |

---

## ⚙️ 핵심 로직

### ⚠️ Vercel Serverless 제약사항 (매우 중요!)
- `api/` 내 파일들은 **서로 import 불가** → 런타임 크래시 발생
- `_db.ts`, `_cors.ts`, `_koreanTranslit.ts`는 참고용이고, **실제로는 각 api/*.ts 파일에 코드를 인라인으로 복붙해야 함**
- CORS 처리, DB 연결, 한글 변환 코드 → 각 파일에 직접 포함

### 한글↔영어 검색 (`api/businesses.ts`)
- `koreanToRoman()`: Unicode 분해로 **모든** 한글 음절을 로마자로 변환
- `KOREAN_TO_ENGLISH` 수동 오버라이드: 실제 스펠링 반영 (김→kim, 제니→jenny)
- 검색 시 원본 + 변환된 대안들 모두 OR 조건으로 ILIKE 쿼리

### 한글 입력 (IME) 처리 (`client/src/pages/Businesses.tsx`)
- `FilterSidebar`는 **반드시 `Businesses()` 밖에 독립 컴포넌트로** 선언
  → 인라인 정의 시 매 렌더마다 unmount/remount → IME 깨짐
- `onCompositionStart/End`로 IME 상태 추적
- 불완전 자모(ㄱ-ㅎ, ㅏ-ㅣ) 입력 중엔 검색 스킵
- 디바운스 500ms

---

## 🚀 배포 방법

### 자동 배포 (권장)
```bash
git add .
git commit -m "작업 내용"
git push origin main
# → Vercel이 main 브랜치 감지 → 자동 빌드+배포
# → https://dalconnect.buildkind.tech 자동 업데이트
```

### 수동 배포
```bash
npx vercel --prod --yes
```

### 로컬 개발
```bash
npm install
npm run dev:client   # Vite 프론트엔드 (port 5000)
npm run dev          # Express 백엔드 (로컬용)
```

---

## ✅ 작업 완료 규칙 (필수)
1. 모든 변경사항 커밋 + `git push origin main`
2. Vercel 자동 배포 확인 (또는 `npx vercel --prod --yes`)
3. 배포 URL 확인 후 알려주기: https://dalconnect.buildkind.tech
4. 작업 요약: 뭘 만들었는지, 뭐가 바뀌었는지, 다음에 할 일

---

## 📋 환경변수 (Vercel에 설정 필요)
| 변수 | 용도 |
|------|------|
| `DATABASE_URL` | Neon PostgreSQL 연결 문자열 |
| `TELEGRAM_BOT_TOKEN` | 업체 등록 알림 봇 |
| `TELEGRAM_CHAT_ID` | 알림 받을 채널 ID |
| `STRIPE_SECRET_KEY` | 결제 처리 |
| `VITE_STRIPE_PUBLIC_KEY` | 프론트 결제 |

---

## 🔀 브랜치 전략
- `main` → Production 배포 (Vercel 자동 연결)
- `claude/relaxed-hertz` → Claude Code 작업 브랜치 (PR → main으로 머지)
- 작업 후 PR 생성 → 머지 → main 자동 배포

---

## 📌 최근 작업 이력
| PR | 내용 |
|----|------|
| #9 | 알고리즘 기반 한글→영어 변환 (제니→Jenny) |
| #8 | 업소록 검색창 freeze 근본 수정 (FilterSidebar 독립 컴포넌트화) |
| #7 | IME 조합 처리 추가 |
| #6 | 미완성 한글(ㅈ) 입력 시 freeze 방지 |
| #5 | 한/영 양방향 교차 검색 |
| #4 | 딜 페이지 null URL → 404 수정 |
| #3 | 실생활 가이드 블로그 20개 추가 |
