/**
 * 分析服务
 * 负责处理应用内的数据分析
 */

import { container } from '../../container/IoCContainer';

/**
 * 任务完成数据
 */
export interface TaskCompletionData {
  taskId: string;
  completedAt: Date;
  timeSpent: number; // 以秒为单位
}

/**
 * 会话数据
 */
export interface SessionData {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // 以秒为单位
  type: 'focus' | 'break' | 'micro-break';
  completed: boolean;
}

/**
 * 每日统计数据
 */
export interface DailyStats {
  date: string;
  completedTasks: number;
  totalFocusTime: number; // 以秒为单位
  totalBreakTime: number; // 以秒为单位
  sessions: SessionData[];
}

/**
 * 分析服务接口
 */
export interface AnalyticsService {
  /**
   * 跟踪任务完成
   * @param data 任务完成数据
   */
  trackTaskCompletion(data: TaskCompletionData): Promise<void>;

  /**
   * 跟踪会话
   * @param data 会话数据
   */
  trackSession(data: SessionData): Promise<void>;

  /**
   * 获取每日统计数据
   * @param startDate 开始日期
   * @param endDate 结束日期
   */
  getDailyStats(startDate: Date, endDate: Date): Promise<DailyStats[]>;

  /**
   * 获取 productivity 趋势
   * @param days 天数
   */
  getProductivityTrend(days: number): Promise<Array<{
    date: string;
    productivity: number; // 0-100
  }>>;

  /**
   * 获取焦点时间分布
   * @param days 天数
   */
  getFocusTimeDistribution(days: number): Promise<Array<{
    hour: number;
    focusTime: number; // 以秒为单位
  }>>;

  /**
   * 获取任务完成率
   * @param days 天数
   */
  getTaskCompletionRate(days: number): Promise<number>;

  /**
   * 跟踪事件
   * @param event 事件数据
   */
  trackEvent(event: {
    name: string;
    properties?: Record<string, any>;
  }): void;
}

/**
 * 分析服务实现
 */
export class AnalyticsServiceImpl implements AnalyticsService {
  private readonly TASK_COMPLETIONS_KEY = 'focus-flow-task-completions';
  private readonly SESSIONS_KEY = 'focus-flow-sessions';
  private storageService = container.resolve('storageService');

  async trackTaskCompletion(data: TaskCompletionData): Promise<void> {
    try {
      // 获取现有数据
      const completions = await this.getStoredTaskCompletions();

      // 添加新数据
      completions.push(data);

      // 限制数据量
      if (completions.length > 1000) {
        completions.splice(0, completions.length - 1000);
      }

      // 保存数据
      await this.storageService.setItem(this.TASK_COMPLETIONS_KEY, completions);
    } catch (error) {
      console.error('Failed to track task completion:', error);
      throw new Error(`Failed to track task completion: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async trackSession(data: SessionData): Promise<void> {
    try {
      // 获取现有数据
      const sessions = await this.getStoredSessions();

      // 添加新数据
      sessions.push(data);

      // 限制数据量
      if (sessions.length > 1000) {
        sessions.splice(0, sessions.length - 1000);
      }

      // 保存数据
      await this.storageService.setItem(this.SESSIONS_KEY, sessions);
    } catch (error) {
      console.error('Failed to track session:', error);
      throw new Error(`Failed to track session: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getDailyStats(startDate: Date, endDate: Date): Promise<DailyStats[]> {
    try {
      // 获取所有数据
      const completions = await this.getStoredTaskCompletions();
      const sessions = await this.getStoredSessions();

      // 创建日期范围
      const stats: Map<string, DailyStats> = new Map();
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        stats.set(dateStr, {
          date: dateStr,
          completedTasks: 0,
          totalFocusTime: 0,
          totalBreakTime: 0,
          sessions: [],
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      // 处理任务完成数据
      for (const completion of completions) {
        const dateStr = new Date(completion.completedAt).toISOString().split('T')[0];
        const dayStats = stats.get(dateStr);

        if (dayStats) {
          dayStats.completedTasks++;
        }
      }

      // 处理会话数据
      for (const session of sessions) {
        const dateStr = new Date(session.startTime).toISOString().split('T')[0];
        const dayStats = stats.get(dateStr);

        if (dayStats) {
          dayStats.sessions.push(session);

          if (session.type === 'focus') {
            dayStats.totalFocusTime += session.duration;
          } else {
            dayStats.totalBreakTime += session.duration;
          }
        }
      }

      // 转换为数组并排序
      return Array.from(stats.values()).sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Failed to get daily stats:', error);
      throw new Error(`Failed to get daily stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getProductivityTrend(days: number): Promise<Array<{
    date: string;
    productivity: number;
  }>> {
    try {
      // 计算日期范围
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // 获取每日统计数据
      const dailyStats = await this.getDailyStats(startDate, endDate);

      // 计算 productivity 趋势
      return dailyStats.map(day => {
        // 简单的 productivity 计算公式：完成任务数 / 预估任务数 * 100
        // 这里可以根据实际需求调整计算方式
        const estimatedTasks = Math.max(1, Math.ceil(day.totalFocusTime / (25 * 60))); // 假设每个任务25分钟
        const productivity = Math.min(100, Math.round((day.completedTasks / estimatedTasks) * 100));

        return {
          date: day.date,
          productivity,
        };
      });
    } catch (error) {
      console.error('Failed to get productivity trend:', error);
      throw new Error(`Failed to get productivity trend: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getFocusTimeDistribution(days: number): Promise<Array<{
    hour: number;
    focusTime: number;
  }>> {
    try {
      // 计算日期范围
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // 获取会话数据
      const sessions = await this.getStoredSessions();

      // 过滤日期范围内的焦点会话
      const focusSessions = sessions.filter(session => {
        const sessionDate = new Date(session.startTime);
        return sessionDate >= startDate && 
               sessionDate <= endDate && 
               session.type === 'focus';
      });

      // 按小时分组
      const distribution: Map<number, number> = new Map();

      // 初始化所有小时
      for (let hour = 0; hour < 24; hour++) {
        distribution.set(hour, 0);
      }

      // 计算每小时的焦点时间
      for (const session of focusSessions) {
        const hour = new Date(session.startTime).getHours();
        const currentTime = distribution.get(hour) || 0;
        distribution.set(hour, currentTime + session.duration);
      }

      // 转换为数组
      return Array.from(distribution.entries()).map(([hour, focusTime]) => ({
        hour,
        focusTime,
      }));
    } catch (error) {
      console.error('Failed to get focus time distribution:', error);
      throw new Error(`Failed to get focus time distribution: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getTaskCompletionRate(days: number): Promise<number> {
    try {
      // 计算日期范围
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // 获取每日统计数据
      const dailyStats = await this.getDailyStats(startDate, endDate);

      // 计算总完成率和总预估数
      let totalCompleted = 0;
      let totalEstimated = 0;

      for (const day of dailyStats) {
        totalCompleted += day.completedTasks;
        totalEstimated += Math.max(1, Math.ceil(day.totalFocusTime / (25 * 60))); // 假设每个任务25分钟
      }

      // 计算完成率
      return totalEstimated > 0 ? Math.round((totalCompleted / totalEstimated) * 100) : 0;
    } catch (error) {
      console.error('Failed to get task completion rate:', error);
      throw new Error(`Failed to get task completion rate: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取存储的任务完成数据
   */
  private async getStoredTaskCompletions(): Promise<TaskCompletionData[]> {
    try {
      const completions = await this.storageService.getItem<TaskCompletionData[]>(this.TASK_COMPLETIONS_KEY);
      return completions || [];
    } catch (error) {
      console.error('Failed to get stored task completions:', error);
      return [];
    }
  }

  /**
   * 获取存储的会话数据
   */
  private async getStoredSessions(): Promise<SessionData[]> {
    try {
      const sessions = await this.storageService.getItem<SessionData[]>(this.SESSIONS_KEY);
      return sessions || [];
    } catch (error) {
      console.error('Failed to get stored sessions:', error);
      return [];
    }
  }

  /**
   * 跟踪事件
   * @param event 事件数据
   */
  trackEvent(event: {
    name: string;
    properties?: Record<string, any>;
  }): void {
    try {
      // 在实际实现中，这里可以将事件发送到分析服务
      // 例如 Google Analytics、Mixpanel 等
      console.log('Tracking event:', event);
      
      // 也可以将事件保存到本地存储，稍后批量发送
      const events = this.getStoredEvents();
      events.push({
        ...event,
        timestamp: Date.now(),
      });
      
      // 限制事件数量
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      // 保存事件
      this.storageService.setItem('focus-flow-events', events);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  /**
   * 获取存储的事件
   */
  private getStoredEvents(): Array<{
    name: string;
    properties?: Record<string, any>;
    timestamp: number;
  }> {
    try {
      return this.storageService.getItem('focus-flow-events') || [];
    } catch (error) {
      console.error('Failed to get stored events:', error);
      return [];
    }
  }
}
