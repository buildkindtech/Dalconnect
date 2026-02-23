import { Link, useLocation } from "wouter";
import { Search, MapPin, Star, ArrowRight, UtensilsCrossed, Church, Heart, Scissors, Home as HomeIcon, Scale, Car, GraduationCap, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeaturedBusinesses, useNews } from "@/lib/api";
import { getCategoryColor, getCategoryIcon, hasValidImage } from "@/lib/imageDefaults";
import * as Icons from "lucide-react";

const CATEGORIES = [
  { id: 'Korean Restaurant', name: '식당', icon: UtensilsCrossed, color: 'bg-red-500' },
  { id: '교회', name: '교회', icon: Church, color: 'bg-purple-500' },
  { id: '병원', name: '병원', icon: Heart, color: 'bg-blue-500' },
  { id: '미용실', name: '미용실', icon: Scissors, color: 'bg-pink-500' },
  { id: '부동산', name: '부동산', icon: HomeIcon, color: 'bg-green-500' },
  { id: '법률/회계', name: '법률', icon: Scale, color: 'bg-indigo-500' },
  { id: '자동차', name: '자동차', icon: Car, color: 'bg-orange-500' },
  { id: '학원', name: '학원', icon: GraduationCap, color: 'bg-yellow-500' },
  { id: '한인마트', name: '마트', icon: ShoppingCart, color: 'bg-teal-500' },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: featuredBusinesses, isLoading: loadingFeatured } = useFeaturedBusinesses();
  const { data: newsItems, isLoading: loadingNews } = useNews();

  const featured = featuredBusinesses?.slice(0, 6) ?? [];
  const recentNews = newsItems?.slice(0, 3) ?? [];

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
            달라스-포트워스 지역 365개 한인 업체 정보와 최신 한인 뉴스
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-2 flex gap-2 shadow-2xl">
              <div className="flex-1 flex items-center px-4">
                <Search className="h-6 w-6 text-slate-400 mr-3" />
                <Input 
                  className="border-0 shadow-none focus-visible:ring-0 text-lg text-slate-800 h-14" 
                  placeholder="식당, 병원, 미용실... 무엇을 찾으시나요?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="h-14 px-8 text-lg">
                검색
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">카테고리</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
            {CATEGORIES.map((category) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="bg-white rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col items-center justify-center gap-4 group"
                >
                  <div className={`${category.color} w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <span className="font-semibold text-lg text-slate-800">{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

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
                <Link key={business.id} href={`/business/${business.id}`}>
                  <Card className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group">
                    <CardContent className="p-0">
                      {hasValidImage(business.cover_url) ? (
                        <div 
                          className="w-full h-48 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                          style={{ 
                            backgroundImage: `url(${business.cover_url})` 
                          }}
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
                          {business.featured && (
                            <Badge variant="default" className="ml-2">추천</Badge>
                          )}
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
              {recentNews.map((news) => (
                <a key={news.id} href={news.url} target="_blank" rel="noopener noreferrer">
                  <Card className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group">
                    <CardContent className="p-0">
                      {hasValidImage(news.thumbnail_url) ? (
                        <div 
                          className="w-full h-48 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                          style={{ 
                            backgroundImage: `url(${news.thumbnail_url})` 
                          }}
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                          <Icons.Newspaper className="w-16 h-16 text-white/60" />
                        </div>
                      )}
                      <div className="p-6">
                        <Badge variant="secondary" className="mb-3">
                          {news.category || '뉴스'}
                        </Badge>
                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-primary transition-colors line-clamp-2 mb-2">
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
              ))}
            </div>
          )}
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
