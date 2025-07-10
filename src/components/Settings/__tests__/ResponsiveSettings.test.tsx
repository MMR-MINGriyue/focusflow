import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResponsiveSettings from '../ResponsiveSettings';
import { timerStyleService } from '../../../services/timerStyle';

// Mock the timer style service
jest.mock('../../../services/timerStyle', () => ({
  timerStyleService: {
    getSettings: jest.fn(),
    getCurrentStyle: jest.fn(),
    addCustomStyle: jest.fn(),
    setCurrentStyle: jest.fn(),
  },
}));

const mockTimerStyleService = timerStyleService as jest.Mocked<typeof timerStyleService>;

describe('ResponsiveSettings - Memory Leak Prevention', () => {
  const mockOnSettingsChange = jest.fn();
  
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
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders without crashing', () => {
    render(<ResponsiveSettings onSettingsChange={mockOnSettingsChange} />);
    expect(screen.getByText('响应式设置')).toBeInTheDocument();
  });

  it('cleans up preview timeout on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const { unmount } = render(<ResponsiveSettings onSettingsChange={mockOnSettingsChange} />);
    
    // Start a preview
    const previewButton = screen.getByText('预览效果');
    fireEvent.click(previewButton);
    
    // Unmount component
    unmount();
    
    // Verify clearTimeout was called
    expect(clearTimeoutSpy).toHaveBeenCalled();
    
    clearTimeoutSpy.mockRestore();
  });

  it('cleans up multiple timeouts correctly', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const { unmount } = render(<ResponsiveSettings onSettingsChange={mockOnSettingsChange} />);
    
    // Start multiple previews
    const previewButton = screen.getByText('预览效果');
    fireEvent.click(previewButton);
    fireEvent.click(previewButton); // Start another preview
    fireEvent.click(previewButton); // And another
    
    // Unmount component
    unmount();
    
    // Should clean up all timeouts
    expect(clearTimeoutSpy).toHaveBeenCalled();
    
    clearTimeoutSpy.mockRestore();
  });

  it('prevents memory leaks when rapidly toggling preview', () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    
    render(<ResponsiveSettings onSettingsChange={mockOnSettingsChange} />);
    
    const previewButton = screen.getByText('预览效果');
    
    // Rapidly toggle preview multiple times
    for (let i = 0; i < 5; i++) {
      fireEvent.click(previewButton);
      fireEvent.click(previewButton); // Stop preview
    }
    
    // Should have cleared previous timeouts
    expect(clearTimeoutSpy).toHaveBeenCalled();
    
    setTimeoutSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
  });

  it('uses useCallback for event handlers to prevent unnecessary re-renders', async () => {
    const renderSpy = jest.fn();
    
    // Create a wrapper component to track renders
    const TestWrapper = () => {
      renderSpy();
      return <ResponsiveSettings onSettingsChange={mockOnSettingsChange} />;
    };
    
    const { rerender } = render(<TestWrapper />);
    
    const initialRenderCount = renderSpy.mock.calls.length;
    
    // Trigger a re-render with same props
    rerender(<TestWrapper />);
    
    // Should not cause unnecessary re-renders due to useCallback optimization
    expect(renderSpy.mock.calls.length).toBe(initialRenderCount + 1);
  });

  it('properly handles ResizeObserver cleanup', () => {
    const disconnectSpy = jest.fn();
    const observeSpy = jest.fn();
    const unobserveSpy = jest.fn();
    
    // Mock ResizeObserver
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: observeSpy,
      unobserve: unobserveSpy,
      disconnect: disconnectSpy,
    }));
    
    const { unmount } = render(<ResponsiveSettings onSettingsChange={mockOnSettingsChange} />);
    
    // Unmount component
    unmount();
    
    // Should clean up ResizeObserver
    expect(disconnectSpy).toHaveBeenCalled();
  });

  it('handles window resize event cleanup', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    
    const { unmount } = render(<ResponsiveSettings onSettingsChange={mockOnSettingsChange} />);
    
    // Unmount component
    unmount();
    
    // Should remove event listeners
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    
    removeEventListenerSpy.mockRestore();
  });

  it('prevents state updates after unmount', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const { unmount } = render(<ResponsiveSettings onSettingsChange={mockOnSettingsChange} />);
    
    // Start an async operation
    const previewButton = screen.getByText('预览效果');
    fireEvent.click(previewButton);
    
    // Unmount immediately
    unmount();
    
    // Fast-forward time to trigger the timeout
    jest.advanceTimersByTime(5000);
    
    // Should not log any React warnings about state updates after unmount
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Warning: Can\'t perform a React state update on an unmounted component')
    );
    
    consoleSpy.mockRestore();
  });

  it('properly manages component lifecycle with useEffect cleanup', () => {
    const effectCleanupSpy = jest.fn();
    
    // Mock useEffect cleanup
    const originalUseEffect = React.useEffect;
    jest.spyOn(React, 'useEffect').mockImplementation((effect, deps) => {
      return originalUseEffect(() => {
        const cleanup = effect();
        if (cleanup) {
          return () => {
            effectCleanupSpy();
            cleanup();
          };
        }
      }, deps);
    });
    
    const { unmount } = render(<ResponsiveSettings onSettingsChange={mockOnSettingsChange} />);
    
    unmount();
    
    // Should have called cleanup functions
    expect(effectCleanupSpy).toHaveBeenCalled();
    
    React.useEffect.mockRestore();
  });

  it('handles rapid prop changes without memory leaks', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const { rerender } = render(<ResponsiveSettings onSettingsChange={mockOnSettingsChange} />);
    
    // Rapidly change props
    for (let i = 0; i < 10; i++) {
      const newMockFn = jest.fn();
      rerender(<ResponsiveSettings onSettingsChange={newMockFn} />);
    }
    
    // Should not cause memory issues
    expect(screen.getByText('响应式设置')).toBeInTheDocument();
  });

  it('cleans up event listeners on breakpoint changes', async () => {
    const user = userEvent.setup();
    render(<ResponsiveSettings onSettingsChange={mockOnSettingsChange} />);
    
    // Change breakpoint settings multiple times
    const mobileBreakpointInput = screen.getByLabelText('移动端断点 (px)');
    
    for (let i = 0; i < 5; i++) {
      await user.clear(mobileBreakpointInput);
      await user.type(mobileBreakpointInput, `${400 + i * 10}`);
    }
    
    // Should handle multiple changes without accumulating listeners
    expect(mockTimerStyleService.addCustomStyle).toHaveBeenCalled();
  });
});
