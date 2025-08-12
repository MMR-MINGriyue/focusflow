
/**
 * 现代化下拉菜单组件
 * 提供多种风格的下拉菜单样式和交互效果
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown, Check } from 'lucide-react';

// 下拉菜单位置类型
export type DropdownPosition = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'right' | 'left';

// 下拉菜单项类型
export interface DropdownItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  separator?: boolean;
  checked?: boolean;
  onClick?: () => void;
  href?: string;
  target?: string;
  className?: string;
}

interface ModernDropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  position?: DropdownPosition;
  width?: string | number;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
  closeOnItemClick?: boolean;
}

/**
 * 现代化下拉菜单组件
 */
export const ModernDropdown: React.FC<ModernDropdownProps> = ({
  trigger,
  items,
  position = 'bottom-left',
  width = 200,
  className,
  contentClassName,
  disabled = false,
  closeOnItemClick = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 处理点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 处理ESC键关闭下拉菜单
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // 切换下拉菜单
  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  // 处理菜单项点击
  const handleItemClick = (item: DropdownItem) => {
    if (!item.disabled) {
      item.onClick?.();
      if (closeOnItemClick) {
        setIsOpen(false);
      }
    }
  };

  // 获取位置样式
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right':
        return 'top-full right-0 mt-1';
      case 'top-left':
        return 'bottom-full left-0 mb-1';
      case 'top-right':
        return 'bottom-full right-0 mb-1';
      case 'right':
        return 'left-full top-0 ml-1';
      case 'left':
        return 'right-full top-0 mr-1';
      case 'bottom-left':
      default:
        return 'top-full left-0 mt-1';
    }
  };

  // 获取宽度样式
  const getWidthStyle = () => {
    if (typeof width === 'number') {
      return { width: `${width}px` };
    }
    return { width };
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* 触发器 */}
      <div onClick={toggleDropdown} className={disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}>
        {trigger}
      </div>

      {/* 下拉菜单内容 */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden',
            getPositionClasses(),
            contentClassName
          )}
          style={getWidthStyle()}
        >
          {items.map((item) => {
            if (item.separator) {
              return (
                <div key={item.id} className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
              );
            }

            return (
              <a
                key={item.id}
                href={item.href || '#'}
                target={item.target}
                onClick={(e) => {
                  e.preventDefault();
                  handleItemClick(item);
                }}
                className={cn(
                  'flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                  item.disabled && 'opacity-50 cursor-not-allowed',
                  item.className
                )}
              >
                {/* 图标 */}
                {item.icon && (
                  <span className="mr-3 flex-shrink-0">{item.icon}</span>
                )}

                {/* 标签 */}
                <span className="flex-1 truncate">{item.label}</span>

                {/* 选中标记 */}
                {item.checked && (
                  <span className="ml-2 flex-shrink-0">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};

ModernDropdown.displayName = 'ModernDropdown';

/**
 * 下拉按钮组件
 */
interface ModernDropdownButtonProps {
  label: React.ReactNode;
  items: DropdownItem[];
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  position?: DropdownPosition;
  width?: string | number;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
  closeOnItemClick?: boolean;
  icon?: React.ReactNode;
  chevron?: boolean;
}

export const ModernDropdownButton: React.FC<ModernDropdownButtonProps> = ({
  label,
  items,
  variant = 'default',
  size = 'md',
  position = 'bottom-left',
  width,
  className,
  contentClassName,
  disabled = false,
  closeOnItemClick = true,
  icon,
  chevron = true,
}) => {
  // 获取变体样式
  const getVariantClasses = () => {
    switch (variant) {
      case 'outline':
        return 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700';
      case 'ghost':
        return 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800';
      case 'link':
        return 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline-offset-4 hover:underline';
      case 'default':
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700';
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
      case 'md':
      default:
        return 'text-sm px-4 py-2 h-9';
    }
  };

  return (
    <ModernDropdown
      trigger={
        <button
          className={cn(
            'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
            getVariantClasses(),
            getSizeClasses(),
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          disabled={disabled}
        >
          {icon && <span className="mr-2">{icon}</span>}
          {label}
          {chevron && <ChevronDown className="ml-2 h-4 w-4" />}
        </button>
      }
      items={items}
      position={position}
      width={width}
      contentClassName={contentClassName}
      disabled={disabled}
      closeOnItemClick={closeOnItemClick}
    />
  );
};

ModernDropdownButton.displayName = 'ModernDropdownButton';

/**
 * 分割按钮下拉菜单组件
 */
interface ModernSplitButtonProps {
  label: React.ReactNode;
  items: DropdownItem[];
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  position?: DropdownPosition;
  width?: string | number;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
  closeOnItemClick?: boolean;
  icon?: React.ReactNode;
}

export const ModernSplitButton: React.FC<ModernSplitButtonProps> = ({
  label,
  items,
  onClick,
  variant = 'default',
  size = 'md',
  position = 'bottom-right',
  width,
  className,
  contentClassName,
  disabled = false,
  closeOnItemClick = true,
  icon,
}) => {
  // 获取变体样式
  const getVariantClasses = () => {
    switch (variant) {
      case 'outline':
        return 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700';
      case 'ghost':
        return 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800';
      case 'link':
        return 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline-offset-4 hover:underline';
      case 'default':
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700';
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
      case 'md':
      default:
        return 'text-sm px-4 py-2 h-9';
    }
  };

  return (
    <div className={cn('flex rounded-md overflow-hidden', className)}>
      {/* 主按钮 */}
      <button
        onClick={onClick}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
          getVariantClasses(),
          getSizeClasses(),
          disabled && 'opacity-50 cursor-not-allowed',
          'rounded-r-none'
        )}
        disabled={disabled}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {label}
      </button>

      {/* 下拉按钮 */}
      <ModernDropdown
        trigger={
          <button
            className={cn(
              'inline-flex items-center justify-center rounded-l-none font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
              getVariantClasses(),
              getSizeClasses(),
              disabled && 'opacity-50 cursor-not-allowed',
              'px-2'
            )}
            disabled={disabled}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        }
        items={items}
        position={position}
        width={width}
        contentClassName={contentClassName}
        disabled={disabled}
        closeOnItemClick={closeOnItemClick}
      />
    </div>
  );
};

ModernSplitButton.displayName = 'ModernSplitButton';
