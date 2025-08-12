import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { create } from 'zustand';
import { statsStore } from './statsStore';
import { getStats, saveStats } from '../utils/storageUtils';

// Mock dependencies
vi.mock('../utils/storageUtils');

// Create a test store
const useTestStatsStore = create(statsStore);

describe('statsStore', () => {
  const mockStatsData = {
    daily: {
      focusSessions: 5,
      totalFocusTime: 125,
      completedSessions: 4,
      averageFocusDuration: 25,
      efficiencyScore: 85,
    },
    weekly: {
      focusSessions: 28,
      totalFocusTime: 700,
      completedSessions: 25,
      averageFocusDuration: 25,
      efficiencyScore: 82,
    },
    monthly: {
      focusSessions: 120,
      totalFocusTime: 3000,
      completedSessions: 105,
      averageFocusDuration: 25,
      efficiencyScore: 80,
    },
    allTime: {
      focusSessions: 500,
      totalFocusTime: 12500,
      completedSessions: 450,
      averageFocusDuration: 25,
      efficiencyScore: 78,
    },
    focusStreak: 15,
    longestStreak: 30,
    sessionHistory: [
      { date: '2023-10-01', focusTime: 100, sessions: 4 },
      { date: '2023-10-02', focusTime: 75, sessions: 3 },
    ],
  };

  beforeEach(() => {
    // Reset mocks and store
    vi.clearAllMocks();
    const state = useTestStatsStore.getState();
    state.reset();

    // Mock storage functions
    (getStats as jest.Mock).mockResolvedValue(mockStatsData);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with empty state and load stats', async () => {
    const state = useTestStatsStore.getState();

    // Initial state should be empty
    expect(state.stats).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();

    // Call loadStats
    await state.loadStats();

    // Verify stats were loaded
    expect(getStats).toHaveBeenCalled();
    expect(state.stats).toEqual(mockStatsData);
    expect(state.isLoading).toBe(false);
  });

  it('should handle loading state correctly', async () => {
    const state = useTestStatsStore.getState();
    const mockPromise = new Promise(resolve => setTimeout(resolve, 0));
    (getStats as jest.Mock).mockReturnValue(mockPromise);

    // Start loading
    const loadPromise = state.loadStats();
    expect(state.isLoading).toBe(true);

    // Wait for loading to complete
    await loadPromise;
    expect(state.isLoading).toBe(false);
  });

  it('should handle errors when loading stats', async () => {
    const state = useTestStatsStore.getState();
    const testError = new Error('Failed to load stats');
    (getStats as jest.Mock).mockRejectedValue(testError);

    // Attempt to load stats
    await state.loadStats();

    // Verify error state
    expect(state.error).toBe(testError.message);
    expect(state.stats).toBeNull();
  });

  it('should update stats with new session data', () => {
    const state = useTestStatsStore.getState();
    state.setStats(mockStatsData);

    // Mock new session data
    const newSession = {
      date: '2023-10-03',
      duration: 25,
      completed: true,
      efficiencyScore: 90,
    };

    // Update stats with new session
    state.updateStats(newSession);

    // Get updated stats
    const updatedStats = state.stats;

    // Verify daily stats updated
    expect(updatedStats?.daily.focusSessions).toBe(6);
    expect(updatedStats?.daily.totalFocusTime).toBe(150);
    expect(updatedStats?.daily.completedSessions).toBe(5);
    expect(updatedStats?.daily.averageFocusDuration).toBe(25); // (125 + 25) / 6 = 25
    expect(updatedStats?.daily.efficiencyScore).toBe(86); // (85*5 + 90)/6 = 86

    // Verify weekly stats updated
    expect(updatedStats?.weekly.focusSessions).toBe(29);
    expect(updatedStats?.weekly.totalFocusTime).toBe(725);

    // Verify allTime stats updated
    expect(updatedStats?.allTime.focusSessions).toBe(501);
    expect(updatedStats?.allTime.totalFocusTime).toBe(12525);

    // Verify session history updated
    expect(updatedStats?.sessionHistory.length).toBe(3);
    expect(updatedStats?.sessionHistory.find(s => s.date === '2023-10-03')).toBeTruthy();

    // Verify saveStats was called
    expect(saveStats).toHaveBeenCalled();
  });

  it('should calculate efficiency score correctly', () => {
    const state = useTestStatsStore.getState();
    state.setStats(mockStatsData);

    // Test efficiency calculation with different weights
    const score1 = state.calculateEfficiencyScore(25, true, 0); // Completed, no distractions
    const score2 = state.calculateEfficiencyScore(25, true, 3); // Completed, 3 distractions
    const score3 = state.calculateEfficiencyScore(25, false, 0); // Not completed

    expect(score1).toBeGreaterThan(90);
    expect(score2).toBeBetween(70, 85);
    expect(score3).toBeLessThan(50);
  });

  it('should update focus streak correctly', () => {
    const state = useTestStatsStore.getState();
    state.setStats(mockStatsData);

    // Test streak increase
    state.updateStreak(true);
    expect(state.stats?.focusStreak).toBe(16);
    expect(state.stats?.longestStreak).toBe(30);

    // Test streak reset
    state.updateStreak(false);
    expect(state.stats?.focusStreak).toBe(0);
    expect(state.stats?.longestStreak).toBe(30); // Longest streak shouldn't change

    // Test new longest streak
    // Set current streak to 30
    state.setStats({
      ...mockStatsData,
      focusStreak: 30,
      longestStreak: 30
    });
    state.updateStreak(true);
    expect(state.stats?.focusStreak).toBe(31);
    expect(state.stats?.longestStreak).toBe(31); // New longest streak
  });

  it('should reset stats to initial state', () => {
    const state = useTestStatsStore.getState();
    state.setStats(mockStatsData);
    state.setError('Test error');

    // Reset store
    state.reset();

    // Verify state was reset
    expect(state.stats).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should set error state correctly', () => {
    const state = useTestStatsStore.getState();
    const testError = 'Test error message';

    // Set error
    state.setError(testError);
    expect(state.error).toBe(testError);

    // Clear error
    state.clearError();
    expect(state.error).toBeNull();
  });
})