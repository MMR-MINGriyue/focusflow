/**
 * 增强的计时器Hook
 * 使用新的领域驱动架构
 */

import { useEffect, useCallback, useMemo } from 'react';
import { useUnifiedTimerStoreEnhanced } from '../stores/unifiedTimerStoreEnhanced';
import { TimerState, TimerMode } from '../types/unifiedTimer';
import { formatTime } from '../utils/formatTime';

export interface UseEnhancedTimerResult {
  // 基础状态
  currentState: TimerState;
  currentMode: TimerMode;
  timeLeft: number;
  totalTime: number;
  isActive: boolean;
  isInitialized: boolean;
  initializationError: string | null;

  // 格式化数据
  formattedTime: string;
  stateText: string;
  progress: number;

  // 会话信息
  currentSessionId: string | null;
  sessionStartTime: number;
  focusStartTime: number;

  // 微休息管理
  nextMicroBreakInterval: number;
  lastMicroBreakTime: number;
  microBreakCount: number;

  // 智能模式特有状态
  continuousFocusTime: number;
  todayTotalFocusTime: number;
  recentEfficiencyScores: number[];
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
    id: string | null;
    startTime: number;
    focusTime: number;
    breakTime: number;
    microBreaks: number;
  };

  // 效率评分相关
  showRatingDialog: boolean;
  pendingRatingSession: {
    duration: number;
    type: TimerState;
    sessionId?: string;
  } | null;

  // 设置相关
  settings: any;
  showSettings: boolean;

  // 控制方法
  start: () => Promise<void>;
  pause: () => void;
  reset: () => Promise<void>;
  switchMode: (mode: TimerMode, options?: any) => Promise<void>;
  skipToNext: () => Promise<void>;
  triggerMicroBreak: () => Promise<void>;
  updateSettings: (settings: any) => void;
  setShowSettings: (show: boolean) => void;

  // 效率评分
  submitEfficiencyRating: (score: number) => Promise<void>;
  hideEfficiencyRating: () => void;

  // 初始化
  initialize: () => Promise<void>;
}

export function useEnhancedTimer(): UseEnhancedTimerResult {
  const store = useUnifiedTimerStoreEnhanced();

  // 初始化计时器
  useEffect(() => {
    if (!store.isInitialized && !store.initializationError) {
      store.initialize();
    }
  }, [store.isInitialized, store.initializationError]);

  // 格式化时间显示
  const formattedTime = useMemo(() => {
    return formatTime(store.timeLeft);
  }, [store.timeLeft]);

  // 获取状态显示文本
  const stateText = useMemo(() => {
    switch (store.currentState) {
      case TimerState.FOCUS:
        return '专注中';
      case TimerState.BREAK:
        return '休息中';
      case TimerState.MICRO_BREAK:
        return '微休息';
      case TimerState.FORCED_BREAK:
        return '强制休息';
      default:
        return '';
    }
  }, [store.currentState]);

  // 计算进度百分比
  const progress = useMemo(() => {
    if (store.totalTime === 0) return 0;
    return ((store.totalTime - store.timeLeft) / store.totalTime) * 100;
  }, [store.timeLeft, store.totalTime]);

  // 创建控制方法的稳定引用
  const start = useCallback(() => store.start(), [store.start]);
  const pause = useCallback(() => store.pause(), [store.pause]);
  const reset = useCallback(() => store.reset(), [store.reset]);
  const switchMode = useCallback((mode: TimerMode, options?: any) => 
    store.switchMode(mode, options), [store.switchMode]);
  const skipToNext = useCallback(() => store.skipToNext(), [store.skipToNext]);
  const triggerMicroBreak = useCallback(() => store.triggerMicroBreak(), [store.triggerMicroBreak]);
  const updateSettings = useCallback((settings: any) => 
    store.updateSettings(settings), [store.updateSettings]);
  const setShowSettings = useCallback((show: boolean) => 
    store.setShowSettings(show), [store.setShowSettings]);
  const submitEfficiencyRating = useCallback((score: number) => 
    store.submitEfficiencyRating(score), [store.submitEfficiencyRating]);
  const hideEfficiencyRating = useCallback(() => 
    store.hideEfficiencyRating(), [store.hideEfficiencyRating]);
  const initialize = useCallback(() => 
    store.initialize(), [store.initialize]);

  // 转换ID为字符串
  const currentSessionId = useMemo(() => 
    store.currentSessionId?.value || null, [store.currentSessionId]);

  const pendingRatingSession = useMemo(() => {
    if (!store.pendingRatingSession) return null;
    return {
      ...store.pendingRatingSession,
      sessionId: store.pendingRatingSession.sessionId?.value || undefined
    };
  }, [store.pendingRatingSession]);

  const currentSession = useMemo(() => ({
    id: store.currentSession.id?.value || null,
    startTime: store.currentSession.startTime,
    focusTime: store.currentSession.focusTime,
    breakTime: store.currentSession.breakTime,
    microBreaks: store.currentSession.microBreaks
  }), [store.currentSession]);

  return {
    // 基础状态
    currentState: store.currentState,
    currentMode: store.currentMode,
    timeLeft: store.timeLeft,
    totalTime: store.totalTime,
    isActive: store.isActive,
    isInitialized: store.isInitialized,
    initializationError: store.initializationError,

    // 格式化数据
    formattedTime,
    stateText,
    progress,

    // 会话信息
    currentSessionId,
    sessionStartTime: store.sessionStartTime,
    focusStartTime: store.focusStartTime,

    // 微休息管理
    nextMicroBreakInterval: store.nextMicroBreakInterval,
    lastMicroBreakTime: store.lastMicroBreakTime,
    microBreakCount: store.microBreakCount,

    // 智能模式特有状态
    continuousFocusTime: store.continuousFocusTime,
    todayTotalFocusTime: store.todayTotalFocusTime,
    recentEfficiencyScores: store.recentEfficiencyScores,
    adaptiveAdjustments: store.adaptiveAdjustments,

    // 统计数据
    todayStats: store.todayStats,

    // 当前会话数据
    currentSession,

    // 效率评分相关
    showRatingDialog: store.showRatingDialog,
    pendingRatingSession,

    // 设置相关
    settings: store.settings,
    showSettings: store.showSettings,

    // 控制方法
    start,
    pause,
    reset,
    switchMode,
    skipToNext,
    triggerMicroBreak,
    updateSettings,
    setShowSettings,

    // 效率评分
    submitEfficiencyRating,
    hideEfficiencyRating,

    // 初始化
    initialize
  };
}
