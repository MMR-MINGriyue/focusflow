/**
 * 屏幕阅读器支持组件
 * 提供ARIA标签、实时播报和语义化支持
 */

import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useRef, 
  useState, 
  useCallback,
  ReactNode
} from 'react';
import { cn } from '../../utils/cn';

// 播报优先级
type AnnouncementPriority = 'polite' | 'assertive' | 'off';

// 播报类型
type AnnouncementType = 'status' | 'alert' | 'log' | 'timer' | 'navigation';

// 播报消息
interface AnnouncementMessage {
  id: string;
  message: string;
  priority: AnnouncementPriority;
  type: AnnouncementType;
  timestamp: number;
  persistent?: boolean; // 是否持久显示
}

// 屏幕阅读器上下文
interface ScreenReaderContext {
  announce: (message: string, priority?: AnnouncementPriority, type?: AnnouncementType) => void;
  announceTimer: (time: string, status: string) => void;
  announceNavigation: (location: string, context?: string) => void;
  announceStatus: (status: string, details?: string) => void;
  announceAlert: (alert: string, action?: string) => void;
  clearAnnouncements: () => void;
  setLiveRegionEnabled: (enabled: boolean) => void;
}

const ScreenReaderContext = createContext<ScreenReaderContext | null>(null);

// 屏幕阅读器Provider
export const ScreenReaderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [announcements, setAnnouncements] = useState<AnnouncementMessage[]>([]);
  const [liveRegionEnabled, setLiveRegionEnabled] = useState(true);
  const politeRegionRef = useRef<HTMLDivElement>(null);
  const assertiveRegionRef = useRef<HTMLDivElement>(null);
  const announcementIdRef = useRef(0);

  // 通用播报函数
  const announce = useCallback((
    message: string, 
    priority: AnnouncementPriority = 'polite',
    type: AnnouncementType = 'status'
  ) => {
    if (!liveRegionEnabled || priority === 'off') return;

    const announcement: AnnouncementMessage = {
      id: `announcement-${++announcementIdRef.current}`,
      message,
      priority,
      type,
      timestamp: Date.now()
    };

    setAnnouncements(prev => [...prev.slice(-9), announcement]); // 保留最近10条

    // 更新对应的live region
    const targetRegion = priority === 'assertive' ? assertiveRegionRef.current : politeRegionRef.current;
    if (targetRegion) {
      targetRegion.textContent = message;
      
      // 清除消息以便下次播报
      setTimeout(() => {
        if (targetRegion.textContent === message) {
          targetRegion.textContent = '';
        }
      }, 1000);
    }
  }, [liveRegionEnabled]);

  // 计时器播报
  const announceTimer = useCallback((time: string, status: string) => {
    const message = `计时器 ${status}，剩余时间 ${time}`;
    announce(message, 'polite', 'timer');
  }, [announce]);

  // 导航播报
  const announceNavigation = useCallback((location: string, context?: string) => {
    const message = context ? `导航到 ${location}，${context}` : `导航到 ${location}`;
    announce(message, 'polite', 'navigation');
  }, [announce]);

  // 状态播报
  const announceStatus = useCallback((status: string, details?: string) => {
    const message = details ? `${status}，${details}` : status;
    announce(message, 'polite', 'status');
  }, [announce]);

  // 警告播报
  const announceAlert = useCallback((alert: string, action?: string) => {
    const message = action ? `警告：${alert}，${action}` : `警告：${alert}`;
    announce(message, 'assertive', 'alert');
  }, [announce]);

  // 清除播报
  const clearAnnouncements = useCallback(() => {
    setAnnouncements([]);
    if (politeRegionRef.current) politeRegionRef.current.textContent = '';
    if (assertiveRegionRef.current) assertiveRegionRef.current.textContent = '';
  }, []);

  const contextValue: ScreenReaderContext = {
    announce,
    announceTimer,
    announceNavigation,
    announceStatus,
    announceAlert,
    clearAnnouncements,
    setLiveRegionEnabled
  };

  return (
    <ScreenReaderContext.Provider value={contextValue}>
      {children}
      
      {/* Live Regions for screen readers */}
      <div className="sr-only">
        <div
          ref={politeRegionRef}
          aria-live="polite"
          aria-atomic="true"
          role="status"
        />
        <div
          ref={assertiveRegionRef}
          aria-live="assertive"
          aria-atomic="true"
          role="alert"
        />
      </div>

      {/* 可视化播报历史（开发模式） */}
      {process.env.NODE_ENV === 'development' && (
        <AnnouncementHistory announcements={announcements} />
      )}
    </ScreenReaderContext.Provider>
  );
};

// 使用屏幕阅读器Hook
export const useScreenReader = () => {
  const context = useContext(ScreenReaderContext);
  if (!context) {
    throw new Error('useScreenReader must be used within ScreenReaderProvider');
  }
  return context;
};

// 播报历史组件（开发模式）
const AnnouncementHistory: React.FC<{ announcements: AnnouncementMessage[] }> = ({ announcements }) => {
  const [isVisible, setIsVisible] = useState(false);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 p-2 bg-blue-600 text-white rounded-full shadow-lg"
        title="显示屏幕阅读器播报历史"
      >
        📢
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-h-96 bg-white border shadow-lg rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-3 bg-blue-600 text-white">
        <h3 className="font-medium">屏幕阅读器播报</h3>
        <button onClick={() => setIsVisible(false)} className="text-white hover:bg-blue-700 rounded p-1">
          ✕
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto p-2 space-y-2">
        {announcements.length === 0 ? (
          <p className="text-gray-500 text-sm">暂无播报</p>
        ) : (
          announcements.map(announcement => (
            <div
              key={announcement.id}
              className={cn(
                'p-2 rounded text-sm',
                announcement.priority === 'assertive' ? 'bg-red-50 border-l-4 border-red-400' :
                announcement.type === 'timer' ? 'bg-blue-50 border-l-4 border-blue-400' :
                announcement.type === 'navigation' ? 'bg-green-50 border-l-4 border-green-400' :
                'bg-gray-50 border-l-4 border-gray-400'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600">
                  {announcement.type} • {announcement.priority}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(announcement.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p>{announcement.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ARIA增强的组件包装器
export const AriaEnhanced: React.FC<{
  children: ReactNode;
  role?: string;
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  expanded?: boolean;
  selected?: boolean;
  checked?: boolean;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  live?: AnnouncementPriority;
  atomic?: boolean;
  relevant?: string;
  busy?: boolean;
  hidden?: boolean;
  className?: string;
}> = ({
  children,
  role,
  label,
  labelledBy,
  describedBy,
  expanded,
  selected,
  checked,
  disabled,
  required,
  invalid,
  live,
  atomic,
  relevant,
  busy,
  hidden,
  className
}) => {
  const ariaProps: Record<string, any> = {};

  if (role) ariaProps.role = role;
  if (label) ariaProps['aria-label'] = label;
  if (labelledBy) ariaProps['aria-labelledby'] = labelledBy;
  if (describedBy) ariaProps['aria-describedby'] = describedBy;
  if (expanded !== undefined) ariaProps['aria-expanded'] = expanded;
  if (selected !== undefined) ariaProps['aria-selected'] = selected;
  if (checked !== undefined) ariaProps['aria-checked'] = checked;
  if (disabled !== undefined) ariaProps['aria-disabled'] = disabled;
  if (required !== undefined) ariaProps['aria-required'] = required;
  if (invalid !== undefined) ariaProps['aria-invalid'] = invalid;
  if (live) ariaProps['aria-live'] = live;
  if (atomic !== undefined) ariaProps['aria-atomic'] = atomic;
  if (relevant) ariaProps['aria-relevant'] = relevant;
  if (busy !== undefined) ariaProps['aria-busy'] = busy;
  if (hidden !== undefined) ariaProps['aria-hidden'] = hidden;

  return (
    <div className={className} {...ariaProps}>
      {children}
    </div>
  );
};

// 语义化计时器组件
export const AccessibleTimer: React.FC<{
  time: string;
  status: 'running' | 'paused' | 'stopped';
  phase: 'focus' | 'break' | 'longBreak';
  progress?: number;
  className?: string;
}> = ({ time, status, phase, progress, className }) => {
  const { announceTimer } = useScreenReader();
  const prevTimeRef = useRef(time);
  const prevStatusRef = useRef(status);

  // 播报时间变化
  useEffect(() => {
    if (time !== prevTimeRef.current || status !== prevStatusRef.current) {
      if (status === 'running') {
        // 每分钟播报一次
        const [minutes] = time.split(':').map(Number);
        const [prevMinutes] = prevTimeRef.current.split(':').map(Number);
        
        if (minutes !== prevMinutes && minutes % 1 === 0) {
          announceTimer(time, getStatusText(status, phase));
        }
      } else {
        announceTimer(time, getStatusText(status, phase));
      }
      
      prevTimeRef.current = time;
      prevStatusRef.current = status;
    }
  }, [time, status, phase, announceTimer]);

  const getStatusText = (status: string, phase: string) => {
    const phaseText = phase === 'focus' ? '专注' : phase === 'break' ? '短休息' : '长休息';
    const statusText = status === 'running' ? '进行中' : status === 'paused' ? '已暂停' : '已停止';
    return `${phaseText}${statusText}`;
  };

  return (
    <AriaEnhanced
      role="timer"
      label={`${getStatusText(status, phase)}，剩余时间 ${time}`}
      live="polite"
      atomic={true}
      className={className}
    >
      <div className="text-center">
        <div className="text-4xl font-mono font-bold mb-2" aria-hidden="true">
          {time}
        </div>
        <div className="text-lg text-muted-foreground">
          {getStatusText(status, phase)}
        </div>
        {progress !== undefined && (
          <div className="mt-4">
            <div className="sr-only">
              进度：{Math.round(progress)}%
            </div>
            <div 
              className="w-full bg-muted rounded-full h-2"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="计时器进度"
            >
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </AriaEnhanced>
  );
};

// 可访问的表单字段
export const AccessibleFormField: React.FC<{
  id: string;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}> = ({ id, label, description, error, required, children, className }) => {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ');

  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1" aria-label="必填">*</span>}
      </label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      <div>
        {React.cloneElement(children as React.ReactElement, {
          id,
          'aria-describedby': describedBy || undefined,
          'aria-required': required,
          'aria-invalid': !!error
        })}
      </div>
      
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// 可访问的状态指示器
export const AccessibleStatusIndicator: React.FC<{
  status: 'success' | 'warning' | 'error' | 'info';
  message: string;
  details?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}> = ({ status, message, details, dismissible, onDismiss, className }) => {
  const { announceStatus, announceAlert } = useScreenReader();

  useEffect(() => {
    if (status === 'error') {
      announceAlert(message, details);
    } else {
      announceStatus(message, details);
    }
  }, [status, message, details, announceStatus, announceAlert]);

  const getStatusIcon = () => {
    switch (status) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✕';
      case 'info': return 'ℹ';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <AriaEnhanced
      role={status === 'error' ? 'alert' : 'status'}
      live={status === 'error' ? 'assertive' : 'polite'}
      atomic={true}
      className={cn(
        'flex items-start gap-3 p-4 border rounded-lg',
        getStatusColor(),
        className
      )}
    >
      <span className="flex-shrink-0 text-lg" aria-hidden="true">
        {getStatusIcon()}
      </span>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium">{message}</p>
        {details && (
          <p className="mt-1 text-sm opacity-90">{details}</p>
        )}
      </div>
      
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 hover:bg-black/10 rounded"
          aria-label="关闭通知"
        >
          <span aria-hidden="true">✕</span>
        </button>
      )}
    </AriaEnhanced>
  );
};

// 可访问的数据表格
export const AccessibleDataTable: React.FC<{
  caption: string;
  headers: string[];
  data: Array<Record<string, any>>;
  sortable?: boolean;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  className?: string;
}> = ({ caption, headers, data, sortable, onSort, className }) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: string) => {
    if (!sortable || !onSort) return;
    
    const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(newDirection);
    onSort(column, newDirection);
  };

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse" role="table">
        <caption className="sr-only">{caption}</caption>
        
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                scope="col"
                className={cn(
                  'px-4 py-2 text-left border-b font-medium',
                  sortable && 'cursor-pointer hover:bg-muted/50'
                )}
                onClick={() => sortable && handleSort(header)}
                aria-sort={
                  sortColumn === header 
                    ? sortDirection === 'asc' ? 'ascending' : 'descending'
                    : sortable ? 'none' : undefined
                }
              >
                <div className="flex items-center gap-2">
                  {header}
                  {sortable && (
                    <span aria-hidden="true">
                      {sortColumn === header 
                        ? sortDirection === 'asc' ? '↑' : '↓'
                        : '↕'
                      }
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b hover:bg-muted/30">
              {headers.map((header, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-4 py-2"
                  role="gridcell"
                >
                  {row[header]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default {
  ScreenReaderProvider,
  useScreenReader,
  AriaEnhanced,
  AccessibleTimer,
  AccessibleFormField,
  AccessibleStatusIndicator,
  AccessibleDataTable
};