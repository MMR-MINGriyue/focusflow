/**
 * 性能优化工具函数
 * 提供性能监控、优化和分析功能
 */

import React from 'react';

/**
 * 性能指标接口
 */
export interface PerformanceMetrics {
  /**
   * 渲染时间
   */
  renderTime: number;
  /**
   * 状态更新时间
   */
  stateUpdateTime: number;
  /**
   * 最后更新时间
   */
  lastUpdateTime: number;
  /**
   * 内存使用
   */
  memoryUsage?: number;
  /**
   * FPS
   */
  fps?: number;
}

/**
 * 性能监控选项
 */
export interface PerformanceMonitorOptions {
  /**
   * 是否启用内存监控
   */
  enableMemoryMonitoring?: boolean;
  /**
   * 是否启用FPS监控
   */
  enableFPSMonitoring?: boolean;
  /**
   * 监控间隔（毫秒）
   */
  monitoringInterval?: number;
  /**
   * 性能指标回调
   */
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

/**
 * 性能监控类
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    renderTime: 0,
    stateUpdateTime: 0,
    lastUpdateTime: 0,
  };
  private options: Required<PerformanceMonitorOptions>;
  private monitoringIntervalId: number | null = null;
  private frameCount = 0;
  private lastFrameTime = 0;
  private fps = 0;

  constructor(options: PerformanceMonitorOptions = {}) {
    this.options = {
      enableMemoryMonitoring: options.enableMemoryMonitoring ?? true,
      enableFPSMonitoring: options.enableFPSMonitoring ?? true,
      monitoringInterval: options.monitoringInterval ?? 5000,
      onMetricsUpdate: options.onMetricsUpdate ?? (() => {}),
    };
  }

  /**
   * 开始监控
   */
  start(): void {
    if (this.monitoringIntervalId) {
      return; // 已经在监控中
    }

    // 开始FPS监控
    if (this.options.enableFPSMonitoring) {
      this.startFPSMonitoring();
    }

    // 开始定期更新指标
    this.monitoringIntervalId = window.setInterval(() => {
      this.updateMetrics();
    }, this.options.monitoringInterval);
  }

  /**
   * 停止监控
   */
  stop(): void {
    if (this.monitoringIntervalId) {
      clearInterval(this.monitoringIntervalId);
      this.monitoringIntervalId = null;
    }
  }

  /**
   * 更新性能指标
   */
  updateMetrics(): void {
    // 更新内存使用
    if (this.options.enableMemoryMonitoring) {
      this.metrics.memoryUsage = this.getMemoryUsage();
    }

    // 更新FPS
    if (this.options.enableFPSMonitoring) {
      this.metrics.fps = this.fps;
    }

    // 通知指标更新
    this.options.onMetricsUpdate({ ...this.metrics });
  }

  /**
   * 记录渲染时间
   */
  recordRenderTime(renderTime: number): void {
    this.metrics.renderTime = renderTime;
  }

  /**
   * 记录状态更新时间
   */
  recordStateUpdateTime(stateUpdateTime: number): void {
    this.metrics.stateUpdateTime = stateUpdateTime;
    this.metrics.lastUpdateTime = Date.now();
  }

  /**
   * 获取当前性能指标
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 开始FPS监控
   */
  private startFPSMonitoring(): void {
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
        this.frameCount = 0;
        this.lastFrameTime = timestamp;
      }

      requestAnimationFrame(updateFPS);
    };

    requestAnimationFrame(updateFPS);
  }

  /**
   * 获取内存使用情况
   */
  private getMemoryUsage(): number {
    if ('memory' in (window as any)) {
      return (window as any).memory.usedJSHeapSize;
    }
    return 0;
  }
}

/**
 * 性能分析工具类
 */
export class PerformanceProfiler {
  private measurements: Map<string, number> = new Map();
  private marks: Map<string, number> = new Map();

  /**
   * 开始测量
   */
  startMeasure(name: string): void {
    this.marks.set(name, performance.now());
  }

  /**
   * 结束测量
   */
  endMeasure(name: string): number {
    const startTime = this.marks.get(name);
    if (!startTime) {
      console.warn(`No measurement started for ${name}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.measurements.set(name, duration);
    this.marks.delete(name);

    return duration;
  }

  /**
   * 获取测量结果
   */
  getMeasurement(name: string): number | undefined {
    return this.measurements.get(name);
  }

  /**
   * 获取所有测量结果
   */
  getAllMeasurements(): Record<string, number> {
    return Object.fromEntries(this.measurements);
  }

  /**
   * 清除所有测量结果
   */
  clearMeasurements(): void {
    this.measurements.clear();
    this.marks.clear();
  }

  /**
   * 记录性能指标
   */
  mark(name: string): void {
    performance.mark(name);
  }

  /**
   * 测量两个标记之间的时间
   */
  measure(startMark: string, endMark: string, measureName?: string): number {
    const name = measureName || `${startMark}-${endMark}`;
    try {
      performance.measure(name, startMark, endMark);
      const entries = performance.getEntriesByName(name);
      if (entries.length > 0) {
        const duration = entries[0].duration;
        performance.clearMarks(startMark);
        performance.clearMarks(endMark);
        performance.clearMeasures(name);
        return duration;
      }
    } catch (error) {
      console.warn(`Failed to measure between ${startMark} and ${endMark}:`, error);
    }
    return 0;
  }
}

/**
 * 全局性能分析器实例
 */
export const globalProfiler = new PerformanceProfiler();

/**
 * 性能优化装饰器
 * @param target 目标对象
 * @param propertyKey 属性名
 * @param descriptor 属性描述符
 */
export function measurePerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const methodName = `${target.constructor.name}.${propertyKey}`;
    globalProfiler.startMeasure(methodName);

    try {
      const result = originalMethod.apply(this, args);

      // 如果是Promise，等待完成后再结束测量
      if (result && typeof result.then === 'function') {
        return result
          .then((res: any) => {
            globalProfiler.endMeasure(methodName);
            return res;
          })
          .catch((err: any) => {
            globalProfiler.endMeasure(methodName);
            throw err;
          });
      }

      globalProfiler.endMeasure(methodName);
      return result;
    } catch (error) {
      globalProfiler.endMeasure(methodName);
      throw error;
    }
  };

  return descriptor;
}

/**
 * 延迟加载组件
 * @param importFunc 导入函数
 * @param fallback 加载时显示的组件
 * @returns 延迟加载的组件
 */
export function lazyLoad<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  _fallback?: React.ComponentType
): React.LazyExoticComponent<T> {
  return React.lazy(() => {
    return new Promise<{ default: T }>((resolve) => {
      globalProfiler.startMeasure('lazy-load');

      importFunc()
        .then((module) => {
          globalProfiler.endMeasure('lazy-load');
          resolve(module);
        })
        .catch((error) => {
          globalProfiler.endMeasure('lazy-load');
          console.error('Failed to load component:', error);
          throw error;
        });
    });
  });
}

/**
 * 防抖函数
 * @param func 要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * 节流函数
 * @param func 要节流的函数
 * @param delay 延迟时间（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func.apply(this, args);
    }
  };
}

/**
 * 记忆函数
 * @param func 要记忆的函数
 * @param keyGenerator 键生成器
 * @returns 记忆后的函数
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * 批量处理函数
 * @param func 要批量处理的函数
 * @param batchSize 批次大小
 * @param delay 延迟时间（毫秒）
 * @returns 批量处理后的函数
 */
export function batch<T extends (...args: any[]) => any>(
  func: T,
  batchSize: number = 10,
  delay: number = 100
): (...args: Parameters<T>) => void {
  let batch: Parameters<T>[] = [];
  let timeoutId: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    batch.push(args);

    if (batch.length >= batchSize) {
      flushBatch.call(this);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        flushBatch.call(this);
      }, delay);
    }
  };

  function flushBatch(this: any) {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (batch.length > 0) {
      const items = [...batch];
      batch = [];
      items.forEach(item => func.apply(this, item));
    }
  }
}

/**
 * 优化渲染的Hook
 * @param callback 回调函数
 * @param deps 依赖项
 */
export function useOptimizedEffect(
  callback: React.EffectCallback,
  deps: React.DependencyList
): void {
  const profiler = new PerformanceProfiler();

  React.useEffect(() => {
    profiler.startMeasure('effect');
    const result = callback();
    profiler.endMeasure('effect');

    const duration = profiler.getMeasurement('effect');
    if (duration && duration > 10) {
      console.warn(`Effect took ${duration.toFixed(2)}ms to execute, consider optimizing`);
    }

    return result;
  }, deps);
}

/**
 * 优化渲染的组件Hook
 * @param componentName 组件名称
 */
export function useComponentPerformance(componentName: string) {
  const profiler = new PerformanceProfiler();

  React.useEffect(() => {
    profiler.startMeasure(componentName);

    return () => {
      const duration = profiler.endMeasure(componentName);
      if (duration && duration > 16) {
        console.warn(`Component ${componentName} took ${duration.toFixed(2)}ms to render, consider optimizing`);
      }
    };
  });
}

/**
 * 性能监控Hook
 * @param options 监控选项
 */
export function usePerformanceMonitor(options: PerformanceMonitorOptions = {}) {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics>({
    renderTime: 0,
    stateUpdateTime: 0,
    lastUpdateTime: 0,
  });

  React.useEffect(() => {
    const monitor = new PerformanceMonitor({
      ...options,
      onMetricsUpdate: (newMetrics) => {
        setMetrics(newMetrics);
        options.onMetricsUpdate?.(newMetrics);
      },
    });

    monitor.start();

    return () => {
      monitor.stop();
    };
  }, [options]);

  return metrics;
}
