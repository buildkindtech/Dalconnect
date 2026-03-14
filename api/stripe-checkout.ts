import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
function handleCors(req: any, res: any): boolean {
  const origin = (req.headers?.origin) || '';
  const allowed = ['https://dalconnect.vercel.app','https://dalconnect.buildkind.tech','https://dalconnect.com','https://www.dalconnect.com','https://dalkonnect.com','https://www.dalkonnect.com','http://localhost:5000','http://localhost:5173'];
  if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return true; }
  return false;
}

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

// Telegram notification helper
async function sendTelegramAlert(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID || '7966628100'; // Hub-Projects
  
  if (!token) {
    console.warn('TELEGRAM_BOT_TOKEN not configured, skipping notification');
    return;
  }
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        chat_id: chatId, 
        text: message, 
        parse_mode: 'HTML' 
      })
    });
    
    if (!response.ok) {
      console.error('Telegram notification failed:', await response.text());
    }
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
  }
}

// Webhook handler
async function handleWebhook(req: VercelRequest, res: VercelResponse) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error('Missing stripe-signature header or STRIPE_WEBHOOK_SECRET');
    return res.status(400).json({ error: 'Webhook signature missing' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia' as any,
  });

  let event: Stripe.Event;

  try {
    // Get raw body for signature verification
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: "Webhook 서명 검증에 실패했습니다" });
  }

  console.log('Webhook event received:', event.type);

  // Import pg for database operations
  const pg = await import('pg');
  const pool = new pg.default.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
  });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { businessId, tier } = session.metadata || {};
        const customerEmail = session.customer_email;

        if (!businessId || !tier) {
          console.error('Missing metadata in checkout session:', session.id);
          break;
        }

        // Get business name for notification
        const businessResult = await pool.query(
          'SELECT name_ko, name_en FROM businesses WHERE id = $1',
          [businessId]
        );

        const businessName = businessResult.rows[0]?.name_ko || businessResult.rows[0]?.name_en || 'Unknown Business';

        // Update business_claims tier
        await pool.query(
          `UPDATE business_claims SET tier = $1 WHERE business_id = $2`,
          [tier, businessId]
        );

        // Update businesses tier and featured status
        const isFeatured = tier === 'elite';
        await pool.query(
          `UPDATE businesses SET tier = $1, featured = $2 WHERE id = $3`,
          [tier, isFeatured, businessId]
        );

        // Send Telegram notification
        const tierName = tier === 'premium' ? '프리미엄' : '엘리트';
        const tierPrice = tier === 'premium' ? '$49' : '$99';
        await sendTelegramAlert(
          `💰 <b>새 ${tierName} 고객!</b>\n\n` +
          `업체: ${businessName}\n` +
          `플랜: ${tierName} ${tierPrice}/월\n` +
          `이메일: ${customerEmail || 'N/A'}\n` +
          `업체 ID: ${businessId}`
        );

        console.log(`Payment successful for business ${businessId} - tier: ${tier}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find business by customer ID (stored in metadata during checkout)
        // Note: We'll need to store customer_id in the database during checkout.session.completed
        // For now, we'll try to find it via the subscription metadata
        const metadata = subscription.metadata || {};
        const businessId = metadata.businessId;

        if (!businessId) {
          console.error('Cannot find businessId for canceled subscription:', subscription.id);
          break;
        }

        // Get business name for notification
        const businessResult = await pool.query(
          'SELECT name_ko, name_en, tier FROM businesses WHERE id = $1',
          [businessId]
        );

        if (businessResult.rowCount === 0) {
          console.error('Business not found:', businessId);
          break;
        }

        const businessName = businessResult.rows[0].name_ko || businessResult.rows[0].name_en;
        const previousTier = businessResult.rows[0].tier;

        // Downgrade to free tier
        await pool.query(
          `UPDATE business_claims SET tier = 'free' WHERE business_id = $1`,
          [businessId]
        );

        await pool.query(
          `UPDATE businesses SET tier = 'free', featured = false WHERE id = $1`,
          [businessId]
        );

        // Send Telegram notification
        await sendTelegramAlert(
          `⚠️ <b>구독 취소</b>\n\n` +
          `업체: ${businessName}\n` +
          `이전 플랜: ${previousTier}\n` +
          `업체 ID: ${businessId}`
        );

        console.log(`Subscription canceled for business ${businessId}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const customerEmail = invoice.customer_email;

        // Try to get business info from subscription metadata
        const subscriptionId = (invoice as any).subscription as string;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const businessId = subscription.metadata?.businessId;

          if (businessId) {
            const businessResult = await pool.query(
              'SELECT name_ko, name_en FROM businesses WHERE id = $1',
              [businessId]
            );

            const businessName = businessResult.rows[0]?.name_ko || businessResult.rows[0]?.name_en || 'Unknown Business';

            // Send Telegram notification
            await sendTelegramAlert(
              `🔴 <b>결제 실패</b>\n\n` +
              `업체: ${businessName}\n` +
              `이메일: ${customerEmail || 'N/A'}\n` +
              `업체 ID: ${businessId}\n\n` +
              `Stripe가 자동으로 재시도합니다.`
            );
          }
        }

        console.log(`Payment failed for customer ${customerId}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    await pool.end();
    return res.status(500).json({ error: 'Webhook processing failed' });
  }

  await pool.end();
  return res.status(200).json({ received: true });
}

// Helper to get raw body for webhook signature verification
async function getRawBody(req: VercelRequest): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req as any) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

// Main handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method === 'POST') {
    // Check if this is a webhook request (has stripe-signature header)
    if (req.headers['stripe-signature']) {
      return handleWebhook(req, res);
    }

    // Otherwise, it's a checkout session creation request
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

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
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
        subscription_data: {
          metadata: {
            businessId,
            tier,
          },
        },
        success_url: `${siteUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/pricing?canceled=true`,
      });
      
      return res.status(200).json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
      console.error("POST /api/stripe-checkout error:", error);
      return res.status(500).json({
        error: "결제 처리 중 오류가 발생했습니다"
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
