/**
 * 内存优化器
 * 提供内存管理和清理功能，防止内存泄漏
 */

interface CleanupTask {
  id: string;
  cleanup: () => void;
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
}

interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
}

class MemoryOptimizer {
  private cleanupTasks: Map<string, CleanupTask> = new Map();
  private memoryHistory: MemoryStats[] = [];
  private isMonitoring = false;
  private monitoringInterval: number | null = null;
  private cleanupInterval: number | null = null;
  private taskIdCounter = 0;

  // 内存阈值配置
  private readonly thresholds = {
    memoryWarning: 100 * 1024 * 1024, // 100MB
    memoryCritical: 200 * 1024 * 1024, // 200MB
    historyLimit: 100, // 保留最近100个记录
    cleanupInterval: 30000, // 30秒清理一次
    monitoringInterval: 5000 // 5秒监控一次
  };

  /**
   * 注册清理任务
   */
  registerCleanupTask(
    cleanup: () => void,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): () => void {
    const id = `cleanup_${++this.taskIdCounter}_${Date.now()}`;
    
    const task: CleanupTask = {
      id,
      cleanup,
      priority,
      createdAt: Date.now()
    };

    this.cleanupTasks.set(id, task);

    // 返回取消注册函数
    return () => {
      this.cleanupTasks.delete(id);
    };
  }

  /**
   * 手动执行清理
   */
  cleanup(priority?: 'low' | 'medium' | 'high'): void {
    const tasksToRun = priority 
      ? Array.from(this.cleanupTasks.values()).filter(task => task.priority === priority)
      : Array.from(this.cleanupTasks.values());

    // 按优先级排序：high > medium > low
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    tasksToRun.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    let cleanedCount = 0;
    tasksToRun.forEach(task => {
      try {
        task.cleanup();
        cleanedCount++;
      } catch (error) {
        console.warn(`清理任务 ${task.id} 执行失败:`, error);
      }
    });

    console.debug(`内存优化器: 执行了 ${cleanedCount} 个清理任务`);
  }

  /**
   * 开始内存监控
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // 内存使用监控
    this.monitoringInterval = window.setInterval(() => {
      this.recordMemoryUsage();
      this.checkMemoryPressure();
    }, this.thresholds.monitoringInterval);

    // 定期清理
    this.cleanupInterval = window.setInterval(() => {
      this.performScheduledCleanup();
    }, this.thresholds.cleanupInterval);

    console.debug('内存优化器: 开始监控');
  }

  /**
   * 停止内存监控
   */
  stopMonitoring(): void {
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    console.debug('内存优化器: 停止监控');
  }

  /**
   * 获取当前内存使用情况
   */
  getCurrentMemoryUsage(): MemoryStats | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        timestamp: Date.now()
      };
    }
    return null;
  }

  /**
   * 获取内存使用历史
   */
  getMemoryHistory(): MemoryStats[] {
    return [...this.memoryHistory];
  }

  /**
   * 获取内存使用报告
   */
  getMemoryReport(): {
    current: MemoryStats | null;
    average: number;
    peak: number;
    trend: 'stable' | 'increasing' | 'decreasing';
    recommendations: string[];
  } {
    const current = this.getCurrentMemoryUsage();
    
    if (this.memoryHistory.length === 0) {
      return {
        current,
        average: current?.usedJSHeapSize || 0,
        peak: current?.usedJSHeapSize || 0,
        trend: 'stable',
        recommendations: ['内存监控数据不足']
      };
    }

    const usedMemoryList = this.memoryHistory.map(stat => stat.usedJSHeapSize);
    const average = usedMemoryList.reduce((sum, mem) => sum + mem, 0) / usedMemoryList.length;
    const peak = Math.max(...usedMemoryList);

    // 分析趋势
    const trend = this.analyzeMemoryTrend();

    // 生成建议
    const recommendations = this.generateMemoryRecommendations(current, average, peak, trend);

    return {
      current,
      average: Math.round(average),
      peak,
      trend,
      recommendations
    };
  }

  /**
   * 强制垃圾回收（如果可用）
   */
  forceGarbageCollection(): void {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      try {
        (window as any).gc();
        console.debug('内存优化器: 强制垃圾回收完成');
      } catch (error) {
        console.warn('内存优化器: 强制垃圾回收失败', error);
      }
    } else {
      console.debug('内存优化器: 垃圾回收不可用');
    }
  }

  /**
   * 清理所有注册的任务
   */
  clearAllTasks(): void {
    this.cleanup();
    this.cleanupTasks.clear();
    console.debug('内存优化器: 清理所有任务完成');
  }

  /**
   * 记录内存使用情况
   */
  private recordMemoryUsage(): void {
    const stats = this.getCurrentMemoryUsage();
    if (stats) {
      this.memoryHistory.push(stats);

      // 限制历史记录数量
      if (this.memoryHistory.length > this.thresholds.historyLimit) {
        this.memoryHistory.shift();
      }
    }
  }

  /**
   * 检查内存压力
   */
  private checkMemoryPressure(): void {
    const current = this.getCurrentMemoryUsage();
    if (!current) return;

    const usedMemory = current.usedJSHeapSize;

    if (usedMemory > this.thresholds.memoryCritical) {
      console.warn('内存优化器: 内存使用过高，执行紧急清理');
      this.cleanup('high');
      this.forceGarbageCollection();
    } else if (usedMemory > this.thresholds.memoryWarning) {
      console.warn('内存优化器: 内存使用警告，执行中等优先级清理');
      this.cleanup('medium');
    }
  }

  /**
   * 执行定期清理
   */
  private performScheduledCleanup(): void {
    // 清理低优先级任务
    this.cleanup('low');

    // 清理过期的任务注册
    const now = Date.now();
    const expiredTasks = Array.from(this.cleanupTasks.entries())
      .filter(([, task]) => now - task.createdAt > 300000) // 5分钟过期
      .map(([id]) => id);

    expiredTasks.forEach(id => this.cleanupTasks.delete(id));

    if (expiredTasks.length > 0) {
      console.debug(`内存优化器: 清理了 ${expiredTasks.length} 个过期任务`);
    }
  }

  /**
   * 分析内存趋势
   */
  private analyzeMemoryTrend(): 'stable' | 'increasing' | 'decreasing' {
    if (this.memoryHistory.length < 10) return 'stable';

    const recent = this.memoryHistory.slice(-5).map(stat => stat.usedJSHeapSize);
    const older = this.memoryHistory.slice(-10, -5).map(stat => stat.usedJSHeapSize);

    const recentAvg = recent.reduce((sum, mem) => sum + mem, 0) / recent.length;
    const olderAvg = older.reduce((sum, mem) => sum + mem, 0) / older.length;

    const diff = recentAvg - olderAvg;
    const threshold = this.thresholds.memoryWarning * 0.1; // 10% 阈值

    if (diff > threshold) return 'increasing';
    if (diff < -threshold) return 'decreasing';
    return 'stable';
  }

  /**
   * 生成内存建议
   */
  private generateMemoryRecommendations(
    current: MemoryStats | null,
    average: number,
    peak: number,
    trend: 'stable' | 'increasing' | 'decreasing'
  ): string[] {
    const recommendations: string[] = [];

    if (current && current.usedJSHeapSize > this.thresholds.memoryCritical) {
      recommendations.push('内存使用过高，建议立即清理缓存和释放资源');
      recommendations.push('检查是否存在内存泄漏');
    }

    if (trend === 'increasing') {
      recommendations.push('内存使用呈上升趋势，建议增加清理频率');
      recommendations.push('检查长期运行的定时器和事件监听器');
    }

    if (peak > this.thresholds.memoryCritical) {
      recommendations.push('峰值内存使用过高，建议优化大对象的使用');
    }

    if (average > this.thresholds.memoryWarning) {
      recommendations.push('平均内存使用较高，建议优化数据结构');
    }

    if (recommendations.length === 0) {
      recommendations.push('内存使用正常');
    }

    return recommendations;
  }
}

// 创建全局内存优化器实例
export const memoryOptimizer = new MemoryOptimizer();

// 在开发环境中自动启动监控
if (process.env.NODE_ENV === 'development') {
  memoryOptimizer.startMonitoring();
}

export default memoryOptimizer;
