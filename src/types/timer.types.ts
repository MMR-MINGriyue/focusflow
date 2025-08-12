/**
 * Timer组件相关类型定义
 */

/**
 * 计时器模式类型
 */
export type TimerMode = 'classic' | 'smart';

/**
 * 经典模式设置
 */
export interface ClassicSettings {
  focusDuration: number;     // 专注时长(分钟)
  shortBreakDuration: number;// 短休息时长(分钟)
  longBreakDuration: number; // 长休息时长(分钟)
  longBreakInterval: number; // 长休息间隔(个专注周期)
  autoStartBreaks: boolean;  // 自动开始休息
  autoStartFocus: boolean;   // 自动开始专注
}

/**
 * 智能模式设置
 */
export interface SmartSettings {
  focusDuration: number;     // 基础专注时长(分钟)
  breakStrategy: 'dynamic' | 'fixed'; // 休息策略
  difficulty: 'easy' | 'medium' | 'hard'; // 专注难度
  autoAdjustDuration: boolean; // 自动调整时长
  goalCompletion: number;    // 每日目标完成次数
}

/**
 * 计时器设置
 */
export interface TimerSettings {
  mode: TimerMode;           // 计时器模式
  classic: ClassicSettings;  // 经典模式设置
  smart: SmartSettings;      // 智能模式设置
  notifications: boolean;    // 通知开关
  soundEffects: boolean;     // 音效开关
  theme: 'light' | 'dark' | 'system'; // 主题设置
}

/**
 * 计时器状态
 */
export interface TimerState {
  currentState: 'focus' | 'break' | 'microBreak' | 'idle'; // 当前状态
  isActive: boolean;         // 是否激活
  formattedTime: string;     // 格式化时间字符串
  stateText: string;         // 状态文本描述
  progress: number;          // 进度(0-1)
  timeLeft: number;          // 剩余时间(秒)
  completedCycles: number;   // 已完成周期数
}

/**
 * 效率评分会话
 */
export interface EfficiencyRatingSession {
  id: string;                // 会话ID
  type: 'focus' | 'break' | 'microBreak'; // 会话类型
  duration: number;          // 持续时间(秒)
  timestamp: Date;           // 时间戳
  score?: number;            // 评分(1-5)
  notes?: string;            // 备注
}

/**
 * Timer组件属性
 */
export interface TimerProps {
  onStateChange?: (state: 'focus' | 'break' | 'microBreak') => void; // 状态变化回调
}

/**
 * 效率评分组件属性
 */
export interface EfficiencyRatingProps {
  isOpen: boolean;           // 是否打开
  duration: number;          // 持续时间(秒)
  type: 'focus' | 'break' | 'microBreak'; // 类型
  onSubmit: (score: number) => void; // 提交评分回调
  onClose: () => void;       // 关闭回调
}