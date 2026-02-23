import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const newsData = [
  {
    title: "2025 달라스 한인회 설날 행사 성황리 개최",
    url: "https://dalconnect.buildkind.tech/news/lunar-new-year-2025",
    content: "달라스 한인회가 주최한 2025 설날 행사가 지난 주말 한인타운에서 성황리에 개최되었습니다. 1,500여 명의 한인들이 참석하여 전통 놀이, 음식, 공연을 즐겼습니다.",
    category: "Community",
    published_date: new Date('2025-02-01'),
    source: "DalConnect",
    thumbnail_url: "https://images.unsplash.com/photo-1519669011783-4eaa94aa202f?w=800&q=80"
  },
  {
    title: "플래노 한인 비즈니스 협회, 신규 회원 모집",
    url: "https://dalconnect.buildkind.tech/news/plano-business-association",
    content: "플래노 한인 비즈니스 협회(PKBA)가 2025년 신규 회원을 모집합니다. 협회는 한인 비즈니스 간 네트워킹과 협력을 도모하며, 매월 정기 모임을 개최합니다.",
    category: "Business",
    published_date: new Date('2025-01-28'),
    source: "DalConnect",
    thumbnail_url: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&q=80"
  },
  {
    title: "캐롤턴 한인타운 새 한식당 오픈 - '서울의 맛'",
    url: "https://dalconnect.buildkind.tech/news/seoul-taste-opening",
    content: "캐롤턴 한인타운에 정통 한식을 선보이는 '서울의 맛'이 오픈했습니다. 삼겹살, 김치찌개, 된장찌개 등 가정식 메뉴가 인기를 끌고 있습니다.",
    category: "Food",
    published_date: new Date('2025-01-25'),
    source: "DalConnect",
    thumbnail_url: "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=800&q=80"
  },
  {
    title: "DFW 한인 청소년 장학금 프로그램 신청 시작",
    url: "https://dalconnect.buildkind.tech/news/youth-scholarship-2025",
    content: "달라스-포트워스 한인 교육재단이 2025 청소년 장학금 프로그램 신청을 시작했습니다. 고등학생 및 대학생 대상으로 총 $50,000 규모의 장학금이 지급됩니다.",
    category: "Education",
    published_date: new Date('2025-01-20'),
    source: "DalConnect",
    thumbnail_url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80"
  },
  {
    title: "어빙 한인 교회 연합, 지역 봉사활동 펼쳐",
    url: "https://dalconnect.buildkind.tech/news/irving-church-service",
    content: "어빙 지역 한인 교회 연합이 노숙자 쉼터에서 봉사활동을 펼쳤습니다. 50여 명의 교인들이 참여하여 식사 제공 및 의류 기부를 진행했습니다.",
    category: "Community",
    published_date: new Date('2025-01-15'),
    source: "DalConnect",
    thumbnail_url: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80"
  },
  {
    title: "달라스 한인 부동산 시장, 2025년 전망 밝아",
    url: "https://dalconnect.buildkind.tech/news/real-estate-outlook-2025",
    content: "전문가들은 2025년 달라스 한인 부동산 시장이 안정적인 성장을 보일 것으로 전망했습니다. 플래노, 프리스코 지역의 주택 수요가 특히 높을 것으로 예상됩니다.",
    category: "Real Estate",
    published_date: new Date('2025-01-12'),
    source: "DalConnect",
    thumbnail_url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80"
  },
  {
    title: "한인 의료인 협회, 무료 건강검진 행사 개최",
    url: "https://dalconnect.buildkind.tech/news/free-health-checkup",
    content: "달라스 한인 의료인 협회가 3월 15일 무료 건강검진 행사를 개최합니다. 혈압, 혈당, 콜레스테롤 검사 등이 무료로 제공됩니다.",
    category: "Health",
    published_date: new Date('2025-01-10'),
    source: "DalConnect",
    thumbnail_url: "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=800&q=80"
  },
  {
    title: "달라스 한글학교, 새 학기 등록 접수 중",
    url: "https://dalconnect.buildkind.tech/news/korean-school-enrollment",
    content: "달라스 한글학교가 2025년 봄 학기 등록을 접수하고 있습니다. 유치부부터 고등부까지 다양한 수준의 한국어 교육이 제공됩니다.",
    category: "Education",
    published_date: new Date('2025-01-08'),
    source: "DalConnect",
    thumbnail_url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80"
  },
  {
    title: "프리스코 한인 문화센터 건립 추진",
    url: "https://dalconnect.buildkind.tech/news/frisco-cultural-center",
    content: "프리스코 한인 커뮤니티가 한인 문화센터 건립을 추진하고 있습니다. 센터는 문화 행사, 교육 프로그램, 비즈니스 모임 등을 위한 공간으로 활용될 예정입니다.",
    category: "Community",
    published_date: new Date('2025-01-05'),
    source: "DalConnect",
    thumbnail_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80"
  },
  {
    title: "달라스 한인 마켓 새해 세일 - 최대 50% 할인",
    url: "https://dalconnect.buildkind.tech/news/korean-market-sale",
    content: "달라스 한인타운 주요 한인 마켓들이 새해 기념 세일을 진행하고 있습니다. 한국 식품, 생활용품 등이 최대 50% 할인 판매됩니다.",
    category: "Shopping",
    published_date: new Date('2025-01-03'),
    source: "DalConnect",
    thumbnail_url: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&q=80"
  }
];

async function seedNews() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('📰 Seeding news data...');

    for (const news of newsData) {
      // Check if URL already exists
      const existingResult = await pool.query(
        'SELECT id FROM news WHERE url = $1',
        [news.url]
      );

      if (existingResult.rows.length === 0) {
        await pool.query(
          `INSERT INTO news (title, url, content, category, published_date, source, thumbnail_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [news.title, news.url, news.content, news.category, news.published_date, news.source, news.thumbnail_url]
        );
        console.log(`  ✅ Added: ${news.title}`);
      } else {
        console.log(`  ⏭️  Skipped (exists): ${news.title}`);
      }
    }

    console.log(`\n🎉 News seeding complete!`);
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedNews();
