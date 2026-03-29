# DalKonnect Site Audit Report
> Generated: 2026-03-26
> Scope: Full codebase audit — UX, security, SEO, performance, code quality

---

## 🔴 CRITICAL — Breaks functionality or loses users

### Security

**[Security] Google Maps API key hardcoded in source**
`api/businesses.ts:23` — `GOOGLE_MAPS_API_KEY = "AIzaSy..."` is committed in plaintext.
→ Move to `process.env.GOOGLE_MAPS_API_KEY` immediately; rotate the exposed key.

**[Security] XSS via dangerouslySetInnerHTML in CommunityPost**
`client/src/pages/CommunityPost.tsx:407` — User-generated post content injected directly into DOM without sanitization.
→ Sanitize with `DOMPurify` before rendering, or switch to a safe markdown renderer.

**[Security] XSS via direct innerHTML assignment in Charts**
`client/src/pages/Charts.tsx:235` — `target.parentElement!.innerHTML = \`<div ...>\`` allows XSS injection.
→ Replace with React-safe DOM methods or a ref-based approach.

**[Security] innerHTML manipulation in Businesses fallback icons**
`client/src/pages/Businesses.tsx:502` — `parent.innerHTML = \`<div ...>...\`` — if category names are user-controlled this is a vector.
→ Use React portals or conditional rendering instead.

### Functionality

**[Bug] useState used as side effect in News.tsx**
`client/src/pages/News.tsx:208` — `useState(() => { if (urlCategory !== selectedCategory) setSelectedCategory(urlCategory); })` — state setter called during render, causes infinite re-render loop.
→ Move this logic into a `useEffect`.

**[Bug] Home.tsx falls through to undefined `data.businesses`**
`client/src/pages/Home.tsx:231` — `const pool = withImage.length > 0 ? withImage : data.businesses` — if `data.businesses` is undefined/empty this throws a runtime error.
→ Add a null guard: `data.businesses ?? []`.

**[Bug] Missing CORS on `/api/og.ts` redirect**
Uses `<script>window.location.href="${esc(url)}"</script>` for redirect instead of an HTTP `Location` header — broken for non-browser clients and a minor injection surface.
→ Use `res.redirect(302, url)`.

---

## 🟡 IMPORTANT — UX/conversion impact

### Landing Page UX (pre-identified)

**[UX] Hero section too tall — key content hidden below fold**
`client/src/pages/Home.tsx` — The hero occupies most of the viewport height; users on 768px screens can't see the category chips or search results.
→ Reduce hero min-height; move category chips above the fold.

**[UX] Business count inconsistency — "1210 업체" vs "1175 업체"**
Two different hardcoded counts shown in the hero and footer/section headings.
→ Pull count dynamically from the API; never hardcode it.

**[UX] Category chips have no visual styling**
Category filter pills have no border, background color, or icon — look like plain text.
→ Add background chip style + category emoji/icon per pill.

**[UX] Real-time visitor counter "5 오늘" hurts credibility**
Low visitor numbers displayed prominently damage trust with new visitors.
→ Remove the live counter or show a rolling 30-day aggregate instead.

**[UX] Search placeholder too narrow ("맛집 검색…")**
Only implies restaurant search; hides the full-site search capability.
→ Rotate placeholders: "맛집, 미용실, 세탁소…" etc.

**[UX] No consumer-facing CTA on landing page**
The only CTA is "업체 등록" which targets business owners. Regular visitors have no clear next step.
→ Add "업체 찾기" / "딜 보기" CTAs for consumers.

**[UX] Cookie consent banner too intrusive**
Full-width fixed banner blocks content on first visit.
→ Reduce to a small bottom-left toast or use a less obtrusive pattern.

### Error Handling

**[Bug] All Home.tsx fetch calls silently swallow errors**
`client/src/pages/Home.tsx:237,255,275,296,320` — catch blocks only call `console.error()`, no user-visible error state.
→ Add error state per section and show a fallback UI (or retry button).

**[Bug] Charts.tsx catch block has no fallback state**
`client/src/pages/Charts.tsx:66` — `console.error` only; page stays in loading skeleton forever on API failure.
→ Set an error state and show a message.

**[Bug] AdminDashboard data not implemented**
`client/src/pages/AdminDashboard.tsx:25` — `// TODO: Fetch from API` — dashboard shows no real data.
→ Implement the API call or remove the route until ready.

### SEO

**[SEO] Missing meta tags on Deals, Charts, Community, Marketplace pages**
`/pages/Deals.tsx`, `/pages/Charts.tsx`, `/pages/Community.tsx`, `/pages/Marketplace.tsx` — no `<Helmet>` title, description, or OG tags.
→ Add per-page `<Helmet>` blocks with Korean + English content.

**[SEO] Inconsistent page titles**
Some pages have proper `<title>` tags, others inherit the site default. Google shows the wrong title in SERPs.
→ Standardize a `<site> | <page>` title pattern across all routes.

### API Quality

**[API] Inconsistent response shapes across endpoints**
`/api/community.ts` returns `.posts`, `.data`, or plain array depending on query path. Frontend compensates with: `postsData?.data || postsData?.posts`.
→ Standardize all list endpoints to `{ items: [], pagination: {} }`.

**[API] No rate limiting on public write endpoints**
`/api/community.ts`, `/api/businesses.ts`, `/api/search.ts` accept unlimited writes. `_rateLimit.ts` exists but is not wired in.
→ Import and apply `_rateLimit.ts` to all public POST routes.

**[API] No input length validation on community posts**
`/api/community.ts:121,134,156` — `nickname`, `title`, `content` have no max-length check.
→ Add server-side validation (e.g., content ≤ 10,000 chars).

**[API] SendGrid failure silently ignored**
`/api/contact.ts:26-37` — if `SENDGRID_API_KEY` is unset, the error is swallowed and the user gets a false success response.
→ Check env var at startup; return 500 on send failure.

**[API] Firebase stats failure not surfaced**
`/api/stats.ts:22` — `JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON)` without try-catch; crashes the function if the env var is malformed.
→ Wrap in try-catch; return degraded response instead of crash.

### Performance

**[Perf] Home.tsx makes 5 sequential fetch calls**
`client/src/pages/Home.tsx:218-320` — five independent `useEffect` fetches run one after another instead of in parallel.
→ Consolidate with `Promise.all()` or a single `/api/home-data` endpoint.

**[Perf] Hardcoded category="식당" fetch on home page**
`client/src/pages/Home.tsx:222` — always fetches Korean restaurants; can't be reconfigured.
→ Make the featured category configurable via a CMS flag or environment variable.

---

## 🟢 NICE TO HAVE — Polish

### Code Quality

**[Code] Heavy use of `any` types throughout codebase**
`api/featured.ts:43`, `api/businesses.ts:251`, `api/community.ts:109`, and many client files. Makes refactoring risky.
→ Define typed interfaces for all API responses in `shared/schema.ts` or a `shared/types.ts`.

**[Code] Console.log statements left in production code**
`client/src/pages/Businesses.tsx:212,221,231` — scrape/debug logs; `client/src/pages/BusinessDetail.tsx:125` — share error.
→ Remove all `console.log` / `console.error` calls; use a logger or Sentry.

**[Code] `og.ts` redirect uses client-side script instead of HTTP header**
Pattern: `<script>window.location.href="..."</script>` — bad for crawlers and non-JS clients.
→ Use `res.redirect(301, url)`.

**[UI] Tailwind class typo in About.tsx**
`client/src/pages/About.tsx:66` — `justify-content-center` is not a valid Tailwind class; should be `justify-center`.
→ Fix the class name.

**[UI] Loading states use plain text instead of skeletons on some pages**
`client/src/pages/Deals.tsx:383-387` — "Loading deals…" plain text; `Marketplace.tsx:155` — "로딩중…".
→ Replace with skeleton loader components consistent with other pages.

**[SEO/Perf] Sitemap has two overlapping rewrite rules**
`vercel.json` — `/sitemap.xml` and `/sitemap-dynamic.xml` both rewrite to similar handlers; unclear which is canonical.
→ Consolidate to one sitemap endpoint and update `robots.txt` accordingly.

**[Schema] Redundant image URL columns in blogs table**
`shared/schema.ts:85-86` — `cover_url` and `cover_image` both exist; creates inconsistency in seeding and querying.
→ Pick one column name and migrate the other to it.

**[Deps] Potentially unused large dependencies**
`package.json` — `puppeteer@24.39.0` (headless browser, ~200MB), `better-sqlite3`, `xml2js` — no obvious usage found in source.
→ Audit with `depcheck`; remove unused packages to reduce build time and attack surface.

**[Deps] `firebase-admin` only used as fallback in `api/news.ts`**
Heavy dependency for a fallback path. If news is primarily sourced from PostgreSQL, Firebase dependency can be dropped.
→ Evaluate whether the Firebase fallback is still needed.

**[UX] Phone validation regex too broad in RegisterBusiness**
`client/src/pages/RegisterBusiness.tsx` — regex `/^[\d\s\-\+\(\)]{10,20}$/` allows strings like `----------` (10 dashes).
→ Use a stricter phone validation (e.g., libphonenumber-js).

**[Cache] Place photo cache set to 7 days**
`api/place-photo.ts:77` — `max-age=604800`; Google Maps photos can be removed or changed.
→ Reduce to 24h (`max-age=86400`) or use a CDN with cache invalidation.

**[i18n] Mixed Korean/English error messages in API responses**
Some endpoints return `"서버 오류가 발생했습니다"`, others return `"Internal server error"`.
→ Standardize on one language for API error messages (Korean preferred for this audience).

---

## Route Coverage Summary

| Route | Status | Notes |
|-------|--------|-------|
| `/` | ⚠️ Issues | Hero UX, count inconsistency, visitor counter, fetch errors |
| `/businesses` | ⚠️ Issues | API key exposed, innerHTML XSS vector |
| `/deals` | ⚠️ Issues | Missing SEO, plain text loading state |
| `/marketplace` | ⚠️ Issues | Missing SEO, plain text loading state |
| `/roommate` | ❓ Not checked | Route exists, needs manual QA |
| `/community` | ⚠️ Issues | Missing SEO, inconsistent API response shape |
| `/charts` | ⚠️ Issues | innerHTML XSS, missing SEO, no error state |
| `/news` | 🔴 Bug | useState used as side effect — re-render loop |
| `/blog` | ✅ Looks OK | Has SEO meta tags |
| `/about` | ⚠️ Issues | Tailwind class typo |
| `/contact` | ⚠️ Issues | Silent SendGrid failure |
| `/register-business` | ⚠️ Issues | Weak phone validation |
| `/admin` | 🔴 Bug | TODO fetch not implemented |
| `/community/:id` | 🔴 XSS | dangerouslySetInnerHTML without sanitization |

---

## Priority Action List

1. 🔴 Rotate the exposed Google Maps API key and move to env var
2. 🔴 Sanitize CommunityPost content (DOMPurify or markdown renderer)
3. 🔴 Fix News.tsx useState-as-side-effect re-render bug
4. 🟡 Add error states to all Home.tsx section fetches
5. 🟡 Add SEO `<Helmet>` blocks to Deals, Charts, Community, Marketplace
6. 🟡 Standardize API response shape to `{ items, pagination }`
7. 🟡 Wire rate limiting to community/search POST endpoints
8. 🟡 Fix hero UX issues (height, count, CTA, placeholder rotation)
9. 🟢 Replace all `innerHTML` with React-safe patterns
10. 🟢 Remove unused dependencies (puppeteer, better-sqlite3, xml2js)
11. 🟢 Fix About.tsx Tailwind typo
12. 🟢 Replace plain-text loading states with skeleton loaders
