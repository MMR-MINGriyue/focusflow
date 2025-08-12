import React from 'react';

/**
 * 错误处理工具函数
 * 提供错误捕获、处理和报告功能
 */

/**
 * 应用错误类型
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

/**
 * 应用错误类
 */
export class AppError extends Error {
  /**
   * 错误类型
   */
  public readonly type: ErrorType;
  /**
   * 错误代码
   */
  public readonly code?: string;
  /**
   * 错误详情
   */
  public readonly details?: any;
  /**
   * 原始错误
   */
  public readonly originalError?: Error;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    code?: string,
    details?: any,
    originalError?: Error
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.code = code;
    this.details = details;
    this.originalError = originalError;

    // 保持正确的原型链
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * 创建网络错误
   */
  static network(message: string, originalError?: Error): AppError {
    return new AppError(
      message,
      ErrorType.NETWORK,
      'NETWORK_ERROR',
      undefined,
      originalError
    );
  }

  /**
   * 创建验证错误
   */
  static validation(message: string, details?: any): AppError {
    return new AppError(
      message,
      ErrorType.VALIDATION,
      'VALIDATION_ERROR',
      details
    );
  }

  /**
   * 创建认证错误
   */
  static authentication(message: string): AppError {
    return new AppError(
      message,
      ErrorType.AUTHENTICATION,
      'AUTHENTICATION_ERROR'
    );
  }

  /**
   * 创建授权错误
   */
  static authorization(message: string): AppError {
    return new AppError(
      message,
      ErrorType.AUTHORIZATION,
      'AUTHORIZATION_ERROR'
    );
  }

  /**
   * 创建未找到错误
   */
  static notFound(message: string): AppError {
    return new AppError(
      message,
      ErrorType.NOT_FOUND,
      'NOT_FOUND_ERROR'
    );
  }

  /**
   * 创建服务器错误
   */
  static server(message: string, originalError?: Error): AppError {
    return new AppError(
      message,
      ErrorType.SERVER,
      'SERVER_ERROR',
      undefined,
      originalError
    );
  }

  /**
   * 创建客户端错误
   */
  static client(message: string, details?: any): AppError {
    return new AppError(
      message,
      ErrorType.CLIENT,
      'CLIENT_ERROR',
      details
    );
  }

  /**
   * 创建未知错误
   */
  static unknown(message: string, originalError?: Error): AppError {
    return new AppError(
      message,
      ErrorType.UNKNOWN,
      'UNKNOWN_ERROR',
      undefined,
      originalError
    );
  }

  /**
   * 从错误对象创建应用错误
   */
  static fromError(error: Error, defaultMessage = '发生未知错误'): AppError {
    if (error instanceof AppError) {
      return error;
    }

    // 尝试根据错误消息判断错误类型
    const message = error.message || defaultMessage;

    if (message.includes('network') || message.includes('fetch')) {
      return AppError.network(message, error);
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return AppError.validation(message);
    }

    if (message.includes('unauthorized') || message.includes('401')) {
      return AppError.authentication(message);
    }

    if (message.includes('forbidden') || message.includes('403')) {
      return AppError.authorization(message);
    }

    if (message.includes('not found') || message.includes('404')) {
      return AppError.notFound(message);
    }

    if (message.includes('server') || message.includes('500')) {
      return AppError.server(message, error);
    }

    return AppError.unknown(message, error);
  }
}

/**
 * 错误处理器接口
 */
export interface ErrorHandler {
  /**
   * 处理错误
   */
  handle(error: Error): void;
  /**
   * 是否可以处理指定类型的错误
   */
  canHandle(error: Error): boolean;
}

/**
 * 控制台错误处理器
 */
export class ConsoleErrorHandler implements ErrorHandler {
  handle(error: Error): void {
    console.error('Error:', error);

    if (error instanceof AppError) {
      console.error('Error Type:', error.type);
      console.error('Error Code:', error.code);
      console.error('Error Details:', error.details);
    }
  }

  canHandle(_error: Error): boolean {
    return true; // 可以处理所有类型的错误
  }
}

/**
 * 用户通知错误处理器
 */
export class UserNotificationErrorHandler implements ErrorHandler {
  handle(error: Error): void {
    let message = '发生错误，请稍后再试';

    if (error instanceof AppError) {
      switch (error.type) {
        case ErrorType.NETWORK:
          message = '网络连接失败，请检查您的网络连接';
          break;
        case ErrorType.VALIDATION:
          message = error.message || '输入的数据不正确';
          break;
        case ErrorType.AUTHENTICATION:
          message = '登录已过期，请重新登录';
          break;
        case ErrorType.AUTHORIZATION:
          message = '您没有权限执行此操作';
          break;
        case ErrorType.NOT_FOUND:
          message = '请求的资源不存在';
          break;
        case ErrorType.SERVER:
          message = '服务器错误，请稍后再试';
          break;
        default:
          message = error.message || '发生未知错误';
      }
    }

    // 在实际应用中，这里可以使用通知组件显示错误消息
    alert(message);
  }

  canHandle(_error: Error): boolean {
    return true; // 可以处理所有类型的错误
  }
}

/**
 * 错误报告服务接口
 */
export interface ErrorReportingService {
  /**
   * 报告错误
   */
  report(error: Error): Promise<void>;
}

/**
 * 控制台错误报告服务
 */
export class ConsoleErrorReportingService implements ErrorReportingService {
  async report(error: Error): Promise<void> {
    console.error('Reporting error:', error);

    if (error instanceof AppError) {
      console.error('Error Type:', error.type);
      console.error('Error Code:', error.code);
      console.error('Error Details:', error.details);
    }
  }
}

/**
 * 错误管理器
 */
export class ErrorManager {
  private handlers: ErrorHandler[] = [];
  private reportingService: ErrorReportingService;

  constructor(reportingService: ErrorReportingService = new ConsoleErrorReportingService()) {
    this.reportingService = reportingService;
  }

  /**
   * 添加错误处理器
   */
  addHandler(handler: ErrorHandler): void {
    this.handlers.push(handler);
  }

  /**
   * 移除错误处理器
   */
  removeHandler(handler: ErrorHandler): void {
    const index = this.handlers.indexOf(handler);
    if (index !== -1) {
      this.handlers.splice(index, 1);
    }
  }

  /**
   * 处理错误
   */
  async handleError(error: Error): Promise<void> {
    // 转换为应用错误
    const appError = AppError.fromError(error);

    // 报告错误
    try {
      await this.reportingService.report(appError);
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }

    // 处理错误
    for (const handler of this.handlers) {
      if (handler.canHandle(appError)) {
        try {
          handler.handle(appError);
        } catch (handlerError) {
          console.error('Error in error handler:', handlerError);
        }
      }
    }
  }
}

/**
 * 全局错误管理器实例
 */
export const globalErrorManager = new ErrorManager();

// 添加默认错误处理器
globalErrorManager.addHandler(new ConsoleErrorHandler());
globalErrorManager.addHandler(new UserNotificationErrorHandler());

/**
 * 错误边界组件的属性
 */
export interface ErrorBoundaryProps {
  /**
   * 子组件
   */
  children: React.ReactNode;
  /**
   * 错误时显示的组件
   */
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

/**
 * 错误边界组件的状态
 */
export interface ErrorBoundaryState {
  /**
   * 是否有错误
   */
  hasError: boolean;
  /**
   * 错误对象
   */
  error?: Error;
}

/**
 * 错误边界组件
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, _errorInfo: React.ErrorInfo): void {
    // 处理错误
    globalErrorManager.handleError(error).catch(console.error);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

/**
 * 默认错误回退组件
 */
const DefaultErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({ error, resetError }) => (
  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
    <h2 className="text-lg font-semibold text-red-800 mb-2">出现错误</h2>
    <p className="text-red-600 mb-4">{error.message}</p>
    <button
      onClick={resetError}
      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
    >
      重试
    </button>
  </div>
);

/**
 * 错误处理高阶组件
 * @param Component 要包装的组件
 * @param errorHandler 错误处理函数
 * @returns 包装后的组件
 */
export function withErrorHandling<P extends object>(
  Component: React.ComponentType<P>,
  errorHandler?: (error: Error) => void
): React.ComponentType<P> {
  return function WithErrorHandling(props: P) {
    const [error, setError] = React.useState<Error | null>(null);

    const handleError = React.useCallback((err: Error) => {
      setError(err);
      if (errorHandler) {
        errorHandler(err);
      } else {
        globalErrorManager.handleError(err).catch(console.error);
      }
    }, [errorHandler]);

    if (error) {
      return (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <h2 className="text-lg font-semibold text-red-800 mb-2">出现错误</h2>
          <p className="text-red-600 mb-4">{error.message}</p>
          <button
            onClick={() => setError(null)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            重试
          </button>
        </div>
      );
    }

    return <Component {...props} onError={handleError} />;
  };
}

/**
 * 异步错误处理函数
 * @param fn 可能出错的函数
 * @returns 包装后的函数
 */
export function withAsyncErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorHandler?: (error: Error) => void
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      if (errorHandler) {
        errorHandler(err);
      } else {
        globalErrorManager.handleError(err).catch(console.error);
      }

      throw err; // 重新抛出错误，以便调用者可以处理
    }
  }) as T;
}

/**
 * 创建错误处理的Promise
 * @param promise Promise
 * @returns 处理后的Promise
 */
export function withPromiseErrorHandling<T>(
  promise: Promise<T>,
  errorHandler?: (error: Error) => void
): Promise<T> {
  return promise.catch(error => {
    const err = error instanceof Error ? error : new Error(String(error));

    if (errorHandler) {
      errorHandler(err);
    } else {
      globalErrorManager.handleError(err).catch(console.error);
    }

    throw err;
  });
}