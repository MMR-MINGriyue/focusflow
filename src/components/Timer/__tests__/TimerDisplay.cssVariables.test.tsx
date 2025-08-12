/**
 * TimerDisplay CSS变量缓存测试
 * 
 * 验证CSS变量缓存优化的性能改进
 */

import React from 'react';
import { render } from '@testing-library/react';
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

describe('TimerDisplay CSS Variables Caching', () => {
  const defaultProps = {
    time: 1500000,
    formattedTime: '25:00',
    currentState: 'focus' as const,
    progress: 50,
    isActive: true,
    stateText: '专注中',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== CSS VARIABLES CACHING TESTS ====================
  describe('CSS Variables Performance', () => {
    it('uses cached CSS variables for consistent props', () => {
      // Arrange
      const props = defaultProps;

      // Act - Multiple renders with same props
      const { rerender } = render(<TimerDisplay {...props} />);
      
      // Get initial CSS variables
      const container1 = document.querySelector('.timer-display-container');
      const style1 = container1?.getAttribute('style');

      rerender(<TimerDisplay {...props} />);
      
      // Get CSS variables after rerender
      const container2 = document.querySelector('.timer-display-container');
      const style2 = container2?.getAttribute('style');

      // Assert - CSS variables should be consistent
      expect(style1).toBeDefined();
      expect(style2).toBeDefined();
      expect(style1).toBe(style2);
    });

    it('updates CSS variables only when relevant props change', () => {
      // Arrange
      const props = defaultProps;

      // Act - First render
      const { rerender } = render(<TimerDisplay {...props} />);
      const container1 = document.querySelector('.timer-display-container');
      const style1 = container1?.getAttribute('style');

      // Act - Rerender with same style-affecting props
      rerender(<TimerDisplay 
        {...props} 
        time={1499000} // Different time, but shouldn't affect CSS variables
        formattedTime="24:59"
        progress={51}
      />);
      
      const container2 = document.querySelector('.timer-display-container');
      const style2 = container2?.getAttribute('style');

      // Assert - CSS variables should remain the same
      expect(style1).toBe(style2);
    });

    it('updates CSS variables when state changes', () => {
      // Arrange
      const props = defaultProps;

      // Act - First render with focus state
      const { rerender } = render(<TimerDisplay {...props} currentState="focus" />);
      const container1 = document.querySelector('.timer-display-container');
      const style1 = container1?.getAttribute('style');

      // Act - Rerender with break state
      rerender(<TimerDisplay {...props} currentState="break" />);
      const container2 = document.querySelector('.timer-display-container');
      const style2 = container2?.getAttribute('style');

      // Assert - CSS variables should be different due to state change
      expect(style1).toBeDefined();
      expect(style2).toBeDefined();
      expect(style1).not.toBe(style2);
    });

    it('contains core required CSS variables', () => {
      // Arrange & Act
      render(<TimerDisplay {...defaultProps} />);
      const container = document.querySelector('.timer-display-container');
      const style = container?.getAttribute('style') || '';

      // Assert - Should contain core CSS variables
      const coreVariables = [
        '--timer-animation-duration',
        '--timer-state-color',
        '--timer-primary-color',
        '--timer-secondary-color',
        '--timer-background-color',
        '--timer-text-color',
        '--timer-font-size',
        '--timer-font-weight',
        '--timer-font-family'
      ];

      coreVariables.forEach(variable => {
        expect(style).toContain(variable);
      });

      // Check that style is not empty
      expect(style.length).toBeGreaterThan(0);
    });
  });

  // ==================== PERFORMANCE IMPACT TESTS ====================
  describe('Performance Impact', () => {
    it('reduces object creation overhead', () => {
      // Arrange
      const props = defaultProps;
      let objectCreationCount = 0;
      
      // Mock Object.assign to count object creations
      const originalAssign = Object.assign;
      Object.assign = jest.fn((...args) => {
        objectCreationCount++;
        return originalAssign(...args);
      });

      // Act - Multiple renders
      const { rerender } = render(<TimerDisplay {...props} />);
      const initialCount = objectCreationCount;
      
      rerender(<TimerDisplay {...props} />);
      rerender(<TimerDisplay {...props} />);
      const finalCount = objectCreationCount;

      // Restore original Object.assign
      Object.assign = originalAssign;

      // Assert - Object creation should be minimized
      const additionalCreations = finalCount - initialCount;
      expect(additionalCreations).toBeLessThan(10); // Allow some framework overhead
    });

    it('handles rapid prop changes efficiently', () => {
      // Arrange
      const baseProps = {
        currentState: 'focus' as const,
        isActive: true,
        stateText: '专注中',
      };

      // Act - Rapid time updates (common scenario)
      const start = performance.now();
      const { rerender } = render(<TimerDisplay 
        {...baseProps}
        time={1500}
        formattedTime="25:00"
        progress={0}
      />);

      for (let i = 1; i <= 30; i++) {
        const time = 1500 - i;
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        const progress = (i / 30) * 100;

        rerender(<TimerDisplay 
          {...baseProps}
          time={time}
          formattedTime={formattedTime}
          progress={progress}
        />);
      }
      const totalTime = performance.now() - start;

      // Assert - Should complete quickly
      expect(totalTime).toBeLessThan(200); // Should complete within 200ms
    });

    it('maintains consistent CSS variable format', () => {
      // Arrange
      const props = defaultProps;

      // Act
      render(<TimerDisplay {...props} />);
      const container = document.querySelector('.timer-display-container');
      const style = container?.getAttribute('style') || '';

      // Assert - CSS variables should have proper format
      expect(style).toMatch(/--timer-animation-duration:\s*\d+ms/);
      expect(style).toMatch(/--timer-state-color:\s*#[0-9a-fA-F]{6}/);
      expect(style).toMatch(/--timer-font-size:\s*[\d.]+rem/);
      expect(style).toMatch(/--timer-font-weight:\s*\d+/);
    });
  });

  // ==================== EDGE CASES ====================
  describe('Edge Cases', () => {
    it('handles undefined style properties gracefully', () => {
      // Arrange - Mock style service to return incomplete style
      const mockTimerStyleService = require('../../../services/timerStyle').timerStyleService;
      mockTimerStyleService.getStyleForState.mockReturnValue({
        ...testUtils.generateTimerStyle(),
        fontSize: undefined,
        fontWeight: undefined,
        fontFamily: undefined,
      });

      // Act
      render(<TimerDisplay {...defaultProps} />);
      const container = document.querySelector('.timer-display-container');
      const style = container?.getAttribute('style') || '';

      // Assert - Should use fallback values
      expect(style).toContain('--timer-font-size: 3rem');
      expect(style).toContain('--timer-font-weight: 600');
      expect(style).toContain('--timer-font-family: inherit');
    });

    it('handles rapid state changes without errors', () => {
      // Arrange
      const states: Array<'focus' | 'break' | 'microBreak'> = ['focus', 'break', 'microBreak'];
      
      // Act - Rapid state changes
      const { rerender } = render(<TimerDisplay {...defaultProps} currentState="focus" />);
      
      expect(() => {
        for (let i = 0; i < 20; i++) {
          const state = states[i % states.length];
          rerender(<TimerDisplay {...defaultProps} currentState={state} />);
        }
      }).not.toThrow();

      // Assert - Final render should be successful
      const container = document.querySelector('.timer-display-container');
      expect(container).toBeInTheDocument();
    });

    it('preserves CSS variable values across re-renders', () => {
      // Arrange
      const props = defaultProps;

      // Act
      const { rerender } = render(<TimerDisplay {...props} />);
      const container1 = document.querySelector('.timer-display-container');
      const stateColor1 = container1?.style.getPropertyValue('--timer-state-color');

      rerender(<TimerDisplay {...props} />);
      const container2 = document.querySelector('.timer-display-container');
      const stateColor2 = container2?.style.getPropertyValue('--timer-state-color');

      // Assert - Values should be preserved
      expect(stateColor1).toBeDefined();
      expect(stateColor2).toBeDefined();
      expect(stateColor1).toBe(stateColor2);
    });
  });
});
