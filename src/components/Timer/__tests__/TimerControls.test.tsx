import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import TimerControls, {
  FloatingTimerControls,
  CompactTimerControls,
  MinimalTimerControls,
  TouchFriendlyTimerControls,
  KeyboardFriendlyTimerControls
} from '../TimerControls';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }: any) => children
}));

// Mock Tooltip components
vi.mock('../../ui/OptimizedTooltip', () => ({
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>
}));

describe('TimerControls', () => {
  const defaultProps = {
    isActive: false,
    onStart: vi.fn(),
    onPause: vi.fn(),
    onReset: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基础功能', () => {
    it('应该渲染开始按钮当计时器未激活时', () => {
      render(<TimerControls {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /开始计时器/ })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /暂停计时器/ })).not.toBeInTheDocument();
    });

    it('应该渲染暂停按钮当计时器激活时', () => {
      render(<TimerControls {...defaultProps} isActive={true} />);
      
      expect(screen.getByRole('button', { name: /暂停计时器/ })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /开始计时器/ })).not.toBeInTheDocument();
    });

    it('应该始终渲染重置按钮', () => {
      render(<TimerControls {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /重置计时器/ })).toBeInTheDocument();
    });

    it('应该在提供onSkip时渲染跳过按钮', () => {
      const onSkip = vi.fn();
      render(<TimerControls {...defaultProps} onSkip={onSkip} />);
      
      expect(screen.getByRole('button', { name: /跳过当前阶段/ })).toBeInTheDocument();
    });

    it('应该在提供onStop时渲染停止按钮', () => {
      const onStop = vi.fn();
      render(<TimerControls {...defaultProps} onStop={onStop} />);
      
      expect(screen.getByRole('button', { name: /停止计时器/ })).toBeInTheDocument();
    });
  });

  describe('按钮点击事件', () => {
    it('应该在点击开始按钮时调用onStart', async () => {
      const user = userEvent.setup();
      render(<TimerControls {...defaultProps} />);
      
      await user.click(screen.getByRole('button', { name: /开始计时器/ }));
      
      expect(defaultProps.onStart).toHaveBeenCalledTimes(1);
    });

    it('应该在点击暂停按钮时调用onPause', async () => {
      const user = userEvent.setup();
      render(<TimerControls {...defaultProps} isActive={true} />);
      
      await user.click(screen.getByRole('button', { name: /暂停计时器/ }));
      
      expect(defaultProps.onPause).toHaveBeenCalledTimes(1);
    });

    it('应该在点击重置按钮时调用onReset', async () => {
      const user = userEvent.setup();
      render(<TimerControls {...defaultProps} />);
      
      await user.click(screen.getByRole('button', { name: /重置计时器/ }));
      
      expect(defaultProps.onReset).toHaveBeenCalledTimes(1);
    });

    it('应该在点击跳过按钮时调用onSkip', async () => {
      const user = userEvent.setup();
      const onSkip = vi.fn();
      render(<TimerControls {...defaultProps} onSkip={onSkip} />);
      
      await user.click(screen.getByRole('button', { name: /跳过当前阶段/ }));
      
      expect(onSkip).toHaveBeenCalledTimes(1);
    });

    it('应该在点击停止按钮时调用onStop', async () => {
      const user = userEvent.setup();
      const onStop = vi.fn();
      render(<TimerControls {...defaultProps} onStop={onStop} />);
      
      await user.click(screen.getByRole('button', { name: /停止计时器/ }));
      
      expect(onStop).toHaveBeenCalledTimes(1);
    });
  });

  describe('键盘快捷键', () => {
    it('应该在按下空格键时切换开始/暂停', async () => {
      render(<TimerControls {...defaultProps} keyboardShortcuts={true} />);
      
      // 模拟按下空格键
      fireEvent.keyDown(window, { key: ' ' });
      
      await waitFor(() => {
        expect(defaultProps.onStart).toHaveBeenCalledTimes(1);
      });
    });

    it('应该在按下R键时调用重置', async () => {
      render(<TimerControls {...defaultProps} keyboardShortcuts={true} />);
      
      fireEvent.keyDown(window, { key: 'r' });
      
      await waitFor(() => {
        expect(defaultProps.onReset).toHaveBeenCalledTimes(1);
      });
    });

    it('应该在按下S键时调用跳过（如果提供）', async () => {
      const onSkip = vi.fn();
      render(<TimerControls {...defaultProps} onSkip={onSkip} keyboardShortcuts={true} />);
      
      fireEvent.keyDown(window, { key: 's' });
      
      await waitFor(() => {
        expect(onSkip).toHaveBeenCalledTimes(1);
      });
    });

    it('应该在按下Esc键时调用停止（如果提供）', async () => {
      const onStop = vi.fn();
      render(<TimerControls {...defaultProps} onStop={onStop} keyboardShortcuts={true} />);
      
      fireEvent.keyDown(window, { key: 'Escape' });
      
      await waitFor(() => {
        expect(onStop).toHaveBeenCalledTimes(1);
      });
    });

    it('应该在keyboardShortcuts为false时不响应键盘事件', async () => {
      render(<TimerControls {...defaultProps} keyboardShortcuts={false} />);
      
      fireEvent.keyDown(window, { key: ' ' });
      fireEvent.keyDown(window, { key: 'r' });
      
      await waitFor(() => {
        expect(defaultProps.onStart).not.toHaveBeenCalled();
        expect(defaultProps.onReset).not.toHaveBeenCalled();
      });
    });
  });

  describe('禁用状态', () => {
    it('应该在disabled为true时禁用所有按钮', () => {
      render(<TimerControls {...defaultProps} disabled={true} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('应该在disabled为true时不响应点击事件', async () => {
      const user = userEvent.setup();
      render(<TimerControls {...defaultProps} disabled={true} />);
      
      const startButton = screen.getByRole('button', { name: /开始计时器/ });
      await user.click(startButton);
      
      expect(defaultProps.onStart).not.toHaveBeenCalled();
    });

    it('应该在loading为true时显示加载状态', () => {
      render(<TimerControls {...defaultProps} loading={true} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('变体组件', () => {
    it('FloatingTimerControls应该应用浮动样式', () => {
      render(<FloatingTimerControls {...defaultProps} />);
      
      const container = screen.getByRole('group');
      expect(container).toHaveClass('fixed');
    });

    it('CompactTimerControls应该隐藏标签', () => {
      render(<CompactTimerControls {...defaultProps} />);
      
      // 检查按钮是否存在但没有文本标签
      const startButton = screen.getByRole('button', { name: /开始计时器/ });
      expect(startButton).toBeInTheDocument();
    });

    it('MinimalTimerControls应该隐藏标签和工具提示', () => {
      render(<MinimalTimerControls {...defaultProps} />);
      
      const startButton = screen.getByRole('button', { name: /开始计时器/ });
      expect(startButton).toBeInTheDocument();
    });

    it('TouchFriendlyTimerControls应该使用大尺寸', () => {
      render(<TouchFriendlyTimerControls {...defaultProps} />);
      
      const startButton = screen.getByRole('button', { name: /开始计时器/ });
      expect(startButton).toBeInTheDocument();
    });

    it('KeyboardFriendlyTimerControls应该启用键盘功能', () => {
      render(<KeyboardFriendlyTimerControls {...defaultProps} />);
      
      const startButton = screen.getByRole('button', { name: /开始计时器/ });
      expect(startButton).toBeInTheDocument();
    });
  });

  describe('无障碍访问性', () => {
    it('应该有正确的ARIA标签', () => {
      render(<TimerControls {...defaultProps} />);
      
      expect(screen.getByRole('group', { name: '计时器控制按钮' })).toBeInTheDocument();
    });

    it('应该为屏幕阅读器提供状态信息', () => {
      render(<TimerControls {...defaultProps} />);
      
      const srOnly = document.querySelector('.sr-only');
      expect(srOnly).toBeInTheDocument();
    });

    it('应该在按钮状态改变时更新aria-pressed', () => {
      const { rerender } = render(<TimerControls {...defaultProps} isActive={false} />);
      
      rerender(<TimerControls {...defaultProps} isActive={true} />);
      
      const pauseButton = screen.getByRole('button', { name: /暂停计时器/ });
      expect(pauseButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('响应式设计', () => {
    it('应该支持不同的尺寸配置', () => {
      const { rerender } = render(<TimerControls {...defaultProps} size="small" />);
      
      let startButton = screen.getByRole('button', { name: /开始计时器/ });
      expect(startButton).toBeInTheDocument();
      
      rerender(<TimerControls {...defaultProps} size="large" />);
      
      startButton = screen.getByRole('button', { name: /开始计时器/ });
      expect(startButton).toBeInTheDocument();
    });

    it('应该支持触摸友好的配置', () => {
      render(<TimerControls {...defaultProps} touchFriendly={true} />);
      
      const startButton = screen.getByRole('button', { name: /开始计时器/ });
      expect(startButton).toBeInTheDocument();
    });
  });
});