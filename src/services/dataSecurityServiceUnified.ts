/**
 * 数据安全服务 - 整合版
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

/**
 * 数据安全服务类
 * 提供数据加密、备份和恢复功能
 */
class DataSecurityService {
  private config: SecurityConfig;
  private backupList: BackupInfo[] = [];
  private encryptionKey: string | null = null;
  private isInitialized = false;

  constructor() {
    // 默认配置
    this.config = {
      encryptionEnabled: true,
      autoBackup: true,
      backupInterval: 24, // 24小时
      maxBackups: 5,
      backupLocation: 'local',
    };
  }

  /**
   * 初始化安全服务
   * @param config 安全配置
   * @returns Promise<void>
   */
  async initialize(config?: Partial<SecurityConfig>): Promise<void> {
    if (this.isInitialized) return;

    // 应用配置
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // 从本地存储加载配置
    const savedConfig = localStorage.getItem('focusflow-security-config');
    if (savedConfig) {
      try {
        this.config = { ...this.config, ...JSON.parse(savedConfig) };
      } catch (error) {
        console.warn('Failed to parse saved security config:', error);
      }
    }

    // 从本地存储加载备份列表
    const savedBackups = localStorage.getItem('focusflow-backups');
    if (savedBackups) {
      try {
        this.backupList = JSON.parse(savedBackups);
      } catch (error) {
        console.warn('Failed to parse saved backups:', error);
      }
    }

    // 加载或生成加密密钥
    await this.loadOrGenerateEncryptionKey();

    // 设置自动备份
    if (this.config.autoBackup) {
      this.setupAutoBackup();
    }

    this.isInitialized = true;
  }

  /**
   * 加载或生成加密密钥
   */
  private async loadOrGenerateEncryptionKey(): Promise<void> {
    // 尝试从本地存储加载密钥
    const savedKey = localStorage.getItem('focusflow-encryption-key');
    if (savedKey) {
      this.encryptionKey = savedKey;
      return;
    }

    // 生成新密钥
    this.encryptionKey = await this.generateEncryptionKey();
    localStorage.setItem('focusflow-encryption-key', this.encryptionKey);
  }

  /**
   * 生成加密密钥
   * @returns Promise<string> 加密密钥
   */
  private async generateEncryptionKey(): Promise<string> {
    // 使用Web Crypto API生成随机密钥
    const array = new Uint32Array(8);
    window.crypto.getRandomValues(array);
    return Array.from(array, dec => dec.toString(16).padStart(8, '0')).join('');
  }

  /**
   * 设置自动备份
   */
  private setupAutoBackup(): void {
    // 计算下次备份时间
    const nextBackupTime = this.calculateNextBackupTime();

    // 设置定时器
    setTimeout(() => {
      this.createBackup().catch(error => {
        console.error('Auto backup failed:', error);
      });

      // 设置下一次备份
      this.setupAutoBackup();
    }, nextBackupTime - Date.now());
  }

  /**
   * 计算下次备份时间
   * @returns 下次备份时间戳
   */
  private calculateNextBackupTime(): number {
    const now = Date.now();
    const nextBackup = now + (this.config.backupInterval * 60 * 60 * 1000);
    return nextBackup;
  }

  /**
   * 获取安全配置
   * @returns 安全配置
   */
  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  /**
   * 更新安全配置
   * @param config 新的安全配置
   * @returns Promise<void>
   */
  async updateConfig(config: Partial<SecurityConfig>): Promise<void> {
    this.config = { ...this.config, ...config };

    // 保存配置到本地存储
    localStorage.setItem('focusflow-security-config', JSON.stringify(this.config));

    // 如果启用了自动备份，重新设置定时器
    if (this.config.autoBackup) {
      this.setupAutoBackup();
    }
  }

  /**
   * 获取安全状态
   * @returns 安全状态
   */
  getSecurityStatus(): SecurityStatus {
    return {
      encryptionEnabled: this.config.encryptionEnabled,
      lastBackupTime: this.backupList.length > 0 ? Math.max(...this.backupList.map(b => b.timestamp)) : null,
      backupCount: this.backupList.length,
      securityScore: this.calculateSecurityScore(),
    };
  }

  /**
   * 计算安全评分
   * @returns 安全评分（0-100）
   */
  private calculateSecurityScore(): number {
    let score = 50; // 基础分

    // 加密加分
    if (this.config.encryptionEnabled) {
      score += 20;
    }

    // 自动备份加分
    if (this.config.autoBackup) {
      score += 15;
    }

    // 备份数量加分
    if (this.backupList.length >= 3) {
      score += 10;
    } else if (this.backupList.length >= 1) {
      score += 5;
    }

    // 备份间隔加分
    if (this.config.backupInterval <= 12) {
      score += 5;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * 创建备份
   * @returns Promise<BackupInfo> 备份信息
   */
  async createBackup(): Promise<BackupInfo> {
    try {
      // 收集需要备份的数据
      const backupData = await this.collectBackupData();

      // 计算校验和
      const checksum = await this.calculateChecksum(backupData);

      // 创建备份信息
      const backupInfo: BackupInfo = {
        id: `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        size: JSON.stringify(backupData).length,
        encrypted: this.config.encryptionEnabled,
        checksum,
        version: '1.0.0',
      };

      // 加密数据
      let encryptedData = backupData;
      if (this.config.encryptionEnabled) {
        encryptedData = await this.encryptData(backupData);
      }

      // 保存备份
      const backupKey = `focusflow-backup-${backupInfo.id}`;
      localStorage.setItem(backupKey, JSON.stringify(encryptedData));

      // 更新备份列表
      this.backupList.push(backupInfo);

      // 限制备份数量
      if (this.backupList.length > this.config.maxBackups) {
        // 删除最旧的备份
        const oldestBackup = this.backupList.shift();
        if (oldestBackup) {
          const oldestBackupKey = `focusflow-backup-${oldestBackup.id}`;
          localStorage.removeItem(oldestBackupKey);
        }
      }

      // 保存备份列表
      localStorage.setItem('focusflow-backups', JSON.stringify(this.backupList));

      return backupInfo;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * 收集需要备份的数据
   * @returns Promise<any> 备份数据
   */
  private async collectBackupData(): Promise<any> {
    const data: any = {};

    // 收集设置数据
    const settings = localStorage.getItem('pomodoro_settings');
    if (settings) {
      data.settings = JSON.parse(settings);
    }

    // 收集统计数据
    const stats = localStorage.getItem('pomodoro_stats');
    if (stats) {
      data.stats = JSON.parse(stats);
    }

    // 收集主题设置
    const themeSettings = localStorage.getItem('focusflow-theme-settings');
    if (themeSettings) {
      data.themeSettings = themeSettings;
    }

    // 收集会话数据
    const sessions = localStorage.getItem('focusflow-sessions');
    if (sessions) {
      data.sessions = sessions;
    }

    return data;
  }

  /**
   * 计算数据校验和
   * @param data 数据
   * @returns Promise<string> 校验和
   */
  private async calculateChecksum(data: any): Promise<string> {
    const dataString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const buffer = encoder.encode(dataString);

    // 使用Web Crypto API计算SHA-256哈希
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
  }

  /**
   * 加密数据
   * @param data 要加密的数据
   * @returns Promise<any> 加密后的数据
   */
  private async encryptData(data: any): Promise<any> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not available');
    }

    // 简单的XOR加密（实际应用中应使用更强大的加密算法）
    const dataString = JSON.stringify(data);
    const keyBytes = new TextEncoder().encode(this.encryptionKey);
    const dataBytes = new TextEncoder().encode(dataString);

    // 执行XOR加密
    const encryptedBytes = new Uint8Array(dataBytes.length);
    for (let i = 0; i < dataBytes.length; i++) {
      encryptedBytes[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    // 转换为Base64字符串
    return btoa(String.fromCharCode(...encryptedBytes));
  }

  /**
   * 解密数据
   * @param encryptedData 加密的数据
   * @returns Promise<any> 解密后的数据
   */
  private async decryptData(encryptedData: any): Promise<any> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not available');
    }

    // 从Base64字符串转换回Uint8Array
    const encryptedBytes = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );

    const keyBytes = new TextEncoder().encode(this.encryptionKey);

    // 执行XOR解密
    const decryptedBytes = new Uint8Array(encryptedBytes.length);
    for (let i = 0; i < encryptedBytes.length; i++) {
      decryptedBytes[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    // 转换为字符串并解析JSON
    const decryptedString = new TextDecoder().decode(decryptedBytes);
    return JSON.parse(decryptedString);
  }

  /**
   * 获取备份列表
   * @returns 备份信息数组
   */
  getBackupList(): BackupInfo[] {
    return [...this.backupList];
  }

  /**
   * 从备份恢复
   * @param backupId 备份ID
   * @returns Promise<boolean> 是否恢复成功
   */
  async restoreFromBackup(backupId: string): Promise<boolean> {
    try {
      // 查找备份
      const backup = this.backupList.find(b => b.id === backupId);
      if (!backup) {
        throw new Error(`Backup with ID "${backupId}" not found`);
      }

      // 获取备份数据
      const backupKey = `focusflow-backup-${backupId}`;
      const encryptedData = localStorage.getItem(backupKey);
      if (!encryptedData) {
        throw new Error(`Backup data for ID "${backupId}" not found`);
      }

      // 解密数据
      let data: any;
      if (backup.encrypted) {
        data = await this.decryptData(encryptedData);
      } else {
        data = JSON.parse(encryptedData);
      }

      // 验证校验和
      const calculatedChecksum = await this.calculateChecksum(data);
      if (calculatedChecksum !== backup.checksum) {
        throw new Error('Backup data integrity check failed');
      }

      // 恢复数据
      if (data.settings) {
        localStorage.setItem('pomodoro_settings', JSON.stringify(data.settings));
      }

      if (data.stats) {
        localStorage.setItem('pomodoro_stats', JSON.stringify(data.stats));
      }

      if (data.themeSettings) {
        localStorage.setItem('focusflow-theme-settings', data.themeSettings);
      }

      if (data.sessions) {
        localStorage.setItem('focusflow-sessions', data.sessions);
      }

      return true;
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      throw error;
    }
  }

  /**
   * 删除备份
   * @param backupId 备份ID
   * @returns Promise<boolean> 是否删除成功
   */
  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      // 查找备份索引
      const backupIndex = this.backupList.findIndex(b => b.id === backupId);
      if (backupIndex === -1) {
        throw new Error(`Backup with ID "${backupId}" not found`);
      }

      // 删除备份数据
      const backupKey = `focusflow-backup-${backupId}`;
      localStorage.removeItem(backupKey);

      // 更新备份列表
      this.backupList.splice(backupIndex, 1);
      localStorage.setItem('focusflow-backups', JSON.stringify(this.backupList));

      return true;
    } catch (error) {
      console.error('Failed to delete backup:', error);
      throw error;
    }
  }

  /**
   * 清理安全服务
   */
  cleanup(): void {
    // 清理定时器等资源
    // 这里可以添加其他清理逻辑
  }
}

// 创建单例实例
export const dataSecurityServiceUnified = new DataSecurityService();

// 导出服务类（用于测试）
export { DataSecurityService };
