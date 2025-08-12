/**
 * 任务创建事件处理器
 * 处理任务创建事件
 */

import { EventHandler, Handles } from '../EventHandler';
import { TaskCreatedEvent } from '../../../domain/aggregates/TaskAggregate';
import { NotificationService } from '../../services/NotificationService';
import { container } from '../../../container/IoCContainer';

@Handles('task.created')
export class TaskCreatedEventHandler implements EventHandler {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = container.resolve<NotificationService>('notificationService');
  }

  async handle(event: TaskCreatedEvent): Promise<void> {
    try {
      console.log(`Handling task created event: ${event.taskId} - ${event.title}`);

      // 发送通知
      await this.notificationService.sendNotification({
        title: '任务已创建',
        message: `任务 "${event.title}" 已成功创建`,
        type: 'success',
        timestamp: new Date(),
      });

      // 可以添加其他处理逻辑，如：
      // - 记录分析数据
      // - 更新缓存
      // - 触发工作流等
    } catch (error) {
      console.error('Error handling task created event:', error);
      throw error;
    }
  }
}
