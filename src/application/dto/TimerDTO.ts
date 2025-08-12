export interface TimerConfigDTO {
  duration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
}

export interface TimerStateDTO {
  remainingTime: number;
  isRunning: boolean;
  isPaused: boolean;
  currentCycle: number;
  mode: 'pomodoro' | 'shortBreak' | 'longBreak';
}

export interface TimerResponseDTO {
  id: string;
  config: TimerConfigDTO;
  state: TimerStateDTO;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimerRequestDTO {
  userId: string;
  config?: Partial<TimerConfigDTO>;
}

export interface UpdateTimerRequestDTO {
  config?: Partial<TimerConfigDTO>;
  state?: Partial<TimerStateDTO>;
}