import type { VercelRequest, VercelResponse } from '@vercel/node';

const PRICING_TIERS = {
  premium: {
    name: "프리미엄",
    price: 4900, // $49.00 in cents
    interval: "month",
    features: [
      "무료 플랜의 모든 기능",
      "영업 시간 등록",
      "최대 10장의 사진 업로드",
      "웹사이트 및 SNS 링크 연결",
      "리뷰 답글 작성 가능",
      "검색 결과 상단 노출",
    ],
  },
  elite: {
    name: "엘리트",
    price: 9900, // $99.00 in cents
    interval: "month",
    features: [
      "프리미엄 플랜의 모든 기능",
      "추천 업체 배지 부여",
      "홈페이지 '추천 업체' 섹션 노출",
      "사진 무제한 업로드",
      "내 업체 페이지 광고 제거",
      "상세 방문 분석 대시보드",
    ],
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: "Stripe not configured" });
      }

      const { tier, businessId, email } = req.body;
      
      if (!tier || !businessId || !email) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (tier !== "premium" && tier !== "elite") {
        return res.status(400).json({ error: "Invalid tier" });
      }

      // Import Stripe dynamically
      const Stripe = await import('stripe');
      const stripe = new Stripe.default(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-12-18.acacia' as any,
      });

      const pricing = PRICING_TIERS[tier as keyof typeof PRICING_TIERS];
      const siteUrl = process.env.SITE_URL || "https://dalconnect.buildkind.tech";

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        customer_email: email,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `DalConnect ${pricing.name}`,
                description: `${pricing.features.length}개 프리미엄 기능 제공`,
              },
              unit_amount: pricing.price,
              recurring: {
                interval: pricing.interval as "month",
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          businessId,
          tier,
        },
        success_url: `${siteUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/pricing?canceled=true`,
      });
      
      return res.status(200).json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
      console.error("POST /api/stripe-checkout error:", error);
      return res.status(500).json({ 
        error: "Failed to create checkout session",
        message: error.message 
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
