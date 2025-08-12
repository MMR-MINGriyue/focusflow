/**
 * Web数据同步服务
 * 处理Web环境下的数据存储和同步
 */

import { getDatabaseService } from './database';

// 定义数据同步接口
interface DataSyncService {
  // 数据存储
  saveData: (key: string, data: any) => Promise<void>;
  loadData: (key: string) => Promise<any>;
  removeData: (key: string) => Promise<void>;

  // 会话管理
  saveSession: (session: any) => Promise<void>;
  loadSessions: (days?: number) => Promise<any[]>;
  updateSession: (id: number, data: any) => Promise<void>;
  deleteSession: (id: number) => Promise<void>;

  // 设置管理
  saveSettings: (settings: any) => Promise<void>;
  loadSettings: () => Promise<any>;

  // 统计数据
  saveStats: (stats: any) => Promise<void>;
  loadStats: (days?: number) => Promise<any>;

  // 同步状态
  getSyncStatus: () => Promise<{ lastSync: Date | null; isOnline: boolean }>;
  forceSync: () => Promise<void>;
}

// 定义同步状态
interface SyncStatus {
  lastSync: Date | null;
  isOnline: boolean;
  pendingChanges: number;
}

// Web数据同步服务实现
class WebDataSyncService implements DataSyncService {
  private dbService: any;
  private syncStatus: SyncStatus = {
    lastSync: null,
    isOnline: navigator.onLine,
    pendingChanges: 0
  };

  // 存储键前缀
  private readonly STORAGE_PREFIX = 'focusflow_';
  private readonly SESSIONS_KEY = `${this.STORAGE_PREFIX}sessions`;
  private readonly SETTINGS_KEY = `${this.STORAGE_PREFIX}settings`;
  private readonly STATS_KEY = `${this.STORAGE_PREFIX}stats`;

  constructor() {
    this.dbService = getDatabaseService();
    this.initializeEventListeners();
  }

  /**
   * 初始化事件监听器
   */
  private initializeEventListeners(): void {
    // 监听在线状态变化
    window.addEventListener('online', () => {
      this.syncStatus.isOnline = true;
      this.trySyncPendingChanges();
    });

    window.addEventListener('offline', () => {
      this.syncStatus.isOnline = false;
    });

    // 监听存储事件（用于多标签页同步）
    window.addEventListener('storage', (event) => {
      if (event.key && event.key.startsWith(this.STORAGE_PREFIX)) {
        // 可以在这里添加处理逻辑，例如更新UI
        console.log('Storage changed:', event.key);
      }
    });
  }

  /**
   * 保存数据到本地存储
   */
  async saveData(key: string, data: any): Promise<void> {
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(key, serializedData);

      // 如果在线，尝试同步到服务器
      if (this.syncStatus.isOnline) {
        await this.syncToServer(key, data);
      } else {
        this.syncStatus.pendingChanges++;
      }
    } catch (error) {
      console.error('Failed to save data:', error);
      throw error;
    }
  }

  /**
   * 从本地存储加载数据
   */
  async loadData(key: string): Promise<any> {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load data:', error);
      throw error;
    }
  }

  /**
   * 从本地存储删除数据
   */
  async removeData(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);

      // 如果在线，尝试从服务器删除
      if (this.syncStatus.isOnline) {
        await this.deleteFromServer(key);
      } else {
        this.syncStatus.pendingChanges++;
      }
    } catch (error) {
      console.error('Failed to remove data:', error);
      throw error;
    }
  }

  /**
   * 保存会话
   */
  async saveSession(session: any): Promise<void> {
    try {
      // 获取现有会话
      const sessions = await this.loadSessions() || [];

      // 添加新会话
      sessions.push({
        ...session,
        id: Date.now(), // 简单的ID生成
        createdAt: new Date().toISOString()
      });

      // 保存回本地存储
      await this.saveData(this.SESSIONS_KEY, sessions);

      // 同时保存到数据库
      await this.dbService.saveSession(session);
    } catch (error) {
      console.error('Failed to save session:', error);
      throw error;
    }
  }

  /**
   * 加载会话
   */
  async loadSessions(days: number = 7): Promise<any[]> {
    try {
      const sessions = await this.loadData(this.SESSIONS_KEY) || [];

      // 如果指定了天数，过滤会话
      if (days > 0) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return sessions.filter((session: any) => {
          const sessionDate = new Date(session.createdAt || session.startTime);
          return sessionDate >= cutoffDate;
        });
      }

      return sessions;
    } catch (error) {
      console.error('Failed to load sessions:', error);
      throw error;
    }
  }

  /**
   * 更新会话
   */
  async updateSession(id: number, data: any): Promise<void> {
    try {
      const sessions = await this.loadSessions() || [];
      const index = sessions.findIndex((session: any) => session.id === id);

      if (index !== -1) {
        sessions[index] = { ...sessions[index], ...data };
        await this.saveData(this.SESSIONS_KEY, sessions);

        // 同时更新数据库
        await this.dbService.updateSession(id, data);
      } else {
        throw new Error(`Session with ID ${id} not found`);
      }
    } catch (error) {
      console.error('Failed to update session:', error);
      throw error;
    }
  }

  /**
   * 删除会话
   */
  async deleteSession(id: number): Promise<void> {
    try {
      const sessions = await this.loadSessions() || [];
      const filteredSessions = sessions.filter((session: any) => session.id !== id);

      await this.saveData(this.SESSIONS_KEY, filteredSessions);

      // 同时从数据库删除
      await this.dbService.deleteSession(id);
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw error;
    }
  }

  /**
   * 保存设置
   */
  async saveSettings(settings: any): Promise<void> {
    try {
      await this.saveData(this.SETTINGS_KEY, settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  /**
   * 加载设置
   */
  async loadSettings(): Promise<any> {
    try {
      return await this.loadData(this.SETTINGS_KEY) || {};
    } catch (error) {
      console.error('Failed to load settings:', error);
      throw error;
    }
  }

  /**
   * 保存统计数据
   */
  async saveStats(stats: any): Promise<void> {
    try {
      await this.saveData(this.STATS_KEY, stats);
    } catch (error) {
      console.error('Failed to save stats:', error);
      throw error;
    }
  }

  /**
   * 加载统计数据
   */
  async loadStats(days: number = 7): Promise<any> {
    try {
      const allStats = await this.loadData(this.STATS_KEY) || {};

      // 如果指定了天数，过滤统计数据
      if (days > 0) {
        const filteredStats: any = {};
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        Object.keys(allStats).forEach(date => {
          const statDate = new Date(date);
          if (statDate >= cutoffDate) {
            filteredStats[date] = allStats[date];
          }
        });

        return filteredStats;
      }

      return allStats;
    } catch (error) {
      console.error('Failed to load stats:', error);
      throw error;
    }
  }

  /**
   * 获取同步状态
   */
  async getSyncStatus(): Promise<{ lastSync: Date | null; isOnline: boolean }> {
    return {
      lastSync: this.syncStatus.lastSync,
      isOnline: this.syncStatus.isOnline
    };
  }

  /**
   * 强制同步
   */
  async forceSync(): Promise<void> {
    if (!this.syncStatus.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    try {
      // 同步所有数据
      await this.syncAllData();

      // 更新同步状态
      this.syncStatus.lastSync = new Date();
      this.syncStatus.pendingChanges = 0;
    } catch (error) {
      console.error('Failed to force sync:', error);
      throw error;
    }
  }

  /**
   * 尝试同步待处理的更改
   */
  private async trySyncPendingChanges(): Promise<void> {
    if (this.syncStatus.pendingChanges > 0) {
      try {
        await this.syncAllData();
        this.syncStatus.pendingChanges = 0;
      } catch (error) {
        console.error('Failed to sync pending changes:', error);
      }
    }
  }

  /**
   * 同步所有数据到服务器
   */
  private async syncAllData(): Promise<void> {
    // 这里可以实现与服务器同步的逻辑
    // 例如，将本地存储的所有数据同步到云端

    // 更新同步时间
    this.syncStatus.lastSync = new Date();

    // 这里可以添加实际的同步逻辑
    console.log('Syncing all data to server...');
  }

  /**
   * 同步单个数据项到服务器
   */
  private async syncToServer(key: string, data: any): Promise<void> {
    // 这里可以实现与服务器同步单个数据项的逻辑
    console.log(`Syncing ${key} to server...`);
  }

  /**
   * 从服务器删除数据
   */
  private async deleteFromServer(key: string): Promise<void> {
    // 这里可以实现从服务器删除数据的逻辑
    console.log(`Deleting ${key} from server...`);
  }
}

// 创建单例实例
let webDataSyncServiceInstance: WebDataSyncService | null = null;

/**
 * 获取Web数据同步服务实例
 */
export const getWebDataSyncService = (): DataSyncService => {
  if (!webDataSyncServiceInstance) {
    webDataSyncServiceInstance = new WebDataSyncService();
  }
  return webDataSyncServiceInstance;
};

export default WebDataSyncService;
