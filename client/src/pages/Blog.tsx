import { Link } from "wouter";
import { Calendar, User, BookOpen, Clock } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useBlogs } from "@/lib/api";

const CATEGORIES = [
  { label: '🍽️ 맛집/식당', value: '맛집/식당' },
  { label: '🎢 가볼만한곳', value: '가볼만한곳' },
  { label: '📚 육아/교육', value: '육아/교육' },
  { label: '🏠 부동산', value: '부동산' },
  { label: '💊 건강/웰빙', value: '건강/웰빙' },
  { label: '✈️ 이민/비자', value: '이민/비자' },
  { label: '💄 뷰티/패션', value: '뷰티/패션' },
  { label: '📝 생활정보', value: '생활정보' },
  { label: '🎉 커뮤니티 이벤트', value: '커뮤니티 이벤트' },
  { label: '⚽ 스포츠', value: '스포츠' },
  { label: '🎬 볼거리/엔터테인먼트', value: '볼거리/엔터테인먼트' },
  { label: '🔥 유행/트렌드', value: '유행/트렌드' },
];

const CATEGORY_EMOJI: Record<string, string> = {
  '맛집/식당': '🍽️', '가볼만한곳': '🎢', '육아/교육': '📚',
  '부동산': '🏠', '건강/웰빙': '💊', '이민/비자': '✈️',
  '뷰티/패션': '💄', '생활정보': '📝', '커뮤니티 이벤트': '🎉',
  '스포츠': '⚽', '볼거리/엔터테인먼트': '🎬', '유행/트렌드': '🔥',
};

function readingTime(content?: string): number {
  return Math.max(1, Math.round((content?.length || 0) / 500));
}

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  
  const { data: blogs, isLoading } = useBlogs({
    search: searchQuery || undefined,
    category: selectedCategory,
  });

  // Featured = 최신 3개 (이미지 유무 관계없이)
  const featured = blogs?.slice(0, 3) || [];
  const rest = blogs?.slice(3) || [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-90" />
          <h1 className="text-3xl md:text-4xl font-bold mb-2 font-ko">블로그</h1>
          <p className="text-lg opacity-80">달라스 한인을 위한 생활 가이드 & 유용한 정보</p>
        </div>
      </section>

      {/* Search & Category */}
      <section className="py-4 bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-3">
            <Input
              placeholder="블로그 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-96"
            />
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={!selectedCategory ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(undefined)}
              >
                전체
              </Button>
              {CATEGORIES.map(cat => (
                <Button
                  key={cat.value}
                  variant={selectedCategory === cat.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.value)}
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm border">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : blogs && blogs.length > 0 ? (
            <>
              {/* Featured (큰 카드 3개) */}
              {!selectedCategory && !searchQuery && featured.length > 0 && (
                <div className="mb-10">
                  <h2 className="text-2xl font-bold mb-5 font-ko">📌 추천 글</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {featured.map((blog, i) => (
                      <Link key={blog.id} href={`/blog/${blog.slug}`}>
                        <article className={`bg-white rounded-xl overflow-hidden shadow-sm border hover:shadow-lg transition-all cursor-pointer group ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}>
                          <div className={`relative ${i === 0 ? 'h-64 md:h-80' : 'h-48'} bg-gradient-to-br from-emerald-50 to-teal-100`}>
                            {blog.cover_image ? (
                              <img src={blog.cover_image} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className={i === 0 ? 'text-8xl' : 'text-6xl'}>{CATEGORY_EMOJI[blog.category || ''] || '📝'}</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                              <Badge className="mb-2 bg-white/20 text-white border-0 backdrop-blur-sm">
                                {CATEGORY_EMOJI[blog.category || ''] || '📝'} {blog.category}
                              </Badge>
                              <h3 className={`font-bold leading-tight font-ko ${i === 0 ? 'text-xl md:text-2xl' : 'text-lg'}`}>
                                {blog.title}
                              </h3>
                            </div>
                          </div>
                        </article>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* 전체 리스트 (카드 그리드) */}
              <h2 className="text-2xl font-bold mb-5 font-ko">
                {selectedCategory ? `${CATEGORY_EMOJI[selectedCategory] || ''} ${selectedCategory}` : '📖 전체 글'}
                <span className="text-base font-normal text-muted-foreground ml-2">
                  ({(selectedCategory || searchQuery ? blogs : rest).length}개)
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(selectedCategory || searchQuery ? blogs : rest).map(blog => (
                  <Link key={blog.id} href={`/blog/${blog.slug}`}>
                    <article className="bg-white rounded-xl overflow-hidden shadow-sm border hover:shadow-lg transition-all cursor-pointer group h-full flex flex-col">
                      {/* Cover */}
                      <div className="h-48 relative overflow-hidden">
                        {blog.cover_image ? (
                          <img
                            src={blog.cover_image}
                            alt={blog.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center">
                            <span className="text-5xl">{CATEGORY_EMOJI[blog.category || ''] || '📝'}</span>
                          </div>
                        )}
                        {blog.category && (
                          <Badge className="absolute top-3 left-3 bg-white/90 text-slate-700 border-0 shadow-sm text-xs">
                            {CATEGORY_EMOJI[blog.category] || ''} {blog.category}
                          </Badge>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2 mb-2 font-ko">
                          {blog.title}
                        </h3>
                        {blog.excerpt && (
                          <p className="text-sm text-slate-500 line-clamp-2 mb-3 flex-1">
                            {blog.excerpt}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-slate-400 mt-auto pt-2 border-t">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {blog.author || 'DalKonnect'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(blog.published_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {readingTime(blog.content)}분
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <BookOpen className="h-20 w-20 mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-500 mb-2">블로그 포스트가 없습니다</h3>
              <p className="text-slate-400">
                {searchQuery || selectedCategory ? '검색 조건을 변경해보세요.' : '새로운 콘텐츠가 곧 업데이트됩니다.'}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
