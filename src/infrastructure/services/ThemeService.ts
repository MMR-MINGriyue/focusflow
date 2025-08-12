/**
 * 主题服务实现
 * 处理应用主题管理
 */

import { IThemeService } from './ServiceInterfaces';

export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    border: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
  };
  spacing: {
    unit: number;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

export const defaultThemes: Record<string, Theme> = {
  light: {
    id: 'light',
    name: '浅色主题',
    colors: {
      primary: '#3b82f6',
      secondary: '#10b981',
      background: '#ffffff',
      surface: '#f9fafb',
      text: '#111827',
      border: '#e5e7eb'
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem'
      }
    },
    spacing: {
      unit: 4
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem'
    }
  },
  dark: {
    id: 'dark',
    name: '深色主题',
    colors: {
      primary: '#60a5fa',
      secondary: '#34d399',
      background: '#111827',
      surface: '#1f2937',
      text: '#f9fafb',
      border: '#374151'
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem'
      }
    },
    spacing: {
      unit: 4
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem'
    }
  },
  blue: {
    id: 'blue',
    name: '蓝色主题',
    colors: {
      primary: '#3b82f6',
      secondary: '#60a5fa',
      background: '#eff6ff',
      surface: '#dbeafe',
      text: '#1e3a8a',
      border: '#93c5fd'
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem'
      }
    },
    spacing: {
      unit: 4
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem'
    }
  },
  green: {
    id: 'green',
    name: '绿色主题',
    colors: {
      primary: '#10b981',
      secondary: '#34d399',
      background: '#ecfdf5',
      surface: '#d1fae5',
      text: '#064e3b',
      border: '#6ee7b7'
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem'
      }
    },
    spacing: {
      unit: 4
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem'
    }
  }
};

export class ThemeService implements IThemeService {
  private initialized = false;
  private currentTheme: Theme = defaultThemes.light;
  private customThemes: Map<string, Theme> = new Map();
  private storageKey = 'focusflow-theme';

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 尝试从存储加载保存的主题
      await this.loadThemeFromStorage();

      // 应用当前主题
      this.applyTheme(this.currentTheme);

      this.initialized = true;
      console.log('Theme service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize theme service:', error);
      throw error;
    }
  }

  async setTheme(themeId: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // 查找主题
      let theme = defaultThemes[themeId];

      // 如果不是默认主题，尝试从自定义主题中查找
      if (!theme) {
        theme = this.customThemes.get(themeId);
      }

      if (!theme) {
        throw new Error(`Theme ${themeId} not found`);
      }

      // 设置当前主题
      this.currentTheme = theme;

      // 应用主题
      this.applyTheme(theme);

      // 保存到存储
      await this.saveThemeToStorage();

      console.log(`Theme set to ${themeId}`);
    } catch (error) {
      console.error(`Failed to set theme ${themeId}:`, error);
      throw error;
    }
  }

  getTheme(): string {
    return this.currentTheme.id;
  }

  getAvailableThemes(): string[] {
    return [
      ...Object.keys(defaultThemes),
      ...Array.from(this.customThemes.keys())
    ];
  }

  getCurrentTheme(): Theme {
    return { ...this.currentTheme };
  }

  async setCustomTheme(theme: Theme): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // 验证主题结构
      this.validateTheme(theme);

      // 添加到自定义主题
      this.customThemes.set(theme.id, { ...theme });

      console.log(`Custom theme ${theme.id} added`);
    } catch (error) {
      console.error(`Failed to set custom theme ${theme.id}:`, error);
      throw error;
    }
  }

  async exportTheme(): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const exportData = {
        version: '1.0',
        themes: {
          ...Object.fromEntries(this.customThemes.entries()),
          [this.currentTheme.id]: this.currentTheme
        },
        currentTheme: this.currentTheme.id,
        exportedAt: new Date().toISOString()
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export theme:', error);
      throw error;
    }
  }

  async importTheme(themeData: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const data = JSON.parse(themeData);

      // 验证导入数据
      if (!data.version || !data.themes) {
        throw new Error('Invalid theme data format');
      }

      // 导入主题
      for (const [id, theme] of Object.entries(data.themes)) {
        try {
          this.validateTheme(theme as Theme);
          this.customThemes.set(id, theme as Theme);
          console.log(`Imported theme ${id}`);
        } catch (error) {
          console.warn(`Failed to import theme ${id}:`, error);
        }
      }

      // 如果有当前主题设置，应用它
      if (data.currentTheme && this.getAvailableThemes().includes(data.currentTheme)) {
        await this.setTheme(data.currentTheme);
      }

      console.log('Theme import completed');
    } catch (error) {
      console.error('Failed to import theme:', error);
      throw error;
    }
  }

  /**
   * 应用主题到DOM
   */
  private applyTheme(theme: Theme): void {
    const root = document.documentElement;

    // 应用颜色变量
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-background', theme.colors.background);
    root.style.setProperty('--color-surface', theme.colors.surface);
    root.style.setProperty('--color-text', theme.colors.text);
    root.style.setProperty('--color-border', theme.colors.border);

    // 应用字体变量
    root.style.setProperty('--font-family', theme.typography.fontFamily);
    root.style.setProperty('--font-size-xs', theme.typography.fontSize.xs);
    root.style.setProperty('--font-size-sm', theme.typography.fontSize.sm);
    root.style.setProperty('--font-size-base', theme.typography.fontSize.base);
    root.style.setProperty('--font-size-lg', theme.typography.fontSize.lg);
    root.style.setProperty('--font-size-xl', theme.typography.fontSize.xl);
    root.style.setProperty('--font-size-2xl', theme.typography.fontSize['2xl']);
    root.style.setProperty('--font-size-3xl', theme.typography.fontSize['3xl']);

    // 应用间距变量
    const spacingUnit = `${theme.spacing.unit}px`;
    root.style.setProperty('--spacing-1', spacingUnit);
    root.style.setProperty('--spacing-2', `${theme.spacing.unit * 2}px`);
    root.style.setProperty('--spacing-3', `${theme.spacing.unit * 3}px`);
    root.style.setProperty('--spacing-4', `${theme.spacing.unit * 4}px`);
    root.style.setProperty('--spacing-5', `${theme.spacing.unit * 5}px`);
    root.style.setProperty('--spacing-6', `${theme.spacing.unit * 6}px`);

    // 应用边框半径变量
    root.style.setProperty('--radius-sm', theme.borderRadius.sm);
    root.style.setProperty('--radius-md', theme.borderRadius.md);
    root.style.setProperty('--radius-lg', theme.borderRadius.lg);
    root.style.setProperty('--radius-xl', theme.borderRadius.xl);

    // 设置主题类名
    document.body.className = `theme-${theme.id}`;
  }

  /**
   * 从存储加载主题
   */
  private async loadThemeFromStorage(): Promise<void> {
    try {
      const storedTheme = localStorage.getItem(this.storageKey);
      if (storedTheme) {
        const themeId = JSON.parse(storedTheme);

        // 查找主题
        let theme = defaultThemes[themeId];

        // 如果不是默认主题，尝试从自定义主题中查找
        if (!theme) {
          theme = this.customThemes.get(themeId);
        }

        if (theme) {
          this.currentTheme = theme;
          console.log(`Loaded theme ${themeId} from storage`);
        }
      }
    } catch (error) {
      console.warn('Failed to load theme from storage:', error);
    }
  }

  /**
   * 保存主题到存储
   */
  private async saveThemeToStorage(): Promise<void> {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.currentTheme.id));
    } catch (error) {
      console.warn('Failed to save theme to storage:', error);
    }
  }

  /**
   * 验证主题结构
   */
  private validateTheme(theme: any): void {
    const requiredFields = [
      'id', 'name', 'colors', 'typography', 'spacing', 'borderRadius'
    ];

    for (const field of requiredFields) {
      if (!(field in theme)) {
        throw new Error(`Theme validation failed: missing field ${field}`);
      }
    }

    const colorFields = ['primary', 'secondary', 'background', 'surface', 'text', 'border'];
    for (const field of colorFields) {
      if (!(field in theme.colors)) {
        throw new Error(`Theme validation failed: missing color field ${field}`);
      }
    }
  }
}
