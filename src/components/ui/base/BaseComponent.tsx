/**
 * 基础组件类
 * 所有UI组件的基类，提供通用功能
 */

import React, { forwardRef, useCallback } from 'react';
import { cn } from '../../../utils/cn';

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  testId?: string;
}

/**
 * 基础组件
 * 提供通用功能，如类名合并、测试ID等
 */
export const BaseComponent = forwardRef<HTMLDivElement, BaseComponentProps>(
  ({ className, children, testId, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(className)}
        data-testid={testId}
        {...props}
      >
        {children}
      </div>
    );
  }
);

BaseComponent.displayName = 'BaseComponent';
