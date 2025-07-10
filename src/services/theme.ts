import { Theme, themes } from '../types/theme';

class ThemeService {
  private currentTheme: Theme;
  private customThemes: Theme[] = [];
  private currentPreviewTheme: Theme | null = null;
  private listeners: ((theme: Theme) => void)[] = [];

  constructor() {
    this.loadCustomThemes();
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
    return [...themes, ...this.customThemes];
  }

  /**
   * 设置主题
   */
  setTheme(themeId: string) {
    const allThemes = this.getAllThemes();
    const theme = allThemes.find(t => t.id === themeId);
    if (!theme) {
      console.warn(`Theme with id "${themeId}" not found`);
      return;
    }

    this.currentTheme = theme;
    this.currentPreviewTheme = null; // 清除预览状态
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

      // 添加到自定义主题列表
      this.addCustomTheme(theme);
      return theme;
    } catch (error) {
      console.error('Failed to import theme:', error);
      return null;
    }
  }

  /**
   * 添加自定义主题
   */
  addCustomTheme(theme: Theme): void {
    // 确保ID唯一
    const existingIndex = this.customThemes.findIndex(t => t.id === theme.id);
    if (existingIndex >= 0) {
      this.customThemes[existingIndex] = theme;
    } else {
      this.customThemes.push(theme);
    }

    this.saveCustomThemes();
  }

  /**
   * 删除自定义主题
   */
  removeCustomTheme(themeId: string): boolean {
    const index = this.customThemes.findIndex(t => t.id === themeId);
    if (index >= 0) {
      this.customThemes.splice(index, 1);
      this.saveCustomThemes();

      // 如果删除的是当前主题，切换到默认主题
      if (this.currentTheme.id === themeId) {
        this.setTheme('light');
      }

      return true;
    }
    return false;
  }

  /**
   * 获取自定义主题列表
   */
  getCustomThemes(): Theme[] {
    return [...this.customThemes];
  }

  /**
   * 预览主题（不保存）
   */
  previewTheme(theme: Theme): void {
    this.currentPreviewTheme = theme;
    this.applyTheme(theme);
  }

  /**
   * 退出预览模式
   */
  exitPreview(): void {
    if (this.currentPreviewTheme) {
      this.currentPreviewTheme = null;
      this.applyTheme(this.currentTheme);
    }
  }

  /**
   * 检查是否在预览模式
   */
  isInPreviewMode(): boolean {
    return this.currentPreviewTheme !== null;
  }

  /**
   * 获取预览主题
   */
  getPreviewTheme(): Theme | null {
    return this.currentPreviewTheme;
  }

  /**
   * 加载自定义主题
   */
  private loadCustomThemes(): void {
    try {
      const saved = localStorage.getItem('focusflow-custom-themes');
      if (saved) {
        const themes = JSON.parse(saved) as Theme[];
        if (Array.isArray(themes)) {
          this.customThemes = themes.filter(theme =>
            theme.id && theme.name && theme.colors && theme.cssVariables
          );
        }
      }
    } catch (error) {
      console.warn('Failed to load custom themes:', error);
      this.customThemes = [];
    }
  }

  /**
   * 保存自定义主题
   */
  private saveCustomThemes(): void {
    try {
      localStorage.setItem('focusflow-custom-themes', JSON.stringify(this.customThemes));
    } catch (error) {
      console.warn('Failed to save custom themes:', error);
    }
  }

  /**
   * 验证主题数据完整性
   */
  validateTheme(theme: any): theme is Theme {
    return (
      typeof theme === 'object' &&
      typeof theme.id === 'string' &&
      typeof theme.name === 'string' &&
      typeof theme.description === 'string' &&
      ['light', 'dark', 'auto'].includes(theme.type) &&
      typeof theme.colors === 'object' &&
      typeof theme.cssVariables === 'object'
    );
  }

  /**
   * 复制主题
   */
  duplicateTheme(themeId: string, newName?: string): Theme | null {
    const allThemes = this.getAllThemes();
    const sourceTheme = allThemes.find(t => t.id === themeId);

    if (!sourceTheme) {
      return null;
    }

    const duplicatedTheme: Theme = {
      ...sourceTheme,
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      name: newName || `${sourceTheme.name} (副本)`,
      description: `基于 ${sourceTheme.name} 的自定义主题`
    };

    this.addCustomTheme(duplicatedTheme);
    return duplicatedTheme;
  }

  /**
   * 重命名自定义主题
   */
  renameCustomTheme(themeId: string, newName: string, newDescription?: string): boolean {
    const theme = this.customThemes.find(t => t.id === themeId);
    if (theme) {
      theme.name = newName;
      if (newDescription !== undefined) {
        theme.description = newDescription;
      }
      this.saveCustomThemes();

      // 如果是当前主题，通知监听器
      if (this.currentTheme.id === themeId) {
        this.currentTheme = theme;
        this.notifyListeners(theme);
      }

      return true;
    }
    return false;
  }
}

// 创建全局主题服务实例
export const themeService = new ThemeService();

// 开始监听系统主题变化
themeService.watchSystemTheme();
