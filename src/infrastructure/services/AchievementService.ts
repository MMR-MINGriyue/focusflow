/**
 * 成就服务
 * 负责处理应用内的成就系统
 */

import { container } from '../../container/IoCContainer';

/**
 * 成就类型
 */
export type AchievementType = 
  | 'first-task'           // 完成第一个任务
  | 'daily-streak-3'       // 连续3天完成任务
  | 'daily-streak-7'       // 连续7天完成任务
  | 'daily-streak-30'      // 连续30天完成任务
  | 'task-master-10'       // 完成10个任务
  | 'task-master-50'       // 完成50个任务
  | 'task-master-100'      // 完成100个任务
  | 'focus-time-60'        // 累计专注时间60分钟
  | 'focus-time-300'       // 累计专注时间300分钟
  | 'focus-time-600'       // 累计专注时间600分钟
  | 'early-bird'          // 在早上8点前完成任务
  | 'night-owl'           // 在晚上10点后完成任务
  | 'speed-demon'         // 在预估时间内完成任务
  | 'perfectionist'       // 连续5次在预估时间内完成任务
  | 'multitasker'         // 同一天完成5个任务
  | 'weekend-warrior'     // 在周末完成任务
  | 'punctual'           // 连续10次按时完成任务
  | 'overachiever';      // 超额完成任务

/**
 * 成就接口
 */
export interface Achievement {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress?: number; // 0-100
  maxProgress?: number;
}

/**
 * 成就进度接口
 */
export interface AchievementProgress {
  type: AchievementType;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: Date;
}

/**
 * 成就服务接口
 */
export interface AchievementService {
  /**
   * 检查成就
   * @param taskId 任务ID
   */
  checkAchievements(taskId: string): Promise<void>;

  /**
   * 获取所有成就
   */
  getAchievements(): Promise<Achievement[]>;

  /**
   * 获取已解锁的成就
   */
  getUnlockedAchievements(): Promise<Achievement[]>;

  /**
   * 获取成就进度
   */
  getAchievementProgress(): Promise<AchievementProgress[]>;

  /**
   * 解锁成就
   * @param type 成就类型
   */
  unlockAchievement(type: AchievementType): Promise<void>;

  /**
   * 更新成就进度
   * @param type 成就类型
   * @param progress 进度
   */
  updateAchievementProgress(type: AchievementType, progress: number): Promise<void>;
}

/**
 * 成就服务实现
 */
export class AchievementServiceImpl implements AchievementService {
  private readonly ACHIEVEMENTS_KEY = 'focus-flow-achievements';
  private readonly PROGRESS_KEY = 'focus-flow-achievement-progress';
  private storageService = container.resolve('storageService');
  private analyticsService = container.resolve('analyticsService');

  // 定义所有成就
  private readonly ALL_ACHIEVEMENTS: Achievement[] = [
    {
      id: 'first-task',
      type: 'first-task',
      title: '初出茅庐',
      description: '完成你的第一个任务',
      icon: '🎯',
    },
    {
      id: 'daily-streak-3',
      type: 'daily-streak-3',
      title: '连续作战',
      description: '连续3天完成任务',
      icon: '🔥',
    },
    {
      id: 'daily-streak-7',
      type: 'daily-streak-7',
      title: '坚持不懈',
      description: '连续7天完成任务',
      icon: '💪',
    },
    {
      id: 'daily-streak-30',
      type: 'daily-streak-30',
      title: '月度达人',
      description: '连续30天完成任务',
      icon: '🏆',
    },
    {
      id: 'task-master-10',
      type: 'task-master-10',
      title: '任务新手',
      description: '完成10个任务',
      icon: '🌟',
    },
    {
      id: 'task-master-50',
      type: 'task-master-50',
      title: '任务专家',
      description: '完成50个任务',
      icon: '⭐',
    },
    {
      id: 'task-master-100',
      type: 'task-master-100',
      title: '任务大师',
      description: '完成100个任务',
      icon: '🌠',
    },
    {
      id: 'focus-time-60',
      type: 'focus-time-60',
      title: '专注入门',
      description: '累计专注时间60分钟',
      icon: '⏱️',
    },
    {
      id: 'focus-time-300',
      type: 'focus-time-300',
      title: '专注进阶',
      description: '累计专注时间300分钟',
      icon: '⏳',
    },
    {
      id: 'focus-time-600',
      type: 'focus-time-600',
      title: '专注大师',
      description: '累计专注时间600分钟',
      icon: '⌛',
    },
    {
      id: 'early-bird',
      type: 'early-bird',
      title: '早起鸟儿',
      description: '在早上8点前完成任务',
      icon: '🐦',
    },
    {
      id: 'night-owl',
      type: 'night-owl',
      title: '夜猫子',
      description: '在晚上10点后完成任务',
      icon: '🦉',
    },
    {
      id: 'speed-demon',
      type: 'speed-demon',
      title: '速度恶魔',
      description: '在预估时间内完成任务',
      icon: '🚀',
    },
    {
      id: 'perfectionist',
      type: 'perfectionist',
      title: '完美主义者',
      description: '连续5次在预估时间内完成任务',
      icon: '🎨',
    },
    {
      id: 'multitasker',
      type: 'multitasker',
      title: '多任务处理',
      description: '同一天完成5个任务',
      icon: '🔄',
    },
    {
      id: 'weekend-warrior',
      type: 'weekend-warrior',
      title: '周末战士',
      description: '在周末完成任务',
      icon: '🛡️',
    },
    {
      id: 'punctual',
      type: 'punctual',
      title: '守时达人',
      description: '连续10次按时完成任务',
      icon: '⏰',
    },
    {
      id: 'overachiever',
      type: 'overachiever',
      title: '超越自我',
      description: '超额完成任务',
      icon: '🚀',
    },
  ];

  async checkAchievements(taskId: string): Promise<void> {
    try {
      // 获取当前成就进度
      const progress = await this.getAchievementProgress();

      // 检查各种成就
      await this.checkFirstTaskAchievement(progress);
      await this.checkDailyStreakAchievements(progress);
      await this.checkTaskMasterAchievements(progress);
      await this.checkFocusTimeAchievements(progress);
      await this.checkTimeBasedAchievements(taskId, progress);
      await this.checkPerformanceAchievements(progress);
      await this.checkMultitaskerAchievement(progress);
      await this.checkWeekendWarriorAchievement(taskId, progress);
      await this.checkPunctualAchievement(progress);
      await this.checkOverachieverAchievement(progress);
    } catch (error) {
      console.error('Failed to check achievements:', error);
      throw new Error(`Failed to check achievements: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getAchievements(): Promise<Achievement[]> {
    try {
      // 获取已解锁的成就
      const unlockedAchievements = await this.getStoredAchievements();
      const unlockedTypes = new Set(unlockedAchievements.map(a => a.type));

      // 合并所有成就和已解锁状态
      return this.ALL_ACHIEVEMENTS.map(achievement => {
        const unlocked = unlockedAchievements.find(a => a.type === achievement.type);
        return {
          ...achievement,
          unlockedAt: unlocked?.unlockedAt,
        };
      });
    } catch (error) {
      console.error('Failed to get achievements:', error);
      return this.ALL_ACHIEVEMENTS;
    }
  }

  async getUnlockedAchievements(): Promise<Achievement[]> {
    try {
      return await this.getStoredAchievements();
    } catch (error) {
      console.error('Failed to get unlocked achievements:', error);
      return [];
    }
  }

  async getAchievementProgress(): Promise<AchievementProgress[]> {
    try {
      return await this.getStoredProgress();
    } catch (error) {
      console.error('Failed to get achievement progress:', error);
      return [];
    }
  }

  async unlockAchievement(type: AchievementType): Promise<void> {
    try {
      // 获取已解锁的成就
      const unlockedAchievements = await this.getStoredAchievements();

      // 检查是否已解锁
      if (unlockedAchievements.some(a => a.type === type)) {
        return;
      }

      // 获取成就定义
      const achievement = this.ALL_ACHIEVEMENTS.find(a => a.type === type);
      if (!achievement) {
        return;
      }

      // 添加到已解锁列表
      unlockedAchievements.push({
        ...achievement,
        unlockedAt: new Date(),
      });

      // 保存
      await this.storageService.setItem(this.ACHIEVEMENTS_KEY, unlockedAchievements);

      // 发送通知
      const notificationService = container.resolve('notificationService');
      await notificationService.sendNotification({
        title: '成就解锁！',
        message: `恭喜你解锁了成就：${achievement.title}`,
        type: 'success',
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to unlock achievement:', error);
      throw new Error(`Failed to unlock achievement: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async updateAchievementProgress(type: AchievementType, progress: number): Promise<void> {
    try {
      // 获取当前进度
      const progressList = await this.getStoredProgress();

      // 查找或创建进度记录
      let progressRecord = progressList.find(p => p.type === type);
      if (!progressRecord) {
        // 获取成就定义以确定最大进度
        const achievement = this.ALL_ACHIEVEMENTS.find(a => a.type === type);
        if (!achievement) {
          return;
        }

        // 创建进度记录
        progressRecord = {
          type,
          progress: 0,
          maxProgress: this.getMaxProgress(type),
          unlocked: false,
        };
        progressList.push(progressRecord);
      }

      // 更新进度
      progressRecord.progress = Math.min(progress, progressRecord.maxProgress);

      // 检查是否应该解锁
      if (!progressRecord.unlocked && progressRecord.progress >= progressRecord.maxProgress) {
        progressRecord.unlocked = true;
        progressRecord.unlockedAt = new Date();
        await this.unlockAchievement(type);
      }

      // 保存进度
      await this.storageService.setItem(this.PROGRESS_KEY, progressList);
    } catch (error) {
      console.error('Failed to update achievement progress:', error);
      throw new Error(`Failed to update achievement progress: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 检查第一个任务成就
   */
  private async checkFirstTaskAchievement(progress: AchievementProgress[]): Promise<void> {
    const firstTaskProgress = progress.find(p => p.type === 'first-task');
    if (!firstTaskProgress || !firstTaskProgress.unlocked) {
      await this.updateAchievementProgress('first-task', 1);
    }
  }

  /**
   * 检查连续天数成就
   */
  private async checkDailyStreakAchievements(progress: AchievementProgress[]): Promise<void> {
    // 获取最近7天的统计数据
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const dailyStats = await this.analyticsService.getDailyStats(startDate, endDate);

    // 计算连续天数
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];

      const dayStats = dailyStats.find(s => s.date === dateStr);
      if (dayStats && dayStats.completedTasks > 0) {
        streak++;
      } else if (i > 0) { // 今天可以没有完成任务
        break;
      }
    }

    // 更新进度
    if (streak >= 1) {
      await this.updateAchievementProgress('daily-streak-3', Math.min(streak, 3));
    }

    if (streak >= 3) {
      await this.updateAchievementProgress('daily-streak-7', Math.min(streak, 7));
    }

    if (streak >= 7) {
      await this.updateAchievementProgress('daily-streak-30', Math.min(streak, 30));
    }
  }

  /**
   * 检查任务数量成就
   */
  private async checkTaskMasterAchievements(progress: AchievementProgress[]): Promise<void> {
    // 获取任务完成率
    const completionRate = await this.analyticsService.getTaskCompletionRate(30);

    // 估算完成任务数
    const estimatedTasks = Math.round(completionRate * 30 / 100);

    // 更新进度
    if (estimatedTasks >= 1) {
      await this.updateAchievementProgress('task-master-10', Math.min(estimatedTasks, 10));
    }

    if (estimatedTasks >= 10) {
      await this.updateAchievementProgress('task-master-50', Math.min(estimatedTasks, 50));
    }

    if (estimatedTasks >= 50) {
      await this.updateAchievementProgress('task-master-100', Math.min(estimatedTasks, 100));
    }
  }

  /**
   * 检查专注时间成就
   */
  private async checkFocusTimeAchievements(progress: AchievementProgress[]): Promise<void> {
    // 获取最近30天的统计数据
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const dailyStats = await this.analyticsService.getDailyStats(startDate, endDate);

    // 计算总专注时间（分钟）
    const totalFocusMinutes = dailyStats.reduce((total, day) => {
      return total + Math.floor(day.totalFocusTime / 60);
    }, 0);

    // 更新进度
    if (totalFocusMinutes >= 1) {
      await this.updateAchievementProgress('focus-time-60', Math.min(totalFocusMinutes, 60));
    }

    if (totalFocusMinutes >= 60) {
      await this.updateAchievementProgress('focus-time-300', Math.min(totalFocusMinutes, 300));
    }

    if (totalFocusMinutes >= 300) {
      await this.updateAchievementProgress('focus-time-600', Math.min(totalFocusMinutes, 600));
    }
  }

  /**
   * 检查基于时间的成就
   */
  private async checkTimeBasedAchievements(taskId: string, progress: AchievementProgress[]): Promise<void> {
    // 获取任务详情
    // 这里需要从任务仓储获取任务详情，简化处理
    const now = new Date();
    const hour = now.getHours();

    // 检查早起鸟成就
    if (hour < 8) {
      await this.updateAchievementProgress('early-bird', 1);
    }

    // 检查夜猫子成就
    if (hour >= 22) {
      await this.updateAchievementProgress('night-owl', 1);
    }
  }

  /**
   * 检查性能成就
   */
  private async checkPerformanceAchievements(progress: AchievementProgress[]): Promise<void> {
    // 这里需要检查任务是否在预估时间内完成
    // 简化处理，假设有50%的任务在预估时间内完成
    const onTimeRate = 0.5; // 实际应该从统计数据中获取

    // 更新进度
    if (onTimeRate > 0) {
      await this.updateAchievementProgress('speed-demon', 1);
    }

    // 检查完美主义者成就
    if (onTimeRate >= 0.8) {
      await this.updateAchievementProgress('perfectionist', 5);
    }
  }

  /**
   * 检查多任务处理成就
   */
  private async checkMultitaskerAchievement(progress: AchievementProgress[]): Promise<void> {
    // 获取今天的统计数据
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dailyStats = await this.analyticsService.getDailyStats(yesterday, today);
    const todayStats = dailyStats.find(s => s.date === today.toISOString().split('T')[0]);

    // 更新进度
    if (todayStats) {
      await this.updateAchievementProgress('multitasker', Math.min(todayStats.completedTasks, 5));
    }
  }

  /**
   * 检查周末战士成就
   */
  private async checkWeekendWarriorAchievement(taskId: string, progress: AchievementProgress[]): Promise<void> {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = 周日, 6 = 周六

    // 检查是否是周末
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      await this.updateAchievementProgress('weekend-warrior', 1);
    }
  }

  /**
   * 检查守时达人成就
   */
  private async checkPunctualAchievement(progress: AchievementProgress[]): Promise<void> {
    // 这里需要检查连续按时完成的任务数
    // 简化处理，假设有连续按时完成的任务
    const punctualStreak = 5; // 实际应该从统计数据中获取

    // 更新进度
    if (punctualStreak > 0) {
      await this.updateAchievementProgress('punctual', Math.min(punctualStreak, 10));
    }
  }

  /**
   * 检查超越自我成就
   */
  private async checkOverachieverAchievement(progress: AchievementProgress[]): Promise<void> {
    // 这里需要检查是否超额完成任务
    // 简化处理，假设有超额完成的任务
    const overachieved = true; // 实际应该从统计数据中获取

    // 更新进度
    if (overachieved) {
      await this.updateAchievementProgress('overachiever', 1);
    }
  }

  /**
   * 获取存储的成就
   */
  private async getStoredAchievements(): Promise<Achievement[]> {
    try {
      const achievements = await this.storageService.getItem<Achievement[]>(this.ACHIEVEMENTS_KEY);
      return achievements || [];
    } catch (error) {
      console.error('Failed to get stored achievements:', error);
      return [];
    }
  }

  /**
   * 获取存储的进度
   */
  private async getStoredProgress(): Promise<AchievementProgress[]> {
    try {
      const progress = await this.storageService.getItem<AchievementProgress[]>(this.PROGRESS_KEY);
      return progress || [];
    } catch (error) {
      console.error('Failed to get stored progress:', error);
      return [];
    }
  }

  /**
   * 获取成就的最大进度
   */
  private getMaxProgress(type: AchievementType): number {
    switch (type) {
      case 'first-task':
        return 1;
      case 'daily-streak-3':
        return 3;
      case 'daily-streak-7':
        return 7;
      case 'daily-streak-30':
        return 30;
      case 'task-master-10':
        return 10;
      case 'task-master-50':
        return 50;
      case 'task-master-100':
        return 100;
      case 'focus-time-60':
        return 60;
      case 'focus-time-300':
        return 300;
      case 'focus-time-600':
        return 600;
      case 'early-bird':
        return 1;
      case 'night-owl':
        return 1;
      case 'speed-demon':
        return 1;
      case 'perfectionist':
        return 5;
      case 'multitasker':
        return 5;
      case 'weekend-warrior':
        return 1;
      case 'punctual':
        return 10;
      case 'overachiever':
        return 1;
      default:
        return 1;
    }
  }
}
