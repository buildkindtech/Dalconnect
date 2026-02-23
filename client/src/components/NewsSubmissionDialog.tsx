import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  '로컬뉴스',
  '이민/비자',
  '생활정보',
  '커뮤니티',
  '이벤트',
];

interface NewsSubmissionDialogProps {
  children: React.ReactNode;
}

export function NewsSubmissionDialog({ children }: NewsSubmissionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    source_url: "",
    submitter_name: "",
    submitter_email: "",
    submitter_phone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content || !formData.category) {
      toast({
        title: "필수 항목을 입력해주세요",
        description: "제목, 내용, 카테고리는 필수입니다",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/news-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "제보에 실패했습니다");
      }

      toast({
        title: "제보 완료! 🙌",
        description: "검토 후 승인되면 뉴스 페이지에 게시됩니다",
      });

      setFormData({
        title: "",
        content: "",
        category: "",
        source_url: "",
        submitter_name: "",
        submitter_email: "",
        submitter_phone: "",
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "제보 실패",
        description: error instanceof Error ? error.message : "다시 시도해주세요",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-ko">커뮤니티 뉴스 제보</DialogTitle>
          <DialogDescription>
            DFW 한인 커뮤니티에 유익한 정보를 제보해주세요
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="뉴스 제목"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">카테고리 *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">내용 *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="뉴스 내용 또는 요약 (1-2줄)"
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source_url">출처 링크 (선택)</Label>
            <Input
              id="source_url"
              type="url"
              value={formData.source_url}
              onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="submitter_name">제보자 이름 (선택)</Label>
              <Input
                id="submitter_name"
                value={formData.submitter_name}
                onChange={(e) => setFormData({ ...formData, submitter_name: e.target.value })}
                placeholder="이름"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="submitter_email">이메일 (선택)</Label>
              <Input
                id="submitter_email"
                type="email"
                value={formData.submitter_email}
                onChange={(e) => setFormData({ ...formData, submitter_email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="submitter_phone">전화번호 (선택)</Label>
            <Input
              id="submitter_phone"
              type="tel"
              value={formData.submitter_phone}
              onChange={(e) => setFormData({ ...formData, submitter_phone: e.target.value })}
              placeholder="(469) 123-4567"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="flex-1"
            >
              취소
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 font-ko">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  제보 중...
                </>
              ) : (
                "제보하기"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
