import fs from 'node:fs';
import path from 'node:path';

class Storage {
  constructor() {
    this.dataDir = './data';
    this.configFile = path.join(this.dataDir, 'configurations.json');
    this.activeFile = path.join(this.dataDir, 'active.json');
    this.init();
  }

  init() {
    // Create data directory if it doesn't exist
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    // Initialize configurations file
    if (!fs.existsSync(this.configFile)) {
      this.saveConfigurations({});
    }

    // Initialize active configuration file
    if (!fs.existsSync(this.activeFile)) {
      this.saveActiveConfig({});
    }
  }

  // Configuration management
  getConfigurations() {
    try {
      const data = fs.readFileSync(this.configFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading configurations:', error);
      return {};
    }
  }

  saveConfigurations(configurations) {
    try {
      fs.writeFileSync(this.configFile, JSON.stringify(configurations, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving configurations:', error);
      return false;
    }
  }

  getUserConfigurations(userId) {
    const allConfigs = this.getConfigurations();
    return allConfigs[userId] || {};
  }

  saveUserConfiguration(userId, configId, config) {
    const allConfigs = this.getConfigurations();
    
    if (!allConfigs[userId]) {
      allConfigs[userId] = {};
    }
    
    allConfigs[userId][configId] = {
      ...config,
      id: configId,
      createdAt: config.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return this.saveConfigurations(allConfigs);
  }

  deleteUserConfiguration(userId, configId) {
    const allConfigs = this.getConfigurations();
    
    if (allConfigs[userId] && allConfigs[userId][configId]) {
      delete allConfigs[userId][configId];
      return this.saveConfigurations(allConfigs);
    }
    
    return false;
  }

  getUserConfiguration(userId, configId) {
    const userConfigs = this.getUserConfigurations(userId);
    return userConfigs[configId] || null;
  }

  // Active configuration management
  getActiveConfig() {
    try {
      const data = fs.readFileSync(this.activeFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading active config:', error);
      return {};
    }
  }

  saveActiveConfig(activeConfig) {
    try {
      fs.writeFileSync(this.activeFile, JSON.stringify(activeConfig, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving active config:', error);
      return false;
    }
  }

  setActiveConfiguration(userId, configId) {
    const config = this.getUserConfiguration(userId, configId);
    if (!config) {
      return false;
    }

    const activeConfig = {
      userId,
      configId,
      config,
      activatedAt: new Date().toISOString()
    };

    return this.saveActiveConfig(activeConfig);
  }

  clearActiveConfiguration() {
    return this.saveActiveConfig({});
  }

  // Utility methods
  generateConfigId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  exportUserConfigurations(userId) {
    return this.getUserConfigurations(userId);
  }

  importUserConfigurations(userId, configurations) {
    const allConfigs = this.getConfigurations();
    allConfigs[userId] = configurations;
    return this.saveConfigurations(allConfigs);
  }

  // Statistics
  getUserConfigCount(userId) {
    const userConfigs = this.getUserConfigurations(userId);
    return Object.keys(userConfigs).length;
  }

  getTotalConfigCount() {
    const allConfigs = this.getConfigurations();
    let total = 0;
    
    for (const userId in allConfigs) {
      total += Object.keys(allConfigs[userId]).length;
    }
    
    return total;
  }

  // Backup and restore
  createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.dataDir, 'backups');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
    
    try {
      const data = {
        configurations: this.getConfigurations(),
        active: this.getActiveConfig(),
        timestamp: new Date().toISOString()
      };
      
      fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
      return backupFile;
    } catch (error) {
      console.error('Error creating backup:', error);
      return null;
    }
  }
}

export default new Storage();