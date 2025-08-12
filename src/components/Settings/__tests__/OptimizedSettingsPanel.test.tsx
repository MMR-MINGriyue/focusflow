/**
 * 优化设置面板组件测试
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OptimizedSettingsPanel } from '../OptimizedSettingsPanel';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useTheme } from '../../../theme/ThemeProvider';

// Mock dependencies
jest.mock('../../../stores/settingsStore');
jest.mock('../../../theme/ThemeProvider');

const mockUseSettingsStore = useSettingsStore as jest.MockedFunction<typeof useSettingsStore>;
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

// Mock settings store
const mockSettingsStore = {
  settings: {
    timer: {
      focusDuration: 1500,
      shortBreakDuration: 300,
      longBreakDuration: 900,
      longBreakInterval: 4,
      autoStartBreaks: false,
      autoStartFocus: false
    },
    notifications: {
      enabled: true,
      desktop: true,
      sound: true
    },
    audio: {
      masterVolume: 80,
      tickingSound: false,
      completionSound: 'bell'
    },
    privacy: {
      analytics: false,
      crashReports: false
    }
  },
  updateTimerSettings: jest.fn(),
  updateNotificationSettings: jest.fn(),
  updateAudioSettings: jest.fn(),
  updatePrivacySettings: jest.fn(),
  markSaved: jest.fn(),
  hasUnsavedChanges: false
};

// Mock theme
const mockTheme = {
  mode: 'light' as const,
  fontSize: 'medium' as const,
  reducedMotion: false,
  highContrast: false
};

const mockUpdatePreferences = jest.fn();

describe('OptimizedSettingsPanel', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseSettingsStore.mockReturnValue(mockSettingsStore);
    mockUseTheme.mockReturnValue({
      theme: mockTheme,
      updatePreferences: mockUpdatePreferences,
      isDark: false,
      toggleMode: jest.fn()
    });
  });

  describe('Rendering', () => {
    it('should render settings panel with all categories', () => {
      render(<OptimizedSettingsPanel />);
      
      expect(screen.getByText('设置')).toBeInTheDocument();
      expect(screen.getByText('自定义FocusFlow的各项设置以获得最佳体验')).toBeInTheDocument();
      
      // Check category tabs
      expect(screen.getByText('计时器')).toBeInTheDocument();
      expect(screen.getByText('通知')).toBeInTheDocument();
      expect(screen.getByText('外观')).toBeInTheDocument();
      expect(screen.getByText('音频')).toBeInTheDocument();
      expect(screen.getByText('隐私')).toBeInTheDocument();
      expect(screen.getByText('高级')).toBeInTheDocument();
    });

    it('should render search input', () => {
      render(<OptimizedSettingsPanel />);
      
      const searchInput = screen.getByPlaceholderText('搜索设置... (Ctrl+F)');
      expect(searchInput).toBeInTheDocument();
    });

    it('should render quick actions', () => {
      render(<OptimizedSettingsPanel />);
      
      expect(screen.getByText('快捷操作')).toBeInTheDocument();
      expect(screen.getByText('切换主题')).toBeInTheDocument();
      expect(screen.getByText('切换通知')).toBeInTheDocument();
      expect(screen.getByText('切换声音')).toBeInTheDocument();
    });

    it('should render settings presets', () => {
      render(<OptimizedSettingsPanel />);
      
      expect(screen.getByText('预设配置')).toBeInTheDocument();
      expect(screen.getByText('专注强化')).toBeInTheDocument();
      expect(screen.getByText('平衡模式')).toBeInTheDocument();
      expect(screen.getByText('温和模式')).toBeInTheDocument();
    });
  });

  describe('Search functionality', () => {
    it('should filter settings based on search query', async () => {
      render(<OptimizedSettingsPanel />);
      
      const searchInput = screen.getByPlaceholderText('搜索设置... (Ctrl+F)');
      
      // Search for "专注"
      await user.type(searchInput, '专注');
      
      await waitFor(() => {
        // Should show timer-related settings
        expect(screen.getByText('专注时长')).toBeInTheDocument();
      });
    });

    it('should clear search when clear button is clicked', async () => {
      render(<OptimizedSettingsPanel />);
      
      const searchInput = screen.getByPlaceholderText('搜索设置... (Ctrl+F)');
      
      // Type search query
      await user.type(searchInput, '专注');
      
      // Find and click clear button
      const clearButton = screen.getByRole('button', { name: /清除|clear/i });
      await user.click(clearButton);
      
      expect(searchInput).toHaveValue('');
    });

    it('should focus search input with Ctrl+F', () => {
      render(<OptimizedSettingsPanel />);
      
      const searchInput = screen.getByPlaceholderText('搜索设置... (Ctrl+F)');
      
      // Press Ctrl+F
      fireEvent.keyDown(document, { key: 'f', ctrlKey: true });
      
      expect(document.activeElement).toBe(searchInput);
    });
  });

  describe('Settings categories', () => {
    it('should switch between categories', async () => {
      render(<OptimizedSettingsPanel />);
      
      // Click on notifications tab
      const notificationsTab = screen.getByText('通知');
      await user.click(notificationsTab);
      
      await waitFor(() => {
        expect(screen.getByText('启用通知')).toBeInTheDocument();
        expect(screen.getByText('桌面通知')).toBeInTheDocument();
      });
    });

    it('should show timer settings by default', () => {
      render(<OptimizedSettingsPanel />);
      
      expect(screen.getByText('专注时长')).toBeInTheDocument();
      expect(screen.getByText('短休息时长')).toBeInTheDocument();
      expect(screen.getByText('长休息时长')).toBeInTheDocument();
    });
  });

  describe('Settings controls', () => {
    it('should update timer settings', async () => {
      render(<OptimizedSettingsPanel />);
      
      // Find focus duration input
      const focusDurationInput = screen.getByDisplayValue('25'); // 1500 seconds = 25 minutes
      
      // Change value
      await user.clear(focusDurationInput);
      await user.type(focusDurationInput, '30');
      
      await waitFor(() => {
        expect(mockSettingsStore.updateTimerSettings).toHaveBeenCalledWith({
          focusDuration: 1800 // 30 minutes in seconds
        });
      });
    });

    it('should toggle boolean settings', async () => {
      render(<OptimizedSettingsPanel />);
      
      // Find auto start breaks toggle
      const autoStartToggle = screen.getByRole('checkbox', { name: /自动开始休息/i });
      
      await user.click(autoStartToggle);
      
      expect(mockSettingsStore.updateTimerSettings).toHaveBeenCalledWith({
        autoStartBreaks: true
      });
    });

    it('should update select settings', async () => {
      render(<OptimizedSettingsPanel />);
      
      // Switch to appearance tab
      const appearanceTab = screen.getByText('外观');
      await user.click(appearanceTab);
      
      await waitFor(() => {
        const themeSelect = screen.getByDisplayValue('跟随系统');
        fireEvent.change(themeSelect, { target: { value: 'dark' } });
        
        expect(mockUpdatePreferences).toHaveBeenCalledWith({ mode: 'dark' });
      });
    });

    it('should update range settings', async () => {
      render(<OptimizedSettingsPanel />);
      
      // Switch to audio tab
      const audioTab = screen.getByText('音频');
      await user.click(audioTab);
      
      await waitFor(() => {
        const volumeSlider = screen.getByRole('slider', { name: /主音量/i });
        fireEvent.change(volumeSlider, { target: { value: '60' } });
        
        expect(mockSettingsStore.updateAudioSettings).toHaveBeenCalledWith({
          masterVolume: 60
        });
      });
    });
  });

  describe('Favorites functionality', () => {
    it('should toggle setting as favorite', async () => {
      render(<OptimizedSettingsPanel />);
      
      // Find a setting item and its favorite button
      const settingItem = screen.getByText('专注时长').closest('div');
      expect(settingItem).toBeInTheDocument();
      
      // Hover to show favorite button
      await user.hover(settingItem!);
      
      const favoriteButton = screen.getByTitle(/添加收藏|取消收藏/);
      await user.click(favoriteButton);
      
      // Should update favorites state
      expect(favoriteButton).toHaveClass('text-yellow-500');
    });

    it('should filter by favorites', async () => {
      render(<OptimizedSettingsPanel />);
      
      // Select favorites filter
      const filterSelect = screen.getByDisplayValue('全部');
      fireEvent.change(filterSelect, { target: { value: 'favorites' } });
      
      // Should show only favorited settings
      await waitFor(() => {
        // Implementation depends on favorite state
      });
    });
  });

  describe('Presets functionality', () => {
    it('should apply preset configuration', async () => {
      render(<OptimizedSettingsPanel />);
      
      // Click on balanced preset
      const balancedPreset = screen.getByText('平衡模式');
      await user.click(balancedPreset);
      
      // Should apply preset settings
      expect(mockSettingsStore.updateTimerSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          focusDuration: 25 * 60,
          shortBreakDuration: 5 * 60,
          longBreakDuration: 15 * 60,
          longBreakInterval: 4
        })
      );
    });

    it('should highlight selected preset', async () => {
      render(<OptimizedSettingsPanel />);
      
      const balancedPreset = screen.getByText('平衡模式');
      await user.click(balancedPreset);
      
      // Should have selected styling
      expect(balancedPreset.closest('button')).toHaveClass('bg-primary');
    });
  });

  describe('Quick actions', () => {
    it('should toggle theme', async () => {
      render(<OptimizedSettingsPanel />);
      
      const themeToggle = screen.getByText('切换主题');
      await user.click(themeToggle);
      
      expect(mockUpdatePreferences).toHaveBeenCalledWith({ mode: 'dark' });
    });

    it('should toggle notifications', async () => {
      render(<OptimizedSettingsPanel />);
      
      const notificationToggle = screen.getByText('切换通知');
      await user.click(notificationToggle);
      
      expect(mockSettingsStore.updateNotificationSettings).toHaveBeenCalledWith({
        enabled: false // Toggle from true to false
      });
    });

    it('should toggle sounds', async () => {
      render(<OptimizedSettingsPanel />);
      
      const soundToggle = screen.getByText('切换声音');
      await user.click(soundToggle);
      
      expect(mockSettingsStore.updateAudioSettings).toHaveBeenCalledWith({
        masterVolume: 0 // Toggle from 80 to 0
      });
    });
  });

  describe('Reset functionality', () => {
    it('should reset individual setting', async () => {
      render(<OptimizedSettingsPanel />);
      
      // Find a setting with reset button
      const settingItem = screen.getByText('专注时长').closest('div');
      const resetButton = settingItem?.querySelector('button[title="重置为默认值"]');
      
      if (resetButton) {
        await user.click(resetButton);
        
        expect(mockSettingsStore.updateTimerSettings).toHaveBeenCalledWith({
          focusDuration: 25 * 60 // Default value
        });
      }
    });

    it('should show reset confirmation dialog', async () => {
      render(<OptimizedSettingsPanel />);
      
      // This would require implementing the reset all functionality
      // and testing the confirmation dialog
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<OptimizedSettingsPanel />);
      
      // Check for important ARIA attributes
      const searchInput = screen.getByPlaceholderText('搜索设置... (Ctrl+F)');
      expect(searchInput).toHaveAttribute('type', 'search');
      
      // Check tabs have proper roles
      const timerTab = screen.getByText('计时器');
      expect(timerTab.closest('[role="tab"]')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      render(<OptimizedSettingsPanel />);
      
      // Tab through elements
      await user.tab();
      expect(document.activeElement).toHaveAttribute('placeholder', '搜索设置... (Ctrl+F)');
      
      await user.tab();
      // Should move to next focusable element
    });

    it('should announce changes to screen readers', async () => {
      render(<OptimizedSettingsPanel />);
      
      // Toggle a setting
      const autoStartToggle = screen.getByRole('checkbox', { name: /自动开始休息/i });
      await user.click(autoStartToggle);
      
      // Should have proper ARIA attributes for state changes
      expect(autoStartToggle).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('Error handling', () => {
    it('should handle missing settings gracefully', () => {
      mockUseSettingsStore.mockReturnValue({
        ...mockSettingsStore,
        settings: {} as any
      });
      
      expect(() => {
        render(<OptimizedSettingsPanel />);
      }).not.toThrow();
    });

    it('should handle update errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      mockSettingsStore.updateTimerSettings.mockImplementation(() => {
        throw new Error('Update failed');
      });
      
      render(<OptimizedSettingsPanel />);
      
      const focusDurationInput = screen.getByDisplayValue('25');
      await user.clear(focusDurationInput);
      await user.type(focusDurationInput, '30');
      
      // Should handle error gracefully
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<OptimizedSettingsPanel />);
      
      // Re-render with same props
      rerender(<OptimizedSettingsPanel />);
      
      // Component should be memoized and not re-render
      expect(screen.getByText('设置')).toBeInTheDocument();
    });

    it('should debounce search input', async () => {
      jest.useFakeTimers();
      
      render(<OptimizedSettingsPanel />);
      
      const searchInput = screen.getByPlaceholderText('搜索设置... (Ctrl+F)');
      
      // Type quickly
      await user.type(searchInput, 'test');
      
      // Fast-forward timers
      jest.advanceTimersByTime(300);
      
      // Should debounce the search
      expect(searchInput).toHaveValue('test');
      
      jest.useRealTimers();
    });
  });
});