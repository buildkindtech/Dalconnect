# DalConnect 소셜 미디어 자동 포스팅 셋업 가이드

## 현재 상태
- ✅ 자동 포스팅 스크립트 완성 (`scripts/social-auto-post.cjs`)
- ✅ 뉴스/딜/블로그에서 자동 선별 → 인스타+페이스북 동시 포스팅
- ⏳ 계정 생성 + API 키 설정 필요

## Step 1: Instagram 비즈니스 계정 만들기
1. Instagram에서 `@dalconnect` (또는 유사 핸들) 계정 생성
2. 비즈니스 계정으로 전환 (설정 → 계정 → 비즈니스로 전환)
3. Facebook 페이지와 연결 (Step 2 이후)

## Step 2: Facebook 페이지 만들기
1. facebook.com/pages/create 에서 "DalConnect" 페이지 생성
2. 카테고리: "Community" 또는 "Media/News Company"
3. 프로필 사진 + 커버 사진 설정
4. Instagram 비즈니스 계정과 연결

## Step 3: Meta Developer 앱 설정
1. https://developers.facebook.com 에서 앱 생성
2. 앱 이름: "DalConnect Social"
3. 필요 권한:
   - `pages_manage_posts` (Facebook 포스팅)
   - `instagram_basic` (Instagram 기본)
   - `instagram_content_publish` (Instagram 포스팅)
4. Page Access Token 생성 → 영구 토큰으로 변환
5. Instagram Business Account ID 확인

## Step 4: 환경변수 설정
```bash
# .env에 추가
FB_PAGE_ACCESS_TOKEN=<Facebook 페이지 액세스 토큰>
FB_PAGE_ID=<Facebook 페이지 ID>
IG_BUSINESS_ACCOUNT_ID=<Instagram 비즈니스 계정 ID>
```

## Step 5: 테스트 실행
```bash
# 미리보기 (실제 포스팅 안 함)
node scripts/social-auto-post.cjs --preview

# 실제 포스팅
node scripts/social-auto-post.cjs
```

## Step 6: 크론잡 설정
- 하루 2-3회 자동 포스팅 (9am, 1pm, 6pm CST)
- OpenClaw 크론으로 등록

## 포스트 형식
- **뉴스**: 🗞️ 제목 + 요약 + dalconnect.buildkind.tech/news 링크
- **딜**: 🔥 할인 정보 + 가격 + 링크
- **블로그**: 📝 제목 + 발췌 + 링크
- 해시태그: #달라스한인 #DFW한인 #DalConnect #달라스 자동 추가
