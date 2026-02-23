import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createCheckoutSession } from '../server/stripe';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { tier, businessId, email } = req.body;
      
      if (!tier || !businessId || !email) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (tier !== "premium" && tier !== "elite") {
        return res.status(400).json({ error: "Invalid tier" });
      }

      const session = await createCheckoutSession(tier, businessId, email);
      
      return res.status(200).json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error("POST /api/stripe-checkout error:", error);
      return res.status(500).json({ error: "Failed to create checkout session" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
