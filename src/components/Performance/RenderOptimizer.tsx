/**
 * 渲染优化组件和工具
 * 提供各种渲染性能优化策略
 */

import React, { 
  memo, 
  useMemo, 
  useCallback, 
  useRef, 
  useEffect, 
  useState,
  forwardRef,
  ComponentType,
  ReactNode,
  PropsWithChildren
} from 'react';
import { cn } from '../../utils/cn';

// 深度比较函数
const deepEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  
  if (a == null || b == null) return a === b;
  
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object') return a === b;
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  
  return true;
};

// 浅比较函数
const shallowEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  
  if (typeof a !== 'object' || typeof b !== 'object' || a == null || b == null) {
    return a === b;
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  
  return true;
};

// 优化选项
interface OptimizationOptions {
  compareMode?: 'shallow' | 'deep' | 'custom';
  customCompare?: (prevProps: any, nextProps: any) => boolean;
  debugName?: string;
  enableProfiling?: boolean;
}

// 性能优化的memo包装器
export const optimizedMemo = <P extends object>(
  Component: ComponentType<P>,
  options: OptimizationOptions = {}
) => {
  const {
    compareMode = 'shallow',
    customCompare,
    debugName,
    enableProfiling = false
  } = options;

  const compareFunction = (prevProps: P, nextProps: P): boolean => {
    if (customCompare) {
      return customCompare(prevProps, nextProps);
    }
    
    switch (compareMode) {
      case 'deep':
        return deepEqual(prevProps, nextProps);
      case 'shallow':
        return shallowEqual(prevProps, nextProps);
      default:
        return shallowEqual(prevProps, nextProps);
    }
  };

  const MemoizedComponent = memo(Component, compareFunction);
  
  if (debugName) {
    MemoizedComponent.displayName = debugName;
  }

  // 开发环境下的性能分析
  if (enableProfiling && process.env.NODE_ENV === 'development') {
    return forwardRef<any, P>((props, ref) => {
      const renderCount = useRef(0);
      const lastRenderTime = useRef(Date.now());
      
      useEffect(() => {
        renderCount.current += 1;
        const now = Date.now();
        const timeSinceLastRender = now - lastRenderTime.current;
        lastRenderTime.current = now;
        
        console.log(`[${debugName || Component.name}] Render #${renderCount.current}, Time since last: ${timeSinceLastRender}ms`);
      });

      return <MemoizedComponent {...props} ref={ref} />;
    });
  }

  return MemoizedComponent;
};

// 虚拟滚动组件
interface VirtualScrollProps {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: any, index: number) => ReactNode;
  overscan?: number;
  className?: string;
}

export const VirtualScroll: React.FC<VirtualScrollProps> = memo(({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index
    }));
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(({ item, index }) => (
            <div key={index} style={{ height: itemHeight }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

VirtualScroll.displayName = 'VirtualScroll';

// 懒加载组件
interface LazyComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  threshold?: number;
  className?: string;
}

export const LazyComponent: React.FC<LazyComponentProps> = ({
  children,
  fallback = <div>Loading...</div>,
  rootMargin = '50px',
  threshold = 0.1,
  className
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [rootMargin, threshold, hasLoaded]);

  return (
    <div ref={elementRef} className={className}>
      {isVisible ? children : fallback}
    </div>
  );
};

// 防抖Hook
export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// 节流Hook
export const useThrottle = <T,>(value: T, limit: number): T => {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
};

// 渲染计数Hook（开发环境）
export const useRenderCount = (componentName?: string) => {
  const renderCount = useRef(0);
  
  if (process.env.NODE_ENV === 'development') {
    renderCount.current += 1;
    console.log(`[${componentName || 'Component'}] Render count: ${renderCount.current}`);
  }
  
  return renderCount.current;
};

// 为什么重新渲染Hook（开发环境）
export const useWhyDidYouUpdate = (name: string, props: Record<string, any>) => {
  const previousProps = useRef<Record<string, any>>();
  
  useEffect(() => {
    if (previousProps.current && process.env.NODE_ENV === 'development') {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};
      
      allKeys.forEach(key => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key]
          };
        }
      });
      
      if (Object.keys(changedProps).length) {
        console.log('[why-did-you-update]', name, changedProps);
      }
    }
    
    previousProps.current = props;
  });
};

// 批量状态更新Hook
export const useBatchedUpdates = () => {
  const [updates, setUpdates] = useState<(() => void)[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const batchUpdate = useCallback((updateFn: () => void) => {
    setUpdates(prev => [...prev, updateFn]);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setUpdates(currentUpdates => {
        currentUpdates.forEach(update => update());
        return [];
      });
    }, 0);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return batchUpdate;
};

// 稳定引用Hook
export const useStableCallback = <T extends (...args: any[]) => any>(callback: T): T => {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  });
  
  return useCallback(((...args) => callbackRef.current(...args)) as T, []);
};

// 优化的事件处理器
export const useOptimizedEventHandler = <T extends Event>(
  handler: (event: T) => void,
  dependencies: any[] = []
) => {
  return useCallback(handler, dependencies);
};

// 内存泄漏检测Hook
export const useMemoryLeakDetection = (componentName: string) => {
  const mountTime = useRef(Date.now());
  const timersRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const intervalsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const listenersRef = useRef<Set<{ element: EventTarget; event: string; handler: EventListener }>>(new Set());

  // 包装setTimeout
  const safeSetTimeout = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      callback();
    }, delay);
    timersRef.current.add(timer);
    return timer;
  }, []);

  // 包装setInterval
  const safeSetInterval = useCallback((callback: () => void, delay: number) => {
    const interval = setInterval(callback, delay);
    intervalsRef.current.add(interval);
    return interval;
  }, []);

  // 包装addEventListener
  const safeAddEventListener = useCallback((
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ) => {
    element.addEventListener(event, handler, options);
    listenersRef.current.add({ element, event, handler });
  }, []);

  // 清理函数
  useEffect(() => {
    return () => {
      // 清理定时器
      timersRef.current.forEach(timer => clearTimeout(timer));
      intervalsRef.current.forEach(interval => clearInterval(interval));
      
      // 清理事件监听器
      listenersRef.current.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });

      // 开发环境下的内存泄漏警告
      if (process.env.NODE_ENV === 'development') {
        const lifeTime = Date.now() - mountTime.current;
        if (timersRef.current.size > 0 || intervalsRef.current.size > 0 || listenersRef.current.size > 0) {
          console.warn(`[${componentName}] Potential memory leak detected:`, {
            activeTimers: timersRef.current.size,
            activeIntervals: intervalsRef.current.size,
            activeListeners: listenersRef.current.size,
            componentLifetime: `${lifeTime}ms`
          });
        }
      }
    };
  }, [componentName]);

  return {
    safeSetTimeout,
    safeSetInterval,
    safeAddEventListener
  };
};

// 组件性能分析器
interface PerformanceProfilerProps extends PropsWithChildren {
  id: string;
  onRender?: (id: string, phase: 'mount' | 'update', actualDuration: number) => void;
}

export const PerformanceProfiler: React.FC<PerformanceProfilerProps> = ({
  id,
  onRender,
  children
}) => {
  const startTime = useRef<number>();
  const renderCount = useRef(0);

  useEffect(() => {
    startTime.current = performance.now();
    renderCount.current += 1;
  });

  useEffect(() => {
    if (startTime.current) {
      const duration = performance.now() - startTime.current;
      const phase = renderCount.current === 1 ? 'mount' : 'update';
      
      if (onRender) {
        onRender(id, phase, duration);
      }
      
      if (process.env.NODE_ENV === 'development' && duration > 16) {
        console.warn(`[Performance] ${id} ${phase} took ${duration.toFixed(2)}ms`);
      }
    }
  });

  return <>{children}</>;
};

export default {
  optimizedMemo,
  VirtualScroll,
  LazyComponent,
  useDebounce,
  useThrottle,
  useRenderCount,
  useWhyDidYouUpdate,
  useBatchedUpdates,
  useStableCallback,
  useOptimizedEventHandler,
  useMemoryLeakDetection,
  PerformanceProfiler
};