/**
 * 离线数据同步管理器
 * 处理离线状态下的数据同步和冲突解决
 */

// 同步状态类型
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'conflict';

// 数据操作类型
export type OperationType = 'create' | 'update' | 'delete';

// 同步操作记录
interface SyncOperation {
  id: string;
  type: OperationType;
  entityType: string;
  entityId: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

// 冲突解决策略
export type ConflictResolutionStrategy = 
  | 'client-wins'    // 客户端优先
  | 'server-wins'    // 服务器优先
  | 'last-write-wins' // 最后写入优先
  | 'manual'         // 手动解决
  | 'merge';         // 智能合并

// 冲突数据
interface ConflictData {
  id: string;
  entityType: string;
  entityId: string;
  clientData: any;
  serverData: any;
  clientTimestamp: number;
  serverTimestamp: number;
  strategy: ConflictResolutionStrategy;
}

// 同步配置
interface SyncConfig {
  enabled: boolean;
  syncInterval: number; // ms
  retryInterval: number; // ms
  maxRetries: number;
  batchSize: number;
  conflictResolution: ConflictResolutionStrategy;
  autoResolveConflicts: boolean;
  syncOnConnect: boolean;
  syncOnVisibilityChange: boolean;
}

// 网络状态监听器
class NetworkMonitor {
  private isOnline: boolean = navigator.onLine;
  private listeners: Array<(online: boolean) => void> = [];

  constructor() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.notifyListeners(true);
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.notifyListeners(false);
  };

  private handleVisibilityChange = () => {
    if (!document.hidden && this.isOnline) {
      this.notifyListeners(true);
    }
  };

  private notifyListeners(online: boolean) {
    this.listeners.forEach(listener => listener(online));
  }

  addListener(listener: (online: boolean) => void) {
    this.listeners.push(listener);
  }

  removeListener(listener: (online: boolean) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  getStatus(): boolean {
    return this.isOnline;
  }

  destroy() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }
}

// 离线同步管理器
export class OfflineSyncManager {
  private config: SyncConfig;
  private pendingOperations: SyncOperation[] = [];
  private conflicts: ConflictData[] = [];
  private syncTimer: NodeJS.Timeout | null = null;
  private retryTimer: NodeJS.Timeout | null = null;
  private networkMonitor: NetworkMonitor;
  private status: SyncStatus = 'idle';
  private listeners: Array<(status: SyncStatus) => void> = [];

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = {
      enabled: true,
      syncInterval: 30000, // 30 seconds
      retryInterval: 5000,  // 5 seconds
      maxRetries: 3,
      batchSize: 10,
      conflictResolution: 'last-write-wins',
      autoResolveConflicts: true,
      syncOnConnect: true,
      syncOnVisibilityChange: true,
      ...config
    };

    this.networkMonitor = new NetworkMonitor();
    this.networkMonitor.addListener(this.handleNetworkChange);

    this.loadPendingOperations();
    this.startSyncTimer();
  }

  // 网络状态变化处理
  private handleNetworkChange = (online: boolean) => {
    if (online && this.config.syncOnConnect) {
      console.log('Network reconnected, starting sync...');
      this.sync();
    }
  };

  // 添加同步操作
  addOperation(
    type: OperationType,
    entityType: string,
    entityId: string,
    data: any
  ): void {
    if (!this.config.enabled) return;

    const operation: SyncOperation = {
      id: `${type}_${entityType}_${entityId}_${Date.now()}`,
      type,
      entityType,
      entityId,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.config.maxRetries
    };

    this.pendingOperations.push(operation);
    this.savePendingOperations();

    console.log(`Added ${type} operation for ${entityType}:${entityId}`);

    // 如果在线，立即尝试同步
    if (this.networkMonitor.getStatus()) {
      this.sync();
    }
  }

  // 执行同步
  async sync(): Promise<void> {
    if (!this.config.enabled || !this.networkMonitor.getStatus()) {
      return;
    }

    if (this.status === 'syncing') {
      console.log('Sync already in progress');
      return;
    }

    this.setStatus('syncing');

    try {
      await this.processPendingOperations();
      await this.resolveConflicts();
      this.setStatus('idle');
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      this.setStatus('error');
      this.scheduleRetry();
    }
  }

  // 处理待同步操作
  private async processPendingOperations(): Promise<void> {
    if (this.pendingOperations.length === 0) {
      return;
    }

    // 按批次处理操作
    const batches = this.chunkArray(this.pendingOperations, this.config.batchSize);

    for (const batch of batches) {
      try {
        await this.processBatch(batch);
      } catch (error) {
        console.error('Batch processing failed:', error);
        // 增加重试次数
        batch.forEach(op => {
          op.retryCount++;
          if (op.retryCount >= op.maxRetries) {
            console.error(`Operation ${op.id} exceeded max retries, removing`);
            this.removePendingOperation(op.id);
          }
        });
        throw error;
      }
    }
  }

  // 处理单个批次
  private async processBatch(batch: SyncOperation[]): Promise<void> {
    const promises = batch.map(operation => this.processOperation(operation));
    const results = await Promise.allSettled(promises);

    results.forEach((result, index) => {
      const operation = batch[index];
      
      if (result.status === 'fulfilled') {
        console.log(`Operation ${operation.id} completed successfully`);
        this.removePendingOperation(operation.id);
      } else {
        console.error(`Operation ${operation.id} failed:`, result.reason);
        
        // 检查是否是冲突错误
        if (this.isConflictError(result.reason)) {
          this.handleConflict(operation, result.reason);
        }
      }
    });
  }

  // 处理单个操作
  private async processOperation(operation: SyncOperation): Promise<any> {
    // 这里应该调用实际的API
    // 为了示例，我们模拟API调用
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 模拟随机成功/失败
        if (Math.random() > 0.1) { // 90% 成功率
          resolve({ success: true, data: operation.data });
        } else {
          reject(new Error('Simulated API error'));
        }
      }, 100);
    });
  }

  // 检查是否是冲突错误
  private isConflictError(error: any): boolean {
    // 检查错误类型，判断是否是数据冲突
    return error?.code === 'CONFLICT' || error?.status === 409;
  }

  // 处理冲突
  private handleConflict(operation: SyncOperation, error: any): void {
    const conflict: ConflictData = {
      id: `conflict_${operation.id}`,
      entityType: operation.entityType,
      entityId: operation.entityId,
      clientData: operation.data,
      serverData: error.serverData,
      clientTimestamp: operation.timestamp,
      serverTimestamp: error.serverTimestamp,
      strategy: this.config.conflictResolution
    };

    this.conflicts.push(conflict);
    this.setStatus('conflict');

    if (this.config.autoResolveConflicts) {
      this.resolveConflict(conflict.id);
    }
  }

  // 解决冲突
  async resolveConflict(conflictId: string): Promise<void> {
    const conflict = this.conflicts.find(c => c.id === conflictId);
    if (!conflict) {
      console.error(`Conflict ${conflictId} not found`);
      return;
    }

    let resolvedData: any;

    switch (conflict.strategy) {
      case 'client-wins':
        resolvedData = conflict.clientData;
        break;
      
      case 'server-wins':
        resolvedData = conflict.serverData;
        break;
      
      case 'last-write-wins':
        resolvedData = conflict.clientTimestamp > conflict.serverTimestamp
          ? conflict.clientData
          : conflict.serverData;
        break;
      
      case 'merge':
        resolvedData = this.mergeData(conflict.clientData, conflict.serverData);
        break;
      
      case 'manual':
        // 等待手动解决
        return;
      
      default:
        resolvedData = conflict.clientData;
    }

    try {
      // 应用解决方案
      await this.applyResolution(conflict, resolvedData);
      
      // 移除冲突
      this.conflicts = this.conflicts.filter(c => c.id !== conflictId);
      
      console.log(`Conflict ${conflictId} resolved using ${conflict.strategy} strategy`);
      
      // 如果没有更多冲突，更新状态
      if (this.conflicts.length === 0) {
        this.setStatus('idle');
      }
    } catch (error) {
      console.error(`Failed to resolve conflict ${conflictId}:`, error);
    }
  }

  // 智能合并数据
  private mergeData(clientData: any, serverData: any): any {
    // 简单的合并策略，实际项目中可能需要更复杂的逻辑
    if (typeof clientData === 'object' && typeof serverData === 'object') {
      return {
        ...serverData,
        ...clientData,
        // 保留服务器的时间戳字段
        createdAt: serverData.createdAt,
        updatedAt: Math.max(clientData.updatedAt || 0, serverData.updatedAt || 0)
      };
    }
    
    return clientData;
  }

  // 应用冲突解决方案
  private async applyResolution(conflict: ConflictData, resolvedData: any): Promise<void> {
    // 这里应该调用API来应用解决方案
    console.log(`Applying resolution for ${conflict.entityType}:${conflict.entityId}`, resolvedData);
  }

  // 手动解决冲突
  async manualResolveConflict(conflictId: string, resolvedData: any): Promise<void> {
    const conflict = this.conflicts.find(c => c.id === conflictId);
    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found`);
    }

    await this.applyResolution(conflict, resolvedData);
    this.conflicts = this.conflicts.filter(c => c.id !== conflictId);

    if (this.conflicts.length === 0) {
      this.setStatus('idle');
    }
  }

  // 工具方法：数组分块
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // 移除待同步操作
  private removePendingOperation(operationId: string): void {
    this.pendingOperations = this.pendingOperations.filter(op => op.id !== operationId);
    this.savePendingOperations();
  }

  // 保存待同步操作到本地存储
  private savePendingOperations(): void {
    try {
      localStorage.setItem('focusflow_pending_operations', JSON.stringify(this.pendingOperations));
    } catch (error) {
      console.error('Failed to save pending operations:', error);
    }
  }

  // 从本地存储加载待同步操作
  private loadPendingOperations(): void {
    try {
      const saved = localStorage.getItem('focusflow_pending_operations');
      if (saved) {
        this.pendingOperations = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load pending operations:', error);
      this.pendingOperations = [];
    }
  }

  // 设置同步状态
  private setStatus(status: SyncStatus): void {
    this.status = status;
    this.notifyListeners(status);
  }

  // 通知状态监听器
  private notifyListeners(status: SyncStatus): void {
    this.listeners.forEach(listener => listener(status));
  }

  // 开始同步定时器
  private startSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (this.networkMonitor.getStatus()) {
        this.sync();
      }
    }, this.config.syncInterval);
  }

  // 调度重试
  private scheduleRetry(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }

    this.retryTimer = setTimeout(() => {
      if (this.networkMonitor.getStatus()) {
        this.sync();
      }
    }, this.config.retryInterval);
  }

  // 公共API方法
  addStatusListener(listener: (status: SyncStatus) => void): void {
    this.listeners.push(listener);
  }

  removeStatusListener(listener: (status: SyncStatus) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  getStatus(): SyncStatus {
    return this.status;
  }

  getPendingOperationsCount(): number {
    return this.pendingOperations.length;
  }

  getConflictsCount(): number {
    return this.conflicts.length;
  }

  getConflicts(): ConflictData[] {
    return [...this.conflicts];
  }

  isOnline(): boolean {
    return this.networkMonitor.getStatus();
  }

  // 强制同步
  forcSync(): Promise<void> {
    return this.sync();
  }

  // 清除所有待同步操作
  clearPendingOperations(): void {
    this.pendingOperations = [];
    this.savePendingOperations();
  }

  // 更新配置
  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.syncInterval) {
      this.startSyncTimer();
    }
  }

  // 销毁管理器
  destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
    
    this.networkMonitor.destroy();
  }
}

// React Hook for offline sync
export const useOfflineSync = (config?: Partial<SyncConfig>) => {
  const [syncManager] = React.useState(() => new OfflineSyncManager(config));
  const [status, setStatus] = React.useState<SyncStatus>(syncManager.getStatus());
  const [isOnline, setIsOnline] = React.useState(syncManager.isOnline());

  React.useEffect(() => {
    const handleStatusChange = (newStatus: SyncStatus) => setStatus(newStatus);
    const handleNetworkChange = (online: boolean) => setIsOnline(online);

    syncManager.addStatusListener(handleStatusChange);
    
    return () => {
      syncManager.removeStatusListener(handleStatusChange);
      syncManager.destroy();
    };
  }, [syncManager]);

  return {
    status,
    isOnline,
    pendingCount: syncManager.getPendingOperationsCount(),
    conflictsCount: syncManager.getConflictsCount(),
    conflicts: syncManager.getConflicts(),
    addOperation: syncManager.addOperation.bind(syncManager),
    sync: syncManager.forcSync.bind(syncManager),
    resolveConflict: syncManager.manualResolveConflict.bind(syncManager),
    clearPending: syncManager.clearPendingOperations.bind(syncManager)
  };
};

export default OfflineSyncManager;