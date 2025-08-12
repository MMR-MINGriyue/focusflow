import React from 'react';
import ReactDOM from 'react-dom/client';
import DesktopApp from './DesktopApp';
import { systemTrayService } from '../services/SystemTrayService';
import ErrorBoundary from '../components/ErrorBoundary';
import './desktop.css';

/**
 * 桌面应用入口
 * 初始化桌面应用和系统服务
 */

// 初始化系统托盘
async function initializeSystemTray() {
  try {
    await systemTrayService.initialize();
    console.log('System tray initialized');
  } catch (error) {
    console.error('Failed to initialize system tray:', error);
  }
}

// 初始化应用
function initializeApp() {
  const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
  );

  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <DesktopApp />
      </ErrorBoundary>
    </React.StrictMode>
  );

  // 初始化系统托盘
  initializeSystemTray();

  // 监听主题变化
  const handleThemeChange = (event: MediaQueryListEvent) => {
    if (localStorage.getItem('theme') === 'system') {
      document.documentElement.classList.toggle('dark', event.matches);
    }
  };

  // 初始主题设置
  const savedTheme = localStorage.getItem('theme') || 'system';
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (savedTheme === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    // 系统主题
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    document.documentElement.classList.toggle('dark', prefersDark.matches);
    prefersDark.addEventListener('change', handleThemeChange);
  }

  // 监听来自系统托盘的事件
  if (window.__TAURI__) {
    import('@tauri-apps/api/event').then(({ listen }) => {
      // 监听显示通知事件
      listen('show-notification', (event) => {
        const { title, body } = event.payload as { title: string; body: string };
        if ('Notification' in window) {
          new Notification(title, {
            body,
            icon: '/icons/icon.png',
            silent: false,
          });
        }
      });

      // 监听主题变更事件
      listen('tray-theme-change', (event) => {
        const { theme } = event.payload as { theme: string };
        localStorage.setItem('theme', theme);

        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (theme === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          // 系统主题
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
          document.documentElement.classList.toggle('dark', prefersDark.matches);
        }
      });
    });
  }

  // 请求通知权限
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  console.log('Desktop app initialized');
}

// 当 DOM 加载完成后初始化应用
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// 导出系统托盘服务，以便在其他地方使用
export { systemTrayService };
