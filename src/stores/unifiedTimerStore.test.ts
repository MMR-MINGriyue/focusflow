import { describe, it, expect, vi, beforeEach } from 'vitest';
import { create } from 'zustand';
import { unifiedTimerStore } from './unifiedTimerStore';
import { TimerState, TimerMode } from '../types/timer.types';

// Mock the actual store for testing
const useTestStore = create(unifiedTimerStore);

// Mock dependencies
vi.mock('../utils/storageUtils', () => ({
  loadState: vi.fn().mockResolvedValue(null),
  saveState: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../services/statsService', () => ({
  recordSession: vi.fn().mockResolvedValue(undefined),
}));

describe('unifiedTimerStore', () => {
  beforeEach(() => {
    // Reset store before each test
    vi.clearAllMocks();
    const state = useTestStore.getState();
    state.reset();
  });

  it('should initialize with correct default state', () => {
    const state = useTestStore.getState();

    // Check initial state
    expect(state.state).toBe('idle');
    expect(state.timeLeft).toBe(0);
    expect(state.progress).toBe(0);
    expect(state.showSettings).toBe(false);
    expect(state.sessionCount).toBe(0);
    expect(state.currentSessionId).toBeNull();
    expect(state.error).toBeNull();

    // Check default settings
    expect(state.settings.mode).toBe('classic');
    expect(state.settings.workDuration).toBe(25);
    expect(state.settings.shortBreakDuration).toBe(5);
    expect(state.settings.longBreakDuration).toBe(15);
    expect(state.settings.longBreakInterval).toBe(4);
    expect(state.settings.autoStartBreaks).toBe(true);
    expect(state.settings.autoStartPomodoros).toBe(false);
    expect(state.settings.soundEnabled).toBe(true);
    expect(state.settings.notificationsEnabled).toBe(true);
  });

  it('should start timer correctly from idle state', () => {
    const state = useTestStore.getState();

    // Start the timer
    state.start();

    // Check state changes
    expect(state.state).toBe('running');
    expect(state.timeLeft).toBe(25 * 60); // 25 minutes in seconds
    expect(state.currentSessionId).not.toBeNull();
  });

  it('should pause timer when in running state', () => {
    const state = useTestStore.getState();

    // Start then pause
    state.start();
    state.pause();

    // Check state
    expect(state.state).toBe('paused');
    expect(state.timeLeft).toBeLessThan(25 * 60); // Should have decremented at least slightly
  });

  it('should reset timer to initial state', () => {
    const state = useTestStore.getState();

    // Start, pause, then reset
    state.start();
    state.pause();
    state.reset();

    // Check state
    expect(state.state).toBe('idle');
    expect(state.timeLeft).toBe(0);
    expect(state.progress).toBe(0);
    expect(state.currentSessionId).toBeNull();
  });

  it('should switch between timer modes correctly', () => {
    const state = useTestStore.getState();

    // Switch to smart mode
    state.switchMode('smart');
    expect(state.settings.mode).toBe('smart');
    expect(state.timeLeft).toBe(0);
    expect(state.state).toBe('idle');

    // Switch back to classic mode
    state.switchMode('classic');
    expect(state.settings.mode).toBe('classic');
  });

  it('should update settings correctly', () => {
    const state = useTestStore.getState();
    const newSettings = {
      ...state.settings,
      workDuration: 30,
      shortBreakDuration: 10,
      autoStartBreaks: false,
    };

    // Update settings
    state.setSettings(newSettings);

    // Check settings updated
    expect(state.settings.workDuration).toBe(30);
    expect(state.settings.shortBreakDuration).toBe(10);
    expect(state.settings.autoStartBreaks).toBe(false);
    expect(state.timeLeft).toBe(0); // Should reset timer
    expect(state.state).toBe('idle');
  });

  it('should toggle settings visibility', () => {
    const state = useTestStore.getState();

    // Show settings
    state.setShowSettings(true);
    expect(state.showSettings).toBe(true);

    // Hide settings
    state.setShowSettings(false);
    expect(state.showSettings).toBe(false);
  });

  it('should handle session completion and start break automatically', async () => {
    const state = useTestStore.getState();
    vi.useFakeTimers();

    // Start timer
    state.start();
    expect(state.state).toBe('running');
    expect(state.sessionCount).toBe(0);

    // Fast-forward time to complete session
    vi.advanceTimersByTime(25 * 60 * 1000); // 25 minutes

    // Let timers process
    await vi.runAllTimersAsync();

    // Check state after completion
    expect(state.state).toBe('break');
    expect(state.sessionCount).toBe(1);
    expect(state.timeLeft).toBe(5 * 60); // Should auto-start break
    expect(state.progress).toBe(0);

    vi.useRealTimers();
  });

  it('should switch to long break after specified intervals', async () => {
    const state = useTestStore.getState();
    vi.useFakeTimers();

    // Set shorter interval for testing
    state.setSettings({ ...state.settings, longBreakInterval: 2 });

    // Complete first session
    state.start();
    vi.advanceTimersByTime(25 * 60 * 1000);
    await vi.runAllTimersAsync();
    expect(state.state).toBe('break');
    expect(state.timeLeft).toBe(5 * 60); // Short break

    // Complete break
    vi.advanceTimersByTime(5 * 60 * 1000);
    await vi.runAllTimersAsync();

    // Complete second session
    state.start();
    vi.advanceTimersByTime(25 * 60 * 1000);
    await vi.runAllTimersAsync();

    // Should now have long break
    expect(state.state).toBe('break');
    expect(state.timeLeft).toBe(15 * 60); // Long break

    vi.useRealTimers();
  });

  it('should handle error state correctly', () => {
    const state = useTestStore.getState();
    const testError = new Error('Test error');

    // Set error
    state.setError(testError);
    expect(state.error).toBe(testError);

    // Clear error
    state.clearError();
    expect(state.error).toBeNull();
  });
})