import { Link } from "wouter";
import { useNews, type NewsItem } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar, Building2, Plus, Filter } from "lucide-react";
import { useState } from "react";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { NewsSubmissionDialog } from "@/components/NewsSubmissionDialog";
import { getNewsCategoryStyle } from "@/lib/blogNewsDefaults";

const CATEGORIES = [
  { id: 'all', label: '전체', emoji: '📰' },
  { id: '로컬뉴스', label: '로컬뉴스', emoji: '🏙️' },
  { id: '한국뉴스', label: '한국뉴스', emoji: '🇰🇷' },
  { id: '미국뉴스', label: '미국뉴스', emoji: '🇺🇸' },
  { id: '월드뉴스', label: '월드뉴스', emoji: '🌍' },
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
  const { data: newsItems, isLoading } = useNews(
    selectedCategory === 'all' ? undefined : { category: selectedCategory }
  );

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
        <div className="mb-6 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className="font-ko"
              >
                <span className="mr-1.5">{cat.emoji}</span>
                {cat.label}
              </Button>
            ))}
          </div>
          
          {/* Submit News Button */}
          <NewsSubmissionDialog>
            <Button variant="outline" size="sm" className="font-ko">
              <Plus className="h-4 w-4 mr-1.5" />
              뉴스 제보
            </Button>
          </NewsSubmissionDialog>
        </div>

        {/* News List */}
        <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden mb-8">
          {isLoading ? (
            <div className="divide-y">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="p-6 flex gap-4">
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
                      className="p-6 hover:bg-slate-50 transition-colors cursor-pointer flex gap-4 items-start group"
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
                        <p className="text-sm text-slate-600 line-clamp-2 mb-3">
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
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>원문 보기</span>
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

        {/* Newsletter CTA */}
        <NewsletterSignup />
      </div>
    </div>
  );
}
