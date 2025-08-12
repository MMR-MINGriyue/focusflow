/**
 * 设置状态管理
 * 使用 Zustand 管理应用设置状态
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { getSettings, saveSettings } from '../utils/storageUtils';

// 设置类型定义
interface AppSettings {
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

// 主题设置
interface ThemeSettings {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
}

// 通知设置
interface NotificationSettings {
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

// 状态类型定义
interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;

  // 操作方法
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  updateThemeSettings: (themeSettings: ThemeSettings) => void;
  updateNotificationSettings: (notificationSettings: NotificationSettings) => void;
  resetToDefaults: () => void;
  loadSettings: () => Promise<void>;
}

// 默认设置
const defaultSettings: AppSettings = {
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

// 创建设置存储
export const settingsStore = create<SettingsState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      settings: defaultSettings,
      isLoading: false,
      error: null,

      // 更新设置
      updateSettings: (newSettings: Partial<AppSettings>) => {
        const currentState = get().settings;

        // 验证设置
        const validatedSettings = validateSettings({
          ...currentState,
          ...newSettings
        });

        // 更新状态
        set((state) => ({
          settings: validatedSettings
        }));

        // 保存到存储
        saveSettings(validatedSettings).catch((error) => {
          console.error('Failed to save settings:', error);
        });
      },

      // 更新主题设置
      updateThemeSettings: (themeSettings: ThemeSettings) => {
        const currentState = get().settings;
        const updatedSettings = {
          ...currentState,
          ...themeSettings
        };

        // 更新状态
        set((state) => ({
          settings: updatedSettings
        }));

        // 保存到存储
        saveSettings(updatedSettings).catch((error) => {
          console.error('Failed to save settings:', error);
        });
      },

      // 更新通知设置
      updateNotificationSettings: (notificationSettings: NotificationSettings) => {
        const currentState = get().settings;
        const updatedSettings = {
          ...currentState,
          ...notificationSettings
        };

        // 更新状态
        set((state) => ({
          settings: updatedSettings
        }));

        // 保存到存储
        saveSettings(updatedSettings).catch((error) => {
          console.error('Failed to save settings:', error);
        });
      },

      // 重置为默认设置
      resetToDefaults: () => {
        set((state) => ({
          settings: defaultSettings
        }));

        // 保存默认设置到存储
        saveSettings(defaultSettings).catch((error) => {
          console.error('Failed to save settings:', error);
        });
      },

      // 加载设置
      loadSettings: async () => {
        set({ isLoading: true, error: null });

        try {
          const savedSettings = await getSettings();

          // 验证加载的设置
          const validatedSettings = validateSettings({
            ...defaultSettings,
            ...savedSettings
          });

          set({
            settings: validatedSettings,
            isLoading: false
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load settings',
            isLoading: false,
            settings: defaultSettings // 回退到默认设置
          });
        }
      },
    }),
    {
      name: 'focusflow-settings'
    }
  )
);

// 验证设置
function validateSettings(settings: AppSettings): AppSettings {
  const validatedSettings = { ...settings };

  // 验证工作时间
  if (typeof validatedSettings.workDuration !== 'number' || 
      validatedSettings.workDuration <= 0 || 
      validatedSettings.workDuration > 60) {
    console.warn(`Invalid work duration: ${validatedSettings.workDuration}. Using default: ${defaultSettings.workDuration}`);
    validatedSettings.workDuration = defaultSettings.workDuration;
  }

  // 验证短休息时间
  if (typeof validatedSettings.shortBreakDuration !== 'number' || 
      validatedSettings.shortBreakDuration <= 0 || 
      validatedSettings.shortBreakDuration > 30) {
    console.warn(`Invalid short break duration: ${validatedSettings.shortBreakDuration}. Using default: ${defaultSettings.shortBreakDuration}`);
    validatedSettings.shortBreakDuration = defaultSettings.shortBreakDuration;
  }

  // 验证长休息时间
  if (typeof validatedSettings.longBreakDuration !== 'number' || 
      validatedSettings.longBreakDuration <= 0 || 
      validatedSettings.longBreakDuration > 60) {
    console.warn(`Invalid long break duration: ${validatedSettings.longBreakDuration}. Using default: ${defaultSettings.longBreakDuration}`);
    validatedSettings.longBreakDuration = defaultSettings.longBreakDuration;
  }

  // 验证长休息间隔
  if (typeof validatedSettings.longBreakInterval !== 'number' || 
      validatedSettings.longBreakInterval <= 0 || 
      validatedSettings.longBreakInterval > 10) {
    console.warn(`Invalid long break interval: ${validatedSettings.longBreakInterval}. Using default: ${defaultSettings.longBreakInterval}`);
    validatedSettings.longBreakInterval = defaultSettings.longBreakInterval;
  }

  // 验证微休息间隔
  if (typeof validatedSettings.microBreakInterval !== 'number' || 
      validatedSettings.microBreakInterval < 5 || 
      validatedSettings.microBreakInterval > 60) {
    console.warn(`Invalid micro break interval: ${validatedSettings.microBreakInterval}. Using default: ${defaultSettings.microBreakInterval}`);
    validatedSettings.microBreakInterval = defaultSettings.microBreakInterval;
  }

  // 验证主题
  if (!['light', 'dark', 'system'].includes(validatedSettings.theme)) {
    console.warn(`Invalid theme: ${validatedSettings.theme}. Using default: ${defaultSettings.theme}`);
    validatedSettings.theme = defaultSettings.theme;
  }

  // 验证字体大小
  if (!['small', 'medium', 'large'].includes(validatedSettings.fontSize)) {
    console.warn(`Invalid font size: ${validatedSettings.fontSize}. Using default: ${defaultSettings.fontSize}`);
    validatedSettings.fontSize = defaultSettings.fontSize;
  }

  // 验证颜色代码
  if (!/^#[0-9A-F]{6}$/i.test(validatedSettings.accentColor)) {
    console.warn(`Invalid accent color: ${validatedSettings.accentColor}. Using default: ${defaultSettings.accentColor}`);
    validatedSettings.accentColor = defaultSettings.accentColor;
  }

  return validatedSettings;
}

// 初始化设置
settingsStore.getState().loadSettings();

// 导出 useSettingsStore hook
export const useSettingsStore = settingsStore;
