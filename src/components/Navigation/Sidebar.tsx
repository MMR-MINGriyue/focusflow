import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Timer, 
  BarChart3, 
 
  Settings, 
  Globe, 
  HelpCircle,
  ChevronDown,

  X
} from 'lucide-react';
import { Button } from '../ui/Button';

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

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

/**
 * 侧边栏组件
 * 提供多级菜单导航功能
 */
const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, className = '' }) => {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const location = useLocation();

  // 切换菜单项展开/折叠
  const toggleItem = (id: string) => {
    if (openItems.includes(id)) {
      setOpenItems(openItems.filter(itemId => itemId !== id));
    } else {
      setOpenItems([...openItems, id]);
    }
  };

  // 渲染导航项
  const renderNavItem = (item: NavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openItems.includes(item.id);
    const isActive = location.pathname === item.path;

    return (
      <div key={item.id} className="mb-1">
        <Link
          to={item.path || '#'}
          onClick={(e) => {
            if (hasChildren) {
              e.preventDefault();
              toggleItem(item.id);
            } else {
              onClose();
            }
          }}
          className={`flex items-center justify-between w-full px-4 py-2 rounded-lg transition-colors ${
            isActive 
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
          style={{ paddingLeft: `${depth * 16 + 16}px` }}
        >
          <div className="flex items-center space-x-3">
            {item.icon}
            <span>{item.label}</span>
          </div>
          {hasChildren && (
            <ChevronDown 
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            />
          )}
        </Link>

        {hasChildren && isOpen && (
          <div className="mt-1">
            {item.children!.map(child => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static md:h-auto md:shadow-none md:z-auto ${className}`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-2">
              <Timer className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">FocusFlow</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4">
            {navigationItems.map(item => renderNavItem(item))}
          </div>

          {/* Sidebar footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              © 2023 FocusFlow. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
