import { Link } from "wouter";
import { useNews, type NewsItem } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronRight, Calendar, Building2, Plus, Filter } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { NewsSubmissionDialog } from "@/components/NewsSubmissionDialog";
import { getNewsCategoryStyle } from "@/lib/blogNewsDefaults";

const CATEGORIES = [
  { id: 'all', label: '전체', emoji: '📰' },
  { id: '로컬뉴스', label: '로컬뉴스', emoji: '🏙️' },
  { id: '한국뉴스', label: '한국뉴스', emoji: '🇰🇷' },
  { id: '미국뉴스', label: '미국뉴스', emoji: '🇺🇸' },
  { id: '월드뉴스', label: '월드뉴스', emoji: '🌍' },
  { id: '연예/드라마', label: '연예/드라마', emoji: '🎬' },
  { id: 'K-POP', label: 'K-POP', emoji: '🎤' },
  { id: '스포츠', label: '스포츠', emoji: '⚽' },
  { id: '패션/뷰티', label: '패션/뷰티', emoji: '👗' },
  { id: '건강', label: '건강', emoji: '💪' },
  { id: '육아', label: '육아', emoji: '👶' },
  { id: '부동산/숙소', label: '부동산/숙소', emoji: '🏠' },
  { id: '이민/비자', label: '이민/비자', emoji: '✈️' },
  { id: '세금/재정', label: '세금/재정', emoji: '💰' },
  { id: '취업/사업', label: '취업/사업', emoji: '💼' },
  { id: '생활정보', label: '생활정보', emoji: '📋' },
];

// Helper function to format relative time
function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const published = new Date(date);
  const diffMs = now.getTime() - published.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins}분 전`;
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    return published.toLocaleDateString('ko-KR', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  }
}

export default function News() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [displayedItems, setDisplayedItems] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const categoryTabsRef = useRef<HTMLDivElement>(null);
  
  const { data: allNewsItems, isLoading } = useNews(
    selectedCategory === 'all' ? undefined : { category: selectedCategory }
  );

  // Get items to display (pagination)
  const newsItems = allNewsItems ? allNewsItems.slice(0, displayedItems) : [];
  const hasMoreItems = allNewsItems ? allNewsItems.length > displayedItems : false;

  // Handle load more
  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading
    setDisplayedItems(prev => prev + 20);
    setIsLoadingMore(false);
  };

  // Handle category change with scroll to view
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setDisplayedItems(20); // Reset pagination
    
    // Scroll selected category into view
    setTimeout(() => {
      if (categoryTabsRef.current) {
        const selectedButton = categoryTabsRef.current.querySelector(`[data-category="${categoryId}"]`) as HTMLElement;
        if (selectedButton) {
          selectedButton.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest', 
            inline: 'center' 
          });
        }
      }
    }, 100);
  };

  const getCategoryEmoji = (category: string | null) => {
    if (!category) return '📰';
    const found = CATEGORIES.find(c => c.id === category);
    return found ? found.emoji : '📰';
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-4 font-ko">커뮤니티 뉴스</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            달라스-포트워스 한인 커뮤니티의 최신 소식과 유익한 정보
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          {/* Categories with horizontal scroll on mobile */}
          <div 
            ref={categoryTabsRef}
            className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-4 md:flex-wrap md:overflow-visible"
          >
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.id}
                data-category={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryChange(cat.id)}
                className="font-ko flex-shrink-0"
              >
                <span className="mr-1.5">{cat.emoji}</span>
                {cat.label}
              </Button>
            ))}
          </div>
          
          {/* Submit News Button - Separated on mobile */}
          <div className="flex justify-center md:justify-end">
            <NewsSubmissionDialog>
              <Button variant="outline" size="sm" className="font-ko">
                <Plus className="h-4 w-4 mr-1.5" />
                뉴스 제보
              </Button>
            </NewsSubmissionDialog>
          </div>
        </div>

        {/* News List */}
        <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden mb-8">
          {isLoading ? (
            <div className="divide-y">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="p-4 md:p-6 flex gap-4">
                  <Skeleton className="h-20 w-20 rounded flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : newsItems && newsItems.length > 0 ? (
            <div className="divide-y">
              {newsItems.map((news: NewsItem) => {
                const categoryStyle = getNewsCategoryStyle(news.category);
                return (
                  <Link 
                    href={`/news/${news.id}`}
                    key={news.id}
                    className="block"
                  >
                    <div 
                      className="p-4 md:p-6 hover:bg-slate-50 transition-colors cursor-pointer flex gap-4 items-start group"
                      data-testid={`news-item-${news.id}`}
                    >
                      {/* Thumbnail */}
                      {news.thumbnail_url ? (
                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-border">
                          <img 
                            src={news.thumbnail_url} 
                            alt={news.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br ${categoryStyle.gradient} flex items-center justify-center text-3xl">${categoryStyle.emoji}</div>`;
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className={`w-20 h-20 rounded-lg bg-gradient-to-br ${categoryStyle.gradient} flex items-center justify-center flex-shrink-0 text-3xl`}>
                          {categoryStyle.emoji}
                        </div>
                      )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2 font-ko">
                          {news.title}
                        </h3>
                        {news.category && (
                          <Badge variant="secondary" className="flex-shrink-0">
                            {news.category}
                          </Badge>
                        )}
                      </div>
                      
                      {news.content && (
                        <p className="text-sm text-slate-600 line-clamp-1 md:line-clamp-2 mb-3">
                          {news.content}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        {news.source && (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" />
                            <span>출처: {news.source}</span>
                          </div>
                        )}
                        {news.published_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{getRelativeTime(news.published_date)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-primary">
                          <ChevronRight className="h-3.5 w-3.5" />
                          <span>자세히 보기</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <div className="text-4xl mb-4">📰</div>
              <p className="text-lg font-ko">
                {selectedCategory === 'all' 
                  ? '뉴스가 없습니다' 
                  : `"${CATEGORIES.find(c => c.id === selectedCategory)?.label}" 카테고리에 뉴스가 없습니다`
                }
              </p>
            </div>
          )}
        </div>

        {/* Load More Button */}
        {hasMoreItems && (
          <div className="text-center mb-8">
            <Button 
              variant="outline" 
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="font-ko"
            >
              {isLoadingMore ? '로딩 중...' : '더보기'}
            </Button>
          </div>
        )}

        {/* Newsletter CTA */}
        <NewsletterSignup />
      </div>
    </div>
  );
}
