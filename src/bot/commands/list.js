import rpcManager from '../../rpc/manager.js';
import { MESSAGES } from '../../utils/constants.js';
import { createConfigListKeyboard, formatConfigForDisplay } from '../../utils/helpers.js';

export const listRPCCallback = async (ctx) => {
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
      await ctx.editMessageText('📝 **No RPC Configurations Found**\n\nYou haven\'t created any RPC configurations yet. Create your first one to get started!', {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✨ Create First RPC', callback_data: 'create_rpc' },
              { text: '❓ Help', callback_data: 'help' }
            ],
            [{ text: '🏠 Back to Menu', callback_data: 'main_menu' }]
          ]
        },
        parse_mode: 'Markdown'
      });
      return;
    }
    
    const message = `📋 **Your RPC Configurations** (${result.count})\n\nSelect a configuration to view details:`;
    const keyboard = createConfigListKeyboard(result.configurations, 'view');
    
    await ctx.editMessageText(message, {
      ...keyboard,
      parse_mode: 'Markdown'
    });
    
  } catch (error) {
    console.error('Error in list RPC callback:', error);
    await ctx.answerCbQuery(MESSAGES.ERROR);
  }
};

export const viewConfigCallback = async (ctx) => {
  try {
    const callbackData = ctx.callbackQuery.data;
    const configId = callbackData.replace('view_config_', '');
    const userId = ctx.from.id;
    
    const result = rpcManager.getConfiguration(userId, configId);
    
    if (!result.success) {
      await ctx.answerCbQuery(`❌ ${result.error}`);
      return;
    }
    
    const config = result.configuration;
    const message = formatConfigForDisplay(config);
    
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '▶️ Activate', callback_data: `activate_config_${configId}` },
            { text: '✏️ Edit', callback_data: `edit_config_${configId}` }
          ],
          [
            { text: '🗑️ Delete', callback_data: `delete_config_${configId}` },
            { text: '📋 Back to List', callback_data: 'list_rpc' }
          ],
          [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
        ]
      }
    };
    
    await ctx.editMessageText(message, {
      ...keyboard,
      parse_mode: 'Markdown'
    });
    
  } catch (error) {
    console.error('Error viewing config:', error);
    await ctx.answerCbQuery(MESSAGES.ERROR);
  }
};