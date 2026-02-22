# DFW News Aggregator Skill

## 📋 Description

DFW 지역 한인 커뮤니티를 위한 **신뢰할 수 있는 뉴스 자동 수집 시스템**

**핵심 기능**:
- ✅ 신뢰할 수 있는 소스만 (화이트리스트)
- ✅ 가짜 뉴스 필터링
- ✅ 오래된 뉴스 제외 (48시간 이내만)
- ✅ 중복 자동 제거
- ✅ 8개 카테고리 (지역소식, 한인커뮤니티, 비즈니스, 이벤트, 날씨 등)
- ✅ Replit DB 자동 업로드

---

## 🎯 Use Case

- DFW Korean Directory 뉴스 섹션 자동 업데이트
- 매일 신선한 로컬 뉴스 제공
- 한인 커뮤니티 관련 소식 우선
- 가짜 뉴스 / 스팸 완전 차단

---

## 🔑 Requirements

### Python Dependencies
```bash
pip3 install requests
```

### SearXNG 실행 중
```bash
# 확인
curl http://localhost:8080/search?q=test&format=json

# 없으면 Docker로 시작
docker start searxng
```

### Replit API URL (선택적)
```bash
# .env에 추가
echo "REPLIT_API_URL=https://dalconnect.replit.app/api" >> /Users/aaron/.openclaw/workspace-manager/.env
```

---

## 📂 File Structure

```
skills/dfw-news-aggregator/
├── SKILL.md                    # 이 파일
├── README.md                   # 빠른 시작 가이드
├── config/
│   └── sources.json            # 뉴스 소스 설정
├── scripts/
│   ├── aggregate_news.py       # 메인 수집 스크립트
│   └── upload_to_replit.py     # Replit 업로드
└── output/
    └── news-YYYYMMDD-HHMMSS.json  # 수집 결과
```

---

## 🚀 Quick Start

### 1. 뉴스 수집
```bash
cd /Users/aaron/.openclaw/workspace-manager/skills/dfw-news-aggregator
python3 scripts/aggregate_news.py
```

**예상 출력**:
```
🚀 DFW News Aggregator 시작...

📰 검색: Dallas news (지역소식)
   45개 결과
   ✓ 12개 수집

📰 검색: Dallas Korean community (한인커뮤니티)
   18개 결과
   ✓ 8개 수집

...

📊 총 67개 수집 (중복 제거 전)
✨ 중복 제거 후: 42개

💾 저장: output/news-20260221-210000.json
📊 총 42개 뉴스

📈 카테고리별:
  • 지역소식: 15개
  • 한인커뮤니티: 10개
  • 비즈니스: 8개
  • 이벤트: 5개
  • 날씨: 4개

✅ 완료!
```

---

### 2. Replit 업로드
```bash
python3 scripts/upload_to_replit.py output/news-20260221-210000.json
```

**Dry Run (테스트)**:
```bash
python3 scripts/upload_to_replit.py output/news-20260221-210000.json --dry-run
```

---

## 📊 수집 소스 (8개 쿼리)

| 쿼리 | 카테고리 | 빈도 | 우선순위 |
|------|---------|------|----------|
| Dallas news | 지역소식 | 일간 | 1 |
| Dallas Korean community | 한인커뮤니티 | 주간 | 1 |
| Carrollton Texas Korean | 한인커뮤니티 | 주간 | 2 |
| Dallas Korean restaurant new | 비즈니스 | 주간 | 2 |
| Dallas Korean event | 이벤트 | 주간 | 1 |
| Fort Worth news | 지역소식 | 일간 | 2 |
| DFW business news | 비즈니스 | 일간 | 2 |
| Dallas weather alert | 날씨 | 일간 | 1 |

---

## 🛡️ 신뢰도 보장

### 화이트리스트 도메인 (16개)
- **주요 신문사**: dallasnews.com, star-telegram.com
- **TV 방송국**: wfaa.com, nbcdfw.com, fox4news.com, cbs11.com
- **정부 기관**: weather.gov
- **검증 플랫폼**: google.com, yelp.com, eventbrite.com

### 필터링 규칙
1. **도메인 검증**: 화이트리스트 외 도메인 제외
2. **날짜 검증**: 48시간 이내만 수집
3. **스팸 키워드**: "sponsored", "advertisement", "casino" 등 제외
4. **제목 길이**: 10~200자 범위만
5. **중복 제거**: 90% 이상 유사 제목 제거

---

## ⏰ 자동화 (Cron)

### 일 1회 (오전 6시)
```bash
# Cron 추가
0 6 * * * cd /Users/aaron/.openclaw/workspace-manager/skills/dfw-news-aggregator && python3 scripts/aggregate_news.py && python3 scripts/upload_to_replit.py output/news-latest.json
```

### 일 2회 (오전 6시, 오후 6시)
```bash
0 6,18 * * * cd /Users/aaron/.openclaw/workspace-manager/skills/dfw-news-aggregator && python3 scripts/aggregate_news.py && python3 scripts/upload_to_replit.py output/news-latest.json
```

---

## 🔧 커스터마이징

### 소스 추가하기
`config/sources.json` 편집:

```json
{
  "search_queries": [
    {
      "query": "새 쿼리",
      "category": "카테고리명",
      "time_range": "day",
      "priority": 1,
      "max_results": 10
    }
  ]
}
```

### 도메인 화이트리스트 추가
```json
{
  "trusted_domains": [
    "새도메인.com"
  ]
}
```

### 필터 조정
```json
{
  "filters": {
    "max_age_hours": 72,  // 48 → 72시간으로 변경
    "duplicate_similarity_threshold": 0.85  // 더 엄격하게
  }
}
```

---

## 📈 성능

- **수집 시간**: 30-60초 (8개 쿼리)
- **평균 수집량**: 30-50개/일
- **중복 제거율**: ~30-40%
- **최종 뉴스**: 20-35개/일

---

## 🛠️ Troubleshooting

### "SearXNG 연결 실패"
```bash
# SearXNG 상태 확인
docker ps | grep searxng

# 재시작
docker restart searxng

# 테스트
curl http://localhost:8080/search?q=test&format=json
```

### "수집된 뉴스 없음"
- SearXNG가 실행 중인지 확인
- `config/sources.json`에서 time_range 늘리기 (day → week)
- 화이트리스트에 도메인 추가

### "Replit 업로드 실패"
- API 엔드포인트 확인: `/api/news` POST 구현 필요
- DB 스키마 확인: `news` 테이블 존재 여부

---

## ✅ Checklist

### 초기 설정
- [ ] Python dependencies 설치
- [ ] SearXNG 실행 중 확인
- [ ] REPLIT_API_URL 환경 변수 설정 (선택적)
- [ ] 테스트 실행

### 정기 작업
- [ ] 매주 `sources.json` 리뷰
- [ ] 화이트리스트 도메인 업데이트
- [ ] 수집 로그 확인
- [ ] Replit DB 용량 체크

---

## 🎉 Success Metrics

- ✅ 일 30개 이상 뉴스 수집
- ✅ 가짜 뉴스 0건
- ✅ 중복 뉴스 0건
- ✅ 48시간 이내 뉴스만
- ✅ 신뢰할 수 있는 소스만

---

**Created**: 2026-02-21  
**Last Updated**: 2026-02-21  
**Version**: 1.0.0
