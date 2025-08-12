/**
 * StyleCache 性能优化测试
 * 
 * 验证样式缓存的功能正确性和性能改进
 */

import { styleCache } from '../styleCache';
import { timerStyleService } from '../../services/timerStyle';
import { testUtils } from '../../tests/utils/testUtils';

// Mock timerStyleService
jest.mock('../../services/timerStyle', () => ({
  timerStyleService: {
    getStyleForState: jest.fn(),
    getSettings: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
  },
}));

describe('StyleCache', () => {
  const mockTimerStyleService = timerStyleService as jest.Mocked<typeof timerStyleService>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    styleCache.invalidate(); // 清空缓存
    styleCache.resetStats(); // 重置统计
    
    // Setup default mocks
    mockTimerStyleService.getSettings.mockReturnValue({
      currentStyleId: 'digital-modern',
      customStyles: [],
      previewMode: false,
      autoSwitchByState: false,
    });
    
    mockTimerStyleService.getStyleForState.mockReturnValue(
      testUtils.generateTimerStyle({
        id: 'digital-modern',
        name: '现代数字',
      })
    );
  });

  // ==================== BASIC FUNCTIONALITY TESTS ====================
  describe('Basic Functionality', () => {
    it('returns style from service on first call', () => {
      // Arrange
      const expectedStyle = testUtils.generateTimerStyle({ id: 'test-style' });
      mockTimerStyleService.getStyleForState.mockReturnValue(expectedStyle);

      // Act
      const result = styleCache.getStyleForState('focus');

      // Assert
      expect(result).toEqual(expectedStyle);
      expect(mockTimerStyleService.getStyleForState).toHaveBeenCalledTimes(1);
      expect(mockTimerStyleService.getStyleForState).toHaveBeenCalledWith('focus');
    });

    it('returns cached style on subsequent calls', () => {
      // Arrange
      const expectedStyle = testUtils.generateTimerStyle({ id: 'test-style' });
      mockTimerStyleService.getStyleForState.mockReturnValue(expectedStyle);

      // Act
      const result1 = styleCache.getStyleForState('focus');
      const result2 = styleCache.getStyleForState('focus');

      // Assert
      expect(result1).toEqual(expectedStyle);
      expect(result2).toEqual(expectedStyle);
      expect(mockTimerStyleService.getStyleForState).toHaveBeenCalledTimes(1);
    });

    it('caches different states separately when autoSwitchByState is enabled', () => {
      // Arrange
      const focusStyle = testUtils.generateTimerStyle({ id: 'focus-style' });
      const breakStyle = testUtils.generateTimerStyle({ id: 'break-style' });

      // Enable autoSwitchByState to get separate caching
      mockTimerStyleService.getSettings.mockReturnValue({
        currentStyleId: 'test-style',
        customStyles: [],
        previewMode: false,
        autoSwitchByState: true,
      });

      mockTimerStyleService.getStyleForState
        .mockReturnValueOnce(focusStyle)
        .mockReturnValueOnce(breakStyle);

      // Act
      const focusResult = styleCache.getStyleForState('focus');
      const breakResult = styleCache.getStyleForState('break');

      // Assert
      expect(focusResult).toEqual(focusStyle);
      expect(breakResult).toEqual(breakStyle);
      expect(mockTimerStyleService.getStyleForState).toHaveBeenCalledTimes(2);
    });
  });

  // ==================== CACHE STATISTICS TESTS ====================
  describe('Cache Statistics', () => {
    it('tracks cache hits and misses correctly', () => {
      // Arrange
      const style = testUtils.generateTimerStyle();
      mockTimerStyleService.getStyleForState.mockReturnValue(style);

      // Act
      styleCache.getStyleForState('focus'); // miss (first call)
      styleCache.getStyleForState('focus'); // hit (same state, same style)
      styleCache.getStyleForState('break'); // hit (same style, autoSwitchByState=false)
      styleCache.getStyleForState('focus'); // hit (same style)

      // Assert
      const stats = styleCache.getStats();
      expect(stats.hits).toBe(3);
      expect(stats.misses).toBe(1);
      expect(stats.totalRequests).toBe(4);
      expect(stats.hitRate).toBe(75);
    });

    it('updates cache size correctly', () => {
      // Arrange
      const style = testUtils.generateTimerStyle();
      mockTimerStyleService.getStyleForState.mockReturnValue(style);

      // Act
      styleCache.getStyleForState('focus');
      styleCache.getStyleForState('break');
      styleCache.getStyleForState('microBreak');

      // Assert - Since autoSwitchByState is false, all states use same cache key
      const stats = styleCache.getStats();
      expect(stats.cacheSize).toBe(1);
    });
  });

  // ==================== CACHE INVALIDATION TESTS ====================
  describe('Cache Invalidation', () => {
    it('clears all cache when invalidate() called without parameters', () => {
      // Arrange
      const style = testUtils.generateTimerStyle();
      mockTimerStyleService.getStyleForState.mockReturnValue(style);
      
      styleCache.getStyleForState('focus');
      expect(styleCache.getStats().cacheSize).toBe(1);

      // Act
      styleCache.invalidate();

      // Assert
      expect(styleCache.getStats().cacheSize).toBe(0);
    });

    it('clears specific style cache when styleId provided', () => {
      // Arrange
      const style1 = testUtils.generateTimerStyle({ id: 'style1' });
      const style2 = testUtils.generateTimerStyle({ id: 'style2' });
      
      mockTimerStyleService.getSettings
        .mockReturnValueOnce({ currentStyleId: 'style1', customStyles: [], previewMode: false, autoSwitchByState: false })
        .mockReturnValueOnce({ currentStyleId: 'style2', customStyles: [], previewMode: false, autoSwitchByState: false });
      
      mockTimerStyleService.getStyleForState
        .mockReturnValueOnce(style1)
        .mockReturnValueOnce(style2);

      styleCache.getStyleForState('focus', 'style1');
      styleCache.getStyleForState('focus', 'style2');
      expect(styleCache.getStats().cacheSize).toBe(2);

      // Act
      styleCache.invalidate('style1');

      // Assert
      expect(styleCache.getStats().cacheSize).toBe(1);
    });
  });

  // ==================== PERFORMANCE TESTS ====================
  describe('Performance', () => {
    it('provides significant performance improvement with cache hits', () => {
      // Arrange
      const style = testUtils.generateTimerStyle();
      let serviceCallCount = 0;
      
      mockTimerStyleService.getStyleForState.mockImplementation(() => {
        serviceCallCount++;
        // Simulate some computation time
        const start = performance.now();
        while (performance.now() - start < 1) {
          // Busy wait for 1ms to simulate computation
        }
        return style;
      });

      // Act - First call (cache miss)
      const start1 = performance.now();
      styleCache.getStyleForState('focus');
      const time1 = performance.now() - start1;

      // Act - Second call (cache hit)
      const start2 = performance.now();
      styleCache.getStyleForState('focus');
      const time2 = performance.now() - start2;

      // Assert
      expect(serviceCallCount).toBe(1);
      expect(time2).toBeLessThan(time1); // Cache hit should be faster
      expect(time2).toBeLessThan(0.5); // Cache hit should be very fast
    });

    it('handles high frequency calls efficiently', () => {
      // Arrange
      const style = testUtils.generateTimerStyle();
      mockTimerStyleService.getStyleForState.mockReturnValue(style);

      // Act
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        styleCache.getStyleForState('focus');
      }
      const totalTime = performance.now() - start;

      // Assert
      expect(mockTimerStyleService.getStyleForState).toHaveBeenCalledTimes(1);
      expect(totalTime).toBeLessThan(50); // Should complete quickly
      
      const stats = styleCache.getStats();
      expect(stats.hits).toBe(999);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(99.9, 1);
    });
  });

  // ==================== CACHE CONFIGURATION TESTS ====================
  describe('Cache Configuration', () => {
    it('respects maxSize configuration', () => {
      // Arrange
      styleCache.configure({ maxSize: 2 });

      // Enable autoSwitchByState to create different cache entries
      mockTimerStyleService.getSettings.mockReturnValue({
        currentStyleId: 'test-style',
        customStyles: [],
        previewMode: false,
        autoSwitchByState: true,
      });

      const style = testUtils.generateTimerStyle();
      mockTimerStyleService.getStyleForState.mockReturnValue(style);

      // Act
      styleCache.getStyleForState('focus');
      styleCache.getStyleForState('break');
      styleCache.getStyleForState('microBreak'); // Should evict oldest

      // Assert
      expect(styleCache.getStats().cacheSize).toBe(2);
    });

    it.skip('respects TTL configuration', async () => {
      // Arrange
      styleCache.configure({ ttl: 10 }); // Very short TTL for testing
      const style = testUtils.generateTimerStyle();
      mockTimerStyleService.getStyleForState.mockReturnValue(style);

      // Act - First call (cache miss)
      styleCache.getStyleForState('focus');
      expect(mockTimerStyleService.getStyleForState).toHaveBeenCalledTimes(1);

      // Act - Second call immediately (cache hit)
      styleCache.getStyleForState('focus');
      expect(mockTimerStyleService.getStyleForState).toHaveBeenCalledTimes(1);

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 50));

      // Act - Third call after TTL expiry (cache miss)
      styleCache.getStyleForState('focus');

      // Assert
      expect(mockTimerStyleService.getStyleForState).toHaveBeenCalledTimes(2);
    });
  });

  // ==================== WARMUP TESTS ====================
  describe('Cache Warmup', () => {
    it('preloads common styles during warmup', () => {
      // Arrange
      const style = testUtils.generateTimerStyle();
      mockTimerStyleService.getStyleForState.mockReturnValue(style);

      // Act
      styleCache.warmup();

      // Assert
      // Warmup calls the service for each state, but since autoSwitchByState is false,
      // only the first call actually caches (subsequent calls hit cache)
      expect(mockTimerStyleService.getStyleForState).toHaveBeenCalledTimes(1);
      expect(mockTimerStyleService.getStyleForState).toHaveBeenCalledWith('focus');

      // Since autoSwitchByState is false by default, all states use the same cache key
      // So we expect only 1 cache item, not 3
      expect(styleCache.getStats().cacheSize).toBe(1);
    });

    it('provides immediate cache hits after warmup', () => {
      // Arrange
      const style = testUtils.generateTimerStyle();
      mockTimerStyleService.getStyleForState.mockReturnValue(style);

      styleCache.warmup();
      const statsAfterWarmup = styleCache.getStats();

      // Act
      styleCache.getStyleForState('focus');
      styleCache.getStyleForState('break');

      // Assert
      const statsAfterCalls = styleCache.getStats();
      expect(statsAfterCalls.hits).toBe(statsAfterWarmup.hits + 2);
      // Service should only be called during warmup (1 time), not after
      expect(mockTimerStyleService.getStyleForState).toHaveBeenCalledTimes(1); // Only warmup calls
    });
  });

  // ==================== DEBUG INFO TESTS ====================
  describe('Debug Information', () => {
    it('provides detailed debug information', () => {
      // Arrange
      const style = testUtils.generateTimerStyle();
      mockTimerStyleService.getStyleForState.mockReturnValue(style);

      styleCache.getStyleForState('focus');
      styleCache.getStyleForState('break');

      // Act
      const debugInfo = styleCache.getDebugInfo();

      // Assert
      expect(debugInfo.stats).toBeDefined();
      expect(debugInfo.cacheKeys).toHaveLength(1); // Only 1 cache key due to autoSwitchByState=false
      expect(debugInfo.cacheItems).toHaveLength(1);

      expect(debugInfo.cacheItems[0]).toHaveProperty('key');
      expect(debugInfo.cacheItems[0]).toHaveProperty('styleId');
      expect(debugInfo.cacheItems[0]).toHaveProperty('timestamp');
      expect(debugInfo.cacheItems[0]).toHaveProperty('accessCount');
      expect(debugInfo.cacheItems[0]).toHaveProperty('age');
    });
  });
});
