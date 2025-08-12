/**
 * Web环境适配器实现
 * 处理Web环境下的特定功能
 */

import { EnvironmentAdapter } from './EnvironmentAdapter';

export class WebAdapter implements EnvironmentAdapter {
  getName(): string {
    return 'web';
  }

  supportsNotifications(): boolean {
    return 'Notification' in window;
  }

  supportsSystemTray(): boolean {
    return false;
  }

  supportsBackgroundOperation(): boolean {
    return 'serviceWorker' in navigator;
  }

  async showNotification(title: string, body: string): Promise<void> {
    if ('Notification' in window) {
      // 请求通知权限（如果尚未授权）
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      // 如果已授权，显示通知
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      }
    }
  }

  async minimizeToTray(): Promise<void> {
    throw new Error('Web environment does not support system tray');
  }

  async restoreFromTray(): Promise<void> {
    throw new Error('Web environment does not support system tray');
  }

  getPlatformInfo() {
    return {
      isDesktop: false,
      isWeb: true,
      platform: navigator.platform,
      version: navigator.userAgent
    };
  }
}
