import { Timer } from '../domain/entities/Timer';

describe('Timer Entity', () => {
  let timer: Timer;
  const defaultConfig = {
    duration: 25 * 60 * 1000, // 25 minutes
    shortBreakDuration: 5 * 60 * 1000, // 5 minutes
    longBreakDuration: 15 * 60 * 1000, // 15 minutes
    longBreakInterval: 4
  };

  beforeEach(() => {
    timer = new Timer(defaultConfig);
  });

  describe('Initialization', () => {
    it('should initialize with correct default state', () => {
      const state = timer.getState();
      expect(state.remainingTime).toBe(defaultConfig.duration);
      expect(state.isRunning).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.mode).toBe('pomodoro');
      expect(state.currentCycle).toBe(1);
    });
  });

  describe('Timer Control', () => {
    it('should start timer correctly', () => {
      timer.start();
      const state = timer.getState();
      expect(state.isRunning).toBe(true);
      expect(state.isPaused).toBe(false);
    });

    it('should pause timer correctly', () => {
      timer.start();
      timer.pause();
      const state = timer.getState();
      expect(state.isRunning).toBe(true);
      expect(state.isPaused).toBe(true);
    });

    it('should resume timer correctly', () => {
      timer.start();
      timer.pause();
      timer.resume();
      const state = timer.getState();
      expect(state.isRunning).toBe(true);
      expect(state.isPaused).toBe(false);
    });

    it('should reset timer correctly', () => {
      timer.start();
      timer.pause();
      timer.reset();
      const state = timer.getState();
      expect(state.isRunning).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.remainingTime).toBe(defaultConfig.duration);
      expect(state.mode).toBe('pomodoro');
      expect(state.currentCycle).toBe(1);
    });
  });

  describe('Time Updates', () => {
    it('should update time correctly', () => {
      timer.start();
      timer.updateTime(1000); // 1 second elapsed
      
      const state = timer.getState();
      expect(state.remainingTime).toBe(defaultConfig.duration - 1000);
    });

    it('should complete cycle when time reaches zero', () => {
      timer.start();
      timer.updateTime(defaultConfig.duration); // Complete the full pomodoro duration
      
      const state = timer.getState();
      expect(state.isRunning).toBe(false);
      // After completing pomodoro, should transition to short break
      expect(state.mode).toBe('shortBreak');
      expect(state.currentCycle).toBe(2);
      expect(state.remainingTime).toBe(defaultConfig.shortBreakDuration);
    });
  });

  describe('Cycle Completion', () => {
    it('should transition to short break after pomodoro', () => {
      const timer = new Timer(defaultConfig, { currentCycle: 1 });
      timer.start();
      timer.updateTime(defaultConfig.duration);
      
      const state = timer.getState();
      expect(state.mode).toBe('shortBreak');
      expect(state.remainingTime).toBe(defaultConfig.shortBreakDuration);
      expect(state.currentCycle).toBe(2);
    });

    it('should transition to long break after 4 pomodoros', () => {
      const timer = new Timer(defaultConfig, { currentCycle: 3 }); // After 3 cycles, next one will be the 4th
      timer.start();
      timer.updateTime(defaultConfig.duration);
      
      const state = timer.getState();
      expect(state.mode).toBe('longBreak');
      expect(state.remainingTime).toBe(defaultConfig.longBreakDuration);
      expect(state.currentCycle).toBe(4);
    });

    it('should transition back to pomodoro after break', () => {
      const timer = new Timer(defaultConfig, { mode: 'shortBreak' });
      timer.start();
      timer.updateTime(defaultConfig.shortBreakDuration);
      
      const state = timer.getState();
      expect(state.mode).toBe('pomodoro');
      expect(state.remainingTime).toBe(defaultConfig.duration);
    });
  });

  describe('Configuration Updates', () => {
    it('should update configuration correctly', () => {
      const newConfig = { duration: 30 * 60 * 1000 };
      timer.updateConfig(newConfig);
      
      const config = timer.getConfig();
      expect(config.duration).toBe(30 * 60 * 1000);
    });

    it('should not update remaining time when timer is running', () => {
      timer.start();
      const initialRemainingTime = timer.getState().remainingTime;
      
      timer.updateConfig({ duration: 30 * 60 * 1000 });
      const state = timer.getState();
      expect(state.remainingTime).toBe(initialRemainingTime);
    });
  });

  describe('Utility Methods', () => {
    it('should check if timer is complete', () => {
      expect(timer.isComplete()).toBe(false);
      
      // Create a timer that is already completed
      const completedTimer = new Timer(defaultConfig, { 
        remainingTime: 0, 
        isRunning: false 
      });
      expect(completedTimer.isComplete()).toBe(true);
    });

    it('should get elapsed time correctly', () => {
      expect(timer.getElapsedTime()).toBe(0);
      
      timer.start();
      // Note: In tests, we can't easily test actual elapsed time
      // This would need to be mocked
    });
  });
});