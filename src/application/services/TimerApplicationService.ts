/**
 * 计时器应用服务
 * 协调计时器相关用例的执行
 */

import { TimerSessionService } from '../../domain/services/TimerSessionService';
import { ITimerSessionRepository } from '../../domain/repositories/ITimerSessionRepository';
import { TimerSettings } from '../../domain/value-objects/TimerSettings';
import { TimerMode, TimerState } from '../../domain/value-objects/TimerState';
import { UUID } from '../../domain/value-objects/UUID';
import { EfficiencyRating } from '../../domain/value-objects/EfficiencyRating';
import { DateTime } from '../../domain/value-objects/DateTime';
import { Duration } from '../../domain/value-objects/Duration';

// 用例导入
import { StartTimerSessionUseCase } from '../use-cases/StartTimerSessionUseCase';
import { TransitionTimerStateUseCase } from '../use-cases/TransitionTimerStateUseCase';
import { EndTimerSessionUseCase } from '../use-cases/EndTimerSessionUseCase';
import { GetSessionStatsUseCase } from '../use-cases/GetSessionStatsUseCase';

// 响应类型导入
import { StartTimerSessionResponse } from '../use-cases/StartTimerSessionUseCase';
import { TransitionTimerStateResponse } from '../use-cases/TransitionTimerStateUseCase';
import { EndTimerSessionResponse } from '../use-cases/EndTimerSessionUseCase';
import { GetSessionStatsResponse, SessionStats } from '../use-cases/GetSessionStatsUseCase';

export class TimerApplicationService {
  private startTimerSessionUseCase: StartTimerSessionUseCase;
  private transitionTimerStateUseCase: TransitionTimerStateUseCase;
  private endTimerSessionUseCase: EndTimerSessionUseCase;
  private getSessionStatsUseCase: GetSessionStatsUseCase;

  constructor(timerSessionRepository: ITimerSessionRepository) {
    const timerSessionService = new TimerSessionService(timerSessionRepository);

    this.startTimerSessionUseCase = new StartTimerSessionUseCase(timerSessionService);
    this.transitionTimerStateUseCase = new TransitionTimerStateUseCase(timerSessionService);
    this.endTimerSessionUseCase = new EndTimerSessionUseCase(timerSessionService);
    this.getSessionStatsUseCase = new GetSessionStatsUseCase(timerSessionService);
  }

  /**
   * 开始新的计时器会话
   */
  async startSession(
    mode: TimerMode,
    settings: TimerSettings,
    userId?: UUID
  ): Promise<StartTimerSessionResponse> {
    return this.startTimerSessionUseCase.execute({
      mode,
      settings,
      userId
    });
  }

  /**
   * 转换计时器状态
   */
  async transitionToState(newState: TimerState): Promise<TransitionTimerStateResponse> {
    return this.transitionTimerStateUseCase.execute({
      newState
    });
  }

  /**
   * 结束当前计时器会话
   */
  async endSession(efficiencyRating?: EfficiencyRating): Promise<EndTimerSessionResponse> {
    return this.endTimerSessionUseCase.execute({
      efficiencyRating
    });
  }

  /**
   * 获取会话统计
   */
  async getSessionStats(
    userId: UUID,
    startDate?: DateTime,
    endDate?: DateTime
  ): Promise<GetSessionStatsResponse> {
    return this.getSessionStatsUseCase.execute({
      userId,
      startDate,
      endDate
    });
  }

  /**
   * 获取当前活跃会话
   */
  getCurrentSession() {
    // 直接访问领域服务获取当前会话
    const timerSessionService = (this.startTimerSessionUseCase as any).timerSessionService as TimerSessionService;
    return timerSessionService.getCurrentSession();
  }

  /**
   * 添加标签到当前会话
   */
  async addTagToCurrentSession(tag: string): Promise<void> {
    const timerSessionService = (this.startTimerSessionUseCase as any).timerSessionService as TimerSessionService;
    return timerSessionService.addTag(tag);
  }

  /**
   * 从当前会话移除标签
   */
  async removeTagFromCurrentSession(tag: string): Promise<void> {
    const timerSessionService = (this.startTimerSessionUseCase as any).timerSessionService as TimerSessionService;
    return timerSessionService.removeTag(tag);
  }

  /**
   * 更新当前会话笔记
   */
  async updateCurrentSessionNotes(notes: string): Promise<void> {
    const timerSessionService = (this.startTimerSessionUseCase as any).timerSessionService as TimerSessionService;
    return timerSessionService.updateNotes(notes);
  }

  /**
   * 设置当前会话效率评分
   */
  async setCurrentSessionEfficiencyRating(rating: EfficiencyRating): Promise<void> {
    const timerSessionService = (this.startTimerSessionUseCase as any).timerSessionService as TimerSessionService;
    return timerSessionService.setEfficiencyRating(rating);
  }

  /**
   * 获取用户会话历史
   */
  async getUserSessions(
    userId: UUID,
    options: {
      startDate?: DateTime;
      endDate?: DateTime;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const timerSessionService = (this.startTimerSessionUseCase as any).timerSessionService as TimerSessionService;
    return timerSessionService.getUserSessions(userId, options);
  }

  /**
   * 恢复未完成的会话
   */
  async resumeIncompleteSessions(): Promise<void> {
    const timerSessionService = (this.startTimerSessionUseCase as any).timerSessionService as TimerSessionService;
    return timerSessionService.resumeIncompleteSessions();
  }
}
