/**
 * 优化的确认对话框组件
 * 提供多种确认类型和样式
 */

import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './OptimizedDialog';
import { OptimizedButton } from './OptimizedButton';
import { cn } from '../../../utils/cn';

export interface ConfirmDialogOptions {
  /**
   * 对话框类型
   */
  type?: 'default' | 'warning' | 'danger' | 'info' | 'success';
  /**
   * 确认按钮文本
   */
  confirmText?: string;
  /**
   * 取消按钮文本
   */
  cancelText?: string;
  /**
   * 确认按钮是否危险操作
   */
  confirmDanger?: boolean;
  /**
   * 是否显示图标
   */
  showIcon?: boolean;
  /**
   * 是否显示取消按钮
   */
  showCancel?: boolean;
}

export interface UseConfirmDialogReturn {
  /**
   * 显示确认对话框
   */
  showConfirmDialog: (
    message: string,
    onConfirm: () => void,
    options?: ConfirmDialogOptions
  ) => void;
  /**
   * 确认对话框组件
   */
  ConfirmDialog: React.ReactNode;
}

/**
 * 确认对话框Hook
 */
export function useConfirmDialog(): UseConfirmDialogReturn {
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    message: string;
    onConfirm?: () => void;
    options?: ConfirmDialogOptions;
  }>({
    open: false,
    message: '',
  });

  const showConfirmDialog = useCallback((
    message: string,
    onConfirm: () => void,
    options: ConfirmDialogOptions = {}
  ) => {
    setDialogState({
      open: true,
      message,
      onConfirm,
      options: {
        type: 'default',
        confirmText: '确认',
        cancelText: '取消',
        confirmDanger: false,
        showIcon: true,
        showCancel: true,
        ...options
      }
    });
  }, []);

  const handleConfirm = useCallback(() => {
    dialogState.onConfirm?.();
    setDialogState(prev => ({ ...prev, open: false }));
  }, [dialogState.onConfirm]);

  const handleCancel = useCallback(() => {
    setDialogState(prev => ({ ...prev, open: false }));
  }, []);

  const ConfirmDialog = dialogState.open ? (
    <Dialog open={dialogState.open} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {dialogState.options?.showIcon && (
              <div className={cn(
                'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center',
                dialogState.options?.type === 'warning' && 'bg-yellow-100 text-yellow-600',
                dialogState.options?.type === 'danger' && 'bg-red-100 text-red-600',
                dialogState.options?.type === 'info' && 'bg-blue-100 text-blue-600',
                dialogState.options?.type === 'success' && 'bg-green-100 text-green-600',
                dialogState.options?.type === 'default' && 'bg-gray-100 text-gray-600'
              )}>
                {dialogState.options?.type === 'warning' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                {dialogState.options?.type === 'danger' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                {dialogState.options?.type === 'info' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
                {dialogState.options?.type === 'success' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {dialogState.options?.type === 'default' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            )}
            {dialogState.options?.type === 'warning' && '警告'}
            {dialogState.options?.type === 'danger' && '危险操作'}
            {dialogState.options?.type === 'info' && '提示'}
            {dialogState.options?.type === 'success' && '成功'}
            {dialogState.options?.type === 'default' && '确认'}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="text-sm text-muted-foreground whitespace-pre-line">
            {dialogState.message}
          </div>
        </div>
        <div className="flex justify-end space-x-2 pt-4 border-t">
          {dialogState.options?.showCancel !== false && (
            <OptimizedButton
              variant="outline"
              onClick={handleCancel}
            >
              {dialogState.options?.cancelText || '取消'}
            </OptimizedButton>
          )}
          <OptimizedButton
            variant={dialogState.options?.confirmDanger ? 'destructive' : 'default'}
            onClick={handleConfirm}
          >
            {dialogState.options?.confirmText || '确认'}
          </OptimizedButton>
        </div>
      </DialogContent>
    </Dialog>
  ) : null;

  return {
    showConfirmDialog,
    ConfirmDialog
  };
}
