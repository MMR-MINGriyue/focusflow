/**
 * TimerDisplay 事件监听器清理测试
 * 
 * 验证组件卸载时事件监听器的正确清理
 */

import React from 'react';
import { render, unmount } from '@testing-library/react';
import { testUtils } from '../../../tests/utils/testUtils';
import TimerDisplay from '../TimerDisplay';

// Mock dependencies
jest.mock('../../../services/timerStyle', () => ({
  timerStyleService: {
    getCurrentStyle: jest.fn(() => testUtils.generateTimerStyle()),
    getStyleForState: jest.fn(() => testUtils.generateTimerStyle()),
    getSettings: jest.fn(() => ({
      currentStyleId: 'digital-modern',
      customStyles: [],
      previewMode: false,
      autoSwitchByState: false,
    })),
    addListener: jest.fn(),
    removeListener: jest.fn(),
  },
}));

jest.mock('../../../utils/performance', () => ({
  usePerformanceMonitor: jest.fn(() => ({
    recordUpdate: jest.fn(),
    getMetrics: jest.fn(() => ({ averageRenderTime: 10 })),
  })),
  getAdaptivePerformanceConfig: jest.fn(() => ({
    enableAnimations: true,
    enableParticles: false,
    enableBackgroundEffects: false,
  })),
  throttle: jest.fn((fn) => fn),
}));

describe('TimerDisplay Event Cleanup Tests', () => {
  const mockTimerStyleService = require('../../../services/timerStyle').timerStyleService;
  
  // Mock window methods
  const originalAddEventListener = window.addEventListener;
  const originalRemoveEventListener = window.removeEventListener;
  
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Spy on window event methods
    addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    // Restore original methods
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  const defaultProps = {
    time: 1500000,
    formattedTime: '25:00',
    currentState: 'focus' as const,
    progress: 50,
    isActive: true,
    stateText: '专注中',
  };

  // ==================== RESIZE EVENT LISTENER TESTS ====================
  describe('Resize Event Listener Cleanup', () => {
    it('adds resize event listener on mount', () => {
      // Act
      render(<TimerDisplay {...defaultProps} />);

      // Assert
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('removes resize event listener on unmount', () => {
      // Arrange
      const { unmount } = render(<TimerDisplay {...defaultProps} />);
      
      // Get the handler that was added
      const addCalls = addEventListenerSpy.mock.calls.filter(call => call[0] === 'resize');
      expect(addCalls.length).toBeGreaterThan(0);
      
      const resizeHandler = addCalls[0][1];

      // Act
      unmount();

      // Assert
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', resizeHandler);
    });

    it('cleans up resize timeout on unmount', () => {
      // Arrange
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const { unmount } = render(<TimerDisplay {...defaultProps} />);

      // Act
      unmount();

      // Assert - clearTimeout should be called (even if timeout is undefined)
      expect(clearTimeoutSpy).toHaveBeenCalled();
      
      clearTimeoutSpy.mockRestore();
    });

    it('handles multiple mount/unmount cycles correctly', () => {
      // Act - Multiple mount/unmount cycles
      for (let i = 0; i < 3; i++) {
        const { unmount } = render(<TimerDisplay {...defaultProps} />);
        unmount();
      }

      // Assert - Each mount should add a listener, each unmount should remove it
      const addCalls = addEventListenerSpy.mock.calls.filter(call => call[0] === 'resize');
      const removeCalls = removeEventListenerSpy.mock.calls.filter(call => call[0] === 'resize');
      
      expect(addCalls.length).toBe(3);
      expect(removeCalls.length).toBe(3);
    });
  });

  // ==================== TIMER STYLE SERVICE LISTENER TESTS ====================
  describe('Timer Style Service Listener Cleanup', () => {
    it('adds style service listener on mount', () => {
      // Act
      render(<TimerDisplay {...defaultProps} />);

      // Assert
      expect(mockTimerStyleService.addListener).toHaveBeenCalledWith(expect.any(Function));
    });

    it('removes style service listener on unmount', () => {
      // Arrange
      const { unmount } = render(<TimerDisplay {...defaultProps} />);

      // Act
      unmount();

      // Assert
      expect(mockTimerStyleService.removeListener).toHaveBeenCalledWith(expect.any(Function));
    });

    it('cleans up style change timeout on unmount', () => {
      // Arrange
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const { unmount } = render(<TimerDisplay {...defaultProps} />);

      // Act
      unmount();

      // Assert
      expect(clearTimeoutSpy).toHaveBeenCalled();
      
      clearTimeoutSpy.mockRestore();
    });

    it('handles listener cleanup when currentState changes', () => {
      // Arrange
      const { rerender } = render(<TimerDisplay {...defaultProps} currentState="focus" />);

      // Act - Change currentState to trigger effect cleanup
      rerender(<TimerDisplay {...defaultProps} currentState="break" />);

      // Assert - Should remove old listener and add new one
      expect(mockTimerStyleService.removeListener).toHaveBeenCalled();
      expect(mockTimerStyleService.addListener).toHaveBeenCalledTimes(2);
    });
  });

  // ==================== PERFORMANCE MONITOR CLEANUP TESTS ====================
  describe('Performance Monitor Cleanup', () => {
    it('uses performance monitor correctly', () => {
      // Arrange
      const mockUsePerformanceMonitor = require('../../../utils/performance').usePerformanceMonitor;

      // Act
      render(<TimerDisplay {...defaultProps} />);

      // Assert
      expect(mockUsePerformanceMonitor).toHaveBeenCalledWith('TimerDisplay');
    });

    it('calls recordUpdate when style changes', () => {
      // Arrange
      const mockRecordUpdate = jest.fn();
      require('../../../utils/performance').usePerformanceMonitor.mockReturnValue({
        recordUpdate: mockRecordUpdate,
        getMetrics: jest.fn(() => ({ averageRenderTime: 10 })),
      });

      const { rerender } = render(<TimerDisplay {...defaultProps} />);

      // Act - Change props to trigger style update
      rerender(<TimerDisplay {...defaultProps} currentState="break" />);

      // Assert
      expect(mockRecordUpdate).toHaveBeenCalled();
    });
  });

  // ==================== MEMORY LEAK PREVENTION TESTS ====================
  describe('Memory Leak Prevention', () => {
    it('does not accumulate event listeners with multiple renders', () => {
      // Arrange
      const component = render(<TimerDisplay {...defaultProps} />);

      // Act - Multiple re-renders
      for (let i = 0; i < 5; i++) {
        component.rerender(<TimerDisplay {...defaultProps} time={1500000 - i * 1000} />);
      }

      // Assert - Should only have one resize listener
      const addCalls = addEventListenerSpy.mock.calls.filter(call => call[0] === 'resize');
      expect(addCalls.length).toBe(1);
    });

    it('cleans up all resources on unmount', () => {
      // Arrange
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const { unmount } = render(<TimerDisplay {...defaultProps} />);

      // Act
      unmount();

      // Assert - All cleanup methods should be called
      expect(removeEventListenerSpy).toHaveBeenCalled();
      expect(mockTimerStyleService.removeListener).toHaveBeenCalled();
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });

    it('handles rapid mount/unmount cycles without errors', () => {
      // Act - Rapid mount/unmount cycles
      expect(() => {
        for (let i = 0; i < 10; i++) {
          const { unmount } = render(<TimerDisplay {...defaultProps} />);
          unmount();
        }
      }).not.toThrow();

      // Assert - Should have equal number of add/remove calls
      const addCalls = addEventListenerSpy.mock.calls.filter(call => call[0] === 'resize');
      const removeCalls = removeEventListenerSpy.mock.calls.filter(call => call[0] === 'resize');
      
      expect(addCalls.length).toBe(removeCalls.length);
    });
  });

  // ==================== ERROR HANDLING TESTS ====================
  describe('Error Handling in Cleanup', () => {
    it('handles removeEventListener errors gracefully', () => {
      // Arrange
      removeEventListenerSpy.mockImplementation(() => {
        throw new Error('removeEventListener failed');
      });

      const { unmount } = render(<TimerDisplay {...defaultProps} />);

      // Act & Assert - Should not throw
      expect(() => unmount()).not.toThrow();
    });

    it('handles timerStyleService.removeListener errors gracefully', () => {
      // Arrange
      mockTimerStyleService.removeListener.mockImplementation(() => {
        throw new Error('removeListener failed');
      });

      const { unmount } = render(<TimerDisplay {...defaultProps} />);

      // Act & Assert - Should not throw
      expect(() => unmount()).not.toThrow();
    });

    it('continues cleanup even if one cleanup step fails', () => {
      // Arrange
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      removeEventListenerSpy.mockImplementation(() => {
        throw new Error('removeEventListener failed');
      });

      const { unmount } = render(<TimerDisplay {...defaultProps} />);

      // Act
      expect(() => unmount()).not.toThrow();

      // Assert - Other cleanup should still happen
      expect(mockTimerStyleService.removeListener).toHaveBeenCalled();
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });
  });
});
