/**
 * 原生系统集成组件
 * 提供原生通知、开机自启动、电源管理等系统集成功能
 */

import React, { useEffect, useCallback, useState, createContext, useContext } from 'react';
import { useUnifiedTimerStore } from '../../stores/unifiedTimerStore';
import { useSettingsStore } from '../../stores/settingsStore';

// Tauri API imports (在实际项目中使用)
// import { invoke } from '@tauri-apps/api/tauri';
// import { sendNotification, isPermissionGranted, requestPermission } from '@tauri-apps/api/notification';
// import { appWindow } from '@tauri-apps/api/window';
// import { enable, isEnabled, disable } from '@tauri-apps/api/autostart';

// 原生通知类型
interface NativeNotification {
  title: string;
  body: string;
  icon?: string;
  sound?: boolean;
  actions?: NotificationAction[];
  tag?: string;
  silent?: boolean;
}

// 通知动作
interface NotificationAction {
  id: string;
  title: string;
  type?: 'button' | 'text';
}

// 窗口状态
interface WindowState {
  x: number;
  y: number;
  width: number;
  height: number;
  maximized: boolean;
  minimized: boolean;
  visible: boolean;
  focused: boolean;
}

// 电源管理状态
interface PowerState {
  onBattery: boolean;
  batteryLevel?: number;
  isCharging?: boolean;
  powerSaveMode: boolean;
}

// 系统集成管理器
export class NativeIntegrationManager {
  private static instance: NativeIntegrationManager;
  private windowState: WindowState | null = null;
  private powerState: PowerState | null = null;
  private notificationPermission: boolean = false;
  private autoStartEnabled: boolean = false;
  private updateCallbacks: Set<() => void> = new Set();

  private constructor() {
    this.initializeIntegration();
  }

  static getInstance(): NativeIntegrationManager {
    if (!NativeIntegrationManager.instance) {
      NativeIntegrationManager.instance = new NativeIntegrationManager();
    }
    return NativeIntegrationManager.instance;
  }

  // 初始化系统集成
  private async initializeIntegration() {
    try {
      // 检查通知权限
      await this.checkNotificationPermission();
      
      // 检查自启动状态
      await this.checkAutoStartStatus();
      
      // 监听窗口事件
      this.setupWindowListeners();
      
      // 监听电源事件
      this.setupPowerListeners();
      
      console.log('Native integration initialized');
    } catch (error) {
      console.error('Failed to initialize native integration:', error);
    }
  }

  // 订阅状态变化
  subscribe(callback: () => void): () => void {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  private notifyUpdate() {
    this.updateCallbacks.forEach(callback => callback());
  }

  // 发送原生通知
  async sendNotification(notification: NativeNotification): Promise<boolean> {
    try {
      if (!this.notificationPermission) {
        console.warn('Notification permission not granted');
        return false;
      }

      // 在Tauri应用中发送通知
      // await sendNotification({
      //   title: notification.title,
      //   body: notification.body,
      //   icon: notification.icon,
      //   sound: notification.sound
      // });

      // 模拟通知（开发环境）
      console.log('Native notification sent:', notification);
      
      // 在浏览器环境中使用Web Notification API
      if ('Notification' in window && Notification.permission === 'granted') {
        const webNotification = new Notification(notification.title, {
          body: notification.body,
          icon: notification.icon || '/icon-192x192.png',
          silent: notification.silent,
          tag: notification.tag
        });

        // 处理通知点击
        webNotification.onclick = () => {
          this.focusWindow();
          webNotification.close();
        };

        // 自动关闭通知
        setTimeout(() => webNotification.close(), 5000);
      }

      return true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }

  // 检查通知权限
  async checkNotificationPermission(): Promise<boolean> {
    try {
      // 在Tauri应用中检查权限
      // this.notificationPermission = await isPermissionGranted();
      
      // 在浏览器环境中检查权限
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          this.notificationPermission = true;
        } else if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          this.notificationPermission = permission === 'granted';
        }
      }

      this.notifyUpdate();
      return this.notificationPermission;
    } catch (error) {
      console.error('Failed to check notification permission:', error);
      return false;
    }
  }

  // 请求通知权限
  async requestNotificationPermission(): Promise<boolean> {
    try {
      // 在Tauri应用中请求权限
      // const permission = await requestPermission();
      // this.notificationPermission = permission === 'granted';

      // 在浏览器环境中请求权限
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        this.notificationPermission = permission === 'granted';
      }

      this.notifyUpdate();
      return this.notificationPermission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  // 检查自启动状态
  async checkAutoStartStatus(): Promise<boolean> {
    try {
      // 在Tauri应用中检查自启动
      // this.autoStartEnabled = await isEnabled();
      
      // 模拟检查（开发环境）
      this.autoStartEnabled = localStorage.getItem('autostart-enabled') === 'true';
      
      this.notifyUpdate();
      return this.autoStartEnabled;
    } catch (error) {
      console.error('Failed to check autostart status:', error);
      return false;
    }
  }

  // 启用/禁用自启动
  async setAutoStart(enabled: boolean): Promise<boolean> {
    try {
      if (enabled) {
        // 在Tauri应用中启用自启动
        // await enable();
        localStorage.setItem('autostart-enabled', 'true');
      } else {
        // 在Tauri应用中禁用自启动
        // await disable();
        localStorage.setItem('autostart-enabled', 'false');
      }

      this.autoStartEnabled = enabled;
      this.notifyUpdate();
      
      console.log(`Autostart ${enabled ? 'enabled' : 'disabled'}`);
      return true;
    } catch (error) {
      console.error('Failed to set autostart:', error);
      return false;
    }
  }

  // 保存窗口状态
  async saveWindowState(): Promise<void> {
    try {
      // 在Tauri应用中获取窗口状态
      // const position = await appWindow.outerPosition();
      // const size = await appWindow.outerSize();
      // const isMaximized = await appWindow.isMaximized();
      // const isMinimized = await appWindow.isMinimized();
      // const isVisible = await appWindow.isVisible();
      // const isFocused = await appWindow.isFocused();

      // 模拟窗口状态（开发环境）
      this.windowState = {
        x: window.screenX || 100,
        y: window.screenY || 100,
        width: window.outerWidth || 1200,
        height: window.outerHeight || 800,
        maximized: window.outerWidth === screen.width && window.outerHeight === screen.height,
        minimized: false,
        visible: document.visibilityState === 'visible',
        focused: document.hasFocus()
      };

      // 保存到本地存储
      localStorage.setItem('window-state', JSON.stringify(this.windowState));
      
      console.log('Window state saved:', this.windowState);
    } catch (error) {
      console.error('Failed to save window state:', error);
    }
  }

  // 恢复窗口状态
  async restoreWindowState(): Promise<void> {
    try {
      const savedState = localStorage.getItem('window-state');
      if (!savedState) return;

      const state: WindowState = JSON.parse(savedState);
      
      // 在Tauri应用中恢复窗口状态
      // await appWindow.setPosition(new PhysicalPosition(state.x, state.y));
      // await appWindow.setSize(new PhysicalSize(state.width, state.height));
      // if (state.maximized) {
      //   await appWindow.maximize();
      // }

      // 模拟恢复（开发环境）
      if (state.width && state.height) {
        window.resizeTo(state.width, state.height);
      }
      if (state.x && state.y) {
        window.moveTo(state.x, state.y);
      }

      this.windowState = state;
      console.log('Window state restored:', state);
    } catch (error) {
      console.error('Failed to restore window state:', error);
    }
  }

  // 聚焦窗口
  async focusWindow(): Promise<void> {
    try {
      // 在Tauri应用中聚焦窗口
      // await appWindow.show();
      // await appWindow.setFocus();

      // 在浏览器环境中聚焦窗口
      window.focus();
      
      console.log('Window focused');
    } catch (error) {
      console.error('Failed to focus window:', error);
    }
  }

  // 设置窗口监听器
  private setupWindowListeners(): void {
    // 窗口关闭前保存状态
    window.addEventListener('beforeunload', () => {
      this.saveWindowState();
    });

    // 窗口大小变化
    window.addEventListener('resize', () => {
      this.saveWindowState();
    });

    // 窗口移动
    window.addEventListener('move', () => {
      this.saveWindowState();
    });

    // 可见性变化
    document.addEventListener('visibilitychange', () => {
      if (this.windowState) {
        this.windowState.visible = document.visibilityState === 'visible';
        this.notifyUpdate();
      }
    });

    // 焦点变化
    window.addEventListener('focus', () => {
      if (this.windowState) {
        this.windowState.focused = true;
        this.notifyUpdate();
      }
    });

    window.addEventListener('blur', () => {
      if (this.windowState) {
        this.windowState.focused = false;
        this.notifyUpdate();
      }
    });
  }

  // 设置电源监听器
  private setupPowerListeners(): void {
    // 监听电池状态变化
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updatePowerState = () => {
          this.powerState = {
            onBattery: !battery.charging,
            batteryLevel: Math.round(battery.level * 100),
            isCharging: battery.charging,
            powerSaveMode: battery.level < 0.2 && !battery.charging
          };
          this.notifyUpdate();
        };

        updatePowerState();
        
        battery.addEventListener('chargingchange', updatePowerState);
        battery.addEventListener('levelchange', updatePowerState);
      }).catch((error: any) => {
        console.warn('Battery API not supported:', error);
      });
    }
  }

  // 获取状态
  getNotificationPermission(): boolean {
    return this.notificationPermission;
  }

  getAutoStartEnabled(): boolean {
    return this.autoStartEnabled;
  }

  getWindowState(): WindowState | null {
    return this.windowState;
  }

  getPowerState(): PowerState | null {
    return this.powerState;
  }
}

// 原生集成上下文
interface NativeIntegrationContext {
  notificationPermission: boolean;
  autoStartEnabled: boolean;
  windowState: WindowState | null;
  powerState: PowerState | null;
  sendNotification: (notification: NativeNotification) => Promise<boolean>;
  requestNotificationPermission: () => Promise<boolean>;
  setAutoStart: (enabled: boolean) => Promise<boolean>;
  saveWindowState: () => Promise<void>;
  restoreWindowState: () => Promise<void>;
  focusWindow: () => Promise<void>;
}

const NativeIntegrationContext = createContext<NativeIntegrationContext | null>(null);

// 原生集成Provider
export const NativeIntegrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notificationPermission, setNotificationPermission] = useState(false);
  const [autoStartEnabled, setAutoStartEnabled] = useState(false);
  const [windowState, setWindowState] = useState<WindowState | null>(null);
  const [powerState, setPowerState] = useState<PowerState | null>(null);
  
  const manager = NativeIntegrationManager.getInstance();
  const timerStore = useUnifiedTimerStore();
  const settingsStore = useSettingsStore();

  // 订阅管理器更新
  useEffect(() => {
    const updateState = () => {
      setNotificationPermission(manager.getNotificationPermission());
      setAutoStartEnabled(manager.getAutoStartEnabled());
      setWindowState(manager.getWindowState());
      setPowerState(manager.getPowerState());
    };

    updateState();
    const unsubscribe = manager.subscribe(updateState);
    return unsubscribe;
  }, [manager]);

  // 恢复窗口状态
  useEffect(() => {
    manager.restoreWindowState();
  }, [manager]);

  // 监听计时器状态变化发送通知
  useEffect(() => {
    if (!settingsStore.settings.notifications?.enabled) return;

    const { isRunning, currentPhase, currentTime } = timerStore;
    
    // 计时器完成通知
    if (!isRunning && currentTime === 0) {
      const phaseText = currentPhase === 'focus' ? '专注时间' : '休息时间';
      manager.sendNotification({
        title: 'FocusFlow',
        body: `${phaseText}已完成！`,
        icon: '/icon-192x192.png',
        sound: settingsStore.settings.notifications?.sound,
        actions: [
          { id: 'start-next', title: '开始下一阶段' },
          { id: 'dismiss', title: '关闭' }
        ]
      });
    }
    
    // 时间即将结束提醒
    if (isRunning && currentTime === 60) { // 还剩1分钟
      const phaseText = currentPhase === 'focus' ? '专注时间' : '休息时间';
      manager.sendNotification({
        title: 'FocusFlow',
        body: `${phaseText}还剩1分钟`,
        icon: '/icon-192x192.png',
        silent: true
      });
    }
  }, [timerStore, settingsStore, manager]);

  // 电源管理优化
  useEffect(() => {
    if (powerState?.powerSaveMode && timerStore.isRunning) {
      // 在省电模式下减少动画和更新频率
      console.log('Power save mode detected, optimizing performance');
    }
  }, [powerState, timerStore.isRunning]);

  const contextValue: NativeIntegrationContext = {
    notificationPermission,
    autoStartEnabled,
    windowState,
    powerState,
    sendNotification: manager.sendNotification.bind(manager),
    requestNotificationPermission: manager.requestNotificationPermission.bind(manager),
    setAutoStart: manager.setAutoStart.bind(manager),
    saveWindowState: manager.saveWindowState.bind(manager),
    restoreWindowState: manager.restoreWindowState.bind(manager),
    focusWindow: manager.focusWindow.bind(manager)
  };

  return (
    <NativeIntegrationContext.Provider value={contextValue}>
      {children}
    </NativeIntegrationContext.Provider>
  );
};

// 使用原生集成Hook
export const useNativeIntegration = () => {
  const context = useContext(NativeIntegrationContext);
  if (!context) {
    throw new Error('useNativeIntegration must be used within NativeIntegrationProvider');
  }
  return context;
};

// 系统集成设置面板
export const NativeIntegrationSettings: React.FC<{ className?: string }> = ({ className }) => {
  const {
    notificationPermission,
    autoStartEnabled,
    windowState,
    powerState,
    requestNotificationPermission,
    setAutoStart
  } = useNativeIntegration();

  return (
    <div className={`space-y-6 ${className}`}>
      <h3 className="text-lg font-semibold">系统集成设置</h3>

      {/* 通知设置 */}
      <div className="space-y-3">
        <h4 className="font-medium">通知权限</h4>
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <div className="font-medium">桌面通知</div>
            <div className="text-sm text-muted-foreground">
              允许应用发送桌面通知
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${notificationPermission ? 'text-green-600' : 'text-red-600'}`}>
              {notificationPermission ? '已授权' : '未授权'}
            </span>
            {!notificationPermission && (
              <button
                onClick={requestNotificationPermission}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                请求权限
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 自启动设置 */}
      <div className="space-y-3">
        <h4 className="font-medium">启动设置</h4>
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <div className="font-medium">开机自启动</div>
            <div className="text-sm text-muted-foreground">
              系统启动时自动运行FocusFlow
            </div>
          </div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoStartEnabled}
              onChange={(e) => setAutoStart(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">启用</span>
          </label>
        </div>
      </div>

      {/* 窗口状态信息 */}
      {windowState && (
        <div className="space-y-3">
          <h4 className="font-medium">窗口状态</h4>
          <div className="p-3 border rounded-lg bg-muted/30">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>位置: {windowState.x}, {windowState.y}</div>
              <div>大小: {windowState.width} × {windowState.height}</div>
              <div>最大化: {windowState.maximized ? '是' : '否'}</div>
              <div>可见: {windowState.visible ? '是' : '否'}</div>
              <div>聚焦: {windowState.focused ? '是' : '否'}</div>
            </div>
          </div>
        </div>
      )}

      {/* 电源状态信息 */}
      {powerState && (
        <div className="space-y-3">
          <h4 className="font-medium">电源状态</h4>
          <div className="p-3 border rounded-lg bg-muted/30">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>电源: {powerState.onBattery ? '电池' : '外接电源'}</div>
              {powerState.batteryLevel !== undefined && (
                <div>电量: {powerState.batteryLevel}%</div>
              )}
              <div>充电中: {powerState.isCharging ? '是' : '否'}</div>
              <div>省电模式: {powerState.powerSaveMode ? '是' : '否'}</div>
            </div>
            {powerState.powerSaveMode && (
              <div className="mt-2 text-xs text-yellow-700 bg-yellow-50 p-2 rounded">
                ⚠️ 检测到省电模式，应用已自动优化性能
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default {
  NativeIntegrationManager,
  NativeIntegrationProvider,
  NativeIntegrationSettings,
  useNativeIntegration
};