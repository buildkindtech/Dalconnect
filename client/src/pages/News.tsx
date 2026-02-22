import { MOCK_NEWS } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";

export default function News() {
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
          {MOCK_NEWS.map(news => (
            <a href={news.url} key={news.id} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-border flex flex-col h-full">
              <div className="h-64 overflow-hidden relative">
                <img 
                  src={news.thumbnail_url} 
                  alt={news.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <Badge className="absolute top-4 left-4 bg-primary text-white shadow-md">
                  {news.category}
                </Badge>
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors leading-tight font-ko">
                  {news.title}
                </h3>
                <p className="text-slate-600 flex-1 text-lg mb-6 leading-relaxed">
                  {news.content}
                </p>
                <div className="flex items-center justify-between text-sm font-medium text-slate-500 border-t pt-4">
                  <span className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-slate-200 mr-2 flex items-center justify-center text-xs text-slate-600">
                      {news.source.charAt(0)}
                    </div>
                    {news.source}
                  </span>
                  <span>{new Date(news.published_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}