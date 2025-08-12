/**
 * 智能状态选择器
 * 提供细粒度的状态订阅，减少不必要的重渲染
 */

import { useUnifiedTimerStore } from '../unifiedTimerStore';
import { shallow } from 'zustand/shallow';
import { useMemo } from 'react';

// 基础选择器类型
export type TimerSelector<T> = (state: ReturnType<typeof useUnifiedTimerStore.getState>) => T;

// 创建选择器hook的工厂函数
export function createSelector<T>(selector: TimerSelector<T>) {
  return () => useUnifiedTimerStore(selector, shallow);
}

// 基础状态选择器
export const useTimerBasicState = createSelector((state) => ({
  currentState: state.currentState,
  isActive: state.isActive,
  timeLeft: state.timeLeft,
  totalTime: state.totalTime,
  currentMode: state.currentMode
}));

// 计时器显示选择器
export const useTimerDisplay = createSelector((state) => ({
  timeLeft: state.timeLeft,
  totalTime: state.totalTime,
  currentState: state.currentState,
  isActive: state.isActive,
  progress: state.totalTime > 0 ? ((state.totalTime - state.timeLeft) / state.totalTime) * 100 : 0
}));

// 计时器控制选择器
export const useTimerControls = createSelector((state) => ({
  isActive: state.isActive,
  currentState: state.currentState,
  start: state.start,
  pause: state.pause,
  reset: state.reset,
  skipToNext: state.skipToNext,
  triggerMicroBreak: state.triggerMicroBreak
}));

// 设置选择器
export const useTimerSettings = createSelector((state) => ({
  settings: state.settings,
  showSettings: state.showSettings,
  updateSettings: state.updateSettings,
  setShowSettings: state.setShowSettings,
  switchMode: state.switchMode
}));

// 统计数据选择器
export const useTimerStats = createSelector((state) => ({
  todayStats: state.todayStats,
  continuousFocusTime: state.continuousFocusTime,
  microBreakCount: state.microBreakCount,
  recentEfficiencyScores: state.recentEfficiencyScores,
  todayTotalFocusTime: state.todayTotalFocusTime
}));

// 会话数据选择器
export const useTimerSession = createSelector((state) => ({
  currentSession: state.currentSession,
  sessionStartTime: state.sessionStartTime,
  focusStartTime: state.focusStartTime,
  lastMicroBreakTime: state.lastMicroBreakTime
}));

// 效率评分选择器
export const useEfficiencyRating = createSelector((state) => ({
  showRatingDialog: state.showRatingDialog,
  pendingRatingSession: state.pendingRatingSession,
  hideEfficiencyRating: state.hideEfficiencyRating,
  submitEfficiencyRating: state.submitEfficiencyRating,
  recentEfficiencyScores: state.recentEfficiencyScores
}));

// 微休息选择器
export const useMicroBreak = createSelector((state) => ({
  nextMicroBreakInterval: state.nextMicroBreakInterval,
  lastMicroBreakTime: state.lastMicroBreakTime,
  microBreakCount: state.microBreakCount,
  triggerMicroBreak: state.triggerMicroBreak,
  checkMicroBreakTrigger: state.checkMicroBreakTrigger
}));

// 自适应调整选择器
export const useAdaptiveAdjustments = createSelector((state) => ({
  adaptiveAdjustments: state.adaptiveAdjustments,
  recentEfficiencyScores: state.recentEfficiencyScores
}));

// 组合选择器 - 用于复杂组件
export const useTimerFullState = createSelector((state) => ({
  // 基础状态
  currentState: state.currentState,
  isActive: state.isActive,
  timeLeft: state.timeLeft,
  totalTime: state.totalTime,
  currentMode: state.currentMode,
  
  // 控制方法
  start: state.start,
  pause: state.pause,
  reset: state.reset,
  skipToNext: state.skipToNext,
  
  // 统计数据
  todayStats: state.todayStats,
  continuousFocusTime: state.continuousFocusTime,
  
  // 设置
  settings: state.settings
}));

// 性能优化的选择器 - 只在特定条件下更新
export const useTimerDisplayOptimized = () => {
  const state = useUnifiedTimerStore(
    (state) => ({
      timeLeft: state.timeLeft,
      totalTime: state.totalTime,
      currentState: state.currentState,
      isActive: state.isActive
    }),
    (a, b) => {
      // 自定义比较函数，只在关键值变化时更新
      return (
        a.timeLeft === b.timeLeft &&
        a.totalTime === b.totalTime &&
        a.currentState === b.currentState &&
        a.isActive === b.isActive
      );
    }
  );

  return useMemo(() => ({
    ...state,
    progress: state.totalTime > 0 ? ((state.totalTime - state.timeLeft) / state.totalTime) * 100 : 0,
    formattedTime: formatTime(state.timeLeft),
    isCompleted: state.timeLeft === 0
  }), [state]);
};

// 条件选择器 - 只在满足条件时订阅
export const useTimerConditional = (condition: (state: ReturnType<typeof useUnifiedTimerStore.getState>) => boolean) => {
  return useUnifiedTimerStore(
    (state) => condition(state) ? state : null,
    shallow
  );
};

// 时间格式化工具函数
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// 调试选择器 - 开发环境下使用
export const useTimerDebug = createSelector((state) => ({
  stateSnapshot: {
    currentState: state.currentState,
    isActive: state.isActive,
    timeLeft: state.timeLeft,
    totalTime: state.totalTime,
    currentMode: state.currentMode,
    sessionStartTime: state.sessionStartTime,
    focusStartTime: state.focusStartTime,
    nextMicroBreakInterval: state.nextMicroBreakInterval,
    lastMicroBreakTime: state.lastMicroBreakTime,
    microBreakCount: state.microBreakCount,
    continuousFocusTime: state.continuousFocusTime,
    todayTotalFocusTime: state.todayTotalFocusTime,
    recentEfficiencyScores: state.recentEfficiencyScores,
    adaptiveAdjustments: state.adaptiveAdjustments,
    todayStats: state.todayStats,
    currentSession: state.currentSession,
    showRatingDialog: state.showRatingDialog,
    pendingRatingSession: state.pendingRatingSession,
    showSettings: state.showSettings
  }
}));

// 导出所有选择器
export {
  useUnifiedTimerStore as useTimerStore
};

// 选择器性能监控 (开发环境)
if (process.env.NODE_ENV === 'development') {
  // 创建性能监控装饰器
  const withPerformanceMonitoring = <T>(selector: TimerSelector<T>, name: string) => {
    return (state: ReturnType<typeof useUnifiedTimerStore.getState>) => {
      const start = performance.now();
      const result = selector(state);
      const end = performance.now();
      
      if (end - start > 1) { // 只记录超过1ms的选择器
        console.warn(`Selector ${name} took ${end - start}ms to execute`);
      }
      
      return result;
    };
  };

  // 导出监控版本的选择器
  export const useTimerDisplayMonitored = () => 
    useUnifiedTimerStore(withPerformanceMonitoring(
      (state) => ({
        timeLeft: state.timeLeft,
        totalTime: state.totalTime,
        currentState: state.currentState,
        isActive: state.isActive,
        progress: state.totalTime > 0 ? ((state.totalTime - state.timeLeft) / state.totalTime) * 100 : 0
      }),
      'TimerDisplay'
    ), shallow);
}