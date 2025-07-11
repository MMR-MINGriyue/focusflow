/**
 * TimerStyleManager 组件简化测试
 * 专注于基本功能测试，避免复杂的DOM操作
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
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

import TimerStyleManager from '../TimerStyleManager';

describe('TimerStyleManager Simple Tests', () => {
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
    mockTimerStyleService.getAllStyles.mockReturnValue([mockDefaultStyle]);
    mockTimerStyleService.getCustomStyles.mockReturnValue([]);
    mockTimerStyleService.setCurrentStyle.mockReturnValue(true);
    mockTimerStyleService.addCustomStyle.mockReturnValue(true);
    mockTimerStyleService.updateCustomStyle.mockReturnValue(true);
    mockTimerStyleService.removeCustomStyle.mockReturnValue(true);
    mockTimerStyleService.exportSettings.mockReturnValue(JSON.stringify(mockSettings));
    mockTimerStyleService.importSettings.mockReturnValue(true);
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<TimerStyleManager />);
      expect(screen.getByText('计时器样式管理')).toBeInTheDocument();
    });

    it('displays current style information', () => {
      render(<TimerStyleManager />);
      
      expect(screen.getByText('现代数字')).toBeInTheDocument();
      expect(screen.getByText('现代数字风格计时器')).toBeInTheDocument();
    });

    it('shows import/export buttons', () => {
      render(<TimerStyleManager />);
      
      expect(screen.getByText('导入样式')).toBeInTheDocument();
    });
  });

  describe('Service Integration', () => {
    it('calls service methods on initialization', () => {
      render(<TimerStyleManager />);
      
      expect(mockTimerStyleService.getSettings).toHaveBeenCalled();
      expect(mockTimerStyleService.getCurrentStyle).toHaveBeenCalled();
      expect(mockTimerStyleService.getPreviewStyle).toHaveBeenCalled();
      expect(mockTimerStyleService.getCustomStyles).toHaveBeenCalled();
    });

    it('adds event listener on mount', () => {
      render(<TimerStyleManager />);
      
      expect(mockTimerStyleService.addListener).toHaveBeenCalled();
    });

    it('removes event listener on unmount', () => {
      const { unmount } = render(<TimerStyleManager />);
      
      unmount();
      
      expect(mockTimerStyleService.removeListener).toHaveBeenCalled();
    });
  });

  describe('Custom Styles Display', () => {
    it('shows custom styles count when no custom styles exist', () => {
      render(<TimerStyleManager />);
      
      expect(screen.getByText('自定义样式 (0)')).toBeInTheDocument();
    });

    it('displays custom styles when they exist', () => {
      const customStyle = {
        ...mockDefaultStyle,
        id: 'custom-1',
        name: '自定义样式',
        description: '用户自定义样式',
      };
      
      mockTimerStyleService.getCustomStyles.mockReturnValue([customStyle]);
      
      render(<TimerStyleManager />);
      
      expect(screen.getByText('自定义样式 (1)')).toBeInTheDocument();
      expect(screen.getByText('自定义样式')).toBeInTheDocument();
    });
  });

  describe('Preview Mode', () => {
    it('shows preview indicator when preview is active', () => {
      mockTimerStyleService.getPreviewStyle.mockReturnValue(mockDefaultStyle);
      
      render(<TimerStyleManager />);
      
      expect(screen.getByText('预览中')).toBeInTheDocument();
    });

    it('does not show preview indicator when preview is inactive', () => {
      mockTimerStyleService.getPreviewStyle.mockReturnValue(null);
      
      render(<TimerStyleManager />);
      
      expect(screen.queryByText('预览中')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles service errors gracefully', () => {
      mockTimerStyleService.getCurrentStyle.mockImplementation(() => {
        throw new Error('Service error');
      });
      
      // Should not crash when service throws error
      expect(() => render(<TimerStyleManager />)).not.toThrow();
    });

    it('handles missing style data gracefully', () => {
      mockTimerStyleService.getCurrentStyle.mockReturnValue(null);
      
      expect(() => render(<TimerStyleManager />)).not.toThrow();
    });
  });

  describe('Props Handling', () => {
    it('calls onStyleChange callback when provided', () => {
      const mockOnStyleChange = jest.fn();
      
      render(<TimerStyleManager onStyleChange={mockOnStyleChange} />);
      
      // Simulate style change through service listener
      const listener = mockTimerStyleService.addListener.mock.calls[0][0];
      listener(mockSettings);
      
      expect(mockOnStyleChange).toHaveBeenCalledWith(mockDefaultStyle);
    });

    it('works without onStyleChange callback', () => {
      expect(() => render(<TimerStyleManager />)).not.toThrow();
    });
  });

  describe('State Management', () => {
    it('updates state when service settings change', () => {
      render(<TimerStyleManager />);
      
      const listener = mockTimerStyleService.addListener.mock.calls[0][0];
      
      const newStyle = {
        ...mockDefaultStyle,
        id: 'new-style',
        name: '新样式',
      };
      
      mockTimerStyleService.getCurrentStyle.mockReturnValue(newStyle);
      
      listener({
        ...mockSettings,
        currentStyleId: 'new-style',
      });
      
      expect(screen.getByText('新样式')).toBeInTheDocument();
    });
  });

  describe('Style Editing', () => {
    it('starts editing when edit button is clicked', async () => {
      const customStyle = {
        ...mockDefaultStyle,
        id: 'custom-1',
        name: '自定义样式',
        description: '用户自定义样式',
      };

      mockTimerStyleService.getCustomStyles.mockReturnValue([customStyle]);

      const user = userEvent.setup();
      render(<TimerStyleManager />);

      // Find edit button by text content
      const editButton = screen.getByText('编辑');
      await user.click(editButton);

      // Should show editing form
      expect(screen.getByDisplayValue('自定义样式')).toBeInTheDocument();
      expect(screen.getByDisplayValue('用户自定义样式')).toBeInTheDocument();
    });

    it('saves edited style when save button is clicked', async () => {
      const customStyle = {
        ...mockDefaultStyle,
        id: 'custom-1',
        name: '自定义样式',
        description: '用户自定义样式',
      };

      mockTimerStyleService.getCustomStyles.mockReturnValue([customStyle]);

      const user = userEvent.setup();
      render(<TimerStyleManager />);

      // Start editing
      const editButton = screen.getByText('编辑');
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
      const customStyle = {
        ...mockDefaultStyle,
        id: 'custom-1',
        name: '自定义样式',
        description: '用户自定义样式',
      };

      mockTimerStyleService.getCustomStyles.mockReturnValue([customStyle]);

      const user = userEvent.setup();
      render(<TimerStyleManager />);

      // Start editing
      const editButton = screen.getByText('编辑');
      await user.click(editButton);

      // Cancel
      const cancelButton = screen.getByText('取消');
      await user.click(cancelButton);

      // Should exit editing mode
      expect(screen.queryByDisplayValue('自定义样式')).not.toBeInTheDocument();
    });
  });

  describe('Style Management Actions', () => {
    it('duplicates style when duplicate button is clicked', async () => {
      const customStyle = {
        ...mockDefaultStyle,
        id: 'custom-1',
        name: '自定义样式',
        description: '用户自定义样式',
      };

      mockTimerStyleService.getCustomStyles.mockReturnValue([customStyle]);

      const user = userEvent.setup();
      render(<TimerStyleManager />);

      const duplicateButton = screen.getByText('复制');
      await user.click(duplicateButton);

      expect(mockTimerStyleService.addCustomStyle).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '自定义样式 (副本)',
        })
      );
    });

    it('shows delete confirmation when delete button is clicked', async () => {
      const customStyle = {
        ...mockDefaultStyle,
        id: 'custom-1',
        name: '自定义样式',
        description: '用户自定义样式',
      };

      mockTimerStyleService.getCustomStyles.mockReturnValue([customStyle]);

      const user = userEvent.setup();
      render(<TimerStyleManager />);

      const deleteButton = screen.getByText('删除');
      await user.click(deleteButton);

      // Should show confirmation dialog
      expect(screen.getByText('确认删除样式')).toBeInTheDocument();
      expect(screen.getByText('确定要删除样式"自定义样式"吗？此操作无法撤销。')).toBeInTheDocument();
    });
  });

  describe('Import/Export Functionality', () => {
    it('handles export correctly', async () => {
      // Mock URL.createObjectURL and document.createElement
      const mockCreateObjectURL = jest.fn(() => 'blob:mock-url');
      const mockClick = jest.fn();
      const mockAppendChild = jest.fn();
      const mockRemoveChild = jest.fn();

      Object.defineProperty(URL, 'createObjectURL', {
        value: mockCreateObjectURL,
        configurable: true,
      });

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

      const exportButton = screen.getByText('导出样式');
      await user.click(exportButton);

      expect(mockTimerStyleService.exportSettings).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('Notifications', () => {
    it('shows success notification when style is saved', async () => {
      const customStyle = {
        ...mockDefaultStyle,
        id: 'custom-1',
        name: '自定义样式',
        description: '用户自定义样式',
      };

      mockTimerStyleService.getCustomStyles.mockReturnValue([customStyle]);

      const user = userEvent.setup();
      render(<TimerStyleManager />);

      // Start editing and save
      const editButton = screen.getByText('编辑');
      await user.click(editButton);

      const saveButton = screen.getByText('保存');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('样式保存成功')).toBeInTheDocument();
      });
    });

    it('shows error notification when save fails', async () => {
      mockTimerStyleService.updateCustomStyle.mockReturnValue(false);

      const customStyle = {
        ...mockDefaultStyle,
        id: 'custom-1',
        name: '自定义样式',
        description: '用户自定义样式',
      };

      mockTimerStyleService.getCustomStyles.mockReturnValue([customStyle]);

      const user = userEvent.setup();
      render(<TimerStyleManager />);

      // Start editing and save
      const editButton = screen.getByText('编辑');
      await user.click(editButton);

      const saveButton = screen.getByText('保存');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('保存失败，请重试')).toBeInTheDocument();
      });
    });
  });

  describe('Component Lifecycle', () => {
    it('handles multiple mount/unmount cycles', () => {
      const { unmount, rerender } = render(<TimerStyleManager />);

      unmount();
      rerender(<TimerStyleManager />);
      unmount();

      // Should not throw errors
      expect(mockTimerStyleService.addListener).toHaveBeenCalledTimes(2);
      expect(mockTimerStyleService.removeListener).toHaveBeenCalledTimes(2);
    });
  });
});
