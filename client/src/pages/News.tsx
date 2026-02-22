import { Link } from "wouter";
import { useNews, type NewsItem } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function News() {
  const { data: newsItems, isLoading } = useNews();

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-4 font-ko">커뮤니티 뉴스</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            달라스-포트워스 한인 커뮤니티의 최신 소식, 이벤트 및 비즈니스 뉴스를 확인하세요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {isLoading ? (
            [1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border">
                <Skeleton className="h-64 w-full" />
                <div className="p-8"><Skeleton className="h-6 w-3/4 mb-4" /><Skeleton className="h-4 w-full mb-2" /><Skeleton className="h-4 w-2/3" /></div>
              </div>
            ))
          ) : (
            (newsItems ?? []).map((news: NewsItem) => (
              <Link href={`/news/${news.id}`} key={news.id}>
                <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-border flex flex-col h-full cursor-pointer" data-testid={`card-news-${news.id}`}>
                <div className="h-64 overflow-hidden relative">
                  {news.thumbnail_url ? (
                    <img 
                      src={news.thumbnail_url} 
                      alt={news.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.classList.add('bg-gradient-to-br');
                          if (news.category === '한인커뮤니티') {
                            parent.classList.add('from-blue-500', 'to-purple-600');
                          } else if (news.category === '스포츠') {
                            parent.classList.add('from-green-500', 'to-teal-600');
                          } else if (news.category === '비즈니스') {
                            parent.classList.add('from-orange-500', 'to-red-600');
                          } else {
                            parent.classList.add('from-slate-500', 'to-slate-700');
                          }
                        }
                      }}
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${
                      news.category === '한인커뮤니티' ? 'from-blue-500 to-purple-600' :
                      news.category === '스포츠' ? 'from-green-500 to-teal-600' :
                      news.category === '비즈니스' ? 'from-orange-500 to-red-600' :
                      'from-slate-500 to-slate-700'
                    } flex items-center justify-center`}>
                      <div className="text-white text-center p-8">
                        <div className="text-6xl mb-4">
                          {news.category === '한인커뮤니티' ? '🇰🇷' :
                           news.category === '스포츠' ? '⚽' :
                           news.category === '비즈니스' ? '💼' :
                           '📰'}
                        </div>
                        <p className="text-xl font-bold opacity-90">{news.category}</p>
                      </div>
                    </div>
                  )}
                  <Badge className="absolute top-4 left-4 bg-primary text-white shadow-md">{news.category}</Badge>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors leading-tight font-ko">{news.title}</h3>
                  <p className="text-slate-600 flex-1 text-lg mb-6 leading-relaxed">{news.content}</p>
                  <div className="flex items-center justify-between text-sm font-medium text-slate-500 border-t pt-4">
                    <span className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-slate-200 mr-2 flex items-center justify-center text-xs text-slate-600">{news.source?.charAt(0)}</div>
                      {news.source}
                    </span>
                    <span>{news.published_date ? new Date(news.published_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
                  </div>
                </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
