# DalKonnect Instagram V2

## 목표

- 매일 한 개의 검토 가능한 콘텐츠 패키지를 생성한다.
- 20~30초 9:16 Reel을 기본으로 사용한다.
- 실사진, 사진 라이선스, 정보 출처가 모두 확인되어야 렌더한다.
- 생성과 공개 게시를 분리한다. 이 스크립트는 Instagram, Facebook, Telegram에 아무것도 보내지 않는다.

## 현재 주간 믹스

| 요일 | 기본 포맷 | 콘텐츠 역할 |
|---|---|---|
| 월 | 짧은 실사진 Reel | DFW 생활 안전·날씨 |
| 화 | 저장형 실사진 Reel | 생활 안전·도움 서비스 |
| 수 | 저장형 실사진 Reel | 생활 서비스·전화번호 |
| 목 | 짧은 실사진 Reel | 주말 전 공유하기 좋은 생활정보 |
| 금 | 짧은 실사진 Reel | 주말 전 공유형 생활정보 |
| 토 | 저장형 실사진 Reel | 날씨·안전 체크리스트 |
| 일 | 짧은 실사진 Reel | 다음 주 준비 콘텐츠 |

업체 소개는 2단계 모듈이다. 현재는 업체 사진 사용권 레지스트리가 비어 있으므로 실행하지 않으며, 모든 요일에 라이선스가 확인된 로컬 가이드를 생성한다. 업체 7곳 이상에서 명시적 사용권을 받은 뒤 별도 어댑터와 성과 실험을 활성화한다.

현재 콘텐츠 뱅크는 Dallas 311, Texas 211, 911 통화 준비, 토네이도 알림·대피, 폭염·차량 안전 등 공식 출처 기반 8개 주제로 구성된다. 같은 날짜에는 같은 주제를 유지하고, 최근 7개 패키지와 겹치지 않는 후보를 우선 선택한다.

## 실행

```bash
cd /Users/aaron/Projects/dalconnect
node cron/instagram-v2.cjs
node cron/instagram-v2.cjs --date=2026-07-16
node cron/instagram-v2.cjs --topic=tornado-watch-warning
node cron/instagram-v2.cjs --skip-existing
```

산출물은 `memory/instagram-v2/YYYY-MM-DD/`에 생성된다.

- `reel-preview.mp4`
- `slide-01.png` … `slide-05.png`
- `caption.txt`
- `manifest.json`
- `narration.mp3` (Google Cloud TTS Leda 1.2x)
- 라이선스가 확인된 원본 실사진과 출처

## 프리미엄 품질 게이트

렌더 전에 다음 기준을 모두 검사하며 하나라도 실패하면 게시용 패키지를 완성하지 않는다.

- 사실 3개와 각 사실의 공식 출처
- 정보 확인일 180일 이내
- 허용된 공식 도메인의 응답 확인
- 실사진 3개와 사진별 라이선스·작가·원문 링크
- 서로 다른 사진 작가 2명 이상
- Google Cloud TTS `ko-KR-Chirp3-HD-Leda` 한국어 내레이션
- 1.0x 생성 후 ffmpeg 1.2x 변환, 음성이 영상 끝에서 잘리지 않아야 함
- 1080×1920, H.264/AAC, 20~30초
- 과장·공포·클릭베이트 금지어 없음
- 종합 품질 점수 95점 이상

`--skip-existing`는 위 기준을 이미 통과한 날짜의 패키지만 건너뛴다. manifest의 값만 믿지 않고 파일 수, 크기, SHA-256, 영상 코덱·크기·길이, 캡션 필수 구역을 다시 확인한다.

재생성은 숨김 작업 폴더에서 끝까지 완성한 다음 활성 날짜 폴더로 승격한다. 이전 패키지는 삭제하지 않고 `YYYY-MM-DD.superseded-*` 이름으로 보존하므로, 실패한 렌더가 정상 검토본을 덮어쓰지 않는다.

## 게시 승인 게이트

`manifest.json`의 `publishApproved`는 항상 `false`로 생성된다. 공개 게시 자동화는 다음 조건을 모두 확인한 뒤 별도 승인으로 활성화한다.

1. 영상과 캡션을 Aaron이 검토한다.
2. 사실 출처와 사진 크레딧이 정확하다.
3. Instagram Account Status에서 추천 자격 문제가 없다.
4. 정확한 게시물에 대한 승인 기록을 남긴다.

## 업체 사진 사용권

`data/instagram-photo-rights.json`에 업체별 승인을 기록한다. `claimed=true`만으로는 사진 재게시 권한을 추정하지 않는다.

```json
{
  "businesses": {
    "BUSINESS_UUID": {
      "approved": true,
      "approvedBy": "owner name",
      "approvedAt": "2026-07-16",
      "scope": "DalKonnect Instagram and Facebook organic posts"
    }
  }
}
```

## 자동 생성

macOS 로그인 세션에서 오전 6:15 CDT에 LaunchAgent가 `--skip-existing` 모드로 검토용 패키지를 만든다. 컴퓨터가 꺼져 있으면 다음 로그인/기동 시 생성되며, 하루 최대 한 개만 유지한다.

Label: `tech.buildkind.dalkonnect.instagram-v2`

오전 6:15 미리보기 생성 자동화 자체는 Instagram/Facebook/Telegram에 게시하거나 메시지를 보내지 않는다.

## 자동 게시 단계

`tech.buildkind.dalkonnect.instagram-v2-post` LaunchAgent가 매일 오전 11:30 CDT에 패키지를 다시 검증한 뒤 Instagram Reel 게시를 시도한다.

- 전체 파일 SHA-256, 정확한 파일 집합, 영상 규격, 출처·사진 크레딧, Leda 음성을 다시 확인한다.
- 같은 날짜 또는 같은 영상 해시는 두 번 게시하지 않는다.
- Meta 토큰이 무효이면 Firebase 업로드나 Instagram 컨테이너 생성 전에 실패한다.
- Facebook·Telegram에는 게시하거나 메시지를 보내지 않는다.
- Meta Page 토큰과 Instagram 계정 ID는 macOS Keychain의 `dalkonnect` 계정에서 먼저 읽는다. 환경변수와 로컬 env 파일은 하위 호환용 fallback이며, 토큰을 저장소나 LaunchAgent에 평문으로 넣지 않는다.
- 2026-07-17 OAuth 재인증과 장기 Page 토큰 교환을 완료했고, `@dalkonnect` Reel 1건을 실제 게시해 전체 경로를 검증했다.

## 14일 실험 KPI

- 24시간 도달 중앙값: 기존 129 → 150 이상
- 저장+공유율: 기존 사실상 0% → 1% 이상
- 게시물당 순팔로워: 기존 약 0.73명 → 1명 이상
- 게시 실패, 출처 누락, 무권리 사진: 0건
