import { useState } from "wouter";
import { Search, MapPin, Star, Filter, Phone } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CATEGORIES } from "@/data/mockData";
import { useQuery } from "@tanstack/react-query";

export default function Listings() {
  // Fetch all businesses from API
  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ['businesses'],
    queryFn: async () => {
      const res = await fetch('/api/businesses');
      if (!res.ok) throw new Error('Failed to fetch businesses');
      return res.json();
    }
  });

  const cities = Array.from(new Set(businesses.map((b: any) => b.city).filter(Boolean)));

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Search Header */}
      <div className="bg-white border-b py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6 font-ko">업소록</h1>
          <div className="flex flex-col md:flex-row gap-4 max-w-4xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input className="pl-10 h-12 text-base" placeholder="업체명 또는 키워드 검색..." />
            </div>
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input className="pl-10 h-12 text-base" placeholder="지역 (예: 캐롤턴, 달라스...)" />
            </div>
            <Button className="h-12 px-8 text-base rounded-md">검색</Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-border sticky top-24">
            <div className="flex items-center gap-2 mb-6 font-semibold pb-4 border-b">
              <Filter className="h-5 w-5" />
              <span>상세 필터</span>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-sm text-slate-800 uppercase tracking-wider">카테고리</h3>
              <div className="space-y-3">
                {CATEGORIES.map(cat => (
                  <div key={cat.id} className="flex items-center space-x-2">
                    <Checkbox id={`cat-${cat.id}`} />
                    <Label htmlFor={`cat-${cat.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {cat.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-sm text-slate-800 uppercase tracking-wider">지역</h3>
              <div className="space-y-3">
                {cities.map(city => (
                  <div key={city} className="flex items-center space-x-2">
                    <Checkbox id={`city-${city}`} />
                    <Label htmlFor={`city-${city}`} className="text-sm font-medium leading-none">
                      {city}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-border">
            <p className="text-sm text-muted-foreground">총 <span className="font-bold text-foreground">{businesses.length}</span>개의 업체가 검색되었습니다</p>
            <select className="text-sm border-0 bg-transparent font-medium focus:ring-0 cursor-pointer">
              <option>추천순</option>
              <option>평점 높은순</option>
              <option>리뷰 많은순</option>
              <option>최신순</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">로딩 중...</p>
              </div>
            ) : businesses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">검색 결과가 없습니다</p>
              </div>
            ) : (
              businesses.map((business: any) => (
              <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row h-full">
                  <div className="w-full sm:w-64 h-48 sm:h-auto relative shrink-0">
                    <img 
                      src={business.cover_url} 
                      alt={business.name_en} 
                      className="w-full h-full object-cover"
                    />
                    {business.featured && (
                      <Badge className="absolute top-3 left-3 bg-secondary text-secondary-foreground border-none">
                        Featured
                      </Badge>
                    )}
                  </div>
                  
                  <CardContent className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center text-xs text-primary font-medium mb-1 uppercase tracking-wider">
                            {business.category}
                          </div>
                          <Link href={`/business/${business.id}`}>
                            <a className="text-2xl font-bold font-ko hover:text-primary transition-colors inline-block">
                              {business.name_en} <span className="text-base font-normal text-muted-foreground ml-1">{business.name_ko}</span>
                            </a>
                          </Link>
                        </div>
                        
                        <div className="flex items-center bg-slate-100 px-2 py-1 rounded-md">
                          <Star className="h-4 w-4 text-secondary fill-secondary" />
                          <span className="font-bold ml-1 text-sm">{business.rating}</span>
                          <span className="text-muted-foreground text-xs ml-1">({business.review_count})</span>
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-4 max-w-2xl">
                        {business.description}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-y-2 justify-between items-center pt-4 border-t border-slate-100">
                      <div className="flex items-center text-sm text-slate-600">
                        <MapPin className="h-4 w-4 mr-1.5 text-slate-400" />
                        {business.address}, {business.city}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="hidden sm:flex">
                          <Phone className="h-4 w-4 mr-2" />
                          전화하기
                        </Button>
                        <Link href={`/business/${business.id}`}>
                          <Button size="sm">자세히 보기</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}