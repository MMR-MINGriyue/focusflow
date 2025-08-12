/**
 * 主题配置
 * 创建和管理主题对象
 */

import { Theme, ThemePreferences, Typography, Spacing, BorderRadius, BoxShadow, Breakpoints, Animation } from '../types/theme';
import { colors, semanticColors, highContrastColors, colorBlindFriendlyColors } from './colors';

// 字体配置
const typography: Typography = {
  fontFamily: {
    sans: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'Noto Sans',
      'sans-serif',
      'Apple Color Emoji',
      'Segoe UI Emoji',
      'Segoe UI Symbol',
      'Noto Color Emoji'
    ],
    serif: [
      'Georgia',
      'Cambria',
      'Times New Roman',
      'Times',
      'serif'
    ],
    mono: [
      'JetBrains Mono',
      'Fira Code',
      'Monaco',
      'Consolas',
      'Liberation Mono',
      'Courier New',
      'monospace'
    ]
  },
  
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
    '6xl': ['3.75rem', { lineHeight: '1' }],
    '7xl': ['4.5rem', { lineHeight: '1' }],
    '8xl': ['6rem', { lineHeight: '1' }],
    '9xl': ['8rem', { lineHeight: '1' }]
  },
  
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900'
  }
};

// 间距系统
const spacing: Spacing = {
  0: '0px',
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem'
};

// 圆角配置
const borderRadius: BorderRadius = {
  none: '0px',
  sm: '0.125rem',
  base: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px'
};

// 阴影配置
const boxShadow: BoxShadow = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: '0 0 #0000'
};

// 断点配置
const breakpoints: Breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

// 动画配置
const animation: Animation = {
  duration: {
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms'
  },
  
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)'
  },
  
  keyframes: {
    spin: {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' }
    },
    ping: {
      '75%, 100%': { transform: 'scale(2)', opacity: '0' }
    },
    pulse: {
      '50%': { opacity: '0.5' }
    },
    bounce: {
      '0%, 100%': { 
        transform: 'translateY(-25%)',
        animationTimingFunction: 'cubic-bezier(0.8,0,1,1)'
      },
      '50%': { 
        transform: 'none',
        animationTimingFunction: 'cubic-bezier(0,0,0.2,1)'
      }
    },
    fadeIn: {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' }
    },
    fadeOut: {
      '0%': { opacity: '1' },
      '100%': { opacity: '0' }
    },
    slideIn: {
      '0%': { transform: 'translateX(-100%)' },
      '100%': { transform: 'translateX(0)' }
    },
    slideOut: {
      '0%': { transform: 'translateX(0)' },
      '100%': { transform: 'translateX(-100%)' }
    },
    scaleIn: {
      '0%': { transform: 'scale(0.95)', opacity: '0' },
      '100%': { transform: 'scale(1)', opacity: '1' }
    },
    scaleOut: {
      '0%': { transform: 'scale(1)', opacity: '1' },
      '100%': { transform: 'scale(0.95)', opacity: '0' }
    }
  }
};

/**
 * 创建主题对象
 */
export const createTheme = (options: {
  mode: 'light' | 'dark';
  preferences: ThemePreferences;
}): Theme => {
  const { mode, preferences } = options;
  
  // 根据偏好设置选择颜色方案
  let themeColors = colors;
  
  if (preferences.highContrast) {
    // 使用高对比度颜色
    const contrastColors = highContrastColors[mode];
    themeColors = {
      ...colors,
      primary: {
        ...colors.primary,
        500: contrastColors.primary,
        600: contrastColors.primary
      }
    };
  }
  
  if (preferences.colorBlindFriendly) {
    // 使用色盲友好颜色
    themeColors = {
      ...themeColors,
      primary: {
        ...themeColors.primary,
        500: colorBlindFriendlyColors.primary,
        600: colorBlindFriendlyColors.primary
      },
      secondary: {
        ...themeColors.secondary,
        500: colorBlindFriendlyColors.secondary,
        600: colorBlindFriendlyColors.secondary
      }
    };
  }
  
  // 根据字体大小偏好调整字体
  let adjustedTypography = typography;
  if (preferences.fontSize !== 'medium') {
    const scale = preferences.fontSize === 'small' ? 0.875 : 1.125;
    adjustedTypography = {
      ...typography,
      fontSize: Object.fromEntries(
        Object.entries(typography.fontSize).map(([key, [size, config]]) => [
          key,
          [`${parseFloat(size) * scale}rem`, config]
        ])
      ) as Typography['fontSize']
    };
  }
  
  return {
    mode,
    colors: themeColors,
    typography: adjustedTypography,
    spacing,
    borderRadius,
    boxShadow,
    breakpoints,
    animation
  };
};

/**
 * 获取主题的CSS变量
 */
export const getThemeVariables = (theme: Theme, mode: 'light' | 'dark') => {
  const isDark = mode === 'dark';
  
  return {
    // 颜色变量
    '--color-primary': theme.colors.primary[500],
    '--color-primary-foreground': isDark ? theme.colors.primary[50] : theme.colors.primary[950],
    '--color-secondary': theme.colors.secondary[500],
    '--color-secondary-foreground': isDark ? theme.colors.secondary[50] : theme.colors.secondary[950],
    '--color-background': isDark ? theme.colors.neutral[950] : theme.colors.neutral[50],
    '--color-foreground': isDark ? theme.colors.neutral[50] : theme.colors.neutral[950],
    '--color-muted': isDark ? theme.colors.neutral[800] : theme.colors.neutral[100],
    '--color-muted-foreground': isDark ? theme.colors.neutral[400] : theme.colors.neutral[500],
    '--color-accent': isDark ? theme.colors.neutral[800] : theme.colors.neutral[100],
    '--color-accent-foreground': isDark ? theme.colors.neutral[50] : theme.colors.neutral[900],
    '--color-destructive': theme.colors.error[500],
    '--color-destructive-foreground': theme.colors.error[50],
    '--color-border': isDark ? theme.colors.neutral[800] : theme.colors.neutral[200],
    '--color-input': isDark ? theme.colors.neutral[800] : theme.colors.neutral[100],
    '--color-ring': theme.colors.primary[500],
    
    // 成功色
    '--color-success': theme.colors.success[500],
    '--color-success-foreground': theme.colors.success[50],
    
    // 警告色
    '--color-warning': theme.colors.warning[500],
    '--color-warning-foreground': theme.colors.warning[50],
    
    // 信息色
    '--color-info': theme.colors.info[500],
    '--color-info-foreground': theme.colors.info[50],
    
    // 卡片和弹出层
    '--color-card': isDark ? theme.colors.neutral[900] : '#ffffff',
    '--color-card-foreground': isDark ? theme.colors.neutral[50] : theme.colors.neutral[950],
    '--color-popover': isDark ? theme.colors.neutral[800] : '#ffffff',
    '--color-popover-foreground': isDark ? theme.colors.neutral[50] : theme.colors.neutral[950],
    
    // 圆角
    '--radius': theme.borderRadius.md,
    
    // 字体
    '--font-sans': theme.typography.fontFamily.sans.join(', '),
    '--font-mono': theme.typography.fontFamily.mono.join(', '),
    
    // 阴影
    '--shadow-sm': theme.boxShadow.sm,
    '--shadow-md': theme.boxShadow.md,
    '--shadow-lg': theme.boxShadow.lg,
    
    // 动画持续时间
    '--duration-fast': theme.animation.duration[150],
    '--duration-normal': theme.animation.duration[300],
    '--duration-slow': theme.animation.duration[500],
    
    // 缓动函数
    '--ease-in-out': theme.animation.easing['in-out'],
    '--ease-out': theme.animation.easing.out
  };
};

/**
 * 预定义主题
 */
export const lightTheme = createTheme({
  mode: 'light',
  preferences: {
    mode: 'light',
    primaryColor: '#3b82f6',
    fontSize: 'medium',
    reducedMotion: false,
    highContrast: false,
    colorBlindFriendly: false
  }
});

export const darkTheme = createTheme({
  mode: 'dark',
  preferences: {
    mode: 'dark',
    primaryColor: '#3b82f6',
    fontSize: 'medium',
    reducedMotion: false,
    highContrast: false,
    colorBlindFriendly: false
  }
});

export default createTheme;