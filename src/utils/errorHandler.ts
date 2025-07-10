/**
 * 错误处理工具类
 * 提供统一的错误处理、日志记录和用户提示功能
 */

export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  timestamp: string;
  context?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userAgent: string;
  url: string;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: ErrorReport[] = [];
  private maxQueueSize = 50;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * 记录错误
   */
  logError(
    error: Error | string,
    context?: Record<string, any>,
    severity: ErrorReport['severity'] = 'medium'
  ): string {
    const errorReport: ErrorReport = {
      id: this.generateId(),
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      context,
      severity,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.errorQueue.push(errorReport);
    
    // 保持队列大小
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }

    // 保存到本地存储
    this.saveToLocalStorage();

    // 控制台输出
    console.error(`[ErrorHandler] ${severity.toUpperCase()}:`, errorReport);

    return errorReport.id;
  }

  /**
   * 处理异步操作错误
   */
  async handleAsyncError<T>(
    operation: () => Promise<T>,
    fallback?: T,
    context?: Record<string, any>
  ): Promise<T | undefined> {
    try {
      return await operation();
    } catch (error) {
      this.logError(
        error instanceof Error ? error : new Error(String(error)),
        context,
        'medium'
      );
      return fallback;
    }
  }

  /**
   * 包装函数以自动处理错误
   */
  wrapFunction<T extends (...args: any[]) => any>(
    fn: T,
    context?: Record<string, any>
  ): T {
    return ((...args: Parameters<T>) => {
      try {
        const result = fn(...args);
        
        // 如果返回Promise，处理异步错误
        if (result instanceof Promise) {
          return result.catch((error) => {
            this.logError(error, context, 'medium');
            throw error;
          });
        }
        
        return result;
      } catch (error) {
        this.logError(
          error instanceof Error ? error : new Error(String(error)),
          context,
          'medium'
        );
        throw error;
      }
    }) as T;
  }

  /**
   * 获取错误报告
   */
  getErrorReports(): ErrorReport[] {
    return [...this.errorQueue];
  }

  /**
   * 清除错误报告
   */
  clearErrorReports(): void {
    this.errorQueue = [];
    this.saveToLocalStorage();
  }

  /**
   * 获取错误统计
   */
  getErrorStats(): {
    total: number;
    bySeverity: Record<ErrorReport['severity'], number>;
    recent: number; // 最近1小时的错误数
  } {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const stats = {
      total: this.errorQueue.length,
      bySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      } as Record<ErrorReport['severity'], number>,
      recent: 0,
    };

    this.errorQueue.forEach((error) => {
      stats.bySeverity[error.severity]++;
      if (error.timestamp > oneHourAgo) {
        stats.recent++;
      }
    });

    return stats;
  }

  private generateId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('focusflow-errors', JSON.stringify(this.errorQueue));
    } catch (error) {
      console.warn('Failed to save errors to localStorage:', error);
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const saved = localStorage.getItem('focusflow-errors');
      if (saved) {
        this.errorQueue = JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load errors from localStorage:', error);
    }
  }

  constructor() {
    this.loadFromLocalStorage();
    
    // 监听未捕获的错误
    window.addEventListener('error', (event) => {
      this.logError(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }, 'high');
    });

    // 监听未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        { type: 'unhandledrejection' },
        'high'
      );
    });
  }
}

// 导出单例实例
export const errorHandler = ErrorHandler.getInstance();

// 便捷函数
export const logError = (error: Error | string, context?: Record<string, any>, severity?: ErrorReport['severity']) =>
  errorHandler.logError(error, context, severity);

export const handleAsyncError = <T>(operation: () => Promise<T>, fallback?: T, context?: Record<string, any>) =>
  errorHandler.handleAsyncError(operation, fallback, context);

export const wrapFunction = <T extends (...args: any[]) => any>(fn: T, context?: Record<string, any>) =>
  errorHandler.wrapFunction(fn, context);
