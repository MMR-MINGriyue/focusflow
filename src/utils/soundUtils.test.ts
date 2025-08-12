import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { playSound, playNotificationSound, checkNotificationPermission, requestNotificationPermission, showNotification } from './soundUtils';
import { settingsStore } from '../stores/settingsStore';

// Mock browser APIs and dependencies
const mockAudioPlay = vi.fn();
const mockAudioPause = vi.fn();
const mockNotification = vi.fn();
const mockNotificationPermission = 'default';

vi.stubGlobal('Audio', vi.fn().mockImplementation(() => ({
  play: mockAudioPlay,
  pause: mockAudioPause,
  currentTime: 0,
  volume: 1
})));

vi.stubGlobal('Notification', {
  permission: mockNotificationPermission,
  requestPermission: vi.fn().mockResolvedValue('granted'),
  constructor: mockNotification
});

// Mock the settings store
vi.mock('../stores/settingsStore', () => ({
  settingsStore: vi.fn(() => ({
    settings: {
      soundEnabled: true,
      notificationsEnabled: true
    }
  }))
}));

// Create a test store hook
const useTestSettingsStore = settingsStore;

describe('soundUtils', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    mockAudioPlay.mockReset();
    mockAudioPause.mockReset();
    mockNotification.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('playSound', () => {
    it('should play a sound when sound is enabled', () => {
      // Arrange
      const soundUrl = '/sounds/alert.mp3';
      const volume = 0.7;
      
      // Act
      playSound(soundUrl, volume);
      
      // Assert
      expect(Audio).toHaveBeenCalledWith(soundUrl);
      expect(mockAudioPlay).toHaveBeenCalled();
    });

    it('should not play a sound when sound is disabled in settings', () => {
      // Arrange
      const soundUrl = '/sounds/alert.mp3';
      const volume = 0.7;
      
      // Mock settings to disable sound
      (useTestSettingsStore as jest.Mock).mockReturnValue({
        settings: {
          soundEnabled: false,
          notificationsEnabled: true
        }
      });
      
      // Act
      playSound(soundUrl, volume);
      
      // Assert
      expect(Audio).not.toHaveBeenCalled();
      expect(mockAudioPlay).not.toHaveBeenCalled();
    });

    it('should handle errors when playing sound', () => {
      // Arrange
      const soundUrl = '/sounds/alert.mp3';
      const volume = 0.7;
      const errorMessage = 'Failed to play sound';
      
      // Make play throw an error
      mockAudioPlay.mockRejectedValue(new Error(errorMessage));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Act
      playSound(soundUrl, volume);
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error playing sound:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  describe('playNotificationSound', () => {
    it('should play the notification sound with correct parameters', () => {
      // Arrange
      const playSoundSpy = vi.spyOn(require('./soundUtils'), 'playSound');
      
      // Act
      playNotificationSound();
      
      // Assert
      expect(playSoundSpy).toHaveBeenCalledWith('/sounds/notification.mp3', 0.5);
      playSoundSpy.mockRestore();
    });
  });

  describe('checkNotificationPermission', () => {
    it('should return the current notification permission status', () => {
      // Arrange
      const expectedPermission = 'granted';
      Object.defineProperty(window.Notification, 'permission', { value: expectedPermission });
      
      // Act
      const result = checkNotificationPermission();
      
      // Assert
      expect(result).toBe(expectedPermission);
    });
  });

  describe('requestNotificationPermission', () => {
    it('should request notification permission and return the result', async () => {
      // Arrange
      const expectedPermission = 'granted';
      (Notification.requestPermission as jest.Mock).mockResolvedValue(expectedPermission);
      
      // Act
      const result = await requestNotificationPermission();
      
      // Assert
      expect(Notification.requestPermission).toHaveBeenCalled();
      expect(result).toBe(expectedPermission);
    });
  });

  describe('showNotification', () => {
    it('should show a notification when permissions are granted and notifications are enabled', async () => {
      // Arrange
      const title = 'Pomodoro Complete';
      const body = 'Time for a break!';
      Object.defineProperty(window.Notification, 'permission', { value: 'granted' });
      
      // Mock settings to enable notifications
      (useTestSettingsStore as jest.Mock).mockReturnValue({
        settings: {
          soundEnabled: true,
          notificationsEnabled: true
        }
      });
      
      // Act
      await showNotification(title, body);
      
      // Assert
      expect(mockNotification).toHaveBeenCalledWith(title, expect.objectContaining({
        body: body,
        icon: expect.any(String),
        requireInteraction: false
      }));
    });

    it('should not show a notification when notifications are disabled in settings', async () => {
      // Arrange
      const title = 'Pomodoro Complete';
      const body = 'Time for a break!';
      Object.defineProperty(window.Notification, 'permission', { value: 'granted' });
      
      // Mock settings to disable notifications
      (useTestSettingsStore as jest.Mock).mockReturnValue({
        settings: {
          soundEnabled: true,
          notificationsEnabled: false
        }
      });
      
      // Act
      await showNotification(title, body);
      
      // Assert
      expect(mockNotification).not.toHaveBeenCalled();
    });

    it('should request permission and show notification if permission is default', async () => {
      // Arrange
      const title = 'Pomodoro Complete';
      const body = 'Time for a break!';
      Object.defineProperty(window.Notification, 'permission', { value: 'default' });
      
      // Mock settings to enable notifications
      (useTestSettingsStore as jest.Mock).mockReturnValue({
        settings: {
          soundEnabled: true,
          notificationsEnabled: true
        }
      });
      
      // Act
      await showNotification(title, body);
      
      // Assert
      expect(Notification.requestPermission).toHaveBeenCalled();
      expect(mockNotification).toHaveBeenCalledWith(title, expect.objectContaining({
        body: body
      }));
    });

    it('should not show notification if permission is denied', async () => {
      // Arrange
      const title = 'Pomodoro Complete';
      const body = 'Time for a break!';
      Object.defineProperty(window.Notification, 'permission', { value: 'denied' });
      
      // Act
      await showNotification(title, body);
      
      // Assert
      expect(Notification.requestPermission).not.toHaveBeenCalled();
      expect(mockNotification).not.toHaveBeenCalled();
    });

    it('should handle notification errors gracefully', async () => {
      // Arrange
      const title = 'Pomodoro Complete';
      const body = 'Time for a break!';
      Object.defineProperty(window.Notification, 'permission', { value: 'granted' });
      mockNotification.mockImplementation(() => { throw new Error('Notification failed'); });
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Act
      await showNotification(title, body);
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to show notification:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });
})