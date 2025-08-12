import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { appWindow } from '@tauri-apps/api/window';
import Dashboard from '../components/Dashboard/Dashboard';
import NotificationCenter from '../components/Notifications/NotificationCenter';
import { useUnifiedTimerStore } from '../stores/unifiedTimerStore';
import { useTheme } from '../hooks/useTheme';
import { useSystemTray } from '../hooks/useSystemTray';
import { useKeyboardShortcuts, commonShortcuts } from '../hooks/useKeyboardShortcuts';
import { Button } from '../components/ui/Button';
import { Maximize, Minimize, X } from 'lucide-react';

/**
 * 桌面应用主入口组件
 * 整合所有桌面应用功能
 */
const DesktopApp: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const { theme, actualTheme } = useTheme();
  const { start, pause, isActive } = useUnifiedTimerStore();

  // 确保主题正确应用
  useEffect(() => {
    console.log('Current theme:', theme, 'Actual theme:', actualTheme);
  }, [theme, actualTheme]);

  // 系统托盘集成
  const handleFocusMode = () => {
    start();
  };

  const handleBreakMode = () => {
    pause();
  };

  useSystemTray({
    onFocusMode: handleFocusMode,
    onBreakMode: handleBreakMode,
  });

  // 定义快捷键
  const shortcuts = [
    {
      ...commonShortcuts.SPACE,
      action: () => {
        if (isActive) {
          pause();
        } else {
          start();
        }
      },
      displayKey: 'Space',
    },
    {
      key: 'M',
      ctrlKey: true,
      action: () => appWindow.minimize(),
      description: '最小化窗口',
      displayKey: 'Ctrl + M',
    },
    {
      key: 'W',
      ctrlKey: true,
      action: () => appWindow.close(),
      description: '关闭窗口',
      displayKey: 'Ctrl + W',
    },
    {
      key: 'F11',
      action: () => {
        if (isMaximized) {
          appWindow.unmaximize();
          setIsMaximized(false);
        } else {
          appWindow.maximize();
          setIsMaximized(true);
        }
      },
      description: '最大化/还原窗口',
      displayKey: 'F11',
    },
  ];

  // 使用快捷键
  useKeyboardShortcuts({
    enabled: true,
    shortcuts,
  });

  // 窗口控制函数
  const minimizeWindow = () => {
    appWindow.minimize();
  };

  const maximizeWindow = () => {
    if (isMaximized) {
      appWindow.unmaximize();
      setIsMaximized(false);
    } else {
      appWindow.maximize();
      setIsMaximized(true);
    }
  };

  const closeWindow = () => {
    appWindow.close();
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors ${actualTheme}`}>
      {/* 自定义标题栏 */}
      <div 
        className="fixed top-0 left-0 right-0 h-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 z-50 drag-region"
        data-tauri-drag-region
      >
        <div className="flex items-center">
          <div className="w-6 h-6 bg-blue-600 rounded mr-2"></div>
          <span className="font-medium text-gray-900 dark:text-white">FocusFlow</span>
        </div>

        <div className="flex items-center space-x-1 no-drag">
          <NotificationCenter />

          <Button
            variant="ghost"
            size="sm"
            onClick={minimizeWindow}
            className="w-8 h-6 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Minimize className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={maximizeWindow}
            className="w-8 h-6 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Maximize className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={closeWindow}
            className="w-8 h-6 p-0 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 主应用内容 */}
      <div className="pt-8">
        <Router>
          <Dashboard />
        </Router>
      </div>
    </div>
  );
};

export default DesktopApp;
