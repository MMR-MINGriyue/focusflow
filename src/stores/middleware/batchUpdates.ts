/**
 * 状态更新批处理中间件
 * 优化状态更新的性能，减少不必要的重渲染
 */

import { StateCreator } from 'zustand';
import { unstable_batchedUpdates } from 'react-dom';

// 批处理配置
interface BatchConfig {
  enabled: boolean;
  batchDelay: number; // ms
  maxBatchSize: number;
  priority: 'high' | 'normal' | 'low';
}

// 批处理队列项
interface BatchItem {
  id: string;
  updater: () => void;
  priority: 'high' | 'normal' | 'low';
  timestamp: number;
}

// 批处理管理器
class BatchUpdateManager {
  private queue: BatchItem[] = [];
  private isProcessing = false;
  private timeoutId: NodeJS.Timeout | null = null;
  
  private config: BatchConfig = {
    enabled: true,
    batchDelay: 16, // ~60fps
    maxBatchSize: 10,
    priority: 'normal'
  };

  constructor(config?: Partial<BatchConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  // 添加更新到批处理队列
  addUpdate(id: string, updater: () => void, priority: 'high' | 'normal' | 'low' = 'normal') {
    if (!this.config.enabled) {
      // 如果批处理被禁用，直接执行更新
      unstable_batchedUpdates(updater);
      return;
    }

    // 检查是否已存在相同ID的更新，如果存在则替换
    const existingIndex = this.queue.findIndex(item => item.id === id);
    const batchItem: BatchItem = {
      id,
      updater,
      priority,
      timestamp: Date.now()
    };

    if (existingIndex !== -1) {
      this.queue[existingIndex] = batchItem;
    } else {
      this.queue.push(batchItem);
    }

    // 如果是高优先级更新，立即处理
    if (priority === 'high') {
      this.processQueue();
      return;
    }

    // 如果队列达到最大大小，立即处理
    if (this.queue.length >= this.config.maxBatchSize) {
      this.processQueue();
      return;
    }

    // 否则延迟处理
    this.scheduleProcessing();
  }

  // 调度批处理
  private scheduleProcessing() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.processQueue();
    }, this.config.batchDelay);
  }

  // 处理批处理队列
  private processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    // 按优先级排序
    const sortedQueue = [...this.queue].sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // 清空队列
    this.queue = [];

    // 批量执行更新
    unstable_batchedUpdates(() => {
      sortedQueue.forEach(item => {
        try {
          item.updater();
        } catch (error) {
          console.error(`Error in batch update ${item.id}:`, error);
        }
      });
    });

    this.isProcessing = false;

    // 如果在处理过程中又有新的更新加入，继续处理
    if (this.queue.length > 0) {
      this.scheduleProcessing();
    }
  }

  // 立即处理所有待处理的更新
  flush() {
    this.processQueue();
  }

  // 清空队列
  clear() {
    this.queue = [];
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  // 获取队列状态
  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      config: this.config
    };
  }

  // 更新配置
  updateConfig(newConfig: Partial<BatchConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}

// 创建全局批处理管理器
const batchManager = new BatchUpdateManager();

// 批处理中间件
export const batchUpdates = <T>(
  config: StateCreator<T, [], [], T>
): StateCreator<T, [], [], T> => (set, get, api) => {
  const batchedSet: typeof set = (updater, replace, action) => {
    const updateId = action || `update_${Date.now()}_${Math.random()}`;
    
    batchManager.addUpdate(
      updateId,
      () => set(updater, replace, action),
      'normal'
    );
  };

  return config(batchedSet, get, api);
};

// 高优先级更新函数
export const setHighPriority = <T>(
  set: (updater: T | Partial<T> | ((state: T) => T | Partial<T>)) => void,
  updater: T | Partial<T> | ((state: T) => T | Partial<T>),
  action?: string
) => {
  const updateId = action || `high_priority_${Date.now()}`;
  
  batchManager.addUpdate(
    updateId,
    () => set(updater),
    'high'
  );
};

// 低优先级更新函数
export const setLowPriority = <T>(
  set: (updater: T | Partial<T> | ((state: T) => T | Partial<T>)) => void,
  updater: T | Partial<T> | ((state: T) => T | Partial<T>),
  action?: string
) => {
  const updateId = action || `low_priority_${Date.now()}`;
  
  batchManager.addUpdate(
    updateId,
    () => set(updater),
    'low'
  );
};

// React Hook for manual batch control
export const useBatchUpdates = () => {
  return {
    flush: () => batchManager.flush(),
    clear: () => batchManager.clear(),
    getStatus: () => batchManager.getQueueStatus(),
    updateConfig: (config: Partial<BatchConfig>) => batchManager.updateConfig(config)
  };
};

// 防抖更新函数
export const createDebouncedUpdater = <T>(
  set: (updater: T | Partial<T> | ((state: T) => T | Partial<T>)) => void,
  delay: number = 100
) => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (updater: T | Partial<T> | ((state: T) => T | Partial<T>), action?: string) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      const updateId = action || `debounced_${Date.now()}`;
      batchManager.addUpdate(
        updateId,
        () => set(updater),
        'normal'
      );
    }, delay);
  };
};

// 节流更新函数
export const createThrottledUpdater = <T>(
  set: (updater: T | Partial<T> | ((state: T) => T | Partial<T>)) => void,
  delay: number = 100
) => {
  let lastUpdateTime = 0;
  let pendingUpdate: (() => void) | null = null;
  
  return (updater: T | Partial<T> | ((state: T) => T | Partial<T>), action?: string) => {
    const now = Date.now();
    const updateId = action || `throttled_${now}`;
    
    const executeUpdate = () => {
      batchManager.addUpdate(
        updateId,
        () => set(updater),
        'normal'
      );
      lastUpdateTime = Date.now();
      pendingUpdate = null;
    };
    
    if (now - lastUpdateTime >= delay) {
      executeUpdate();
    } else if (!pendingUpdate) {
      pendingUpdate = executeUpdate;
      setTimeout(() => {
        if (pendingUpdate) {
          pendingUpdate();
        }
      }, delay - (now - lastUpdateTime));
    }
  };
};

// 条件更新函数
export const createConditionalUpdater = <T>(
  set: (updater: T | Partial<T> | ((state: T) => T | Partial<T>)) => void,
  condition: (currentState: T, newState: T | Partial<T>) => boolean
) => {
  return (get: () => T) => (updater: T | Partial<T> | ((state: T) => T | Partial<T>), action?: string) => {
    const currentState = get();
    const newState = typeof updater === 'function' 
      ? (updater as (state: T) => T | Partial<T>)(currentState)
      : updater;
    
    if (condition(currentState, newState)) {
      const updateId = action || `conditional_${Date.now()}`;
      batchManager.addUpdate(
        updateId,
        () => set(updater),
        'normal'
      );
    }
  };
};

// 性能监控装饰器
export const withPerformanceMonitoring = <T>(
  updater: (set: any, get: any) => void,
  name: string
) => {
  return (set: any, get: any) => {
    const start = performance.now();
    
    const monitoredSet = (stateUpdater: any, replace?: boolean, action?: string) => {
      const updateStart = performance.now();
      set(stateUpdater, replace, action);
      const updateEnd = performance.now();
      
      if (updateEnd - updateStart > 16) { // 超过一帧的时间
        console.warn(`Slow state update in ${name}: ${updateEnd - updateStart}ms`);
      }
    };
    
    updater(monitoredSet, get);
    
    const end = performance.now();
    if (end - start > 1) {
      console.log(`Store initialization for ${name}: ${end - start}ms`);
    }
  };
};

export { batchManager };
export default batchUpdates;