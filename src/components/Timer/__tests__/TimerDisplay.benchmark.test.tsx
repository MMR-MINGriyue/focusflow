/**
 * TimerDisplay 性能基准测试
 * 
 * 目标：验证TimerDisplay组件渲染时间 < 16ms
 * 测试场景：初始渲染、更新渲染、样式切换、高频更新
 */

import React from 'react';
import { render, cleanup } from '@testing-library/react';
import TimerDisplay from '../TimerDisplay';
import { timerStyleService } from '../../../services/timerStyle';
import { performanceMonitor } from '../../../utils/performance';

// Mock dependencies
jest.mock('../../../services/timerStyle');
jest.mock('../../../utils/performance', () => ({
  performanceMonitor: {
    recordComponentUpdate: jest.fn(),
    startMonitoring: jest.fn(),
    stopMonitoring: jest.fn(),
    getMetrics: jest.fn(() => []),
    getPerformanceReport: jest.fn(() => ({
      averageFPS: 60,
      averageMemory: 10,
      averageRenderTime: 5,
      totalUpdates: 0,
      recommendations: []
    }))
  },
  usePerformanceMonitor: jest.fn(() => ({
    renderCount: 1,
    recordUpdate: jest.fn()
  })),
  getAdaptivePerformanceConfig: jest.fn(() => ({
    enableAnimations: true,
    enableEffects: true,
    maxFPS: 60
  })),
  throttle: jest.fn((fn) => fn)
}));
jest.mock('../BackgroundEffects', () => {
  return function MockBackgroundEffects() {
    return <div data-testid="background-effects" />;
  };
});

const mockTimerStyleService = timerStyleService as jest.Mocked<typeof timerStyleService>;

// 默认样式配置
const defaultStyle = {
  id: 'digital-modern',
  name: 'Digital Modern',
  displayStyle: 'digital' as const,
  colors: {
    primary: '#3b82f6',
    secondary: '#64748b',
    background: '#ffffff',
    text: '#1e293b',
    progressBackground: '#e2e8f0'
  },
  animations: {
    enabled: true,
    transitionDuration: 300,
    easing: 'ease-out',
    pulseOnStateChange: true,
    breathingEffect: false,
    glowEffect: false
  },
  layout: {
    showProgress: true,
    showStateText: true,
    showTimeRemaining: true,
    compactMode: false
  },
  fontSize: '3rem',
  fontWeight: '600',
  fontFamily: 'inherit'
};

// 测试用的props
const defaultProps = {
  time: 1500,
  formattedTime: '25:00',
  currentState: 'focus' as const,
  progress: 50,
  isActive: true,
  stateText: '专注时间'
};

describe('TimerDisplay Performance Benchmarks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cleanup();
    
    // Setup mocks
    mockTimerStyleService.getCurrentStyle.mockReturnValue(defaultStyle);
    mockTimerStyleService.addListener.mockImplementation(() => {});
    mockTimerStyleService.removeListener.mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
  });

  describe('Initial Render Performance', () => {
    it('should render within 16ms target (single render)', () => {
      // Arrange
      const targetTime = 16; // ms
      
      // Act
      const startTime = performance.now();
      const { unmount } = render(<TimerDisplay {...defaultProps} />);
      const endTime = performance.now();
      
      // Assert
      const renderTime = endTime - startTime;
      console.log(`Initial render time: ${renderTime.toFixed(2)}ms`);
      
      expect(renderTime).toBeLessThan(targetTime);
      
      // Cleanup
      unmount();
    });

    it('should maintain consistent render times across multiple renders', () => {
      // Arrange
      const iterations = 20;
      const targetTime = 16; // ms
      const renderTimes: number[] = [];
      
      // Act
      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        const { unmount } = render(<TimerDisplay {...defaultProps} />);
        const endTime = performance.now();
        
        const renderTime = endTime - startTime;
        renderTimes.push(renderTime);
        
        unmount();
      }
      
      // Assert
      const averageTime = renderTimes.reduce((sum, time) => sum + time, 0) / iterations;
      const maxTime = Math.max(...renderTimes);
      const minTime = Math.min(...renderTimes);
      
      console.log(`Render times - Average: ${averageTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms, Min: ${minTime.toFixed(2)}ms`);
      
      expect(averageTime).toBeLessThan(targetTime);
      expect(maxTime).toBeLessThan(targetTime * 1.5); // Allow 50% variance for max
      
      // Check consistency (standard deviation should be reasonable)
      const variance = renderTimes.reduce((sum, time) => sum + Math.pow(time - averageTime, 2), 0) / iterations;
      const standardDeviation = Math.sqrt(variance);
      
      expect(standardDeviation).toBeLessThan(targetTime * 0.3); // SD should be < 30% of target
    });
  });

  describe('Update Performance', () => {
    it('should handle prop updates within 16ms', () => {
      // Arrange
      const targetTime = 16; // ms
      const { rerender } = render(<TimerDisplay {...defaultProps} />);
      
      // Act
      const startTime = performance.now();
      rerender(
        <TimerDisplay
          {...defaultProps}
          time={1499}
          formattedTime="24:59"
          progress={49.93}
        />
      );
      const endTime = performance.now();
      
      // Assert
      const updateTime = endTime - startTime;
      console.log(`Update render time: ${updateTime.toFixed(2)}ms`);
      
      expect(updateTime).toBeLessThan(targetTime);
    });

    it('should handle rapid sequential updates efficiently', () => {
      // Arrange
      const targetTime = 16; // ms per update
      const iterations = 10;
      const { rerender } = render(<TimerDisplay {...defaultProps} />);
      const updateTimes: number[] = [];
      
      // Act
      for (let i = 1; i <= iterations; i++) {
        const time = 1500 - i;
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        const progress = ((1500 - time) / 1500) * 100;
        
        const startTime = performance.now();
        rerender(
          <TimerDisplay
            {...defaultProps}
            time={time}
            formattedTime={formattedTime}
            progress={progress}
          />
        );
        const endTime = performance.now();
        
        updateTimes.push(endTime - startTime);
      }
      
      // Assert
      const averageUpdateTime = updateTimes.reduce((sum, time) => sum + time, 0) / iterations;
      const maxUpdateTime = Math.max(...updateTimes);
      
      console.log(`Sequential updates - Average: ${averageUpdateTime.toFixed(2)}ms, Max: ${maxUpdateTime.toFixed(2)}ms`);
      
      expect(averageUpdateTime).toBeLessThan(targetTime);
      expect(maxUpdateTime).toBeLessThan(targetTime * 1.5);
    });
  });

  describe('Style Change Performance', () => {
    it('should handle style changes within performance target', () => {
      // Arrange
      const targetTime = 20; // Slightly higher target for style changes
      const { rerender } = render(<TimerDisplay {...defaultProps} />);
      
      const newStyle = {
        ...defaultStyle,
        displayStyle: 'analog' as const,
        colors: {
          ...defaultStyle.colors,
          primary: '#ef4444'
        }
      };
      
      mockTimerStyleService.getCurrentStyle.mockReturnValue(newStyle);
      
      // Act
      const startTime = performance.now();
      rerender(<TimerDisplay {...defaultProps} />);
      const endTime = performance.now();
      
      // Assert
      const styleChangeTime = endTime - startTime;
      console.log(`Style change render time: ${styleChangeTime.toFixed(2)}ms`);
      
      expect(styleChangeTime).toBeLessThan(targetTime);
    });
  });

  describe('State Change Performance', () => {
    it('should handle state transitions efficiently', () => {
      // Arrange
      const targetTime = 16; // ms
      const { rerender } = render(<TimerDisplay {...defaultProps} />);
      
      // Act - Change from focus to break state
      const startTime = performance.now();
      rerender(
        <TimerDisplay
          {...defaultProps}
          currentState="break"
          stateText="休息时间"
          progress={0}
        />
      );
      const endTime = performance.now();
      
      // Assert
      const stateChangeTime = endTime - startTime;
      console.log(`State change render time: ${stateChangeTime.toFixed(2)}ms`);
      
      expect(stateChangeTime).toBeLessThan(targetTime);
    });
  });

  describe('Memory Performance', () => {
    it('should not cause memory leaks during extended use', () => {
      // Arrange
      const iterations = 100;
      const { rerender } = render(<TimerDisplay {...defaultProps} />);
      
      // Get initial memory if available
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Act - Simulate extended use with many updates
      for (let i = 0; i < iterations; i++) {
        const time = 1500 - (i % 1500);
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        const progress = ((1500 - time) / 1500) * 100;
        
        rerender(
          <TimerDisplay
            {...defaultProps}
            time={time}
            formattedTime={formattedTime}
            progress={progress}
            isActive={i % 2 === 0}
          />
        );
      }
      
      // Force garbage collection if available
      if ((global as any).gc) {
        (global as any).gc();
      }
      
      // Assert
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      console.log(`Memory usage - Initial: ${initialMemory}, Final: ${finalMemory}, Increase: ${memoryIncrease}`);
      
      // Memory increase should be reasonable (less than 5MB for this test)
      if (initialMemory > 0) {
        expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // 5MB
      }
    });
  });

  describe('Performance Regression Detection', () => {
    it('should maintain baseline performance metrics', () => {
      // Arrange
      const baselineMetrics = {
        initialRender: 16, // ms
        updateRender: 16,  // ms
        styleChange: 20,   // ms
        stateChange: 16    // ms
      };
      
      const tolerance = 1.2; // 20% tolerance
      
      // Test initial render
      const initialStart = performance.now();
      const { rerender, unmount } = render(<TimerDisplay {...defaultProps} />);
      const initialEnd = performance.now();
      const initialRenderTime = initialEnd - initialStart;
      
      // Test update render
      const updateStart = performance.now();
      rerender(<TimerDisplay {...defaultProps} time={1499} formattedTime="24:59" />);
      const updateEnd = performance.now();
      const updateRenderTime = updateEnd - updateStart;
      
      // Assert
      expect(initialRenderTime).toBeLessThan(baselineMetrics.initialRender * tolerance);
      expect(updateRenderTime).toBeLessThan(baselineMetrics.updateRender * tolerance);
      
      console.log('Performance Baseline Check:');
      console.log(`Initial render: ${initialRenderTime.toFixed(2)}ms (baseline: ${baselineMetrics.initialRender}ms)`);
      console.log(`Update render: ${updateRenderTime.toFixed(2)}ms (baseline: ${baselineMetrics.updateRender}ms)`);
      
      unmount();
    });
  });
});
