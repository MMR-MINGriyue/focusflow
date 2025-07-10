import Database from '@tauri-apps/plugin-sql';
import { logError } from '../utils/errorHandler';

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

export interface DailyStats {
  date: string;
  total_focus_time: number;
  total_break_time: number;
  total_micro_breaks: number;
  average_efficiency: number;
  session_count: number;
}

class DatabaseService {
  private db: Database | null = null;
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
    try {
      // 连接到 SQLite 数据库
      this.db = await Database.load('sqlite:focusflow.db');

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

    const settings = await this.db!.select<AppSetting[]>(
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
}

// 导出单例实例
export const databaseService = new DatabaseService();
