
/**
 * 现代化输入框组件
 * 提供多种风格的输入框样式和交互效果
 */

import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { Eye, EyeOff, Search, X, AlertCircle, CheckCircle } from 'lucide-react';

// 输入框变体类型
export type InputVariant = 'default' | 'filled' | 'outlined' | 'underlined';

// 输入框大小类型
export type InputSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// 输入框状态类型
export type InputState = 'default' | 'error' | 'success' | 'warning';

interface ModernInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: InputVariant;
  size?: InputSize;
  state?: InputState;
  label?: string;
  placeholder?: string;
  helperText?: string;
  errorText?: string;
  successText?: string;
  warningText?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  clearable?: boolean;
  searchable?: boolean;
  password?: boolean;
  maxLength?: number;
  showCount?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  animated?: boolean;
  fullWidth?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
}

/**
 * 现代化输入框组件
 */
export const ModernInput = forwardRef<HTMLInputElement, ModernInputProps>(({
  variant = 'default',
  size = 'md',
  state = 'default',
  label,
  placeholder,
  helperText,
  errorText,
  successText,
  warningText,
  prefix,
  suffix,
  clearable = false,
  searchable = false,
  password = false,
  maxLength,
  showCount = false,
  disabled = false,
  readOnly = false,
  required = false,
  animated = true,
  fullWidth = true,
  value: controlledValue,
  onChange,
  onClear,
  className,
  ...props
}, ref) => {
  // 内部状态
  const [value, setValue] = useState(controlledValue || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 处理受控组件
  useEffect(() => {
    if (controlledValue !== undefined) {
      setValue(controlledValue);
    }
  }, [controlledValue]);

  // 处理输入变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    onChange?.(e);
  };

  // 处理清除
  const handleClear = () => {
    setValue('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    onChange?.({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
    onClear?.();
  };

  // 切换密码可见性
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // 获取变体样式
  const getVariantClasses = () => {
    switch (variant) {
      case 'filled':
        return 'bg-gray-100 dark:bg-gray-800 border-transparent';
      case 'outlined':
        return 'bg-transparent border-gray-300 dark:border-gray-600';
      case 'underlined':
        return 'bg-transparent border-0 border-b-2 border-gray-300 dark:border-gray-600 rounded-none';
      case 'default':
      default:
        return 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600';
    }
  };

  // 获取尺寸样式
  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'text-xs px-2 py-1 h-7';
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

  // 获取状态样式
  const getStateClasses = () => {
    switch (state) {
      case 'error':
        return 'border-red-500 focus:ring-red-500 dark:border-red-600';
      case 'success':
        return 'border-green-500 focus:ring-green-500 dark:border-green-600';
      case 'warning':
        return 'border-yellow-500 focus:ring-yellow-500 dark:border-yellow-600';
      case 'default':
      default:
        return 'border-gray-300 focus:ring-blue-500 dark:border-gray-600';
    }
  };

  // 获取禁用状态样式
  const getDisabledClasses = () => {
    if (disabled) {
      return 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-800';
    }
    return '';
  };

  // 获取只读状态样式
  const getReadOnlyClasses = () => {
    if (readOnly) {
      return 'bg-gray-50 dark:bg-gray-800';
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
    return 'transition-all duration-200';
  };

  // 获取标签样式
  const getLabelClasses = () => {
    return cn(
      'block text-sm font-medium mb-1',
      state === 'error' && 'text-red-600 dark:text-red-400',
      state === 'success' && 'text-green-600 dark:text-green-400',
      state === 'warning' && 'text-yellow-600 dark:text-yellow-400',
      state === 'default' && 'text-gray-700 dark:text-gray-300'
    );
  };

  // 获取辅助文本样式
  const getHelperTextClasses = () => {
    return cn(
      'mt-1 text-sm',
      state === 'error' && 'text-red-600 dark:text-red-400',
      state === 'success' && 'text-green-600 dark:text-green-400',
      state === 'warning' && 'text-yellow-600 dark:text-yellow-400',
      state === 'default' && 'text-gray-500 dark:text-gray-400'
    );
  };

  // 组合所有样式类
  const inputClasses = cn(
    'flex items-center border rounded-md',
    getVariantClasses(),
    getSizeClasses(),
    getStateClasses(),
    getDisabledClasses(),
    getReadOnlyClasses(),
    getFullWidthClasses(),
    getFocusClasses(),
    getAnimationClasses(),
    className
  );

  // 获取状态图标
  const getStateIcon = () => {
    switch (state) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  // 获取状态文本
  const getStateText = () => {
    switch (state) {
      case 'error':
        return errorText;
      case 'success':
        return successText;
      case 'warning':
        return warningText;
      default:
        return helperText;
    }
  };

  return (
    <div className={cn(fullWidth && 'w-full')}>
      {/* 标签 */}
      {label && (
        <label className={getLabelClasses()}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* 输入框容器 */}
      <div className={cn('relative', fullWidth && 'w-full')}>
        {/* 前缀 */}
        {prefix && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
            {prefix}
          </div>
        )}

        {/* 搜索图标 */}
        {searchable && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
            <Search className="h-4 w-4" />
          </div>
        )}

        {/* 输入框 */}
        <input
          ref={(node) => {
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
            inputRef.current = node;
          }}
          type={password && !showPassword ? 'password' : 'text'}
          value={value}
          onChange={handleChange}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={maxLength}
          className={cn(
            inputClasses,
            (prefix || searchable) && 'pl-10',
            (suffix || password || clearable || state !== 'default') && 'pr-10',
            variant === 'underlined' && 'border-0 border-b-2 rounded-none px-0'
          )}
          {...props}
        />

        {/* 清除按钮 */}
        {clearable && value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* 密码可见性切换按钮 */}
        {password && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}

        {/* 状态图标 */}
        {state !== 'default' && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {getStateIcon()}
          </div>
        )}

        {/* 后缀 */}
        {suffix && state === 'default' && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
            {suffix}
          </div>
        )}
      </div>

      {/* 辅助文本 */}
      {(getStateText() || (showCount && maxLength)) && (
        <div className="flex justify-between mt-1">
          <div className={getHelperTextClasses()}>
            {getStateText()}
          </div>
          {showCount && maxLength && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {value.length}/{maxLength}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

ModernInput.displayName = 'ModernInput';

/**
 * 文本域组件
 */
interface ModernTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  variant?: InputVariant;
  size?: InputSize;
  state?: InputState;
  label?: string;
  placeholder?: string;
  helperText?: string;
  errorText?: string;
  successText?: string;
  warningText?: string;
  maxLength?: number;
  showCount?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  animated?: boolean;
  fullWidth?: boolean;
  autoResize?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const ModernTextarea = forwardRef<HTMLTextAreaElement, ModernTextareaProps>(({
  variant = 'default',
  size = 'md',
  state = 'default',
  label,
  placeholder,
  helperText,
  errorText,
  successText,
  warningText,
  maxLength,
  showCount = false,
  disabled = false,
  readOnly = false,
  required = false,
  animated = true,
  fullWidth = true,
  autoResize = true,
  value: controlledValue,
  onChange,
  className,
  ...props
}, ref) => {
  // 内部状态
  const [value, setValue] = useState(controlledValue || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 处理受控组件
  useEffect(() => {
    if (controlledValue !== undefined) {
      setValue(controlledValue);
    }
  }, [controlledValue]);

  // 处理输入变化
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    onChange?.(e);

    // 自动调整高度
    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // 获取变体样式
  const getVariantClasses = () => {
    switch (variant) {
      case 'filled':
        return 'bg-gray-100 dark:bg-gray-800 border-transparent';
      case 'outlined':
        return 'bg-transparent border-gray-300 dark:border-gray-600';
      case 'underlined':
        return 'bg-transparent border-0 border-b-2 border-gray-300 dark:border-gray-600 rounded-none';
      case 'default':
      default:
        return 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600';
    }
  };

  // 获取尺寸样式
  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'text-xs px-2 py-1 min-h-[60px]';
      case 'sm':
        return 'text-sm px-3 py-1.5 min-h-[80px]';
      case 'lg':
        return 'text-lg px-5 py-2.5 min-h-[120px]';
      case 'xl':
        return 'text-xl px-6 py-3 min-h-[140px]';
      case 'md':
      default:
        return 'text-sm px-4 py-2 min-h-[100px]';
    }
  };

  // 获取状态样式
  const getStateClasses = () => {
    switch (state) {
      case 'error':
        return 'border-red-500 focus:ring-red-500 dark:border-red-600';
      case 'success':
        return 'border-green-500 focus:ring-green-500 dark:border-green-600';
      case 'warning':
        return 'border-yellow-500 focus:ring-yellow-500 dark:border-yellow-600';
      case 'default':
      default:
        return 'border-gray-300 focus:ring-blue-500 dark:border-gray-600';
    }
  };

  // 获取禁用状态样式
  const getDisabledClasses = () => {
    if (disabled) {
      return 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-800';
    }
    return '';
  };

  // 获取只读状态样式
  const getReadOnlyClasses = () => {
    if (readOnly) {
      return 'bg-gray-50 dark:bg-gray-800';
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
    return 'transition-all duration-200';
  };

  // 获取标签样式
  const getLabelClasses = () => {
    return cn(
      'block text-sm font-medium mb-1',
      state === 'error' && 'text-red-600 dark:text-red-400',
      state === 'success' && 'text-green-600 dark:text-green-400',
      state === 'warning' && 'text-yellow-600 dark:text-yellow-400',
      state === 'default' && 'text-gray-700 dark:text-gray-300'
    );
  };

  // 获取辅助文本样式
  const getHelperTextClasses = () => {
    return cn(
      'mt-1 text-sm',
      state === 'error' && 'text-red-600 dark:text-red-400',
      state === 'success' && 'text-green-600 dark:text-green-400',
      state === 'warning' && 'text-yellow-600 dark:text-yellow-400',
      state === 'default' && 'text-gray-500 dark:text-gray-400'
    );
  };

  // 组合所有样式类
  const textareaClasses = cn(
    'block border rounded-md resize-none',
    getVariantClasses(),
    getSizeClasses(),
    getStateClasses(),
    getDisabledClasses(),
    getReadOnlyClasses(),
    getFullWidthClasses(),
    getFocusClasses(),
    getAnimationClasses(),
    className
  );

  // 获取状态文本
  const getStateText = () => {
    switch (state) {
      case 'error':
        return errorText;
      case 'success':
        return successText;
      case 'warning':
        return warningText;
      default:
        return helperText;
    }
  };

  return (
    <div className={cn(fullWidth && 'w-full')}>
      {/* 标签 */}
      {label && (
        <label className={getLabelClasses()}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* 文本域 */}
      <textarea
        ref={(node) => {
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
          textareaRef.current = node;
        }}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        maxLength={maxLength}
        className={textareaClasses}
        {...props}
      />

      {/* 辅助文本 */}
      {(getStateText() || (showCount && maxLength)) && (
        <div className="flex justify-between mt-1">
          <div className={getHelperTextClasses()}>
            {getStateText()}
          </div>
          {showCount && maxLength && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {value.length}/{maxLength}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

ModernTextarea.displayName = 'ModernTextarea';
