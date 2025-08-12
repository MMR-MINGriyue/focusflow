/**
 * 增强的表单处理Hook
 * 提供更强大的表单处理功能，包括验证、提交、错误处理等
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { AppError, validateForm, isFormValid, getFormErrors } from '../utils';

/**
 * 表单字段配置
 */
export interface FormFieldConfig<T = any> {
  /**
   * 初始值
   */
  initialValue: T;
  /**
   * 验证规则
   */
  rules?: Array<{
    validator: (value: T) => boolean;
    errorMessage: string;
  }>;
  /**
   * 字段是否必填
   */
  required?: boolean;
  /**
   * 字段变更时的回调
   */
  onChange?: (value: T, prevValue: T) => void;
  /**
   * 字段是否被触摸过
   */
  touched?: boolean;
}

/**
 * 表单配置
 */
export interface FormConfig<T extends Record<string, any>> {
  /**
   * 字段配置
   */
  fields: {
    [K in keyof T]: FormFieldConfig<T[K]>;
  };
  /**
   * 表单提交函数
   */
  onSubmit?: (values: T) => Promise<void> | void;
  /**
   * 表单提交成功时的回调
   */
  onSuccess?: () => void;
  /**
   * 表单提交失败时的回调
   */
  onError?: (error: AppError) => void;
  /**
   * 表单验证失败时的回调
   */
  onValidationFail?: (errors: Partial<Record<keyof T, string>>) => void;
  /**
   * 是否在提交时验证所有字段
   */
  validateOnSubmit?: boolean;
  /**
   * 是否在字段变更时验证
   */
  validateOnChange?: boolean;
  /**
   * 是否在字段失去焦点时验证
   */
  validateOnBlur?: boolean;
  /**
   * 是否重置表单在提交成功后
   */
  resetOnSuccess?: boolean;
}

/**
 * 表单状态
 */
export interface FormState<T extends Record<string, any>> {
  /**
   * 表单值
   */
  values: T;
  /**
   * 表单错误
   */
  errors: Partial<Record<keyof T, string>>;
  /**
   * 字段是否被触摸过
   */
  touched: Partial<Record<keyof T, boolean>>;
  /**
   * 是否正在提交
   */
  isSubmitting: boolean;
  /**
   * 表单是否有效
   */
  isValid: boolean;
  /**
   * 是否有错误
   */
  hasError: boolean;
}

/**
 * 表单操作
 */
export interface FormActions<T extends Record<string, any>> {
  /**
   * 设置字段值
   */
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  /**
   * 设置多个字段值
   */
  setFieldValues: (values: Partial<T>) => void;
  /**
   * 设置错误
   */
  setFieldError: <K extends keyof T>(field: K, error: string) => void;
  /**
   * 设置多个错误
   */
  setFieldErrors: (errors: Partial<Record<keyof T, string>>) => void;
  /**
   * 触摸字段
   */
  touchField: <K extends keyof T>(field: K) => void;
  /**
   * 触摸多个字段
   */
  touchFields: (fields: Array<keyof T>) => void;
  /**
   * 重置表单
   */
  resetForm: (values?: Partial<T>) => void;
  /**
   * 重置字段
   */
  resetField: <K extends keyof T>(field: K) => void;
  /**
   * 提交表单
   */
  submitForm: () => Promise<void>;
  /**
   * 验证表单
   */
  validateForm: () => boolean;
  /**
   * 验证字段
   */
  validateField: <K extends keyof T>(field: K) => boolean;
  /**
   * 验证所有字段
   */
  validateAllFields: () => boolean;
}

/**
 * 增强的表单处理Hook
 * @param config 表单配置
 * @returns 表单状态和操作
 */
export function useEnhancedForm<T extends Record<string, any>>(
  config: FormConfig<T>
): [FormState<T>, FormActions<T>] {
  const {
    fields,
    onSubmit,
    onSuccess,
    onError,
    onValidationFail,
    validateOnSubmit = true,
    validateOnChange = false,
    validateOnBlur = true,
    resetOnSuccess = false,
  } = config;

  // 初始化表单值
  const initialValues = Object.keys(fields).reduce((acc, key) => {
    acc[key as keyof T] = fields[key as keyof T].initialValue;
    return acc;
  }, {} as T);

  // 表单状态
  const [state, setState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: true,
    hasError: false,
  });

  // 获取字段配置
  const getFieldConfig = useCallback(<K extends keyof T>(field: K): FormFieldConfig<T[K]> => {
    return fields[field];
  }, [fields]);

  // 验证字段
  const validateField = useCallback(
    <K extends keyof T>(field: K): boolean => {
      const config = getFieldConfig(field);
      const value = state.values[field];
      const rules = config.rules || [];

      // 检查必填
      if (config.required && (value === null || value === undefined || value === '')) {
        setState(prev => ({
          ...prev,
          errors: {
            ...prev.errors,
            [field]: '此字段为必填项',
          },
          isValid: false,
          hasError: true,
        }));
        return false;
      }

      // 应用验证规则
      for (const rule of rules) {
        if (!rule.validator(value)) {
          setState(prev => ({
            ...prev,
            errors: {
              ...prev.errors,
              [field]: rule.errorMessage,
            },
            isValid: false,
            hasError: true,
          }));
          return false;
        }
      }

      // 清除错误
      if (state.errors[field]) {
        setState(prev => {
          const newErrors = { ...prev.errors };
          delete newErrors[field];

          // 检查是否还有其他错误
          const hasError = Object.keys(newErrors).length > 0;

          return {
            ...prev,
            errors: newErrors,
            isValid: !hasError,
            hasError,
          };
        });
      }

      return true;
    },
    [getFieldConfig, state.values, state.errors]
  );

  // 验证所有字段
  const validateAllFields = useCallback((): boolean => {
    let isValid = true;
    const errors: Partial<Record<keyof T, string>> = {};

    // 验证所有字段
    for (const field in fields) {
      if (fields.hasOwnProperty(field)) {
        const config = fields[field as keyof T];
        const value = state.values[field as keyof T];
        const rules = config.rules || [];

        // 检查必填
        if (config.required && (value === null || value === undefined || value === '')) {
          errors[field as keyof T] = '此字段为必填项';
          isValid = false;
          continue;
        }

        // 应用验证规则
        for (const rule of rules) {
          if (!rule.validator(value)) {
            errors[field as keyof T] = rule.errorMessage;
            isValid = false;
            break;
          }
        }
      }
    }

    // 更新状态
    setState(prev => ({
      ...prev,
      errors,
      isValid,
      hasError: !isValid,
    }));

    return isValid;
  }, [fields, state.values]);

  // 验证表单
  const validateForm = useCallback((): boolean => {
    return validateAllFields();
  }, [validateAllFields]);

  // 设置字段值
  const setFieldValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      const prevValue = state.values[field];

      setState(prev => ({
        ...prev,
        values: {
          ...prev.values,
          [field]: value,
        },
      }));

      // 调用字段变更回调
      const config = getFieldConfig(field);
      if (config.onChange) {
        config.onChange(value, prevValue);
      }

      // 验证字段
      if (validateOnChange && state.touched[field]) {
        validateField(field);
      }
    },
    [getFieldConfig, state.touched, validateOnChange, validateField]
  );

  // 设置多个字段值
  const setFieldValues = useCallback(
    (values: Partial<T>) => {
      const prevValues = state.values;

      setState(prev => ({
        ...prev,
        values: {
          ...prev.values,
          ...values,
        },
      }));

      // 调用字段变更回调
      for (const field in values) {
        if (values.hasOwnProperty(field)) {
          const config = getFieldConfig(field as keyof T);
          if (config.onChange) {
            config.onChange(values[field as keyof T], prevValues[field as keyof T]);
          }
        }
      }

      // 验证字段
      if (validateOnChange) {
        for (const field in values) {
          if (values.hasOwnProperty(field) && state.touched[field as keyof T]) {
            validateField(field as keyof T);
          }
        }
      }
    },
    [getFieldConfig, state.touched, validateOnChange, validateField]
  );

  // 设置错误
  const setFieldError = useCallback(
    <K extends keyof T>(field: K, error: string) => {
      setState(prev => {
        const errors = { ...prev.errors, [field]: error };
        const hasError = Object.keys(errors).some(key => !!errors[key as keyof T]);

        return {
          ...prev,
          errors,
          isValid: !hasError,
          hasError,
        };
      });
    },
    []
  );

  // 设置多个错误
  const setFieldErrors = useCallback(
    (errors: Partial<Record<keyof T, string>>) => {
      setState(prev => {
        const newErrors = { ...prev.errors, ...errors };
        const hasError = Object.keys(newErrors).some(key => !!newErrors[key as keyof T]);

        return {
          ...prev,
          errors: newErrors,
          isValid: !hasError,
          hasError,
        };
      });
    },
    []
  );

  // 触摸字段
  const touchField = useCallback(
    <K extends keyof T>(field: K) => {
      if (!state.touched[field]) {
        setState(prev => ({
          ...prev,
          touched: {
            ...prev.touched,
            [field]: true,
          },
        }));

        // 验证字段
        if (validateOnBlur) {
          validateField(field);
        }
      }
    },
    [state.touched, validateOnBlur, validateField]
  );

  // 触摸多个字段
  const touchFields = useCallback(
    (fields: Array<keyof T>) => {
      const newTouched = { ...state.touched };
      let needsValidation = false;

      for (const field of fields) {
        if (!newTouched[field]) {
          newTouched[field] = true;
          needsValidation = true;
        }
      }

      setState(prev => ({
        ...prev,
        touched: newTouched,
      }));

      // 验证字段
      if (needsValidation && validateOnBlur) {
        for (const field of fields) {
          validateField(field);
        }
      }
    },
    [state.touched, validateOnBlur, validateField]
  );

  // 重置表单
  const resetForm = useCallback(
    (values?: Partial<T>) => {
      const newValues = values ? { ...initialValues, ...values } : initialValues;

      setState({
        values: newValues,
        errors: {},
        touched: {},
        isSubmitting: false,
        isValid: true,
        hasError: false,
      });
    },
    [initialValues]
  );

  // 重置字段
  const resetField = useCallback(
    <K extends keyof T>(field: K) => {
      setState(prev => {
        const newValues = { ...prev.values, [field]: initialValues[field] };
        const newErrors = { ...prev.errors };
        delete newErrors[field];
        const newTouched = { ...prev.touched };
        delete newTouched[field];
        const hasError = Object.keys(newErrors).some(key => !!newErrors[key as keyof T]);

        return {
          ...prev,
          values: newValues,
          errors: newErrors,
          touched: newTouched,
          isValid: !hasError,
          hasError,
        };
      });
    },
    [initialValues]
  );

  // 提交表单
  const submitForm = useCallback(async () => {
    // 验证表单
    const isValid = validateOnSubmit ? validateForm() : state.isValid;

    if (!isValid) {
      if (onValidationFail) {
        onValidationFail(state.errors);
      }
      return;
    }

    // 设置提交状态
    setState(prev => ({
      ...prev,
      isSubmitting: true,
    }));

    try {
      // 提交表单
      if (onSubmit) {
        await onSubmit(state.values);
      }

      // 成功回调
      if (onSuccess) {
        onSuccess();
      }

      // 重置表单
      if (resetOnSuccess) {
        resetForm();
      }
    } catch (error) {
      const appError = AppError.fromError(error as Error);

      // 错误回调
      if (onError) {
        onError(appError);
      }
    } finally {
      setState(prev => ({
        ...prev,
        isSubmitting: false,
      }));
    }
  }, [
    validateOnSubmit,
    validateForm,
    state.isValid,
    state.values,
    state.errors,
    onValidationFail,
    onSubmit,
    onSuccess,
    resetOnSuccess,
    resetForm,
    onError,
  ]);

  return [
    state,
    {
      setFieldValue,
      setFieldValues,
      setFieldError,
      setFieldErrors,
      touchField,
      touchFields,
      resetForm,
      resetField,
      submitForm,
      validateForm,
      validateField,
      validateAllFields,
    },
  ];
}

/**
 * 创建表单字段操作
 * @param formState 表单状态
 * @param formActions 表单操作
 * @returns 字段操作
 */
export function useFormField<T extends Record<string, any>, K extends keyof T>(
  formState: FormState<T>,
  formActions: FormActions<T>,
  field: K
) {
  const value = formState.values[field];
  const error = formState.errors[field];
  const touched = formState.touched[field];
  const hasError = !!error && touched;

  const onChange = (newValue: T[K]) => {
    formActions.setFieldValue(field, newValue);
  };

  const onBlur = () => {
    formActions.touchField(field);
  };

  const reset = () => {
    formActions.resetField(field);
  };

  return {
    value,
    error: hasError ? error : undefined,
    touched,
    hasError,
    onChange,
    onBlur,
    reset,
  };
}
