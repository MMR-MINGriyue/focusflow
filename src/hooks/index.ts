/**
 * Hook索引文件
 * 统一导出所有Hook，方便使用
 */

// 增强的状态管理Hook
export {
  useEnhancedState,
  createLocalStateManager,
  useLocalState,
  type StateHistory,
  type EnhancedStateOptions,
} from './useEnhancedState';

// 增强的数据获取Hook
export {
  useEnhancedDataFetch,
  prefetchData,
  clearCache,
  type DataFetchOptions,
  type DataFetchResult,
  type FetchState,
} from './useEnhancedDataFetch';

// 增强的表单处理Hook
export {
  useEnhancedForm,
  type FormFieldConfig,
  type FormConfig,
  type FormState,
  type FormActions,
} from './useEnhancedForm';

// 增强的事件处理Hook
export {
  useEnhancedEvent,
  useKeyboardEvent,
  useClickOutside,
  useWindowSize,
  useScroll,
  useNetworkStatus,
  type EventHandlerOptions,
  type EventHandlerResult,
  type KeyboardEventHandlerOptions,
} from './useEnhancedEvent';

// 优化的计时器Hook
export { useOptimizedTimer } from './useOptimizedTimer';

// 优化的性能监控Hook
export { usePerformanceMonitor } from './usePerformanceMonitor';

// 本地存储Hook
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}

// 会话存储Hook
export function useSessionStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting sessionStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}

// 媒体查询Hook
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const updateMatch = (e: MediaQueryListEvent) => setMatches(e.matches);

    setMatches(media.matches);
    media.addEventListener('change', updateMatch);

    return () => media.removeEventListener('change', updateMatch);
  }, [query]);

  return matches;
}

// 元素尺寸Hook
export function useElementSize<T extends HTMLElement = HTMLElement>(
  ref: React.RefObject<T>
): { width: number; height: number } {
  const [size, setSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;
    const updateSize = () => {
      setSize({
        width: element.offsetWidth,
        height: element.offsetHeight,
      });
    };

    // 初始更新
    updateSize();

    // 创建ResizeObserver监听元素尺寸变化
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(element);

    return () => {
      resizeObserver.unobserve(element);
    };
  }, [ref]);

  return size;
}

// 元素位置Hook
export function useElementPosition<T extends HTMLElement = HTMLElement>(
  ref: React.RefObject<T>
): { top: number; left: number; width: number; height: number } {
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;
    const updatePosition = () => {
      const rect = element.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });
    };

    // 初始更新
    updatePosition();

    // 监听滚动和窗口大小变化
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    // 创建ResizeObserver监听元素尺寸变化
    const resizeObserver = new ResizeObserver(updatePosition);
    resizeObserver.observe(element);

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
      resizeObserver.unobserve(element);
    };
  }, [ref]);

  return position;
}

// 复制到剪贴板Hook
export function useCopyToClipboard(): [boolean, (text: string) => Promise<void>] {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);

      // 2秒后重置状态
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setIsCopied(false);
    }
  }, []);

  return [isCopied, copyToClipboard];
}

// 防抖Hook
export function useDebounce<T>(value: T, delay: number): T {
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
}

// 节流Hook
export function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastExecuted = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeElapsed = now - lastExecuted.current;

    if (timeElapsed > delay) {
      lastExecuted.current = now;
      setThrottledValue(value);
    } else {
      const handler = setTimeout(() => {
        lastExecuted.current = Date.now();
        setThrottledValue(value);
      }, delay - timeElapsed);

      return () => {
        clearTimeout(handler);
      };
    }
  }, [value, delay]);

  return throttledValue;
}

// 页面可见性Hook
export function usePageVisibility(): DocumentVisibilityState {
  const [visibility, setVisibility] = useState<DocumentVisibilityState>(document.visibilityState);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setVisibility(document.visibilityState);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return visibility;
}

// 页面生命周期Hook
export function usePageLifecycle(): {
  isActive: boolean;
  isPassive: boolean;
  isHidden: boolean;
} {
  const [state, setState] = useState({
    isActive: true,
    isPassive: false,
    isHidden: false,
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      setState({
        isActive: document.visibilityState === 'visible',
        isPassive: document.hasFocus(),
        isHidden: document.visibilityState === 'hidden',
      });
    };

    const handleFocus = () => {
      setState(prev => ({ ...prev, isPassive: false }));
    };

    const handleBlur = () => {
      setState(prev => ({ ...prev, isPassive: true }));
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return state;
}

// 修复useState导入
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
