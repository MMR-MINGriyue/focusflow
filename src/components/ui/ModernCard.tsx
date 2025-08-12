
/**
 * 现代化卡片组件
 * 提供多种风格的卡片样式和交互效果
 */

import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

// 卡片变体类型
export type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled' | 'glass';

// 卡片大小类型
export type CardSize = 'sm' | 'md' | 'lg';

// 卡片边框半径类型
export type CardRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ModernCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  size?: CardSize;
  radius?: CardRadius;
  hoverable?: boolean;
  clickable?: boolean;
  selected?: boolean;
  loading?: boolean;
  disabled?: boolean;
  padding?: boolean | 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  shadow?: boolean;
  gradient?: boolean;
  children: React.ReactNode;
}

/**
 * 现代化卡片组件
 */
export const ModernCard = forwardRef<HTMLDivElement, ModernCardProps>(({
  variant = 'default',
  size = 'md',
  radius = 'lg',
  hoverable = false,
  clickable = false,
  selected = false,
  loading = false,
  disabled = false,
  padding = true,
  border = true,
  shadow = true,
  gradient = false,
  className,
  children,
  ...props
}, ref) => {
  // 获取变体样式
  const getVariantClasses = () => {
    switch (variant) {
      case 'elevated':
        return 'bg-white dark:bg-gray-800';
      case 'outlined':
        return 'bg-transparent border-gray-200 dark:border-gray-700';
      case 'filled':
        return 'bg-gray-100 dark:bg-gray-800';
      case 'glass':
        return 'glass-effect';
      case 'default':
      default:
        return 'bg-white dark:bg-gray-800';
    }
  };

  // 获取尺寸样式
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return '';
      case 'lg':
        return '';
      case 'md':
      default:
        return '';
    }
  };

  // 获取边框半径样式
  const getRadiusClasses = () => {
    switch (radius) {
      case 'none':
        return 'rounded-none';
      case 'sm':
        return 'rounded-sm';
      case 'md':
        return 'rounded-md';
      case 'lg':
        return 'rounded-lg';
      case 'xl':
        return 'rounded-xl';
      case 'full':
        return 'rounded-full';
      default:
        return 'rounded-lg';
    }
  };

  // 获取内边距样式
  const getPaddingClasses = () => {
    if (padding === false || padding === 'none') return '';
    if (padding === 'sm') return 'p-3';
    if (padding === 'lg') return 'p-6';
    return 'p-4';
  };

  // 获取边框样式
  const getBorderClasses = () => {
    if (!border) return '';
    if (variant === 'outlined') return 'border';
    return 'border border-gray-200 dark:border-gray-700';
  };

  // 获取阴影样式
  const getShadowClasses = () => {
    if (!shadow) return '';
    if (variant === 'elevated') return 'shadow-md';
    return '';
  };

  // 获取悬停效果样式
  const getHoverClasses = () => {
    if (disabled || loading) return '';
    if (hoverable) return 'transition-all duration-300 hover:shadow-lg hover:-translate-y-1';
    if (clickable) return 'transition-all duration-300 hover:shadow-md';
    return '';
  };

  // 获取选中状态样式
  const getSelectedClasses = () => {
    if (!selected) return '';
    return 'ring-2 ring-blue-500 dark:ring-blue-400';
  };

  // 获取禁用状态样式
  const getDisabledClasses = () => {
    if (!disabled) return '';
    return 'opacity-60 cursor-not-allowed';
  };

  // 获取渐变背景样式
  const getGradientClasses = () => {
    if (!gradient) return '';
    return 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20';
  };

  // 组合所有样式类
  const cardClasses = cn(
    'relative overflow-hidden',
    getVariantClasses(),
    getSizeClasses(),
    getRadiusClasses(),
    getPaddingClasses(),
    getBorderClasses(),
    getShadowClasses(),
    getHoverClasses(),
    getSelectedClasses(),
    getDisabledClasses(),
    getGradientClasses(),
    className
  );

  return (
    <div
      ref={ref}
      className={cardClasses}
      {...props}
    >
      {/* 加载状态遮罩 */}
      {loading && (
        <div className="absolute inset-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {children}
    </div>
  );
});

ModernCard.displayName = 'ModernCard';

/**
 * 卡片头部组件
 */
export interface ModernCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  divider?: boolean;
  padding?: boolean | 'none' | 'sm' | 'md' | 'lg';
}

export const ModernCardHeader = forwardRef<HTMLDivElement, ModernCardHeaderProps>(({
  divider = false,
  padding = true,
  className,
  children,
  ...props
}, ref) => {
  const getPaddingClasses = () => {
    if (padding === false || padding === 'none') return '';
    if (padding === 'sm') return 'p-3 pb-4';
    if (padding === 'lg') return 'p-6 pb-5';
    return 'p-4 pb-5';
  };

  const headerClasses = cn(
    getPaddingClasses(),
    divider && 'border-b border-gray-200 dark:border-gray-700',
    className
  );

  return (
    <div ref={ref} className={headerClasses} {...props}>
      {children}
    </div>
  );
});

ModernCardHeader.displayName = 'ModernCardHeader';

/**
 * 卡片内容组件
 */
export interface ModernCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: boolean | 'none' | 'sm' | 'md' | 'lg';
}

export const ModernCardContent = forwardRef<HTMLDivElement, ModernCardContentProps>(({
  padding = true,
  className,
  children,
  ...props
}, ref) => {
  const getPaddingClasses = () => {
    if (padding === false || padding === 'none') return '';
    if (padding === 'sm') return 'p-3';
    if (padding === 'lg') return 'p-6';
    return 'p-4';
  };

  const contentClasses = cn(getPaddingClasses(), className);

  return (
    <div ref={ref} className={contentClasses} {...props}>
      {children}
    </div>
  );
});

ModernCardContent.displayName = 'ModernCardContent';

/**
 * 卡片底部组件
 */
export interface ModernCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  divider?: boolean;
  padding?: boolean | 'none' | 'sm' | 'md' | 'lg';
}

export const ModernCardFooter = forwardRef<HTMLDivElement, ModernCardFooterProps>(({
  divider = false,
  padding = true,
  className,
  children,
  ...props
}, ref) => {
  const getPaddingClasses = () => {
    if (padding === false || padding === 'none') return '';
    if (padding === 'sm') return 'p-3 pt-4';
    if (padding === 'lg') return 'p-6 pt-5';
    return 'p-4 pt-5';
  };

  const footerClasses = cn(
    getPaddingClasses(),
    divider && 'border-t border-gray-200 dark:border-gray-700',
    className
  );

  return (
    <div ref={ref} className={footerClasses} {...props}>
      {children}
    </div>
  );
});

ModernCardFooter.displayName = 'ModernCardFooter';

/**
 * 卡片标题组件
 */
export const ModernCardTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>((
  { className, ...props },
  ref
) => {
  return (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  );
});

ModernCardTitle.displayName = 'ModernCardTitle';

/**
 * 卡片描述组件
 */
export const ModernCardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>((
  { className, ...props },
  ref
) => {
  return (
    <p
      ref={ref}
      className={cn('text-sm text-gray-600 dark:text-gray-400 mt-1', className)}
      {...props}
    />
  );
});

ModernCardDescription.displayName = 'ModernCardDescription';
