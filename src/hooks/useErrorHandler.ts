/**
 * 错误处理 Hook
 * 
 * 提供组件级别的错误处理和用户友好的错误提示
 */

import { useCallback, useRef } from 'react';
import { errorHandler, ErrorReport } from '../utils/errorHandler';
import { errorToastManager } from '../components/ErrorToast';

interface UseErrorHandlerOptions {
  /** 是否显示用户友好的错误提示 */
  showToast?: boolean;
  /** 默认的错误严重程度 */
  defaultSeverity?: ErrorReport['severity'];
  /** 组件上下文信息 */
  context?: Record<string, any>;
  /** 自定义错误消息映射 */
  errorMessages?: Record<string, string>;
  /** 是否自动重试 */
  enableRetry?: boolean;
  /** 最大重试次数 */
  maxRetries?: number;
}

interface UseErrorHandlerReturn {
  /** 处理错误 */
  handleError: (error: Error | string, options?: {
    severity?: ErrorReport['severity'];
    context?: Record<string, any>;
    showToast?: boolean;
    userMessage?: string;
    enableRetry?: boolean;
    onRetry?: () => void;
  }) => string;
  
  /** 处理异步操作 */
  handleAsync: <T>(
    operation: () => Promise<T>,
    options?: {
      fallback?: T;
      userMessage?: string;
      enableRetry?: boolean;
      onRetry?: () => Promise<T>;
    }
  ) => Promise<T | undefined>;
  
  /** 包装函数以自动处理错误 */
  wrapFunction: <T extends (...args: any[]) => any>(
    fn: T,
    options?: {
      userMessage?: string;
      enableRetry?: boolean;
    }
  ) => T;
  
  /** 显示成功消息 */
  showSuccess: (message: string) => void;
  
  /** 显示警告消息 */
  showWarning: (message: string) => void;
  
  /** 显示信息消息 */
  showInfo: (message: string) => void;
}

const defaultOptions: Required<UseErrorHandlerOptions> = {
  showToast: true,
  defaultSeverity: 'medium',
  context: {},
  errorMessages: {},
  enableRetry: false,
  maxRetries: 3
};

export function useErrorHandler(options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn {
  const opts = { ...defaultOptions, ...options };
  const retryCountRef = useRef<Map<string, number>>(new Map());

  // 获取用户友好的错误消息
  const getUserMessage = useCallback((error: Error | string): string => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    // 检查自定义错误消息映射
    for (const [pattern, message] of Object.entries(opts.errorMessages)) {
      if (errorMessage.includes(pattern)) {
        return message;
      }
    }

    // 常见错误的用户友好消息
    const commonErrors: Record<string, string> = {
      'Network Error': '网络连接失败，请检查网络设置',
      'Failed to fetch': '无法连接到服务器，请稍后重试',
      'Timeout': '操作超时，请重试',
      'Permission denied': '权限不足，无法执行此操作',
      'Not found': '请求的资源不存在',
      'Internal Server Error': '服务器内部错误，请稍后重试',
      'localStorage': '本地存储操作失败，请检查浏览器设置',
      'IndexedDB': '数据库操作失败，请重试',
      'Audio': '音频播放失败，请检查音频设置',
      'Timer': '计时器操作失败，请重试'
    };

    for (const [pattern, message] of Object.entries(commonErrors)) {
      if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
        return message;
      }
    }

    // 默认消息
    return '操作失败，请重试';
  }, [opts.errorMessages]);

  // 处理错误
  const handleError = useCallback((
    error: Error | string,
    options: {
      severity?: ErrorReport['severity'];
      context?: Record<string, any>;
      showToast?: boolean;
      userMessage?: string;
      enableRetry?: boolean;
      onRetry?: () => void;
    } = {}
  ): string => {
    const errorId = errorHandler.logError(
      error,
      { ...opts.context, ...options.context },
      options.severity || opts.defaultSeverity
    );

    const shouldShowToast = options.showToast !== undefined ? options.showToast : opts.showToast;
    
    if (shouldShowToast) {
      const userMessage = options.userMessage || getUserMessage(error);
      const enableRetry = options.enableRetry !== undefined ? options.enableRetry : opts.enableRetry;
      
      errorToastManager.error(userMessage, {
        showRetry: enableRetry && !!options.onRetry,
        onRetry: options.onRetry,
        actions: enableRetry && options.onRetry ? [{
          label: '重试',
          onClick: options.onRetry,
          variant: 'outline' as const
        }] : []
      });
    }

    return errorId;
  }, [opts, getUserMessage]);

  // 处理异步操作
  const handleAsync = useCallback(async <T>(
    operation: () => Promise<T>,
    options: {
      fallback?: T;
      userMessage?: string;
      enableRetry?: boolean;
      onRetry?: () => Promise<T>;
    } = {}
  ): Promise<T | undefined> => {
    const operationKey = operation.toString();
    const currentRetries = retryCountRef.current.get(operationKey) || 0;

    try {
      const result = await operation();
      // 成功后重置重试计数
      retryCountRef.current.delete(operationKey);
      return result;
    } catch (error) {
      const canRetry = options.enableRetry && 
                      options.onRetry && 
                      currentRetries < opts.maxRetries;

      const handleRetry = canRetry ? async () => {
        retryCountRef.current.set(operationKey, currentRetries + 1);
        try {
          return await options.onRetry!();
        } catch (retryError) {
          return handleAsync(operation, {
            ...options,
            enableRetry: currentRetries + 1 < opts.maxRetries
          });
        }
      } : undefined;

      handleError(
        error instanceof Error ? error : new Error(String(error)),
        {
          userMessage: options.userMessage,
          enableRetry: canRetry,
          onRetry: handleRetry
        }
      );

      return options.fallback;
    }
  }, [opts.maxRetries, handleError]);

  // 包装函数
  const wrapFunction = useCallback(<T extends (...args: any[]) => any>(
    fn: T,
    options: {
      userMessage?: string;
      enableRetry?: boolean;
    } = {}
  ): T => {
    return ((...args: Parameters<T>) => {
      try {
        const result = fn(...args);
        
        // 如果返回Promise，处理异步错误
        if (result instanceof Promise) {
          return result.catch((error) => {
            handleError(error, {
              userMessage: options.userMessage,
              enableRetry: options.enableRetry,
              onRetry: () => fn(...args)
            });
            throw error;
          });
        }
        
        return result;
      } catch (error) {
        handleError(
          error instanceof Error ? error : new Error(String(error)),
          {
            userMessage: options.userMessage,
            enableRetry: options.enableRetry,
            onRetry: () => fn(...args)
          }
        );
        throw error;
      }
    }) as T;
  }, [handleError]);

  // 显示成功消息
  const showSuccess = useCallback((message: string) => {
    errorToastManager.success(message);
  }, []);

  // 显示警告消息
  const showWarning = useCallback((message: string) => {
    errorToastManager.warning(message);
  }, []);

  // 显示信息消息
  const showInfo = useCallback((message: string) => {
    errorToastManager.info(message);
  }, []);

  return {
    handleError,
    handleAsync,
    wrapFunction,
    showSuccess,
    showWarning,
    showInfo
  };
}

/**
 * 简化版错误处理Hook
 * 只提供基本的错误处理功能
 */
export function useSimpleErrorHandler() {
  const { handleError, showSuccess, showWarning, showInfo } = useErrorHandler({
    showToast: true,
    enableRetry: false
  });

  return {
    handleError: (error: Error | string, userMessage?: string) => 
      handleError(error, { userMessage }),
    showSuccess,
    showWarning,
    showInfo
  };
}

/**
 * 异步操作专用错误处理Hook
 * 专门处理异步操作的错误
 */
export function useAsyncErrorHandler() {
  const { handleAsync, showSuccess } = useErrorHandler({
    showToast: true,
    enableRetry: true,
    maxRetries: 3
  });

  return {
    handleAsync,
    showSuccess
  };
}
