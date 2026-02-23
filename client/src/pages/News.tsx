import { Link } from "wouter";
import { useNews, type NewsItem } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Calendar, Building2 } from "lucide-react";

export default function News() {
  const { data: newsItems, isLoading } = useNews();

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-4 font-ko">커뮤니티 뉴스</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            달라스-포트워스 한인 커뮤니티의 최신 소식, 이벤트 및 비즈니스 뉴스
          </p>
        </div>

        {/* Clean List View */}
        <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
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
              {newsItems.map((news: NewsItem) => (
                <Link href={`/news/${news.id}`} key={news.id}>
                  <div 
                    className="p-6 hover:bg-slate-50 transition-colors cursor-pointer flex gap-4 items-start group"
                    data-testid={`news-item-${news.id}`}
                  >
                    {/* Small Thumbnail */}
                    {news.thumbnail_url ? (
                      <div className="w-20 h-20 rounded overflow-hidden flex-shrink-0 border border-border">
                        <img 
                          src={news.thumbnail_url} 
                          alt={news.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              parent.innerHTML = '<div class="w-full h-full bg-slate-100 flex items-center justify-center text-2xl">📰</div>';
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded bg-slate-100 flex items-center justify-center flex-shrink-0 text-2xl">
                        {news.category === '한인커뮤니티' ? '🇰🇷' :
                         news.category === '스포츠' ? '⚽' :
                         news.category === '비즈니스' ? '💼' :
                         '📰'}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2 font-ko">
                          {news.title}
                        </h3>
                        <Badge variant="secondary" className="flex-shrink-0">
                          {news.category}
                        </Badge>
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
                            <span>{news.source}</span>
                          </div>
                        )}
                        {news.published_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              {new Date(news.published_date).toLocaleDateString('ko-KR', { 
                                year: 'numeric',
                                month: 'short', 
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-primary">
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>자세히 보기</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <div className="text-4xl mb-4">📰</div>
              <p className="text-lg">뉴스가 없습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
