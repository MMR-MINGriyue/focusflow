import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Timer, 
  BarChart3, 
 
  Settings, 
  Globe, 
 
  HelpCircle,
  Menu,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ThemeToggle';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    id: 'home',
    label: '首页',
    icon: <Home className="w-5 h-5" />,
    path: '/'
  },
  {
    id: 'timer',
    label: '计时器',
    icon: <Timer className="w-5 h-5" />,
    path: '/timer',
    children: [
      {
        id: 'classic-timer',
        label: '经典计时器',
        icon: <Timer className="w-4 h-4" />,
        path: '/timer/classic'
      },
      {
        id: 'smart-timer',
        label: '智能计时器',
        icon: <Timer className="w-4 h-4" />,
        path: '/timer/smart'
      },
      {
        id: 'custom-timer',
        label: '自定义计时器',
        icon: <Timer className="w-4 h-4" />,
        path: '/timer/custom'
      },
      {
        id: 'enhanced-timer',
        label: '增强版计时器',
        icon: <Timer className="w-4 h-4" />,
        path: '/timer/enhanced'
      }
    ]
  },
  {
    id: 'stats',
    label: '统计',
    icon: <BarChart3 className="w-5 h-5" />,
    path: '/stats',
    children: [
      {
        id: 'daily-stats',
        label: '每日统计',
        icon: <BarChart3 className="w-4 h-4" />,
        path: '/stats/daily'
      },
      {
        id: 'weekly-stats',
        label: '每周统计',
        icon: <BarChart3 className="w-4 h-4" />,
        path: '/stats/weekly'
      },
      {
        id: 'monthly-stats',
        label: '每月统计',
        icon: <BarChart3 className="w-4 h-4" />,
        path: '/stats/monthly'
      },
      {
        id: 'enhanced-stats',
        label: '增强版统计',
        icon: <BarChart3 className="w-4 h-4" />,
        path: '/stats/enhanced'
      }
    ]
  },
  {
    id: 'tools',
    label: '工具',
    icon: <Settings className="w-5 h-5" />,
    children: [
      {
        id: 'world-clock',
        label: '世界时钟',
        icon: <Globe className="w-4 h-4" />,
        path: '/tools/world-clock'
      },
      {
        id: 'settings',
        label: '设置',
        icon: <Settings className="w-4 h-4" />,
        path: '/tools/settings'
      },
      {
        id: 'performance',
        label: '性能优化',
        icon: <BarChart3 className="w-4 h-4" />,
        path: '/tools/performance',
        children: [
          {
            id: 'performance-demo',
            label: '性能演示',
            icon: <BarChart3 className="w-3 h-3" />,
            path: '/tools/performance/demo'
          },
          {
            id: 'web-worker',
            label: 'Web Worker',
            icon: <BarChart3 className="w-3 h-3" />,
            path: '/tools/performance/web-worker'
          },
          {
            id: 'performance-comparison',
            label: '性能对比',
            icon: <BarChart3 className="w-3 h-3" />,
            path: '/tools/performance/comparison'
          }
        ]
      }
    ]
  },
  {
    id: 'help',
    label: '帮助',
    icon: <HelpCircle className="w-5 h-5" />,
    path: '/help',
    children: [
      {
        id: 'getting-started',
        label: '入门指南',
        icon: <HelpCircle className="w-4 h-4" />,
        path: '/help/getting-started'
      },
      {
        id: 'shortcuts',
        label: '快捷键',
        icon: <HelpCircle className="w-4 h-4" />,
        path: '/help/shortcuts'
      },
      {
        id: 'faq',
        label: '常见问题',
        icon: <HelpCircle className="w-4 h-4" />,
        path: '/help/faq'
      }
    ]
  }
];

interface NavbarProps {
  className?: string;
}

/**
 * 导航栏组件
 * 提供多级菜单导航功能
 */
const Navbar: React.FC<NavbarProps> = ({ className = '' }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openSubDropdown, setOpenSubDropdown] = useState<string | null>(null);
  const location = useLocation();
  const navbarRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
        setOpenSubDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 路由变化时关闭菜单
  useEffect(() => {
    setIsMenuOpen(false);
    setOpenDropdown(null);
    setOpenSubDropdown(null);
  }, [location.pathname]);

  // 切换下拉菜单
  const toggleDropdown = (id: string) => {
    if (openDropdown === id) {
      setOpenDropdown(null);
      setOpenSubDropdown(null);
    } else {
      setOpenDropdown(id);
      setOpenSubDropdown(null);
    }
  };

  // 切换子下拉菜单
  const toggleSubDropdown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (openSubDropdown === id) {
      setOpenSubDropdown(null);
    } else {
      setOpenSubDropdown(id);
    }
  };

  // 渲染导航项
  const renderNavItem = (item: NavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openDropdown === item.id;
    const isSubOpen = openSubDropdown === item.id;
    const isActive = location.pathname === item.path;

    if (depth === 0) {
      return (
        <div key={item.id} className="relative">
          <button
            onClick={() => hasChildren ? toggleDropdown(item.id) : null}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isActive 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
            {hasChildren && (
              <ChevronDown 
                className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
              />
            )}
          </button>

          {hasChildren && isOpen && (
            <div className="absolute left-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
              {item.children!.map(child => renderNavItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    } else if (depth === 1) {
      return (
        <div key={item.id} className="relative">
          <Link
            to={item.path || '#'}
            onClick={(e) => hasChildren ? toggleSubDropdown(item.id, e) : null}
            className={`flex items-center justify-between w-full px-4 py-2 text-left rounded-lg transition-colors ${
              isActive 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              {item.icon}
              <span>{item.label}</span>
            </div>
            {hasChildren && (
              <ChevronRight 
                className={`w-4 h-4 transition-transform ${isSubOpen ? 'rotate-90' : ''}`} 
              />
            )}
          </Link>

          {hasChildren && isSubOpen && (
            <div className="absolute left-full top-0 ml-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
              {item.children!.map(child => renderNavItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <Link
          key={item.id}
          to={item.path || '#'}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            isActive 
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          {item.icon}
          <span>{item.label}</span>
        </Link>
      );
    }
  };

  return (
    <nav ref={navbarRef} className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Timer className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">FocusFlow</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map(item => renderNavItem(item))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800">
            <div className="space-y-1">
              {navigationItems.map(item => (
                <div key={item.id} className="relative">
                  <button
                    onClick={() => item.children ? toggleDropdown(item.id) : null}
                    className={`flex items-center justify-between w-full px-4 py-2 rounded-lg transition-colors ${
                      location.pathname === item.path 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {item.children && (
                      <ChevronDown 
                        className={`w-4 h-4 transition-transform ${openDropdown === item.id ? 'rotate-180' : ''}`} 
                      />
                    )}
                  </button>

                  {item.children && openDropdown === item.id && (
                    <div className="mt-1 ml-4 pl-2 border-l border-gray-200 dark:border-gray-700">
                      {item.children.map(child => (
                        <div key={child.id} className="relative">
                          <Link
                            to={child.path || '#'}
                            onClick={(e) => child.children ? toggleSubDropdown(child.id, e) : null}
                            className={`flex items-center justify-between w-full px-4 py-2 text-left rounded-lg transition-colors ${
                              location.pathname === child.path 
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              {child.icon}
                              <span>{child.label}</span>
                            </div>
                            {child.children && (
                              <ChevronRight 
                                className={`w-4 h-4 transition-transform ${openSubDropdown === child.id ? 'rotate-90' : ''}`} 
                              />
                            )}
                          </Link>

                          {child.children && openSubDropdown === child.id && (
                            <div className="mt-1 ml-4 pl-2 border-l border-gray-200 dark:border-gray-700">
                              {child.children.map(subChild => (
                                <Link
                                  key={subChild.id}
                                  to={subChild.path || '#'}
                                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                                    location.pathname === subChild.path 
                                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                                  }`}
                                >
                                  {subChild.icon}
                                  <span>{subChild.label}</span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
