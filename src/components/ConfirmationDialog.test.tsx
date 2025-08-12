import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ConfirmationDialog from './ConfirmationDialog';
import { useConfirmation } from '../../hooks/useConfirmation';

// Mock hooks
vi.mock('../../hooks/useConfirmation');

describe('ConfirmationDialog Component', () => {
  const mockConfirmOptions = {
    title: '确认操作',
    message: '确定要执行此操作吗？',
    confirmText: '确认',
    cancelText: '取消',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    // Mock confirmation hook
    (useConfirmation as jest.Mock).mockReturnValue({
      isOpen: true,
      options: mockConfirmOptions,
      close: vi.fn(),
    });
  });

  test('renders confirmation dialog with provided options', () => {
    render(<ConfirmationDialog />);

    // Verify dialog content
    expect(screen.getByText('确认操作')).toBeInTheDocument();
    expect(screen.getByText('确定要执行此操作吗？')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '确认' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument();
  });

  test('calls onConfirm when confirm button is clicked', () => {
    const mockOnConfirm = vi.fn();
    (useConfirmation as jest.Mock).mockReturnValue({
      isOpen: true,
      options: {
        ...mockConfirmOptions,
        onConfirm: mockOnConfirm,
      },
      close: vi.fn(),
    });

    render(<ConfirmationDialog />);

    // Click confirm button
    fireEvent.click(screen.getByRole('button', { name: '确认' }));

    expect(mockOnConfirm).toHaveBeenCalled();
  });

  test('calls onCancel when cancel button is clicked', () => {
    const mockOnCancel = vi.fn();
    (useConfirmation as jest.Mock).mockReturnValue({
      isOpen: true,
      options: {
        ...mockConfirmOptions,
        onCancel: mockOnCancel,
      },
      close: vi.fn(),
    });

    render(<ConfirmationDialog />);

    // Click cancel button
    fireEvent.click(screen.getByRole('button', { name: '取消' }));

    expect(mockOnCancel).toHaveBeenCalled();
  });

  test('does not render when isOpen is false', () => {
    (useConfirmation as jest.Mock).mockReturnValue({
      isOpen: false,
      options: mockConfirmOptions,
      close: vi.fn(),
    });

    render(<ConfirmationDialog />);

    expect(screen.queryByText('确认操作')).not.toBeInTheDocument();
  });

  test('uses custom button text when provided', () => {
    (useConfirmation as jest.Mock).mockReturnValue({
      isOpen: true,
      options: {
        ...mockConfirmOptions,
        confirmText: '删除',
        cancelText: '保留',
      },
      close: vi.fn(),
    });

    render(<ConfirmationDialog />);

    expect(screen.getByRole('button', { name: '删除' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '保留' })).toBeInTheDocument();
  });

  test('closes dialog when clicking outside the content area', () => {
    const mockClose = vi.fn();
    (useConfirmation as jest.Mock).mockReturnValue({
      isOpen: true,
      options: mockConfirmOptions,
      close: mockClose,
    });

    render(<ConfirmationDialog />);

    // Click on backdrop (outside dialog content)
    fireEvent.click(screen.getByTestId('dialog-backdrop'));

    expect(mockClose).toHaveBeenCalled();
  });

  test('prevents dialog closure when clicking inside content area', () => {
    const mockClose = vi.fn();
    (useConfirmation as jest.Mock).mockReturnValue({
      isOpen: true,
      options: mockConfirmOptions,
      close: mockClose,
    });

    render(<ConfirmationDialog />);

    // Click inside dialog content
    fireEvent.click(screen.getByText('确定要执行此操作吗？'));

    expect(mockClose).not.toHaveBeenCalled();
  });
})