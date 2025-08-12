/**
 * 结束计时器会话用例
 * 处理结束计时器会话的业务逻辑
 */

import { TimerSessionService } from '../../domain/services/TimerSessionService';
import { EfficiencyRating } from '../../domain/value-objects/EfficiencyRating';

export interface EndTimerSessionRequest {
  efficiencyRating?: EfficiencyRating;
}

export interface EndTimerSessionResponse {
  success: boolean;
  error?: string;
}

export class EndTimerSessionUseCase {
  constructor(private timerSessionService: TimerSessionService) {}

  async execute(request: EndTimerSessionRequest = {}): Promise<EndTimerSessionResponse> {
    try {
      // 检查是否有活跃会话
      const currentSession = this.timerSessionService.getCurrentSession();
      if (!currentSession) {
        return {
          success: false,
          error: 'No active session'
        };
      }

      // 如果提供了效率评分，设置评分
      if (request.efficiencyRating) {
        await this.timerSessionService.setEfficiencyRating(request.efficiencyRating);
      }

      // 结束会话
      await this.timerSessionService.endCurrentSession();

      return {
        success: true
      };
    } catch (error) {
      console.error('Failed to end timer session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
