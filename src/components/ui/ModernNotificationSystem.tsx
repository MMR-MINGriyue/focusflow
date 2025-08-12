
/**
 * 现代化通知系统组件
 * 提供美观、流畅的通知体验
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

// 通知类型
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

// 通知接口
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// 通知上下文接口
interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

// 创建通知上下文
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// 通知提供者组件
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // 添加通知
  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000, // 默认5秒
    };

    setNotifications(prev => [...prev, newNotification as Notification]);

    // 自动移除通知
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  // 移除通知
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // 清除所有通知
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // 上下文值
  const contextValue: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

// 使用通知上下文的Hook
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// 通知容器组件
const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-4 max-w-md w-full">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

// 单个通知项组件
interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // 进入动画
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // 关闭通知
  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300); // 等待退出动画完成
  }, [onClose]);

  // 获取通知图标和颜色
  const getNotificationConfig = useCallback((type: NotificationType) => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          textColor: 'text-green-800 dark:text-green-200',
          borderColor: 'border-green-200 dark:border-green-800',
          iconColor: 'text-green-500',
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          textColor: 'text-red-800 dark:text-red-200',
          borderColor: 'border-red-200 dark:border-red-800',
          iconColor: 'text-red-500',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          textColor: 'text-yellow-800 dark:text-yellow-200',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          iconColor: 'text-yellow-500',
        };
      case 'info':
      default:
        return {
          icon: <Info className="h-5 w-5" />,
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          textColor: 'text-blue-800 dark:text-blue-200',
          borderColor: 'border-blue-200 dark:border-blue-800',
          iconColor: 'text-blue-500',
        };
    }
  }, []);

  const config = getNotificationConfig(notification.type);

  return (
    <div
      className={cn(
        'modern-notification transform transition-all duration-300 ease-in-out',
        config.bgColor,
        config.textColor,
        config.borderColor,
        'border rounded-lg shadow-lg p-4 flex items-start',
        isVisible && !isExiting && 'translate-x-0 opacity-100',
        !isVisible && 'translate-x-full opacity-0',
        isExiting && 'translate-x-full opacity-0'
      )}
    >
      <div className={cn('flex-shrink-0 mr-3', config.iconColor)}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm mb-1">{notification.title}</h4>
        {notification.message && (
          <p className="text-sm opacity-90">{notification.message}</p>
        )}
        {notification.action && (
          <button
            onClick={() => {
              notification.action?.onClick();
              handleClose();
            }}
            className={cn(
              'mt-2 text-sm font-medium hover:underline',
              config.textColor
            )}
          >
            {notification.action.label}
          </button>
        )}
      </div>
      <button
        onClick={handleClose}
        className={cn(
          'flex-shrink-0 ml-4 rounded-md p-1 hover:bg-black/10 dark:hover:bg-white/10',
          config.textColor
        )}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

// 便捷方法导出
export const notification = {
  success: (title: string, message?: string, duration?: number) => {
    // 这个方法将在使用useNotification的组件中使用
    console.log('Success notification:', { title, message, duration });
  },
  error: (title: string, message?: string, duration?: number) => {
    console.log('Error notification:', { title, message, duration });
  },
  warning: (title: string, message?: string, duration?: number) => {
    console.log('Warning notification:', { title, message, duration });
  },
  info: (title: string, message?: string, duration?: number) => {
    console.log('Info notification:', { title, message, duration });
  },
};
