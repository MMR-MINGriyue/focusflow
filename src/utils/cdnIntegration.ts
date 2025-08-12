// CDN集成模块
// 提供智能资源加载、缓存和分发功能

export interface CDNConfig {
  baseUrl: string;
  fallbackUrl: string;
  timeout: number;
  retryAttempts: number;
  compression: 'gzip' | 'br' | 'deflate';
  cacheStrategy: 'memory' | 'indexeddb' | 'service-worker';
  prefetchEnabled: boolean;
  smartRouting: boolean;
}

export interface CDNResource {
  url: string;
  type: 'js' | 'css' | 'image' | 'font' | 'wasm' | 'json';
  version?: string;
  integrity?: string;
  crossorigin?: boolean;
  priority: 'high' | 'medium' | 'low';
  preload?: boolean;
}

export interface CDNStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLoadTime: number;
  cacheHitRate: number;
  bandwidthSaved: number;
  lastUpdated: number;
}

export interface LoadResult {
  success: boolean;
  data?: any;
  error?: string;
  loadTime: number;
  fromCache: boolean;
  url: string;
}

export class CDNIntegration {
  private static instance: CDNIntegration;
  private config: CDNConfig;
  private cache: Map<string, { data: any; timestamp: number; etag?: string }> = new Map();
  private stats: CDNStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageLoadTime: 0,
    cacheHitRate: 0,
    bandwidthSaved: 0,
    lastUpdated: Date.now(),
  };
  private activeRequests: Map<string, Promise<LoadResult>> = new Map();
  private retryQueue: Array<{ url: string; attempts: number; resolve: Function; reject: Function }> = [];
  private smartRoutingTable: Map<string, string[]> = new Map();
  private prefetchQueue: Set<string> = new Set();

  private constructor() {
    this.config = {
      baseUrl: 'https://cdn.jsdelivr.net/npm',
      fallbackUrl: 'https://unpkg.com',
      timeout: 5000,
      retryAttempts: 3,
      compression: 'br',
      cacheStrategy: 'memory',
      prefetchEnabled: true,
      smartRouting: true,
    };

    this.initializeSmartRouting();
    this.startPrefetchWorker();
  }

  public static getInstance(): CDNIntegration {
    if (!CDNIntegration.instance) {
      CDNIntegration.instance = new CDNIntegration();
    }
    return CDNIntegration.instance;
  }

  public configure(config: Partial<CDNConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public async loadResource(resource: CDNResource): Promise<LoadResult> {
    const cacheKey = this.generateCacheKey(resource);
    
    // 检查缓存
    if (this.hasValidCache(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      this.stats.cacheHitRate = (this.stats.cacheHitRate * this.stats.totalRequests + 1) / (this.stats.totalRequests + 1);
      this.stats.totalRequests++;
      
      return {
        success: true,
        data: cached.data,
        loadTime: 0,
        fromCache: true,
        url: resource.url,
      };
    }

    // 检查是否有正在进行的请求
    if (this.activeRequests.has(cacheKey)) {
      return this.activeRequests.get(cacheKey)!;
    }

    // 创建新的加载请求
    const loadPromise = this.performLoad(resource, cacheKey);
    this.activeRequests.set(cacheKey, loadPromise);

    try {
      const result = await loadPromise;
      this.activeRequests.delete(cacheKey);
      return result;
    } catch (error) {
      this.activeRequests.delete(cacheKey);
      throw error;
    }
  }

  public async preloadResources(resources: CDNResource[]): Promise<void> {
    const promises = resources.map(resource => this.loadResource(resource));
    await Promise.allSettled(promises);
  }

  public async loadTimerWASM(): Promise<WebAssembly.Module> {
    const resource: CDNResource = {
      url: `${this.config.baseUrl}/timer-calculation@latest/dist/timer_calculation_bg.wasm`,
      type: 'wasm',
      priority: 'high',
      preload: true,
    };

    const result = await this.loadResource(resource);
    if (!result.success || !result.data) {
      throw new Error(`Failed to load WASM module: ${result.error}`);
    }

    return WebAssembly.instantiate(result.data);
  }

  public async loadTheme(themeId: string): Promise<any> {
    const resource: CDNResource = {
      url: `${this.config.baseUrl}/timer-themes@latest/dist/${themeId}.json`,
      type: 'json',
      priority: 'medium',
    };

    const result = await this.loadResource(resource);
    if (!result.success) {
      throw new Error(`Failed to load theme: ${result.error}`);
    }

    return result.data;
  }

  public getStats(): CDNStats {
    return {
      ...this.stats,
      lastUpdated: Date.now(),
    };
  }

  public clearCache(): void {
    this.cache.clear();
    this.stats.cacheHitRate = 0;
    this.stats.bandwidthSaved = 0;
  }

  public async warmCache(): Promise<void> {
    const essentialResources: CDNResource[] = [
      {
        url: `${this.config.baseUrl}/timer-core@latest/dist/index.js`,
        type: 'js',
        priority: 'high',
        preload: true,
      },
      {
        url: `${this.config.baseUrl}/timer-themes@latest/dist/default.json`,
        type: 'json',
        priority: 'high',
        preload: true,
      },
    ];

    await this.preloadResources(essentialResources);
  }

  private async performLoad(resource: CDNResource, cacheKey: string): Promise<LoadResult> {
    const startTime = performance.now();
    this.stats.totalRequests++;

    try {
      const url = this.buildUrl(resource);
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: this.buildHeaders(resource),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let data: any;
      switch (resource.type) {
        case 'js':
          data = await response.text();
          break;
        case 'css':
          data = await response.text();
          break;
        case 'image':
          data = await response.blob();
          break;
        case 'font':
          data = await response.arrayBuffer();
          break;
        case 'wasm':
          data = await response.arrayBuffer();
          break;
        default:
          data = await response.json();
      }

      const loadTime = performance.now() - startTime;
      
      // 缓存结果
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        etag: response.headers.get('etag') || undefined,
      });

      this.stats.successfulRequests++;
      this.updateAverageLoadTime(loadTime);

      return {
        success: true,
        data,
        loadTime,
        fromCache: false,
        url: resource.url,
      };

    } catch (error) {
      this.stats.failedRequests++;
      
      // 重试逻辑
      if (this.shouldRetry(resource)) {
        return this.retryLoad(resource, cacheKey);
      }

      // 回退到备用CDN
      if (this.config.smartRouting) {
        return this.fallbackLoad(resource, cacheKey);
      }

      throw error;
    }
  }

  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async retryLoad(resource: CDNResource, _cacheKey: string): Promise<LoadResult> {
    return new Promise((resolve, reject) => {
      this.retryQueue.push({
        url: resource.url,
        attempts: 0,
        resolve,
        reject,
      });
    });
  }

  private async fallbackLoad(resource: CDNResource, cacheKey: string): Promise<LoadResult> {
    const fallbackResource = {
      ...resource,
      url: resource.url.replace(this.config.baseUrl, this.config.fallbackUrl),
    };

    try {
      return await this.performLoad(fallbackResource, cacheKey);
    } catch (error) {
      // 最后的本地回退
      return this.localFallback(resource);
    }
  }

  private async localFallback(resource: CDNResource): Promise<LoadResult> {
    // 尝试从本地存储获取
    const localData = localStorage.getItem(`cdn_fallback_${resource.url}`);
    if (localData) {
      return {
        success: true,
        data: JSON.parse(localData),
        loadTime: 0,
        fromCache: true,
        url: resource.url,
      };
    }

    throw new Error('All fallback options exhausted');
  }

  private buildUrl(resource: CDNResource): string {
    let url = resource.url;
    
    // 添加版本参数
    if (resource.version) {
      url += `@${resource.version}`;
    }

    // 添加压缩参数
    if (this.config.compression === 'br' && this.supportsBrotli()) {
      url += '?compression=brotli';
    }

    return url;
  }

  private buildHeaders(resource: CDNResource): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept-Encoding': this.config.compression,
    };

    if (resource.crossorigin) {
      headers['crossorigin'] = 'anonymous';
    }

    if (resource.integrity) {
      headers['integrity'] = resource.integrity;
    }

    return headers;
  }

  private generateCacheKey(resource: CDNResource): string {
    return `${resource.type}_${resource.url}_${resource.version || 'latest'}`;
  }

  private hasValidCache(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;

    // 检查缓存是否过期（5分钟）
    return Date.now() - cached.timestamp < 5 * 60 * 1000;
  }

  private shouldRetry(resource: CDNResource): boolean {
    // 根据资源优先级决定是否重试
    return resource.priority === 'high' || resource.priority === 'medium';
  }

  private updateAverageLoadTime(newTime: number): void {
    const total = this.stats.successfulRequests;
    this.stats.averageLoadTime = 
      (this.stats.averageLoadTime * (total - 1) + newTime) / total;
  }

  private supportsBrotli(): boolean {
    return typeof window !== 'undefined' && 
           'CompressionStream' in window &&
           /br/i.test(navigator.userAgent);
  }

  private initializeSmartRouting(): void {
    // 初始化智能路由表
    this.smartRoutingTable.set('jsdelivr', [
      'https://cdn.jsdelivr.net/npm',
      'https://fastly.jsdelivr.net/npm',
      'https://gcore.jsdelivr.net/npm',
    ]);
    
    this.smartRoutingTable.set('unpkg', [
      'https://unpkg.com',
      'https://cdn.unpkg.com',
    ]);
  }

  private startPrefetchWorker(): void {
    if (!this.config.prefetchEnabled) return;

    // 使用 Intersection Observer 预加载
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const url = entry.target.getAttribute('data-prefetch');
            if (url && !this.prefetchQueue.has(url)) {
              this.prefetchQueue.add(url);
              this.loadResource({ url, type: 'js', priority: 'low' });
            }
          }
        });
      });

      // 观察所有需要预加载的元素
      document.querySelectorAll('[data-prefetch]').forEach(el => {
        observer.observe(el);
      });
    }
  }
}

// 全局CDN实例
export const cdnIntegration = CDNIntegration.getInstance();

// 预加载常用资源
export const preloadEssentialResources = async (): Promise<void> => {
  const resources: CDNResource[] = [
    {
      url: 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js',
      type: 'js',
      priority: 'high',
      preload: true,
    },
    {
      url: 'https://cdn.jsdelivr.net/npm/moment@2.29.4/moment.min.js',
      type: 'js',
      priority: 'high',
      preload: true,
    },
  ];

  await cdnIntegration.preloadResources(resources);
};