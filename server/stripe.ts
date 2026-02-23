/**
 * Stripe Payment Integration for DalConnect
 */

import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const SITE_URL = process.env.SITE_URL || "http://localhost:5000";

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
});

// Pricing tiers
export const PRICING_TIERS = {
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

/**
 * Create Stripe Checkout Session
 */
export async function createCheckoutSession(
  tier: "premium" | "elite",
  businessId: string,
  customerEmail: string
): Promise<Stripe.Checkout.Session> {
  const pricing = PRICING_TIERS[tier];

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    customer_email: customerEmail,
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
    success_url: `${SITE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/pricing?canceled=true`,
  });

  return session;
}

/**
 * Verify Stripe Webhook Signature
 */
export function verifyWebhook(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Handle Subscription Created
 */
export async function handleSubscriptionCreated(
  subscription: Stripe.Subscription
): Promise<void> {
  const { metadata } = subscription as any;
  const { businessId, tier } = metadata;

  // TODO: Update business in database
  console.log(`✅ Subscription created for business ${businessId} (${tier})`);
}

/**
 * Handle Subscription Canceled
 */
export async function handleSubscriptionCanceled(
  subscription: Stripe.Subscription
): Promise<void> {
  const { metadata } = subscription as any;
  const { businessId } = metadata;

  // TODO: Downgrade business to free tier
  console.log(`❌ Subscription canceled for business ${businessId}`);
}
