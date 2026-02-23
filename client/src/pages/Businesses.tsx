import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Search, MapPin, Star, Phone, Globe, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusinesses, useCategories } from "@/lib/api";
import { getCategoryColor, getCategoryIcon, hasValidImage } from "@/lib/imageDefaults";
import * as Icons from "lucide-react";

const CITIES = [
  'Dallas', 'Plano', 'Carrollton', 'Irving', 'Richardson', 'Frisco',
  'McKinney', 'Arlington', 'Fort Worth', 'Allen', 'Garland', 'Lewisville',
  'Denton', 'Flower Mound', 'Prosper', 'Southlake', 'Grapevine',
  'Colleyville', 'Keller', 'Euless', 'Bedford', 'Hurst'
];

export default function Businesses() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);

  const [searchQuery, setSearchQuery] = useState(urlParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [selectedCategory, setSelectedCategory] = useState(urlParams.get('category') || '');
  const [selectedCity, setSelectedCity] = useState(urlParams.get('city') || '');
  const [currentPage, setCurrentPage] = useState(parseInt(urlParams.get('page') || '1'));
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: categoriesData } = useCategories();
  const { data, isLoading } = useBusinesses({
    category: selectedCategory || undefined,
    city: selectedCity || undefined,
    search: debouncedSearch || undefined,
    page: currentPage,
    limit: 20,
  });

  const businesses = data?.businesses || [];
  const pagination = data?.pagination;

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedCity) params.set('city', selectedCity);
    if (currentPage > 1) params.set('page', currentPage.toString());
    const newSearch = params.toString();
    setLocation(`/businesses${newSearch ? `?${newSearch}` : ''}`, { replace: true });
  }, [debouncedSearch, selectedCategory, selectedCity, currentPage, setLocation]);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(selectedCategory === category ? '' : category);
    setCurrentPage(1);
  };

  const handleCityClick = (city: string) => {
    setSelectedCity(selectedCity === city ? '' : city);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedCategory('');
    setSelectedCity('');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedCity;

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            className="pl-10 h-10"
            placeholder="업체 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">적용된 필터</span>
            <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700">전체 해제</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedCategory && (
              <Badge variant="secondary" className="gap-1 text-xs">
                {selectedCategory}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategory('')} />
              </Badge>
            )}
            {selectedCity && (
              <Badge variant="secondary" className="gap-1 text-xs">
                {selectedCity}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCity('')} />
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary" className="gap-1 text-xs">
                "{searchQuery}"
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery('')} />
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Categories */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-3 uppercase tracking-wider">카테고리</h3>
        <div className="space-y-0.5">
          {categoriesData?.map((cat) => (
            <button
              key={cat.category}
              onClick={() => handleCategoryClick(cat.category)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                selectedCategory === cat.category
                  ? 'bg-primary text-white font-medium'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="truncate">{cat.category}</span>
              <span className={`text-xs ml-2 flex-shrink-0 ${
                selectedCategory === cat.category ? 'text-white/80' : 'text-slate-400'
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Cities */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-3 uppercase tracking-wider">지역</h3>
        <div className="space-y-0.5 max-h-64 overflow-y-auto">
          {CITIES.map((city) => (
            <button
              key={city}
              onClick={() => handleCityClick(city)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                selectedCity === city
                  ? 'bg-primary text-white font-medium'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">업소록</h1>
              {pagination && (
                <p className="text-slate-500 mt-1">
                  총 <span className="font-semibold text-slate-700">{pagination.total}</span>개 업체
                </p>
              )}
            </div>
            {/* Mobile filter toggle */}
            <Button
              variant="outline"
              className="lg:hidden"
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            >
              필터 {mobileFiltersOpen ? '닫기' : '열기'}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-4 bg-white rounded-xl border p-4 shadow-sm">
              <FilterSidebar />
            </div>
          </aside>

          {/* Mobile Filters */}
          {mobileFiltersOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFiltersOpen(false)} />
              <div className="absolute left-0 top-0 bottom-0 w-80 bg-white p-4 overflow-y-auto shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">필터</h2>
                  <button onClick={() => setMobileFiltersOpen(false)}>
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <FilterSidebar />
              </div>
            </div>
          )}

          {/* Results - List View */}
          <main className="flex-1 min-w-0">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg border p-4 flex gap-4">
                    <Skeleton className="w-20 h-20 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : businesses.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border">
                <p className="text-xl text-slate-600 mb-4">검색 결과가 없습니다</p>
                <Button onClick={clearFilters}>필터 초기화</Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {businesses.map((business) => (
                    <Link key={business.id} href={`/business/${business.id}`}>
                      <div className="bg-white rounded-lg border hover:shadow-md hover:border-primary/30 transition-all cursor-pointer p-4 flex gap-4 group">
                        {/* Thumbnail */}
                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                          {hasValidImage(business.cover_url) ? (
                            <img
                              src={business.cover_url!}
                              alt={business.name_ko || business.name_en}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className={`w-full h-full bg-gradient-to-br ${getCategoryColor(business.category)} flex items-center justify-center`}>
                              {(() => {
                                const iconName = getCategoryIcon(business.category) as keyof typeof Icons;
                                const IconComponent = Icons[iconName] as React.ComponentType<{ className?: string }>;
                                return IconComponent ? <IconComponent className="w-8 h-8 text-white/80" /> : null;
                              })()}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-slate-900 group-hover:text-primary transition-colors truncate">
                                {business.name_ko || business.name_en}
                              </h3>
                              {business.name_ko && business.name_en && (
                                <p className="text-xs text-slate-400 truncate">{business.name_en}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {business.featured && (
                                <Badge variant="default" className="text-xs">추천</Badge>
                              )}
                              <Badge variant="outline" className="text-xs">{business.category}</Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 mt-1.5 text-sm text-slate-600">
                            {business.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">{business.rating}</span>
                                <span className="text-slate-400">({business.review_count || 0})</span>
                              </div>
                            )}
                            {business.address && (
                              <div className="flex items-center gap-1 truncate">
                                <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                                <span className="truncate">{business.address}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                            {business.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span>{business.phone}</span>
                              </div>
                            )}
                            {business.website && (
                              <div className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                <span className="truncate">웹사이트</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      이전
                    </Button>
                    
                    {[...Array(pagination.totalPages)].map((_, i) => {
                      const page = i + 1;
                      if (
                        page === 1 ||
                        page === pagination.totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <Button
                            key={page}
                            variant={page === currentPage ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="px-1 text-slate-400">...</span>;
                      }
                      return null;
                    })}

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === pagination.totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      다음
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
