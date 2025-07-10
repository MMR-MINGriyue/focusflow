import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SoundPersistenceTest from '../SoundPersistenceTest';

// Mock the sound service
jest.mock('../../../services/sound', () => ({
  soundService: {
    testSoundPersistence: jest.fn(),
    loadSounds: jest.fn(),
    playSound: jest.fn(),
    stopAllSounds: jest.fn(),
  },
}));

describe('SoundPersistenceTest - Accessibility Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders without crashing', () => {
    render(<SoundPersistenceTest />);
    expect(screen.getByText('音效持久化测试')).toBeInTheDocument();
  });

  it('has accessible button with proper aria-label', () => {
    render(<SoundPersistenceTest />);
    
    const testButton = screen.getByRole('button', { name: /重新运行音效持久化测试/ });
    expect(testButton).toBeInTheDocument();
    expect(testButton).toHaveAttribute('aria-label', '重新运行音效持久化测试');
  });

  it('button aria-label changes when running tests', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SoundPersistenceTest />);
    
    const testButton = screen.getByRole('button');
    await user.click(testButton);
    
    expect(testButton).toHaveAttribute('aria-label', '正在运行音效持久化测试');
    expect(testButton).toBeDisabled();
  });

  it('has accessible progress bar with proper ARIA attributes', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SoundPersistenceTest />);
    
    // Start the test to show progress bar
    const testButton = screen.getByRole('button');
    await user.click(testButton);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax');
    expect(progressBar).toHaveAttribute('aria-label');
  });

  it('progress bar aria-label updates with current progress', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SoundPersistenceTest />);
    
    // Start the test
    const testButton = screen.getByRole('button');
    await user.click(testButton);
    
    const progressBar = screen.getByRole('progressbar');
    const ariaLabel = progressBar.getAttribute('aria-label');
    
    // Should contain progress information
    expect(ariaLabel).toMatch(/测试进度：\d+\/\d+ 通过/);
  });

  it('uses CSS variables instead of direct inline styles', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SoundPersistenceTest />);
    
    // Start the test to show progress bar
    const testButton = screen.getByRole('button');
    await user.click(testButton);
    
    // Find progress bar fill element
    const progressFill = document.querySelector('.bg-green-500.h-2.rounded-full');
    expect(progressFill).toBeInTheDocument();
    
    // Should use CSS variables
    const style = progressFill?.getAttribute('style');
    expect(style).toContain('--progress-width');
    expect(style).toContain('var(--progress-width)');
  });

  it('refresh icon has aria-hidden attribute', () => {
    render(<SoundPersistenceTest />);
    
    // Find the RefreshCw icon (it should be hidden from screen readers)
    const icon = document.querySelector('.lucide-refresh-cw');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('handles keyboard navigation properly', async () => {
    const user = userEvent.setup();
    render(<SoundPersistenceTest />);
    
    const testButton = screen.getByRole('button');
    
    // Should be focusable
    testButton.focus();
    expect(testButton).toHaveFocus();
    
    // Should be activatable with Enter
    await user.keyboard('{Enter}');
    expect(testButton).toHaveAttribute('aria-label', '正在运行音效持久化测试');
    
    // Should be activatable with Space
    // (Note: Space activation is handled by the browser for buttons)
  });

  it('provides screen reader friendly test results', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SoundPersistenceTest />);
    
    // Start the test
    const testButton = screen.getByRole('button');
    await user.click(testButton);
    
    // Fast forward to complete the test
    jest.advanceTimersByTime(5000);
    
    await waitFor(() => {
      // Should show results in an accessible format
      const resultsSection = screen.getByText(/测试结果/);
      expect(resultsSection).toBeInTheDocument();
      
      // Results should be in a list or structured format
      const testResults = screen.getByText(/通过/);
      expect(testResults).toBeInTheDocument();
    });
  });

  it('maintains focus management during test execution', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SoundPersistenceTest />);
    
    const testButton = screen.getByRole('button');
    testButton.focus();
    
    await user.click(testButton);
    
    // Button should remain focused even when disabled
    expect(testButton).toHaveFocus();
    
    // When test completes, button should still be focusable
    jest.advanceTimersByTime(5000);
    
    await waitFor(() => {
      expect(testButton).not.toBeDisabled();
      expect(testButton).toHaveFocus();
    });
  });

  it('provides meaningful error messages for screen readers', async () => {
    // Mock a test failure
    const mockSoundService = require('../../../services/sound').soundService;
    mockSoundService.testSoundPersistence.mockRejectedValue(new Error('Test failed'));
    
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SoundPersistenceTest />);
    
    const testButton = screen.getByRole('button');
    await user.click(testButton);
    
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      // Should show error message
      const errorMessage = screen.getByText(/测试失败/);
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it('supports high contrast mode', () => {
    render(<SoundPersistenceTest />);
    
    // Check that elements have sufficient contrast classes
    const testButton = screen.getByRole('button');
    expect(testButton).toHaveClass('bg-blue-500', 'text-white');
    
    // Progress bar should have good contrast
    const progressContainer = document.querySelector('.bg-gray-200');
    expect(progressContainer).toBeInTheDocument();
  });

  it('works with reduced motion preferences', async () => {
    // Mock reduced motion preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
    
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SoundPersistenceTest />);
    
    const testButton = screen.getByRole('button');
    await user.click(testButton);
    
    // Animation classes should still be present but respect user preferences
    const icon = document.querySelector('.lucide-refresh-cw');
    expect(icon).toHaveClass('animate-spin');
    
    // CSS should handle reduced motion via media queries
  });
});
