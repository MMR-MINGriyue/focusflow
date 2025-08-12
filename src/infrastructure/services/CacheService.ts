/**
 * 缓存服务
 * 提供数据缓存功能，提高访问效率
 */

import { container } from '../../container/IoCContainer';

/**
 * 缓存项接口
 */
export interface CacheItem<T = any> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

/**
 * 缓存配置接口
 */
export interface CacheConfig {
  defaultTTL: number; // 默认过期时间（毫秒）
  maxSize: number; // 最大缓存项数
  cleanupInterval: number; // 清理间隔（毫秒）
}

/**
 * 缓存服务接口
 */
export interface CacheService {
  /**
   * 设置缓存
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 过期时间（毫秒），可选，默认使用配置中的值
   */
  set<T>(key: string, value: T, ttl?: number): void;

  /**
   * 获取缓存
   * @param key 缓存键
   * @returns 缓存值，如果不存在或已过期则返回null
   */
  get<T>(key: string): T | null;

  /**
   * 删除缓存
   * @param key 缓存键
   */
  delete(key: string): boolean;

  /**
   * 检查缓存是否存在
   * @param key 缓存键
   */
  has(key: string): boolean;

  /**
   * 清空所有缓存
   */
  clear(): void;

  /**
   * 获取缓存大小
   */
  size(): number;

  /**
   * 获取所有缓存键
   */
  keys(): string[];

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    hits: number;
    misses: number;
    size: number;
  };
}

/**
 * 缓存服务实现
 */
export class CacheServiceImpl implements CacheService {
  private cache: Map<string, CacheItem> = new Map();
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
  };
  private cleanupTimer: number | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 60000, // 默认1分钟
      maxSize: 100, // 默认最大100项
      cleanupInterval: 60000, // 默认1分钟清理一次
      ...config,
    };

    // 启动清理定时器
    this.startCleanupTimer();
  }

  set<T>(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.config.defaultTTL);

    // 检查缓存大小限制
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      // 如果达到最大大小，删除最旧的项
      this.evictOldest();
    }

    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: now,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      this.stats.misses++;
      return null;
    }

    // 检查是否过期
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return item.value;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  has(key: string): boolean {
    const item = this.cache.get(key);

    if (!item) {
      return false;
    }

    // 检查是否过期
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    // 清理过期项
    this.cleanup();
    return this.cache.size;
  }

  keys(): string[] {
    // 清理过期项
    this.cleanup();
    return Array.from(this.cache.keys());
  }

  getStats() {
    return {
      ...this.stats,
      size: this.size(),
    };
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    if (typeof window !== 'undefined') {
      this.cleanupTimer = window.setInterval(() => {
        this.cleanup();
      }, this.config.cleanupInterval);
    }
  }

  /**
   * 清理过期项
   */
  private cleanup(): void {
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 删除最旧的项
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (item.createdAt < oldestTime) {
        oldestTime = item.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * 停止清理定时器
   */
  stop(): void {
    if (this.cleanupTimer !== null) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

/**
 * 带有缓存的仓储装饰器
 * 用于为仓储方法添加缓存功能
 */
export function Cached<T extends { new(...args: any[]): any }>(
  cacheKeyPrefix: string,
  ttl: number = 60000
) {
  return function (target: T) {
    const cacheService = container.resolve<CacheService>('cacheService');

    // 为原型上的所有方法添加缓存
    const prototype = target.prototype;
    const propertyNames = Object.getOwnPropertyNames(prototype);

    for (const name of propertyNames) {
      if (name !== 'constructor' && typeof prototype[name] === 'function') {
        const originalMethod = prototype[name];

        prototype[name] = function (...args: any[]) {
          // 生成缓存键
          const cacheKey = `${cacheKeyPrefix}.${name}.${JSON.stringify(args)}`;

          // 尝试从缓存获取
          const cachedResult = cacheService.get(cacheKey);
          if (cachedResult !== null) {
            return cachedResult;
          }

          // 调用原始方法
          const result = originalMethod.apply(this, args);

          // 处理Promise结果
          if (result instanceof Promise) {
            return result
              .then((value: any) => {
                cacheService.set(cacheKey, value, ttl);
                return value;
              })
              .catch((error: any) => {
                throw error;
              });
          } else {
            // 缓存结果
            cacheService.set(cacheKey, result, ttl);
            return result;
          }
        };
      }
    }

    return target;
  };
}
