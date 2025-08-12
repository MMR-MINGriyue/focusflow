/**
 * 样式计算缓存工具
 * 
 * 优化TimerDisplay组件的样式计算性能，通过缓存避免重复计算
 * 预期性能提升：2-5ms per render
 */

import { TimerStyleConfig } from '../types/timerStyle';
import { timerStyleService as timerStyleServiceInstance } from '../services/timerStyle';

// 缓存项接口
interface CacheItem {
  style: TimerStyleConfig;
  timestamp: number;
  accessCount: number;
}

// 缓存统计信息
interface CacheStats {
  hits: number;
  misses: number;
  totalRequests: number;
  hitRate: number;
  cacheSize: number;
  maxSize: number;
  // lastCleanup?: number;
}

/**
 * 样式缓存管理器
 */
class StyleCache {
  // 缓存存储
  private cache: Map<string, CacheItem> = new Map();
  
  // 缓存统计
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
    hitRate: 0,
    cacheSize: 0,
    maxSize: 100
  };
  
  // TTL配置
  // private ttl = 5 * 60 * 1000; // 5分钟TTL
  
  // 最大缓存大小
  private maxSize = 100;

  /**
   * 根据状态调整样式
   */
  private applyStateAdjustments(baseStyle: TimerStyleConfig, state: 'focus' | 'break' | 'microBreak'): TimerStyleConfig {
    // 深拷贝基础样式
    const adjustedStyle: TimerStyleConfig = JSON.parse(JSON.stringify(baseStyle));
    
    // 根据状态调整颜色
    switch (state) {
      case 'focus':
        // 专注状态使用主要颜色
        if (adjustedStyle.colors.focus) {
          adjustedStyle.colors.primary = adjustedStyle.colors.focus;
        }
        break;
        
      case 'break':
        // 休息状态使用次要颜色
        if (adjustedStyle.colors.break) {
          adjustedStyle.colors.primary = adjustedStyle.colors.break;
        }
        break;
        
      case 'microBreak':
        // 微休息状态使用特殊颜色
        if (adjustedStyle.colors.microBreak) {
          adjustedStyle.colors.primary = adjustedStyle.colors.microBreak;
        }
        break;
    }
    
    return adjustedStyle;
  }

  /**
   * 根据状态和样式ID获取样式（带缓存）
   */
  getStyleForState(state: 'focus' | 'break' | 'microBreak', currentStyleId?: string): TimerStyleConfig {
    const now = Date.now();
    this.stats.totalRequests++;
    
    const cacheKey = this.generateCacheKey(state, currentStyleId || 'current');
    
    // 检查缓存
    const cached = this.cache.get(cacheKey);
    if (cached && this.isValidCacheItem(cached)) {
      // 缓存命中，更新访问统计
      this.stats.hits++;
      cached.accessCount++;
      cached.timestamp = now; // 更新时间戳
      this.updateHitRate();
      return cached.style;
    }
    
    // 缓存未命中，计算新样式
    this.stats.misses++;
    const styleService = timerStyleServiceInstance;
    const currentStyle = currentStyleId 
      ? styleService.getStyleForState(state) // 根据状态获取样式
      : styleService.getCurrentStyle();
      
    // 应用状态特定的样式调整
    const adjustedStyle = this.applyStateAdjustments(currentStyle, state);
    
    // 更新缓存
    this.setCacheItem(cacheKey, adjustedStyle);
    
    this.stats.cacheSize = this.cache.size;
    this.updateHitRate();
    
    return adjustedStyle;
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(state: string, styleId: string): string {
    return `${state}:${styleId}`;
  }

  /**
   * 检查缓存项是否有效
   */
  private isValidCacheItem(item: CacheItem): boolean {
    const now = Date.now();
    // 使用固定时间值 5 分钟（300000毫秒）判断缓存有效性
    return (now - item.timestamp) < 300000;
  }

  /**
   * 设置缓存项
   */
  private setCacheItem(key: string, style: TimerStyleConfig): void {
    const now = Date.now();
    this.cache.set(key, {
      style: style,
      timestamp: now,
      accessCount: 1
    });
  }

  /**
   * 清理最少使用的缓存项
   */
  private evictLeastUsed(): void {
    let leastUsedKey = '';
    let leastAccessCount = Infinity;
    let oldestTimestamp = Infinity;

    for (const [key, item] of this.cache.entries()) {
      // 优先清理访问次数最少的，其次清理最旧的
      if (item.accessCount < leastAccessCount || 
          (item.accessCount === leastAccessCount && item.timestamp < oldestTimestamp)) {
        leastUsedKey = key;
        leastAccessCount = item.accessCount;
        oldestTimestamp = item.timestamp;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }

  /**
   * 更新命中率
   */
  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? (this.stats.hits / this.stats.totalRequests) * 100 
      : 0;
  }

  /**
   * 使缓存失效
   */
  invalidate(styleId?: string, state?: string): void {
    if (!styleId && !state) {
      // 清空所有缓存
      this.cache.clear();
      this.stats.cacheSize = 0;
      console.debug('StyleCache: All cache invalidated');
      return;
    }

    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      const shouldDelete = 
        (styleId && key.includes(styleId)) ||
        (state && key.includes(state));
      
      if (shouldDelete) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    this.stats.cacheSize = this.cache.size;

    if (keysToDelete.length > 0) {
      console.debug(`StyleCache: Invalidated ${keysToDelete.length} items for styleId=${styleId}, state=${state}`);
    }
  }

  /**
   * 预热缓存
   */
  warmup(): void {
    const states: Array<'focus' | 'break' | 'microBreak'> = ['focus', 'break', 'microBreak'];
    const timerStyleService = timerStyleServiceInstance;
    const currentStyleId = timerStyleService.getSettings().currentStyleId;

    console.debug('StyleCache: Warming up cache...');

    states.forEach(state => {
      this.getStyleForState(state, currentStyleId);
    });

    console.debug('StyleCache: Cache warmup completed');
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      hitRate: 0,
      cacheSize: this.cache.size,
      maxSize: this.maxSize
      // lastCleanup: Date.now()
    };
  }

  /**
   * 配置缓存参数
   */
  configure(options: {
    maxSize?: number;
    // ttl?: number;
  }): void {
    if (options.maxSize !== undefined) {
      this.maxSize = Math.max(1, options.maxSize);
    }
    
    // if (options.ttl !== undefined) {
    //   this.ttl = Math.max(1000, options.ttl); // 最小1秒
    // }

    // 如果新的maxSize小于当前缓存大小，清理多余项
    while (this.cache.size > this.maxSize) {
      this.evictLeastUsed();
    }

    this.stats.cacheSize = this.cache.size;
    this.stats.maxSize = this.maxSize;
  }

  /**
   * 获取缓存详细信息（调试用）
   */
  getDebugInfo(): {
    stats: CacheStats;
    cacheKeys: string[];
    cacheItems: Array<{
      key: string;
      styleId: string;
      timestamp: number;
      accessCount: number;
      age: number;
    }>;
  } {
    const now = Date.now();
    const cacheItems = Array.from(this.cache.entries()).map(([key, item]) => ({
      key,
      styleId: item.style.id,
      timestamp: item.timestamp,
      accessCount: item.accessCount,
      age: now - item.timestamp
    }));

    return {
      stats: this.getStats(),
      cacheKeys: Array.from(this.cache.keys()),
      cacheItems
    };
  }
}

// 创建全局缓存实例
export const styleCache = new StyleCache();

// 监听样式服务变化，自动清理缓存
const timerStyleService = timerStyleServiceInstance;
timerStyleService.addListener(() => {
  styleCache.invalidate();
});

// 开发环境下暴露到全局对象，便于调试
if (process.env.NODE_ENV === 'development') {
  (window as any).styleCache = styleCache;
}

export default styleCache;