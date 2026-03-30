import { Link, useLocation } from "wouter";
import { Search, MapPin, Star, ArrowRight, UtensilsCrossed, Church, Heart, Scissors, Home as HomeIcon, Scale, Car, GraduationCap, ShoppingCart, BookOpen, TrendingUp, Sparkles, Clock, ShoppingBag, Eye, Calendar, Phone, Users, Flame, MessageCircle, Trophy, Music, Film, Tv, Gift, Sun, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
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
import { AdBanner } from "@/components/AdBanner";

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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {chartTypes.map((chart) => {
            const chartItem = chartsData[chart.id];
            const IconComponent = chart.icon;
            
            if (!chartItem) return null;

            return (
              <Card key={chart.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer">
                <CardContent className="p-0">
                  {/* YouTube Thumbnail */}
                  {chartItem.thumbnail_url && (
                    <div className="relative h-36 md:h-48 overflow-hidden">
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
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<'trending' | 'news' | 'community' | 'deals'>('trending');
  const [carouselBizIdx, setCarouselBizIdx] = useState(0);
  const [grandOpeningBiz, setGrandOpeningBiz] = useState<any[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const [visitorStats, setVisitorStats] = useState<{
    todayViews: number;
    todayUnique: number;
    totalViews: number;
    totalUnique: number;
  } | null>(null);
  const { data: featuredBusinesses, isLoading: loadingFeatured } = useFeaturedBusinesses();
  // 헤드라인 우선 카테고리 순서로 뉴스 가져오기
  const { data: newsItems, isLoading: loadingNews } = useNews({ limit: 60 });
  const { data: blogPosts, isLoading: loadingBlogs } = useBlogs({ limit: 4 });
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
              (koreanRegex.test(b.name_ko || '') || koreanRegex.test(b.name_en || '')) && b.cover_url
            );
            const withImage = koreanRestaurants.length > 0 ? koreanRestaurants : data.businesses.filter((b: any) => b.cover_url);
            const pool = withImage.length > 0 ? withImage : data.businesses;
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
        const response = await fetch('/api/community?action=posts&sort=popular&limit=8');
        if (response.ok) {
          const data = await response.json();
          setPopularPosts(data.posts || data.data || []);
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
        const response = await fetch('/api/deals?limit=6&sort=hot');
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

  // Grand opening businesses (newest first)
  useEffect(() => {
    fetch('/api/businesses?sort=recent&limit=3')
      .then(r => r.ok ? r.json() : { businesses: [] })
      .then(d => setGrandOpeningBiz(d.businesses || []))
      .catch(() => {});
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

  // Featured carousel auto-advance every 5s
  const allFeaturedRef = useRef<any[]>([]);
  useEffect(() => {
    if (allFeaturedRef.current.length === 0) return;
    const t = setInterval(() => setCarouselBizIdx(i => (i + 1) % allFeaturedRef.current.length), 5000);
    return () => clearInterval(t);
  }, []);

  // 추천 업체 랜덤 로테이션 (8초마다 6개 교체)
  const [featuredSlot, setFeaturedSlot] = useState(0);
  const allFeatured = featuredBusinesses ?? [];
  // keep ref in sync for carousel auto-scroll
  allFeaturedRef.current = allFeatured;
  useEffect(() => {
    if (allFeatured.length <= 6) return;
    const t = setInterval(() => setFeaturedSlot(s => s + 1), 8000);
    return () => clearInterval(t);
  }, [allFeatured.length]);
  // 3등분 — 각 배너 타입이 겹치지 않는 업체 풀 사용
  const { leaderboardPool, leaderboard2Pool, infeedPool } = useMemo(() => {
    if (allFeatured.length === 0) return { leaderboardPool: [], leaderboard2Pool: [], infeedPool: [] };
    const f = [...allFeatured];
    // 3등분: 배너1(0-19) | 배너2(20-39) | 그리드(40+)
    return {
      leaderboardPool:  f.slice(0, 20),
      leaderboard2Pool: f.slice(20, 40),
      infeedPool:       f.slice(40),
    };
  }, [allFeatured]);

  const shuffledFeatured = useMemo(() => {
    const arr = infeedPool.length > 0 ? [...infeedPool] : [...allFeatured];
    if (arr.length === 0) return [];
    const offset = (featuredSlot * 6) % arr.length;
    return [...arr.slice(offset), ...arr.slice(0, offset)].slice(0, 6);
  }, [allFeatured, infeedPool, featuredSlot]);
  const featured = shuffledFeatured;
  // Reddit 제외 + 카테고리별 2개씩 그룹핑
  const NEWS_CATS = [
    { key: '로컬뉴스', label: '🏙️ 로컬뉴스' },
    { key: '미국뉴스', label: '🇺🇸 미국뉴스' },
    { key: '스포츠',   label: '⚽ 스포츠' },
    { key: 'K-POP',   label: '🎵 K-POP' },
    { key: '이민/비자', label: '📋 이민·비자' },
    { key: '세금/재정', label: '💰 세금·재정' },
    { key: '한국뉴스', label: '🇰🇷 한국뉴스' },
    { key: '월드뉴스', label: '🌍 월드뉴스' },
  ];
  const isReddit = (n: any) => n.source?.startsWith('r/') || n.category === '달라스';
  const newsByCat = (() => {
    if (!newsItems) return [];
    const filtered = newsItems.filter((n: any) => !isReddit(n));
    return NEWS_CATS.map(cat => ({
      ...cat,
      items: filtered.filter((n: any) => n.category === cat.key).slice(0, 2),
    })).filter(cat => cat.items.length > 0);
  })();
  const recentNews = newsByCat.flatMap(c => c.items).slice(0, 8);
  const recentBlogs = blogPosts?.slice(0, 4) ?? [];
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
      {/* Hero Section — 100vw 탈출 (사이드 광고 컬럼 무시) */}
      <section
        className="relative h-[240px] md:h-[600px] flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.55)), url(https://images.unsplash.com/photo-1545194445-dddb8f4487c6?w=1600&q=80)`,
          width: '100vw',
          marginLeft: 'calc(50% - 50vw)',
        }}
      >
        <div className="container mx-auto px-4 text-center text-white">
          <h1 className="text-2xl md:text-7xl font-bold mb-2 md:mb-6">
            DFW 한인 커뮤니티의 모든 것
          </h1>
          <p className="hidden md:block text-xl md:text-2xl mb-10 max-w-3xl mx-auto text-slate-200">
            달라스-포트워스 지역 {1210}개 한인 업체 정보와 최신 한인 뉴스
          </p>

          {/* Big Search Bar with Autocomplete */}
          <div ref={searchRef} className="max-w-4xl mx-auto relative mt-2 md:mt-0">
            <form onSubmit={handleSearch}>
              <div className="bg-white rounded-xl md:rounded-2xl p-1.5 md:p-3 flex gap-2 md:gap-3 shadow-2xl hover:shadow-3xl transition-shadow">
                <div className="flex-1 flex items-center px-3 md:px-5">
                  <Search className="h-5 w-5 md:h-7 md:w-7 text-slate-400 mr-2 md:mr-4 flex-shrink-0" />
                  <Input
                    className="border-0 shadow-none focus-visible:ring-0 text-base md:text-xl text-slate-800 h-10 md:h-16 placeholder:text-slate-400"
                    placeholder="달라스 한인 맛집 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                      setSearchFocused(true);
                      if (searchQuery.length >= 2 && searchResults.length > 0) setShowAutocomplete(true);
                    }}
                    onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  />
                </div>
                <Button type="submit" size="lg" className="h-10 md:h-16 px-5 md:px-12 text-sm md:text-xl font-semibold">
                  검색
                </Button>
              </div>
            </form>

            {/* Popular suggestions when focused with empty query */}
            {searchFocused && !searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl overflow-hidden z-50 border border-gray-200 p-4">
                <p className="text-xs text-slate-400 font-semibold mb-3 uppercase tracking-wide">인기 검색어</p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCH_TAGS.map(tag => (
                    <button
                      key={tag.category}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSearchQuery(tag.label);
                        setSearchFocused(false);
                        setLocation(`/businesses?search=${encodeURIComponent(tag.label)}`);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-primary hover:text-white rounded-full text-sm font-medium transition-colors"
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
          <div className="mt-3 md:mt-6 flex flex-wrap gap-2 md:gap-3 justify-center">
            {POPULAR_SEARCH_TAGS.map((tag) => (
              <button
                key={tag.category}
                onClick={() => setLocation(`/businesses?category=${encodeURIComponent(tag.category)}`)}
                className="px-3 md:px-4 py-1 md:py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-xs md:text-sm font-medium text-white transition-all hover:scale-105"
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      </section>



      {/* 히어로 바로 아래 광고 배너 (데스크탑) */}
      {featured.length > 0 && (
        <section className="bg-white pt-4 pb-2 hidden md:block">
          <div className="container mx-auto px-4 max-w-4xl">
            <AdBanner size="leaderboard" businesses={leaderboardPool} />
          </div>
        </section>
      )}

      {/* 모바일 전용: 히어로 아래 가로 스크롤 광고 strip */}
      {leaderboardPool.length > 0 && (
        <section className="md:hidden bg-white py-3">
          <div className="px-3 mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 tracking-wide uppercase">추천 업체</span>
            <span className="text-[10px] text-gray-400 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">광고</span>
          </div>
          <div className="flex gap-3 overflow-x-auto px-3 pb-1 scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
            {leaderboardPool.slice(0, 10).map((biz: any) => {
              const name = biz.name_ko || biz.name_en || '';
              const rating = Number(biz.rating || 0).toFixed(1);
              return (
                <a key={biz.id} href={`/business/${biz.id}`}
                  className="flex-shrink-0 w-[120px] rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-white"
                  style={{ scrollSnapAlign: 'start' }}>
                  {biz.cover_url ? (
                    <div className="h-[80px] w-full relative"
                      style={{ backgroundImage: `url(${biz.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                  ) : (
                    <div className="h-[80px] bg-gradient-to-br from-blue-500 to-indigo-600" />
                  )}
                  <div className="p-2">
                    <p className="text-[11px] font-bold text-gray-800 leading-tight line-clamp-2">{name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">⭐ {rating} · {biz.category}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}





      {/* Tabbed Content Feed */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          {/* Tab Pills — horizontally scrollable on mobile */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3">
            {([
              { key: 'trending', label: '🔥 인기' },
              { key: 'news',     label: '📰 뉴스' },
              { key: 'community',label: '💬 커뮤니티' },
              { key: 'deals',    label: '🏷️ 딜' },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="space-y-0.5">
            {activeTab === 'trending' && (() => {
              const newsSlice = (newsItems ?? []).filter((n: any) => !isReddit(n)).slice(0, 3).map((n: any) => ({ _type: 'news', ...n }));
              const commSlice = popularPosts.slice(0, 2).map((p: any) => ({ _type: 'community', ...p }));
              const items = [...newsSlice, ...commSlice];
              if (items.length === 0) return <div className="py-6 text-center text-slate-400 text-sm">불러오는 중...</div>;
              return (
                <>
                  {items.map((item: any, i: number) => (
                    <Link key={`${item._type}-${item.id}`} href={item._type === 'news' ? `/news/${item.id}` : `/community/${item.id}`}>
                      <div className="flex gap-3 py-2.5 items-start hover:bg-slate-50 rounded-lg px-2 transition-colors cursor-pointer">
                        <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-slate-400 flex-shrink-0 mt-0.5">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item._type === 'news' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                            {item._type === 'news' ? '뉴스' : '커뮤니티'}
                          </span>
                          <p className="text-sm font-semibold text-slate-800 line-clamp-1 mt-0.5">{item.title}</p>
                          <p className="text-xs text-slate-400">{item.source || item.nickname}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                  <div className="pt-2 flex gap-4">
                    <Link href="/news"><span className="text-xs text-primary font-medium hover:underline">뉴스 더보기 →</span></Link>
                    <Link href="/community"><span className="text-xs text-primary font-medium hover:underline">커뮤니티 →</span></Link>
                  </div>
                </>
              );
            })()}

            {activeTab === 'news' && (() => {
              const items = (newsItems ?? []).filter((n: any) => !isReddit(n)).slice(0, 5);
              if (items.length === 0) return <div className="py-6 text-center text-slate-400 text-sm">뉴스를 불러오는 중...</div>;
              return (
                <>
                  {items.map((news: any) => (
                    <Link key={news.id} href={`/news/${news.id}`}>
                      <div className="flex gap-3 py-2.5 items-start hover:bg-slate-50 rounded-lg px-2 transition-colors cursor-pointer">
                        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                          {hasValidImage(news.thumbnail_url) ? (
                            <img src={news.thumbnail_url} alt={news.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-xl">📰</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">{news.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{news.source}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                  <div className="pt-2">
                    <Link href="/news"><span className="text-xs text-primary font-medium hover:underline">전체 뉴스 보기 →</span></Link>
                  </div>
                </>
              );
            })()}

            {activeTab === 'community' && (() => {
              const items = popularPosts.slice(0, 5);
              if (items.length === 0) return <div className="py-6 text-center text-slate-400 text-sm">커뮤니티 글을 불러오는 중...</div>;
              return (
                <>
                  {items.map((post: any, i: number) => (
                    <Link key={post.id} href={`/community/${post.id}`}>
                      <div className="flex gap-3 py-2.5 items-start hover:bg-slate-50 rounded-lg px-2 transition-colors cursor-pointer">
                        <span className="w-6 h-6 flex items-center justify-center text-xs font-bold bg-primary text-white rounded-full flex-shrink-0 mt-0.5">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{post.category}</span>
                          <p className="text-sm font-semibold text-slate-800 line-clamp-1 mt-0.5">{post.title}</p>
                          <div className="flex gap-2 text-xs text-slate-400 mt-0.5">
                            <span>{post.nickname}</span>
                            <span>💬 {post.comment_count}</span>
                            <span>❤️ {post.likes}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  <div className="pt-2">
                    <Link href="/community"><span className="text-xs text-primary font-medium hover:underline">커뮤니티 더보기 →</span></Link>
                  </div>
                </>
              );
            })()}

            {activeTab === 'deals' && (() => {
              const items = hotDeals.slice(0, 5);
              if (items.length === 0) return <div className="py-6 text-center text-slate-400 text-sm">딜을 불러오는 중...</div>;
              return (
                <>
                  {items.map((deal: any) => (
                    <div
                      key={deal.id}
                      className="flex gap-3 py-2.5 items-center cursor-pointer hover:bg-slate-50 rounded-lg px-2 transition-colors"
                      onClick={() => deal.deal_url && window.open(deal.deal_url, '_blank')}
                    >
                      <div
                        className="w-14 h-14 rounded-lg flex-shrink-0 bg-gradient-to-br from-red-100 to-orange-100 overflow-hidden"
                        style={deal.image_url ? { backgroundImage: `url(${deal.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-red-500">{deal.discount}</span>
                        <p className="text-sm font-semibold text-slate-800 line-clamp-1">{deal.title}</p>
                        <p className="text-xs text-slate-400">{deal.store} · {deal.deal_price}</p>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2">
                    <Link href="/deals"><span className="text-xs text-primary font-medium hover:underline">전체 딜 보기 →</span></Link>
                  </div>
                </>
              );
            })()}
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
      <section className="py-6 md:py-10 bg-white border-y">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-primary">많이 찾는 검색어</span>
          </div>
          {/* Mobile: icon + label grid */}
          <div className="grid grid-cols-4 gap-2 md:hidden">
            {CATEGORIES.slice(0, 8).map((cat) => {
              const IconComp = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className="flex flex-col items-center gap-1.5 py-3 px-1 bg-slate-50 hover:bg-primary/10 rounded-xl transition-all active:scale-95"
                >
                  <div className={`w-10 h-10 rounded-full ${cat.color} flex items-center justify-center`}>
                    <IconComp className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-slate-700">{cat.name}</span>
                </button>
              );
            })}
          </div>
          {/* Desktop: horizontal pill list */}
          <div className="hidden md:flex gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
            {POPULAR_SEARCH_TAGS.map((tag, index) => (
              <button
                key={tag.category}
                onClick={() => setLocation(`/businesses?category=${encodeURIComponent(tag.category)}`)}
                className="group relative inline-flex items-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-primary hover:text-white rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0"
              >
                <span className="text-xs font-bold text-slate-400 group-hover:text-white/70">
                  {index + 1}
                </span>
                <span>{tag.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Businesses - NEW */}
      {trending.length > 0 && (
        <section className="py-12 bg-gradient-to-b from-primary/5 to-white">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-xl md:text-4xl font-bold">이번 주 인기 업체</h2>
                  <p className="text-xs text-slate-500 mt-0.5 md:mt-1">높은 평점과 많은 리뷰를 받은 업체들</p>
                </div>
              </div>
              <Link href="/businesses?sort=rating">
                <Button variant="ghost" className="gap-1 text-sm">전체 보기 <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {trending.slice(0, 6).map((biz) => (
                <Link key={biz.id} href={`/businesses/${biz.id}`}>
                  <div className="flex gap-3 py-3 items-center hover:bg-slate-50 rounded-lg px-1 transition-colors">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                      {biz.photos?.[0] ? (
                        <img src={biz.photos[0]} alt={biz.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center text-2xl">🏢</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm md:text-base font-bold text-slate-800 truncate">{biz.name}</p>
                      <p className="text-xs md:text-sm text-slate-500 truncate">{biz.category} · {biz.city || biz.address}</p>
                      {biz.rating > 0 && (
                        <p className="text-xs md:text-sm text-amber-500 font-semibold mt-0.5">★ {biz.rating.toFixed(1)}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 광고 배너 — 뉴스 섹션 바로 위 */}
      {featured.length > 0 && (
        <section className="py-4 bg-white border-t border-slate-100">
          <div className="container mx-auto px-4">
            <AdBanner size="leaderboard" businesses={leaderboard2Pool.length > 0 ? leaderboard2Pool : leaderboardPool} />
          </div>
        </section>
      )}

      {/* Latest News — Auto-rotating carousel */}
      <section className="py-12 bg-slate-50 overflow-hidden">
        <style>{`
          @keyframes newsScroll {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .news-carousel-track {
            display: flex;
            gap: 12px;
            width: max-content;
            animation: newsScroll 80s linear infinite;
          }
          .news-carousel-track:hover {
            animation-play-state: paused;
          }
        `}</style>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl md:text-4xl font-bold">최신 뉴스</h2>
            <Link href="/news">
              <Button variant="ghost" className="gap-1 text-sm">
                전체 보기 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loadingNews ? (
            <div className="flex gap-3">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="flex-shrink-0 w-32">
                  <Skeleton className="w-32 h-24 rounded-lg mb-2" />
                  <Skeleton className="h-3 w-full mb-1" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))}
            </div>
          ) : (() => {
            // 카테고리별 최신 4개씩 뽑아서 인터리브
            const filtered = (newsItems ?? []).filter((n: any) => !isReddit(n));
            const catGroups: Record<string, any[]> = {};
            filtered.forEach((n: any) => {
              if (!catGroups[n.category]) catGroups[n.category] = [];
              if (catGroups[n.category].length < 4) catGroups[n.category].push(n);
            });
            // 인터리브: 카테고리별 1개씩 번갈아 배치
            const interleaved: any[] = [];
            const maxLen = Math.max(...Object.values(catGroups).map(g => g.length));
            for (let i = 0; i < maxLen; i++) {
              Object.values(catGroups).forEach(g => { if (g[i]) interleaved.push(g[i]); });
            }
            const carouselNews = interleaved;
            if (carouselNews.length === 0) return (
              <div className="text-center py-8 text-slate-400">
                <div className="text-3xl mb-2">📰</div>
                <p className="text-sm">뉴스를 불러오지 못했습니다.</p>
              </div>
            );
            const doubled = [...carouselNews, ...carouselNews];
            return (
              <div className="overflow-hidden -mx-4 px-4">
                <div className="news-carousel-track">
                  {doubled.map((news: any, idx: number) => {
                    const style = getNewsCategoryStyle(news.category);
                    const catLabel =
                      news.category === '로컬뉴스' ? '🏙️ 로컬' :
                      news.category === '미국뉴스' ? '🇺🇸 미국' :
                      news.category === '스포츠'   ? '⚽ 스포츠' :
                      news.category === 'K-POP'   ? '🎵 K-POP' :
                      news.category === '이민/비자' ? '📋 이민' :
                      news.category === '세금/재정' ? '💰 재정' :
                      news.category === '한국뉴스' ? '🇰🇷 한국' :
                      news.category === '월드뉴스' ? '🌍 월드' :
                      news.category ?? '뉴스';
                    return (
                      <Link key={`${news.id}-${idx}`} href={`/news/${news.id}`}>
                        <div className="flex-shrink-0 w-32 md:w-40 group cursor-pointer">
                          {/* 썸네일 — 차트카드 절반 크기 */}
                          <div className="w-32 h-20 md:w-40 md:h-24 rounded-xl overflow-hidden bg-slate-200 relative mb-2">
                            {hasValidImage(news.thumbnail_url) ? (
                              <img
                                src={news.thumbnail_url}
                                alt={news.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className={`w-full h-full bg-gradient-to-br ${style.gradient} flex items-center justify-center`}>
                                <span className="text-2xl">{style.emoji}</span>
                              </div>
                            )}
                            {/* 카테고리 배지 */}
                            <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded-full">
                              {catLabel}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug font-ko">
                            {news.title}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">{news.source}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* 추천 업체 카드 캐러셀 */}
      {allFeatured.length > 0 && (
        <section className="py-6 bg-amber-50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-xl font-bold">추천 업체</h2>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">광고</span>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setCarouselBizIdx(i => (i - 1 + allFeatured.length) % allFeatured.length)}
                  className="w-7 h-7 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                  aria-label="이전"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCarouselBizIdx(i => (i + 1) % allFeatured.length)}
                  className="w-7 h-7 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                  aria-label="다음"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Scrollable card row */}
            <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1">
              {Array.from({ length: Math.min(8, allFeatured.length) }).map((_, j) => {
                const biz = allFeatured[(carouselBizIdx + j) % allFeatured.length];
                const name = biz.name_ko || biz.name_en || '';
                const rating = Number(biz.rating || 0).toFixed(1);
                return (
                  <a
                    key={`${biz.id}-${j}`}
                    href={`/business/${biz.id}`}
                    className="flex-shrink-0 w-[150px] md:w-[180px] snap-start rounded-xl overflow-hidden shadow-sm border border-white bg-white hover:shadow-md transition-shadow"
                  >
                    {biz.cover_url ? (
                      <div
                        className="h-[90px] md:h-[110px] bg-cover bg-center"
                        style={{ backgroundImage: `url(${biz.cover_url})` }}
                      />
                    ) : (
                      <div className="h-[90px] md:h-[110px] bg-gradient-to-br from-amber-200 to-orange-300" />
                    )}
                    <div className="p-2.5">
                      <p className="text-[12px] font-bold text-gray-800 line-clamp-1">{name}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">⭐ {rating} · {biz.category}</p>
                      {biz.phone && (
                        <a
                          href={`tel:${biz.phone}`}
                          className="flex items-center gap-1 text-[11px] text-blue-600 mt-1 hover:underline"
                          onClick={e => e.stopPropagation()}
                        >
                          <Phone className="w-3 h-3" />{biz.phone}
                        </a>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

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
            <div
              key={featuredSlot}
              className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8 transition-opacity duration-500"
              style={{ animation: 'fadeIn 0.5s ease' }}
            >
              {featured.map((business) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>
          )}
          {/* 로테이션 인디케이터 */}
          {allFeatured.length > 6 && (
            <div className="flex justify-center mt-6 gap-1.5">
              {Array.from({ length: Math.ceil(allFeatured.length / 6) }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setFeaturedSlot(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    Math.floor((featuredSlot * 6) / allFeatured.length) === i || (featuredSlot % Math.ceil(allFeatured.length / 6)) === i
                      ? 'w-6 bg-primary' : 'w-1.5 bg-slate-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Grand Opening — 새로 오픈한 업체 */}
      {grandOpeningBiz.length > 0 && (
        <section className="py-10 bg-gradient-to-b from-white to-green-50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold">🎉 새로 오픈한 업체</h2>
              <Link href="/businesses?sort=recent">
                <Button variant="ghost" className="gap-1 text-sm">전체 보기 <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {grandOpeningBiz.map((biz: any) => (
                <Link key={biz.id} href={`/business/${biz.id}`}>
                  <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-green-100 overflow-hidden group">
                    <div className="relative h-32 overflow-hidden">
                      {biz.cover_url ? (
                        <div
                          className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                          style={{ backgroundImage: `url(${biz.cover_url})` }}
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${getCategoryColor(biz.category)} flex items-center justify-center`}>
                          <span className="text-5xl">🏢</span>
                        </div>
                      )}
                      <Badge className="absolute top-2 left-2 bg-green-500 text-white font-bold text-xs shadow">🎉 NEW</Badge>
                    </div>
                    <div className="p-3">
                      <p className="font-bold text-slate-800 text-sm line-clamp-1">{biz.name_ko || biz.name_en}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{biz.category}</p>
                      {biz.created_at && (
                        <p className="text-[11px] text-green-600 font-medium mt-1">
                          등록일: {new Date(biz.created_at).toLocaleDateString('ko-KR')}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Businesses - NEW */}
      {recent.length > 0 && (
        <section className="py-12 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-xl md:text-4xl font-bold">신규 등록 업체</h2>
                  <p className="text-xs text-slate-500 mt-0.5">최근 DalKonnect에 추가된 업체들</p>
                </div>
              </div>
              <Link href="/businesses?sort=recent">
                <Button variant="ghost" className="gap-1 text-sm">전체 보기 <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {recent.slice(0, 6).map((biz) => (
                <Link key={biz.id} href={`/businesses/${biz.id}`}>
                  <div className="flex gap-3 py-3 items-center hover:bg-slate-50 rounded-lg px-1 transition-colors">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                      {biz.photos?.[0] ? (
                        <img src={biz.photos[0]} alt={biz.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center text-2xl">🏢</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm md:text-base font-bold text-slate-800 truncate">{biz.name}</p>
                      <p className="text-xs md:text-sm text-slate-500 truncate">{biz.category} · {biz.city || biz.address}</p>
                      <p className="text-xs text-green-600 font-semibold mt-0.5">🆕 신규</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
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
              <Button className="bg-red-600 hover:bg-red-700 gap-2 font-bold shadow-md hover:shadow-lg transition-all">
                <Flame className="h-4 w-4" />
                모든 딜 보기 →
              </Button>
            </Link>
          </div>

          {loadingDeals ? (
            <div className="space-y-3 md:hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : hotDeals.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {hotDeals.slice(0, 6).map((deal) => {
                  const isFree = (deal.discount ?? '').includes('FREE') || deal.deal_price === 'FREE';
                  return (
                    <div key={deal.id} className="flex gap-3 py-3 items-center cursor-pointer border-b border-red-100 last:border-0 md:border-0 md:bg-white md:rounded-xl md:p-3 md:shadow-sm md:hover:shadow-md md:transition-shadow" onClick={() => window.open(deal.deal_url, '_blank')}>
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-red-100 to-orange-100"
                           style={{ backgroundImage: deal.image_url ? `url(${deal.image_url})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="text-xs font-bold text-red-500">{deal.discount}</span>
                          {isFree && <span className="text-xs text-green-600 font-bold">FREE</span>}
                        </div>
                        <p className="text-sm font-bold text-slate-800 line-clamp-1">{deal.title}</p>
                        <p className="text-xs text-slate-500">{deal.store}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {deal.original_price && <span className="text-xs text-slate-400 line-through">{deal.original_price}</span>}
                          <span className="text-xs font-bold text-red-600">{deal.deal_price}</span>
                          {deal.likes > 0 && <span className="text-xs text-slate-400 ml-auto">❤️ {deal.likes}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="hidden">
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
            </>
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
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl md:text-4xl font-bold mb-1">블로그</h2>
              <p className="text-sm text-slate-500">DFW 한인 생활 가이드와 유용한 팁</p>
            </div>
            <Link href="/blog">
              <Button variant="outline" className="gap-1 text-sm border-slate-300 hover:bg-slate-50 font-semibold">
                전체 보기 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loadingBlogs ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 items-center">
                  <Skeleton className="w-20 h-20 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentBlogs.length > 0 && (
            <>
              <div className="divide-y divide-slate-100">
                {recentBlogs.map((blog) => {
                  const categoryStyle = getBlogCategoryStyle(blog.category);
                  return (
                    <Link key={blog.id} href={`/blog/${blog.slug}`}>
                      <div className="flex gap-3 py-3 items-start">
                        {/* 썸네일 */}
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                          {blog.cover_image || blog.cover_url ? (
                            <img
                              src={blog.cover_image || blog.cover_url}
                              alt={blog.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className={`w-full h-full bg-gradient-to-br ${categoryStyle.gradient} flex items-center justify-center`}>
                              <span className="text-2xl">{categoryStyle.emoji}</span>
                            </div>
                          )}
                        </div>
                        {/* 텍스트 */}
                        <div className="flex-1 min-w-0">
                          {blog.category && (
                            <span className="text-xs font-semibold text-primary">{blog.category}</span>
                          )}
                          <h3 className="text-sm font-bold text-slate-800 line-clamp-2 mt-0.5 font-ko leading-snug">
                            {blog.title}
                          </h3>
                          {blog.excerpt && (
                            <p className="text-xs text-slate-500 line-clamp-1 mt-1">{blog.excerpt}</p>
                          )}
                          <p className="text-xs text-slate-400 mt-1">
                            {blog.author} · {new Date(blog.published_at).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
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
                <h2 className="text-xl md:text-4xl font-bold">최근 올라온 매물</h2>
                <p className="text-slate-600 mt-1">DFW 한인 커뮤니티 사고팔기</p>
              </div>
            </div>
            <Link href="/marketplace">
              <Button variant="outline" className="gap-2 border-green-600 text-green-700 hover:bg-green-50 font-semibold">
                전체 보기 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loadingListings ? (
            <div className="space-y-3 md:hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentListings.length > 0 && (
            <>
              {/* 카테고리별 이모지 맵 */}
              {(() => {
                const categoryEmoji: Record<string, string> = {
                  '자동차': '🚗', '가전제품': '📺', '가전': '📺', '전자기기': '💻', '전자제품': '💻',
                  '가구': '🛋️', '의류': '👕', '유아용품': '🍼', '육아용품': '🍼',
                  '스포츠': '⚽', '스포츠/레저': '🏃', '도서': '📚', '도서/교재': '📚',
                  '악기': '🎸', '주방용품': '🍳', '식품': '🍱', '기타': '📦',
                };
                return (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                    {recentListings.slice(0, 6).map((listing) => {
                      const isFree = listing.price_type === 'free';
                      const price = isFree ? '무료나눔' : listing.price_type === 'contact' ? '가격문의' : listing.price ? `$${parseFloat(listing.price).toLocaleString()}` : '가격협의';
                      const isTest = (listing as any).nickname?.includes('테스터') || (listing as any).nickname?.includes('달커넥트테스터');
                      const emoji = categoryEmoji[listing.category] || '🛍️';
                      const handleClick = (e: React.MouseEvent) => {
                        if (isTest) {
                          e.preventDefault();
                          alert('📦 아직 매물이 없어요!\n첫 번째 매물을 무료로 올려보세요.\n물건을 팔거나 나누고 싶다면 지금 바로 등록해보세요 😊');
                        }
                      };
                      return (
                        <Link key={listing.id} href={isTest ? '/marketplace/new' : `/marketplace/${listing.id}`} onClick={handleClick}>
                          <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-slate-100 group">
                            {/* 이미지 or 이모지 placeholder */}
                            <div className="h-32 relative overflow-hidden">
                              {listing.photos?.[0] ? (
                                <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center gap-1">
                                  <span className="text-4xl">{emoji}</span>
                                  <span className="text-xs text-slate-400 font-medium">{listing.category}</span>
                                </div>
                              )}
                              {/* 가격 뱃지 */}
                              <div className={`absolute bottom-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full ${isFree ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'}`}>
                                {price}
                              </div>
                            </div>
                            <div className="p-3">
                              <p className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug">{listing.title}</p>
                              <p className="text-xs text-slate-400 mt-1">{listing.location || 'DFW'}</p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                );
              })()}
            
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link href="/marketplace">
              <Button size="lg" variant="outline" className="gap-2 border-green-600 text-green-700 hover:bg-green-50 font-bold px-8 shadow-sm">
                전체 매물 보기 →
              </Button>
            </Link>
            <Link href="/marketplace/new">
              <Button size="lg" className="gap-2 font-bold shadow-md">
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
              <h2 className="text-xl md:text-4xl font-bold flex items-center gap-3">
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
            <div className="divide-y divide-slate-100">
              {popularPosts.slice(0, 8).map((post, index) => (
                <Link key={post.id} href={`/community/${post.id}`}>
                  <div className="flex gap-3 py-3 items-start hover:bg-slate-50 rounded-lg px-1 transition-colors">
                    <div className="flex items-center justify-center w-7 h-7 md:w-9 md:h-9 bg-primary text-white text-xs md:text-sm font-bold rounded-full flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{post.category}</span>
                        {post.is_pinned && <span className="text-xs text-red-500 font-bold">📌 공지</span>}
                      </div>
                      <p className="text-sm md:text-base font-bold text-slate-800 line-clamp-2 leading-snug mt-1">{post.title}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                        <span className="font-medium text-slate-500">{post.nickname}</span>
                        <span className="flex items-center gap-0.5">
                          <MessageCircle className="w-3 h-3 text-blue-400" />
                          <span className="font-semibold text-blue-500">{post.comment_count}</span>
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Heart className="w-3 h-3 text-red-400" />
                          <span className="font-semibold text-red-500">{post.likes}</span>
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Eye className="w-3 h-3" />
                          {post.views}
                        </span>
                      </div>
                    </div>
                  </div>
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
                <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all font-bold px-8">
                  <MessageCircle className="h-5 w-5" />
                  커뮤니티 더보기 →
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 마트 픽 섹션 */}
      <section className="py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-8 w-8 text-primary" />
              <div>
                <h2 className="text-xl md:text-4xl font-bold">마트 픽 🛒</h2>
                <p className="text-slate-500 mt-1 text-sm md:text-base">DFW 인기 마트 신상 & 핫 아이템</p>
              </div>
            </div>
            <Link href="/shopping">
              <Button variant="ghost" className="gap-2">
                전체 보기 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* 마트 카드 4개 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              {
                id: "costco",
                emoji: "🔴",
                name: "코스트코",
                tagline: "대용량 & 가성비",
                color: "from-red-600 to-red-700",
                items: ["비비고 만두", "커클랜드 코코넛오일", "치킨 브레스트"],
              },
              {
                id: "traderjoes",
                emoji: "🌿",
                name: "트레이더 조",
                tagline: "유니크 & 시즌 픽",
                color: "from-orange-500 to-red-500",
                items: ["오렌지 치킨", "베이글 시즈닝", "쿠키 버터"],
              },
              {
                id: "centralmarket",
                emoji: "🌟",
                name: "센트럴 마켓",
                tagline: "프리미엄 식재료",
                color: "from-green-600 to-emerald-700",
                items: ["부라타 치즈", "자연산 연어", "아사이베리"],
              },
              {
                id: "heb",
                emoji: "🤠",
                name: "HEB",
                tagline: "텍사스 로컬 신상",
                color: "from-red-700 to-red-800",
                items: ["타말레스", "텍사스 자몽", "크리미 아이스크림"],
              },
            ].map((store) => (
              <Link key={store.id} href={`/shopping#${store.id}`}>
                <div
                  className="rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group h-full"
                  onClick={() => {}}
                >
                  {/* 컬러 상단 */}
                  <div className={`bg-gradient-to-br ${store.color} p-5 text-white`}>
                    <div className="text-3xl mb-2">{store.emoji}</div>
                    <div className="font-bold text-lg leading-tight">{store.name}</div>
                    <div className="text-white/80 text-xs mt-1">{store.tagline}</div>
                  </div>
                  {/* 아이템 미리보기 */}
                  <div className="bg-white p-4 border border-t-0 rounded-b-2xl">
                    <ul className="space-y-1.5">
                      {store.items.map((item, i) => (
                        <li key={i} className="text-sm text-slate-700 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex items-center gap-1 text-xs text-primary font-medium group-hover:gap-2 transition-all">
                      더 보기 <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Glass Cart 배지 */}
          <div className="mt-5 flex items-center gap-2 justify-center">
            <span className="text-xs text-slate-400">콘텐츠 제공:</span>
            <a
              href="https://youtube.com/channel/UCzikZfE3N5Lx3t9xWlh8wUg"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-red-600 hover:underline"
            >
              <Gift className="h-3 w-3" />
              Glass Cart YouTube
            </a>
          </div>
        </div>
      </section>

      {/* ☀️ 오늘의 아침 브리핑 — static promo card */}
      <section className="py-8 bg-gradient-to-r from-orange-50 to-yellow-50">
        <div className="container mx-auto px-4">
          <a
            href="https://www.instagram.com/dalkonnect"
            target="_blank"
            rel="noopener noreferrer"
            className="block max-w-lg mx-auto"
          >
            <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow border border-orange-100 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-400 to-pink-500 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold mb-1 flex items-center gap-2">
                      <Sun className="w-5 h-5" /> 오늘의 아침 브리핑
                    </div>
                    <p className="text-orange-100 text-sm">
                      {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Play className="w-6 h-6 text-white fill-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">DFW 한인 커뮤니티 최신 소식</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <span className="text-pink-500 font-medium">@dalkonnect</span> Instagram에서 보기
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
              </div>
            </div>
          </a>
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
          <h2 className="text-xl md:text-4xl font-bold mb-6">업체를 운영하시나요?</h2>
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
