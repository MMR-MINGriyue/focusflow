/**
 * 智能计时系统服务
 * 实现基于生理节律的90分钟专注+20分钟休息循环
 * 支持随机微休息和自适应时间调整
 */

import { cryptoService } from './crypto';
import { soundService } from './sound';
import { notificationService } from './notification';

export interface SmartTimerSettings {
  // 基础循环设置
  focusDuration: number; // 专注时长（分钟），默认90
  breakDuration: number; // 休息时长（分钟），默认20
  
  // 微休息设置
  enableMicroBreaks: boolean; // 是否启用微休息
  microBreakMinInterval: number; // 微休息最小间隔（分钟）
  microBreakMaxInterval: number; // 微休息最大间隔（分钟）
  microBreakMinDuration: number; // 微休息最小时长（分钟）
  microBreakMaxDuration: number; // 微休息最大时长（分钟）
  
  // 自适应设置
  enableAdaptiveAdjustment: boolean; // 是否启用自适应调整
  adaptiveFactorFocus: number; // 专注时间调整因子（0.8-1.2）
  adaptiveFactorBreak: number; // 休息时间调整因子（0.8-1.2）
  
  // 生理节律优化
  enableCircadianOptimization: boolean; // 是否启用生理节律优化
  peakFocusHours: number[]; // 专注高峰时段（24小时制）
  lowEnergyHours: number[]; // 低能量时段
  
  // 通知和音效
  soundEnabled: boolean;
  notificationEnabled: boolean;
  
  // 高级设置
  maxContinuousFocusTime: number; // 最大连续专注时间（分钟），默认120
  forcedBreakThreshold: number; // 强制休息阈值（分钟），默认150
}

export interface SmartTimerState {
  currentPhase: 'focus' | 'break' | 'microBreak' | 'forcedBreak';
  timeLeft: number; // 剩余时间（秒）
  totalTime: number; // 总时间（秒）
  isActive: boolean;
  
  // 会话信息
  sessionStartTime: number; // 会话开始时间
  continuousFocusTime: number; // 连续专注时间（分钟）
  todayTotalFocusTime: number; // 今日总专注时间（分钟）
  
  // 微休息管理
  nextMicroBreakInterval: number; // 下次微休息间隔（秒）
  lastMicroBreakTime: number; // 上次微休息时间（相对于会话开始）
  microBreakCount: number; // 今日微休息次数
  
  // 自适应数据
  recentEfficiencyScores: number[]; // 最近的效率评分
  adaptiveAdjustments: {
    focusMultiplier: number;
    breakMultiplier: number;
    lastAdjustmentTime: number;
  };
}

class SmartTimerService {
  private settings: SmartTimerSettings;
  private state: SmartTimerState;
  private intervalId: number | null = null;
  private microBreakCheckId: number | null = null;
  private listeners: ((state: SmartTimerState) => void)[] = [];

  constructor() {
    this.settings = this.getDefaultSettings();
    this.state = this.getInitialState();
    this.loadFromStorage();
  }

  private getDefaultSettings(): SmartTimerSettings {
    return {
      focusDuration: 90,
      breakDuration: 20,
      enableMicroBreaks: true,
      microBreakMinInterval: 10,
      microBreakMaxInterval: 30,
      microBreakMinDuration: 3,
      microBreakMaxDuration: 5,
      enableAdaptiveAdjustment: true,
      adaptiveFactorFocus: 1.0,
      adaptiveFactorBreak: 1.0,
      enableCircadianOptimization: true,
      peakFocusHours: [9, 10, 11, 14, 15, 16],
      lowEnergyHours: [13, 14, 22, 23, 0, 1],
      soundEnabled: true,
      notificationEnabled: true,
      maxContinuousFocusTime: 120,
      forcedBreakThreshold: 150,
    };
  }

  private getInitialState(): SmartTimerState {
    return {
      currentPhase: 'focus',
      timeLeft: 90 * 60, // 90分钟
      totalTime: 90 * 60,
      isActive: false,
      sessionStartTime: 0,
      continuousFocusTime: 0,
      todayTotalFocusTime: 0,
      nextMicroBreakInterval: 0,
      lastMicroBreakTime: 0,
      microBreakCount: 0,
      recentEfficiencyScores: [],
      adaptiveAdjustments: {
        focusMultiplier: 1.0,
        breakMultiplier: 1.0,
        lastAdjustmentTime: 0,
      },
    };
  }

  /**
   * 获取当前状态
   */
  getState(): SmartTimerState {
    return { ...this.state };
  }

  /**
   * 获取当前设置
   */
  getSettings(): SmartTimerSettings {
    return { ...this.settings };
  }

  /**
   * 更新设置
   */
  updateSettings(newSettings: Partial<SmartTimerSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * 开始计时器
   */
  start(): void {
    if (this.state.isActive) return;

    this.state.isActive = true;
    
    if (this.state.sessionStartTime === 0) {
      this.state.sessionStartTime = Date.now();
      if (this.settings.enableMicroBreaks && this.state.currentPhase === 'focus') {
        this.scheduleNextMicroBreak();
      }
    }

    this.startMainTimer();
    if (this.settings.enableMicroBreaks && this.state.currentPhase === 'focus') {
      this.startMicroBreakCheck();
    }

    this.playSound('start');
    this.sendNotification('计时器已开始', this.getPhaseDisplayName());
    this.notifyListeners();
  }

  /**
   * 暂停计时器
   */
  pause(): void {
    if (!this.state.isActive) return;

    this.state.isActive = false;
    this.stopAllTimers();
    this.notifyListeners();
  }

  /**
   * 重置计时器
   */
  reset(): void {
    this.stopAllTimers();
    this.state = this.getInitialState();
    this.applyCurrentPhaseTime();
    this.notifyListeners();
  }

  /**
   * 手动切换到下一阶段
   */
  skipToNext(): void {
    this.handlePhaseComplete();
  }

  /**
   * 添加状态监听器
   */
  addListener(listener: (state: SmartTimerState) => void): void {
    this.listeners.push(listener);
  }

  /**
   * 移除状态监听器
   */
  removeListener(listener: (state: SmartTimerState) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 获取今日统计
   */
  getTodayStats() {
    return {
      totalFocusTime: this.state.todayTotalFocusTime,
      microBreakCount: this.state.microBreakCount,
      continuousFocusTime: this.state.continuousFocusTime,
      efficiency: this.calculateCurrentEfficiency(),
    };
  }

  /**
   * 提交效率评分
   */
  submitEfficiencyScore(score: number): void {
    this.state.recentEfficiencyScores.push(score);
    
    // 只保留最近10次评分
    if (this.state.recentEfficiencyScores.length > 10) {
      this.state.recentEfficiencyScores.shift();
    }

    // 触发自适应调整
    if (this.settings.enableAdaptiveAdjustment) {
      this.performAdaptiveAdjustment();
    }

    this.saveToStorage();
  }

  /**
   * 主计时器逻辑
   */
  private startMainTimer(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = window.setInterval(() => {
      if (this.state.timeLeft > 0) {
        this.state.timeLeft--;
        this.notifyListeners();
      } else {
        this.handlePhaseComplete();
      }
    }, 1000);
  }

  /**
   * 微休息检查定时器
   */
  private startMicroBreakCheck(): void {
    if (this.microBreakCheckId) {
      clearInterval(this.microBreakCheckId);
    }

    this.microBreakCheckId = window.setInterval(() => {
      if (this.shouldTriggerMicroBreak()) {
        this.triggerMicroBreak();
      }
    }, 5000); // 每5秒检查一次
  }

  /**
   * 停止所有计时器
   */
  private stopAllTimers(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.microBreakCheckId) {
      clearInterval(this.microBreakCheckId);
      this.microBreakCheckId = null;
    }
  }

  /**
   * 处理阶段完成
   */
  private handlePhaseComplete(): void {
    const currentPhase = this.state.currentPhase;

    // 更新统计
    this.updateStats(currentPhase);

    // 确定下一阶段
    const nextPhase = this.determineNextPhase();

    // 切换到下一阶段
    this.transitionToPhase(nextPhase);
  }

  /**
   * 确定下一阶段
   */
  private determineNextPhase(): SmartTimerState['currentPhase'] {
    const { currentPhase, continuousFocusTime } = this.state;
    const { maxContinuousFocusTime, forcedBreakThreshold } = this.settings;

    // 检查是否需要强制休息
    if (continuousFocusTime >= forcedBreakThreshold) {
      return 'forcedBreak';
    }

    // 正常阶段转换
    switch (currentPhase) {
      case 'focus':
        return continuousFocusTime >= maxContinuousFocusTime ? 'forcedBreak' : 'break';
      case 'break':
      case 'forcedBreak':
        return 'focus';
      case 'microBreak':
        return 'focus';
      default:
        return 'focus';
    }
  }

  /**
   * 切换到指定阶段
   */
  private transitionToPhase(phase: SmartTimerState['currentPhase']): void {
    this.state.currentPhase = phase;
    this.applyCurrentPhaseTime();

    // 重置微休息相关状态
    if (phase === 'focus') {
      if (this.settings.enableMicroBreaks) {
        this.scheduleNextMicroBreak();
      }
    } else {
      // 非专注阶段，停止微休息检查
      if (this.microBreakCheckId) {
        clearInterval(this.microBreakCheckId);
        this.microBreakCheckId = null;
      }
    }

    this.playSound(phase);
    this.sendNotification('阶段切换', this.getPhaseDisplayName());
    this.notifyListeners();
  }

  /**
   * 应用当前阶段的时间
   */
  private applyCurrentPhaseTime(): void {
    const { currentPhase } = this.state;
    let duration: number;

    switch (currentPhase) {
      case 'focus':
        duration = this.getAdjustedFocusDuration();
        break;
      case 'break':
        duration = this.getAdjustedBreakDuration();
        break;
      case 'forcedBreak':
        duration = Math.max(this.getAdjustedBreakDuration(), 30); // 至少30分钟
        break;
      case 'microBreak':
        duration = cryptoService.generateMicroBreakDuration(
          this.settings.microBreakMinDuration,
          this.settings.microBreakMaxDuration
        ) / 60; // 转换为分钟
        break;
      default:
        duration = this.settings.focusDuration;
    }

    this.state.timeLeft = duration * 60; // 转换为秒
    this.state.totalTime = duration * 60;
  }

  /**
   * 获取调整后的专注时长
   */
  private getAdjustedFocusDuration(): number {
    let duration = this.settings.focusDuration;

    // 应用自适应调整
    if (this.settings.enableAdaptiveAdjustment) {
      duration *= this.state.adaptiveAdjustments.focusMultiplier;
    }

    // 应用生理节律优化
    if (this.settings.enableCircadianOptimization) {
      duration *= this.getCircadianMultiplier();
    }

    return Math.round(duration);
  }

  /**
   * 获取调整后的休息时长
   */
  private getAdjustedBreakDuration(): number {
    let duration = this.settings.breakDuration;

    // 应用自适应调整
    if (this.settings.enableAdaptiveAdjustment) {
      duration *= this.state.adaptiveAdjustments.breakMultiplier;
    }

    return Math.round(duration);
  }

  /**
   * 获取生理节律调整因子
   */
  private getCircadianMultiplier(): number {
    const currentHour = new Date().getHours();

    if (this.settings.peakFocusHours.includes(currentHour)) {
      return 1.1; // 高峰期延长10%
    } else if (this.settings.lowEnergyHours.includes(currentHour)) {
      return 0.9; // 低能量期缩短10%
    }

    return 1.0;
  }

  /**
   * 安排下次微休息
   */
  private scheduleNextMicroBreak(): void {
    this.state.nextMicroBreakInterval = cryptoService.generateMicroBreakInterval(
      this.settings.microBreakMinInterval,
      this.settings.microBreakMaxInterval
    );
  }

  /**
   * 检查是否应该触发微休息
   */
  private shouldTriggerMicroBreak(): boolean {
    if (!this.settings.enableMicroBreaks || this.state.currentPhase !== 'focus') {
      return false;
    }

    const currentTime = Date.now();
    const focusElapsed = Math.floor((currentTime - this.state.sessionStartTime) / 1000);

    return cryptoService.shouldTriggerMicroBreak(
      focusElapsed,
      this.state.lastMicroBreakTime,
      this.state.nextMicroBreakInterval
    );
  }

  /**
   * 触发微休息
   */
  private triggerMicroBreak(): void {
    // 保存当前专注状态
    const currentFocusTime = this.state.timeLeft;

    // 切换到微休息
    this.transitionToPhase('microBreak');

    // 更新微休息统计
    this.state.microBreakCount++;
    this.state.lastMicroBreakTime = Math.floor((Date.now() - this.state.sessionStartTime) / 1000);

    // 安排下次微休息
    this.scheduleNextMicroBreak();

    // 微休息结束后恢复专注时间
    setTimeout(() => {
      if (this.state.currentPhase === 'microBreak' && this.state.timeLeft === 0) {
        this.state.timeLeft = currentFocusTime;
        this.state.totalTime = currentFocusTime;
        this.transitionToPhase('focus');
      }
    }, this.state.totalTime * 1000);
  }

  /**
   * 更新统计数据
   */
  private updateStats(completedPhase: SmartTimerState['currentPhase']): void {
    const duration = Math.round(this.state.totalTime / 60); // 转换为分钟

    switch (completedPhase) {
      case 'focus':
        this.state.continuousFocusTime += duration;
        this.state.todayTotalFocusTime += duration;
        break;
      case 'break':
      case 'forcedBreak':
        this.state.continuousFocusTime = 0; // 重置连续专注时间
        break;
      case 'microBreak':
        // 微休息不重置连续专注时间
        break;
    }
  }

  /**
   * 执行自适应调整
   */
  private performAdaptiveAdjustment(): void {
    const scores = this.state.recentEfficiencyScores;
    if (scores.length < 3) return; // 需要至少3次评分

    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const now = Date.now();

    // 每天最多调整一次
    if (now - this.state.adaptiveAdjustments.lastAdjustmentTime < 24 * 60 * 60 * 1000) {
      return;
    }

    // 根据平均效率评分调整时间
    if (avgScore >= 4) {
      // 高效率，可以适当延长专注时间
      this.state.adaptiveAdjustments.focusMultiplier = Math.min(1.2, this.state.adaptiveAdjustments.focusMultiplier + 0.05);
      this.state.adaptiveAdjustments.breakMultiplier = Math.max(0.8, this.state.adaptiveAdjustments.breakMultiplier - 0.02);
    } else if (avgScore <= 2) {
      // 低效率，缩短专注时间，延长休息时间
      this.state.adaptiveAdjustments.focusMultiplier = Math.max(0.8, this.state.adaptiveAdjustments.focusMultiplier - 0.05);
      this.state.adaptiveAdjustments.breakMultiplier = Math.min(1.2, this.state.adaptiveAdjustments.breakMultiplier + 0.05);
    }

    this.state.adaptiveAdjustments.lastAdjustmentTime = now;
    this.saveToStorage();
  }

  /**
   * 计算当前效率
   */
  private calculateCurrentEfficiency(): number {
    const scores = this.state.recentEfficiencyScores;
    if (scores.length === 0) return 0;

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  /**
   * 获取阶段显示名称
   */
  private getPhaseDisplayName(): string {
    switch (this.state.currentPhase) {
      case 'focus':
        return '专注时间';
      case 'break':
        return '休息时间';
      case 'microBreak':
        return '微休息';
      case 'forcedBreak':
        return '强制休息';
      default:
        return '';
    }
  }

  /**
   * 播放音效
   */
  private playSound(type: string): void {
    if (!this.settings.soundEnabled) return;

    const soundMap: Record<string, string> = {
      start: 'focusStart',
      focus: 'focusStart',
      break: 'breakStart',
      microBreak: 'microBreak',
      forcedBreak: 'breakStart',
    };

    const soundKey = soundMap[type];
    if (soundKey) {
      soundService.playMapped(soundKey as any);
    }
  }

  /**
   * 发送通知
   */
  private sendNotification(title: string, body: string): void {
    if (!this.settings.notificationEnabled) return;

    notificationService.sendNotification(title, body);
  }

  /**
   * 通知监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getState());
      } catch (error) {
        console.error('Error in timer listener:', error);
      }
    });
  }

  /**
   * 保存到本地存储
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem('smartTimer_settings', JSON.stringify(this.settings));
      localStorage.setItem('smartTimer_state', JSON.stringify({
        ...this.state,
        // 不保存运行时状态
        isActive: false,
        timeLeft: this.state.totalTime,
      }));
    } catch (error) {
      console.error('Failed to save smart timer data:', error);
    }
  }

  /**
   * 从本地存储加载
   */
  private loadFromStorage(): void {
    try {
      const savedSettings = localStorage.getItem('smartTimer_settings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }

      const savedState = localStorage.getItem('smartTimer_state');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        // 只恢复部分状态，运行时状态重新初始化
        this.state = {
          ...this.state,
          todayTotalFocusTime: parsed.todayTotalFocusTime || 0,
          microBreakCount: parsed.microBreakCount || 0,
          recentEfficiencyScores: parsed.recentEfficiencyScores || [],
          adaptiveAdjustments: parsed.adaptiveAdjustments || this.state.adaptiveAdjustments,
        };
      }
    } catch (error) {
      console.error('Failed to load smart timer data:', error);
    }
  }
}

export const smartTimerService = new SmartTimerService();
