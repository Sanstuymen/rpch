// Constants for the Telegram RPC Bot

export const BOT_COMMANDS = {
  START: 'start',
  CREATE: 'create',
  LIST: 'list',
  EDIT: 'edit',
  DELETE: 'delete',
  ACTIVATE: 'activate',
  STOP: 'stop',
  STATUS: 'status',
  HELP: 'help'
};

export const CALLBACK_ACTIONS = {
  MAIN_MENU: 'main_menu',
  CREATE_RPC: 'create_rpc',
  LIST_RPC: 'list_rpc',
  EDIT_RPC: 'edit_rpc',
  DELETE_RPC: 'delete_rpc',
  ACTIVATE_RPC: 'activate_rpc',
  STOP_RPC: 'stop_rpc',
  STATUS_RPC: 'status_rpc',
  CONFIRM_YES: 'confirm_yes',
  CONFIRM_NO: 'confirm_no',
  BACK: 'back'
};

export const RPC_FIELDS = {
  APPLICATION_ID: 'applicationId',
  NAME: 'name',
  DETAILS: 'details',
  STATE: 'state',
  LARGE_IMAGE: 'largeImage',
  SMALL_IMAGE: 'smallImage',
  LARGE_TEXT: 'largeText',
  SMALL_TEXT: 'smallText',
  BUTTON1_LABEL: 'button1Label',
  BUTTON1_URL: 'button1Url',
  BUTTON2_LABEL: 'button2Label',
  BUTTON2_URL: 'button2Url',
  TIMESTAMP: 'timestamp'
};

export const MESSAGES = {
  WELCOME: `🤖 **Welcome to RPC Bot!**

I can help you create and manage custom Discord Rich Presence configurations.

Use the buttons below to get started:`,

  HELP: `📖 **Help & Commands**

**Available Commands:**
• /start - Show main menu
• /create - Create new RPC configuration
• /list - View all your configurations
• /edit - Edit existing configuration
• /delete - Delete configuration
• /activate - Activate RPC configuration
• /stop - Stop current RPC
• /status - Check current status

**How to use:**
1. Create a configuration with /create
2. Activate it with /activate
3. Your Discord will show the custom status!

Need help? Use the buttons below:`,

  NO_CONFIGS: '📝 No RPC configurations found. Create one first!',
  
  RPC_STOPPED: '⏹️ RPC has been stopped successfully.',
  
  UNAUTHORIZED: '❌ You are not authorized to use this bot.',
  
  ERROR: '❌ An error occurred. Please try again later.',
  
  CONFIG_SAVED: '✅ RPC configuration saved successfully!',
  
  CONFIG_DELETED: '🗑️ Configuration deleted successfully.',
  
  INVALID_INPUT: '❌ Invalid input. Please try again.',
  
  RPC_ACTIVATED: '✅ RPC configuration activated successfully!',
  
  CANCEL_OPERATION: '❌ Operation cancelled.'
};

export const KEYBOARDS = {
  MAIN_MENU: {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✨ Create RPC', callback_data: CALLBACK_ACTIONS.CREATE_RPC },
          { text: '📋 My RPCs', callback_data: CALLBACK_ACTIONS.LIST_RPC }
        ],
        [
          { text: '▶️ Activate', callback_data: CALLBACK_ACTIONS.ACTIVATE_RPC },
          { text: '⏹️ Stop', callback_data: CALLBACK_ACTIONS.STOP_RPC }
        ],
        [
          { text: '📊 Status', callback_data: CALLBACK_ACTIONS.STATUS_RPC },
          { text: '❓ Help', callback_data: 'help' }
        ]
      ]
    }
  },

  CONFIRM: {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Yes', callback_data: CALLBACK_ACTIONS.CONFIRM_YES },
          { text: '❌ No', callback_data: CALLBACK_ACTIONS.CONFIRM_NO }
        ]
      ]
    }
  },

  BACK_TO_MENU: {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🏠 Back to Menu', callback_data: CALLBACK_ACTIONS.MAIN_MENU }]
      ]
    }
  }
};

export const RPC_DEFAULTS = {
  APPLICATION_ID: '1380551344515055667',
  TYPE: 'PLAYING',
  PLATFORM: 'desktop'
};

export const VALIDATION_RULES = {
  APPLICATION_ID: {
    required: true,
    pattern: /^\d{17,19}$/,
    message: 'Application ID must be 17-19 digits'
  },
  NAME: {
    required: true,
    maxLength: 128,
    message: 'Name must be 1-128 characters'
  },
  DETAILS: {
    maxLength: 128,
    message: 'Details must be less than 128 characters'
  },
  STATE: {
    maxLength: 128,
    message: 'State must be less than 128 characters'
  },
  BUTTON_LABEL: {
    maxLength: 32,
    message: 'Button label must be less than 32 characters'
  },
  URL: {
    pattern: /^https?:\/\/.+/,
    message: 'URL must start with http:// or https://'
  }
};