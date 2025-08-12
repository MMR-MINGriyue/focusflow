
/**
 * 现代化应用布局组件
 * 提供统一的应用布局结构
 */

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ModernNavbar } from '../ui/ModernNavbar';
import { ModernSidebar, SidebarTrigger, SidebarOverlay } from '../ui/ModernSidebar';
import { cn } from '../../utils/cn';

interface ModernAppLayoutProps {
  sidebarItems?: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    href?: string;
    children?: Array<{
      id: string;
      label: string;
      icon?: React.ReactNode;
      href?: string;
    }>;
  }>;
  navbarActions?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * 现代化应用布局组件
 */
export const ModernAppLayout: React.FC<ModernAppLayoutProps> = ({
  sidebarItems = [],
  navbarActions,
  footer,
  className,
  contentClassName,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // 默认侧边栏项
  const defaultSidebarItems = [
    {
      id: 'dashboard',
      label: '仪表盘',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      href: '/enhanced',
    },
    {
      id: 'timer',
      label: '计时器',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      href: '/enhanced',
    },
    {
      id: 'stats',
      label: '统计',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      href: '/enhanced',
    },
    {
      id: 'settings',
      label: '设置',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 00-1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-2.573 1.066c-.94 1.543.826 3.31 2.37 2.37.996.608 2.296.07 2.572-1.065a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 002.573-1.066c.94-1.543-.826-3.31-2.37-2.37-.996-.608-2.296-.07-2.572 1.065a1.724 1.724 0 00-1.065 2.572c-1.756.426-1.756 2.924 0 3.35a1.724 1.724 0 00-2.573 1.066c-.94 1.543.826 3.31 2.37 2.37.996.608 2.296.07 2.572-1.065a1.724 1.724 0 001.065-2.572z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      href: '/enhanced',
    },
  ];

  // 使用提供的侧边栏项或默认项
  const items = sidebarItems.length > 0 ? sidebarItems : defaultSidebarItems;

  return (
    <div className={cn('min-h-screen bg-gray-50 dark:bg-gray-900 flex', className)}>
      {/* 侧边栏 */}
      <ModernSidebar
        brand="番茄工作法"
        items={items}
        collapsible={true}
        collapsed={isSidebarCollapsed}
        position="left"
        variant="default"
        size="md"
        isOpen={isSidebarOpen}
        onCollapseChange={setIsSidebarCollapsed}
      />

      {/* 侧边栏覆盖层（移动端） */}
      <SidebarOverlay 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 导航栏 */}
        <ModernNavbar
          brand="番茄工作法"
          brandHref="/enhanced"
          actions={
            <div className="flex items-center space-x-4">
              {navbarActions}
              <SidebarTrigger 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                isOpen={isSidebarOpen} 
              />
            </div>
          }
          themeToggle={true}
          mobileMenu={false}
        />

        {/* 内容区域 */}
        <main className={cn('flex-1 overflow-y-auto p-4 md:p-6', contentClassName)}>
          <Outlet />
        </main>

        {/* 页脚 */}
        {footer && (
          <footer className="border-t border-gray-200 dark:border-gray-700 p-4">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
};
