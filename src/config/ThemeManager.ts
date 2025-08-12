/**
 * 增强的主题管理器
 * 提供主题切换、自定义主题和主题持久化功能
 */

import { deepClone, deepMerge, debounce } from '../utils';

/**
 * 主题颜色配置
 */
export interface ThemeColors {
  /**
   * 主色调
   */
  primary: string;
  /**
   * 次要色调
   */
  secondary: string;
  /**
   * 成功色
   */
  success: string;
  /**
   * 警告色
   */
  warning: string;
  /**
   * 错误色
   */
  error: string;
  /**
   * 信息色
   */
  info: string;
  /**
   * 背景色
   */
  background: string;
  /**
   * 前景色
   */
  foreground: string;
  /**
   * 卡片背景色
   */
  card: string;
  /**
   * 卡片前景色
   */
  'card-foreground': string;
  /**
   * 弹出层背景色
   */
  popover: string;
  /**
   * 弹出层前景色
   */
  'popover-foreground': string;
  /**
   * 边框色
   */
  border: string;
  /**
   * 输入框背景色
   */
  input: string;
  /**
   * 链接色
   */
  link: string;
  /**
   * 圆角大小
   */
  radius: string;
}

/**
 * 主题配置
 */
export interface ThemeConfig {
  /**
   * 主题名称
   */
  name: string;
  /**
   * 主题颜色
   */
  colors: ThemeColors;
  /**
   * 是否为深色主题
   */
  dark: boolean;
  /**
   * 自定义CSS变量
   */
  customVariables?: Record<string, string>;
}

/**
 * 主题变更事件类型
 */
export type ThemeChangeEvent = {
  /**
   * 旧主题
   */
  oldTheme: ThemeConfig;
  /**
   * 新主题
   */
  newTheme: ThemeConfig;
};

/**
 * 主题管理器选项
 */
export interface ThemeManagerOptions {
  /**
   * 默认主题
   */
  defaultTheme: ThemeConfig;
  /**
   * 可用主题
   */
  availableThemes: ThemeConfig[];
  /**
   * 主题变更回调
   */
  onChange?: (event: ThemeChangeEvent) => void;
  /**
   * 是否启用持久化
   */
  persist?: boolean;
  /**
   * 持久化键名
   */
  persistKey?: string;
}

/**
 * 增强的主题管理器
 */
export class ThemeManager {
  private currentTheme: ThemeConfig;
  private defaultTheme: ThemeConfig;
  private availableThemes: ThemeConfig[];
  private listeners: ((event: ThemeChangeEvent) => void)[] = [];
  private persist: boolean;
  private persistKey: string;

  constructor(options: ThemeManagerOptions) {
    this.defaultTheme = deepClone(options.defaultTheme);
    this.availableThemes = deepClone(options.availableThemes);
    this.persist = options.persist ?? false;
    this.persistKey = options.persistKey ?? 'app-theme';

    // 加载主题
    this.currentTheme = this.loadTheme();

    // 注册全局变更回调
    if (options.onChange) {
      this.subscribe(options.onChange);
    }

    // 应用主题
    this.applyTheme(this.currentTheme);
  }

  /**
   * 加载主题
   */
  private loadTheme(): ThemeConfig {
    // 从持久化存储加载
    if (this.persist) {
      try {
        const persistedThemeName = localStorage.getItem(this.persistKey);
        if (persistedThemeName) {
          const theme = this.availableThemes.find(t => t.name === persistedThemeName);
          if (theme) {
            return theme;
          }
        }
      } catch (error) {
        console.error('Failed to load persisted theme:', error);
      }
    }

    // 使用默认主题
    return this.defaultTheme;
  }

  /**
   * 保存主题
   */
  private saveTheme(): void {
    if (this.persist) {
      try {
        localStorage.setItem(this.persistKey, this.currentTheme.name);
      } catch (error) {
        console.error('Failed to save theme:', error);
      }
    }
  }

  /**
   * 应用主题
   */
  private applyTheme(theme: ThemeConfig): void {
    const root = document.documentElement;

    // 应用CSS变量
    for (const [key, value] of Object.entries(theme.colors)) {
      const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVar, value);
    }

    // 应用自定义CSS变量
    if (theme.customVariables) {
      for (const [key, value] of Object.entries(theme.customVariables)) {
        root.style.setProperty(key, value);
      }
    }

    // 应用深色模式类
    if (theme.dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  /**
   * 触发主题变更事件
   */
  private emitChangeEvent(oldTheme: ThemeConfig, newTheme: ThemeConfig): void {
    const event: ThemeChangeEvent = {
      oldTheme,
      newTheme,
    };

    // 触发所有监听器
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in theme change listener:', error);
      }
    });
  }

  /**
   * 获取当前主题
   */
  getCurrentTheme(): ThemeConfig {
    return deepClone(this.currentTheme);
  }

  /**
   * 获取默认主题
   */
  getDefaultTheme(): ThemeConfig {
    return deepClone(this.defaultTheme);
  }

  /**
   * 获取可用主题
   */
  getAvailableThemes(): ThemeConfig[] {
    return deepClone(this.availableThemes);
  }

  /**
   * 设置主题
   */
  setTheme(themeName: string): void {
    const theme = this.availableThemes.find(t => t.name === themeName);
    if (!theme) {
      throw new Error(`Theme "${themeName}" not found`);
    }

    if (theme.name === this.currentTheme.name) {
      return; // 主题未变化
    }

    const oldTheme = this.currentTheme;
    this.currentTheme = theme;

    // 保存主题
    this.saveTheme();

    // 应用主题
    this.applyTheme(theme);

    // 触发变更事件
    this.emitChangeEvent(oldTheme, theme);
  }

  /**
   * 切换深色/浅色模式
   */
  toggleDarkMode(): void {
    const newDarkMode = !this.currentTheme.dark;

    // 查找相同颜色但不同深色模式的主题
    const newTheme = this.availableThemes.find(
      t => t.dark === newDarkMode && 
      t.colors.primary === this.currentTheme.colors.primary
    );

    if (newTheme) {
      this.setTheme(newTheme.name);
    } else {
      // 如果没有找到，创建一个新主题
      const newTheme: ThemeConfig = {
        ...this.currentTheme,
        name: `${this.currentTheme.name} ${newDarkMode ? 'Dark' : 'Light'}`,
        dark: newDarkMode,
      };
      this.addCustomTheme(newTheme);
      this.setTheme(newTheme.name);
    }
  }

  /**
   * 更新主题颜色
   */
  updateThemeColors(colors: Partial<ThemeColors>): void {
    const oldTheme = deepClone(this.currentTheme);
    const newTheme = {
      ...this.currentTheme,
      colors: {
        ...this.currentTheme.colors,
        ...colors,
      },
    };

    this.currentTheme = newTheme;

    // 保存主题
    this.saveTheme();

    // 应用主题
    this.applyTheme(newTheme);

    // 触发变更事件
    this.emitChangeEvent(oldTheme, newTheme);
  }

  /**
   * 添加自定义主题
   */
  addCustomTheme(theme: ThemeConfig): void {
    // 检查主题是否已存在
    const existingTheme = this.availableThemes.find(t => t.name === theme.name);
    if (existingTheme) {
      throw new Error(`Theme "${theme.name}" already exists`);
    }

    // 添加主题
    this.availableThemes.push(deepClone(theme));
  }

  /**
   * 移除自定义主题
   */
  removeCustomTheme(themeName: string): void {
    // 不能移除默认主题
    if (themeName === this.defaultTheme.name) {
      throw new Error('Cannot remove default theme');
    }

    // 查找主题
    const index = this.availableThemes.findIndex(t => t.name === themeName);
    if (index === -1) {
      throw new Error(`Theme "${themeName}" not found`);
    }

    // 如果当前主题是要移除的主题，切换到默认主题
    if (this.currentTheme.name === themeName) {
      this.setTheme(this.defaultTheme.name);
    }

    // 移除主题
    this.availableThemes.splice(index, 1);
  }

  /**
   * 重置为默认主题
   */
  resetToDefault(): void {
    this.setTheme(this.defaultTheme.name);
  }

  /**
   * 订阅主题变更
   */
  subscribe(callback: (event: ThemeChangeEvent) => void): () => void {
    this.listeners.push(callback);

    // 返回取消订阅函数
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * 导出主题
   */
  exportTheme(themeName?: string): string {
    const theme = themeName 
      ? this.availableThemes.find(t => t.name === themeName)
      : this.currentTheme;

    if (!theme) {
      throw new Error(`Theme "${themeName}" not found`);
    }

    return JSON.stringify(theme, null, 2);
  }

  /**
   * 导入主题
   */
  importTheme(themeJson: string): void {
    try {
      const importedTheme = JSON.parse(themeJson) as ThemeConfig;

      // 验证主题
      if (!importedTheme.name || !importedTheme.colors) {
        throw new Error('Invalid theme format');
      }

      // 检查主题是否已存在
      const existingTheme = this.availableThemes.find(t => t.name === importedTheme.name);
      if (existingTheme) {
        // 更新现有主题
        const index = this.availableThemes.indexOf(existingTheme);
        this.availableThemes[index] = importedTheme;

        // 如果当前主题是要更新的主题，应用新主题
        if (this.currentTheme.name === importedTheme.name) {
          const oldTheme = deepClone(this.currentTheme);
          this.currentTheme = importedTheme;

          // 保存主题
          this.saveTheme();

          // 应用主题
          this.applyTheme(importedTheme);

          // 触发变更事件
          this.emitChangeEvent(oldTheme, importedTheme);
        }
      } else {
        // 添加新主题
        this.availableThemes.push(importedTheme);
      }
    } catch (error) {
      console.error('Failed to import theme:', error);
      throw error;
    }
  }

  /**
   * 销毁主题管理器
   */
  destroy(): void {
    this.listeners = [];
  }
}

/**
 * 创建主题管理器
 */
export function createThemeManager(options: ThemeManagerOptions): ThemeManager {
  return new ThemeManager(options);
}

/**
 * 预定义主题
 */
export const predefinedThemes: {
  light: ThemeConfig;
  dark: ThemeConfig;
  blue: ThemeConfig;
  green: ThemeConfig;
  red: ThemeConfig;
  purple: ThemeConfig;
} = {
  light: {
    name: 'Light',
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      background: '#ffffff',
      foreground: '#0f172a',
      card: '#ffffff',
      'card-foreground': '#0f172a',
      popover: '#ffffff',
      'popover-foreground': '#0f172a',
      border: '#e2e8f0',
      input: '#ffffff',
      link: '#3b82f6',
      radius: '0.5rem',
    },
    dark: false,
  },
  dark: {
    name: 'Dark',
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      background: '#0f172a',
      foreground: '#f8fafc',
      card: '#1e293b',
      'card-foreground': '#f8fafc',
      popover: '#1e293b',
      'popover-foreground': '#f8fafc',
      border: '#334155',
      input: '#1e293b',
      link: '#3b82f6',
      radius: '0.5rem',
    },
    dark: true,
  },
  blue: {
    name: 'Blue',
    colors: {
      primary: '#2563eb',
      secondary: '#64748b',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      background: '#f0f9ff',
      foreground: '#0c4a6e',
      card: '#ffffff',
      'card-foreground': '#0c4a6e',
      popover: '#ffffff',
      'popover-foreground': '#0c4a6e',
      border: '#bae6fd',
      input: '#ffffff',
      link: '#2563eb',
      radius: '0.5rem',
    },
    dark: false,
  },
  green: {
    name: 'Green',
    colors: {
      primary: '#16a34a',
      secondary: '#64748b',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      background: '#f0fdf4',
      foreground: '#14532d',
      card: '#ffffff',
      'card-foreground': '#14532d',
      popover: '#ffffff',
      'popover-foreground': '#14532d',
      border: '#bbf7d0',
      input: '#ffffff',
      link: '#16a34a',
      radius: '0.5rem',
    },
    dark: false,
  },
  red: {
    name: 'Red',
    colors: {
      primary: '#dc2626',
      secondary: '#64748b',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      background: '#fef2f2',
      foreground: '#7f1d1d',
      card: '#ffffff',
      'card-foreground': '#7f1d1d',
      popover: '#ffffff',
      'popover-foreground': '#7f1d1d',
      border: '#fecaca',
      input: '#ffffff',
      link: '#dc2626',
      radius: '0.5rem',
    },
    dark: false,
  },
  purple: {
    name: 'Purple',
    colors: {
      primary: '#9333ea',
      secondary: '#64748b',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      background: '#faf5ff',
      foreground: '#4c1d95',
      card: '#ffffff',
      'card-foreground': '#4c1d95',
      popover: '#ffffff',
      'popover-foreground': '#4c1d95',
      border: '#e9d5ff',
      input: '#ffffff',
      link: '#9333ea',
      radius: '0.5rem',
    },
    dark: false,
  },
};
