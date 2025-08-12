/**
 * 性能监控服务
 * 用于监控应用性能指标
 */

import { container } from '../../container/IoCContainer';

/**
 * 性能指标接口
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string>;
}

/**
 * 性能指标类型
 */
export type MetricType = 
  | 'counter'     // 计数器，只增不减
  | 'gauge'       // 仪表盘，可增可减
  | 'histogram'   // 直方图，记录分布
  | 'timer'       // 计时器，记录耗时
  | 'summary';    // 摘要，类似直方图但计算分位数

/**
 * 性能指标配置
 */
export interface MetricConfig {
  type: MetricType;
  description: string;
  labels?: string[];
}

/**
 * 性能监控服务接口
 */
export interface PerformanceMonitoringService {
  /**
   * 记录指标
   * @param name 指标名称
   * @param value 指标值
   * @param unit 单位
   * @param tags 标签
   */
  recordMetric(name: string, value: number, unit: string, tags?: Record<string, string>): void;

  /**
   * 增加计数器
   * @param name 指标名称
   * @param value 增加值，默认为1
   * @param tags 标签
   */
  incrementCounter(name: string, value?: number, tags?: Record<string, string>): void;

  /**
   * 设置仪表盘
   * @param name 指标名称
   * @param value 指标值
   * @param tags 标签
   */
  setGauge(name: string, value: number, tags?: Record<string, string>): void;

  /**
   * 记录耗时
   * @param name 指标名称
   * @param duration 耗时（毫秒）
   * @param tags 标签
   */
  recordTimer(name: string, duration: number, tags?: Record<string, string>): void;

  /**
   * 记录直方图
   * @param name 指标名称
   * @param value 指标值
   * @param tags 标签
   */
  recordHistogram(name: string, value: number, tags?: Record<string, string>): void;

  /**
   * 获取指标
   * @param name 指标名称
   */
  getMetric(name: string): PerformanceMetric[];

  /**
   * 获取所有指标
   */
  getAllMetrics(): PerformanceMetric[];

  /**
   * 注册指标
   * @param name 指标名称
   * @param config 指标配置
   */
  registerMetric(name: string, config: MetricConfig): void;

  /**
   * 开始计时
   * @param name 指标名称
   * @param tags 标签
   * @returns 结束计时的函数
   */
  time(name: string, tags?: Record<string, string>): () => void;
}

/**
 * 性能监控服务实现
 */
export class PerformanceMonitoringServiceImpl implements PerformanceMonitoringService {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private metricConfigs: Map<string, MetricConfig> = new Map();
  private cacheService = container.resolve('cacheService');

  recordMetric(name: string, value: number, unit: string, tags?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name)!;
    metrics.push(metric);

    // 限制指标数量，防止内存泄漏
    if (metrics.length > 1000) {
      metrics.splice(0, metrics.length - 1000);
    }

    // 缓存最新值
    this.cacheService.set(`metric:${name}:latest`, metric, 60000);
  }

  incrementCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
    // 获取当前值
    const current = this.getLatestMetricValue(name) || 0;

    // 记录新值
    this.recordMetric(name, current + value, 'count', tags);
  }

  setGauge(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric(name, value, 'value', tags);
  }

  recordTimer(name: string, duration: number, tags?: Record<string, string>): void {
    this.recordMetric(name, duration, 'ms', tags);
  }

  recordHistogram(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric(name, value, 'value', tags);
  }

  getMetric(name: string): PerformanceMetric[] {
    return this.metrics.get(name) || [];
  }

  getAllMetrics(): PerformanceMetric[] {
    const allMetrics: PerformanceMetric[] = [];

    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics);
    }

    return allMetrics;
  }

  registerMetric(name: string, config: MetricConfig): void {
    this.metricConfigs.set(name, config);
  }

  time(name: string, tags?: Record<string, string>): () => void {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      this.recordTimer(name, duration, tags);
    };
  }

  /**
   * 获取指标的最新值
   */
  private getLatestMetricValue(name: string): number | null {
    // 尝试从缓存获取
    const latest = this.cacheService.get<PerformanceMetric>(`metric:${name}:latest`);
    if (latest) {
      return latest.value;
    }

    // 从内存中获取
    const metrics = this.metrics.get(name);
    if (metrics && metrics.length > 0) {
      return metrics[metrics.length - 1].value;
    }

    return null;
  }

  /**
   * 获取指标统计信息
   */
  getMetricStats(name: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
    sum: number;
  } | null {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) {
      return null;
    }

    const values = metrics.map(m => m.value);
    const count = values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const avg = sum / count;

    return {
      count,
      min,
      max,
      avg,
      sum,
    };
  }

  /**
   * 获取指标百分位
   */
  getMetricPercentiles(
    name: string, 
    percentiles: number[] = [50, 90, 95, 99]
  ): Record<number, number> | null {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) {
      return null;
    }

    const values = metrics.map(m => m.value).sort((a, b) => a - b);
    const result: Record<number, number> = {};

    for (const p of percentiles) {
      const index = Math.ceil((p / 100) * values.length) - 1;
      result[p] = values[Math.max(0, Math.min(index, values.length - 1))];
    }

    return result;
  }

  /**
   * 清理旧指标
   * @param maxAge 最大年龄（毫秒）
   */
  cleanupOldMetrics(maxAge: number): void {
    const now = Date.now();

    for (const [name, metrics] of this.metrics.entries()) {
      const filtered = metrics.filter(m => now - m.timestamp <= maxAge);
      this.metrics.set(name, filtered);
    }
  }
}

/**
 * 性能监控装饰器
 * 用于自动监控方法执行时间
 */
export function MonitorPerformance(metricName?: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<Function>
  ) {
    const method = descriptor.value!;

    descriptor.value = function (...args: any[]) {
      const monitoringService = container.resolve<PerformanceMonitoringService>('performanceMonitoringService');
      const name = metricName || `${target.constructor.name}.${propertyName}`;

      // 开始计时
      const endTimer = monitoringService.time(name);

      try {
        // 执行原方法
        const result = method.apply(this, args);

        // 如果是Promise，等待完成
        if (result instanceof Promise) {
          return result
            .then((value: any) => {
              endTimer();
              return value;
            })
            .catch((error: any) => {
              endTimer();
              throw error;
            });
        }

        // 结束计时
        endTimer();
        return result;
      } catch (error) {
        // 结束计时
        endTimer();
        throw error;
      }
    };

    return descriptor;
  };
}
