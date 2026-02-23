import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, X, Plus } from "lucide-react";

const categories = [
  { id: '자유게시판', name: '자유게시판', description: '자유로운 주제의 대화' },
  { id: '맛집/음식', name: '맛집/음식', description: '맛집 추천, 요리 레시피' },
  { id: '육아/교육', name: '육아/교육', description: '육아 정보, 학교 관련' },
  { id: '생활정보', name: '생활정보', description: '실용적인 생활 팁' },
  { id: '뷰티/패션', name: '뷰티/패션', description: '뷰티, 패션 정보' },
  { id: '부동산', name: '부동산', description: '부동산 관련 정보' },
  { id: 'Q&A', name: 'Q&A', description: '궁금한 것을 물어보세요' },
];

export default function CommunityNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [form, setForm] = useState({
    nickname: '',
    password: '',
    title: '',
    content: '',
    category: '자유게시판',
    tags: [] as string[],
  });

  const [newTag, setNewTag] = useState('');

  const createPostMutation = useMutation({
    mutationFn: async (postData: any) => {
      const response = await fetch('/api/community?action=create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create post');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({ description: '게시글이 등록되었습니다!' });
      setLocation(`/community/${data.post.id}`);
    },
    onError: (error: any) => {
      toast({ 
        variant: "destructive",
        description: error.message || '게시글 등록에 실패했습니다.' 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.nickname.trim()) {
      toast({ variant: "destructive", description: '닉네임을 입력해주세요.' });
      return;
    }
    
    if (!form.password.trim()) {
      toast({ variant: "destructive", description: '비밀번호를 입력해주세요.' });
      return;
    }
    
    if (!form.title.trim()) {
      toast({ variant: "destructive", description: '제목을 입력해주세요.' });
      return;
    }
    
    if (!form.content.trim()) {
      toast({ variant: "destructive", description: '내용을 입력해주세요.' });
      return;
    }

    createPostMutation.mutate(form);
  };

  const addTag = () => {
    if (newTag.trim() && form.tags.length < 5 && !form.tags.includes(newTag.trim())) {
      setForm({ ...form, tags: [...form.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setForm({ ...form, tags: form.tags.filter(tag => tag !== tagToRemove) });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target === document.querySelector('input[placeholder="태그 입력"]')) {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/community">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              목록으로
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">새 글 쓰기</h1>
          <p className="text-gray-600 mt-2">커뮤니티에 새로운 글을 작성해보세요</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>글 작성</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Author Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        닉네임 <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={form.nickname}
                        onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                        placeholder="닉네임을 입력하세요"
                        maxLength={50}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        비밀번호 <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="수정/삭제시 필요합니다"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        글 수정이나 삭제할 때 필요하니 기억해주세요
                      </p>
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      카테고리 <span className="text-red-500">*</span>
                    </label>
                    <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div>
                              <div className="font-medium">{category.name}</div>
                              <div className="text-xs text-gray-500">{category.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      제목 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="제목을 입력하세요"
                      maxLength={200}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {form.title.length}/200자
                    </p>
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      내용 <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      placeholder="내용을 입력하세요"
                      rows={15}
                      className="resize-none"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {form.content.length}자
                    </p>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      태그 (선택사항)
                    </label>
                    <div className="flex gap-2 mb-3">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="태그 입력"
                        maxLength={20}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={addTag}
                        disabled={!newTag.trim() || form.tags.length >= 5}
                        size="sm"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {form.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {form.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-sm">
                            #{tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-2 text-gray-500 hover:text-gray-700"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      최대 5개까지 추가할 수 있습니다 ({form.tags.length}/5)
                    </p>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="submit" 
                      disabled={createPostMutation.isPending}
                      className="flex-1"
                    >
                      {createPostMutation.isPending ? '등록 중...' : '글 등록'}
                    </Button>
                    <Link href="/community">
                      <Button type="button" variant="outline">
                        취소
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Writing Tips */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">💡 글쓰기 가이드</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">좋은 제목 작성법</h4>
                    <ul className="text-gray-600 space-y-1">
                      <li>• 구체적이고 명확한 제목</li>
                      <li>• 궁금증을 유발하는 제목</li>
                      <li>• 카테고리에 맞는 제목</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">내용 작성 팁</h4>
                    <ul className="text-gray-600 space-y-1">
                      <li>• 문단 나누기로 가독성 향상</li>
                      <li>• 구체적인 정보 포함</li>
                      <li>• 사진이 있다면 URL 링크</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">커뮤니티 규칙</h4>
                    <ul className="text-gray-600 space-y-1">
                      <li>• 서로 존중하는 대화</li>
                      <li>• 개인정보 보호 주의</li>
                      <li>• 상업적 광고 금지</li>
                      <li>• 허위 정보 유포 금지</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📋 카테고리 안내</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {categories.map((category) => (
                    <div key={category.id}>
                      <div className="font-medium text-gray-900">{category.name}</div>
                      <div className="text-gray-600">{category.description}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}