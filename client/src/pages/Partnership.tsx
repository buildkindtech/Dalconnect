import { useState } from "react";
import { CheckCircle, Handshake, TrendingUp, Users, Megaphone, Store, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const partnerTypes = [
  {
    icon: <Store className="h-7 w-7" />,
    title: "업체 등록 광고",
    desc: "달커넥트에 내 업체 페이지를 만들고 DFW 한인 커뮤니티에 홍보하세요. 베이직 $9 / 프리미엄 $29부터.",
    href: "/pricing",
    badge: "가장 인기",
    cta: "플랜 보기",
  },
  {
    icon: <Megaphone className="h-7 w-7" />,
    title: "배너 광고",
    desc: "업체 페이지 없이 달커넥트 홈 · 뉴스 · 업체 목록 페이지에 배너만 노출하고 싶은 경우. 기간/위치별 맞춤 견적.",
    href: null,
    badge: "단독 구매 가능",
    cta: "견적 문의",
  },
  {
    icon: <TrendingUp className="h-7 w-7" />,
    title: "딜 & 쿠폰 제휴",
    desc: "회원들에게 특별 할인 딜을 제공하고 달커넥트 딜 섹션에 노출되세요.",
    href: null,
    badge: null,
    cta: "문의하기",
  },
  {
    icon: <Users className="h-7 w-7" />,
    title: "콘텐츠 / 커뮤니티 파트너",
    desc: "한인 교회, 협회, 단체와의 공동 이벤트 · 블로그 · 뉴스레터 콘텐츠 협력.",
    href: null,
    badge: null,
    cta: "문의하기",
  },
];

export default function Partnership() {
  const [form, setForm] = useState({ name: "", email: "", company: "", type: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast({ title: "필수 항목을 입력해주세요", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, subject: `[파트너십] ${form.type || "문의"}` }),
      });
    } catch {}
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">문의 접수 완료!</h2>
          <p className="text-muted-foreground mb-6">
            파트너십 문의가 접수됐어요.<br />
            <strong>info@dalkonnect.com</strong>에서 2-3 영업일 내로 연락드릴게요.
          </p>
          <Button onClick={() => setSubmitted(false)} variant="outline">돌아가기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-14 text-center max-w-3xl">
          <Handshake className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">달커넥트와 함께 성장하세요</h1>
          <p className="text-lg text-muted-foreground">
            DFW 달라스-포트워스 한인 커뮤니티 플랫폼과 파트너십을 맺고<br />
            더 많은 한인 고객에게 닿으세요.
          </p>
        </div>
      </div>

      {/* 파트너 유형 */}
      <div className="container mx-auto px-4 py-14 max-w-5xl">
        <h2 className="text-2xl font-bold text-center mb-8">파트너십 종류</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {partnerTypes.map((p, i) => (
            <Card key={i} className="hover:border-primary transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
                    {p.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-base">{p.title}</h3>
                      {p.badge && <Badge className="text-xs">{p.badge}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{p.desc}</p>
                    {p.href ? (
                      <a href={p.href}>
                        <Button size="sm" variant="outline">
                          {p.cta} <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </a>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setForm(f => ({ ...f, type: p.title }));
                          document.getElementById("inquiry-form")?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        {p.cta} <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 수치 */}
        <div className="grid grid-cols-3 gap-6 mt-14 text-center">
          {[
            { num: "1,169+", label: "등록 업체" },
            { num: "DFW", label: "달라스-포트워스 타겟" },
            { num: "한인", label: "커뮤니티 전용" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border p-6">
              <div className="text-3xl font-extrabold text-primary mb-1">{s.num}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* 문의 폼 */}
        <div id="inquiry-form" className="mt-16 bg-white rounded-2xl border shadow-sm p-8 max-w-xl mx-auto">
          <h2 className="text-xl font-bold mb-6">파트너십 문의</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>이름 <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="홍길동"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>이메일 <span className="text-red-500">*</span></Label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>회사 / 업체명</Label>
              <Input
                placeholder="(선택)"
                value={form.company}
                onChange={e => setForm({ ...form, company: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>파트너십 종류</Label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
              >
                <option value="">선택해주세요</option>
                <option value="업체 광고">업체 광고</option>
                <option value="딜 & 쿠폰 제휴">딜 & 쿠폰 제휴</option>
                <option value="콘텐츠 파트너">콘텐츠 파트너</option>
                <option value="커뮤니티 파트너">커뮤니티 파트너</option>
                <option value="기타">기타</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>문의 내용 <span className="text-red-500">*</span></Label>
              <Textarea
                placeholder="어떤 파트너십을 원하시는지 자세히 적어주세요"
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                rows={4}
                className="resize-none"
              />
            </div>

            <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
              {loading ? "전송 중..." : "문의 보내기"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              또는 직접 이메일: <a href="mailto:info@dalkonnect.com" className="text-primary">info@dalkonnect.com</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
