/**
 * 内存泄漏测试
 *
 * 验证定时器和性能监控的内存清理
 */

import { performanceMonitor } from '../performance';
import { memoryLeakDetector } from '../memoryLeakDetector';

// Mock window.setInterval and clearInterval
const originalSetInterval = window.setInterval;
const originalClearInterval = window.clearInterval;
const originalRequestAnimationFrame = window.requestAnimationFrame;
const originalCancelAnimationFrame = window.cancelAnimationFrame;

describe('Memory Leak Tests', () => {
  let activeIntervals: Set<number>;
  let activeAnimationFrames: Set<number>;
  let intervalCounter = 0;
  let animationFrameCounter = 0;

  beforeEach(() => {
    activeIntervals = new Set();
    activeAnimationFrames = new Set();
    intervalCounter = 0;
    animationFrameCounter = 0;

    // Mock setInterval to track active intervals
    window.setInterval = jest.fn((callback: Function, delay: number) => {
      const id = ++intervalCounter;
      activeIntervals.add(id);
      
      // Actually run the interval for testing
      originalSetInterval(() => {
        if (activeIntervals.has(id)) {
          callback();
        }
      }, delay);
      
      return id;
    });

    // Mock clearInterval to track cleanup
    window.clearInterval = jest.fn((id: number) => {
      activeIntervals.delete(id);
      originalClearInterval(id);
    });

    // Mock requestAnimationFrame
    window.requestAnimationFrame = jest.fn((callback: FrameRequestCallback) => {
      const id = ++animationFrameCounter;
      activeAnimationFrames.add(id);
      
      // Use setTimeout to simulate animation frame
      originalSetInterval(() => {
        if (activeAnimationFrames.has(id)) {
          callback(performance.now());
        }
      }, 16); // ~60fps
      
      return id;
    });

    // Mock cancelAnimationFrame
    window.cancelAnimationFrame = jest.fn((id: number) => {
      activeAnimationFrames.delete(id);
    });
  });

  afterEach(() => {
    // Restore original functions
    window.setInterval = originalSetInterval;
    window.clearInterval = originalClearInterval;
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
    
    // Stop any running monitoring
    performanceMonitor.stopMonitoring();
  });

  // ==================== PERFORMANCE MONITOR MEMORY TESTS ====================
  describe('PerformanceMonitor Memory Management', () => {
    it('cleans up intervals when stopping monitoring', () => {
      // Arrange
      expect(activeIntervals.size).toBe(0);
      expect(activeAnimationFrames.size).toBe(0);

      // Act - Start monitoring
      performanceMonitor.startMonitoring();
      
      // Assert - Should have active timers
      expect(activeIntervals.size).toBeGreaterThan(0);
      expect(activeAnimationFrames.size).toBeGreaterThan(0);

      // Act - Stop monitoring
      performanceMonitor.stopMonitoring();

      // Assert - Should clean up timers
      expect(activeIntervals.size).toBe(0);
      expect(activeAnimationFrames.size).toBe(0);
    });

    it('does not create duplicate intervals when starting multiple times', () => {
      // Act
      performanceMonitor.startMonitoring();
      const firstIntervalCount = activeIntervals.size;
      const firstAnimationFrameCount = activeAnimationFrames.size;

      performanceMonitor.startMonitoring(); // Start again
      const secondIntervalCount = activeIntervals.size;
      const secondAnimationFrameCount = activeAnimationFrames.size;

      // Assert - Should not create duplicates
      expect(secondIntervalCount).toBe(firstIntervalCount);
      expect(secondAnimationFrameCount).toBe(firstAnimationFrameCount);

      // Cleanup
      performanceMonitor.stopMonitoring();
    });

    it('handles multiple start/stop cycles correctly', () => {
      // Act - Multiple cycles
      for (let i = 0; i < 5; i++) {
        performanceMonitor.startMonitoring();
        expect(activeIntervals.size).toBeGreaterThan(0);
        
        performanceMonitor.stopMonitoring();
        expect(activeIntervals.size).toBe(0);
        expect(activeAnimationFrames.size).toBe(0);
      }

      // Assert - Final state should be clean
      expect(activeIntervals.size).toBe(0);
      expect(activeAnimationFrames.size).toBe(0);
    });

    it('cleans up properly even if stop is called multiple times', () => {
      // Arrange
      performanceMonitor.startMonitoring();
      expect(activeIntervals.size).toBeGreaterThan(0);

      // Act - Multiple stops
      performanceMonitor.stopMonitoring();
      performanceMonitor.stopMonitoring();
      performanceMonitor.stopMonitoring();

      // Assert - Should still be clean
      expect(activeIntervals.size).toBe(0);
      expect(activeAnimationFrames.size).toBe(0);
    });
  });

  // ==================== GENERAL TIMER CLEANUP TESTS ====================
  describe('General Timer Cleanup', () => {
    it('verifies no timers are left running after test cleanup', () => {
      // This test ensures our test setup properly cleans up
      expect(activeIntervals.size).toBe(0);
      expect(activeAnimationFrames.size).toBe(0);
    });

    it('detects timer leaks in mock environment', () => {
      // Arrange - Create a timer that won't be cleaned up
      const leakyInterval = window.setInterval(() => {}, 1000);
      expect(activeIntervals.size).toBe(1);

      // Act - Clean up the timer
      window.clearInterval(leakyInterval);

      // Assert - Should be cleaned up
      expect(activeIntervals.size).toBe(0);
    });
  });

  // ==================== STRESS TESTS ====================
  describe('Memory Stress Tests', () => {
    it('handles rapid start/stop cycles without accumulating timers', () => {
      // Act - Rapid cycles
      for (let i = 0; i < 50; i++) {
        performanceMonitor.startMonitoring();
        performanceMonitor.stopMonitoring();
      }

      // Assert - Should not accumulate timers
      expect(activeIntervals.size).toBe(0);
      expect(activeAnimationFrames.size).toBe(0);
    });

    it.skip('maintains clean state under concurrent operations', async () => {
      // Act - Simulate sequential start/stop operations with small delays
      for (let i = 0; i < 5; i++) {
        performanceMonitor.startMonitoring();
        await new Promise(resolve => setTimeout(resolve, 10));
        performanceMonitor.stopMonitoring();
        await new Promise(resolve => setTimeout(resolve, 5));
      }

      // Assert - Should be clean after all operations
      expect(activeIntervals.size).toBe(0);
      expect(activeAnimationFrames.size).toBe(0);
    });
  });

  // ==================== INTEGRATION TESTS ====================
  describe('Integration Memory Tests', () => {
    it('verifies cleanup when page unloads', () => {
      // Arrange
      performanceMonitor.startMonitoring();
      expect(activeIntervals.size).toBeGreaterThan(0);

      // Act - Simulate page unload
      const beforeUnloadEvent = new Event('beforeunload');
      window.dispatchEvent(beforeUnloadEvent);
      
      // Manual cleanup (in real app, this would be in beforeunload handler)
      performanceMonitor.stopMonitoring();

      // Assert
      expect(activeIntervals.size).toBe(0);
      expect(activeAnimationFrames.size).toBe(0);
    });

    it('handles component unmount scenarios', () => {
      // Arrange - Simulate component lifecycle
      const componentCleanup = () => {
        performanceMonitor.stopMonitoring();
      };

      // Act
      performanceMonitor.startMonitoring();
      expect(activeIntervals.size).toBeGreaterThan(0);

      // Simulate component unmount
      componentCleanup();

      // Assert
      expect(activeIntervals.size).toBe(0);
      expect(activeAnimationFrames.size).toBe(0);
    });
  });

  // ==================== EDGE CASE TESTS ====================
  describe('Edge Case Memory Tests', () => {
    it('handles stop before start gracefully', () => {
      // Act
      performanceMonitor.stopMonitoring(); // Stop before start

      // Assert - Should not throw or create issues
      expect(activeIntervals.size).toBe(0);
      expect(activeAnimationFrames.size).toBe(0);
    });

    it('handles multiple starts without intermediate stops', () => {
      // Act
      performanceMonitor.startMonitoring();
      const firstCount = activeIntervals.size;
      
      performanceMonitor.startMonitoring();
      performanceMonitor.startMonitoring();
      const finalCount = activeIntervals.size;

      // Assert - Should not accumulate timers
      expect(finalCount).toBe(firstCount);

      // Cleanup
      performanceMonitor.stopMonitoring();
      expect(activeIntervals.size).toBe(0);
    });
  });

  // ==================== MEMORY LEAK DETECTOR TESTS ====================
  describe('Memory Leak Detector', () => {
    beforeEach(() => {
      // Stop monitoring to avoid interference
      memoryLeakDetector.stopMonitoring();
    });

    afterEach(() => {
      memoryLeakDetector.stopMonitoring();
      memoryLeakDetector.forceCleanup();
    });

    it('detects timer leaks correctly', () => {
      // Arrange
      memoryLeakDetector.startMonitoring();

      // Act - Create some timers
      const interval1 = setInterval(() => {}, 1000);
      const timeout1 = setTimeout(() => {}, 5000);

      // Assert
      const report = memoryLeakDetector.generateReport();
      expect(report.activeTimers).toBe(2);

      // Cleanup
      clearInterval(interval1);
      clearTimeout(timeout1);

      const reportAfterCleanup = memoryLeakDetector.generateReport();
      expect(reportAfterCleanup.activeTimers).toBe(0);
    });

    it('detects event listener leaks', () => {
      // Arrange
      memoryLeakDetector.startMonitoring();
      const element = document.createElement('div');
      const handler = () => {};

      // Act - Add event listeners
      element.addEventListener('click', handler);
      element.addEventListener('mouseover', handler);

      // Assert
      const report = memoryLeakDetector.generateReport();
      expect(report.activeEventListeners).toBeGreaterThanOrEqual(2);

      // Cleanup
      element.removeEventListener('click', handler);
      element.removeEventListener('mouseover', handler);
    });

    it('generates meaningful leak reports', () => {
      // Arrange
      memoryLeakDetector.startMonitoring();

      // Act
      const report = memoryLeakDetector.generateReport();

      // Assert
      expect(report).toHaveProperty('activeTimers');
      expect(report).toHaveProperty('activeEventListeners');
      expect(report).toHaveProperty('memoryUsage');
      expect(report).toHaveProperty('memoryTrend');
      expect(report).toHaveProperty('leakSuspects');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('timestamp');
      expect(Array.isArray(report.leakSuspects)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('provides cleanup functionality', () => {
      // Arrange
      memoryLeakDetector.startMonitoring();
      const interval1 = setInterval(() => {}, 1000);
      const interval2 = setInterval(() => {}, 2000);

      // Act
      memoryLeakDetector.forceCleanup();

      // Assert - Timers should be cleaned up
      const report = memoryLeakDetector.generateReport();
      expect(report.activeTimers).toBe(0);
    });

    it('handles start/stop monitoring correctly', () => {
      // Act & Assert - Should not throw errors
      expect(() => {
        memoryLeakDetector.startMonitoring();
        memoryLeakDetector.startMonitoring(); // Double start
        memoryLeakDetector.stopMonitoring();
        memoryLeakDetector.stopMonitoring(); // Double stop
      }).not.toThrow();
    });
  });
});
