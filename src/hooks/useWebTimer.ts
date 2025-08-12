/**
 * 使用Web Timer Worker的Hook
 * 提供高性能的计时功能，避免阻塞主线程
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useUnifiedTimerStore } from '../stores/unifiedTimerStore';

// 定义Worker消息类型
type WorkerMessage = 
  | { type: 'TICK'; payload: { timeLeft: number; elapsed: number; progress: number } }
  | { type: 'COMPLETE'; payload: { state: string; duration: number } }
  | { type: 'STATUS'; payload: any }
  | { type: 'INITIALIZED' };

// 定义Hook返回类型
interface UseWebTimerReturn {
  timeLeft: number;
  progress: number;
  isRunning: boolean;
  start: (duration: number, state: string) => void;
  pause: () => void;
  reset: () => void;
  update: (timeLeft: number) => void;
  setInterval: (interval: number) => void;
}

/**
 * 使用Web Timer Worker的Hook
 */
export const useWebTimer = (initialInterval: number = 1000): UseWebTimerReturn => {
  // Worker引用
  const workerRef = useRef<Worker | null>(null);

  // 本地状态
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // 获取统一计时器Store中的方法
  const {
    start: storeStart,
    pause: storePause,
    reset: storeReset,
    transitionTo,
  } = useUnifiedTimerStore();

  // 初始化Worker
  useEffect(() => {
    // 创建Worker
    const worker = new Worker(new URL('../workers/webTimerWorker.ts', import.meta.url));
    workerRef.current = worker;

    // 设置消息处理器
    const handleMessage = (event: MessageEvent) => {
      const message = event.data as WorkerMessage;

      switch (message.type) {
        case 'TICK':
          setTimeLeft(message.payload.timeLeft);
          setProgress(message.payload.progress);
          break;
        case 'COMPLETE':
          setIsRunning(false);
          // 通知Store计时完成
          if (message.payload.state === 'focus') {
            transitionTo('break');
          } else if (message.payload.state === 'break') {
            transitionTo('focus');
          } else if (message.payload.state === 'microBreak') {
            transitionTo('focus');
          }
          break;
        case 'STATUS':
          setIsRunning(message.payload.isRunning);
          setTimeLeft(message.payload.timeLeft);
          setProgress(((message.payload.totalTime - message.payload.timeLeft) / message.payload.totalTime) * 100);
          break;
        case 'INITIALIZED':
          // Worker已初始化，可以设置初始间隔
          worker.postMessage({ type: 'SET_INTERVAL', payload: initialInterval });
          break;
      }
    };

    worker.addEventListener('message', handleMessage);

    // 清理函数
    return () => {
      worker.removeEventListener('message', handleMessage);
      worker.terminate();
    };
  }, [initialInterval, transitionTo]);

  // 开始计时
  const start = useCallback((duration: number, state: string) => {
    if (workerRef.current) {
      workerRef.current.postMessage({ 
        type: 'START', 
        payload: { duration, state } 
      });
      storeStart();
    }
  }, [storeStart]);

  // 暂停计时
  const pause = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'PAUSE' });
      storePause();
    }
  }, [storePause]);

  // 重置计时
  const reset = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'RESET' });
      storeReset();
    }
  }, [storeReset]);

  // 更新时间
  const update = useCallback((timeLeft: number) => {
    if (workerRef.current) {
      workerRef.current.postMessage({ 
        type: 'UPDATE', 
        payload: { timeLeft } 
      });
    }
  }, []);

  // 设置更新间隔
  const setInterval = useCallback((interval: number) => {
    if (workerRef.current) {
      workerRef.current.postMessage({ 
        type: 'SET_INTERVAL', 
        payload: interval 
      });
    }
  }, []);

  // 返回状态和控制函数
  return useMemo(() => ({
    timeLeft,
    progress,
    isRunning,
    start,
    pause,
    reset,
    update,
    setInterval,
  }), [
    timeLeft,
    progress,
    isRunning,
    start,
    pause,
    reset,
    update,
    setInterval,
  ]);
};

/**
 * 优化版本的计时器Hook，集成了Web Worker和统一计时器Store
 */
export const useOptimizedTimer = () => {
  const {
    currentState,
    totalTime,
    isActive,
    start,
    pause,
    reset,
    switchMode,
  } = useUnifiedTimerStore((state) => ({
    currentState: state.currentState,
    totalTime: state.totalTime,
    isActive: state.isActive,
    start: state.start,
    pause: state.pause,
    reset: state.reset,
    switchMode: state.switchMode,
  }));

  const {
    timeLeft,
    progress,
    start: workerStart,
    pause: workerPause,
    reset: workerReset,
  } = useWebTimer();

  // 同步Store状态和Worker状态
  useEffect(() => {
    if (isActive && !isRunning) {
      workerStart(totalTime, currentState);
    } else if (!isActive && isRunning) {
      workerPause();
    }
  }, [isActive, isRunning, workerStart, workerPause, totalTime, currentState]);

  // 处理开始操作
  const handleStart = useCallback(() => {
    start();
  }, [start]);

  // 处理暂停操作
  const handlePause = useCallback(() => {
    pause();
  }, [pause]);

  // 处理重置操作
  const handleReset = useCallback(() => {
    reset();
    workerReset();
  }, [reset, workerReset]);

  // 处理模式切换
  const handleModeChange = useCallback((mode: any) => {
    switchMode(mode);
    workerReset();
  }, [switchMode, workerReset]);

  // 格式化时间
  const formattedTime = useMemo(() => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  return {
    timeLeft,
    totalTime,
    progress,
    isActive,
    currentState,
    formattedTime,
    start: handleStart,
    pause: handlePause,
    reset: handleReset,
    switchMode: handleModeChange,
  };
};
