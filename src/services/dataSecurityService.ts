/**
 * 数据安全服务
 * 提供数据加密存储和备份恢复功能
 */

export interface SecurityConfig {
  encryptionEnabled: boolean;
  autoBackup: boolean;
  backupInterval: number; // 备份间隔（小时）
  maxBackups: number; // 最大备份数量
  backupLocation: 'local' | 'cloud'; // 备份位置
}

export interface BackupInfo {
  id: string;
  timestamp: number;
  size: number;
  encrypted: boolean;
  checksum: string;
  version: string;
}

export interface SecurityStatus {
  encryptionEnabled: boolean;
  lastBackupTime: number | null;
  backupCount: number;
  securityScore: number; // 0-100的安全评分
}

class DataSecurityService {
  private config: SecurityConfig = {
    encryptionEnabled: true,
    autoBackup: true,
    backupInterval: 24, // 24小时
    maxBackups: 5,
    backupLocation: 'local'
  };

  private status: SecurityStatus = {
    encryptionEnabled: true,
    lastBackupTime: null,
    backupCount: 0,
    securityScore: 85 // 默认安全评分
  };

  private backupTimer: number | null = null;
  private encryptionKey: string | null = null;
  private listeners: Array<(status: SecurityStatus) => void> = [];

  constructor() {
    this.initialize();
  }

  /**
   * 初始化服务
   */
  private async initialize(): Promise<void> {
    // 加载配置
    this.loadConfig();

    // 生成或加载加密密钥
    await this.initializeEncryptionKey();

    // 加载备份信息
    this.loadBackupInfo();

    // 如果启用了自动备份，启动备份定时器
    if (this.config.autoBackup) {
      this.startBackupTimer();
    }

    // 计算安全评分
    this.calculateSecurityScore();
  }

  /**
   * 加载配置
   */
  private loadConfig(): void {
    try {
      const savedConfig = localStorage.getItem('focusflow-security-config');
      if (savedConfig) {
        this.config = { ...this.config, ...JSON.parse(savedConfig) };
      }
    } catch (error) {
      console.error('Failed to load security config:', error);
    }
  }

  /**
   * 保存配置
   */
  private saveConfig(): void {
    try {
      localStorage.setItem('focusflow-security-config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save security config:', error);
    }
  }

  /**
   * 初始化加密密钥
   */
  private async initializeEncryptionKey(): Promise<void> {
    try {
      // 尝试从本地存储加载密钥
      let savedKey = localStorage.getItem('focusflow-encryption-key');

      if (!savedKey) {
        // 生成新的密钥
        savedKey = await this.generateEncryptionKey();
        localStorage.setItem('focusflow-encryption-key', savedKey);
      }

      this.encryptionKey = savedKey;
    } catch (error) {
      console.error('Failed to initialize encryption key:', error);
      this.encryptionKey = null;
    }
  }

  /**
   * 生成加密密钥
   */
  private async generateEncryptionKey(): Promise<string> {
    // 在实际应用中，这里应该使用更安全的密钥生成方法
    // 这里简化为生成随机字符串
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * 加密数据
   */
  async encryptData(data: string): Promise<string> {
    if (!this.config.encryptionEnabled || !this.encryptionKey) {
      return data;
    }

    try {
      // 在实际应用中，这里应该使用更安全的加密算法
      // 这里简化为简单的异或加密
      const keyBytes = new TextEncoder().encode(this.encryptionKey);
      const dataBytes = new TextEncoder().encode(data);

      const resultBytes = new Uint8Array(dataBytes.length);
      for (let i = 0; i < dataBytes.length; i++) {
        resultBytes[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
      }

      return btoa(String.fromCharCode(...resultBytes));
    } catch (error) {
      console.error('Failed to encrypt data:', error);
      return data;
    }
  }

  /**
   * 解密数据
   */
  async decryptData(encryptedData: string): Promise<string> {
    if (!this.config.encryptionEnabled || !this.encryptionKey) {
      return encryptedData;
    }

    try {
      // 在实际应用中，这里应该使用更安全的解密算法
      // 这里简化为简单的异或解密
      const keyBytes = new TextEncoder().encode(this.encryptionKey);
      const dataBytes = new Uint8Array(
        atob(encryptedData)
          .split('')
          .map(char => char.charCodeAt(0))
      );

      const resultBytes = new Uint8Array(dataBytes.length);
      for (let i = 0; i < dataBytes.length; i++) {
        resultBytes[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
      }

      return new TextDecoder().decode(resultBytes);
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      return encryptedData;
    }
  }

  /**
   * 启动备份定时器
   */
  private startBackupTimer(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }

    this.backupTimer = window.setInterval(() => {
      this.createBackup();
    }, this.config.backupInterval * 60 * 60 * 1000);
  }

  /**
   * 停止备份定时器
   */
  private stopBackupTimer(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }
  }

  /**
   * 加载备份信息
   */
  private loadBackupInfo(): void {
    try {
      const backupInfoJson = localStorage.getItem('focusflow-backup-info');
      if (backupInfoJson) {
        const backupInfo = JSON.parse(backupInfoJson);
        this.status.lastBackupTime = backupInfo.lastBackupTime || null;
        this.status.backupCount = backupInfo.backupCount || 0;
      }
    } catch (error) {
      console.error('Failed to load backup info:', error);
    }
  }

  /**
   * 保存备份信息
   */
  private saveBackupInfo(): void {
    try {
      const backupInfo = {
        lastBackupTime: this.status.lastBackupTime,
        backupCount: this.status.backupCount
      };
      localStorage.setItem('focusflow-backup-info', JSON.stringify(backupInfo));
    } catch (error) {
      console.error('Failed to save backup info:', error);
    }
  }

  /**
   * 创建备份
   */
  async createBackup(): Promise<boolean> {
    try {
      // 收集所有需要备份的数据
      const dataToBackup: Record<string, any> = {};

      // 备份计时器设置
      const timerSettings = localStorage.getItem('focusflow-timer-settings');
      if (timerSettings) {
        dataToBackup.timerSettings = timerSettings;
      }

      // 备份音效设置
      const soundSettings = localStorage.getItem('focusflow-sound-settings');
      if (soundSettings) {
        dataToBackup.soundSettings = soundSettings;
      }

      // 备份通知设置
      const notificationSettings = localStorage.getItem('focusflow-notification-settings');
      if (notificationSettings) {
        dataToBackup.notificationSettings = notificationSettings;
      }

      // 备份主题设置
      const themeSettings = localStorage.getItem('focusflow-theme-settings');
      if (themeSettings) {
        dataToBackup.themeSettings = themeSettings;
      }

      // 备份统计数据
      const statsData = localStorage.getItem('focusflow-stats');
      if (statsData) {
        dataToBackup.stats = statsData;
      }

      // 备份会话数据
      const sessionsData = localStorage.getItem('focusflow-sessions');
      if (sessionsData) {
        dataToBackup.sessions = sessionsData;
      }

      // 序列化数据
      const serializedData = JSON.stringify(dataToBackup);

      // 加密数据
      const encryptedData = this.config.encryptionEnabled 
        ? await this.encryptData(serializedData)
        : serializedData;

      // 生成备份ID和校验和
      const backupId = `backup_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const checksum = await this.generateChecksum(encryptedData);

      // 创建备份信息
      const backupInfo: BackupInfo = {
        id: backupId,
        timestamp: Date.now(),
        size: encryptedData.length,
        encrypted: this.config.encryptionEnabled,
        checksum,
        version: '1.0'
      };

      // 保存备份数据
      localStorage.setItem(`focusflow-backup-${backupId}`, encryptedData);

      // 更新备份列表
      this.updateBackupList(backupInfo);

      // 更新状态
      this.status.lastBackupTime = Date.now();
      this.status.backupCount += 1;
      this.saveBackupInfo();

      // 清理旧备份
      this.cleanupOldBackups();

      // 通知监听器
      this.notifyListeners();

      return true;
    } catch (error) {
      console.error('Failed to create backup:', error);
      return false;
    }
  }

  /**
   * 生成校验和
   */
  private async generateChecksum(data: string): Promise<string> {
    // 在实际应用中，这里应该使用更安全的哈希算法
    // 这里简化为简单的字符串哈希
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * 更新备份列表
   */
  private updateBackupList(backupInfo: BackupInfo): void {
    try {
      let backupList: BackupInfo[] = [];

      // 加载现有备份列表
      const backupListJson = localStorage.getItem('focusflow-backup-list');
      if (backupListJson) {
        backupList = JSON.parse(backupListJson);
      }

      // 添加新备份
      backupList.push(backupInfo);

      // 按时间戳排序
      backupList.sort((a, b) => b.timestamp - a.timestamp);

      // 保存备份列表
      localStorage.setItem('focusflow-backup-list', JSON.stringify(backupList));
    } catch (error) {
      console.error('Failed to update backup list:', error);
    }
  }

  /**
   * 清理旧备份
   */
  private cleanupOldBackups(): void {
    try {
      // 加载备份列表
      const backupListJson = localStorage.getItem('focusflow-backup-list');
      if (!backupListJson) return;

      const backupList: BackupInfo[] = JSON.parse(backupListJson);

      // 如果备份数量超过最大值，删除最旧的备份
      if (backupList.length > this.config.maxBackups) {
        const backupsToDelete = backupList.splice(this.config.maxBackups);

        // 删除备份数据
        backupsToDelete.forEach(backup => {
          localStorage.removeItem(`focusflow-backup-${backup.id}`);
        });

        // 更新备份列表
        localStorage.setItem('focusflow-backup-list', JSON.stringify(backupList));

        console.log(`Cleaned up ${backupsToDelete.length} old backups`);
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }

  /**
   * 从备份恢复
   */
  async restoreFromBackup(backupId: string): Promise<boolean> {
    try {
      // 加载备份数据
      const encryptedData = localStorage.getItem(`focusflow-backup-${backupId}`);
      if (!encryptedData) {
        console.error('Backup data not found');
        return false;
      }

      // 加载备份信息
      const backupListJson = localStorage.getItem('focusflow-backup-list');
      if (!backupListJson) {
        console.error('Backup list not found');
        return false;
      }

      const backupList: BackupInfo[] = JSON.parse(backupListJson);
      const backupInfo = backupList.find(b => b.id === backupId);

      if (!backupInfo) {
        console.error('Backup info not found');
        return false;
      }

      // 验证校验和
      const checksum = await this.generateChecksum(encryptedData);
      if (checksum !== backupInfo.checksum) {
        console.error('Backup checksum mismatch');
        return false;
      }

      // 解密数据
      const serializedData = backupInfo.encrypted 
        ? await this.decryptData(encryptedData)
        : encryptedData;

      // 解析数据
      const data = JSON.parse(serializedData);

      // 恢复数据
      if (data.timerSettings) {
        localStorage.setItem('focusflow-timer-settings', data.timerSettings);
      }

      if (data.soundSettings) {
        localStorage.setItem('focusflow-sound-settings', data.soundSettings);
      }

      if (data.notificationSettings) {
        localStorage.setItem('focusflow-notification-settings', data.notificationSettings);
      }

      if (data.themeSettings) {
        localStorage.setItem('focusflow-theme-settings', data.themeSettings);
      }

      if (data.stats) {
        localStorage.setItem('focusflow-stats', data.stats);
      }

      if (data.sessions) {
        localStorage.setItem('focusflow-sessions', data.sessions);
      }

      console.log('Data restored from backup successfully');
      return true;
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return false;
    }
  }

  /**
   * 获取备份列表
   */
  getBackupList(): BackupInfo[] {
    try {
      const backupListJson = localStorage.getItem('focusflow-backup-list');
      if (!backupListJson) return [];

      return JSON.parse(backupListJson);
    } catch (error) {
      console.error('Failed to get backup list:', error);
      return [];
    }
  }

  /**
   * 删除备份
   */
  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      // 删除备份数据
      localStorage.removeItem(`focusflow-backup-${backupId}`);

      // 更新备份列表
      const backupListJson = localStorage.getItem('focusflow-backup-list');
      if (backupListJson) {
        const backupList: BackupInfo[] = JSON.parse(backupListJson);
        const updatedList = backupList.filter(b => b.id !== backupId);
        localStorage.setItem('focusflow-backup-list', JSON.stringify(updatedList));

        // 更新状态
        this.status.backupCount = updatedList.length;
        this.saveBackupInfo();

        // 通知监听器
        this.notifyListeners();
      }

      return true;
    } catch (error) {
      console.error('Failed to delete backup:', error);
      return false;
    }
  }

  /**
   * 计算安全评分
   */
  private calculateSecurityScore(): void {
    let score = 50; // 基础分数

    // 加密启用 +20分
    if (this.config.encryptionEnabled) {
      score += 20;
    }

    // 自动备份启用 +15分
    if (this.config.autoBackup) {
      score += 15;
    }

    // 有备份 +10分
    if (this.status.backupCount > 0) {
      score += 10;
    }

    // 最近有备份 +5分
    if (this.status.lastBackupTime) {
      const daysSinceLastBackup = (Date.now() - this.status.lastBackupTime) / (1000 * 60 * 60 * 24);
      if (daysSinceLastBackup < 7) {
        score += 5;
      }
    }

    // 确保分数在0-100范围内
    this.status.securityScore = Math.max(0, Math.min(100, score));
  }

  /**
   * 更新状态
   */
  private updateStatus(updates: Partial<SecurityStatus>): void {
    this.status = { ...this.status, ...updates };
    this.calculateSecurityScore();
    this.notifyListeners();
  }

  /**
   * 通知监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener({ ...this.status });
      } catch (error) {
        console.error('Error in security status listener:', error);
      }
    });
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveConfig();

    // 更新状态
    this.updateStatus({ encryptionEnabled: this.config.encryptionEnabled });

    // 如果自动备份设置改变，更新定时器
    if (config.autoBackup !== undefined) {
      if (config.autoBackup) {
        this.startBackupTimer();
      } else {
        this.stopBackupTimer();
      }
    }
  }

  /**
   * 获取配置
   */
  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  /**
   * 获取状态
   */
  getStatus(): SecurityStatus {
    return { ...this.status };
  }

  /**
   * 添加状态监听器
   */
  addStatusListener(listener: (status: SecurityStatus) => void): () => void {
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
  }

  /**
   * 导出数据
   */
  async exportData(): Promise<string> {
    try {
      // 收集所有数据
      const dataToExport: Record<string, any> = {};

      // 收集所有localStorage数据
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('focusflow-')) {
          dataToExport[key] = localStorage.getItem(key);
        }
      }

      // 序列化数据
      const serializedData = JSON.stringify(dataToExport);

      // 加密数据
      const encryptedData = this.config.encryptionEnabled 
        ? await this.encryptData(serializedData)
        : serializedData;

      return encryptedData;
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }

  /**
   * 导入数据
   */
  async importData(encryptedData: string): Promise<boolean> {
    try {
      // 解密数据
      const serializedData = this.config.encryptionEnabled 
        ? await this.decryptData(encryptedData)
        : encryptedData;

      // 解析数据
      const data = JSON.parse(serializedData);

      // 导入数据
      Object.entries(data).forEach(([key, value]) => {
        if (key.startsWith('focusflow-')) {
          localStorage.setItem(key, value as string);
        }
      });

      // 重新加载备份信息
      this.loadBackupInfo();

      // 通知监听器
      this.notifyListeners();

      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  /**
   * 重置所有数据
   */
  resetAllData(): void {
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
  }

  /**
   * 获取数据统计
   */
  getDataStats(): {
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
}

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
