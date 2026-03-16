import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Heart, Plus, TrendingUp, Flame } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface CommunityPost {
  id: string;
  title: string;
  nickname: string;
  category: string;
  views: number;
  likes: number;
  comment_count: number;
  is_pinned: boolean;
  created_at: string;
}

interface TrendingData {
  trending_topics: Array<{ topic: string; count: number; sentiment: string }>;
  popular_keywords: Array<{ keyword: string; count: number }>;
  recommended_content: Array<{ type: string; id: string; title: string }>;
}

const categories = [
  { id: 'all', name: '전체', color: 'default' },
  { id: '자유게시판', name: '자유게시판', color: 'blue' },
  { id: '맛집/음식', name: '맛집/음식', color: 'green' },
  { id: '육아/교육', name: '육아/교육', color: 'purple' },
  { id: '생활정보', name: '생활정보', color: 'orange' },
  { id: '뷰티/패션', name: '뷰티/패션', color: 'pink' },
  { id: '부동산', name: '부동산', color: 'red' },
  { id: 'Q&A', name: 'Q&A', color: 'yellow' },
];

const sortOptions = [
  { id: 'latest', name: '최신순' },
  { id: 'popular', name: '인기순' },
  { id: 'comments', name: '댓글순' },
];

export default function Community() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [page, setPage] = useState(1);

  const { data: postsData, isLoading } = useQuery({
    queryKey: ['community-posts', selectedCategory, sortBy, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        action: 'posts',
        category: selectedCategory,
        sort: sortBy,
        page: page.toString(),
        limit: '20',
      });
      const response = await fetch(`/api/community?${params}`);
      return response.json();
    },
  });

  const { data: trendingData } = useQuery<TrendingData>({
    queryKey: ['community-trending'],
    queryFn: async () => {
      const response = await fetch('/api/community?action=trending');
      return response.json();
    },
  });

  const { data: popularPosts } = useQuery({
    queryKey: ['community-popular'],
    queryFn: async () => {
      const params = new URLSearchParams({
        action: 'posts',
        sort: 'popular',
        limit: '5',
      });
      const response = await fetch(`/api/community?${params}`);
      return response.json();
    },
  });

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}시간 전`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}일 전`;
    }
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.color || 'default';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">커뮤니티</h1>
          <p className="text-gray-600">달라스 한인 커뮤니티에서 정보를 나누고 소통해보세요</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Category Tabs */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setPage(1);
                    }}
                    className="text-sm"
                  >
                    {category.name}
                  </Button>
                ))}
              </div>

              {/* Sort Options */}
              <div className="flex gap-2">
                {sortOptions.map((option) => (
                  <Button
                    key={option.id}
                    variant={sortBy === option.id ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setSortBy(option.id);
                      setPage(1);
                    }}
                  >
                    {option.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Posts List */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">게시글을 불러오는 중...</p>
                </div>
              ) : ((postsData?.data || postsData?.posts) as CommunityPost[])?.length > 0 ? (
                ((postsData?.data || postsData?.posts) as CommunityPost[]).map((post: CommunityPost) => (
                  <Link key={post.id} href={`/community/${post.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {post.is_pinned && (
                                <Badge variant="secondary" className="text-xs">
                                  <Flame className="w-3 h-3 mr-1" />
                                  공지
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {post.category}
                              </Badge>
                            </div>
                            
                            <h3 className="font-semibold text-gray-900 mb-2 truncate">
                              {post.title}
                            </h3>
                            
                            <div className="flex items-center text-sm text-gray-600 space-x-4">
                              <span>{post.nickname}</span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="w-4 h-4" />
                                {post.comment_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="w-4 h-4" />
                                {post.likes}
                              </span>
                              <span>조회 {post.views}</span>
                              <span>{formatTimeAgo(post.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-gray-600">아직 게시글이 없습니다.</p>
                    <p className="text-sm text-gray-500 mt-2">첫 번째 글을 작성해보세요!</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Pagination */}
            {((postsData?.data || postsData?.posts) as CommunityPost[])?.length === 20 && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                >
                  더 보기
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 space-y-6">
            {/* Write Button */}
            <Link href="/community/new">
              <Button className="w-full" size="lg">
                <Plus className="w-5 h-5 mr-2" />
                글쓰기
              </Button>
            </Link>

            {/* Popular Posts */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                  <Flame className="w-5 h-5 mr-2 text-orange-500" />
                  실시간 인기글 TOP 5
                </h3>
                <div className="space-y-3">
                  {((popularPosts?.data || popularPosts?.posts) as CommunityPost[])?.slice(0, 5).map((post: CommunityPost, index: number) => (
                    <Link key={post.id} href={`/community/${post.id}`}>
                      <div className="flex items-start space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 text-xs font-bold rounded-full flex items-center justify-center">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {post.title}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Heart className="w-3 h-3 mr-1" />
                            {post.likes}
                            <MessageCircle className="w-3 h-3 ml-2 mr-1" />
                            {post.comment_count}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trending Keywords */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                  이번주 트렌딩 키워드
                </h3>
                <div className="flex flex-wrap gap-2">
                  {trendingData?.popular_keywords?.map((keyword) => (
                    <Badge
                      key={keyword.keyword}
                      variant="secondary"
                      className="text-xs cursor-pointer hover:bg-blue-100"
                    >
                      #{keyword.keyword} ({keyword.count})
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900 mb-4">💡 AI 추천 콘텐츠</h3>
                <div className="space-y-3 text-sm">
                  <Link href="/businesses?category=한식당" className="block p-2 rounded hover:bg-gray-50">
                    <span className="text-blue-600 hover:underline">🍽️ 인기 한식당 모아보기</span>
                  </Link>
                  <Link href="/news?category=교육" className="block p-2 rounded hover:bg-gray-50">
                    <span className="text-blue-600 hover:underline">📚 최신 교육 뉴스</span>
                  </Link>
                  <Link href="/blog?category=생활정보" className="block p-2 rounded hover:bg-gray-50">
                    <span className="text-blue-600 hover:underline">🏠 생활정보 블로그</span>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Floating Write Button (Mobile) */}
      <Link href="/community/new">
        <Button
          size="lg"
          className="fixed bottom-6 right-6 lg:hidden shadow-lg rounded-full w-14 h-14 z-50"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </Link>
    </div>
  );
}