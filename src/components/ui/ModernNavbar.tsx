
/**
 * 现代化导航栏组件
 * 提供多种风格的导航栏样式和交互效果
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { 
  ChevronDown, 
  Menu, 
  X, 
  Search, 
  Bell, 
  User, 
  Settings, 
  LogOut,
  Sun,
  Moon
} from 'lucide-react';

// 导航栏变体类型
export type NavbarVariant = 'default' | 'transparent' | 'floating' | 'sticky';

// 导航栏位置类型
export type NavbarPosition = 'top' | 'bottom';

// 导航项类型
export interface NavItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  children?: NavItem[];
  onClick?: () => void;
}

interface ModernNavbarProps {
  logo?: React.ReactNode;
  brand?: string;
  brandHref?: string;
  items: NavItem[];
  actions?: React.ReactNode;
  variant?: NavbarVariant;
  position?: NavbarPosition;
  transparentOnScroll?: boolean;
  search?: boolean;
  notifications?: boolean;
  userMenu?: boolean;
  themeToggle?: boolean;
  mobileMenu?: boolean;
  className?: string;
}

/**
 * 现代化导航栏组件
 */
export const ModernNavbar: React.FC<ModernNavbarProps> = ({
  logo,
  brand,
  brandHref = '/',
  items,
  actions,
  variant = 'default',
  position = 'top',
  transparentOnScroll = false,
  search = false,
  notifications = false,
  userMenu = false,
  themeToggle = false,
  mobileMenu = true,
  className,
}) => {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // 处理滚动事件
  useEffect(() => {
    const handleScroll = () => {
      if (transparentOnScroll) {
        setIsScrolled(window.scrollY > 10);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [transparentOnScroll]);

  // 检测系统主题偏好
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  // 处理点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 切换主题
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  // 获取变体样式
  const getVariantClasses = () => {
    switch (variant) {
      case 'transparent':
        return isScrolled 
          ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-md' 
          : 'bg-transparent';
      case 'floating':
        return 'bg-white dark:bg-gray-900 rounded-lg shadow-lg mx-4 mt-4';
      case 'sticky':
        return 'sticky top-0 bg-white dark:bg-gray-900 shadow-md z-40';
      case 'default':
      default:
        return 'bg-white dark:bg-gray-900 shadow-md';
    }
  };

  // 获取位置样式
  const getPositionClasses = () => {
    if (position === 'bottom') {
      return 'bottom-0 top-auto border-t border-gray-200 dark:border-gray-700';
    }
    return 'top-0';
  };

  // 渲染导航项
  const renderNavItem = (item: NavItem, depth = 0) => {
    const isActive = location.pathname === item.href;
    const hasChildren = item.children && item.children.length > 0;

    if (depth > 0) {
      return (
        <Link
          key={item.label}
          to={item.href || '#'}
          onClick={item.onClick}
          className={cn(
            'flex items-center w-full px-4 py-2 text-sm rounded-md transition-colors',
            isActive 
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
          )}
        >
          {item.icon && <span className="mr-3">{item.icon}</span>}
          {item.label}
          {item.badge && (
            <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
              {item.badge}
            </span>
          )}
        </Link>
      );
    }

    return (
      <div key={item.label} className="relative">
        <Link
          to={item.href || '#'}
          onClick={item.onClick}
          className={cn(
            'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
            isActive 
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
          )}
        >
          {item.icon && <span className="mr-2">{item.icon}</span>}
          {item.label}
          {hasChildren && <ChevronDown className="ml-1 h-4 w-4" />}
          {item.badge && (
            <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
              {item.badge}
            </span>
          )}
        </Link>

        {/* 子菜单 */}
        {hasChildren && (
          <div className="absolute left-0 z-10 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0">
            {item.children?.map((child) => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav
      className={cn(
        'relative z-50',
        getVariantClasses(),
        getPositionClasses(),
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 左侧：Logo和品牌 */}
          <div className="flex items-center">
            {/* 移动端菜单按钮 */}
            {mobileMenu && (
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 focus:outline-none"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            )}

            {/* Logo和品牌 */}
            <Link to={brandHref} className="flex items-center space-x-3">
              {logo && <div className="flex-shrink-0">{logo}</div>}
              {brand && (
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {brand}
                </span>
              )}
            </Link>

            {/* 桌面端导航菜单 */}
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-1">
                {items.map((item) => (
                  <div key={item.label} className="relative group">
                    {renderNavItem(item)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧：搜索、通知、用户菜单等 */}
          <div className="flex items-center space-x-4">
            {/* 搜索 */}
            {search && (
              <div className="relative" ref={searchRef}>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="p-2 rounded-full text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 focus:outline-none"
                >
                  <Search className="h-5 w-5" />
                </button>

                {/* 搜索下拉菜单 */}
                {isSearchOpen && (
                  <div className="absolute right-0 z-10 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg p-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="搜索..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    </div>
                    <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                      输入关键词进行搜索
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 通知 */}
            {notifications && (
              <div className="relative" ref={notificationsRef}>
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2 rounded-full text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 focus:outline-none relative"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* 通知下拉菜单 */}
                {isNotificationsOpen && (
                  <div className="absolute right-0 z-10 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden">
                    <div className="py-2 px-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">通知</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <div className="py-4 px-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        暂无新通知
                      </div>
                    </div>
                    <div className="py-2 px-4 border-t border-gray-200 dark:border-gray-700 text-center">
                      <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                        查看所有通知
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 主题切换 */}
            {themeToggle && (
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 focus:outline-none"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            )}

            {/* 用户菜单 */}
            {userMenu && (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center text-sm rounded-full focus:outline-none"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                    U
                  </div>
                </button>

                {/* 用户下拉菜单 */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 z-10 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">用户名</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">user@example.com</p>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <User className="mr-3 h-4 w-4" />
                      个人资料
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <Settings className="mr-3 h-4 w-4" />
                      设置
                    </Link>
                    <button
                      type="button"
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 自定义操作 */}
            {actions}
          </div>
        </div>
      </div>

      {/* 移动端菜单 */}
      {mobileMenu && isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="pt-2 pb-3 space-y-1">
            {items.map((item) => (
              <Link
                key={item.label}
                to={item.href || '#'}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  item.onClick?.();
                }}
                className={cn(
                  'flex items-center px-3 py-2 text-base font-medium rounded-md',
                  location.pathname === item.href
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                )}
              >
                {item.icon && <span className="mr-3">{item.icon}</span>}
                {item.label}
                {item.badge && (
                  <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

/**
 * 面包屑导航组件
 */
interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface ModernBreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
}

export const ModernBreadcrumb: React.FC<ModernBreadcrumbProps> = ({
  items,
  separator = <ChevronDown className="h-4 w-4 rotate-270" />,
  className,
}) => {
  return (
    <nav className={cn('flex', className)} aria-label="面包屑">
      <ol className="flex items-center space-x-1">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center">
            {index > 0 && <span className="mx-2 text-gray-400">{separator}</span>}
            {item.href && index < items.length - 1 ? (
              <Link
                to={item.href}
                className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                {item.icon && <span className="mr-1">{item.icon}</span>}
                {item.label}
              </Link>
            ) : (
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {item.icon && <span className="mr-1">{item.icon}</span>}
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
