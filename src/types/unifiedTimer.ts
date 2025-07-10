/**
 * 统一计时器系统的类型定义
 * 整合经典模式和智能模式的所有配置和状态
 */

// 计时器模式枚举
export enum TimerMode {
  CLASSIC = 'classic',
  SMART = 'smart'
}

// 统一的计时器状态类型
export type UnifiedTimerStateType = 'focus' | 'break' | 'microBreak' | 'forcedBreak';

// 经典模式设置
export interface ClassicTimerSettings {
  focusDuration: number; // 专注时长（分钟）
  breakDuration: number; // 休息时长（分钟）
  microBreakMinInterval: number; // 微休息最小间隔（分钟）
  microBreakMaxInterval: number; // 微休息最大间隔（分钟）
  microBreakDuration: number; // 微休息时长（分钟）
}

// 智能模式设置
export interface SmartTimerSettings {
  // 基础循环设置
  focusDuration: number; // 专注时长（分钟），默认90
  breakDuration: number; // 休息时长（分钟），默认20
  
  // 微休息设置
  enableMicroBreaks: boolean; // 是否启用微休息
  microBreakMinInterval: number; // 微休息最小间隔（分钟）
  microBreakMaxInterval: number; // 微休息最大间隔（分钟）
  microBreakMinDuration: number; // 微休息最小时长（分钟）
  microBreakMaxDuration: number; // 微休息最大时长（分钟）
  
  // 自适应设置
  enableAdaptiveAdjustment: boolean; // 是否启用自适应调整
  adaptiveFactorFocus: number; // 专注时间调整因子（0.8-1.2）
  adaptiveFactorBreak: number; // 休息时间调整因子（0.8-1.2）
  
  // 生理节律优化
  enableCircadianOptimization: boolean; // 是否启用生理节律优化
  peakFocusHours: number[]; // 专注高峰时段（24小时制）
  lowEnergyHours: number[]; // 低能量时段
  
  // 高级设置
  maxContinuousFocusTime: number; // 最大连续专注时间（分钟），默认120
  forcedBreakThreshold: number; // 强制休息阈值（分钟），默认150
}

// 统一的计时器设置
export interface UnifiedTimerSettings {
  // 当前模式
  mode: TimerMode;
  
  // 模式特定设置
  classic: ClassicTimerSettings;
  smart: SmartTimerSettings;
  
  // 通用设置
  soundEnabled: boolean;
  notificationEnabled: boolean;
  volume: number;
  
  // UI设置
  showModeSelector: boolean; // 是否显示模式选择器
  defaultMode: TimerMode; // 默认模式
  allowModeSwitch: boolean; // 是否允许运行时切换模式
}

// 统一的计时器状态
export interface UnifiedTimerState {
  // 基础状态
  currentState: UnifiedTimerStateType;
  currentMode: TimerMode;
  timeLeft: number; // 剩余时间（秒）
  totalTime: number; // 总时间（秒）
  isActive: boolean;
  
  // 会话信息
  sessionStartTime: number; // 会话开始时间
  focusStartTime: number; // 专注开始时间
  
  // 微休息管理
  nextMicroBreakInterval: number; // 下次微休息间隔（秒）
  lastMicroBreakTime: number; // 上次微休息时间
  microBreakCount: number; // 今日微休息次数
  
  // 智能模式特有状态
  continuousFocusTime: number; // 连续专注时间（分钟）
  todayTotalFocusTime: number; // 今日总专注时间（分钟）
  recentEfficiencyScores: number[]; // 最近的效率评分
  adaptiveAdjustments: {
    focusMultiplier: number;
    breakMultiplier: number;
    lastAdjustmentTime: number;
  };
  
  // 统计数据
  todayStats: {
    focusTime: number;
    breakTime: number;
    microBreaks: number;
    efficiency: number;
  };
  
  // 当前会话数据
  currentSession: {
    id: number | null;
    startTime: number;
    focusTime: number;
    breakTime: number;
    microBreaks: number;
    lastCompletedDuration?: number;
    lastCompletedType?: UnifiedTimerStateType;
  };
  
  // 效率评分相关
  showRatingDialog: boolean;
  pendingRatingSession: {
    duration: number;
    type: UnifiedTimerStateType;
    sessionId?: number;
  } | null;
}

// 模式切换选项
export interface ModeSwitchOptions {
  preserveCurrentTime: boolean; // 是否保留当前时间
  pauseBeforeSwitch: boolean; // 切换前是否暂停
  showConfirmDialog: boolean; // 是否显示确认对话框
  resetOnSwitch: boolean; // 切换时是否重置
}

// 计时器控制接口
export interface UnifiedTimerControls {
  // 基础控制
  start: () => void;
  pause: () => void;
  reset: () => void;
  
  // 模式控制
  switchMode: (mode: TimerMode, options?: ModeSwitchOptions) => void;
  
  // 状态控制
  skipToNext: () => void;
  triggerMicroBreak: () => void;

  // 设置控制
  updateSettings: (settings: Partial<UnifiedTimerSettings>) => void;

  // 效率评分
  submitEfficiencyRating: (score: number) => void;
  hideEfficiencyRating: () => void;
}

// 默认设置
export const DEFAULT_UNIFIED_SETTINGS: UnifiedTimerSettings = {
  mode: TimerMode.CLASSIC,
  
  classic: {
    focusDuration: 25,
    breakDuration: 5,
    microBreakMinInterval: 10,
    microBreakMaxInterval: 30,
    microBreakDuration: 3,
  },
  
  smart: {
    focusDuration: 90,
    breakDuration: 20,
    enableMicroBreaks: true,
    microBreakMinInterval: 10,
    microBreakMaxInterval: 30,
    microBreakMinDuration: 3,
    microBreakMaxDuration: 5,
    enableAdaptiveAdjustment: true,
    adaptiveFactorFocus: 1.0,
    adaptiveFactorBreak: 1.0,
    enableCircadianOptimization: true,
    peakFocusHours: [9, 10, 11, 14, 15, 16],
    lowEnergyHours: [13, 14, 22, 23, 0, 1],
    maxContinuousFocusTime: 120,
    forcedBreakThreshold: 150,
  },
  
  soundEnabled: true,
  notificationEnabled: true,
  volume: 0.5,
  
  showModeSelector: true,
  defaultMode: TimerMode.CLASSIC,
  allowModeSwitch: true,
};

// 模式显示配置
export interface ModeDisplayConfig {
  name: string;
  description: string;
  icon: string;
  color: string;
  features: string[];
}

export const MODE_DISPLAY_CONFIG: Record<TimerMode, ModeDisplayConfig> = {
  [TimerMode.CLASSIC]: {
    name: '经典模式',
    description: '传统番茄钟，简单高效',
    icon: '🍅',
    color: '#ef4444',
    features: ['固定时间设置', '手动控制', '简单统计', '微休息提醒']
  },
  [TimerMode.SMART]: {
    name: '智能模式',
    description: '90分钟科学循环，智能优化',
    icon: '🧠',
    color: '#3b82f6',
    features: ['自适应调整', '生理节律优化', '强制休息', '效率追踪', '微休息系统']
  }
};
