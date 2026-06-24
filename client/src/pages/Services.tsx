import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Wrench, Zap, Droplets, Sparkles, Truck, Hammer, Monitor, Bug, CheckCircle, X, Phone, Mail, MapPin, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const SERVICES = [
  {
    id: "hvac",
    icon: Sparkles,
    emoji: "❄️",
    title: "에어컨/냉난방",
    subtitle: "AC Repair & HVAC",
    desc: "에어컨 수리·설치, 히터 점검, 필터 교체",
    color: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    id: "electrical",
    icon: Zap,
    emoji: "⚡",
    title: "전기",
    subtitle: "Electrical",
    desc: "전기 배선, 콘센트 설치, 조명 교체, 패널 업그레이드",
    color: "from-yellow-500 to-orange-500",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
  },
  {
    id: "plumbing",
    icon: Droplets,
    emoji: "🚿",
    title: "배관/수도",
    subtitle: "Plumbing",
    desc: "수도 누수, 배수구 막힘, 변기·싱크대 수리",
    color: "from-sky-500 to-blue-600",
    bg: "bg-sky-50",
    border: "border-sky-200",
  },
  {
    id: "cleaning",
    icon: Sparkles,
    emoji: "🧹",
    title: "청소",
    subtitle: "Cleaning",
    desc: "가정집 청소, 입주/이사 청소, 카펫 청소",
    color: "from-green-500 to-emerald-500",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  {
    id: "moving",
    icon: Truck,
    emoji: "🚛",
    title: "이사",
    subtitle: "Moving",
    desc: "로컬 이사, 장거리 이사, 짐 포장·운반",
    color: "from-purple-500 to-violet-500",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  {
    id: "handyman",
    icon: Hammer,
    emoji: "🔨",
    title: "핸디맨",
    subtitle: "Handyman",
    desc: "수리, 조립, 페인트, 리모델링 소규모 작업",
    color: "from-orange-500 to-red-500",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  {
    id: "computer",
    icon: Monitor,
    emoji: "💻",
    title: "컴퓨터/IT",
    subtitle: "Computer & IT",
    desc: "컴퓨터 수리, 바이러스 제거, 네트워크 설정",
    color: "from-slate-500 to-gray-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
  },
  {
    id: "pest",
    icon: Bug,
    emoji: "🐛",
    title: "해충방제",
    subtitle: "Pest Control",
    desc: "바퀴벌레, 개미, 쥐, 흰개미 방제",
    color: "from-rose-500 to-pink-500",
    bg: "bg-rose-50",
    border: "border-rose-200",
  },
];

interface FormData {
  name: string;
  phone: string;
  email: string;
  zip: string;
  message: string;
}

export default function Services() {
  const [selected, setSelected] = useState<typeof SERVICES[0] | null>(null);
  const [form, setForm] = useState<FormData>({ name: "", phone: "", email: "", zip: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (svc: typeof SERVICES[0]) => {
    setSelected(svc);
    setSubmitted(false);
    setForm({ name: "", phone: "", email: "", zip: "", message: "" });
  };

  const handleClose = () => {
    setSelected(null);
    setSubmitted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast({ title: "이름과 전화번호를 입력해주세요.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_type: selected?.id, ...form }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        toast({ title: data.error || "오류가 발생했습니다.", variant: "destructive" });
      }
    } catch {
      toast({ title: "네트워크 오류입니다. 다시 시도해주세요.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>달라스 홈서비스 허브 — DalKonnect</title>
        <meta name="description" content="달라스 한인 홈서비스 연결 플랫폼. 에어컨, 전기, 배관, 청소, 이사, 핸디맨 전문업체를 한국어로 편하게 연결받으세요." />
      </Helmet>

      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-700 text-white py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-4">
            <Wrench className="w-4 h-4" />
            달라스 홈서비스 허브
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            집 수리, 이제 한국어로 편하게
          </h1>
          <p className="text-gray-300 text-lg">
            영어 걱정 없이 — 필요한 서비스를 선택하면<br />
            검증된 업체와 바로 연결해드립니다
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
          어떤 서비스가 필요하세요?
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SERVICES.map((svc) => (
            <button
              key={svc.id}
              onClick={() => handleSelect(svc)}
              className={`${svc.bg} ${svc.border} border-2 rounded-2xl p-5 text-left hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0`}
            >
              <div className="text-3xl mb-3">{svc.emoji}</div>
              <div className="font-bold text-gray-900 text-base">{svc.title}</div>
              <div className="text-gray-500 text-xs mt-0.5">{svc.subtitle}</div>
              <div className="text-gray-600 text-xs mt-2 leading-relaxed">{svc.desc}</div>
              <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-gray-700">
                견적 받기 <ChevronRight className="w-3 h-3" />
              </div>
            </button>
          ))}
        </div>

        {/* How it works */}
        <div className="mt-14 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">이렇게 진행됩니다</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold text-lg">1</span>
              </div>
              <div className="font-semibold text-gray-800 mb-1">서비스 선택</div>
              <div className="text-gray-500 text-sm">필요한 서비스 종류와 간단한 내용을 입력하세요</div>
            </div>
            <div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold text-lg">2</span>
              </div>
              <div className="font-semibold text-gray-800 mb-1">업체 매칭</div>
              <div className="text-gray-500 text-sm">담당자가 검증된 업체를 찾아 연락드립니다 (영어 통역 포함)</div>
            </div>
            <div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold text-lg">3</span>
              </div>
              <div className="font-semibold text-gray-800 mb-1">무료 견적</div>
              <div className="text-gray-500 text-sm">업체에서 직접 연락 후 무료 견적을 받으세요</div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <Phone className="w-4 h-4 inline mr-1" />
          급한 문의: <a href="tel:+1-972-000-0000" className="text-blue-600 font-medium">info@dalkonnect.com</a>
          <span className="mx-3">·</span>
          <Mail className="w-4 h-4 inline mr-1" />
          <a href="mailto:info@dalkonnect.com" className="text-blue-600 font-medium">info@dalkonnect.com</a>
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className={`bg-gradient-to-r ${selected.color} p-5 text-white`}>
              <button onClick={handleClose} className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full">
                <X className="w-5 h-5" />
              </button>
              <div className="text-3xl mb-1">{selected.emoji}</div>
              <div className="font-bold text-xl">{selected.title} 견적 신청</div>
              <div className="text-white/80 text-sm mt-1">{selected.desc}</div>
            </div>

            <div className="p-5">
              {submitted ? (
                <div className="py-8 text-center">
                  <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
                  <div className="font-bold text-gray-900 text-lg mb-2">신청 완료!</div>
                  <div className="text-gray-500 text-sm leading-relaxed">
                    담당자가 24시간 내에 연락드립니다.<br />
                    빠른 연락을 원하시면 문자 주세요.
                  </div>
                  <Button onClick={handleClose} className="mt-6" variant="outline">
                    닫기
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이름 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="홍길동"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      전화번호 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="(214) 000-0000"
                      type="tel"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                    <Input
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="example@email.com"
                      type="email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <MapPin className="w-3.5 h-3.5 inline mr-1" />
                      우편번호 (Zip Code)
                    </label>
                    <Input
                      value={form.zip}
                      onChange={e => setForm(f => ({ ...f, zip: e.target.value }))}
                      placeholder="75001"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">상세 내용</label>
                    <Textarea
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      placeholder={`예) 거실 에어컨이 차갑게 안 나와요. 약 1,500 sqft 집입니다.`}
                      rows={3}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className={`w-full bg-gradient-to-r ${selected.color} text-white border-0 hover:opacity-90`}
                  >
                    {loading ? "신청 중..." : "무료 견적 신청하기"}
                  </Button>
                  <p className="text-center text-gray-400 text-xs">
                    신청 무료 · 24시간 내 연락 · 영어 통역 포함
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
