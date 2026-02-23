import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Mail, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "이메일을 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "구독에 실패했습니다");
      }

      toast({
        title: "구독 완료! 🎉",
        description: "매주 월요일 아침에 만나요",
      });

      setEmail("");
      setName("");
    } catch (error) {
      toast({
        title: "구독 실패",
        description: error instanceof Error ? error.message : "다시 시도해주세요",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        
        <h3 className="text-2xl font-bold mb-2 font-ko">주간 DFW 한인 소식 받기</h3>
        <p className="text-muted-foreground mb-6">
          매주 월요일, DFW 한인 맛집, 이벤트, 생활정보를 이메일로 받으세요
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <Input
            type="email"
            placeholder="이메일 주소"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
            disabled={isLoading}
            required
          />
          <Input
            type="text"
            placeholder="이름 (선택)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading} className="font-ko">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                구독 중...
              </>
            ) : (
              "구독하기"
            )}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground mt-4">
          언제든지 구독을 취소할 수 있습니다
        </p>
      </div>
    </Card>
  );
}
