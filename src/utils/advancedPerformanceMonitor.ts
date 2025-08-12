/**
 * 高级性能监控器
 * 提供更精确的渲染时间监控和性能分析
 */

import React from 'react';

interface AdvancedPerformanceMetrics {
  componentName: string;
  renderTime: number;
  updateTime: number;
  memoryUsage: number;
  fps: number;
  timestamp: number;
  details: {
    propsChanged: string[];
    stateChanged: boolean;
    childrenCount: number;
    domOperations: number;
  };
}

interface PerformanceAlert {
  type: 'warning' | 'error';
  message: string;
  metrics: AdvancedPerformanceMetrics;
  timestamp: number;
}

class AdvancedPerformanceMonitor {
  private metrics: Map<string, AdvancedPerformanceMetrics[]> = new Map();
  private alerts: PerformanceAlert[] = [];
  private observers: ((alert: PerformanceAlert) => void)[] = [];
  private isMonitoring = false;
  private frameId: number | null = null;
  private lastFrameTime = 0;
  private frameCount = 0;

  // 性能阈值
  private readonly thresholds = {
    renderTime: 16, // 16ms for 60fps
    updateTime: 8,  // 8ms for fast updates
    memoryGrowth: 10, // 10MB growth warning
    fpsMin: 55      // minimum acceptable fps
  };

  /**
   * 开始监控指定组件
   */
  startMonitoring(componentName: string): void {
    if (!this.metrics.has(componentName)) {
      this.metrics.set(componentName, []);
    }

    if (!this.isMonitoring) {
      this.isMonitoring = true;
      this.startFrameMonitoring();
    }
  }

  /**
   * 停止监控
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  /**
   * 记录组件渲染性能
   */
  recordRender(
    componentName: string,
    renderTime: number,
    propsChanged: string[] = [],
    stateChanged = false,
    childrenCount = 0,
    domOperations = 0
  ): void {
    const metrics: AdvancedPerformanceMetrics = {
      componentName,
      renderTime,
      updateTime: renderTime, // 简化实现
      memoryUsage: this.getMemoryUsage(),
      fps: this.getCurrentFPS(),
      timestamp: performance.now(),
      details: {
        propsChanged,
        stateChanged,
        childrenCount,
        domOperations
      }
    };

    // 存储指标
    const componentMetrics = this.metrics.get(componentName) || [];
    componentMetrics.push(metrics);
    
    // 只保留最近100个指标
    if (componentMetrics.length > 100) {
      componentMetrics.shift();
    }
    
    this.metrics.set(componentName, componentMetrics);

    // 检查性能警告
    this.checkPerformanceAlerts(metrics);
  }

  /**
   * 获取组件性能报告
   */
  getPerformanceReport(componentName: string): {
    averageRenderTime: number;
    maxRenderTime: number;
    minRenderTime: number;
    averageFPS: number;
    memoryTrend: 'stable' | 'growing' | 'shrinking';
    recommendations: string[];
  } {
    const componentMetrics = this.metrics.get(componentName) || [];
    
    if (componentMetrics.length === 0) {
      return {
        averageRenderTime: 0,
        maxRenderTime: 0,
        minRenderTime: 0,
        averageFPS: 0,
        memoryTrend: 'stable',
        recommendations: ['No data available']
      };
    }

    const renderTimes = componentMetrics.map(m => m.renderTime);
    const fpsList = componentMetrics.map(m => m.fps);
    const memoryList = componentMetrics.map(m => m.memoryUsage);

    const averageRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
    const maxRenderTime = Math.max(...renderTimes);
    const minRenderTime = Math.min(...renderTimes);
    const averageFPS = fpsList.reduce((a, b) => a + b, 0) / fpsList.length;

    // 分析内存趋势
    const memoryTrend = this.analyzeMemoryTrend(memoryList);

    // 生成建议
    const recommendations = this.generateRecommendations(componentMetrics);

    return {
      averageRenderTime: Math.round(averageRenderTime * 100) / 100,
      maxRenderTime: Math.round(maxRenderTime * 100) / 100,
      minRenderTime: Math.round(minRenderTime * 100) / 100,
      averageFPS: Math.round(averageFPS),
      memoryTrend,
      recommendations
    };
  }

  /**
   * 获取所有性能警告
   */
  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  /**
   * 清除警告
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * 添加性能警告观察者
   */
  addAlertObserver(observer: (alert: PerformanceAlert) => void): void {
    this.observers.push(observer);
  }

  /**
   * 移除性能警告观察者
   */
  removeAlertObserver(observer: (alert: PerformanceAlert) => void): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  /**
   * 开始帧率监控
   */
  private startFrameMonitoring(): void {
    const measureFrame = () => {
      if (!this.isMonitoring) return;

      const now = performance.now();
      if (this.lastFrameTime > 0) {
        this.frameCount++;
      }
      this.lastFrameTime = now;

      this.frameId = requestAnimationFrame(measureFrame);
    };

    measureFrame();
  }

  /**
   * 获取当前FPS
   */
  private getCurrentFPS(): number {
    const now = performance.now();
    const timeDiff = now - this.lastFrameTime;
    return timeDiff > 0 ? 1000 / timeDiff : 0;
  }

  /**
   * 获取内存使用情况
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  /**
   * 检查性能警告
   */
  private checkPerformanceAlerts(metrics: AdvancedPerformanceMetrics): void {
    const alerts: PerformanceAlert[] = [];

    // 检查渲染时间
    if (metrics.renderTime > this.thresholds.renderTime) {
      alerts.push({
        type: 'warning',
        message: `${metrics.componentName} 渲染时间过长: ${metrics.renderTime.toFixed(2)}ms (目标: <${this.thresholds.renderTime}ms)`,
        metrics,
        timestamp: Date.now()
      });
    }

    // 检查FPS
    if (metrics.fps < this.thresholds.fpsMin && metrics.fps > 0) {
      alerts.push({
        type: 'warning',
        message: `${metrics.componentName} FPS过低: ${metrics.fps.toFixed(1)} (目标: >${this.thresholds.fpsMin})`,
        metrics,
        timestamp: Date.now()
      });
    }

    // 检查内存增长
    const componentMetrics = this.metrics.get(metrics.componentName) || [];
    if (componentMetrics.length > 10) {
      const recentMemory = componentMetrics.slice(-10).map(m => m.memoryUsage);
      const memoryGrowth = Math.max(...recentMemory) - Math.min(...recentMemory);
      
      if (memoryGrowth > this.thresholds.memoryGrowth) {
        alerts.push({
          type: 'error',
          message: `${metrics.componentName} 内存增长过快: ${memoryGrowth.toFixed(2)}MB`,
          metrics,
          timestamp: Date.now()
        });
      }
    }

    // 存储并通知警告
    alerts.forEach(alert => {
      this.alerts.push(alert);
      this.observers.forEach(observer => observer(alert));
    });

    // 只保留最近50个警告
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }
  }

  /**
   * 分析内存趋势
   */
  private analyzeMemoryTrend(memoryList: number[]): 'stable' | 'growing' | 'shrinking' {
    if (memoryList.length < 5) return 'stable';

    const recent = memoryList.slice(-5);
    const older = memoryList.slice(-10, -5);
    
    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    const diff = recentAvg - olderAvg;
    
    if (diff > 1) return 'growing';
    if (diff < -1) return 'shrinking';
    return 'stable';
  }

  /**
   * 生成性能建议
   */
  private generateRecommendations(metrics: AdvancedPerformanceMetrics[]): string[] {
    const recommendations: string[] = [];
    
    if (metrics.length === 0) return recommendations;

    const avgRenderTime = metrics.reduce((sum, m) => sum + m.renderTime, 0) / metrics.length;
    const avgFPS = metrics.reduce((sum, m) => sum + m.fps, 0) / metrics.length;

    if (avgRenderTime > this.thresholds.renderTime) {
      recommendations.push('考虑使用React.memo优化组件渲染');
      recommendations.push('检查是否有不必要的重新渲染');
      recommendations.push('优化复杂的计算逻辑');
    }

    if (avgFPS < this.thresholds.fpsMin) {
      recommendations.push('减少动画复杂度');
      recommendations.push('使用CSS transform代替layout属性');
      recommendations.push('考虑降低更新频率');
    }

    const memoryTrend = this.analyzeMemoryTrend(metrics.map(m => m.memoryUsage));
    if (memoryTrend === 'growing') {
      recommendations.push('检查是否存在内存泄漏');
      recommendations.push('确保正确清理事件监听器和定时器');
    }

    if (recommendations.length === 0) {
      recommendations.push('性能表现良好');
    }

    return recommendations;
  }
}

// 创建全局高级性能监控器实例
export const advancedPerformanceMonitor = new AdvancedPerformanceMonitor();

/**
 * React Hook for component performance monitoring
 */
export function useAdvancedPerformanceMonitor(componentName: string) {
  const startTime = React.useRef<number>(0);

  React.useEffect(() => {
    advancedPerformanceMonitor.startMonitoring(componentName);
    
    return () => {
      // 组件卸载时停止监控
      advancedPerformanceMonitor.stopMonitoring();
    };
  }, [componentName]);

  const recordRender = React.useCallback((
    propsChanged: string[] = [],
    stateChanged = false,
    childrenCount = 0,
    domOperations = 0
  ) => {
    const renderTime = performance.now() - startTime.current;
    advancedPerformanceMonitor.recordRender(
      componentName,
      renderTime,
      propsChanged,
      stateChanged,
      childrenCount,
      domOperations
    );
  }, [componentName]);

  const startRender = React.useCallback(() => {
    startTime.current = performance.now();
  }, []);

  return { startRender, recordRender };
}

export default advancedPerformanceMonitor;
