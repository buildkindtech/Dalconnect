import * as dotenv from "dotenv";
import pg from "pg";
import axios from "axios";

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL not found!");
  process.exit(1);
}

const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

interface NewsItem {
  id: string;
  title: string;
  url: string;
  published_date: string;
  source: string;
  created_at: string;
}

async function verifyURL(url: string): Promise<{ valid: boolean; status?: number; error?: string }> {
  try {
    const response = await axios.head(url, { 
      timeout: 5000,
      validateStatus: (status) => status < 500 // Accept redirects
    });
    return { valid: response.status < 400, status: response.status };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

function isOldNews(publishedDate: string | null): boolean {
  if (!publishedDate) return true;
  
  const newsDate = new Date(publishedDate);
  const now = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(now.getMonth() - 6);
  
  return newsDate < sixMonthsAgo;
}

async function main() {
  console.log("🔍 뉴스 검증 시작...\n");
  
  // 모든 뉴스 가져오기
  const result = await pool.query("SELECT * FROM news ORDER BY published_date DESC");
  const newsItems: NewsItem[] = result.rows;
  
  console.log(`📰 총 ${newsItems.length}개 뉴스 발견\n`);
  
  const toDelete: string[] = [];
  const validNews: NewsItem[] = [];
  
  for (const news of newsItems) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📄 ${news.title}`);
    console.log(`🔗 ${news.url}`);
    console.log(`📅 발행일: ${news.published_date || 'N/A'}`);
    console.log(`📰 출처: ${news.source || 'N/A'}`);
    
    // 날짜 확인
    const isOld = isOldNews(news.published_date);
    if (isOld) {
      console.log(`❌ 오래된 뉴스 (6개월 이상) - 삭제 대상`);
      toDelete.push(news.id);
      continue;
    }
    
    // URL 검증
    console.log(`🔄 URL 검증 중...`);
    const urlCheck = await verifyURL(news.url);
    
    if (!urlCheck.valid) {
      console.log(`❌ 유효하지 않은 URL (${urlCheck.error || urlCheck.status}) - 삭제 대상`);
      toDelete.push(news.id);
      continue;
    }
    
    console.log(`✅ 유효한 뉴스 (Status: ${urlCheck.status})`);
    validNews.push(news);
  }
  
  console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 검증 결과:`);
  console.log(`   ✅ 유효한 뉴스: ${validNews.length}개`);
  console.log(`   ❌ 삭제 대상: ${toDelete.length}개`);
  
  if (toDelete.length > 0) {
    console.log(`\n🗑️  삭제할 뉴스 ID:`);
    toDelete.forEach(id => console.log(`   - ${id}`));
    
    console.log(`\n❓ 삭제를 진행하시겠습니까? (자동으로 5초 후 실행)`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    for (const id of toDelete) {
      await pool.query("DELETE FROM news WHERE id = $1", [id]);
      console.log(`   ✅ 삭제 완료: ${id}`);
    }
    
    console.log(`\n✅ ${toDelete.length}개 뉴스 삭제 완료!`);
  } else {
    console.log(`\n✅ 모든 뉴스가 유효합니다!`);
  }
  
  await pool.end();
}

main().catch(console.error);
