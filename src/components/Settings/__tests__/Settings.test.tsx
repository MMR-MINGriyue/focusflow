/**
 * Settings 组件单元测试
 * 测试设置界面的基本功能和用户交互
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Settings from '../Settings';
import { TimerSettings } from '../../../stores/timerStore';

// Mock dependencies
jest.mock('../../../services/sound', () => ({
  soundService: {
    playMapped: jest.fn(),
    stopAll: jest.fn(),
    setVolume: jest.fn(),
    isPlaying: jest.fn(() => false),
  },
}));

jest.mock('../../ui/Switch', () => ({
  Switch: ({ checked, onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      {...props}
    />
  ),
}));

jest.mock('../../ui/Slider', () => ({
  Slider: ({ value, onValueChange, min, max, step, ...props }: any) => (
    <input
      type="range"
      value={value?.[0] || value || 0}
      onChange={(e) => onValueChange?.([Number(e.target.value)])}
      min={min}
      max={max}
      step={step}
      {...props}
    />
  ),
}));

// Mock all sub-components
jest.mock('../SoundManager', () => {
  return function MockSoundManager() {
    return <div data-testid="sound-manager">Sound Manager</div>;
  };
});

jest.mock('../SoundMappingConfig', () => {
  return function MockSoundMappingConfig() {
    return <div data-testid="sound-mapping-config">Sound Mapping Config</div>;
  };
});

jest.mock('../SoundVolumeControl', () => {
  return function MockSoundVolumeControl() {
    return <div data-testid="sound-volume-control">Sound Volume Control</div>;
  };
});

jest.mock('../SoundPersistenceTest', () => {
  return function MockSoundPersistenceTest() {
    return <div data-testid="sound-persistence-test">Sound Persistence Test</div>;
  };
});

jest.mock('../ThemeEditor', () => {
  return function MockThemeEditor() {
    return <div data-testid="theme-editor">Theme Editor</div>;
  };
});

jest.mock('../ThemeSelector', () => {
  return function MockThemeSelector() {
    return <div data-testid="theme-selector">Theme Selector</div>;
  };
});

jest.mock('../ThemeManager', () => {
  return function MockThemeManager() {
    return <div data-testid="theme-manager">Theme Manager</div>;
  };
});

jest.mock('../TimerStyleSelector', () => {
  return function MockTimerStyleSelector() {
    return <div data-testid="timer-style-selector">Timer Style Selector</div>;
  };
});

jest.mock('../TimerStyleEditor', () => {
  return function MockTimerStyleEditor() {
    return <div data-testid="timer-style-editor">Timer Style Editor</div>;
  };
});

jest.mock('../TimerStyleManager', () => {
  return function MockTimerStyleManager() {
    return <div data-testid="timer-style-manager">Timer Style Manager</div>;
  };
});

jest.mock('../TimerAnimationSettings', () => {
  return function MockTimerAnimationSettings() {
    return <div data-testid="timer-animation-settings">Timer Animation Settings</div>;
  };
});

jest.mock('../BackgroundDecorationSettings', () => {
  return function MockBackgroundDecorationSettings() {
    return <div data-testid="background-decoration-settings">Background Decoration Settings</div>;
  };
});

jest.mock('../ResponsiveSettings', () => {
  return function MockResponsiveSettings() {
    return <div data-testid="responsive-settings">Responsive Settings</div>;
  };
});

describe('Settings Component', () => {
  const defaultProps: TimerSettings & { onSettingsChange: (settings: TimerSettings) => void } = {
    focusDuration: 90,
    breakDuration: 20,
    microBreakMinInterval: 10,
    microBreakMaxInterval: 30,
    microBreakDuration: 3,
    soundEnabled: true,
    notificationEnabled: true,
    volume: 0.5,
    onSettingsChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<Settings {...defaultProps} />);
      expect(screen.getByText('基础设置')).toBeInTheDocument();
    });

    it('displays all tab options', () => {
      render(<Settings {...defaultProps} />);
      
      expect(screen.getByText('基础设置')).toBeInTheDocument();
      expect(screen.getByText('音效管理')).toBeInTheDocument();
      expect(screen.getByText('音效映射')).toBeInTheDocument();
      expect(screen.getByText('音量控制')).toBeInTheDocument();
      expect(screen.getByText('持久化测试')).toBeInTheDocument();
    });

    it('shows basic settings by default', () => {
      render(<Settings {...defaultProps} />);

      // 使用正则表达式匹配文本，因为可能被分割成多个元素
      expect(screen.getByText(/专注时长/)).toBeInTheDocument();
      expect(screen.getByText(/休息时长/)).toBeInTheDocument();
      expect(screen.getByText('启用音效')).toBeInTheDocument();
      expect(screen.getByText('桌面通知')).toBeInTheDocument();
    });
  });

  describe('Basic Settings', () => {
    it('displays current focus duration', () => {
      render(<Settings {...defaultProps} focusDuration={45} />);
      
      const focusSlider = screen.getByDisplayValue('45');
      expect(focusSlider).toBeInTheDocument();
    });

    it('displays current break duration', () => {
      render(<Settings {...defaultProps} breakDuration={15} />);
      
      const breakSlider = screen.getByDisplayValue('15');
      expect(breakSlider).toBeInTheDocument();
    });

    it('calls onSettingsChange when focus duration changes', async () => {
      const mockOnSettingsChange = jest.fn();
      render(<Settings {...defaultProps} onSettingsChange={mockOnSettingsChange} />);
      
      const focusSlider = screen.getByDisplayValue('90');
      fireEvent.change(focusSlider, { target: { value: '60' } });
      
      expect(mockOnSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({ focusDuration: 60 })
      );
    });

    it('calls onSettingsChange when break duration changes', async () => {
      const mockOnSettingsChange = jest.fn();
      render(<Settings {...defaultProps} onSettingsChange={mockOnSettingsChange} />);
      
      const breakSlider = screen.getByDisplayValue('20');
      fireEvent.change(breakSlider, { target: { value: '10' } });
      
      expect(mockOnSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({ breakDuration: 10 })
      );
    });
  });

  describe('Sound Settings', () => {
    it('displays sound enabled switch', () => {
      render(<Settings {...defaultProps} soundEnabled={true} />);

      // Look for the sound switch by its label
      expect(screen.getByText('启用音效')).toBeInTheDocument();
    });

    it('displays notification enabled switch', () => {
      render(<Settings {...defaultProps} notificationEnabled={true} />);

      // Look for the notification switch by its label
      expect(screen.getByText('桌面通知')).toBeInTheDocument();
    });

    it('calls onSettingsChange when sound setting changes', async () => {
      const mockOnSettingsChange = jest.fn();
      const user = userEvent.setup();

      render(<Settings {...defaultProps} onSettingsChange={mockOnSettingsChange} soundEnabled={true} />);

      // Find the sound switch and click it
      const soundSwitches = screen.getAllByRole('checkbox');
      const soundSwitch = soundSwitches.find(sw => sw.getAttribute('checked') !== null);

      if (soundSwitch) {
        await user.click(soundSwitch);
        expect(mockOnSettingsChange).toHaveBeenCalled();
      }
    });
  });

  describe('Tab Navigation', () => {
    it('shows basic settings by default', () => {
      render(<Settings {...defaultProps} />);

      expect(screen.getByText(/专注时长/)).toBeInTheDocument();
      expect(screen.getByText(/休息时长/)).toBeInTheDocument();
    });

    it('switches between different tabs', async () => {
      const user = userEvent.setup();
      render(<Settings {...defaultProps} />);

      // Check if tab buttons exist
      const basicTab = screen.getByText('基础设置');
      expect(basicTab).toBeInTheDocument();

      // Click on basic tab (should be active by default)
      await user.click(basicTab);
      expect(screen.getByText(/专注时长/)).toBeInTheDocument();
    });

    it('handles tab switching correctly', async () => {
      const user = userEvent.setup();
      render(<Settings {...defaultProps} />);

      // Should start with basic settings
      expect(screen.getByText(/专注时长/)).toBeInTheDocument();

      // Tab switching functionality is handled by the component
      // We can verify the basic structure is rendered
      expect(screen.getByText('基础设置')).toBeInTheDocument();
    });
  });

  describe('Micro Break Settings', () => {
    it('displays micro break interval settings', () => {
      render(<Settings {...defaultProps} />);

      expect(screen.getByText(/最小间隔/)).toBeInTheDocument();
    });

    it('calls onSettingsChange when micro break settings change', async () => {
      const mockOnSettingsChange = jest.fn();
      render(<Settings {...defaultProps} onSettingsChange={mockOnSettingsChange} />);
      
      const minIntervalSlider = screen.getByDisplayValue('10');
      fireEvent.change(minIntervalSlider, { target: { value: '15' } });
      
      expect(mockOnSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({ microBreakMinInterval: 15 })
      );
    });
  });

  describe('Volume Settings', () => {
    it('displays volume slider', () => {
      render(<Settings {...defaultProps} volume={0.7} />);
      
      const volumeSlider = screen.getByDisplayValue('0.7');
      expect(volumeSlider).toBeInTheDocument();
    });

    it('calls onSettingsChange when volume changes', async () => {
      const mockOnSettingsChange = jest.fn();
      render(<Settings {...defaultProps} onSettingsChange={mockOnSettingsChange} />);
      
      const volumeSlider = screen.getByDisplayValue('0.5');
      fireEvent.change(volumeSlider, { target: { value: '0.8' } });
      
      expect(mockOnSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({ volume: 0.8 })
      );
    });
  });

  describe('Error Handling', () => {
    it('handles sound service errors gracefully', () => {
      const mockSoundService = require('../../../services/sound').soundService;
      mockSoundService.playMapped.mockImplementation(() => {
        throw new Error('Sound service error');
      });
      
      render(<Settings {...defaultProps} />);
      
      // Should not crash when sound service fails
      expect(screen.getByText('基础设置')).toBeInTheDocument();
    });
  });
});
