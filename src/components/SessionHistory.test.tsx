import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import SessionHistory from './SessionHistory';
import { useSessionStore } from '../../stores/sessionStore';
import { useTimeFormat } from '../../hooks/useTimeFormat';
import { useThemeStore } from '../../stores/themeStore';

// Mock stores and hooks
vi.mock('../../stores/sessionStore');
vi.mock('../../hooks/useTimeFormat');
vi.mock('../../stores/themeStore');

// Mock data
const mockSessions = [
  {
    id: '1',
    date: '2023-10-05T09:30:00',
    duration: 25,
    mode: 'focus',
    completed: true,
    efficiencyScore: 90,
    notes: '完成项目文档',
  },
  {
    id: '2',
    date: '2023-10-05T10:15:00',
    duration: 5,
    mode: 'shortBreak',
    completed: true,
    efficiencyScore: 0,
    notes: '',
  },
  {
    id: '3',
    date: '2023-10-05T10:30:00',
    duration: 25,
    mode: 'focus',
    completed: true,
    efficiencyScore: 85,
    notes: '修复bug',
  },
  {
    id: '4',
    date: '2023-10-05T14:00:00',
    duration: 25,
    mode: 'focus',
    completed: false,
    efficiencyScore: 0,
    notes: '会议中断',
  },
];

describe('SessionHistory Component', () => {
  beforeEach(() => {
    // Mock theme store
    (useThemeStore as jest.Mock).mockReturnValue({
      theme: 'light',
    });

    // Mock time format hook
    (useTimeFormat as jest.Mock).mockReturnValue({
      formatDate: vi.fn((date) => new Date(date).toLocaleString()),
      formatDuration: vi.fn((minutes) => `${minutes}分钟`),
    });

    // Mock session store
    (useSessionStore as jest.Mock).mockReturnValue({
      sessions: mockSessions,
      isLoading: false,
      error: null,
      fetchSessions: vi.fn(),
      filter: 'all',
      setFilter: vi.fn(),
      deleteSession: vi.fn(),
      exportSessions: vi.fn(),
    });
  });

  test('renders session history with all sessions', () => {
    render(<SessionHistory />);

    // Verify component renders
    expect(screen.getByText(/会话历史/i)).toBeInTheDocument();

    // Verify filter options
    expect(screen.getByText(/全部/i)).toBeInTheDocument();
    expect(screen.getByText(/专注/i)).toBeInTheDocument();
    expect(screen.getByText(/休息/i)).toBeInTheDocument();
    expect(screen.getByText(/未完成/i)).toBeInTheDocument();

    // Verify action buttons
    expect(screen.getByRole('button', { name: /导出数据/i })).toBeInTheDocument();

    // Verify session entries
    expect(screen.getAllByTestId('session-item').length).toBe(4);
    expect(screen.getByText(/完成项目文档/i)).toBeInTheDocument();
    expect(screen.getByText(/修复bug/i)).toBeInTheDocument();
    expect(screen.getByText(/会议中断/i)).toBeInTheDocument();
  });

  test('filters sessions when filter options are selected', () => {
    const mockSetFilter = vi.fn();
    (useSessionStore as jest.Mock).mockReturnValue({
      sessions: mockSessions,
      isLoading: false,
      error: null,
      filter: 'focus',
      setFilter: mockSetFilter,
    });

    render(<SessionHistory />);

    // Verify only focus sessions are shown
    expect(screen.getAllByTestId('session-item').length).toBe(3);
    expect(screen.getByText(/完成项目文档/i)).toBeInTheDocument();
    expect(screen.getByText(/修复bug/i)).toBeInTheDocument();
    expect(screen.getByText(/会议中断/i)).toBeInTheDocument();
    expect(screen.queryByText(/短休息/i)).not.toBeInTheDocument();

    // Change filter to completed
    fireEvent.click(screen.getByText(/完成/i));
    expect(mockSetFilter).toHaveBeenCalledWith('completed');
  });

  test('shows loading state when fetching sessions', () => {
    (useSessionStore as jest.Mock).mockReturnValue({
      sessions: [],
      isLoading: true,
      error: null,
      filter: 'all',
    });

    render(<SessionHistory />);

    expect(screen.getByText(/加载中/i)).toBeInTheDocument();
    expect(screen.queryByTestId('session-item')).not.toBeInTheDocument();
  });

  test('shows error message when sessions fail to load', () => {
    (useSessionStore as jest.Mock).mockReturnValue({
      sessions: [],
      isLoading: false,
      error: '无法加载会话历史',
      filter: 'all',
    });

    render(<SessionHistory />);

    expect(screen.getByText(/无法加载会话历史/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /重试/i })).toBeInTheDocument();
  });

  test('confirms before deleting a session', () => {
    const mockDeleteSession = vi.fn();
    (useSessionStore as jest.Mock).mockReturnValue({
      ...mockSessions,
      deleteSession: mockDeleteSession,
    });

    render(<SessionHistory />);

    // Click delete button on first session
    const firstSession = screen.getAllByTestId('session-item')[0];
    fireEvent.click(firstSession.querySelector('[aria-label*=删除]'));

    // Verify confirmation dialog
    expect(screen.getByText(/确认删除/i)).toBeInTheDocument();
    expect(screen.getByText(/确定要删除此会话吗？/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /确认/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /取消/i })).toBeInTheDocument();

    // Cancel deletion
    fireEvent.click(screen.getByRole('button', { name: /取消/i }));
    expect(mockDeleteSession).not.toHaveBeenCalled();
  });

  test('deletes session when confirmed', () => {
    const mockDeleteSession = vi.fn();
    (useSessionStore as jest.Mock).mockReturnValue({
      ...mockSessions,
      deleteSession: mockDeleteSession,
    });

    render(<SessionHistory />);

    // Click delete button on first session
    const firstSession = screen.getAllByTestId('session-item')[0];
    fireEvent.click(firstSession.querySelector('[aria-label*=删除]'));

    // Confirm deletion
    fireEvent.click(screen.getByRole('button', { name: /确认/i }));

    expect(mockDeleteSession).toHaveBeenCalledWith('1');
  });

  test('exports sessions when export button is clicked', () => {
    const mockExportSessions = vi.fn();
    (useSessionStore as jest.Mock).mockReturnValue({
      ...mockSessions,
      exportSessions: mockExportSessions,
    });

    render(<SessionHistory />);

    // Click export button
    fireEvent.click(screen.getByRole('button', { name: /导出数据/i }));

    expect(mockExportSessions).toHaveBeenCalled();
  });

  test('shows empty state when there are no sessions', () => {
    (useSessionStore as jest.Mock).mockReturnValue({
      sessions: [],
      isLoading: false,
      error: null,
      filter: 'all',
    });

    render(<SessionHistory />);

    expect(screen.getByText(/暂无会话历史/i)).toBeInTheDocument();
    expect(screen.getByText(/开始你的第一个专注会话吧/i)).toBeInTheDocument();
    expect(screen.queryByTestId('session-item')).not.toBeInTheDocument();
  });

  test('displays session details when clicking on a session', () => {
    render(<SessionHistory />);

    // Click on the first session
    const firstSession = screen.getAllByTestId('session-item')[0];
    fireEvent.click(firstSession);

    // Verify session details modal opens
    expect(screen.getByText(/会话详情/i)).toBeInTheDocument();
    expect(screen.getByText(/完成项目文档/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /关闭/i })).toBeInTheDocument();
  });
})