import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Search, MapPin, Star, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBusinesses, useCategories } from "@/lib/api";
import { getCategoryColor, getCategoryIcon, hasValidImage } from "@/lib/imageDefaults";
import * as Icons from "lucide-react";

const CITIES = [
  'Dallas',
  'Plano',
  'Carrollton',
  'Irving',
  'Richardson',
  'Frisco',
  'McKinney',
  'Arlington',
  'Fort Worth'
];

export default function Businesses() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);

  const [searchQuery, setSearchQuery] = useState(urlParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(urlParams.get('category') || '');
  const [selectedCity, setSelectedCity] = useState(urlParams.get('city') || '');
  const [currentPage, setCurrentPage] = useState(parseInt(urlParams.get('page') || '1'));
  const [showFilters, setShowFilters] = useState(false);

  const { data: categoriesData } = useCategories();
  const { data, isLoading } = useBusinesses({
    category: selectedCategory || undefined,
    city: selectedCity || undefined,
    search: searchQuery || undefined,
    page: currentPage,
    limit: 20,
  });

  const businesses = data?.businesses || [];
  const pagination = data?.pagination;

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedCity) params.set('city', selectedCity);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    const newSearch = params.toString();
    setLocation(`/businesses${newSearch ? `?${newSearch}` : ''}`, { replace: true });
  }, [searchQuery, selectedCategory, selectedCity, currentPage, setLocation]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value === 'all' ? '' : value);
    setCurrentPage(1);
  };

  const handleCityChange = (value: string) => {
    setSelectedCity(value === 'all' ? '' : value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedCity('');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-6">업체 찾기</h1>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  className="pl-12 h-12 text-base"
                  placeholder="업체 이름, 카테고리, 지역 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg">검색</Button>
              <Button 
                type="button" 
                variant="outline" 
                size="lg"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                필터
              </Button>
            </div>
          </form>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-slate-50 rounded-lg">
              <div>
                <label className="text-sm font-medium mb-2 block">카테고리</label>
                <Select value={selectedCategory || 'all'} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="전체 카테고리" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 카테고리</SelectItem>
                    {categoriesData?.map((cat) => (
                      <SelectItem key={cat.category} value={cat.category}>
                        {cat.category} ({cat.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">도시</label>
                <Select value={selectedCity || 'all'} onValueChange={handleCityChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="전체 도시" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 도시</SelectItem>
                    {CITIES.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button variant="outline" className="w-full" onClick={clearFilters}>
                  필터 초기화
                </Button>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {(searchQuery || selectedCategory || selectedCity) && (
            <div className="flex gap-2 mt-4 flex-wrap">
              {searchQuery && (
                <Badge variant="secondary" className="gap-2">
                  검색: {searchQuery}
                  <button onClick={() => setSearchQuery('')} className="ml-1">×</button>
                </Badge>
              )}
              {selectedCategory && (
                <Badge variant="secondary" className="gap-2">
                  카테고리: {selectedCategory}
                  <button onClick={() => setSelectedCategory('')} className="ml-1">×</button>
                </Badge>
              )}
              {selectedCity && (
                <Badge variant="secondary" className="gap-2">
                  도시: {selectedCity}
                  <button onClick={() => setSelectedCity('')} className="ml-1">×</button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-8">
        {pagination && (
          <p className="text-slate-600 mb-6">
            총 <span className="font-semibold">{pagination.total}</span>개의 업체
            {pagination.totalPages > 1 && ` (${pagination.page} / ${pagination.totalPages} 페이지)`}
          </p>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-0">
                  <Skeleton className="w-full h-48" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-slate-600 mb-4">검색 결과가 없습니다</p>
            <Button onClick={clearFilters}>필터 초기화</Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {businesses.map((business) => (
                <Link key={business.id} href={`/business/${business.id}`}>
                  <Card className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group h-full">
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
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-bold text-slate-800 group-hover:text-primary transition-colors line-clamp-1">
                            {business.name_ko || business.name_en}
                          </h3>
                          {business.featured && (
                            <Badge variant="default" className="ml-2 flex-shrink-0">추천</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{business.category}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                            <span className="font-semibold text-sm">{business.rating || 'N/A'}</span>
                          </div>
                          <span className="text-slate-500 text-xs">
                            ({business.review_count || 0})
                          </span>
                        </div>
                        {business.address && (
                          <div className="flex items-start gap-1 text-xs text-slate-600">
                            <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{business.address}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  이전
                </Button>
                
                {[...Array(pagination.totalPages)].map((_, i) => {
                  const page = i + 1;
                  // Show first, last, current, and adjacent pages
                  if (
                    page === 1 ||
                    page === pagination.totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? 'default' : 'outline'}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="px-2">...</span>;
                  }
                  return null;
                })}

                <Button
                  variant="outline"
                  disabled={currentPage === pagination.totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
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
