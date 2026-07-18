# DalKonnect Growth Loop

DalKonnect의 자동 성장 루프는 게시 수를 무조건 늘리지 않는다. 매일 GA4와 Instagram의 읽기 전용 성과 데이터를 수집하고, 이미 승인된 콘텐츠 주제 안에서 다음 주제의 우선순위만 조정한다.

## 매일 실행 순서

1. 오전 5:45 `growth-loop.cjs`
   - 최근 7일과 이전 7일의 GA4 채널 성과 비교
   - 최근 Instagram 게시물의 도달·저장·공유 수집
   - 권한이 있으면 Search Console 검색어·노출·평균순위 수집
   - `memory/growth-loop/latest.json`에 다음 주제 우선순위 저장
2. 오전 6:15 `instagram-v2.cjs`
   - 성장 전략을 읽고 그날 승인된 주제 목록 안에서 순서를 조정
   - 실사진 권리, 출처, Leda 음성, 30초 제한 등 기존 품질 게이트 유지
3. 오전 7:00 `indexnow-sitemap.cjs`
   - 공개 sitemap에서 새 URL만 찾음
   - 첫 실행은 상태만 저장하고 대량 제출하지 않음
   - 이후 신규 URL을 한 번에 최대 200개만 IndexNow에 제출

Instagram 프로필 링크는 `https://dalkonnect.com/ig`를 사용한다. 이 주소는 GA4가 인스타그램 자연 유입을 구분하도록 UTM이 붙은 홈페이지 주소로 이동한다.

## 핵심 KPI

- 결과 KPI: 최근 7일 참여 세션
- 유입 KPI: 자연검색 세션, 자연 소셜 세션
- 채널 KPI: Instagram 팔로워 수
- 품질 가드레일: 주제별 최소 표본 2개, 기존 사실·권리·중복 게시 게이트 유지

## 안전 규칙

- 성장 루프 자체는 게시, 메시지 전송, DB 수정, 프로덕션 변경을 하지 않는다.
- 자격증명은 출력하지 않으며 Instagram 토큰과 계정 ID는 macOS Keychain에서 읽는다.
- GA4 또는 Instagram 데이터가 없으면 전략 파일을 갱신하지 않고 실패한다.
- Search Console 권한이 없으면 `permission-required`로 기록하고 GA4와 Instagram만으로 계속 실행한다. 기존 Google 서비스 계정에 읽기 권한이 추가되면 다음 실행부터 검색어 수요가 자동으로 주제 우선순위에 반영된다.

## 수동 검증

```bash
node cron/growth-loop.cjs --no-write
node cron/indexnow-sitemap.cjs --dry-run
```
