export interface TimerConfig {
  duration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
}

export interface TimerState {
  remainingTime: number;
  isRunning: boolean;
  isPaused: boolean;
  currentCycle: number;
  mode: 'pomodoro' | 'shortBreak' | 'longBreak';
}

export class Timer {
  private config: TimerConfig;
  private state: TimerState;
  private startTime: number | null = null;
  private pausedTime: number = 0;

  constructor(config: TimerConfig, initialState?: Partial<TimerState>) {
    this.config = config;
    this.state = {
      remainingTime: config.duration,
      isRunning: false,
      isPaused: false,
      currentCycle: 1,
      mode: 'pomodoro',
      ...initialState
    };
  }

  start(): void {
    if (this.state.isRunning) {
      throw new Error('Timer is already running');
    }
    
    this.state.isRunning = true;
    this.state.isPaused = false;
    this.startTime = Date.now();
  }

  pause(): void {
    if (!this.state.isRunning || this.state.isPaused) {
      throw new Error('Timer is not running or already paused');
    }
    
    this.state.isPaused = true;
    this.pausedTime = Date.now();
  }

  resume(): void {
    if (!this.state.isPaused) {
      throw new Error('Timer is not paused');
    }
    
    this.state.isPaused = false;
    if (this.startTime && this.pausedTime) {
      this.startTime += (Date.now() - this.pausedTime);
    }
  }

  reset(): void {
    this.state = {
      remainingTime: this.config.duration,
      isRunning: false,
      isPaused: false,
      currentCycle: 1,
      mode: 'pomodoro'
    };
    this.startTime = null;
    this.pausedTime = 0;
  }

  updateTime(elapsed: number): void {
    if (!this.state.isRunning || this.state.isPaused) return;
    
    // 根据当前模式确定参考时长
    let referenceDuration: number;
    switch (this.state.mode) {
      case 'shortBreak':
        referenceDuration = this.config.shortBreakDuration;
        break;
      case 'longBreak':
        referenceDuration = this.config.longBreakDuration;
        break;
      default: // pomodoro mode
        referenceDuration = this.config.duration;
        break;
    }
    
    this.state.remainingTime = Math.max(0, referenceDuration - elapsed);
    
    if (this.state.remainingTime === 0) {
      this.completeCycle();
    }
  }

  private completeCycle(): void {
    this.state.isRunning = false;
    
    switch (this.state.mode) {
      case 'pomodoro':
        this.state.currentCycle++;
        this.state.mode = this.state.currentCycle % this.config.longBreakInterval === 0 
          ? 'longBreak' 
          : 'shortBreak';
        this.state.remainingTime = this.state.mode === 'longBreak' 
          ? this.config.longBreakDuration 
          : this.config.shortBreakDuration;
        break;
      case 'shortBreak':
      case 'longBreak':
        this.state.mode = 'pomodoro';
        this.state.remainingTime = this.config.duration;
        break;
    }
  }

  getState(): TimerState {
    return { ...this.state };
  }

  getConfig(): TimerConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<TimerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (!this.state.isRunning) {
      this.state.remainingTime = this.config.duration;
    }
  }

  isComplete(): boolean {
    return this.state.remainingTime === 0 && !this.state.isRunning;
  }

  getElapsedTime(): number {
    if (!this.startTime) return 0;
    if (this.state.isPaused) return this.pausedTime - this.startTime;
    return Date.now() - this.startTime;
  }
}