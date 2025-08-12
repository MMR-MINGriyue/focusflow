/**
 * 通知服务实现
 * 处理应用通知功能
 */

import { INotificationService } from './ServiceInterfaces';

export class NotificationService implements INotificationService {
  private initialized = false;
  private permission: NotificationPermission = 'default';
  private scheduledNotifications: Map<string, number> = new Map();

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 检查是否支持通知
      if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        this.initialized = true;
        return;
      }

      // 获取当前权限
      this.permission = Notification.permission;

      this.initialized = true;
      console.log('Notification service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      throw error;
    }
  }

  async sendNotification(title: string, body: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // 如果权限尚未确定，请求权限
      if (this.permission === 'default') {
        await this.requestPermission();
      }

      // 如果权限被拒绝，不显示通知
      if (this.permission !== 'granted') {
        console.warn('Notification permission denied');
        return;
      }

      // 创建通知
      const notification = new Notification(title, {
        body,
        icon: '/public/icon.png',
        badge: '/public/badge.png',
        tag: 'focusflow-notification',
        renotify: false,
        silent: false
      });

      // 点击通知时关闭
      notification.onclick = () => {
        notification.close();
        window.focus();
      };

      // 5秒后自动关闭
      setTimeout(() => {
        notification.close();
      }, 5000);

      console.log('Notification sent:', title, body);
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      if (!('Notification' in window)) {
        return false;
      }

      const permission = await Notification.requestPermission();
      this.permission = permission;

      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  hasPermission(): boolean {
    return this.permission === 'granted';
  }

  async scheduleNotification(title: string, body: string, delayMs: number): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // 如果权限尚未确定，请求权限
      if (this.permission === 'default') {
        await this.requestPermission();
      }

      // 如果权限被拒绝，不安排通知
      if (this.permission !== 'granted') {
        console.warn('Notification permission denied, cannot schedule notification');
        return;
      }

      // 生成唯一ID
      const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // 安排通知
      const timeoutId = window.setTimeout(async () => {
        try {
          await this.sendNotification(title, body);
          this.scheduledNotifications.delete(id);
        } catch (error) {
          console.error('Failed to send scheduled notification:', error);
        }
      }, delayMs);

      // 保存超时ID以便取消
      this.scheduledNotifications.set(id, timeoutId);

      console.log(`Scheduled notification ${id} in ${delayMs}ms`);
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      throw error;
    }
  }

  async cancelAllNotifications(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // 取消所有安排的通知
      for (const [id, timeoutId] of this.scheduledNotifications) {
        clearTimeout(timeoutId);
        console.log(`Cancelled scheduled notification ${id}`);
      }

      // 清空映射
      this.scheduledNotifications.clear();

      // 关闭所有显示中的通知
      if ('Notification' in window) {
        Notification.getNotifications().then(notifications => {
          notifications.forEach(notification => notification.close());
        });
      }
    } catch (error) {
      console.error('Failed to cancel notifications:', error);
      throw error;
    }
  }

  /**
   * 取消特定的安排通知
   */
  async cancelScheduledNotification(id: string): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const timeoutId = this.scheduledNotifications.get(id);
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.scheduledNotifications.delete(id);
        console.log(`Cancelled scheduled notification ${id}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to cancel scheduled notification ${id}:`, error);
      return false;
    }
  }

  /**
   * 获取通知权限状态
   */
  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }

  /**
   * 获取已安排的通知数量
   */
  getScheduledNotificationsCount(): number {
    return this.scheduledNotifications.size;
  }
}
