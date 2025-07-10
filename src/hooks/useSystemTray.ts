import { useEffect, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';
import { appWindow } from '@tauri-apps/api/window';

interface SystemTrayHookOptions {
  onFocusMode?: () => void;
  onBreakMode?: () => void;
  onShow?: () => void;
  onHide?: () => void;
}

/**
 * 系统托盘集成 Hook
 * 处理来自系统托盘的事件和窗口管理
 */
export const useSystemTray = (options: SystemTrayHookOptions = {}) => {
  const { onFocusMode, onBreakMode, onShow, onHide } = options;

  // 处理托盘菜单事件
  useEffect(() => {
    const unlistenTimerMode = listen('timer-mode-change', (event) => {
      const mode = event.payload as string;
      
      switch (mode) {
        case 'focus':
          onFocusMode?.();
          break;
        case 'break':
          onBreakMode?.();
          break;
      }
    });

    return () => {
      unlistenTimerMode.then(fn => fn());
    };
  }, [onFocusMode, onBreakMode]);

  // 窗口显示/隐藏控制
  const showWindow = useCallback(async () => {
    try {
      await appWindow.show();
      await appWindow.setFocus();
      onShow?.();
    } catch (error) {
      console.error('Failed to show window:', error);
    }
  }, [onShow]);

  const hideWindow = useCallback(async () => {
    try {
      await appWindow.hide();
      onHide?.();
    } catch (error) {
      console.error('Failed to hide window:', error);
    }
  }, [onHide]);

  const toggleWindow = useCallback(async () => {
    try {
      const isVisible = await appWindow.isVisible();
      if (isVisible) {
        await hideWindow();
      } else {
        await showWindow();
      }
    } catch (error) {
      console.error('Failed to toggle window:', error);
    }
  }, [showWindow, hideWindow]);

  // 最小化到托盘
  const minimizeToTray = useCallback(async () => {
    try {
      await appWindow.hide();
    } catch (error) {
      console.error('Failed to minimize to tray:', error);
    }
  }, []);

  // 检查窗口状态
  const getWindowState = useCallback(async () => {
    try {
      const [isVisible, isFocused, isMinimized] = await Promise.all([
        appWindow.isVisible(),
        appWindow.isFocused(),
        appWindow.isMinimized()
      ]);

      return {
        isVisible,
        isFocused,
        isMinimized,
        isInTray: !isVisible
      };
    } catch (error) {
      console.error('Failed to get window state:', error);
      return {
        isVisible: false,
        isFocused: false,
        isMinimized: false,
        isInTray: true
      };
    }
  }, []);

  return {
    showWindow,
    hideWindow,
    toggleWindow,
    minimizeToTray,
    getWindowState
  };
};
