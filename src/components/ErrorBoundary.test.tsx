import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';
import ErrorToast from './ErrorToast';

// 测试组件：会抛出错误
const ErrorThrowingComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>正常渲染</div>;
};

// 测试组件：异步抛出错误
const AsyncErrorThrowingComponent = () => {
  React.useEffect(() => {
    setTimeout(() => {
      throw new Error('Async test error');
    }, 0);
  }, []);
  return <div>加载中...</div>;
};

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    // 清除所有console.error以避免测试输出混乱
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('捕获同步错误并显示错误提示', () => {
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    // 验证错误提示是否显示
    expect(screen.getByText(/发生错误/i)).toBeInTheDocument();
    expect(screen.getByText(/Test error message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /重新加载/i })).toBeInTheDocument();
  });

  test('捕获异步错误并显示错误提示', async () => {
    render(
      <ErrorBoundary>
        <AsyncErrorThrowingComponent />
      </ErrorBoundary>
    );

    // 验证异步错误是否被捕获
    await waitFor(() => {
      expect(screen.getByText(/发生错误/i)).toBeInTheDocument();
      expect(screen.getByText(/Async test error/i)).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  test('点击重新加载按钮后重置错误状态', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    // 验证初始错误状态
    expect(screen.getByText(/发生错误/i)).toBeInTheDocument();

    // 点击重新加载按钮
    fireEvent.click(screen.getByRole('button', { name: /重新加载/i }));

    // 重新渲染不抛出错误的组件
    rerender(
      <ErrorBoundary>
        <ErrorThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    // 验证错误状态已重置
    expect(screen.getByText('正常渲染')).toBeInTheDocument();
    expect(screen.queryByText(/发生错误/i)).not.toBeInTheDocument();
  });

  test('错误发生时显示ErrorToast组件', () => {
    // Mock ErrorToast组件
    jest.mock('./ErrorToast', () => ({
      __esModule: true,
      default: jest.fn(() => <div>Mock ErrorToast</div>)
    }));

    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    // 验证ErrorToast被调用
    expect(ErrorToast).toHaveBeenCalledWith({
      message: 'Test error message',
      visible: true
    }, expect.anything());
  });

  test('边界内组件正常渲染时不显示错误状态', () => {
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    // 验证组件正常渲染
    expect(screen.getByText('正常渲染')).toBeInTheDocument();
    expect(screen.queryByText(/发生错误/i)).not.toBeInTheDocument();
  });
})