import rpcManager from '../../rpc/manager.js';
import { MESSAGES, RPC_FIELDS } from '../../utils/constants.js';
import { validateRPCConfig } from '../../utils/helpers.js';

// Store creation sessions
const creationSessions = new Map();

export const createRPCCallback = async (ctx) => {
  try {
    const userId = ctx.from.id;
    
    // Initialize creation session
    const sessionId = `${userId}_${Date.now()}`;
    const session = {
      userId,
      sessionId,
      currentStep: 0,
      data: {},
      steps: [
        'name',
        'details',
        'state',
        'applicationId',
        'largeImage',
        'smallImage',
        'largeText',
        'smallText',
        'button1',
        'button2',
        'timestamp',
        'confirm'
      ]
    };
    
    creationSessions.set(sessionId, session);
    
    const message = `🎨 **Create New RPC Configuration**

Let's create your custom Discord Rich Presence step by step.

**Step 1/12: Configuration Name**
Enter a name for your RPC configuration (required):

Examples: "Coding Session", "Gaming Time", "Music Vibes"`;

    await ctx.editMessageText(message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🏠 Cancel', callback_data: 'main_menu' }]
        ]
      },
      parse_mode: 'Markdown'
    });
    
    await ctx.answerCbQuery('Starting RPC creation...');
    
    // Set user in creation mode
    global.userSessions = global.userSessions || new Map();
    global.userSessions.set(userId, { mode: 'creating', sessionId });
    
  } catch (error) {
    console.error('Error starting RPC creation:', error);
    await ctx.answerCbQuery(MESSAGES.ERROR);
  }
};

export const handleCreationInput = async (ctx, bot) => {
  try {
    const userId = ctx.from.id;
    const userSession = global.userSessions?.get(userId);
    
    if (!userSession || userSession.mode !== 'creating') {
      return false; // Not in creation mode
    }
    
    const session = creationSessions.get(userSession.sessionId);
    if (!session) {
      return false;
    }
    
    const input = ctx.message.text.trim();
    const currentField = session.steps[session.currentStep];
    
    // Process input based on current step
    const result = await processCreationStep(session, currentField, input);
    
    if (result.error) {
      await ctx.reply(`❌ ${result.error}\n\nPlease try again:`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🏠 Cancel', callback_data: 'main_menu' }]
          ]
        }
      });
      return true;
    }
    
    if (result.complete) {
      // Creation complete
      const createResult = await rpcManager.createConfiguration(userId, session.data);
      
      creationSessions.delete(userSession.sessionId);
      global.userSessions.delete(userId);
      
      if (createResult.success) {
        await ctx.reply(`✅ **RPC Configuration Created!**

**Name:** ${session.data.name}
**Configuration ID:** \`${createResult.configId}\`

Your RPC configuration has been saved successfully. You can now activate it from the main menu!`, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '▶️ Activate Now', callback_data: `activate_config_${createResult.configId}` },
                { text: '📋 View All', callback_data: 'list_rpc' }
              ],
              [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
            ]
          },
          parse_mode: 'Markdown'
        });
      } else {
        await ctx.reply(`❌ Failed to create configuration: ${createResult.error}`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
            ]
          }
        });
      }
      return true;
    }
    
    // Continue to next step
    session.currentStep++;
    creationSessions.set(userSession.sessionId, session);
    
    await ctx.reply(result.nextMessage, {
      reply_markup: {
        inline_keyboard: result.keyboard || [
          [{ text: '⏭️ Skip', callback_data: `skip_step_${session.currentStep}` }],
          [{ text: '🏠 Cancel', callback_data: 'main_menu' }]
        ]
      },
      parse_mode: 'Markdown'
    });
    
    return true;
  } catch (error) {
    console.error('Error handling creation input:', error);
    await ctx.reply(MESSAGES.ERROR);
    return true;
  }
};

async function processCreationStep(session, field, input) {
  const step = session.currentStep + 1;
  const totalSteps = session.steps.length;
  
  switch (field) {
    case 'name':
      if (!input || input.length === 0) {
        return { error: 'Name is required and cannot be empty.' };
      }
      if (input.length > 128) {
        return { error: 'Name must be less than 128 characters.' };
      }
      session.data.name = input;
      return {
        nextMessage: `📝 **Step ${step + 1}/${totalSteps}: Details**
Enter the details text (optional):

This appears as the first line of your RPC. Examples:
• "Working on a new project"
• "Editing JavaScript files"
• "Building something amazing"`
      };
      
    case 'details':
      if (input.toLowerCase() !== 'skip' && input.length > 0) {
        if (input.length > 128) {
          return { error: 'Details must be less than 128 characters.' };
        }
        session.data.details = input;
      }
      return {
        nextMessage: `🏷️ **Step ${step + 1}/${totalSteps}: State**
Enter the state text (optional):

This appears as the second line of your RPC. Examples:
• "Workspace: MyProject"
• "Level 42"
• "In a meeting"`
      };
      
    case 'state':
      if (input.toLowerCase() !== 'skip' && input.length > 0) {
        if (input.length > 128) {
          return { error: 'State must be less than 128 characters.' };
        }
        session.data.state = input;
      }
      return {
        nextMessage: `🆔 **Step ${step + 1}/${totalSteps}: Application ID**
Enter Discord Application ID (optional):

Default: \`1380551344515055667\`
Create your own app at: https://discord.com/developers/applications

Or type 'skip' to use default.`
      };
      
    case 'applicationId':
      if (input.toLowerCase() !== 'skip' && input.length > 0) {
        if (!/^\d{17,19}$/.test(input)) {
          return { error: 'Application ID must be 17-19 digits.' };
        }
        session.data.applicationId = input;
      } else {
        session.data.applicationId = '1380551344515055667';
      }
      return {
        nextMessage: `🖼️ **Step ${step + 1}/${totalSteps}: Large Image**
Enter large image URL or asset key (optional):

Examples:
• \`https://example.com/image.png\`
• \`my_image_asset\`

This is the main image shown in your RPC.`
      };
      
    case 'largeImage':
      if (input.toLowerCase() !== 'skip' && input.length > 0) {
        session.data.largeImage = input;
      }
      return {
        nextMessage: `🔘 **Step ${step + 1}/${totalSteps}: Small Image**
Enter small image URL or asset key (optional):

This appears as a small overlay on the large image.`
      };
      
    case 'smallImage':
      if (input.toLowerCase() !== 'skip' && input.length > 0) {
        session.data.smallImage = input;
      }
      return {
        nextMessage: `🏷️ **Step ${step + 1}/${totalSteps}: Large Image Text**
Enter large image hover text (optional):

This text appears when hovering over the large image.`
      };
      
    case 'largeText':
      if (input.toLowerCase() !== 'skip' && input.length > 0) {
        session.data.largeText = input;
      }
      return {
        nextMessage: `🏷️ **Step ${step + 1}/${totalSteps}: Small Image Text**
Enter small image hover text (optional):

This text appears when hovering over the small image.`
      };
      
    case 'smallText':
      if (input.toLowerCase() !== 'skip' && input.length > 0) {
        session.data.smallText = input;
      }
      return {
        nextMessage: `🔘 **Step ${step + 1}/${totalSteps}: Button 1**
Enter button 1 details (optional):

Format: \`Label | URL\`
Example: \`Visit Website | https://example.com\`

Or type 'skip' to skip both buttons.`
      };
      
    case 'button1':
      if (input.toLowerCase() !== 'skip' && input.length > 0) {
        const parts = input.split('|').map(p => p.trim());
        if (parts.length !== 2) {
          return { error: 'Button format: Label | URL (separated by |)' };
        }
        if (parts[0].length > 32) {
          return { error: 'Button label must be less than 32 characters.' };
        }
        if (!/^https?:\/\/.+/.test(parts[1])) {
          return { error: 'Button URL must start with http:// or https://' };
        }
        session.data.button1Label = parts[0];
        session.data.button1Url = parts[1];
      }
      return {
        nextMessage: `🔘 **Step ${step + 1}/${totalSteps}: Button 2**
Enter button 2 details (optional):

Format: \`Label | URL\`
Example: \`Join Discord | https://discord.gg/invite\``
      };
      
    case 'button2':
      if (input.toLowerCase() !== 'skip' && input.length > 0) {
        const parts = input.split('|').map(p => p.trim());
        if (parts.length !== 2) {
          return { error: 'Button format: Label | URL (separated by |)' };
        }
        if (parts[0].length > 32) {
          return { error: 'Button label must be less than 32 characters.' };
        }
        if (!/^https?:\/\/.+/.test(parts[1])) {
          return { error: 'Button URL must start with http:// or https://' };
        }
        session.data.button2Label = parts[0];
        session.data.button2Url = parts[1];
      }
      return {
        nextMessage: `⏰ **Step ${step + 1}/${totalSteps}: Timestamp**
Show elapsed time since activation? (optional)

Type 'yes' to enable timestamp, or 'no'/'skip' to disable.`,
        keyboard: [
          [
            { text: '✅ Yes', callback_data: 'timestamp_yes' },
            { text: '❌ No', callback_data: 'timestamp_no' }
          ],
          [{ text: '🏠 Cancel', callback_data: 'main_menu' }]
        ]
      };
      
    case 'timestamp':
      const enableTimestamp = input.toLowerCase() === 'yes' || input.toLowerCase() === 'true';
      session.data.timestamp = enableTimestamp;
      
      // Generate preview
      const preview = generateConfigPreview(session.data);
      
      return {
        nextMessage: `✅ **Configuration Preview**

${preview}

**Confirm Creation:**`,
        keyboard: [
          [
            { text: '✅ Create RPC', callback_data: 'confirm_create_yes' },
            { text: '❌ Cancel', callback_data: 'confirm_create_no' }
          ],
          [{ text: '🔄 Start Over', callback_data: 'create_rpc' }]
        ]
      };
      
    case 'confirm':
      return { complete: true };
      
    default:
      return { error: 'Unknown step.' };
  }
}

function generateConfigPreview(data) {
  let preview = `**Name:** ${data.name}\n`;
  
  if (data.details) preview += `**Details:** ${data.details}\n`;
  if (data.state) preview += `**State:** ${data.state}\n`;
  if (data.applicationId) preview += `**App ID:** \`${data.applicationId}\`\n`;
  if (data.largeImage) preview += `**Large Image:** Set\n`;
  if (data.smallImage) preview += `**Small Image:** Set\n`;
  if (data.button1Label) preview += `**Button 1:** ${data.button1Label}\n`;
  if (data.button2Label) preview += `**Button 2:** ${data.button2Label}\n`;
  if (data.timestamp) preview += `**Timestamp:** Enabled\n`;
  
  return preview;
}

// Handle callback for step skipping and confirmation
export const handleCreationCallbacks = async (ctx) => {
  const callbackData = ctx.callbackQuery.data;
  const userId = ctx.from.id;
  
  if (callbackData.startsWith('skip_step_')) {
    const userSession = global.userSessions?.get(userId);
    if (userSession && userSession.mode === 'creating') {
      // Simulate empty input to skip step
      ctx.message = { text: 'skip' };
      return await handleCreationInput(ctx);
    }
  }
  
  if (callbackData === 'timestamp_yes') {
    ctx.message = { text: 'yes' };
    return await handleCreationInput(ctx);
  }
  
  if (callbackData === 'timestamp_no') {
    ctx.message = { text: 'no' };
    return await handleCreationInput(ctx);
  }
  
  if (callbackData === 'confirm_create_yes') {
    ctx.message = { text: 'confirm' };
    return await handleCreationInput(ctx);
  }
  
  if (callbackData === 'confirm_create_no') {
    global.userSessions?.delete(userId);
    await ctx.editMessageText('❌ RPC creation cancelled.', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
        ]
      }
    });
    return true;
  }
  
  return false;
};