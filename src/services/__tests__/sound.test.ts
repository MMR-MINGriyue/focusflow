/**
 * SoundService 单元测试
 * 测试音效服务的核心功能
 */

import { SoundService } from '../sound';
import { CustomSound, VolumeSettings } from '../sound';

// Mock Howler
jest.mock('howler', () => ({
  Howl: jest.fn().mockImplementation(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
    volume: jest.fn(),
    fade: jest.fn(),
    playing: jest.fn(() => false),
    duration: jest.fn(() => 10),
    load: jest.fn(),
    unload: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  })),
}));

// Mock environment utils
jest.mock('../../utils/environment', () => ({
  safeConsole: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  isTauriEnvironment: jest.fn(() => false),
}));

// Mock audio diagnostics
jest.mock('../../utils/audioTest', () => ({
  runAudioDiagnostics: jest.fn(),
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

describe('SoundService', () => {
  let soundService: SoundService;
  const mockHowl = require('howler').Howl;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    soundService = new SoundService();
  });

  describe('Initialization', () => {
    it('initializes with default sounds', () => {
      expect(mockHowl).toHaveBeenCalled();
    });

    it('loads custom sounds from localStorage', () => {
      const customSounds: CustomSound[] = [
        {
          id: 'custom-1',
          name: 'Custom Sound',
          file: 'custom.mp3',
          type: 'custom',
          category: 'notification',
        },
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(customSounds));
      
      const newService = new SoundService();
      expect(newService.getCustomSounds()).toEqual(customSounds);
    });

    it('handles corrupted localStorage data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      
      expect(() => new SoundService()).not.toThrow();
    });
  });

  describe('Sound Playback', () => {
    it('plays sound by ID', () => {
      const mockSound = {
        play: jest.fn(),
        volume: jest.fn(),
      };
      soundService['sounds']['test-sound'] = mockSound as any;

      soundService.play('test-sound');

      expect(mockSound.play).toHaveBeenCalled();
    });

    it('plays mapped sound', () => {
      const mockSound = {
        play: jest.fn(),
        volume: jest.fn(),
      };
      soundService['sounds']['notification'] = mockSound as any;
      soundService['soundMappings']['focusStart'] = 'notification';

      soundService.playMapped('focusStart');

      expect(mockSound.play).toHaveBeenCalled();
    });

    it('handles playing non-existent sound gracefully', () => {
      expect(() => soundService.play('non-existent')).not.toThrow();
    });

    it('respects mute setting', () => {
      const mockSound = {
        play: jest.fn(),
        volume: jest.fn(),
      };
      soundService['sounds']['test-sound'] = mockSound as any;

      soundService.setMuted(true);
      soundService.play('test-sound');

      expect(mockSound.play).not.toHaveBeenCalled();
    });
  });

  describe('Volume Control', () => {
    it('sets master volume', () => {
      soundService.setVolume(0.8);

      const volumeSettings = soundService.getVolumeSettings();
      expect(volumeSettings.master).toBe(0.8);
    });

    it('sets category volume', () => {
      soundService.setCategoryVolume('notification', 0.6);

      const volumeSettings = soundService.getVolumeSettings();
      expect(volumeSettings.notification).toBe(0.6);
    });

    it('clamps volume values to valid range', () => {
      soundService.setVolume(1.5); // Above max
      expect(soundService.getVolumeSettings().master).toBe(1.0);

      soundService.setVolume(-0.5); // Below min
      expect(soundService.getVolumeSettings().master).toBe(0.0);
    });

    it('updates volume settings', () => {
      const newSettings: Partial<VolumeSettings> = {
        master: 0.9,
        notification: 0.7,
        fadeInDuration: 1000,
      };

      soundService.updateVolumeSettings(newSettings);

      const settings = soundService.getVolumeSettings();
      expect(settings.master).toBe(0.9);
      expect(settings.notification).toBe(0.7);
      expect(settings.fadeInDuration).toBe(1000);
    });
  });

  describe('Custom Sounds', () => {
    const mockCustomSound: CustomSound = {
      id: 'custom-test',
      name: 'Test Custom Sound',
      file: 'test.mp3',
      type: 'custom',
      category: 'notification',
      duration: 5,
      size: 1024,
      uploadDate: '2023-01-01',
      description: 'A test sound',
    };

    it('adds custom sound', async () => {
      const success = await soundService.addCustomSound(mockCustomSound);

      expect(success).toBe(true);
      expect(soundService.getCustomSounds()).toContain(mockCustomSound);
    });

    it('removes custom sound', () => {
      soundService.addCustomSound(mockCustomSound);
      const success = soundService.removeCustomSound(mockCustomSound.id);

      expect(success).toBe(true);
      expect(soundService.getCustomSounds()).not.toContain(mockCustomSound);
    });

    it('updates custom sound', () => {
      soundService.addCustomSound(mockCustomSound);
      
      const updatedSound = { ...mockCustomSound, name: 'Updated Name' };
      const success = soundService.updateCustomSound(updatedSound);

      expect(success).toBe(true);
      
      const customSounds = soundService.getCustomSounds();
      const found = customSounds.find(s => s.id === mockCustomSound.id);
      expect(found?.name).toBe('Updated Name');
    });

    it('returns false when removing non-existent custom sound', () => {
      const success = soundService.removeCustomSound('non-existent');
      expect(success).toBe(false);
    });
  });

  describe('Sound Mappings', () => {
    it('sets sound mapping', () => {
      soundService.setSoundMapping('focusStart', 'notification');

      const mappings = soundService.getSoundMappings();
      expect(mappings.focusStart).toBe('notification');
    });

    it('gets sound mapping', () => {
      soundService.setSoundMapping('breakStart', 'chime');
      
      const mapping = soundService.getSoundMapping('breakStart');
      expect(mapping).toBe('chime');
    });

    it('returns undefined for non-existent mapping', () => {
      const mapping = soundService.getSoundMapping('non-existent');
      expect(mapping).toBeUndefined();
    });

    it('updates multiple mappings', () => {
      const newMappings = {
        focusStart: 'bell',
        breakStart: 'chime',
        microBreak: 'notification',
      };

      soundService.updateSoundMappings(newMappings);

      const mappings = soundService.getSoundMappings();
      expect(mappings.focusStart).toBe('bell');
      expect(mappings.breakStart).toBe('chime');
      expect(mappings.microBreak).toBe('notification');
    });
  });

  describe('Sound Control', () => {
    it('stops all sounds', () => {
      const mockSound1 = { stop: jest.fn() };
      const mockSound2 = { stop: jest.fn() };
      
      soundService['sounds']['sound1'] = mockSound1 as any;
      soundService['sounds']['sound2'] = mockSound2 as any;

      soundService.stopAll();

      expect(mockSound1.stop).toHaveBeenCalled();
      expect(mockSound2.stop).toHaveBeenCalled();
    });

    it('pauses all sounds', () => {
      const mockSound1 = { pause: jest.fn() };
      const mockSound2 = { pause: jest.fn() };
      
      soundService['sounds']['sound1'] = mockSound1 as any;
      soundService['sounds']['sound2'] = mockSound2 as any;

      soundService.pauseAll();

      expect(mockSound1.pause).toHaveBeenCalled();
      expect(mockSound2.pause).toHaveBeenCalled();
    });

    it('checks if any sound is playing', () => {
      const mockSound = { playing: jest.fn(() => true) };
      soundService['sounds']['test'] = mockSound as any;

      const isPlaying = soundService.isPlaying();
      expect(isPlaying).toBe(true);
    });
  });

  describe('Mute Control', () => {
    it('sets muted state', () => {
      soundService.setMuted(true);
      expect(soundService.isMuted()).toBe(true);

      soundService.setMuted(false);
      expect(soundService.isMuted()).toBe(false);
    });

    it('toggles muted state', () => {
      const initialState = soundService.isMuted();
      soundService.toggleMute();
      expect(soundService.isMuted()).toBe(!initialState);
    });
  });

  describe('Persistence', () => {
    it('saves custom sounds to localStorage', () => {
      const customSound: CustomSound = {
        id: 'test',
        name: 'Test',
        file: 'test.mp3',
        type: 'custom',
        category: 'notification',
      };

      soundService.addCustomSound(customSound);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'customSounds',
        expect.stringContaining('test')
      );
    });

    it('saves volume settings to localStorage', () => {
      soundService.setVolume(0.8);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'volumeSettings',
        expect.stringContaining('0.8')
      );
    });

    it('saves sound mappings to localStorage', () => {
      soundService.setSoundMapping('focusStart', 'bell');

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'soundMappings',
        expect.stringContaining('bell')
      );
    });
  });

  describe('Error Handling', () => {
    it('handles localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => soundService.setVolume(0.8)).not.toThrow();
    });

    it('handles sound loading errors gracefully', () => {
      const mockSound = {
        on: jest.fn((event, callback) => {
          if (event === 'loaderror') {
            callback();
          }
        }),
      };

      mockHowl.mockReturnValue(mockSound);

      expect(() => new SoundService()).not.toThrow();
    });
  });
});
