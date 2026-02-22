import { useParams, Link } from "wouter";
import { ArrowLeft, ExternalLink, Calendar, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBusiness, type NewsItem } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export default function NewsDetail() {
  const params = useParams();
  
  const { data: newsItem, isLoading, error } = useQuery<NewsItem>({
    queryKey: ['news', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/news/${params.id}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch news');
      return res.json();
    },
    enabled: !!params.id
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
          <Button variant="ghost" className="mb-6">
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
            </div>
          </div>

          {/* Content */}
          <div className="p-8 md:p-12">
            <div className="prose prose-lg max-w-none">
              <p className="text-lg leading-relaxed text-slate-700 whitespace-pre-line">
                {newsItem.content}
              </p>
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

        {/* Related News (Placeholder for future) */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 font-ko">관련 뉴스</h2>
          <p className="text-muted-foreground">
            곧 관련 뉴스를 추천해드릴 예정입니다.
          </p>
        </div>
      </div>
    </div>
  );
}
