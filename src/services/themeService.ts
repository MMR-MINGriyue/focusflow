// 扩展现有主题类型以支持新功能
export interface TimerThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
}

export interface ExtendedThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  focus: string;
  break: string;
  microBreak: string;
  muted: string;
  timer: TimerThemeColors;
}

export interface ThemeFonts {
  primary: string;
  mono: string;
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
  borderRadius: string;
}

export interface ThemeShadows {
  sm: string;
  md: string;
  lg: string;
  glow: string;
}

export interface ThemeAnimations {
  duration: string;
  easing: string;
}

export interface Theme {
  id: string;
  name: string;
  description?: string;
  type: 'light' | 'dark';
  colors: ExtendedThemeColors;
  fonts: ThemeFonts;
  spacing: ThemeSpacing;
  shadows: ThemeShadows;
  animations: ThemeAnimations;
}

export interface CustomTheme extends Theme {
  isCustom: true;
  createdAt: string;
  updatedAt: string;
}

export interface ThemeConfig {
  currentTheme: string;
  customThemes: CustomTheme[];
  autoDetectSystemTheme: boolean;
  syncWithSystem: boolean;
}

/**
 * 主题服务 - 管理应用主题
 */
class ThemeService {
  private static instance: ThemeService;
  private currentTheme: Theme;
  private customThemes: CustomTheme[] = [];
  private listeners: ((theme: Theme) => void)[] = [];
  private autoDetectSystemTheme = true;
  private syncWithSystem = true;

  // 默认主题
  private readonly defaultThemes: Theme[] = [
    {
      id: 'light',
      name: '浅色',
      description: '明亮的浅色主题',
      type: 'light',
      colors: {
        primary: 'hsl(220, 90%, 56%)',
        secondary: 'hsl(220, 90%, 96%)',
        background: 'hsl(0, 0%, 100%)',
        surface: 'hsl(0, 0%, 98%)',
        text: 'hsl(220, 10%, 10%)',
        textSecondary: 'hsl(220, 10%, 40%)',
        border: 'hsl(220, 20%, 88%)',
        accent: 'hsl(160, 70%, 45%)',
        success: 'hsl(142, 71%, 45%)',
        warning: 'hsl(38, 92%, 50%)',
        error: 'hsl(0, 84%, 60%)',
        focus: 'hsl(220, 90%, 56%)',
        break: 'hsl(160, 70%, 45%)',
        microBreak: 'hsl(38, 92%, 50%)',
        muted: 'hsl(220, 10%, 60%)',
        timer: {
          primary: 'hsl(220, 90%, 56%)',
          secondary: 'hsl(220, 90%, 96%)',
          accent: 'hsl(160, 70%, 45%)',
          glow: 'hsl(220, 90%, 56%, 0.3)'
        }
      },
      fonts: {
        primary: 'system-ui, -apple-system, sans-serif',
        mono: 'ui-monospace, SFMono-Regular, monospace'
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        xxl: '3rem',
        borderRadius: '0.5rem'
      },
      shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        glow: '0 0 20px hsl(220, 90%, 56%, 0.3)'
      },
      animations: {
        duration: '200ms',
        easing: 'ease-out'
      }
    },
    {
      id: 'dark',
      name: '深色',
      description: '舒适的深色主题',
      type: 'dark',
      colors: {
        primary: 'hsl(220, 90%, 65%)',
        secondary: 'hsl(220, 20%, 15%)',
        background: 'hsl(220, 20%, 8%)',
        surface: 'hsl(220, 20%, 12%)',
        text: 'hsl(0, 0%, 95%)',
        textSecondary: 'hsl(220, 10%, 65%)',
        border: 'hsl(220, 20%, 25%)',
        accent: 'hsl(160, 70%, 55%)',
        success: 'hsl(142, 71%, 55%)',
        warning: 'hsl(38, 92%, 60%)',
        error: 'hsl(0, 84%, 70%)',
        focus: 'hsl(220, 90%, 65%)',
        break: 'hsl(160, 70%, 55%)',
        microBreak: 'hsl(38, 92%, 60%)',
        muted: 'hsl(220, 10%, 45%)',
        timer: {
          primary: 'hsl(220, 90%, 65%)',
          secondary: 'hsl(220, 20%, 15%)',
          accent: 'hsl(160, 70%, 55%)',
          glow: 'hsl(220, 90%, 65%, 0.4)'
        }
      },
      fonts: {
        primary: 'system-ui, -apple-system, sans-serif',
        mono: 'ui-monospace, SFMono-Regular, monospace'
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        xxl: '3rem',
        borderRadius: '0.5rem'
      },
      shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
        glow: '0 0 20px hsl(220, 90%, 65%, 0.4)'
      },
      animations: {
        duration: '200ms',
        easing: 'ease-out'
      }
    },
    {
      id: 'neon',
      name: '霓虹',
      description: '充满活力的霓虹主题',
      type: 'dark',
      colors: {
        primary: 'hsl(280, 100%, 70%)',
        secondary: 'hsl(280, 100%, 20%)',
        background: 'hsl(240, 20%, 5%)',
        surface: 'hsl(240, 20%, 10%)',
        text: 'hsl(0, 0%, 95%)',
        textSecondary: 'hsl(240, 10%, 70%)',
        border: 'hsl(280, 100%, 30%)',
        accent: 'hsl(320, 100%, 65%)',
        success: 'hsl(120, 100%, 65%)',
        warning: 'hsl(60, 100%, 65%)',
        error: 'hsl(0, 100%, 70%)',
        focus: 'hsl(280, 100%, 70%)',
        break: 'hsl(120, 100%, 65%)',
        microBreak: 'hsl(60, 100%, 65%)',
        muted: 'hsl(240, 10%, 50%)',
        timer: {
          primary: 'hsl(280, 100%, 70%)',
          secondary: 'hsl(280, 100%, 20%)',
          accent: 'hsl(320, 100%, 65%)',
          glow: 'hsl(280, 100%, 70%, 0.5)'
        }
      },
      fonts: {
        primary: 'system-ui, -apple-system, sans-serif',
        mono: 'ui-monospace, SFMono-Regular, monospace'
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        xxl: '3rem',
        borderRadius: '0.5rem'
      },
      shadows: {
        sm: '0 0 5px hsl(280, 100%, 70%, 0.3)',
        md: '0 0 15px hsl(280, 100%, 70%, 0.4)',
        lg: '0 0 25px hsl(280, 100%, 70%, 0.5)',
        glow: '0 0 30px hsl(280, 100%, 70%, 0.6)'
      },
      animations: {
        duration: '300ms',
        easing: 'ease-in-out'
      }
    }
  ];

  private constructor() {
    this.currentTheme = this.defaultThemes[0];
    this.loadCustomThemes();
    this.setupSystemThemeDetection();
  }

  static getInstance(): ThemeService {
    if (!ThemeService.instance) {
      ThemeService.instance = new ThemeService();
    }
    return ThemeService.instance;
  }

  // 获取当前主题
  getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  // 获取可用主题
  getAvailableThemes(): Theme[] {
    return [...this.defaultThemes, ...this.customThemes];
  }

  // 获取自定义主题
  getCustomThemes(): CustomTheme[] {
    return this.customThemes;
  }

  // 设置主题
  setTheme(themeId: string): void {
    const theme = this.getAvailableThemes().find(t => t.id === themeId);
    if (theme) {
      this.currentTheme = theme;
      this.applyTheme(theme);
      this.saveConfig();
      this.notifyListeners(theme);
    }
  }

  // 预览主题（临时应用主题而不保存）
  previewTheme(theme: Theme): void {
    this.applyTheme(theme);
  }

  // 退出预览，恢复到当前主题
  exitPreview(): void {
    this.applyTheme(this.currentTheme);
  }

  // 创建自定义主题
  createCustomTheme(customTheme: Omit<CustomTheme, 'isCustom' | 'createdAt' | 'updatedAt' | 'id'>): string {
    const themeId = `custom-${Date.now()}`;
    const newTheme: CustomTheme = {
      ...customTheme,
      id: themeId,
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.customThemes.push(newTheme);
    this.saveCustomThemes();
    this.saveConfig();
    return themeId;
  }

  // 删除自定义主题
  deleteCustomTheme(themeId: string): void {
    this.customThemes = this.customThemes.filter(t => t.id !== themeId);
    this.saveCustomThemes();
    this.saveConfig();
  }

  // 导入主题
  importTheme(themeJson: string): string {
    try {
      const themeData = JSON.parse(themeJson);
      const themeId = `imported-${Date.now()}`;
      const importedTheme: CustomTheme = {
        ...themeData,
        id: themeId,
        isCustom: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.customThemes.push(importedTheme);
      this.saveCustomThemes();
      this.saveConfig();
      return themeId;
    } catch (error) {
      throw new Error('无效的主题文件格式');
    }
  }

  // 导出主题
  exportTheme(themeId: string): string {
    const theme = this.getAvailableThemes().find(t => t.id === themeId);
    if (!theme) {
      throw new Error('主题不存在');
    }
    return JSON.stringify(theme, null, 2);
  }

  // 获取主题预览样式
  getThemePreviewStyle(theme: Theme): React.CSSProperties {
    return {
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.spacing.borderRadius,
      padding: theme.spacing.md,
      boxShadow: theme.shadows.sm
    };
  }

  // 获取主题预览元素样式
  getThemePreviewElements(theme: Theme): Record<string, React.CSSProperties> {
    return {
      primary: { backgroundColor: theme.colors.primary },
      focus: { backgroundColor: theme.colors.focus },
      break: { backgroundColor: theme.colors.break },
      microBreak: { backgroundColor: theme.colors.microBreak }
    };
  }

  // 自动检测系统主题
  autoDetectTheme(): void {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.setTheme('dark');
    } else {
      this.setTheme('light');
    }
  }

  // 添加主题变更监听器
  addThemeChangeListener(listener: (theme: Theme) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // 加载自定义主题
  loadCustomThemes(): void {
    try {
      const saved = localStorage.getItem('customThemes');
      if (saved) {
        this.customThemes = JSON.parse(saved);
      }
    } catch (error) {
      console.error('加载自定义主题失败:', error);
      this.customThemes = [];
    }
  }

  // 保存自定义主题
  private saveCustomThemes(): void {
    try {
      localStorage.setItem('customThemes', JSON.stringify(this.customThemes));
    } catch (error) {
      console.error('保存自定义主题失败:', error);
    }
  }

  // 保存配置
  private saveConfig(): void {
    const config: ThemeConfig = {
      currentTheme: this.currentTheme.id,
      customThemes: this.customThemes,
      autoDetectSystemTheme: this.autoDetectSystemTheme,
      syncWithSystem: this.syncWithSystem
    };

    try {
      localStorage.setItem('themeConfig', JSON.stringify(config));
    } catch (error) {
      console.error('保存主题配置失败:', error);
    }
  }

  // 加载配置
  private loadConfig(): void {
    try {
      const saved = localStorage.getItem('themeConfig');
      if (saved) {
        const config: ThemeConfig = JSON.parse(saved);
        this.customThemes = config.customThemes || [];
        this.autoDetectSystemTheme = config.autoDetectSystemTheme ?? true;
        this.syncWithSystem = config.syncWithSystem ?? true;

        if (config.currentTheme) {
          this.setTheme(config.currentTheme);
        }
      }
    } catch (error) {
      console.error('加载主题配置失败:', error);
    }
  }

  // 应用主题到DOM
  private applyTheme(theme: Theme): void {
    const root = document.documentElement;
    
    // 设置主题类
    root.classList.remove('light', 'dark');
    root.classList.add(theme.type);

    // 设置CSS变量
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([subKey, subValue]) => {
          root.style.setProperty(`--color-${key}-${subKey}`, String(subValue));
        });
      } else {
        root.style.setProperty(`--color-${key}`, String(value));
      }
    });

    // 设置字体变量
    Object.entries(theme.fonts).forEach(([key, value]) => {
      root.style.setProperty(`--font-${key}`, value);
    });

    // 设置间距变量
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });

    // 设置阴影变量
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });

    // 设置动画变量
    Object.entries(theme.animations).forEach(([key, value]) => {
      root.style.setProperty(`--animation-${key}`, value);
    });

    // 更新meta标签
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme.colors.primary);
    }
  }

  // 设置系统主题检测
  private setupSystemThemeDetection(): void {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (_e: MediaQueryListEvent) => {
        if (this.autoDetectSystemTheme && this.syncWithSystem) {
          this.autoDetectTheme();
        }
      };

      mediaQuery.addEventListener('change', handleChange);
    }
  }

  // 通知监听器
  private notifyListeners(theme: Theme): void {
    this.listeners.forEach(listener => listener(theme));
  }

  // 初始化
  init(): void {
    this.loadConfig();
    this.loadCustomThemes();
    this.applyTheme(this.currentTheme);
  }
}

// 获取主题服务实例
export const getThemeService = (): ThemeService => {
  return ThemeService.getInstance();
};

// 导出单例实例
export const themeService = ThemeService.getInstance();

// 初始化主题服务
if (typeof window !== 'undefined') {
  themeService.init();
}