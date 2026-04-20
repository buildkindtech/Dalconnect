import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Search, Plus, MapPin, DollarSign, Eye, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const categories = [
  { value: 'all', label: '전체' },
  { value: '가전/가구', label: '가전/가구' },
  { value: '자동차', label: '자동차' },
  { value: '전자기기', label: '전자기기' },
  { value: '의류/잡화', label: '의류/잡화' },
  { value: '부동산/렌트', label: '부동산/렌트' },
  { value: '구인/구직', label: '구인/구직' },
  { value: '레슨/과외', label: '레슨/과외' },
  { value: '서비스', label: '서비스' },
  { value: '무료나눔', label: '무료나눔' },
  { value: '기타', label: '기타' },
];

const locations = [
  { value: 'all', label: '모든 지역' },
  { value: 'Plano', label: 'Plano' },
  { value: 'Frisco', label: 'Frisco' },
  { value: 'Allen', label: 'Allen' },
  { value: 'McKinney', label: 'McKinney' },
  { value: 'Dallas', label: 'Dallas' },
  { value: 'Carrollton', label: 'Carrollton' },
  { value: 'Irving', label: 'Irving' },
];

export default function Marketplace() {
  const [category, setCategory] = useState('all');
  const [location, setLocation] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['listings', { category, location, search, page }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
      });
      if (category && category !== 'all') params.append('category', category);
      if (location && location !== 'all') params.append('location', location);
      if (search) params.append('search', search);

      const response = await fetch(`/api/market?${params}`);
      if (!response.ok) throw new Error('Failed to fetch listings');
      const data = await response.json();
      return Array.isArray(data) ? { items: data, pagination: null } : data as { items: any[]; pagination: { totalPages: number } | null };
    },
  });

  const formatPrice = (listing: any) => {
    if (listing.price_type === 'free') return '무료나눔';
    if (listing.price_type === 'contact') return '가격문의';
    if (!listing.price) return '가격협의';
    return `$${parseFloat(listing.price).toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">DFW 사고팔기</h1>
          <p className="text-xl mb-6">달라스 한인 커뮤니티 중고 거래 마켓플레이스</p>
          <Link href="/marketplace/new">
            <Button size="lg" variant="secondary" className="gap-2 bg-white text-blue-700 hover:bg-gray-100">
              <Plus className="w-5 h-5" />
              무료로 올리기
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="검색어 입력..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger>
                <SelectValue placeholder="지역" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.value} value={loc.value}>
                    {loc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setCategory('all');
                setLocation('all');
                setSearch('');
              }}
            >
              필터 초기화
            </Button>
          </div>
        </Card>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="text-center py-12">로딩중...</div>
        ) : (
          <>
            {/* 모두마켓 스타일 리스트 */}
            <div className="bg-white rounded-xl border divide-y overflow-hidden">
              {(data?.items || []).map((listing: any) => (
                <Link key={listing.id} href={`/marketplace/${listing.id}`}>
                  <div className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer">
                    {/* 썸네일 */}
                    <div className="w-16 h-16 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                      {listing.images?.length > 0 ? (
                        <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          {listing.category === '전자기기' ? '📱' :
                           listing.category === '가전/가구' ? '🛋️' :
                           listing.category === '자동차' ? '🚗' :
                           listing.category === '의류/패션' ? '👕' :
                           listing.category === '아이용품' ? '🧸' :
                           listing.category === '식품/식재료' ? '🍱' : '📦'}
                        </div>
                      )}
                    </div>

                    {/* 내용 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs text-primary font-medium bg-primary/8 px-1.5 py-0.5 rounded">
                          {listing.category}
                        </span>
                        {listing.condition && (
                          <span className="text-xs text-slate-500">{listing.condition}</span>
                        )}
                      </div>
                      <p className="font-medium text-slate-900 truncate text-sm">{listing.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                        {listing.location && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />{listing.location}
                          </span>
                        )}
                        <span>{formatDate(listing.created_at)}</span>
                        <span className="flex items-center gap-0.5">
                          <Eye className="w-3 h-3" />{listing.views || 0}
                        </span>
                      </div>
                    </div>

                    {/* 가격 */}
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-slate-900 text-sm">
                        {listing.price_type === 'free' ? (
                          <span className="text-green-600">무료나눔</span>
                        ) : listing.price_type === 'contact' ? (
                          <span className="text-slate-500 text-xs">가격문의</span>
                        ) : listing.price ? (
                          `$${Number(listing.price).toLocaleString()}`
                        ) : (
                          <span className="text-slate-400 text-xs">협의</span>
                        )}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {data?.pagination && data.pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  이전
                </Button>
                <span className="flex items-center px-4">
                  {page} / {data.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(data?.pagination?.totalPages ?? p, p + 1))}
                  disabled={page === data.pagination.totalPages}
                >
                  다음
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
