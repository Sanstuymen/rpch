import rpcManager from '../../rpc/manager.js';
import { MESSAGES } from '../../utils/constants.js';
import { createConfigListKeyboard } from '../../utils/helpers.js';

export const activateRPCCallback = async (ctx) => {
  try {
    const userId = ctx.from.id;
    const result = rpcManager.getUserConfigurations(userId);
    
    if (!result.success) {
      await ctx.editMessageText(`❌ Error loading configurations: ${result.error}`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🏠 Back to Menu', callback_data: 'main_menu' }]
          ]
        }
      });
      return;
    }
    
    if (result.count === 0) {
      await ctx.editMessageText('📝 **No RPC Configurations Found**\n\nCreate a configuration first before activating.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '✨ Create RPC', callback_data: 'create_rpc' }],
            [{ text: '🏠 Back to Menu', callback_data: 'main_menu' }]
          ]
        },
        parse_mode: 'Markdown'
      });
      return;
    }
    
    const message = `▶️ **Activate RPC Configuration**\n\nSelect a configuration to activate:`;
    const keyboard = createConfigListKeyboard(result.configurations, 'activate');
    
    await ctx.editMessageText(message, {
      ...keyboard,
      parse_mode: 'Markdown'
    });
    
  } catch (error) {
    console.error('Error in activate RPC callback:', error);
    await ctx.answerCbQuery(MESSAGES.ERROR);
  }
};

export const activateConfigCallback = async (ctx) => {
  try {
    const callbackData = ctx.callbackQuery.data;
    const configId = callbackData.replace('activate_config_', '');
    const userId = ctx.from.id;
    
    await ctx.answerCbQuery('🔄 Activating RPC...');
    
    // Show loading message
    await ctx.editMessageText('🔄 **Activating RPC Configuration...**\n\nPlease wait while we set up your Discord Rich Presence.', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '⏹️ Cancel', callback_data: 'stop_rpc' }]
        ]
      },
      parse_mode: 'Markdown'
    });
    
    const result = await rpcManager.activateConfiguration(userId, configId);
    
    if (result.success) {
      const status = rpcManager.getStatus();
      const uptime = status.rpc.uptime ? Math.floor(status.rpc.uptime / 1000) : 0;
      
      await ctx.editMessageText(`✅ **RPC Activated Successfully!**

**Configuration:** ${result.configName}
**Discord User:** ${status.rpc.username || 'Connected'}
**Status:** Active
**Uptime:** ${uptime}s

Your Discord Rich Presence is now active! Check your Discord profile to see it in action.`, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📊 Check Status', callback_data: 'status_rpc' },
              { text: '⏹️ Stop RPC', callback_data: 'stop_rpc' }
            ],
            [
              { text: '📋 My RPCs', callback_data: 'list_rpc' },
              { text: '🏠 Main Menu', callback_data: 'main_menu' }
            ]
          ]
        },
        parse_mode: 'Markdown'
      });
    } else {
      await ctx.editMessageText(`❌ **Failed to Activate RPC**

**Error:** ${result.error}

This might be due to:
• Invalid Discord token
• Network connectivity issues
• Invalid RPC configuration

Please check your setup and try again.`, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔄 Try Again', callback_data: `activate_config_${configId}` },
              { text: '📊 Check Status', callback_data: 'status_rpc' }
            ],
            [
              { text: '📋 My RPCs', callback_data: 'list_rpc' },
              { text: '🏠 Main Menu', callback_data: 'main_menu' }
            ]
          ]
        },
        parse_mode: 'Markdown'
      });
    }
    
  } catch (error) {
    console.error('Error activating config:', error);
    await ctx.editMessageText(`❌ **Error Activating RPC**

An unexpected error occurred: ${error.message}

Please try again later.`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
        ]
      },
      parse_mode: 'Markdown'
    });
  }
};

export const quickActivateButtons = (configurations) => {
  const buttons = [];
  const configEntries = [];
  
  // Convert object to array
  for (const key in configurations) {
    if (configurations.hasOwnProperty(key)) {
      configEntries.push([key, configurations[key]]);
    }
  }
  
  // Create quick activate buttons (max 3 per row)
  for (let i = 0; i < Math.min(configEntries.length, 6); i += 3) {
    const row = [];
    
    for (let j = 0; j < 3 && (i + j) < configEntries.length; j++) {
      const [configId, config] = configEntries[i + j];
      const truncatedName = config.name.length > 12 ? 
        config.name.substring(0, 12) + '...' : config.name;
      
      row.push({
        text: `▶️ ${truncatedName}`,
        callback_data: `activate_config_${configId}`
      });
    }
    
    buttons.push(row);
  }
  
  return buttons;
};