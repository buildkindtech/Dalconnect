import { Link, useLocation } from "wouter";
import { Search, MapPin, Star, ArrowRight, UtensilsCrossed, Church, Heart, Scissors, Home as HomeIcon, Scale, Car, GraduationCap, ShoppingCart, BookOpen, TrendingUp, Sparkles, Clock, ShoppingBag, Eye, Calendar, Phone, Users, Flame, MessageCircle, Trophy, Music, Film, Tv, Gift } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeaturedBusinesses, useNews, useBlogs, useListings, useCategories } from "@/lib/api";
import { getCategoryColor, getCategoryIcon, hasValidImage, proxyPhotoUrl } from "@/lib/imageDefaults";
import { getBlogCategoryStyle, getNewsCategoryStyle } from "@/lib/blogNewsDefaults";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import BusinessCard from "@/components/BusinessCard";
import * as Icons from "lucide-react";

const CATEGORIES = [
  { id: '식당', name: '식당', icon: UtensilsCrossed, color: 'bg-red-500' },
  { id: '교회', name: '교회', icon: Church, color: 'bg-purple-500' },
  { id: '병원', name: '병원', icon: Heart, color: 'bg-blue-500' },
  { id: '미용실', name: '미용실', icon: Scissors, color: 'bg-pink-500' },
  { id: '부동산', name: '부동산', icon: HomeIcon, color: 'bg-green-500' },
  { id: '법률/회계', name: '법률', icon: Scale, color: 'bg-indigo-500' },
  { id: '자동차', name: '자동차', icon: Car, color: 'bg-orange-500' },
  { id: '학원', name: '학원', icon: GraduationCap, color: 'bg-yellow-500' },
  { id: '한인마트', name: '마트', icon: ShoppingCart, color: 'bg-teal-500' },
];

const POPULAR_SEARCH_TAGS = [
  { label: "한식당", category: "식당" },
  { label: "미용실", category: "미용실" },
  { label: "교회",   category: "교회" },
  { label: "정비소", category: "자동차" },
  { label: "병원",   category: "병원" },
  { label: "부동산", category: "부동산" },
  { label: "학원",   category: "학원" },
  { label: "한인마트", category: "한인마트" },
];

// Charts Preview Component
function ChartsPreview() {
  const [chartsData, setChartsData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const chartTypes = [
    { id: 'drama', label: '드라마', icon: Tv, color: 'from-blue-500 to-blue-600' },
    { id: 'music', label: '음악', icon: Music, color: 'from-green-500 to-green-600' },
    { id: 'movie', label: '영화', icon: Film, color: 'from-purple-500 to-purple-600' },
    { id: 'netflix', label: '넷플릭스', icon: Tv, color: 'from-red-500 to-red-600' },
  ];

  useEffect(() => {
    const fetchChartPreview = async () => {
      try {
        const promises = chartTypes.map(type =>
          fetch(`/api/categories?action=charts&type=${type.id}`)
            .then(res => res.json())
            .catch(() => ({ success: false, data: [] }))
        );
        
        const results = await Promise.all(promises);
        const chartsObj: any = {};
        
        results.forEach((result, index) => {
          if (result.success && result.data && result.data.length > 0) {
            chartsObj[chartTypes[index].id] = result.data[0]; // Get #1 from each chart
          }
        });
        
        setChartsData(chartsObj);
      } catch (error) {
        console.error('Failed to fetch charts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChartPreview();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </section>
    );
  }

  if (Object.keys(chartsData).length === 0) {
    return null; // Don't show section if no data
  }

  return (
    <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <h2 className="text-xl md:text-4xl font-bold">🏆 인기 차트</h2>
          </div>
          <p className="text-slate-600 text-lg">지금 가장 핫한 드라마, 음악, 영화를 확인하세요!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {chartTypes.map((chart) => {
            const chartItem = chartsData[chart.id];
            const IconComponent = chart.icon;
            
            if (!chartItem) return null;

            return (
              <Card key={chart.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer">
                <CardContent className="p-0">
                  {/* YouTube Thumbnail */}
                  {chartItem.thumbnail_url && (
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={chartItem.thumbnail_url} 
                        alt={chartItem.title_ko}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          // Fallback to gradient background if image fails
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent`}></div>
                      <div className="absolute top-4 right-4 bg-white/90 rounded-full px-3 py-1">
                        <span className="text-lg font-bold text-slate-800">#1</span>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <div className="flex items-center gap-2 mb-2">
                          <IconComponent className="w-5 h-5" />
                          <span className="text-sm font-medium">{chart.label}</span>
                        </div>
                        <h3 className="font-bold text-lg line-clamp-2 mb-1">{chartItem.title_ko}</h3>
                        <p className="text-sm opacity-90 line-clamp-1">{chartItem.artist}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Fallback gradient if no thumbnail */}
                  {!chartItem.thumbnail_url && (
                    <div className={`bg-gradient-to-r ${chart.color} p-6 text-white relative overflow-hidden`}>
                      <div className="absolute -top-4 -right-4 opacity-20 transform group-hover:scale-110 transition-transform">
                        <IconComponent className="w-20 h-20" />
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium opacity-90">{chart.label}</span>
                          <div className="bg-white/20 rounded-full px-3 py-1">
                            <span className="text-lg font-bold">#1</span>
                          </div>
                        </div>
                        <h3 className="font-bold text-lg line-clamp-2 mb-1">{chartItem.title_ko}</h3>
                        <p className="text-sm opacity-90 line-clamp-1">{chartItem.artist}</p>
                      </div>
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span className="bg-slate-100 px-2 py-1 rounded-full text-xs font-medium">
                        {chartItem.platform}
                      </span>
                      {chartItem.score && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{chartItem.score}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{chartItem.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Link href="/charts">
            <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white gap-2">
              <Trophy className="h-5 w-5" />
              전체 차트 보기
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const [visitorStats, setVisitorStats] = useState<{
    todayViews: number;
    todayUnique: number;
    totalViews: number;
    totalUnique: number;
  } | null>(null);
  const { data: featuredBusinesses, isLoading: loadingFeatured } = useFeaturedBusinesses();
  const { data: newsItems, isLoading: loadingNews } = useNews();
  const { data: blogPosts, isLoading: loadingBlogs } = useBlogs({ limit: 3 });
  const { data: listingsData, isLoading: loadingListings } = useListings({ limit: 6 });
  const { data: categories } = useCategories();
  
  // Fetch random restaurant for "Restaurant of the Day"
  const [restaurantOfDay, setRestaurantOfDay] = useState<any>(null);
  useEffect(() => {
    const fetchRandomRestaurant = async () => {
      try {
        // 구글 리뷰 많은 순 top 20 가져와서 한인 식당(한국어 이름 있는 곳)만 필터 → 랜덤 선택
        const response = await fetch('/api/businesses?category=식당&sort=reviews&limit=20');
        if (response.ok) {
          const data = await response.json();
          if (data.businesses && data.businesses.length > 0) {
            const koreanRegex = /[가-힣]/;
            const koreanRestaurants = data.businesses.filter((b: any) =>
              koreanRegex.test(b.name_ko || '') || koreanRegex.test(b.name_en || '')
            );
            const pool = koreanRestaurants.length > 0 ? koreanRestaurants : data.businesses;
            const randomIndex = Math.floor(Math.random() * pool.length);
            setRestaurantOfDay(pool[randomIndex]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch restaurant:', error);
      }
    };
    fetchRandomRestaurant();
  }, []);

  // Fetch popular community posts
  const [popularPosts, setPopularPosts] = useState<any[]>([]);
  const [loadingCommunity, setLoadingCommunity] = useState(true);
  useEffect(() => {
    const fetchPopularPosts = async () => {
      try {
        const response = await fetch('/api/community?action=posts&sort=popular&limit=5');
        if (response.ok) {
          const data = await response.json();
          setPopularPosts(data.posts || []);
        }
      } catch (error) {
        console.error('Failed to fetch community posts:', error);
      } finally {
        setLoadingCommunity(false);
      }
    };
    fetchPopularPosts();
  }, []);

  // Fetch hot deals
  const [hotDeals, setHotDeals] = useState<any[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(true);
  useEffect(() => {
    const fetchHotDeals = async () => {
      try {
        const response = await fetch('/api/deals?limit=6');
        if (response.ok) {
          const deals = await response.json();
          setHotDeals(deals || []);
        }
      } catch (error) {
        console.error('Failed to fetch hot deals:', error);
      } finally {
        setLoadingDeals(false);
      }
    };
    fetchHotDeals();
  }, []);

  // 방문자 카운터 API 호출
  useEffect(() => {
    const recordVisit = async () => {
      try {
        const response = await fetch('/api/categories?action=visit&page=/');
        if (response.ok) {
          const stats = await response.json();
          // Only set if it has the expected shape
          if (stats && typeof stats.todayUnique === 'number') {
            setVisitorStats(stats);
          }
        }
      } catch (error) {
        console.error('Failed to record visit:', error);
      }
    };
    
    recordVisit();
  }, []);

  // Autocomplete search with debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setShowAutocomplete(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const results = await response.json();
          setSearchResults(results.slice(0, 5));
          setShowAutocomplete(true);
        }
      } catch (error) {
        console.error('Failed to fetch search results:', error);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Close autocomplete on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const featured = featuredBusinesses?.slice(0, 6) ?? [];
  const recentNews = newsItems?.slice(0, 3) ?? [];
  const recentBlogs = blogPosts?.slice(0, 3) ?? [];
  const recentListings = listingsData?.items ?? [];
  const trending: any[] = [];
  const recent: any[] = [];
  const popularSearches: any[] = [];

  // Get count for each category
  const getCategoryCount = (categoryId: string) => {
    if (!categories) return null;
    const found = categories.find(c => c.category === categoryId);
    return found ? found.count : null;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && searchResults[selectedIndex]) {
      // Navigate to selected result
      setLocation(`/business/${searchResults[selectedIndex].id}`);
      setShowAutocomplete(false);
    } else if (searchQuery.trim()) {
      setLocation(`/businesses?search=${encodeURIComponent(searchQuery)}`);
      setShowAutocomplete(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showAutocomplete || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Escape') {
      setShowAutocomplete(false);
      setSelectedIndex(-1);
    }
  };

  const handleResultClick = (businessId: string) => {
    setLocation(`/business/${businessId}`);
    setShowAutocomplete(false);
    setSearchQuery('');
  };

  const handleCategoryClick = (categoryId: string) => {
    setLocation(`/businesses?category=${encodeURIComponent(categoryId)}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative h-[600px] flex items-center justify-center bg-cover bg-center"
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.55)), url(https://images.unsplash.com/photo-1545194445-dddb8f4487c6?w=1600&q=80)` 
        }}
      >
        <div className="container mx-auto px-4 text-center text-white">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            DFW 한인 커뮤니티의 모든 것
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto text-slate-200">
            달라스-포트워스 지역 {1210}개 한인 업체 정보와 최신 한인 뉴스
          </p>
          
          {/* Big Search Bar with Autocomplete */}
          <div ref={searchRef} className="max-w-4xl mx-auto relative">
            <form onSubmit={handleSearch}>
              <div className="bg-white rounded-2xl p-3 flex gap-3 shadow-2xl hover:shadow-3xl transition-shadow">
                <div className="flex-1 flex items-center px-5">
                  <Search className="h-7 w-7 text-slate-400 mr-4 flex-shrink-0" />
                  <Input 
                    className="border-0 shadow-none focus-visible:ring-0 text-xl text-slate-800 h-16 placeholder:text-slate-400" 
                    placeholder="달라스 한인 맛집 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => searchQuery.length >= 2 && searchResults.length > 0 && setShowAutocomplete(true)}
                  />
                </div>
                <Button type="submit" size="lg" className="h-16 px-12 text-xl font-semibold">
                  검색
                </Button>
              </div>
            </form>

            {/* Autocomplete Dropdown */}
            {showAutocomplete && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl overflow-hidden z-50 border border-gray-200">
                {searchResults.map((result, index) => (
                  <button
                    key={result.id}
                    className={`w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors border-b last:border-0 ${
                      index === selectedIndex ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleResultClick(result.id)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {result.category && (
                          <Badge variant="secondary" className="text-xs">
                            {result.category}
                          </Badge>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">
                          {result.name_ko || result.name_en}
                        </div>
                        {result.address && (
                          <div className="text-sm text-gray-500 truncate flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {result.address}
                          </div>
                        )}
                      </div>
                      {result.rating && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{result.rating}</span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Popular Search Tags */}
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            {POPULAR_SEARCH_TAGS.map((tag) => (
              <button
                key={tag.category}
                onClick={() => setLocation(`/businesses?category=${encodeURIComponent(tag.category)}`)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium text-white transition-all hover:scale-105"
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Visitor Counter */}
      {visitorStats && (
        <section className="py-4 bg-slate-100 border-y border-slate-200">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap gap-6 justify-center items-center text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-semibold">총 {(1210).toLocaleString()}개 업체</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-slate-300"></div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span>오늘 <span className="font-bold text-blue-600">{visitorStats.todayUnique.toLocaleString()}</span>명 방문</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-slate-300"></div>
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-600" />
                <span>총 <span className="font-bold text-orange-600">{visitorStats.totalViews.toLocaleString()}</span>회 방문</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Categories Grid - WITH COUNTS */}
      <section className="py-8 md:py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-6 md:mb-10">인기 카테고리</h2>
          {/* 모바일: 가로 슬라이드 / 데스크탑: 그리드 */}
          <div className="flex md:hidden overflow-x-auto gap-3 pb-2 scrollbar-hide -mx-4 px-4">
            {CATEGORIES.map((category) => {
              const IconComponent = category.icon;
              const count = getCategoryCount(category.id);
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="bg-white rounded-xl p-3 flex-shrink-0 flex flex-col items-center justify-center gap-2 group shadow-sm w-20"
                >
                  <div className={`${category.color} w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <span className="font-semibold text-xs text-slate-800 block leading-tight text-center">{category.name}</span>
                  {count !== null && count > 0 && (
                    <span className="text-[10px] text-slate-400 -mt-1 block">({count})</span>
                  )}
                </button>
              );
            })}
          </div>
          {/* 데스크탑: 그리드 */}
          <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
            {CATEGORIES.map((category) => {
              const IconComponent = category.icon;
              const count = getCategoryCount(category.id);
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="bg-white rounded-xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col items-center justify-center gap-4 group"
                >
                  <div className={`${category.color} w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-center">
                    <span className="font-semibold text-lg text-slate-800 block">{category.name}</span>
                    {count !== null && count > 0 && (
                      <span className="text-sm text-slate-500 mt-1 block">({count})</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Restaurant of the Day */}
      {restaurantOfDay && (
        <section className="py-16 bg-gradient-to-r from-orange-50 to-red-50">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm mb-4">
                  <UtensilsCrossed className="h-5 w-5 text-orange-600" />
                  <span className="font-bold text-orange-600">오늘의 맛집</span>
                </div>
                <h2 className="text-3xl font-bold mb-2">이 주의 추천 레스토랑</h2>
                <p className="text-slate-600">DalKonnect가 추천하는 특별한 맛집을 소개합니다</p>
              </div>
              
              <Card className="overflow-hidden hover:shadow-2xl transition-shadow">
                <div className="grid md:grid-cols-2 gap-0">
                  {/* Image */}
                  <div className="relative h-64 md:h-auto">
                    {hasValidImage(restaurantOfDay.cover_url) ? (
                      <div 
                        className="w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${proxyPhotoUrl(restaurantOfDay.cover_url) || restaurantOfDay.cover_url})` }}
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${getCategoryColor(restaurantOfDay.category)} flex items-center justify-center`}>
                        <UtensilsCrossed className="w-24 h-24 text-white/80" />
                      </div>
                    )}
                    {restaurantOfDay.featured && (
                      <Badge className="absolute top-4 right-4 bg-orange-600">⭐ 추천</Badge>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-8 flex flex-col justify-center">
                    <Badge variant="secondary" className="w-fit mb-4">
                      {restaurantOfDay.category}
                    </Badge>
                    <h3 className="text-3xl font-bold mb-2 font-ko">
                      {restaurantOfDay.name_ko || restaurantOfDay.name_en}
                    </h3>
                    {restaurantOfDay.name_ko && restaurantOfDay.name_en && (
                      <p className="text-lg text-slate-500 mb-4">{restaurantOfDay.name_en}</p>
                    )}
                    
                    {restaurantOfDay.description && (
                      <p className="text-slate-700 mb-4 line-clamp-3">{restaurantOfDay.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 mb-4">
                      {restaurantOfDay.rating && (
                        <div className="flex items-center gap-2">
                          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          <span className="text-xl font-bold">{restaurantOfDay.rating}</span>
                          <span className="text-slate-500">({restaurantOfDay.review_count || 0} 리뷰)</span>
                        </div>
                      )}
                    </div>
                    
                    {restaurantOfDay.address && (
                      <div className="flex items-start gap-2 text-slate-600 mb-6">
                        <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <span>{restaurantOfDay.address}</span>
                      </div>
                    )}
                    
                    <Link href={`/business/${restaurantOfDay.id}`}>
                      <Button size="lg" className="w-full md:w-auto bg-orange-600 hover:bg-orange-700">
                        자세히 보기
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Popular Searches */}
      <section className="py-16 bg-white border-y">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="font-bold text-primary">인기 검색어</span>
            </div>
            <h2 className="text-3xl font-bold mb-3">많이 찾는 검색어</h2>
            <p className="text-slate-600 mb-8">다른 사용자들이 자주 검색하는 키워드입니다</p>
            <div className="flex flex-wrap justify-center gap-3">
              {POPULAR_SEARCH_TAGS.map((tag, index) => (
                <button
                  key={tag.category}
                  onClick={() => setLocation(`/businesses?category=${encodeURIComponent(tag.category)}`)}
                  className="group relative inline-flex items-center gap-2 px-6 py-3 bg-slate-50 hover:bg-primary hover:text-white rounded-full text-sm font-medium transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  <span className="text-lg font-bold text-slate-400 group-hover:text-white/70">
                    {index + 1}
                  </span>
                  <span>{tag.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trending Businesses - NEW */}
      {trending.length > 0 && (
        <section className="py-20 bg-gradient-to-b from-primary/5 to-white">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-12">
              <div className="flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-primary" />
                <div>
                  <h2 className="text-xl md:text-4xl font-bold">이번 주 인기 업체</h2>
                  <p className="text-slate-600 mt-1">높은 평점과 많은 리뷰를 받은 업체들</p>
                </div>
              </div>
              <Link href="/businesses?sort=rating">
                <Button variant="ghost" className="gap-2">
                  전체 보기 <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {false ? (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-0">
                      <Skeleton className="w-full h-48" />
                      <div className="p-6 space-y-3">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
                {trending.slice(0, 6).map((business) => (
                  <BusinessCard key={business.id} business={business} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Latest News */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-4xl font-bold">최신 뉴스</h2>
            <Link href="/news">
              <Button variant="ghost" className="gap-2">
                전체 보기 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loadingNews ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-0">
                    <Skeleton className="w-full h-48" />
                    <div className="p-6 space-y-3">
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8">
              {recentNews.map((news) => {
                const categoryStyle = getNewsCategoryStyle(news.category);
                return (
                  <Link key={news.id} href={`/news/${news.id}`}>
                    <Card className="overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group rounded-xl">
                      <CardContent className="p-0">
                        {hasValidImage(news.thumbnail_url) ? (
                          <div 
                            className="w-full h-48 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                            style={{ backgroundImage: `url(${news.thumbnail_url})` }}
                          />
                        ) : (
                          <div className={`w-full h-48 bg-gradient-to-br ${categoryStyle.gradient} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
                            <span className="text-7xl">{categoryStyle.emoji}</span>
                          </div>
                        )}
                        <div className="p-6">
                          <Badge variant="secondary" className="mb-3">
                            {news.category || '뉴스'}
                          </Badge>
                          <h3 className="text-lg font-bold text-slate-800 group-hover:text-primary transition-colors line-clamp-2 mb-2 font-ko">
                            {news.title}
                          </h3>
                          <p className="text-sm text-slate-600 line-clamp-2">{news.content}</p>
                          <p className="text-xs text-slate-400 mt-3">
                            {news.source} • {new Date(news.published_date).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Charts Section */}
      <ChartsPreview />

      {/* Featured Businesses */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-xl md:text-4xl font-bold">추천 업체</h2>
            <Link href="/businesses?featured=true">
              <Button variant="ghost" className="gap-2">
                전체 보기 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loadingFeatured ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardContent className="p-0">
                    <Skeleton className="w-full h-48" />
                    <div className="p-6 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
              {featured.map((business) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recent Businesses - NEW */}
      {recent.length > 0 && (
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-12">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-primary" />
                <div>
                  <h2 className="text-xl md:text-4xl font-bold">신규 등록 업체</h2>
                  <p className="text-slate-600 mt-1">최근 DalKonnect에 추가된 업체들</p>
                </div>
              </div>
              <Link href="/businesses?sort=recent">
                <Button variant="ghost" className="gap-2">
                  전체 보기 <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {false ? (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-0">
                      <Skeleton className="w-full h-48" />
                      <div className="p-6 space-y-3">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
                {recent.slice(0, 6).map((business) => (
                  <BusinessCard key={business.id} business={business} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Hot Deals Section */}
      <section className="py-20 bg-gradient-to-r from-red-50 to-orange-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-3">
              <Flame className="h-8 w-8 text-red-500" />
              <div>
                <h2 className="text-xl md:text-4xl font-bold">🔥 오늘의 핫딜</h2>
                <p className="text-slate-600 mt-1">DFW 한인들을 위한 최고의 딜과 쿠폰!</p>
              </div>
            </div>
            <Link href="/deals">
              <Button className="bg-red-600 hover:bg-red-700 gap-2">
                <Flame className="h-4 w-4" />
                모든 딜 보기
              </Button>
            </Link>
          </div>

          {loadingDeals ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-3" />
                    <Skeleton className="h-8 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : hotDeals.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
              {hotDeals.slice(0, 3).map((deal) => {
                const isHot = deal.likes > 200;
                const isFree = (deal.discount ?? '').includes('FREE') || deal.deal_price === 'FREE';
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
                const timeRemaining = getTimeRemaining(deal.expires_at || null);

                return (
                  <Card key={deal.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden relative cursor-pointer" 
                        onClick={() => window.open(deal.deal_url, '_blank')}>
                    {/* Hot/Free badges */}
                    <div className="absolute top-3 left-3 z-10 flex gap-2">
                      {isHot && (
                        <Badge variant="destructive" className="bg-red-500 text-white font-bold text-xs">
                          <Flame className="w-3 h-3 mr-1" />
                          HOT
                        </Badge>
                      )}
                      {isFree && (
                        <Badge className="bg-green-500 text-white font-bold text-xs">
                          <Gift className="w-3 h-3 mr-1" />
                          FREE
                        </Badge>
                      )}
                    </div>
                    
                    {/* Discount badge */}
                    <div className="absolute top-3 right-3 z-10">
                      <Badge variant="destructive" className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold px-2 py-1">
                        {deal.discount}
                      </Badge>
                    </div>
                    
                    <CardContent className="p-0">
                      {/* Image/Gradient */}
                      <div 
                        className="h-40 bg-gradient-to-br from-blue-100 to-purple-100 bg-cover bg-center relative"
                        style={{ backgroundImage: `url(${deal.image_url})` }}
                      >
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                      </div>
                      
                      <div className="p-4">
                        {/* Store name */}
                        <div className="text-sm font-medium text-gray-700 mb-1">{deal.store}</div>
                        
                        {/* Title */}
                        <h3 className="font-bold text-lg mb-2 line-clamp-2 min-h-[3.5rem]">{deal.title}</h3>
                        
                        {/* Price section */}
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-gray-500 line-through text-sm">{deal.original_price}</span>
                            <span className="text-red-600 font-bold text-xl">{deal.deal_price}</span>
                          </div>
                          
                          {/* Coupon code */}
                          {deal.coupon_code && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded px-2 py-1 text-xs">
                              <span className="text-yellow-800">쿠폰: </span>
                              <span className="font-mono font-bold text-yellow-900">{deal.coupon_code}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Expiry and likes */}
                        <div className="flex items-center justify-between text-sm">
                          {timeRemaining.text && (
                            <div className={`flex items-center gap-1 ${timeRemaining.isUrgent ? 'text-red-600' : 'text-gray-600'}`}>
                              <Clock className="w-3 h-3" />
                              {timeRemaining.isUrgent && <span className="text-red-500 font-bold">🔴</span>}
                              <span className="text-xs">{timeRemaining.text}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1 text-gray-600">
                            <Heart className="w-3 h-3" />
                            <span className="text-xs">{deal.likes}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {!loadingDeals && hotDeals.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔥</div>
              <p className="text-gray-500 text-lg">아직 등록된 딜이 없습니다.</p>
              <p className="text-gray-400">곧 멋진 딜들을 준비해드릴게요!</p>
            </div>
          )}
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-2">블로그</h2>
              <p className="text-slate-600">DFW 한인 생활 가이드와 유용한 팁</p>
            </div>
            <Link href="/blog">
              <Button variant="ghost" className="gap-2">
                전체 보기 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loadingBlogs ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-0">
                    <Skeleton className="w-full h-48" />
                    <div className="p-6 space-y-3">
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recentBlogs.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8">
              {recentBlogs.map((blog) => {
                const categoryStyle = getBlogCategoryStyle(blog.category);
                return (
                  <Link key={blog.id} href={`/blog/${blog.slug}`}>
                    <Card className="overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group rounded-xl">
                      <CardContent className="p-0">
                        {blog.cover_image || blog.cover_url ? (
                          <div 
                            className="w-full h-48 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                            style={{ backgroundImage: `url(${blog.cover_image || blog.cover_url})` }}
                          />
                        ) : (
                          <div className={`w-full h-48 bg-gradient-to-br ${categoryStyle.gradient} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
                            <span className="text-7xl">{categoryStyle.emoji}</span>
                          </div>
                        )}
                        <div className="p-6">
                          {blog.category && (
                            <Badge variant="secondary" className="mb-3">
                              {blog.category}
                            </Badge>
                          )}
                          <h3 className="text-lg font-bold text-slate-800 group-hover:text-primary transition-colors line-clamp-2 mb-2 font-ko">
                            {blog.title}
                          </h3>
                          {blog.excerpt && (
                            <p className="text-sm text-slate-600 line-clamp-2">{blog.excerpt}</p>
                          )}
                          <p className="text-xs text-slate-400 mt-3">
                            {blog.author} • {new Date(blog.published_at).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Recent Marketplace Listings */}
      <section className="py-20 bg-gradient-to-b from-green-50 to-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-8 w-8 text-green-600" />
              <div>
                <h2 className="text-4xl font-bold">최근 올라온 매물</h2>
                <p className="text-slate-600 mt-1">DFW 한인 커뮤니티 사고팔기</p>
              </div>
            </div>
            <Link href="/marketplace">
              <Button variant="ghost" className="gap-2">
                전체 보기 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loadingListings ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-full mb-3" />
                    <Skeleton className="h-8 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recentListings.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentListings.map((listing) => {
                const date = new Date(listing.created_at);
                const now = new Date();
                const diffMs = now.getTime() - date.getTime();
                const diffMins = Math.floor(diffMs / (1000 * 60));
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                
                let timeAgo = '';
                if (diffMins < 60) timeAgo = `${diffMins}분 전`;
                else if (diffHours < 24) timeAgo = `${diffHours}시간 전`;
                else if (diffDays === 1) timeAgo = '어제';
                else if (diffDays < 7) timeAgo = `${diffDays}일 전`;
                else timeAgo = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
                
                return (
                  <Link key={listing.id} href={`/marketplace/${listing.id}`}>
                    <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group h-full rounded-xl">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-4 flex-wrap">
                          <Badge variant="outline" className="text-xs font-medium">
                            {listing.category}
                          </Badge>
                          {listing.price_type === 'free' && (
                            <Badge className="bg-green-600 hover:bg-green-700 text-xs">
                              🎁 무료나눔
                            </Badge>
                          )}
                          {listing.price && listing.price !== '0' && (
                            <Badge className="bg-blue-600 hover:bg-blue-700 text-xs">
                              협상가능
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="font-bold text-xl mb-3 line-clamp-2 group-hover:text-primary transition-colors min-h-[3.5rem] font-ko">
                          {listing.title}
                        </h3>
                        
                        <div className="text-3xl font-bold mb-4" style={{ color: listing.price_type === 'free' ? '#16a34a' : '#2563EB' }}>
                          {listing.price_type === 'free' ? '무료' : 
                           listing.price_type === 'contact' ? '가격문의' :
                           listing.price ? `$${parseFloat(listing.price).toLocaleString()}` : '가격협의'}
                        </div>
                        
                        <p className="text-sm text-slate-600 line-clamp-2 mb-4 min-h-[2.5rem]">
                          {listing.description || '설명 없음'}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t">
                          <div className="flex items-center gap-1 font-medium">
                            <MapPin className="w-3.5 h-3.5" />
                            {listing.location || '위치 미정'}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              {listing.views || 0}
                            </div>
                            <div className="flex items-center gap-1 font-medium text-primary">
                              <Clock className="w-3.5 h-3.5" />
                              {timeAgo}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="text-center mt-8">
            <Link href="/marketplace/new">
              <Button size="lg" className="gap-2">
                <ShoppingBag className="h-5 w-5" />
                무료로 올리기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl font-bold flex items-center gap-3">
                <span className="text-2xl">🔥</span> 커뮤니티 인기글
              </h2>
              <p className="text-slate-600 mt-2">달라스 한인들이 함께 나누는 이야기</p>
            </div>
            <Link href="/community">
              <Button variant="ghost" className="gap-2">
                전체 보기 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loadingCommunity ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-full" />
                      </div>
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : popularPosts.length > 0 ? (
            <div className="space-y-3">
              {popularPosts.map((post, index) => (
                <Link key={post.id} href={`/community/${post.id}`}>
                  <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-primary text-white text-sm font-bold rounded-full flex-shrink-0">
                              {index + 1}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {post.category}
                            </Badge>
                            {post.is_pinned && (
                              <Badge variant="secondary" className="text-xs">
                                <Flame className="w-3 h-3 mr-1" />
                                공지
                              </Badge>
                            )}
                          </div>
                          
                          <h3 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                          
                          <div className="flex items-center text-sm text-slate-600 space-x-4">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {post.nickname}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4" />
                              {post.comment_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-4 h-4" />
                              {post.likes}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {post.views}
                            </span>
                            <span className="text-xs text-slate-500">
                              {new Date(post.created_at).toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">아직 커뮤니티 글이 없습니다</p>
                <Link href="/community/new">
                  <Button>첫 번째 글 작성하기</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {popularPosts.length > 0 && (
            <div className="text-center mt-8">
              <Link href="/community">
                <Button size="lg" variant="outline" className="gap-2">
                  <MessageCircle className="h-5 w-5" />
                  커뮤니티 둘러보기
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <NewsletterSignup />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">업체를 운영하시나요?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            DalKonnect에 등록하고 더 많은 고객을 만나세요
          </p>
          <Link href="/pricing">
            <Button size="lg" variant="secondary" className="h-14 px-10 text-lg">
              비즈니스 등록하기
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
