/**
 * 优化的输入组件
 * 提供多种输入类型和状态，支持验证和图标
 */

import React, { forwardRef, useState, useCallback, useEffect } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/cn';
import { BaseComponent, BaseComponentProps } from './base/BaseComponent';

/**
 * 输入框变体
 */
const inputVariants = cva(
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: '',
        filled: 'bg-accent/50 border-accent',
        underlined: 'border-b-2 rounded-none border-x-0 border-t-0 px-0',
        unstyled: 'border-0 bg-transparent p-0 focus-visible:ring-0',
      },
      size: {
        default: 'h-10',
        sm: 'h-9',
        lg: 'h-11',
      },
      state: {
        default: '',
        error: 'border-destructive focus-visible:ring-destructive',
        success: 'border-green-500 focus-visible:ring-green-500',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      state: 'default',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants>,
    BaseComponentProps {
  /**
   * 输入框标签
   */
  label?: string;
  /**
   * 错误消息
   */
  error?: string;
  /**
   * 成功消息
   */
  successMessage?: string;
  /**
   * 帮助文本
   */
  helperText?: string;
  /**
   * 左侧图标
   */
  leftIcon?: React.ReactNode;
  /**
   * 右侧图标
   */
  rightIcon?: React.ReactNode;
  /**
   * 清除按钮
   */
  clearable?: boolean;
  /**
   * 字符计数
   */
  showCount?: boolean;
  /**
   * 最大长度
   */
  maxLength?: number;
  /**
   * 验证函数
   */
  validate?: (value: string) => string | undefined;
  /**
   * 输入值变化时的回调
   */
  onValueChange?: (value: string) => void;
  /**
   * 输入验证状态变化时的回调
   */
  onValidationStateChange?: (isValid: boolean) => void;
}

/**
 * 优化的输入组件
 */
export const OptimizedInput = forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    variant,
    size,
    state,
    type = 'text',
    label,
    error,
    successMessage,
    helperText,
    leftIcon,
    rightIcon,
    clearable = false,
    showCount = false,
    maxLength,
    validate,
    onValueChange,
    onValidationStateChange,
    value,
    onChange,
    testId,
    ...props
  }, ref) => {
    const [internalValue, setInternalValue] = useState(value || '');
    const [internalError, setInternalError] = useState(error || '');
    const [isFocused, setIsFocused] = useState(false);

    // 处理输入变化
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);
      onValueChange?.(newValue);
      onChange?.(e);
    }, [onValueChange, onChange]);

    // 处理清除
    const handleClear = useCallback(() => {
      setInternalValue('');
      onValueChange?.('');
      const event = {
        target: { value: '' }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange?.(event);
    }, [onValueChange, onChange]);

    // 处理验证
    useEffect(() => {
      if (validate) {
        const validationError = validate(internalValue);
        setInternalError(validationError || '');
        onValidationStateChange?.(!validationError);
      }
    }, [internalValue, validate, onValidationStateChange]);

    // 处理外部错误变化
    useEffect(() => {
      if (error !== undefined) {
        setInternalError(error);
      }
    }, [error]);

    // 处理外部值变化
    useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value);
      }
    }, [value]);

    // 确定输入状态
    const inputState = internalError ? 'error' : successMessage ? 'success' : state;

    return (
      <div className="w-full" data-testid={testId}>
        {label && (
          <label
            className={cn(
              'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-1.5 block',
              inputState === 'error' && 'text-destructive',
              inputState === 'success' && 'text-green-600'
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              inputVariants({ variant, size, state: inputState, className }),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              clearable && 'pr-10'
            )}
            ref={ref}
            value={internalValue}
            onChange={handleChange}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            maxLength={maxLength}
            {...props}
          />
          {clearable && internalValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear input"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
          {rightIcon && !clearable && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
        {(internalError || successMessage || helperText || (showCount && maxLength)) && (
          <div className="mt-1.5 text-xs flex justify-between">
            <div className="flex-1">
              {internalError && (
                <span className="text-destructive flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-1"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {internalError}
                </span>
              )}
              {successMessage && !internalError && (
                <span className="text-green-600 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-1"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  {successMessage}
                </span>
              )}
              {helperText && !internalError && !successMessage && (
                <span className="text-muted-foreground">{helperText}</span>
              )}
            </div>
            {showCount && maxLength && (
              <span className="text-muted-foreground">
                {internalValue.length}/{maxLength}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

OptimizedInput.displayName = 'OptimizedInput';
