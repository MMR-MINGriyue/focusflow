/**
 * 优化的计时器Hook
 * 集成性能监控和优化
 */

import { useEffect, useCallback, useMemo, useRef } from 'react';
import { useUnifiedTimerStoreEnhanced } from '../stores/unifiedTimerStoreEnhanced';
import { TimerState, TimerMode } from '../types/unifiedTimer';
import { formatTime } from '../utils/formatTime';
import { PerformanceMonitorService } from '../infrastructure/services/PerformanceMonitorService';
import { container } from '../container/IoCContainer';

export interface UseOptimizedTimerResult {
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

  // 性能指标
  performanceMetrics: {
    renderTime: number;
    stateUpdateTime: number;
    lastUpdateTime: number;
  };
}

export function useOptimizedTimer(): UseOptimizedTimerResult {
  const store = useUnifiedTimerStoreEnhanced();
  const performanceMonitor = useRef<PerformanceMonitorService | null>(null);
  const lastUpdateTime = useRef<number>(0);
  const renderStartTime = useRef<number>(0);
  const stateUpdateTime = useRef<number>(0);

  // 初始化性能监控
  useEffect(() => {
    try {
      performanceMonitor.current = container.resolve('performanceMonitorService');
    } catch (error) {
      console.warn('Performance monitor service not available:', error);
    }
  }, []);

  // 记录渲染开始时间
  renderStartTime.current = performance.now();

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
  const start = useCallback(async () => {
    const startTime = performance.now();
    await store.start();

    if (performanceMonitor.current) {
      const duration = performance.now() - startTime;
      performanceMonitor.current.recordMetric('timer-start-time', duration, 'ms');
    }
  }, [store.start]);

  const pause = useCallback(() => {
    store.pause();
  }, [store.pause]);

  const reset = useCallback(async () => {
    const startTime = performance.now();
    await store.reset();

    if (performanceMonitor.current) {
      const duration = performance.now() - startTime;
      performanceMonitor.current.recordMetric('timer-reset-time', duration, 'ms');
    }
  }, [store.reset]);

  const switchMode = useCallback(async (mode: TimerMode, options?: any) => {
    const startTime = performance.now();
    await store.switchMode(mode, options);

    if (performanceMonitor.current) {
      const duration = performance.now() - startTime;
      performanceMonitor.current.recordMetric('timer-switch-mode-time', duration, 'ms');
    }
  }, [store.switchMode]);

  const skipToNext = useCallback(async () => {
    const startTime = performance.now();
    await store.skipToNext();

    if (performanceMonitor.current) {
      const duration = performance.now() - startTime;
      performanceMonitor.current.recordMetric('timer-skip-time', duration, 'ms');
    }
  }, [store.skipToNext]);

  const triggerMicroBreak = useCallback(async () => {
    const startTime = performance.now();
    await store.triggerMicroBreak();

    if (performanceMonitor.current) {
      const duration = performance.now() - startTime;
      performanceMonitor.current.recordMetric('timer-trigger-micro-break-time', duration, 'ms');
    }
  }, [store.triggerMicroBreak]);

  const updateSettings = useCallback((settings: any) => {
    const startTime = performance.now();
    store.updateSettings(settings);

    if (performanceMonitor.current) {
      const duration = performance.now() - startTime;
      performanceMonitor.current.recordMetric('timer-update-settings-time', duration, 'ms');
    }
  }, [store.updateSettings]);

  const setShowSettings = useCallback((show: boolean) => {
    store.setShowSettings(show);
  }, [store.setShowSettings]);

  const submitEfficiencyRating = useCallback(async (score: number) => {
    const startTime = performance.now();
    await store.submitEfficiencyRating(score);

    if (performanceMonitor.current) {
      const duration = performance.now() - startTime;
      performanceMonitor.current.recordMetric('timer-submit-efficiency-time', duration, 'ms');
    }
  }, [store.submitEfficiencyRating]);

  const hideEfficiencyRating = useCallback(() => {
    store.hideEfficiencyRating();
  }, [store.hideEfficiencyRating]);

  const initialize = useCallback(async () => {
    const startTime = performance.now();
    await store.initialize();

    if (performanceMonitor.current) {
      const duration = performance.now() - startTime;
      performanceMonitor.current.recordMetric('timer-initialize-time', duration, 'ms');
    }
  }, [store.initialize]);

  // 记录状态更新时间
  useEffect(() => {
    stateUpdateTime.current = performance.now();
    lastUpdateTime.current = Date.now();

    if (performanceMonitor.current) {
      performanceMonitor.current.recordMetric('timer-state-update', 1, 'count', {
        state: store.currentState,
        timestamp: lastUpdateTime.current
      });
    }
  }, [
    store.currentState,
    store.timeLeft,
    store.totalTime,
    store.isActive,
    store.currentMode,
    store.todayStats,
    store.showRatingDialog
  ]);

  // 计算渲染时间
  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;

    if (performanceMonitor.current) {
      performanceMonitor.current.recordMetric('timer-render-time', renderTime, 'ms');
    }
  });

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

  // 计算性能指标
  const performanceMetrics = useMemo(() => ({
    renderTime: performance.now() - renderStartTime.current,
    stateUpdateTime: stateUpdateTime.current,
    lastUpdateTime: lastUpdateTime.current
  }), [store.currentState, store.timeLeft, store.totalTime, store.isActive]);

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
    initialize,

    // 性能指标
    performanceMetrics
  };
}
