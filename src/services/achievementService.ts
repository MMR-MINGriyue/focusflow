import { Achievement, AchievementEvent, AchievementTrigger, UserAchievements } from '../types/achievements';
import { achievementDefinitions } from '../data/achievementDefinitions';
import { logError } from '../utils/errorHandler';

class AchievementService {
  private achievements: Achievement[] = [];
  private listeners: ((achievement: Achievement) => void)[] = [];

  /**
   * 初始化成就系统
   */
  async initialize(): Promise<void> {
    try {
      await this.loadAchievements();
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        operation: 'achievement_initialize'
      }, 'medium');
    }
  }

  /**
   * 加载用户成就数据
   */
  private async loadAchievements(): Promise<void> {
    try {
      // 从localStorage加载已保存的成就数据
      const saved = localStorage.getItem('focusflow-achievements');
      const savedAchievements: Achievement[] = saved ? JSON.parse(saved) : [];

      // 合并定义和保存的数据
      this.achievements = achievementDefinitions.map(def => {
        const saved = savedAchievements.find(a => a.id === def.id);
        return {
          ...def,
          current: saved?.current || 0,
          unlocked: saved?.unlocked || false,
          unlockedAt: saved?.unlockedAt,
        };
      });

      // 添加新成就（如果定义中有新的成就）
      const existingIds = new Set(this.achievements.map(a => a.id));
      const newAchievements = achievementDefinitions.filter(def => !existingIds.has(def.id));
      
      for (const newDef of newAchievements) {
        this.achievements.push({
          ...newDef,
          current: 0,
          unlocked: false,
        });
      }

      await this.saveAchievements();
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        operation: 'load_achievements'
      }, 'medium');
    }
  }

  /**
   * 保存成就数据
   */
  private async saveAchievements(): Promise<void> {
    try {
      localStorage.setItem('focusflow-achievements', JSON.stringify(this.achievements));
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        operation: 'save_achievements'
      }, 'low');
    }
  }

  /**
   * 处理成就事件
   */
  async processEvent(event: AchievementEvent): Promise<Achievement[]> {
    const newlyUnlocked: Achievement[] = [];

    try {
      // 获取用户统计数据
      const userStats = await this.getUserStats();

      // 检查所有相关成就
      for (const achievement of this.achievements) {
        if (achievement.unlocked) continue;

        const definition = achievementDefinitions.find(def => def.id === achievement.id);
        if (!definition) continue;

        // 检查是否匹配触发条件
        if (!definition.triggers.includes(event.trigger)) continue;

        // 检查成就条件
        if (definition.checkCondition(event.data, userStats)) {
          achievement.unlocked = true;
          achievement.unlockedAt = new Date().toISOString();
          achievement.current = achievement.target;
          
          newlyUnlocked.push(achievement);
          
          // 通知监听器
          this.notifyListeners(achievement);
        } else {
          // 更新进度
          this.updateProgress(achievement, event.data, userStats);
        }
      }

      if (newlyUnlocked.length > 0) {
        await this.saveAchievements();
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        operation: 'process_achievement_event',
        trigger: event.trigger
      }, 'medium');
    }

    return newlyUnlocked;
  }

  /**
   * 更新成就进度
   */
  private updateProgress(achievement: Achievement, _eventData: any, userStats: any): void {
    const definition = achievementDefinitions.find(def => def.id === achievement.id);
    if (!definition) return;

    switch (definition.type) {
      case 'counter':
        if (achievement.id.includes('focus_') && achievement.id.includes('hours')) {
          achievement.current = userStats.totalFocusTime;
        } else if (achievement.id.includes('sessions')) {
          achievement.current = userStats.totalFocusSessions;
        } else if (achievement.id.includes('micro_break')) {
          achievement.current = userStats.totalMicroBreaks;
        }
        break;
      
      case 'streak':
        if (achievement.id.includes('streak_')) {
          achievement.current = userStats.currentStreak;
        } else if (achievement.id === 'perfectionist') {
          achievement.current = userStats.perfectRatingStreak;
        }
        break;
      
      case 'ratio':
        if (achievement.id === 'consistent_efficiency') {
          achievement.current = userStats.averageEfficiency;
        }
        break;
    }
  }

  /**
   * 获取用户统计数据
   */
  private async getUserStats(): Promise<any> {
    // 这里应该从数据库或其他存储获取真实的用户统计数据
    // 暂时返回模拟数据
    const mockStats = {
      totalFocusTime: 0, // 分钟
      totalFocusSessions: 0,
      totalMicroBreaks: 0,
      totalRatings: 0,
      currentStreak: 0,
      averageEfficiency: 0,
      perfectRatingStreak: 0,
    };

    try {
      const saved = localStorage.getItem('focusflow-user-stats');
      if (saved) {
        return { ...mockStats, ...JSON.parse(saved) };
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        operation: 'get_user_stats'
      }, 'low');
    }

    return mockStats;
  }

  /**
   * 更新用户统计数据
   */
  async updateUserStats(updates: Partial<any>): Promise<void> {
    try {
      const currentStats = await this.getUserStats();
      const newStats = { ...currentStats, ...updates };
      localStorage.setItem('focusflow-user-stats', JSON.stringify(newStats));
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        operation: 'update_user_stats'
      }, 'low');
    }
  }

  /**
   * 获取所有成就
   */
  getAllAchievements(): Achievement[] {
    return [...this.achievements];
  }

  /**
   * 获取已解锁的成就
   */
  getUnlockedAchievements(): Achievement[] {
    return this.achievements.filter(a => a.unlocked);
  }

  /**
   * 获取用户成就总览
   */
  getUserAchievements(): UserAchievements {
    const unlocked = this.getUnlockedAchievements();
    const totalPoints = unlocked.reduce((sum, a) => sum + a.points, 0);
    const lastUnlocked = unlocked
      .sort((a, b) => (b.unlockedAt || '').localeCompare(a.unlockedAt || ''))
      [0];

    return {
      achievements: this.achievements,
      totalPoints,
      unlockedCount: unlocked.length,
      lastUnlocked,
    };
  }

  /**
   * 添加成就解锁监听器
   */
  addUnlockListener(listener: (achievement: Achievement) => void): void {
    this.listeners.push(listener);
  }

  /**
   * 移除成就解锁监听器
   */
  removeUnlockListener(listener: (achievement: Achievement) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(achievement: Achievement): void {
    this.listeners.forEach(listener => {
      try {
        listener(achievement);
      } catch (error) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          operation: 'notify_achievement_listener',
          achievementId: achievement.id
        }, 'low');
      }
    });
  }

  /**
   * 触发成就事件的便捷方法
   */
  async triggerEvent(trigger: AchievementTrigger, data: Record<string, any> = {}): Promise<Achievement[]> {
    const event: AchievementEvent = {
      trigger,
      data,
      timestamp: new Date().toISOString(),
    };

    return this.processEvent(event);
  }
}

// 导出单例实例
export const achievementService = new AchievementService();
