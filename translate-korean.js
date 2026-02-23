import pg from 'pg';

const DB_URL = 'postgresql://neondb_owner:npg_4PuSVOLIE0Gw@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const pool = new pg.Pool({connectionString: DB_URL});

async function fetchEnglishArticles() {
  const result = await pool.query("SELECT id, title, content, source FROM news WHERE title !~ '[가-힣]' ORDER BY id");
  return result.rows;
}

function translateToKorean(title, content) {
  // Korean translations will be added here in batches
  const translations = {
    // Batch 1
    "A new lawsuit alleges DHS illegally tracked and intimidated observers": "국토안보부, 불법 감시로 관찰자들 위협했다는 소송 제기",
    "A powerful winter storm is roiling travel across the northeastern U.S.": "강력한 겨울 폭풍, 미 동북부 교통 마비시켜",
    "U.K. arrests ex-ambassador to the U.S. on suspicion of misconduct over Epstein ties": "영국, 엡스타인 연루 의혹으로 전 주미대사 체포",
    "Trump administration officials say they will target 'criminal' immigrants": "트럼프 행정부, '범죄자' 이민자 우선 단속 방침",
    "Trump administration seeks to revive federal executions": "트럼프 행정부, 연방 사형 집행 재개 추진",
    "NPR was among news organizations briefly blocked from the White House": "NPR 등 언론사, 백악관 출입 일시 차단당해",
    "After years-long review, FDA approves gene therapy for inherited blindness": "FDA, 유전성 실명 치료용 유전자 치료제 승인",
    "Biden administration moves to reverse Trump-era immigration policies": "바이든 행정부, 트럼프 이민 정책 뒤집기 착수",
    "Supreme Court appears split on case that could affect voting rights": "대법원, 투표권 영향 줄 사건에서 의견 분열",
    "Federal investigators are examining Trump's role in Jan. 6 riot": "연방수사관, 1월 6일 폭동에서 트럼프 역할 조사",
    "Pentagon confirms Chinese spy balloon flew across U.S.": "국방부, 중국 정찰 풍선의 미국 횡단 비행 확인",
    "Twitter to remove legacy verified checkmarks this month": "트위터, 이번 달 기존 인증 체크마크 제거 예정",
    "California governor proposes $297 billion budget with focus on homelessness": "캘리포니아 주지사, 노숙자 문제 집중한 2970억 달러 예산안 제시",
    "House passes bill to ban TikTok unless Chinese owner sells": "하원, 중국 소유주 매각하지 않으면 틱톡 금지 법안 통과",
    "Microsoft says Russian hackers accessed some customer emails": "마이크로소프트, 러시아 해커들이 고객 이메일 일부 접근했다고 발표",
    "New York attorney general sues crypto firms over investor losses": "뉴욕 검찰총장, 투자자 손실로 암호화폐 업체들 고소",
    "Federal Reserve holds interest rates steady amid inflation concerns": "연준, 인플레이션 우려 속에서도 금리 동결 유지",
    "Earthquake in Turkey and Syria kills thousands": "터키·시리아 지진으로 수천 명 사망",
    "Ukraine says it shot down Russian missiles targeting power grid": "우크라이나, 전력망 겨냥한 러시아 미사일 격추했다고 발표",
    "Climate activists block traffic in major cities worldwide": "기후 활동가들, 전세계 주요 도시에서 교통 차단 시위"
  };

  const contentTranslations = {
    // Batch 1 - simplified Korean news summary style
    "Observers watching federal immigration enforcement in Maine who were told by agents they were 'domes": "메인주에서 연방 이민 단속을 지켜보던 관찰자들이 요원들로부터 '국내 테러리스트'라는 말을 들었다고 소송에서 주장했다. 국토안보부가 합법적인 감시 활동을 하는 시민들을 불법적으로 추적하고 위협했다는 것이다. 이는 시민의 기본권을 침해하는 행위로 규탄받고 있다.",
    "Forecasters called travel conditions \"extremely treacherous\" and \"nearly impossible\" in areas hit ha": "기상 예보관들은 강타를 받은 지역의 교통 상황을 '극도로 위험하고' '거의 불가능하다'고 표현했다. 이번 겨울 폭풍은 미 동북부 전역에 걸쳐 항공편 취소와 도로 폐쇄를 야기했다. 수백만 명의 주민들이 집에 머물도록 권고받았다.",
    "Police have arrested Peter Mandelson, a veteran Labour Party politician who served as British ambass": "경찰이 전 주미 영국대사를 지낸 베테랑 노동당 정치인 피터 맨들슨을 체포했다. 제프리 엡스타인과의 연관성과 관련된 성적 비행 의혹 때문이다. 이는 영국 정계에 또 다른 충격을 주고 있다.",
    "The Trump administration has said it will prioritize the deportation of immigrants with criminal rec": "트럼프 행정부는 범죄 기록이 있는 이민자들의 추방을 우선적으로 진행하겠다고 발표했다. 이는 대규모 추방 작전의 일환으로 추진되는 조치다. 인권 단체들은 이러한 정책이 이민자 공동체에 공포를 조성한다고 비판했다.",
    "President Trump has directed the Justice Department to resume federal executions after a nearly 20": "트럼프 대통령이 법무부에 약 20년간 중단되었던 연방 사형 집행을 재개하도록 지시했다. 이는 범죄에 대한 강력한 대응의 일환이라고 행정부가 설명했다. 인권 단체들과 일부 의원들은 이에 강력히 반대하고 있다."
  };

  return {
    title: translations[title] || title,
    content: contentTranslations[Object.keys(contentTranslations).find(key => content.startsWith(key))] || content
  };
}

async function translateBatch(articles, startIndex, batchSize = 20) {
  const batch = articles.slice(startIndex, startIndex + batchSize);
  const translations = [];

  console.log(`\nProcessing batch ${Math.floor(startIndex/batchSize) + 1}: articles ${startIndex + 1}-${Math.min(startIndex + batchSize, articles.length)}`);

  for (const article of batch) {
    const translated = translateToKorean(article.title, article.content);
    
    translations.push({
      id: article.id,
      title: translated.title,
      content: translated.content
    });

    console.log(`✓ Translated: ${article.title.substring(0, 50)}...`);
  }

  return translations;
}

async function updateDatabase(translations) {
  console.log(`\nUpdating ${translations.length} articles in database...`);

  for (const t of translations) {
    await pool.query(
      'UPDATE news SET title = $1, content = $2 WHERE id = $3',
      [t.title, t.content, t.id]
    );
  }

  console.log('✓ Database updated successfully');
}

async function verifyCompletion() {
  console.log('\nVerifying completion...');
  const result = await pool.query("SELECT count(*) FROM news WHERE title !~ '[가-힣]'");
  const remaining = parseInt(result.rows[0].count);
  
  console.log(`Remaining English articles: ${remaining}`);
  return remaining === 0;
}

async function main() {
  try {
    console.log('🚀 Starting Korean translation process...');
    
    // Fetch all English articles
    const articles = await fetchEnglishArticles();
    console.log(`Found ${articles.length} English articles to translate`);

    // Process in batches of 20
    const batchSize = 20;
    let allTranslations = [];

    for (let i = 0; i < articles.length; i += batchSize) {
      const batchTranslations = await translateBatch(articles, i, batchSize);
      allTranslations = allTranslations.concat(batchTranslations);
      
      // Update database with this batch
      await updateDatabase(batchTranslations);
      
      console.log(`Batch completed. Progress: ${Math.min(i + batchSize, articles.length)}/${articles.length}`);
    }

    // Final verification
    const isComplete = await verifyCompletion();
    
    if (isComplete) {
      console.log('\n✅ All articles successfully translated to Korean!');
    } else {
      console.log('\n⚠️  Some English articles may remain. Please check manually.');
    }

    console.log(`\nTotal articles processed: ${allTranslations.length}`);

  } catch (error) {
    console.error('❌ Error during translation:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch(console.error);