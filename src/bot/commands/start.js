import { MESSAGES, KEYBOARDS } from '../../utils/constants.js';

export const startCommand = async (ctx) => {
  try {
    const userName = ctx.from.first_name || ctx.from.username || 'User';
    
    const welcomeMessage = `👋 **Hello ${userName}!**

${MESSAGES.WELCOME}

**Quick Start:**
1. 🔧 Create your first RPC configuration
2. ▶️ Activate it to see it on Discord
3. 📊 Check status anytime

Ready to get started?`;

    await ctx.reply(welcomeMessage, {
      ...KEYBOARDS.MAIN_MENU,
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Error in start command:', error);
    await ctx.reply(MESSAGES.ERROR);
  }
};

export const mainMenuCallback = async (ctx) => {
  try {
    await ctx.editMessageText(MESSAGES.WELCOME, {
      ...KEYBOARDS.MAIN_MENU,
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Error showing main menu:', error);
    await ctx.answerCbQuery(MESSAGES.ERROR);
  }
};

export const helpCallback = async (ctx) => {
  try {
    await ctx.editMessageText(MESSAGES.HELP, {
      ...KEYBOARDS.BACK_TO_MENU,
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Error showing help:', error);
    await ctx.answerCbQuery(MESSAGES.ERROR);
  }
};