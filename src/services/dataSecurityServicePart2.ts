import { SecurityConfig, SecurityStatus, BackupInfo, getDataSecurityService } from './dataSecurityService';

/**
 * 数据安全服务 - 第二部分
 * 包含剩余的方法实现
 */

// 获取数据安全服务实例
const dataSecurityService = getDataSecurityService();

// 扩展DataSecurityService原型方法
Object.assign(Object.getPrototypeOf(dataSecurityService), {
  /**
   * 从备份恢复（续）
   */
  async restoreFromBackup(this: DataSecurityService, backupId: string): Promise<boolean> {
    try {
      // 前面的代码...

      // 恢复数据（续）
      if (data.themeSettings) {
        localStorage.setItem('focusflow-theme-settings', data.themeSettings);
      }

      if (data.stats) {
        localStorage.setItem('focusflow-stats', data.stats);
      }

      if (data.sessions) {
        localStorage.setItem('focusflow-sessions', data.sessions);
      }

      console.log('Data restored successfully from backup');
      return true;
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return false;
    }
  },

  /**
   * 获取备份列表
   */
  getBackupList(this: DataSecurityService): BackupInfo[] {
    try {
      const backupListJson = localStorage.getItem('focusflow-backup-list');
      if (!backupListJson) return [];

      const backupList: BackupInfo[] = JSON.parse(backupListJson);
      return backupList.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to get backup list:', error);
      return [];
    }
  },

  /**
   * 删除备份
   */
  deleteBackup(this: DataSecurityService, backupId: string): boolean {
    try {
      // 删除备份数据
      localStorage.removeItem(`focusflow-backup-${backupId}`);

      // 更新备份列表
      const backupListJson = localStorage.getItem('focusflow-backup-list');
      if (backupListJson) {
        const backupList: BackupInfo[] = JSON.parse(backupListJson);
        const updatedList = backupList.filter(backup => backup.id !== backupId);
        localStorage.setItem('focusflow-backup-list', JSON.stringify(updatedList));

        // 更新状态
        this.status.backupCount = updatedList.length;
        this.saveBackupInfo();
        this.notifyListeners();
      }

      return true;
    } catch (error) {
      console.error('Failed to delete backup:', error);
      return false;
    }
  },

  /**
   * 更新配置
   */
  updateConfig(this: DataSecurityService, config: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveConfig();

    // 如果自动备份设置改变，更新定时器
    if (config.autoBackup !== undefined) {
      if (config.autoBackup) {
        this.startBackupTimer();
      } else {
        this.stopBackupTimer();
      }
    }

    // 更新加密状态
    if (config.encryptionEnabled !== undefined) {
      this.status.encryptionEnabled = config.encryptionEnabled;
      this.calculateSecurityScore();
      this.notifyListeners();
    }
  },

  /**
   * 获取配置
   */
  getConfig(this: DataSecurityService): SecurityConfig {
    return { ...this.config };
  },

  /**
   * 获取状态
   */
  getStatus(this: DataSecurityService): SecurityStatus {
    return { ...this.status };
  },

  /**
   * 计算安全评分
   */
  calculateSecurityScore(this: DataSecurityService): void {
    let score = 0;

    // 加密启用：+40分
    if (this.config.encryptionEnabled) {
      score += 40;
    }

    // 自动备份启用：+30分
    if (this.config.autoBackup) {
      score += 30;
    }

    // 有备份：+20分
    if (this.status.backupCount > 0) {
      score += 20;
    }

    // 最近有备份：+10分
    if (this.status.lastBackupTime) {
      const now = Date.now();
      const daysSinceLastBackup = (now - this.status.lastBackupTime) / (1000 * 60 * 60 * 24);

      if (daysSinceLastBackup <= 1) {
        score += 10;
      } else if (daysSinceLastBackup <= 7) {
        score += 5;
      }
    }

    this.status.securityScore = Math.min(100, score);
  },

  /**
   * 添加状态监听器
   */
  addStatusListener(this: DataSecurityService, listener: (status: SecurityStatus) => void): () => void {
    this.listeners.push(listener);

    // 立即通知当前状态
    listener({ ...this.status });

    // 返回移除监听器的函数
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  },

  /**
   * 通知监听器
   */
  notifyListeners(this: DataSecurityService): void {
    this.listeners.forEach(listener => {
      try {
        listener({ ...this.status });
      } catch (error) {
        console.error('Error in security status listener:', error);
      }
    });
  },

  /**
   * 导出数据
   */
  async exportData(this: DataSecurityService): Promise<string> {
    try {
      // 收集所有需要导出的数据
      const dataToExport: Record<string, any> = {};

      // 导出计时器设置
      const timerSettings = localStorage.getItem('focusflow-timer-settings');
      if (timerSettings) {
        dataToExport.timerSettings = timerSettings;
      }

      // 导出音效设置
      const soundSettings = localStorage.getItem('focusflow-sound-settings');
      if (soundSettings) {
        dataToExport.soundSettings = soundSettings;
      }

      // 导出通知设置
      const notificationSettings = localStorage.getItem('focusflow-notification-settings');
      if (notificationSettings) {
        dataToExport.notificationSettings = notificationSettings;
      }

      // 导出主题设置
      const themeSettings = localStorage.getItem('focusflow-theme-settings');
      if (themeSettings) {
        dataToExport.themeSettings = themeSettings;
      }

      // 导出统计数据
      const statsData = localStorage.getItem('focusflow-stats');
      if (statsData) {
        dataToExport.stats = statsData;
      }

      // 导出会话数据
      const sessionsData = localStorage.getItem('focusflow-sessions');
      if (sessionsData) {
        dataToExport.sessions = sessionsData;
      }

      // 添加导出元数据
      dataToExport.exportMetadata = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        encrypted: this.config.encryptionEnabled
      };

      // 序列化数据
      const serializedData = JSON.stringify(dataToExport, null, 2);

      // 加密数据
      return this.config.encryptionEnabled 
        ? await this.encryptData(serializedData)
        : serializedData;
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  },

  /**
   * 导入数据
   */
  async importData(this: DataSecurityService, data: string): Promise<boolean> {
    try {
      // 解密数据
      const decryptedData = this.config.encryptionEnabled 
        ? await this.decryptData(data)
        : data;

      // 解析数据
      const importedData = JSON.parse(decryptedData);

      // 验证数据格式
      if (!importedData.exportMetadata) {
        throw new Error('Invalid data format');
      }

      // 导入数据
      if (importedData.timerSettings) {
        localStorage.setItem('focusflow-timer-settings', importedData.timerSettings);
      }

      if (importedData.soundSettings) {
        localStorage.setItem('focusflow-sound-settings', importedData.soundSettings);
      }

      if (importedData.notificationSettings) {
        localStorage.setItem('focusflow-notification-settings', importedData.notificationSettings);
      }

      if (importedData.themeSettings) {
        localStorage.setItem('focusflow-theme-settings', importedData.themeSettings);
      }

      if (importedData.stats) {
        localStorage.setItem('focusflow-stats', importedData.stats);
      }

      if (importedData.sessions) {
        localStorage.setItem('focusflow-sessions', importedData.sessions);
      }

      console.log('Data imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  },

  /**
   * 重置所有数据
   */
  resetAllData(this: DataSecurityService): void {
    try {
      // 删除所有应用相关的数据
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('focusflow-')) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));

      // 重置状态
      this.status.lastBackupTime = null;
      this.status.backupCount = 0;
      this.saveBackupInfo();
      this.notifyListeners();

      console.log('All data has been reset');
    } catch (error) {
      console.error('Failed to reset all data:', error);
    }
  },

  /**
   * 获取数据统计
   */
  getDataStats(this: DataSecurityService): {
    totalKeys: number;
    totalSize: number;
    encryptedKeys: number;
    lastBackupTime: number | null;
  } {
    let totalKeys = 0;
    let totalSize = 0;
    let encryptedKeys = 0;

    // 统计本地存储中的数据
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('focusflow-')) {
        totalKeys++;
        const value = localStorage.getItem(key) || '';
        totalSize += value.length;

        // 检查是否是加密数据
        if (key.includes('backup-') && key !== 'focusflow-backup-list') {
          encryptedKeys++;
        }
      }
    }

    return {
      totalKeys,
      totalSize,
      encryptedKeys,
      lastBackupTime: this.status.lastBackupTime
    };
  }
});

// 创建单例实例
let dataSecurityServiceInstance: DataSecurityService | null = null;

export const getDataSecurityService = (): DataSecurityService => {
  if (!dataSecurityServiceInstance) {
    dataSecurityServiceInstance = new DataSecurityService();
  }
  return dataSecurityServiceInstance;
};

// 向后兼容
export const dataSecurityService = getDataSecurityService();
