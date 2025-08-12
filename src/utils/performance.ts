/**
 * 性能监控和优化工具
 */
import React from 'react';

// 性能指标接口
export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  animationFrameRate: number;
  componentUpdateCount: number;
  timestamp: number;
}

// 性能监控器类
class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private observers: ((metrics: PerformanceMetrics) => void)[] = [];
  private isMonitoring = false;
  private animationFrameId: number | null = null;
  private metricsIntervalId: number | null = null;
  private lastFrameTime = 0;
  private frameCount = 0;
  private componentUpdateCounts = new Map<string, number>();

  /**
   * 开始性能监控
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    // 确保先清理任何现有的定时器
    this.stopMonitoring();

    this.isMonitoring = true;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.measureFrameRate();

    // 每秒收集一次性能指标
    this.metricsIntervalId = window.setInterval(() => {
      if (this.isMonitoring) {
        this.collectMetrics();
      }
    }, 1000);
  }

  /**
   * 停止性能监控
   */
  stopMonitoring(): void {
    this.isMonitoring = false;

    // 清理动画帧
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // 清理指标收集定时器
    if (this.metricsIntervalId) {
      clearInterval(this.metricsIntervalId);
      this.metricsIntervalId = null;
    }
  }

  /**
   * 测量帧率
   */
  private measureFrameRate(): void {
    this.frameCount++;

    this.animationFrameId = requestAnimationFrame(() => {
      if (this.isMonitoring) {
        this.measureFrameRate();
      }
    });
  }

  /**
   * 收集性能指标
   */
  private collectMetrics(): void {
    const now = performance.now();
    const timeDiff = now - this.lastFrameTime;
    const fps = timeDiff > 0 ? (this.frameCount * 1000) / timeDiff : 0;
    
    const metrics: PerformanceMetrics = {
      renderTime: this.getAverageRenderTime(),
      memoryUsage: this.getMemoryUsage(),
      animationFrameRate: Math.round(fps),
      componentUpdateCount: this.getTotalComponentUpdates(),
      timestamp: now
    };

    this.metrics.push(metrics);
    
    // 只保留最近100个指标
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }

    // 重置计数器
    this.frameCount = 0;
    this.lastFrameTime = now;
    this.componentUpdateCounts.clear();

    // 通知观察者
    this.observers.forEach(observer => observer(metrics));
  }

  /**
   * 获取平均渲染时间
   */
  private getAverageRenderTime(): number {
    if (typeof performance.getEntriesByType === 'function') {
      const paintEntries = performance.getEntriesByType('paint');
      if (paintEntries.length > 0) {
        const lastPaint = paintEntries[paintEntries.length - 1];
        return lastPaint.startTime;
      }
    }
    return 0;
  }

  /**
   * 获取内存使用情况
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  /**
   * 获取组件更新总数
   */
  private getTotalComponentUpdates(): number {
    let total = 0;
    this.componentUpdateCounts.forEach(count => {
      total += count;
    });
    return total;
  }

  /**
   * 记录组件更新
   */
  recordComponentUpdate(componentName: string): void {
    const current = this.componentUpdateCounts.get(componentName) || 0;
    this.componentUpdateCounts.set(componentName, current + 1);
  }

  /**
   * 获取最新的性能指标
   */
  getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * 获取所有性能指标
   */
  getAllMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * 添加性能监控观察者
   */
  addObserver(observer: (metrics: PerformanceMetrics) => void): void {
    this.observers.push(observer);
  }

  /**
   * 移除性能监控观察者
   */
  removeObserver(observer: (metrics: PerformanceMetrics) => void): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport(): {
    averageFPS: number;
    averageMemory: number;
    averageRenderTime: number;
    totalUpdates: number;
    recommendations: string[];
  } {
    if (this.metrics.length === 0) {
      return {
        averageFPS: 0,
        averageMemory: 0,
        averageRenderTime: 0,
        totalUpdates: 0,
        recommendations: ['开始监控以获取性能数据']
      };
    }

    const avgFPS = this.metrics.reduce((sum, m) => sum + m.animationFrameRate, 0) / this.metrics.length;
    const avgMemory = this.metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / this.metrics.length;
    const avgRenderTime = this.metrics.reduce((sum, m) => sum + m.renderTime, 0) / this.metrics.length;
    const totalUpdates = this.metrics.reduce((sum, m) => sum + m.componentUpdateCount, 0);

    const recommendations: string[] = [];
    
    if (avgFPS < 30) {
      recommendations.push('帧率较低，考虑减少动画效果或优化渲染');
    }
    
    if (avgMemory > 100) {
      recommendations.push('内存使用较高，检查是否有内存泄漏');
    }
    
    if (totalUpdates > 1000) {
      recommendations.push('组件更新频繁，考虑使用React.memo或useMemo优化');
    }
    
    if (avgRenderTime > 16) {
      recommendations.push('渲染时间较长，考虑代码分割或懒加载');
    }

    if (recommendations.length === 0) {
      recommendations.push('性能表现良好');
    }

    return {
      averageFPS: Math.round(avgFPS),
      averageMemory: Math.round(avgMemory * 100) / 100,
      averageRenderTime: Math.round(avgRenderTime * 100) / 100,
      totalUpdates,
      recommendations
    };
  }
}

// 创建全局性能监控器实例
export const performanceMonitor = new PerformanceMonitor();

/**
 * 性能测量装饰器
 */
export function measurePerformance(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const start = performance.now();
    const result = method.apply(this, args);
    const end = performance.now();
    
    console.log(`${target.constructor.name}.${propertyName} 执行时间: ${end - start}ms`);
    
    return result;
  };

  return descriptor;
}

/**
 * React组件性能监控Hook
 */
export function usePerformanceMonitor(componentName: string) {
  const renderCount = React.useRef(0);
  const lastRenderTime = React.useRef(performance.now());

  React.useEffect(() => {
    renderCount.current++;
    const now = performance.now();
    const renderTime = now - lastRenderTime.current;
    
    performanceMonitor.recordComponentUpdate(componentName);
    
    if (renderTime > 16) { // 超过一帧的时间
      console.warn(`${componentName} 渲染时间较长: ${renderTime}ms`);
    }
    
    lastRenderTime.current = now;
  });

  return {
    renderCount: renderCount.current,
    recordUpdate: () => performanceMonitor.recordComponentUpdate(componentName)
  };
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 内存使用监控
 */
export function getMemoryInfo(): {
  used: number;
  total: number;
  limit: number;
} | null {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100,
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024 * 100) / 100,
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024 * 100) / 100
    };
  }
  return null;
}

/**
 * 检查是否为低性能设备
 */
export function isLowPerformanceDevice(): boolean {
  // 检查硬件并发数
  const cores = navigator.hardwareConcurrency || 1;
  if (cores <= 2) return true;
  
  // 检查内存
  const memory = getMemoryInfo();
  if (memory && memory.limit < 1000) return true; // 小于1GB
  
  // 检查用户代理字符串中的低端设备标识
  const userAgent = navigator.userAgent.toLowerCase();
  const lowEndDevices = ['android 4', 'android 5', 'iphone 5', 'iphone 6'];
  if (lowEndDevices.some(device => userAgent.includes(device))) return true;
  
  return false;
}

/**
 * 自适应性能配置
 */
export function getAdaptivePerformanceConfig() {
  const isLowEnd = isLowPerformanceDevice();
  const memory = getMemoryInfo();
  
  return {
    enableAnimations: !isLowEnd,
    particleCount: isLowEnd ? 5 : 20,
    animationDuration: isLowEnd ? 200 : 300,
    enableBackgroundEffects: !isLowEnd,
    enableComplexDecorations: !isLowEnd && (memory?.used || 0) < 50,
    maxConcurrentAnimations: isLowEnd ? 1 : 3,
    enablePerformanceMonitoring: true
  };
}
