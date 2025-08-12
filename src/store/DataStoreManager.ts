/**
 * 增强的数据存储管理器
 * 提供状态管理、数据缓存、数据同步和数据持久化功能
 */

import { deepClone, deepMerge, debounce, generateId } from '../utils';

/**
 * 存储类型
 */
export enum StoreType {
  /**
   * 内存存储
   */
  MEMORY = 'memory',
  /**
   * 本地存储
   */
  LOCAL = 'local',
  /**
   * 会话存储
   */
  SESSION = 'session',
  /**
   * 远程存储
   */
  REMOTE = 'remote',
}

/**
 * 存储配置
 */
export interface StoreConfig {
  /**
   * 存储类型
   */
  type: StoreType;
  /**
   * 存储键名
   */
  key?: string;
  /**
   * 是否启用持久化
   */
  persist?: boolean;
  /**
   * 是否启用压缩
   */
  compress?: boolean;
  /**
   * 是否启用加密
   */
  encrypt?: boolean;
  /**
   * 过期时间（毫秒）
   */
  expireTime?: number;
  /**
   * API配置
   */
  apiConfig?: {
    /**
     * 获取数据的API
     */
    getApi?: string;
    /**
     * 更新数据的API
     */
    updateApi?: string;
    /**
     * 删除数据的API
     */
    deleteApi?: string;
  };
}

/**
 * 存储项
 */
export interface StoreItem<T = any> {
  /**
   * 数据
   */
  data: T;
  /**
   * 元数据
   */
  meta?: {
    /**
     * 创建时间
     */
    createdAt?: number;
    /**
     * 更新时间
     */
    updatedAt?: number;
    /**
     * 过期时间
     */
    expireTime?: number;
    /**
     * 版本
     */
    version?: number;
  };
}

/**
 * 存储事件类型
 */
export enum StoreEventType {
  /**
   * 数据变更
   */
  CHANGE = 'change',
  /**
   * 数据清除
   */
  CLEAR = 'clear',
  /**
   * 数据同步开始
   */
  SYNC_START = 'syncStart',
  /**
   * 数据同步成功
   */
  SYNC_SUCCESS = 'syncSuccess',
  /**
   * 数据同步失败
   */
  SYNC_ERROR = 'syncError',
}

/**
 * 存储事件
 */
export interface StoreEvent<T = any> {
  /**
   * 事件类型
   */
  type: StoreEventType;
  /**
   * 键
   */
  key: string;
  /**
   * 旧值
   */
  oldValue?: T;
  /**
   * 新值
   */
  newValue?: T;
  /**
   * 错误信息
   */
  error?: Error;
}

/**
 * 存储管理器选项
 */
export interface DataStoreManagerOptions {
  /**
   * 默认存储配置
   */
  defaultStoreConfig?: StoreConfig;
  /**
   * 是否启用自动同步
   */
  enableAutoSync?: boolean;
  /**
   * 同步间隔（毫秒）
   */
  syncInterval?: number;
  /**
   * 是否启用离线模式
   */
  enableOfflineMode?: boolean;
}

/**
 * 增强的数据存储管理器
 */
export class DataStoreManager {
  private stores: Map<string, {
    config: StoreConfig;
    data: Map<string, StoreItem>;
    listeners: Map<StoreEventType, ((event: StoreEvent) => void)[]>;
  }> = new Map();
  private defaultStoreConfig: StoreConfig;
  private enableAutoSync: boolean;
  private syncInterval: number;
  private enableOfflineMode: boolean;
  private syncIntervalId: NodeJS.Timeout | null = null;
  private pendingChanges: Map<string, Set<string>> = new Map();

  constructor(options: DataStoreManagerOptions = {}) {
    this.defaultStoreConfig = options.defaultStoreConfig || {
      type: StoreType.MEMORY,
      persist: false,
    };
    this.enableAutoSync = options.enableAutoSync ?? false;
    this.syncInterval = options.syncInterval || 5 * 60 * 1000; // 5分钟
    this.enableOfflineMode = options.enableOfflineMode ?? true;

    // 初始化自动同步
    if (this.enableAutoSync) {
      this.startAutoSync();
    }
  }

  /**
   * 开始自动同步
   */
  private startAutoSync(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }

    this.syncIntervalId = setInterval(() => {
      this.syncAllStores();
    }, this.syncInterval);
  }

  /**
   * 停止自动同步
   */
  private stopAutoSync(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }

  /**
   * 获取存储
   */
  private getStore(storeName: string) {
    if (!this.stores.has(storeName)) {
      // 创建存储
      const store = {
        config: { ...this.defaultStoreConfig },
        data: new Map<string, StoreItem>(),
        listeners: new Map<StoreEventType, ((event: StoreEvent) => void)[]>(),
      };

      // 初始化监听器
      for (const eventType of Object.values(StoreEventType)) {
        store.listeners.set(eventType, []);
      }

      this.stores.set(storeName, store);
    }

    return this.stores.get(storeName)!;
  }

  /**
   * 触发存储事件
   */
  private emitStoreEvent<T>(
    storeName: string,
    eventType: StoreEventType,
    key: string,
    oldValue?: T,
    newValue?: T,
    error?: Error
  ): void {
    const store = this.getStore(storeName);
    const listeners = store.listeners.get(eventType) || [];

    const event: StoreEvent<T> = {
      type: eventType,
      key,
      oldValue,
      newValue,
      error,
    };

    // 触发所有监听器
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (err) {
        console.error(`Error in store event listener for "${eventType}" in store "${storeName}":`, err);
      }
    });
  }

  /**
   * 添加待同步项
   */
  private addPendingChange(storeName: string, key: string): void {
    if (!this.pendingChanges.has(storeName)) {
      this.pendingChanges.set(storeName, new Set());
    }
    this.pendingChanges.get(storeName)!.add(key);
  }

  /**
   * 移除待同步项
   */
  private removePendingChange(storeName: string, key: string): void {
    const changes = this.pendingChanges.get(storeName);
    if (changes) {
      changes.delete(key);
      if (changes.size === 0) {
        this.pendingChanges.delete(storeName);
      }
    }
  }

  /**
   * 同步单个存储
   */
  private async syncStore(storeName: string): Promise<void> {
    const store = this.getStore(storeName);
    const { config } = store;

    // 检查是否为远程存储
    if (config.type !== StoreType.REMOTE || !config.apiConfig) {
      return;
    }

    // 获取待同步项
    const pendingKeys = this.pendingChanges.get(storeName);
    if (!pendingKeys || pendingKeys.size === 0) {
      return;
    }

    // 触发同步开始事件
    this.emitStoreEvent(storeName, StoreEventType.SYNC_START, storeName);

    try {
      // 同步数据
      for (const key of pendingKeys) {
        const item = store.data.get(key);
        if (item) {
          // 这里应该调用API同步数据
          // 由于没有具体的API客户端，这里只是模拟
          console.log(`Syncing data for key "${key}" in store "${storeName}"`);
        }
      }

      // 清除待同步项
      this.pendingChanges.delete(storeName);

      // 触发同步成功事件
      this.emitStoreEvent(storeName, StoreEventType.SYNC_SUCCESS, storeName);
    } catch (error) {
      // 触发同步失败事件
      this.emitStoreEvent(
        storeName,
        StoreEventType.SYNC_ERROR,
        storeName,
        undefined,
        undefined,
        error as Error
      );
    }
  }

  /**
   * 同步所有存储
   */
  private async syncAllStores(): Promise<void> {
    // 同步所有有待同步项的存储
    for (const storeName of this.pendingChanges.keys()) {
      await this.syncStore(storeName);
    }
  }

  /**
   * 创建存储
   */
  createStore(storeName: string, config: StoreConfig): void {
    if (this.stores.has(storeName)) {
      throw new Error(`Store "${storeName}" already exists`);
    }

    // 创建存储
    const store = {
      config: { ...this.defaultStoreConfig, ...config },
      data: new Map<string, StoreItem>(),
      listeners: new Map<StoreEventType, ((event: StoreEvent) => void)[]>(),
    };

    // 初始化监听器
    for (const eventType of Object.values(StoreEventType)) {
      store.listeners.set(eventType, []);
    }

    this.stores.set(storeName, store);

    // 如果是本地存储或会话存储，加载数据
    if (config.type === StoreType.LOCAL || config.type === StoreType.SESSION) {
      this.loadFromStorage(storeName);
    }
  }

  /**
   * 从存储加载数据
   */
  private loadFromStorage(storeName: string): void {
    const store = this.getStore(storeName);
    const { config } = store;

    if (config.type !== StoreType.LOCAL && config.type !== StoreType.SESSION) {
      return;
    }

    try {
      const storage = config.type === StoreType.LOCAL ? localStorage : sessionStorage;
      const key = config.key || storeName;
      const dataStr = storage.getItem(key);

      if (dataStr) {
        const data = JSON.parse(dataStr);
        store.data = new Map(Object.entries(data));
      }
    } catch (error) {
      console.error(`Failed to load data from storage for store "${storeName}":`, error);
    }
  }

  /**
   * 保存数据到存储
   */
  private saveToStorage(storeName: string): void {
    const store = this.getStore(storeName);
    const { config } = store;

    if (config.type !== StoreType.LOCAL && config.type !== StoreType.SESSION) {
      return;
    }

    try {
      const storage = config.type === StoreType.LOCAL ? localStorage : sessionStorage;
      const key = config.key || storeName;
      const data = Object.fromEntries(store.data);
      storage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Failed to save data to storage for store "${storeName}":`, error);
    }
  }

  /**
   * 设置数据
   */
  set<T>(storeName: string, key: string, data: T): void {
    const store = this.getStore(storeName);
    const oldValue = store.data.get(key)?.data;
    const now = Date.now();

    // 创建存储项
    const item: StoreItem<T> = {
      data: deepClone(data),
      meta: {
        createdAt: oldValue?.meta?.createdAt || now,
        updatedAt: now,
        expireTime: store.config.expireTime ? now + store.config.expireTime : undefined,
        version: (oldValue?.meta?.version || 0) + 1,
      },
    };

    // 设置数据
    store.data.set(key, item);

    // 保存到存储
    if (store.config.persist) {
      this.saveToStorage(storeName);
    }

    // 添加待同步项
    if (store.config.type === StoreType.REMOTE) {
      this.addPendingChange(storeName, key);
    }

    // 触发变更事件
    this.emitStoreEvent(storeName, StoreEventType.CHANGE, key, oldValue, data);
  }

  /**
   * 获取数据
   */
  get<T>(storeName: string, key: string): T | undefined {
    const store = this.getStore(storeName);
    const item = store.data.get(key);

    if (!item) {
      return undefined;
    }

    // 检查是否过期
    if (item.meta?.expireTime && Date.now() > item.meta.expireTime) {
      store.data.delete(key);
      if (store.config.persist) {
        this.saveToStorage(storeName);
      }
      return undefined;
    }

    return deepClone(item.data);
  }

  /**
   * 删除数据
   */
  delete(storeName: string, key: string): boolean {
    const store = this.getStore(storeName);
    const item = store.data.get(key);

    if (!item) {
      return false;
    }

    const oldValue = item.data;
    store.data.delete(key);

    // 保存到存储
    if (store.config.persist) {
      this.saveToStorage(storeName);
    }

    // 添加待同步项
    if (store.config.type === StoreType.REMOTE) {
      this.addPendingChange(storeName, key);
    }

    // 触发变更事件
    this.emitStoreEvent(storeName, StoreEventType.CHANGE, key, oldValue, undefined);

    return true;
  }

  /**
   * 清除存储
   */
  clear(storeName: string): void {
    const store = this.getStore(storeName);
    store.data.clear();

    // 保存到存储
    if (store.config.persist) {
      this.saveToStorage(storeName);
    }

    // 清除待同步项
    this.pendingChanges.delete(storeName);

    // 触发清除事件
    this.emitStoreEvent(storeName, StoreEventType.CLEAR, storeName);
  }

  /**
   * 获取所有数据
   */
  getAll<T>(storeName: string): Record<string, T> {
    const store = this.getStore(storeName);
    const result: Record<string, T> = {};
    const now = Date.now();

    store.data.forEach((item, key) => {
      // 检查是否过期
      if (item.meta?.expireTime && now > item.meta.expireTime) {
        store.data.delete(key);
      } else {
        result[key] = deepClone(item.data);
      }
    });

    // 如果有数据被删除，保存到存储
    if (store.config.persist && store.data.size !== Object.keys(result).length) {
      this.saveToStorage(storeName);
    }

    return result;
  }

  /**
   * 检查是否存在
   */
  has(storeName: string, key: string): boolean {
    const store = this.getStore(storeName);
    const item = store.data.get(key);

    if (!item) {
      return false;
    }

    // 检查是否过期
    if (item.meta?.expireTime && Date.now() > item.meta.expireTime) {
      store.data.delete(key);
      if (store.config.persist) {
        this.saveToStorage(storeName);
      }
      return false;
    }

    return true;
  }

  /**
   * 获取存储大小
   */
  size(storeName: string): number {
    const store = this.getStore(storeName);
    const now = Date.now();

    // 清理过期数据
    store.data.forEach((item, key) => {
      if (item.meta?.expireTime && now > item.meta.expireTime) {
        store.data.delete(key);
      }
    });

    // 如果有数据被删除，保存到存储
    if (store.config.persist) {
      this.saveToStorage(storeName);
    }

    return store.data.size;
  }

  /**
   * 订阅存储事件
   */
  subscribe(
    storeName: string,
    eventType: StoreEventType,
    listener: (event: StoreEvent) => void
  ): () => void {
    const store = this.getStore(storeName);
    const listeners = store.listeners.get(eventType) || [];
    listeners.push(listener);

    // 返回取消订阅函数
    return () => {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    };
  }

  /**
   * 同步存储
   */
  async sync(storeName?: string): Promise<void> {
    if (storeName) {
      await this.syncStore(storeName);
    } else {
      await this.syncAllStores();
    }
  }

  /**
   * 销毁存储管理器
   */
  destroy(): void {
    // 停止自动同步
    this.stopAutoSync();

    // 清除所有存储
    this.stores.clear();
    this.pendingChanges.clear();
  }
}

/**
 * 创建数据存储管理器
 */
export function createDataStoreManager(options: DataStoreManagerOptions = {}): DataStoreManager {
  return new DataStoreManager(options);
}
