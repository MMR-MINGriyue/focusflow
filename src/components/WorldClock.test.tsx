import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import WorldClock from './WorldClock';
import { useWorldClockStore } from '../../stores/worldClockStore';

// Mock the store
vi.mock('../../stores/worldClockStore');

describe('WorldClock Component', () => {
  const mockTimezones = [
    { id: '1', name: 'New York', timezone: 'America/New_York', enabled: true },
    { id: '2', name: 'London', timezone: 'Europe/London', enabled: true },
    { id: '3', name: 'Tokyo', timezone: 'Asia/Tokyo', enabled: false },
  ];

  const mockStore = {
    timezones: mockTimezones,
    addTimezone: vi.fn(),
    removeTimezone: vi.fn(),
    toggleTimezone: vi.fn(),
    isLoading: false,
    error: null,
  };

  beforeEach(() => {
    (useWorldClockStore as jest.Mock).mockReturnValue({
      ...mockStore,
      // Reset mocks before each test
      addTimezone: vi.fn(),
      removeTimezone: vi.fn(),
      toggleTimezone: vi.fn(),
    });
    // Mock Date to have consistent test results
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-10-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('renders enabled timezones with correct times', () => {
    render(<WorldClock />);

    // Check if enabled timezones are displayed
    expect(screen.getByText('New York')).toBeInTheDocument();
    expect(screen.getByText('London')).toBeInTheDocument();
    // Check if disabled timezone is not displayed
    expect(screen.queryByText('Tokyo')).not.toBeInTheDocument();

    // Check times (based on mocked date 2023-10-01T12:00:00Z)
    // New York is UTC-4 (during DST) → 08:00
    expect(screen.getByText(/08:00/)).toBeInTheDocument();
    // London is UTC+1 (during BST) → 13:00
    expect(screen.getByText(/13:00/)).toBeInTheDocument();
  });

  test('shows loading state when loading timezones', () => {
    (useWorldClockStore as jest.Mock).mockReturnValue({
      ...mockStore,
      isLoading: true,
    });

    render(<WorldClock />);

    // Check if loading indicator is shown
    expect(screen.getByText(/加载中/i)).toBeInTheDocument();
  });

  test('shows error message when there is an error', () => {
    const errorMessage = '无法加载时区数据';
    (useWorldClockStore as jest.Mock).mockReturnValue({
      ...mockStore,
      error: errorMessage,
    });

    render(<WorldClock />);

    // Check if error message is shown
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /重试/i })).toBeInTheDocument();
  });

  test('toggles timezone visibility when toggle button is clicked', () => {
    const mockToggle = vi.fn();
    (useWorldClockStore as jest.Mock).mockReturnValue({
      ...mockStore,
      toggleTimezone: mockToggle,
    });

    render(<WorldClock />);

    // Click the toggle button for London
    const londonToggle = screen.getByText('London').closest('div')?.querySelector('button');
    if (londonToggle) {
      fireEvent.click(londonToggle);
      expect(mockToggle).toHaveBeenCalledWith('2');
    } else {
      fail('Toggle button not found');
    }
  });

  test('adds new timezone when add button is clicked', () => {
    const mockAdd = vi.fn();
    (useWorldClockStore as jest.Mock).mockReturnValue({
      ...mockStore,
      addTimezone: mockAdd,
    });

    render(<WorldClock />);

    // Click add button
    fireEvent.click(screen.getByRole('button', { name: /添加时区/i }));

    // Assuming a dialog opens, fill in and submit
    // This would depend on actual implementation
    await waitFor(() => {
      expect(screen.getByText(/选择时区/i)).toBeInTheDocument();
    });

    // Select a timezone and confirm
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Australia/Sydney' } });
    fireEvent.click(screen.getByRole('button', { name: /确认/i }));

    expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({
      timezone: 'Australia/Sydney'
    }));
  });

  test('updates time display every minute', async () => {
    render(<WorldClock />);

    // Initial time for New York should be 08:00
    expect(screen.getByText(/08:00/)).toBeInTheDocument();

    // Fast-forward time by 60 seconds
    vi.advanceTimersByTime(60000);

    // Check if time updated
    await waitFor(() => {
      expect(screen.getByText(/08:01/)).toBeInTheDocument();
    });
  });
});