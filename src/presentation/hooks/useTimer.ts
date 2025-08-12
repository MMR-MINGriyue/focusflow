import { useState, useEffect, useCallback, useRef } from 'react';
import { Timer } from '../../domain/entities/Timer';
import { IndexedDBAdapter } from '../../infrastructure/storage/IndexedDBAdapter';
import { IndexedDBTimerRepository } from '../../infrastructure/repositories/IndexedDBTimerRepository';
import { IndexedDBUserRepository } from '../../infrastructure/repositories/IndexedDBUserRepository';
import { StartTimerUseCase } from '../../application/use-cases/StartTimerUseCase';
import { PauseTimerUseCase } from '../../application/use-cases/PauseTimerUseCase';
import { ResumeTimerUseCase } from '../../application/use-cases/ResumeTimerUseCase';
import { ResetTimerUseCase } from '../../application/use-cases/ResetTimerUseCase';

export interface UseTimerState {
  timer: Timer | null;
  isLoading: boolean;
  error: string | null;
  remainingTime: number;
  isRunning: boolean;
  isPaused: boolean;
  currentCycle: number;
  mode: 'pomodoro' | 'shortBreak' | 'longBreak';
  formattedTime: string;
  progress: number;
}

export function useTimer(userId: string = 'default-user') {
  const [state, setState] = useState<UseTimerState>({
    timer: null,
    isLoading: false,
    error: null,
    remainingTime: 0,
    isRunning: false,
    isPaused: false,
    currentCycle: 1,
    mode: 'pomodoro',
    formattedTime: '25:00',
    progress: 0
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const dbAdapterRef = useRef<IndexedDBAdapter | null>(null);
  const timerRepositoryRef = useRef<IndexedDBTimerRepository | null>(null);
  const userRepositoryRef = useRef<IndexedDBUserRepository | null>(null);

  // Initialize repositories
  const initializeRepositories = useCallback(async () => {
    if (!dbAdapterRef.current) {
      dbAdapterRef.current = new IndexedDBAdapter();
      await dbAdapterRef.current.initialize();
      
      timerRepositoryRef.current = new IndexedDBTimerRepository(dbAdapterRef.current);
      userRepositoryRef.current = new IndexedDBUserRepository(dbAdapterRef.current);
    }
  }, []);

  // Format time helper
  const formatTime = useCallback((milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Update timer state
  const updateTimerState = useCallback((timer: Timer | null) => {
    if (!timer) {
      setState(prev => ({
        ...prev,
        timer: null,
        remainingTime: 0,
        isRunning: false,
        isPaused: false,
        currentCycle: 1,
        mode: 'pomodoro',
        formattedTime: '25:00',
        progress: 0
      }));
      return;
    }

    const timerState = timer.getState();
    const config = timer.getConfig();
    
    setState(prev => ({
      ...prev,
      timer,
      remainingTime: timerState.remainingTime,
      isRunning: timerState.isRunning,
      isPaused: timerState.isPaused,
      currentCycle: timerState.currentCycle,
      mode: timerState.mode,
      formattedTime: formatTime(timerState.remainingTime),
      progress: ((config.duration - timerState.remainingTime) / config.duration) * 100
    }));
  }, [formatTime]);

  // Load active timer
  const loadActiveTimer = useCallback(async () => {
    if (!timerRepositoryRef.current) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const activeTimer = await timerRepositoryRef.current.findActiveTimer(userId);
      updateTimerState(activeTimer);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load timer'
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [userId, updateTimerState]);

  // Start timer
  const startTimer = useCallback(async (config?: {
    duration?: number;
    shortBreakDuration?: number;
    longBreakDuration?: number;
    longBreakInterval?: number;
  }) => {
    if (!timerRepositoryRef.current || !userRepositoryRef.current) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const useCase = new StartTimerUseCase(
        timerRepositoryRef.current,
        userRepositoryRef.current
      );
      
      const response = await useCase.execute({
        userId,
        ...config
      });
      
      updateTimerState(response.timer);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to start timer'
      }));
    }
  }, [userId, updateTimerState]);

  // Pause timer
  const pauseTimer = useCallback(async () => {
    if (!state.timer || !timerRepositoryRef.current) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const useCase = new PauseTimerUseCase(timerRepositoryRef.current);
      
      // Note: In a real implementation, we'd need to handle timer ID
      // For now, we'll use a mock ID approach
      const timerId = `timer_${userId}_${Date.now()}`;
      
      await useCase.execute({
        timerId,
        userId
      });
      
      if (state.timer) {
        state.timer.pause();
        updateTimerState(state.timer);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to pause timer'
      }));
    }
  }, [state.timer, userId, updateTimerState]);

  // Resume timer
  const resumeTimer = useCallback(async () => {
    if (!state.timer || !timerRepositoryRef.current) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const useCase = new ResumeTimerUseCase(timerRepositoryRef.current);
      
      const timerId = `timer_${userId}_${Date.now()}`;
      
      await useCase.execute({
        timerId,
        userId
      });
      
      if (state.timer) {
        state.timer.resume();
        updateTimerState(state.timer);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to resume timer'
      }));
    }
  }, [state.timer, userId, updateTimerState]);

  // Reset timer
  const resetTimer = useCallback(async () => {
    if (!state.timer || !timerRepositoryRef.current) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const useCase = new ResetTimerUseCase(timerRepositoryRef.current);
      
      const timerId = `timer_${userId}_${Date.now()}`;
      
      await useCase.execute({
        timerId,
        userId
      });
      
      if (state.timer) {
        state.timer.reset();
        updateTimerState(state.timer);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to reset timer'
      }));
    }
  }, [state.timer, userId, updateTimerState]);

  // Update timer time
  const updateTimerTime = useCallback((elapsed: number) => {
    if (!state.timer) return;
    
    state.timer.updateTime(elapsed);
    updateTimerState(state.timer);
  }, [state.timer, updateTimerState]);

  // Initialize on mount
  useEffect(() => {
    initializeRepositories().then(() => {
      loadActiveTimer();
    });
  }, [initializeRepositories, loadActiveTimer]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    loadActiveTimer,
    updateTimerTime,
    formatTime
  };
}