export interface Business {
  id: string;
  name_en: string;
  name_ko: string;
  category: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  hours: Record<string, string>;
  logo_url: string;
  cover_url: string;
  photos: string[];
  tier: 'free' | 'basic' | 'premium' | 'elite';
  featured: boolean;
  claimed: boolean;
  rating: number;
  review_count: number;
}

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  content: string;
  category: string;
  published_date: string;
  source: string;
  thumbnail_url: string;
}

export const CATEGORIES = [
  { id: 'restaurants', name: '식당', icon: 'utensils' },
  { id: 'beauty', name: '미용/뷰티', icon: 'scissors' },
  { id: 'medical', name: '의료/병원', icon: 'stethoscope' },
  { id: 'legal', name: '법률 서비스', icon: 'scale' },
  { id: 'real-estate', name: '부동산', icon: 'home' },
  { id: 'auto', name: '자동차 서비스', icon: 'car' },
  { id: 'education', name: '교육/학원', icon: 'book-open' },
  { id: 'events', name: '이벤트/기획', icon: 'calendar' }
];

export const MOCK_BUSINESSES: Business[] = [
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
    hours: {
      "Monday": "11:00 AM - 10:00 PM",
      "Tuesday": "11:00 AM - 10:00 PM",
      "Wednesday": "Closed",
      "Thursday": "11:00 AM - 10:00 PM",
      "Friday": "11:00 AM - 11:00 PM",
      "Saturday": "11:00 AM - 11:00 PM",
      "Sunday": "11:00 AM - 10:00 PM"
    },
    logo_url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=150&h=150&fit=crop",
    cover_url: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800&h=400&fit=crop",
    photos: [
      "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1552611052-33e04de081de?w=600&h=400&fit=crop"
    ],
    tier: "elite",
    featured: true,
    claimed: true,
    rating: 4.8,
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
    hours: {
      "Monday": "9:00 AM - 9:00 PM",
      "Tuesday": "9:00 AM - 9:00 PM",
      "Wednesday": "9:00 AM - 9:00 PM",
      "Thursday": "9:00 AM - 9:00 PM",
      "Friday": "9:00 AM - 10:00 PM",
      "Saturday": "9:00 AM - 10:00 PM",
      "Sunday": "9:00 AM - 9:00 PM"
    },
    logo_url: "https://images.unsplash.com/photo-1580651315530-69c8e0026377?w=150&h=150&fit=crop",
    cover_url: "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&h=400&fit=crop",
    photos: [],
    tier: "premium",
    featured: true,
    claimed: true,
    rating: 4.6,
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
    hours: {
      "Monday": "11:30 AM - 10:00 PM",
      "Tuesday": "11:30 AM - 10:00 PM",
      "Wednesday": "11:30 AM - 10:00 PM",
      "Thursday": "11:30 AM - 10:00 PM",
      "Friday": "11:30 AM - 11:00 PM",
      "Saturday": "11:30 AM - 11:00 PM",
      "Sunday": "11:30 AM - 10:00 PM"
    },
    logo_url: "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=150&h=150&fit=crop",
    cover_url: "https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=800&h=400&fit=crop",
    photos: [],
    tier: "elite",
    featured: true,
    claimed: true,
    rating: 4.9,
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
    photos: [],
    tier: "basic",
    featured: false,
    claimed: false,
    rating: 4.3,
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
    photos: [],
    tier: "free",
    featured: false,
    claimed: false,
    rating: 4.5,
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
    photos: [],
    tier: "premium",
    featured: false,
    claimed: true,
    rating: 4.2,
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
    photos: [],
    tier: "basic",
    featured: false,
    claimed: true,
    rating: 4.4,
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
    photos: [],
    tier: "free",
    featured: false,
    claimed: false,
    rating: 4.1,
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
    photos: [],
    tier: "premium",
    featured: false,
    claimed: true,
    rating: 4.7,
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
    photos: [],
    tier: "elite",
    featured: true,
    claimed: true,
    rating: 4.6,
    review_count: 420
  }
];

export const MOCK_NEWS: NewsItem[] = [
  {
    id: "1",
    title: "New H-Mart to open in Dallas next spring",
    url: "#",
    content: "The popular Korean-American supermarket chain has announced plans to open its fourth DFW location.",
    category: "Business",
    published_date: "2024-05-15T09:00:00Z",
    source: "Korea Times TX",
    thumbnail_url: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&h=300&fit=crop"
  },
  {
    id: "2",
    title: "Carrollton Asian Trade District expands parking",
    url: "#",
    content: "City officials have approved a new multi-level parking garage to alleviate weekend congestion.",
    category: "Local",
    published_date: "2024-05-12T14:30:00Z",
    source: "Dallas News",
    thumbnail_url: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400&h=300&fit=crop"
  },
  {
    id: "3",
    title: "Annual Korean Festival set for November",
    url: "#",
    content: "The Dallas Korean Festival will return to the Carrollton Asian Trade District with K-pop performances and food vendors.",
    category: "Events",
    published_date: "2024-05-10T11:15:00Z",
    source: "DFW Hanin",
    thumbnail_url: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=400&h=300&fit=crop"
  },
  {
    id: "4",
    title: "Local Korean chef nominated for James Beard Award",
    url: "#",
    content: "Chef Kim of fine dining establishment 'Seoul' receives prestigious culinary nomination.",
    category: "Culture",
    published_date: "2024-05-08T16:45:00Z",
    source: "Eater Dallas",
    thumbnail_url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=300&fit=crop"
  }
];