// Timer Web Worker - 用于高性能计时计算
// 运行在独立线程，避免阻塞主线程

interface TimerWorkerMessage {
  type: string;
  payload?: any;
  id?: string;
}

interface TimerCalculation {
  time: number;
  formattedTime: string;
  progress: number;
  remaining: number;
}

class TimerWorker {
  private timers: Map<string, { startTime: number; duration: number; isActive: boolean }> = new Map();


  constructor() {
    this.setupMessageHandlers();
  }

  private setupMessageHandlers() {
    self.addEventListener('message', (event) => {
      const { type, payload, id } = event.data as TimerWorkerMessage;

      switch (type) {
        case 'START_TIMER':
          this.startTimer(id!, payload.duration, payload.startTime);
          break;
        case 'PAUSE_TIMER':
          this.pauseTimer(id!);
          break;
        case 'RESET_TIMER':
          this.resetTimer(id!, payload.duration);
          break;
        case 'GET_CURRENT_TIME':
          this.getCurrentTime(id!);
          break;
        case 'CALCULATE_FORMATTED_TIME':
          this.calculateFormattedTime(payload.time);
          break;
        case 'CALCULATE_PROGRESS':
          this.calculateProgress(payload.current, payload.total);
          break;
        case 'BATCH_CALCULATE':
          this.batchCalculate(payload.times);
          break;
        default:
          console.warn('Unknown message type:', type);
      }
    });
  }

  private startTimer(id: string, duration: number, startTime?: number) {
    const start = startTime || Date.now();
    this.timers.set(id, {
      startTime: start,
      duration: duration,
      isActive: true
    });

    this.postMessage('TIMER_STARTED', { id, startTime: start, duration });
  }

  private pauseTimer(id: string) {
    const timer = this.timers.get(id);
    if (timer) {
      timer.isActive = false;
      this.postMessage('TIMER_PAUSED', { id, pausedAt: Date.now() });
    }
  }

  private resetTimer(id: string, duration: number) {
    this.timers.delete(id);
    this.postMessage('TIMER_RESET', { id, duration });
  }

  private getCurrentTime(id: string) {
    const timer = this.timers.get(id);
    if (!timer) {
      this.postMessage('TIMER_NOT_FOUND', { id });
      return;
    }

    const now = Date.now();
    const elapsed = timer.isActive ? now - timer.startTime : 0;
    const remaining = Math.max(0, timer.duration - elapsed);
    const progress = (elapsed / timer.duration) * 100;

    const calculation: TimerCalculation = {
      time: Math.floor(remaining / 1000),
      formattedTime: this.formatTime(Math.floor(remaining / 1000)),
      progress: Math.min(100, progress),
      remaining: remaining
    };

    this.postMessage('CURRENT_TIME', { id, calculation });
  }

  private calculateFormattedTime(time: number) {
    const formatted = this.formatTime(time);
    this.postMessage('FORMATTED_TIME', { time, formatted });
  }

  private calculateProgress(current: number, total: number) {
    const progress = (current / total) * 100;
    this.postMessage('PROGRESS', { current, total, progress });
  }

  private batchCalculate(times: number[]) {
    const results = times.map(time => ({
      time,
      formattedTime: this.formatTime(time),
      progress: (time / 3600) * 100 // 假设最大1小时
    }));

    this.postMessage('BATCH_RESULTS', { results });
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  private postMessage(type: string, payload: any) {
    self.postMessage({ type, payload });
  }

  // 性能优化方法
  private optimizeMemory() {
    // 清理过期的计时器
    const now = Date.now();
    for (const [id, timer] of this.timers.entries()) {
      if (!timer.isActive && (now - timer.startTime) > 3600000) { // 1小时
        this.timers.delete(id);
      }
    }
  }

  // 定期清理内存
  public scheduleMemoryCleanup() {
    setInterval(() => {
      this.optimizeMemory();
    }, 60000); // 每分钟清理一次
  }
}

// 初始化Worker
const timerWorker = new TimerWorker();
timerWorker.scheduleMemoryCleanup();

// 导出类型供主线程使用
export type { TimerWorkerMessage, TimerCalculation };