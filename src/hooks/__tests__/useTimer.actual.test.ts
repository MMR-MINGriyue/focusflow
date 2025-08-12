/**
 * useTimer Hook 实际API测试
 * 
 * 测试实际的useTimer Hook功能，基于真实的API
 */

import { renderHook, act } from '@testing-library/react';
import { useTimer } from '../useTimer';
import { useUnifiedTimerStore as useTimerStore } from '../../stores/unifiedTimerStore';

// Mock timer store
jest.mock('../../stores/unifiedTimerStore', () => ({
  useUnifiedTimerStore: jest.fn(),
}));

describe('useTimer Hook - Actual API', () => {
  const mockStore = {
    currentState: 'focus',
    timeLeft: 1500, // 25 minutes in seconds
    isActive: false,
    settings: {
      mode: 'classic',
      classic: {
        focusDuration: 25,
        breakDuration: 5,
        microBreakMinInterval: 10,
        microBreakMaxInterval: 30,
        microBreakDuration: 3,
      },
      smart: {
        focusDuration: 90,
        breakDuration: 20,
        enableMicroBreaks: true,
        microBreakMinInterval: 10,
        microBreakMaxInterval: 30,
        microBreakMinDuration: 3,
        microBreakMaxDuration: 5,
        enableAdaptiveAdjustment: true,
        adaptiveFactorFocus: 1.0,
        adaptiveFactorBreak: 1.0,
        enableCircadianOptimization: true,
        peakFocusHours: [9, 10, 11, 14, 15, 16],
        lowEnergyHours: [13, 14, 22, 23, 0, 1],
        maxContinuousFocusTime: 120,
        forcedBreakThreshold: 150,
      },
      soundEnabled: true,
      notificationEnabled: true,
      volume: 0.5,
      showModeSelector: true,
      defaultMode: 'classic',
      allowModeSwitch: true,
    },
    transitionTo: jest.fn(),
    updateTimeLeft: jest.fn(),
    checkMicroBreakTrigger: jest.fn(),
    triggerMicroBreak: jest.fn(),
    start: jest.fn(),
    pause: jest.fn(),
    reset: jest.fn(),
    switchMode: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Reset mock store to default state
    mockStore.currentState = 'focus';
    mockStore.timeLeft = 1500;
    mockStore.isActive = false;
    mockStore.updateTimeLeft.mockClear();
    mockStore.transitionTo.mockClear();
    mockStore.checkMicroBreakTrigger.mockClear();
    mockStore.triggerMicroBreak.mockClear();

    // Reset mock implementations
    mockStore.updateTimeLeft.mockImplementation((newTimeLeft) => {
      mockStore.timeLeft = newTimeLeft;
    });

    // Mock useTimerStore to return our mock store
    (useTimerStore as jest.Mock).mockReturnValue(mockStore);

    // Mock useTimerStore.getState for the interval callback
    (useTimerStore as any).getState = jest.fn(() => mockStore);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // ==================== 基础功能测试 ====================
  describe('Basic Functionality', () => {
    it('returns correct initial state', () => {
      const { result } = renderHook(() => useTimer());

      expect(result.current.currentState).toBe('focus');
      expect(result.current.timeLeft).toBe(1500);
      expect(result.current.isActive).toBe(false);
      expect(result.current.formattedTime).toBe('25:00');
      expect(result.current.progress).toBe(0);
    });
  });

  // ==================== 计时器逻辑测试 ====================
  describe('Timer Logic', () => {
    it('starts interval when timer is active', () => {
      // Set timer to active
      mockStore.isActive = true;
      mockStore.timeLeft = 1500;

      const { result } = renderHook(() => useTimer());

      // Advance timers to trigger interval
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockStore.updateTimeLeft).toHaveBeenCalledWith(1499);
    });

    it('does not start interval when timer is inactive', () => {
      mockStore.isActive = false;
      mockStore.timeLeft = 1500;

      renderHook(() => useTimer());

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockStore.updateTimeLeft).not.toHaveBeenCalled();
    });

    it('handles time up correctly', () => {
      mockStore.isActive = true;
      mockStore.timeLeft = 0;

      renderHook(() => useTimer());

      // Should not start interval when time is 0
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockStore.updateTimeLeft).not.toHaveBeenCalled();
    });

    it('cleans up interval on unmount', () => {
      mockStore.isActive = true;
      mockStore.timeLeft = 1500;

      const { unmount } = renderHook(() => useTimer());

      // Start the interval
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockStore.updateTimeLeft).toHaveBeenCalled();

      // Clear mock calls
      jest.clearAllMocks();

      // Unmount the hook
      unmount();

      // Advance timers - should not call updateTimeLeft anymore
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockStore.updateTimeLeft).not.toHaveBeenCalled();
    });
  });

  // ==================== 微休息逻辑测试 ====================
  describe('Micro Break Logic', () => {
    it('checks for micro break when in focus state', () => {
      mockStore.currentState = 'focus';
      mockStore.isActive = true;
      mockStore.checkMicroBreakTrigger.mockReturnValue(true);

      renderHook(() => useTimer());

      act(() => {
        jest.advanceTimersByTime(60000); // 1 minute
      });

      expect(mockStore.checkMicroBreakTrigger).toHaveBeenCalled();
      expect(mockStore.triggerMicroBreak).toHaveBeenCalled();
    });

    it('does not check micro break when not in focus state', () => {
      mockStore.currentState = 'break';
      mockStore.isActive = true;

      renderHook(() => useTimer());

      act(() => {
        jest.advanceTimersByTime(60000);
      });

      expect(mockStore.checkMicroBreakTrigger).not.toHaveBeenCalled();
    });

    it('does not trigger micro break when check returns false', () => {
      mockStore.currentState = 'focus';
      mockStore.isActive = true;
      mockStore.checkMicroBreakTrigger.mockReturnValue(false);

      renderHook(() => useTimer());

      act(() => {
        jest.advanceTimersByTime(60000);
      });

      expect(mockStore.checkMicroBreakTrigger).toHaveBeenCalled();
      expect(mockStore.triggerMicroBreak).not.toHaveBeenCalled();
    });

    it('does not trigger micro break when not active', () => {
      mockStore.currentState = 'focus';
      mockStore.isActive = false;

      renderHook(() => useTimer());

      act(() => {
        jest.advanceTimersByTime(60000);
      });

      expect(mockStore.checkMicroBreakTrigger).not.toHaveBeenCalled();
    });
  });

  // ==================== 状态转换测试 ====================
  describe('State Transitions', () => {
    it('transitions to break after focus completes', () => {
      mockStore.currentState = 'focus';
      mockStore.timeLeft = 0;  // 直接设置为0，触发handleTimeUp
      mockStore.isActive = true;
      
      renderHook(() => useTimer());
      
      // 由于timeLeft为0，应该立即触发handleTimeUp函数
      expect(mockStore.transitionTo).toHaveBeenCalledWith('break');
    });

    it('transitions to focus after break completes', () => {
      mockStore.currentState = 'break';
      mockStore.timeLeft = 0;  // 直接设置为0，触发handleTimeUp
      mockStore.isActive = true;
      
      renderHook(() => useTimer());
      
      // 由于timeLeft为0，应该立即触发handleTimeUp函数
      expect(mockStore.transitionTo).toHaveBeenCalledWith('focus');
    });
  });

  // ==================== 边界条件测试 ====================
  describe('Edge Cases', () => {
    it('handles zero time values', () => {
      mockStore.timeLeft = 0;
      const { result } = renderHook(() => useTimer());

      expect(result.current.timeLeft).toBe(0);
      expect(result.current.formattedTime).toBe('00:00');
    });
  });
});