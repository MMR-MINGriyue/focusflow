/**
 * 状态调试器
 * 用于监控和调试Zustand状态管理的性能
 */
import React from 'react';

// 性能指标接口
interface PerformanceMetrics {
  renderCount: number;
  averageRenderTime: number;
  stateChangeCount: number;
  subscriptionCount: number;
  memoryUsage: number;
  lastUpdateTime: number;
}

// 调试信息接口
interface DebugInfo {
  storeName: string;
  state: any;
  metrics: PerformanceMetrics;
  history: Array<{
    timestamp: number;
    action: string;
    state: any;
  }>;
}

/**
 * 状态调试器类
 */
class StateDebugger {
  private metrics: PerformanceMetrics = {
    renderCount: 0,
    averageRenderTime: 0,
    stateChangeCount: 0,
    subscriptionCount: 0,
    memoryUsage: 0,
    lastUpdateTime: Date.now()
  };

  private history: Array<{
    timestamp: number;
    action: string;
    state: any;
  }> = [];

  private renderTimes: number[] = [];
  private maxHistorySize = 100;

  /**
   * 记录渲染开始
   */
  startRender(): number {
    return performance.now();
  }

  /**
   * 记录渲染结束
   */
  endRender(startTime: number): void {
    const renderTime = performance.now() - startTime;
    this.renderTimes.push(renderTime);
    
    // 保持最近100次渲染记录
    if (this.renderTimes.length > 100) {
      this.renderTimes.shift();
    }

    this.metrics.renderCount++;
    this.metrics.averageRenderTime = 
      this.renderTimes.reduce((sum, time) => sum + time, 0) / this.renderTimes.length;
  }

  /**
   * 记录状态变化
   */
  recordStateChange(action: string, newState: any): void {
    this.metrics.stateChangeCount++;
    this.metrics.lastUpdateTime = Date.now();

    // 添加到历史记录
    this.history.push({
      timestamp: Date.now(),
      action,
      state: JSON.parse(JSON.stringify(newState)) // 深拷贝状态
    });

    // 保持历史记录大小
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * 记录订阅数量
   */
  updateSubscriptionCount(count: number): void {
    this.metrics.subscriptionCount = count;
  }

  /**
   * 更新内存使用情况
   */
  updateMemoryUsage(): void {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      this.metrics.memoryUsage = memInfo.usedJSHeapSize / 1024 / 1024; // MB
    }
  }

  /**
   * 获取性能指标
   */
  getMetrics(): PerformanceMetrics {
    this.updateMemoryUsage();
    return { ...this.metrics };
  }

  /**
   * 获取调试信息
   */
  getDebugInfo(storeName: string, currentState: any): DebugInfo {
    return {
      storeName,
      state: currentState,
      metrics: this.getMetrics(),
      history: [...this.history]
    };
  }

  /**
   * 检查性能问题
   */
  checkPerformanceIssues(): string[] {
    const issues: string[] = [];
    const metrics = this.getMetrics();

    // 检查渲染性能
    if (metrics.averageRenderTime > 16) {
      issues.push(`平均渲染时间过长: ${metrics.averageRenderTime.toFixed(2)}ms`);
    }

    // 检查状态变化频率
    const now = Date.now();
    const recentChanges = this.history.filter(
      entry => now - entry.timestamp < 1000
    ).length;
    
    if (recentChanges > 10) {
      issues.push(`状态变化过于频繁: ${recentChanges}次/秒`);
    }

    // 检查内存使用
    if (metrics.memoryUsage > 100) {
      issues.push(`内存使用过高: ${metrics.memoryUsage.toFixed(2)}MB`);
    }

    // 检查订阅数量
    if (metrics.subscriptionCount > 20) {
      issues.push(`订阅数量过多: ${metrics.subscriptionCount}`);
    }

    return issues;
  }

  /**
   * 生成性能报告
   */
  generatePerformanceReport(): string {
    const metrics = this.getMetrics();
    const issues = this.checkPerformanceIssues();

    return `
=== 状态管理性能报告 ===
渲染次数: ${metrics.renderCount}
平均渲染时间: ${metrics.averageRenderTime.toFixed(2)}ms
状态变化次数: ${metrics.stateChangeCount}
订阅数量: ${metrics.subscriptionCount}
内存使用: ${metrics.memoryUsage.toFixed(2)}MB
最后更新: ${new Date(metrics.lastUpdateTime).toLocaleTimeString()}

${issues.length > 0 ? `
性能问题:
${issues.map(issue => `- ${issue}`).join('\n')}
` : '✅ 未发现性能问题'}

最近状态变化:
${this.history.slice(-5).map(entry => 
  `${new Date(entry.timestamp).toLocaleTimeString()}: ${entry.action}`
).join('\n')}
    `.trim();
  }

  /**
   * 清除历史记录
   */
  clearHistory(): void {
    this.history = [];
    this.renderTimes = [];
    this.metrics = {
      renderCount: 0,
      averageRenderTime: 0,
      stateChangeCount: 0,
      subscriptionCount: 0,
      memoryUsage: 0,
      lastUpdateTime: Date.now()
    };
  }

  /**
   * 导出调试数据
   */
  exportDebugData(): string {
    return JSON.stringify({
      metrics: this.getMetrics(),
      history: this.history,
      issues: this.checkPerformanceIssues(),
      timestamp: new Date().toISOString()
    }, null, 2);
  }
}

// 创建全局调试器实例
const stateDebugger = new StateDebugger();

/**
 * 调试面板组件
 */
export const DebugPanel: React.FC = () => {
  const metrics = stateDebugger.getMetrics();
  const issues = stateDebugger.checkPerformanceIssues();

  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>Timer State Debug</h4>
      <div>Renders: {metrics.renderCount}</div>
      <div>Avg Render: {metrics.averageRenderTime.toFixed(2)}ms</div>
      <div>State Changes: {metrics.stateChangeCount}</div>
      <div>Subscriptions: {metrics.subscriptionCount}</div>
      
      {issues.length > 0 && (
        <div style={{ color: 'orange', marginTop: '5px' }}>
          <strong>Issues:</strong>
          {issues.map((issue, index) => (
            <div key={index}>• {issue}</div>
          ))}
        </div>
      )}
      
      <button
        onClick={() => console.log(stateDebugger.generatePerformanceReport())}
        style={{
          marginTop: '5px',
          padding: '2px 5px',
          fontSize: '10px',
          background: '#333',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        Log Report
      </button>
    </div>
  );
};

export default stateDebugger;