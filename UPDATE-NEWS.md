# 최신 뉴스 업데이트 가이드

## 🚀 빠른 실행

Replit Shell에서:

```bash
npx tsx scripts/import-latest-news.ts
```

## 📰 업데이트 내용

**기존**: 2024년 5월 Seed 데이터 (4개)
**신규**: 2026년 2월 21-22일 최신 뉴스 (15개)

### 카테고리별
- 지역소식: 10개
- 한인커뮤니티: 3개
- 비즈니스: 1개
- 날씨: 1개

### 주요 뉴스
1. **Dallas City Hall 수리비 $1B 초과**
2. **Cowboys, Javonte Williams 3년 $24M 재계약**
3. **텍사스 BBQ 문화, 한국에서 폭발적 인기**
4. **K-pop, 노스 텍사스에서 확장 중**
5. **Dallas vs New Delhi 비교 논란**

## ✅ 완료 확인

1. Shell에서 스크립트 실행
2. "✅ 최신 뉴스 임포트 완료!" 메시지 확인
3. https://dalconnect.replit.app/news 접속
4. 2026년 최신 뉴스 표시 확인!

## 🔄 정기 업데이트

매일 새 뉴스 수집:

```bash
cd skills/dfw-news-aggregator
python3 scripts/aggregate_news.py
```

→ output/news-*.json 파일 생성됨
→ import-latest-news.ts 파일 업데이트
→ 다시 실행

---

**Created**: 2026-02-21  
**Last Updated**: 2026-02-21
