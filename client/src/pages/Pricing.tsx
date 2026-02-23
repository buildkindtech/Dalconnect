import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Pricing() {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCheckout = async (tier: "free" | "premium" | "elite") => {
    if (tier === "free") {
      // Redirect to signup
      window.location.href = "/signup";
      return;
    }

    setLoading(tier);

    try {
      // TODO: Get businessId and email from auth context
      const businessId = "temp-business-id"; // Replace with actual
      const email = "user@example.com"; // Replace with actual

      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, businessId, email }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "결제 오류",
        description: "결제 세션을 생성할 수 없습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const tiers = [
    {
      name: "무료",
      price: "$0",
      description: "비즈니스를 위한 기본 리스팅입니다.",
      features: [
        "기본 연락처 정보",
        "주소 및 지도 핀",
        "비즈니스 카테고리 설정",
        "커뮤니티 리뷰 받기"
      ],
      buttonText: "무료 등록하기",
      variant: "outline" as const,
      tier: "free" as const
    },
    {
      name: "프리미엄",
      price: "$49",
      period: "/월",
      description: "더 높은 노출도와 관리 기능을 제공합니다.",
      features: [
        "무료 플랜의 모든 기능",
        "영업 시간 등록",
        "최대 10장의 사진 업로드",
        "웹사이트 및 SNS 링크 연결",
        "리뷰 답글 작성 가능",
        "검색 결과 상단 노출"
      ],
      buttonText: "프리미엄으로 업그레이드",
      variant: "default" as const,
      popular: true,
      tier: "premium" as const
    },
    {
      name: "엘리트",
      price: "$99",
      period: "/월",
      description: "최고의 홍보 효과와 프리미엄 기능을 제공합니다.",
      features: [
        "프리미엄 플랜의 모든 기능",
        "추천 업체 배지 부여",
        "홈페이지 '추천 업체' 섹션 노출",
        "사진 무제한 업로드",
        "내 업체 페이지 광고 제거",
        "상세 방문 분석 대시보드"
      ],
      buttonText: "엘리트 멤버십 신청",
      variant: "outline" as const,
      tier: "elite" as const
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-20">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 font-ko tracking-tight">비즈니스의 성장을 도와드립니다</h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            달라스-포트워스 지역 수천 명의 한인들에게 비즈니스를 홍보하세요. 비즈니스 규모에 맞는 최적의 플랜을 선택하세요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier, index) => (
            <Card key={index} className={`relative flex flex-col ${tier.popular ? 'border-primary shadow-xl scale-105 z-10' : 'border-border shadow-sm mt-4 md:mt-0'}`}>
              {tier.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-bold tracking-wider uppercase shadow-sm">
                  인기 상품
                </div>
              )}
              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-2xl font-bold font-ko mb-2">{tier.name}</CardTitle>
                <CardDescription className="text-base h-10">{tier.description}</CardDescription>
                <div className="mt-6 flex items-baseline justify-center">
                  <span className="text-5xl font-extrabold tracking-tight">{tier.price}</span>
                  {tier.period && <span className="text-muted-foreground ml-1 font-medium">{tier.period}</span>}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-4">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="h-5 w-5 text-primary shrink-0 mr-3 mt-0.5" />
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-8 pb-8">
                <Button 
                  className="w-full h-12 text-base font-semibold" 
                  variant={tier.variant}
                  onClick={() => handleCheckout(tier.tier)}
                  disabled={loading === tier.tier}
                >
                  {loading === tier.tier ? "처리중..." : tier.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="mt-20 text-center max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold mb-4 font-ko">궁금한 점이 있으신가요?</h3>
          <p className="text-muted-foreground mb-6">맞춤형 광고 패키지나 다중 등록 할인은 저희 마케팅 팀에 문의해 주세요.</p>
          <Button variant="link" className="text-primary text-lg">마케팅 팀 문의하기</Button>
        </div>
      </div>
    </div>
  );
}