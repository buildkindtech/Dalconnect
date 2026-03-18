import { Check, X, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

const tiers = [
  {
    name: "클레임 (무료)",
    price: "$0",
    period: "",
    description: "이미 등록된 내 업체를 무료로 인수하세요.",
    badge: null,
    highlight: false,
    features: [
      { text: "기본 정보 표시", included: true },
      { text: "업체 정보 직접 편집", included: true },
      { text: "지도 핀 + 주소", included: true },
      { text: "커뮤니티 리뷰 받기", included: true },
      { text: "✅ 인증 배지", included: false },
      { text: "검색 상단 노출", included: false },
      { text: "딜/이벤트 등록", included: false },
      { text: "SNS 카드 제작", included: false },
    ],
    buttonText: "무료 클레임하기",
    buttonVariant: "outline" as const,
    href: "/claim",
    note: null,
  },
  {
    name: "베이직",
    price: "$9",
    period: "/월",
    description: "인증 배지와 검색 상단 노출로 신뢰도를 높이세요.",
    badge: null,
    highlight: false,
    features: [
      { text: "기본 정보 표시", included: true },
      { text: "업체 정보 직접 편집", included: true },
      { text: "✅ 인증 배지", included: true },
      { text: "검색 상단 노출", included: true },
      { text: "사진 최대 10장", included: true },
      { text: "딜/이벤트 등록", included: false },
      { text: "SNS 카드 제작 (월 1장)", included: false },
      { text: "영업시간 / SNS 링크", included: false },
    ],
    buttonText: "베이직 시작하기",
    buttonVariant: "outline" as const,
    href: "/claim?plan=basic",
    note: null,
  },
  {
    name: "프리미엄",
    price: "$29",
    period: "/월",
    description: "SNS 카드 + 딜 등록으로 실질적인 마케팅 효과를 경험하세요.",
    badge: "인기",
    highlight: true,
    features: [
      { text: "베이직의 모든 기능", included: true },
      { text: "✅ 인증 배지", included: true },
      { text: "검색 상단 노출", included: true },
      { text: "사진 무제한 업로드", included: true },
      { text: "딜/이벤트 등록", included: true },
      { text: "영업시간 / SNS 링크", included: true },
      { text: "SNS 카드 제작 월 1장", included: true },
      { text: "DalKonnect IG/FB 포스팅", included: true },
      { text: "배너 광고 파트너 할인", included: true },
    ],
    buttonText: "프리미엄 시작하기",
    buttonVariant: "default" as const,
    href: "/claim?plan=premium",
    note: "SNS 카드 제작 단독 의뢰 시 $200~300 상당",
  },
];

const featureRows = [
  "기본 정보 표시",
  "업체 정보 직접 편집",
  "✅ 인증 배지",
  "검색 상단 노출",
  "사진 업로드",
  "딜/이벤트 등록",
  "SNS 카드 제작 (월 1장)",
  "DalKonnect IG/FB 포스팅",
  "영업시간 / SNS 링크",
];

export default function Pricing() {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-16 text-center max-w-3xl">
          <Badge variant="secondary" className="mb-4 text-sm px-3 py-1">
            🎉 오픈 기념 창립 멤버 가격
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-5 tracking-tight">
            DFW 한인 커뮤니티에<br />내 업체를 홍보하세요
          </h1>
          <p className="text-lg text-muted-foreground">
            이미 1,169개 업체가 등록되어 있어요. 내 업체를 무료로 클레임하고 관리하세요.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative flex flex-col ${
                tier.highlight
                  ? "border-primary shadow-xl ring-2 ring-primary/20"
                  : "border-border shadow-sm"
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-white px-4 py-1 text-xs font-bold shadow">
                    ⭐ {tier.badge}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pt-8 pb-4">
                <CardTitle className="text-xl font-bold mb-1">{tier.name}</CardTitle>
                <CardDescription className="text-sm min-h-[40px]">
                  {tier.description}
                </CardDescription>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-extrabold tracking-tight">{tier.price}</span>
                  {tier.period && (
                    <span className="text-muted-foreground font-medium">{tier.period}</span>
                  )}
                </div>
                {tier.note && (
                  <p className="text-xs text-primary font-medium mt-2 bg-primary/5 rounded-lg px-3 py-2">
                    💡 {tier.note}
                  </p>
                )}
              </CardHeader>

              <CardContent className="flex-1 px-6">
                <ul className="space-y-3">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      {f.included ? (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-slate-300 shrink-0" />
                      )}
                      <span className={f.included ? "text-slate-700 text-sm" : "text-slate-400 text-sm"}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="px-6 pb-8 pt-6">
                <Link href={tier.href} className="w-full">
                  <Button
                    className="w-full h-11 font-semibold"
                    variant={tier.buttonVariant}
                  >
                    {tier.buttonText}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Compare Table */}
        <div className="max-w-5xl mx-auto mt-20">
          <h2 className="text-2xl font-bold text-center mb-8">플랜 상세 비교</h2>
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 w-1/2">기능</th>
                  <th className="text-center px-4 py-4 font-semibold text-slate-600">클레임</th>
                  <th className="text-center px-4 py-4 font-semibold text-slate-600">베이직 $9</th>
                  <th className="text-center px-4 py-4 font-bold text-primary">프리미엄 $29</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["기본 정보 표시", true, true, true],
                  ["업체 정보 직접 편집", true, true, true],
                  ["✅ 인증 배지", false, true, true],
                  ["검색 상단 노출", false, true, true],
                  ["사진 업로드", false, "10장", "무제한"],
                  ["영업시간 / SNS 링크", false, false, true],
                  ["딜/이벤트 등록", false, false, true],
                  ["SNS 카드 제작 (월 1장)", false, false, true],
                  ["DalKonnect IG/FB 포스팅", false, false, true],
                  ["배너 광고", "문의", "문의", "파트너 할인"],
                ].map(([feature, free, basic, premium], i) => (
                  <tr key={i} className={`border-b last:border-0 ${i % 2 === 0 ? "" : "bg-slate-50/50"}`}>
                    <td className="px-6 py-3.5 text-slate-700">{feature as string}</td>
                    {[free, basic, premium].map((val, j) => (
                      <td key={j} className={`text-center px-4 py-3.5 ${j === 2 ? "text-primary font-medium" : ""}`}>
                        {val === true ? (
                          <Check className="h-4 w-4 text-primary mx-auto" />
                        ) : val === false ? (
                          <X className="h-4 w-4 text-slate-300 mx-auto" />
                        ) : (
                          <span className="text-xs font-medium">{val as string}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="max-w-3xl mx-auto mt-16 bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="text-2xl font-bold mb-3">내 업체가 이미 등록돼 있을 수 있어요</h3>
          <p className="text-muted-foreground mb-6">
            1,169개 DFW 한인 업체가 이미 달커넥트에 등록되어 있습니다.<br />
            무료로 클레임하고 정보를 직접 관리하세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/businesses">
              <Button size="lg" className="font-semibold px-8">내 업체 찾기</Button>
            </Link>
            <Link href="/claim">
              <Button size="lg" variant="outline" className="font-semibold px-8">클레임 신청하기</Button>
            </Link>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mt-16 text-center">
          <p className="text-muted-foreground">
            궁금한 점이 있으신가요?{" "}
            <Link href="/faq" className="text-primary font-medium hover:underline">
              자주 묻는 질문 →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
