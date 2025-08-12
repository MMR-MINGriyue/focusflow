import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  Bell, 
  CheckCircle, 
  X, 
 
  Trash2,

  AlertCircle,
  Info,
  Check,

} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean; // 是否持久化通知（不会被自动清除）
}

interface NotificationCenterProps {
  className?: string;
  maxNotifications?: number;
  autoClear?: boolean;
  autoClearDelay?: number; // 自动清除通知的延迟（毫秒）
}

/**
 * 通知中心组件
 * 管理应用中的所有通知
 */
const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  className = '',
  maxNotifications = 10,
  autoClear = true,
  autoClearDelay = 5000
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [showPanel, setShowPanel] = useState(false);

  // 添加通知
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => {
      // 限制通知数量
      const updatedNotifications = [...prev, newNotification];
      if (updatedNotifications.length > maxNotifications) {
        return updatedNotifications.slice(updatedNotifications.length - maxNotifications);
      }
      return updatedNotifications;
    });

    // 自动清除非持久化通知
    if (autoClear && !notification.persistent) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, autoClearDelay);
    }
  };

  // 移除通知
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // 标记通知为已读
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  // 标记所有通知为已读
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // 清除所有通知
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // 获取过滤后的通知
  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(notification => !notification.read);
      case 'read':
        return notifications.filter(notification => notification.read);
      default:
        return notifications;
    }
  };

  // 获取未读通知数量
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // 获取通知类型图标
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <X className="w-5 h-5 text-red-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  // 格式化时间
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
      return '刚刚';
    } else if (diffMins < 60) {
      return `${diffMins}分钟前`;
    } else if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)}小时前`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // 暴露添加通知的方法到全局
  useEffect(() => {
    (window as any).addNotification = addNotification;

    return () => {
      delete (window as any).addNotification;
    };
  }, []);

  // 示例通知
  useEffect(() => {
    // 添加一些示例通知
    setTimeout(() => {
      addNotification({
        title: '欢迎使用 FocusFlow',
        message: '开始您的第一个专注会话，提高工作效率',
        type: 'info',
        persistent: true
      });
    }, 1000);

    setTimeout(() => {
      addNotification({
        title: '提示',
        message: '您已经连续专注3天了，继续保持！',
        type: 'success'
      });
    }, 3000);
  }, []);

  const filteredNotifications = getFilteredNotifications();

  return (
    <div className={`relative ${className}`}>
      {/* 通知按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowPanel(!showPanel)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* 通知面板 */}
      {showPanel && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  通知中心
                </CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllNotifications}
                    disabled={notifications.length === 0}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPanel(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* 过滤器 */}
              <div className="flex space-x-2 mt-3">
                <Button
                  variant={filter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('all')}
                  className="text-xs"
                >
                  全部 ({notifications.length})
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                  className="text-xs"
                >
                  未读 ({unreadCount})
                </Button>
                <Button
                  variant={filter === 'read' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('read')}
                  className="text-xs"
                >
                  已读 ({notifications.length - unreadCount})
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {filteredNotifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>暂无通知</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredNotifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${
                          !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                        }`}
                      >
                        <div className="flex">
                          <div className="flex-shrink-0 mr-3">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <h4 className={`font-medium truncate ${
                                !notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                              }`}>
                                {notification.title}
                              </h4>
                              <div className="flex items-center ml-2">
                                {!notification.read && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                )}
                                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                  {formatTime(notification.timestamp)}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                              {notification.message}
                            </p>

                            {notification.action && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  notification.action?.onClick();
                                  markAsRead(notification.id);
                                }}
                                className="mt-2 text-xs p-0 h-auto"
                              >
                                {notification.action.label}
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end mt-2 space-x-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs"
                            >
                              标记为已读
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeNotification(notification.id)}
                            className="text-xs"
                          >
                            删除
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 点击外部关闭面板 */}
      {showPanel && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowPanel(false)}
        ></div>
      )}
    </div>
  );
};

export default NotificationCenter;
