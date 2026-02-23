import { Link } from "wouter";
import { Calendar, User, ArrowRight, BookOpen } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useBlogs } from "@/lib/api";

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  
  const { data: blogs, isLoading } = useBlogs({
    search: searchQuery || undefined,
    category: selectedCategory
  });

  const categories = ['맛집', '미용', '의료', '생활', '커뮤니티'];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <BookOpen className="h-16 w-16 mx-auto mb-6" />
            <h1 className="text-5xl font-bold mb-6">DalConnect 블로그</h1>
            <p className="text-xl opacity-90">
              달라스 한인 커뮤니티 생활 가이드와 유용한 정보
            </p>
          </div>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-96">
              <Input
                placeholder="블로그 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap justify-center">
              <Button
                variant={!selectedCategory ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(undefined)}
              >
                전체
              </Button>
              {categories.map(cat => (
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
              {blogs.map((blog) => (
                <Link key={blog.id} href={`/blog/${blog.slug}`}>
                  <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group h-full">
                    <CardContent className="p-0 flex flex-col h-full">
                      {blog.cover_image ? (
                        <div 
                          className="w-full h-48 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                          style={{ backgroundImage: `url(${blog.cover_image})` }}
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:from-primary/30 transition-all">
                          <BookOpen className="h-16 w-16 text-primary/40" />
                        </div>
                      )}
                      
                      <div className="p-6 flex-1 flex flex-col">
                        {blog.category && (
                          <Badge variant="secondary" className="mb-3 w-fit">
                            {blog.category}
                          </Badge>
                        )}
                        
                        <h3 className="text-xl font-bold text-slate-800 group-hover:text-primary transition-colors mb-3 line-clamp-2">
                          {blog.title}
                        </h3>
                        
                        {blog.excerpt && (
                          <p className="text-slate-600 line-clamp-3 mb-4 flex-1">
                            {blog.excerpt}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-sm text-slate-500 pt-4 border-t">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{blog.author}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(blog.published_at).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <Button variant="ghost" size="sm" className="gap-2 group-hover:gap-3 transition-all">
                            자세히 보기 <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <BookOpen className="h-24 w-24 mx-auto text-slate-300 mb-6" />
              <h3 className="text-2xl font-bold text-slate-600 mb-2">
                블로그 포스트가 없습니다
              </h3>
              <p className="text-slate-500">
                {searchQuery ? '검색 조건을 변경해보세요.' : '새로운 콘텐츠가 곧 업데이트됩니다.'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">더 많은 정보가 필요하신가요?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            DalConnect에서 350개 이상의 한인 업체 정보를 확인하세요
          </p>
          <Link href="/businesses">
            <Button size="lg" variant="secondary" className="h-14 px-10 text-lg">
              업체 둘러보기
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
