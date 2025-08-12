/**
 * 错误处理服务
 * 用于统一处理应用中的错误
 */

import { container } from '../../container/IoCContainer';

/**
 * 错误级别
 */
export enum ErrorLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * 错误类型
 */
export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  INTERNAL = 'internal',
  EXTERNAL = 'external',
  BUSINESS = 'business',
}

/**
 * 错误上下文
 */
export interface ErrorContext {
  [key: string]: any;
}

/**
 * 应用错误接口
 */
export interface AppError {
  id: string;
  type: ErrorType;
  level: ErrorLevel;
  code: string;
  message: string;
  stack?: string;
  context?: ErrorContext;
  timestamp: number;
  handled: boolean;
  userId?: string;
  sessionId?: string;
}

/**
 * 错误处理服务接口
 */
export interface ErrorHandlerService {
  /**
   * 处理错误
   * @param error 错误对象
   * @param context 错误上下文
   * @returns 错误ID
   */
  handleError(error: Error | AppError, context?: ErrorContext): string;

  /**
   * 创建应用错误
   * @param type 错误类型
   * @param code 错误代码
   * @param message 错误消息
   * @param level 错误级别
   * @param context 错误上下文
   * @returns 应用错误
   */
  createError(
    type: ErrorType,
    code: string,
    message: string,
    level?: ErrorLevel,
    context?: ErrorContext
  ): AppError;

  /**
   * 获取错误
   * @param errorId 错误ID
   * @returns 应用错误
   */
  getError(errorId: string): AppError | null;

  /**
   * 获取所有错误
   * @param level 错误级别过滤
   * @param type 错误类型过滤
   * @param limit 限制数量
   * @returns 应用错误列表
   */
  getErrors(level?: ErrorLevel, type?: ErrorType, limit?: number): AppError[];

  /**
   * 清除错误
   * @param errorId 错误ID
   */
  clearError(errorId: string): boolean;

  /**
   * 清除所有错误
   */
  clearAllErrors(): void;

  /**
   * 获取错误统计
   * @returns 错误统计信息
   */
  getErrorStats(): {
    total: number;
    byLevel: Record<ErrorLevel, number>;
    byType: Record<ErrorType, number>;
    byDay: Record<string, number>;
  };
}

/**
 * 错误处理服务实现
 */
export class ErrorHandlerServiceImpl implements ErrorHandlerService {
  private errors: Map<string, AppError> = new Map();
  private notificationService = container.resolve('notificationService');
  private analyticsService = container.resolve('analyticsService');

  handleError(error: Error | AppError, context?: ErrorContext): string {
    // 如果是原生Error，转换为AppError
    let appError: AppError;

    if (this.isAppError(error)) {
      appError = { ...error, handled: true };
    } else {
      appError = this.createError(
        ErrorType.INTERNAL,
        'INTERNAL_ERROR',
        error.message,
        ErrorLevel.ERROR,
        {
          ...context,
          originalError: error.name,
          stack: error.stack,
        }
      );
    }

    // 添加上下文
    if (context) {
      appError.context = { ...appError.context, ...context };
    }

    // 保存错误
    this.errors.set(appError.id, appError);

    // 记录到分析服务
    this.analyticsService.trackEvent({
      name: 'error_occurred',
      properties: {
        errorId: appError.id,
        type: appError.type,
        level: appError.level,
        code: appError.code,
        message: appError.message,
        context: appError.context,
      },
    });

    // 根据错误级别处理
    switch (appError.level) {
      case ErrorLevel.DEBUG:
      case ErrorLevel.INFO:
        console.info(`[${appError.level.toUpperCase()}] ${appError.message}`, appError.context);
        break;
      case ErrorLevel.WARN:
        console.warn(`[${appError.level.toUpperCase()}] ${appError.message}`, appError.context);
        break;
      case ErrorLevel.ERROR:
        console.error(`[${appError.level.toUpperCase()}] ${appError.message}`, appError.context);
        this.showErrorNotification(appError);
        break;
      case ErrorLevel.FATAL:
        console.error(`[${appError.level.toUpperCase()}] ${appError.message}`, appError.context);
        this.showErrorNotification(appError);
        break;
    }

    return appError.id;
  }

  createError(
    type: ErrorType,
    code: string,
    message: string,
    level?: ErrorLevel,
    context?: ErrorContext
  ): AppError {
    return {
      id: this.generateErrorId(),
      type,
      level: level || ErrorLevel.ERROR,
      code,
      message,
      context,
      timestamp: Date.now(),
      handled: false,
    };
  }

  getError(errorId: string): AppError | null {
    return this.errors.get(errorId) || null;
  }

  getErrors(level?: ErrorLevel, type?: ErrorType, limit?: number): AppError[] {
    let errors = Array.from(this.errors.values());

    // 按级别过滤
    if (level) {
      errors = errors.filter(e => e.level === level);
    }

    // 按类型过滤
    if (type) {
      errors = errors.filter(e => e.type === type);
    }

    // 按时间排序（最新的在前）
    errors.sort((a, b) => b.timestamp - a.timestamp);

    // 限制数量
    if (limit) {
      errors = errors.slice(0, limit);
    }

    return errors;
  }

  clearError(errorId: string): boolean {
    return this.errors.delete(errorId);
  }

  clearAllErrors(): void {
    this.errors.clear();
  }

  getErrorStats() {
    const errors = Array.from(this.errors.values());
    const byLevel: Record<ErrorLevel, number> = {
      [ErrorLevel.DEBUG]: 0,
      [ErrorLevel.INFO]: 0,
      [ErrorLevel.WARN]: 0,
      [ErrorLevel.ERROR]: 0,
      [ErrorLevel.FATAL]: 0,
    };
    const byType: Record<ErrorType, number> = {
      [ErrorType.NETWORK]: 0,
      [ErrorType.VALIDATION]: 0,
      [ErrorType.AUTHENTICATION]: 0,
      [ErrorType.AUTHORIZATION]: 0,
      [ErrorType.NOT_FOUND]: 0,
      [ErrorType.CONFLICT]: 0,
      [ErrorType.INTERNAL]: 0,
      [ErrorType.EXTERNAL]: 0,
      [ErrorType.BUSINESS]: 0,
    };
    const byDay: Record<string, number> = {};

    // 统计各级别错误数量
    for (const error of errors) {
      byLevel[error.level]++;
      byType[error.type]++;

      // 按天统计
      const day = new Date(error.timestamp).toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;
    }

    return {
      total: errors.length,
      byLevel,
      byType,
      byDay,
    };
  }

  /**
   * 生成错误ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 检查是否为应用错误
   */
  private isAppError(error: any): error is AppError {
    return error && 
           typeof error.id === 'string' && 
           typeof error.type === 'string' && 
           typeof error.level === 'string' && 
           typeof error.code === 'string' && 
           typeof error.message === 'string';
  }

  /**
   * 显示错误通知
   */
  private showErrorNotification(error: AppError): void {
    // 根据错误级别决定通知类型
    let notificationType: 'info' | 'success' | 'warning' | 'error' = 'error';

    switch (error.level) {
      case ErrorLevel.DEBUG:
      case ErrorLevel.INFO:
        notificationType = 'info';
        break;
      case ErrorLevel.WARN:
        notificationType = 'warning';
        break;
      case ErrorLevel.ERROR:
      case ErrorLevel.FATAL:
        notificationType = 'error';
        break;
    }

    // 发送通知
    this.notificationService.sendNotification({
      title: this.getErrorTitle(error),
      message: error.message,
      type: notificationType,
      timestamp: new Date(),
    });
  }

  /**
   * 获取错误标题
   */
  private getErrorTitle(error: AppError): string {
    switch (error.type) {
      case ErrorType.NETWORK:
        return '网络错误';
      case ErrorType.VALIDATION:
        return '验证错误';
      case ErrorType.AUTHENTICATION:
        return '认证错误';
      case ErrorType.AUTHORIZATION:
        return '授权错误';
      case ErrorType.NOT_FOUND:
        return '资源未找到';
      case ErrorType.CONFLICT:
        return '冲突错误';
      case ErrorType.INTERNAL:
        return '内部错误';
      case ErrorType.EXTERNAL:
        return '外部服务错误';
      case ErrorType.BUSINESS:
        return '业务逻辑错误';
      default:
        return '错误';
    }
  }
}

/**
 * 全局错误处理装饰器
 * 用于自动捕获和处理方法中的错误
 */
export function HandleError(errorType?: ErrorType, errorCode?: string, errorMessage?: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<Function>
  ) {
    const method = descriptor.value!;

    descriptor.value = async function (...args: any[]) {
      const errorHandler = container.resolve<ErrorHandlerService>('errorHandlerService');

      try {
        // 执行原方法
        const result = method.apply(this, args);

        // 如果是Promise，等待完成
        if (result instanceof Promise) {
          return result.catch((error: any) => {
            // 处理错误
            const errorId = errorHandler.handleError(error, {
              component: target.constructor.name,
              method: propertyName,
              arguments: args,
            });

            // 重新抛出错误
            throw {
              ...error,
              errorId,
            };
          });
        }

        return result;
      } catch (error) {
        // 处理错误
        const errorId = errorHandler.handleError(error, {
          component: target.constructor.name,
          method: propertyName,
          arguments: args,
        });

        // 重新抛出错误
        throw {
          ...error,
          errorId,
        };
      }
    };

    return descriptor;
  };
}