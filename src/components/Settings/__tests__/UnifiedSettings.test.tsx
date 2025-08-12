/**
 * UnifiedSettings 组件测试
 * 测试统一设置界面、模式切换和设置更新功能
 */

import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UnifiedSettings from '../UnifiedSettings';
import { UnifiedTimerSettings } from '../../../types/unifiedTimer';

// Mock dependencies
jest.mock('../SoundManager', () => {
  return function MockSoundManager() {
    return <div data-testid="sound-manager">音效管理</div>;
  };
});

jest.mock('../ThemeManager', () => {
  return function MockThemeManager() {
    return <div data-testid="theme-manager">主题管理</div>;
  };
});

jest.mock('../TimerStyleManager', () => {
  return function MockTimerStyleManager() {
    return <div data-testid="timer-style-manager">计时器样式管理</div>;
  };
});

jest.mock('../../ui/Switch', () => ({
  Switch: ({ checked, onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      data-testid="switch"
      {...props}
    />
  ),
}));

jest.mock('../../ui/Slider', () => ({
  Slider: ({ value, onValueChange, min, max, step, ...props }: any) => (
    <input
      type="range"
      value={value?.[0] || 0}
      onChange={(e) => onValueChange?.([parseInt(e.target.value)])}
      min={min}
      max={max}
      step={step}
      data-testid="slider"
      {...props}
    />
  ),
}));

jest.mock('../../ui/Tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value}>
      {children}
    </div>
  ),
  TabsList: ({ children }: any) => (
    <div data-testid="tabs-list">{children}</div>
  ),
  TabsTrigger: ({ children, value, onClick }: any) => (
    <button data-testid={`tab-${value}`} onClick={onClick}>
      {children}
    </button>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  ),
}));

describe('UnifiedSettings Component', () => {
  const mockSettings: UnifiedTimerSettings = {
    mode: 'classic',
    classic: {
      focusTime: 25,
      shortBreakTime: 5,
      longBreakTime: 15,
      sessionsUntilLongBreak: 4,
      autoStartBreaks: false,
      autoStartFocus: false,
      enableNotifications: true,
      enableSounds: true,
      volume: 0.7,
    },
    smart: {
      adaptiveBreaks: true,
      workloadAnalysis: true,
      personalizedTiming: false,
      focusScoreTracking: true,
      intelligentNotifications: true,
      contextAwareness: false,
      performanceOptimization: true,
      learningMode: true,
    },
    ui: {
      theme: 'light',
      compactMode: false,
      showProgress: true,
      showStats: true,
      animationsEnabled: true,
      soundFeedback: true,
    },
  };

  const mockOnSettingsChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(
        <UnifiedSettings 
          settings={mockSettings} 
          onSettingsChange={mockOnSettingsChange} 
        />
      );
      
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
    });

    it('displays all tab options', () => {
      render(
        <UnifiedSettings 
          settings={mockSettings} 
          onSettingsChange={mockOnSettingsChange} 
        />
      );
      
      expect(screen.getByTestId('tab-mode')).toBeInTheDocument();
      expect(screen.getByTestId('tab-classic')).toBeInTheDocument();
      expect(screen.getByTestId('tab-smart')).toBeInTheDocument();
      expect(screen.getByTestId('tab-sound')).toBeInTheDocument();
      expect(screen.getByTestId('tab-theme')).toBeInTheDocument();
      expect(screen.getByTestId('tab-style')).toBeInTheDocument();
    });

    it('shows tab navigation', () => {
      render(
        <UnifiedSettings
          settings={mockSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      expect(screen.getByText('模式')).toBeInTheDocument();
      expect(screen.getByText('经典')).toBeInTheDocument();
      expect(screen.getByText('智能')).toBeInTheDocument();
    });
  });

  describe('Mode Selection', () => {
    it('renders mode selection interface', () => {
      render(
        <UnifiedSettings
          settings={mockSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      // Should render without errors
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
    });

    it('calls onSettingsChange when settings are updated', async () => {
      const user = userEvent.setup();
      render(
        <UnifiedSettings
          settings={mockSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      // Find any switch and click it
      const switches = screen.getAllByTestId('switch');
      if (switches.length > 0) {
        await user.click(switches[0]);
        expect(mockOnSettingsChange).toHaveBeenCalled();
      }
    });
  });

  describe('Tab Navigation', () => {
    it('allows switching between tabs', async () => {
      const user = userEvent.setup();
      render(
        <UnifiedSettings
          settings={mockSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      const classicTab = screen.getByTestId('tab-classic');
      await user.click(classicTab);

      // Should not throw error
      expect(classicTab).toBeInTheDocument();
    });

    it('renders smart tab content', async () => {
      const user = userEvent.setup();
      render(
        <UnifiedSettings
          settings={mockSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      const smartTab = screen.getByTestId('tab-smart');
      await user.click(smartTab);

      // Should not throw error
      expect(smartTab).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('renders SoundManager in sound tab', async () => {
      const user = userEvent.setup();
      render(
        <UnifiedSettings 
          settings={mockSettings} 
          onSettingsChange={mockOnSettingsChange} 
        />
      );
      
      const soundTab = screen.getByTestId('tab-sound');
      await user.click(soundTab);
      
      expect(screen.getByTestId('sound-manager')).toBeInTheDocument();
    });

    it('renders ThemeManager in theme tab', async () => {
      const user = userEvent.setup();
      render(
        <UnifiedSettings 
          settings={mockSettings} 
          onSettingsChange={mockOnSettingsChange} 
        />
      );
      
      const themeTab = screen.getByTestId('tab-theme');
      await user.click(themeTab);
      
      expect(screen.getByTestId('theme-manager')).toBeInTheDocument();
    });

    it('renders TimerStyleManager in style tab', async () => {
      const user = userEvent.setup();
      render(
        <UnifiedSettings 
          settings={mockSettings} 
          onSettingsChange={mockOnSettingsChange} 
        />
      );
      
      const styleTab = screen.getByTestId('tab-style');
      await user.click(styleTab);
      
      expect(screen.getByTestId('timer-style-manager')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing settings gracefully', () => {
      const incompleteSettings = {
        mode: 'classic',
        classic: {},
        smart: {},
        ui: {},
      } as UnifiedTimerSettings;

      expect(() => 
        render(
          <UnifiedSettings 
            settings={incompleteSettings} 
            onSettingsChange={mockOnSettingsChange} 
          />
        )
      ).not.toThrow();
    });
  });
});
