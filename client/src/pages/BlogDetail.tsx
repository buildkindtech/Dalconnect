import { useRoute, Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Calendar, User, ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBlog } from "@/lib/api";
import ReactMarkdown from 'react-markdown';

export default function BlogDetail() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug || '';
  
  const { data: blog, isLoading } = useBlog(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-6 w-2/3 mb-8" />
          <Skeleton className="h-96 w-full mb-8" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-24 w-24 mx-auto text-slate-300 mb-6" />
          <h2 className="text-3xl font-bold text-slate-600 mb-4">
            블로그 포스트를 찾을 수 없습니다
          </h2>
          <Link href="/blog">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> 블로그 목록으로
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const metaTitle = blog.title ? `${blog.title} | DalKonnect` : "달라스 한인 블로그 | DalKonnect";
  const metaDesc = blog.content ? blog.content.replace(/[#*[\]()]/g, "").slice(0, 160) : "달라스 DFW 한인 커뮤니티 블로그";

  return (
    <>
    <Helmet>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDesc} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDesc} />
      {blog.cover_image && <meta property="og:image" content={blog.cover_image} />}
      <meta property="og:type" content="article" />
      <link rel="canonical" href={`https://dalkonnect.com/blog/${blog.slug}`} />
    </Helmet>
    <div className="min-h-screen bg-slate-50">
      {/* Back Button */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <Link href="/blog">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> 블로그 목록
            </Button>
          </Link>
        </div>
      </div>

      {/* Cover Image */}
      {blog.cover_image ? (
        <div 
          className="w-full h-96 bg-cover bg-center"
          style={{ backgroundImage: `url(${blog.cover_image})` }}
        />
      ) : (
        <div className="w-full h-96 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <BookOpen className="h-32 w-32 text-primary/20" />
        </div>
      )}

      {/* Article Content */}
      <article className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Category Badge */}
        {blog.category && (
          <Badge variant="secondary" className="mb-4">
            {blog.category}
          </Badge>
        )}

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
          {blog.title}
        </h1>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-6 text-slate-600 mb-8 pb-8 border-b">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <span className="font-medium">{blog.author}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span>
              {new Date(blog.published_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-lg prose-slate max-w-none">
          <ReactMarkdown
            components={{
              // Customize markdown rendering
              h1: ({node, ...props}) => <h1 className="text-3xl font-bold mt-8 mb-4" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-6 mb-3" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-xl font-bold mt-4 mb-2" {...props} />,
              p: ({node, ...props}) => <p className="mb-4 leading-relaxed" {...props} />,
              ul: ({node, ...props}) => <ul className="mb-4 ml-6 list-disc" {...props} />,
              ol: ({node, ...props}) => <ol className="mb-4 ml-6 list-decimal" {...props} />,
              li: ({node, ...props}) => <li className="mb-2" {...props} />,
              a: ({node, ...props}) => <a className="text-primary hover:underline" {...props} />,
              strong: ({node, ...props}) => <strong className="font-bold text-slate-800" {...props} />,
              blockquote: ({node, ...props}) => (
                <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-slate-600" {...props} />
              ),
              hr: ({node, ...props}) => <hr className="my-8 border-slate-200" {...props} />
            }}
          >
            {blog.content}
          </ReactMarkdown>
        </div>
      </article>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">더 많은 정보를 원하시나요?</h2>
          <p className="text-lg mb-8 opacity-90">
            DalKonnect에서 DFW 한인 업체 정보를 확인하세요
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/businesses">
              <Button size="lg" variant="secondary">
                업체 둘러보기
              </Button>
            </Link>
            <Link href="/blog">
              <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30">
                다른 블로그 보기
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
