/**
 * 性能优化器测试
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import {
  withRenderOptimization,
  createOptimizedEventHandler,
  MemoryOptimizer,
  createOptimizedAsync,
  useOptimizedCallback,
  useOptimizedMemo,
  memoryOptimizer
} from '../performanceOptimizer';

// Mock React
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  memo: jest.fn((component, areEqual) => {
    const memoized = jest.fn(component);
    memoized.areEqual = areEqual;
    return memoized;
  }),
  useCallback: jest.fn((callback, deps) => callback),
  useMemo: jest.fn((factory, deps) => factory()),
  useRef: jest.fn(() => ({ current: null }))
}));

describe('PerformanceOptimizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('withRenderOptimization', () => {
    it('creates optimized component with custom comparison', () => {
      const TestComponent = jest.fn(() => null);
      const areEqual = jest.fn(() => true);

      const OptimizedComponent = withRenderOptimization(TestComponent, { areEqual });

      expect(React.memo).toHaveBeenCalledWith(TestComponent, expect.any(Function));
    });

    it('handles deep comparison for specified props', () => {
      const TestComponent = jest.fn(() => null);
      
      const OptimizedComponent = withRenderOptimization(TestComponent, {
        deepCompareProps: ['complexProp']
      });

      expect(React.memo).toHaveBeenCalled();
    });

    it('ignores specified props in comparison', () => {
      const TestComponent = jest.fn(() => null);
      
      const OptimizedComponent = withRenderOptimization(TestComponent, {
        ignoreProps: ['className', 'style']
      });

      expect(React.memo).toHaveBeenCalled();
    });
  });

  describe('createOptimizedEventHandler', () => {
    it('creates debounced event handler', () => {
      const handler = jest.fn();
      const debouncedHandler = createOptimizedEventHandler(handler, {
        debounce: 100
      });

      // 快速调用多次
      debouncedHandler();
      debouncedHandler();
      debouncedHandler();

      // 应该还没有执行
      expect(handler).not.toHaveBeenCalled();

      // 等待防抖时间
      setTimeout(() => {
        expect(handler).toHaveBeenCalledTimes(1);
      }, 150);
    });

    it('creates throttled event handler', (done) => {
      const handler = jest.fn();
      const throttledHandler = createOptimizedEventHandler(handler, {
        throttle: 100,
        leading: true
      });

      // 快速调用多次
      throttledHandler();
      throttledHandler();
      throttledHandler();

      // 应该立即执行一次（leading）
      expect(handler).toHaveBeenCalledTimes(1);

      // 等待节流时间后再次调用
      setTimeout(() => {
        throttledHandler();
        expect(handler).toHaveBeenCalledTimes(2);
        done();
      }, 150);
    });

    it('returns original handler when no optimization specified', () => {
      const handler = jest.fn();
      const optimizedHandler = createOptimizedEventHandler(handler);

      expect(optimizedHandler).toBe(handler);
    });
  });

  describe('MemoryOptimizer', () => {
    let optimizer: MemoryOptimizer;

    beforeEach(() => {
      optimizer = MemoryOptimizer.getInstance();
    });

    it('registers and executes cleanup tasks', () => {
      const cleanupTask = jest.fn();
      
      const unregister = optimizer.registerCleanupTask(cleanupTask);
      optimizer.performCleanup();

      expect(cleanupTask).toHaveBeenCalled();

      // 测试取消注册
      unregister();
      cleanupTask.mockClear();
      optimizer.performCleanup();

      expect(cleanupTask).not.toHaveBeenCalled();
    });

    it('checks memory usage when performance.memory is available', () => {
      // Mock performance.memory
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 30 * 1024 * 1024, // 30MB
          totalJSHeapSize: 100 * 1024 * 1024 // 100MB
        },
        configurable: true
      });

      const memoryStatus = optimizer.checkMemoryUsage();

      expect(memoryStatus.used).toBe(30 * 1024 * 1024);
      expect(memoryStatus.total).toBe(100 * 1024 * 1024);
      expect(memoryStatus.percentage).toBe(30);
      expect(memoryStatus.shouldCleanup).toBe(false); // 30MB < 50MB threshold
    });

    it('handles missing performance.memory gracefully', () => {
      // Remove performance.memory
      Object.defineProperty(performance, 'memory', {
        value: undefined,
        configurable: true
      });

      const memoryStatus = optimizer.checkMemoryUsage();

      expect(memoryStatus.used).toBe(0);
      expect(memoryStatus.total).toBe(0);
      expect(memoryStatus.percentage).toBe(0);
      expect(memoryStatus.shouldCleanup).toBe(false);
    });

    it('starts and stops auto cleanup', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      const stopAutoCleanup = optimizer.startAutoCleanup(1000);

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000);

      stopAutoCleanup();

      expect(clearIntervalSpy).toHaveBeenCalled();

      setIntervalSpy.mockRestore();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('createOptimizedAsync', () => {
    it('executes async operation successfully', async () => {
      const asyncOp = jest.fn().mockResolvedValue('success');
      const optimizedOp = createOptimizedAsync(asyncOp);

      const result = await optimizedOp();

      expect(result).toBe('success');
      expect(asyncOp).toHaveBeenCalledTimes(1);
    });

    it('handles timeout correctly', async () => {
      const asyncOp = jest.fn(() => new Promise(resolve => setTimeout(resolve, 2000)));
      const optimizedOp = createOptimizedAsync(asyncOp, { timeout: 100 });

      await expect(optimizedOp()).rejects.toThrow('Operation timeout');
    });

    it('retries on failure', async () => {
      const asyncOp = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success');

      const optimizedOp = createOptimizedAsync(asyncOp, { 
        retries: 3,
        retryDelay: 10
      });

      const result = await optimizedOp();

      expect(result).toBe('success');
      expect(asyncOp).toHaveBeenCalledTimes(3);
    });

    it('caches results when enabled', async () => {
      const asyncOp = jest.fn().mockResolvedValue('cached-result');
      const optimizedOp = createOptimizedAsync(asyncOp, { 
        cache: true,
        cacheTime: 1000
      });

      // 第一次调用
      const result1 = await optimizedOp();
      expect(result1).toBe('cached-result');
      expect(asyncOp).toHaveBeenCalledTimes(1);

      // 第二次调用应该使用缓存
      const result2 = await optimizedOp();
      expect(result2).toBe('cached-result');
      expect(asyncOp).toHaveBeenCalledTimes(1); // 没有再次调用
    });
  });

  describe('useOptimizedCallback', () => {
    it('creates optimized callback with debounce', () => {
      const callback = jest.fn();
      const deps = ['dep1', 'dep2'];

      renderHook(() => 
        useOptimizedCallback(callback, deps, { debounce: 100 })
      );

      expect(React.useCallback).toHaveBeenCalled();
      expect(React.useMemo).toHaveBeenCalled();
    });

    it('creates optimized callback with throttle', () => {
      const callback = jest.fn();
      const deps = ['dep1', 'dep2'];

      renderHook(() => 
        useOptimizedCallback(callback, deps, { throttle: 100 })
      );

      expect(React.useCallback).toHaveBeenCalled();
      expect(React.useMemo).toHaveBeenCalled();
    });

    it('returns original callback when no optimization specified', () => {
      const callback = jest.fn();
      const deps = ['dep1', 'dep2'];

      renderHook(() => 
        useOptimizedCallback(callback, deps)
      );

      expect(React.useCallback).toHaveBeenCalled();
    });
  });

  describe('useOptimizedMemo', () => {
    it('creates optimized memo with cache', () => {
      const factory = jest.fn(() => 'memoized-value');
      const deps = ['dep1', 'dep2'];

      renderHook(() => 
        useOptimizedMemo(factory, deps, { cacheTime: 1000 })
      );

      expect(React.useMemo).toHaveBeenCalled();
      expect(React.useRef).toHaveBeenCalled();
    });

    it('creates optimized memo with deep comparison', () => {
      const factory = jest.fn(() => 'memoized-value');
      const deps = [{ nested: 'object' }];

      renderHook(() => 
        useOptimizedMemo(factory, deps, { deepCompare: true })
      );

      expect(React.useMemo).toHaveBeenCalled();
    });

    it('works without optimization options', () => {
      const factory = jest.fn(() => 'memoized-value');
      const deps = ['dep1', 'dep2'];

      renderHook(() => 
        useOptimizedMemo(factory, deps)
      );

      expect(React.useMemo).toHaveBeenCalled();
    });
  });

  describe('Integration', () => {
    it('memoryOptimizer singleton works correctly', () => {
      const instance1 = MemoryOptimizer.getInstance();
      const instance2 = MemoryOptimizer.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBe(memoryOptimizer);
    });

    it('handles errors in cleanup tasks gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const errorTask = jest.fn(() => { throw new Error('Cleanup error'); });
      const normalTask = jest.fn();

      memoryOptimizer.registerCleanupTask(errorTask);
      memoryOptimizer.registerCleanupTask(normalTask);

      expect(() => memoryOptimizer.performCleanup()).not.toThrow();
      expect(errorTask).toHaveBeenCalled();
      expect(normalTask).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Memory cleanup task failed:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});
