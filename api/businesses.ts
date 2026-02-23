import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock data until DB is populated
const MOCK_BUSINESSES = [
  { id: "1", name: "Seoul Garden Restaurant", category: "한식당", city: "Carrollton", address: "2625 Old Denton Rd #412, Carrollton, TX 75007", phone: "(972) 242-7744", description: "정통 한식 레스토랑", featured: true, verified: true, rating: 4.5 },
  { id: "2", name: "Kogi BBQ House", category: "한식당", city: "Dallas", address: "2540 Royal Ln #246, Dallas, TX 75229", phone: "(214) 351-0999", description: "한국식 BBQ 전문점", featured: true, verified: true, rating: 4.6 },
  { id: "3", name: "H Mart Carrollton", category: "한인마트", city: "Carrollton", address: "2625 Old Denton Rd, Carrollton, TX 75007", phone: "(972) 242-8777", description: "대형 한인 슈퍼마켓", featured: true, verified: true, rating: 4.7 },
  { id: "4", name: "Grace Hair Salon", category: "미용실", city: "Carrollton", address: "2540 Old Denton Rd #114, Carrollton, TX 75007", phone: "(972) 416-7700", description: "전문 헤어 디자이너", featured: true, verified: true, rating: 4.8 },
  { id: "5", name: "New York Tofu House", category: "한식당", city: "Carrollton", address: "2625 Old Denton Rd #410, Carrollton, TX 75007", phone: "(972) 245-5599", description: "순두부 전문점", featured: false, verified: true, rating: 4.4 },
  { id: "6", name: "Komart Korean Restaurant", category: "한식당", city: "Carrollton", address: "3033 Old Denton Rd, Carrollton, TX 75007", phone: "(972) 245-5588", description: "가정식 한식당", featured: false, verified: true, rating: 4.3 },
  { id: "7", name: "99 Ranch Market", category: "한인마트", city: "Carrollton", address: "3201 Old Denton Rd #136, Carrollton, TX 75007", phone: "(972) 245-0066", description: "아시안 마켓", featured: false, verified: true, rating: 4.5 },
  { id: "8", name: "Jenny's Beauty Salon", category: "미용실", city: "Dallas", address: "2625 Royal Ln, Dallas, TX 75229", phone: "(214) 905-5588", description: "네일 & 헤어 살롱", featured: false, verified: true, rating: 4.2 },
  { id: "9", name: "Dallas Korean Church", category: "교회", city: "Dallas", address: "12400 Marsh Ln, Dallas, TX 75234", phone: "(972) 488-2200", description: "한인 교회", featured: false, verified: true, rating: 4.9 },
  { id: "10", name: "DFW Korean Dental", category: "치과", city: "Dallas", address: "2714 Royal Ln #210, Dallas, TX 75229", phone: "(972) 484-0505", description: "한인 치과", featured: true, verified: true, rating: 4.7 },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { category, city, search, featured } = req.query;
      
      let results = [...MOCK_BUSINESSES];
      
      // Apply filters
      if (category) {
        results = results.filter(b => b.category === category);
      }
      if (city) {
        results = results.filter(b => b.city === city);
      }
      if (search) {
        const searchLower = (search as string).toLowerCase();
        results = results.filter(b => 
          b.name.toLowerCase().includes(searchLower) ||
          b.description.toLowerCase().includes(searchLower)
        );
      }
      if (featured === 'true') {
        results = results.filter(b => b.featured);
      }
      
      return res.status(200).json(results);
    } catch (error) {
      console.error("GET /api/businesses error:", error);
      return res.status(500).json({ error: "Failed to fetch businesses" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
