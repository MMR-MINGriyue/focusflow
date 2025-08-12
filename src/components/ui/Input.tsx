/**
 * 现代化Input组件
 * 支持多种变体、尺寸和状态，具有完整的无障碍访问性支持
 */

import React from 'react';
import { cn } from '../../utils/cn';
import { cva, type VariantProps } from 'class-variance-authority';
import { Eye, EyeOff, Search, X } from 'lucide-react';

// 输入框变体配置
const inputVariants = cva(
  [
    'flex w-full rounded-md border border-input bg-background px-3 py-2',
    'text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
    'placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'transition-colors'
  ],
  {
    variants: {
      variant: {
        default: 'border-input',
        error: 'border-destructive focus-visible:ring-destructive',
        success: 'border-success focus-visible:ring-success',
        warning: 'border-warning focus-visible:ring-warning'
      },
      size: {
        sm: 'h-9 px-2 text-xs',
        md: 'h-10 px-3 text-sm',
        lg: 'h-11 px-4 text-base'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md'
    }
  }
);

// 基础Input组件属性
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  success?: string;
  warning?: string;
  helperText?: string;
  label?: string;
  required?: boolean;
  loading?: boolean;
}

// 基础Input组件
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      variant,
      size,
      leftIcon,
      rightIcon,
      error,
      success,
      warning,
      helperText,
      label,
      required,
      loading,
      disabled,
      ...props
    },
    ref
  ) => {
    // 根据状态确定变体
    const computedVariant = error ? 'error' : success ? 'success' : warning ? 'warning' : variant;
    
    // 状态消息
    const statusMessage = error || success || warning || helperText;
    
    // 状态图标
    const getStatusIcon = () => {
      if (loading) {
        return (
          <svg className="h-4 w-4 animate-spin text-muted-foreground" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        );
      }
      
      if (error) {
        return (
          <svg className="h-4 w-4 text-destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      }
      
      if (success) {
        return (
          <svg className="h-4 w-4 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22,4 12,14.01 9,11.01" />
          </svg>
        );
      }
      
      if (warning) {
        return (
          <svg className="h-4 w-4 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      }
      
      return null;
    };

    const inputElement = (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {leftIcon}
          </div>
        )}
        
        <input
          type={type}
          className={cn(
            inputVariants({ variant: computedVariant, size }),
            leftIcon && 'pl-10',
            (rightIcon || getStatusIcon()) && 'pr-10',
            className
          )}
          ref={ref}
          disabled={disabled || loading}
          aria-invalid={!!error}
          aria-describedby={statusMessage ? `${props.id}-message` : undefined}
          {...props}
        />
        
        {(rightIcon || getStatusIcon()) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {getStatusIcon() || rightIcon}
          </div>
        )}
      </div>
    );

    if (label) {
      return (
        <div className="space-y-2">
          <label
            htmlFor={props.id}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
          {inputElement}
          {statusMessage && (
            <p
              id={`${props.id}-message`}
              className={cn(
                'text-xs',
                error && 'text-destructive',
                success && 'text-success',
                warning && 'text-warning',
                !error && !success && !warning && 'text-muted-foreground'
              )}
            >
              {statusMessage}
            </p>
          )}
        </div>
      );
    }

    return (
      <div>
        {inputElement}
        {statusMessage && (
          <p
            id={`${props.id}-message`}
            className={cn(
              'text-xs mt-2',
              error && 'text-destructive',
              success && 'text-success',
              warning && 'text-warning',
              !error && !success && !warning && 'text-muted-foreground'
            )}
          >
            {statusMessage}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// 密码输入框组件
export interface PasswordInputProps extends Omit<InputProps, 'type' | 'rightIcon'> {
  showPasswordToggle?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showPasswordToggle = true, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const togglePassword = () => setShowPassword(!showPassword);

    return (
      <Input
        {...props}
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        rightIcon={
          showPasswordToggle ? (
            <button
              type="button"
              onClick={togglePassword}
              className="hover:text-foreground transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          ) : undefined
        }
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

// 搜索输入框组件
export interface SearchInputProps extends Omit<InputProps, 'type' | 'leftIcon'> {
  onClear?: () => void;
  showClearButton?: boolean;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onClear, showClearButton = true, value, ...props }, ref) => {
    const handleClear = () => {
      onClear?.();
    };

    const showClear = showClearButton && value && String(value).length > 0;

    return (
      <Input
        {...props}
        ref={ref}
        type="search"
        value={value}
        leftIcon={<Search className="h-4 w-4" />}
        rightIcon={
          showClear ? (
            <button
              type="button"
              onClick={handleClear}
              className="hover:text-foreground transition-colors"
              tabIndex={-1}
              aria-label="清除搜索"
            >
              <X className="h-4 w-4" />
            </button>
          ) : undefined
        }
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';

// 数字输入框组件
export interface NumberInputProps extends Omit<InputProps, 'type'> {
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  showControls?: boolean;
  onIncrement?: () => void;
  onDecrement?: () => void;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      min,
      max,
      step = 1,
      precision,
      showControls = true,
      onIncrement,
      onDecrement,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const handleIncrement = () => {
      if (onIncrement) {
        onIncrement();
      } else if (onChange) {
        const currentValue = Number(value) || 0;
        const newValue = currentValue + step;
        const clampedValue = max !== undefined ? Math.min(newValue, max) : newValue;
        const finalValue = precision !== undefined ? Number(clampedValue.toFixed(precision)) : clampedValue;
        
        onChange({
          target: { value: String(finalValue) }
        } as React.ChangeEvent<HTMLInputElement>);
      }
    };

    const handleDecrement = () => {
      if (onDecrement) {
        onDecrement();
      } else if (onChange) {
        const currentValue = Number(value) || 0;
        const newValue = currentValue - step;
        const clampedValue = min !== undefined ? Math.max(newValue, min) : newValue;
        const finalValue = precision !== undefined ? Number(clampedValue.toFixed(precision)) : clampedValue;
        
        onChange({
          target: { value: String(finalValue) }
        } as React.ChangeEvent<HTMLInputElement>);
      }
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        rightIcon={
          showControls ? (
            <div className="flex flex-col">
              <button
                type="button"
                onClick={handleIncrement}
                className="px-1 py-0.5 hover:text-foreground transition-colors text-xs"
                tabIndex={-1}
                aria-label="增加"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={handleDecrement}
                className="px-1 py-0.5 hover:text-foreground transition-colors text-xs"
                tabIndex={-1}
                aria-label="减少"
              >
                ▼
              </button>
            </div>
          ) : undefined
        }
      />
    );
  }
);

NumberInput.displayName = 'NumberInput';

// 文本域组件
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof inputVariants> {
  error?: string;
  success?: string;
  warning?: string;
  helperText?: string;
  label?: string;
  required?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant,
      size,
      error,
      success,
      warning,
      helperText,
      label,
      required,
      resize = 'vertical',
      ...props
    },
    ref
  ) => {
    // 根据状态确定变体
    const computedVariant = error ? 'error' : success ? 'success' : warning ? 'warning' : variant;
    
    // 状态消息
    const statusMessage = error || success || warning || helperText;

    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize'
    };

    const textareaElement = (
      <textarea
        className={cn(
          inputVariants({ variant: computedVariant, size }),
          'min-h-[80px]',
          resizeClasses[resize],
          className
        )}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={statusMessage ? `${props.id}-message` : undefined}
        {...props}
      />
    );

    if (label) {
      return (
        <div className="space-y-2">
          <label
            htmlFor={props.id}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
          {textareaElement}
          {statusMessage && (
            <p
              id={`${props.id}-message`}
              className={cn(
                'text-xs',
                error && 'text-destructive',
                success && 'text-success',
                warning && 'text-warning',
                !error && !success && !warning && 'text-muted-foreground'
              )}
            >
              {statusMessage}
            </p>
          )}
        </div>
      );
    }

    return (
      <div>
        {textareaElement}
        {statusMessage && (
          <p
            id={`${props.id}-message`}
            className={cn(
              'text-xs mt-2',
              error && 'text-destructive',
              success && 'text-success',
              warning && 'text-warning',
              !error && !success && !warning && 'text-muted-foreground'
            )}
          >
            {statusMessage}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Input, PasswordInput, SearchInput, NumberInput, Textarea, inputVariants };