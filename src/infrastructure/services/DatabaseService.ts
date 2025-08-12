/**
 * 数据库服务实现
 * 处理应用中的所有数据存储和检索功能
 */

import { IDatabaseService } from './ServiceInterfaces';

// 会话数据接口
export interface SessionData {
  id?: number;
  startTime: number;
  endTime?: number;
  focusTime: number;
  breakTime: number;
  microBreaks: number;
  mode: 'classic' | 'smart';
  efficiency?: number;
  tags?: string[];
}

// 统计数据接口
export interface StatsData {
  totalFocusTime: number;
  totalBreakTime: number;
  totalSessions: number;
  averageSessionLength: number;
  averageEfficiency: number;
  dailyStats: {
    date: string;
    focusTime: number;
    breakTime: number;
    sessions: number;
    efficiency: number;
  }[];
}

export class DatabaseService implements IDatabaseService {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'FocusFlowDB';
  private readonly DB_VERSION = 1;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 打开或创建IndexedDB数据库
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      return new Promise<void>((resolve, reject) => {
        request.onerror = (event) => {
          console.error('Database error:', event);
          reject(new Error('Failed to open database'));
        };

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          this.initialized = true;
          console.log('Database service initialized successfully');
          resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // 创建会话存储
          if (!db.objectStoreNames.contains('sessions')) {
            const sessionStore = db.createObjectStore('sessions', { 
              keyPath: 'id', 
              autoIncrement: true 
            });
            sessionStore.createIndex('startTime', 'startTime', { unique: false });
            sessionStore.createIndex('mode', 'mode', { unique: false });
          }

          // 创建统计存储
          if (!db.objectStoreNames.contains('stats')) {
            const statsStore = db.createObjectStore('stats', { keyPath: 'date' });
          }

          // 创建设置存储
          if (!db.objectStoreNames.contains('settings')) {
            const settingsStore = db.createObjectStore('settings', { keyPath: 'key' });
          }
        };
      });
    } catch (error) {
      console.error('Failed to initialize database service:', error);
      throw error;
    }
  }

  async saveSession(session: SessionData): Promise<number> {
    if (!this.db || !this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      // 添加结束时间（如果未提供）
      const sessionToSave = {
        ...session,
        endTime: session.endTime || Date.now()
      };

      return new Promise<number>((resolve, reject) => {
        const transaction = this.db!.transaction(['sessions'], 'readwrite');
        const store = transaction.objectStore('sessions');
        const request = store.add(sessionToSave);

        request.onsuccess = (event) => {
          const id = (event.target as IDBRequest<number>).result;
          console.log(`Session saved with ID: ${id}`);
          resolve(id);
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

  async loadSessions(days: number = 7): Promise<SessionData[]> {
    if (!this.db || !this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      // 计算日期范围
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - days);
      const startTime = startDate.getTime();

      return new Promise<SessionData[]>((resolve, reject) => {
        const transaction = this.db!.transaction(['sessions'], 'readonly');
        const store = transaction.objectStore('sessions');
        const index = store.index('startTime');
        const range = IDBKeyRange.lowerBound(startTime);
        const request = index.openCursor(range);

        const sessions: SessionData[] = [];

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

          if (cursor) {
            sessions.push(cursor.value as SessionData);
            cursor.continue();
          } else {
            // 按开始时间降序排序
            sessions.sort((a, b) => b.startTime - a.startTime);
            resolve(sessions);
          }
        };

        request.onerror = (event) => {
          console.error('Failed to load sessions:', event);
          reject(new Error('Failed to load sessions'));
        };
      });
    } catch (error) {
      console.error('Failed to load sessions:', error);
      throw error;
    }
  }

  async updateSessionEfficiency(sessionId: number, efficiency: number): Promise<void> {
    if (!this.db || !this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      return new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction(['sessions'], 'readwrite');
        const store = transaction.objectStore('sessions');
        const request = store.get(sessionId);

        request.onsuccess = (event) => {
          const session = (event.target as IDBRequest<SessionData>).result;

          if (session) {
            session.efficiency = efficiency;
            const updateRequest = store.put(session);

            updateRequest.onsuccess = () => {
              console.log(`Session ${sessionId} efficiency updated to ${efficiency}`);
              resolve();
            };

            updateRequest.onerror = (event) => {
              console.error('Failed to update session efficiency:', event);
              reject(new Error('Failed to update session efficiency'));
            };
          } else {
            reject(new Error('Session not found'));
          }
        };

        request.onerror = (event) => {
          console.error('Failed to get session:', event);
          reject(new Error('Failed to get session'));
        };
      });
    } catch (error) {
      console.error('Failed to update session efficiency:', error);
      throw error;
    }
  }

  async getStats(): Promise<StatsData> {
    if (!this.db || !this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      // 加载最近30天的会话数据
      const sessions = await this.loadSessions(30);

      // 计算统计数据
      const totalFocusTime = sessions.reduce((sum, session) => sum + session.focusTime, 0);
      const totalBreakTime = sessions.reduce((sum, session) => sum + session.breakTime, 0);
      const totalSessions = sessions.length;
      const averageSessionLength = totalSessions > 0 ? totalFocusTime / totalSessions : 0;

      // 计算平均效率
      const efficiencyScores = sessions
        .filter(session => session.efficiency !== undefined)
        .map(session => session.efficiency!);
      const averageEfficiency = efficiencyScores.length > 0 
        ? efficiencyScores.reduce((sum, score) => sum + score, 0) / efficiencyScores.length 
        : 0;

      // 按日期分组统计
      const dailyStatsMap = new Map<string, {
        focusTime: number;
        breakTime: number;
        sessions: number;
        efficiencySum: number;
        efficiencyCount: number;
      }>();

      sessions.forEach(session => {
        const date = new Date(session.startTime).toISOString().split('T')[0];

        if (!dailyStatsMap.has(date)) {
          dailyStatsMap.set(date, {
            focusTime: 0,
            breakTime: 0,
            sessions: 0,
            efficiencySum: 0,
            efficiencyCount: 0
          });
        }

        const stats = dailyStatsMap.get(date)!;
        stats.focusTime += session.focusTime;
        stats.breakTime += session.breakTime;
        stats.sessions += 1;

        if (session.efficiency !== undefined) {
          stats.efficiencySum += session.efficiency;
          stats.efficiencyCount += 1;
        }
      });

      // 转换为数组并排序
      const dailyStats = Array.from(dailyStatsMap.entries())
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

      return {
        totalFocusTime,
        totalBreakTime,
        totalSessions,
        averageSessionLength,
        averageEfficiency,
        dailyStats
      };
    } catch (error) {
      console.error('Failed to get stats:', error);
      throw error;
    }
  }

  async clearAllData(): Promise<void> {
    if (!this.db || !this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      const stores = ['sessions', 'stats', 'settings'];

      for (const storeName of stores) {
        await new Promise<void>((resolve, reject) => {
          const transaction = this.db!.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.clear();

          request.onsuccess = () => {
            console.log(`Cleared data from ${storeName}`);
            resolve();
          };

          request.onerror = (event) => {
            console.error(`Failed to clear data from ${storeName}:`, event);
            reject(new Error(`Failed to clear data from ${storeName}`));
          };
        });
      }

      console.log('All data cleared successfully');
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw error;
    }
  }

  async exportData(): Promise<string> {
    if (!this.db || !this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      const exportData: any = {
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      // 导出会话数据
      exportData.sessions = await this.loadSessions(365); // 导出一年数据

      // 导出统计数据
      exportData.stats = await this.getStats();

      // 导出设置
      exportData.settings = await new Promise<any>((resolve, reject) => {
        const transaction = this.db!.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        const request = store.getAll();

        request.onsuccess = (event) => {
          const settings = (event.target as IDBRequest<any[]>).result;
          const settingsObj: any = {};
          settings.forEach(setting => {
            settingsObj[setting.key] = setting.value;
          });
          resolve(settingsObj);
        };

        request.onerror = (event) => {
          console.error('Failed to export settings:', event);
          reject(new Error('Failed to export settings'));
        };
      });

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }

  async importData(data: string): Promise<void> {
    if (!this.db || !this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      const importData = JSON.parse(data);

      // 验证数据格式
      if (!importData.version || !importData.timestamp) {
        throw new Error('Invalid data format');
      }

      // 清空现有数据
      await this.clearAllData();

      // 导入会话数据
      if (importData.sessions && Array.isArray(importData.sessions)) {
        for (const session of importData.sessions) {
          // 移除id属性以便自动生成新的id
          const { id, ...sessionToSave } = session;
          await this.saveSession(sessionToSave);
        }
      }

      // 导入设置
      if (importData.settings && typeof importData.settings === 'object') {
        const transaction = this.db!.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');

        for (const [key, value] of Object.entries(importData.settings)) {
          await new Promise<void>((resolve, reject) => {
            const request = store.add({ key, value });

            request.onsuccess = () => resolve();
            request.onerror = (event) => {
              console.error(`Failed to import setting ${key}:`, event);
              reject(new Error(`Failed to import setting ${key}`));
            };
          });
        }
      }

      console.log('Data imported successfully');
    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    }
  }
}
