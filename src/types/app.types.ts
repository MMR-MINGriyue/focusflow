/**
 * 应用程序类型定义
 * 包含整个应用程序中使用的通用类型定义
 */

// 导出设置类型
export type { Settings } from '../utils/storageUtils';

// 导出统计数据类型
export type { StatsData, FocusSession } from '../utils/storageUtils';

// 应用程序状态类型
export interface AppState {
  isLoading: boolean;
  error: string | null;
}

// 主题类型
export type Theme = 'light' | 'dark' | 'system';

// 字体大小类型
export type FontSize = 'small' | 'medium' | 'large';

// 计时器状态
export type TimerState = 'idle' | 'focus' | 'shortBreak' | 'longBreak' | 'microBreak';

// 通知类型
export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

// 应用程序配置
export interface AppConfig {
  version: string;
  environment: 'development' | 'production' | 'test';
  debug: boolean;
  features: {
    analytics: boolean;
    notifications: boolean;
    sound: boolean;
    themes: boolean;
    shortcuts: boolean;
  };
}

// 用户偏好设置
export interface UserPreferences {
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  startOfWeek: 'sunday' | 'monday';
}

// 键盘快捷键
export interface KeyboardShortcut {
  id: string;
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: string;
  description: string;
  enabled: boolean;
}

// 应用程序错误
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
}
