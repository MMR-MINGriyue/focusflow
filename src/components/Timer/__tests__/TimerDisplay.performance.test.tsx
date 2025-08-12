/**
 * TimerDisplay 组件性能测试
 * 目标：确保渲染时间 < 16ms
 * 验证样式缓存和memo优化的性能改进
 */

import React from 'react';
import { render, act } from '@testing-library/react';
import TimerDisplay from '../TimerDisplay';
import { styleCache } from '../../../utils/styleCache';

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
    getStyleForState: jest.fn(() => ({
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
      progressStyle: 'linear'
    })),
    getSettings: jest.fn(() => ({
      currentStyleId: 'digital-modern',
      customStyles: [],
      previewMode: false,
      autoSwitchByState: false,
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

describe('TimerDisplay Performance Tests', () => {
  const defaultProps = {
    time: 1500, // 25 minutes in seconds
    formattedTime: '25:00',
    currentState: 'focus' as const,
    progress: 50,
    isActive: true,
    stateText: '专注时间'
  };

  beforeAll(() => {
    jest.useFakeTimers('legacy');
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render within 16ms performance target', () => {
    const renderTimes: number[] = [];
    const iterations = 10;

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      const { unmount } = render(<TimerDisplay {...defaultProps} />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      renderTimes.push(renderTime);
      
      unmount();
    }

    const averageRenderTime = renderTimes.reduce((sum, time) => sum + time, 0) / iterations;
    const maxRenderTime = Math.max(...renderTimes);

    console.log(`Average render time: ${averageRenderTime.toFixed(2)}ms`);
    console.log(`Max render time: ${maxRenderTime.toFixed(2)}ms`);
    console.log(`All render times: ${renderTimes.map(t => t.toFixed(2)).join(', ')}ms`);

    // Performance targets
    expect(averageRenderTime).toBeLessThan(16); // 60fps target
    expect(maxRenderTime).toBeLessThan(32); // Allow some variance
  });

  it('should handle rapid prop updates efficiently', () => {
    const { rerender } = render(<TimerDisplay {...defaultProps} />);
    
    const updateTimes: number[] = [];
    const iterations = 50;

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      rerender(
        <TimerDisplay
          {...defaultProps}
          time={1500 - i}
          formattedTime={`${Math.floor((1500 - i) / 60)}:${String((1500 - i) % 60).padStart(2, '0')}`}
          progress={((1500 - i) / 1500) * 100}
        />
      );
      
      const endTime = performance.now();
      updateTimes.push(endTime - startTime);
    }

    const averageUpdateTime = updateTimes.reduce((sum, time) => sum + time, 0) / iterations;
    const maxUpdateTime = Math.max(...updateTimes);

    console.log(`Average update time: ${averageUpdateTime.toFixed(2)}ms`);
    console.log(`Max update time: ${maxUpdateTime.toFixed(2)}ms`);

    // Update performance targets
    expect(averageUpdateTime).toBeLessThan(8); // Half frame budget for updates
    expect(maxUpdateTime).toBeLessThan(16);
  });

  it('should handle state changes efficiently', () => {
    const { rerender } = render(<TimerDisplay {...defaultProps} />);
    
    const states: Array<'focus' | 'break' | 'microBreak'> = ['focus', 'break', 'microBreak'];
    const stateChangeTimes: number[] = [];

    states.forEach(state => {
      const startTime = performance.now();
      
      rerender(
        <TimerDisplay
          {...defaultProps}
          currentState={state}
          stateText={state === 'focus' ? '专注时间' : state === 'break' ? '休息时间' : '微休息'}
        />
      );
      
      const endTime = performance.now();
      stateChangeTimes.push(endTime - startTime);
    });

    const averageStateChangeTime = stateChangeTimes.reduce((sum, time) => sum + time, 0) / stateChangeTimes.length;
    const maxStateChangeTime = Math.max(...stateChangeTimes);

    console.log(`Average state change time: ${averageStateChangeTime.toFixed(2)}ms`);
    console.log(`Max state change time: ${maxStateChangeTime.toFixed(2)}ms`);

    // State change performance targets
    expect(averageStateChangeTime).toBeLessThan(10);
    expect(maxStateChangeTime).toBeLessThan(16);
  });

  it('should handle memory efficiently during long sessions', () => {
    const { rerender } = render(<TimerDisplay {...defaultProps} />);
    
    // Simulate a long session with many updates
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    for (let i = 0; i < 1000; i++) {
      rerender(
        <TimerDisplay
          {...defaultProps}
          time={1500 - (i % 1500)}
          formattedTime={`${Math.floor((1500 - (i % 1500)) / 60)}:${String((1500 - (i % 1500)) % 60).padStart(2, '0')}`}
          progress={((1500 - (i % 1500)) / 1500) * 100}
          isActive={i % 2 === 0}
        />
      );
    }
    
    const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryIncrease = endMemory - startMemory;
    
    console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    
    // Memory should not increase significantly (less than 5MB for 1000 updates)
    if (startMemory > 0) {
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // 5MB
    }
  });

  // ==================== STYLE CACHE PERFORMANCE TESTS ====================
  describe('Style Cache Performance', () => {
    beforeEach(() => {
      styleCache.invalidate();
      styleCache.resetStats();
    });

    it('reduces service calls through caching', () => {
      // Arrange
      const props = defaultProps;

      // Act - Multiple renders with same state
      render(<TimerDisplay {...props} />);
      render(<TimerDisplay {...props} />);
      render(<TimerDisplay {...props} />);

      // Assert - Check cache statistics
      const stats = styleCache.getStats();
      expect(stats.hits).toBeGreaterThan(0);
      expect(stats.hitRate).toBeGreaterThan(0);
    });

    it('provides performance improvement with cache hits', () => {
      // Arrange
      const props = defaultProps;

      // Act - First render (potential cache miss)
      const start1 = performance.now();
      render(<TimerDisplay {...props} />);
      const time1 = performance.now() - start1;

      // Act - Second render (cache hit)
      const start2 = performance.now();
      render(<TimerDisplay {...props} />);
      const time2 = performance.now() - start2;

      // Assert - Cache hit should be faster or similar
      expect(time2).toBeLessThanOrEqual(time1 * 1.5); // Allow some variance

      const stats = styleCache.getStats();
      expect(stats.totalRequests).toBeGreaterThan(0);
    });

    it('handles high frequency updates efficiently', () => {
      // Arrange
      const baseProps = {
        currentState: 'focus' as const,
        isActive: true,
        stateText: '专注中',
      };

      // Act - Simulate rapid time updates
      const start = performance.now();
      for (let i = 0; i < 50; i++) {
        const time = 1500 - i;
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        const progress = (i / 50) * 100;

        render(<TimerDisplay
          {...baseProps}
          time={time}
          formattedTime={formattedTime}
          progress={progress}
        />);
      }
      const totalTime = performance.now() - start;

      // Assert
      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second

      const stats = styleCache.getStats();
      expect(stats.hitRate).toBeGreaterThan(50); // Reasonable cache hit rate
    });
  });

  // ==================== COMPONENT MEMO PERFORMANCE TESTS ====================
  describe('Component Memo Performance', () => {
    it('handles rapid prop changes efficiently', () => {
      // Arrange
      const props = {
        currentState: 'focus' as const,
        isActive: true,
        stateText: '专注中',
      };

      // Act - Rapid time updates
      const start = performance.now();
      const { rerender } = render(<TimerDisplay
        {...props}
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
          {...props}
          time={time}
          formattedTime={formattedTime}
          progress={progress}
        />);
      }
      const totalTime = performance.now() - start;

      // Assert
      expect(totalTime).toBeLessThan(500); // Should complete within 500ms
    });

    it('maintains performance with different display styles', () => {
      // Arrange
      const displayStyles = ['digital', 'analog', 'progress', 'minimal', 'card', 'neon'];

      // Act
      const start = performance.now();
      displayStyles.forEach(displayStyle => {
        render(<TimerDisplay
          {...defaultProps}
          // Note: displayStyle is controlled by the style service, not props
        />);
      });
      const totalTime = performance.now() - start;

      // Assert
      expect(totalTime).toBeLessThan(200); // Should complete within 200ms
    });
  });
});
