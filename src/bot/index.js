import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import rpcManager from '../rpc/manager.js';

// Import command handlers
import { startCommand, mainMenuCallback, helpCallback } from './commands/start.js';
import { createRPCCallback, handleCreationInput, handleCreationCallbacks } from './commands/create.js';
import { listRPCCallback, viewConfigCallback } from './commands/list.js';
import { activateRPCCallback, activateConfigCallback } from './commands/activate.js';

// Load environment variables
dotenv.config();

class TelegramRPCBot {
  constructor() {
    this.bot = null;
    this.isRunning = false;
    this.authorizedUsers = new Set();
    this.initializeAuthorizedUsers();
  }

  initializeAuthorizedUsers() {
    const users = process.env.AUTHORIZED_USERS || '';
    users.split(',').forEach(userId => {
      const id = parseInt(userId.trim());
      if (!isNaN(id)) {
        this.authorizedUsers.add(id);
      }
    });
    
    console.log(`📋 Authorized users: ${this.authorizedUsers.size}`);
  }

  async initialize() {
    try {
      // Validate environment variables
      if (!process.env.TELEGRAM_BOT_TOKEN) {
        throw new Error('TELEGRAM_BOT_TOKEN is required');
      }
      
      if (!process.env.DISCORD_TOKEN) {
        throw new Error('DISCORD_TOKEN is required');
      }

      // Initialize RPC Manager
      await rpcManager.initialize(process.env.DISCORD_TOKEN);
      console.log('✅ RPC Manager initialized');

      // Create bot instance
      this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
      console.log('🤖 Telegram bot created');

      // Set up middleware
      this.setupMiddleware();

      // Set up commands
      this.setupCommands();

      // Set up callback handlers
      this.setupCallbacks();

      // Set up message handlers
      this.setupMessageHandlers();

      // Error handling
      this.setupErrorHandling();

      console.log('🔧 Bot setup completed');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize bot:', error);
      throw error;
    }
  }

  setupMiddleware() {
    // Authorization middleware
    this.bot.use(async (ctx, next) => {
      const userId = ctx.from?.id;
      
      if (!userId) {
        return;
      }

      // Check if user is authorized
      if (this.authorizedUsers.size > 0 && !this.authorizedUsers.has(userId)) {
        await ctx.reply('❌ You are not authorized to use this bot.');
        return;
      }

      // Log user activity
      const username = ctx.from.username || ctx.from.first_name || 'Unknown';
      console.log(`👤 User ${username} (${userId}): ${ctx.message?.text || ctx.callbackQuery?.data || 'action'}`);

      await next();
    });

    // Rate limiting middleware (simple implementation)
    const userLastAction = new Map();
    this.bot.use(async (ctx, next) => {
      const userId = ctx.from?.id;
      const now = Date.now();
      const lastAction = userLastAction.get(userId) || 0;
      
      if (now - lastAction < 1000) { // 1 second rate limit
        await ctx.answerCbQuery('⏳ Please wait a moment...');
        return;
      }
      
      userLastAction.set(userId, now);
      await next();
    });
  }

  setupCommands() {
    // Basic commands
    this.bot.command('start', startCommand);
    this.bot.command('help', async (ctx) => {
      await ctx.reply(`📖 **Help & Commands**

**Available Commands:**
• /start - Show main menu
• /create - Create new RPC configuration  
• /list - View all your configurations
• /activate - Activate RPC configuration
• /stop - Stop current RPC
• /status - Check current status

**How to use:**
1. Create a configuration with /create
2. Activate it with /activate
3. Your Discord will show the custom status!

Use the buttons in the main menu for easier navigation.`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
          ]
        },
        parse_mode: 'Markdown'
      });
    });

    // Direct commands
    this.bot.command('create', async (ctx) => {
      await createRPCCallback(ctx);
    });

    this.bot.command('list', async (ctx) => {
      await listRPCCallback(ctx);
    });

    this.bot.command('activate', async (ctx) => {
      await activateRPCCallback(ctx);
    });

    this.bot.command('stop', async (ctx) => {
      try {
        const result = await rpcManager.stopRPC();
        if (result.success) {
          await ctx.reply('⏹️ RPC stopped successfully.', {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '▶️ Activate RPC', callback_data: 'activate_rpc' },
                  { text: '📊 Status', callback_data: 'status_rpc' }
                ],
                [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
              ]
            }
          });
        } else {
          await ctx.reply(`❌ Failed to stop RPC: ${result.error}`);
        }
      } catch (error) {
        console.error('Error in stop command:', error);
        await ctx.reply('❌ An error occurred while stopping RPC.');
      }
    });

    this.bot.command('status', async (ctx) => {
      try {
        const status = rpcManager.getDetailedStatus(ctx.from.id);
        
        let message = `📊 **Bot Status**\n\n`;
        message += `**Discord Connection:** ${status.rpc.connected ? '✅ Connected' : '❌ Disconnected'}\n`;
        
        if (status.rpc.connected && status.rpc.username) {
          message += `**Discord User:** ${status.rpc.username}\n`;
        }
        
        if (status.active.configId) {
          message += `**Active RPC:** ${status.active.config?.name || 'Unknown'}\n`;
          const uptime = Math.floor(status.rpc.uptime / 1000) || 0;
          message += `**Uptime:** ${uptime}s\n`;
        } else {
          message += `**Active RPC:** None\n`;
        }
        
        message += `**Your Configurations:** ${status.user.configCount}\n`;
        message += `**Total Configurations:** ${status.stats.totalConfigs}`;

        await ctx.reply(message, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🔄 Refresh', callback_data: 'status_rpc' },
                { text: '⏹️ Stop RPC', callback_data: 'stop_rpc' }
              ],
              [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
            ]
          },
          parse_mode: 'Markdown'
        });
      } catch (error) {
        console.error('Error in status command:', error);
        await ctx.reply('❌ An error occurred while getting status.');
      }
    });
  }

  setupCallbacks() {
    // Main menu and navigation
    this.bot.action('main_menu', mainMenuCallback);
    this.bot.action('help', helpCallback);

    // RPC management callbacks
    this.bot.action('create_rpc', createRPCCallback);
    this.bot.action('list_rpc', listRPCCallback);
    this.bot.action('activate_rpc', activateRPCCallback);

    // Config-specific callbacks
    this.bot.action(/^view_config_/, viewConfigCallback);
    this.bot.action(/^activate_config_/, activateConfigCallback);

    // Stop RPC callback
    this.bot.action('stop_rpc', async (ctx) => {
      try {
        await ctx.answerCbQuery('⏹️ Stopping RPC...');
        
        const result = await rpcManager.stopRPC();
        if (result.success) {
          await ctx.editMessageText('⏹️ **RPC Stopped**\n\nYour Discord Rich Presence has been stopped.', {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '▶️ Activate RPC', callback_data: 'activate_rpc' },
                  { text: '📊 Status', callback_data: 'status_rpc' }
                ],
                [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
              ]
            },
            parse_mode: 'Markdown'
          });
        } else {
          await ctx.editMessageText(`❌ **Failed to Stop RPC**\n\n${result.error}`, {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔄 Try Again', callback_data: 'stop_rpc' }],
                [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
              ]
            },
            parse_mode: 'Markdown'
          });
        }
      } catch (error) {
        console.error('Error stopping RPC:', error);
        await ctx.answerCbQuery('❌ Error stopping RPC');
      }
    });

    // Status callback
    this.bot.action('status_rpc', async (ctx) => {
      try {
        const status = rpcManager.getDetailedStatus(ctx.from.id);
        
        let message = `📊 **Current Status**\n\n`;
        message += `**Manager:** ${status.manager.initialized ? '✅ Ready' : '❌ Not Ready'}\n`;
        message += `**Discord:** ${status.rpc.connected ? '✅ Connected' : '❌ Disconnected'}\n`;
        
        if (status.rpc.connected && status.rpc.username) {
          message += `**User:** ${status.rpc.username}\n`;
        }
        
        if (status.active.configId) {
          message += `**Active:** ${status.active.config?.name || 'Unknown'}\n`;
          const activatedTime = new Date(status.active.activatedAt).toLocaleString();
          message += `**Activated:** ${activatedTime}\n`;
          
          if (status.rpc.uptime) {
            const uptime = Math.floor(status.rpc.uptime / 1000);
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = uptime % 60;
            
            if (hours > 0) {
              message += `**Uptime:** ${hours}h ${minutes}m ${seconds}s\n`;
            } else if (minutes > 0) {
              message += `**Uptime:** ${minutes}m ${seconds}s\n`;
            } else {
              message += `**Uptime:** ${seconds}s\n`;
            }
          }
        } else {
          message += `**Active:** None\n`;
        }
        
        message += `\n**Your Configs:** ${status.user.configCount}`;

        await ctx.editMessageText(message, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🔄 Refresh', callback_data: 'status_rpc' },
                status.active.configId ? 
                  { text: '⏹️ Stop', callback_data: 'stop_rpc' } :
                  { text: '▶️ Activate', callback_data: 'activate_rpc' }
              ],
              [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
            ]
          },
          parse_mode: 'Markdown'
        });
      } catch (error) {
        console.error('Error getting status:', error);
        await ctx.answerCbQuery('❌ Error getting status');
      }
    });

    // Handle creation-specific callbacks
    this.bot.action(/^(skip_step_|timestamp_|confirm_create_)/, async (ctx) => {
      const handled = await handleCreationCallbacks(ctx);
      if (!handled) {
        await ctx.answerCbQuery('❌ Session expired or invalid action');
      }
    });
  }

  setupMessageHandlers() {
    // Handle text messages (for RPC creation)
    this.bot.on('text', async (ctx) => {
      try {
        // Check if user is in creation mode
        const handled = await handleCreationInput(ctx, this.bot);
        
        if (!handled) {
          // Default response for unhandled text
          await ctx.reply('👋 Use /start to see the main menu, or use the buttons below:', {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '✨ Create RPC', callback_data: 'create_rpc' },
                  { text: '📋 My RPCs', callback_data: 'list_rpc' }
                ],
                [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
              ]
            }
          });
        }
      } catch (error) {
        console.error('Error handling text message:', error);
        await ctx.reply('❌ An error occurred processing your message.');
      }
    });
  }

  setupErrorHandling() {
    this.bot.catch((err, ctx) => {
      console.error('❌ Bot error:', err);
      
      if (ctx.answerCbQuery) {
        ctx.answerCbQuery('❌ An error occurred');
      } else if (ctx.reply) {
        ctx.reply('❌ An error occurred. Please try again.');
      }
    });

    // Handle process events
    process.once('SIGINT', () => this.shutdown('SIGINT'));
    process.once('SIGTERM', () => this.shutdown('SIGTERM'));
  }

  async start() {
    try {
      if (this.isRunning) {
        console.log('⚠️ Bot is already running');
        return;
      }

      await this.initialize();
      
      // Start bot
      this.bot.launch();
      this.isRunning = true;
      
      console.log('🚀 Telegram RPC Bot is running!');
      console.log('📱 Send /start to begin');
      
      // Enable graceful stop
      process.once('SIGINT', () => this.bot.stop('SIGINT'));
      process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
      
    } catch (error) {
      console.error('❌ Failed to start bot:', error);
      await this.shutdown();
      process.exit(1);
    }
  }

  async shutdown(signal = 'SHUTDOWN') {
    try {
      console.log(`\n🔌 Shutting down bot (${signal})...`);
      
      if (this.bot && this.isRunning) {
        this.bot.stop();
      }
      
      if (rpcManager) {
        await rpcManager.shutdown();
      }
      
      this.isRunning = false;
      console.log('✅ Bot shutdown complete');
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }
}

// Start the bot
if (process.argv.includes('--start') || process.env.NODE_ENV === 'production') {
  const bot = new TelegramRPCBot();
  bot.start().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export default TelegramRPCBot;