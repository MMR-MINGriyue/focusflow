
/**
 * 现代化表单组件
 * 提供丰富的表单功能和交互体验
 */

import React, { useState, useCallback } from 'react';
import { cn } from '../../utils/cn';
import { ModernInput } from './ModernInput';
import { ModernButton } from './ModernButton';
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent } from './ModernCard';
import { CheckCircle, AlertCircle, Info, AlertTriangle, Loader2 } from 'lucide-react';

// 表单字段类型
export type FormFieldType = 'text' | 'password' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'switch' | 'date' | 'time' | 'datetime';

// 表单字段验证规则
export interface FormRule {
  required?: boolean;
  message?: string;
  validator?: (value: any) => boolean | string;
}

// 表单字段选项
export interface FormFieldOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

// 表单字段配置
export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  description?: string;
  rules?: FormRule[];
  options?: FormFieldOption[];
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  descriptionClassName?: string;
}

// 表单值
export interface FormValues {
  [key: string]: any;
}

// 表单错误
export interface FormErrors {
  [key: string]: string;
}

// 表单状态
export type FormStatus = 'idle' | 'validating' | 'success' | 'error';

interface ModernFormProps {
  fields: FormField[];
  initialValues?: FormValues;
  onSubmit?: (values: FormValues) => void | Promise<void>;
  onValuesChange?: (values: FormValues) => void;
  layout?: 'horizontal' | 'vertical' | 'inline';
  labelAlign?: 'left' | 'right' | 'top';
  size?: 'small' | 'middle' | 'large';
  status?: FormStatus;
  statusMessage?: string;
  submitText?: string;
  resetText?: string;
  showResetButton?: boolean;
  loading?: boolean;
  className?: string;
}

/**
 * 现代化表单组件
 */
export const ModernForm: React.FC<ModernFormProps> = ({
  fields,
  initialValues = {},
  onSubmit,
  onValuesChange,
  layout = 'vertical',
  labelAlign = 'top',
  size = 'middle',
  status = 'idle',
  statusMessage = '',
  submitText = '提交',
  resetText = '重置',
  showResetButton = true,
  loading = false,
  className,
}) => {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // 处理字段值变化
  const handleValueChange = useCallback((name: string, value: any) => {
    const newValues = { ...values, [name]: value };
    setValues(newValues);
    onValuesChange?.(newValues);

    // 如果字段已经被触摸过，则重新验证
    if (touched[name]) {
      validateField(name, value);
    }
  }, [values, touched, onValuesChange]);

  // 处理字段触摸
  const handleFieldTouched = useCallback((name: string) => {
    if (!touched[name]) {
      setTouched({ ...touched, [name]: true });
      validateField(name, values[name]);
    }
  }, [touched, values]);

  // 验证单个字段
  const validateField = useCallback((name: string, value: any) => {
    const field = fields.find(f => f.name === name);
    if (!field) return;

    const fieldErrors: string[] = [];

    // 验证必填
    if (field.rules?.some(rule => rule.required) && (value === undefined || value === null || value === '')) {
      fieldErrors.push(field.rules?.find(rule => rule.required)?.message || `${field.label}是必填项`);
    }

    // 自定义验证
    const validatorRule = field.rules?.find(rule => rule.validator);
    if (validatorRule && validatorRule.validator) {
      const result = validatorRule.validator(value);
      if (result !== true) {
        fieldErrors.push(typeof result === 'string' ? result : validatorRule.message || `${field.label}格式不正确`);
      }
    }

    if (fieldErrors.length > 0) {
      setErrors(prev => ({ ...prev, [name]: fieldErrors[0] }));
      return false;
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
      return true;
    }
  }, [fields]);

  // 验证整个表单
  const validateForm = useCallback(() => {
    let isValid = true;
    const newErrors: FormErrors = {};

    fields.forEach(field => {
      const value = values[field.name];
      const fieldErrors: string[] = [];

      // 验证必填
      if (field.rules?.some(rule => rule.required) && (value === undefined || value === null || value === '')) {
        fieldErrors.push(field.rules?.find(rule => rule.required)?.message || `${field.label}是必填项`);
      }

      // 自定义验证
      const validatorRule = field.rules?.find(rule => rule.validator);
      if (validatorRule && validatorRule.validator) {
        const result = validatorRule.validator(value);
        if (result !== true) {
          fieldErrors.push(typeof result === 'string' ? result : validatorRule.message || `${field.label}格式不正确`);
        }
      }

      if (fieldErrors.length > 0) {
        newErrors[field.name] = fieldErrors[0];
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [fields, values]);

  // 提交表单
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // 标记所有字段为已触摸
    const newTouched: Record<string, boolean> = {};
    fields.forEach(field => {
      newTouched[field.name] = true;
    });
    setTouched(newTouched);

    // 验证表单
    if (validateForm()) {
      try {
        await onSubmit?.(values);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }
  }, [values, validateForm, onSubmit]);

  // 重置表单
  const handleReset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  // 获取布局类名
  const getLayoutClasses = () => {
    switch (layout) {
      case 'horizontal':
        return 'space-y-0 space-x-4';
      case 'inline':
        return 'flex flex-wrap items-center space-x-4';
      case 'vertical':
      default:
        return 'space-y-4';
    }
  };

  // 获取标签对齐类名
  const getLabelAlignClasses = () => {
    switch (labelAlign) {
      case 'right':
        return 'text-right';
      case 'left':
        return 'text-left';
      case 'top':
      default:
        return '';
    }
  };

  // 获取尺寸类名
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'text-sm';
      case 'large':
        return 'text-base';
      case 'middle':
      default:
        return '';
    }
  };

  // 渲染状态图标
  const renderStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'validating':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'idle':
      default:
        return null;
    }
  };

  // 渲染字段
  const renderField = (field: FormField) => {
    const { name, label, type, placeholder, description, rules, options, disabled, className, inputClassName, labelClassName, descriptionClassName } = field;
    const value = values[name];
    const error = errors[name];
    const isTouched = touched[name];
    const isRequired = rules?.some(rule => rule.required);

    const fieldId = `form-field-${name}`;
    const errorId = error ? `${fieldId}-error` : undefined;
    const descriptionId = description ? `${fieldId}-description` : undefined;

    const fieldClasses = cn(
      'w-full',
      layout === 'horizontal' && 'flex items-center',
      layout === 'inline' && 'flex-1 min-w-[200px]',
      className
    );

    const labelClasses = cn(
      'block mb-1 font-medium',
      getSizeClasses(),
      getLabelAlignClasses(),
      labelClassName,
      error && 'text-red-600 dark:text-red-400',
      layout === 'horizontal' && 'mb-0 mr-4 w-32 flex-shrink-0',
      layout === 'inline' && 'mb-0 mr-2'
    );

    const inputClasses = cn(
      'w-full',
      error && 'border-red-500 focus:ring-red-500',
      inputClassName
    );

    const descriptionClasses = cn(
      'mt-1 text-sm',
      error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400',
      descriptionClassName
    );

    const renderInput = () => {
      switch (type) {
        case 'textarea':
          return (
            <textarea
              id={fieldId}
              value={value || ''}
              onChange={(e) => handleValueChange(name, e.target.value)}
              onBlur={() => handleFieldTouched(name)}
              placeholder={placeholder}
              disabled={disabled}
              className={inputClasses}
              aria-describedby={error ? errorId : descriptionId}
              rows={4}
            />
          );
        case 'select':
          return (
            <select
              id={fieldId}
              value={value || ''}
              onChange={(e) => handleValueChange(name, e.target.value)}
              onBlur={() => handleFieldTouched(name)}
              disabled={disabled}
              className={inputClasses}
              aria-describedby={error ? errorId : descriptionId}
            >
              <option value="">{placeholder || '请选择'}</option>
              {options?.map(option => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </select>
          );
        case 'checkbox':
          return (
            <div className="flex items-center">
              <input
                id={fieldId}
                type="checkbox"
                checked={!!value}
                onChange={(e) => handleValueChange(name, e.target.checked)}
                onBlur={() => handleFieldTouched(name)}
                disabled={disabled}
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                aria-describedby={error ? errorId : descriptionId}
              />
              <label htmlFor={fieldId} className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>
            </div>
          );
        case 'radio':
          return (
            <div className="space-y-2">
              {options?.map(option => (
                <div key={option.value} className="flex items-center">
                  <input
                    id={`${fieldId}-${option.value}`}
                    type="radio"
                    name={name}
                    value={option.value}
                    checked={value === option.value}
                    onChange={() => handleValueChange(name, option.value)}
                    onBlur={() => handleFieldTouched(name)}
                    disabled={disabled || option.disabled}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    aria-describedby={error ? errorId : descriptionId}
                  />
                  <label htmlFor={`${fieldId}-${option.value}`} className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          );
        case 'switch':
          return (
            <div className="flex items-center">
              <input
                id={fieldId}
                type="checkbox"
                checked={!!value}
                onChange={(e) => handleValueChange(name, e.target.checked)}
                onBlur={() => handleFieldTouched(name)}
                disabled={disabled}
                className="sr-only"
                aria-describedby={error ? errorId : descriptionId}
              />
              <div
                onClick={() => !disabled && handleValueChange(name, !value)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full',
                  value ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition',
                    value ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </div>
              <label htmlFor={fieldId} className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>
            </div>
          );
        case 'date':
          return (
            <input
              id={fieldId}
              type="date"
              value={value || ''}
              onChange={(e) => handleValueChange(name, e.target.value)}
              onBlur={() => handleFieldTouched(name)}
              placeholder={placeholder}
              disabled={disabled}
              className={inputClasses}
              aria-describedby={error ? errorId : descriptionId}
            />
          );
        case 'time':
          return (
            <input
              id={fieldId}
              type="time"
              value={value || ''}
              onChange={(e) => handleValueChange(name, e.target.value)}
              onBlur={() => handleFieldTouched(name)}
              placeholder={placeholder}
              disabled={disabled}
              className={inputClasses}
              aria-describedby={error ? errorId : descriptionId}
            />
          );
        case 'datetime':
          return (
            <input
              id={fieldId}
              type="datetime-local"
              value={value || ''}
              onChange={(e) => handleValueChange(name, e.target.value)}
              onBlur={() => handleFieldTouched(name)}
              placeholder={placeholder}
              disabled={disabled}
              className={inputClasses}
              aria-describedby={error ? errorId : descriptionId}
            />
          );
        case 'password':
        case 'email':
        case 'number':
        case 'text':
        default:
          return (
            <ModernInput
              id={fieldId}
              type={type}
              value={value || ''}
              onChange={(e) => handleValueChange(name, e.target.value)}
              onBlur={() => handleFieldTouched(name)}
              placeholder={placeholder}
              disabled={disabled}
              className={inputClasses}
              aria-describedby={error ? errorId : descriptionId}
            />
          );
      }
    };

    // 复选框、单选框和开关不需要单独的标签
    if (type === 'checkbox' || type === 'radio' || type === 'switch') {
      return (
        <div key={name} className={fieldClasses}>
          {renderInput()}
          {error && (
            <p id={errorId} className="mt-1 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          {description && (
            <p id={descriptionId} className={descriptionClasses}>
              {description}
            </p>
          )}
        </div>
      );
    }

    return (
      <div key={name} className={fieldClasses}>
        <label htmlFor={fieldId} className={labelClasses}>
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="flex-1">
          {renderInput()}
          {error && (
            <p id={errorId} className="mt-1 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          {description && (
            <p id={descriptionId} className={descriptionClasses}>
              {description}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <ModernCard className={cn('w-full max-w-2xl mx-auto', className)}>
      <ModernCardHeader>
        <ModernCardTitle>表单</ModernCardTitle>
      </ModernCardHeader>
      <ModernCardContent>
        <form onSubmit={handleSubmit} className={cn('space-y-4', getLayoutClasses(), getSizeClasses())}>
          {fields.map(renderField)}

          {/* 状态消息 */}
          {statusMessage && (
            <div className={cn(
              'flex items-center p-3 rounded-md',
              status === 'success' && 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200',
              status === 'error' && 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200',
              status === 'validating' && 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
            )}>
              {renderStatusIcon()}
              <span className="ml-2">{statusMessage}</span>
            </div>
          )}

          {/* 提交按钮 */}
          <div className={cn(
            'flex',
            layout === 'horizontal' && 'justify-end ml-36',
            layout === 'inline' && 'justify-end'
          )}>
            {showResetButton && (
              <ModernButton
                type="button"
                onClick={handleReset}
                variant="outline"
                className="mr-2"
                disabled={loading}
              >
                {resetText}
              </ModernButton>
            )}
            <ModernButton
              type="submit"
              disabled={loading}
              loading={loading}
            >
              {submitText}
            </ModernButton>
          </div>
        </form>
      </ModernCardContent>
    </ModernCard>
  );
};
