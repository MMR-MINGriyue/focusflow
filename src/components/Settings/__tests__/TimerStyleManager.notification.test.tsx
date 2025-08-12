/**
 * TimerStyleManager 通知系统测试
 * 
 * 验证通知系统的完整性和正确性
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { testUtils } from '../../../tests/utils/testUtils';
import TimerStyleManager from '../TimerStyleManager';

// Mock dependencies
jest.mock('../../../services/timerStyle', () => ({
  timerStyleService: {
    getCurrentStyle: jest.fn(() => testUtils.generateTimerStyle()),
    getPreviewStyle: jest.fn(() => null),
    getCustomStyles: jest.fn(() => []),
    getAllStyles: jest.fn(() => [testUtils.generateTimerStyle()]),
    getSettings: jest.fn(() => ({ enableNotifications: true, autoSave: false })),
    setCurrentStyle: jest.fn(() => true),
    addCustomStyle: jest.fn(() => true),
    removeCustomStyle: jest.fn(() => true),
    duplicateStyle: jest.fn(() => testUtils.generateTimerStyle()),
    exportStyle: jest.fn(() => JSON.stringify(testUtils.generateTimerStyle())),
    importStyle: jest.fn(() => testUtils.generateTimerStyle()),
    previewStyle: jest.fn(() => true),
    exitPreview: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
  },
}));

describe('TimerStyleManager Notification System Tests', () => {
  const mockTimerStyleService = require('../../../services/timerStyle').timerStyleService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // ==================== 通知显示测试 ====================
  describe('Notification Display', () => {
    it('shows success notification when style is applied', async () => {
      // Arrange
      const currentStyle = testUtils.generateTimerStyle({ id: 'current-style', name: 'Current Style' });
      const testStyle = testUtils.generateTimerStyle({ id: 'test-style', name: 'Test Style' });

      // 设置当前样式和可用样式，确保它们不同以显示应用按钮
      mockTimerStyleService.getCurrentStyle.mockReturnValue(currentStyle);
      mockTimerStyleService.getAllStyles.mockReturnValue([currentStyle, testStyle]);
      mockTimerStyleService.getCustomStyles.mockReturnValue([testStyle]);

      render(<TimerStyleManager />);

      // Act - Click apply button
      const applyButton = screen.getByRole('button', { name: '应用' });
      fireEvent.click(applyButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('已应用样式 "Test Style"')).toBeInTheDocument();
      });
    });

    it('shows success notification when style is saved', async () => {
      // Arrange
      const testStyle = testUtils.generateTimerStyle({ name: 'Test Style' });
      mockTimerStyleService.getCustomStyles.mockReturnValue([testStyle]);

      render(<TimerStyleManager />);

      // Act - Start editing and save
      const editButton = screen.getByRole('button', { name: '编辑样式' });
      fireEvent.click(editButton);

      const nameInput = screen.getByDisplayValue('Test Style');
      fireEvent.change(nameInput, { target: { value: 'Updated Style' } });

      const saveButton = screen.getByText('保存');
      fireEvent.click(saveButton);

      // Assert
      expect(screen.getByText('样式保存成功！')).toBeInTheDocument();
    });

    it('shows success notification when style is duplicated', async () => {
      // Arrange
      const testStyle = testUtils.generateTimerStyle({ name: 'Original Style' });
      const duplicatedStyle = testUtils.generateTimerStyle({ name: 'Original Style (副本)' });
      
      mockTimerStyleService.getCustomStyles.mockReturnValue([testStyle]);
      mockTimerStyleService.duplicateStyle.mockReturnValue(duplicatedStyle);

      render(<TimerStyleManager />);

      // Act
      const duplicateButton = screen.getByRole('button', { name: '复制样式' });
      fireEvent.click(duplicateButton);

      // Assert
      expect(screen.getByText('样式 "Original Style (副本)" 创建成功！')).toBeInTheDocument();
    });

    it('shows success notification when style is exported', async () => {
      // Arrange
      const testStyle = testUtils.generateTimerStyle({ name: 'Export Style' });
      mockTimerStyleService.getCustomStyles.mockReturnValue([testStyle]);

      // Mock URL.createObjectURL and related methods
      global.URL.createObjectURL = jest.fn(() => 'blob:test-url');
      global.URL.revokeObjectURL = jest.fn();
      
      // Mock document methods
      const mockAnchor = {
        href: '',
        download: '',
        click: jest.fn(),
      };
      jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
      jest.spyOn(document.body, 'appendChild').mockImplementation();
      jest.spyOn(document.body, 'removeChild').mockImplementation();

      render(<TimerStyleManager />);

      // Act
      const exportButton = screen.getByRole('button', { name: '导出样式' });
      fireEvent.click(exportButton);

      // Assert
      expect(screen.getByText('样式 "Export Style" 导出成功！')).toBeInTheDocument();
    });

    it('shows success notification when style is imported', async () => {
      // Arrange
      const importedStyle = testUtils.generateTimerStyle({ name: 'Imported Style' });
      mockTimerStyleService.importStyle.mockReturnValue(importedStyle);

      render(<TimerStyleManager />);

      // Act
      const fileInput = document.getElementById('style-import') as HTMLInputElement;
      const file = new File([JSON.stringify(importedStyle)], 'style.json', { type: 'application/json' });
      
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Wait for FileReader to process
      await waitFor(() => {
        expect(screen.getByText('样式 "Imported Style" 导入成功！')).toBeInTheDocument();
      });
    });
  });

  // ==================== 错误通知测试 ====================
  describe('Error Notifications', () => {
    it('shows error notification when save fails', async () => {
      // Arrange
      const testStyle = testUtils.generateTimerStyle({ name: 'Test Style' });
      mockTimerStyleService.getCustomStyles.mockReturnValue([testStyle]);
      mockTimerStyleService.addCustomStyle.mockReturnValue(false);

      render(<TimerStyleManager />);

      // Act
      const editButton = screen.getByLabelText('编辑样式');
      fireEvent.click(editButton);

      const saveButton = screen.getByText('保存');
      fireEvent.click(saveButton);

      // Assert
      expect(screen.getByText('保存失败，请重试。')).toBeInTheDocument();
      expect(screen.getByText('保存失败，请重试。').closest('div')).toHaveClass('bg-red-50');
    });

    it('shows error notification when duplicate fails', async () => {
      // Arrange
      const testStyle = testUtils.generateTimerStyle();
      mockTimerStyleService.getCustomStyles.mockReturnValue([testStyle]);
      mockTimerStyleService.duplicateStyle.mockReturnValue(null);

      render(<TimerStyleManager />);

      // Act
      const duplicateButton = screen.getByLabelText('复制样式');
      fireEvent.click(duplicateButton);

      // Assert
      expect(screen.getByText('复制样式失败，请重试。')).toBeInTheDocument();
    });

    it('shows error notification when export fails', async () => {
      // Arrange
      const testStyle = testUtils.generateTimerStyle();
      mockTimerStyleService.getCustomStyles.mockReturnValue([testStyle]);
      mockTimerStyleService.exportStyle.mockReturnValue(null);

      render(<TimerStyleManager />);

      // Act
      const exportButton = screen.getByLabelText('导出样式');
      fireEvent.click(exportButton);

      // Assert
      expect(screen.getByText('导出失败，请重试。')).toBeInTheDocument();
    });

    it('shows error notification when import fails', async () => {
      // Arrange
      mockTimerStyleService.importStyle.mockReturnValue(null);

      render(<TimerStyleManager />);

      // Act
      const fileInput = screen.getByLabelText('导入样式文件');
      const file = new File(['invalid json'], 'style.json', { type: 'application/json' });
      
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Wait for FileReader to process
      await waitFor(() => {
        expect(screen.getByText('导入失败，请检查文件格式。')).toBeInTheDocument();
      });
    });
  });

  // ==================== 通知行为测试 ====================
  describe('Notification Behavior', () => {
    it('auto-hides notification after 3 seconds', async () => {
      // Arrange
      const testStyle = testUtils.generateTimerStyle({ name: 'Test Style' });
      mockTimerStyleService.getAllStyles.mockReturnValue([testStyle]);
      mockTimerStyleService.getCustomStyles.mockReturnValue([testStyle]);

      render(<TimerStyleManager />);

      // Act
      const applyButton = screen.getByText('应用');
      fireEvent.click(applyButton);

      // Assert - Notification is visible
      expect(screen.getByText('已应用样式 "Test Style"')).toBeInTheDocument();

      // Act - Fast forward 3 seconds
      jest.advanceTimersByTime(3000);

      // Assert - Notification should be hidden
      await waitFor(() => {
        expect(screen.queryByText('已应用样式 "Test Style"')).not.toBeInTheDocument();
      });
    });

    it('allows manual dismissal of notification', async () => {
      // Arrange
      const testStyle = testUtils.generateTimerStyle({ name: 'Test Style' });
      mockTimerStyleService.getAllStyles.mockReturnValue([testStyle]);
      mockTimerStyleService.getCustomStyles.mockReturnValue([testStyle]);

      render(<TimerStyleManager />);

      // Act
      const applyButton = screen.getByText('应用');
      fireEvent.click(applyButton);

      // Assert - Notification is visible
      expect(screen.getByText('已应用样式 "Test Style"')).toBeInTheDocument();

      // Act - Click close button
      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      // Assert - Notification should be hidden immediately
      expect(screen.queryByText('已应用样式 "Test Style"')).not.toBeInTheDocument();
    });

    it('shows only one notification at a time', async () => {
      // Arrange
      const testStyle = testUtils.generateTimerStyle({ name: 'Test Style' });
      mockTimerStyleService.getAllStyles.mockReturnValue([testStyle]);
      mockTimerStyleService.getCustomStyles.mockReturnValue([testStyle]);

      render(<TimerStyleManager />);

      // Act - Trigger multiple notifications quickly
      const applyButton = screen.getByText('应用');
      fireEvent.click(applyButton);
      fireEvent.click(applyButton);

      // Assert - Only one notification should be visible
      const notifications = screen.getAllByText('已应用样式 "Test Style"');
      expect(notifications).toHaveLength(1);
    });
  });

  // ==================== 通知样式测试 ====================
  describe('Notification Styling', () => {
    it('applies correct styling for success notifications', async () => {
      // Arrange
      const testStyle = testUtils.generateTimerStyle({ name: 'Test Style' });
      mockTimerStyleService.getAllStyles.mockReturnValue([testStyle]);
      mockTimerStyleService.getCustomStyles.mockReturnValue([testStyle]);

      render(<TimerStyleManager />);

      // Act
      const applyButton = screen.getByText('应用');
      fireEvent.click(applyButton);

      // Assert
      const notification = screen.getByText('已应用样式 "Test Style"').closest('div');
      expect(notification).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800');
    });

    it('applies correct styling for error notifications', async () => {
      // Arrange
      const testStyle = testUtils.generateTimerStyle();
      mockTimerStyleService.getCustomStyles.mockReturnValue([testStyle]);
      mockTimerStyleService.addCustomStyle.mockReturnValue(false);

      render(<TimerStyleManager />);

      // Act
      const editButton = screen.getByLabelText('编辑样式');
      fireEvent.click(editButton);

      const saveButton = screen.getByText('保存');
      fireEvent.click(saveButton);

      // Assert
      const notification = screen.getByText('保存失败，请重试。').closest('div');
      expect(notification).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800');
    });

    it('positions notification correctly', async () => {
      // Arrange
      const testStyle = testUtils.generateTimerStyle({ name: 'Test Style' });
      mockTimerStyleService.getAllStyles.mockReturnValue([testStyle]);
      mockTimerStyleService.getCustomStyles.mockReturnValue([testStyle]);

      render(<TimerStyleManager />);

      // Act
      const applyButton = screen.getByText('应用');
      fireEvent.click(applyButton);

      // Assert
      const notification = screen.getByText('已应用样式 "Test Style"').closest('div');
      expect(notification).toHaveClass('fixed', 'top-4', 'right-4', 'z-50');
    });
  });
});
