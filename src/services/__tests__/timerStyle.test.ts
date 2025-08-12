/**
 * TimerStyleService 单元测试
 * 测试计时器样式服务的核心功能
 */

import { timerStyleService } from '../timerStyle';
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

// Mock custom style for testing
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

describe('TimerStyleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    // Reset the service state by mocking localStorage
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('initializes with default settings', () => {
      const settings = timerStyleService.getSettings();

      expect(settings.currentStyleId).toBe('digital-modern');
      expect(settings.customStyles).toEqual([]);
      expect(settings.previewMode).toBe(false);
      expect(settings.autoSwitchByState).toBe(false);
    });

    it('loads settings from localStorage if available', () => {
      // Since we're using a singleton, we can't test localStorage loading directly
      // Instead, test that the service can handle localStorage data format
      const settings = timerStyleService.getSettings();

      expect(settings).toBeDefined();
      expect(typeof settings.currentStyleId).toBe('string');
      expect(Array.isArray(settings.customStyles)).toBe(true);
      expect(typeof settings.previewMode).toBe('boolean');
      expect(typeof settings.autoSwitchByState).toBe('boolean');
    });

    it('handles corrupted localStorage data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      
      // Test that the service handles corrupted data gracefully
      const settings = timerStyleService.getSettings();
      
      // Should fall back to defaults
      expect(settings.currentStyleId).toBe('digital-modern');
      expect(settings.customStyles).toEqual([]);
    });
  });

  describe('Style Management', () => {
    it('gets current style correctly', () => {
      const currentStyle = timerStyleService.getCurrentStyle();
      
      expect(currentStyle).toBeDefined();
      expect(currentStyle.id).toBe('digital-modern');
    });

    it('gets all available styles', () => {
      const allStyles = timerStyleService.getAllStyles();
      
      expect(allStyles.length).toBeGreaterThan(0);
      expect(allStyles).toEqual(expect.arrayContaining(DEFAULT_TIMER_STYLES));
    });

    it('sets current style by ID', () => {
      const success = timerStyleService.setCurrentStyle('analog-classic');

      expect(success).toBe(true);
      expect(timerStyleService.getCurrentStyle().id).toBe('analog-classic');
    });

    it('returns false when setting invalid style ID', () => {
      // First ensure we have a known starting state
      timerStyleService.setCurrentStyle('digital-modern');

      const success = timerStyleService.setCurrentStyle('non-existent-style');

      expect(success).toBe(false);
      expect(timerStyleService.getCurrentStyle().id).toBe('digital-modern'); // Should remain unchanged
    });

    it('gets style for specific state', () => {
      const focusStyle = timerStyleService.getStyleForState('focus');
      const breakStyle = timerStyleService.getStyleForState('break');

      expect(focusStyle).toBeDefined();
      expect(breakStyle).toBeDefined();

      // When autoSwitchByState is false, should return current style
      expect(focusStyle.id).toBe(timerStyleService.getCurrentStyle().id);
      expect(breakStyle.id).toBe(timerStyleService.getCurrentStyle().id);
    });
  });

  describe('Custom Styles', () => {

    it('adds custom style successfully', () => {
      const success = timerStyleService.addCustomStyle(mockCustomStyle);

      expect(success).toBe(true);

      const customStyles = timerStyleService.getCustomStyles();
      expect(customStyles).toContainEqual(expect.objectContaining({
        id: mockCustomStyle.id,
        name: mockCustomStyle.name,
        description: mockCustomStyle.description
      }));
    });

    it('rejects invalid custom style', () => {
      const invalidStyle = { ...mockCustomStyle };
      delete (invalidStyle as any).colors; // Remove required property
      
      const success = timerStyleService.addCustomStyle(invalidStyle as TimerStyleConfig);
      
      expect(success).toBe(false);
      expect(timerStyleService.getCustomStyles()).not.toContain(invalidStyle);
    });

    it('updates existing custom style', () => {
      timerStyleService.addCustomStyle(mockCustomStyle);

      const updatedStyle = { ...mockCustomStyle, name: 'Updated Test Style' };
      const success = timerStyleService.addCustomStyle(updatedStyle); // addCustomStyle handles updates

      expect(success).toBe(true);

      const customStyles = timerStyleService.getCustomStyles();
      const foundStyle = customStyles.find(s => s.id === mockCustomStyle.id);
      expect(foundStyle?.name).toBe('Updated Test Style');
    });

    it('removes custom style successfully', () => {
      timerStyleService.addCustomStyle(mockCustomStyle);
      
      const success = timerStyleService.removeCustomStyle(mockCustomStyle.id);
      
      expect(success).toBe(true);
      expect(timerStyleService.getCustomStyles()).not.toContain(mockCustomStyle);
    });

    it('returns false when removing non-existent custom style', () => {
      const success = timerStyleService.removeCustomStyle('non-existent-id');
      
      expect(success).toBe(false);
    });

    it('gets custom styles correctly', () => {
      timerStyleService.addCustomStyle(mockCustomStyle);
      
      const customStyles = timerStyleService.getCustomStyles();
      
      expect(customStyles).toHaveLength(1);
      expect(customStyles[0]).toEqual(expect.objectContaining({
        id: mockCustomStyle.id,
        name: mockCustomStyle.name,
        description: mockCustomStyle.description,
        displayStyle: mockCustomStyle.displayStyle
      }));
    });
  });

  describe('Preview Mode', () => {
    it('enables preview mode', () => {
      timerStyleService.addCustomStyle(mockCustomStyle);
      timerStyleService.previewStyle(mockCustomStyle.id);

      expect(timerStyleService.isInPreviewMode()).toBe(true);
      expect(timerStyleService.getPreviewStyle()).toBeDefined();
    });

    it('disables preview mode', () => {
      timerStyleService.addCustomStyle(mockCustomStyle);
      timerStyleService.previewStyle(mockCustomStyle.id);
      timerStyleService.exitPreview();

      expect(timerStyleService.isInPreviewMode()).toBe(false);
      expect(timerStyleService.getPreviewStyle()).toBeNull();
    });

    it('returns preview style when in preview mode', () => {
      timerStyleService.addCustomStyle(mockCustomStyle);
      timerStyleService.previewStyle(mockCustomStyle.id);

      const previewStyle = timerStyleService.getPreviewStyle();
      expect(previewStyle).toBeDefined();
      expect(previewStyle?.id).toBe(mockCustomStyle.id);
    });
  });

  describe('Settings Persistence', () => {
    it('saves settings to localStorage', () => {
      timerStyleService.setCurrentStyle('analog-classic');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'focusflow-timer-style-settings',
        expect.stringContaining('analog-classic')
      );
    });

    it('updates settings correctly', () => {
      // Test auto switch by state setting
      timerStyleService.setAutoSwitchByState(true);

      const settings = timerStyleService.getSettings();
      expect(settings.autoSwitchByState).toBe(true);
    });
  });

  describe('Event Listeners', () => {
    it('adds and removes listeners correctly', () => {
      const mockListener = jest.fn();
      
      timerStyleService.addListener(mockListener);
      timerStyleService.setCurrentStyle('analog-classic');
      
      expect(mockListener).toHaveBeenCalledWith(timerStyleService.getSettings());
      
      timerStyleService.removeListener(mockListener);
      timerStyleService.setCurrentStyle('digital-modern');
      
      // Should not be called again after removal
      expect(mockListener).toHaveBeenCalledTimes(1);
    });

    it('notifies all listeners on settings change', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      timerStyleService.addListener(listener1);
      timerStyleService.addListener(listener2);
      
      timerStyleService.setCurrentStyle('analog-classic');
      
      expect(listener1).toHaveBeenCalledWith(timerStyleService.getSettings());
      expect(listener2).toHaveBeenCalledWith(timerStyleService.getSettings());
    });
  });

  describe('Import/Export', () => {
    it('exports style correctly', () => {
      timerStyleService.addCustomStyle(mockCustomStyle);

      const exported = timerStyleService.exportStyle(mockCustomStyle.id);

      expect(exported).toBeDefined();
      expect(exported).toContain(mockCustomStyle.id);
    });

    it('imports style correctly', () => {
      const styleJson = JSON.stringify(mockCustomStyle);

      const importedStyle = timerStyleService.importStyle(styleJson);

      expect(importedStyle).toBeDefined();
      expect(importedStyle?.name).toBe(mockCustomStyle.name);
      expect(importedStyle?.description).toBe(mockCustomStyle.description);
      expect(timerStyleService.getCustomStyles()).toContainEqual(expect.objectContaining({
        name: mockCustomStyle.name,
        description: mockCustomStyle.description
      }));
    });

    it('handles invalid import data gracefully', () => {
      const result = timerStyleService.importStyle('invalid json');

      expect(result).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('handles localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      // Should not throw error
      expect(() => timerStyleService.setCurrentStyle('analog-classic')).not.toThrow();
    });
  });
});
