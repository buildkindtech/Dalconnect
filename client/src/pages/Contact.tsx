import { useState } from "react";
import { Mail, MapPin, MessageSquare, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      type: formData.get('type') as string,
      message: formData.get('message') as string,
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        alert('전송에 실패했습니다. 다시 시도해주세요.');
      }
    } catch {
      // Fallback: mailto
      window.location.href = `mailto:info@dalkonnect.com?subject=${encodeURIComponent(`[${data.type}] ${data.name}`)}&body=${encodeURIComponent(data.message)}`;
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card className="max-w-lg w-full shadow-xl">
          <CardContent className="pt-12 pb-8 text-center">
            <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-4">문의가 접수되었습니다!</h1>
            <p className="text-lg text-slate-600 mb-2">빠른 시일 내에 답변 드리겠습니다.</p>
            <p className="text-slate-500 mb-8">info@dalkonnect.com</p>
            <Button onClick={() => window.location.href = '/'} size="lg">
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary to-primary/80 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">문의하기</h1>
          <p className="text-xl max-w-3xl mx-auto opacity-90">
            궁금하신 사항이 있으시면 언제든지 연락주세요
          </p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold mb-6">메시지 보내기</h2>
              <Card>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">이름 *</label>
                      <Input name="name" placeholder="홍길동" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">이메일 *</label>
                      <Input name="email" type="email" placeholder="email@example.com" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">문의 유형</label>
                      <select name="type" className="w-full h-10 px-3 rounded-md border border-slate-300">
                        <option>일반 문의</option>
                        <option>업체 등록</option>
                        <option>광고 문의</option>
                        <option>기술 지원</option>
                        <option>기타</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">메시지 *</label>
                      <Textarea 
                        name="message"
                        placeholder="문의 내용을 입력해주세요..." 
                        rows={6}
                        required 
                      />
                    </div>
                    <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                      <Mail className="h-4 w-4 mr-2" />
                      {isSubmitting ? "전송 중..." : "메시지 보내기"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Info */}
            <div>
              <h2 className="text-3xl font-bold mb-6">연락처 정보</h2>
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">이메일</h3>
                      <a href="mailto:info@dalkonnect.com" className="text-primary hover:underline">
                        info@dalkonnect.com
                      </a>
                      <p className="text-sm text-slate-600 mt-2">
                        평일 9:00 AM - 6:00 PM (CST)
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">위치</h3>
                      <p className="text-slate-700">
                        Dallas-Fort Worth Metroplex<br />
                        Texas, United States
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">소셜 미디어</h3>
                      <p className="text-slate-600 text-sm mb-2">
                        소셜 미디어를 통해서도 소통하세요
                      </p>
                      <div className="flex gap-3">
                        <a href="#" className="text-primary hover:underline">Facebook</a>
                        <span className="text-slate-300">|</span>
                        <a href="#" className="text-primary hover:underline">Instagram</a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
