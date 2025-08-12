/**
 * 增强的统一计时器Store
 * 使用领域模型和应用服务
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  TimerMode,
  TimerState,
  TimerSettings,
  ClassicTimerSettings,
  SmartTimerSettings,
  DEFAULT_UNIFIED_SETTINGS
} from '../types/unifiedTimer';
import { TimerApplicationService } from '../application/services/TimerApplicationService';
import { TimerSessionRepository } from '../infrastructure/repositories/TimerSessionRepository';
import { UUID } from '../domain/value-objects/UUID';
import { EfficiencyRating } from '../domain/value-objects/EfficiencyRating';
import { DateTime } from '../domain/value-objects/DateTime';
import { Duration } from '../domain/value-objects/Duration';
import { container } from '../container/IoCContainer';

// Store接口定义
interface EnhancedUnifiedTimerStore {
  // 基础状态
  currentState: TimerState;
  currentMode: TimerMode;
  timeLeft: number; // 剩余时间（秒）
  totalTime: number; // 总时间（秒）
  isActive: boolean;
  isInitialized: boolean;
  initializationError: string | null;

  // 会话信息
  currentSessionId: UUID | null;
  sessionStartTime: number; // 时间戳
  focusStartTime: number; // 时间戳

  // 微休息管理
  nextMicroBreakInterval: number; // 下次微休息间隔（秒）
  lastMicroBreakTime: number; // 上次微休息时间（时间戳）
  microBreakCount: number;

  // 智能模式特有状态
  continuousFocusTime: number; // 连续专注时间（秒）
  todayTotalFocusTime: number; // 今日总专注时间（秒）
  recentEfficiencyScores: number[];
  adaptiveAdjustments: {
    focusMultiplier: number;
    breakMultiplier: number;
    lastAdjustmentTime: number; // 时间戳
  };

  // 统计数据
  todayStats: {
    focusTime: number;
    breakTime: number;
    microBreaks: number;
    efficiency: number;
  };

  // 当前会话数据
  currentSession: {
    id: UUID | null;
    startTime: number;
    focusTime: number;
    breakTime: number;
    microBreaks: number;
  };

  // 效率评分相关
  showRatingDialog: boolean;
  pendingRatingSession: {
    duration: number;
    type: TimerState;
    sessionId?: UUID;
  } | null;

  // 设置相关
  settings: TimerSettings;
  showSettings: boolean;

  // 应用服务
  timerApplicationService: TimerApplicationService | null;

  // 基础控制方法
  start: () => Promise<void>;
  pause: () => void;
  reset: () => Promise<void>;

  // 模式控制
  switchMode: (mode: TimerMode, options?: any) => Promise<void>;

  // 状态控制
  skipToNext: () => Promise<void>;
  triggerMicroBreak: () => Promise<void>;

  // 设置控制
  updateSettings: (settings: Partial<TimerSettings>) => void;
  setShowSettings: (show: boolean) => void;

  // 内部方法
  updateTimeLeft: (timeLeft: number) => void;
  transitionTo: (state: TimerState) => Promise<void>;
  scheduleNextMicroBreak: () => void;
  checkMicroBreakTrigger: () => boolean;
  handleTimeUp: () => Promise<void>;
  showEfficiencyRating: (session: { duration: number; type: TimerState; sessionId?: UUID }) => void;

  // 效率评分
  submitEfficiencyRating: (score: number) => Promise<void>;
  hideEfficiencyRating: () => void;

  // 统计相关
  updateTodayStats: (type: 'focus' | 'break' | 'microBreak', duration: number) => void;

  // 初始化方法
  initialize: () => Promise<void>;
}

// 获取初始状态
const getInitialState = (settings: TimerSettings) => {
  const currentSettings = settings.mode === TimerMode.CLASSIC ? settings.classic : settings.smart;

  return {
    currentState: TimerState.FOCUS,
    currentMode: settings.mode,
    timeLeft: currentSettings.focusDuration.seconds,
    totalTime: currentSettings.focusDuration.seconds,
    isActive: false,
    isInitialized: false,
    initializationError: null,

    // 会话信息
    currentSessionId: null,
    sessionStartTime: 0,
    focusStartTime: 0,

    // 微休息管理
    nextMicroBreakInterval: 0,
    lastMicroBreakTime: 0,
    microBreakCount: 0,

    // 智能模式特有状态
    continuousFocusTime: 0,
    todayTotalFocusTime: 0,
    recentEfficiencyScores: [],
    adaptiveAdjustments: {
      focusMultiplier: 1.0,
      breakMultiplier: 1.0,
      lastAdjustmentTime: 0,
    },

    // 统计数据
    todayStats: {
      focusTime: 0,
      breakTime: 0,
      microBreaks: 0,
      efficiency: 0,
    },

    // 当前会话数据
    currentSession: {
      id: null,
      startTime: 0,
      focusTime: 0,
      breakTime: 0,
      microBreaks: 0,
    },

    // 效率评分相关
    showRatingDialog: false,
    pendingRatingSession: null,

    // 设置相关
    settings,
    showSettings: false,

    // 应用服务
    timerApplicationService: null,
  };
};

// 创建Store
export const useUnifiedTimerStoreEnhanced = create<EnhancedUnifiedTimerStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // 初始状态
      ...getInitialState(DEFAULT_UNIFIED_SETTINGS),

      // 初始化方法
      initialize: async () => {
        try {
          // 初始化存储库
          const timerSessionRepository = new TimerSessionRepository();
          await timerSessionRepository.initialize();

          // 创建应用服务
          const timerApplicationService = new TimerApplicationService(timerSessionRepository);

          // 更新状态
          set((state) => {
            state.timerApplicationService = timerApplicationService;
            state.isInitialized = true;
          });

          // 尝试恢复未完成的会话
          await timerApplicationService.resumeIncompleteSessions();

          // 获取当前会话
          const currentSession = timerApplicationService.getCurrentSession();
          if (currentSession) {
            // 恢复会话状态
            set((state) => {
              state.currentSessionId = currentSession.id || null;
              state.sessionStartTime = currentSession.startTime.timestamp;
              state.currentState = currentSession.currentState || TimerState.FOCUS;
              state.currentMode = currentSession.mode;

              // 计算剩余时间
              if (currentSession.isActive && currentSession.states.length > 0) {
                const currentState = currentSession.states[currentSession.states.length - 1];
                if (!currentState.completed) {
                  const elapsed = DateTime.now().subtract(currentState.startTime).seconds;
                  const remaining = Math.max(0, currentState.duration.seconds - elapsed);
                  state.timeLeft = remaining;
                  state.totalTime = currentState.duration.seconds;
                }
              }
            });
          }
        } catch (error) {
          console.error('Failed to initialize timer store:', error);
          set((state) => {
            state.initializationError = error instanceof Error ? error.message : 'Unknown error';
          });
        }
      },

      // 基础控制方法
      start: async () => {
        const state = get();
        if (state.isActive) return;

        if (!state.timerApplicationService) {
          console.error('Timer application service not initialized');
          return;
        }

        try {
          // 如果没有当前会话，开始新会话
          if (!state.currentSessionId) {
            const response = await state.timerApplicationService.startSession(
              state.currentMode,
              state.settings
            );

            if (response.success && response.session) {
              set((state) => {
                state.currentSessionId = response.session!.id || null;
                state.sessionStartTime = Date.now();
                state.focusStartTime = Date.now();
                state.isActive = true;
              });
            }
          } else {
            // 恢复现有会话
            set((state) => {
              state.isActive = true;
              if (state.currentState === TimerState.FOCUS && state.focusStartTime === 0) {
                state.focusStartTime = Date.now();
              }
            });
          }

          // 智能模式或经典模式的微休息调度
          if (state.nextMicroBreakInterval === 0) {
            get().scheduleNextMicroBreak();
          }
        } catch (error) {
          console.error('Failed to start timer:', error);
        }
      },

      pause: () => set((state) => {
        state.isActive = false;
      }),

      reset: async () => {
        const state = get();

        try {
          // 如果有活跃会话，结束它
          if (state.currentSessionId && state.timerApplicationService) {
            await state.timerApplicationService.endSession();
          }

          // 重置状态
          set((state) => {
            const newState = getInitialState(state.settings);
            Object.assign(state, newState);
            state.currentMode = state.settings.mode;
            state.timerApplicationService = get().timerApplicationService;
            state.isInitialized = true;
          });
        } catch (error) {
          console.error('Failed to reset timer:', error);
        }
      },

      // 模式控制
      switchMode: async (mode: TimerMode, options = {
        preserveCurrentTime: false,
        pauseBeforeSwitch: true,
        showConfirmDialog: false,
        resetOnSwitch: true
      }) => {
        const state = get();

        // 暂停当前计时器
        if (options.pauseBeforeSwitch && state.isActive) {
          state.pause();
        }

        // 保存当前模式的状态
        const currentTime = options.preserveCurrentTime ? state.timeLeft : 0;

        // 切换模式
        set((state) => {
          state.currentMode = mode;
          state.settings.mode = mode;

          // 重置或保留状态
          if (options.resetOnSwitch) {
            const newState = getInitialState(state.settings);
            Object.assign(state, newState);
            state.currentMode = mode;
            state.timerApplicationService = get().timerApplicationService;
            state.isInitialized = true;

            if (options.preserveCurrentTime && currentTime > 0) {
              state.timeLeft = currentTime;
            }
          } else {
            // 调整时间设置以匹配新模式
            const newSettings = mode === TimerMode.CLASSIC ? state.settings.classic : state.settings.smart;
            if (state.currentState === TimerState.FOCUS) {
              state.timeLeft = newSettings.focusDuration.seconds;
              state.totalTime = newSettings.focusDuration.seconds;
            } else if (state.currentState === TimerState.BREAK) {
              state.timeLeft = newSettings.breakDuration.seconds;
              state.totalTime = newSettings.breakDuration.seconds;
            }
          }
        });

        // 如果有活跃会话，需要结束当前会话并开始新会话
        if (state.currentSessionId && state.timerApplicationService) {
          try {
            await state.timerApplicationService.endSession();
            await state.timerApplicationService.startSession(mode, state.settings);
          } catch (error) {
            console.error('Failed to switch mode with active session:', error);
          }
        }
      },

      // 状态控制
      skipToNext: async () => {
        const state = get();
        const currentState = state.currentState;
        let nextState: TimerState;

        switch (currentState) {
          case TimerState.FOCUS:
            nextState = TimerState.BREAK;
            break;
          case TimerState.BREAK:
            nextState = TimerState.FOCUS;
            break;
          case TimerState.MICRO_BREAK:
            nextState = TimerState.FOCUS;
            break;
          default:
            nextState = TimerState.FOCUS;
        }

        await get().transitionTo(nextState);
      },

      triggerMicroBreak: async () => {
        await get().transitionTo(TimerState.MICRO_BREAK);

        // 发送通知
        const state = get();
        if (state.settings.common.notificationEnabled) {
          try {
            const environmentAdapter = container.resolve('environmentAdapter');
            await environmentAdapter.showNotification(
              '微休息时间',
              '短暂休息一下，保持专注力'
            );
          } catch (error) {
            console.error('Failed to show notification:', error);
          }
        }
      },

      // 设置控制
      updateSettings: (newSettings: Partial<TimerSettings>) => set((state) => {
        Object.assign(state.settings, newSettings);
      }),

      setShowSettings: (show: boolean) => set((state) => {
        state.showSettings = show;
      }),

      // 内部方法
      updateTimeLeft: (timeLeft: number) => set((state) => {
        state.timeLeft = timeLeft;
      }),

      transitionTo: async (newState: TimerState) => {
        const state = get();
        const oldState = state.currentState;

        if (oldState === newState) {
          return; // 已经是目标状态，无需转换
        }

        if (!state.timerApplicationService) {
          console.error('Timer application service not initialized');
          return;
        }

        try {
          // 使用应用服务转换状态
          await state.timerApplicationService.transitionToState(newState);

          // 更新本地状态
          set((state) => {
            state.currentState = newState;

            // 根据当前模式和新状态设置时间
            const currentSettings = state.currentMode === TimerMode.CLASSIC
              ? state.settings.classic
              : state.settings.smart;

            switch (newState) {
              case TimerState.FOCUS:
                state.timeLeft = currentSettings.focusDuration.seconds;
                state.totalTime = currentSettings.focusDuration.seconds;
                state.focusStartTime = Date.now();
                break;
              case TimerState.BREAK:
                state.timeLeft = currentSettings.breakDuration.seconds;
                state.totalTime = currentSettings.breakDuration.seconds;
                // 专注会话结束，可能触发效率评分
                if (oldState === TimerState.FOCUS) {
                  setTimeout(() => {
                    get().showEfficiencyRating({
                      duration: currentSettings.focusDuration.seconds,
                      type: TimerState.FOCUS,
                      sessionId: state.currentSessionId || undefined,
                    });
                  }, 1000);
                }
                break;
              case TimerState.MICRO_BREAK:
                {
                  // 设置微休息时长（根据模式确定）
                  let microBreakDuration;
                  if (state.currentMode === TimerMode.CLASSIC) {
                    microBreakDuration = (currentSettings as ClassicTimerSettings).microBreakDuration.seconds;
                  } else {
                    const smartSettings = currentSettings as SmartTimerSettings;
                    // 在最小和最大值之间随机选择
                    const min = smartSettings.microBreakMinDuration.seconds;
                    const max = smartSettings.microBreakMaxDuration.seconds;
                    microBreakDuration = Math.floor(Math.random() * (max - min + 1)) + min;
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
            if (state.settings.common.soundEnabled) {
              try {
                const soundService = container.resolve('soundService');
                soundService.playMapped(`${newState}Start`);
              } catch (error) {
                console.error('Failed to play sound:', error);
              }
            }
          });
        } catch (error) {
          console.error('Failed to transition state:', error);
        }
      },

      scheduleNextMicroBreak: () => set((state) => {
        const currentSettings = state.currentMode === TimerMode.CLASSIC
          ? state.settings.classic
          : state.settings.smart;

        // 生成随机间隔（秒）
        let minInterval, maxInterval;
        if (state.currentMode === TimerMode.CLASSIC) {
          const classicSettings = currentSettings as ClassicTimerSettings;
          minInterval = classicSettings.microBreakMinInterval.seconds;
          maxInterval = minInterval;
        } else {
          const smartSettings = currentSettings as SmartTimerSettings;
          minInterval = smartSettings.microBreakMinInterval.seconds;
          maxInterval = smartSettings.microBreakMaxInterval.seconds;
        }

        // 使用 Math.random 生成随机数
        state.nextMicroBreakInterval = Math.floor(Math.random() * (maxInterval - minInterval + 1)) + minInterval;
      }),

      checkMicroBreakTrigger: () => {
        const state = get();
        if (!state.isActive || state.currentState !== TimerState.FOCUS) return false;

        const now = Date.now();
        const elapsed = Math.floor((now - state.focusStartTime) / 1000);

        return elapsed >= state.nextMicroBreakInterval;
      },

      handleTimeUp: async () => {
        const state = get();
        switch (state.currentState) {
          case TimerState.FOCUS:
            await get().transitionTo(TimerState.BREAK);
            break;
          case TimerState.BREAK:
            await get().transitionTo(TimerState.FOCUS);
            break;
          case TimerState.MICRO_BREAK:
            await get().transitionTo(TimerState.FOCUS);
            break;
        }
      },

      showEfficiencyRating: (session) => set((state) => {
        state.showRatingDialog = true;
        state.pendingRatingSession = session;
      }),

      // 效率评分
      submitEfficiencyRating: async (score: number) => {
        const state = get();

        if (!state.timerApplicationService) {
          console.error('Timer application service not initialized');
          return;
        }

        try {
          // 创建效率评分对象
          const rating = new EfficiencyRating(score);

          // 使用应用服务设置效率评分
          await state.timerApplicationService.setCurrentSessionEfficiencyRating(rating);

          // 更新本地状态
          set((state) => {
            state.showRatingDialog = false;
            state.pendingRatingSession = null;
            state.recentEfficiencyScores.push(score);
            // 保持最近5个评分
            if (state.recentEfficiencyScores.length > 5) {
              state.recentEfficiencyScores.shift();
            }
          });
        } catch (error) {
          console.error('Failed to submit efficiency rating:', error);
        }
      },

      hideEfficiencyRating: () => set((state) => {
        state.showRatingDialog = false;
        state.pendingRatingSession = null;
      }),

      // 统计相关
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
    }))
  )
);
