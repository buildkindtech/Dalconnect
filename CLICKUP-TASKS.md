# DalConnect Setup Tasks (ClickUp)

ClickUp List: **DFW Korean Directory** (901325690153)

---

## 1. 🔑 Add Environment Variables to Vercel
**Priority**: Urgent (P1)
**Status**: To Do

### Description:
Vercel Dashboard → Settings → Environment Variables

Add:
- `STRIPE_SECRET_KEY`
- `GOOGLE_MAPS_API_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_VISION_API_KEY`
- `SENDGRID_API_KEY`
- `FACEBOOK_PAGE_ID`
- `FACEBOOK_ACCESS_TOKEN`

### Time: 15 minutes

---

## 2. 🔧 Setup Cron Jobs (Daily/Weekly)
**Priority**: Urgent (P1)
**Status**: To Do

### Description:
Run these commands in OpenClaw CLI:

```bash
# Daily Business Scraping (6 AM)
cron add --name="DalConnect: Daily Scraping" --schedule='{"kind":"cron","expr":"0 6 * * *","tz":"America/Chicago"}' --payload='{"kind":"systemEvent","text":"Run Google Maps scraper"}' --sessionTarget=isolated

# Daily Ad Optimization (6 AM)
cron add --name="DalConnect: Ad Optimization" --schedule='{"kind":"cron","expr":"0 6 * * *","tz":"America/Chicago"}' --payload='{"kind":"systemEvent","text":"Run ad optimizer"}' --sessionTarget=isolated

# Weekly Newsletter (Mon 9 AM)
cron add --name="DalConnect: Weekly Newsletter" --schedule='{"kind":"cron","expr":"0 9 * * 1","tz":"America/Chicago"}' --payload='{"kind":"systemEvent","text":"Send weekly digest"}' --sessionTarget=isolated
```

See: `projects/dalconnect/AUTOMATION.md`

### Time: 5 minutes

---

## 3. 🌱 Initial Data Seed (500 Korean Businesses)
**Priority**: High (P2)
**Status**: To Do

### Description:
```bash
cd skills/google-maps-scraper
tsx scrape-businesses.ts --dry-run  # Test first
tsx scrape-businesses.ts            # Run live
```

Expected: 500 DFW Korean businesses added to database

### Time: 10 minutes (script runs automatically)

---

## 4. 📣 Create Google Ads Campaign
**Priority**: High (P2)
**Status**: To Do

### Description:
1. Go to https://ads.google.com
2. Create new campaign
3. Budget: $200/month
4. Target: Dallas-Fort Worth metro area
5. Keywords:
   - korean restaurant dallas
   - korean bbq dallas
   - korean hair salon dallas
   - korean grocery dfw
   - korean church dallas

See: `skills/ad-optimizer/SKILL.md`

### Time: 30 minutes

---

## 5. 📊 Setup Google Search Console
**Priority**: Normal (P3)
**Status**: To Do

### Description:
1. Go to https://search.google.com/search-console
2. Add property: `dalconnect-git-main-info-4733927s-projects.vercel.app`
3. Verify ownership (HTML tag method)
4. Submit sitemap: `/sitemap.xml`
5. Get API credentials for automation

See: `skills/seo-automator/SKILL.md`

### Time: 20 minutes

---

## Total Setup Time: ~1 hour 20 minutes

After these 5 tasks, DalConnect runs 100% automatically! 🎉
