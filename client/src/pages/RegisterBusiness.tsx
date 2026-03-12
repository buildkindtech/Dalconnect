import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Circle, ArrowRight, ArrowLeft, Store, User, Send, Crown } from "lucide-react";

const CATEGORIES = [
  "한식당 (Korean Restaurant)",
  "중식당 (Chinese Restaurant)",
  "일식당 (Japanese Restaurant)",
  "카페 (Cafe)",
  "베이커리 (Bakery)",
  "미용실 (Hair Salon)",
  "네일샵 (Nail Salon)",
  "마사지 (Massage)",
  "부동산 (Real Estate)",
  "자동차 정비 (Auto Repair)",
  "세탁소 (Dry Cleaning)",
  "학원 (Academy)",
  "병원 (Medical)",
  "치과 (Dental)",
  "약국 (Pharmacy)",
  "법률 (Legal)",
  "회계 (Accounting)",
  "보험 (Insurance)",
  "건축/리모델링 (Construction)",
  "기타 (Other)"
];

const DFW_CITIES = [
  "Dallas",
  "Fort Worth",
  "Plano",
  "Irving",
  "Frisco",
  "McKinney",
  "Carrollton",
  "Denton",
  "Arlington",
  "Richardson",
  "Lewisville",
  "Flower Mound",
  "Coppell",
  "Grapevine",
  "Southlake",
  "Colleyville",
  "Addison",
  "Other"
];

type FormData = {
  // Business info
  name_ko: string;
  name_en: string;
  category: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  
  // Owner info
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  password: string;
  password_confirm: string;
};

const INITIAL_FORM_DATA: FormData = {
  name_ko: "",
  name_en: "",
  category: "",
  address: "",
  city: "",
  phone: "",
  email: "",
  website: "",
  description: "",
  owner_name: "",
  owner_email: "",
  owner_phone: "",
  password: "",
  password_confirm: "",
};

export default function RegisterBusiness() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.name_en.trim()) {
      newErrors.name_en = "업체명 (영어)은 필수입니다";
    }
    if (!formData.category) {
      newErrors.category = "카테고리를 선택해주세요";
    }
    if (!formData.address.trim()) {
      newErrors.address = "주소는 필수입니다";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.owner_name.trim()) {
      newErrors.owner_name = "대표자 이름은 필수입니다";
    }
    if (!formData.owner_email.trim()) {
      newErrors.owner_email = "이메일은 필수입니다";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.owner_email)) {
      newErrors.owner_email = "올바른 이메일 형식이 아닙니다";
    }
    if (!formData.owner_phone.trim()) {
      newErrors.owner_phone = "전화번호는 필수입니다";
    } else if (!/^[\d\s\-\+\(\)]{10,20}$/.test(formData.owner_phone)) {
      newErrors.owner_phone = "올바른 전화번호 형식이 아닙니다";
    }
    if (!formData.password) {
      newErrors.password = "비밀번호는 필수입니다";
    } else if (formData.password.length < 8) {
      newErrors.password = "비밀번호는 최소 8자 이상이어야 합니다";
    }
    if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = "비밀번호가 일치하지 않습니다";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
      window.scrollTo(0, 0);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          name_ko: formData.name_ko,
          name_en: formData.name_en,
          category: formData.category,
          address: formData.address,
          city: formData.city,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          description: formData.description,
          owner_name: formData.owner_name,
          owner_email: formData.owner_email,
          owner_phone: formData.owner_phone,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitted(true);
        window.scrollTo(0, 0);
      } else {
        toast({
          title: "등록 실패",
          description: data.error || "업체 등록 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "등록 실패",
        description: error.message || "네트워크 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="shadow-xl">
            <CardContent className="pt-12 pb-8 text-center">
              <div className="mb-6">
                <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto" />
              </div>
              <h1 className="text-3xl font-bold mb-4 text-slate-900">
                등록이 완료되었습니다!
              </h1>
              <p className="text-lg text-slate-600 mb-6">
                제출하신 업체 정보를 검토 후 <strong>24시간 내</strong>에 승인됩니다.
              </p>
              <p className="text-slate-500 mb-8">
                승인 완료 시 등록하신 이메일로 알림을 보내드립니다.
              </p>
              
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg p-6 mb-8">
                <Crown className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <h3 className="text-xl font-bold mb-2 text-amber-900">
                  프리미엄으로 업그레이드하면 더 많은 고객이 찾습니다!
                </h3>
                <p className="text-amber-800 mb-4">
                  • 검색 결과 상위 노출<br />
                  • 메인 페이지 Featured 섹션<br />
                  • 더 많은 사진 & 상세 정보<br />
                  • 고객 리뷰 & 평점 시스템
                </p>
                <Button 
                  onClick={() => navigate("/pricing")}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                  size="lg"
                >
                  <Crown className="mr-2 h-5 w-5" />
                  프리미엄 플랜 보기
                </Button>
              </div>

              <div className="flex gap-4 justify-center">
                <Button onClick={() => navigate("/businesses")} variant="outline" size="lg">
                  업체 목록 보기
                </Button>
                <Button onClick={() => navigate("/")} size="lg">
                  홈으로 돌아가기
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 text-slate-900">업체 등록</h1>
          <p className="text-lg text-slate-600">DalKonnect에 우리 업체를 소개해보세요 (무료)</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            <StepIndicator number={1} label="기본 정보" active={step === 1} completed={step > 1} />
            <div className="w-12 h-0.5 bg-slate-300" />
            <StepIndicator number={2} label="소유자 정보" active={step === 2} completed={step > 2} />
            <div className="w-12 h-0.5 bg-slate-300" />
            <StepIndicator number={3} label="확인 & 제출" active={step === 3} completed={false} />
          </div>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              {step === 1 && <><Store className="h-6 w-6" /> 기본 정보</>}
              {step === 2 && <><User className="h-6 w-6" /> 소유자 정보</>}
              {step === 3 && <><Send className="h-6 w-6" /> 확인 & 제출</>}
            </CardTitle>
            <CardDescription>
              {step === 1 && "업체의 기본 정보를 입력해주세요"}
              {step === 2 && "업체 대표자 정보를 입력해주세요"}
              {step === 3 && "입력하신 정보를 확인하고 제출해주세요"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Business Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name_ko">
                    업체명 (한글)
                  </Label>
                  <Input
                    id="name_ko"
                    value={formData.name_ko}
                    onChange={(e) => updateField("name_ko", e.target.value)}
                    placeholder="예: 달라스 한식당"
                    maxLength={200}
                  />
                </div>

                <div>
                  <Label htmlFor="name_en" className="text-red-600">
                    업체명 (영어) *
                  </Label>
                  <Input
                    id="name_en"
                    value={formData.name_en}
                    onChange={(e) => updateField("name_en", e.target.value)}
                    placeholder="Dallas Korean Restaurant"
                    maxLength={200}
                    className={errors.name_en ? "border-red-500" : ""}
                  />
                  {errors.name_en && <p className="text-sm text-red-600 mt-1">{errors.name_en}</p>}
                </div>

                <div>
                  <Label htmlFor="category" className="text-red-600">
                    카테고리 *
                  </Label>
                  <Select value={formData.category} onValueChange={(value) => updateField("category", value)}>
                    <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                      <SelectValue placeholder="카테고리를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-sm text-red-600 mt-1">{errors.category}</p>}
                </div>

                <div>
                  <Label htmlFor="address" className="text-red-600">
                    주소 *
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="1234 Main St, Plano, TX 75075"
                    maxLength={300}
                    className={errors.address ? "border-red-500" : ""}
                  />
                  {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address}</p>}
                </div>

                <div>
                  <Label htmlFor="city">도시</Label>
                  <Select value={formData.city} onValueChange={(value) => updateField("city", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="도시를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {DFW_CITIES.map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="phone">전화번호</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="(214) 123-4567"
                    maxLength={20}
                  />
                </div>

                <div>
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="info@business.com"
                    maxLength={200}
                  />
                </div>

                <div>
                  <Label htmlFor="website">웹사이트</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => updateField("website", e.target.value)}
                    placeholder="https://www.business.com"
                    maxLength={300}
                  />
                </div>

                <div>
                  <Label htmlFor="description">업체 소개</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="업체에 대한 간단한 소개를 작성해주세요..."
                    rows={4}
                    maxLength={2000}
                  />
                  <p className="text-sm text-slate-500 mt-1">{formData.description.length}/2000</p>
                </div>
              </div>
            )}

            {/* Step 2: Owner Info */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="owner_name" className="text-red-600">
                    대표자 이름 *
                  </Label>
                  <Input
                    id="owner_name"
                    value={formData.owner_name}
                    onChange={(e) => updateField("owner_name", e.target.value)}
                    placeholder="홍길동"
                    maxLength={100}
                    className={errors.owner_name ? "border-red-500" : ""}
                  />
                  {errors.owner_name && <p className="text-sm text-red-600 mt-1">{errors.owner_name}</p>}
                </div>

                <div>
                  <Label htmlFor="owner_email" className="text-red-600">
                    이메일 (로그인용) *
                  </Label>
                  <Input
                    id="owner_email"
                    type="email"
                    value={formData.owner_email}
                    onChange={(e) => updateField("owner_email", e.target.value)}
                    placeholder="owner@email.com"
                    maxLength={200}
                    className={errors.owner_email ? "border-red-500" : ""}
                  />
                  {errors.owner_email && <p className="text-sm text-red-600 mt-1">{errors.owner_email}</p>}
                  <p className="text-sm text-slate-500 mt-1">승인 후 이 이메일로 로그인하실 수 있습니다</p>
                </div>

                <div>
                  <Label htmlFor="owner_phone" className="text-red-600">
                    전화번호 *
                  </Label>
                  <Input
                    id="owner_phone"
                    value={formData.owner_phone}
                    onChange={(e) => updateField("owner_phone", e.target.value)}
                    placeholder="(214) 123-4567"
                    maxLength={20}
                    className={errors.owner_phone ? "border-red-500" : ""}
                  />
                  {errors.owner_phone && <p className="text-sm text-red-600 mt-1">{errors.owner_phone}</p>}
                </div>

                <div>
                  <Label htmlFor="password" className="text-red-600">
                    비밀번호 (최소 8자) *
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    placeholder="••••••••"
                    maxLength={100}
                    className={errors.password ? "border-red-500" : ""}
                  />
                  {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
                </div>

                <div>
                  <Label htmlFor="password_confirm" className="text-red-600">
                    비밀번호 확인 *
                  </Label>
                  <Input
                    id="password_confirm"
                    type="password"
                    value={formData.password_confirm}
                    onChange={(e) => updateField("password_confirm", e.target.value)}
                    placeholder="••••••••"
                    maxLength={100}
                    className={errors.password_confirm ? "border-red-500" : ""}
                  />
                  {errors.password_confirm && <p className="text-sm text-red-600 mt-1">{errors.password_confirm}</p>}
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="bg-slate-50 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4 text-slate-900">업체 정보</h3>
                  <dl className="space-y-2">
                    {formData.name_ko && (
                      <div className="flex">
                        <dt className="font-medium text-slate-600 w-32">업체명 (한글):</dt>
                        <dd className="text-slate-900">{formData.name_ko}</dd>
                      </div>
                    )}
                    <div className="flex">
                      <dt className="font-medium text-slate-600 w-32">업체명 (영어):</dt>
                      <dd className="text-slate-900">{formData.name_en}</dd>
                    </div>
                    <div className="flex">
                      <dt className="font-medium text-slate-600 w-32">카테고리:</dt>
                      <dd className="text-slate-900">{formData.category}</dd>
                    </div>
                    <div className="flex">
                      <dt className="font-medium text-slate-600 w-32">주소:</dt>
                      <dd className="text-slate-900">{formData.address}</dd>
                    </div>
                    {formData.city && (
                      <div className="flex">
                        <dt className="font-medium text-slate-600 w-32">도시:</dt>
                        <dd className="text-slate-900">{formData.city}</dd>
                      </div>
                    )}
                    {formData.phone && (
                      <div className="flex">
                        <dt className="font-medium text-slate-600 w-32">전화번호:</dt>
                        <dd className="text-slate-900">{formData.phone}</dd>
                      </div>
                    )}
                    {formData.email && (
                      <div className="flex">
                        <dt className="font-medium text-slate-600 w-32">이메일:</dt>
                        <dd className="text-slate-900">{formData.email}</dd>
                      </div>
                    )}
                    {formData.website && (
                      <div className="flex">
                        <dt className="font-medium text-slate-600 w-32">웹사이트:</dt>
                        <dd className="text-slate-900">{formData.website}</dd>
                      </div>
                    )}
                    {formData.description && (
                      <div className="flex">
                        <dt className="font-medium text-slate-600 w-32">업체 소개:</dt>
                        <dd className="text-slate-900">{formData.description}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="bg-slate-50 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4 text-slate-900">소유자 정보</h3>
                  <dl className="space-y-2">
                    <div className="flex">
                      <dt className="font-medium text-slate-600 w-32">이름:</dt>
                      <dd className="text-slate-900">{formData.owner_name}</dd>
                    </div>
                    <div className="flex">
                      <dt className="font-medium text-slate-600 w-32">이메일:</dt>
                      <dd className="text-slate-900">{formData.owner_email}</dd>
                    </div>
                    <div className="flex">
                      <dt className="font-medium text-slate-600 w-32">전화번호:</dt>
                      <dd className="text-slate-900">{formData.owner_phone}</dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>알림:</strong> 제출하신 정보는 관리자가 검토 후 24시간 내에 승인됩니다. 
                    승인 완료 시 등록하신 이메일로 알림을 보내드립니다.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              {step > 1 ? (
                <Button onClick={handleBack} variant="outline" size="lg">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  이전
                </Button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <Button onClick={handleNext} size="lg" className="ml-auto">
                  다음
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  size="lg" 
                  className="ml-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "제출 중..." : "등록하기"}
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StepIndicator({ number, label, active, completed }: { number: number; label: string; active: boolean; completed: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`rounded-full w-12 h-12 flex items-center justify-center font-semibold text-lg mb-2 transition-colors ${
        completed ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
      }`}>
        {completed ? <CheckCircle2 className="w-6 h-6" /> : number}
      </div>
      <span className={`text-sm font-medium ${active || completed ? 'text-slate-900' : 'text-slate-500'}`}>
        {label}
      </span>
    </div>
  );
}
