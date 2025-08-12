/**
 * useMemoryLeakDetection Hook 测试
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useMemoryLeakDetection, useSimpleMemoryLeakDetection } from '../useMemoryLeakDetection';
import { memoryLeakDetector } from '../../utils/memoryLeakDetector';

// Mock the memory leak detector
jest.mock('../../utils/memoryLeakDetector', () => ({
  memoryLeakDetector: {
    startMonitoring: jest.fn(),
    stopMonitoring: jest.fn(),
    generateReport: jest.fn(() => ({
      activeTimers: 0,
      activeEventListeners: 0,
      memoryUsage: 10.5,
      memoryTrend: 'stable' as const,
      leakSuspects: [],
      recommendations: ['Memory usage looks healthy'],
      timestamp: Date.now()
    })),
    forceCleanup: jest.fn(),
    getTimerDetails: jest.fn(() => []),
    getEventListenerDetails: jest.fn(() => [])
  }
}));

const mockMemoryLeakDetector = memoryLeakDetector as jest.Mocked<typeof memoryLeakDetector>;

describe('useMemoryLeakDetection', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Set to development for most tests
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    jest.useRealTimers();
    process.env.NODE_ENV = originalEnv;
  });

  describe('Basic Functionality', () => {
    it('initializes with default options', () => {
      // 禁用自动启动以测试初始状态
      const { result } = renderHook(() => useMemoryLeakDetection({
        autoStart: false,
        enableInDevelopment: false
      }));

      expect(result.current.report).toBeNull();
      expect(result.current.isMonitoring).toBe(false);
      expect(typeof result.current.startMonitoring).toBe('function');
      expect(typeof result.current.stopMonitoring).toBe('function');
      expect(typeof result.current.generateReport).toBe('function');
      expect(typeof result.current.forceCleanup).toBe('function');
    });

    it('starts monitoring when autoStart is true', () => {
      renderHook(() => useMemoryLeakDetection({ autoStart: true, enableInDevelopment: true }));

      expect(mockMemoryLeakDetector.startMonitoring).toHaveBeenCalled();
    });

    it('does not start monitoring when autoStart is false', () => {
      renderHook(() => useMemoryLeakDetection({ autoStart: false }));

      expect(mockMemoryLeakDetector.startMonitoring).not.toHaveBeenCalled();
    });
  });

  describe('Environment-based Enabling', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('enables in development when configured', () => {
      process.env.NODE_ENV = 'development';
      
      const { result } = renderHook(() => 
        useMemoryLeakDetection({ 
          autoStart: true, 
          enableInDevelopment: true,
          enableInProduction: false 
        })
      );

      act(() => {
        result.current.startMonitoring();
      });

      expect(mockMemoryLeakDetector.startMonitoring).toHaveBeenCalled();
    });

    it('disables in development when configured', () => {
      process.env.NODE_ENV = 'development';
      
      const { result } = renderHook(() => 
        useMemoryLeakDetection({ 
          autoStart: false,
          enableInDevelopment: false,
          enableInProduction: false 
        })
      );

      act(() => {
        result.current.startMonitoring();
      });

      expect(mockMemoryLeakDetector.startMonitoring).not.toHaveBeenCalled();
    });
  });

  describe('Monitoring Control', () => {
    it('starts and stops monitoring correctly', () => {
      const { result } = renderHook(() => 
        useMemoryLeakDetection({ 
          autoStart: false, 
          enableInDevelopment: true 
        })
      );

      // Start monitoring
      act(() => {
        result.current.startMonitoring();
      });

      expect(result.current.isMonitoring).toBe(true);
      expect(mockMemoryLeakDetector.startMonitoring).toHaveBeenCalled();

      // Stop monitoring
      act(() => {
        result.current.stopMonitoring();
      });

      expect(result.current.isMonitoring).toBe(false);
      expect(mockMemoryLeakDetector.stopMonitoring).toHaveBeenCalled();
    });

    it('generates reports on demand', () => {
      const { result } = renderHook(() => useMemoryLeakDetection());

      act(() => {
        const report = result.current.generateReport();
        expect(report).toBeDefined();
        expect(mockMemoryLeakDetector.generateReport).toHaveBeenCalled();
      });
    });

    it('forces cleanup correctly', () => {
      const { result } = renderHook(() => useMemoryLeakDetection());

      act(() => {
        result.current.forceCleanup();
      });

      expect(mockMemoryLeakDetector.forceCleanup).toHaveBeenCalled();
    });
  });

  describe('Report Generation', () => {
    it('updates report periodically when monitoring', () => {
      const { result } = renderHook(() => 
        useMemoryLeakDetection({ 
          autoStart: true, 
          enableInDevelopment: true,
          reportInterval: 1000 
        })
      );

      // Fast-forward time to trigger report generation
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.report).toBeDefined();
      expect(mockMemoryLeakDetector.generateReport).toHaveBeenCalled();
    });

    it('detects leak suspects correctly', () => {
      mockMemoryLeakDetector.generateReport.mockReturnValue({
        activeTimers: 5,
        activeEventListeners: 10,
        memoryUsage: 15.5,
        memoryTrend: 'increasing',
        leakSuspects: ['Long-running interval: test'],
        recommendations: ['Check for memory leaks'],
        timestamp: Date.now()
      });

      const { result } = renderHook(() => 
        useMemoryLeakDetection({ 
          autoStart: true, 
          enableInDevelopment: true,
          reportInterval: 1000 
        })
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.hasLeakSuspects).toBe(true);
    });
  });

  describe('Threshold Monitoring', () => {
    it('warns when thresholds are exceeded', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      mockMemoryLeakDetector.generateReport.mockReturnValue({
        activeTimers: 15, // Exceeds default threshold of 10
        activeEventListeners: 60, // Exceeds default threshold of 50
        memoryUsage: 20.5,
        memoryTrend: 'increasing',
        leakSuspects: [],
        recommendations: [],
        timestamp: Date.now()
      });

      renderHook(() => 
        useMemoryLeakDetection({ 
          autoStart: true, 
          enableInDevelopment: true,
          reportInterval: 1000 
        })
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Timer count (15) exceeds threshold (10)')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Event listener count (60) exceeds threshold (50)')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Memory usage is increasing')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Cleanup on Unmount', () => {
    it('stops monitoring when component unmounts', () => {
      const { unmount } = renderHook(() => 
        useMemoryLeakDetection({ 
          autoStart: true, 
          enableInDevelopment: true 
        })
      );

      unmount();

      expect(mockMemoryLeakDetector.stopMonitoring).toHaveBeenCalled();
    });
  });
});

describe('useSimpleMemoryLeakDetection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('provides simplified interface', () => {
    const { result } = renderHook(() => useSimpleMemoryLeakDetection());

    expect(result.current).toHaveProperty('report');
    expect(result.current).toHaveProperty('hasLeakSuspects');
    expect(result.current).toHaveProperty('isMonitoring');
    
    // Should not have complex control methods
    expect(result.current).not.toHaveProperty('startMonitoring');
    expect(result.current).not.toHaveProperty('stopMonitoring');
  });

  it('auto-starts monitoring in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    renderHook(() => useSimpleMemoryLeakDetection());

    expect(mockMemoryLeakDetector.startMonitoring).toHaveBeenCalled();

    process.env.NODE_ENV = originalEnv;
  });
});
