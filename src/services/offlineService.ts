/**
 * 离线服务
 * 提供离线模式支持，让用户在没有网络的情况下也能使用基本功能
 */

export interface OfflineConfig {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number; // 同步间隔（分钟）
  maxOfflineData: number; // 最大离线数据量（MB）
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: number | null;
  pendingSyncItems: number;
  syncInProgress: boolean;
  syncError: string | null;
}

export interface OfflineDataItem {
  id: string;
  type: 'session' | 'settings' | 'stats' | 'achievement';
  data: any;
  timestamp: number;
  synced: boolean;
}

class OfflineService {
  private config: OfflineConfig = {
    enabled: true,
    autoSync: true,
    syncInterval: 15, // 15分钟
    maxOfflineData: 50 // 50MB
  };

  private status: SyncStatus = {
    isOnline: navigator.onLine,
    lastSyncTime: null,
    pendingSyncItems: 0,
    syncInProgress: false,
    syncError: null
  };

  private dataQueue: OfflineDataItem[] = [];
  private syncTimer: number | null = null;
  private listeners: Array<(status: SyncStatus) => void> = [];

  constructor() {
    this.initialize();
  }

  /**
   * 初始化离线服务
   */
  private initialize(): void {
    // 加载配置
    this.loadConfig();

    // 加载离线数据
    this.loadOfflineData();

    // 监听网络状态变化
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // 如果启用了自动同步，启动同步定时器
    if (this.config.enabled && this.config.autoSync) {
      this.startSyncTimer();
    }

    // 初始同步状态检查
    this.updateOnlineStatus();
  }

  /**
   * 加载配置
   */
  private loadConfig(): void {
    try {
      const savedConfig = localStorage.getItem('focusflow-offline-config');
      if (savedConfig) {
        this.config = { ...this.config, ...JSON.parse(savedConfig) };
      }
    } catch (error) {
      console.error('Failed to load offline config:', error);
    }
  }

  /**
   * 保存配置
   */
  private saveConfig(): void {
    try {
      localStorage.setItem('focusflow-offline-config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save offline config:', error);
    }
  }

  /**
   * 加载离线数据
   */
  private loadOfflineData(): void {
    try {
      const savedData = localStorage.getItem('focusflow-offline-data');
      if (savedData) {
        this.dataQueue = JSON.parse(savedData);
        this.updateStatus({ pendingSyncItems: this.dataQueue.filter(item => !item.synced).length });
      }
    } catch (error) {
      console.error('Failed to load offline data:', error);
      this.dataQueue = [];
    }
  }

  /**
   * 保存离线数据
   */
  private saveOfflineData(): void {
    try {
      localStorage.setItem('focusflow-offline-data', JSON.stringify(this.dataQueue));
    } catch (error) {
      console.error('Failed to save offline data:', error);

      // 如果存储失败，尝试清理旧数据
      this.cleanupOldData();
      try {
        localStorage.setItem('focusflow-offline-data', JSON.stringify(this.dataQueue));
      } catch (retryError) {
        console.error('Failed to save offline data after cleanup:', retryError);
      }
    }
  }

  /**
   * 清理旧数据
   */
  private cleanupOldData(): void {
    // 按时间戳排序，保留最新的数据
    this.dataQueue.sort((a, b) => b.timestamp - a.timestamp);

    // 计算当前数据大小
    let totalSize = 0;
    const itemsToKeep: OfflineDataItem[] = [];

    for (const item of this.dataQueue) {
      const itemSize = JSON.stringify(item).length;
      if (totalSize + itemSize <= this.config.maxOfflineData * 1024 * 1024) {
        totalSize += itemSize;
        itemsToKeep.push(item);
      } else {
        break;
      }
    }

    this.dataQueue = itemsToKeep;
    console.log(`Cleaned up old offline data, kept ${itemsToKeep.length} items`);
  }

  /**
   * 处理在线状态
   */
  private handleOnline(): void {
    this.updateOnlineStatus();

    // 如果有未同步的数据，立即尝试同步
    if (this.dataQueue.some(item => !item.synced)) {
      this.syncData();
    }
  }

  /**
   * 处理离线状态
   */
  private handleOffline(): void {
    this.updateOnlineStatus();
  }

  /**
   * 更新在线状态
   */
  private updateOnlineStatus(): void {
    const isOnline = navigator.onLine;
    this.updateStatus({ isOnline });
  }

  /**
   * 启动同步定时器
   */
  private startSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = window.setInterval(() => {
      if (this.status.isOnline && this.dataQueue.some(item => !item.synced)) {
        this.syncData();
      }
    }, this.config.syncInterval * 60 * 1000);
  }

  /**
   * 停止同步定时器
   */
  private stopSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * 更新状态
   */
  private updateStatus(updates: Partial<SyncStatus>): void {
    this.status = { ...this.status, ...updates };
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
        console.error('Error in offline status listener:', error);
      }
    });
  }

  /**
   * 添加离线数据项
   */
  addOfflineItem(type: OfflineDataItem['type'], data: any): string {
    const id = `offline_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const item: OfflineDataItem = {
      id,
      type,
      data,
      timestamp: Date.now(),
      synced: false
    };

    this.dataQueue.push(item);
    this.saveOfflineData();
    this.updateStatus({ pendingSyncItems: this.dataQueue.filter(i => !i.synced).length });

    // 如果在线，尝试立即同步
    if (this.status.isOnline && !this.status.syncInProgress) {
      this.syncData();
    }

    return id;
  }

  /**
   * 同步数据
   */
  async syncData(): Promise<boolean> {
    if (this.status.syncInProgress || !this.status.isOnline) {
      return false;
    }

    const unsyncedItems = this.dataQueue.filter(item => !item.synced);
    if (unsyncedItems.length === 0) {
      return true;
    }

    this.updateStatus({ syncInProgress: true, syncError: null });

    try {
      // 这里应该是实际的数据同步逻辑
      // 为了示例，我们只是模拟同步过程
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 标记所有未同步项为已同步
      unsyncedItems.forEach(item => {
        item.synced = true;
      });

      this.saveOfflineData();
      this.updateStatus({ 
        syncInProgress: false, 
        lastSyncTime: Date.now(),
        pendingSyncItems: this.dataQueue.filter(i => !i.synced).length
      });

      return true;
    } catch (error) {
      console.error('Failed to sync offline data:', error);
      this.updateStatus({ 
        syncInProgress: false, 
        syncError: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<OfflineConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveConfig();

    // 如果自动同步设置改变，更新定时器
    if (config.autoSync !== undefined) {
      if (config.autoSync) {
        this.startSyncTimer();
      } else {
        this.stopSyncTimer();
      }
    }
  }

  /**
   * 获取配置
   */
  getConfig(): OfflineConfig {
    return { ...this.config };
  }

  /**
   * 获取状态
   */
  getStatus(): SyncStatus {
    return { ...this.status };
  }

  /**
   * 添加状态监听器
   */
  addStatusListener(listener: (status: SyncStatus) => void): () => void {
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
   * 清除所有离线数据
   */
  clearAllData(): void {
    this.dataQueue = [];
    this.saveOfflineData();
    this.updateStatus({ pendingSyncItems: 0 });
  }

  /**
   * 获取离线数据统计
   */
  getDataStats(): {
    totalItems: number;
    unsyncedItems: number;
    dataSize: number;
    oldestItem: number | null;
    newestItem: number | null;
  } {
    const totalItems = this.dataQueue.length;
    const unsyncedItems = this.dataQueue.filter(item => !item.synced).length;

    // 计算数据大小
    const dataSize = new Blob([JSON.stringify(this.dataQueue)]).size;

    // 获取最旧和最新项目的时间戳
    const timestamps = this.dataQueue.map(item => item.timestamp);
    const oldestItem = timestamps.length > 0 ? Math.min(...timestamps) : null;
    const newestItem = timestamps.length > 0 ? Math.max(...timestamps) : null;

    return {
      totalItems,
      unsyncedItems,
      dataSize,
      oldestItem,
      newestItem
    };
  }
}

// 创建单例实例
let offlineServiceInstance: OfflineService | null = null;

export const getOfflineService = (): OfflineService => {
  if (!offlineServiceInstance) {
    offlineServiceInstance = new OfflineService();
  }
  return offlineServiceInstance;
};

// 向后兼容
export const offlineService = getOfflineService();
