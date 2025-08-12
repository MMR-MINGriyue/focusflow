/**
 * 计时器设置值对象
 * 表示计时器的配置参数
 */

import { TimerMode } from './TimerState';
import { Duration } from './Duration';

/**
 * 经典模式设置
 */
export interface ClassicTimerSettings {
  focusDuration: Duration; // 专注时长
  breakDuration: Duration; // 休息时长
  microBreakMinInterval: Duration; // 微休息最小间隔
  microBreakMaxInterval: Duration; // 微休息最大间隔
  microBreakDuration: Duration; // 微休息时长
}

/**
 * 智能模式设置
 */
export interface SmartTimerSettings {
  // 基础循环设置
  focusDuration: Duration; // 专注时长
  breakDuration: Duration; // 休息时长

  // 微休息设置
  enableMicroBreaks: boolean; // 是否启用微休息
  microBreakMinInterval: Duration; // 微休息最小间隔
  microBreakMaxInterval: Duration; // 微休息最大间隔
  microBreakMinDuration: Duration; // 微休息最小时长
  microBreakMaxDuration: Duration; // 微休息最大时长

  // 自适应设置
  enableAdaptiveAdjustment: boolean; // 是否启用自适应调整
  adaptiveFactorFocus: number; // 专注时间调整因子（0.8-1.2）
  adaptiveFactorBreak: number; // 休息时间调整因子（0.8-1.2）

  // 生理节律优化
  enableCircadianOptimization: boolean; // 是否启用生理节律优化
  peakFocusHours: number[]; // 专注高峰时段（24小时制）
  lowEnergyHours: number[]; // 低能量时段

  // 高级设置
  maxContinuousFocusTime: Duration; // 最大连续专注时间
  forcedBreakThreshold: Duration; // 强制休息阈值
}

/**
 * 通用设置
 */
export interface CommonTimerSettings {
  soundEnabled: boolean;
  notificationEnabled: boolean;
  volume: number;
  showModeSelector: boolean;
  allowModeSwitch: boolean;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
}

/**
 * 统一的计时器设置
 */
export class TimerSettings {
  private readonly _mode: TimerMode;
  private readonly _classic: ClassicTimerSettings;
  private readonly _smart: SmartTimerSettings;
  private readonly _common: CommonTimerSettings;

  constructor(
    mode: TimerMode,
    classic: ClassicTimerSettings,
    smart: SmartTimerSettings,
    common: CommonTimerSettings
  ) {
    this._mode = mode;
    this._classic = classic;
    this._smart = smart;
    this._common = common;
  }

  get mode(): TimerMode {
    return this._mode;
  }

  get classic(): ClassicTimerSettings {
    return this._classic;
  }

  get smart(): SmartTimerSettings {
    return this._smart;
  }

  get common(): CommonTimerSettings {
    return this._common;
  }

  /**
   * 获取当前模式的设置
   */
  getCurrentModeSettings(): ClassicTimerSettings | SmartTimerSettings {
    return this._mode === TimerMode.CLASSIC ? this._classic : this._smart;
  }

  /**
   * 切换模式
   */
  switchMode(mode: TimerMode): TimerSettings {
    return new TimerSettings(
      mode,
      this._classic,
      this._smart,
      this._common
    );
  }

  /**
   * 更新经典模式设置
   */
  updateClassicSettings(settings: Partial<ClassicTimerSettings>): TimerSettings {
    return new TimerSettings(
      this._mode,
      { ...this._classic, ...settings },
      this._smart,
      this._common
    );
  }

  /**
   * 更新智能模式设置
   */
  updateSmartSettings(settings: Partial<SmartTimerSettings>): TimerSettings {
    return new TimerSettings(
      this._mode,
      this._classic,
      { ...this._smart, ...settings },
      this._common
    );
  }

  /**
   * 更新通用设置
   */
  updateCommonSettings(settings: Partial<CommonTimerSettings>): TimerSettings {
    return new TimerSettings(
      this._mode,
      this._classic,
      this._smart,
      { ...this._common, ...settings }
    );
  }

  /**
   * 创建默认的经典模式设置
   */
  static createDefaultClassicSettings(): ClassicTimerSettings {
    return {
      focusDuration: Duration.fromMinutes(25),
      breakDuration: Duration.fromMinutes(5),
      microBreakMinInterval: Duration.fromMinutes(10),
      microBreakMaxInterval: Duration.fromMinutes(30),
      microBreakDuration: Duration.fromMinutes(3)
    };
  }

  /**
   * 创建默认的智能模式设置
   */
  static createDefaultSmartSettings(): SmartTimerSettings {
    return {
      focusDuration: Duration.fromMinutes(90),
      breakDuration: Duration.fromMinutes(20),
      enableMicroBreaks: true,
      microBreakMinInterval: Duration.fromMinutes(10),
      microBreakMaxInterval: Duration.fromMinutes(30),
      microBreakMinDuration: Duration.fromMinutes(3),
      microBreakMaxDuration: Duration.fromMinutes(5),
      enableAdaptiveAdjustment: true,
      adaptiveFactorFocus: 1.0,
      adaptiveFactorBreak: 1.0,
      enableCircadianOptimization: true,
      peakFocusHours: [9, 10, 11, 14, 15, 16],
      lowEnergyHours: [13, 14, 22, 23, 0, 1],
      maxContinuousFocusTime: Duration.fromMinutes(120),
      forcedBreakThreshold: Duration.fromMinutes(150)
    };
  }

  /**
   * 创建默认的通用设置
   */
  static createDefaultCommonSettings(): CommonTimerSettings {
    return {
      soundEnabled: true,
      notificationEnabled: true,
      volume: 0.7,
      showModeSelector: true,
      allowModeSwitch: true,
      autoStartBreaks: false,
      autoStartFocus: false
    };
  }

  /**
   * 创建默认的计时器设置
   */
  static createDefault(mode: TimerMode = TimerMode.CLASSIC): TimerSettings {
    return new TimerSettings(
      mode,
      TimerSettings.createDefaultClassicSettings(),
      TimerSettings.createDefaultSmartSettings(),
      TimerSettings.createDefaultCommonSettings()
    );
  }
}
