/**
 * 开始计时器会话用例
 * 处理开始新计时器会话的业务逻辑
 */

import { TimerSessionService } from '../../domain/services/TimerSessionService';
import { TimerSettings } from '../../domain/value-objects/TimerSettings';
import { TimerMode } from '../../domain/value-objects/TimerState';
import { UUID } from '../../domain/value-objects/UUID';
import { TimerSession } from '../../domain/entities/TimerSession';

export interface StartTimerSessionRequest {
  mode: TimerMode;
  settings: TimerSettings;
  userId?: UUID;
}

export interface StartTimerSessionResponse {
  success: boolean;
  session?: TimerSession;
  error?: string;
}

export class StartTimerSessionUseCase {
  constructor(private timerSessionService: TimerSessionService) {}

  async execute(request: StartTimerSessionRequest): Promise<StartTimerSessionResponse> {
    try {
      // 验证请求参数
      if (!request.mode || !request.settings) {
        return {
          success: false,
          error: 'Invalid request parameters'
        };
      }

      // 开始新会话
      const session = await this.timerSessionService.startSession(
        request.mode,
        request.settings,
        request.userId
      );

      return {
        success: true,
        session
      };
    } catch (error) {
      console.error('Failed to start timer session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
