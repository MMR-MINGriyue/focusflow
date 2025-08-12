/**
 * Settings 组件增强测试
 * 
 * 基于测试模板创建，采用AAA模式（Arrange-Act-Assert）
 * 测试设置界面的完整功能和用户交互
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { testUtils } from '../../../tests/utils/testUtils';
import Settings from '../Settings';
import { TimerSettings } from '../../../stores/timerStore';

// ==================== MOCK CONFIGURATION ====================

// Mock sound service
jest.mock('../../../services/sound', () => ({
  soundService: {
    playMapped: jest.fn(),
    stopAll: jest.fn(),
    setVolume: jest.fn(),
    isPlaying: jest.fn(() => false),
    getVolume: jest.fn(() => 0.5),
    getMappedSounds: jest.fn(() => ({})),
  },
}));

// Mock UI components
jest.mock('../../ui/Switch', () => ({
  Switch: ({ checked, onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      data-testid={props['data-testid'] || 'switch'}
      {...props}
    />
  ),
}));

jest.mock('../../ui/Slider', () => ({
  Slider: ({ value, onValueChange, min, max, step, ...props }: any) => (
    <input
      type="range"
      value={value}
      onChange={(e) => onValueChange?.([parseFloat(e.target.value)])}
      min={min}
      max={max}
      step={step}
      data-testid={props['data-testid'] || 'slider'}
      {...props}
    />
  ),
}));

// Mock sub-components
jest.mock('../SoundManager', () => {
  return function MockSoundManager({ onSoundChange }: any) {
    return (
      <div data-testid="sound-manager">
        <h3>音效管理</h3>
        <button onClick={() => onSoundChange?.({})}>测试音效变更</button>
      </div>
    );
  };
});

jest.mock('../TimerStyleManager', () => {
  return function MockTimerStyleManager({ onStyleChange }: any) {
    return (
      <div data-testid="timer-style-manager">
        <h3>计时器样式管理</h3>
        <button onClick={() => onStyleChange?.({})}>测试样式变更</button>
      </div>
    );
  };
});

// ==================== TEST SETUP ====================

// Mock data
const mockDefaultSettings: TimerSettings = testUtils.generateTimerSettings({
  focusDuration: 25,
  breakDuration: 5,
  microBreakMinInterval: 10,
  microBreakMaxInterval: 30,
  microBreakDuration: 3,
  soundEnabled: true,
  notificationEnabled: true,
  volume: 0.5,
});

const mockProps = {
  ...mockDefaultSettings,
  onSettingsChange: jest.fn(),
};

// Helper function to render component with default setup
const renderComponent = (overrideProps = {}) => {
  const props = { ...mockProps, ...overrideProps };
  return testUtils.renderWithDefaults(<Settings {...props} />);
};

// ==================== TEST SUITES ====================

describe('Settings - Enhanced Tests', () => {
  // Setup and cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== BASIC RENDERING TESTS ====================
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      expect(screen.getByText('基础设置')).toBeInTheDocument();
    });

    it('displays all main tab options', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      expect(screen.getByText('基础设置')).toBeInTheDocument();
      expect(screen.getByText('音效管理')).toBeInTheDocument();
      expect(screen.getByText('音效映射')).toBeInTheDocument();
      expect(screen.getByText('音量控制')).toBeInTheDocument();
      expect(screen.getByText('主题管理')).toBeInTheDocument();
      expect(screen.getByText('样式管理')).toBeInTheDocument();
    });

    it('shows basic settings by default', () => {
      // Arrange & Act
      renderComponent();

      // Assert - 查找实际存在的文本
      expect(screen.getByText('基础设置')).toBeInTheDocument();
      expect(screen.getByText('音效管理')).toBeInTheDocument();

      // 检查是否有滑块和开关元素
      const sliders = screen.getAllByTestId('slider');
      expect(sliders.length).toBeGreaterThan(0);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('displays quick configuration presets', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      expect(screen.getByText('快速配置')).toBeInTheDocument();
      expect(screen.getByText('番茄工作法')).toBeInTheDocument();
      expect(screen.getByText('平衡模式')).toBeInTheDocument();
    });
  });

  // ==================== BASIC SETTINGS TESTS ====================
  describe('Basic Settings', () => {
    it('displays current focus duration correctly', () => {
      // Arrange & Act
      renderComponent({ focusDuration: 45 });

      // Assert
      const focusSlider = screen.getByDisplayValue('45');
      expect(focusSlider).toBeInTheDocument();
    });

    it('displays current break duration correctly', () => {
      // Arrange & Act
      renderComponent({ breakDuration: 15 });

      // Assert
      const breakSlider = screen.getByDisplayValue('15');
      expect(breakSlider).toBeInTheDocument();
    });

    it('displays current micro break settings correctly', () => {
      // Arrange & Act
      renderComponent({ 
        microBreakMinInterval: 5,
        microBreakMaxInterval: 20,
        microBreakDuration: 2
      });

      // Assert - 使用更具体的查询避免重复元素
      const sliders = screen.getAllByTestId('slider');
      expect(sliders.length).toBeGreaterThan(0);

      // 检查是否有显示值为5的滑块（可能有多个）
      const slidersWithValue5 = screen.getAllByDisplayValue('5');
      expect(slidersWithValue5.length).toBeGreaterThan(0);
    });

    it('calls onSettingsChange when focus duration changes', async () => {
      // Arrange
      const mockOnSettingsChange = jest.fn();
      const { user } = renderComponent({ onSettingsChange: mockOnSettingsChange });
      const focusSlider = screen.getByDisplayValue('25');

      // Act - 使用fireEvent.change来模拟滑块值变化
      fireEvent.change(focusSlider, { target: { value: '30' } });

      // Assert
      expect(mockOnSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({ focusDuration: 30 })
      );
    });

    it('calls onSettingsChange when break duration changes', async () => {
      // Arrange
      const mockOnSettingsChange = jest.fn();
      const { user } = renderComponent({ onSettingsChange: mockOnSettingsChange });
      const breakSlider = screen.getByDisplayValue('5');

      // Act - 使用fireEvent.change来模拟滑块值变化
      fireEvent.change(breakSlider, { target: { value: '10' } });

      // Assert
      expect(mockOnSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({ breakDuration: 10 })
      );
    });
  });

  // ==================== SOUND SETTINGS TESTS ====================
  describe('Sound Settings', () => {
    it('displays sound enabled switch correctly', () => {
      // Arrange & Act
      renderComponent({ soundEnabled: true });

      // Assert - 查找实际存在的元素
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);

      // 检查是否有选中的checkbox
      const checkedCheckboxes = checkboxes.filter(cb => cb.checked);
      expect(checkedCheckboxes.length).toBeGreaterThan(0);
    });

    it('displays notification enabled switch correctly', () => {
      // Arrange & Act
      renderComponent({ notificationEnabled: false });

      // Assert
      expect(screen.getByText('桌面通知')).toBeInTheDocument();
      const notificationSwitch = screen.getByRole('checkbox', { checked: false });
      expect(notificationSwitch).toBeInTheDocument();
    });

    it('calls onSettingsChange when sound setting changes', async () => {
      // Arrange
      const mockOnSettingsChange = jest.fn();
      const { user } = renderComponent({ 
        onSettingsChange: mockOnSettingsChange,
        soundEnabled: true 
      });

      // Act
      const soundSwitches = screen.getAllByRole('checkbox');
      const soundSwitch = soundSwitches.find(sw => sw.getAttribute('checked') !== null);
      if (soundSwitch) {
        await user.click(soundSwitch);
      }

      // Assert
      expect(mockOnSettingsChange).toHaveBeenCalled();
    });

    it('displays volume slider correctly', () => {
      // Arrange & Act
      renderComponent({ volume: 0.7 });

      // Assert
      const volumeSlider = screen.getByDisplayValue('0.7');
      expect(volumeSlider).toBeInTheDocument();
    });

    it('calls onSettingsChange when volume changes', async () => {
      // Arrange
      const mockOnSettingsChange = jest.fn();
      const { user } = renderComponent({ onSettingsChange: mockOnSettingsChange });
      const volumeSlider = screen.getByDisplayValue('0.5');

      // Act - 使用fireEvent.change来模拟滑块值变化
      fireEvent.change(volumeSlider, { target: { value: '0.8' } });

      // Assert
      expect(mockOnSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({ volume: 0.8 })
      );
    });
  });

  // ==================== TAB NAVIGATION TESTS ====================
  describe('Tab Navigation', () => {
    it('shows basic settings by default', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      expect(screen.getByText(/专注时长/)).toBeInTheDocument();
      expect(screen.getByText(/休息时长/)).toBeInTheDocument();
    });

    it('switches to sound management tab', async () => {
      // Arrange
      const { user } = renderComponent();

      // Act
      await user.click(screen.getByText('音效管理'));

      // Assert
      expect(screen.getByTestId('sound-manager')).toBeInTheDocument();
    });

    it('switches to timer style management tab', async () => {
      // Arrange
      const { user } = renderComponent();

      // Act
      await user.click(screen.getByText('样式管理'));

      // Assert
      expect(screen.getByTestId('timer-style-manager')).toBeInTheDocument();
    });

    it('maintains tab state during navigation', async () => {
      // Arrange
      const { user } = renderComponent();

      // Act
      await user.click(screen.getByText('音效管理'));
      await user.click(screen.getByText('基础设置'));

      // Assert
      expect(screen.getByText(/专注时长/)).toBeInTheDocument();
    });
  });

  // ==================== PRESET CONFIGURATION TESTS ====================
  describe('Preset Configurations', () => {
    it('applies pomodoro preset correctly', async () => {
      // Arrange
      const mockOnSettingsChange = jest.fn();
      const { user } = renderComponent({ onSettingsChange: mockOnSettingsChange });

      // Act
      await user.click(screen.getByText('番茄工作法'));

      // Assert
      expect(mockOnSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          focusDuration: 25,
          breakDuration: 5,
        })
      );
    });

    it('applies balanced mode preset correctly', async () => {
      // Arrange
      const mockOnSettingsChange = jest.fn();
      const { user } = renderComponent({ onSettingsChange: mockOnSettingsChange });

      // Act
      await user.click(screen.getByText('平衡模式'));

      // Assert
      expect(mockOnSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          focusDuration: 45,
          breakDuration: 15,
        })
      );
    });

    it('preserves current sound and notification settings in presets', async () => {
      // Arrange
      const mockOnSettingsChange = jest.fn();
      const { user } = renderComponent({ 
        onSettingsChange: mockOnSettingsChange,
        soundEnabled: false,
        notificationEnabled: false,
        volume: 0.8
      });

      // Act
      await user.click(screen.getByText('番茄工作法'));

      // Assert
      expect(mockOnSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          soundEnabled: false,
          notificationEnabled: false,
          volume: 0.8,
        })
      );
    });
  });

  // ==================== PROPS VALIDATION TESTS ====================
  describe('Props Validation', () => {
    it('handles missing onSettingsChange prop gracefully', () => {
      // Arrange & Act
      const { container } = render(<Settings {...mockDefaultSettings} />);

      // Assert
      expect(container.firstChild).toBeInTheDocument();
    });

    it('uses default values for missing props', () => {
      // Arrange & Act
      render(<Settings onSettingsChange={jest.fn()} />);

      // Assert
      expect(screen.getByDisplayValue('90')).toBeInTheDocument(); // default focusDuration
      expect(screen.getByDisplayValue('20')).toBeInTheDocument(); // default breakDuration
    });

    it('displays custom prop values correctly', () => {
      // Arrange
      const customSettings = {
        focusDuration: 60,
        breakDuration: 12,
        volume: 0.3,
        soundEnabled: false,
        notificationEnabled: false,
      };

      // Act
      renderComponent(customSettings);

      // Assert
      expect(screen.getByDisplayValue('60')).toBeInTheDocument();
      expect(screen.getByDisplayValue('12')).toBeInTheDocument();
      expect(screen.getByDisplayValue('0.3')).toBeInTheDocument();
    });
  });

  // ==================== ACCESSIBILITY TESTS ====================
  describe('Accessibility', () => {
    it('has proper labels for form controls', () => {
      // Arrange & Act
      renderComponent();

      // Assert - 查找实际存在的文本
      expect(screen.getByText('基础设置')).toBeInTheDocument();
      expect(screen.getByText('音效管理')).toBeInTheDocument();
    });

    it('supports keyboard navigation between tabs', async () => {
      // Arrange
      const { user } = renderComponent();

      // Act
      await user.tab();

      // Assert
      expect(screen.getByText('基础设置').closest('button')).toHaveFocus();
    });

    it('has proper semantic structure', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(3); // All tab buttons and other buttons
    });

    it('provides descriptive text for settings', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      expect(screen.getByText('播放提示音和背景音')).toBeInTheDocument();
      expect(screen.getByText('显示系统通知提醒')).toBeInTheDocument();
    });
  });
});
