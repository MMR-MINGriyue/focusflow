/**
 * 计时器Web Worker
 * 处理计时器逻辑，避免阻塞主线程
 */

// 计时器状态
interface TimerState {
  isActive: boolean;
  startTime: number;
  timeLeft: number;
  totalDuration: number;
  lastUpdateTime: number;
}

// 消息类型定义
type TimerCommand = 'start' | 'pause' | 'reset' | 'setDuration';

type WorkerMessage = {
  command: TimerCommand;
  payload?: any;
};

type MainThreadMessage = {
  type: 'update' | 'complete';
  data: {
    formattedTime: string;
    timeLeft: number;
    progress: number;
  } | null;
};

// 初始化计时器状态
let timerState: TimerState = {
  isActive: false,
  startTime: 0,
  timeLeft: 0,
  totalDuration: 0,
  lastUpdateTime: 0
};

// 格式化时间（秒 -> MM:SS）
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 计算进度（0-1）
function calculateProgress(timeLeft: number, totalDuration: number): number {
  return Math.max(0, Math.min(1, 1 - timeLeft / totalDuration));
}

// 发送消息到主线程
function postMessageToMainThread(message: MainThreadMessage): void {
  self.postMessage(message);
}

// 计时器更新函数
function updateTimer(): void {
  if (!timerState.isActive) return;

  const now = Date.now();
  const elapsedTime = Math.floor((now - timerState.lastUpdateTime) / 1000);
  
  if (elapsedTime > 0) {
    timerState.timeLeft = Math.max(0, timerState.timeLeft - elapsedTime);
    timerState.lastUpdateTime = now;

    // 发送更新到主线程
    const formattedTime = formatTime(timerState.timeLeft);
    const progress = calculateProgress(timerState.timeLeft, timerState.totalDuration);

    postMessageToMainThread({
      type: 'update',
      data: {
        formattedTime,
        timeLeft: timerState.timeLeft,
        progress
      }
    });

    // 检查是否计时结束
    if (timerState.timeLeft === 0) {
      timerState.isActive = false;
      postMessageToMainThread({
        type: 'complete',
        data: null
      });
    }
  }

  // 继续循环
  requestAnimationFrame(updateTimer);
}

// 监听主线程消息
self.onmessage = (e: MessageEvent<WorkerMessage>): void => {
  const { command, payload } = e.data;
  const now = Date.now();

  switch (command) {
    case 'start':
      if (!timerState.isActive) {
        timerState.isActive = true;
        timerState.lastUpdateTime = now;
        updateTimer();
      }
      break;

    case 'pause':
      timerState.isActive = false;
      break;

    case 'reset':
      timerState.isActive = false;
      timerState.timeLeft = timerState.totalDuration;
      postMessageToMainThread({
        type: 'update',
        data: {
          formattedTime: formatTime(timerState.timeLeft),
          timeLeft: timerState.timeLeft,
          progress: calculateProgress(timerState.timeLeft, timerState.totalDuration)
        }
      });
      break;

    case 'setDuration':
      const duration = payload?.duration || 25 * 60; // 默认25分钟
      timerState.totalDuration = duration;
      timerState.timeLeft = duration;
      timerState.startTime = now;
      timerState.lastUpdateTime = now;
      postMessageToMainThread({
        type: 'update',
        data: {
          formattedTime: formatTime(timerState.timeLeft),
          timeLeft: timerState.timeLeft,
          progress: calculateProgress(timerState.timeLeft, timerState.totalDuration)
        }
      });
      break;

    default:
      console.warn('Unknown command:', command);
  }
};

// 初始化时设置默认时长（25分钟）
timerState.totalDuration = 25 * 60;
timerState.timeLeft = 25 * 60;

// 发送初始状态
postMessageToMainThread({
  type: 'update',
  data: {
    formattedTime: formatTime(timerState.timeLeft),
    timeLeft: timerState.timeLeft,
    progress: calculateProgress(timerState.timeLeft, timerState.totalDuration)
  }
});