import { useEffect, useRef, useState, useCallback } from 'react';
import { useUnifiedTimerStore } from '../stores/unifiedTimerStore';

/**
 * 计时器逻辑 Hook (已更新为使用统一状态管理)
 * 处理计时器的核心逻辑，包括倒计时、状态转换、微休息检查等
 */
export const useTimer = () => {
  const {
    currentState,
    isActive,
    settings,
    transitionTo,
    checkMicroBreakTrigger,
    triggerMicroBreak,
  } = useUnifiedTimerStore();

  // Worker状态管理
  const workerRef = useRef<Worker | null>(null);
  const [formattedTime, setFormattedTime] = useState('25:00');
  const [workerTimeLeft, setWorkerTimeLeft] = useState(1500);
  const [progress, setProgress] = useState(0);

  // 初始化Worker
  useEffect(() => {
    // 创建Worker实例
    workerRef.current = new Worker(new URL('../workers/timerWorker.ts', import.meta.url));
    const worker = workerRef.current;

    // 设置Worker消息处理
    worker.onmessage = (e) => {
      const { type, data } = e.data;
      if (type === 'update' && data) {
        setFormattedTime(data.formattedTime);
        setWorkerTimeLeft(data.timeLeft);
        setProgress(data.progress);
      } else if (type === 'complete') {
        handleTimeUp();
      }
    };

    // 错误处理
    worker.onerror = (error) => {
      console.error('Worker error:', error);
    };

    // 清理函数
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // 根据当前状态设置计时器时长
  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return;

    const currentSettings = settings.mode === 'classic' ? settings.classic : settings.smart;
    let duration = 0;

    switch (currentState) {
      case 'focus':
        duration = currentSettings.focusDuration * 60;
        break;
      case 'break':
        duration = currentSettings.breakDuration * 60;
        break;
      case 'microBreak':
        if (settings.mode === 'classic') {
          duration = settings.classic.microBreakDuration * 60;
        } else {
          const min = settings.smart.microBreakMinDuration;
          const max = settings.smart.microBreakMaxDuration;
          duration = Math.floor((min + max) / 2) * 60;
        }
        break;
    }

    if (duration > 0) {
      worker.postMessage({ command: 'setDuration', payload: { duration } });
    }
  }, [currentState, settings]);

  // 控制计时器状态（开始/暂停）
  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return;

    if (isActive) {
      worker.postMessage({ command: 'start' });
    } else {
      worker.postMessage({ command: 'pause' });
    }
  }, [isActive]);

  // 微休息检查逻辑
  useEffect(() => {
    let microBreakCheckRef: number | null = null;

    if (isActive && currentState === 'focus') {
      microBreakCheckRef = window.setInterval(() => {
        if (checkMicroBreakTrigger()) {
          triggerMicroBreak();
        }
      }, 1000); // 每秒检查一次
    }

    return () => {
      if (microBreakCheckRef) {
        clearInterval(microBreakCheckRef);
      }
    };
  }, [isActive, currentState, checkMicroBreakTrigger, triggerMicroBreak]);

  // 处理时间到的情况
  const handleTimeUp = useCallback(() => {
    switch (currentState) {
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
  }, [currentState, transitionTo]);

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

  return {
    currentState,
    timeLeft: workerTimeLeft,
    isActive,
    settings,
    formattedTime,
    stateText: getStateText(),
    progress: progress * 100, // 转换为百分比
  };
};