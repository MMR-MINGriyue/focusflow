/**
 * TimerStyleManager 组件全面测试
 * 测试样式管理功能、用户交互、错误处理和边界条件
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimerStyleConfig, TimerStyleSettings } from '../../../types/timerStyle';

// Mock dependencies
jest.mock('../../../services/timerStyle', () => ({
  timerStyleService: {
    getSettings: jest.fn(),
    getCurrentStyle: jest.fn(),
    getPreviewStyle: jest.fn(),
    getAllStyles: jest.fn(),
    getCustomStyles: jest.fn(),
    setCurrentStyle: jest.fn(),
    addCustomStyle: jest.fn(),
    updateCustomStyle: jest.fn(),
    removeCustomStyle: jest.fn(),
    enablePreview: jest.fn(),
    disablePreview: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    exportSettings: jest.fn(),
    importSettings: jest.fn(),
  },
}));

import TimerStyleManager from '../TimerStyleManager';

// Mock UI components
jest.mock('../../ui/Button', () => ({
  Button: ({ children, onClick, disabled, variant, size, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock input as regular HTML input since Input component doesn't exist
const MockInput = ({ value, onChange, placeholder, ...props }: any) => (
  <input
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    {...props}
  />
);

jest.mock('../../ui/Textarea', () => ({
  Textarea: ({ value, onChange, placeholder, ...props }: any) => (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      {...props}
    />
  ),
}));

jest.mock('../../ui/Dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children }: any) => <p data-testid="dialog-description">{children}</p>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
}));

describe('TimerStyleManager Component', () => {
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
    customStyles: [mockCustomStyle],
    previewMode: false,
    autoSwitchByState: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockTimerStyleService.getSettings.mockReturnValue(mockSettings);
    mockTimerStyleService.getCurrentStyle.mockReturnValue(mockDefaultStyle);
    mockTimerStyleService.getPreviewStyle.mockReturnValue(null);
    mockTimerStyleService.getAllStyles.mockReturnValue([mockDefaultStyle]);
    mockTimerStyleService.getCustomStyles.mockReturnValue([mockCustomStyle]);
    mockTimerStyleService.setCurrentStyle.mockReturnValue(true);
    mockTimerStyleService.addCustomStyle.mockReturnValue(true);
    mockTimerStyleService.updateCustomStyle.mockReturnValue(true);
    mockTimerStyleService.removeCustomStyle.mockReturnValue(true);
    mockTimerStyleService.exportSettings.mockReturnValue(JSON.stringify(mockSettings));
    mockTimerStyleService.importSettings.mockReturnValue(true);
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<TimerStyleManager />);
      expect(screen.getByText('样式管理')).toBeInTheDocument();
    });

    it('displays current style information', () => {
      render(<TimerStyleManager />);
      
      expect(screen.getByText('当前样式')).toBeInTheDocument();
      expect(screen.getByText('现代数字')).toBeInTheDocument();
      expect(screen.getByText('现代数字风格计时器')).toBeInTheDocument();
    });

    it('displays custom styles list', () => {
      render(<TimerStyleManager />);
      
      expect(screen.getByText('自定义样式')).toBeInTheDocument();
      expect(screen.getByText('自定义样式')).toBeInTheDocument();
    });

    it('shows management buttons', () => {
      render(<TimerStyleManager />);
      
      expect(screen.getByText('导出设置')).toBeInTheDocument();
      expect(screen.getByText('导入设置')).toBeInTheDocument();
    });
  });

  describe('Style Selection', () => {
    it('calls setCurrentStyle when style is selected', async () => {
      const user = userEvent.setup();
      render(<TimerStyleManager />);
      
      const selectButton = screen.getByText('选择');
      await user.click(selectButton);
      
      expect(mockTimerStyleService.setCurrentStyle).toHaveBeenCalledWith(mockDefaultStyle.id);
    });

    it('calls onStyleChange callback when style changes', async () => {
      const mockOnStyleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<TimerStyleManager onStyleChange={mockOnStyleChange} />);
      
      const selectButton = screen.getByText('选择');
      await user.click(selectButton);
      
      expect(mockOnStyleChange).toHaveBeenCalledWith(mockDefaultStyle);
    });
  });

  describe('Preview Mode', () => {
    it('enables preview mode when preview button is clicked', async () => {
      const user = userEvent.setup();
      render(<TimerStyleManager />);

      const previewButton = screen.getByTitle('预览样式');
      await user.click(previewButton);

      expect(mockTimerStyleService.enablePreview).toHaveBeenCalledWith(mockDefaultStyle);
    });

    it('disables preview mode when preview is active and button is clicked again', async () => {
      mockTimerStyleService.getPreviewStyle.mockReturnValue(mockDefaultStyle);

      const user = userEvent.setup();
      render(<TimerStyleManager />);

      const previewButton = screen.getByTitle('停止预览');
      await user.click(previewButton);

      expect(mockTimerStyleService.disablePreview).toHaveBeenCalled();
    });

    it('shows preview indicator when preview is active', () => {
      mockTimerStyleService.getPreviewStyle.mockReturnValue(mockDefaultStyle);
      
      render(<TimerStyleManager />);
      
      expect(screen.getByText('预览中')).toBeInTheDocument();
    });
  });

  describe('Custom Style Management', () => {
    it('starts editing when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<TimerStyleManager />);

      const editButton = screen.getByTitle('编辑样式');
      await user.click(editButton);

      expect(screen.getByDisplayValue('自定义样式')).toBeInTheDocument();
      expect(screen.getByDisplayValue('用户自定义样式')).toBeInTheDocument();
    });

    it('saves edited style when save button is clicked', async () => {
      const user = userEvent.setup();
      render(<TimerStyleManager />);
      
      // Start editing
      const editButton = screen.getByLabelText('编辑样式');
      await user.click(editButton);
      
      // Modify name
      const nameInput = screen.getByDisplayValue('自定义样式');
      await user.clear(nameInput);
      await user.type(nameInput, '修改后的样式');
      
      // Save
      const saveButton = screen.getByText('保存');
      await user.click(saveButton);
      
      expect(mockTimerStyleService.updateCustomStyle).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '修改后的样式',
        })
      );
    });

    it('cancels editing when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<TimerStyleManager />);
      
      // Start editing
      const editButton = screen.getByLabelText('编辑样式');
      await user.click(editButton);
      
      // Cancel
      const cancelButton = screen.getByText('取消');
      await user.click(cancelButton);
      
      expect(screen.queryByDisplayValue('自定义样式')).not.toBeInTheDocument();
    });

    it('duplicates style when duplicate button is clicked', async () => {
      const user = userEvent.setup();
      render(<TimerStyleManager />);
      
      const duplicateButton = screen.getByLabelText('复制样式');
      await user.click(duplicateButton);
      
      expect(mockTimerStyleService.addCustomStyle).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '自定义样式 (副本)',
        })
      );
    });

    it('shows delete confirmation when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<TimerStyleManager />);
      
      const deleteButton = screen.getByLabelText('删除样式');
      await user.click(deleteButton);
      
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByText('确认删除')).toBeInTheDocument();
    });

    it('deletes style when deletion is confirmed', async () => {
      const user = userEvent.setup();
      render(<TimerStyleManager />);
      
      // Click delete
      const deleteButton = screen.getByLabelText('删除样式');
      await user.click(deleteButton);
      
      // Confirm deletion
      const confirmButton = screen.getByText('删除');
      await user.click(confirmButton);
      
      expect(mockTimerStyleService.removeCustomStyle).toHaveBeenCalledWith(mockCustomStyle.id);
    });
  });

  describe('Import/Export', () => {
    it('exports settings when export button is clicked', async () => {
      const user = userEvent.setup();
      
      // Mock URL.createObjectURL and document.createElement
      const mockCreateObjectURL = jest.fn(() => 'blob:mock-url');
      const mockClick = jest.fn();
      const mockAppendChild = jest.fn();
      const mockRemoveChild = jest.fn();
      
      Object.defineProperty(URL, 'createObjectURL', {
        value: mockCreateObjectURL,
      });
      
      const mockAnchor = {
        href: '',
        download: '',
        click: mockClick,
      };
      
      jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
      jest.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
      jest.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);
      
      render(<TimerStyleManager />);
      
      const exportButton = screen.getByText('导出设置');
      await user.click(exportButton);
      
      expect(mockTimerStyleService.exportSettings).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
    });

    it('handles file import when import button is used', async () => {
      const user = userEvent.setup();
      render(<TimerStyleManager />);
      
      const importButton = screen.getByText('导入设置');
      
      // Create a mock file
      const mockFile = new File(['{"test": "data"}'], 'settings.json', {
        type: 'application/json',
      });
      
      // Mock FileReader
      const mockFileReader = {
        readAsText: jest.fn(),
        result: '{"test": "data"}',
        onload: null as any,
      };
      
      jest.spyOn(window, 'FileReader').mockImplementation(() => mockFileReader as any);
      
      await user.click(importButton);
      
      // Find the hidden file input
      const fileInput = screen.getByTestId('file-input');
      await user.upload(fileInput, mockFile);
      
      // Simulate FileReader onload
      mockFileReader.onload?.({ target: mockFileReader } as any);
      
      expect(mockTimerStyleService.importSettings).toHaveBeenCalledWith('{"test": "data"}');
    });
  });

  describe('Notifications', () => {
    it('shows success notification when style is saved', async () => {
      const user = userEvent.setup();
      render(<TimerStyleManager />);
      
      // Start editing and save
      const editButton = screen.getByLabelText('编辑样式');
      await user.click(editButton);
      
      const saveButton = screen.getByText('保存');
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('样式保存成功')).toBeInTheDocument();
      });
    });

    it('shows error notification when save fails', async () => {
      mockTimerStyleService.updateCustomStyle.mockReturnValue(false);
      
      const user = userEvent.setup();
      render(<TimerStyleManager />);
      
      // Start editing and save
      const editButton = screen.getByLabelText('编辑样式');
      await user.click(editButton);
      
      const saveButton = screen.getByText('保存');
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('保存失败，请重试')).toBeInTheDocument();
      });
    });

    it('auto-hides notifications after timeout', async () => {
      jest.useFakeTimers();
      
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<TimerStyleManager />);
      
      // Trigger a notification
      const editButton = screen.getByLabelText('编辑样式');
      await user.click(editButton);
      
      const saveButton = screen.getByText('保存');
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('样式保存成功')).toBeInTheDocument();
      });
      
      // Fast-forward time
      jest.advanceTimersByTime(3000);
      
      await waitFor(() => {
        expect(screen.queryByText('样式保存成功')).not.toBeInTheDocument();
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

    it('handles invalid import data', async () => {
      mockTimerStyleService.importSettings.mockReturnValue(false);
      
      const user = userEvent.setup();
      render(<TimerStyleManager />);
      
      const importButton = screen.getByText('导入设置');
      await user.click(importButton);
      
      const mockFile = new File(['invalid json'], 'settings.json', {
        type: 'application/json',
      });
      
      const mockFileReader = {
        readAsText: jest.fn(),
        result: 'invalid json',
        onload: null as any,
      };
      
      jest.spyOn(window, 'FileReader').mockImplementation(() => mockFileReader as any);
      
      const fileInput = screen.getByTestId('file-input');
      await user.upload(fileInput, mockFile);
      
      mockFileReader.onload?.({ target: mockFileReader } as any);
      
      await waitFor(() => {
        expect(screen.getByText('导入失败，请检查文件格式')).toBeInTheDocument();
      });
    });
  });

  describe('Event Listeners', () => {
    it('adds and removes event listeners correctly', () => {
      const { unmount } = render(<TimerStyleManager />);
      
      expect(mockTimerStyleService.addListener).toHaveBeenCalled();
      
      unmount();
      
      expect(mockTimerStyleService.removeListener).toHaveBeenCalled();
    });

    it('updates state when service settings change', () => {
      render(<TimerStyleManager />);
      
      const listener = mockTimerStyleService.addListener.mock.calls[0][0];
      
      const newSettings = {
        ...mockSettings,
        currentStyleId: 'new-style',
      };
      
      const newStyle = {
        ...mockDefaultStyle,
        id: 'new-style',
        name: '新样式',
      };
      
      mockTimerStyleService.getCurrentStyle.mockReturnValue(newStyle);
      
      listener(newSettings);
      
      expect(screen.getByText('新样式')).toBeInTheDocument();
    });
  });
});
