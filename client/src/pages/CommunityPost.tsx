import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Heart, 
  MessageCircle, 
  ArrowLeft, 
  Reply, 
  Trash2,
  Eye,
  Calendar,
  User,
  ExternalLink
} from "lucide-react";

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  nickname: string;
  category: string;
  views: number;
  likes: number;
  comment_count: number;
  tags: string[];
  created_at: string;
}

interface Comment {
  id: string;
  nickname: string;
  content: string;
  likes: number;
  created_at: string;
  replies: Comment[];
}

interface PostData {
  post: CommunityPost;
  comments: Comment[];
}

interface RecommendedContent {
  businesses: Array<{ id: string; name_ko: string; name_en: string; category: string }>;
  news: Array<{ id: string; title: string }>;
  blogs: Array<{ id: string; title: string; slug: string }>;
}

export default function CommunityPost() {
  const [match, params] = useRoute("/community/:id");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [commentForm, setCommentForm] = useState({ nickname: '', password: '', content: '' });
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [deleteForm, setDeleteForm] = useState({ id: '', password: '', type: '' });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('dk_liked') || '[]')); }
    catch { return new Set(); }
  });

  const postId = params?.id;

  const { data: postData, isLoading } = useQuery<PostData>({
    queryKey: ['community-post', postId],
    queryFn: async () => {
      const response = await fetch(`/api/community?action=post&id=${postId}`);
      if (!response.ok) throw new Error('Post not found');
      return response.json();
    },
    enabled: !!postId,
  });

  const { data: recommendedContent } = useQuery<RecommendedContent>({
    queryKey: ['recommended-content', postId],
    queryFn: async () => {
      if (!postData?.post?.content) return { businesses: [], news: [], blogs: [] };
      
      // Extract keywords from content
      const keywords = extractKeywords(postData.post.content);
      const searchQuery = keywords.slice(0, 3).join(' ');
      
      // Fetch related content in parallel
      const [businessesRes, newsRes, blogsRes] = await Promise.all([
        fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=businesses`).catch(() => null),
        fetch(`/api/news?limit=3`).catch(() => null),
        fetch(`/api/blogs?limit=3`).catch(() => null),
      ]);

      const results = { businesses: [], news: [], blogs: [] };

      if (businessesRes?.ok) {
        try {
          const businessData = await businessesRes.json();
          results.businesses = businessData.businesses?.slice(0, 3) || [];
        } catch (e) {
          console.error('Failed to parse business data:', e);
        }
      }
      if (newsRes?.ok) {
        try {
          const newsData = await newsRes.json();
          results.news = newsData.news?.slice(0, 3) || [];
        } catch (e) {
          console.error('Failed to parse news data:', e);
        }
      }
      if (blogsRes?.ok) {
        try {
          const blogData = await blogsRes.json();
          results.blogs = blogData.blogs?.slice(0, 3) || [];
        } catch (e) {
          console.error('Failed to parse blog data:', e);
        }
      }

      return results;
    },
    enabled: !!postData?.post,
  });

  const handleLike = (post_id?: string, comment_id?: string) => {
    const targetId = post_id || comment_id || '';
    if (likedIds.has(targetId)) {
      toast({ description: '이미 좋아요를 눌렀어요 ❤️' });
      return;
    }
    likeMutation.mutate({ post_id, comment_id });
  };

  const likeMutation = useMutation({
    mutationFn: async ({ post_id, comment_id }: { post_id?: string; comment_id?: string }) => {
      const response = await fetch('/api/community?action=like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id, comment_id }),
      });
      if (!response.ok) throw new Error('Like failed');
      return response.json();
    },
    onSuccess: (_, variables) => {
      const targetId = variables.post_id || variables.comment_id || '';
      const newLiked = new Set(Array.from(likedIds).concat(targetId));
      setLikedIds(newLiked);
      localStorage.setItem('dk_liked', JSON.stringify(Array.from(newLiked)));
      queryClient.invalidateQueries({ queryKey: ['community-post', postId] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (commentData: any) => {
      const response = await fetch('/api/community?action=comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentData),
      });
      if (!response.ok) throw new Error('Comment failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-post', postId] });
      setCommentForm({ nickname: '', password: '', content: '' });
      setReplyingTo(null);
      toast({ description: '댓글이 등록되었습니다.' });
    },
    onError: (error: any) => {
      toast({ 
        variant: "destructive",
        description: error.message || '댓글 등록에 실패했습니다.' 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, password, type }: { id: string; password: string; type: string }) => {
      const response = await fetch('/api/community?action=delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password, type }),
      });
      if (!response.ok) throw new Error('Delete failed');
      return response.json();
    },
    onSuccess: () => {
      if (deleteForm.type === 'post') {
        window.history.back();
      } else {
        queryClient.invalidateQueries({ queryKey: ['community-post', postId] });
      }
      setShowDeleteDialog(false);
      setDeleteForm({ id: '', password: '', type: '' });
      toast({ description: '삭제되었습니다.' });
    },
    onError: (error: any) => {
      toast({ 
        variant: "destructive",
        description: error.message === 'Invalid password' ? '비밀번호가 틀렸습니다.' : '삭제에 실패했습니다.' 
      });
    },
  });

  const extractKeywords = (content: string): string[] => {
    const text = content.replace(/<[^>]*>/g, ' ').toLowerCase();
    const words = text.match(/[가-힣a-z]+/g) || [];
    return words.filter(word => word.length > 1).slice(0, 10);
  };

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

  const handleSubmitComment = () => {
    if (!commentForm.nickname.trim() || !commentForm.password.trim() || !commentForm.content.trim()) {
      toast({ variant: "destructive", description: '모든 필드를 입력해주세요.' });
      return;
    }

    commentMutation.mutate({
      post_id: postId,
      parent_id: replyingTo,
      nickname: commentForm.nickname,
      password: commentForm.password,
      content: commentForm.content,
    });
  };

  const handleDelete = (id: string, type: 'post' | 'comment') => {
    setDeleteForm({ id, password: '', type });
    setShowDeleteDialog(true);
  };

  const renderComment = (comment: Comment, depth = 0) => (
    <div key={comment.id} className={`${depth > 0 ? 'ml-8 mt-4' : 'mt-6'} border-l-2 border-gray-100 pl-4`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-sm">{comment.nickname}</span>
            <span className="text-xs text-gray-500">{formatTimeAgo(comment.created_at)}</span>
          </div>
          <p className="text-gray-800 mb-3 whitespace-pre-wrap">{comment.content}</p>
          <div className="flex items-center gap-4 text-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleLike(undefined, comment.id)}
              className={`px-2 h-8 ${likedIds.has(comment.id) ? 'text-red-500' : ''}`}
            >
              <Heart className={`w-4 h-4 mr-1 ${likedIds.has(comment.id) ? 'fill-red-500' : ''}`} />
              {comment.likes}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(comment.id)}
              className="px-2 h-8"
            >
              <Reply className="w-4 h-4 mr-1" />
              답글
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(comment.id, 'comment')}
              className="px-2 h-8 text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies?.map(reply => renderComment(reply, depth + 1))}

      {/* Reply Form */}
      {replyingTo === comment.id && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="닉네임"
                value={commentForm.nickname}
                onChange={(e) => setCommentForm({...commentForm, nickname: e.target.value})}
              />
              <Input
                type="password"
                placeholder="비밀번호"
                value={commentForm.password}
                onChange={(e) => setCommentForm({...commentForm, password: e.target.value})}
              />
            </div>
            <Textarea
              placeholder="답글을 입력하세요..."
              value={commentForm.content}
              onChange={(e) => setCommentForm({...commentForm, content: e.target.value})}
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSubmitComment} disabled={commentMutation.isPending}>
                답글 등록
              </Button>
              <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}>
                취소
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!postData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">게시글을 찾을 수 없습니다</h2>
          <Link href="/community">
            <Button>커뮤니티로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { post, comments } = postData;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Link href="/community">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Post */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline">{post.category}</Badge>
                  {post.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>
                  ))}
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {post.nickname}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatTimeAgo(post.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    조회 {post.views}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose max-w-none mb-6"
                  dangerouslySetInnerHTML={{ __html: post.content
                    // 마크다운 링크 [텍스트](url) → <a> 태그
                    .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-800">$1 ↗</a>')
                    .replace(/\n/g, '<br>')
                  }}
                />
                
                <Separator className="my-6" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-2 ${likedIds.has(post.id) ? 'text-red-500 border-red-300' : ''}`}
                    >
                      <Heart className={`w-4 h-4 ${likedIds.has(post.id) ? 'fill-red-500' : ''}`} />
                      좋아요 {post.likes}
                    </Button>
                    <span className="flex items-center gap-1 text-gray-600">
                      <MessageCircle className="w-4 h-4" />
                      댓글 {post.comment_count}
                    </span>
                  </div>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(post.id, 'post')}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    삭제
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">댓글 {comments.length}개</h3>
              </CardHeader>
              <CardContent>
                {/* Comment Form */}
                <div className="space-y-3 mb-8">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="닉네임"
                      value={commentForm.nickname}
                      onChange={(e) => setCommentForm({...commentForm, nickname: e.target.value})}
                    />
                    <Input
                      type="password"
                      placeholder="비밀번호"
                      value={commentForm.password}
                      onChange={(e) => setCommentForm({...commentForm, password: e.target.value})}
                    />
                  </div>
                  <Textarea
                    placeholder="댓글을 입력하세요..."
                    value={commentForm.content}
                    onChange={(e) => setCommentForm({...commentForm, content: e.target.value})}
                    rows={3}
                  />
                  <Button onClick={handleSubmitComment} disabled={commentMutation.isPending}>
                    댓글 등록
                  </Button>
                </div>

                <Separator className="mb-6" />

                {/* Comments List */}
                {comments.length > 0 ? (
                  <div className="space-y-1">
                    {comments.map(comment => renderComment(comment))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - AI Recommendations */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h3 className="font-semibold">💡 관련 정보 추천</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Related Businesses */}
                {recommendedContent?.businesses && recommendedContent.businesses.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-sm">🏪 관련 업소</h4>
                    <div className="space-y-2">
                      {recommendedContent.businesses.map((business: any) => (
                        <Link key={business.id} href={`/business/${business.id}`}>
                          <div className="p-2 rounded hover:bg-gray-50 cursor-pointer border text-sm">
                            <div className="font-medium">{business.name_ko || business.name_en}</div>
                            <div className="text-xs text-gray-500">{business.category}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related News */}
                {recommendedContent?.news && recommendedContent.news.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-sm">📰 관련 뉴스</h4>
                    <div className="space-y-2">
                      {recommendedContent.news.map((news: any) => (
                        <Link key={news.id} href={`/news/${news.id}`}>
                          <div className="p-2 rounded hover:bg-gray-50 cursor-pointer border text-sm">
                            <div className="font-medium line-clamp-2">{news.title}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related Blogs */}
                {recommendedContent?.blogs && recommendedContent.blogs.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-sm">📝 관련 블로그</h4>
                    <div className="space-y-2">
                      {recommendedContent.blogs.map((blog: any) => (
                        <Link key={blog.id} href={`/blog/${blog.slug}`}>
                          <div className="p-2 rounded hover:bg-gray-50 cursor-pointer border text-sm">
                            <div className="font-medium line-clamp-2">{blog.title}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {(!recommendedContent?.businesses || recommendedContent.businesses.length === 0) && 
                 (!recommendedContent?.news || recommendedContent.news.length === 0) && 
                 (!recommendedContent?.blogs || recommendedContent.blogs.length === 0) && (
                  <div className="text-center text-gray-500 text-sm py-4">
                    관련 콘텐츠를 찾고 있어요...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Delete Dialog */}
        {showDeleteDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="font-semibold mb-4">삭제하시겠습니까?</h3>
              <Input
                type="password"
                placeholder="작성시 입력한 비밀번호"
                value={deleteForm.password}
                onChange={(e) => setDeleteForm({...deleteForm, password: e.target.value})}
                className="mb-4"
              />
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => deleteMutation.mutate(deleteForm)}
                  disabled={deleteMutation.isPending}
                >
                  삭제
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                >
                  취소
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}