import { Theme } from '../types/theme';

class ThemeService {
  private static instance: ThemeService;
  private themes: Map<string, Theme> = new Map();
  private currentThemeId: string = 'default';
  private previewThemeId: string | null = null;
  private listeners: Array<(theme: Theme) => void> = [];

  private constructor() {
    this.initializeDefaultThemes();
  }

  public static getInstance(): ThemeService {
    if (!ThemeService.instance) {
      ThemeService.instance = new ThemeService();
    }
    return ThemeService.instance;
  }

  private initializeDefaultThemes() {
    const defaultThemes: Theme[] = [
      {
        id: 'default',
        name: '默认主题',
        description: '系统默认主题',
        type: 'light',
        colors: {
          primary: '#3b82f6',
          background: '#ffffff',
          text: '#1f2937',
          accent: '#8b5cf6',
          border: '#e5e7eb',
          error: '#ef4444',
          success: '#10b981',
          warning: '#f59e0b',
          focus: '#3b82f6',
          break: '#10b981',
          microBreak: '#f59e0b',
          surface: '#f8fafc',
          muted: '#64748b',
          ring: '#3b82f6',
          textSecondary: '#475569',
          timer: '#1f2937'
        },
        fonts: {
          body: 'Inter, system-ui, sans-serif',
          heading: 'Inter, system-ui, sans-serif',
          mono: 'JetBrains Mono, monospace'
        },
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
          borderRadius: '0.375rem'
        },
        shadows: {
          sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        },
        animations: {
          transition: '0.2s ease',
          duration: '0.2s'
        }
      },
      {
        id: 'dark',
        name: '深色主题',
        description: '深色模式主题',
        type: 'dark',
        colors: {
          primary: '#3b82f6',
          background: '#1f2937',
          text: '#f9fafb',
          accent: '#8b5cf6',
          border: '#374151',
          error: '#ef4444',
          success: '#10b981',
          warning: '#f59e0b',
          focus: '#3b82f6',
          break: '#10b981',
          microBreak: '#f59e0b',
          surface: '#111827',
          muted: '#9ca3af',
          ring: '#3b82f6',
          textSecondary: '#d1d5db',
          timer: '#f9fafb'
        },
        fonts: {
          body: 'Inter, system-ui, sans-serif',
          heading: 'Inter, system-ui, sans-serif',
          mono: 'JetBrains Mono, monospace'
        },
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
          borderRadius: '0.375rem'
        },
        shadows: {
          sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        },
        animations: {
          transition: '0.2s ease',
          duration: '0.2s'
        }
      }
    ];

    defaultThemes.forEach(theme => {
      this.themes.set(theme.id, theme);
    });
  }

  public getCurrentTheme(): Theme {
    const theme = this.themes.get(this.currentThemeId);
    return theme || this.themes.get('default')!;
  }

  public getPreviewTheme(): Theme | null {
    if (this.previewThemeId) {
      return this.themes.get(this.previewThemeId) || null;
    }
    return null;
  }

  public getCustomThemes(): Theme[] {
    const customThemes: Theme[] = [];
    
    // 从localStorage加载自定义主题
    try {
      const stored = localStorage.getItem('customThemes');
      if (stored) {
        const themes = JSON.parse(stored) as Theme[];
        themes.forEach(theme => {
          this.themes.set(theme.id, theme);
          if (!['default', 'dark'].includes(theme.id)) {
            customThemes.push(theme);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load custom themes:', error);
    }

    return customThemes;
  }

  public setTheme(themeId: string): boolean {
    const theme = this.themes.get(themeId);
    if (theme) {
      this.currentThemeId = themeId;
      this.previewThemeId = null;
      this.saveToStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  public previewTheme(theme: Theme): void {
    this.themes.set(theme.id, theme);
    this.previewThemeId = theme.id;
    this.notifyListeners();
  }

  public exitPreview(): void {
    this.previewThemeId = null;
    this.notifyListeners();
  }

  public addCustomTheme(theme: Theme): boolean {
    try {
      this.themes.set(theme.id, theme);
      this.saveCustomThemes();
      return true;
    } catch (error) {
      console.error('Failed to add custom theme:', error);
      return false;
    }
  }

  public removeCustomTheme(themeId: string): boolean {
    if (['default', 'dark'].includes(themeId)) {
      return false; // 不允许删除默认主题
    }

    this.themes.delete(themeId);
    
    if (this.currentThemeId === themeId) {
      this.currentThemeId = 'default';
    }
    
    if (this.previewThemeId === themeId) {
      this.previewThemeId = null;
    }

    this.saveCustomThemes();
    this.notifyListeners();
    return true;
  }

  public renameCustomTheme(themeId: string, newName: string, newDescription: string): boolean {
    const theme = this.themes.get(themeId);
    if (!theme || ['default', 'dark'].includes(themeId)) {
      return false;
    }

    const updatedTheme: Theme = {
      ...theme,
      name: newName,
      description: newDescription
    };

    this.themes.set(themeId, updatedTheme);
    this.saveCustomThemes();
    this.notifyListeners();
    return true;
  }

  public duplicateTheme(themeId: string): Theme | null {
    const originalTheme = this.themes.get(themeId);
    if (!originalTheme) {
      return null;
    }

    const duplicatedTheme: Theme = {
      ...originalTheme,
      id: `theme_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${originalTheme.name} 副本`,
      description: `${originalTheme.description} (复制)`
    };

    this.themes.set(duplicatedTheme.id, duplicatedTheme);
    this.saveCustomThemes();
    return duplicatedTheme;
  }

  public importTheme(themeJson: string): Theme | null {
    try {
      const theme = JSON.parse(themeJson) as Theme;
      
      // 验证主题格式
      if (!theme.id || !theme.name || !theme.description) {
        return null;
      }

      // 生成新的ID避免冲突
      theme.id = `theme_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      this.themes.set(theme.id, theme);
      this.saveCustomThemes();
      return theme;
    } catch (error) {
      console.error('Failed to import theme:', error);
      return null;
    }
  }

  public exportTheme(themeId: string): string | null {
    const theme = this.themes.get(themeId);
    if (!theme) {
      return null;
    }
    return JSON.stringify(theme, null, 2);
  }

  public addListener(listener: (theme: Theme) => void): void {
    this.listeners.push(listener);
  }

  public removeListener(listener: (theme: Theme) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private saveCustomThemes(): void {
    try {
      const customThemes = Array.from(this.themes.values())
        .filter(theme => !['default', 'dark'].includes(theme.id));
      
      localStorage.setItem('customThemes', JSON.stringify(customThemes));
    } catch (error) {
      console.error('Failed to save custom themes:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('currentThemeId', this.currentThemeId);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  }

  private notifyListeners(): void {
    const currentTheme = this.getCurrentTheme();
    this.listeners.forEach(listener => listener(currentTheme));
  }
}

export const themeService = ThemeService.getInstance();