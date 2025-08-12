
/**
 * 现代化按钮组件
 * 提供多种风格的按钮样式和交互效果
 */

import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

// 按钮变体类型
export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'gradient';

// 按钮大小类型
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// 按钮形状类型
export type ButtonShape = 'default' | 'rounded' | 'square' | 'pill';

interface ModernButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  ripple?: boolean;
  animated?: boolean;
  children?: React.ReactNode;
}

/**
 * 现代化按钮组件
 */
export const ModernButton = forwardRef<HTMLButtonElement, ModernButtonProps>(({
  variant = 'default',
  size = 'md',
  shape = 'default',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  ripple = true,
  animated = true,
  className,
  children,
  onClick,
  ...props
}, ref) => {
  // 获取变体样式
  const getVariantClasses = () => {
    switch (variant) {
      case 'destructive':
        return 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 dark:bg-red-600 dark:hover:bg-red-700';
      case 'outline':
        return 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-gray-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800';
      case 'secondary':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600';
      case 'ghost':
        return 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 dark:text-gray-300 dark:hover:bg-gray-800';
      case 'link':
        return 'bg-transparent text-blue-600 underline-offset-4 hover:underline focus:ring-blue-500 dark:text-blue-400';
      case 'gradient':
        return 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 focus:ring-blue-500';
      case 'default':
      default:
        return 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700';
    }
  };

  // 获取尺寸样式
  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'text-xs px-2 py-1 h-6';
      case 'sm':
        return 'text-sm px-3 py-1.5 h-8';
      case 'lg':
        return 'text-lg px-5 py-2.5 h-11';
      case 'xl':
        return 'text-xl px-6 py-3 h-12';
      case 'md':
      default:
        return 'text-sm px-4 py-2 h-9';
    }
  };

  // 获取形状样式
  const getShapeClasses = () => {
    switch (shape) {
      case 'rounded':
        return 'rounded-md';
      case 'square':
        return 'rounded-none';
      case 'pill':
        return 'rounded-full';
      case 'default':
      default:
        return 'rounded-md';
    }
  };

  // 获取禁用状态样式
  const getDisabledClasses = () => {
    if (disabled || loading) {
      return 'opacity-70 cursor-not-allowed pointer-events-none';
    }
    return '';
  };

  // 获取全宽样式
  const getFullWidthClasses = () => {
    return fullWidth ? 'w-full' : '';
  };

  // 获取焦点样式
  const getFocusClasses = () => {
    return 'focus:outline-none focus:ring-2 focus:ring-offset-2';
  };

  // 获取动画样式
  const getAnimationClasses = () => {
    if (!animated) return '';
    return 'transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95';
  };

  // 组合所有样式类
  const buttonClasses = cn(
    'relative inline-flex items-center justify-center font-medium',
    'select-none disabled:opacity-70 disabled:cursor-not-allowed',
    getVariantClasses(),
    getSizeClasses(),
    getShapeClasses(),
    getDisabledClasses(),
    getFullWidthClasses(),
    getFocusClasses(),
    getAnimationClasses(),
    className
  );

  // 处理点击事件和涟漪效果
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    // 创建涟漪效果
    if (ripple) {
      createRipple(e);
    }

    // 调用原始点击事件
    onClick?.(e);
  };

  // 创建涟漪效果
  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - button.offsetLeft - radius}px`;
    circle.style.top = `${e.clientY - button.offsetTop - radius}px`;
    circle.classList.add('ripple');

    const rippleElement = button.getElementsByClassName('ripple')[0];
    if (rippleElement) {
      rippleElement.remove();
    }

    button.appendChild(circle);
  };

  return (
    <button
      ref={ref}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {/* 加载状态 */}
      {loading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}

      {/* 左侧图标 */}
      {!loading && icon && iconPosition === 'left' && (
        <span className="mr-2">{icon}</span>
      )}

      {/* 按钮文本 */}
      <span>{children}</span>

      {/* 右侧图标 */}
      {!loading && icon && iconPosition === 'right' && (
        <span className="ml-2">{icon}</span>
      )}

      {/* 涟漪效果样式 */}
      <style jsx>{`
        .ripple {
          position: absolute;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.6);
          transform: scale(0);
          animation: ripple-animation 0.6s linear;
          pointer-events: none;
        }

        @keyframes ripple-animation {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `}</style>
    </button>
  );
});

ModernButton.displayName = 'ModernButton';

/**
 * 按钮组组件
 */
interface ModernButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  fullWidth?: boolean;
  vertical?: boolean;
  children: React.ReactNode;
}

export const ModernButtonGroup: React.FC<ModernButtonGroupProps> = ({
  variant = 'default',
  size = 'md',
  shape = 'default',
  fullWidth = false,
  vertical = false,
  className,
  children,
  ...props
}) => {
  const getGroupClasses = () => {
    return cn(
      'inline-flex',
      vertical ? 'flex-col' : 'flex-row',
      fullWidth && 'w-full'
    );
  };

  // 为每个按钮应用组样式
  const enhancedChildren = React.Children.map(children, (child, index) => {
    if (React.isValidElement(child)) {
      // 第一个按钮特殊样式
      const isFirst = index === 0;
      // 最后一个按钮特殊样式
      const isLast = index === React.Children.count(children) - 1;

      // 根据方向决定边框圆角
      let borderRadius = '';
      if (vertical) {
        if (isFirst) borderRadius = 'rounded-t-md rounded-b-none';
        else if (isLast) borderRadius = 'rounded-b-md rounded-t-none';
        else borderRadius = 'rounded-none';
      } else {
        if (isFirst) borderRadius = 'rounded-l-md rounded-r-none';
        else if (isLast) borderRadius = 'rounded-r-md rounded-l-none';
        else borderRadius = 'rounded-none';
      }

      // 添加边框样式
      const borderStyle = !isLast ? (vertical ? 'border-b-0' : 'border-r-0') : '';

      return React.cloneElement(child as React.ReactElement<any>, {
        variant,
        size,
        shape: 'square',
        className: cn(borderRadius, borderStyle, (child.props as any).className),
      });
    }
    return child;
  });

  return (
    <div className={cn(getGroupClasses(), className)} {...props}>
      {enhancedChildren}
    </div>
  );
};

ModernButtonGroup.displayName = 'ModernButtonGroup';

/**
 * 浮动操作按钮组件
 */
export const FloatingActionButton: React.FC<ModernButtonProps> = ({
  size = 'md',
  shape = 'pill',
  className,
  children,
  ...props
}) => {
  // FAB的特定尺寸
  const getFabSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'w-10 h-10';
      case 'sm':
        return 'w-12 h-12';
      case 'lg':
        return 'w-16 h-16';
      case 'xl':
        return 'w-20 h-20';
      case 'md':
      default:
        return 'w-14 h-14';
    }
  };

  return (
    <ModernButton
      variant="gradient"
      size="md"
      shape={shape}
      className={cn(
        'fixed bottom-6 right-6 shadow-lg z-40',
        getFabSizeClasses(),
        className
      )}
      {...props}
    >
      {children}
    </ModernButton>
  );
};

FloatingActionButton.displayName = 'FloatingActionButton';
