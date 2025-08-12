/**
 * 计时器会话领域服务
 * 处理计时器会话的业务逻辑
 */

import { TimerSession } from '../entities/TimerSession';
import { TimerSettings, ClassicTimerSettings, SmartTimerSettings } from '../value-objects/TimerSettings';
import { TimerState, TimerMode, TimerStateTransition } from '../value-objects/TimerState';
import { DateTime } from '../value-objects/DateTime';
import { Duration } from '../value-objects/Duration';
import { EfficiencyRating } from '../value-objects/EfficiencyRating';
import { UUID } from '../value-objects/UUID';
import { ITimerSessionRepository } from '../repositories/ITimerSessionRepository';

export class TimerSessionService {
  private timerSessionRepository: ITimerSessionRepository;
  private currentSession: TimerSession | null = null;

  constructor(timerSessionRepository: ITimerSessionRepository) {
    this.timerSessionRepository = timerSessionRepository;
  }

  /**
   * 开始新的计时器会话
   */
  async startSession(
    mode: TimerMode,
    settings: TimerSettings,
    userId?: UUID
  ): Promise<TimerSession> {
    // 结束当前会话（如果有）
    if (this.currentSession) {
      await this.endCurrentSession();
    }

    // 创建新会话
    const session = TimerSession.create({
      userId,
      startTime: DateTime.now(),
      mode
    });

    // 开始初始状态
    session.startState(TimerState.FOCUS);

    // 保存会话
    await this.timerSessionRepository.save(session);

    // 设置为当前会话
    this.currentSession = session;

    return session;
  }

  /**
   * 获取当前会话
   */
  getCurrentSession(): TimerSession | null {
    return this.currentSession;
  }

  /**
   * 切换会话状态
   */
  async transitionToState(newState: TimerState): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const currentState = this.currentSession.currentState;
    if (currentState === newState) {
      return; // 已经是目标状态，无需转换
    }

    // 验证状态转换是否有效
    const transition = TimerStateTransition.create(currentState!, newState);

    // 结束当前状态
    this.currentSession.endState();

    // 开始新状态
    this.currentSession.startState(newState);

    // 保存会话
    await this.timerSessionRepository.save(this.currentSession);
  }

  /**
   * 结束当前会话
   */
  async endCurrentSession(): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    // 结束当前状态
    this.currentSession.end();

    // 保存会话
    await this.timerSessionRepository.save(this.currentSession);

    // 清除当前会话引用
    this.currentSession = null;
  }

  /**
   * 设置会话效率评分
   */
  async setEfficiencyRating(rating: EfficiencyRating): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    this.currentSession.setEfficiencyRating(rating);
    await this.timerSessionRepository.save(this.currentSession);
  }

  /**
   * 添加标签到当前会话
   */
  async addTag(tag: string): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    this.currentSession.addTag(tag);
    await this.timerSessionRepository.save(this.currentSession);
  }

  /**
   * 从当前会话移除标签
   */
  async removeTag(tag: string): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    this.currentSession.removeTag(tag);
    await this.timerSessionRepository.save(this.currentSession);
  }

  /**
   * 更新会话笔记
   */
  async updateNotes(notes: string): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    this.currentSession.updateNotes(notes);
    await this.timerSessionRepository.save(this.currentSession);
  }

  /**
   * 获取用户的会话历史
   */
  async getUserSessions(
    userId: UUID,
    options: {
      startDate?: DateTime;
      endDate?: DateTime;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<TimerSession[]> {
    return this.timerSessionRepository.findByUserId(userId, options);
  }

  /**
   * 获取会话统计
   */
  async getSessionStats(
    userId: UUID,
    startDate?: DateTime,
    endDate?: DateTime
  ): Promise<{
    totalSessions: number;
    totalFocusTime: Duration;
    totalBreakTime: Duration;
    averageEfficiency: number;
    mostUsedTags: string[];
  }> {
    const sessions = await this.timerSessionRepository.findByUserId(userId, {
      startDate,
      endDate
    });

    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalFocusTime: Duration.zero(),
        totalBreakTime: Duration.zero(),
        averageEfficiency: 0,
        mostUsedTags: []
      };
    }

    const totalFocusTime = sessions.reduce(
      (total, session) => total.add(session.focusDuration),
      Duration.zero()
    );

    const totalBreakTime = sessions.reduce(
      (total, session) => total.add(session.breakDuration),
      Duration.zero()
    );

    const efficiencyRatings = sessions
      .map(session => session.efficiencyRating?.value)
      .filter(rating => rating !== undefined) as number[];

    const averageEfficiency = efficiencyRatings.length > 0
      ? efficiencyRatings.reduce((sum, rating) => sum + rating, 0) / efficiencyRatings.length
      : 0;

    // 统计标签使用频率
    const tagCounts: Record<string, number> = {};
    sessions.forEach(session => {
      session.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const mostUsedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    return {
      totalSessions: sessions.length,
      totalFocusTime,
      totalBreakTime,
      averageEfficiency,
      mostUsedTags
    };
  }

  /**
   * 恢复未完成的会话
   */
  async resumeIncompleteSessions(): Promise<void> {
    // 获取所有未完成的会话
    const incompleteSessions = await this.timerSessionRepository.findIncompleteSessions();

    // 如果有未完成的会话，恢复最近的会话
    if (incompleteSessions.length > 0) {
      // 按开始时间降序排序
      incompleteSessions.sort((a, b) => b.startTime.timestamp - a.startTime.timestamp);

      // 恢复最近的会话
      this.currentSession = incompleteSessions[0];
    }
  }
}
