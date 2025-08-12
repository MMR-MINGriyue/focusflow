import { Timer } from '../entities/Timer';

export interface TimerData {
  id: string;
  config: {
    duration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
    longBreakInterval: number;
  };
  state: {
    remainingTime: number;
    isRunning: boolean;
    isPaused: boolean;
    currentCycle: number;
    mode: 'pomodoro' | 'shortBreak' | 'longBreak';
  };
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITimerRepository {
  save(timer: Timer, userId: string): Promise<void>;
  findById(id: string): Promise<Timer | null>;
  findByUserId(userId: string): Promise<Timer[]>;
  delete(id: string): Promise<void>;
  update(id: string, timer: Timer): Promise<void>;
  findActiveTimer(userId: string): Promise<Timer | null>;
}