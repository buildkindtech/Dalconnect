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

      const response = await fetch(`/api/listings?${params}`);
      if (!response.ok) throw new Error('Failed to fetch listings');
      return response.json();
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data?.items?.map((listing: any) => (
                <Link key={listing.id} href={`/marketplace/${listing.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <div className="p-4">
                      {/* Category Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {listing.category}
                        </span>
                        {listing.price_type === 'free' && (
                          <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                            무료
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2 min-h-[3.5rem]">
                        {listing.title}
                      </h3>

                      {/* Price */}
                      <div className="flex items-center gap-1 text-xl font-bold text-gray-900 mb-3">
                        {listing.price_type !== 'free' && listing.price && (
                          <DollarSign className="w-5 h-5" />
                        )}
                        {formatPrice(listing)}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2 min-h-[2.5rem]">
                        {listing.description || '설명 없음'}
                      </p>

                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {listing.location || '위치 미정'}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {listing.views || 0}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(listing.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
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
                  onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
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
