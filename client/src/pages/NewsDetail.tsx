import { useParams, Link } from "wouter";
import { ArrowLeft, ExternalLink, Calendar, Building, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBusiness, type NewsItem } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

// Helper function to split content into paragraphs
function splitIntoParagraphs(content: string): string[] {
  return content.split('\n\n').filter(paragraph => paragraph.trim().length > 0);
}

// Helper function to calculate reading time
function calculateReadingTime(content: string): number {
  return Math.max(1, Math.round(content.length / 500));
}

export default function NewsDetail() {
  const params = useParams();
  
  const { data: newsItem, isLoading, error } = useQuery<NewsItem>({
    queryKey: ['news', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/news?id=${params.id}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch news');
      return res.json();
    },
    enabled: !!params.id
  });

  // Fetch related news from same category
  const { data: relatedNews } = useQuery<NewsItem[]>({
    queryKey: ['related-news', newsItem?.category, params.id],
    queryFn: async () => {
      if (!newsItem?.category) return [];
      const res = await fetch(`/api/news?category=${encodeURIComponent(newsItem.category)}&limit=4`);
      if (!res.ok) return [];
      const allNews = await res.json();
      // Filter out current article and return only 3
      return allNews.filter((item: NewsItem) => item.id !== params.id).slice(0, 3);
    },
    enabled: !!newsItem?.category
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (error || !newsItem) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">뉴스를 찾을 수 없습니다</h1>
        <Link href="/news">
          <Button>뉴스 목록으로 돌아가기</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/news">
          <Button variant="ghost" className="mb-6 md:mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            뉴스 목록으로
          </Button>
        </Link>

        <article className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
          {/* Header */}
          <div className="p-8 md:p-12 border-b">
            <Badge className="mb-4 bg-primary text-white">{newsItem.category}</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-6 leading-tight font-ko">
              {newsItem.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Building className="h-4 w-4 mr-2" />
                <span>{newsItem.source}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                <span>
                  {newsItem.published_date 
                    ? new Date(newsItem.published_date).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : ''}
                </span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                <span>{calculateReadingTime(newsItem.content || '')}분 소요</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 md:p-12">
            <div className="prose prose-lg max-w-none">
              {(() => {
                const paragraphs = splitIntoParagraphs(newsItem.content || '');
                return paragraphs.map((paragraph, index) => (
                  <p 
                    key={index} 
                    className={`leading-relaxed text-slate-700 mb-6 ${
                      index === 0 
                        ? 'text-lg md:text-xl font-medium text-slate-800' // Lead paragraph style
                        : 'text-base md:text-lg'
                    }`}
                  >
                    {paragraph}
                  </p>
                ));
              })()}
            </div>

            {/* Original Source Link */}
            <div className="mt-12 pt-8 border-t">
              <p className="text-sm text-muted-foreground mb-4">
                더 자세한 내용은 원문 기사를 확인하세요:
              </p>
              <a 
                href={newsItem.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-primary hover:underline font-medium"
              >
                원문 기사 보기
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </div>
          </div>
        </article>

        {/* Related News */}
        {relatedNews && relatedNews.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6 font-ko">관련 뉴스</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {relatedNews.map((relatedItem) => (
                <Link key={relatedItem.id} href={`/news/${relatedItem.id}`}>
                  <article className="bg-white rounded-xl border border-border hover:shadow-md transition-shadow cursor-pointer">
                    {/* Thumbnail placeholder */}
                    <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/20 rounded-t-xl flex items-center justify-center">
                      {relatedItem.thumbnail_url ? (
                        <img 
                          src={relatedItem.thumbnail_url} 
                          alt={relatedItem.title}
                          className="w-full h-full object-cover rounded-t-xl"
                        />
                      ) : (
                        <div className="text-primary/60 font-semibold text-sm">
                          {relatedItem.source}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <Badge className="text-xs mb-2 bg-primary/10 text-primary border-0">
                        {relatedItem.category}
                      </Badge>
                      <h3 className="font-semibold text-sm md:text-base leading-tight mb-2 line-clamp-2">
                        {relatedItem.title}
                      </h3>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>
                          {relatedItem.published_date 
                            ? new Date(relatedItem.published_date).toLocaleDateString('ko-KR', {
                                month: 'short',
                                day: 'numeric'
                              })
                            : ''}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* Fixed Back to News Button for Mobile */}
        <div className="mt-12 text-center">
          <Link href="/news">
            <Button variant="outline" size="lg" className="font-ko">
              <ArrowLeft className="mr-2 h-4 w-4" />
              뉴스 목록으로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
