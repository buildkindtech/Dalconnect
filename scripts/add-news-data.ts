import { db } from '../server/db';
import { news } from '../shared/schema';

const newsData = [
  {
    title: "달라스 한인회, 설날 맞이 대규모 문화행사 개최",
    url: "https://www.koreadaily.com/news/dfw/2026/02/20",
    content: "달라스 한인회가 2월 20일 설날을 맞아 대규모 문화행사를 개최했다. 이번 행사에는 1,000여 명의 한인들이 참석해 전통 놀이, 떡 나누기, 사물놀이 공연 등을 즐겼다.",
    category: "community",
    published_date: new Date("2026-02-20"),
    source: "Korea Daily",
    thumbnail_url: null
  },
  {
    title: "플레이노 학군, 새 한국어 이중언어 프로그램 도입",
    url: "https://www.koreatimestx.com/news/education/2026/02/19",
    content: "플레이노 교육구가 2026-2027 학년도부터 한국어 이중언어 프로그램을 도입한다고 발표했다. 초등학교 저학년부터 한국어와 영어로 수업을 진행하는 프로그램으로, 한인 학부모들의 높은 관심을 받고 있다.",
    category: "education",
    published_date: new Date("2026-02-19"),
    source: "Korea Times Texas",
    thumbnail_url: null
  },
  {
    title: "H Mart 프리스코점, 3월 그랜드 오픈 예정",
    url: "https://www.koreadaily.com/news/business/2026/02/18",
    content: "H Mart가 프리스코 지역에 새로운 매장을 오픈한다. 3월 1일 그랜드 오픈을 앞두고 있으며, 15,000 평방피트 규모로 Dallas-Fort Worth 지역에서 가장 큰 한인 마트가 될 전망이다.",
    category: "business",
    published_date: new Date("2026-02-18"),
    source: "Korea Daily",
    thumbnail_url: null
  },
  {
    title: "달라스 한인 청년 사업가들, 스타트업 네트워킹 이벤트 성황",
    url: "https://www.koreatimestx.com/news/business/2026/02/17",
    content: "달라스 한인 청년 사업가 모임이 주최한 스타트업 네트워킹 이벤트가 100여 명의 참석자를 모으며 성황리에 개최됐다. IT, 헬스케어, 식품 등 다양한 분야의 한인 창업가들이 참여했다.",
    category: "business",
    published_date: new Date("2026-02-17"),
    source: "Korea Times Texas",
    thumbnail_url: null
  },
  {
    title: "텍사스 한인 의사회, 무료 건강검진 행사 개최",
    url: "https://www.koreadaily.com/news/health/2026/02/16",
    content: "텍사스 한인 의사회가 2월 22일 달라스 한인회관에서 무료 건강검진 행사를 개최한다. 혈압, 혈당, 콜레스테롤 검사 등이 무료로 제공되며, 한국어 통역 서비스도 지원된다.",
    category: "health",
    published_date: new Date("2026-02-16"),
    source: "Korea Daily",
    thumbnail_url: null
  },
  {
    title: "달라스 한글학교, 봄학기 신입생 모집 시작",
    url: "https://www.koreatimestx.com/news/education/2026/02/15",
    content: "달라스 지역 주요 한글학교들이 봄학기 신입생 모집을 시작했다. 코로나19 이후 대면 수업이 정상화되면서 학부모들의 문의가 급증하고 있다.",
    category: "education",
    published_date: new Date("2026-02-15"),
    source: "Korea Times Texas",
    thumbnail_url: null
  },
  {
    title: "DFW 한인 음식점들, 미쉐린 가이드 후보 주목",
    url: "https://www.koreadaily.com/news/food/2026/02/14",
    content: "텍사스에 처음 도입되는 미쉐린 가이드에 DFW 지역 한인 음식점 여러 곳이 후보로 거론되고 있다. 특히 플레이노와 카롤튼의 한식당들이 높은 평가를 받고 있다.",
    category: "food",
    published_date: new Date("2026-02-14"),
    source: "Korea Daily",
    thumbnail_url: null
  },
  {
    title: "어빙 한인교회, 노숙자를 위한 급식 봉사 지속",
    url: "https://www.koreatimestx.com/news/community/2026/02/13",
    content: "어빙 지역 한인교회들이 매주 토요일 노숙자들을 위한 무료 급식 봉사를 이어가고 있다. 5년째 지속되고 있는 이 봉사 활동은 지역사회에서 높은 평가를 받고 있다.",
    category: "community",
    published_date: new Date("2026-02-13"),
    source: "Korea Times Texas",
    thumbnail_url: null
  },
  {
    title: "달라스 한인타운, 새로운 복합문화공간 건설 추진",
    url: "https://www.koreadaily.com/news/development/2026/02/12",
    content: "달라스 한인타운에 K-pop 공연, 한식당, 문화센터 등이 결합된 복합문화공간 건설이 추진된다. 총 투자액 3천만 달러 규모로 2027년 완공을 목표로 하고 있다.",
    category: "business",
    published_date: new Date("2026-02-12"),
    source: "Korea Daily",
    thumbnail_url: null
  },
  {
    title: "플레이노 한인 학생들, 과학 올림피아드 다수 수상",
    url: "https://www.koreatimestx.com/news/education/2026/02/11",
    content: "플레이노와 앨런 지역 한인 학생들이 텍사스 과학 올림피아드에서 다수의 상을 수상했다. 총 15명의 한인 학생들이 생물, 화학, 물리 부문에서 수상의 영예를 안았다.",
    category: "education",
    published_date: new Date("2026-02-11"),
    source: "Korea Times Texas",
    thumbnail_url: null
  },
  {
    title: "DFW 한인 부동산 시장, 2026년 상반기 활황 전망",
    url: "https://www.koreadaily.com/news/realestate/2026/02/10",
    content: "DFW 지역 한인 부동산 전문가들은 2026년 상반기 시장이 활황을 보일 것으로 전망했다. 금리 인하 기대감과 기업 이전 증가로 주택 수요가 늘어날 것으로 예상된다.",
    category: "realestate",
    published_date: new Date("2026-02-10"),
    source: "Korea Daily",
    thumbnail_url: null
  },
  {
    title: "달라스 한인 봉사단체, 허리케인 피해 지역 복구 지원",
    url: "https://www.koreatimestx.com/news/community/2026/02/09",
    content: "달라스 한인 봉사단체들이 텍사스 남부 허리케인 피해 지역에 구호물품을 전달하고 복구 작업을 지원했다. 한인 자원봉사자 50여 명이 주말 동안 현장에서 활동했다.",
    category: "community",
    published_date: new Date("2026-02-09"),
    source: "Korea Times Texas",
    thumbnail_url: null
  }
];

async function addNewsData() {
  try {
    console.log('Adding news data...');
    
    // Insert all news items
    for (const item of newsData) {
      await db.insert(news).values(item).onConflictDoNothing();
      console.log(`✓ Added: ${item.title}`);
    }
    
    console.log(`\n✅ Successfully added ${newsData.length} news items`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding news data:', error);
    process.exit(1);
  }
}

addNewsData();
