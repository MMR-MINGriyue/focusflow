import React, { useState, useCallback } from 'react';
import { useUnifiedTimerStore } from '../stores/unifiedTimerStore';
// import { useSystemTray } from '../hooks/useSystemTray';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useTheme } from '../hooks/useTheme';
import TimerDisplay from '../components/Timer/TimerDisplay';
import { AIRecommendations } from '../components/AIRecommendations';
import { Settings } from '../components/Settings/index';
import Stats from '../components/Stats';
import WorldClock from '../components/WorldClock';
// import { notificationService } from '../services/notification';
import { useTimer } from '../hooks/useTimer';

// Tauri 类型声明
declare global {
  interface Window {
    __TAURI__?: {
      window: {
        appWindow: {
          minimize: () => Promise<void>;
          close: () => Promise<void>;
          toggleMaximize: () => Promise<void>;
          isAlwaysOnTop: () => Promise<boolean>;
          setAlwaysOnTop: (value: boolean) => Promise<void>;
        };
      };
    };
  }
}

interface DesktopAppProps {
  onClose?: () => void;
}

export const DesktopApp: React.FC<DesktopAppProps> = ({ onClose }) => {
  const [currentView, setCurrentView] = useState<'timer' | 'stats' | 'settings' | 'worldclock'>('timer');
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);
  const { theme, toggleTheme } = useTheme();
  
  // 系统托盘集成
  // const systemTray = useSystemTray();
  
  // 获取计时器控制函数
  const { reset } = useUnifiedTimerStore();
  const { 
    timeLeft, 
    formattedTime, 
    currentState, 
    progress 
  } = useTimer();

  // 键盘快捷键 - 移动到函数声明之后
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'r',
        action: reset,
        description: '重置计时器'
      },
      {
        key: 'F11',
        action: () => {
          if (window.__TAURI__) {
            window.__TAURI__?.window?.appWindow?.minimize();
          }
        },
        description: '最小化窗口'
      },
      {
        key: 'Escape',
        action: () => {
          if (window.__TAURI__) {
            window.__TAURI__?.window?.appWindow?.close();
          } else if (onClose) {
            onClose();
          }
        },
        description: '关闭应用'
      }
    ]
  });

  // 通知服务初始化 - 移除initialize调用，因为notificationService没有这个方法

  // 窗口控制
  const handleMinimize = useCallback(() => {
    if (window.__TAURI__) {
      window.__TAURI__?.window?.appWindow?.minimize();
    }
  }, []);

  const handleMaximize = useCallback(() => {
    if (window.__TAURI__) {
      window.__TAURI__?.window?.appWindow?.toggleMaximize();
    }
  }, []);

  const handleClose = useCallback(() => {
    if (window.__TAURI__) {
      window.__TAURI__?.window?.appWindow?.close();
    } else if (onClose) {
      onClose();
    }
  }, [onClose]);

  const toggleAlwaysOnTop = useCallback(async () => {
    if (window.__TAURI__) {
      const newValue = !(await window.__TAURI__?.window?.appWindow?.isAlwaysOnTop());
      await window.__TAURI__?.window?.appWindow?.setAlwaysOnTop(newValue);
      setIsAlwaysOnTop(newValue);
    }
  }, []);

  return (
    <div className="desktop-app min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* 标题栏 */}
      <div 
        data-tauri-drag-region 
        className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">FocusFlow</h1>
          <div className="flex space-x-2">
            <button 
              onClick={() => setCurrentView('timer')}
              className={`px-3 py-1 rounded ${currentView === 'timer' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              计时器
            </button>
            <button 
              onClick={() => setCurrentView('stats')}
              className={`px-3 py-1 rounded ${currentView === 'stats' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              统计
            </button>
            <button 
              onClick={() => setCurrentView('settings')}
              className={`px-3 py-1 rounded ${currentView === 'settings' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              设置
            </button>
            <button 
              onClick={() => setCurrentView('worldclock')}
              className={`px-3 py-1 rounded ${currentView === 'worldclock' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              世界时钟
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="切换主题"
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
          
          <button 
            onClick={handleMinimize}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="最小化"
          >
            −
          </button>
          
          <button 
            onClick={handleMaximize}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="最大化"
          >
            □
          </button>
          
          <button 
            onClick={toggleAlwaysOnTop}
            className={`p-2 rounded ${isAlwaysOnTop ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            title="置顶"
          >
            ⊤
          </button>
          
          <button 
            onClick={handleClose}
            className="p-2 rounded hover:bg-red-500 hover:text-white"
            title="关闭"
          >
            ×
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="p-4">
        {currentView === 'timer' && (
          <div className="max-w-4xl mx-auto">
            <TimerDisplay 
              time={timeLeft}
              formattedTime={formattedTime}
              currentState={currentState as 'focus' | 'break' | 'microBreak'}
              progress={progress}
            />
            <AIRecommendations />
          </div>
        )}
        
        {currentView === 'stats' && (
          <div className="max-w-6xl mx-auto">
            <Stats />
          </div>
        )}
        
        {currentView === 'settings' && (
          <div className="max-w-4xl mx-auto">
            <Settings 
              settings={useUnifiedTimerStore.getState().settings}
              onSettingsChange={useUnifiedTimerStore.getState().updateSettings}
            />
          </div>
        )}
        
        {currentView === 'worldclock' && (
          <div className="max-w-4xl mx-auto">
            <WorldClock />
          </div>
        )}
      </div>
    </div>
  );
};