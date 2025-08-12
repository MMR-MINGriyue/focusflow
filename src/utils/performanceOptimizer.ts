/**
 * 性能优化器
 * 
 * 实施具体的性能优化措施，包括：
 * - 组件渲染优化
 * - 内存使用优化
 * - 事件处理优化
 * - 异步操作优化
 */

import React from 'react';

// ==================== 组件渲染优化 ====================

/**
 * 高阶组件：优化渲染性能
 */
export function withRenderOptimization<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    /** 自定义比较函数 */
    areEqual?: (prevProps: P, nextProps: P) => boolean;
    /** 需要深度比较的属性 */
    deepCompareProps?: (keyof P)[];
    /** 忽略的属性（不参与比较） */
    ignoreProps?: (keyof P)[];
  } = {}
) {
  const { areEqual, deepCompareProps = [], ignoreProps = [] } = options;

  const optimizedAreEqual = (prevProps: P, nextProps: P): boolean => {
    if (areEqual) {
      return areEqual(prevProps, nextProps);
    }

    // 获取需要比较的属性
    const prevKeys = Object.keys(prevProps) as (keyof P)[];
    const nextKeys = Object.keys(nextProps) as (keyof P)[];
    
    // 过滤掉忽略的属性
    const relevantPrevKeys = prevKeys.filter(key => !ignoreProps.includes(key));
    const relevantNextKeys = nextKeys.filter(key => !ignoreProps.includes(key));

    if (relevantPrevKeys.length !== relevantNextKeys.length) {
      return false;
    }

    // 比较每个属性
    for (const key of relevantPrevKeys) {
      const prevValue = prevProps[key];
      const nextValue = nextProps[key];

      if (deepCompareProps.includes(key)) {
        // 深度比较
        if (!deepEqual(prevValue, nextValue)) {
          return false;
        }
      } else {
        // 浅比较
        if (prevValue !== nextValue) {
          return false;
        }
      }
    }

    return true;
  };

  return React.memo(Component, optimizedAreEqual);
}

/**
 * 深度比较函数
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (a == null || b == null) return a === b;
  
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object') return a === b;
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  
  return true;
}

// ==================== 事件处理优化 ====================

/**
 * 创建优化的事件处理器
 */
export function createOptimizedEventHandler<T extends (...args: any[]) => any>(
  handler: T,
  options: {
    /** 防抖延迟（毫秒） */
    debounce?: number;
    /** 节流延迟（毫秒） */
    throttle?: number;
    /** 是否立即执行第一次调用 */
    leading?: boolean;
    /** 是否在延迟结束后执行最后一次调用 */
    trailing?: boolean;
  } = {}
): T {
  const { debounce, throttle, leading = false, trailing = true } = options;

  if (debounce) {
    return createDebounced(handler, debounce, { leading, trailing }) as T;
  }

  if (throttle) {
    return createThrottled(handler, throttle, { leading, trailing }) as T;
  }

  return handler;
}

/**
 * 创建防抖函数
 */
function createDebounced<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): T {
  const { leading = false, trailing = true } = options;
  let timeoutId: NodeJS.Timeout | null = null;
  let lastCallTime = 0;

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    const shouldCallLeading = leading && (now - lastCallTime > delay);

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (shouldCallLeading) {
      lastCallTime = now;
      return func(...args);
    }

    if (trailing) {
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        func(...args);
        timeoutId = null;
      }, delay);
    }
  }) as T;
}

/**
 * 创建节流函数
 */
function createThrottled<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): T {
  const { leading = true, trailing = true } = options;
  let lastCallTime = 0;
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    lastArgs = args;

    if (timeSinceLastCall >= delay) {
      if (leading) {
        lastCallTime = now;
        return func(...args);
      }
    }

    if (trailing && !timeoutId) {
      timeoutId = setTimeout(() => {
        if (lastArgs && (Date.now() - lastCallTime >= delay)) {
          lastCallTime = Date.now();
          func(...lastArgs);
        }
        timeoutId = null;
      }, delay - timeSinceLastCall);
    }
  }) as T;
}

// ==================== 内存优化 ====================

/**
 * 内存优化管理器
 */
export class MemoryOptimizer {
  private static instance: MemoryOptimizer;
  private cleanupTasks: Array<() => void> = [];
  private memoryThreshold = 50 * 1024 * 1024; // 50MB

  static getInstance(): MemoryOptimizer {
    if (!MemoryOptimizer.instance) {
      MemoryOptimizer.instance = new MemoryOptimizer();
    }
    return MemoryOptimizer.instance;
  }

  /**
   * 注册清理任务
   */
  registerCleanupTask(task: () => void): () => void {
    this.cleanupTasks.push(task);
    return () => {
      const index = this.cleanupTasks.indexOf(task);
      if (index > -1) {
        this.cleanupTasks.splice(index, 1);
      }
    };
  }

  /**
   * 执行内存清理
   */
  performCleanup(): void {
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.warn('Memory cleanup task failed:', error);
      }
    });

    // 强制垃圾回收（如果可用）
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }

  /**
   * 检查内存使用情况
   */
  checkMemoryUsage(): {
    used: number;
    total: number;
    percentage: number;
    shouldCleanup: boolean;
  } {
    const memory = (performance as any).memory;
    if (!memory) {
      return {
        used: 0,
        total: 0,
        percentage: 0,
        shouldCleanup: false
      };
    }

    const used = memory.usedJSHeapSize;
    const total = memory.totalJSHeapSize;
    const percentage = (used / total) * 100;
    const shouldCleanup = used > this.memoryThreshold;

    return {
      used,
      total,
      percentage,
      shouldCleanup
    };
  }

  /**
   * 自动内存管理
   */
  startAutoCleanup(interval: number = 30000): () => void {
    const intervalId = setInterval(() => {
      const memoryStatus = this.checkMemoryUsage();
      if (memoryStatus.shouldCleanup) {
        console.log('🧹 Performing automatic memory cleanup');
        this.performCleanup();
      }
    }, interval);

    return () => clearInterval(intervalId);
  }
}

// ==================== 异步操作优化 ====================

/**
 * 创建优化的异步操作
 */
export function createOptimizedAsync<T>(
  asyncOperation: () => Promise<T>,
  options: {
    /** 超时时间（毫秒） */
    timeout?: number;
    /** 重试次数 */
    retries?: number;
    /** 重试延迟（毫秒） */
    retryDelay?: number;
    /** 缓存结果 */
    cache?: boolean;
    /** 缓存时间（毫秒） */
    cacheTime?: number;
  } = {}
): () => Promise<T> {
  const {
    timeout = 5000,
    retries = 3,
    retryDelay = 1000,
    cache = false,
    cacheTime = 60000
  } = options;

  let cachedResult: { value: T; timestamp: number } | null = null;

  return async (): Promise<T> => {
    // 检查缓存
    if (cache && cachedResult) {
      const now = Date.now();
      if (now - cachedResult.timestamp < cacheTime) {
        return cachedResult.value;
      }
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await Promise.race([
          asyncOperation(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Operation timeout')), timeout)
          )
        ]);

        // 缓存结果
        if (cache) {
          cachedResult = {
            value: result,
            timestamp: Date.now()
          };
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    throw lastError;
  };
}

// ==================== 渲染优化工具 ====================

/**
 * 创建优化的useCallback
 */
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  options: {
    debounce?: number;
    throttle?: number;
  } = {}
): T {
  const { debounce, throttle } = options;

  const optimizedCallback = React.useMemo(() => {
    if (debounce) {
      return createDebounced(callback, debounce);
    }
    if (throttle) {
      return createThrottled(callback, throttle);
    }
    return callback;
  }, deps);

  return React.useCallback(optimizedCallback, [optimizedCallback]) as T;
}

/**
 * 创建优化的useMemo
 */
export function useOptimizedMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  options: {
    /** 是否使用深度比较 */
    deepCompare?: boolean;
    /** 缓存时间（毫秒） */
    cacheTime?: number;
  } = {}
): T {
  const { deepCompare = false, cacheTime } = options;
  const cacheRef = React.useRef<{ value: T; timestamp: number; deps: React.DependencyList } | null>(null);

  return React.useMemo(() => {
    const now = Date.now();
    
    // 检查缓存
    if (cacheRef.current && cacheTime) {
      if (now - cacheRef.current.timestamp < cacheTime) {
        const depsEqual = deepCompare 
          ? deepEqual(deps, cacheRef.current.deps)
          : deps.every((dep, index) => dep === cacheRef.current!.deps[index]);
        
        if (depsEqual) {
          return cacheRef.current.value;
        }
      }
    }

    const value = factory();
    
    // 更新缓存
    cacheRef.current = {
      value,
      timestamp: now,
      deps: [...deps]
    };

    return value;
  }, deepCompare ? [JSON.stringify(deps)] : deps);
}

// ==================== 导出实例 ====================

export const memoryOptimizer = MemoryOptimizer.getInstance();
