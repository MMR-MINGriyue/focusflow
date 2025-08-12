/**
 * 现代化Button组件
 * 支持多种变体、尺寸和状态，具有完整的无障碍访问性支持
 */

import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// 按钮变体配置
const buttonVariants = cva(
  // 基础样式
  [
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium',
    'transition-all duration-200 ease-in-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-95',
    'select-none'
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-primary text-primary-foreground shadow-sm',
          'hover:bg-primary/90 hover:shadow-md',
          'active:bg-primary/95'
        ],
        destructive: [
          'bg-destructive text-destructive-foreground shadow-sm',
          'hover:bg-destructive/90 hover:shadow-md',
          'active:bg-destructive/95'
        ],
        outline: [
          'border border-input bg-background shadow-sm',
          'hover:bg-accent hover:text-accent-foreground hover:shadow-md',
          'active:bg-accent/90'
        ],
        secondary: [
          'bg-secondary text-secondary-foreground shadow-sm',
          'hover:bg-secondary/90 hover:shadow-md',
          'active:bg-secondary/95'
        ],
        ghost: [
          'hover:bg-accent hover:text-accent-foreground',
          'active:bg-accent/90'
        ],
        link: [
          'text-primary underline-offset-4',
          'hover:underline hover:text-primary/90',
          'active:text-primary/95'
        ],
        success: [
          'bg-success text-success-foreground shadow-sm',
          'hover:bg-success/90 hover:shadow-md',
          'active:bg-success/95'
        ],
        warning: [
          'bg-warning text-warning-foreground shadow-sm',
          'hover:bg-warning/90 hover:shadow-md',
          'active:bg-warning/95'
        ],
        info: [
          'bg-info text-info-foreground shadow-sm',
          'hover:bg-info/90 hover:shadow-md',
          'active:bg-info/95'
        ]
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-md px-8 text-base',
        xl: 'h-14 rounded-lg px-10 text-lg',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8 rounded-md',
        'icon-lg': 'h-12 w-12 rounded-md'
      },
      loading: {
        true: 'cursor-wait',
        false: ''
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      loading: false
    }
  }
);

// 加载动画组件
const LoadingSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={cn('animate-spin', className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

// Button组件属性接口
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  tooltip?: string;
}

/**
 * Button组件
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      tooltip,
      asChild = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    
    // 计算是否禁用
    const isDisabled = disabled || loading;
    
    // 渲染内容
    const renderContent = () => {
      if (loading) {
        return (
          <>
            <LoadingSpinner className="mr-2 h-4 w-4" />
            {loadingText || children}
          </>
        );
      }
      
      return (
        <>
          {leftIcon && (
            <span className="mr-2 flex-shrink-0">
              {leftIcon}
            </span>
          )}
          {children}
          {rightIcon && (
            <span className="ml-2 flex-shrink-0">
              {rightIcon}
            </span>
          )}
        </>
      );
    };

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, loading, className }),
          fullWidth && 'w-full',
          className
        )}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        title={tooltip}
        {...props}
      >
        {renderContent()}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

// 按钮组组件
export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  size?: VariantProps<typeof buttonVariants>['size'];
  variant?: VariantProps<typeof buttonVariants>['variant'];
  attached?: boolean;
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  (
    {
      className,
      orientation = 'horizontal',
      size,
      variant,
      attached = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex',
          orientation === 'vertical' ? 'flex-col' : 'flex-row',
          attached && orientation === 'horizontal' && 'divide-x divide-border',
          attached && orientation === 'vertical' && 'divide-y divide-border',
          attached && 'rounded-md border border-input shadow-sm overflow-hidden',
          !attached && (orientation === 'horizontal' ? 'space-x-2' : 'space-y-2'),
          className
        )}
        role="group"
        {...props}
      >
        {React.Children.map(children, (child, index) => {
          if (React.isValidElement(child) && child.type === Button) {
            return React.cloneElement(child, {
              size: child.props.size || size,
              variant: child.props.variant || variant,
              className: cn(
                child.props.className,
                attached && 'rounded-none shadow-none border-0',
                attached && index === 0 && (orientation === 'horizontal' ? 'rounded-l-md' : 'rounded-t-md'),
                attached && index === React.Children.count(children) - 1 && (orientation === 'horizontal' ? 'rounded-r-md' : 'rounded-b-md')
              )
            });
          }
          return child;
        })}
      </div>
    );
  }
);

ButtonGroup.displayName = 'ButtonGroup';

// 图标按钮组件
export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon'> {
  icon: React.ReactNode;
  'aria-label': string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = 'icon', ...props }, ref) => {
    return (
      <Button ref={ref} size={size} {...props}>
        {icon}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

// 浮动操作按钮组件
export interface FABProps extends Omit<ButtonProps, 'variant' | 'size'> {
  size?: 'default' | 'lg';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  extended?: boolean;
}

const FAB = React.forwardRef<HTMLButtonElement, FABProps>(
  (
    {
      className,
      size = 'default',
      position = 'bottom-right',
      extended = false,
      children,
      ...props
    },
    ref
  ) => {
    const positionClasses = {
      'bottom-right': 'fixed bottom-6 right-6',
      'bottom-left': 'fixed bottom-6 left-6',
      'top-right': 'fixed top-6 right-6',
      'top-left': 'fixed top-6 left-6'
    };

    return (
      <Button
        ref={ref}
        variant="default"
        size={extended ? (size === 'lg' ? 'xl' : 'lg') : (size === 'lg' ? 'icon-lg' : 'icon')}
        className={cn(
          'z-50 shadow-lg hover:shadow-xl',
          extended ? 'rounded-full' : 'rounded-full',
          positionClasses[position],
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

FAB.displayName = 'FAB';

export { Button, ButtonGroup, IconButton, FAB, buttonVariants };
