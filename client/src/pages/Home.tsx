import { Link, useLocation } from "wouter";
import { Search, MapPin, Star, ArrowRight, UtensilsCrossed, Church, Heart, Scissors, Home as HomeIcon, Scale, Car, GraduationCap, ShoppingCart, BookOpen, TrendingUp, Sparkles, Clock, ShoppingBag, Eye, Calendar, Phone, Users, Flame } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeaturedBusinesses, useNews, useBlogs, useListings, useCategories } from "@/lib/api";
import { getCategoryColor, getCategoryIcon, hasValidImage } from "@/lib/imageDefaults";
import { getBlogCategoryStyle, getNewsCategoryStyle } from "@/lib/blogNewsDefaults";
import { NewsletterSignup } from "@/components/NewsletterSignup";
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
  "한식당", "미용실", "교회", "정비소", "치과", "부동산", "학원", "한인마트"
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
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

  // 방문자 카운터 API 호출
  useEffect(() => {
    const recordVisit = async () => {
      try {
        const response = await fetch('/api/categories?action=visit&page=/');
        if (response.ok) {
          const stats = await response.json();
          setVisitorStats(stats);
        }
      } catch (error) {
        console.error('Failed to record visit:', error);
      }
    };
    
    recordVisit();
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
    if (searchQuery.trim()) {
      setLocation(`/businesses?search=${encodeURIComponent(searchQuery)}`);
    }
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
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=1600&q=80)` 
        }}
      >
        <div className="container mx-auto px-4 text-center text-white">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            DFW 한인 커뮤니티의 모든 것
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto text-slate-200">
            달라스-포트워스 지역 {1122}개 한인 업체 정보와 최신 한인 뉴스
          </p>
          
          {/* Big Search Bar */}
          <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-3 flex gap-3 shadow-2xl hover:shadow-3xl transition-shadow">
              <div className="flex-1 flex items-center px-5">
                <Search className="h-7 w-7 text-slate-400 mr-4 flex-shrink-0" />
                <Input 
                  className="border-0 shadow-none focus-visible:ring-0 text-xl text-slate-800 h-16 placeholder:text-slate-400" 
                  placeholder="달라스 한인 맛집 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="h-16 px-12 text-xl font-semibold">
                검색
              </Button>
            </div>
          </form>

          {/* Popular Search Tags */}
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            {POPULAR_SEARCH_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setLocation(`/businesses?search=${encodeURIComponent(tag)}`)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium text-white transition-all hover:scale-105"
              >
                {tag}
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
                <span className="font-semibold">총 {(1122).toLocaleString()}개 업체</span>
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
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">인기 카테고리</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
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

      {/* Popular Searches */}
      {popularSearches.length > 0 && (
        <section className="py-16 bg-white border-y">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-3">많이 찾는 검색어</h2>
              <p className="text-slate-600 mb-8">다른 사용자들이 많이 검색한 키워드입니다</p>
              <div className="flex flex-wrap justify-center gap-3">
                {popularSearches.map((search, index) => (
                  <button
                    key={search.query}
                    onClick={() => {
                      setSearchQuery(search.query);
                      setLocation(`/businesses?search=${encodeURIComponent(search.query)}`);
                    }}
                    className="group relative inline-flex items-center gap-2 px-6 py-3 bg-slate-50 hover:bg-primary hover:text-white rounded-full text-sm font-medium transition-all hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <span className="text-lg font-bold text-slate-400 group-hover:text-white/70">
                      {index + 1}
                    </span>
                    <span>{search.query}</span>
                    <Badge 
                      variant="secondary" 
                      className="ml-1 bg-white/80 group-hover:bg-white/20 text-slate-600 group-hover:text-white text-xs"
                    >
                      {search.search_count}회
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trending Businesses - NEW */}
      {trending.length > 0 && (
        <section className="py-20 bg-gradient-to-b from-primary/5 to-white">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-12">
              <div className="flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-primary" />
                <div>
                  <h2 className="text-4xl font-bold">이번 주 인기 업체</h2>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {trending.slice(0, 6).map((business) => (
                  <Link key={business.id} href={`/business/${business.id}`}>
                    <Card className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group">
                      <CardContent className="p-0">
                        {hasValidImage(business.cover_url) ? (
                          <div 
                            className="w-full h-48 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                            style={{ backgroundImage: `url(${business.cover_url})` }}
                          />
                        ) : (
                          <div className={`w-full h-48 bg-gradient-to-br ${getCategoryColor(business.category)} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
                            {(() => {
                              const iconName = getCategoryIcon(business.category) as keyof typeof Icons;
                              const IconComponent = Icons[iconName] as React.ComponentType<{ className?: string }>;
                              return IconComponent ? <IconComponent className="w-16 h-16 text-white/80" /> : null;
                            })()}
                          </div>
                        )}
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-xl font-bold text-slate-800 group-hover:text-primary transition-colors font-ko">
                                {business.name_ko || business.name_en}
                              </h3>
                              {business.name_ko && business.name_en && (
                                <p className="text-sm text-slate-500 mt-0.5">{business.name_en}</p>
                              )}
                            </div>
                            <Badge variant="destructive" className="ml-2 flex-shrink-0">🔥 HOT</Badge>
                          </div>
                          <p className="text-slate-600 mb-3 font-ko">{business.category}</p>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                              <span className="font-semibold text-lg">{business.rating || 'N/A'}</span>
                            </div>
                            <span className="text-slate-500 text-sm">
                              ({business.review_count || 0} 리뷰)
                            </span>
                          </div>
                          {business.address && (
                            <div className="flex items-start gap-2 text-sm text-slate-600">
                              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-2">{business.address}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Featured Businesses */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-4xl font-bold">추천 업체</h2>
            <Link href="/businesses?featured=true">
              <Button variant="ghost" className="gap-2">
                전체 보기 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loadingFeatured ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featured.map((business) => (
                <Card key={business.id} className="overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group rounded-xl">
                  <CardContent className="p-0">
                    <Link href={`/business/${business.id}`}>
                      {hasValidImage(business.cover_url) ? (
                        <div 
                          className="w-full h-48 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                          style={{ backgroundImage: `url(${business.cover_url})` }}
                        />
                      ) : (
                        <div className={`w-full h-48 bg-gradient-to-br ${getCategoryColor(business.category)} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
                          {(() => {
                            const iconName = getCategoryIcon(business.category) as keyof typeof Icons;
                            const IconComponent = Icons[iconName] as React.ComponentType<{ className?: string }>;
                            return IconComponent ? <IconComponent className="w-16 h-16 text-white/80" /> : null;
                          })()}
                        </div>
                      )}
                    </Link>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <Link href={`/business/${business.id}`} className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-slate-800 group-hover:text-primary transition-colors font-ko">
                            {business.name_ko || business.name_en}
                          </h3>
                          {business.name_ko && business.name_en && (
                            <p className="text-sm text-slate-500 mt-0.5">{business.name_en}</p>
                          )}
                        </Link>
                      </div>
                      
                      <Badge 
                        variant="secondary" 
                        className="mb-3 text-xs"
                        style={{ 
                          background: `linear-gradient(to right, ${getCategoryColor(business.category).replace('from-', '').replace('to-', '').split(' ').map(c => `var(--${c})`).join(', ')})`,
                          color: 'white'
                        }}
                      >
                        {business.category}
                      </Badge>
                      
                      {/* Star Rating Visualization */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-1">
                          {business.rating && parseFloat(business.rating) > 0 ? (
                            <>
                              {[...Array(5)].map((_, i) => {
                                const rating = parseFloat(business.rating || '0');
                                const fillPercentage = Math.min(Math.max(rating - i, 0), 1);
                                return (
                                  <div key={i} className="relative">
                                    <Star className="h-4 w-4 text-slate-300" />
                                    {fillPercentage > 0 && (
                                      <div className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercentage * 100}%` }}>
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              <span className="font-bold text-lg ml-1">{business.rating}</span>
                            </>
                          ) : (
                            <span className="text-slate-400 text-sm">평점 없음</span>
                          )}
                        </div>
                        {business.review_count && business.review_count > 0 && (
                          <span className="text-slate-500 text-sm">
                            💬 {business.review_count}개 리뷰
                          </span>
                        )}
                      </div>
                      
                      {business.city && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="font-medium">{business.city}</span>
                        </div>
                      )}
                      
                      {business.phone && (
                        <a 
                          href={`tel:${business.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors md:hidden"
                        >
                          <Phone className="h-4 w-4" />
                          <span className="font-medium">전화 걸기</span>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
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
                  <h2 className="text-4xl font-bold">신규 등록 업체</h2>
                  <p className="text-slate-600 mt-1">최근 DalConnect에 추가된 업체들</p>
                </div>
              </div>
              <Link href="/businesses?sort=recent">
                <Button variant="ghost" className="gap-2">
                  전체 보기 <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {false ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {recent.slice(0, 6).map((business) => (
                  <Link key={business.id} href={`/business/${business.id}`}>
                    <Card className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group">
                      <CardContent className="p-0">
                        {hasValidImage(business.cover_url) ? (
                          <div 
                            className="w-full h-48 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                            style={{ backgroundImage: `url(${business.cover_url})` }}
                          />
                        ) : (
                          <div className={`w-full h-48 bg-gradient-to-br ${getCategoryColor(business.category)} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
                            {(() => {
                              const iconName = getCategoryIcon(business.category) as keyof typeof Icons;
                              const IconComponent = Icons[iconName] as React.ComponentType<{ className?: string }>;
                              return IconComponent ? <IconComponent className="w-16 h-16 text-white/80" /> : null;
                            })()}
                          </div>
                        )}
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-xl font-bold text-slate-800 group-hover:text-primary transition-colors">
                              {business.name_ko || business.name_en}
                            </h3>
                            <Badge variant="secondary" className="ml-2">NEW</Badge>
                          </div>
                          <p className="text-slate-600 mb-3">{business.category}</p>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                              <span className="font-semibold">{business.rating || 'N/A'}</span>
                            </div>
                            <span className="text-slate-500 text-sm">
                              ({business.review_count || 0} 리뷰)
                            </span>
                          </div>
                          {business.address && (
                            <div className="flex items-start gap-2 text-sm text-slate-600">
                              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-2">{business.address}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {recentNews.map((news) => {
                const categoryStyle = getNewsCategoryStyle(news.category);
                return (
                  <a key={news.id} href={news.url} target="_blank" rel="noopener noreferrer">
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
                  </a>
                );
              })}
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
            DalConnect에 등록하고 더 많은 고객을 만나세요
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
