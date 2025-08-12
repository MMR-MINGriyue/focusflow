/**
 * 任务完成事件处理器
 * 处理任务完成事件
 */

import { EventHandler, Handles } from '../EventHandler';
import { TaskCompletedEvent } from '../../../domain/aggregates/TaskAggregate';
import { NotificationService } from '../../services/NotificationService';
import { AnalyticsService } from '../../services/AnalyticsService';
import { AchievementService } from '../../services/AchievementService';
import { container } from '../../../container/IoCContainer';

@Handles('task.completed')
export class TaskCompletedEventHandler implements EventHandler {
  private notificationService: NotificationService;
  private analyticsService: AnalyticsService;
  private achievementService: AchievementService;

  constructor() {
    this.notificationService = container.resolve<NotificationService>('notificationService');
    this.analyticsService = container.resolve<AnalyticsService>('analyticsService');
    this.achievementService = container.resolve<AchievementService>('achievementService');
  }

  async handle(event: TaskCompletedEvent): Promise<void> {
    try {
      console.log(`Handling task completed event: ${event.taskId}, time spent: ${event.timeSpent}s`);

      // 发送通知
      await this.notificationService.sendNotification({
        title: '任务已完成',
        message: `恭喜！任务已完成，用时 ${this.formatTime(event.timeSpent)}`,
        type: 'success',
        timestamp: new Date(),
      });

      // 记录分析数据
      await this.analyticsService.trackTaskCompletion({
        taskId: event.taskId,
        completedAt: event.completedAt,
        timeSpent: event.timeSpent,
      });

      // 检查成就
      await this.achievementService.checkAchievements(event.taskId);

      // 可以添加其他处理逻辑，如：
      // - 更新用户统计数据
      // - 触发后续任务
      // - 更新仪表板等
    } catch (error) {
      console.error('Error handling task completed event:', error);
      throw error;
    }
  }

  /**
   * 格式化时间
   * @param seconds 秒数
   */
  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}小时${minutes}分钟${secs}秒`;
    } else if (minutes > 0) {
      return `${minutes}分钟${secs}秒`;
    } else {
      return `${secs}秒`;
    }
  }
}
