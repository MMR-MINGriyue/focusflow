import { EnhancedSoundService } from '../services/enhancedSoundService';
import { safeConsole } from '../utils/environment';

export interface NotificationTemplate {
  id: string;
  title: string;
  body: string;
  icon?: string;
  sound?: string;
  actions?: Array<{
    action: string;
    title: string;
  }>;
}

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  sound?: string;
  actions?: Array<{
    action: string;
    title: string;
  }>;
  onClick?: () => void;
  onClose?: () => void;
  onActionClick?: (action: string) => void;
}

/**
 * 增强版通知服务
 * 提供更完善的通知功能，包括系统通知、应用内通知和音效提醒
 */
class EnhancedNotificationService {
  private soundService: EnhancedSoundService;
  private notificationPermission: NotificationPermission = 'default';
  private notificationTemplates: Map<string, NotificationTemplate> = new Map();
  private enabled: boolean = true;
  private soundEnabled: boolean = true;

  constructor() {
    this.soundService = new EnhancedSoundService();
    this.initialize();
  }

  /**
   * 初始化通知服务
   */
  private async initialize() {
    try {
      // 请求通知权限
      if ('Notification' in window) {
        this.notificationPermission = await Notification.requestPermission();
      }

      // 从本地存储加载设置
      this.loadSettingsFromStorage();

      // 加载默认通知模板
      this.loadDefaultTemplates();

      safeConsole.log('通知服务初始化完成');
    } catch (error) {
      safeConsole.error('通知服务初始化失败:', error);
    }
  }

  /**
   * 从本地存储加载设置
   */
  private loadSettingsFromStorage() {
    try {
      const storedEnabled = localStorage.getItem('notificationsEnabled');
      if (storedEnabled !== null) {
        this.enabled = storedEnabled === 'true';
      }

      const storedSoundEnabled = localStorage.getItem('soundEnabled');
      if (storedSoundEnabled !== null) {
        this.soundEnabled = storedSoundEnabled === 'true';
      }

      const storedTemplates = localStorage.getItem('notificationTemplates');
      if (storedTemplates) {
        const templatesArray = JSON.parse(storedTemplates);
        templatesArray.forEach((template: NotificationTemplate) => {
          this.notificationTemplates.set(template.id, template);
        });
      }
    } catch (error) {
      safeConsole.error('加载通知设置失败:', error);
    }
  }

  /**
   * 保存设置到本地存储
   */
  private saveSettingsToStorage() {
    try {
      localStorage.setItem('notificationsEnabled', this.enabled.toString());
      localStorage.setItem('soundEnabled', this.soundEnabled.toString());

      const templatesArray = Array.from(this.notificationTemplates.values());
      localStorage.setItem('notificationTemplates', JSON.stringify(templatesArray));
    } catch (error) {
      safeConsole.error('保存通知设置失败:', error);
    }
  }

  /**
   * 加载默认通知模板
   */
  private loadDefaultTemplates() {
    // 如果已有模板，不加载默认模板
    if (this.notificationTemplates.size > 0) return;

    // 默认通知模板
    const defaultTemplates: NotificationTemplate[] = [
      {
        id: 'focus-start',
        title: '专注开始',
        body: '是时候开始专注了！',
        sound: 'focus-start'
      },
      {
        id: 'focus-end',
        title: '专注结束',
        body: '专注时间结束，休息一下吧！',
        sound: 'focus-end'
      },
      {
        id: 'break-start',
        title: '休息开始',
        body: '休息时间开始，放松一下！',
        sound: 'break-start'
      },
      {
        id: 'break-end',
        title: '休息结束',
        body: '休息时间结束，准备开始新的专注！',
        sound: 'break-end'
      },
      {
        id: 'micro-break',
        title: '微休息提醒',
        body: '站起来活动一下，喝杯水吧！',
        sound: 'micro-break'
      },
      {
        id: 'achievement',
        title: '成就解锁',
        body: '恭喜您解锁了新成就！',
        sound: 'achievement'
      },
      {
        id: 'reminder',
        title: '提醒',
        body: '您有一个待办事项需要处理',
        sound: 'notification'
      }
    ];

    // 添加默认模板
    defaultTemplates.forEach(template => {
      this.notificationTemplates.set(template.id, template);
    });
  }

  /**
   * 检查通知权限
   */
  async checkNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (this.notificationPermission === 'default') {
      this.notificationPermission = await Notification.requestPermission();
    }

    return this.notificationPermission;
  }

  /**
   * 启用/禁用通知
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.saveSettingsToStorage();
  }

  /**
   * 启用/禁用音效
   */
  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    this.saveSettingsToStorage();
  }

  /**
   * 获取通知启用状态
   */
  isEnabled(): boolean {
    return this.enabled && this.notificationPermission === 'granted';
  }

  /**
   * 获取音效启用状态
   */
  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * 发送通知
   */
  async notify(options: NotificationOptions): Promise<void> {
    if (!this.enabled) return;

    // 如果启用了系统通知且有权限
    if (this.notificationPermission === 'granted' && 'Notification' in window) {
      try {
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon,
          actions: options.actions
        });

        // 添加点击事件
        if (options.onClick) {
          notification.onclick = options.onClick;
        }

        // 添加关闭事件
        if (options.onClose) {
          notification.onclose = options.onClose;
        }

        // 添加动作点击事件
        if (options.onActionClick && options.actions) {
          notification.addEventListener('notificationclick', (event) => {
            if (event.action && options.actions?.some(a => a.action === event.action)) {
              options.onActionClick?.(event.action);
            }
          });
        }
      } catch (error) {
        safeConsole.error('发送系统通知失败:', error);
        // 如果系统通知失败，回退到应用内通知
        this.showInAppNotification(options);
      }
    } else {
      // 如果没有系统通知权限，显示应用内通知
      this.showInAppNotification(options);
    }

    // 播放音效
    if (this.soundEnabled && options.sound) {
      this.soundService.play(options.sound);
    }
  }

  /**
   * 使用模板发送通知
   */
  async notifyWithTemplate(templateId: string, customOptions?: Partial<NotificationOptions>): Promise<void> {
    const template = this.notificationTemplates.get(templateId);
    if (!template) {
      safeConsole.error(`通知模板不存在: ${templateId}`);
      return;
    }

    const options: NotificationOptions = {
      title: template.title,
      body: template.body,
      icon: template.icon,
      sound: template.sound,
      actions: template.actions,
      ...customOptions
    };

    await this.notify(options);
  }

  /**
   * 显示应用内通知
   */
  private showInAppNotification(options: NotificationOptions): void {
    // 创建通知元素
    const notificationElement = document.createElement('div');
    notificationElement.className = 'fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 max-w-md z-50 transform transition-transform duration-300 translate-y-full opacity-0';

    notificationElement.innerHTML = `
      <div class="flex items-start">
        ${options.icon ? `<img src="${options.icon}" alt="通知图标" class="h-10 w-10 rounded-full mr-3">` : ''}
        <div class="flex-1">
          <h3 class="font-semibold">${options.title}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">${options.body}</p>
          ${options.actions && options.actions.length > 0 ? `
            <div class="flex space-x-2 mt-2">
              ${options.actions.map(action => `
                <button class="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors" data-action="${action.action}">
                  ${action.title}
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>
        <button class="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    `;

    // 添加到页面
    document.body.appendChild(notificationElement);

    // 显示动画
    setTimeout(() => {
      notificationElement.classList.remove('translate-y-full', 'opacity-0');
    }, 10);

    // 添加关闭按钮事件
    const closeButton = notificationElement.querySelector('button');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.closeInAppNotification(notificationElement, options.onClose);
      });
    }

    // 添加动作按钮事件
    const actionButtons = notificationElement.querySelectorAll('button[data-action]');
    actionButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const action = (e.target as HTMLElement).getAttribute('data-action');
        if (action && options.onActionClick) {
          options.onActionClick(action);
        }
        this.closeInAppNotification(notificationElement, options.onClose);
      });
    });

    // 添加点击事件
    if (options.onClick) {
      notificationElement.addEventListener('click', () => {
        options.onClick?.();
        this.closeInAppNotification(notificationElement, options.onClose);
      });
    }

    // 自动关闭
    setTimeout(() => {
      this.closeInAppNotification(notificationElement, options.onClose);
    }, 5000);
  }

  /**
   * 关闭应用内通知
   */
  private closeInAppNotification(element: HTMLElement, onClose?: () => void): void {
    element.classList.add('translate-y-full', 'opacity-0');
    setTimeout(() => {
      document.body.removeChild(element);
      if (onClose) onClose();
    }, 300);
  }

  /**
   * 添加通知模板
   */
  addTemplate(template: NotificationTemplate): void {
    this.notificationTemplates.set(template.id, template);
    this.saveSettingsToStorage();
  }

  /**
   * 更新通知模板
   */
  updateTemplate(templateId: string, updates: Partial<NotificationTemplate>): void {
    const template = this.notificationTemplates.get(templateId);
    if (template) {
      this.notificationTemplates.set(templateId, { ...template, ...updates });
      this.saveSettingsToStorage();
    }
  }

  /**
   * 删除通知模板
   */
  deleteTemplate(templateId: string): void {
    this.notificationTemplates.delete(templateId);
    this.saveSettingsToStorage();
  }

  /**
   * 获取所有通知模板
   */
  getTemplates(): NotificationTemplate[] {
    return Array.from(this.notificationTemplates.values());
  }

  /**
   * 获取通知模板
   */
  getTemplate(templateId: string): NotificationTemplate | undefined {
    return this.notificationTemplates.get(templateId);
  }

  /**
   * 发送专注开始通知
   */
  async notifyFocusStart(customOptions?: Partial<NotificationOptions>): Promise<void> {
    await this.notifyWithTemplate('focus-start', customOptions);
  }

  /**
   * 发送专注结束通知
   */
  async notifyFocusEnd(customOptions?: Partial<NotificationOptions>): Promise<void> {
    await this.notifyWithTemplate('focus-end', customOptions);
  }

  /**
   * 发送休息开始通知
   */
  async notifyBreakStart(customOptions?: Partial<NotificationOptions>): Promise<void> {
    await this.notifyWithTemplate('break-start', customOptions);
  }

  /**
   * 发送休息结束通知
   */
  async notifyBreakEnd(customOptions?: Partial<NotificationOptions>): Promise<void> {
    await this.notifyWithTemplate('break-end', customOptions);
  }

  /**
   * 发送微休息通知
   */
  async notifyMicroBreak(customOptions?: Partial<NotificationOptions>): Promise<void> {
    await this.notifyWithTemplate('micro-break', customOptions);
  }

  /**
   * 发送成就解锁通知
   */
  async notifyAchievement(customOptions?: Partial<NotificationOptions>): Promise<void> {
    await this.notifyWithTemplate('achievement', customOptions);
  }

  /**
   * 发送提醒通知
   */
  async notifyReminder(customOptions?: Partial<NotificationOptions>): Promise<void> {
    await this.notifyWithTemplate('reminder', customOptions);
  }

  /**
   * 重置为默认设置
   */
  resetToDefaults(): void {
    // 重置启用状态
    this.enabled = true;
    this.soundEnabled = true;

    // 清空通知模板
    this.notificationTemplates.clear();

    // 重新加载默认模板
    this.loadDefaultTemplates();

    // 保存设置
    this.saveSettingsToStorage();
  }
}

// 创建单例实例
export const enhancedNotificationService = new EnhancedNotificationService();

// 导出服务类
export { EnhancedNotificationService };
