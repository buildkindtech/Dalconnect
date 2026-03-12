import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, ExternalLink, Clock, Store, Percent, Gift, Flame } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Deal {
  id: string;
  title: string;
  description: string;
  category: string;
  store: string;
  original_price: string;
  deal_price: string;
  discount: string;
  coupon_code?: string;
  deal_url: string;
  image_url: string;
  expires_at?: string;
  likes: number;
  views: number;
  created_at: string;
}

const categories = [
  { value: 'all', label: '전체', icon: '🏷️' },
  { value: '식료품', label: '식료품', icon: '🛒' },
  { value: '항공권', label: '항공권', icon: '✈️' },
  { value: '맛집', label: '맛집', icon: '🍜' },
  { value: '뷰티', label: '뷰티', icon: '💄' },
  { value: '테크', label: '테크', icon: '💻' },
  { value: '쇼핑', label: '쇼핑', icon: '🛍️' },
  { value: '쿠폰', label: '쿠폰', icon: '🎟️' }
];

const fetchDeals = async (category?: string, hot?: boolean): Promise<Deal[]> => {
  const params = new URLSearchParams();
  if (category && category !== 'all') params.append('category', category);
  if (hot) params.append('hot', 'true');
  params.append('limit', '50');
  
  const response = await fetch(`/api/deals?${params}`);
  if (!response.ok) throw new Error('Failed to fetch deals');
  return response.json();
};

const likeDeal = async (dealId: string) => {
  const response = await fetch(`/api/featured?action=deal-like&id=${dealId}`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to like deal');
  return response.json();
};

const getTimeRemaining = (expiresAt: string | null): { text: string; isUrgent: boolean } => {
  if (!expiresAt) return { text: '', isUrgent: false };
  
  const now = new Date().getTime();
  const expiry = new Date(expiresAt).getTime();
  const diff = expiry - now;
  
  if (diff <= 0) return { text: '마감', isUrgent: true };
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days <= 2) {
    if (days === 0) return { text: `${hours}시간 후 마감`, isUrgent: true };
    return { text: `D-${days}`, isUrgent: true };
  }
  
  return { text: `${days}일 남음`, isUrgent: false };
};

const DealCard: React.FC<{ deal: Deal; onLike: (id: string) => void }> = ({ deal, onLike }) => {
  const timeRemaining = getTimeRemaining(deal.expires_at || null);
  const isHot = deal.likes > 200;
  const isFree = deal.discount.includes('FREE') || deal.deal_price === 'FREE';
  
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden relative">
      {/* Hot/Free badges */}
      <div className="absolute top-3 left-3 z-10 flex gap-2">
        {isHot && (
          <Badge variant="destructive" className="bg-red-500 text-white font-bold">
            <Flame className="w-3 h-3 mr-1" />
            HOT
          </Badge>
        )}
        {isFree && (
          <Badge variant="secondary" className="bg-green-500 text-white font-bold">
            <Gift className="w-3 h-3 mr-1" />
            FREE
          </Badge>
        )}
      </div>
      
      {/* Discount badge */}
      <div className="absolute top-3 right-3 z-10">
        <Badge variant="destructive" className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold text-lg px-3 py-1">
          {deal.discount}
        </Badge>
      </div>
      
      <CardContent className="p-0">
        {/* Image/Gradient */}
        <div 
          className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${deal.image_url})` }}
        >
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
        </div>
        
        <div className="p-4">
          {/* Store name */}
          <div className="flex items-center gap-2 mb-2">
            <Store className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">{deal.store}</span>
          </div>
          
          {/* Title */}
          <h3 className="font-bold text-lg mb-2 line-clamp-2">{deal.title}</h3>
          
          {/* Price section */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-gray-500 line-through text-sm">{deal.original_price}</span>
              <span className="text-red-600 font-bold text-xl">{deal.deal_price}</span>
            </div>
            
            {/* Coupon code */}
            {deal.coupon_code && (
              <div className="bg-yellow-50 border border-yellow-200 rounded px-2 py-1 text-sm">
                <span className="text-yellow-800">쿠폰코드: </span>
                <span className="font-mono font-bold text-yellow-900">{deal.coupon_code}</span>
              </div>
            )}
          </div>
          
          {/* Expiry and actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              {timeRemaining.text && (
                <div className={`flex items-center gap-1 ${timeRemaining.isUrgent ? 'text-red-600' : 'text-gray-600'}`}>
                  <Clock className="w-3 h-3" />
                  {timeRemaining.isUrgent && <span className="text-red-500 font-bold">🔴 곧 마감!</span>}
                  <span>{timeRemaining.text}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onLike(deal.id)}
                className="flex items-center gap-1 text-gray-600 hover:text-red-500"
              >
                <Heart className="w-4 h-4" />
                {deal.likes}
              </Button>
              
              {deal.deal_url ? (
                <Button
                  size="sm"
                  onClick={() => window.open(deal.deal_url, '_blank')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  딜 보러가기
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-gray-500 cursor-default"
                  disabled
                >
                  매장 방문
                  <Store className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const HotDealBanner: React.FC<{ hotDeal?: Deal; onLike: (id: string) => void }> = ({ hotDeal, onLike }) => {
  if (!hotDeal) return null;
  
  return (
    <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-6 rounded-lg mb-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-black/10"></div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="w-6 h-6" />
          <span className="text-xl font-bold">🔥 오늘의 핫딜</span>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">{hotDeal.title}</h2>
            <p className="text-white/90 mb-4">{hotDeal.description}</p>
            
            <div className="flex items-center gap-4 mb-4">
              <span className="text-white/80 line-through">{hotDeal.original_price}</span>
              <span className="text-3xl font-bold">{hotDeal.deal_price}</span>
              <Badge variant="secondary" className="bg-white text-red-500 font-bold">
                {hotDeal.discount}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => onLike(hotDeal.id)}
                className="flex items-center gap-2"
              >
                <Heart className="w-4 h-4" />
                {hotDeal.likes}
              </Button>
              
              {hotDeal.deal_url ? (
                <Button
                  size="lg"
                  onClick={() => window.open(hotDeal.deal_url, '_blank')}
                  className="bg-white text-red-500 hover:bg-gray-100 font-bold"
                >
                  지금 구매하기
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="secondary"
                  className="font-bold cursor-default"
                  disabled
                >
                  매장 방문
                  <Store className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
          
          <div 
            className="hidden md:block h-48 bg-white/20 rounded-lg bg-cover bg-center"
            style={{ backgroundImage: `url(${hotDeal.image_url})` }}
          />
        </div>
      </div>
    </div>
  );
};

const Sidebar: React.FC<{ topDeals: Deal[]; stores: string[]; onStoreFilter: (store: string) => void }> = ({ 
  topDeals, stores, onStoreFilter 
}) => {
  return (
    <div className="space-y-6">
      {/* Top 5 인기 딜 */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            📊 인기 딜 TOP 5
          </h3>
          <div className="space-y-3">
            {topDeals.slice(0, 5).map((deal, index) => (
              <div key={deal.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                <span className="font-bold text-lg text-red-500">#{index + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{deal.title}</p>
                  <p className="text-xs text-gray-500">{deal.store}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Heart className="w-3 h-3" />
                  {deal.likes}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* 매장별 세일 */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            🏪 매장별 세일
          </h3>
          <div className="space-y-2">
            {stores.map(store => (
              <Button
                key={store}
                variant="ghost"
                size="sm"
                onClick={() => onStoreFilter(store)}
                className="w-full justify-start text-left"
              >
                {store}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* 딜 알림 */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            📬 딜 알림 받기
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            최신 딜과 쿠폰 정보를 이메일로 받아보세요!
          </p>
          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            뉴스레터 구독
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default function Deals() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [storeFilter, setStoreFilter] = useState<string>('');
  const queryClient = useQueryClient();
  
  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['deals', activeCategory, storeFilter],
    queryFn: () => fetchDeals(activeCategory === 'all' ? undefined : activeCategory),
  });
  
  const { data: hotDeals = [] } = useQuery({
    queryKey: ['deals', 'hot'],
    queryFn: () => fetchDeals(undefined, true),
  });
  
  const likeMutation = useMutation({
    mutationFn: likeDeal,
    onSuccess: (data, dealId) => {
      queryClient.setQueryData(['deals', activeCategory, storeFilter], (oldDeals: Deal[]) => {
        return oldDeals?.map(deal => 
          deal.id === dealId ? { ...deal, likes: data.likes } : deal
        ) || [];
      });
      toast({
        title: "딜에 좋아요를 눌렀습니다! ❤️",
        description: "관심있는 딜을 북마크해보세요.",
      });
    },
    onError: () => {
      toast({
        title: "오류가 발생했습니다",
        description: "잠시 후 다시 시도해주세요.",
        variant: "destructive"
      });
    }
  });
  
  const handleLike = (dealId: string) => {
    likeMutation.mutate(dealId);
  };
  
  const filteredDeals = storeFilter 
    ? deals.filter(deal => deal.store === storeFilter)
    : deals;
    
  const uniqueStores = Array.from(new Set(deals.map(deal => deal.store)));
  const hotDeal = hotDeals[0];
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading deals...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🔥 DalKonnect 딜 & 쿠폰
          </h1>
          <p className="text-lg text-gray-600">
            달라스 한인들을 위한 최고의 딜과 쿠폰 정보
          </p>
        </div>
        
        {/* Hot Deal Banner */}
        <HotDealBanner hotDeal={hotDeal} onLike={handleLike} />
        
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            {/* Category Tabs */}
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-6">
              <TabsList className="grid grid-cols-4 md:grid-cols-8 w-full">
                {categories.map(category => (
                  <TabsTrigger 
                    key={category.value} 
                    value={category.value}
                    className="flex flex-col items-center gap-1 px-2 py-3"
                  >
                    <span className="text-lg">{category.icon}</span>
                    <span className="text-xs">{category.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            
            {/* Store Filter */}
            {storeFilter && (
              <div className="mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">필터:</span>
                  <Badge variant="secondary" className="flex items-center gap-2">
                    {storeFilter}
                    <button
                      onClick={() => setStoreFilter('')}
                      className="ml-1 text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </Badge>
                </div>
              </div>
            )}
            
            {/* Deals Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {filteredDeals.map(deal => (
                <DealCard key={deal.id} deal={deal} onLike={handleLike} />
              ))}
            </div>
            
            {filteredDeals.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">해당 카테고리에 딜이 없습니다.</p>
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="hidden lg:block">
            <Sidebar 
              topDeals={hotDeals} 
              stores={uniqueStores}
              onStoreFilter={setStoreFilter}
            />
          </div>
        </div>
      </div>
    </div>
  );
}