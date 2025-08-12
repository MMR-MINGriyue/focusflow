import { logError } from '../utils/errorHandler';
import { isTauriEnvironment } from '../utils/environment';

// 数据库接口类型定义
export interface FocusSession {
  id?: number;
  date: string;
  focus_duration: number;
  break_duration: number;
  micro_breaks: number;
  efficiency_score: number;
  created_at?: string;
}

export interface AppSetting {
  key: string;
  value: string;
  updated_at?: string;
}

// 模拟数据库接口
class MockDatabase {
  private data: Map<string, any[]> = new Map();
  private counter: number = 1;

  async execute(query: string, params?: any[]): Promise<any> {
    console.log('Mock DB execute:', query, params);
    
    // 简单解析SQL语句
    if (query.includes('CREATE TABLE')) {
      const tableName = query.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
      if (tableName && !this.data.has(tableName)) {
        this.data.set(tableName, []);
      }
      return { lastInsertId: 0, rowsAffected: 0 };
    }
    
    if (query.includes('INSERT INTO')) {
      const tableName = query.match(/INSERT INTO (\w+)/)?.[1];
      if (tableName && this.data.has(tableName)) {
        const table = this.data.get(tableName)!;
        const id = this.counter++;
        const row = { id, ...params };
        table.push(row);
        return { lastInsertId: id, rowsAffected: 1 };
      }
      return { lastInsertId: 0, rowsAffected: 0 };
    }
    
    if (query.includes('SELECT')) {
      const tableName = query.match(/FROM (\w+)/)?.[1];
      if (tableName && this.data.has(tableName)) {
        const table = this.data.get(tableName)!;
        // 简单实现，实际应用中需要更复杂的SQL解析
        if (query.includes('WHERE date = ?') && params?.length) {
          return table.filter((row: any) => row.date === params[0]);
        }
        return table;
      }
      return [];
    }
    
    if (query.includes('UPDATE')) {
      // 简化实现
      return { rowsAffected: 1 };
    }
    
    if (query.includes('DELETE')) {
      // 简化实现
      return { rowsAffected: 1 };
    }
    
    return { lastInsertId: 0, rowsAffected: 0 };
  }
  
  async select<T>(query: string, params?: any[]): Promise<T[]> {
    return this.execute(query, params) as Promise<T[]>;
  }
  
  async load(dbPath: string): Promise<MockDatabase> {
    console.log('Mock DB load:', dbPath);
    // 尝试从localStorage加载数据
    try {
      const savedData = localStorage.getItem('focusflow_db');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        this.data = new Map(Object.entries(parsed));
        // 计算最大ID
        let maxId = 1;
        for (const [, rows] of this.data) {
          for (const row of rows) {
            if (row.id && row.id > maxId) maxId = row.id;
          }
        }
        this.counter = maxId + 1;
      }
    } catch (e) {
      console.error('Failed to load data from localStorage:', e);
    }
    return this;
  }
  
  saveToLocalStorage() {
    try {
      const obj = Object.fromEntries(this.data);
      localStorage.setItem('focusflow_db', JSON.stringify(obj));
    } catch (e) {
      console.error('Failed to save data to localStorage:', e);
    }
  }
}

export interface DailyStats {
  date: string;
  total_focus_time: number;
  total_break_time: number;
  total_micro_breaks: number;
  average_efficiency: number;
  session_count: number;
}

class DatabaseService {
  private db: MockDatabase | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * 初始化数据库连接
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // 防止重复初始化
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.doInitialize();
    return this.initializationPromise;
  }

  private async doInitialize(): Promise<void> {
    // 检查是否在Tauri环境中
    if (!isTauriEnvironment()) {
      console.warn('Database initialization skipped: not in Tauri environment');
      // 在浏览器环境中，标记为已初始化但不实际连接数据库
      this.isInitialized = true;
      return;
    }

    try {
      // 连接到模拟数据库
      this.db = await new MockDatabase().load('sqlite:focusflow.db');

      // 创建表结构
      await this.createTables();

      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      const errorId = logError(error instanceof Error ? error : new Error(String(error)), {
        operation: 'database_initialize',
        dbPath: 'sqlite:focusflow.db'
      }, 'critical');

      console.error('Failed to initialize database:', error);

      // 重置状态以允许重试
      this.initializationPromise = null;
      this.isInitialized = false;
      this.db = null;

      throw new Error(`数据库初始化失败 (错误ID: ${errorId})`);
    }
  }

  /**
   * 创建数据库表结构
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // 创建专注会话表
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS focus_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        focus_duration INTEGER NOT NULL,
        break_duration INTEGER NOT NULL,
        micro_breaks INTEGER DEFAULT 0,
        efficiency_score REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建应用设置表
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建索引以提高查询性能
    await this.db.execute(`
      CREATE INDEX IF NOT EXISTS idx_sessions_date 
      ON focus_sessions(date)
    `);

    await this.db.execute(`
      CREATE INDEX IF NOT EXISTS idx_sessions_created_at 
      ON focus_sessions(created_at)
    `);
  }

  /**
   * 保存专注会话数据
   */
  async saveFocusSession(session: Omit<FocusSession, 'id' | 'created_at'>): Promise<number> {
    if (!isTauriEnvironment()) {
      console.warn('Database operation skipped: not in Tauri environment');
      return 0;
    }

    if (!this.db) await this.initialize();

    const result = await this.db!.execute(
      `INSERT INTO focus_sessions
       (date, focus_duration, break_duration, micro_breaks, efficiency_score)
       VALUES (?, ?, ?, ?, ?)`,
      [
        session.date,
        session.focus_duration,
        session.break_duration,
        session.micro_breaks,
        session.efficiency_score
      ]
    );
    
    // 保存到localStorage
    this.db!.saveToLocalStorage();

    return result.lastInsertId || 0;
  }

  /**
   * 获取指定日期的专注会话
   */
  async getFocusSessionsByDate(date: string): Promise<FocusSession[]> {
    if (!this.db) await this.initialize();

    const sessions = await this.db!.select<FocusSession[]>(
      'SELECT * FROM focus_sessions WHERE date = ? ORDER BY created_at DESC',
      [date]
    );

    return sessions;
  }

  /**
   * 获取日期范围内的专注会话
   */
  async getFocusSessionsByDateRange(startDate: string, endDate: string): Promise<FocusSession[]> {
    if (!isTauriEnvironment()) {
      console.warn('Database operation skipped: not in Tauri environment');
      return [];
    }

    if (!this.db) await this.initialize();

    const sessions = await this.db!.select<FocusSession[]>(
      'SELECT * FROM focus_sessions WHERE date BETWEEN ? AND ? ORDER BY created_at DESC',
      [startDate, endDate]
    );

    return sessions;
  }

  /**
   * 获取每日统计数据
   */
  async getDailyStats(date: string): Promise<DailyStats | null> {
    if (!isTauriEnvironment()) {
      console.warn('Database operation skipped: not in Tauri environment');
      return null;
    }

    if (!this.db) await this.initialize();

    const stats = await this.db!.select<DailyStats[]>(
      `SELECT
         date,
         SUM(focus_duration) as total_focus_time,
         SUM(break_duration) as total_break_time,
         SUM(micro_breaks) as total_micro_breaks,
         AVG(efficiency_score) as average_efficiency,
         COUNT(*) as session_count
       FROM focus_sessions
       WHERE date = ?
       GROUP BY date`,
      [date]
    );

    return stats.length > 0 ? stats[0] : null;
  }

  /**
   * 获取最近N天的统计数据
   */
  async getRecentStats(days: number = 7): Promise<DailyStats[]> {
    if (!isTauriEnvironment()) {
      console.warn('Database operation skipped: not in Tauri environment');
      return [];
    }

    if (!this.db) await this.initialize();

    const stats = await this.db!.select<DailyStats[]>(
      `SELECT
         date,
         SUM(focus_duration) as total_focus_time,
         SUM(break_duration) as total_break_time,
         SUM(micro_breaks) as total_micro_breaks,
         AVG(efficiency_score) as average_efficiency,
         COUNT(*) as session_count
       FROM focus_sessions
       WHERE date >= date('now', '-${days} days')
       GROUP BY date
       ORDER BY date DESC`,
      []
    );

    return stats;
  }

  /**
   * 更新专注会话的效率评分
   */
  async updateSessionEfficiency(sessionId: number, efficiency: number): Promise<void> {
    if (!this.db) await this.initialize();

    await this.db!.execute(
      'UPDATE focus_sessions SET efficiency_score = ? WHERE id = ?',
      [efficiency, sessionId]
    );
  }

  /**
   * 保存应用设置
   */
  async saveSetting(key: string, value: string): Promise<void> {
    if (!this.db) await this.initialize();

    await this.db!.execute(
      `INSERT OR REPLACE INTO app_settings (key, value, updated_at) 
       VALUES (?, ?, CURRENT_TIMESTAMP)`,
      [key, value]
    );
  }

  /**
   * 获取应用设置
   */
  async getSetting(key: string): Promise<string | null> {
    if (!isTauriEnvironment()) {
      console.warn('Database operation skipped: not in Tauri environment');
      return null;
    }

    if (!this.db) await this.initialize();

    const settings = await this.db!.select<AppSetting[]>(
      'SELECT value FROM app_settings WHERE key = ?',
      [key]
    );

    return settings.length > 0 ? settings[0].value : null;
  }

  /**
   * 获取所有应用设置
   */
  async getAllSettings(): Promise<Record<string, string>> {
    if (!this.db) await this.initialize();

    // 在非Tauri环境中，返回空对象
    if (!this.db) {
      return {};
    }

    const settings = await this.db.select<AppSetting[]>(
      'SELECT key, value FROM app_settings',
      []
    );

    const result: Record<string, string> = {};
    settings.forEach(setting => {
      result[setting.key] = setting.value;
    });

    return result;
  }

  /**
   * 删除指定日期之前的旧数据
   */
  async cleanupOldData(beforeDate: string): Promise<number> {
    if (!this.db) await this.initialize();

    const result = await this.db!.execute(
      'DELETE FROM focus_sessions WHERE date < ?',
      [beforeDate]
    );

    return result.rowsAffected;
  }

  /**
   * 获取数据库统计信息
   */
  async getDatabaseStats(): Promise<{
    totalSessions: number;
    totalFocusTime: number;
    totalBreakTime: number;
    totalMicroBreaks: number;
    averageEfficiency: number;
    firstSessionDate: string | null;
    lastSessionDate: string | null;
  }> {
    if (!isTauriEnvironment()) {
      console.warn('Database operation skipped: not in Tauri environment');
      return {
        totalSessions: 0,
        totalFocusTime: 0,
        totalBreakTime: 0,
        totalMicroBreaks: 0,
        averageEfficiency: 0,
        firstSessionDate: null,
        lastSessionDate: null,
      };
    }

    if (!this.db) await this.initialize();

    const stats = await this.db!.select<any[]>(
      `SELECT
         COUNT(*) as total_sessions,
         SUM(focus_duration) as total_focus_time,
         SUM(break_duration) as total_break_time,
         SUM(micro_breaks) as total_micro_breaks,
         AVG(efficiency_score) as average_efficiency,
         MIN(date) as first_session_date,
         MAX(date) as last_session_date
       FROM focus_sessions`,
      []
    );

    const result = stats[0] || {};
    return {
      totalSessions: result.total_sessions || 0,
      totalFocusTime: result.total_focus_time || 0,
      totalBreakTime: result.total_break_time || 0,
      totalMicroBreaks: result.total_micro_breaks || 0,
      averageEfficiency: result.average_efficiency || 0,
      firstSessionDate: result.first_session_date || null,
      lastSessionDate: result.last_session_date || null,
    };
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }

  /**
   * 保存会话数据（兼容unifiedTimerStore）
   */
  async saveSession(session: {
    startTime?: number;
    focusTime: number;
    breakTime: number;
    microBreaks: number;
    endTime?: number;
    mode?: string;
    efficiency?: number;
  }): Promise<number> {
    if (!isTauriEnvironment()) {
      console.warn('Database operation skipped: not in Tauri environment');
      return 0;
    }

    if (!this.db) await this.initialize();

    // 计算日期
    const date = new Date().toISOString().split('T')[0];

    const result = await this.db!.execute(
      `INSERT INTO focus_sessions
       (date, focus_duration, break_duration, micro_breaks, efficiency_score)
       VALUES (?, ?, ?, ?, ?)`,
      [
        date,
        session.focusTime,
        session.breakTime,
        session.microBreaks,
        session.efficiency || 0
      ]
    );

    // 保存到localStorage
    this.db!.saveToLocalStorage();

    return result.lastInsertId || 0;
  }

  /**
   * 获取最近N天的会话（兼容unifiedTimerStore）
   */
  async getRecentSessions(days: number = 7): Promise<any[]> {
    if (!isTauriEnvironment()) {
      console.warn('Database operation skipped: not in Tauri environment');
      return [];
    }

    if (!this.db) await this.initialize();

    const sessions = await this.db!.select<any[]>(
      `SELECT * FROM focus_sessions 
       WHERE date >= date('now', '-${days} days') 
       ORDER BY created_at DESC`,
      []
    );

    return sessions;
  }

  /**
   * 获取数据库统计信息（兼容unifiedTimerStore）
   */
  async getStats(): Promise<{
    totalSessions: number;
    totalFocusTime: number;
    totalBreakTime: number;
    averageEfficiency: number;
    bestDay: any;
  }> {
    if (!isTauriEnvironment()) {
      console.warn('Database operation skipped: not in Tauri environment');
      return {
        totalSessions: 0,
        totalFocusTime: 0,
        totalBreakTime: 0,
        averageEfficiency: 0,
        bestDay: null
      };
    }

    if (!this.db) await this.initialize();

    // 获取总体统计
    const totalStats = await this.db!.select<any[]>(
      `SELECT
         COUNT(*) as total_sessions,
         SUM(focus_duration) as total_focus_time,
         SUM(break_duration) as total_break_time,
         AVG(efficiency_score) as average_efficiency
       FROM focus_sessions`,
      []
    );

    const stats = totalStats[0] || {};

    // 获取最佳效率的一天
    const bestDayResult = await this.db!.select<any[]>(
      `SELECT 
         date,
         AVG(efficiency_score) as avg_efficiency,
         SUM(focus_duration) as total_focus
       FROM focus_sessions 
       GROUP BY date 
       ORDER BY avg_efficiency DESC 
       LIMIT 1`,
      []
    );

    const bestDay = bestDayResult.length > 0 ? bestDayResult[0] : null;

    return {
      totalSessions: stats.total_sessions || 0,
      totalFocusTime: stats.total_focus_time || 0,
      totalBreakTime: stats.total_break_time || 0,
      averageEfficiency: stats.average_efficiency || 0,
      bestDay: bestDay
    };
  }
}

// 导出单例实例
// 导出类而不是实例，避免在模块加载时立即执行构造函数
export { DatabaseService };

// 提供获取单例实例的函数，延迟初始化
let databaseInstance: DatabaseService | null = null;

export const getDatabaseService = (): DatabaseService => {
  if (!databaseInstance) {
    databaseInstance = new DatabaseService();
  }
  return databaseInstance;
};
