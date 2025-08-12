/**
 * 转换计时器状态用例
 * 处理计时器状态转换的业务逻辑
 */

import { TimerSessionService } from '../../domain/services/TimerSessionService';
import { TimerState } from '../../domain/value-objects/TimerState';

export interface TransitionTimerStateRequest {
  newState: TimerState;
}

export interface TransitionTimerStateResponse {
  success: boolean;
  error?: string;
}

export class TransitionTimerStateUseCase {
  constructor(private timerSessionService: TimerSessionService) {}

  async execute(request: TransitionTimerStateRequest): Promise<TransitionTimerStateResponse> {
    try {
      // 验证请求参数
      if (!request.newState) {
        return {
          success: false,
          error: 'Invalid request parameters'
        };
      }

      // 检查是否有活跃会话
      const currentSession = this.timerSessionService.getCurrentSession();
      if (!currentSession) {
        return {
          success: false,
          error: 'No active session'
        };
      }

      // 转换状态
      await this.timerSessionService.transitionToState(request.newState);

      return {
        success: true
      };
    } catch (error) {
      console.error('Failed to transition timer state:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
