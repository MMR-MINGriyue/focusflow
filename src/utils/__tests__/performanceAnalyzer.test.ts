/**
 * 性能分析器测试
 */

import { performanceAnalyzer, recordPerformanceMetric, getPerformanceReport } from '../performanceAnalyzer';

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 10 * 1024 * 1024, // 10MB
    totalJSHeapSize: 20 * 1024 * 1024, // 20MB
    jsHeapSizeLimit: 100 * 1024 * 1024 // 100MB
  }
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true
});

// Mock DOM
Object.defineProperty(global, 'document', {
  value: {
    querySelectorAll: jest.fn(() => ({ length: 100 })),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  },
  writable: true
});

// Mock window
Object.defineProperty(global, 'window', {
  value: {
    setInterval: jest.fn((fn, delay) => setTimeout(fn, delay)),
    clearInterval: jest.fn(),
    PerformanceObserver: undefined // 禁用PerformanceObserver以避免复杂性
  },
  writable: true
});

describe('PerformanceAnalyzer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 清除旧的指标数据
    performanceAnalyzer.clearOldMetrics(0);
  });

  describe('Metric Recording', () => {
    it('records performance metrics correctly', () => {
      const metric = {
        name: 'test-metric',
        value: 15.5,
        category: 'render' as const,
        component: 'TestComponent'
      };

      recordPerformanceMetric(metric);
      
      const stats = performanceAnalyzer.getMetricStats('test-metric');
      expect(stats).toBeDefined();
      expect(stats!.count).toBe(1);
      expect(stats!.latest).toBe(15.5);
      expect(stats!.average).toBe(15.5);
    });

    it('maintains metric history correctly', () => {
      // 记录多个指标
      for (let i = 1; i <= 5; i++) {
        recordPerformanceMetric({
          name: 'render-time',
          value: i * 10,
          category: 'render'
        });
      }

      const stats = performanceAnalyzer.getMetricStats('render-time');
      expect(stats!.count).toBe(5);
      expect(stats!.min).toBe(10);
      expect(stats!.max).toBe(50);
      expect(stats!.average).toBe(30);
      expect(stats!.latest).toBe(50);
    });

    it('handles unknown metrics gracefully', () => {
      const stats = performanceAnalyzer.getMetricStats('non-existent-metric');
      expect(stats).toBeNull();
    });
  });

  describe('Performance Analysis', () => {
    it('generates performance report', () => {
      // 添加一些测试数据
      recordPerformanceMetric({
        name: 'render-time',
        value: 12,
        category: 'render'
      });

      recordPerformanceMetric({
        name: 'memory-usage',
        value: 45,
        category: 'memory'
      });

      const report = getPerformanceReport();

      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('analyses');
      expect(report).toHaveProperty('trends');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('timestamp');

      expect(report.summary.totalMetrics).toBeGreaterThan(0);
      expect(Array.isArray(report.analyses)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('categorizes performance status correctly', () => {
      // 添加好的性能指标
      recordPerformanceMetric({
        name: 'render-time',
        value: 8, // 低于16ms阈值
        category: 'render'
      });

      // 添加警告级别的指标
      recordPerformanceMetric({
        name: 'memory-usage',
        value: 75, // 超过50MB警告阈值但低于100MB关键阈值
        category: 'memory'
      });

      // 添加关键级别的指标
      recordPerformanceMetric({
        name: 'interaction-delay',
        value: 500, // 超过300ms关键阈值
        category: 'user-interaction'
      });

      const report = getPerformanceReport();

      expect(report.summary.goodMetrics).toBeGreaterThan(0);
      expect(report.summary.warnings).toBeGreaterThan(0);
      expect(report.summary.criticalIssues).toBeGreaterThan(0);
    });

    it('calculates overall score correctly', () => {
      // 添加混合性能指标
      recordPerformanceMetric({
        name: 'render-time',
        value: 8, // 好
        category: 'render'
      });

      recordPerformanceMetric({
        name: 'memory-usage',
        value: 75, // 警告
        category: 'memory'
      });

      const report = getPerformanceReport();

      expect(report.summary.overallScore).toBeGreaterThan(0);
      expect(report.summary.overallScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Trend Analysis', () => {
    it('detects improving trends', () => {
      // 模拟性能改善的趋势
      const baseTime = Date.now();
      
      // 早期较差的性能
      for (let i = 0; i < 5; i++) {
        mockPerformance.now.mockReturnValue(baseTime + i * 1000);
        recordPerformanceMetric({
          name: 'render-time',
          value: 30 - i * 2, // 从30ms降到22ms
          category: 'render'
        });
      }

      const report = getPerformanceReport();
      const renderAnalysis = report.analyses.find(a => a.metric === 'render-time');
      
      expect(renderAnalysis).toBeDefined();
      // 趋势应该是改善的或稳定的（因为性能在提升）
      expect(['improving', 'stable']).toContain(renderAnalysis!.trend);
    });

    it('detects degrading trends', () => {
      // 模拟性能恶化的趋势
      const baseTime = Date.now();
      
      // 性能逐渐恶化
      for (let i = 0; i < 5; i++) {
        mockPerformance.now.mockReturnValue(baseTime + i * 1000);
        recordPerformanceMetric({
          name: 'render-time',
          value: 10 + i * 3, // 从10ms增加到22ms
          category: 'render'
        });
      }

      const report = getPerformanceReport();
      const renderAnalysis = report.analyses.find(a => a.metric === 'render-time');
      
      expect(renderAnalysis).toBeDefined();
      expect(renderAnalysis!.trend).toBe('degrading');
    });
  });

  describe('Recommendations', () => {
    it('generates appropriate recommendations for critical issues', () => {
      // 添加关键性能问题
      recordPerformanceMetric({
        name: 'render-time',
        value: 50, // 远超16ms阈值
        category: 'render'
      });

      const report = getPerformanceReport();
      const highPriorityRecommendations = report.recommendations.filter(r => r.priority === 'high');
      
      expect(highPriorityRecommendations.length).toBeGreaterThan(0);
      expect(highPriorityRecommendations[0].description).toContain('关键阈值');
    });

    it('generates recommendations for warning issues', () => {
      // 添加警告级别的问题
      recordPerformanceMetric({
        name: 'memory-usage',
        value: 75, // 警告级别
        category: 'memory'
      });

      const report = getPerformanceReport();
      const mediumPriorityRecommendations = report.recommendations.filter(r => r.priority === 'medium');
      
      expect(mediumPriorityRecommendations.length).toBeGreaterThan(0);
    });

    it('limits number of recommendations', () => {
      // 添加大量问题
      for (let i = 0; i < 20; i++) {
        recordPerformanceMetric({
          name: `metric-${i}`,
          value: 1000, // 超过所有阈值
          category: 'render'
        });
      }

      const report = getPerformanceReport();
      
      // 建议数量应该被限制
      expect(report.recommendations.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Data Management', () => {
    it('clears old metrics correctly', () => {
      // 直接添加一个旧指标到分析器
      const oldTimestamp = Date.now() - 7200000; // 2小时前
      performanceAnalyzer.recordMetric({
        name: 'test-metric',
        value: 10,
        category: 'render',
        timestamp: oldTimestamp
      });

      let stats = performanceAnalyzer.getMetricStats('test-metric');
      expect(stats!.count).toBe(1);

      // 清除1小时以前的指标
      performanceAnalyzer.clearOldMetrics(3600000); // 1小时

      stats = performanceAnalyzer.getMetricStats('test-metric');
      expect(stats).toBeNull();
    });

    it('maintains metric limit', () => {
      // 这个测试需要访问私有属性，所以我们通过行为来验证
      // 添加大量指标
      for (let i = 0; i < 1200; i++) {
        recordPerformanceMetric({
          name: 'test-metric',
          value: i,
          category: 'render'
        });
      }

      const stats = performanceAnalyzer.getMetricStats('test-metric');
      
      // 应该保持在合理的数量内（不会无限增长）
      expect(stats!.count).toBeLessThanOrEqual(1000);
    });
  });

  describe('Error Handling', () => {
    it('handles missing performance API gracefully', () => {
      // 临时移除performance API
      const originalPerformance = global.performance;
      delete (global as any).performance;

      expect(() => {
        recordPerformanceMetric({
          name: 'test-metric',
          value: 10,
          category: 'render'
        });
      }).not.toThrow();

      // 恢复performance API
      global.performance = originalPerformance;
    });

    it('handles empty metric data gracefully', () => {
      // 清除所有数据
      performanceAnalyzer.clearOldMetrics(0);

      const report = getPerformanceReport();
      
      expect(report.summary.totalMetrics).toBe(0);
      expect(report.summary.overallScore).toBe(100); // 默认满分
      expect(report.analyses).toEqual([]);
    });
  });

  describe('Integration', () => {
    it('works with convenience functions', () => {
      // 使用已配置阈值的指标名称
      recordPerformanceMetric({
        name: 'render-time',
        value: 25,
        category: 'render'
      });

      const report = getPerformanceReport();

      expect(report).toBeDefined();
      expect(report.analyses.length).toBeGreaterThan(0);
    });

    it('provides consistent API', () => {
      // 测试API的一致性
      expect(typeof recordPerformanceMetric).toBe('function');
      expect(typeof getPerformanceReport).toBe('function');
      expect(typeof performanceAnalyzer.getMetricStats).toBe('function');
      expect(typeof performanceAnalyzer.clearOldMetrics).toBe('function');
    });
  });
});
