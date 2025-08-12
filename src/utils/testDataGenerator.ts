import { getDatabaseService } from '../services/database';

/**
 * 测试数据生成器
 * 用于生成测试数据以验证数据库功能
 */

export interface TestDataOptions {
  days?: number;
  sessionsPerDay?: { min: number; max: number };
  focusDurationRange?: { min: number; max: number };
  breakDurationRange?: { min: number; max: number };
  microBreaksRange?: { min: number; max: number };
  efficiencyRange?: { min: number; max: number };
}

export class TestDataGenerator {
  private static readonly DEFAULT_OPTIONS: Required<TestDataOptions> = {
    days: 30,
    sessionsPerDay: { min: 1, max: 5 },
    focusDurationRange: { min: 30, max: 120 },
    breakDurationRange: { min: 10, max: 30 },
    microBreaksRange: { min: 0, max: 6 },
    efficiencyRange: { min: 60, max: 95 }
  };

  /**
   * 生成随机整数
   */
  private static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 生成随机浮点数
   */
  private static randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  /**
   * 生成日期字符串
   */
  private static getDateString(daysAgo: number): string {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  }

  /**
   * 生成单个专注会话数据
   */
  private static generateSession(date: string, options: Required<TestDataOptions>) {
    return {
      date,
      focus_duration: this.randomInt(options.focusDurationRange.min, options.focusDurationRange.max),
      break_duration: this.randomInt(options.breakDurationRange.min, options.breakDurationRange.max),
      micro_breaks: this.randomInt(options.microBreaksRange.min, options.microBreaksRange.max),
      efficiency_score: Math.round(this.randomFloat(options.efficiencyRange.min, options.efficiencyRange.max) * 10) / 10
    };
  }

  /**
   * 生成测试数据
   */
  static generateTestData(options: TestDataOptions = {}): any[] {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const testData = [];

    for (let i = 0; i < opts.days; i++) {
      const date = this.getDateString(i);
      const sessionsCount = this.randomInt(opts.sessionsPerDay.min, opts.sessionsPerDay.max);

      for (let j = 0; j < sessionsCount; j++) {
        testData.push(this.generateSession(date, opts));
      }
    }

    return testData;
  }

  /**
   * 插入测试数据到数据库
   */
  static async insertTestData(options: TestDataOptions = {}): Promise<{
    success: boolean;
    insertedCount: number;
    error?: string;
  }> {
    try {
      const databaseService = getDatabaseService();
    await databaseService.initialize();
      
      const testData = this.generateTestData(options);
      let insertedCount = 0;

      for (const session of testData) {
        try {
          const databaseService = getDatabaseService();
    await databaseService.saveFocusSession(session);
          insertedCount++;
        } catch (error) {
          console.warn('Failed to insert session:', error);
        }
      }

      return {
        success: true,
        insertedCount
      };
    } catch (error) {
      return {
        success: false,
        insertedCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 生成测试设置数据
   */
  static generateTestSettings() {
    return {
      focusDuration: this.randomInt(45, 120),
      breakDuration: this.randomInt(10, 30),
      microBreakMinInterval: this.randomInt(8, 15),
      microBreakMaxInterval: this.randomInt(20, 35),
      microBreakDuration: this.randomInt(2, 5),
      soundEnabled: Math.random() > 0.3,
      notificationEnabled: Math.random() > 0.2,
      volume: Math.round(this.randomFloat(0.3, 1.0) * 10) / 10
    };
  }

  /**
   * 清理测试数据
   */
  static async cleanupTestData(): Promise<{
    success: boolean;
    deletedCount: number;
    error?: string;
  }> {
    try {
      const databaseService = getDatabaseService();
      await databaseService.initialize();
      
      // 删除最近30天的数据（假设这些是测试数据）
      const thirtyDaysAgo = this.getDateString(30);
      const deletedCount = await databaseService.cleanupOldData(thirtyDaysAgo);

      return {
        success: true,
        deletedCount
      };
    } catch (error) {
      return {
        success: false,
        deletedCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 验证数据库数据
   */
  static async validateDatabaseData(): Promise<{
    isValid: boolean;
    issues: string[];
    stats: any;
  }> {
    try {
      const databaseService = getDatabaseService();
      await databaseService.initialize();
      
      const issues: string[] = [];
      const stats = await databaseService.getDatabaseStats();

      // 验证数据完整性
      if (stats.totalSessions === 0) {
        issues.push('数据库中没有会话数据');
      }

      if (stats.averageEfficiency < 0 || stats.averageEfficiency > 100) {
        issues.push('效率评分数据异常');
      }

      if (stats.totalFocusTime < 0) {
        issues.push('专注时间数据异常');
      }

      // 检查最近数据
      const recentStats = await databaseService.getRecentStats(7);
      if (recentStats.length === 0) {
        issues.push('最近7天没有数据');
      }

      return {
        isValid: issues.length === 0,
        issues,
        stats
      };
    } catch (error) {
      return {
        isValid: false,
        issues: [`数据库验证失败: ${error instanceof Error ? error.message : 'Unknown error'}`],
        stats: null
      };
    }
  }

  /**
   * 生成性能测试数据
   */
  static async performanceTest(recordCount: number = 1000): Promise<{
    success: boolean;
    insertTime: number;
    queryTime: number;
    recordsPerSecond: number;
    error?: string;
  }> {
    try {
      const databaseService = getDatabaseService();
      await databaseService.initialize();

      // 生成大量测试数据
      const testData = this.generateTestData({
        days: Math.ceil(recordCount / 3), // 平均每天3条记录
        sessionsPerDay: { min: 2, max: 4 }
      }).slice(0, recordCount);

      // 测试插入性能
      const insertStartTime = performance.now();
      
      for (const session of testData) {
        await databaseService.saveFocusSession(session);
      }
      
      const insertEndTime = performance.now();
      const insertTime = insertEndTime - insertStartTime;

      // 测试查询性能
      const queryStartTime = performance.now();
      await databaseService.getDatabaseStats();
      await databaseService.getRecentStats(30);
      const queryEndTime = performance.now();
      const queryTime = queryEndTime - queryStartTime;

      const recordsPerSecond = Math.round((recordCount / insertTime) * 1000);

      return {
        success: true,
        insertTime,
        queryTime,
        recordsPerSecond
      };
    } catch (error) {
      return {
        success: false,
        insertTime: 0,
        queryTime: 0,
        recordsPerSecond: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// 导出便捷函数
export const generateTestData = TestDataGenerator.generateTestData;
export const insertTestData = TestDataGenerator.insertTestData;
export const cleanupTestData = TestDataGenerator.cleanupTestData;
export const validateDatabaseData = TestDataGenerator.validateDatabaseData;
export const performanceTest = TestDataGenerator.performanceTest;
