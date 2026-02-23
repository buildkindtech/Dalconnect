import { Link } from "wouter";
import { Calendar, User, ArrowRight, BookOpen, Tag } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useBlogs } from "@/lib/api";
import { getBlogCategoryStyle } from "@/lib/blogNewsDefaults";

const CATEGORIES = [
  '맛집/식당',
  '볼거리/엔터테인먼트',
  '가볼만한곳',
  '유행/트렌드',
  '스포츠',
  '육아/교육',
  '부동산',
  '이민/비자',
  '건강/웰빙',
  '뷰티/패션',
  '커뮤니티 이벤트',
  '생활정보'
];

const AGE_GROUPS = [
  { value: 'all', label: '전체' },
  { value: '20s', label: '20대' },
  { value: '30s', label: '30대' },
  { value: '40s', label: '40대' },
  { value: '50s+', label: '50대+' }
];

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedAge, setSelectedAge] = useState<string>('all');
  
  const { data: blogs, isLoading } = useBlogs({
    search: searchQuery || undefined,
    category: selectedCategory,
    target_age: selectedAge !== 'all' ? selectedAge : undefined
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <BookOpen className="h-14 w-14 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-ko">DalConnect 블로그</h1>
            <p className="text-lg md:text-xl opacity-90">
              달라스 한인 커뮤니티 생활 가이드와 유용한 정보
            </p>
          </div>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="py-6 bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="w-full md:w-96">
              <Input
                placeholder="블로그 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            {/* Age Filter */}
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-sm font-medium text-slate-600">연령대:</span>
              {AGE_GROUPS.map(age => (
                <Button
                  key={age.value}
                  variant={selectedAge === age.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedAge(age.value)}
                >
                  {age.label}
                </Button>
              ))}
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-sm font-medium text-slate-600">카테고리:</span>
              <Button
                variant={!selectedCategory ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(undefined)}
              >
                전체
              </Button>
              {CATEGORIES.map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blog List */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardContent className="p-0">
                    <Skeleton className="w-full h-48" />
                    <div className="p-6 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : blogs && blogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogs.map((blog) => {
                const categoryStyle = getBlogCategoryStyle(blog.category);
                return (
                  <Link key={blog.id} href={`/blog/${blog.slug}`}>
                    <Card className="overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group h-full rounded-xl">
                      <CardContent className="p-0 flex flex-col h-full">
                        {blog.cover_url || blog.cover_image ? (
                          <div 
                            className="w-full h-48 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                            style={{ backgroundImage: `url(${blog.cover_url || blog.cover_image})` }}
                          />
                        ) : (
                          <div className={`w-full h-48 bg-gradient-to-br ${categoryStyle.gradient} flex items-center justify-center group-hover:scale-105 transition-all`}>
                            <span className="text-7xl">{categoryStyle.emoji}</span>
                          </div>
                        )}
                      
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          {blog.category && (
                            <Badge variant="secondary" className="w-fit">
                              {blog.category}
                            </Badge>
                          )}
                          {blog.target_age && blog.target_age !== 'all' && (
                            <Badge variant="outline" className="w-fit">
                              {blog.target_age === '20s' ? '20대' :
                               blog.target_age === '30s' ? '30대' :
                               blog.target_age === '40s' ? '40대' :
                               blog.target_age === '50s+' ? '50대+' : blog.target_age}
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="text-xl font-bold text-slate-800 group-hover:text-primary transition-colors mb-3 line-clamp-2 font-ko">
                          {blog.title}
                        </h3>
                        
                        {blog.excerpt && (
                          <p className="text-slate-600 line-clamp-3 mb-4 flex-1 text-sm">
                            {blog.excerpt}
                          </p>
                        )}

                        {/* Tags */}
                        {blog.tags && Array.isArray(blog.tags) && blog.tags.length > 0 && (
                          <div className="flex items-center gap-1 mb-4 flex-wrap">
                            <Tag className="h-3 w-3 text-slate-400" />
                            {blog.tags.slice(0, 3).map((tag: string, idx: number) => (
                              <span key={idx} className="text-xs text-slate-500">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5" />
                            <span>{blog.author}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              {new Date(blog.published_at).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <Button variant="ghost" size="sm" className="gap-2 group-hover:gap-3 transition-all w-full">
                            자세히 보기 <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <BookOpen className="h-24 w-24 mx-auto text-slate-300 mb-6" />
              <h3 className="text-2xl font-bold text-slate-600 mb-2">
                블로그 포스트가 없습니다
              </h3>
              <p className="text-slate-500">
                {searchQuery || selectedCategory ? '검색 조건을 변경해보세요.' : '새로운 콘텐츠가 곧 업데이트됩니다.'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-ko">더 많은 정보가 필요하신가요?</h2>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90">
            DalConnect에서 350개 이상의 한인 업체 정보를 확인하세요
          </p>
          <Link href="/businesses">
            <Button size="lg" variant="secondary" className="h-12 px-8 text-lg">
              업체 둘러보기
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
