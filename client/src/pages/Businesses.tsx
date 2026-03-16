import { useState, useEffect, useRef } from "react";
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
import { getCategoryColor, getCategoryIcon, hasValidImage, proxyPhotoUrl } from "@/lib/imageDefaults";
import * as Icons from "lucide-react";
import { AdBanner, useFeaturedBusinesses } from "@/components/AdBanner";

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

// ── FilterSidebar must live OUTSIDE Businesses to prevent remount on re-render (IME fix) ──
interface FilterSidebarProps {
  searchInputRef: React.RefObject<HTMLInputElement>;
  composingRef: React.MutableRefObject<boolean>;
  defaultSearchValue: string;
  onSearchChange: (val: string) => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  selectedCategory: string;
  selectedCity: string;
  debouncedSearch: string;
  onRemoveFilter: (type: 'category' | 'city' | 'search') => void;
  onClearAll: () => void;
  categoriesData: any[] | undefined;
  onCategoryClick: (cat: string) => void;
  onCityClick: (city: string) => void;
}

const FilterSidebar = ({
  searchInputRef, composingRef, defaultSearchValue, onSearchChange,
  hasActiveFilters, activeFilterCount, selectedCategory, selectedCity,
  debouncedSearch, onRemoveFilter, onClearAll, categoriesData,
  onCategoryClick, onCityClick,
}: FilterSidebarProps) => (
  <div className="space-y-6">
    {/* Search */}
    <div>
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">검색</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          ref={searchInputRef}
          defaultValue={defaultSearchValue}
          className="pl-10 h-11 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          placeholder="업체명, 키워드..."
          onChange={(e) => { if (!composingRef.current) onSearchChange(e.target.value); }}
          onCompositionStart={() => { composingRef.current = true; }}
          onCompositionEnd={(e) => { composingRef.current = false; onSearchChange(e.currentTarget.value); }}
        />
      </div>
    </div>

    {/* Active Filters */}
    {hasActiveFilters && (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">적용 중 ({activeFilterCount})</label>
          <button onClick={onClearAll} className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">전체 해제</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedCategory && (
            <Badge variant="secondary" className="gap-1.5 pl-3 pr-2 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
              <span className="font-medium">{selectedCategory}</span>
              <X className="h-3.5 w-3.5 cursor-pointer" onClick={() => onRemoveFilter('category')} />
            </Badge>
          )}
          {selectedCity && (
            <Badge variant="secondary" className="gap-1.5 pl-3 pr-2 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
              <MapPin className="h-3 w-3" />
              <span className="font-medium">{selectedCity}</span>
              <X className="h-3.5 w-3.5 cursor-pointer" onClick={() => onRemoveFilter('city')} />
            </Badge>
          )}
          {debouncedSearch && (
            <Badge variant="secondary" className="gap-1.5 pl-3 pr-2 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200">
              <Search className="h-3 w-3" />
              <span className="font-medium">"{debouncedSearch}"</span>
              <X className="h-3.5 w-3.5 cursor-pointer" onClick={() => onRemoveFilter('search')} />
            </Badge>
          )}
        </div>
      </div>
    )}

    <Separator />

    {/* Categories */}
    <div>
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">카테고리</label>
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-1">
          {categoriesData?.map((cat) => {
            const isSelected = selectedCategory === cat.category;
            return (
              <button key={cat.category} onClick={() => onCategoryClick(cat.category)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all group ${isSelected ? 'bg-primary text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}>
                <span className="truncate flex-1 text-left">{cat.category}</span>
                <span className={`text-xs ml-3 px-2 py-0.5 rounded-full flex-shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>{cat.count}</span>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>

    <Separator />

    {/* Cities */}
    <div>
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">지역</label>
      <ScrollArea className="h-[280px] pr-4">
        <div className="space-y-1">
          {CITIES.map((city) => {
            const isSelected = selectedCity === city;
            return (
              <button key={city} onClick={() => onCityClick(city)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${isSelected ? 'bg-primary text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}>
                {city}
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  </div>
);

// 사이드바 광고 컴포넌트
function SidebarAds({ selectedCategory }: { selectedCategory: string }) {
  const featuredBusinesses = useFeaturedBusinesses(12);
  if (featuredBusinesses.length === 0) return null;
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <AdBanner
        size="rectangle"
        businesses={featuredBusinesses}
        category={selectedCategory || undefined}
        label="✨ 추천 업체"
      />
    </div>
  );
}

export default function Businesses() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);

  const [searchQuery, setSearchQuery] = useState(urlParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const composingRef = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState(urlParams.get('category') || '');
  const [selectedCity, setSelectedCity] = useState(urlParams.get('city') || '');
  const [sortBy, setSortBy] = useState(urlParams.get('sort') || 'featured');
  const [currentPage, setCurrentPage] = useState(parseInt(urlParams.get('page') || '1'));
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isAutoScraping, setIsAutoScraping] = useState(false);
  const [autoScrapeComplete, setAutoScrapeComplete] = useState(false);

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
    sort: sortBy,
  });

  const businesses = data?.businesses || [];
  const pagination = data?.pagination;
  const noResults = data?.no_results || false;

  // Auto-scrape when no results found
  useEffect(() => {
    if (noResults && debouncedSearch && !isAutoScraping && !autoScrapeComplete) {
      const performAutoScrape = async () => {
        setIsAutoScraping(true);
        try {
          console.log(`Auto-scraping for: "${debouncedSearch}"`);
          const response = await fetch('/api/auto-scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: debouncedSearch })
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('Auto-scrape result:', result);
            if (result.added > 0) {
              setAutoScrapeComplete(true);
              // Refresh the search after 1 second
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            }
          }
        } catch (error) {
          console.error('Auto-scrape failed:', error);
        } finally {
          setIsAutoScraping(false);
        }
      };
      
      performAutoScrape();
    }
  }, [noResults, debouncedSearch, isAutoScraping, autoScrapeComplete]);

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
    setMobileFiltersOpen(false); // 모바일: 선택 후 Sheet 닫기
  };

  const handleCityClick = (city: string) => {
    setSelectedCity(selectedCity === city ? '' : city);
    setCurrentPage(1);
    setMobileFiltersOpen(false); // 모바일: 선택 후 Sheet 닫기
  };

  const handleRemoveFilter = (type: 'category' | 'city' | 'search') => {
    if (type === 'category') setSelectedCategory('');
    if (type === 'city') setSelectedCity('');
    if (type === 'search') {
      setSearchQuery('');
      setDebouncedSearch('');
      if (searchInputRef.current) searchInputRef.current.value = '';
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
                  <FilterSidebar
                    searchInputRef={searchInputRef} composingRef={composingRef}
                    defaultSearchValue={searchQuery} onSearchChange={setSearchQuery}
                    hasActiveFilters={!!hasActiveFilters} activeFilterCount={activeFilterCount}
                    selectedCategory={selectedCategory} selectedCity={selectedCity}
                    debouncedSearch={debouncedSearch} onRemoveFilter={handleRemoveFilter}
                    onClearAll={clearAllFilters} categoriesData={categoriesData}
                    onCategoryClick={handleCategoryClick} onCityClick={handleCityClick}
                  />
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
            <div className="sticky top-24 space-y-4">
              {/* 필터 */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-primary" />
                  필터
                </h2>
                <FilterSidebar
                  searchInputRef={searchInputRef} composingRef={composingRef}
                  defaultSearchValue={searchQuery} onSearchChange={setSearchQuery}
                  hasActiveFilters={!!hasActiveFilters} activeFilterCount={activeFilterCount}
                  selectedCategory={selectedCategory} selectedCity={selectedCity}
                  debouncedSearch={debouncedSearch} onRemoveFilter={handleRemoveFilter}
                  onClearAll={clearAllFilters} categoriesData={categoriesData}
                  onCategoryClick={handleCategoryClick} onCityClick={handleCityClick}
                />
              </div>
              {/* 광고 사이드바 */}
              <SidebarAds selectedCategory={selectedCategory} />
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
              // Empty State with Auto-Scrape
              <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-6">
                  {isAutoScraping ? (
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                  ) : autoScrapeComplete ? (
                    <span className="text-4xl">✨</span>
                  ) : (
                    <Search className="h-10 w-10 text-slate-400" />
                  )}
                </div>
                
                {isAutoScraping ? (
                  <>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">
                      자동으로 찾는 중...
                    </h3>
                    <p className="text-slate-500 mb-6 max-w-md mx-auto">
                      "{debouncedSearch}" 관련 업체를 Google에서 검색하고 있습니다.
                      <br />잠시만 기다려주세요.
                    </p>
                  </>
                ) : autoScrapeComplete ? (
                  <>
                    <h3 className="text-2xl font-bold text-green-600 mb-2">
                      새로운 업체를 찾았습니다!
                    </h3>
                    <p className="text-slate-500 mb-6 max-w-md mx-auto">
                      페이지를 새로고침하고 있습니다...
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">검색 결과가 없습니다</h3>
                    <p className="text-slate-500 mb-6 max-w-md mx-auto">
                      찾으시는 업체가 없으신가요?
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
                      <a href="/register-business" className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                        📝 직접 업체 등록하기
                      </a>
                      <a href="/contact" className="inline-flex items-center justify-center px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium">
                        💬 업체 등록 요청하기
                      </a>
                    </div>
                    {hasActiveFilters && (
                      <Button onClick={clearAllFilters} size="lg" className="gap-2">
                        <X className="h-4 w-4" />
                        모든 필터 초기화
                      </Button>
                    )}
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Business List - Google Maps Style */}
                <div className="space-y-2">
                  {businesses.map((business) => (
                    <Link key={business.id} href={`/business/${business.id}`}>
                      <div className="bg-white border border-slate-200 hover:border-primary hover:shadow-md transition-all cursor-pointer p-3 flex gap-3 group rounded-lg">
                        {/* Compact Thumbnail */}
                        <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                          {hasValidImage(business.cover_url) ? (
                            <img
                              src={proxyPhotoUrl(business.cover_url) || business.cover_url!}
                              alt={business.name_ko || business.name_en}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  const iconName = getCategoryIcon(business.category);
                                  parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br ${getCategoryColor(business.category)} flex items-center justify-center"><span class="text-white text-xl">🏢</span></div>`;
                                }
                              }}
                            />
                          ) : (
                            <div
                              className={`w-full h-full bg-gradient-to-br ${getCategoryColor(
                                business.category
                              )} flex items-center justify-center`}
                            >
                              {(() => {
                                const iconName = getCategoryIcon(business.category) as keyof typeof Icons;
                                const IconComponent = Icons[iconName] as React.ComponentType<{ className?: string }>;
                                return IconComponent ? <IconComponent className="w-7 h-7 text-white/90" /> : null;
                              })()}
                            </div>
                          )}
                        </div>

                        {/* Compact Info - Single Line Layout */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          {/* Line 1: Title + Featured Badge */}
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors truncate">
                              {business.name_ko || business.name_en}
                            </h3>
                            {business.featured && (
                              <span className="text-yellow-500 text-sm flex-shrink-0">⭐</span>
                            )}
                          </div>

                          {/* Line 2: All Meta Info in One Line */}
                          <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                            {/* Category */}
                            <span className="font-medium text-primary">
                              {business.category}
                            </span>

                            {/* Rating */}
                            {business.rating && Number(business.rating) > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold text-slate-900">{business.rating}</span>
                                <span className="text-slate-400">({business.review_count || 0})</span>
                              </div>
                            )}

                            {/* Address */}
                            {business.address && (
                              <span className="truncate text-slate-500">
                                📍 {business.address}
                              </span>
                            )}

                            {/* Phone */}
                            {business.phone && (
                              <span className="text-slate-500 flex-shrink-0">
                                📞 {business.phone}
                              </span>
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
