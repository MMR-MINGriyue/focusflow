/**
 * 性能回归测试套件
 * 
 * 确保性能优化后不出现性能退化
 * 建立性能基准和监控体系
 */

import { performanceAnalyzer, recordPerformanceMetric } from '../../../src/utils/performanceAnalyzer';
import { memoryOptimizer } from '../../../src/utils/performanceOptimizer';

// 性能基准配置
const PERFORMANCE_BASELINES = {
  renderTime: {
    target: 16, // ms
    warning: 20, // ms
    critical: 32 // ms
  },
  memoryUsage: {
    target: 20, // MB
    warning: 50, // MB
    critical: 100 // MB
  },
  interactionDelay: {
    target: 100, // ms
    warning: 200, // ms
    critical: 500 // ms
  },
  fps: {
    target: 60, // fps
    warning: 45, // fps
    critical: 30 // fps
  }
};

// 测试配置
const TEST_CONFIG = {
  iterations: 10,
  warmupIterations: 3,
  timeout: 30000,
  memoryCheckInterval: 1000
};

describe('Performance Regression Tests', () => {
  beforeAll(() => {
    // 清理性能数据
    performanceAnalyzer.clearOldMetrics(0);
    
    // 启动内存监控
    memoryOptimizer.startAutoCleanup(TEST_CONFIG.memoryCheckInterval);
  });

  afterAll(() => {
    // 生成最终性能报告
    const report = performanceAnalyzer.generateReport();
    console.log('📊 Final Performance Report:', JSON.stringify(report, null, 2));
  });

  describe('Render Performance Regression', () => {
    it('should maintain render time baseline', () => {
      const renderTimes: number[] = [];
      
      // 预热
      for (let i = 0; i < TEST_CONFIG.warmupIterations; i++) {
        const start = performance.now();
        // 模拟渲染操作
        simulateRenderOperation();
        const end = performance.now();
        renderTimes.push(end - start);
      }

      // 实际测试
      const testRenderTimes: number[] = [];
      for (let i = 0; i < TEST_CONFIG.iterations; i++) {
        const start = performance.now();
        simulateRenderOperation();
        const end = performance.now();
        
        const renderTime = end - start;
        testRenderTimes.push(renderTime);
        
        recordPerformanceMetric({
          name: 'render-time-regression',
          value: renderTime,
          category: 'render'
        });
      }

      // 分析结果
      const averageRenderTime = testRenderTimes.reduce((sum, time) => sum + time, 0) / testRenderTimes.length;
      const maxRenderTime = Math.max(...testRenderTimes);
      const minRenderTime = Math.min(...testRenderTimes);

      console.log(`🎯 Render Performance Results:
        Average: ${averageRenderTime.toFixed(2)}ms
        Max: ${maxRenderTime.toFixed(2)}ms
        Min: ${minRenderTime.toFixed(2)}ms
        Target: ${PERFORMANCE_BASELINES.renderTime.target}ms`);

      // 断言
      expect(averageRenderTime).toBeLessThan(PERFORMANCE_BASELINES.renderTime.target);
      expect(maxRenderTime).toBeLessThan(PERFORMANCE_BASELINES.renderTime.critical);
      
      // 性能一致性检查
      const standardDeviation = calculateStandardDeviation(testRenderTimes);
      expect(standardDeviation).toBeLessThan(PERFORMANCE_BASELINES.renderTime.target * 0.3); // 标准差不超过目标的30%
    });

    it('should maintain consistent render performance under load', () => {
      const loadTestIterations = 50;
      const renderTimes: number[] = [];

      for (let i = 0; i < loadTestIterations; i++) {
        const start = performance.now();
        
        // 模拟高负载渲染
        simulateHighLoadRender();
        
        const end = performance.now();
        const renderTime = end - start;
        renderTimes.push(renderTime);

        recordPerformanceMetric({
          name: 'render-time-load-test',
          value: renderTime,
          category: 'render'
        });
      }

      const averageRenderTime = renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
      const p95RenderTime = calculatePercentile(renderTimes, 95);

      console.log(`🔥 Load Test Results:
        Average: ${averageRenderTime.toFixed(2)}ms
        P95: ${p95RenderTime.toFixed(2)}ms`);

      expect(averageRenderTime).toBeLessThan(PERFORMANCE_BASELINES.renderTime.warning);
      expect(p95RenderTime).toBeLessThan(PERFORMANCE_BASELINES.renderTime.critical);
    });
  });

  describe('Memory Performance Regression', () => {
    it('should maintain memory usage baseline', () => {
      const initialMemory = getCurrentMemoryUsage();
      const memorySnapshots: number[] = [initialMemory];

      // 执行内存密集操作
      for (let i = 0; i < TEST_CONFIG.iterations; i++) {
        simulateMemoryIntensiveOperation();
        
        const currentMemory = getCurrentMemoryUsage();
        memorySnapshots.push(currentMemory);

        recordPerformanceMetric({
          name: 'memory-usage-regression',
          value: currentMemory,
          category: 'memory'
        });
      }

      const finalMemory = getCurrentMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;
      const maxMemory = Math.max(...memorySnapshots);

      console.log(`💾 Memory Performance Results:
        Initial: ${initialMemory.toFixed(2)}MB
        Final: ${finalMemory.toFixed(2)}MB
        Increase: ${memoryIncrease.toFixed(2)}MB
        Max: ${maxMemory.toFixed(2)}MB`);

      expect(finalMemory).toBeLessThan(PERFORMANCE_BASELINES.memoryUsage.target);
      expect(memoryIncrease).toBeLessThan(5); // 内存增长不超过5MB
      expect(maxMemory).toBeLessThan(PERFORMANCE_BASELINES.memoryUsage.warning);
    });

    it('should detect memory leaks', () => {
      const initialMemory = getCurrentMemoryUsage();
      
      // 创建和销毁大量对象
      for (let i = 0; i < 100; i++) {
        createAndDestroyObjects();
      }

      // 强制垃圾回收
      if ('gc' in global && typeof (global as any).gc === 'function') {
        (global as any).gc();
      }

      // 等待垃圾回收完成
      setTimeout(() => {
        const finalMemory = getCurrentMemoryUsage();
        const memoryLeak = finalMemory - initialMemory;

        console.log(`🔍 Memory Leak Test:
          Initial: ${initialMemory.toFixed(2)}MB
          Final: ${finalMemory.toFixed(2)}MB
          Potential Leak: ${memoryLeak.toFixed(2)}MB`);

        // 允许少量内存增长（小于2MB）
        expect(memoryLeak).toBeLessThan(2);
      }, 1000);
    });
  });

  describe('Interaction Performance Regression', () => {
    it('should maintain interaction response time baseline', () => {
      const interactionDelays: number[] = [];

      for (let i = 0; i < TEST_CONFIG.iterations; i++) {
        const start = performance.now();
        
        // 模拟用户交互
        simulateUserInteraction();
        
        const end = performance.now();
        const delay = end - start;
        interactionDelays.push(delay);

        recordPerformanceMetric({
          name: 'interaction-delay-regression',
          value: delay,
          category: 'user-interaction'
        });
      }

      const averageDelay = interactionDelays.reduce((sum, delay) => sum + delay, 0) / interactionDelays.length;
      const maxDelay = Math.max(...interactionDelays);

      console.log(`⚡ Interaction Performance Results:
        Average Delay: ${averageDelay.toFixed(2)}ms
        Max Delay: ${maxDelay.toFixed(2)}ms
        Target: ${PERFORMANCE_BASELINES.interactionDelay.target}ms`);

      expect(averageDelay).toBeLessThan(PERFORMANCE_BASELINES.interactionDelay.target);
      expect(maxDelay).toBeLessThan(PERFORMANCE_BASELINES.interactionDelay.warning);
    });
  });

  describe('Overall Performance Health', () => {
    it('should maintain overall performance score', () => {
      // 生成性能报告
      const report = performanceAnalyzer.generateReport();
      
      console.log(`📈 Performance Health Check:
        Overall Score: ${report.summary.overallScore}
        Critical Issues: ${report.summary.criticalIssues}
        Warnings: ${report.summary.warnings}
        Good Metrics: ${report.summary.goodMetrics}`);

      // 性能健康度检查
      expect(report.summary.overallScore).toBeGreaterThanOrEqual(80); // 总分不低于80
      expect(report.summary.criticalIssues).toBe(0); // 无关键问题
      expect(report.summary.warnings).toBeLessThanOrEqual(2); // 警告不超过2个
    });

    it('should provide performance recommendations', () => {
      const report = performanceAnalyzer.generateReport();
      
      // 检查是否有高优先级建议
      const highPriorityRecommendations = report.recommendations.filter(r => r.priority === 'high');
      
      console.log(`💡 Performance Recommendations:
        High Priority: ${highPriorityRecommendations.length}
        Total: ${report.recommendations.length}`);

      // 不应该有高优先级的性能问题
      expect(highPriorityRecommendations.length).toBe(0);
    });
  });
});

// 辅助函数

function simulateRenderOperation(): void {
  // 模拟DOM操作和样式计算
  const element = document.createElement('div');
  element.style.transform = 'translateX(100px)';
  element.style.opacity = '0.5';
  document.body.appendChild(element);
  document.body.removeChild(element);
}

function simulateHighLoadRender(): void {
  // 模拟高负载渲染
  for (let i = 0; i < 10; i++) {
    simulateRenderOperation();
  }
}

function simulateMemoryIntensiveOperation(): void {
  // 模拟内存密集操作
  const largeArray = new Array(1000).fill(0).map((_, i) => ({
    id: i,
    data: new Array(100).fill(Math.random())
  }));
  
  // 模拟处理
  largeArray.forEach(item => {
    item.data.sort();
  });
}

function simulateUserInteraction(): void {
  // 模拟用户交互处理
  const event = new Event('click');
  document.dispatchEvent(event);
  
  // 模拟状态更新
  const state = { count: Math.random() };
  JSON.stringify(state);
}

function createAndDestroyObjects(): void {
  // 创建对象
  const objects = new Array(100).fill(0).map(() => ({
    data: new Array(100).fill(Math.random()),
    timestamp: Date.now()
  }));
  
  // 模拟使用
  objects.forEach(obj => {
    obj.data.reduce((sum, val) => sum + val, 0);
  });
  
  // 对象会被垃圾回收
}

function getCurrentMemoryUsage(): number {
  const memory = (performance as any).memory;
  if (memory) {
    return memory.usedJSHeapSize / 1024 / 1024; // MB
  }
  return 0;
}

function calculateStandardDeviation(values: number[]): number {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function calculatePercentile(values: number[], percentile: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}
