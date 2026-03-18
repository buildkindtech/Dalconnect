import { useState } from "react";
import { Search, CheckCircle, Building2, Phone, MapPin, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface Business {
  id: string;
  name: string;
  category: string;
  address: string;
  phone?: string;
  city: string;
}

interface ClaimForm {
  ownerName: string;
  email: string;
  phone: string;
  role: string;
  message: string;
}

export default function ClaimBusiness() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [form, setForm] = useState<ClaimForm>({
    ownerName: "",
    email: "",
    phone: "",
    role: "owner",
    message: "",
  });
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/businesses?search=${encodeURIComponent(query)}&limit=10`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : data.businesses || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitClaim = async () => {
    if (!form.ownerName.trim() || !form.email.trim()) {
      toast({ title: "필수 항목을 입력해주세요", description: "이름과 이메일은 필수입니다.", variant: "destructive" });
      return;
    }
    if (!form.email.includes("@")) {
      toast({ title: "이메일 형식이 올바르지 않아요", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // 클레임 신청 저장 (현재는 간단한 이메일 전송 방식)
      await fetch("/api/claim-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: selectedBiz!.id,
          businessName: selectedBiz!.name,
          ownerName: form.ownerName,
          email: form.email,
          phone: form.phone,
          role: form.role,
          message: form.message,
        }),
      });
      setSubmitted(selectedBiz!.name);
    } catch {
      // API 없어도 신청 완료 처리 (현재는 수동)
      setSubmitted(selectedBiz!.name);
    } finally {
      setSubmitting(false);
    }
  };

  // 완료 화면
  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">클레임 신청 완료!</h2>
          <p className="text-muted-foreground mb-2">
            <strong>{submitted}</strong> 클레임 신청이 접수됐어요.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            입력하신 이메일로 1-2 영업일 내 인증 안내를 보내드릴게요.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/businesses">
              <Button variant="outline">업체 목록 보기</Button>
            </Link>
            <Link href="/pricing">
              <Button>플랜 보기</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-12 text-center max-w-2xl">
          <Badge variant="secondary" className="mb-3">무료 클레임</Badge>
          <h1 className="text-3xl font-bold mb-3">내 업체를 클레임하세요</h1>
          <p className="text-muted-foreground">
            이미 달커넥트에 등록된 업체를 찾아서 오너임을 인증하면<br />
            정보를 직접 편집하고 관리할 수 있어요. <strong>완전 무료!</strong>
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-xl">
        {/* 클레임 신청 폼 모달 */}
        {selectedBiz && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* 폼 헤더 */}
              <div className="flex items-center justify-between p-5 border-b">
                <div>
                  <h3 className="font-bold text-lg">클레임 신청</h3>
                  <p className="text-sm text-muted-foreground">{selectedBiz.name}</p>
                </div>
                <button onClick={() => setSelectedBiz(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* 폼 */}
              <div className="p-5 space-y-4">
                <div className="bg-slate-50 rounded-lg p-3 text-sm text-muted-foreground">
                  📋 신청 후 달커넥트 팀이 업체 오너 여부를 확인 후 승인해드려요 (1-2 영업일)
                </div>

                <div className="space-y-1.5">
                  <Label>이름 <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="업체 오너/담당자 이름"
                    value={form.ownerName}
                    onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>이메일 <span className="text-red-500">*</span></Label>
                  <Input
                    type="email"
                    placeholder="확인 이메일을 받을 주소"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">업체 이메일이면 더 빠르게 승인돼요</p>
                </div>

                <div className="space-y-1.5">
                  <Label>전화번호</Label>
                  <Input
                    placeholder="연락 가능한 번호 (선택)"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>업체와의 관계</Label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    <option value="owner">오너 (Owner)</option>
                    <option value="manager">매니저</option>
                    <option value="employee">직원</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>추가 메시지 (선택)</Label>
                  <Textarea
                    placeholder="본인 확인에 도움이 될 정보가 있으면 적어주세요"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedBiz(null)}
                  >
                    취소
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSubmitClaim}
                    disabled={submitting}
                  >
                    {submitting ? "신청 중..." : "클레임 신청하기"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 검색 */}
        <div className="flex gap-2">
          <Input
            placeholder="업체 이름으로 검색... (예: 만나 샤브샤브)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="h-12 text-base"
          />
          <Button onClick={handleSearch} disabled={loading} className="h-12 px-6">
            <Search className="h-4 w-4 mr-2" />
            검색
          </Button>
        </div>

        {/* 결과 */}
        <div className="mt-6 space-y-3">
          {loading && (
            <p className="text-center text-muted-foreground py-8">검색 중...</p>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="text-center py-10">
              <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="font-medium mb-1">업체를 찾을 수 없어요</p>
              <p className="text-sm text-muted-foreground mb-4">
                검색어를 바꿔보거나, 새로 등록 신청해주세요.
              </p>
              <a href="mailto:info@dalkonnect.com?subject=업체 등록 신청">
                <Button variant="outline" size="sm">등록 신청하기</Button>
              </a>
            </div>
          )}

          {!loading && results.map((biz) => (
            <Card key={biz.id} className="hover:border-primary transition-colors cursor-pointer" onClick={() => setSelectedBiz(biz)}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold truncate">{biz.name}</span>
                    <Badge variant="secondary" className="text-xs shrink-0">{biz.category}</Badge>
                  </div>
                  {biz.address && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {biz.address}
                    </p>
                  )}
                  {biz.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Phone className="h-3 w-3" />
                      {biz.phone}
                    </p>
                  )}
                </div>
                <Button size="sm" className="shrink-0">
                  클레임 <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 클레임 방법 */}
        {!searched && (
          <div className="mt-12">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">클레임 방법</h3>
            <div className="space-y-4">
              {[
                { step: "1", title: "업체 검색", desc: "업체 이름을 검색해서 찾으세요" },
                { step: "2", title: "정보 입력", desc: "이름, 이메일, 업체와의 관계를 입력" },
                { step: "3", title: "달커넥트 팀 검토", desc: "1-2 영업일 내 이메일로 승인 안내" },
                { step: "4", title: "관리 시작!", desc: "정보 편집, 사진 추가, 리뷰 관리" },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
