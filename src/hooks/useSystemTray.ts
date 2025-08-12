import { useEffect, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';
import { appWindow } from '@tauri-apps/api/window';
import { isTauriEnvironment, safeTauriCall } from '../utils/environment';

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
    if (!isTauriEnvironment()) {
      return; // 非Tauri环境不监听托盘事件
    }

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
    if (!isTauriEnvironment()) {
      return;
    }
    
    await safeTauriCall(
      async () => {
        await appWindow.show();
        await appWindow.setFocus();
        onShow?.();
      },
      undefined,
      { silent: true }
    );
  }, [onShow]);

  const hideWindow = useCallback(async () => {
    if (!isTauriEnvironment()) {
      return;
    }
    
    await safeTauriCall(
      async () => {
        await appWindow.hide();
        onHide?.();
      },
      undefined,
      { silent: true }
    );
  }, [onHide]);

  const toggleWindow = useCallback(async () => {
    if (!isTauriEnvironment()) {
      return;
    }
    
    await safeTauriCall(
      async () => {
        const isVisible = await appWindow.isVisible();
        if (isVisible) {
          await hideWindow();
        } else {
          await showWindow();
        }
      },
      undefined,
      { silent: true }
    );
  }, [showWindow, hideWindow]);

  // 最小化到托盘
  const minimizeToTray = useCallback(async () => {
    if (!isTauriEnvironment()) {
      return;
    }
    
    await safeTauriCall(
      () => appWindow.hide(),
      undefined,
      { silent: true }
    );
  }, []);

  // 检查窗口状态
  const getWindowState = useCallback(async () => {
    if (!isTauriEnvironment()) {
      return {
        isVisible: true,
        isFocused: true,
        isMinimized: false,
        isInTray: false
      };
    }
    
    const result = await safeTauriCall(
      async () => {
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
      },
      {
        isVisible: true,
        isFocused: true,
        isMinimized: false,
        isInTray: false
      },
      { silent: true }
    );
    
    return result || {
      isVisible: true,
      isFocused: true,
      isMinimized: false,
      isInTray: false
    };
  }, []);

  return {
    showWindow,
    hideWindow,
    toggleWindow,
    minimizeToTray,
    getWindowState
  };
};
