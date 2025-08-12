/**
 * 本地存储工具函数
 * 提供设置和统计数据的本地存储功能
 */

// 设置类型定义
export interface Settings {
  // 计时器设置
  mode: 'classic' | 'smart';
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;

  // 通知设置
  soundEnabled: boolean;
  notificationsEnabled: boolean;

  // 主题设置
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';

  // 界面设置
  showKeyboardShortcuts: boolean;

  // 微休息设置
  showMicroBreakReminders: boolean;
  microBreakInterval: number;
}

// 统计数据类型定义
export interface StatsData {
  totalFocusTime: number;                              // 总专注时间（分钟）
  completedPomodoros: number;                          // 完成的番茄数
  completedShortBreaks: number;                        // 完成的短休息数
  completedLongBreaks: number;                         // 完成的长休息数
  focusSessions: FocusSession[];                        // 专注会话记录
  efficiencyScores: number[];                          // 效率评分记录
  streak: number;                                      // 连续天数
}

// 专注会话记录类型
export interface FocusSession {
  date: string;                                        // 日期，格式为 YYYY-MM-DD
  duration: number;                                    // 持续时间（分钟）
  completedPomodoros: number;                          // 完成的番茄数
}

// 默认设置
const defaultSettings: Settings = {
  mode: 'classic',
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: true,
  autoStartPomodoros: false,
  soundEnabled: true,
  notificationsEnabled: true,
  theme: 'light',
  accentColor: '#4CAF50',
  fontSize: 'medium',
  showKeyboardShortcuts: false,
  showMicroBreakReminders: true,
  microBreakInterval: 20,
};

// 默认统计数据
const defaultStats: StatsData = {
  totalFocusTime: 0,
  completedPomodoros: 0,
  completedShortBreaks: 0,
  completedLongBreaks: 0,
  focusSessions: [],
  efficiencyScores: [],
  streak: 0,
};

// 存储键名
const SETTINGS_KEY = 'pomodoro_settings';
const STATS_KEY = 'pomodoro_stats';

/**
 * 获取设置
 * @returns Promise<Settings> 设置对象
 */
export async function getSettings(): Promise<Settings> {
  try {
    const storedSettings = localStorage.getItem(SETTINGS_KEY);

    if (!storedSettings) {
      return defaultSettings;
    }

    try {
      const parsedSettings = JSON.parse(storedSettings);
      return { ...defaultSettings, ...parsedSettings };
    } catch (error) {
      console.warn('Failed to parse settings from storage, using defaults');
      return defaultSettings;
    }
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return defaultSettings;
  }
}

/**
 * 保存设置
 * @param settings 要保存的设置对象
 * @returns Promise<void>
 */
export async function saveSettings(settings: Settings): Promise<void> {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
}

/**
 * 获取统计数据
 * @returns Promise<StatsData> 统计数据对象
 */
export async function getStats(): Promise<StatsData> {
  try {
    const storedStats = localStorage.getItem(STATS_KEY);

    if (!storedStats) {
      return defaultStats;
    }

    try {
      const parsedStats = JSON.parse(storedStats);
      return { ...defaultStats, ...parsedStats };
    } catch (error) {
      console.warn('Failed to parse stats from storage, using defaults');
      return defaultStats;
    }
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return defaultStats;
  }
}

/**
 * 保存统计数据
 * @param stats 要保存的统计数据对象
 * @returns Promise<void>
 */
export async function saveStats(stats: StatsData): Promise<void> {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to save stats:', error);
    throw error;
  }
}

/**
 * 清除所有应用相关的本地存储数据
 * @returns Promise<void>
 */
export async function clearStorage(): Promise<void> {
  try {
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(STATS_KEY);
  } catch (error) {
    console.error('Failed to clear storage:', error);
    throw error;
  }
}

/**
 * 导出所有存储工具函数
 */
export const storageUtils = {
  getSettings,
  saveSettings,
  getStats,
  saveStats,
  clearStorage,
};

export default storageUtils;
