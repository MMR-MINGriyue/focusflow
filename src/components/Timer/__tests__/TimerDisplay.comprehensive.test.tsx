/**
 * TimerDisplay 组件全面测试
 * 补充边界情况、错误处理和性能测试
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TimerDisplay from '../TimerDisplay';

// Mock dependencies
jest.mock('../../../services/timerStyle', () => ({
  timerStyleService: {
    getCurrentStyle: jest.fn(() => ({
      id: 'test-style',
      name: 'Test Style',
      displayStyle: 'digital',
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        background: '#ffffff',
        text: '#1e293b',
        accent: '#06b6d4',
        progress: '#10b981',
        progressBackground: '#e5e7eb'
      },
      layout: {
        alignment: 'center',
        spacing: 'normal',
        showStatusIndicator: true,
        showProgressPercentage: true,
        showStateText: true
      },
      animations: {
        enabled: true,
        transitionDuration: 300,
        easing: 'ease-in-out',
        pulseOnStateChange: true,
        breathingEffect: false,
        rotationEffect: false
      },
      size: 'large',
      numberStyle: 'standard',
      progressStyle: 'linear',
      particles: {
        enabled: false,
        count: 0,
        speed: 1,
        size: 2,
        color: '#3b82f6'
      },
      background: {
        pattern: 'none',
        opacity: 0.1,
        color: '#f8fafc'
      }
    })),
    getStyleForState: jest.fn((state) => ({
      id: 'test-style',
      name: 'Test Style',
      displayStyle: 'digital',
      colors: {
        primary: state === 'focus' ? '#3b82f6' : '#ef4444',
        secondary: '#64748b',
        background: '#ffffff',
        text: '#1e293b',
        accent: '#06b6d4',
        progress: '#10b981',
        progressBackground: '#e5e7eb'
      },
      layout: {
        alignment: 'center',
        spacing: 'normal',
        showStatusIndicator: true,
        showProgressPercentage: true,
        showStateText: true
      },
      animations: {
        enabled: true,
        transitionDuration: 300,
        easing: 'ease-in-out',
        pulseOnStateChange: true,
        breathingEffect: false,
        rotationEffect: false
      },
      size: 'large',
      numberStyle: 'standard',
      progressStyle: 'linear',
      particles: {
        enabled: false,
        count: 0,
        speed: 1,
        size: 2,
        color: '#3b82f6'
      },
      background: {
        pattern: 'none',
        opacity: 0.1,
        color: '#f8fafc'
      }
    })),
    addListener: jest.fn(),
    removeListener: jest.fn()
  }
}));

jest.mock('../../../utils/performance', () => ({
  usePerformanceMonitor: jest.fn(() => ({
    recordUpdate: jest.fn()
  })),
  getAdaptivePerformanceConfig: jest.fn(() => ({
    enableAnimations: true,
    particleCount: 20,
    animationDuration: 300,
    enableBackgroundEffects: true,
    enableComplexDecorations: true,
    maxConcurrentAnimations: 3,
    enablePerformanceMonitoring: true
  })),
  throttle: jest.fn((fn) => fn)
}));

jest.mock('../BackgroundEffects', () => {
  return function MockBackgroundEffects() {
    return <div data-testid="background-effects">Background Effects</div>;
  };
});

describe('TimerDisplay Comprehensive Tests', () => {
  const defaultProps = {
    time: 1500, // 25 minutes in seconds
    formattedTime: '25:00',
    currentState: 'focus' as const,
    progress: 50,
    isActive: true,
    stateText: '专注时间'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.innerWidth for responsive tests
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('handles zero time correctly', () => {
      render(
        <TimerDisplay
          {...defaultProps}
          time={0}
          formattedTime="00:00"
          progress={100}
        />
      );

      expect(screen.getByText('00:00')).toBeInTheDocument();
    });

    it('handles very large time values', () => {
      render(
        <TimerDisplay
          {...defaultProps}
          time={359999} // 99:59:59
          formattedTime="99:59:59"
          progress={0}
        />
      );

      expect(screen.getByText('99:59:59')).toBeInTheDocument();
    });

    it('handles negative progress values', () => {
      render(
        <TimerDisplay
          {...defaultProps}
          progress={-10}
        />
      );

      // Should clamp to 0
      const progressElement = screen.getByRole('progressbar');
      expect(progressElement).toHaveAttribute('aria-valuenow', '0');
    });

    it('handles progress values over 100', () => {
      render(
        <TimerDisplay
          {...defaultProps}
          progress={150}
        />
      );

      // Should clamp to 100
      const progressElement = screen.getByRole('progressbar');
      expect(progressElement).toHaveAttribute('aria-valuenow', '100');
    });

    it('handles empty or invalid formatted time', () => {
      render(
        <TimerDisplay
          {...defaultProps}
          formattedTime=""
        />
      );

      // Should still render without crashing
      expect(screen.getByRole('timer')).toBeInTheDocument();
    });

    it('handles undefined stateText gracefully', () => {
      render(
        <TimerDisplay
          {...defaultProps}
          stateText=""
        />
      );

      expect(screen.getByRole('timer')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('adapts to mobile screen size', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600, // Mobile size
      });

      render(<TimerDisplay {...defaultProps} />);

      // Trigger resize event
      fireEvent(window, new Event('resize'));

      expect(screen.getByRole('timer')).toBeInTheDocument();
    });

    it('adapts to tablet screen size', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800, // Tablet size
      });

      render(<TimerDisplay {...defaultProps} />);

      fireEvent(window, new Event('resize'));

      expect(screen.getByRole('timer')).toBeInTheDocument();
    });

    it('adapts to desktop screen size', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200, // Desktop size
      });

      render(<TimerDisplay {...defaultProps} />);

      fireEvent(window, new Event('resize'));

      expect(screen.getByRole('timer')).toBeInTheDocument();
    });
  });

  describe('State Transitions', () => {
    it('handles state change from focus to break', () => {
      const { rerender } = render(<TimerDisplay {...defaultProps} />);

      rerender(
        <TimerDisplay
          {...defaultProps}
          currentState="break"
          stateText="休息时间"
        />
      );

      expect(screen.getByText('休息时间')).toBeInTheDocument();
    });

    it('handles state change to microBreak', () => {
      const { rerender } = render(<TimerDisplay {...defaultProps} />);

      rerender(
        <TimerDisplay
          {...defaultProps}
          currentState="microBreak"
          stateText="微休息"
        />
      );

      expect(screen.getByText('微休息')).toBeInTheDocument();
    });

    it('handles rapid state changes', () => {
      const { rerender } = render(<TimerDisplay {...defaultProps} />);

      // Rapidly change states
      rerender(<TimerDisplay {...defaultProps} currentState="break" />);
      rerender(<TimerDisplay {...defaultProps} currentState="microBreak" />);
      rerender(<TimerDisplay {...defaultProps} currentState="focus" />);

      expect(screen.getByRole('timer')).toBeInTheDocument();
    });
  });

  describe('Performance Monitoring', () => {
    it('records performance updates', () => {
      const mockRecordUpdate = jest.fn();
      const mockUsePerformanceMonitor = require('../../../utils/performance').usePerformanceMonitor;
      mockUsePerformanceMonitor.mockReturnValue({ recordUpdate: mockRecordUpdate });

      render(<TimerDisplay {...defaultProps} />);

      expect(mockRecordUpdate).toHaveBeenCalled();
    });

    it('handles performance monitoring errors gracefully', () => {
      const mockUsePerformanceMonitor = require('../../../utils/performance').usePerformanceMonitor;
      mockUsePerformanceMonitor.mockImplementation(() => {
        throw new Error('Performance monitoring failed');
      });

      expect(() => render(<TimerDisplay {...defaultProps} />)).not.toThrow();
    });
  });

  describe('Style Service Integration', () => {
    it('handles style service errors gracefully', () => {
      const mockTimerStyleService = require('../../../services/timerStyle').timerStyleService;
      mockTimerStyleService.getCurrentStyle.mockImplementation(() => {
        throw new Error('Style service error');
      });

      expect(() => render(<TimerDisplay {...defaultProps} />)).not.toThrow();
    });

    it('updates when style changes', () => {
      const mockTimerStyleService = require('../../../services/timerStyle').timerStyleService;
      const mockAddListener = mockTimerStyleService.addListener;
      
      render(<TimerDisplay {...defaultProps} />);

      expect(mockAddListener).toHaveBeenCalled();
    });

    it('cleans up style listeners on unmount', () => {
      const mockTimerStyleService = require('../../../services/timerStyle').timerStyleService;
      const mockRemoveListener = mockTimerStyleService.removeListener;
      
      const { unmount } = render(<TimerDisplay {...defaultProps} />);
      unmount();

      expect(mockRemoveListener).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels', () => {
      render(<TimerDisplay {...defaultProps} />);

      const timer = screen.getByRole('timer');
      expect(timer).toHaveAttribute('aria-label');

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow');
      expect(progressbar).toHaveAttribute('aria-valuemin');
      expect(progressbar).toHaveAttribute('aria-valuemax');
    });

    it('updates ARIA values when progress changes', () => {
      const { rerender } = render(<TimerDisplay {...defaultProps} progress={25} />);

      let progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '25');

      rerender(<TimerDisplay {...defaultProps} progress={75} />);

      progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '75');
    });

    it('provides screen reader friendly time format', () => {
      render(<TimerDisplay {...defaultProps} formattedTime="25:30" />);

      const timer = screen.getByRole('timer');
      expect(timer).toHaveAttribute('aria-label', expect.stringContaining('25:30'));
    });
  });

  describe('Memory Management', () => {
    it('cleans up event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(<TimerDisplay {...defaultProps} />);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('handles multiple mount/unmount cycles', () => {
      const { unmount, rerender } = render(<TimerDisplay {...defaultProps} />);
      
      unmount();
      rerender(<TimerDisplay {...defaultProps} />);
      unmount();
      rerender(<TimerDisplay {...defaultProps} />);

      // Should not throw errors
      expect(screen.getByRole('timer')).toBeInTheDocument();
    });
  });

  describe('Custom CSS Classes', () => {
    it('applies custom className', () => {
      render(<TimerDisplay {...defaultProps} className="custom-timer" />);

      const timer = screen.getByRole('timer');
      expect(timer).toHaveClass('custom-timer');
    });

    it('handles multiple CSS classes', () => {
      render(<TimerDisplay {...defaultProps} className="class1 class2 class3" />);

      const timer = screen.getByRole('timer');
      expect(timer).toHaveClass('class1', 'class2', 'class3');
    });
  });
});
