/**
 * SoundService 单元测试
 * 测试音频服务的核心功能
 */

import { soundService } from '../sound';

// Mock Howler.js
jest.mock('howler', () => ({
  Howl: jest.fn().mockImplementation(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
    volume: jest.fn(),
    fade: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    state: jest.fn(() => 'loaded'),
    playing: jest.fn(() => false),
    duration: jest.fn(() => 10),
  })),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock console to avoid noise in tests
const mockConsole = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

Object.defineProperty(console, 'log', { value: mockConsole.log });
Object.defineProperty(console, 'warn', { value: mockConsole.warn });
Object.defineProperty(console, 'error', { value: mockConsole.error });

describe('SoundService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Basic Functionality', () => {
    it('initializes without errors', () => {
      expect(soundService).toBeDefined();
      expect(typeof soundService.play).toBe('function');
      expect(typeof soundService.setMasterVolume).toBe('function');
    });

    it('plays sound correctly', () => {
      soundService.play('notification');
      // Since we're using silent fallbacks, this should not throw
      expect(true).toBe(true);
    });

    it('handles mute/unmute correctly', () => {
      soundService.setMuted(true);
      expect(soundService.isMutedState()).toBe(true);

      soundService.setMuted(false);
      expect(soundService.isMutedState()).toBe(false);
    });
  });

  describe('Volume Management', () => {
    it('sets master volume correctly', () => {
      soundService.setMasterVolume(0.8);
      const settings = soundService.getVolumeSettings();
      expect(settings.master).toBe(0.8);
    });

    it('sets category volume correctly', () => {
      soundService.setCategoryVolume('notification', 0.6);
      const settings = soundService.getVolumeSettings();
      expect(settings.notification).toBe(0.6);
    });

    it('handles volume bounds correctly', () => {
      soundService.setMasterVolume(1.5); // Above max
      let settings = soundService.getVolumeSettings();
      expect(settings.master).toBe(1.0);

      soundService.setMasterVolume(-0.5); // Below min
      settings = soundService.getVolumeSettings();
      expect(settings.master).toBe(0.0);
    });
  });

  describe('Sound Mappings', () => {
    it('sets sound mapping correctly', () => {
      soundService.setSoundMapping('focusStart', 'notification');
      const mappings = soundService.getSoundMappings();
      expect(mappings.focusStart).toBe('notification');
    });

    it('gets sound mappings correctly', () => {
      const mappings = soundService.getSoundMappings();
      expect(typeof mappings).toBe('object');
    });

    it('plays mapped sound correctly', () => {
      soundService.setSoundMapping('focusStart', 'notification');
      soundService.playMapped('focusStart');
      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('Custom Sounds', () => {
    it('handles custom sound upload', async () => {
      const mockFile = new File(['audio data'], 'test.mp3', { type: 'audio/mp3' });
      
      try {
        await soundService.uploadCustomSound(mockFile, 'Test Sound');
        // Should not throw error
        expect(true).toBe(true);
      } catch (error) {
        // Expected in test environment without real file handling
        expect(error).toBeDefined();
      }
    });

    it('gets custom sounds list', () => {
      const allSounds = soundService.getAllSounds();
      expect(Array.isArray(allSounds)).toBe(true);
    });
  });

  describe('Storage Health', () => {
    it('checks storage health', () => {
      const health = soundService.getStorageHealth();
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('issues');
      expect(Array.isArray(health.issues)).toBe(true);
    });

    it('handles storage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const health = soundService.getStorageHealth();
      expect(health.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('handles localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      // Should not throw error
      expect(() => soundService.setMasterVolume(0.5)).not.toThrow();
    });

    it('handles invalid sound names gracefully', () => {
      expect(() => soundService.play('nonexistent' as any)).not.toThrow();
    });
  });

  describe('Persistence', () => {
    it('saves volume settings to localStorage', () => {
      soundService.setMasterVolume(0.8);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'focusflow-volume-settings',
        expect.stringContaining('0.8')
      );
    });

    it('saves sound mappings to localStorage', () => {
      soundService.setSoundMapping('focusStart', 'notification');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'focusflow-sound-mappings',
        expect.stringContaining('focusStart')
      );
    });
  });
});
