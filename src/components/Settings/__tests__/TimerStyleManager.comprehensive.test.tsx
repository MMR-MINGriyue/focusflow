/**
 * TimerStyleManager 组件全面测试
 * 基于实际组件功能的针对性测试
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    addListener: jest.fn(),
    removeListener: jest.fn(),
  },
}));

// Mock UI components
jest.mock('../../ui/Button', () => ({
  Button: ({ children, onClick, disabled, variant, size, title, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      data-variant={variant}
      data-size={size}
      title={title}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Monitor: () => <div data-testid="monitor-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Edit3: () => <div data-testid="edit-icon" />,
  Copy: () => <div data-testid="copy-icon" />,
  Download: () => <div data-testid="download-icon" />,
  Upload: () => <div data-testid="upload-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eye-off-icon" />,
}));

import TimerStyleManager from '../TimerStyleManager';

describe('TimerStyleManager Comprehensive Tests', () => {
  const mockTimerStyleService = require('../../../services/timerStyle').timerStyleService;

  const mockDefaultStyle: TimerStyleConfig = {
    id: 'digital-modern',
    name: '现代数字',
    description: '现代数字风格计时器',
    displayStyle: 'digital',
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      background: '#ffffff',
      text: '#1e293b',
      accent: '#06b6d4',
      progress: '#10b981',
      progressBackground: '#e5e7eb',
    },
    layout: {
      alignment: 'center',
      spacing: 'normal',
      showStatusIndicator: true,
      showProgressPercentage: true,
      showStateText: true,
    },
    animations: {
      enabled: true,
      transitionDuration: 300,
      easing: 'ease-in-out',
      pulseOnStateChange: true,
      breathingEffect: false,
      rotationEffect: false,
    },
    size: 'large',
    numberStyle: 'standard',
    progressStyle: 'linear',
    particles: {
      enabled: false,
      count: 0,
      speed: 1,
      size: 2,
      color: '#3b82f6',
    },
    background: {
      pattern: 'none',
      opacity: 0.1,
      color: '#f8fafc',
    },
  };

  const mockCustomStyle: TimerStyleConfig = {
    ...mockDefaultStyle,
    id: 'custom-1',
    name: '自定义样式',
    description: '用户自定义样式',
  };

  const mockSettings: TimerStyleSettings = {
    currentStyleId: 'digital-modern',
    customStyles: [],
    previewMode: false,
    autoSwitchByState: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockTimerStyleService.getSettings.mockReturnValue(mockSettings);
    mockTimerStyleService.getCurrentStyle.mockReturnValue(mockDefaultStyle);
    mockTimerStyleService.getPreviewStyle.mockReturnValue(null);
    mockTimerStyleService.getCustomStyles.mockReturnValue([]);
    mockTimerStyleService.setCurrentStyle.mockReturnValue(true);
    mockTimerStyleService.addCustomStyle.mockReturnValue(true);
    mockTimerStyleService.updateCustomStyle.mockReturnValue(true);
    mockTimerStyleService.removeCustomStyle.mockReturnValue(true);
    mockTimerStyleService.duplicateStyle.mockReturnValue(mockCustomStyle);
    mockTimerStyleService.exportStyle.mockReturnValue(JSON.stringify(mockCustomStyle));
    mockTimerStyleService.importStyle.mockReturnValue(mockCustomStyle);
  });

  describe('Component Rendering', () => {
    it('renders main title and import button', () => {
      render(<TimerStyleManager />);
      
      expect(screen.getByText('计时器样式管理')).toBeInTheDocument();
      expect(screen.getByText('导入样式')).toBeInTheDocument();
    });

    it('displays current style information', () => {
      render(<TimerStyleManager />);
      
      expect(screen.getByText('现代数字')).toBeInTheDocument();
      expect(screen.getByText('现代数字风格计时器')).toBeInTheDocument();
    });

    it('shows custom styles section', () => {
      mockTimerStyleService.getCustomStyles.mockReturnValue([mockCustomStyle]);
      
      render(<TimerStyleManager />);
      
      expect(screen.getByText('自定义样式 (1)')).toBeInTheDocument();
      expect(screen.getByText('自定义样式')).toBeInTheDocument();
    });
  });

  describe('Style Management Actions', () => {
    beforeEach(() => {
      mockTimerStyleService.getCustomStyles.mockReturnValue([mockCustomStyle]);
    });

    it('applies style when apply button is clicked', async () => {
      const user = userEvent.setup();
      render(<TimerStyleManager />);
      
      const applyButton = screen.getByText('应用');
      await user.click(applyButton);
      
      expect(mockTimerStyleService.setCurrentStyle).toHaveBeenCalledWith('custom-1');
    });

    it('toggles preview when preview button is clicked', async () => {
      const user = userEvent.setup();
      render(<TimerStyleManager />);
      
      const previewButton = screen.getByTitle('预览样式');
      await user.click(previewButton);
      
      expect(mockTimerStyleService.previewStyle).toHaveBeenCalledWith('custom-1');
    });

    it('exits preview when already previewing', async () => {
      mockTimerStyleService.getPreviewStyle.mockReturnValue(mockCustomStyle);
      
      const user = userEvent.setup();
      render(<TimerStyleManager />);
      
      const previewButton = screen.getByTitle('退出预览');
      await user.click(previewButton);
      
      expect(mockTimerStyleService.exitPreview).toHaveBeenCalled();
    });

    it('duplicates style when duplicate button is clicked', async () => {
      // Mock window.alert
      const mockAlert = jest.fn();
      Object.defineProperty(window, 'alert', { value: mockAlert });
      
      const user = userEvent.setup();
      render(<TimerStyleManager />);
      
      const duplicateButton = screen.getByTitle('复制样式');
      await user.click(duplicateButton);
      
      expect(mockTimerStyleService.duplicateStyle).toHaveBeenCalledWith('custom-1');
      expect(mockAlert).toHaveBeenCalledWith('样式 "自定义样式" 创建成功！');
    });
  });

  describe('Style Editing', () => {
    beforeEach(() => {
      mockTimerStyleService.getCustomStyles.mockReturnValue([mockCustomStyle]);
    });

    it('enters edit mode when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<TimerStyleManager />);
      
      const editButton = screen.getByTitle('编辑样式');
      await user.click(editButton);
      
      expect(screen.getByDisplayValue('自定义样式')).toBeInTheDocument();
      expect(screen.getByDisplayValue('用户自定义样式')).toBeInTheDocument();
      expect(screen.getByText('保存')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
    });

    it('saves edited style when save button is clicked', async () => {
      const user = userEvent.setup();
      render(<TimerStyleManager />);
      
      // Enter edit mode
      const editButton = screen.getByTitle('编辑样式');
      await user.click(editButton);
      
      // Modify name
      const nameInput = screen.getByDisplayValue('自定义样式');
      await user.clear(nameInput);
      await user.type(nameInput, '修改后的样式');
      
      // Save
      const saveButton = screen.getByText('保存');
      await user.click(saveButton);
      
      expect(mockTimerStyleService.addCustomStyle).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '修改后的样式',
        })
      );
    });

    it('cancels editing when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<TimerStyleManager />);
      
      // Enter edit mode
      const editButton = screen.getByTitle('编辑样式');
      await user.click(editButton);
      
      // Cancel
      const cancelButton = screen.getByText('取消');
      await user.click(cancelButton);
      
      // Should exit edit mode
      expect(screen.queryByDisplayValue('自定义样式')).not.toBeInTheDocument();
      expect(screen.queryByText('保存')).not.toBeInTheDocument();
    });
  });

  describe('Style Deletion', () => {
    beforeEach(() => {
      mockTimerStyleService.getCustomStyles.mockReturnValue([mockCustomStyle]);
    });

    it('shows confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<TimerStyleManager />);
      
      const deleteButton = screen.getByTitle('删除样式');
      await user.click(deleteButton);
      
      expect(screen.getByText('确定要删除这个自定义样式吗？此操作无法撤销。')).toBeInTheDocument();
      expect(screen.getByText('确认')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
    });

    it('deletes style when confirmed', async () => {
      const user = userEvent.setup();
      render(<TimerStyleManager />);
      
      const deleteButton = screen.getByTitle('删除样式');
      await user.click(deleteButton);
      
      const confirmButton = screen.getByText('确认');
      await user.click(confirmButton);
      
      expect(mockTimerStyleService.removeCustomStyle).toHaveBeenCalledWith('custom-1');
    });

    it('shows success notification after successful deletion', async () => {
      const user = userEvent.setup();
      render(<TimerStyleManager />);
      
      const deleteButton = screen.getByTitle('删除样式');
      await user.click(deleteButton);
      
      const confirmButton = screen.getByText('确认');
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('样式删除成功！')).toBeInTheDocument();
      });
    });
  });

  describe('Import/Export Functionality', () => {
    it('handles style export correctly', async () => {
      mockTimerStyleService.getCustomStyles.mockReturnValue([mockCustomStyle]);
      
      // Mock DOM methods
      const mockCreateObjectURL = jest.fn(() => 'blob:mock-url');
      const mockRevokeObjectURL = jest.fn();
      const mockClick = jest.fn();
      const mockAppendChild = jest.fn();
      const mockRemoveChild = jest.fn();
      
      Object.defineProperty(URL, 'createObjectURL', { value: mockCreateObjectURL });
      Object.defineProperty(URL, 'revokeObjectURL', { value: mockRevokeObjectURL });
      
      const mockAnchor = {
        href: '',
        download: '',
        click: mockClick,
      };
      
      jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
      jest.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
      jest.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);
      
      const user = userEvent.setup();
      render(<TimerStyleManager />);
      
      const exportButton = screen.getByTitle('导出样式');
      await user.click(exportButton);
      
      expect(mockTimerStyleService.exportStyle).toHaveBeenCalledWith('custom-1');
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('Notifications', () => {
    it('shows and auto-hides notifications', async () => {
      jest.useFakeTimers();
      
      mockTimerStyleService.getCustomStyles.mockReturnValue([mockCustomStyle]);
      
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<TimerStyleManager />);
      
      // Trigger a notification by deleting a style
      const deleteButton = screen.getByTitle('删除样式');
      await user.click(deleteButton);
      
      const confirmButton = screen.getByText('确认');
      await user.click(confirmButton);
      
      // Notification should appear
      await waitFor(() => {
        expect(screen.getByText('样式删除成功！')).toBeInTheDocument();
      });
      
      // Fast-forward time to auto-hide notification
      jest.advanceTimersByTime(3000);
      
      await waitFor(() => {
        expect(screen.queryByText('样式删除成功！')).not.toBeInTheDocument();
      });
      
      jest.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    it('handles service errors gracefully', () => {
      mockTimerStyleService.getCurrentStyle.mockImplementation(() => {
        throw new Error('Service error');
      });
      
      expect(() => render(<TimerStyleManager />)).not.toThrow();
    });

    it('shows error notification when deletion fails', async () => {
      mockTimerStyleService.getCustomStyles.mockReturnValue([mockCustomStyle]);
      mockTimerStyleService.removeCustomStyle.mockReturnValue(false);
      
      const user = userEvent.setup();
      render(<TimerStyleManager />);
      
      const deleteButton = screen.getByTitle('删除样式');
      await user.click(deleteButton);
      
      const confirmButton = screen.getByText('确认');
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('删除样式失败，请重试。')).toBeInTheDocument();
      });
    });
  });
});
