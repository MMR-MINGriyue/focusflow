
/**
 * 现代化UI提供程序组件
 * 提供全局UI状态和上下文
 */

import React, { useState, useEffect } from 'react';
import { NotificationProvider } from './ModernNotificationSystem';

interface ModernUIProviderProps {
  children: React.ReactNode;
}

/**
 * 现代化UI提供程序组件
 */
export const ModernUIProvider: React.FC<ModernUIProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 检测系统主题偏好
  useEffect(() => {
    const isSystemDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(isSystemDarkMode);

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // 应用主题
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // 切换主题
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <NotificationProvider>
      {children}
    </NotificationProvider>
  );
};
