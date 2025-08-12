import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import SettingsPanel from './SettingsPanel';
import { useUnifiedTimerStore } from '../../stores/unifiedTimerStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useThemeStore } from '../../stores/themeStore';
import { useKeybindings } from '../../hooks/useKeybindings';

// Mock stores and hooks
vi.mock('../../stores/unifiedTimerStore');
vi.mock('../../stores/settingsStore');
vi.mock('../../stores/themeStore');
vi.mock('../../hooks/useKeybindings');

// Mock data
const mockTimerSettings = {
  mode: 'classic',
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: true,
  autoStartPomodoros: false,
  soundEnabled: true,
  notificationsEnabled: true,
};

const mockThemeSettings = {
  theme: 'light',
  accentColor: '#4CAF50',
  fontSize: 'medium',
  setTheme: vi.fn(),
  setAccentColor: vi.fn(),
  setFontSize: vi.fn(),
};

const mockKeybindings = [
  { id: 'startTimer', key: 'Space', description: '开始/暂停计时器' },
  { id: 'resetTimer', key: 'R', description: '重置计时器' },
];

describe('SettingsPanel Component', () => {
  beforeEach(() => {
    // Mock stores
    (useUnifiedTimerStore as jest.Mock).mockReturnValue({
      settings: mockTimerSettings,
      setSettings: vi.fn(),
      showSettings: true,
      setShowSettings: vi.fn(),
    });

    (useSettingsStore as jest.Mock).mockReturnValue({
      settings: mockTimerSettings,
      saveSettings: vi.fn(),
      resetToDefaults: vi.fn(),
    });

    (useThemeStore as jest.Mock).mockReturnValue(mockThemeSettings);

    // Mock keybindings hook
    (useKeybindings as jest.Mock).mockReturnValue({
      keybindings: mockKeybindings,
    });
  });

  test('renders all settings sections and fields', () => {
    render(<SettingsPanel />);

    // Verify sections
    expect(screen.getByText(/计时器设置/i)).toBeInTheDocument();
    expect(screen.getByText(/主题设置/i)).toBeInTheDocument();
    expect(screen.getByText(/快捷键/i)).toBeInTheDocument();

    // Verify timer settings fields
    expect(screen.getByLabelText(/计时器模式/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/工作时长/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/短休息时长/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/长休息时长/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/长休息间隔/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/自动开始休息/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/自动开始专注/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/启用声音/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/启用通知/i)).toBeInTheDocument();

    // Verify action buttons
    expect(screen.getByRole('button', { name: /保存设置/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /重置为默认值/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /取消/i })).toBeInTheDocument();
  });

  test('updates timer settings when inputs are changed', async () => {
    const mockSetSettings = vi.fn();
    (useUnifiedTimerStore as jest.Mock).mockReturnValue({
      settings: mockTimerSettings,
      setSettings: mockSetSettings,
      showSettings: true,
      setShowSettings: vi.fn(),
    });

    render(<SettingsPanel />);

    // Change work duration
    const workDurationInput = screen.getByLabelText(/工作时长/i);
    fireEvent.change(workDurationInput, { target: { value: '30' } });

    // Change to smart mode
    const modeSelect = screen.getByLabelText(/计时器模式/i);
    fireEvent.change(modeSelect, { target: { value: 'smart' } });

    // Toggle auto start pomodoros
    const autoStartPomodoros = screen.getByLabelText(/自动开始专注/i);
    fireEvent.click(autoStartPomodoros);

    await waitFor(() => {
      expect(mockSetSettings).toHaveBeenCalledWith(expect.objectContaining({
        workDuration: 30,
        mode: 'smart',
        autoStartPomodoros: true,
      }));
    });
  });

  test('saves settings when save button is clicked', () => {
    const mockSaveSettings = vi.fn();
    const mockSetShowSettings = vi.fn();

    (useSettingsStore as jest.Mock).mockReturnValue({
      settings: mockTimerSettings,
      saveSettings: mockSaveSettings,
      resetToDefaults: vi.fn(),
    });

    (useUnifiedTimerStore as jest.Mock).mockReturnValue({
      settings: mockTimerSettings,
      setSettings: vi.fn(),
      showSettings: true,
      setShowSettings: mockSetShowSettings,
    });

    render(<SettingsPanel />);

    // Click save button
    fireEvent.click(screen.getByRole('button', { name: /保存设置/i }));

    expect(mockSaveSettings).toHaveBeenCalled();
    expect(mockSetShowSettings).toHaveBeenCalledWith(false);
  });

  test('resets to default settings when reset button is clicked', async () => {
    const mockResetToDefaults = vi.fn();
    (useSettingsStore as jest.Mock).mockReturnValue({
      settings: mockTimerSettings,
      saveSettings: vi.fn(),
      resetToDefaults: mockResetToDefaults,
    });

    render(<SettingsPanel />);

    // Click reset button
    fireEvent.click(screen.getByRole('button', { name: /重置为默认值/i }));

    // Confirm reset
    fireEvent.click(screen.getByRole('button', { name: /确认/i }));

    await waitFor(() => {
      expect(mockResetToDefaults).toHaveBeenCalled();
    });
  });

  test('cancels and closes settings panel when cancel button is clicked', () => {
    const mockSetShowSettings = vi.fn();
    (useUnifiedTimerStore as jest.Mock).mockReturnValue({
      settings: mockTimerSettings,
      setSettings: vi.fn(),
      showSettings: true,
      setShowSettings: mockSetShowSettings,
    });

    render(<SettingsPanel />);

    // Click cancel button
    fireEvent.click(screen.getByRole('button', { name: /取消/i }));

    expect(mockSetShowSettings).toHaveBeenCalledWith(false);
  });

  test('updates theme settings when theme options are changed', () => {
    const mockSetTheme = vi.fn();
    const mockSetAccentColor = vi.fn();
    const mockSetFontSize = vi.fn();

    (useThemeStore as jest.Mock).mockReturnValue({
      theme: 'light',
      accentColor: '#4CAF50',
      fontSize: 'medium',
      setTheme: mockSetTheme,
      setAccentColor: mockSetAccentColor,
      setFontSize: mockSetFontSize,
    });

    render(<SettingsPanel />);

    // Change to dark theme
    fireEvent.click(screen.getByLabelText(/深色主题/i));

    // Change accent color
    fireEvent.click(screen.getByLabelText(/红色主题/i));

    // Change font size
    fireEvent.click(screen.getByLabelText(/大号字体/i));

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
    expect(mockSetAccentColor).toHaveBeenCalledWith('#e53935');
    expect(mockSetFontSize).toHaveBeenCalledWith('large');
  });

  test('shows validation errors for invalid input values', async () => {
    render(<SettingsPanel />);

    // Enter invalid work duration
    const workDurationInput = screen.getByLabelText(/工作时长/i);
    fireEvent.change(workDurationInput, { target: { value: 'abc' } });

    // Click save button
    fireEvent.click(screen.getByRole('button', { name: /保存设置/i }));

    await waitFor(() => {
      expect(screen.getByText(/请输入有效的数字/i)).toBeInTheDocument();
    });
  });

  test('shows confirmation dialog before resetting to defaults', () => {
    render(<SettingsPanel />);

    // Click reset button
    fireEvent.click(screen.getByRole('button', { name: /重置为默认值/i }));

    // Verify confirmation dialog
    expect(screen.getByText(/确认重置/i)).toBeInTheDocument();
    expect(screen.getByText(/确定要将所有设置重置为默认值吗？/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /确认/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /取消/i })).toBeInTheDocument();
  });

  test('cancels reset when cancel is clicked in confirmation dialog', () => {
    const mockResetToDefaults = vi.fn();
    (useSettingsStore as jest.Mock).mockReturnValue({
      settings: mockTimerSettings,
      saveSettings: vi.fn(),
      resetToDefaults: mockResetToDefaults,
    });

    render(<SettingsPanel />);

    // Click reset button
    fireEvent.click(screen.getByRole('button', { name: /重置为默认值/i }));

    // Cancel reset
    fireEvent.click(screen.getByRole('button', { name: /取消/i }));

    expect(mockResetToDefaults).not.toHaveBeenCalled();
  });
})