/**
 * 增强的状态管理Hook
 * 提供更强大的状态管理功能，包括持久化、撤销/重做等
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { deepClone, debounce } from '../utils';

/**
 * 状态历史记录接口
 */
export interface StateHistory<T> {
  /**
   * 历史状态数组
   */
  past: T[];
  /**
   * 当前状态
   */
  present: T;
  /**
   * 未来状态数组（用于重做）
   */
  future: T[];
}

/**
 * 增强状态管理选项
 */
export interface EnhancedStateOptions<T> {
  /**
   * 初始状态
   */
  initialState: T;
  /**
   * 是否启用持久化
   */
  persist?: boolean;
  /**
   * 持久化键名
   */
  persistKey?: string;
  /**
   * 是否启用撤销/重做
   */
  enableUndoRedo?: boolean;
  /**
   * 最大历史记录数
   */
  maxHistorySize?: number;
  /**
   * 状态变更回调
   */
  onStateChange?: (state: T) => void;
  /**
   * 状态比较函数
   */
  shouldUpdate?: (prevState: T, newState: T) => boolean;
}

/**
 * 增强的状态管理Hook
 * @param options 配置选项
 * @returns 状态和操作函数
 */
export function useEnhancedState<T>(options: EnhancedStateOptions<T>) {
  const {
    initialState,
    persist = false,
    persistKey = 'enhanced-state',
    enableUndoRedo = false,
    maxHistorySize = 50,
    onStateChange,
    shouldUpdate,
  } = options;

  // 状态历史记录
  const [history, setHistory] = useState<StateHistory<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  // 持久化状态
  const persistState = useCallback(
    debounce((state: T) => {
      try {
        localStorage.setItem(persistKey, JSON.stringify(state));
      } catch (error) {
        console.error('Failed to persist state:', error);
      }
    }, 300),
    [persistKey]
  );

  // 加载持久化状态
  const loadPersistedState = useCallback(() => {
    if (!persist) return initialState;

    try {
      const persistedState = localStorage.getItem(persistKey);
      if (persistedState) {
        return JSON.parse(persistedState);
      }
    } catch (error) {
      console.error('Failed to load persisted state:', error);
    }

    return initialState;
  }, [persist, persistKey, initialState]);

  // 初始化状态
  useEffect(() => {
    const persistedState = loadPersistedState();
    setHistory({
      past: [],
      present: persistedState,
      future: [],
    });
  }, [loadPersistedState]);

  // 状态变更回调
  useEffect(() => {
    if (onStateChange) {
      onStateChange(history.present);
    }
  }, [history.present, onStateChange]);

  // 持久化状态
  useEffect(() => {
    if (persist) {
      persistState(history.present);
    }
  }, [history.present, persist, persistState]);

  // 设置状态
  const setState = useCallback(
    (newState: T | ((prevState: T) => T)) => {
      setHistory(prevHistory => {
        const newPresent =
          typeof newState === 'function'
            ? (newState as (prevState: T) => T)(prevHistory.present)
            : newState;

        // 检查是否需要更新
        if (shouldUpdate && !shouldUpdate(prevHistory.present, newPresent)) {
          return prevHistory;
        }

        // 如果启用撤销/重做，保存历史记录
        if (enableUndoRedo) {
          const newPast = [...prevHistory.past, prevHistory.present];
          // 限制历史记录大小
          if (newPast.length > maxHistorySize) {
            newPast.shift();
          }
          return {
            past: newPast,
            present: newPresent,
            future: [],
          };
        }

        return {
          ...prevHistory,
          present: newPresent,
        };
      });
    },
    [enableUndoRedo, maxHistorySize, shouldUpdate]
  );

  // 撤销
  const undo = useCallback(() => {
    if (!enableUndoRedo || history.past.length === 0) return;

    setHistory(prevHistory => {
      const previous = prevHistory.past[prevHistory.past.length - 1];
      const newPast = prevHistory.past.slice(0, -1);
      return {
        past: newPast,
        present: previous,
        future: [prevHistory.present, ...prevHistory.future],
      };
    });
  }, [enableUndoRedo, history.past]);

  // 重做
  const redo = useCallback(() => {
    if (!enableUndoRedo || history.future.length === 0) return;

    setHistory(prevHistory => {
      const next = prevHistory.future[0];
      const newFuture = prevHistory.future.slice(1);
      return {
        past: [...prevHistory.past, prevHistory.present],
        present: next,
        future: newFuture,
      };
    });
  }, [enableUndoRedo, history.future]);

  // 重置状态
  const resetState = useCallback(() => {
    setHistory({
      past: [],
      present: initialState,
      future: [],
    });
  }, [initialState]);

  // 清除历史记录
  const clearHistory = useCallback(() => {
    setHistory(prevHistory => ({
      past: [],
      present: prevHistory.present,
      future: [],
    }));
  }, []);

  // 获取状态快照
  const getStateSnapshot = useCallback(() => {
    return deepClone(history.present);
  }, [history.present]);

  // 恢复状态快照
  const restoreStateSnapshot = useCallback(
    (snapshot: T) => {
      setHistory(prevHistory => {
        if (shouldUpdate && !shouldUpdate(prevHistory.present, snapshot)) {
          return prevHistory;
        }

        // 如果启用撤销/重做，保存历史记录
        if (enableUndoRedo) {
          const newPast = [...prevHistory.past, prevHistory.present];
          // 限制历史记录大小
          if (newPast.length > maxHistorySize) {
            newPast.shift();
          }
          return {
            past: newPast,
            present: snapshot,
            future: [],
          };
        }

        return {
          ...prevHistory,
          present: snapshot,
        };
      });
    },
    [enableUndoRedo, maxHistorySize, shouldUpdate]
  );

  return {
    state: history.present,
    setState,
    undo,
    redo,
    resetState,
    clearHistory,
    getStateSnapshot,
    restoreStateSnapshot,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}

/**
 * 创建局部状态管理器
 * @param initialState 初始状态
 * @returns 状态管理器
 */
export function createLocalStateManager<T>(initialState: T) {
  let state = deepClone(initialState);
  const listeners = new Set<(state: T) => void>();

  const getState = () => state;

  const setState = (newState: T | ((prevState: T) => T)) => {
    const updatedState =
      typeof newState === 'function'
        ? (newState as (prevState: T) => T)(state)
        : newState;

    if (updatedState !== state) {
      state = updatedState;
      listeners.forEach(listener => listener(state));
    }
  };

  const subscribe = (listener: (state: T) => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const destroy = () => {
    listeners.clear();
  };

  return {
    getState,
    setState,
    subscribe,
    destroy,
  };
}

/**
 * 使用局部状态管理器
 * @param stateManager 状态管理器
 * @returns 状态和设置函数
 */
export function useLocalState<T>(stateManager: ReturnType<typeof createLocalStateManager<T>>) {
  const [state, setState] = useState<T>(stateManager.getState());

  useEffect(() => {
    const unsubscribe = stateManager.subscribe(setState);
    return unsubscribe;
  }, [stateManager]);

  return [state, stateManager.setState] as const;
}
