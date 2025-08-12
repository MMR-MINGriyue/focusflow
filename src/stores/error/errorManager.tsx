/**
 * 错误管理器
 * 提供全局错误处理、错误边界和错误恢复功能
 */
import React, { Component, ReactNode } from 'react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// 错误类型定义
export interface AppError {
  id: string;
  message: string;
  stack?: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'network' | 'runtime' | 'validation' | 'permission' | 'unknown';
  context?: Record<string, any>;
  recovered?: boolean;
}

// 错误统计信息
export interface ErrorStats {
  totalErrors: number;
  errorsByCategory: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  recentErrors: AppError[];
  recoveredErrors: number;
}

// 错误存储状态
interface ErrorState {
  errors: AppError[];
  isErrorBoundaryActive: boolean;
  errorStats: ErrorStats;
  
  // 操作方法
  addError: (error: Omit<AppError, 'id' | 'timestamp'>) => void;
  removeError: (id: string) => void;
  clearAllErrors: () => void;
  markErrorAsRecovered: (id: string) => void;
  getErrorStats: () => ErrorStats;
  getErrorsByCategory: (category: string) => AppError[];
  getErrorsBySeverity: (severity: string) => AppError[];
}

// 创建错误存储
export const useErrorStore = create<ErrorState>()(
  devtools(
    (set, get) => ({
      errors: [],
      isErrorBoundaryActive: false,
      errorStats: {
        totalErrors: 0,
        errorsByCategory: {},
        errorsBySeverity: {},
        recentErrors: [],
        recoveredErrors: 0
      },

      addError: (errorData) => {
        const error: AppError = {
          ...errorData,
          id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now()
        };

        set((state) => {
          const newErrors = [...state.errors, error];
          
          // 保持最近100个错误
          if (newErrors.length > 100) {
            newErrors.shift();
          }

          // 更新统计信息
          const stats = calculateErrorStats(newErrors);

          return {
            errors: newErrors,
            errorStats: stats
          };
        });

        // 根据严重程度进行不同处理
        handleErrorBySeverity(error);
      },

      removeError: (id) => {
        set((state) => {
          const newErrors = state.errors.filter(error => error.id !== id);
          return {
            errors: newErrors,
            errorStats: calculateErrorStats(newErrors)
          };
        });
      },

      clearAllErrors: () => {
        set({
          errors: [],
          errorStats: {
            totalErrors: 0,
            errorsByCategory: {},
            errorsBySeverity: {},
            recentErrors: [],
            recoveredErrors: 0
          }
        });
      },

      markErrorAsRecovered: (id) => {
        set((state) => {
          const newErrors = state.errors.map(error =>
            error.id === id ? { ...error, recovered: true } : error
          );
          
          return {
            errors: newErrors,
            errorStats: calculateErrorStats(newErrors)
          };
        });
      },

      getErrorStats: () => get().errorStats,

      getErrorsByCategory: (category) => {
        return get().errors.filter(error => error.category === category);
      },

      getErrorsBySeverity: (severity) => {
        return get().errors.filter(error => error.severity === severity);
      }
    }),
    {
      name: 'error-store'
    }
  )
);

// 计算错误统计信息
function calculateErrorStats(errors: AppError[]): ErrorStats {
  const stats: ErrorStats = {
    totalErrors: errors.length,
    errorsByCategory: {},
    errorsBySeverity: {},
    recentErrors: errors.slice(-10), // 最近10个错误
    recoveredErrors: errors.filter(e => e.recovered).length
  };

  // 按类别统计
  errors.forEach(error => {
    stats.errorsByCategory[error.category] = 
      (stats.errorsByCategory[error.category] || 0) + 1;
  });

  // 按严重程度统计
  errors.forEach(error => {
    stats.errorsBySeverity[error.severity] = 
      (stats.errorsBySeverity[error.severity] || 0) + 1;
  });

  return stats;
}

// 根据严重程度处理错误
function handleErrorBySeverity(error: AppError): void {
  switch (error.severity) {
    case 'critical':
      // 关键错误：显示错误边界，记录到外部服务
      console.error('Critical Error:', error);
      // 这里可以集成错误报告服务
      break;
    
    case 'high':
      // 高级错误：显示用户通知，记录详细信息
      console.error('High Severity Error:', error);
      break;
    
    case 'medium':
      // 中级错误：记录警告，可能显示提示
      console.warn('Medium Severity Error:', error);
      break;
    
    case 'low':
      // 低级错误：仅记录信息
      console.info('Low Severity Error:', error);
      break;
  }
}

// 错误边界组件属性
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

// 错误边界组件状态
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// React错误边界组件
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 记录错误到存储
    useErrorStore.getState().addError({
      message: error.message,
      stack: error.stack,
      severity: 'critical',
      category: 'runtime',
      context: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    });

    // 调用自定义错误处理器
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}

// 默认错误回退组件
const DefaultErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0">
          <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-lg font-medium text-gray-900">应用错误</h3>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          应用遇到了一个意外错误。请尝试刷新页面，如果问题持续存在，请联系技术支持。
        </p>
      </div>
      
      <div className="mb-4 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 overflow-auto max-h-32">
        {error.message}
      </div>
      
      <div className="flex space-x-3">
        <button
          onClick={() => window.location.reload()}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          刷新页面
        </button>
        <button
          onClick={() => useErrorStore.getState().clearAllErrors()}
          className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
        >
          清除错误
        </button>
      </div>
    </div>
  </div>
);

// 错误处理工具函数
export const handleError = (
  error: Error | string,
  context?: Record<string, any>,
  severity: AppError['severity'] = 'medium',
  category: AppError['category'] = 'unknown'
): void => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'string' ? undefined : error.stack;

  useErrorStore.getState().addError({
    message: errorMessage,
    stack: errorStack,
    severity,
    category,
    context
  });
};

// 异步错误处理装饰器
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: Record<string, any>
) => {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(
        error as Error,
        { ...context, functionName: fn.name, arguments: args },
        'high',
        'runtime'
      );
      return null;
    }
  };
};

// 网络错误处理
export const handleNetworkError = (
  error: Error,
  url: string,
  method: string = 'GET'
): void => {
  handleError(
    error,
    { url, method, type: 'network' },
    'medium',
    'network'
  );
};

// 验证错误处理
export const handleValidationError = (
  message: string,
  field?: string,
  value?: any
): void => {
  handleError(
    message,
    { field, value, type: 'validation' },
    'low',
    'validation'
  );
};

// 权限错误处理
export const handlePermissionError = (
  message: string,
  permission: string
): void => {
  handleError(
    message,
    { permission, type: 'permission' },
    'medium',
    'permission'
  );
};

// 错误恢复策略
export const attemptErrorRecovery = async (errorId: string): Promise<boolean> => {
  const error = useErrorStore.getState().errors.find(e => e.id === errorId);
  
  if (!error) {
    return false;
  }

  try {
    // 根据错误类型尝试不同的恢复策略
    switch (error.category) {
      case 'network':
        // 网络错误：重试请求
        if (error.context?.url) {
          // 这里可以实现重试逻辑
          console.log('Attempting to retry network request:', error.context.url);
        }
        break;
      
      case 'runtime':
        // 运行时错误：重置相关状态
        console.log('Attempting to recover from runtime error');
        break;
      
      case 'validation':
        // 验证错误：重置表单或字段
        console.log('Attempting to recover from validation error');
        break;
      
      default:
        console.log('No recovery strategy available for error category:', error.category);
        return false;
    }

    // 标记错误为已恢复
    useErrorStore.getState().markErrorAsRecovered(errorId);
    return true;
    
  } catch (recoveryError) {
    console.error('Error recovery failed:', recoveryError);
    return false;
  }
};

// 全局错误监听器
export const setupGlobalErrorHandlers = (): void => {
  // 监听未捕获的Promise拒绝
  window.addEventListener('unhandledrejection', (event) => {
    handleError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      { type: 'unhandledPromiseRejection' },
      'high',
      'runtime'
    );
  });

  // 监听全局JavaScript错误
  window.addEventListener('error', (event) => {
    handleError(
      event.error || new Error(event.message),
      { 
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'globalError'
      },
      'high',
      'runtime'
    );
  });
};

export default useErrorStore;