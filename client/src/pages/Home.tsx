import { Link } from "wouter";
import { Search, MapPin, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES, MOCK_BUSINESSES, MOCK_NEWS } from "@/data/mockData";
import * as LucideIcons from "lucide-react";
import heroImg from "@/assets/images/hero-dallas.jpg";

// Helper to render lucide icon from string
const Icon = ({ name, ...props }: { name: string, className?: string }) => {
  const LucideIcon = (LucideIcons as any)[name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('')] || LucideIcons.HelpCircle;
  return <LucideIcon {...props} />;
};

export default function Home() {
  const featuredBusinesses = MOCK_BUSINESSES.filter(b => b.featured).slice(0, 3);
  const recentNews = MOCK_NEWS.slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[500px] flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center z-0" 
          style={{ backgroundImage: `url(${heroImg})` }}
        />
        <div className="absolute inset-0 bg-slate-900/60 z-10" />
        
        <div className="relative z-20 container mx-auto px-4 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 font-ko tracking-tight">
            DFW 최고의 <br/><span className="text-primary">한인 업체들을 만나보세요</span>
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-slate-200">
            달라스-포트워스 한인 사회의 믿을 수 있는 식당, 서비스 및 최신 뉴스를 확인하세요.
          </p>
          
          <div className="max-w-3xl mx-auto bg-white rounded-full p-2 flex shadow-xl">
            <div className="flex-1 flex items-center px-4 border-r border-slate-200 text-slate-800">
              <Search className="h-5 w-5 text-slate-400 mr-2" />
              <Input 
                className="border-0 shadow-none focus-visible:ring-0 text-base h-12" 
                placeholder="어떤 업체를 찾으시나요?" 
              />
            </div>
            <div className="hidden md:flex flex-1 items-center px-4 text-slate-800">
              <MapPin className="h-5 w-5 text-slate-400 mr-2" />
              <Input 
                className="border-0 shadow-none focus-visible:ring-0 text-base h-12" 
                placeholder="지역 (예: 캐롤턴, 달라스...)" 
                defaultValue="Carrollton, TX"
              />
            </div>
            <Button size="lg" className="rounded-full px-8 h-12 text-base">검색</Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 font-ko">카테고리별 찾기</h2>
            <p className="text-muted-foreground">원하시는 서비스를 쉽고 빠르게 찾아보세요</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {CATEGORIES.map((cat) => (
              <Link href={`/listings?category=${cat.id}`} key={cat.id}>
                <a className="group block">
                  <Card className="border-0 shadow-sm hover:shadow-md transition-all group-hover:-translate-y-1 bg-white hover:bg-primary/5">
                    <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                      <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                        <Icon name={cat.icon} className="h-7 w-7" />
                      </div>
                      <h3 className="font-semibold">{cat.name}</h3>
                    </CardContent>
                  </Card>
                </a>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Businesses */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2 font-ko">추천 업체</h2>
              <p className="text-muted-foreground">커뮤니티에서 검증된 우수 업체들을 확인하세요</p>
            </div>
            <Link href="/listings">
              <a className="hidden md:flex items-center text-primary font-medium hover:underline">
                전체보기 <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredBusinesses.map(business => (
              <Link href={`/business/${business.id}`} key={business.id}>
                <a className="group">
                  <Card className="h-full overflow-hidden border-border hover:border-primary/50 transition-all hover:shadow-lg">
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={business.cover_url} 
                        alt={business.name_en} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <Badge className="absolute top-4 left-4 bg-secondary text-secondary-foreground border-none shadow-sm">
                        Featured
                      </Badge>
                    </div>
                    <CardContent className="p-6 relative">
                      <div className="absolute -top-10 right-6 h-16 w-16 rounded-full border-4 border-white bg-white overflow-hidden shadow-sm">
                        <img src={business.logo_url} alt="Logo" className="w-full h-full object-cover" />
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground mb-2">
                        <span className="capitalize">{business.category}</span>
                        <span className="mx-2">•</span>
                        <span>{business.city}</span>
                      </div>
                      
                      <h3 className="text-xl font-bold mb-1 font-ko group-hover:text-primary transition-colors">
                        {business.name_en} <span className="text-sm font-normal text-muted-foreground ml-1">{business.name_ko}</span>
                      </h3>
                      
                      <div className="flex items-center mb-4">
                        <Star className="h-4 w-4 text-secondary fill-secondary" />
                        <span className="font-semibold ml-1">{business.rating}</span>
                        <span className="text-muted-foreground text-sm ml-1">({business.review_count} reviews)</span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {business.description}
                      </p>
                    </CardContent>
                  </Card>
                </a>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Local News */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2 font-ko">커뮤니티 뉴스</h2>
              <p className="text-muted-foreground">달라스-포트워스 지역의 생생한 소식을 전해드립니다</p>
            </div>
            <Link href="/news">
              <a className="flex items-center text-primary font-medium hover:underline">
                더보기 <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {recentNews.map(news => (
              <a href={news.url} key={news.id} className="group flex flex-col h-full bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="h-48 overflow-hidden">
                  <img 
                    src={news.thumbnail_url} 
                    alt={news.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <Badge variant="outline" className="w-fit mb-3 bg-slate-100">{news.category}</Badge>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">{news.title}</h3>
                  <p className="text-muted-foreground text-sm flex-1 line-clamp-3">{news.content}</p>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{news.source}</span>
                    <span>{new Date(news.published_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-24 bg-primary text-white text-center">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 font-ko">비즈니스를 운영하시나요?</h2>
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-8">
            수천 명의 현지 한인들에게 비즈니스를 홍보하고 커뮤니티 성장에 참여하세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing">
              <Button size="lg" className="bg-white text-primary hover:bg-slate-100 rounded-full h-14 px-8 text-lg font-semibold">
                업체 등록하기
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-primary-foreground/10 rounded-full h-14 px-8 text-lg font-semibold">
              기존 업체 소유권 확인
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}