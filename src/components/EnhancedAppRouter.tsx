
/**
 * 增强版应用路由组件
 * 使用现代化应用布局组件
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ModernAppLayout } from './layout/ModernAppLayout';
import EnhancedWebHome from '../pages/EnhancedWebHome';
import PerformanceDemo from '../pages/PerformanceDemo';
import { WebWorkerDemo } from '../components/Timer/WebWorkerDemo';
import { PerformanceComparison } from '../components/Timer/PerformanceComparison';
import TimerPage from '../pages/TimerPage';
import StatsPage from '../pages/StatsPage';
import EnhancedStatsPage from '../pages/EnhancedStatsPage';
import EnhancedTimerPage from '../pages/EnhancedTimerPage';
import WorldClockPage from '../pages/WorldClockPage';
import SettingsPage from '../pages/SettingsPage';
import HelpPage from '../pages/HelpPage';
import { useNotification } from './ui/ModernNotificationSystem';

/**
 * 增强版应用路由组件
 */
export const EnhancedAppRouter: React.FC = () => {
  const { addNotification } = useNotification();

  // 侧边栏导航项
  const sidebarItems = [
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
      children: [
        {
          id: 'classic-timer',
          label: '经典计时器',
          href: '/timer/classic',
        },
        {
          id: 'smart-timer',
          label: '智能计时器',
          href: '/timer/smart',
        },
        {
          id: 'enhanced-timer',
          label: '增强计时器',
          href: '/timer/enhanced',
        },
      ],
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
      children: [
        {
          id: 'daily-stats',
          label: '每日统计',
          href: '/stats/daily',
        },
        {
          id: 'weekly-stats',
          label: '每周统计',
          href: '/stats/weekly',
        },
        {
          id: 'monthly-stats',
          label: '每月统计',
          href: '/stats/monthly',
        },
        {
          id: 'enhanced-stats',
          label: '增强统计',
          href: '/stats/enhanced',
        },
      ],
    },
    {
      id: 'tools',
      label: '工具',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 00-1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-2.573 1.066c-.94 1.543.826 3.31 2.37 2.37.996.608 2.296.07 2.572-1.065a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 002.573-1.066c.94-1.543-.826-3.31-2.37-2.37-.996-.608-2.296-.07-2.572 1.065a1.724 1.724 0 001.065-2.572z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      children: [
        {
          id: 'world-clock',
          label: '世界时钟',
          href: '/tools/world-clock',
        },
        {
          id: 'settings',
          label: '设置',
          href: '/tools/settings',
        },
        {
          id: 'performance',
          label: '性能优化',
          href: '/tools/performance',
        },
      ],
    },
    {
      id: 'help',
      label: '帮助',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.091 0 3.728 1.406 3.728 3.5 0 .937-.31 1.744-.943 2.276-.574.532-1.307.924-2.185 1.164-.641.19-1.312.291-2 .291-1.636 0-2.868-1.226-2.868-2.868 0-.937.31-1.744.943-2.276.574-.532 1.307-.924 2.185-1.164.641-.19 1.312-.291 2-.291 1.636 0 2.868 1.226 2.868 2.868zM12 15.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
        </svg>
      ),
      href: '/help',
    },
  ];

  // 导航栏操作
  const navbarActions = (
    <div className="flex items-center space-x-4">
      <button
        onClick={() => addNotification({
          type: 'info',
          title: '通知',
          message: '这是一个测试通知',
        })}
        className="p-2 rounded-full text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538.214 1.055.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </button>
    </div>
  );

  // 页脚
  const footer = (
    <div className="text-center text-sm text-gray-500 dark:text-gray-400">
      © {new Date().getFullYear()} 番茄工作法 - 专注工作，高效生活
    </div>
  );

  return (
    <BrowserRouter>
      <ModernAppLayout
        sidebarItems={sidebarItems}
        navbarActions={navbarActions}
        footer={footer}
      >
        <Routes>
          <Route path="/enhanced" element={<EnhancedWebHome />} />
          <Route path="/timer" element={<TimerPage />} />
          <Route path="/timer/classic" element={<TimerPage mode="classic" />} />
          <Route path="/timer/smart" element={<TimerPage mode="smart" />} />
          <Route path="/timer/custom" element={<TimerPage mode="custom" />} />
          <Route path="/timer/enhanced" element={<EnhancedTimerPage />} />
          <Route path="/timer/enhanced/:mode" element={<EnhancedTimerPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/stats/daily" element={<StatsPage view="daily" />} />
          <Route path="/stats/weekly" element={<StatsPage view="weekly" />} />
          <Route path="/stats/monthly" element={<StatsPage view="monthly" />} />
          <Route path="/stats/enhanced" element={<EnhancedStatsPage />} />
          <Route path="/stats/enhanced/:view" element={<EnhancedStatsPage />} />
          <Route path="/tools/world-clock" element={<WorldClockPage />} />
          <Route path="/tools/settings" element={<SettingsPage />} />
          <Route path="/tools/performance" element={<PerformanceDemo />} />
          <Route path="/tools/performance/demo" element={<PerformanceDemo />} />
          <Route path="/tools/performance/web-worker" element={<WebWorkerDemo />} />
          <Route path="/tools/performance/comparison" element={<PerformanceComparison />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/help/getting-started" element={<HelpPage section="getting-started" />} />
          <Route path="/help/shortcuts" element={<HelpPage section="shortcuts" />} />
          <Route path="/help/faq" element={<HelpPage section="faq" />} />
          <Route path="/performance-demo" element={<PerformanceDemo />} />
          <Route path="/worker-demo" element={<WebWorkerDemo />} />
          <Route path="/comparison" element={<PerformanceComparison />} />
          <Route path="*" element={<Navigate to="/enhanced" replace />} />
        </Routes>
      </ModernAppLayout>
    </BrowserRouter>
  );
};
