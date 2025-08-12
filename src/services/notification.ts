import { sendNotification, requestPermission, isPermissionGranted } from '@tauri-apps/api/notification';
import { isTauriEnvironment, safeTauriCall } from '../utils/environment';

export interface NotificationOptions {
  icon?: string;
  sound?: string;
  tag?: string;
  silent?: boolean;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  scheduledTime: number;
  options: NotificationOptions;
  timeoutId: NodeJS.Timeout;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  options: NotificationOptions;
}

class NotificationService {
  private scheduledNotifications = new Map<string, ScheduledNotification>();
  private templates = new Map<string, NotificationTemplate>();
  private permissionStatus: 'granted' | 'denied' | 'default' | null = null;
  private listeners: Array<(notification: { title: string; body: string; options: NotificationOptions }) => void> = [];

  constructor() {
    this.initializeDefaultTemplates();
    // 延迟初始化权限检查，避免构造函数中的异步调用
    if (isTauriEnvironment()) {
      this.checkInitialPermission().catch(error => {
        console.error('Failed to check initial permission:', error);
        this.permissionStatus = 'default';
      });
    } else {
      this.permissionStatus = 'granted'; // 浏览器环境默认允许
    }
  }

  /**
   * 初始化默认通知模板
   */
  private initializeDefaultTemplates(): void {
    const defaultTemplates: NotificationTemplate[] = [
      {
        id: 'focus-start',
        name: '专注开始',
        title: '🎯 开始专注',
        body: '现在开始专注时间，保持专注！',
        options: { icon: 'focus-icon.png', sound: 'focus-start.wav' }
      },
      {
        id: 'focus-end',
        name: '专注结束',
        title: '✅ 专注完成',
        body: '恭喜！您已完成一个专注时段',
        options: { icon: 'success-icon.png', sound: 'success.wav' }
      },
      {
        id: 'break-start',
        name: '休息开始',
        title: '☕ 休息时间',
        body: '该休息一下了，放松身心',
        options: { icon: 'break-icon.png', sound: 'break-start.wav' }
      },
      {
        id: 'break-end',
        name: '休息结束',
        title: '⏰ 休息结束',
        body: '休息时间结束，准备继续专注',
        options: { icon: 'timer-icon.png', sound: 'timer-end.wav' }
      },
      {
        id: 'micro-break',
        name: '微休息',
        title: '🌱 微休息提醒',
        body: '稍作休息，活动一下身体',
        options: { icon: 'micro-break-icon.png', sound: 'gentle-chime.wav' }
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * 检查初始权限状态
   */
  private async checkInitialPermission(): Promise<void> {
    if (!isTauriEnvironment()) {
      this.permissionStatus = 'granted'; // 浏览器环境默认允许
      return;
    }

    try {
      const granted = await safeTauriCall(() => isPermissionGranted(), false);
      this.permissionStatus = granted ? 'granted' : 'default';
    } catch (error) {
      console.error('Failed to check initial permission:', error);
      this.permissionStatus = 'default';
    }
  }

  /**
   * 检查通知权限
   */
  async checkPermission(): Promise<boolean> {
    // 非Tauri环境直接返回true
    if (!isTauriEnvironment()) {
      return true;
    }

    try {
      // 如果已经有缓存的权限状态且为granted，直接返回
      if (this.permissionStatus === 'granted') {
        return true;
      }

      // 如果已经被拒绝，也直接返回
      if (this.permissionStatus === 'denied') {
        return false;
      }

      const permissionState = await safeTauriCall(() => requestPermission(), 'denied');
      this.permissionStatus = permissionState || 'denied';
      return this.permissionStatus === 'granted';
    } catch (error) {
      console.error('Failed to check notification permission:', error);
      this.permissionStatus = 'denied';
      return false;
    }
  }

  /**
   * 发送通知
   */
  async sendNotification(title: string, body: string, options: NotificationOptions = {}): Promise<boolean> {
    try {
      const hasPermission = await this.checkPermission();

      if (!hasPermission) {
        console.warn('Notification permission not granted');
        return false;
      }

      // 通知监听器
      this.notifyListeners({ title, body, options });

      // 根据环境发送通知
      if (isTauriEnvironment()) {
        // Tauri桌面环境
        await safeTauriCall(
          async () => {
            await sendNotification({ title, body, icon: options.icon, sound: options.sound });
            return true;
          },
          false,
          { silent: true }
        );
      } else {
        // 浏览器环境
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, {
            body,
            icon: options.icon,
            silent: options.silent || false,
            requireInteraction: options.requireInteraction || false
          });
        } else {
          // 降级到alert
          console.log(`Notification: ${title} - ${body}`);
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }

  /**
   * 使用模板发送通知
   */
  async sendTemplateNotification(templateId: string, variables: Record<string, string> = {}): Promise<boolean> {
    const template = this.templates.get(templateId);
    if (!template) {
      console.error(`Notification template not found: ${templateId}`);
      return false;
    }

    // 替换变量
    const title = this.replaceVariables(template.title, variables);
    const body = this.replaceVariables(template.body, variables);

    return this.sendNotification(title, body, template.options);
  }

  /**
   * 替换模板变量
   */
  private replaceVariables(text: string, variables: Record<string, string>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match;
    });
  }

  /**
   * 通知监听器
   */
  private notifyListeners(notification: { title: string; body: string; options: NotificationOptions }): void {
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  /**
   * 调度通知
   */
  scheduleNotification(
    title: string,
    body: string,
    delayInSeconds: number,
    options: NotificationOptions = {}
  ): string {
    const id = this.generateId();
    const scheduledTime = Date.now() + delayInSeconds * 1000;

    const timeoutId = setTimeout(
      () => {
        this.sendNotification(title, body, options);
        this.scheduledNotifications.delete(id);
      },
      delayInSeconds * 1000
    );

    const scheduledNotification: ScheduledNotification = {
      id,
      title,
      body,
      scheduledTime,
      options,
      timeoutId
    };

    this.scheduledNotifications.set(id, scheduledNotification);
    return id;
  }

  /**
   * 调度模板通知
   */
  scheduleTemplateNotification(
    templateId: string,
    delayInSeconds: number,
    variables: Record<string, string> = {}
  ): string | null {
    const template = this.templates.get(templateId);
    if (!template) {
      console.error(`Notification template not found: ${templateId}`);
      return null;
    }

    const title = this.replaceVariables(template.title, variables);
    const body = this.replaceVariables(template.body, variables);

    return this.scheduleNotification(title, body, delayInSeconds, template.options);
  }

  /**
   * 取消调度的通知
   */
  cancelScheduledNotification(id: string): boolean {
    const scheduled = this.scheduledNotifications.get(id);
    if (!scheduled) {
      return false;
    }

    clearTimeout(scheduled.timeoutId);
    this.scheduledNotifications.delete(id);
    return true;
  }

  /**
   * 取消所有调度的通知
   */
  cancelAllScheduledNotifications(): void {
    this.scheduledNotifications.forEach(scheduled => {
      clearTimeout(scheduled.timeoutId);
    });
    this.scheduledNotifications.clear();
  }

  /**
   * 获取调度的通知列表
   */
  getScheduledNotifications(): ScheduledNotification[] {
    return Array.from(this.scheduledNotifications.values());
  }

  /**
   * 添加通知监听器
   */
  addListener(listener: (notification: { title: string; body: string; options: NotificationOptions }) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * 添加自定义通知模板
   */
  addTemplate(template: NotificationTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * 获取通知模板
   */
  getTemplate(id: string): NotificationTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * 获取所有模板
   */
  getAllTemplates(): NotificationTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * 删除模板
   */
  removeTemplate(id: string): boolean {
    return this.templates.delete(id);
  }

  /**
   * 获取权限状态
   */
  getPermissionStatus(): 'granted' | 'denied' | 'default' | null {
    return this.permissionStatus;
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * 批量发送通知
   */
  async sendBatchNotifications(notifications: Array<{
    title: string;
    body: string;
    options?: NotificationOptions;
    delay?: number;
  }>): Promise<boolean[]> {
    const results: boolean[] = [];

    for (const notification of notifications) {
      if (notification.delay && notification.delay > 0) {
        // 调度通知
        const id = this.scheduleNotification(
          notification.title,
          notification.body,
          notification.delay,
          notification.options
        );
        results.push(!!id);
      } else {
        // 立即发送
        const result = await this.sendNotification(
          notification.title,
          notification.body,
          notification.options
        );
        results.push(result);
      }
    }

    return results;
  }

  /**
   * 清理过期的调度通知
   */
  cleanupExpiredNotifications(): void {
    const now = Date.now();
    const expired: string[] = [];

    this.scheduledNotifications.forEach((scheduled, id) => {
      if (scheduled.scheduledTime < now) {
        expired.push(id);
      }
    });

    expired.forEach(id => {
      this.cancelScheduledNotification(id);
    });
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalSent: number;
    scheduledCount: number;
    templatesCount: number;
    permissionStatus: string;
  } {
    return {
      totalSent: 0, // 可以添加计数器来跟踪
      scheduledCount: this.scheduledNotifications.size,
      templatesCount: this.templates.size,
      permissionStatus: this.permissionStatus || 'unknown'
    };
  }
}

// 导出类而不是实例，避免在模块加载时立即执行构造函数
export { NotificationService };

// 提供获取单例实例的函数，延迟初始化
let serviceInstance: NotificationService | null = null;

export const getNotificationService = (): NotificationService => {
  if (!serviceInstance) {
    serviceInstance = new NotificationService();
  }
  return serviceInstance;
};