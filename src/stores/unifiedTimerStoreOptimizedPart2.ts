import { UnifiedTimerStore, useUnifiedTimerStoreOptimized } from './unifiedTimerStoreOptimized';
import { getDatabaseService } from '../services/databaseService';

/**
 * 优化版统一计时器Store - 第二部分
 * 包含剩余的方法实现和选择器
 */

// 扩展Store类
Object.assign(useUnifiedTimerStoreOptimized, {
  // 选择器：获取计时器状态
  selectTimerState: () => useUnifiedTimerStoreOptimized.getState(),

  // 选择器：获取当前状态和时间
  selectCurrentStateAndTime: () => {
    const state = useUnifiedTimerStoreOptimized.getState();
    return {
      currentState: state.currentState,
      timeLeft: state.timeLeft,
      isActive: state.isActive
    };
  },

  // 选择器：获取设置
  selectSettings: () => useUnifiedTimerStoreOptimized.getState().settings,

  // 选择器：获取今日统计
  selectTodayStats: () => useUnifiedTimerStoreOptimized.getState().todayStats,

  // 选择器：获取效率评分相关状态
  selectEfficiencyRatingState: () => {
    const state = useUnifiedTimerStoreOptimized.getState();
    return {
      showRatingDialog: state.showRatingDialog,
      pendingRatingSession: state.pendingRatingSession,
      recentEfficiencyScores: state.recentEfficiencyScores
    };
  },

  // 选择器：获取微休息相关状态
  selectMicroBreakState: () => {
    const state = useUnifiedTimerStoreOptimized.getState();
    return {
      nextMicroBreakInterval: state.nextMicroBreakInterval,
      lastMicroBreakTime: state.lastMicroBreakTime,
      microBreakCount: state.microBreakCount
    };
  },

  // 选择器：获取当前会话信息
  selectCurrentSession: () => useUnifiedTimerStoreOptimized.getState().currentSession,

  // 选择器：获取自适应调整状态
  selectAdaptiveAdjustments: () => useUnifiedTimerStoreOptimized.getState().adaptiveAdjustments,

  // 选择器：获取当前模式
  selectCurrentMode: () => useUnifiedTimerStoreOptimized.getState().currentMode,

  // 选择器：检查是否应该触发微休息
  selectShouldTriggerMicroBreak: () => {
    const state = useUnifiedTimerStoreOptimized.getState();
    if (!state.isActive || state.currentState !== 'focus') return false;

    const now = Date.now();
    const elapsed = Math.floor((now - state.focusStartTime) / 1000);

    return elapsed >= state.nextMicroBreakInterval;
  },

  // 选择器：计算进度百分比
  selectProgress: () => {
    const state = useUnifiedTimerStoreOptimized.getState();
    const currentSettings = state.currentMode === 'classic' ? state.settings.classic : state.settings.smart;
    let totalTime = 0;

    switch (state.currentState) {
      case 'focus':
        totalTime = currentSettings.focusDuration * 60;
        break;
      case 'break':
        totalTime = currentSettings.breakDuration * 60;
        break;
      case 'microBreak':
        // 根据模式确定微休息时长
        if (state.settings.mode === 'classic') {
          totalTime = state.settings.classic.microBreakDuration * 60;
        } else {
          // 智能模式使用平均微休息时长
          const minDuration = state.settings.smart.microBreakMinDuration;
          const maxDuration = state.settings.smart.microBreakMaxDuration;
          totalTime = ((minDuration + maxDuration) / 2) * 60;
        }
        break;
    }

    return totalTime > 0 ? ((totalTime - state.timeLeft) / totalTime) * 100 : 0;
  },

  // 选择器：格式化时间显示
  selectFormattedTime: () => {
    const state = useUnifiedTimerStoreOptimized.getState();
    const timeLeft = state.timeLeft;
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  // 选择器：获取状态显示文本
  selectStateText: () => {
    const state = useUnifiedTimerStoreOptimized.getState();
    switch (state.currentState) {
      case 'focus':
        return '专注中';
      case 'break':
        return '休息中';
      case 'microBreak':
        return '微休息';
      default:
        return '';
    }
  },

  // 选择器：获取计时器完整显示状态
  selectTimerDisplayState: () => {
    const state = useUnifiedTimerStoreOptimized.getState();
    const timeLeft = state.timeLeft;
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    let stateText = '';
    switch (state.currentState) {
      case 'focus':
        stateText = '专注中';
        break;
      case 'break':
        stateText = '休息中';
        break;
      case 'microBreak':
        stateText = '微休息';
        break;
    }

    // 计算进度百分比
    const currentSettings = state.currentMode === 'classic' ? state.settings.classic : state.settings.smart;
    let totalTime = 0;

    switch (state.currentState) {
      case 'focus':
        totalTime = currentSettings.focusDuration * 60;
        break;
      case 'break':
        totalTime = currentSettings.breakDuration * 60;
        break;
      case 'microBreak':
        // 根据模式确定微休息时长
        if (state.settings.mode === 'classic') {
          totalTime = state.settings.classic.microBreakDuration * 60;
        } else {
          // 智能模式使用平均微休息时长
          const minDuration = state.settings.smart.microBreakMinDuration;
          const maxDuration = state.settings.smart.microBreakMaxDuration;
          totalTime = ((minDuration + maxDuration) / 2) * 60;
        }
        break;
    }

    const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

    return {
      formattedTime,
      stateText,
      progress,
      currentState: state.currentState,
      isActive: state.isActive
    };
  }
});

// 扩展Store原型方法
Object.assign(UnifiedTimerStore.prototype, {
  // 数据库相关方法
  initializeDatabase(this: UnifiedTimerStore) {
    const dbService = getDatabaseService();
    return dbService.initialize();
  },

  saveCurrentSession(this: UnifiedTimerStore) {
    // 实现保存当前会话的逻辑
    console.log('Saving current session...');
    return Promise.resolve();
  },

  loadRecentSessions(this: UnifiedTimerStore, days?: number) {
    // 实现加载最近会话的逻辑
    console.log(`Loading sessions for last ${days || 7} days...`);
    return Promise.resolve();
  },

  updateSessionEfficiency(this: UnifiedTimerStore, sessionId: number, efficiency: number) {
    // 实现更新会话效率的逻辑
    console.log(`Updating session ${sessionId} efficiency to ${efficiency}`);
    return Promise.resolve();
  },

  getDatabaseStats(this: UnifiedTimerStore) {
    // 实现获取数据库统计的逻辑
    console.log('Getting database stats...');
    return Promise.resolve({});
  },

  // 数据持久化方法
  saveToStorage(this: UnifiedTimerStore) {
    // 实现保存到存储的逻辑
    console.log('Saving to storage...');
    return Promise.resolve();
  },

  loadFromStorage(this: UnifiedTimerStore) {
    // 实现从存储加载的逻辑
    console.log('Loading from storage...');
    return Promise.resolve();
  }
});

// 导出使用选择器的Hook
export const useTimerState = () => useUnifiedTimerStoreOptimized(useUnifiedTimerStoreOptimized.selectTimerState);
export const useCurrentStateAndTime = () => useUnifiedTimerStoreOptimized(useUnifiedTimerStoreOptimized.selectCurrentStateAndTime);
export const useSettings = () => useUnifiedTimerStoreOptimized(useUnifiedTimerStoreOptimized.selectSettings);
export const useTodayStats = () => useUnifiedTimerStoreOptimized(useUnifiedTimerStoreOptimized.selectTodayStats);
export const useEfficiencyRatingState = () => useUnifiedTimerStoreOptimized(useUnifiedTimerStoreOptimized.selectEfficiencyRatingState);
export const useMicroBreakState = () => useUnifiedTimerStoreOptimized(useUnifiedTimerStoreOptimized.selectMicroBreakState);
export const useCurrentSession = () => useUnifiedTimerStoreOptimized(useUnifiedTimerStoreOptimized.selectCurrentSession);
export const useAdaptiveAdjustments = () => useUnifiedTimerStoreOptimized(useUnifiedTimerStoreOptimized.selectAdaptiveAdjustments);
export const useCurrentMode = () => useUnifiedTimerStoreOptimized(useUnifiedTimerStoreOptimized.selectCurrentMode);
export const useShouldTriggerMicroBreak = () => useUnifiedTimerStoreOptimized(useUnifiedTimerStoreOptimized.selectShouldTriggerMicroBreak);
export const useProgress = () => useUnifiedTimerStoreOptimized(useUnifiedTimerStoreOptimized.selectProgress);
export const useFormattedTime = () => useUnifiedTimerStoreOptimized(useUnifiedTimerStoreOptimized.selectFormattedTime);
export const useStateText = () => useUnifiedTimerStoreOptimized(useUnifiedTimerStoreOptimized.selectStateText);
export const useTimerDisplayState = () => useUnifiedTimerStoreOptimized(useUnifiedTimerStoreOptimized.selectTimerDisplayState);
