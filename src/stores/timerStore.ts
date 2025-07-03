import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { cryptoService } from '../services/crypto';
import { soundService } from '../services/sound';
import { notificationService } from '../services/notification';
import { databaseService, type DailyStats } from '../services/database';

export type TimerState = 'focus' | 'break' | 'microBreak';

export interface TimerSettings {
  focusDuration: number;
  breakDuration: number;
  microBreakMinInterval: number;
  microBreakMaxInterval: number;
  microBreakDuration: number;
  soundEnabled: boolean;
  notificationEnabled: boolean;
  volume: number;
}

interface TimerStore {
  // 状态
  currentState: TimerState;
  timeLeft: number;
  isActive: boolean;
  settings: TimerSettings;
  
  // 微休息相关
  nextMicroBreakInterval: number;
  lastMicroBreakTime: number;
  focusStartTime: number;
  
  // 统计数据
  todayStats: {
    focusTime: number;
    breakTime: number;
    microBreaks: number;
    efficiency: number;
  };

  // 当前会话数据
  currentSession: {
    id: number | null;
    startTime: number;
    focusTime: number;
    breakTime: number;
    microBreaks: number;
  };

  // 历史数据
  recentSessions: DailyStats[];
  isLoadingData: boolean;
  
  // Actions
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  transitionTo: (newState: TimerState) => void;
  updateSettings: (newSettings: Partial<TimerSettings>) => void;
  updateTimeLeft: (time: number) => void;
  
  // 微休息相关
  scheduleNextMicroBreak: () => void;
  triggerMicroBreak: () => void;
  checkMicroBreakTrigger: () => boolean;
  
  // 统计相关
  updateTodayStats: (type: 'focus' | 'break' | 'microBreak', duration: number) => void;
  updateEfficiency: (score: number) => void;
  
  // 持久化
  saveToStorage: () => Promise<void>;
  loadFromStorage: () => Promise<void>;

  // 数据库操作
  initializeDatabase: () => Promise<void>;
  saveCurrentSession: () => Promise<void>;
  loadRecentSessions: (days?: number) => Promise<void>;
  updateSessionEfficiency: (sessionId: number, efficiency: number) => Promise<void>;
  getDatabaseStats: () => Promise<any>;
}

const defaultSettings: TimerSettings = {
  focusDuration: 90,
  breakDuration: 20,
  microBreakMinInterval: 10,
  microBreakMaxInterval: 30,
  microBreakDuration: 3,
  soundEnabled: true,
  notificationEnabled: true,
  volume: 0.5,
};

export const useTimerStore = create<TimerStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // 初始状态
      currentState: 'focus',
      timeLeft: defaultSettings.focusDuration * 60,
      isActive: false,
      settings: defaultSettings,
      
      nextMicroBreakInterval: 0,
      lastMicroBreakTime: 0,
      focusStartTime: 0,
      
      todayStats: {
        focusTime: 0,
        breakTime: 0,
        microBreaks: 0,
        efficiency: 0,
      },

      currentSession: {
        id: null,
        startTime: 0,
        focusTime: 0,
        breakTime: 0,
        microBreaks: 0,
      },

      recentSessions: [],
      isLoadingData: false,
      
      // 计时器控制
      startTimer: () => set((state) => {
        state.isActive = true;
        if (state.currentState === 'focus' && state.focusStartTime === 0) {
          state.focusStartTime = Date.now();
          if (state.nextMicroBreakInterval === 0) {
            get().scheduleNextMicroBreak();
          }
        }
        
        // 播放开始音效
        if (state.settings.soundEnabled) {
          soundService.play(state.currentState === 'focus' ? 'focusStart' : 'breakStart');
        }
      }),
      
      pauseTimer: () => set((state) => {
        state.isActive = false;
      }),
      
      resetTimer: () => set((state) => {
        state.isActive = false;
        state.currentState = 'focus';
        state.timeLeft = state.settings.focusDuration * 60;
        state.nextMicroBreakInterval = 0;
        state.lastMicroBreakTime = 0;
        state.focusStartTime = 0;
        soundService.stop('whiteNoise');
      }),
      
      // 状态转换
      transitionTo: (newState: TimerState) => set((state) => {
        const oldState = state.currentState;
        state.currentState = newState;
        
        // 更新时间
        switch (newState) {
          case 'focus':
            state.timeLeft = state.settings.focusDuration * 60;
            state.focusStartTime = Date.now();
            break;
          case 'break':
            state.timeLeft = state.settings.breakDuration * 60;
            break;
          case 'microBreak':
            const duration = cryptoService.generateMicroBreakDuration(
              state.settings.microBreakDuration,
              state.settings.microBreakDuration + 2
            );
            state.timeLeft = duration;
            break;
        }
        
        // 更新统计
        if (oldState !== newState) {
          get().updateTodayStats(oldState, 0); // 记录状态切换
        }
        
        // 播放音效和发送通知
        if (state.settings.soundEnabled) {
          const soundMap = {
            focus: 'focusStart',
            break: 'breakStart',
            microBreak: 'microBreak'
          } as const;
          soundService.play(soundMap[newState]);
        }
        
        if (state.settings.notificationEnabled) {
          const messages = {
            focus: '开始专注',
            break: '休息时间',
            microBreak: '微休息时间'
          };
          notificationService.sendNotification(
            messages[newState],
            `${Math.round(state.timeLeft / 60)} 分钟`
          );
        }
      }),
      
      // 设置更新
      updateSettings: (newSettings: Partial<TimerSettings>) => set((state) => {
        Object.assign(state.settings, newSettings);
        
        // 如果当前不活跃，更新时间
        if (!state.isActive && state.currentState === 'focus') {
          state.timeLeft = state.settings.focusDuration * 60;
        }
        
        // 保存到存储
        get().saveToStorage();
      }),
      
      updateTimeLeft: (time: number) => set((state) => {
        state.timeLeft = time;
      }),
      
      // 微休息管理
      scheduleNextMicroBreak: () => set((state) => {
        state.nextMicroBreakInterval = cryptoService.generateMicroBreakInterval(
          state.settings.microBreakMinInterval,
          state.settings.microBreakMaxInterval
        );
      }),
      
      triggerMicroBreak: () => {
        const state = get();
        state.transitionTo('microBreak');
        set((draft) => {
          draft.lastMicroBreakTime = Math.floor((Date.now() - draft.focusStartTime) / 1000);
          draft.todayStats.microBreaks += 1;
        });
        state.scheduleNextMicroBreak();
      },
      
      checkMicroBreakTrigger: () => {
        const state = get();
        if (!state.isActive || state.currentState !== 'focus') return false;
        
        const currentTime = Date.now();
        const focusElapsed = Math.floor((currentTime - state.focusStartTime) / 1000);
        
        return cryptoService.shouldTriggerMicroBreak(
          focusElapsed,
          state.lastMicroBreakTime,
          state.nextMicroBreakInterval
        );
      },
      
      // 统计管理
      updateTodayStats: (type: 'focus' | 'break' | 'microBreak', duration: number) => set((state) => {
        switch (type) {
          case 'focus':
            state.todayStats.focusTime += duration;
            break;
          case 'break':
            state.todayStats.breakTime += duration;
            break;
          case 'microBreak':
            state.todayStats.microBreaks += 1;
            break;
        }
        get().saveToStorage();
      }),
      
      updateEfficiency: (score: number) => set((state) => {
        state.todayStats.efficiency = score;
        get().saveToStorage();
      }),
      
      // 数据库操作
      initializeDatabase: async () => {
        try {
          await databaseService.initialize();
          console.log('Database initialized successfully');
        } catch (error) {
          console.error('Failed to initialize database:', error);
        }
      },

      saveCurrentSession: async () => {
        try {
          const state = get();
          const today = new Date().toISOString().split('T')[0];

          const sessionData = {
            date: today,
            focus_duration: state.currentSession.focusTime,
            break_duration: state.currentSession.breakTime,
            micro_breaks: state.currentSession.microBreaks,
            efficiency_score: state.todayStats.efficiency,
          };

          const sessionId = await databaseService.saveFocusSession(sessionData);

          set((draft) => {
            draft.currentSession.id = sessionId;
          });

          console.log('Session saved with ID:', sessionId);
        } catch (error) {
          console.error('Failed to save session:', error);
        }
      },

      loadRecentSessions: async (days = 7) => {
        try {
          set((draft) => {
            draft.isLoadingData = true;
          });

          const sessions = await databaseService.getRecentStats(days);

          set((draft) => {
            draft.recentSessions = sessions;
            draft.isLoadingData = false;
          });
        } catch (error) {
          console.error('Failed to load recent sessions:', error);
          set((draft) => {
            draft.isLoadingData = false;
          });
        }
      },

      updateSessionEfficiency: async (sessionId: number, efficiency: number) => {
        try {
          await databaseService.updateSessionEfficiency(sessionId, efficiency);

          set((draft) => {
            draft.todayStats.efficiency = efficiency;
          });
        } catch (error) {
          console.error('Failed to update session efficiency:', error);
        }
      },

      getDatabaseStats: async () => {
        try {
          return await databaseService.getDatabaseStats();
        } catch (error) {
          console.error('Failed to get database stats:', error);
          return null;
        }
      },

      // 持久化（现在主要用于设置）
      saveToStorage: async () => {
        try {
          const state = get();

          // 保存设置到数据库
          await databaseService.saveSetting('app_settings', JSON.stringify(state.settings));

          // 在浏览器环境中也保存一份（作为备份）
          if (typeof window !== 'undefined') {
            const dataToSave = {
              settings: state.settings,
              todayStats: state.todayStats,
              lastSaved: new Date().toISOString(),
            };
            localStorage.setItem('focusflow-store', JSON.stringify(dataToSave));
          }
        } catch (error) {
          console.error('Failed to save to storage:', error);
        }
      },
      
      loadFromStorage: async () => {
        try {
          // 首先尝试从数据库加载设置
          try {
            const settingsJson = await databaseService.getSetting('app_settings');
            if (settingsJson) {
              const settings = JSON.parse(settingsJson);
              set((state) => {
                Object.assign(state.settings, settings);
              });
            }
          } catch (dbError) {
            console.warn('Failed to load from database, falling back to localStorage:', dbError);
          }

          // 如果数据库加载失败，从 localStorage 加载（备用方案）
          if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('focusflow-store');
            if (saved) {
              const savedData = JSON.parse(saved);
              set((state) => {
                if (savedData.settings) {
                  Object.assign(state.settings, savedData.settings);
                }
                if (savedData.todayStats) {
                  Object.assign(state.todayStats, savedData.todayStats);
                }
              });
            }
          }

          // 加载今日统计数据
          const today = new Date().toISOString().split('T')[0];
          const todayStats = await databaseService.getDailyStats(today);
          if (todayStats) {
            set((state) => {
              state.todayStats.focusTime = todayStats.total_focus_time;
              state.todayStats.breakTime = todayStats.total_break_time;
              state.todayStats.microBreaks = todayStats.total_micro_breaks;
              state.todayStats.efficiency = todayStats.average_efficiency;
            });
          }
        } catch (error) {
          console.error('Failed to load from storage:', error);
        }
      },
    }))
  )
);

// 订阅状态变化进行自动保存
useTimerStore.subscribe(
  (state) => state.settings,
  () => {
    useTimerStore.getState().saveToStorage();
  }
);

// 应用启动时初始化数据库和加载数据
if (typeof window !== 'undefined') {
  const initializeApp = async () => {
    const store = useTimerStore.getState();
    try {
      await store.initializeDatabase();
      await store.loadFromStorage();
      await store.loadRecentSessions();
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  };

  initializeApp();
}
