# 🚀 DFW News Aggregator - Quick Start

**신뢰할 수 있는 DFW 한인 커뮤니티 뉴스 자동 수집**

---

## ⚡ 1분 실행

### 뉴스 수집
```bash
cd /Users/aaron/.openclaw/workspace-manager/skills/dfw-news-aggregator
python3 scripts/aggregate_news.py
```

### Replit 업로드
```bash
python3 scripts/upload_to_replit.py output/news-*.json
```

---

## 🛡️ 신뢰도 보장

✅ **화이트리스트 도메인만** (Dallas Morning News, Star-Telegram, NBC 등)  
✅ **48시간 이내 뉴스만** (오래된 뉴스 자동 제외)  
✅ **중복 자동 제거** (90% 유사 제목 제거)  
✅ **가짜 뉴스 필터링** (스팸 키워드 차단)

---

## 📊 수집 범위

- 🏙️ **지역소식**: Dallas/Fort Worth 로컬 뉴스
- 🇰🇷 **한인커뮤니티**: Dallas Korean community 관련
- 💼 **비즈니스**: 새 한인 업체, 비즈니스 뉴스
- 🎉 **이벤트**: K-pop, 한인 축제, 모임
- ☀️ **날씨**: Dallas 날씨 경보

**예상 수집량**: 일 30-50개 → 중복 제거 후 20-35개

---

## ⏰ 자동화

### Cron (매일 오전 6시)
```bash
0 6 * * * cd /Users/aaron/.openclaw/workspace-manager/skills/dfw-news-aggregator && python3 scripts/aggregate_news.py
```

---

## 🔧 설정

**소스 추가/변경**: `config/sources.json` 편집  
**화이트리스트 도메인**: `config/sources.json` → `trusted_domains`  
**필터 조정**: `config/sources.json` → `filters`

---

## 📚 자세한 가이드

전체 문서: `SKILL.md`

---

**Created**: 2026-02-21  
**Status**: ✅ Ready to use
