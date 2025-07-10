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
  DEFAULT_UNIFIED_SETTINGS
} from '../types/unifiedTimer';
import { soundService } from '../services/sound';
import { cryptoService } from '../services/crypto';

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
            const duration = state.currentMode === TimerMode.SMART
              ? cryptoService.generateMicroBreakDuration(
                  state.settings.smart.microBreakMinDuration,
                  state.settings.smart.microBreakMaxDuration
                )
              : state.settings.classic.microBreakDuration * 60;
            state.timeLeft = duration;
            state.totalTime = duration;
            break;
          case 'forcedBreak':
            // 只在智能模式下可用
            if (state.currentMode === TimerMode.SMART) {
              const breakDuration = Math.max(state.settings.smart.breakDuration, 30);
              state.timeLeft = breakDuration * 60;
              state.totalTime = breakDuration * 60;
            }
            break;
        }
        
        // 播放状态切换音效
        if (state.settings.soundEnabled) {
          soundService.playMapped('stateChange');
        }
      }),
      
      // 时间更新
      updateTimeLeft: (timeLeft: number) => set((state) => {
        state.timeLeft = Math.max(0, timeLeft);
        
        // 时间到了，处理状态转换
        if (state.timeLeft === 0) {
          get().handleTimeUp();
        }
      }),
      
      // 处理时间到
      handleTimeUp: () => {
        const state = get();
        
        switch (state.currentState) {
          case 'focus':
            // 智能模式可能需要检查强制休息
            if (state.currentMode === TimerMode.SMART) {
              const shouldForceBreak = state.continuousFocusTime >= state.settings.smart.forcedBreakThreshold;
              get().transitionTo(shouldForceBreak ? 'forcedBreak' : 'break');
            } else {
              get().transitionTo('break');
            }
            break;
          case 'break':
          case 'forcedBreak':
            get().transitionTo('focus');
            break;
          case 'microBreak':
            get().transitionTo('focus');
            break;
        }
      },
      
      // 跳转到下一阶段
      skipToNext: () => {
        get().handleTimeUp();
      },
      
      // 触发微休息
      triggerMicroBreak: () => set((state) => {
        if (state.currentState === 'focus') {
          get().transitionTo('microBreak');
          state.microBreakCount++;
          state.lastMicroBreakTime = Date.now() - state.focusStartTime;
          get().scheduleNextMicroBreak();
        }
      }),
      
      // 调度下次微休息
      scheduleNextMicroBreak: () => set((state) => {
        const settings = state.currentMode === TimerMode.CLASSIC 
          ? state.settings.classic 
          : state.settings.smart;
        
        const minInterval = settings.microBreakMinInterval * 60; // 转换为秒
        const maxInterval = settings.microBreakMaxInterval * 60;
        
        state.nextMicroBreakInterval = cryptoService.generateRandomInt(minInterval, maxInterval);
      }),
      
      // 检查是否应该触发微休息
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
      
      // 设置更新
      updateSettings: (newSettings: Partial<UnifiedTimerSettings>) => set((state) => {
        state.settings = { ...state.settings, ...newSettings };
        
        // 如果模式改变，需要重新初始化
        if (newSettings.mode && newSettings.mode !== state.currentMode) {
          get().switchMode(newSettings.mode);
        }
        
        get().saveToStorage();
      }),
      
      // 效率评分
      submitEfficiencyRating: (score: number) => set((state) => {
        if (state.pendingRatingSession) {
          // 更新效率评分
          state.recentEfficiencyScores.push(score);
          
          // 只保留最近10次评分
          if (state.recentEfficiencyScores.length > 10) {
            state.recentEfficiencyScores.shift();
          }
          
          // 智能模式的自适应调整
          if (state.currentMode === TimerMode.SMART && state.settings.smart.enableAdaptiveAdjustment) {
            // 这里可以添加自适应调整逻辑
            const avgScore = state.recentEfficiencyScores.reduce((a, b) => a + b, 0) / state.recentEfficiencyScores.length;
            if (avgScore < 3) {
              state.adaptiveAdjustments.focusMultiplier = Math.max(0.8, state.adaptiveAdjustments.focusMultiplier - 0.1);
            } else if (avgScore > 4) {
              state.adaptiveAdjustments.focusMultiplier = Math.min(1.2, state.adaptiveAdjustments.focusMultiplier + 0.1);
            }
          }
          
          state.showRatingDialog = false;
          state.pendingRatingSession = null;
        }
      }),
      
      hideEfficiencyRating: () => set((state) => {
        state.showRatingDialog = false;
        state.pendingRatingSession = null;
      }),
      
      showEfficiencyRating: (session: { duration: number; type: UnifiedTimerStateType; sessionId?: number }) => set((state) => {
        state.showRatingDialog = true;
        state.pendingRatingSession = session;
      }),
      
      // 数据持久化
      saveToStorage: async () => {
        try {
          const state = get();
          const dataToSave = {
            settings: state.settings,
            currentMode: state.currentMode,
            todayStats: state.todayStats,
            recentEfficiencyScores: state.recentEfficiencyScores,
            adaptiveAdjustments: state.adaptiveAdjustments,
          };
          localStorage.setItem('unified-timer-data', JSON.stringify(dataToSave));
        } catch (error) {
          console.error('Failed to save timer data:', error);
        }
      },
      
      loadFromStorage: async () => {
        try {
          const saved = localStorage.getItem('unified-timer-data');
          if (saved) {
            const data = JSON.parse(saved);
            set((state) => {
              if (data.settings) state.settings = { ...DEFAULT_UNIFIED_SETTINGS, ...data.settings };
              if (data.currentMode) state.currentMode = data.currentMode;
              if (data.todayStats) state.todayStats = data.todayStats;
              if (data.recentEfficiencyScores) state.recentEfficiencyScores = data.recentEfficiencyScores;
              if (data.adaptiveAdjustments) state.adaptiveAdjustments = data.adaptiveAdjustments;
            });
          }
        } catch (error) {
          console.error('Failed to load timer data:', error);
        }
      },
    }))
  )
);

// 初始化数据加载
useUnifiedTimerStore.getState().loadFromStorage();
