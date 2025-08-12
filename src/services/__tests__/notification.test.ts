/**
 * 通知服务测试
 */

import { getNotificationService, NotificationTemplate } from '../notification';

// Mock Tauri API
jest.mock('@tauri-apps/api/notification', () => ({
  sendNotification: jest.fn().mockResolvedValue(undefined),
  requestPermission: jest.fn().mockResolvedValue('granted'),
  isPermissionGranted: jest.fn().mockResolvedValue(true)
}));

import { sendNotification, requestPermission, isPermissionGranted } from '@tauri-apps/api/notification';

const mockSendNotification = sendNotification as jest.MockedFunction<typeof sendNotification>;
const mockRequestPermission = requestPermission as jest.MockedFunction<typeof requestPermission>;
const mockIsPermissionGranted = isPermissionGranted as jest.MockedFunction<typeof isPermissionGranted>;

describe('NotificationService', () => {
  let notificationService: ReturnType<typeof getNotificationService>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();

    notificationService = getNotificationService();
    // 清理调度的通知
    notificationService.cancelAllScheduledNotifications();

    // 重置权限状态
    (notificationService as any).permissionStatus = null;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Permission Management', () => {
    it('checks permission correctly', async () => {
      mockRequestPermission.mockResolvedValue('granted');
      
      const hasPermission = await notificationService.checkPermission();
      
      expect(hasPermission).toBe(true);
      expect(mockRequestPermission).toHaveBeenCalled();
    });

    it('handles permission denial', async () => {
      mockRequestPermission.mockResolvedValue('denied');
      
      const hasPermission = await notificationService.checkPermission();
      
      expect(hasPermission).toBe(false);
    });

    it('caches permission status', async () => {
      mockRequestPermission.mockResolvedValue('granted');
      
      // 第一次调用
      await notificationService.checkPermission();
      // 第二次调用
      await notificationService.checkPermission();
      
      // 应该只调用一次 requestPermission
      expect(mockRequestPermission).toHaveBeenCalledTimes(1);
    });

    it('gets permission status', () => {
      const status = notificationService.getPermissionStatus();
      expect(['granted', 'denied', 'default', null]).toContain(status);
    });
  });

  describe('Basic Notification Sending', () => {
    beforeEach(() => {
      mockRequestPermission.mockResolvedValue('granted');
    });

    it('sends notification successfully', async () => {
      const result = await notificationService.sendNotification(
        'Test Title',
        'Test Body',
        { icon: 'test.png', sound: 'test.wav' }
      );

      expect(result).toBe(true);
      expect(mockSendNotification).toHaveBeenCalledWith({
        title: 'Test Title',
        body: 'Test Body',
        icon: 'test.png',
        sound: 'test.wav'
      });
    });

    it('handles notification failure gracefully', async () => {
      mockSendNotification.mockRejectedValue(new Error('Send failed'));
      
      const result = await notificationService.sendNotification('Title', 'Body');
      
      expect(result).toBe(false);
    });

    it('does not send notification without permission', async () => {
      mockRequestPermission.mockResolvedValue('denied');
      
      const result = await notificationService.sendNotification('Title', 'Body');
      
      expect(result).toBe(false);
      expect(mockSendNotification).not.toHaveBeenCalled();
    });
  });

  describe('Template Notifications', () => {
    beforeEach(async () => {
      // 重置权限状态
      (notificationService as any).permissionStatus = null;
      mockRequestPermission.mockResolvedValue('granted');
      mockIsPermissionGranted.mockResolvedValue(true);
      mockSendNotification.mockResolvedValue(undefined);
      // 确保权限已获取
      await notificationService.checkPermission();
    });

    it('sends template notification', async () => {
      // 确保模板存在
      const template = notificationService.getTemplate('focus-start');
      expect(template).toBeDefined();

      // 检查权限状态
      const permissionStatus = notificationService.getPermissionStatus();
      console.log('Permission status:', permissionStatus);

      const result = await notificationService.sendTemplateNotification('focus-start');
      console.log('Template notification result:', result);

      expect(result).toBe(true);
      expect(mockSendNotification).toHaveBeenCalledWith({
        title: '🎯 开始专注',
        body: '现在开始专注时间，保持专注！',
        icon: 'focus-icon.png',
        sound: 'focus-start.wav'
      });
    });

    it('replaces variables in template', async () => {
      const result = await notificationService.sendTemplateNotification('focus-start', {
        duration: '25'
      });
      
      expect(result).toBe(true);
    });

    it('handles non-existent template', async () => {
      const result = await notificationService.sendTemplateNotification('non-existent');
      
      expect(result).toBe(false);
      expect(mockSendNotification).not.toHaveBeenCalled();
    });

    it('gets all templates', () => {
      const templates = notificationService.getAllTemplates();
      
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0]).toHaveProperty('id');
      expect(templates[0]).toHaveProperty('name');
      expect(templates[0]).toHaveProperty('title');
      expect(templates[0]).toHaveProperty('body');
    });

    it('adds custom template', () => {
      const customTemplate: NotificationTemplate = {
        id: 'custom-test',
        name: '自定义测试',
        title: '测试标题',
        body: '测试内容',
        options: {}
      };

      notificationService.addTemplate(customTemplate);
      const retrieved = notificationService.getTemplate('custom-test');
      
      expect(retrieved).toEqual(customTemplate);
    });

    it('removes template', () => {
      const customTemplate: NotificationTemplate = {
        id: 'custom-remove',
        name: '待删除',
        title: '标题',
        body: '内容',
        options: {}
      };

      notificationService.addTemplate(customTemplate);
      const removed = notificationService.removeTemplate('custom-remove');
      const retrieved = notificationService.getTemplate('custom-remove');
      
      expect(removed).toBe(true);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Scheduled Notifications', () => {
    beforeEach(async () => {
      mockRequestPermission.mockResolvedValue('granted');
      // 确保权限已获取
      await notificationService.checkPermission();
    });

    it('schedules notification', () => {
      const id = notificationService.scheduleNotification(
        'Scheduled Title',
        'Scheduled Body',
        5, // 5 seconds
        { icon: 'scheduled.png' }
      );

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');

      const scheduled = notificationService.getScheduledNotifications();
      expect(scheduled).toHaveLength(1);
      expect(scheduled[0].id).toBe(id);
    });

    it('executes scheduled notification', async () => {
      notificationService.scheduleNotification('Title', 'Body', 1);

      // 快进时间
      jest.advanceTimersByTime(1000);

      // 等待所有pending的promises
      await jest.runAllTimersAsync();

      expect(mockSendNotification).toHaveBeenCalledWith({
        title: 'Title',
        body: 'Body',
        icon: undefined,
        sound: undefined
      });
    });

    it('cancels scheduled notification', () => {
      const id = notificationService.scheduleNotification('Title', 'Body', 5);
      
      const cancelled = notificationService.cancelScheduledNotification(id);
      
      expect(cancelled).toBe(true);
      
      // 快进时间，不应该发送通知
      jest.advanceTimersByTime(5000);
      expect(mockSendNotification).not.toHaveBeenCalled();
    });

    it('schedules template notification', async () => {
      const id = notificationService.scheduleTemplateNotification('focus-start', 3);

      expect(id).toBeDefined();

      jest.advanceTimersByTime(3000);

      // 等待所有pending的promises
      await jest.runAllTimersAsync();

      expect(mockSendNotification).toHaveBeenCalledWith({
        title: '🎯 开始专注',
        body: '现在开始专注时间，保持专注！',
        icon: 'focus-icon.png',
        sound: 'focus-start.wav'
      });
    });

    it('cancels all scheduled notifications', () => {
      notificationService.scheduleNotification('Title 1', 'Body 1', 5);
      notificationService.scheduleNotification('Title 2', 'Body 2', 10);
      
      expect(notificationService.getScheduledNotifications()).toHaveLength(2);
      
      notificationService.cancelAllScheduledNotifications();
      
      expect(notificationService.getScheduledNotifications()).toHaveLength(0);
    });
  });

  describe('Batch Notifications', () => {
    beforeEach(async () => {
      // 重置权限状态
      (notificationService as any).permissionStatus = null;
      mockRequestPermission.mockResolvedValue('granted');
      // 确保权限已获取
      await notificationService.checkPermission();
    });

    it('sends batch notifications', async () => {
      const notifications = [
        { title: 'Title 1', body: 'Body 1' },
        { title: 'Title 2', body: 'Body 2', delay: 1 },
        { title: 'Title 3', body: 'Body 3', options: { icon: 'test.png' } }
      ];

      const results = await notificationService.sendBatchNotifications(notifications);
      
      expect(results).toHaveLength(3);
      expect(results[0]).toBe(true); // 立即发送
      expect(results[1]).toBe(true); // 调度发送
      expect(results[2]).toBe(true); // 立即发送

      expect(mockSendNotification).toHaveBeenCalledTimes(2); // 只有立即发送的
    });
  });

  describe('Listeners', () => {
    beforeEach(async () => {
      mockRequestPermission.mockResolvedValue('granted');
      // 确保权限已获取
      await notificationService.checkPermission();
    });

    it('adds and removes listeners', async () => {
      const listener = jest.fn();

      const removeListener = notificationService.addListener(listener);

      // 发送通知应该触发监听器
      await notificationService.sendNotification('Title', 'Body');

      expect(listener).toHaveBeenCalledWith({
        title: 'Title',
        body: 'Body',
        options: {}
      });

      // 移除监听器
      removeListener();
      listener.mockClear();

      // 再次发送通知不应该触发监听器
      await notificationService.sendNotification('Title 2', 'Body 2');

      expect(listener).not.toHaveBeenCalled();
    });

    it('handles listener errors gracefully', async () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = jest.fn();

      notificationService.addListener(errorListener);
      notificationService.addListener(normalListener);

      // 应该不会因为错误监听器而影响正常监听器
      await expect(
        notificationService.sendNotification('Title', 'Body')
      ).resolves.not.toThrow();

      expect(normalListener).toHaveBeenCalled();
    });
  });

  describe('Statistics and Utilities', () => {
    it('gets statistics', () => {
      const stats = notificationService.getStats();
      
      expect(stats).toHaveProperty('totalSent');
      expect(stats).toHaveProperty('scheduledCount');
      expect(stats).toHaveProperty('templatesCount');
      expect(stats).toHaveProperty('permissionStatus');
      
      expect(typeof stats.scheduledCount).toBe('number');
      expect(typeof stats.templatesCount).toBe('number');
    });

    it('cleans up expired notifications', () => {
      // 这个测试需要模拟过期的通知
      // 由于当前实现中没有真正的过期逻辑，这里只测试方法存在
      expect(() => {
        notificationService.cleanupExpiredNotifications();
      }).not.toThrow();
    });
  });
});
