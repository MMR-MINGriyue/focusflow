/**
 * 增强的导航组件
 * 提供面包屑导航、菜单导航和路由标签等功能
 */

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '../../utils';
import { RouterManager, RouteRecord, RouteMeta } from '../../router';
import { OptimizedButton } from '../ui/OptimizedButton';
import { OptimizedCard } from '../ui/OptimizedCard';

/**
 * 面包屑导航项
 */
export interface BreadcrumbItem {
  /**
   * 路径
   */
  path: string;
  /**
   * 标题
   */
  title: string;
  /**
   * 图标
   */
  icon?: React.ReactNode;
  /**
   * 是否可点击
   */
  clickable?: boolean;
}

/**
 * 菜单项
 */
export interface MenuItem {
  /**
   * 路径
   */
  path: string;
  /**
   * 标题
   */
  title: string;
  /**
   * 图标
   */
  icon?: React.ReactNode;
  /**
   * 子菜单
   */
  children?: MenuItem[];
  /**
   * 是否禁用
   */
  disabled?: boolean;
  /**
   * 是否高亮
   */
  active?: boolean;
  /**
   * 徽章
   */
  badge?: string | number;
  /**
   * 自定义数据
   */
  custom?: Record<string, any>;
}

/**
 * 路由标签
 */
export interface RouteTab {
  /**
   * 路径
   */
  path: string;
  /**
   * 标题
   */
  title: string;
  /**
   * 图标
   */
  icon?: React.ReactNode;
  /**
   * 是否可关闭
   */
  closable?: boolean;
  /**
   * 是否固定
   */
  pinned?: boolean;
  /**
   * 自定义数据
   */
  custom?: Record<string, any>;
}

/**
 * 导航组件属性
 */
export interface EnhancedNavigationProps {
  /**
   * 路由管理器
   */
  router: RouterManager;
  /**
   * 是否显示面包屑
   */
  showBreadcrumb?: boolean;
  /**
   * 面包屑最大显示数量
   */
  breadcrumbMaxItems?: number;
  /**
   * 是否显示菜单
   */
  showMenu?: boolean;
  /**
   * 菜单数据
   */
  menuData?: MenuItem[];
  /**
   * 菜单模式
   */
  menuMode?: 'vertical' | 'horizontal' | 'inline';
  /**
   * 是否折叠菜单
   */
  menuCollapsed?: boolean;
  /**
   * 是否显示路由标签
   */
  showTabs?: boolean;
  /**
   * 标签数据
   */
  tabsData?: RouteTab[];
  /**
   * 标签位置
   */
  tabsPosition?: 'top' | 'bottom' | 'left' | 'right';
  /**
   * 是否可关闭标签
   */
  tabsClosable?: boolean;
  /**
   * 是否可拖动标签
   */
  tabsDraggable?: boolean;
  /**
   * 类名
   */
  className?: string;
  /**
   * 面包屑点击回调
   */
  onBreadcrumbClick?: (path: string) => void;
  /**
   * 菜单点击回调
   */
  onMenuClick?: (path: string) => void;
  /**
   * 标签点击回调
   */
  onTabClick?: (path: string) => void;
  /**
   * 标签关闭回调
   */
  onTabClose?: (path: string) => void;
  /**
   * 标签拖动回调
   */
  onTabDrag?: (fromIndex: number, toIndex: number) => void;
}

/**
 * 面包屑导航组件
 */
const BreadcrumbNavigation: React.FC<{
  items: BreadcrumbItem[];
  maxItems?: number;
  onItemClick?: (path: string) => void;
}> = ({ items, maxItems, onItemClick }) => {
  const [displayItems, setDisplayItems] = useState<BreadcrumbItem[]>(items);

  useEffect(() => {
    if (maxItems && items.length > maxItems) {
      // 保留首页、最后一项和中间的一些项
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const middleItems = items.slice(1, items.length - 1);

      // 计算中间可以显示的项数
      const middleDisplayCount = maxItems - 2;

      let newItems: BreadcrumbItem[] = [firstItem];

      if (middleDisplayCount > 0) {
        if (middleItems.length <= middleDisplayCount) {
          newItems = [...newItems, ...middleItems];
        } else {
          // 添加省略号
          newItems.push({
            path: '',
            title: '...',
            clickable: false,
          });

          // 添加最后几项
          const lastMiddleItems = middleItems.slice(middleItems.length - (middleDisplayCount - 1));
          newItems = [...newItems, ...lastMiddleItems];
        }
      }

      newItems.push(lastItem);
      setDisplayItems(newItems);
    } else {
      setDisplayItems(items);
    }
  }, [items, maxItems]);

  return (
    <nav className="flex items-center space-x-1 text-sm">
      {displayItems.map((item, index) => (
        <React.Fragment key={item.path || index}>
          {index > 0 && (
            <span className="text-gray-400 mx-1">/</span>
          )}
          {item.clickable !== false ? (
            <button
              onClick={() => onItemClick?.(item.path)}
              className={cn(
                'flex items-center space-x-1 px-2 py-1 rounded-md transition-colors',
                index === displayItems.length - 1
                  ? 'text-gray-900 font-medium'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              )}
            >
              {item.icon && <span className="mr-1">{item.icon}</span>}
              <span>{item.title}</span>
            </button>
          ) : (
            <span className="flex items-center space-x-1 px-2 py-1 text-gray-500">
              {item.icon && <span className="mr-1">{item.icon}</span>}
              <span>{item.title}</span>
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

/**
 * 菜单导航组件
 */
const MenuNavigation: React.FC<{
  items: MenuItem[];
  mode?: 'vertical' | 'horizontal' | 'inline';
  collapsed?: boolean;
  onItemClick?: (path: string) => void;
}> = ({ items, mode = 'vertical', collapsed = false, onItemClick }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = useCallback((path: string) => {
    setExpandedItems(prev => {
      if (prev.includes(path)) {
        return prev.filter(item => item !== path);
      } else {
        return [...prev, path];
      }
    });
  }, []);

  const renderMenuItem = useCallback((item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.path);
    const isActive = item.active;

    return (
      <div key={item.path} className="w-full">
        <div
          className={cn(
            'flex items-center w-full px-3 py-2 rounded-md transition-colors cursor-pointer',
            isActive
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
            item.disabled && 'opacity-50 cursor-not-allowed',
            level > 0 && 'pl-' + (3 + level * 4)
          )}
          onClick={() => {
            if (item.disabled) return;

            if (hasChildren) {
              toggleExpanded(item.path);
            } else {
              onItemClick?.(item.path);
            }
          }}
        >
          {item.icon && <span className="mr-2">{item.icon}</span>}
          <span className="flex-1 truncate">{item.title}</span>
          {item.badge && (
            <span className="ml-2 px-1.5 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
              {item.badge}
            </span>
          )}
          {hasChildren && (
            <span className="ml-1 transform transition-transform">
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
        </div>

        {hasChildren && isExpanded && !collapsed && (
          <div className="mt-1">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  }, [expandedItems, toggleExpanded, collapsed, onItemClick]);

  return (
    <div className={cn(
      'w-full',
      mode === 'horizontal' && 'flex flex-row space-x-1',
      mode === 'vertical' && 'flex flex-col space-y-1',
      mode === 'inline' && 'flex flex-col space-y-1'
    )}>
      {items.map(item => renderMenuItem(item))}
    </div>
  );
};

/**
 * 路由标签组件
 */
const RouteTabs: React.FC<{
  items: RouteTab[];
  position?: 'top' | 'bottom' | 'left' | 'right';
  closable?: boolean;
  draggable?: boolean;
  onItemClick?: (path: string) => void;
  onItemClose?: (path: string) => void;
  onItemDrag?: (fromIndex: number, toIndex: number) => void;
}> = ({ items, position = 'top', closable = true, draggable = false, onItemClick, onItemClose, onItemDrag }) => {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    if (!draggable) return;
    setDraggingIndex(index);
  }, [draggable]);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    if (!draggable) return;
    e.preventDefault();
    setDragOverIndex(index);
  }, [draggable]);

  const handleDragEnd = useCallback(() => {
    if (!draggable) return;

    if (draggingIndex !== null && dragOverIndex !== null && draggingIndex !== dragOverIndex) {
      onItemDrag?.(draggingIndex, dragOverIndex);
    }

    setDraggingIndex(null);
    setDragOverIndex(null);
  }, [draggable, draggingIndex, dragOverIndex, onItemDrag]);

  const handleDragLeave = useCallback(() => {
    if (!draggable) return;
    setDragOverIndex(null);
  }, [draggable]);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'flex-col-reverse';
      case 'left':
        return 'flex-row';
      case 'right':
        return 'flex-row-reverse';
      default:
        return 'flex-col';
    }
  };

  return (
    <div className={cn('flex w-full', getPositionClasses())}>
      <div className={cn(
        'flex overflow-x-auto',
        position === 'left' || position === 'right' ? 'flex-col' : 'border-b'
      )}>
        {items.map((item, index) => (
          <div
            key={item.path}
            className={cn(
              'relative flex items-center px-4 py-2 cursor-pointer transition-colors whitespace-nowrap',
              position === 'left' || position === 'right' ? 'w-full justify-start' : 'border-b-2',
              item.active
                ? position === 'left' || position === 'right'
                  ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                  : 'border-blue-600 text-blue-600'
                : position === 'left' || position === 'right'
                  ? 'hover:bg-gray-100'
                  : 'border-transparent hover:border-gray-300 hover:text-gray-700'
            )}
            draggable={draggable}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            onDragLeave={handleDragLeave}
            onClick={() => onItemClick?.(item.path)}
          >
            {item.icon && <span className="mr-2">{item.icon}</span>}
            <span className="truncate">{item.title}</span>
            {closable && !item.pinned && (
              <button
                className="ml-2 p-1 rounded-full hover:bg-gray-200"
                onClick={(e) => {
                  e.stopPropagation();
                  onItemClose?.(item.path);
                }}
              >
                <span className="text-gray-500 hover:text-gray-700">×</span>
              </button>
            )}
            {item.pinned && (
              <span className="ml-2 text-gray-400">📌</span>
            )}

            {draggable && (
              <span className="ml-2 text-gray-400 cursor-move">⋮⋮</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 增强的导航组件
 */
export const EnhancedNavigation: React.FC<EnhancedNavigationProps> = ({
  router,
  showBreadcrumb = true,
  breadcrumbMaxItems = 5,
  showMenu = true,
  menuData = [],
  menuMode = 'vertical',
  menuCollapsed = false,
  showTabs = true,
  tabsData = [],
  tabsPosition = 'top',
  tabsClosable = true,
  tabsDraggable = false,
  className,
  onBreadcrumbClick,
  onMenuClick,
  onTabClick,
  onTabClose,
  onTabDrag,
}) => {
  const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(menuData);
  const [tabs, setTabs] = useState<RouteTab[]>(tabsData);

  // 构建面包屑
  useEffect(() => {
    const buildBreadcrumb = (route: RouteRecord | null): BreadcrumbItem[] => {
      if (!route) return [];

      const items: BreadcrumbItem[] = [];
      let currentRoute: RouteRecord | null = route;

      while (currentRoute) {
        const meta = currentRoute.meta;
        if (meta && meta.showInBreadcrumb !== false) {
          items.unshift({
            path: currentRoute.fullPath,
            title: meta.title || currentRoute.name,
            icon: meta.icon,
            clickable: currentRoute !== route,
          });
        }

        // 查找父路由
        currentRoute = currentRoute.parentId
          ? router.getRouteById(currentRoute.parentId)
          : null;
      }

      return items;
    };

    const currentRoute = router.getCurrentRoute();
    const items = buildBreadcrumb(currentRoute);
    setBreadcrumbItems(items);
  }, [router]);

  // 更新菜单项的激活状态
  useEffect(() => {
    const updateMenuActiveStatus = (items: MenuItem[], currentPath: string): MenuItem[] => {
      return items.map(item => {
        const isActive = item.path === currentPath;
        const newItem = { ...item, active: isActive };

        if (item.children) {
          newItem.children = updateMenuActiveStatus(item.children, currentPath);
        }

        return newItem;
      });
    };

    const currentPath = router.getCurrentLocation().pathname;
    const updatedItems = updateMenuActiveStatus(menuData, currentPath);
    setMenuItems(updatedItems);
  }, [router, menuData]);

  // 更新标签页
  useEffect(() => {
    const currentRoute = router.getCurrentRoute();
    if (!currentRoute) return;

    const meta = currentRoute.meta;
    if (!meta || meta.showInBreadcrumb === false) return;

    const title = meta.title || currentRoute.name;
    const existingTabIndex = tabs.findIndex(tab => tab.path === currentRoute.fullPath);

    if (existingTabIndex === -1) {
      // 添加新标签
      const newTab: RouteTab = {
        path: currentRoute.fullPath,
        title,
        icon: meta.icon,
        closable: !meta.keepAlive,
        pinned: false,
      };

      setTabs(prev => [...prev, newTab]);
    } else {
      // 更新现有标签
      setTabs(prev => {
        const newTabs = [...prev];
        newTabs[existingTabIndex] = {
          ...newTabs[existingTabIndex],
          title,
          icon: meta.icon,
        };
        return newTabs;
      });
    }
  }, [router, tabs]);

  // 处理面包屑点击
  const handleBreadcrumbClick = useCallback((path: string) => {
    if (path) {
      router.push(path);
      onBreadcrumbClick?.(path);
    }
  }, [router, onBreadcrumbClick]);

  // 处理菜单点击
  const handleMenuClick = useCallback((path: string) => {
    router.push(path);
    onMenuClick?.(path);
  }, [router, onMenuClick]);

  // 处理标签点击
  const handleTabClick = useCallback((path: string) => {
    router.push(path);
    onTabClick?.(path);
  }, [router, onTabClick]);

  // 处理标签关闭
  const handleTabClose = useCallback((path: string) => {
    setTabs(prev => prev.filter(tab => tab.path !== path));
    onTabClose?.(path);

    // 如果关闭的是当前标签，导航到上一个标签
    if (path === router.getCurrentLocation().pathname) {
      const remainingTabs = tabs.filter(tab => tab.path !== path);
      if (remainingTabs.length > 0) {
        router.push(remainingTabs[remainingTabs.length - 1].path);
      } else {
        router.push('/');
      }
    }
  }, [router, tabs, onTabClose]);

  // 处理标签拖动
  const handleTabDrag = useCallback((fromIndex: number, toIndex: number) => {
    setTabs(prev => {
      const newTabs = [...prev];
      const [movedTab] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, movedTab);
      return newTabs;
    });
    onTabDrag?.(fromIndex, toIndex);
  }, [onTabDrag]);

  return (
    <div className={cn('flex flex-col w-full', className)}>
      {/* 面包屑导航 */}
      {showBreadcrumb && (
        <div className="py-2 px-4 bg-white border-b">
          <BreadcrumbNavigation
            items={breadcrumbItems}
            maxItems={breadcrumbMaxItems}
            onItemClick={handleBreadcrumbClick}
          />
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* 菜单导航 */}
        {showMenu && (
          <OptimizedCard
            variant="outlined"
            className={cn(
              'h-full overflow-auto',
              menuMode === 'horizontal' ? 'w-auto' : 'w-64',
              menuCollapsed && 'w-16'
            )}
          >
            <MenuNavigation
              items={menuItems}
              mode={menuMode}
              collapsed={menuCollapsed}
              onItemClick={handleMenuClick}
            />
          </OptimizedCard>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 路由标签 */}
          {showTabs && (
            <RouteTabs
              items={tabs.map(tab => ({
                ...tab,
                active: tab.path === router.getCurrentLocation().pathname,
              }))}
              position={tabsPosition}
              closable={tabsClosable}
              draggable={tabsDraggable}
              onItemClick={handleTabClick}
              onItemClose={handleTabClose}
              onItemDrag={handleTabDrag}
            />
          )}

          {/* 内容区域 */}
          <div className="flex-1 overflow-auto">
            {/* 这里是路由渲染的内容区域 */}
          </div>
        </div>
      </div>
    </div>
  );
};
