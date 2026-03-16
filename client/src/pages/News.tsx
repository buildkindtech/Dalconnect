import { Link } from "wouter";
import { useNews, type NewsItem } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronRight, Calendar, Building2, Plus, Flame, TrendingUp } from "lucide-react";
import { useState, useRef } from "react";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { NewsSubmissionDialog } from "@/components/NewsSubmissionDialog";
import { getNewsCategoryStyle } from "@/lib/blogNewsDefaults";
import { AdBanner, useFeaturedBusinesses } from "@/components/AdBanner";

// 관심도 순 카테고리 정렬
const CATEGORIES = [
  { id: 'all', label: '전체', emoji: '📰' },
  { id: '로컬뉴스', label: '로컬', emoji: '📍' },
  { id: '미국뉴스', label: '미국', emoji: '🇺🇸' },
  { id: '한국뉴스', label: '한국', emoji: '🇰🇷' },
  { id: '월드뉴스', label: '세계', emoji: '🌍' },
  { id: 'K-POP', label: 'K-POP', emoji: '🎤' },
  { id: '스포츠', label: '스포츠', emoji: '⚽' },
  { id: '이민/비자', label: '이민/비자', emoji: '🛂' },
  { id: '세금/재정', label: '세금/재정', emoji: '💰' },
  { id: '부동산/숙소', label: '부동산', emoji: '🏠' },
  { id: '패션/뷰티', label: '패션/뷰티', emoji: '👗' },
  { id: '취업/사업', label: '취업/사업', emoji: '💼' },
  { id: '건강', label: '건강', emoji: '🏥' },
  { id: '육아', label: '육아', emoji: '👶' },
  { id: '테크', label: '테크', emoji: '💻' },
];

// 카테고리별 우선순위 (낮을수록 높음)
const CATEGORY_PRIORITY: Record<string, number> = {
  '로컬뉴스': 1,
  '미국뉴스': 2,
  '한국뉴스': 3,
  '월드뉴스': 4,
  'K-POP': 4,
  '스포츠': 5,
  '이민/비자': 6,
  '세금/재정': 7,
  '부동산/숙소': 8,
  '패션/뷰티': 9,
  '취업/사업': 10,
  '건강': 11,
  '육아': 12,
  '테크': 13,
};

function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const published = new Date(date);
  const diffMs = now.getTime() - published.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return published.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    '로컬뉴스': 'bg-blue-100 text-blue-800',
    '미국뉴스': 'bg-indigo-100 text-indigo-800',
    '한국뉴스': 'bg-red-100 text-red-800',
    '월드뉴스': 'bg-emerald-100 text-emerald-800',
    'K-POP': 'bg-pink-100 text-pink-800',
    '스포츠': 'bg-orange-100 text-orange-800',
    '이민/비자': 'bg-purple-100 text-purple-800',
    '세금/재정': 'bg-yellow-100 text-yellow-800',
    '부동산/숙소': 'bg-teal-100 text-teal-800',
    '패션/뷰티': 'bg-fuchsia-100 text-fuchsia-800',
    '취업/사업': 'bg-cyan-100 text-cyan-800',
    '건강': 'bg-lime-100 text-lime-800',
    '육아': 'bg-amber-100 text-amber-800',
    '테크': 'bg-indigo-100 text-indigo-800',
  };
  return colors[category] || 'bg-slate-100 text-slate-700';
}

// 헤드라인 카드 (큰 카드)
function HeadlineCard({ news, size = 'large' }: { news: NewsItem; size?: 'large' | 'medium' }) {
  const isLarge = size === 'large';
  return (
    <Link href={`/news/${news.id}`}>
      <div className={`group cursor-pointer bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 ${isLarge ? 'md:col-span-2' : ''}`}>
        {/* Image area */}
        {news.thumbnail_url ? (
          <div className={`${isLarge ? 'h-48 md:h-64' : 'h-40'} overflow-hidden bg-slate-100`}>
            <img 
              src={news.thumbnail_url} 
              alt={news.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        ) : (
          <div className={`${isLarge ? 'h-32 md:h-40' : 'h-24'} bg-gradient-to-br from-slate-800 to-slate-600 flex items-center justify-center`}>
            <span className={`${isLarge ? 'text-5xl' : 'text-3xl'}`}>
              {CATEGORIES.find(c => c.id === news.category)?.emoji || '📰'}
            </span>
          </div>
        )}
        <div className="p-4 md:p-5">
          <div className="flex items-center gap-2 mb-2">
            {news.category && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getCategoryColor(news.category)}`}>
                {news.category}
              </span>
            )}
            {news.published_date && (
              <span className="text-xs text-slate-400">{getRelativeTime(news.published_date)}</span>
            )}
          </div>
          <h3 className={`${isLarge ? 'text-xl md:text-2xl' : 'text-base md:text-lg'} font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2 font-ko leading-tight`}>
            {news.title}
          </h3>
          {news.content && news.content !== news.title && (
            <p className="text-sm text-slate-500 line-clamp-2 mt-2 font-ko">
              {news.content}
            </p>
          )}
          {news.source && (
            <p className="text-xs text-slate-400 mt-2">{news.source}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

// 뉴스 리스트 아이템 (컴팩트)
function NewsListItem({ news }: { news: NewsItem }) {
  return (
    <Link href={`/news/${news.id}`}>
      <div className="group flex gap-4 p-4 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100 last:border-0">
        {/* Thumbnail */}
        {news.thumbnail_url ? (
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
            <img 
              src={news.thumbnail_url} 
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
            />
          </div>
        ) : (
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg flex-shrink-0 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <span className="text-2xl">{CATEGORIES.find(c => c.id === news.category)?.emoji || '📰'}</span>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${getCategoryColor(news.category || '')}`}>
              {news.category}
            </span>
            {news.published_date && (
              <span className="text-[11px] text-slate-400">{getRelativeTime(news.published_date)}</span>
            )}
          </div>
          <h3 className="text-sm md:text-base font-bold text-slate-800 group-hover:text-primary transition-colors line-clamp-2 font-ko leading-snug">
            {news.title}
          </h3>
          {news.source && (
            <p className="text-[11px] text-slate-400 mt-1">{news.source}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

// 섹션 헤더
function SectionHeader({ emoji, title, count, onViewAll }: { emoji: string; title: string; count: number; onViewAll: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">{emoji}</span>
        <h2 className="text-lg md:text-xl font-bold text-slate-800 font-ko">{title}</h2>
        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{count}</span>
      </div>
      <button 
        onClick={onViewAll}
        className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
      >
        전체보기 <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function News() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [displayedItems, setDisplayedItems] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const categoryTabsRef = useRef<HTMLDivElement>(null);
  
  const { data: allNewsItems, isLoading, error: newsError } = useNews(
    selectedCategory === 'all' ? undefined : { category: selectedCategory }
  );

  const newsItems = allNewsItems ? allNewsItems.slice(0, displayedItems) : [];
  const hasMoreItems = allNewsItems ? allNewsItems.length > displayedItems : false;

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    setDisplayedItems(prev => prev + 20);
    setIsLoadingMore(false);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setDisplayedItems(20);
    setTimeout(() => {
      if (categoryTabsRef.current) {
        const btn = categoryTabsRef.current.querySelector(`[data-category="${categoryId}"]`) as HTMLElement;
        btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }, 100);
  };

  // Group news by category for the "all" view
  const groupedByCategory = allNewsItems ? 
    CATEGORIES.filter(c => c.id !== 'all').reduce((acc, cat) => {
      const items = allNewsItems.filter((n: NewsItem) => n.category === cat.id);
      if (items.length > 0) acc[cat.id] = items;
      return acc;
    }, {} as Record<string, NewsItem[]>) : {};

  // Pick headlines: latest from priority categories, preferring ones with thumbnails
  const headlines: NewsItem[] = [];
  if (allNewsItems && selectedCategory === 'all') {
    const priorityCats = ['로컬뉴스', '한국뉴스', '월드뉴스', 'K-POP', '이민/비자'];
    // First pass: items WITH thumbnails from priority cats
    for (const cat of priorityCats) {
      if (headlines.length >= 4) break;
      const item = allNewsItems.find((n: NewsItem) => n.category === cat && !headlines.includes(n) && n.thumbnail_url);
      if (item) headlines.push(item);
    }
    // Second pass: items from priority cats (any)
    for (const cat of priorityCats) {
      if (headlines.length >= 4) break;
      const item = allNewsItems.find((n: NewsItem) => n.category === cat && !headlines.includes(n));
      if (item) headlines.push(item);
    }
    // Fill remaining with latest
    for (const item of allNewsItems) {
      if (headlines.length >= 4) break;
      if (!headlines.includes(item)) headlines.push(item);
    }
  }

  const headlineIds = new Set(headlines.map(h => h.id));

  const allFeaturedNews = useFeaturedBusinesses(24);
  // 뉴스 페이지: leaderboard = 앞 8개, infeed = 뒤 8개 (겹치지 않게)
  const newsLeaderboard = allFeaturedNews.slice(0, 8);
  const newsInfeed = allFeaturedNews.slice(8, 24);

  return (
    <div className="bg-slate-50 min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 font-ko">📰 뉴스</h1>
          <p className="text-base text-muted-foreground">
            달라스 한인 커뮤니티를 위한 최신 뉴스
          </p>
        </div>

        {/* Category Pills */}
        <div className="mb-8">
          <div 
            ref={categoryTabsRef}
            className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 md:flex-wrap md:overflow-visible md:justify-center"
          >
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              const count = cat.id === 'all' ? allNewsItems?.length : groupedByCategory[cat.id]?.length;
              return (
                <button
                  key={cat.id}
                  data-category={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0
                    ${isActive 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-primary/30 hover:text-primary'
                    }
                    ${!count ? 'opacity-50' : ''}
                  `}
                >
                  <span>{cat.emoji}</span>
                  <span className="font-ko">{cat.label}</span>
                  {count ? <span className={`text-[10px] ${isActive ? 'text-white/70' : 'text-slate-400'}`}>{count}</span> : null}
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1,2,3].map(i => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
            {[1,2,3,4].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : selectedCategory === 'all' ? (
          /* ===== ALL VIEW: Headlines + Sections ===== */
          <div>
            {/* Headlines */}
            {headlines.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="h-5 w-5 text-red-500" />
                  <h2 className="text-lg font-bold text-slate-800 font-ko">오늘의 헤드라인</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {headlines.map((news, i) => (
                    <HeadlineCard key={news.id} news={news} size={i === 0 ? 'large' : 'medium'} />
                  ))}
                </div>
              </div>
            )}

            {/* 헤드라인 아래 광고 배너 */}
            {allFeaturedNews.length > 0 && (
              <div className="mb-8">
                <AdBanner size="leaderboard" businesses={newsLeaderboard} />
              </div>
            )}

            {/* Category Sections */}
            {Object.entries(groupedByCategory)
              .sort(([a], [b]) => (CATEGORY_PRIORITY[a] || 99) - (CATEGORY_PRIORITY[b] || 99))
              .map(([catId, items], sectionIdx) => {
                const cat = CATEGORIES.find(c => c.id === catId);
                if (!cat) return null;
                const displayItems = items.filter((n: NewsItem) => !headlineIds.has(n.id)).slice(0, 5);
                if (displayItems.length === 0) return null;
                
                return (
                  <>
                    <div key={catId} className="mb-8">
                      <SectionHeader 
                        emoji={cat.emoji} 
                        title={cat.label} 
                        count={items.length}
                        onViewAll={() => handleCategoryChange(catId)}
                      />
                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        {displayItems.map((news: NewsItem) => (
                          <NewsListItem key={news.id} news={news} />
                        ))}
                      </div>
                    </div>
                    {/* 2섹션마다 인피드 3-카드 광고 스트립 */}
                    {(sectionIdx + 1) % 2 === 0 && allFeaturedNews.length > 0 && (
                      <AdBanner size="infeed-strip" businesses={newsInfeed} />
                    )}
                  </>
                );
              })
            }
          </div>
        ) : (
          /* ===== FILTERED VIEW ===== */
          <div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-8">
              {isLoading ? (
                <div className="p-12 text-center text-slate-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p>뉴스를 불러오는 중...</p>
                </div>
              ) : newsError ? (
                <div className="p-12 text-center text-slate-500">
                  <div className="text-4xl mb-4">⚠️</div>
                  <p className="text-lg font-ko">뉴스를 불러오지 못했습니다</p>
                  <p className="text-sm text-slate-400 mt-2">잠시 후 다시 시도해주세요</p>
                </div>
              ) : newsItems.length > 0 ? (
                newsItems.map((news: NewsItem) => (
                  <NewsListItem key={news.id} news={news} />
                ))
              ) : (
                <div className="p-12 text-center text-slate-500">
                  <div className="text-4xl mb-4">{CATEGORIES.find(c => c.id === selectedCategory)?.emoji || '📰'}</div>
                  <p className="text-lg font-ko">
                    "{CATEGORIES.find(c => c.id === selectedCategory)?.label}" 뉴스가 아직 없습니다
                  </p>
                  <p className="text-sm text-slate-400 mt-2">전체 뉴스에서 확인해보세요</p>
                </div>
              )}
            </div>

            {hasMoreItems && (
              <div className="text-center mb-8">
                <Button 
                  variant="outline" 
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="font-ko px-8"
                >
                  {isLoadingMore ? '로딩 중...' : '더보기'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Newsletter */}
        <div className="mt-8">
          <NewsletterSignup />
        </div>
      </div>
    </div>
  );
}
