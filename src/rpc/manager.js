import RPCClient from './client.js';
import storage from '../utils/storage.js';
import { validateRPCConfig } from '../utils/helpers.js';

class RPCManager {
  constructor() {
    this.rpcClient = new RPCClient();
    this.isInitialized = false;
    this.discordToken = null;
  }

  async initialize(discordToken) {
    try {
      this.discordToken = discordToken;
      await this.rpcClient.connect(discordToken);
      this.isInitialized = true;
      console.log('✅ RPC Manager initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize RPC Manager:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  async shutdown() {
    try {
      await this.rpcClient.disconnect();
      this.isInitialized = false;
      console.log('🔌 RPC Manager shutdown');
      return true;
    } catch (error) {
      console.error('Error during RPC Manager shutdown:', error);
      throw error;
    }
  }

  // Configuration management
  async createConfiguration(userId, config) {
    try {
      // Validate configuration
      const validation = validateRPCConfig(config);
      if (!validation.isValid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
      }

      // Generate unique ID
      const configId = storage.generateConfigId();
      
      // Save configuration
      const success = storage.saveUserConfiguration(userId, configId, config);
      if (!success) {
        throw new Error('Failed to save configuration');
      }

      return {
        success: true,
        configId,
        message: 'Configuration created successfully'
      };
    } catch (error) {
      console.error('Error creating configuration:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  getUserConfigurations(userId) {
    try {
      const configs = storage.getUserConfigurations(userId);
      return {
        success: true,
        configurations: configs,
        count: Object.keys(configs).length
      };
    } catch (error) {
      console.error('Error getting user configurations:', error);
      return {
        success: false,
        error: error.message,
        configurations: {},
        count: 0
      };
    }
  }

  getConfiguration(userId, configId) {
    try {
      const config = storage.getUserConfiguration(userId, configId);
      if (!config) {
        return {
          success: false,
          error: 'Configuration not found'
        };
      }

      return {
        success: true,
        configuration: config
      };
    } catch (error) {
      console.error('Error getting configuration:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateConfiguration(userId, configId, updatedConfig) {
    try {
      // Check if configuration exists
      const existing = storage.getUserConfiguration(userId, configId);
      if (!existing) {
        return {
          success: false,
          error: 'Configuration not found'
        };
      }

      // Merge with existing configuration
      const mergedConfig = { ...existing, ...updatedConfig };

      // Validate updated configuration
      const validation = validateRPCConfig(mergedConfig);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Invalid configuration: ${validation.errors.join(', ')}`
        };
      }

      // Save updated configuration
      const success = storage.saveUserConfiguration(userId, configId, mergedConfig);
      if (!success) {
        return {
          success: false,
          error: 'Failed to save updated configuration'
        };
      }

      return {
        success: true,
        message: 'Configuration updated successfully'
      };
    } catch (error) {
      console.error('Error updating configuration:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  deleteConfiguration(userId, configId) {
    try {
      // Check if this configuration is currently active
      const activeConfig = storage.getActiveConfig();
      if (activeConfig.configId === configId && activeConfig.userId === userId) {
        // Stop RPC if this configuration is active
        this.stopRPC();
      }

      const success = storage.deleteUserConfiguration(userId, configId);
      if (!success) {
        return {
          success: false,
          error: 'Configuration not found or failed to delete'
        };
      }

      return {
        success: true,
        message: 'Configuration deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting configuration:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // RPC control
  async activateConfiguration(userId, configId) {
    try {
      if (!this.isInitialized) {
        return {
          success: false,
          error: 'RPC Manager not initialized. Please check Discord token.'
        };
      }

      // Get configuration
      const config = storage.getUserConfiguration(userId, configId);
      if (!config) {
        return {
          success: false,
          error: 'Configuration not found'
        };
      }

      // Stop current RPC if running
      await this.rpcClient.clearPresence();

      // Start new RPC
      await this.rpcClient.setPresence(config);

      // Set as active configuration
      storage.setActiveConfiguration(userId, configId);

      return {
        success: true,
        message: `RPC activated: ${config.name}`,
        configName: config.name
      };
    } catch (error) {
      console.error('Error activating RPC:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async stopRPC() {
    try {
      if (!this.isInitialized) {
        return {
          success: false,
          error: 'RPC Manager not initialized'
        };
      }

      await this.rpcClient.clearPresence();
      storage.clearActiveConfiguration();

      return {
        success: true,
        message: 'RPC stopped successfully'
      };
    } catch (error) {
      console.error('Error stopping RPC:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Status and monitoring
  getStatus() {
    const rpcStatus = this.rpcClient.getStatus();
    const activeConfig = storage.getActiveConfig();
    
    return {
      manager: {
        initialized: this.isInitialized,
        hasToken: !!this.discordToken
      },
      rpc: rpcStatus,
      active: activeConfig,
      stats: {
        totalConfigs: storage.getTotalConfigCount()
      }
    };
  }

  getDetailedStatus(userId) {
    const status = this.getStatus();
    const userConfigs = storage.getUserConfigurations(userId);
    
    return {
      ...status,
      user: {
        configCount: Object.keys(userConfigs).length,
        configurations: Object.keys(userConfigs).map(id => ({
          id,
          name: userConfigs[id].name,
          createdAt: userConfigs[id].createdAt
        }))
      }
    };
  }

  // Utility methods
  async testConnection() {
    try {
      if (!this.isInitialized) {
        return {
          success: false,
          error: 'RPC Manager not initialized'
        };
      }

      const result = await this.rpcClient.testConnection();
      return {
        success: result,
        message: result ? 'Connection test successful' : 'Connection test failed'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Backup and restore
  createBackup() {
    try {
      const backupFile = storage.createBackup();
      return {
        success: !!backupFile,
        backupFile: backupFile,
        message: backupFile ? 'Backup created successfully' : 'Failed to create backup'
      };
    } catch (error) {
      console.error('Error creating backup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Configuration templates
  getTemplateConfiguration() {
    return {
      name: 'My Custom RPC',
      details: 'Working on something awesome',
      state: 'Building the future',
      applicationId: '1380551344515055667',
      largeImage: 'https://placehold.co/512x512?text=Large+Image',
      smallImage: 'https://placehold.co/256x256?text=Small+Image',
      largeText: 'Large Image Text',
      smallText: 'Small Image Text',
      button1Label: 'Button 1',
      button1Url: 'https://example.com',
      button2Label: 'Button 2',
      button2Url: 'https://example.com',
      timestamp: true,
      status: 'idle'
    };
  }

  // Advanced features
  async rotateConfigurations(userId, configIds, intervalMinutes = 5) {
    // Implementation for rotating between multiple configurations
    // This would be a premium feature
    try {
      if (!configIds || configIds.length === 0) {
        return {
          success: false,
          error: 'No configurations provided for rotation'
        };
      }

      // Validate all configurations exist
      for (const configId of configIds) {
        const config = storage.getUserConfiguration(userId, configId);
        if (!config) {
          return {
            success: false,
            error: `Configuration ${configId} not found`
          };
        }
      }

      // Start rotation (simplified implementation)
      let currentIndex = 0;
      const rotateInterval = setInterval(async () => {
        try {
          const configId = configIds[currentIndex];
          await this.activateConfiguration(userId, configId);
          currentIndex = (currentIndex + 1) % configIds.length;
        } catch (error) {
          console.error('Error in rotation:', error);
        }
      }, intervalMinutes * 60 * 1000);

      // Store rotation info (you might want to persist this)
      return {
        success: true,
        message: `Rotation started with ${configIds.length} configurations`,
        intervalId: rotateInterval
      };
    } catch (error) {
      console.error('Error starting rotation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new RPCManager();