import { db } from "./db";
import { businesses, news } from "../shared/schema";

const SEED_BUSINESSES = [
  {
    id: "1",
    name_en: "Gomone BBQ",
    name_ko: "고모네",
    category: "restaurants",
    description: "Authentic Korean BBQ experience with premium cuts of meat and traditional banchan. A local favorite in the heart of Carrollton.",
    address: "2625 Old Denton Rd",
    city: "Carrollton",
    phone: "(972) 555-0101",
    email: "hello@gomonebbq.com",
    website: "https://gomonebbq.com",
    hours: { "Monday": "11:00 AM - 10:00 PM", "Tuesday": "11:00 AM - 10:00 PM", "Wednesday": "Closed", "Thursday": "11:00 AM - 10:00 PM", "Friday": "11:00 AM - 11:00 PM", "Saturday": "11:00 AM - 11:00 PM", "Sunday": "11:00 AM - 10:00 PM" },
    logo_url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=150&h=150&fit=crop",
    cover_url: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800&h=400&fit=crop",
    photos: ["https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&h=400&fit=crop", "https://images.unsplash.com/photo-1552611052-33e04de081de?w=600&h=400&fit=crop"],
    tier: "elite",
    featured: true,
    claimed: true,
    rating: "4.8",
    review_count: 342
  },
  {
    id: "2",
    name_en: "Seoul Seolleongtang",
    name_ko: "설렁탕",
    category: "restaurants",
    description: "Comforting ox bone soup simmered for 24 hours. The perfect meal for a cold day or when you're missing home.",
    address: "2625 Old Denton Rd #200",
    city: "Carrollton",
    phone: "(972) 555-0102",
    email: "info@seoulsoup.com",
    website: "https://seoulsoup.com",
    hours: { "Monday": "9:00 AM - 9:00 PM", "Tuesday": "9:00 AM - 9:00 PM", "Wednesday": "9:00 AM - 9:00 PM", "Thursday": "9:00 AM - 9:00 PM", "Friday": "9:00 AM - 10:00 PM", "Saturday": "9:00 AM - 10:00 PM", "Sunday": "9:00 AM - 9:00 PM" },
    logo_url: "https://images.unsplash.com/photo-1580651315530-69c8e0026377?w=150&h=150&fit=crop",
    cover_url: "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&h=400&fit=crop",
    photos: [] as string[],
    tier: "premium",
    featured: true,
    claimed: true,
    rating: "4.6",
    review_count: 189
  },
  {
    id: "3",
    name_en: "Koriyo Galbi",
    name_ko: "코리요 칼비",
    category: "restaurants",
    description: "Premium marinated short ribs and authentic Korean dining in an upscale atmosphere.",
    address: "11400 N Stemmons Fwy",
    city: "Dallas",
    phone: "(214) 555-0103",
    email: "reservations@koriyo.com",
    website: "https://koriyo.com",
    hours: { "Monday": "11:30 AM - 10:00 PM", "Tuesday": "11:30 AM - 10:00 PM", "Wednesday": "11:30 AM - 10:00 PM", "Thursday": "11:30 AM - 10:00 PM", "Friday": "11:30 AM - 11:00 PM", "Saturday": "11:30 AM - 11:00 PM", "Sunday": "11:30 AM - 10:00 PM" },
    logo_url: "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=150&h=150&fit=crop",
    cover_url: "https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=800&h=400&fit=crop",
    photos: [] as string[],
    tier: "elite",
    featured: true,
    claimed: true,
    rating: "4.9",
    review_count: 512
  },
  {
    id: "4",
    name_en: "Oomi Ok",
    name_ko: "우미옥",
    category: "restaurants",
    description: "Traditional Korean stews, casseroles, and authentic homestyle cooking.",
    address: "2625 Old Denton Rd #300",
    city: "Carrollton",
    phone: "(972) 555-0104",
    email: "contact@oomiok.com",
    website: "",
    hours: { "Everyday": "10:00 AM - 10:00 PM" },
    logo_url: "https://images.unsplash.com/photo-1626804475297-4160bbcebaaec?w=150&h=150&fit=crop",
    cover_url: "https://images.unsplash.com/photo-1555126634-323283e090fa?w=800&h=400&fit=crop",
    photos: [] as string[],
    tier: "basic",
    featured: false,
    claimed: false,
    rating: "4.3",
    review_count: 87
  },
  {
    id: "5",
    name_en: "Ttukbaegi",
    name_ko: "뚝배기",
    category: "restaurants",
    description: "Hot stone bowl specialties, including bibimbap, soft tofu stew, and army stew.",
    address: "1011 MacArthur Blvd",
    city: "Carrollton",
    phone: "(972) 555-0105",
    email: "",
    website: "",
    hours: { "Everyday": "11:00 AM - 9:30 PM" },
    logo_url: "https://images.unsplash.com/photo-1584278860047-22db9fa8e469?w=150&h=150&fit=crop",
    cover_url: "https://images.unsplash.com/photo-1590301157890-4810ed35a4d4?w=800&h=400&fit=crop",
    photos: [] as string[],
    tier: "free",
    featured: false,
    claimed: false,
    rating: "4.5",
    review_count: 124
  },
  {
    id: "6",
    name_en: "Korea House",
    name_ko: "코리아하우스",
    category: "restaurants",
    description: "Dallas's oldest Korean restaurant serving classic dishes in a traditional setting.",
    address: "2598 Royal Ln",
    city: "Dallas",
    phone: "(214) 555-0106",
    email: "info@koreahousedallas.com",
    website: "https://koreahousedallas.com",
    hours: { "Everyday": "11:00 AM - 10:00 PM" },
    logo_url: "https://images.unsplash.com/photo-1635363638580-c2809d049eee?w=150&h=150&fit=crop",
    cover_url: "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=800&h=400&fit=crop",
    photos: [] as string[],
    tier: "premium",
    featured: false,
    claimed: true,
    rating: "4.2",
    review_count: 450
  },
  {
    id: "7",
    name_en: "Bongchu Jjimdak",
    name_ko: "봉추찜닭",
    category: "restaurants",
    description: "Famous for Andong-style braised chicken with glass noodles, potatoes, and vegetables.",
    address: "2625 Old Denton Rd",
    city: "Carrollton",
    phone: "(972) 555-0107",
    email: "carrollton@bongchu.com",
    website: "https://bongchu.com/us",
    hours: { "Everyday": "11:00 AM - 10:00 PM" },
    logo_url: "https://images.unsplash.com/photo-1580651315530-69c8e0026377?w=150&h=150&fit=crop",
    cover_url: "https://images.unsplash.com/photo-1605297925565-df01b5a26639?w=800&h=400&fit=crop",
    photos: [] as string[],
    tier: "basic",
    featured: false,
    claimed: true,
    rating: "4.4",
    review_count: 215
  },
  {
    id: "8",
    name_en: "Seoul Kitchen",
    name_ko: "서울식당",
    category: "restaurants",
    description: "Casual eatery offering a wide variety of Korean street food and snacks.",
    address: "11400 N Stemmons Fwy #105",
    city: "Dallas",
    phone: "(214) 555-0108",
    email: "",
    website: "",
    hours: { "Everyday": "10:30 AM - 9:00 PM" },
    logo_url: "https://images.unsplash.com/photo-1625937329935-287adaaa1cb6?w=150&h=150&fit=crop",
    cover_url: "https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=800&h=400&fit=crop",
    photos: [] as string[],
    tier: "free",
    featured: false,
    claimed: false,
    rating: "4.1",
    review_count: 98
  },
  {
    id: "9",
    name_en: "Hanchon Seolleongtang",
    name_ko: "한촌설렁탕",
    category: "restaurants",
    description: "Specializing in milky beef bone soup, served with high-quality beef cuts and noodles.",
    address: "2625 Old Denton Rd",
    city: "Carrollton",
    phone: "(972) 555-0109",
    email: "contact@hanchon.com",
    website: "https://hanchon.com",
    hours: { "Everyday": "9:00 AM - 10:00 PM" },
    logo_url: "https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=150&h=150&fit=crop",
    cover_url: "https://images.unsplash.com/photo-1623194016629-67d712cecb45?w=800&h=400&fit=crop",
    photos: [] as string[],
    tier: "premium",
    featured: false,
    claimed: true,
    rating: "4.7",
    review_count: 310
  },
  {
    id: "10",
    name_en: "Mapo Galmegi",
    name_ko: "마포갈매기",
    category: "restaurants",
    description: "Famous for skirt meat BBQ and the unique egg crust cooked around the grill.",
    address: "2625 Old Denton Rd #110",
    city: "Carrollton",
    phone: "(972) 555-0110",
    email: "info@mapobbq.com",
    website: "https://mapobbq.com",
    hours: { "Everyday": "4:00 PM - 2:00 AM" },
    logo_url: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=150&h=150&fit=crop",
    cover_url: "https://images.unsplash.com/photo-1544025162-817b93a0bcf5?w=800&h=400&fit=crop",
    photos: [] as string[],
    tier: "elite",
    featured: true,
    claimed: true,
    rating: "4.6",
    review_count: 420
  }
];

const SEED_NEWS = [
  {
    id: "1",
    title: "달라스에 새 H-Mart 내년 봄 오픈 예정",
    url: "https://dfwhanin.com/news/1",
    content: "인기 한인 슈퍼마켓 체인 H-Mart가 DFW 지역 네 번째 매장 오픈 계획을 발표했습니다.",
    category: "비즈니스",
    published_date: new Date("2024-05-15T09:00:00Z"),
    source: "코리아 타임즈 TX",
    thumbnail_url: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&h=300&fit=crop"
  },
  {
    id: "2",
    title: "캐롤턴 아시안 상가 지구 주차장 확장",
    url: "https://dfwhanin.com/news/2",
    content: "시 관계자들이 주말 혼잡을 완화하기 위한 새 다층 주차장 건설을 승인했습니다.",
    category: "지역소식",
    published_date: new Date("2024-05-12T14:30:00Z"),
    source: "달라스 뉴스",
    thumbnail_url: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400&h=300&fit=crop"
  },
  {
    id: "3",
    title: "연례 한인 축제 11월 개최 확정",
    url: "https://dfwhanin.com/news/3",
    content: "달라스 한인 축제가 캐롤턴 아시안 상가 지구에서 K-pop 공연과 음식 부스와 함께 돌아옵니다.",
    category: "이벤트",
    published_date: new Date("2024-05-10T11:15:00Z"),
    source: "DFW Hanin",
    thumbnail_url: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=400&h=300&fit=crop"
  },
  {
    id: "4",
    title: "지역 한인 셰프, 제임스 비어드 어워드 후보 지명",
    url: "https://dfwhanin.com/news/4",
    content: "파인 다이닝 레스토랑 'Seoul'의 김 셰프가 권위 있는 요리 어워드 후보에 올랐습니다.",
    category: "문화",
    published_date: new Date("2024-05-08T16:45:00Z"),
    source: "Eater Dallas",
    thumbnail_url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=300&fit=crop"
  }
];

async function seed() {
  console.log("Seeding database...");
  
  try {
    console.log("  Clearing existing data...");
    await db.delete(news);
    await db.delete(businesses);
    
    console.log("  Inserting businesses...");
    for (const business of SEED_BUSINESSES) {
      await db.insert(businesses).values(business);
    }
    console.log(`  Inserted ${SEED_BUSINESSES.length} businesses`);
    
    console.log("  Inserting news...");
    for (const newsItem of SEED_NEWS) {
      await db.insert(news).values(newsItem);
    }
    console.log(`  Inserted ${SEED_NEWS.length} news items`);
    
    console.log("\nSeeding complete!");
  } catch (error) {
    console.error("Seeding failed:", error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
