/**
 * 数据持久化管理器
 * 提供自动保存、恢复、版本控制和数据迁移功能
 */

import { StateStorage } from 'zustand/middleware';

// 数据版本信息
interface DataVersion {
  version: string;
  timestamp: number;
  description: string;
}

// 持久化配置
interface PersistenceConfig {
  key: string;
  version: string;
  storage: StateStorage;
  migrate?: (persistedState: any, version: string) => any;
  merge?: (persistedState: any, currentState: any) => any;
  partialize?: (state: any) => any;
  onRehydrateStorage?: (state: any) => void;
  serialize?: (state: any) => string;
  deserialize?: (str: string) => any;
  autoSave: boolean;
  autoSaveInterval: number; // ms
  maxBackups: number;
  compression: boolean;
}

// 备份数据结构
interface BackupData {
  id: string;
  timestamp: number;
  version: string;
  data: any;
  size: number;
  description?: string;
}

// 数据迁移规则
interface MigrationRule {
  fromVersion: string;
  toVersion: string;
  migrate: (data: any) => any;
  description: string;
}

class PersistenceManager {
  private config: PersistenceConfig;
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private migrationRules: MigrationRule[] = [];
  private backups: BackupData[] = [];

  constructor(config: PersistenceConfig) {
    this.config = config;
    this.loadBackups();
    
    if (config.autoSave) {
      this.startAutoSave();
    }
  }

  // 保存状态
  async saveState(state: any): Promise<void> {
    try {
      const startTime = performance.now();
      
      // 部分化状态（只保存需要的部分）
      const stateToSave = this.config.partialize ? this.config.partialize(state) : state;
      
      // 添加版本信息
      const versionedState = {
        ...stateToSave,
        __version: this.config.version,
        __timestamp: Date.now(),
        __checksum: this.generateChecksum(stateToSave)
      };

      // 序列化
      const serializedState = this.config.serialize 
        ? this.config.serialize(versionedState)
        : JSON.stringify(versionedState);

      // 压缩（如果启用）
      const finalData = this.config.compression 
        ? await this.compress(serializedState)
        : serializedState;

      // 保存到存储
      await this.config.storage.setItem(this.config.key, finalData);

      const endTime = performance.now();
      console.log(`State saved in ${endTime - startTime}ms`);

      // 创建备份
      await this.createBackup(versionedState);

    } catch (error) {
      console.error('Failed to save state:', error);
      throw error;
    }
  }

  // 加载状态
  async loadState(): Promise<any | null> {
    try {
      const startTime = performance.now();
      
      // 从存储加载
      const rawData = await this.config.storage.getItem(this.config.key);
      if (!rawData) {
        return null;
      }

      // 解压缩（如果需要）
      const serializedState = this.config.compression 
        ? await this.decompress(rawData)
        : rawData;

      // 反序列化
      const parsedState = this.config.deserialize 
        ? this.config.deserialize(serializedState)
        : JSON.parse(serializedState);

      // 验证数据完整性
      if (!this.validateData(parsedState)) {
        console.warn('Data validation failed, attempting to restore from backup');
        return await this.restoreFromBackup();
      }

      // 检查版本并迁移
      const migratedState = await this.migrateIfNeeded(parsedState);

      // 合并状态（如果有自定义合并逻辑）
      const finalState = this.config.merge 
        ? this.config.merge(migratedState, {})
        : migratedState;

      const endTime = performance.now();
      console.log(`State loaded in ${endTime - startTime}ms`);

      // 触发重新水化回调
      if (this.config.onRehydrateStorage) {
        this.config.onRehydrateStorage(finalState);
      }

      return finalState;

    } catch (error) {
      console.error('Failed to load state:', error);
      
      // 尝试从备份恢复
      try {
        return await this.restoreFromBackup();
      } catch (backupError) {
        console.error('Failed to restore from backup:', backupError);
        return null;
      }
    }
  }

  // 添加迁移规则
  addMigrationRule(rule: MigrationRule): void {
    this.migrationRules.push(rule);
    // 按版本排序
    this.migrationRules.sort((a, b) => a.fromVersion.localeCompare(b.fromVersion));
  }

  // 数据迁移
  private async migrateIfNeeded(state: any): Promise<any> {
    const currentVersion = state.__version || '1.0.0';
    
    if (currentVersion === this.config.version) {
      return state;
    }

    console.log(`Migrating data from version ${currentVersion} to ${this.config.version}`);

    let migratedState = { ...state };
    let currentMigrationVersion = currentVersion;

    // 应用迁移规则
    for (const rule of this.migrationRules) {
      if (rule.fromVersion === currentMigrationVersion) {
        console.log(`Applying migration: ${rule.description}`);
        migratedState = rule.migrate(migratedState);
        currentMigrationVersion = rule.toVersion;
        
        // 如果达到目标版本，停止迁移
        if (currentMigrationVersion === this.config.version) {
          break;
        }
      }
    }

    // 更新版本信息
    migratedState.__version = this.config.version;
    migratedState.__timestamp = Date.now();

    // 保存迁移后的状态
    await this.saveState(migratedState);

    return migratedState;
  }

  // 创建备份
  private async createBackup(state: any): Promise<void> {
    try {
      const backup: BackupData = {
        id: `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        version: this.config.version,
        data: state,
        size: JSON.stringify(state).length,
        description: `Auto backup at ${new Date().toLocaleString()}`
      };

      this.backups.push(backup);

      // 限制备份数量
      if (this.backups.length > this.config.maxBackups) {
        this.backups = this.backups
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, this.config.maxBackups);
      }

      // 保存备份列表
      await this.saveBackups();

    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  }

  // 从备份恢复
  private async restoreFromBackup(): Promise<any | null> {
    if (this.backups.length === 0) {
      return null;
    }

    // 获取最新的有效备份
    const latestBackup = this.backups
      .sort((a, b) => b.timestamp - a.timestamp)
      .find(backup => this.validateData(backup.data));

    if (!latestBackup) {
      return null;
    }

    console.log(`Restoring from backup: ${latestBackup.description}`);
    return latestBackup.data;
  }

  // 保存备份列表
  private async saveBackups(): Promise<void> {
    try {
      const backupKey = `${this.config.key}_backups`;
      const backupData = JSON.stringify(this.backups);
      await this.config.storage.setItem(backupKey, backupData);
    } catch (error) {
      console.error('Failed to save backups:', error);
    }
  }

  // 加载备份列表
  private async loadBackups(): Promise<void> {
    try {
      const backupKey = `${this.config.key}_backups`;
      const backupData = await this.config.storage.getItem(backupKey);
      
      if (backupData) {
        this.backups = JSON.parse(backupData);
      }
    } catch (error) {
      console.error('Failed to load backups:', error);
      this.backups = [];
    }
  }

  // 数据验证
  private validateData(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // 检查必要字段
    if (!data.__version || !data.__timestamp) {
      return false;
    }

    // 验证校验和（如果存在）
    if (data.__checksum) {
      const { __checksum, ...stateWithoutChecksum } = data;
      const calculatedChecksum = this.generateChecksum(stateWithoutChecksum);
      if (calculatedChecksum !== __checksum) {
        console.warn('Data checksum mismatch');
        return false;
      }
    }

    return true;
  }

  // 生成校验和
  private generateChecksum(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(36);
  }

  // 压缩数据
  private async compress(data: string): Promise<string> {
    // 简单的压缩实现（实际项目中可以使用更好的压缩算法）
    try {
      if (typeof CompressionStream !== 'undefined') {
        const stream = new CompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(new TextEncoder().encode(data));
        writer.close();
        
        const chunks: Uint8Array[] = [];
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            chunks.push(value);
          }
        }
        
        const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          compressed.set(chunk, offset);
          offset += chunk.length;
        }
        
        return btoa(String.fromCharCode(...compressed));
      }
    } catch (error) {
      console.warn('Compression failed, using uncompressed data:', error);
    }
    
    return data;
  }

  // 解压缩数据
  private async decompress(data: string): Promise<string> {
    try {
      if (typeof DecompressionStream !== 'undefined') {
        const compressed = Uint8Array.from(atob(data), c => c.charCodeAt(0));
        const stream = new DecompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(compressed);
        writer.close();
        
        const chunks: Uint8Array[] = [];
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            chunks.push(value);
          }
        }
        
        const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          decompressed.set(chunk, offset);
          offset += chunk.length;
        }
        
        return new TextDecoder().decode(decompressed);
      }
    } catch (error) {
      console.warn('Decompression failed, treating as uncompressed data:', error);
    }
    
    return data;
  }

  // 开始自动保存
  private startAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = setInterval(() => {
      // 这里需要从外部获取当前状态
      // 实际实现中会通过回调或其他方式获取
      console.log('Auto save triggered');
    }, this.config.autoSaveInterval);
  }

  // 停止自动保存
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  // 清理数据
  async clearData(): Promise<void> {
    try {
      await this.config.storage.removeItem(this.config.key);
      await this.config.storage.removeItem(`${this.config.key}_backups`);
      this.backups = [];
      console.log('Data cleared successfully');
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw error;
    }
  }

  // 导出数据
  async exportData(): Promise<string> {
    const state = await this.loadState();
    if (!state) {
      throw new Error('No data to export');
    }

    const exportData = {
      version: this.config.version,
      timestamp: Date.now(),
      data: state,
      backups: this.backups
    };

    return JSON.stringify(exportData, null, 2);
  }

  // 导入数据
  async importData(importedData: string): Promise<void> {
    try {
      const parsedData = JSON.parse(importedData);
      
      if (!parsedData.data) {
        throw new Error('Invalid import data format');
      }

      // 创建当前数据的备份
      const currentState = await this.loadState();
      if (currentState) {
        await this.createBackup(currentState);
      }

      // 导入新数据
      await this.saveState(parsedData.data);

      // 导入备份（如果存在）
      if (parsedData.backups && Array.isArray(parsedData.backups)) {
        this.backups = [...this.backups, ...parsedData.backups];
        await this.saveBackups();
      }

      console.log('Data imported successfully');
    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    }
  }

  // 获取存储统计信息
  async getStorageStats(): Promise<{
    totalSize: number;
    backupCount: number;
    lastSaved: number;
    version: string;
  }> {
    const state = await this.loadState();
    const totalSize = state ? JSON.stringify(state).length : 0;

    return {
      totalSize,
      backupCount: this.backups.length,
      lastSaved: state?.__timestamp || 0,
      version: state?.__version || 'unknown'
    };
  }

  // 获取备份列表
  getBackups(): BackupData[] {
    return [...this.backups].sort((a, b) => b.timestamp - a.timestamp);
  }

  // 删除指定备份
  async deleteBackup(backupId: string): Promise<void> {
    this.backups = this.backups.filter(backup => backup.id !== backupId);
    await this.saveBackups();
  }

  // 从指定备份恢复
  async restoreFromSpecificBackup(backupId: string): Promise<void> {
    const backup = this.backups.find(b => b.id === backupId);
    if (!backup) {
      throw new Error('Backup not found');
    }

    await this.saveState(backup.data);
    console.log(`Restored from backup: ${backup.description}`);
  }

  // 销毁管理器
  destroy(): void {
    this.stopAutoSave();
  }
}

// 创建默认的localStorage适配器
export const createLocalStorageAdapter = (): StateStorage => ({
  getItem: async (name: string) => {
    try {
      return localStorage.getItem(name);
    } catch (error) {
      console.error('Failed to get item from localStorage:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      console.error('Failed to set item in localStorage:', error);
      throw error;
    }
  },
  removeItem: async (name: string) => {
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.error('Failed to remove item from localStorage:', error);
      throw error;
    }
  }
});

// 创建IndexedDB适配器
export const createIndexedDBAdapter = (dbName: string = 'focusflow-db', storeName: string = 'timer-store'): StateStorage => {
  let db: IDBDatabase | null = null;

  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      if (db) {
        resolve(db);
        return;
      }

      const request = indexedDB.open(dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        db = request.result;
        resolve(db);
      };
      
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName);
        }
      };
    });
  };

  return {
    getItem: async (name: string) => {
      try {
        const database = await openDB();
        const transaction = database.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        
        return new Promise((resolve, reject) => {
          const request = store.get(name);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result || null);
        });
      } catch (error) {
        console.error('Failed to get item from IndexedDB:', error);
        return null;
      }
    },
    
    setItem: async (name: string, value: string) => {
      try {
        const database = await openDB();
        const transaction = database.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        return new Promise<void>((resolve, reject) => {
          const request = store.put(value, name);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve();
        });
      } catch (error) {
        console.error('Failed to set item in IndexedDB:', error);
        throw error;
      }
    },
    
    removeItem: async (name: string) => {
      try {
        const database = await openDB();
        const transaction = database.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        return new Promise<void>((resolve, reject) => {
          const request = store.delete(name);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve();
        });
      } catch (error) {
        console.error('Failed to remove item from IndexedDB:', error);
        throw error;
      }
    }
  };
};

export { PersistenceManager };
export type { PersistenceConfig, BackupData, MigrationRule };