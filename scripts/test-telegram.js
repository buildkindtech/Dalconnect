#!/usr/bin/env node
/**
 * Telegram Notification Test Script
 * 
 * Tests the Telegram bot configuration by sending a test message.
 * 
 * Usage:
 *   TELEGRAM_BOT_TOKEN=your_token node scripts/test-telegram.js
 * 
 * Required environment variables:
 *   TELEGRAM_BOT_TOKEN - Your Telegram Bot API token
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = '-5291007114'; // Hub-Projects

async function testTelegram() {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN environment variable not set');
    console.log('\n💡 Usage:');
    console.log('   TELEGRAM_BOT_TOKEN=your_token node scripts/test-telegram.js');
    process.exit(1);
  }

  console.log('🤖 Testing Telegram bot...\n');
  console.log(`Token: ${TELEGRAM_BOT_TOKEN.substring(0, 10)}...${TELEGRAM_BOT_TOKEN.substring(TELEGRAM_BOT_TOKEN.length - 5)}`);
  console.log(`Chat ID: ${CHAT_ID}\n`);

  const message = `🧪 <b>DalConnect 결제 시스템 테스트 알림</b>\n\n` +
    `✅ <b>시스템 상태:</b>\n` +
    `• 💰 프리미엄 결제: 준비 완료\n` +
    `• 📝 업체 등록 알림: 준비 완료\n` +
    `• 🏢 클레임 알림: 준비 완료\n` +
    `• ⚡ Webhook 처리: 준비 완료\n\n` +
    `<i>테스트 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'America/Chicago' })}</i>`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Telegram API error:', data);
      console.log('\n💡 Common issues:');
      console.log('   • Bot token is invalid');
      console.log('   • Bot is not added to the chat');
      console.log('   • Chat ID is incorrect');
      process.exit(1);
    }

    console.log('✅ Message sent successfully!');
    console.log(`   Message ID: ${data.result.message_id}`);
    console.log(`   Date: ${new Date(data.result.date * 1000).toLocaleString()}`);
    
    console.log('\n📋 Next steps:');
    console.log('   1. Check the Hub-Projects Telegram group for the test message');
    console.log('   2. Add TELEGRAM_BOT_TOKEN to Vercel environment variables:');
    console.log(`      npx vercel env add TELEGRAM_BOT_TOKEN production`);
    console.log('   3. Redeploy your application');

  } catch (error) {
    console.error('\n❌ Error sending message:', error.message);
    process.exit(1);
  }
}

// Run the test
testTelegram();
