/**
 * 计时器会话存储库实现
 * 使用IndexedDB存储计时器会话数据
 */

import { ITimerSessionRepository } from '../../domain/repositories/ITimerSessionRepository';
import { TimerSession } from '../../domain/entities/TimerSession';
import { TimerSessionState } from '../../domain/entities/TimerSession';
import { UUID } from '../../domain/value-objects/UUID';
import { DateTime } from '../../domain/value-objects/DateTime';
import { TimerState, TimerMode } from '../../domain/value-objects/TimerState';
import { Duration } from '../../domain/value-objects/Duration';
import { EfficiencyRating } from '../../domain/value-objects/EfficiencyRating';

// 数据库接口定义
interface TimerSessionRecord {
  id: string;
  userId?: string;
  startTime: string;
  endTime?: string;
  mode: TimerMode;
  states: TimerSessionStateRecord[];
  efficiencyRating?: number;
  tags?: string[];
  notes?: string;
}

interface TimerSessionStateRecord {
  state: TimerState;
  startTime: string;
  endTime?: string;
  duration: number; // 以毫秒为单位
  completed: boolean;
}

export class TimerSessionRepository implements ITimerSessionRepository {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'FocusFlowDB';
  private readonly DB_VERSION = 2; // 版本升级以支持会话存储
  private readonly STORE_NAME = 'timerSessions';
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      await new Promise<void>((resolve, reject) => {
        request.onerror = (event) => {
          console.error('Database error:', event);
          reject(new Error('Failed to open database'));
        };

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          this.initialized = true;
          console.log('Timer session repository initialized successfully');
          resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // 创建计时器会话存储
          if (!db.objectStoreNames.contains(this.STORE_NAME)) {
            const store = db.createObjectStore(this.STORE_NAME, { 
              keyPath: 'id', 
              autoIncrement: true 
            });

            // 创建索引
            store.createIndex('userId', 'userId', { unique: false });
            store.createIndex('startTime', 'startTime', { unique: false });
            store.createIndex('endTime', 'endTime', { unique: false });
            store.createIndex('mode', 'mode', { unique: false });
          }
        };
      });
    } catch (error) {
      console.error('Failed to initialize timer session repository:', error);
      throw error;
    }
  }

  async save(session: TimerSession): Promise<void> {
    if (!this.db || !this.initialized) {
      throw new Error('Repository not initialized');
    }

    try {
      const record = this.sessionToRecord(session);

      return new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.put(record);

        request.onsuccess = () => {
          console.log(`Session saved with ID: ${session.id?.value || 'unknown'}`);
          resolve();
        };

        request.onerror = (event) => {
          console.error('Failed to save session:', event);
          reject(new Error('Failed to save session'));
        };
      });
    } catch (error) {
      console.error('Failed to save session:', error);
      throw error;
    }
  }

  async findById(id: UUID): Promise<TimerSession | null> {
    if (!this.db || !this.initialized) {
      throw new Error('Repository not initialized');
    }

    try {
      return new Promise<TimerSession | null>((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.get(id.value);

        request.onsuccess = (event) => {
          const record = (event.target as IDBRequest<TimerSessionRecord | undefined>).result;
          if (record) {
            resolve(this.recordToSession(record));
          } else {
            resolve(null);
          }
        };

        request.onerror = (event) => {
          console.error('Failed to find session by ID:', event);
          reject(new Error('Failed to find session by ID'));
        };
      });
    } catch (error) {
      console.error('Failed to find session by ID:', error);
      throw error;
    }
  }

  async findByUserId(
    userId: UUID,
    options: {
      startDate?: DateTime;
      endDate?: DateTime;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<TimerSession[]> {
    if (!this.db || !this.initialized) {
      throw new Error('Repository not initialized');
    }

    try {
      return new Promise<TimerSession[]>((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const index = store.index('userId');
        const request = index.openCursor(IDBKeyRange.only(userId.value));

        const sessions: TimerSession[] = [];
        let count = 0;
        let skipped = 0;

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;

          if (cursor) {
            const record = cursor.value as TimerSessionRecord;

            // 检查日期范围
            const sessionDate = new DateTime(new Date(record.startTime));

            if (
              (!options.startDate || sessionDate.greaterThan(options.startDate) || sessionDate.equals(options.startDate)) &&
              (!options.endDate || sessionDate.lessThan(options.endDate) || sessionDate.equals(options.endDate))
            ) {
              // 应用分页
              if (options.offset && skipped < options.offset) {
                skipped++;
                cursor.continue();
                return;
              }

              if (!options.limit || count < options.limit) {
                sessions.push(this.recordToSession(record));
                count++;
              }
            }

            cursor.continue();
          } else {
            // 按开始时间降序排序
            sessions.sort((a, b) => b.startTime.timestamp - a.startTime.timestamp);
            resolve(sessions);
          }
        };

        request.onerror = (event) => {
          console.error('Failed to find sessions by user ID:', event);
          reject(new Error('Failed to find sessions by user ID'));
        };
      });
    } catch (error) {
      console.error('Failed to find sessions by user ID:', error);
      throw error;
    }
  }

  async findIncompleteSessions(): Promise<TimerSession[]> {
    if (!this.db || !this.initialized) {
      throw new Error('Repository not initialized');
    }

    try {
      return new Promise<TimerSession[]>((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const index = store.index('endTime');
        const request = index.openCursor(IDBKeyRange.only(undefined));

        const sessions: TimerSession[] = [];

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;

          if (cursor) {
            const record = cursor.value as TimerSessionRecord;

            // 检查是否未完成（没有结束时间）
            if (!record.endTime) {
              sessions.push(this.recordToSession(record));
            }

            cursor.continue();
          } else {
            // 按开始时间降序排序
            sessions.sort((a, b) => b.startTime.timestamp - a.startTime.timestamp);
            resolve(sessions);
          }
        };

        request.onerror = (event) => {
          console.error('Failed to find incomplete sessions:', event);
          reject(new Error('Failed to find incomplete sessions'));
        };
      });
    } catch (error) {
      console.error('Failed to find incomplete sessions:', error);
      throw error;
    }
  }

  async delete(session: TimerSession): Promise<void> {
    if (!session.id) {
      throw new Error('Cannot delete session without ID');
    }

    await this.deleteById(session.id);
  }

  async deleteById(id: UUID): Promise<void> {
    if (!this.db || !this.initialized) {
      throw new Error('Repository not initialized');
    }

    try {
      return new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.delete(id.value);

        request.onsuccess = () => {
          console.log(`Session deleted with ID: ${id.value}`);
          resolve();
        };

        request.onerror = (event) => {
          console.error('Failed to delete session:', event);
          reject(new Error('Failed to delete session'));
        };
      });
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw error;
    }
  }

  async getUserStats(
    userId: UUID,
    startDate?: DateTime,
    endDate?: DateTime
  ): Promise<{
    totalSessions: number;
    totalFocusTime: number;
    totalBreakTime: number;
    averageEfficiency: number;
  }> {
    const sessions = await this.findByUserId(userId, { startDate, endDate });

    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalFocusTime: 0,
        totalBreakTime: 0,
        averageEfficiency: 0
      };
    }

    const totalFocusTime = sessions.reduce(
      (total, session) => total + session.focusDuration.milliseconds,
      0
    ) / 1000; // 转换为秒

    const totalBreakTime = sessions.reduce(
      (total, session) => total + session.breakDuration.milliseconds,
      0
    ) / 1000; // 转换为秒

    const efficiencyRatings = sessions
      .map(session => session.efficiencyRating?.value)
      .filter(rating => rating !== undefined) as number[];

    const averageEfficiency = efficiencyRatings.length > 0
      ? efficiencyRatings.reduce((sum, rating) => sum + rating, 0) / efficiencyRatings.length
      : 0;

    return {
      totalSessions: sessions.length,
      totalFocusTime,
      totalBreakTime,
      averageEfficiency
    };
  }

  async getDailyStats(
    userId: UUID,
    days: number = 30
  ): Promise<Array<{
    date: string;
    focusTime: number;
    breakTime: number;
    sessions: number;
    efficiency: number;
  }>> {
    const endDate = DateTime.now();
    const startDate = endDate.addDays(-days);

    const sessions = await this.findByUserId(userId, { startDate, endDate });

    // 按日期分组统计
    const dailyStatsMap = new Map<string, {
      focusTime: number;
      breakTime: number;
      sessions: number;
      efficiencySum: number;
      efficiencyCount: number;
    }>();

    // 初始化所有日期
    for (let i = 0; i < days; i++) {
      const date = endDate.addDays(-i);
      const dateStr = date.toISOString().split('T')[0];
      dailyStatsMap.set(dateStr, {
        focusTime: 0,
        breakTime: 0,
        sessions: 0,
        efficiencySum: 0,
        efficiencyCount: 0
      });
    }

    // 统计会话数据
    sessions.forEach(session => {
      const dateStr = session.startTime.toISOString().split('T')[0];
      const stats = dailyStatsMap.get(dateStr);

      if (stats) {
        stats.focusTime += session.focusDuration.seconds;
        stats.breakTime += session.breakDuration.seconds;
        stats.sessions += 1;

        if (session.efficiencyRating) {
          stats.efficiencySum += session.efficiencyRating.value;
          stats.efficiencyCount += 1;
        }
      }
    });

    // 转换为数组并计算平均效率
    const result = Array.from(dailyStatsMap.entries())
      .map(([date, stats]) => ({
        date,
        focusTime: stats.focusTime,
        breakTime: stats.breakTime,
        sessions: stats.sessions,
        efficiency: stats.efficiencyCount > 0 
          ? stats.efficiencySum / stats.efficiencyCount 
          : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return result;
  }

  async getTagStats(
    userId: UUID,
    limit: number = 10
  ): Promise<Array<{
    tag: string;
    count: number;
    totalFocusTime: number;
  }>> {
    const sessions = await this.findByUserId(userId);

    // 统计标签使用情况
    const tagStatsMap = new Map<string, {
      count: number;
      totalFocusTime: number;
    }>();

    sessions.forEach(session => {
      session.tags.forEach(tag => {
        if (!tagStatsMap.has(tag)) {
          tagStatsMap.set(tag, {
            count: 0,
            totalFocusTime: 0
          });
        }

        const stats = tagStatsMap.get(tag)!;
        stats.count += 1;
        stats.totalFocusTime += session.focusDuration.seconds;
      });
    });

    // 转换为数组并排序
    const result = Array.from(tagStatsMap.entries())
      .map(([tag, stats]) => ({
        tag,
        count: stats.count,
        totalFocusTime: stats.totalFocusTime
      }))
      .sort((a, b) => b.totalFocusTime - a.totalFocusTime)
      .slice(0, limit);

    return result;
  }

  async exportUserData(userId: UUID): Promise<string> {
    const sessions = await this.findByUserId(userId);
    const dailyStats = await this.getDailyStats(userId, 365);
    const tagStats = await this.getTagStats(userId);

    const exportData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      userId: userId.value,
      sessions: sessions.map(session => ({
        id: session.id?.value,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime?.toISOString(),
        mode: session.mode,
        states: session.states.map(state => ({
          state: state.state,
          startTime: state.startTime.toISOString(),
          endTime: state.endTime?.toISOString(),
          duration: state.duration.milliseconds,
          completed: state.completed
        })),
        efficiencyRating: session.efficiencyRating?.value,
        tags: session.tags,
        notes: session.notes
      })),
      dailyStats,
      tagStats
    };

    return JSON.stringify(exportData, null, 2);
  }

  async importUserData(userId: UUID, data: string): Promise<void> {
    try {
      const importData = JSON.parse(data);

      // 验证数据格式
      if (!importData.version || !importData.sessions) {
        throw new Error('Invalid data format');
      }

      // 导入会话数据
      for (const sessionData of importData.sessions) {
        const session = new TimerSession({
          id: sessionData.id ? UUID.fromString(sessionData.id) : UUID.generate(),
          userId,
          startTime: DateTime.fromISOString(sessionData.startTime),
          endTime: sessionData.endTime ? DateTime.fromISOString(sessionData.endTime) : undefined,
          mode: sessionData.mode,
          states: sessionData.states.map((stateData: any) => ({
            state: stateData.state,
            startTime: DateTime.fromISOString(stateData.startTime),
            endTime: stateData.endTime ? DateTime.fromISOString(stateData.endTime) : undefined,
            duration: new Duration(stateData.duration),
            completed: stateData.completed
          })),
          efficiencyRating: sessionData.efficiencyRating 
            ? new EfficiencyRating(sessionData.efficiencyRating) 
            : undefined,
          tags: sessionData.tags || [],
          notes: sessionData.notes
        });

        await this.save(session);
      }

      console.log(`Imported ${importData.sessions.length} sessions for user ${userId.value}`);
    } catch (error) {
      console.error('Failed to import user data:', error);
      throw error;
    }
  }

  /**
   * 将会话实体转换为记录
   */
  private sessionToRecord(session: TimerSession): TimerSessionRecord {
    return {
      id: session.id?.value || UUID.generate().value,
      userId: session.userId?.value,
      startTime: session.startTime.toISOString(),
      endTime: session.endTime?.toISOString(),
      mode: session.mode,
      states: session.states.map(state => ({
        state: state.state,
        startTime: state.startTime.toISOString(),
        endTime: state.endTime?.toISOString(),
        duration: state.duration.milliseconds,
        completed: state.completed
      })),
      efficiencyRating: session.efficiencyRating?.value,
      tags: session.tags,
      notes: session.notes
    };
  }

  /**
   * 将记录转换为会话实体
   */
  private recordToSession(record: TimerSessionRecord): TimerSession {
    return new TimerSession({
      id: UUID.fromString(record.id),
      userId: record.userId ? UUID.fromString(record.userId) : undefined,
      startTime: DateTime.fromISOString(record.startTime),
      endTime: record.endTime ? DateTime.fromISOString(record.endTime) : undefined,
      mode: record.mode,
      states: record.states.map(state => ({
        state: state.state,
        startTime: DateTime.fromISOString(state.startTime),
        endTime: state.endTime ? DateTime.fromISOString(state.endTime) : undefined,
        duration: new Duration(state.duration),
        completed: state.completed
      })),
      efficiencyRating: record.efficiencyRating 
        ? new EfficiencyRating(record.efficiencyRating) 
        : undefined,
      tags: record.tags,
      notes: record.notes
    });
  }
}
