import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Search, MapPin, Star, Phone, Globe, SlidersHorizontal, X, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBusinesses, useCategories } from "@/lib/api";
import BusinessCard from "@/components/BusinessCard";
import { getCategoryColor, getCategoryIcon, hasValidImage } from "@/lib/imageDefaults";
import * as Icons from "lucide-react";

const CITIES = [
  'Dallas', 'Plano', 'Carrollton', 'Irving', 'Richardson', 'Frisco',
  'McKinney', 'Arlington', 'Fort Worth', 'Allen', 'Garland', 'Lewisville',
  'Denton', 'Flower Mound', 'Prosper', 'Southlake', 'Grapevine',
  'Colleyville', 'Keller', 'Euless', 'Bedford', 'Hurst'
];

const SORT_OPTIONS = [
  { value: 'featured', label: '추천순' },
  { value: 'rating', label: '평점순' },
  { value: 'name', label: '이름순' },
  { value: 'recent', label: '최신순' },
];

export default function Businesses() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);

  const [searchQuery, setSearchQuery] = useState(urlParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [selectedCategory, setSelectedCategory] = useState(urlParams.get('category') || '');
  const [selectedCity, setSelectedCity] = useState(urlParams.get('city') || '');
  const [sortBy, setSortBy] = useState(urlParams.get('sort') || 'featured');
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

  // Sync URL with state
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedCity) params.set('city', selectedCity);
    if (sortBy !== 'featured') params.set('sort', sortBy);
    if (currentPage > 1) params.set('page', currentPage.toString());
    const newSearch = params.toString();
    setLocation(`/businesses${newSearch ? `?${newSearch}` : ''}`, { replace: true });
  }, [debouncedSearch, selectedCategory, selectedCity, sortBy, currentPage, setLocation]);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(selectedCategory === category ? '' : category);
    setCurrentPage(1);
  };

  const handleCityClick = (city: string) => {
    setSelectedCity(selectedCity === city ? '' : city);
    setCurrentPage(1);
  };

  const handleRemoveFilter = (type: 'category' | 'city' | 'search') => {
    if (type === 'category') setSelectedCategory('');
    if (type === 'city') setSelectedCity('');
    if (type === 'search') {
      setSearchQuery('');
      setDebouncedSearch('');
    }
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedCategory('');
    setSelectedCity('');
    setSortBy('featured');
    setCurrentPage(1);
  };

  const hasActiveFilters = debouncedSearch || selectedCategory || selectedCity;
  const activeFilterCount = [debouncedSearch, selectedCategory, selectedCity].filter(Boolean).length;

  // Filter Sidebar Component
  const FilterSidebar = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
          검색
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            className="pl-10 h-11 border-slate-200 focus-visible:ring-primary"
            placeholder="업체명, 키워드..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Active Filters Tags */}
      {hasActiveFilters && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              적용 중 ({activeFilterCount})
            </label>
            <button
              onClick={clearAllFilters}
              className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              전체 해제
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedCategory && (
              <Badge
                variant="secondary"
                className="gap-1.5 pl-3 pr-2 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
              >
                <span className="font-medium">{selectedCategory}</span>
                <X
                  className="h-3.5 w-3.5 cursor-pointer hover:text-primary/70"
                  onClick={() => handleRemoveFilter('category')}
                />
              </Badge>
            )}
            {selectedCity && (
              <Badge
                variant="secondary"
                className="gap-1.5 pl-3 pr-2 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
              >
                <MapPin className="h-3 w-3" />
                <span className="font-medium">{selectedCity}</span>
                <X
                  className="h-3.5 w-3.5 cursor-pointer hover:text-blue-600"
                  onClick={() => handleRemoveFilter('city')}
                />
              </Badge>
            )}
            {debouncedSearch && (
              <Badge
                variant="secondary"
                className="gap-1.5 pl-3 pr-2 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200"
              >
                <Search className="h-3 w-3" />
                <span className="font-medium">"{debouncedSearch}"</span>
                <X
                  className="h-3.5 w-3.5 cursor-pointer hover:text-slate-600"
                  onClick={() => handleRemoveFilter('search')}
                />
              </Badge>
            )}
          </div>
        </div>
      )}

      <Separator />

      {/* Categories */}
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
          카테고리
        </label>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-1">
            {categoriesData?.map((cat) => {
              const isSelected = selectedCategory === cat.category;
              return (
                <button
                  key={cat.category}
                  onClick={() => handleCategoryClick(cat.category)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                    isSelected
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="truncate flex-1 text-left">{cat.category}</span>
                  <span
                    className={`text-xs ml-3 px-2 py-0.5 rounded-full flex-shrink-0 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* Cities */}
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
          지역
        </label>
        <ScrollArea className="h-[280px] pr-4">
          <div className="space-y-1">
            {CITIES.map((city) => {
              const isSelected = selectedCity === city;
              return (
                <button
                  key={city}
                  onClick={() => handleCityClick(city)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {city}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Building2 className="h-7 w-7 md:h-8 md:w-8 text-primary" />
                업소록
              </h1>
              {pagination && (
                <p className="text-sm md:text-base text-slate-500 mt-1">
                  총 <span className="font-bold text-primary">{pagination.total.toLocaleString()}</span>개 업체
                  {hasActiveFilters && (
                    <span className="text-slate-400 ml-2">
                      • {businesses.length}개 검색됨
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Mobile Filter Button */}
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden gap-2 relative">
                  <SlidersHorizontal className="h-4 w-4" />
                  필터
                  {activeFilterCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[340px] sm:w-[380px] p-0">
                <SheetHeader className="px-6 pt-6 pb-4 border-b">
                  <SheetTitle className="text-xl font-bold">필터</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-80px)] px-6 py-6">
                  <FilterSidebar isMobile={true} />
                </ScrollArea>
              </SheetContent>
            </Sheet>

            {/* Sort Dropdown - Desktop */}
            <div className="hidden md:flex items-center gap-2">
              <label className="text-sm text-slate-600 font-medium">정렬:</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 px-3 border border-slate-200 rounded-lg text-sm font-medium bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex gap-6 lg:gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-72 xl:w-80 flex-shrink-0">
            <div className="sticky top-24 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
                필터
              </h2>
              <FilterSidebar />
            </div>
          </aside>

          {/* Results */}
          <main className="flex-1 min-w-0">
            {/* Mobile Sort */}
            <div className="md:hidden mb-4 flex items-center gap-2">
              <label className="text-sm text-slate-600 font-medium flex-shrink-0">정렬:</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 h-10 px-3 border border-slate-200 rounded-lg text-sm font-medium bg-white"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 flex gap-4">
                    <Skeleton className="w-20 h-20 md:w-24 md:h-24 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-6 w-2/3" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : businesses.length === 0 ? (
              // Empty State
              <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-6">
                  <Search className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">검색 결과가 없습니다</h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                  다른 카테고리나 지역을 선택하거나 검색어를 변경해보세요.
                </p>
                {hasActiveFilters && (
                  <Button onClick={clearAllFilters} size="lg" className="gap-2">
                    <X className="h-4 w-4" />
                    모든 필터 초기화
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Business List */}
                <div className="space-y-3">
                  {businesses.map((business) => (
                    <Link key={business.id} href={`/business/${business.id}`}>
                      <div className="bg-white rounded-xl border border-slate-200 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer p-4 md:p-5 flex gap-4 group">
                        {/* Thumbnail */}
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-slate-100">
                          {hasValidImage(business.cover_url) ? (
                            <img
                              src={business.cover_url!}
                              alt={business.name_ko || business.name_en}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div
                              className={`w-full h-full bg-gradient-to-br ${getCategoryColor(
                                business.category
                              )} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                            >
                              {(() => {
                                const iconName = getCategoryIcon(business.category) as keyof typeof Icons;
                                const IconComponent = Icons[iconName] as React.ComponentType<{ className?: string }>;
                                return IconComponent ? <IconComponent className="w-10 h-10 md:w-12 md:h-12 text-white/90" /> : null;
                              })()}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          {/* Title Row */}
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary transition-colors truncate">
                                {business.name_ko || business.name_en}
                              </h3>
                              {business.name_ko && business.name_en && (
                                <p className="text-sm text-slate-500 truncate mt-0.5">{business.name_en}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {business.featured && (
                                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-sm">
                                  ⭐ 추천
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Meta Info */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                            {/* Category */}
                            <Badge variant="outline" className="border-primary/30 text-primary font-medium">
                              {business.category}
                            </Badge>

                            {/* Rating */}
                            {business.rating && Number(business.rating) > 0 && (
                              <div className="flex items-center gap-1.5">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-bold text-slate-900">{business.rating}</span>
                                <span className="text-slate-400">({business.review_count || 0})</span>
                              </div>
                            )}

                            {/* Location */}
                            {business.city && (
                              <div className="flex items-center gap-1 text-slate-600">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                <span className="font-medium">{business.city}</span>
                              </div>
                            )}
                          </div>

                          {/* Address */}
                          {business.address && (
                            <p className="text-sm text-slate-500 mt-2 line-clamp-1 flex items-start gap-1.5">
                              <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                              <span>{business.address}</span>
                            </p>
                          )}

                          {/* Contact Info */}
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                            {business.phone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5" />
                                <span className="font-medium">{business.phone}</span>
                              </div>
                            )}
                            {business.website && (
                              <div className="flex items-center gap-1.5 text-primary hover:text-primary/80">
                                <Globe className="h-3.5 w-3.5" />
                                <span className="font-medium">웹사이트</span>
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
                  <div className="flex flex-wrap justify-center items-center gap-2 mt-8 px-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                      className="min-w-[80px]"
                    >
                      이전
                    </Button>

                    {[...Array(pagination.totalPages)].map((_, i) => {
                      const page = i + 1;
                      const showPage =
                        page === 1 ||
                        page === pagination.totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1);

                      if (showPage) {
                        return (
                          <Button
                            key={page}
                            variant={page === currentPage ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="min-w-[40px]"
                          >
                            {page}
                          </Button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <span key={page} className="px-2 text-slate-400 font-medium">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === pagination.totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                      className="min-w-[80px]"
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
