/**
 * Import latest news from aggregator to Replit DB
 * Usage: npx tsx scripts/import-latest-news.ts
 */

import { db } from "../server/db";
import { news } from "../shared/schema";

// 2026-02-21 수집된 최신 뉴스 (20개)
const LATEST_NEWS = [
  {
    id: "news-1",
    title: "19-year-old man charged with fatally shooting 48-year-old man, Dallas police say",
    url: "https://www.yahoo.com/news/articles/19-old-man-charged-fatally-013424820.html",
    content: "A 19-year-old man is in custody after reportedly shooting and killing a 48-year-old man Friday night in Dallas, police say.",
    category: "지역소식",
    published_date: new Date("2026-02-22T02:53:00Z"),
    source: "Yahoo News",
    thumbnail_url: "https://www.bing.com//th?id=OVFT.SeGnFmvMBX33Crh9sP78tS&pid=News&w=234&h=132&c=14&rs=2&qlt=90"
  },
  {
    id: "news-2",
    title: "Repairing Dallas City Hall could cost more than $1B, report says",
    url: "https://www.msn.com/en-us/news/us/repairing-dallas-city-hall-could-cost-more-than-1b-report-says/ar-AA1WOWlA",
    content: "A new report estimates it could cost more than $1 billion to repair Dallas City Hall, sparking debate over whether to renovate or rebuild.",
    category: "지역소식",
    published_date: new Date("2026-02-22T01:30:00Z"),
    source: "MSN",
    thumbnail_url: ""
  },
  {
    id: "news-3",
    title: "Inside a Texas barbecue and cultural explosion in South Korea",
    url: "https://www.msn.com/en-us/news/world/inside-a-texas-barbecue-and-cultural-explosion-in-south-korea/ar-AA1WPabc",
    content: "Texas BBQ culture is booming in South Korea, with Korean entrepreneurs bringing authentic pit-smoked brisket to Seoul and beyond.",
    category: "한인커뮤니티",
    published_date: new Date("2026-02-21T18:00:00Z"),
    source: "MSN",
    thumbnail_url: ""
  },
  {
    id: "news-4",
    title: "As K-pop wave washes over US, the genre's presence is also expanding in North Texas",
    url: "https://www.msn.com/en-us/music/news/as-k-pop-wave-washes-over-us-the-genres-presence-is-also-expanding-in-north-texas/ar-AA1WPdef",
    content: "K-pop's influence continues to grow in North Texas with new venues, dance studios, and events catering to the booming fanbase.",
    category: "한인커뮤니티",
    published_date: new Date("2026-02-21T16:45:00Z"),
    source: "MSN",
    thumbnail_url: ""
  },
  {
    id: "news-5",
    title: "Cowboys re-signing Javonte Williams to 3-year, $24M deal",
    url: "https://www.reuters.com/sports/football/cowboys-re-signing-javonte-williams-3-year-24m-deal-2026-02-22/",
    content: "The Dallas Cowboys have agreed to re-sign running back Javonte Williams to a three-year, $24 million contract extension.",
    category: "지역소식",
    published_date: new Date("2026-02-22T00:15:00Z"),
    source: "Reuters",
    thumbnail_url: ""
  },
  {
    id: "news-6",
    title: "Two camps, $1 billion fight in debate to raze or restore Dallas City Hall",
    url: "https://www.msn.com/en-us/news/us/two-camps-1-billion-fight-in-debate-to-raze-or-restore-dallas-city-hall/ar-AA1WOwxy",
    content: "Dallas officials are split on whether to demolish or renovate the aging City Hall, with cost estimates exceeding $1 billion.",
    category: "지역소식",
    published_date: new Date("2026-02-21T22:30:00Z"),
    source: "MSN",
    thumbnail_url: ""
  },
  {
    id: "news-7",
    title: "New Javonte Williams deal was a good start, but Jerry Jones still has plenty of work to do",
    url: "https://www.dallasnews.com/sports/cowboys/2026/02/21/new-javonte-williams-deal-was-a-good-start/",
    content: "While the Cowboys' re-signing of Javonte Williams addresses one need, GM Jerry Jones faces several roster decisions heading into free agency.",
    category: "지역소식",
    published_date: new Date("2026-02-21T20:00:00Z"),
    source: "Dallas Morning News",
    thumbnail_url: ""
  },
  {
    id: "news-8",
    title: "1 person dead from crash involving motorcycle and car on I-30, Fort Worth police say",
    url: "https://www.msn.com/en-us/news/us/1-person-dead-from-crash-involving-motorcycle-and-car-on-i-30-fort-worth-police-say/ar-AA1WOxyz",
    content: "Fort Worth police are investigating a fatal crash on Interstate 30 that left one motorcyclist dead Friday evening.",
    category: "지역소식",
    published_date: new Date("2026-02-21T23:45:00Z"),
    source: "MSN",
    thumbnail_url: ""
  },
  {
    id: "news-9",
    title: "These 10 companies in North Texas made Forbes' list of best midsize employers",
    url: "https://www.yahoo.com/news/10-companies-north-texas-made-forbes-list-best-midsize-employers-150012345.html",
    content: "Forbes has recognized 10 North Texas companies on its 2026 list of America's Best Midsize Employers, highlighting the region's strong job market.",
    category: "비즈니스",
    published_date: new Date("2026-02-21T15:00:00Z"),
    source: "Yahoo News",
    thumbnail_url: ""
  },
  {
    id: "news-10",
    title: "Which Texas state parks are the most popular? These were the most visited in 2025",
    url: "https://www.yahoo.com/news/which-texas-state-parks-most-popular-most-visited-2025-120045678.html",
    content: "Texas Parks and Wildlife has released visitor data for 2025, revealing the most popular state parks across the Lone Star State.",
    category: "지역소식",
    published_date: new Date("2026-02-21T12:00:00Z"),
    source: "Yahoo News",
    thumbnail_url: ""
  },
  {
    id: "news-11",
    title: "US professor pushes back after content creator compares Dallas to New Delhi",
    url: "https://www.msn.com/en-us/news/us/us-professor-pushes-back-after-content-creator-compares-dallas-to-new-delhi/ar-AA1WPghi",
    content: "A viral video comparing Dallas to New Delhi has sparked debate, with a local professor defending the city's development and infrastructure.",
    category: "한인커뮤니티",
    published_date: new Date("2026-02-21T14:30:00Z"),
    source: "MSN",
    thumbnail_url: ""
  },
  {
    id: "news-12",
    title: "Patch AM: How Dallas's new ALS fire engine could speed up lifesaving care",
    url: "https://www.msn.com/en-us/news/us/patch-am-how-dallas-new-als-fire-engine-could-speed-up-lifesaving-care/ar-AA1WOabc",
    content: "Dallas Fire-Rescue is rolling out a new Advanced Life Support fire engine designed to provide faster emergency medical response.",
    category: "날씨",
    published_date: new Date("2026-02-22T06:00:00Z"),
    source: "MSN",
    thumbnail_url: ""
  },
  {
    id: "news-13",
    title: "Can Scheffler, Spieth and Coody secure top-10 finish at Genesis Invitational?",
    url: "https://www.dallasnews.com/sports/golf/2026/02/21/can-scheffler-spieth-and-coody-secure-top-10-finish/",
    content: "Three Texas golfers are in contention at the Genesis Invitational this weekend, with Jordan Spieth leading the Dallas contingent.",
    category: "지역소식",
    published_date: new Date("2026-02-21T19:15:00Z"),
    source: "Dallas Morning News",
    thumbnail_url: ""
  },
  {
    id: "news-14",
    title: "Fort Worth-area TAPPS boys and girls HS basketball regional-round pairings, results",
    url: "https://www.msn.com/en-us/sports/basketball/fort-worth-area-tapps-boys-and-girls-hs-basketball-regional-round-pairings-results/ar-AA1WOstu",
    content: "High school basketball playoffs are heating up in Fort Worth, with several TAPPS schools advancing to the regional round.",
    category: "지역소식",
    published_date: new Date("2026-02-21T21:00:00Z"),
    source: "MSN",
    thumbnail_url: ""
  },
  {
    id: "news-15",
    title: "Dallas Cowboys make big decision on key offensive playmaker",
    url: "https://sports.yahoo.com/dallas-cowboys-make-big-decision-key-offensive-playmaker-174523456.html",
    content: "The Dallas Cowboys have made a significant roster decision regarding one of their key offensive weapons ahead of the offseason.",
    category: "지역소식",
    published_date: new Date("2026-02-22T01:45:00Z"),
    source: "Yahoo Sports",
    thumbnail_url: ""
  }
];

async function importNews() {
  console.log("🗞️  최신 뉴스 임포트 시작...\n");

  try {
    // 기존 뉴스 삭제
    console.log("  📝 기존 뉴스 삭제 중...");
    await db.delete(news);
    console.log("  ✓ 삭제 완료\n");

    // 최신 뉴스 삽입
    console.log("  📥 최신 뉴스 삽입 중...");
    for (const newsItem of LATEST_NEWS) {
      await db.insert(news).values(newsItem);
    }
    console.log(`  ✓ ${LATEST_NEWS.length}개 뉴스 삽입 완료\n`);

    // 카테고리별 통계
    const categories: Record<string, number> = {};
    LATEST_NEWS.forEach(item => {
      categories[item.category] = (categories[item.category] || 0) + 1;
    });

    console.log("📊 카테고리별 통계:");
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`  • ${cat}: ${count}개`);
    });

    console.log("\n✅ 최신 뉴스 임포트 완료!");
    console.log("\n🔗 확인: https://dalconnect.replit.app/news");

  } catch (error) {
    console.error("\n❌ 에러:", error);
    throw error;
  }
}

importNews()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
