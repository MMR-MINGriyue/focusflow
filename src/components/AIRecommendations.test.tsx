import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import AIRecommendations from './AIRecommendations';
import { useAIRecommendationStore } from '../../stores/aiRecommendationStore';

// Mock the store
vi.mock('../../stores/aiRecommendationStore');

describe('AIRecommendations Component', () => {
  const mockRecommendations = [
    {
      id: '1',
      title: '专注模式优化',
      description: '根据您的使用习惯，建议将专注时长调整为30分钟',
      type: 'focus_optimization',
      priority: 'high',
    },
    {
      id: '2',
      title: '休息提醒设置',
      description: '添加自定义休息提醒声音以提高警觉性',
      type: 'break_setting',
      priority: 'medium',
    },
  ];

  const mockStore = {
    recommendations: mockRecommendations,
    isLoading: false,
    error: null,
    fetchRecommendations: vi.fn(),
    dismissRecommendation: vi.fn(),
    applyRecommendation: vi.fn(),
  };

  beforeEach(() => {
    (useAIRecommendationStore as jest.Mock).mockReturnValue({
      ...mockStore,
      // Reset mocks before each test
      fetchRecommendations: vi.fn(),
      dismissRecommendation: vi.fn(),
      applyRecommendation: vi.fn(),
    });
  });

  test('renders recommendations when data is available', () => {
    render(<AIRecommendations />);

    // Check if recommendations are rendered
    mockRecommendations.forEach(rec => {
      expect(screen.getByText(rec.title)).toBeInTheDocument();
      expect(screen.getByText(rec.description)).toBeInTheDocument();
    });

    // Check if action buttons are present
    expect(screen.getAllByRole('button', { name: /应用/i })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /忽略/i })).toHaveLength(2);
  });

  test('shows loading state when fetching recommendations', () => {
    (useAIRecommendationStore as jest.Mock).mockReturnValue({
      ...mockStore,
      isLoading: true,
      recommendations: [],
    });

    render(<AIRecommendations />);

    // Check if loading indicator is shown
    expect(screen.getByText(/加载中/i)).toBeInTheDocument();
    expect(screen.queryByText(mockRecommendations[0].title)).not.toBeInTheDocument();
  });

  test('shows error message when recommendations fail to load', () => {
    const errorMessage = '无法加载推荐，请检查网络连接';
    (useAIRecommendationStore as jest.Mock).mockReturnValue({
      ...mockStore,
      isLoading: false,
      error: errorMessage,
      recommendations: [],
    });

    render(<AIRecommendations />);

    // Check if error message is shown
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /重试/i })).toBeInTheDocument();
  });

  test('calls applyRecommendation when apply button is clicked', async () => {
    const mockApply = vi.fn();
    (useAIRecommendationStore as jest.Mock).mockReturnValue({
      ...mockStore,
      applyRecommendation: mockApply,
    });

    render(<AIRecommendations />);

    // Click the first apply button
    fireEvent.click(screen.getAllByRole('button', { name: /应用/i })[0]);

    // Check if apply function is called with correct id
    expect(mockApply).toHaveBeenCalledWith('1');
  });

  test('calls dismissRecommendation when dismiss button is clicked', async () => {
    const mockDismiss = vi.fn();
    (useAIRecommendationStore as jest.Mock).mockReturnValue({
      ...mockStore,
      dismissRecommendation: mockDismiss,
    });

    render(<AIRecommendations />);

    // Click the first dismiss button
    fireEvent.click(screen.getAllByRole('button', { name: /忽略/i })[0]);

    // Check if dismiss function is called with correct id
    expect(mockDismiss).toHaveBeenCalledWith('1');
  });

  test('fetches recommendations on mount', () => {
    const mockFetch = vi.fn();
    (useAIRecommendationStore as jest.Mock).mockReturnValue({
      ...mockStore,
      fetchRecommendations: mockFetch,
    });

    render(<AIRecommendations />);

    // Check if fetch is called
    expect(mockFetch).toHaveBeenCalled();
  });
});