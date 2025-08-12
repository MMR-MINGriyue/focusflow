/**
 * 主题系统类型定义
 * 定义主题相关的类型和接口
 */

// 主题模式
export type ThemeMode = 'light' | 'dark' | 'system';

// 颜色方案
export interface ColorScheme {
  // 主要颜色
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  
  // 次要颜色
  secondary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  
  // 中性色
  neutral: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  
  // 语义化颜色
  success: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  
  warning: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  
  error: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  
  info: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
}

// 字体配置
export interface Typography {
  fontFamily: {
    sans: string[];
    serif: string[];
    mono: string[];
  };
  
  fontSize: {
    xs: [string, { lineHeight: string; letterSpacing?: string }];
    sm: [string, { lineHeight: string; letterSpacing?: string }];
    base: [string, { lineHeight: string; letterSpacing?: string }];
    lg: [string, { lineHeight: string; letterSpacing?: string }];
    xl: [string, { lineHeight: string; letterSpacing?: string }];
    '2xl': [string, { lineHeight: string; letterSpacing?: string }];
    '3xl': [string, { lineHeight: string; letterSpacing?: string }];
    '4xl': [string, { lineHeight: string; letterSpacing?: string }];
    '5xl': [string, { lineHeight: string; letterSpacing?: string }];
    '6xl': [string, { lineHeight: string; letterSpacing?: string }];
    '7xl': [string, { lineHeight: string; letterSpacing?: string }];
    '8xl': [string, { lineHeight: string; letterSpacing?: string }];
    '9xl': [string, { lineHeight: string; letterSpacing?: string }];
  };
  
  fontWeight: {
    thin: string;
    extralight: string;
    light: string;
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
    extrabold: string;
    black: string;
  };
}

// 间距系统
export interface Spacing {
  0: string;
  px: string;
  0.5: string;
  1: string;
  1.5: string;
  2: string;
  2.5: string;
  3: string;
  3.5: string;
  4: string;
  5: string;
  6: string;
  7: string;
  8: string;
  9: string;
  10: string;
  11: string;
  12: string;
  14: string;
  16: string;
  20: string;
  24: string;
  28: string;
  32: string;
  36: string;
  40: string;
  44: string;
  48: string;
  52: string;
  56: string;
  60: string;
  64: string;
  72: string;
  80: string;
  96: string;
}

// 圆角配置
export interface BorderRadius {
  none: string;
  sm: string;
  base: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  full: string;
}

// 阴影配置
export interface BoxShadow {
  sm: string;
  base: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
  none: string;
}

// 断点配置
export interface Breakpoints {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

// 动画配置
export interface Animation {
  duration: {
    75: string;
    100: string;
    150: string;
    200: string;
    300: string;
    500: string;
    700: string;
    1000: string;
  };
  
  easing: {
    linear: string;
    in: string;
    out: string;
    'in-out': string;
  };
  
  keyframes: {
    spin: Record<string, Record<string, string>>;
    ping: Record<string, Record<string, string>>;
    pulse: Record<string, Record<string, string>>;
    bounce: Record<string, Record<string, string>>;
    fadeIn: Record<string, Record<string, string>>;
    fadeOut: Record<string, Record<string, string>>;
    slideIn: Record<string, Record<string, string>>;
    slideOut: Record<string, Record<string, string>>;
    scaleIn: Record<string, Record<string, string>>;
    scaleOut: Record<string, Record<string, string>>;
  };
}

// 主题配置
export interface Theme {
  mode: ThemeMode;
  colors: ColorScheme;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  boxShadow: BoxShadow;
  breakpoints: Breakpoints;
  animation: Animation;
}

// 主题偏好设置
export interface ThemePreferences {
  mode: ThemeMode;
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;
  highContrast: boolean;
  colorBlindFriendly: boolean;
}

// 主题上下文类型
export interface ThemeContextType {
  theme: Theme;
  mode: ThemeMode;
  preferences: ThemePreferences;
  setMode: (mode: ThemeMode) => void;
  updatePreferences: (preferences: Partial<ThemePreferences>) => void;
  toggleMode: () => void;
  isDark: boolean;
  isLight: boolean;
  isSystem: boolean;
}

// 主题变量映射
export interface ThemeVariables {
  '--color-primary': string;
  '--color-primary-foreground': string;
  '--color-secondary': string;
  '--color-secondary-foreground': string;
  '--color-background': string;
  '--color-foreground': string;
  '--color-muted': string;
  '--color-muted-foreground': string;
  '--color-accent': string;
  '--color-accent-foreground': string;
  '--color-destructive': string;
  '--color-destructive-foreground': string;
  '--color-border': string;
  '--color-input': string;
  '--color-ring': string;
  '--radius': string;
  '--font-sans': string;
  '--font-mono': string;
}

// 组件主题变体
export interface ComponentTheme {
  button: {
    variants: {
      default: string;
      destructive: string;
      outline: string;
      secondary: string;
      ghost: string;
      link: string;
    };
    sizes: {
      default: string;
      sm: string;
      lg: string;
      icon: string;
    };
  };
  
  input: {
    variants: {
      default: string;
      error: string;
      success: string;
    };
    sizes: {
      sm: string;
      default: string;
      lg: string;
    };
  };
  
  card: {
    variants: {
      default: string;
      elevated: string;
      outlined: string;
    };
  };
  
  badge: {
    variants: {
      default: string;
      secondary: string;
      destructive: string;
      outline: string;
    };
  };
}

// 导出默认主题类型
export type DefaultTheme = Theme & {
  components: ComponentTheme;
};