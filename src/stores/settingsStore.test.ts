import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { create } from 'zustand';
import { settingsStore } from './settingsStore';
import { getSettings, saveSettings } from '../utils/storageUtils';

// Mock dependencies
vi.mock('../utils/storageUtils');

// Create a test store
const useTestSettingsStore = create(settingsStore);

describe('settingsStore', () => {
  const mockDefaultSettings = {
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

  const mockCustomSettings = {
    mode: 'smart',
    workDuration: 30,
    shortBreakDuration: 10,
    longBreakDuration: 20,
    longBreakInterval: 3,
    autoStartBreaks: false,
    autoStartPomodoros: true,
    soundEnabled: false,
    notificationsEnabled: true,
    theme: 'dark',
    accentColor: '#2196F3',
    fontSize: 'large',
    showKeyboardShortcuts: true,
    showMicroBreakReminders: false,
    microBreakInterval: 15,
  };

  beforeEach(() => {
    // Reset mocks and store
    vi.clearAllMocks();
    const state = useTestSettingsStore.getState();
    state.resetToDefaults();

    // Mock storage functions
    (getSettings as jest.Mock).mockResolvedValue(mockDefaultSettings);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default settings', () => {
    const state = useTestSettingsStore.getState();

    // Verify initial state
    expect(state.settings).toEqual(mockDefaultSettings);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should load settings from storage on initialization', async () => {
    // Set up mock storage to return custom settings
    (getSettings as jest.Mock).mockResolvedValue(mockCustomSettings);

    // Create a new store instance
    const useNewTestStore = create(settingsStore);
    const state = useNewTestStore.getState();

    // Wait for initialization to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    // Verify settings were loaded from storage
    expect(getSettings).toHaveBeenCalled();
    expect(state.settings).toEqual(mockCustomSettings);
  });

  it('should save settings to storage when updated', () => {
    const state = useTestSettingsStore.getState();

    // Update a setting
    state.updateSettings({
      workDuration: 30,
      soundEnabled: false
    });

    // Verify settings were updated in state
    expect(state.settings.workDuration).toBe(30);
    expect(state.settings.soundEnabled).toBe(false);
    expect(state.settings.mode).toBe('classic'); // Unchanged setting should remain

    // Verify saveSettings was called with updated settings
    expect(saveSettings).toHaveBeenCalledWith(expect.objectContaining({
      ...mockDefaultSettings,
      workDuration: 30,
      soundEnabled: false
    }));
  });

  it('should validate settings before saving', () => {
    const state = useTestSettingsStore.getState();
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Try to set invalid values
    state.updateSettings({
      workDuration: -5, // Negative duration
      shortBreakDuration: 61, // More than 60 minutes
      longBreakInterval: 0 // Zero interval
    });

    // Verify invalid values were rejected
    expect(state.settings.workDuration).toBe(25); // Remained default
    expect(state.settings.shortBreakDuration).toBe(5); // Remained default
    expect(state.settings.longBreakInterval).toBe(4); // Remained default

    // Verify warnings were logged
    expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
    consoleWarnSpy.mockRestore();
  });

  it('should reset to default settings', () => {
    const state = useTestSettingsStore.getState();

    // First update some settings
    state.updateSettings(mockCustomSettings);
    expect(state.settings.mode).toBe('smart');
    expect(state.settings.theme).toBe('dark');

    // Reset to defaults
    state.resetToDefaults();

    // Verify settings were reset
    expect(state.settings).toEqual(mockDefaultSettings);
    expect(saveSettings).toHaveBeenCalledWith(mockDefaultSettings);
  });

  it('should handle errors when loading settings', async () => {
    const testError = new Error('Failed to load settings');
    (getSettings as jest.Mock).mockRejectedValue(testError);

    // Create a new store instance
    const useNewTestStore = create(settingsStore);
    const state = useNewTestStore.getState();

    // Wait for initialization to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    // Verify error state
    expect(state.error).toBe(testError.message);
    expect(state.settings).toEqual(mockDefaultSettings); // Should fall back to defaults
  });

  it('should handle errors when saving settings', () => {
    const state = useTestSettingsStore.getState();
    const testError = new Error('Failed to save settings');
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock saveSettings to throw an error
    (saveSettings as jest.Mock).mockRejectedValue(testError);

    // Try to update settings
    state.updateSettings({
      workDuration: 30
    });

    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save settings:', testError);
    consoleErrorSpy.mockRestore();
  });

  it('should update theme settings', () => {
    const state = useTestSettingsStore.getState();

    // Update theme settings
    state.updateThemeSettings({
      theme: 'dark',
      accentColor: '#ff5722',
      fontSize: 'small'
    });

    // Verify theme settings were updated
    expect(state.settings.theme).toBe('dark');
    expect(state.settings.accentColor).toBe('#ff5722');
    expect(state.settings.fontSize).toBe('small');
    expect(saveSettings).toHaveBeenCalled();
  });

  it('should update notification settings', () => {
    const state = useTestSettingsStore.getState();

    // Update notification settings
    state.updateNotificationSettings({
      soundEnabled: false,
      notificationsEnabled: false
    });

    // Verify notification settings were updated
    expect(state.settings.soundEnabled).toBe(false);
    expect(state.settings.notificationsEnabled).toBe(false);
    expect(saveSettings).toHaveBeenCalled();
  });
})