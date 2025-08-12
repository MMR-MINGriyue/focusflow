/**
 * 桌面环境适配器实现
 * 处理桌面环境（Tauri）下的特定功能
 */

import { EnvironmentAdapter } from './EnvironmentAdapter';

export class DesktopAdapter implements EnvironmentAdapter {
  private tauri: any;

  constructor() {
    // 获取Tauri API
    this.tauri = (window as any).__TAURI__;
  }

  getName(): string {
    return 'desktop';
  }

  supportsNotifications(): boolean {
    return !!this.tauri?.notification;
  }

  supportsSystemTray(): boolean {
    return !!this.tauri?.window;
  }

  supportsBackgroundOperation(): boolean {
    return true; // 桌面应用默认支持后台运行
  }

  async showNotification(title: string, body: string): Promise<void> {
    if (this.tauri?.notification) {
      try {
        // 使用Tauri通知API
        await this.tauri.notification.sendNotification({
          title,
          body,
          icon: 'public/icon.png'
        });
      } catch (error) {
        console.error('Failed to show notification:', error);
      }
    } else {
      // 回退到浏览器通知
      if ('Notification' in window) {
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }

        if (Notification.permission === 'granted') {
          new Notification(title, { body });
        }
      }
    }
  }

  async minimizeToTray(): Promise<void> {
    if (this.tauri?.window) {
      try {
        // 使用Tauri窗口API隐藏到系统托盘
        await this.tauri.window.hide();
      } catch (error) {
        console.error('Failed to minimize to tray:', error);
      }
    } else {
      throw new Error('Tauri window API not available');
    }
  }

  async restoreFromTray(): Promise<void> {
    if (this.tauri?.window) {
      try {
        // 使用Tauri窗口API从系统托盘恢复
        await this.tauri.window.show();
        await this.tauri.window.setFocus();
      } catch (error) {
        console.error('Failed to restore from tray:', error);
      }
    } else {
      throw new Error('Tauri window API not available');
    }
  }

  getPlatformInfo() {
    return {
      isDesktop: true,
      isWeb: false,
      platform: 'tauri',
      version: this.tauri?.app?.getVersion() || 'unknown'
    };
  }
}
