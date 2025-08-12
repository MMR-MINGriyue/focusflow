/**
 * useErrorHandler Hook 测试
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useErrorHandler, useSimpleErrorHandler, useAsyncErrorHandler } from '../useErrorHandler';
import { errorHandler } from '../../utils/errorHandler';
import { errorToastManager } from '../../components/ErrorToast';

// Mock dependencies
jest.mock('../../utils/errorHandler', () => ({
  errorHandler: {
    logError: jest.fn(() => 'mock-error-id')
  }
}));

jest.mock('../../components/ErrorToast', () => ({
  errorToastManager: {
    error: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    info: jest.fn()
  }
}));

const mockErrorHandler = errorHandler as jest.Mocked<typeof errorHandler>;
const mockErrorToastManager = errorToastManager as jest.Mocked<typeof errorToastManager>;

describe('useErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Error Handling', () => {
    it('handles errors correctly', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      act(() => {
        const errorId = result.current.handleError('Test error');
        expect(errorId).toBe('mock-error-id');
      });

      expect(mockErrorHandler.logError).toHaveBeenCalledWith(
        'Test error',
        {},
        'medium'
      );
      expect(mockErrorToastManager.error).toHaveBeenCalled();
    });

    it('handles Error objects correctly', () => {
      const { result } = renderHook(() => useErrorHandler());
      const testError = new Error('Test error object');
      
      act(() => {
        result.current.handleError(testError);
      });

      expect(mockErrorHandler.logError).toHaveBeenCalledWith(
        testError,
        {},
        'medium'
      );
    });

    it('respects custom severity', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      act(() => {
        result.current.handleError('Test error', { severity: 'high' });
      });

      expect(mockErrorHandler.logError).toHaveBeenCalledWith(
        'Test error',
        {},
        'high'
      );
    });

    it('includes custom context', () => {
      const { result } = renderHook(() => useErrorHandler({
        context: { component: 'TestComponent' }
      }));
      
      act(() => {
        result.current.handleError('Test error', { 
          context: { action: 'testAction' } 
        });
      });

      expect(mockErrorHandler.logError).toHaveBeenCalledWith(
        'Test error',
        { component: 'TestComponent', action: 'testAction' },
        'medium'
      );
    });
  });

  describe('Toast Management', () => {
    it('shows toast by default', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      act(() => {
        result.current.handleError('Test error');
      });

      expect(mockErrorToastManager.error).toHaveBeenCalled();
    });

    it('respects showToast option', () => {
      const { result } = renderHook(() => useErrorHandler({ showToast: false }));
      
      act(() => {
        result.current.handleError('Test error');
      });

      expect(mockErrorToastManager.error).not.toHaveBeenCalled();
    });

    it('shows custom user message', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      act(() => {
        result.current.handleError('Technical error', { 
          userMessage: 'User friendly message' 
        });
      });

      expect(mockErrorToastManager.error).toHaveBeenCalledWith(
        'User friendly message',
        expect.any(Object)
      );
    });

    it('shows success messages', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      act(() => {
        result.current.showSuccess('Operation successful');
      });

      expect(mockErrorToastManager.success).toHaveBeenCalledWith('Operation successful');
    });

    it('shows warning messages', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      act(() => {
        result.current.showWarning('Warning message');
      });

      expect(mockErrorToastManager.warning).toHaveBeenCalledWith('Warning message');
    });

    it('shows info messages', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      act(() => {
        result.current.showInfo('Info message');
      });

      expect(mockErrorToastManager.info).toHaveBeenCalledWith('Info message');
    });
  });

  describe('Async Error Handling', () => {
    it('handles successful async operations', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const operation = jest.fn().mockResolvedValue('success');
      
      const response = await act(async () => {
        return await result.current.handleAsync(operation);
      });

      expect(response).toBe('success');
      expect(operation).toHaveBeenCalled();
      expect(mockErrorHandler.logError).not.toHaveBeenCalled();
    });

    it('handles failed async operations', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new Error('Async error');
      const operation = jest.fn().mockRejectedValue(error);
      
      const response = await act(async () => {
        return await result.current.handleAsync(operation, { fallback: 'fallback' });
      });

      expect(response).toBe('fallback');
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(
        error,
        {},
        'medium'
      );
    });

    it('handles async operations without fallback', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new Error('Async error');
      const operation = jest.fn().mockRejectedValue(error);
      
      const response = await act(async () => {
        return await result.current.handleAsync(operation);
      });

      expect(response).toBeUndefined();
    });
  });

  describe('Function Wrapping', () => {
    it('wraps synchronous functions correctly', () => {
      const { result } = renderHook(() => useErrorHandler());
      const originalFn = jest.fn().mockReturnValue('success');
      
      act(() => {
        const wrappedFn = result.current.wrapFunction(originalFn);
        const response = wrappedFn('arg1', 'arg2');
        
        expect(response).toBe('success');
        expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2');
      });

      expect(mockErrorHandler.logError).not.toHaveBeenCalled();
    });

    it('handles synchronous function errors', () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new Error('Sync error');
      const originalFn = jest.fn().mockImplementation(() => {
        throw error;
      });
      
      act(() => {
        const wrappedFn = result.current.wrapFunction(originalFn);
        
        expect(() => wrappedFn()).toThrow(error);
      });

      expect(mockErrorHandler.logError).toHaveBeenCalledWith(
        error,
        {},
        'medium'
      );
    });
  });

  describe('Error Message Mapping', () => {
    it('uses custom error messages', () => {
      const { result } = renderHook(() => useErrorHandler({
        errorMessages: {
          'Network Error': '网络连接失败'
        }
      }));
      
      act(() => {
        result.current.handleError('Network Error occurred');
      });

      expect(mockErrorToastManager.error).toHaveBeenCalledWith(
        '网络连接失败',
        expect.any(Object)
      );
    });

    it('falls back to default messages for unknown errors', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      act(() => {
        result.current.handleError('Unknown error type');
      });

      expect(mockErrorToastManager.error).toHaveBeenCalledWith(
        '操作失败，请重试',
        expect.any(Object)
      );
    });
  });
});

describe('useSimpleErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides simplified interface', () => {
    const { result } = renderHook(() => useSimpleErrorHandler());

    expect(result.current).toHaveProperty('handleError');
    expect(result.current).toHaveProperty('showSuccess');
    expect(result.current).toHaveProperty('showWarning');
    expect(result.current).toHaveProperty('showInfo');
    
    // Should not have complex methods
    expect(result.current).not.toHaveProperty('handleAsync');
    expect(result.current).not.toHaveProperty('wrapFunction');
  });

  it('handles errors with custom message', () => {
    const { result } = renderHook(() => useSimpleErrorHandler());
    
    act(() => {
      result.current.handleError('Test error', 'Custom message');
    });

    expect(mockErrorToastManager.error).toHaveBeenCalledWith(
      'Custom message',
      expect.any(Object)
    );
  });
});

describe('useAsyncErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides async-focused interface', () => {
    const { result } = renderHook(() => useAsyncErrorHandler());

    expect(result.current).toHaveProperty('handleAsync');
    expect(result.current).toHaveProperty('showSuccess');
    
    // Should not have sync-focused methods
    expect(result.current).not.toHaveProperty('handleError');
    expect(result.current).not.toHaveProperty('wrapFunction');
  });

  it('handles async operations with retry enabled', async () => {
    const { result } = renderHook(() => useAsyncErrorHandler());
    const operation = jest.fn().mockResolvedValue('success');
    
    const response = await act(async () => {
      return await result.current.handleAsync(operation);
    });

    expect(response).toBe('success');
    expect(operation).toHaveBeenCalled();
  });
});
