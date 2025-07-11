/**
 * TimerStyleService 单元测试
 * 测试计时器样式服务的核心功能
 */

import { TimerStyleService } from '../timerStyle';
import { TimerStyleConfig, TimerStyleSettings, DEFAULT_TIMER_STYLES } from '../../types/timerStyle';

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

describe('TimerStyleService', () => {
  let service: TimerStyleService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    service = new TimerStyleService();
  });

  describe('Initialization', () => {
    it('initializes with default settings', () => {
      const settings = service.getSettings();
      
      expect(settings.currentStyleId).toBe('digital-modern');
      expect(settings.customStyles).toEqual([]);
      expect(settings.previewMode).toBe(false);
      expect(settings.autoSwitchByState).toBe(false);
    });

    it('loads settings from localStorage if available', () => {
      const savedSettings: TimerStyleSettings = {
        currentStyleId: 'analog-classic',
        customStyles: [],
        previewMode: true,
        autoSwitchByState: true,
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedSettings));
      
      const newService = new TimerStyleService();
      const settings = newService.getSettings();
      
      expect(settings.currentStyleId).toBe('analog-classic');
      expect(settings.previewMode).toBe(true);
      expect(settings.autoSwitchByState).toBe(true);
    });

    it('handles corrupted localStorage data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      
      const newService = new TimerStyleService();
      const settings = newService.getSettings();
      
      // Should fall back to defaults
      expect(settings.currentStyleId).toBe('digital-modern');
      expect(settings.customStyles).toEqual([]);
    });
  });

  describe('Style Management', () => {
    it('gets current style correctly', () => {
      const currentStyle = service.getCurrentStyle();
      
      expect(currentStyle).toBeDefined();
      expect(currentStyle.id).toBe('digital-modern');
    });

    it('gets all available styles', () => {
      const allStyles = service.getAllStyles();
      
      expect(allStyles.length).toBeGreaterThan(0);
      expect(allStyles).toEqual(expect.arrayContaining(DEFAULT_TIMER_STYLES));
    });

    it('sets current style by ID', () => {
      const success = service.setCurrentStyle('analog-classic');
      
      expect(success).toBe(true);
      expect(service.getCurrentStyle().id).toBe('analog-classic');
    });

    it('returns false when setting invalid style ID', () => {
      const success = service.setCurrentStyle('non-existent-style');
      
      expect(success).toBe(false);
      expect(service.getCurrentStyle().id).toBe('digital-modern'); // Should remain unchanged
    });

    it('gets style for specific state', () => {
      const focusStyle = service.getStyleForState('focus');
      const breakStyle = service.getStyleForState('break');
      
      expect(focusStyle).toBeDefined();
      expect(breakStyle).toBeDefined();
      
      // When autoSwitchByState is false, should return current style
      expect(focusStyle.id).toBe(service.getCurrentStyle().id);
      expect(breakStyle.id).toBe(service.getCurrentStyle().id);
    });
  });

  describe('Custom Styles', () => {
    const mockCustomStyle: TimerStyleConfig = {
      id: 'custom-test',
      name: 'Test Custom Style',
      description: 'A test custom style',
      displayStyle: 'digital',
      colors: {
        primary: '#ff0000',
        secondary: '#00ff00',
        background: '#0000ff',
        text: '#ffffff',
        accent: '#ffff00',
        progress: '#ff00ff',
        progressBackground: '#00ffff',
      },
      layout: {
        alignment: 'center',
        spacing: 'normal',
        showStatusIndicator: true,
        showProgressPercentage: true,
        showStateText: true,
      },
      animations: {
        enabled: true,
        transitionDuration: 300,
        easing: 'ease-in-out',
        pulseOnStateChange: true,
        breathingEffect: false,
        rotationEffect: false,
      },
      size: 'large',
      numberStyle: 'standard',
      progressStyle: 'linear',
      particles: {
        enabled: false,
        count: 0,
        speed: 1,
        size: 2,
        color: '#ffffff',
      },
      background: {
        pattern: 'none',
        opacity: 0.1,
        color: '#000000',
      },
    };

    it('adds custom style successfully', () => {
      const success = service.addCustomStyle(mockCustomStyle);
      
      expect(success).toBe(true);
      
      const customStyles = service.getCustomStyles();
      expect(customStyles).toContain(mockCustomStyle);
    });

    it('rejects invalid custom style', () => {
      const invalidStyle = { ...mockCustomStyle };
      delete (invalidStyle as any).colors; // Remove required property
      
      const success = service.addCustomStyle(invalidStyle as TimerStyleConfig);
      
      expect(success).toBe(false);
      expect(service.getCustomStyles()).not.toContain(invalidStyle);
    });

    it('updates existing custom style', () => {
      service.addCustomStyle(mockCustomStyle);
      
      const updatedStyle = { ...mockCustomStyle, name: 'Updated Test Style' };
      const success = service.updateCustomStyle(updatedStyle);
      
      expect(success).toBe(true);
      
      const customStyles = service.getCustomStyles();
      const foundStyle = customStyles.find(s => s.id === mockCustomStyle.id);
      expect(foundStyle?.name).toBe('Updated Test Style');
    });

    it('removes custom style successfully', () => {
      service.addCustomStyle(mockCustomStyle);
      
      const success = service.removeCustomStyle(mockCustomStyle.id);
      
      expect(success).toBe(true);
      expect(service.getCustomStyles()).not.toContain(mockCustomStyle);
    });

    it('returns false when removing non-existent custom style', () => {
      const success = service.removeCustomStyle('non-existent-id');
      
      expect(success).toBe(false);
    });

    it('gets custom styles correctly', () => {
      service.addCustomStyle(mockCustomStyle);
      
      const customStyles = service.getCustomStyles();
      
      expect(customStyles).toHaveLength(1);
      expect(customStyles[0]).toEqual(mockCustomStyle);
    });
  });

  describe('Preview Mode', () => {
    it('enables preview mode', () => {
      service.enablePreview(mockCustomStyle);
      
      expect(service.getSettings().previewMode).toBe(true);
      expect(service.getPreviewStyle()).toEqual(mockCustomStyle);
    });

    it('disables preview mode', () => {
      service.enablePreview(mockCustomStyle);
      service.disablePreview();
      
      expect(service.getSettings().previewMode).toBe(false);
      expect(service.getPreviewStyle()).toBeNull();
    });

    it('returns preview style when in preview mode', () => {
      service.enablePreview(mockCustomStyle);
      
      const currentStyle = service.getCurrentStyle();
      expect(currentStyle).toEqual(mockCustomStyle);
    });
  });

  describe('Settings Persistence', () => {
    it('saves settings to localStorage', () => {
      service.setCurrentStyle('analog-classic');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'timerStyleSettings',
        expect.stringContaining('analog-classic')
      );
    });

    it('updates settings correctly', () => {
      const newSettings: Partial<TimerStyleSettings> = {
        autoSwitchByState: true,
        previewMode: true,
      };
      
      service.updateSettings(newSettings);
      
      const settings = service.getSettings();
      expect(settings.autoSwitchByState).toBe(true);
      expect(settings.previewMode).toBe(true);
    });
  });

  describe('Event Listeners', () => {
    it('adds and removes listeners correctly', () => {
      const mockListener = jest.fn();
      
      service.addListener(mockListener);
      service.setCurrentStyle('analog-classic');
      
      expect(mockListener).toHaveBeenCalledWith(service.getSettings());
      
      service.removeListener(mockListener);
      service.setCurrentStyle('digital-modern');
      
      // Should not be called again after removal
      expect(mockListener).toHaveBeenCalledTimes(1);
    });

    it('notifies all listeners on settings change', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      service.addListener(listener1);
      service.addListener(listener2);
      
      service.setCurrentStyle('analog-classic');
      
      expect(listener1).toHaveBeenCalledWith(service.getSettings());
      expect(listener2).toHaveBeenCalledWith(service.getSettings());
    });
  });

  describe('Import/Export', () => {
    it('exports settings correctly', () => {
      service.addCustomStyle(mockCustomStyle);
      service.setCurrentStyle('analog-classic');
      
      const exported = service.exportSettings();
      
      expect(exported).toContain('analog-classic');
      expect(exported).toContain(mockCustomStyle.id);
    });

    it('imports settings correctly', () => {
      const settingsToImport: TimerStyleSettings = {
        currentStyleId: 'analog-classic',
        customStyles: [mockCustomStyle],
        previewMode: false,
        autoSwitchByState: true,
      };
      
      const success = service.importSettings(JSON.stringify(settingsToImport));
      
      expect(success).toBe(true);
      expect(service.getCurrentStyle().id).toBe('analog-classic');
      expect(service.getCustomStyles()).toContain(mockCustomStyle);
    });

    it('handles invalid import data gracefully', () => {
      const success = service.importSettings('invalid json');
      
      expect(success).toBe(false);
      // Settings should remain unchanged
      expect(service.getCurrentStyle().id).toBe('digital-modern');
    });
  });

  describe('Error Handling', () => {
    it('handles localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      // Should not throw error
      expect(() => service.setCurrentStyle('analog-classic')).not.toThrow();
    });
  });
});
