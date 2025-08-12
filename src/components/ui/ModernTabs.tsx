
/**
 * 现代化标签页组件
 * 提供多种风格的标签页样式和交互效果
 */

import React, { useState, Children, cloneElement, isValidElement, ReactElement } from 'react';
import { cn } from '../../utils/cn';

// 标签页变体类型
export type TabsVariant = 'default' | 'pills' | 'underline' | 'cards';

// 标签页大小类型
export type TabsSize = 'sm' | 'md' | 'lg';

// 标签页对齐类型
export type TabsAlign = 'start' | 'center' | 'end' | 'stretch';

interface ModernTabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  variant?: TabsVariant;
  size?: TabsSize;
  align?: TabsAlign;
  className?: string;
  listClassName?: string;
  contentClassName?: string;
}

/**
 * 现代化标签页组件
 */
export const ModernTabs: React.FC<ModernTabsProps> = ({
  value,
  onValueChange,
  children,
  variant = 'default',
  size = 'md',
  align = 'start',
  className,
  listClassName,
  contentClassName,
}) => {
  // 获取变体样式
  const getVariantClasses = () => {
    switch (variant) {
      case 'pills':
        return 'bg-gray-100 dark:bg-gray-800 p-1 rounded-lg';
      case 'underline':
        return 'border-b border-gray-200 dark:border-gray-700';
      case 'cards':
        return 'border-b border-gray-200 dark:border-gray-700';
      case 'default':
      default:
        return 'border-b border-gray-200 dark:border-gray-700';
    }
  };

  // 获取尺寸样式
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-lg';
      case 'md':
      default:
        return 'text-base';
    }
  };

  // 获取对齐样式
  const getAlignClasses = () => {
    switch (align) {
      case 'center':
        return 'justify-center';
      case 'end':
        return 'justify-end';
      case 'stretch':
        return 'justify-stretch';
      case 'start':
      default:
        return 'justify-start';
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('flex', getVariantClasses(), getSizeClasses(), getAlignClasses(), listClassName)}>
        {Children.map(children, (child, index) => {
          if (!isValidElement(child)) return child;

          return cloneElement(child as ReactElement<any>, {
            value,
            onValueChange,
            variant,
            size,
            isActive: (child as ReactElement<any>).props.value === value,
          });
        })}
      </div>

      <div className={cn('mt-4', contentClassName)}>
        {Children.map(children, (child) => {
          if (!isValidElement(child)) return null;

          if ((child as ReactElement<any>).props.value === value) {
            return (child as ReactElement<any>).props.children;
          }

          return null;
        })}
      </div>
    </div>
  );
};

ModernTabs.displayName = 'ModernTabs';

interface ModernTabsTriggerProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  // 内部使用
  isActive?: boolean;
  onValueChange?: (value: string) => void;
  variant?: TabsVariant;
  size?: TabsSize;
}

/**
 * 现代化标签页触发器组件
 */
export const ModernTabsTrigger: React.FC<ModernTabsTriggerProps> = ({
  value,
  children,
  disabled = false,
  className,
  isActive,
  onValueChange,
  variant = 'default',
  size = 'md',
}) => {
  // 获取变体样式
  const getVariantClasses = () => {
    switch (variant) {
      case 'pills':
        return isActive
          ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white';
      case 'underline':
        return isActive
          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-b-2 border-transparent';
      case 'cards':
        return isActive
          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-b-2 border-transparent';
      case 'default':
      default:
        return isActive
          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-b-2 border-transparent';
    }
  };

  // 获取尺寸样式
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'py-2 px-3';
      case 'lg':
        return 'py-3 px-5';
      case 'md':
      default:
        return 'py-2 px-4';
    }
  };

  return (
    <button
      type="button"
      onClick={() => !disabled && onValueChange?.(value)}
      disabled={disabled}
      className={cn(
        'font-medium transition-all duration-200 focus:outline-none',
        getVariantClasses(),
        getSizeClasses(),
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  );
};

ModernTabsTrigger.displayName = 'ModernTabsTrigger';

interface ModernTabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * 现代化标签页内容组件
 */
export const ModernTabsContent: React.FC<ModernTabsContentProps> = ({
  value,
  children,
  className,
}) => {
  // 这个组件的内容由ModernTabs组件渲染
  return null;
};

ModernTabsContent.displayName = 'ModernTabsContent';

/**
 * 垂直标签页组件
 */
interface ModernVerticalTabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  size?: TabsSize;
  className?: string;
  listClassName?: string;
  contentClassName?: string;
}

export const ModernVerticalTabs: React.FC<ModernVerticalTabsProps> = ({
  value,
  onValueChange,
  children,
  size = 'md',
  className,
  listClassName,
  contentClassName,
}) => {
  // 获取尺寸样式
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-lg';
      case 'md':
      default:
        return 'text-base';
    }
  };

  return (
    <div className={cn('flex flex-col md:flex-row w-full', className)}>
      <div className={cn('flex md:flex-col overflow-x-auto md:overflow-x-visible', listClassName)}>
        {Children.map(children, (child, index) => {
          if (!isValidElement(child)) return child;

          return cloneElement(child as ReactElement<any>, {
            value,
            onValueChange,
            size,
            isActive: (child as ReactElement<any>).props.value === value,
            orientation: 'vertical',
          });
        })}
      </div>

      <div className={cn('flex-1 mt-4 md:mt-0 md:ml-4', contentClassName)}>
        {Children.map(children, (child) => {
          if (!isValidElement(child)) return null;

          if ((child as ReactElement<any>).props.value === value) {
            return (child as ReactElement<any>).props.children;
          }

          return null;
        })}
      </div>
    </div>
  );
};

ModernVerticalTabs.displayName = 'ModernVerticalTabs';

interface ModernVerticalTabsTriggerProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  // 内部使用
  isActive?: boolean;
  onValueChange?: (value: string) => void;
  size?: TabsSize;
  orientation?: 'horizontal' | 'vertical';
}

/**
 * 垂直标签页触发器组件
 */
export const ModernVerticalTabsTrigger: React.FC<ModernVerticalTabsTriggerProps> = ({
  value,
  children,
  disabled = false,
  className,
  isActive,
  onValueChange,
  size = 'md',
  orientation = 'vertical',
}) => {
  // 获取尺寸样式
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'py-2 px-3';
      case 'lg':
        return 'py-3 px-5';
      case 'md':
      default:
        return 'py-2 px-4';
    }
  };

  return (
    <button
      type="button"
      onClick={() => !disabled && onValueChange?.(value)}
      disabled={disabled}
      className={cn(
        'font-medium transition-all duration-200 focus:outline-none whitespace-nowrap',
        isActive
          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800',
        getSizeClasses(),
        orientation === 'vertical' ? 'rounded-l-lg rounded-r-none' : 'rounded-t-lg rounded-b-none',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  );
};

ModernVerticalTabsTrigger.displayName = 'ModernVerticalTabsTrigger';

/**
 * 可滚动标签页组件
 */
interface ModernScrollableTabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  variant?: TabsVariant;
  size?: TabsSize;
  className?: string;
  listClassName?: string;
  contentClassName?: string;
}

export const ModernScrollableTabs: React.FC<ModernScrollableTabsProps> = ({
  value,
  onValueChange,
  children,
  variant = 'default',
  size = 'md',
  className,
  listClassName,
  contentClassName,
}) => {
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);
  const tabsListRef = React.useRef<HTMLDivElement>(null);

  // 检查是否需要显示滚动按钮
  const checkScroll = () => {
    if (tabsListRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsListRef.current;
      setShowLeftScroll(scrollLeft > 0);
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth);
    }
  };

  // 初始化和窗口大小变化时检查滚动状态
  React.useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  // 滚动到左侧
  const scrollLeft = () => {
    if (tabsListRef.current) {
      tabsListRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  // 滚动到右侧
  const scrollRight = () => {
    if (tabsListRef.current) {
      tabsListRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // 获取变体样式
  const getVariantClasses = () => {
    switch (variant) {
      case 'pills':
        return 'bg-gray-100 dark:bg-gray-800 p-1 rounded-lg';
      case 'underline':
        return 'border-b border-gray-200 dark:border-gray-700';
      case 'cards':
        return 'border-b border-gray-200 dark:border-gray-700';
      case 'default':
      default:
        return 'border-b border-gray-200 dark:border-gray-700';
    }
  };

  // 获取尺寸样式
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-lg';
      case 'md':
      default:
        return 'text-base';
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="relative">
        {/* 左侧滚动按钮 */}
        {showLeftScroll && (
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-r-md shadow-md p-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* 标签列表 */}
        <div
          ref={tabsListRef}
          className={cn(
            'flex overflow-x-auto scrollbar-hide',
            getVariantClasses(),
            getSizeClasses(),
            listClassName
          )}
          onScroll={checkScroll}
        >
          {Children.map(children, (child, index) => {
            if (!isValidElement(child)) return child;

            return cloneElement(child as ReactElement<any>, {
              value,
              onValueChange,
              variant,
              size,
              isActive: (child as ReactElement<any>).props.value === value,
            });
          })}
        </div>

        {/* 右侧滚动按钮 */}
        {showRightScroll && (
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-l-md shadow-md p-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      <div className={cn('mt-4', contentClassName)}>
        {Children.map(children, (child) => {
          if (!isValidElement(child)) return null;

          if ((child as ReactElement<any>).props.value === value) {
            return (child as ReactElement<any>).props.children;
          }

          return null;
        })}
      </div>
    </div>
  );
};

ModernScrollableTabs.displayName = 'ModernScrollableTabs';

// 为了兼容性，导出别名
export const ModernTabsList = ModernTabs;
export { ModernTabs as default };
