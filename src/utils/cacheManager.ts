// 高性能缓存管理系统
// 包含LRU缓存、预测性缓存和压缩存储

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
  size: number;
  priority: number;
}

export interface CacheConfig {
  maxSize: number;
  maxAge: number;
  compressionEnabled: boolean;
  predictionEnabled: boolean;
  cleanupInterval: number;
}

export interface CacheStats {
  hitCount: number;
  missCount: number;
  evictionCount: number;
  totalSize: number;
  compressionRatio: number;
  predictionAccuracy: number;
}

export class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private accessOrder: string[] = [];
  private stats: CacheStats = {
    hitCount: 0,
    missCount: 0,
    evictionCount: 0,
    totalSize: 0,
    compressionRatio: 0,
    predictionAccuracy: 0,
  };

  constructor(private config: CacheConfig) {
    this.startCleanupInterval();
  }

  public set(key: string, value: T, priority: number = 1): void {
    const size = this.calculateSize(value);
    
    // 如果已存在，先删除旧条目
    if (this.cache.has(key)) {
      this.remove(key);
    }

    // 检查是否需要清理空间
    while (this.stats.totalSize + size > this.config.maxSize && this.cache.size > 0) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      value: this.config.compressionEnabled ? this.compress(value) : value,
      timestamp: Date.now(),
      accessCount: 0,
      size,
      priority,
    };

    this.cache.set(key, entry);
    this.accessOrder.push(key);
    this.stats.totalSize += size;

    // 触发预测性缓存
    if (this.config.predictionEnabled) {
      this.predictNextKeys(key);
    }
  }

  public get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.missCount++;
      return undefined;
    }

    // 检查是否过期
    if (Date.now() - entry.timestamp > this.config.maxAge) {
      this.remove(key);
      this.stats.missCount++;
      return undefined;
    }

    // 更新访问统计和顺序
    entry.accessCount++;
    this.updateAccessOrder(key);
    this.stats.hitCount++;

    const value = this.config.compressionEnabled ? this.decompress(entry.value) : entry.value;
    return value;
  }

  public has(key: string): boolean {
    return this.cache.has(key) && (Date.now() - this.cache.get(key)!.timestamp <= this.config.maxAge);
  }

  public remove(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.removeFromAccessOrder(key);
    this.stats.totalSize -= entry.size;
    return true;
  }

  public clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.stats = {
      hitCount: 0,
      missCount: 0,
      evictionCount: 0,
      totalSize: 0,
      compressionRatio: 0,
      predictionAccuracy: 0,
    };
  }

  public getStats(): CacheStats {
    return {
      ...this.stats,
      compressionRatio: this.calculateCompressionRatio(),
      predictionAccuracy: this.calculatePredictionAccuracy(),
    };
  }

  public keys(): string[] {
    return Array.from(this.cache.keys()).filter(key => 
      Date.now() - this.cache.get(key)!.timestamp <= this.config.maxAge
    );
  }

  public values(): T[] {
    return this.keys().map(key => this.get(key)!).filter(Boolean);
  }

  public size(): number {
    return this.keys().length;
  }

  // 预测性缓存
  private predictedKeys: Set<string> = new Set();
  private predictionHistory: Map<string, string[]> = new Map();

  private predictNextKeys(currentKey: string): void {
    // 基于访问模式预测下一个可能的键
    const pattern = this.extractPattern(currentKey);
    if (!pattern) return;

    const predictions = this.generatePredictions(pattern);
    predictions.forEach(prediction => {
      if (!this.has(prediction)) {
        this.predictedKeys.add(prediction);
      }
    });

    // 记录历史用于准确性计算
    if (!this.predictionHistory.has(currentKey)) {
      this.predictionHistory.set(currentKey, []);
    }
  }

  private extractPattern(key: string): string | null {
    // 简单的模式提取，实际应用中可以更复杂
    const match = key.match(/^(timer|theme|config)_(\d+)$/);
    return match ? `${match[1]}_` : null;
  }

  private generatePredictions(pattern: string): string[] {
    // 基于模式生成预测键
    const predictions: string[] = [];
    for (let i = 1; i <= 5; i++) {
      predictions.push(`${pattern}${i}`);
    }
    return predictions;
  }

  private calculatePredictionAccuracy(): number {
    if (this.predictionHistory.size === 0) return 0;
    
    let correctPredictions = 0;
    let totalPredictions = 0;

    for (const [, predictions] of this.predictionHistory) {
      totalPredictions += predictions.length;
      predictions.forEach(prediction => {
        if (this.has(prediction)) {
          correctPredictions++;
        }
      });
    }

    return totalPredictions > 0 ? correctPredictions / totalPredictions : 0;
  }

  // 压缩/解压
  private compress<T>(value: T): T {
    if (typeof value === 'string') {
      return this.simpleStringCompression(value as unknown as string) as unknown as T;
    }
    return value;
  }

  private decompress<T>(value: T): T {
    if (typeof value === 'string') {
      return this.simpleStringDecompression(value as unknown as string) as unknown as T;
    }
    return value;
  }

  private simpleStringCompression(str: string): string {
    // 简单的字符串压缩：去除重复空格和换行
    return str.replace(/\s+/g, ' ').trim();
  }

  private simpleStringDecompression(str: string): string {
    // 简单的字符串解压：这里不需要实际操作
    return str;
  }

  private calculateCompressionRatio(): number {
    let originalSize = 0;
    let compressedSize = 0;

    for (const entry of this.cache.values()) {
      originalSize += entry.size;
      compressedSize += entry.size * 0.8; // 假设压缩率20%
    }

    return originalSize > 0 ? (originalSize - compressedSize) / originalSize : 0;
  }

  // LRU 算法
  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;

    const keyToEvict = this.accessOrder[0];
    this.remove(keyToEvict);
    this.stats.evictionCount++;
  }

  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  // 清理过期条目
  private cleanupExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.config.maxAge) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.remove(key));
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpired();
    }, this.config.cleanupInterval);
  }

  // 工具方法
  private calculateSize(value: T): number {
    if (typeof value === 'string') {
      return value.length * 2; // UTF-16 字符占用2字节
    }
    if (typeof value === 'number') {
      return 8;
    }
    if (typeof value === 'boolean') {
      return 4;
    }
    if (Array.isArray(value)) {
      return value.reduce((size, item) => size + this.calculateSize(item as T), 0);
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value).length * 2;
    }
    return 16; // 默认大小
  }
}

// 专用缓存管理器
export class TimerCacheManager {
  private static instance: TimerCacheManager;
  private timerCache: LRUCache<any>;
  private themeCache: LRUCache<any>;
  private styleCache: LRUCache<any>;
  private calculationCache: LRUCache<any>;

  private constructor() {
    const defaultConfig: CacheConfig = {
      maxSize: 1024 * 1024 * 10, // 10MB
      maxAge: 5 * 60 * 1000, // 5分钟
      compressionEnabled: true,
      predictionEnabled: true,
      cleanupInterval: 30000, // 30秒
    };

    this.timerCache = new LRUCache<any>(defaultConfig);
    this.themeCache = new LRUCache<any>({ ...defaultConfig, maxSize: 1024 * 1024 * 5 });
    this.styleCache = new LRUCache<any>({ ...defaultConfig, maxSize: 1024 * 1024 * 2 });
    this.calculationCache = new LRUCache<any>({ ...defaultConfig, maxAge: 60000 }); // 1分钟
  }

  public static getInstance(): TimerCacheManager {
    if (!TimerCacheManager.instance) {
      TimerCacheManager.instance = new TimerCacheManager();
    }
    return TimerCacheManager.instance;
  }

  // 计时器相关缓存
  public cacheTimerState(key: string, state: any): void {
    this.timerCache.set(`timer_${key}`, state);
  }

  public getTimerState(key: string): any {
    return this.timerCache.get(`timer_${key}`);
  }

  // 主题相关缓存
  public cacheTheme(themeId: string, theme: any): void {
    this.themeCache.set(`theme_${themeId}`, theme);
  }

  public getTheme(themeId: string): any {
    return this.themeCache.get(`theme_${themeId}`);
  }

  // 样式相关缓存
  public cacheStyle(styleKey: string, style: any): void {
    this.styleCache.set(`style_${styleKey}`, style);
  }

  public getStyle(styleKey: string): any {
    return this.styleCache.get(`style_${styleKey}`);
  }

  // 计算结果缓存
  public cacheCalculation(key: string, result: any): void {
    this.calculationCache.set(`calc_${key}`, result);
  }

  public getCalculation(key: string): any {
    return this.calculationCache.get(`calc_${key}`);
  }

  // 批量操作
  public clearAll(): void {
    this.timerCache.clear();
    this.themeCache.clear();
    this.styleCache.clear();
    this.calculationCache.clear();
  }

  public getStats(): Record<string, CacheStats> {
    return {
      timer: this.timerCache.getStats(),
      theme: this.themeCache.getStats(),
      style: this.styleCache.getStats(),
      calculation: this.calculationCache.getStats(),
    };
  }
}

// 全局缓存实例
export const timerCacheManager = TimerCacheManager.getInstance();