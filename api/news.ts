import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock news data
const MOCK_NEWS = [
  {
    id: "news-1",
    title: "DFW 한인 커뮤니티 새해 행사 성황",
    category: "커뮤니티",
    summary: "2026년 새해를 맞아 DFW 한인 커뮤니티에서 다양한 행사가 열렸습니다.",
    content: "달라스-포트워스 지역 한인 커뮤니티가 새해를 맞아 성대한 행사를 개최했습니다...",
    published_date: new Date("2026-01-15").toISOString(),
    image_url: "https://picsum.photos/seed/news1/800/400",
  },
  {
    id: "news-2",
    title: "Carrollton 신규 한식당 오픈",
    category: "비즈니스",
    summary: "Carrollton 지역에 새로운 한식 레스토랑이 문을 열었습니다.",
    content: "Old Denton Rd에 위치한 신규 한식당이 성황리에 오픈했습니다...",
    published_date: new Date("2026-02-01").toISOString(),
    image_url: "https://picsum.photos/seed/news2/800/400",
  },
  {
    id: "news-3",
    title: "한인 학생 장학금 수여식",
    category: "교육",
    summary: "우수 한인 학생들에게 장학금이 수여되었습니다.",
    content: "DFW 한인회에서 우수 학생 10명에게 총 $50,000의 장학금을 수여했습니다...",
    published_date: new Date("2026-02-10").toISOString(),
    image_url: "https://picsum.photos/seed/news3/800/400",
  },
  {
    id: "news-4",
    title: "H Mart 확장 공사 시작",
    category: "비즈니스",
    summary: "H Mart Carrollton점이 매장 확장을 시작합니다.",
    content: "고객 증가에 따라 H Mart가 매장 면적을 30% 확장하기로 결정했습니다...",
    published_date: new Date("2026-02-20").toISOString(),
    image_url: "https://picsum.photos/seed/news4/800/400",
  },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { category, limit } = req.query;
      
      let results = [...MOCK_NEWS];
      
      // Apply filters
      if (category) {
        results = results.filter(n => n.category === category);
      }
      
      // Apply limit
      const limitNum = limit ? parseInt(limit as string) : 20;
      results = results.slice(0, limitNum);
      
      // Sort by date (newest first)
      results.sort((a, b) => new Date(b.published_date).getTime() - new Date(a.published_date).getTime());
      
      return res.status(200).json(results);
    } catch (error) {
      console.error("GET /api/news error:", error);
      return res.status(500).json({ error: "Failed to fetch news" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
