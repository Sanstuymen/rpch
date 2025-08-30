import { VALIDATION_RULES } from './constants.js';

// Validation helpers
export const validateRPCConfig = (config) => {
  const errors = [];

  // Required fields validation
  if (!config.applicationId || !VALIDATION_RULES.APPLICATION_ID.pattern.test(config.applicationId)) {
    errors.push(VALIDATION_RULES.APPLICATION_ID.message);
  }

  if (!config.name || config.name.trim().length === 0) {
    errors.push(VALIDATION_RULES.NAME.message);
  }

  if (config.name && config.name.length > VALIDATION_RULES.NAME.maxLength) {
    errors.push(VALIDATION_RULES.NAME.message);
  }

  // Optional fields validation
  if (config.details && config.details.length > VALIDATION_RULES.DETAILS.maxLength) {
    errors.push(VALIDATION_RULES.DETAILS.message);
  }

  if (config.state && config.state.length > VALIDATION_RULES.STATE.maxLength) {
    errors.push(VALIDATION_RULES.STATE.message);
  }

  // Button validation
  if (config.button1Label && config.button1Label.length > VALIDATION_RULES.BUTTON_LABEL.maxLength) {
    errors.push('Button 1 label: ' + VALIDATION_RULES.BUTTON_LABEL.message);
  }

  if (config.button2Label && config.button2Label.length > VALIDATION_RULES.BUTTON_LABEL.maxLength) {
    errors.push('Button 2 label: ' + VALIDATION_RULES.BUTTON_LABEL.message);
  }

  // URL validation
  if (config.button1Url && !VALIDATION_RULES.URL.pattern.test(config.button1Url)) {
    errors.push('Button 1 URL: ' + VALIDATION_RULES.URL.message);
  }

  if (config.button2Url && !VALIDATION_RULES.URL.pattern.test(config.button2Url)) {
    errors.push('Button 2 URL: ' + VALIDATION_RULES.URL.message);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Text formatting helpers
export const escapeMarkdown = (text) => {
  if (!text) return '';
  return text.replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&');
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
};

// Keyboard generation helpers
export const createConfigListKeyboard = (configs, action = 'select') => {
  const buttons = [];
  const configEntries = [];
  for (const key in configs) {
    if (configs.hasOwnProperty(key)) {
      configEntries.push([key, configs[key]]);
    }
  }
  
  if (configEntries.length === 0) {
    return {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🏠 Back to Menu', callback_data: 'main_menu' }]
        ]
      }
    };
  }

  // Create buttons for each configuration (max 2 per row)
  for (let i = 0; i < configEntries.length; i += 2) {
    const row = [];
    const [configId1, config1] = configEntries[i];
    
    row.push({
      text: `${truncateText(config1.name, 20)}`,
      callback_data: `${action}_config_${configId1}`
    });

    // Add second button if exists
    if (i + 1 < configEntries.length) {
      const [configId2, config2] = configEntries[i + 1];
      row.push({
        text: `${truncateText(config2.name, 20)}`,
        callback_data: `${action}_config_${configId2}`
      });
    }

    buttons.push(row);
  }

  // Add back button
  buttons.push([{ text: '🏠 Back to Menu', callback_data: 'main_menu' }]);

  return {
    reply_markup: {
      inline_keyboard: buttons
    }
  };
};

export const createEditFieldKeyboard = () => {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📝 Name', callback_data: 'edit_field_name' },
          { text: '📋 Details', callback_data: 'edit_field_details' }
        ],
        [
          { text: '🏷️ State', callback_data: 'edit_field_state' },
          { text: '🆔 App ID', callback_data: 'edit_field_applicationId' }
        ],
        [
          { text: '🖼️ Large Image', callback_data: 'edit_field_largeImage' },
          { text: '🔘 Small Image', callback_data: 'edit_field_smallImage' }
        ],
        [
          { text: '🏷️ Large Text', callback_data: 'edit_field_largeText' },
          { text: '🏷️ Small Text', callback_data: 'edit_field_smallText' }
        ],
        [
          { text: '🔘 Button 1', callback_data: 'edit_field_button1' },
          { text: '🔘 Button 2', callback_data: 'edit_field_button2' }
        ],
        [
          { text: '⏰ Timestamp', callback_data: 'edit_field_timestamp' }
        ],
        [
          { text: '💾 Save Changes', callback_data: 'save_changes' },
          { text: '🏠 Back to Menu', callback_data: 'main_menu' }
        ]
      ]
    }
  };
};

// Configuration formatting helpers
export const formatConfigForDisplay = (config) => {
  let text = `📋 **${escapeMarkdown(config.name)}**\n\n`;
  
  if (config.details) text += `**Details:** ${escapeMarkdown(config.details)}\n`;
  if (config.state) text += `**State:** ${escapeMarkdown(config.state)}\n`;
  if (config.applicationId) text += `**App ID:** \`${config.applicationId}\`\n`;
  
  if (config.largeImage) text += `**Large Image:** ${config.largeImage}\n`;
  if (config.smallImage) text += `**Small Image:** ${config.smallImage}\n`;
  if (config.largeText) text += `**Large Text:** ${escapeMarkdown(config.largeText)}\n`;
  if (config.smallText) text += `**Small Text:** ${escapeMarkdown(config.smallText)}\n`;
  
  if (config.button1Label || config.button1Url) {
    text += `**Button 1:** ${config.button1Label || 'No label'} - ${config.button1Url || 'No URL'}\n`;
  }
  
  if (config.button2Label || config.button2Url) {
    text += `**Button 2:** ${config.button2Label || 'No label'} - ${config.button2Url || 'No URL'}\n`;
  }
  
  if (config.timestamp) text += `**Timestamp:** ${config.timestamp ? 'Enabled' : 'Disabled'}\n`;
  
  if (config.createdAt) {
    const date = new Date(config.createdAt).toLocaleDateString();
    text += `\n**Created:** ${date}`;
  }
  
  return text;
};

// Progress tracking helpers
export const createProgressTracker = () => {
  return {
    currentStep: 0,
    totalSteps: 0,
    steps: [],
    data: {},
    
    setSteps(steps) {
      this.steps = steps;
      this.totalSteps = steps.length;
      this.currentStep = 0;
    },
    
    getCurrentStep() {
      return this.steps[this.currentStep];
    },
    
    nextStep() {
      if (this.currentStep < this.totalSteps - 1) {
        this.currentStep++;
        return true;
      }
      return false;
    },
    
    previousStep() {
      if (this.currentStep > 0) {
        this.currentStep--;
        return true;
      }
      return false;
    },
    
    isComplete() {
      return this.currentStep >= this.totalSteps - 1;
    },
    
    getProgress() {
      return {
        current: this.currentStep + 1,
        total: this.totalSteps,
        percentage: Math.round(((this.currentStep + 1) / this.totalSteps) * 100)
      };
    }
  };
};

// Error handling helpers
export const handleError = (error, context = '') => {
  console.error(`Error in ${context}:`, error);
  
  if (error.code === 'ENOENT') {
    return 'File not found. Please try again.';
  } else if (error.code === 'EACCES') {
    return 'Permission denied. Please check file permissions.';
  } else if (error.name === 'ValidationError') {
    return error.message;
  } else if (error.name === 'SyntaxError') {
    return 'Invalid data format. Please check your input.';
  }
  
  return 'An unexpected error occurred. Please try again.';
};

// Time formatting helpers
export const formatUptime = (startTime) => {
  const uptime = Date.now() - startTime;
  const seconds = Math.floor(uptime / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

// Utility functions
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

export const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, '');
};