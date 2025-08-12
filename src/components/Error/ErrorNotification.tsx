/**
 * 错误通知组件
 * 显示用户友好的错误提示和恢复选项
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  X, 
  RefreshCw, 
  Info, 
  AlertCircle,
  XCircle,
  CheckCircle
} from 'lucide-react';
import { useErrorState, useErrorHandler, ErrorInfo, ErrorSeverity } from '../../stores/error/errorManager';
import { cn } from '../../utils/cn';

// 通知类型配置
const NOTIFICATION_CONFIG = {
  low: {
    icon: Info,
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-500',
    textColor: 'text-blue-800 dark:text-blue-200',
    duration: 5000
  },
  medium: {
    icon: AlertCircle,
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    iconColor: 'text-yellow-500',
    textColor: 'text-yellow-800 dark:text-yellow-200',
    duration: 8000
  },
  high: {
    icon: AlertTriangle,
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    iconColor: 'text-orange-500',
    textColor: 'text-orange-800 dark:text-orange-200',
    duration: 12000
  },
  critical: {
    icon: XCircle,
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-500',
    textColor: 'text-red-800 dark:text-red-200',
    duration: 0 // 不自动消失
  }
};

// 单个错误通知组件
const ErrorNotificationItem: React.FC<{
  error: ErrorInfo;
  onDismiss: () => void;
  onRetry: () => void;
  onResolve: () => void;
}> = ({ error, onDismiss, onRetry, onResolve }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const config = NOTIFICATION_CONFIG[error.severity];
  const IconComponent = config.icon;

  // 自动消失定时器
  useEffect(() => {
    if (config.duration > 0) {
      const timer = setTimeout(() => {
        onDismiss();
      }, config.duration);

      return () => clearTimeout(timer);
    }
  }, [config.duration, onDismiss]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const canRetry = error.recoveryStrategy === 'retry' && 
                   error.retryCount < error.maxRetries && 
                   !error.isResolved;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      className={cn(
        'relative rounded-lg border p-4 shadow-lg backdrop-blur-sm',
        config.bgColor,
        config.borderColor
      )}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <IconComponent className={cn('h-5 w-5', config.iconColor)} />
        </div>
        
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <h3 className={cn('text-sm font-medium', config.textColor)}>
              {error.userMessage || error.message}
            </h3>
            
            <div className="flex items-center space-x-2">
              {/* 重试按钮 */}
              {canRetry && (
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className={cn(
                    'inline-flex items-center px-2 py-1 text-xs font-medium rounded transition-colors',
                    config.textColor,
                    'hover:bg-white/50 dark:hover:bg-black/20',
                    isRetrying && 'opacity-50 cursor-not-allowed'
                  )}
                  title="重试操作"
                >
                  <RefreshCw className={cn('h-3 w-3 mr-1', isRetrying && 'animate-spin')} />
                  重试 ({error.maxRetries - error.retryCount})
                </button>
              )}
              
              {/* 标记为已解决按钮 */}
              {error.actionRequired && !error.isResolved && (
                <button
                  onClick={onResolve}
                  className={cn(
                    'inline-flex items-center px-2 py-1 text-xs font-medium rounded transition-colors',
                    config.textColor,
                    'hover:bg-white/50 dark:hover:bg-black/20'
                  )}
                  title="标记为已解决"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  已解决
                </button>
              )}
              
              {/* 关闭按钮 */}
              <button
                onClick={onDismiss}
                className={cn(
                  'inline-flex rounded-md p-1.5 transition-colors',
                  config.textColor,
                  'hover:bg-white/50 dark:hover:bg-black/20'
                )}
                title="关闭通知"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* 错误详情 */}
          {error.details && (
            <div className="mt-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                  'text-xs underline transition-colors',
                  config.textColor,
                  'hover:no-underline'
                )}
              >
                {isExpanded ? '隐藏详情' : '显示详情'}
              </button>
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-2 overflow-hidden"
                  >
                    <div className="rounded bg-white/50 dark:bg-black/20 p-2">
                      <pre className="text-xs whitespace-pre-wrap break-words">
                        {typeof error.details === 'string' 
                          ? error.details 
                          : JSON.stringify(error.details, null, 2)
                        }
                      </pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          
          {/* 错误元信息 */}
          <div className={cn('mt-2 text-xs opacity-75', config.textColor)}>
            <span>来源: {error.source}</span>
            <span className="mx-2">•</span>
            <span>时间: {new Date(error.timestamp).toLocaleTimeString()}</span>
            {error.retryCount > 0 && (
              <>
                <span className="mx-2">•</span>
                <span>重试: {error.retryCount}/{error.maxRetries}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// 错误通知容器组件
export const ErrorNotificationContainer: React.FC<{
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
  maxNotifications?: number;
}> = ({ 
  position = 'top-right',
  maxNotifications = 5
}) => {
  const { unresolvedErrors } = useErrorState();
  const { resolveError, retryError, clearError } = useErrorHandler();
  
  // 只显示需要用户注意的错误
  const visibleErrors = unresolvedErrors
    .filter(error => error.severity !== 'low' || error.actionRequired)
    .slice(0, maxNotifications);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2'
  };

  if (visibleErrors.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      'fixed z-50 max-w-sm w-full space-y-3',
      positionClasses[position]
    )}>
      <AnimatePresence>
        {visibleErrors.map((error) => (
          <ErrorNotificationItem
            key={error.id}
            error={error}
            onDismiss={() => clearError(error.id)}
            onRetry={() => retryError(error.id)}
            onResolve={() => resolveError(error.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// 全局错误状态指示器
export const GlobalErrorIndicator: React.FC = () => {
  const { isGlobalErrorState, criticalErrors } = useErrorState();
  
  if (!isGlobalErrorState) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed top-0 left-0 right-0 z-40 bg-red-600 text-white p-2 text-center text-sm font-medium"
    >
      <div className="flex items-center justify-center space-x-2">
        <AlertTriangle className="h-4 w-4" />
        <span>
          应用遇到了 {criticalErrors.length} 个严重错误，部分功能可能受到影响
        </span>
      </div>
    </motion.div>
  );
};

// 错误统计面板（开发环境）
export const ErrorStatsPanel: React.FC = () => {
  const { stats, errors } = useErrorState();
  const [isVisible, setIsVisible] = useState(false);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* 切换按钮 */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 left-4 z-50 bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        title="错误统计"
      >
        <AlertTriangle className="h-4 w-4" />
        {stats.totalErrors > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {stats.totalErrors > 99 ? '99+' : stats.totalErrors}
          </span>
        )}
      </button>

      {/* 统计面板 */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className="fixed bottom-16 left-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-80 max-h-96 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                错误统计
              </h3>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 总体统计 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  总体统计
                </h4>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.totalErrors}
                </div>
                <div className="text-sm text-gray-500">总错误数</div>
              </div>

              {/* 按类型统计 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  按类型
                </h4>
                <div className="space-y-1">
                  {Object.entries(stats.errorsByType).map(([type, count]) => (
                    count > 0 && (
                      <div key={type} className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400 capitalize">
                          {type}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {count}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* 按严重程度统计 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  按严重程度
                </h4>
                <div className="space-y-1">
                  {Object.entries(stats.errorsBySeverity).map(([severity, count]) => (
                    count > 0 && (
                      <div key={severity} className="flex justify-between text-sm">
                        <span className={cn(
                          'capitalize',
                          severity === 'critical' && 'text-red-600',
                          severity === 'high' && 'text-orange-600',
                          severity === 'medium' && 'text-yellow-600',
                          severity === 'low' && 'text-blue-600'
                        )}>
                          {severity}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {count}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* 最近错误 */}
              {stats.recentErrors.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    最近错误
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {stats.recentErrors.slice(0, 5).map((error) => (
                      <div key={error.id} className="text-xs p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {error.message}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {new Date(error.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ErrorNotificationContainer;