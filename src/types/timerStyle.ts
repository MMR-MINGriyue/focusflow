/**
 * 计时器样式系统类型定义
 */

export type TimerDisplayStyle = 
  | 'digital'      // 数字显示
  | 'analog'       // 模拟时钟
  | 'progress'     // 进度环
  | 'minimal'      // 极简模式
  | 'card'         // 卡片模式
  | 'neon';        // 霓虹灯效果

export type TimerSize = 'small' | 'medium' | 'large' | 'extra-large';

export type ProgressStyle =
  | 'linear'       // 线性进度条
  | 'circular'     // 圆形进度条
  | 'arc'          // 弧形进度条
  | 'dots'         // 点状进度
  | 'segments';    // 分段进度

export type BackgroundPattern =
  | 'none'         // 无背景
  | 'dots'         // 点状图案
  | 'grid'         // 网格图案
  | 'waves'        // 波浪图案
  | 'geometric'    // 几何图案
  | 'organic'      // 有机图案
  | 'gradient';    // 渐变背景

export type ParticleEffect =
  | 'none'         // 无粒子效果
  | 'floating'     // 漂浮粒子
  | 'falling'      // 下落粒子
  | 'orbiting'     // 环绕粒子
  | 'pulsing'      // 脉冲粒子
  | 'sparkling';   // 闪烁粒子

export type DecorationElement =
  | 'none'         // 无装饰
  | 'frame'        // 边框装饰
  | 'corners'      // 角落装饰
  | 'glow'         // 发光效果
  | 'shadow'       // 阴影效果
  | 'border';      // 边界装饰

export type NumberStyle = 
  | 'standard'     // 标准数字
  | 'mono'         // 等宽字体
  | 'digital'      // 数码管风格
  | 'handwritten'  // 手写风格
  | 'bold'         // 粗体
  | 'thin';        // 细体

export interface TimerStyleConfig {
  id: string;
  name: string;
  description: string;
  displayStyle: TimerDisplayStyle;
  
  // 尺寸配置
  size: TimerSize;
  customSize?: {
    width: number;
    height: number;
  };
  
  // 数字样式配置
  numberStyle: NumberStyle;
  fontSize?: string;
  fontWeight?: string;
  fontFamily?: string;
  
  // 进度条配置
  progressStyle: ProgressStyle;
  progressThickness?: number;
  showProgressText?: boolean;
  progressPosition?: 'top' | 'bottom' | 'around' | 'inside';
  
  // 颜色配置
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
    progress: string;
    progressBackground: string;
    focus?: string;
    break?: string;
    microBreak?: string;
    border?: string;
    error?: string;
    success?: string;
    warning?: string;
  };
  
  // 布局配置
  layout: {
    alignment: 'center' | 'left' | 'right';
    spacing: 'compact' | 'normal' | 'relaxed';
    showStatusIndicator: boolean;
    showProgressPercentage: boolean;
    showStateText: boolean;
  };
  
  // 动画配置
  animations: {
    enabled: boolean;
    transitionDuration: number;
    easing: string;
    pulseOnStateChange: boolean;
    breathingEffect: boolean;
    rotationEffect: boolean;
  };
  
  // 背景和装饰配置
  background: {
    pattern: BackgroundPattern;
    opacity: number;
    color: string;
    size: 'small' | 'medium' | 'large';
    animation: boolean;
  };

  // 粒子效果配置
  particles: {
    effect: ParticleEffect;
    count: number;
    size: number;
    speed: number;
    color: string;
    opacity: number;
  };

  // 装饰元素配置
  decoration: {
    element: DecorationElement;
    intensity: number;
    color: string;
    animated: boolean;
  };

  // 响应式配置
  responsive: {
    enabled: boolean;
    breakpoints: {
      mobile: Partial<TimerStyleConfig>;
      tablet: Partial<TimerStyleConfig>;
      desktop: Partial<TimerStyleConfig>;
    };
  };

  // 自定义CSS
  customCSS?: string;
  
  // 预设标识
  isPreset: boolean;
  category: 'modern' | 'classic' | 'minimal' | 'creative' | 'professional';
  
  // 创建信息
  createdAt: string;
  updatedAt: string;
}

export interface TimerStylePreset {
  id: string;
  name: string;
  description: string;
  preview: string; // 预览图片URL或base64
  config: TimerStyleConfig;
  tags: string[];
  popularity: number;
}

export interface TimerStyleSettings {
  currentStyleId: string;
  customStyles: TimerStyleConfig[];
  previewMode: boolean;
  previewStyleId?: string;
  autoSwitchByState: boolean; // 根据状态自动切换样式
  stateStyles?: {
    focus: string;
    break: string;
    microBreak: string;
  };
}

// 预设样式配置
export const DEFAULT_TIMER_STYLES: TimerStyleConfig[] = [
  {
    id: 'digital-modern',
    name: '现代数字',
    description: '简洁现代的数字显示风格',
    displayStyle: 'digital',
    size: 'large',
    numberStyle: 'standard',
    progressStyle: 'linear',
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      background: '#ffffff',
      text: '#1e293b',
      accent: '#06b6d4',
      progress: '#10b981',
      progressBackground: '#e5e7eb',
      focus: '#3b82f6',
      break: '#10b981',
      microBreak: '#f59e0b',
      border: '#e5e7eb',
      error: '#ef4444',
      success: '#10b981',
      warning: '#f59e0b'
    },
    layout: {
      alignment: 'center',
      spacing: 'normal',
      showStatusIndicator: true,
      showProgressPercentage: true,
      showStateText: true
    },
    animations: {
      enabled: true,
      transitionDuration: 300,
      easing: 'ease-in-out',
      pulseOnStateChange: true,
      breathingEffect: false,
      rotationEffect: false
    },
    background: {
      pattern: 'none',
      opacity: 0.1,
      color: '#f3f4f6',
      size: 'medium',
      animation: false
    },
    particles: {
      effect: 'none',
      count: 20,
      size: 2,
      speed: 1,
      color: '#3b82f6',
      opacity: 0.3
    },
    decoration: {
      element: 'none',
      intensity: 0.5,
      color: '#3b82f6',
      animated: false
    },
    responsive: {
      enabled: true,
      breakpoints: {
        mobile: { size: 'medium' },
        tablet: { size: 'large' },
        desktop: { size: 'large' }
      }
    },
    isPreset: true,
    category: 'modern',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'analog-classic',
    name: '经典模拟',
    description: '传统模拟时钟风格',
    displayStyle: 'analog',
    size: 'large',
    numberStyle: 'standard',
    progressStyle: 'circular',
    colors: {
      primary: '#dc2626',
      secondary: '#64748b',
      background: '#f8fafc',
      text: '#374151',
      accent: '#f59e0b',
      progress: '#ef4444',
      progressBackground: '#f3f4f6'
    },
    layout: {
      alignment: 'center',
      spacing: 'normal',
      showStatusIndicator: true,
      showProgressPercentage: false,
      showStateText: true
    },
    animations: {
      enabled: true,
      transitionDuration: 500,
      easing: 'ease-out',
      pulseOnStateChange: false,
      breathingEffect: false,
      rotationEffect: true
    },
    background: {
      pattern: 'grid',
      opacity: 0.05,
      color: '#dc2626',
      size: 'large',
      animation: false
    },
    particles: {
      effect: 'none',
      count: 15,
      size: 3,
      speed: 0.5,
      color: '#dc2626',
      opacity: 0.2
    },
    decoration: {
      element: 'frame',
      intensity: 0.3,
      color: '#dc2626',
      animated: false
    },
    responsive: {
      enabled: true,
      breakpoints: {
        mobile: { size: 'medium' },
        tablet: { size: 'large' },
        desktop: { size: 'extra-large' }
      }
    },
    isPreset: true,
    category: 'classic',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'progress-minimal',
    name: '极简进度',
    description: '专注于进度显示的极简风格',
    displayStyle: 'progress',
    size: 'medium',
    numberStyle: 'thin',
    progressStyle: 'circular',
    colors: {
      primary: '#8b5cf6',
      secondary: '#a1a1aa',
      background: '#ffffff',
      text: '#52525b',
      accent: '#a855f7',
      progress: '#8b5cf6',
      progressBackground: '#f4f4f5'
    },
    layout: {
      alignment: 'center',
      spacing: 'compact',
      showStatusIndicator: false,
      showProgressPercentage: true,
      showStateText: false
    },
    animations: {
      enabled: true,
      transitionDuration: 400,
      easing: 'ease-in-out',
      pulseOnStateChange: false,
      breathingEffect: true,
      rotationEffect: false
    },
    background: {
      pattern: 'dots',
      opacity: 0.08,
      color: '#8b5cf6',
      size: 'small',
      animation: true
    },
    particles: {
      effect: 'floating',
      count: 10,
      size: 1.5,
      speed: 0.3,
      color: '#8b5cf6',
      opacity: 0.4
    },
    decoration: {
      element: 'glow',
      intensity: 0.2,
      color: '#8b5cf6',
      animated: true
    },
    responsive: {
      enabled: true,
      breakpoints: {
        mobile: { size: 'small' },
        tablet: { size: 'medium' },
        desktop: { size: 'medium' }
      }
    },
    isPreset: true,
    category: 'minimal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'neon-creative',
    name: '霓虹创意',
    description: '炫酷的霓虹灯效果风格',
    displayStyle: 'neon',
    size: 'large',
    numberStyle: 'digital',
    progressStyle: 'arc',
    colors: {
      primary: '#06ffa5',
      secondary: '#4c1d95',
      background: '#0f0f23',
      text: '#06ffa5',
      accent: '#ff006e',
      progress: '#06ffa5',
      progressBackground: '#1e1b4b'
    },
    layout: {
      alignment: 'center',
      spacing: 'relaxed',
      showStatusIndicator: true,
      showProgressPercentage: true,
      showStateText: true
    },
    animations: {
      enabled: true,
      transitionDuration: 600,
      easing: 'ease-out',
      pulseOnStateChange: true,
      breathingEffect: true,
      rotationEffect: false
    },
    background: {
      pattern: 'geometric',
      opacity: 0.15,
      color: '#06ffa5',
      size: 'large',
      animation: true
    },
    particles: {
      effect: 'sparkling',
      count: 30,
      size: 3,
      speed: 2,
      color: '#06ffa5',
      opacity: 0.6
    },
    decoration: {
      element: 'glow',
      intensity: 0.8,
      color: '#06ffa5',
      animated: true
    },
    responsive: {
      enabled: true,
      breakpoints: {
        mobile: { size: 'medium' },
        tablet: { size: 'large' },
        desktop: { size: 'extra-large' }
      }
    },
    isPreset: true,
    category: 'creative',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// 样式工具函数
export const getStyleById = (id: string, customStyles: TimerStyleConfig[] = []): TimerStyleConfig | null => {
  const allStyles = [...DEFAULT_TIMER_STYLES, ...customStyles];
  return allStyles.find(style => style.id === id) || null;
};

export const getStylesByCategory = (category: TimerStyleConfig['category'], customStyles: TimerStyleConfig[] = []): TimerStyleConfig[] => {
  const allStyles = [...DEFAULT_TIMER_STYLES, ...customStyles];
  return allStyles.filter(style => style.category === category);
};

export const validateStyleConfig = (config: Partial<TimerStyleConfig>): boolean => {
  return !!(
    config.id &&
    config.name &&
    config.displayStyle &&
    config.size &&
    config.numberStyle &&
    config.progressStyle &&
    config.colors &&
    config.layout &&
    config.animations
  );
};
