/**
 * 颜色配置
 * 定义应用的颜色方案
 */

import { ColorScheme } from '../types/theme';

// 主要颜色 - 蓝色系（专注、冷静）
const primary = {
  50: '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#3b82f6',
  600: '#2563eb',
  700: '#1d4ed8',
  800: '#1e40af',
  900: '#1e3a8a',
  950: '#172554'
};

// 次要颜色 - 紫色系（创意、灵感）
const secondary = {
  50: '#faf5ff',
  100: '#f3e8ff',
  200: '#e9d5ff',
  300: '#d8b4fe',
  400: '#c084fc',
  500: '#a855f7',
  600: '#9333ea',
  700: '#7c3aed',
  800: '#6b21a8',
  900: '#581c87',
  950: '#3b0764'
};

// 中性色 - 灰色系
const neutral = {
  50: '#f9fafb',
  100: '#f3f4f6',
  200: '#e5e7eb',
  300: '#d1d5db',
  400: '#9ca3af',
  500: '#6b7280',
  600: '#4b5563',
  700: '#374151',
  800: '#1f2937',
  900: '#111827',
  950: '#030712'
};

// 成功色 - 绿色系
const success = {
  50: '#f0fdf4',
  100: '#dcfce7',
  200: '#bbf7d0',
  300: '#86efac',
  400: '#4ade80',
  500: '#22c55e',
  600: '#16a34a',
  700: '#15803d',
  800: '#166534',
  900: '#14532d',
  950: '#052e16'
};

// 警告色 - 黄色系
const warning = {
  50: '#fffbeb',
  100: '#fef3c7',
  200: '#fde68a',
  300: '#fcd34d',
  400: '#fbbf24',
  500: '#f59e0b',
  600: '#d97706',
  700: '#b45309',
  800: '#92400e',
  900: '#78350f',
  950: '#451a03'
};

// 错误色 - 红色系
const error = {
  50: '#fef2f2',
  100: '#fee2e2',
  200: '#fecaca',
  300: '#fca5a5',
  400: '#f87171',
  500: '#ef4444',
  600: '#dc2626',
  700: '#b91c1c',
  800: '#991b1b',
  900: '#7f1d1d',
  950: '#450a0a'
};

// 信息色 - 青色系
const info = {
  50: '#ecfeff',
  100: '#cffafe',
  200: '#a5f3fc',
  300: '#67e8f9',
  400: '#22d3ee',
  500: '#06b6d4',
  600: '#0891b2',
  700: '#0e7490',
  800: '#155e75',
  900: '#164e63',
  950: '#083344'
};

// 导出完整的颜色方案
export const colors: ColorScheme = {
  primary,
  secondary,
  neutral,
  success,
  warning,
  error,
  info
};

// 语义化颜色映射
export const semanticColors = {
  // 背景色
  background: {
    light: neutral[50],
    dark: neutral[950]
  },
  
  // 前景色（文本）
  foreground: {
    light: neutral[900],
    dark: neutral[50]
  },
  
  // 静音色（次要文本）
  muted: {
    light: neutral[500],
    dark: neutral[400]
  },
  
  // 边框色
  border: {
    light: neutral[200],
    dark: neutral[800]
  },
  
  // 输入框背景
  input: {
    light: neutral[100],
    dark: neutral[900]
  },
  
  // 卡片背景
  card: {
    light: '#ffffff',
    dark: neutral[900]
  },
  
  // 弹出层背景
  popover: {
    light: '#ffffff',
    dark: neutral[800]
  }
};

// 专注时间相关的颜色
export const focusColors = {
  // 专注状态
  focus: {
    primary: primary[600],
    background: primary[50],
    border: primary[200],
    text: primary[800]
  },
  
  // 休息状态
  break: {
    primary: success[600],
    background: success[50],
    border: success[200],
    text: success[800]
  },
  
  // 长休息状态
  longBreak: {
    primary: secondary[600],
    background: secondary[50],
    border: secondary[200],
    text: secondary[800]
  },
  
  // 微休息状态
  microBreak: {
    primary: warning[600],
    background: warning[50],
    border: warning[200],
    text: warning[800]
  }
};

// 高对比度颜色方案
export const highContrastColors = {
  light: {
    background: '#ffffff',
    foreground: '#000000',
    primary: '#0000ff',
    secondary: '#800080',
    success: '#008000',
    warning: '#ff8c00',
    error: '#ff0000',
    border: '#000000'
  },
  
  dark: {
    background: '#000000',
    foreground: '#ffffff',
    primary: '#00ffff',
    secondary: '#ff00ff',
    success: '#00ff00',
    warning: '#ffff00',
    error: '#ff0000',
    border: '#ffffff'
  }
};

// 色盲友好颜色方案
export const colorBlindFriendlyColors = {
  // 使用形状和纹理区分，而不仅仅依赖颜色
  primary: '#1f77b4',    // 蓝色
  secondary: '#ff7f0e',  // 橙色
  success: '#2ca02c',    // 绿色
  warning: '#d62728',    // 红色
  info: '#9467bd',       // 紫色
  neutral: '#8c564b'     // 棕色
};

export default colors;