/**
 * 统一计时器Hook
 * 处理统一计时器的核心逻辑，包括倒计时、状态转换、微休息检查等
 */

import { useEffect, useRef } from 'react';
import { useUnifiedTimerStore } from '../stores/unifiedTimerStore';
import { TimerMode } from '../types/unifiedTimer';

/**
 * 统一计时器逻辑 Hook
 */
export const useUnifiedTimer = () => {
  const {
    currentState,
    currentMode,
    timeLeft,
    totalTime,
    isActive,
    settings,
    updateTimeLeft,
    checkMicroBreakTrigger,
    triggerMicroBreak,
  } = useUnifiedTimerStore();

  const intervalRef = useRef<number | null>(null);
  const microBreakCheckRef = useRef<number | null>(null);

  // 主计时器逻辑
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        const newTimeLeft = useUnifiedTimerStore.getState().timeLeft - 1;
        updateTimeLeft(newTimeLeft);
      }, 1000);
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
  }, [isActive, timeLeft, updateTimeLeft]);

  // 微休息检查逻辑（仅在专注状态下）
  useEffect(() => {
    const shouldCheckMicroBreak = isActive && 
      currentState === 'focus' && 
      (
        (currentMode === TimerMode.CLASSIC) ||
        (currentMode === TimerMode.SMART && settings.smart.enableMicroBreaks)
      );

    if (shouldCheckMicroBreak) {
      microBreakCheckRef.current = window.setInterval(() => {
        if (checkMicroBreakTrigger()) {
          triggerMicroBreak();
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
  }, [isActive, currentState, currentMode, settings, checkMicroBreakTrigger, triggerMicroBreak]);

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 获取状态显示文本
  const getStateText = (): string => {
    switch (currentState) {
      case 'focus':
        return currentMode === TimerMode.SMART ? '深度专注' : '专注中';
      case 'break':
        return '休息中';
      case 'microBreak':
        return '微休息';
      case 'forcedBreak':
        return '强制休息';
      default:
        return '';
    }
  };

  // 获取状态颜色
  const getStateColor = (): string => {
    switch (currentState) {
      case 'focus': 
        return currentMode === TimerMode.SMART ? '#3b82f6' : '#10b981';
      case 'break': 
        return '#ef4444';
      case 'microBreak': 
        return '#f59e0b';
      case 'forcedBreak': 
        return '#dc2626';
      default: 
        return '#6b7280';
    }
  };

  // 计算进度百分比
  const getProgress = (): number => {
    if (totalTime === 0) return 0;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  // 获取当前阶段的描述
  const getPhaseDescription = (): string => {
    switch (currentState) {
      case 'focus':
        if (currentMode === TimerMode.SMART) {
          return '保持深度专注，避免干扰。智能系统会根据您的表现自动调整。';
        }
        return '保持专注，避免干扰。完成后会有短暂休息。';
      case 'break':
        return '放松身心，准备下一轮专注。可以起身活动或做些轻松的事情。';
      case 'microBreak':
        return '短暂休息，缓解疲劳。看看远方或做些简单的伸展运动。';
      case 'forcedBreak':
        return '您已连续专注很久，必须休息。这有助于保持长期的专注能力。';
      default:
        return '';
    }
  };

  // 获取当前模式的特性
  const getModeFeatures = () => {
    if (currentMode === TimerMode.SMART) {
      return {
        hasAdaptiveAdjustment: settings.smart.enableAdaptiveAdjustment,
        hasCircadianOptimization: settings.smart.enableCircadianOptimization,
        hasForcedBreaks: true,
        hasEfficiencyTracking: true,
        defaultFocusDuration: settings.smart.focusDuration,
        defaultBreakDuration: settings.smart.breakDuration,
      };
    } else {
      return {
        hasAdaptiveAdjustment: false,
        hasCircadianOptimization: false,
        hasForcedBreaks: false,
        hasEfficiencyTracking: true,
        defaultFocusDuration: settings.classic.focusDuration,
        defaultBreakDuration: settings.classic.breakDuration,
      };
    }
  };

  // 检查是否可以跳过当前阶段
  const canSkipPhase = (): boolean => {
    // 智能模式允许跳过任何阶段
    if (currentMode === TimerMode.SMART) {
      return true;
    }
    
    // 经典模式只允许跳过休息阶段
    return currentState === 'break' || currentState === 'microBreak';
  };

  // 获取下一阶段的预期时间
  const getNextPhaseTime = (): number => {
    const currentSettings = currentMode === TimerMode.CLASSIC ? settings.classic : settings.smart;
    
    switch (currentState) {
      case 'focus':
        return currentSettings.breakDuration * 60;
      case 'break':
      case 'forcedBreak':
        return currentSettings.focusDuration * 60;
      case 'microBreak':
        return 0; // 微休息后回到专注，时间不变
      default:
        return 0;
    }
  };

  return {
    // 状态
    currentState,
    currentMode,
    timeLeft,
    totalTime,
    isActive,
    settings,
    
    // 计算属性
    formattedTime: formatTime(timeLeft),
    stateText: getStateText(),
    stateColor: getStateColor(),
    progress: getProgress(),
    phaseDescription: getPhaseDescription(),
    modeFeatures: getModeFeatures(),
    canSkipPhase: canSkipPhase(),
    nextPhaseTime: getNextPhaseTime(),
    
    // 方法
    formatTime,
  };
};

export default useUnifiedTimer;
