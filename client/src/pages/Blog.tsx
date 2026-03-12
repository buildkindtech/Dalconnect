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
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-ko">DalKonnect 블로그</h1>
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
        <div className="container mx-auto px-4 max-w-5xl">
          {isLoading ? (
            <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
              <div className="divide-y">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="p-4 md:p-6 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          ) : blogs && blogs.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
              <div className="divide-y">
                {blogs.map((blog) => {
                  return (
                    <Link key={blog.id} href={`/blog/${blog.slug}`}>
                      <div className="p-4 md:p-6 hover:bg-slate-50 transition-colors cursor-pointer group">
                        <div className="w-full">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2 font-ko">
                              {blog.title}
                            </h3>
                            {blog.category && (
                              <Badge variant="secondary" className="flex-shrink-0">
                                {blog.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      
                      <div className="p-6 flex-1 flex flex-col">
                          
                          {blog.excerpt && (
                            <p className="text-slate-600 line-clamp-2 mb-3 text-sm">
                              {blog.excerpt}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5" />
                                <span>{blog.author}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
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
                            
                            {blog.target_age && blog.target_age !== 'all' && (
                              <Badge variant="outline" className="text-xs">
                                {blog.target_age === '20s' ? '20대' :
                                 blog.target_age === '30s' ? '30대' :
                                 blog.target_age === '40s' ? '40대' :
                                 blog.target_age === '50s+' ? '50대+' : blog.target_age}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                );
                })}
              </div>
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
            DalKonnect에서 350개 이상의 한인 업체 정보를 확인하세요
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
