import { Link, useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { Search, MapPin, Star, ArrowRight, UtensilsCrossed, Church, Heart, Scissors, Home as HomeIcon, Scale, Car, GraduationCap, ShoppingCart, TrendingUp, Clock, ShoppingBag, Eye, Phone, Flame, MessageCircle, Gift, Sun, Play } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeaturedBusinesses, useNews, useBlogs, useListings, useCategories } from "@/lib/api";
import { getCategoryColor, getCategoryIcon, hasValidImage, proxyPhotoUrl } from "@/lib/imageDefaults";
import { getBlogCategoryStyle, getNewsCategoryStyle } from "@/lib/blogNewsDefaults";
import { fetchWithRetry, filterValidDeals } from "@/lib/utils";
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

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchFocused, setSearchFocused] = useState(false);
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
  
  useEffect(() => {
    document.title = 'DalKonnect | 달라스 한인 업체·뉴스·커뮤니티';
  }, []);

  // Fetch random restaurant for "Restaurant of the Day"
  const [restaurantOfDay, setRestaurantOfDay] = useState<any>(null);
  useEffect(() => {
    const fetchRandomRestaurant = async () => {
      try {
        // 구글 리뷰 많은 순 top 20 가져와서 한인 식당(한국어 이름 있는 곳)만 필터 → 랜덤 선택
        const response = await fetchWithRetry('/api/businesses?category=식당&sort=reviews&limit=20');
        {
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
        const response = await fetchWithRetry('/api/community?action=posts&sort=popular&limit=8');
        const data = await response.json();
        setPopularPosts(data.posts || data.data || []);
      } catch (error) {
        console.error('Failed to fetch community posts:', error);
      } finally {
        setLoadingCommunity(false);
      }
    };
    fetchPopularPosts();
  }, []);

  // Fetch immigration/visa news
  const [immigrationNews, setImmigrationNews] = useState<any[]>([]);
  useEffect(() => {
    fetchWithRetry('/api/news?category=%EC%9D%B4%EB%AF%BC%2F%EB%B9%84%EC%9E%90&limit=4')
      .then(r => r.json())
      .then(d => setImmigrationNews(Array.isArray(d) ? d.slice(0, 4) : []))
      .catch(() => {});
  }, []);

  // Fetch hot deals
  const [hotDeals, setHotDeals] = useState<any[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(true);
  useEffect(() => {
    const fetchHotDeals = async () => {
      try {
        // 오염 딜이 섞여 있으므로 여유있게 20개 가져와 필터 후 6개 사용
        const response = await fetchWithRetry('/api/deals?limit=20&sort=hot');
        const deals = await response.json();
        // 스크레이퍼 파싱 오류 딜("$190$80", "100% OFF", 중복 placeholder 이미지) 제외
        setHotDeals(filterValidDeals(Array.isArray(deals) ? deals : []));
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
    fetchWithRetry('/api/businesses?sort=recent&limit=3')
      .then(r => r.json())
      .then(d => setGrandOpeningBiz(d.businesses || []))
      .catch(() => {});
  }, []);

  // 방문자 카운터 API 호출
  useEffect(() => {
    const recordVisit = async () => {
      try {
        const response = await fetchWithRetry('/api/categories?action=visit&page=/');
        const stats = await response.json();
        // Only set if it has the expected shape
        if (stats && typeof stats.todayUnique === 'number') {
          setVisitorStats(stats);
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

  // 추천 업체 — 단일 노출용 (자동 로테이션 없음, 수동 스와이프만)
  const allFeatured = featuredBusinesses ?? [];
  // 추천 업체 섹션에 노출할 카드 (최대 8개)
  const featuredForAd = useMemo(() => allFeatured.slice(0, 8), [allFeatured]);
  // Reddit 제외
  const isReddit = (n: any) => n.source?.startsWith('r/') || n.category === '달라스';
  // 뉴스 헤드라인 — 카테고리별 인터리브 후 최신 5개 (정적 리스트)
  const headlineNews = useMemo(() => {
    const filtered = (newsItems ?? []).filter((n: any) => !isReddit(n));
    const catGroups: Record<string, any[]> = {};
    filtered.forEach((n: any) => {
      if (!catGroups[n.category]) catGroups[n.category] = [];
      catGroups[n.category].push(n);
    });
    const interleaved: any[] = [];
    const maxLen = Math.max(0, ...Object.values(catGroups).map(g => g.length));
    for (let i = 0; i < maxLen; i++) {
      Object.values(catGroups).forEach(g => { if (g[i]) interleaved.push(g[i]); });
    }
    return interleaved.slice(0, 5);
  }, [newsItems]);
  const recentBlogs = blogPosts?.slice(0, 4) ?? [];
  const recentListings = (listingsData?.items ?? []).filter((l: any) => {
    // 테스트/더미 매물 제외
    const nick = (l as any).nickname ?? '';
    return !nick.includes('테스터') && !nick.includes('달커넥트테스터');
  });

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
    <>
    <Helmet>
      <title>DalKonnect — DFW 달라스 한인 커뮤니티</title>
      <meta name="description" content="달라스-포트워스 DFW 한인 커뮤니티. 1,175개 한인 업체 정보, 매일 업데이트 최신 한인 뉴스, 커뮤니티, 마켓플레이스." />
      <meta property="og:title" content="DalKonnect — DFW 달라스 한인 커뮤니티" />
      <meta property="og:description" content="달라스-포트워스 DFW 한인 커뮤니티. 1,175개 한인 업체 정보, 매일 업데이트 최신 한인 뉴스, 커뮤니티, 마켓플레이스." />
      <meta property="og:image" content="https://dalkonnect.com/og-image.png" />
      <meta property="og:url" content="https://dalkonnect.com/" />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="DalKonnect — DFW 달라스 한인 커뮤니티" />
      <meta name="twitter:description" content="달라스-포트워스 DFW 한인 업체 & 뉴스 커뮤니티" />
      <meta name="twitter:image" content="https://dalkonnect.com/og-image.png" />
      <link rel="canonical" href="https://dalkonnect.com/" />
    </Helmet>
    <div className="flex flex-col min-h-screen">
      {/* Hero Section — 100vw 탈출 (사이드 광고 컬럼 무시) */}
      <section
        className="relative h-[320px] md:h-[600px] flex items-center justify-center bg-cover bg-center"
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
            달라스-포트워스 지역 1,175개 한인 업체 정보와 매일 최신 한인 뉴스
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

          {/* 신뢰 지표 배지 */}
          <div className="flex justify-center gap-3 mt-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-xs font-semibold">
              <span>🏪</span><span>업체 1,175+</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-xs font-semibold">
              <span>📰</span><span>매일 뉴스 업데이트</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-xs font-semibold">
              <span>👥</span><span>DFW 한인 커뮤니티</span>
            </div>
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


      {/* 뉴스 헤드라인 — 정적 리스트 */}
      <section className="py-12 bg-slate-50">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl md:text-3xl font-bold">📰 오늘의 뉴스 헤드라인</h2>
            <Link href="/news">
              <Button variant="ghost" className="gap-1 text-sm">
                전체 보기 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loadingNews ? (
            <div className="space-y-2">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="flex gap-3 items-center py-3">
                  <Skeleton className="h-5 w-16 rounded-full flex-shrink-0" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          ) : headlineNews.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100">
              {headlineNews.map((news: any) => {
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
                  <Link key={news.id} href={`/news/${news.id}`}>
                    <div className="flex gap-3 items-center py-3.5 px-4 hover:bg-slate-50 transition-colors cursor-pointer">
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-full flex-shrink-0 bg-gradient-to-br ${style.gradient} text-white`}>
                        {catLabel}
                      </span>
                      <p className="text-sm md:text-base font-semibold text-slate-800 line-clamp-1 flex-1 font-ko">
                        {news.title}
                      </p>
                      <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 text-center py-10 text-slate-400">
              <div className="text-3xl mb-2">📰</div>
              <p className="text-sm">뉴스를 불러오는 중입니다.</p>
            </div>
          )}

          <div className="text-center mt-5">
            <Link href="/news">
              <span className="text-sm text-primary font-semibold hover:underline">전체 뉴스 보기 →</span>
            </Link>
          </div>
        </div>
      </section>


      {/* 이민/비자 섹션 */}
      <section className="py-12 bg-gradient-to-r from-indigo-50 to-blue-50 border-y border-indigo-100">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl md:text-3xl font-bold flex items-center gap-2">
                <span>📋</span> 이민·비자 뉴스
              </h2>
              <p className="text-sm text-slate-500 mt-1">USCIS 공지 · 비자 정책 · 이민법 최신 업데이트</p>
            </div>
            <Link href="/news?category=%EC%9D%B4%EB%AF%BC%2F%EB%B9%84%EC%9E%90">
              <Button variant="outline" size="sm" className="gap-1 border-indigo-300 text-indigo-700 hover:bg-indigo-50 font-semibold">
                더 보기 <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {immigrationNews.length > 0 ? immigrationNews.map((item: any) => (
              <Link key={item.id} href={`/news/${item.id}`}>
                <div className="flex gap-3 bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow border border-indigo-100">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{item.source}</span>
                    <p className="text-sm font-bold text-slate-800 line-clamp-2 mt-1 leading-snug">{item.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{new Date(item.published_date || item.created_at).toLocaleDateString('ko-KR')}</p>
                  </div>
                  {item.thumbnail_url && (
                    <img src={item.thumbnail_url} alt={item.title_ko ?? ''} loading="lazy" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                  )}
                </div>
              </Link>
            )) : (
              <div className="md:col-span-2 bg-white rounded-xl p-4 border border-indigo-100 text-center text-slate-400 text-sm">
                이민/비자 뉴스를 수집 중입니다. 곧 업데이트됩니다.
              </div>
            )}
          </div>

          {/* 빠른 링크 */}
          <div className="flex flex-wrap gap-2">
            <a href="https://www.uscis.gov" target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1.5 bg-white text-indigo-700 border border-indigo-200 rounded-full px-3 py-1.5 text-xs font-semibold hover:bg-indigo-50 transition-colors shadow-sm">
              🏛️ USCIS 공식사이트
            </a>
            <a href="https://travel.state.gov" target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1.5 bg-white text-indigo-700 border border-indigo-200 rounded-full px-3 py-1.5 text-xs font-semibold hover:bg-indigo-50 transition-colors shadow-sm">
              ✈️ 비자 신청 (State.gov)
            </a>
            <a href="https://www.uscis.gov/tools/track-a-case" target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1.5 bg-white text-indigo-700 border border-indigo-200 rounded-full px-3 py-1.5 text-xs font-semibold hover:bg-indigo-50 transition-colors shadow-sm">
              🔍 케이스 추적
            </a>
            <Link href="/community?category=Q%26A">
              <span className="flex items-center gap-1.5 bg-indigo-600 text-white rounded-full px-3 py-1.5 text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer">
                💬 이민 Q&A 커뮤니티
              </span>
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
            <div className="flex gap-2">
              <Link href="/community/new">
                <Button size="sm" className="gap-1.5 font-semibold shadow-sm">
                  ✍️ 글쓰기
                </Button>
              </Link>
              <Link href="/community">
                <Button variant="ghost" size="sm" className="gap-1">
                  전체 보기 <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
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


      {/* 추천 업체 (통합 — 광고 1곳, 자동 로테이션 없이 수동 스와이프) */}
      {featuredForAd.length > 0 && (
        <section className="py-12 bg-amber-50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-3xl font-bold">추천 업체</h2>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">광고</span>
              </div>
              <Link href="/businesses?featured=true">
                <Button variant="ghost" className="gap-1 text-sm">
                  전체 보기 <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {loadingFeatured ? (
              <div className="flex gap-4 overflow-x-hidden">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="flex-shrink-0 w-[240px]">
                    <Skeleton className="w-full h-40 rounded-xl mb-3" />
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              /* 가로 스와이프 카드 (수동 스크롤만) */
              <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4">
                {featuredForAd.map((business: any) => (
                  <div key={business.id} className="flex-shrink-0 w-[220px] md:w-[280px] snap-start">
                    <BusinessCard business={business} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}


      {/* Home Services Hub Banner */}
      <section className="py-10 bg-gradient-to-br from-gray-900 to-gray-700">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-white text-center md:text-left">
              <div className="text-2xl mb-1">🔧 달라스 홈서비스 허브</div>
              <div className="text-gray-300 text-sm">에어컨 · 전기 · 배관 · 청소 · 이사 · 핸디맨</div>
              <div className="text-gray-400 text-xs mt-1">영어 걱정 없이 — 한국어로 편하게 연결해드립니다</div>
            </div>
            <Link href="/services">
              <span className="inline-block bg-white text-gray-900 font-bold px-6 py-3 rounded-full hover:bg-gray-100 transition-colors whitespace-nowrap">
                무료 견적 받기 →
              </span>
            </Link>
          </div>
        </div>
      </section>


      {/* Hot Deals Section — 유효 딜 0건이면 섹션 숨김 (오염 딜 필터 후 빈 상태 노출 방지) */}
      {(loadingDeals || hotDeals.length > 0) && (
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
        </div>
      </section>
      )}


      {/* 마트픽 — 딜 섹션 하단 작은 로고 4개 가로 줄로 압축 */}
      <section className="pb-14 -mt-6 bg-gradient-to-r from-red-50 to-orange-50">
        <div className="container mx-auto px-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 text-center">🛒 자주 가는 DFW 마트</p>
          <div className="flex flex-wrap items-stretch justify-center gap-2 md:gap-3">
            {([
              { emoji: "🔴", name: "코스트코", color: "from-red-600 to-red-700", href: "https://www.costco.com" },
              { emoji: "🌿", name: "트레이더 조", color: "from-orange-500 to-red-500", href: "https://www.traderjoes.com" },
              { emoji: "🌟", name: "센트럴 마켓", color: "from-green-600 to-emerald-700", href: "https://www.centralmarket.com" },
              { emoji: "🤠", name: "HEB", color: "from-red-700 to-red-800", href: "https://www.heb.com" },
            ]).map((store) => (
              <a key={store.name} href={store.href} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white rounded-full shadow-sm border border-slate-100 pl-2 pr-4 py-2 hover:shadow-md transition-shadow">
                <span className={`w-8 h-8 rounded-full bg-gradient-to-br ${store.color} flex items-center justify-center text-base`}>{store.emoji}</span>
                <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">{store.name}</span>
              </a>
            ))}
          </div>
        </div>
      </section>


      {/* Recent Marketplace Listings — 홈에서는 매물 0건이면 섹션 자체를 숨김 (빈 상태 카드 노출 방지) */}
      {(loadingListings || recentListings.length > 0) && (
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden border border-slate-100">
                  <Skeleton className="h-32 w-full" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentListings.length > 0 ? (
            (() => {
              const categoryEmoji: Record<string, string> = {
                '자동차': '🚗', '가전제품': '📺', '가전': '📺', '전자기기': '💻', '전자제품': '💻',
                '가구': '🛋️', '의류': '👕', '유아용품': '🍼', '육아용품': '🍼',
                '스포츠': '⚽', '스포츠/레저': '🏃', '도서': '📚', '도서/교재': '📚',
                '악기': '🎸', '주방용품': '🍳', '식품': '🍱', '기타': '📦',
              };
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  {recentListings.slice(0, 6).map((listing: any) => {
                    const isFree = listing.price_type === 'free';
                    const price = isFree ? '무료나눔' : listing.price_type === 'contact' ? '가격문의' : listing.price ? `$${parseFloat(listing.price).toLocaleString()}` : '가격협의';
                    const emoji = categoryEmoji[listing.category] || '🛍️';
                    return (
                      <Link key={listing.id} href={`/marketplace/${listing.id}`}>
                        <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-slate-100 group">
                          {/* 이미지 or 이모지 placeholder */}
                          <div className="h-32 relative overflow-hidden">
                            {listing.photos?.[0] ? (
                              <img src={listing.photos[0]} alt={listing.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
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
            })()
          ) : null /* 홈에서는 빈 상태 카드 미노출 — 섹션 자체가 위 조건에서 숨겨짐 */}

          {recentListings.length > 0 && (
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
          )}
        </div>
      </section>
      )}


      {/* 오늘의 맛집 (카드 크기 절반 축소) + 새로 오픈 통합 */}
      {(restaurantOfDay || grandOpeningBiz.length > 0) && (
        <section className="py-12 bg-gradient-to-r from-orange-50 to-red-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {/* 오늘의 맛집 — 컴팩트 가로 카드 */}
              {restaurantOfDay && (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <UtensilsCrossed className="h-5 w-5 text-orange-600" />
                    <h2 className="text-lg md:text-2xl font-bold">오늘의 맛집</h2>
                  </div>
                  <Link href={`/business/${restaurantOfDay.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow mb-8">
                      <div className="flex">
                        {/* Image — 절반 크기 */}
                        <div className="relative w-28 h-28 md:w-40 md:h-40 flex-shrink-0">
                          {hasValidImage(restaurantOfDay.cover_url) ? (
                            <div
                              className="w-full h-full bg-cover bg-center"
                              style={{ backgroundImage: `url(${proxyPhotoUrl(restaurantOfDay.cover_url) || restaurantOfDay.cover_url})` }}
                            />
                          ) : (
                            <div className={`w-full h-full bg-gradient-to-br ${getCategoryColor(restaurantOfDay.category)} flex items-center justify-center`}>
                              <UtensilsCrossed className="w-10 h-10 text-white/80" />
                            </div>
                          )}
                          {restaurantOfDay.featured && (
                            <Badge className="absolute top-2 left-2 bg-orange-600 text-[10px] px-1.5 py-0.5">⭐ 추천</Badge>
                          )}
                        </div>
                        {/* Content */}
                        <div className="p-3 md:p-5 flex flex-col justify-center min-w-0 flex-1">
                          <Badge variant="secondary" className="w-fit mb-1.5 text-[11px]">{restaurantOfDay.category}</Badge>
                          <h3 className="text-base md:text-xl font-bold font-ko line-clamp-1">
                            {restaurantOfDay.name_ko || restaurantOfDay.name_en}
                          </h3>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            {restaurantOfDay.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-bold text-sm">{restaurantOfDay.rating}</span>
                                <span className="text-slate-400 text-xs">({restaurantOfDay.review_count || 0})</span>
                              </div>
                            )}
                          </div>
                          {restaurantOfDay.address && (
                            <div className="flex items-center gap-1 text-slate-500 text-xs mt-1.5">
                              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="line-clamp-1">{restaurantOfDay.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                </>
              )}

              {/* 새로 오픈한 업체 — "새로 오픈" 뱃지 통합 */}
              {grandOpeningBiz.length > 0 && (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg md:text-2xl font-bold">🎉 새로 오픈한 업체</h2>
                    <Link href="/businesses?sort=recent">
                      <Button variant="ghost" className="gap-1 text-sm">전체 보기 <ArrowRight className="h-4 w-4" /></Button>
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {grandOpeningBiz.map((biz: any) => (
                      <Link key={biz.id} href={`/business/${biz.id}`}>
                        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-green-100 overflow-hidden group">
                          <div className="relative h-28 overflow-hidden">
                            {biz.cover_url ? (
                              <div
                                className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                                style={{ backgroundImage: `url(${biz.cover_url})` }}
                              />
                            ) : (
                              <div className={`w-full h-full bg-gradient-to-br ${getCategoryColor(biz.category)} flex items-center justify-center`}>
                                <span className="text-4xl">🏢</span>
                              </div>
                            )}
                            <Badge className="absolute top-2 left-2 bg-green-500 text-white font-bold text-xs shadow">🎉 새로 오픈</Badge>
                          </div>
                          <div className="p-3">
                            <p className="font-bold text-slate-800 text-sm line-clamp-1">{biz.name_ko || biz.name_en}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{biz.category}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      )}


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


      {/* Newsletter Section */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <NewsletterSignup />
        </div>
      </section>


      {/* 업체 사장님 CTA / 업체등록 (히어로 아래 띠배너 + 최하단 CTA 통합) */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-semibold mb-5">
            🏪 내 업체를 달라스 한인들에게 알리세요
          </div>
          <h2 className="text-xl md:text-4xl font-bold mb-6">업체를 운영하시나요?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            DalKonnect에 등록하고 더 많은 고객을 만나세요
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register-business">
              <Button size="lg" variant="secondary" className="h-14 px-10 text-lg font-bold">
                무료 등록하기 →
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="h-14 px-10 text-lg font-bold bg-transparent border-white text-white hover:bg-white/10">
                요금제 보기
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}

