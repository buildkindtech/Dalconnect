import { useParams, Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ExternalLink, Calendar, Building, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBusiness, type NewsItem } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

// Helper function to split content into paragraphs
function splitIntoParagraphs(content: string): string[] {
  // 먼저 \n\n으로 분리 시도
  const byNewline = content.split('\n\n').filter(p => p.trim().length > 0);
  
  // 이미 잘 나뉘어 있으면 그대로 사용
  if (byNewline.length >= 3) return byNewline.map(p => p.replace(/\n/g, ' ').trim());
  
  // 아니면 문장 단위로 스마트 분리 (3~5문장마다 단락)
  const sentences = content
    .replace(/\n/g, ' ')
    .split(/(?<=[.!?…。])\s+(?=[가-힣A-Z"'《【『])/g)
    .filter(s => s.trim().length > 10);
  
  if (sentences.length <= 2) return [content.replace(/\n/g, ' ').trim()];
  
  const paragraphs: string[] = [];
  const chunkSize = 3; // 3문장씩 묶기
  for (let i = 0; i < sentences.length; i += chunkSize) {
    const chunk = sentences.slice(i, i + chunkSize).join(' ').trim();
    if (chunk) paragraphs.push(chunk);
  }
  return paragraphs;
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

  // Fetch same category news list (modu.market 스타일 — 전체 목록)
  const { data: relatedNews } = useQuery<NewsItem[]>({
    queryKey: ['related-news', newsItem?.category, params.id],
    queryFn: async () => {
      if (!newsItem?.category) return [];
      const res = await fetch(`/api/news?category=${encodeURIComponent(newsItem.category)}&limit=30`);
      if (!res.ok) return [];
      const allNews = await res.json();
      return allNews.filter((item: NewsItem) => item.id !== params.id);
    },
    enabled: !!newsItem?.category
  });

  if (isLoading || (!newsItem && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (error || !newsItem) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-5xl">📰</div>
        <h1 className="text-2xl font-bold">기사를 불러올 수 없습니다</h1>
        <p className="text-muted-foreground text-sm">일시적인 오류이거나 삭제된 기사입니다.</p>
        <Link href="/news">
          <Button>뉴스 목록으로 돌아가기</Button>
        </Link>
      </div>
    );
  }

  const metaTitle = newsItem?.title ? `${newsItem.title} | DalKonnect` : "달라스 한인 뉴스 | DalKonnect";
  const metaDesc = newsItem?.content ? newsItem.content.slice(0, 160) : "달라스 DFW 한인 커뮤니티 최신 뉴스";
  const metaImage = newsItem?.thumbnail_url || "https://dalkonnect.com/og-image.png";

  return (
    <>
    <Helmet>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDesc} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:type" content="article" />
      <link rel="canonical" href={`https://dalkonnect.com/news/${newsItem?.id}`} />
    </Helmet>
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
            {/* Short content warning */}
            {(!newsItem.content || newsItem.content.length < 50) && (
              <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-900">
                  ⚠️ 이 뉴스는 요약본입니다. 전체 내용은 아래 원문 링크에서 확인하세요.
                </p>
              </div>
            )}

            <div className="prose prose-lg max-w-none">
              {(() => {
                const content = newsItem.content || ''; const isSummary = content.length >= 50 && content.length < 400; const hasContent = content.length >= 50;
                
                if (!hasContent) {
                  return (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-3xl">📰</span>
                      </div>
                      <p className="text-slate-500 mb-2 text-sm">출처: <strong>{newsItem.source}</strong></p>
                      <p className="text-slate-700 text-lg mb-8 leading-relaxed">
                        이 기사는 원문 페이지에서 전체 내용을 확인할 수 있습니다.
                      </p>
                      <a href={newsItem.url} target="_blank" rel="noopener noreferrer">
                        <Button size="lg" className="h-14 px-10 text-base bg-primary hover:bg-primary/90 shadow-lg">
                          원문 기사 읽기
                          <ExternalLink className="ml-2 h-5 w-5" />
                        </Button>
                      </a>
                    </div>
                  );
                }
                
                const paragraphs = splitIntoParagraphs(content);
                return (<>{isSummary && (<div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-700 font-medium">📋 요약본 — 전문은 아래 원문 링크</div>)}{paragraphs.map((paragraph, index) => {
                  const endsAbruptly = !paragraph.match(/[.!?…。]$/);
                  const displayText = endsAbruptly ? `${paragraph}...` : paragraph;
                  return (
                    <p 
                      key={index} 
                      className={`leading-relaxed text-slate-700 mb-6 ${
                        index === 0 
                          ? 'text-lg md:text-xl font-medium text-slate-800'
                          : 'text-base md:text-lg'
                      }`}
                    >
                      {displayText}
                    </p>
                  );
                })}
              </>);
              })()}
            </div>

            {/* Original Source Link - Prominent for short content */}
            <div className={`mt-8 pt-6 border-t ${(!newsItem.content || newsItem.content.length < 50) ? 'bg-blue-50 -mx-6 -mb-6 md:-mx-12 md:-mb-12 px-6 py-8 md:px-12' : ''}`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    📰 출처: <span className="text-primary">{newsItem.source}</span>
                  </p>
                  <p className="text-sm text-slate-600">
                    전문 기사는 원문에서 확인하세요
                  </p>
                </div>
                <a 
                  href={newsItem.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button 
                    className={newsItem.content && newsItem.content.length < 500 ? 'bg-primary hover:bg-primary/90 shadow-md' : ''}
                    variant={(!newsItem.content || newsItem.content.length < 50) ? 'default' : 'outline'}
                  >
                    원문 기사 보기
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
                <Button
                  variant="outline"
                  onClick={() => {
                    const kakao = (window as any).Kakao;
                    if (!kakao?.isInitialized()) return;
                    kakao.Share.sendDefault({
                      objectType: 'feed',
                      content: {
                        title: newsItem.title,
                        description: newsItem.content?.substring(0, 80) + '...' || 'DalKonnect 뉴스',
                        imageUrl: newsItem.thumbnail_url || 'https://dalkonnect.com/logo.png',
                        link: {
                          mobileWebUrl: `https://dalkonnect.com/news/${newsItem.id}`,
                          webUrl: `https://dalkonnect.com/news/${newsItem.id}`,
                        },
                      },
                      buttons: [{ title: '기사 보기', link: { mobileWebUrl: `https://dalkonnect.com/news/${newsItem.id}`, webUrl: `https://dalkonnect.com/news/${newsItem.id}` } }],
                    });
                  }}
                  className="gap-2"
                >
                  <img src="https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_small.png" alt="카카오" className="w-5 h-5" />
                  카카오 공유
                </Button>
              </div>
            </div>
          </div>
        </article>

        {/* 같은 카테고리 뉴스 목록 — modu.market 스타일 */}
        {relatedNews && relatedNews.length > 0 && (
          <div className="mt-10 border-t pt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold font-ko text-slate-800">
                {newsItem?.category} 전체 목록
                <span className="ml-2 text-sm font-normal text-muted-foreground">({relatedNews.length})</span>
              </h2>
              <Link href="/news">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                  전체 뉴스 보기 →
                </Button>
              </Link>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              {/* 헤더 */}
              <div className="grid grid-cols-[2rem_1fr_5rem] md:grid-cols-[2.5rem_1fr_6rem_5rem] bg-slate-50 px-4 py-2 text-xs font-semibold text-muted-foreground border-b">
                <span className="text-center">번호</span>
                <span>제목</span>
                <span className="hidden md:block text-right">출처</span>
                <span className="text-right">날짜</span>
              </div>
              {/* 목록 */}
              {relatedNews.map((item, idx) => (
                <Link key={item.id} href={`/news/${item.id}`}>
                  <div className={`grid grid-cols-[2rem_1fr_5rem] md:grid-cols-[2.5rem_1fr_6rem_5rem] px-4 py-3 text-sm border-b last:border-0 hover:bg-slate-50 cursor-pointer transition-colors ${item.id === params.id ? 'bg-primary/5 font-semibold' : ''}`}>
                    <span className="text-center text-muted-foreground text-xs">{relatedNews.length - idx}</span>
                    <span className="truncate pr-3 leading-snug font-ko">
                      {item.id === params.id && <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-1.5 mb-0.5" />}
                      {item.title}
                    </span>
                    <span className="hidden md:block text-right text-xs text-muted-foreground truncate">{item.source}</span>
                    <span className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      {item.published_date
                        ? new Date(item.published_date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
                        : ''}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 뒤로가기 */}
        <div className="mt-8 text-center">
          <Link href="/news">
            <Button variant="outline" size="lg" className="font-ko">
              <ArrowLeft className="mr-2 h-4 w-4" />
              뉴스 목록으로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
