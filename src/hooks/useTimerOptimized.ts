import { useEffect, useRef, useMemo, useCallback } from 'react';
import { useUnifiedTimerStore } from '../stores/unifiedTimerStore';

/**
 * 优化版计时器逻辑 Hook
 * 使用选择器模式减少不必要的计算和重渲染
 */
export const useTimerOptimized = () => {
  // 使用选择器只订阅需要的状态，减少重渲染
  const timerState = useUnifiedTimerStore(
    (state) => ({
      currentState: state.currentState,
      timeLeft: state.timeLeft,
      isActive: state.isActive,
      settings: state.settings,
    })
  );

  // 使用选择器获取操作方法，避免频繁重新创建函数
  const timerActions = useUnifiedTimerStore(
    (state) => ({
      transitionTo: state.transitionTo,
      updateTimeLeft: state.updateTimeLeft,
      checkMicroBreakTrigger: state.checkMicroBreakTrigger,
      triggerMicroBreak: state.triggerMicroBreak,
    })
  );

  const intervalRef = useRef<number | null>(null);
  const microBreakCheckRef = useRef<number | null>(null);

  // 使用useCallback缓存处理时间到的方法，避免每次渲染都创建新函数
  const handleTimeUp = useCallback(() => {
    const state = useUnifiedTimerStore.getState();

    switch (state.currentState) {
      case 'focus':
        timerActions.transitionTo('break');
        break;
      case 'break':
        timerActions.transitionTo('focus');
        break;
      case 'microBreak':
        timerActions.transitionTo('focus');
        break;
    }
  }, [timerActions.transitionTo]);

  // 使用useMemo缓存格式化时间函数，避免每次渲染都重新创建
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // 使用useMemo缓存状态文本函数，避免每次渲染都重新创建
  const getStateText = useCallback((): string => {
    switch (timerState.currentState) {
      case 'focus':
        return '专注中';
      case 'break':
        return '休息中';
      case 'microBreak':
        return '微休息';
      default:
        return '';
    }
  }, [timerState.currentState]);

  // 使用useMemo缓存进度计算函数，避免每次渲染都重新计算
  const calculateProgress = useCallback((): number => {
    const { currentState, settings, timeLeft } = timerState;
    const currentSettings = settings.mode === 'classic' ? settings.classic : settings.smart;
    let totalTime = 0;

    switch (currentState) {
      case 'focus':
        totalTime = currentSettings.focusDuration * 60;
        break;
      case 'break':
        totalTime = currentSettings.breakDuration * 60;
        break;
      case 'microBreak':
        // 根据模式确定微休息时长
        if (settings.mode === 'classic') {
          totalTime = settings.classic.microBreakDuration * 60;
        } else {
          // 智能模式使用平均微休息时长
          const minDuration = settings.smart.microBreakMinDuration;
          const maxDuration = settings.smart.microBreakMaxDuration;
          totalTime = ((minDuration + maxDuration) / 2) * 60;
        }
        break;
    }

    return totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  }, [timerState.currentState, timerState.settings, timerState.timeLeft]);

  // 使用useMemo缓存计算后的值，避免每次渲染都重新计算
  const timerDisplay = useMemo(() => ({
    formattedTime: formatTime(timerState.timeLeft),
    stateText: getStateText(),
    progress: calculateProgress(),
  }), [timerState.timeLeft, formatTime, getStateText, calculateProgress]);

  // 主计时器逻辑 - 优化依赖项
  useEffect(() => {
    if (timerState.isActive && timerState.timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        const newTimeLeft = useUnifiedTimerStore.getState().timeLeft - 1;
        timerActions.updateTimeLeft(newTimeLeft);
      }, 1000);
    } else if (timerState.timeLeft === 0) {
      // 时间到，处理状态转换
      handleTimeUp();
    } else {
      // 清除计时器
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerState.isActive, timerState.timeLeft, timerActions.updateTimeLeft, handleTimeUp]);

  // 微休息检查逻辑 - 优化依赖项
  useEffect(() => {
    if (timerState.isActive && timerState.currentState === 'focus') {
      microBreakCheckRef.current = window.setInterval(() => {
        if (timerActions.checkMicroBreakTrigger()) {
          timerActions.triggerMicroBreak();
        }
      }, 1000); // 每秒检查一次
    } else {
      if (microBreakCheckRef.current) {
        clearInterval(microBreakCheckRef.current);
        microBreakCheckRef.current = null;
      }
    }

    return () => {
      if (microBreakCheckRef.current) {
        clearInterval(microBreakCheckRef.current);
        microBreakCheckRef.current = null;
      }
    };
  }, [timerState.isActive, timerState.currentState, timerActions.checkMicroBreakTrigger, timerActions.triggerMicroBreak]);

  // 返回合并后的状态和计算值，减少组件需要跟踪的变量数量
  return {
    ...timerState,
    ...timerDisplay,
  };
};
