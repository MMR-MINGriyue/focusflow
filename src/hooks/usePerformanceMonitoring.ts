/**
 * 性能监控 Hook
 * 
 * 为React组件提供性能监控功能
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { performanceAnalyzer, recordPerformanceMetric } from '../utils/performanceAnalyzer';

interface UsePerformanceMonitoringOptions {
  /** 组件名称 */
  componentName?: string;
  /** 是否启用自动监控 */
  autoMonitor?: boolean;
  /** 监控间隔（毫秒） */
  interval?: number;
  /** 是否监控渲染时间 */
  trackRenderTime?: boolean;
  /** 是否监控用户交互 */
  trackInteractions?: boolean;
  /** 自定义阈值 */
  thresholds?: {
    renderTime?: number;
    interactionDelay?: number;
  };
}

interface PerformanceMetrics {
  renderTime: number;
  renderCount: number;
  lastInteractionDelay: number;
  averageRenderTime: number;
  memoryUsage: number;
}

interface UsePerformanceMonitoringReturn {
  /** 当前性能指标 */
  metrics: PerformanceMetrics;
  /** 开始监控渲染时间 */
  startRenderMeasure: () => void;
  /** 结束监控渲染时间 */
  endRenderMeasure: () => void;
  /** 记录用户交互 */
  recordInteraction: (interactionType: string) => void;
  /** 记录自定义指标 */
  recordCustomMetric: (name: string, value: number, category?: string) => void;
  /** 获取性能报告 */
  getReport: () => any;
  /** 是否有性能警告 */
  hasWarnings: boolean;
  /** 性能状态 */
  performanceStatus: 'good' | 'warning' | 'critical';
}

const defaultOptions: Required<UsePerformanceMonitoringOptions> = {
  componentName: 'UnknownComponent',
  autoMonitor: true,
  interval: 5000,
  trackRenderTime: true,
  trackInteractions: true,
  thresholds: {
    renderTime: 16,
    interactionDelay: 100
  }
};

export function usePerformanceMonitoring(
  options: UsePerformanceMonitoringOptions = {}
): UsePerformanceMonitoringReturn {
  const opts = { ...defaultOptions, ...options };
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    renderCount: 0,
    lastInteractionDelay: 0,
    averageRenderTime: 0,
    memoryUsage: 0
  });
  
  const [hasWarnings, setHasWarnings] = useState(false);
  const [performanceStatus, setPerformanceStatus] = useState<'good' | 'warning' | 'critical'>('good');
  
  const renderStartTime = useRef<number>(0);
  const renderTimes = useRef<number[]>([]);
  const interactionStartTime = useRef<number>(0);
  const componentMountedRef = useRef(true);

  // 开始渲染时间测量
  const startRenderMeasure = useCallback(() => {
    if (opts.trackRenderTime) {
      renderStartTime.current = performance.now();
    }
  }, [opts.trackRenderTime]);

  // 结束渲染时间测量
  const endRenderMeasure = useCallback(() => {
    if (opts.trackRenderTime && renderStartTime.current > 0) {
      const renderTime = performance.now() - renderStartTime.current;
      renderTimes.current.push(renderTime);
      
      // 只保留最近20次渲染时间
      if (renderTimes.current.length > 20) {
        renderTimes.current.shift();
      }

      // 记录到性能分析器
      recordPerformanceMetric({
        name: 'component-render-time',
        value: renderTime,
        category: 'render',
        component: opts.componentName,
        details: { renderCount: renderTimes.current.length }
      });

      // 更新指标
      const averageRenderTime = renderTimes.current.reduce((sum, time) => sum + time, 0) / renderTimes.current.length;
      
      if (componentMountedRef.current) {
        setMetrics(prev => ({
          ...prev,
          renderTime,
          renderCount: prev.renderCount + 1,
          averageRenderTime
        }));

        // 检查性能状态
        checkPerformanceStatus(renderTime, averageRenderTime);
      }

      renderStartTime.current = 0;
    }
  }, [opts.trackRenderTime, opts.componentName, opts.thresholds.renderTime]);

  // 记录用户交互
  const recordInteraction = useCallback((interactionType: string) => {
    if (opts.trackInteractions) {
      const now = performance.now();
      
      if (interactionStartTime.current > 0) {
        const delay = now - interactionStartTime.current;
        
        recordPerformanceMetric({
          name: 'interaction-delay',
          value: delay,
          category: 'user-interaction',
          component: opts.componentName,
          details: { interactionType }
        });

        if (componentMountedRef.current) {
          setMetrics(prev => ({
            ...prev,
            lastInteractionDelay: delay
          }));
        }
      }
      
      interactionStartTime.current = now;
    }
  }, [opts.trackInteractions, opts.componentName]);

  // 记录自定义指标
  const recordCustomMetric = useCallback((
    name: string, 
    value: number, 
    category: string = 'custom'
  ) => {
    recordPerformanceMetric({
      name,
      value,
      category: category as any,
      component: opts.componentName
    });
  }, [opts.componentName]);

  // 检查性能状态
  const checkPerformanceStatus = useCallback((
    currentRenderTime: number,
    averageRenderTime: number
  ) => {
    const renderThreshold = opts.thresholds.renderTime!;
    
    let status: 'good' | 'warning' | 'critical' = 'good';
    let warnings = false;

    if (averageRenderTime > renderThreshold * 2) {
      status = 'critical';
      warnings = true;
    } else if (averageRenderTime > renderThreshold) {
      status = 'warning';
      warnings = true;
    } else if (currentRenderTime > renderThreshold * 1.5) {
      warnings = true;
    }

    setPerformanceStatus(status);
    setHasWarnings(warnings);

    // 在开发环境中输出警告
    if (process.env.NODE_ENV === 'development' && warnings) {
      console.warn(
        `⚠️ Performance warning in ${opts.componentName}: ` +
        `render time ${currentRenderTime.toFixed(2)}ms (avg: ${averageRenderTime.toFixed(2)}ms, threshold: ${renderThreshold}ms)`
      );
    }
  }, [opts.componentName, opts.thresholds.renderTime]);

  // 获取性能报告
  const getReport = useCallback(() => {
    return performanceAnalyzer.generateReport();
  }, []);

  // 更新内存使用情况
  const updateMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
      
      if (componentMountedRef.current) {
        setMetrics(prev => ({
          ...prev,
          memoryUsage
        }));
      }
    }
  }, []);

  // 自动监控效果
  useEffect(() => {
    componentMountedRef.current = true;

    if (opts.autoMonitor) {
      const interval = setInterval(() => {
        updateMemoryUsage();
      }, opts.interval);

      return () => {
        clearInterval(interval);
      };
    }
  }, [opts.autoMonitor, opts.interval, updateMemoryUsage]);

  // 组件卸载清理
  useEffect(() => {
    return () => {
      componentMountedRef.current = false;
    };
  }, []);

  // 自动开始渲染测量（如果启用）
  useEffect(() => {
    if (opts.trackRenderTime) {
      startRenderMeasure();
    }
  });

  // 自动结束渲染测量（在每次渲染后）
  useEffect(() => {
    if (opts.trackRenderTime && renderStartTime.current > 0) {
      endRenderMeasure();
    }
  });

  return {
    metrics,
    startRenderMeasure,
    endRenderMeasure,
    recordInteraction,
    recordCustomMetric,
    getReport,
    hasWarnings,
    performanceStatus
  };
}

/**
 * 简化版性能监控Hook
 * 只监控基本的渲染性能
 */
export function useSimplePerformanceMonitoring(componentName?: string) {
  const { metrics, hasWarnings, performanceStatus } = usePerformanceMonitoring({
    componentName,
    autoMonitor: true,
    trackRenderTime: true,
    trackInteractions: false
  });

  return {
    renderTime: metrics.renderTime,
    averageRenderTime: metrics.averageRenderTime,
    renderCount: metrics.renderCount,
    hasWarnings,
    performanceStatus
  };
}

/**
 * 交互性能监控Hook
 * 专门监控用户交互性能
 */
export function useInteractionPerformanceMonitoring(componentName?: string) {
  const { recordInteraction, metrics } = usePerformanceMonitoring({
    componentName,
    autoMonitor: false,
    trackRenderTime: false,
    trackInteractions: true
  });

  // 包装常见的交互事件
  const trackClick = useCallback(() => recordInteraction('click'), [recordInteraction]);
  const trackChange = useCallback(() => recordInteraction('change'), [recordInteraction]);
  const trackSubmit = useCallback(() => recordInteraction('submit'), [recordInteraction]);
  const trackFocus = useCallback(() => recordInteraction('focus'), [recordInteraction]);

  return {
    trackClick,
    trackChange,
    trackSubmit,
    trackFocus,
    trackCustomInteraction: recordInteraction,
    lastInteractionDelay: metrics.lastInteractionDelay
  };
}

/**
 * 开发环境性能监控Hook
 * 提供详细的性能调试信息
 */
export function useDevPerformanceMonitoring(componentName?: string) {
  const monitoring = usePerformanceMonitoring({
    componentName,
    autoMonitor: true,
    trackRenderTime: true,
    trackInteractions: true,
    interval: 2000, // 更频繁的监控
    thresholds: {
      renderTime: 10, // 更严格的阈值
      interactionDelay: 50
    }
  });

  // 在开发环境中输出详细日志
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        const report = monitoring.getReport();
        console.group(`🔍 Performance Report - ${componentName}`);
        console.log('Current Metrics:', monitoring.metrics);
        console.log('Performance Status:', monitoring.performanceStatus);
        console.log('Has Warnings:', monitoring.hasWarnings);
        console.log('Full Report:', report);
        console.groupEnd();
      }, 10000); // 每10秒输出一次

      return () => clearInterval(interval);
    }
  }, [componentName, monitoring]);

  return monitoring;
}
