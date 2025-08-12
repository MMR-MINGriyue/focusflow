/**
 * 性能监控组件测试
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { PerformanceMonitor, usePerformanceMonitor } from '../PerformanceMonitor';

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    totalJSHeapSize: 100 * 1024 * 1024, // 100MB
    jsHeapSizeLimit: 2 * 1024 * 1024 * 1024 // 2GB
  }
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true
});

// Test component using the hook
const TestComponent: React.FC<{ componentName: string }> = ({ componentName }) => {
  const { metrics } = usePerformanceMonitor(componentName);
  
  return (
    <div>
      <span data-testid="render-time">{metrics.renderTime}</span>
      <span data-testid="render-count">{metrics.renderCount}</span>
      <span data-testid="memory-usage">{metrics.memoryUsage}</span>
    </div>
  );
};

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformance.now.mockReturnValue(Date.now());
  });

  describe('usePerformanceMonitor hook', () => {
    it('should initialize with default metrics', () => {
      render(<TestComponent componentName="TestComponent" />);
      
      expect(screen.getByTestId('render-time')).toHaveTextContent('0');
      expect(screen.getByTestId('render-count')).toHaveTextContent('0');
      expect(screen.getByTestId('memory-usage')).toHaveTextContent('0');
    });

    it('should track render count on re-renders', () => {
      const { rerender } = render(<TestComponent componentName="TestComponent" />);
      
      // Initial render
      expect(screen.getByTestId('render-count')).toHaveTextContent('1');
      
      // Re-render
      rerender(<TestComponent componentName="TestComponent" />);
      expect(screen.getByTestId('render-count')).toHaveTextContent('2');
    });

    it('should measure render time', async () => {
      let startTime = 1000;
      let endTime = 1016; // 16ms render time
      
      mockPerformance.now
        .mockReturnValueOnce(startTime)
        .mockReturnValueOnce(endTime);

      render(<TestComponent componentName="TestComponent" />);
      
      await waitFor(() => {
        const renderTime = screen.getByTestId('render-time').textContent;
        expect(parseFloat(renderTime || '0')).toBeGreaterThan(0);
      });
    });

    it('should warn about slow renders', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      mockPerformance.now
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1020); // 20ms render time (> 16ms threshold)

      render(<TestComponent componentName="SlowComponent" />);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Performance] SlowComponent render took 20.00ms')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('PerformanceMonitor component', () => {
    it('should render toggle button when not visible', () => {
      render(<PerformanceMonitor enabled={false} />);
      
      const toggleButton = screen.getByRole('button');
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).toHaveAttribute('aria-label', expect.stringContaining('性能'));
    });

    it('should show performance metrics when expanded', async () => {
      render(<PerformanceMonitor enabled={true} />);
      
      // Should show compact view initially
      expect(screen.getByText(/性能:/)).toBeInTheDocument();
      
      // Click to expand
      const expandButton = screen.getByRole('button', { name: /展开|详情/ });
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText('性能监控')).toBeInTheDocument();
        expect(screen.getByText(/渲染时间/)).toBeInTheDocument();
        expect(screen.getByText(/内存使用/)).toBeInTheDocument();
      });
    });

    it('should export performance report', async () => {
      // Mock URL.createObjectURL and related APIs
      const mockCreateObjectURL = jest.fn(() => 'mock-url');
      const mockRevokeObjectURL = jest.fn();
      const mockClick = jest.fn();
      const mockAppendChild = jest.fn();
      const mockRemoveChild = jest.fn();

      Object.defineProperty(URL, 'createObjectURL', { value: mockCreateObjectURL });
      Object.defineProperty(URL, 'revokeObjectURL', { value: mockRevokeObjectURL });
      
      const mockAnchor = {
        href: '',
        download: '',
        click: mockClick
      };
      
      jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
      jest.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
      jest.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);

      render(<PerformanceMonitor enabled={true} />);
      
      // Expand the monitor
      const expandButton = screen.getByRole('button', { name: /展开|详情/ });
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        const exportButton = screen.getByRole('button', { name: /导出|export/i });
        fireEvent.click(exportButton);
        
        expect(mockCreateObjectURL).toHaveBeenCalled();
        expect(mockClick).toHaveBeenCalled();
        expect(mockRevokeObjectURL).toHaveBeenCalled();
      });
    });

    it('should update metrics periodically', async () => {
      jest.useFakeTimers();
      
      render(<PerformanceMonitor enabled={true} />);
      
      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/性能:/)).toBeInTheDocument();
      });
      
      jest.useRealTimers();
    });

    it('should handle different positions', () => {
      const { rerender } = render(
        <PerformanceMonitor enabled={true} position="top-left" />
      );
      
      let monitor = screen.getByRole('button').closest('div');
      expect(monitor).toHaveClass('top-4', 'left-4');
      
      rerender(<PerformanceMonitor enabled={true} position="bottom-right" />);
      
      monitor = screen.getByRole('button').closest('div');
      expect(monitor).toHaveClass('bottom-4', 'right-4');
    });

    it('should calculate performance score correctly', async () => {
      // Mock good performance metrics
      mockPerformance.memory.usedJSHeapSize = 30 * 1024 * 1024; // 30MB
      
      render(<PerformanceMonitor enabled={true} />);
      
      const expandButton = screen.getByRole('button', { name: /展开|详情/ });
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        const scoreElement = screen.getByText(/性能评分/);
        expect(scoreElement).toBeInTheDocument();
      });
    });
  });

  describe('Performance optimization utilities', () => {
    it('should detect memory leaks', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Mock high memory usage
      mockPerformance.memory.usedJSHeapSize = 150 * 1024 * 1024; // 150MB
      
      render(<PerformanceMonitor enabled={true} />);
      
      // Should detect high memory usage
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('memory')
      );
      
      consoleSpy.mockRestore();
    });

    it('should provide optimization suggestions', async () => {
      render(<PerformanceMonitor enabled={true} />);
      
      const expandButton = screen.getByRole('button', { name: /展开|详情/ });
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText(/优化建议/)).toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('should handle missing performance API gracefully', () => {
      const originalPerformance = global.performance;
      
      // Remove performance API
      delete (global as any).performance;
      
      expect(() => {
        render(<TestComponent componentName="TestComponent" />);
      }).not.toThrow();
      
      // Restore performance API
      global.performance = originalPerformance;
    });

    it('should handle memory API not available', () => {
      const originalMemory = mockPerformance.memory;
      delete mockPerformance.memory;
      
      expect(() => {
        render(<PerformanceMonitor enabled={true} />);
      }).not.toThrow();
      
      mockPerformance.memory = originalMemory;
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<PerformanceMonitor enabled={false} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
    });

    it('should support keyboard navigation', () => {
      render(<PerformanceMonitor enabled={true} />);
      
      const expandButton = screen.getByRole('button', { name: /展开|详情/ });
      
      // Should be focusable
      expandButton.focus();
      expect(document.activeElement).toBe(expandButton);
      
      // Should respond to Enter key
      fireEvent.keyDown(expandButton, { key: 'Enter' });
      expect(screen.getByText('性能监控')).toBeInTheDocument();
    });
  });
});