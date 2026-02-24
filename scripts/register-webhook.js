#!/usr/bin/env node
/**
 * Stripe Webhook Registration Script
 * 
 * This script registers a webhook endpoint with Stripe to receive payment events.
 * 
 * Usage:
 *   node scripts/register-webhook.js
 * 
 * Required environment variables:
 *   STRIPE_SECRET_KEY - Your Stripe secret key (starts with sk_live_...)
 */

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_KEY) { console.error('ERROR: Set STRIPE_SECRET_KEY env variable'); process.exit(1); }
const WEBHOOK_URL = 'https://dalconnect.buildkind.tech/api/stripe-checkout';

const EVENTS = [
  'checkout.session.completed',
  'customer.subscription.deleted',
  'invoice.payment_failed'
];

async function registerWebhook() {
  try {
    console.log('🔧 Registering Stripe webhook...\n');
    console.log(`URL: ${WEBHOOK_URL}`);
    console.log(`Events: ${EVENTS.join(', ')}\n`);

    // Dynamic import for ESM compatibility
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(STRIPE_KEY, {
      apiVersion: '2024-12-18.acacia',
    });

    // First, list existing webhooks to check if one already exists
    console.log('📋 Checking existing webhooks...');
    const existingWebhooks = await stripe.webhookEndpoints.list({ limit: 100 });
    
    const existingEndpoint = existingWebhooks.data.find(
      webhook => webhook.url === WEBHOOK_URL
    );

    if (existingEndpoint) {
      console.log('\n⚠️  Webhook already exists!');
      console.log(`   ID: ${existingEndpoint.id}`);
      console.log(`   Status: ${existingEndpoint.status}`);
      console.log(`   Events: ${existingEndpoint.enabled_events.join(', ')}`);
      console.log(`\n   Secret: ${existingEndpoint.secret}`);
      
      console.log('\n✅ Add this to your Vercel environment variables:');
      console.log(`   STRIPE_WEBHOOK_SECRET=${existingEndpoint.secret}`);
      
      console.log('\n💡 To update events or delete this webhook, use Stripe Dashboard:');
      console.log(`   https://dashboard.stripe.com/webhooks/${existingEndpoint.id}`);
      
      return;
    }

    // Create new webhook endpoint
    console.log('📝 Creating new webhook endpoint...');
    const endpoint = await stripe.webhookEndpoints.create({
      url: WEBHOOK_URL,
      enabled_events: EVENTS,
      description: 'DalConnect Payment Notifications',
    });

    console.log('\n✅ Webhook registered successfully!');
    console.log(`   ID: ${endpoint.id}`);
    console.log(`   Status: ${endpoint.status}`);
    console.log(`\n🔐 Webhook Secret (save this!):`);
    console.log(`   ${endpoint.secret}`);
    
    console.log('\n📋 Next steps:');
    console.log('   1. Add to Vercel environment variables:');
    console.log(`      STRIPE_WEBHOOK_SECRET=${endpoint.secret}`);
    console.log('\n   2. Deploy your changes to Vercel');
    console.log('\n   3. Test the webhook using Stripe CLI:');
    console.log('      stripe trigger checkout.session.completed');
    
    console.log('\n💡 Webhook Dashboard:');
    console.log(`   https://dashboard.stripe.com/webhooks/${endpoint.id}`);

  } catch (error) {
    console.error('\n❌ Error registering webhook:', error.message);
    
    if (error.type === 'StripeAuthenticationError') {
      console.error('\n💡 Make sure STRIPE_SECRET_KEY is set correctly');
      console.error('   Current key starts with:', STRIPE_KEY.substring(0, 10) + '...');
    }
    
    process.exit(1);
  }
}

// Run the script
registerWebhook();
