/**
 * 计时器会话存储库接口
 * 定义计时器会话的数据访问操作
 */

import { TimerSession } from '../entities/TimerSession';
import { UUID } from '../value-objects/UUID';
import { DateTime } from '../value-objects/DateTime';

export interface ITimerSessionRepository {
  /**
   * 保存计时器会话
   */
  save(session: TimerSession): Promise<void>;

  /**
   * 根据ID查找计时器会话
   */
  findById(id: UUID): Promise<TimerSession | null>;

  /**
   * 根据用户ID查找计时器会话
   */
  findByUserId(
    userId: UUID,
    options: {
      startDate?: DateTime;
      endDate?: DateTime;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<TimerSession[]>;

  /**
   * 查找未完成的计时器会话
   */
  findIncompleteSessions(): Promise<TimerSession[]>;

  /**
   * 删除计时器会话
   */
  delete(session: TimerSession): Promise<void>;

  /**
   * 根据ID删除计时器会话
   */
  deleteById(id: UUID): Promise<void>;

  /**
   * 获取用户会话统计
   */
  getUserStats(
    userId: UUID,
    startDate?: DateTime,
    endDate?: DateTime
  ): Promise<{
    totalSessions: number;
    totalFocusTime: number; // 以秒为单位
    totalBreakTime: number; // 以秒为单位
    averageEfficiency: number;
  }>;

  /**
   * 获取每日统计数据
   */
  getDailyStats(
    userId: UUID,
    days: number = 30
  ): Promise<Array<{
    date: string; // YYYY-MM-DD格式
    focusTime: number; // 以秒为单位
    breakTime: number; // 以秒为单位
    sessions: number;
    efficiency: number;
  }>>;

  /**
   * 获取标签使用统计
   */
  getTagStats(
    userId: UUID,
    limit: number = 10
  ): Promise<Array<{
    tag: string;
    count: number;
    totalFocusTime: number; // 以秒为单位
  }>>;

  /**
   * 导出用户数据
   */
  exportUserData(userId: UUID): Promise<string>;

  /**
   * 导入用户数据
   */
  importUserData(userId: UUID, data: string): Promise<void>;
}
