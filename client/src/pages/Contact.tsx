import { Mail, MessageSquare, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Contact() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('문의가 접수되었습니다. 빠른 시일 내에 답변 드리겠습니다.');
  };

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
                      <label className="block text-sm font-medium mb-2">이름</label>
                      <Input placeholder="홍길동" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">이메일</label>
                      <Input type="email" placeholder="email@example.com" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">전화번호</label>
                      <Input type="tel" placeholder="(123) 456-7890" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">문의 유형</label>
                      <select className="w-full h-10 px-3 rounded-md border border-slate-300">
                        <option>일반 문의</option>
                        <option>업체 등록</option>
                        <option>기술 지원</option>
                        <option>광고 문의</option>
                        <option>기타</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">메시지</label>
                      <Textarea 
                        placeholder="문의 내용을 입력해주세요..." 
                        rows={6}
                        required 
                      />
                    </div>
                    <Button type="submit" className="w-full" size="lg">
                      <Mail className="h-4 w-4 mr-2" />
                      메시지 보내기
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
                      <a href="mailto:info@dalconnect.com" className="text-primary hover:underline">
                        info@dalconnect.com
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
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">전화</h3>
                      <a href="tel:+14696132763" className="text-primary hover:underline">
                        (469) 613-2763
                      </a>
                      <p className="text-sm text-slate-600 mt-2">
                        업체 등록 및 기술 지원
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
                        <span className="text-slate-300">|</span>
                        <a href="#" className="text-primary hover:underline">Twitter</a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Teaser */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">자주 묻는 질문</h2>
          <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
            빠른 답변이 필요하신가요? FAQ 페이지에서 자주 묻는 질문들의 답변을 확인하세요.
          </p>
          <Button variant="outline" size="lg">
            FAQ 보기
          </Button>
        </div>
      </section>
    </div>
  );
}
