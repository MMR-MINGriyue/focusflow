/**
 * 增强的事件处理Hook
 * 提供更强大的事件处理功能，包括防抖、节流、一次性执行等
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { debounce, throttle, memoize } from '../utils';

/**
 * 事件处理选项
 */
export interface EventHandlerOptions {
  /**
   * 是否防抖
   */
  debounce?: number;
  /**
   * 是否节流
   */
  throttle?: number;
  /**
   * 是否只执行一次
   */
  once?: boolean;
  /**
   * 是否在组件卸载时自动取消
   */
  cleanupOnUnmount?: boolean;
  /**
   * 是否阻止默认行为
   */
  preventDefault?: boolean;
  /**
   * 是否阻止事件冒泡
   */
  stopPropagation?: boolean;
  /**
   * 是否在被动模式下监听
   */
  passive?: boolean;
  /**
   * 是否捕获阶段监听
   */
  capture?: boolean;
}

/**
 * 事件处理结果
 */
export interface EventHandlerResult {
  /**
   * 事件处理函数
   */
  handler: (event: Event) => void;
  /**
   * 取消事件监听
   */
  remove: () => void;
}

/**
 * 增强的事件处理Hook
 * @param element 目标元素
 * @param eventType 事件类型
 * @param callback 回调函数
 * @param options 选项
 * @returns 事件处理结果
 */
export function useEnhancedEvent<T extends Event>(
  element: HTMLElement | Window | Document | null,
  eventType: string,
  callback: (event: T) => void,
  options: EventHandlerOptions = {}
): EventHandlerResult {
  const {
    debounce: debounceTime,
    throttle: throttleTime,
    once,
    cleanupOnUnmount = true,
    preventDefault,
    stopPropagation,
    passive,
    capture,
  } = options;

  // 创建回调函数的引用
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  // 创建处理函数
  const handler = useMemo(() => {
    let fn = (event: T) => {
      // 阻止默认行为
      if (preventDefault) {
        event.preventDefault();
      }

      // 阻止事件冒泡
      if (stopPropagation) {
        event.stopPropagation();
      }

      // 调用回调
      callbackRef.current(event);
    };

    // 应用防抖
    if (debounceTime) {
      fn = debounce(fn, debounceTime) as any;
    }

    // 应用节流
    if (throttleTime) {
      fn = throttle(fn, throttleTime) as any;
    }

    return fn;
  }, [debounceTime, throttleTime, preventDefault, stopPropagation]);

  // 事件监听器
  useEffect(() => {
    if (!element) return;

    // 添加事件监听
    element.addEventListener(eventType, handler as EventListener, {
      once,
      passive,
      capture,
    });

    // 返回清理函数
    return () => {
      if (cleanupOnUnmount) {
        element.removeEventListener(eventType, handler as EventListener, { capture });
      }
    };
  }, [element, eventType, handler, once, passive, capture, cleanupOnUnmount]);

  // 返回事件处理结果
  return {
    handler: handler as (event: T) => void,
    remove: () => {
      if (element) {
        element.removeEventListener(eventType, handler as EventListener, { capture });
      }
    },
  };
}

/**
 * 键盘事件处理选项
 */
export interface KeyboardEventHandlerOptions extends EventHandlerOptions {
  /**
   * 键盘按键
   */
  key?: string | string[];
  /**
   * 是否需要按下Ctrl键
   */
  ctrlKey?: boolean;
  /**
   * 是否需要按下Shift键
   */
  shiftKey?: boolean;
  /**
   * 是否需要按下Alt键
   */
  altKey?: boolean;
  /**
   * 是否需要按下Meta键
   */
  metaKey?: boolean;
}

/**
 * 增强的键盘事件处理Hook
 * @param callback 回调函数
 * @param options 选项
 * @returns 事件处理函数
 */
export function useKeyboardEvent(
  callback: (event: KeyboardEvent) => void,
  options: KeyboardEventHandlerOptions = {}
): (event: KeyboardEvent) => void {
  const {
    key,
    ctrlKey,
    shiftKey,
    altKey,
    metaKey,
    debounce: debounceTime,
    throttle: throttleTime,
    once,
    preventDefault,
    stopPropagation,
  } = options;

  // 创建回调函数的引用
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  // 创建处理函数
  const handler = useMemo(() => {
    let fn = (event: KeyboardEvent) => {
      // 检查按键
      if (key) {
        const keys = Array.isArray(key) ? key : [key];
        if (!keys.includes(event.key)) {
          return;
        }
      }

      // 检查修饰键
      if (ctrlKey !== undefined && event.ctrlKey !== ctrlKey) return;
      if (shiftKey !== undefined && event.shiftKey !== shiftKey) return;
      if (altKey !== undefined && event.altKey !== altKey) return;
      if (metaKey !== undefined && event.metaKey !== metaKey) return;

      // 阻止默认行为
      if (preventDefault) {
        event.preventDefault();
      }

      // 阻止事件冒泡
      if (stopPropagation) {
        event.stopPropagation();
      }

      // 调用回调
      callbackRef.current(event);
    };

    // 应用防抖
    if (debounceTime) {
      fn = debounce(fn, debounceTime) as any;
    }

    // 应用节流
    if (throttleTime) {
      fn = throttle(fn, throttleTime) as any;
    }

    return fn;
  }, [
    key,
    ctrlKey,
    shiftKey,
    altKey,
    metaKey,
    debounceTime,
    throttleTime,
    preventDefault,
    stopPropagation,
  ]);

  // 全局键盘事件监听
  useEffect(() => {
    if (once) {
      // 只执行一次
      const onceHandler = (event: KeyboardEvent) => {
        handler(event);
        window.removeEventListener('keydown', onceHandler);
      };
      window.addEventListener('keydown', onceHandler);
      return () => {
        window.removeEventListener('keydown', onceHandler);
      };
    } else {
      window.addEventListener('keydown', handler);
      return () => {
        window.removeEventListener('keydown', handler);
      };
    }
  }, [handler, once]);

  return handler;
}

/**
 * 点击外部事件处理Hook
 * @param callback 回调函数
 * @param options 选项
 * @returns 事件处理结果
 */
export function useClickOutside(
  elements: (HTMLElement | null)[],
  callback: (event: MouseEvent) => void,
  options: EventHandlerOptions = {}
): EventHandlerResult {
  const { cleanupOnUnmount = true } = options;

  // 创建回调函数的引用
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  // 创建处理函数
  const handler = useMemo(() => {
    return (event: MouseEvent) => {
      // 检查点击是否在元素外部
      const isOutside = elements.every(
        element => !element || !element.contains(event.target as Node)
      );

      if (isOutside) {
        callbackRef.current(event);
      }
    };
  }, [elements]);

  // 全局点击事件监听
  useEffect(() => {
    document.addEventListener('click', handler);

    // 返回清理函数
    return () => {
      if (cleanupOnUnmount) {
        document.removeEventListener('click', handler);
      }
    };
  }, [handler, cleanupOnUnmount]);

  // 返回事件处理结果
  return {
    handler,
    remove: () => {
      document.removeEventListener('click', handler);
    },
  };
}

/**
 * 窗口大小变化事件处理Hook
 * @param callback 回调函数
 * @param options 选项
 * @returns 窗口大小
 */
export function useWindowSize(
  callback?: (size: { width: number; height: number }) => void,
  options: EventHandlerOptions = {}
): { width: number; height: number } {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // 创建回调函数的引用
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  // 处理窗口大小变化
  const handleResize = useMemo(() => {
    return () => {
      const size = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      setWindowSize(size);

      // 调用回调
      if (callbackRef.current) {
        callbackRef.current(size);
      }
    };
  }, []);

  // 窗口大小变化事件监听
  useEnhancedEvent(
    window,
    'resize',
    handleResize,
    {
      throttle: options.throttle || 100,
      cleanupOnUnmount: options.cleanupOnUnmount,
    }
  );

  return windowSize;
}

/**
 * 滚动事件处理Hook
 * @param callback 回调函数
 * @param options 选项
 * @returns 滚动位置
 */
export function useScroll(
  callback?: (position: { scrollX: number; scrollY: number }) => void,
  options: EventHandlerOptions = {}
): { scrollX: number; scrollY: number } {
  const [scrollPosition, setScrollPosition] = useState({
    scrollX: window.scrollX,
    scrollY: window.scrollY,
  });

  // 创建回调函数的引用
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  // 处理滚动
  const handleScroll = useMemo(() => {
    return () => {
      const position = {
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      };
      setScrollPosition(position);

      // 调用回调
      if (callbackRef.current) {
        callbackRef.current(position);
      }
    };
  }, []);

  // 滚动事件监听
  useEnhancedEvent(
    window,
    'scroll',
    handleScroll,
    {
      throttle: options.throttle || 100,
      cleanupOnUnmount: options.cleanupOnUnmount,
    }
  );

  return scrollPosition;
}

/**
 * 网络状态变化事件处理Hook
 * @param callback 回调函数
 * @param options 选项
 * @returns 网络状态
 */
export function useNetworkStatus(
  callback?: (status: { online: boolean }) => void,
  options: EventHandlerOptions = {}
): { online: boolean } {
  const [online, setOnline] = useState(navigator.onLine);

  // 创建回调函数的引用
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  // 处理网络状态变化
  const handleOnline = useMemo(() => {
    return () => {
      const status = { online: true };
      setOnline(true);

      // 调用回调
      if (callbackRef.current) {
        callbackRef.current(status);
      }
    };
  }, []);

  const handleOffline = useMemo(() => {
    return () => {
      const status = { online: false };
      setOnline(false);

      // 调用回调
      if (callbackRef.current) {
        callbackRef.current(status);
      }
    };
  }, []);

  // 网络状态事件监听
  useEnhancedEvent(
    window,
    'online',
    handleOnline,
    {
      cleanupOnUnmount: options.cleanupOnUnmount,
    }
  );

  useEnhancedEvent(
    window,
    'offline',
    handleOffline,
    {
      cleanupOnUnmount: options.cleanupOnUnmount,
    }
  );

  return { online };
}

// 修复useWindowSize中的useState导入
import { useState } from 'react';
