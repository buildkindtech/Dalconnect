# DalConnect Automation Schedule

100% 자동 운영을 위한 Cron job 스케줄.

## Daily Tasks

### 2:00 AM - SEO Sitemap Regeneration
```bash
cd /Users/aaron/.openclaw/workspace-manager/skills/seo-automator
tsx generate-sitemap.ts
```
**Purpose**: 새 비즈니스/뉴스 추가 시 sitemap 업데이트

### 3:00 AM - Content Re-moderation
```bash
cd /Users/aaron/.openclaw/workspace-manager/skills/content-moderator
tsx recheck-content.ts
```
**Purpose**: 정책 업데이트 시 기존 콘텐츠 재검사

### 6:00 AM - Google Maps Scraping
```bash
cd /Users/aaron/.openclaw/workspace-manager/skills/google-maps-scraper
tsx scrape-businesses.ts
```
**Purpose**: 새로운 한인 비즈니스 자동 발견

### 6:00 AM - Google Ads Performance Check
```bash
cd /Users/aaron/.openclaw/workspace-manager/skills/ad-optimizer
tsx fetch-performance.ts && tsx optimize-bids.ts
```
**Purpose**: 어제 광고 성과 분석 + 자동 최적화

### 8:00 AM - News Import
```bash
cd /Users/aaron/.openclaw/workspace-manager/projects/dalconnect
tsx scripts/import-latest-news-with-images.ts
```
**Purpose**: 한국 뉴스 최신 기사 수집

## Weekly Tasks

### Monday 9:00 AM - Weekly Digest
```bash
cd /Users/aaron/.openclaw/workspace-manager/skills/social-autoposter
tsx generate-digest.ts && tsx send-newsletter.ts && tsx post-to-facebook.ts
```
**Purpose**: 주간 뉴스레터 + 소셜 미디어 포스팅

### Monday 9:00 AM - Google Ads Weekly Report
```bash
cd /Users/aaron/.openclaw/workspace-manager/skills/ad-optimizer
tsx weekly-report.ts
```
**Purpose**: 주간 광고 성과 리포트

### Monday 10:00 AM - SEO Weekly Report
```bash
cd /Users/aaron/.openclaw/workspace-manager/skills/seo-automator
tsx weekly-report.ts
```
**Purpose**: Google Search Console 주간 리포트

## Monthly Tasks

### 1st of Month 10:00 AM - Monthly Review
```bash
cd /Users/aaron/.openclaw/workspace-manager/projects/dalconnect
tsx scripts/monthly-review.ts
```
**Purpose**: 
- 전체 매출 집계
- ROI 계산
- 성장률 분석
- 다음 달 목표 설정

## OpenClaw Cron Commands

```bash
# Daily: Google Maps Scraping (6:00 AM CST)
cron add \
  --name="DalConnect: Daily Business Scraping" \
  --schedule='{"kind":"cron","expr":"0 6 * * *","tz":"America/Chicago"}' \
  --payload='{"kind":"systemEvent","text":"Run Google Maps scraper for DalConnect"}' \
  --sessionTarget=isolated

# Daily: Google Ads Optimization (6:00 AM CST)
cron add \
  --name="DalConnect: Daily Ad Optimization" \
  --schedule='{"kind":"cron","expr":"0 6 * * *","tz":"America/Chicago"}' \
  --payload='{"kind":"systemEvent","text":"Run Google Ads performance check and optimization"}' \
  --sessionTarget=isolated

# Daily: SEO Sitemap (2:00 AM CST)
cron add \
  --name="DalConnect: Daily Sitemap Update" \
  --schedule='{"kind":"cron","expr":"0 2 * * *","tz":"America/Chicago"}' \
  --payload='{"kind":"systemEvent","text":"Regenerate DalConnect sitemap"}' \
  --sessionTarget=isolated

# Weekly: Newsletter (Mon 9:00 AM CST)
cron add \
  --name="DalConnect: Weekly Newsletter" \
  --schedule='{"kind":"cron","expr":"0 9 * * 1","tz":"America/Chicago"}' \
  --payload='{"kind":"systemEvent","text":"Generate and send DalConnect weekly digest"}' \
  --sessionTarget=isolated

# Monthly: Review (1st 10:00 AM CST)
cron add \
  --name="DalConnect: Monthly Review" \
  --schedule='{"kind":"cron","expr":"0 10 1 * *","tz":"America/Chicago"}' \
  --payload='{"kind":"systemEvent","text":"Generate DalConnect monthly review report"}' \
  --sessionTarget=isolated
```

## Monitoring

### Health Checks
```bash
# Check if all services running
curl https://dalconnect.com/api/health

# Check database connection
curl https://dalconnect.com/api/health/db

# Check external APIs
curl https://dalconnect.com/api/health/external
```

### Alerts
- Email alert if cron job fails
- Telegram notification for critical errors
- Weekly summary of all automation runs

## Logs

All automation logs stored in:
- `logs/scraper-YYYY-MM-DD.log`
- `logs/moderator-YYYY-MM-DD.log`
- `logs/seo-YYYY-MM-DD.log`
- `logs/ads-YYYY-MM-DD.log`
- `logs/social-YYYY-MM-DD.log`

## Manual Override

Disable automation:
```bash
# Disable all cron jobs
cron list | grep DalConnect | xargs -I {} cron remove --jobId={}

# Disable specific job
cron remove --jobId=<job-id>
```

Enable automation:
```bash
# Re-enable (re-run setup commands above)
```

## Estimated Costs

- **Google Maps API**: $10/month (500 businesses/day = 15K/month)
- **OpenAI Moderation**: $0 (free)
- **Google Vision API**: $5/month (~3K images)
- **SendGrid**: $15/month (<1K subscribers)
- **Google Ads**: $200/month (fixed budget)
- **Vercel**: $0 (Hobby plan)
- **Neon PostgreSQL**: $0 (Free tier)

**Total: $230/month**

## Revenue Target

Month 1: $150 (3 paid listings × $50)
Month 3: $1,275 (25 listings + 5 ads)
Month 6: $4,505 (90 listings + 15 ads)
Month 12: $9,880 (target met)

## ROI Timeline

- **Breakeven**: Month 2 ($230 cost vs $450 revenue)
- **Profitable**: Month 3+ (5.5x ROI by month 12)
