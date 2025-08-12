/**
 * 统计数据状态管理
 * 使用 Zustand 管理应用统计数据状态
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getStats, saveStats } from '../utils/storageUtils';

// 时间段统计数据接口
interface TimeStats {
  focusSessions: number;       // 专注会话数
  totalFocusTime: number;      // 总专注时间（分钟）
  completedSessions: number;   // 完成的会话数
  averageFocusDuration: number; // 平均专注时长（分钟）
  efficiencyScore: number;     // 效率评分（0-100）
}

// 历史记录接口
interface SessionHistoryItem {
  date: string;      // 日期，格式为 YYYY-MM-DD
  focusTime: number; // 专注时间（分钟）
  sessions: number;  // 会话数
  efficiencyScore?: number; // 效率评分（0-100）
}

// 完整统计数据接口
interface StatsData {
  daily: TimeStats;           // 日统计数据
  weekly: TimeStats;          // 周统计数据
  monthly: TimeStats;         // 月统计数据
  allTime: TimeStats;         // 全部时间统计数据
  focusStreak: number;        // 当前专注连续天数
  longestStreak: number;      // 最长专注连续天数
  sessionHistory: SessionHistoryItem[]; // 会话历史记录
}

// 会话数据接口
interface SessionData {
  date: string;              // 日期，格式为 YYYY-MM-DD
  duration: number;          // 持续时间（分钟）
  completed: boolean;        // 是否完成
  efficiencyScore: number;   // 效率评分（0-100）
}

// 状态接口
interface StatsState {
  stats: StatsData | null;   // 统计数据
  isLoading: boolean;        // 加载状态
  error: string | null;      // 错误信息

  // 操作方法
  loadStats: () => Promise<void>;          // 加载统计数据
  setStats: (stats: StatsData) => void;    // 设置统计数据
  updateStats: (session: SessionData) => void; // 更新统计数据
  updateStreak: (increment: boolean) => void; // 更新连续天数
  calculateEfficiencyScore: (duration: number, completed: boolean, distractions: number) => number; // 计算效率评分
  reset: () => void;                       // 重置状态
  setError: (error: string) => void;       // 设置错误
  clearError: () => void;                  // 清除错误
}

// 默认统计数据
const defaultStats: StatsData = {
  daily: {
    focusSessions: 0,
    totalFocusTime: 0,
    completedSessions: 0,
    averageFocusDuration: 0,
    efficiencyScore: 0,
  },
  weekly: {
    focusSessions: 0,
    totalFocusTime: 0,
    completedSessions: 0,
    averageFocusDuration: 0,
    efficiencyScore: 0,
  },
  monthly: {
    focusSessions: 0,
    totalFocusTime: 0,
    completedSessions: 0,
    averageFocusDuration: 0,
    efficiencyScore: 0,
  },
  allTime: {
    focusSessions: 0,
    totalFocusTime: 0,
    completedSessions: 0,
    averageFocusDuration: 0,
    efficiencyScore: 0,
  },
  focusStreak: 0,
  longestStreak: 0,
  sessionHistory: [],
};

// 创建统计存储
export const statsStore = create<StatsState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      stats: null,
      isLoading: false,
      error: null,

      // 加载统计数据
      loadStats: async () => {
        set({ isLoading: true, error: null });

        try {
          const savedStats = await getStats();

          set({
            stats: savedStats || defaultStats,
            isLoading: false
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load stats',
            isLoading: false
          });
        }
      },

      // 设置统计数据
      setStats: (stats: StatsData) => {
        set({ stats });
      },

      // 更新统计数据
      updateStats: (session: SessionData) => {
        const currentState = get().stats;
        if (!currentState) return;

        // 创建新的统计数据对象
        const updatedStats = { ...currentState };

        // 更新日统计数据
        updatedStats.daily = {
          focusSessions: updatedStats.daily.focusSessions + 1,
          totalFocusTime: updatedStats.daily.totalFocusTime + session.duration,
          completedSessions: session.completed 
            ? updatedStats.daily.completedSessions + 1 
            : updatedStats.daily.completedSessions,
          averageFocusDuration: Math.round(
            (updatedStats.daily.totalFocusTime + session.duration) / 
            (updatedStats.daily.focusSessions + 1)
          ),
          efficiencyScore: Math.round(
            (updatedStats.daily.efficiencyScore * updatedStats.daily.focusSessions + session.efficiencyScore) /
            (updatedStats.daily.focusSessions + 1)
          ),
        };

        // 更新周统计数据
        updatedStats.weekly = {
          focusSessions: updatedStats.weekly.focusSessions + 1,
          totalFocusTime: updatedStats.weekly.totalFocusTime + session.duration,
          completedSessions: session.completed 
            ? updatedStats.weekly.completedSessions + 1 
            : updatedStats.weekly.completedSessions,
          averageFocusDuration: Math.round(
            (updatedStats.weekly.totalFocusTime + session.duration) / 
            (updatedStats.weekly.focusSessions + 1)
          ),
          efficiencyScore: Math.round(
            (updatedStats.weekly.efficiencyScore * updatedStats.weekly.focusSessions + session.efficiencyScore) /
            (updatedStats.weekly.focusSessions + 1)
          ),
        };

        // 更新月统计数据
        updatedStats.monthly = {
          focusSessions: updatedStats.monthly.focusSessions + 1,
          totalFocusTime: updatedStats.monthly.totalFocusTime + session.duration,
          completedSessions: session.completed 
            ? updatedStats.monthly.completedSessions + 1 
            : updatedStats.monthly.completedSessions,
          averageFocusDuration: Math.round(
            (updatedStats.monthly.totalFocusTime + session.duration) / 
            (updatedStats.monthly.focusSessions + 1)
          ),
          efficiencyScore: Math.round(
            (updatedStats.monthly.efficiencyScore * updatedStats.monthly.focusSessions + session.efficiencyScore) /
            (updatedStats.monthly.focusSessions + 1)
          ),
        };

        // 更新全部时间统计数据
        updatedStats.allTime = {
          focusSessions: updatedStats.allTime.focusSessions + 1,
          totalFocusTime: updatedStats.allTime.totalFocusTime + session.duration,
          completedSessions: session.completed 
            ? updatedStats.allTime.completedSessions + 1 
            : updatedStats.allTime.completedSessions,
          averageFocusDuration: Math.round(
            (updatedStats.allTime.totalFocusTime + session.duration) / 
            (updatedStats.allTime.focusSessions + 1)
          ),
          efficiencyScore: Math.round(
            (updatedStats.allTime.efficiencyScore * updatedStats.allTime.focusSessions + session.efficiencyScore) /
            (updatedStats.allTime.focusSessions + 1)
          ),
        };

        // 更新会话历史
        const existingHistoryIndex = updatedStats.sessionHistory.findIndex(
          item => item.date === session.date
        );

        if (existingHistoryIndex >= 0) {
          // 更新现有历史记录
          updatedStats.sessionHistory[existingHistoryIndex] = {
            date: session.date,
            focusTime: updatedStats.sessionHistory[existingHistoryIndex].focusTime + session.duration,
            sessions: updatedStats.sessionHistory[existingHistoryIndex].sessions + 1,
          };
        } else {
          // 添加新的历史记录
          updatedStats.sessionHistory.push({
            date: session.date,
            focusTime: session.duration,
            sessions: 1,
          });

          // 按日期排序（最新的在前）
          updatedStats.sessionHistory.sort((a, b) => b.date.localeCompare(a.date));

          // 限制历史记录数量
          if (updatedStats.sessionHistory.length > 30) {
            updatedStats.sessionHistory = updatedStats.sessionHistory.slice(0, 30);
          }
        }

        // 更新状态
        set({ stats: updatedStats });

        // 保存到存储
        saveStats(updatedStats).catch((error) => {
          console.error('Failed to save stats:', error);
        });
      },

      // 更新连续天数
      updateStreak: (increment: boolean) => {
        const currentState = get().stats;
        if (!currentState) return;

        const updatedStats = { ...currentState };

        if (increment) {
          // 增加连续天数
          updatedStats.focusStreak += 1;

          // 更新最长连续天数
          if (updatedStats.focusStreak > updatedStats.longestStreak) {
            updatedStats.longestStreak = updatedStats.focusStreak;
          }
        } else {
          // 重置连续天数
          updatedStats.focusStreak = 0;
        }

        // 更新状态
        set({ stats: updatedStats });

        // 保存到存储
        saveStats(updatedStats).catch((error) => {
          console.error('Failed to save stats:', error);
        });
      },

      // 计算效率评分
      calculateEfficiencyScore: (duration: number, completed: boolean, distractions: number): number => {
        // 基础分数
        let score = 50;

        // 完成奖励
        if (completed) {
          score += 30;
        }

        // 时长奖励（基于25分钟的标准时长）
        const durationRatio = Math.min(duration / 25, 2);
        score += durationRatio * 10;

        // 分心惩罚
        score -= Math.min(distractions * 5, 20);

        // 确保分数在0-100范围内
        return Math.max(0, Math.min(100, Math.round(score)));
      },

      // 重置状态
      reset: () => {
        set({
          stats: null,
          isLoading: false,
          error: null
        });
      },

      // 设置错误
      setError: (error: string) => {
        set({ error });
      },

      // 清除错误
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'focusflow-stats'
    }
  )
);

// 初始化统计数据
statsStore.getState().loadStats();

// 导出 hook
export const useStatsStore = () => statsStore();
