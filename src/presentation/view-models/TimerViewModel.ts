import { useState, useEffect, useCallback } from 'react';
import { Timer } from '../../domain/entities/Timer';
import { StartTimerUseCase } from '../../application/use-cases/StartTimerUseCase';
import { PauseTimerUseCase } from '../../application/use-cases/PauseTimerUseCase';
import { ResumeTimerUseCase } from '../../application/use-cases/ResumeTimerUseCase';
import { ResetTimerUseCase } from '../../application/use-cases/ResetTimerUseCase';
import { ITimerRepository } from '../../domain/repositories/ITimerRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';

export interface TimerViewModelState {
  timer: Timer | null;
  isLoading: boolean;
  error: string | null;
  remainingTime: number;
  isRunning: boolean;
  isPaused: boolean;
  currentCycle: number;
  mode: 'pomodoro' | 'shortBreak' | 'longBreak';
}

export class TimerViewModel {
  private timerRepository: ITimerRepository;
  private userRepository: IUserRepository;
  private userId: string;

  constructor(
    timerRepository: ITimerRepository,
    userRepository: IUserRepository,
    userId: string
  ) {
    this.timerRepository = timerRepository;
    this.userRepository = userRepository;
    this.userId = userId;
  }

  async startTimer(config?: {
    duration?: number;
    shortBreakDuration?: number;
    longBreakDuration?: number;
    longBreakInterval?: number;
  }): Promise<Timer> {
    const useCase = new StartTimerUseCase(this.timerRepository, this.userRepository);
    
    try {
      const response = await useCase.execute({
        userId: this.userId,
        ...config
      });
      
      return response.timer;
    } catch (error) {
      throw new Error(`Failed to start timer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async pauseTimer(timerId: string): Promise<void> {
    const useCase = new PauseTimerUseCase(this.timerRepository);
    
    try {
      await useCase.execute({
        timerId,
        userId: this.userId
      });
    } catch (error) {
      throw new Error(`Failed to pause timer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async resumeTimer(timerId: string): Promise<void> {
    const useCase = new ResumeTimerUseCase(this.timerRepository);
    
    try {
      await useCase.execute({
        timerId,
        userId: this.userId
      });
    } catch (error) {
      throw new Error(`Failed to resume timer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async resetTimer(timerId: string): Promise<void> {
    const useCase = new ResetTimerUseCase(this.timerRepository);
    
    try {
      await useCase.execute({
        timerId,
        userId: this.userId
      });
    } catch (error) {
      throw new Error(`Failed to reset timer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getActiveTimer(): Promise<Timer | null> {
    return this.timerRepository.findActiveTimer(this.userId);
  }

  async getAllTimers(): Promise<Timer[]> {
    return this.timerRepository.findByUserId(this.userId);
  }

  async getTimerById(timerId: string): Promise<Timer | null> {
    return this.timerRepository.findById(timerId);
  }

  formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  getTimerProgress(timer: Timer): number {
    const state = timer.getState();
    const config = timer.getConfig();
    
    const totalDuration = config.duration;
    const remaining = state.remainingTime;
    
    return ((totalDuration - remaining) / totalDuration) * 100;
  }

  getNextMode(timer: Timer): string {
    const state = timer.getState();
    
    switch (state.mode) {
      case 'pomodoro':
        return state.currentCycle % 4 === 0 ? 'longBreak' : 'shortBreak';
      case 'shortBreak':
      case 'longBreak':
        return 'pomodoro';
      default:
        return 'pomodoro';
    }
  }
}

// React Hook for Timer ViewModel
export function useTimerViewModel(
  timerRepository: ITimerRepository,
  userRepository: IUserRepository,
  userId: string
) {
  const [viewModel] = useState(() => new TimerViewModel(timerRepository, userRepository, userId));
  const [state, setState] = useState<TimerViewModelState>({
    timer: null,
    isLoading: false,
    error: null,
    remainingTime: 0,
    isRunning: false,
    isPaused: false,
    currentCycle: 1,
    mode: 'pomodoro'
  });

  const loadActiveTimer = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const timer = await viewModel.getActiveTimer();
      if (timer) {
        const timerState = timer.getState();
        setState({
          timer,
          isLoading: false,
          error: null,
          remainingTime: timerState.remainingTime,
          isRunning: timerState.isRunning,
          isPaused: timerState.isPaused,
          currentCycle: timerState.currentCycle,
          mode: timerState.mode
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false, timer: null }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load timer'
      }));
    }
  }, [viewModel]);

  const startTimer = useCallback(async (config?: any) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const timer = await viewModel.startTimer(config);
      const timerState = timer.getState();
      setState({
        timer,
        isLoading: false,
        error: null,
        remainingTime: timerState.remainingTime,
        isRunning: timerState.isRunning,
        isPaused: timerState.isPaused,
        currentCycle: timerState.currentCycle,
        mode: timerState.mode
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to start timer'
      }));
    }
  }, [viewModel]);

  const pauseTimer = useCallback(async () => {
    if (!state.timer) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // 使用用户ID来暂停活动计时器，而不是特定的计时器ID
      await viewModel.pauseTimer('active-timer'); // 临时解决方案
      await loadActiveTimer();
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to pause timer'
      }));
    }
  }, [viewModel, state.timer, loadActiveTimer]);

  const resumeTimer = useCallback(async () => {
    if (!state.timer) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // 使用用户ID来恢复活动计时器，而不是特定的计时器ID
      await viewModel.resumeTimer('active-timer'); // 临时解决方案
      await loadActiveTimer();
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to resume timer'
      }));
    }
  }, [viewModel, state.timer, loadActiveTimer]);

  const resetTimer = useCallback(async () => {
    if (!state.timer) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // 使用用户ID来重置活动计时器，而不是特定的计时器ID
      await viewModel.resetTimer('active-timer'); // 临时解决方案
      await loadActiveTimer();
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to reset timer'
      }));
    }
  }, [viewModel, state.timer, loadActiveTimer]);

  useEffect(() => {
    loadActiveTimer();
  }, [loadActiveTimer]);

  return {
    ...state,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    loadActiveTimer,
    formatTime: viewModel.formatTime.bind(viewModel),
    getTimerProgress: viewModel.getTimerProgress.bind(viewModel),
    getNextMode: viewModel.getNextMode.bind(viewModel)
  };
}