/**
 * 通用确认对话框组件
 * 
 * 提供统一的确认对话框UI和交互逻辑
 */

import React from 'react';
import { AlertTriangle, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './Button';

export interface ConfirmDialogProps {
  /** 是否显示对话框 */
  visible: boolean;
  /** 对话框标题 */
  title?: string;
  /** 对话框消息内容 */
  message: string;
  /** 对话框类型，影响图标和颜色 */
  type?: 'warning' | 'danger' | 'info' | 'success';
  /** 确认按钮文本 */
  confirmText?: string;
  /** 取消按钮文本 */
  cancelText?: string;
  /** 确认按钮是否为危险操作样式 */
  confirmDanger?: boolean;
  /** 是否显示图标 */
  showIcon?: boolean;
  /** 确认回调 */
  onConfirm: () => void;
  /** 取消回调 */
  onCancel: () => void;
  /** 对话框关闭回调（点击遮罩或ESC键） */
  onClose?: () => void;
}

const DIALOG_CONFIG = {
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-orange-500',
    title: '警告'
  },
  danger: {
    icon: AlertCircle,
    iconColor: 'text-red-500',
    title: '危险操作'
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-500',
    title: '确认操作'
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-500',
    title: '操作确认'
  }
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  type = 'info',
  confirmText = '确认',
  cancelText = '取消',
  confirmDanger = false,
  showIcon = true,
  onConfirm,
  onCancel,
  onClose
}) => {
  const config = DIALOG_CONFIG[type];
  const IconComponent = config.icon;
  const dialogTitle = title || config.title;

  // 处理ESC键关闭
  React.useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose ? onClose() : onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose, onCancel]);

  // 处理遮罩点击
  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // 确保点击的是遮罩层本身，而不是子元素
    if (event.target === event.currentTarget) {
      event.preventDefault();
      event.stopPropagation();
      onClose ? onClose() : onCancel();
    }
  };

  if (!visible) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 transform transition-all duration-200 scale-100"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {/* 标题区域 */}
        <div className="flex items-center space-x-3 mb-4">
          {showIcon && (
            <IconComponent 
              className={`h-6 w-6 ${config.iconColor} flex-shrink-0`}
              aria-hidden="true"
            />
          )}
          <h3 
            id="confirm-dialog-title"
            className="text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            {dialogTitle}
          </h3>
        </div>

        {/* 消息内容 */}
        <div 
          id="confirm-dialog-message"
          className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed"
        >
          {message}
        </div>

        {/* 按钮区域 */}
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="px-4 py-2"
            autoFocus={!confirmDanger} // 安全操作时默认聚焦取消按钮
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className={`px-4 py-2 ${
              confirmDanger || type === 'danger'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            autoFocus={confirmDanger} // 危险操作时聚焦确认按钮
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

// Hook for easier usage
export const useConfirmDialog = () => {
  const [dialogState, setDialogState] = React.useState<{
    visible: boolean;
    title?: string;
    message: string;
    type?: ConfirmDialogProps['type'];
    confirmText?: string;
    cancelText?: string;
    confirmDanger?: boolean;
    showIcon?: boolean;
    onConfirm: () => void;
  }>({
    visible: false,
    message: '',
    onConfirm: () => {}
  });

  const showConfirmDialog = React.useCallback((
    message: string,
    onConfirm: () => void,
    options?: Partial<Pick<ConfirmDialogProps, 'title' | 'type' | 'confirmText' | 'cancelText' | 'confirmDanger' | 'showIcon'>>
  ) => {
    setDialogState({
      visible: true,
      message,
      onConfirm,
      ...options
    });
  }, []);

  const hideConfirmDialog = React.useCallback(() => {
    setDialogState(prev => ({ ...prev, visible: false }));
  }, []);

  const handleConfirm = React.useCallback(() => {
    dialogState.onConfirm();
    hideConfirmDialog();
  }, [dialogState.onConfirm, hideConfirmDialog]);

  const ConfirmDialogComponent = React.useCallback(() => (
    <ConfirmDialog
      visible={dialogState.visible}
      title={dialogState.title}
      message={dialogState.message}
      type={dialogState.type}
      confirmText={dialogState.confirmText}
      cancelText={dialogState.cancelText}
      confirmDanger={dialogState.confirmDanger}
      showIcon={dialogState.showIcon}
      onConfirm={handleConfirm}
      onCancel={hideConfirmDialog}
      onClose={hideConfirmDialog}
    />
  ), [dialogState, handleConfirm, hideConfirmDialog]);

  return {
    showConfirmDialog,
    hideConfirmDialog,
    ConfirmDialog: ConfirmDialogComponent
  };
};

// 预设的确认对话框类型
export const confirmDialogPresets = {
  delete: (itemName: string, onConfirm: () => void) => ({
    message: `确定要删除 "${itemName}" 吗？此操作无法撤销。`,
    type: 'danger' as const,
    confirmText: '删除',
    confirmDanger: true,
    onConfirm
  }),

  reset: (onConfirm: () => void) => ({
    message: '确定要重置所有更改吗？未保存的修改将会丢失。',
    type: 'warning' as const,
    confirmText: '重置',
    confirmDanger: true,
    onConfirm
  }),

  leave: (onConfirm: () => void) => ({
    message: '您有未保存的更改。确定要离开吗？',
    type: 'warning' as const,
    confirmText: '离开',
    confirmDanger: true,
    onConfirm
  }),

  overwrite: (itemName: string, onConfirm: () => void) => ({
    message: `"${itemName}" 已存在。确定要覆盖吗？`,
    type: 'warning' as const,
    confirmText: '覆盖',
    onConfirm
  }),

  clear: (onConfirm: () => void) => ({
    message: '确定要清空所有数据吗？此操作无法撤销。',
    type: 'danger' as const,
    confirmText: '清空',
    confirmDanger: true,
    onConfirm
  })
};
