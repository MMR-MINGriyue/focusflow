/**
 * 状态管理统一入口
 * 使用 Zustand 进行状态管理
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// 计时器状态
interface TimerState {
  isRunning: boolean;
  timeLeft: number;
  mode: 'classic' | 'smart' | 'custom';
  duration: number;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  setMode: (mode: 'classic' | 'smart' | 'custom') => void;
  setDuration: (duration: number) => void;
  setTimeLeft: (time: number) => void;
}

// 创建计时器 store
export const useTimerStore = create<TimerState>()(
  devtools(
    persist(
      (set) => ({
        isRunning: false,
        timeLeft: 25 * 60, // 默认25分钟
        mode: 'classic',
        duration: 25 * 60,
        startTimer: () => set({ isRunning: true }),
        stopTimer: () => set({ isRunning: false }),
        resetTimer: () => set({ timeLeft: 25 * 60, isRunning: false }),
        setMode: (mode) => set({ mode }),
        setDuration: (duration) => set({ duration, timeLeft: duration }),
        setTimeLeft: (time) => set({ timeLeft }),
      }),
      {
        name: 'timer-storage',
        partialize: (state) => ({ mode: state.mode, duration: state.duration }),
      }
    ),
    { name: 'timer-store' }
  )
);

// 主题状态
interface ThemeState {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

// 创建主题 store
export const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set) => ({
        theme: 'system',
        setTheme: (theme) => set({ theme }),
      }),
      {
        name: 'theme-storage',
      }
    ),
    { name: 'theme-store' }
  )
);

// 设置状态
interface SettingsState {
  notifications: boolean;
  sounds: boolean;
  volume: number;
  language: string;
  setNotifications: (enabled: boolean) => void;
  setSounds: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  setLanguage: (language: string) => void;
}

// 创建设置 store
export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set) => ({
        notifications: true,
        sounds: true,
        volume: 0.7,
        language: 'zh-CN',
        setNotifications: (enabled) => set({ notifications: enabled }),
        setSounds: (enabled) => set({ sounds: enabled }),
        setVolume: (volume) => set({ volume }),
        setLanguage: (language) => set({ language }),
      }),
      {
        name: 'settings-storage',
      }
    ),
    { name: 'settings-store' }
  )
);

// 任务状态
interface TaskState {
  tasks: Array<{
    id: string;
    title: string;
    completed: boolean;
    pomodoros: number;
    estimatedPomodoros: number;
  }>;
  addTask: (task: Omit<TaskState['tasks'][0], 'id'>) => void;
  updateTask: (id: string, updates: Partial<TaskState['tasks'][0]>) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompletion: (id: string) => void;
}

// 创建任务 store
export const useTaskStore = create<TaskState>()(
  devtools(
    persist(
      (set, get) => ({
        tasks: [],
        addTask: (task) => {
          const newTask = {
            ...task,
            id: Date.now().toString(),
          };
          set((state) => ({
            tasks: [...state.tasks, newTask],
          }));
        },
        updateTask: (id, updates) => {
          set((state) => ({
            tasks: state.tasks.map((task) =>
              task.id === id ? { ...task, ...updates } : task
            ),
          }));
        },
        deleteTask: (id) => {
          set((state) => ({
            tasks: state.tasks.filter((task) => task.id !== id),
          }));
        },
        toggleTaskCompletion: (id) => {
          set((state) => ({
            tasks: state.tasks.map((task) =>
              task.id === id ? { ...task, completed: !task.completed } : task
            ),
          }));
        },
      }),
      {
        name: 'tasks-storage',
      }
    ),
    { name: 'tasks-store' }
  )
);

// 统计状态
interface StatsState {
  dailyStats: Array<{
    date: string;
    completedPomodoros: number;
    totalFocusTime: number;
  }>;
  weeklyStats: Array<{
    week: string;
    completedPomodoros: number;
    totalFocusTime: number;
  }>;
  monthlyStats: Array<{
    month: string;
    completedPomodoros: number;
    totalFocusTime: number;
  }>;
  addDailyStat: (date: string, completedPomodoros: number, totalFocusTime: number) => void;
  addWeeklyStat: (week: string, completedPomodoros: number, totalFocusTime: number) => void;
  addMonthlyStat: (month: string, completedPomodoros: number, totalFocusTime: number) => void;
}

// 创建统计 store
export const useStatsStore = create<StatsState>()(
  devtools(
    persist(
      (set, get) => ({
        dailyStats: [],
        weeklyStats: [],
        monthlyStats: [],
        addDailyStat: (date, completedPomodoros, totalFocusTime) => {
          set((state) => {
            const existingIndex = state.dailyStats.findIndex(stat => stat.date === date);
            if (existingIndex >= 0) {
              const updatedStats = [...state.dailyStats];
              updatedStats[existingIndex] = {
                date,
                completedPomodoros,
                totalFocusTime,
              };
              return { dailyStats: updatedStats };
            }
            return {
              dailyStats: [...state.dailyStats, { date, completedPomodoros, totalFocusTime }],
            };
          });
        },
        addWeeklyStat: (week, completedPomodoros, totalFocusTime) => {
          set((state) => {
            const existingIndex = state.weeklyStats.findIndex(stat => stat.week === week);
            if (existingIndex >= 0) {
              const updatedStats = [...state.weeklyStats];
              updatedStats[existingIndex] = {
                week,
                completedPomodoros,
                totalFocusTime,
              };
              return { weeklyStats: updatedStats };
            }
            return {
              weeklyStats: [...state.weeklyStats, { week, completedPomodoros, totalFocusTime }],
            };
          });
        },
        addMonthlyStat: (month, completedPomodoros, totalFocusTime) => {
          set((state) => {
            const existingIndex = state.monthlyStats.findIndex(stat => stat.month === month);
            if (existingIndex >= 0) {
              const updatedStats = [...state.monthlyStats];
              updatedStats[existingIndex] = {
                month,
                completedPomodoros,
                totalFocusTime,
              };
              return { monthlyStats: updatedStats };
            }
            return {
              monthlyStats: [...state.monthlyStats, { month, completedPomodoros, totalFocusTime }],
            };
          });
        },
      }),
      {
        name: 'stats-storage',
      }
    ),
    { name: 'stats-store' }
  )
);

// 初始化状态管理
export function initializeStore(): void {
  // 初始化所有 store
  useTimerStore.getState();
  useThemeStore.getState();
  useSettingsStore.getState();
  useTaskStore.getState();
  useStatsStore.getState();

  console.log('State management initialized');

  // 加载unifiedTimerStore中的数据
  import('../stores/unifiedTimerStore').then(({ useUnifiedTimerStore }) => {
    useUnifiedTimerStore.getState().loadFromStorage().catch(error => {
      console.error('Failed to load timer data:', error);
    });
  }).catch(error => {
    console.error('Failed to import unifiedTimerStore:', error);
  });
}
