/**
 * 获取会话统计用例
 * 处理获取会话统计数据的业务逻辑
 */

import { TimerSessionService } from '../../domain/services/TimerSessionService';
import { UUID } from '../../domain/value-objects/UUID';
import { DateTime } from '../../domain/value-objects/DateTime';
import { Duration } from '../../domain/value-objects/Duration';

export interface GetSessionStatsRequest {
  userId: UUID;
  startDate?: DateTime;
  endDate?: DateTime;
}

export interface SessionStats {
  totalSessions: number;
  totalFocusTime: Duration;
  totalBreakTime: Duration;
  averageEfficiency: number;
  mostUsedTags: string[];
  dailyFocusTime: Array<{
    date: string;
    focusTime: Duration;
  }>;
  dailyEfficiency: Array<{
    date: string;
    efficiency: number;
  }>;
}

export interface GetSessionStatsResponse {
  success: boolean;
  stats?: SessionStats;
  error?: string;
}

export class GetSessionStatsUseCase {
  constructor(private timerSessionService: TimerSessionService) {}

  async execute(request: GetSessionStatsRequest): Promise<GetSessionStatsResponse> {
    try {
      // 验证请求参数
      if (!request.userId) {
        return {
          success: false,
          error: 'User ID is required'
        };
      }

      // 获取基本统计信息
      const basicStats = await this.timerSessionService.getSessionStats(
        request.userId,
        request.startDate,
        request.endDate
      );

      // 获取会话历史
      const sessions = await this.timerSessionService.getUserSessions(
        request.userId,
        {
          startDate: request.startDate,
          endDate: request.endDate
        }
      );

      // 计算每日专注时间
      const dailyFocusTimeMap = new Map<string, number>();
      const dailyEfficiencyMap = new Map<string, { sum: number; count: number }>();

      sessions.forEach(session => {
        const date = session.startTime.toISOString().split('T')[0];

        // 累计专注时间
        const currentFocusTime = dailyFocusTimeMap.get(date) || 0;
        dailyFocusTimeMap.set(date, currentFocusTime + session.focusDuration.seconds);

        // 累计效率评分
        if (session.efficiencyRating) {
          const currentEfficiency = dailyEfficiencyMap.get(date) || { sum: 0, count: 0 };
          currentEfficiency.sum += session.efficiencyRating.value;
          currentEfficiency.count += 1;
          dailyEfficiencyMap.set(date, currentEfficiency);
        }
      });

      // 转换为数组并排序
      const dailyFocusTime = Array.from(dailyFocusTimeMap.entries())
        .map(([date, focusTime]) => ({
          date,
          focusTime: new Duration(focusTime * 1000)
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const dailyEfficiency = Array.from(dailyEfficiencyMap.entries())
        .map(([date, stats]) => ({
          date,
          efficiency: stats.count > 0 ? stats.sum / stats.count : 0
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // 构建响应
      const stats: SessionStats = {
        totalSessions: basicStats.totalSessions,
        totalFocusTime: new Duration(basicStats.totalFocusTime * 1000),
        totalBreakTime: new Duration(basicStats.totalBreakTime * 1000),
        averageEfficiency: basicStats.averageEfficiency,
        mostUsedTags: basicStats.mostUsedTags,
        dailyFocusTime,
        dailyEfficiency
      };

      return {
        success: true,
        stats
      };
    } catch (error) {
      console.error('Failed to get session stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
