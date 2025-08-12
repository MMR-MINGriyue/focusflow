import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Stats from './Stats';
import { useStatsStore } from '../../stores/statsStore';
import { useTimeFormat } from '../../hooks/useTimeFormat';

// Mock stores and hooks
vi.mock('../../stores/statsStore');
vi.mock('../../hooks/useTimeFormat');

// Mock data
const mockStats = {
  daily: {
    focusSessions: 5,
    totalFocusTime: 125,
    completedSessions: 4,
    averageFocusDuration: 25,
    efficiencyScore: 85,
  },
  weekly: {
    focusSessions: 28,
    totalFocusTime: 700,
    completedSessions: 25,
    averageFocusDuration: 25,
    efficiencyScore: 82,
  },
  monthly: {
    focusSessions: 120,
    totalFocusTime: 3000,
    completedSessions: 105,
    averageFocusDuration: 25,
    efficiencyScore: 80,
  },
  allTime: {
    focusSessions: 500,
    totalFocusTime: 12500,
    completedSessions: 450,
    averageFocusDuration: 25,
    efficiencyScore: 78,
  },
  focusStreak: 15,
  longestStreak: 30,
  sessionHistory: [
    { date: '2023-09-26', focusTime: 100, sessions: 4 },
    { date: '2023-09-27', focusTime: 75, sessions: 3 },
    { date: '2023-09-28', focusTime: 125, sessions: 5 },
    { date: '2023-09-29', focusTime: 50, sessions: 2 },
    { date: '2023-09-30', focusTime: 100, sessions: 4 },
    { date: '2023-10-01', focusTime: 125, sessions: 5 },
    { date: '2023-10-02', focusTime: 150, sessions: 6 },
  ],
};

describe('Stats Component', () => {
  beforeEach(() => {
    // Mock the time format hook
    (useTimeFormat as jest.Mock).mockReturnValue({
      formatMinutes: vi.fn((minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
      }),
    });

    // Mock the stats store
    (useStatsStore as jest.Mock).mockReturnValue({
      stats: mockStats,
      isLoading: false,
      error: null,
      fetchStats: vi.fn(),
      selectedTimeframe: 'weekly',
      setSelectedTimeframe: vi.fn(),
    });
  });

  test('renders statistics for selected timeframe', () => {
    render(<Stats />);

    // Verify weekly stats are displayed by default
    expect(screen.getByText(/28次专注/i)).toBeInTheDocument();
    expect(screen.getByText(/700分钟/i)).toBeInTheDocument();
    expect(screen.getByText(/25分钟/i)).toBeInTheDocument();
    expect(screen.getByText(/82分/i)).toBeInTheDocument();

    // Check navigation tabs
    expect(screen.getByText(/日/i)).toBeInTheDocument();
    expect(screen.getByText(/周/i)).toBeInTheDocument();
    expect(screen.getByText(/月/i)).toBeInTheDocument();
    expect(screen.getByText(/总计/i)).toBeInTheDocument();
  });

  test('switches between timeframes when navigation tabs are clicked', () => {
    const mockSetTimeframe = vi.fn();
    (useStatsStore as jest.Mock).mockReturnValue({
      ...mockStats,
      selectedTimeframe: 'daily',
      setSelectedTimeframe: mockSetTimeframe,
    });

    render(<Stats />);

    // Click monthly tab
    fireEvent.click(screen.getByText(/月/i));
    expect(mockSetTimeframe).toHaveBeenCalledWith('monthly');
  });

  test('shows loading state when fetching statistics', () => {
    (useStatsStore as jest.Mock).mockReturnValue({
      stats: null,
      isLoading: true,
      error: null,
      fetchStats: vi.fn(),
    });

    render(<Stats />);

    expect(screen.getByText(/加载统计数据/i)).toBeInTheDocument();
    expect(screen.queryByText(/专注次数/i)).not.toBeInTheDocument();
  });

  test('displays error message when stats fail to load', () => {
    (useStatsStore as jest.Mock).mockReturnValue({
      stats: null,
      isLoading: false,
      error: '无法加载统计数据，请重试',
      fetchStats: vi.fn(),
    });

    render(<Stats />);

    expect(screen.getByText(/无法加载统计数据/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /重试/i })).toBeInTheDocument();
  });

  test('renders focus streak information', () => {
    render(<Stats />);

    expect(screen.getByText(/当前连续专注/i)).toBeInTheDocument();
    expect(screen.getByText(/15天/i)).toBeInTheDocument();
    expect(screen.getByText(/最长连续专注/i)).toBeInTheDocument();
    expect(screen.getByText(/30天/i)).toBeInTheDocument();
  });

  test('renders session history chart with correct data', () => {
    render(<Stats />);

    // Check if chart container exists
    expect(screen.getByTestId('session-history-chart')).toBeInTheDocument();

    // Verify some data points are rendered
    mockStats.sessionHistory.forEach((item) => {
      expect(screen.getByText(item.date.split('-').slice(1).join('/'))).toBeInTheDocument();
    });
  });

  test('displays empty state when no statistics are available', () => {
    const emptyStats = {
      daily: { focusSessions: 0, totalFocusTime: 0, completedSessions: 0, averageFocusDuration: 0, efficiencyScore: 0 },
      weekly: { focusSessions: 0, totalFocusTime: 0, completedSessions: 0, averageFocusDuration: 0, efficiencyScore: 0 },
      monthly: { focusSessions: 0, totalFocusTime: 0, completedSessions: 0, averageFocusDuration: 0, efficiencyScore: 0 },
      allTime: { focusSessions: 0, totalFocusTime: 0, completedSessions: 0, averageFocusDuration: 0, efficiencyScore: 0 },
      focusStreak: 0,
      longestStreak: 0,
      sessionHistory: [],
    };

    (useStatsStore as jest.Mock).mockReturnValue({
      stats: emptyStats,
      isLoading: false,
      error: null,
      selectedTimeframe: 'weekly',
      setSelectedTimeframe: vi.fn(),
    });

    render(<Stats />);

    expect(screen.getByText(/暂无统计数据/i)).toBeInTheDocument();
    expect(screen.getByText(/开始你的第一次专注吧/i)).toBeInTheDocument();
    expect(screen.queryByTestId('session-history-chart')).not.toBeInTheDocument();
  });
});