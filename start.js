import TelegramRPCBot from './src/bot/index.js';

console.log('🚀 Starting Telegram RPC Bot...');

const bot = new TelegramRPCBot();

bot.start().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});