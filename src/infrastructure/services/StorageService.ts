/**
 * 存储服务实现
 * 处理应用数据的本地存储
 */

import { IStorageService } from './ServiceInterfaces';

// 本地存储服务实现
export class LocalStorageService implements IStorageService {
  private initialized = false;
  private storage: Storage;

  constructor() {
    this.storage = window.localStorage;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 检查localStorage是否可用
      const testKey = '__storage_test__';
      this.storage.setItem(testKey, 'test');
      this.storage.removeItem(testKey);

      this.initialized = true;
      console.log('LocalStorage service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize LocalStorage service:', error);
      throw new Error('LocalStorage is not available');
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const serializedValue = JSON.stringify(value);
      this.storage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`Failed to set item ${key}:`, error);
      throw error;
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const item = this.storage.getItem(key);
      if (item === null) {
        return null;
      }

      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Failed to get item ${key}:`, error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      this.storage.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  }

  async getAllKeys(): Promise<string[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const keys: string[] = [];
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key) {
          keys.push(key);
        }
      }
      return keys;
    } catch (error) {
      console.error('Failed to get all keys:', error);
      throw error;
    }
  }
}

// 内存存储服务实现（用于测试或不支持localStorage的环境）
export class MemoryStorageService implements IStorageService {
  private initialized = false;
  private storage: Map<string, string> = new Map();

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    console.log('MemoryStorage service initialized successfully');
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const serializedValue = JSON.stringify(value);
      this.storage.set(key, serializedValue);
    } catch (error) {
      console.error(`Failed to set item ${key}:`, error);
      throw error;
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const item = this.storage.get(key);
      if (item === undefined) {
        return null;
      }

      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Failed to get item ${key}:`, error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      this.storage.delete(key);
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      this.storage.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  }

  async getAllKeys(): Promise<string[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      return Array.from(this.storage.keys());
    } catch (error) {
      console.error('Failed to get all keys:', error);
      throw error;
    }
  }
}

// 保持向后兼容的StorageService（使用LocalStorageService作为默认实现）
export class StorageService extends LocalStorageService {
  // 继承LocalStorageService的所有功能
}