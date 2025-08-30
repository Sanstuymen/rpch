import Discord from 'discord.js-selfbot-v13';
import { RPC_DEFAULTS } from '../utils/constants.js';
import { validateRPCConfig } from '../utils/helpers.js';

class RPCClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.currentConfig = null;
    this.presence = null;
    this.startTime = null;
    this.updateTimer = null;
  }

  async connect(token) {
    try {
      if (this.client && this.isConnected) {
        return true;
      }

      this.client = new Discord.Client({
        readyStatus: false,
        checkUpdate: false,
      });

      return new Promise((resolve, reject) => {
        this.client.once('ready', () => {
          console.log(`🔗 Discord RPC connected as: ${this.client.user.username}`);
          this.isConnected = true;
          this.startTime = Date.now();
          resolve(true);
        });

        this.client.once('error', (error) => {
          console.error('Discord client error:', error);
          this.isConnected = false;
          reject(error);
        });

        this.client.login(token).catch(reject);
      });
    } catch (error) {
      console.error('Error connecting to Discord:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.updateTimer) {
        clearTimeout(this.updateTimer);
        this.updateTimer = null;
      }

      if (this.client && this.isConnected) {
        await this.client.destroy();
      }

      this.client = null;
      this.isConnected = false;
      this.currentConfig = null;
      this.presence = null;
      this.startTime = null;

      console.log('🔌 Discord RPC disconnected');
      return true;
    } catch (error) {
      console.error('Error disconnecting from Discord:', error);
      throw error;
    }
  }

  async setPresence(config) {
    try {
      if (!this.client || !this.isConnected) {
        throw new Error('Discord client not connected');
      }

      const validation = validateRPCConfig(config);
      if (!validation.isValid) {
        throw new Error(`Invalid RPC configuration: ${validation.errors.join(', ')}`);
      }

      // Build the presence
      const presence = new Discord.RichPresence(this.client)
        .setApplicationId(config.applicationId || RPC_DEFAULTS.APPLICATION_ID)
        .setType(RPC_DEFAULTS.TYPE)
        .setName(config.name)
        .setPlatform(RPC_DEFAULTS.PLATFORM);

      // Optional fields
      if (config.details) presence.setDetails(config.details);
      if (config.state) presence.setState(config.state);

      // Timestamp handling
      if (config.timestamp) {
        const timestamp = config.customTimestamp || this.startTime || Date.now();
        presence.setStartTimestamp(timestamp);
      }

      // Images
      if (config.largeImage) {
        // Handle external images
        let extendURL = null;
        if (config.largeImage.startsWith('http')) {
          try {
            extendURL = await Discord.RichPresence.getExternal(
              this.client,
              config.applicationId || RPC_DEFAULTS.APPLICATION_ID,
              config.largeImage
            );
            if (extendURL && extendURL.length > 0) {
              presence.setAssetsLargeImage(extendURL[0].external_asset_path);
            }
          } catch (error) {
            console.warn('Failed to set external large image:', error);
            // Fallback to direct URL
            presence.setAssetsLargeImage(config.largeImage);
          }
        } else {
          presence.setAssetsLargeImage(config.largeImage);
        }
      }

      if (config.smallImage) {
        if (config.smallImage.startsWith('http')) {
          try {
            let extendURL = await Discord.RichPresence.getExternal(
              this.client,
              config.applicationId || RPC_DEFAULTS.APPLICATION_ID,
              config.smallImage
            );
            if (extendURL && extendURL.length > 0) {
              presence.setAssetsSmallImage(extendURL[0].external_asset_path);
            }
          } catch (error) {
            console.warn('Failed to set external small image:', error);
            presence.setAssetsSmallImage(config.smallImage);
          }
        } else {
          presence.setAssetsSmallImage(config.smallImage);
        }
      }

      // Image texts
      if (config.largeText) presence.setAssetsLargeText(config.largeText);
      if (config.smallText) presence.setAssetsSmallText(config.smallText);

      // Buttons
      const buttons = [];
      if (config.button1Label && config.button1Url) {
        buttons.push({ label: config.button1Label, url: config.button1Url });
      }
      if (config.button2Label && config.button2Url) {
        buttons.push({ label: config.button2Label, url: config.button2Url });
      }

      buttons.forEach((button, index) => {
        if (index === 0) presence.addButton(button.label, button.url);
        if (index === 1) presence.addButton(button.label, button.url);
      });

      // Set the presence
      await this.client.user.setPresence({
        activities: [presence],
        status: config.status || 'idle'
      });

      this.currentConfig = config;
      this.presence = presence;

      console.log(`✅ RPC presence updated: ${config.name}`);
      return true;
    } catch (error) {
      console.error('Error setting RPC presence:', error);
      throw error;
    }
  }

  async clearPresence() {
    try {
      if (!this.client || !this.isConnected) {
        return true;
      }

      await this.client.user.setPresence({
        activities: [],
        status: 'online'
      });

      this.currentConfig = null;
      this.presence = null;

      if (this.updateTimer) {
        clearTimeout(this.updateTimer);
        this.updateTimer = null;
      }

      console.log('🧹 RPC presence cleared');
      return true;
    } catch (error) {
      console.error('Error clearing RPC presence:', error);
      throw error;
    }
  }

  // Start auto-updating presence (for dynamic content)
  startAutoUpdate(config, intervalMs = 60000) {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }

    this.updateTimer = setTimeout(async () => {
      try {
        if (this.isConnected && this.currentConfig) {
          await this.setPresence(this.currentConfig);
          this.startAutoUpdate(config, intervalMs);
        }
      } catch (error) {
        console.error('Error in auto-update:', error);
      }
    }, intervalMs);
  }

  stopAutoUpdate() {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }
  }

  // Get current status
  getStatus() {
    return {
      connected: this.isConnected,
      currentConfig: this.currentConfig,
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      username: this.client?.user?.username || null,
      userId: this.client?.user?.id || null
    };
  }

  // Utility methods
  isActive() {
    return this.isConnected && this.currentConfig !== null;
  }

  getCurrentConfigName() {
    return this.currentConfig?.name || null;
  }

  async testConnection() {
    try {
      if (!this.client || !this.isConnected) {
        return false;
      }

      // Try to get user info
      const user = this.client.user;
      return user ? true : false;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

export default RPCClient;