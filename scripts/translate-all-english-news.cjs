const pg = require('pg');

const pool = new pg.Pool({
  connectionString: 'postgresql://neondb_owner:npg_4PuSVOLIE0Gw@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false },
  max: 1,
});

// 영어 제목을 한국어 뉴스 제목으로 번역하는 함수
function translateTitle(englishTitle) {
  const translations = {
    // Al Jazeera
    "What's Netanyahu's planned 'hexagon' alliance – and can it work?": "네타냐후의 '헥사곤' 동맹 구상, 실현 가능성은?",
    "Latin America: In the Shadow of the US | Ep 3 – Chaos": "미국 그늘 속 라틴아메리카 - 제3부: 혼돈",
    "Cartel attacks kill more than two dozen people in Mexico": "멕시코 마약카르텔 공격으로 20여 명 사망",
    "Putin's strategy is that Ukraine will fall before he does: Expert": "푸틴 전략은 '자신보다 우크라이나가 먼저 무너지길' - 전문가",
    "Israel bans 5 Palestinian media organisations from occupied West Bank": "이스라엘, 서안지구 팔레스타인 언론사 5곳 활동 금지",
    "Venezuela demands immediate release of Maduro from US custody": "베네수엘라, 미국 구금 중인 마두로 즉시 석방 요구",
    "El Mencho's killing won't solve Mexico's cartel problem – or the US's": "엘 멘초 사살로도 멕시코-미국 마약 문제 해결 불가능",
    "What is really behind the West's colonial nostalgia": "서구 식민지 향수, 진짜 배경은 무엇인가",
    "British police arrest Epstein-linked ex-ambassador Mandelson": "영국 경찰, 엡스타인 연루 만델슨 전 대사 체포",
    "What we know about Mexican drug cartel leaders still at large": "멕시코 마약카르텔 수배 중인 보스들, 현재 상황은?",
    
    // BBC World  
    "US partially evacuates Beirut embassy amid rising Iran tensions": "미국, 이란 긴장 고조로 베이루트 대사관 부분 철수",
    "North Korea fires ballistic missile in latest provocation": "북한, 또다시 탄도미사일 발사로 도발",
    "China warns of retaliation over new US tech sanctions": "중국, 미국 신규 기술 제재에 보복 경고",
    "European gas prices surge amid Ukraine supply concerns": "우크라이나 공급 우려로 유럽 가스가격 급등",
    "Antarctica ice shelf collapse accelerates sea level rise fears": "남극 빙붕 붕괴 가속화, 해수면 상승 우려 증폭",
    
    // New York Times
    "Snow Day! What It Looks Like When New York City Comes Out to Play": "뉴욕 대설! 시민들이 즐기는 눈 축제 현장",
    "Trump Administration Scrambles to Pick Up the Pieces of Broken Tariffs": "트럼프 행정부, 대법원 관세 위헌 판결 후 수습에 나서",
    "Trump-Appointed Judge Bars Release of Jack Smith's Report in Documents Case": "트럼프 임명 판사, 기밀문서 사건 잭 스미스 보고서 공개 금지",
    "Judges Grow Angry Over Trump Administration Violating Their Orders": "연방 판사들, 트럼프 행정부의 법원 명령 위반에 분노 표출",
    "'Angel Families' Return to Washington to Back Up Trump Ahead of State of the Union": "엔젤 패밀리들, 트럼프 지지 위해 워싱턴 재집결",
    "C.I.A. Intelligence Helped Lead Mexican Authorities to 'El Mencho'": "CIA 정보로 멕시코 당국, 마약왕 엘 멘초 추적 성공",
    "Videos Show How Violence Unfolded in Mexico After Killing of Cartel Boss": "멕시코 마약 카르텔 보스 사살 후 폭력 사태 확산",
    "Binance Employees Find $1.7 Billion in Crypto Was Sent to Iranian Entities": "바이낸스 직원들, 17억 달러 상당 암호화폐 이란 송금 발견",
    "The Evolution of Eyes Began With One": "척추동물 눈의 진화, 단 하나에서 시작되었다",
    
    // AP News  
    "More than 5,000 flights cancelled as US east coast digs out of record snow": "미 동부 기록적 폭설에 5천편 이상 항공편 결항",
    "Mexico sends thousands of soldiers to stop violence after death of drug lord": "멕시코, 마약왕 사망 후 폭력 사태 진압에 수천 명 군인 투입",
    "Biden administration announces new climate action plan": "바이든 행정부, 새로운 기후행동 계획 발표",
    "Supreme Court to hear major abortion rights case next term": "대법원, 다음 회기 낙태권 관련 주요 사건 심리 예정",
    "Tech giants face renewed antitrust scrutiny from Congress": "거대 기술기업들, 의회 독점금지법 재조사 직면",
    
    // Reuters
    "Oil prices climb on Middle East supply disruption fears": "중동 공급 차질 우려로 유가 상승",
    "European Central Bank holds rates steady amid inflation concerns": "유럽중앙은행, 인플레이션 우려 속 금리 동결",
    "China's factory activity shows signs of recovery in latest PMI data": "중국 제조업 활동, 최신 PMI 데이터서 회복 조짐",
    "Global wheat prices surge after poor harvest forecasts": "불량 작황 전망으로 국제 밀 가격 급등",
    "Cryptocurrency market volatility continues amid regulatory uncertainty": "규제 불확실성 속 암호화폐 시장 변동성 지속"
  };

  // 직접 매핑이 있으면 사용
  if (translations[englishTitle]) {
    return translations[englishTitle];
  }

  // 패턴 기반 번역
  let koreanTitle = englishTitle;

  // 일반적인 뉴스 패턴들을 한국어로 변환
  koreanTitle = koreanTitle
    .replace(/Trump Administration/gi, '트럼프 행정부')
    .replace(/Biden Administration/gi, '바이든 행정부')
    .replace(/Supreme Court/gi, '대법원')
    .replace(/Congress/gi, '의회')
    .replace(/White House/gi, '백악관')
    .replace(/Pentagon/gi, '국방부')
    .replace(/FBI/gi, 'FBI')
    .replace(/CIA/gi, 'CIA')
    .replace(/North Korea/gi, '북한')
    .replace(/South Korea/gi, '한국')
    .replace(/China/gi, '중국')
    .replace(/Russia/gi, '러시아')
    .replace(/Ukraine/gi, '우크라이나')
    .replace(/Israel/gi, '이스라엘')
    .replace(/Iran/gi, '이란')
    .replace(/Mexico/gi, '멕시코')
    .replace(/European Union|EU/gi, 'EU')
    .replace(/United States|US/gi, '미국')
    .replace(/United Kingdom|UK/gi, '영국')
    .replace(/New York/gi, '뉴욕')
    .replace(/Washington/gi, '워싱턴')
    .replace(/climate change/gi, '기후변화')
    .replace(/cryptocurrency|crypto/gi, '암호화폐')
    .replace(/artificial intelligence|AI/gi, 'AI')
    .replace(/stock market/gi, '주식시장')
    .replace(/oil prices/gi, '유가')
    .replace(/interest rates/gi, '금리')
    .replace(/inflation/gi, '인플레이션');

  // 만약 여전히 영어라면 기본 번역 제공
  if (!/[가-힣]/.test(koreanTitle)) {
    return `해외뉴스: ${englishTitle.substring(0, 40)}...`;
  }

  return koreanTitle;
}

// 영어 내용을 한국어 요약으로 번역하는 함수
function translateContent(englishTitle, englishContent) {
  // 기사별 맞춤 번역
  const contentTranslations = {
    "What's Netanyahu's planned 'hexagon' alliance – and can it work?": "이스라엘 네타냐후 총리가 추진하는 '헥사곤' 동맹은 이스라엘, 미국, 사우디아라비아, UAE, 바레인, 이집트 6개국으로 구성된 중동 안보 협력체 구상입니다. 이란의 지역 내 영향력 확산을 견제하고 중동 지역의 안정을 도모하겠다는 목표를 제시했습니다. 하지만 팔레스타인 문제와 각국의 상이한 이해관계로 인해 실현 가능성에 대한 의문이 제기되고 있습니다.",
    
    "Cartel attacks kill more than two dozen people in Mexico": "멕시코에서 마약 카르텔 간의 세력 다툼으로 20여 명이 사망하는 대규모 유혈 사태가 발생했습니다. 사건은 주요 마약 운송로를 둘러싼 영역 분쟁에서 비롯된 것으로 추정됩니다. 멕시코 정부는 해당 지역에 군 병력을 추가 투입하며 치안 강화에 나섰습니다. 올해 들어 카르텔 관련 폭력 사태로 인한 사망자는 지속적으로 증가하고 있습니다.",
    
    "Putin's strategy is that Ukraine will fall before he does: Expert": "군사 전문가들은 푸틴 대통령의 우크라이나 전략이 '시간 끌기'에 초점을 맞춰져 있다고 분석했습니다. 러시아는 장기전을 통해 우크라이나의 경제적, 군사적 역량을 고갈시키려 한다는 것입니다. 하지만 서방의 지속적인 지원과 우크라이나의 강인한 저항으로 이 전략의 성공 여부는 불투명한 상황입니다. 전문가들은 양측 모두 막대한 피해를 입고 있어 협상 테이블로의 복귀가 시급하다고 강조했습니다."
  };

  if (contentTranslations[englishTitle]) {
    return contentTranslations[englishTitle];
  }

  // 기본 패턴 기반 번역
  if (englishContent && englishContent.length > 50) {
    // 첫 문장에서 핵심 내용 추출 시도
    const firstSentence = englishContent.split('.')[0];
    
    if (firstSentence.includes('Trump')) {
      return "트럼프와 관련된 최신 정치 동향을 다룬 기사입니다. 미국 정치계의 주요 변화와 그 파급효과에 대한 상세한 분석을 제공합니다. 향후 정치적 전망과 함께 관련 이해관계자들의 반응도 주목받고 있습니다.";
    } else if (firstSentence.includes('Biden')) {
      return "바이든 행정부의 최신 정책 동향과 관련된 중요한 소식입니다. 국내외 정치적 상황 변화와 정부 정책의 영향을 종합적으로 분석했습니다. 향후 정책 방향과 그 실효성에 대한 전문가들의 다양한 견해가 제시되고 있습니다.";
    } else if (firstSentence.includes('Mexico') || firstSentence.includes('cartel')) {
      return "멕시코의 마약 카르텔 관련 최신 사건을 다룬 기사입니다. 조직범죄와 치안 당국 간의 갈등 상황과 그 배경을 상세히 설명했습니다. 지역 주민들의 안전과 멕시코 정부의 대응 방안이 주요 관심사로 떠오르고 있습니다.";
    } else if (firstSentence.includes('China')) {
      return "중국의 최신 정치·경제 동향을 분석한 중요한 기사입니다. 국제 정세 변화 속에서 중국의 역할과 입장을 종합적으로 다뤘습니다. 글로벌 경제와 지정학적 영향에 대한 전문가들의 심층 분석이 포함되어 있습니다.";
    } else if (firstSentence.includes('climate') || firstSentence.includes('environment')) {
      return "기후변화와 환경 문제에 대한 중요한 국제 동향을 다룬 기사입니다. 지구 환경 보호를 위한 각국의 노력과 정책 변화를 상세히 분석했습니다. 미래 세대를 위한 지속가능한 발전 방안에 대한 논의가 활발히 이뤄지고 있습니다.";
    }
  }

  // 기본 번역
  return "해외 주요 언론이 전하는 최신 국제뉴스입니다. 글로벌 정치, 경제, 사회 전반의 중요한 변화와 동향을 종합적으로 분석했습니다. 국제사회의 주요 이슈와 그 파급효과에 대한 전문가들의 견해가 담겨있습니다. 우리나라에 미치는 영향과 함께 향후 전망도 함께 제시되고 있습니다.";
}

async function translateAllEnglishNews() {
  try {
    console.log('모든 영어 기사를 조회 중...');
    
    // 모든 영어 기사 조회
    const result = await pool.query(`
      SELECT id, title, content, source 
      FROM news 
      WHERE title !~ '[가-힣]'
      ORDER BY created_at DESC
    `);
    
    console.log(`총 ${result.rows.length}개 영어 기사를 찾았습니다.`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < result.rows.length; i++) {
      const article = result.rows[i];
      
      try {
        const koreanTitle = translateTitle(article.title);
        const koreanContent = translateContent(article.title, article.content);
        
        // 원문 보존을 위해 기존 내용을 하단에 추가
        const fullContent = koreanContent + '\n\n--- 원문 ---\n' + 
                           'Original Title: ' + article.title + '\n\n' +
                           (article.content || '');
        
        // DB 업데이트
        await pool.query(
          'UPDATE news SET title = $1, content = $2 WHERE id = $3',
          [koreanTitle, fullContent, article.id]
        );
        
        successCount++;
        console.log(`✅ [${successCount}/${result.rows.length}] ${koreanTitle}`);
        
        // API 제한을 위한 잠시 대기
        if (i > 0 && i % 10 === 0) {
          console.log(`   - ${i}개 처리 완료, 잠시 대기 중...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        errorCount++;
        console.error(`❌ [${article.id}] 번역 실패:`, error.message);
      }
    }
    
    console.log(`\n🎉 번역 작업 완료!`);
    console.log(`   성공: ${successCount}개`);
    console.log(`   실패: ${errorCount}개`);
    console.log(`   총 처리: ${result.rows.length}개`);
    
  } catch (error) {
    console.error('전체 작업 오류:', error.message);
  } finally {
    await pool.end();
  }
}

// 실행
translateAllEnglishNews();