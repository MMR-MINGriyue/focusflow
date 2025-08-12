/**
 * 优化的进度条组件
 * 提供多种样式和动画效果
 */

import React, { forwardRef, useEffect, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { BaseComponent, BaseComponentProps } from './base/BaseComponent';

/**
 * 进度条变体
 */
const progressVariants = cva(
  'relative h-4 w-full overflow-hidden rounded-full bg-secondary',
  {
    variants: {
      variant: {
        default: '',
        success: '',
        warning: '',
        destructive: '',
      },
      size: {
        default: 'h-4',
        sm: 'h-2',
        lg: 'h-6',
      },
      animated: {
        true: '',
        false: '',
      },
      indeterminate: {
        true: '',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      animated: true,
      indeterminate: false,
    },
  }
);

/**
 * 进度条指示器变体
 */
const progressIndicatorVariants = cva(
  'h-full w-full flex-1 bg-primary transition-all',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        destructive: 'bg-red-500',
      },
      animated: {
        true: 'animate-pulse',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      animated: true,
    },
  }
);

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants>,
    BaseComponentProps {
  /**
   * 进度值 (0-100)
   */
  value?: number;
  /**
   * 最大值
   */
  max?: number;
  /**
   * 进度条指示器类名
   */
  indicatorClassName?: string;
  /**
   * 显示进度文本
   */
  showValue?: boolean;
  /**
   * 进度文本格式化函数
   */
  formatValue?: (value: number, max: number) => string;
  /**
   * 不确定进度条（无限循环）
   */
  indeterminate?: boolean;
}

/**
 * 优化的进度条组件
 */
export const OptimizedProgress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ 
    className, 
    variant, 
    size, 
    animated, 
    indeterminate,
    value = 0,
    max = 100,
    indicatorClassName,
    showValue = false,
    formatValue = (val, maxVal) => `${Math.round((val / maxVal) * 100)}%`,
    testId,
    ...props 
  }, ref) => {
    const [internalValue, setInternalValue] = useState(0);

    // 动画效果
    useEffect(() => {
      if (!indeterminate) {
        const animationFrame = requestAnimationFrame(() => {
          setInternalValue(value);
        });

        return () => {
          cancelAnimationFrame(animationFrame);
        };
      }
    }, [value, indeterminate]);

    // 计算进度百分比
    const percentage = Math.min(100, Math.max(0, (internalValue / max) * 100));

    return (
      <div
        ref={ref}
        className={cn(progressVariants({ variant, size, animated, indeterminate, className }))}
        data-testid={testId}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : internalValue}
        aria-valuemin={0}
        aria-valuemax={max}
        {...props}
      >
        {indeterminate ? (
          <div className="absolute top-0 h-full w-full flex overflow-hidden">
            <div className={cn(
              'absolute top-0 left-0 h-full w-1/3 bg-primary animate-indeterminate',
              indicatorClassName
            )} />
          </div>
        ) : (
          <div
            className={cn(
              progressIndicatorVariants({ variant, animated, className: indicatorClassName })
            )}
            style={{ width: `${percentage}%` }}
          />
        )}
        {showValue && !indeterminate && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-primary-foreground font-medium">
            {formatValue(internalValue, max)}
          </div>
        )}
      </div>
    );
  }
);

OptimizedProgress.displayName = 'OptimizedProgress';

/**
 * 圆形进度条组件
 */
export interface CircularProgressProps extends ProgressProps {
  /**
   * 圆形进度条大小
   */
  circleSize?: number;
  /**
   * 圆形进度条宽度
   */
  strokeWidth?: number;
  /**
   * 是否在中心显示进度文本
   */
  centerText?: boolean;
}

/**
 * 圆形进度条组件
 */
export const CircularProgress = forwardRef<HTMLDivElement, CircularProgressProps>(
  ({ 
    className, 
    variant, 
    size,
    circleSize = 120,
    strokeWidth = 10,
    centerText = true,
    value = 0,
    max = 100,
    showValue = false,
    formatValue = (val, maxVal) => `${Math.round((val / maxVal) * 100)}%`,
    testId,
    ...props 
  }, ref) => {
  // 计算进度百分比
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  // 计算圆的周长
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // 计算进度条偏移量
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      ref={ref}
      className={cn('relative inline-flex items-center justify-center', className)}
      data-testid={testId}
      {...props}
    >
      <svg
        width={circleSize}
        height={circleSize}
        viewBox={`0 0 ${circleSize} ${circleSize}`}
        className="transform -rotate-90"
      >
        {/* 背景圆 */}
        <circle
          cx={circleSize / 2}
          cy={circleSize / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-secondary"
        />
        {/* 进度圆 */}
        <circle
          cx={circleSize / 2}
          cy={circleSize / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn(
            'text-primary transition-all duration-500 ease-in-out',
            variant === 'success' && 'text-green-500',
            variant === 'warning' && 'text-yellow-500',
            variant === 'destructive' && 'text-red-500'
          )}
        />
      </svg>
      {(centerText || showValue) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium">
            {showValue ? formatValue(value, max) : null}
          </span>
        </div>
      )}
    </div>
  );
});

CircularProgress.displayName = 'CircularProgress';
