/**
 * Web Timer Worker
 * 在Web Worker中处理计时逻辑，避免阻塞主线程
 */

// 定义消息类型
type TimerWorkerMessage = 
  | { type: 'START'; payload: { duration: number; state: string } }
  | { type: 'PAUSE' }
  | { type: 'RESET' }
  | { type: 'UPDATE'; payload: { timeLeft: number } }
  | { type: 'GET_STATUS' }
  | { type: 'SET_INTERVAL'; payload: number };

// 定义Worker状态
interface TimerWorkerState {
  isRunning: boolean;
  timeLeft: number;
  totalTime: number;
  state: string;
  interval: number;
  startTime: number | null;
  pausedTime: number | null;
}

// 初始化状态
let state: TimerWorkerState = {
  isRunning: false,
  timeLeft: 0,
  totalTime: 0,
  state: 'focus',
  interval: 1000, // 默认1秒更新一次
  startTime: null,
  pausedTime: 0,
};

// 计时器引用
let timer: number | null = null;

// 发送消息到主线程
const sendMessage = (message: { type: string; payload?: any }) => {
  self.postMessage(message);
};

// 处理开始计时
const handleStart = (duration: number, timerState: string) => {
  if (state.isRunning) return;

  state.isRunning = true;
  state.timeLeft = duration;
  state.totalTime = duration;
  state.state = timerState;
  state.startTime = Date.now() - (state.pausedTime || 0);

  // 清除现有计时器
  if (timer) {
    clearInterval(timer);
  }

  // 启动新的计时器
  timer = self.setInterval(() => {
    const elapsed = Date.now() - state.startTime!;
    state.timeLeft = Math.max(0, state.totalTime - Math.floor(elapsed / 1000));

    // 发送更新消息
    sendMessage({
      type: 'TICK',
      payload: {
        timeLeft: state.timeLeft,
        elapsed,
        progress: ((state.totalTime - state.timeLeft) / state.totalTime) * 100
      }
    });

    // 检查是否结束
    if (state.timeLeft <= 0) {
      handleComplete();
    }
  }, state.interval);

  // 发送状态更新
  sendMessage({ type: 'STATUS', payload: { ...state } });
};

// 处理暂停
const handlePause = () => {
  if (!state.isRunning) return;

  state.isRunning = false;
  state.pausedTime = Date.now() - state.startTime!;

  if (timer) {
    clearInterval(timer);
    timer = null;
  }

  // 发送状态更新
  sendMessage({ type: 'STATUS', payload: { ...state } });
};

// 处理重置
const handleReset = () => {
  state.isRunning = false;
  state.timeLeft = state.totalTime;
  state.startTime = null;
  state.pausedTime = 0;

  if (timer) {
    clearInterval(timer);
    timer = null;
  }

  // 发送状态更新
  sendMessage({ type: 'STATUS', payload: { ...state } });
};

// 处理计时完成
const handleComplete = () => {
  state.isRunning = false;

  if (timer) {
    clearInterval(timer);
    timer = null;
  }

  // 发送完成消息
  sendMessage({ 
    type: 'COMPLETE', 
    payload: { 
      state: state.state,
      duration: state.totalTime
    } 
  });
};

// 处理更新时间
const handleUpdate = (timeLeft: number) => {
  state.timeLeft = timeLeft;

  // 如果正在运行，更新开始时间以保持正确的时间流逝
  if (state.isRunning && state.startTime) {
    state.startTime = Date.now() - (state.totalTime - timeLeft) * 1000;
  }

  // 发送状态更新
  sendMessage({ type: 'STATUS', payload: { ...state } });
};

// 处理设置间隔
const handleSetInterval = (interval: number) => {
  state.interval = interval;

  // 如果计时器正在运行，重新启动以应用新的间隔
  if (state.isRunning) {
    const wasRunning = true;
    const pausedTime = state.pausedTime;
    handlePause();
    state.pausedTime = pausedTime;
    if (wasRunning) {
      handleStart(state.timeLeft, state.state);
    }
  }

  // 发送状态更新
  sendMessage({ type: 'STATUS', payload: { ...state } });
};

// 处理获取状态
const handleGetStatus = () => {
  sendMessage({ type: 'STATUS', payload: { ...state } });
};

// 消息处理
self.onmessage = (event: MessageEvent) => {
  const message = event.data as TimerWorkerMessage;

  switch (message.type) {
    case 'START':
      handleStart(message.payload.duration, message.payload.state);
      break;
    case 'PAUSE':
      handlePause();
      break;
    case 'RESET':
      handleReset();
      break;
    case 'UPDATE':
      handleUpdate(message.payload.timeLeft);
      break;
    case 'GET_STATUS':
      handleGetStatus();
      break;
    case 'SET_INTERVAL':
      handleSetInterval(message.payload);
      break;
    default:
      console.warn(`Unknown message type: ${(message as any).type}`);
  }
};

// 初始化完成时发送消息
sendMessage({ type: 'INITIALIZED' });