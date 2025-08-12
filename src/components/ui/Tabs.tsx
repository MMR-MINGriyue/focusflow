/**
 * 现代化Tabs组件
 * 基于Radix UI构建，支持多种样式和无障碍访问性
 */

import React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../../utils/cn';
import { cva, type VariantProps } from 'class-variance-authority';

// Tabs根组件
const Tabs = TabsPrimitive.Root;

// 标签列表变体
const tabsListVariants = cva(
  [
    'inline-flex items-center justify-center rounded-md p-1',
    'text-muted-foreground'
  ],
  {
    variants: {
      variant: {
        default: 'bg-muted',
        underline: 'bg-transparent border-b border-border',
        pills: 'bg-transparent space-x-1',
        cards: 'bg-transparent border-b border-border'
      },
      size: {
        sm: 'h-9 text-sm',
        md: 'h-10 text-sm',
        lg: 'h-11 text-base'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md'
    }
  }
);

// Tabs标签列表
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & 
  VariantProps<typeof tabsListVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(tabsListVariants({ variant, size }), className)}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

// 标签触发器变体
const tabsTriggerVariants = cva(
  [
    'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5',
    'text-sm font-medium ring-offset-background transition-all',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50'
  ],
  {
    variants: {
      variant: {
        default: [
          'data-[state=active]:bg-background data-[state=active]:text-foreground',
          'data-[state=active]:shadow-sm'
        ],
        underline: [
          'rounded-none border-b-2 border-transparent px-4 py-2',
          'data-[state=active]:border-primary data-[state=active]:text-foreground',
          'hover:text-foreground'
        ],
        pills: [
          'rounded-full',
          'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
          'hover:bg-muted hover:text-foreground'
        ],
        cards: [
          'rounded-t-md border border-b-0 border-transparent bg-transparent',
          'data-[state=active]:border-border data-[state=active]:bg-background',
          'data-[state=active]:text-foreground',
          'hover:bg-muted/50'
        ]
      },
      size: {
        sm: 'h-8 px-2 text-xs',
        md: 'h-9 px-3 text-sm',
        lg: 'h-10 px-4 text-base'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md'
    }
  }
);

// Tabs标签触发器
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & 
  VariantProps<typeof tabsTriggerVariants> & {
    icon?: React.ReactNode;
    badge?: React.ReactNode;
  }
>(({ className, variant, size, icon, badge, children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(tabsTriggerVariants({ variant, size }), className)}
    {...props}
  >
    <span className="flex items-center gap-2">
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
      {badge && <span className="flex-shrink-0">{badge}</span>}
    </span>
  </TabsPrimitive.Trigger>
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

// 内容变体
const tabsContentVariants = cva(
  [
    'mt-2 ring-offset-background',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
  ],
  {
    variants: {
      variant: {
        default: '',
        underline: 'mt-4',
        pills: 'mt-4',
        cards: 'border border-t-0 rounded-b-md bg-background p-4'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

// Tabs内容
const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & 
  VariantProps<typeof tabsContentVariants>
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(tabsContentVariants({ variant }), className)}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

// 垂直Tabs组件
export interface VerticalTabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

const VerticalTabs: React.FC<VerticalTabsProps> = ({
  defaultValue,
  value,
  onValueChange,
  className,
  children
}) => {
  return (
    <Tabs
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      orientation="vertical"
      className={cn('flex gap-4', className)}
    >
      {children}
    </Tabs>
  );
};

// 垂直标签列表
const VerticalTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'flex flex-col h-auto w-48 bg-muted p-1 rounded-md',
      className
    )}
    {...props}
  />
));
VerticalTabsList.displayName = 'VerticalTabsList';

// 垂直标签触发器
const VerticalTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    icon?: React.ReactNode;
  }
>(({ className, icon, children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-start gap-2 whitespace-nowrap rounded-sm px-3 py-2',
      'text-sm font-medium ring-offset-background transition-all w-full',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
      'hover:bg-background/50',
      className
    )}
    {...props}
  >
    {icon && <span className="flex-shrink-0">{icon}</span>}
    {children}
  </TabsPrimitive.Trigger>
));
VerticalTabsTrigger.displayName = 'VerticalTabsTrigger';

// 垂直标签内容
const VerticalTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'flex-1 ring-offset-background',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));
VerticalTabsContent.displayName = 'VerticalTabsContent';

// 标签徽章组件
export interface TabBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

const TabBadge: React.FC<TabBadgeProps> = ({
  children,
  variant = 'default',
  className
}) => {
  const badgeVariants = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
    outline: 'border border-input bg-background'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        badgeVariants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

// 可滚动Tabs组件
export interface ScrollableTabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

const ScrollableTabs: React.FC<ScrollableTabsProps> = ({
  defaultValue,
  value,
  onValueChange,
  className,
  children
}) => {
  return (
    <Tabs
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      className={className}
    >
      <div className="relative">
        <div className="overflow-x-auto scrollbar-hide">
          {children}
        </div>
        {/* 渐变遮罩 */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>
    </Tabs>
  );
};

// 动画Tabs组件
export interface AnimatedTabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

const AnimatedTabs: React.FC<AnimatedTabsProps> = ({
  defaultValue,
  value,
  onValueChange,
  className,
  children
}) => {
  return (
    <Tabs
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      className={className}
    >
      <div className="relative">
        {children}
      </div>
    </Tabs>
  );
};

// 导出所有组件
export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  VerticalTabs,
  VerticalTabsList,
  VerticalTabsTrigger,
  VerticalTabsContent,
  TabBadge,
  ScrollableTabs,
  AnimatedTabs,
  tabsListVariants,
  tabsTriggerVariants,
  tabsContentVariants
};