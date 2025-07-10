import { Theme, themes } from '../types/theme';

class ThemeService {
  private currentTheme: Theme;
  private listeners: ((theme: Theme) => void)[] = [];

  constructor() {
    this.currentTheme = this.loadTheme();
    this.applyTheme(this.currentTheme);
  }

  /**
   * 获取当前主题
   */
  getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * 获取所有可用主题
   */
  getAllThemes(): Theme[] {
    return themes;
  }

  /**
   * 设置主题
   */
  setTheme(themeId: string) {
    const theme = themes.find(t => t.id === themeId);
    if (!theme) {
      console.warn(`Theme with id "${themeId}" not found`);
      return;
    }

    this.currentTheme = theme;
    this.applyTheme(theme);
    this.saveTheme(theme);
    this.notifyListeners(theme);
  }

  /**
   * 应用主题到DOM
   */
  private applyTheme(theme: Theme) {
    const root = document.documentElement;
    
    // 应用CSS变量
    Object.entries(theme.cssVariables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // 设置主题类名
    root.className = root.className.replace(/theme-\w+/g, '');
    root.classList.add(`theme-${theme.id}`);
    
    // 设置data属性用于CSS选择器
    root.setAttribute('data-theme', theme.id);
    root.setAttribute('data-theme-type', theme.type);

    // 更新meta标签的主题色
    this.updateMetaThemeColor(theme);
  }

  /**
   * 更新浏览器主题色
   */
  private updateMetaThemeColor(theme: Theme) {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', theme.colors.primary);
  }

  /**
   * 从本地存储加载主题
   */
  private loadTheme(): Theme {
    try {
      const savedThemeId = localStorage.getItem('focusflow-theme');
      if (savedThemeId) {
        const theme = themes.find(t => t.id === savedThemeId);
        if (theme) {
          return theme;
        }
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
    }
    
    // 默认主题：根据系统偏好选择
    return this.getSystemPreferredTheme();
  }

  /**
   * 保存主题到本地存储
   */
  private saveTheme(theme: Theme) {
    try {
      localStorage.setItem('focusflow-theme', theme.id);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }

  /**
   * 获取系统偏好的主题
   */
  private getSystemPreferredTheme(): Theme {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return themes.find(t => t.id === 'dark') || themes[0];
    }
    return themes.find(t => t.id === 'light') || themes[0];
  }

  /**
   * 监听系统主题变化
   */
  watchSystemTheme() {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        // 只有当前使用系统主题时才自动切换
        if (this.currentTheme.id === 'system') {
          const newTheme = e.matches 
            ? themes.find(t => t.id === 'dark') || themes[0]
            : themes.find(t => t.id === 'light') || themes[0];
          this.applyTheme(newTheme);
          this.notifyListeners(newTheme);
        }
      });
    }
  }

  /**
   * 添加主题变化监听器
   */
  addListener(listener: (theme: Theme) => void) {
    this.listeners.push(listener);
  }

  /**
   * 移除主题变化监听器
   */
  removeListener(listener: (theme: Theme) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(theme: Theme) {
    this.listeners.forEach(listener => {
      try {
        listener(theme);
      } catch (error) {
        console.warn('Theme listener error:', error);
      }
    });
  }

  /**
   * 获取主题预览样式
   */
  getThemePreviewStyle(theme: Theme): React.CSSProperties {
    return {
      backgroundColor: theme.colors.background,
      color: theme.colors.foreground,
      border: `2px solid ${theme.colors.border}`,
      borderRadius: '8px',
      padding: '12px',
      minHeight: '80px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden',
    };
  }

  /**
   * 获取主题预览元素
   */
  getThemePreviewElements(theme: Theme) {
    return {
      primary: {
        backgroundColor: theme.colors.primary,
        color: theme.colors.primaryForeground,
      },
      secondary: {
        backgroundColor: theme.colors.secondary,
        color: theme.colors.secondaryForeground,
      },
      focus: {
        backgroundColor: theme.colors.focus,
        color: theme.colors.focusForeground,
      },
      break: {
        backgroundColor: theme.colors.break,
        color: theme.colors.breakForeground,
      },
      microBreak: {
        backgroundColor: theme.colors.microBreak,
        color: theme.colors.microBreakForeground,
      },
    };
  }

  /**
   * 导出主题配置
   */
  exportTheme(theme: Theme): string {
    return JSON.stringify(theme, null, 2);
  }

  /**
   * 导入自定义主题
   */
  importTheme(themeJson: string): Theme | null {
    try {
      const theme = JSON.parse(themeJson) as Theme;
      
      // 验证主题格式
      if (!theme.id || !theme.name || !theme.colors || !theme.cssVariables) {
        throw new Error('Invalid theme format');
      }

      // 添加到主题列表（如果不存在）
      const existingIndex = themes.findIndex(t => t.id === theme.id);
      if (existingIndex >= 0) {
        themes[existingIndex] = theme;
      } else {
        themes.push(theme);
      }

      return theme;
    } catch (error) {
      console.error('Failed to import theme:', error);
      return null;
    }
  }
}

// 创建全局主题服务实例
export const themeService = new ThemeService();

// 开始监听系统主题变化
themeService.watchSystemTheme();
