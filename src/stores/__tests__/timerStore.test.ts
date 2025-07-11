/**
 * TimerStore 状态管理测试
 * 测试Zustand store的状态管理功能
 */

import { act, renderHook } from '@testing-library/react';
import { useTimerStore } from '../timerStore';
import type { TimerState, TimerSettings, EfficiencyRatingData } from '../timerStore';

// Mock dependencies
jest.mock('../../services/crypto', () => ({
  cryptoService: {
    generateId: jest.fn(() => 'mock-id'),
    hash: jest.fn(() => 'mock-hash'),
  },
}));

jest.mock('../../services/sound', () => ({
  soundService: {
    playMapped: jest.fn(),
    setVolume: jest.fn(),
    stopAll: jest.fn(),
  },
}));

jest.mock('../../services/notification', () => ({
  notificationService: {
    show: jest.fn(),
    requestPermission: jest.fn(),
  },
}));

jest.mock('../../services/database', () => ({
  databaseService: {
    addSession: jest.fn(),
    updateDailyStats: jest.fn(),
    getDailyStats: jest.fn(() => Promise.resolve({
      date: '2023-01-01',
      focusTime: 0,
      breakTime: 0,
      microBreaks: 0,
      efficiency: 0,
      sessions: [],
    })),
  },
}));

describe('TimerStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state before each test
    const { result } = renderHook(() => useTimerStore());
    act(() => {
      result.current.resetTimer();
    });
  });

  describe('Initial State', () => {
    it('has correct initial state', () => {
      const { result } = renderHook(() => useTimerStore());
      
      expect(result.current.currentState).toBe('focus');
      expect(result.current.isActive).toBe(false);
      expect(result.current.timeLeft).toBe(1500); // 25 minutes
      expect(result.current.settings.focusDuration).toBe(25);
      expect(result.current.settings.breakDuration).toBe(5);
      expect(result.current.settings.soundEnabled).toBe(true);
      expect(result.current.settings.notificationEnabled).toBe(true);
    });

    it('has correct initial stats', () => {
      const { result } = renderHook(() => useTimerStore());
      
      expect(result.current.todayStats.focusTime).toBe(0);
      expect(result.current.todayStats.breakTime).toBe(0);
      expect(result.current.todayStats.microBreaks).toBe(0);
      expect(result.current.todayStats.efficiency).toBe(0);
    });
  });

  describe('Timer Controls', () => {
    it('starts timer correctly', () => {
      const { result } = renderHook(() => useTimerStore());
      
      act(() => {
        result.current.startTimer();
      });
      
      expect(result.current.isActive).toBe(true);
      expect(result.current.focusStartTime).toBeGreaterThan(0);
    });

    it('pauses timer correctly', () => {
      const { result } = renderHook(() => useTimerStore());
      
      act(() => {
        result.current.startTimer();
        result.current.pauseTimer();
      });
      
      expect(result.current.isActive).toBe(false);
    });

    it('resets timer correctly', () => {
      const { result } = renderHook(() => useTimerStore());
      
      act(() => {
        result.current.startTimer();
        result.current.updateTimeLeft(1000);
        result.current.resetTimer();
      });
      
      expect(result.current.isActive).toBe(false);
      expect(result.current.timeLeft).toBe(1500); // Back to 25 minutes
      expect(result.current.currentState).toBe('focus');
    });
  });

  describe('State Transitions', () => {
    it('transitions from focus to break', () => {
      const { result } = renderHook(() => useTimerStore());
      
      act(() => {
        result.current.transitionTo('break');
      });
      
      expect(result.current.currentState).toBe('break');
      expect(result.current.timeLeft).toBe(300); // 5 minutes
      expect(result.current.isActive).toBe(false);
    });

    it('transitions from break to focus', () => {
      const { result } = renderHook(() => useTimerStore());
      
      act(() => {
        result.current.transitionTo('break');
        result.current.transitionTo('focus');
      });
      
      expect(result.current.currentState).toBe('focus');
      expect(result.current.timeLeft).toBe(1500); // 25 minutes
    });

    it('transitions to micro break', () => {
      const { result } = renderHook(() => useTimerStore());
      
      act(() => {
        result.current.transitionTo('microBreak');
      });
      
      expect(result.current.currentState).toBe('microBreak');
      expect(result.current.timeLeft).toBe(180); // 3 minutes
    });
  });

  describe('Settings Management', () => {
    it('updates settings correctly', () => {
      const { result } = renderHook(() => useTimerStore());
      
      const newSettings: Partial<TimerSettings> = {
        focusDuration: 30,
        breakDuration: 10,
        soundEnabled: false,
      };
      
      act(() => {
        result.current.updateSettings(newSettings);
      });
      
      expect(result.current.settings.focusDuration).toBe(30);
      expect(result.current.settings.breakDuration).toBe(10);
      expect(result.current.settings.soundEnabled).toBe(false);
    });

    it('updates time left when focus duration changes', () => {
      const { result } = renderHook(() => useTimerStore());
      
      act(() => {
        result.current.updateSettings({ focusDuration: 30 });
      });
      
      expect(result.current.timeLeft).toBe(1800); // 30 minutes
    });

    it('updates volume setting', () => {
      const { result } = renderHook(() => useTimerStore());
      
      act(() => {
        result.current.updateSettings({ volume: 0.8 });
      });
      
      expect(result.current.settings.volume).toBe(0.8);
    });
  });

  describe('Micro Break Logic', () => {
    it('checks micro break trigger correctly', () => {
      const { result } = renderHook(() => useTimerStore());
      
      // Set up conditions for micro break
      act(() => {
        result.current.focusStartTime = Date.now() - 15 * 60 * 1000; // 15 minutes ago
        result.current.nextMicroBreakInterval = 10; // 10 minutes
      });
      
      const shouldTrigger = result.current.checkMicroBreakTrigger();
      expect(shouldTrigger).toBe(true);
    });

    it('does not trigger micro break too early', () => {
      const { result } = renderHook(() => useTimerStore());
      
      // Set up conditions where micro break should not trigger
      act(() => {
        result.current.focusStartTime = Date.now() - 5 * 60 * 1000; // 5 minutes ago
        result.current.nextMicroBreakInterval = 10; // 10 minutes
      });
      
      const shouldTrigger = result.current.checkMicroBreakTrigger();
      expect(shouldTrigger).toBe(false);
    });

    it('triggers micro break correctly', () => {
      const { result } = renderHook(() => useTimerStore());
      
      act(() => {
        result.current.triggerMicroBreak();
      });
      
      expect(result.current.currentState).toBe('microBreak');
      expect(result.current.timeLeft).toBe(180); // 3 minutes
      expect(result.current.todayStats.microBreaks).toBe(1);
    });
  });

  describe('Time Management', () => {
    it('updates time left correctly', () => {
      const { result } = renderHook(() => useTimerStore());
      
      act(() => {
        result.current.updateTimeLeft(1200);
      });
      
      expect(result.current.timeLeft).toBe(1200);
    });

    it('handles zero time left', () => {
      const { result } = renderHook(() => useTimerStore());
      
      act(() => {
        result.current.updateTimeLeft(0);
      });
      
      expect(result.current.timeLeft).toBe(0);
    });

    it('handles negative time left', () => {
      const { result } = renderHook(() => useTimerStore());
      
      act(() => {
        result.current.updateTimeLeft(-10);
      });
      
      expect(result.current.timeLeft).toBe(0); // Should clamp to 0
    });
  });

  describe('Efficiency Rating', () => {
    it('shows efficiency rating dialog', () => {
      const { result } = renderHook(() => useTimerStore());
      
      const sessionData = {
        sessionId: 'test-session',
        duration: 1500,
        state: 'focus' as TimerState,
      };
      
      act(() => {
        result.current.showEfficiencyRating(sessionData);
      });
      
      expect(result.current.showRatingDialog).toBe(true);
      expect(result.current.pendingRatingSession).toEqual(sessionData);
    });

    it('hides efficiency rating dialog', () => {
      const { result } = renderHook(() => useTimerStore());
      
      act(() => {
        result.current.showEfficiencyRating({
          sessionId: 'test',
          duration: 1500,
          state: 'focus',
        });
        result.current.hideEfficiencyRating();
      });
      
      expect(result.current.showRatingDialog).toBe(false);
      expect(result.current.pendingRatingSession).toBeNull();
    });

    it('submits efficiency rating correctly', () => {
      const { result } = renderHook(() => useTimerStore());
      
      const ratingData: EfficiencyRatingData = {
        overallRating: 4,
        focusLevel: 5,
        energyLevel: 3,
        satisfaction: 4,
        notes: 'Good session',
        tags: ['productive', 'focused'],
      };
      
      act(() => {
        result.current.showEfficiencyRating({
          sessionId: 'test',
          duration: 1500,
          state: 'focus',
        });
        result.current.submitEfficiencyRating(ratingData);
      });
      
      expect(result.current.showRatingDialog).toBe(false);
      expect(result.current.pendingRatingSession).toBeNull();
    });
  });

  describe('Statistics', () => {
    it('updates focus time statistics', () => {
      const { result } = renderHook(() => useTimerStore());
      
      act(() => {
        result.current.updateStats('focus', 1500);
      });
      
      expect(result.current.todayStats.focusTime).toBe(1500);
    });

    it('updates break time statistics', () => {
      const { result } = renderHook(() => useTimerStore());
      
      act(() => {
        result.current.updateStats('break', 300);
      });
      
      expect(result.current.todayStats.breakTime).toBe(300);
    });

    it('accumulates statistics correctly', () => {
      const { result } = renderHook(() => useTimerStore());
      
      act(() => {
        result.current.updateStats('focus', 1500);
        result.current.updateStats('focus', 1200);
      });
      
      expect(result.current.todayStats.focusTime).toBe(2700);
    });
  });

  describe('Error Handling', () => {
    it('handles invalid state transitions gracefully', () => {
      const { result } = renderHook(() => useTimerStore());
      
      expect(() => {
        act(() => {
          result.current.transitionTo('invalid' as TimerState);
        });
      }).not.toThrow();
    });

    it('handles invalid settings gracefully', () => {
      const { result } = renderHook(() => useTimerStore());
      
      expect(() => {
        act(() => {
          result.current.updateSettings({ focusDuration: -10 });
        });
      }).not.toThrow();
      
      // Should not update to invalid value
      expect(result.current.settings.focusDuration).toBeGreaterThan(0);
    });
  });
});
