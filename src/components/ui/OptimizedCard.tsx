/**
 * 优化的卡片组件
 * 提供多种样式和布局，支持悬停效果和加载状态
 */

import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { BaseComponent, BaseComponentProps } from './base/BaseComponent';

/**
 * 卡片变体
 */
const cardVariants = cva(
  'rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'border-border',
        elevated: 'border-border shadow-md hover:shadow-lg',
        outlined: 'border-2 border-border',
        filled: 'border-0 bg-accent/50',
        flat: 'border-0 shadow-none',
      },
      size: {
        default: 'p-6',
        sm: 'p-4',
        lg: 'p-8',
      },
      interactive: {
        true: 'cursor-pointer hover:bg-accent/50 active:scale-[0.98]',
        false: '',
      },
      loading: {
        true: 'animate-pulse',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      interactive: false,
      loading: false,
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants>,
    BaseComponentProps {
  /**
   * 卡片标题
   */
  title?: React.ReactNode;
  /**
   * 卡片副标题
   */
  subtitle?: React.ReactNode;
  /**
   * 卡片操作区域
   */
  actions?: React.ReactNode;
  /**
   * 卡片图标
   */
  icon?: React.ReactNode;
  /**
   * 卡片加载状态
   */
  loading?: boolean;
  /**
   * 卡片可点击
   */
  clickable?: boolean;
  /**
   * 卡片选中状态
   */
  selected?: boolean;
  /**
   * 卡片悬浮效果
   */
  hoverable?: boolean;
}

/**
 * 卡片组件
 */
const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant, 
    size, 
    interactive, 
    loading, 
    title, 
    subtitle, 
    actions, 
    icon, 
    clickable,
    selected,
    hoverable,
    children, 
    testId,
    onClick,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ 
            variant, 
            size, 
            interactive: interactive || clickable || hoverable,
            loading,
            className 
          }),
          selected && 'ring-2 ring-primary',
          hoverable && 'transition-all duration-200 hover:shadow-md'
        )}
        data-testid={testId}
        onClick={clickable ? onClick : undefined}
        {...props}
      >
        {(title || subtitle || icon) && (
          <div className="flex items-start space-x-4 mb-4">
            {icon && (
              <div className="mt-1 text-primary">
                {icon}
              </div>
            )}
            <div className="flex-1 space-y-1.5">
              {title && (
                <h3 className="text-lg font-semibold leading-none tracking-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        )}
        <div className="space-y-4">
          {children}
        </div>
        {actions && (
          <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
            {actions}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';

/**
 * 卡片头部组件
 */
const CardHeader = forwardRef<HTMLDivElement, BaseComponentProps>(
  ({ className, children, testId, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      data-testid={testId}
      {...props}
    >
      {children}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

/**
 * 卡片标题组件
 */
const CardTitle = forwardRef<HTMLParagraphElement, BaseComponentProps>(
  ({ className, children, testId, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      data-testid={testId}
      {...props}
    >
      {children}
    </h3>
  )
);

CardTitle.displayName = 'CardTitle';

/**
 * 卡片描述组件
 */
const CardDescription = forwardRef<HTMLParagraphElement, BaseComponentProps>(
  ({ className, children, testId, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      data-testid={testId}
      {...props}
    >
      {children}
    </p>
  )
);

CardDescription.displayName = 'CardDescription';

/**
 * 卡片内容组件
 */
const CardContent = forwardRef<HTMLDivElement, BaseComponentProps>(
  ({ className, children, testId, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('p-6 pt-0', className)}
      data-testid={testId}
      {...props}
    >
      {children}
    </div>
  )
);

CardContent.displayName = 'CardContent';

/**
 * 卡页脚组件
 */
const CardFooter = forwardRef<HTMLDivElement, BaseComponentProps>(
  ({ className, children, testId, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      data-testid={testId}
      {...props}
    >
      {children}
    </div>
  )
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };