/**
 * 主题提供者组件
 * 管理应用的主题状态和切换
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { ThemeContextType, ThemeMode, ThemePreferences, Theme } from '../types/theme';
import { createTheme } from './themeConfig';
import { applyThemeVariables, getSystemTheme, saveThemePreferences, loadThemePreferences } from './themeUtils';

// 默认主题偏好设置
const defaultPreferences: ThemePreferences = {
  mode: 'system',
  primaryColor: '#3b82f6',
  fontSize: 'medium',
  reducedMotion: false,
  highContrast: false,
  colorBlindFriendly: false
};

// 创建主题上下文
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 主题提供者属性
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
  storageKey?: string;
  enableTransitions?: boolean;
}

/**
 * 主题提供者组件
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultMode = 'system',
  storageKey = 'focusflow-theme',
  enableTransitions = true
}) => {
  // 状态管理
  const [preferences, setPreferences] = useState<ThemePreferences>(() => {
    const saved = loadThemePreferences(storageKey);
    return saved ? { ...defaultPreferences, ...saved } : { ...defaultPreferences, mode: defaultMode };
  });

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => getSystemTheme());

  // 计算当前主题模式
  const currentMode = useMemo((): 'light' | 'dark' => {
    if (preferences.mode === 'system') {
      return systemTheme;
    }
    return preferences.mode as 'light' | 'dark';
  }, [preferences.mode, systemTheme]);

  // 创建主题对象
  const theme = useMemo((): Theme => {
    return createTheme({
      mode: currentMode,
      preferences
    });
  }, [currentMode, preferences]);

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // 监听系统偏好设置变化
  useEffect(() => {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      if (preferences.mode === 'system') {
        setPreferences(prev => ({ ...prev, reducedMotion: e.matches }));
      }
    };

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      if (preferences.mode === 'system') {
        setPreferences(prev => ({ ...prev, highContrast: e.matches }));
      }
    };

    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    highContrastQuery.addEventListener('change', handleHighContrastChange);

    return () => {
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
    };
  }, [preferences.mode]);

  // 应用主题变量到DOM
  useEffect(() => {
    applyThemeVariables(theme, currentMode, enableTransitions);
  }, [theme, currentMode, enableTransitions]);

  // 保存偏好设置
  useEffect(() => {
    saveThemePreferences(preferences, storageKey);
  }, [preferences, storageKey]);

  // 设置主题模式
  const setMode = useCallback((mode: ThemeMode) => {
    setPreferences(prev => ({ ...prev, mode }));
  }, []);

  // 更新偏好设置
  const updatePreferences = useCallback((newPreferences: Partial<ThemePreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  }, []);

  // 切换主题模式
  const toggleMode = useCallback(() => {
    if (preferences.mode === 'system') {
      setMode(systemTheme === 'dark' ? 'light' : 'dark');
    } else {
      setMode(currentMode === 'dark' ? 'light' : 'dark');
    }
  }, [preferences.mode, systemTheme, currentMode, setMode]);

  // 上下文值
  const contextValue = useMemo((): ThemeContextType => ({
    theme,
    mode: preferences.mode,
    preferences,
    setMode,
    updatePreferences,
    toggleMode,
    isDark: currentMode === 'dark',
    isLight: currentMode === 'light',
    isSystem: preferences.mode === 'system'
  }), [theme, preferences, setMode, updatePreferences, toggleMode, currentMode]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * 使用主题的Hook
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * 主题切换按钮组件
 */
export const ThemeToggle: React.FC<{
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ className = '', showLabel = false, size = 'md' }) => {
  const { mode, toggleMode, isDark, isSystem } = useTheme();

  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg'
  };

  const getIcon = () => {
    if (isSystem) {
      return '🖥️';
    }
    return isDark ? '🌙' : '☀️';
  };

  const getLabel = () => {
    if (isSystem) {
      return '系统主题';
    }
    return isDark ? '深色模式' : '浅色模式';
  };

  return (
    <button
      onClick={toggleMode}
      className={`
        inline-flex items-center justify-center rounded-lg
        bg-background hover:bg-accent hover:text-accent-foreground
        border border-input transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
        ${sizeClasses[size]} ${className}
      `}
      title={`切换到${isDark ? '浅色' : '深色'}模式`}
      aria-label={`当前${getLabel()}，点击切换主题`}
    >
      <span className="text-lg" role="img" aria-hidden="true">
        {getIcon()}
      </span>
      {showLabel && (
        <span className="ml-2 text-sm font-medium">
          {getLabel()}
        </span>
      )}
    </button>
  );
};

/**
 * 主题选择器组件
 */
export const ThemeSelector: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const { mode, setMode } = useTheme();

  const themes: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'light', label: '浅色模式', icon: '☀️' },
    { value: 'dark', label: '深色模式', icon: '🌙' },
    { value: 'system', label: '跟随系统', icon: '🖥️' }
  ];

  return (
    <div className={`flex rounded-lg border border-input bg-background p-1 ${className}`}>
      {themes.map((theme) => (
        <button
          key={theme.value}
          onClick={() => setMode(theme.value)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
            ${mode === theme.value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'hover:bg-accent hover:text-accent-foreground'
            }
          `}
          aria-pressed={mode === theme.value}
        >
          <span role="img" aria-hidden="true">{theme.icon}</span>
          {theme.label}
        </button>
      ))}
    </div>
  );
};

/**
 * 主题偏好设置组件
 */
export const ThemePreferencesPanel: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const { preferences, updatePreferences } = useTheme();

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold mb-4">主题偏好设置</h3>
        
        {/* 字体大小 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">字体大小</label>
          <div className="flex gap-2">
            {(['small', 'medium', 'large'] as const).map((size) => (
              <button
                key={size}
                onClick={() => updatePreferences({ fontSize: size })}
                className={`
                  px-3 py-2 rounded-md text-sm transition-colors
                  ${preferences.fontSize === size
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }
                `}
              >
                {size === 'small' ? '小' : size === 'medium' ? '中' : '大'}
              </button>
            ))}
          </div>
        </div>

        {/* 减少动画 */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">减少动画效果</label>
          <input
            type="checkbox"
            checked={preferences.reducedMotion}
            onChange={(e) => updatePreferences({ reducedMotion: e.target.checked })}
            className="h-4 w-4 rounded border-input"
          />
        </div>

        {/* 高对比度 */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">高对比度模式</label>
          <input
            type="checkbox"
            checked={preferences.highContrast}
            onChange={(e) => updatePreferences({ highContrast: e.target.checked })}
            className="h-4 w-4 rounded border-input"
          />
        </div>

        {/* 色盲友好 */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">色盲友好模式</label>
          <input
            type="checkbox"
            checked={preferences.colorBlindFriendly}
            onChange={(e) => updatePreferences({ colorBlindFriendly: e.target.checked })}
            className="h-4 w-4 rounded border-input"
          />
        </div>
      </div>
    </div>
  );
};

export default ThemeProvider;