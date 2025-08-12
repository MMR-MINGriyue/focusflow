import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp';
import { useKeybindings } from '../../hooks/useKeybindings';
import { useSettingsStore } from '../../stores/settingsStore';

// Mock hooks and stores
vi.mock('../../hooks/useKeybindings');
vi.mock('../../stores/settingsStore');

// Mock data
const mockKeybindings = [
  { id: 'startTimer', key: 'Space', description: '开始/暂停计时器' },
  { id: 'resetTimer', key: 'R', description: '重置计时器' },
  { id: 'toggleSettings', key: 'S', description: '打开/关闭设置' },
  { id: 'toggleStats', key: 'T', description: '查看统计数据' },
  { id: 'toggleHelp', key: '?', description: '显示快捷键帮助' },
  { id: 'skipBreak', key: 'Escape', description: '跳过休息' },
];

describe('KeyboardShortcutsHelp Component', () => {
  const mockSettings = {
    showKeyboardShortcuts: true,
    setShowKeyboardShortcuts: vi.fn(),
  };

  beforeEach(() => {
    // Mock the keybindings hook
    (useKeybindings as jest.Mock).mockReturnValue({
      keybindings: mockKeybindings,
      isCustomizing: false,
      startCustomization: vi.fn(),
      saveCustomization: vi.fn(),
      cancelCustomization: vi.fn(),
    });

    // Mock the settings store
    (useSettingsStore as jest.Mock).mockReturnValue(mockSettings);
  });

  test('renders all keyboard shortcuts when opened', () => {
    render(<KeyboardShortcutsHelp />);

    // Verify all shortcuts are displayed
    mockKeybindings.forEach((binding) => {
      expect(screen.getByText(binding.description)).toBeInTheDocument();
      expect(screen.getByText(binding.key)).toBeInTheDocument();
    });

    // Verify title and close button
    expect(screen.getByText(/键盘快捷键/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /关闭/i })).toBeInTheDocument();
  });

  test('closes when close button is clicked', () => {
    const mockSetShow = vi.fn();
    (useSettingsStore as jest.Mock).mockReturnValue({
      ...mockSettings,
      setShowKeyboardShortcuts: mockSetShow,
    });

    render(<KeyboardShortcutsHelp />);

    // Click close button
    fireEvent.click(screen.getByRole('button', { name: /关闭/i }));

    expect(mockSetShow).toHaveBeenCalledWith(false);
  });

  test('starts keybinding customization when customize button is clicked', () => {
    const mockStartCustomization = vi.fn();
    (useKeybindings as jest.Mock).mockReturnValue({
      ...mockKeybindings,
      keybindings: mockKeybindings,
      isCustomizing: false,
      startCustomization: mockStartCustomization,
    });

    render(<KeyboardShortcutsHelp />);

    // Click customize button
    fireEvent.click(screen.getByRole('button', { name: /自定义快捷键/i }));

    expect(mockStartCustomization).toHaveBeenCalled();
  });

  test('shows customization interface when in customization mode', () => {
    (useKeybindings as jest.Mock).mockReturnValue({
      keybindings: mockKeybindings,
      isCustomizing: true,
      startCustomization: vi.fn(),
      saveCustomization: vi.fn(),
      cancelCustomization: vi.fn(),
    });

    render(<KeyboardShortcutsHelp />);

    // Verify customization UI elements
    expect(screen.getByText(/自定义快捷键/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /保存/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /取消/i })).toBeInTheDocument();

    // Verify editable key fields
    mockKeybindings.forEach((binding) => {
      expect(screen.getByDisplayValue(binding.key)).toBeInTheDocument();
    });
  });

  test('saves custom keybindings when save button is clicked', () => {
    const mockSave = vi.fn();
    (useKeybindings as jest.Mock).mockReturnValue({
      keybindings: mockKeybindings,
      isCustomizing: true,
      startCustomization: vi.fn(),
      saveCustomization: mockSave,
      cancelCustomization: vi.fn(),
    });

    render(<KeyboardShortcutsHelp />);

    // Change a keybinding
    const startTimerInput = screen.getByDisplayValue('Space');
    fireEvent.change(startTimerInput, { target: { value: 'Enter' } });

    // Click save button
    fireEvent.click(screen.getByRole('button', { name: /保存/i }));

    expect(mockSave).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        id: 'startTimer',
        key: 'Enter'
      })
    ]));
  });

  test('cancels customization when cancel button is clicked', () => {
    const mockCancel = vi.fn();
    (useKeybindings as jest.Mock).mockReturnValue({
      keybindings: mockKeybindings,
      isCustomizing: true,
      startCustomization: vi.fn(),
      saveCustomization: vi.fn(),
      cancelCustomization: mockCancel,
    });

    render(<KeyboardShortcutsHelp />);

    // Click cancel button
    fireEvent.click(screen.getByRole('button', { name: /取消/i }));

    expect(mockCancel).toHaveBeenCalled();
  });
});