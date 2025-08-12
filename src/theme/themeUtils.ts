/**
 * 主题工具函数
 * 提供主题相关的实用工具
 */

import { Theme, ThemePreferences } from '../types/theme';
import { getThemeVariables } from './themeConfig';

/**
 * 获取系统主题偏好
 */
export const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/**
 * 检查是否偏好减少动画
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * 检查是否偏好高对比度
 */
export const prefersHighContrast = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-contrast: high)').matches;
};

/**
 * 应用主题变量到DOM
 */
export const applyThemeVariables = (
  theme: Theme, 
  mode: 'light' | 'dark',
  enableTransitions: boolean = true
): void => {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  const variables = getThemeVariables(theme, mode);
  
  // 添加过渡效果类
  if (enableTransitions) {
    root.classList.add('theme-transition');
  }
  
  // 应用CSS变量
  Object.entries(variables).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
  
  // 设置主题类
  root.classList.remove('light', 'dark');
  root.classList.add(mode);
  
  // 设置颜色方案
  root.style.colorScheme = mode;
  
  // 移除过渡效果类（延迟执行以确保过渡完成）
  if (enableTransitions) {
    setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 300);
  }
};

/**
 * 保存主题偏好设置到本地存储
 */
export const saveThemePreferences = (
  preferences: ThemePreferences,
  storageKey: string = 'focusflow-theme'
): void => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(preferences));
  } catch (error) {
    console.warn('Failed to save theme preferences:', error);
  }
};

/**
 * 从本地存储加载主题偏好设置
 */
export const loadThemePreferences = (
  storageKey: string = 'focusflow-theme'
): ThemePreferences | null => {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn('Failed to load theme preferences:', error);
    return null;
  }
};

/**
 * 清除主题偏好设置
 */
export const clearThemePreferences = (
  storageKey: string = 'focusflow-theme'
): void => {
  try {
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.warn('Failed to clear theme preferences:', error);
  }
};

/**
 * 获取颜色的对比度
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (color: string): number => {
    // 简化的亮度计算
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const sRGB = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  };
  
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * 检查颜色对比度是否符合WCAG标准
 */
export const isAccessibleContrast = (
  color1: string, 
  color2: string, 
  level: 'AA' | 'AAA' = 'AA'
): boolean => {
  const ratio = getContrastRatio(color1, color2);
  return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
};

/**
 * 生成颜色变体
 */
export const generateColorVariants = (baseColor: string): Record<string, string> => {
  // 这里应该实现颜色变体生成逻辑
  // 为了简化，返回一个基本的变体集合
  return {
    50: lightenColor(baseColor, 0.95),
    100: lightenColor(baseColor, 0.9),
    200: lightenColor(baseColor, 0.8),
    300: lightenColor(baseColor, 0.6),
    400: lightenColor(baseColor, 0.3),
    500: baseColor,
    600: darkenColor(baseColor, 0.1),
    700: darkenColor(baseColor, 0.2),
    800: darkenColor(baseColor, 0.3),
    900: darkenColor(baseColor, 0.4),
    950: darkenColor(baseColor, 0.5)
  };
};

/**
 * 使颜色变亮
 */
export const lightenColor = (color: string, amount: number): string => {
  const hex = color.replace('#', '');
  const r = Math.min(255, Math.round(parseInt(hex.substr(0, 2), 16) + (255 - parseInt(hex.substr(0, 2), 16)) * amount));
  const g = Math.min(255, Math.round(parseInt(hex.substr(2, 2), 16) + (255 - parseInt(hex.substr(2, 2), 16)) * amount));
  const b = Math.min(255, Math.round(parseInt(hex.substr(4, 2), 16) + (255 - parseInt(hex.substr(4, 2), 16)) * amount));
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

/**
 * 使颜色变暗
 */
export const darkenColor = (color: string, amount: number): string => {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.round(parseInt(hex.substr(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(hex.substr(2, 2), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(hex.substr(4, 2), 16) * (1 - amount)));
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

/**
 * 将HEX颜色转换为RGB
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 * 将RGB颜色转换为HEX
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

/**
 * 将HEX颜色转换为HSL
 */
export const hexToHsl = (hex: string): { h: number; s: number; l: number } | null => {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  
  const { r, g, b } = rgb;
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
};

/**
 * 创建主题切换动画
 */
export const createThemeTransition = (): void => {
  if (typeof document === 'undefined') return;
  
  const style = document.createElement('style');
  style.textContent = `
    .theme-transition,
    .theme-transition *,
    .theme-transition *:before,
    .theme-transition *:after {
      transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1) !important;
      transition-delay: 0 !important;
    }
  `;
  
  document.head.appendChild(style);
  
  // 清理函数
  return () => {
    document.head.removeChild(style);
  };
};

/**
 * 检测用户的主题偏好
 */
export const detectUserPreferences = (): Partial<ThemePreferences> => {
  const preferences: Partial<ThemePreferences> = {};
  
  // 检测系统主题
  preferences.mode = 'system';
  
  // 检测减少动画偏好
  if (prefersReducedMotion()) {
    preferences.reducedMotion = true;
  }
  
  // 检测高对比度偏好
  if (prefersHighContrast()) {
    preferences.highContrast = true;
  }
  
  return preferences;
};

/**
 * 生成主题预览
 */
export const generateThemePreview = (theme: Theme, mode: 'light' | 'dark'): string => {
  const variables = getThemeVariables(theme, mode);
  
  return `
    <div style="
      background: ${variables['--color-background']};
      color: ${variables['--color-foreground']};
      padding: 16px;
      border-radius: ${variables['--radius']};
      border: 1px solid ${variables['--color-border']};
      font-family: ${variables['--font-sans']};
    ">
      <div style="
        background: ${variables['--color-primary']};
        color: ${variables['--color-primary-foreground']};
        padding: 8px 16px;
        border-radius: ${variables['--radius']};
        margin-bottom: 8px;
      ">
        主要按钮
      </div>
      <div style="
        background: ${variables['--color-secondary']};
        color: ${variables['--color-secondary-foreground']};
        padding: 8px 16px;
        border-radius: ${variables['--radius']};
        margin-bottom: 8px;
      ">
        次要按钮
      </div>
      <div style="
        background: ${variables['--color-muted']};
        color: ${variables['--color-muted-foreground']};
        padding: 8px 16px;
        border-radius: ${variables['--radius']};
      ">
        静音文本
      </div>
    </div>
  `;
};

export default {
  getSystemTheme,
  prefersReducedMotion,
  prefersHighContrast,
  applyThemeVariables,
  saveThemePreferences,
  loadThemePreferences,
  clearThemePreferences,
  getContrastRatio,
  isAccessibleContrast,
  generateColorVariants,
  lightenColor,
  darkenColor,
  hexToRgb,
  rgbToHex,
  hexToHsl,
  createThemeTransition,
  detectUserPreferences,
  generateThemePreview
};