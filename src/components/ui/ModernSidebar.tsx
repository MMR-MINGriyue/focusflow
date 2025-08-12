
/**
 * 现代化侧边栏组件
 * 提供多种风格的侧边栏样式和交互效果
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft, 
  Home, 
  Settings, 
  BarChart3, 
  User,
  LogOut,
  Plus,
  X
} from 'lucide-react';

// 侧边栏位置类型
export type SidebarPosition = 'left' | 'right';

// 侧边栏变体类型
export type SidebarVariant = 'default' | 'dark' | 'transparent' | 'colored';

// 侧边栏大小类型
export type SidebarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// 侧边栏项类型
export interface SidebarItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  badge?: string | number;
  children?: SidebarItem[];
  onClick?: () => void;
  disabled?: boolean;
  separator?: boolean;
}

interface ModernSidebarProps {
  logo?: React.ReactNode;
  brand?: string;
  brandHref?: string;
  items: SidebarItem[];
  user?: {
    name: string;
    avatar?: string;
    email?: string;
  };
  footer?: React.ReactNode;
  position?: SidebarPosition;
  variant?: SidebarVariant;
  size?: SidebarSize;
  collapsible?: boolean;
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
  className?: string;
}

/**
 * 现代化侧边栏组件
 */
export const ModernSidebar: React.FC<ModernSidebarProps> = ({
  logo,
  brand,
  brandHref = '/',
  items,
  user,
  footer,
  position = 'left',
  variant = 'default',
  size = 'md',
  collapsible = true,
  collapsed = false,
  onCollapseChange,
  className,
}) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // 处理折叠状态变化
  const handleCollapseChange = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapseChange?.(newCollapsed);
  };

  // 切换子菜单展开/折叠
  const toggleItemExpand = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  // 检查当前路径是否匹配
  const isPathActive = (href?: string) => {
    if (!href) return false;
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  // 获取变体样式
  const getVariantClasses = () => {
    switch (variant) {
      case 'dark':
        return 'bg-gray-900 text-white';
      case 'transparent':
        return 'bg-transparent text-gray-800 dark:text-white';
      case 'colored':
        return 'bg-gradient-to-b from-blue-600 to-blue-800 text-white';
      case 'default':
      default:
        return 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white';
    }
  };

  // 获取尺寸样式
  const getSizeClasses = () => {
    if (isCollapsed) {
      return position === 'left' || position === 'right' ? 'w-16' : 'w-16';
    }

    switch (size) {
      case 'xs':
        return 'w-48';
      case 'sm':
        return 'w-56';
      case 'lg':
        return 'w-72';
      case 'xl':
        return 'w-80';
      case 'md':
      default:
        return 'w-64';
    }
  };

  // 获取位置样式
  const getPositionClasses = () => {
    if (position === 'right') {
      return 'right-0 border-l border-gray-200 dark:border-gray-700';
    }
    return 'left-0 border-r border-gray-200 dark:border-gray-700';
  };

  // 渲染侧边栏项
  const renderSidebarItem = (item: SidebarItem, depth = 0) => {
    const isActive = isPathActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);

    if (item.separator) {
      return (
        <div key={item.id} className="my-2 border-t border-gray-200 dark:border-gray-700"></div>
      );
    }

    return (
      <div key={item.id}>
        <Link
          to={item.href || '#'}
          onClick={(e) => {
            if (item.disabled) {
              e.preventDefault();
              return;
            }

            if (hasChildren) {
              e.preventDefault();
              toggleItemExpand(item.id);
            }

            item.onClick?.();
          }}
          className={cn(
            'flex items-center py-2 px-4 my-1 rounded-lg transition-colors',
            depth > 0 && 'ml-4',
            isActive 
              ? variant === 'colored' 
                ? 'bg-white/20' 
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700',
            item.disabled && 'opacity-50 cursor-not-allowed',
            isCollapsed && depth === 0 && 'justify-center'
          )}
        >
          {/* 图标 */}
          {item.icon && (
            <div className={cn('flex-shrink-0', isCollapsed ? '' : 'mr-3')}>
              {item.icon}
            </div>
          )}

          {/* 标签 */}
          {!isCollapsed && (
            <span className="truncate flex-1">{item.label}</span>
          )}

          {/* 徽章 */}
          {!isCollapsed && item.badge && (
            <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
              {item.badge}
            </span>
          )}

          {/* 子菜单箭头 */}
          {!isCollapsed && hasChildren && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleItemExpand(item.id);
              }}
              className="ml-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
        </Link>

        {/* 子菜单 */}
        {!isCollapsed && hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children?.map((child) => renderSidebarItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        'fixed top-0 bottom-0 z-40 flex flex-col transition-all duration-300',
        getVariantClasses(),
        getSizeClasses(),
        getPositionClasses(),
        className
      )}
    >
      {/* Logo和品牌 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <Link to={brandHref} className="flex items-center space-x-3">
            {logo && <div className="flex-shrink-0">{logo}</div>}
            {brand && (
              <span className="text-lg font-bold truncate">
                {brand}
              </span>
            )}
          </Link>
        )}

        {/* 折叠按钮 */}
        {collapsible && (
          <button
            onClick={handleCollapseChange}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {position === 'left' ? (
              isCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )
            ) : isCollapsed ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      {/* 导航菜单 */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-3">
          {items.map((item) => renderSidebarItem(item))}
        </div>
      </div>

      {/* 用户信息 */}
      {user && !isCollapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {user.avatar ? (
                <img
                  className="h-10 w-10 rounded-full"
                  src={user.avatar}
                  alt={user.name}
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  {user.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              {user.email && (
                <p className="text-xs opacity-75 truncate">{user.email}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 页脚 */}
      {footer && !isCollapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {footer}
        </div>
      )}
    </div>
  );
};

/**
 * 侧边栏触发器组件
 */
interface SidebarTriggerProps {
  onClick: () => void;
  isOpen?: boolean;
  className?: string;
}

export const SidebarTrigger: React.FC<SidebarTriggerProps> = ({
  onClick,
  isOpen,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-2 rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
        className
      )}
    >
      {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </button>
  );
};

/**
 * 侧边栏覆盖层组件
 */
interface SidebarOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const SidebarOverlay: React.FC<SidebarOverlayProps> = ({
  isOpen,
  onClose,
  className,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden',
        className
      )}
      onClick={onClose}
    />
  );
};

// 导入Menu图标
const Menu = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
