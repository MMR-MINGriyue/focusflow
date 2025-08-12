/**
 * 增强的数据获取Hook
 * 提供更强大的数据获取功能，包括缓存、重试、轮询等
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppError, ErrorType, retry, sleep } from '../utils';

/**
 * 数据获取状态
 */
export enum FetchState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

/**
 * 数据获取选项
 */
export interface DataFetchOptions<T, P = any> {
  /**
   * 获取函数
   */
  fetchFn: (params?: P) => Promise<T>;
  /**
   * 初始数据
   */
  initialData?: T;
  /**
   * 是否在组件挂载时自动获取
   */
  enabled?: boolean;
  /**
   * 依赖项，当依赖项变化时重新获取数据
   */
  deps?: any[];
  /**
   * 轮询间隔（毫秒）
   */
  pollingInterval?: number;
  /**
   * 是否在窗口聚焦时重新获取
   */
  refetchOnWindowFocus?: boolean;
  /**
   * 是否在重新连接时重新获取
   */
  refetchOnReconnect?: boolean;
  /**
   * 重试次数
   */
  retryCount?: number;
  /**
   * 重试延迟（毫秒）
   */
  retryDelay?: number;
  /**
   * 缓存键
   */
  cacheKey?: string;
  /**
   * 缓存时间（毫秒）
   */
  cacheTime?: number;
  /**
   * 数据转换函数
   */
  select?: (data: T) => any;
  /**
   * 成功回调
   */
  onSuccess?: (data: T) => void;
  /**
   * 错误回调
   */
  onError?: (error: AppError) => void;
  /**
   * 请求参数
   */
  params?: P;
}

/**
 * 数据获取结果
 */
export interface DataFetchResult<T> {
  /**
   * 数据
   */
  data: T | undefined;
  /**
   * 错误
   */
  error: AppError | undefined;
  /**
   * 获取状态
   */
  state: FetchState;
  /**
   * 是否正在加载
   */
  isLoading: boolean;
  /**
   * 是否正在获取最新数据（后台更新）
   */
  isFetching: boolean;
  /**
   * 是否成功
   */
  isSuccess: boolean;
  /**
   * 是否错误
   */
  isError: boolean;
  /**
   * 是否空闲
   */
  isIdle: boolean;
  /**
   * 重新获取函数
   */
  refetch: () => Promise<void>;
  /**
   * 手动设置数据
   */
  setData: (data: T) => void;
  /**
   * 手动设置错误
   */
  setError: (error: AppError) => void;
  /**
   * 取消请求
   */
  cancel: () => void;
}

/**
 * 简单的内存缓存
 */
class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number }>();

  get(key: string, cacheTime: number) {
    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > cacheTime;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  remove(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

// 全局缓存实例
const globalCache = new SimpleCache();

/**
 * 增强的数据获取Hook
 * @param options 配置选项
 * @returns 数据获取结果
 */
export function useEnhancedDataFetch<T, P = any>(
  options: DataFetchOptions<T, P>
): DataFetchResult<T> {
  const {
    fetchFn,
    initialData,
    enabled = true,
    deps = [],
    pollingInterval,
    refetchOnWindowFocus = true,
    refetchOnReconnect = true,
    retryCount = 3,
    retryDelay = 1000,
    cacheKey,
    cacheTime = 5 * 60 * 1000, // 5分钟
    select,
    onSuccess,
    onError,
    params,
  } = options;

  const [state, setState] = useState<{
    data: T | undefined;
    error: AppError | undefined;
    fetchState: FetchState;
    isFetching: boolean;
  }>({
    data: initialData,
    error: undefined,
    fetchState: enabled ? FetchState.LOADING : FetchState.IDLE,
    isFetching: false,
  });

  const paramsRef = useRef(params);
  const enabledRef = useRef(enabled);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 更新参数引用
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  // 更新启用状态引用
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // 获取数据
  const fetchData = useCallback(async (isRefetch = false) => {
    if (!enabledRef.current) return;

    // 如果是首次获取，设置加载状态
    if (!isRefetch) {
      setState(prev => ({
        ...prev,
        fetchState: FetchState.LOADING,
        isFetching: true,
      }));
    } else {
      // 后台更新
      setState(prev => ({ ...prev, isFetching: true }));
    }

    // 创建新的AbortController
    abortControllerRef.current = new AbortController();

    try {
      // 检查缓存
      let data: T | undefined;
      if (cacheKey && !isRefetch) {
        const cachedData = globalCache.get(cacheKey, cacheTime);
        if (cachedData) {
          data = cachedData;
          setState(prev => ({
            ...prev,
            data,
            error: undefined,
            fetchState: FetchState.SUCCESS,
            isFetching: false,
          }));
          onSuccess?.(data);
          return;
        }
      }

      // 执行获取函数
      const result = await retry(
        () => fetchFn(paramsRef.current),
        retryCount,
        retryDelay
      );

      // 检查是否已取消
      if (abortControllerRef.current?.signal.aborted) return;

      // 应用数据转换
      const transformedData = select ? select(result) : result;

      // 更新状态
      setState(prev => ({
        ...prev,
        data: transformedData,
        error: undefined,
        fetchState: FetchState.SUCCESS,
        isFetching: false,
      }));

      // 缓存数据
      if (cacheKey) {
        globalCache.set(cacheKey, result);
      }

      // 调用成功回调
      onSuccess?.(result);
    } catch (error) {
      // 检查是否已取消
      if (abortControllerRef.current?.signal.aborted) return;

      const appError = AppError.fromError(error as Error);

      setState(prev => ({
        ...prev,
        error: appError,
        fetchState: FetchState.ERROR,
        isFetching: false,
      }));

      // 调用错误回调
      onError?.(appError);
    }
  }, [fetchFn, retryCount, retryDelay, cacheKey, cacheTime, select, onSuccess, onError]);

  // 重新获取数据
  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // 手动设置数据
  const setData = useCallback((data: T) => {
    setState(prev => ({
      ...prev,
      data,
      error: undefined,
      fetchState: FetchState.SUCCESS,
    }));

    // 缓存数据
    if (cacheKey) {
      globalCache.set(cacheKey, data);
    }
  }, [cacheKey]);

  // 手动设置错误
  const setError = useCallback((error: AppError) => {
    setState(prev => ({
      ...prev,
      error,
      fetchState: FetchState.ERROR,
    }));
  }, []);

  // 取消请求
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState(prev => ({ ...prev, isFetching: false }));
  }, []);

  // 初始化获取数据
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, ...deps]);

  // 轮询
  useEffect(() => {
    if (pollingInterval && enabled) {
      pollingIntervalRef.current = setInterval(() => {
        fetchData(true);
      }, pollingInterval);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }
  }, [pollingInterval, enabled, fetchData]);

  // 窗口聚焦时重新获取
  useEffect(() => {
    if (refetchOnWindowFocus && enabled) {
      const handleFocus = () => {
        fetchData(true);
      };

      window.addEventListener('focus', handleFocus);

      return () => {
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [refetchOnWindowFocus, enabled, fetchData]);

  // 重新连接时重新获取
  useEffect(() => {
    if (refetchOnReconnect && enabled) {
      const handleOnline = () => {
        fetchData(true);
      };

      window.addEventListener('online', handleOnline);

      return () => {
        window.removeEventListener('online', handleOnline);
      };
    }
  }, [refetchOnReconnect, enabled, fetchData]);

  // 清理
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      cancel();
    };
  }, [cancel]);

  return {
    data: state.data,
    error: state.error,
    state: state.fetchState,
    isLoading: state.fetchState === FetchState.LOADING,
    isFetching: state.isFetching,
    isSuccess: state.fetchState === FetchState.SUCCESS,
    isError: state.fetchState === FetchState.ERROR,
    isIdle: state.fetchState === FetchState.IDLE,
    refetch,
    setData,
    setError,
    cancel,
  };
}

/**
 * 预取数据
 * @param key 缓存键
 * @param fetchFn 获取函数
 * @param params 参数
 */
export function prefetchData<T, P = any>(
  key: string,
  fetchFn: (params?: P) => Promise<T>,
  params?: P
): void {
  // 在后台获取数据并缓存
  fetchFn(params)
    .then(data => {
      globalCache.set(key, data);
    })
    .catch(error => {
      console.error('Failed to prefetch data:', error);
    });
}

/**
 * 清除缓存
 * @param key 缓存键，如果不提供则清除所有缓存
 */
export function clearCache(key?: string): void {
  if (key) {
    globalCache.remove(key);
  } else {
    globalCache.clear();
  }
}
