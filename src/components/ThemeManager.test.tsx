import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ThemeManager from './ThemeManager';
import ThemeToggle from './ThemeToggle';
import { useThemeStore } from '../../stores/themeStore';

// Mock the store and components
vi.mock('../../stores/themeStore');
vi.mock('./ThemeToggle', () => ({
  __esModule: true,
  default: vi.fn(() => <button data-testid="theme-toggle" />)
}));

describe('ThemeManager Component', () => {
  const mockStore = {
    theme: 'light',
    setTheme: vi.fn(),
    systemTheme: 'light',
    useSystemTheme: true,
    toggleUseSystemTheme: vi.fn(),
  };

  beforeEach(() => {
    (useThemeStore as jest.Mock).mockReturnValue({
      ...mockStore,
      // Reset mocks before each test
      setTheme: vi.fn(),
      toggleUseSystemTheme: vi.fn(),
    });
    (ThemeToggle as jest.Mock).mockClear();
  });

  test('renders ThemeToggle component', () => {
    render(<ThemeManager />);
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    expect(ThemeToggle).toHaveBeenCalled();
  });

  test('applies correct theme class to document when using custom theme', () => {
    (useThemeStore as jest.Mock).mockReturnValue({
      ...mockStore,
      useSystemTheme: false,
      theme: 'dark',
    });

    render(<ThemeManager />);

    // Check if theme class is applied
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  test('applies system theme class when using system theme', () => {
    (useThemeStore as jest.Mock).mockReturnValue({
      ...mockStore,
      useSystemTheme: true,
      systemTheme: 'dark',
    });

    render(<ThemeManager />);

    // Check if system theme class is applied
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  test('toggles between themes when ThemeToggle is clicked', () => {
    const mockSetTheme = vi.fn();
    (useThemeStore as jest.Mock).mockReturnValue({
      ...mockStore,
      useSystemTheme: false,
      theme: 'light',
      setTheme: mockSetTheme,
    });

    render(<ThemeManager />);

    // Click the theme toggle button
    fireEvent.click(screen.getByTestId('theme-toggle'));

    // Check if setTheme was called with the opposite theme
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  test('switches to system theme when system theme toggle is enabled', () => {
    const mockToggleSystemTheme = vi.fn();
    (useThemeStore as jest.Mock).mockReturnValue({
      ...mockStore,
      useSystemTheme: false,
      toggleUseSystemTheme: mockToggleSystemTheme,
    });

    render(<ThemeManager />);

    // Find and click the system theme toggle
    const systemToggle = screen.getByLabelText(/使用系统主题/i);
    fireEvent.click(systemToggle);

    // Check if toggle function was called
    expect(mockToggleSystemTheme).toHaveBeenCalled();
  });

  test('persists theme preference in localStorage', () => {
    const mockSetItem = vi.spyOn(localStorage.__proto__, 'setItem');
    (useThemeStore as jest.Mock).mockReturnValue({
      ...mockStore,
      useSystemTheme: false,
      theme: 'dark',
    });

    render(<ThemeManager />);

    // Check if theme preference is saved to localStorage
    expect(mockSetItem).toHaveBeenCalledWith('theme', JSON.stringify({
      theme: 'dark',
      useSystemTheme: false
    }));

    mockSetItem.mockRestore();
  });
});