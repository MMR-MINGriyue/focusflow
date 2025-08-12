import { describe, it, expect, beforeEach, afterEach, vi } from './testHelpers';
import { getSettings, saveSettings, getStats, saveStats, clearStorage } from './storageUtils';
import { Settings, StatsData } from '../types/app.types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('storageUtils', () => {
  const testSettings: Settings = {
    mode: 'classic',
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStartBreaks: true,
    autoStartPomodoros: false,
    soundEnabled: true,
    notificationsEnabled: true,
    theme: 'light',
    accentColor: '#4CAF50',
    fontSize: 'medium',
    showKeyboardShortcuts: false,
    showMicroBreakReminders: true,
    microBreakInterval: 20,
  };

  const testStats: StatsData = {
    totalFocusTime: 125,
    completedPomodoros: 5,
    completedShortBreaks: 4,
    completedLongBreaks: 1,
    focusSessions: [
      { date: '2023-11-01', duration: 50, completedPomodoros: 2 },
      { date: '2023-11-02', duration: 75, completedPomodoros: 3 }
    ],
    efficiencyScores: [90, 85, 95],
    streak: 3
  };

  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getSettings', () => {
    it('should return default settings when no settings exist in storage', async () => {
      const result = await getSettings();
      expect(result).toEqual(expect.objectContaining({
        mode: expect.any(String),
        workDuration: expect.any(Number),
        shortBreakDuration: expect.any(Number)
      }));
    });

    it('should return saved settings from storage when available', async () => {
      // Save test settings first
      await saveSettings(testSettings);
      
      // Now retrieve them
      const result = await getSettings();
      expect(result).toEqual(testSettings);
    });

    it('should handle corrupted settings data and return defaults', async () => {
      // Save corrupted data
      window.localStorage.setItem('pomodoro_settings', 'invalid_json');
      
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = await getSettings();
      
      expect(result).not.toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to parse settings from storage, using defaults');
      consoleWarnSpy.mockRestore();
    });
  });

  describe('saveSettings', () => {
    it('should save settings to localStorage correctly', async () => {
      await saveSettings(testSettings);
      const savedData = window.localStorage.getItem('pomodoro_settings');
      expect(savedData).not.toBeNull();
      expect(JSON.parse(savedData!)).toEqual(testSettings);
    });

    it('should handle errors when saving settings', async () => {
      // Mock localStorage to throw an error
      const originalSetItem = window.localStorage.setItem;
      window.localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('Quota exceeded');
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await saveSettings(testSettings);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save settings:', expect.any(Error));
      
      // Restore original implementation
      window.localStorage.setItem = originalSetItem;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getStats', () => {
    it('should return default stats when no stats exist in storage', async () => {
      const result = await getStats();
      expect(result).toEqual({
        totalFocusTime: 0,
        completedPomodoros: 0,
        completedShortBreaks: 0,
        completedLongBreaks: 0,
        focusSessions: [],
        efficiencyScores: [],
        streak: 0
      });
    });

    it('should return saved stats from storage when available', async () => {
      // Save test stats first
      await saveStats(testStats);
      
      // Now retrieve them
      const result = await getStats();
      expect(result).toEqual(testStats);
    });

    it('should handle corrupted stats data and return defaults', async () => {
      // Save corrupted data
      window.localStorage.setItem('pomodoro_stats', 'invalid_json');
      
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = await getStats();
      
      expect(result).toEqual(expect.objectContaining({
        totalFocusTime: 0,
        streak: 0
      }));
      expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to parse stats from storage, using defaults');
      consoleWarnSpy.mockRestore();
    });
  });

  describe('saveStats', () => {
    it('should save stats to localStorage correctly', async () => {
      await saveStats(testStats);
      const savedData = window.localStorage.getItem('pomodoro_stats');
      expect(savedData).not.toBeNull();
      expect(JSON.parse(savedData!)).toEqual(testStats);
    });
  });

  describe('clearStorage', () => {
    it('should clear all pomodoro-related data from localStorage', async () => {
      // Save some test data
      await saveSettings(testSettings);
      await saveStats(testStats);
      window.localStorage.setItem('unrelated_data', 'should remain');
      
      // Clear storage
      await clearStorage();
      
      // Verify pomodoro data is cleared
      expect(window.localStorage.getItem('pomodoro_settings')).toBeNull();
      expect(window.localStorage.getItem('pomodoro_stats')).toBeNull();
      
      // Verify unrelated data remains
      expect(window.localStorage.getItem('unrelated_data')).toBe('should remain');
    });
  });
})