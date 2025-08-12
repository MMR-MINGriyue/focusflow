/**
 * Hook测试模板
 * 
 * 这个模板提供了标准化的React Hook测试结构，采用AAA模式（Arrange-Act-Assert）
 * 适用于自定义Hook的单元测试
 * 
 * 使用方法：
 * 1. 复制此模板到目标Hook的 __tests__ 目录
 * 2. 替换 useHookName 为实际Hook名
 * 3. 根据Hook特性添加具体的测试用例
 * 4. 配置必要的 mock 和依赖
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useHookName } from '../useHookName'; // 替换为实际Hook路径

// ==================== MOCK CONFIGURATION ====================

// Mock external dependencies
jest.mock('../../../services/exampleService', () => ({
  exampleService: {
    getData: jest.fn(),
    updateData: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  }
}));

// Mock stores if needed
jest.mock('../../../stores/exampleStore', () => ({
  useExampleStore: jest.fn()
}));

// Mock other hooks if needed
jest.mock('../../../hooks/useOtherHook', () => ({
  useOtherHook: jest.fn()
}));

// ==================== TEST SETUP ====================

// Define mock data
const mockInitialData = {
  id: 'test-id',
  value: 'initial-value',
  status: 'idle',
};

const mockUpdatedData = {
  id: 'test-id',
  value: 'updated-value',
  status: 'success',
};

// Helper function to render hook with default parameters
const renderHookWithDefaults = (initialParams = {}) => {
  return renderHook(() => useHookName(initialParams));
};

// ==================== TEST SUITES ====================

describe('useHookName', () => {
  // Setup and cleanup
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ==================== INITIALIZATION TESTS ====================
  describe('Initialization', () => {
    it('returns correct initial state', () => {
      // Arrange & Act
      const { result } = renderHookWithDefaults();

      // Assert
      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.action).toBe('function');
    });

    it('accepts initial parameters correctly', () => {
      // Arrange
      const initialParams = { initialValue: 'test' };

      // Act
      const { result } = renderHookWithDefaults(initialParams);

      // Assert
      expect(result.current.data).toEqual(expect.objectContaining({
        value: 'test'
      }));
    });

    it('initializes with correct default configuration', () => {
      // Arrange & Act
      const { result } = renderHookWithDefaults();

      // Assert
      expect(result.current.config).toEqual({
        autoFetch: false,
        retryCount: 3,
        timeout: 5000,
      });
    });
  });

  // ==================== STATE MANAGEMENT TESTS ====================
  describe('State Management', () => {
    it('updates state correctly when action is called', async () => {
      // Arrange
      const { result } = renderHookWithDefaults();

      // Act
      await act(async () => {
        await result.current.action('test-parameter');
      });

      // Assert
      expect(result.current.data).not.toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('handles loading state correctly', async () => {
      // Arrange
      const mockService = require('../../../services/exampleService');
      mockService.exampleService.getData.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockUpdatedData), 100))
      );
      const { result } = renderHookWithDefaults();

      // Act
      act(() => {
        result.current.action();
      });

      // Assert - Loading state
      expect(result.current.loading).toBe(true);

      // Wait for completion
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('maintains state consistency during updates', async () => {
      // Arrange
      const { result } = renderHookWithDefaults();

      // Act
      await act(async () => {
        await result.current.action('first-update');
      });

      const firstState = result.current.data;

      await act(async () => {
        await result.current.action('second-update');
      });

      // Assert
      expect(result.current.data).not.toEqual(firstState);
      expect(result.current.data).toEqual(expect.objectContaining({
        value: 'second-update'
      }));
    });
  });

  // ==================== ERROR HANDLING TESTS ====================
  describe('Error Handling', () => {
    it('handles service errors gracefully', async () => {
      // Arrange
      const mockService = require('../../../services/exampleService');
      const testError = new Error('Service error');
      mockService.exampleService.getData.mockRejectedValue(testError);
      const { result } = renderHookWithDefaults();

      // Act
      await act(async () => {
        await result.current.action();
      });

      // Assert
      expect(result.current.error).toEqual(testError);
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeNull();
    });

    it('resets error state on successful action', async () => {
      // Arrange
      const mockService = require('../../../services/exampleService');
      mockService.exampleService.getData
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(mockUpdatedData);
      const { result } = renderHookWithDefaults();

      // Act - First call (error)
      await act(async () => {
        await result.current.action();
      });

      expect(result.current.error).not.toBeNull();

      // Act - Second call (success)
      await act(async () => {
        await result.current.action();
      });

      // Assert
      expect(result.current.error).toBeNull();
      expect(result.current.data).toEqual(mockUpdatedData);
    });

    it('handles network timeouts correctly', async () => {
      // Arrange
      const mockService = require('../../../services/exampleService');
      mockService.exampleService.getData.mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 6000)
        )
      );
      const { result } = renderHookWithDefaults({ timeout: 1000 });

      // Act
      await act(async () => {
        await result.current.action();
      });

      // Assert
      expect(result.current.error).toEqual(expect.objectContaining({
        message: expect.stringContaining('Timeout')
      }));
    });
  });

  // ==================== SIDE EFFECTS TESTS ====================
  describe('Side Effects', () => {
    it('calls service methods with correct parameters', async () => {
      // Arrange
      const mockService = require('../../../services/exampleService');
      mockService.exampleService.getData.mockResolvedValue(mockUpdatedData);
      const { result } = renderHookWithDefaults();

      // Act
      await act(async () => {
        await result.current.action('test-param');
      });

      // Assert
      expect(mockService.exampleService.getData).toHaveBeenCalledWith('test-param');
      expect(mockService.exampleService.getData).toHaveBeenCalledTimes(1);
    });

    it('subscribes to external events correctly', () => {
      // Arrange
      const mockService = require('../../../services/exampleService');
      const mockSubscribe = jest.fn();
      const mockUnsubscribe = jest.fn();
      mockService.exampleService.subscribe.mockReturnValue(mockUnsubscribe);

      // Act
      const { unmount } = renderHookWithDefaults({ autoSubscribe: true });

      // Assert
      expect(mockService.exampleService.subscribe).toHaveBeenCalled();

      // Act - Unmount
      unmount();

      // Assert
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('cleans up resources on unmount', () => {
      // Arrange
      const mockService = require('../../../services/exampleService');
      const mockCleanup = jest.fn();
      mockService.exampleService.subscribe.mockReturnValue(mockCleanup);

      // Act
      const { unmount } = renderHookWithDefaults();
      unmount();

      // Assert
      expect(mockCleanup).toHaveBeenCalled();
    });
  });

  // ==================== PERFORMANCE TESTS ====================
  describe('Performance', () => {
    it('does not cause unnecessary re-renders', () => {
      // Arrange
      const { result, rerender } = renderHookWithDefaults();
      const initialResult = result.current;

      // Act
      rerender();

      // Assert
      expect(result.current.action).toBe(initialResult.action);
    });

    it('memoizes expensive computations correctly', () => {
      // Arrange
      const expensiveComputation = jest.fn(() => 'computed-value');
      const { result, rerender } = renderHook(() => 
        useHookName({ computeFn: expensiveComputation })
      );

      // Act
      rerender();
      rerender();

      // Assert
      expect(expensiveComputation).toHaveBeenCalledTimes(1);
    });

    it('handles rapid successive calls efficiently', async () => {
      // Arrange
      const mockService = require('../../../services/exampleService');
      mockService.exampleService.getData.mockResolvedValue(mockUpdatedData);
      const { result } = renderHookWithDefaults();

      // Act
      const promises = Array.from({ length: 5 }, () => 
        act(async () => {
          await result.current.action();
        })
      );

      await Promise.all(promises);

      // Assert
      expect(mockService.exampleService.getData).toHaveBeenCalledTimes(5);
      expect(result.current.data).toEqual(mockUpdatedData);
    });
  });

  // ==================== INTEGRATION TESTS ====================
  describe('Integration', () => {
    it('integrates correctly with store', () => {
      // Arrange
      const mockStore = require('../../../stores/exampleStore');
      const mockStoreData = { storeValue: 'test' };
      mockStore.useExampleStore.mockReturnValue(mockStoreData);

      // Act
      const { result } = renderHookWithDefaults();

      // Assert
      expect(result.current.storeData).toEqual(mockStoreData);
    });

    it('works correctly with other hooks', () => {
      // Arrange
      const mockOtherHook = require('../../../hooks/useOtherHook');
      const mockOtherHookData = { otherValue: 'test' };
      mockOtherHook.useOtherHook.mockReturnValue(mockOtherHookData);

      // Act
      const { result } = renderHookWithDefaults();

      // Assert
      expect(result.current.otherData).toEqual(mockOtherHookData);
    });
  });

  // ==================== EDGE CASES TESTS ====================
  describe('Edge Cases', () => {
    it('handles null/undefined parameters gracefully', () => {
      // Arrange & Act
      const { result: resultNull } = renderHook(() => useHookName(null));
      const { result: resultUndefined } = renderHook(() => useHookName(undefined));

      // Assert
      expect(() => resultNull.current.action()).not.toThrow();
      expect(() => resultUndefined.current.action()).not.toThrow();
    });

    it('handles empty data responses correctly', async () => {
      // Arrange
      const mockService = require('../../../services/exampleService');
      mockService.exampleService.getData.mockResolvedValue(null);
      const { result } = renderHookWithDefaults();

      // Act
      await act(async () => {
        await result.current.action();
      });

      // Assert
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('handles concurrent calls correctly', async () => {
      // Arrange
      const mockService = require('../../../services/exampleService');
      mockService.exampleService.getData.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockUpdatedData), 50))
      );
      const { result } = renderHookWithDefaults();

      // Act
      const call1 = act(async () => {
        await result.current.action('call1');
      });
      const call2 = act(async () => {
        await result.current.action('call2');
      });

      await Promise.all([call1, call2]);

      // Assert
      expect(result.current.data).toEqual(mockUpdatedData);
      expect(mockService.exampleService.getData).toHaveBeenCalledTimes(2);
    });
  });
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Helper function to simulate async operations
 */
const simulateAsyncOperation = async (delay = 100) => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, delay));
  });
};

/**
 * Helper function to create mock service responses
 */
const createMockResponse = (data: any, delay = 0) => {
  return new Promise(resolve => 
    setTimeout(() => resolve(data), delay)
  );
};

/**
 * Helper function to create mock error responses
 */
const createMockError = (message: string, delay = 0) => {
  return new Promise((_, reject) => 
    setTimeout(() => reject(new Error(message)), delay)
  );
};
