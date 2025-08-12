/**
 * 错误提示组件
 * 
 * 提供用户友好的错误提示和操作建议
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, RefreshCw, Info, CheckCircle } from 'lucide-react';
import { Button } from './ui/Button';

export interface ErrorToastProps {
  /** 错误信息 */
  message: string;
  /** 错误类型 */
  type?: 'error' | 'warning' | 'info' | 'success';
  /** 是否显示 */
  visible: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 重试回调 */
  onRetry?: () => void;
  /** 自动关闭时间（毫秒），0表示不自动关闭 */
  autoClose?: number;
  /** 是否显示重试按钮 */
  showRetry?: boolean;
  /** 额外的操作按钮 */
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  }>;
}

const ErrorToast: React.FC<ErrorToastProps> = ({
  message,
  type = 'error',
  visible,
  onClose,
  onRetry,
  autoClose = 5000,
  showRetry = false,
  actions = []
}) => {
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    setIsVisible(visible);
  }, [visible]);

  useEffect(() => {
    if (visible && autoClose > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoClose);

      return () => clearTimeout(timer);
    }
  }, [visible, autoClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // 等待动画完成
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
    handleClose();
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-red-50 border-red-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      case 'success':
        return 'text-green-800';
      default:
        return 'text-red-800';
    }
  };

  if (!visible && !isVisible) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-md w-full transform transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`rounded-lg border p-4 shadow-lg ${getBackgroundColor()}`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${getTextColor()}`}>
              {message}
            </p>
            
            {(showRetry || actions.length > 0) && (
              <div className="mt-3 flex space-x-2">
                {showRetry && onRetry && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRetry}
                    className="flex items-center space-x-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>重试</span>
                  </Button>
                )}
                
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant={action.variant || 'outline'}
                    onClick={() => {
                      action.onClick();
                      handleClose();
                    }}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex-shrink-0">
            <button
              onClick={handleClose}
              className={`rounded-md p-1 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                type === 'error' ? 'focus:ring-red-500' :
                type === 'warning' ? 'focus:ring-yellow-500' :
                type === 'info' ? 'focus:ring-blue-500' :
                'focus:ring-green-500'
              }`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorToast;

// 错误提示管理器
export class ErrorToastManager {
  private static instance: ErrorToastManager;
  private toasts: Array<{
    id: string;
    props: ErrorToastProps;
  }> = [];
  private listeners: Array<(toasts: typeof this.toasts) => void> = [];

  static getInstance(): ErrorToastManager {
    if (!ErrorToastManager.instance) {
      ErrorToastManager.instance = new ErrorToastManager();
    }
    return ErrorToastManager.instance;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  addListener(listener: (toasts: typeof this.toasts) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  show(props: Omit<ErrorToastProps, 'visible' | 'onClose'>): string {
    const id = this.generateId();
    
    const toast = {
      id,
      props: {
        ...props,
        visible: true,
        onClose: () => this.hide(id)
      }
    };

    this.toasts.push(toast);
    this.notifyListeners();

    return id;
  }

  hide(id: string): void {
    const index = this.toasts.findIndex(toast => toast.id === id);
    if (index > -1) {
      this.toasts.splice(index, 1);
      this.notifyListeners();
    }
  }

  clear(): void {
    this.toasts = [];
    this.notifyListeners();
  }

  // 便捷方法
  error(message: string, options?: Partial<ErrorToastProps>): string {
    return this.show({
      message,
      type: 'error',
      showRetry: true,
      ...options
    });
  }

  warning(message: string, options?: Partial<ErrorToastProps>): string {
    return this.show({
      message,
      type: 'warning',
      ...options
    });
  }

  info(message: string, options?: Partial<ErrorToastProps>): string {
    return this.show({
      message,
      type: 'info',
      autoClose: 3000,
      ...options
    });
  }

  success(message: string, options?: Partial<ErrorToastProps>): string {
    return this.show({
      message,
      type: 'success',
      autoClose: 3000,
      ...options
    });
  }
}

export const errorToastManager = ErrorToastManager.getInstance();
