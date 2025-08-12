/**
 * ConfirmDialog 组件测试
 * 
 * 测试通用确认对话框组件的功能和交互
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog, { useConfirmDialog, confirmDialogPresets } from '../ConfirmDialog';

describe('ConfirmDialog Component', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    visible: true,
    message: 'Are you sure you want to proceed?',
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel
  };

  // ==================== 基础渲染测试 ====================
  describe('Basic Rendering', () => {
    it('renders when visible is true', () => {
      render(<ConfirmDialog {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
      expect(screen.getByText('确认')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
    });

    it('does not render when visible is false', () => {
      render(<ConfirmDialog {...defaultProps} visible={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders with custom title', () => {
      render(<ConfirmDialog {...defaultProps} title="Custom Title" />);
      
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('renders with custom button texts', () => {
      render(
        <ConfirmDialog 
          {...defaultProps} 
          confirmText="Yes" 
          cancelText="No" 
        />
      );
      
      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
    });
  });

  // ==================== 对话框类型测试 ====================
  describe('Dialog Types', () => {
    it('renders warning type with correct icon and styling', () => {
      render(<ConfirmDialog {...defaultProps} type="warning" />);
      
      expect(screen.getByText('警告')).toBeInTheDocument();
      // Check for warning icon (AlertTriangle)
      const icon = document.querySelector('.text-orange-500');
      expect(icon).toBeInTheDocument();
    });

    it('renders danger type with correct icon and styling', () => {
      render(<ConfirmDialog {...defaultProps} type="danger" />);
      
      expect(screen.getByText('危险操作')).toBeInTheDocument();
      // Check for danger icon (AlertCircle)
      const icon = document.querySelector('.text-red-500');
      expect(icon).toBeInTheDocument();
    });

    it('renders info type with correct icon and styling', () => {
      render(<ConfirmDialog {...defaultProps} type="info" />);
      
      expect(screen.getByText('确认操作')).toBeInTheDocument();
      // Check for info icon
      const icon = document.querySelector('.text-blue-500');
      expect(icon).toBeInTheDocument();
    });

    it('renders success type with correct icon and styling', () => {
      render(<ConfirmDialog {...defaultProps} type="success" />);

      expect(screen.getByText('操作确认')).toBeInTheDocument();
      // Check for success icon
      const icon = document.querySelector('.text-green-500');
      expect(icon).toBeInTheDocument();
    });

    it('hides icon when showIcon is false', () => {
      render(<ConfirmDialog {...defaultProps} showIcon={false} />);
      
      const icons = document.querySelectorAll('svg');
      // Should only have icons from buttons, not the dialog icon
      expect(icons.length).toBeLessThan(3);
    });
  });

  // ==================== 交互测试 ====================
  describe('User Interactions', () => {
    it('calls onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup();
      render(<ConfirmDialog {...defaultProps} />);
      
      const confirmButton = screen.getByText('确认');
      await user.click(confirmButton);
      
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<ConfirmDialog {...defaultProps} />);
      
      const cancelButton = screen.getByText('取消');
      await user.click(cancelButton);
      
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when overlay is clicked', async () => {
      render(<ConfirmDialog {...defaultProps} />);

      const overlay = screen.getByRole('dialog');
      fireEvent.click(overlay);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when overlay is clicked if onClose is provided', async () => {
      render(<ConfirmDialog {...defaultProps} onClose={mockOnClose} />);

      const overlay = screen.getByRole('dialog');
      fireEvent.click(overlay);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('does not close when dialog content is clicked', async () => {
      render(<ConfirmDialog {...defaultProps} />);

      // Click on the dialog content (the inner div)
      const dialogContent = screen.getByRole('dialog').firstElementChild as HTMLElement;
      fireEvent.click(dialogContent);

      expect(mockOnCancel).not.toHaveBeenCalled();
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });
  });

  // ==================== 键盘交互测试 ====================
  describe('Keyboard Interactions', () => {
    it('calls onCancel when Escape key is pressed', () => {
      render(<ConfirmDialog {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed if onClose is provided', () => {
      render(<ConfirmDialog {...defaultProps} onClose={mockOnClose} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('does not respond to other keys', () => {
      render(<ConfirmDialog {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Space' });
      
      expect(mockOnCancel).not.toHaveBeenCalled();
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });
  });

  // ==================== 危险操作样式测试 ====================
  describe('Danger Styling', () => {
    it('applies danger styling when confirmDanger is true', () => {
      render(<ConfirmDialog {...defaultProps} confirmDanger={true} />);
      
      const confirmButton = screen.getByText('确认');
      expect(confirmButton).toHaveClass('bg-red-600');
    });

    it('applies danger styling for danger type', () => {
      render(<ConfirmDialog {...defaultProps} type="danger" />);
      
      const confirmButton = screen.getByText('确认');
      expect(confirmButton).toHaveClass('bg-red-600');
    });

    it('applies normal styling for non-danger operations', () => {
      render(<ConfirmDialog {...defaultProps} type="info" />);
      
      const confirmButton = screen.getByText('确认');
      expect(confirmButton).toHaveClass('bg-blue-600');
    });
  });

  // ==================== 无障碍访问测试 ====================
  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<ConfirmDialog {...defaultProps} title="Test Title" />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'confirm-dialog-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'confirm-dialog-message');
    });

    it('has proper heading structure', () => {
      render(<ConfirmDialog {...defaultProps} title="Test Title" />);
      
      const title = screen.getByText('Test Title');
      expect(title).toHaveAttribute('id', 'confirm-dialog-title');
    });

    it('has proper message identification', () => {
      render(<ConfirmDialog {...defaultProps} />);
      
      const message = screen.getByText('Are you sure you want to proceed?');
      expect(message).toHaveAttribute('id', 'confirm-dialog-message');
    });
  });
});

// ==================== useConfirmDialog Hook 测试 ====================
describe('useConfirmDialog Hook', () => {
  const TestComponent: React.FC = () => {
    const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();

    return (
      <div>
        <button 
          onClick={() => showConfirmDialog('Test message', () => {}, { type: 'warning' })}
        >
          Show Dialog
        </button>
        <ConfirmDialog />
      </div>
    );
  };

  it('shows dialog when showConfirmDialog is called', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);
    
    const showButton = screen.getByText('Show Dialog');
    await user.click(showButton);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('hides dialog when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);
    
    // Show dialog
    const showButton = screen.getByText('Show Dialog');
    await user.click(showButton);
    
    // Cancel dialog
    const cancelButton = screen.getByText('取消');
    await user.click(cancelButton);
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});

// ==================== 预设对话框测试 ====================
describe('Dialog Presets', () => {
  it('creates delete preset with correct properties', () => {
    const mockOnConfirm = jest.fn();
    const preset = confirmDialogPresets.delete('Test Item', mockOnConfirm);
    
    expect(preset.message).toContain('Test Item');
    expect(preset.type).toBe('danger');
    expect(preset.confirmText).toBe('删除');
    expect(preset.confirmDanger).toBe(true);
    expect(preset.onConfirm).toBe(mockOnConfirm);
  });

  it('creates reset preset with correct properties', () => {
    const mockOnConfirm = jest.fn();
    const preset = confirmDialogPresets.reset(mockOnConfirm);
    
    expect(preset.message).toContain('重置');
    expect(preset.type).toBe('warning');
    expect(preset.confirmText).toBe('重置');
    expect(preset.confirmDanger).toBe(true);
  });

  it('creates leave preset with correct properties', () => {
    const mockOnConfirm = jest.fn();
    const preset = confirmDialogPresets.leave(mockOnConfirm);
    
    expect(preset.message).toContain('未保存');
    expect(preset.type).toBe('warning');
    expect(preset.confirmText).toBe('离开');
    expect(preset.confirmDanger).toBe(true);
  });

  it('creates overwrite preset with correct properties', () => {
    const mockOnConfirm = jest.fn();
    const preset = confirmDialogPresets.overwrite('Test File', mockOnConfirm);
    
    expect(preset.message).toContain('Test File');
    expect(preset.type).toBe('warning');
    expect(preset.confirmText).toBe('覆盖');
  });

  it('creates clear preset with correct properties', () => {
    const mockOnConfirm = jest.fn();
    const preset = confirmDialogPresets.clear(mockOnConfirm);
    
    expect(preset.message).toContain('清空');
    expect(preset.type).toBe('danger');
    expect(preset.confirmText).toBe('清空');
    expect(preset.confirmDanger).toBe(true);
  });
});
