import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimerStyleEditor from '../TimerStyleEditor';
import { timerStyleService } from '../../../services/timerStyle';

// Mock the timer style service
jest.mock('../../../services/timerStyle', () => ({
  timerStyleService: {
    getSettings: jest.fn(),
    getCurrentStyle: jest.fn(),
    addCustomStyle: jest.fn(),
    setCurrentStyle: jest.fn(),
    getBuiltinStyles: jest.fn(),
  },
}));

const mockTimerStyleService = timerStyleService as jest.Mocked<typeof timerStyleService>;

describe('TimerStyleEditor - Notification System', () => {
  const mockOnStyleChange = jest.fn();
  
  const mockCurrentStyle = {
    id: 'test-style',
    name: 'Test Style',
    description: 'Test Description',
    displayStyle: 'digital' as const,
    size: 'medium' as const,
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      background: '#ffffff',
      text: '#1f2937',
      accent: '#f59e0b',
      progress: '#10b981',
      progressBackground: '#e5e7eb',
    },
    background: {
      pattern: 'dots' as const,
      size: 'medium' as const,
      color: '#f3f4f6',
      opacity: 0.5,
    },
    particles: {
      enabled: true,
      effect: 'floating' as const,
      count: 20,
      color: '#3b82f6',
      opacity: 0.6,
    },
    decoration: {
      enabled: true,
      element: 'circles' as const,
      count: 5,
      color: '#f59e0b',
      opacity: 0.4,
    },
    animations: {
      enabled: true,
      pulseOnStateChange: true,
      breathingEffect: false,
      rotationEffect: false,
      transitionDuration: 300,
      easing: 'ease-in-out',
    },
    layout: {
      alignment: 'center' as const,
      spacing: 'normal' as const,
      showStateText: true,
      showProgressPercentage: true,
      showStatusIndicator: true,
    },
    responsive: {
      enabled: true,
      breakpoints: {
        mobile: {},
        tablet: {},
        desktop: {},
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockTimerStyleService.getSettings.mockReturnValue({
      currentStyleId: 'test-style',
      customStyles: [mockCurrentStyle],
      previewStyleId: null,
    });
    mockTimerStyleService.getCurrentStyle.mockReturnValue(mockCurrentStyle);
    mockTimerStyleService.addCustomStyle.mockReturnValue(true);
    mockTimerStyleService.getBuiltinStyles.mockReturnValue([mockCurrentStyle]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders without crashing', () => {
    render(<TimerStyleEditor onStyleChange={mockOnStyleChange} />);
    expect(screen.getByText('计时器样式编辑器')).toBeInTheDocument();
  });

  it('displays notification when style is saved successfully', async () => {
    mockTimerStyleService.addCustomStyle.mockReturnValue(true);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    
    render(<TimerStyleEditor onStyleChange={mockOnStyleChange} />);
    
    // Make a change to trigger save
    const nameInput = screen.getByDisplayValue('Test Style');
    await user.clear(nameInput);
    await user.type(nameInput, 'New Style Name');
    
    const saveButton = screen.getByText('保存样式');
    await user.click(saveButton);
    
    // Check for success notification
    expect(screen.getByText('样式保存成功！')).toBeInTheDocument();
    
    // Verify notification disappears after timeout
    jest.advanceTimersByTime(3000);
    await waitFor(() => {
      expect(screen.queryByText('样式保存成功！')).not.toBeInTheDocument();
    });
  });

  it('displays error notification when style save fails', async () => {
    mockTimerStyleService.addCustomStyle.mockReturnValue(false);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    
    render(<TimerStyleEditor onStyleChange={mockOnStyleChange} />);
    
    // Make a change to trigger save
    const nameInput = screen.getByDisplayValue('Test Style');
    await user.clear(nameInput);
    await user.type(nameInput, 'New Style Name');
    
    const saveButton = screen.getByText('保存样式');
    await user.click(saveButton);
    
    // Check for error notification
    expect(screen.getByText('保存样式失败，请重试。')).toBeInTheDocument();
    
    // Verify notification has error styling
    const notification = screen.getByText('保存样式失败，请重试。').closest('div');
    expect(notification).toHaveClass('bg-red-500');
  });

  it('shows confirmation dialog when resetting changes', async () => {
    const user = userEvent.setup();
    
    render(<TimerStyleEditor onStyleChange={mockOnStyleChange} />);
    
    // Make a change first
    const nameInput = screen.getByDisplayValue('Test Style');
    await user.clear(nameInput);
    await user.type(nameInput, 'Modified Name');
    
    // Click reset button
    const resetButton = screen.getByText('重置更改');
    await user.click(resetButton);
    
    // Check for confirmation dialog
    expect(screen.getByText('重置更改')).toBeInTheDocument();
    expect(screen.getByText('确定要重置所有更改吗？此操作无法撤销。')).toBeInTheDocument();
    expect(screen.getByText('取消')).toBeInTheDocument();
    expect(screen.getByText('确认')).toBeInTheDocument();
  });

  it('handles confirmation dialog acceptance', async () => {
    const user = userEvent.setup();
    
    render(<TimerStyleEditor onStyleChange={mockOnStyleChange} />);
    
    // Make a change first
    const nameInput = screen.getByDisplayValue('Test Style');
    await user.clear(nameInput);
    await user.type(nameInput, 'Modified Name');
    
    // Click reset button
    const resetButton = screen.getByText('重置更改');
    await user.click(resetButton);
    
    // Confirm the reset
    const confirmButton = screen.getByText('确认');
    await user.click(confirmButton);
    
    // Dialog should disappear
    await waitFor(() => {
      expect(screen.queryByText('确定要重置所有更改吗？此操作无法撤销。')).not.toBeInTheDocument();
    });
    
    // Input should be reset to original value
    expect(screen.getByDisplayValue('Test Style')).toBeInTheDocument();
  });

  it('handles confirmation dialog cancellation', async () => {
    const user = userEvent.setup();
    
    render(<TimerStyleEditor onStyleChange={mockOnStyleChange} />);
    
    // Make a change first
    const nameInput = screen.getByDisplayValue('Test Style');
    await user.clear(nameInput);
    await user.type(nameInput, 'Modified Name');
    
    // Click reset button
    const resetButton = screen.getByText('重置更改');
    await user.click(resetButton);
    
    // Cancel the reset
    const cancelButton = screen.getByText('取消');
    await user.click(cancelButton);
    
    // Dialog should disappear
    await waitFor(() => {
      expect(screen.queryByText('确定要重置所有更改吗？此操作无法撤销。')).not.toBeInTheDocument();
    });
    
    // Input should keep the modified value
    expect(screen.getByDisplayValue('Modified Name')).toBeInTheDocument();
  });

  it('notification system uses proper accessibility attributes', async () => {
    mockTimerStyleService.addCustomStyle.mockReturnValue(true);
    const user = userEvent.setup();
    
    render(<TimerStyleEditor onStyleChange={mockOnStyleChange} />);
    
    // Trigger a notification
    const saveButton = screen.getByText('保存样式');
    await user.click(saveButton);
    
    // Check notification accessibility
    const notification = screen.getByText('样式保存成功！').closest('div');
    expect(notification).toHaveAttribute('role', 'alert');
    expect(notification).toHaveClass('fixed', 'top-4', 'right-4', 'z-50');
  });

  it('confirmation dialog has proper accessibility attributes', async () => {
    const user = userEvent.setup();
    
    render(<TimerStyleEditor onStyleChange={mockOnStyleChange} />);
    
    // Trigger confirmation dialog
    const resetButton = screen.getByText('重置更改');
    await user.click(resetButton);
    
    // Check dialog accessibility
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    
    const confirmButton = screen.getByText('确认');
    const cancelButton = screen.getByText('取消');
    
    expect(confirmButton).toHaveAttribute('type', 'button');
    expect(cancelButton).toHaveAttribute('type', 'button');
  });

  it('cleans up notification timeout on unmount', () => {
    const { unmount } = render(<TimerStyleEditor onStyleChange={mockOnStyleChange} />);
    
    // Trigger a notification
    const saveButton = screen.getByText('保存样式');
    fireEvent.click(saveButton);
    
    // Unmount component
    unmount();
    
    // Fast-forward time to ensure timeout would have fired
    jest.advanceTimersByTime(5000);
    
    // No errors should occur (timeout should be cleaned up)
  });

  it('handles multiple rapid notifications correctly', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    
    render(<TimerStyleEditor onStyleChange={mockOnStyleChange} />);
    
    // Trigger multiple notifications rapidly
    const saveButton = screen.getByText('保存样式');
    await user.click(saveButton);
    await user.click(saveButton);
    await user.click(saveButton);
    
    // Should only show one notification at a time
    const notifications = screen.getAllByText('样式保存成功！');
    expect(notifications).toHaveLength(1);
  });
});
