/**
 * 性能分析器
 * 
 * 收集、分析和报告应用运行时的性能数据
 * 识别性能瓶颈和优化机会
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'render' | 'memory' | 'network' | 'user-interaction' | 'custom';
  component?: string;
  details?: Record<string, any>;
}

interface PerformanceThreshold {
  name: string;
  warning: number;
  critical: number;
  unit: string;
}

interface PerformanceAnalysis {
  metric: string;
  status: 'good' | 'warning' | 'critical';
  currentValue: number;
  threshold: PerformanceThreshold;
  trend: 'improving' | 'stable' | 'degrading';
  recommendations: string[];
}

interface PerformanceReport {
  summary: {
    overallScore: number;
    totalMetrics: number;
    criticalIssues: number;
    warnings: number;
    goodMetrics: number;
  };
  analyses: PerformanceAnalysis[];
  trends: {
    renderTime: number[];
    memoryUsage: number[];
    userInteractions: number[];
  };
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: string;
    description: string;
    impact: string;
  }[];
  timestamp: string;
}

class PerformanceAnalyzer {
  private metrics: PerformanceMetric[] = [];
  private thresholds: Map<string, PerformanceThreshold> = new Map();
  private maxMetrics = 1000; // 最多保留1000个指标

  constructor() {
    this.initializeThresholds();
    this.startPerformanceObserver();
  }

  /**
   * 初始化性能阈值
   */
  private initializeThresholds(): void {
    const defaultThresholds: PerformanceThreshold[] = [
      { name: 'render-time', warning: 16, critical: 32, unit: 'ms' },
      { name: 'memory-usage', warning: 50, critical: 100, unit: 'MB' },
      { name: 'fps', warning: 30, critical: 20, unit: 'fps' },
      { name: 'interaction-delay', warning: 100, critical: 300, unit: 'ms' },
      { name: 'bundle-size', warning: 1000, critical: 2000, unit: 'KB' },
      { name: 'network-latency', warning: 500, critical: 1000, unit: 'ms' },
      { name: 'dom-nodes', warning: 1000, critical: 2000, unit: 'nodes' },
      { name: 'event-listeners', warning: 100, critical: 200, unit: 'listeners' }
    ];

    defaultThresholds.forEach(threshold => {
      this.thresholds.set(threshold.name, threshold);
    });
  }

  /**
   * 启动性能观察器
   */
  private startPerformanceObserver(): void {
    // 观察渲染性能
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.recordMetric({
              name: entry.name || 'unknown',
              value: entry.duration || 0,
              timestamp: Date.now(),
              category: 'render',
              details: {
                entryType: entry.entryType,
                startTime: entry.startTime
              }
            });
          });
        });

        observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
      } catch (error) {
        console.warn('PerformanceObserver not supported:', error);
      }
    }

    // 定期收集内存和DOM指标
    setInterval(() => {
      this.collectSystemMetrics();
    }, 5000);
  }

  /**
   * 收集系统指标
   */
  private collectSystemMetrics(): void {
    // 内存使用情况
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.recordMetric({
        name: 'memory-usage',
        value: memory.usedJSHeapSize / 1024 / 1024, // MB
        timestamp: Date.now(),
        category: 'memory',
        details: {
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        }
      });
    }

    // DOM节点数量
    const domNodes = document.querySelectorAll('*').length;
    this.recordMetric({
      name: 'dom-nodes',
      value: domNodes,
      timestamp: Date.now(),
      category: 'render',
      details: { nodeCount: domNodes }
    });

    // 事件监听器数量（估算）
    const eventListeners = this.estimateEventListeners();
    this.recordMetric({
      name: 'event-listeners',
      value: eventListeners,
      timestamp: Date.now(),
      category: 'memory',
      details: { estimated: true }
    });
  }

  /**
   * 估算事件监听器数量
   */
  private estimateEventListeners(): number {
    // 简单估算：基于常见的事件监听器模式
    const elements = document.querySelectorAll('[onclick], [onchange], [onsubmit]');
    const reactElements = document.querySelectorAll('[data-reactroot] *');
    
    // 估算：每个React元素平均0.1个监听器，每个带事件属性的元素1个监听器
    return elements.length + (reactElements.length * 0.1);
  }

  /**
   * 记录性能指标
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // 保持指标数量在限制内
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // 实时检查关键指标
    this.checkCriticalMetrics(metric);
  }

  /**
   * 检查关键指标
   */
  private checkCriticalMetrics(metric: PerformanceMetric): void {
    const threshold = this.thresholds.get(metric.name);
    if (!threshold) return;

    if (metric.value > threshold.critical) {
      console.error(`🚨 Critical performance issue: ${metric.name} = ${metric.value}${threshold.unit} (threshold: ${threshold.critical}${threshold.unit})`);
    } else if (metric.value > threshold.warning) {
      console.warn(`⚠️ Performance warning: ${metric.name} = ${metric.value}${threshold.unit} (threshold: ${threshold.warning}${threshold.unit})`);
    }
  }

  /**
   * 分析性能趋势
   */
  private analyzeTrends(metricName: string, timeWindow: number = 60000): 'improving' | 'stable' | 'degrading' {
    const now = Date.now();
    const recentMetrics = this.metrics
      .filter(m => m.name === metricName && (now - m.timestamp) <= timeWindow)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (recentMetrics.length < 3) return 'stable';

    const firstHalf = recentMetrics.slice(0, Math.floor(recentMetrics.length / 2));
    const secondHalf = recentMetrics.slice(Math.floor(recentMetrics.length / 2));

    const firstAvg = firstHalf.reduce((sum, m) => sum + m.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.value, 0) / secondHalf.length;

    const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (changePercent > 10) return 'degrading';
    if (changePercent < -10) return 'improving';
    return 'stable';
  }

  /**
   * 生成性能分析
   */
  private generateAnalyses(): PerformanceAnalysis[] {
    const analyses: PerformanceAnalysis[] = [];

    this.thresholds.forEach((threshold, metricName) => {
      const recentMetrics = this.metrics
        .filter(m => m.name === metricName)
        .slice(-10); // 最近10个指标

      if (recentMetrics.length === 0) return;

      const currentValue = recentMetrics[recentMetrics.length - 1].value;
      const avgValue = recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length;

      let status: 'good' | 'warning' | 'critical';
      if (avgValue > threshold.critical) {
        status = 'critical';
      } else if (avgValue > threshold.warning) {
        status = 'warning';
      } else {
        status = 'good';
      }

      const trend = this.analyzeTrends(metricName);
      const recommendations = this.generateRecommendations(metricName, status, trend);

      analyses.push({
        metric: metricName,
        status,
        currentValue: Math.round(currentValue * 100) / 100,
        threshold,
        trend,
        recommendations
      });
    });

    return analyses;
  }

  /**
   * 生成优化建议
   */
  private generateRecommendations(metricName: string, status: string, trend: string): string[] {
    const recommendations: string[] = [];

    const recommendationMap: Record<string, Record<string, string[]>> = {
      'render-time': {
        warning: ['使用React.memo优化组件', '减少不必要的重新渲染', '优化CSS选择器'],
        critical: ['检查组件渲染逻辑', '使用虚拟化处理大列表', '分析渲染瓶颈']
      },
      'memory-usage': {
        warning: ['检查内存泄漏', '优化图片和资源加载', '清理未使用的变量'],
        critical: ['立即检查内存泄漏', '减少DOM节点数量', '优化数据结构']
      },
      'fps': {
        warning: ['减少动画复杂度', '使用CSS transform代替position', '优化渲染频率'],
        critical: ['禁用非必要动画', '检查渲染阻塞', '优化JavaScript执行']
      },
      'interaction-delay': {
        warning: ['优化事件处理器', '使用防抖和节流', '减少同步操作'],
        critical: ['检查阻塞操作', '优化异步处理', '减少计算复杂度']
      }
    };

    const metricRecommendations = recommendationMap[metricName];
    if (metricRecommendations && metricRecommendations[status]) {
      recommendations.push(...metricRecommendations[status]);
    }

    if (trend === 'degrading') {
      recommendations.push('性能正在恶化，需要立即关注');
    }

    return recommendations;
  }

  /**
   * 生成性能报告
   */
  generateReport(): PerformanceReport {
    const analyses = this.generateAnalyses();
    
    const summary = {
      overallScore: this.calculateOverallScore(analyses),
      totalMetrics: analyses.length,
      criticalIssues: analyses.filter(a => a.status === 'critical').length,
      warnings: analyses.filter(a => a.status === 'warning').length,
      goodMetrics: analyses.filter(a => a.status === 'good').length
    };

    const trends = {
      renderTime: this.getMetricTrend('render-time'),
      memoryUsage: this.getMetricTrend('memory-usage'),
      userInteractions: this.getMetricTrend('interaction-delay')
    };

    const recommendations = this.generatePriorityRecommendations(analyses);

    return {
      summary,
      analyses,
      trends,
      recommendations,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 计算总体评分
   */
  private calculateOverallScore(analyses: PerformanceAnalysis[]): number {
    if (analyses.length === 0) return 100;

    const scores = analyses.map(analysis => {
      switch (analysis.status) {
        case 'good': return 100;
        case 'warning': return 60;
        case 'critical': return 20;
        default: return 50;
      }
    });

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  /**
   * 获取指标趋势数据
   */
  private getMetricTrend(metricName: string): number[] {
    return this.metrics
      .filter(m => m.name === metricName)
      .slice(-20) // 最近20个数据点
      .map(m => Math.round(m.value * 100) / 100);
  }

  /**
   * 生成优先级建议
   */
  private generatePriorityRecommendations(analyses: PerformanceAnalysis[]): PerformanceReport['recommendations'] {
    const recommendations: PerformanceReport['recommendations'] = [];

    // 关键问题
    analyses.filter(a => a.status === 'critical').forEach(analysis => {
      recommendations.push({
        priority: 'high',
        category: analysis.metric,
        description: `${analysis.metric}超过关键阈值`,
        impact: '严重影响用户体验，需要立即处理'
      });
    });

    // 警告问题
    analyses.filter(a => a.status === 'warning').forEach(analysis => {
      recommendations.push({
        priority: 'medium',
        category: analysis.metric,
        description: `${analysis.metric}接近阈值`,
        impact: '可能影响用户体验，建议优化'
      });
    });

    // 趋势恶化
    analyses.filter(a => a.trend === 'degrading').forEach(analysis => {
      recommendations.push({
        priority: 'medium',
        category: analysis.metric,
        description: `${analysis.metric}性能趋势恶化`,
        impact: '需要监控并采取预防措施'
      });
    });

    return recommendations.slice(0, 10); // 最多返回10个建议
  }

  /**
   * 清除旧数据
   */
  clearOldMetrics(maxAge: number = 3600000): void { // 默认1小时
    const now = Date.now();
    this.metrics = this.metrics.filter(m => (now - m.timestamp) <= maxAge);
  }

  /**
   * 获取指标统计
   */
  getMetricStats(metricName: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    latest: number;
  } | null {
    const metrics = this.metrics.filter(m => m.name === metricName);
    if (metrics.length === 0) return null;

    const values = metrics.map(m => m.value);
    return {
      count: metrics.length,
      average: values.reduce((sum, v) => sum + v, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      latest: values[values.length - 1]
    };
  }
}

// 导出单例实例
export const performanceAnalyzer = new PerformanceAnalyzer();

// 便捷函数
export const recordPerformanceMetric = (metric: Omit<PerformanceMetric, 'timestamp'>) => {
  performanceAnalyzer.recordMetric({
    ...metric,
    timestamp: Date.now()
  });
};

export const getPerformanceReport = () => performanceAnalyzer.generateReport();
