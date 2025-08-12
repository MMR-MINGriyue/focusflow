
/**
 * 现代化模态框组件
 * 提供多种风格的模态框样式和交互效果
 */

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import { X } from 'lucide-react';

// 模态框大小类型
export type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

// 模态框位置类型
export type ModalPosition = 'center' | 'top' | 'bottom' | 'left' | 'right';

interface ModernModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  size?: ModalSize;
  position?: ModalPosition;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  id?: string;
}

/**
 * 现代化模态框组件
 */
export const ModernModal: React.FC<ModernModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  position = 'center',
  closeOnOverlayClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  header,
  footer,
  className,
  overlayClassName,
  contentClassName,
  headerClassName,
  bodyClassName,
  footerClassName,
  id,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // 获取尺寸样式
  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'max-w-xs';
      case 'sm':
        return 'max-w-sm';
      case 'lg':
        return 'max-w-4xl';
      case 'xl':
        return 'max-w-6xl';
      case 'full':
        return 'max-w-full w-full h-full';
      case 'md':
      default:
        return 'max-w-2xl';
    }
  };

  // 获取位置样式
  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'items-start pt-10';
      case 'bottom':
        return 'items-end pb-10';
      case 'left':
        return 'justify-start pl-10';
      case 'right':
        return 'justify-end pr-10';
      case 'center':
      default:
        return 'items-center justify-center';
    }
  };

  // 处理ESC键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEsc && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // 保存当前活动元素
      previousActiveElement.current = document.activeElement as HTMLElement;
      // 禁止背景滚动
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // 恢复背景滚动
      document.body.style.overflow = '';
      // 恢复焦点
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, closeOnEsc, onClose]);

  // 处理点击覆盖层关闭
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  // 如果模态框未打开，则不渲染
  if (!isOpen) return null;

  // 使用Portal将模态框渲染到body
  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 flex',
        getPositionClasses(),
        overlayClassName
      )}
      onClick={handleOverlayClick}
      id={id}
    >
      {/* 覆盖层 */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />

      {/* 模态框内容 */}
      <div
        ref={modalRef}
        className={cn(
          'relative z-10 w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl transition-all transform',
          getSizeClasses(),
          size !== 'full' && 'my-8 mx-4',
          contentClassName
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? `${id}-title` : undefined}
      >
        {/* 头部 */}
        {(title || header || showCloseButton) && (
          <div
            className={cn(
              'flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700',
              headerClassName
            )}
          >
            {/* 标题 */}
            {title && (
              <h3
                id={`${id}-title`}
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                {title}
              </h3>
            )}

            {/* 自定义头部 */}
            {header && (
              <div className="flex-1">{header}</div>
            )}

            {/* 关闭按钮 */}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="ml-4 p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="关闭"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* 内容 */}
        <div className={cn('p-4', bodyClassName)}>
          {children}
        </div>

        {/* 底部 */}
        {footer && (
          <div
            className={cn(
              'flex items-center justify-end p-4 border-t border-gray-200 dark:border-gray-700 space-x-2',
              footerClassName
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

/**
 * 确认对话框组件
 */
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmButtonVariant?: 'default' | 'destructive' | 'outline';
  confirmButtonClassName?: string;
  className?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = '确认',
  message = '您确定要执行此操作吗？',
  confirmText = '确认',
  cancelText = '取消',
  confirmButtonVariant = 'default',
  confirmButtonClassName,
  className,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      className={className}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={cn(
              'px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2',
              confirmButtonVariant === 'destructive'
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : confirmButtonVariant === 'outline'
                ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
              confirmButtonClassName
            )}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <div className="text-gray-700 dark:text-gray-300">
        {message}
      </div>
    </ModernModal>
  );
};

/**
 * 信息对话框组件
 */
interface InfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: React.ReactNode;
  confirmText?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const InfoDialog: React.FC<InfoDialogProps> = ({
  isOpen,
  onClose,
  title = '提示',
  message,
  confirmText = '确定',
  icon,
  className,
}) => {
  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      className={className}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {confirmText}
        </button>
      }
    >
      <div className="flex flex-col items-center text-center py-4">
        {icon && <div className="mb-4">{icon}</div>}
        <div className="text-gray-700 dark:text-gray-300">
          {message}
        </div>
      </div>
    </ModernModal>
  );
};

/**
 * 抽屉组件
 */
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position?: 'left' | 'right' | 'top' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  id?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  children,
  position = 'right',
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  header,
  footer,
  className,
  overlayClassName,
  contentClassName,
  id,
}) => {
  // 获取尺寸样式
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return position === 'left' || position === 'right' ? 'w-64' : 'h-64';
      case 'lg':
        return position === 'left' || position === 'right' ? 'w-96' : 'h-96';
      case 'xl':
        return position === 'left' || position === 'right' ? 'w-1/3' : 'h-1/3';
      case 'md':
      default:
        return position === 'left' || position === 'right' ? 'w-80' : 'h-80';
    }
  };

  // 获取位置样式
  const getPositionClasses = () => {
    switch (position) {
      case 'left':
        return 'left-0 top-0 h-full';
      case 'right':
        return 'right-0 top-0 h-full';
      case 'top':
        return 'top-0 left-0 w-full';
      case 'bottom':
        return 'bottom-0 left-0 w-full';
      default:
        return 'right-0 top-0 h-full';
    }
  };

  // 获取动画类
  const getAnimationClasses = () => {
    switch (position) {
      case 'left':
        return isOpen ? 'translate-x-0' : '-translate-x-full';
      case 'right':
        return isOpen ? 'translate-x-0' : 'translate-x-full';
      case 'top':
        return isOpen ? 'translate-y-0' : '-translate-y-full';
      case 'bottom':
        return isOpen ? 'translate-y-0' : 'translate-y-full';
      default:
        return isOpen ? 'translate-x-0' : 'translate-x-full';
    }
  };

  // 如果抽屉未打开，则不渲染
  if (!isOpen) return null;

  // 使用Portal将抽屉渲染到body
  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 flex',
        overlayClassName
      )}
      id={id}
    >
      {/* 覆盖层 */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />

      {/* 抽屉内容 */}
      <div
        className={cn(
          'fixed bg-white dark:bg-gray-800 shadow-xl transition-transform duration-300 ease-in-out',
          getSizeClasses(),
          getPositionClasses(),
          getAnimationClasses(),
          contentClassName,
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* 头部 */}
        {(header || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            {header}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="关闭"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* 内容 */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          {children}
        </div>

        {/* 底部 */}
        {footer && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
