# DalConnect 크론잡 엔트리 (OpenClaw용)

## 뉴스 자동 수집 — 하루 3회 (8am, 2pm, 8pm CST)
```
0 8,14,20 * * * cd /Users/aaron/.openclaw/workspace-manager/projects/dalconnect && /opt/homebrew/bin/node scripts/auto-news-update.cjs >> /tmp/dalconnect-news.log 2>&1
```

## 차트 자동 업데이트 — 하루 1회 (9am CST)
```
0 9 * * * cd /Users/aaron/.openclaw/workspace-manager/projects/dalconnect && /opt/homebrew/bin/node scripts/auto-chart-update.cjs >> /tmp/dalconnect-charts.log 2>&1
```

## 만료된 딜 정리 — 하루 1회 (자정 CST)
```
0 0 * * * cd /Users/aaron/.openclaw/workspace-manager/projects/dalconnect && /opt/homebrew/bin/node -e "const pg=require('pg');const p=new pg.Pool({connectionString:'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require',max:1});p.query('DELETE FROM deals WHERE expires_at < NOW()').then(r=>{console.log(r.rowCount+' expired deals removed');p.end()});" >> /tmp/dalconnect-deals-cleanup.log 2>&1
```

## 참고
- node 경로 확인: `which node` (macOS Homebrew: `/opt/homebrew/bin/node`)
- OpenClaw 크론잡으로 등록하려면 `openclaw cron` 사용
- 현재 크론잡 미설정 — 스크립트는 수동 실행 중이었거나 별도 프로세스에서 실행
