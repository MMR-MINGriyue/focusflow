import { useEffect, useRef } from 'react';
import { useTimerStore } from '../stores/timerStore';

/**
 * 计时器逻辑 Hook
 * 处理计时器的核心逻辑，包括倒计时、状态转换、微休息检查等
 */
export const useTimer = () => {
  const {
    currentState,
    timeLeft,
    isActive,
    settings,
    transitionTo,
    updateTimeLeft,
    checkMicroBreakTrigger,
    triggerMicroBreak,
  } = useTimerStore();

  const intervalRef = useRef<number | null>(null);
  const microBreakCheckRef = useRef<number | null>(null);

  // 主计时器逻辑
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        const newTimeLeft = useTimerStore.getState().timeLeft - 1;
        updateTimeLeft(newTimeLeft);
      }, 1000);
    } else if (timeLeft === 0) {
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
  }, [isActive, timeLeft, updateTimeLeft]);

  // 微休息检查逻辑
  useEffect(() => {
    if (isActive && currentState === 'focus') {
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
  }, [isActive, currentState, checkMicroBreakTrigger, triggerMicroBreak]);

  // 处理时间到的情况
  const handleTimeUp = () => {
    const state = useTimerStore.getState();
    
    switch (state.currentState) {
      case 'focus':
        transitionTo('break');
        break;
      case 'break':
        transitionTo('focus');
        break;
      case 'microBreak':
        transitionTo('focus');
        break;
    }
  };

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
        return '专注中';
      case 'break':
        return '休息中';
      case 'microBreak':
        return '微休息';
      default:
        return '';
    }
  };

  // 获取状态颜色
  const getStateColor = (): string => {
    switch (currentState) {
      case 'focus':
        return 'text-green-600';
      case 'break':
        return 'text-red-600';
      case 'microBreak':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  // 获取进度百分比
  const getProgress = (): number => {
    let totalTime: number;
    switch (currentState) {
      case 'focus':
        totalTime = settings.focusDuration * 60;
        break;
      case 'break':
        totalTime = settings.breakDuration * 60;
        break;
      case 'microBreak':
        totalTime = settings.microBreakDuration * 60;
        break;
      default:
        totalTime = 1;
    }
    
    return Math.max(0, Math.min(100, ((totalTime - timeLeft) / totalTime) * 100));
  };

  return {
    // 状态
    currentState,
    timeLeft,
    isActive,
    settings,
    
    // 计算属性
    formattedTime: formatTime(timeLeft),
    stateText: getStateText(),
    stateColor: getStateColor(),
    progress: getProgress(),
    
    // 方法
    formatTime,
  };
};
