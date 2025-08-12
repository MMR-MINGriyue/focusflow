/**
 * 系统托盘集成组件
 * 提供系统托盘图标、菜单和状态管理
 */

import React, { useEffect, useCallback, useState } from 'react';
import { useUnifiedTimerStore } from '../../stores/unifiedTimerStore';
import { useSettingsStore } from '../../stores/settingsStore';

// Tauri API imports (在实际项目中使用)
// import { invoke } from '@tauri-apps/api/tauri';
// import { appWindow } from '@tauri-apps/api/window';
// import { Menu, MenuItem } from '@tauri-apps/api/menu';

// 托盘菜单项类型
interface TrayMenuItem {
  id: string;
  label: string;
  enabled?: boolean;
  checked?: boolean;
  submenu?: TrayMenuItem[];
  action?: () => void;
  separator?: boolean;
}

// 托盘状态类型
interface TrayState {
  isVisible: boolean;
  icon: string;
  tooltip: string;
  blinking: boolean;
}

// 系统托盘管理器
export class SystemTrayManager {
  private static instance: SystemTrayManager;
  private trayState: TrayState;
  private updateCallbacks: Set<(state: TrayState) => void> = new Set();

  private constructor() {
    this.trayState = {
      isVisible: true,
      icon: 'idle',
      tooltip: 'FocusFlow - 就绪',
      blinking: false
    };
  }

  static getInstance(): SystemTrayManager {
    if (!SystemTrayManager.instance) {
      SystemTrayManager.instance = new SystemTrayManager();
    }
    return SystemTrayManager.instance;
  }

  // 订阅状态变化
  subscribe(callback: (state: TrayState) => void): () => void {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  // 更新托盘状态
  private updateState(updates: Partial<TrayState>) {
    this.trayState = { ...this.trayState, ...updates };
    this.updateCallbacks.forEach(callback => callback(this.trayState));
    this.syncWithNativeTray();
  }

  // 设置托盘图标
  setIcon(icon: string) {
    this.updateState({ icon });
  }

  // 设置工具提示
  setTooltip(tooltip: string) {
    this.updateState({ tooltip });
  }

  // 设置闪烁状态
  setBlinking(blinking: boolean) {
    this.updateState({ blinking });
  }

  // 显示/隐藏托盘图标
  setVisible(visible: boolean) {
    this.updateState({ isVisible: visible });
  }

  // 同步到原生托盘（在实际项目中实现）
  private async syncWithNativeTray() {
    try {
      // 在Tauri应用中，这里会调用原生API
      // await invoke('update_tray_icon', { icon: this.trayState.icon });
      // await invoke('update_tray_tooltip', { tooltip: this.trayState.tooltip });
      
      console.log('Tray state updated:', this.trayState);
    } catch (error) {
      console.error('Failed to update system tray:', error);
    }
  }

  // 创建托盘菜单
  async createTrayMenu(menuItems: TrayMenuItem[]): Promise<void> {
    try {
      // 在Tauri应用中实现
      // const menu = await this.buildNativeMenu(menuItems);
      // await invoke('set_tray_menu', { menu });
      
      console.log('Tray menu created:', menuItems);
    } catch (error) {
      console.error('Failed to create tray menu:', error);
    }
  }

  // 构建原生菜单（在实际项目中实现）
  private async buildNativeMenu(items: TrayMenuItem[]): Promise<any> {
    // 这里会使用Tauri的Menu API构建原生菜单
    return items;
  }

  // 获取当前状态
  getState(): TrayState {
    return { ...this.trayState };
  }
}

// React Hook for system tray
export const useSystemTray = () => {
  const [trayState, setTrayState] = useState<TrayState>(() => 
    SystemTrayManager.getInstance().getState()
  );
  
  const trayManager = SystemTrayManager.getInstance();

  useEffect(() => {
    const unsubscribe = trayManager.subscribe(setTrayState);
    return unsubscribe;
  }, [trayManager]);

  const updateIcon = useCallback((icon: string) => {
    trayManager.setIcon(icon);
  }, [trayManager]);

  const updateTooltip = useCallback((tooltip: string) => {
    trayManager.setTooltip(tooltip);
  }, [trayManager]);

  const setBlinking = useCallback((blinking: boolean) => {
    trayManager.setBlinking(blinking);
  }, [trayManager]);

  const setVisible = useCallback((visible: boolean) => {
    trayManager.setVisible(visible);
  }, [trayManager]);

  const createMenu = useCallback((items: TrayMenuItem[]) => {
    return trayManager.createTrayMenu(items);
  }, [trayManager]);

  return {
    trayState,
    updateIcon,
    updateTooltip,
    setBlinking,
    setVisible,
    createMenu
  };
};

// 系统托盘集成组件
export const SystemTrayIntegration: React.FC = () => {
  const timerStore = useUnifiedTimerStore();
  const settingsStore = useSettingsStore();
  const { updateIcon, updateTooltip, setBlinking, createMenu } = useSystemTray();

  // 根据计时器状态更新托盘
  useEffect(() => {
    const { isRunning, isPaused, currentPhase, currentTime } = timerStore;
    
    let icon = 'idle';
    let tooltip = 'FocusFlow - 就绪';
    let shouldBlink = false;

    if (isRunning) {
      icon = currentPhase === 'focus' ? 'focus-active' : 'break-active';
      const minutes = Math.floor(currentTime / 60);
      const seconds = currentTime % 60;
      const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      tooltip = `FocusFlow - ${currentPhase === 'focus' ? '专注中' : '休息中'} (${timeStr})`;
    } else if (isPaused) {
      icon = 'paused';
      tooltip = 'FocusFlow - 已暂停';
    }

    // 时间即将结束时闪烁提醒
    if (isRunning && currentTime <= 60) {
      shouldBlink = true;
    }

    updateIcon(icon);
    updateTooltip(tooltip);
    setBlinking(shouldBlink);
  }, [timerStore, updateIcon, updateTooltip, setBlinking]);

  // 创建托盘菜单
  useEffect(() => {
    const menuItems: TrayMenuItem[] = [
      {
        id: 'show-window',
        label: '显示窗口',
        action: () => showMainWindow()
      },
      {
        id: 'separator-1',
        label: '',
        separator: true
      },
      {
        id: 'timer-control',
        label: timerStore.isRunning ? '暂停计时器' : '开始计时器',
        action: () => {
          if (timerStore.isRunning) {
            timerStore.pause?.();
          } else {
            timerStore.start?.();
          }
        }
      },
      {
        id: 'reset-timer',
        label: '重置计时器',
        enabled: !timerStore.isRunning,
        action: () => timerStore.reset?.()
      },
      {
        id: 'separator-2',
        label: '',
        separator: true
      },
      {
        id: 'quick-settings',
        label: '快速设置',
        submenu: [
          {
            id: 'focus-25',
            label: '25分钟专注',
            checked: settingsStore.settings.timer?.focusDuration === 1500,
            action: () => settingsStore.updateTimerSettings({ focusDuration: 1500 })
          },
          {
            id: 'focus-45',
            label: '45分钟专注',
            checked: settingsStore.settings.timer?.focusDuration === 2700,
            action: () => settingsStore.updateTimerSettings({ focusDuration: 2700 })
          },
          {
            id: 'focus-60',
            label: '60分钟专注',
            checked: settingsStore.settings.timer?.focusDuration === 3600,
            action: () => settingsStore.updateTimerSettings({ focusDuration: 3600 })
          }
        ]
      },
      {
        id: 'notifications',
        label: '通知',
        checked: settingsStore.settings.notifications?.enabled,
        action: () => settingsStore.updateNotificationSettings({
          enabled: !settingsStore.settings.notifications?.enabled
        })
      },
      {
        id: 'separator-3',
        label: '',
        separator: true
      },
      {
        id: 'settings',
        label: '设置',
        action: () => openSettings()
      },
      {
        id: 'about',
        label: '关于',
        action: () => showAbout()
      },
      {
        id: 'separator-4',
        label: '',
        separator: true
      },
      {
        id: 'quit',
        label: '退出',
        action: () => quitApplication()
      }
    ];

    createMenu(menuItems);
  }, [timerStore, settingsStore, createMenu]);

  // 窗口管理函数
  const showMainWindow = useCallback(async () => {
    try {
      // 在Tauri应用中实现
      // await appWindow.show();
      // await appWindow.setFocus();
      console.log('Showing main window');
    } catch (error) {
      console.error('Failed to show main window:', error);
    }
  }, []);

  const openSettings = useCallback(async () => {
    try {
      // 显示主窗口并导航到设置页面
      await showMainWindow();
      // 这里可以触发路由导航到设置页面
      window.location.hash = '#/settings';
    } catch (error) {
      console.error('Failed to open settings:', error);
    }
  }, [showMainWindow]);

  const showAbout = useCallback(async () => {
    try {
      // 显示关于对话框
      // await invoke('show_about_dialog');
      console.log('Showing about dialog');
    } catch (error) {
      console.error('Failed to show about dialog:', error);
    }
  }, []);

  const quitApplication = useCallback(async () => {
    try {
      // 退出应用
      // await invoke('quit_app');
      console.log('Quitting application');
    } catch (error) {
      console.error('Failed to quit application:', error);
    }
  }, []);

  // 这个组件不渲染任何UI，只负责托盘集成逻辑
  return null;
};

// 托盘状态指示器组件（用于开发和调试）
export const TrayStatusIndicator: React.FC<{ className?: string }> = ({ className }) => {
  const { trayState } = useSystemTray();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className={`fixed bottom-4 left-4 p-3 bg-black/80 text-white rounded-lg text-xs ${className}`}>
      <div className="font-bold mb-1">系统托盘状态</div>
      <div>图标: {trayState.icon}</div>
      <div>提示: {trayState.tooltip}</div>
      <div>可见: {trayState.isVisible ? '是' : '否'}</div>
      <div>闪烁: {trayState.blinking ? '是' : '否'}</div>
    </div>
  );
};

// 窗口最小化到托盘的Hook
export const useMinimizeToTray = () => {
  const settingsStore = useSettingsStore();

  const minimizeToTray = useCallback(async () => {
    try {
      // 检查是否启用了最小化到托盘
      if (settingsStore.settings.ui?.minimizeToTray) {
        // 在Tauri应用中实现
        // await appWindow.hide();
        console.log('Minimized to tray');
      } else {
        // 正常最小化
        // await appWindow.minimize();
        console.log('Minimized to taskbar');
      }
    } catch (error) {
      console.error('Failed to minimize window:', error);
    }
  }, [settingsStore.settings.ui?.minimizeToTray]);

  // 监听窗口关闭事件
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (settingsStore.settings.ui?.minimizeToTray) {
        event.preventDefault();
        minimizeToTray();
        return false;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [minimizeToTray, settingsStore.settings.ui?.minimizeToTray]);

  return { minimizeToTray };
};

export default {
  SystemTrayManager,
  SystemTrayIntegration,
  TrayStatusIndicator,
  useSystemTray,
  useMinimizeToTray
};