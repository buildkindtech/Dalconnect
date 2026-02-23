import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock data until DB is populated
const MOCK_FEATURED = [
  {
    id: "1",
    name: "Seoul Garden Restaurant",
    category: "한식당",
    city: "Carrollton",
    address: "2625 Old Denton Rd #412, Carrollton, TX 75007",
    phone: "(972) 242-7744",
    description: "정통 한식을 맛볼 수 있는 레스토랑",
    featured: true,
    verified: true,
    rating: 4.5,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "H Mart Carrollton",
    category: "한인마트",
    city: "Carrollton",
    address: "2625 Old Denton Rd, Carrollton, TX 75007",
    phone: "(972) 242-8777",
    description: "대형 한인 슈퍼마켓",
    featured: true,
    verified: true,
    rating: 4.7,
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Grace Hair Salon",
    category: "미용실",
    city: "Carrollton",
    address: "2540 Old Denton Rd #114, Carrollton, TX 75007",
    phone: "(972) 416-7700",
    description: "전문 헤어 디자이너",
    featured: true,
    verified: true,
    rating: 4.8,
    createdAt: new Date().toISOString(),
  },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      // Return mock data for now
      return res.status(200).json(MOCK_FEATURED);
      
      // TODO: Replace with DB query when populated
      // const featured = await storage.getFeaturedBusinesses();
      // return res.status(200).json(featured);
    } catch (error) {
      console.error("GET /api/featured error:", error);
      return res.status(500).json({ error: "Failed to fetch featured businesses" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
