/**
 * 统一计时器Store
 * 整合经典模式和智能模式的状态管理
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  TimerMode,
  UnifiedTimerSettings,
  UnifiedTimerState as UnifiedState,
  UnifiedTimerStateType,
  UnifiedTimerControls,
  ModeSwitchOptions,
  DEFAULT_UNIFIED_SETTINGS,
  ClassicTimerSettings,
  SmartTimerSettings
} from '../types/unifiedTimer';
import { getSoundService } from '../services/sound';
import { getNotificationService } from '../services/notification';
import { getDatabaseService } from '../services/database';

// Store接口定义
interface UnifiedTimerStore extends UnifiedState, UnifiedTimerControls {
  // 数据持久化
  saveToStorage: () => Promise<void>;
  loadFromStorage: () => Promise<void>;

  // 内部方法
  updateTimeLeft: (timeLeft: number) => void;
  transitionTo: (state: UnifiedTimerStateType) => void;
  scheduleNextMicroBreak: () => void;
  checkMicroBreakTrigger: () => boolean;
  handleTimeUp: () => void;
  showEfficiencyRating: (session: { duration: number; type: UnifiedTimerStateType; sessionId?: number }) => void;

  // 设置管理
  settings: UnifiedTimerSettings;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  
  // 数据库相关
  initializeDatabase: () => Promise<void>;
  saveCurrentSession: () => Promise<void>;
  loadRecentSessions: (days?: number) => Promise<void>;
  updateSessionEfficiency: (sessionId: number, efficiency: number) => Promise<void>;
  getDatabaseStats: () => Promise<any>;
  
  // 统计相关
  updateTodayStats: (type: 'focus' | 'break' | 'microBreak', duration: number) => void;
}

// 获取初始状态
const getInitialState = (settings: UnifiedTimerSettings): Omit<UnifiedState, 'currentMode'> => {
  const currentSettings = settings.mode === TimerMode.CLASSIC ? settings.classic : settings.smart;
  
  return {
    currentState: 'focus',
    timeLeft: currentSettings.focusDuration * 60,
    totalTime: currentSettings.focusDuration * 60,
    isActive: false,
    sessionStartTime: 0,
    focusStartTime: 0,
    nextMicroBreakInterval: 0,
    lastMicroBreakTime: 0,
    microBreakCount: 0,
    continuousFocusTime: 0,
    todayTotalFocusTime: 0,
    recentEfficiencyScores: [],
    adaptiveAdjustments: {
      focusMultiplier: 1.0,
      breakMultiplier: 1.0,
      lastAdjustmentTime: 0,
    },
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
    showRatingDialog: false,
    pendingRatingSession: null,
    showSettings: false,
  };
};

// 创建Store
export const useUnifiedTimerStore = create<UnifiedTimerStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // 初始状态
      ...getInitialState(DEFAULT_UNIFIED_SETTINGS),
      currentMode: DEFAULT_UNIFIED_SETTINGS.mode,
      settings: DEFAULT_UNIFIED_SETTINGS,
      
      // 基础控制方法
      start: () => set((state) => {
        if (state.isActive) return;
        
        state.isActive = true;
        
        // 初始化会话时间
        if (state.sessionStartTime === 0) {
          state.sessionStartTime = Date.now();
        }
        
        if (state.currentState === 'focus' && state.focusStartTime === 0) {
          state.focusStartTime = Date.now();
          
          // 智能模式或经典模式的微休息调度
          if (state.nextMicroBreakInterval === 0) {
            get().scheduleNextMicroBreak();
          }
        }
        
        // 播放开始音效
        if (state.settings.soundEnabled) {
          const soundKey = state.currentState === 'focus' ? 'focusStart' : 'breakStart';
          const soundService = getSoundService();
          soundService.playMapped(soundKey);
        }
      }),
      
      pause: () => set((state) => {
        state.isActive = false;
      }),
      
      reset: () => set((state) => {
        const newState = getInitialState(state.settings);
        Object.assign(state, newState);
        state.currentMode = state.settings.mode;
      }),
      
      // 设置对话框控制
      setShowSettings: (show: boolean) => set((state) => {
        state.showSettings = show;
      }),
      
      // 模式切换
      switchMode: (mode: TimerMode, options: ModeSwitchOptions = {
        preserveCurrentTime: false,
        pauseBeforeSwitch: true,
        showConfirmDialog: false,
        resetOnSwitch: true
      }) => set((state) => {
        // 暂停当前计时器
        if (options.pauseBeforeSwitch && state.isActive) {
          state.isActive = false;
        }
        
        // 保存当前模式的状态
        const currentTime = options.preserveCurrentTime ? state.timeLeft : 0;
        
        // 切换模式
        state.currentMode = mode;
        state.settings.mode = mode;
        
        // 重置或保留状态
        if (options.resetOnSwitch) {
          const newState = getInitialState(state.settings);
          Object.assign(state, newState);
          state.currentMode = mode;
          
          if (options.preserveCurrentTime && currentTime > 0) {
            state.timeLeft = currentTime;
          }
        } else {
          // 调整时间设置以匹配新模式
          const newSettings = mode === TimerMode.CLASSIC ? state.settings.classic : state.settings.smart;
          if (state.currentState === 'focus') {
            state.timeLeft = newSettings.focusDuration * 60;
            state.totalTime = newSettings.focusDuration * 60;
          } else if (state.currentState === 'break') {
            state.timeLeft = newSettings.breakDuration * 60;
            state.totalTime = newSettings.breakDuration * 60;
          }
        }
        
        // 保存到存储
        get().saveToStorage();
      }),
      
      // 状态转换
      transitionTo: (newState: UnifiedTimerStateType) => set((state) => {
        const oldState = state.currentState;
        state.currentState = newState;
        
        // 根据当前模式和新状态设置时间
        const currentSettings = state.currentMode === TimerMode.CLASSIC 
          ? state.settings.classic 
          : state.settings.smart;
        
        switch (newState) {
          case 'focus':
            state.timeLeft = currentSettings.focusDuration * 60;
            state.totalTime = currentSettings.focusDuration * 60;
            state.focusStartTime = Date.now();
            break;
          case 'break':
            state.timeLeft = currentSettings.breakDuration * 60;
            state.totalTime = currentSettings.breakDuration * 60;
            // 专注会话结束，可能触发效率评分
            if (oldState === 'focus') {
              setTimeout(() => {
                get().showEfficiencyRating({
                  duration: currentSettings.focusDuration,
                  type: 'focus',
                  sessionId: state.currentSession.id || undefined,
                });
              }, 1000);
            }
            break;
          case 'microBreak':
            {
              // 设置微休息时长（根据模式确定）
              let microBreakDuration;
              if (state.currentMode === TimerMode.CLASSIC) {
                microBreakDuration = (currentSettings as ClassicTimerSettings).microBreakDuration * 60;
              } else {
                const smartSettings = currentSettings as SmartTimerSettings;
                microBreakDuration = Math.floor(
                  Math.random() * (
                    smartSettings.microBreakMaxDuration - smartSettings.microBreakMinDuration + 1
                  ) + smartSettings.microBreakMinDuration
                ) * 60;
              }
              
              state.timeLeft = microBreakDuration;
              state.totalTime = microBreakDuration;
              
              // 记录微休息开始时间
              state.lastMicroBreakTime = Date.now();
              state.microBreakCount += 1;
            }
            break;
        }
        
        // 播放状态转换音效
        if (state.settings.soundEnabled) {
          const soundService = getSoundService();
          soundService.playMapped(`${newState}Start`);
        }
      }),
      
      // 跳转到下一状态
      skipToNext: () => set((state) => {
        const currentSettings = state.currentMode === TimerMode.CLASSIC 
          ? state.settings.classic 
          : state.settings.smart;
        
        switch (state.currentState) {
          case 'focus':
            get().transitionTo('break');
            break;
          case 'break':
            get().transitionTo('focus');
            break;
          case 'microBreak':
            get().transitionTo('focus');
            break;
          default:
            // 默认回到专注状态
            state.currentState = 'focus';
            state.timeLeft = currentSettings.focusDuration * 60;
            state.totalTime = currentSettings.focusDuration * 60;
        }
        
        // 重置活动状态
        state.isActive = false;
      }),
      
      // 触发微休息
      triggerMicroBreak: () => set((state) => {
        // 切换到微休息状态
        get().transitionTo('microBreak');
        
        // 发送通知
        if (state.settings.notificationEnabled) {
          const notificationService = getNotificationService();
          notificationService.sendNotification(
            '微休息时间',
            '短暂休息一下，保持专注力'
          );
        }
      }),
      
      // 更新设置
      updateSettings: (newSettings: Partial<UnifiedTimerSettings>) => set((state) => {
        Object.assign(state.settings, newSettings);
      }),
      
      // 更新剩余时间
      updateTimeLeft: (timeLeft: number) => set((state) => {
        state.timeLeft = timeLeft;
      }),
      
      // 调度下次微休息
      scheduleNextMicroBreak: () => set((state) => {
        const currentSettings = state.currentMode === TimerMode.CLASSIC 
          ? state.settings.classic 
          : state.settings.smart;
        
        // 生成随机间隔（秒）
        let minInterval, maxInterval;
        if (state.currentMode === TimerMode.CLASSIC) {
          const classicSettings = currentSettings as ClassicTimerSettings;
          minInterval = classicSettings.microBreakMinInterval * 60;
          maxInterval = minInterval;
        } else {
          const smartSettings = currentSettings as SmartTimerSettings;
          minInterval = smartSettings.microBreakMinInterval * 60;
          maxInterval = smartSettings.microBreakMaxInterval * 60;
        }
        
        // 使用 Math.random 生成随机数
        state.nextMicroBreakInterval = Math.floor(Math.random() * (maxInterval - minInterval + 1)) + minInterval;
      }),
      
      // 检查是否触发微休息
      checkMicroBreakTrigger: () => {
        const state = get();
        if (!state.isActive || state.currentState !== 'focus') return false;
        
        const now = Date.now();
        const elapsed = Math.floor((now - state.focusStartTime) / 1000);
        
        return elapsed >= state.nextMicroBreakInterval;
      },
      
      // 处理时间结束
      handleTimeUp: () => set((state) => {
        switch (state.currentState) {
          case 'focus':
            get().transitionTo('break');
            break;
          case 'break':
            get().transitionTo('focus');
            break;
          case 'microBreak':
            get().transitionTo('focus');
            break;
        }
      }),
      
      // 显示效率评分
      showEfficiencyRating: (session) => set((state) => {
        state.showRatingDialog = true;
        state.pendingRatingSession = session;
      }),
      
      // 隐藏效率评分
      hideEfficiencyRating: () => set((state) => {
        state.showRatingDialog = false;
        state.pendingRatingSession = null;
      }),
      
      // 提交效率评分
      submitEfficiencyRating: (score: number) => set((state) => {
        state.showRatingDialog = false;
        state.pendingRatingSession = null;
        state.recentEfficiencyScores.push(score);
        // 保持最近5个评分
        if (state.recentEfficiencyScores.length > 5) {
          state.recentEfficiencyScores.shift();
        }
      }),
      
      // 更新今日统计数据
      updateTodayStats: (type: 'focus' | 'break' | 'microBreak', duration: number) => 
        set((state) => {
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
          
          // 更新效率评分
          const totalFocusTime = state.todayStats.focusTime;
          const totalBreakTime = state.todayStats.breakTime;
          if (totalFocusTime > 0) {
            state.todayStats.efficiency = Math.round(
              (totalFocusTime / (totalFocusTime + totalBreakTime)) * 100
            );
          }
        }),
      
      // 数据库相关方法
      initializeDatabase: async () => {
        const dbService = getDatabaseService();
        await dbService.initialize();
      },
      
      saveCurrentSession: async () => {
        // 实现保存当前会话的逻辑
        console.log('Saving current session...');
      },
      
      loadRecentSessions: async (days?: number) => {
        // 实现加载最近会话的逻辑
        console.log(`Loading sessions for last ${days || 7} days...`);
      },
      
      updateSessionEfficiency: async (sessionId: number, efficiency: number) => {
        // 实现更新会话效率的逻辑
        console.log(`Updating session ${sessionId} efficiency to ${efficiency}`);
      },
      
      getDatabaseStats: async () => {
        // 实现获取数据库统计的逻辑
        console.log('Getting database stats...');
        return {};
      },
      
      // 数据持久化方法
      saveToStorage: async () => {
        try {
          // 保存设置到localStorage
          const { settings, currentMode, todayStats } = get();
          const dataToSave = {
            settings,
            currentMode,
            todayStats,
            savedAt: Date.now()
          };
          localStorage.setItem('focusflow-timer-data', JSON.stringify(dataToSave));
          console.log('Settings saved to storage');
        } catch (error) {
          console.error('Failed to save settings to storage:', error);
        }
      },
      
      loadFromStorage: async () => {
        try {
          // 从localStorage加载设置
          const savedData = localStorage.getItem('focusflow-timer-data');
          if (savedData) {
            const parsedData = JSON.parse(savedData);

            // 验证数据是否过期（超过7天）
            const isDataExpired = parsedData.savedAt && 
              (Date.now() - parsedData.savedAt) > 7 * 24 * 60 * 60 * 1000;

            if (!isDataExpired) {
              // 应用加载的设置
              set((state) => {
                state.settings = { ...state.settings, ...parsedData.settings };
                state.currentMode = parsedData.currentMode || state.currentMode;
                state.todayStats = { ...state.todayStats, ...parsedData.todayStats };
              });
              console.log('Settings loaded from storage');
            } else {
              console.log('Saved data is expired, using defaults');
            }
          }

          // 初始化数据库
          await get().initializeDatabase();

          // 加载今日统计数据
          const today = new Date().toISOString().split('T')[0];
          const dbService = getDatabaseService();
          const todayStats = await dbService.getDailyStats(today);

          if (todayStats) {
            set((state) => {
              state.todayStats.focusTime = todayStats.total_focus_time;
              state.todayStats.breakTime = todayStats.total_break_time;
              state.todayStats.microBreaks = todayStats.total_micro_breaks;
              state.todayStats.efficiency = todayStats.average_efficiency;
            });
          }
        } catch (error) {
          console.error('Failed to load settings from storage:', error);
        }
      },
    }))
  )
);