/**
 * TimerStyleManager 性能测试
 * 验证组件优化后的性能表现
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimerStyleManager from '../TimerStyleManager';
import { TimerStyleConfig, TimerStyleSettings } from '../../../types/timerStyle';

// Mock dependencies
jest.mock('../../../services/timerStyle', () => ({
  timerStyleService: {
    getSettings: jest.fn(),
    getCurrentStyle: jest.fn(),
    getPreviewStyle: jest.fn(),
    getCustomStyles: jest.fn(),
    setCurrentStyle: jest.fn(),
    addCustomStyle: jest.fn(),
    updateCustomStyle: jest.fn(),
    removeCustomStyle: jest.fn(),
    duplicateStyle: jest.fn(),
    exportStyle: jest.fn(),
    importStyle: jest.fn(),
    previewStyle: jest.fn(),
    exitPreview: jest.fn(),
    isInPreviewMode: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    exportSettings: jest.fn(),
    importSettings: jest.fn(),
  },
}));

const mockTimerStyleService = require('../../../services/timerStyle').timerStyleService;

// Mock data
const mockDefaultStyle: TimerStyleConfig = {
  id: 'digital-modern',
  name: '现代数字',
  description: '现代数字风格计时器',
  displayStyle: 'digital',
  size: 'large',
  numberStyle: 'standard',
  progressStyle: 'linear',
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
  background: {
    color: '#f8fafc',
    opacity: 0.1,
    pattern: 'none'
  },
  particles: {
    enabled: false,
    count: 0,
    size: 2,
    speed: 1,
    color: '#3b82f6'
  }
};

const mockCustomStyle: TimerStyleConfig = {
  ...mockDefaultStyle,
  id: 'custom-1',
  name: '自定义样式',
  description: '用户自定义样式'
};

const mockSettings: TimerStyleSettings = {
  currentStyleId: 'digital-modern',
  customStyles: [mockCustomStyle],
  previewMode: false,
  autoSwitchByState: false
};

describe('TimerStyleManager Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockTimerStyleService.getSettings.mockReturnValue(mockSettings);
    mockTimerStyleService.getCurrentStyle.mockReturnValue(mockDefaultStyle);
    mockTimerStyleService.getPreviewStyle.mockReturnValue(null);
    mockTimerStyleService.getCustomStyles.mockReturnValue([mockCustomStyle]);
    mockTimerStyleService.setCurrentStyle.mockReturnValue(true);
    mockTimerStyleService.addCustomStyle.mockReturnValue(true);
    mockTimerStyleService.updateCustomStyle.mockReturnValue(true);
    mockTimerStyleService.removeCustomStyle.mockReturnValue(true);
    mockTimerStyleService.duplicateStyle.mockReturnValue(mockCustomStyle);
    mockTimerStyleService.exportStyle.mockReturnValue(JSON.stringify(mockCustomStyle));
    mockTimerStyleService.importStyle.mockReturnValue(mockCustomStyle);
    mockTimerStyleService.previewStyle.mockReturnValue(true);
    mockTimerStyleService.exitPreview.mockReturnValue(undefined);
    mockTimerStyleService.isInPreviewMode.mockReturnValue(false);
    mockTimerStyleService.exportSettings.mockReturnValue(JSON.stringify(mockSettings));
    mockTimerStyleService.importSettings.mockReturnValue(true);
  });

  describe('Initial Render Performance', () => {
    it('should render within performance target (<50ms)', () => {
      const startTime = performance.now();
      render(<TimerStyleManager />);
      const endTime = performance.now();
      
      const renderTime = endTime - startTime;
      console.log(`Initial render time: ${renderTime.toFixed(2)}ms`);
      
      expect(renderTime).toBeLessThan(50);
    });

    it('should handle multiple rapid re-renders efficiently', () => {
      const { rerender } = render(<TimerStyleManager />);
      
      const startTime = performance.now();
      
      // Simulate rapid re-renders
      for (let i = 0; i < 10; i++) {
        rerender(<TimerStyleManager />);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / 10;
      
      console.log(`Average re-render time: ${averageTime.toFixed(2)}ms`);
      
      expect(averageTime).toBeLessThan(10); // Each re-render should be <10ms
    });
  });

  describe('State Update Performance', () => {
    it('should handle state updates efficiently', async () => {
      const user = userEvent.setup();
      render(<TimerStyleManager />);
      
      const startTime = performance.now();
      
      // Trigger state update
      const applyButton = screen.getByText('应用');
      await user.click(applyButton);
      
      const endTime = performance.now();
      const updateTime = endTime - startTime;
      
      console.log(`State update time: ${updateTime.toFixed(2)}ms`);
      
      expect(updateTime).toBeLessThan(20);
    });

    it('should handle editing mode transitions efficiently', async () => {
      const user = userEvent.setup();
      render(<TimerStyleManager />);
      
      const startTime = performance.now();
      
      // Start editing
      const editButton = screen.getByTitle('编辑样式');
      await user.click(editButton);
      
      // Cancel editing
      const cancelButton = screen.getByText('取消');
      await user.click(cancelButton);
      
      const endTime = performance.now();
      const transitionTime = endTime - startTime;
      
      console.log(`Edit mode transition time: ${transitionTime.toFixed(2)}ms`);
      
      expect(transitionTime).toBeLessThan(30);
    });
  });

  describe('Memory Performance', () => {
    it('should not cause memory leaks during extended use', () => {
      const iterations = 50;
      const { rerender, unmount } = render(<TimerStyleManager />);
      
      // Get initial memory if available
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Simulate extended use
      for (let i = 0; i < iterations; i++) {
        rerender(<TimerStyleManager />);
      }
      
      unmount();
      
      // Force garbage collection if available
      if ((global as any).gc) {
        (global as any).gc();
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      console.log(`Memory usage - Initial: ${initialMemory}, Final: ${finalMemory}, Increase: ${memoryIncrease}`);
      
      // Memory increase should be reasonable (less than 2MB for this test)
      if (initialMemory > 0) {
        expect(memoryIncrease).toBeLessThan(2 * 1024 * 1024); // 2MB
      }
    });
  });

  describe('Event Listener Performance', () => {
    it('should manage event listeners efficiently', () => {
      const { unmount } = render(<TimerStyleManager />);
      
      // Verify listener was added
      expect(mockTimerStyleService.addListener).toHaveBeenCalledTimes(1);
      
      unmount();
      
      // Verify listener was removed
      expect(mockTimerStyleService.removeListener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance Regression Detection', () => {
    it('should maintain baseline performance metrics', () => {
      const baselineMetrics = {
        initialRender: 50,  // ms
        stateUpdate: 20,    // ms
        reRender: 10,       // ms
        modeTransition: 30  // ms
      };

      // Initial render test
      const startRender = performance.now();
      const { rerender } = render(<TimerStyleManager />);
      const renderTime = performance.now() - startRender;

      // Re-render test
      const startReRender = performance.now();
      rerender(<TimerStyleManager />);
      const reRenderTime = performance.now() - startReRender;

      console.log('Performance Metrics:', {
        initialRender: `${renderTime.toFixed(2)}ms`,
        reRender: `${reRenderTime.toFixed(2)}ms`
      });

      expect(renderTime).toBeLessThan(baselineMetrics.initialRender);
      expect(reRenderTime).toBeLessThan(baselineMetrics.reRender);
    });
  });
});
