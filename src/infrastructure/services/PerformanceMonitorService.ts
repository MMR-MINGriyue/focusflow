/**
 * 性能监控服务实现
 * 监控和优化应用性能
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    averageLoadTime: number;
    averageResponseTime: number;
    memoryUsage: number;
    fps: number;
    issues: string[];
  };
  timestamp: number;
}

export class PerformanceMonitorService {
  private initialized = false;
  private metrics: PerformanceMetric[] = [];
  private observers: Set<(metric: PerformanceMetric) => void> = new Set();
  private reportInterval: number | null = null;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 0;
  private maxMetricsCount = 1000; // 保留最近的1000条指标

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 初始化性能监控
      this.setupPerformanceMonitoring();

      // 开始定期生成报告
      this.startReporting();

      this.initialized = true;
      console.log('Performance monitor service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize performance monitor service:', error);
      throw error;
    }
  }

  /**
   * 记录性能指标
   */
  recordMetric(name: string, value: number, unit: string, metadata?: Record<string, any>): void {
    if (!this.initialized) {
      console.warn('Performance monitor not initialized');
      return;
    }

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      metadata
    };

    // 添加到指标列表
    this.metrics.push(metric);

    // 限制指标数量
    if (this.metrics.length > this.maxMetricsCount) {
      this.metrics = this.metrics.slice(-this.maxMetricsCount);
    }

    // 通知观察者
    this.observers.forEach(observer => {
      try {
        observer(metric);
      } catch (error) {
        console.error('Error in performance metric observer:', error);
      }
    });
  }

  /**
   * 添加性能指标观察者
   */
  addObserver(observer: (metric: PerformanceMetric) => void): void {
    this.observers.add(observer);
  }

  /**
   * 移除性能指标观察者
   */
  removeObserver(observer: (metric: PerformanceMetric) => void): void {
    this.observers.delete(observer);
  }

  /**
   * 获取性能报告
   */
  getReport(): PerformanceReport {
    const now = Date.now();

    // 计算平均加载时间
    const loadTimeMetrics = this.metrics.filter(m => m.name === 'page-load-time');
    const averageLoadTime = loadTimeMetrics.length > 0
      ? loadTimeMetrics.reduce((sum, m) => sum + m.value, 0) / loadTimeMetrics.length
      : 0;

    // 计算平均响应时间
    const responseTimeMetrics = this.metrics.filter(m => m.name === 'api-response-time');
    const averageResponseTime = responseTimeMetrics.length > 0
      ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length
      : 0;

    // 获取内存使用情况
    const memoryUsage = this.getMemoryUsage();

    // 获取FPS
    const fps = this.fps;

    // 分析性能问题
    const issues: string[] = [];

    if (averageLoadTime > 3000) {
      issues.push('页面加载时间过长');
    }

    if (averageResponseTime > 1000) {
      issues.push('API响应时间过长');
    }

    if (memoryUsage > 100 * 1024 * 1024) { // 100MB
      issues.push('内存使用过高');
    }

    if (fps < 30) {
      issues.push('帧率过低，可能影响用户体验');
    }

    return {
      metrics: [...this.metrics],
      summary: {
        averageLoadTime,
        averageResponseTime,
        memoryUsage,
        fps,
        issues
      },
      timestamp: now
    };
  }

  /**
   * 获取最近的指标
   */
  getRecentMetrics(name: string, count: number = 10): PerformanceMetric[] {
    return this.metrics
      .filter(m => m.name === name)
      .slice(-count);
  }

  /**
   * 清除所有指标
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * 设置性能监控
   */
  private setupPerformanceMonitoring(): void {
    // 监控页面加载时间
    window.addEventListener('load', () => {
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationTiming) {
        const loadTime = navigationTiming.loadEventEnd - navigationTiming.startTime;
        this.recordMetric('page-load-time', loadTime, 'ms');
      }
    });

    // 监控资源加载时间
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming;
          this.recordMetric('resource-load-time', resource.duration, 'ms', {
            name: resource.name,
            type: resource.initiatorType
          });
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Failed to observe resource loading:', error);
    }

    // 监控FPS
    this.monitorFPS();

    // 监控内存使用
    this.monitorMemoryUsage();

    // 监控长任务
    if ('PerformanceLongTaskTiming' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('long-task', entry.duration, 'ms', {
            name: entry.name,
            startTime: entry.startTime
          });
        }
      });

      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.warn('Failed to observe long tasks:', error);
      }
    }
  }

  /**
   * 监控FPS
   */
  private monitorFPS(): void {
    const updateFPS = (timestamp: number) => {
      if (this.lastFrameTime === 0) {
        this.lastFrameTime = timestamp;
        requestAnimationFrame(updateFPS);
        return;
      }

      const delta = timestamp - this.lastFrameTime;
      this.frameCount++;

      // 每秒更新一次FPS
      if (delta >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / delta);
        this.recordMetric('fps', this.fps, 'fps');

        this.frameCount = 0;
        this.lastFrameTime = timestamp;
      }

      requestAnimationFrame(updateFPS);
    };

    requestAnimationFrame(updateFPS);
  }

  /**
   * 监控内存使用
   */
  private monitorMemoryUsage(): void {
    const updateMemoryUsage = () => {
      const memoryUsage = this.getMemoryUsage();
      this.recordMetric('memory-usage', memoryUsage, 'bytes');

      // 每5秒更新一次
      setTimeout(updateMemoryUsage, 5000);
    };

    // 如果支持内存API，开始监控
    if ('memory' in (window as any)) {
      updateMemoryUsage();
    }
  }

  /**
   * 获取内存使用情况
   */
  private getMemoryUsage(): number {
    if ('memory' in (window as any)) {
      const memory = (window as any).memory;
      return memory.usedJSHeapSize;
    }

    // 如果不支持内存API，返回0
    return 0;
  }

  /**
   * 开始定期生成报告
   */
  private startReporting(): void {
    // 每30秒生成一次报告
    this.reportInterval = window.setInterval(() => {
      const report = this.getReport();

      // 如果有问题，记录到控制台
      if (report.summary.issues.length > 0) {
        console.warn('Performance issues detected:', report.summary.issues);
      }
    }, 30000);
  }

  /**
   * 停止定期生成报告
   */
  private stopReporting(): void {
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      this.reportInterval = null;
    }
  }

  /**
   * 销毁性能监控服务
   */
  destroy(): void {
    this.stopReporting();
    this.clearMetrics();
    this.observers.clear();
    this.initialized = false;
  }
}
